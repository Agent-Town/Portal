const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M25.8 UI++: schedule page lets admins create durable recurring templates inline', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.localStorage.setItem('poker.adminToken', 'test-admin');
  });

  await page.goto('/poker/play/schedule?asOf=2026-03-12T08%3A00%3A00.000Z&embed=1');

  await expect(page.getByRole('heading', { name: 'Tournament Schedule' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Schedule Admin' })).toBeVisible();
  await page.locator('[data-poker-section="schedule-admin"] details[data-poker-detail-level="advanced"] summary').click();
  await expect(page.locator('#pokerPlayScheduleTemplateForm')).toBeVisible();

  await page.locator('#pokerPlayScheduleTemplateTitle').fill('Weekly Centaur Showcase');
  await page.locator('#pokerPlayScheduleTemplateFirstStartAt').fill('2026-03-14T18:30:00.000Z');
  await page.locator('#pokerPlayScheduleTemplateRecurrenceKind').selectOption('weekly');
  await page.locator('#pokerPlayScheduleTemplateEventCount').fill('2');
  await page.locator('#pokerPlayScheduleTemplateBuyInOil').fill('650');
  await page.locator('#pokerPlayScheduleTemplateSmallBlindOil').fill('75');
  await page.locator('#pokerPlayScheduleTemplateBigBlindOil').fill('150');
  await page.getByRole('button', { name: 'Create Template' }).click();

  await expect(page.getByRole('heading', { name: 'Recurring Templates' })).toBeVisible();
  const recurringDrawer = page.locator('[data-poker-section="recurring-templates"] details[data-poker-detail-level="advanced"]');
  await recurringDrawer.locator('summary').click();
  await expect(recurringDrawer.getByText('Weekly Centaur Showcase').first()).toBeVisible();
  await expect(recurringDrawer.getByText('Weekly Sat 18:30 UTC').first()).toBeVisible();
  await expect(recurringDrawer.getByText('1 upcoming event').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: '2026-03-14' })).toBeVisible();

  await context.close();
});
