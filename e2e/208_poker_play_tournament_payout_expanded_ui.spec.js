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
  const tags = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'M', 'N'];
  return Array.from({ length: count }, (_value, index) => {
    const ordinal = String(index + 1).padStart(2, '0');
    const tag = tags[index];
    return {
      address: `So1anaMockTop4Ui${tag}111111111111111111111111111`,
      houseId: `house_top4_ui_${ordinal}`,
      streamId: `stream-top4-ui-${ordinal}`,
      displayName: `Top4 UI Seat ${ordinal}`,
    };
  });
}

test('M23.23: tournament table UI shows the expanded four-place payout ladder for a 12-entry field', async ({ browser, request }) => {
  const users = buildUsers(12);

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

  const tableId = String(joinedTableIds[0] || '');
  expect(tableId).toBeTruthy();

  await pages[0].goto(`/poker/play/tables/${encodeURIComponent(tableId)}?embed=1`);
  await expect(pages[0].getByText('1 place')).toBeVisible();
  await expect(pages[0].getByText('40%')).toBeVisible();
  await expect(pages[0].getByText('1440 OIL')).toBeVisible();
  await expect(pages[0].getByText('4 place')).toBeVisible();
  await expect(pages[0].getByText('15%')).toBeVisible();
  await expect(pages[0].getByText('540 OIL')).toBeVisible();

  await Promise.all(contexts.map((context) => context.close()));
});
