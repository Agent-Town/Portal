const { test, expect } = require('@playwright/test');
const { selectStartPreset } = require('./helpers/experience');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('start page blocks entry until a path is chosen and mainland path swaps to same-origin hero media', async ({ page }) => {
  await page.route('**/api/privy/config', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        enabled: false,
        startPageEnabled: false,
        appPath: '/app',
        config: null,
      }),
    });
  });

  await page.goto('/start');

  const enterBtn = page.locator('#enterBtn');
  await expect(enterBtn).toBeDisabled();

  await selectStartPreset(page, 'cn-mainland');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(page.getByText('当前路径：简体中文 / Mainland-friendly')).toBeVisible();
  await expect(page.locator('#startHeroPoster')).toBeVisible();
  await expect(page.locator('#startVideoFrame')).toBeHidden();
  await expect(enterBtn).toBeEnabled();

  await selectStartPreset(page, 'global-default');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByText('Selected path: English / Global')).toBeVisible();
  await expect(page.locator('#startVideoFrame')).toBeVisible();
});
