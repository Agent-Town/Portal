const { test, expect } = require('@playwright/test');
const { fetchSessionState } = require('./helpers/phase1');
const { hatchAndConnectLite } = require('./helpers/phase2');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('human sigil choice is matched by local OpenClaw Lite and unlocks open button', async ({ page }) => {
  await hatchAndConnectLite(page, 'signup');

  await page.getByTestId('sigil-key').click();
  await expect(page.getByTestId('match-status')).toContainText('UNLOCKED', { timeout: 2000 });
  await expect(page.getByTestId('open-btn')).toBeEnabled();

  const state = await fetchSessionState(page);
  expect(state.match?.matched).toBe(true);
  expect(state.human?.selected).toBe('key');
  expect(state.agent?.selected).toBe('key');
});
