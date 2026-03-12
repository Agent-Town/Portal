const { test, expect } = require('@playwright/test');

const { invokeLiteTool } = require('./helpers/experience_intents');
const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const {
  installHouseWorker,
  installSharedHouseWorker,
  readHouseWorkerSessionsFromPage,
  readHouseWorkerSupervisorSnapshot,
  shareHouseWorker,
} = require('./helpers/house_workers');
const { configureLiteLlm } = require('./helpers/phase2');
const { resetPortalWebState } = require('./helpers/portal_web');
const { attachHouseToPageSession, getPlatformFixture } = require('./helpers/unified_platform');
const { waitForLiteApi } = require('./helpers/trainer');

function normalizeCheckpoints(entries = []) {
  return (Array.isArray(entries) ? entries : []).map((entry) =>
    String(entry || '')
      .replace(/hws_[A-Za-z0-9]+/g, '<session>')
      .replace(/helper_[A-Za-z0-9]+/g, '<helper>')
  );
}

async function runJourney({ ownerPage, ownerRequest, browser, registryEntityId, officeIds }) {
  const ownerHouse = await seedRecoverableTokenHouse(ownerRequest);
  await ownerPage.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(ownerPage);
  await configureLiteLlm(ownerPage, {
    provider: 'test-local',
    model: 'deterministic',
    apiKey: 'trainer-test-key',
  });
  await attachHouseToPageSession(ownerPage, {
    houseId: ownerHouse.houseId,
    teamId: 'team_main',
  });

  const deploymentIds = [];
  for (const officeId of officeIds) {
    const installResult = await installHouseWorker(ownerPage.request, {
      registryEntityId,
      officeId,
    });
    expect(installResult.status).toBe(200);
    deploymentIds.push(String(installResult.json?.data?.deployment?.deploymentId || '').trim());
  }

  const officePackShare = await shareHouseWorker(ownerPage.request, {
    deploymentIds,
  });
  expect(officePackShare.status).toBe(200);
  const shareId = String(officePackShare.json?.data?.shareId || '').trim();
  expect(shareId).toBeTruthy();

  const friendContext = await browser.newContext();
  const friendPage = await friendContext.newPage();
  await friendPage.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(friendPage);
  await configureLiteLlm(friendPage, {
    provider: 'test-local',
    model: 'deterministic',
    apiKey: 'trainer-test-key',
  });
  const friendHouse = await seedRecoverableTokenHouse(friendPage.request);
  await attachHouseToPageSession(friendPage, {
    houseId: friendHouse.houseId,
    teamId: 'team_main',
  });

  const installShared = await installSharedHouseWorker(friendPage.request, {
    shareId,
  });
  expect(installShared.status).toBe(200);
  const friendDeployments = Array.isArray(installShared.json?.data?.deployments) ? installShared.json.data.deployments : [];
  expect(friendDeployments).toHaveLength(officeIds.length);
  expect(friendDeployments.map((entry) => String(entry?.officeId || '').trim())).toEqual(officeIds);

  const rootSpawn = await invokeLiteTool(friendPage, 'agent_town_worker_spawn', {
    deploymentId: friendDeployments[0]?.deploymentId,
    task: 'Summarize what this office helper will do next in one short sentence.',
    reason: 'house_summary',
  });
  expect(rootSpawn?.ok).toBe(true);
  const rootSessionId = String(rootSpawn?.data?.houseWorkerSessionId || rootSpawn?.data?.workerSessionId || '').trim();
  expect(rootSessionId).toBeTruthy();

  const nestedSpawn = await friendPage.evaluate(async ({ parentWorkerSessionId, deploymentId }) => {
    return await window.dispatchHouseWorkerRuntimeAction('agent_town_worker_spawn', {
      deploymentId,
      task: 'Handle one delegated helper subtask.',
      reason: 'subtask_breakdown',
    }, {
      source: 'test-child-runtime',
      houseWorkerSessionId: parentWorkerSessionId,
    });
  }, {
    parentWorkerSessionId: rootSessionId,
    deploymentId: friendDeployments[1]?.deploymentId,
  });
  expect(nestedSpawn?.ok).toBe(true);

  const snapshotBeforeReload = await readHouseWorkerSupervisorSnapshot(friendPage);
  await friendPage.reload();
  await waitForLiteApi(friendPage);
  await attachHouseToPageSession(friendPage, {
    houseId: friendHouse.houseId,
    teamId: 'team_main',
  });
  await friendPage.getByTestId('house-open-office').click();

  const rootDeploymentId = String(friendDeployments[0]?.deploymentId || '').trim();
  const deploymentCard = friendPage.locator(`[data-testid="house-office-deployment-item"][data-deployment-id="${rootDeploymentId}"]`);
  await expect(deploymentCard.getByTestId('house-office-helper-next-step')).toContainText(/Take over|Restart|Resume/i);
  await deploymentCard.getByTestId('house-office-helper-start').click();
  await deploymentCard.getByTestId('house-office-helper-message-input').fill('Reply with one short recovery status update.');
  await deploymentCard.getByTestId('house-office-helper-ask').click();
  await expect(deploymentCard.getByTestId('house-office-helper-status')).toContainText(/replied|running|already running/i);

  const snapshotAfterReload = await readHouseWorkerSupervisorSnapshot(friendPage);
  const sessionsPayload = await readHouseWorkerSessionsFromPage(friendPage, { teamId: 'team_main' });
  const sessions = Array.isArray(sessionsPayload?.json?.data?.sessions) ? sessionsPayload.json.data.sessions : [];
  const activeLeaseStatuses = sessions
    .filter((entry) => String(entry?.status || '').trim() !== 'stopped')
    .map((entry) => String(entry?.leaseStatus || '').trim());

  const result = {
    checkpoints: normalizeCheckpoints([
      ...(Array.isArray(snapshotBeforeReload?.checkpoints) ? snapshotBeforeReload.checkpoints : []),
      'reload',
      ...(Array.isArray(snapshotAfterReload?.checkpoints) ? snapshotAfterReload.checkpoints : []),
    ]),
    officeIds: friendDeployments.map((entry) => String(entry?.officeId || '').trim()),
    activeLeaseStatuses,
  };

  await friendContext.close();
  return result;
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('T38.11: runtime truth, office-pack sharing, nested delegation, and recovery replay as one deterministic user journey', async ({ page, request, browser }) => {
  test.slow();
  const registryFixture = await getPlatformFixture(request, 'worker_package_registry_seed');
  const smokeFixture = await getPlatformFixture(request, 'worker_runtime_reality_smoke_seed');
  expect(registryFixture?.ok).toBe(true);
  expect(smokeFixture?.ok).toBe(true);

  const officeIds = Array.isArray(smokeFixture.fixture?.officeIds) ? smokeFixture.fixture.officeIds : [];
  expect(officeIds.length).toBeGreaterThanOrEqual(3);

  const firstRun = await runJourney({
    ownerPage: page,
    ownerRequest: request,
    browser,
    registryEntityId: registryFixture.fixture.registryEntityId,
    officeIds: officeIds.slice(0, 3),
  });

  await resetPortalWebState(request);

  const secondOwnerContext = await browser.newContext();
  const secondOwnerPage = await secondOwnerContext.newPage();
  const secondRun = await runJourney({
    ownerPage: secondOwnerPage,
    ownerRequest: secondOwnerPage.request,
    browser,
    registryEntityId: registryFixture.fixture.registryEntityId,
    officeIds: officeIds.slice(0, 3),
  });

  expect(firstRun.officeIds).toEqual(secondRun.officeIds);
  expect(firstRun.activeLeaseStatuses).toEqual(secondRun.activeLeaseStatuses);
  expect(firstRun.checkpoints).toEqual(secondRun.checkpoints);

  await secondOwnerContext.close();
});
