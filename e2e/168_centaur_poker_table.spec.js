const { test, expect } = require('@playwright/test');
const {
  processOilSnapshots,
  resetPortalWebState,
  resetToken,
  seedStreamflowLocks,
} = require('./helpers/portal_web');

async function bindPageSession(page, { address, houseId }) {
  await page.evaluate(async ({ address: nextAddress, houseId: nextHouseId, token }) => {
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
    if (!bindResp.ok) {
      throw new Error(`BIND_FAILED:${bindResp.status}`);
    }
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
    if (!houseResp.ok) {
      throw new Error(`HOUSE_FAILED:${houseResp.status}`);
    }
  }, { address, houseId, token: resetToken });
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M22.2: centaur poker page lets a human + AI seat verify, join, discuss, and lock a shared action', async ({ request, page }) => {
  const address = 'So1anaMockCentaurUi111111111111111111111111111';
  await seedStreamflowLocks(request, {
    locks: [
      {
        address,
        streamId: 'stream-centaur-ui',
        tokenSymbol: '$AGENTTOWN',
        locked: true,
        lockedAmountAtomic: '2500000',
      },
    ],
  });

  await page.addInitScript((walletAddress) => {
    window.__PRIVY_WALLET_BRIDGE__ = {
      async connectSolana() {
        return { address: walletAddress };
      },
      async signSolanaMessage() {
        return new Uint8Array(Array(64).fill(7));
      },
    };
  }, address);

  await page.goto('/poker/centaur/tournaments/pkt_centaur_01?embed=1');
  await bindPageSession(page, { address, houseId: 'house_centaur_ui' });

  await expect(page.getByText('Verify Streamflow Lock')).toBeVisible();
  await page.locator('#centaurStreamId').fill('stream-centaur-ui');
  await page.getByRole('button', { name: 'Sign & Verify' }).click();
  await expect(page.getByText('Join The Table')).toBeVisible();

  await processOilSnapshots(request, {
    walletSubject: address,
    asOf: new Date(Date.now() + (6 * 60 * 60 * 1000)).toISOString(),
  });
  await page.reload();
  await expect(page.getByText('Join The Table')).toBeVisible();

  await page.getByRole('button', { name: /Join For 300 OIL/ }).click();
  await expect(page.getByText('Live Hand')).toBeVisible();
  await expect(page.locator('#centaurCountdownValue')).not.toHaveText('--');
  await expect(page.getByText('Ah')).toBeVisible();
  await expect(page.getByText('Kd')).toBeVisible();

  await page.locator('#centaurMessageBody').fill('Call and keep the range wide.');
  await page.getByRole('button', { name: 'Send Discussion Note' }).click();
  await expect(page.locator('#centaurMessages')).toContainText('Call and keep the range wide.');
  await expect(page.locator('#centaurMessages')).toContainText('Prefer a raise to 150 OIL');

  await page.locator('#centaurActionKind').selectOption('call');
  await page.getByRole('button', { name: 'Lock Action' }).click();
  await expect(page.getByText('submitted')).toBeVisible();
  await expect(page.getByText('Commit: call 50 OIL.')).toBeVisible();
});
