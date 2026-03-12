const { test, expect } = require('@playwright/test');
const { DEFAULT_TEST_TOKEN_ADDRESS, seedRecoverableTokenHouse } = require('./helpers/phase1');
const {
  expandHouseFootprint,
  getHouseEconomy,
  processOilSnapshots,
  resetPortalWebState,
  seedStreamflowLocks,
  verifyStreamflowLock,
} = require('./helpers/portal_web');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M22.6: house footprint expansion debits OIL and projects into the town grid', async ({ request }) => {
  const address = DEFAULT_TEST_TOKEN_ADDRESS;
  const streamId = 'stream-house-tiles';
  await seedStreamflowLocks(request, {
    locks: [
      {
        address,
        streamId,
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

  const seededHouse = await seedRecoverableTokenHouse(request, { address });
  const verifyBody = await verifyStreamflowLock(request, {
    walletAddress: address,
    routePrefix: '/api/oil',
    streamId,
    minLockAmountAtomic: '1000000',
    asOf: '2026-03-10T12:00:00.001Z',
  });
  expect(verifyBody?.data?.verification?.status).toBe('verified');

  await processOilSnapshots(request, {
    walletSubject: address,
    asOf: '2026-03-10T12:59:59.000Z',
  });

  const economyBefore = await getHouseEconomy(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    walletAddress: address,
    asOf: '2026-03-10T12:59:59.000Z',
  });
  const startingBalance = Number(economyBefore?.economy?.oilBalance?.balance || 0);
  expect(economyBefore?.economy?.footprint?.tiles).toBe(1);
  expect(economyBefore?.economy?.footprint?.nextExpansionCostOil).toBe(500);
  expect(startingBalance).toBeGreaterThanOrEqual(1400);

  const expandBody = await expandHouseFootprint(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    walletAddress: address,
    asOf: '2026-03-10T12:59:59.000Z',
  });
  expect(expandBody?.economy?.footprint?.tiles).toBe(2);
  expect(expandBody?.economy?.footprint?.nextExpansionCostOil).toBe(1000);
  expect(Number(expandBody?.economy?.oilBalance?.balance || 0)).toBe(startingBalance - 500);

  const townResp = await request.get('/api/town/grid');
  expect(townResp.ok()).toBe(true);
  const townBody = await townResp.json();
  const townHouse = (townBody?.houses || []).find((item) => item?.houseId === seededHouse.houseId);
  expect(townHouse).toBeTruthy();
  expect(townHouse?.footprint?.tiles).toBe(2);
  expect(String(townHouse?.housePublicJson?.tagline || '')).toContain('2 tiles');
});
