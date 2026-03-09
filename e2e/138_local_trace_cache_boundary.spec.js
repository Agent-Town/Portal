const { test, expect } = require('@playwright/test');

const { resetPortalWebState } = require('./helpers/portal_web');
const {
  gotoAppWithLite,
  openTrainerFromSidebar,
  runExperience,
  setDeterministicLlm,
  visitSkill,
  listTrainerAttemptIds,
} = require('./helpers/trainer');
const { houseAuthHeadersFromKeyB64, seedRecoverableTokenHouse } = require('./helpers/phase1');
const {
  createPlatformRun,
  getPlatformCounts,
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

test('M19.7: trainer delete clears only local cache and preserves canonical archive', async ({ page, request }) => {
  const seededHouse = await seedRecoverableTokenHouse(request);
  const seededConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_trace_cache_boundary_01',
    houseId: seededHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  });
  expect(seededConfig?.ok).toBe(true);

  const runResp = await createPlatformRun(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    configVersionId: 'cfg_trace_cache_boundary_01',
    idempotencyKey: 'trace-cache-boundary-run-001',
  });
  expect(runResp.status).toBe(201);
  const runId = String(runResp.json?.data?.runId || '');
  expect(runId).toMatch(/^run_/);

  const ingest = await ingestPlatformTraceRecords(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    runId,
    idempotencyKey: 'trace-cache-boundary-ingest-001',
    records: [
      {
        ingestKey: 'worker_local:1',
        sourceType: 'worker',
        payloadSchema: 'raw.web.observation/v1',
        payload: { kind: 'navigate', url: 'https://example.com/' },
      },
      {
        ingestKey: 'worker_local:2',
        sourceType: 'worker',
        payloadSchema: 'raw.web.observation/v1',
        payload: { kind: 'click', selector: '#launch' },
      },
    ],
  });
  expect(ingest.status).toBe(200);
  expect(ingest.json?.data?.accepted).toBe(2);
  const traceId = String(ingest.json?.data?.traceId || '');
  expect(traceId).toMatch(/^trace_/);

  const beforeCounts = await getPlatformCounts(request);
  const eventsPath = `/v1/traces/${encodeURIComponent(traceId)}/events`;
  const beforeArchive = await signedGet(request, {
    requestPath: eventsPath,
    signedPath: eventsPath,
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
  });
  expect(beforeArchive.status).toBe(200);
  expect(beforeArchive.json?.ok).toBe(true);
  expect(beforeArchive.json?.data?.items).toHaveLength(2);

  await gotoAppWithLite(page);
  await setDeterministicLlm(page);
  const visit = await visitSkill(page, '/skill.md');
  expect(visit?.ok).toBe(true);

  await runExperience(page, 'trainer probe: lite echo');
  await runExperience(page, 'trainer probe: missing tool');
  await openTrainerFromSidebar(page);

  const clearButton = page.getByTestId('trainer-clear-all');
  const beforeLocalAttemptIds = await listTrainerAttemptIds(page);
  expect(beforeLocalAttemptIds).toHaveLength(2);
  await expect(clearButton).toContainText(/local|cache/i);

  await page.getByTestId('trainer-attempt-delete').first().click();

  await expect(page.getByTestId('trainer-attempts').getByRole('button')).toHaveCount(1, { timeout: 5000 });
  const afterLocalAttemptIds = await listTrainerAttemptIds(page);
  expect(afterLocalAttemptIds).toHaveLength(1);
  await expect(page.locator('#trainerStatusLine')).toContainText(/local|cache/i);

  const afterCounts = await getPlatformCounts(request);
  expect(Number(afterCounts.counts?.trace_events || 0)).toBe(Number(beforeCounts.counts?.trace_events || 0));
  expect(Number(afterCounts.counts?.trace_artifacts || 0)).toBe(Number(beforeCounts.counts?.trace_artifacts || 0));

  const afterArchive = await signedGet(request, {
    requestPath: eventsPath,
    signedPath: eventsPath,
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
  });
  expect(afterArchive.status).toBe(200);
  expect(afterArchive.json?.ok).toBe(true);
  expect(afterArchive.json?.data?.items).toEqual(beforeArchive.json?.data?.items);
});
