const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const repoRoot = path.join(__dirname, '..');
const probePath = path.join(__dirname, 'world_grid_public_presence_restart_probe_child.js');

function runProbe(mode, publicPresencePath, storePath, publicTownId = '') {
  const args = [probePath, mode, publicPresencePath, storePath];
  if (publicTownId) args.push(publicTownId);
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
    const error = new Error(`world-grid public presence restart probe failed: ${mode}`);
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

test('world-grid durable public presence and follows survive restarts and opt-out removes public rows', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-world-grid-public-presence-'));
  const publicPresencePath = path.join(dir, 'world-grid-public-presence.sqlite');
  const storePath = path.join(dir, 'portal-store.sqlite');
  try {
    const seeded = runProbe('seed', publicPresencePath, storePath);
    const reopened = runProbe('read', publicPresencePath, storePath, seeded.publicTownId);
    const followedAgain = runProbe('follow-again', publicPresencePath, storePath, seeded.publicTownId);
    const optedOut = runProbe('opt-out', publicPresencePath, storePath, seeded.publicTownId);
    const reopenedAfterOptOut = runProbe('read-after-opt-out', publicPresencePath, storePath, seeded.publicTownId);

    assert.equal(seeded.ok, true);
    assert.equal(seeded.mutationStatus, 200);
    assert.equal(seeded.followStatus, 200);
    assert.match(seeded.publicTownId, /^public_town_/);
    assert.equal(seeded.listCount, 1);
    assert.equal(seeded.followCount, 1);
    assert.equal(seeded.counts.presence, 1);
    assert.equal(seeded.counts.follows, 1);
    assert.equal(seeded.containsPrivateText, false);
    assert.deepEqual(seeded.metadata, [{
      migrationVersion: 'world_grid_public_presence_v1',
      schemaVersion: 'agent-town.v5.world-grid.public-presence.v1',
      count: 2
    }]);

    assert.equal(reopened.ok, true);
    assert.equal(reopened.mutationStatus, 0);
    assert.equal(reopened.publicTownId, seeded.publicTownId);
    assert.equal(reopened.listStatus, 200);
    assert.equal(reopened.lookupStatus, 200);
    assert.equal(reopened.summarizeStatus, 200);
    assert.equal(reopened.listCount, 1);
    assert.equal(reopened.counts.presence, 1);
    assert.equal(reopened.counts.follows, 1);
    assert.equal(reopened.containsPrivateText, false);

    assert.equal(followedAgain.ok, true);
    assert.equal(followedAgain.followStatus, 200);
    assert.equal(followedAgain.followCount, 1);
    assert.equal(followedAgain.counts.follows, 1);

    assert.equal(optedOut.ok, true);
    assert.equal(optedOut.mutationStatus, 200);
    assert.equal(optedOut.counts.presence, 0);
    assert.equal(optedOut.counts.follows, 0);
    assert.equal(optedOut.listCount, 0);
    assert.equal(optedOut.lookupStatus, 404);
    assert.equal(optedOut.summarizeStatus, 404);

    assert.equal(reopenedAfterOptOut.ok, true);
    assert.equal(reopenedAfterOptOut.counts.presence, 0);
    assert.equal(reopenedAfterOptOut.counts.follows, 0);
    assert.equal(reopenedAfterOptOut.listCount, 0);
    assert.equal(reopenedAfterOptOut.lookupStatus, 404);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
