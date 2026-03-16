const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const { closeDesignLiveTable, openDesignLiveTable } = require('./helpers/poker_design');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('D6 dead-simple default: live table keeps support tools behind explicit drawers', async ({ browser, request }) => {
  const resources = await openDesignLiveTable(browser, request, {
    viewport: { width: 390, height: 844 },
  });
  const { page } = resources;

  await expect(page.locator('[data-poker-section="current-hand"]')).toBeVisible();
  await expect(page.locator('[data-poker-section="submit-action"]')).toBeVisible();
  await expect(page.locator('#pokerPlayMessageForm')).toBeHidden();
  await expect(page.locator('#pokerPlayAutoActForm')).toBeHidden();
  await expect(page.locator('#pokerPlayDisputeForm')).toBeHidden();

  const supportDrawers = page.locator(
    '[data-poker-section="worker-seat-agent"] details[data-poker-detail-level="advanced"], ' +
    '[data-poker-section="seat-thread"] details[data-poker-detail-level="advanced"], ' +
    '[data-poker-section="auto-act"] details[data-poker-detail-level="advanced"], ' +
    '[data-poker-section="flag-review"] details[data-poker-detail-level="advanced"]',
  );
  await expect(supportDrawers).toHaveCount(4);

  await closeDesignLiveTable(resources);
});
