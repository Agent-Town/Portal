const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  getPlatformFixture,
  getPlatformInspector,
  readWorkerSessionId,
  seedPlatformConfigVersion,
} = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M30.6: House Library browses and previews Public Stacks without leaving /app', async ({ page, request }) => {
  const browseFixture = await getPlatformFixture(request, 'library_registry_browse_seed');
  expect(browseFixture?.ok).toBe(true);
  const seededBrowse = browseFixture?.fixture?.browse || {};

  const seededHouse = await seedRecoverableTokenHouse(request);
  const seededConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_public_stacks_01',
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
  await expect(page.getByTestId('house-library-public-stacks-empty')).toContainText('Search Public Stacks');

  await page.getByTestId('house-library-public-stacks-query').fill(String(seededBrowse.query || 'atlas'));
  await page.getByTestId('house-library-public-stacks-family').selectOption(String(seededBrowse.family || 'skill'));
  await page.getByTestId('house-library-public-stacks-search').click();

  await expect(page.locator('#houseLibraryPublicStacksResults button')).toHaveCount(Number(seededBrowse.expectedResultCount || 0));
  const searchInspector = await getPlatformInspector(request, 'registry-preview');
  expect(searchInspector.status).toBe(200);
  expect(searchInspector.json?.data).toMatchObject({
    query: String(seededBrowse.query || 'atlas'),
    family: String(seededBrowse.family || 'skill'),
    resultCount: Number(seededBrowse.expectedResultCount || 0),
    selectedRegistryId: null,
    preview: null,
  });

  await page.locator(`#houseLibraryPublicStacksResults button[data-registry-id="${String(seededBrowse.expectedFirstRegistryId || 'reg_atlas_skill_01')}"]`).click();

  await expect(page.getByTestId('house-library-registry-preview')).toContainText(String(seededBrowse.expectedFirstRegistryId || 'reg_atlas_skill_01'));
  await expect(page.getByTestId('house-library-registry-preview')).toContainText('Skills');
  await expect(page.getByTestId('house-library-registry-preview')).toContainText('Provenance:');
  await expect(page.getByTestId('house-library-exchange-summary')).toContainText(String(seededBrowse.expectedFirstRegistryId || 'reg_atlas_skill_01'));
  await expect(page.getByTestId('house-library-guided-import-button')).toBeEnabled();

  expect(await page.evaluate(() => window.location.pathname)).toBe('/app');
  expect(await readWorkerSessionId(page)).toBe(initialSessionId);

  const previewInspector = await getPlatformInspector(request, 'registry-preview');
  expect(previewInspector.status).toBe(200);
  expect(previewInspector.json?.data?.selectedRegistryId).toBe(String(seededBrowse.expectedFirstRegistryId || 'reg_atlas_skill_01'));
  expect(String(previewInspector.json?.data?.preview?.registryId || '')).toBe(String(seededBrowse.expectedFirstRegistryId || 'reg_atlas_skill_01'));
  expect(String(previewInspector.json?.data?.preview?.family || '')).toBe('skill');
  expect(String(previewInspector.json?.data?.preview?.provenance?.summary || '')).not.toBe('');
});
