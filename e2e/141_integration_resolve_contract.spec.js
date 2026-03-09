const { test, expect } = require('@playwright/test');

const { resetPortalWebState } = require('./helpers/portal_web');
const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const {
  getPlatformCounts,
  resolvePlatformIntegration,
} = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M19.10: integration resolve returns deterministic candidates and blocks unsafe targets', async ({ request }) => {
  const seededHouse = await seedRecoverableTokenHouse(request);
  const beforeCounts = await getPlatformCounts(request);

  const firstResolve = await resolvePlatformIntegration(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    targetUrl: 'https://github.com/openai/openai-codex/issues/1',
    idempotencyKey: 'integration-resolve-001',
  });
  expect(firstResolve.status).toBe(201);
  expect(firstResolve.json?.ok).toBe(true);
  expect(String(firstResolve.json?.data?.integrationCandidateId || '')).toMatch(/^intcand_/);
  expect(['public_manual', 'native_api', 'mcp', 'parse', 'native_pack']).toContain(String(firstResolve.json?.data?.sourceKind || ''));
  expect(String(firstResolve.json?.data?.sourceKind || '')).toBe('native_pack');
  expect(firstResolve.json?.data?.requiresCompilation).toBe(false);

  const replayResolve = await resolvePlatformIntegration(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    targetUrl: 'https://github.com/openai/openai-codex/issues/1',
    idempotencyKey: 'integration-resolve-001',
  });
  expect(replayResolve.status).toBe(200);
  expect(String(replayResolve.json?.data?.integrationCandidateId || '')).toBe(String(firstResolve.json?.data?.integrationCandidateId || ''));

  const afterResolveCounts = await getPlatformCounts(request);
  expect(Number(afterResolveCounts.counts?.integration_candidates || 0) - Number(beforeCounts.counts?.integration_candidates || 0)).toBe(1);

  const blockedResolve = await resolvePlatformIntegration(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    targetUrl: 'http://127.0.0.1:4173/private',
    idempotencyKey: 'integration-resolve-blocked-001',
  });
  expect(blockedResolve.status).toBe(400);
  expect(['UNSAFE_TARGET', 'PRIVATE_NETWORK_BLOCKED']).toContain(String(blockedResolve.json?.error?.code || ''));

  const unsupportedResolve = await resolvePlatformIntegration(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    targetUrl: 'https://example.com/',
    idempotencyKey: 'integration-resolve-unsupported-001',
  });
  expect(unsupportedResolve.status).toBe(409);
  expect(String(unsupportedResolve.json?.error?.code || '')).toBe('INTEGRATION_TARGET_UNSUPPORTED');
});
