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

test('M23.25: quick-seat sit-and-go shows seats-to-start and flips live once the final seat arrives', async ({ browser, page, request }) => {
  const users = [
    { address: 'So1anaMockSitngoUiA111111111111111111111111', houseId: 'house_sitngo_ui_a', streamId: 'stream-sitngo-ui-a' },
    { address: 'So1anaMockSitngoUiB111111111111111111111111', houseId: 'house_sitngo_ui_b', streamId: 'stream-sitngo-ui-b' },
    { address: 'So1anaMockSitngoUiC111111111111111111111111', houseId: 'house_sitngo_ui_c', streamId: 'stream-sitngo-ui-c' },
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
  await page.locator('#pokerPlayMatchmakeFillPolicy').selectOption('fill_to_full');
  await page.locator('#pokerPlayMatchmakeMaxSeats').selectOption('3');
  await page.locator('#pokerPlayMatchmakeSmallBlind').fill('60');
  await page.locator('#pokerPlayMatchmakeBigBlind').fill('120');
  await page.locator('#pokerPlayMatchmakeBuyIn').fill('1200');
  await page.locator('#pokerPlayMatchmakeDisplayName').fill('UI Sitngo Alpha');

  await Promise.all([
    page.waitForURL(/\/poker\/play\/tables\/.+\?embed=1$/),
    page.getByRole('button', { name: 'Join Or Create' }).click(),
  ]);

  const firstTableUrl = page.url();
  const firstTableId = decodeURIComponent(firstTableUrl.match(/\/poker\/play\/tables\/([^?]+)/)?.[1] || '');
  expect(firstTableId).toBeTruthy();
  await expect(page.getByRole('heading', { name: /6-Max Tournament 60\/120/i })).toBeVisible();
  await expect(page.getByText('Sit-and-go is waiting for 2 more seats before hand 1 starts.')).toBeVisible();
  await expect(page.getByText('2 to start')).toBeVisible();
  await expect(page.locator('.pokerSummaryValue').filter({ hasText: /^sit-and-go$/ })).toBeVisible();

  const sitngoPayload = {
    tableType: 'tournament',
    fillPolicy: 'fill_to_full',
    maxSeats: 3,
    minPlayers: 2,
    smallBlindOil: 60,
    bigBlindOil: 120,
    buyInOil: 1200,
  };

  let resp = await browserJson(pageB, '/api/poker/play/matchmake', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[1].address },
    data: {
      ...sitngoPayload,
      displayName: 'UI Sitngo Bravo',
    },
  });
  expect(resp.ok).toBe(true);
  expect(String(resp.body?.data?.table?.tableId || '')).toBe(firstTableId);

  await page.reload();
  await expect(page.getByText('Sit-and-go is waiting for 1 more seat before hand 1 starts.')).toBeVisible();
  await expect(page.getByText('1 to start')).toBeVisible();

  resp = await browserJson(pageC, '/api/poker/play/matchmake', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[2].address },
    data: {
      ...sitngoPayload,
      displayName: 'UI Sitngo Charlie',
    },
  });
  expect(resp.ok).toBe(true);
  expect(String(resp.body?.data?.table?.tableId || '')).toBe(firstTableId);
  expect(resp.body?.data?.hand?.status).toBe('live');

  await page.reload();
  await expect(page.getByText('A live hand is in progress.')).toBeVisible();
  await expect(page.getByText('hand 1', { exact: true })).toBeVisible();

  await contextB.close();
  await contextC.close();
});
