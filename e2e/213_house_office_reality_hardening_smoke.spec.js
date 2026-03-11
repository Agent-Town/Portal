const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  createPlatformConfigVersion,
  createPlatformRun,
  createPlatformTrainerJob,
  getPlatformContextFromPage,
  getPlatformFixture,
  ingestPlatformTraceRecords,
  promotePlatformConfigVersion,
  readWorkerSessionId,
} = require('./helpers/unified_platform');

function buildConfigPayload(configVersionId) {
  return {
    configVersionId,
    teamId: 'team_main',
    displayVersion: `${configVersionId}@2026.03.11`,
    branch: 'house-office-reality-smoke',
    status: 'candidate',
    componentRefs: {
      housePolicyVersionId: 'hpv_house_office_reality_smoke_01',
      teamCompositionVersionId: 'tcv_house_office_reality_smoke_01',
      agentConfigVersionIds: ['agv_house_office_reality_smoke_01'],
      officePolicyVersionIds: [],
      experiencePresetVersionId: 'epv_house_office_reality_smoke_01',
      integrationOverlayVersionIds: [],
      trainerPresetVersionId: 'tpv_house_office_reality_smoke_01',
    },
  };
}

async function seedHouseOfficeRealitySmokeScenario(request) {
  const seededHouse = await seedRecoverableTokenHouse(request);
  const configVersionId = 'cfg_house_office_reality_smoke_01';

  const createdConfig = await createPlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'house-office-reality-smoke-config-001',
    payload: buildConfigPayload(configVersionId),
  });
  expect(createdConfig.status).toBe(201);

  const promotedConfig = await promotePlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    configVersionId,
    teamId: 'team_main',
    idempotencyKey: 'house-office-reality-smoke-promote-001',
  });
  expect(promotedConfig.status).toBe(200);

  const pokerRun = await createPlatformRun(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    experienceId: 'poker.season',
    teamId: 'team_main',
    configVersionId,
    entryMode: 'season_lock',
    idempotencyKey: 'house-office-reality-smoke-run-001',
  });
  expect(pokerRun.status).toBe(201);
  const pokerRunId = String(pokerRun.json?.data?.runId || '').trim();

  const pokerIngest = await ingestPlatformTraceRecords(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    runId: pokerRunId,
    idempotencyKey: 'house-office-reality-smoke-ingest-001',
    records: [
      {
        ingestKey: 'house-office-reality-smoke-poker-hand-001',
        sourceType: 'operator',
        payloadSchema: 'raw.poker.hand/v1',
        payload: {
          kind: 'hand_summary',
          handId: 'reality-smoke-hand-001',
          winner: 'seat_2',
        },
      },
    ],
  });
  expect(pokerIngest.status).toBe(200);

  const trainerJob = await createPlatformTrainerJob(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'house-office-reality-smoke-trainer-001',
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
  const trainerJobId = String(trainerJob.json?.data?.trainerJobId || '').trim();
  const trainerResultId = String(trainerJob.json?.data?.result?.trainerResultId || '').trim();
  expect(trainerResultId).toMatch(/^trr_/);

  return {
    seededHouse,
    pokerRunId,
    trainerJobId,
    trainerResultId,
  };
}

