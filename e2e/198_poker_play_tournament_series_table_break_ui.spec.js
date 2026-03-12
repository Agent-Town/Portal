const { test, expect } = require('@playwright/test');
const {
  resetPortalWebState,
  fundOilWallet,
} = require('./helpers/portal_web');
const {
  bindPageSession,
  browserJson,
} = require('./helpers/poker_play');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

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

async function settleCurrentTableHand(page, address, tableId, seatActors, { asOfPrefix }) {
  let ticks = 0;
  let detailResp = await browserJson(page, `/api/poker/play/tables/${encodeURIComponent(tableId)}?asOf=${encodeURIComponent(`${asOfPrefix}:00.000Z`)}`, {
    headers: { 'x-wallet-solana-address': address },
  });
  expect(detailResp.ok).toBe(true);
  let detail = detailResp.body?.data || {};
  const startingHandNumber = Number(detail?.hand?.handNumber || 0);
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
    detailResp = await browserJson(page, `/api/poker/play/tables/${encodeURIComponent(tableId)}?asOf=${encodeURIComponent(`${asOfPrefix}:${atSecond}.000Z`)}`, {
      headers: { 'x-wallet-solana-address': address },
    });
    expect(detailResp.ok).toBe(true);
    detail = detailResp.body?.data || {};
    if (Number(detail?.hand?.handNumber || 0) > startingHandNumber) {
      return;
    }
    ticks += 1;
  }
  throw new Error('HAND_DID_NOT_ADVANCE');
}

