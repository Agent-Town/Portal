const { test, expect, request: playwrightRequest } = require('@playwright/test');

const { openHouseLibraryRouteManualDrawer } = require('./helpers/house_library_public_stacks');
const { seedHouseLibraryRouteSyncScene } = require('./helpers/house_library_route_sync');
const { resetPortalWebState } = require('./helpers/portal_web');
const { readWorkerSessionId } = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M41.3: Route Desk follows and syncs a House inside the same shell', async ({ page, request }) => {
  await page.addInitScript(() => {
    localStorage.setItem('agentTown:panel:minimized', '0');
  });
  const scene = await seedHouseLibraryRouteSyncScene(page, request, playwrightRequest, {
    titlePrefix: 'Route UI',
    stackCount: 2,
  });

  await page.getByTestId('house-open-library').click();
  await expect(page.getByTestId('house-library-panel')).toBeVisible();
  const initialSessionId = await readWorkerSessionId(page);
  await openHouseLibraryRouteManualDrawer(page);

  await page.getByTestId('house-library-route-source-input').fill(scene.sourceHouse.houseId);
  await page.getByTestId('house-library-route-follow-button').click();
  await expect(page.getByTestId('house-library-routes')).toContainText(scene.sourceHouse.houseId);

  await page.getByTestId('house-library-route-sync-button').click();
  await expect(page.getByTestId('house-library-route-feed-card')).toHaveCount(2);
  await expect(page.getByTestId('house-library-route-feed')).toContainText('Route UI Pack 1');
  await expect(page.getByTestId('house-library-route-feed')).toContainText('Route UI Pack 2');
  expect(await page.evaluate(() => window.location.pathname)).toBe('/app');
  expect(await readWorkerSessionId(page)).toBe(initialSessionId);
});
