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

test('M23.26: wallet poker policy enforces daily spend caps and self-exclusion on live-poker spend routes', async ({ page, request }) => {
  const user = {
    address: 'So1anaMockSpendA111111111111111111111111111',
    houseId: 'house_policy_a',
    streamId: 'stream-policy-a',
  };

  await seedStreamflowLocks(request, {
    locks: [
      {
        address: user.address,
        streamId: user.streamId,
        tokenSymbol: '$AGENTTOWN',
        locked: true,
        lockedAmountAtomic: '2500000',
      },
    ],
  });

  await page.goto('/');
  await bindPageSession(page, user);
  await verifyStreamflowAndFundOil(page, request, {
    address: user.address,
    streamId: user.streamId,
  });

  let resp = await browserJson(page, '/api/poker/play/policy', {
    headers: { 'x-wallet-solana-address': user.address },
  });
  expect(resp.ok).toBe(true);
  expect(resp.body?.data?.pokerPolicy?.dailySpendCapOil).toBe(0);
  expect(resp.body?.data?.pokerPolicy?.todaySpendOil).toBe(0);
  expect(resp.body?.data?.pokerPolicy?.selfExcluded).toBe(false);

  resp = await browserJson(page, '/api/poker/play/policy', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': user.address },
    data: {
      dailySpendCapOil: 500,
      asOf: '2026-03-12T09:00:00.000Z',
    },
  });
  expect(resp.ok).toBe(true);
  expect(resp.body?.data?.pokerPolicy?.dailySpendCapOil).toBe(500);
  expect(resp.body?.data?.pokerPolicy?.remainingDailySpendOil).toBe(500);

  resp = await browserJson(page, '/api/poker/play/matchmake', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': user.address },
    data: {
      tableType: 'cash',
      smallBlindOil: 10,
      bigBlindOil: 20,
      buyInOil: 400,
      displayName: 'Policy Cash',
      asOf: '2026-03-12T09:05:00.000Z',
    },
  });
  expect(resp.ok).toBe(true);
  const tableId = String(resp.body?.data?.table?.tableId || '');
  expect(tableId).toBeTruthy();
  expect(resp.body?.data?.pokerPolicy?.dailySpendCapOil).toBe(500);
  expect(resp.body?.data?.pokerPolicy?.todaySpendOil).toBe(400);
  expect(resp.body?.data?.pokerPolicy?.remainingDailySpendOil).toBe(100);

  resp = await browserJson(page, `/api/poker/play/tables/${encodeURIComponent(tableId)}/reload`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': user.address },
    data: {
      amountOil: 200,
      asOf: '2026-03-12T09:06:00.000Z',
    },
  });
  expect(resp.ok).toBe(false);
  expect(resp.body?.error?.code || resp.body?.code).toBe('POKER_PLAY_POLICY_LIMIT_EXCEEDED');
  expect(resp.body?.error?.details?.dailySpendCapOil || resp.body?.details?.dailySpendCapOil).toBe(500);
  expect(resp.body?.error?.details?.todaySpendOil || resp.body?.details?.todaySpendOil).toBe(400);

  resp = await browserJson(page, '/api/poker/play/policy', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': user.address },
    data: {
      selfExcludeHours: 24,
      asOf: '2026-03-12T09:10:00.000Z',
    },
  });
  expect(resp.ok).toBe(true);
  expect(resp.body?.data?.pokerPolicy?.selfExcluded).toBe(true);
  expect(String(resp.body?.data?.pokerPolicy?.selfExcludedUntil || '')).toContain('2026-03-13T09:10:00.000Z');

  resp = await browserJson(page, `/api/poker/play/tables/${encodeURIComponent(tableId)}/reload`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': user.address },
    data: {
      amountOil: 50,
      asOf: '2026-03-12T09:11:00.000Z',
    },
  });
  expect(resp.ok).toBe(false);
  expect(resp.body?.error?.code || resp.body?.code).toBe('POKER_PLAY_SELF_EXCLUDED');
  expect(String(resp.body?.error?.details?.selfExcludedUntil || resp.body?.details?.selfExcludedUntil || '')).toContain('2026-03-13T09:10:00.000Z');
});
