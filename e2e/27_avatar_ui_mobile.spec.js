const { test, expect } = require('@playwright/test');
const { reset, fixturePath } = require('./helpers/avatar');

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

test.beforeEach(async ({ request }) => {
  await reset(request);
});

test('mobile UI: upload -> preview without layout break', async ({ page }) => {
  await page.goto('/avatar');

  await expect(page.getByTestId('avatar-upload-btn')).toBeVisible();
  await page.setInputFiles('#avatarFile', fixturePath('good_full.png'));
  await page.getByTestId('avatar-upload-btn').click();

  await expect(page.getByTestId('avatar-preview-panel')).toBeVisible();
  await expect(page.getByTestId('prev-ne')).toBeVisible();
});
