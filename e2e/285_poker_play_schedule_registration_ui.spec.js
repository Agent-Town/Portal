const { test, expect } = require('@playwright/test');
const {
  resetPortalWebState,
  seedStreamflowLocks,
} = require('./helpers/portal_web');
const {
  bindPageSession,
  browserJson,
  verifyStreamflowAndFundOil,
} = require('./helpers/poker_play');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M25.8 UI+: schedule cards support register, waitlist, and unregister actions directly from the calendar', async ({ browser, request }) => {
  const users = [
    { address: 'So1anaMockSchedUiA11111111111111111111111111', houseId: 'house_sched_ui_viewer', streamId: 'stream-sched-ui-viewer', displayName: 'Schedule UI Viewer' },
    { address: 'So1anaMockSchedUiD11111111111111111111111111', houseId: 'house_sched_ui_waitlist', streamId: 'stream-sched-ui-waitlist', displayName: 'Schedule UI Waitlist Viewer' },
    { address: 'So1anaMockSchedUiB11111111111111111111111111', houseId: 'house_sched_ui_open', streamId: 'stream-sched-ui-open', displayName: 'Schedule UI Open' },
    { address: 'So1anaMockSchedUiC11111111111111111111111111', houseId: 'house_sched_ui_full', streamId: 'stream-sched-ui-full', displayName: 'Schedule UI Full' },
  ];
  const [viewer, waitlistViewer, openCreator, fullCreator] = users;
  const headersFor = (address) => ({ 'x-wallet-solana-address': address });

  await seedStreamflowLocks(request, {
    locks: users.map((user) => ({
      address: user.address,
      streamId: user.streamId,
      tokenSymbol: '$AGENTTOWN',
      locked: true,
      lockedAmountAtomic: '2500000',
    })),
  });

  const contexts = [];
  const pages = [];
  try {
    for (const user of users) {
      const context = await browser.newContext();
      const page = await context.newPage();
      contexts.push(context);
      pages.push(page);
      await page.goto('/');
      await bindPageSession(page, user);
      await verifyStreamflowAndFundOil(page, request, {
        address: user.address,
        streamId: user.streamId,
      });
    }

    const [viewerPage, waitlistViewerPage, openCreatorPage, fullCreatorPage] = pages;

    let resp = await browserJson(viewerPage, '/api/poker/play/tables', {
      method: 'POST',
      headers: headersFor(viewer.address),
      data: {
        tableType: 'tournament',
        title: 'Schedule Registered UI',
        smallBlindOil: 25,
        bigBlindOil: 50,
        buyInOil: 300,
        maxSeats: 6,
        minPlayers: 2,
        lateRegistrationHands: 2,
        scheduledStartAt: '2026-03-12T17:00:00.000Z',
        seatNumber: 1,
        displayName: viewer.displayName,
        asOf: '2026-03-12T11:00:00.000Z',
      },
    });
    expect(resp.ok).toBe(true);
    const registeredTableId = String(resp.body?.data?.table?.tableId || '');

    resp = await browserJson(openCreatorPage, '/api/poker/play/tables', {
      method: 'POST',
      headers: headersFor(openCreator.address),
      data: {
        tableType: 'tournament',
        title: 'Schedule Open UI',
        smallBlindOil: 25,
        bigBlindOil: 50,
        buyInOil: 300,
        maxSeats: 6,
        minPlayers: 2,
        lateRegistrationHands: 2,
        scheduledStartAt: '2026-03-12T18:00:00.000Z',
        joinNow: false,
        asOf: '2026-03-12T11:00:01.000Z',
      },
    });
    expect(resp.ok).toBe(true);
    const openTableId = String(resp.body?.data?.table?.tableId || '');

    resp = await browserJson(fullCreatorPage, '/api/poker/play/tables', {
      method: 'POST',
      headers: headersFor(fullCreator.address),
      data: {
        tableType: 'tournament',
        title: 'Schedule Waitlist UI',
        smallBlindOil: 25,
        bigBlindOil: 50,
        buyInOil: 300,
        maxSeats: 2,
        minPlayers: 2,
        lateRegistrationHands: 2,
        scheduledStartAt: '2026-03-12T19:00:00.000Z',
        seatNumber: 1,
        displayName: fullCreator.displayName,
        asOf: '2026-03-12T11:00:02.000Z',
      },
    });
    expect(resp.ok).toBe(true);
    const waitlistTableId = String(resp.body?.data?.table?.tableId || '');

    resp = await browserJson(openCreatorPage, `/api/poker/play/tables/${encodeURIComponent(waitlistTableId)}/sit`, {
      method: 'POST',
      headers: headersFor(openCreator.address),
      data: {
        seatNumber: 2,
        displayName: openCreator.displayName,
        buyInOil: 300,
        asOf: '2026-03-12T11:00:03.000Z',
      },
    });
    expect(resp.ok).toBe(true);

    await viewerPage.goto('/poker/play/schedule?asOf=2026-03-12T11%3A05%3A00.000Z&embed=1');
    await waitlistViewerPage.goto('/poker/play/schedule?asOf=2026-03-12T11%3A05%3A00.000Z&embed=1');

    await expect(viewerPage.getByRole('heading', { name: 'Tournament Schedule' })).toBeVisible();
    await expect(waitlistViewerPage.getByRole('heading', { name: 'Tournament Schedule' })).toBeVisible();

    const registeredCard = viewerPage.locator('.pokerMessage').filter({ hasText: 'Schedule Registered UI' });
    const openCard = viewerPage.locator('.pokerMessage').filter({ hasText: 'Schedule Open UI' });
    const waitlistCard = waitlistViewerPage.locator('.pokerMessage').filter({ hasText: 'Schedule Waitlist UI' });

    await expect(registeredCard.getByRole('button', { name: 'Unregister' })).toBeVisible();
    await expect(openCard.getByRole('button', { name: 'Register' })).toBeVisible();
    await expect(waitlistCard.getByRole('button', { name: 'Join Waitlist' })).toBeVisible();

    await registeredCard.getByRole('button', { name: 'Unregister' }).click();
    await expect(registeredCard.getByText('open').first()).toBeVisible();
    await expect(registeredCard.getByRole('button', { name: 'Register' })).toBeVisible();

    await openCard.getByRole('button', { name: 'Register' }).click();
    await expect(openCard.getByText('registered').first()).toBeVisible();
    await expect(openCard.getByRole('button', { name: 'Unregister' })).toBeVisible();

    await waitlistCard.getByRole('button', { name: 'Join Waitlist' }).click();
    await expect(waitlistCard.getByText('waitlisted').first()).toBeVisible();
    await expect(waitlistCard.getByRole('button', { name: 'Leave Waitlist' })).toBeVisible();
  } finally {
    await Promise.all(contexts.map((context) => context.close()));
  }
});
