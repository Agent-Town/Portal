const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const {
  closeDesignPage,
  openDesignLobby,
} = require('./helpers/poker_design');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('D6 detail gate: lobby reveals policy and live-table detail only after explicit open', async ({ browser, request }) => {
  const resources = await openDesignLobby(browser, request);
  const { page } = resources;

  const policyDrawer = page.locator('[data-poker-section="poker-policy"] details[data-poker-detail-level="advanced"]');
  await policyDrawer.locator('summary').click();
  await expect(page.locator('#pokerPlayPolicyForm')).toBeVisible();

  const liveTableDrawer = page.locator('[data-poker-section="live-tables"] details[data-poker-detail-level="advanced"]').first();
  await liveTableDrawer.locator('summary').click();
  await expect(page.getByRole('link', { name: 'History' }).first()).toBeVisible();

  await closeDesignPage(resources);
});
