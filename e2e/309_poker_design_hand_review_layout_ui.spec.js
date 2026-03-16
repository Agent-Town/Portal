const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const { closeDesignPage, openDesignHandReview } = require('./helpers/poker_design');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('D3 hierarchy: hand review shows summary and replay before notebook and opponent notes', async ({ browser, request }) => {
  const resources = await openDesignHandReview(browser, request);
  const { page } = resources;

  await expect(page.locator('body[data-poker-view="play-hand-review"]')).toBeVisible();

  const sectionOrder = await page.locator('#pokerContent > [data-poker-section]').evaluateAll((nodes) => (
    nodes.map((node) => node.getAttribute('data-poker-section'))
  ));

  expect(sectionOrder.indexOf('review-summary-shell')).toBe(0);
  expect(sectionOrder.indexOf('review-result-summary')).toBeGreaterThanOrEqual(0);
  expect(sectionOrder.indexOf('review-action-line')).toBeGreaterThanOrEqual(0);
  expect(sectionOrder.indexOf('review-board-pot')).toBeGreaterThanOrEqual(0);
  expect(sectionOrder.indexOf('review-notebook')).toBeGreaterThanOrEqual(0);
  expect(sectionOrder.indexOf('review-opponent-notes')).toBeGreaterThanOrEqual(0);
  expect(sectionOrder.indexOf('review-result-summary')).toBeLessThan(sectionOrder.indexOf('review-notebook'));
  expect(sectionOrder.indexOf('review-action-line')).toBeLessThan(sectionOrder.indexOf('review-notebook'));
  expect(sectionOrder.indexOf('review-board-pot')).toBeLessThan(sectionOrder.indexOf('review-opponent-notes'));

  await closeDesignPage(resources);
});
