const { test, expect } = require('@playwright/test');

const { resetPortalWebState } = require('./helpers/portal_web');
const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const {
  compilePlatformIntegration,
  getPlatformCounts,
  resolvePlatformIntegration,
} = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M19.11: integration compilation persists one pack version with deterministic manifest hashes', async ({ request }) => {
  const seededHouse = await seedRecoverableTokenHouse(request);
  const resolved = await resolvePlatformIntegration(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    targetUrl: 'https://github.com/openai/openai-codex/issues/1',
    idempotencyKey: 'integration-compile-resolve-001',
  });
  expect(resolved.status).toBe(201);
  const integrationId = String(resolved.json?.data?.integrationCandidateId || '');
  expect(integrationId).toMatch(/^intcand_/);

  const beforeCounts = await getPlatformCounts(request);
  const firstCompile = await compilePlatformIntegration(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    integrationId,
    idempotencyKey: 'integration-compile-001',
  });
  expect(firstCompile.status).toBe(201);
  expect(firstCompile.json?.ok).toBe(true);
  expect(String(firstCompile.json?.data?.packVersionId || '')).toMatch(/^intpackv_/);
  expect(String(firstCompile.json?.data?.contentHash || '')).toMatch(/^sha256:/);
  expect(String(firstCompile.json?.data?.fileHashes?.['trace_map.json'] || '')).toMatch(/^sha256:/);

  const replayCompile = await compilePlatformIntegration(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    integrationId,
    idempotencyKey: 'integration-compile-001',
  });
  expect(replayCompile.status).toBe(200);
  expect(String(replayCompile.json?.data?.packVersionId || '')).toBe(String(firstCompile.json?.data?.packVersionId || ''));

  const afterCounts = await getPlatformCounts(request);
  expect(Number(afterCounts.counts?.integration_pack_versions || 0) - Number(beforeCounts.counts?.integration_pack_versions || 0)).toBe(1);
});
