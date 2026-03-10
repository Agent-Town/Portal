const { test, expect } = require('@playwright/test');

const { resetPortalWebState } = require('./helpers/portal_web');
const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const {
  createPlatformConfigVersion,
  createPlatformTrainerJob,
  getPlatformCounts,
  getPlatformFixture,
  getPlatformTrainerResult,
  promotePlatformConfigVersion,
} = require('./helpers/unified_platform');

function buildConfigPayload(configVersionId, {
  displayVersion = `${configVersionId}@2026.03.10`,
  branch = 'season-lock',
  housePolicyVersionId = 'hpv_20260310_01',
  agentConfigVersionIds = ['agv_20260310_01'],
  trainerPresetVersionId = 'tpv_20260310_01',
} = {}) {
  return {
    configVersionId,
    teamId: 'team_main',
    displayVersion,
    branch,
    status: 'candidate',
    componentRefs: {
      housePolicyVersionId,
      teamCompositionVersionId: 'tcv_20260310_01',
      agentConfigVersionIds,
      officePolicyVersionIds: [],
      experiencePresetVersionId: 'epv_20260310_01',
      integrationOverlayVersionIds: [],
      trainerPresetVersionId,
    },
  };
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M25.1: compare jobs derive real trainer results and persist stable artifact refs', async ({ request }) => {
  const seededHouse = await seedRecoverableTokenHouse(request);
  const fixture = await getPlatformFixture(request, 'trainer_real_result_seed');
  expect(fixture?.ok).toBe(true);
  const expectedArtifactKind = String(fixture?.fixture?.expectedArtifacts?.[0]?.artifactKind || 'trainer_report');

  const configA = await createPlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'trainer-real-config-a-001',
    payload: buildConfigPayload('cfg_trainer_real_a_01'),
  });
  expect(configA.status).toBe(201);

  const configB = await createPlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'trainer-real-config-b-001',
    payload: buildConfigPayload('cfg_trainer_real_b_01', {
      displayVersion: 'cfg_trainer_real_b_01@2026.03.11',
      housePolicyVersionId: 'hpv_20260310_02',
      agentConfigVersionIds: ['agv_20260310_02', 'agv_20260310_03'],
      trainerPresetVersionId: 'tpv_20260310_02',
    }),
  });
  expect(configB.status).toBe(201);

  const activateBase = await promotePlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    configVersionId: 'cfg_trainer_real_a_01',
    teamId: 'team_main',
    idempotencyKey: 'trainer-real-config-activate-001',
  });
  expect(activateBase.status).toBe(200);

  const beforeCounts = await getPlatformCounts(request);
  const firstJob = await createPlatformTrainerJob(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'trainer-real-job-001',
    payload: {
      teamId: 'team_main',
      jobKind: 'trainer_job.compare',
      targets: {
        configVersionIds: ['cfg_trainer_real_a_01', 'cfg_trainer_real_b_01'],
      },
      budget: {
        maxUsd: 5,
      },
    },
  });
  expect(firstJob.status).toBe(201);
  const trainerResultIdA = String(firstJob.json?.data?.result?.trainerResultId || '');
  expect(trainerResultIdA).toMatch(/^trr_/);

  const resultA = await getPlatformTrainerResult(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    trainerResultId: trainerResultIdA,
  });
  expect(resultA.status).toBe(200);
  expect(String(resultA.json?.data?.summary || '')).not.toBe('Compare job completed with one candidate patch recommendation.');
  expect(String(resultA.json?.data?.summary || '')).toContain('Compared 2 config versions');
  expect(Array.isArray(resultA.json?.data?.candidatePatchIds)).toBe(true);
  expect(String(resultA.json?.data?.candidatePatchIds?.[0] || '')).not.toBe('patch_fixture_01');
  expect(Array.isArray(resultA.json?.data?.artifactRefs)).toBe(true);
  expect(resultA.json?.data?.artifactRefs).toHaveLength(1);
  expect(resultA.json?.data?.artifactRefs?.[0]).toMatchObject({
    artifactKind: expectedArtifactKind,
  });
  expect(String(resultA.json?.data?.artifactRefs?.[0]?.traceArtifactId || '')).toMatch(/^ta_/);
  expect(String(resultA.json?.data?.artifactRefs?.[0]?.contentHash || '')).toMatch(/^sha256:/);

  const afterFirstCounts = await getPlatformCounts(request);
  expect(Number(afterFirstCounts.counts?.trainer_results || 0) - Number(beforeCounts.counts?.trainer_results || 0)).toBe(1);
  expect(Number(afterFirstCounts.counts?.trace_artifacts || 0) - Number(beforeCounts.counts?.trace_artifacts || 0)).toBe(1);

  const secondJob = await createPlatformTrainerJob(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'trainer-real-job-002',
    payload: {
      teamId: 'team_main',
      jobKind: 'trainer_job.compare',
      targets: {
        configVersionIds: ['cfg_trainer_real_a_01', 'cfg_trainer_real_b_01'],
      },
      budget: {
        maxUsd: 5,
      },
    },
  });
  expect(secondJob.status).toBe(201);
  const trainerResultIdB = String(secondJob.json?.data?.result?.trainerResultId || '');
  const resultB = await getPlatformTrainerResult(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    trainerResultId: trainerResultIdB,
  });
  expect(resultB.status).toBe(200);
  expect(resultB.json?.data?.artifactRefs).toEqual(resultA.json?.data?.artifactRefs);

  const afterSecondCounts = await getPlatformCounts(request);
  expect(Number(afterSecondCounts.counts?.trainer_results || 0) - Number(afterFirstCounts.counts?.trainer_results || 0)).toBe(1);
  expect(Number(afterSecondCounts.counts?.trace_artifacts || 0) - Number(afterFirstCounts.counts?.trace_artifacts || 0)).toBe(0);
});
