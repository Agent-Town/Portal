const { test, expect } = require('@playwright/test');
const { installMockSolanaWallet } = require('./helpers/phase1');
const { enterHatch, triggerWalletProfileCheck } = require('./helpers/phase2');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('disconnecting wallet on main page resets token verified state', async ({ page }) => {
  await page.addInitScript(() => {
    const sig = new Uint8Array(64);
    for (let i = 0; i < sig.length; i++) sig[i] = (i * 13) & 0xff;
    const address = 'So1anaMockToken1111111111111111111111111111';
    window.__PRIVY_WALLET_BRIDGE__ = {
      connectSolana: async () => ({ address }),
      disconnectSolana: async () => {},
      signSolanaMessage: async () => ({ signature: sig, publicKey: { toString: () => address } })
    };
  });

  await page.goto('/');
  await enterHatch(page, 'signin', { navigate: false });

  const teamBefore = await page.evaluate(async () => {
    const resp = await fetch('/api/state', { credentials: 'include' });
    const state = await resp.json().catch(() => ({}));
    return String(state?.teamCode || '').trim();
  });
  expect(teamBefore).toMatch(/^TEAM-/);

  await triggerWalletProfileCheck(page);
  await expect(page.locator('#walletStatus')).toContainText(/no existing house|continue setting up|wallet verified/i);

  const resetResult = await page.evaluate(async () => {
    const resp = await fetch('/api/session/reset', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({})
    });
    const data = await resp.json().catch(() => ({}));
    return { ok: resp.ok, data };
  });
  expect(resetResult.ok).toBe(true);

  await page.reload();
  await enterHatch(page, 'signin', { navigate: false });
  const teamAfter = await page.evaluate(async () => {
    const resp = await fetch('/api/state', { credentials: 'include' });
    const state = await resp.json().catch(() => ({}));
    return String(state?.teamCode || '').trim();
  });
  expect(teamAfter).toMatch(/^TEAM-/);
  expect(teamAfter).not.toBe(teamBefore);
});
