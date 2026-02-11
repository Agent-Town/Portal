const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('inbox nav stays visible for the current house after reload and lock', async ({ page }) => {
  await page.addInitScript(() => {
    const sig = new Uint8Array(64);
    for (let i = 0; i < sig.length; i++) sig[i] = (i * 17) & 0xff;
    const address = 'So1anaMockToken1111111111111111111111111111';
    window.solana = {
      isPhantom: true,
      connect: async () => ({ publicKey: { toString: () => address } }),
      signMessage: async () => ({ signature: sig, publicKey: { toString: () => address } })
    };
  });

  await page.goto('/');
  await page.getByTestId('path-human').click();
  await page.getByRole('button', { name: 'Check wallet' }).click();
  await expect(page.getByTestId('token-status')).toContainText('Verified');

  await page.getByRole('link', { name: 'Create house' }).click();
  await page.waitForURL('**/create?mode=token');
  await page.getByTestId('px-0-0').click();
  await page.getByTestId('share-btn').click();
  await page.waitForURL(/\/house\?house=/);

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

  const inboxAfterReload = page.getByRole('link', { name: 'Inbox' });
  await expect(inboxAfterReload).toBeVisible();
  await expect(inboxAfterReload).toHaveAttribute('href', `/inbox/${houseId}`);

  await page.getByRole('button', { name: 'Lock (wipe key)' }).click();
  await expect(inboxAfterReload).toBeVisible();
  await expect(inboxAfterReload).toHaveAttribute('href', `/inbox/${houseId}`);
});
