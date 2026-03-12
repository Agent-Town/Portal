const { test, expect, request: playwrightRequest } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const {
  openHouseLibraryPreviewDetails,
  openHouseLibraryPublicStackPreview,
  saveHouseLibraryReview,
  seedPublishedHouseLibraryPublicStack,
} = require('./helpers/house_library_public_stacks');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  callPageJson,
  seedPlatformConfigVersion,
} = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M38.3: preview uses one-tap trust and hides approval inputs until the drawer is opened', async ({ page, request }) => {
  const sourceHouse = await seedRecoverableTokenHouse(request);
  const baseURL = `http://127.0.0.1:${process.env.PW_PORT || '4174'}`;
  const targetApi = await playwrightRequest.newContext({ baseURL });
  const targetHouse = await seedRecoverableTokenHouse(targetApi);
  await targetApi.dispose();

  const sourceConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_icon_first_action_flow_source_01',
    houseId: sourceHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  });
  const targetConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_icon_first_action_flow_target_01',
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

  const { libraryPublicStackId } = await seedPublishedHouseLibraryPublicStack(page, {
    idPrefix: 'house-library-icon-first-action-flow',
    title: 'Journey Icon Action Pack',
    scopeTitle: 'Journey Icon Action Pack',
  });
  const sourceReview = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(libraryPublicStackId)}/reviews`, {
    method: 'POST',
    headers: { 'Idempotency-Key': 'house-library-icon-first-action-flow-source-review-001' },
    data: {
      reviewTier: 'trusted_here',
      note: 'Ship this pack.',
    },
  });
  expect(sourceReview.status).toBe(201);

  attached = await attachHouseToPageSession(page, {
    houseId: targetHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  await openHouseLibraryPublicStackPreview(page, { title: 'Journey Icon Action Pack' });
  await expect(page.getByTestId('house-library-preview-review-strip')).toBeVisible();
  await expect(page.getByTestId('house-library-guided-approval-input')).toBeHidden();

  await saveHouseLibraryReview(page, { reviewTier: 'review_later' });
  await expect(page.getByTestId('house-library-action-status')).toContainText('Saved local review Review later for Journey Icon Action Pack.');
  await expect(page.getByTestId('house-library-guided-verify-button')).toBeVisible();

  await saveHouseLibraryReview(page, { reviewTier: 'blocked_here' });
  await expect(page.getByTestId('house-library-action-status')).toContainText('Saved local review Blocked here for Journey Icon Action Pack.');
  await expect(page.getByTestId('house-library-guided-import-button')).toBeDisabled();

  await openHouseLibraryPreviewDetails(page);
  await expect(page.getByTestId('house-library-guided-approval-input')).toBeVisible();
});
