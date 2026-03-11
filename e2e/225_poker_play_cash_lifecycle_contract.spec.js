const { test, expect } = require('@playwright/test');
const {
  resetPortalWebState,
  seedStreamflowLocks,
} = require('./helpers/portal_web');
const {
  bindPageSession,
  browserJson,
  seedPokerPlayHarness,
  verifyStreamflowAndFundOil,
} = require('./helpers/poker_play');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M22.6: cash lifecycle contract reloads exactly, skips one hand, and returns the same seat', async ({ browser, request }) => {
  const reloader = {
    address: 'So1anaMockPhase22CashLifeA11111111111111111111111',
    houseId: 'house_phase22_cashlife_a',
    streamId: 'stream-phase22-cashlife-a',
  };
  const awaySeat = {
    address: 'So1anaMockPhase22CashLifeC11111111111111111111111',
    houseId: 'house_phase22_cashlife_c',
    streamId: 'stream-phase22-cashlife-c',
  };
  const seeded = await seedPokerPlayHarness(request, {
    scenario: 'cash_lifecycle_waiting',
    asOf: '2026-03-11T08:00:00.000Z',
    tableId: 'pkt_play_phase22_cash_lifecycle',
    actors: [
      {
        seatNumber: 1,
        address: reloader.address,
        houseId: reloader.houseId,
        displayName: 'Lifecycle Alpha',
      },
      {
        seatNumber: 2,
        address: 'So1anaMockPhase22CashLifeB11111111111111111111111',
        houseId: 'house_phase22_cashlife_b',
        displayName: 'Lifecycle Bravo',
      },
      {
        seatNumber: 3,
        address: awaySeat.address,
        houseId: awaySeat.houseId,
        displayName: 'Lifecycle Charlie',
      },
    ],
  });

  await seedStreamflowLocks(request, {
    locks: [
      {
        address: reloader.address,
        streamId: reloader.streamId,
        tokenSymbol: '$AGENTTOWN',
        locked: true,
        lockedAmountAtomic: '2500000',
      },
      {
        address: awaySeat.address,
        streamId: awaySeat.streamId,
        tokenSymbol: '$AGENTTOWN',
        locked: true,
        lockedAmountAtomic: '2500000',
      },
    ],
  });

  const contextReload = await browser.newContext();
  const pageReload = await contextReload.newPage();
  await pageReload.goto('/');
  await bindPageSession(pageReload, reloader);
  const reloadFunding = await verifyStreamflowAndFundOil(pageReload, request, {
    address: reloader.address,
    streamId: reloader.streamId,
  });

  const contextAway = await browser.newContext();
  const pageAway = await contextAway.newPage();
  await pageAway.goto('/');
  await bindPageSession(pageAway, awaySeat);
  await verifyStreamflowAndFundOil(pageAway, request, {
    address: awaySeat.address,
    streamId: awaySeat.streamId,
  });

  const beforeStack = 240;
  const beforeOil = Number(reloadFunding?.oilBalance?.balance || 0);
  const reloadAmount = 60;

  const reloadResp = await browserJson(pageReload, `/api/poker/play/tables/${encodeURIComponent(seeded.tableId)}/reload`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': reloader.address },
    data: {
      amountOil: reloadAmount,
    },
  });
  expect(reloadResp.ok).toBe(true);
  expect(reloadResp.body?.data?.hand).toBeNull();
  expect(Number(reloadResp.body?.data?.mySeat?.stackOil || 0)).toBe(beforeStack + reloadAmount);
  expect(Number(reloadResp.body?.data?.oilBalance?.balance || 0)).toBe(beforeOil - reloadAmount);

  const sitOutResp = await browserJson(pageAway, `/api/poker/play/tables/${encodeURIComponent(seeded.tableId)}/sit-out`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': awaySeat.address },
    data: {
      markAway: true,
    },
  });
  expect(sitOutResp.ok).toBe(true);
  expect(sitOutResp.body?.data?.mySeat?.status).toBe('away');

  const skippedHandResp = await browserJson(pageReload, `/api/poker/play/tables/${encodeURIComponent(seeded.tableId)}`, {
    headers: { 'x-wallet-solana-address': reloader.address },
  });
  expect(skippedHandResp.ok).toBe(true);
  expect(skippedHandResp.body?.data?.hand?.status).toBe('live');
  expect(Number(skippedHandResp.body?.data?.hand?.actingSeat || 0)).toBe(1);
  const skippedSeat = (skippedHandResp.body?.data?.hand?.seats || []).find((seat) => Number(seat?.seatNumber || 0) === 3);
  expect(skippedSeat?.status).toBe('away');
  expect(Array.isArray(skippedSeat?.holeCards) ? skippedSeat.holeCards.length : 0).toBe(0);

  const returnResp = await browserJson(pageAway, `/api/poker/play/tables/${encodeURIComponent(seeded.tableId)}/return`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': awaySeat.address },
    data: {},
  });
  expect(returnResp.ok).toBe(true);
  expect(returnResp.body?.data?.mySeat?.status).toBe('active');
  expect(Number(returnResp.body?.data?.mySeat?.seatNumber || 0)).toBe(3);

  const foldResp = await browserJson(pageReload, `/api/poker/play/hands/${encodeURIComponent(skippedHandResp.body?.data?.hand?.handId || '')}/actions`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': reloader.address },
    data: {
      actionKind: 'fold',
      amountOil: 0,
      asOf: '2026-03-11T08:01:00.000Z',
    },
  });
  expect(foldResp.ok).toBe(true);

  const afterReturn = await browserJson(pageAway, `/api/poker/play/tables/${encodeURIComponent(seeded.tableId)}?asOf=2026-03-11T08%3A02%3A00.000Z`, {
    headers: { 'x-wallet-solana-address': awaySeat.address },
  });
  expect(afterReturn.ok).toBe(true);
  expect(afterReturn.body?.data?.mySeat?.status).toBe('active');
  expect(Number(afterReturn.body?.data?.mySeat?.seatNumber || 0)).toBe(3);
  const nextHandSeat = (afterReturn.body?.data?.hand?.seats || []).find((seat) => Number(seat?.seatNumber || 0) === 3);
  expect(nextHandSeat?.status).toBe('active');
  expect(Array.isArray(nextHandSeat?.holeCards) ? nextHandSeat.holeCards.length : 0).toBe(2);

  await contextReload.close();
  await contextAway.close();
});
