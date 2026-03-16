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

test('M23.22: live table UI exposes player review and hidden operator resolution controls', async ({ browser, request }) => {
  const sitAt = '2026-03-11T14:00:00.500Z';
  const disputeAt = '2026-03-11T14:00:08.000Z';
  const userA = {
    address: 'So1anaMockReviewUiA11111111111111111111111111',
    houseId: 'house_review_ui_a',
    streamId: 'stream-review-ui-a',
  };
  const userB = {
    address: 'So1anaMockReviewUiB11111111111111111111111111',
    houseId: 'house_review_ui_b',
    streamId: 'stream-review-ui-b',
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
      displayName: 'UI Review Alpha',
      buyInOil: 400,
      asOf: sitAt,
    },
  });
  expect(resp.ok).toBe(true);

  resp = await browserJson(pageB, '/api/poker/play/tables/pkt_play_cash_01/sit', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': userB.address },
    data: {
      seatNumber: 2,
      displayName: 'UI Review Bravo',
      buyInOil: 400,
      asOf: sitAt,
    },
  });
  expect(resp.ok).toBe(true);

  await pageA.goto(`/poker/play/tables/pkt_play_cash_01?embed=1&asOf=${encodeURIComponent(disputeAt)}`);
  await expect(pageA.getByRole('heading', { name: 'Operator Review' })).toHaveCount(0);
  await pageA.locator('[data-poker-section="flag-review"] details summary').click();
  await pageA.locator('#pokerPlayDisputeCategory').selectOption('disconnect');
  await pageA.locator('#pokerPlayDisputeNote').fill('Seat two disconnected while the action clock was still live.');
  await pageA.getByRole('button', { name: 'Flag Hand For Review' }).click();

  await expect(pageA.getByRole('heading', { name: 'Table Review' })).toBeVisible();
  await expect(pageA.getByText('Table paused: hand review')).toBeVisible();
  await pageA.locator('[data-poker-section="table-review"] details summary').click();
  await expect(pageA.getByText('Latest audit event:')).toBeVisible();
  await expect(pageA.getByText('dispute_opened')).toBeVisible();

  await pageA.evaluate(() => {
    window.localStorage.setItem('poker.adminToken', 'test-admin');
  });
  await pageA.goto('/poker/play/tables/pkt_play_cash_01?embed=1');
  await expect(pageA.getByRole('heading', { name: 'Operator Review' })).toBeVisible();
  await expect(pageA.getByRole('button', { name: 'Resolve + Resume' }).first()).toBeVisible();
  await pageA.getByRole('button', { name: 'Resolve + Resume' }).first().click();

  await expect(pageA.getByText('Table paused: hand review')).toHaveCount(0);
  await expect(pageA.getByRole('heading', { name: 'Operator Review' })).toBeVisible();
  await pageA.locator('[data-poker-section="table-review"] details summary').click();
  await expect(pageA.getByText('No disputes on the selected hand.')).toBeVisible();

  await contextA.close();
  await contextB.close();
});
