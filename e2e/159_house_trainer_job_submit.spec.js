const { test, expect } = require('@playwright/test');

const { getTableCount, resetPortalWebState } = require('./helpers/portal_web');
const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const {
  gotoAppWithLite,
  listTrainerAttemptIds,
  openTrainerFromSidebar,
  runExperience,
  setDeterministicLlm,
  visitSkill,
  waitForLiteApi,
} = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  createPlatformConfigVersion,
  promotePlatformConfigVersion,
} = require('./helpers/unified_platform');

function buildConfigPayload(configVersionId, teamId) {
  return {
    configVersionId,
    teamId,
    displayVersion: `${configVersionId}@2026.03.09`,
    branch: 'season-lock',
    status: 'candidate',
    componentRefs: {
      housePolicyVersionId: 'hpv_20260309_01',
      teamCompositionVersionId: 'tcv_20260309_01',
      agentConfigVersionIds: ['agv_20260309_01'],
      officePolicyVersionIds: [],
      experiencePresetVersionId: 'epv_20260309_01',
      integrationOverlayVersionIds: [],
      trainerPresetVersionId: 'tpv_20260309_01',
    },
  };
}

async function readPlatformTrainerPayload(page) {
  return await page.evaluate(async () => {
    const response = await fetch('/api/platform/trainer', {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    });
    return await response.json();
  });
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M20.3: House Trainer creates one durable compare job, replays idempotently, and local cache deletion leaves durable rows unchanged', async ({ page, request }) => {
  const seededHouse = await seedRecoverableTokenHouse(request);
  const configVersionId = 'cfg_house_submit_team_alpha_01';
  const teamId = 'team_alpha';
  const configResp = await createPlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'house-submit-config-001',
    payload: buildConfigPayload(configVersionId, teamId),
  });
  expect(configResp.status).toBe(201);
  const promotedConfig = await promotePlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    configVersionId,
    teamId,
    idempotencyKey: 'house-submit-config-promote-001',
  });
  expect(promotedConfig.status).toBe(200);

  await gotoAppWithLite(page);
  await setDeterministicLlm(page);
  const visit = await visitSkill(page, '/skill.md');
  expect(visit?.ok).toBe(true);
  await runExperience(page, 'phase20 local cache probe');
  const localAttemptIds = await listTrainerAttemptIds(page);
  expect(localAttemptIds.length).toBeGreaterThan(0);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const attached = await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId,
  });
  expect(attached.status).toBe(200);

  const jobsBefore = await getTableCount(request, 'trainer_jobs');
  const resultsBefore = await getTableCount(request, 'trainer_results');

  await page.getByTestId('house-open-house-trainer').click();
  await expect(page.getByTestId('house-trainer-create-compare')).toBeEnabled();
  await page.getByTestId('house-trainer-create-compare').click();
  await expect(page.getByTestId('house-trainer-action-status')).toContainText('Durable compare job ready');
  await expect(page.locator('#houseTrainerJobs button')).toHaveCount(1);
  await expect(page.locator('#houseTrainerResults button')).toHaveCount(1);

  const trainerPayload = await readPlatformTrainerPayload(page);
  const trainerData = trainerPayload?.data || trainerPayload || {};
  expect(String(trainerData.houseId || '')).toBe(seededHouse.houseId);
  expect(String(trainerData.teamId || '')).toBe(teamId);
  expect(String(trainerData.activeConfigVersionId || '')).toBe(configVersionId);
  expect((trainerData.jobs || []).map((job) => String(job.teamId || ''))).toEqual([teamId]);
  expect((trainerData.jobs || []).map((job) => String(job.jobKind || ''))).toEqual(['trainer_job.compare']);

  const jobsAfterCreate = await getTableCount(request, 'trainer_jobs');
  const resultsAfterCreate = await getTableCount(request, 'trainer_results');
  expect(jobsAfterCreate).toBe(jobsBefore + 1);
  expect(resultsAfterCreate).toBe(resultsBefore + 1);

  const createdTrainerJobId = await page.locator('#houseTrainerJobs button').first().getAttribute('data-trainer-job-id');
  expect(String(createdTrainerJobId || '')).toMatch(/^trainer_/);

  await page.getByTestId('house-trainer-create-compare').click();
  await expect(page.locator('#houseTrainerJobs button')).toHaveCount(1);
  await expect(page.locator('#houseTrainerJobs button').first()).toHaveAttribute('data-trainer-job-id', String(createdTrainerJobId || ''));

  const jobsAfterReplay = await getTableCount(request, 'trainer_jobs');
  const resultsAfterReplay = await getTableCount(request, 'trainer_results');
  expect(jobsAfterReplay).toBe(jobsAfterCreate);
  expect(resultsAfterReplay).toBe(resultsAfterCreate);

  await page.goto('/?liteDriver=phase1');
  await waitForLiteApi(page);
  await openTrainerFromSidebar(page);
  await expect(page.getByTestId('trainer-attempts').getByRole('button')).toHaveCount(localAttemptIds.length);
  await page.getByTestId('trainer-clear-all').click();
  await expect(page.getByTestId('trainer-attempts')).toContainText('No attempts yet.');

  const jobsAfterLocalDelete = await getTableCount(request, 'trainer_jobs');
  const resultsAfterLocalDelete = await getTableCount(request, 'trainer_results');
  expect(jobsAfterLocalDelete).toBe(jobsAfterCreate);
  expect(resultsAfterLocalDelete).toBe(resultsAfterCreate);
});
