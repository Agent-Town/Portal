const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const repoRoot = path.join(__dirname, '..');
const probePath = path.join(__dirname, 'world_grid_events_restart_probe_child.js');

function runProbe(mode, eventsPath, storePath) {
  const result = spawnSync(process.execPath, [probePath, mode, eventsPath, storePath], {
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
    const error = new Error(`world-grid events restart probe failed: ${mode}`);
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

test('world-grid durable event contributions and rewards survive restarts with cap and duplicate safety', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-world-grid-events-'));
  const eventsPath = path.join(dir, 'world-grid-events.sqlite');
  const storePath = path.join(dir, 'portal-store.sqlite');
  try {
    const seeded = runProbe('seed', eventsPath, storePath);
    const reopened = runProbe('read', eventsPath, storePath);
    const duplicateContribution = runProbe('duplicate-contribute', eventsPath, storePath);
    const duplicateReward = runProbe('duplicate-reward', eventsPath, storePath);
    const capFilled = runProbe('cap-fill', eventsPath, storePath);
    const reopenedAfterCap = runProbe('read-after-cap', eventsPath, storePath);

    assert.equal(seeded.ok, true);
    assert.equal(seeded.contributionStatus, 200);
    assert.equal(seeded.rewardStatusCode, 200);
    assert.equal(seeded.contributionDuplicate, false);
    assert.equal(seeded.contributedCoin, 2);
    assert.equal(seeded.totalCoin, 2);
    assert.equal(seeded.personalCoin, 2);
    assert.equal(seeded.contributionCount, 1);
    assert.equal(seeded.participantCount, 1);
    assert.equal(seeded.rewardStatus, 'claimed');
    assert.equal(seeded.mutationApplied, false);
    assert.equal(seeded.inventoryCoin, 18);
    assert.equal(seeded.counts.contributions, 1);
    assert.equal(seeded.counts.rewards, 1);
    assert.deepEqual(seeded.metadata, [{
      migrationVersion: 'world_grid_events_v1',
      schemaVersion: 'agent-town.v5.world-grid.events.v1',
      count: 2
    }]);

    assert.equal(reopened.ok, true);
    assert.equal(reopened.totalCoin, 2);
    assert.equal(reopened.personalCoin, 2);
    assert.equal(reopened.contributionCount, 1);
    assert.equal(reopened.rewardStatus, 'claimed');
    assert.equal(reopened.inventoryCoin, 18);
    assert.equal(reopened.counts.contributions, 1);
    assert.equal(reopened.counts.rewards, 1);

    assert.equal(duplicateContribution.ok, true);
    assert.equal(duplicateContribution.contributionStatus, 200);
    assert.equal(duplicateContribution.contributionDuplicate, true);
    assert.equal(duplicateContribution.contributedCoin, 2);
    assert.equal(duplicateContribution.inventoryCoin, 18);
    assert.equal(duplicateContribution.counts.contributions, 1);

    assert.equal(duplicateReward.ok, true);
    assert.equal(duplicateReward.rewardStatusCode, 200);
    assert.equal(duplicateReward.rewardStatus, 'claimed');
    assert.equal(duplicateReward.counts.rewards, 1);
    assert.equal(duplicateReward.inventoryCoin, 18);

    assert.equal(capFilled.ok, true);
    assert.equal(capFilled.contributionStatus, 200);
    assert.equal(capFilled.contributedCoin, 3);
    assert.equal(capFilled.totalCoin, 5);
    assert.equal(capFilled.personalCoin, 5);
    assert.equal(capFilled.contributionCount, 2);
    assert.equal(capFilled.previewAcceptedCoin, 0);
    assert.equal(capFilled.previewAllowed, false);
    assert.equal(capFilled.inventoryCoin, 15);
    assert.equal(capFilled.counts.contributions, 2);
    assert.equal(capFilled.counts.rewards, 1);

    assert.equal(reopenedAfterCap.ok, true);
    assert.equal(reopenedAfterCap.totalCoin, 5);
    assert.equal(reopenedAfterCap.personalCoin, 5);
    assert.equal(reopenedAfterCap.contributionCount, 2);
    assert.equal(reopenedAfterCap.rewardStatus, 'claimed');
    assert.equal(reopenedAfterCap.previewAcceptedCoin, 0);
    assert.equal(reopenedAfterCap.previewAllowed, false);
    assert.equal(reopenedAfterCap.inventoryCoin, 15);
    assert.equal(reopenedAfterCap.counts.contributions, 2);
    assert.equal(reopenedAfterCap.counts.rewards, 1);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
