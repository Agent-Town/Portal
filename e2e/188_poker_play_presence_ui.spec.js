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

test('M23.14: live table UI shows disconnected seats and reconnect grace context', async ({ browser, request }) => {
  const sitAt = '2026-03-10T12:00:00.500Z';
  const staleAt = '2026-03-10T12:00:35.500Z';
  const userA = {
    address: 'So1anaMockUiSeatA11111111111111111111111111111',
    houseId: 'house_presence_ui_a',
    streamId: 'stream-presence-ui-a',
  };
  const userB = {
    address: 'So1anaMockUiSeatB11111111111111111111111111111',
    houseId: 'house_presence_ui_b',
    streamId: 'stream-presence-ui-b',
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
      displayName: 'UI Presence Alpha',
      buyInOil: 400,
      asOf: sitAt,
    },
  });
  expect(resp.ok).toBe(true);

  resp = await browserJson(pageB, '/api/poker/play/tables/pkt_play_cash_01/sit', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': userB.address },
    data: {
      seatNumber: 2,
      displayName: 'UI Presence Bravo',
      buyInOil: 400,
      asOf: sitAt,
    },
  });
  expect(resp.ok).toBe(true);

  resp = await browserJson(pageB, `/api/poker/play/tables/pkt_play_cash_01?asOf=${encodeURIComponent(staleAt)}`, {
    headers: { 'x-wallet-solana-address': userB.address },
  });
  expect(resp.ok).toBe(true);

  await pageB.goto('/poker/play/tables/pkt_play_cash_01?embed=1');
  await expect(pageB.locator('.pokerRow').filter({ hasText: 'UI Presence Alpha' }).getByText('disconnected')).toBeVisible();

  await contextA.close();
  await contextB.close();
});
