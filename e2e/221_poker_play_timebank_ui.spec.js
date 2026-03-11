const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const {
  bindPageSession,
  seedPokerPlayHarness,
} = require('./helpers/poker_play');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M22.6: the live table UI exposes time-bank controls and reflects the consumed balance', async ({ browser, request }) => {
  const seedAt = new Date().toISOString();
  const userA = {
    address: 'So1anaPhase22TimeBankUiA11111111111111111111',
    houseId: 'house_phase22_timebank_ui_a',
  };
  const seeded = await seedPokerPlayHarness(request, {
    scenario: 'timebank_live',
    asOf: seedAt,
    actors: [
      {
        seatNumber: 1,
        address: userA.address,
        houseId: userA.houseId,
        displayName: 'Clock Alpha',
      },
      {
        seatNumber: 2,
        address: 'So1anaPhase22TimeBankUiB11111111111111111111',
        houseId: 'house_phase22_timebank_ui_b',
        displayName: 'Clock Bravo',
      },
    ],
  });

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/');
  await bindPageSession(page, userA);
  await page.goto(`/poker/play/tables/${encodeURIComponent(seeded.tableId)}?embed=1`);

  await expect(page.locator('.pokerLabel').filter({ hasText: 'Time Bank' }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Use Time Bank (+15s)' })).toBeVisible();
  await page.getByRole('button', { name: 'Use Time Bank (+15s)' }).click();

  await expect(page.getByRole('button', { name: 'Use Time Bank (+15s)' })).toHaveCount(0);
  await expect(page.getByText('uses 15s of time bank.')).toBeVisible();
  await expect(page.getByText('0s')).toBeVisible();

  await context.close();
});
