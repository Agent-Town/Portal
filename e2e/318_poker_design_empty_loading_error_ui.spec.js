const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('D4 state design: lobby empty state is intentional when no live tables exist', async ({ page }) => {
  await page.route('**/api/poker/play/tables**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          items: [],
          series: [],
          houseId: 'house_design_empty',
          wallet: { address: 'So1anaMockDesignEmpty111111111111111111111111' },
          oilBalance: { balance: 0 },
          pokerPolicy: {
            dailySpendCapOil: 0,
            todaySpendOil: 0,
            remainingDailySpendOil: null,
            selfExcluded: false,
            selfExcludedUntil: null,
          },
        },
      }),
    });
  });

  await page.goto('/poker/play?embed=1');

  const emptyCard = page.locator('[data-poker-section="live-tables"][data-poker-state="empty"]');
  await expect(emptyCard).toBeVisible();
  await expect(emptyCard).toContainText('No live tables yet.');
  await expect(page.locator('#pokerStatus[data-poker-status-kind="empty"]')).toContainText('No live poker table available.');
});

test('D4 state design: lobby exposes a structural loading card while live tables are still resolving', async ({ page }) => {
  await page.route('**/api/poker/play/tables**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 450));
    await route.continue();
  });

  await page.goto('/poker/play?embed=1');

  await expect(page.locator('[data-poker-section="route-loading"][data-poker-state="loading"]')).toBeVisible();
  await expect(page.locator('#pokerStatus[data-poker-status-kind="loading"]')).toContainText('Loading live tables...');
  await expect(page.locator('[data-poker-section="live-tables"]')).toBeVisible();
});

test('D4 state design: route failures render a structured error surface instead of plain fallback text', async ({ page }) => {
  await page.route('**/api/poker/play/tables**', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({
        error: {
          code: 'TEST_FAILURE',
          message: 'Simulated lobby failure',
        },
      }),
    });
  });

  await page.goto('/poker/play?embed=1');

  await expect(page.locator('body[data-poker-view="error"]')).toBeVisible();
  await expect(page.locator('[data-poker-section="route-error"][data-poker-state="error"]')).toContainText('Unable to load poker page.');
  await expect(page.locator('#pokerStatus[data-poker-status-kind="error"]')).toContainText('TEST_FAILURE');
});
