const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const {
  openHouseLibraryPreviewDetails,
  openHouseLibraryPublicStackPreview,
} = require('./helpers/house_library_public_stacks');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  seedPlatformConfigVersion,
} = require('./helpers/unified_platform');

test.use({
  viewport: { width: 390, height: 844 },
});

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M38.4: mobile Library keeps the action dock visible and reveals technical detail only inside drawers', async ({ page, request }) => {
  const seededHouse = await seedRecoverableTokenHouse(request);
  const seededConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_icon_first_mobile_01',
    houseId: seededHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  });
  expect(seededConfig?.ok).toBe(true);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const attached = await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  await openHouseLibraryPublicStackPreview(page, {
    title: 'Atlas Scout',
    query: 'atlas',
    family: 'skill',
  });

  const noHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  expect(noHorizontalOverflow).toBe(true);
  await expect(page.getByTestId('house-library-preview-action-dock')).toBeInViewport();
  await expect(page.getByTestId('house-library-registry-preview')).toBeHidden();

  await openHouseLibraryPreviewDetails(page);
  await expect(page.getByTestId('house-library-registry-preview')).toBeVisible();
  await expect(page.getByTestId('house-library-registry-preview')).toContainText('Atlas Scout');

  await page.getByTestId('house-library-preview-details-toggle').click();
  await expect(page.getByTestId('house-library-registry-preview')).toBeHidden();
});
