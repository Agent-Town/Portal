const { test, expect } = require('@playwright/test');

test('same-origin privy transaction status fetch is not blocked by origin guard', async ({ page }) => {
  await page.goto('/app');

  const out = await page.evaluate(async () => {
    const sessionResp = await fetch('/api/session', {
      credentials: 'include',
      cache: 'no-store'
    });
    if (!sessionResp.ok) {
      return { sessionStatus: sessionResp.status, status: 0, body: null };
    }
    const resp = await fetch('/api/privy/transactions/test-transaction-id', {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store'
    });
    const body = await resp.json().catch(() => ({}));
    return { sessionStatus: sessionResp.status, status: resp.status, body };
  });

  expect(out.sessionStatus).toBe(200);
  expect(out.status).not.toBe(403);
  expect(out.body?.error).not.toBe('FORBIDDEN_ORIGIN');
  // In e2e config Privy is disabled, so successful origin checks should
  // proceed to endpoint logic and return PRIVY_DISABLED.
  expect(out.status).toBe(503);
  expect(out.body?.error).toBe('PRIVY_DISABLED');
});
