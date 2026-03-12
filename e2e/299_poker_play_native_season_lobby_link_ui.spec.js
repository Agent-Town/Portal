const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const { bindPageSession, seedPokerPlayHarness } = require('./helpers/poker_play');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M25.7 UI: live poker lobby links into the native season leaderboard and explicit season route', async ({ browser, request }) => {
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

  await page.goto('/poker/play?embed=1&asOf=2026-03-12T15%3A00%3A00.000Z');
  await page.getByRole('link', { name: 'Native Season' }).click();

  await expect(page).toHaveURL(/\/poker\/play\/seasons\/native(?:\?|$)/);
  await expect(page.getByRole('heading', { name: 'Native Live Season Mar 2026' })).toBeVisible();

  await page.getByRole('link', { name: 'Open Explicit Season' }).click();
  await expect(page).toHaveURL(new RegExp(`/poker/play/seasons/native/${seasonId}(?:\\?|$)`));
  await expect(page.locator('[data-native-season-rank="1"]')).toContainText('Economy Alpha');

  await context.close();
});
