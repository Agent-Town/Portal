const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const {
  installHouseWorker,
  listHouseWorkerSessions,
  spawnHouseWorker,
  updateHouseWorkerDeploymentLifecycle,
  getHouseWorkerDeployments,
} = require('./helpers/house_workers');
const { resetPortalWebState } = require('./helpers/portal_web');
const { attachHouseToPageSession, getPlatformFixture } = require('./helpers/unified_platform');
const { waitForLiteApi } = require('./helpers/trainer');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M38.3: helper deployments support pause, archive, remove, and release reinstall with honest spawn guards', async ({ page, request }) => {
  const registryFixture = await getPlatformFixture(request, 'worker_package_registry_seed');
  expect(registryFixture?.ok).toBe(true);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const seededHouse = await seedRecoverableTokenHouse(request);
  const attached = await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const install = await installHouseWorker(page.request, {
    registryEntityId: registryFixture.fixture.registryEntityId,
  });
  expect(install.status).toBe(200);
  const deploymentId = String(install.json?.data?.deployment?.deploymentId || '').trim();
  expect(deploymentId).toBeTruthy();

  const reinstall = await updateHouseWorkerDeploymentLifecycle(page.request, deploymentId, 'reinstall');
  expect(reinstall.status).toBe(200);
  expect(reinstall.json?.data?.deployment).toMatchObject({
    deploymentId,
    updateState: 'current',
  });
  expect(String(reinstall.json?.data?.deployment?.updateStateLabel || '')).toContain('current');

  const spawned = await spawnHouseWorker(page.request, {
    deploymentId,
    task: 'Confirm lifecycle coverage in one short sentence.',
    reason: 'lifecycle_contract',
  });
  expect([200, 201]).toContain(spawned.status);

  const paused = await updateHouseWorkerDeploymentLifecycle(page.request, deploymentId, 'pause');
  expect(paused.status).toBe(200);
  expect(paused.json?.data?.deployment).toMatchObject({
    deploymentId,
    lifecycleState: 'paused',
  });
  expect(paused.json?.data?.residualActiveSessionCount).toBe(0);

  const pausedSpawn = await spawnHouseWorker(page.request, {
    deploymentId,
    task: 'This should stay blocked.',
    reason: 'lifecycle_contract',
  });
  expect(pausedSpawn.status).toBe(409);
  expect(pausedSpawn.json?.error?.code).toBe('DEPLOYMENT_PAUSED');

  const resumed = await updateHouseWorkerDeploymentLifecycle(page.request, deploymentId, 'resume');
  expect(resumed.status).toBe(200);
  expect(resumed.json?.data?.deployment).toMatchObject({
    deploymentId,
    lifecycleState: 'active',
  });

  const resumedSpawn = await spawnHouseWorker(page.request, {
    deploymentId,
    task: 'Restart after resume.',
    reason: 'lifecycle_contract',
  });
  expect([200, 201]).toContain(resumedSpawn.status);

  const archived = await updateHouseWorkerDeploymentLifecycle(page.request, deploymentId, 'archive');
  expect(archived.status).toBe(200);
  expect(archived.json?.data?.deployment).toMatchObject({
    deploymentId,
    lifecycleState: 'archived',
  });
  expect(archived.json?.data?.residualActiveSessionCount).toBe(0);

  const archivedSpawn = await spawnHouseWorker(page.request, {
    deploymentId,
    task: 'This should stay archived.',
    reason: 'lifecycle_contract',
  });
  expect(archivedSpawn.status).toBe(409);
  expect(archivedSpawn.json?.error?.code).toBe('DEPLOYMENT_ARCHIVED');

  const removed = await updateHouseWorkerDeploymentLifecycle(page.request, deploymentId, 'remove');
  expect(removed.status).toBe(200);
  expect(removed.json?.data?.removed).toBe(true);
  expect(removed.json?.data?.residualActiveSessionCount).toBe(0);

  const deployments = await getHouseWorkerDeployments(page.request);
  const remaining = (deployments.json?.data?.deployments || [])
    .find((entry) => String(entry?.deploymentId || '').trim() === deploymentId);
  expect(remaining || null).toBeNull();

  const sessions = await listHouseWorkerSessions(page.request);
  const activeSessions = (sessions.json?.data?.sessions || [])
    .filter((entry) => String(entry?.deploymentId || '').trim() === deploymentId)
    .filter((entry) => ['starting', 'ready', 'idle', 'working', 'waiting', 'blocked'].includes(String(entry?.status || '').trim()));
  expect(activeSessions).toHaveLength(0);
});
