const { test, expect } = require('@playwright/test');
const { installMockSolanaWallet, seedRecoverableTokenHouse } = require('./helpers/phase1');
const { enterHatch, triggerWalletProfileCheck, attachPathRecorder } = require('./helpers/phase2');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

function expectNonceLookupSequence(calls) {
  const paths = calls.map((c) => c.pathname);
  const nonceIdx = paths.indexOf('/api/wallet/nonce');
  const lookupIdx = paths.indexOf('/api/wallet/lookup');
  expect(nonceIdx).toBeGreaterThanOrEqual(0);
  expect(lookupIdx).toBeGreaterThanOrEqual(0);
  expect(nonceIdx).toBeLessThan(lookupIdx);
}

test('wallet with existing house mapping redirects to house in hatch flow', async ({ page, request }) => {
  await installMockSolanaWallet(page);
  const seeded = await seedRecoverableTokenHouse(request);
  const calls = attachPathRecorder(page, ['/api/wallet/nonce', '/api/wallet/lookup']);

  await enterHatch(page, 'signin');
  await triggerWalletProfileCheck(page);

  await page.waitForURL(/\/house\?house=/, { timeout: 2000 });
  const houseId = new URL(page.url()).searchParams.get('house');
  expect(houseId).toBe(seeded.houseId);
  expectNonceLookupSequence(calls);
});

test('wallet without mapping stays in hatch flow and keeps hatch controls visible', async ({ page }) => {
  await installMockSolanaWallet(page, {
    address: 'So1anaNoHouseVendor11111111111111111111111111'
  });
  const calls = attachPathRecorder(page, ['/api/wallet/nonce', '/api/wallet/lookup']);

  await enterHatch(page, 'signup');
  await triggerWalletProfileCheck(page);

  await page.waitForTimeout(2200);
  expect(page.url()).not.toMatch(/\/house\?house=/);
  await expect(page.getByTestId('hatch-panel')).toBeVisible();
  await expect(page.getByTestId('hatch-btn')).toBeVisible();
  expectNonceLookupSequence(calls);
});

