const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const {
  bindPageSession,
  browserJson,
  seedPokerPlayHarness,
} = require('./helpers/poker_play');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M25.8: scheduled breaks become durable table state between hands and auto-resume at the seeded resume time', async ({ browser, request }) => {
  const seeded = await seedPokerPlayHarness(request, {
    scenario: 'scheduled_break_story',
    asOf: '2026-03-12T16:00:00.000Z',
    tableId: 'pkt_play_phase25_scheduled_break_story',
  });
  const tableId = String(seeded?.tableId || '');
  expect(tableId).toBeTruthy();
  const viewer = seeded?.actors?.[0] || {};
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/');
  await bindPageSession(page, {
    address: viewer.address,
    houseId: viewer.houseId,
  });

  let breakStartResp = await browserJson(page, `/api/poker/play/tables/${encodeURIComponent(tableId)}?asOf=2026-03-12T16%3A00%3A00.000Z`, {
    headers: { 'x-wallet-solana-address': viewer.address },
  });
  expect(breakStartResp.ok).toBe(true);
  let breakStart = breakStartResp.body?.data || {};
  expect(breakStart?.table?.summary?.scheduledBreakActive).toBe(true);
  expect(String(breakStart?.table?.summary?.scheduledBreakLabel || '')).toBe('Player Break 1');
  expect(String(breakStart?.table?.summary?.scheduledBreakUntilAt || '')).toBe('2026-03-12T16:05:00.000Z');
  expect(Number(breakStart?.table?.summary?.scheduledBreakAfterHandNumber || 0)).toBe(3);
  expect(Number(breakStart?.table?.summary?.nextScheduledBreakAfterHandNumber || 0)).toBe(6);
  expect(breakStart?.series?.scheduledBreakActive).toBe(true);

  const breakHoldResp = await browserJson(page, `/api/poker/play/tables/${encodeURIComponent(tableId)}?asOf=2026-03-12T16%3A03%3A00.000Z`, {
    headers: { 'x-wallet-solana-address': viewer.address },
  });
  expect(breakHoldResp.ok).toBe(true);
  const breakHold = breakHoldResp.body?.data || {};
  expect(breakHold?.table?.summary?.scheduledBreakActive).toBe(true);
  expect(String(breakHold?.table?.summary?.scheduledBreakUntilAt || '')).toBe('2026-03-12T16:05:00.000Z');
  expect(String(breakHold?.review?.latestAuditEvent?.eventKind || '')).toBe('scheduled_break_started');

  const resumeResp = await browserJson(page, `/api/poker/play/tables/${encodeURIComponent(tableId)}?asOf=2026-03-12T16%3A06%3A00.000Z`, {
    headers: { 'x-wallet-solana-address': viewer.address },
  });
  expect(resumeResp.ok).toBe(true);
  const resumed = resumeResp.body?.data || {};
  expect(resumed?.table?.summary?.scheduledBreakActive).toBe(false);
  expect(resumed?.table?.summary?.scheduledBreakUntilAt).toBeNull();
  expect(Number(resumed?.table?.summary?.completedScheduledBreakCount || 0)).toBe(1);
  expect(Number(resumed?.table?.summary?.nextScheduledBreakAfterHandNumber || 0)).toBe(6);
  expect(Number(resumed?.hand?.handNumber || 0)).toBe(4);
  expect(String(resumed?.hand?.status || '')).toBe('live');
  expect(resumed?.series?.scheduledBreakActive).toBe(false);
  expect(String(resumed?.review?.latestAuditEvent?.eventKind || '')).toBe('scheduled_break_ended');
  await context.close();
});
