const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const {
  getHouseWorkerDeployments,
  installHouseWorker,
  installSharedHouseWorker,
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

async function createSharedWorker(page, request) {
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
  expect(install.json?.ok).toBe(true);

  const share = await shareHouseWorker(page.request, {
    deploymentId: install.json?.data?.deployment?.deploymentId,
  });
  expect(share.status).toBe(200);
  expect(share.json?.ok).toBe(true);

  return {
    registryFixture: registryFixture.fixture,
    shareId: share.json?.data?.shareId,
  };
}

async function mutateSharedWorkerSnapshot(request, shareId, mutateRow) {
  const exported = await exportPlatformSnapshot(request);
  expect(exported.status).toBe(200);
  expect(exported.json?.ok).toBe(true);

  const snapshot = exported.json?.snapshot;
  const rows = Array.isArray(snapshot?.tables?.house_worker_shares)
    ? snapshot.tables.house_worker_shares
    : [];
  const targetRow = rows.find((row) => String(row?.share_id || '').trim() === String(shareId || '').trim());
  expect(targetRow).toBeTruthy();

  mutateRow(targetRow);

  const imported = await importPlatformSnapshot(request, snapshot, { reset: true });
  expect(imported.status).toBe(200);
  expect(imported.json?.ok).toBe(true);
}

async function attachFriendHouse(browser) {
  const friendContext = await browser.newContext();
  const friendPage = await friendContext.newPage();
  await friendPage.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(friendPage);
  const friendHouse = await seedRecoverableTokenHouse(friendPage.request);
  const attached = await attachHouseToPageSession(friendPage, {
    houseId: friendHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);
  return {
    friendContext,
    friendPage,
    friendHouse,
  };
}

test('M35.7a: shared helper install fails closed when share metadata diverges from its portable payload', async ({ page, request, browser }) => {
  const { shareId } = await createSharedWorker(page, request);
  const { friendContext, friendPage } = await attachFriendHouse(browser);
  await mutateSharedWorkerSnapshot(request, shareId, (row) => {
    const payload = JSON.parse(String(row.share_payload_json || '{}'));
    payload.entityVersionId = 'rev_house_worker_front_desk_helper_v1_tampered';
    row.share_payload_json = JSON.stringify(payload);
  });
  const install = await installSharedHouseWorker(friendPage.request, { shareId });
  expect(install.status).toBe(409);
  expect(install.json?.error?.code).toBe('SHARED_WORKER_PAYLOAD_MISMATCH');
  expect(install.json?.error?.details?.field).toBe('entityVersionId');

  const deployments = await getHouseWorkerDeployments(friendPage.request);
  expect(deployments.status).toBe(200);
  expect(deployments.json?.data?.deployments || []).toHaveLength(0);

  await friendContext.close();
});

test('M35.7b: shared helper install fails closed when the exact shared Registry version no longer resolves', async ({ page, request, browser }) => {
  const { shareId } = await createSharedWorker(page, request);
  const { friendContext, friendPage } = await attachFriendHouse(browser);
  await mutateSharedWorkerSnapshot(request, shareId, (row) => {
    const payload = JSON.parse(String(row.share_payload_json || '{}'));
    payload.entityVersionId = 'rev_house_worker_front_desk_helper_v404';
    row.entity_version_id = payload.entityVersionId;
    row.share_payload_json = JSON.stringify(payload);
  });
  const install = await installSharedHouseWorker(friendPage.request, { shareId });
  expect(install.status).toBe(409);
  expect(install.json?.error?.code).toBe('SHARED_WORKER_VERSION_INVALID');

  const deployments = await getHouseWorkerDeployments(friendPage.request);
  expect(deployments.status).toBe(200);
  expect(deployments.json?.data?.deployments || []).toHaveLength(0);

  await friendContext.close();
});

test('M35.7c: shared helper install fails closed when the shared bundle no longer belongs to the exact shared package', async ({ page, request, browser }) => {
  const { shareId } = await createSharedWorker(page, request);
  const { friendContext, friendPage } = await attachFriendHouse(browser);
  await mutateSharedWorkerSnapshot(request, shareId, (row) => {
    const payload = JSON.parse(String(row.share_payload_json || '{}'));
    payload.bundleHash = 'sha256:bundle_house_worker_front_desk_helper_v404';
    row.bundle_hash = payload.bundleHash;
    row.share_payload_json = JSON.stringify(payload);
  });
  const install = await installSharedHouseWorker(friendPage.request, { shareId });
  expect(install.status).toBe(409);
  expect(install.json?.error?.code).toBe('SHARED_WORKER_BUNDLE_INVALID');

  const deployments = await getHouseWorkerDeployments(friendPage.request);
  expect(deployments.status).toBe(200);
  expect(deployments.json?.data?.deployments || []).toHaveLength(0);

  await friendContext.close();
});
