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

async function readLibraryItemRevisions(page, libraryItemId) {
  const response = await page.request.get(`/api/platform/library/items/${encodeURIComponent(String(libraryItemId || ''))}/revisions`, {
    failOnStatusCode: false,
  });
  return {
    status: response.status(),
    json: await response.json(),
  };
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M30.2: local Library notes keep revision history while imported items stay read only', async ({ page, request }) => {
  const seededHouse = await seedRecoverableTokenHouse(request);
  const seededConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_revision_history_01',
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

  const createResponse = await page.request.post('/api/platform/library/items', {
    headers: {
      'Idempotency-Key': 'library-revision-history-create-001',
    },
    data: {
      itemType: 'library_note',
      title: 'House Rules',
      summary: 'Keep the worker alive in /app.',
      contentText: 'Keep the worker alive in /app.',
      sourceKind: 'user_note',
      sourceRef: 'user_note:library-revision-history-create-001',
      visibility: 'house_private',
    },
    failOnStatusCode: false,
  });
  expect(createResponse.status()).toBe(201);

  const statsAfterCreate = await getPlatformStats(request);
  const libraryInspectorAfterCreate = await getPlatformInspector(request, 'library');
  const createdItem = Array.isArray(libraryInspectorAfterCreate.json?.data?.items)
    ? libraryInspectorAfterCreate.json.data.items.find((entry) => String(entry?.title || '') === 'House Rules')
    : null;
  const createdItemId = String(createdItem?.libraryItemId || '');
  expect(createdItemId).toMatch(/^lib_/);

  await page.getByTestId('house-open-library').click();
  await expect(page.getByTestId('house-library-panel')).toBeVisible();
  await page.getByRole('button', { name: 'Edit in Librarian Desk' }).click();
  await expect(page.getByTestId('house-library-composer-status')).toHaveText('Editing a local Library note.');
  await page.getByTestId('house-library-note-body').fill('Keep the worker alive in /app and reopen the Reading Table before acting.');
  await expect(page.getByTestId('house-library-save-note')).toBeEnabled();
  await page.getByTestId('house-library-save-note').click();
  await expect(page.getByTestId('house-library-action-status')).toContainText('Updated House Rules in your Library.');
  await expect(page.getByTestId('house-library-revisions').locator('div')).toHaveCount(2);

  const statsAfterEdit = await getPlatformStats(request);
  expect(Number(statsAfterEdit?.stats?.counts?.library_items || 0)).toBe(Number(statsAfterCreate?.stats?.counts?.library_items || 0));
  expect(Number(statsAfterEdit?.stats?.counts?.library_item_revisions || 0)).toBe(Number(statsAfterCreate?.stats?.counts?.library_item_revisions || 0) + 1);

  const revisionsResponse = await readLibraryItemRevisions(page, createdItemId);
  expect(revisionsResponse.status).toBe(200);
  expect(Array.isArray(revisionsResponse.json?.data?.revisions)).toBe(true);
  expect(revisionsResponse.json.data.revisions).toHaveLength(2);
  expect(String(revisionsResponse.json.data.revisions[0]?.libraryItemId || '')).toBe(createdItemId);
  expect(String(revisionsResponse.json.data.revisions[0]?.contentHash || '')).not.toBe(String(revisionsResponse.json.data.revisions[1]?.contentHash || ''));

  await page.reload();
  await waitForLiteApi(page);
  const reattached = await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(reattached.status).toBe(200);
  await page.getByTestId('house-open-library').click();
  await expect(page.getByTestId('house-library-detail')).toContainText('reopen the Reading Table before acting');

  const importResponse = await page.request.post('/api/platform/library/imports', {
    headers: {
      'Idempotency-Key': 'library-revision-history-import-001',
    },
    data: {
      registryEntityId: 'reg_registry_catalog',
    },
    failOnStatusCode: false,
  });
  expect(importResponse.status()).toBe(201);
  const importedBody = await importResponse.json();
  const importedItemId = String(importedBody?.data?.item?.libraryItemId || '');
  expect(importedItemId).toMatch(/^lib_/);

  await page.getByTestId('house-open-library').click();
  await page.locator(`#houseLibraryList button[data-library-item-id="${importedItemId}"]`).click();
  await expect(page.getByRole('button', { name: 'This item is read only' })).toBeDisabled();

  const importedEditResponse = await page.request.patch(`/api/platform/library/items/${encodeURIComponent(importedItemId)}`, {
    data: {
      title: 'Imported Registry Catalog',
      summary: 'This should be blocked.',
      contentText: 'blocked',
    },
    failOnStatusCode: false,
  });
  expect(importedEditResponse.status()).toBe(409);
  expect((await importedEditResponse.json())?.error?.code).toBe('LIBRARY_ITEM_READ_ONLY');
});
