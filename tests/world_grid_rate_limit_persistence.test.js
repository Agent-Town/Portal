const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  closeWorldGridRateLimitStore,
  createWorldGridRateLimitStore,
  consumeWorldGridMutationRateLimit,
  rateLimitIdentityKey
} = require('../server/world_grid/rate_limit');
const { normalizeOwnerIdentity } = require('../server/world_grid/region');

const repoRoot = path.join(__dirname, '..');
const probePath = path.join(__dirname, 'world_grid_rate_limit_restart_probe_child.js');

function runProbe(mode, sqlitePath, storePath) {
  const result = spawnSync(process.execPath, [probePath, mode, sqlitePath, storePath], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      FORCE_COLOR: '0'
    }
  });
  const lines = result.stdout.trim().split('\n').filter(Boolean);
  const parsed = JSON.parse(lines[lines.length - 1] || '{}');
  if (result.status !== 0) {
    const error = new Error(`world-grid rate-limit restart probe failed: ${mode}`);
    error.details = {
      status: result.status,
      stdout: result.stdout,
      stderr: result.stderr,
      parsed
    };
    throw error;
  }
  return parsed;
}

function mockRequest(headers = {}) {
  const normalized = Object.fromEntries(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]));
  return {
    headers: normalized,
    get(name) {
      return normalized[String(name || '').toLowerCase()] || '';
    },
    ip: '127.0.0.1'
  };
}

