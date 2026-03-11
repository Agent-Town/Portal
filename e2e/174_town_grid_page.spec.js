const { test, expect, request: playwrightRequest } = require('@playwright/test');
const { DEFAULT_TEST_TOKEN_ADDRESS, seedRecoverableTokenHouse } = require('./helpers/phase1');
const {
  expandHouseFootprint,
  processOilSnapshots,
  resetPortalWebState,
  seedStreamflowLocks,
  verifyStreamflowLock,
} = require('./helpers/portal_web');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M22.8: public town page ranks houses by footprint and links into the house view', async ({ request, page }) => {
  const addressA = DEFAULT_TEST_TOKEN_ADDRESS;
  const streamId = 'stream-town-alpha';
  const houseBApi = await playwrightRequest.newContext({ baseURL: test.info().project.use.baseURL });

  try {
    await seedStreamflowLocks(request, {
      locks: [
        {
          address: addressA,
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

    const houseA = await seedRecoverableTokenHouse(request, { address: addressA });
    const houseB = await seedRecoverableTokenHouse(houseBApi, { address: addressA, signatureMultiplier: 17 });

    const verifyBody = await verifyStreamflowLock(request, {
      walletAddress: addressA,
      routePrefix: '/api/oil',
      streamId,
      minLockAmountAtomic: '1000000',
      asOf: '2026-03-10T12:00:00.001Z',
    });
    expect(verifyBody?.data?.verification?.status).toBe('verified');

    await processOilSnapshots(request, {
      walletSubject: addressA,
      asOf: '2026-03-10T12:59:59.000Z',
    });

    const expanded = await expandHouseFootprint(request, {
      houseId: houseA.houseId,
      houseAuthKey: houseA.houseAuthKey,
      walletAddress: addressA,
      asOf: '2026-03-10T12:59:59.000Z',
    });
    expect(expanded?.economy?.footprint?.tiles).toBe(2);

    await page.goto('/town');

    await expect(page.locator('#townStatus')).toContainText('2 public houses loaded.');
    const cards = page.locator('[data-testid="town-house-card"]');
    await expect(cards).toHaveCount(2);

    await expect(cards.nth(0)).toHaveAttribute('data-house-id', houseA.houseId);
    await expect(cards.nth(0)).toContainText('2/9 tiles');
    await expect(cards.nth(1)).toHaveAttribute('data-house-id', houseB.houseId);
    await expect(cards.nth(1)).toContainText('1/9 tiles');

    await expect(cards.nth(0).getByRole('link', { name: 'Open house' })).toHaveAttribute(
      'href',
      `/house?house=${encodeURIComponent(houseA.houseId)}`
    );
  } finally {
    await houseBApi.dispose();
  }
});