test('M23.24: live poker lobby shows explicit multi-table rebalance policy before the correction hands run', async ({ browser, request }) => {
  const users = [
    { address: 'So1anaMockMatchA11111111111111111111111111111', houseId: 'house_director_ui_1', streamId: 'stream-director-ui-1' },
    { address: 'So1anaMockMatchB11111111111111111111111111111', houseId: 'house_director_ui_2', streamId: 'stream-director-ui-2' },
    { address: 'So1anaMockMatchC11111111111111111111111111111', houseId: 'house_director_ui_3', streamId: 'stream-director-ui-3' },
    { address: 'So1anaMockMatchD11111111111111111111111111111', houseId: 'house_director_ui_4', streamId: 'stream-director-ui-4' },
    { address: 'So1anaMockMatchE11111111111111111111111111111', houseId: 'house_director_ui_5', streamId: 'stream-director-ui-5' },
    { address: 'So1anaMockMatchF11111111111111111111111111111', houseId: 'house_director_ui_6', streamId: 'stream-director-ui-6' },
    { address: 'So1anaMockCashA111111111111111111111111111111', houseId: 'house_director_ui_7', streamId: 'stream-director-ui-7' },
    { address: 'So1anaMockCashB111111111111111111111111111111', houseId: 'house_director_ui_8', streamId: 'stream-director-ui-8' },
    { address: 'So1anaMockCashC111111111111111111111111111111', houseId: 'house_director_ui_9', streamId: 'stream-director-ui-9' },
    { address: 'So1anaMockCashD111111111111111111111111111111', houseId: 'house_director_ui_10', streamId: 'stream-director-ui-10' },
    { address: 'So1anaMockTourA111111111111111111111111111111', houseId: 'house_director_ui_11', streamId: 'stream-director-ui-11' },
    { address: 'So1anaMockTourB111111111111111111111111111111', houseId: 'house_director_ui_12', streamId: 'stream-director-ui-12' },
    { address: 'So1anaMockPauseA11111111111111111111111111111', houseId: 'house_director_ui_13', streamId: 'stream-director-ui-13' },
    { address: 'So1anaMockPauseB11111111111111111111111111111', houseId: 'house_director_ui_14', streamId: 'stream-director-ui-14' },
    { address: 'So1anaMockSeatA111111111111111111111111111111', houseId: 'house_director_ui_15', streamId: 'stream-director-ui-15' },
  ];

  const contexts = [];
  const pages = [];
  for (const user of users) {
    const context = await browser.newContext();
    const page = await context.newPage();
    contexts.push(context);
    pages.push(page);
    await page.goto('/');
    await bindPageSession(page, user);
    await fundOilWallet(request, {
      walletSubject: user.address,
      houseId: user.houseId,
      amount: 5000,
    });
  }

  const tableA = await createTournamentTable(pages[0], users[0].address, {
    tableType: 'tournament',
    smallBlindOil: 75,
    bigBlindOil: 150,
    buyInOil: 600,
    lateRegistrationHands: 1,
    displayName: 'Series UI A1',
    title: 'Director UI A',
    asOf: '2026-03-11T18:00:00.000Z',
  });
  const tableIdA = String(tableA?.table?.tableId || '');
  const seriesId = String(tableA?.series?.seriesId || tableA?.table?.rules?.seriesId || '');
  const seriesTitle = String(tableA?.series?.seriesTitle || tableA?.table?.rules?.seriesTitle || 'Director UI');

  for (let index = 1; index < 6; index += 1) {
    await bindPageSession(pages[index], users[index]);
    await sitIntoTable(pages[index], users[index].address, tableIdA, {
      seatNumber: index + 1,
      displayName: `Series UI A${index + 1}`,
      asOf: `2026-03-11T18:00:0${index}.000Z`,
    });
  }
  for (let index = 0; index < 6; index += 1) {
    await bindPageSession(pages[index], users[index]);
  }
  await settleCurrentTableHand(pages[0], users[0].address, tableIdA, {
    1: { page: pages[0], address: users[0].address },
    2: { page: pages[1], address: users[1].address },
    3: { page: pages[2], address: users[2].address },
    4: { page: pages[3], address: users[3].address },
    5: { page: pages[4], address: users[4].address },
    6: { page: pages[5], address: users[5].address },
  }, { asOfPrefix: '2026-03-11T18:00:10' });

  const tableB = await createTournamentTable(pages[6], users[6].address, {
    tableType: 'tournament',
    smallBlindOil: 75,
    bigBlindOil: 150,
    buyInOil: 600,
    lateRegistrationHands: 1,
    displayName: 'Series UI B1',
    title: 'Director UI B',
    seriesId,
    seriesTitle,
    asOf: '2026-03-11T18:00:30.000Z',
  });
  const tableIdB = String(tableB?.table?.tableId || '');
  for (let index = 7; index < 12; index += 1) {
    await bindPageSession(pages[index], users[index]);
    await sitIntoTable(pages[index], users[index].address, tableIdB, {
      seatNumber: index - 5,
      displayName: `Series UI B${index - 5}`,
      asOf: `2026-03-11T18:00:${String(30 + index).padStart(2, '0')}.000Z`,
    });
  }
  for (let index = 6; index < 12; index += 1) {
    await bindPageSession(pages[index], users[index]);
  }
  await settleCurrentTableHand(pages[6], users[6].address, tableIdB, {
    1: { page: pages[6], address: users[6].address },
    2: { page: pages[7], address: users[7].address },
    3: { page: pages[8], address: users[8].address },
    4: { page: pages[9], address: users[9].address },
    5: { page: pages[10], address: users[10].address },
    6: { page: pages[11], address: users[11].address },
  }, { asOfPrefix: '2026-03-11T18:00:50' });

  const tableC = await createTournamentTable(pages[12], users[12].address, {
    tableType: 'tournament',
    smallBlindOil: 75,
    bigBlindOil: 150,
    buyInOil: 600,
    lateRegistrationHands: 1,
    displayName: 'Series UI C1',
    title: 'Director UI C',
    seriesId,
    seriesTitle,
    asOf: '2026-03-11T18:01:10.000Z',
  });
  const tableIdC = String(tableC?.table?.tableId || '');
  await bindPageSession(pages[13], users[13]);
  await sitIntoTable(pages[13], users[13].address, tableIdC, {
    seatNumber: 2,
    displayName: 'Series UI C2',
    asOf: '2026-03-11T18:01:11.000Z',
  });
  await bindPageSession(pages[14], users[14]);
  await sitIntoTable(pages[14], users[14].address, tableIdC, {
    seatNumber: 3,
    displayName: 'Series UI C3',
    asOf: '2026-03-11T18:01:12.000Z',
  });

  await pages[0].goto('/poker/play?embed=1');
  await expect(pages[0].getByText('table break pending')).toBeVisible();
  await expect(pages[0].getByText('Director target: rebalance toward 3 tables across the remaining live tables.')).toBeVisible();
  await expect(pages[0].getByText('target 3')).toBeVisible();

  await Promise.all(contexts.map((context) => context.close()));
});
