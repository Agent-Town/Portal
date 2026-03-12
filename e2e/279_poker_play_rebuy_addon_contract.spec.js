const { test, expect } = require('@playwright/test');
const {
  resetPortalWebState,
  seedStreamflowLocks,
} = require('./helpers/portal_web');
const {
  bindPageSession,
  browserJson,
  seedPokerPlayHarness,
  verifyStreamflowAndFundOil,
} = require('./helpers/poker_play');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M25.9: rebuy and add-on windows accept exactly by policy and update prize-pool accounting deterministically', async ({ browser, request }) => {
  const users = [
    { seatNumber: 1, address: 'So1anaMockRebuyA11111111111111111111111111', houseId: 'house_rebuy_a', streamId: 'stream-rebuy-a', displayName: 'Rebuy Alpha' },
    { seatNumber: 2, address: 'So1anaMockRebuyB11111111111111111111111111', houseId: 'house_rebuy_b', streamId: 'stream-rebuy-b', displayName: 'Rebuy Bravo' },
    { seatNumber: 3, address: 'So1anaMockRebuyC11111111111111111111111111', houseId: 'house_rebuy_c', streamId: 'stream-rebuy-c', displayName: 'Rebuy Charlie' },
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
  const funded = [];
  for (const user of users) {
    const context = await browser.newContext();
    const page = await context.newPage();
    contexts.push(context);
    pages.push(page);
    await page.goto('/');
    await bindPageSession(page, user);
    funded.push(await verifyStreamflowAndFundOil(page, request, {
      address: user.address,
      streamId: user.streamId,
    }));
  }

  const seeded = await seedPokerPlayHarness(request, {
    scenario: 'rebuy_addon_story',
    asOf: '2026-03-12T20:00:00.000Z',
    actors: users,
  });
  const tableId = String(seeded?.tableIds?.[0] || '');
  const seriesId = String(seeded?.seriesId || '');
  expect(tableId).toBeTruthy();
  expect(seriesId).toBeTruthy();

  let resp = await browserJson(pages[0], `/api/poker/play/series/${encodeURIComponent(seriesId)}/rebuy`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[0].address },
    data: {
      displayName: users[0].displayName,
      asOf: '2026-03-12T20:00:10.000Z',
    },
  });
  expect(resp.ok).toBe(true);
  expect(resp.body?.data?.table?.summary?.rebuyWindowOpen).toBe(true);
  expect(Number(resp.body?.data?.table?.summary?.acceptedRebuyCount || 0)).toBe(1);
  expect(Number(resp.body?.data?.series?.acceptedRebuyCount || 0)).toBe(1);
  expect(Number(resp.body?.data?.table?.summary?.entryCount || 0)).toBe(4);
  expect(Number(resp.body?.data?.mySeat?.stackOil || 0)).toBe(600);
  expect(Number(resp.body?.data?.oilBalance?.balance || 0)).toBe(Number(funded[0]?.oilBalance?.balance || 0) - 600);

  resp = await browserJson(pages[1], `/api/poker/play/tables/${encodeURIComponent(tableId)}/addon`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[1].address },
    data: {
      asOf: '2026-03-12T20:00:11.000Z',
    },
  });
  expect(resp.ok).toBe(true);
  expect(resp.body?.data?.table?.summary?.addonWindowOpen).toBe(true);
  expect(Number(resp.body?.data?.table?.summary?.addonCount || 0)).toBe(1);
  expect(Number(resp.body?.data?.table?.summary?.addonPrizePoolOil || 0)).toBe(200);
  expect(Number(resp.body?.data?.table?.summary?.prizePoolOil || 0)).toBe(2600);
  expect(Number(resp.body?.data?.mySeat?.stackOil || 0)).toBe(800);
  expect(Number(resp.body?.data?.oilBalance?.balance || 0)).toBe(Number(funded[1]?.oilBalance?.balance || 0) - 200);

  const duplicateAddon = await browserJson(pages[1], `/api/poker/play/tables/${encodeURIComponent(tableId)}/addon`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[1].address },
    data: {
      asOf: '2026-03-12T20:00:12.000Z',
    },
  });
  expect(duplicateAddon.ok).toBe(false);
  expect(duplicateAddon.status).toBe(409);
  expect(duplicateAddon.body?.error?.code).toBe('POKER_PLAY_ADDON_LIMIT_REACHED');

  const duplicateRebuy = await browserJson(pages[0], `/api/poker/play/series/${encodeURIComponent(seriesId)}/rebuy`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[0].address },
    data: {
      displayName: users[0].displayName,
      asOf: '2026-03-12T20:00:13.000Z',
    },
  });
  expect(duplicateRebuy.ok).toBe(false);
  expect(duplicateRebuy.status).toBe(409);
  expect(duplicateRebuy.body?.error?.code).toBe('POKER_PLAY_REBUY_LIMIT_REACHED');

  const lateAddon = await browserJson(pages[2], `/api/poker/play/tables/${encodeURIComponent(tableId)}/addon`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[2].address },
    data: {
      asOf: '2026-03-12T20:06:30.000Z',
    },
  });
  expect(lateAddon.ok).toBe(true);
  expect(Number(lateAddon.body?.data?.table?.summary?.addonCount || 0)).toBe(2);
  expect(Number(lateAddon.body?.data?.table?.summary?.addonPrizePoolOil || 0)).toBe(400);
  expect(Number(lateAddon.body?.data?.table?.summary?.prizePoolOil || 0)).toBe(2800);
  expect(Number(lateAddon.body?.data?.mySeat?.stackOil || 0)).toBe(1200);
  expect(Number(lateAddon.body?.data?.oilBalance?.balance || 0)).toBe(Number(funded[2]?.oilBalance?.balance || 0) - 200);

  await Promise.all(contexts.map((context) => context.close()));
});
