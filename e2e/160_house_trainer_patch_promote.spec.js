const { test, expect } = require('@playwright/test');

const { getTableCount, resetPortalWebState } = require('./helpers/portal_web');
const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  createPlatformConfigVersion,
  createPlatformTrainerJob,
  getPlatformConfigVersionRecord,
  getPlatformTeamBinding,
  getPlatformTrainerResult,
  promotePlatformConfigVersion,
} = require('./helpers/unified_platform');

const FIXTURE_APPROVAL_ID = 'appr_fixture_approved_01';

function buildConfigPayload(configVersionId, teamId) {
  return {
    configVersionId,
    teamId,
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

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M20.4: House Trainer enforces approval and promotes one new config version through the UI', async ({ page, request }) => {
  const seededHouse = await seedRecoverableTokenHouse(request);
  const configVersionId = 'cfg_house_promote_team_alpha_01';
  const teamId = 'team_alpha';
  const configResp = await createPlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'house-promote-config-001',
    payload: buildConfigPayload(configVersionId, teamId),
  });
  expect(configResp.status).toBe(201);
  const promotedConfig = await promotePlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    configVersionId,
    teamId,
    idempotencyKey: 'house-promote-config-promote-001',
  });
  expect(promotedConfig.status).toBe(200);

  const trainerJob = await createPlatformTrainerJob(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'house-promote-trainer-job-001',
    payload: {
      teamId,
      jobKind: 'trainer_job.compare',
      targets: {
        configVersionIds: [configVersionId],
      },
      budget: {
        maxUsd: 5,
      },
    },
  });
  expect(trainerJob.status).toBe(201);
  const trainerResultId = String(trainerJob.json?.data?.result?.trainerResultId || '');
  expect(trainerResultId).toMatch(/^trr_/);
  const trainerResult = await getPlatformTrainerResult(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    trainerResultId,
  });
  expect(trainerResult.status).toBe(200);
  const candidatePatchId = String(trainerResult.json?.data?.candidatePatchIds?.[0] || '');
  expect(candidatePatchId).toMatch(/^patch_/);

  const configCountBefore = await getTableCount(request, 'config_versions');
  const parentConfigRecord = await getPlatformConfigVersionRecord(request, configVersionId);
  expect(parentConfigRecord.status).toBe(200);
  const parentConfigHashBefore = String(parentConfigRecord.json?.config?.configHash || '');

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const attached = await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId,
  });
  expect(attached.status).toBe(200);

  await page.getByTestId('house-open-house-trainer').click();
  await expect(page.locator(`#houseTrainerResults button[data-trainer-result-id="${trainerResultId}"]`)).toHaveCount(1);
  await page.locator(`#houseTrainerResults button[data-trainer-result-id="${trainerResultId}"]`).click();

  await page.getByTestId('house-trainer-promote-patch').click();
  await expect(page.getByTestId('house-trainer-action-status')).toContainText('APPROVAL_REQUIRED');

  await page.getByTestId('house-trainer-approval-input').fill(FIXTURE_APPROVAL_ID);
  await page.getByTestId('house-trainer-promote-patch').click();
  await expect(page.getByTestId('house-trainer-action-status')).toContainText('Promoted patch');

  const configCountAfter = await getTableCount(request, 'config_versions');
  expect(configCountAfter).toBe(configCountBefore + 1);

  const bindingAfter = await getPlatformTeamBinding(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    teamId,
  });
  expect(bindingAfter.status).toBe(200);
  const nextConfigVersionId = String(bindingAfter.json?.data?.activeConfigVersionId || '');
  expect(nextConfigVersionId).toMatch(/^cfg_/);
  expect(nextConfigVersionId).not.toBe(configVersionId);

  const parentConfigRecordAfter = await getPlatformConfigVersionRecord(request, configVersionId);
  expect(parentConfigRecordAfter.status).toBe(200);
  expect(String(parentConfigRecordAfter.json?.config?.configHash || '')).toBe(parentConfigHashBefore);

  await expect(page.getByTestId('house-trainer-detail')).toContainText(nextConfigVersionId);
  await expect(page.getByTestId('house-trainer-detail')).toContainText(candidatePatchId);
});
