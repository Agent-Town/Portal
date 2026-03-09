const { test, expect } = require('@playwright/test');

const { resetPortalWebState } = require('./helpers/portal_web');
const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const {
  createPlatformConfigVersion,
  createPlatformTrainerJob,
  getPlatformConfigVersionRecord,
  getPlatformCounts,
  getPlatformTeamBinding,
  getPlatformTrainerJob,
  getPlatformTrainerResult,
  promotePlatformConfigVersion,
  promotePlatformTrainerResultPatch,
} = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

function buildConfigPayload(configVersionId) {
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
  };
}

test('M19.14: seeded compare jobs emit one result and approved patch promotion creates a new config lineage node', async ({ request }) => {
  const seededHouse = await seedRecoverableTokenHouse(request);

  const baseConfig = await createPlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'trainer-promotion-config-001',
    payload: buildConfigPayload('cfg_trainer_base_01'),
  });
  expect(baseConfig.status).toBe(201);

  const activateBase = await promotePlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    configVersionId: 'cfg_trainer_base_01',
    teamId: 'team_main',
    idempotencyKey: 'trainer-promotion-config-activate-001',
  });
  expect(activateBase.status).toBe(200);

  const beforeCounts = await getPlatformCounts(request);
  const createdJob = await createPlatformTrainerJob(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'trainer-result-job-001',
    payload: {
      teamId: 'team_main',
      jobKind: 'trainer_job.compare',
      targets: {
        configVersionIds: ['cfg_trainer_base_01'],
      },
      budget: {
        maxUsd: 5,
      },
    },
  });
  expect(createdJob.status).toBe(201);

  const job = await getPlatformTrainerJob(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    trainerJobId: String(createdJob.json?.data?.trainerJobId || ''),
  });
  expect(job.status).toBe(200);
  expect(String(job.json?.data?.status || '')).toBe('succeeded');
  const trainerResultId = String(job.json?.data?.result?.trainerResultId || '');
  expect(trainerResultId).toMatch(/^trr_/);

  const afterJobCounts = await getPlatformCounts(request);
  expect(Number(afterJobCounts.counts?.trainer_results || 0) - Number(beforeCounts.counts?.trainer_results || 0)).toBe(1);

  const result = await getPlatformTrainerResult(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    trainerResultId,
  });
  expect(result.status).toBe(200);
  expect(String(result.json?.data?.trainerResultId || '')).toBe(trainerResultId);
  expect(Array.isArray(result.json?.data?.candidatePatchIds)).toBe(true);
  expect(result.json?.data?.candidatePatchIds.length).toBeGreaterThan(0);

  const candidatePatchId = String(result.json?.data?.candidatePatchIds?.[0] || '');
  expect(candidatePatchId).toBeTruthy();

  const blockedPromotion = await promotePlatformTrainerResultPatch(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    trainerResultId,
    idempotencyKey: 'trainer-result-promote-blocked-001',
    payload: {
      teamId: 'team_main',
      candidatePatchId,
    },
  });
  expect(blockedPromotion.status).toBe(409);
  expect(String(blockedPromotion.json?.error?.code || '')).toBe('APPROVAL_REQUIRED');

  const beforePromotionCounts = await getPlatformCounts(request);
  const approvedPromotion = await promotePlatformTrainerResultPatch(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    trainerResultId,
    idempotencyKey: 'trainer-result-promote-approved-001',
    payload: {
      teamId: 'team_main',
      candidatePatchId,
      approvalId: 'appr_fixture_approved_01',
    },
  });
  expect(approvedPromotion.status).toBe(201);
  const promotedConfigVersionId = String(approvedPromotion.json?.data?.configVersionId || '');
  expect(promotedConfigVersionId).toMatch(/^cfg_/);
  expect(String(approvedPromotion.json?.data?.activeConfigVersionId || '')).toBe(promotedConfigVersionId);

  const afterPromotionCounts = await getPlatformCounts(request);
  expect(Number(afterPromotionCounts.counts?.config_versions || 0) - Number(beforePromotionCounts.counts?.config_versions || 0)).toBe(1);

  const promotedConfig = await getPlatformConfigVersionRecord(request, promotedConfigVersionId);
  expect(promotedConfig.status).toBe(200);
  expect(promotedConfig.json?.config?.lineage?.trainerJobId || '').toBe(String(createdJob.json?.data?.trainerJobId || ''));
  expect(promotedConfig.json?.config?.lineage?.trainerResultId || '').toBe(trainerResultId);
  expect(promotedConfig.json?.config?.lineage?.candidatePatchId || '').toBe(candidatePatchId);

  const activeBinding = await getPlatformTeamBinding(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    teamId: 'team_main',
  });
  expect(activeBinding.status).toBe(200);
  expect(String(activeBinding.json?.data?.activeConfigVersionId || '')).toBe(promotedConfigVersionId);
});
