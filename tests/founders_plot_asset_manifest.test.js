const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const repoRoot = path.join(__dirname, '..');
const manifestPath = path.join(repoRoot, 'public', 'experiences', 'founders-plot', 'assets', 'asset-manifest.json');
const ALLOWED_GENERATORS = new Set(['gpt-image-2', 'codex-svg', 'reference-normalized']);
const REQUIRED_IDS = [
  'founders_plot_scene_desktop_v1_4_2',
  'founders_plot_scene_mobile_v1_4_2',
  'founders_plot_hq_lv1_v1_4_2',
  'founders_plot_hq_lv2_v1_4_2',
  'founders_plot_hq_lv3_v1_4_2',
  'founders_plot_hq_lv4_v1_4_2',
  'founders_plot_hq_lv5_v1_4_2',
  'founders_plot_lumber_camp_v1_4_2',
  'founders_plot_farm_plot_v1_4_2',
  'founders_plot_quarry_v1_4_2',
  'founders_plot_workshop_v1_4_2',
  'founders_plot_market_stall_v1_4_2',
  'founders_plot_contract_board_v1_4_2',
  'founders_plot_public_square_v1_4_2',
  'founders_plot_foreman_hut_v1_4_2',
  'founders_plot_journal_trigger_v1_4_2',
  'founders_plot_approval_inbox_v1_4_2',
  'founders_plot_empty_lot_v1_4_2',
  'founders_plot_locked_lot_v1_4_2',
  'clover_idle_v1_4_2',
  'clover_observing_v1_4_2',
  'clover_thinking_v1_4_2',
  'clover_acting_v1_4_2',
  'clover_waiting_approval_v1_4_2',
  'clover_celebrating_v1_4_2',
  'clover_paused_v1_4_2',
  'clover_blocked_v1_4_2',
  'clover_restart_needed_v1_4_2',
  'founders_plot_overlay_construction_v1_4_2',
  'founders_plot_overlay_ready_sparkle_v1_4_2',
  'founders_plot_overlay_blocked_badge_v1_4_2',
  'founders_plot_overlay_upgrade_badge_v1_4_2',
  'founders_plot_overlay_approval_needed_v1_4_2',
  'founders_plot_overlay_contract_available_v1_4_2',
  'founders_plot_overlay_producing_timer_frame_v1_4_2',
  'hero_cast_group_key_art_v1_4_2',
  'hero_prairie_dog_ranger_v1_4_2',
  'hero_sheriff_lobster_v1_4_2',
  'hero_chibi_homesteader_v1_4_2',
  'hero_wizard_kid_v1_4_2',
  'town_shell_background_v1_4_2',
  'townhall_onboarding_illustration_v1_4_2',
  'brain_connect_marker_v1_4_2'
];
const BYTE_BUDGET = 4_500_000;

function sha256File(relativePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(repoRoot, relativePath))).digest('hex');
}

test('asset manifest uses the V1.4.2 schema and contains the full production pack', () => {
  assert.ok(fs.existsSync(manifestPath));
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const assets = Array.isArray(manifest?.assets) ? manifest.assets : [];
  const ids = new Set(assets.map((asset) => String(asset?.id || '')));

  assert.equal(manifest.schemaVersion, 'v1.4.2');
  assert.equal(manifest.styleFamily, 'agent-town-frontier-storybook-v1_4_2');
  assert.ok(Array.isArray(manifest?.referenceInputs));
  assert.equal(manifest?.videoReference?.url, 'https://www.youtube.com/watch?v=ZW7tUUZqhdY');
  assert.equal(manifest?.videoReference?.usage, 'tone_motion_story_reference_only');
  assert.equal(manifest?.videoReference?.frameExtractionRequired, false);
  assert.equal(manifest?.heroFrame?.screenshotPrefix, 'founders-v1-4-2-full-route-hero-1280');
  REQUIRED_IDS.forEach((id) => assert.ok(ids.has(id), `missing ${id}`));
});

test('every asset entry is prompt-linked, hash-backed, and points at a real file under budget', () => {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const assets = Array.isArray(manifest?.assets) ? manifest.assets : [];
  let totalBytes = 0;

  for (const asset of assets) {
    const relativePath = String(asset?.path || '');
    const filePath = path.join(repoRoot, relativePath);
    assert.ok(relativePath, `missing path for ${asset?.id}`);
    assert.ok(fs.existsSync(filePath), `missing file for ${asset?.id}`);
    assert.equal(asset?.status, 'approved');
    assert.ok(ALLOWED_GENERATORS.has(String(asset?.generatedBy || '')), `unsupported generatedBy for ${asset?.id}`);
    assert.ok(String(asset?.model || '').trim(), `missing model for ${asset?.id}`);
    assert.ok(asset?.generationMode, `missing generationMode for ${asset?.id}`);
    assert.ok(asset?.promptFile, `missing promptFile for ${asset?.id}`);
    assert.ok(fs.existsSync(path.join(repoRoot, asset.promptFile)), `missing prompt file for ${asset?.id}`);
    assert.ok(asset?.promptHash, `missing promptHash for ${asset?.id}`);
    assert.ok(asset?.candidateId, `missing candidateId for ${asset?.id}`);
    assert.ok(asset?.candidatePath, `missing candidatePath for ${asset?.id}`);
    assert.ok(Array.isArray(asset?.referenceInputs), `missing referenceInputs for ${asset?.id}`);
    assert.ok(asset.referenceInputs.length > 0, `empty referenceInputs for ${asset?.id}`);
    assert.equal(typeof asset?.referenceHashes, 'object', `missing referenceHashes for ${asset?.id}`);
    assert.ok(Array.isArray(asset?.postProcessing), `missing postProcessing for ${asset?.id}`);
    assert.ok(asset?.dimensions, `missing dimensions for ${asset?.id}`);
    assert.ok(Number(asset?.byteSize || 0) > 0, `missing byteSize for ${asset?.id}`);
    assert.ok(Number(asset?.bytes || 0) > 0, `missing bytes for ${asset?.id}`);
    assert.ok(asset?.alt, `missing alt for ${asset?.id}`);
    assert.ok(asset?.approvedBy, `missing approvedBy for ${asset?.id}`);
    assert.ok(asset?.approvedAt, `missing approvedAt for ${asset?.id}`);
    assert.ok(asset?.approvalNotes, `missing approvalNotes for ${asset?.id}`);
    assert.ok(asset?.optimizationStatus, `missing optimizationStatus for ${asset?.id}`);
    assert.equal(asset?.styleReview?.passed, true, `styleReview failed for ${asset?.id}`);
    for (const referencePath of asset.referenceInputs) {
      assert.ok(fs.existsSync(path.join(repoRoot, referencePath)), `missing reference input ${referencePath} for ${asset?.id}`);
      assert.equal(asset.referenceHashes[referencePath], sha256File(referencePath), `stale reference hash for ${asset?.id}`);
    }
    totalBytes += Number(asset?.bytes || 0);
  }

  assert.ok(totalBytes <= BYTE_BUDGET, `asset pack too large: ${totalBytes}`);
});

test('primary-view assets and hero-frame metadata carry explicit human signoff', () => {
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
