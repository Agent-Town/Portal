const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const {
  installHouseWorker,
  listHouseWorkerRuntimeInstances,
  readHouseWorkerExecutorSnapshot,
  readHouseWorkerSupervisorSnapshot,
} = require('./helpers/house_workers');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi, setDeterministicLlm } = require('./helpers/trainer');
const { attachHouseToPageSession, getPlatformFixture, readWorkerSessionId } = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('T42.1: browser helpers run through the browser executor adapter without changing user-visible behavior', async ({ page, request }) => {
  const runtimeFixture = await getPlatformFixture(request, 'worker_runtime_supervisor_seed');
  const installFixture = await getPlatformFixture(request, 'worker_package_install_seed');
  expect(runtimeFixture?.ok).toBe(true);
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

  const primaryWorkerId = await readWorkerSessionId(page);
  expect(primaryWorkerId).toBeTruthy();

  await page.getByTestId('house-open-office').click();
  await page.getByTestId('house-office-helper-start').first().click();

  await expect.poll(async () => {
    const snapshot = await readHouseWorkerSupervisorSnapshot(page);
    return Number(snapshot?.activeWorkerCount || 0);
  }).toBeGreaterThanOrEqual(Number(runtimeFixture.fixture.minimumActiveWorkerCount || 2));

  const executorSnapshot = await readHouseWorkerExecutorSnapshot(page);
  expect(Array.isArray(executorSnapshot?.adapters)).toBe(true);
  expect(executorSnapshot.adapters).toEqual(expect.arrayContaining([
    expect.objectContaining({
      executorKind: 'browser_tab',
      executorProvider: 'portal_browser',
      parityMode: 'exact',
      runtimeAuthority: 'house_worker_runtime_instances',
    }),
  ]));

  const supervisorSnapshot = await readHouseWorkerSupervisorSnapshot(page);
  const helper = supervisorSnapshot?.helpers?.[0] || null;
  expect(helper).toBeTruthy();
  expect(helper).toMatchObject({
    executorKind: 'browser_tab',
    executorProvider: 'portal_browser',
    runtimeInstanceId: expect.any(String),
    attached: true,
  });

  const activeHelper = Array.isArray(executorSnapshot?.helpers)
    ? executorSnapshot.helpers.find((entry) => String(entry?.houseWorkerSessionId || '').trim() === String(helper?.houseWorkerSessionId || '').trim())
    : null;
  expect(activeHelper).toMatchObject({
    runtimeInstanceId: String(helper?.runtimeInstanceId || '').trim(),
    executorKind: 'browser_tab',
    executorProvider: 'portal_browser',
    attached: true,
  });

  const runtimeInstancesPayload = await listHouseWorkerRuntimeInstances(page.request, { teamId: 'team_main' });
  const runtimeInstance = runtimeInstancesPayload?.json?.data?.runtimeInstances?.[0] || null;
  expect(runtimeInstancesPayload.status).toBe(200);
  expect(runtimeInstance).toMatchObject({
    runtimeInstanceId: String(helper?.runtimeInstanceId || '').trim(),
    executorKind: 'browser_tab',
    executorProvider: 'portal_browser',
    leaseOwnerKind: 'browser_tab',
  });
  expect(String(runtimeInstance?.leaseStatus || '').trim()).toBeTruthy();
  expect(runtimeInstance?.requestedRuntimeProfile).toBeTruthy();
  expect(runtimeInstance?.runtimeBinding).toBeTruthy();

  await expect(page.getByTestId('house-office-worker-session-item')).toHaveCount(1);
  await expect(page.getByTestId('house-office-worker-session-item').first()).toContainText('Ready');

  const primaryAfterSpawn = await readWorkerSessionId(page);
  expect(primaryAfterSpawn).toBe(primaryWorkerId);
  expect(await page.evaluate(() => window.location.pathname)).toBe('/app');
});
