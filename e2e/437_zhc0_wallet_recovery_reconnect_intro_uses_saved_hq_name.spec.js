const { test, expect } = require('@playwright/test');

const {
  DEFAULT_TEST_TOKEN_ADDRESS,
  installMockSolanaWallet,
  seedRecoverableTokenHouse,
} = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const { attachHouseToPageSession } = require('./helpers/unified_platform');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

async function bootstrapFoundersReady(request) {
  const response = await request.post('/__test__/session/bootstrap-onboarding', {
    headers: { 'x-test-reset': resetToken },
    data: {
      step: 'done',
      profile: {
        humanName: 'Robin',
        agentName: 'OpenClaw',
      },
    },
  });
  expect(response.ok()).toBeTruthy();
}

async function cacheRecoveredWallet(page, houseId) {
  await page.evaluate(({ nextHouseId, nextAddress }) => {
    localStorage.setItem('agentTownWallet', JSON.stringify({
      address: nextAddress,
      houseId: nextHouseId,
    }));
    localStorage.setItem('agentTown:walletIdentityHint', JSON.stringify({
      solana: nextAddress,
    }));
  }, {
    nextHouseId: String(houseId || ''),
    nextAddress: DEFAULT_TEST_TOKEN_ADDRESS,
  });
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M44.15 wallet recovery reconnect intro uses the saved HQ name on the Welcome back branch', async ({ page, request }) => {
  await installMockSolanaWallet(page, {
    address: DEFAULT_TEST_TOKEN_ADDRESS,
  });
  await bootstrapFoundersReady(page.request);
  const seededHouse = await seedRecoverableTokenHouse(request, {
    address: DEFAULT_TEST_TOKEN_ADDRESS,
  });

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const attached = await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
  });
  expect(attached.status).toBe(200);

  await page.reload();
  await waitForLiteApi(page);

  const root = page.getByTestId('zhc-house-hq-surface');
  const input = page.getByTestId('house-hq-name-input');
  const preview = page.getByTestId('house-hq-name-preview');
  const primary = page.getByTestId('house-hq-start-mission');
  const reconnectIntro = page.getByTestId('house-reconnect-intro');
  const reconnectTitle = page.locator('#reconnectTitle');
  const customName = 'Shared Orbit';

  await expect(root).toBeVisible();
  await expect(reconnectTitle).toHaveText('Reconnect to House');
  await expect(reconnectIntro).toHaveText('Your house is ready. Continue in this town session.');

  await input.fill(customName);
  await primary.click();

  await expect(page.getByTestId('house-experiences-panel')).toBeVisible();
  await expect(reconnectTitle).toHaveText('Reconnect to House');
  await expect(reconnectIntro).toHaveText(`${customName} HQ is ready. Continue in this town session.`);

  await cacheRecoveredWallet(page, seededHouse.houseId);

  await page.reload();
  await waitForLiteApi(page);

  await expect(root).toBeVisible();
  await expect(preview).toHaveText(customName);
  await expect(reconnectTitle).toHaveText('Welcome back');
  await expect(reconnectIntro).toHaveText(`We found ${customName} HQ for this wallet. Continue with your worker in this session.`);
});
