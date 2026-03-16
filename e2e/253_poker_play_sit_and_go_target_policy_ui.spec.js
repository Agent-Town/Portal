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

test('M23.31: quick-seat target sit-and-go starts at the configured target instead of the full table cap', async ({ browser, page, request }) => {
  const users = [
    { address: 'So1anaMockSitngoTargetUiA11111111111111111', houseId: 'house_sitngo_target_ui_a', streamId: 'stream-sitngo-target-ui-a' },
    { address: 'So1anaMockSitngoTargetUiB11111111111111111', houseId: 'house_sitngo_target_ui_b', streamId: 'stream-sitngo-target-ui-b' },
    { address: 'So1anaMockSitngoTargetUiC11111111111111111', houseId: 'house_sitngo_target_ui_c', streamId: 'stream-sitngo-target-ui-c' },
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

  await page.goto('/');
  await bindPageSession(page, users[0]);
  await verifyStreamflowAndFundOil(page, request, {
    address: users[0].address,
    streamId: users[0].streamId,
  });

  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();
  await pageB.goto('/');
  await bindPageSession(pageB, users[1]);
  await verifyStreamflowAndFundOil(pageB, request, {
    address: users[1].address,
    streamId: users[1].streamId,
  });

  const contextC = await browser.newContext();
  const pageC = await contextC.newPage();
  await pageC.goto('/');
  await bindPageSession(pageC, users[2]);
  await verifyStreamflowAndFundOil(pageC, request, {
    address: users[2].address,
    streamId: users[2].streamId,
  });

  await page.goto('/poker/play?embed=1');
  await expect(page.getByRole('heading', { name: 'Quick Seat' })).toBeVisible();
  await page.locator('#pokerPlayMatchmakeType').selectOption('tournament');
  await page.locator('[data-poker-section="quick-seat"] details summary').click();
  await page.locator('#pokerPlayMatchmakeFillPolicy').selectOption('fill_to_target');
  await expect(page.locator('#pokerPlayMatchmakeStartTargetRow')).toBeVisible();
  await page.locator('#pokerPlayMatchmakeMaxSeats').selectOption('6');
  await page.locator('#pokerPlayMatchmakeStartTargetSeats').selectOption('3');
  await page.locator('#pokerPlayMatchmakeSmallBlind').fill('40');
  await page.locator('#pokerPlayMatchmakeBigBlind').fill('80');
  await page.locator('#pokerPlayMatchmakeBuyIn').fill('800');
  await page.locator('#pokerPlayMatchmakeTitle').fill('Target Sitngo Table');
  await page.locator('#pokerPlayMatchmakeDisplayName').fill('Target Alpha');

  await Promise.all([
    page.waitForURL(/\/poker\/play\/tables\/.+\?embed=1$/),
    page.getByRole('button', { name: 'Join Or Create' }).click(),
  ]);

  const firstTableUrl = page.url();
  const firstTableId = decodeURIComponent(firstTableUrl.match(/\/poker\/play\/tables\/([^?]+)/)?.[1] || '');
  expect(firstTableId).toBeTruthy();
  const tableCard = page.locator('.pokerCard').filter({
    has: page.getByRole('heading', { name: 'Target Sitngo Table' }),
  }).first();
  await expect(tableCard).toContainText('Start Policy');
  await expect(tableCard).toContainText('sit-and-go target');
  await expect(tableCard).toContainText('Start Target');
  await expect(tableCard).toContainText('3');
  await expect(tableCard).toContainText('Sit-and-go is waiting for 2 more seats before hand 1 starts.');
  await expect(tableCard).toContainText('2 to start');
  await expect(tableCard).toContainText('1/6 seated');

  const sitngoPayload = {
    tableType: 'tournament',
    fillPolicy: 'fill_to_target',
    startTargetSeats: 3,
    maxSeats: 6,
    minPlayers: 2,
    smallBlindOil: 40,
    bigBlindOil: 80,
    buyInOil: 800,
  };

  let resp = await browserJson(pageB, '/api/poker/play/matchmake', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[1].address },
    data: {
      ...sitngoPayload,
      displayName: 'Target Bravo',
    },
  });
  expect(resp.ok).toBe(true);
  expect(String(resp.body?.data?.table?.tableId || '')).toBe(firstTableId);

  await page.reload();
  await expect(tableCard).toContainText('Sit-and-go is waiting for 1 more seat before hand 1 starts.');
  await expect(tableCard).toContainText('1 to start');
  await expect(tableCard).toContainText('2/6 seated');

  resp = await browserJson(pageC, '/api/poker/play/matchmake', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[2].address },
    data: {
      ...sitngoPayload,
      displayName: 'Target Charlie',
    },
  });
  expect(resp.ok).toBe(true);
  expect(String(resp.body?.data?.table?.tableId || '')).toBe(firstTableId);
  expect(resp.body?.data?.hand?.status).toBe('live');

  await page.reload();
  await expect(tableCard).toContainText('A live hand is in progress.');
  await expect(tableCard).toContainText('3/6 seated');
  await expect(tableCard).toContainText('hand 1');

  await contextB.close();
  await contextC.close();
});
