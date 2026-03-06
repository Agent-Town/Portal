const { test, expect } = require('@playwright/test');
const os = require('os');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const { stripSensitiveHeadersOnRedirect } = require('../server/proxyHeaders');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  const resetResp = await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
  expect(resetResp.ok()).toBeTruthy();
});

function withStoreModule(storePath, callback) {
  const modulePath = require.resolve('../server/store');
  const previousStorePath = process.env.STORE_PATH;
  delete require.cache[modulePath];
  process.env.STORE_PATH = storePath;
  const storeModule = require('../server/store');
  try {
    return callback(storeModule);
  } finally {
    delete require.cache[modulePath];
    if (previousStorePath == null) delete process.env.STORE_PATH;
    else process.env.STORE_PATH = previousStorePath;
  }
}

test('proxy redirect handling strips secret headers on cross-origin hops', async () => {
  const forwarded = stripSensitiveHeadersOnRedirect('https://agent.town/source', 'https://evil.example/landing', {
    Authorization: 'Bearer secret',
    Cookie: 'et_session=sid',
    'x-house-auth': 'sig',
    'x-house-ts': '123',
    'x-wallet-recovery-key': 'wrk_deadbeef',
    'x-team-code-hint': 'TEAM-ABCD-EFGH',
    'x-api-key': 'secret-key',
    'api-key': 'secret-key-2',
    'x-auth-token': 'secret-token',
    'x-signing-key': 'secret-signing-key',
    'x-public-key': 'public-only',
    Accept: 'application/json'
  });
  expect(forwarded).toEqual({
    'x-public-key': 'public-only',
    Accept: 'application/json'
  });

  const sameOrigin = stripSensitiveHeadersOnRedirect('https://agent.town/source', 'https://agent.town/next', {
    Authorization: 'Bearer keep-me',
    'x-api-key': 'keep-me-too',
    Accept: 'application/json'
  });
  expect(sameOrigin.Authorization).toBe('Bearer keep-me');
  expect(sameOrigin['x-api-key']).toBe('keep-me-too');
  expect(sameOrigin.Accept).toBe('application/json');
});

test('draft tokenUri uses configured public origin instead of request host headers', async ({ request }, testInfo) => {
  const baseURL = String(testInfo.project.use.baseURL || '');
  const draftResp = await request.post('/api/erc8004/registration/draft', {
    headers: {
      host: 'evil.example',
      'x-forwarded-proto': 'https'
    },
    data: {
      context: { kind: 'house', houseId: 'house_guardrail_1' },
      entityType: 'house',
      name: 'Guardrail House',
      description: 'Token URI origin hardening',
      image: 'https://example.com/guardrail.png',
      services: [{ name: 'web', endpoint: 'https://example.com/guardrail' }]
    }
  });
  expect(draftResp.ok()).toBeTruthy();
  const draft = await draftResp.json();
  expect(draft.tokenUri.startsWith(`${baseURL}/api/erc8004/registration/`)).toBe(true);
});

test('dev/test CSP includes localhost and websocket connect-src allowances', async ({ request }) => {
  const resp = await request.get('/');
  expect(resp.ok()).toBeTruthy();
  const csp = resp.headers()['content-security-policy'] || '';
  expect(csp).toContain("connect-src 'self'");
  expect(csp).toContain('http://localhost:*');
  expect(csp).toContain('http://127.0.0.1:*');
  expect(csp).toContain('ws://localhost:*');
  expect(csp).toContain('wss://127.0.0.1:*');
});

test('malformed cookies do not crash normal request handling', async ({ request }) => {
  const resp = await request.get('/api/session', {
    headers: {
      cookie: 'et_session=%E0%A4%A; another=ok'
    }
  });
  expect(resp.ok()).toBeTruthy();
  const body = await resp.json();
  expect(body?.ok).toBe(true);
  expect(typeof body?.teamCode).toBe('string');
});

test('store rewrite preserves malformed rows instead of deleting them', async () => {
  const storePath = path.join(os.tmpdir(), `agent-town-raw-rows-${Date.now()}-${Math.random().toString(16).slice(2)}.sqlite`);

  withStoreModule(storePath, ({ readStore, writeStore }) => {
    writeStore({
      signups: [],
      shares: [{ id: 'sh_good', houseId: 'house_good', createdAt: new Date().toISOString() }],
      publicTeams: [],
      houses: [],
      claims: [],
      reservations: [],
      milestones: [],
      rewardsLedger: [],
      anchors: [],
      inbox: [],
      erc8004OptOut: [],
      erc8004Registrations: []
    });

    const db = new DatabaseSync(storePath);
    db.prepare('INSERT INTO shares (pos, data) VALUES (?, ?)').run(99, '{"id":"sh_broken"');

    const store = readStore();
    expect((store.shares || []).map((row) => row.id)).toContain('sh_good');
    expect((store.shares || []).map((row) => row.id)).not.toContain('sh_broken');

    store.signups.push({ id: 'sg_written', createdAt: new Date().toISOString() });
    writeStore(store);

    const rows = db.prepare('SELECT data FROM shares ORDER BY pos ASC').all().map((row) => row.data);
    expect(rows).toContain('{"id":"sh_broken"');
  });
});
