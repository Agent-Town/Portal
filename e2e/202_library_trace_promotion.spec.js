const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  createPlatformRun,
  getPlatformFixture,
  getPlatformStats,
  getPlatformTraceSummary,
  ingestPlatformTraceRecords,
  seedPlatformConfigVersion,
} = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M29.7: a canonical trace can be promoted into one curated Library item with deterministic provenance and idempotency', async ({ page, request }) => {
  const seededHouse = await seedRecoverableTokenHouse(request);
  const seededConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_library_trace_promotion_01',
    houseId: seededHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  });
  expect(seededConfig?.ok).toBe(true);

  const runResp = await createPlatformRun(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    configVersionId: 'cfg_library_trace_promotion_01',
    idempotencyKey: 'library-trace-promotion-run-001',
  });
  expect(runResp.status).toBe(201);
  const runId = String(runResp.json?.data?.runId || '');
  expect(runId).toMatch(/^run_/);

  const ingestResp = await ingestPlatformTraceRecords(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    runId,
    idempotencyKey: 'library-trace-promotion-ingest-001',
    records: [
      {
        ingestKey: 'promotion_trace:1',
        sourceType: 'worker',
        payloadSchema: 'raw.web.observation/v1',
        payload: { kind: 'navigate', url: 'https://example.com/' },
      },
      {
        ingestKey: 'promotion_trace:2',
        sourceType: 'worker',
        payloadSchema: 'raw.web.observation/v1',
        payload: { kind: 'click', selector: '#library' },
      },
      {
        ingestKey: 'promotion_trace:3',
        sourceType: 'worker',
        payloadSchema: 'raw.web.observation/v1',
        payload: { kind: 'submit', target: '#save' },
      },
    ],
  });
  expect(ingestResp.status).toBe(200);
  expect(ingestResp.json?.data?.accepted).toBe(3);
  const traceId = String(ingestResp.json?.data?.traceId || '');
  expect(traceId).toMatch(/^trace_/);

  const traceSummaryBefore = await getPlatformTraceSummary(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    traceId,
  });
  expect(traceSummaryBefore.status).toBe(200);
  expect(Number(traceSummaryBefore.json?.data?.eventCount || 0)).toBe(3);

  const fixture = await getPlatformFixture(request, 'library_trace_promotion_seed');
  const fixtureSummary = String(fixture?.fixture?.trace?.summary || '');

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const attached = await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const statsBefore = await getPlatformStats(request);
  expect(statsBefore?.ok).toBe(true);

  const promoteResp = await page.request.post('/api/platform/library/promotions', {
    headers: {
      'Idempotency-Key': 'library-trace-promotion-001',
    },
    data: {
      sourceKind: 'trace',
      sourceRef: traceId,
    },
    failOnStatusCode: false,
  });
  expect(promoteResp.status()).toBe(201);
  const promoteBody = await promoteResp.json();
  expect(promoteBody?.data?.promotion).toMatchObject({
    sourceKind: 'trace',
    sourceRef: traceId,
  });
  expect(promoteBody?.data?.item).toMatchObject({
    itemType: 'episodic_note',
    sourceKind: 'trace',
    sourceRef: traceId,
  });
  expect(String(promoteBody?.data?.item?.libraryItemId || '')).toMatch(/^lib_/);
  expect(String(promoteBody?.data?.item?.summary || '')).not.toBe('');
  expect(String(promoteBody?.data?.item?.summary || '')).not.toBe(fixtureSummary);
  expect(String(promoteBody?.data?.item?.contentText || '')).toContain(`Trace ID: ${traceId}`);
  expect(String(promoteBody?.data?.item?.contentText || '')).toContain('Event count: 3');
  expect(Array.isArray(promoteBody?.data?.links)).toBe(true);
  expect(promoteBody.data.links).toHaveLength(1);
  expect(promoteBody.data.links[0]).toMatchObject({
    linkKind: 'derived_from_trace',
    sourceKind: 'trace',
    sourceRef: traceId,
  });

  const statsAfterPromote = await getPlatformStats(request);
  expect(Number(statsAfterPromote?.stats?.counts?.library_items || 0)).toBe(Number(statsBefore?.stats?.counts?.library_items || 0) + 1);
  expect(Number(statsAfterPromote?.stats?.counts?.library_links || 0)).toBe(Number(statsBefore?.stats?.counts?.library_links || 0) + 1);

  const replayResp = await page.request.post('/api/platform/library/promotions', {
    headers: {
      'Idempotency-Key': 'library-trace-promotion-001',
    },
    data: {
      sourceKind: 'trace',
      sourceRef: traceId,
    },
    failOnStatusCode: false,
  });
  expect(replayResp.status()).toBe(200);
  const replayBody = await replayResp.json();
  expect(String(replayBody?.data?.item?.libraryItemId || '')).toBe(String(promoteBody?.data?.item?.libraryItemId || ''));

  const statsAfterReplay = await getPlatformStats(request);
  expect(statsAfterReplay?.stats?.counts).toEqual(statsAfterPromote?.stats?.counts);

  const traceSummaryAfter = await getPlatformTraceSummary(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    traceId,
  });
  expect(traceSummaryAfter.status).toBe(200);
  expect(Number(traceSummaryAfter.json?.data?.eventCount || 0)).toBe(Number(traceSummaryBefore.json?.data?.eventCount || 0));
  expect(String(traceSummaryAfter.json?.data?.runId || '')).toBe(String(traceSummaryBefore.json?.data?.runId || ''));
});
