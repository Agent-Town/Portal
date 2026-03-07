const { test, expect } = require('@playwright/test');
const { installMockSolanaWallet } = require('./helpers/phase1');
const { reachCreateViaLite } = require('./helpers/phase2');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('inbox nav stays visible for the current house after reload and lock', async ({ page }) => {
  await page.addInitScript(() => {
    const sig = new Uint8Array(64);
    for (let i = 0; i < sig.length; i++) sig[i] = (i * 17) & 0xff;
    const address = 'So1anaMockToken1111111111111111111111111111';
    window.__PRIVY_WALLET_BRIDGE__ = {
      connectSolana: async () => ({ address }),
      disconnectSolana: async () => {},
      signSolanaMessage: async () => ({ signature: sig, publicKey: { toString: () => address } })
    };
  });

  await reachCreateViaLite(page);
  await page.getByTestId('px-0-0').click();
  await page.getByTestId('share-btn').click();
  await page.waitForURL(/\/house\?house=/, { timeout: 20000 });

  const houseId = new URL(page.url()).searchParams.get('house');
  expect(houseId).toBeTruthy();

  const connectBtn = page.getByRole('button', { name: /Connect wallet|Disconnect wallet/ });
  const label = (await connectBtn.textContent()) || '';
  if (label.includes('Connect')) {
    await connectBtn.click();
  }
  await page.getByRole('button', { name: 'Sign to unlock' }).click();
  await expect(page.getByRole('button', { name: 'Unlocked' })).toBeVisible();

  const inboxLink = page.getByRole('link', { name: 'Inbox' });
  await expect(inboxLink).toBeVisible();
  await expect(inboxLink).toHaveAttribute('href', `/inbox/${houseId}`);

  await page.reload();
  await page.waitForURL(/\/house\?house=/);
  await expect(inboxLink).toBeVisible();
  await expect(inboxLink).toHaveAttribute('href', `/inbox/${houseId}`);

  await page.getByRole('button', { name: 'Lock (wipe key)' }).click();
  await expect(inboxLink).toBeVisible();
  await expect(inboxLink).toHaveAttribute('href', `/inbox/${houseId}`);
});
