const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  callPageJson,
  readWorkerSessionId,
  seedPlatformConfigVersion,
} = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M29.1: House Library opens inside the same shell with deterministic empty and seeded states', async ({ page, request }) => {
  const seededHouse = await seedRecoverableTokenHouse(request);
  const seededConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_surface_01',
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

  const initialSessionId = await readWorkerSessionId(page);

  const emptyResponse = await callPageJson(page, '/api/platform/library');
  expect(emptyResponse.ok).toBe(true);
  const emptyBody = emptyResponse.json;
  expect(emptyBody?.data).toMatchObject({
    houseId: seededHouse.houseId,
    teamId: 'team_main',
    emptyStateText: 'No curated Library items yet.',
    activeScopeSetId: null,
  });
  expect(Array.isArray(emptyBody?.data?.items)).toBe(true);
  expect(emptyBody.data.items).toHaveLength(0);

  await page.getByTestId('house-open-library').click();
  await expect(page.getByTestId('house-library-panel')).toBeVisible();
  await expect(page.getByTestId('house-library-empty')).toHaveText('No curated Library items yet.');
  expect(await page.evaluate(() => window.location.pathname)).toBe('/app');
  expect(await readWorkerSessionId(page)).toBe(initialSessionId);

  const createFirst = await callPageJson(page, '/api/platform/library/items', {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'house-library-surface-001',
    },
    data: {
      itemType: 'fact_note',
      title: 'Modal Continuity',
      summary: 'Atlas stays modal-first in the current shell.',
      contentText: 'Keep the worker alive by staying in /app.',
      sourceKind: 'trace',
      sourceRef: 'trace_library_surface_01',
    },
  });
  expect(createFirst.status).toBe(201);

  const createSecond = await callPageJson(page, '/api/platform/library/items', {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'house-library-surface-002',
    },
    data: {
      itemType: 'playbook',
      title: 'Reading Table',
      summary: 'Use explicit scope to choose what the agent may use.',
      contentText: 'Bring the right items into chat on purpose.',
      sourceKind: 'conversation_excerpt',
      sourceRef: 'conv_library_surface_01#msg_01',
    },
  });
  expect(createSecond.status).toBe(201);

  const seededResponse = await callPageJson(page, '/api/platform/library');
  expect(seededResponse.ok).toBe(true);
  const seededBody = seededResponse.json;
  expect(seededBody?.data?.items.map((item) => String(item?.title || ''))).toEqual([
    'Reading Table',
    'Modal Continuity',
  ]);

  await page.getByTestId('house-open-library').click();
  await expect(page.locator('#houseLibraryList button')).toHaveCount(2);
  await expect(page.locator('#houseLibraryList button').nth(0)).toContainText('Reading Table');
  await expect(page.locator('#houseLibraryList button').nth(1)).toContainText('Modal Continuity');
  await expect(page.getByTestId('house-library-detail')).toContainText('Reading Table');
  expect(await readWorkerSessionId(page)).toBe(initialSessionId);
});
