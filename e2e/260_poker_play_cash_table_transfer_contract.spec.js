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

test('M25.3: cash table transfer moves the live seat to a compatible table with zero OIL drift', async ({ browser, request }) => {
  const actor = {
    address: 'So1anaMockMatchC11111111111111111111111111111',
    houseId: 'house_cash_transfer_a',
    streamId: 'stream-cash-transfer-a',
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

  const tableConfig = {
    tableType: 'cash',
    title: 'Transfer Match Cash',
    smallBlindOil: 15,
    bigBlindOil: 30,
    buyInOil: 300,
    minPlayers: 2,
    maxSeats: 6,
    asOf: '2026-03-10T12:10:00.000Z',
  };

  let resp = await browserJson(page, '/api/poker/play/tables', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': actor.address },
    data: {
      ...tableConfig,
      joinNow: false,
    },
  });
  expect(resp.ok).toBe(true);
  const targetTableId = String(resp.body?.data?.table?.tableId || '');
  expect(targetTableId).toBeTruthy();

  resp = await browserJson(page, '/api/poker/play/tables', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': actor.address },
    data: {
      ...tableConfig,
      title: 'Transfer Source Cash',
      seatNumber: 1,
      displayName: 'Transfer Alpha',
      asOf: '2026-03-10T12:11:00.000Z',
    },
  });
  expect(resp.ok).toBe(true);
  const sourceTableId = String(resp.body?.data?.table?.tableId || '');
  expect(sourceTableId).toBeTruthy();
  expect(sourceTableId).not.toBe(targetTableId);
  expect(resp.body?.data?.mySeat?.seatNumber).toBe(1);

  resp = await browserJson(page, '/api/oil/balance?asOf=2026-03-10T12:12:00.000Z', {
    headers: { 'x-wallet-solana-address': actor.address },
  });
  expect(resp.ok).toBe(true);
  const balanceAfterBuyIn = Number(resp.body?.data?.oilBalance?.balance || 0);

  resp = await browserJson(page, `/api/poker/play/tables/${encodeURIComponent(sourceTableId)}`, {
    headers: { 'x-wallet-solana-address': actor.address },
  });
  expect(resp.ok).toBe(true);
  expect(resp.body?.data?.cashMovement?.transferAllowed).toBe(true);
  expect((resp.body?.data?.cashMovement?.transferOptions || []).map((item) => String(item?.tableId || ''))).toContain(targetTableId);

  resp = await browserJson(page, `/api/poker/play/tables/${encodeURIComponent(sourceTableId)}/transfer`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': actor.address },
    data: {
      targetTableId,
      targetSeatNumber: 4,
      asOf: '2026-03-10T12:13:00.000Z',
    },
  });
  expect(resp.ok).toBe(true);
  expect(String(resp.body?.data?.table?.tableId || '')).toBe(targetTableId);
  expect(String(resp.body?.data?.transfer?.sourceTableId || '')).toBe(sourceTableId);
  expect(String(resp.body?.data?.transfer?.targetTableId || '')).toBe(targetTableId);
  expect(resp.body?.data?.mySeat?.seatNumber).toBe(4);
  expect(Number(resp.body?.data?.mySeat?.stackOil || 0)).toBe(300);
  expect(resp.body?.data?.review?.latestAuditEvent?.eventKind).toBe('seat_transferred_in');

  resp = await browserJson(page, '/api/oil/balance?asOf=2026-03-10T12:14:00.000Z', {
    headers: { 'x-wallet-solana-address': actor.address },
  });
  expect(resp.ok).toBe(true);
  expect(Number(resp.body?.data?.oilBalance?.balance || 0)).toBe(balanceAfterBuyIn);

  resp = await browserJson(page, `/api/poker/play/tables/${encodeURIComponent(sourceTableId)}`, {
    headers: { 'x-wallet-solana-address': actor.address },
  });
  expect(resp.ok).toBe(true);
  expect(resp.body?.data?.mySeat).toBeNull();
  expect(resp.body?.data?.review?.latestAuditEvent?.eventKind).toBe('seat_transferred_out');

  resp = await browserJson(page, `/api/poker/play/tables/${encodeURIComponent(targetTableId)}`, {
    headers: { 'x-wallet-solana-address': actor.address },
  });
  expect(resp.ok).toBe(true);
  expect(resp.body?.data?.mySeat?.seatNumber).toBe(4);
  expect(resp.body?.data?.review?.latestAuditEvent?.eventKind).toBe('seat_transferred_in');

  await context.close();
});
