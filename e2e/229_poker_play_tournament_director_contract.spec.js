const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const { seedPokerPlayHarness } = require('./helpers/poker_play');

const ADMIN_HEADERS = { 'x-admin-token': 'test-admin' };

async function requestJson(responsePromise) {
  const response = await responsePromise;
  const body = await response.json().catch(() => ({}));
  return { response, body };
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M22.8: director overrides move seats, close registration, rebalance, and break tables without corrupting series state', async ({ request }) => {
  const manualSeed = await seedPokerPlayHarness(request, {
    scenario: 'tournament_director_manual',
    asOf: '2026-03-11T12:00:00.000Z',
    tableId: 'pkt_play_phase22_director_manual',
  });
  const manualSeriesId = String(manualSeed?.seriesId || '');
  const [manualTableA, manualTableB] = Array.isArray(manualSeed?.tableIds) ? manualSeed.tableIds : [];
  expect(manualSeriesId).toBeTruthy();
  expect(manualTableA).toBeTruthy();
  expect(manualTableB).toBeTruthy();

  let seriesResp = await requestJson(
    request.get(`/api/poker/play/rail/series/${encodeURIComponent(manualSeriesId)}?asOf=2026-03-11T12%3A00%3A00.000Z`)
  );
  expect(seriesResp.response.ok()).toBe(true);
  expect(Number(seriesResp.body?.data?.series?.tableCount || 0)).toBe(2);
  expect(Number(seriesResp.body?.data?.series?.targetTableCount || 0)).toBe(1);
  expect(seriesResp.body?.data?.series?.pendingBreakTableId).toBe(manualTableB);

  let adminResp = await requestJson(
    request.post(`/api/poker/play/admin/series/${encodeURIComponent(manualSeriesId)}/registration/close`, {
      headers: ADMIN_HEADERS,
      data: {
        reason: 'Director closed registration for balance review.',
        asOf: '2026-03-11T12:00:10.000Z',
      },
    })
  );
  expect(adminResp.response.ok()).toBe(true);
  expect(adminResp.body?.data?.series?.lateRegistrationOpen).toBe(false);
  expect(Number(adminResp.body?.data?.series?.tableCount || 0)).toBe(2);
  expect(Number(adminResp.body?.data?.series?.targetTableCount || 0)).toBe(1);

  let reviewResp = await requestJson(
    request.get(`/api/poker/play/admin/tables/${encodeURIComponent(manualTableA)}/review?asOf=2026-03-11T12%3A00%3A10.000Z`, {
      headers: ADMIN_HEADERS,
    })
  );
  expect(reviewResp.response.ok()).toBe(true);
  const registrationAudit = (reviewResp.body?.data?.auditEvents || []).filter((event) => event?.eventKind === 'director_registration_closed');
  expect(registrationAudit).toHaveLength(1);
  expect(registrationAudit[0]?.actorRole).toBe('operator');
  expect(registrationAudit[0]?.payload?.reason).toBe('Director closed registration for balance review.');

  adminResp = await requestJson(
    request.post(`/api/poker/play/admin/series/${encodeURIComponent(manualSeriesId)}/move-seat`, {
      headers: ADMIN_HEADERS,
      data: {
        sourceTableId: manualTableB,
        seatNumber: 1,
        targetTableId: manualTableA,
        targetSeatNumber: 3,
        reason: 'Director moved Charlie to table A.',
        asOf: '2026-03-11T12:00:20.000Z',
      },
    })
  );
  expect(adminResp.response.ok()).toBe(true);
  expect(Number(adminResp.body?.data?.series?.tableCount || 0)).toBe(2);
  expect(Number(adminResp.body?.data?.series?.targetTableCount || 0)).toBe(1);
  expect(adminResp.body?.data?.series?.pendingBreakTableId).toBe(null);

  reviewResp = await requestJson(
    request.get(`/api/poker/play/admin/tables/${encodeURIComponent(manualTableA)}/review?asOf=2026-03-11T12%3A00%3A20.000Z`, {
      headers: ADMIN_HEADERS,
    })
  );
  expect(reviewResp.response.ok()).toBe(true);
  const movedSeat = (reviewResp.body?.data?.seats || []).find((seat) => Number(seat?.seatNumber || 0) === 3);
  expect(movedSeat).toBeTruthy();
  expect(movedSeat?.walletSubject).toBe(String(manualSeed?.actors?.[2]?.address || ''));
  expect(Number(movedSeat?.buyInOil || 0)).toBe(600);
  expect(Number(movedSeat?.stackOil || 0)).toBe(600);
  reviewResp = await requestJson(
    request.get(`/api/poker/play/admin/tables/${encodeURIComponent(manualTableB)}/review?asOf=2026-03-11T12%3A00%3A20.000Z`, {
      headers: ADMIN_HEADERS,
    })
  );
  expect(reviewResp.response.ok()).toBe(true);
  const moveAudit = (reviewResp.body?.data?.auditEvents || []).filter((event) => event?.eventKind === 'director_seat_moved');
  expect(moveAudit).toHaveLength(1);
  expect(moveAudit[0]?.actorRole).toBe('operator');
  expect(moveAudit[0]?.payload?.reason).toBe('Director moved Charlie to table A.');

  adminResp = await requestJson(
    request.post(`/api/poker/play/admin/series/${encodeURIComponent(manualSeriesId)}/rebalance`, {
      headers: ADMIN_HEADERS,
      data: {
        reason: 'Director forced the rebalance.',
        asOf: '2026-03-11T12:00:30.000Z',
      },
    })
  );
  expect(adminResp.response.ok()).toBe(true);
  expect(Number(adminResp.body?.data?.series?.tableCount || 0)).toBe(1);
  expect(Number(adminResp.body?.data?.series?.targetTableCount || 0)).toBe(1);
  expect(adminResp.body?.data?.series?.pendingBreakTableId).toBe(null);
  expect(Number(adminResp.body?.data?.series?.pendingBreakSeatCount || 0)).toBe(0);

  reviewResp = await requestJson(
    request.get(`/api/poker/play/admin/series/${encodeURIComponent(manualSeriesId)}/export?asOf=2026-03-11T12%3A00%3A30.000Z`, {
      headers: ADMIN_HEADERS,
    })
  );
  expect(reviewResp.response.ok()).toBe(true);
  const rebalanceAudit = (reviewResp.body?.data?.review?.tables || [])
    .flatMap((entry) => entry?.review?.auditEvents || [])
    .filter((event) => event?.eventKind === 'director_rebalanced');
  expect(rebalanceAudit).toHaveLength(1);
  expect(rebalanceAudit[0]?.actorRole).toBe('operator');
  expect(rebalanceAudit[0]?.payload?.reason).toBe('Director forced the rebalance.');

  const breakSeed = await seedPokerPlayHarness(request, {
    scenario: 'tournament_director_break',
    asOf: '2026-03-11T12:10:00.000Z',
    tableId: 'pkt_play_phase22_director_break',
  });
  const breakSeriesId = String(breakSeed?.seriesId || '');
  expect(breakSeriesId).toBeTruthy();

  seriesResp = await requestJson(
    request.get(`/api/poker/play/rail/series/${encodeURIComponent(breakSeriesId)}?asOf=2026-03-11T12%3A10%3A00.000Z`)
  );
  expect(seriesResp.response.ok()).toBe(true);
  const pendingBreakTableId = String(seriesResp.body?.data?.series?.pendingBreakTableId || '');
  expect(pendingBreakTableId).toBeTruthy();

  adminResp = await requestJson(
    request.post(`/api/poker/play/admin/series/${encodeURIComponent(breakSeriesId)}/break-table`, {
      headers: ADMIN_HEADERS,
      data: {
        tableId: pendingBreakTableId,
        reason: 'Director broke the pending table.',
        asOf: '2026-03-11T12:10:10.000Z',
      },
    })
  );
  expect(adminResp.response.ok()).toBe(true);
  expect(Number(adminResp.body?.data?.series?.tableCount || 0)).toBe(1);
  expect(Number(adminResp.body?.data?.series?.targetTableCount || 0)).toBe(1);
  expect(adminResp.body?.data?.series?.pendingBreakTableId).toBe(null);

  reviewResp = await requestJson(
    request.get(`/api/poker/play/admin/tables/${encodeURIComponent(pendingBreakTableId)}/review?asOf=2026-03-11T12%3A10%3A10.000Z`, {
      headers: ADMIN_HEADERS,
    })
  );
  expect(reviewResp.response.ok()).toBe(true);
  const breakAudit = (reviewResp.body?.data?.auditEvents || []).filter((event) => event?.eventKind === 'director_table_broken');
  expect(breakAudit).toHaveLength(1);
  expect(breakAudit[0]?.actorRole).toBe('operator');
  expect(breakAudit[0]?.payload?.reason).toBe('Director broke the pending table.');
});
