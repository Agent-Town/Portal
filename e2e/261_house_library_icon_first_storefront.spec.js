const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  getPlatformFixture,
  seedPlatformConfigVersion,
} = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M38.1: Public Stacks storefront uses chip filters and visual result cards by default', async ({ page, request }) => {
  const browseFixture = await getPlatformFixture(request, 'library_registry_browse_seed');
  expect(browseFixture?.ok).toBe(true);
  const seededBrowse = browseFixture?.fixture?.browse || {};

  const seededHouse = await seedRecoverableTokenHouse(request);
  const seededConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_icon_first_storefront_01',
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

  await page.getByTestId('house-open-library').click();
  await expect(page.getByTestId('house-library-panel')).toBeVisible();
  await expect(page.getByTestId('house-library-public-stacks-family')).toBeHidden();
  await expect(page.getByTestId('house-library-public-stacks-trust')).toBeHidden();

  await expect(page.getByTestId('house-library-storefront-chip-all')).toBeVisible();
  await expect(page.getByTestId('house-library-storefront-chip-trusted')).toBeVisible();
  await expect(page.getByTestId('house-library-storefront-chip-later')).toBeVisible();
  await expect(page.getByTestId('house-library-storefront-chip-blocked')).toBeVisible();
  await expect(page.getByTestId('house-library-storefront-chip-sealed')).toBeVisible();

  await page.getByTestId('house-library-public-stacks-query').fill(String(seededBrowse.query || 'atlas'));
  await page.getByTestId('house-library-storefront-chip-skills').click();
  await page.getByTestId('house-library-public-stacks-search').click();

  await expect(page.getByTestId('house-library-storefront-card')).toHaveCount(Number(seededBrowse.expectedResultCount || 0));
  await expect(page.getByTestId('house-library-storefront-chip-skills')).toHaveClass(/primary/);
  await expect(page.getByTestId('house-library-storefront-family-icon').first()).toContainText('[star]');
  await expect(page.getByTestId('house-library-storefront-trust-cluster').first()).toHaveCount(1);

  await page.getByTestId('house-library-storefront-chip-all').click();
  await expect(page.getByTestId('house-library-storefront-chip-all')).toHaveClass(/primary/);
});
