const { test, expect } = require('@playwright/test');
const { fetchSessionState } = require('./helpers/phase1');
const { hatchAndConnectLite, mirrorSigilViaAgentApi, pressOpenViaAgentApi } = require('./helpers/phase2');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

async function reachUnlockedGate(page) {
  await hatchAndConnectLite(page, 'signin');

  await page.getByTestId('sigil-key').click();
  await mirrorSigilViaAgentApi(page, 'key');
  await expect(page.getByTestId('match-status')).toContainText('UNLOCKED', { timeout: 2000 });
  await expect(page.getByTestId('open-btn')).toBeEnabled();
}

test('open press completes signup with co-op agent action and navigates to /create', async ({ page }) => {
  await reachUnlockedGate(page);

  await page.getByTestId('open-btn').click();
  await pressOpenViaAgentApi(page);
  await page.waitForURL('**/create', { timeout: 2000 });

  const state = await fetchSessionState(page);
  expect(state.signup?.complete).toBe(true);
  expect(state.human?.openPressed).toBe(true);
  expect(state.agent?.openPressed).toBe(true);
});
