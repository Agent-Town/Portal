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
    branch: 'house-office-attention',
    status: 'candidate',
    componentRefs: {
      housePolicyVersionId: 'hpv_house_office_attention_01',
      teamCompositionVersionId: 'tcv_house_office_attention_01',
      agentConfigVersionIds: ['agv_house_office_attention_01'],
      officePolicyVersionIds: [],
      experiencePresetVersionId: 'epv_house_office_attention_01',
      integrationOverlayVersionIds: [],
      trainerPresetVersionId: 'tpv_house_office_attention_01',
    },
  };
}

async function seedHouseOfficeAttentionScenario(request) {
  const seededHouse = await seedRecoverableTokenHouse(request);
  const configVersionId = 'cfg_house_office_attention_01';

  const createdConfig = await createPlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'house-office-attention-config-001',
    payload: buildConfigPayload(configVersionId),
  });
  expect(createdConfig.status).toBe(201);

  const promotedConfig = await promotePlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    configVersionId,
    teamId: 'team_main',
    idempotencyKey: 'house-office-attention-promote-001',
  });
  expect(promotedConfig.status).toBe(200);

  const pokerRun = await createPlatformRun(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    experienceId: 'poker.season',
    teamId: 'team_main',
    configVersionId,
    entryMode: 'season_lock',
    idempotencyKey: 'house-office-attention-poker-run-001',
  });
  expect(pokerRun.status).toBe(201);
  const pokerRunId = String(pokerRun.json?.data?.runId || '');

  const pokerIngest = await ingestPlatformTraceRecords(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    runId: pokerRunId,
    idempotencyKey: 'house-office-attention-poker-ingest-001',
    records: [
      {
        ingestKey: 'house-office-attention-poker-hand-001',
        sourceType: 'operator',
        payloadSchema: 'raw.poker.hand/v1',
        payload: {
          kind: 'hand_summary',
          handId: 'attention-hand-001',
          winner: 'seat_1',
        },
      },
    ],
  });
  expect(pokerIngest.status).toBe(200);

  const trainerJob = await createPlatformTrainerJob(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'house-office-attention-trainer-001',
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
  };
}

async function readHouseOffice(page) {
  const response = await page.request.get('/api/platform/house-office');
  return {
    status: response.status(),
    json: await response.json(),
  };
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M29.3: House Office attention stays severity-sorted and opens a real surface without breaking continuity', async ({ page, request }) => {
  const fixture = await getPlatformFixture(request, 'house_office_attention_seed');
  expect(fixture?.ok).toBe(true);
  const severityOrder = Array.isArray(fixture?.fixture?.severityOrder) ? fixture.fixture.severityOrder : [];
  const expectedSurfaces = Array.isArray(fixture?.fixture?.expectedSurfaces) ? fixture.fixture.expectedSurfaces : [];
  const scenario = await seedHouseOfficeAttentionScenario(request);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const attached = await attachHouseToPageSession(page, {
    houseId: scenario.seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const officeResponse = await readHouseOffice(page);
  expect(officeResponse.status).toBe(200);
  const officeData = officeResponse.json?.data || {};
  const attention = Array.isArray(officeData.attention) ? officeData.attention : [];
  expect(attention.map((item) => String(item?.severity || ''))).toEqual(severityOrder);
  expect(attention.map((item) => String(item?.deepLink?.surface || ''))).toEqual(expectedSurfaces);
  attention.forEach((item) => {
    expect(String(item?.sourceKind || '')).not.toBe('');
    expect(String(item?.sourceId || '')).not.toBe('');
    expect(String(item?.deepLink?.kind || '')).toBe('house_surface');
    expect(String(item?.deepLink?.surface || '')).not.toBe('');
  });
  expect(Number(officeData?.sourceManifest?.counts?.attentionCount || 0)).toBe(attention.length);
  expect(Number(officeData?.summary?.attentionCount || 0)).toBe(attention.length);

  const initialWorkerSessionId = await readWorkerSessionId(page);
  const initialContext = await getPlatformContextFromPage(page);
  const initialUrl = page.url();

  await page.getByTestId('house-open-office').click();
  await expect(page.getByTestId('house-office-panel')).toBeVisible();
  await expect(page.getByTestId('house-office-attention')).toBeVisible();
  await expect(page.getByTestId('house-office-attention-item')).toHaveCount(attention.length);
  await page.getByTestId('house-office-attention-item').nth(0).click();
  await expect(page.getByTestId('house-trainer-panel')).toBeVisible();

  expect(await readWorkerSessionId(page)).toBe(initialWorkerSessionId);
  const afterContext = await getPlatformContextFromPage(page);
  expect(String(afterContext?.activeTeamId || '')).toBe(String(initialContext?.activeTeamId || ''));
  expect(page.url()).toBe(initialUrl);
});
