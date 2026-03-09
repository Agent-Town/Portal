const { test, expect } = require('@playwright/test');

const { resetPortalWebState } = require('./helpers/portal_web');
const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const {
  createPlatformConfigVersion,
  getPlatformConfigVersionRecord,
  getPlatformTeamBinding,
  promotePlatformConfigVersion,
} = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

function buildConfigPayload(configVersionId, overrides = {}) {
  return {
    configVersionId,
    teamId: 'team_main',
    displayVersion: `${configVersionId}@2026.03.09`,
    branch: 'season-lock',
    status: 'candidate',
    componentRefs: {
      housePolicyVersionId: 'hpv_20260309_01',
      teamCompositionVersionId: 'tcv_20260309_01',
      agentConfigVersionIds: ['agv_20260309_01'],
      officePolicyVersionIds: [],
      experiencePresetVersionId: 'epv_20260309_01',
      integrationOverlayVersionIds: [],
      trainerPresetVersionId: 'tpv_20260309_01',
    },
    ...overrides,
  };
}

test('M19.9: promotion changes only active binding and rollback preserves historical config hashes', async ({ request }) => {
  const seededHouse = await seedRecoverableTokenHouse(request);

  const configAResp = await createPlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'config-promotion-a-create-001',
    payload: buildConfigPayload('cfg_promotion_lineage_a_01'),
  });
  expect(configAResp.status).toBe(201);
  const configAHash = String(configAResp.json?.data?.configHash || '');
  expect(configAHash).toMatch(/^sha256:/);

  const configBResp = await createPlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'config-promotion-b-create-001',
    payload: buildConfigPayload('cfg_promotion_lineage_b_01', {
      parentConfigVersionIds: ['cfg_promotion_lineage_a_01'],
      componentRefs: {
        housePolicyVersionId: 'hpv_20260309_01',
        teamCompositionVersionId: 'tcv_20260309_02',
        agentConfigVersionIds: ['agv_20260309_02'],
        officePolicyVersionIds: [],
        experiencePresetVersionId: 'epv_20260309_01',
        integrationOverlayVersionIds: [],
        trainerPresetVersionId: 'tpv_20260309_01',
      },
    }),
  });
  expect(configBResp.status).toBe(201);
  const configBHash = String(configBResp.json?.data?.configHash || '');
  expect(configBHash).toMatch(/^sha256:/);
  expect(configBHash).not.toBe(configAHash);

  const promoteA = await promotePlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    configVersionId: 'cfg_promotion_lineage_a_01',
    teamId: 'team_main',
    idempotencyKey: 'config-promotion-a-promote-001',
  });
  expect(promoteA.status).toBe(200);

  const activeAfterA = await getPlatformTeamBinding(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    teamId: 'team_main',
  });
  expect(activeAfterA.status).toBe(200);
  expect(String(activeAfterA.json?.data?.activeConfigVersionId || '')).toBe('cfg_promotion_lineage_a_01');
  expect(String(activeAfterA.json?.data?.activeConfigHash || '')).toBe(configAHash);

  const promoteB = await promotePlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    configVersionId: 'cfg_promotion_lineage_b_01',
    teamId: 'team_main',
    idempotencyKey: 'config-promotion-b-promote-001',
  });
  expect(promoteB.status).toBe(200);

  const activeAfterB = await getPlatformTeamBinding(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    teamId: 'team_main',
  });
  expect(activeAfterB.status).toBe(200);
  expect(String(activeAfterB.json?.data?.activeConfigVersionId || '')).toBe('cfg_promotion_lineage_b_01');
  expect(String(activeAfterB.json?.data?.activeConfigHash || '')).toBe(configBHash);
  expect(activeAfterB.json?.data?.config?.lineage?.parentConfigVersionIds || []).toEqual(['cfg_promotion_lineage_a_01']);

  const rollbackToA = await promotePlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    configVersionId: 'cfg_promotion_lineage_a_01',
    teamId: 'team_main',
    idempotencyKey: 'config-promotion-a-rollback-001',
  });
  expect(rollbackToA.status).toBe(200);

  const activeAfterRollback = await getPlatformTeamBinding(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    teamId: 'team_main',
  });
  expect(activeAfterRollback.status).toBe(200);
  expect(String(activeAfterRollback.json?.data?.activeConfigVersionId || '')).toBe('cfg_promotion_lineage_a_01');
  expect(String(activeAfterRollback.json?.data?.activeConfigHash || '')).toBe(configAHash);

  const configARecord = await getPlatformConfigVersionRecord(request, 'cfg_promotion_lineage_a_01');
  const configBRecord = await getPlatformConfigVersionRecord(request, 'cfg_promotion_lineage_b_01');
  expect(configARecord.status).toBe(200);
  expect(configBRecord.status).toBe(200);
  expect(String(configARecord.json?.config?.configHash || '')).toBe(configAHash);
  expect(String(configBRecord.json?.config?.configHash || '')).toBe(configBHash);
});
