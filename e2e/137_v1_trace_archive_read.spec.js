const { test, expect } = require('@playwright/test');

const { resetPortalWebState } = require('./helpers/portal_web');
const { houseAuthHeadersFromKeyB64, seedRecoverableTokenHouse } = require('./helpers/phase1');
const {
  createPlatformRun,
  ingestPlatformTraceRecords,
  seedPlatformConfigVersion,
} = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

async function signedGet(request, {
  requestPath = '',
  signedPath = '',
  houseId = '',
  houseAuthKey = '',
} = {}) {
  const response = await request.get(requestPath, {
    headers: houseAuthHeadersFromKeyB64(houseId, 'GET', signedPath || requestPath, '', houseAuthKey),
    failOnStatusCode: false,
  });
  return {
    status: response.status(),
    json: await response.json(),
  };
}

test('M19.6: trace archive read routes return stable summary fields and deterministic pages', async ({ request }) => {
  const seededHouse = await seedRecoverableTokenHouse(request);
  const seededConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_trace_archive_read_01',
    houseId: seededHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  });
  expect(seededConfig?.ok).toBe(true);

  const runResp = await createPlatformRun(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    configVersionId: 'cfg_trace_archive_read_01',
    idempotencyKey: 'trace-archive-run-001',
  });
  expect(runResp.status).toBe(201);
  const runId = String(runResp.json?.data?.runId || '');
  expect(runId).toMatch(/^run_/);

  const ingest = await ingestPlatformTraceRecords(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    runId,
    idempotencyKey: 'trace-archive-ingest-001',
    records: [
      {
        ingestKey: 'worker_main:1',
        sourceType: 'worker',
        payloadSchema: 'raw.web.observation/v1',
        payload: { kind: 'navigate', url: 'https://example.com/' },
      },
      {
        ingestKey: 'worker_main:2',
        sourceType: 'worker',
        payloadSchema: 'raw.web.observation/v1',
        payload: { kind: 'click', selector: '#open' },
      },
      {
        ingestKey: 'worker_main:3',
        sourceType: 'worker',
        payloadSchema: 'raw.web.observation/v1',
        payload: { kind: 'submit', target: '#share' },
      },
    ],
  });
  expect(ingest.status).toBe(200);
  expect(ingest.json?.data?.accepted).toBe(3);
  const traceId = String(ingest.json?.data?.traceId || '');
  expect(traceId).toMatch(/^trace_/);

  const summaryPath = `/v1/traces/${encodeURIComponent(traceId)}`;
  const summary = await signedGet(request, {
    requestPath: summaryPath,
    signedPath: summaryPath,
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
  });
  expect(summary.status).toBe(200);
  expect(summary.json?.ok).toBe(true);
  expect(summary.json?.data).toMatchObject({
    traceId,
    runId,
    eventCount: 3,
  });
  expect(String(summary.json?.data?.status || '')).not.toBe('');

  const eventsBasePath = `/v1/traces/${encodeURIComponent(traceId)}/events`;
  const firstPage = await signedGet(request, {
    requestPath: `${eventsBasePath}?limit=2`,
    signedPath: eventsBasePath,
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
  });
  expect(firstPage.status).toBe(200);
  expect(firstPage.json?.ok).toBe(true);
  expect(firstPage.json?.data?.items).toHaveLength(2);
  expect(Number(firstPage.json?.data?.items?.[0]?.seq || 0)).toBe(1);
  expect(Number(firstPage.json?.data?.items?.[1]?.seq || 0)).toBe(2);
  expect(String(firstPage.json?.data?.nextCursor || '')).not.toBe('');

  const secondPage = await signedGet(request, {
    requestPath: `${eventsBasePath}?limit=2&cursor=${encodeURIComponent(String(firstPage.json?.data?.nextCursor || ''))}`,
    signedPath: eventsBasePath,
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
  });
  expect(secondPage.status).toBe(200);
  expect(secondPage.json?.ok).toBe(true);
  expect(secondPage.json?.data?.items).toHaveLength(1);
  expect(Number(secondPage.json?.data?.items?.[0]?.seq || 0)).toBe(3);

  const missingAuth = await request.get(summaryPath, { failOnStatusCode: false });
  expect(missingAuth.status()).toBe(401);
  const missingAuthJson = await missingAuth.json();
  expect(String(missingAuthJson?.error?.code || missingAuthJson?.error || '')).toBe('HOUSE_AUTH_REQUIRED');
});
