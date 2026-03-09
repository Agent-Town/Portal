const { test, expect } = require('@playwright/test');

const { resetPortalWebState } = require('./helpers/portal_web');
const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const {
  createPlatformConfigVersion,
  getPlatformCounts,
} = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

function buildConfigPayload(overrides = {}) {
  return {
    configVersionId: 'cfg_component_pin_candidate_01',
    teamId: 'team_main',
    displayVersion: 'web-main@2026.03.09-1',
    branch: 'season-lock',
    status: 'candidate',
    componentRefs: {
      housePolicyVersionId: 'hpv_20260309_01',
      teamCompositionVersionId: 'tcv_20260309_01',
      agentConfigVersionIds: ['agv_20260309_01', 'agv_20260309_02'],
      officePolicyVersionIds: [],
      experiencePresetVersionId: 'epv_20260309_01',
      integrationOverlayVersionIds: [],
      trainerPresetVersionId: 'tpv_20260309_01',
    },
    ...overrides,
  };
}

test('M19.8: config publish pins immutable component versions and rejects mutable aliases', async ({ request }) => {
  const seededHouse = await seedRecoverableTokenHouse(request);
  const beforeCounts = await getPlatformCounts(request);

  const mutableResp = await createPlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'config-component-mutable-001',
    payload: buildConfigPayload({
      configVersionId: 'cfg_component_pin_mutable_01',
      componentRefs: {
        housePolicyVersionId: 'stable',
        teamCompositionVersionId: 'tcv_20260309_01',
        agentConfigVersionIds: ['agv_20260309_01'],
        officePolicyVersionIds: [],
        experiencePresetVersionId: 'epv_20260309_01',
        integrationOverlayVersionIds: [],
        trainerPresetVersionId: 'tpv_20260309_01',
      },
    }),
  });
  expect(mutableResp.status).toBe(409);
  expect(String(mutableResp.json?.error?.code || '')).toBe('CONFIG_COMPONENT_MUTABLE_REF');

  const afterMutableCounts = await getPlatformCounts(request);
  expect(Number(afterMutableCounts.counts?.config_versions || 0)).toBe(Number(beforeCounts.counts?.config_versions || 0));
  expect(Number(afterMutableCounts.counts?.config_component_versions || 0)).toBe(Number(beforeCounts.counts?.config_component_versions || 0));

  const acceptedResp = await createPlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'config-component-immutable-001',
    payload: buildConfigPayload(),
  });
  expect(acceptedResp.status).toBe(201);
  expect(acceptedResp.json?.ok).toBe(true);

  const data = acceptedResp.json?.data || {};
  expect(String(data?.configVersionId || '')).toBe('cfg_component_pin_candidate_01');
  expect(String(data?.configHash || '')).toMatch(/^sha256:/);
  expect(String(data?.config?.configHash || '')).toBe(String(data?.configHash || ''));

  const componentVersions = Array.isArray(data?.componentVersions) ? data.componentVersions : [];
  expect(componentVersions).toHaveLength(6);
  expect(componentVersions.every((row) => !['stable', 'latest'].includes(String(row?.immutableVersionId || '').toLowerCase()))).toBe(true);

  const resolvedComponents = data?.config?.manifest?.resolvedComponents || {};
  expect(resolvedComponents).toMatchObject({
    housePolicyVersionId: 'hpv_20260309_01',
    teamCompositionVersionId: 'tcv_20260309_01',
    experiencePresetVersionId: 'epv_20260309_01',
    trainerPresetVersionId: 'tpv_20260309_01',
  });
  expect(resolvedComponents.agentConfigVersionIds).toEqual(['agv_20260309_01', 'agv_20260309_02']);
  expect(String(data?.config?.manifest?.resolvedComponentHashes?.housePolicyVersionId || '')).toMatch(/^sha256:/);

  const afterAcceptedCounts = await getPlatformCounts(request);
  expect(Number(afterAcceptedCounts.counts?.config_versions || 0) - Number(beforeCounts.counts?.config_versions || 0)).toBe(1);
  expect(Number(afterAcceptedCounts.counts?.config_component_versions || 0) - Number(beforeCounts.counts?.config_component_versions || 0)).toBe(6);
});
