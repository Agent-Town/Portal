const { test, expect } = require('@playwright/test');
const crypto = require('crypto');
const { installMockSolanaWallet } = require('./helpers/phase1');
const { reachCreateViaLite, fetchSessionState, isExternalRequest } = require('./helpers/phase2');
const { makeCeremonyRevealPair } = require('./helpers/ceremony_crypto');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('happy-path vendor flow avoids outbound non-local network requests', async ({ page }) => {
  await installMockSolanaWallet(page);

  const external = [];
  page.on('request', (req) => {
    if (isExternalRequest(req.url())) external.push(req.url());
  });

  await reachCreateViaLite(page);
  await page.getByTestId('px-0-0').click();
  await page.getByTestId('share-btn').click();
  await page.waitForURL(/\/house\?house=/, { timeout: 20000 });

  const connectWalletBtn = page.getByRole('button', { name: /Connect wallet|Disconnect wallet/ });
  const walletLabel = (await connectWalletBtn.textContent()) || '';
  if (walletLabel.includes('Connect')) {
    await connectWalletBtn.click();
  }
  await page.getByRole('button', { name: 'Sign to unlock' }).click();
  await expect(page.getByRole('button', { name: 'Unlocked' })).toBeVisible();

  expect(external).toEqual([]);
});

test('runtime bootstrap failures are surfaced in UI while server runtime state stays neutral', async ({ page }) => {
  await page.route('**/openclaw-lite/**', async (route) => {
    await route.abort();
  });

  await page.goto('/');
  await page.getByTestId('auth-signin').click();
  await expect(page.getByTestId('hatch-panel')).toBeVisible({ timeout: 1000 });

  await expect(page.getByTestId('hatch-status')).toContainText(/runtime failed|failed/i, { timeout: 3000 });

  const state = await fetchSessionState(page);
  expect(state.lite).toBeTruthy();
  expect(state.lite.runtimeReady).toBe(false);
  expect(state.lite.lastError ?? null).toBeNull();
});

test('server rejects plaintext ceremony reveals with INVALID_REVEAL_ENVELOPE', async ({ request }) => {
  const stateResp = await request.get('/api/state');
  expect(stateResp.ok()).toBeTruthy();
  const state = await stateResp.json();
  const teamCode = state.teamCode;
  expect(teamCode).toMatch(/^TEAM-/);

  const connectResp = await request.post('/api/agent/connect', {
    data: { teamCode, agentName: 'Phase2Boundary' }
  });
  expect(connectResp.ok()).toBeTruthy();

  const rh = crypto.randomBytes(32);
  const ra = crypto.randomBytes(32);
  const humanPair = makeCeremonyRevealPair();
  const agentPair = makeCeremonyRevealPair();

  const humanCommit = crypto.createHash('sha256').update(rh).digest('base64');
  const agentCommit = crypto.createHash('sha256').update(ra).digest('base64');

  const humanCommitResp = await request.post('/api/human/house/commit', {
    data: { commit: humanCommit, revealPub: humanPair.publicKeyB64 }
  });
  expect(humanCommitResp.ok()).toBeTruthy();

  const agentCommitResp = await request.post('/api/agent/house/commit', {
    data: { teamCode, commit: agentCommit, revealPub: agentPair.publicKeyB64 }
  });
  expect(agentCommitResp.ok()).toBeTruthy();

  const badHumanReveal = await request.post('/api/human/house/reveal', {
    data: { sealedForAgent: rh.toString('base64') }
  });
  expect(badHumanReveal.status()).toBe(400);
  const badHuman = await badHumanReveal.json();
  expect(badHuman.error).toBe('INVALID_REVEAL_ENVELOPE');

  const badAgentReveal = await request.post('/api/agent/house/reveal', {
    data: { teamCode, sealedForHuman: ra.toString('base64') }
  });
  expect(badAgentReveal.status()).toBe(400);
  const badAgent = await badAgentReveal.json();
  expect(badAgent.error).toBe('INVALID_REVEAL_ENVELOPE');
});
