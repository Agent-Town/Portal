const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  getPlatformStats,
  seedPlatformConfigVersion,
} = require('./helpers/unified_platform');

async function readLibraryInspector(request) {
  const response = await request.get('/__test__/unified-platform/inspect/library', {
    headers: { 'x-test-reset': process.env.TEST_RESET_TOKEN || 'test-reset' },
  });
  return await response.json();
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M29.2: creating a Library item is idempotent and preserves explicit source linking', async ({ page, request }) => {
  const seededHouse = await seedRecoverableTokenHouse(request);
  const seededConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_create_01',
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

  const missingSource = await page.request.post('/api/platform/library/items', {
    headers: {
      'Idempotency-Key': 'library-create-link-missing-source',
    },
    data: {
      itemType: 'fact_note',
      title: 'Invalid Item',
      summary: 'This should fail.',
    },
    failOnStatusCode: false,
  });
  expect(missingSource.status()).toBe(400);
  expect((await missingSource.json())?.error?.code).toBe('LIBRARY_SOURCE_REQUIRED');

  const statsBefore = await getPlatformStats(request);
  expect(statsBefore?.ok).toBe(true);

  const createResponse = await page.request.post('/api/platform/library/items', {
    headers: {
      'Idempotency-Key': 'library-create-link-001',
    },
    data: {
      itemType: 'playbook',
      title: 'Workshop Recovery',
      summary: 'Recover the active config from the latest approved patch.',
      contentText: 'Open Workshop, inspect the diff, then promote with approval.',
      sourceKind: 'workspace_file',
      sourceRef: 'workspace/.agent-town/playbooks/recovery.md',
    },
    failOnStatusCode: false,
  });
  expect(createResponse.status()).toBe(201);
  const createdBody = await createResponse.json();
  expect(createdBody?.data?.item).toMatchObject({
    itemType: 'playbook',
    sourceKind: 'workspace_file',
    sourceRef: 'workspace/.agent-town/playbooks/recovery.md',
  });
  expect(String(createdBody?.data?.item?.libraryItemId || '')).toMatch(/^lib_/);
  expect(String(createdBody?.data?.item?.contentHash || '')).toMatch(/^sha256:/);
  expect(Array.isArray(createdBody?.data?.links)).toBe(true);
  expect(createdBody.data.links).toHaveLength(1);

  const statsAfterCreate = await getPlatformStats(request);
  expect(Number(statsAfterCreate?.stats?.counts?.library_items || 0)).toBe(Number(statsBefore?.stats?.counts?.library_items || 0) + 1);
  expect(Number(statsAfterCreate?.stats?.counts?.library_links || 0)).toBe(Number(statsBefore?.stats?.counts?.library_links || 0) + 1);

  const replayResponse = await page.request.post('/api/platform/library/items', {
    headers: {
      'Idempotency-Key': 'library-create-link-001',
    },
    data: {
      itemType: 'playbook',
      title: 'Workshop Recovery',
      summary: 'Recover the active config from the latest approved patch.',
      contentText: 'Open Workshop, inspect the diff, then promote with approval.',
      sourceKind: 'workspace_file',
      sourceRef: 'workspace/.agent-town/playbooks/recovery.md',
    },
    failOnStatusCode: false,
  });
  expect(replayResponse.status()).toBe(200);
  const replayBody = await replayResponse.json();
  expect(String(replayBody?.data?.item?.libraryItemId || '')).toBe(String(createdBody?.data?.item?.libraryItemId || ''));

  const statsAfterReplay = await getPlatformStats(request);
  expect(statsAfterReplay?.stats?.counts).toEqual(statsAfterCreate?.stats?.counts);

  const inspector = await readLibraryInspector(request);
  expect(inspector?.ok).toBe(true);
  expect(inspector?.data?.items?.[0]).toMatchObject({
    sourceKind: 'workspace_file',
    sourceRef: 'workspace/.agent-town/playbooks/recovery.md',
  });
  expect(inspector?.data?.links?.[0]).toMatchObject({
    sourceKind: 'workspace_file',
    sourceRef: 'workspace/.agent-town/playbooks/recovery.md',
  });
});
