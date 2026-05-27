const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const repoRoot = path.join(__dirname, '..');
const probePath = path.join(__dirname, 'world_civilization_proposal_vote_restart_probe_child.js');

function runProbe(mode, paths) {
  const result = spawnSync(process.execPath, [
    probePath,
    mode,
    paths.auditPath,
    paths.proposalPath,
    paths.votePath
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
    const err = new Error(`proposal/vote restart probe failed: ${mode}`);
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

test('V6 proposal and vote stores survive separate Node process restarts with replay intact', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-v6-proposal-vote-restart-'));
  const paths = {
    auditPath: path.join(dir, 'audit.sqlite'),
    proposalPath: path.join(dir, 'proposals.sqlite'),
    votePath: path.join(dir, 'votes.sqlite')
  };
  try {
    const proposalSeed = runProbe('seed-proposal', paths);
    const voteRecord = runProbe('record-vote', paths);
    const snapshot = runProbe('snapshot', paths);
    const proposalRetry = runProbe('seed-proposal', paths);
    const voteRetry = runProbe('record-vote', paths);
    const finalSnapshot = runProbe('snapshot', paths);

    assert.equal(proposalSeed.ok, true);
    assert.equal(proposalSeed.duplicate, false);
    assert.equal(proposalSeed.proposalCount, 1);
    assert.equal(proposalSeed.voteCount, 0);
    assert.equal(proposalSeed.auditCount, 1);
    assert.equal(proposalSeed.proposalStatus, 'drafted');
    assert.equal(proposalSeed.proposalMutationMode, 'preview_only');

    assert.equal(voteRecord.ok, true);
    assert.equal(voteRecord.duplicate, false);
    assert.equal(voteRecord.proposalCount, 1);
    assert.equal(voteRecord.voteCount, 1);
    assert.equal(voteRecord.auditCount, 2);
    assert.equal(voteRecord.voteChoice, 'approve');
    assert.deepEqual(voteRecord.voteSummary, {
      proposalId: 'proposal_restart_bridge_001',
      counts: { approve: 1, reject: 0, abstain: 0 },
      total: 1,
      executionStatus: 'not_executable'
    });

    assert.equal(snapshot.ok, true);
    assert.equal(snapshot.replayOk, true);
    assert.equal(snapshot.replayReport.entryCount, 2);
    assert.equal(snapshot.replayReport.chainValid, true);
    assert.equal(snapshot.replayReport.privacySafe, true);
    assert.equal(snapshot.replayReport.summaryComplete, true);
    assert.equal(snapshot.replayReport.summaryCoverage.beforeAfterSummaryCount, 2);
    assert.equal(snapshot.replayReport.summaryCoverage.hashOnlyFallbackCount, 0);
    assert.equal(snapshot.replayReport.appliesWorldState, false);
    assert.deepEqual(snapshot.replayReport.byActionType, {
      'proposal.created': 1,
      'vote.recorded': 1
    });

    assert.equal(proposalRetry.duplicate, true);
    assert.equal(voteRetry.duplicate, true);
    assert.equal(voteRetry.auditCount, 2);
    assert.equal(finalSnapshot.replayOk, true);
    assert.equal(finalSnapshot.replayReport.entryCount, 2);
    assert.equal(finalSnapshot.replayReport.summaryCoverage.hashOnlyFallbackCount, 0);
    assert.equal(finalSnapshot.replayReport.latestEntryHash, snapshot.replayReport.latestEntryHash);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
