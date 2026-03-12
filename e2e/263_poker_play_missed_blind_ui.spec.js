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

test('M25.4 UI: a returning cash seat shows the blind-return policy and posted blind recovery', async ({ browser, request }) => {
  const users = [
    { address: 'So1anaMockSeatUA1111111111111111111111111111', houseId: 'house_blind_ui_a', streamId: 'stream-blind-ui-a', displayName: 'Blind UI Alpha' },
    { address: 'So1anaMockSeatUB1111111111111111111111111111', houseId: 'house_blind_ui_b', streamId: 'stream-blind-ui-b', displayName: 'Blind UI Bravo' },
    { address: 'So1anaMockSeatUC1111111111111111111111111111', houseId: 'house_blind_ui_c', streamId: 'stream-blind-ui-c', displayName: 'Blind UI Charlie' },
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

  let resp = await browserJson(pages[0], '/api/poker/play/tables', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[0].address },
    data: {
      tableType: 'cash',
      title: 'Blind Policy UI Cash',
      smallBlindOil: 10,
      bigBlindOil: 20,
      buyInOil: 200,
      minPlayers: 4,
      maxSeats: 6,
      blindReturnPolicy: 'post_big_blind',
      seatNumber: 1,
      displayName: users[0].displayName,
      asOf: '2026-03-12T10:10:00.000Z',
    },
  });
  expect(resp.ok).toBe(true);
  const tableId = String(resp.body?.data?.table?.tableId || '');

  for (let index = 1; index < users.length; index += 1) {
    resp = await browserJson(pages[index], `/api/poker/play/tables/${encodeURIComponent(tableId)}/sit`, {
      method: 'POST',
      headers: { 'x-wallet-solana-address': users[index].address },
      data: {
        seatNumber: index + 1,
        displayName: users[index].displayName,
        buyInOil: 200,
        asOf: `2026-03-12T10:10:0${index}.000Z`,
      },
    });
    expect(resp.ok).toBe(true);
  }

  resp = await browserJson(pages[0], `/api/poker/play/tables/${encodeURIComponent(tableId)}/sit-out`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[0].address },
    data: {
      markAway: true,
      asOf: '2026-03-12T10:10:04.000Z',
    },
  });
  expect(resp.ok).toBe(true);

  const page = pages[0];
  await page.goto(`/poker/play/tables/${encodeURIComponent(tableId)}?embed=1`);
  await expect(page.getByRole('heading', { name: 'Your Seat' })).toBeVisible();
  await expect(page.getByText('Return policy: post big blind (20 OIL).')).toBeVisible();
  await page.getByRole('button', { name: 'Return To Table' }).click();
  await expect(page.getByText('Blind obligation posted: 20 OIL big blind.')).toBeVisible();
  await expect(page.getByText('180 OIL').first()).toBeVisible();
  await expect(page.getByText('active').first()).toBeVisible();

  await Promise.all(contexts.map((context) => context.close()));
});
