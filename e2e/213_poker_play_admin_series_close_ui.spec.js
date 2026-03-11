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

test('M23.28: hidden operator controls can cancel a live tournament series and show refunded state', async ({ browser, request }) => {
  const users = [
    { address: 'So1anaMockSeriesCoseUiA1111111111111111111111111', houseId: 'house_series_close_ui_a', streamId: 'stream-series-close-ui-a' },
    { address: 'So1anaMockSeriesCoseUiB1111111111111111111111111', houseId: 'house_series_close_ui_b', streamId: 'stream-series-close-ui-b' },
    { address: 'So1anaMockSeriesCoseUiC1111111111111111111111111', houseId: 'house_series_close_ui_c', streamId: 'stream-series-close-ui-c' },
    { address: 'So1anaMockSeriesCoseUiD1111111111111111111111111', houseId: 'house_series_close_ui_d', streamId: 'stream-series-close-ui-d' },
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
      displayName: 'Series Close UI Alpha',
    },
  });
  expect(resp.ok).toBe(true);
  const tableId = String(resp.body?.data?.table?.tableId || '');

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
        displayName: `Series Close UI ${index}`,
      },
    });
    expect(resp.ok).toBe(true);
  }

  const liveDetailResp = await browserJson(pages[0], `/api/poker/play/tables/${encodeURIComponent(tableId)}?asOf=2026-03-10T12%3A00%3A03.000Z`, {
    headers: { 'x-wallet-solana-address': users[0].address },
  });
  expect(liveDetailResp.ok).toBe(true);
  const actingSeat = Number(liveDetailResp.body?.data?.hand?.actingSeat || 0);
  const actorPage = actingSeat === 1 ? pages[0] : pages[1];
  const actorAddress = actingSeat === 1 ? users[0].address : users[1].address;
  resp = await browserJson(actorPage, `/api/poker/play/hands/${encodeURIComponent(liveDetailResp.body?.data?.hand?.handId || '')}/actions`, {
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
      displayName: 'Series Close UI Delta',
      asOf: '2026-03-10T12:00:04.000Z',
    },
  });
  expect(resp.ok).toBe(true);

  await pages[0].goto(`/poker/play/tables/${encodeURIComponent(tableId)}?embed=1`);
  await expect(pages[0].getByRole('heading', { name: 'Operator Review' })).toBeVisible();
  await expect(pages[0].getByRole('button', { name: 'Cancel Series + Refund' })).toBeVisible();

  await pages[0].getByRole('button', { name: 'Cancel Series + Refund' }).click();
  await expect(pages[0].locator('p').filter({ hasText: /Operator closed the tournament series\./ }).first()).toBeVisible();
  await expect(pages[0].getByText(/4 seats refunded for 6000 OIL\./)).toBeVisible();
  await expect(pages[0].getByText('cancelled')).toBeVisible();
  await expect(pages[0].getByText('Refunded').first()).toBeVisible();
  await expect(pages[0].getByRole('button', { name: 'Cancel Series + Refund' })).toHaveCount(0);
  await expect(pages[0].getByRole('heading', { name: 'Submit Action' })).toHaveCount(0);
  await expect(pages[0].getByText('No active tables remain in this series.')).toBeVisible();

  await Promise.all(contexts.map((context) => context.close()));
});
