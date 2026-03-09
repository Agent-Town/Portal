const { test, expect } = require('@playwright/test');
const {
  getPortalState,
  getTableCount,
  resetPortalWebState,
} = require('./helpers/portal_web');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M16.2: /api/web/import enforces auth, idempotency, and unsafe-target blocking', async ({ request, playwright, baseURL }) => {
  await getPortalState(request);

  const firstResp = await request.post('/api/web/import', {
    data: {
      url: 'https://example.com/',
      requestKind: 'site_origin',
      parseFallbackAllowed: true,
      sourceHints: {
        expectedObjectKind: 'website'
      },
      idempotencyKey: 'imp-web-001'
    }
  });
  expect(firstResp.ok()).toBe(true);
  const first = await firstResp.json();

  const replayResp = await request.post('/api/web/import', {
    data: {
      url: 'https://example.com/',
      requestKind: 'site_origin',
      parseFallbackAllowed: true,
      sourceHints: {
        expectedObjectKind: 'website'
      },
      idempotencyKey: 'imp-web-001'
    }
  });
  expect(replayResp.ok()).toBe(true);
  const replay = await replayResp.json();

  expect(first.data?.importJobId).toBe(replay.data?.importJobId);
  expect(await getTableCount(request, 'web_import_jobs')).toBe(1);

  const blockedResp = await request.post('/api/web/import', {
    data: {
      url: 'http://127.0.0.1:4173/private',
      requestKind: 'site_origin',
      idempotencyKey: 'imp-web-blocked'
    }
  });
  expect(blockedResp.status()).toBe(400);
  const blocked = await blockedResp.json();
  expect(['UNSAFE_TARGET', 'PRIVATE_NETWORK_BLOCKED']).toContain(String(blocked.error?.code || ''));

  const anon = await playwright.request.newContext({ baseURL });
  const unauthorizedResp = await anon.post('/api/web/import', {
    data: {
      url: 'https://example.com/',
      requestKind: 'site_origin',
      idempotencyKey: 'imp-web-anon'
    }
  });
  expect(unauthorizedResp.status()).toBe(401);
  const unauthorized = await unauthorizedResp.json();
  expect(String(unauthorized.error?.code || '')).toBe('UNAUTHORIZED');
  await anon.dispose();
});
