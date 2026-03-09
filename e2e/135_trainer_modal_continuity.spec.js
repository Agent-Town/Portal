const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('direct /trainer entry redirects into the modal-preserving hub route', async ({ request, page }) => {
  const redirect = await request.fetch('/trainer', {
    maxRedirects: 0,
  });
  expect(redirect.status()).toBe(302);
  expect(String(redirect.headers().location || '')).toBe('/?modal=trainer');

  await page.goto('/trainer');
  await expect(page).toHaveURL(/\/\?modal=trainer$/);
  await expect(page.getByTestId('trainer-modal')).toBeVisible({ timeout: 5000 });
  await expect(page.getByTestId('trainer-root')).toBeVisible({ timeout: 1500 });
});

test('opening and closing trainer updates modal query state without leaving the hub', async ({ page }) => {
  await page.goto('/app?liteDriver=phase1');

  const trainerBtn = page.getByTestId('agent-open-trainer');
  await expect(trainerBtn).toHaveCount(1);

  const sidebar = page.locator('#agentSidebar');
  const minimized = await sidebar.evaluate((node) => node.classList.contains('minimized'));
  if (minimized) {
    await page.locator('#agentSidebar .sidebar-header').click();
  }

  await trainerBtn.click();
  await expect(page).toHaveURL(/modal=trainer/);
  await expect(page.getByTestId('trainer-modal')).toBeVisible({ timeout: 5000 });

  await page.locator('#trainerModalClose').click();
  await expect(page.getByTestId('trainer-modal')).toHaveAttribute('aria-hidden', 'true');
  await expect(page).not.toHaveURL(/modal=trainer/);
});
