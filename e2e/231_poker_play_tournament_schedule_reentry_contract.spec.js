const { test, expect } = require('@playwright/test');
const {
  fundOilWallet,
  resetPortalWebState,
} = require('./helpers/portal_web');
const {
  bindPageSession,
  browserJson,
  seedPokerPlayHarness,
} = require('./helpers/poker_play');

const ADMIN_HEADERS = { 'x-admin-token': 'test-admin' };

async function requestJson(responsePromise) {
  const response = await responsePromise;
  const body = await response.json().catch(() => ({}));
  return { response, body };
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M22.9: scheduled start timestamps stay durable and configured re-entry updates entries and prize pool exactly once', async ({ browser, request }) => {
  const scheduledSeed = await seedPokerPlayHarness(request, {
    scenario: 'tournament_schedule_waiting',
    asOf: '2026-03-11T13:00:00.000Z',
    tableId: 'pkt_play_phase22_schedule_contract',
  });
  const scheduledSeriesId = String(scheduledSeed?.seriesId || '');
  const scheduledTableId = String(scheduledSeed?.tableId || '');
  expect(scheduledSeriesId).toBeTruthy();
  expect(scheduledTableId).toBeTruthy();

  let seriesResp = await requestJson(
    request.get(`/api/poker/play/rail/series/${encodeURIComponent(scheduledSeriesId)}?asOf=2026-03-11T13%3A00%3A00.000Z`)
  );
  expect(seriesResp.response.ok()).toBe(true);
  expect(seriesResp.body?.data?.series?.stage).toBe('scheduled');
  expect(seriesResp.body?.data?.series?.scheduledStartAt).toBe('2026-03-11T13:05:00.000Z');
  expect(seriesResp.body?.data?.tables?.[0]?.table?.status).toBe('scheduled');
  expect(seriesResp.body?.data?.tables?.[0]?.hand).toBeNull();

  seriesResp = await requestJson(
    request.get(`/api/poker/play/rail/series/${encodeURIComponent(scheduledSeriesId)}?asOf=2026-03-11T13%3A05%3A01.000Z`)
  );
  expect(seriesResp.response.ok()).toBe(true);
  expect(seriesResp.body?.data?.series?.scheduledStartAt).toBe('2026-03-11T13:05:00.000Z');
  expect(seriesResp.body?.data?.tables?.[0]?.table?.status).toBe('open');
  expect(seriesResp.body?.data?.tables?.[0]?.hand?.status).toBe('live');

  const reentrySeed = await seedPokerPlayHarness(request, {
    scenario: 'tournament_reentry_waiting',
    asOf: '2026-03-11T13:10:00.000Z',
    tableId: 'pkt_play_phase22_reentry_contract',
  });
  const reentrySeriesId = String(reentrySeed?.seriesId || '');
  const reentryActor = reentrySeed?.actors?.[0] || null;
  expect(reentrySeriesId).toBeTruthy();
  expect(reentryActor?.address).toBeTruthy();

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/');
  await bindPageSession(page, {
    address: reentryActor.address,
    houseId: reentryActor.houseId,
  });
  await fundOilWallet(request, {
    walletSubject: reentryActor.address,
    houseId: reentryActor.houseId,
    amount: 2000,
  });

  const reentryResp = await browserJson(page, `/api/poker/play/series/${encodeURIComponent(reentrySeriesId)}/reenter`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': reentryActor.address },
    data: {
      asOf: '2026-03-11T13:10:10.000Z',
    },
  });
  expect(reentryResp.ok).toBe(true);
  expect(reentryResp.body?.data?.mySeat?.status).toBe('active');
  expect(Number(reentryResp.body?.data?.series?.entryCount || 0)).toBe(3);
  expect(Number(reentryResp.body?.data?.series?.acceptedReentryCount || 0)).toBe(1);
  expect(Number(reentryResp.body?.data?.series?.prizePoolOil || 0)).toBe(1800);

  const secondReentryResp = await browserJson(page, `/api/poker/play/series/${encodeURIComponent(reentrySeriesId)}/reenter`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': reentryActor.address },
    data: {
      asOf: '2026-03-11T13:10:20.000Z',
    },
  });
  expect(secondReentryResp.ok).toBe(false);
  expect(secondReentryResp.body?.error?.code).toBe('POKER_PLAY_SEAT_ALREADY_ACTIVE');

  const reviewResp = await requestJson(
    request.get(`/api/poker/play/admin/tables/${encodeURIComponent(String(reentrySeed?.tableId || ''))}/review?asOf=2026-03-11T13%3A10%3A10.000Z`, {
      headers: ADMIN_HEADERS,
    })
  );
  expect(reviewResp.response.ok()).toBe(true);
  const reentryAudit = (reviewResp.body?.data?.auditEvents || []).filter((event) => event?.eventKind === 'tournament_reentered');
  expect(reentryAudit).toHaveLength(1);

  await context.close();
});
