const { test, expect, request: playwrightRequest } = require('@playwright/test');

const {
  openHouseLibraryDetailDrawer,
  openHouseLibraryIncomingRelayDrawer,
  openHouseLibraryIncomingSatchelDrawer,
  openHouseLibraryRevisionsDrawer,
  openHouseLibraryRouteManualDrawer,
} = require('./helpers/house_library_public_stacks');
const { seedHouseLibraryShellwideScene } = require('./helpers/house_library_shellwide');
const { resetPortalWebState } = require('./helpers/portal_web');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M42.4: detail and received-artifact text stays behind drawers while primary actions remain visible', async ({ page, request }) => {
  await page.addInitScript(() => {
    localStorage.setItem('agentTown:panel:minimized', '0');
  });
  const scene = await seedHouseLibraryShellwideScene(page, request, playwrightRequest, {
    titlePrefix: 'Shellwide Detail',
  });

  await page.getByTestId('house-open-library').click();
  await expect(page.getByTestId('house-library-panel')).toBeVisible();
  await openHouseLibraryRouteManualDrawer(page);
  await page.getByTestId('house-library-route-source-input').fill(scene.sourceHouse.houseId);
  await page.getByTestId('house-library-route-follow-button').click();
  await page.getByTestId('house-library-route-sync-button').click();

  await expect(page.getByTestId('house-library-detail-drawer')).not.toHaveAttribute('open', '');
  await expect(page.getByTestId('house-library-revisions-drawer')).not.toHaveAttribute('open', '');
  await expect(page.getByTestId('house-library-incoming-relay-drawer')).not.toHaveAttribute('open', '');
  await expect(page.getByTestId('house-library-incoming-satchel-drawer')).not.toHaveAttribute('open', '');

  await page.getByTestId('house-library-incoming-relay-card').click();
  await openHouseLibraryIncomingRelayDrawer(page);
  await expect(page.getByTestId('house-library-incoming-relay-preview')).toContainText(scene.sourceHouse.houseId);

  await page.getByTestId('house-library-import-relay-button').click();
  await expect(page.getByTestId('house-library-local-card')).toHaveCount(1);
  await page.getByTestId('house-library-local-card').first().click();
  await openHouseLibraryDetailDrawer(page);
  await expect(page.getByTestId('house-library-detail')).toContainText('Imported from Relay Desk');
  await openHouseLibraryRevisionsDrawer(page);
  await expect(page.getByTestId('house-library-revisions')).toContainText('Revision 1');

  await page.getByTestId('house-library-incoming-satchel-card').click();
  await openHouseLibraryIncomingSatchelDrawer(page);
  await expect(page.getByTestId('house-library-incoming-satchel-preview')).toContainText(scene.sourceHouse.houseId);
});
