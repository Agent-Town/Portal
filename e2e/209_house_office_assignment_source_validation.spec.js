const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  createPlatformConfigVersion,
  createPlatformTrainerJob,
  promotePlatformConfigVersion,
} = require('./helpers/unified_platform');

function buildConfigPayload(configVersionId, teamId, branch) {
  return {
    configVersionId,
    teamId,
    displayVersion: `${configVersionId}@2026.03.11`,
    branch,
    status: 'candidate',
    componentRefs: {
      housePolicyVersionId: `hpv_${configVersionId}`,
      teamCompositionVersionId: `tcv_${configVersionId}`,
      agentConfigVersionIds: [`agv_${configVersionId}`],
      officePolicyVersionIds: [],
      experiencePresetVersionId: `epv_${configVersionId}`,
      integrationOverlayVersionIds: [],
      trainerPresetVersionId: `tpv_${configVersionId}`,
    },
  };
}

async function seedAssignmentValidationScenario(request) {
  const seededHouse = await seedRecoverableTokenHouse(request);

  const mainConfigVersionId = 'cfg_house_office_assignment_validation_main_01';
  const otherConfigVersionId = 'cfg_house_office_assignment_validation_other_01';

  const createdMainConfig = await createPlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'house-office-assignment-validation-main-config-001',
    payload: buildConfigPayload(mainConfigVersionId, 'team_main', 'house-office-assignment-validation-main'),
  });
  expect(createdMainConfig.status).toBe(201);

  const createdOtherConfig = await createPlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'house-office-assignment-validation-other-config-001',
    payload: buildConfigPayload(otherConfigVersionId, 'team_shadow', 'house-office-assignment-validation-other'),
  });
  expect(createdOtherConfig.status).toBe(201);

  const promotedMain = await promotePlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    configVersionId: mainConfigVersionId,
    teamId: 'team_main',
    idempotencyKey: 'house-office-assignment-validation-main-promote-001',
  });
  expect(promotedMain.status).toBe(200);

  const mainTrainerJob = await createPlatformTrainerJob(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'house-office-assignment-validation-main-trainer-001',
    payload: {
      teamId: 'team_main',
      jobKind: 'trainer_job.compare',
      targets: {
        configVersionIds: [mainConfigVersionId],
      },
      budget: {
        maxUsd: 5,
      },
    },
  });
  expect(mainTrainerJob.status).toBe(201);

  const otherTrainerJob = await createPlatformTrainerJob(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'house-office-assignment-validation-other-trainer-001',
    payload: {
      teamId: 'team_shadow',
      jobKind: 'trainer_job.compare',
      targets: {
        configVersionIds: [otherConfigVersionId],
      },
      budget: {
        maxUsd: 5,
      },
    },
  });
  expect(otherTrainerJob.status).toBe(201);

  return {
    seededHouse,
    validTrainerResultId: String(mainTrainerJob.json?.data?.result?.trainerResultId || ''),
    validTrainerJobId: String(mainTrainerJob.json?.data?.trainerJobId || ''),
    outOfScopeTrainerResultId: String(otherTrainerJob.json?.data?.result?.trainerResultId || ''),
  };
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M32.4: House Office assignments validate source kind, record existence, and team scope', async ({ page, request }) => {
  const scenario = await seedAssignmentValidationScenario(request);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const attached = await attachHouseToPageSession(page, {
    houseId: scenario.seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const basePayload = {
    officeId: 'office_fixture_ops',
    staffAgentId: 'staff_fixture_operator',
    focus: 'Review trainer readiness',
  };

  const unsupportedResponse = await page.request.post('/api/platform/house-office/assignments', {
    data: {
      ...basePayload,
      sourceKind: 'mystery_ref',
      sourceId: 'mystery_001',
    },
    failOnStatusCode: false,
  });
  expect(unsupportedResponse.status()).toBe(400);
  const unsupportedBody = await unsupportedResponse.json();
  expect(unsupportedBody?.error?.code).toBe('SOURCE_REF_KIND_UNSUPPORTED');

  const missingResponse = await page.request.post('/api/platform/house-office/assignments', {
    data: {
      ...basePayload,
      sourceKind: 'trainer_result',
      sourceId: 'trr_missing_assignment_source',
    },
    failOnStatusCode: false,
  });
  expect(missingResponse.status()).toBe(404);
  const missingBody = await missingResponse.json();
  expect(missingBody?.error?.code).toBe('SOURCE_REF_NOT_FOUND');

  const scopeMismatchResponse = await page.request.post('/api/platform/house-office/assignments', {
    data: {
      ...basePayload,
      sourceKind: 'trainer_result',
      sourceId: scenario.outOfScopeTrainerResultId,
    },
    failOnStatusCode: false,
  });
  expect(scopeMismatchResponse.status()).toBe(409);
  const scopeMismatchBody = await scopeMismatchResponse.json();
  expect(scopeMismatchBody?.error?.code).toBe('SOURCE_REF_SCOPE_MISMATCH');

  const beforeValidResponse = await page.request.get('/api/platform/house-office');
  expect(beforeValidResponse.ok()).toBe(true);
  const beforeValidBody = await beforeValidResponse.json();
  expect(beforeValidBody?.data?.summary?.assignmentCount || 0).toBe(0);

  const validResponse = await page.request.post('/api/platform/house-office/assignments', {
    data: {
      ...basePayload,
      sourceKind: 'trainer_result',
      sourceId: scenario.validTrainerResultId,
    },
    failOnStatusCode: false,
  });
  expect(validResponse.status()).toBe(200);
  const validBody = await validResponse.json();
  expect(validBody?.data).toMatchObject({
    sourceKind: 'trainer_result',
    sourceId: scenario.validTrainerResultId,
    deepLink: {
      kind: 'house_surface',
      surface: 'trainer',
      selection: {
        kind: 'trainer_result',
        trainerResultId: scenario.validTrainerResultId,
        trainerJobId: scenario.validTrainerJobId,
      },
    },
    sourceRefs: [
      {
        sourceKind: 'trainer_result',
        sourceId: scenario.validTrainerResultId,
        entryPath: '/api/platform/trainer',
        selection: {
          kind: 'trainer_result',
          trainerResultId: scenario.validTrainerResultId,
          trainerJobId: scenario.validTrainerJobId,
        },
      },
    ],
  });

  const repeatValidResponse = await page.request.post('/api/platform/house-office/assignments', {
    data: {
      ...basePayload,
      sourceKind: 'trainer_result',
      sourceId: scenario.validTrainerResultId,
    },
    failOnStatusCode: false,
  });
  expect(repeatValidResponse.status()).toBe(200);
  const repeatValidBody = await repeatValidResponse.json();
  expect(repeatValidBody?.data?.assignmentId).toBe(validBody?.data?.assignmentId);
  expect(repeatValidBody?.data?.startedAt).toBe(validBody?.data?.startedAt);
});
