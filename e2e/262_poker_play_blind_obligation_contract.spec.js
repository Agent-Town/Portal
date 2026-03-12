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

test('M25.4: returning from away at a cash table applies a contract-visible blind obligation by policy', async ({ browser, request }) => {
  const users = [
    { address: 'So1anaMockSeatDA1111111111111111111111111111', houseId: 'house_blind_a', streamId: 'stream-blind-a', displayName: 'Blind Alpha' },
    { address: 'So1anaMockSeatDB1111111111111111111111111111', houseId: 'house_blind_b', streamId: 'stream-blind-b', displayName: 'Blind Bravo' },
    { address: 'So1anaMockSeatDC1111111111111111111111111111', houseId: 'house_blind_c', streamId: 'stream-blind-c', displayName: 'Blind Charlie' },
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

  let resp = await browserJson(pages[0], '/api/poker/play/tables', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[0].address },
    data: {
      tableType: 'cash',
      title: 'Blind Policy Contract Cash',
      smallBlindOil: 10,
      bigBlindOil: 20,
      buyInOil: 200,
      minPlayers: 4,
      maxSeats: 6,
      blindReturnPolicy: 'post_big_blind',
      seatNumber: 1,
      displayName: users[0].displayName,
      asOf: '2026-03-12T10:00:00.000Z',
    },
  });
  expect(resp.ok).toBe(true);
  const tableId = String(resp.body?.data?.table?.tableId || '');
  expect(tableId).toBeTruthy();

  resp = await browserJson(pages[1], `/api/poker/play/tables/${encodeURIComponent(tableId)}/sit`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[1].address },
    data: {
      seatNumber: 2,
      displayName: users[1].displayName,
      buyInOil: 200,
      asOf: '2026-03-12T10:00:01.000Z',
    },
  });
  expect(resp.ok).toBe(true);

  resp = await browserJson(pages[2], `/api/poker/play/tables/${encodeURIComponent(tableId)}/sit`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[2].address },
    data: {
      seatNumber: 3,
      displayName: users[2].displayName,
      buyInOil: 200,
      asOf: '2026-03-12T10:00:02.000Z',
    },
  });
  expect(resp.ok).toBe(true);

  resp = await browserJson(pages[0], `/api/poker/play/tables/${encodeURIComponent(tableId)}/sit-out`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[0].address },
    data: {
      markAway: true,
      asOf: '2026-03-12T10:00:03.000Z',
    },
  });
  expect(resp.ok).toBe(true);
  expect(resp.body?.data?.mySeat?.status).toBe('away');

  resp = await browserJson(pages[0], `/api/poker/play/tables/${encodeURIComponent(tableId)}/return`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[0].address },
    data: {
      asOf: '2026-03-12T10:00:04.000Z',
    },
  });
  expect(resp.ok).toBe(true);

  const data = resp.body?.data || {};
  expect(data?.table?.tableType).toBe('cash');
  expect(data?.table?.summary?.blindReturnPolicy).toBe('post_big_blind');
  expect(data?.mySeat?.status).toBe('active');
  expect(Number(data?.mySeat?.stackOil || 0)).toBe(180);
  expect(data?.mySeat?.blindObligation).toMatchObject({
    policy: 'post_big_blind',
    status: 'posted',
    blindAmountOil: 20,
  });
  expect(['seat_returned', 'blind_obligation_posted']).toContain(String(data?.review?.latestAuditEvent?.eventKind || ''));

  await Promise.all(contexts.map((context) => context.close()));
});
