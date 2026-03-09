const { test, expect } = require('@playwright/test');

const { resetPortalWebState } = require('./helpers/portal_web');
const { houseAuthHeadersFromKeyB64, seedRecoverableTokenHouse } = require('./helpers/phase1');
const { getPlatformCounts, seedPlatformConfigVersion } = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M19.3: v1 run creation persists one durable run row and replays idempotently', async ({ request }) => {
  const seededHouse = await seedRecoverableTokenHouse(request);
  const seededConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_run_creation_contract_01',
    houseId: seededHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  });
  expect(seededConfig?.ok).toBe(true);
  expect(seededConfig?.config?.configVersionId).toBe('cfg_run_creation_contract_01');

  const before = await getPlatformCounts(request);
  expect(Number(before?.counts?.runs || 0)).toBe(0);

  const path = '/v1/experiences/agent_town_coop_v1/runs';
  const idempotencyKey = 'run-create-contract-001';
  const body = JSON.stringify({
    teamId: 'team_main',
    configVersionId: 'cfg_run_creation_contract_01',
    entryMode: 'normal',
    metadata: {
      startedBy: 'playwright',
    },
  });

  const first = await request.post(path, {
    data: body,
    headers: {
      'content-type': 'application/json',
      'Idempotency-Key': idempotencyKey,
      ...houseAuthHeadersFromKeyB64(seededHouse.houseId, 'POST', path, body, seededHouse.houseAuthKey),
    },
  });
  expect(first.status()).toBe(201);
  const firstJson = await first.json();
  expect(firstJson?.ok).toBe(true);
  expect(String(firstJson?.data?.runId || '')).toMatch(/^run_/);
  expect(String(firstJson?.data?.status || '')).toBe('queued');
  expect(String(firstJson?.data?.traceAuthorityType || '')).toBe('house_trace_ingester');

  const afterFirst = await getPlatformCounts(request);
  expect(Number(afterFirst?.counts?.runs || 0)).toBe(1);

  const replay = await request.post(path, {
    data: body,
    headers: {
      'content-type': 'application/json',
      'Idempotency-Key': idempotencyKey,
      ...houseAuthHeadersFromKeyB64(seededHouse.houseId, 'POST', path, body, seededHouse.houseAuthKey),
    },
  });
  expect(replay.ok()).toBe(true);
  const replayJson = await replay.json();
  expect(replayJson?.ok).toBe(true);
  expect(replayJson?.data?.runId).toBe(firstJson?.data?.runId);
  expect(String(replayJson?.data?.traceAuthorityType || '')).toBe('house_trace_ingester');

  const afterReplay = await getPlatformCounts(request);
  expect(Number(afterReplay?.counts?.runs || 0)).toBe(1);

  const missingAuth = await request.post(path, {
    data: body,
    headers: {
      'content-type': 'application/json',
      'Idempotency-Key': 'run-create-contract-missing-auth',
    },
  });
  expect(missingAuth.status()).toBe(401);
  const missingAuthJson = await missingAuth.json();
  expect(String(missingAuthJson?.error?.code || missingAuthJson?.error || '')).toBe('HOUSE_AUTH_REQUIRED');
});
