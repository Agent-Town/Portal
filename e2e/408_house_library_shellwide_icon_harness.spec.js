const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  seedPlatformConfigVersion,
} = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M42.0: House Library exposes shell-wide icon-first anchors without changing the data model', async ({ page, request }) => {
  const seededHouse = await seedRecoverableTokenHouse(request);
  expect((await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_shellwide_harness_01',
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

  await expect(page.getByTestId('house-library-route-manual-drawer')).toBeVisible();
  await expect(page.getByTestId('house-library-satchel-publish-drawer')).toBeVisible();
  await expect(page.getByTestId('house-library-manual-import-drawer')).toBeVisible();
  await expect(page.getByTestId('house-library-manual-publish-drawer')).toBeVisible();
  await expect(page.getByTestId('house-library-detail-drawer')).toBeVisible();
  await expect(page.getByTestId('house-library-revisions-drawer')).toBeVisible();
  await expect(page.getByTestId('house-library-incoming-relay-drawer')).toBeVisible();
  await expect(page.getByTestId('house-library-incoming-satchel-drawer')).toBeVisible();
});
