const { test, expect } = require('@playwright/test');
const {
  getPokerTransportChannel,
  resetPortalWebState,
  seedStreamflowLocks,
} = require('./helpers/portal_web');
const {
  bindPageSession,
  browserJson,
  verifyStreamflowAndFundOil,
} = require('./helpers/poker_play');

async function startPokerTransportProbe(page, {
  channelKind,
  channelId,
  viewer = 'player',
  lastSeenVersion = null,
} = {}) {
  await page.evaluate(({ channelKind: nextChannelKind, channelId: nextChannelId, viewer: nextViewer, lastSeenVersion: nextLastSeenVersion }) => {
    const url = new URL('/api/poker/play/ws', window.location.origin);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.searchParams.set('channelKind', String(nextChannelKind || ''));
    url.searchParams.set('channelId', String(nextChannelId || ''));
    url.searchParams.set('viewer', String(nextViewer || 'player'));
    if (nextLastSeenVersion != null) {
      url.searchParams.set('lastSeenVersion', String(nextLastSeenVersion));
    }
    if (window.__pokerTransportProbe?.socket) {
      window.__pokerTransportProbe.socket.close();
    }
    const socket = new window.WebSocket(url.toString());
    const state = {
      url: url.toString(),
      open: false,
      closed: false,
      messages: [],
      socket,
    };
    socket.addEventListener('open', () => {
      state.open = true;
    });
    socket.addEventListener('message', (event) => {
      try {
        state.messages.push(JSON.parse(String(event.data || '{}')));
      } catch {
        state.messages.push({ messageKind: 'invalid_json' });
      }
    });
    socket.addEventListener('close', () => {
      state.closed = true;
    });
    window.__pokerTransportProbe = state;
  }, { channelKind, channelId, viewer, lastSeenVersion });
}

async function stopPokerTransportProbe(page) {
  await page.evaluate(() => {
    if (window.__pokerTransportProbe?.socket) {
      window.__pokerTransportProbe.socket.close();
    }
  });
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M25.0: websocket transport emits snapshot and delta envelopes with visible channel versions', async ({ browser, request }) => {
  const userA = {
    address: 'So1anaMockLiveTransportA111111111111111111111',
    houseId: 'house_live_transport_a',
    streamId: 'stream-live-transport-a',
  };
  const userB = {
    address: 'So1anaMockLiveTransportB111111111111111111111',
    houseId: 'house_live_transport_b',
    streamId: 'stream-live-transport-b',
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
      displayName: 'Transport Alpha',
      buyInOil: 400,
    },
  });
  expect(resp.ok).toBe(true);

  resp = await browserJson(pageB, '/api/poker/play/tables/pkt_play_cash_01/sit', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': userB.address },
    data: {
      seatNumber: 2,
      displayName: 'Transport Bravo',
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

  await startPokerTransportProbe(observerPage, {
    channelKind: 'table',
    channelId: 'pkt_play_cash_01',
    viewer: 'player',
  });
  await observerPage.waitForFunction(() => Array.isArray(window.__pokerTransportProbe?.messages)
    && window.__pokerTransportProbe.messages.some((entry) => entry.messageKind === 'snapshot'));

  resp = await browserJson(actorPage, `/api/poker/play/hands/${encodeURIComponent(detail?.hand?.handId || '')}/actions`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': actorAddress },
    data: {
      actionKind: 'fold',
      amountOil: 0,
    },
  });
  expect(resp.ok).toBe(true);

  await observerPage.waitForFunction(() => Array.isArray(window.__pokerTransportProbe?.messages)
    && window.__pokerTransportProbe.messages.some((entry) => entry.messageKind === 'delta' && entry.reason === 'action'));

  const messages = await observerPage.evaluate(() => window.__pokerTransportProbe?.messages || []);
  const snapshot = messages.find((entry) => entry.messageKind === 'snapshot');
  const delta = messages.find((entry) => entry.messageKind === 'delta' && entry.reason === 'action');
  expect(snapshot).toBeTruthy();
  expect(snapshot.transportVersion).toBe(1);
  expect(snapshot.channelKind).toBe('table');
  expect(snapshot.channelId).toBe('pkt_play_cash_01');
  expect(snapshot.snapshot?.table?.tableId).toBe('pkt_play_cash_01');
  expect(Number(snapshot.version || 0)).toBeGreaterThanOrEqual(0);
  expect(delta).toBeTruthy();
  expect(delta.transportVersion).toBe(1);
  expect(delta.channelKind).toBe('table');
  expect(delta.channelId).toBe('pkt_play_cash_01');
  expect(delta.patch?.tableId).toBe('pkt_play_cash_01');
  expect(Number(delta.version || 0)).toBeGreaterThan(Number(delta.prevVersion || 0));
  expect(Number(delta.version || 0)).toBeGreaterThanOrEqual(Number(snapshot.version || 0));

  const channel = await getPokerTransportChannel(request, {
    channelKind: 'table',
    channelId: 'pkt_play_cash_01',
  });
  expect(channel.adapterKind).toBe('memory');
  expect(channel.transportVersion).toBe(1);
  expect(channel.channelKind).toBe('table');
  expect(channel.channelId).toBe('pkt_play_cash_01');
  expect(Number(channel.version || 0)).toBe(Number(delta.version || 0));
  expect(Number(channel.replayEntryCount || 0)).toBeGreaterThanOrEqual(1);
  expect(channel.latestDelta?.reason).toBe('action');

  await stopPokerTransportProbe(observerPage);
  await contextA.close();
  await contextB.close();
});
