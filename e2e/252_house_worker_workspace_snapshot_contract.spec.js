const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const {
  getHouseWorkerWorkspaceSnapshot,
  installHouseWorker,
  listHouseWorkerRuntimeInstances,
  listHouseWorkerSessions,
  listHouseWorkerWorkspaceSnapshots,
} = require('./helpers/house_workers');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi, setDeterministicLlm } = require('./helpers/trainer');
const { attachHouseToPageSession, getPlatformFixture } = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('T42.3: browser helpers capture redacted workspace snapshots and restore them exactly', async ({ page, request }) => {
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
  const deploymentId = String(installResult.json?.data?.deployment?.deploymentId || '').trim();
  expect(deploymentId).toBeTruthy();

  await page.getByTestId('house-open-office').click();
  await page.getByTestId('house-office-helper-start').first().click();

  let activeSession = null;
  await expect.poll(async () => {
    const sessionsPayload = await listHouseWorkerSessions(page.request, { teamId: 'team_main' });
    activeSession = sessionsPayload?.json?.data?.sessions?.[0] || null;
    return Boolean(activeSession && String(activeSession?.latestReply || '').trim());
  }, {
    message: 'expected helper startup exchange to settle before snapshot capture',
  }).toBe(true);

  const runtimeInstancesPayload = await listHouseWorkerRuntimeInstances(page.request, { teamId: 'team_main' });
  const runtimeInstance = runtimeInstancesPayload?.json?.data?.runtimeInstances?.[0] || null;
  expect(runtimeInstance).toBeTruthy();

  const filePath = `workspace/house-workers/${deploymentId}/snapshot-proof.txt`;
  const beforeText = 'snapshot before mutation';
  const afterText = 'snapshot after mutation';

  const writeBefore = await page.evaluate(async ({ houseWorkerSessionId, path, content }) => {
    return await window.__agentTownHouseWorkerSupervisor.writeWorkspaceFile({
      houseWorkerSessionId,
      path,
      content,
    });
  }, {
    houseWorkerSessionId: String(activeSession?.houseWorkerSessionId || '').trim(),
    path: filePath,
    content: beforeText,
  });
  expect(String(writeBefore?.path || '').trim()).toBe(filePath);

  const captureResult = await page.evaluate(async ({ houseWorkerSessionId }) => {
    return await window.__agentTownHouseWorkerSupervisor.captureSnapshot({
      houseWorkerSessionId,
    });
  }, {
    houseWorkerSessionId: String(activeSession?.houseWorkerSessionId || '').trim(),
  });
  const capturedSnapshot = captureResult?.snapshot || null;
  expect(capturedSnapshot).toBeTruthy();
  const workspaceSnapshotRef = String(capturedSnapshot?.workspaceSnapshotRef || '').trim();
  expect(workspaceSnapshotRef).toBeTruthy();
  expect(String(capturedSnapshot?.storageKind || '').trim()).toBe('platform_db');
  expect(String(capturedSnapshot?.createdByExecutorKind || '').trim()).toBe('browser_tab');
  expect(Number(capturedSnapshot?.workspaceManifest?.vfsFileCount || 0)).toBeGreaterThan(0);
  expect(Array.isArray(capturedSnapshot?.restorePolicy?.excludedMetaKeys)).toBe(true);
  expect(capturedSnapshot.restorePolicy.excludedMetaKeys).toContain('llmApiKey');

  const snapshotListPayload = await listHouseWorkerWorkspaceSnapshots(page.request, {
    teamId: 'team_main',
    runtimeInstanceId: String(runtimeInstance?.runtimeInstanceId || '').trim(),
  });
  expect(snapshotListPayload.status).toBe(200);
  const listedSnapshot = snapshotListPayload?.json?.data?.snapshots?.find((entry) => String(entry?.workspaceSnapshotRef || '').trim() === workspaceSnapshotRef) || null;
  expect(listedSnapshot).toBeTruthy();

  const snapshotDetailPayload = await getHouseWorkerWorkspaceSnapshot(page.request, workspaceSnapshotRef);
  expect(snapshotDetailPayload.status).toBe(200);
  const snapshotPayload = snapshotDetailPayload?.json?.data?.snapshot?.snapshotPayload || null;
  expect(snapshotPayload).toBeTruthy();
  const snapshotMetaKeys = Array.isArray(snapshotPayload?.stores?.meta)
    ? snapshotPayload.stores.meta.map((entry) => String(entry?.key || '').trim())
    : [];
  expect(snapshotMetaKeys).not.toContain('llmApiKey');
  expect(snapshotMetaKeys).not.toContain('secretStoreV1');

  const writeAfter = await page.evaluate(async ({ houseWorkerSessionId, path, content }) => {
    return await window.__agentTownHouseWorkerSupervisor.writeWorkspaceFile({
      houseWorkerSessionId,
      path,
      content,
    });
  }, {
    houseWorkerSessionId: String(activeSession?.houseWorkerSessionId || '').trim(),
    path: filePath,
    content: afterText,
  });
  expect(String(writeAfter?.path || '').trim()).toBe(filePath);

  const mutatedRead = await page.evaluate(async ({ houseWorkerSessionId, path }) => {
    return await window.__agentTownHouseWorkerSupervisor.readWorkspaceFile({
      houseWorkerSessionId,
      path,
    });
  }, {
    houseWorkerSessionId: String(activeSession?.houseWorkerSessionId || '').trim(),
    path: filePath,
  });
  expect(String(mutatedRead?.content || '').trim()).toBe(afterText);

  const restoreResult = await page.evaluate(async ({ houseWorkerSessionId, workspaceSnapshotRef }) => {
    return await window.__agentTownHouseWorkerSupervisor.restoreSnapshot({
      houseWorkerSessionId,
      workspaceSnapshotRef,
    });
  }, {
    houseWorkerSessionId: String(activeSession?.houseWorkerSessionId || '').trim(),
    workspaceSnapshotRef,
  });
  expect(String(restoreResult?.restoreState || '').trim()).toBe('applied');

  const restoredRead = await page.evaluate(async ({ houseWorkerSessionId, path }) => {
    return await window.__agentTownHouseWorkerSupervisor.readWorkspaceFile({
      houseWorkerSessionId,
      path,
    });
  }, {
    houseWorkerSessionId: String(activeSession?.houseWorkerSessionId || '').trim(),
    path: filePath,
  });
  expect(String(restoredRead?.content || '').trim()).toBe(beforeText);

  const postRestoreMessage = await page.evaluate(async ({ houseWorkerSessionId, message }) => {
    return await window.__agentTownHouseWorkerSupervisor.message({
      houseWorkerSessionId,
      message,
      actor: 'human',
    });
  }, {
    houseWorkerSessionId: String(activeSession?.houseWorkerSessionId || '').trim(),
    message: 'Confirm snapshot restore in one short sentence.',
  });
  expect(postRestoreMessage?.ok).toBe(true);
  expect(String(postRestoreMessage?.reply || '').trim()).toBeTruthy();

  const postRestoreRuntimeInstances = await listHouseWorkerRuntimeInstances(page.request, { teamId: 'team_main' });
  const postRestoreRuntimeInstance = postRestoreRuntimeInstances?.json?.data?.runtimeInstances?.[0] || null;
  expect(String(postRestoreRuntimeInstance?.workspaceSnapshotRef || '').trim()).toBe(workspaceSnapshotRef);
});
