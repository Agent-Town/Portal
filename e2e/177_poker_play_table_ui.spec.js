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

test('M23.3: the live poker table UI renders seat state, private thread, and action controls', async ({ browser, request }) => {
  const userA = {
    address: 'So1anaMockUiA11111111111111111111111111111111',
    houseId: 'house_ui_a',
    streamId: 'stream-ui-a',
  };
  const userB = {
    address: 'So1anaMockUiB11111111111111111111111111111111',
    houseId: 'house_ui_b',
    streamId: 'stream-ui-b',
  };

  await seedStreamflowLocks(request, {
    locks: [
      {
        address: userA.address,
        streamId: userA.streamId,
        tokenSymbol: '$AGENTTOWN',
        locked: true,
        lockedAmountAtomic: '2500000',
      },
      {
        address: userB.address,
        streamId: userB.streamId,
        tokenSymbol: '$AGENTTOWN',
        locked: true,
        lockedAmountAtomic: '2500000',
      },
    ],
  });

  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();
  await pageA.goto('/');
  await bindPageSession(pageA, userA);
  await verifyStreamflowAndFundOil(pageA, request, {
    address: userA.address,
    streamId: userA.streamId,
  });

  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();
  await pageB.goto('/');
  await bindPageSession(pageB, userB);
  await verifyStreamflowAndFundOil(pageB, request, {
    address: userB.address,
    streamId: userB.streamId,
  });

  let resp = await browserJson(pageA, '/api/poker/play/tables/pkt_play_cash_01/sit', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': userA.address },
    data: {
      seatNumber: 1,
      displayName: 'UI Alpha',
      buyInOil: 400,
    },
  });
  expect(resp.ok).toBe(true);

  resp = await browserJson(pageB, '/api/poker/play/tables/pkt_play_cash_01/sit', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': userB.address },
    data: {
      seatNumber: 2,
      displayName: 'UI Bravo',
      buyInOil: 400,
    },
  });
  expect(resp.ok).toBe(true);

  await pageA.goto('/poker/play?embed=1');
  await expect(pageA.getByRole('heading', { name: 'Live Poker Lobby' })).toBeVisible();
  await expect(pageA.getByRole('link', { name: 'Open Table' }).first()).toBeVisible();

  await pageA.goto('/poker/play/tables/pkt_play_cash_01?embed=1');
  await expect(pageA.getByRole('heading', { name: 'Your Seat' })).toBeVisible();
  await expect(pageA.getByRole('heading', { name: 'Current Hand' })).toBeVisible();
  await expect(pageA.getByRole('heading', { name: 'Seat Thread' })).toBeVisible();
  await expect(pageA.getByRole('heading', { name: 'Submit Action' })).toBeVisible();
  await expect(pageA.getByText('UI Alpha')).toBeVisible();
  await expect(pageA.getByText('UI Bravo')).toBeVisible();

  await contextA.close();
  await contextB.close();
});
