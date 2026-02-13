const { test, expect } = require('@playwright/test');
const { installMockSolanaWallet } = require('./helpers/phase1');
const { reachCreateViaLite } = require('./helpers/phase2');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('token holder can create a house without an agent', async ({ page }) => {
  await installMockSolanaWallet(page);
  await page.goto('/');

  // Product cut: no solo path controls on landing.
  await expect(page.getByTestId('path-human')).toHaveCount(0);
  await expect(page.getByTestId('path-coop')).toHaveCount(0);
  await expect(page.getByTestId('path-agent')).toHaveCount(0);

  await reachCreateViaLite(page);
  await page.getByTestId('px-0-0').click();
  await expect(page.getByTestId('share-btn')).toBeEnabled();
  await page.getByTestId('share-btn').click();
  await page.waitForURL(/\/house\?house=/, { timeout: 20000 });

  const connectBtn = page.getByRole('button', { name: /Connect wallet|Disconnect wallet/ });
  const label = (await connectBtn.textContent()) || '';
  if (label.includes('Connect')) {
    await connectBtn.click();
  }
  await page.getByRole('button', { name: 'Sign to unlock' }).click();
  await expect(page.locator('#descriptorPanel')).toBeHidden();
  await expect(page.locator('#toggleDescriptorBtn')).toHaveClass(/is-hidden/);
});
