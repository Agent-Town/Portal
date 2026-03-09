const { test, expect } = require('@playwright/test');

const { resetPortalWebState } = require('./helpers/portal_web');
const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  createPlatformConfigVersion,
  createPlatformTrainerJob,
  promotePlatformConfigVersion,
} = require('./helpers/unified_platform');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

async function attachHouseToPageSession(page, houseId) {
  return await page.evaluate(async ({ nextHouseId, testResetToken }) => {
    const response = await fetch('/__test__/session/attach-house', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
        'x-test-reset': testResetToken,
      },
      body: JSON.stringify({ houseId: nextHouseId }),
    });
    return {
      status: response.status,
      json: await response.json(),
    };
  }, {
    nextHouseId: houseId,
    testResetToken: resetToken,
  });
}

async function readRuntimeWorkerSessionId(page) {
  await page.waitForFunction(async () => {
    try {
      if (!window.__openclawLiteTest || typeof window.__openclawLiteTest.runtimeSessionContext !== 'function') {
        return false;
      }
      const snapshot = await window.__openclawLiteTest.runtimeSessionContext({
        runtimeContext: {
          origin: window.location.origin,
          teamCode: '',
          houseId: '',
        },
        runtimeState: {},
      });
      const data = snapshot?.data || snapshot || null;
      return typeof data?.sessionId === 'string' && data.sessionId.trim().length > 0;
    } catch {
      return false;
    }
  }, null, { timeout: 10000 });

  return await page.evaluate(async () => {
    const snapshot = await window.__openclawLiteTest.runtimeSessionContext({
      runtimeContext: {
        origin: window.location.origin,
        teamCode: '',
        houseId: '',
      },
      runtimeState: {},
    });
    const data = snapshot?.data || snapshot || null;
    return String(data?.sessionId || '').trim();
  });
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

function buildConfigPayload(configVersionId) {
  return {
    configVersionId,
    teamId: 'team_main',
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

test('M19.18: House Trainer preserves worker continuity and shows durable jobs, results, approvals, and linked refs', async ({ page, request }) => {
  const seededHouse = await seedRecoverableTokenHouse(request);
  const configResp = await createPlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'house-trainer-config-001',
    payload: buildConfigPayload('cfg_house_trainer_seed_01'),
  });
  expect(configResp.status).toBe(201);
  const activateConfig = await promotePlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    configVersionId: 'cfg_house_trainer_seed_01',
    teamId: 'team_main',
    idempotencyKey: 'house-trainer-config-activate-001',
  });
  expect(activateConfig.status).toBe(200);

  const trainerJob = await createPlatformTrainerJob(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'house-trainer-job-001',
    payload: {
      teamId: 'team_main',
      jobKind: 'trainer_job.compare',
      targets: {
        configVersionIds: ['cfg_house_trainer_seed_01'],
      },
      budget: {
        maxUsd: 5,
      },
    },
  });
  expect(trainerJob.status).toBe(201);
  const trainerResultId = String(trainerJob.json?.data?.result?.trainerResultId || '');
  expect(trainerResultId).toMatch(/^trr_/);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const attached = await attachHouseToPageSession(page, seededHouse.houseId);
  expect(attached.status).toBe(200);

  await expect(page.locator('#districtModalBackdrop:not(.is-hidden)')).toHaveCount(1);
  const initialSessionId = await readRuntimeWorkerSessionId(page);

  await page.getByTestId('house-open-house-trainer').click();
  await expect(page.getByTestId('house-trainer-panel')).toBeVisible();
  await expect(page.locator('#houseTrainerJobs button')).toHaveCount(1);
  await expect(page.locator('#houseTrainerResults button')).toHaveCount(1);
  await expect(page.locator('#houseTrainerResults button')).toContainText(/approval needed/i);
  await page.locator(`#houseTrainerResults button[data-trainer-result-id="${trainerResultId}"]`).click();
  await expect(page.getByTestId('house-trainer-detail')).toContainText('patch_fixture_01');
  await expect(page.getByTestId('house-trainer-detail')).toContainText('cfg_house_trainer_seed_01');
  const afterOpenSessionId = await readRuntimeWorkerSessionId(page);
  expect(afterOpenSessionId).toBe(initialSessionId);
});

test('M19.18: House Trainer empty state is deterministic', async ({ page, request }) => {
  const seededHouse = await seedRecoverableTokenHouse(request);
  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const attached = await attachHouseToPageSession(page, seededHouse.houseId);
  expect(attached.status).toBe(200);

  await page.getByTestId('house-open-house-trainer').click();
  await expect(page.getByTestId('house-trainer-empty')).toContainText('No durable trainer jobs yet.');
});
