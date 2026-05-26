const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const repoRoot = path.join(__dirname, '..');
const probePath = path.join(__dirname, 'world_civilization_delegation_restart_probe_child.js');

function runProbe(mode, paths) {
  const result = spawnSync(process.execPath, [
    probePath,
    mode,
    paths.auditPath,
    paths.delegationPath
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
    const err = new Error(`delegation restart probe failed: ${mode}`);
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

test('V6 delegation store survives separate Node process restarts with revocation replay intact', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-v6-delegation-restart-'));
  const paths = {
    auditPath: path.join(dir, 'audit.sqlite'),
    delegationPath: path.join(dir, 'delegations.sqlite')
  };
  try {
    const adviceSeed = runProbe('seed-advice', paths);
    const executionSeed = runProbe('seed-execution', paths);
    const revoked = runProbe('revoke-advice', paths);
    const snapshot = runProbe('snapshot', paths);
    const adviceRetry = runProbe('seed-advice', paths);
    const executionRetry = runProbe('seed-execution', paths);
    const revokeRetry = runProbe('revoke-advice', paths);
    const finalSnapshot = runProbe('snapshot', paths);

    assert.equal(adviceSeed.ok, true);
    assert.equal(adviceSeed.duplicate, false);
    assert.equal(adviceSeed.delegationId, 'delegation_restart_vote_advice_001');
    assert.equal(adviceSeed.delegationCount, 1);
    assert.equal(adviceSeed.auditCount, 1);
    assert.equal(adviceSeed.adviceStatus, 'active');
    assert.deepEqual(adviceSeed.policy.allowedScopes, ['vote_advice']);
    assert.equal(adviceSeed.policy.civicExecutionAllowed, false);
    assert.equal(adviceSeed.policy.executionStatus, 'not_executable');

    assert.equal(executionSeed.ok, true);
    assert.equal(executionSeed.duplicate, false);
    assert.equal(executionSeed.delegationId, 'delegation_restart_civic_execution_001');
    assert.equal(executionSeed.delegationCount, 2);
    assert.equal(executionSeed.auditCount, 2);
    assert.equal(executionSeed.executionStatus, 'active');
    assert.deepEqual(executionSeed.policy.allowedScopes, ['vote_advice', 'civic_execution']);
    assert.equal(executionSeed.policy.civicExecutionAllowed, true);
    assert.equal(executionSeed.policy.remainingActionBudgetByScope.civic_execution, 1);

    assert.equal(revoked.ok, true);
    assert.equal(revoked.duplicate, false);
    assert.equal(revoked.revokeAuditEntryId, 'audit_delegation_restart_vote_advice_001_revoked');
    assert.equal(revoked.delegationCount, 2);
    assert.equal(revoked.auditCount, 3);
    assert.equal(revoked.adviceStatus, 'revoked');
    assert.deepEqual(revoked.policy.allowedScopes, ['civic_execution']);
    assert.deepEqual(revoked.policy.revokedDelegationIds, ['delegation_restart_vote_advice_001']);
    assert.equal(revoked.policy.civicExecutionAllowed, true);
    assert.equal(revoked.summary.activeCount, 1);
    assert.equal(revoked.summary.revokedCount, 1);
    assert.equal(revoked.summary.executionStatus, 'not_executable');

    assert.equal(snapshot.ok, true);
    assert.equal(snapshot.replayOk, true);
    assert.equal(snapshot.replayReport.entryCount, 3);
    assert.equal(snapshot.replayReport.chainValid, true);
    assert.equal(snapshot.replayReport.privacySafe, true);
    assert.equal(snapshot.replayReport.appliesWorldState, false);
    assert.deepEqual(snapshot.replayReport.byActionType, {
      'delegation.created': 2,
      'delegation.revoked': 1
    });
    assert.deepEqual(snapshot.replayReport.byMigrationVersion, { v1: 3 });

    assert.equal(adviceRetry.ok, true);
    assert.equal(adviceRetry.duplicate, true);
    assert.equal(adviceRetry.adviceStatus, 'revoked');
    assert.equal(adviceRetry.auditCount, 3);
    assert.equal(executionRetry.ok, true);
    assert.equal(executionRetry.duplicate, true);
    assert.equal(executionRetry.auditCount, 3);
    assert.equal(revokeRetry.ok, true);
    assert.equal(revokeRetry.duplicate, true);
    assert.equal(revokeRetry.auditCount, 3);
    assert.equal(finalSnapshot.replayOk, true);
    assert.equal(finalSnapshot.replayReport.entryCount, 3);
    assert.equal(finalSnapshot.replayReport.latestEntryHash, snapshot.replayReport.latestEntryHash);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
