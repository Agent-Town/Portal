const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  getPlatformStats,
  seedPlatformConfigVersion,
} = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M29.3: Library scope selection is explicit, ordered, and does not mutate underlying items', async ({ page, request }) => {
  const seededHouse = await seedRecoverableTokenHouse(request);
  const seededConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_scope_01',
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

  const itemAResponse = await page.request.post('/api/platform/library/items', {
    headers: {
      'Idempotency-Key': 'library-scope-item-a',
    },
    data: {
      itemType: 'fact_note',
      title: 'Atlas Modal Rule',
      summary: 'Atlas stays modal-first.',
      sourceKind: 'trace',
      sourceRef: 'trace_scope_item_a',
    },
    failOnStatusCode: false,
  });
  expect(itemAResponse.status()).toBe(201);
  const itemA = await itemAResponse.json();

  const itemBResponse = await page.request.post('/api/platform/library/items', {
    headers: {
      'Idempotency-Key': 'library-scope-item-b',
    },
    data: {
      itemType: 'playbook',
      title: 'Reading Table Rule',
      summary: 'Only use what the user selected for this chat.',
      sourceKind: 'conversation_excerpt',
      sourceRef: 'conv_scope_item_b#msg_01',
    },
    failOnStatusCode: false,
  });
  expect(itemBResponse.status()).toBe(201);
  const itemB = await itemBResponse.json();

  const itemAId = String(itemA?.data?.item?.libraryItemId || '');
  const itemBId = String(itemB?.data?.item?.libraryItemId || '');
  expect(itemAId).toMatch(/^lib_/);
  expect(itemBId).toMatch(/^lib_/);

  const statsBefore = await getPlatformStats(request);

  const createScope = await page.request.post('/api/platform/library/scope', {
    data: {
      title: 'Reading Table',
      itemIds: [itemBId, itemAId],
    },
    failOnStatusCode: false,
  });
  expect(createScope.status()).toBe(200);
  const createdScopeBody = await createScope.json();
  expect(String(createdScopeBody?.data?.activeScopeSetId || '')).toMatch(/^scope_/);
  expect(createdScopeBody?.data?.orderedItemIds).toEqual([itemBId, itemAId]);
  expect(createdScopeBody?.data?.selectedItems.map((item) => String(item?.libraryItemId || ''))).toEqual([itemBId, itemAId]);

  const statsAfterCreate = await getPlatformStats(request);
  expect(Number(statsAfterCreate?.stats?.counts?.scope_sets || 0)).toBe(Number(statsBefore?.stats?.counts?.scope_sets || 0) + 1);
  expect(Number(statsAfterCreate?.stats?.counts?.scope_set_items || 0)).toBe(Number(statsBefore?.stats?.counts?.scope_set_items || 0) + 2);
  expect(Number(statsAfterCreate?.stats?.counts?.library_items || 0)).toBe(Number(statsBefore?.stats?.counts?.library_items || 0));

  const readScope = await page.request.get('/api/platform/library/scope');
  expect(readScope.ok()).toBe(true);
  const readScopeBody = await readScope.json();
  expect(readScopeBody?.data?.orderedItemIds).toEqual([itemBId, itemAId]);

  const updateScope = await page.request.post('/api/platform/library/scope', {
    data: {
      scopeSetId: createdScopeBody?.data?.activeScopeSetId,
      title: 'Reading Table',
      itemIds: [itemAId],
    },
    failOnStatusCode: false,
  });
  expect(updateScope.status()).toBe(200);
  const updatedScopeBody = await updateScope.json();
  expect(updatedScopeBody?.data?.orderedItemIds).toEqual([itemAId]);

  const statsAfterUpdate = await getPlatformStats(request);
  expect(Number(statsAfterUpdate?.stats?.counts?.scope_sets || 0)).toBe(Number(statsAfterCreate?.stats?.counts?.scope_sets || 0));
  expect(Number(statsAfterUpdate?.stats?.counts?.scope_set_items || 0)).toBe(1);
  expect(Number(statsAfterUpdate?.stats?.counts?.library_items || 0)).toBe(Number(statsAfterCreate?.stats?.counts?.library_items || 0));

  await page.getByTestId('house-open-library').click();
  await expect(page.getByTestId('house-library-panel')).toBeVisible();
  await expect(page.getByTestId('house-library-selected')).toContainText('Atlas Modal Rule');
  await expect(page.getByTestId('house-library-selected')).not.toContainText('Reading Table Rule');
});
