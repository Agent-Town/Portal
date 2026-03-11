const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  createPlatformConfigVersion,
  createPlatformRun,
  createPlatformTrainerJob,
  ingestPlatformTraceRecords,
  promotePlatformConfigVersion,
  readWorkerSessionId,
  setPlatformRunStatus,
} = require('./helpers/unified_platform');

function buildConfigPayload(configVersionId) {
  return {
    configVersionId,
    teamId: 'team_main',
    displayVersion: `${configVersionId}@2026.03.11`,
    branch: 'house-office-citation-selection',
    status: 'candidate',
    componentRefs: {
      housePolicyVersionId: 'hpv_house_office_citation_01',
      teamCompositionVersionId: 'tcv_house_office_citation_01',
      agentConfigVersionIds: ['agv_house_office_citation_01'],
      officePolicyVersionIds: [],
      experiencePresetVersionId: 'epv_house_office_citation_01',
      integrationOverlayVersionIds: [],
      trainerPresetVersionId: 'tpv_house_office_citation_01',
    },
  };
}

async function seedCitationScenario(request) {
  const seededHouse = await seedRecoverableTokenHouse(request);
  const configVersionId = 'cfg_house_office_citation_01';

  const createdConfig = await createPlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'house-office-citation-config-001',
    payload: buildConfigPayload(configVersionId),
  });
  expect(createdConfig.status).toBe(201);

  const promotedConfig = await promotePlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    configVersionId,
    teamId: 'team_main',
    idempotencyKey: 'house-office-citation-promote-001',
  });
  expect(promotedConfig.status).toBe(200);

  const archiveRun = await createPlatformRun(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    experienceId: 'poker.season',
    teamId: 'team_main',
    configVersionId,
    entryMode: 'season_lock',
    idempotencyKey: 'house-office-citation-run-001',
  });
  expect(archiveRun.status).toBe(201);
  const runId = String(archiveRun.json?.data?.runId || '');

  const archiveIngest = await ingestPlatformTraceRecords(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    runId,
    idempotencyKey: 'house-office-citation-ingest-001',
    records: [
      {
        ingestKey: 'house-office-citation-hand-001',
        sourceType: 'operator',
        payloadSchema: 'raw.poker.hand/v1',
        payload: {
          kind: 'hand_summary',
          handId: 'citation-hand-001',
          winner: 'seat_1',
        },
      },
    ],
  });
  expect(archiveIngest.status).toBe(200);
  expect((await setPlatformRunStatus(request, runId, 'completed'))?.ok).toBe(true);

  const trainerJob = await createPlatformTrainerJob(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'house-office-citation-trainer-001',
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
    runId,
    trainerJobId: String(trainerJob.json?.data?.trainerJobId || ''),
    trainerResultId: String(trainerJob.json?.data?.result?.trainerResultId || ''),
  };
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M32.1: House Office citations open the exact cited archive and trainer records in-shell', async ({ page, request }) => {
  const scenario = await seedCitationScenario(request);

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
  const briefing = Array.isArray(officeBody?.data?.briefing) ? officeBody.data.briefing : [];
  const archiveCitation = briefing
    .flatMap((group) => Array.isArray(group?.items) ? group.items : [])
    .flatMap((item) => Array.isArray(item?.citations) ? item.citations : [])
    .find((citation) => String(citation?.sourceKind || '') === 'run' && String(citation?.sourceId || '') === scenario.runId);
  const trainerCitation = briefing
    .flatMap((group) => Array.isArray(group?.items) ? group.items : [])
    .flatMap((item) => Array.isArray(item?.citations) ? item.citations : [])
    .find((citation) => String(citation?.sourceKind || '') === 'trainer_result' && String(citation?.sourceId || '') === scenario.trainerResultId);

  expect(archiveCitation).toMatchObject({
    sourceKind: 'run',
    sourceId: scenario.runId,
    entryPath: '/api/platform/archive',
    selection: expect.objectContaining({
      kind: 'trace',
      runId: scenario.runId,
    }),
  });
  expect(String(archiveCitation?.selection?.traceId || '')).toMatch(/^trace_/);
  expect(trainerCitation).toMatchObject({
    sourceKind: 'trainer_result',
    sourceId: scenario.trainerResultId,
    entryPath: '/api/platform/trainer',
    selection: {
      kind: 'trainer_result',
      trainerResultId: scenario.trainerResultId,
      trainerJobId: scenario.trainerJobId,
    },
  });

  const sessionIdBefore = await readWorkerSessionId(page);
  expect(sessionIdBefore).toBeTruthy();
  const urlBefore = page.url();

  await page.getByTestId('house-open-office').click();
  await expect(page.getByTestId('house-office-panel')).toBeVisible();

  await page.getByTestId('house-office-briefing-citation').filter({ hasText: `run:${scenario.runId}` }).first().click();
  await expect(page.getByTestId('house-archive-panel')).toBeVisible();
  await expect(page.getByTestId('house-archive-detail')).toHaveAttribute('data-selected-trace-id', String(archiveCitation?.selection?.traceId || ''));
  await expect(page.getByTestId('house-archive-detail')).toHaveAttribute('data-selected-run-id', scenario.runId);
  expect(await readWorkerSessionId(page)).toBe(sessionIdBefore);
  expect(page.url()).toBe(urlBefore);

  await page.getByTestId('house-open-office').click();
  await expect(page.getByTestId('house-office-panel')).toBeVisible();
  await page.getByTestId('house-office-briefing-citation').filter({ hasText: `trainer_result:${scenario.trainerResultId}` }).first().click();
  await expect(page.getByTestId('house-trainer-panel')).toBeVisible();
  await expect(page.getByTestId('house-trainer-detail')).toHaveAttribute('data-selected-result-id', scenario.trainerResultId);
  await expect(page.getByTestId('house-trainer-detail')).toHaveAttribute('data-selected-job-id', scenario.trainerJobId);
  await expect(page.locator(`#houseTrainerResults button[data-trainer-result-id="${scenario.trainerResultId}"]`)).toHaveClass(/primary/);
  expect(await readWorkerSessionId(page)).toBe(sessionIdBefore);
  expect(page.url()).toBe(urlBefore);
});
