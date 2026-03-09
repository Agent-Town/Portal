const { test, expect } = require('@playwright/test');

const { resetPortalWebState } = require('./helpers/portal_web');
const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const {
  createPlatformRun,
  getPlatformCounts,
  getPlatformTraceEvents,
  ingestPlatformTraceRecords,
  seedPlatformConfigVersion,
  setPlatformRunStatus,
} = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M19.5: completed runs reject fact-changing late intake and allow post-run annotations', async ({ request }) => {
  const seededHouse = await seedRecoverableTokenHouse(request);
  const seededConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_trace_late_policy_01',
    houseId: seededHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  });
  expect(seededConfig?.ok).toBe(true);

  const runResp = await createPlatformRun(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    configVersionId: 'cfg_trace_late_policy_01',
    idempotencyKey: 'trace-late-policy-run-001',
  });
  expect(runResp.status).toBe(201);
  const runId = String(runResp.json?.data?.runId || '');
  expect(runId).toMatch(/^run_/);

  const initialIngest = await ingestPlatformTraceRecords(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    runId,
    idempotencyKey: 'trace-late-policy-intake-001',
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
  expect(initialIngest.status).toBe(200);
  expect(initialIngest.json?.data?.accepted).toBe(1);
  const traceId = String(initialIngest.json?.data?.traceId || '');

  const beforeCompletionEvents = await getPlatformTraceEvents(request, traceId);
  expect(beforeCompletionEvents?.ok).toBe(true);
  expect(beforeCompletionEvents.events).toHaveLength(1);
  const originalEventHash = String(beforeCompletionEvents.events[0]?.eventHash || '');

  const completed = await setPlatformRunStatus(request, runId, 'completed');
  expect(completed?.ok).toBe(true);
  expect(String(completed?.run?.status || '')).toBe('completed');

  const countsBeforeLate = await getPlatformCounts(request);

  const lateFact = await ingestPlatformTraceRecords(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    runId,
    idempotencyKey: 'trace-late-policy-intake-002',
    records: [
      {
        ingestKey: 'worker_main:2',
        sourceType: 'worker',
        payloadSchema: 'raw.web.observation/v1',
        payload: {
          kind: 'click',
          selector: '#open',
        },
      },
    ],
  });
  expect(lateFact.status).toBe(409);
  expect(String(lateFact.json?.error?.code || lateFact.json?.error || '')).toBe('TRACE_LATE_EVENT_REJECTED');

  const countsAfterLate = await getPlatformCounts(request);
  expect(Number(countsAfterLate?.counts?.trace_events || 0)).toBe(Number(countsBeforeLate?.counts?.trace_events || 0));

  const annotation = await ingestPlatformTraceRecords(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    runId,
    idempotencyKey: 'trace-late-policy-intake-003',
    records: [
      {
        ingestKey: 'annotation:1',
        sourceType: 'service',
        payloadSchema: 'et.trace.annotation/v1',
        recordKind: 'annotation',
        payload: {
          kind: 'annotation',
          note: 'post-run review note',
        },
      },
    ],
  });
  expect(annotation.status).toBe(200);
  expect(annotation.json?.data).toMatchObject({
    accepted: 1,
    ignored: 0,
    rejected: 0,
  });

  const countsAfterAnnotation = await getPlatformCounts(request);
  expect(Number(countsAfterAnnotation?.counts?.trace_events || 0)).toBe(Number(countsAfterLate?.counts?.trace_events || 0) + 1);

  const finalEvents = await getPlatformTraceEvents(request, traceId);
  expect(finalEvents?.ok).toBe(true);
  expect(finalEvents.events).toHaveLength(2);
  expect(Number(finalEvents.events[1]?.seq || 0)).toBe(2);
  expect(String(finalEvents.events[0]?.eventHash || '')).toBe(originalEventHash);
});
