const { test, expect } = require('@playwright/test');
const {
  fundOilWallet,
  resetPortalWebState,
} = require('./helpers/portal_web');
const {
  bindPageSession,
  seedPokerPlayHarness,
} = require('./helpers/poker_play');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M22.9 UI: scheduled tournament tables show the durable start time and can be started from operator controls', async ({ browser, request }) => {
  const seeded = await seedPokerPlayHarness(request, {
    scenario: 'tournament_schedule_waiting',
    asOf: '2026-03-11T13:20:00.000Z',
    tableId: 'pkt_play_phase22_schedule_ui',
  });
  const tableId = String(seeded?.tableId || '');
  expect(tableId).toBeTruthy();

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.localStorage.setItem('poker.adminToken', 'test-admin');
  });
  await page.goto(`/poker/play/tables/${encodeURIComponent(tableId)}?embed=1&asOf=2026-03-11T13%3A20%3A00.000Z`);

  await expect(page.getByText('Scheduled Start').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start Table' })).toBeVisible();

  await page.getByRole('button', { name: 'Start Table' }).click();
  await expect(page.getByRole('heading', { name: 'Current Hand' })).toBeVisible();
  await expect(page.getByText('hand 1').first()).toBeVisible();

  await context.close();
});

test('M22.9 UI: busted tournament seats can re-enter once and the table updates the entry totals', async ({ browser, request }) => {
  const seeded = await seedPokerPlayHarness(request, {
    scenario: 'tournament_reentry_waiting',
    asOf: '2026-03-11T13:30:00.000Z',
    tableId: 'pkt_play_phase22_reentry_ui',
  });
  const actor = seeded?.actors?.[0] || null;
  const tableId = String(seeded?.tableId || '');
  expect(actor?.address).toBeTruthy();
  expect(tableId).toBeTruthy();

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/');
  await bindPageSession(page, {
    address: actor.address,
    houseId: actor.houseId,
  });
  await fundOilWallet(request, {
    walletSubject: actor.address,
    houseId: actor.houseId,
    amount: 2000,
  });

  await page.goto(`/poker/play/tables/${encodeURIComponent(tableId)}?embed=1&asOf=2026-03-11T13%3A30%3A00.000Z`);
  await expect(page.getByRole('button', { name: 'Re-Enter Tournament' })).toBeVisible();

  await page.getByRole('button', { name: 'Re-Enter Tournament' }).click();
  await expect(page.getByRole('button', { name: 'Re-Enter Tournament' })).toHaveCount(0);
  await expect(page.getByText('Entries').first()).toBeVisible();
  await expect(page.getByText('1800 OIL').first()).toBeVisible();
  await expect(page.getByText('active').first()).toBeVisible();

  await context.close();
});
