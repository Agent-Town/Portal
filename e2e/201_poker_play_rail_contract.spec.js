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

test('M23.16: public rail endpoints expose spectator-safe table payloads', async ({ browser, request }) => {
  const userA = {
    address: 'So1anaMockRaiCtactA111111111111111111111111',
    houseId: 'house_rail_contract_a',
    streamId: 'stream-rail-contract-a',
  };
  const userB = {
    address: 'So1anaMockRaiCtactB111111111111111111111111',
    houseId: 'house_rail_contract_b',
    streamId: 'stream-rail-contract-b',
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
      displayName: 'Rail Contract Alpha',
      buyInOil: 400,
    },
  });
  expect(resp.ok).toBe(true);

  resp = await browserJson(pageB, '/api/poker/play/tables/pkt_play_cash_01/sit', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': userB.address },
    data: {
      seatNumber: 2,
      displayName: 'Rail Contract Bravo',
      buyInOil: 400,
    },
  });
  expect(resp.ok).toBe(true);

  const lobbyResponse = await request.get('/api/poker/play/rail');
  expect(lobbyResponse.ok()).toBe(true);
  const lobbyBody = await lobbyResponse.json();
  expect(lobbyBody?.data?.viewerMode).toBe('public');
  expect(lobbyBody?.data?.wallet).toBeNull();
  expect(lobbyBody?.data?.oilBalance).toBeNull();
  expect(Array.isArray(lobbyBody?.data?.items)).toBe(true);

  const detailResponse = await request.get('/api/poker/play/rail/tables/pkt_play_cash_01');
  expect(detailResponse.ok()).toBe(true);
  const detailBody = await detailResponse.json();
  const detail = detailBody?.data || {};
  expect(detail.viewerMode).toBe('public');
  expect(detail.wallet).toBeNull();
  expect(detail.oilBalance).toBeNull();
  expect(detail.mySeat).toBeNull();
  expect(detail.suggestion).toBeNull();
  expect(Array.isArray(detail.messages)).toBe(true);
  for (const message of detail.messages) {
    expect(message.seatNumber).toBeNull();
    expect(message.authorRole).toBe('system');
  }
  expect(Array.isArray(detail.hand?.viewerAllowedActions)).toBe(true);
  expect(detail.hand.viewerAllowedActions).toHaveLength(0);

  const liveSeats = Array.isArray(detail.seats) ? detail.seats.filter((seat) => Number(seat.seatNumber || 0) > 0) : [];
  expect(liveSeats.length).toBeGreaterThanOrEqual(2);
  for (const seat of liveSeats) {
    expect(Array.isArray(seat.holeCards) ? seat.holeCards : []).toHaveLength(0);
    expect(Number(seat.hiddenCardCount || 0)).toBeGreaterThan(0);
    expect(seat.isViewer).toBe(false);
  }

  await contextA.close();
  await contextB.close();
});
