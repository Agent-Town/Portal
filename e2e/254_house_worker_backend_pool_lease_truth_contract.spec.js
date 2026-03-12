const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const {
  crashHouseWorkerRuntime,
  installHouseWorker,
  listHouseWorkerRuntimeInstances,
  listHouseWorkerSessions,
  readHouseWorkerSupervisorSnapshot,
} = require('./helpers/house_workers');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi, setDeterministicLlm } = require('./helpers/trainer');
const { attachHouseToPageSession, getPlatformFixture } = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('T42.5: backend-pool lease truth fails closed when the offloaded helper stops heartbeating', async ({ page, request }) => {
  const installFixture = await getPlatformFixture(request, 'worker_package_install_seed');
  expect(installFixture?.ok).toBe(true);

  const seededHouse = await seedRecoverableTokenHouse(request);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  await setDeterministicLlm(page);
  await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });

  const installResult = await installHouseWorker(page.request, {
    registryEntityId: installFixture.fixture.registryEntityId,
  });
  expect(installResult.status).toBe(200);

  await page.getByTestId('house-open-office').click();
  const deploymentCard = page.getByTestId('house-office-deployment-item').first();
  await deploymentCard.getByTestId('house-office-helper-start').click();

  await expect.poll(async () => {
    const sessionsPayload = await listHouseWorkerSessions(page.request, { teamId: 'team_main' });
    const session = sessionsPayload?.json?.data?.sessions?.[0] || null;
    return Boolean(String(session?.latestReply || '').trim());
  }, {
    message: 'expected browser helper startup exchange to settle before backend offload',
  }).toBe(true);

  await deploymentCard.getByTestId('house-office-helper-offload').click();

  let runtimeInstance = null;
  await expect.poll(async () => {
    const runtimeInstancesPayload = await listHouseWorkerRuntimeInstances(page.request, { teamId: 'team_main' });
    runtimeInstance = runtimeInstancesPayload?.json?.data?.runtimeInstances?.[0] || null;
    return {
      status: runtimeInstancesPayload?.status || 0,
      executorKind: String(runtimeInstance?.executorKind || '').trim(),
      leaseStatus: String(runtimeInstance?.leaseStatus || '').trim(),
    };
  }).toEqual({
    status: 200,
    executorKind: 'backend_pool',
    leaseStatus: 'active',
  });

  expect(runtimeInstance).toBeTruthy();
  const crashResult = await crashHouseWorkerRuntime(page.request, String(runtimeInstance?.runtimeInstanceId || '').trim());
  expect(crashResult.status).toBe(200);
  expect(crashResult?.json?.ok).toBe(true);

  await expect.poll(async () => {
    const runtimeInstancesPayload = await listHouseWorkerRuntimeInstances(page.request, { teamId: 'team_main' });
    const sessionsPayload = await listHouseWorkerSessions(page.request, { teamId: 'team_main' });
    const nextRuntimeInstance = runtimeInstancesPayload?.json?.data?.runtimeInstances?.[0] || null;
    const nextSession = sessionsPayload?.json?.data?.sessions?.[0] || null;
    return {
      runtimeStatus: String(nextRuntimeInstance?.leaseStatus || '').trim(),
      runtimeExecutorKind: String(nextRuntimeInstance?.executorKind || '').trim(),
      runtimeOwnerKind: String(nextRuntimeInstance?.leaseOwnerKind || '').trim(),
      runtimeLastHeartbeatAt: String(nextRuntimeInstance?.lastHeartbeatAt || '').trim(),
      runtimeLeaseExpiresAt: String(nextRuntimeInstance?.leaseExpiresAt || '').trim(),
      sessionStatus: String(nextSession?.status || '').trim(),
      sessionLeaseStatus: String(nextSession?.leaseStatus || '').trim(),
      sessionExecutorKind: String(nextSession?.executorKind || '').trim(),
    };
  }, {
    timeout: 10000,
    intervals: [250, 500, 1000],
    message: 'expected backend-pool lease truth to degrade to stale after crash',
  }).toEqual({
    runtimeStatus: 'stale',
    runtimeExecutorKind: 'backend_pool',
    runtimeOwnerKind: 'backend_process',
    runtimeLastHeartbeatAt: expect.any(String),
    runtimeLeaseExpiresAt: expect.any(String),
    sessionStatus: 'stale',
    sessionLeaseStatus: 'stale',
    sessionExecutorKind: 'backend_pool',
  });

  await expect(deploymentCard.getByTestId('house-office-helper-status')).toContainText('stopped reporting');
  await expect(deploymentCard.getByTestId('house-office-helper-start')).toHaveText('Restart Here');
  await expect(deploymentCard.getByTestId('house-office-helper-stop')).toHaveText('Clear Session');
  await expect(deploymentCard.getByTestId('house-office-helper-status')).not.toContainText('keeps running in the backend pool');

  const supervisorSnapshot = await readHouseWorkerSupervisorSnapshot(page);
  const helperView = Array.isArray(supervisorSnapshot?.helpers)
    ? supervisorSnapshot.helpers[0] || null
    : null;
  expect(helperView).toMatchObject({
    executorKind: 'backend_pool',
    attached: false,
    statusLabel: 'Needs restart here',
    leaseStatus: 'stale',
  });
});
