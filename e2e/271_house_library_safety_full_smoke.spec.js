const { test, expect, request: playwrightRequest } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  getPlatformStats,
  readWorkerSessionId,
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

test('M39.5: House Library safety flow stays same-shell from search through hide, Safety Desk restore, and import', async ({ page, request }) => {
  await page.addInitScript(() => {
    localStorage.setItem('agentTown:panel:minimized', '0');
  });

  const sourceHouse = await seedRecoverableTokenHouse(request);
  const baseURL = `http://127.0.0.1:${process.env.PW_PORT || '4174'}`;
  const targetApi = await playwrightRequest.newContext({ baseURL });
  const targetHouse = await seedRecoverableTokenHouse(targetApi);
  await targetApi.dispose();

  expect((await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_safety_full_source_01',
    houseId: sourceHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  }))?.ok).toBe(true);
  expect((await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_safety_full_target_01',
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
    idPrefix: 'house-library-safety-full',
    title: 'Safety Full Smoke Pack',
  });

  const statsBefore = await getPlatformStats(request);
  expect(statsBefore?.ok).toBe(true);

  attached = await attachHouseToPageSession(page, {
    houseId: targetHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  await page.getByTestId('house-open-library').click();
  await expect(page.getByTestId('house-library-panel')).toBeVisible();
  const initialSessionId = await readWorkerSessionId(page);

  await openHouseLibraryPublicStackPreview(page, { title: 'Safety Full Smoke Pack' });
  await saveHouseLibrarySafety(page, { safetyState: 'hidden_here' });
  await expect(page.getByTestId('house-library-action-status')).toContainText('Saved Hidden here for Safety Full Smoke Pack.');
  await expect(page.getByTestId('house-library-safety-desk')).toContainText('Safety Full Smoke Pack');
  expect(await page.evaluate(() => window.location.pathname)).toBe('/app');
  expect(await readWorkerSessionId(page)).toBe(initialSessionId);

  await page.getByTestId('house-library-public-stacks-query').fill('Safety Full Smoke Pack');
  await page.getByTestId('house-library-storefront-chip-satchels').click();
  await page.getByTestId('house-library-public-stacks-search').click();
  await expect(page.getByTestId('house-library-public-stacks-empty')).toContainText('Search Public Stacks without leaving this room.');
  await expect(page.getByTestId('house-library-storefront-card')).toHaveCount(0);

  await page.getByRole('button', { name: /Hidden here · Safety Full Smoke Pack/ }).click();
  await expect(page.getByTestId('house-library-preview-title')).toContainText('Safety Full Smoke Pack');
  await saveHouseLibrarySafety(page, { safetyState: 'visible_here' });
  await expect(page.getByTestId('house-library-action-status')).toContainText('Saved Visible here for Safety Full Smoke Pack.');
  await expect(page.getByTestId('house-library-safety-desk-empty')).toContainText('No hidden or reported Public Stacks in this House.');

  await page.getByTestId('house-library-public-stacks-search').click();
  await expect(page.getByTestId('house-library-storefront-card')).toHaveCount(1);
  await expect(page.getByTestId('house-library-storefront-card').first()).toContainText('Safety Full Smoke Pack');

  await page.getByTestId('house-library-storefront-preview').first().click();
  await expect(page.getByTestId('house-library-guided-import-button')).toBeVisible();
  await expect(page.getByTestId('house-library-guided-import-button')).toBeEnabled();
  await page.getByTestId('house-library-guided-import-button').click();
  await expect(page.getByTestId('house-library-action-status')).toContainText('Imported Public Stack Safety Full Smoke Pack.');
  await openHouseLibraryPreviewDetails(page);
  await expect(page.getByTestId('house-library-registry-preview')).toContainText('Already in your Library as Satchel Safety Full Smoke Pack.');
  expect(await page.evaluate(() => window.location.pathname)).toBe('/app');
  expect(await readWorkerSessionId(page)).toBe(initialSessionId);

  const statsAfter = await getPlatformStats(request);
  expect(Number(statsAfter?.stats?.counts?.library_public_stack_safety_records || 0)).toBe(
    Number(statsBefore?.stats?.counts?.library_public_stack_safety_records || 0) + 1
  );
  expect(Number(statsAfter?.stats?.counts?.library_public_stack_verifications || 0)).toBe(
    Number(statsBefore?.stats?.counts?.library_public_stack_verifications || 0) + 1
  );
  expect(Number(statsAfter?.stats?.counts?.library_public_stack_verification_members || 0)).toBe(
    Number(statsBefore?.stats?.counts?.library_public_stack_verification_members || 0) + 2
  );
  expect(Number(statsAfter?.stats?.counts?.library_items || 0)).toBe(
    Number(statsBefore?.stats?.counts?.library_items || 0) + 2
  );
  expect(Number(statsAfter?.stats?.counts?.scope_sets || 0)).toBe(
    Number(statsBefore?.stats?.counts?.scope_sets || 0) + 1
  );
  expect(Number(statsAfter?.stats?.counts?.scope_set_items || 0)).toBe(
    Number(statsBefore?.stats?.counts?.scope_set_items || 0) + 2
  );
});
