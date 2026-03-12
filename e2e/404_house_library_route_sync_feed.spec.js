const { test, expect, request: playwrightRequest } = require('@playwright/test');

const { seedHouseLibraryRouteSyncScene } = require('./helpers/house_library_route_sync');
const { resetPortalWebState } = require('./helpers/portal_web');
const {
  callPageJson,
  getPlatformInspector,
} = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M41.2: syncing a route creates one receipt per published Public Stack and replays without duplication', async ({ page, request }) => {
  const scene = await seedHouseLibraryRouteSyncScene(page, request, playwrightRequest, {
    titlePrefix: 'Route Feed',
    stackCount: 2,
  });

  const createResp = await callPageJson(page, '/api/platform/library/routes', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'route-feed-create-001' },
    data: {
      sourceHouseId: scene.sourceHouse.houseId,
    },
  });
  expect(createResp.status).toBe(201);
  const routeId = String(createResp.json?.data?.route?.libraryRouteSubscriptionId || '');
  expect(routeId).toBeTruthy();

  const syncResp = await callPageJson(page, `/api/platform/library/routes/${encodeURIComponent(routeId)}/sync`, {
    method: 'POST',
    data: {},
  });
  expect(syncResp.status).toBe(200);
  expect(syncResp.json?.data).toMatchObject({
    syncedCount: 2,
  });

  const feedResp = await callPageJson(page, `/api/platform/library/routes/${encodeURIComponent(routeId)}/feed`);
  expect(feedResp.status).toBe(200);
  expect(feedResp.json?.data?.resultCount).toBe(2);
  expect(feedResp.json?.data?.results?.map((entry) => entry.displayName)).toEqual([
    'Route Feed Pack 1',
    'Route Feed Pack 2',
  ]);
  feedResp.json?.data?.results?.forEach((entry) => {
    expect(entry).toMatchObject({
      sourceHouseId: scene.sourceHouse.houseId,
      importedHere: false,
    });
    expect([
      'ready_here',
      'check_here',
      'attested_elsewhere',
      'imported_here',
    ]).toContain(String(entry?.discoveryLane || ''));
  });

  const replaySyncResp = await callPageJson(page, `/api/platform/library/routes/${encodeURIComponent(routeId)}/sync`, {
    method: 'POST',
    data: {},
  });
  expect(replaySyncResp.status).toBe(200);
  expect(replaySyncResp.json?.data?.syncedCount).toBe(2);

  const inspector = await getPlatformInspector(request, 'route-sync');
  expect(inspector.status).toBe(200);
  expect(inspector.json?.data?.subscriptions).toHaveLength(1);
  expect(inspector.json?.data?.receipts).toHaveLength(2);
});
