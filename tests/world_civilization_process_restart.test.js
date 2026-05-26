const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const repoRoot = path.join(__dirname, '..');
const probePath = path.join(__dirname, 'world_civilization_restart_probe_child.js');

function runProbe(mode, sqlitePath) {
  const result = spawnSync(process.execPath, [probePath, mode, sqlitePath], {
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
    const err = new Error(`restart probe failed: ${mode}`);
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

test('V6 audit replay reconstructs across separate Node process restarts', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-v6-restart-'));
  const sqlitePath = path.join(dir, 'audit.sqlite');
  try {
    const seeded = runProbe('seed', sqlitePath);
    const reconstructed = runProbe('reconstruct', sqlitePath);
    const duplicateSeed = runProbe('seed', sqlitePath);
    const reconstructedAgain = runProbe('reconstruct', sqlitePath);

    assert.deepEqual(seeded, {
      ok: true,
      count: 2,
      seqs: [1, 2],
      duplicates: [false, false]
    });
    assert.equal(reconstructed.ok, true);
    assert.equal(reconstructed.report.entryCount, 2);
    assert.equal(reconstructed.report.firstSeq, 1);
    assert.equal(reconstructed.report.lastSeq, 2);
    assert.equal(reconstructed.report.chainValid, true);
    assert.equal(reconstructed.report.privacySafe, true);
    assert.equal(reconstructed.report.executionStatus, 'not_executable');
    assert.equal(reconstructed.report.appliesWorldState, false);
    assert.deepEqual(reconstructed.report.byActionType, {
      'proposal.created': 1,
      'vote.recorded': 1
    });

    assert.deepEqual(duplicateSeed, {
      ok: true,
      count: 2,
      seqs: [1, 2],
      duplicates: [true, true]
    });
    assert.equal(reconstructedAgain.ok, true);
    assert.equal(reconstructedAgain.report.entryCount, 2);
    assert.equal(reconstructedAgain.report.latestEntryHash, reconstructed.report.latestEntryHash);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
