const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const repoRoot = path.join(__dirname, '..');
const probePath = path.join(__dirname, 'world_civilization_public_works_restart_probe_child.js');

function runProbe(mode, paths) {
  const result = spawnSync(process.execPath, [
    probePath,
    mode,
    paths.auditPath,
    paths.institutionPath,
    paths.publicWorksPath,
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
    const err = new Error(`public works restart probe failed: ${mode}`);
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

test('V6 public works store survives separate Node process restarts with conserved replay intact', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-v6-public-works-restart-'));
  const paths = {
    auditPath: path.join(dir, 'audit.sqlite'),
    institutionPath: path.join(dir, 'institutions.sqlite'),
    moderationPath: path.join(dir, 'moderation.sqlite'),
    proposalPath: path.join(dir, 'proposals.sqlite'),
    publicWorksPath: path.join(dir, 'public_works.sqlite'),
    votePath: path.join(dir, 'votes.sqlite')
  };
  try {
    const institutionSeed = runProbe('seed-institution', paths);
    const projectSeed = runProbe('seed-project', paths);
    const firstRecord = runProbe('record-first', paths);
    const secondRecord = runProbe('record-second', paths);
    const snapshot = runProbe('snapshot', paths);
    const projectRetry = runProbe('seed-project', paths);
    const firstRetry = runProbe('record-first', paths);
    const secondRetry = runProbe('record-second', paths);
    const finalSnapshot = runProbe('snapshot', paths);

    assert.equal(institutionSeed.ok, true);
    assert.equal(institutionSeed.duplicate, false);
    assert.equal(institutionSeed.institutionId, 'institution_restart_public_works_council_001');
    assert.equal(institutionSeed.institutionCount, 1);
    assert.equal(institutionSeed.projectCount, 0);
    assert.equal(institutionSeed.contributionCount, 0);
    assert.equal(institutionSeed.auditCount, 1);
    assert.equal(institutionSeed.summary.contributionCount, 0);
    assert.equal(institutionSeed.summary.mutatesPrivateTown, false);
    assert.equal(institutionSeed.summary.cosmeticRewardsOnly, true);
    assert.equal(institutionSeed.summary.executionStatus, 'not_executable');

    assert.equal(projectSeed.ok, true);
    assert.equal(projectSeed.duplicate, false);
    assert.equal(projectSeed.projectId, 'publicworks_restart_bridge_001');
    assert.equal(projectSeed.projectCount, 1);
    assert.equal(projectSeed.proposalCount, 1);
    assert.equal(projectSeed.voteCount, 1);
    assert.equal(projectSeed.moderationCount, 1);
    assert.equal(projectSeed.auditCount, 5);
    assert.deepEqual(projectSeed.projectIds, ['publicworks_restart_bridge_001']);
    assert.equal(projectSeed.summary.projectSource, 'recorded');
    assert.equal(projectSeed.summary.projectStatus, 'recorded');

    assert.equal(firstRecord.ok, true);
    assert.equal(firstRecord.duplicate, false);
    assert.equal(firstRecord.contributionId, 'contribution_restart_bridge_001');
    assert.deepEqual(firstRecord.acceptedBundle, { wood: 2, stone: 1, food: 0, coin: 5 });
    assert.deepEqual(firstRecord.cappedBundle, { wood: 8, stone: 1, food: 0, coin: 3 });
    assert.equal(firstRecord.contributionCount, 1);
    assert.equal(firstRecord.auditCount, 6);

    assert.equal(secondRecord.ok, true);
    assert.equal(secondRecord.duplicate, false);
    assert.equal(secondRecord.contributionId, 'contribution_restart_bridge_002');
    assert.deepEqual(secondRecord.acceptedBundle, { wood: 1, stone: 1, food: 0, coin: 1 });
    assert.deepEqual(secondRecord.cappedBundle, { wood: 0, stone: 0, food: 0, coin: 0 });
    assert.equal(secondRecord.contributionCount, 2);
    assert.equal(secondRecord.auditCount, 7);
    assert.deepEqual(secondRecord.contributionIds, [
      'contribution_restart_bridge_001',
      'contribution_restart_bridge_002'
    ]);

    assert.equal(snapshot.ok, true);
    assert.equal(snapshot.replayOk, true);
    assert.equal(snapshot.replayReport.entryCount, 7);
    assert.equal(snapshot.replayReport.chainValid, true);
    assert.equal(snapshot.replayReport.privacySafe, true);
    assert.equal(snapshot.replayReport.summaryComplete, true);
    assert.equal(snapshot.replayReport.summaryCoverage.beforeAfterSummaryCount, 7);
    assert.equal(snapshot.replayReport.summaryCoverage.hashOnlyFallbackCount, 0);
    assert.equal(snapshot.replayReport.appliesWorldState, false);
    assert.deepEqual(snapshot.summary.totalAccepted, { wood: 3, stone: 2, food: 0, coin: 6 });
    assert.deepEqual(snapshot.summary.cappedLoss, { wood: 8, stone: 1, food: 0, coin: 3 });
    assert.equal(snapshot.summary.resourceConservationStatus, 'accepted_inputs_equal_public_progress');
    assert.equal(snapshot.summary.mutatesPrivateTown, false);
    assert.equal(snapshot.summary.cosmeticRewardsOnly, true);
    assert.equal(snapshot.summary.executionStatus, 'not_executable');
    assert.deepEqual(snapshot.replayReport.byActionType, {
      'institution.chartered': 1,
      'moderation.decided': 1,
      'proposal.created': 1,
      'public_works.project.recorded': 1,
      'vote.recorded': 1,
      'public_works.contribution.recorded': 2
    });
    assert.deepEqual(snapshot.replayReport.byMigrationVersion, { v1: 7 });

    assert.equal(projectRetry.ok, true);
    assert.equal(projectRetry.duplicate, true);
    assert.equal(projectRetry.projectCount, 1);
    assert.equal(projectRetry.auditCount, 7);
    assert.equal(firstRetry.ok, true);
    assert.equal(firstRetry.duplicate, true);
    assert.equal(firstRetry.contributionCount, 2);
    assert.equal(firstRetry.auditCount, 7);
    assert.equal(secondRetry.ok, true);
    assert.equal(secondRetry.duplicate, true);
    assert.equal(secondRetry.contributionCount, 2);
    assert.equal(secondRetry.auditCount, 7);
    assert.equal(finalSnapshot.replayOk, true);
    assert.equal(finalSnapshot.replayReport.entryCount, 7);
    assert.equal(finalSnapshot.replayReport.summaryCoverage.hashOnlyFallbackCount, 0);
    assert.equal(finalSnapshot.replayReport.latestEntryHash, snapshot.replayReport.latestEntryHash);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
