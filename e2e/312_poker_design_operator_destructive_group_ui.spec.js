const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const { closeDesignPage, openDesignOperatorReview } = require('./helpers/poker_design');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('D4 hierarchy: destructive operator controls are isolated from inspection and export controls', async ({ browser, request }) => {
  const resources = await openDesignOperatorReview(browser, request);
  const { page } = resources;

  const destructiveGroup = page.locator('[data-poker-section="operator-review"] [data-admin-action-group="destructive"]');
  const inspectGroup = page.locator('[data-poker-section="operator-review"] [data-admin-action-group="inspect"]');

  await expect(destructiveGroup).toContainText('Close + Refund');
  await expect(destructiveGroup).toContainText('Cancel Series + Refund');
  await expect(inspectGroup).toContainText('Export Review');
  await expect(inspectGroup).toContainText('Export Series Review');
  await expect(destructiveGroup.getByText('Export Review')).toHaveCount(0);

  await closeDesignPage(resources);
});
