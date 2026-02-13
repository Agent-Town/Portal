const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

async function resetClientStorage(page) {
  await page.goto('/test_blank.html');
  await page.evaluate(async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore
    }
    await new Promise((resolve) => {
      const req = indexedDB.deleteDatabase('openclaw-lite');
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => resolve();
    });
  });
}

async function approveNextOriginGrant(page) {
  const approvalNode = page.locator('[data-testid="approvals"] .kv', { hasText: /origin grant/i }).first();
  await expect(approvalNode).toBeVisible();
  await approvalNode.getByRole('button', { name: 'Approve' }).click();
}

async function approveNextHttpMutation(page) {
  const approvalNode = page.locator('[data-testid="approvals"] .kv', { hasText: /http (post|put|patch|delete)/i }).first();
  await expect(approvalNode).toBeVisible();
  await approvalNode.getByRole('button', { name: 'Approve' }).click();
}

test.describe('OpenClaw Lite: http_request tool (M12)', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
  });

  test('supports curl-like request/response flow with policy gates', async ({ page }) => {
    await resetClientStorage(page);
    await page.goto('/lite');

    // Clear deterministic boot approval.
    const bootApprovals = page.getByTestId('approvals').getByRole('button', { name: 'Approve' });
    if (await bootApprovals.count()) {
      await bootApprovals.first().click();
    }

    const pageOrigin = new URL(page.url()).origin;

    // JSON POST roundtrip + method-level approval.
    const postPromise = page.evaluate(async ({ origin }) => {
      return await window.__openclawLiteTest.httpRequest({
        method: 'POST',
        url: `${origin}/__test__/http/echo-json`,
        headers: { 'content-type': 'application/json' },
        body: { kind: 'json', json: { hello: 'world', n: 7 } },
        followRedirects: true,
        maxBytes: 65536,
      });
    }, { origin: pageOrigin });
    await approveNextHttpMutation(page);
    const postResult = await postPromise;
    expect(postResult.ok).toBeTruthy();
    expect(postResult.data.status).toBe(200);
    expect(postResult.data.bodyJson).toBeTruthy();
    expect(postResult.data.bodyJson.echo).toEqual({ hello: 'world', n: 7 });

    // Cross-origin redirect drops Authorization header.
    const crossUrl = 'https://fixture.openclaw.test/redirect/auth-header';
    const grantPromise = page.evaluate(async ({ url }) => {
      return await window.__openclawLiteTest.requestOriginGrant({
        url,
        capability: 'http_request',
        scope: 'session',
        methods: ['GET'],
      });
    }, { url: crossUrl });
    await approveNextOriginGrant(page);
    const grant = await grantPromise;
    expect(grant.ok).toBeTruthy();

    const redirectResult = await page.evaluate(async ({ url }) => {
      return await window.__openclawLiteTest.httpRequest({
        method: 'GET',
        url,
        headers: { authorization: 'Bearer super-secret' },
        followRedirects: true,
        responseMode: 'json',
      });
    }, { url: crossUrl });
    expect(redirectResult.ok).toBeTruthy();
    expect(redirectResult.data.finalUrl).toBe('https://fixture-two.openclaw.test/echo/auth-header');
    expect(redirectResult.data.bodyJson).toBeTruthy();
    expect(redirectResult.data.bodyJson.receivedAuthorization).toBeFalsy();

    // Response truncation flag.
    const truncResult = await page.evaluate(async ({ origin }) => {
      return await window.__openclawLiteTest.httpRequest({
        method: 'GET',
        url: `${origin}/__test__/http/large-text`,
        maxBytes: 24,
        responseMode: 'text',
      });
    }, { origin: pageOrigin });
    expect(truncResult.ok).toBeTruthy();
    expect(truncResult.data.truncated).toBeTruthy();
    expect(truncResult.data.bodyText.length).toBeLessThanOrEqual(24);

    // Payload limit (deterministic error).
    const oversized = await page.evaluate(async ({ origin }) => {
      return await window.__openclawLiteTest.httpRequest({
        method: 'POST',
        url: `${origin}/__test__/http/echo-json`,
        headers: { 'content-type': 'text/plain' },
        body: { kind: 'text', text: 'x'.repeat(70_000) },
      });
    }, { origin: pageOrigin });
    expect(oversized.ok).toBeFalsy();
    expect(oversized.error.code).toBe('SIZE_LIMIT');

    // Rate limit (deterministic error).
    const rateOrigin = 'https://fixture-rate.openclaw.test/ping';
    const rateGrantPromise = page.evaluate(async ({ url }) => {
      return await window.__openclawLiteTest.requestOriginGrant({
        url,
        capability: 'http_request',
        scope: 'session',
        methods: ['GET'],
      });
    }, { url: rateOrigin });
    await approveNextOriginGrant(page);
    const rateGrant = await rateGrantPromise;
    expect(rateGrant.ok).toBeTruthy();

    const r1 = await page.evaluate(async ({ url }) => window.__openclawLiteTest.httpRequest({ method: 'GET', url }), { url: rateOrigin });
    const r2 = await page.evaluate(async ({ url }) => window.__openclawLiteTest.httpRequest({ method: 'GET', url }), { url: rateOrigin });
    const r3 = await page.evaluate(async ({ url }) => window.__openclawLiteTest.httpRequest({ method: 'GET', url }), { url: rateOrigin });
    expect(r1.ok).toBeTruthy();
    expect(r2.ok).toBeTruthy();
    expect(r3.ok).toBeFalsy();
    expect(r3.error.code).toBe('RATE_LIMIT');
  });
});
