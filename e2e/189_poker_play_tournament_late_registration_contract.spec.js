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

test('M23.15: tournaments support late registration, allow unregister before first hand, and activate registered seats on the next hand', async ({ browser, request }) => {
  const users = [
    { address: 'So1anaMockLateRegA11111111111111111111111111', houseId: 'house_late_reg_a', streamId: 'stream-late-reg-a' },
    { address: 'So1anaMockLateRegB11111111111111111111111111', houseId: 'house_late_reg_b', streamId: 'stream-late-reg-b' },
    { address: 'So1anaMockLateRegC11111111111111111111111111', houseId: 'house_late_reg_c', streamId: 'stream-late-reg-c' },
    { address: 'So1anaMockLateRegD11111111111111111111111111', houseId: 'house_late_reg_d', streamId: 'stream-late-reg-d' },
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

  const funded = [];
  const contexts = [];
  const pages = [];
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

  let resp = await browserJson(pages[0], '/api/poker/play/tables/pkt_play_tournament_01/sit', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[0].address },
    data: {
      seatNumber: 1,
      displayName: 'Alpha Late Reg',
      asOf: '2026-03-10T12:00:00.500Z',
    },
  });
  expect(resp.ok).toBe(true);

  resp = await browserJson(pages[1], '/api/poker/play/tables/pkt_play_tournament_01/sit', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[1].address },
    data: {
      seatNumber: 2,
      displayName: 'Bravo Late Reg',
      asOf: '2026-03-10T12:00:00.500Z',
    },
  });
  expect(resp.ok).toBe(true);
  expect(resp.body?.data?.hand?.status).toBe('live');
  expect(Number(resp.body?.data?.hand?.handNumber || 0)).toBe(1);

  resp = await browserJson(pages[2], '/api/poker/play/tables/pkt_play_tournament_01/sit', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[2].address },
    data: {
      seatNumber: 3,
      displayName: 'Charlie Register',
      asOf: '2026-03-10T12:00:01.000Z',
    },
  });
  expect(resp.ok).toBe(true);
  expect(resp.body?.data?.mySeat?.status).toBe('registered');
  expect(resp.body?.data?.table?.summary?.lateRegistrationOpen).toBe(true);
  expect(Number(resp.body?.data?.table?.summary?.lateRegistrationRemainingHands || 0)).toBe(2);
  expect(Array.isArray(resp.body?.data?.mySeat?.holeCards) ? resp.body.data.mySeat.holeCards.length : 0).toBe(0);
  expect(Array.isArray(resp.body?.data?.hand?.viewerAllowedActions) ? resp.body.data.hand.viewerAllowedActions.length : 0).toBe(0);

  resp = await browserJson(pages[2], '/api/poker/play/tables/pkt_play_tournament_01/leave', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[2].address },
    data: {
      asOf: '2026-03-10T12:00:01.500Z',
    },
  });
  expect(resp.ok).toBe(true);
  expect(resp.body?.data?.mySeat).toBe(null);
  expect(Number(resp.body?.data?.oilBalance?.balance || 0)).toBe(Number(funded[2]?.oilBalance?.balance || 0));

  resp = await browserJson(pages[3], '/api/poker/play/tables/pkt_play_tournament_01/sit', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[3].address },
    data: {
      seatNumber: 3,
      displayName: 'Delta Register',
      asOf: '2026-03-10T12:00:02.000Z',
    },
  });
  expect(resp.ok).toBe(true);
  expect(resp.body?.data?.mySeat?.status).toBe('registered');
  expect(Number(resp.body?.data?.mySeat?.seatNumber || 0)).toBe(3);

  const liveDetail = await getTable(pages[0], users[0].address, {
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

  const afterStart = await getTable(pages[3], users[3].address, {
    asOf: '2026-03-10T12:00:03.000Z',
  });
  expect(Number(afterStart?.hand?.handNumber || 0)).toBe(2);
  expect(afterStart?.mySeat?.status).toBe('active');
  expect(Array.isArray(afterStart?.mySeat?.holeCards) ? afterStart.mySeat.holeCards.length : 0).toBe(2);
  expect(afterStart?.table?.summary?.lateRegistrationOpen).toBe(true);
  expect(Number(afterStart?.table?.summary?.lateRegistrationRemainingHands || 0)).toBe(1);

  await Promise.all(contexts.map((context) => context.close()));
});
