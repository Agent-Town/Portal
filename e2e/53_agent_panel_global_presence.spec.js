const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('agent panel is present on core pages', async ({ page }) => {
  const routes = ['/', '/house', '/leaderboard', '/inbox/test-house'];

  for (const route of routes) {
    await page.goto(route);
    await expect(page.getByTestId('agent-panel')).toBeVisible({ timeout: 1500 });
  }
});
