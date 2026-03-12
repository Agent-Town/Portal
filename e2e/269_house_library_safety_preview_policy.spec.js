const { test, expect, request: playwrightRequest } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  seedPlatformConfigVersion,
} = require('./helpers/unified_platform');
const {
  openHouseLibraryPublicStackPreview,
  openHouseLibraryPreviewDetails,
  saveHouseLibrarySafety,
  seedPublishedHouseLibraryPublicStack,
} = require('./helpers/house_library_public_stacks');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M39.3: preview policy surfaces hidden and reported states clearly and restores import only after restore', async ({ page, request }) => {
  await page.addInitScript(() => {
    localStorage.setItem('agentTown:panel:minimized', '0');
  });

  const sourceHouse = await seedRecoverableTokenHouse(request);
  const baseURL = `http://127.0.0.1:${process.env.PW_PORT || '4174'}`;
  const targetApi = await playwrightRequest.newContext({ baseURL });
  const targetHouse = await seedRecoverableTokenHouse(targetApi);
  await targetApi.dispose();

  expect((await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_safety_preview_source_01',
    houseId: sourceHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  }))?.ok).toBe(true);
  expect((await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_safety_preview_target_01',
    houseId: targetHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  }))?.ok).toBe(true);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);

  let attached = await attachHouseToPageSession(page, {
    houseId: sourceHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  await seedPublishedHouseLibraryPublicStack(page, {
    idPrefix: 'house-library-safety-preview',
    title: 'Safety Preview Pack',
  });

  attached = await attachHouseToPageSession(page, {
    houseId: targetHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  await page.getByTestId('house-open-library').click();
  await expect(page.getByTestId('house-library-panel')).toBeVisible();
  await openHouseLibraryPublicStackPreview(page, { title: 'Safety Preview Pack' });

  await saveHouseLibrarySafety(page, { safetyState: 'hidden_here' });
  await expect(page.getByTestId('house-library-action-status')).toContainText('Saved Hidden here for Safety Preview Pack.');
  await expect(page.getByTestId('house-library-preview-status')).toContainText('Hidden here');
  await openHouseLibraryPreviewDetails(page);
  await expect(page.getByTestId('house-library-registry-preview')).toContainText('Safety: Hidden in this House.');
  await expect(page.getByTestId('house-library-guided-import-button')).toBeHidden();

  await saveHouseLibrarySafety(page, { safetyState: 'reported_here' });
  await expect(page.getByTestId('house-library-action-status')).toContainText('Saved Reported here for Safety Preview Pack.');
  await expect(page.getByTestId('house-library-preview-status')).toContainText('Reported here');
  await openHouseLibraryPreviewDetails(page);
  await expect(page.getByTestId('house-library-registry-preview')).toContainText('Safety: Reported for later review in this House.');
  await expect(page.getByTestId('house-library-guided-import-button')).toBeHidden();

  await saveHouseLibrarySafety(page, { safetyState: 'visible_here' });
  await expect(page.getByTestId('house-library-action-status')).toContainText('Saved Visible here for Safety Preview Pack.');
  await expect(page.getByTestId('house-library-preview-status')).not.toContainText('Hidden here');
  await expect(page.getByTestId('house-library-preview-status')).not.toContainText('Reported here');
  await expect(page.getByTestId('house-library-guided-import-button')).toBeVisible();
  await expect(page.getByTestId('house-library-guided-import-button')).toBeEnabled();
});
