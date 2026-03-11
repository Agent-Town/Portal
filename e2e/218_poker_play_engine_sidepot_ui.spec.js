const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const {
  bindPageSession,
  seedPokerPlayHarness,
} = require('./helpers/poker_play');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M22.3: the live table UI renders matched-pot and returned-uncalled summaries after settlement', async ({ browser, request }) => {
  const seedAt = new Date().toISOString();
  const userC = {
    address: 'So1anaPhase22SidepotUiC11111111111111111111111',
    houseId: 'house_phase22_sidepot_ui_c',
  };
  const seeded = await seedPokerPlayHarness(request, {
    scenario: 'sidepot_live',
    asOf: seedAt,
    actors: [
      {
        seatNumber: 1,
        address: 'So1anaPhase22SidepotUiA11111111111111111111111',
        houseId: 'house_phase22_sidepot_ui_a',
        displayName: 'Harness Alpha',
      },
      {
        seatNumber: 2,
        address: 'So1anaPhase22SidepotUiB11111111111111111111111',
        houseId: 'house_phase22_sidepot_ui_b',
        displayName: 'Harness Bravo',
      },
      {
        seatNumber: 3,
        address: userC.address,
        houseId: userC.houseId,
        displayName: 'Harness Charlie',
      },
    ],
  });

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/');
  await bindPageSession(page, userC);
  await page.goto(`/poker/play/tables/${encodeURIComponent(seeded.tableId)}?embed=1`);
  await page.locator('#pokerPlayActionKind').selectOption('check');
  await page.getByRole('button', { name: 'Submit Action' }).click();

  await expect(page.locator('.pokerLabel').filter({ hasText: 'Matched Pots' }).first()).toBeVisible();
  await expect(page.locator('[data-pot-kind="main"]')).toContainText('300 OIL');
  await expect(page.locator('[data-pot-kind="side"]')).toContainText('Winning seats: 2');
  await expect(page.getByText('Returned Uncalled Chips')).toBeVisible();
  await expect(page.getByText('100 OIL')).toBeVisible();

  await context.close();
});
