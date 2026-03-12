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

test('M25.4 UI: scheduled tournament waitlist shows queue state and refreshes into a live seat after promotion', async ({ browser, request }) => {
  const users = [
    { address: 'So1anaMockTQitUA111111111111111111111111111', houseId: 'house_twait_ui_a', streamId: 'stream-twait-ui-a', displayName: 'Wait UI Alpha' },
    { address: 'So1anaMockTQitUB111111111111111111111111111', houseId: 'house_twait_ui_b', streamId: 'stream-twait-ui-b', displayName: 'Wait UI Bravo' },
    { address: 'So1anaMockTQitUC111111111111111111111111111', houseId: 'house_twait_ui_c', streamId: 'stream-twait-ui-c', displayName: 'Wait UI Charlie' },
  ];

  const contexts = [];
  const pages = [];
  for (const user of users) {
    const context = await browser.newContext();
    await context.addInitScript(() => {
      window.WebSocket = undefined;
    });
    const page = await context.newPage();
    contexts.push(context);
    pages.push(page);
    await page.goto('/');
    await bindPageSession(page, user);
    await fundOilWallet(request, {
      walletSubject: user.address,
      houseId: user.houseId,
      amount: 2000,
    });
  }

  let resp = await browserJson(pages[0], '/api/poker/play/tables', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[0].address },
    data: {
      tableType: 'tournament',
      title: 'Scheduled Waitlist Tournament UI',
      smallBlindOil: 25,
      bigBlindOil: 50,
      buyInOil: 300,
      maxSeats: 2,
      minPlayers: 2,
      lateRegistrationHands: 2,
      scheduledStartAt: '2026-03-13T13:30:00.000Z',
      seatNumber: 1,
      displayName: users[0].displayName,
      asOf: '2026-03-12T13:00:00.000Z',
    },
  });
  expect(resp.ok, JSON.stringify(resp.body)).toBe(true);
  const tableId = String(resp.body?.data?.table?.tableId || '');

  resp = await browserJson(pages[1], `/api/poker/play/tables/${encodeURIComponent(tableId)}/sit`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[1].address },
    data: {
      seatNumber: 2,
      displayName: users[1].displayName,
      buyInOil: 300,
      asOf: '2026-03-12T13:00:01.000Z',
    },
  });
  expect(resp.ok, JSON.stringify(resp.body)).toBe(true);

  const page = pages[2];
  await page.goto(`/poker/play/tables/${encodeURIComponent(tableId)}?embed=1&asOf=2026-03-12T13%3A00%3A02.000Z`);
  await expect(page.getByRole('heading', { name: 'Waitlist', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Join Waitlist' }).click();
  await expect(page.getByText('Position')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Leave Waitlist' })).toBeVisible();

  await bindPageSession(pages[1], users[1]);
  resp = await browserJson(pages[1], `/api/poker/play/tables/${encodeURIComponent(tableId)}/leave`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[1].address },
    data: {
      asOf: '2026-03-12T13:00:03.000Z',
    },
  });
  expect(resp.ok, JSON.stringify(resp.body)).toBe(true);

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Your Seat' })).toBeVisible();
  await expect(page.getByText('Seat 2').first()).toBeVisible();
  await expect(page.getByText('scheduled').first()).toBeVisible();
  await expect(page.getByText('promoted from the tournament waitlist')).toBeVisible();

  await Promise.all(contexts.map((context) => context.close()));
});
