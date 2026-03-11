const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  getPlatformFixture,
  getPlatformInspector,
  getPlatformStats,
  seedPlatformConfigVersion,
} = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M30.5: Satchels save reusable Reading Table scope on top of scope_sets and preserve shelf membership on reorder', async ({ page, request }) => {
  const fixture = await getPlatformFixture(request, 'library_satchel_seed');
  expect(fixture?.ok).toBe(true);

  const seededHouse = await seedRecoverableTokenHouse(request);
  const seededConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_satchel_01',
    houseId: seededHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  });
  expect(seededConfig.ok).toBe(true);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const attached = await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const createAlpha = await page.request.post('/api/platform/library/items', {
    headers: { 'Idempotency-Key': 'library-satchel-alpha-001' },
    data: {
      itemType: 'library_note',
      title: 'Alpha',
      summary: 'Alpha note.',
      contentText: 'Alpha note.',
      sourceKind: 'user_note',
      sourceRef: 'user_note:library-satchel-alpha-001',
      visibility: 'house_private',
    },
    failOnStatusCode: false,
  });
  expect(createAlpha.status()).toBe(201);
  const alphaId = String((await createAlpha.json())?.data?.item?.libraryItemId || '');

  const createBeta = await page.request.post('/api/platform/library/items', {
    headers: { 'Idempotency-Key': 'library-satchel-beta-001' },
    data: {
      itemType: 'library_note',
      title: 'Beta',
      summary: 'Beta note.',
      contentText: 'Beta note.',
      sourceKind: 'user_note',
      sourceRef: 'user_note:library-satchel-beta-001',
      visibility: 'house_private',
    },
    failOnStatusCode: false,
  });
  expect(createBeta.status()).toBe(201);
  const betaId = String((await createBeta.json())?.data?.item?.libraryItemId || '');

  const createGamma = await page.request.post('/api/platform/library/items', {
    headers: { 'Idempotency-Key': 'library-satchel-gamma-001' },
    data: {
      itemType: 'library_note',
      title: 'Gamma',
      summary: 'Gamma note.',
      contentText: 'Gamma note.',
      sourceKind: 'user_note',
      sourceRef: 'user_note:library-satchel-gamma-001',
      visibility: 'house_private',
    },
    failOnStatusCode: false,
  });
  expect(createGamma.status()).toBe(201);
  const gammaId = String((await createGamma.json())?.data?.item?.libraryItemId || '');

  const shelfResp = await page.request.post('/api/platform/library/shelves', {
    headers: { 'Idempotency-Key': 'library-satchel-shelf-001' },
    data: {
      title: 'Launch Shelf',
      itemIds: [alphaId, betaId, gammaId],
    },
    failOnStatusCode: false,
  });
  expect(shelfResp.status()).toBe(201);
  const shelfId = String((await shelfResp.json())?.data?.shelf?.libraryShelfId || '');

  await page.getByTestId('house-open-library').click();
  await expect(page.getByTestId('house-library-panel')).toBeVisible();
  await page.locator(`#houseLibraryShelves button[data-library-shelf-id="${shelfId}"]`).click();
  await page.getByTestId('house-library-satchel-title').fill(String(fixture?.fixture?.satchelTitle || 'Launch Satchel'));

  const statsBeforeSave = await getPlatformStats(request);
  await page.getByTestId('house-library-save-satchel').click();
  await expect(page.getByTestId('house-library-action-status')).toContainText(`Saved Satchel ${String(fixture?.fixture?.satchelTitle || 'Launch Satchel')}.`);

  const statsAfterSave = await getPlatformStats(request);
  expect(Number(statsAfterSave?.stats?.counts?.scope_sets || 0)).toBe(Number(statsBeforeSave?.stats?.counts?.scope_sets || 0) + 1);
  expect(Number(statsAfterSave?.stats?.counts?.scope_set_items || 0)).toBe(Number(statsBeforeSave?.stats?.counts?.scope_set_items || 0) + 3);

  let scopesInspector = await getPlatformInspector(request, 'scopes');
  expect(scopesInspector.status).toBe(200);
  const satchel = Array.isArray(scopesInspector.json?.data?.scopeSets)
    ? scopesInspector.json.data.scopeSets.find((entry) => String(entry?.title || '') === String(fixture?.fixture?.satchelTitle || 'Launch Satchel'))
    : null;
  expect(satchel).toBeTruthy();
  expect(satchel).toMatchObject({
    scopeKind: 'satchel',
    orderedItemIds: [alphaId, betaId, gammaId],
  });
  await page.getByRole('button', { name: 'All shelves' }).click();

  const switchScopeResp = await page.request.post('/api/platform/library/scope', {
    data: {
      scopeSetId: 'scope_satchel_temp_reading_table',
      title: 'Reading Table',
      itemIds: [betaId],
      scopeKind: 'reading_table',
    },
    failOnStatusCode: false,
  });
  expect(switchScopeResp.status()).toBe(200);

  await page.getByTestId('house-open-library').click();
  await page.getByRole('button', { name: new RegExp(String(fixture?.fixture?.satchelTitle || 'Launch Satchel')) }).click();
  await expect(page.getByTestId('house-library-selected')).toContainText('Alpha');
  await expect(page.getByTestId('house-library-selected')).toContainText('Beta');
  await expect(page.getByTestId('house-library-selected')).toContainText('Gamma');
  await expect(page.locator(`#houseLibraryList button[data-library-item-id="${gammaId}"]`)).toBeVisible();

  await page.locator(`#houseLibraryList button[data-library-item-id="${gammaId}"]`).click();
  await page.getByRole('button', { name: 'Move Earlier' }).click();

  scopesInspector = await getPlatformInspector(request, 'scopes');
  expect(scopesInspector.status).toBe(200);
  const reorderedSatchel = Array.isArray(scopesInspector.json?.data?.scopeSets)
    ? scopesInspector.json.data.scopeSets.find((entry) => String(entry?.scopeSetId || '') === String(satchel?.scopeSetId || ''))
    : null;
  expect(reorderedSatchel?.orderedItemIds || []).toEqual([alphaId, gammaId, betaId]);
  expect(String(reorderedSatchel?.title || '')).toBe(String(fixture?.fixture?.satchelTitle || 'Launch Satchel'));

  const shelvesInspector = await getPlatformInspector(request, 'shelves');
  expect(shelvesInspector.status).toBe(200);
  const sourceShelf = Array.isArray(shelvesInspector.json?.data?.shelves)
    ? shelvesInspector.json.data.shelves.find((entry) => String(entry?.libraryShelfId || '') === shelfId)
    : null;
  expect(sourceShelf?.orderedItemIds || []).toEqual([alphaId, betaId, gammaId]);
});
