const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const repoRoot = path.join(__dirname, '..');
const probePath = path.join(__dirname, 'world_civilization_institution_restart_probe_child.js');

function runProbe(mode, paths) {
  const result = spawnSync(process.execPath, [
    probePath,
    mode,
    paths.auditPath,
    paths.institutionPath,
    paths.proposalPath,
    paths.votePath,
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
    const err = new Error(`institution restart probe failed: ${mode}`);
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

test('V6 institution store survives separate Node process restarts with charter and amendment replay intact', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-v6-institution-restart-'));
  const paths = {
    auditPath: path.join(dir, 'audit.sqlite'),
    institutionPath: path.join(dir, 'institutions.sqlite'),
    moderationPath: path.join(dir, 'moderation.sqlite'),
    proposalPath: path.join(dir, 'proposals.sqlite'),
    votePath: path.join(dir, 'votes.sqlite')
  };
  try {
    const publicWorksSeed = runProbe('seed-public-works', paths);
    const amendmentSeed = runProbe('seed-amendment', paths);
    const sandboxSeed = runProbe('seed-sandbox', paths);
    const snapshot = runProbe('snapshot', paths);
    const publicWorksRetry = runProbe('seed-public-works', paths);
    const amendmentRetry = runProbe('seed-amendment', paths);
    const sandboxRetry = runProbe('seed-sandbox', paths);
    const finalSnapshot = runProbe('snapshot', paths);

    assert.equal(publicWorksSeed.ok, true);
    assert.equal(publicWorksSeed.duplicate, false);
    assert.equal(publicWorksSeed.institutionId, 'institution_restart_bridge_council_001');
    assert.equal(publicWorksSeed.institutionCount, 1);
    assert.equal(publicWorksSeed.auditCount, 1);
    assert.equal(publicWorksSeed.publicWorksStatus, 'chartered');
    assert.equal(publicWorksSeed.summary.institutionCount, 1);
    assert.equal(publicWorksSeed.summary.byScope.public_works.chartered, 1);
    assert.equal(publicWorksSeed.summary.playerVisible, false);
    assert.equal(publicWorksSeed.summary.executionStatus, 'not_executable');

    assert.equal(amendmentSeed.ok, true);
    assert.equal(amendmentSeed.duplicate, false);
    assert.equal(amendmentSeed.amendmentId, 'charteramend_restart_bridge_council_001');
    assert.equal(amendmentSeed.auditCount, 5);
    assert.equal(amendmentSeed.amendmentCount, 1);
    assert.equal(amendmentSeed.governanceSummary.amendmentCount, 1);
    assert.equal(amendmentSeed.governanceSummary.latestAmendmentId, 'charteramend_restart_bridge_council_001');
    assert.equal(amendmentSeed.governanceSummary.appliesCharterChanges, false);
    assert.equal(amendmentSeed.governanceSummary.executionStatus, 'not_executable');
    assert.equal(amendmentSeed.publicWorksCharterId, 'charter_restart_bridge_council_001');

    assert.equal(sandboxSeed.ok, true);
    assert.equal(sandboxSeed.duplicate, false);
    assert.equal(sandboxSeed.institutionId, 'institution_restart_sandbox_council_001');
    assert.equal(sandboxSeed.institutionCount, 2);
    assert.equal(sandboxSeed.auditCount, 6);
    assert.equal(sandboxSeed.sandboxStatus, 'chartered');
    assert.deepEqual(sandboxSeed.institutionIds, [
      'institution_restart_bridge_council_001',
      'institution_restart_sandbox_council_001'
    ]);
    assert.equal(sandboxSeed.summary.byScope.sandbox_policy.chartered, 1);

    assert.equal(snapshot.ok, true);
    assert.equal(snapshot.replayOk, true);
    assert.equal(snapshot.replayReport.entryCount, 6);
    assert.equal(snapshot.replayReport.chainValid, true);
    assert.equal(snapshot.replayReport.privacySafe, true);
    assert.equal(snapshot.replayReport.summaryComplete, true);
    assert.equal(snapshot.replayReport.summaryCoverage.beforeAfterSummaryCount, 6);
    assert.equal(snapshot.replayReport.summaryCoverage.hashOnlyFallbackCount, 0);
    assert.equal(snapshot.replayReport.appliesWorldState, false);
    assert.deepEqual(snapshot.replayReport.byActionType, {
      'institution.chartered': 2,
      'institution.charter_amendment.recorded': 1,
      'moderation.decided': 1,
      'proposal.created': 1,
      'vote.recorded': 1
    });
    assert.deepEqual(snapshot.replayReport.byMigrationVersion, { v1: 6 });

    assert.equal(publicWorksRetry.ok, true);
    assert.equal(publicWorksRetry.duplicate, true);
    assert.equal(publicWorksRetry.institutionCount, 2);
    assert.equal(publicWorksRetry.auditCount, 6);
    assert.equal(amendmentRetry.ok, true);
    assert.equal(amendmentRetry.duplicate, true);
    assert.equal(amendmentRetry.amendmentCount, 1);
    assert.equal(amendmentRetry.auditCount, 6);
    assert.equal(sandboxRetry.ok, true);
    assert.equal(sandboxRetry.duplicate, true);
    assert.equal(sandboxRetry.institutionCount, 2);
    assert.equal(sandboxRetry.auditCount, 6);
    assert.equal(finalSnapshot.replayOk, true);
    assert.equal(finalSnapshot.replayReport.entryCount, 6);
    assert.equal(finalSnapshot.replayReport.summaryCoverage.hashOnlyFallbackCount, 0);
    assert.equal(finalSnapshot.replayReport.latestEntryHash, snapshot.replayReport.latestEntryHash);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
