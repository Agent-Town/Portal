const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const { seedPokerPlayHarness } = require('./helpers/poker_play');

const ADMIN_HEADERS = { 'x-admin-token': 'test-admin' };

async function requestJson(request, method, path, { headers = {}, data } = {}) {
  const response = await request.fetch(path, {
    method,
    headers,
    data,
  });
  const body = await response.json().catch(() => ({}));
  return {
    ok: response.ok(),
    status: response.status(),
    body,
  };
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M25.x: director can start and end the next scheduled break across a split tournament series', async ({ request }) => {
  const seeded = await seedPokerPlayHarness(request, {
    scenario: 'director_series_scheduled_break_ready',
    asOf: '2026-03-12T20:00:00.000Z',
    tableId: 'pkt_play_phase25_director_series_breaks',
  });
  const seriesId = String(seeded?.seriesId || '');
  const tableIds = Array.isArray(seeded?.tableIds) ? seeded.tableIds : [];
  expect(seriesId).toBeTruthy();
  expect(tableIds).toHaveLength(2);

  let adminResp = await requestJson(request, 'POST', `/api/poker/play/admin/series/${encodeURIComponent(seriesId)}/breaks/start`, {
    headers: ADMIN_HEADERS,
    data: {
      reason: 'Director started the next scheduled break across the tournament series.',
      asOf: '2026-03-12T20:01:00.000Z',
    },
  });
  expect(adminResp.ok).toBe(true);
  let data = adminResp.body?.data || {};
  expect(data?.series?.scheduledBreakActive).toBe(true);
  expect(Number(data?.series?.scheduledBreakTableCount || 0)).toBe(2);
  expect(Number(data?.series?.nextScheduledBreakAfterHandNumber || 0)).toBe(0);
  expect(Array.isArray(data?.tables)).toBe(true);
  expect(data.tables).toHaveLength(2);
  expect(data.tables.every((entry) => entry?.table?.summary?.scheduledBreakActive === true)).toBe(true);
  expect(data.tables.every((entry) => String(entry?.table?.summary?.scheduledBreakLabel || '') === 'Player Break 2')).toBe(true);

  adminResp = await requestJson(request, 'POST', `/api/poker/play/admin/series/${encodeURIComponent(seriesId)}/breaks/end`, {
    headers: ADMIN_HEADERS,
    data: {
      reason: 'Director ended the scheduled break early across the tournament series.',
      asOf: '2026-03-12T20:03:00.000Z',
    },
  });
  expect(adminResp.ok).toBe(true);
  data = adminResp.body?.data || {};
  expect(data?.series?.scheduledBreakActive).toBe(false);
  expect(Number(data?.series?.scheduledBreakTableCount || 0)).toBe(0);
  expect(Array.isArray(data?.tables)).toBe(true);
  expect(data.tables).toHaveLength(2);
  expect(data.tables.every((entry) => entry?.table?.summary?.scheduledBreakActive === false)).toBe(true);
  expect(data.tables.every((entry) => Number(entry?.table?.summary?.completedScheduledBreakCount || 0) === 2)).toBe(true);
});
