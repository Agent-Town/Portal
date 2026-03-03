const { test, expect } = require('@playwright/test');
const {
  DEFAULT_TEST_TOKEN_ADDRESS,
  installMockSolanaWallet,
  seedRecoverableTokenHouse
} = require('./helpers/phase1');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('house unlock is wallet-signature gated (mocked wallet)', async ({ page, request }) => {
  const mockAddress = DEFAULT_TEST_TOKEN_ADDRESS;
  await installMockSolanaWallet(page, { address: mockAddress, multiplier: 255 });
  const seeded = await seedRecoverableTokenHouse(request, {
    address: mockAddress,
    signatureMultiplier: 255
  });
  await page.goto(`/house?house=${encodeURIComponent(seeded.houseId)}`);
  await page.waitForURL(/\/house\?house=/, { timeout: 10000 });

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
