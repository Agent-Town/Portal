const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const { bindPageSession } = require('./helpers/poker_play');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('D1 hierarchy: lobby puts quick seat and live tables before eligibility and policy', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/');
  await bindPageSession(page, {
    address: 'So1anaMockDesignLobby111111111111111111111111',
    houseId: 'house_design_lobby',
  });

  await page.goto('/poker/play?embed=1');

  const sectionOrder = await page.locator('#pokerContent > [data-poker-section]').evaluateAll((nodes) => (
    nodes.map((node) => node.getAttribute('data-poker-section'))
  ));

  expect(sectionOrder.indexOf('quick-seat')).toBeGreaterThanOrEqual(0);
  expect(sectionOrder.indexOf('live-tables')).toBeGreaterThanOrEqual(0);
  expect(sectionOrder.indexOf('eligibility')).toBeGreaterThanOrEqual(0);
  expect(sectionOrder.indexOf('poker-policy')).toBeGreaterThanOrEqual(0);
  expect(sectionOrder.indexOf('quick-seat')).toBeLessThan(sectionOrder.indexOf('live-tables'));
  expect(sectionOrder.indexOf('live-tables')).toBeLessThan(sectionOrder.indexOf('eligibility'));
  expect(sectionOrder.indexOf('eligibility')).toBeLessThan(sectionOrder.indexOf('poker-policy'));

  await expect(page.locator('[data-poker-section="quick-seat"]')).toBeVisible();
  await expect(page.locator('[data-poker-section="live-tables"]')).toBeVisible();

  await context.close();
});
