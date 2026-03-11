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

test('M23.16 UI: creators can make an invite-only table and invited wallets can join it from the shared invite link', async ({ browser, request }) => {
  const userA = {
    address: 'So1anaMockUiA11111111111111111111111111111111',
    houseId: 'house_invite_ui_a',
    streamId: 'stream-invite-ui-a',
  };
  const userB = {
    address: 'So1anaMockUiB11111111111111111111111111111111',
    houseId: 'house_invite_ui_b',
    streamId: 'stream-invite-ui-b',
  };

  await seedStreamflowLocks(request, {
    locks: [
      {
        address: userA.address,
        streamId: userA.streamId,
        tokenSymbol: '$AGENTTOWN',
        locked: true,
        lockedAmountAtomic: '2500000',
      },
      {
        address: userB.address,
        streamId: userB.streamId,
        tokenSymbol: '$AGENTTOWN',
        locked: true,
        lockedAmountAtomic: '2500000',
      },
    ],
  });

  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();
  await pageA.goto('/');
  await bindPageSession(pageA, userA);
  await verifyStreamflowAndFundOil(pageA, request, {
    address: userA.address,
    streamId: userA.streamId,
  });

  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();
  await pageB.goto('/');
  await bindPageSession(pageB, userB);
  await verifyStreamflowAndFundOil(pageB, request, {
    address: userB.address,
    streamId: userB.streamId,
  });

  await pageA.goto('/poker/play?embed=1');
  await expect(pageA.getByRole('heading', { name: 'Live Poker Lobby' })).toBeVisible();
  await pageA.locator('#pokerPlayMatchmakeAccess').selectOption('invite_only');
  await pageA.locator('#pokerPlayMatchmakeTitle').fill('Invite UI Table');
  await pageA.locator('#pokerPlayMatchmakeDisplayName').fill('Invite UI Alpha');
  await Promise.all([
    pageA.waitForURL(/\/poker\/play\/tables\//),
    pageA.getByRole('button', { name: 'Join Or Create' }).click(),
  ]);

  await expect(pageA.getByText('Invite UI Table')).toBeVisible();
  await expect(pageA.getByRole('heading', { name: 'Invite Access' })).toBeVisible();
  await expect(pageA.getByText('Invite Code')).toBeVisible();
  await expect(pageA.locator('.pokerBadge').filter({ hasText: 'invite-only' }).first()).toBeVisible();
  const inviteHref = await pageA.getByRole('link', { name: 'Open Invite Link' }).getAttribute('href');
  expect(String(inviteHref || '')).toContain('inviteCode=');

  await pageB.goto(String(inviteHref));
  await expect(pageB.getByText('Invite UI Table')).toBeVisible();
  await expect(pageB.getByRole('heading', { name: 'Take A Seat' })).toBeVisible();
  await pageB.locator('#pokerPlayDisplayName').fill('Invite UI Bravo');
  await pageB.getByRole('button', { name: 'Join Table' }).click();

  await expect(pageB.getByRole('heading', { name: 'Your Seat' })).toBeVisible();
  await expect(pageB.getByText('Invite UI Bravo')).toBeVisible();
  await expect(pageB.locator('.pokerBadge').filter({ hasText: 'invite-only' }).first()).toBeVisible();

  await contextA.close();
  await contextB.close();
});
