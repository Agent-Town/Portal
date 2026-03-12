const { test, expect, request: playwrightRequest } = require('@playwright/test');

const {
  openHouseLibraryDetailDrawer,
  openHouseLibraryIncomingRelayDrawer,
  openHouseLibraryIncomingSatchelDrawer,
  openHouseLibraryRouteManualDrawer,
  saveHouseLibrarySafety,
} = require('./helpers/house_library_public_stacks');
const { seedHouseLibraryShellwideScene } = require('./helpers/house_library_shellwide');
const { resetPortalWebState } = require('./helpers/portal_web');
const { readWorkerSessionId } = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M42.5: shell-wide icon-first flow stays same-shell across routes, safety, received desks, and local Library detail', async ({ page, request }) => {
  await page.addInitScript(() => {
    localStorage.setItem('agentTown:panel:minimized', '0');
  });
  const scene = await seedHouseLibraryShellwideScene(page, request, playwrightRequest, {
    titlePrefix: 'Shellwide Smoke',
  });

  await page.getByTestId('house-open-library').click();
  await expect(page.getByTestId('house-library-panel')).toBeVisible();
  const initialSessionId = await readWorkerSessionId(page);

  await openHouseLibraryRouteManualDrawer(page);
  await page.getByTestId('house-library-route-source-input').fill(scene.sourceHouse.houseId);
  await page.getByTestId('house-library-route-follow-button').click();
  await page.getByTestId('house-library-route-sync-button').click();
  await expect(page.getByTestId('house-library-route-feed-card')).toHaveCount(2);

  await page.getByTestId('house-library-route-feed-card').first().click();
  await expect(page.getByTestId('house-library-preview-title')).toContainText('Shellwide Smoke Pack 1');
  await saveHouseLibrarySafety(page, { safetyState: 'reported_here' });
  await expect(page.getByTestId('house-library-safety-card')).toContainText('Reported here');
  await page.getByTestId('house-library-safety-card').first().click();
  await expect(page.getByTestId('house-library-preview-title')).toContainText('Shellwide Smoke Pack 1');

  await page.getByTestId('house-library-incoming-relay-card').click();
  await openHouseLibraryIncomingRelayDrawer(page);
  await expect(page.getByTestId('house-library-incoming-relay-preview')).toContainText('Shellwide Smoke Relay Pack');
  await page.getByTestId('house-library-import-relay-button').click();
  await expect(page.getByTestId('house-library-local-card')).toHaveCount(1);

  await page.getByTestId('house-library-incoming-satchel-card').click();
  await openHouseLibraryIncomingSatchelDrawer(page);
  await expect(page.getByTestId('house-library-incoming-satchel-preview')).toContainText('Shellwide Smoke Relay Pack');
  await page.getByTestId('house-library-import-satchel-button').click();
  await expect(page.getByTestId('house-library-action-status')).toContainText('Imported Satchel Shellwide Smoke Relay Pack from Satchel Desk.');

  await page.getByTestId('house-library-local-card').filter({ hasText: 'Shellwide Smoke Relay Note' }).first().click();
  await openHouseLibraryDetailDrawer(page);
  await expect(page.getByTestId('house-library-detail')).toContainText('Relayed from');

  expect(await page.evaluate(() => window.location.pathname)).toBe('/app');
  expect(await readWorkerSessionId(page)).toBe(initialSessionId);
});
