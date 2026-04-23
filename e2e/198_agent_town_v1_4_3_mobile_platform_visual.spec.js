const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('mobile platform routes stay calm and avoid horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 1100 });
  await page.goto('/app');
  await expect(page.locator('#districtMap')).toBeVisible();
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(hasOverflow).toBe(false);
  await expect(page.locator('#townScenePanel')).toHaveScreenshot('agent-town-v1-4-3-town-shell-mobile-390.png', {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.05
  });
});
