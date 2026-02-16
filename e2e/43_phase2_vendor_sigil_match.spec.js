const { test, expect } = require('@playwright/test');
const { hatchAndConnectLite, mirrorSigilViaAgentApi } = require('./helpers/phase2');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('sigil unlock is driven by co-op agent-select action', async ({ page }) => {
  await hatchAndConnectLite(page, 'signup');

  let agentSelectSeen = false;
  await page.route('**/api/agent/select', async (route) => {
    agentSelectSeen = true;
    await new Promise((resolve) => setTimeout(resolve, 1200));
    await route.continue();
  });

  await page.getByTestId('sigil-key').click();
  const agentSelect = mirrorSigilViaAgentApi(page, 'key');

  await page.waitForTimeout(250);
  await expect(page.getByTestId('match-status')).toContainText('LOCKED');

  await expect.poll(() => agentSelectSeen, { timeout: 2000 }).toBe(true);
  await agentSelect;
  await expect(page.getByTestId('match-status')).toContainText('UNLOCKED', { timeout: 3000 });
  await expect(page.getByTestId('open-btn')).toBeEnabled();
});
