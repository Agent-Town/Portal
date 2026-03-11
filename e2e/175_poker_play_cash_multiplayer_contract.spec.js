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

test('M23.1: cash tables support multi-user play, hidden hole cards, and private seat threads', async ({ browser, request }) => {
  const userA = {
    address: 'So1anaMockCashA111111111111111111111111111111',
    houseId: 'house_cash_a',
    streamId: 'stream-cash-a',
  };
  const userB = {
    address: 'So1anaMockCashB111111111111111111111111111111',
    houseId: 'house_cash_b',
    streamId: 'stream-cash-b',
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
  expect(Number(fundedA?.oilBalance?.balance || 0)).toBeGreaterThanOrEqual(1400);

  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();
  await pageB.goto('/');
  await bindPageSession(pageB, userB);
  const fundedB = await verifyStreamflowAndFundOil(pageB, request, {
    address: userB.address,
    streamId: userB.streamId,
  });
  expect(Number(fundedB?.oilBalance?.balance || 0)).toBeGreaterThanOrEqual(1400);

  let resp = await browserJson(pageA, '/api/poker/play/tables/pkt_play_cash_01/sit', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': userA.address },
    data: {
      seatNumber: 1,
      displayName: 'Alpha House',
      buyInOil: 400,
    },
  });
  expect(resp.ok).toBe(true);
  expect(resp.body?.data?.mySeat?.seatNumber).toBe(1);
  expect(Number(resp.body?.data?.oilBalance?.balance || 0)).toBe(Number(fundedA?.oilBalance?.balance || 0) - 400);

  resp = await browserJson(pageB, '/api/poker/play/tables/pkt_play_cash_01/sit', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': userB.address },
    data: {
      seatNumber: 2,
      displayName: 'Bravo House',
      buyInOil: 400,
    },
  });
  expect(resp.ok).toBe(true);
  const joinB = resp.body?.data || {};
  expect(joinB?.hand?.status).toBe('live');
  expect(joinB?.hand?.handNumber).toBe(1);

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

  const seatOneForA = detailA?.seats?.find((seat) => seat.seatNumber === 1);
  const seatTwoForA = detailA?.seats?.find((seat) => seat.seatNumber === 2);
  const seatOneForB = detailB?.seats?.find((seat) => seat.seatNumber === 1);
  const seatTwoForB = detailB?.seats?.find((seat) => seat.seatNumber === 2);

  expect(Array.isArray(seatOneForA?.holeCards) ? seatOneForA.holeCards : []).toHaveLength(2);
  expect(Array.isArray(seatTwoForA?.holeCards) ? seatTwoForA.holeCards : []).toHaveLength(0);
  expect(Number(seatTwoForA?.hiddenCardCount || 0)).toBe(2);
  expect(Array.isArray(seatTwoForB?.holeCards) ? seatTwoForB.holeCards : []).toHaveLength(2);
  expect(Array.isArray(seatOneForB?.holeCards) ? seatOneForB.holeCards : []).toHaveLength(0);
  expect(Number(seatOneForB?.hiddenCardCount || 0)).toBe(2);

  const actingSeat = Number(detailA?.hand?.actingSeat || 0);
  const actorPage = actingSeat === 1 ? pageA : pageB;
  const observerPage = actingSeat === 1 ? pageB : pageA;
  const actorAddress = actingSeat === 1 ? userA.address : userB.address;

  resp = await browserJson(actorPage, `/api/poker/play/hands/${encodeURIComponent(detailA?.hand?.handId || '')}/messages`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': actorAddress },
    data: {
      body: 'Agent, talk me through the lowest-variance line here.',
    },
  });
  expect(resp.ok).toBe(true);
  expect(resp.body?.data?.messages).toHaveLength(2);
  expect(resp.body?.data?.messages?.[1]?.authorRole).toBe('agent');

  const observerAfterMessage = await browserJson(observerPage, '/api/poker/play/tables/pkt_play_cash_01', {
    headers: { 'x-wallet-solana-address': actingSeat === 1 ? userB.address : userA.address },
  });
  expect(observerAfterMessage.ok).toBe(true);
  const observerMessages = Array.isArray(observerAfterMessage.body?.data?.messages) ? observerAfterMessage.body.data.messages : [];
  expect(observerMessages.some((message) => String(message?.body || '').includes('lowest-variance'))).toBe(false);

  const actorDetail = actingSeat === 1 ? detailA : detailB;
  const firstAction = actorDetail?.hand?.viewerAllowedActions?.includes('raise')
    ? 'raise'
    : actorDetail?.hand?.viewerAllowedActions?.includes('bet')
      ? 'bet'
      : actorDetail?.hand?.viewerAllowedActions?.[0];
  expect(firstAction).toBeTruthy();

  resp = await browserJson(actorPage, `/api/poker/play/hands/${encodeURIComponent(actorDetail?.hand?.handId || '')}/actions`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': actorAddress },
    data: {
      actionKind: firstAction,
      amountOil: 400,
    },
  });
  expect(resp.ok).toBe(true);
  expect(resp.body?.data?.hand?.status).toBe('live');

  const postFirstAction = resp.body?.data || {};
  const nextActingSeat = Number(postFirstAction?.hand?.actingSeat || 0);
  const nextActorPage = nextActingSeat === 1 ? pageA : pageB;
  const nextActorAddress = nextActingSeat === 1 ? userA.address : userB.address;
  expect(nextActingSeat).not.toBe(actingSeat);

  const nextActorDetailResp = await browserJson(nextActorPage, '/api/poker/play/tables/pkt_play_cash_01', {
    headers: { 'x-wallet-solana-address': nextActorAddress },
  });
  expect(nextActorDetailResp.ok).toBe(true);
  const nextActorDetail = nextActorDetailResp.body?.data || {};
  const secondAction = nextActorDetail?.hand?.viewerAllowedActions?.includes('fold')
    ? 'fold'
    : nextActorDetail?.hand?.viewerAllowedActions?.includes('call')
        ? 'call'
        : nextActorDetail?.hand?.viewerAllowedActions?.includes('check')
          ? 'check'
          : nextActorDetail?.hand?.viewerAllowedActions?.[0];
  expect(secondAction).toBeTruthy();

  resp = await browserJson(nextActorPage, `/api/poker/play/hands/${encodeURIComponent(postFirstAction?.hand?.handId || '')}/actions`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': nextActorAddress },
    data: {
      actionKind: secondAction,
      amountOil: secondAction === 'call' ? 0 : 400,
    },
  });
  expect(resp.ok).toBe(true);

  const nextHandResp = await browserJson(pageA, '/api/poker/play/tables/pkt_play_cash_01?asOf=2026-03-10T14%3A00%3A00.000Z', {
    headers: { 'x-wallet-solana-address': userA.address },
  });
  expect(nextHandResp.ok).toBe(true);
  expect(Number(nextHandResp.body?.data?.hand?.handNumber || 0)).toBeGreaterThanOrEqual(2);
  expect(nextHandResp.body?.data?.table?.summary?.liveHand).toBe(true);

  await contextA.close();
  await contextB.close();
});
