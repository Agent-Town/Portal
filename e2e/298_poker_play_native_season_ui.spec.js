const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const { bindPageSession, seedPokerPlayHarness } = require('./helpers/poker_play');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M25.7 UI: native season page renders deterministic summary and leaderboard rows', async ({ browser, request }) => {
  const seeded = await seedPokerPlayHarness(request, {
    scenario: 'economy_native_season_story',
    asOf: '2026-03-12T15:00:00.000Z',
    tableId: 'pkt_play_phase25_native_season_story',
  });
  const actor = Array.isArray(seeded?.actors) ? seeded.actors[0] : null;
  const seasonId = String(seeded?.debug?.nativeSeason?.seasonId || 'native-2026-03');

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/');
  if (actor?.address && actor?.houseId) {
    await bindPageSession(page, {
      address: actor.address,
      houseId: actor.houseId,
    });
  }

  await page.goto(`/poker/play/seasons/native/${encodeURIComponent(seasonId)}?embed=1&asOf=2026-03-12T15%3A00%3A00.000Z`);

  await expect(page.getByRole('heading', { name: 'Native Live Season Mar 2026' })).toBeVisible();
  await expect(page.locator('[data-native-season-summary="1"]')).toContainText('native-2026-03');
  await expect(page.locator('[data-native-season-summary="1"]')).toContainText('3');
  await expect(page.locator('[data-native-season-summary="1"]')).toContainText('100 OIL');

  const firstRow = page.locator('[data-native-season-rank="1"]');
  const secondRow = page.locator('[data-native-season-rank="2"]');
  const thirdRow = page.locator('[data-native-season-rank="3"]');

  await expect(firstRow).toContainText('Economy Alpha');
  await expect(firstRow).toContainText('360 OIL');
  await expect(firstRow).toContainText('1');
  await expect(secondRow).toContainText('Economy Bravo');
  await expect(secondRow).toContainText('-130 OIL');
  await expect(thirdRow).toContainText('Economy Charlie');
  await expect(thirdRow).toContainText('-330 OIL');

  await context.close();
});
