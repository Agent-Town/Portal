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

test('M41.4: Route Desk preview reuses Public Stack import and stamps the sync receipt as imported', async ({ page, request }) => {
  const scene = await seedHouseLibraryRouteSyncScene(page, request, playwrightRequest, {
    titlePrefix: 'Route Import',
    stackCount: 1,
  });

  const createResp = await callPageJson(page, '/api/platform/library/routes', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'route-import-create-001' },
    data: {
      sourceHouseId: scene.sourceHouse.houseId,
    },
  });
  const routeId = String(createResp.json?.data?.route?.libraryRouteSubscriptionId || '');
  expect(routeId).toBeTruthy();

  const syncResp = await callPageJson(page, `/api/platform/library/routes/${encodeURIComponent(routeId)}/sync`, {
    method: 'POST',
    data: {},
  });
  expect(syncResp.status).toBe(200);

  await page.getByTestId('house-open-library').click();
  await page.getByTestId('house-library-route-card').first().click();
  await page.getByTestId('house-library-route-feed-card').first().click();
  await expect(page.getByTestId('house-library-preview-title')).toContainText('Route Import Pack 1');
  await page.getByTestId('house-library-guided-import-button').click();
  await expect(page.getByTestId('house-library-action-status')).toContainText('Imported Public Stack Route Import Pack 1.');
  await expect(page.getByTestId('house-library-route-feed-card').first()).toContainText('Imported');

  const inspector = await getPlatformInspector(request, 'route-sync');
  expect(inspector.status).toBe(200);
  expect(String(inspector.json?.data?.receipts?.[0]?.importedAt || '')).toBeTruthy();
});
