const { test, expect } = require('@playwright/test');
const {
  getTableCount,
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

test('M23.4: matchmaking reuses matching live tables, allows open late-registration seats, and creates new tournament tables once late registration closes', async ({ browser, request }) => {
  const users = [
    { address: 'So1anaMockMatchA11111111111111111111111111111', houseId: 'house_match_a', streamId: 'stream-match-a' },
    { address: 'So1anaMockMatchB11111111111111111111111111111', houseId: 'house_match_b', streamId: 'stream-match-b' },
    { address: 'So1anaMockMatchC11111111111111111111111111111', houseId: 'house_match_c', streamId: 'stream-match-c' },
    { address: 'So1anaMockMatchD11111111111111111111111111111', houseId: 'house_match_d', streamId: 'stream-match-d' },
    { address: 'So1anaMockMatchE11111111111111111111111111111', houseId: 'house_match_e', streamId: 'stream-match-e' },
    { address: 'So1anaMockMatchF11111111111111111111111111111', houseId: 'house_match_f', streamId: 'stream-match-f' },
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

  const baselineTableCount = await getTableCount(request, 'poker_play_tables');
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

  let resp = await browserJson(pages[0], '/api/poker/play/matchmake', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[0].address },
    data: {
      tableType: 'cash',
      smallBlindOil: 25,
      bigBlindOil: 50,
      buyInOil: 500,
      displayName: 'Alpha Cash',
    },
  });
  expect(resp.ok).toBe(true);
  const cashTableId = String(resp.body?.data?.table?.tableId || '');
  expect(cashTableId).toBeTruthy();
  expect(await getTableCount(request, 'poker_play_tables')).toBe(baselineTableCount + 1);

  resp = await browserJson(pages[1], '/api/poker/play/matchmake', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[1].address },
    data: {
      tableType: 'cash',
      smallBlindOil: 25,
      bigBlindOil: 50,
      buyInOil: 500,
      displayName: 'Bravo Cash',
    },
  });
  expect(resp.ok).toBe(true);
  expect(String(resp.body?.data?.table?.tableId || '')).toBe(cashTableId);
  expect(Number(resp.body?.data?.table?.summary?.occupancy || 0)).toBe(2);

  resp = await browserJson(pages[2], '/api/poker/play/matchmake', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[2].address },
    data: {
      tableType: 'tournament',
      smallBlindOil: 75,
      bigBlindOil: 150,
      buyInOil: 600,
      lateRegistrationHands: 1,
      displayName: 'Charlie Tour',
    },
  });
  expect(resp.ok).toBe(true);
  const tournamentTableId = String(resp.body?.data?.table?.tableId || '');
  expect(tournamentTableId).toBeTruthy();
  expect(tournamentTableId).not.toBe(cashTableId);
  expect(await getTableCount(request, 'poker_play_tables')).toBe(baselineTableCount + 2);

  resp = await browserJson(pages[3], '/api/poker/play/matchmake', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[3].address },
    data: {
      tableType: 'tournament',
      smallBlindOil: 75,
      bigBlindOil: 150,
      buyInOil: 600,
      lateRegistrationHands: 1,
      displayName: 'Delta Tour',
    },
  });
  expect(resp.ok).toBe(true);
  expect(String(resp.body?.data?.table?.tableId || '')).toBe(tournamentTableId);
  expect(resp.body?.data?.hand?.status).toBe('live');

  resp = await browserJson(pages[4], '/api/poker/play/matchmake', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[4].address },
    data: {
      tableType: 'tournament',
      smallBlindOil: 75,
      bigBlindOil: 150,
      buyInOil: 600,
      lateRegistrationHands: 1,
      displayName: 'Echo Tour',
    },
  });
  expect(resp.ok).toBe(true);
  expect(String(resp.body?.data?.table?.tableId || '')).toBe(tournamentTableId);
  expect(resp.body?.data?.mySeat?.status).toBe('registered');
  expect(Number(resp.body?.data?.table?.summary?.lateRegistrationRemainingHands || 0)).toBe(1);

  const liveDetail = await getTable(pages[2], users[2].address, tournamentTableId, {
    asOf: '2026-03-10T12:00:03.000Z',
  });
  const actingSeat = Number(liveDetail?.hand?.actingSeat || 0);
  const actorPage = actingSeat === 1 ? pages[2] : pages[3];
  const actorAddress = actingSeat === 1 ? users[2].address : users[3].address;
  resp = await browserJson(actorPage, `/api/poker/play/hands/${encodeURIComponent(liveDetail?.hand?.handId || '')}/actions`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': actorAddress },
    data: {
      actionKind: 'fold',
      amountOil: 0,
      asOf: '2026-03-10T12:00:03.000Z',
    },
  });
  expect(resp.ok).toBe(true);

  const afterLateRegClose = await getTable(pages[4], users[4].address, tournamentTableId, {
    asOf: '2026-03-10T12:00:03.000Z',
  });
  expect(Number(afterLateRegClose?.hand?.handNumber || 0)).toBe(2);
  expect(afterLateRegClose?.mySeat?.status).toBe('active');
  expect(afterLateRegClose?.table?.summary?.lateRegistrationOpen).toBe(false);

  resp = await browserJson(pages[5], '/api/poker/play/matchmake', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[5].address },
    data: {
      tableType: 'tournament',
      smallBlindOil: 75,
      bigBlindOil: 150,
      buyInOil: 600,
      lateRegistrationHands: 1,
      displayName: 'Foxtrot Late Join',
      asOf: '2026-03-10T12:00:04.000Z',
    },
  });
  expect(resp.ok).toBe(true);
  const secondTournamentTableId = String(resp.body?.data?.table?.tableId || '');
  expect(secondTournamentTableId).toBeTruthy();
  expect(secondTournamentTableId).not.toBe(tournamentTableId);
  expect(await getTableCount(request, 'poker_play_tables')).toBe(baselineTableCount + 3);

  await Promise.all(contexts.map((context) => context.close()));
});
