const { test, expect } = require('@playwright/test');

const { resetPortalWebState } = require('./helpers/portal_web');
const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { waitForLiteApi, setDeterministicLlm } = require('./helpers/trainer');
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
      configVersionId: 'cfg_house_district_alpha_01',
      runIdempotencyKey: 'house-district-run-alpha-001',
      traceIngestIdempotencyKey: 'house-district-ingest-alpha-001',
      trainerIdempotencyKey: 'house-district-trainer-alpha-001',
      ingestKey: 'district-alpha:1',
    },
    {
      teamId: 'team_beta',
      configVersionId: 'cfg_house_district_beta_01',
      runIdempotencyKey: 'house-district-run-beta-001',
      traceIngestIdempotencyKey: 'house-district-ingest-beta-001',
      trainerIdempotencyKey: 'house-district-trainer-beta-001',
      ingestKey: 'district-beta:1',
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

test('M29.4: House Office district shell keeps section routing and team continuity inside the existing shell', async ({ page, request }) => {
  test.slow();
  test.setTimeout(60_000);
  const { seededHouse, teams } = await seedMultiTeamSurface(request);
  const [teamAlpha, teamBeta] = teams;
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  await setDeterministicLlm(page);
  const attached = await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: teamAlpha.teamId,
  });
  expect(attached.status).toBe(200);

  await expect(page.locator('#districtModalBackdrop:not(.is-hidden)')).toHaveCount(1);
  await expect(page.getByTestId('house-console-panel')).toBeVisible();
  await expect(page.getByTestId('house-office-district-shell')).toBeVisible();
  await expect(page.getByTestId('house-office-district-section')).toHaveText([
    'Front Desk',
    'Workshop Wing',
    'Analysis Wing',
    'Archive Wing',
    'Operations Wing',
    'Tracks Board',
  ]);
  await expect(page.locator('[data-testid="house-office-district-shell"] canvas')).toHaveCount(0);
  expect(page.url()).toContain('/app');
  expect(page.url()).toContain('district=house');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  const initialWorkerSessionId = await readWorkerSessionId(page);

  await page.locator('#houseDistrictWorkshopBtn').click();
  await expect(page.getByTestId('house-workshop-panel')).toBeVisible();
  expect(await readWorkerSessionId(page)).toBe(initialWorkerSessionId);

  await page.locator('#houseDistrictAnalysisBtn').click();
  await expect(page.getByTestId('house-trainer-panel')).toBeVisible();
  await expect(page.locator(`#houseTrainerJobs button[data-trainer-job-id="${teamAlpha.trainerJobId}"]`)).toHaveCount(1);
  expect(await readWorkerSessionId(page)).toBe(initialWorkerSessionId);

  await page.getByTestId('house-team-select').selectOption(teamBeta.teamId);
  await expect(page.getByTestId('house-team-summary')).toContainText(teamBeta.teamId);
  await expect(page.locator(`#houseTrainerJobs button[data-trainer-job-id="${teamBeta.trainerJobId}"]`)).toHaveCount(1);
  await expect(page.locator(`#houseTrainerJobs button[data-trainer-job-id="${teamAlpha.trainerJobId}"]`)).toHaveCount(0);
  expect(await readWorkerSessionId(page)).toBe(initialWorkerSessionId);

  await page.locator('#houseDistrictArchiveBtn').click();
  await expect(page.getByTestId('house-archive-panel')).toBeVisible();
  await expect(page.locator(`#houseArchiveList button[data-trace-id="${teamBeta.traceId}"]`)).toHaveCount(1);
  await expect(page.locator(`#houseArchiveList button[data-trace-id="${teamAlpha.traceId}"]`)).toHaveCount(0);
  expect(await readWorkerSessionId(page)).toBe(initialWorkerSessionId);

  await page.locator('#houseDistrictFrontDeskBtn').click();
  await expect(page.getByTestId('house-office-panel')).toBeVisible();
  expect(await readWorkerSessionId(page)).toBe(initialWorkerSessionId);
});
