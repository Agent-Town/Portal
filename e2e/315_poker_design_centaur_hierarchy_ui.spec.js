const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const { closeDesignPage, openDesignCentaurTable } = require('./helpers/poker_design');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('D4 hierarchy: centaur table keeps live hand and shared action ahead of discussion on mobile', async ({ browser, request }) => {
  const resources = await openDesignCentaurTable(browser, request, {
    viewport: { width: 390, height: 844 },
  });
  const { page } = resources;

  await expect(page.locator('body[data-poker-view="centaur-table"][data-poker-centaur-state="live"]')).toBeVisible();

  const sectionOrder = await page.locator('#pokerContent > [data-poker-section]').evaluateAll((nodes) => (
    nodes.map((node) => node.getAttribute('data-poker-section'))
  ));
  expect(sectionOrder).toEqual([
    'centaur-summary',
    'centaur-live-hand',
    'centaur-submit-action',
    'centaur-discussion',
    'centaur-snapshot-hour',
  ]);

  const liveHand = page.locator('[data-poker-section="centaur-live-hand"]');
  const submitAction = page.locator('[data-poker-section="centaur-submit-action"]');
  const discussion = page.locator('[data-poker-section="centaur-discussion"]');
  const countdown = page.locator('#centaurCountdownValue');

  await expect(liveHand).toBeVisible();
  await expect(submitAction).toBeVisible();
  await expect(discussion).toBeVisible();
  await expect(countdown).toBeVisible();

  const liveHandBox = await liveHand.boundingBox();
  const submitActionBox = await submitAction.boundingBox();
  const discussionBox = await discussion.boundingBox();

  expect(liveHandBox).toBeTruthy();
  expect(submitActionBox).toBeTruthy();
  expect(discussionBox).toBeTruthy();
  expect(liveHandBox.y).toBeLessThan(submitActionBox.y);
  expect(submitActionBox.y).toBeLessThan(discussionBox.y);

  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth);

  await closeDesignPage(resources);
});
