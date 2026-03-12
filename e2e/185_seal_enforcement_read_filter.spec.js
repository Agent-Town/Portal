const { test, expect } = require('@playwright/test');

const { resetPortalWebState } = require('./helpers/portal_web');
const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const {
  getPlatformCounts,
  getPlatformFixture,
  getPlatformLiveTraceEvents,
  getPlatformSealedContext,
  getPlatformTraceEvents,
  ingestPlatformPokerOperatorTrace,
  releasePlatformSealedContext,
  seedPlatformSealedContext,
} = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M25.2: sealed trace reads redact forbidden live-window analysis and release restores visibility', async ({ request }) => {
  const seededHouse = await seedRecoverableTokenHouse(request);
  const sealedFixture = await getPlatformFixture(request, 'sealed_read_policy_seed');
  const pokerFixture = await getPlatformFixture(request, 'poker_operator_seed_jsonl');
  expect(sealedFixture?.ok).toBe(true);
  expect(pokerFixture?.ok).toBe(true);

  const ingest = await ingestPlatformPokerOperatorTrace(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    teamId: 'team_main',
    idempotencyKey: 'seal-enforcement-ingest-001',
    records: Array.isArray(pokerFixture?.fixture?.records) ? pokerFixture.fixture.records : [],
  });
  expect(ingest.status).toBe(201);
  const traceId = String(ingest.json?.data?.traceId || '');
  const runId = String(ingest.json?.data?.runId || '');
  expect(traceId).toMatch(/^trace_/);
  expect(runId).toMatch(/^run_/);

  const seededContext = await seedPlatformSealedContext(request, {
    houseId: seededHouse.houseId,
    traceId,
    runId,
    entrantId: 'entrant_fixture_alpha',
    scopeType: 'entrant_private',
    scopeKey: 'poker:entrant_fixture_alpha',
    allowedReaders: ['entrant_fixture_alpha', 'arbiter_fixture'],
    forbiddenSources: ['trainer_job.compare'],
    releasePolicy: 'manual',
    status: 'active',
  });
  expect(seededContext.status).toBe(200);
  const sealedContextId = String(seededContext.json?.sealedContext?.sealedContextId || '');
  expect(sealedContextId).toMatch(/^seal_/);

  const readContext = await getPlatformSealedContext(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    sealedContextId,
  });
  expect(readContext.status).toBe(200);
  expect(String(readContext.json?.data?.releasePolicy || '')).toBe('manual');

  const rawEvents = await getPlatformTraceEvents(request, traceId);
  expect(rawEvents?.ok).toBe(true);
  expect(Array.isArray(rawEvents?.events)).toBe(true);
  expect(rawEvents.events).toHaveLength(2);
  expect(String(rawEvents.events[0]?.sealedContextId || '')).toBe(sealedContextId);
  expect(rawEvents.events[0]?.payload?.payload).toMatchObject({
    ingestKey: 'op:1',
    type: 'hand_started',
    entrantId: 'entrant_fixture_alpha',
  });

  const beforeCounts = await getPlatformCounts(request);

  const allowedRead = await getPlatformLiveTraceEvents(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    traceId,
    readerId: 'arbiter_fixture',
    readerSource: 'house.archive',
  });
  expect(allowedRead.status).toBe(200);
  expect(allowedRead.json?.data?.readPolicy).toEqual({
    readerId: 'arbiter_fixture',
    readerSource: 'house.archive',
    auditKind: String(sealedFixture?.fixture?.expectedReadPolicy?.auditKind || 'sealed_read_attempt'),
  });
  expect(allowedRead.json?.data?.items?.[0]?.redacted).not.toBe(true);
  expect(allowedRead.json?.data?.items?.map((entry) => entry.payload)).toEqual(
    rawEvents.events.map((entry) => entry.payload)
  );

  const afterAllowedCounts = await getPlatformCounts(request);
  expect(Number(afterAllowedCounts.counts?.sealed_context_violations || 0)).toBe(
    Number(beforeCounts.counts?.sealed_context_violations || 0)
  );

  const forbiddenReadA = await getPlatformLiveTraceEvents(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    traceId,
    readerId: 'arbiter_fixture',
    readerSource: 'trainer_job.compare',
  });
  expect(forbiddenReadA.status).toBe(200);
  expect(forbiddenReadA.json?.data?.items).toHaveLength(2);
  for (const item of forbiddenReadA.json?.data?.items || []) {
    expect(item).toMatchObject({
      redacted: true,
      sealedContextId,
      payload: {
        redacted: true,
        auditKind: String(sealedFixture?.fixture?.expectedReadPolicy?.auditKind || 'sealed_read_attempt'),
        reason: 'reader_source_forbidden',
        sealedContextId,
      },
    });
    expect(item.payload.payload).toBeUndefined();
  }
  const afterForbiddenA = await getPlatformCounts(request);
  expect(Number(afterForbiddenA.counts?.sealed_context_violations || 0) - Number(afterAllowedCounts.counts?.sealed_context_violations || 0)).toBe(1);

  const forbiddenReadB = await getPlatformLiveTraceEvents(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    traceId,
    readerId: 'arbiter_fixture',
    readerSource: 'trainer_job.compare',
  });
  expect(forbiddenReadB.status).toBe(200);
  expect(forbiddenReadB.json?.data?.items).toEqual(forbiddenReadA.json?.data?.items);
  const afterForbiddenB = await getPlatformCounts(request);
  expect(Number(afterForbiddenB.counts?.sealed_context_violations || 0) - Number(afterForbiddenA.counts?.sealed_context_violations || 0)).toBe(1);

  const released = await releasePlatformSealedContext(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    sealedContextId,
    payload: {},
  });
  expect(released.status).toBe(200);
  expect(String(released.json?.data?.status || '')).toBe('released');

  const releasedRead = await getPlatformLiveTraceEvents(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    traceId,
    readerId: 'arbiter_fixture',
    readerSource: 'trainer_job.compare',
  });
  expect(releasedRead.status).toBe(200);
  expect(releasedRead.json?.data?.items?.[0]?.redacted).not.toBe(true);
  expect(releasedRead.json?.data?.items?.map((entry) => entry.payload)).toEqual(
    rawEvents.events.map((entry) => entry.payload)
  );
});
