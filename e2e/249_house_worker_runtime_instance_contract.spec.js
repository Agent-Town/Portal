const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { installHouseWorker, listHouseWorkerRuntimeInstances, listHouseWorkerSessions } = require('./helpers/house_workers');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi, setDeterministicLlm } = require('./helpers/trainer');
const { attachHouseToPageSession, exportPlatformSnapshot, getPlatformFixture, getPlatformStats } = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('T42.0: helper sessions expose first-class runtime instances under one control-plane authority', async ({ page, request }) => {
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
  await page.getByTestId('house-office-helper-start').first().click();

  await expect.poll(async () => {
    const runtimeInstancesPayload = await listHouseWorkerRuntimeInstances(page.request, { teamId: 'team_main' });
    const runtimeInstances = Array.isArray(runtimeInstancesPayload?.json?.data?.runtimeInstances)
      ? runtimeInstancesPayload.json.data.runtimeInstances
      : [];
    const runtimeInstance = runtimeInstances[0] || null;
    return {
      status: runtimeInstancesPayload?.status || 0,
      count: runtimeInstances.length,
      runtimeInstanceId: String(runtimeInstance?.runtimeInstanceId || '').trim(),
      executorKind: String(runtimeInstance?.executorKind || '').trim(),
      hasRequestedProfile: !!runtimeInstance?.requestedRuntimeProfile,
      hasRuntimeBinding: !!runtimeInstance?.runtimeBinding,
    };
  }).toEqual({
    status: 200,
    count: 1,
    runtimeInstanceId: expect.any(String),
    executorKind: 'browser_tab',
    hasRequestedProfile: true,
    hasRuntimeBinding: true,
  });

  const runtimeInstancesPayload = await listHouseWorkerRuntimeInstances(page.request, { teamId: 'team_main' });
  const sessionsPayload = await listHouseWorkerSessions(page.request, { teamId: 'team_main' });
  const runtimeInstance = runtimeInstancesPayload?.json?.data?.runtimeInstances?.[0] || null;
  const session = sessionsPayload?.json?.data?.sessions?.[0] || null;

  expect(runtimeInstancesPayload.status).toBe(200);
  expect(sessionsPayload.status).toBe(200);
  expect(runtimeInstance).toBeTruthy();
  expect(session).toBeTruthy();

  expect(String(session?.runtimeInstanceId || '').trim()).toBe(String(runtimeInstance?.runtimeInstanceId || '').trim());
  expect(String(session?.executorKind || '').trim()).toBe('browser_tab');
  expect(session?.runtimeInstance).toMatchObject({
    runtimeInstanceId: String(runtimeInstance?.runtimeInstanceId || '').trim(),
    executorKind: 'browser_tab',
    houseWorkerSessionId: String(runtimeInstance?.houseWorkerSessionId || '').trim(),
  });
  expect(runtimeInstance?.requestedRuntimeProfile).toMatchObject(session?.requestedRuntimeProfile || {});
  expect(runtimeInstance?.appliedRuntimeProfile).toMatchObject(session?.appliedRuntimeProfile || {});
  expect(runtimeInstance?.runtimeBinding).toMatchObject(session?.runtimeBinding || {});
  expect(String(runtimeInstance?.leaseOwnerKind || '').trim()).toBe('browser_tab');
  expect(String(runtimeInstance?.leaseStatus || '').trim()).toBeTruthy();
  expect(String(runtimeInstance?.startedAt || '').trim()).toBeTruthy();

  const exported = await exportPlatformSnapshot(request);
  const runtimeRows = Array.isArray(exported?.json?.snapshot?.tables?.house_worker_runtime_instances)
    ? exported.json.snapshot.tables.house_worker_runtime_instances
    : [];
  expect(exported.status).toBe(200);
  expect(runtimeRows).toHaveLength(1);
  expect(String(runtimeRows[0]?.house_worker_session_id || '').trim()).toBe(String(session?.houseWorkerSessionId || '').trim());
  expect(String(runtimeRows[0]?.executor_kind || '').trim()).toBe('browser_tab');

  const stats = await getPlatformStats(request);
  expect(stats?.stats?.inspectors?.houseWorkerRuntimeInstances).toBe(true);
  expect(Number(stats?.stats?.counts?.house_worker_runtime_instances || 0)).toBe(1);
});
