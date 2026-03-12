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
} = require('./helpers/unified_platform');

function buildConfigPayload(configVersionId, overrides = {}) {
  return {
    configVersionId,
    teamId: 'team_main',
    displayVersion: `${configVersionId}@2026.03.10`,
    branch: 'tracks-core',
    status: 'candidate',
    componentRefs: {
      housePolicyVersionId: 'hpv_tracks_core_01',
      teamCompositionVersionId: 'tcv_tracks_core_01',
      agentConfigVersionIds: ['agv_tracks_core_01'],
      officePolicyVersionIds: [],
      experiencePresetVersionId: 'epv_tracks_core_01',
      integrationOverlayVersionIds: [],
      trainerPresetVersionId: 'tpv_tracks_core_01',
    },
    ...overrides,
  };
}

async function readTracks(page) {
  const response = await page.request.get('/api/platform/tracks');
  return {
    status: response.status(),
    json: await response.json(),
  };
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M25.8: tracks core and reward hooks are durable, trace-backed, and suppress trivial duplicate actions', async ({ page, request }) => {
  const seededHouse = await seedRecoverableTokenHouse(request);
  const createdConfig = await createPlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'tracks-core-config-001',
    payload: buildConfigPayload('cfg_tracks_core_01'),
  });
  expect(createdConfig.status).toBe(201);

  const promotedConfig = await promotePlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    configVersionId: 'cfg_tracks_core_01',
    teamId: 'team_main',
    idempotencyKey: 'tracks-core-promote-001',
  });
  expect(promotedConfig.status).toBe(200);

  const webRun = await createPlatformRun(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    experienceId: 'web.agent',
    teamId: 'team_main',
    configVersionId: 'cfg_tracks_core_01',
    entryMode: 'normal',
    idempotencyKey: 'tracks-core-web-run-001',
  });
  expect(webRun.status).toBe(201);
  const webRunId = String(webRun.json?.data?.runId || '');

  const webIngest = await ingestPlatformTraceRecords(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    runId: webRunId,
    idempotencyKey: 'tracks-core-web-ingest-001',
    records: [
      {
        ingestKey: 'tracks-web-1',
        sourceType: 'worker',
        payloadSchema: 'raw.web.observation/v1',
        payload: {
          kind: 'navigate',
          url: 'https://example.com/operators',
        },
      },
      {
        ingestKey: 'tracks-web-2',
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
  expect(Number(webIngest.json?.data?.accepted || 0)).toBe(2);
  const webTraceId = String(webIngest.json?.data?.traceId || '');

  const pokerRun = await createPlatformRun(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    experienceId: 'poker.season',
    teamId: 'team_main',
    configVersionId: 'cfg_tracks_core_01',
    entryMode: 'season_lock',
    idempotencyKey: 'tracks-core-poker-run-001',
  });
  expect(pokerRun.status).toBe(201);
  const pokerRunId = String(pokerRun.json?.data?.runId || '');

  const pokerIngest = await ingestPlatformTraceRecords(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    runId: pokerRunId,
    idempotencyKey: 'tracks-core-poker-ingest-001',
    records: [
      {
        ingestKey: 'tracks-poker-1',
        sourceType: 'operator',
        payloadSchema: 'raw.poker.hand/v1',
        payload: {
          kind: 'hand_summary',
          handId: 'hand-001',
          winner: 'seat_1',
        },
      },
      {
        ingestKey: 'tracks-poker-2',
        sourceType: 'operator',
        payloadSchema: 'raw.poker.hand/v1',
        payload: {
          kind: 'hand_summary',
          handId: 'hand-002',
          winner: 'seat_2',
        },
      },
      {
        ingestKey: 'tracks-poker-3',
        sourceType: 'operator',
        payloadSchema: 'raw.poker.hand/v1',
        payload: {
          kind: 'hand_summary',
          handId: 'hand-003',
          winner: 'seat_3',
        },
      },
      {
        ingestKey: 'tracks-poker-4',
        sourceType: 'operator',
        payloadSchema: 'raw.poker.hand/v1',
        payload: {
          kind: 'hand_summary',
          handId: 'hand-001',
          winner: 'seat_1',
        },
      },
    ],
  });
  expect(pokerIngest.status).toBe(200);
  expect(Number(pokerIngest.json?.data?.accepted || 0)).toBe(4);
  const pokerTraceId = String(pokerIngest.json?.data?.traceId || '');

  const analystJobA = await createPlatformTrainerJob(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'tracks-core-analyst-job-a-001',
    payload: {
      teamId: 'team_main',
      jobKind: 'trainer_job.compare',
      targets: {
        configVersionIds: ['cfg_tracks_core_01'],
      },
      budget: {
        maxUsd: 5,
      },
    },
  });
  expect(analystJobA.status).toBe(201);
  const analystResultA = String(analystJobA.json?.data?.result?.trainerResultId || '');
  expect(analystResultA).toMatch(/^trr_/);

  const analystJobB = await createPlatformTrainerJob(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'tracks-core-analyst-job-b-001',
    payload: {
      teamId: 'team_main',
      jobKind: 'trainer_job.recommend',
      targets: {
        configVersionIds: ['cfg_tracks_core_01'],
      },
      budget: {
        maxUsd: 5,
      },
    },
  });
  expect(analystJobB.status).toBe(201);
  const analystResultB = String(analystJobB.json?.data?.result?.trainerResultId || '');
  expect(analystResultB).toMatch(/^trr_/);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const attached = await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const tracksResponseA = await readTracks(page);
  expect(tracksResponseA.status).toBe(200);
  const tracksDataA = tracksResponseA.json?.data || {};
  expect(Array.isArray(tracksDataA.tracks)).toBe(true);
  expect(tracksDataA.tracks.map((entry) => String(entry?.title || ''))).toEqual([
    'Poker Mastery',
    'Web Ops',
    'Builder',
    'Analyst',
  ]);
  expect(tracksDataA.tracks).toEqual([
    expect.objectContaining({
      trackId: 'track_poker_mastery',
      title: 'Poker Mastery',
      progressCount: 3,
      targetCount: 4,
      progress: 0.75,
    }),
    expect.objectContaining({
      trackId: 'track_web_ops',
      title: 'Web Ops',
      progressCount: 2,
      targetCount: 4,
      progress: 0.5,
    }),
    expect.objectContaining({
      trackId: 'track_builder',
      title: 'Builder',
      progressCount: 1,
      targetCount: 4,
      progress: 0.25,
    }),
    expect.objectContaining({
      trackId: 'track_analyst',
      title: 'Analyst',
      progressCount: 2,
      targetCount: 5,
      progress: 0.4,
    }),
  ]);
  expect(tracksDataA.antiFarming).toEqual({
    duplicateActionThreshold: 1,
    mode: 'dedupe_key_cap',
  });
  expect(Array.isArray(tracksDataA.events)).toBe(true);
  expect(tracksDataA.events).toEqual(expect.arrayContaining([
    expect.objectContaining({
      trackId: 'track_builder',
      sourceKind: 'config_version',
      sourceId: 'cfg_tracks_core_01',
      sourceTraceId: null,
    }),
    expect.objectContaining({
      trackId: 'track_web_ops',
      sourceKind: 'trace_event',
      sourceTraceId: webTraceId,
    }),
    expect.objectContaining({
      trackId: 'track_poker_mastery',
      sourceKind: 'trace_event',
      sourceTraceId: pokerTraceId,
    }),
    expect.objectContaining({
      trackId: 'track_analyst',
      sourceKind: 'trainer_result',
      sourceId: analystResultA,
      sourceTraceId: null,
    }),
    expect.objectContaining({
      trackId: 'track_analyst',
      sourceKind: 'trainer_result',
      sourceId: analystResultB,
      sourceTraceId: null,
    }),
  ]));
  expect(tracksDataA.events.filter((entry) => String(entry?.trackId || '') === 'track_poker_mastery')).toHaveLength(3);

  const tracksResponseB = await readTracks(page);
  expect(tracksResponseB.status).toBe(200);
  expect(tracksResponseB.json?.data).toEqual(tracksDataA);
});
