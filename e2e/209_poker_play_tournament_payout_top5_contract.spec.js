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

function buildUsers(count) {
  const tags = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U'];
  return Array.from({ length: count }, (_value, index) => {
    const ordinal = String(index + 1).padStart(2, '0');
    const tag = tags[index];
    return {
      address: `So1anaMockTop5${tag}11111111111111111111111111111`,
      houseId: `house_top5_${ordinal}`,
      streamId: `stream-top5-${ordinal}`,
      displayName: `Top5 Seat ${ordinal}`,
    };
  });
}

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

test('M23.24: 18-entry tournament series expands the payout ladder to five paid places', async ({ browser, request }) => {
  const users = buildUsers(18);

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

  const joinedTableIds = [];
  for (let index = 0; index < users.length; index += 1) {
    const resp = await browserJson(pages[index], '/api/poker/play/matchmake', {
      method: 'POST',
      headers: { 'x-wallet-solana-address': users[index].address },
      data: {
        tableType: 'tournament',
        smallBlindOil: 10,
        bigBlindOil: 20,
        buyInOil: 300,
        lateRegistrationHands: 2,
        handsPerBlindLevel: 2,
        displayName: users[index].displayName,
        asOf: '2026-03-10T12:00:00.000Z',
      },
    });
    expect(resp.ok).toBe(true);
    joinedTableIds.push(String(resp.body?.data?.table?.tableId || ''));
  }

  const uniqueTableIds = [...new Set(joinedTableIds.filter(Boolean))];
  expect(uniqueTableIds).toHaveLength(3);

  const firstView = await getTable(pages[0], users[0].address, uniqueTableIds[0], {
    asOf: '2026-03-10T12:05:00.000Z',
  });

  expect(firstView?.series?.tableCount).toBe(3);
  expect(firstView?.series?.entrantCount).toBe(18);
  expect(firstView?.series?.payoutModel).toBe('top5_35_25_18_12_10');
  expect(Number(firstView?.series?.prizePoolOil || 0)).toBe(5400);
  expect(Number(firstView?.series?.paidPlaces || 0)).toBe(5);
  expect(firstView?.series?.payouts).toEqual([
    { place: 1, percent: 35, amountOil: 1890 },
    { place: 2, percent: 25, amountOil: 1350 },
    { place: 3, percent: 18, amountOil: 972 },
    { place: 4, percent: 12, amountOil: 648 },
    { place: 5, percent: 10, amountOil: 540 },
  ]);

  await Promise.all(contexts.map((context) => context.close()));
});
