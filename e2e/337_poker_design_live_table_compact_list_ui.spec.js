const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const {
  closeDesignPage,
  openDesignLobby,
} = require('./helpers/poker_design');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('D6 dead-simple default: lobby renders live tables as compact rows with detail gated behind drawers', async ({ browser, request }) => {
  const resources = await openDesignLobby(browser, request, {
    viewport: { width: 390, height: 844 },
  });
  const { page } = resources;

  const firstEntry = page.locator('[data-poker-section="live-tables"] [data-poker-compact-kind="live-table"]').first();
  await expect(firstEntry).toBeVisible();
  await expect(firstEntry.locator('h3')).toBeVisible();
  await expect(firstEntry.locator('.pokerCompactFactItem').first()).toBeVisible();
  await expect(firstEntry.getByRole('link', { name: /Open Table|Return To Seat/ })).toBeVisible();

  const drawer = firstEntry.locator('details[data-poker-detail-level="advanced"]');
  await expect(drawer).not.toHaveAttribute('open', '');
  await expect(firstEntry.getByRole('link', { name: 'History' })).toHaveCount(0);

  await closeDesignPage(resources);
});
