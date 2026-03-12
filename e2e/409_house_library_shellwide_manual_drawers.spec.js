const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  seedPlatformConfigVersion,
} = require('./helpers/unified_platform');
const {
  openHouseLibraryManualImportDrawer,
  openHouseLibraryManualPublishDrawer,
  openHouseLibraryRouteManualDrawer,
  openHouseLibrarySatchelPublishDrawer,
} = require('./helpers/house_library_public_stacks');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M42.1: shell-wide manual controls stay hidden by default and open through drawers', async ({ page, request }) => {
  const seededHouse = await seedRecoverableTokenHouse(request);
  expect((await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_shellwide_drawers_01',
    houseId: seededHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  }))?.ok).toBe(true);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const attached = await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  await page.getByTestId('house-open-library').click();
  await expect(page.getByTestId('house-library-panel')).toBeVisible();

  await expect(page.getByTestId('house-library-route-source-input')).not.toBeVisible();
  await expect(page.getByTestId('house-library-public-stack-approval-input')).not.toBeVisible();
  await expect(page.getByTestId('house-library-import-input')).not.toBeVisible();
  await expect(page.getByTestId('house-library-approval-input')).not.toBeVisible();

  await openHouseLibraryRouteManualDrawer(page);
  await expect(page.getByTestId('house-library-route-source-input')).toBeVisible();

  await openHouseLibrarySatchelPublishDrawer(page);
  await expect(page.getByTestId('house-library-public-stack-approval-input')).toBeVisible();

  await openHouseLibraryManualImportDrawer(page);
  await expect(page.getByTestId('house-library-import-input')).toBeVisible();

  await openHouseLibraryManualPublishDrawer(page);
  await expect(page.getByTestId('house-library-approval-input')).toBeVisible();
});
