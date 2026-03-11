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

async function getTable(page, address, tableId, { asOf } = {}) {
  const path = asOf
    ? `/api/poker/play/tables/${encodeURIComponent(tableId)}?asOf=${encodeURIComponent(asOf)}`
    : `/api/poker/play/tables/${encodeURIComponent(tableId)}`;
  const resp = await browserJson(page, path, {
    headers: { 'x-wallet-solana-address': address },
  });
  expect(resp.ok).toBe(true);
  return resp.body?.data || {};
}

async function settleCurrentTableHand(tableId, seatActors, { asOfPrefix }) {
  let ticks = 0;
  let detail = await getTable(seatActors[1].page, seatActors[1].address, tableId, {
    asOf: `${asOfPrefix}:00.000Z`,
  });
  const startingHandNumber = Number(detail?.hand?.handNumber || 0);
  expect(startingHandNumber).toBeGreaterThan(0);
  while (ticks < 8) {
    const actingSeat = Number(detail?.hand?.actingSeat || 0);
    const actor = seatActors[actingSeat];
    expect(actor).toBeTruthy();
    const handId = String(detail?.hand?.handId || '');
    expect(handId).toBeTruthy();
    const atSecond = String(ticks + 1).padStart(2, '0');
    const resp = await browserJson(actor.page, `/api/poker/play/hands/${encodeURIComponent(handId)}/actions`, {
      method: 'POST',
      headers: { 'x-wallet-solana-address': actor.address },
      data: {
        actionKind: 'fold',
        amountOil: 0,
        asOf: `${asOfPrefix}:${atSecond}.000Z`,
      },
    });
    expect(resp.ok).toBe(true);
    detail = await getTable(seatActors[1].page, seatActors[1].address, tableId, {
      asOf: `${asOfPrefix}:${atSecond}.000Z`,
    });
    if (Number(detail?.hand?.handNumber || 0) > startingHandNumber) {
      return detail;
    }
    ticks += 1;
  }
  throw new Error('HAND_DID_NOT_ADVANCE');
}

