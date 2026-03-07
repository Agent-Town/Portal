const { test, expect } = require('@playwright/test');
const { installMockSolanaWallet, houseAuthHeadersFromKeyB64 } = require('./helpers/phase1');
const { reachCreateViaLite, attachPathRecorder } = require('./helpers/phase2');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('vendor runtime performs ceremony commit/reveal and house meta remains house-auth protected', async ({ page, request }) => {
  await installMockSolanaWallet(page);
  await reachCreateViaLite(page);

  const ceremonyCalls = attachPathRecorder(page, ['/api/agent/house/commit', '/api/agent/house/reveal']);

  await page.getByTestId('px-0-0').click();
  await page.getByTestId('share-btn').click();
  await page.waitForURL(/\/house\?house=/, { timeout: 20000 });

  const commitCalls = ceremonyCalls.filter((c) => c.pathname === '/api/agent/house/commit');
  const revealCalls = ceremonyCalls.filter((c) => c.pathname === '/api/agent/house/reveal');
  expect(commitCalls.length).toBeGreaterThan(0);
  expect(revealCalls.length).toBeGreaterThan(0);

  const revealBodies = revealCalls
    .map((call) => {
      try {
        return JSON.parse(call.postData || '{}');
      } catch {
        return null;
      }
    })
    .filter(Boolean);
  expect(revealBodies.some((b) => b.sealedForHuman && typeof b.sealedForHuman === 'object')).toBe(true);
  expect(
    revealBodies.some((b) => (b.sealedForHuman?.alg || '').includes('CEREMONY_E2EE_P256_AESGCM_V1'))
  ).toBe(true);

  const connectWalletBtn = page.getByRole('button', { name: /Connect wallet|Disconnect wallet/ });
  const walletLabel = (await connectWalletBtn.textContent()) || '';
  if (walletLabel.includes('Connect')) {
    await connectWalletBtn.click();
  }
  await page.getByRole('button', { name: 'Sign to unlock' }).click();
  await expect(page.getByRole('button', { name: 'Unlocked' })).toBeVisible();

  const houseId = new URL(page.url()).searchParams.get('house');
  expect(houseId).toBeTruthy();

  const keyB64 = await page.evaluate((id) => {
    const store = window.__agentTownHouseAuthMemory || {};
    const value = store[`agentTownHouseAuth:${id}`];
    return typeof value === 'string' ? value : null;
  }, houseId);
  expect(keyB64).toBeTruthy();

  const metaPath = `/api/house/${houseId}/meta`;
  const headers = houseAuthHeadersFromKeyB64(houseId, 'GET', metaPath, '', keyB64);
  const metaResp = await request.get(metaPath, { headers });
  expect(metaResp.ok()).toBeTruthy();
  const meta = await metaResp.json();
  expect(meta.housePubKey).toBe(houseId);
});
