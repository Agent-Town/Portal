const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const {
  installHouseWorker,
  listHouseWorkerRuntimeInstances,
  listHouseWorkerSessions,
  readHouseWorkerExecutorSnapshot,
  readHouseWorkerSupervisorSnapshot,
} = require('./helpers/house_workers');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi, setDeterministicLlm } = require('./helpers/trainer');
const { attachHouseToPageSession, exportPlatformSnapshot, getPlatformFixture } = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('T42.4: one helper can move from this browser into the backend pool without losing control-plane continuity', async ({ page, request }) => {
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

  let browserSession = null;
  await expect.poll(async () => {
    const sessionsPayload = await listHouseWorkerSessions(page.request, { teamId: 'team_main' });
    browserSession = sessionsPayload?.json?.data?.sessions?.[0] || null;
    return {
      sessionCount: Array.isArray(sessionsPayload?.json?.data?.sessions) ? sessionsPayload.json.data.sessions.length : 0,
      latestReply: String(browserSession?.latestReply || '').trim(),
      executorKind: String(browserSession?.executorKind || '').trim(),
    };
  }, {
    message: 'expected browser helper startup exchange to settle before cloud handoff',
  }).toEqual({
    sessionCount: 1,
    latestReply: expect.any(String),
    executorKind: 'browser_tab',
  });

  const initialRuntimeInstances = await listHouseWorkerRuntimeInstances(page.request, { teamId: 'team_main' });
  const initialRuntimeInstance = initialRuntimeInstances?.json?.data?.runtimeInstances?.[0] || null;
  expect(initialRuntimeInstances.status).toBe(200);
  expect(initialRuntimeInstance).toBeTruthy();
  expect(String(initialRuntimeInstance?.executorKind || '').trim()).toBe('browser_tab');

  await expect(deploymentCard.getByTestId('house-office-helper-offload')).toBeEnabled();
  await deploymentCard.getByTestId('house-office-helper-offload').click();

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
      executorProvider: String(runtimeInstance?.executorProvider || '').trim(),
      leaseOwnerKind: String(runtimeInstance?.leaseOwnerKind || '').trim(),
      workspaceSnapshotRef: String(runtimeInstance?.workspaceSnapshotRef || '').trim(),
      leaseStatus: String(runtimeInstance?.leaseStatus || '').trim(),
    };
  }).toEqual({
    status: 200,
    count: 1,
    runtimeInstanceId: String(initialRuntimeInstance?.runtimeInstanceId || '').trim(),
    executorKind: 'backend_pool',
    executorProvider: 'portal_backend_pool',
    leaseOwnerKind: 'backend_process',
    workspaceSnapshotRef: expect.any(String),
    leaseStatus: 'active',
  });

  const sessionsPayload = await listHouseWorkerSessions(page.request, { teamId: 'team_main' });
  const offloadedSession = sessionsPayload?.json?.data?.sessions?.[0] || null;
  expect(sessionsPayload.status).toBe(200);
  expect(offloadedSession).toBeTruthy();
  expect(offloadedSession).toMatchObject({
    houseWorkerSessionId: String(browserSession?.houseWorkerSessionId || '').trim(),
    runtimeInstanceId: String(initialRuntimeInstance?.runtimeInstanceId || '').trim(),
    executorKind: 'backend_pool',
    executorProvider: 'portal_backend_pool',
  });
  expect(String(offloadedSession?.leaseStatus || '').trim()).toBe('active');
  expect(String(offloadedSession?.latestReply || '').trim()).toBeTruthy();

  const supervisorSnapshot = await readHouseWorkerSupervisorSnapshot(page);
  const executorSnapshot = await readHouseWorkerExecutorSnapshot(page);
  const helperSupervisorView = Array.isArray(supervisorSnapshot?.helpers)
    ? supervisorSnapshot.helpers.find((entry) => String(entry?.houseWorkerSessionId || '').trim() === String(offloadedSession?.houseWorkerSessionId || '').trim())
    : null;
  const helperExecutorView = Array.isArray(executorSnapshot?.helpers)
    ? executorSnapshot.helpers.find((entry) => String(entry?.houseWorkerSessionId || '').trim() === String(offloadedSession?.houseWorkerSessionId || '').trim())
    : null;

  expect(Number(supervisorSnapshot?.activeWorkerCount || 0)).toBe(1);
  expect(helperSupervisorView).toMatchObject({
    houseWorkerSessionId: String(offloadedSession?.houseWorkerSessionId || '').trim(),
    attached: false,
    executorKind: 'backend_pool',
    statusLabel: 'Running in cloud',
  });
  expect(helperExecutorView).toMatchObject({
    houseWorkerSessionId: String(offloadedSession?.houseWorkerSessionId || '').trim(),
    runtimeInstanceId: String(initialRuntimeInstance?.runtimeInstanceId || '').trim(),
    attached: false,
    executorKind: 'backend_pool',
    leaseStatus: 'active',
  });

  await expect(deploymentCard.getByTestId('house-office-helper-status')).toContainText('keeps running in the backend pool');
  await expect(deploymentCard.getByTestId('house-office-helper-start')).toHaveText('Running in cloud');
  await expect(deploymentCard.getByTestId('house-office-helper-start')).toBeDisabled();
  await expect(deploymentCard.getByTestId('house-office-helper-stop')).toHaveText('Stop Cloud Helper');
  await expect(deploymentCard.getByTestId('house-office-helper-ask')).toBeDisabled();

  const exported = await exportPlatformSnapshot(request);
  const runtimeRows = Array.isArray(exported?.json?.snapshot?.tables?.house_worker_runtime_instances)
    ? exported.json.snapshot.tables.house_worker_runtime_instances
    : [];
  const sessionRows = Array.isArray(exported?.json?.snapshot?.tables?.house_worker_sessions)
    ? exported.json.snapshot.tables.house_worker_sessions
    : [];
  const runtimeRow = runtimeRows[0] || null;
  const sessionRow = sessionRows[0] || null;
  const sessionRuntime = sessionRow?.session_runtime_json
    ? JSON.parse(String(sessionRow.session_runtime_json))
    : {};

  expect(exported.status).toBe(200);
  expect(runtimeRows).toHaveLength(1);
  expect(sessionRows).toHaveLength(1);
  expect(String(runtimeRow?.runtime_instance_id || '').trim()).toBe(String(initialRuntimeInstance?.runtimeInstanceId || '').trim());
  expect(String(runtimeRow?.executor_kind || '').trim()).toBe('backend_pool');
  expect(String(runtimeRow?.workspace_snapshot_ref || '').trim()).toBeTruthy();
  expect(String(sessionRow?.house_worker_session_id || '').trim()).toBe(String(offloadedSession?.houseWorkerSessionId || '').trim());
  expect(String(sessionRuntime?.supervisorSource || '').trim()).toBe('backend_pool');
  expect(String(sessionRuntime?.workspaceSnapshotRef || '').trim()).toBeTruthy();
});
