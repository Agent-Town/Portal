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

async function getTable(page, address, tableId, { asOf } = {}) {
  const path = asOf
    ? `/api/poker/play/tables/${encodeURIComponent(tableId)}?asOf=${encodeURIComponent(asOf)}`
    : `/api/poker/play/tables/${encodeURIComponent(tableId)}`;
  const resp = await browserJson(page, path, {
    headers: { 'x-wallet-solana-address': address },
  });
  expect(resp.ok).toBe(true);
  return resp.body?.data || {};
}

test('M25.9: multi-flight tournaments bag surviving stacks into a merge series without a second OIL debit', async ({ browser, request }) => {
  const users = [
    { seatNumber: 1, address: 'So1anaHarnessFlightA11111111111111111111111', houseId: 'house_harness_flight_a', streamId: 'stream-flight-a', displayName: 'Flight Alpha' },
    { seatNumber: 2, address: 'So1anaHarnessFlightB11111111111111111111111', houseId: 'house_harness_flight_b', streamId: 'stream-flight-b', displayName: 'Flight Bravo' },
    { seatNumber: 3, address: 'So1anaHarnessFlightC11111111111111111111111', houseId: 'house_harness_flight_c', streamId: 'stream-flight-c', displayName: 'Flight Charlie' },
  ];

  const contexts = [];
  const pages = [];
  const funded = [];
  for (const user of users) {
    const context = await browser.newContext();
    const page = await context.newPage();
    contexts.push(context);
    pages.push(page);
    await page.goto('/');
    await bindPageSession(page, user);
    funded.push(await fundOilWallet(request, {
      walletSubject: user.address,
      houseId: user.houseId,
      amount: 5000,
    }));
  }

  const seeded = await seedPokerPlayHarness(request, {
    scenario: 'multiflight_story',
    asOf: '2026-03-12T22:00:00.000Z',
    actors: users,
  });
  const flightTableId = String(seeded?.tableIds?.[0] || '');
  const mergeTableId = String(seeded?.tableIds?.[1] || '');
  const multiFlightDebug = seeded?.debug?.reconciliation?.multiFlight || {};
  expect(flightTableId).toBeTruthy();
  expect(mergeTableId).toBeTruthy();
  expect(String(multiFlightDebug?.mergeSeriesId || '')).toBeTruthy();

  const flightAlphaView = await getTable(pages[0], users[0].address, flightTableId, {
    asOf: '2026-03-12T22:00:02.000Z',
  });
  expect(flightAlphaView?.table?.summary?.formatVariant).toBe('multi_flight');
  expect(flightAlphaView?.table?.summary?.multiFlightStage).toBe('flight');
  expect(flightAlphaView?.table?.summary?.completedAt).toBeTruthy();
  expect(Number(flightAlphaView?.table?.summary?.multiFlightAdvanceSeatCount || 0)).toBe(2);
  expect(Number(flightAlphaView?.table?.summary?.multiFlightAdvancedSeatCount || 0)).toBe(2);
  expect(flightAlphaView?.series?.multiFlightMergeSeriesId).toBe(String(multiFlightDebug?.mergeSeriesId || ''));
  const flightAlphaSeat = (Array.isArray(flightAlphaView?.seats) ? flightAlphaView.seats : [])
    .find((seat) => String(seat?.displayName || '') === users[0].displayName);
  expect(flightAlphaSeat?.status).toBe('advanced');
  expect(Number(flightAlphaSeat?.stackOil || 0)).toBe(0);
  expect(Number(flightAlphaSeat?.finishPosition || 0)).toBe(1);

  const flightBravoView = await getTable(pages[1], users[1].address, flightTableId, {
    asOf: '2026-03-12T22:00:02.000Z',
  });
  const flightBravoSeat = (Array.isArray(flightBravoView?.seats) ? flightBravoView.seats : [])
    .find((seat) => String(seat?.displayName || '') === users[1].displayName);
  expect(flightBravoSeat?.status).toBe('advanced');
  expect(Number(flightBravoSeat?.finishPosition || 0)).toBe(2);

  const mergeAlphaView = await getTable(pages[0], users[0].address, mergeTableId, {
    asOf: '2026-03-12T22:00:03.000Z',
  });
  expect(mergeAlphaView?.table?.summary?.formatVariant).toBe('multi_flight');
  expect(mergeAlphaView?.table?.summary?.multiFlightStage).toBe('merge');
  expect(Number(mergeAlphaView?.series?.multiFlightImportedFlightCount || 0)).toBe(1);
  expect(Number(mergeAlphaView?.series?.multiFlightImportedEntryCount || 0)).toBe(Number(multiFlightDebug?.expectedImportedEntryCount || 0));
  expect(Number(mergeAlphaView?.series?.prizePoolOil || 0)).toBe(Number(multiFlightDebug?.expectedImportedPrizePoolOil || 0));
  expect(Number(mergeAlphaView?.series?.multiFlightImportedPrizePoolOil || 0)).toBe(Number(multiFlightDebug?.expectedImportedPrizePoolOil || 0));
  expect(Number(mergeAlphaView?.series?.multiFlightImportedCarriedStackTotalOil || 0)).toBe(Number(multiFlightDebug?.expectedCarriedStackTotalOil || 0));

  const mergeBravoView = await getTable(pages[1], users[1].address, mergeTableId, {
    asOf: '2026-03-12T22:00:03.000Z',
  });

  const mergeSeats = Array.isArray(mergeAlphaView?.seats) ? mergeAlphaView.seats : [];
  const mergeAlphaSeat = mergeSeats.find((seat) => String(seat?.displayName || '') === users[0].displayName);
  const mergeBravoSeat = mergeSeats.find((seat) => String(seat?.displayName || '') === users[1].displayName);
  expect(Number(mergeAlphaSeat?.stackOil || 0)).toBe(900);
  expect(Number(mergeBravoSeat?.stackOil || 0)).toBe(600);
  const carriedStacks = mergeSeats
    .filter((seat) => seat.status === 'active' || seat.status === 'registered')
    .map((seat) => Number(seat?.stackOil || 0))
    .sort((left, right) => right - left);
  expect(carriedStacks).toEqual([900, 600]);

  const charlieMergeView = await getTable(pages[2], users[2].address, mergeTableId, {
    asOf: '2026-03-12T22:00:03.000Z',
  });
  expect(charlieMergeView?.mySeat).toBeNull();
  expect(
    mergeSeats.some((seat) => String(seat?.displayName || '') === users[2].displayName)
  ).toBe(false);

  await Promise.all(contexts.map((context) => context.close()));
});
