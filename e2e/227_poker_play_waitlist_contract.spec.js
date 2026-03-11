const { test, expect } = require('@playwright/test');
const {
  fundOilWallet,
  resetPortalWebState,
} = require('./helpers/portal_web');
const {
  bindPageSession,
  browserJson,
  seedPokerPlayHarness,
} = require('./helpers/poker_play');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M22.7: full tables accept waitlist entries and promote the first eligible wallet deterministically', async ({ browser, request }) => {
  const seatOne = {
    address: 'So1anaMockPhase22WaitQAA11111111111111111111111',
    houseId: 'house_phase22_waitlist_a',
    streamId: 'stream-phase22-waitlist-a',
  };
  const waiterOne = {
    address: 'So1anaMockPhase22WaitQCC11111111111111111111111',
    houseId: 'house_phase22_waitlist_c',
    streamId: 'stream-phase22-waitlist-c',
  };
  const waiterTwo = {
    address: 'So1anaMockPhase22WaitQDD11111111111111111111111',
    houseId: 'house_phase22_waitlist_d',
    streamId: 'stream-phase22-waitlist-d',
  };
  await seedPokerPlayHarness(request, {
    scenario: 'waitlist_full_cash',
    asOf: '2026-03-11T10:00:00.000Z',
    tableId: 'pkt_play_phase22_waitlist',
    actors: [
      {
        seatNumber: 1,
        address: seatOne.address,
        houseId: seatOne.houseId,
        displayName: 'Waitlist Alpha',
      },
      {
        seatNumber: 2,
        address: 'So1anaMockPhase22WaitQBB11111111111111111111111',
        houseId: 'house_phase22_waitlist_b',
        displayName: 'Waitlist Bravo',
      },
    ],
  });

  const contextSeatOne = await browser.newContext();
  const pageSeatOne = await contextSeatOne.newPage();
  await pageSeatOne.goto('/');
  await bindPageSession(pageSeatOne, seatOne);

  const contextWaiterOne = await browser.newContext();
  const pageWaiterOne = await contextWaiterOne.newPage();
  await pageWaiterOne.goto('/');
  await bindPageSession(pageWaiterOne, waiterOne);

  const contextWaiterTwo = await browser.newContext();
  const pageWaiterTwo = await contextWaiterTwo.newPage();
  await pageWaiterTwo.goto('/');
  await bindPageSession(pageWaiterTwo, waiterTwo);

  for (const actor of [seatOne, waiterOne, waiterTwo]) {
    await fundOilWallet(request, {
      walletSubject: actor.address,
      houseId: actor.houseId,
      amount: 2000,
    });
  }

  const directJoinResp = await browserJson(pageWaiterOne, '/api/poker/play/tables/pkt_play_phase22_waitlist/sit', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': waiterOne.address },
    data: {
      seatNumber: 1,
      displayName: 'Should Fail',
      buyInOil: 250,
    },
  });
  expect(directJoinResp.ok).toBe(false);
  expect(directJoinResp.body?.error?.code).toBe('POKER_PLAY_TABLE_FULL');

  const joinWaiterOne = await browserJson(pageWaiterOne, '/api/poker/play/tables/pkt_play_phase22_waitlist/waitlist', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': waiterOne.address },
    data: {
      displayName: 'Queue One',
      buyInOil: 250,
    },
  });
  expect(joinWaiterOne.ok).toBe(true);
  expect(Number(joinWaiterOne.body?.data?.waitlist?.viewerPosition || 0)).toBe(1);
  expect(Number(joinWaiterOne.body?.data?.waitlist?.count || 0)).toBe(1);

  const joinWaiterTwo = await browserJson(pageWaiterTwo, '/api/poker/play/tables/pkt_play_phase22_waitlist/waitlist', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': waiterTwo.address },
    data: {
      displayName: 'Queue Two',
      buyInOil: 250,
    },
  });
  expect(joinWaiterTwo.ok).toBe(true);
  expect(Number(joinWaiterTwo.body?.data?.waitlist?.viewerPosition || 0)).toBe(2);
  expect(Number(joinWaiterTwo.body?.data?.waitlist?.count || 0)).toBe(2);

  const beforePromotion = await browserJson(pageWaiterOne, '/api/poker/play/tables/pkt_play_phase22_waitlist', {
    headers: { 'x-wallet-solana-address': waiterOne.address },
  });
  expect(beforePromotion.ok).toBe(true);
  expect(Number(beforePromotion.body?.data?.table?.summary?.waitlistCount || 0)).toBe(2);

  const leaveResp = await browserJson(pageSeatOne, '/api/poker/play/tables/pkt_play_phase22_waitlist/leave', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': seatOne.address },
    data: {
      asOf: '2026-03-11T10:01:00.000Z',
    },
  });
  expect(leaveResp.ok).toBe(true);

  const settleResp = await browserJson(pageSeatOne, `/api/poker/play/hands/${encodeURIComponent(leaveResp.body?.data?.hand?.handId || '')}/actions`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': seatOne.address },
    data: {
      actionKind: 'fold',
      amountOil: 0,
      asOf: '2026-03-11T10:01:30.000Z',
    },
  });
  expect(settleResp.ok).toBe(true);

  const promotedResp = await browserJson(pageWaiterOne, '/api/poker/play/tables/pkt_play_phase22_waitlist?asOf=2026-03-11T10%3A02%3A00.000Z', {
    headers: { 'x-wallet-solana-address': waiterOne.address },
  });
  expect(promotedResp.ok).toBe(true);
  expect(Number(promotedResp.body?.data?.mySeat?.seatNumber || 0)).toBe(1);
  expect(Number(promotedResp.body?.data?.mySeat?.buyInOil || 0)).toBe(250);
  expect(Number(promotedResp.body?.data?.table?.summary?.waitlistCount || 0)).toBe(1);

  const stillWaitingResp = await browserJson(pageWaiterTwo, '/api/poker/play/tables/pkt_play_phase22_waitlist?asOf=2026-03-11T10%3A02%3A00.000Z', {
    headers: { 'x-wallet-solana-address': waiterTwo.address },
  });
  expect(stillWaitingResp.ok).toBe(true);
  expect(stillWaitingResp.body?.data?.mySeat).toBeNull();
  expect(Number(stillWaitingResp.body?.data?.waitlist?.viewerPosition || 0)).toBe(1);
  expect(Number(stillWaitingResp.body?.data?.waitlist?.count || 0)).toBe(1);

  await contextSeatOne.close();
  await contextWaiterOne.close();
  await contextWaiterTwo.close();
});
