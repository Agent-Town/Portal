const { test, expect } = require('@playwright/test');
const { installMockSolanaWallet } = require('./helpers/phase1');
const { reachCreateViaLite } = require('./helpers/phase2');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('api/human/posts rejects updates for share IDs outside the caller session', async ({ page, request }) => {
  await installMockSolanaWallet(page);
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

  await page.getByRole('button', { name: 'Generate share link' }).click();
  const openShareLink = page.locator('#openShareLink');
  await expect(openShareLink).toHaveAttribute('href', /\/s\//);
  const href = await openShareLink.getAttribute('href');
  expect(href).toBeTruthy();

  const shareId = String(href).split('/').filter(Boolean).pop();
  expect(shareId).toMatch(/^sh_/);

  const beforeShareResp = await request.get(`/api/share/${encodeURIComponent(shareId)}`);
  expect(beforeShareResp.ok()).toBeTruthy();
  const beforeShare = await beforeShareResp.json();

  const attackResp = await request.post('/api/human/posts', {
    data: {
      shareId,
      xPostUrl: 'https://x.com/attacker/status/1'
    }
  });

  expect(attackResp.status()).toBe(403);
  const attackJson = await attackResp.json();
  expect(attackJson).toMatchObject({ ok: false, error: 'SHARE_FORBIDDEN' });

  const afterShareResp = await request.get(`/api/share/${encodeURIComponent(shareId)}`);
  expect(afterShareResp.ok()).toBeTruthy();
  const afterShare = await afterShareResp.json();

  expect(afterShare.xPostUrl || null).toBe(beforeShare.xPostUrl || null);
  expect(afterShare.humanHandle || null).toBe(beforeShare.humanHandle || null);
});
