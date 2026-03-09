const { test, expect } = require('@playwright/test');

const { resetPortalWebState } = require('./helpers/portal_web');
const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const {
  executePlatformIntegration,
  getPlatformCounts,
  resolvePlatformIntegration,
} = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M19.12: integration executions enforce explicit action ids, approval gates, and idempotency', async ({ request }) => {
  const seededHouse = await seedRecoverableTokenHouse(request);
  const resolved = await resolvePlatformIntegration(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    targetUrl: 'https://github.com/openai/openai-codex/issues/1',
    idempotencyKey: 'integration-execution-resolve-001',
  });
  expect(resolved.status).toBe(201);
  const integrationId = String(resolved.json?.data?.integrationCandidateId || '');
  expect(integrationId).toMatch(/^intcand_/);

  const missingAction = await executePlatformIntegration(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    integrationId,
    idempotencyKey: 'integration-execution-missing-action-001',
    payload: {
      requestedBy: {
        actorType: 'worker',
        actorId: 'worker_main',
      },
      request: {
        params: {},
      },
    },
  });
  expect(missingAction.status).toBe(400);
  expect(['EXECUTION_NOT_ALLOWED', 'INVALID_ARGUMENT']).toContain(String(missingAction.json?.error?.code || ''));

  const beforeCounts = await getPlatformCounts(request);
  const readExecution = await executePlatformIntegration(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    integrationId,
    idempotencyKey: 'integration-execution-read-001',
    payload: {
      actionId: 'github.issue.read',
      requestedBy: {
        actorType: 'worker',
        actorId: 'worker_main',
      },
      request: {
        params: {
          issueNumber: 1,
        },
      },
    },
  });
  expect(readExecution.status).toBe(201);
  expect(readExecution.json?.ok).toBe(true);
  expect(String(readExecution.json?.data?.actionId || '')).toBe('github.issue.read');
  expect(String(readExecution.json?.data?.requestedBy?.actorType || '')).toBe('worker');

  const replayRead = await executePlatformIntegration(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    integrationId,
    idempotencyKey: 'integration-execution-read-001',
    payload: {
      actionId: 'github.issue.read',
      requestedBy: {
        actorType: 'worker',
        actorId: 'worker_main',
      },
      request: {
        params: {
          issueNumber: 1,
        },
      },
    },
  });
  expect(replayRead.status).toBe(200);
  expect(String(replayRead.json?.data?.executionId || '')).toBe(String(readExecution.json?.data?.executionId || ''));

  const afterReadCounts = await getPlatformCounts(request);
  expect(Number(afterReadCounts.counts?.integration_executions || 0) - Number(beforeCounts.counts?.integration_executions || 0)).toBe(1);

  const blockedWrite = await executePlatformIntegration(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    integrationId,
    idempotencyKey: 'integration-execution-write-blocked-001',
    payload: {
      actionId: 'github.issue.reply',
      requestedBy: {
        actorType: 'worker',
        actorId: 'worker_main',
      },
      request: {
        params: {
          body: 'hello world',
        },
      },
    },
  });
  expect(blockedWrite.status).toBe(409);
  expect(String(blockedWrite.json?.error?.code || '')).toBe('APPROVAL_REQUIRED');

  const approvedWrite = await executePlatformIntegration(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    integrationId,
    idempotencyKey: 'integration-execution-write-approved-001',
    payload: {
      actionId: 'github.issue.reply',
      requestedBy: {
        actorType: 'worker',
        actorId: 'worker_main',
      },
      request: {
        params: {
          body: 'hello world',
        },
        approvalId: 'appr_fixture_approved_01',
      },
    },
  });
  expect(approvedWrite.status).toBe(201);
  expect(String(approvedWrite.json?.data?.actionId || '')).toBe('github.issue.reply');
  expect(String(approvedWrite.json?.data?.requestedBy?.actorType || '')).toBe('worker');

  const afterWriteCounts = await getPlatformCounts(request);
  expect(Number(afterWriteCounts.counts?.integration_executions || 0) - Number(afterReadCounts.counts?.integration_executions || 0)).toBe(1);
});
