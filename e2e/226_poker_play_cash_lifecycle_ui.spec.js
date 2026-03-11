const { test, expect } = require('@playwright/test');
const {
  fundOilWallet,
  resetPortalWebState,
} = require('./helpers/portal_web');
const {
  bindPageSession,
  browserJson,
  seedPokerPlayHarness,
} = require('./helpers/poker_play');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M22.6: cash lifecycle UI exposes reload, away, and return controls on the same seat', async ({ browser, request }) => {
  const reloadOnly = {
    address: 'So1anaMockPhase22CashUiReQadA11111111111111111111',
    houseId: 'house_phase22_cashui_reload',
    streamId: 'stream-phase22-cashui-reload',
  };
  const driver = {
    address: 'So1anaMockPhase22CashUiA111111111111111111111111',
    houseId: 'house_phase22_cashui_a',
  };
  const awaySeat = {
    address: 'So1anaMockPhase22CashUiC111111111111111111111111',
    houseId: 'house_phase22_cashui_c',
    streamId: 'stream-phase22-cashui-c',
  };
  await seedPokerPlayHarness(request, {
    scenario: 'cash_lifecycle_waiting',
    asOf: '2026-03-11T09:00:00.000Z',
    tableId: 'pkt_play_phase22_cash_lifecycle_ui',
    actors: [
      {
        seatNumber: 1,
        address: driver.address,
        houseId: driver.houseId,
        displayName: 'Lifecycle UI Alpha',
      },
      {
        seatNumber: 2,
        address: 'So1anaMockPhase22CashUiB111111111111111111111111',
        houseId: 'house_phase22_cashui_b',
        displayName: 'Lifecycle UI Bravo',
      },
      {
        seatNumber: 3,
        address: awaySeat.address,
        houseId: awaySeat.houseId,
        displayName: 'Lifecycle UI Charlie',
      },
    ],
  });

  const contextReload = await browser.newContext();
  const pageReload = await contextReload.newPage();
  await pageReload.goto('/');
  await bindPageSession(pageReload, reloadOnly);
  await fundOilWallet(request, {
    walletSubject: reloadOnly.address,
    houseId: reloadOnly.houseId,
    amount: 2000,
  });
  let resp = await browserJson(pageReload, '/api/poker/play/tables/pkt_play_cash_01/sit', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': reloadOnly.address },
    data: {
      seatNumber: 1,
      displayName: 'Reload UI Seat',
      buyInOil: 400,
    },
  });
  expect(resp.ok).toBe(true);

  const contextAway = await browser.newContext();
  const pageAway = await contextAway.newPage();
  await pageAway.goto('/');
  await bindPageSession(pageAway, awaySeat);
  await fundOilWallet(request, {
    walletSubject: awaySeat.address,
    houseId: awaySeat.houseId,
    amount: 2000,
  });

  const contextDriver = await browser.newContext();
  const pageDriver = await contextDriver.newPage();
  await pageDriver.goto('/');
  await bindPageSession(pageDriver, driver);

  await pageReload.goto('/poker/play/tables/pkt_play_cash_01?embed=1');
  await expect(pageReload.getByRole('heading', { name: 'Your Seat' })).toBeVisible();
  await expect(pageReload.getByRole('button', { name: 'Reload Stack' })).toBeVisible();
  await pageReload.locator('#pokerPlayReloadAmount').fill('40');
  await pageReload.getByRole('button', { name: 'Reload Stack' }).click();
  await expect(pageReload.getByText('440 OIL').first()).toBeVisible();

  await pageAway.goto('/poker/play/tables/pkt_play_phase22_cash_lifecycle_ui?embed=1');
  await expect(pageAway.getByRole('button', { name: 'Mark Away' })).toBeVisible();
  await pageAway.getByRole('button', { name: 'Mark Away' }).click();
  await expect(pageAway.getByText('Your seat is marked away. The wallet-bound seat stays yours until you return or cash out.')).toBeVisible();
  await expect(pageAway.getByRole('button', { name: 'Return To Table' })).toBeEnabled();

  const handResp = await browserJson(pageDriver, '/api/poker/play/tables/pkt_play_phase22_cash_lifecycle_ui', {
    headers: { 'x-wallet-solana-address': driver.address },
  });
  expect(handResp.ok).toBe(true);
  await pageAway.getByRole('button', { name: 'Return To Table' }).click();
  await expect(pageAway.getByText('Your seat is marked away. The wallet-bound seat stays yours until you return or cash out.')).toHaveCount(0);
  await expect(pageAway.getByRole('button', { name: 'Mark Away' })).toBeEnabled();

  await browserJson(pageDriver, `/api/poker/play/hands/${encodeURIComponent(handResp.body?.data?.hand?.handId || '')}/actions`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': driver.address },
    data: {
      actionKind: 'fold',
      amountOil: 0,
      asOf: '2026-03-11T09:01:00.000Z',
    },
  });

  await pageAway.goto('/poker/play/tables/pkt_play_phase22_cash_lifecycle_ui?embed=1&asOf=2026-03-11T09%3A02%3A00.000Z');
  await expect(pageAway.getByText('active').first()).toBeVisible();

  await contextReload.close();
  await contextAway.close();
  await contextDriver.close();
});
