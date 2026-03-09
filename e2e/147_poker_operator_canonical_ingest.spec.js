const { test, expect } = require('@playwright/test');

const { resetPortalWebState } = require('./helpers/portal_web');
const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const {
  getPlatformCounts,
  getPlatformFixture,
  getPlatformTraceEvents,
  getPlatformTraceSummary,
  ingestPlatformPokerOperatorTrace,
} = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M19.16: seeded poker operator JSONL ingests into one canonical entrant-private trace with deterministic integrity', async ({ request }) => {
  const seededHouse = await seedRecoverableTokenHouse(request);
  const operatorFixture = await getPlatformFixture(request, 'poker_operator_seed_jsonl');
  const expectedTrace = await getPlatformFixture(request, 'poker_operator_expected_canonical_trace');

  const beforeCounts = await getPlatformCounts(request);
  const ingested = await ingestPlatformPokerOperatorTrace(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    teamId: 'team_main',
    idempotencyKey: 'poker-operator-ingest-001',
    records: operatorFixture.fixture?.records || [],
  });
  expect(ingested.status).toBe(201);
  const traceId = String(ingested.json?.data?.traceId || '');
  expect(traceId).toMatch(/^trace_/);
  expect(String(ingested.json?.data?.runId || '')).toMatch(/^run_/);

  const summary = await getPlatformTraceSummary(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    traceId,
  });
  expect(summary.status).toBe(200);
  expect(String(summary.json?.data?.authority?.type || '')).toBe(String(expectedTrace.fixture?.authority?.type || ''));

  const traceEvents = await getPlatformTraceEvents(request, traceId);
  expect(traceEvents.ok).toBe(true);
  const events = Array.isArray(traceEvents.events) ? traceEvents.events : [];
  expect(events).toHaveLength(Number(expectedTrace.fixture?.eventCount || 0));

  const afterCounts = await getPlatformCounts(request);
  expect(Number(afterCounts.counts?.trace_events || 0) - Number(beforeCounts.counts?.trace_events || 0)).toBe(events.length);

  events.forEach((event, index) => {
    expect(Number(event?.seq || 0)).toBe(index + 1);
    if (index > 0) {
      expect(String(event?.prevEventHash || '')).toBe(String(events[index - 1]?.eventHash || ''));
    }
    expect(String(event?.audience?.entrantId || '')).toBeTruthy();
    expect(String(event?.seal?.sealedContextId || '')).toBeTruthy();
  });
});
