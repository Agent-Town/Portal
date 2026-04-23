const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  loadManifest,
  platformBudgetBytes,
  repoRoot,
  sha256File
} = require('./v1_4_3_test_helpers');

const REQUIRED_TOP_LEVEL = ['schemaVersion', 'styleFamily', 'modelFamily', 'generatedAt', 'approvalStatus', 'approvedBy', 'approvedAt', 'totalBytes', 'budgetBytes', 'assets'];
const REQUIRED_ASSET_FIELDS = ['id', 'path', 'surface', 'role', 'model', 'referenceInputs', 'referenceHashes', 'postProcessing', 'width', 'height', 'bytes', 'format', 'usedBy', 'approvalStatus', 'approvedBy', 'approvedAt', 'approvalNotes', 'replaces', 'rollbackPath', 'futureUse'];

test('V1.4.3 platform asset manifest matches required schema', () => {
  const manifest = loadManifest();
  REQUIRED_TOP_LEVEL.forEach((field) => {
    assert.ok(Object.prototype.hasOwnProperty.call(manifest, field), `missing top-level field ${field}`);
  });
  assert.equal(manifest.schemaVersion, 'v1.4.3');
  assert.equal(manifest.styleFamily, 'agent-town-frontier-storybook-v1_4_3');
  assert.equal(manifest.modelFamily, 'gpt-image-2');
  assert.equal(manifest.budgetBytes, platformBudgetBytes);
  assert.ok(Array.isArray(manifest.assets));
  assert.ok(manifest.assets.length >= 15, 'expected platform assets plus existing hero cast refs');

  for (const asset of manifest.assets) {
    REQUIRED_ASSET_FIELDS.forEach((field) => {
      assert.ok(Object.prototype.hasOwnProperty.call(asset, field), `missing ${field} for ${asset.id}`);
    });
    assert.ok(fs.existsSync(path.join(repoRoot, asset.path)), `missing asset file for ${asset.id}`);
    assert.ok(Array.isArray(asset.referenceInputs), `referenceInputs must be array for ${asset.id}`);
    assert.equal(typeof asset.referenceHashes, 'object', `referenceHashes must be object for ${asset.id}`);
    assert.ok(Array.isArray(asset.usedBy), `usedBy must be array for ${asset.id}`);
    assert.ok(Number(asset.bytes) > 0, `bytes must be positive for ${asset.id}`);
    assert.ok(Number(asset.width) > 0 && Number(asset.height) > 0, `dimensions must be positive for ${asset.id}`);
    if (asset.model === 'gpt-image-2') {
      assert.ok(asset.promptFile, `promptFile required for ${asset.id}`);
      assert.ok(asset.promptMirrorFile, `promptMirrorFile required for ${asset.id}`);
      assert.equal(asset.promptHash, `sha256:${sha256File(asset.promptFile)}`, `prompt hash mismatch for ${asset.id}`);
    }
  }
});

test('V1.4.3 manifest totalBytes matches asset byte sum and stays within budget', () => {
  const manifest = loadManifest();
  const total = manifest.assets.reduce((sum, asset) => sum + Number(asset.bytes || 0), 0);
  assert.equal(total, manifest.totalBytes);
  assert.ok(total <= platformBudgetBytes, `asset budget exceeded: ${total}`);
});
