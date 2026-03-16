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

test('M23.5: live poker lobby quick-seat form creates or joins a matching table and opens the seat view', async ({ page, request }) => {
  const user = {
    address: 'So1anaMockMatchUi111111111111111111111111111',
    houseId: 'house_match_ui',
    streamId: 'stream-match-ui',
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
  await expect(page.getByRole('heading', { name: 'Quick Seat' })).toBeVisible();
  await page.locator('#pokerPlayMatchmakeType').selectOption('tournament');
  await page.locator('[data-poker-section="quick-seat"] details summary').click();
  await page.locator('#pokerPlayMatchmakeSmallBlind').fill('60');
  await page.locator('#pokerPlayMatchmakeBigBlind').fill('120');
  await page.locator('#pokerPlayMatchmakeBuyIn').fill('1200');
  await page.locator('#pokerPlayMatchmakeDisplayName').fill('UI Match Seat');

  await Promise.all([
    page.waitForURL(/\/poker\/play\/tables\/.+\?embed=1$/),
    page.getByRole('button', { name: 'Join Or Create' }).click(),
  ]);

  await expect(page.getByRole('heading', { name: 'Your Seat' })).toBeVisible();
  await expect(page.getByText('UI Match Seat')).toBeVisible();
  await expect(page.getByRole('heading', { name: /6-Max Tournament 60\/120/i })).toBeVisible();
});
