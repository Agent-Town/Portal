const { test, expect, request: playwrightRequest } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const {
  openHouseLibraryPublicStackPreview,
  saveHouseLibraryReview,
  seedPublishedHouseLibraryPublicStack,
} = require('./helpers/house_library_public_stacks');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  getPlatformStats,
  readWorkerSessionId,
  seedPlatformConfigVersion,
} = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M38.5: icon-first Library flow stays same-shell from chip search through one-tap trust, verify, and import', async ({ page, request }) => {
  const sourceHouse = await seedRecoverableTokenHouse(request);
  const baseURL = `http://127.0.0.1:${process.env.PW_PORT || '4174'}`;
  const targetApi = await playwrightRequest.newContext({ baseURL });
  const targetHouse = await seedRecoverableTokenHouse(targetApi);
  await targetApi.dispose();

  const sourceConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_icon_first_full_smoke_source_01',
    houseId: sourceHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  });
  const targetConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_icon_first_full_smoke_target_01',
    houseId: targetHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  });
  expect(sourceConfig?.ok).toBe(true);
  expect(targetConfig?.ok).toBe(true);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);

  let attached = await attachHouseToPageSession(page, {
    houseId: sourceHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  await seedPublishedHouseLibraryPublicStack(page, {
    idPrefix: 'house-library-icon-first-full-smoke',
    title: 'Journey Icon Flow Pack',
    scopeTitle: 'Journey Icon Flow Pack',
  });

  attached = await attachHouseToPageSession(page, {
    houseId: targetHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const initialSessionId = await readWorkerSessionId(page);
  const statsBefore = await getPlatformStats(request);
  expect(statsBefore?.ok).toBe(true);

  await openHouseLibraryPublicStackPreview(page, { title: 'Journey Icon Flow Pack' });
  await saveHouseLibraryReview(page, { reviewTier: 'review_later' });
  await expect(page.getByTestId('house-library-action-status')).toContainText('Saved local review Review later for Journey Icon Flow Pack.');

  await page.getByTestId('house-library-guided-verify-button').click();
  await expect(page.getByTestId('house-library-action-status')).toContainText('Verified Public Stack Journey Icon Flow Pack.');

  await page.getByTestId('house-library-guided-import-button').click();
  await expect(page.getByTestId('house-library-action-status')).toContainText('Imported Public Stack Journey Icon Flow Pack.');
  await expect(page.getByTestId('house-library-preview-status')).toContainText('Already shelved');

  expect(await page.evaluate(() => window.location.pathname)).toBe('/app');
  expect(await readWorkerSessionId(page)).toBe(initialSessionId);

  const statsAfter = await getPlatformStats(request);
  expect(Number(statsAfter?.stats?.counts?.library_public_stack_reviews || 0)).toBe(
    Number(statsBefore?.stats?.counts?.library_public_stack_reviews || 0) + 1
  );
  expect(Number(statsAfter?.stats?.counts?.library_public_stack_verifications || 0)).toBe(
    Number(statsBefore?.stats?.counts?.library_public_stack_verifications || 0) + 1
  );
  expect(Number(statsAfter?.stats?.counts?.library_items || 0)).toBeGreaterThan(Number(statsBefore?.stats?.counts?.library_items || 0));
});
