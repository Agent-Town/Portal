const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const { closeDesignPage, openDesignNativeSeason } = require('./helpers/poker_design');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('D3 hierarchy: native season keeps summary compact and leaderboard ahead of economy detail', async ({ browser, request }) => {
  const resources = await openDesignNativeSeason(browser, request, {
    viewport: { width: 1440, height: 1200 },
  });
  const { page } = resources;

  await expect(page.locator('body[data-poker-view="play-native-season"]')).toBeVisible();

  const sectionOrder = await page.locator('#pokerContent > [data-poker-section]').evaluateAll((nodes) => (
    nodes.map((node) => node.getAttribute('data-poker-section'))
  ));
  expect(sectionOrder.indexOf('season-summary')).toBe(0);
  expect(sectionOrder.indexOf('season-leaderboard')).toBeGreaterThanOrEqual(0);
  expect(sectionOrder.indexOf('season-economy')).toBeGreaterThanOrEqual(0);
  expect(sectionOrder.indexOf('season-leaderboard')).toBeLessThan(sectionOrder.indexOf('season-economy'));

  const leaderboard = page.locator('[data-poker-section="season-leaderboard"]');
  const economy = page.locator('[data-poker-section="season-economy"]');
  const leaderboardBox = await leaderboard.boundingBox();
  const economyBox = await economy.boundingBox();
  expect(leaderboardBox).toBeTruthy();
  expect(economyBox).toBeTruthy();
  expect(economyBox.x).toBeGreaterThan(leaderboardBox.x + 120);

  await closeDesignPage(resources);
});
