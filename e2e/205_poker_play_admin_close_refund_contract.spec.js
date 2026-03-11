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

test('M23.20: admin can close a live cash table, refund stacks, and export review data', async ({ browser, request }) => {
  const userA = {
    address: 'So1anaMockAdminCoseA111111111111111111111111',
    houseId: 'house_admin_close_a',
    streamId: 'stream-admin-close-a',
  };
  const userB = {
    address: 'So1anaMockAdminCoseB111111111111111111111111',
    houseId: 'house_admin_close_b',
    streamId: 'stream-admin-close-b',
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
      displayName: 'Admin Close Alpha',
      buyInOil: 400,
    },
  });
  expect(resp.ok).toBe(true);

  resp = await browserJson(pageB, '/api/poker/play/tables/pkt_play_cash_01/sit', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': userB.address },
    data: {
      seatNumber: 2,
      displayName: 'Admin Close Bravo',
      buyInOil: 400,
    },
  });
  expect(resp.ok).toBe(true);

  const detailResp = await browserJson(pageA, '/api/poker/play/tables/pkt_play_cash_01', {
    headers: { 'x-wallet-solana-address': userA.address },
  });
  expect(detailResp.ok).toBe(true);
  const detail = detailResp.body?.data || {};
  const handId = String(detail?.hand?.handId || '');
  const seatA = Array.isArray(detail?.seats) ? detail.seats.find((seat) => Number(seat?.seatNumber || 0) === 1) : null;
  const seatB = Array.isArray(detail?.seats) ? detail.seats.find((seat) => Number(seat?.seatNumber || 0) === 2) : null;
  const stackA = Number(seatA?.stackOil || 0);
  const stackB = Number(seatB?.stackOil || 0);
  expect(stackA).toBeGreaterThan(0);
  expect(stackB).toBeGreaterThan(0);

  const beforeBalanceAResp = await browserJson(pageA, '/api/oil/balance', {
    headers: { 'x-wallet-solana-address': userA.address },
  });
  const beforeBalanceBResp = await browserJson(pageB, '/api/oil/balance', {
    headers: { 'x-wallet-solana-address': userB.address },
  });
  expect(beforeBalanceAResp.ok).toBe(true);
  expect(beforeBalanceBResp.ok).toBe(true);
  const beforeBalanceA = Number(beforeBalanceAResp.body?.data?.oilBalance?.balance || 0);
  const beforeBalanceB = Number(beforeBalanceBResp.body?.data?.oilBalance?.balance || 0);

  const adminCloseResp = await request.post('/api/poker/play/admin/tables/pkt_play_cash_01/close', {
    headers: ADMIN_HEADERS,
    data: {
      reason: 'Operator closed the table.',
      asOf: '2026-03-10T12:00:02.000Z',
    },
  });
  expect(adminCloseResp.ok()).toBe(true);
  const adminCloseBody = await adminCloseResp.json();
  expect(adminCloseBody?.data?.table?.status).toBe('admin_closed');
  expect(adminCloseBody?.data?.table?.state?.refundMode).toBe('cash_stack');
  expect(Number(adminCloseBody?.data?.table?.state?.refundedSeatCount || 0)).toBe(2);
  expect(Number(adminCloseBody?.data?.table?.state?.refundedTotalOil || 0)).toBe(stackA + stackB);
  expect(adminCloseBody?.data?.hand?.status).toBe('cancelled');

  const afterBalanceAResp = await browserJson(pageA, '/api/oil/balance', {
    headers: { 'x-wallet-solana-address': userA.address },
  });
  const afterBalanceBResp = await browserJson(pageB, '/api/oil/balance', {
    headers: { 'x-wallet-solana-address': userB.address },
  });
  expect(afterBalanceAResp.ok).toBe(true);
  expect(afterBalanceBResp.ok).toBe(true);
  expect(Number(afterBalanceAResp.body?.data?.oilBalance?.balance || 0)).toBe(beforeBalanceA + stackA);
  expect(Number(afterBalanceBResp.body?.data?.oilBalance?.balance || 0)).toBe(beforeBalanceB + stackB);

  const postCloseMessageResp = await browserJson(pageA, `/api/poker/play/hands/${encodeURIComponent(handId)}/messages`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': userA.address },
    data: {
      body: 'still there?',
    },
  });
  expect(postCloseMessageResp.ok).toBe(false);
  expect(postCloseMessageResp.status).toBe(409);
  expect(postCloseMessageResp.body?.error?.code).toBe('POKER_PLAY_TABLE_CLOSED');

  const exportResp = await request.get('/api/poker/play/admin/tables/pkt_play_cash_01/export', {
    headers: ADMIN_HEADERS,
  });
  expect(exportResp.ok()).toBe(true);
  const exportBody = await exportResp.json();
  expect(exportBody?.data?.exportVersion).toBe('poker-play-admin-export-v1');
  expect(exportBody?.data?.review?.table?.status).toBe('admin_closed');
  const eventKinds = Array.isArray(exportBody?.data?.review?.auditEvents)
    ? exportBody.data.review.auditEvents.map((event) => event.eventKind)
    : [];
  expect(eventKinds).toContain('table_closed');

  await contextA.close();
  await contextB.close();
});
