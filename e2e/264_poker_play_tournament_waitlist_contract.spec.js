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

test('M25.4: scheduled tournaments accept a durable waitlist and promote the next queued wallet when a seat opens', async ({ browser, request }) => {
  const users = [
    { address: 'So1anaMockTQitA111111111111111111111111111', houseId: 'house_twait_a', streamId: 'stream-twait-a', displayName: 'Waitlist Alpha' },
    { address: 'So1anaMockTQitB111111111111111111111111111', houseId: 'house_twait_b', streamId: 'stream-twait-b', displayName: 'Waitlist Bravo' },
    { address: 'So1anaMockTQitC111111111111111111111111111', houseId: 'house_twait_c', streamId: 'stream-twait-c', displayName: 'Waitlist Charlie' },
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
      tableType: 'tournament',
      title: 'Scheduled Waitlist Tournament',
      smallBlindOil: 25,
      bigBlindOil: 50,
      buyInOil: 300,
      maxSeats: 2,
      minPlayers: 2,
      lateRegistrationHands: 2,
      scheduledStartAt: '2026-03-12T12:30:00.000Z',
      seatNumber: 1,
      displayName: users[0].displayName,
      asOf: '2026-03-12T12:00:00.000Z',
    },
  });
  expect(resp.ok).toBe(true);
  const tableId = String(resp.body?.data?.table?.tableId || '');
  expect(tableId).toBeTruthy();
  expect(resp.body?.data?.table?.status).toBe('scheduled');

  resp = await browserJson(pages[1], `/api/poker/play/tables/${encodeURIComponent(tableId)}/sit`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[1].address },
    data: {
      seatNumber: 2,
      displayName: users[1].displayName,
      buyInOil: 300,
      asOf: '2026-03-12T12:00:01.000Z',
    },
  });
  expect(resp.ok).toBe(true);

  resp = await browserJson(pages[2], `/api/poker/play/tables/${encodeURIComponent(tableId)}/waitlist`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[2].address },
    data: {
      displayName: users[2].displayName,
      buyInOil: 300,
      asOf: '2026-03-12T12:00:02.000Z',
    },
  });
  expect(resp.ok).toBe(true);
  expect(resp.body?.data?.table?.summary?.waitlistCount).toBe(1);
  expect(resp.body?.data?.waitlist?.viewerQueued).toBe(true);
  expect(resp.body?.data?.waitlist?.viewerPosition).toBe(1);

  resp = await browserJson(pages[1], `/api/poker/play/tables/${encodeURIComponent(tableId)}/leave`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[1].address },
    data: {
      asOf: '2026-03-12T12:00:03.000Z',
    },
  });
  expect(resp.ok).toBe(true);

  const promotedResp = await browserJson(pages[2], `/api/poker/play/tables/${encodeURIComponent(tableId)}?asOf=${encodeURIComponent('2026-03-12T12:00:04.000Z')}`, {
    headers: { 'x-wallet-solana-address': users[2].address },
  });
  expect(promotedResp.ok).toBe(true);
  const promoted = promotedResp.body?.data || {};
  expect(promoted?.waitlist?.viewerQueued).toBe(false);
  expect(promoted?.table?.summary?.waitlistCount).toBe(0);
  expect(promoted?.mySeat?.seatNumber).toBe(2);
  expect(promoted?.mySeat?.status).toBe('active');
  expect(promoted?.mySeat?.waitlistPromotion?.source).toBe('tournament_waitlist');
  expect(promoted?.table?.summary?.scheduledStartPending).toBe(true);

  await Promise.all(contexts.map((context) => context.close()));
});
