const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const {
  getHouseWorkerDeployments,
  getHouseWorkerShare,
  installHouseWorker,
  installSharedHouseWorker,
  shareHouseWorker,
} = require('./helpers/house_workers');
const { resetPortalWebState } = require('./helpers/portal_web');
const { attachHouseToPageSession, getPlatformFixture } = require('./helpers/unified_platform');
const { waitForLiteApi } = require('./helpers/trainer');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M38.4: office pack shares copy multiple helpers with exact office placement intent and no secret leakage', async ({ page, request, browser }) => {
  const registryFixture = await getPlatformFixture(request, 'worker_package_registry_seed');
  const structureFixture = await getPlatformFixture(request, 'house_office_structure_seed');
  expect(registryFixture?.ok).toBe(true);
  expect(structureFixture?.ok).toBe(true);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const ownerHouse = await seedRecoverableTokenHouse(request);
  const attached = await attachHouseToPageSession(page, {
    houseId: ownerHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const installOps = await installHouseWorker(page.request, {
    registryEntityId: registryFixture.fixture.registryEntityId,
    officeId: 'office_fixture_ops',
    displayName: 'Front Desk Helper',
  });
  expect(installOps.status).toBe(200);
  const installArchive = await installHouseWorker(page.request, {
    registryEntityId: registryFixture.fixture.registryEntityId,
    officeId: 'office_fixture_archive',
    displayName: 'Archive Guide',
  });
  expect(installArchive.status).toBe(200);

  const deploymentIds = [
    String(installOps.json?.data?.deployment?.deploymentId || '').trim(),
    String(installArchive.json?.data?.deployment?.deploymentId || '').trim(),
  ];
  expect(deploymentIds.every(Boolean)).toBe(true);

  const share = await shareHouseWorker(page.request, { deploymentIds });
  expect(share.status).toBe(200);
  expect(share.json?.data).toMatchObject({
    shareKind: 'office_pack',
    memberCount: 2,
    status: 'active',
  });
  const shareId = String(share.json?.data?.shareId || '').trim();
  expect(shareId).toBeTruthy();

  const preview = await getHouseWorkerShare(page.request, shareId);
  expect(preview.status).toBe(200);
  expect(preview.json?.data).toMatchObject({
    shareKind: 'office_pack',
    memberCount: 2,
  });
  expect(preview.json?.data?.portable?.members || []).toHaveLength(2);
  const portableString = JSON.stringify(preview.json?.data?.portable || {});
  expect(portableString.includes('privateKey')).toBe(false);
  expect(portableString.includes('accessToken')).toBe(false);
  expect(portableString.includes('callbackUrl')).toBe(false);

  await page.goto(`/registry.html?workerShare=${encodeURIComponent(shareId)}`);
  await expect(page.getByTestId('registry-worker-share-banner')).toContainText('2 helpers');

  const friendContext = await browser.newContext();
  const friendPage = await friendContext.newPage();
  await friendPage.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(friendPage);
  const friendHouse = await seedRecoverableTokenHouse(friendPage.request);
  const attachedFriend = await attachHouseToPageSession(friendPage, {
    houseId: friendHouse.houseId,
    teamId: 'team_main',
  });
  expect(attachedFriend.status).toBe(200);

  const installedPack = await installSharedHouseWorker(friendPage.request, { shareId });
  expect(installedPack.status).toBe(200);
  expect(installedPack.json?.data?.deployments || []).toHaveLength(2);

  const friendDeploymentsEnvelope = await getHouseWorkerDeployments(friendPage.request);
  expect(friendDeploymentsEnvelope.status).toBe(200);
  const friendDeployments = friendDeploymentsEnvelope.json?.data?.deployments || [];
  const matchedDeployments = friendDeployments.filter((entry) =>
    [registryFixture.fixture.registryEntityId].includes(String(entry?.registryEntityId || '').trim())
  );
  expect(matchedDeployments).toHaveLength(2);

  const officeIds = matchedDeployments.map((entry) => String(entry?.officeId || '').trim()).sort();
  expect(officeIds).toEqual(['office_fixture_archive', 'office_fixture_ops']);

  const parityPairs = matchedDeployments.map((entry) => ({
    entityVersionId: String(entry?.entityVersionId || '').trim(),
    loadoutId: String(entry?.loadoutId || '').trim(),
    bundleHash: String(entry?.bundleHash || '').trim(),
  }));
  expect(parityPairs).toEqual([
    {
      entityVersionId: registryFixture.fixture.entityVersionId,
      loadoutId: registryFixture.fixture.loadoutId,
      bundleHash: registryFixture.fixture.bundleHash,
    },
    {
      entityVersionId: registryFixture.fixture.entityVersionId,
      loadoutId: registryFixture.fixture.loadoutId,
      bundleHash: registryFixture.fixture.bundleHash,
    },
  ]);

  await friendContext.close();
});