test('world-grid durable rate-limit counters persist owner and surface windows across store reopen', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-world-grid-rate-limit-store-'));
  const sqlitePath = path.join(dir, 'world-grid-rate-limit.sqlite');
  const owner = normalizeOwnerIdentity({ pairId: 'session:rate-limit-store' });
  try {
    const env = {
      WORLD_GRID_RATE_LIMIT_SQLITE_PATH: sqlitePath,
      WORLD_GRID_MUTATION_RATE_LIMIT_MAX: '2',
      WORLD_GRID_MUTATION_RATE_LIMIT_WINDOW_MS: '60000'
    };
    const first = consumeWorldGridMutationRateLimit({
      owner,
      surface: '/api/world/territory/plan-claim',
      nowMs: 1_779_984_000_000,
      env
    });
    const second = consumeWorldGridMutationRateLimit({
      owner,
      surface: '/api/world/territory/plan-claim',
      nowMs: 1_779_984_000_100,
      env
    });
    const otherSurface = consumeWorldGridMutationRateLimit({
      owner,
      surface: '/api/world/services/request-advice',
      nowMs: 1_779_984_000_200,
      env
    });
    const store = createWorldGridRateLimitStore({ sqlitePath });
    const buckets = store.listBuckets();
    store.close();
    const third = consumeWorldGridMutationRateLimit({
      owner,
      surface: '/api/world/territory/plan-claim',
      nowMs: 1_779_984_000_300,
      env
    });
    const reset = consumeWorldGridMutationRateLimit({
      owner,
      surface: '/api/world/territory/plan-claim',
      nowMs: 1_779_984_070_000,
      env
    });

    assert.equal(first.allowed, true);
    assert.equal(first.remaining, 1);
    assert.equal(second.allowed, true);
    assert.equal(second.remaining, 0);
    assert.equal(otherSurface.allowed, true);
    assert.equal(otherSurface.remaining, 1);
    assert.equal(buckets.length, 2);
    assert.equal(buckets.every((bucket) => bucket.migrationVersion === 'world_grid_rate_limit_v1'), true);
    assert.equal(buckets.every((bucket) => bucket.schemaVersion === 'agent-town.v5.world-grid.rate-limit.v1'), true);
    assert.equal(third.allowed, false);
    assert.equal(third.remaining, 0);
    assert.equal(reset.allowed, true);
    assert.equal(reset.remaining, 1);
  } finally {
    closeWorldGridRateLimitStore();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('world-grid risk-aware rate-limit identity hashes session ip and risk without leaking raw values', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-world-grid-rate-limit-risk-'));
  const sqlitePath = path.join(dir, 'world-grid-rate-limit.sqlite');
  const owner = normalizeOwnerIdentity({
    pairId: 'session:rate-limit-risk-owner',
    sessionId: 'session-risk-alpha'
  });
  const env = {
    WORLD_GRID_RATE_LIMIT_SQLITE_PATH: sqlitePath,
    WORLD_GRID_RATE_LIMIT_IDENTITY_MODE: 'owner_session_ip_risk',
    WORLD_GRID_MUTATION_RATE_LIMIT_MAX: '1',
    WORLD_GRID_MUTATION_RATE_LIMIT_WINDOW_MS: '60000'
  };
  const baseRequest = mockRequest({
    'x-forwarded-for': '203.0.113.10',
    'x-world-grid-risk': 'medium'
  });
  const otherIpRequest = mockRequest({
    'x-forwarded-for': '203.0.113.11',
    'x-world-grid-risk': 'medium'
  });
  const otherRiskRequest = mockRequest({
    'x-forwarded-for': '203.0.113.10',
    'x-world-grid-risk': 'elevated'
  });
  try {
    const identityKey = rateLimitIdentityKey({ owner, req: baseRequest, env });
    const first = consumeWorldGridMutationRateLimit({
      owner,
      surface: '/api/world/territory/plan-claim',
      nowMs: 1_779_984_000_000,
      env,
      req: baseRequest
    });
    const secondSameIdentity = consumeWorldGridMutationRateLimit({
      owner,
      surface: '/api/world/territory/plan-claim',
      nowMs: 1_779_984_000_100,
      env,
      req: baseRequest
    });
    const otherIp = consumeWorldGridMutationRateLimit({
      owner,
      surface: '/api/world/territory/plan-claim',
      nowMs: 1_779_984_000_200,
      env,
      req: otherIpRequest
    });
    const otherRisk = consumeWorldGridMutationRateLimit({
      owner,
      surface: '/api/world/territory/plan-claim',
      nowMs: 1_779_984_000_300,
      env,
      req: otherRiskRequest
    });
    const store = createWorldGridRateLimitStore({ sqlitePath });
    const buckets = store.listBuckets();
    store.close();

    assert.match(identityKey, /^owner_[a-f0-9]{16}\|session:[a-f0-9]{24}\|ip:[a-f0-9]{24}\|risk:medium$/);
    assert.equal(identityKey.includes('session-risk-alpha'), false);
    assert.equal(identityKey.includes('203.0.113.10'), false);
    assert.equal(first.allowed, true);
    assert.equal(first.remaining, 0);
    assert.equal(secondSameIdentity.allowed, false);
    assert.equal(otherIp.allowed, true);
    assert.equal(otherRisk.allowed, true);
    assert.equal(buckets.length, 3);
    assert.equal(buckets.some((bucket) => bucket.ownerAccountId.includes('203.0.113.10')), false);
    assert.equal(buckets.some((bucket) => bucket.ownerAccountId.includes('session-risk-alpha')), false);
    assert.equal(buckets.every((bucket) => bucket.ownerAccountId.includes('|session:')), true);
    assert.equal(buckets.every((bucket) => bucket.ownerAccountId.includes('|ip:')), true);
  } finally {
    closeWorldGridRateLimitStore();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('world-grid durable rate-limit counters block mutating routes across separate Node process restarts', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-world-grid-rate-limit-routes-'));
  const sqlitePath = path.join(dir, 'world-grid-rate-limit.sqlite');
  const storePath = path.join(dir, 'portal-store.sqlite');
  try {
    const seeded = runProbe('seed', sqlitePath, storePath);
    const second = runProbe('second', sqlitePath, storePath);
    const third = runProbe('third', sqlitePath, storePath);
    const store = createWorldGridRateLimitStore({ sqlitePath });
    const buckets = store.listBuckets();
    store.close();

    assert.equal(seeded.ok, true);
    assert.equal(seeded.status, 200);
    assert.equal(seeded.limit, '2');
    assert.equal(seeded.remaining, '1');
    assert.equal(second.ok, true);
    assert.equal(second.status, 200);
    assert.equal(second.remaining, '0');
    assert.equal(third.ok, true);
    assert.equal(third.status, 429);
    assert.equal(third.errorCode, 'RATE_LIMITED');
    assert.equal(Number(third.retryAfter) >= 1, true);
    assert.equal(buckets.length, 1);
    assert.equal(buckets[0].surface, '/api/world/territory/plan-claim');
    assert.equal(buckets[0].count, 3);
  } finally {
    closeWorldGridRateLimitStore();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
