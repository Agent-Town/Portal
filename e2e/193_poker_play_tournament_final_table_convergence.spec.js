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
  while (ticks < 6) {
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

test('M23.19: tournament series converges active seats onto a final table between hands when total entrants fit one table', async ({ browser, request }) => {
  const users = [
    { address: 'So1anaMockSeriesA111111111111111111111111111', houseId: 'house_final_a', streamId: 'stream-final-a' },
    { address: 'So1anaMockSeriesB111111111111111111111111111', houseId: 'house_final_b', streamId: 'stream-final-b' },
    { address: 'So1anaMockSeriesC111111111111111111111111111', houseId: 'house_final_c', streamId: 'stream-final-c' },
    { address: 'So1anaMockSeriesD111111111111111111111111111', houseId: 'house_final_d', streamId: 'stream-final-d' },
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
      displayName: 'Final Alpha',
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
      displayName: 'Final Bravo',
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
      displayName: 'Final Charlie',
    },
  });
  expect(resp.ok).toBe(true);
  expect(String(resp.body?.data?.table?.tableId || '')).toBe(tableIdA);

  const afterLateReg = await settleCurrentTableHand(tableIdA, {
    1: { page: pages[0], address: users[0].address },
    2: { page: pages[1], address: users[1].address },
    3: { page: pages[2], address: users[2].address },
  }, { asOfPrefix: '2026-03-10T12:00:03' });
  expect(Number(afterLateReg?.hand?.handNumber || 0)).toBeGreaterThanOrEqual(2);

  resp = await browserJson(pages[3], '/api/poker/play/matchmake', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[3].address },
    data: {
      tableType: 'tournament',
      smallBlindOil: 75,
      bigBlindOil: 150,
      buyInOil: 600,
      lateRegistrationHands: 1,
      displayName: 'Final Delta',
      asOf: '2026-03-10T12:00:04.000Z',
    },
  });
  expect(resp.ok).toBe(true);
  const tableIdB = String(resp.body?.data?.table?.tableId || '');
  expect(tableIdB).toBeTruthy();
  expect(tableIdB).not.toBe(tableIdA);
  expect(String(resp.body?.data?.series?.seriesId || '')).toBe(seriesId);

  const afterConvergence = await settleCurrentTableHand(tableIdA, {
    1: { page: pages[0], address: users[0].address },
    2: { page: pages[1], address: users[1].address },
    3: { page: pages[2], address: users[2].address },
  }, { asOfPrefix: '2026-03-10T12:00:05' });

  const movedView = await getTable(pages[3], users[3].address, tableIdA, {
    asOf: '2026-03-10T12:00:06.000Z',
  });
  expect(Number(movedView?.hand?.handNumber || 0)).toBeGreaterThan(Number(afterLateReg?.hand?.handNumber || 0));
  expect(Number(movedView?.table?.summary?.occupancy || 0)).toBe(4);
  expect(String(movedView?.series?.seriesId || '')).toBe(seriesId);
  expect(Number(movedView?.series?.tableCount || 0)).toBe(1);
  expect(movedView?.mySeat).toBeTruthy();
  expect(Number(movedView?.mySeat?.seatNumber || 0)).toBeGreaterThan(0);

  const overflowView = await getTable(pages[3], users[3].address, tableIdB, {
    asOf: '2026-03-10T12:00:06.000Z',
  });
  expect(String(overflowView?.table?.status || '')).toBe('series_closed');
  expect(overflowView?.mySeat).toBe(null);

  const lobbyResp = await browserJson(pages[0], '/api/poker/play/tables?asOf=2026-03-10T12%3A00%3A06.000Z', {
    headers: { 'x-wallet-solana-address': users[0].address },
  });
  expect(lobbyResp.ok).toBe(true);
  const lobby = lobbyResp.body?.data || {};
  const activeSeries = Array.isArray(lobby.series)
    ? lobby.series.find((item) => String(item?.seriesId || '') === seriesId)
    : null;
  expect(activeSeries).toBeTruthy();
  expect(Number(activeSeries?.tableCount || 0)).toBe(1);
  expect(Number(activeSeries?.entrantCount || 0)).toBe(4);

  await Promise.all(contexts.map((context) => context.close()));
});
