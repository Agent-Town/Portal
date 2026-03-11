const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  createPlatformConfigVersion,
  promotePlatformConfigVersion,
} = require('./helpers/unified_platform');

function buildConfigPayload(configVersionId) {
  return {
    configVersionId,
    teamId: 'team_main',
    displayVersion: `${configVersionId}@2026.03.11`,
    branch: 'house-office-readiness-truth',
    status: 'candidate',
    componentRefs: {
      housePolicyVersionId: 'hpv_house_office_readiness_truth_01',
      teamCompositionVersionId: 'tcv_house_office_readiness_truth_01',
      agentConfigVersionIds: ['agv_house_office_readiness_truth_01'],
      officePolicyVersionIds: [],
      experiencePresetVersionId: 'epv_house_office_readiness_truth_01',
      integrationOverlayVersionIds: [],
      trainerPresetVersionId: 'tpv_house_office_readiness_truth_01',
    },
  };
}

async function seedReadinessTruthScenario(request) {
  const seededHouse = await seedRecoverableTokenHouse(request);
  const configVersionId = 'cfg_house_office_readiness_truth_01';

  const createdConfig = await createPlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'house-office-readiness-truth-config-001',
    payload: buildConfigPayload(configVersionId),
  });
  expect(createdConfig.status).toBe(201);

  const promotedConfig = await promotePlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    configVersionId,
    teamId: 'team_main',
    idempotencyKey: 'house-office-readiness-truth-promote-001',
  });
  expect(promotedConfig.status).toBe(200);

  return {
    seededHouse,
    configVersionId,
  };
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M32.3: House readiness reports route evidence and mixed ready/blocked surfaces honestly', async ({ page, request }) => {
  const scenario = await seedReadinessTruthScenario(request);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const attached = await attachHouseToPageSession(page, {
    houseId: scenario.seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const readinessResponse = await page.request.get('/api/platform/house-readiness');
  expect(readinessResponse.ok()).toBe(true);
  const readinessBody = await readinessResponse.json();
  const readinessData = readinessBody?.data || {};
  const surfaces = Array.isArray(readinessData.surfaces) ? readinessData.surfaces : [];
  const surfaceById = new Map(surfaces.map((surface) => [String(surface?.surface || ''), surface]));

  expect(readinessData).toMatchObject({
    schema: 'agent-town-house-readiness/v1',
    houseId: scenario.seededHouse.houseId,
    activeTeamId: 'team_main',
    status: 'action_required',
  });
  expect(readinessData.checklist).toHaveLength(4);
  expect(readinessData.counts).toMatchObject({
    officeCount: 4,
    staffAgentCount: 1,
    readySurfaceCount: 4,
  });
  expect(surfaces).toHaveLength(6);
  surfaces.forEach((surface) => {
    expect(surface).toMatchObject({
      browserValidationRequired: true,
    });
    expect(typeof surface?.routeOk).toBe('boolean');
    expect(typeof surface?.dataOk).toBe('boolean');
    expect(typeof surface?.selectionOk).toBe('boolean');
    expect(Array.isArray(surface?.blockedBy)).toBe(true);
  });

  expect(surfaceById.get('office')).toMatchObject({
    ready: true,
    status: 'ready',
    routeOk: true,
    dataOk: true,
    selectionOk: true,
    blockedBy: [],
  });
  expect(surfaceById.get('workshop')).toMatchObject({
    ready: true,
    status: 'ready',
    routeOk: true,
    dataOk: true,
    selectionOk: true,
    blockedBy: [],
  });
  expect(surfaceById.get('experiences')).toMatchObject({
    ready: true,
    status: 'ready',
    routeOk: true,
    dataOk: true,
    selectionOk: true,
    blockedBy: [],
  });
  expect(surfaceById.get('tracks')).toMatchObject({
    ready: true,
    status: 'ready',
    routeOk: true,
    dataOk: true,
    selectionOk: true,
    blockedBy: [],
  });
  expect(surfaceById.get('archive')).toMatchObject({
    ready: false,
    status: 'blocked',
    routeOk: true,
    dataOk: false,
    selectionOk: false,
  });
  expect(surfaceById.get('archive')?.blockedBy || []).toContain('ARCHIVE_RUN_REQUIRED');
  expect(surfaceById.get('trainer')).toMatchObject({
    ready: false,
    status: 'blocked',
    routeOk: true,
    dataOk: false,
    selectionOk: false,
  });
  expect(surfaceById.get('trainer')?.blockedBy || []).toContain('TRAINER_RECORD_REQUIRED');

  await page.reload();
  await waitForLiteApi(page);
  await expect(page.getByTestId('house-team-summary')).toContainText('team_main');
  await expect(page.getByTestId('house-readiness-summary')).toContainText('4 of 6 House surfaces', { timeout: 10000 });
  await expect(page.getByTestId('house-readiness-surface')).toHaveCount(6);
  await expect(page.getByTestId('house-readiness-surface').nth(0)).toContainText('House Office');
  await expect(page.getByTestId('house-readiness-surface').nth(0)).toContainText('route ok');
  await expect(page.getByTestId('house-readiness-surface').nth(0)).toContainText('data ok');
  await expect(page.getByTestId('house-readiness-surface').nth(0)).toContainText('selection ok');
  await expect(page.getByTestId('house-readiness-surface').nth(1)).toContainText('House Workshop');
  await expect(page.getByTestId('house-readiness-surface').nth(2)).toContainText('House Tracks');
  await expect(page.getByTestId('house-readiness-surface').nth(2)).toContainText('ready');
  await expect(page.getByTestId('house-readiness-check-item')).toHaveCount(4);
});
