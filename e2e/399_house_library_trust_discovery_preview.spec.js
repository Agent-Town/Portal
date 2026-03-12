const { test, expect, request: playwrightRequest } = require('@playwright/test');

const { seedHouseLibraryDiscoveryScene } = require('./helpers/house_library_discovery');
const {
  openHouseLibraryPreviewDetails,
  openHouseLibraryPublicStackPreview,
} = require('./helpers/house_library_public_stacks');
const { resetPortalWebState } = require('./helpers/portal_web');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M40.3: preview projects the same discovery lane and reason used by the search cards', async ({ page, request }) => {
  await page.addInitScript(() => {
    localStorage.setItem('agentTown:panel:minimized', '0');
  });

  await seedHouseLibraryDiscoveryScene(page, request, playwrightRequest, {
    titlePrefix: 'Discovery Preview',
  });

  await page.getByTestId('house-open-library').click();
  await expect(page.getByTestId('house-library-panel')).toBeVisible();

  await openHouseLibraryPublicStackPreview(page, { title: 'Discovery Preview Attested Pack' });
  await openHouseLibraryPreviewDetails(page);
  await expect(page.getByTestId('house-library-registry-preview')).toContainText('Discovery: Attested by other Houses.');
  await expect(page.getByTestId('house-library-registry-preview')).toContainText('Attested elsewhere');

  await openHouseLibraryPublicStackPreview(page, { title: 'Discovery Preview Imported Pack' });
  await openHouseLibraryPreviewDetails(page);
  await expect(page.getByTestId('house-library-registry-preview')).toContainText('Discovery: Already in your Library as Satchel');
  await expect(page.getByTestId('house-library-registry-preview')).toContainText('Imported here');
});
