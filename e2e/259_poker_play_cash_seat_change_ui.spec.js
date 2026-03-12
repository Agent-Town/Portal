const { test, expect } = require('@playwright/test');
const {
  resetPortalWebState,
  seedStreamflowLocks,
} = require('./helpers/portal_web');
const {
  bindPageSession,
  browserJson,
  verifyStreamflowAndFundOil,
} = require('./helpers/poker_play');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M25.3 UI: cash seat change exposes a minimal seat-movement control and refreshes the open-seat options', async ({ browser, request }) => {
  const actor = {
    address: 'So1anaMockMatchB11111111111111111111111111111',
    houseId: 'house_cash_move_ui_a',
    streamId: 'stream-cash-move-ui-a',
  };

  await seedStreamflowLocks(request, {
    locks: [
      {
        address: actor.address,
        streamId: actor.streamId,
        tokenSymbol: '$AGENTTOWN',
        locked: true,
        lockedAmountAtomic: '2500000',
      },
    ],
  });

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/');
  await bindPageSession(page, actor);
  await verifyStreamflowAndFundOil(page, request, {
    address: actor.address,
    streamId: actor.streamId,
  });

  const resp = await browserJson(page, '/api/poker/play/tables', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': actor.address },
    data: {
      tableType: 'cash',
      title: 'Seat Change UI Cash',
      smallBlindOil: 10,
      bigBlindOil: 20,
      buyInOil: 200,
      minPlayers: 2,
      maxSeats: 6,
      seatNumber: 1,
      displayName: 'Seat Move UI Alpha',
      asOf: '2026-03-10T12:01:00.000Z',
    },
  });
  expect(resp.ok).toBe(true);
  const tableId = String(resp.body?.data?.table?.tableId || '');
  expect(tableId).toBeTruthy();

  await page.goto(`/poker/play/tables/${encodeURIComponent(tableId)}?embed=1`);
  await expect(page.getByRole('heading', { name: 'Your Seat' })).toBeVisible();
  await expect(page.getByText('Seat Movement')).toBeVisible();
  await expect(page.locator('#pokerPlaySeatChangeNumber')).toContainText('Seat 4');
  await expect(page.locator('#pokerPlaySeatChangeNumber')).toContainText('Seat 5');
  await expect(page.locator('#pokerPlaySeatChangeNumber')).toContainText('Seat 6');

  await page.locator('#pokerPlaySeatChangeNumber').selectOption('5');
  await page.getByRole('button', { name: 'Change Seat' }).click();

  await expect(page.locator('#pokerStatus')).toHaveText('Seat changed.');
  await expect(page.locator('#pokerPlaySeatChangeNumber')).toContainText('Seat 1');
  await expect(page.locator('#pokerPlaySeatChangeNumber')).toContainText('Seat 4');
  await expect(page.locator('#pokerPlaySeatChangeNumber')).toContainText('Seat 6');
  await expect(page.locator('#pokerPlaySeatChangeNumber')).not.toContainText('Seat 5');

  await context.close();
});
