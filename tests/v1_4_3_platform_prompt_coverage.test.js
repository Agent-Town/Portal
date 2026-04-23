const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  listPromptFiles,
  listPromptMirrorFiles,
  loadManifest,
  repoRoot,
  sha256File
} = require('./v1_4_3_test_helpers');

test('every generated V1.4.3 platform asset has prompt and mirror coverage', () => {
  const manifest = loadManifest();
  const promptFiles = new Set(listPromptFiles());
  const mirrorFiles = new Set(listPromptMirrorFiles());
  const generatedAssets = manifest.assets.filter((asset) => asset.model === 'gpt-image-2');

  for (const asset of generatedAssets) {
    assert.ok(promptFiles.has(asset.promptFile), `missing prompt file for ${asset.id}`);
    assert.ok(mirrorFiles.has(asset.promptMirrorFile), `missing prompt mirror for ${asset.id}`);
    assert.ok(fs.existsSync(path.join(repoRoot, asset.promptFile)), `prompt file missing on disk for ${asset.id}`);
    assert.ok(fs.existsSync(path.join(repoRoot, asset.promptMirrorFile)), `prompt mirror missing on disk for ${asset.id}`);
    assert.equal(asset.promptHash, `sha256:${sha256File(asset.promptFile)}`);
  }
});

test('all prompt files use YAML front matter', () => {
  for (const promptFile of listPromptFiles()) {
    const text = fs.readFileSync(path.join(repoRoot, promptFile), 'utf8');
    assert.match(text, /^---\n[\s\S]*?\n---\n/, `missing front matter in ${promptFile}`);
  }
});
