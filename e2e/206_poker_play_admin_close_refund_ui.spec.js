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

test('M23.21: hidden operator controls can export review data and close a table with refunds', async ({ browser, request }) => {
  const userA = {
    address: 'So1anaMockAdminUiA11111111111111111111111111',
    houseId: 'house_admin_ui_a',
    streamId: 'stream-admin-ui-a',
  };
  const userB = {
    address: 'So1anaMockAdminUiB11111111111111111111111111',
    houseId: 'house_admin_ui_b',
    streamId: 'stream-admin-ui-b',
  };

  await seedStreamflowLocks(request, {
    locks: [
      {
        address: userA.address,
        streamId: userA.streamId,
        tokenSymbol: '$AGENTTOWN',
        locked: true,
        lockedAmountAtomic: '2500000',
      },
      {
        address: userB.address,
        streamId: userB.streamId,
        tokenSymbol: '$AGENTTOWN',
        locked: true,
        lockedAmountAtomic: '2500000',
      },
    ],
  });

  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();
  await pageA.addInitScript(() => {
    window.localStorage.setItem('poker.adminToken', 'test-admin');
  });
  await pageA.goto('/');
  await bindPageSession(pageA, userA);
  await verifyStreamflowAndFundOil(pageA, request, {
    address: userA.address,
    streamId: userA.streamId,
  });

  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();
  await pageB.goto('/');
  await bindPageSession(pageB, userB);
  await verifyStreamflowAndFundOil(pageB, request, {
    address: userB.address,
    streamId: userB.streamId,
  });

  let resp = await browserJson(pageA, '/api/poker/play/tables/pkt_play_cash_01/sit', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': userA.address },
    data: {
      seatNumber: 1,
      displayName: 'Admin UI Alpha',
      buyInOil: 400,
    },
  });
  expect(resp.ok).toBe(true);

  resp = await browserJson(pageB, '/api/poker/play/tables/pkt_play_cash_01/sit', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': userB.address },
    data: {
      seatNumber: 2,
      displayName: 'Admin UI Bravo',
      buyInOil: 400,
    },
  });
  expect(resp.ok).toBe(true);

  await pageA.goto('/poker/play/tables/pkt_play_cash_01?embed=1');
  await expect(pageA.getByRole('heading', { name: 'Operator Review' })).toBeVisible();
  await expect(pageA.getByRole('button', { name: 'Export Review' })).toBeVisible();
  await expect(pageA.getByRole('button', { name: 'Close + Refund' })).toBeVisible();

  await pageA.getByRole('button', { name: 'Export Review' }).click();
  await expect(pageA.getByText('Exported poker-review-pkt_play_cash_01.json')).toBeVisible();

  await pageA.getByRole('button', { name: 'Close + Refund' }).click();
  await expect(pageA.locator('p').filter({ hasText: 'Operator closed the table.' }).first()).toBeVisible();
  await expect(pageA.getByText('Refunded')).toBeVisible();
  await expect(pageA.getByRole('button', { name: 'Close + Refund' })).toHaveCount(0);
  await expect(pageA.getByRole('heading', { name: 'Submit Action' })).toHaveCount(0);
  await expect(pageA.getByRole('heading', { name: 'Seat Thread' })).toHaveCount(0);

  await contextA.close();
  await contextB.close();
});
