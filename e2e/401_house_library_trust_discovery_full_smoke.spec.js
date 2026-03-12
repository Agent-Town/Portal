const { test, expect, request: playwrightRequest } = require('@playwright/test');

const { seedHouseLibraryDiscoveryScene } = require('./helpers/house_library_discovery');
const {
  openHouseLibraryPreviewDetails,
} = require('./helpers/house_library_public_stacks');
const { resetPortalWebState } = require('./helpers/portal_web');
const { readWorkerSessionId } = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M40.5: trust-aware discovery stays same-shell from attested lane through ready and imported lanes', async ({ page, request }) => {
  await page.addInitScript(() => {
    localStorage.setItem('agentTown:panel:minimized', '0');
  });

  await seedHouseLibraryDiscoveryScene(page, request, playwrightRequest, {
    titlePrefix: 'Discovery Smoke',
  });

  await page.getByTestId('house-open-library').click();
  await expect(page.getByTestId('house-library-panel')).toBeVisible();
  const initialSessionId = await readWorkerSessionId(page);

  await page.getByTestId('house-library-public-stacks-query').fill('Discovery Smoke');
  await page.getByTestId('house-library-storefront-chip-satchels').click();
  await page.getByTestId('house-library-public-stacks-search').click();

  await page.getByTestId('house-library-storefront-chip-attested').click();
  await expect(page.getByTestId('house-library-storefront-card')).toHaveCount(1);
  await expect(page.getByTestId('house-library-storefront-card').first()).toContainText('Discovery Smoke Attested Pack');
  await page.getByTestId('house-library-storefront-preview').first().click();
  await openHouseLibraryPreviewDetails(page);
  await expect(page.getByTestId('house-library-registry-preview')).toContainText('Discovery: Attested by other Houses.');

  await page.getByTestId('house-library-guided-verify-button').click();
  await expect(page.getByTestId('house-library-action-status')).toContainText('Verified Public Stack Discovery Smoke Attested Pack.');

  await page.getByTestId('house-library-storefront-chip-ready').click();
  await expect(page.getByTestId('house-library-storefront-card')).toHaveCount(2);
  await expect(page.getByTestId('house-library-public-stacks-results')).toContainText('Discovery Smoke Attested Pack');

  await page.getByTestId('house-library-storefront-card').filter({ hasText: 'Discovery Smoke Attested Pack' }).first().getByTestId('house-library-storefront-preview').click();
  await page.getByTestId('house-library-guided-import-button').click();
  await expect(page.getByTestId('house-library-action-status')).toContainText('Imported Public Stack Discovery Smoke Attested Pack.');

  await page.getByTestId('house-library-storefront-chip-imported').click();
  await expect(page.getByTestId('house-library-public-stacks-results')).toContainText('Discovery Smoke Attested Pack');
  await page.getByTestId('house-library-storefront-card').filter({ hasText: 'Discovery Smoke Attested Pack' }).first().getByTestId('house-library-storefront-preview').click();
  await openHouseLibraryPreviewDetails(page);
  await expect(page.getByTestId('house-library-registry-preview')).toContainText('Discovery: Already in your Library as Satchel');
  expect(await page.evaluate(() => window.location.pathname)).toBe('/app');
  expect(await readWorkerSessionId(page)).toBe(initialSessionId);
});
