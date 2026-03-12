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

test('M25.3 UI: cash table transfer stays on the minimal seat card and loads the compatible destination table', async ({ browser, request }) => {
  const actor = {
    address: 'So1anaMockMatchD11111111111111111111111111111',
    houseId: 'house_cash_transfer_ui_a',
    streamId: 'stream-cash-transfer-ui-a',
  };

  await seedStreamflowLocks(request, {
    locks: [
      {
        address: actor.address,
        streamId: actor.streamId,
        tokenSymbol: '$AGENTTOWN',
        locked: true,
        lockedAmountAtomic: '2500000',
      },
    ],
  });

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/');
  await bindPageSession(page, actor);
  await verifyStreamflowAndFundOil(page, request, {
    address: actor.address,
    streamId: actor.streamId,
  });

  const createPayload = {
    tableType: 'cash',
    smallBlindOil: 20,
    bigBlindOil: 40,
    buyInOil: 400,
    minPlayers: 2,
    maxSeats: 6,
  };

  let resp = await browserJson(page, '/api/poker/play/tables', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': actor.address },
    data: {
      ...createPayload,
      title: 'UI Transfer Target',
      joinNow: false,
      asOf: '2026-03-10T12:20:00.000Z',
    },
  });
  expect(resp.ok).toBe(true);
  const targetTableId = String(resp.body?.data?.table?.tableId || '');
  expect(targetTableId).toBeTruthy();

  resp = await browserJson(page, '/api/poker/play/tables', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': actor.address },
    data: {
      ...createPayload,
      title: 'UI Transfer Source',
      seatNumber: 1,
      displayName: 'Transfer UI Alpha',
      asOf: '2026-03-10T12:21:00.000Z',
    },
  });
  expect(resp.ok).toBe(true);
  const sourceTableId = String(resp.body?.data?.table?.tableId || '');
  expect(sourceTableId).toBeTruthy();

  await page.goto(`/poker/play/tables/${encodeURIComponent(sourceTableId)}?embed=1`);
  await expect(page.getByRole('heading', { name: 'Your Seat' })).toBeVisible();
  await expect(page.getByText('Seat Movement')).toBeVisible();
  await expect(page.locator('#pokerPlayTransferTableId')).toContainText('UI Transfer Target');

  await page.locator('#pokerPlayTransferTableId').selectOption(targetTableId);
  await page.locator('#pokerPlayTransferSeatNumber').selectOption('4');
  await page.getByRole('button', { name: 'Transfer Table' }).click();

  await expect(page.locator('#pokerStatus')).toHaveText('Table transferred.');
  await expect(page.getByText('UI Transfer Target')).toBeVisible();
  await expect(page.locator('#pokerPlayTransferTableId')).not.toContainText('UI Transfer Target');

  await context.close();
});
