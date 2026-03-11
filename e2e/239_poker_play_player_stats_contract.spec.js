const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const { bindPageSession, browserJson, seedPokerPlayHarness } = require('./helpers/poker_play');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M22.13: player stats stay wallet-bound and reconcile to seeded ledger plus standings', async ({ browser, request }) => {
  const seeded = await seedPokerPlayHarness(request, {
    scenario: 'player_stats_story',
    asOf: '2026-03-11T15:00:00.000Z',
    tableId: 'pkt_play_phase22_player_stats',
  });
  const actor = seeded?.actors?.[0] || null;
  const otherActor = seeded?.actors?.[1] || null;
  expect(actor?.address).toBeTruthy();
  expect(otherActor?.address).toBeTruthy();

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/');
  await bindPageSession(page, {
    address: actor.address,
    houseId: actor.houseId,
  });

  const resultsResp = await browserJson(page, '/api/poker/play/results/me?asOf=2026-03-11T15%3A00%3A00.000Z');
  expect(resultsResp.ok).toBe(true);
  expect(resultsResp.body?.data?.walletSubject).toBe(actor.address);
  expect(Number(resultsResp.body?.data?.summary?.tableCount || 0)).toBe(4);
  expect(Number(resultsResp.body?.data?.summary?.buyInOil || 0)).toBe(1900);
  expect(Number(resultsResp.body?.data?.summary?.reloadOil || 0)).toBe(100);
  expect(Number(resultsResp.body?.data?.summary?.investedOil || 0)).toBe(2000);
  expect(Number(resultsResp.body?.data?.summary?.returnedOil || 0)).toBe(560);
  expect(Number(resultsResp.body?.data?.summary?.prizeOil || 0)).toBe(1260);
  expect(Number(resultsResp.body?.data?.summary?.netOil || 0)).toBe(-180);
  expect(Number(resultsResp.body?.data?.summary?.cashNetOil || 0)).toBe(60);
  expect(Number(resultsResp.body?.data?.summary?.tournamentEntries || 0)).toBe(2);
  expect(Number(resultsResp.body?.data?.summary?.tournamentCashes || 0)).toBe(1);
  expect(Number(resultsResp.body?.data?.summary?.tournamentWins || 0)).toBe(1);
  expect(Number(resultsResp.body?.data?.summary?.tournamentRoiPercent || 0)).toBe(5);
  expect(Number(resultsResp.body?.data?.liveSeatSummary?.activeSeatCount || 0)).toBe(1);
  expect(Number(resultsResp.body?.data?.liveSeatSummary?.cashSeatCount || 0)).toBe(1);
  expect(Number(resultsResp.body?.data?.liveSeatSummary?.tournamentSeatCount || 0)).toBe(0);
  expect(Number(resultsResp.body?.data?.liveSeatSummary?.stackOil || 0)).toBe(320);

  const items = Array.isArray(resultsResp.body?.data?.items) ? resultsResp.body.data.items : [];
  expect(items).toHaveLength(4);
  const closedCashRow = items.find((item) => String(item?.title || '') === 'Harness Stats Closed Cash Table');
  expect(closedCashRow).toBeTruthy();
  expect(Number(closedCashRow?.investedOil || 0)).toBe(500);
  expect(Number(closedCashRow?.returnedOil || 0)).toBe(560);
  expect(Number(closedCashRow?.netOil || 0)).toBe(60);
  expect(String(closedCashRow?.status || '')).toBe('cashed_out');

  const liveCashRow = items.find((item) => String(item?.title || '') === 'Harness Stats Live Cash Table');
  expect(liveCashRow).toBeTruthy();
  expect(liveCashRow?.live).toBe(true);
  expect(Number(liveCashRow?.stackOil || 0)).toBe(320);
  expect(String(liveCashRow?.status || '')).toBe('active');

  const winTournamentRow = items.find((item) => String(item?.title || '') === 'Harness Stats Win Tournament');
  expect(winTournamentRow).toBeTruthy();
  expect(Number(winTournamentRow?.finishPosition || 0)).toBe(1);
  expect(Number(winTournamentRow?.prizeOil || 0)).toBe(1260);
  expect(String(winTournamentRow?.seriesTitle || '')).toBe('Harness Stats Win Series');

  const bustTournamentRow = items.find((item) => String(item?.title || '') === 'Harness Stats Bust Tournament');
  expect(bustTournamentRow).toBeTruthy();
  expect(Number(bustTournamentRow?.finishPosition || 0)).toBe(3);
  expect(Number(bustTournamentRow?.prizeOil || 0)).toBe(0);

  const forbiddenResp = await browserJson(page, `/api/poker/play/results/me?walletSubject=${encodeURIComponent(otherActor.address)}&asOf=2026-03-11T15%3A00%3A00.000Z`);
  expect(forbiddenResp.ok).toBe(false);
  expect(forbiddenResp.status).toBe(403);
  expect(forbiddenResp.body?.error?.code).toBe('FORBIDDEN');

  await context.close();
});
