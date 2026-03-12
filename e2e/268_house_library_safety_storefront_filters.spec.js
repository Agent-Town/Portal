const { test, expect, request: playwrightRequest } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  callPageJson,
  seedPlatformConfigVersion,
} = require('./helpers/unified_platform');
const {
  seedPublishedHouseLibraryPublicStack,
  openHouseLibraryStorefrontDetails,
  setHouseLibrarySafetyFilter,
} = require('./helpers/house_library_public_stacks');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M39.2: default storefront hides hidden and reported stacks while safety filters reopen the local queue deterministically', async ({ page, request }) => {
  await page.addInitScript(() => {
    localStorage.setItem('agentTown:panel:minimized', '0');
  });

  const sourceHouse = await seedRecoverableTokenHouse(request);
  const baseURL = `http://127.0.0.1:${process.env.PW_PORT || '4174'}`;
  const targetApi = await playwrightRequest.newContext({ baseURL });
  const targetHouse = await seedRecoverableTokenHouse(targetApi);
  await targetApi.dispose();

  expect((await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_safety_filters_source_01',
    houseId: sourceHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  }))?.ok).toBe(true);
  expect((await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_safety_filters_target_01',
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

  const visibleStack = await seedPublishedHouseLibraryPublicStack(page, {
    idPrefix: 'house-library-safety-visible',
    title: 'Visible Safety Filter Pack',
  });
  const hiddenStack = await seedPublishedHouseLibraryPublicStack(page, {
    idPrefix: 'house-library-safety-hidden',
    title: 'Hidden Safety Filter Pack',
  });
  const reportedStack = await seedPublishedHouseLibraryPublicStack(page, {
    idPrefix: 'house-library-safety-reported',
    title: 'Reported Safety Filter Pack',
  });

  attached = await attachHouseToPageSession(page, {
    houseId: targetHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  let response = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(hiddenStack.libraryPublicStackId)}/safety`, {
    method: 'POST',
    headers: { 'Idempotency-Key': 'house-library-safety-filters-hidden-001' },
    data: { safetyState: 'hidden_here' },
  });
  expect(response.status).toBe(201);
  response = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(reportedStack.libraryPublicStackId)}/safety`, {
    method: 'POST',
    headers: { 'Idempotency-Key': 'house-library-safety-filters-reported-001' },
    data: { safetyState: 'reported_here' },
  });
  expect(response.status).toBe(201);

  await page.getByTestId('house-open-library').click();
  await expect(page.getByTestId('house-library-panel')).toBeVisible();
  await page.getByTestId('house-library-public-stacks-query').fill('Safety Filter Pack');
  await page.getByTestId('house-library-storefront-chip-satchels').click();
  await page.getByTestId('house-library-public-stacks-search').click();

  const cards = page.getByTestId('house-library-storefront-card');
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText('Visible Safety Filter Pack');

  await openHouseLibraryStorefrontDetails(page);
  await setHouseLibrarySafetyFilter(page, 'hidden_here');
  await page.getByTestId('house-library-public-stacks-search').click();
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText('Hidden Safety Filter Pack');

  await setHouseLibrarySafetyFilter(page, 'reported_here');
  await page.getByTestId('house-library-public-stacks-search').click();
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText('Reported Safety Filter Pack');

  await setHouseLibrarySafetyFilter(page, 'all');
  await page.getByTestId('house-library-public-stacks-search').click();
  await expect(cards).toHaveCount(3);
  await expect(cards.nth(0)).toBeVisible();
  await expect(page.getByTestId('house-library-public-stacks-results')).toContainText('Visible Safety Filter Pack');
  await expect(page.getByTestId('house-library-public-stacks-results')).toContainText('Hidden Safety Filter Pack');
  await expect(page.getByTestId('house-library-public-stacks-results')).toContainText('Reported Safety Filter Pack');

  await setHouseLibrarySafetyFilter(page, 'visible_here');
  await page.getByTestId('house-library-public-stacks-search').click();
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText('Visible Safety Filter Pack');
});
