const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const assetRoot = path.join(__dirname, '..', 'public', 'experiences', 'founders-plot', 'assets');
const manifestPath = path.join(assetRoot, 'asset-manifest.json');

const REQUIRED_IDS = [
  'scene_founders_plot_desktop',
  'scene_founders_plot_mobile',
  'building_hq_level_1',
  'building_hq_level_2',
  'building_hq_level_3',
  'building_hq_level_4',
  'building_hq_level_5',
  'building_lumber_camp_base',
  'building_farm_plot_base',
  'building_quarry_base',
  'building_workshop_base',
  'building_market_stall_base',
  'object_contract_board_base',
  'object_public_square_welcome_sign_base',
  'object_public_square_welcome_sign_upgraded',
  'object_foreman_hut_base',
  'object_empty_lot_buildable',
  'object_locked_lot',
  'clover_idle',
  'clover_observing',
  'clover_thinking',
  'clover_acting',
  'clover_waiting_approval',
  'clover_paused',
  'clover_restart_needed'
];

test('asset manifest uses the Founders Plot visual schema and contains the P0 pack', () => {
  assert.ok(fs.existsSync(manifestPath));
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const assets = Array.isArray(manifest?.assets) ? manifest.assets : [];
  const ids = new Set(assets.map((asset) => String(asset?.id || '')));

  assert.equal(manifest.schemaVersion, 'founders-plot-assets-v1');
  assert.equal(manifest.styleFamily, 'agent-town-frontier-storybook-v1');
  assert.ok(Array.isArray(manifest?.referenceInputs));
  assert.equal(manifest?.videoReference?.url, 'https://www.youtube.com/watch?v=ZW7tUUZqhdY');
  assert.equal(manifest?.videoReference?.usage, 'tone_motion_story_reference_only');
  assert.equal(manifest?.videoReference?.frameExtractionRequired, false);
  REQUIRED_IDS.forEach((id) => assert.ok(ids.has(id), `missing ${id}`));
});

test('every asset entry is approved, prompt-linked, and points at a real file under budget', () => {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const assets = Array.isArray(manifest?.assets) ? manifest.assets : [];
  let totalBytes = 0;

  for (const asset of assets) {
    const relativePath = String(asset?.path || '');
    const filePath = path.join(assetRoot, relativePath);
    assert.ok(relativePath, `missing path for ${asset?.id}`);
    assert.ok(fs.existsSync(filePath), `missing file for ${asset?.id}`);
    assert.equal(asset?.license, 'project-owned-generated');
    assert.ok(asset?.sourceTool, `missing sourceTool for ${asset?.id}`);
    assert.ok(asset?.referenceSource, `missing referenceSource for ${asset?.id}`);
    assert.ok(Array.isArray(asset?.referenceFiles), `missing referenceFiles for ${asset?.id}`);
    assert.ok(asset?.rightsStatus, `missing rightsStatus for ${asset?.id}`);
    assert.ok(Array.isArray(asset?.postProcessing), `missing postProcessing for ${asset?.id}`);
    assert.equal(asset?.approvalScope, 'gameplay_asset');
    assert.equal(asset?.approvalStatus, 'approved');
    assert.equal(asset?.reviewer, 'codex-human');
    assert.ok(asset?.promptFile, `missing promptFile for ${asset?.id}`);
    assert.ok(asset?.promptSummary, `missing promptSummary for ${asset?.id}`);
    assert.ok(asset?.optimizationStatus, `missing optimizationStatus for ${asset?.id}`);
    assert.equal(asset?.styleReview?.passed, true);
    totalBytes += Number(asset?.bytes || 0);
  }

  assert.ok(totalBytes <= 2_800_000, `asset pack too large: ${totalBytes}`);
});

test('primary-view assets have named human approval metadata and hero-frame signoff data', () => {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const assets = Array.isArray(manifest?.assets) ? manifest.assets : [];
  const primaryView = assets.filter((asset) => asset?.usage === 'primary-view');

  assert.ok(primaryView.length > 10);
  primaryView.forEach((asset) => {
    assert.equal(asset?.approvalStatus, 'approved');
    assert.ok(String(asset?.approvedBy || '').trim(), `missing approvedBy for ${asset?.id}`);
    assert.match(String(asset?.approvedAt || ''), /^\d{4}-\d{2}-\d{2}$/, `invalid approvedAt for ${asset?.id}`);
    assert.ok(String(asset?.approvalNotes || '').trim(), `missing approvalNotes for ${asset?.id}`);
  });

  assert.equal(manifest?.heroFrame?.approvalStatus, 'approved');
  assert.ok(String(manifest?.heroFrame?.approvedBy || '').trim());
  assert.match(String(manifest?.heroFrame?.approvedAt || ''), /^\d{4}-\d{2}-\d{2}$/);
});
