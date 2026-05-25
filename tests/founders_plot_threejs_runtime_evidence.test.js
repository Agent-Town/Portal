const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.join(__dirname, '..');

test('Founders Plot Three.js gameplay assets stay within the first-hour budget', () => {
  const manifestPath = path.join(repoRoot, 'public/experiences/founders-plot/assets/asset-manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const assets = Array.isArray(manifest.assets) ? manifest.assets : [];
  const totalBytes = assets.reduce((sum, asset) => sum + Number(asset.byteSize || asset.bytes || 0), 0);
  const largestAsset = assets.reduce((largest, asset) => (
    Number(asset.byteSize || asset.bytes || 0) > Number(largest.byteSize || largest.bytes || 0) ? asset : largest
  ), {});

  assert.equal(assets.length > 0, true);
  assert.ok(totalBytes <= 6 * 1024 * 1024, `asset manifest is ${totalBytes} bytes`);
  assert.ok(Number(largestAsset.byteSize || largestAsset.bytes || 0) <= 750 * 1024, `${largestAsset.id} is too large`);
  assert.ok(assets.every((asset) => Number(asset.byteSize || asset.bytes || 0) > 0), 'all assets must declare byte sizes');
});
