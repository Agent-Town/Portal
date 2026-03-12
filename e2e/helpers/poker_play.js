const { resetToken } = require('./portal_web');

async function browserJson(page, path, { method = 'GET', data = null, headers = {} } = {}) {
  const normalizedMethod = String(method || 'GET').toUpperCase();
  const includeBody = data && normalizedMethod !== 'GET' && normalizedMethod !== 'HEAD';
  const response = await page.request.fetch(path, {
    method: normalizedMethod,
    headers: {
      ...(includeBody ? { 'content-type': 'application/json' } : {}),
      ...headers,
    },
    ...(includeBody ? { data } : {}),
  });
  const body = await response.json().catch(() => ({}));
  return {
    ok: response.ok(),
    status: response.status(),
    body,
  };
}

async function bindPageSession(page, { address, houseId }) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    let resp = await browserJson(page, '/__test__/session/bind-wallet', {
      method: 'POST',
      headers: { 'x-test-reset': resetToken },
      data: {
        chain: 'solana',
        address,
      },
    });
    if (!resp.ok) {
      throw new Error(`BIND_WALLET_FAILED:${resp.status}:${JSON.stringify(resp.body)}`);
    }
    resp = await browserJson(page, '/__test__/session/attach-house', {
      method: 'POST',
      headers: { 'x-test-reset': resetToken },
      data: {
        houseId,
      },
    });
    if (!resp.ok) {
      throw new Error(`ATTACH_HOUSE_FAILED:${resp.status}:${JSON.stringify(resp.body)}`);
    }
  }
}

async function verifyStreamflowAndFundOil(page, request, {
  address,
  streamId,
  minLockAmountAtomic = '1000000',
  asOfVerify = '2026-03-10T12:00:00.001Z',
  asOfProcess = '2026-03-10T12:59:59.000Z',
} = {}) {
  let resp = await browserJson(page, '/api/oil/streamflow/challenge', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': address },
    data: {
      streamId,
      minLockAmountAtomic,
    },
  });
  if (!resp.ok) {
    throw new Error(`STREAMFLOW_CHALLENGE_FAILED:${resp.status}:${JSON.stringify(resp.body)}`);
  }
  const nonce = String(resp.body?.data?.challenge?.nonce || '');
  resp = await browserJson(page, '/api/oil/streamflow/verify', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': address },
    data: {
      streamId,
      minLockAmountAtomic,
      nonce,
      signature: 'test-signature',
      asOf: asOfVerify,
    },
  });
  if (!resp.ok) {
    throw new Error(`STREAMFLOW_VERIFY_FAILED:${resp.status}:${JSON.stringify(resp.body)}`);
  }
  const verification = resp.body?.data?.verification || null;
  const balanceResp = await browserJson(page, `/api/oil/balance?asOf=${encodeURIComponent(asOfProcess)}`, {
    headers: { 'x-wallet-solana-address': address },
  });
  if (!balanceResp.ok) {
    throw new Error(`OIL_BALANCE_FAILED:${balanceResp.status}:${JSON.stringify(balanceResp.body)}`);
  }
  return {
    verification,
    oilBalance: balanceResp.body?.data?.oilBalance || null,
  };
}

async function seedPokerPlayHarness(request, {
  scenario,
  asOf,
  tableId,
  actors,
} = {}) {
  const resp = await request.post('/__test__/poker/play/harness', {
    headers: { 'x-test-reset': resetToken },
    data: {
      scenario,
      asOf,
      tableId,
      actors,
    },
  });
  const body = await resp.json().catch(() => ({}));
  if (!resp.ok()) {
    throw new Error(`POKER_PLAY_HARNESS_FAILED:${resp.status()}:${JSON.stringify(body)}`);
  }
  return body?.seeded || null;
}

module.exports = {
  bindPageSession,
  browserJson,
  seedPokerPlayHarness,
  verifyStreamflowAndFundOil,
};
