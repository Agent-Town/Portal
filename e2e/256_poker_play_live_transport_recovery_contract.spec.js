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

test('M25.1: websocket transport replays missed deltas and resets deterministically for invalid future versions', async ({ browser, request }) => {
  const userA = {
    address: 'So1anaMockLiveRecoverA1111111111111111111111',
    houseId: 'house_live_recover_a',
    streamId: 'stream-live-recover-a',
  };
  const userB = {
    address: 'So1anaMockLiveRecoverB1111111111111111111111',
    houseId: 'house_live_recover_b',
    streamId: 'stream-live-recover-b',
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
      displayName: 'Recover Alpha',
      buyInOil: 400,
    },
  });
  expect(resp.ok).toBe(true);

  resp = await browserJson(pageB, '/api/poker/play/tables/pkt_play_cash_01/sit', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': userB.address },
    data: {
      seatNumber: 2,
      displayName: 'Recover Bravo',
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
  const initialMessages = await observerPage.evaluate(() => window.__pokerTransportProbe?.messages || []);
  const initialSnapshot = initialMessages.find((entry) => entry.messageKind === 'snapshot');
  expect(initialSnapshot).toBeTruthy();

  await stopPokerTransportProbe(observerPage);

  resp = await browserJson(actorPage, `/api/poker/play/hands/${encodeURIComponent(detail?.hand?.handId || '')}/actions`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': actorAddress },
    data: {
      actionKind: 'fold',
      amountOil: 0,
    },
  });
  expect(resp.ok).toBe(true);

  await startPokerTransportProbe(observerPage, {
    channelKind: 'table',
    channelId: 'pkt_play_cash_01',
    viewer: 'player',
    lastSeenVersion: initialSnapshot.version,
  });
  await observerPage.waitForFunction(() => Array.isArray(window.__pokerTransportProbe?.messages)
    && window.__pokerTransportProbe.messages.some((entry) => entry.messageKind === 'delta' && entry.reason === 'action'));
  const replayMessages = await observerPage.evaluate(() => window.__pokerTransportProbe?.messages || []);
  const replayDelta = replayMessages.find((entry) => entry.messageKind === 'delta' && entry.reason === 'action');
  expect(replayDelta).toBeTruthy();
  expect(Number(replayDelta.prevVersion || 0)).toBe(Number(initialSnapshot.version || 0));

  const channel = await getPokerTransportChannel(request, {
    channelKind: 'table',
    channelId: 'pkt_play_cash_01',
  });
  const futureVersion = Number(channel.version || 0) + 10;

  await startPokerTransportProbe(observerPage, {
    channelKind: 'table',
    channelId: 'pkt_play_cash_01',
    viewer: 'player',
    lastSeenVersion: futureVersion,
  });
  await observerPage.waitForFunction(() => Array.isArray(window.__pokerTransportProbe?.messages)
    && window.__pokerTransportProbe.messages.some((entry) => entry.messageKind === 'reset' && entry.reason === 'future_version'));
  const resetMessages = await observerPage.evaluate(() => window.__pokerTransportProbe?.messages || []);
  const resetEnvelope = resetMessages.find((entry) => entry.messageKind === 'reset' && entry.reason === 'future_version');
  expect(resetEnvelope).toBeTruthy();
  expect(resetEnvelope.channelKind).toBe('table');
  expect(resetEnvelope.channelId).toBe('pkt_play_cash_01');
  expect(resetEnvelope.snapshot?.table?.tableId).toBe('pkt_play_cash_01');
  expect(Number(resetEnvelope.version || 0)).toBe(Number(channel.version || 0));

  await stopPokerTransportProbe(observerPage);
  await contextA.close();
  await contextB.close();
});
