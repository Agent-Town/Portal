const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  readWorkerSessionId,
  seedPlatformConfigVersion,
} = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M38.0: House Library exposes icon-first anchors without leaving /app or resetting the worker session', async ({ page, request }) => {
  const seededHouse = await seedRecoverableTokenHouse(request);
  const seededConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_icon_first_harness_01',
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

  const initialSessionId = await readWorkerSessionId(page);
  await page.getByTestId('house-open-library').click();
  await expect(page.getByTestId('house-library-panel')).toBeVisible();

  await expect(page.getByTestId('house-library-storefront-chips')).toBeVisible();
  await expect(page.getByTestId('house-library-public-stacks-results')).toBeVisible();
  await expect(page.getByTestId('house-library-preview-hero')).toBeVisible();
  await expect(page.getByTestId('house-library-preview-action-dock')).toBeHidden();
  await expect(page.getByTestId('house-library-preview-details')).toBeVisible();
  await expect(page.getByTestId('house-library-public-stacks-family')).toBeHidden();
  await expect(page.getByTestId('house-library-public-stacks-trust')).toBeHidden();

  expect(await page.evaluate(() => window.location.pathname)).toBe('/app');
  expect(await readWorkerSessionId(page)).toBe(initialSessionId);
});
