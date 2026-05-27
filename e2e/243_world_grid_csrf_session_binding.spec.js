const { test, expect } = require('@playwright/test');
const { openWorldGrid, resetWorldGrid, seedFoundersPlot } = require('./helpers/world_grid');

const sharedWalletHeaders = {
  'x-wallet-chain': 'solana',
  'x-wallet-address': 'So1anaMockToken3333333333333333333333333333'
};

const sharedWalletAddress = sharedWalletHeaders['x-wallet-address'];

async function installMockProviderWallet(context, address = sharedWalletAddress) {
  await context.addInitScript((walletAddress) => {
    const listeners = {
      disconnect: new Set(),
      accountChanged: new Set()
    };
    const provider = {
      on(event, handler) {
        if (listeners[event] && typeof handler === 'function') listeners[event].add(handler);
      },
      off(event, handler) {
        if (listeners[event]) listeners[event].delete(handler);
      },
      removeListener(event, handler) {
        if (listeners[event]) listeners[event].delete(handler);
      },
      emit(event, payload) {
        for (const handler of Array.from(listeners[event] || [])) handler(payload);
      }
    };
    const signature = new Uint8Array(64);
    for (let index = 0; index < signature.length; index += 1) {
      signature[index] = (index * 17) & 0xff;
    }
    window.__WORLD_GRID_PROVIDER_SIGNOFF__ = {
      providerDisconnectEvents: 0,
      explicitDisconnectCalls: 0,
      emitDisconnect() {
        this.providerDisconnectEvents += 1;
        provider.emit('disconnect');
      }
    };
    window.__PRIVY_WALLET_BRIDGE__ = {
      connectSolana: async () => ({ address: walletAddress, provider }),
      disconnectSolana: async () => {
        window.__WORLD_GRID_PROVIDER_SIGNOFF__.explicitDisconnectCalls += 1;
      },
      signSolanaMessage: async () => ({ signature, publicKey: { toString: () => walletAddress } })
    };
  }, address);
}

async function fetchCsrfToken(page, flags = 'v50,v51') {
  return await page.evaluate(async ({ flags }) => {
    const response = await fetch('/api/world/mutation-token', {
      credentials: 'include',
      headers: { 'x-world-grid-feature-flags': flags }
    });
    const body = await response.json();
    return {
      status: response.status,
      csrfToken: body.csrfToken || '',
      errorCode: body.error?.code || ''
    };
  }, { flags });
}

async function seedFoundersPlotViaFetch(page) {
  return await page.evaluate(async () => {
    const response = await fetch('/api/founders-plot/state', {
      credentials: 'include'
    });
    const body = await response.json().catch(() => null);
    return {
      status: response.status,
      ok: body?.ok === true || Boolean(body?.state)
    };
  });
}

async function claimOptions(page, flags = 'v50,v51') {
  return await page.evaluate(async ({ flags }) => {
    const response = await fetch('/api/world/territory/claim-options', {
      credentials: 'include',
      headers: { 'x-world-grid-feature-flags': flags }
    });
    const body = await response.json();
    return {
      status: response.status,
      options: body.options || [],
      errorCode: body.error?.code || ''
    };
  }, { flags });
}

async function planClaimWithToken(page, { cellId, csrfToken, idempotencyKey, flags = 'v50,v51' }) {
  return await page.evaluate(async ({ cellId, csrfToken, idempotencyKey, flags }) => {
    const response = await fetch('/api/world/territory/plan-claim', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
        'x-world-grid-feature-flags': flags,
        'x-world-grid-csrf': csrfToken
      },
      body: JSON.stringify({ cellId, idempotencyKey })
    });
    const body = await response.json();
    return {
      status: response.status,
      claimId: body.claim?.claimId || '',
      errorCode: body.error?.code || ''
    };
  }, { cellId, csrfToken, idempotencyKey, flags });
}