test('M23.20: tournament series rebalances overflow seats onto shorter live tables and activates them on the destination next hand', async ({ browser, request }) => {
  const users = [
    { address: 'So1anaMockMatchA11111111111111111111111111111', houseId: 'house_rebal_a', streamId: 'stream-rebal-a' },
    { address: 'So1anaMockMatchB11111111111111111111111111111', houseId: 'house_rebal_b', streamId: 'stream-rebal-b' },
    { address: 'So1anaMockMatchC11111111111111111111111111111', houseId: 'house_rebal_c', streamId: 'stream-rebal-c' },
    { address: 'So1anaMockMatchD11111111111111111111111111111', houseId: 'house_rebal_d', streamId: 'stream-rebal-d' },
    { address: 'So1anaMockMatchE11111111111111111111111111111', houseId: 'house_rebal_e', streamId: 'stream-rebal-e' },
    { address: 'So1anaMockMatchF11111111111111111111111111111', houseId: 'house_rebal_f', streamId: 'stream-rebal-f' },
    { address: 'So1anaMockSeriesA111111111111111111111111111', houseId: 'house_rebal_g', streamId: 'stream-rebal-g' },
    { address: 'So1anaMockSeriesB111111111111111111111111111', houseId: 'house_rebal_h', streamId: 'stream-rebal-h' },
  ];

  await seedStreamflowLocks(request, {
    locks: users.map((user) => ({
      address: user.address,
      streamId: user.streamId,
      tokenSymbol: '$AGENTTOWN',
      locked: true,
      lockedAmountAtomic: '2500000',
    })),
  });

  const contexts = [];
  const pages = [];
  for (const user of users) {
    const context = await browser.newContext();
    const page = await context.newPage();
    contexts.push(context);
    pages.push(page);
    await page.goto('/');
    await bindPageSession(page, user);
    await verifyStreamflowAndFundOil(page, request, {
      address: user.address,
      streamId: user.streamId,
    });
  }

  let resp = await browserJson(pages[0], '/api/poker/play/matchmake', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[0].address },
    data: {
      tableType: 'tournament',
      smallBlindOil: 75,
      bigBlindOil: 150,
      buyInOil: 600,
      lateRegistrationHands: 1,
      displayName: 'Rebalance Alpha',
    },
  });
  expect(resp.ok).toBe(true);
  const tableIdA = String(resp.body?.data?.table?.tableId || '');
  const seriesId = String(resp.body?.data?.series?.seriesId || '');
  expect(tableIdA).toBeTruthy();
  expect(seriesId).toBeTruthy();

  resp = await browserJson(pages[1], '/api/poker/play/matchmake', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[1].address },
    data: {
      tableType: 'tournament',
      smallBlindOil: 75,
      bigBlindOil: 150,
      buyInOil: 600,
      lateRegistrationHands: 1,
      displayName: 'Rebalance Bravo',
    },
  });
  expect(resp.ok).toBe(true);
  expect(String(resp.body?.data?.table?.tableId || '')).toBe(tableIdA);

  resp = await browserJson(pages[2], '/api/poker/play/matchmake', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[2].address },
    data: {
      tableType: 'tournament',
      smallBlindOil: 75,
      bigBlindOil: 150,
      buyInOil: 600,
      lateRegistrationHands: 1,
      displayName: 'Rebalance Charlie',
    },
  });
  expect(resp.ok).toBe(true);
  expect(String(resp.body?.data?.table?.tableId || '')).toBe(tableIdA);
  expect(resp.body?.data?.mySeat?.status).toBe('registered');

  const afterLateRegClose = await settleCurrentTableHand(tableIdA, {
    1: { page: pages[0], address: users[0].address },
    2: { page: pages[1], address: users[1].address },
  }, { asOfPrefix: '2026-03-10T12:00:03' });
  expect(Number(afterLateRegClose?.hand?.handNumber || 0)).toBeGreaterThanOrEqual(2);
  expect(afterLateRegClose?.table?.summary?.lateRegistrationOpen).toBe(false);
  expect(Number(afterLateRegClose?.table?.summary?.occupancy || 0)).toBe(3);

  resp = await browserJson(pages[3], '/api/poker/play/matchmake', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[3].address },
    data: {
      tableType: 'tournament',
      smallBlindOil: 75,
      bigBlindOil: 150,
      buyInOil: 600,
      lateRegistrationHands: 1,
      displayName: 'Rebalance Delta',
      asOf: '2026-03-10T12:00:04.000Z',
    },
  });
  expect(resp.ok).toBe(true);
  const tableIdB = String(resp.body?.data?.table?.tableId || '');
  expect(tableIdB).toBeTruthy();
  expect(tableIdB).not.toBe(tableIdA);
  expect(String(resp.body?.data?.series?.seriesId || '')).toBe(seriesId);

  resp = await browserJson(pages[4], '/api/poker/play/matchmake', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[4].address },
    data: {
      tableType: 'tournament',
      smallBlindOil: 75,
      bigBlindOil: 150,
      buyInOil: 600,
      lateRegistrationHands: 1,
      displayName: 'Rebalance Echo',
      asOf: '2026-03-10T12:00:05.000Z',
    },
  });
  expect(resp.ok).toBe(true);
  expect(String(resp.body?.data?.table?.tableId || '')).toBe(tableIdB);

  for (let index = 5; index < users.length; index += 1) {
    resp = await browserJson(pages[index], '/api/poker/play/matchmake', {
      method: 'POST',
      headers: { 'x-wallet-solana-address': users[index].address },
      data: {
        tableType: 'tournament',
        smallBlindOil: 75,
        bigBlindOil: 150,
        buyInOil: 600,
        lateRegistrationHands: 1,
        displayName: `Rebalance User ${index + 1}`,
        asOf: `2026-03-10T12:00:0${index + 1}.000Z`,
      },
    });
    expect(resp.ok).toBe(true);
    expect(String(resp.body?.data?.table?.tableId || '')).toBe(tableIdB);
  }

  const afterOverflowRebalance = await settleCurrentTableHand(tableIdB, {
    1: { page: pages[3], address: users[3].address },
    2: { page: pages[4], address: users[4].address },
    3: { page: pages[5], address: users[5].address },
    4: { page: pages[6], address: users[6].address },
    5: { page: pages[7], address: users[7].address },
  }, { asOfPrefix: '2026-03-10T12:00:10' });
  expect(Number(afterOverflowRebalance?.table?.summary?.occupancy || 0)).toBe(4);
  expect(String(afterOverflowRebalance?.series?.seriesId || '')).toBe(seriesId);
  expect(Number(afterOverflowRebalance?.series?.tableCount || 0)).toBe(2);

  const movedSeatView = await getTable(pages[7], users[7].address, tableIdA, {
    asOf: '2026-03-10T12:00:12.000Z',
  });
  expect(movedSeatView?.mySeat).toBeTruthy();
  expect(movedSeatView?.mySeat?.status).toBe('registered');
  expect(Number(movedSeatView?.mySeat?.seatNumber || 0)).toBeGreaterThan(0);
  expect(Number(movedSeatView?.table?.summary?.occupancy || 0)).toBe(4);
  expect(String(movedSeatView?.series?.seriesId || '')).toBe(seriesId);
  expect(Number(movedSeatView?.series?.tableCount || 0)).toBe(2);
  expect(Number(movedSeatView?.series?.entrantCount || 0)).toBe(8);

  const sourceOverflowView = await getTable(pages[7], users[7].address, tableIdB, {
    asOf: '2026-03-10T12:00:12.000Z',
  });
  expect(sourceOverflowView?.mySeat).toBe(null);
  expect(Number(sourceOverflowView?.table?.summary?.occupancy || 0)).toBe(4);

  const activatedDestination = await settleCurrentTableHand(tableIdA, {
    1: { page: pages[0], address: users[0].address },
    2: { page: pages[1], address: users[1].address },
    3: { page: pages[2], address: users[2].address },
  }, { asOfPrefix: '2026-03-10T12:00:20' });
  expect(Number(activatedDestination?.hand?.handNumber || 0)).toBeGreaterThan(Number(afterLateRegClose?.hand?.handNumber || 0));

  const activeSeatView = await getTable(pages[7], users[7].address, tableIdA, {
    asOf: '2026-03-10T12:00:21.000Z',
  });
  expect(activeSeatView?.mySeat).toBeTruthy();
  expect(activeSeatView?.mySeat?.status).toBe('active');
  expect(Number(activeSeatView?.table?.summary?.occupancy || 0)).toBe(4);
  expect(Number(activeSeatView?.series?.tableCount || 0)).toBe(2);

  await Promise.all(contexts.map((context) => context.close()));
});
