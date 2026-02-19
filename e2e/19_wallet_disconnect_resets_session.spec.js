const { test, expect } = require('@playwright/test');
const { installMockSolanaWallet } = require('./helpers/phase1');
const { reachCreateViaLite } = require('./helpers/phase2');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('disconnecting wallet after unlocking resets to a fresh session (shared device)', async ({ page }) => {
  await page.addInitScript(() => {
    const sig = new Uint8Array(64);
    for (let i = 0; i < sig.length; i++) sig[i] = (i * 11) & 0xff;
    const address = 'So1anaMockToken1111111111111111111111111111';
    window.__PRIVY_WALLET_BRIDGE__ = {
      connectSolana: async () => ({ address }),
      disconnectSolana: async () => {},
      signSolanaMessage: async () => ({ signature: sig, publicKey: { toString: () => address } })
    };
  });
  await page.goto('/');

  const before = await page.evaluate(async () => {
    const resp = await fetch('/api/state', { credentials: 'include' });
    return resp.json();
  });
  const teamBefore = before.teamCode;
  expect(teamBefore).toMatch(/^TEAM-/);

  await reachCreateViaLite(page);
  await page.getByTestId('px-0-0').click();
  await page.getByTestId('share-btn').click();
  await page.waitForURL(/\/house\?house=/, { timeout: 20000 });

  const connectBtn = page.getByRole('button', { name: /Connect wallet|Disconnect wallet/ });
  const label = (await connectBtn.textContent()) || '';
  if (label.includes('Connect')) await connectBtn.click();
  await page.getByRole('button', { name: 'Sign to unlock' }).click();
  await expect(page.getByRole('button', { name: 'Unlocked' })).toBeVisible();

  await page.getByRole('button', { name: 'Disconnect wallet' }).click();
  await page.waitForURL('**/');

  await page.getByTestId('auth-signin').click();
  await expect(page.getByTestId('hatch-panel')).toBeVisible();
  const teamAfter = (await page.getByTestId('team-code').innerText()).trim();
  expect(teamAfter).toMatch(/^TEAM-/);
  expect(teamAfter).not.toBe(teamBefore);
});
