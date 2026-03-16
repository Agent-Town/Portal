const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const { closeDesignLiveTable, openDesignLiveTable } = require('./helpers/poker_design');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('D2 hierarchy: live table moves current hand and submit action ahead of thread and support panels', async ({ browser, request }) => {
  const resources = await openDesignLiveTable(browser, request);
  const { page } = resources;

  await expect(page.locator('body[data-poker-view="play-table"][data-poker-live-state="acting"]')).toBeVisible();

  const sectionOrder = await page.locator('#pokerContent > [data-poker-section]').evaluateAll((nodes) => (
    nodes.map((node) => node.getAttribute('data-poker-section'))
  ));

  expect(sectionOrder.indexOf('current-hand')).toBeGreaterThanOrEqual(0);
  expect(sectionOrder.indexOf('submit-action')).toBeGreaterThanOrEqual(0);
  expect(sectionOrder.indexOf('table-summary')).toBeGreaterThanOrEqual(0);
  expect(sectionOrder.indexOf('seat-thread')).toBeGreaterThanOrEqual(0);
  expect(sectionOrder.indexOf('operator-review')).toBeGreaterThanOrEqual(0);
  expect(sectionOrder.indexOf('current-hand')).toBeLessThan(sectionOrder.indexOf('submit-action'));
  expect(sectionOrder.indexOf('submit-action')).toBeLessThan(sectionOrder.indexOf('table-summary'));
  expect(sectionOrder.indexOf('table-summary')).toBeLessThan(sectionOrder.indexOf('seat-thread'));
  expect(sectionOrder.indexOf('seat-thread')).toBeLessThan(sectionOrder.indexOf('operator-review'));

  await closeDesignLiveTable(resources);
});
