const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const {
  getHouseWorkerShare,
  installHouseWorker,
  installSharedHouseWorker,
  listHouseWorkerShares,
  revokeHouseWorkerShare,
  shareHouseWorker,
} = require('./helpers/house_workers');
const { resetPortalWebState } = require('./helpers/portal_web');
const {
  attachHouseToPageSession,
  exportPlatformSnapshot,
  getPlatformFixture,
  importPlatformSnapshot,
} = require('./helpers/unified_platform');
const { waitForLiteApi } = require('./helpers/trainer');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M38.2: managed helper shares expose lifecycle truth, revoke cleanly, and fail closed after expiry', async ({ page, request, browser }) => {
  const registryFixture = await getPlatformFixture(request, 'worker_package_registry_seed');
  expect(registryFixture?.ok).toBe(true);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const ownerHouse = await seedRecoverableTokenHouse(request);
  const attached = await attachHouseToPageSession(page, {
    houseId: ownerHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const install = await installHouseWorker(page.request, {
    registryEntityId: registryFixture.fixture.registryEntityId,
  });
  expect(install.status).toBe(200);
  const deploymentId = String(install.json?.data?.deployment?.deploymentId || '').trim();
  expect(deploymentId).toBeTruthy();

  const share = await shareHouseWorker(page.request, { deploymentId });
  expect(share.status).toBe(200);
  expect(share.json?.data).toMatchObject({
    shareKind: 'single_worker',
    status: 'active',
    installCount: 0,
  });
  const shareId = String(share.json?.data?.shareId || '').trim();
  expect(shareId).toBeTruthy();
  expect(String(share.json?.data?.expiresAt || '')).toBeTruthy();

  const shareList = await listHouseWorkerShares(page.request);
  expect(shareList.status).toBe(200);
  expect(shareList.json?.data?.shares || []).toEqual(expect.arrayContaining([
    expect.objectContaining({
      shareId,
      status: 'active',
      installCount: 0,
    }),
  ]));

  await page.getByTestId('house-open-office').click();
  const shareCard = page.getByTestId('house-office-worker-share-item').first();
  await expect(shareCard).toContainText('Active until');
  await expect(shareCard).toContainText('0 installs');

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

  const installShared = await installSharedHouseWorker(friendPage.request, { shareId });
  expect(installShared.status).toBe(200);

  const shareListAfterInstall = await listHouseWorkerShares(page.request);
  const installedShare = (shareListAfterInstall.json?.data?.shares || [])
    .find((entry) => String(entry?.shareId || '').trim() === shareId);
  expect(installedShare).toMatchObject({
    shareId,
    installCount: 1,
    status: 'active',
  });

  const revoked = await revokeHouseWorkerShare(page.request, shareId);
  expect(revoked.status).toBe(200);
  expect(revoked.json?.data).toMatchObject({
    shareId,
    status: 'revoked',
  });

  const revokedPreview = await getHouseWorkerShare(page.request, shareId);
  expect(revokedPreview.status).toBe(409);
  expect(revokedPreview.json?.error?.code).toBe('SHARE_REVOKED');

  const revokedInstall = await installSharedHouseWorker(friendPage.request, { shareId });
  expect(revokedInstall.status).toBe(409);
  expect(revokedInstall.json?.error?.code).toBe('SHARE_REVOKED');

  const refreshedShare = await shareHouseWorker(page.request, { deploymentId });
  expect(refreshedShare.status).toBe(200);
  expect(refreshedShare.json?.data?.status).toBe('active');

  const exported = await exportPlatformSnapshot(request);
  expect(exported.status).toBe(200);
  const inviteRows = Array.isArray(exported.json?.snapshot?.tables?.house_worker_share_invites)
    ? exported.json.snapshot.tables.house_worker_share_invites
    : [];
  const targetInvite = inviteRows.find((row) => String(row?.share_invite_id || '').trim() === shareId);
  expect(targetInvite).toBeTruthy();
  targetInvite.status = 'active';
  targetInvite.revoked_at = null;
  targetInvite.revoked_reason = null;
  targetInvite.expires_at = '2000-01-01T00:00:00.000Z';
  const imported = await importPlatformSnapshot(request, exported.json.snapshot, { reset: true });
  expect(imported.status).toBe(200);

  const expiredPreview = await getHouseWorkerShare(page.request, shareId);
  expect(expiredPreview.status).toBe(409);
  expect(expiredPreview.json?.error?.code).toBe('SHARE_EXPIRED');

  const expiredInstall = await installSharedHouseWorker(friendPage.request, { shareId });
  expect(expiredInstall.status).toBe(409);
  expect(expiredInstall.json?.error?.code).toBe('SHARE_EXPIRED');

  await friendContext.close();
});
