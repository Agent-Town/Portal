const { test, expect } = require('@playwright/test');
const {
  getTableCount,
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

test('M23.24: sit-and-go matchmaking waits for a full first table and forks into a fresh single-table tournament once live', async ({ browser, request }) => {
  const users = [
    { address: 'So1anaMockSitngoA11111111111111111111111111', houseId: 'house_sitngo_a', streamId: 'stream-sitngo-a' },
    { address: 'So1anaMockSitngoB11111111111111111111111111', houseId: 'house_sitngo_b', streamId: 'stream-sitngo-b' },
    { address: 'So1anaMockSitngoC11111111111111111111111111', houseId: 'house_sitngo_c', streamId: 'stream-sitngo-c' },
    { address: 'So1anaMockSitngoD11111111111111111111111111', houseId: 'house_sitngo_d', streamId: 'stream-sitngo-d' },
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

  const baselineTableCount = await getTableCount(request, 'poker_play_tables');
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

  const structure = {
    tableType: 'tournament',
    fillPolicy: 'fill_to_full',
    maxSeats: 3,
    minPlayers: 2,
    smallBlindOil: 60,
    bigBlindOil: 120,
    buyInOil: 1200,
  };

  let resp = await browserJson(pages[0], '/api/poker/play/matchmake', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[0].address },
    data: {
      ...structure,
      displayName: 'Sitngo Alpha',
    },
  });
  expect(resp.ok).toBe(true);
  const firstTable = resp.body?.data?.table || {};
  const firstTableId = String(firstTable?.tableId || '');
  const firstSeriesId = String(firstTable?.rules?.seriesId || '');
  expect(firstTableId).toBeTruthy();
  expect(firstSeriesId).toBeTruthy();
  expect(firstTable?.summary?.fillPolicy).toBe('fill_to_full');
  expect(Number(firstTable?.summary?.startTargetSeats || 0)).toBe(3);
  expect(Number(firstTable?.summary?.seatsUntilStart || 0)).toBe(2);
  expect(firstTable?.summary?.lateRegistrationOpen).toBe(false);
  expect(resp.body?.data?.hand || null).toBeNull();
  expect(await getTableCount(request, 'poker_play_tables')).toBe(baselineTableCount + 1);

  resp = await browserJson(pages[1], '/api/poker/play/matchmake', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[1].address },
    data: {
      ...structure,
      displayName: 'Sitngo Bravo',
    },
  });
  expect(resp.ok).toBe(true);
  expect(String(resp.body?.data?.table?.tableId || '')).toBe(firstTableId);
  expect(Number(resp.body?.data?.table?.summary?.seatsUntilStart || 0)).toBe(1);
  expect(resp.body?.data?.hand || null).toBeNull();

  resp = await browserJson(pages[2], '/api/poker/play/matchmake', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[2].address },
    data: {
      ...structure,
      displayName: 'Sitngo Charlie',
    },
  });
  expect(resp.ok).toBe(true);
  expect(String(resp.body?.data?.table?.tableId || '')).toBe(firstTableId);
  expect(resp.body?.data?.hand?.status).toBe('live');
  expect(resp.body?.data?.table?.summary?.lateRegistrationOpen).toBe(false);
  expect(Number(resp.body?.data?.table?.summary?.seatsUntilStart || 0)).toBe(0);
  expect(String(resp.body?.data?.series?.seriesId || '')).toBe(firstSeriesId);
  expect(await getTableCount(request, 'poker_play_tables')).toBe(baselineTableCount + 1);

  resp = await browserJson(pages[3], '/api/poker/play/matchmake', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[3].address },
    data: {
      ...structure,
      displayName: 'Sitngo Delta',
      asOf: '2026-03-10T12:00:05.000Z',
    },
  });
  expect(resp.ok).toBe(true);
  const secondTable = resp.body?.data?.table || {};
  const secondTableId = String(secondTable?.tableId || '');
  const secondSeriesId = String(secondTable?.rules?.seriesId || '');
  expect(secondTableId).toBeTruthy();
  expect(secondTableId).not.toBe(firstTableId);
  expect(secondSeriesId).toBeTruthy();
  expect(secondSeriesId).not.toBe(firstSeriesId);
  expect(secondTable?.summary?.fillPolicy).toBe('fill_to_full');
  expect(Number(secondTable?.summary?.startTargetSeats || 0)).toBe(3);
  expect(Number(secondTable?.summary?.seatsUntilStart || 0)).toBe(2);
  expect(resp.body?.data?.hand || null).toBeNull();
  expect(await getTableCount(request, 'poker_play_tables')).toBe(baselineTableCount + 2);

  await Promise.all(contexts.map((context) => context.close()));
});
