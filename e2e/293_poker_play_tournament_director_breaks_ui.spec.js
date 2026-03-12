const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const { seedPokerPlayHarness } = require('./helpers/poker_play');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M25.x UI: operator review can start and end the next scheduled tournament break', async ({ browser, request }) => {
  const seeded = await seedPokerPlayHarness(request, {
    scenario: 'director_scheduled_break_ready',
    asOf: '2026-03-12T19:00:00.000Z',
    tableId: 'pkt_play_phase25_director_breaks_ui',
  });
  const tableId = String(seeded?.tableId || '');
  expect(tableId).toBeTruthy();

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.localStorage.setItem('poker.adminToken', 'test-admin');
  });
  await page.goto(`/poker/play/tables/${encodeURIComponent(tableId)}?embed=1&asOf=2026-03-12T19%3A00%3A00.000Z`);

  await expect(page.getByRole('heading', { name: 'Operator Review' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start Break Now' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'End Break Early' })).toHaveCount(0);
  await expect(page.locator('body')).toContainText('Player Break 2 after hand 6');

  await page.getByRole('button', { name: 'Start Break Now' }).click();
  await expect(page.locator('#pokerStatus')).toContainText('Player Break 2 is now active.');
  await expect(page.locator('body')).toContainText('Player Break 2 is active until');
  await expect(page.getByRole('button', { name: 'End Break Early' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start Break Now' })).toHaveCount(0);

  await page.getByRole('button', { name: 'End Break Early' }).click();
  await expect(page.locator('#pokerStatus')).toContainText('Scheduled break ended.');
  await expect(page.locator('body')).toContainText('Table paused: director staging');
  await expect(page.getByRole('button', { name: 'End Break Early' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Resume Table' })).toBeVisible();

  await page.getByRole('button', { name: 'Resume Table' }).click();
  await expect(page.locator('body')).toContainText('A live hand is in progress.');
  await expect(page.getByRole('button', { name: 'Start Break Now' })).toHaveCount(0);

  await context.close();
});
