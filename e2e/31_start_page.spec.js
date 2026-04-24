const { test, expect } = require('@playwright/test');
const { selectStartPreset } = require('./helpers/experience');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('start page renders chooser/video embed/welcome and Play Founders Plot opens the game after a path is chosen', async ({ page }) => {
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
  await expect(page.getByText('Choose your path')).toBeVisible();
  await expect(page.locator('img.startLogo')).toBeVisible();
  await expect(page.locator('iframe.startVideo')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Play Founders Plot' })).toBeDisabled();

  await selectStartPreset(page, 'global-default');
  await expect(page.getByRole('button', { name: 'Play Founders Plot' })).toBeEnabled();
  await page.getByRole('button', { name: 'Play Founders Plot' }).click();
  await expect(page).toHaveURL(/\/app\?district=founders-plot&entry=play-first$/);
  await expect(page.locator('#districtMap')).toBeVisible();
});
