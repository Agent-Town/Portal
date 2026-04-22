const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadManifest, parseFrontMatter, repoRoot, sha256File } = require('./v1_4_2_test_helpers');

const HQ_IDS = [
  'founders_plot_hq_lv1_v1_4_2',
  'founders_plot_hq_lv2_v1_4_2',
  'founders_plot_hq_lv3_v1_4_2',
  'founders_plot_hq_lv4_v1_4_2',
  'founders_plot_hq_lv5_v1_4_2'
];
const REQUIRED_SECTIONS = [
  '## Intent',
  '## Positive prompt',
  '## Negative prompt',
  '## Output requirements',
  '## Post-processing notes',
  '## Acceptance checks'
];

test('Patch 2 HQ assets have durable spec and public prompt mirrors', () => {
  const manifest = loadManifest();
  const assets = Array.isArray(manifest?.assets) ? manifest.assets : [];

  assert.ok(fs.existsSync(path.join(repoRoot, 'specs', 'prompts', 'v1_4_2_patch_2', 'hq_progression_l1_l3_l5.md')));
  assert.ok(fs.existsSync(path.join(repoRoot, 'specs', 'prompts', 'v1_4_2_patch_2', 'mobile_quiet_lot_markers.md')));

  for (const id of HQ_IDS) {
    const asset = assets.find((entry) => String(entry?.id || '') === id);
    assert.ok(asset, `missing ${id}`);
    const promptFile = String(asset.promptFile || '');
    const promptMirrorFile = String(asset.promptMirrorFile || '');
    assert.match(promptFile, /specs\/prompts\/v1_4_2_patch_2\//, `${id} must point at Patch 2 prompt source`);
    assert.match(promptMirrorFile, /public\/experiences\/founders-plot\/assets\/prompts\/v1_4_2_patch_2\//, `${id} must point at Patch 2 prompt mirror`);
    assert.ok(fs.existsSync(path.join(repoRoot, promptFile)), `missing prompt file for ${id}`);
    assert.ok(fs.existsSync(path.join(repoRoot, promptMirrorFile)), `missing prompt mirror for ${id}`);
    assert.equal(asset.promptHash, sha256File(promptFile), `prompt hash mismatch for ${id}`);
    assert.equal(sha256File(promptMirrorFile), sha256File(promptFile), `prompt mirror mismatch for ${id}`);

    const text = fs.readFileSync(path.join(repoRoot, promptFile), 'utf8');
    const frontMatter = parseFrontMatter(text);
    assert.ok(frontMatter, `${promptFile} missing YAML front matter`);
    assert.equal(frontMatter.assetId, id, `assetId mismatch in ${promptFile}`);
    REQUIRED_SECTIONS.forEach((heading) => {
      assert.match(text, new RegExp(`^${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'm'), `${promptFile} missing ${heading}`);
    });
  }
});
