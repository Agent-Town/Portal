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

async function createTournamentTable(page, address, body) {
  const resp = await browserJson(page, '/api/poker/play/tables', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': address },
    data: body,
  });
  expect(resp.ok).toBe(true);
  return resp.body?.data || {};
}

async function sitIntoTable(page, address, tableId, { seatNumber, displayName, asOf }) {
  const resp = await browserJson(page, `/api/poker/play/tables/${encodeURIComponent(tableId)}/sit`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': address },
    data: {
      seatNumber,
      displayName,
      buyInOil: 600,
      asOf,
    },
  });
  expect(resp.ok).toBe(true);
  return resp.body?.data || {};
}

async function settleCurrentTableHand(tableId, seatActors, { asOfPrefix }) {
  let ticks = 0;
  let detail = await getTable(seatActors[1].page, seatActors[1].address, tableId, {
    asOf: `${asOfPrefix}:00.000Z`,
  });
  const startingHandNumber = Number(detail?.hand?.handNumber || 0);
  expect(startingHandNumber).toBeGreaterThan(0);
  while (ticks < 12) {
    const actingSeat = Number(detail?.hand?.actingSeat || 0);
    const actor = seatActors[actingSeat];
    expect(actor).toBeTruthy();
    const handId = String(detail?.hand?.handId || '');
    expect(handId).toBeTruthy();
    const atSecond = String(ticks + 1).padStart(2, '0');
    const resp = await browserJson(actor.page, `/api/poker/play/hands/${encodeURIComponent(handId)}/actions`, {
      method: 'POST',
      headers: { 'x-wallet-solana-address': actor.address },
      data: {
        actionKind: 'fold',
        amountOil: 0,
        asOf: `${asOfPrefix}:${atSecond}.000Z`,
      },
    });
    expect(resp.ok).toBe(true);
    detail = await getTable(seatActors[1].page, seatActors[1].address, tableId, {
      asOf: `${asOfPrefix}:${atSecond}.000Z`,
    });
    if (Number(detail?.hand?.handNumber || 0) > startingHandNumber) {
      return detail;
    }
    ticks += 1;
  }
  throw new Error('HAND_DID_NOT_ADVANCE');
}

