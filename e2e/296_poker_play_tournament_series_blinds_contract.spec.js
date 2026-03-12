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

test('M25.x: director can advance blinds across a split tournament series', async ({ request }) => {
  const seeded = await seedPokerPlayHarness(request, {
    scenario: 'director_series_scheduled_break_ready',
    asOf: '2026-03-12T21:00:00.000Z',
    tableId: 'pkt_play_phase25_director_series_blinds',
  });
  const seriesId = String(seeded?.seriesId || '');
  const tableIds = Array.isArray(seeded?.tableIds) ? seeded.tableIds : [];
  expect(seriesId).toBeTruthy();
  expect(tableIds).toHaveLength(2);

  const adminResp = await requestJson(request, 'POST', `/api/poker/play/admin/series/${encodeURIComponent(seriesId)}/blinds/advance`, {
    headers: ADMIN_HEADERS,
    data: {
      reason: 'Director advanced the tournament blinds across the series.',
      asOf: '2026-03-12T21:01:00.000Z',
    },
  });
  expect(adminResp.ok).toBe(true);
  const data = adminResp.body?.data || {};
  expect(Array.isArray(data?.tables)).toBe(true);
  expect(data.tables).toHaveLength(2);
  expect(data.tables.every((entry) => Number(entry?.table?.smallBlindOil || 0) === 75)).toBe(true);
  expect(data.tables.every((entry) => Number(entry?.table?.bigBlindOil || 0) === 150)).toBe(true);
  expect(data.tables.every((entry) => Number(entry?.table?.summary?.blindLevel || 0) === 2)).toBe(true);
  expect(data.tables.every((entry) => Number(entry?.table?.summary?.pendingBlindAdvanceCount || 0) === 0)).toBe(true);
});
