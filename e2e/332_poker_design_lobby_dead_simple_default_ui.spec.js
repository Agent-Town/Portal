const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const {
  closeDesignPage,
  openDesignLobby,
} = require('./helpers/poker_design');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('D6 dead-simple default: lobby keeps support detail behind explicit drawers', async ({ browser, request }) => {
  const resources = await openDesignLobby(browser, request, {
    viewport: { width: 390, height: 844 },
  });
  const { page } = resources;

  await expect(page.getByRole('heading', { name: 'Quick Seat' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Ready To Play' })).toBeVisible();

  const policyDrawer = page.locator('[data-poker-section="poker-policy"] details[data-poker-detail-level="advanced"]');
  await expect(policyDrawer).not.toHaveAttribute('open', '');
  await expect(page.locator('#pokerPlayPolicyForm')).toBeHidden();

  const liveTableDrawer = page.locator('[data-poker-section="live-tables"] details[data-poker-detail-level="advanced"]').first();
  await expect(liveTableDrawer).not.toHaveAttribute('open', '');
  await expect(page.getByRole('link', { name: 'History' })).toHaveCount(0);

  await closeDesignPage(resources);
});
