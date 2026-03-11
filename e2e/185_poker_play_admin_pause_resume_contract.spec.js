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

async function getTable(page, address, { asOf } = {}) {
  const path = asOf
    ? `/api/poker/play/tables/pkt_play_cash_01?asOf=${encodeURIComponent(asOf)}`
    : '/api/poker/play/tables/pkt_play_cash_01';
  const resp = await browserJson(page, path, {
    headers: { 'x-wallet-solana-address': address },
  });
  expect(resp.ok).toBe(true);
  return resp.body?.data || {};
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M23.11: admin pause freezes a live table clock until resume', async ({ browser, request }) => {
  const sitAt = '2026-03-10T12:00:00.500Z';
  const pauseAt = '2026-03-10T12:00:05.000Z';
  const duringPauseAt = '2026-03-10T12:08:00.000Z';
  const resumeAt = '2026-03-10T12:08:05.000Z';
  const actAt = '2026-03-10T12:08:06.000Z';
  const userA = {
    address: 'So1anaMockPauseA11111111111111111111111111111',
    houseId: 'house_pause_a',
    streamId: 'stream-pause-a',
  };
  const userB = {
    address: 'So1anaMockPauseB11111111111111111111111111111',
    houseId: 'house_pause_b',
    streamId: 'stream-pause-b',
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
      displayName: 'Pause Alpha',
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
      displayName: 'Pause Bravo',
      buyInOil: 400,
      asOf: sitAt,
    },
  });
  expect(resp.ok).toBe(true);

  const initial = await getTable(pageA, userA.address, { asOf: sitAt });
  expect(initial?.hand?.status).toBe('live');
  const initialHandId = String(initial?.hand?.handId || '');
  const initialHandNumber = Number(initial?.hand?.handNumber || 0);
  const initialActingSeat = Number(initial?.hand?.actingSeat || 0);
  expect(initialHandId).toBeTruthy();
  expect(initialHandNumber).toBe(1);
  expect(initialActingSeat).toBeGreaterThan(0);

  let adminResp = await request.post('/api/poker/play/admin/tables/pkt_play_cash_01/pause', {
    headers: ADMIN_HEADERS,
    data: {
      reason: 'operator review',
      asOf: pauseAt,
    },
  });
  expect(adminResp.ok()).toBe(true);
  let adminBody = await adminResp.json();
  expect(adminBody?.data?.table?.status).toBe('paused');
  expect(adminBody?.data?.table?.state?.pausedReason).toBe('operator review');

  const paused = await getTable(pageA, userA.address, { asOf: duringPauseAt });
  expect(paused?.table?.status).toBe('paused');
  expect(Number(paused?.hand?.handNumber || 0)).toBe(initialHandNumber);
  expect(String(paused?.hand?.handId || '')).toBe(initialHandId);
  expect(Number(paused?.hand?.actingSeat || 0)).toBe(initialActingSeat);

  const actorPage = initialActingSeat === 1 ? pageA : pageB;
  const actorAddress = initialActingSeat === 1 ? userA.address : userB.address;
  resp = await browserJson(actorPage, `/api/poker/play/hands/${encodeURIComponent(initialHandId)}/actions`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': actorAddress },
    data: {
      actionKind: 'fold',
      amountOil: 0,
      asOf: duringPauseAt,
    },
  });
  expect(resp.ok).toBe(false);
  expect(resp.status).toBe(409);
  expect(resp.body?.error?.code).toBe('POKER_PLAY_TABLE_PAUSED');

  adminResp = await request.post('/api/poker/play/admin/tables/pkt_play_cash_01/resume', {
    headers: ADMIN_HEADERS,
    data: {
      asOf: resumeAt,
    },
  });
  expect(adminResp.ok()).toBe(true);
  adminBody = await adminResp.json();
  expect(adminBody?.data?.table?.status).toBe('open');
  const resumedExpiry = Date.parse(String(adminBody?.data?.hand?.actionExpiresAt || ''));
  expect(Number.isFinite(resumedExpiry)).toBe(true);
  expect(resumedExpiry).toBeGreaterThan(Date.parse(resumeAt));

  resp = await browserJson(actorPage, `/api/poker/play/hands/${encodeURIComponent(initialHandId)}/actions`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': actorAddress },
    data: {
      actionKind: 'fold',
      amountOil: 0,
      asOf: actAt,
    },
  });
  expect(resp.ok).toBe(true);
  expect(resp.body?.data?.table?.status).toBe('open');
  expect(Number(resp.body?.data?.table?.summary?.handNumber || 0)).toBeGreaterThanOrEqual(2);

  await contextA.close();
  await contextB.close();
});