async function resetSession(page) {
  return await page.evaluate(async () => {
    const response = await fetch('/api/session/reset', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({})
    });
    const body = await response.json().catch(() => null);
    return {
      status: response.status,
      ok: body?.ok === true,
      teamCode: body?.teamCode || ''
    };
  });
}

async function invalidateWorldGridCsrfForSession(page) {
  return await page.evaluate(async () => {
    const response = await fetch('/api/session/world-grid-csrf/invalidate', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({})
    });
    const body = await response.json().catch(() => null);
    return {
      status: response.status,
      ok: body?.ok === true,
      invalidatedCount: Number(body?.invalidatedCount || 0),
      errorCode: body?.error?.code || ''
    };
  });
}

test.beforeEach(async ({ request }) => {
  await resetWorldGrid(request);
});

test('V5 world-grid CSRF issuing a new token invalidates the older same-session token', async ({ page }) => {
  await seedFoundersPlot(page);
  await openWorldGrid(page, 'v50,v51');

  const firstToken = await fetchCsrfToken(page);
  expect(firstToken.status).toBe(200);
  expect(firstToken.csrfToken).toMatch(/^wgcsrf_[a-f0-9]{48}$/);

  const secondToken = await fetchCsrfToken(page);
  expect(secondToken.status).toBe(200);
  expect(secondToken.csrfToken).toMatch(/^wgcsrf_[a-f0-9]{48}$/);
  expect(secondToken.csrfToken).not.toBe(firstToken.csrfToken);

  const options = await claimOptions(page);
  expect(options.status).toBe(200);
  expect(options.options.length).toBeGreaterThan(0);
  const cellId = options.options[0].cellId;

  const staleToken = await planClaimWithToken(page, {
    cellId,
    csrfToken: firstToken.csrfToken,
    idempotencyKey: 'e2e_csrf_rotated_token_denied'
  });
  expect(staleToken.status).toBe(403);
  expect(staleToken.errorCode).toBe('CSRF_INVALID');

  const currentToken = await planClaimWithToken(page, {
    cellId,
    csrfToken: secondToken.csrfToken,
    idempotencyKey: 'e2e_csrf_rotated_token_allowed'
  });
  expect(currentToken.status).toBe(200);
  expect(currentToken.claimId).toMatch(/^claim_/);
});

test('V5 world-grid CSRF token from a prior browser session is invalid after session reset for the same wallet', async ({ browser }) => {
  const context = await browser.newContext({ extraHTTPHeaders: sharedWalletHeaders });
  try {
    const page = await context.newPage();
    await seedFoundersPlot(page);
    await openWorldGrid(page, 'v50,v51');

    const tokenBeforeReset = await fetchCsrfToken(page);
    expect(tokenBeforeReset.status).toBe(200);
    expect(tokenBeforeReset.csrfToken).toMatch(/^wgcsrf_[a-f0-9]{48}$/);

    const reset = await resetSession(page);
    expect(reset.status).toBe(200);
    expect(reset.ok).toBe(true);
    expect(reset.teamCode).toMatch(/^TEAM-/);

    await openWorldGrid(page, 'v50,v51');
    const options = await claimOptions(page);
    expect(options.status).toBe(200);
    expect(options.options.length).toBeGreaterThan(0);
    const cellId = options.options[0].cellId;

    const staleToken = await planClaimWithToken(page, {
      cellId,
      csrfToken: tokenBeforeReset.csrfToken,
      idempotencyKey: 'e2e_csrf_session_reset_denied'
    });
    expect(staleToken.status).toBe(403);
    expect(staleToken.errorCode).toBe('CSRF_INVALID');

    const tokenAfterReset = await fetchCsrfToken(page);
    expect(tokenAfterReset.status).toBe(200);
    expect(tokenAfterReset.csrfToken).toMatch(/^wgcsrf_[a-f0-9]{48}$/);
    expect(tokenAfterReset.csrfToken).not.toBe(tokenBeforeReset.csrfToken);

    const currentToken = await planClaimWithToken(page, {
      cellId,
      csrfToken: tokenAfterReset.csrfToken,
      idempotencyKey: 'e2e_csrf_session_reset_allowed'
    });
    expect(currentToken.status).toBe(200);
    expect(currentToken.claimId).toMatch(/^claim_/);
  } finally {
    await context.close();
  }
});

