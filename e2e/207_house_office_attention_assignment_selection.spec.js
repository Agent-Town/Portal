const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  createPlatformConfigVersion,
  createPlatformTrainerJob,
  promotePlatformConfigVersion,
  readWorkerSessionId,
} = require('./helpers/unified_platform');

function buildConfigPayload(configVersionId) {
  return {
    configVersionId,
    teamId: 'team_main',
    displayVersion: `${configVersionId}@2026.03.11`,
    branch: 'house-office-attention-assignment-selection',
    status: 'candidate',
    componentRefs: {
      housePolicyVersionId: 'hpv_house_office_attention_assignment_01',
      teamCompositionVersionId: 'tcv_house_office_attention_assignment_01',
      agentConfigVersionIds: ['agv_house_office_attention_assignment_01'],
      officePolicyVersionIds: [],
      experiencePresetVersionId: 'epv_house_office_attention_assignment_01',
      integrationOverlayVersionIds: [],
      trainerPresetVersionId: 'tpv_house_office_attention_assignment_01',
    },
  };
}

async function seedAttentionAssignmentScenario(request) {
  const seededHouse = await seedRecoverableTokenHouse(request);
  const configVersionId = 'cfg_house_office_attention_assignment_01';

  const createdConfig = await createPlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'house-office-attention-assignment-config-001',
    payload: buildConfigPayload(configVersionId),
  });
  expect(createdConfig.status).toBe(201);

  const promotedConfig = await promotePlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    configVersionId,
    teamId: 'team_main',
    idempotencyKey: 'house-office-attention-assignment-promote-001',
  });
  expect(promotedConfig.status).toBe(200);

  const trainerJob = await createPlatformTrainerJob(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'house-office-attention-assignment-trainer-001',
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

  return {
    seededHouse,
    trainerJobId: String(trainerJob.json?.data?.trainerJobId || ''),
    trainerResultId: String(trainerJob.json?.data?.result?.trainerResultId || ''),
  };
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M32.2: House Office attention items and assignments open the exact target record in-shell', async ({ page, request }) => {
  const scenario = await seedAttentionAssignmentScenario(request);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const attached = await attachHouseToPageSession(page, {
    houseId: scenario.seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const officeResponse = await page.request.get('/api/platform/house-office');
  expect(officeResponse.ok()).toBe(true);
  const officeBody = await officeResponse.json();
  const attention = Array.isArray(officeBody?.data?.attention) ? officeBody.data.attention : [];
  const trainerAttention = attention.find((item) => String(item?.sourceKind || '') === 'trainer_result' && String(item?.sourceId || '') === scenario.trainerResultId);
  const workshopAttention = attention.find((item) => String(item?.sourceKind || '') === 'team_config_binding');

  expect(trainerAttention).toMatchObject({
    sourceKind: 'trainer_result',
    sourceId: scenario.trainerResultId,
    deepLink: {
      kind: 'house_surface',
      surface: 'trainer',
      label: 'Open Trainer',
      selection: {
        kind: 'trainer_result',
        trainerResultId: scenario.trainerResultId,
        trainerJobId: scenario.trainerJobId,
      },
    },
  });
  expect(workshopAttention).toMatchObject({
    sourceKind: 'team_config_binding',
    deepLink: {
      kind: 'house_surface',
      surface: 'workshop',
      label: 'Open Workshop',
      selection: expect.objectContaining({
        kind: 'team_binding',
      }),
    },
  });

  const createAssignmentResponse = await page.request.post('/api/platform/house-office/assignments', {
    data: {
      officeId: 'office_fixture_ops',
      staffAgentId: 'staff_fixture_operator',
      focus: 'Review workshop binding',
      sourceKind: 'team_config_binding',
      sourceId: String(workshopAttention?.sourceId || ''),
    },
    failOnStatusCode: false,
  });
  expect(createAssignmentResponse.status()).toBe(200);
  const createAssignmentBody = await createAssignmentResponse.json();
  expect(createAssignmentBody?.data).toMatchObject({
    sourceKind: 'team_config_binding',
    sourceId: String(workshopAttention?.sourceId || ''),
    deepLink: {
      kind: 'house_surface',
      surface: 'workshop',
      label: 'Open Workshop',
      selection: {
        kind: 'team_binding',
        teamBindingId: String(workshopAttention?.sourceId || ''),
      },
    },
  });

  const sessionIdBefore = await readWorkerSessionId(page);
  expect(sessionIdBefore).toBeTruthy();
  const urlBefore = page.url();

  await page.getByTestId('house-open-office').click();
  await expect(page.getByTestId('house-office-panel')).toBeVisible();
  await page.getByTestId('house-office-attention-item').filter({ hasText: 'Trainer approval required' }).first().click();
  await expect(page.getByTestId('house-trainer-panel')).toBeVisible();
  await expect(page.getByTestId('house-trainer-detail')).toHaveAttribute('data-selected-result-id', scenario.trainerResultId);
  await expect(page.getByTestId('house-trainer-detail')).toHaveAttribute('data-selected-job-id', scenario.trainerJobId);
  expect(await readWorkerSessionId(page)).toBe(sessionIdBefore);
  expect(page.url()).toBe(urlBefore);

  await page.getByTestId('house-open-office').click();
  await expect(page.getByTestId('house-office-panel')).toBeVisible();
  await page.getByTestId('house-office-assignment-item').first().click();
  await expect(page.getByTestId('house-workshop-panel')).toBeVisible();
  await expect(page.getByTestId('house-workshop-detail')).toHaveAttribute('data-selected-kind', 'team_binding');
  await expect(page.getByTestId('house-workshop-detail')).toHaveAttribute('data-selected-id', String(workshopAttention?.sourceId || ''));
  expect(await readWorkerSessionId(page)).toBe(sessionIdBefore);
  expect(page.url()).toBe(urlBefore);
});
