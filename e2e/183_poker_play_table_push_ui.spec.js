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

test('M23.9: observer table UI updates via push before fallback polling fires', async ({ browser, request }) => {
  const userA = {
    address: 'So1anaMockPushUiA111111111111111111111111111',
    houseId: 'house_push_ui_a',
    streamId: 'stream-push-ui-a',
  };
  const userB = {
    address: 'So1anaMockPushUiB111111111111111111111111111',
    houseId: 'house_push_ui_b',
    streamId: 'stream-push-ui-b',
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
      displayName: 'Push UI Alpha',
      buyInOil: 400,
    },
  });
  expect(resp.ok).toBe(true);

  resp = await browserJson(pageB, '/api/poker/play/tables/pkt_play_cash_01/sit', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': userB.address },
    data: {
      seatNumber: 2,
      displayName: 'Push UI Bravo',
      buyInOil: 400,
    },
  });
  expect(resp.ok).toBe(true);

  const detailResp = await browserJson(pageA, '/api/poker/play/tables/pkt_play_cash_01', {
    headers: { 'x-wallet-solana-address': userA.address },
  });
  expect(detailResp.ok).toBe(true);
  const detail = detailResp.body?.data || {};
  const actingSeat = Number(detail?.hand?.actingSeat || 0);
  const actorPage = actingSeat === 1 ? pageA : pageB;
  const actorAddress = actingSeat === 1 ? userA.address : userB.address;
  const observerPage = actingSeat === 1 ? pageB : pageA;
  const observerHandBadge = observerPage.locator('.pokerBadge').filter({ hasText: 'hand 1' }).first();

  await observerPage.goto('/poker/play/tables/pkt_play_cash_01?embed=1');
  await expect(observerHandBadge).toBeVisible();

  resp = await browserJson(actorPage, `/api/poker/play/hands/${encodeURIComponent(detail?.hand?.handId || '')}/actions`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': actorAddress },
    data: {
      actionKind: 'fold',
      amountOil: 0,
    },
  });
  expect(resp.ok).toBe(true);

  await expect(observerPage.locator('.pokerBadge').filter({ hasText: 'hand 2' }).first()).toBeVisible({ timeout: 1500 });

  await contextA.close();
  await contextB.close();
});
