const { test, expect } = require('@playwright/test');
const { enterHatch } = require('./helpers/phase2');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('/start returns valid authorizeUrl with openrouter.ai/auth and PKCE params', async ({ page, request }) => {
  await enterHatch(page, 'signin');

  const result = await page.evaluate(async () => {
    const resp = await fetch('/api/agent/lite/llm/oauth/openrouter/start', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({})
    });
    return resp.json();
  });

  expect(result.ok).toBe(true);
  expect(result.attemptId).toBeTruthy();
  expect(result.state).toBeTruthy();
  expect(result.authorizeUrl).toContain('openrouter.ai/auth');
  expect(result.authorizeUrl).toContain('code_challenge=');
  expect(result.authorizeUrl).toContain('code_challenge_method=S256');
  expect(result.authorizeUrl).toContain(`state=${result.state}`);
  expect(result.expiresAtMs).toBeGreaterThan(Date.now());
});

test('/callback with valid state stores code and returns postMessage HTML', async ({ page, request }) => {
  await enterHatch(page, 'signin');

  const startResult = await page.evaluate(async () => {
    const resp = await fetch('/api/agent/lite/llm/oauth/openrouter/start', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({})
    });
    return resp.json();
  });

  const callbackResp = await request.get(
    `/api/agent/lite/llm/oauth/openrouter/callback?state=${startResult.state}&code=test-code-abc`
  );
  expect(callbackResp.ok()).toBeTruthy();
  const html = await callbackResp.text();
  expect(html).toContain('agenttown:openrouter-oauth-callback');
  expect(html).toContain('Authentication successful');
  expect(html).toContain('postMessage');
});

test('/callback with unknown state returns 400', async ({ request }) => {
  const callbackResp = await request.get(
    '/api/agent/lite/llm/oauth/openrouter/callback?state=bogus-state&code=test-code-abc'
  );
  expect(callbackResp.status()).toBe(400);
  const html = await callbackResp.text();
  expect(html).toContain('UNKNOWN_STATE');
});

test('/exchange after callback returns credential.apiKey', async ({ page, request }) => {
  await enterHatch(page, 'signin');

  const startResult = await page.evaluate(async () => {
    const resp = await fetch('/api/agent/lite/llm/oauth/openrouter/start', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({})
    });
    return resp.json();
  });

  // Simulate callback hitting the server
  await request.get(
    `/api/agent/lite/llm/oauth/openrouter/callback?state=${startResult.state}&code=test-code-xyz`
  );

  const exchangeResult = await page.evaluate(async (attemptId) => {
    const resp = await fetch('/api/agent/lite/llm/oauth/openrouter/exchange', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ attemptId })
    });
    return resp.json();
  }, startResult.attemptId);

  expect(exchangeResult.ok).toBe(true);
  expect(exchangeResult.credential).toBeTruthy();
  expect(exchangeResult.credential.apiKey).toContain('sk-or-test-key-');
  expect(exchangeResult.credential.provider).toBe('openrouter');
  expect(exchangeResult.attempt.status).toBe('exchanged');
});

test('/exchange before callback returns 409 CODE_PENDING', async ({ page }) => {
  await enterHatch(page, 'signin');

  const startResult = await page.evaluate(async () => {
    const resp = await fetch('/api/agent/lite/llm/oauth/openrouter/start', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({})
    });
    return resp.json();
  });

  const exchangeResult = await page.evaluate(async (attemptId) => {
    const resp = await fetch('/api/agent/lite/llm/oauth/openrouter/exchange', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ attemptId })
    });
    return { status: resp.status, body: await resp.json() };
  }, startResult.attemptId);

  expect(exchangeResult.status).toBe(409);
  expect(exchangeResult.body.error).toBe('CODE_PENDING');
});

test('state reset via /__test__/reset clears attempts', async ({ page, request }) => {
  await enterHatch(page, 'signin');

  const startResult = await page.evaluate(async () => {
    const resp = await fetch('/api/agent/lite/llm/oauth/openrouter/start', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({})
    });
    return resp.json();
  });

  // Reset state
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });

  // Re-enter hatch to get a new session
  await enterHatch(page, 'signin');

  // Status should return 404 because the attempt was cleared
  const statusResult = await page.evaluate(async (attemptId) => {
    const resp = await fetch(`/api/agent/lite/llm/oauth/openrouter/status?attemptId=${attemptId}`, {
      credentials: 'include'
    });
    return { status: resp.status, body: await resp.json() };
  }, startResult.attemptId);

  expect(statusResult.status).toBe(404);
  expect(statusResult.body.error).toBe('OAUTH_ATTEMPT_NOT_FOUND');
});
