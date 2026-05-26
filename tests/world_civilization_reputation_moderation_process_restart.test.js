const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const repoRoot = path.join(__dirname, '..');
const probePath = path.join(__dirname, 'world_civilization_reputation_moderation_restart_probe_child.js');

function runProbe(mode, paths) {
  const result = spawnSync(process.execPath, [
    probePath,
    mode,
    paths.auditPath,
    paths.reputationPath,
    paths.moderationPath
  ], {
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
    const err = new Error(`reputation/moderation restart probe failed: ${mode}`);
    err.details = {
      status: result.status,
      stdout: result.stdout,
      stderr: result.stderr,
      parsed
    };
    throw err;
  }
  return parsed;
}

test('V6 reputation and moderation stores survive separate Node process restarts with replay intact', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-v6-reputation-moderation-restart-'));
  const paths = {
    auditPath: path.join(dir, 'audit.sqlite'),
    reputationPath: path.join(dir, 'reputation.sqlite'),
    moderationPath: path.join(dir, 'moderation.sqlite')
  };
  try {
    const reputationSeed = runProbe('seed-reputation', paths);
    const moderationSeed = runProbe('seed-moderation', paths);
    const snapshot = runProbe('snapshot', paths);
    const reputationRetry = runProbe('seed-reputation', paths);
    const moderationRetry = runProbe('seed-moderation', paths);
    const finalSnapshot = runProbe('snapshot', paths);

    assert.equal(reputationSeed.ok, true);
    assert.equal(reputationSeed.duplicate, false);
    assert.equal(reputationSeed.recordId, 'reputation_restart_service_001');
    assert.equal(reputationSeed.reputationCount, 1);
    assert.equal(reputationSeed.moderationCount, 0);
    assert.equal(reputationSeed.auditCount, 1);
    assert.equal(reputationSeed.reputationSummary.totalScore, 2);
    assert.equal(reputationSeed.reputationSummary.recordCount, 1);
    assert.equal(reputationSeed.reputationSummary.transferable, false);
    assert.equal(reputationSeed.reputationSummary.executionStatus, 'not_executable');

    assert.equal(moderationSeed.ok, true);
    assert.equal(moderationSeed.duplicate, false);
    assert.equal(moderationSeed.decisionId, 'moderation_restart_civic_notice_001');
    assert.equal(moderationSeed.reputationCount, 1);
    assert.equal(moderationSeed.moderationCount, 1);
    assert.equal(moderationSeed.auditCount, 2);
    assert.equal(moderationSeed.moderationSummary.decisionCount, 1);
    assert.equal(moderationSeed.moderationSummary.needsReviewCount, 1);
    assert.equal(moderationSeed.moderationSummary.redactedFieldCount, 1);
    assert.equal(moderationSeed.moderationSummary.privateDataIncluded, false);
    assert.equal(moderationSeed.moderationSummary.executionStatus, 'not_executable');

    assert.equal(snapshot.ok, true);
    assert.equal(snapshot.replayOk, true);
    assert.equal(snapshot.replayReport.entryCount, 2);
    assert.equal(snapshot.replayReport.chainValid, true);
    assert.equal(snapshot.replayReport.privacySafe, true);
    assert.equal(snapshot.replayReport.appliesWorldState, false);
    assert.deepEqual(snapshot.replayReport.byActionType, {
      'moderation.decided': 1,
      'reputation.recorded': 1
    });
    assert.deepEqual(snapshot.replayReport.byMigrationVersion, { v1: 2 });

    assert.equal(reputationRetry.duplicate, true);
    assert.equal(reputationRetry.reputationCount, 1);
    assert.equal(reputationRetry.moderationCount, 1);
    assert.equal(reputationRetry.auditCount, 2);
    assert.equal(moderationRetry.duplicate, true);
    assert.equal(moderationRetry.reputationCount, 1);
    assert.equal(moderationRetry.moderationCount, 1);
    assert.equal(moderationRetry.auditCount, 2);
    assert.equal(finalSnapshot.replayOk, true);
    assert.equal(finalSnapshot.replayReport.entryCount, 2);
    assert.equal(finalSnapshot.replayReport.latestEntryHash, snapshot.replayReport.latestEntryHash);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
