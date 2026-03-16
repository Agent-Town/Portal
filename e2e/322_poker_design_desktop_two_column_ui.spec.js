const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const { closeDesignLiveTable, openDesignLiveTable } = require('./helpers/poker_design');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('D2 responsive: desktop layout keeps the action lane left and seat support on the right rail', async ({ browser, request }) => {
  const resources = await openDesignLiveTable(browser, request, {
    viewport: { width: 1440, height: 1200 },
  });
  const { page } = resources;

  const currentHand = page.locator('[data-poker-section="current-hand"]');
  const submitAction = page.locator('[data-poker-section="submit-action"]');
  const tableSummary = page.locator('[data-poker-section="table-summary"]');
  const seatThread = page.locator('[data-poker-section="seat-thread"]');

  const currentHandBox = await currentHand.boundingBox();
  const submitActionBox = await submitAction.boundingBox();
  const tableSummaryBox = await tableSummary.boundingBox();
  const seatThreadBox = await seatThread.boundingBox();

  expect(currentHandBox).toBeTruthy();
  expect(submitActionBox).toBeTruthy();
  expect(tableSummaryBox).toBeTruthy();
  expect(seatThreadBox).toBeTruthy();
  expect(Math.abs(currentHandBox.x - submitActionBox.x)).toBeLessThan(40);
  expect(tableSummaryBox.x).toBeGreaterThan(currentHandBox.x + 160);
  expect(seatThreadBox.x).toBeGreaterThan(submitActionBox.x + 160);
  expect(Math.abs(tableSummaryBox.x - seatThreadBox.x)).toBeLessThan(40);

  await closeDesignLiveTable(resources);
});
