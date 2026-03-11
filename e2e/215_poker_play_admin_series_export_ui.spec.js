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

test('M23.30: hidden operator controls can export one full tournament series review from a table view', async ({ browser, request }) => {
  const users = [
    { address: 'So1anaMockSeriesExportA11111111111111111111111', houseId: 'house_series_export_ui_a', streamId: 'stream-series-export-ui-a' },
    { address: 'So1anaMockSeriesExportB11111111111111111111111', houseId: 'house_series_export_ui_b', streamId: 'stream-series-export-ui-b' },
    { address: 'So1anaMockSeriesExportC11111111111111111111111', houseId: 'house_series_export_ui_c', streamId: 'stream-series-export-ui-c' },
    { address: 'So1anaMockSeriesExportD11111111111111111111111', houseId: 'house_series_export_ui_d', streamId: 'stream-series-export-ui-d' },
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
  for (let index = 0; index < users.length; index += 1) {
    const context = await browser.newContext();
    const page = await context.newPage();
    contexts.push(context);
    pages.push(page);
    if (index === 0) {
      await page.addInitScript(() => {
        window.localStorage.setItem('poker.adminToken', 'test-admin');
      });
    }
    await page.goto('/');
    await bindPageSession(page, users[index]);
    await verifyStreamflowAndFundOil(page, request, {
      address: users[index].address,
      streamId: users[index].streamId,
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
      displayName: 'Series Export UI Alpha',
    },
  });
  expect(resp.ok).toBe(true);
  const tableId = String(resp.body?.data?.table?.tableId || '');
  const seriesId = String(resp.body?.data?.series?.seriesId || resp.body?.data?.table?.rules?.seriesId || '');
  expect(tableId).toBeTruthy();
  expect(seriesId).toBeTruthy();

  for (let index = 1; index <= 2; index += 1) {
    resp = await browserJson(pages[index], '/api/poker/play/matchmake', {
      method: 'POST',
      headers: { 'x-wallet-solana-address': users[index].address },
      data: {
        tableType: 'tournament',
        smallBlindOil: 75,
        bigBlindOil: 150,
        buyInOil: 600,
        lateRegistrationHands: 1,
        displayName: `Series Export UI ${index}`,
      },
    });
    expect(resp.ok).toBe(true);
  }

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
      displayName: 'Series Export UI Delta',
      asOf: '2026-03-10T12:00:04.000Z',
    },
  });
  expect(resp.ok).toBe(true);

  await pages[0].goto(`/poker/play/tables/${encodeURIComponent(tableId)}?embed=1`);
  await expect(pages[0].getByRole('heading', { name: 'Operator Review' })).toBeVisible();
  await expect(pages[0].getByRole('button', { name: 'Export Series Review' })).toBeVisible();

  await pages[0].getByRole('button', { name: 'Export Series Review' }).click();
  await expect(pages[0].getByText(`Exported poker-series-review-${seriesId}.json`)).toBeVisible();

  await Promise.all(contexts.map((context) => context.close()));
});