test('V5 world-grid CSRF token is invalid after wallet/provider disconnect invalidation', async ({ browser }) => {
  const context = await browser.newContext({ extraHTTPHeaders: sharedWalletHeaders });
  try {
    const page = await context.newPage();
    await seedFoundersPlot(page);
    await openWorldGrid(page, 'v50,v51');

    const tokenBeforeDisconnect = await fetchCsrfToken(page);
    expect(tokenBeforeDisconnect.status).toBe(200);
    expect(tokenBeforeDisconnect.csrfToken).toMatch(/^wgcsrf_[a-f0-9]{48}$/);

    const invalidated = await invalidateWorldGridCsrfForSession(page);
    expect(invalidated.status).toBe(200);
    expect(invalidated.ok).toBe(true);
    expect(invalidated.invalidatedCount).toBeGreaterThanOrEqual(1);

    const options = await claimOptions(page);
    expect(options.status).toBe(200);
    expect(options.options.length).toBeGreaterThan(0);
    const cellId = options.options[0].cellId;

    const staleToken = await planClaimWithToken(page, {
      cellId,
      csrfToken: tokenBeforeDisconnect.csrfToken,
      idempotencyKey: 'e2e_csrf_disconnect_denied'
    });
    expect(staleToken.status).toBe(403);
    expect(staleToken.errorCode).toBe('CSRF_INVALID');

    const tokenAfterDisconnect = await fetchCsrfToken(page);
    expect(tokenAfterDisconnect.status).toBe(200);
    expect(tokenAfterDisconnect.csrfToken).toMatch(/^wgcsrf_[a-f0-9]{48}$/);
    expect(tokenAfterDisconnect.csrfToken).not.toBe(tokenBeforeDisconnect.csrfToken);

    const currentToken = await planClaimWithToken(page, {
      cellId,
      csrfToken: tokenAfterDisconnect.csrfToken,
      idempotencyKey: 'e2e_csrf_disconnect_allowed'
    });
    expect(currentToken.status).toBe(200);
    expect(currentToken.claimId).toMatch(/^claim_/);
  } finally {
    await context.close();
  }
});

