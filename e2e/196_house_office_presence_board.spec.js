const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  createPlatformConfigVersion,
  createPlatformRun,
  createPlatformTrainerJob,
  getPlatformFixture,
  ingestPlatformTraceRecords,
  promotePlatformConfigVersion,
} = require('./helpers/unified_platform');

function buildConfigPayload(configVersionId) {
  return {
    configVersionId,
    teamId: 'team_main',
    displayVersion: `${configVersionId}@2026.03.10`,
    branch: 'house-office-presence',
    status: 'candidate',
    componentRefs: {
      housePolicyVersionId: 'hpv_house_office_presence_01',
      teamCompositionVersionId: 'tcv_house_office_presence_01',
      agentConfigVersionIds: ['agv_house_office_presence_01'],
      officePolicyVersionIds: [],
      experiencePresetVersionId: 'epv_house_office_presence_01',
      integrationOverlayVersionIds: [],
      trainerPresetVersionId: 'tpv_house_office_presence_01',
    },
  };
}

async function seedHouseOfficePresenceScenario(request) {
  const seededHouse = await seedRecoverableTokenHouse(request);
  const configVersionId = 'cfg_house_office_presence_01';

  const createdConfig = await createPlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'house-office-presence-config-001',
    payload: buildConfigPayload(configVersionId),
  });
  expect(createdConfig.status).toBe(201);

  const promotedConfig = await promotePlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    configVersionId,
    teamId: 'team_main',
    idempotencyKey: 'house-office-presence-promote-001',
  });
  expect(promotedConfig.status).toBe(200);

  const pokerRun = await createPlatformRun(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    experienceId: 'poker.season',
    teamId: 'team_main',
    configVersionId,
    entryMode: 'season_lock',
    idempotencyKey: 'house-office-presence-poker-run-001',
  });
  expect(pokerRun.status).toBe(201);
  const pokerRunId = String(pokerRun.json?.data?.runId || '');

  const pokerIngest = await ingestPlatformTraceRecords(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    runId: pokerRunId,
    idempotencyKey: 'house-office-presence-poker-ingest-001',
    records: [
      {
        ingestKey: 'house-office-poker-1',
        sourceType: 'operator',
        payloadSchema: 'raw.poker.hand/v1',
        payload: {
          kind: 'hand_summary',
          handId: 'presence-hand-001',
          winner: 'seat_1',
        },
      },
      {
        ingestKey: 'house-office-poker-2',
        sourceType: 'operator',
        payloadSchema: 'raw.poker.hand/v1',
        payload: {
          kind: 'hand_summary',
          handId: 'presence-hand-002',
          winner: 'seat_2',
        },
      },
      {
        ingestKey: 'house-office-poker-3',
        sourceType: 'operator',
        payloadSchema: 'raw.poker.hand/v1',
        payload: {
          kind: 'hand_summary',
          handId: 'presence-hand-003',
          winner: 'seat_3',
        },
      },
    ],
  });
  expect(pokerIngest.status).toBe(200);

  const trainerJob = await createPlatformTrainerJob(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'house-office-presence-trainer-001',
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
    configVersionId,
  };
}

async function readHouseOffice(page) {
  const response = await page.request.get('/api/platform/house-office');
  return {
    status: response.status(),
    json: await response.json(),
  };
}

function projectPresenceItems(items) {
  return (Array.isArray(items) ? items : []).map((item) => ({
    officeId: String(item?.officeId || ''),
    status: String(item?.status || ''),
    sourceKind: String(item?.sourceRefs?.[0]?.sourceKind || ''),
    deepLinkSurface: String(item?.deepLink?.surface || ''),
  }));
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M29.1: House Office presence is derived from durable state and rendered in deterministic office order', async ({ page, request }) => {
  const fixture = await getPlatformFixture(request, 'house_office_presence_seed');
  expect(fixture?.ok).toBe(true);
  const allowedStatuses = Array.isArray(fixture?.fixture?.allowedStatuses) ? fixture.fixture.allowedStatuses : [];
  const expectedPresence = Array.isArray(fixture?.fixture?.expectedPresence) ? fixture.fixture.expectedPresence : [];

  const firstScenario = await seedHouseOfficePresenceScenario(request);
  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const attached = await attachHouseToPageSession(page, {
    houseId: firstScenario.seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const officeResponseA = await readHouseOffice(page);
  expect(officeResponseA.status).toBe(200);
  const officeDataA = officeResponseA.json?.data || {};
  expect(Array.isArray(officeDataA.presence)).toBe(true);
  expect(projectPresenceItems(officeDataA.presence)).toEqual(expectedPresence.map((item) => ({
    officeId: String(item.officeId || ''),
    status: String(item.status || ''),
    sourceKind: String(item.sourceKind || ''),
    deepLinkSurface: item.officeId === 'office_fixture_workshop'
      ? 'workshop'
      : item.officeId === 'office_fixture_analysis'
        ? 'trainer'
        : item.officeId === 'office_fixture_archive'
          ? 'archive'
          : 'experiences',
  })));
  officeDataA.presence.forEach((item) => {
    expect(allowedStatuses).toContain(String(item?.status || ''));
    expect(String(item?.focus || '')).not.toBe('');
    expect(String(item?.lastActivityAt || '')).toMatch(/T/);
    expect(String(item?.deepLink?.kind || '')).toBe('house_surface');
    expect(String(item?.deepLink?.surface || '')).not.toBe('');
    expect(Array.isArray(item?.sourceRefs)).toBe(true);
    expect(item.sourceRefs.length).toBeGreaterThan(0);
    expect(String(item?.sourceRefs?.[0]?.entryPath || '')).toMatch(/^\/api\/platform\//);
  });

  await page.getByTestId('house-open-office').click();
  await expect(page.getByTestId('house-office-panel')).toBeVisible();
  await expect(page.getByTestId('house-office-presence')).toBeVisible();
  await expect(page.getByTestId('house-office-presence-item')).toHaveCount(expectedPresence.length);
  for (let index = 0; index < expectedPresence.length; index += 1) {
    const expected = expectedPresence[index];
    await expect(page.getByTestId('house-office-presence-item').nth(index)).toContainText(String(expected.status || ''));
  }

  await resetPortalWebState(request);
  const secondScenario = await seedHouseOfficePresenceScenario(request);
  const secondPage = await page.context().newPage();
  await secondPage.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(secondPage);
  const secondAttach = await attachHouseToPageSession(secondPage, {
    houseId: secondScenario.seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(secondAttach.status).toBe(200);

  const officeResponseB = await readHouseOffice(secondPage);
  expect(officeResponseB.status).toBe(200);
  const officeDataB = officeResponseB.json?.data || {};
  expect(projectPresenceItems(officeDataB.presence)).toEqual(projectPresenceItems(officeDataA.presence));
  await secondPage.close();
});
