const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  callPageJson,
  getPlatformStats,
  seedPlatformConfigVersion,
} = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M29.9: Registry import creates one read-only Library artifact with deterministic provenance and idempotent replay', async ({ page, request }) => {
  const seededHouse = await seedRecoverableTokenHouse(request);
  const seededConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_library_registry_import_01',
    houseId: seededHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  });
  expect(seededConfig?.ok).toBe(true);

  const registryEntityId = 'reg_registry_catalog';
  const registryEntityResp = await request.get(`/api/registry/entities/${encodeURIComponent(registryEntityId)}`, {
    failOnStatusCode: false,
  });
  expect(registryEntityResp.status()).toBe(200);
  const registryEntityBody = await registryEntityResp.json();
  expect(registryEntityBody?.ok).toBe(true);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const attached = await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const statsBefore = await getPlatformStats(request);
  expect(statsBefore?.ok).toBe(true);

  const importResp = await callPageJson(page, '/api/platform/library/imports', {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'library-import-registry-001',
    },
    data: {
      registryEntityId,
    },
  });
  expect(importResp.status).toBe(201);
  const importBody = importResp.json;
  expect(importBody?.data?.import).toMatchObject({
    registryEntityId,
    registryId: registryEntityId,
  });
  expect(importBody?.data?.item).toMatchObject({
    itemType: 'imported_artifact',
    sourceKind: 'registry_artifact',
    sourceRef: registryEntityId,
    registryId: registryEntityId,
    importedState: 'imported_artifact',
    readOnly: true,
  });
  expect(String(importBody?.data?.item?.libraryItemId || '')).toMatch(/^lib_/);
  expect(String(importBody?.data?.item?.contentHash || '')).toMatch(/^sha256:/);
  expect(Array.isArray(importBody?.data?.links)).toBe(true);
  expect(importBody.data.links).toHaveLength(1);
  expect(importBody.data.links[0]).toMatchObject({
    linkKind: 'imported_from_registry',
    sourceKind: 'registry_artifact',
    sourceRef: registryEntityId,
  });

  const statsAfterImport = await getPlatformStats(request);
  expect(Number(statsAfterImport?.stats?.counts?.library_items || 0)).toBe(Number(statsBefore?.stats?.counts?.library_items || 0) + 1);
  expect(Number(statsAfterImport?.stats?.counts?.library_links || 0)).toBe(Number(statsBefore?.stats?.counts?.library_links || 0) + 1);

  const replayResp = await callPageJson(page, '/api/platform/library/imports', {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'library-import-registry-001',
    },
    data: {
      registryEntityId,
    },
  });
  expect(replayResp.status).toBe(200);
  const replayBody = replayResp.json;
  expect(String(replayBody?.data?.item?.libraryItemId || '')).toBe(String(importBody?.data?.item?.libraryItemId || ''));

  const statsAfterReplay = await getPlatformStats(request);
  expect(statsAfterReplay?.stats?.counts).toEqual(statsAfterImport?.stats?.counts);

  const libraryReadA = await callPageJson(page, '/api/platform/library');
  const libraryReadB = await callPageJson(page, '/api/platform/library');
  expect(libraryReadA.status).toBe(200);
  expect(libraryReadB.status).toBe(200);
  const libraryBodyA = libraryReadA.json;
  const libraryBodyB = libraryReadB.json;
  const importedA = Array.isArray(libraryBodyA?.data?.items)
    ? libraryBodyA.data.items.find((item) => String(item?.libraryItemId || '') === String(importBody?.data?.item?.libraryItemId || ''))
    : null;
  const importedB = Array.isArray(libraryBodyB?.data?.items)
    ? libraryBodyB.data.items.find((item) => String(item?.libraryItemId || '') === String(importBody?.data?.item?.libraryItemId || ''))
    : null;
  expect(importedA).toMatchObject({
    registryId: registryEntityId,
    contentHash: String(importBody?.data?.item?.contentHash || ''),
    sourceRef: registryEntityId,
    importedState: 'imported_artifact',
    readOnly: true,
  });
  expect(importedB).toEqual(importedA);

  await page.getByTestId('house-open-library').click();
  await expect(page.getByTestId('house-library-panel')).toBeVisible();
  await expect(page.locator('#houseLibraryList button').first()).toContainText(String(registryEntityBody?.data?.entity?.displayName || 'Registry Catalog'));
  await expect(page.locator('#houseLibraryList button').first()).toContainText('Imported');
  await expect(page.locator('#houseLibraryList button').first()).toContainText('Read only');
  await expect(page.getByTestId('house-library-detail')).toContainText('Imported from Registry');
  await expect(page.getByTestId('house-library-detail')).toContainText('Read only');
  await expect(page.getByTestId('house-library-detail')).toContainText(registryEntityId);
});
