const { test, expect } = require('@playwright/test');
const {
  processOilSnapshots,
  resetPortalWebState,
  seedStreamflowLocks,
} = require('./helpers/portal_web');
const {
  bindPageSession,
  browserJson,
} = require('./helpers/poker_play');

const ADMIN_HEADERS = { 'x-admin-token': 'test-admin' };

function findScheduleItem(scheduleBody, title) {
  const days = Array.isArray(scheduleBody?.data?.days) ? scheduleBody.data.days : [];
  return days.flatMap((day) => Array.isArray(day?.items) ? day.items : []).find((item) => String(item?.title || '') === title) || null;
}

function findScheduleItems(scheduleBody, title) {
  const days = Array.isArray(scheduleBody?.data?.days) ? scheduleBody.data.days : [];
  return days.flatMap((day) => Array.isArray(day?.items) ? day.items : []).filter((item) => String(item?.title || '') === title);
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M25.8+++ : cancelling a recurring schedule template closes future events and refunds registered buy-ins', async ({ browser, request }) => {
  const title = 'Daily Cancel Contract Sprint';
  const user = {
    address: 'So1anaMockCentaur11111111111111111111111111111',
    houseId: 'house_sched_cancel_contract',
    streamId: 'stream-centaur-01',
  };
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/');
  await bindPageSession(page, user);
  await seedStreamflowLocks(request, {
    locks: [
      {
        address: user.address,
        streamId: user.streamId,
        tokenSymbol: '$AGENTTOWN',
        locked: true,
        lockedAmountAtomic: '2500000',
        statusSchedule: [
          {
            from: '2026-03-12T08:00:00.000Z',
            to: '2026-03-12T09:00:00.000Z',
            locked: true,
            lockedAmountAtomic: '2500000',
          },
        ],
      },
    ],
  });
  let resp = await browserJson(page, '/api/poker/streamflow/challenge', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': user.address },
    data: {
      streamId: user.streamId,
      minLockAmountAtomic: '1000000',
    },
  });
  expect(resp.ok).toBe(true);
  const nonce = String(resp.body?.data?.challenge?.nonce || '');
  expect(nonce).toBeTruthy();

  resp = await browserJson(page, '/api/poker/streamflow/verify', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': user.address },
    data: {
      streamId: user.streamId,
      minLockAmountAtomic: '1000000',
      nonce,
      signature: 'test-signature',
      asOf: '2026-03-12T08:00:00.001Z',
    },
  });
  expect(resp.ok).toBe(true);
  const processed = await processOilSnapshots(request, {
    walletSubject: user.address,
    asOf: '2026-03-12T08:59:59.000Z',
  });
  expect(Number(processed?.oilBalance?.balance || 0)).toBeGreaterThanOrEqual(1400);

  const createResponse = await request.post('/api/poker/play/admin/schedule/templates?asOf=2026-03-12T08%3A00%3A00.000Z', {
    headers: ADMIN_HEADERS,
    data: {
      title,
      firstStartAt: '2026-03-13T12:00:00.000Z',
      recurrenceKind: 'daily',
      eventCount: 2,
      buyInOil: 500,
      smallBlindOil: 25,
      bigBlindOil: 50,
      maxSeats: 6,
      minPlayers: 2,
      lateRegistrationHands: 2,
      handsPerBlindLevel: 8,
    },
  });
  expect(createResponse.ok()).toBe(true);
  const createBody = await createResponse.json();
  const createdTemplateId = String(createBody?.data?.createdTemplateId || '');
  expect(createdTemplateId).toBeTruthy();

  const scheduleResponse = await browserJson(page, '/api/poker/play/schedule?asOf=2026-03-12T08%3A00%3A00.000Z', {
    headers: { 'x-wallet-solana-address': user.address },
  });
  expect(scheduleResponse.ok).toBe(true);
  const scheduleBody = scheduleResponse.body || {};
  const initialItems = findScheduleItems(scheduleBody, title);
  expect(initialItems).toHaveLength(2);
  const firstItem = findScheduleItem(scheduleBody, title);
  expect(firstItem?.actions?.register?.path).toBeTruthy();

  const sitResponse = await browserJson(page, String(firstItem.actions.register.path), {
    method: 'POST',
    headers: { 'x-wallet-solana-address': user.address },
    data: {
      seatNumber: 1,
      displayName: 'Cancel Contract Pilot',
      buyInOil: Number(firstItem?.buyInOil || 0),
      asOf: '2026-03-12T08:00:01.000Z',
    },
  });
  expect(sitResponse.ok).toBe(true);

  const cancelResponse = await request.post(`/api/poker/play/admin/schedule/templates/${encodeURIComponent(createdTemplateId)}/cancel?asOf=2026-03-12T08%3A00%3A02.000Z`, {
    headers: ADMIN_HEADERS,
    data: {},
  });
  expect(cancelResponse.ok()).toBe(true);
  const cancelBody = await cancelResponse.json();
  expect(cancelBody?.data?.cancelledTemplateId).toBe(createdTemplateId);
  const cancelledTemplate = (cancelBody?.data?.templates || []).find((item) => item?.templateId === createdTemplateId);
  expect(cancelledTemplate?.status).toBe('cancelled');
  expect(cancelledTemplate?.generatedEventCount).toBe(0);
  expect(Array.isArray(cancelBody?.data?.closedTables)).toBe(true);
  expect(cancelBody.data.closedTables).toHaveLength(2);
  expect(cancelBody.data.closedTables.reduce((sum, item) => sum + Number(item?.refundSummary?.refundedTotalOil || 0), 0)).toBe(500);

  const updatedScheduleResponse = await browserJson(page, '/api/poker/play/schedule?asOf=2026-03-12T08%3A00%3A03.000Z', {
    headers: { 'x-wallet-solana-address': user.address },
  });
  expect(updatedScheduleResponse.ok).toBe(true);
  const updatedScheduleBody = updatedScheduleResponse.body || {};
  expect(findScheduleItems(updatedScheduleBody, title)).toHaveLength(0);
  await context.close();
});
