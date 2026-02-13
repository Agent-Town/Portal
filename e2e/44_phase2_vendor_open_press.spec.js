const { test, expect } = require('@playwright/test');
const { hatchAndConnectLite, unlockGateWithSigil, fetchSessionState } = require('./helpers/phase2');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('open transition is completed by vendor runtime agent open-press', async ({ page }) => {
  await hatchAndConnectLite(page, 'signin');
  await unlockGateWithSigil(page, 'key');

  let agentOpenSeen = false;
  await page.route('**/api/agent/open/press', async (route) => {
    agentOpenSeen = true;
    await new Promise((resolve) => setTimeout(resolve, 1200));
    await route.continue();
  });

  await page.getByTestId('open-btn').click();

  await page.waitForTimeout(250);
  expect(page.url()).not.toContain('/create');
  await expect(page.getByTestId('open-waiting')).toBeVisible();

  await expect.poll(() => agentOpenSeen, { timeout: 2000 }).toBe(true);
  await page.waitForURL('**/create', { timeout: 5000 });

  const state = await fetchSessionState(page);
  expect(state.signup?.complete).toBe(true);
  expect(state.signup?.mode).toBe('agent');
});

