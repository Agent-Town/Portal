const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const { seedPokerPlayHarness } = require('./helpers/poker_play');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M22.8 UI: operator controls can close registration, move a seat, and rebalance a tournament series', async ({ browser, request }) => {
  const seeded = await seedPokerPlayHarness(request, {
    scenario: 'tournament_director_manual',
    asOf: '2026-03-11T12:20:00.000Z',
    tableId: 'pkt_play_phase22_director_ui',
  });
  const [tableAId, tableBId] = Array.isArray(seeded?.tableIds) ? seeded.tableIds : [];
  expect(tableAId).toBeTruthy();
  expect(tableBId).toBeTruthy();

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.localStorage.setItem('poker.adminToken', 'test-admin');
  });
  await page.goto(`/poker/play/tables/${encodeURIComponent(tableBId)}?embed=1&asOf=2026-03-11T12%3A20%3A00.000Z`);

  await expect(page.getByRole('heading', { name: 'Operator Review' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close Registration' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Rebalance Series' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Break Pending Table' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Move Seat' })).toBeVisible();

  await page.getByRole('button', { name: 'Close Registration' }).click();
  await expect(page.getByText('late reg closed').first()).toBeVisible();

  await page.locator('#pokerDirectorMoveSeatNumber').fill('1');
  await page.locator('#pokerDirectorMoveTargetTable').selectOption(String(tableAId));
  await page.locator('#pokerDirectorMoveTargetSeat').fill('3');
  await page.getByRole('button', { name: 'Move Seat' }).click();
  await expect(page.getByRole('button', { name: 'Rebalance Series' })).toBeVisible();

  await page.getByRole('button', { name: 'Rebalance Series' }).click({ force: true });
  await expect(page.getByText('series_closed').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Move Seat' })).toHaveCount(0);

  await context.close();
});

test('M22.8 UI: operator controls can break the pending tournament table from the review surface', async ({ browser, request }) => {
  const seeded = await seedPokerPlayHarness(request, {
    scenario: 'tournament_director_break',
    asOf: '2026-03-11T12:30:00.000Z',
    tableId: 'pkt_play_phase22_director_break_ui',
  });
  const [, tableBId] = Array.isArray(seeded?.tableIds) ? seeded.tableIds : [];
  expect(tableBId).toBeTruthy();

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.localStorage.setItem('poker.adminToken', 'test-admin');
  });
  await page.goto(`/poker/play/tables/${encodeURIComponent(tableBId)}?embed=1&asOf=2026-03-11T12%3A30%3A00.000Z`);

  await expect(page.getByRole('button', { name: 'Break Pending Table' })).toBeVisible();
  await page.getByRole('button', { name: 'Break Pending Table' }).click();
  await expect(page.getByText('balanced').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Break Pending Table' })).toHaveCount(0);

  await context.close();
});
