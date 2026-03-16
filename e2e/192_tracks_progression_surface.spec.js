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
} = require('./helpers/unified_platform');

function buildConfigPayload(configVersionId) {
  return {
    configVersionId,
    teamId: 'team_main',
    displayVersion: `${configVersionId}@2026.03.10`,
    branch: 'tracks-surface',
    status: 'candidate',
    componentRefs: {
      housePolicyVersionId: 'hpv_tracks_surface_01',
      teamCompositionVersionId: 'tcv_tracks_surface_01',
      agentConfigVersionIds: ['agv_tracks_surface_01'],
      officePolicyVersionIds: [],
      experiencePresetVersionId: 'epv_tracks_surface_01',
      integrationOverlayVersionIds: [],
      trainerPresetVersionId: 'tpv_tracks_surface_01',
    },
  };
}

async function seedTrackProgress(request, seededHouse) {
  const createdConfig = await createPlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'tracks-surface-config-001',
    payload: buildConfigPayload('cfg_tracks_surface_01'),
  });
  expect(createdConfig.status).toBe(201);

  const promotedConfig = await promotePlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    configVersionId: 'cfg_tracks_surface_01',
    teamId: 'team_main',
    idempotencyKey: 'tracks-surface-promote-001',
  });
  expect(promotedConfig.status).toBe(200);

  const webRun = await createPlatformRun(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    experienceId: 'web.agent',
    teamId: 'team_main',
    configVersionId: 'cfg_tracks_surface_01',
    entryMode: 'normal',
    idempotencyKey: 'tracks-surface-web-run-001',
  });
  expect(webRun.status).toBe(201);

  const webIngest = await ingestPlatformTraceRecords(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    runId: String(webRun.json?.data?.runId || ''),
    idempotencyKey: 'tracks-surface-web-ingest-001',
    records: [
      {
        ingestKey: 'tracks-surface-web-1',
        sourceType: 'worker',
        payloadSchema: 'raw.web.observation/v1',
        payload: {
          kind: 'navigate',
          url: 'https://example.com/operators',
        },
      },
      {
        ingestKey: 'tracks-surface-web-2',
        sourceType: 'worker',
        payloadSchema: 'raw.web.observation/v1',
        payload: {
          kind: 'navigate',
          url: 'https://example.com/alerts',
        },
      },
    ],
  });
  expect(webIngest.status).toBe(200);

  const pokerRun = await createPlatformRun(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    experienceId: 'poker.season',
    teamId: 'team_main',
    configVersionId: 'cfg_tracks_surface_01',
    entryMode: 'season_lock',
    idempotencyKey: 'tracks-surface-poker-run-001',
  });
  expect(pokerRun.status).toBe(201);

  const pokerIngest = await ingestPlatformTraceRecords(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    runId: String(pokerRun.json?.data?.runId || ''),
    idempotencyKey: 'tracks-surface-poker-ingest-001',
    records: [
      {
        ingestKey: 'tracks-surface-poker-1',
        sourceType: 'operator',
        payloadSchema: 'raw.poker.hand/v1',
        payload: {
          kind: 'hand_summary',
          handId: 'surface-hand-001',
          winner: 'seat_1',
        },
      },
      {
        ingestKey: 'tracks-surface-poker-2',
        sourceType: 'operator',
        payloadSchema: 'raw.poker.hand/v1',
        payload: {
          kind: 'hand_summary',
          handId: 'surface-hand-002',
          winner: 'seat_2',
        },
      },
      {
        ingestKey: 'tracks-surface-poker-3',
        sourceType: 'operator',
        payloadSchema: 'raw.poker.hand/v1',
        payload: {
          kind: 'hand_summary',
          handId: 'surface-hand-003',
          winner: 'seat_3',
        },
      },
    ],
  });
  expect(pokerIngest.status).toBe(200);

  const analystJobA = await createPlatformTrainerJob(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'tracks-surface-analyst-job-a-001',
    payload: {
      teamId: 'team_main',
      jobKind: 'trainer_job.compare',
      targets: {
        configVersionIds: ['cfg_tracks_surface_01'],
      },
      budget: {
        maxUsd: 5,
      },
    },
  });
  expect(analystJobA.status).toBe(201);

  const analystJobB = await createPlatformTrainerJob(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'tracks-surface-analyst-job-b-001',
    payload: {
      teamId: 'team_main',
      jobKind: 'trainer_job.recommend',
      targets: {
        configVersionIds: ['cfg_tracks_surface_01'],
      },
      budget: {
        maxUsd: 5,
      },
    },
  });
  expect(analystJobB.status).toBe(201);
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M25.9: House Tracks renders deterministic progress in-shell and keeps track terminology stable', async ({ page, request }) => {
  test.slow();
  test.setTimeout(120_000);
  const seededHouse = await seedRecoverableTokenHouse(request);
  await seedTrackProgress(request, seededHouse);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const attached = await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const beforeOpen = await page.request.get('/api/platform/tracks');
  expect(beforeOpen.ok()).toBe(true);
  const beforeBody = await beforeOpen.json();
  expect(beforeBody?.data?.tracks).toEqual([
    expect.objectContaining({ trackId: 'track_poker_mastery', progress: 0.75 }),
    expect.objectContaining({ trackId: 'track_web_ops', progress: 0.5 }),
    expect.objectContaining({ trackId: 'track_builder', progress: 0.25 }),
    expect.objectContaining({ trackId: 'track_analyst', progress: 0.4 }),
  ]);

  const initialSessionId = await readWorkerSessionId(page);
  await page.getByTestId('house-open-tracks').click();
  await expect(page.getByTestId('house-tracks-panel')).toBeVisible();
  await expect(page.locator('#houseTracksList button')).toHaveCount(4);
  await expect(page.locator('#houseTracksList button').nth(0)).toContainText('Poker Mastery');
  await expect(page.locator('#houseTracksList button').nth(0)).toContainText('75%');
  await expect(page.locator('#houseTracksList button').nth(1)).toContainText('Web Ops');
  await expect(page.locator('#houseTracksList button').nth(1)).toContainText('50%');
  await expect(page.locator('#houseTracksList button').nth(2)).toContainText('Builder');
  await expect(page.locator('#houseTracksList button').nth(2)).toContainText('25%');
  await expect(page.locator('#houseTracksList button').nth(3)).toContainText('Analyst');
  await expect(page.locator('#houseTracksList button').nth(3)).toContainText('40%');

  await expect(page.getByTestId('house-tracks-detail')).toContainText('Track Poker Mastery');
  await expect(page.getByTestId('house-tracks-detail')).toContainText('3 / 4');
  await expect(page.getByTestId('house-tracks-detail')).toContainText('75%');
  await expect(page.getByTestId('house-tracks-detail')).not.toContainText(/badge|point/i);

  await page.locator('#houseTracksList button[data-track-id="track_analyst"]').click();
  await expect(page.getByTestId('house-tracks-detail')).toContainText('Track Analyst');
  await expect(page.getByTestId('house-tracks-detail')).toContainText('2 / 5');
  await expect(page.getByTestId('house-tracks-detail')).toContainText('40%');
  await expect(page.getByTestId('house-tracks-detail')).toContainText('trainer_result');

  expect(new URL(page.url()).pathname).toBe('/app');
  expect(new URL(page.url()).searchParams.get('district')).toBe('house');
  const afterOpenSessionId = await readWorkerSessionId(page);
  expect(afterOpenSessionId).toBe(initialSessionId);
});
