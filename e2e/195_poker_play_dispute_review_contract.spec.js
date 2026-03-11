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

const ADMIN_HEADERS = { 'x-admin-token': 'test-admin' };

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M23.21: hand disputes pause a live table and leave an operator audit trail', async ({ browser, request }) => {
  const sitAt = '2026-03-11T13:00:00.500Z';
  const disputeAt = '2026-03-11T13:00:08.000Z';
  const resolveAt = '2026-03-11T13:00:20.000Z';
  const userA = {
    address: 'So1anaMockReviewA1111111111111111111111111111',
    houseId: 'house_review_a',
    streamId: 'stream-review-a',
  };
  const userB = {
    address: 'So1anaMockReviewB1111111111111111111111111111',
    houseId: 'house_review_b',
    streamId: 'stream-review-b',
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

  let resp = await browserJson(pageA, '/api/poker/play/tables/pkt_play_cash_01/sit', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': userA.address },
    data: {
      seatNumber: 1,
      displayName: 'Review Alpha',
      buyInOil: 400,
      asOf: sitAt,
    },
  });
  expect(resp.ok).toBe(true);

  resp = await browserJson(pageB, '/api/poker/play/tables/pkt_play_cash_01/sit', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': userB.address },
    data: {
      seatNumber: 2,
      displayName: 'Review Bravo',
      buyInOil: 400,
      asOf: sitAt,
    },
  });
  expect(resp.ok).toBe(true);

  const initial = await browserJson(pageA, `/api/poker/play/tables/pkt_play_cash_01?asOf=${encodeURIComponent(disputeAt)}`, {
    headers: { 'x-wallet-solana-address': userA.address },
  });
  expect(initial.ok).toBe(true);
  const handId = String(initial.body?.data?.hand?.handId || '');
  expect(handId).toBeTruthy();

  resp = await browserJson(pageA, `/api/poker/play/hands/${encodeURIComponent(handId)}/disputes`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': userA.address },
    data: {
      category: 'turn_order',
      note: 'Seat two acted before the countdown reached zero.',
      asOf: disputeAt,
    },
  });
  expect(resp.ok).toBe(true);
  expect(resp.body?.data?.table?.status).toBe('paused');
  expect(resp.body?.data?.review?.openDisputeCount).toBe(1);
  expect(resp.body?.data?.review?.status).toBe('under_review');
  expect(resp.body?.data?.review?.myDisputes?.[0]?.category).toBe('turn_order');
  const disputeId = String(resp.body?.data?.review?.myDisputes?.[0]?.disputeId || '');
  expect(disputeId).toBeTruthy();

  let adminResp = await request.get('/api/poker/play/admin/tables/pkt_play_cash_01/review', {
    headers: ADMIN_HEADERS,
  });
  expect(adminResp.ok()).toBe(true);
  let adminBody = await adminResp.json();
  expect(adminBody?.data?.table?.status).toBe('paused');
  expect(adminBody?.data?.disputes?.[0]?.disputeId).toBe(disputeId);
  expect(adminBody?.data?.disputes?.[0]?.status).toBe('open');
  const openedEventKinds = Array.isArray(adminBody?.data?.auditEvents)
    ? adminBody.data.auditEvents.map((event) => event.eventKind)
    : [];
  expect(openedEventKinds).toContain('dispute_opened');
  expect(openedEventKinds).toContain('table_paused');

  adminResp = await request.post(`/api/poker/play/admin/disputes/${encodeURIComponent(disputeId)}/resolve`, {
    headers: ADMIN_HEADERS,
    data: {
      status: 'resolved',
      resolutionNote: 'Verified the action order and resumed the hand.',
      resumeTable: true,
      asOf: resolveAt,
    },
  });
  expect(adminResp.ok()).toBe(true);
  adminBody = await adminResp.json();
  expect(adminBody?.data?.table?.status).toBe('open');
  expect(adminBody?.data?.disputes?.[0]?.status).toBe('resolved');
  expect(adminBody?.data?.openDisputes).toHaveLength(0);
  const resolvedEventKinds = Array.isArray(adminBody?.data?.auditEvents)
    ? adminBody.data.auditEvents.map((event) => event.eventKind)
    : [];
  expect(resolvedEventKinds).toContain('dispute_resolved');
  expect(resolvedEventKinds).toContain('table_resumed');

  const after = await browserJson(pageA, `/api/poker/play/tables/pkt_play_cash_01?asOf=${encodeURIComponent(resolveAt)}`, {
    headers: { 'x-wallet-solana-address': userA.address },
  });
  expect(after.ok).toBe(true);
  expect(after.body?.data?.table?.status).toBe('open');
  expect(after.body?.data?.review?.openDisputeCount).toBe(0);
  expect(after.body?.data?.review?.myDisputes?.[0]?.status).toBe('resolved');
  expect(after.body?.data?.review?.myDisputes?.[0]?.resolutionNote).toBe('Verified the action order and resumed the hand.');

  await contextA.close();
  await contextB.close();
});
