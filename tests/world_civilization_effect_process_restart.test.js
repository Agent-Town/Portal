const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const repoRoot = path.join(__dirname, '..');
const probePath = path.join(__dirname, 'world_civilization_effect_restart_probe_child.js');

function runProbe(mode, paths) {
  const result = spawnSync(process.execPath, [
    probePath,
    mode,
    paths.auditPath,
    paths.proposalPath,
    paths.votePath,
    paths.moderationPath,
    paths.effectPath
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
    const err = new Error(`effect restart probe failed: ${mode}`);
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

test('V6 civic effect store survives separate Node process restarts with rollback replay intact', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-v6-effect-restart-'));
  const paths = {
    auditPath: path.join(dir, 'audit.sqlite'),
    proposalPath: path.join(dir, 'proposals.sqlite'),
    votePath: path.join(dir, 'votes.sqlite'),
    moderationPath: path.join(dir, 'moderation.sqlite'),
    effectPath: path.join(dir, 'effects.sqlite')
  };
  try {
    const seed = runProbe('seed-prerequisites', paths);
    const prepared = runProbe('prepare-effect', paths);
    const snapshot = runProbe('snapshot', paths);
    const retry = runProbe('prepare-effect', paths);
    const finalSnapshot = runProbe('snapshot', paths);

    assert.equal(seed.ok, true);
    assert.equal(seed.proposalCount, 1);
    assert.equal(seed.moderationCount, 1);
    assert.equal(seed.voteCount, 1);
    assert.equal(seed.effectCount, 0);
    assert.equal(seed.rollbackCount, 0);
    assert.equal(seed.auditCount, 4);
    assert.deepEqual(seed.replayReport.byActionType, {
      'moderation.decided': 1,
      'proposal.created': 1,
      'proposal.reviewed': 1,
      'vote.recorded': 1
    });

    assert.equal(prepared.ok, true);
    assert.equal(prepared.duplicate, false);
    assert.equal(prepared.actionId, 'action_restart_effect_bridge_001');
    assert.equal(prepared.rollbackId, 'rollback_restart_effect_bridge_001');
    assert.equal(prepared.effectCount, 1);
    assert.equal(prepared.rollbackCount, 1);
    assert.equal(prepared.auditCount, 5);
    assert.equal(prepared.actionStatus, 'prepared');
    assert.equal(prepared.rollbackStatus, 'available');
    assert.equal(prepared.effectSummary.actionCount, 1);
    assert.equal(prepared.effectSummary.rollbackCount, 1);
    assert.equal(prepared.effectSummary.byStatus.prepared, 1);
    assert.equal(prepared.effectSummary.latestActionId, 'action_restart_effect_bridge_001');
    assert.equal(prepared.effectSummary.appliesWorldState, false);
    assert.equal(prepared.effectSummary.executionStatus, 'not_executable');

    assert.equal(snapshot.ok, true);
    assert.equal(snapshot.replayOk, true);
    assert.equal(snapshot.replayReport.entryCount, 5);
    assert.equal(snapshot.replayReport.chainValid, true);
    assert.equal(snapshot.replayReport.privacySafe, true);
    assert.equal(snapshot.replayReport.summaryComplete, true);
    assert.equal(snapshot.replayReport.summaryCoverage.beforeAfterSummaryCount, 5);
    assert.equal(snapshot.replayReport.summaryCoverage.hashOnlyFallbackCount, 0);
    assert.equal(snapshot.replayReport.appliesWorldState, false);
    assert.equal(snapshot.replayReport.rollbackCount, 1);
    assert.deepEqual(snapshot.replayReport.byActionType, {
      'civic_action.prepared': 1,
      'moderation.decided': 1,
      'proposal.created': 1,
      'proposal.reviewed': 1,
      'vote.recorded': 1
    });
    assert.deepEqual(snapshot.replayReport.byMigrationVersion, { v1: 5 });

    assert.equal(retry.ok, true);
    assert.equal(retry.duplicate, true);
    assert.equal(retry.effectCount, 1);
    assert.equal(retry.rollbackCount, 1);
    assert.equal(retry.auditCount, 5);
    assert.equal(finalSnapshot.replayOk, true);
    assert.equal(finalSnapshot.replayReport.entryCount, 5);
    assert.equal(finalSnapshot.replayReport.summaryCoverage.hashOnlyFallbackCount, 0);
    assert.equal(finalSnapshot.replayReport.latestEntryHash, snapshot.replayReport.latestEntryHash);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
