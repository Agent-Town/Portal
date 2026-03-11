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

const ADMIN_HEADERS = { 'x-admin-token': 'test-admin' };

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M23.27: admin can cancel a multi-table tournament series and refund unresolved buy-ins', async ({ browser, request }) => {
  const users = [
    { address: 'So1anaMockSeriesCoseA111111111111111111111111111', houseId: 'house_series_close_a', streamId: 'stream-series-close-a' },
    { address: 'So1anaMockSeriesCoseB111111111111111111111111111', houseId: 'house_series_close_b', streamId: 'stream-series-close-b' },
    { address: 'So1anaMockSeriesCoseC111111111111111111111111111', houseId: 'house_series_close_c', streamId: 'stream-series-close-c' },
    { address: 'So1anaMockSeriesCoseD111111111111111111111111111', houseId: 'house_series_close_d', streamId: 'stream-series-close-d' },
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
      displayName: 'Series Close Alpha',
    },
  });
  expect(resp.ok).toBe(true);
  const tableIdA = String(resp.body?.data?.table?.tableId || '');
  const seriesId = String(resp.body?.data?.series?.seriesId || resp.body?.data?.table?.rules?.seriesId || '');
  const normalizedBuyInOil = Number(resp.body?.data?.table?.buyInOil || 0);
  expect(tableIdA).toBeTruthy();
  expect(seriesId).toBeTruthy();
  expect(normalizedBuyInOil).toBeGreaterThan(0);

  resp = await browserJson(pages[1], '/api/poker/play/matchmake', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[1].address },
    data: {
      tableType: 'tournament',
      smallBlindOil: 75,
      bigBlindOil: 150,
      buyInOil: 600,
      lateRegistrationHands: 1,
      displayName: 'Series Close Bravo',
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
      displayName: 'Series Close Charlie',
    },
  });
  expect(resp.ok).toBe(true);

  const liveDetailResp = await browserJson(pages[0], `/api/poker/play/tables/${encodeURIComponent(tableIdA)}?asOf=2026-03-10T12%3A00%3A03.000Z`, {
    headers: { 'x-wallet-solana-address': users[0].address },
  });
  expect(liveDetailResp.ok).toBe(true);
  const handId = String(liveDetailResp.body?.data?.hand?.handId || '');
  const actingSeat = Number(liveDetailResp.body?.data?.hand?.actingSeat || 0);
  const actorPage = actingSeat === 1 ? pages[0] : pages[1];
  const actorAddress = actingSeat === 1 ? users[0].address : users[1].address;
  resp = await browserJson(actorPage, `/api/poker/play/hands/${encodeURIComponent(handId)}/actions`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': actorAddress },
    data: {
      actionKind: 'fold',
      amountOil: 0,
      asOf: '2026-03-10T12:00:03.000Z',
    },
  });
  expect(resp.ok).toBe(true);

  resp = await browserJson(pages[3], '/api/poker/play/matchmake', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[3].address },
    data: {
      tableType: 'tournament',
      smallBlindOil: 75,
      bigBlindOil: 150,
      buyInOil: 600,
      lateRegistrationHands: 1,
      displayName: 'Series Close Delta',
      asOf: '2026-03-10T12:00:04.000Z',
    },
  });
  expect(resp.ok).toBe(true);
  const tableIdB = String(resp.body?.data?.table?.tableId || '');
  expect(tableIdB).toBeTruthy();
  expect(tableIdB).not.toBe(tableIdA);

  const startingBalances = new Map();
  for (let index = 0; index < users.length; index += 1) {
    const balanceResp = await browserJson(pages[index], '/api/oil/balance', {
      headers: { 'x-wallet-solana-address': users[index].address },
    });
    expect(balanceResp.ok).toBe(true);
    startingBalances.set(users[index].address, Number(balanceResp.body?.data?.oilBalance?.balance || 0));
  }

  const seriesCloseResp = await request.post(`/api/poker/play/admin/series/${encodeURIComponent(seriesId)}/close`, {
    headers: ADMIN_HEADERS,
    data: {
      reason: 'Operator closed the tournament series.',
      asOf: '2026-03-10T12:00:05.000Z',
    },
  });
  expect(seriesCloseResp.ok()).toBe(true);
  const seriesCloseBody = await seriesCloseResp.json();
  expect(seriesCloseBody?.data?.series?.stage).toBe('cancelled');
  expect(Number(seriesCloseBody?.data?.series?.adminClosedTableCount || 0)).toBe(2);
  expect(Number(seriesCloseBody?.data?.series?.refundedSeatCount || 0)).toBe(4);
  expect(Number(seriesCloseBody?.data?.series?.refundedTotalOil || 0)).toBe(normalizedBuyInOil * 4);
  expect(seriesCloseBody?.data?.series?.activeTableId).toBe(null);
  expect(seriesCloseBody?.data?.refundSummary?.refundMode).toBe('buy_in');
  expect(Number(seriesCloseBody?.data?.refundSummary?.closedTableCount || 0)).toBe(2);
  expect(Number(seriesCloseBody?.data?.refundSummary?.refundedSeatCount || 0)).toBe(4);
  expect(Number(seriesCloseBody?.data?.refundSummary?.refundedTotalOil || 0)).toBe(normalizedBuyInOil * 4);
  expect(Array.isArray(seriesCloseBody?.data?.closedTableIds)).toBe(true);
  expect(seriesCloseBody.data.closedTableIds).toEqual(expect.arrayContaining([tableIdA, tableIdB]));
  expect(Array.isArray(seriesCloseBody?.data?.newlyClosedTables)).toBe(true);
  expect(seriesCloseBody.data.newlyClosedTables).toHaveLength(2);
  expect(Array.isArray(seriesCloseBody?.data?.tables)).toBe(true);
  expect(seriesCloseBody.data.tables).toHaveLength(0);

  for (let index = 0; index < users.length; index += 1) {
    const balanceResp = await browserJson(pages[index], '/api/oil/balance', {
      headers: { 'x-wallet-solana-address': users[index].address },
    });
    expect(balanceResp.ok).toBe(true);
    expect(Number(balanceResp.body?.data?.oilBalance?.balance || 0)).toBe(startingBalances.get(users[index].address) + normalizedBuyInOil);
  }

  const closedTableRespA = await browserJson(pages[0], `/api/poker/play/tables/${encodeURIComponent(tableIdA)}?asOf=2026-03-10T12%3A00%3A05.000Z`, {
    headers: { 'x-wallet-solana-address': users[0].address },
  });
  expect(closedTableRespA.ok).toBe(true);
  expect(closedTableRespA.body?.data?.table?.status).toBe('admin_closed');

  const closedTableRespB = await browserJson(pages[3], `/api/poker/play/tables/${encodeURIComponent(tableIdB)}?asOf=2026-03-10T12%3A00%3A05.000Z`, {
    headers: { 'x-wallet-solana-address': users[3].address },
  });
  expect(closedTableRespB.ok).toBe(true);
  expect(closedTableRespB.body?.data?.table?.status).toBe('admin_closed');

  const railSeriesResp = await request.get(`/api/poker/play/rail/series/${encodeURIComponent(seriesId)}?asOf=2026-03-10T12%3A00%3A05.000Z`);
  expect(railSeriesResp.ok()).toBe(true);
  const railSeriesBody = await railSeriesResp.json();
  expect(railSeriesBody?.data?.series?.stage).toBe('cancelled');
  expect(railSeriesBody?.data?.series?.activeTableId).toBe(null);
  expect(Array.isArray(railSeriesBody?.data?.tables)).toBe(true);
  expect(railSeriesBody.data.tables).toHaveLength(0);

  await Promise.all(contexts.map((context) => context.close()));
});
