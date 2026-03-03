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

test('agent derives ceremony key and appends; human can decrypt in house UI', async ({ page, request }) => {
  const mockAddress = DEFAULT_TEST_TOKEN_ADDRESS;
  await installMockSolanaWallet(page, { address: mockAddress, multiplier: 19 });
  const seeded = await seedRecoverableTokenHouse(request, {
    address: mockAddress,
    signatureMultiplier: 19
  });
  await page.goto(`/house?house=${encodeURIComponent(seeded.houseId)}`);
  await page.waitForURL(/\/house\?house=/, { timeout: 10000 });

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
