const { test, expect } = require('@playwright/test');
const {
  resetPortalWebState,
  seedStreamflowLocks,
} = require('./helpers/portal_web');
const {
  bindPageSession,
  verifyStreamflowAndFundOil,
} = require('./helpers/poker_play');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M23.27: live poker lobby exposes policy controls and blocks quick-seat when the wallet cap or self-exclusion applies', async ({ page, request }) => {
  const user = {
    address: 'So1anaMockGuardUi11111111111111111111111111',
    houseId: 'house_policy_ui',
    streamId: 'stream-policy-ui',
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

  await page.goto('/poker/play?embed=1');
  await page.locator('[data-poker-section="poker-policy"] details summary').click();
  const policyCard = page.locator('.pokerCard').filter({
    has: page.getByRole('heading', { name: 'Limits' }),
  });
  await expect(page.getByRole('heading', { name: 'Limits' })).toBeVisible();
  await page.locator('#pokerPlayPolicyDailyCap').fill('300');
  await page.getByRole('button', { name: 'Save Limit' }).click();
  await expect(page.getByText('Poker policy updated.')).toBeVisible();
  await expect(policyCard).toContainText('Daily Cap');
  await expect(policyCard).toContainText('300 OIL');

  await page.locator('[data-poker-section="quick-seat"] details summary').click();
  await page.locator('#pokerPlayMatchmakeDisplayName').fill('Policy UI Cash');
  await page.getByRole('button', { name: 'Join Or Create' }).click();
  await expect(page.getByText('Quick seat failed: POKER_PLAY_POLICY_LIMIT_EXCEEDED')).toBeVisible();

  await page.locator('[data-poker-section="poker-policy"] details summary').click();
  await page.getByRole('button', { name: 'Self-Exclude 24h' }).click();
  await expect(page.getByText('Poker self-exclusion is active for 24 hours.')).toBeVisible();
  await page.locator('[data-poker-section="poker-policy"] details summary').click();
  await expect(page.getByText(/active until/i)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Join Or Create' })).toBeDisabled();
});
