const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const {
  bindPageSession,
  browserJson,
  seedPokerPlayHarness,
} = require('./helpers/poker_play');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M22.2: matched-pot settlement produces main and side pots plus returned uncalled chips', async ({ browser, request }) => {
  const userC = {
    address: 'So1anaPhase22SidepotC111111111111111111111111',
    houseId: 'house_phase22_sidepot_c',
  };
  const seeded = await seedPokerPlayHarness(request, {
    scenario: 'sidepot_live',
    asOf: '2026-03-11T10:05:00.000Z',
    actors: [
      {
        seatNumber: 1,
        address: 'So1anaPhase22SidepotA111111111111111111111111',
        houseId: 'house_phase22_sidepot_a',
        displayName: 'Harness Alpha',
      },
      {
        seatNumber: 2,
        address: 'So1anaPhase22SidepotB111111111111111111111111',
        houseId: 'house_phase22_sidepot_b',
        displayName: 'Harness Bravo',
      },
      {
        seatNumber: 3,
        address: userC.address,
        houseId: userC.houseId,
        displayName: 'Harness Charlie',
      },
    ],
  });

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/');
  await bindPageSession(page, userC);

  const actionResp = await browserJson(page, `/api/poker/play/hands/${encodeURIComponent(seeded.handId)}/actions`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': userC.address },
    data: {
      actionKind: 'check',
      asOf: '2026-03-11T10:05:01.000Z',
    },
  });
  expect(actionResp.ok).toBe(true);
  const data = actionResp.body?.data || {};
  expect(data?.hand?.status).toBe('settled');
  expect(data?.table?.summary?.liveHand).toBe(false);
  expect(Array.isArray(data?.hand?.result?.potSlices)).toBe(true);
  expect(data.hand.result.potSlices).toHaveLength(2);

  const [mainPot, sidePot] = data.hand.result.potSlices;
  expect(mainPot?.potKind).toBe('main');
  expect(Number(mainPot?.totalOil || 0)).toBe(300);
  expect(mainPot?.eligibleSeatNumbers).toEqual([1, 2, 3]);
  expect(mainPot?.winningSeatNumbers).toEqual([1]);
  expect(mainPot?.payoutBySeat).toEqual({ '1': 300 });

  expect(sidePot?.potKind).toBe('side');
  expect(Number(sidePot?.totalOil || 0)).toBe(300);
  expect(sidePot?.eligibleSeatNumbers).toEqual([2, 3]);
  expect(sidePot?.winningSeatNumbers).toEqual([2]);
  expect(sidePot?.payoutBySeat).toEqual({ '2': 300 });

  expect(data?.hand?.result?.returnedUncalledBySeat).toEqual({ '3': 100 });
  expect(data?.hand?.result?.payoutBySeat).toEqual({ '1': 300, '2': 300 });
  const seatThree = data?.hand?.seats?.find((seat) => Number(seat.seatNumber || 0) === 3);
  expect(Number(seatThree?.stackOil || 0)).toBe(150);

  await context.close();
});
