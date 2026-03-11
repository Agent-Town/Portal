const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const { seedPokerPlayHarness } = require('./helpers/poker_play');

const ADMIN_HEADERS = { 'x-admin-token': 'test-admin' };

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M22.14: ops dashboard reports exact live health counts and every card drills into a valid payload', async ({ request }) => {
  const seeded = await seedPokerPlayHarness(request, {
    scenario: 'ops_dashboard_story',
    asOf: '2026-03-11T16:00:00.000Z',
    tableId: 'pkt_play_phase22_ops_story',
  });
  expect(seeded?.tableIds).toHaveLength(7);
  expect(seeded?.seriesId).toBeTruthy();

  const response = await request.get('/api/poker/play/admin/ops?asOf=2026-03-11T16%3A00%3A00.000Z', {
    headers: ADMIN_HEADERS,
  });
  expect(response.ok()).toBe(true);
  const body = await response.json();
  const data = body?.data || {};
  const summary = data?.summary || {};

  expect(Number(summary?.liveTableCount || 0)).toBe(4);
  expect(Number(summary?.liveSeriesCount || 0)).toBe(1);
  expect(Number(summary?.pausedTableCount || 0)).toBe(1);
  expect(Number(summary?.disconnectedSeatCount || 0)).toBe(2);
  expect(Number(summary?.openDisputeCount || 0)).toBe(2);
  expect(Number(summary?.openIntegrityFlagCount || 0)).toBe(3);
  expect(Number(summary?.recentRefundCount || 0)).toBe(2);
  expect(Number(summary?.recentPayoutCount || 0)).toBe(2);
  expect(Number(summary?.reconciliationMismatchCount || 0)).toBe(0);

  expect(Array.isArray(data?.cards)).toBe(true);
  expect(data.cards).toHaveLength(9);
  expect(Array.isArray(data?.sections?.liveTables)).toBe(true);
  expect(data.sections.liveTables).toHaveLength(4);
  expect(Array.isArray(data?.sections?.liveSeries)).toBe(true);
  expect(data.sections.liveSeries).toHaveLength(1);
  expect(Array.isArray(data?.sections?.pausedTables)).toBe(true);
  expect(data.sections.pausedTables).toHaveLength(1);
  expect(Array.isArray(data?.sections?.disconnectedSeats)).toBe(true);
  expect(data.sections.disconnectedSeats).toHaveLength(2);
  expect(Array.isArray(data?.sections?.openDisputes)).toBe(true);
  expect(data.sections.openDisputes).toHaveLength(2);
  expect(Array.isArray(data?.sections?.openIntegrityFlags)).toBe(true);
  expect(data.sections.openIntegrityFlags).toHaveLength(3);
  expect(Array.isArray(data?.sections?.recentRefunds)).toBe(true);
  expect(data.sections.recentRefunds).toHaveLength(2);
  expect(Array.isArray(data?.sections?.recentPayoutJobs)).toBe(true);
  expect(data.sections.recentPayoutJobs).toHaveLength(2);
  expect(Number(data?.sections?.reconciliation?.summary?.mismatchCount || 0)).toBe(0);

  for (const card of data.cards) {
    expect(String(card?.metricKey || '')).toBeTruthy();
    expect(String(card?.href || '')).toMatch(/^\/poker\//);
    expect(String(card?.apiPath || '')).toMatch(/^\/api\//);
    const drilldown = await request.get(String(card.apiPath), {
      headers: ADMIN_HEADERS,
    });
    expect(drilldown.ok(), `${card.metricKey}:${card.apiPath}`).toBe(true);
    const drilldownBody = await drilldown.json();
    expect(drilldownBody?.data, `${card.metricKey}:${card.apiPath}`).toBeTruthy();
  }
});
