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

test('M23.13: stale seats flip to disconnected, extend the acting clock once, and clear on reconnect', async ({ browser, request }) => {
  const sitAt = '2026-03-10T12:00:00.500Z';
  const staleAt = '2026-03-10T12:00:35.500Z';
  const reconnectAt = '2026-03-10T12:00:40.500Z';
  const userA = {
    address: 'So1anaMockSeatA111111111111111111111111111111',
    houseId: 'house_presence_a',
    streamId: 'stream-presence-a',
  };
  const userB = {
    address: 'So1anaMockSeatB111111111111111111111111111111',
    houseId: 'house_presence_b',
    streamId: 'stream-presence-b',
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
      displayName: 'Presence Alpha',
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
      displayName: 'Presence Bravo',
      buyInOil: 400,
      asOf: sitAt,
    },
  });
  expect(resp.ok).toBe(true);

  const initial = await getTable(pageA, userA.address, { asOf: sitAt });
  expect(Number(initial?.hand?.actingSeat || 0)).toBe(1);
  const initialExpiresAtMs = Date.parse(String(initial?.hand?.actionExpiresAt || ''));
  expect(Number.isFinite(initialExpiresAtMs)).toBe(true);

  const staleView = await getTable(pageB, userB.address, { asOf: staleAt });
  const staleSeatA = staleView?.seats?.find((seat) => Number(seat.seatNumber || 0) === 1);
  const staleSeatB = staleView?.seats?.find((seat) => Number(seat.seatNumber || 0) === 2);
  expect(staleSeatA?.presenceStatus).toBe('disconnected');
  expect(staleSeatA?.disconnectedAt).toBe(staleAt);
  expect(staleSeatB?.presenceStatus).toBe('online');
  expect(Number(staleView?.table?.summary?.disconnectedSeatCount || 0)).toBe(1);
  const staleExpiresAtMs = Date.parse(String(staleView?.hand?.actionExpiresAt || ''));
  expect(staleExpiresAtMs).toBeGreaterThan(initialExpiresAtMs);
  expect(staleExpiresAtMs).toBe(Date.parse(staleAt) + (90 * 1000));

  const reconnected = await getTable(pageA, userA.address, { asOf: reconnectAt });
  const reconnectSeatA = reconnected?.seats?.find((seat) => Number(seat.seatNumber || 0) === 1);
  expect(reconnectSeatA?.presenceStatus).toBe('online');
  expect(reconnectSeatA?.disconnectedAt).toBe(null);
  expect(Number(reconnected?.table?.summary?.disconnectedSeatCount || 0)).toBe(0);
  const publicNotes = Array.isArray(reconnected?.messages) ? reconnected.messages.map((message) => String(message?.body || '')) : [];
  expect(publicNotes.some((body) => body.includes('Presence Alpha') && body.includes('disconnected'))).toBe(true);
  expect(publicNotes.some((body) => body.includes('Presence Alpha') && body.includes('reconnected'))).toBe(true);

  await contextA.close();
  await contextB.close();
});
