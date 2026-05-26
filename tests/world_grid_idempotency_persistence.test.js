const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const repoRoot = path.join(__dirname, '..');
const probePath = path.join(__dirname, 'world_grid_idempotency_restart_probe_child.js');

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
    const error = new Error(`world-grid idempotency restart probe failed: ${mode}`);
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

test('world-grid durable idempotency rows replay after separate Node process restart without remutating prototype state', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-world-grid-idempotency-'));
  const sqlitePath = path.join(dir, 'world-grid-idempotency.sqlite');
  const storePath = path.join(dir, 'portal-store.sqlite');
  try {
    const seeded = runProbe('seed', sqlitePath, storePath);
    const replayed = runProbe('replay', sqlitePath, storePath);
    const conflicted = runProbe('conflict', sqlitePath, storePath);

    assert.equal(seeded.ok, true);
    assert.equal(seeded.status, 200);
    assert.equal(seeded.replayHeader, '');
    assert.match(seeded.claimId, /^claim_/);
    assert.equal(seeded.claimCount, 1);
    assert.equal(seeded.durableCount, 1);

    assert.equal(replayed.ok, true);
    assert.equal(replayed.status, 200);
    assert.equal(replayed.replayHeader, '1');
    assert.equal(replayed.claimId, seeded.claimId);
    assert.equal(replayed.claimCount, 0);
    assert.equal(replayed.durableCount, 1);

    assert.equal(conflicted.ok, true);
    assert.equal(conflicted.status, 409);
    assert.equal(conflicted.errorCode, 'IDEMPOTENCY_CONFLICT');
    assert.equal(conflicted.claimCount, 0);
    assert.equal(conflicted.durableCount, 1);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
