const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('generic LLM proxy blocks loopback upstream hosts', async ({ page }) => {
  await page.goto('/');

  const result = await page.evaluate(async () => {
    const encodedBase = encodeURIComponent(window.location.origin);
    const res = await fetch(`/api/llm/proxy/${encodedBase}/api/health`, {
      method: 'GET',
      headers: {
        accept: 'application/json'
      }
    });
    let body = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    return {
      status: res.status,
      body
    };
  });

  expect(result.status).toBe(403);
  expect(result.body?.ok).toBe(false);
  expect(result.body?.error).toBe('UPSTREAM_HOST_BLOCKED');
});
