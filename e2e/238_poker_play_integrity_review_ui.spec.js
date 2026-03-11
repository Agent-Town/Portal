const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const { bindPageSession, seedPokerPlayHarness } = require('./helpers/poker_play');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M22.12 UI: operator integrity queue shows durable flags, hides private seat-thread bodies, and resolves the queue cleanly', async ({ browser, request }) => {
  const seeded = await seedPokerPlayHarness(request, {
    scenario: 'integrity_flag_story',
    asOf: '2026-03-11T16:30:00.000Z',
    tableId: 'pkt_play_phase22_integrity_ui',
  });
  const tableId = String(seeded?.tableId || '');
  const actor = seeded?.actors?.[0] || null;
  expect(tableId).toBeTruthy();
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

  await page.goto(`/poker/play/tables/${encodeURIComponent(tableId)}?embed=1&asOf=2026-03-11T16%3A30%3A00.000Z`);
  await expect(page.getByRole('heading', { name: 'Operator Review' })).toBeVisible();
  await expect(page.getByText('Open Integrity Flags')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Integrity Queue' })).toBeVisible();

  await page.goto('/poker/play/admin/integrity?embed=1&asOf=2026-03-11T16%3A30%3A00.000Z');
  await expect(page.getByRole('heading', { name: 'Integrity Queue' }).first()).toBeVisible();
  await expect(page.getByText('shared_house_multi_seat').first()).toBeVisible();
  await expect(page.getByText('multi_dispute_cluster').first()).toBeVisible();
  await expect(page.locator('body')).not.toContainText('Do not leak this private seat note outside the review queue.');
  await expect(page.locator('body')).not.toContainText('Keep this private seat-agent warning inside the seat thread.');

  await page.getByRole('button', { name: 'Resolve' }).first().click();
  await expect(page.getByText('1 integrity flag row loaded.')).toBeVisible();
  await page.getByRole('button', { name: 'Dismiss' }).first().click();
  await expect(page.getByText('No integrity flags matched this filter.').first()).toBeVisible();
  await expect(page.locator('body')).toContainText('Open');
  await expect(page.locator('body')).toContainText('Resolved');
  await expect(page.locator('body')).toContainText('Dismissed');
  await expect(page.locator('body')).toContainText('0');
  await expect(page.locator('body')).toContainText('1');

  await context.close();
});
