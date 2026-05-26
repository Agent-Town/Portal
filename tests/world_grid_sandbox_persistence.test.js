const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const repoRoot = path.join(__dirname, '..');
const probePath = path.join(__dirname, 'world_grid_sandbox_restart_probe_child.js');

function runProbe(mode, sandboxPath, storePath) {
  const result = spawnSync(process.execPath, [probePath, mode, sandboxPath, storePath], {
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
    const error = new Error(`world-grid sandbox restart probe failed: ${mode}`);
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

function assertSandboxMetadata(row, expectedCount) {
  assert.deepEqual(row.metadata, [{
    migrationVersion: 'world_grid_sandbox_v1',
    schemaVersion: 'agent-town.v5.world-grid.sandbox.v1',
    count: expectedCount
  }]);
}

test('world-grid durable sandbox participants, actions, snapshots, and cells survive restarts', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-world-grid-sandbox-'));
  const sandboxPath = path.join(dir, 'world-grid-sandbox.sqlite');
  const storePath = path.join(dir, 'portal-store.sqlite');
  try {
    const seeded = runProbe('seed', sandboxPath, storePath);
    const reopened = runProbe('read', sandboxPath, storePath);
    const rejected = runProbe('reject-forbidden', sandboxPath, storePath);
    const rolledBack = runProbe('rollback-lantern', sandboxPath, storePath);
    const left = runProbe('leave', sandboxPath, storePath);
    const reopenedAfterLeave = runProbe('read-after-leave', sandboxPath, storePath);

    assert.equal(seeded.ok, true);
    assert.deepEqual(seeded.responseStatuses, [200, 200, 200, 200, 200]);
    assert.deepEqual(seeded.responseModerationStatuses, ['auto-approved', 'rejected', 'auto-approved']);
    assert.equal(seeded.responseRestored, true);
    assert.equal(seeded.participantPresent, true);
    assert.equal(seeded.participantCount, 1);
    assert.equal(seeded.propCount, 1);
    assert.equal(seeded.durablePropCount, 1);
    assert.equal(seeded.snapshotCount, 2);
    assert.equal(seeded.counts.participants, 1);
    assert.equal(seeded.counts.actions, 3);
    assert.equal(seeded.counts.snapshots, 2);
    assert.equal(seeded.counts.cells, 4);
    assert.equal(seeded.actionSummary.filter((action) => action.status === 'rejected').length, 1);
    assert.equal(seeded.actionSummary.filter((action) => action.rolledBack).length, 1);
    assert.equal(seeded.inventory.coin, 20);
    assert.equal(seeded.leakedOwnerId, false);
    assertSandboxMetadata(seeded, 10);

    assert.equal(reopened.ok, true);
    assert.equal(reopened.participantPresent, true);
    assert.equal(reopened.participantCount, 1);
    assert.equal(reopened.propCount, 1);
    assert.equal(reopened.durablePropCount, 1);
    assert.equal(reopened.counts.participants, 1);
    assert.equal(reopened.counts.actions, 3);
    assert.equal(reopened.counts.snapshots, 2);
    assert.equal(reopened.counts.cells, 4);
    assert.equal(reopened.actionSummary.filter((action) => action.rolledBack).length, 1);
    assert.equal(reopened.inventory.coin, 20);
    assert.equal(reopened.leakedOwnerId, false);
    assertSandboxMetadata(reopened, 10);

    assert.equal(rejected.ok, true);
    assert.deepEqual(rejected.responseModerationStatuses, ['rejected']);
    assert.equal(rejected.participantPresent, true);
    assert.equal(rejected.propCount, 1);
    assert.equal(rejected.durablePropCount, 1);
    assert.equal(rejected.counts.participants, 1);
    assert.equal(rejected.counts.actions, 4);
    assert.equal(rejected.actionSummary.filter((action) => action.status === 'rejected').length, 2);
    assert.equal(rejected.inventory.coin, 20);
    assertSandboxMetadata(rejected, 11);

    assert.equal(rolledBack.ok, true);
    assert.equal(rolledBack.responseRestored, true);
    assert.equal(rolledBack.participantPresent, true);
    assert.equal(rolledBack.propCount, 0);
    assert.equal(rolledBack.durablePropCount, 0);
    assert.equal(rolledBack.counts.participants, 1);
    assert.equal(rolledBack.counts.actions, 4);
    assert.equal(rolledBack.counts.snapshots, 2);
    assert.equal(rolledBack.actionSummary.filter((action) => action.rolledBack).length, 2);
    assert.equal(rolledBack.inventory.coin, 20);
    assertSandboxMetadata(rolledBack, 11);

    assert.equal(left.ok, true);
    assert.equal(left.responseRemoved, true);
    assert.equal(left.participantPresent, false);
    assert.equal(left.participantCount, 0);
    assert.equal(left.propCount, 0);
    assert.equal(left.counts.participants, 0);
    assert.equal(left.counts.actions, 4);
    assert.equal(left.counts.snapshots, 2);
    assert.equal(left.counts.cells, 4);
    assert.equal(left.inventory.coin, 20);
    assertSandboxMetadata(left, 10);

    assert.equal(reopenedAfterLeave.ok, true);
    assert.equal(reopenedAfterLeave.participantPresent, false);
    assert.equal(reopenedAfterLeave.participantCount, 0);
    assert.equal(reopenedAfterLeave.propCount, 0);
    assert.equal(reopenedAfterLeave.durablePropCount, 0);
    assert.equal(reopenedAfterLeave.counts.participants, 0);
    assert.equal(reopenedAfterLeave.counts.actions, 4);
    assert.equal(reopenedAfterLeave.counts.snapshots, 2);
    assert.equal(reopenedAfterLeave.counts.cells, 4);
    assert.equal(reopenedAfterLeave.inventory.coin, 20);
    assert.equal(reopenedAfterLeave.leakedOwnerId, false);
    assertSandboxMetadata(reopenedAfterLeave, 10);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
