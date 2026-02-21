const { test, expect } = require('@playwright/test');
const { installMockSolanaWallet } = require('./helpers/phase1');
const { reachCreateViaLite } = require('./helpers/phase2');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('agent derives ceremony key and appends; human can decrypt in house UI', async ({ page }) => {
  // Mock Solana wallet for unlock UX.
  await page.addInitScript(() => {
    const sig = new Uint8Array(64);
    for (let i = 0; i < sig.length; i++) sig[i] = (i * 19) & 0xff;
    window.__PRIVY_WALLET_BRIDGE__ = {
      connectSolana: async () => ({ address: 'So1anaMockAgentAppend11111111111111111111111' }),
      disconnectSolana: async () => {},
      signSolanaMessage: async () => ({ signature: sig, publicKey: { toString: () => 'So1anaMockAgentAppend11111111111111111111111' } })
    };
  });

  await page.goto('/');
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

  await page.locator('#entryText').fill('hello from agent (ceremony-derived)');
  await page.locator('#appendBtn').click();
  await expect(page.locator('#entries')).toContainText('hello from agent (ceremony-derived)');
});
