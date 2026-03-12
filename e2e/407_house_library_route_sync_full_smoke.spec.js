const { test, expect, request: playwrightRequest } = require('@playwright/test');

const { seedHouseLibraryRouteSyncScene } = require('./helpers/house_library_route_sync');
const { resetPortalWebState } = require('./helpers/portal_web');
const { readWorkerSessionId } = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M41.5: Route Desk stays same-shell from follow through sync, preview, and import', async ({ page, request }) => {
  await page.addInitScript(() => {
    localStorage.setItem('agentTown:panel:minimized', '0');
  });
  const scene = await seedHouseLibraryRouteSyncScene(page, request, playwrightRequest, {
    titlePrefix: 'Route Smoke',
    stackCount: 1,
  });

  await page.getByTestId('house-open-library').click();
  await expect(page.getByTestId('house-library-panel')).toBeVisible();
  const initialSessionId = await readWorkerSessionId(page);

  await page.getByTestId('house-library-route-source-input').fill(scene.sourceHouse.houseId);
  await page.getByTestId('house-library-route-follow-button').click();
  await expect(page.getByTestId('house-library-routes')).toContainText(scene.sourceHouse.houseId);

  await page.getByTestId('house-library-route-sync-button').click();
  await page.getByTestId('house-library-route-feed-card').first().click();
  await expect(page.getByTestId('house-library-preview-title')).toContainText('Route Smoke Pack 1');
  await page.getByTestId('house-library-guided-import-button').click();
  await expect(page.getByTestId('house-library-action-status')).toContainText('Imported Public Stack Route Smoke Pack 1.');
  await expect(page.getByTestId('house-library-route-feed-card').first()).toContainText('Imported');

  expect(await page.evaluate(() => window.location.pathname)).toBe('/app');
  expect(await readWorkerSessionId(page)).toBe(initialSessionId);
});
