const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('theme packs apply via query param and persist across pages', async ({ page }) => {
  await page.goto('/world?view=iso&theme=bk2');
  await expect(page.getByTestId('world-status')).toContainText('Loaded');
  await expect(page.locator('#atThemeStylesheet')).toHaveAttribute('href', '/themes/bk2.css');

  const border = await page.evaluate(() => {
    return getComputedStyle(document.documentElement).getPropertyValue('--border').trim();
  });
  expect(border.toLowerCase()).toBe('#5d4e37');

  await page.goto('/leaderboard');
  await expect(page.locator('#atThemeStylesheet')).toHaveAttribute('href', '/themes/bk2.css');
});
