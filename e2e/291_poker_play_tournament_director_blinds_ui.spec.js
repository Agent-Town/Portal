const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const { seedPokerPlayHarness } = require('./helpers/poker_play');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M25.x UI: operator review can advance scheduled tournament blinds before the first hand starts', async ({ browser, request }) => {
  const seeded = await seedPokerPlayHarness(request, {
    scenario: 'tournament_schedule_waiting',
    asOf: '2027-03-12T11:00:00.000Z',
    tableId: 'pkt_play_phase25_director_blinds_ui',
  });
  const tableId = String((Array.isArray(seeded?.tableIds) ? seeded.tableIds[0] : '') || seeded?.tableId || '');
  expect(tableId).toBeTruthy();

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.localStorage.setItem('poker.adminToken', 'test-admin');
  });
  await page.goto(`/poker/play/tables/${encodeURIComponent(tableId)}?embed=1&asOf=2027-03-12T11%3A00%3A00.000Z`);

  await expect(page.getByRole('heading', { name: 'Operator Review' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Advance Blinds' })).toBeVisible();
  await expect(page.locator('body')).toContainText('50 / 100');

  await page.getByRole('button', { name: 'Advance Blinds' }).click();
  await expect(page.locator('body')).toContainText('Blinds advanced to level 2.');
  await expect(page.locator('body')).toContainText('75 / 150');
  await expect(page.getByRole('button', { name: 'Start Table' })).toBeVisible();

  await page.getByRole('button', { name: 'Start Table' }).click();
  await expect(page.locator('body')).toContainText('A live hand is in progress.');
  await expect(page.locator('body')).toContainText('75 / 150');

  await context.close();
});
