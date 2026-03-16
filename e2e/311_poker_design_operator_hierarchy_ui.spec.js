const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const { closeDesignPage, openDesignOperatorReview } = require('./helpers/poker_design');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('D4 hierarchy: operator review summarizes state before grouped interventions', async ({ browser, request }) => {
  const resources = await openDesignOperatorReview(browser, request);
  const { page } = resources;

  await expect(page.locator('[data-poker-section="operator-review"]')).toBeVisible();
  const groupOrder = await page.locator('[data-poker-section="operator-review"] [data-admin-action-group]').evaluateAll((nodes) => (
    nodes.map((node) => node.getAttribute('data-admin-action-group'))
  ));
  expect(groupOrder).toEqual(['inspect', 'manage', 'destructive']);

  await expect(page.getByText('Review Hand', { exact: true })).toBeVisible();
  await expect(page.getByText('Open Disputes', { exact: true })).toBeVisible();
  await expect(page.getByText('Audit Events', { exact: true })).toBeVisible();

  await closeDesignPage(resources);
});
