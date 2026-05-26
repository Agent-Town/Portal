const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const repoRoot = path.join(__dirname, '..');
const probePath = path.join(__dirname, 'world_grid_claims_restart_probe_child.js');

function runProbe(mode, claimsPath, storePath, claimId = '', pairId = '', targetRegionId = '') {
  const args = [probePath, mode, claimsPath, storePath];
  if (claimId || pairId || targetRegionId) args.push(claimId);
  if (pairId || targetRegionId) args.push(pairId);
  if (targetRegionId) args.push(targetRegionId);
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
    const error = new Error(`world-grid claims restart probe failed: ${mode}`);
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

test('world-grid durable claims survive separate Node process restarts and complete without process-local claim state', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-world-grid-claims-'));
  const claimsPath = path.join(dir, 'world-grid-claims.sqlite');
  const storePath = path.join(dir, 'portal-store.sqlite');
  try {
    const planned = runProbe('plan', claimsPath, storePath);
    const reopenedPlanned = runProbe('read-planned', claimsPath, storePath, planned.claimId);
    const completed = runProbe('complete', claimsPath, storePath, planned.claimId);
    const reopenedClaimed = runProbe('read-claimed', claimsPath, storePath, planned.claimId);

    assert.equal(planned.ok, true);
    assert.equal(planned.mutationStatus, 200);
    assert.match(planned.claimId, /^claim_/);
    assert.equal(planned.initialClaimCount, 0);
    assert.equal(planned.claimCount, 1);
    assert.equal(planned.claimStatus, 'planned');
    assert.equal(planned.durableCount, 1);
    assert.deepEqual(planned.metadata, [{
      migrationVersion: 'world_grid_claims_v1',
      schemaVersion: 'agent-town.v5.world-grid.claims.v1',
      count: 1
    }]);

    assert.equal(reopenedPlanned.ok, true);
    assert.equal(reopenedPlanned.mutationStatus, 0);
    assert.equal(reopenedPlanned.initialClaimCount, 1);
    assert.equal(reopenedPlanned.claimId, planned.claimId);
    assert.equal(reopenedPlanned.claimStatus, 'planned');
    assert.equal(reopenedPlanned.durableCount, 1);
    assert.equal(reopenedPlanned.durableClaims[0].claimId, planned.claimId);

    assert.equal(completed.ok, true);
    assert.equal(completed.mutationStatus, 200);
    assert.equal(completed.claimId, planned.claimId);
    assert.equal(completed.claimStatus, 'claimed');
    assert.equal(completed.claimedCellState, 'claimed');
    assert.equal(completed.routeStatus, 'open');
    assert.equal(completed.durableCount, 1);

    assert.equal(reopenedClaimed.ok, true);
    assert.equal(reopenedClaimed.mutationStatus, 0);
    assert.equal(reopenedClaimed.claimId, planned.claimId);
    assert.equal(reopenedClaimed.claimStatus, 'claimed');
    assert.equal(reopenedClaimed.claimedCellState, 'claimed');
    assert.equal(reopenedClaimed.routeStatus, 'open');
    assert.equal(reopenedClaimed.durableCount, 1);
    assert.equal(reopenedClaimed.durableClaims[0].status, 'claimed');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('world-grid durable claims survive cancel after restart and reject cross-owner route mutation', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-world-grid-claims-cancel-'));
  const claimsPath = path.join(dir, 'world-grid-claims.sqlite');
  const storePath = path.join(dir, 'portal-store.sqlite');
  const ownerA = 'session:world-grid-durable-claims-cancel-a';
  const ownerB = 'session:world-grid-durable-claims-cancel-b';
  try {
    const planned = runProbe('plan', claimsPath, storePath, '', ownerA);
    const crossOwnerComplete = runProbe('complete', claimsPath, storePath, planned.claimId, ownerB, planned.regionId);
    const reopenedAfterCrossOwner = runProbe('read-planned', claimsPath, storePath, planned.claimId, ownerA);
    const cancelled = runProbe('cancel', claimsPath, storePath, planned.claimId, ownerA);
    const reopenedCancelled = runProbe('read-cancelled', claimsPath, storePath, planned.claimId, ownerA);

    assert.equal(planned.ok, true);
    assert.equal(planned.mutationStatus, 200);
    assert.equal(planned.claimStatus, 'planned');
    assert.equal(planned.durableCount, 1);

    assert.equal(crossOwnerComplete.ok, true);
    assert.equal(crossOwnerComplete.mutationStatus, 403);
    assert.equal(crossOwnerComplete.mutationErrorCode, 'FORBIDDEN');
    assert.equal(crossOwnerComplete.snapshotRegionId, planned.regionId);
    assert.equal(crossOwnerComplete.durableCount, 1);
    assert.equal(crossOwnerComplete.claimStatus, 'planned');

    assert.equal(reopenedAfterCrossOwner.ok, true);
    assert.equal(reopenedAfterCrossOwner.mutationStatus, 0);
    assert.equal(reopenedAfterCrossOwner.claimId, planned.claimId);
    assert.equal(reopenedAfterCrossOwner.claimStatus, 'planned');
    assert.equal(reopenedAfterCrossOwner.durableCount, 1);

    assert.equal(cancelled.ok, true);
    assert.equal(cancelled.mutationStatus, 200);
    assert.equal(cancelled.claimId, planned.claimId);
    assert.equal(cancelled.claimCount, 0);
    assert.equal(cancelled.durableCount, 0);

    assert.equal(reopenedCancelled.ok, true);
    assert.equal(reopenedCancelled.mutationStatus, 0);
    assert.equal(reopenedCancelled.claimCount, 0);
    assert.equal(reopenedCancelled.durableCount, 0);
    assert.deepEqual(reopenedCancelled.durableClaims, []);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
