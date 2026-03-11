const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const { seedPokerPlayHarness } = require('./helpers/poker_play');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M22.14: ops dashboard UI shows every card with a drill-down link and renders reconciliation state', async ({ page, request }) => {
  await seedPokerPlayHarness(request, {
    scenario: 'ops_dashboard_story',
    asOf: '2026-03-11T16:00:00.000Z',
    tableId: 'pkt_play_phase22_ops_ui',
  });

  await page.goto('/');
  await page.evaluate(() => {
    window.localStorage.setItem('poker.adminToken', 'test-admin');
  });
  await page.goto('/poker/play/admin/ops?embed=1&asOf=2026-03-11T16%3A00%3A00.000Z');

  await expect(page.locator('#pokerTitle')).toHaveText('Poker Ops');
  await expect(page.getByRole('heading', { name: 'Live Tables' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Disconnected Seats' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Recent Payout Jobs' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Mismatch Rows' })).toBeVisible();
  await expect(page.locator('[data-ops-card="reconciliation_mismatches"] .pokerSummaryValue')).toHaveText('0');

  const cards = page.locator('[data-ops-card]');
  await expect(cards).toHaveCount(9);
  const hrefs = await cards.locator('a').evaluateAll((links) => links.map((link) => link.getAttribute('href') || ''));
  expect(hrefs).toHaveLength(9);
  for (const href of hrefs) {
    expect(String(href)).toMatch(/^\/poker\//);
  }

  await expect(page.getByText('Harness Ops Live Cash Table').first()).toBeVisible();
  await expect(page.getByText('Harness Ops Live Series').first()).toBeVisible();
  await expect(page.getByText('Harness Ops Refund Tournament').first()).toBeVisible();
  await expect(page.getByText('Harness Ops Payout Tournament').first()).toBeVisible();
});
