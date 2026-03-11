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

test('M23.25: rail series stream emits push events when a member table changes', async ({ browser, request }) => {
  const users = [
    { address: 'So1anaMockSeriesStrA111111111111111111111111', houseId: 'house_series_stream_a', streamId: 'stream-series-stream-a' },
    { address: 'So1anaMockSeriesStrB111111111111111111111111', houseId: 'house_series_stream_b', streamId: 'stream-series-stream-b' },
    { address: 'So1anaMockSeriesStrC111111111111111111111111', houseId: 'house_series_stream_c', streamId: 'stream-series-stream-c' },
    { address: 'So1anaMockSeriesStrD111111111111111111111111', houseId: 'house_series_stream_d', streamId: 'stream-series-stream-d' },
  ];

  await seedStreamflowLocks(request, {
    locks: users.map((user) => ({
      address: user.address,
      streamId: user.streamId,
      tokenSymbol: '$AGENTTOWN',
      locked: true,
      lockedAmountAtomic: '2500000',
    })),
  });

  const contexts = [];
  const pages = [];
  for (const user of users) {
    const context = await browser.newContext();
    const page = await context.newPage();
    contexts.push(context);
    pages.push(page);
    await page.goto('/');
    await bindPageSession(page, user);
    await verifyStreamflowAndFundOil(page, request, {
      address: user.address,
      streamId: user.streamId,
    });
  }

  let resp = await browserJson(pages[0], '/api/poker/play/matchmake', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[0].address },
    data: {
      tableType: 'tournament',
      smallBlindOil: 75,
      bigBlindOil: 150,
      buyInOil: 600,
      lateRegistrationHands: 1,
      displayName: 'Series Stream Alpha',
    },
  });
  expect(resp.ok).toBe(true);
  const tableId = String(resp.body?.data?.table?.tableId || '');
  const seriesId = String(resp.body?.data?.series?.seriesId || resp.body?.data?.table?.rules?.seriesId || '');

  resp = await browserJson(pages[1], '/api/poker/play/matchmake', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[1].address },
    data: {
      tableType: 'tournament',
      smallBlindOil: 75,
      bigBlindOil: 150,
      buyInOil: 600,
      lateRegistrationHands: 1,
      displayName: 'Series Stream Bravo',
    },
  });
  expect(resp.ok).toBe(true);

  resp = await browserJson(pages[2], '/api/poker/play/matchmake', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[2].address },
    data: {
      tableType: 'tournament',
      smallBlindOil: 75,
      bigBlindOil: 150,
      buyInOil: 600,
      lateRegistrationHands: 1,
      displayName: 'Series Stream Charlie',
    },
  });
  expect(resp.ok).toBe(true);

  const railContext = await browser.newContext();
  const railPage = await railContext.newPage();
  await railPage.goto(`/poker/play/rail/series/${encodeURIComponent(seriesId)}?embed=1`);
  await railPage.evaluate((currentSeriesId) => {
    window.__pokerSeriesStreamEvents = [];
    if (window.__pokerSeriesStreamTest) {
      window.__pokerSeriesStreamTest.close();
    }
    const stream = new window.EventSource(`/api/poker/play/rail/series/${encodeURIComponent(currentSeriesId)}/stream?embed=1`, { withCredentials: true });
    window.__pokerSeriesStreamTest = stream;
    const append = (event, payload) => {
      window.__pokerSeriesStreamEvents.push({ event, payload });
    };
    stream.addEventListener('ready', (event) => append('ready', JSON.parse(event.data)));
    stream.addEventListener('series', (event) => append('series', JSON.parse(event.data)));
  }, seriesId);
  await railPage.waitForFunction(() => Array.isArray(window.__pokerSeriesStreamEvents) && window.__pokerSeriesStreamEvents.some((entry) => entry.event === 'ready'));

  const detailResp = await browserJson(pages[0], `/api/poker/play/tables/${encodeURIComponent(tableId)}?asOf=2026-03-10T12%3A00%3A03.000Z`, {
    headers: { 'x-wallet-solana-address': users[0].address },
  });
  expect(detailResp.ok).toBe(true);
  const actingSeat = Number(detailResp.body?.data?.hand?.actingSeat || 0);
  const actorPage = actingSeat === 1 ? pages[0] : pages[1];
  const actorAddress = actingSeat === 1 ? users[0].address : users[1].address;
  resp = await browserJson(actorPage, `/api/poker/play/hands/${encodeURIComponent(detailResp.body?.data?.hand?.handId || '')}/actions`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': actorAddress },
    data: {
      actionKind: 'fold',
      amountOil: 0,
      asOf: '2026-03-10T12:00:03.000Z',
    },
  });
  expect(resp.ok).toBe(true);

  await railPage.waitForFunction(() => (
    Array.isArray(window.__pokerSeriesStreamEvents)
      && window.__pokerSeriesStreamEvents.some((entry) => entry.event === 'series' && entry.payload && entry.payload.reason === 'action')
  ), null, { timeout: 1500 });

  const events = await railPage.evaluate(() => window.__pokerSeriesStreamEvents || []);
  const actionEvent = events.find((entry) => entry.event === 'series' && entry.payload && entry.payload.reason === 'action');
  expect(actionEvent).toBeTruthy();
  expect(String(actionEvent.payload.seriesId || '')).toBe(seriesId);
  expect(String(actionEvent.payload.tableId || '')).toBe(tableId);

  await railPage.evaluate(() => {
    if (window.__pokerSeriesStreamTest) window.__pokerSeriesStreamTest.close();
  });
  await railContext.close();
  await Promise.all(contexts.map((context) => context.close()));
});
