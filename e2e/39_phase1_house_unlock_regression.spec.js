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
  const walletLabel = (await connectWalletBtn.textContent()) || '';
  if (walletLabel.includes('Connect')) {
    await connectWalletBtn.click();
  }
  await page.getByRole('button', { name: 'Sign to unlock' }).click();
  await expect(page.getByRole('button', { name: 'Unlocked' })).toBeVisible();
}

test('unlock + reload + lock/unlock keeps inbox navigation context for the same house', async ({ page }) => {
  await installMockSolanaWallet(page);
  await reachHouseViaLiteFlow(page);

  const houseId = new URL(page.url()).searchParams.get('house');
  expect(houseId).toBeTruthy();

  await ensureWalletConnectedAndUnlock(page);

  const inboxLink = page.getByRole('link', { name: 'Inbox' });
  await expect(inboxLink).toBeVisible();
  await expect(inboxLink).toHaveAttribute('href', `/inbox/${houseId}`);

  await page.reload();
  await page.waitForURL(/\/house\?house=/);

  const inboxAfterReload = page.getByRole('link', { name: 'Inbox' });
  await expect(inboxAfterReload).toBeVisible();
  await expect(inboxAfterReload).toHaveAttribute('href', `/inbox/${houseId}`);

  await page.getByRole('button', { name: 'Lock (wipe key)' }).click();
  await expect(inboxAfterReload).toBeVisible();
  await expect(inboxAfterReload).toHaveAttribute('href', `/inbox/${houseId}`);

  await ensureWalletConnectedAndUnlock(page);
  await expect(inboxAfterReload).toBeVisible();
  await expect(inboxAfterReload).toHaveAttribute('href', `/inbox/${houseId}`);
});
