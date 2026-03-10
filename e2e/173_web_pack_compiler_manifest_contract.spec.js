const { test, expect } = require('@playwright/test');

const { resetPortalWebState } = require('./helpers/portal_web');
const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const {
  compilePlatformIntegration,
  resolvePlatformIntegration,
} = require('./helpers/unified_platform');

const REQUIRED_PACK_FILES = [
  'heartbeat.md',
  'manifest.json',
  'manual/skill.md',
  'overlay.json',
  'policy.json',
  'provenance.json',
  'tools.md',
  'trace_map.json',
  'verification.json',
].sort();

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M24.6: integration compiler emits the richer deterministic pack file set', async ({ request }) => {
  const seededHouse = await seedRecoverableTokenHouse(request);
  const resolved = await resolvePlatformIntegration(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    targetUrl: 'https://github.com/openai/openai-codex/issues/1',
    idempotencyKey: 'integration-compile-richer-resolve-001',
  });
  expect(resolved.status).toBe(201);
  const integrationId = String(resolved.json?.data?.integrationCandidateId || '');
  expect(integrationId).toMatch(/^intcand_/);

  const firstCompile = await compilePlatformIntegration(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    integrationId,
    idempotencyKey: 'integration-compile-richer-001',
  });
  expect(firstCompile.status).toBe(201);
  expect(firstCompile.json?.ok).toBe(true);
  expect(String(firstCompile.json?.data?.packVersionId || '')).toMatch(/^intpackv_/);
  expect(String(firstCompile.json?.data?.contentHash || '')).toMatch(/^sha256:/);

  const fileHashes = firstCompile.json?.data?.fileHashes || {};
  expect(Object.keys(fileHashes).sort()).toEqual(REQUIRED_PACK_FILES);
  for (const filePath of REQUIRED_PACK_FILES) {
    expect(String(fileHashes[filePath] || '')).toMatch(/^sha256:/);
  }

  const manifest = firstCompile.json?.data?.manifest || {};
  expect(manifest).toMatchObject({
    integrationId,
    sourceKind: 'native_pack',
    packVersionId: String(firstCompile.json?.data?.packVersionId || ''),
    contentHash: String(firstCompile.json?.data?.contentHash || ''),
    compatibility: {
      experienceKind: 'web.portal',
      minClientVersion: '0.1.0',
      websiteRegistryId: 'ws_github',
      integrationRegistryId: 'wi_github_issue_reply',
      versionId: 'rv_github_issue_reply_v1',
    },
  });
  expect(Object.keys(manifest.files || {}).sort()).toEqual(REQUIRED_PACK_FILES);
  expect(Object.keys(manifest.fileHashes || {}).sort()).toEqual([
    'heartbeat.md',
    'manual/skill.md',
    'overlay.json',
    'policy.json',
    'provenance.json',
    'tools.md',
    'trace_map.json',
  ]);

  const replayCompile = await compilePlatformIntegration(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    integrationId,
    idempotencyKey: 'integration-compile-richer-001',
  });
  expect(replayCompile.status).toBe(200);
  expect(replayCompile.json?.data).toMatchObject({
    packVersionId: firstCompile.json?.data?.packVersionId,
    contentHash: firstCompile.json?.data?.contentHash,
  });
  expect(replayCompile.json?.data?.fileHashes).toEqual(fileHashes);

  const missingCompile = await compilePlatformIntegration(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    integrationId: 'intcand_missing_t246',
    idempotencyKey: 'integration-compile-richer-missing-001',
  });
  expect(missingCompile.status).toBe(404);
  expect(String(missingCompile.json?.error?.code || '')).toBe('INTEGRATION_NOT_FOUND');
});
