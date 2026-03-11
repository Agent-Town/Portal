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

test('M23.6: cash-table leave queues during a live hand and cashes out after settlement', async ({ browser, request }) => {
  const userA = {
    address: 'So1anaMockCashC111111111111111111111111111111',
    houseId: 'house_cashout_a',
    streamId: 'stream-cashout-a',
  };
  const userB = {
    address: 'So1anaMockCashD111111111111111111111111111111',
    houseId: 'house_cashout_b',
    streamId: 'stream-cashout-b',
  };

  await seedStreamflowLocks(request, {
    locks: [
      {
        address: userA.address,
        streamId: userA.streamId,
        tokenSymbol: '$AGENTTOWN',
        locked: true,
        lockedAmountAtomic: '2500000',
      },
      {
        address: userB.address,
        streamId: userB.streamId,
        tokenSymbol: '$AGENTTOWN',
        locked: true,
        lockedAmountAtomic: '2500000',
      },
    ],
  });

  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();
  await pageA.goto('/');
  await bindPageSession(pageA, userA);
  await verifyStreamflowAndFundOil(pageA, request, {
    address: userA.address,
    streamId: userA.streamId,
  });

  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();
  await pageB.goto('/');
  await bindPageSession(pageB, userB);
  await verifyStreamflowAndFundOil(pageB, request, {
    address: userB.address,
    streamId: userB.streamId,
  });

  let resp = await browserJson(pageA, '/api/poker/play/tables/pkt_play_cash_01/sit', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': userA.address },
    data: {
      seatNumber: 1,
      displayName: 'Cashout Alpha',
      buyInOil: 400,
    },
  });
  expect(resp.ok).toBe(true);

  resp = await browserJson(pageB, '/api/poker/play/tables/pkt_play_cash_01/sit', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': userB.address },
    data: {
      seatNumber: 2,
      displayName: 'Cashout Bravo',
      buyInOil: 400,
    },
  });
  expect(resp.ok).toBe(true);

  const detailAResp = await browserJson(pageA, '/api/poker/play/tables/pkt_play_cash_01', {
    headers: { 'x-wallet-solana-address': userA.address },
  });
  expect(detailAResp.ok).toBe(true);
  const detailA = detailAResp.body?.data || {};
  const detailBResp = await browserJson(pageB, '/api/poker/play/tables/pkt_play_cash_01', {
    headers: { 'x-wallet-solana-address': userB.address },
  });
  expect(detailBResp.ok).toBe(true);
  const detailB = detailBResp.body?.data || {};

  const actingSeat = Number(detailA?.hand?.actingSeat || 0);
  expect([1, 2]).toContain(actingSeat);
  const leaverSeat = actingSeat === 1 ? 2 : 1;
  const leaverPage = leaverSeat === 1 ? pageA : pageB;
  const leaverAddress = leaverSeat === 1 ? userA.address : userB.address;
  const leaverDetail = leaverSeat === 1 ? detailA : detailB;
  const actorPage = actingSeat === 1 ? pageA : pageB;
  const actorAddress = actingSeat === 1 ? userA.address : userB.address;

  const queuedResp = await browserJson(leaverPage, '/api/poker/play/tables/pkt_play_cash_01/leave', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': leaverAddress },
    data: {},
  });
  expect(queuedResp.ok).toBe(true);
  expect(queuedResp.body?.data?.mySeat?.status).toBe('leaving_after_hand');
  expect(queuedResp.body?.data?.table?.summary?.liveHand).toBe(true);

  const blockedJoinResp = await browserJson(leaverPage, '/api/poker/play/matchmake', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': leaverAddress },
    data: {
      tableType: 'cash',
      smallBlindOil: 25,
      bigBlindOil: 50,
      buyInOil: 500,
      displayName: 'Blocked While Leaving',
    },
  });
  expect(blockedJoinResp.ok).toBe(false);
  expect(blockedJoinResp.body?.error?.code).toBe('POKER_PLAY_SEAT_ALREADY_ACTIVE');

  const actorDetailResp = await browserJson(actorPage, '/api/poker/play/tables/pkt_play_cash_01', {
    headers: { 'x-wallet-solana-address': actorAddress },
  });
  expect(actorDetailResp.ok).toBe(true);
  expect(actorDetailResp.body?.data?.hand?.viewerAllowedActions || []).toContain('fold');

  const settleResp = await browserJson(actorPage, `/api/poker/play/hands/${encodeURIComponent(actorDetailResp.body?.data?.hand?.handId || '')}/actions`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': actorAddress },
    data: {
      actionKind: 'fold',
      amountOil: 0,
    },
  });
  expect(settleResp.ok).toBe(true);

  const leaverAfterResp = await browserJson(leaverPage, '/api/poker/play/tables/pkt_play_cash_01?asOf=2026-03-10T14%3A00%3A00.000Z', {
    headers: { 'x-wallet-solana-address': leaverAddress },
  });
  expect(leaverAfterResp.ok).toBe(true);
  expect(leaverAfterResp.body?.data?.mySeat).toBeNull();
  expect(leaverAfterResp.body?.data?.table?.summary?.liveHand).toBe(false);
  expect(Number(leaverAfterResp.body?.data?.table?.summary?.occupancy || 0)).toBe(1);
  expect(Number(leaverAfterResp.body?.data?.oilBalance?.balance || 0)).toBeGreaterThan(Number(leaverDetail?.oilBalance?.balance || 0));

  const actorAfterResp = await browserJson(actorPage, '/api/poker/play/tables/pkt_play_cash_01?asOf=2026-03-10T14%3A00%3A00.000Z', {
    headers: { 'x-wallet-solana-address': actorAddress },
  });
  expect(actorAfterResp.ok).toBe(true);
  expect(actorAfterResp.body?.data?.seats?.some((seat) => Number(seat?.seatNumber || 0) === leaverSeat)).toBe(false);

  await contextA.close();
  await contextB.close();
});
