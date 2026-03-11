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

test('M23.17: tournament tables with the same structure aggregate into one series across overflow table creation', async ({ browser, request }) => {
  const users = [
    { address: 'So1anaMockSeriesA111111111111111111111111111', houseId: 'house_series_a', streamId: 'stream-series-a' },
    { address: 'So1anaMockSeriesB111111111111111111111111111', houseId: 'house_series_b', streamId: 'stream-series-b' },
    { address: 'So1anaMockSeriesC111111111111111111111111111', houseId: 'house_series_c', streamId: 'stream-series-c' },
    { address: 'So1anaMockSeriesD111111111111111111111111111', houseId: 'house_series_d', streamId: 'stream-series-d' },
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
      displayName: 'Series Alpha',
    },
  });
  expect(resp.ok).toBe(true);
  const tableIdA = String(resp.body?.data?.table?.tableId || '');
  const seriesId = String(resp.body?.data?.series?.seriesId || resp.body?.data?.table?.rules?.seriesId || '');
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
      displayName: 'Series Bravo',
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
      displayName: 'Series Charlie',
    },
  });
  expect(resp.ok).toBe(true);
  expect(String(resp.body?.data?.table?.tableId || '')).toBe(tableIdA);
  expect(resp.body?.data?.mySeat?.status).toBe('registered');

  const liveDetail = await getTable(pages[0], users[0].address, tableIdA, {
    asOf: '2026-03-10T12:00:03.000Z',
  });
  const actingSeat = Number(liveDetail?.hand?.actingSeat || 0);
  const actorPage = actingSeat === 1 ? pages[0] : pages[1];
  const actorAddress = actingSeat === 1 ? users[0].address : users[1].address;
  resp = await browserJson(actorPage, `/api/poker/play/hands/${encodeURIComponent(liveDetail?.hand?.handId || '')}/actions`, {
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
      displayName: 'Series Delta',
      asOf: '2026-03-10T12:00:04.000Z',
    },
  });
  expect(resp.ok).toBe(true);
  const tableIdB = String(resp.body?.data?.table?.tableId || '');
  expect(tableIdB).toBeTruthy();
  expect(tableIdB).not.toBe(tableIdA);
  expect(String(resp.body?.data?.series?.seriesId || '')).toBe(seriesId);

  const lobbyResp = await browserJson(pages[0], '/api/poker/play/tables?asOf=2026-03-10T12%3A00%3A04.000Z', {
    headers: { 'x-wallet-solana-address': users[0].address },
  });
  expect(lobbyResp.ok).toBe(true);
  const lobby = lobbyResp.body?.data || {};
  expect(Array.isArray(lobby?.series)).toBe(true);
  const groupedSeries = lobby.series.find((item) => String(item?.seriesId || '') === seriesId);
  expect(groupedSeries).toBeTruthy();
  expect(Number(groupedSeries?.tableCount || 0)).toBe(2);
  expect(Number(groupedSeries?.entrantCount || 0)).toBe(4);
  expect(Array.isArray(groupedSeries?.tableIds)).toBe(true);
  expect(groupedSeries.tableIds).toEqual(expect.arrayContaining([tableIdA, tableIdB]));
  expect(String(groupedSeries?.currentUserTableId || '')).toBe(tableIdA);

  const tournamentItems = Array.isArray(lobby.items)
    ? lobby.items.filter((item) => item.tableType === 'tournament' && String(item.seriesId || '') === seriesId)
    : [];
  expect(tournamentItems).toHaveLength(2);
  expect(new Set(tournamentItems.map((item) => String(item.seriesId || ''))).size).toBe(1);

  const detailAfterSplit = await getTable(pages[0], users[0].address, tableIdA, {
    asOf: '2026-03-10T12:00:04.000Z',
  });
  expect(String(detailAfterSplit?.series?.seriesId || '')).toBe(seriesId);
  expect(Number(detailAfterSplit?.series?.tableCount || 0)).toBe(2);
  expect(Number(detailAfterSplit?.series?.entrantCount || 0)).toBe(4);

  await Promise.all(contexts.map((context) => context.close()));
});
