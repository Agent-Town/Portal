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

test('M23.26: rail series UI updates via push before fallback polling fires', async ({ browser, request }) => {
  const users = [
    { address: 'So1anaMockSeriesPushA11111111111111111111111', houseId: 'house_series_push_a', streamId: 'stream-series-push-a' },
    { address: 'So1anaMockSeriesPushB11111111111111111111111', houseId: 'house_series_push_b', streamId: 'stream-series-push-b' },
    { address: 'So1anaMockSeriesPushC11111111111111111111111', houseId: 'house_series_push_c', streamId: 'stream-series-push-c' },
    { address: 'So1anaMockSeriesPushD11111111111111111111111', houseId: 'house_series_push_d', streamId: 'stream-series-push-d' },
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
      displayName: 'Series Push Alpha',
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
      displayName: 'Series Push Bravo',
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
      displayName: 'Series Push Charlie',
    },
  });
  expect(resp.ok).toBe(true);

  const detailResp = await browserJson(pages[0], `/api/poker/play/tables/${encodeURIComponent(tableId)}?asOf=2026-03-10T12%3A00%3A03.000Z`, {
    headers: { 'x-wallet-solana-address': users[0].address },
  });
  expect(detailResp.ok).toBe(true);
  const actingSeat = Number(detailResp.body?.data?.hand?.actingSeat || 0);
  const actorPage = actingSeat === 1 ? pages[0] : pages[1];
  const actorAddress = actingSeat === 1 ? users[0].address : users[1].address;

  const railContext = await browser.newContext();
  const railPage = await railContext.newPage();
  await railPage.goto(`/poker/play/rail/series/${encodeURIComponent(seriesId)}?embed=1`);
  await expect(railPage.locator('.pokerBadge').filter({ hasText: 'hand 1' }).first()).toBeVisible();

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

  await expect(railPage.locator('.pokerBadge').filter({ hasText: 'hand 2' }).first()).toBeVisible({ timeout: 1500 });

  await railContext.close();
  await Promise.all(contexts.map((context) => context.close()));
});
