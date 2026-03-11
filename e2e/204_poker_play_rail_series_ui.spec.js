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

test('M23.19: spectator rail series page shows the split tournament field and links to active tables', async ({ browser, request }) => {
  const users = [
    { address: 'So1anaMockSeriesRaiUiA11111111111111111111111', houseId: 'house_series_rail_ui_a', streamId: 'stream-series-rail-ui-a' },
    { address: 'So1anaMockSeriesRaiUiB11111111111111111111111', houseId: 'house_series_rail_ui_b', streamId: 'stream-series-rail-ui-b' },
    { address: 'So1anaMockSeriesRaiUiC11111111111111111111111', houseId: 'house_series_rail_ui_c', streamId: 'stream-series-rail-ui-c' },
    { address: 'So1anaMockSeriesRaiUiD11111111111111111111111', houseId: 'house_series_rail_ui_d', streamId: 'stream-series-rail-ui-d' },
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
      displayName: 'Series Rail UI Alpha',
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
      displayName: 'Series Rail UI Bravo',
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
      displayName: 'Series Rail UI Charlie',
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

  resp = await browserJson(pages[3], '/api/poker/play/matchmake', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[3].address },
    data: {
      tableType: 'tournament',
      smallBlindOil: 75,
      bigBlindOil: 150,
      buyInOil: 600,
      lateRegistrationHands: 1,
      displayName: 'Series Rail UI Delta',
      asOf: '2026-03-10T12:00:04.000Z',
    },
  });
  expect(resp.ok).toBe(true);

  const railContext = await browser.newContext();
  const railPage = await railContext.newPage();
  await railPage.goto('/poker/play/rail?embed=1');
  await expect(railPage.getByRole('link', { name: 'Open Series Rail' }).first()).toBeVisible();

  await railPage.goto(`/poker/play/rail/series/${encodeURIComponent(seriesId)}?embed=1`);
  await expect(railPage.getByRole('heading', { name: 'Tournament Rail Series' })).toBeVisible();
  await expect(railPage.getByText('Entrants', { exact: true })).toBeVisible();
  await expect(railPage.getByText('Prize Pool', { exact: true })).toBeVisible();
  await expect(railPage.getByText('Payout Ladder')).toBeVisible();
  await expect(railPage.getByRole('link', { name: 'Open Rail Table' })).toHaveCount(2);
  await expect(railPage.getByText('Series Rail UI Alpha')).toBeVisible();

  await railContext.close();
  await Promise.all(contexts.map((context) => context.close()));
});
