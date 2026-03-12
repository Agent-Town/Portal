const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { openHouseLibraryPreviewDetails } = require('./helpers/house_library_public_stacks');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  getPlatformFixture,
  seedPlatformConfigVersion,
} = require('./helpers/unified_platform');

async function readActiveTestId(page) {
  return await page.evaluate(() => {
    const active = document.activeElement;
    return active ? String(active.getAttribute('data-testid') || '') : '';
  });
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M30.8: House Library keeps pixel-RPG copy plain and exposes a deterministic status region', async ({ page, request }) => {
  const copyFixture = await getPlatformFixture(request, 'library_copy_a11y_seed');
  expect(copyFixture?.ok).toBe(true);
  const requiredHeadings = Array.isArray(copyFixture?.fixture?.requiredHeadings) ? copyFixture.fixture.requiredHeadings : [];
  const bannedTerms = Array.isArray(copyFixture?.fixture?.bannedTerms) ? copyFixture.fixture.bannedTerms : [];

  const seededHouse = await seedRecoverableTokenHouse(request);
  const seededConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_copy_a11y_01',
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

  const headings = await page.getByTestId('house-library-panel').getByRole('heading').allInnerTexts();
  expect(headings).toEqual(expect.arrayContaining(requiredHeadings));

  const libraryText = (await page.getByTestId('house-library-panel').innerText()).toLowerCase();
  for (const bannedTerm of bannedTerms) {
    expect(libraryText.includes(String(bannedTerm || '').toLowerCase())).toBe(false);
  }

  await page.getByTestId('house-library-note-title').focus();
  expect(await readActiveTestId(page)).toBe('house-library-note-title');
  await page.keyboard.type('KeyboardPathNote');
  await page.keyboard.press('Tab');
  expect(await readActiveTestId(page)).toBe('house-library-note-body');
  await page.keyboard.type('Save this note to your Library by keyboard only.');
  await page.keyboard.press('Tab');
  expect(await readActiveTestId(page)).toBe('house-library-save-note');
  await page.keyboard.press('Enter');

  const statusRegion = page.getByTestId('house-library-action-status');
  await expect(statusRegion).toHaveAttribute('role', 'status');
  await expect(statusRegion).toHaveAttribute('aria-live', 'polite');
  await expect(statusRegion).toContainText('Saved KeyboardPathNote to your Library.');

  await openHouseLibraryPreviewDetails(page);
  await page.getByTestId('house-library-guided-publish-button').click();
  await expect(statusRegion).toContainText('LIBRARY_PUBLISH_APPROVAL_REQUIRED');
  await expect(statusRegion).not.toHaveText('');

  const actionButtons = page.locator('#houseLibraryActions button');
  const actionButtonCount = await actionButtons.count();
  expect(actionButtonCount).toBeGreaterThan(0);
  for (let index = 0; index < actionButtonCount; index += 1) {
    await expect(actionButtons.nth(index)).toHaveAccessibleName(/\S+/);
  }
});
