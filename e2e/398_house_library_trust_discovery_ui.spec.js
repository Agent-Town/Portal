const { test, expect, request: playwrightRequest } = require('@playwright/test');

const { seedHouseLibraryDiscoveryScene } = require('./helpers/house_library_discovery');
const {
  openHouseLibraryStorefrontDetails,
  setHouseLibraryDiscoveryFilter,
} = require('./helpers/house_library_public_stacks');
const { resetPortalWebState } = require('./helpers/portal_web');
const { readWorkerSessionId } = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M40.2: House Library discovery chips and filters keep Public Stack search in the same shell', async ({ page, request }) => {
  await page.addInitScript(() => {
    localStorage.setItem('agentTown:panel:minimized', '0');
  });

  await seedHouseLibraryDiscoveryScene(page, request, playwrightRequest, {
    titlePrefix: 'Discovery UI',
  });

  await page.getByTestId('house-open-library').click();
  await expect(page.getByTestId('house-library-panel')).toBeVisible();
  const initialSessionId = await readWorkerSessionId(page);
  await page.getByTestId('house-library-public-stacks-query').fill('Discovery UI');
  await page.getByTestId('house-library-storefront-chip-satchels').click();
  await page.getByTestId('house-library-public-stacks-search').click();

  await expect(page.getByTestId('house-library-storefront-chip-ready')).toContainText('1');
  await expect(page.getByTestId('house-library-storefront-chip-check')).toContainText('1');
  await expect(page.getByTestId('house-library-storefront-chip-attested')).toContainText('1');
  await expect(page.getByTestId('house-library-storefront-chip-imported')).toContainText('1');

  await page.getByTestId('house-library-storefront-chip-ready').click();
  await expect(page.getByTestId('house-library-storefront-card')).toHaveCount(1);
  await expect(page.getByTestId('house-library-storefront-card').first()).toContainText('Discovery UI Ready Pack');

  await page.getByTestId('house-library-storefront-chip-check').click();
  await expect(page.getByTestId('house-library-storefront-card')).toHaveCount(1);
  await expect(page.getByTestId('house-library-storefront-card').first()).toContainText('Discovery UI Check Pack');

  await page.getByTestId('house-library-storefront-chip-attested').click();
  await expect(page.getByTestId('house-library-storefront-card')).toHaveCount(1);
  await expect(page.getByTestId('house-library-storefront-card').first()).toContainText('Discovery UI Attested Pack');

  await page.getByTestId('house-library-storefront-chip-imported').click();
  await expect(page.getByTestId('house-library-storefront-card')).toHaveCount(1);
  await expect(page.getByTestId('house-library-storefront-card').first()).toContainText('Discovery UI Imported Pack');

  await openHouseLibraryStorefrontDetails(page);
  await setHouseLibraryDiscoveryFilter(page, 'attested_elsewhere');
  await page.getByTestId('house-library-public-stacks-search').click();
  await expect(page.getByTestId('house-library-storefront-card')).toHaveCount(1);
  await expect(page.getByTestId('house-library-storefront-card').first()).toContainText('Discovery UI Attested Pack');

  expect(await page.evaluate(() => window.location.pathname)).toBe('/app');
  expect(await readWorkerSessionId(page)).toBe(initialSessionId);
});
