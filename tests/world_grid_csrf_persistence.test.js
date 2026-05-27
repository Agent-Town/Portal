const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  closeWorldGridCsrfStore,
  createWorldGridCsrfStore,
  issueWorldGridCsrfToken,
  requireWorldGridCsrfToken,
  tokenHash
} = require('../server/world_grid/csrf');

const repoRoot = path.join(__dirname, '..');
const probePath = path.join(__dirname, 'world_grid_csrf_restart_probe_child.js');

function requestForToken(token = '') {
  return {
    get(name = '') {
      return String(name).toLowerCase() === 'x-world-grid-csrf' ? token : '';
    },
    body: {}
  };
}

function runProbe(mode, sqlitePath, storePath, token = '') {
  const args = [probePath, mode, sqlitePath, storePath];
  if (token) args.push(token);
  const result = spawnSync(process.execPath, args, {
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
    const error = new Error(`world-grid CSRF restart probe failed: ${mode}`);
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

test('world-grid durable CSRF tokens persist hashed owner-bound rows and expire fail-closed', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-world-grid-csrf-store-'));
  const sqlitePath = path.join(dir, 'world-grid-csrf.sqlite');
  const ownerA = { ownerAccountId: 'acct_csrf_a' };
  const ownerB = { ownerAccountId: 'acct_csrf_b' };
  const env = {
    NODE_ENV: 'production',
    WORLD_GRID_CSRF_SQLITE_PATH: sqlitePath,
    WORLD_GRID_CSRF_TOKEN_TTL_MS: '1000'
  };
  try {
    const issued = issueWorldGridCsrfToken(ownerA, { nowMs: 1_779_984_000_000, env });
    closeWorldGridCsrfStore();
    const store = createWorldGridCsrfStore({ sqlitePath });
    const rows = store.listTokens();
    store.close();

    assert.match(issued.token, /^wgcsrf_[a-f0-9]{48}$/);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].ownerAccountId, ownerA.ownerAccountId);
    assert.equal(rows[0].tokenHash, tokenHash(issued.token));
    assert.equal(rows[0].tokenHash.includes(issued.token), false);
    assert.equal(rows[0].migrationVersion, 'world_grid_csrf_v1');
    assert.equal(rows[0].schemaVersion, 'agent-town.v5.world-grid.csrf.v1');
    assert.equal(
      requireWorldGridCsrfToken(requestForToken(issued.token), ownerA, { env, nowMs: 1_779_984_000_500 }),
      true
    );
    assert.throws(
      () => requireWorldGridCsrfToken(requestForToken(issued.token), ownerB, { env, nowMs: 1_779_984_000_500 }),
      /CSRF_INVALID/
    );
    assert.throws(
      () => requireWorldGridCsrfToken(requestForToken(issued.token), ownerA, { env, nowMs: 1_779_984_002_000 }),
      /CSRF_INVALID/
    );
  } finally {
    closeWorldGridCsrfStore();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('world-grid durable CSRF tokens authorize production mutating routes across separate Node process restarts', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-world-grid-csrf-routes-'));
  const sqlitePath = path.join(dir, 'world-grid-csrf.sqlite');
  const storePath = path.join(dir, 'portal-store.sqlite');
  try {
    const issued = runProbe('issue', sqlitePath, storePath);
    const used = runProbe('use', sqlitePath, storePath, issued.csrfToken);
    const store = createWorldGridCsrfStore({ sqlitePath });
    const rows = store.listTokens();
    store.close();

    assert.equal(issued.ok, true);
    assert.equal(issued.status, 200);
    assert.match(issued.csrfToken, /^wgcsrf_[a-f0-9]{48}$/);
    assert.equal(used.ok, true);
    assert.equal(used.status, 200);
    assert.match(used.claimId, /^claim_/);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].tokenHash, tokenHash(issued.csrfToken));
    assert.equal(JSON.stringify(rows).includes(issued.csrfToken), false);
  } finally {
    closeWorldGridCsrfStore();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
