const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('agent sidebar opens trainer route and trainer shell renders quickly', async ({ page }) => {
  await page.goto('/app?liteDriver=phase1');

  const trainerBtn = page.getByTestId('agent-open-trainer');
  await expect(trainerBtn).toHaveCount(1);

  await page.locator('#agentSidebar .sidebar-header').click();
  await trainerBtn.click();

  await expect(page).toHaveURL(/\/trainer$/);
  await expect(page.getByTestId('trainer-root')).toBeVisible({ timeout: 1000 });
});
