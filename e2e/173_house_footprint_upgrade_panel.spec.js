const { test, expect } = require('@playwright/test');
const { DEFAULT_TEST_TOKEN_ADDRESS, installMockSolanaWallet, seedRecoverableTokenHouse } = require('./helpers/phase1');
const {
  processOilSnapshots,
  resetPortalWebState,
  resetToken,
  seedStreamflowLocks,
  verifyStreamflowLock,
} = require('./helpers/portal_web');

async function bindPageSession(page, { address, houseId }) {
  await page.evaluate(async ({ nextAddress, nextHouseId, token }) => {
    const bindResp = await fetch('/__test__/session/bind-wallet', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
        'x-test-reset': token,
      },
      body: JSON.stringify({
        chain: 'solana',
        address: nextAddress,
      }),
    });
    if (!bindResp.ok) throw new Error(`BIND_FAILED:${bindResp.status}`);
    const houseResp = await fetch('/__test__/session/attach-house', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
        'x-test-reset': token,
      },
      body: JSON.stringify({
        houseId: nextHouseId,
      }),
    });
    if (!houseResp.ok) throw new Error(`HOUSE_FAILED:${houseResp.status}`);
  }, { nextAddress: address, nextHouseId: houseId, token: resetToken });
}

async function connectWalletIfNeeded(page) {
  const connectWalletBtn = page.getByRole('button', { name: /Connect wallet|Disconnect wallet/ });
  const label = String((await connectWalletBtn.textContent()) || '');
  if (label.includes('Connect')) {
    await connectWalletBtn.click();
  }
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M22.7: House lets a verified staked wallet spend OIL to expand footprint', async ({ request, page }) => {
  const address = DEFAULT_TEST_TOKEN_ADDRESS;
  const streamId = 'stream-house-spend';
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

  await installMockSolanaWallet(page, { address });
  await page.goto(`/house?house=${encodeURIComponent(seededHouse.houseId)}`);
  await bindPageSession(page, { address, houseId: seededHouse.houseId });
  await connectWalletIfNeeded(page);
  await page.getByRole('button', { name: 'Sign to unlock' }).click();
  await expect(page.getByRole('button', { name: 'Unlocked' })).toBeVisible();

  await expect(page.locator('#houseEconomySummary')).toContainText('Footprint: 1/9 tiles');
  await expect(page.locator('#houseEconomyExpandBtn')).toBeEnabled();
  await expect(page.locator('#houseEconomyExpandBtn')).toContainText('500 OIL');

  await page.locator('#houseEconomyExpandBtn').click();
  await expect(page.locator('#houseEconomyStatus')).toContainText('Footprint expanded to 2 tiles.');
  await expect(page.locator('#houseEconomySummary')).toContainText('Footprint: 2/9 tiles');
  await expect(page.locator('#houseEconomySummary')).toContainText('Next expansion: 1000 OIL');
});
