const { test, expect } = require('@playwright/test');
const {
  getTableCount,
  processOilSnapshots,
  resetPortalWebState,
  resetToken,
  seedStreamflowLocks,
} = require('./helpers/portal_web');

async function browserJson(page, path, { method = 'GET', data = null, headers = {} } = {}) {
  return await page.evaluate(async ({ path: requestPath, method: requestMethod, data: requestData, headers: requestHeaders }) => {
    const response = await fetch(requestPath, {
      method: requestMethod,
      credentials: 'include',
      headers: {
        ...(requestData ? { 'content-type': 'application/json' } : {}),
        ...requestHeaders,
      },
      body: requestData ? JSON.stringify(requestData) : undefined,
    });
    const body = await response.json().catch(() => ({}));
    return {
      ok: response.ok,
      status: response.status,
      body,
    };
  }, { path, method, data, headers });
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M22.1: verified Streamflow locks accrue OIL and fund centaur tournament play', async ({ request, page }) => {
  const address = 'So1anaMockCentaur11111111111111111111111111111';
  await page.goto('/');
  let resp = await browserJson(page, '/__test__/session/bind-wallet', {
    method: 'POST',
    headers: { 'x-test-reset': resetToken },
    data: {
      chain: 'solana',
      address,
    },
  });
  expect(resp.ok).toBe(true);
  resp = await browserJson(page, '/__test__/session/attach-house', {
    method: 'POST',
    headers: { 'x-test-reset': resetToken },
    data: {
      houseId: 'house_centaur',
    },
  });
  expect(resp.ok).toBe(true);

  await seedStreamflowLocks(request, {
    locks: [
      {
        address,
        streamId: 'stream-centaur-01',
        tokenSymbol: '$AGENTTOWN',
        locked: true,
        lockedAmountAtomic: '2500000',
        statusSchedule: [
          {
            from: '2026-03-10T12:00:00.000Z',
            to: '2026-03-10T13:00:00.000Z',
            locked: true,
            lockedAmountAtomic: '2500000',
          },
        ],
      },
    ],
  });

  resp = await browserJson(page, '/api/poker/streamflow/challenge', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': address },
    data: {
      streamId: 'stream-centaur-01',
      minLockAmountAtomic: '1000000',
    },
  });
  expect(resp.ok).toBe(true);
  const nonce = String(resp.body?.data?.challenge?.nonce || '');
  expect(nonce).toBeTruthy();

  resp = await browserJson(page, '/api/poker/streamflow/verify', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': address },
    data: {
      streamId: 'stream-centaur-01',
      minLockAmountAtomic: '1000000',
      nonce,
      signature: 'test-signature',
      asOf: '2026-03-10T12:00:00.001Z',
    },
  });
  expect(resp.ok).toBe(true);
  const verifyBody = resp.body;
  expect(verifyBody?.data?.verification?.status).toBe('verified');

  const processBody = await processOilSnapshots(request, {
    walletSubject: address,
    asOf: '2026-03-10T12:59:59.000Z',
  });
  const startingBalance = Number(processBody?.oilBalance?.balance || 0);
  expect(startingBalance).toBeGreaterThanOrEqual(1400);
  expect(startingBalance).toBeLessThanOrEqual(1500);
  expect(await getTableCount(request, 'poker_oil_snapshot_events')).toBeGreaterThanOrEqual(14);
  expect(await getTableCount(request, 'poker_oil_snapshot_events')).toBeLessThanOrEqual(15);

  resp = await browserJson(page, '/api/poker/centaur/tournaments/pkt_centaur_01/join', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': address },
    data: {
      displayName: 'Centaur House',
      asOf: '2026-03-10T12:59:59.000Z',
    },
  });
  expect(resp.ok).toBe(true);
  const joinBody = resp.body;
  expect(joinBody?.data?.entry?.displayName).toBe('Centaur House');
  expect(joinBody?.data?.hand?.handId).toBeTruthy();
  expect(Number(joinBody?.data?.oilBalance?.balance || 0)).toBe(startingBalance - 300);
  expect(Array.isArray(joinBody?.data?.currentHourSnapshots?.slots)).toBe(true);
  expect(joinBody?.data?.currentHourSnapshots?.slots).toHaveLength(15);
  expect(await getTableCount(request, 'poker_centaur_entries')).toBe(1);
  expect(await getTableCount(request, 'poker_centaur_hands')).toBe(1);

  const handId = String(joinBody?.data?.hand?.handId || '');
  resp = await browserJson(page, `/api/poker/centaur/hands/${encodeURIComponent(handId)}/messages`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': address },
    data: {
      body: 'Flatting the price feels cleaner than punting the stack here.',
    },
  });
  expect(resp.ok).toBe(true);
  const messageBody = resp.body;
  expect(messageBody?.data?.messages).toHaveLength(2);
  expect(messageBody?.data?.messages?.[1]?.authorRole).toBe('agent');

  resp = await browserJson(page, `/api/poker/centaur/hands/${encodeURIComponent(handId)}/actions`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': address },
    data: {
      actionKind: 'call',
      amountOil: 0,
    },
  });
  expect(resp.ok).toBe(true);
  const actionBody = resp.body;
  expect(actionBody?.data?.hand?.status).toBe('submitted');
  expect(Number(actionBody?.data?.oilBalance?.balance || 0)).toBe(startingBalance - 350);

  resp = await browserJson(page, '/api/poker/centaur/tournaments/pkt_centaur_01?asOf=2026-03-10T12%3A59%3A59.000Z', {
    method: 'GET',
    headers: { 'x-wallet-solana-address': address },
  });
  expect(resp.ok).toBe(true);
  const detailBody = resp.body;
  expect(detailBody?.data?.verification?.provider).toBe('streamflow');
  expect(detailBody?.data?.actions).toHaveLength(1);
  expect(detailBody?.data?.messages.length).toBeGreaterThanOrEqual(4);
  expect(detailBody?.data?.hand?.tableState?.lastAction?.actionKind).toBe('call');
  expect(await getTableCount(request, 'poker_oil_ledger_entries')).toBeGreaterThanOrEqual(16);
});