async function runHouseOfficeRealityJourney(page, fixture, scenario) {
  const checkpoints = [];
  const initialWorkerSessionId = await readWorkerSessionId(page);
  const initialContext = await getPlatformContextFromPage(page);
  const initialUrl = page.url();

  const structureResponse = await page.request.get('/api/platform/house-structure');
  expect(structureResponse.ok()).toBe(true);
  const structureBody = await structureResponse.json();

  const officeResponse = await page.request.get('/api/platform/house-office');
  expect(officeResponse.ok()).toBe(true);
  const officeBody = await officeResponse.json();

  const readinessResponse = await page.request.get('/api/platform/house-readiness');
  expect(readinessResponse.ok()).toBe(true);
  const readinessBody = await readinessResponse.json();

  const structureOffices = (structureBody?.data?.offices || []).map((entry) => String(entry?.officeId || ''));
  const overviewOffices = (officeBody?.data?.offices || []).map((entry) => String(entry?.officeId || ''));
  const structureStaff = (structureBody?.data?.staffAgents || []).map((entry) => String(entry?.staffAgentId || ''));
  const overviewStaff = (officeBody?.data?.staffAgents || []).map((entry) => String(entry?.staffAgentId || ''));
  expect(structureOffices).toEqual(overviewOffices);
  expect(structureStaff).toEqual(overviewStaff);
  checkpoints.push(`${fixture.checkpoints[0]}:${structureOffices.join(',')}`);

  const readinessData = readinessBody?.data || {};
  expect(readinessData).toMatchObject({
    houseId: scenario.seededHouse.houseId,
    activeTeamId: 'team_main',
    status: 'ready_for_manual_validation',
  });
  expect(Number(readinessData?.counts?.readySurfaceCount || 0)).toBe(6);
  checkpoints.push(`${fixture.checkpoints[1]}:${String(readinessData?.status || '')}`);

  const briefingGroups = Array.isArray(officeBody?.data?.briefing) ? officeBody.data.briefing : [];
  const opsGroupIndex = briefingGroups.findIndex((group) => String(group?.family || '').trim() === 'poker_or_web');
  expect(opsGroupIndex).toBeGreaterThanOrEqual(0);
  const opsGroup = briefingGroups[opsGroupIndex];
  const opsCitation = opsGroup?.items?.[0]?.citations?.[0] || null;
  expect(String(opsCitation?.sourceId || '').trim()).toBe(scenario.pokerRunId);
  checkpoints.push(`${fixture.checkpoints[2]}:${String(opsGroup?.family || '')}`);

  const assignmentResponse = await page.request.post('/api/platform/house-office/assignments', {
    data: {
      officeId: 'office_fixture_ops',
      staffAgentId: 'staff_fixture_operator',
      focus: 'Review trainer readiness',
      sourceKind: 'trainer_result',
      sourceId: scenario.trainerResultId,
    },
    failOnStatusCode: false,
  });
  expect(assignmentResponse.status()).toBe(200);

  await page.getByTestId('house-open-office').click();
  await expect(page.getByTestId('house-office-panel')).toBeVisible();
  await expect(page.getByTestId('house-readiness-summary')).toContainText('ready for manual validation');

  await page.getByTestId('house-office-briefing-group').nth(opsGroupIndex).getByTestId('house-office-briefing-citation').first().click();
  await expect(page.getByTestId('house-archive-panel')).toBeVisible();
  await expect(page.getByTestId('house-archive-detail')).toHaveAttribute('data-selected-run-id', scenario.pokerRunId);
  checkpoints.push(`${fixture.checkpoints[3]}:${scenario.pokerRunId}`);

  await page.getByRole('button', { name: 'Front Desk' }).click();
  await expect(page.getByTestId('house-office-panel')).toBeVisible();
  await page.getByTestId('house-office-assignment-item').first().click();
  await expect(page.getByTestId('house-trainer-panel')).toBeVisible();
  await expect(page.getByTestId('house-trainer-detail')).toHaveAttribute('data-selected-result-id', scenario.trainerResultId);
  await expect(page.getByTestId('house-trainer-detail')).toHaveAttribute('data-selected-job-id', scenario.trainerJobId);
  checkpoints.push(`${fixture.checkpoints[4]}:${scenario.trainerResultId}`);

  expect(await readWorkerSessionId(page)).toBe(initialWorkerSessionId);
  const finalContext = await getPlatformContextFromPage(page);
  expect(String(finalContext?.data?.activeTeamId || '')).toBe(String(initialContext?.data?.activeTeamId || ''));
  expect(page.url()).toBe(initialUrl);
  checkpoints.push(`${fixture.checkpoints[5]}:${String(finalContext?.data?.activeTeamId || '')}`);

  return checkpoints;
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M32.8: House Office reality hardening smoke proves the integrated journey twice without losing continuity', async ({ page, request }) => {
  const fixtureEnvelope = await getPlatformFixture(request, 'house_office_reality_smoke_seed');
  expect(fixtureEnvelope?.ok).toBe(true);
  const fixture = fixtureEnvelope?.fixture || {};
  expect(Array.isArray(fixture?.checkpoints)).toBe(true);
  expect(fixture.checkpoints).toEqual([
    'structure_parity',
    'readiness_truth',
    'ops_family_visible',
    'ops_citation_selection',
    'assignment_selection',
    'continuity',
  ]);

  const scenario = await seedHouseOfficeRealitySmokeScenario(request);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const attached = await attachHouseToPageSession(page, {
    houseId: scenario.seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const firstRunCheckpoints = await runHouseOfficeRealityJourney(page, fixture, scenario);
  await page.reload();
  await waitForLiteApi(page);
  const reattached = await attachHouseToPageSession(page, {
    houseId: scenario.seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(reattached.status).toBe(200);
  const secondRunCheckpoints = await runHouseOfficeRealityJourney(page, fixture, scenario);

  expect(secondRunCheckpoints).toEqual(firstRunCheckpoints);
});
