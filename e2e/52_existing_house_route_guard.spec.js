const { test, expect } = require('@playwright/test');
const { installMockSolanaWallet } = require('./helpers/phase1');
const { reachCreateViaLite } = require('./helpers/phase2');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

async function reachHouseViaLiteFlow(page) {
  await reachCreateViaLite(page);
  await page.getByTestId('px-0-0').click();
  await page.getByTestId('share-btn').click();
  await page.waitForURL(/\/house\?house=/, { timeout: 15000 });
}

async function ensureWalletConnectedAndUnlock(page) {
  const connectWalletBtn = page.getByRole('button', { name: /Connect wallet|Disconnect wallet/ });
  const label = (await connectWalletBtn.textContent()) || '';
  if (label.includes('Connect')) {
    await connectWalletBtn.click();
  }
  await page.getByRole('button', { name: 'Sign to unlock' }).click();
  await expect(page.getByRole('button', { name: 'Unlocked' })).toBeVisible();
}

test('existing house flow does not reroute home or inbox back to create', async ({ page }) => {
  await installMockSolanaWallet(page);
  await reachHouseViaLiteFlow(page);

  const houseId = new URL(page.url()).searchParams.get('house');
  expect(houseId).toBeTruthy();

  await ensureWalletConnectedAndUnlock(page);

  await page.goto('/');
  await expect(page).toHaveURL('/');
  await expect.poll(() => page.url()).not.toContain('/create');

  await page.goto(`/inbox/${encodeURIComponent(houseId)}`);
  await expect(page).toHaveURL(`/inbox/${houseId}`);
  await expect.poll(() => page.url()).not.toContain('/create');
  await expect(page.locator('#houseBadge')).toContainText(houseId);
});
