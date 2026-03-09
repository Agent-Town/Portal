const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M16.1: /api/web/resolve returns stable supported, unsupported, and blocked envelopes', async ({ request }) => {
  const supportedResp = await request.post('/api/web/resolve', {
    data: {
      url: 'https://github.com/openai/openai-codex/issues/1',
      preferredMode: 'auto',
      sourceHints: { expectedPageClass: 'issue_detail' }
    }
  });
  expect(supportedResp.ok()).toBe(true);
  const supported = await supportedResp.json();
  expect(Object.keys(supported).sort()).toEqual(['data', 'meta', 'ok']);
  expect(supported.ok).toBe(true);
  expect(supported.data?.resolutionState).toBe('supported');
  expect(supported.data?.integration?.integrationRegistryId).toBe('wi_github_issue_reply');
  expect(String(supported.meta?.requestId || '')).not.toBe('');

  const unsupportedResp = await request.post('/api/web/resolve', {
    data: {
      url: 'https://example.invalid/'
    }
  });
  expect(unsupportedResp.ok()).toBe(true);
  const unsupported = await unsupportedResp.json();
  expect(Object.keys(unsupported).sort()).toEqual(['data', 'meta', 'ok']);
  expect(unsupported.data?.resolutionState).toBe('unsupported');
  expect(unsupported.data?.fallback?.reasonCode).toBe('WEB_UNSUPPORTED_SITE');
  expect(unsupported.data?.fallback?.importAllowed).toBe(true);

  const blockedResp = await request.post('/api/web/resolve', {
    data: {
      url: 'http://127.0.0.1:4173/private'
    }
  });
  expect(blockedResp.status()).toBe(400);
  const blocked = await blockedResp.json();
  expect(Object.keys(blocked).sort()).toEqual(['error', 'meta', 'ok']);
  expect(blocked.ok).toBe(false);
  expect(['UNSAFE_TARGET', 'PRIVATE_NETWORK_BLOCKED']).toContain(String(blocked.error?.code || ''));
  expect(String(blocked.meta?.requestId || '')).not.toBe('');
});
