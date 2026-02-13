const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('start page renders logo/video/welcome and Enter opens app page', async ({ page }) => {
  await page.route('**/api/privy/config', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        enabled: false,
        startPageEnabled: false,
        appPath: '/app',
        config: null
      })
    });
  });

  await page.goto('/start');

  await expect(page.getByText('Welcome to the Wild West!')).toBeVisible();
  await expect(page.locator('img.startLogo')).toBeVisible();
  await expect(page.locator('video.startVideo')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Enter' })).toBeVisible();

  await page.getByRole('button', { name: 'Enter' }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole('button', { name: 'Open' })).toBeVisible();
});
