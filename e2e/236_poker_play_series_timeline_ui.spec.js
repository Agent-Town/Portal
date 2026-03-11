const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const { bindPageSession, seedPokerPlayHarness } = require('./helpers/poker_play');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M22.11 UI: player, public, and operator timeline views render from the same durable series event stream', async ({ browser, request }) => {
  const seeded = await seedPokerPlayHarness(request, {
    scenario: 'series_timeline_story',
    asOf: '2026-03-11T15:00:00.000Z',
    tableId: 'pkt_play_phase22_timeline_ui',
  });
  const seriesId = String(seeded?.seriesId || '');
  const actor = seeded?.actors?.[0] || null;
  expect(seriesId).toBeTruthy();
  expect(actor?.address).toBeTruthy();

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/');
  await bindPageSession(page, {
    address: actor.address,
    houseId: actor.houseId,
  });
  await page.addInitScript((token) => {
    window.localStorage.setItem('poker.adminToken', token);
  }, 'test-admin');

  await page.goto(`/poker/play/series/${encodeURIComponent(seriesId)}/timeline?embed=1&asOf=2026-03-11T15%3A00%3A00.000Z`);
  await expect(page.getByRole('heading', { name: 'Player Timeline' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Operator Timeline' })).toBeVisible();
  await expect(page.getByText('Jam the turn and deny the redraw.').first()).toBeVisible();
  await expect(page.getByText('tournament payout paid').first()).toBeVisible();

  await page.goto(`/poker/play/rail/series/${encodeURIComponent(seriesId)}/timeline?embed=1&asOf=2026-03-11T15%3A00%3A00.000Z`);
  await expect(page.getByRole('heading', { name: 'Public Timeline' })).toBeVisible();
  await expect(page.locator('body')).not.toContainText('Operator Timeline');
  await expect(page.locator('body')).not.toContainText('Jam the turn and deny the redraw.');
  await expect(page.getByText('table closed')).toBeVisible();

  await context.close();
});
