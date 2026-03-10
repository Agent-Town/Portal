const { test, expect } = require('@playwright/test');

const { resetPortalWebState } = require('./helpers/portal_web');
const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const {
  createPlatformConfigVersion,
  createPlatformRun,
  createPlatformTrainerJob,
  getPlatformCounts,
  getPlatformTrainerJob,
  getPlatformTrainerResult,
  ingestPlatformTraceRecords,
  promotePlatformConfigVersion,
} = require('./helpers/unified_platform');

function buildConfigPayload(configVersionId, {
  displayVersion = `${configVersionId}@2026.03.10`,
  branch = 'trainer-extended',
  housePolicyVersionId = 'hpv_20260310_01',
  agentConfigVersionIds = ['agv_20260310_01'],
  trainerPresetVersionId = 'tpv_20260310_01',
} = {}) {
  return {
    configVersionId,
    teamId: 'team_main',
    displayVersion,
    branch,
    status: 'candidate',
    componentRefs: {
      housePolicyVersionId,
      teamCompositionVersionId: 'tcv_20260310_01',
      agentConfigVersionIds,
      officePolicyVersionIds: [],
      experiencePresetVersionId: 'epv_20260310_01',
      integrationOverlayVersionIds: [],
      trainerPresetVersionId,
    },
  };
}

