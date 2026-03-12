const { test, expect, request: playwrightRequest } = require('@playwright/test');

const { saveHouseLibrarySafety, openHouseLibraryRouteManualDrawer } = require('./helpers/house_library_public_stacks');
const { seedHouseLibraryShellwideScene } = require('./helpers/house_library_shellwide');
const { resetPortalWebState } = require('./helpers/portal_web');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M42.2: Route, Safety, Relay, and Satchel desks render as shell-wide cards', async ({ page, request }) => {
  await page.addInitScript(() => {
    localStorage.setItem('agentTown:panel:minimized', '0');
  });
  const scene = await seedHouseLibraryShellwideScene(page, request, playwrightRequest, {
    titlePrefix: 'Shellwide Desk',
  });

  await page.getByTestId('house-open-library').click();
  await expect(page.getByTestId('house-library-panel')).toBeVisible();
  await openHouseLibraryRouteManualDrawer(page);

  await page.getByTestId('house-library-route-source-input').fill(scene.sourceHouse.houseId);
  await page.getByTestId('house-library-route-follow-button').click();
  await page.getByTestId('house-library-route-sync-button').click();

  await expect(page.getByTestId('house-library-route-card')).toHaveCount(1);
  await expect(page.getByTestId('house-library-route-feed-card')).toHaveCount(2);
  await expect(page.getByTestId('house-library-incoming-relay-card')).toHaveCount(1);
  await expect(page.getByTestId('house-library-incoming-satchel-card')).toHaveCount(1);
  await expect(page.getByTestId('house-library-route-card').first()).toHaveClass(/house-library-card/);
  await expect(page.getByTestId('house-library-route-feed-card').first()).toHaveClass(/house-library-card/);
  await expect(page.getByTestId('house-library-incoming-relay-card').first()).toHaveClass(/house-library-card/);
  await expect(page.getByTestId('house-library-incoming-satchel-card').first()).toHaveClass(/house-library-card/);

  await page.getByTestId('house-library-route-feed-card').first().click();
  await saveHouseLibrarySafety(page, { safetyState: 'hidden_here' });
  await expect(page.getByTestId('house-library-safety-card')).toHaveCount(1);
  await expect(page.getByTestId('house-library-safety-card').first()).toHaveClass(/house-library-card/);
});
