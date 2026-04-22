const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadManifest, repoRoot, sha256File } = require('./v1_4_2_test_helpers');

const REQUIRED_FIELDS = [
  'id',
  'role',
  'path',
  'status',
  'generatedBy',
  'model',
  'promptFile',
  'promptHash',
  'referenceInputs',
  'referenceHashes',
  'candidateId',
  'postProcessing',
  'dimensions',
  'byteSize',
  'approvedAt',
  'approvalNotes',
  'replaces'
];

test('V1.4.2 asset manifest uses the required provenance schema', () => {
  const manifest = loadManifest();
  assert.equal(manifest?.schemaVersion, 'v1.4.2');
  assert.ok(Array.isArray(manifest?.assets));
  assert.ok(manifest.assets.length > 20, 'expected a non-trivial production pack');

  const productionAssets = manifest.assets.filter((asset) => !['reference_only', 'legacy'].includes(String(asset?.status || '')));
  assert.ok(productionAssets.length > 20, 'expected production assets in the manifest');

  for (const asset of productionAssets) {
    REQUIRED_FIELDS.forEach((field) => {
      assert.ok(Object.prototype.hasOwnProperty.call(asset, field), `missing ${field} for ${asset?.id}`);
    });

    const absoluteAssetPath = path.join(repoRoot, asset.path);
    assert.ok(fs.existsSync(absoluteAssetPath), `missing asset file for ${asset?.id}`);
    assert.ok(Array.isArray(asset.referenceInputs), `referenceInputs must be array for ${asset?.id}`);
    assert.ok(asset.referenceInputs.length > 0, `referenceInputs must not be empty for ${asset?.id}`);
    assert.equal(typeof asset.referenceHashes, 'object', `referenceHashes must be object for ${asset?.id}`);
    assert.ok(Array.isArray(asset.postProcessing), `postProcessing must be array for ${asset?.id}`);
    assert.equal(typeof asset.dimensions, 'object', `dimensions must be object for ${asset?.id}`);
    assert.ok(Number(asset.byteSize) > 0, `byteSize must be positive for ${asset?.id}`);
    if (String(asset.status) !== 'needs_human_signoff') {
      assert.ok(String(asset.approvedBy || '').trim(), `approvedBy required for ${asset?.id}`);
    }
  }
});

test('every manifest reference input exists and has a matching hash', () => {
  const manifest = loadManifest();
  const assets = Array.isArray(manifest?.assets) ? manifest.assets : [];
  const productionAssets = assets.filter((asset) => !['reference_only', 'legacy'].includes(String(asset?.status || '')));

  for (const asset of productionAssets) {
    for (const relativePath of asset.referenceInputs || []) {
      const absolutePath = path.join(repoRoot, relativePath);
      assert.ok(fs.existsSync(absolutePath), `missing reference input ${relativePath} for ${asset?.id}`);
      assert.equal(asset.referenceHashes[relativePath], sha256File(relativePath), `reference hash mismatch for ${asset?.id} -> ${relativePath}`);
    }
  }
});

test('production assets are never left in candidate or rejected status', () => {
  const manifest = loadManifest();
  const assets = Array.isArray(manifest?.assets) ? manifest.assets : [];
  const invalid = assets.filter((asset) => {
    const status = String(asset?.status || '');
    const role = String(asset?.role || '');
    return !['reference_only', 'legacy'].includes(status) && ['candidate', 'rejected'].includes(status) && !role.startsWith('candidate:');
  });
  assert.equal(invalid.length, 0);
});
