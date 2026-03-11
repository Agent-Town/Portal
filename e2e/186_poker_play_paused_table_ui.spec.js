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

test('M23.12: paused live table UI shows operator freeze state and removes action controls', async ({ browser, request }) => {
  const sitAt = '2026-03-10T12:00:00.500Z';
  const pauseAt = '2026-03-10T12:00:05.000Z';
  const userA = {
    address: 'So1anaMockUiPauseA111111111111111111111111111',
    houseId: 'house_ui_pause_a',
    streamId: 'stream-ui-pause-a',
  };
  const userB = {
    address: 'So1anaMockUiPauseB111111111111111111111111111',
    houseId: 'house_ui_pause_b',
    streamId: 'stream-ui-pause-b',
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
      displayName: 'UI Pause Alpha',
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
      displayName: 'UI Pause Bravo',
      buyInOil: 400,
      asOf: sitAt,
    },
  });
  expect(resp.ok).toBe(true);

  const adminResp = await request.post('/api/poker/play/admin/tables/pkt_play_cash_01/pause', {
    headers: { 'x-admin-token': 'test-admin' },
    data: {
      reason: 'operator review',
      asOf: pauseAt,
    },
  });
  expect(adminResp.ok()).toBe(true);

  await pageA.goto('/poker/play/tables/pkt_play_cash_01?embed=1');
  await expect(pageA.getByText('Table paused: operator review')).toBeVisible();
  await expect(pageA.getByText('paused', { exact: true })).toBeVisible();
  await expect(pageA.getByRole('heading', { name: 'Submit Action' })).toBeVisible();
  await expect(pageA.getByText('Table play is paused by an operator.')).toBeVisible();
  await expect(pageA.locator('#pokerPlayActionForm')).toHaveCount(0);
  await expect(pageA.getByRole('heading', { name: 'Seat Thread' })).toBeVisible();

  await contextA.close();
  await contextB.close();
});
