const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('D4 status line: native season status transitions from loading to ready on successful load', async ({ page }) => {
  await page.route('**/api/poker/play/seasons/native/current**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    await route.continue();
  });

  await page.goto('/poker/play/seasons/native?embed=1');

  await expect(page.locator('#pokerStatus[data-poker-status-kind="loading"]')).toContainText('Loading live season leaderboard...');
  await expect(page.locator('#pokerStatus[data-poker-status-kind="ready"]')).toBeVisible();
});

test('D4 status line: centaur status uses error state styling when verification fails', async ({ page }) => {
  await page.route('**/api/poker/centaur/tournaments/pkt_centaur_01', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({
        error: {
          code: 'CENTAUR_TEST_FAILURE',
          message: 'Centaur table refused to load',
        },
      }),
    });
  });

  await page.goto('/poker/centaur/tournaments/pkt_centaur_01?embed=1');

  await expect(page.locator('#pokerStatus[data-poker-status-kind="error"]')).toContainText('CENTAUR_TEST_FAILURE');
  await expect(page.locator('[data-poker-section="route-error"][data-poker-state="error"]')).toBeVisible();
});
