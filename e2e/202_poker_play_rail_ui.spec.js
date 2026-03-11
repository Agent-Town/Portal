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

test('M23.17: spectator rail pages stay public-only and update live without a player session', async ({ browser, request }) => {
  const userA = {
    address: 'So1anaMockRaiUiA11111111111111111111111111111',
    houseId: 'house_rail_ui_a',
    streamId: 'stream-rail-ui-a',
  };
  const userB = {
    address: 'So1anaMockRaiUiB11111111111111111111111111111',
    houseId: 'house_rail_ui_b',
    streamId: 'stream-rail-ui-b',
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
      displayName: 'Rail UI Alpha',
      buyInOil: 400,
    },
  });
  expect(resp.ok).toBe(true);

  resp = await browserJson(pageB, '/api/poker/play/tables/pkt_play_cash_01/sit', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': userB.address },
    data: {
      seatNumber: 2,
      displayName: 'Rail UI Bravo',
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

  const railContext = await browser.newContext();
  const railPage = await railContext.newPage();
  await railPage.goto('/poker/play/rail?embed=1');
  await expect(railPage.getByRole('heading', { name: 'Live Poker Rail' })).toBeVisible();
  await expect(railPage.getByRole('link', { name: 'Open Rail Table' }).first()).toBeVisible();

  await railPage.goto('/poker/play/rail/tables/pkt_play_cash_01?embed=1');
  await expect(railPage.getByRole('heading', { name: 'Rail View' })).toBeVisible();
  await expect(railPage.getByRole('heading', { name: 'Public Action Log' })).toBeVisible();
  await expect(railPage.getByText('Rail UI Alpha')).toBeVisible();
  await expect(railPage.getByText('Rail UI Bravo')).toBeVisible();
  await expect(railPage.getByRole('heading', { name: 'Take A Seat' })).toHaveCount(0);
  await expect(railPage.getByRole('heading', { name: 'Your Seat' })).toHaveCount(0);
  await expect(railPage.getByRole('heading', { name: 'Seat Thread' })).toHaveCount(0);
  await expect(railPage.getByRole('heading', { name: 'Submit Action' })).toHaveCount(0);
  await expect(railPage.locator('.pokerBadge').filter({ hasText: 'hand 1' }).first()).toBeVisible();

  resp = await browserJson(actorPage, `/api/poker/play/hands/${encodeURIComponent(detail?.hand?.handId || '')}/actions`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': actorAddress },
    data: {
      actionKind: 'fold',
      amountOil: 0,
    },
  });
  expect(resp.ok).toBe(true);

  await expect(railPage.locator('.pokerBadge').filter({ hasText: 'hand 2' }).first()).toBeVisible({ timeout: 1500 });

  await railContext.close();
  await contextA.close();
  await contextB.close();
});
