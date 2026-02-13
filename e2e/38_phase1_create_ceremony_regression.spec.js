const { test, expect } = require('@playwright/test');
const {
  installMockSolanaWallet,
  houseAuthHeadersFromKeyB64
} = require('./helpers/phase1');
const { reachCreateViaLite } = require('./helpers/phase2');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('create flow preserves ceremony + house generation and keeps house-auth meta access', async ({ page, request }) => {
  await installMockSolanaWallet(page);
  await reachCreateViaLite(page);

  await page.getByTestId('px-0-0').click();
  await expect(page.getByTestId('px-0-0')).toHaveAttribute('data-color', /[1-9]/);

  await page.waitForFunction(() => {
    const cells = Array.from(document.querySelectorAll('[data-testid^="px-"]'));
    return cells.some((node) => {
      const id = node.getAttribute('data-testid') || '';
      const color = node.getAttribute('data-color') || '0';
      return id !== 'px-0-0' && color !== '0';
    });
  }, { timeout: 5000 });

  await page.getByTestId('share-btn').click();
  await page.waitForURL(/\/house\?house=/, { timeout: 15000 });

  const houseId = new URL(page.url()).searchParams.get('house');
  expect(houseId).toBeTruthy();

  const connectWalletBtn = page.getByRole('button', { name: /Connect wallet|Disconnect wallet/ });
  const walletLabel = (await connectWalletBtn.textContent()) || '';
  if (walletLabel.includes('Connect')) {
    await connectWalletBtn.click();
  }
  await page.getByRole('button', { name: 'Sign to unlock' }).click();
  await expect(page.getByRole('button', { name: 'Unlocked' })).toBeVisible();

  const houseAuthKeyB64 = await page.evaluate((id) => {
    return sessionStorage.getItem(`agentTownHouseAuth:${id}`);
  }, houseId);
  expect(houseAuthKeyB64).toBeTruthy();

  const metaPath = `/api/house/${houseId}/meta`;
  const headers = houseAuthHeadersFromKeyB64(houseId, 'GET', metaPath, '', houseAuthKeyB64);
  const metaResp = await request.get(metaPath, { headers });
  expect(metaResp.ok()).toBeTruthy();
  const meta = await metaResp.json();
  expect(meta.housePubKey).toBe(houseId);
});
