const { test, expect } = require('@playwright/test');
const {
  attachHouse,
  bindMockSolanaWallet,
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

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M22.5: House shows verified Streamflow stake and OIL balance for the bound wallet', async ({ request, page }) => {
  const address = 'So1anaMockHouseGem111111111111111111111111111';
  await seedStreamflowLocks(request, {
    locks: [
      {
        address,
        streamId: 'stream-house-oil',
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

  await bindMockSolanaWallet(request, address);
  await attachHouse(request, { houseId: 'house_oil' });
  const verifyBody = await verifyStreamflowLock(request, {
    walletAddress: address,
    streamId: 'stream-house-oil',
    minLockAmountAtomic: '1000000',
    asOf: '2026-03-10T12:00:00.001Z',
  });
  expect(verifyBody?.data?.verification?.status).toBe('verified');

  await page.addInitScript((walletAddress) => {
    window.__PRIVY_WALLET_BRIDGE__ = {
      async connectSolana() {
        return { address: walletAddress };
      },
      async signSolanaMessage() {
        return new Uint8Array(Array(64).fill(9));
      },
    };
  }, address);

  await page.goto('/house?house=house_oil');
  await bindPageSession(page, { address, houseId: 'house_oil' });
  await page.getByRole('button', { name: 'Connect wallet' }).click();

  await processOilSnapshots(request, {
    walletSubject: address,
    asOf: '2026-03-10T12:59:59.000Z',
  });

  await page.reload();
  await expect(page.locator('#houseEconomySummary')).toContainText('Verified stake: stream-house-oil');
  await expect(page.locator('#houseEconomySummary')).toContainText('Wallet: So1anaMockHouseGem111111111111111111111111111');

  const summaryText = await page.locator('#houseEconomySummary').textContent();
  const balanceMatch = String(summaryText || '').match(/OIL balance:\s*(\d+)/);
  expect(balanceMatch).toBeTruthy();
  const balance = Number(balanceMatch[1] || 0);
  expect(balance).toBeGreaterThanOrEqual(1400);
});
