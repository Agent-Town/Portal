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

test('M22.4: odd chips resolve clockwise from the button across tied winners', async ({ browser, request }) => {
  const userC = {
    address: 'Sq1anaPhase22QddChipC11111111111111111111111',
    houseId: 'house_phase22_oddchip_c',
  };
  const seeded = await seedPokerPlayHarness(request, {
    scenario: 'oddchip_live',
    asOf: '2026-03-11T10:15:00.000Z',
    actors: [
      {
        seatNumber: 1,
        address: 'Sq1anaPhase22QddChipA11111111111111111111111',
        houseId: 'house_phase22_oddchip_a',
        displayName: 'Odd Alpha',
      },
      {
        seatNumber: 2,
        address: 'Sq1anaPhase22QddChipB11111111111111111111111',
        houseId: 'house_phase22_oddchip_b',
        displayName: 'Odd Bravo',
      },
      {
        seatNumber: 3,
        address: userC.address,
        houseId: userC.houseId,
        displayName: 'Odd Charlie',
      },
    ],
  });

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/');
  await bindPageSession(page, userC);

  const detailResp = await browserJson(page, `/api/poker/play/tables/${encodeURIComponent(seeded.tableId)}?asOf=${encodeURIComponent('2026-03-11T10:15:00.000Z')}`, {
    headers: { 'x-wallet-solana-address': userC.address },
  });
  expect(detailResp.ok).toBe(true);
  expect(detailResp.body?.data?.hand?.status).toBe('live');

  const actionResp = await browserJson(page, `/api/poker/play/hands/${encodeURIComponent(detailResp.body?.data?.hand?.handId || seeded.handId)}/actions`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': userC.address },
    data: {
      actionKind: 'check',
      asOf: '2026-03-11T10:15:01.000Z',
    },
  });
  expect(actionResp.ok, JSON.stringify(actionResp.body || {})).toBe(true);
  const data = actionResp.body?.data || {};
  expect(data?.hand?.status).toBe('settled');
  expect(data?.hand?.result?.returnedUncalledBySeat).toEqual({});
  expect(data.hand.result.potSlices).toHaveLength(1);

  const [mainPot] = data.hand.result.potSlices;
  expect(Number(mainPot?.totalOil || 0)).toBe(75);
  expect(mainPot?.winningSeatNumbers).toEqual([1, 2]);
  expect(mainPot?.oddChipSeatNumbers).toEqual([2]);
  expect(mainPot?.payoutBySeat).toEqual({ '1': 37, '2': 38 });
  expect(data?.hand?.result?.payoutBySeat).toEqual({ '1': 37, '2': 38 });

  await context.close();
});
