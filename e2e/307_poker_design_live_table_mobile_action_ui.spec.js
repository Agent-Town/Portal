const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const { closeDesignLiveTable, openDesignLiveTable } = require('./helpers/poker_design');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('D2 responsive: acting player sees submit action inside the first mobile viewport without overflow', async ({ browser, request }) => {
  const resources = await openDesignLiveTable(browser, request, {
    viewport: { width: 390, height: 844 },
  });
  const { page } = resources;

  const currentHand = page.locator('[data-poker-section="current-hand"]');
  const submitAction = page.locator('[data-poker-section="submit-action"]');
  const seatThread = page.locator('[data-poker-section="seat-thread"]');

  await expect(currentHand).toBeVisible();
  await expect(submitAction).toBeVisible();
  await expect(seatThread).toBeVisible();

  const currentHandBox = await currentHand.boundingBox();
  const submitActionBox = await submitAction.boundingBox();
  const seatThreadBox = await seatThread.boundingBox();

  expect(currentHandBox).toBeTruthy();
  expect(submitActionBox).toBeTruthy();
  expect(seatThreadBox).toBeTruthy();
  expect(currentHandBox.y).toBeLessThan(submitActionBox.y);
  expect(submitActionBox.y).toBeLessThan(844);
  expect(submitActionBox.y).toBeLessThan(seatThreadBox.y);

  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth);

  await closeDesignLiveTable(resources);
});
