const { test, expect } = require('@playwright/test');
const { installMockSolanaWallet } = require('./helpers/phase1');
const { reachCreateViaLite, attachPathRecorder } = require('./helpers/phase2');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('saving only human X URL does not fail when agent URL is empty in fallback mode', async ({ page }) => {
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
  await expect(page.locator('#openShareLink')).toHaveAttribute('href', /\/s\//);

  // Reload drops in-memory house auth keys and exercises the fallback posts path.
  await page.reload();
  await expect(page.getByRole('button', { name: 'Save links' })).toBeVisible();

  const xUrl = 'https://x.com/Agent_Town/status/2018422699803148310';
  await page.locator('#shareHumanPost').fill(xUrl);
  await page.locator('#shareAgentPost').fill('');

  const calls = attachPathRecorder(page, ['/api/human/posts', '/api/agent/posts']);
  await page.getByRole('button', { name: 'Save links' }).click();

  await expect(page.locator('#sharePostsStatus')).toContainText('Saved');
  await expect(page.locator('#sharePostsError')).toHaveText('');
  await expect.poll(() => calls.filter((c) => c.pathname === '/api/human/posts').length).toBeGreaterThan(0);
  await expect.poll(() => calls.filter((c) => c.pathname === '/api/agent/posts').length).toBe(0);
});
