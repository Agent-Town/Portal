const { test, expect } = require('@playwright/test');

const { invokeLiteTool } = require('./helpers/experience_intents');
const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const {
  getHouseWorkerDeployments,
  getHouseWorkerShare,
  installSharedHouseWorker,
  readHouseWorkerSupervisorSnapshot,
  shareHouseWorker,
} = require('./helpers/house_workers');
const { resetPortalWebState } = require('./helpers/portal_web');
const { attachHouseToPageSession, getPlatformFixture } = require('./helpers/unified_platform');
const { waitForLiteApi, setDeterministicLlm } = require('./helpers/trainer');

function normalizeCheckpoints(entries = []) {
  return (Array.isArray(entries) ? entries : []).map((entry) =>
    String(entry || '')
      .replace(/hws_[A-Za-z0-9]+/g, '<session>')
      .replace(/helper_[A-Za-z0-9]+/g, '<helper>')
  );
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M35.13: worker package discovery, install, share, spawn, and delegation compose into one coherent House flow', async ({ page, request, browser }) => {
  const registryFixture = await getPlatformFixture(request, 'worker_package_registry_seed');
  const profileFixture = await getPlatformFixture(request, 'worker_spawn_profile_seed');
  expect(registryFixture?.ok).toBe(true);
  expect(profileFixture?.ok).toBe(true);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);

  const houseA = await seedRecoverableTokenHouse(request);
  await attachHouseToPageSession(page, {
    houseId: houseA.houseId,
    teamId: 'team_main',
  });

  await page.goto('/registry.html?family=workers');
  await expect(page.getByTestId('registry-worker-package-card')).toHaveCount(1);
  await expect(page.getByTestId('registry-worker-package-card')).toContainText(registryFixture.fixture.displayName);
  await page.getByTestId('registry-worker-package-install').click();

  const ownerDeployments = await getHouseWorkerDeployments(page.request);
  expect(ownerDeployments.status).toBe(200);
  const ownerDeployment = ownerDeployments.json?.data?.deployments?.[0];
  expect(ownerDeployment).toMatchObject({
    registryEntityId: registryFixture.fixture.registryEntityId,
    entityVersionId: registryFixture.fixture.entityVersionId,
  });

  const share = await shareHouseWorker(page.request, {
    deploymentId: ownerDeployment?.deploymentId,
  });
  expect(share.status).toBe(200);
  expect(share.json?.data?.portable).toMatchObject({
    registryEntityId: registryFixture.fixture.registryEntityId,
    entityVersionId: registryFixture.fixture.entityVersionId,
    loadoutId: registryFixture.fixture.loadoutId,
    bundleHash: registryFixture.fixture.bundleHash,
  });
  const shareBlob = JSON.stringify(share.json?.data?.portable || {});
  expect(shareBlob.toLowerCase()).not.toContain('secret');
  expect(shareBlob.toLowerCase()).not.toContain('token');
  expect(shareBlob.toLowerCase()).not.toContain('apikey');

  const sharedDetail = await getHouseWorkerShare(page.request, share.json?.data?.shareId);
  expect(sharedDetail.status).toBe(200);

  const friendContext = await browser.newContext();
  const friendPage = await friendContext.newPage();
  await friendPage.goto('/app?district=house&liteDriver=phase1&trainerNamespace=1');
  await waitForLiteApi(friendPage);
  await setDeterministicLlm(friendPage);
  const houseB = await seedRecoverableTokenHouse(friendPage.request);
  await attachHouseToPageSession(friendPage, {
    houseId: houseB.houseId,
    teamId: 'team_main',
  });

  const installShared = await installSharedHouseWorker(friendPage.request, {
    shareId: share.json?.data?.shareId,
  });
  expect(installShared.status).toBe(200);
  const friendDeployment = installShared.json?.data?.deployment;
  expect(friendDeployment).toMatchObject({
    houseId: houseB.houseId,
    registryEntityId: registryFixture.fixture.registryEntityId,
    entityVersionId: registryFixture.fixture.entityVersionId,
  });

  const spawnResult = await invokeLiteTool(friendPage, 'agent_town_worker_spawn', {
    deploymentId: friendDeployment?.deploymentId,
    task: 'Introduce yourself in one short sentence and confirm how you can help this House next.',
    reason: 'friend_house_start',
    brainProfileId: profileFixture.fixture.brainProfileId,
    workspaceSeedRef: profileFixture.fixture.workspaceSeedRef,
    configVersionId: profileFixture.fixture.configVersionId,
    loadoutId: profileFixture.fixture.loadoutId,
  });
  expect(spawnResult?.ok).toBe(true);
  const houseWorkerSessionId = String(
    spawnResult?.data?.houseWorkerSessionId
    || spawnResult?.data?.workerSessionId
    || ''
  ).trim();
  expect(houseWorkerSessionId).toBeTruthy();
  expect(spawnResult?.data?.runtimeProfile).toMatchObject({
    brainProfileId: profileFixture.fixture.brainProfileId,
    workspaceSeedRef: profileFixture.fixture.workspaceSeedRef,
    configVersionId: profileFixture.fixture.configVersionId,
    loadoutId: profileFixture.fixture.loadoutId,
  });

  const messageResult = await invokeLiteTool(friendPage, 'agent_town_worker_message', {
    houseWorkerSessionId,
    message: 'Reply with one short status update for the friend house office.',
  });
  expect(messageResult?.ok).toBe(true);
  expect(String(messageResult?.data?.reply || '').trim()).not.toBe('');

  const statusResult = await invokeLiteTool(friendPage, 'agent_town_worker_status', {
    houseWorkerSessionId,
  });
  expect(statusResult?.ok).toBe(true);
  expect(statusResult?.data?.session).toMatchObject({
    houseWorkerSessionId,
    deploymentId: friendDeployment?.deploymentId,
    status: expect.stringMatching(/^(ready|idle|working)$/),
  });

  const snapshot = await readHouseWorkerSupervisorSnapshot(friendPage);
  expect(normalizeCheckpoints(snapshot?.checkpoints)).toEqual([
    'spawn:<session>',
    'ready:<session>',
    'reply:<session>',
    'reply:<session>',
    'message:<session>',
    'reply:<session>',
  ]);
  expect(await friendPage.evaluate(() => window.location.pathname)).toBe('/app');

  await friendContext.close();
});
