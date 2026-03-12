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

test('M41.1: target House creates one route subscription idempotently and rejects self-follow', async ({ page, request }) => {
  const scene = await seedHouseLibraryRouteSyncScene(page, request, playwrightRequest, {
    titlePrefix: 'Route Create',
    stackCount: 1,
  });

  const createResp = await callPageJson(page, '/api/platform/library/routes', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'route-create-001' },
    data: {
      sourceHouseId: scene.sourceHouse.houseId,
    },
  });
  expect(createResp.status).toBe(201);
  expect(createResp.json?.data?.route).toMatchObject({
    houseId: scene.targetHouse.houseId,
    teamId: 'team_main',
    sourceHouseId: scene.sourceHouse.houseId,
    sourceTeamId: 'team_main',
    routeState: 'active',
  });

  const replayResp = await callPageJson(page, '/api/platform/library/routes', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'route-create-001' },
    data: {
      sourceHouseId: scene.sourceHouse.houseId,
    },
  });
  expect(replayResp.status).toBe(200);
  expect(replayResp.json?.data?.route?.libraryRouteSubscriptionId).toBe(createResp.json?.data?.route?.libraryRouteSubscriptionId);

  const selfResp = await callPageJson(page, '/api/platform/library/routes', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'route-create-self-001' },
    data: {
      sourceHouseId: scene.targetHouse.houseId,
    },
  });
  expect(selfResp.status).toBe(409);
  expect(selfResp.json).toMatchObject({
    ok: false,
    error: {
      code: 'LIBRARY_ROUTE_SELF_NOT_ALLOWED',
    },
  });

  const inspector = await getPlatformInspector(request, 'route-sync');
  expect(inspector.status).toBe(200);
  expect(inspector.json?.data?.subscriptions).toHaveLength(1);
  expect(inspector.json?.data?.receipts).toHaveLength(0);
});
