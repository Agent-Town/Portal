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

function findScheduleItem(schedulePayload, title) {
  const days = Array.isArray(schedulePayload?.body?.data?.days) ? schedulePayload.body.data.days : [];
  for (const day of days) {
    const items = Array.isArray(day?.items) ? day.items : [];
    const match = items.find((item) => String(item?.title || '') === title);
    if (match) return match;
  }
  return null;
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M25.8+: schedule payload exposes direct register, waitlist, and unregister actions with deterministic state changes', async ({ browser, request }) => {
  const users = [
    { address: 'So1anaMockSchedRegA1111111111111111111111111', houseId: 'house_sched_reg_viewer', streamId: 'stream-sched-reg-viewer', displayName: 'Schedule Viewer' },
    { address: 'So1anaMockSchedRegD1111111111111111111111111', houseId: 'house_sched_reg_waitlist', streamId: 'stream-sched-reg-waitlist', displayName: 'Schedule Waitlist Viewer' },
    { address: 'So1anaMockSchedRegB1111111111111111111111111', houseId: 'house_sched_reg_open', streamId: 'stream-sched-reg-open', displayName: 'Open Creator' },
    { address: 'So1anaMockSchedRegC1111111111111111111111111', houseId: 'house_sched_reg_full', streamId: 'stream-sched-reg-full', displayName: 'Full Creator' },
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
        title: 'Schedule Registered Contract',
        smallBlindOil: 25,
        bigBlindOil: 50,
        buyInOil: 300,
        maxSeats: 6,
        minPlayers: 2,
        lateRegistrationHands: 2,
        scheduledStartAt: '2026-03-12T14:00:00.000Z',
        seatNumber: 1,
        displayName: viewer.displayName,
        asOf: '2026-03-12T10:00:00.000Z',
      },
    });
    expect(resp.ok).toBe(true);

    resp = await browserJson(openCreatorPage, '/api/poker/play/tables', {
      method: 'POST',
      headers: headersFor(openCreator.address),
      data: {
        tableType: 'tournament',
        title: 'Schedule Open Contract',
        smallBlindOil: 25,
        bigBlindOil: 50,
        buyInOil: 300,
        maxSeats: 6,
        minPlayers: 2,
        lateRegistrationHands: 2,
        scheduledStartAt: '2026-03-12T15:00:00.000Z',
        joinNow: false,
        asOf: '2026-03-12T10:00:01.000Z',
      },
    });
    expect(resp.ok).toBe(true);

    resp = await browserJson(fullCreatorPage, '/api/poker/play/tables', {
      method: 'POST',
      headers: headersFor(fullCreator.address),
      data: {
        tableType: 'tournament',
        title: 'Schedule Waitlist Contract',
        smallBlindOil: 25,
        bigBlindOil: 50,
        buyInOil: 300,
        maxSeats: 2,
        minPlayers: 2,
        lateRegistrationHands: 2,
        scheduledStartAt: '2026-03-12T16:00:00.000Z',
        seatNumber: 1,
        displayName: fullCreator.displayName,
        asOf: '2026-03-12T10:00:02.000Z',
      },
    });
    expect(resp.ok).toBe(true);
    const fullTableId = String(resp.body?.data?.table?.tableId || '');

    resp = await browserJson(openCreatorPage, `/api/poker/play/tables/${encodeURIComponent(fullTableId)}/sit`, {
      method: 'POST',
      headers: headersFor(openCreator.address),
      data: {
        seatNumber: 2,
        displayName: openCreator.displayName,
        buyInOil: 300,
        asOf: '2026-03-12T10:00:03.000Z',
      },
    });
    expect(resp.ok).toBe(true);

    const initialSchedule = await browserJson(viewerPage, '/api/poker/play/schedule?asOf=2026-03-12T10%3A05%3A00.000Z', {
      headers: headersFor(viewer.address),
    });
    expect(initialSchedule.ok).toBe(true);

    const registeredItem = findScheduleItem(initialSchedule, 'Schedule Registered Contract');
    const openItem = findScheduleItem(initialSchedule, 'Schedule Open Contract');
    const waitlistItem = findScheduleItem(initialSchedule, 'Schedule Waitlist Contract');

    expect(registeredItem?.registrationStatus).toBe('registered');
    expect(registeredItem?.actions?.unregister).toEqual({
      method: 'POST',
      path: `/api/poker/play/tables/${encodeURIComponent(registeredItem.tableId)}/leave`,
    });
    expect(registeredItem?.actions?.register).toBeNull();
    expect(openItem?.registrationStatus).toBe('open');
    expect(Number(openItem?.buyInOil || 0)).toBeGreaterThan(0);
    expect(openItem?.actions?.register).toEqual({
      method: 'POST',
      path: `/api/poker/play/tables/${encodeURIComponent(openItem.tableId)}/sit`,
    });
    expect(waitlistItem?.registrationStatus).toBe('waitlist');

    const waitlistSchedule = await browserJson(waitlistViewerPage, '/api/poker/play/schedule?asOf=2026-03-12T10%3A05%3A00.000Z', {
      headers: headersFor(waitlistViewer.address),
    });
    expect(waitlistSchedule.ok).toBe(true);
    const waitlistViewerItem = findScheduleItem(waitlistSchedule, 'Schedule Waitlist Contract');
    expect(waitlistViewerItem?.registrationStatus).toBe('waitlist');
    expect(waitlistViewerItem?.actions?.waitlist).toEqual({
      method: 'POST',
      path: `/api/poker/play/tables/${encodeURIComponent(waitlistViewerItem.tableId)}/waitlist`,
    });

    resp = await browserJson(viewerPage, registeredItem.actions.unregister.path, {
      method: registeredItem.actions.unregister.method,
      headers: headersFor(viewer.address),
      data: {
        asOf: '2026-03-12T10:05:01.000Z',
      },
    });
    expect(resp.ok).toBe(true);

    resp = await browserJson(viewerPage, openItem.actions.register.path, {
      method: openItem.actions.register.method,
      headers: headersFor(viewer.address),
      data: {
        buyInOil: openItem.buyInOil,
        asOf: '2026-03-12T10:05:02.000Z',
      },
    });
    expect(resp.ok).toBe(true);

    resp = await browserJson(waitlistViewerPage, waitlistViewerItem.actions.waitlist.path, {
      method: waitlistViewerItem.actions.waitlist.method,
      headers: headersFor(waitlistViewer.address),
      data: {
        buyInOil: waitlistViewerItem.buyInOil,
        asOf: '2026-03-12T10:05:03.000Z',
      },
    });
    expect(resp.ok).toBe(true);

    const updatedSchedule = await browserJson(viewerPage, '/api/poker/play/schedule?asOf=2026-03-12T10%3A05%3A04.000Z', {
      headers: headersFor(viewer.address),
    });
    expect(updatedSchedule.ok).toBe(true);

    const updatedRegisteredItem = findScheduleItem(updatedSchedule, 'Schedule Registered Contract');
    const updatedOpenItem = findScheduleItem(updatedSchedule, 'Schedule Open Contract');
    const updatedWaitlistItem = findScheduleItem(updatedSchedule, 'Schedule Waitlist Contract');

    expect(updatedRegisteredItem?.registrationStatus).toBe('open');
    expect(updatedRegisteredItem?.actions?.register?.path).toBe(`/api/poker/play/tables/${encodeURIComponent(updatedRegisteredItem.tableId)}/sit`);
    expect(updatedOpenItem?.registrationStatus).toBe('registered');
    expect(updatedOpenItem?.actions?.unregister?.path).toBe(`/api/poker/play/tables/${encodeURIComponent(updatedOpenItem.tableId)}/leave`);
    expect(updatedWaitlistItem?.registrationStatus).toBe('waitlist');
    expect(updatedWaitlistItem?.waitlistCount).toBe(1);

    const updatedWaitlistSchedule = await browserJson(waitlistViewerPage, '/api/poker/play/schedule?asOf=2026-03-12T10%3A05%3A04.000Z', {
      headers: headersFor(waitlistViewer.address),
    });
    expect(updatedWaitlistSchedule.ok).toBe(true);
    const updatedWaitlistViewerItem = findScheduleItem(updatedWaitlistSchedule, 'Schedule Waitlist Contract');
    expect(updatedWaitlistViewerItem?.registrationStatus).toBe('waitlisted');
    expect(updatedWaitlistViewerItem?.waitlistCount).toBe(1);
    expect(updatedWaitlistViewerItem?.actions?.leaveWaitlist).toEqual({
      method: 'DELETE',
      path: `/api/poker/play/tables/${encodeURIComponent(updatedWaitlistViewerItem.tableId)}/waitlist`,
    });
  } finally {
    await Promise.all(contexts.map((context) => context.close()));
  }
});
