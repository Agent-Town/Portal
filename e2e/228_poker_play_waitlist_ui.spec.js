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

test('M22.7: waitlist UI shows queue position and promotes the first waiting seat into the table', async ({ browser, request }) => {
  const seatOne = {
    address: 'So1anaMockPhase22WaitUiA111111111111111111111111',
    houseId: 'house_phase22_waitui_a',
    streamId: 'stream-phase22-waitui-a',
  };
  const waiter = {
    address: 'So1anaMockPhase22WaitUiC111111111111111111111111',
    houseId: 'house_phase22_waitui_c',
    streamId: 'stream-phase22-waitui-c',
  };

  await seedPokerPlayHarness(request, {
    scenario: 'waitlist_full_cash',
    asOf: '2026-03-11T11:00:00.000Z',
    tableId: 'pkt_play_phase22_waitlist_ui',
    actors: [
      {
        seatNumber: 1,
        address: seatOne.address,
        houseId: seatOne.houseId,
        displayName: 'Wait UI Alpha',
      },
      {
        seatNumber: 2,
        address: 'So1anaMockPhase22WaitUiB111111111111111111111111',
        houseId: 'house_phase22_waitui_b',
        displayName: 'Wait UI Bravo',
      },
    ],
  });

  const contextSeatOne = await browser.newContext();
  const pageSeatOne = await contextSeatOne.newPage();
  await pageSeatOne.goto('/');
  await bindPageSession(pageSeatOne, seatOne);

  const contextWaiter = await browser.newContext();
  const pageWaiter = await contextWaiter.newPage();
  await pageWaiter.goto('/');
  await bindPageSession(pageWaiter, waiter);

  for (const actor of [seatOne, waiter]) {
    await fundOilWallet(request, {
      walletSubject: actor.address,
      houseId: actor.houseId,
      amount: 2000,
    });
  }

  await pageWaiter.goto('/poker/play/tables/pkt_play_phase22_waitlist_ui?embed=1');
  await expect(pageWaiter.getByRole('heading', { name: 'Waitlist', exact: true })).toBeVisible();
  await expect(pageWaiter.getByRole('button', { name: 'Join Waitlist' })).toBeVisible();
  await pageWaiter.getByRole('button', { name: 'Join Waitlist' }).click();
  await expect(pageWaiter.getByText('Position')).toBeVisible();
  await expect(pageWaiter.getByText('Leave Waitlist')).toBeVisible();

  await browserJson(pageSeatOne, '/api/poker/play/tables/pkt_play_phase22_waitlist_ui/leave', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': seatOne.address },
    data: {
      asOf: '2026-03-11T11:01:00.000Z',
    },
  });

  const detailResp = await browserJson(pageSeatOne, '/api/poker/play/tables/pkt_play_phase22_waitlist_ui', {
    headers: { 'x-wallet-solana-address': seatOne.address },
  });
  expect(detailResp.ok).toBe(true);

  const settleResp = await browserJson(pageSeatOne, `/api/poker/play/hands/${encodeURIComponent(detailResp.body?.data?.hand?.handId || '')}/actions`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': seatOne.address },
    data: {
      actionKind: 'fold',
      amountOil: 0,
      asOf: '2026-03-11T11:01:30.000Z',
    },
  });
  expect(settleResp.ok).toBe(true);

  await pageWaiter.goto('/poker/play/tables/pkt_play_phase22_waitlist_ui?embed=1&asOf=2026-03-11T11%3A02%3A00.000Z');
  await expect(pageWaiter.getByRole('heading', { name: 'Your Seat' })).toBeVisible();
  await expect(pageWaiter.getByRole('heading', { name: 'Waitlist', exact: true })).toHaveCount(0);
  await expect(pageWaiter.locator('#pokerPlaySeatNumber')).toHaveCount(0);
  await expect(pageWaiter.getByText('250 OIL').first()).toBeVisible();

  await contextSeatOne.close();
  await contextWaiter.close();
});
