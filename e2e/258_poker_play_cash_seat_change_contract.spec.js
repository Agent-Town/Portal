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

test('M25.3: cash seat change moves the wallet-bound seat between hands without stack drift', async ({ browser, request }) => {
  const actor = {
    address: 'So1anaMockMatchA11111111111111111111111111111',
    houseId: 'house_cash_move_a',
    streamId: 'stream-cash-move-a',
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

  let resp = await browserJson(page, '/api/poker/play/tables', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': actor.address },
    data: {
      tableType: 'cash',
      title: 'Seat Change Cash',
      smallBlindOil: 10,
      bigBlindOil: 20,
      buyInOil: 200,
      minPlayers: 2,
      maxSeats: 6,
      seatNumber: 1,
      displayName: 'Seat Move Alpha',
      asOf: '2026-03-10T12:01:00.000Z',
    },
  });
  expect(resp.ok).toBe(true);
  const tableId = String(resp.body?.data?.table?.tableId || '');
  expect(tableId).toBeTruthy();

  resp = await browserJson(page, `/api/poker/play/tables/${encodeURIComponent(tableId)}`, {
    headers: { 'x-wallet-solana-address': actor.address },
  });
  expect(resp.ok).toBe(true);
  expect(resp.body?.data?.mySeat?.seatNumber).toBe(1);
  expect(Number(resp.body?.data?.mySeat?.stackOil || 0)).toBe(200);
  expect(resp.body?.data?.cashMovement?.seatChangeAllowed).toBe(true);
  expect(resp.body?.data?.cashMovement?.seatChangeOpenSeatNumbers).toEqual([2, 3, 4, 5, 6]);

  resp = await browserJson(page, `/api/poker/play/tables/${encodeURIComponent(tableId)}/change-seat`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': actor.address },
    data: {
      seatNumber: 5,
      asOf: '2026-03-10T12:05:00.000Z',
    },
  });
  expect(resp.ok).toBe(true);
  expect(resp.body?.data?.mySeat?.seatNumber).toBe(5);
  expect(resp.body?.data?.wallet?.address).toBe(actor.address);
  expect(Number(resp.body?.data?.mySeat?.stackOil || 0)).toBe(200);
  expect((resp.body?.data?.seats || []).map((seat) => Number(seat?.seatNumber || 0)).sort((left, right) => left - right)).toEqual([5]);
  expect(resp.body?.data?.review?.latestAuditEvent?.eventKind).toBe('seat_changed');

  resp = await browserJson(page, `/api/poker/play/tables/${encodeURIComponent(tableId)}`, {
    headers: { 'x-wallet-solana-address': actor.address },
  });
  expect(resp.ok).toBe(true);
  expect(resp.body?.data?.mySeat?.seatNumber).toBe(5);
  expect(Number(resp.body?.data?.mySeat?.stackOil || 0)).toBe(200);
  expect(resp.body?.data?.cashMovement?.seatChangeOpenSeatNumbers).toEqual([1, 2, 3, 4, 6]);
  expect(resp.body?.data?.review?.latestAuditEvent?.eventKind).toBe('seat_changed');

  await context.close();
});
