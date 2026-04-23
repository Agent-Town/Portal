const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadManifest, repoRoot } = require('./v1_4_3_test_helpers');

test('platform manifest assets are live-referenced unless explicitly futureUse', () => {
  const manifest = loadManifest();
  for (const asset of manifest.assets) {
    if (asset.futureUse) continue;
    assert.ok(Array.isArray(asset.usedBy) && asset.usedBy.length > 0, `usedBy missing for ${asset.id}`);
    let referencedSomewhere = false;
    for (const routePath of asset.usedBy) {
      const absolutePath = path.join(repoRoot, routePath);
      assert.ok(fs.existsSync(absolutePath), `usedBy path missing for ${asset.id}: ${routePath}`);
      const text = fs.readFileSync(absolutePath, 'utf8');
      const publicPath = asset.path.replace(/^public/, '');
      if (text.includes(asset.path) || text.includes(publicPath) || text.includes(path.basename(asset.path))) {
        referencedSomewhere = true;
      }
    }
    assert.ok(referencedSomewhere, `asset ${asset.id} is not referenced by any listed usedBy file`);
  }
});
