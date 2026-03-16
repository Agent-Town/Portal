const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const { closeDesignLiveTable, openDesignLiveTable } = require('./helpers/poker_design');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('D2 responsive: tablet layout separates the decision lane from the supporting rail', async ({ browser, request }) => {
  const resources = await openDesignLiveTable(browser, request, {
    viewport: { width: 834, height: 1112 },
  });
  const { page } = resources;

  const currentHand = page.locator('[data-poker-section="current-hand"]');
  const submitAction = page.locator('[data-poker-section="submit-action"]');
  const tableSummary = page.locator('[data-poker-section="table-summary"]');
  const yourSeat = page.locator('[data-poker-section="your-seat"]');

  const currentHandBox = await currentHand.boundingBox();
  const submitActionBox = await submitAction.boundingBox();
  const tableSummaryBox = await tableSummary.boundingBox();
  const yourSeatBox = await yourSeat.boundingBox();

  expect(currentHandBox).toBeTruthy();
  expect(submitActionBox).toBeTruthy();
  expect(tableSummaryBox).toBeTruthy();
  expect(yourSeatBox).toBeTruthy();
  expect(Math.abs(currentHandBox.x - submitActionBox.x)).toBeLessThan(40);
  expect(tableSummaryBox.x).toBeGreaterThan(currentHandBox.x + 120);
  expect(yourSeatBox.x).toBeGreaterThan(submitActionBox.x + 120);

  await closeDesignLiveTable(resources);
});
