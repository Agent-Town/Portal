const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const {
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

test('M35.3: a shared helper installs into a friend house with exact package identity and no raw export', async ({ page, request, browser }) => {
  const registryFixture = await getPlatformFixture(request, 'worker_package_registry_seed');
  const shareFixture = await getPlatformFixture(request, 'worker_package_share_seed');
  expect(registryFixture?.ok).toBe(true);
  expect(shareFixture?.ok).toBe(true);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);

  const houseA = await seedRecoverableTokenHouse(request);
  let attached = await attachHouseToPageSession(page, {
    houseId: houseA.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const installA = await installHouseWorker(page.request, {
    registryEntityId: registryFixture.fixture.registryEntityId,
  });
  expect(installA.status).toBe(200);

  const share = await shareHouseWorker(page.request, {
    deploymentId: installA.json?.data?.deployment?.deploymentId,
  });
  expect(share.status).toBe(200);
  expect(share.json?.ok).toBe(true);
  expect(String(share.json?.data?.sharePath || '')).toContain(shareFixture.fixture.sharePathPrefix);
  expect(share.json?.data?.portable).toMatchObject({
    registryEntityId: registryFixture.fixture.registryEntityId,
    entityVersionId: registryFixture.fixture.entityVersionId,
    loadoutId: registryFixture.fixture.loadoutId,
    bundleHash: registryFixture.fixture.bundleHash,
  });

  const sharedDetail = await getHouseWorkerShare(page.request, share.json?.data?.shareId);
  expect(sharedDetail.status).toBe(200);
  expect(sharedDetail.json?.data?.portable).toEqual(share.json?.data?.portable);

  const friendContext = await browser.newContext();
  const friendPage = await friendContext.newPage();
  await friendPage.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(friendPage);
  const houseB = await seedRecoverableTokenHouse(friendPage.request);
  attached = await attachHouseToPageSession(friendPage, {
    houseId: houseB.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const installB = await installSharedHouseWorker(friendPage.request, {
    shareId: share.json?.data?.shareId,
  });
  expect(installB.status).toBe(200);
  expect(installB.json?.ok).toBe(true);
  expect(installB.json?.data?.deployment).toMatchObject({
    houseId: houseB.houseId,
    teamId: 'team_main',
    registryEntityId: registryFixture.fixture.registryEntityId,
    entityVersionId: registryFixture.fixture.entityVersionId,
    loadoutId: registryFixture.fixture.loadoutId,
    bundleHash: registryFixture.fixture.bundleHash,
  });
  expect(installB.json?.data?.deployment?.houseId).not.toBe(installA.json?.data?.deployment?.houseId);
  expect(installB.json?.data?.share?.installActionLabel).toBe(shareFixture.fixture.installActionLabel);
  await friendContext.close();
});
