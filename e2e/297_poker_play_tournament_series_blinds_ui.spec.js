const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const { seedPokerPlayHarness } = require('./helpers/poker_play');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M25.x UI: operator review can advance blinds across a split tournament series', async ({ browser, request }) => {
  const seeded = await seedPokerPlayHarness(request, {
    scenario: 'director_series_scheduled_break_ready',
    asOf: '2026-03-12T21:30:00.000Z',
    tableId: 'pkt_play_phase25_director_series_blinds_ui',
  });
  const tableId = String((Array.isArray(seeded?.tableIds) ? seeded.tableIds[0] : '') || seeded?.tableId || '');
  expect(tableId).toBeTruthy();

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.localStorage.setItem('poker.adminToken', 'test-admin');
  });
  await page.goto(`/poker/play/tables/${encodeURIComponent(tableId)}?embed=1&asOf=2026-03-12T21%3A30%3A00.000Z`);

  await expect(page.getByRole('heading', { name: 'Operator Review' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Advance Series Blinds' })).toBeVisible();
  await expect(page.locator('body')).toContainText('50 / 100');

  await page.getByRole('button', { name: 'Advance Series Blinds' }).click();
  await expect(page.locator('#pokerStatus')).toContainText('Series blinds advanced to level 2 across 2 tables.');
  await expect(page.locator('body')).toContainText('75 / 150');

  await context.close();
});
