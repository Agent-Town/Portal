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

test('M23.18: public rail series endpoint aggregates the full tournament field without player-private data', async ({ browser, request }) => {
  const users = [
    { address: 'So1anaMockSeriesRaiA111111111111111111111111', houseId: 'house_series_rail_a', streamId: 'stream-series-rail-a' },
    { address: 'So1anaMockSeriesRaiB111111111111111111111111', houseId: 'house_series_rail_b', streamId: 'stream-series-rail-b' },
    { address: 'So1anaMockSeriesRaiC111111111111111111111111', houseId: 'house_series_rail_c', streamId: 'stream-series-rail-c' },
    { address: 'So1anaMockSeriesRaiD111111111111111111111111', houseId: 'house_series_rail_d', streamId: 'stream-series-rail-d' },
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
      displayName: 'Series Rail Alpha',
    },
  });
  expect(resp.ok).toBe(true);
  const tableIdA = String(resp.body?.data?.table?.tableId || '');
  const seriesId = String(resp.body?.data?.series?.seriesId || resp.body?.data?.table?.rules?.seriesId || '');

  resp = await browserJson(pages[1], '/api/poker/play/matchmake', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[1].address },
    data: {
      tableType: 'tournament',
      smallBlindOil: 75,
      bigBlindOil: 150,
      buyInOil: 600,
      lateRegistrationHands: 1,
      displayName: 'Series Rail Bravo',
    },
  });
  expect(resp.ok).toBe(true);

  resp = await browserJson(pages[2], '/api/poker/play/matchmake', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[2].address },
    data: {
      tableType: 'tournament',
      smallBlindOil: 75,
      bigBlindOil: 150,
      buyInOil: 600,
      lateRegistrationHands: 1,
      displayName: 'Series Rail Charlie',
    },
  });
  expect(resp.ok).toBe(true);

  const detailResp = await browserJson(pages[0], `/api/poker/play/tables/${encodeURIComponent(tableIdA)}?asOf=2026-03-10T12%3A00%3A03.000Z`, {
    headers: { 'x-wallet-solana-address': users[0].address },
  });
  expect(detailResp.ok).toBe(true);
  const actingSeat = Number(detailResp.body?.data?.hand?.actingSeat || 0);
  const actorPage = actingSeat === 1 ? pages[0] : pages[1];
  const actorAddress = actingSeat === 1 ? users[0].address : users[1].address;
  resp = await browserJson(actorPage, `/api/poker/play/hands/${encodeURIComponent(detailResp.body?.data?.hand?.handId || '')}/actions`, {
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
      displayName: 'Series Rail Delta',
      asOf: '2026-03-10T12:00:04.000Z',
    },
  });
  expect(resp.ok).toBe(true);
  const tableIdB = String(resp.body?.data?.table?.tableId || '');

  const railSeriesResponse = await request.get(`/api/poker/play/rail/series/${encodeURIComponent(seriesId)}?asOf=2026-03-10T12%3A00%3A04.000Z`);
  expect(railSeriesResponse.ok()).toBe(true);
  const railSeriesBody = await railSeriesResponse.json();
  const payload = railSeriesBody?.data || {};
  expect(payload.viewerMode).toBe('public');
  expect(payload.wallet).toBeNull();
  expect(payload.oilBalance).toBeNull();
  expect(String(payload?.series?.seriesId || '')).toBe(seriesId);
  expect(Number(payload?.series?.tableCount || 0)).toBe(2);
  expect(Number(payload?.series?.entrantCount || 0)).toBe(4);
  expect(Array.isArray(payload?.series?.tableIds)).toBe(true);
  expect(payload.series.tableIds).toEqual(expect.arrayContaining([tableIdA, tableIdB]));
  expect(Array.isArray(payload?.tables)).toBe(true);
  expect(payload.tables).toHaveLength(2);
  for (const tableEntry of payload.tables) {
    expect(tableEntry.mySeat).toBeUndefined();
    expect(Array.isArray(tableEntry?.actions)).toBe(true);
    expect(Array.isArray(tableEntry?.seats)).toBe(true);
    for (const seat of tableEntry.seats) {
      expect(seat.isViewer).toBe(false);
    }
  }

  await Promise.all(contexts.map((context) => context.close()));
});
