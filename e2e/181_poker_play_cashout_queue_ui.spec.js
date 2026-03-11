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

test('M23.7: live poker UI queues a cash-table exit during a live hand and reopens the seat after settlement', async ({ browser, request }) => {
  const userA = {
    address: 'So1anaMockUiC11111111111111111111111111111111',
    houseId: 'house_ui_cashout_a',
    streamId: 'stream-ui-cashout-a',
  };
  const userB = {
    address: 'So1anaMockUiD11111111111111111111111111111111',
    houseId: 'house_ui_cashout_b',
    streamId: 'stream-ui-cashout-b',
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
      displayName: 'UI Cashout Alpha',
      buyInOil: 400,
    },
  });
  expect(resp.ok).toBe(true);

  resp = await browserJson(pageB, '/api/poker/play/tables/pkt_play_cash_01/sit', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': userB.address },
    data: {
      seatNumber: 2,
      displayName: 'UI Cashout Bravo',
      buyInOil: 400,
    },
  });
  expect(resp.ok).toBe(true);

  const detailAResp = await browserJson(pageA, '/api/poker/play/tables/pkt_play_cash_01', {
    headers: { 'x-wallet-solana-address': userA.address },
  });
  expect(detailAResp.ok).toBe(true);
  const actingSeat = Number(detailAResp.body?.data?.hand?.actingSeat || 0);
  const leaverPage = actingSeat === 1 ? pageB : pageA;
  const leaverAddress = actingSeat === 1 ? userB.address : userA.address;
  const actorPage = actingSeat === 1 ? pageA : pageB;
  const actorAddress = actingSeat === 1 ? userA.address : userB.address;

  await leaverPage.goto('/poker/play/tables/pkt_play_cash_01?embed=1');
  await expect(leaverPage.getByRole('heading', { name: 'Your Seat' })).toBeVisible();
  await expect(leaverPage.getByRole('button', { name: 'Leave After Hand' })).toBeVisible();

  await leaverPage.getByRole('button', { name: 'Leave After Hand' }).click();
  await expect(leaverPage.getByText('Your cash-out is queued. You stay in this hand, then your remaining stack returns to OIL automatically.')).toBeVisible();
  await expect(leaverPage.getByRole('button', { name: 'Cash Out Queued' })).toBeDisabled();
  await expect(leaverPage.getByText('leaving after hand')).toBeVisible();

  const actorDetailResp = await browserJson(actorPage, '/api/poker/play/tables/pkt_play_cash_01', {
    headers: { 'x-wallet-solana-address': actorAddress },
  });
  expect(actorDetailResp.ok).toBe(true);
  const handId = String(actorDetailResp.body?.data?.hand?.handId || '');
  expect(actorDetailResp.body?.data?.hand?.viewerAllowedActions || []).toContain('fold');

  resp = await browserJson(actorPage, `/api/poker/play/hands/${encodeURIComponent(handId)}/actions`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': actorAddress },
    data: {
      actionKind: 'fold',
      amountOil: 0,
    },
  });
  expect(resp.ok).toBe(true);

  await leaverPage.goto('/poker/play/tables/pkt_play_cash_01?embed=1&asOf=2026-03-10T14%3A00%3A00.000Z');
  await expect(leaverPage.getByRole('heading', { name: 'Take A Seat' })).toBeVisible();
  await expect(leaverPage.getByRole('heading', { name: 'Your Seat' })).toHaveCount(0);
  await expect(leaverPage.getByRole('button', { name: 'Join Table' })).toBeVisible();

  await contextA.close();
  await contextB.close();
});
