const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { loadManifest, repoRoot, sha256File } = require('./v1_4_2_test_helpers');

const HQ_IDS = [
  'founders_plot_hq_lv1_v1_4_2',
  'founders_plot_hq_lv3_v1_4_2',
  'founders_plot_hq_lv5_v1_4_2'
];

test('Patch 2 HQ milestone assets are real distinct files with Patch 2 provenance', () => {
  const manifest = loadManifest();
  const assets = Array.isArray(manifest?.assets) ? manifest.assets : [];
  const hqAssets = HQ_IDS.map((id) => assets.find((asset) => String(asset?.id || '') === id));

  hqAssets.forEach((asset, index) => {
    assert.ok(asset, `missing HQ asset ${HQ_IDS[index]}`);
    assert.match(String(asset.promptFile || ''), /specs\/prompts\/v1_4_2_patch_2\//, `${asset.id} must use a Patch 2 prompt file`);
    assert.ok(String(asset.promptMirrorFile || '').includes('public/experiences/founders-plot/assets/prompts/v1_4_2_patch_2/'), `${asset.id} must declare a public prompt mirror`);
  });

  const hashes = new Set(hqAssets.map((asset) => sha256File(path.join(repoRoot, asset.path))));
  assert.equal(hashes.size, hqAssets.length, 'HQ L1/L3/L5 must not hash to the same file');
});
