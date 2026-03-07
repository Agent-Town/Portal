const { test, expect } = require('@playwright/test');
const { hatchAndConnectLite, mirrorSigilViaAgentApi } = require('./helpers/phase2');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('agent can connect and match the human sigil via co-op API', async ({ page }) => {
  await hatchAndConnectLite(page, 'signin');

  // Human picks first; agent mirrors over the same co-op API contract.
  await page.getByTestId('sigil-cookie').click();
  await mirrorSigilViaAgentApi(page, 'cookie');

  await expect(page.getByTestId('match-status')).toContainText('UNLOCKED');
  await expect(page.getByTestId('open-btn')).toBeEnabled();
});
