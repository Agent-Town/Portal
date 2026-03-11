const fs = require('fs');
const path = require('path');
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
    branch: 'house-office-unified-smoke',
    status: 'candidate',
    componentRefs: {
      housePolicyVersionId: 'hpv_house_office_smoke_01',
      teamCompositionVersionId: 'tcv_house_office_smoke_01',
      agentConfigVersionIds: ['agv_house_office_smoke_01'],
      officePolicyVersionIds: [],
      experiencePresetVersionId: 'epv_house_office_smoke_01',
      integrationOverlayVersionIds: [],
      trainerPresetVersionId: 'tpv_house_office_smoke_01',
    },
  };
}

async function seedHouseOfficeSmokeScenario(request) {
  const seededHouse = await seedRecoverableTokenHouse(request);
  const configVersionId = 'cfg_house_office_smoke_01';

  const createdConfig = await createPlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'house-office-smoke-config-001',
    payload: buildConfigPayload(configVersionId),
  });
  expect(createdConfig.status).toBe(201);

  const promotedConfig = await promotePlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    configVersionId,
    teamId: 'team_main',
    idempotencyKey: 'house-office-smoke-promote-001',
  });
  expect(promotedConfig.status).toBe(200);

  const pokerRun = await createPlatformRun(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    experienceId: 'poker.season',
    teamId: 'team_main',
    configVersionId,
    entryMode: 'season_lock',
    idempotencyKey: 'house-office-smoke-run-001',
  });
  expect(pokerRun.status).toBe(201);
  const pokerRunId = String(pokerRun.json?.data?.runId || '').trim();
  expect(pokerRunId).toBeTruthy();

  const pokerIngest = await ingestPlatformTraceRecords(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    runId: pokerRunId,
    idempotencyKey: 'house-office-smoke-ingest-001',
    records: [
      {
        ingestKey: 'house-office-smoke-poker-hand-001',
        sourceType: 'operator',
        payloadSchema: 'raw.poker.hand/v1',
        payload: {
          kind: 'hand_summary',
          handId: 'smoke-hand-001',
          winner: 'seat_2',
        },
      },
    ],
  });
  expect(pokerIngest.status).toBe(200);

  const trainerJob = await createPlatformTrainerJob(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'house-office-smoke-trainer-001',
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

function verifyHouseOfficeDocs() {
  const repoRoot = process.cwd();
  const phase28 = fs.readFileSync(path.join(repoRoot, 'specs', '28_house_office_star_office_inspired_extension_spec.md'), 'utf8');
  const phase29 = fs.readFileSync(path.join(repoRoot, 'specs', '29_house_office_extension_tdd_spec.md'), 'utf8');
  const phase30 = fs.readFileSync(path.join(repoRoot, 'specs', '30_house_office_extension_agent_runbook.md'), 'utf8');
  expect(phase28).toContain('Option 2');
  expect(phase28).toContain('Option 3');
  expect(phase29).toContain('e2e/202_house_office_unified_smoke.spec.js');
  expect(phase30).toContain('T29.7');
}

async function runHouseOfficeJourney(page, fixture) {
  const checkpoints = [];
  const initialWorkerSessionId = await readWorkerSessionId(page);
  const initialContext = await getPlatformContextFromPage(page);
  const initialUrl = page.url();

  await page.getByTestId('house-open-office').click();
  await expect(page.getByTestId('house-office-panel')).toBeVisible();
  await expect(page.getByTestId('house-office-briefing-group')).toHaveCount(4);
  await expect(page.getByTestId('house-office-attention-item')).toHaveCount(3);
  checkpoints.push(`${fixture.checkpoints[0]}:${String(initialContext?.data?.activeTeamId || '')}`);

  const firstGroupText = await page.getByTestId('house-office-briefing-group').nth(0).innerText();
  expect(firstGroupText).toContain('Archive');
  checkpoints.push(`${fixture.checkpoints[1]}:${String(fixture.briefingSurface || '')}`);

  await page.getByTestId('house-office-attention-item').nth(0).click();
  await expect(page.getByTestId('house-trainer-panel')).toBeVisible();
  checkpoints.push(`${fixture.checkpoints[2]}:${String(fixture.attentionSurface || '')}`);

  await page.getByRole('button', { name: String(fixture.districtSectionLabel || 'Workshop Wing') }).click();
  await expect(page.getByTestId('house-workshop-panel')).toBeVisible();
  checkpoints.push(`${fixture.checkpoints[3]}:${String(fixture.districtSectionId || '')}`);

  await page.getByRole('button', { name: 'Front Desk' }).click();
  await expect(page.getByTestId('house-office-panel')).toBeVisible();
  await page.getByTestId('house-office-briefing-citation').first().click();
  await expect(page.getByTestId('house-archive-panel')).toBeVisible();
  checkpoints.push(`${fixture.checkpoints[4]}:${String(fixture.briefingSurface || '')}`);

  expect(await readWorkerSessionId(page)).toBe(initialWorkerSessionId);
  const finalContext = await getPlatformContextFromPage(page);
  expect(String(finalContext?.data?.activeTeamId || '')).toBe(String(initialContext?.data?.activeTeamId || ''));
  expect(page.url()).toBe(initialUrl);

  return checkpoints;
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M29.7: House Office unified smoke stays inside one shell and replays the same checkpoints exactly', async ({ page, request }) => {
  const fixtureEnvelope = await getPlatformFixture(request, 'house_office_smoke_seed');
  expect(fixtureEnvelope?.ok).toBe(true);
  const fixture = fixtureEnvelope?.fixture || {};
  expect(Array.isArray(fixture?.checkpoints)).toBe(true);
  expect(fixture.checkpoints).toEqual([
    'house_office_overview',
    'house_office_briefing',
    'house_office_attention',
    'house_office_district',
    'house_source_surface',
  ]);

  const scenario = await seedHouseOfficeSmokeScenario(request);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const attached = await attachHouseToPageSession(page, {
    houseId: scenario.seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  verifyHouseOfficeDocs();

  const firstRunCheckpoints = await runHouseOfficeJourney(page, fixture);
  await page.reload();
  await waitForLiteApi(page);
  const reattached = await attachHouseToPageSession(page, {
    houseId: scenario.seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(reattached.status).toBe(200);
  const secondRunCheckpoints = await runHouseOfficeJourney(page, fixture);

  expect(secondRunCheckpoints).toEqual(firstRunCheckpoints);
});
