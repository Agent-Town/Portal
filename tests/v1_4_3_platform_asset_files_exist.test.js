const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadManifest, repoRoot } = require('./v1_4_3_test_helpers');

test('manifest asset files, candidates, and references exist on disk', () => {
  const manifest = loadManifest();
  for (const asset of manifest.assets) {
    assert.ok(fs.existsSync(path.join(repoRoot, asset.path)), `missing production asset ${asset.path}`);
    for (const candidatePath of asset.candidatePaths || []) {
      assert.ok(fs.existsSync(path.join(repoRoot, candidatePath)), `missing candidate asset ${candidatePath}`);
    }
    for (const inputPath of asset.referenceInputs || []) {
      assert.ok(fs.existsSync(path.join(repoRoot, inputPath)), `missing reference input ${inputPath}`);
    }
  }
});

test('every production platform image is represented in the manifest', () => {
  const manifest = loadManifest();
  const manifestPaths = new Set(manifest.assets.map((asset) => asset.path));
  const roots = [
    path.join(repoRoot, 'public', 'assets', 'platform'),
    path.join(repoRoot, 'public', 'assets', 'hero-cast')
  ];
  const discovered = [];
  const walk = (rootDir) => {
    for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
      const fullPath = path.join(rootDir, entry.name);
      if (entry.isDirectory()) walk(fullPath);
      else if (/\.(webp|png|jpe?g|ico)$/i.test(entry.name)) discovered.push(path.relative(repoRoot, fullPath).replace(/\\/g, '/'));
    }
  };
  roots.forEach((rootDir) => walk(rootDir));
  for (const relativePath of discovered) {
    if (relativePath.startsWith('public/assets/platform/prompts/')) continue;
    if (/v1_4_2\.(webp|png|jpe?g)$/i.test(relativePath)) continue;
    assert.ok(manifestPaths.has(relativePath), `manifest missing ${relativePath}`);
  }
});
