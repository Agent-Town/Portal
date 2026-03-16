const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const { closeDesignPage, openDesignRailSeries } = require('./helpers/poker_design');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('D3 distinction: rail series stays observational and avoids player-action hierarchy', async ({ browser, request }) => {
  const resources = await openDesignRailSeries(browser, request);
  const { page } = resources;

  await expect(page.locator('body[data-poker-view="play-rail-series"]')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Submit Action' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Your Seat' })).toHaveCount(0);
  await expect(page.locator('[data-action-role="primary"]')).toHaveCount(0);
  await expect(page.locator('[data-poker-section="rail-series-summary"]')).toBeVisible();
  await expect(page.locator('[data-poker-section="rail-series-tables"]')).toBeVisible();
  await expect(page.locator('[data-poker-section="rail-series-payouts"]')).toBeVisible();

  const buttons = await page.locator('button').count();
  expect(buttons).toBe(0);

  await closeDesignPage(resources);
});