test('M23.23: tournament director converges a manual 3-table series to the correct 5/5/5 shape', async ({ browser, request }) => {
  const users = [
    { address: 'So1anaMockMatchA11111111111111111111111111111', houseId: 'house_director_1', streamId: 'stream-director-1' },
    { address: 'So1anaMockMatchB11111111111111111111111111111', houseId: 'house_director_2', streamId: 'stream-director-2' },
    { address: 'So1anaMockMatchC11111111111111111111111111111', houseId: 'house_director_3', streamId: 'stream-director-3' },
    { address: 'So1anaMockMatchD11111111111111111111111111111', houseId: 'house_director_4', streamId: 'stream-director-4' },
    { address: 'So1anaMockMatchE11111111111111111111111111111', houseId: 'house_director_5', streamId: 'stream-director-5' },
    { address: 'So1anaMockMatchF11111111111111111111111111111', houseId: 'house_director_6', streamId: 'stream-director-6' },
    { address: 'So1anaMockCashA111111111111111111111111111111', houseId: 'house_director_7', streamId: 'stream-director-7' },
    { address: 'So1anaMockCashB111111111111111111111111111111', houseId: 'house_director_8', streamId: 'stream-director-8' },
    { address: 'So1anaMockCashC111111111111111111111111111111', houseId: 'house_director_9', streamId: 'stream-director-9' },
    { address: 'So1anaMockCashD111111111111111111111111111111', houseId: 'house_director_10', streamId: 'stream-director-10' },
    { address: 'So1anaMockTourA111111111111111111111111111111', houseId: 'house_director_11', streamId: 'stream-director-11' },
    { address: 'So1anaMockTourB111111111111111111111111111111', houseId: 'house_director_12', streamId: 'stream-director-12' },
    { address: 'So1anaMockPauseA11111111111111111111111111111', houseId: 'house_director_13', streamId: 'stream-director-13' },
    { address: 'So1anaMockPauseB11111111111111111111111111111', houseId: 'house_director_14', streamId: 'stream-director-14' },
    { address: 'So1anaMockSeatA111111111111111111111111111111', houseId: 'house_director_15', streamId: 'stream-director-15' },
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
  for (const user of users) {
    const context = await browser.newContext();
    const page = await context.newPage();
    contexts.push(context);
    pages.push(page);
    await page.goto('/');
    await bindPageSession(page, user);
    await verifyStreamflowAndFundOil(page, request, {
      address: user.address,
      streamId: user.streamId,
    });
  }

  const tableA = await createTournamentTable(pages[0], users[0].address, {
    tableType: 'tournament',
    smallBlindOil: 75,
    bigBlindOil: 150,
    buyInOil: 600,
    lateRegistrationHands: 1,
    displayName: 'Series A1',
    title: 'Director Series A',
    asOf: '2026-03-11T17:00:00.000Z',
  });
  const tableIdA = String(tableA?.table?.tableId || '');
  const seriesId = String(tableA?.series?.seriesId || tableA?.table?.rules?.seriesId || '');
  const seriesTitle = String(tableA?.series?.seriesTitle || tableA?.table?.rules?.seriesTitle || 'Director Series');
  expect(tableIdA).toBeTruthy();
  expect(seriesId).toBeTruthy();

  for (let index = 1; index < 6; index += 1) {
    await sitIntoTable(pages[index], users[index].address, tableIdA, {
      seatNumber: index + 1,
      displayName: `Series A${index + 1}`,
      asOf: `2026-03-11T17:00:0${index}.000Z`,
    });
  }

  await settleCurrentTableHand(tableIdA, {
    1: { page: pages[0], address: users[0].address },
    2: { page: pages[1], address: users[1].address },
    3: { page: pages[2], address: users[2].address },
    4: { page: pages[3], address: users[3].address },
    5: { page: pages[4], address: users[4].address },
    6: { page: pages[5], address: users[5].address },
  }, { asOfPrefix: '2026-03-11T17:00:10' });

  const tableB = await createTournamentTable(pages[6], users[6].address, {
    tableType: 'tournament',
    smallBlindOil: 75,
    bigBlindOil: 150,
    buyInOil: 600,
    lateRegistrationHands: 1,
    displayName: 'Series B1',
    title: 'Director Series B',
    seriesId,
    seriesTitle,
    asOf: '2026-03-11T17:00:30.000Z',
  });
  const tableIdB = String(tableB?.table?.tableId || '');
  expect(tableIdB).toBeTruthy();
  expect(tableIdB).not.toBe(tableIdA);

  for (let index = 7; index < 12; index += 1) {
    await sitIntoTable(pages[index], users[index].address, tableIdB, {
      seatNumber: index - 5,
      displayName: `Series B${index - 5}`,
      asOf: `2026-03-11T17:00:${String(30 + index).padStart(2, '0')}.000Z`,
    });
  }

  await settleCurrentTableHand(tableIdB, {
    1: { page: pages[6], address: users[6].address },
    2: { page: pages[7], address: users[7].address },
    3: { page: pages[8], address: users[8].address },
    4: { page: pages[9], address: users[9].address },
    5: { page: pages[10], address: users[10].address },
    6: { page: pages[11], address: users[11].address },
  }, { asOfPrefix: '2026-03-11T17:00:50' });

  const tableC = await createTournamentTable(pages[12], users[12].address, {
    tableType: 'tournament',
    smallBlindOil: 75,
    bigBlindOil: 150,
    buyInOil: 600,
    lateRegistrationHands: 1,
    displayName: 'Series C1',
    title: 'Director Series C',
    seriesId,
    seriesTitle,
    asOf: '2026-03-11T17:01:10.000Z',
  });
  const tableIdC = String(tableC?.table?.tableId || '');
  expect(tableIdC).toBeTruthy();
  expect(tableIdC).not.toBe(tableIdA);
  expect(tableIdC).not.toBe(tableIdB);

  await sitIntoTable(pages[13], users[13].address, tableIdC, {
    seatNumber: 2,
    displayName: 'Series C2',
    asOf: '2026-03-11T17:01:11.000Z',
  });
  await sitIntoTable(pages[14], users[14].address, tableIdC, {
    seatNumber: 3,
    displayName: 'Series C3',
    asOf: '2026-03-11T17:01:12.000Z',
  });

  const preBalance = await getTable(pages[0], users[0].address, tableIdA, {
    asOf: '2026-03-11T17:01:15.000Z',
  });
  expect(Number(preBalance?.series?.tableCount || 0)).toBe(3);
  expect(Number(preBalance?.series?.targetTableCount || 0)).toBe(3);
  expect(preBalance?.series?.needsRebalance).toBe(true);

  const afterTableADonation = await settleCurrentTableHand(tableIdA, {
    1: { page: pages[0], address: users[0].address },
    2: { page: pages[1], address: users[1].address },
    3: { page: pages[2], address: users[2].address },
    4: { page: pages[3], address: users[3].address },
    5: { page: pages[4], address: users[4].address },
    6: { page: pages[5], address: users[5].address },
  }, { asOfPrefix: '2026-03-11T17:01:20' });
  expect(Number(afterTableADonation?.table?.summary?.occupancy || 0)).toBe(5);
  expect(afterTableADonation?.series?.needsRebalance).toBe(true);

  const afterTableBDonation = await settleCurrentTableHand(tableIdB, {
    1: { page: pages[6], address: users[6].address },
    2: { page: pages[7], address: users[7].address },
    3: { page: pages[8], address: users[8].address },
    4: { page: pages[9], address: users[9].address },
    5: { page: pages[10], address: users[10].address },
    6: { page: pages[11], address: users[11].address },
  }, { asOfPrefix: '2026-03-11T17:01:40' });
  expect(Number(afterTableBDonation?.table?.summary?.occupancy || 0)).toBe(5);
  expect(afterTableBDonation?.series?.needsRebalance).toBe(false);

  const finalA = await getTable(pages[0], users[0].address, tableIdA, {
    asOf: '2026-03-11T17:02:00.000Z',
  });
  const finalB = await getTable(pages[6], users[6].address, tableIdB, {
    asOf: '2026-03-11T17:02:00.000Z',
  });
  const finalC = await getTable(pages[12], users[12].address, tableIdC, {
    asOf: '2026-03-11T17:02:00.000Z',
  });
  const occupancies = [
    Number(finalA?.table?.summary?.occupancy || 0),
    Number(finalB?.table?.summary?.occupancy || 0),
    Number(finalC?.table?.summary?.occupancy || 0),
  ].sort((left, right) => left - right);
  expect(occupancies).toEqual([5, 5, 5]);
  expect(finalA?.series?.needsRebalance).toBe(false);
  expect(finalB?.series?.needsRebalance).toBe(false);
  expect(finalC?.series?.needsRebalance).toBe(false);

  await Promise.all(contexts.map((context) => context.close()));
});
