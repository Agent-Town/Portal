const { test, expect } = require('@playwright/test');
const { installMockSolanaWallet } = require('./helpers/phase1');
const { reachCreateViaLite } = require('./helpers/phase2');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('house unlock is wallet-signature gated (mocked wallet)', async ({ page }) => {
  await installMockSolanaWallet(page, {
    address: 'So1anaMock222222222222222222222222222222222',
    multiplier: 17
  });
  await reachCreateViaLite(page);

  await page.getByTestId('px-0-0').click();
  await page.getByTestId('share-btn').click();
  await page.waitForURL(/\/house\?house=/, { timeout: 20000 });

  await expect(page.getByRole('button', { name: 'Sign to unlock' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Unlocked' })).toHaveCount(0);

  const connectWalletBtn = page.getByRole('button', { name: /Connect wallet|Disconnect wallet/ });
  const walletLabel = (await connectWalletBtn.textContent()) || '';
  if (walletLabel.includes('Connect')) {
    await connectWalletBtn.click();
  }
  await page.getByRole('button', { name: 'Sign to unlock' }).click();
  await expect(page.getByRole('button', { name: 'Unlocked' })).toBeVisible();

  await expect(page.locator('#erc8004Panel')).toBeHidden();
  await expect(page.locator('#toggleErc8004Btn')).toHaveClass(/is-hidden/);
  await expect(page.locator('#mintErc8004Btn')).toBeHidden();
});