const JOB_CASES = [
  {
    jobKind: 'trainer_job.replay',
    artifactKind: 'trainer_replay_report',
    resultAssertion(data, traceId) {
      expect(data.replay).toMatchObject({
        traceIds: [traceId],
        canonicalEventCount: 2,
      });
      expect(Array.isArray(data.replay?.checkpoints)).toBe(true);
      expect(data.replay.checkpoints).toHaveLength(1);
    },
  },
  {
    jobKind: 'trainer_job.recommend',
    artifactKind: 'trainer_recommendation_report',
    resultAssertion(data) {
      expect(Array.isArray(data.recommendations)).toBe(true);
      expect(data.recommendations.length).toBeGreaterThan(0);
      expect(String(data.recommendations[0]?.suggestedAction || '')).toBeTruthy();
    },
  },
  {
    jobKind: 'trainer_job.guardrails',
    artifactKind: 'trainer_guardrails_report',
    resultAssertion(data) {
      expect(Array.isArray(data.guardrails)).toBe(true);
      expect(data.guardrails.length).toBeGreaterThan(0);
      expect(String(data.guardrails[0]?.rule || '')).toBeTruthy();
    },
  },
];

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M25.3: replay, recommend, and guardrails trainer jobs persist durable non-empty results and replay idempotently', async ({ request }) => {
  const seededHouse = await seedRecoverableTokenHouse(request);

  const configA = await createPlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'trainer-extended-config-a-001',
    payload: buildConfigPayload('cfg_trainer_extended_a_01'),
  });
  expect(configA.status).toBe(201);

  const configB = await createPlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'trainer-extended-config-b-001',
    payload: buildConfigPayload('cfg_trainer_extended_b_01', {
      displayVersion: 'cfg_trainer_extended_b_01@2026.03.11',
      housePolicyVersionId: 'hpv_20260310_02',
      agentConfigVersionIds: ['agv_20260310_02', 'agv_20260310_03'],
      trainerPresetVersionId: 'tpv_20260310_02',
    }),
  });
  expect(configB.status).toBe(201);

  const activateBase = await promotePlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    configVersionId: 'cfg_trainer_extended_a_01',
    teamId: 'team_main',
    idempotencyKey: 'trainer-extended-config-activate-001',
  });
  expect(activateBase.status).toBe(200);

  const run = await createPlatformRun(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    experienceId: 'agent_town_coop_v1',
    teamId: 'team_main',
    configVersionId: 'cfg_trainer_extended_a_01',
    entryMode: 'normal',
    idempotencyKey: 'trainer-extended-run-001',
  });
  expect(run.status).toBe(201);
  const runId = String(run.json?.data?.runId || '');
  expect(runId).toMatch(/^run_/);

  const ingested = await ingestPlatformTraceRecords(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    runId,
    idempotencyKey: 'trainer-extended-trace-001',
    records: [
      {
        ingestKey: 'trainer-extended:1',
        sourceType: 'worker',
        payloadSchema: 'raw.worker.turn/v1',
        payload: {
          kind: 'worker.turn',
          outcome: 'success',
        },
      },
      {
        ingestKey: 'trainer-extended:2',
        sourceType: 'worker',
        payloadSchema: 'raw.worker.turn/v1',
        payload: {
          kind: 'worker.turn',
          outcome: 'retry',
        },
      },
    ],
  });
  expect(ingested.status).toBe(200);
  expect(Number(ingested.json?.data?.accepted || 0)).toBe(2);
  const traceId = String(ingested.json?.data?.traceId || '');
  expect(traceId).toMatch(/^trace_/);

  const beforeCounts = await getPlatformCounts(request);

  for (const [index, jobCase] of JOB_CASES.entries()) {
    const idempotencyKey = `trainer-extended-${index + 1}-001`;
    const created = await createPlatformTrainerJob(request, {
      houseId: seededHouse.houseId,
      houseAuthKey: seededHouse.houseAuthKey,
      idempotencyKey,
      payload: {
        teamId: 'team_main',
        jobKind: jobCase.jobKind,
        targets: {
          runId,
          traceId,
          configVersionIds: ['cfg_trainer_extended_a_01', 'cfg_trainer_extended_b_01'],
        },
        budget: {
          maxUsd: 5,
        },
      },
    });
    expect(created.status).toBe(201);
    expect(String(created.json?.data?.jobKind || '')).toBe(jobCase.jobKind);
    const trainerJobId = String(created.json?.data?.trainerJobId || '');
    const trainerResultId = String(created.json?.data?.result?.trainerResultId || '');
    expect(trainerJobId).toMatch(/^trainer_/);
    expect(trainerResultId).toMatch(/^trr_/);

    const job = await getPlatformTrainerJob(request, {
      houseId: seededHouse.houseId,
      houseAuthKey: seededHouse.houseAuthKey,
      trainerJobId,
    });
    expect(job.status).toBe(200);
    expect(String(job.json?.data?.status || '')).toBe('succeeded');
    expect(String(job.json?.data?.result?.trainerResultId || '')).toBe(trainerResultId);
    expect(job.json?.data?.result?.approvalNeeded).toBe(false);

    const result = await getPlatformTrainerResult(request, {
      houseId: seededHouse.houseId,
      houseAuthKey: seededHouse.houseAuthKey,
      trainerResultId,
    });
    expect(result.status).toBe(200);
    expect(String(result.json?.data?.jobKind || '')).toBe(jobCase.jobKind);
    expect(String(result.json?.data?.summary || '')).toBeTruthy();
    expect(Array.isArray(result.json?.data?.artifactRefs)).toBe(true);
    expect(result.json?.data?.artifactRefs).toHaveLength(1);
    expect(result.json?.data?.artifactRefs?.[0]).toMatchObject({
      artifactKind: jobCase.artifactKind,
    });
    expect(Array.isArray(result.json?.data?.candidatePatchIds)).toBe(true);
    expect(result.json?.data?.candidatePatchIds).toHaveLength(0);
    expect(result.json?.data?.metrics).toBeTruthy();
    jobCase.resultAssertion(result.json?.data, traceId);

    const replayed = await createPlatformTrainerJob(request, {
      houseId: seededHouse.houseId,
      houseAuthKey: seededHouse.houseAuthKey,
      idempotencyKey,
      payload: {
        teamId: 'team_main',
        jobKind: jobCase.jobKind,
        targets: {
          runId,
          traceId,
          configVersionIds: ['cfg_trainer_extended_a_01', 'cfg_trainer_extended_b_01'],
        },
        budget: {
          maxUsd: 5,
        },
      },
    });
    expect(replayed.status).toBe(200);
    expect(String(replayed.json?.data?.trainerJobId || '')).toBe(trainerJobId);
    expect(String(replayed.json?.data?.result?.trainerResultId || '')).toBe(trainerResultId);
  }

  const afterCounts = await getPlatformCounts(request);
  expect(Number(afterCounts.counts?.trainer_jobs || 0) - Number(beforeCounts.counts?.trainer_jobs || 0)).toBe(3);
  expect(Number(afterCounts.counts?.trainer_results || 0) - Number(beforeCounts.counts?.trainer_results || 0)).toBe(3);
  expect(Number(afterCounts.counts?.trace_artifacts || 0) - Number(beforeCounts.counts?.trace_artifacts || 0)).toBe(3);
});
