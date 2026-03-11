const { test, expect } = require('@playwright/test');
const { seedExperiencePreference } = require('./helpers/experience');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('session context diagnostics expose the active experience preference', async ({ page }) => {
  await seedExperiencePreference(page, 'cn-mainland');
  await page.addInitScript(() => {
    localStorage.setItem('agentTown:panel:minimized', '0');
  });

  await page.route('**/api/privy/config', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        enabled: false,
        config: null,
        startPageEnabled: false,
        appPath: '/app',
      }),
    });
  });

  await page.goto('/app');
  await page.getByTestId('agent-debug-tab-session').click();
  await page.locator('#agentDebugRefreshBtn').click();

  const sessionPane = page.getByTestId('agent-debug-session');
  await expect(sessionPane).toContainText('"experiencePreference"', { timeout: 8000 });
  await expect(sessionPane).toContainText('"presetId": "cn-mainland"', { timeout: 8000 });
  await expect(sessionPane).toContainText('"locale": "zh-CN"', { timeout: 8000 });
});
