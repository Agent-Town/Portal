const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const { bindPageSession, seedPokerPlayHarness } = require('./helpers/poker_play');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M22.13 UI: results page shows native tournament stats and live-seat summary for the current wallet only', async ({ browser, request }) => {
  const seeded = await seedPokerPlayHarness(request, {
    scenario: 'player_stats_story',
    asOf: '2026-03-11T15:00:00.000Z',
    tableId: 'pkt_play_phase22_player_stats_ui',
  });
  const actor = seeded?.actors?.[0] || null;
  expect(actor?.address).toBeTruthy();

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/');
  await bindPageSession(page, {
    address: actor.address,
    houseId: actor.houseId,
  });

  await page.goto('/poker/play/results?embed=1&asOf=2026-03-11T15%3A00%3A00.000Z');
  await expect(page.getByRole('heading', { name: 'My Results' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Tournament Stats' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Live Seat Summary' })).toBeVisible();
  await expect(page.getByText('Harness Stats Live Cash Table')).toBeVisible();
  await expect(page.getByText('Harness Stats Closed Cash Table')).toBeVisible();
  await expect(page.getByText('Harness Stats Win Tournament')).toBeVisible();
  await expect(page.getByText('Harness Stats Bust Tournament')).toBeVisible();
  await expect(page.locator('body')).toContainText('5%');
  await expect(page.locator('body')).toContainText('60 OIL');
  await expect(page.locator('body')).toContainText('320 OIL');
  await expect(page.locator('body')).toContainText('live stack 320 OIL');
  await expect(page.locator('body')).toContainText('Invested');
  await expect(page.locator('body')).toContainText('Returned');
  await expect(page.locator('body')).toContainText('Net');

  await context.close();
});
