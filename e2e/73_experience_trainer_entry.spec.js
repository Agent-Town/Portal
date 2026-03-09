const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('agent sidebar opens trainer modal and trainer shell renders quickly', async ({ page }) => {
  await page.goto('/app?liteDriver=phase1');
  await expect(page.getByTestId('agent-debug-tools')).toContainText('Worker tools count', { timeout: 8000 });
  await page.evaluate(() => {
    if (typeof window.setupAgentInterface === 'function') {
      window.setupAgentInterface();
    }
  });
  await page.waitForTimeout(100);

  const trainerBtn = page.getByTestId('agent-open-trainer');
  await expect(trainerBtn).toHaveCount(1);

  const sidebar = page.locator('#agentSidebar');
  const minimized = await sidebar.evaluate((node) => node.classList.contains('minimized'));
  if (minimized) {
    await page.locator('#agentSidebar .sidebar-header').click();
  }
  await trainerBtn.click();

  await expect(page).not.toHaveURL(/\/trainer$/);
  await expect(page.getByTestId('trainer-modal')).toBeVisible({ timeout: 5000 });
  await expect(page.getByTestId('trainer-root')).toBeVisible({ timeout: 1000 });
});
