const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const {
  closeDesignPage,
  openDesignSchedule,
} = require('./helpers/poker_design');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('D6 dead-simple default: schedule stays player-first and hides admin surfaces without admin state', async ({ browser, request }) => {
  const resources = await openDesignSchedule(browser, request, {
    viewport: { width: 390, height: 844 },
    adminToken: false,
  });
  const { page } = resources;

  await expect(page.getByRole('heading', { name: 'Today’s Tournaments' })).toBeVisible();
  await expect(page.locator('[data-poker-section="schedule-admin"]')).toHaveCount(0);

  const recurringDrawer = page.locator('[data-poker-section="recurring-templates"] details[data-poker-detail-level="advanced"]');
  await expect(recurringDrawer).not.toHaveAttribute('open', '');
  await expect(page.getByRole('link', { name: 'Series Timeline' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Open Lobby Table' }).first()).toBeVisible();

  await closeDesignPage(resources);
});
