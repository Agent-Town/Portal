const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const { bindPageSession, seedPokerPlayHarness } = require('./helpers/poker_play');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M22.10 UI: player-facing results and hand history stay minimal and privacy-safe', async ({ browser, request }) => {
  const seeded = await seedPokerPlayHarness(request, {
    scenario: 'history_results_story',
    asOf: '2026-03-11T14:00:00.000Z',
    tableId: 'pkt_play_phase22_history_ui',
  });
  const cashTableId = String(seeded?.tableIds?.[0] || seeded?.tableId || '');
  const actor = seeded?.actors?.[0] || null;
  expect(cashTableId).toBeTruthy();
  expect(actor?.address).toBeTruthy();

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/');
  await bindPageSession(page, {
    address: actor.address,
    houseId: actor.houseId,
  });

  await page.goto('/poker/play/results?embed=1&asOf=2026-03-11T14%3A00%3A00.000Z');
  await expect(page.getByRole('heading', { name: 'My Results' })).toBeVisible();
  await expect(page.getByText('Harness History Cash Table')).toBeVisible();
  await expect(page.getByText('Harness Results Tournament Table')).toBeVisible();
  await expect(page.getByText('450 OIL').first()).toBeVisible();

  await page.goto(`/poker/play/tables/${encodeURIComponent(cashTableId)}/history?embed=1&asOf=2026-03-11T14%3A00%3A00.000Z&status=completed`);
  await expect(page.getByRole('heading', { name: 'Hands' })).toBeVisible();
  await expect(page.getByText('Hand 2')).toBeVisible();
  await expect(page.getByText('Hand 1')).toBeVisible();
  await expect(page.getByText('worker line')).toBeVisible();
  await expect(page.getByText('Call once and re-evaluate on the river if the board pairs.')).toBeVisible();
  await expect(page.locator('body')).not.toContainText('Kh');
  await expect(page.locator('body')).not.toContainText('Qs');

  await context.close();
});