test('V5 world-grid CSRF token is invalidated by the provider disconnect callback path', async ({ browser }) => {
  const context = await browser.newContext({ extraHTTPHeaders: sharedWalletHeaders });
  await installMockProviderWallet(context);
  try {
    const page = await context.newPage();
    await page.goto('/');
    await page.getByRole('button', { name: /Open Plan Wagons/ }).click();
    await page.waitForFunction(() => typeof document.getElementById('connectWalletBtn')?.onclick === 'function');
    await page.evaluate(() => document.getElementById('connectWalletBtn').click());
    await expect.poll(async () => await page.evaluate(() => (
      window.__AGENT_TOWN_WALLET_CLIENT__?.getAddress?.({ chain: 'solana' }) || ''
    ))).toBe(sharedWalletAddress);

    const seeded = await seedFoundersPlotViaFetch(page);
    expect(seeded.status).toBe(200);
    expect(seeded.ok).toBe(true);

    const tokenBeforeProviderDisconnect = await fetchCsrfToken(page);
    expect(tokenBeforeProviderDisconnect.status).toBe(200);
    expect(tokenBeforeProviderDisconnect.csrfToken).toMatch(/^wgcsrf_[a-f0-9]{48}$/);

    const invalidationResponsePromise = page.waitForResponse((response) => (
      response.url().includes('/api/session/world-grid-csrf/invalidate')
      && response.request().method() === 'POST'
    ));
    await page.evaluate(() => window.__WORLD_GRID_PROVIDER_SIGNOFF__.emitDisconnect());
    const invalidationResponse = await invalidationResponsePromise;
    expect(invalidationResponse.status()).toBe(200);
    const invalidationBody = await invalidationResponse.json();
    expect(invalidationBody.ok).toBe(true);
    expect(Number(invalidationBody.invalidatedCount || 0)).toBeGreaterThanOrEqual(1);

    await expect.poll(async () => await page.evaluate(() => (
      window.__AGENT_TOWN_WALLET_CLIENT__?.getAddress?.({ chain: 'solana' }) || ''
    ))).toBe('');
    const providerSignoff = await page.evaluate(() => window.__WORLD_GRID_PROVIDER_SIGNOFF__);
    expect(providerSignoff.providerDisconnectEvents).toBe(1);
    expect(providerSignoff.explicitDisconnectCalls).toBe(0);

    const options = await claimOptions(page);
    expect(options.status).toBe(200);
    expect(options.options.length).toBeGreaterThan(0);
    const cellId = options.options[0].cellId;

    const staleToken = await planClaimWithToken(page, {
      cellId,
      csrfToken: tokenBeforeProviderDisconnect.csrfToken,
      idempotencyKey: 'e2e_csrf_provider_callback_denied'
    });
    expect(staleToken.status).toBe(403);
    expect(staleToken.errorCode).toBe('CSRF_INVALID');

    const tokenAfterProviderDisconnect = await fetchCsrfToken(page);
    expect(tokenAfterProviderDisconnect.status).toBe(200);
    expect(tokenAfterProviderDisconnect.csrfToken).toMatch(/^wgcsrf_[a-f0-9]{48}$/);
    expect(tokenAfterProviderDisconnect.csrfToken).not.toBe(tokenBeforeProviderDisconnect.csrfToken);

    const currentToken = await planClaimWithToken(page, {
      cellId,
      csrfToken: tokenAfterProviderDisconnect.csrfToken,
      idempotencyKey: 'e2e_csrf_provider_callback_allowed'
    });
    expect(currentToken.status).toBe(200);
    expect(currentToken.claimId).toMatch(/^claim_/);
  } finally {
    await context.close();
  }
});

test('V5 world-grid CSRF token from one browser session cannot mutate the same wallet region in another session', async ({ browser }) => {
  const contextA = await browser.newContext({ extraHTTPHeaders: sharedWalletHeaders });
  const contextB = await browser.newContext({ extraHTTPHeaders: sharedWalletHeaders });
  try {
    const pageA = await contextA.newPage();
    await seedFoundersPlot(pageA);
    await openWorldGrid(pageA, 'v50,v51');

    const tokenA = await fetchCsrfToken(pageA);
    expect(tokenA.status).toBe(200);
    expect(tokenA.csrfToken).toMatch(/^wgcsrf_[a-f0-9]{48}$/);

    const pageB = await contextB.newPage();
    await openWorldGrid(pageB, 'v50,v51');

    const options = await claimOptions(pageB);
    expect(options.status).toBe(200);
    expect(options.options.length).toBeGreaterThan(0);
    const cellId = options.options[0].cellId;

    const crossSession = await planClaimWithToken(pageB, {
      cellId,
      csrfToken: tokenA.csrfToken,
      idempotencyKey: 'e2e_csrf_cross_session_denied'
    });
    expect(crossSession.status).toBe(403);
    expect(crossSession.errorCode).toBe('CSRF_INVALID');

    const tokenB = await fetchCsrfToken(pageB);
    expect(tokenB.status).toBe(200);
    expect(tokenB.csrfToken).toMatch(/^wgcsrf_[a-f0-9]{48}$/);
    const sameSession = await planClaimWithToken(pageB, {
      cellId,
      csrfToken: tokenB.csrfToken,
      idempotencyKey: 'e2e_csrf_same_session_allowed'
    });
    expect(sameSession.status).toBe(200);
    expect(sameSession.claimId).toMatch(/^claim_/);
  } finally {
    await contextA.close();
    await contextB.close();
  }
});
