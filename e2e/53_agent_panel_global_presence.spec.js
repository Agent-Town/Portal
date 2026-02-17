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

test('agent panel debug tabs expose tools, skill context, traffic, and session context', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('agentTown:panel:minimized', '0');
  });

  await page.goto('/');
  await expect(page.getByTestId('agent-panel')).toBeVisible({ timeout: 1500 });
  await expect(page.getByTestId('agent-debug-pane')).toBeVisible({ timeout: 1500 });

  await expect(page.getByTestId('agent-debug-tools')).toContainText('Worker tools count', { timeout: 8000 });

  await page.getByTestId('agent-debug-tab-skill').click();
  await expect(page.getByTestId('agent-debug-panel-skill')).not.toHaveClass(/is-hidden/);
  await expect(page.getByTestId('agent-debug-skill')).toContainText('Skill import status', { timeout: 8000 });

  await page.locator('#chatInput').fill('traffic probe');
  await page.locator('#sendChatBtn').click();
  await page.getByTestId('agent-debug-tab-traffic').click();
  await expect(page.getByTestId('agent-debug-panel-traffic')).not.toHaveClass(/is-hidden/);
  await expect(page.getByTestId('agent-debug-traffic')).toContainText('OUT gateway.send', { timeout: 8000 });

  await page.getByTestId('agent-debug-tab-session').click();
  await expect(page.getByTestId('agent-debug-panel-session')).not.toHaveClass(/is-hidden/);
  await expect(page.getByTestId('agent-debug-session')).toContainText('"runtimeState"', { timeout: 8000 });
});
