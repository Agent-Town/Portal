const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const { bindPageSession, seedPokerPlayHarness } = require('./helpers/poker_play');

const AS_OF = '2026-03-11T10:00:00.000Z';

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M25.6 UI: acting seats get a dedicated shove control and the action log renders shove explicitly', async ({ browser, request }) => {
  const seeded = await seedPokerPlayHarness(request, {
    scenario: 'timebank_live',
    asOf: AS_OF,
    tableId: 'pkt_play_phase25_shove_ui',
  });
  const tableId = String(seeded?.tableId || seeded?.tableIds?.[0] || '');
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

  await page.goto(`/poker/play/tables/${encodeURIComponent(tableId)}?embed=1&asOf=${encodeURIComponent(AS_OF)}`);
  await expect(page.getByRole('button', { name: 'Shove' })).toBeVisible();
  await page.getByRole('button', { name: 'Shove' }).click();

  const publicActionCard = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Public Action Log' }) });
  await expect(publicActionCard.locator('.pokerRow').filter({ hasText: 'shove' })).toBeVisible();
  await expect(page.getByText('Action submitted.')).toBeVisible();

  await context.close();
});
