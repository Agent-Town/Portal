const { test, expect } = require('@playwright/test');

const { waitForLiteApi } = require('./helpers/trainer');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.use({ viewport: { width: 390, height: 844 } });

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('house console shows summary and one primary action group before readiness detail', async ({ page }) => {
  await page.goto('/app?liteDriver=phase1');
  await waitForLiteApi(page);

  await page.locator('[data-district="house"]').click();
  await expect(page.locator('#districtModalBackdrop:not(.is-hidden)')).toHaveCount(1);
  await expect(page.getByTestId('house-console-panel')).toBeVisible();
  await expect(page.getByTestId('house-console-summary-card')).toBeVisible();
  await expect(page.getByTestId('house-console-primary-actions')).toBeVisible();
  await expect(page.getByTestId('house-console-support')).toBeVisible();
  await expect(page.locator('[data-testid="house-console-primary-actions"] .btn').first()).toHaveText('Open Office');

  const metrics = await page.evaluate(() => {
    const summary = document.querySelector('[data-testid="house-console-summary-card"]');
    const primary = document.querySelector('[data-testid="house-console-primary-actions"]');
    const secondary = document.querySelector('[data-testid="house-console-secondary-nav"]');
    const support = document.querySelector('[data-testid="house-console-support"]');
    const actionGroups = Array.from(document.querySelectorAll('#houseConsolePanel [data-house-action-group]'));
    const visibleActionGroups = actionGroups.filter((node) => {
      const rect = node.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    });
    return {
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      summaryTop: summary?.getBoundingClientRect().top || 0,
      primaryTop: primary?.getBoundingClientRect().top || 0,
      secondaryTop: secondary?.getBoundingClientRect().top || 0,
      supportTop: support?.getBoundingClientRect().top || 0,
      visibleActionGroupCount: visibleActionGroups.length,
    };
  });

  expect(metrics.summaryTop).toBeLessThan(metrics.primaryTop);
  expect(metrics.primaryTop).toBeLessThan(metrics.secondaryTop);
  expect(metrics.secondaryTop).toBeLessThan(metrics.supportTop);
  expect(metrics.visibleActionGroupCount).toBeLessThanOrEqual(2);
  expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
});
