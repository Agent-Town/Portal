const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  getPlatformInspector,
  getPlatformStats,
  seedPlatformConfigVersion,
} = require('./helpers/unified_platform');

async function readLibraryListItemIds(page) {
  return await page.locator('#houseLibraryList button').evaluateAll((nodes) => {
    return nodes.map((node) => String(node.getAttribute('data-library-item-id') || '').trim()).filter(Boolean);
  });
}

async function readSelectedLibraryItemId(page) {
  return await page.evaluate(() => {
    const selected = document.querySelector('#houseLibraryList button.primary');
    return selected ? String(selected.getAttribute('data-library-item-id') || '').trim() : '';
  });
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M30.4: House Library shelves organize selected items and filters stay deterministic', async ({ page, request }) => {
  const seededHouse = await seedRecoverableTokenHouse(request);
  const seededConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_shelves_01',
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

  const localResp = await page.request.post('/api/platform/library/items', {
    headers: { 'Idempotency-Key': 'library-shelves-local-001' },
    data: {
      itemType: 'library_note',
      title: 'Planning Note',
      summary: 'Keep planning notes local.',
      contentText: 'Keep planning notes local.',
      sourceKind: 'user_note',
      sourceRef: 'user_note:library-shelves-local-001',
      visibility: 'house_private',
    },
    failOnStatusCode: false,
  });
  expect(localResp.status()).toBe(201);
  const localItemId = String((await localResp.json())?.data?.item?.libraryItemId || '');

  const captureResp = await page.request.post('/api/platform/library/conversation-artifacts', {
    headers: { 'Idempotency-Key': 'library-shelves-capture-001' },
    data: {
      title: 'Conversation Notes',
      messageIds: ['chatmsg_fixture_01'],
      messages: [{ messageId: 'chatmsg_fixture_01', role: 'user', text: 'Capture this planning reminder.' }],
    },
    failOnStatusCode: false,
  });
  expect(captureResp.status()).toBe(201);
  const conversationItemId = String((await captureResp.json())?.data?.item?.libraryItemId || '');

  const importResp = await page.request.post('/api/platform/library/imports', {
    headers: { 'Idempotency-Key': 'library-shelves-import-001' },
    data: {
      registryEntityId: 'reg_registry_catalog',
    },
    failOnStatusCode: false,
  });
  expect(importResp.status()).toBe(201);
  const importedItemId = String((await importResp.json())?.data?.item?.libraryItemId || '');

  const initialStats = await getPlatformStats(request);

  await page.getByTestId('house-open-library').click();
  await expect(page.getByTestId('house-library-panel')).toBeVisible();
  await page.locator(`#houseLibraryList button[data-library-item-id="${localItemId}"]`).click();
  await expect.poll(async () => await readSelectedLibraryItemId(page)).toBe(localItemId);
  await page.getByTestId('house-library-shelf-title').fill('Planning Shelf');
  await page.getByTestId('house-library-shelf-create-button').click();
  await expect(page.getByTestId('house-library-action-status')).toContainText('Made shelf Planning Shelf and placed Planning Note on it.');

  let shelvesInspector = await getPlatformInspector(request, 'shelves');
  expect(shelvesInspector.status).toBe(200);
  expect(shelvesInspector.json?.data?.shelves).toHaveLength(1);
  const shelfId = String(shelvesInspector.json?.data?.shelves?.[0]?.libraryShelfId || '');
  expect(shelfId).toMatch(/^shelf_/);
  expect(shelvesInspector.json?.data?.shelves?.[0]?.orderedItemIds || []).toEqual([localItemId]);

  await page.getByRole('button', { name: 'All shelves' }).click();
  await page.locator(`#houseLibraryList button[data-library-item-id="${importedItemId}"]`).click();
  await expect.poll(async () => await readSelectedLibraryItemId(page)).toBe(importedItemId);
  await expect(page.getByTestId('house-library-detail')).toContainText('reg_registry_catalog');
  await page.getByRole('button', { name: 'Place on Planning Shelf' }).click();
  await expect(page.getByTestId('house-library-action-status')).toContainText('Placed Registry Catalog on Planning Shelf.');

  const statsAfterAdd = await getPlatformStats(request);
  expect(Number(statsAfterAdd?.stats?.counts?.library_shelves || 0)).toBe(Number(initialStats?.stats?.counts?.library_shelves || 0) + 1);
  expect(Number(statsAfterAdd?.stats?.counts?.library_shelf_items || 0)).toBe(Number(initialStats?.stats?.counts?.library_shelf_items || 0) + 2);
  shelvesInspector = await getPlatformInspector(request, 'shelves');
  expect(shelvesInspector.status).toBe(200);
  expect(shelvesInspector.json?.data?.shelves?.[0]?.orderedItemIds || []).toEqual([localItemId, importedItemId]);

  const duplicateAssignResp = await page.request.post(`/api/platform/library/shelves/${encodeURIComponent(shelfId)}/items`, {
    data: {
      itemIds: [importedItemId],
    },
    failOnStatusCode: false,
  });
  expect(duplicateAssignResp.status()).toBe(200);
  const statsAfterReplay = await getPlatformStats(request);
  expect(Number(statsAfterReplay?.stats?.counts?.library_shelf_items || 0)).toBe(Number(statsAfterAdd?.stats?.counts?.library_shelf_items || 0));

  await expect.poll(async () => await readLibraryListItemIds(page)).toEqual([localItemId, importedItemId]);

  await page.getByTestId('house-library-facet-filter').selectOption('imported');
  await expect.poll(async () => await readLibraryListItemIds(page)).toEqual([importedItemId]);

  await page.getByTestId('house-library-facet-filter').selectOption('conversation');
  await expect.poll(async () => await readLibraryListItemIds(page)).toEqual([]);

  await page.getByTestId('house-library-facet-filter').selectOption('all');
  await page.getByRole('button', { name: 'All shelves' }).click();
  await page.locator(`#houseLibraryList button[data-library-item-id="${conversationItemId}"]`).click();
  await page.getByTestId('house-library-facet-filter').selectOption('conversation');
  await expect.poll(async () => await readLibraryListItemIds(page)).toEqual([conversationItemId]);

  await page.getByTestId('house-library-facet-filter').selectOption('all');
  await page.locator(`#houseLibraryShelves button[data-library-shelf-id="${shelfId}"]`).click();
  await expect.poll(async () => await readLibraryListItemIds(page)).toEqual([localItemId, importedItemId]);
  await page.locator(`#houseLibraryList button[data-library-item-id="${importedItemId}"]`).click();
  await expect.poll(async () => await readSelectedLibraryItemId(page)).toBe(importedItemId);
  await expect(page.getByTestId('house-library-detail')).toContainText('reg_registry_catalog');
  await page.getByRole('button', { name: 'Remove from Planning Shelf' }).click();
  await expect(page.getByTestId('house-library-action-status')).toContainText('Removed Registry Catalog from Planning Shelf.');

  const statsAfterRemove = await getPlatformStats(request);
  expect(Number(statsAfterRemove?.stats?.counts?.library_shelf_items || 0)).toBe(Number(statsAfterAdd?.stats?.counts?.library_shelf_items || 0) - 1);
  shelvesInspector = await getPlatformInspector(request, 'shelves');
  expect(shelvesInspector.status).toBe(200);
  expect(shelvesInspector.json?.data?.shelves?.[0]?.orderedItemIds || []).toEqual([localItemId]);
});
