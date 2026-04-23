const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('normal routes keep debug complexity hidden while explicit debug state still works', async ({ page }) => {
  await page.goto('/app');
  await expect(page.getByTestId('agent-debug-pane')).toBeHidden();
  await expect(page.locator('[data-testid="agent-debug-tab-traffic"]:visible')).toHaveCount(0);
  await expect(page.locator('[data-testid="agent-debug-tab-tools"]:visible')).toHaveCount(0);
  await expect(page.locator('[data-testid="agent-debug-tab-session"]:visible')).toHaveCount(0);

  await page.addInitScript(() => {
    localStorage.setItem('agentTown:panel:minimized', '0');
    localStorage.setItem('agentTown:panel:debugVisible', '1');
  });
  await page.goto('/app?debug=1');
  await expect(page.getByTestId('agent-debug-pane')).toBeVisible();
  await expect(page.getByTestId('agent-debug-tab-tools')).toBeVisible();
  await expect(page.getByTestId('agent-debug-tab-traffic')).toBeVisible();
  await expect(page.getByTestId('agent-debug-tab-session')).toBeVisible();
});
