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

test('M23.16: tournament table UI shows late-registration state and a registered seat waiting for the next hand', async ({ browser, request }) => {
  const users = [
    { address: 'So1anaMockLateUiA111111111111111111111111111', houseId: 'house_late_ui_a', streamId: 'stream-late-ui-a' },
    { address: 'So1anaMockLateUiB111111111111111111111111111', houseId: 'house_late_ui_b', streamId: 'stream-late-ui-b' },
    { address: 'So1anaMockLateUiC111111111111111111111111111', houseId: 'house_late_ui_c', streamId: 'stream-late-ui-c' },
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

  let resp = await browserJson(pages[0], '/api/poker/play/tables/pkt_play_tournament_01/sit', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[0].address },
    data: {
      seatNumber: 1,
      displayName: 'Alpha UI',
      asOf: '2026-03-10T12:00:00.500Z',
    },
  });
  expect(resp.ok).toBe(true);

  resp = await browserJson(pages[1], '/api/poker/play/tables/pkt_play_tournament_01/sit', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[1].address },
    data: {
      seatNumber: 2,
      displayName: 'Bravo UI',
      asOf: '2026-03-10T12:00:00.500Z',
    },
  });
  expect(resp.ok).toBe(true);

  resp = await browserJson(pages[2], '/api/poker/play/tables/pkt_play_tournament_01/sit', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[2].address },
    data: {
      seatNumber: 3,
      displayName: 'Charlie UI',
      asOf: '2026-03-10T12:00:01.000Z',
    },
  });
  expect(resp.ok).toBe(true);
  expect(resp.body?.data?.mySeat?.status).toBe('registered');

  await pages[2].goto('/poker/play/tables/pkt_play_tournament_01?embed=1');
  await expect(pages[2].getByRole('heading', { name: 'Your Seat' })).toBeVisible();
  await expect(pages[2].getByText('registered for next hand').first()).toBeVisible();
  await expect(pages[2].getByText('You are registered for the next hand')).toBeVisible();
  await expect(pages[2].getByText('Late Reg', { exact: true })).toBeVisible();
  await expect(pages[2].getByRole('button', { name: 'Submit Action' })).toHaveCount(0);
  await expect(pages[2].getByRole('button', { name: 'Leave Seat' })).toBeVisible();

  await Promise.all(contexts.map((context) => context.close()));
});
