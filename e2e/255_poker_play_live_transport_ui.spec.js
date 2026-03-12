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

test('M25.1: live player table UI updates through websocket transport before fallback polling fires', async ({ browser, request }) => {
  const userA = {
    address: 'So1anaMockLiveWsUiA111111111111111111111111',
    houseId: 'house_live_ws_ui_a',
    streamId: 'stream-live-ws-ui-a',
  };
  const userB = {
    address: 'So1anaMockLiveWsUiB111111111111111111111111',
    houseId: 'house_live_ws_ui_b',
    streamId: 'stream-live-ws-ui-b',
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
      displayName: 'Live WS Alpha',
      buyInOil: 400,
    },
  });
  expect(resp.ok).toBe(true);

  resp = await browserJson(pageB, '/api/poker/play/tables/pkt_play_cash_01/sit', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': userB.address },
    data: {
      seatNumber: 2,
      displayName: 'Live WS Bravo',
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

  await observerPage.goto('/poker/play/tables/pkt_play_cash_01?embed=1');
  await expect(observerPage.locator('.pokerBadge').filter({ hasText: 'hand 1' }).first()).toBeVisible();
  await observerPage.waitForFunction(() => window.__pokerLiveTransportDebug
    && window.__pokerLiveTransportDebug.protocol === 'ws'
    && window.__pokerLiveTransportDebug.state === 'connected');

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
  await observerPage.waitForFunction(() => window.__pokerLiveTransportDebug
    && window.__pokerLiveTransportDebug.protocol === 'ws'
    && window.__pokerLiveTransportDebug.lastMessageKind === 'delta'
    && window.__pokerLiveTransportDebug.lastReason === 'action');

  await contextA.close();
  await contextB.close();
});
