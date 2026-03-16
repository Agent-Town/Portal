const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const {
  closeDesignPage,
  openDesignSchedule,
} = require('./helpers/poker_design');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('D6 detail gate: schedule admin and recurring template drawers reveal tools only after open', async ({ browser, request }) => {
  const resources = await openDesignSchedule(browser, request, {
    adminToken: true,
  });
  const { page } = resources;

  const adminDrawer = page.locator('[data-poker-section="schedule-admin"] details[data-poker-detail-level="advanced"]');
  await expect(page.locator('#pokerPlayScheduleTemplateForm')).toBeHidden();
  await adminDrawer.locator('summary').click();
  await expect(page.locator('#pokerPlayScheduleTemplateForm')).toBeVisible();

  const recurringDrawer = page.locator('[data-poker-section="recurring-templates"] details[data-poker-detail-level="advanced"]');
  await recurringDrawer.locator('summary').click();
  await expect(recurringDrawer.getByText('upcoming event').first()).toBeVisible();

  await closeDesignPage(resources);
});
