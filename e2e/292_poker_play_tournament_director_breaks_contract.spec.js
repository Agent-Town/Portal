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

test('M25.x: director can start and end the next scheduled tournament break between hands', async ({ request }) => {
  const asOf = '2026-03-12T18:00:00.000Z';
  const startBreakAt = '2026-03-12T18:01:00.000Z';
  const endBreakAt = '2026-03-12T18:03:00.000Z';
  const resumeAt = '2026-03-12T18:03:10.000Z';

  const seeded = await seedPokerPlayHarness(request, {
    scenario: 'director_scheduled_break_ready',
    asOf,
    tableId: 'pkt_play_phase25_director_breaks',
  });
  const tableId = String(seeded?.tableId || '');
  const viewer = seeded?.actors?.[0] || {};
  expect(tableId).toBeTruthy();
  expect(String(viewer?.address || '')).toBeTruthy();

  let detail = await requestJson(request, 'GET', `/api/poker/play/tables/${encodeURIComponent(tableId)}?asOf=${encodeURIComponent(asOf)}`, {
    headers: { 'x-wallet-solana-address': viewer.address },
  });
  expect(detail.ok).toBe(true);
  let data = detail.body?.data || {};
  expect(String(data?.table?.status || '')).toBe('paused');
  expect(Number(data?.table?.state?.lastSettledHandNumber || 0)).toBe(5);
  expect(data?.table?.summary?.scheduledBreakActive).toBe(false);
  expect(Number(data?.table?.summary?.completedScheduledBreakCount || 0)).toBe(1);
  expect(Number(data?.table?.summary?.nextScheduledBreakAfterHandNumber || 0)).toBe(6);
  expect(String(data?.table?.summary?.nextScheduledBreakLabel || '')).toBe('Player Break 2');

  let adminResp = await requestJson(request, 'POST', `/api/poker/play/admin/tables/${encodeURIComponent(tableId)}/breaks/start`, {
    headers: ADMIN_HEADERS,
    data: {
      reason: 'Director started the next scheduled break.',
      asOf: startBreakAt,
    },
  });
  expect(adminResp.ok).toBe(true);
  data = adminResp.body?.data || {};
  expect(data?.table?.summary?.scheduledBreakActive).toBe(true);
  expect(String(data?.table?.summary?.scheduledBreakLabel || '')).toBe('Player Break 2');
  expect(String(data?.table?.summary?.scheduledBreakUntilAt || '')).toBe('2026-03-12T18:06:00.000Z');
  expect(Number(data?.table?.summary?.completedScheduledBreakCount || 0)).toBe(2);
  expect(Number(data?.table?.summary?.nextScheduledBreakAfterHandNumber || 0)).toBe(0);

  detail = await requestJson(request, 'GET', `/api/poker/play/tables/${encodeURIComponent(tableId)}?asOf=${encodeURIComponent(startBreakAt)}`, {
    headers: { 'x-wallet-solana-address': viewer.address },
  });
  expect(detail.ok).toBe(true);
  data = detail.body?.data || {};
  expect(data?.table?.summary?.scheduledBreakActive).toBe(true);
  expect(String(data?.review?.latestAuditEvent?.eventKind || '')).toBe('director_scheduled_break_started');

  adminResp = await requestJson(request, 'POST', `/api/poker/play/admin/tables/${encodeURIComponent(tableId)}/breaks/end`, {
    headers: ADMIN_HEADERS,
    data: {
      reason: 'Director ended the scheduled break early.',
      asOf: endBreakAt,
    },
  });
  expect(adminResp.ok).toBe(true);
  data = adminResp.body?.data || {};
  expect(String(data?.table?.status || '')).toBe('paused');
  expect(data?.table?.summary?.scheduledBreakActive).toBe(false);
  expect(data?.table?.summary?.scheduledBreakUntilAt).toBeNull();
  expect(Number(data?.table?.summary?.completedScheduledBreakCount || 0)).toBe(2);
  expect(String(data?.review?.latestAuditEvent?.eventKind || '')).toBe('director_scheduled_break_ended');

  adminResp = await requestJson(request, 'POST', `/api/poker/play/admin/tables/${encodeURIComponent(tableId)}/resume`, {
    headers: ADMIN_HEADERS,
    data: {
      asOf: resumeAt,
    },
  });
  expect(adminResp.ok).toBe(true);
  data = adminResp.body?.data || {};
  expect(String(data?.table?.status || '')).toBe('open');
  expect(data?.table?.summary?.scheduledBreakActive).toBe(false);
  expect(Number(data?.hand?.handNumber || 0)).toBe(6);
  expect(String(data?.hand?.status || '')).toBe('live');
});
