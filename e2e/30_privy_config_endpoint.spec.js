const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('privy config endpoint returns public config only', async ({ request }) => {
  const resp = await request.get('/api/privy/config');
  expect(resp.ok()).toBeTruthy();

  const body = await resp.json();
  expect(body?.ok).toBe(true);
  expect(typeof body?.enabled).toBe('boolean');

  if (body.enabled) {
    expect(body.config).toBeTruthy();
    expect(typeof body.config.appId).toBe('string');
    expect(body.config.appId.length).toBeGreaterThan(0);
  } else {
    expect(body.config).toBeNull();
  }

  expect(body?.appSecret).toBeUndefined();
  expect(body?.privyAppSecret).toBeUndefined();
  if (body.config && typeof body.config === 'object') {
    expect(body.config.appSecret).toBeUndefined();
    expect(body.config.privyAppSecret).toBeUndefined();
    expect(body.config.PRIVY_APP_SECRET).toBeUndefined();
  }
});
