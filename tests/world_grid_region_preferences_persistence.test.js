const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const repoRoot = path.join(__dirname, '..');
const probePath = path.join(__dirname, 'world_grid_region_preferences_restart_probe_child.js');

function runProbe(mode, preferencesPath, pairId = '') {
  const args = [probePath, mode, preferencesPath];
  if (pairId) args.push(pairId);
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
    const error = new Error(`world-grid region preferences restart probe failed: ${mode}`);
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

test('world-grid durable region preferences survive separate Node process restarts and stay owner-indexed', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-world-grid-region-preferences-'));
  const preferencesPath = path.join(dir, 'world-grid-region-preferences.sqlite');
  const ownerA = 'session:world-grid-region-prefs-owner-a';
  const ownerB = 'session:world-grid-region-prefs-owner-b';
  try {
    const written = runProbe('write', preferencesPath, ownerA);
    const reopened = runProbe('read', preferencesPath, ownerA);
    const otherOwner = runProbe('read', preferencesPath, ownerB);

    assert.equal(written.ok, true);
    assert.equal(written.focusStatus, 200);
    assert.equal(written.cameraStatus, 200);
    assert.equal(written.selectedCellId, written.targetCellId);
    assert.deepEqual(written.camera, {
      zoom: 'region',
      q: written.durablePreference.camera.q,
      r: written.durablePreference.camera.r
    });
    assert.equal(written.durablePreference.selectedCellId, written.selectedCellId);
    assert.deepEqual(written.durablePreference.camera, written.camera);
    assert.equal(written.durableCount, 1);
    assert.deepEqual(written.metadata, [{
      migrationVersion: 'world_grid_region_preferences_v1',
      schemaVersion: 'agent-town.v5.world-grid.region-preferences.v1',
      count: 1
    }]);

    assert.equal(reopened.ok, true);
    assert.equal(reopened.focusStatus, 0);
    assert.equal(reopened.regionId, written.regionId);
    assert.equal(reopened.selectedCellId, written.selectedCellId);
    assert.deepEqual(reopened.camera, written.camera);
    assert.equal(reopened.durableCount, 1);
    assert.deepEqual(reopened.durablePreference, written.durablePreference);

    assert.equal(otherOwner.ok, true);
    assert.notEqual(otherOwner.regionId, written.regionId);
    assert.equal(otherOwner.selectedCellId, otherOwner.defaultSelectedCellId);
    assert.notEqual(otherOwner.selectedCellId, written.selectedCellId);
    assert.deepEqual(otherOwner.camera, { zoom: 'settlement', q: 0, r: 0 });
    assert.equal(otherOwner.durableCount, 1);
    assert.equal(otherOwner.durablePreference, null);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
