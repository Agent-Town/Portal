const { test, expect } = require('@playwright/test');
const {
  getPortalState,
  getTableCount,
  resetPortalWebState,
} = require('./helpers/portal_web');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('REG-101: /api/registry/import is idempotent and blocks unsafe targets', async ({ request, playwright, baseURL }) => {
  await getPortalState(request);

  const firstResp = await request.post('/api/registry/import', {
    data: {
      url: 'https://github.com/openai/openai-codex',
      requestKind: 'site_origin',
      idempotencyKey: 'imp-registry-001'
    }
  });
  expect(firstResp.ok()).toBe(true);
  const first = await firstResp.json();

  const replayResp = await request.post('/api/registry/import', {
    data: {
      url: 'https://github.com/openai/openai-codex',
      requestKind: 'site_origin',
      idempotencyKey: 'imp-registry-001'
    }
  });
  expect(replayResp.ok()).toBe(true);
  const replay = await replayResp.json();

  expect(first.data?.importJobId).toBe(replay.data?.importJobId);
  expect(await getTableCount(request, 'web_import_jobs')).toBe(1);

  const blockedResp = await request.post('/api/registry/import', {
    data: {
      url: 'http://127.0.0.1:4173/private',
      requestKind: 'site_origin',
      idempotencyKey: 'imp-registry-blocked'
    }
  });
  expect(blockedResp.status()).toBe(400);
  const blocked = await blockedResp.json();
  expect(['UNSAFE_TARGET', 'PRIVATE_NETWORK_BLOCKED']).toContain(String(blocked.error?.code || ''));

  const anon = await playwright.request.newContext({ baseURL });
  const unauthorizedResp = await anon.post('/api/registry/import', {
    data: {
      url: 'https://github.com/openai/openai-codex',
      requestKind: 'site_origin',
      idempotencyKey: 'imp-registry-anon'
    }
  });
  expect(unauthorizedResp.status()).toBe(401);
  const unauthorized = await unauthorizedResp.json();
  expect(String(unauthorized.error?.code || '')).toBe('UNAUTHORIZED');
  await anon.dispose();
});
