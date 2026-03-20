const { test, expect } = require('@playwright/test');
const {
  installMockSolanaWallet,
  seedRecoverableTokenHouse
} = require('./helpers/phase1');
const { enterHatch, triggerWalletProfileCheck, ensureBrainPanelVisible } = require('./helpers/phase2');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('wallet profile check runs nonce+lookup and redirects to house when a profile exists', async ({ page, request }) => {
  await installMockSolanaWallet(page);
  const seeded = await seedRecoverableTokenHouse(request);

  const walletCalls = [];
  page.on('request', (req) => {
    const pathname = new URL(req.url()).pathname;
    if (pathname === '/api/wallet/nonce' || pathname === '/api/wallet/lookup') {
      walletCalls.push(pathname);
    }
  });

  await enterHatch(page, 'signin');
  await triggerWalletProfileCheck(page);

  await page.waitForURL(/\/house\?house=/, { timeout: 8000 });
  const url = new URL(page.url());
  expect(url.searchParams.get('house')).toBe(seeded.houseId);

  const nonceIdx = walletCalls.indexOf('/api/wallet/nonce');
  const lookupIdx = walletCalls.indexOf('/api/wallet/lookup');
  expect(nonceIdx).toBeGreaterThanOrEqual(0);
  expect(lookupIdx).toBeGreaterThanOrEqual(0);
  expect(nonceIdx).toBeLessThan(lookupIdx);
});

test('wallet with no profile remains in setup flow and exposes brain config controls', async ({ page }) => {
  await installMockSolanaWallet(page, {
    address: 'So1anaNoHouse1111111111111111111111111111111'
  });

  await enterHatch(page, 'signup');
  await triggerWalletProfileCheck(page);

  await page.waitForTimeout(2100);
  expect(page.url()).not.toMatch(/\/house\?house=/);
  await expect(page.locator('#townhallRegisterPanel')).toBeVisible();
  await expect(page.locator('#townhallStepHuman')).toBeVisible();
  await ensureBrainPanelVisible(page);
  await expect(page.getByTestId('lite-llm-panel')).toBeVisible();
});
