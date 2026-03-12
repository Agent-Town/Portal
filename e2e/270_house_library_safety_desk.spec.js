const { test, expect, request: playwrightRequest } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  readWorkerSessionId,
  seedPlatformConfigVersion,
} = require('./helpers/unified_platform');
const {
  openHouseLibraryPublicStackPreview,
  saveHouseLibrarySafety,
  seedPublishedHouseLibraryPublicStack,
} = require('./helpers/house_library_public_stacks');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M39.4: Safety Desk lists hidden and reported stacks and reopens them in the same shell', async ({ page, request }) => {
  await page.addInitScript(() => {
    localStorage.setItem('agentTown:panel:minimized', '0');
  });

  const sourceHouse = await seedRecoverableTokenHouse(request);
  const baseURL = `http://127.0.0.1:${process.env.PW_PORT || '4174'}`;
  const targetApi = await playwrightRequest.newContext({ baseURL });
  const targetHouse = await seedRecoverableTokenHouse(targetApi);
  await targetApi.dispose();

  expect((await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_safety_desk_source_01',
    houseId: sourceHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  }))?.ok).toBe(true);
  expect((await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_safety_desk_target_01',
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

  const seeded = await seedPublishedHouseLibraryPublicStack(page, {
    idPrefix: 'house-library-safety-desk',
    title: 'Safety Desk Pack',
  });

  attached = await attachHouseToPageSession(page, {
    houseId: targetHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  await page.getByTestId('house-open-library').click();
  await expect(page.getByTestId('house-library-panel')).toBeVisible();
  const initialSessionId = await readWorkerSessionId(page);
  await openHouseLibraryPublicStackPreview(page, { title: 'Safety Desk Pack' });

  await saveHouseLibrarySafety(page, { safetyState: 'reported_here' });
  await expect(page.getByTestId('house-library-action-status')).toContainText('Saved Reported here for Safety Desk Pack.');

  await page.getByTestId('house-library-storefront-chip-all').click();
  await expect(page.getByTestId('house-library-safety-desk')).toContainText('Safety Desk Pack');
  await expect(page.getByTestId('house-library-safety-desk')).toContainText('Reported here');

  await page.getByRole('button', { name: /Reported here · Safety Desk Pack/ }).click();
  await expect(page.getByTestId('house-library-preview-title')).toContainText('Safety Desk Pack');
  await expect(page.getByTestId('house-library-preview-status')).toContainText('Reported here');
  expect(await page.evaluate(() => window.location.pathname)).toBe('/app');
  expect(await readWorkerSessionId(page)).toBe(initialSessionId);
});
