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

test('M23.29: quick-seat lobby can create a PKO tournament and the table UI renders bounty economics', async ({ page, request }) => {
  const user = {
    address: 'So1anaMockBountyUi1111111111111111111111111',
    houseId: 'house_bounty_ui',
    streamId: 'stream-bounty-ui',
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
  await page.locator('#pokerPlayMatchmakeType').selectOption('tournament');
  await page.locator('[data-poker-section="quick-seat"] details summary').click();
  await expect(page.locator('#pokerPlayMatchmakeBountyRow')).toBeVisible();
  await page.locator('#pokerPlayMatchmakeBountyModel').selectOption('pko_50');
  await page.locator('#pokerPlayMatchmakeBuyIn').fill('1000');
  await page.locator('#pokerPlayMatchmakeTitle').fill('PKO Test Table');
  await page.locator('#pokerPlayMatchmakeDisplayName').fill('Bounty UI House');
  await page.getByRole('button', { name: 'Join Or Create' }).click();

  await expect(page).toHaveURL(/\/poker\/play\/tables\/.+/);
  const tableCard = page.locator('.pokerCard').filter({
    has: page.getByRole('heading', { name: 'PKO Test Table' }),
  }).first();
  const seatCard = page.locator('.pokerCard').filter({
    has: page.getByRole('heading', { name: 'Your Seat' }),
  }).first();
  await expect(tableCard).toContainText('PKO 50/50');
  await expect(tableCard).toContainText('Starting Bounty');
  await expect(tableCard).toContainText('500 OIL');
  await expect(tableCard).toContainText('Bounty Pool');
  await expect(tableCard).toContainText('Prize Pool');
  await expect(seatCard).toContainText('Current Bounty');
});
