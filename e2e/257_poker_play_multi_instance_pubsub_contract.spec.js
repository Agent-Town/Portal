const { test, expect } = require('@playwright/test');
const {
  getPokerPubSubTopic,
  resetPortalWebState,
  seedStreamflowLocks,
} = require('./helpers/portal_web');
const {
  bindPageSession,
  browserJson,
  verifyStreamflowAndFundOil,
} = require('./helpers/poker_play');

async function startRailTransportProbe(page, {
  channelId,
  subscriberId,
} = {}) {
  await page.evaluate(({ nextChannelId, nextSubscriberId }) => {
    const url = new URL('/api/poker/play/ws', window.location.origin);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.searchParams.set('channelKind', 'table');
    url.searchParams.set('channelId', String(nextChannelId || ''));
    url.searchParams.set('viewer', 'rail');
    url.searchParams.set('subscriberId', String(nextSubscriberId || ''));
    if (window.__pokerPubSubProbe?.socket) {
      window.__pokerPubSubProbe.socket.close();
    }
    const socket = new window.WebSocket(url.toString());
    const state = {
      subscriberId: String(nextSubscriberId || ''),
      messages: [],
      socket,
    };
    socket.addEventListener('message', (event) => {
      try {
        state.messages.push(JSON.parse(String(event.data || '{}')));
      } catch {
        state.messages.push({ messageKind: 'invalid_json' });
      }
    });
    window.__pokerPubSubProbe = state;
  }, { nextChannelId: channelId, nextSubscriberId: subscriberId });
}

async function stopRailTransportProbe(page) {
  await page.evaluate(() => {
    if (window.__pokerPubSubProbe?.socket) {
      window.__pokerPubSubProbe.socket.close();
    }
  });
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M25.2: shared poker pub/sub fanout reaches multiple logical instances exactly once per subscriber', async ({ browser, request }) => {
  const expectedAdapterKind = String(process.env.POKER_PLAY_PUBSUB_ADAPTER || 'memory').trim().toLowerCase() === 'sqlite'
    ? 'sqlite'
    : 'memory';
  const userA = {
    address: 'So1anaMockPubSubA11111111111111111111111111',
    houseId: 'house_pubsub_a',
    streamId: 'stream-pubsub-a',
  };
  const userB = {
    address: 'So1anaMockPubSubB11111111111111111111111111',
    houseId: 'house_pubsub_b',
    streamId: 'stream-pubsub-b',
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
      displayName: 'PubSub Alpha',
      buyInOil: 400,
    },
  });
  expect(resp.ok).toBe(true);

  resp = await browserJson(pageB, '/api/poker/play/tables/pkt_play_cash_01/sit', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': userB.address },
    data: {
      seatNumber: 2,
      displayName: 'PubSub Bravo',
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

  const railContextA = await browser.newContext();
  const railPageA = await railContextA.newPage();
  await railPageA.goto('/');
  await startRailTransportProbe(railPageA, {
    channelId: 'pkt_play_cash_01',
    subscriberId: 'instance-a',
  });
  await railPageA.waitForFunction(() => Array.isArray(window.__pokerPubSubProbe?.messages)
    && window.__pokerPubSubProbe.messages.some((entry) => entry.messageKind === 'snapshot'));

  const railContextB = await browser.newContext();
  const railPageB = await railContextB.newPage();
  await railPageB.goto('/');
  await startRailTransportProbe(railPageB, {
    channelId: 'pkt_play_cash_01',
    subscriberId: 'instance-b',
  });
  await railPageB.waitForFunction(() => Array.isArray(window.__pokerPubSubProbe?.messages)
    && window.__pokerPubSubProbe.messages.some((entry) => entry.messageKind === 'snapshot'));

  resp = await browserJson(actorPage, `/api/poker/play/hands/${encodeURIComponent(detail?.hand?.handId || '')}/actions`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': actorAddress },
    data: {
      actionKind: 'fold',
      amountOil: 0,
    },
  });
  expect(resp.ok).toBe(true);

  await railPageA.waitForFunction(() => Array.isArray(window.__pokerPubSubProbe?.messages)
    && window.__pokerPubSubProbe.messages.some((entry) => entry.messageKind === 'delta' && entry.reason === 'action'));
  await railPageB.waitForFunction(() => Array.isArray(window.__pokerPubSubProbe?.messages)
    && window.__pokerPubSubProbe.messages.some((entry) => entry.messageKind === 'delta' && entry.reason === 'action'));

  const topic = await getPokerPubSubTopic(request, {
    channelKind: 'table',
    channelId: 'pkt_play_cash_01',
  });
  expect(topic.adapterKind).toBe(expectedAdapterKind);
  expect(topic.topic).toBe('poker-play:table:pkt_play_cash_01');
  expect(Number(topic.publishCount || 0)).toBeGreaterThanOrEqual(1);
  expect(topic.latestEnvelope?.message?.channelKind).toBe('table');
  expect(topic.latestEnvelope?.message?.channelId).toBe('pkt_play_cash_01');
  expect(topic.latestEnvelope?.message?.reason).toBe('action');
  const subscriberA = (Array.isArray(topic.subscribers) ? topic.subscribers : []).find((entry) => entry.subscriberId === 'instance-a');
  const subscriberB = (Array.isArray(topic.subscribers) ? topic.subscribers : []).find((entry) => entry.subscriberId === 'instance-b');
  expect(subscriberA).toBeTruthy();
  expect(subscriberB).toBeTruthy();
  expect(Number(subscriberA.deliveryCount || 0)).toBe(1);
  expect(Number(subscriberB.deliveryCount || 0)).toBe(1);

  await stopRailTransportProbe(railPageA);
  await stopRailTransportProbe(railPageB);
  await railContextA.close();
  await railContextB.close();
  await contextA.close();
  await contextB.close();
});
