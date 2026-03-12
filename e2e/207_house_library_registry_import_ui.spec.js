const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  getPlatformStats,
  readWorkerSessionId,
  seedPlatformConfigVersion,
} = require('./helpers/unified_platform');
const { openHouseLibraryManualImportDrawer } = require('./helpers/house_library_public_stacks');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M29.12: House Library imports Registry artifacts inside the same shell and replays idempotently', async ({ page, request }) => {
  const seededHouse = await seedRecoverableTokenHouse(request);
  const seededConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_registry_import_ui_01',
    houseId: seededHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  });
  expect(seededConfig?.ok).toBe(true);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const attached = await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const initialSessionId = await readWorkerSessionId(page);
  const statsBefore = await getPlatformStats(request);
  expect(statsBefore?.ok).toBe(true);

  await page.getByTestId('house-open-library').click();
  await expect(page.getByTestId('house-library-panel')).toBeVisible();
  await openHouseLibraryManualImportDrawer(page);
  await expect(page.getByTestId('house-library-import-button')).toBeDisabled();

  await page.getByTestId('house-library-import-input').fill('reg_registry_catalog');
  await expect(page.getByTestId('house-library-import-button')).toBeEnabled();
  await page.getByTestId('house-library-import-button').click();

  await expect(page.getByTestId('house-library-action-status')).toContainText('Imported Registry Catalog from Registry.');
  await expect(page.getByTestId('house-library-import-input')).toHaveValue('');
  await expect(page.locator('#houseLibraryList button')).toHaveCount(1);
  await expect(page.locator('#houseLibraryList button').first()).toContainText('Registry Catalog');
  await expect(page.locator('#houseLibraryList button').first()).toContainText('Imported');
  await expect(page.locator('#houseLibraryList button').first()).toContainText('Read only');
  await expect(page.getByTestId('house-library-detail')).toContainText('Imported from Registry');
  await expect(page.getByTestId('house-library-detail')).toContainText('Read only');
  await expect(page.getByTestId('house-library-detail')).toContainText('reg_registry_catalog');
  expect(await page.evaluate(() => window.location.pathname)).toBe('/app');
  expect(await readWorkerSessionId(page)).toBe(initialSessionId);

  const statsAfterImport = await getPlatformStats(request);
  expect(Number(statsAfterImport?.stats?.counts?.library_items || 0)).toBe(Number(statsBefore?.stats?.counts?.library_items || 0) + 1);
  expect(Number(statsAfterImport?.stats?.counts?.library_links || 0)).toBe(Number(statsBefore?.stats?.counts?.library_links || 0) + 1);

  await page.getByTestId('house-library-import-input').fill('reg_registry_catalog');
  await page.getByTestId('house-library-import-button').click();

  await expect(page.locator('#houseLibraryList button')).toHaveCount(1);
  await expect(page.getByTestId('house-library-action-status')).toContainText('Imported Registry Catalog from Registry.');
  expect(await page.evaluate(() => window.location.pathname)).toBe('/app');
  expect(await readWorkerSessionId(page)).toBe(initialSessionId);

  const statsAfterReplay = await getPlatformStats(request);
  expect(statsAfterReplay?.stats?.counts).toEqual(statsAfterImport?.stats?.counts);
});
