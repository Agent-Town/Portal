const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const { seedPokerPlayHarness } = require('./helpers/poker_play');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M25.7: native season rankings derive deterministically from durable live-play rows', async ({ request }) => {
  const seeded = await seedPokerPlayHarness(request, {
    scenario: 'economy_native_season_story',
    asOf: '2026-03-12T15:00:00.000Z',
    tableId: 'pkt_play_phase25_native_season_story',
  });
  const expected = seeded?.debug?.nativeSeason || {};

  const currentResp = await request.get('/api/poker/play/seasons/native/current?asOf=2026-03-12T15%3A00%3A00.000Z');
  expect(currentResp.ok()).toBe(true);
  const currentBody = await currentResp.json();
  expect(String(currentBody?.data?.season?.seasonId || '')).toBe(String(expected?.seasonId || ''));
  expect(Number(currentBody?.data?.season?.summary?.playerCount || 0)).toBe(Number(expected?.playerCount || 0));

  const leaderboardResp = await request.get(`/api/poker/play/seasons/native/${encodeURIComponent(expected?.seasonId || '')}/leaderboard?asOf=2026-03-12T15%3A00%3A00.000Z`);
  expect(leaderboardResp.ok()).toBe(true);
  const leaderboardBody = await leaderboardResp.json();
  const leaderboard = leaderboardBody?.data?.leaderboard || {};
  const items = Array.isArray(leaderboard?.items) ? leaderboard.items : [];
  expect(items).toHaveLength(Number(expected?.playerCount || 0));
  expect(items.map((item) => String(item?.walletSubject || ''))).toEqual(Array.isArray(expected?.expectedOrder) ? expected.expectedOrder : []);

  for (const walletSubject of Object.keys(expected?.byWallet || {})) {
    const row = items.find((item) => String(item?.walletSubject || '') === walletSubject);
    expect(row).toBeTruthy();
    const expectedRow = expected.byWallet[walletSubject] || {};
    expect(Number(row?.netOil || 0)).toBe(Number(expectedRow?.netOil || 0));
    expect(Number(row?.cashNetOil || 0)).toBe(Number(expectedRow?.cashNetOil || 0));
    expect(Number(row?.tournamentNetOil || 0)).toBe(Number(expectedRow?.tournamentNetOil || 0));
    expect(Number(row?.rakeOil || 0)).toBe(Number(expectedRow?.rakeOil || 0));
    expect(Number(row?.entryFeeOil || 0)).toBe(Number(expectedRow?.entryFeeOil || 0));
    expect(Number(row?.treasuryContributionOil || 0)).toBe(Number(expectedRow?.treasuryContributionOil || 0));
    expect(Number(row?.tournamentWins || 0)).toBe(Number(expectedRow?.tournamentWins || 0));
    expect(Number(row?.tournamentCashes || 0)).toBe(Number(expectedRow?.tournamentCashes || 0));
  }
});
