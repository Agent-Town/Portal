const { test, expect } = require('@playwright/test');
const { openWorldGrid, resetWorldGrid, seedFoundersPlot } = require('./helpers/world_grid');

const sharedWalletHeaders = {
  'x-wallet-chain': 'solana',
  'x-wallet-address': 'So1anaMockToken3333333333333333333333333333'
};

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

test.beforeEach(async ({ request }) => {
  await resetWorldGrid(request);
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
