const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  getPlatformFixture,
  getPlatformInspector,
  getPlatformStats,
  readWorkerSessionId,
  seedPlatformConfigVersion,
} = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M30.1: House Library saves a direct local note from the Librarian Desk without leaving /app', async ({ page, request }) => {
  const fixture = await getPlatformFixture(request, 'library_authoring_seed');
  expect(fixture?.ok).toBe(true);

  const seededHouse = await seedRecoverableTokenHouse(request);
  const seededConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_note_authoring_01',
    houseId: seededHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  });
  expect(seededConfig.ok).toBe(true);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const attached = await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const initialStats = await getPlatformStats(request);
  const initialSessionId = await readWorkerSessionId(page);

  await page.getByTestId('house-open-library').click();
  await expect(page.getByTestId('house-library-panel')).toBeVisible();
  await expect(page.getByTestId('house-library-copy')).toHaveText('Choose what the agent may use in this chat.');
  await expect(page.getByTestId('house-library-note-composer')).toBeVisible();
  await expect(page.getByLabel(String(fixture?.fixture?.composer?.titleLabel || 'Title'))).toBeVisible();
  await expect(page.getByLabel(String(fixture?.fixture?.composer?.bodyLabel || 'What should the agent remember?'))).toBeVisible();

  await page.getByTestId('house-library-note-title').fill('Portal Memory Rules');
  await page.getByTestId('house-library-note-body').fill('Keep Library notes private by default and only bring them into chat on purpose.');
  await page.getByTestId('house-library-save-note').click();

  await expect(page.getByTestId('house-library-action-status')).toContainText('Saved Portal Memory Rules to your Library.');
  await expect(page.locator('#houseLibraryList button').first()).toContainText('Portal Memory Rules');
  await expect(page.getByTestId('house-library-detail')).toContainText('user_note');
  await expect(page.getByTestId('house-library-composer-status')).toHaveText('Writing a new local note.');

  expect(await page.evaluate(() => window.location.pathname)).toBe('/app');
  expect(await readWorkerSessionId(page)).toBe(initialSessionId);

  const finalStats = await getPlatformStats(request);
  expect(Number(finalStats?.stats?.counts?.library_items || 0)).toBe(Number(initialStats?.stats?.counts?.library_items || 0) + 1);
  expect(Number(finalStats?.stats?.counts?.library_item_revisions || 0)).toBe(Number(initialStats?.stats?.counts?.library_item_revisions || 0) + 1);
  expect(Number(finalStats?.stats?.counts?.library_links || 0)).toBe(Number(initialStats?.stats?.counts?.library_links || 0));

  const libraryInspector = await getPlatformInspector(request, 'library');
  expect(libraryInspector.status).toBe(200);
  expect(libraryInspector.json?.data?.items?.[0]).toMatchObject({
    title: 'Portal Memory Rules',
    sourceKind: String(fixture?.fixture?.expectedSourceKind || 'user_note'),
  });

  const revisionsInspector = await getPlatformInspector(request, 'revisions');
  expect(revisionsInspector.status).toBe(200);
  expect(Array.isArray(revisionsInspector.json?.data?.revisions)).toBe(true);
  expect(revisionsInspector.json?.data?.revisions?.[0]).toMatchObject({
    title: 'Portal Memory Rules',
  });
  expect(String(revisionsInspector.json?.data?.revisions?.[0]?.contentHash || '')).toMatch(/^sha256:/);
});
