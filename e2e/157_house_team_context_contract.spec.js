const { test, expect } = require('@playwright/test');

const { resetPortalWebState } = require('./helpers/portal_web');
const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  createPlatformRun,
  createPlatformTrainerJob,
  getPlatformContextFromPage,
  ingestPlatformTraceRecords,
  seedPlatformConfigVersion,
} = require('./helpers/unified_platform');

async function readHousePlatformPayload(page, path) {
  return await page.evaluate(async (nextPath) => {
    const response = await fetch(nextPath, {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    });
    return await response.json();
  }, path);
}

async function seedMultiTeamHouse(request) {
  const seededHouse = await seedRecoverableTokenHouse(request);
  const teams = [
    {
      teamId: 'team_alpha',
      configVersionId: 'cfg_house_team_alpha_01',
      runIdempotencyKey: 'house-team-run-alpha-001',
      traceIngestIdempotencyKey: 'house-team-ingest-alpha-001',
      trainerIdempotencyKey: 'house-team-trainer-alpha-001',
      ingestKey: 'alpha-worker:1',
    },
    {
      teamId: 'team_beta',
      configVersionId: 'cfg_house_team_beta_01',
      runIdempotencyKey: 'house-team-run-beta-001',
      traceIngestIdempotencyKey: 'house-team-ingest-beta-001',
      trainerIdempotencyKey: 'house-team-trainer-beta-001',
      ingestKey: 'beta-worker:1',
    },
  ];

  for (const team of teams) {
    const seededConfig = await seedPlatformConfigVersion(request, {
      configVersionId: team.configVersionId,
      houseId: seededHouse.houseId,
      teamId: team.teamId,
      status: 'active',
    });
    expect(seededConfig.ok).toBe(true);

    const run = await createPlatformRun(request, {
      houseId: seededHouse.houseId,
      houseAuthKey: seededHouse.houseAuthKey,
      configVersionId: team.configVersionId,
      teamId: team.teamId,
      idempotencyKey: team.runIdempotencyKey,
    });
    expect(run.status).toBe(201);
    team.runId = String(run.json?.data?.runId || '');

    const ingest = await ingestPlatformTraceRecords(request, {
      houseId: seededHouse.houseId,
      houseAuthKey: seededHouse.houseAuthKey,
      runId: team.runId,
      idempotencyKey: team.traceIngestIdempotencyKey,
      records: [
        {
          ingestKey: team.ingestKey,
          sourceType: 'worker',
          payloadSchema: 'raw.web.observation/v1',
          payload: {
            kind: 'navigate',
            url: `https://example.com/${team.teamId}`,
          },
        },
      ],
    });
    expect(ingest.status).toBe(200);
    team.traceId = String(ingest.json?.data?.traceId || '');

    const trainer = await createPlatformTrainerJob(request, {
      houseId: seededHouse.houseId,
      houseAuthKey: seededHouse.houseAuthKey,
      idempotencyKey: team.trainerIdempotencyKey,
      payload: {
        teamId: team.teamId,
        jobKind: 'trainer_job.compare',
        targets: {
          configVersionIds: [team.configVersionId],
        },
        budget: {
          maxUsd: 5,
        },
      },
    });
    expect(trainer.status).toBe(201);
    team.trainerJobId = String(trainer.json?.data?.trainerJobId || '');
  }

  return {
    seededHouse,
    teams,
  };
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M20.1: House-private read routes resolve omitted teamId from explicit active team context', async ({ page, request }) => {
  const { seededHouse, teams } = await seedMultiTeamHouse(request);
  const [teamAlpha, teamBeta] = teams;
  const observedRequests = [];
  page.on('request', (req) => {
    const url = String(req.url() || '');
    if (url.includes('/api/platform/')) observedRequests.push(url);
  });

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const attached = await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: teamAlpha.teamId,
  });
  expect(attached.status).toBe(200);

  await expect.poll(async () => {
    const payload = await getPlatformContextFromPage(page);
    const data = payload?.data || payload || {};
    return String(data.activeTeamId || '');
  }).toBe(teamAlpha.teamId);

  await page.reload();
  await waitForLiteApi(page);
  await expect.poll(async () => {
    const payload = await getPlatformContextFromPage(page);
    const data = payload?.data || payload || {};
    return String(data.activeTeamId || '');
  }).toBe(teamAlpha.teamId);

  await page.getByTestId('house-open-archive').click();
  const archiveAlpha = await readHousePlatformPayload(page, '/api/platform/archive');
  expect(String(archiveAlpha?.data?.teamId || '')).toBe(teamAlpha.teamId);
  expect((archiveAlpha?.data?.items || []).map((item) => item.traceId)).toEqual([teamAlpha.traceId]);

  await page.getByTestId('house-open-house-trainer').click();
  const trainerAlpha = await readHousePlatformPayload(page, '/api/platform/trainer');
  expect(String(trainerAlpha?.data?.teamId || '')).toBe(teamAlpha.teamId);
  expect((trainerAlpha?.data?.jobs || []).map((item) => item.trainerJobId)).toEqual([teamAlpha.trainerJobId]);

  const switchResponse = await page.evaluate(async (teamId) => {
    const response = await fetch('/api/platform/active-team', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ teamId }),
    });
    return await response.json();
  }, teamBeta.teamId);
  expect(String(switchResponse?.data?.activeTeamId || '')).toBe(teamBeta.teamId);

  const archiveBeta = await readHousePlatformPayload(page, '/api/platform/archive');
  expect(String(archiveBeta?.data?.teamId || '')).toBe(teamBeta.teamId);
  expect((archiveBeta?.data?.items || []).map((item) => item.traceId)).toEqual([teamBeta.traceId]);

  const trainerBeta = await readHousePlatformPayload(page, '/api/platform/trainer');
  expect(String(trainerBeta?.data?.teamId || '')).toBe(teamBeta.teamId);
  expect((trainerBeta?.data?.jobs || []).map((item) => item.trainerJobId)).toEqual([teamBeta.trainerJobId]);

  expect(observedRequests.some((url) => url.includes('team_main'))).toBe(false);
});
