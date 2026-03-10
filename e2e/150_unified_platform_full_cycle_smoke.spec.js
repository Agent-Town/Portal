const { test, expect } = require('@playwright/test');

const { resetPortalWebState } = require('./helpers/portal_web');
const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const {
  listTrainerAttemptIds,
  openTrainerFromSidebar,
  runExperience,
  setDeterministicLlm,
  visitSkill,
  waitForLiteApi,
} = require('./helpers/trainer');
const {
  compileDefaultSkillPack,
  createPlatformConfigVersion,
  createPlatformRun,
  createPlatformTrainerJob,
  getDefaultCompiledPackManifest,
  getPlatformConfigVersionRecord,
  getPlatformTeamBinding,
  getPlatformTraceSummary,
  getPlatformTrainerJob,
  getPlatformTrainerResult,
  ingestPlatformTraceRecords,
  promotePlatformConfigVersion,
  promotePlatformTrainerResultPatch,
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

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M19.19: full-cycle smoke preserves skill compatibility, durable archive/trainer data, and local cache boundaries', async ({ page, request }) => {
  const seededHouse = await seedRecoverableTokenHouse(request);

  const skillResp = await request.get('/skill.md');
  expect(skillResp.ok()).toBe(true);
  const skillText = await skillResp.text();
  expect(skillText).toContain('name: agent-town-playbook');
  expect(skillText).toContain('## Required input');
  expect(skillText).toContain('## Core co-op loop');
  expect(skillText).toContain('POST /api/agent/connect');

  const baseConfigResp = await createPlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'full-cycle-config-base-001',
    payload: buildConfigPayload('cfg_full_cycle_base_01'),
  });
  expect(baseConfigResp.status).toBe(201);
  expect(String(baseConfigResp.json?.data?.configVersionId || '')).toBe('cfg_full_cycle_base_01');

  const activateBase = await promotePlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    configVersionId: 'cfg_full_cycle_base_01',
    teamId: 'team_main',
    idempotencyKey: 'full-cycle-config-base-promote-001',
  });
  expect(activateBase.status).toBe(200);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const attached = await attachHouseToPageSession(page, seededHouse.houseId);
  expect(attached.status).toBe(200);
  await expect(page.locator('#districtModalBackdrop:not(.is-hidden)')).toHaveCount(1);
  await expect(page.getByTestId('house-console-panel')).toBeVisible();
  const initialSessionId = await readRuntimeWorkerSessionId(page);
  expect(initialSessionId).toMatch(/^sess_/);

  const importedSkill = await visitSkill(page, '/skill.md');
  expect(importedSkill?.ok).toBe(true);
  const compiledPack = await compileDefaultSkillPack(page, {
    idempotencyKey: 'full-cycle-pack-001',
  });
  const compiledManifest = await getDefaultCompiledPackManifest(page);
  const packVersionId = String(compiledManifest?.packVersionId || compiledPack?.packVersionId || '');
  expect(packVersionId).toMatch(/^packv_/);
  expect(String(compiledManifest?.packVersionId || '')).toBe(packVersionId);
  expect(String(compiledManifest?.sourceRefs?.[0]?.path || '')).toBe('/skill.md');

  const runResp = await createPlatformRun(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    configVersionId: 'cfg_full_cycle_base_01',
    idempotencyKey: 'full-cycle-run-001',
    metadata: {
      scenario: 'full-cycle-smoke',
      packVersionId,
    },
  });
  expect(runResp.status).toBe(201);
  const runId = String(runResp.json?.data?.runId || '');
  expect(runId).toMatch(/^run_/);

  const ingest = await ingestPlatformTraceRecords(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    runId,
    idempotencyKey: 'full-cycle-ingest-001',
    records: [
      {
        ingestKey: 'worker_full_cycle:1',
        sourceType: 'worker',
        payloadSchema: 'raw.web.observation/v1',
        payload: { kind: 'navigate', url: 'https://example.com/full-cycle' },
      },
      {
        ingestKey: 'worker_full_cycle:1',
        sourceType: 'worker',
        payloadSchema: 'raw.web.observation/v1',
        payload: { kind: 'navigate', url: 'https://example.com/full-cycle' },
      },
      {
        ingestKey: 'worker_full_cycle:invalid',
        sourceType: 'worker',
        payloadSchema: '',
        payload: { kind: 'invalid' },
      },
    ],
  });
  expect(ingest.status).toBe(200);
  expect(ingest.json?.data?.accepted).toBe(1);
  expect(ingest.json?.data?.ignored).toBe(1);
  expect(ingest.json?.data?.rejected).toBe(1);
  const traceId = String(ingest.json?.data?.traceId || '');
  expect(traceId).toMatch(/^trace_/);

  const traceSummary = await getPlatformTraceSummary(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    traceId,
  });
  expect(traceSummary.status).toBe(200);
  expect(traceSummary.json?.data).toMatchObject({
    traceId,
    runId,
    eventCount: 1,
    archiveCounters: {
      accepted: 1,
      ignored: 1,
      rejected: 1,
    },
  });

  const createdTrainerJob = await createPlatformTrainerJob(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'full-cycle-trainer-job-001',
    payload: {
      teamId: 'team_main',
      jobKind: 'trainer_job.compare',
      targets: {
        configVersionIds: ['cfg_full_cycle_base_01'],
        runIds: [runId],
        traceIds: [traceId],
      },
      budget: {
        maxUsd: 5,
      },
    },
  });
  expect(createdTrainerJob.status).toBe(201);
  const trainerJobId = String(createdTrainerJob.json?.data?.trainerJobId || '');
  expect(trainerJobId).toMatch(/^trainer_/);

  const trainerJob = await getPlatformTrainerJob(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    trainerJobId,
  });
  expect(trainerJob.status).toBe(200);
  expect(String(trainerJob.json?.data?.status || '')).toBe('succeeded');
  expect(trainerJob.json?.data?.targets || {}).toMatchObject({
    configVersionIds: ['cfg_full_cycle_base_01'],
    runIds: [runId],
    traceIds: [traceId],
  });

  const trainerResultId = String(trainerJob.json?.data?.result?.trainerResultId || '');
  expect(trainerResultId).toMatch(/^trr_/);
  const trainerResult = await getPlatformTrainerResult(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    trainerResultId,
  });
  expect(trainerResult.status).toBe(200);
  expect(String(trainerResult.json?.data?.linkedConfigVersionId || '')).toBe('cfg_full_cycle_base_01');
  const candidatePatchId = String(trainerResult.json?.data?.candidatePatchIds?.[0] || '');
  expect(candidatePatchId).toMatch(/^patch_/);

  const promotePatch = await promotePlatformTrainerResultPatch(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    trainerResultId,
    idempotencyKey: 'full-cycle-trainer-promote-001',
    payload: {
      teamId: 'team_main',
      candidatePatchId,
      approvalId: 'appr_fixture_approved_01',
    },
  });
  expect(promotePatch.status).toBe(201);
  const promotedConfigVersionId = String(promotePatch.json?.data?.configVersionId || '');
  expect(promotedConfigVersionId).toMatch(/^cfg_/);
  expect(String(promotePatch.json?.data?.activeConfigVersionId || '')).toBe(promotedConfigVersionId);

  const activeBinding = await getPlatformTeamBinding(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    teamId: 'team_main',
  });
  expect(activeBinding.status).toBe(200);
  expect(String(activeBinding.json?.data?.activeConfigVersionId || '')).toBe(promotedConfigVersionId);

  const promotedConfig = await getPlatformConfigVersionRecord(request, promotedConfigVersionId);
  expect(promotedConfig.status).toBe(200);
  expect(promotedConfig.json?.config?.lineage || {}).toMatchObject({
    trainerJobId,
    trainerResultId,
    candidatePatchId,
  });

  await page.getByTestId('house-open-archive').click();
  await expect(page.getByTestId('house-archive-panel')).toBeVisible();
  await expect(page.locator(`#houseArchiveList button[data-trace-id="${traceId}"]`)).toHaveCount(1);
  await page.locator(`#houseArchiveList button[data-trace-id="${traceId}"]`).click();
  await expect(page.getByTestId('house-archive-detail')).toContainText(traceId);
  await expect(page.getByTestId('house-archive-detail')).toContainText('accepted 1');
  await expect(page.getByTestId('house-archive-detail')).toContainText('ignored 1');
  await expect(page.getByTestId('house-archive-detail')).toContainText('rejected 1');
  const afterArchiveSessionId = await readRuntimeWorkerSessionId(page);
  expect(afterArchiveSessionId).toBe(initialSessionId);

  await page.getByTestId('house-open-house-trainer').click();
  await expect(page.getByTestId('house-trainer-panel')).toBeVisible();
  await expect(page.locator(`#houseTrainerJobs button[data-trainer-job-id="${trainerJobId}"]`)).toHaveCount(1);
  await expect(page.locator(`#houseTrainerResults button[data-trainer-result-id="${trainerResultId}"]`)).toHaveCount(1);
  await page.locator(`#houseTrainerResults button[data-trainer-result-id="${trainerResultId}"]`).click();
  await expect(page.getByTestId('house-trainer-detail')).toContainText(trainerResultId);
  await expect(page.getByTestId('house-trainer-detail')).toContainText(promotedConfigVersionId);
  await expect(page.getByTestId('house-trainer-detail')).toContainText(candidatePatchId);
  const afterTrainerSessionId = await readRuntimeWorkerSessionId(page);
  expect(afterTrainerSessionId).toBe(initialSessionId);

  await setDeterministicLlm(page);
  const visit = await visitSkill(page, '/skill.md');
  expect(visit?.ok).toBe(true);
  await runExperience(page, 'trainer probe: lite echo');
  await runExperience(page, 'trainer probe: missing tool');
  await openTrainerFromSidebar(page);

  const localAttemptIds = await listTrainerAttemptIds(page);
  expect(localAttemptIds).toHaveLength(2);
  await page.getByTestId('trainer-attempt-delete').first().click();
  await expect(page.locator('#trainerStatusLine')).toContainText('Deleted local trace cache');
  await page.getByTestId('trainer-clear-all').click();
  await expect(page.locator('#trainerStatusLine')).toContainText('Cleared 1 local cache attempt');
  expect(await listTrainerAttemptIds(page)).toHaveLength(0);
  await page.locator('#trainerModalClose').click();
  await expect(page.getByTestId('trainer-modal')).toHaveAttribute('aria-hidden', 'true');

  const traceSummaryAfterLocalDelete = await getPlatformTraceSummary(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    traceId,
  });
  expect(traceSummaryAfterLocalDelete.status).toBe(200);
  expect(traceSummaryAfterLocalDelete.json?.data).toMatchObject({
    traceId,
    runId,
    archiveCounters: {
      accepted: 1,
      ignored: 1,
      rejected: 1,
    },
  });

  await page.reload();
  await waitForLiteApi(page);
  const reattached = await attachHouseToPageSession(page, seededHouse.houseId);
  expect(reattached.status).toBe(200);
  await page.getByTestId('house-open-archive').click();
  await expect(page.locator(`#houseArchiveList button[data-trace-id="${traceId}"]`)).toHaveCount(1);
  await page.locator(`#houseArchiveList button[data-trace-id="${traceId}"]`).click();
  await expect(page.getByTestId('house-archive-detail')).toContainText(traceId);
});
