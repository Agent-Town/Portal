const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M25.8 UI+++ : admins can cancel a recurring schedule template inline and remove its future events from the calendar', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.localStorage.setItem('poker.adminToken', 'test-admin');
  });

  await page.goto('/poker/play/schedule?asOf=2026-03-12T08%3A00%3A00.000Z&embed=1');

  await page.locator('#pokerPlayScheduleTemplateTitle').fill('Weekly Cancel UI Showcase');
  await page.locator('#pokerPlayScheduleTemplateFirstStartAt').fill('2026-03-14T18:30:00.000Z');
  await page.locator('#pokerPlayScheduleTemplateRecurrenceKind').selectOption('weekly');
  await page.locator('#pokerPlayScheduleTemplateEventCount').fill('2');
  await page.locator('#pokerPlayScheduleTemplateBuyInOil').fill('500');
  await page.locator('#pokerPlayScheduleTemplateSmallBlindOil').fill('25');
  await page.locator('#pokerPlayScheduleTemplateBigBlindOil').fill('50');
  await page.getByRole('button', { name: 'Create Template' }).click();

  const templateCard = page.locator('.pokerMessage').filter({ hasText: 'Weekly Cancel UI Showcase' }).first();
  await expect(templateCard.getByText('active')).toBeVisible();
  await expect(templateCard.getByRole('button', { name: 'Cancel Template' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '2026-03-14' })).toBeVisible();

  await templateCard.getByRole('button', { name: 'Cancel Template' }).click();

  await expect(templateCard.getByText('cancelled')).toBeVisible();
  await expect(templateCard.getByRole('button', { name: 'Cancel Template' })).toHaveCount(0);
  await expect(page.getByText('No recurring tournament templates are scheduled yet.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'No Scheduled Events' })).toBeVisible();

  await context.close();
});
