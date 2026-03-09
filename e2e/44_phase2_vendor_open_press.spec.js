const { test, expect } = require('@playwright/test');
const { hatchAndConnectLite, unlockGateWithSigil, fetchSessionState, pressOpenViaAgentApi } = require('./helpers/phase2');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('open transition is completed by co-op agent open-press action', async ({ page }) => {
  await hatchAndConnectLite(page, 'signin');
  await unlockGateWithSigil(page, 'key');

  let agentOpenSeen = false;
  await page.route('**/api/agent/open/press', async (route) => {
    agentOpenSeen = true;
    await new Promise((resolve) => setTimeout(resolve, 1200));
    await route.continue();
  });

  await page.getByTestId('open-btn').click();
  const agentOpen = pressOpenViaAgentApi(page);

  await page.waitForTimeout(250);
  expect(page.url()).not.toContain('/create');
  await expect(page.getByTestId('open-waiting')).toBeVisible();

  await expect.poll(() => agentOpenSeen, { timeout: 2000 }).toBe(true);
  await agentOpen;
  const openReady = page.locator('#openReady a[href="/create"]');
  await expect(openReady).toBeVisible({ timeout: 5000 });
  await openReady.click();
  await expect(page).toHaveURL(/\/app/);
  await expect(page.locator('#districtModalTitle')).toHaveText('Ceremony');
  const frame = page.locator('#districtModalBody iframe.districtFrame');
  await expect(frame).toBeVisible({ timeout: 5000 });
  await expect(frame).toHaveAttribute('src', /\/create\?embed=1/);

  const state = await fetchSessionState(page);
  expect(state.signup?.complete).toBe(true);
  expect(state.signup?.mode).toBe('agent');
});
