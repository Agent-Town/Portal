const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const {
  getHouseWorkerShare,
  installHouseWorker,
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

async function installHelperIntoHouse(page, request) {
  const registryFixture = await getPlatformFixture(request, 'worker_package_registry_seed');
  expect(registryFixture?.ok).toBe(true);

  const seededHouse = await seedRecoverableTokenHouse(request);
  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const attached = await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const install = await installHouseWorker(page.request, {
    registryEntityId: registryFixture.fixture.registryEntityId,
  });
  expect(install.status).toBe(200);
  expect(install.json?.ok).toBe(true);

  return {
    registryFixture: registryFixture.fixture,
    seededHouse,
    deploymentId: String(install.json?.data?.deployment?.deploymentId || '').trim(),
  };
}

async function mutatePlatformSnapshotRow(request, tableName, matcher, mutateRow) {
  const exported = await exportPlatformSnapshot(request);
  expect(exported.status).toBe(200);
  expect(exported.json?.ok).toBe(true);
  const snapshot = exported.json?.snapshot;
  const rows = Array.isArray(snapshot?.tables?.[tableName]) ? snapshot.tables[tableName] : [];
  const row = rows.find(matcher);
  expect(row).toBeTruthy();
  mutateRow(row);
  const imported = await importPlatformSnapshot(request, snapshot, { reset: true });
  expect(imported.status).toBe(200);
  expect(imported.json?.ok).toBe(true);
}

test('M35.3d: sharing an installed helper fails closed when its exact deployed package version drifts', async ({ page, request }) => {
  const { deploymentId, seededHouse } = await installHelperIntoHouse(page, request);

  await mutatePlatformSnapshotRow(
    request,
    'house_worker_deployments',
    (row) => String(row?.deployment_id || '').trim() === deploymentId,
    (row) => {
      row.entity_version_id = 'rev_house_worker_front_desk_helper_v404';
    }
  );

  const reattached = await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(reattached.status).toBe(200);

  const share = await shareHouseWorker(page.request, { deploymentId });
  expect(share.status).toBe(409);
  expect(share.json?.error?.code).toBe('DEPLOYMENT_PACKAGE_VERSION_INVALID');

  const exported = await exportPlatformSnapshot(request);
  const shareRows = Array.isArray(exported.json?.snapshot?.tables?.house_worker_shares)
    ? exported.json.snapshot.tables.house_worker_shares
    : [];
  expect(shareRows).toHaveLength(0);
});

test('M35.3e: shared helper preview fails closed when the shared package version is stale and the registry banner stays honest', async ({ page, request }) => {
  const { deploymentId } = await installHelperIntoHouse(page, request);
  const share = await shareHouseWorker(page.request, { deploymentId });
  expect(share.status).toBe(200);
  const shareId = String(share.json?.data?.shareId || '').trim();
  expect(shareId).toBeTruthy();

  await mutatePlatformSnapshotRow(
    request,
    'house_worker_shares',
    (row) => String(row?.share_id || '').trim() === shareId,
    (row) => {
      const payload = JSON.parse(String(row.share_payload_json || '{}'));
      payload.entityVersionId = 'rev_house_worker_front_desk_helper_v404';
      row.entity_version_id = payload.entityVersionId;
      row.share_payload_json = JSON.stringify(payload);
    }
  );

  const shareDetail = await getHouseWorkerShare(page.request, shareId);
  expect(shareDetail.status).toBe(409);
  expect(shareDetail.json?.error?.code).toBe('SHARED_WORKER_VERSION_INVALID');
  expect(String(shareDetail.json?.error?.message || '')).toContain('out of date');

  await page.goto(`/registry.html?workerShare=${encodeURIComponent(shareId)}`);
  const banner = page.getByTestId('registry-worker-share-banner');
  await expect(banner).toContainText('out of date');
  await expect(banner).toContainText('fresh link');
  await expect(banner.locator('[data-testid="registry-worker-package-install"]')).toHaveCount(0);
});
