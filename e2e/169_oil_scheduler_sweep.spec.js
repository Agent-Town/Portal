const { test, expect } = require('@playwright/test');
const {
  attachHouse,
  bindMockSolanaWallet,
  getTableCount,
  resetPortalWebState,
  runOilScheduler,
  seedStreamflowLocks,
  verifyStreamflowLock,
} = require('./helpers/portal_web');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M22.3: background oil sweep credits due snapshots without a wallet-driven read path', async ({ request }) => {
  const address = 'So1anaMockCentaurSweep1111111111111111111111111';

  await bindMockSolanaWallet(request, address);
  await attachHouse(request, { houseId: 'house_centaur_sweep' });
  await seedStreamflowLocks(request, {
    locks: [
      {
        address,
        streamId: 'stream-centaur-sweep',
        tokenSymbol: '$AGENTTOWN',
        locked: true,
        lockedAmountAtomic: '2500000',
        statusSchedule: [
          {
            from: '2026-03-10T12:00:00.000Z',
            to: '2026-03-10T13:00:00.000Z',
            locked: true,
            lockedAmountAtomic: '2500000',
          },
        ],
      },
    ],
  });

  const verifyBody = await verifyStreamflowLock(request, {
    walletAddress: address,
    streamId: 'stream-centaur-sweep',
    minLockAmountAtomic: '1000000',
    asOf: '2026-03-10T12:00:00.001Z',
  });
  expect(verifyBody?.data?.verification?.status).toBe('verified');
  expect(await getTableCount(request, 'poker_oil_snapshot_events')).toBe(0);

  const firstSweep = await runOilScheduler(request, {
    asOf: '2026-03-10T12:59:59.000Z',
  });
  expect(firstSweep?.summary?.verificationCount).toBeGreaterThanOrEqual(1);
  expect(firstSweep?.summary?.processedSnapshots).toBeGreaterThanOrEqual(14);
  expect(firstSweep?.summary?.processedSnapshots).toBeLessThanOrEqual(15);
  expect(firstSweep?.summary?.creditedOil).toBeGreaterThanOrEqual(1400);
  expect(firstSweep?.summary?.creditedOil).toBeLessThanOrEqual(1500);
  expect(await getTableCount(request, 'poker_oil_snapshot_events')).toBeGreaterThanOrEqual(14);
  expect(await getTableCount(request, 'poker_oil_ledger_entries')).toBeGreaterThanOrEqual(14);

  const secondSweep = await runOilScheduler(request, {
    asOf: '2026-03-10T12:59:59.000Z',
  });
  expect(secondSweep?.summary?.processedSnapshots).toBe(0);
  expect(secondSweep?.summary?.creditedOil).toBe(0);

  const balanceResp = await request.get('/api/poker/oil/balance?asOf=2026-03-10T12%3A59%3A59.000Z', {
    headers: { 'x-wallet-solana-address': address },
  });
  expect(balanceResp.ok()).toBe(true);
  const balanceBody = await balanceResp.json();
  expect(Number(balanceBody?.data?.oilBalance?.balance || 0)).toBeGreaterThanOrEqual(1400);
  expect(Number(balanceBody?.data?.oilBalance?.balance || 0)).toBeLessThanOrEqual(1500);
});
