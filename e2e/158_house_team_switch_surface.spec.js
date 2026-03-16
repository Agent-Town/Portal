const { test, expect } = require('@playwright/test');

const { resetPortalWebState } = require('./helpers/portal_web');
const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  createPlatformRun,
  createPlatformTrainerJob,
  ingestPlatformTraceRecords,
  readWorkerSessionId,
  seedPlatformConfigVersion,
} = require('./helpers/unified_platform');

async function seedMultiTeamSurface(request) {
  const seededHouse = await seedRecoverableTokenHouse(request);
  const teams = [
    {
      teamId: 'team_alpha',
      configVersionId: 'cfg_house_switch_alpha_01',
      runIdempotencyKey: 'house-switch-run-alpha-001',
      traceIngestIdempotencyKey: 'house-switch-ingest-alpha-001',
      trainerIdempotencyKey: 'house-switch-trainer-alpha-001',
      ingestKey: 'switch-alpha:1',
    },
    {
      teamId: 'team_beta',
      configVersionId: 'cfg_house_switch_beta_01',
      runIdempotencyKey: 'house-switch-run-beta-001',
      traceIngestIdempotencyKey: 'house-switch-ingest-beta-001',
      trainerIdempotencyKey: 'house-switch-trainer-beta-001',
      ingestKey: 'switch-beta:1',
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

  return { seededHouse, teams };
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M20.2: House team selector switches Archive and Trainer in place without restarting the worker', async ({ page, request }) => {
  test.slow();
  test.setTimeout(60_000);
  const { seededHouse, teams } = await seedMultiTeamSurface(request);
  const [teamAlpha, teamBeta] = teams;

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const attached = await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: teamAlpha.teamId,
  });
  expect(attached.status).toBe(200);

  await expect(page.locator('#districtModalBackdrop:not(.is-hidden)')).toHaveCount(1);
  await page.getByTestId('house-open-archive').click();
  await expect.poll(async () => {
    return await page.locator('[data-testid="house-team-select"] option').evaluateAll((options) => options.map((option) => option.textContent || ''));
  }).toEqual([teamAlpha.teamId, teamBeta.teamId]);

  const initialWorkerSessionId = await readWorkerSessionId(page);

  await expect(page.locator(`#houseArchiveList button[data-trace-id="${teamAlpha.traceId}"]`)).toHaveCount(1);

  await page.getByTestId('house-team-select').selectOption(teamBeta.teamId);
  await expect(page.getByTestId('house-team-summary')).toContainText(teamBeta.teamId);
  await expect(page.locator(`#houseArchiveList button[data-trace-id="${teamBeta.traceId}"]`)).toHaveCount(1);
  await expect(page.locator(`#houseArchiveList button[data-trace-id="${teamAlpha.traceId}"]`)).toHaveCount(0);

  await page.getByTestId('house-open-house-trainer').click();
  await expect(page.locator(`#houseTrainerJobs button[data-trainer-job-id="${teamBeta.trainerJobId}"]`)).toHaveCount(1);
  await expect(page.locator(`#houseTrainerJobs button[data-trainer-job-id="${teamAlpha.trainerJobId}"]`)).toHaveCount(0);

  const afterSwitchWorkerSessionId = await readWorkerSessionId(page);
  expect(afterSwitchWorkerSessionId).toBe(initialWorkerSessionId);
  expect(page.url()).toContain('/app');
  expect(page.url()).toContain('district=house');
});
