const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const {
  attachHouseToPageSession,
  createPlatformConfigVersion,
  createPlatformTrainerJob,
  getPlatformFixture,
  promotePlatformConfigVersion,
  readWorkerSessionId,
} = require('./helpers/unified_platform');
const { waitForLiteApi } = require('./helpers/trainer');

function buildConfigPayload(configVersionId) {
  return {
    configVersionId,
    teamId: 'team_main',
    displayVersion: `${configVersionId}@2026.03.11`,
    branch: 'house-office-assignments-contract',
    status: 'candidate',
    componentRefs: {
      housePolicyVersionId: 'hpv_house_office_assignments_contract_01',
      teamCompositionVersionId: 'tcv_house_office_assignments_contract_01',
      agentConfigVersionIds: ['agv_house_office_assignments_contract_01'],
      officePolicyVersionIds: [],
      experiencePresetVersionId: 'epv_house_office_assignments_contract_01',
      integrationOverlayVersionIds: [],
      trainerPresetVersionId: 'tpv_house_office_assignments_contract_01',
    },
  };
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M29.5: House Office staff assignments are deterministic, idempotent, and preserve current House flows', async ({ page, request }) => {
  const fixtureEnvelope = await getPlatformFixture(request, 'house_office_assignments_seed');
  expect(fixtureEnvelope?.ok).toBe(true);
  const fixture = fixtureEnvelope?.fixture || {};
  const officeId = String(fixture?.offices?.[0]?.officeId || '').trim();
  const staffAgentId = String(fixture?.staffAgents?.[0]?.staffAgentId || '').trim();
  const expectedErrorCodes = Array.isArray(fixture?.expectedErrorCodes) ? fixture.expectedErrorCodes : [];
  expect(officeId).toBeTruthy();
  expect(staffAgentId).toBeTruthy();

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);

  const noHouseResponse = await page.request.post('/api/platform/house-office/assignments', {
    data: {
      officeId,
      staffAgentId,
      focus: 'Review trainer readiness',
      sourceKind: 'trainer_result',
      sourceId: 'trainer_result_fixture_ops_review',
    },
    failOnStatusCode: false,
  });
  expect(noHouseResponse.status()).toBe(409);
  const noHouseBody = await noHouseResponse.json();
  expect(noHouseBody?.error?.code).toBe('HOUSE_REQUIRED');

  const seededHouse = await seedRecoverableTokenHouse(request);
  const attachedWithoutTeam = await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
  });
  expect(attachedWithoutTeam.status).toBe(200);

  const noTeamResponse = await page.request.post('/api/platform/house-office/assignments', {
    data: {
      officeId,
      staffAgentId,
      focus: 'Review trainer readiness',
      sourceKind: 'trainer_result',
      sourceId: 'trainer_result_fixture_ops_review',
    },
    failOnStatusCode: false,
  });
  expect(noTeamResponse.status()).toBe(409);
  const noTeamBody = await noTeamResponse.json();
  expect(noTeamBody?.error?.code).toBe('ACTIVE_TEAM_REQUIRED');

  const attachedWithTeam = await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(attachedWithTeam.status).toBe(200);

  const invalidArgumentResponse = await page.request.post('/api/platform/house-office/assignments', {
    data: {
      officeId,
      staffAgentId,
      focus: '',
      sourceKind: 'trainer_result',
      sourceId: 'trainer_result_fixture_ops_review',
    },
    failOnStatusCode: false,
  });
  expect(invalidArgumentResponse.status()).toBe(400);
  const invalidArgumentBody = await invalidArgumentResponse.json();
  expect(invalidArgumentBody?.error?.code).toBe('INVALID_ARGUMENT');

  const missingOfficeResponse = await page.request.post('/api/platform/house-office/assignments', {
    data: {
      officeId: 'office_missing',
      staffAgentId,
      focus: 'Review trainer readiness',
      sourceKind: 'trainer_result',
      sourceId: 'trainer_result_fixture_ops_review',
    },
    failOnStatusCode: false,
  });
  expect(missingOfficeResponse.status()).toBe(404);
  const missingOfficeBody = await missingOfficeResponse.json();
  expect(missingOfficeBody?.error?.code).toBe('OFFICE_NOT_FOUND');

  const missingStaffResponse = await page.request.post('/api/platform/house-office/assignments', {
    data: {
      officeId,
      staffAgentId: 'staff_missing',
      focus: 'Review trainer readiness',
      sourceKind: 'trainer_result',
      sourceId: 'trainer_result_fixture_ops_review',
    },
    failOnStatusCode: false,
  });
  expect(missingStaffResponse.status()).toBe(404);
  const missingStaffBody = await missingStaffResponse.json();
  expect(missingStaffBody?.error?.code).toBe('STAFF_AGENT_NOT_FOUND');

  expect([
    noHouseBody?.error?.code,
    noTeamBody?.error?.code,
    missingOfficeBody?.error?.code,
    missingStaffBody?.error?.code,
    invalidArgumentBody?.error?.code,
  ].sort()).toEqual([...expectedErrorCodes].sort());

  const beforeCreateOverviewResponse = await page.request.get('/api/platform/house-office');
  expect(beforeCreateOverviewResponse.ok()).toBe(true);
  const beforeCreateOverview = await beforeCreateOverviewResponse.json();
  expect(beforeCreateOverview?.data?.assignments || []).toEqual([]);
  expect(beforeCreateOverview?.data?.summary?.assignmentCount || 0).toBe(0);

  const configVersionId = 'cfg_house_office_assignments_contract_01';
  const createdConfig = await createPlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'house-office-assignments-config-001',
    payload: buildConfigPayload(configVersionId),
  });
  expect(createdConfig.status).toBe(201);

  const promotedConfig = await promotePlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    configVersionId,
    teamId: 'team_main',
    idempotencyKey: 'house-office-assignments-promote-001',
  });
  expect(promotedConfig.status).toBe(200);

  const trainerJob = await createPlatformTrainerJob(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'house-office-assignments-trainer-001',
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
  const trainerJobId = String(trainerJob.json?.data?.trainerJobId || '');
  expect(trainerResultId).toMatch(/^trr_/);

  const validPayload = {
    officeId,
    staffAgentId,
    focus: 'Review trainer readiness',
    sourceKind: 'trainer_result',
    sourceId: trainerResultId,
  };
  const createResponse = await page.request.post('/api/platform/house-office/assignments', {
    data: validPayload,
    failOnStatusCode: false,
  });
  expect(createResponse.status()).toBe(200);
  const createBody = await createResponse.json();
  expect(createBody?.data).toMatchObject({
    staffAgentId,
    officeId,
    focus: validPayload.focus,
    sourceKind: validPayload.sourceKind,
    sourceId: validPayload.sourceId,
    deepLink: expect.objectContaining({
      kind: 'house_surface',
      surface: 'trainer',
      selection: {
        kind: 'trainer_result',
        trainerResultId,
        trainerJobId,
      },
    }),
  });
  expect(String(createBody?.data?.assignmentId || '')).toMatch(/^assign_[a-f0-9]{24}$/);

  const repeatResponse = await page.request.post('/api/platform/house-office/assignments', {
    data: validPayload,
    failOnStatusCode: false,
  });
  expect(repeatResponse.status()).toBe(200);
  const repeatBody = await repeatResponse.json();
  expect(repeatBody?.data?.assignmentId).toBe(createBody?.data?.assignmentId);
  expect(repeatBody?.data?.startedAt).toBe(createBody?.data?.startedAt);

  const overviewResponse = await page.request.get('/api/platform/house-office');
  expect(overviewResponse.ok()).toBe(true);
  const overviewBody = await overviewResponse.json();
  expect(overviewBody?.data).toMatchObject({
    houseId: seededHouse.houseId,
    teamId: 'team_main',
    activeTeamId: 'team_main',
  });
  expect(Array.isArray(overviewBody?.data?.assignments)).toBe(true);
  expect(overviewBody.data.assignments).toHaveLength(1);
  expect(overviewBody?.data?.assignments?.[0]).toMatchObject({
    assignmentId: createBody?.data?.assignmentId,
    staffAgentId,
    officeId,
    focus: validPayload.focus,
    sourceKind: validPayload.sourceKind,
    sourceId: validPayload.sourceId,
    deepLink: expect.objectContaining({
      kind: 'house_surface',
      surface: 'trainer',
    }),
    sourceRefs: [
      expect.objectContaining({
        sourceKind: validPayload.sourceKind,
        sourceId: validPayload.sourceId,
        entryPath: '/api/platform/trainer',
        selection: {
          kind: 'trainer_result',
          trainerResultId,
          trainerJobId,
        },
      }),
    ],
  });
  expect(Array.isArray(overviewBody?.data?.sourceManifest?.routes)).toBe(true);
  expect(overviewBody?.data?.sourceManifest?.routes).toEqual(expect.arrayContaining([
    '/api/platform/house-office/assignments',
    '/api/platform/trainer',
  ]));
  expect(overviewBody?.data?.sourceManifest?.counts).toMatchObject({
    assignmentCount: 1,
  });
  expect(overviewBody?.data?.summary).toMatchObject({
    assignmentCount: 1,
  });

  const sessionIdBefore = await readWorkerSessionId(page);
  expect(sessionIdBefore).toBeTruthy();

  await page.getByTestId('house-open-office').click();
  await expect(page.getByTestId('house-office-panel')).toBeVisible();
  await expect(page.getByTestId('house-office-summary')).toContainText('1 assignments');
  await expect(page.getByTestId('house-office-assignments')).toBeVisible();
  await expect(page.getByTestId('house-office-assignment-item')).toHaveCount(1);
  await expect(page.getByTestId('house-office-assignment-item').nth(0)).toContainText('Operations Lead');
  await expect(page.getByTestId('house-office-assignment-item').nth(0)).toContainText(validPayload.focus);

  await page.getByTestId('house-office-assignment-item').nth(0).click();
  await expect(page.getByTestId('house-trainer-panel')).toBeVisible();
  await expect(page.getByTestId('house-team-summary')).toContainText('team_main');

  const sessionIdAfter = await readWorkerSessionId(page);
  expect(sessionIdAfter).toBe(sessionIdBefore);

  const finalLocation = await page.evaluate(() => ({
    pathname: window.location.pathname,
    search: window.location.search,
  }));
  expect(finalLocation.pathname).toBe('/app');
  expect(finalLocation.search).toContain('district=house');
});
