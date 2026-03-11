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

test('M23.8: table stream emits push events when live poker state changes', async ({ browser, request }) => {
  const userA = {
    address: 'So1anaMockStreamA111111111111111111111111111',
    houseId: 'house_stream_a',
    streamId: 'stream-play-a',
  };
  const userB = {
    address: 'So1anaMockStreamB111111111111111111111111111',
    houseId: 'house_stream_b',
    streamId: 'stream-play-b',
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
      displayName: 'Stream Alpha',
      buyInOil: 400,
    },
  });
  expect(resp.ok).toBe(true);

  resp = await browserJson(pageB, '/api/poker/play/tables/pkt_play_cash_01/sit', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': userB.address },
    data: {
      seatNumber: 2,
      displayName: 'Stream Bravo',
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
  await observerPage.evaluate(() => {
    window.__pokerStreamEvents = [];
    if (window.__pokerStreamTest) {
      window.__pokerStreamTest.close();
    }
    const stream = new window.EventSource('/api/poker/play/tables/pkt_play_cash_01/stream?embed=1', { withCredentials: true });
    window.__pokerStreamTest = stream;
    const append = (event, payload) => {
      window.__pokerStreamEvents.push({ event, payload });
    };
    stream.addEventListener('ready', (event) => append('ready', JSON.parse(event.data)));
    stream.addEventListener('table', (event) => append('table', JSON.parse(event.data)));
  });
  await observerPage.waitForFunction(() => Array.isArray(window.__pokerStreamEvents) && window.__pokerStreamEvents.some((entry) => entry.event === 'ready'));

  resp = await browserJson(actorPage, `/api/poker/play/hands/${encodeURIComponent(detail?.hand?.handId || '')}/actions`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': actorAddress },
    data: {
      actionKind: 'fold',
      amountOil: 0,
    },
  });
  expect(resp.ok).toBe(true);

  await observerPage.waitForFunction(() => (
    Array.isArray(window.__pokerStreamEvents)
      && window.__pokerStreamEvents.some((entry) => entry.event === 'table' && entry.payload && entry.payload.reason === 'action')
  ), null, { timeout: 1500 });

  const events = await observerPage.evaluate(() => window.__pokerStreamEvents || []);
  const actionEvent = events.find((entry) => entry.event === 'table' && entry.payload && entry.payload.reason === 'action');
  expect(actionEvent).toBeTruthy();
  expect(String(actionEvent.payload.tableId || '')).toBe('pkt_play_cash_01');
  expect(Number(actionEvent.payload.handNumber || 0)).toBeGreaterThanOrEqual(2);

  await observerPage.evaluate(() => {
    if (window.__pokerStreamTest) window.__pokerStreamTest.close();
  });
  await contextA.close();
  await contextB.close();
});
