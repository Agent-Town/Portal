const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const { seedPokerPlayHarness } = require('./helpers/poker_play');

const ADMIN_HEADERS = { 'x-admin-token': 'test-admin' };

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M25.7: treasury route reconciles cash rake, tournament fees, and room drift exactly', async ({ request }) => {
  const seeded = await seedPokerPlayHarness(request, {
    scenario: 'economy_native_season_story',
    asOf: '2026-03-12T15:00:00.000Z',
    tableId: 'pkt_play_phase25_treasury_story',
  });

  const treasuryResp = await request.get('/api/poker/play/admin/treasury?asOf=2026-03-12T15%3A00%3A00.000Z', {
    headers: ADMIN_HEADERS,
  });
  expect(treasuryResp.ok()).toBe(true);
  const treasuryBody = await treasuryResp.json();
  const data = treasuryBody?.data || {};
  const summary = data?.summary || {};
  const expected = seeded?.debug?.treasury || {};

  expect(String(data?.treasuryWalletSubject || '')).toBeTruthy();
  expect(Number(summary?.cashRakeOil || 0)).toBe(Number(expected?.expectedCashRakeOil || 0));
  expect(Number(summary?.tournamentFeeOil || 0)).toBe(Number(expected?.expectedTournamentFeeOil || 0));
  expect(Number(summary?.expectedTreasuryCreditOil || 0)).toBe(Number(expected?.expectedTreasuryCreditOil || 0));
  expect(Number(summary?.actualTreasuryCreditOil || 0)).toBe(Number(expected?.expectedTreasuryCreditOil || 0));
  expect(Number(summary?.treasuryWalletBalanceOil || 0)).toBe(Number(expected?.expectedTreasuryCreditOil || 0));
  expect(Number(summary?.roomNetDriftOil || 0)).toBe(0);
  expect(Number(summary?.treasuryDeltaOil || 0)).toBe(0);

  const seasonRow = (Array.isArray(data?.seasons) ? data.seasons : []).find(
    (item) => String(item?.seasonId || '') === String(expected?.seasonId || '')
  );
  expect(seasonRow).toBeTruthy();
  expect(Number(seasonRow?.cashRakeOil || 0)).toBe(Number(expected?.expectedCashRakeOil || 0));
  expect(Number(seasonRow?.tournamentFeeOil || 0)).toBe(Number(expected?.expectedTournamentFeeOil || 0));
  expect(Number(seasonRow?.actualTreasuryCreditOil || 0)).toBe(Number(expected?.expectedTreasuryCreditOil || 0));
  expect(Number(seasonRow?.roomNetDriftOil || 0)).toBe(0);

  const reconciliationResp = await request.get('/api/poker/play/admin/reconciliation?asOf=2026-03-12T15%3A00%3A00.000Z', {
    headers: ADMIN_HEADERS,
  });
  expect(reconciliationResp.ok()).toBe(true);
  const reconciliationBody = await reconciliationResp.json();
  expect(Number(reconciliationBody?.data?.summary?.mismatchCount || 0)).toBe(0);
});
