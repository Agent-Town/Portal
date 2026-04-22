const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadManifest, parseFrontMatter, repoRoot, sha256File } = require('./v1_4_2_test_helpers');

const REQUIRED_SECTIONS = [
  '## Intent',
  '## Positive prompt',
  '## Negative prompt',
  '## Output requirements',
  '## Post-processing notes',
  '## Acceptance checks'
];

test('every GPT Image 2 production asset has a durable prompt file with required sections', () => {
  const manifest = loadManifest();
  const assets = Array.isArray(manifest?.assets) ? manifest.assets : [];
  const generatedAssets = assets.filter((asset) => String(asset?.generatedBy || '') === 'gpt-image-2');

  assert.ok(generatedAssets.length > 0, 'expected at least one gpt-image-2 production asset');
  for (const asset of generatedAssets) {
    const promptFile = String(asset?.promptFile || '').trim();
    assert.ok(promptFile, `missing promptFile for ${asset?.id}`);
    const absolutePromptPath = path.join(repoRoot, promptFile);
    assert.ok(fs.existsSync(absolutePromptPath), `missing prompt file ${promptFile}`);
    const text = fs.readFileSync(absolutePromptPath, 'utf8');
    const frontMatter = parseFrontMatter(text);
    assert.ok(frontMatter, `missing front matter in ${promptFile}`);
    assert.equal(frontMatter.assetId, String(asset.id), `assetId mismatch for ${asset.id}`);
    assert.equal(frontMatter.model, 'gpt-image-2', `model mismatch for ${asset.id}`);
    REQUIRED_SECTIONS.forEach((heading) => {
      assert.match(text, new RegExp(`^${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'm'), `${promptFile} missing ${heading}`);
    });
  }
});

test('every GPT Image 2 production asset stores the correct prompt hash', () => {
  const manifest = loadManifest();
  const assets = Array.isArray(manifest?.assets) ? manifest.assets : [];
  const generatedAssets = assets.filter((asset) => String(asset?.generatedBy || '') === 'gpt-image-2');

  assert.ok(generatedAssets.length > 0, 'expected at least one gpt-image-2 production asset');
  for (const asset of generatedAssets) {
    const promptFile = String(asset?.promptFile || '').trim();
    const promptHash = String(asset?.promptHash || '').trim();
    assert.ok(promptHash, `missing promptHash for ${asset?.id}`);
    assert.equal(promptHash, sha256File(promptFile), `prompt hash mismatch for ${asset?.id}`);
  }
});
