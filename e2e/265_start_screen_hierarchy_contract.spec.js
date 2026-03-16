const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.use({ viewport: { width: 390, height: 844 } });

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('start screen keeps one clear primary action in the first mobile viewport', async ({ page }) => {
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

  const enterButton = page.locator('#enterBtn');
  await expect(enterButton).toBeVisible();
  await expect(page.locator('.startEntryActions .btn.primary')).toHaveCount(1);
  await expect(page.locator('.startWarning')).toHaveCount(0);

  const fitsViewport = await enterButton.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    return rect.top >= 0 && rect.bottom <= window.innerHeight;
  });
  expect(fitsViewport).toBe(true);

  const hasHorizontalOverflow = await page.evaluate(() => {
    const root = document.documentElement;
    return root.scrollWidth > root.clientWidth;
  });
  expect(hasHorizontalOverflow).toBe(false);
});
