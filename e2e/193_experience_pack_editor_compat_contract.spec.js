const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const {
  compilePlatformIntegration,
  getPlatformPackCompatibility,
  resolvePlatformIntegration,
  verifyPlatformPackCompatibility,
} = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M25.10: editor compatibility stays grounded in the existing internal pack model', async ({ request }) => {
  const contract = await getPlatformPackCompatibility(request);
  expect(contract.status).toBe(200);
  expect(contract.json?.ok).toBe(true);
  expect(contract.json?.data).toMatchObject({
    schema: 'agent-town-pack-compatibility/v1',
    authoritativeManifestRoot: 'manifest.json',
    alternateManifestRootsAllowed: false,
  });
  expect(contract.json?.data?.requiredFiles).toEqual([
    'manifest.json',
    'overlay.json',
    'policy.json',
  ]);
  expect(contract.json?.data?.optionalFiles).toEqual([
    'manual/skill.md',
    'heartbeat.md',
    'tools.md',
    'trace_map.json',
    'verification.json',
    'provenance.json',
  ]);
  expect(contract.json?.data?.compatiblePackKeys).toEqual([
    'schema',
    'manifestRoot',
    'packVersionId',
    'contentHash',
    'requiredFiles',
    'optionalFiles',
    'files',
  ]);
  expect(contract.json?.data?.surfaces).toMatchObject({
    house: {
      surfaceId: 'house.workshop',
      route: '/api/platform/workshop',
    },
    registry: {
      surfaceId: 'registry.proof',
      route: '/api/registry/proof/:registryId',
    },
    web: {
      surfaceId: 'web.integration',
      route: '/v1/integrations/:integrationId/compilations',
    },
    trainer: {
      surfaceId: 'platform.trainer',
      route: '/api/platform/trainer',
    },
  });
  expect(contract.json?.data?.surfaces?.house?.compatiblePack).toEqual(contract.json?.data?.compatiblePack);
  expect(contract.json?.data?.surfaces?.registry?.compatiblePack).toEqual(contract.json?.data?.compatiblePack);
  expect(contract.json?.data?.surfaces?.web?.compatiblePack).toEqual(contract.json?.data?.compatiblePack);
  expect(contract.json?.data?.surfaces?.trainer?.compatiblePack).toEqual(contract.json?.data?.compatiblePack);
  expect(contract.json?.data?.compatiblePack).toMatchObject({
    schema: 'agent-town-compatible-pack/v1',
    manifestRoot: 'manifest.json',
    files: {
      'manifest.json': 'manifest.json',
      'overlay.json': 'overlay.json',
      'policy.json': 'policy.json',
      'manual/skill.md': 'manual/skill.md',
      'heartbeat.md': 'heartbeat.md',
      'tools.md': 'tools.md',
      'trace_map.json': 'trace_map.json',
      'verification.json': 'verification.json',
      'provenance.json': 'provenance.json',
    },
  });
  expect(String(contract.json?.data?.compatiblePack?.packVersionId || '')).toMatch(/^packcompat_/);
  expect(String(contract.json?.data?.compatiblePack?.contentHash || '')).toMatch(/^sha256:/);

  const verifiedFixture = await verifyPlatformPackCompatibility(request, {
    manifestRoot: String(contract.json?.data?.compatiblePack?.manifestRoot || ''),
    manifest: contract.json?.data?.compatiblePack,
  });
  expect(verifiedFixture.status).toBe(200);
  expect(verifiedFixture.json?.ok).toBe(true);
  expect(verifiedFixture.json?.data?.compatible).toBe(true);
  expect(verifiedFixture.json?.data?.errors).toEqual([]);
  expect(String(verifiedFixture.json?.data?.verificationHash || '')).toMatch(/^sha256:/);
  expect(verifiedFixture.json?.data?.normalized?.compatiblePack).toMatchObject({
    schema: 'agent-town-compatible-pack/v1',
    manifestRoot: 'manifest.json',
    packVersionId: String(contract.json?.data?.compatiblePack?.packVersionId || ''),
    contentHash: String(contract.json?.data?.compatiblePack?.contentHash || ''),
  });

  const seededHouse = await seedRecoverableTokenHouse(request);
  const resolved = await resolvePlatformIntegration(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    targetUrl: 'https://github.com/openai/openai-codex/issues/1',
    idempotencyKey: 'editor-pack-compat-resolve-001',
  });
  expect(resolved.status).toBe(201);
  const integrationId = String(resolved.json?.data?.integrationCandidateId || '');
  expect(integrationId).toMatch(/^intcand_/);

  const compiled = await compilePlatformIntegration(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    integrationId,
    idempotencyKey: 'editor-pack-compat-compile-001',
  });
  expect(compiled.status).toBe(201);
  expect(compiled.json?.ok).toBe(true);

  const verifiedCompiled = await verifyPlatformPackCompatibility(request, {
    manifestRoot: 'manifest.json',
    manifest: compiled.json?.data?.manifest,
    files: compiled.json?.data?.manifest?.files,
  });
  expect(verifiedCompiled.status).toBe(200);
  expect(verifiedCompiled.json?.ok).toBe(true);
  expect(verifiedCompiled.json?.data?.compatible).toBe(true);
  expect(verifiedCompiled.json?.data?.normalized?.compatiblePack).toMatchObject({
    schema: 'agent-town-compatible-pack/v1',
    manifestRoot: 'manifest.json',
    packVersionId: String(compiled.json?.data?.packVersionId || ''),
    contentHash: String(compiled.json?.data?.contentHash || ''),
  });

  const rejectedAlternateRoot = await verifyPlatformPackCompatibility(request, {
    manifestRoot: 'pack.json',
    manifest: {
      packVersionId: 'pack_editor_invalid_01',
      contentHash: 'sha256:2222222222222222222222222222222222222222222222222222222222222222',
      files: {
        'pack.json': 'pack.json',
        'overlay.json': 'overlay.json',
        'policy.json': 'policy.json',
      },
    },
  });
  expect(rejectedAlternateRoot.status).toBe(200);
  expect(rejectedAlternateRoot.json?.ok).toBe(true);
  expect(rejectedAlternateRoot.json?.data?.compatible).toBe(false);
  expect(rejectedAlternateRoot.json?.data?.errors).toEqual([
    {
      code: 'ALTERNATE_MANIFEST_ROOT',
      path: 'manifestRoot',
      message: 'Compatible packs must keep manifest.json as the authoritative manifest root.',
    },
    {
      code: 'MANIFEST_FILE_MISSING',
      path: 'files.manifest.json',
      message: 'manifest.json is required for editor-compatible packs.',
    },
  ]);
});
