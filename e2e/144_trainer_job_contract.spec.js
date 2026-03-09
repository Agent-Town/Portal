const { test, expect } = require('@playwright/test');

const { resetPortalWebState } = require('./helpers/portal_web');
const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const {
  createPlatformTrainerJob,
  getPlatformCounts,
  getPlatformTrainerJob,
} = require('./helpers/unified_platform');

const ALLOWED_JOB_STATUSES = new Set(['queued', 'running', 'blocked', 'failed', 'succeeded', 'canceled']);

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M19.13: trainer jobs validate kind, persist durably, and replay idempotently', async ({ request }) => {
  const seededHouse = await seedRecoverableTokenHouse(request);

  const invalidKind = await createPlatformTrainerJob(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'trainer-job-invalid-kind-001',
    payload: {
      teamId: 'team_main',
      jobKind: 'trainer.compare',
      targets: {
        configVersionIds: ['cfg_a', 'cfg_b'],
      },
      budget: {
        maxUsd: 5,
      },
    },
  });
  expect(invalidKind.status).toBe(400);
  expect(String(invalidKind.json?.error?.code || '')).toBe('TRAINER_JOB_KIND_INVALID');

  const beforeCounts = await getPlatformCounts(request);
  const created = await createPlatformTrainerJob(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'trainer-job-compare-001',
    payload: {
      teamId: 'team_main',
      jobKind: 'trainer_job.compare',
      targets: {
        configVersionIds: ['cfg_compare_a', 'cfg_compare_b'],
      },
      budget: {
        maxUsd: 5,
      },
    },
  });
  expect(created.status).toBe(201);
  expect(created.json?.ok).toBe(true);
  expect(String(created.json?.data?.trainerJobId || '')).toMatch(/^trainer_/);
  expect(ALLOWED_JOB_STATUSES.has(String(created.json?.data?.status || ''))).toBe(true);

  const replay = await createPlatformTrainerJob(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'trainer-job-compare-001',
    payload: {
      teamId: 'team_main',
      jobKind: 'trainer_job.compare',
      targets: {
        configVersionIds: ['cfg_compare_a', 'cfg_compare_b'],
      },
      budget: {
        maxUsd: 5,
      },
    },
  });
  expect(replay.status).toBe(200);
  expect(String(replay.json?.data?.trainerJobId || '')).toBe(String(created.json?.data?.trainerJobId || ''));

  const afterCounts = await getPlatformCounts(request);
  expect(Number(afterCounts.counts?.trainer_jobs || 0) - Number(beforeCounts.counts?.trainer_jobs || 0)).toBe(1);

  const job = await getPlatformTrainerJob(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    trainerJobId: String(created.json?.data?.trainerJobId || ''),
  });
  expect(job.status).toBe(200);
  expect(String(job.json?.data?.jobKind || '')).toBe('trainer_job.compare');
  expect(ALLOWED_JOB_STATUSES.has(String(job.json?.data?.status || ''))).toBe(true);
});
