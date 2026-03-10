const { test, expect } = require('@playwright/test');
const {
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

async function bindPageSession(page, { address, houseId }) {
  await page.evaluate(async ({ nextAddress, nextHouseId, token }) => {
    const bindResp = await fetch('/__test__/session/bind-wallet', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
        'x-test-reset': token,
      },
      body: JSON.stringify({
        chain: 'solana',
        address: nextAddress,
      }),
    });
    if (!bindResp.ok) throw new Error(`BIND_FAILED:${bindResp.status}`);
    const houseResp = await fetch('/__test__/session/attach-house', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
        'x-test-reset': token,
      },
      body: JSON.stringify({
        houseId: nextHouseId,
      }),
    });
    if (!houseResp.ok) throw new Error(`HOUSE_FAILED:${houseResp.status}`);
  }, { nextAddress: address, nextHouseId: houseId, token: resetToken });
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M22.4: a verified Streamflow stake cannot be rebound to another house', async ({ browser, request }) => {
  const address = 'So1anaMockCentaurBound1111111111111111111111111';
  await seedStreamflowLocks(request, {
    locks: [
      {
        address,
        streamId: 'stream-centaur-bound',
        tokenSymbol: '$AGENTTOWN',
        locked: true,
        lockedAmountAtomic: '2500000',
      },
    ],
  });

  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();
  await pageA.goto('/');
  await bindPageSession(pageA, { address, houseId: 'house_alpha' });

  let resp = await browserJson(pageA, '/api/oil/streamflow/challenge', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': address },
    data: {
      streamId: 'stream-centaur-bound',
      minLockAmountAtomic: '1000000',
    },
  });
  expect(resp.ok).toBe(true);
  const nonceA = String(resp.body?.data?.challenge?.nonce || '');
  expect(nonceA).toBeTruthy();

  resp = await browserJson(pageA, '/api/oil/streamflow/verify', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': address },
    data: {
      streamId: 'stream-centaur-bound',
      minLockAmountAtomic: '1000000',
      nonce: nonceA,
      signature: 'test-signature',
      asOf: '2026-03-10T12:00:00.001Z',
    },
  });
  expect(resp.ok).toBe(true);
  expect(resp.body?.data?.verification?.houseId).toBe('house_alpha');

  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();
  await pageB.goto('/');
  await bindPageSession(pageB, { address, houseId: 'house_beta' });

  resp = await browserJson(pageB, '/api/oil/streamflow/challenge', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': address },
    data: {
      streamId: 'stream-centaur-bound',
      minLockAmountAtomic: '1000000',
    },
  });
  expect(resp.ok).toBe(true);
  const nonceB = String(resp.body?.data?.challenge?.nonce || '');
  expect(nonceB).toBeTruthy();

  resp = await browserJson(pageB, '/api/oil/streamflow/verify', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': address },
    data: {
      streamId: 'stream-centaur-bound',
      minLockAmountAtomic: '1000000',
      nonce: nonceB,
      signature: 'test-signature',
      asOf: '2026-03-10T12:05:00.000Z',
    },
  });
  expect(resp.ok).toBe(false);
  expect(resp.status).toBe(409);
  expect(resp.body?.error?.code).toBe('STREAMFLOW_STAKE_ALREADY_CLAIMED');

  await contextA.close();
  await contextB.close();
});
