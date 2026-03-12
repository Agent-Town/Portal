const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const { seedPokerPlayHarness } = require('./helpers/poker_play');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M25.x UI: operator review can start and end a scheduled break across a split tournament series', async ({ browser, request }) => {
  const seeded = await seedPokerPlayHarness(request, {
    scenario: 'director_series_scheduled_break_ready',
    asOf: '2026-03-12T20:30:00.000Z',
    tableId: 'pkt_play_phase25_director_series_breaks_ui',
  });
  const tableId = String((Array.isArray(seeded?.tableIds) ? seeded.tableIds[0] : '') || seeded?.tableId || '');
  expect(tableId).toBeTruthy();

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.localStorage.setItem('poker.adminToken', 'test-admin');
  });
  await page.goto(`/poker/play/tables/${encodeURIComponent(tableId)}?embed=1&asOf=2026-03-12T20%3A30%3A00.000Z`);

  await expect(page.getByRole('heading', { name: 'Operator Review' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start Series Break' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'End Series Break' })).toHaveCount(0);
  await expect(page.locator('body')).toContainText('Series Tables');
  await expect(page.locator('body')).toContainText('2');

  await page.getByRole('button', { name: 'Start Series Break' }).click();
  await expect(page.locator('#pokerStatus')).toContainText('Series break started across 2 tables.');
  await expect(page.locator('body')).toContainText('Scheduled break is active across 2 tables');
  await expect(page.getByRole('button', { name: 'End Series Break' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start Series Break' })).toHaveCount(0);

  await page.getByRole('button', { name: 'End Series Break' }).click();
  await expect(page.locator('#pokerStatus')).toContainText('Series break ended.');
  await expect(page.locator('body')).not.toContainText('Scheduled break is active across 2 tables');
  await expect(page.getByRole('button', { name: 'End Series Break' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Start Series Break' })).toHaveCount(0);

  await context.close();
});
