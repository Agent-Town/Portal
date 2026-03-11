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

test('M23.26: tournament table UI shows the live payout ladder for a three-entry field', async ({ browser, request }) => {
  const users = [
    { address: 'So1anaMockPayoutUiA111111111111111111111111', houseId: 'house_payout_ui_a', streamId: 'stream-payout-ui-a' },
    { address: 'So1anaMockPayoutUiB111111111111111111111111', houseId: 'house_payout_ui_b', streamId: 'stream-payout-ui-b' },
    { address: 'So1anaMockPayoutUiC111111111111111111111111', houseId: 'house_payout_ui_c', streamId: 'stream-payout-ui-c' },
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

  let resp = await browserJson(pages[0], '/api/poker/play/matchmake', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[0].address },
    data: {
      tableType: 'tournament',
      smallBlindOil: 50,
      bigBlindOil: 100,
      buyInOil: 1000,
      lateRegistrationHands: 1,
      displayName: 'UI Alpha',
    },
  });
  expect(resp.ok).toBe(true);
  const tableId = String(resp.body?.data?.table?.tableId || '');
  expect(tableId).toBeTruthy();

  for (let index = 1; index < users.length; index += 1) {
    resp = await browserJson(pages[index], '/api/poker/play/matchmake', {
      method: 'POST',
      headers: { 'x-wallet-solana-address': users[index].address },
      data: {
        tableType: 'tournament',
        smallBlindOil: 50,
        bigBlindOil: 100,
        buyInOil: 1000,
        lateRegistrationHands: 1,
        displayName: `UI Seat ${index + 1}`,
      },
    });
    expect(resp.ok).toBe(true);
    expect(String(resp.body?.data?.table?.tableId || '')).toBe(tableId);
  }

  await pages[0].goto(`/poker/play/tables/${encodeURIComponent(tableId)}?embed=1`);
  await expect(pages[0].getByText('Prize Pool')).toHaveCount(2);
  await expect(pages[0].getByText('3000 OIL')).toHaveCount(2);
  await expect(pages[0].getByText('Paid Places')).toHaveCount(2);
  await expect(pages[0].getByText('Payout Ladder')).toHaveCount(1);
  await expect(pages[0].getByText('1 place')).toBeVisible();
  await expect(pages[0].getByText('70%')).toBeVisible();
  await expect(pages[0].getByText('2100 OIL')).toBeVisible();
  await expect(pages[0].getByText('2 place')).toBeVisible();
  await expect(pages[0].getByText('30%')).toBeVisible();
  await expect(pages[0].getByText('900 OIL')).toHaveCount(2);

  await Promise.all(contexts.map((context) => context.close()));
});
