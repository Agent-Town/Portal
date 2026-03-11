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

async function getTable(page, address, { asOf } = {}) {
  const path = asOf
    ? `/api/poker/play/tables/pkt_play_tournament_01?asOf=${encodeURIComponent(asOf)}`
    : '/api/poker/play/tables/pkt_play_tournament_01';
  const resp = await browserJson(page, path, {
    headers: { 'x-wallet-solana-address': address },
  });
  expect(resp.ok).toBe(true);
  return resp.body?.data || {};
}

async function foldCurrentHand({ pageA, pageB, userA, userB, asOf }) {
  const detail = await getTable(pageA, userA.address, { asOf });
  const actingSeat = Number(detail?.hand?.actingSeat || 0);
  const handId = String(detail?.hand?.handId || '');
  expect(handId).toBeTruthy();
  const actorPage = actingSeat === 1 ? pageA : pageB;
  const actorAddress = actingSeat === 1 ? userA.address : userB.address;
  const resp = await browserJson(actorPage, `/api/poker/play/hands/${encodeURIComponent(handId)}/actions`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': actorAddress },
    data: {
      actionKind: 'fold',
      amountOil: 0,
      asOf,
    },
  });
  expect(resp.ok).toBe(true);
  return await getTable(pageA, userA.address, { asOf });
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M23.10: tournament blind levels advance after the configured number of hands', async ({ browser, request }) => {
  const sitAt = '2026-03-10T12:00:00.500Z';
  const userA = {
    address: 'So1anaMockTourA111111111111111111111111111111',
    houseId: 'house_tour_blind_a',
    streamId: 'stream-tour-blind-a',
  };
  const userB = {
    address: 'So1anaMockTourB111111111111111111111111111111',
    houseId: 'house_tour_blind_b',
    streamId: 'stream-tour-blind-b',
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

  let resp = await browserJson(pageA, '/api/poker/play/tables/pkt_play_tournament_01/sit', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': userA.address },
    data: {
      seatNumber: 1,
      displayName: 'Alpha Blind',
      asOf: sitAt,
    },
  });
  expect(resp.ok).toBe(true);

  resp = await browserJson(pageB, '/api/poker/play/tables/pkt_play_tournament_01/sit', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': userB.address },
    data: {
      seatNumber: 2,
      displayName: 'Bravo Blind',
      asOf: sitAt,
    },
  });
  expect(resp.ok).toBe(true);

  let detail = await getTable(pageA, userA.address, { asOf: sitAt });
  expect(Number(detail?.hand?.handNumber || 0)).toBe(1);
  expect(Number(detail?.table?.smallBlindOil || 0)).toBe(50);
  expect(Number(detail?.table?.bigBlindOil || 0)).toBe(100);
  expect(Number(detail?.table?.summary?.blindLevel || 0)).toBe(1);
  expect(Number(detail?.table?.summary?.nextBlindLevel || 0)).toBe(2);
  expect(Number(detail?.table?.summary?.handsUntilBlindIncrease || 0)).toBe(2);
  expect(Number(detail?.hand?.blindLevel || 0)).toBe(1);

  detail = await foldCurrentHand({
    pageA,
    pageB,
    userA,
    userB,
    asOf: '2026-03-10T12:00:01.000Z',
  });
  expect(Number(detail?.hand?.handNumber || 0)).toBe(2);
  expect(Number(detail?.table?.smallBlindOil || 0)).toBe(50);
  expect(Number(detail?.table?.bigBlindOil || 0)).toBe(100);
  expect(Number(detail?.table?.summary?.blindLevel || 0)).toBe(1);
  expect(Number(detail?.table?.summary?.nextBlindLevel || 0)).toBe(2);
  expect(Number(detail?.table?.summary?.handsUntilBlindIncrease || 0)).toBe(1);
  expect(Number(detail?.hand?.blindLevel || 0)).toBe(1);

  detail = await foldCurrentHand({
    pageA,
    pageB,
    userA,
    userB,
    asOf: '2026-03-10T12:00:02.000Z',
  });
  expect(Number(detail?.hand?.handNumber || 0)).toBe(3);
  expect(Number(detail?.table?.smallBlindOil || 0)).toBe(75);
  expect(Number(detail?.table?.bigBlindOil || 0)).toBe(150);
  expect(Number(detail?.table?.summary?.blindLevel || 0)).toBe(2);
  expect(Number(detail?.table?.summary?.nextBlindLevel || 0)).toBe(3);
  expect(Number(detail?.table?.summary?.handsUntilBlindIncrease || 0)).toBe(2);
  expect(Number(detail?.hand?.blindLevel || 0)).toBe(2);

  await contextA.close();
  await contextB.close();
});
