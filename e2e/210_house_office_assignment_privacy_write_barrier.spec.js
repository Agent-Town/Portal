const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  createPlatformConfigVersion,
  createPlatformTrainerJob,
  getPlatformFixture,
  inspectHouseOfficePrivacyStorage,
  promotePlatformConfigVersion,
} = require('./helpers/unified_platform');

function buildConfigPayload(configVersionId) {
  return {
    configVersionId,
    teamId: 'team_main',
    displayVersion: `${configVersionId}@2026.03.11`,
    branch: 'house-office-privacy-write-barrier',
    status: 'candidate',
    componentRefs: {
      housePolicyVersionId: 'hpv_house_office_privacy_write_barrier_01',
      teamCompositionVersionId: 'tcv_house_office_privacy_write_barrier_01',
      agentConfigVersionIds: ['agv_house_office_privacy_write_barrier_01'],
      officePolicyVersionIds: [],
      experiencePresetVersionId: 'epv_house_office_privacy_write_barrier_01',
      integrationOverlayVersionIds: [],
      trainerPresetVersionId: 'tpv_house_office_privacy_write_barrier_01',
    },
  };
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M32.5: House Office blocks unsafe assignment focus before persistence and keeps safe writes working', async ({ page, request }) => {
  const assignmentsFixtureEnvelope = await getPlatformFixture(request, 'house_office_assignments_seed');
  expect(assignmentsFixtureEnvelope?.ok).toBe(true);
  const assignmentsFixture = assignmentsFixtureEnvelope?.fixture || {};
  const officeId = String(assignmentsFixture?.offices?.[0]?.officeId || '').trim();
  const staffAgentId = String(assignmentsFixture?.staffAgents?.[0]?.staffAgentId || '').trim();
  expect(officeId).toBeTruthy();
  expect(staffAgentId).toBeTruthy();

  const privacyFixtureEnvelope = await getPlatformFixture(request, 'house_office_privacy_seed');
  expect(privacyFixtureEnvelope?.ok).toBe(true);
  const privacyFixture = privacyFixtureEnvelope?.fixture || {};
  const unsafeAssignmentFocus = String(privacyFixture?.unsafeAssignmentFocus || '').trim();
  const safeAssignmentFocus = String(privacyFixture?.safeAssignmentFocus || '').trim();
  const blockedErrorCode = String(privacyFixture?.blockedErrorCode || '').trim() || 'SENSITIVE_CONTENT_BLOCKED';
  const forbiddenFields = Array.isArray(privacyFixture?.forbiddenFields) ? privacyFixture.forbiddenFields : [];
  expect(unsafeAssignmentFocus).toBeTruthy();
  expect(safeAssignmentFocus).toBeTruthy();

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);

  const seededHouse = await seedRecoverableTokenHouse(request);
  const attached = await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const configVersionId = 'cfg_house_office_privacy_write_barrier_01';
  const createdConfig = await createPlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'house-office-privacy-write-barrier-config-001',
    payload: buildConfigPayload(configVersionId),
  });
  expect(createdConfig.status).toBe(201);

  const promotedConfig = await promotePlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    configVersionId,
    teamId: 'team_main',
    idempotencyKey: 'house-office-privacy-write-barrier-promote-001',
  });
  expect(promotedConfig.status).toBe(200);

  const trainerJob = await createPlatformTrainerJob(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'house-office-privacy-write-barrier-trainer-001',
    payload: {
      teamId: 'team_main',
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

  const beforeInspection = await inspectHouseOfficePrivacyStorage(request, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(beforeInspection.ok).toBe(true);
  expect(beforeInspection.rowCount).toBe(0);

  const blockedResponse = await page.request.post('/api/platform/house-office/assignments', {
    data: {
      officeId,
      staffAgentId,
      focus: unsafeAssignmentFocus,
      sourceKind: 'trainer_result',
      sourceId: trainerResultId,
    },
    failOnStatusCode: false,
  });
  expect(blockedResponse.status()).toBe(400);
  const blockedBody = await blockedResponse.json();
  expect(blockedBody?.error?.code).toBe(blockedErrorCode);

  const afterBlockedInspection = await inspectHouseOfficePrivacyStorage(request, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(afterBlockedInspection.ok).toBe(true);
  expect(afterBlockedInspection.rowCount).toBe(0);
  const blockedStorageText = JSON.stringify(afterBlockedInspection.rows || []);
  for (const forbiddenField of forbiddenFields) {
    expect(blockedStorageText).not.toContain(String(forbiddenField || ''));
  }

  const blockedOverviewResponse = await page.request.get('/api/platform/house-office');
  expect(blockedOverviewResponse.ok()).toBe(true);
  const blockedOverviewBody = await blockedOverviewResponse.json();
  expect(blockedOverviewBody?.data?.summary?.assignmentCount || 0).toBe(0);

  const safeResponse = await page.request.post('/api/platform/house-office/assignments', {
    data: {
      officeId,
      staffAgentId,
      focus: safeAssignmentFocus,
      sourceKind: 'trainer_result',
      sourceId: trainerResultId,
    },
    failOnStatusCode: false,
  });
  expect(safeResponse.status()).toBe(200);
  const safeBody = await safeResponse.json();
  expect(safeBody?.data).toMatchObject({
    officeId,
    staffAgentId,
    focus: safeAssignmentFocus,
    sourceKind: 'trainer_result',
    sourceId: trainerResultId,
  });

  const afterSafeInspection = await inspectHouseOfficePrivacyStorage(request, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(afterSafeInspection.ok).toBe(true);
  expect(afterSafeInspection.rowCount).toBe(1);
  expect(afterSafeInspection.rows[0]).toMatchObject({
    house_id: seededHouse.houseId,
    team_id: 'team_main',
    office_id: officeId,
    staff_agent_id: staffAgentId,
    focus: safeAssignmentFocus,
    source_kind: 'trainer_result',
    source_id: trainerResultId,
  });
});
