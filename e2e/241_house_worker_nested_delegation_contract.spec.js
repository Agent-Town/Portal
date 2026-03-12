const { test, expect } = require('@playwright/test');

const { invokeLiteTool } = require('./helpers/experience_intents');
const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { installHouseWorker } = require('./helpers/house_workers');
const { resetPortalWebState } = require('./helpers/portal_web');
const { attachHouseToPageSession, getPlatformFixture } = require('./helpers/unified_platform');
const { waitForLiteApi, setDeterministicLlm } = require('./helpers/trainer');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('T38.5: helpers can delegate one controlled extra generation while depth and budget guardrails fail closed', async ({ page, request }) => {
  const installFixture = await getPlatformFixture(request, 'worker_package_install_seed');
  const smokeFixture = await getPlatformFixture(request, 'worker_runtime_reality_smoke_seed');
  const delegationFixture = await getPlatformFixture(request, 'worker_nested_delegation_seed');
  expect(installFixture?.ok).toBe(true);
  expect(smokeFixture?.ok).toBe(true);
  expect(delegationFixture?.ok).toBe(true);

  const seededHouse = await seedRecoverableTokenHouse(request);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  await setDeterministicLlm(page);
  await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });

  const officeIds = [
    ...(Array.isArray(smokeFixture.fixture?.officeIds) ? smokeFixture.fixture.officeIds : []),
    'office_fixture_ops',
  ].filter(Boolean);
  expect(officeIds.length).toBeGreaterThanOrEqual(4);

  const deployments = [];
  for (const officeId of officeIds.slice(0, 4)) {
    const installResult = await installHouseWorker(page.request, {
      registryEntityId: installFixture.fixture.registryEntityId,
      officeId,
    });
    expect(installResult.status).toBe(200);
    const deploymentId = String(installResult.json?.data?.deployment?.deploymentId || '').trim();
    expect(deploymentId).toBeTruthy();
    deployments.push(deploymentId);
  }

  const rootSpawn = await invokeLiteTool(page, 'agent_town_worker_spawn', {
    deploymentId: deployments[0],
    task: 'Summarize the current House plan in one short sentence.',
    reason: String(delegationFixture.fixture?.rootReason || 'house_summary').trim(),
  });
  expect(rootSpawn?.ok).toBe(true);
  const rootSessionId = String(rootSpawn?.data?.houseWorkerSessionId || rootSpawn?.data?.workerSessionId || '').trim();
  expect(rootSessionId).toBeTruthy();

  const childSpawn = await page.evaluate(async ({ parentWorkerSessionId, deploymentId, reason }) => {
    return await window.dispatchHouseWorkerRuntimeAction('agent_town_worker_spawn', {
      deploymentId,
      task: 'Handle a supporting subtask in one short sentence.',
      reason,
    }, {
      source: 'test-child-runtime',
      houseWorkerSessionId: parentWorkerSessionId,
    });
  }, {
    parentWorkerSessionId: rootSessionId,
    deploymentId: deployments[1],
    reason: String(delegationFixture.fixture?.childReason || 'subtask_breakdown').trim(),
  });
  expect(childSpawn?.ok).toBe(true);
  const childSessionId = String(childSpawn?.data?.houseWorkerSessionId || childSpawn?.data?.workerSessionId || '').trim();
  expect(childSessionId).toBeTruthy();

  expect(childSpawn?.data?.session).toMatchObject({
    parentSessionId: rootSessionId,
    rootWorkerSessionId: rootSessionId,
    delegationDepth: 2,
    delegationReason: String(delegationFixture.fixture?.childReason || 'subtask_breakdown').trim(),
  });

  const runawaySpawn = await page.evaluate(async ({ parentWorkerSessionId, deploymentId }) => {
    return await window.dispatchHouseWorkerRuntimeAction('agent_town_worker_spawn', {
      deploymentId,
      task: 'This depth should be blocked.',
      reason: 'runaway_probe',
    }, {
      source: 'test-child-runtime',
      houseWorkerSessionId: parentWorkerSessionId,
    });
  }, {
    parentWorkerSessionId: childSessionId,
    deploymentId: deployments[2],
  });
  expect(runawaySpawn?.ok).toBe(false);
  expect(runawaySpawn?.error?.code).toBe('RUNAWAY_SPAWN_BLOCKED');

  const siblingSpawn = await page.evaluate(async ({ parentWorkerSessionId, deploymentId, reason }) => {
    return await window.dispatchHouseWorkerRuntimeAction('agent_town_worker_spawn', {
      deploymentId,
      task: 'Handle one more delegated follow-up.',
      reason,
    }, {
      source: 'test-child-runtime',
      houseWorkerSessionId: parentWorkerSessionId,
    });
  }, {
    parentWorkerSessionId: rootSessionId,
    deploymentId: deployments[2],
    reason: String(delegationFixture.fixture?.budgetReason || 'parallel_followup').trim(),
  });
  expect(siblingSpawn?.ok).toBe(true);

  const overBudgetSpawn = await page.evaluate(async ({ parentWorkerSessionId, deploymentId }) => {
    return await window.dispatchHouseWorkerRuntimeAction('agent_town_worker_spawn', {
      deploymentId,
      task: 'This helper should exceed the safe delegation budget.',
      reason: 'budget_probe',
    }, {
      source: 'test-child-runtime',
      houseWorkerSessionId: parentWorkerSessionId,
    });
  }, {
    parentWorkerSessionId: rootSessionId,
    deploymentId: deployments[3],
  });
  expect(overBudgetSpawn?.ok).toBe(false);
  expect(overBudgetSpawn?.error?.code).toBe('DELEGATION_BUDGET_EXCEEDED');
});
