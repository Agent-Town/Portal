const { test, expect } = require('@playwright/test');

const { resetPortalWebState } = require('./helpers/portal_web');
const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const {
  createPlatformRun,
  getPlatformCounts,
  getPlatformTraceEvents,
  ingestPlatformTraceRecords,
  seedPlatformConfigVersion,
} = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M19.4: trace ingestion accepts one canonical event and ignores duplicate ingest keys', async ({ request }) => {
  const seededHouse = await seedRecoverableTokenHouse(request);
  const seededConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_trace_ingest_contract_01',
    houseId: seededHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  });
  expect(seededConfig?.ok).toBe(true);

  const runResp = await createPlatformRun(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    configVersionId: 'cfg_trace_ingest_contract_01',
    idempotencyKey: 'trace-ingest-run-001',
  });
  expect(runResp.status).toBe(201);
  expect(runResp.json?.ok).toBe(true);
  const runId = String(runResp.json?.data?.runId || '');
  expect(runId).toMatch(/^run_/);

  const before = await getPlatformCounts(request);
  expect(Number(before?.counts?.trace_intake_records || 0)).toBe(0);
  expect(Number(before?.counts?.trace_events || 0)).toBe(0);

  const firstIngest = await ingestPlatformTraceRecords(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    runId,
    idempotencyKey: 'trace-intake-001',
    records: [
      {
        ingestKey: 'worker_main:1',
        sourceType: 'worker',
        payloadSchema: 'raw.web.observation/v1',
        payload: {
          kind: 'navigate',
          url: 'https://example.com/',
        },
      },
    ],
  });
  expect(firstIngest.status).toBe(200);
  expect(firstIngest.json?.ok).toBe(true);
  expect(firstIngest.json?.data).toMatchObject({
    runId,
    accepted: 1,
    ignored: 0,
    rejected: 0,
  });

  const afterFirst = await getPlatformCounts(request);
  expect(Number(afterFirst?.counts?.trace_intake_records || 0)).toBe(1);
  expect(Number(afterFirst?.counts?.trace_events || 0)).toBe(1);

  const replayIngest = await ingestPlatformTraceRecords(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    runId,
    idempotencyKey: 'trace-intake-002',
    records: [
      {
        ingestKey: 'worker_main:1',
        sourceType: 'worker',
        payloadSchema: 'raw.web.observation/v1',
        payload: {
          kind: 'navigate',
          url: 'https://example.com/',
        },
      },
    ],
  });
  expect(replayIngest.status).toBe(200);
  expect(replayIngest.json?.ok).toBe(true);
  expect(replayIngest.json?.data).toMatchObject({
    runId,
    accepted: 0,
    ignored: 1,
    rejected: 0,
  });

  const afterReplay = await getPlatformCounts(request);
  expect(Number(afterReplay?.counts?.trace_intake_records || 0)).toBe(1);
  expect(Number(afterReplay?.counts?.trace_events || 0)).toBe(1);

  const traceId = String(firstIngest.json?.data?.traceId || '');
  expect(traceId).toMatch(/^trace_/);
  const traceEvents = await getPlatformTraceEvents(request, traceId);
  expect(traceEvents?.ok).toBe(true);
  expect(Array.isArray(traceEvents?.events)).toBe(true);
  expect(traceEvents.events).toHaveLength(1);
  expect(Number(traceEvents.events[0]?.seq || 0)).toBe(1);
});
