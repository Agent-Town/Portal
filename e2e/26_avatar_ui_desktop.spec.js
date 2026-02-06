const { test, expect } = require('@playwright/test');
const { reset, fixturePath } = require('./helpers/avatar');

test.beforeEach(async ({ request }) => {
  await reset(request);
});

test('desktop UI: upload -> processing -> preview loop', async ({ page }) => {
  await page.goto('/avatar');

  await page.setInputFiles('#avatarFile', fixturePath('good_full.png'));
  await page.getByTestId('avatar-upload-btn').click();

  await expect(page.getByTestId('avatar-preview-panel')).toBeVisible();
  await expect(page.getByTestId('prev-south')).toBeVisible();

  const debug = page.getByTestId('avatar-debug');
  await expect(debug).toContainText('walk(south) frame=');

  const t1 = await debug.textContent();
  await page.waitForTimeout(350);
  const t2 = await debug.textContent();
  expect(t2).not.toBe(t1);

  await expect(page.getByTestId('open-world-link')).toBeVisible();
});
