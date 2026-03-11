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

test('M23.2: tournament tables settle winner-take-all OIL for the last surviving seat', async ({ browser, request }) => {
  const userA = {
    address: 'So1anaMockTourA111111111111111111111111111111',
    houseId: 'house_tour_a',
    streamId: 'stream-tour-a',
  };
  const userB = {
    address: 'So1anaMockTourB111111111111111111111111111111',
    houseId: 'house_tour_b',
    streamId: 'stream-tour-b',
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
  const fundedA = await verifyStreamflowAndFundOil(pageA, request, {
    address: userA.address,
    streamId: userA.streamId,
  });

  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();
  await pageB.goto('/');
  await bindPageSession(pageB, userB);
  const fundedB = await verifyStreamflowAndFundOil(pageB, request, {
    address: userB.address,
    streamId: userB.streamId,
  });

  let resp = await browserJson(pageA, '/api/poker/play/tables/pkt_play_tournament_01/sit', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': userA.address },
    data: {
      seatNumber: 1,
      displayName: 'Alpha Tournament',
    },
  });
  expect(resp.ok).toBe(true);

  resp = await browserJson(pageB, '/api/poker/play/tables/pkt_play_tournament_01/sit', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': userB.address },
    data: {
      seatNumber: 2,
      displayName: 'Bravo Tournament',
    },
  });
  expect(resp.ok).toBe(true);
  const detail = resp.body?.data || {};
  expect(detail?.hand?.status).toBe('live');
  expect(detail?.hand?.handNumber).toBe(1);

  const detailAResp = await browserJson(pageA, '/api/poker/play/tables/pkt_play_tournament_01', {
    headers: { 'x-wallet-solana-address': userA.address },
  });
  expect(detailAResp.ok).toBe(true);
  const detailA = detailAResp.body?.data || {};

  const actingSeat = Number(detailA?.hand?.actingSeat || 0);
  const openerPage = actingSeat === 1 ? pageA : pageB;
  const openerAddress = actingSeat === 1 ? userA.address : userB.address;
  const openerDetail = actingSeat === 1 ? detailA : detail;

  resp = await browserJson(openerPage, `/api/poker/play/hands/${encodeURIComponent(openerDetail?.hand?.handId || '')}/actions`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': openerAddress },
    data: {
      actionKind: openerDetail?.hand?.viewerAllowedActions?.includes('raise') ? 'raise' : 'bet',
      amountOil: 300,
    },
  });
  expect(resp.ok).toBe(true);
  const afterShove = resp.body?.data || {};
  expect(Number(afterShove?.hand?.actingSeat || 0)).not.toBe(actingSeat);

  const callerSeat = Number(afterShove?.hand?.actingSeat || 0);
  const callerPage = callerSeat === 1 ? pageA : pageB;
  const callerAddress = callerSeat === 1 ? userA.address : userB.address;
  resp = await browserJson(callerPage, `/api/poker/play/hands/${encodeURIComponent(afterShove?.hand?.handId || '')}/actions`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': callerAddress },
    data: {
      actionKind: 'call',
      amountOil: 0,
    },
  });
  expect(resp.ok).toBe(true);

  const settledAResp = await browserJson(pageA, '/api/poker/play/tables/pkt_play_tournament_01', {
    headers: { 'x-wallet-solana-address': userA.address },
  });
  expect(settledAResp.ok).toBe(true);
  const settledA = settledAResp.body?.data || {};
  const settledBResp = await browserJson(pageB, '/api/poker/play/tables/pkt_play_tournament_01', {
    headers: { 'x-wallet-solana-address': userB.address },
  });
  expect(settledBResp.ok).toBe(true);
  const settledB = settledBResp.body?.data || {};

  expect(settledA?.table?.summary?.completedAt).toBeTruthy();
  expect(Number(settledA?.table?.summary?.winnerSeatNumber || 0)).toBeGreaterThan(0);

  const winnerSeat = Number(settledA?.table?.summary?.winnerSeatNumber || 0);
  const winnerView = winnerSeat === 1 ? settledA : settledB;
  const loserView = winnerSeat === 1 ? settledB : settledA;
  const winnerStartingBalance = Number(winnerSeat === 1 ? fundedA?.oilBalance?.balance || 0 : fundedB?.oilBalance?.balance || 0);
  const loserStartingBalance = Number(winnerSeat === 1 ? fundedB?.oilBalance?.balance || 0 : fundedA?.oilBalance?.balance || 0);
  const winnerBalance = winnerSeat === 1
    ? Number(settledA?.oilBalance?.balance || 0)
    : Number(settledB?.oilBalance?.balance || 0);
  const loserBalance = winnerSeat === 1
    ? Number(settledB?.oilBalance?.balance || 0)
    : Number(settledA?.oilBalance?.balance || 0);

  expect(winnerView?.mySeat?.status).toBe('paid');
  expect(loserView?.mySeat?.status).toBe('busted');
  expect(Number(winnerView?.mySeat?.stackOil || 0)).toBeGreaterThanOrEqual(600);
  expect(Number(loserView?.mySeat?.stackOil || 0)).toBe(0);
  expect(winnerBalance).toBe(winnerStartingBalance + 300);
  expect(loserBalance).toBe(loserStartingBalance - 300);
  expect(winnerBalance).toBeGreaterThan(loserBalance);

  await contextA.close();
  await contextB.close();
});
