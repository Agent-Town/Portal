import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const manifestPath = path.join(repoRoot, 'public/experiences/founders-plot/assets/asset-manifest.json');
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
const ALLOWED_GENERATORS = new Set(['gpt-image-2', 'codex-svg', 'reference-normalized']);
const REQUIRED_LAYERED_FORBIDDEN = [
  'hq',
  'lumber_camp',
  'farm_plot',
  'quarry',
  'workshop',
  'market_stall',
  'contract_board',
  'public_square',
  'foreman_hut',
  'clover',
  'timer_rings',
  'objective_markers'
];

function fail(message) {
  throw new Error(message);
}

function sha256File(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  return crypto.createHash('sha256').update(fs.readFileSync(absolutePath)).digest('hex');
}

function validateReferenceInputs(asset) {
  const referenceInputs = Array.isArray(asset?.referenceInputs) ? asset.referenceInputs : [];
  if (referenceInputs.length === 0) {
    fail(`Asset ${asset.id} must declare at least one reference input`);
  }
  for (const relativePath of referenceInputs) {
    const absolutePath = path.join(repoRoot, relativePath);
    if (!fs.existsSync(absolutePath)) {
      fail(`Asset ${asset.id} is missing reference input ${relativePath}`);
    }
    if (asset?.referenceHashes?.[relativePath] !== sha256File(relativePath)) {
      fail(`Asset ${asset.id} has a stale reference hash for ${relativePath}`);
    }
  }
}

function main() {
  if (!fs.existsSync(manifestPath)) {
    fail(`Missing manifest: ${manifestPath}`);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest?.schemaVersion !== 'v1.4.2') {
    fail(`Unexpected schemaVersion: ${manifest?.schemaVersion || 'missing'}`);
  }
  if (manifest?.styleFamily !== 'agent-town-frontier-storybook-v1_4_2') {
    fail(`Unexpected styleFamily: ${manifest?.styleFamily || 'missing'}`);
  }
  if (manifest?.release !== 'v1.4.2-patch2-mobile-hq') {
    fail(`Unexpected release: ${manifest?.release || 'missing'}`);
  }
  if (manifest?.heroFrame?.approvalStatus !== 'approved') {
    fail('heroFrame approval metadata must be approved');
  }
  if (!manifest?.heroFrame?.approvedBy || !manifest?.heroFrame?.approvedAt || !manifest?.heroFrame?.approvalNotes) {
    fail('heroFrame metadata is incomplete');
  }
  if (manifest?.heroFrame?.screenshotPrefix !== 'founders-v1-4-2-full-route-hero-1280') {
    fail(`Unexpected heroFrame screenshotPrefix: ${manifest?.heroFrame?.screenshotPrefix || 'missing'}`);
  }
  if (!Array.isArray(manifest?.referenceInputs) || manifest.referenceInputs.length < 4) {
    fail('Missing root-level referenceInputs metadata');
  }
  if (manifest?.videoReference?.url !== 'https://www.youtube.com/watch?v=ZW7tUUZqhdY') {
    fail('Missing or unexpected videoReference.url');
  }
  if (manifest?.videoReference?.usage !== 'tone_motion_story_reference_only') {
    fail('Missing or unexpected videoReference.usage');
  }
  if (manifest?.videoReference?.frameExtractionRequired !== false) {
    fail('videoReference.frameExtractionRequired must be false');
  }

  const assets = Array.isArray(manifest?.assets) ? manifest.assets : [];
  const byId = new Map(assets.map((asset) => [String(asset?.id || ''), asset]));
  REQUIRED_IDS.forEach((id) => {
    if (!byId.has(id)) fail(`Missing required asset: ${id}`);
  });

  let totalBytes = 0;
  for (const asset of assets) {
    const id = String(asset?.id || '').trim();
    const relativePath = String(asset?.path || '').trim();
    if (!id) fail('Asset entry missing id');
    if (!relativePath) fail(`Asset ${id} missing path`);
    const filePath = path.join(repoRoot, relativePath);
    if (!fs.existsSync(filePath)) fail(`Missing asset file for ${id}: ${filePath}`);
    if (asset?.status !== 'approved') fail(`Asset ${id} must be approved`);
    if (!ALLOWED_GENERATORS.has(String(asset?.generatedBy || ''))) {
      fail(`Asset ${id} has an unsupported generatedBy value: ${asset?.generatedBy || 'missing'}`);
    }
    if (!asset?.generationMode) fail(`Asset ${id} missing generationMode`);
    if (!asset?.model) fail(`Asset ${id} missing model`);
    if (!asset?.promptFile) fail(`Asset ${id} missing promptFile`);
    const promptPath = path.join(repoRoot, String(asset.promptFile));
    if (!fs.existsSync(promptPath)) fail(`Asset ${id} promptFile does not exist: ${asset.promptFile}`);
    if (String(asset?.buildingType || '').toUpperCase() === 'HQ') {
      if (!asset?.promptMirrorFile) fail(`HQ asset ${id} missing promptMirrorFile`);
      const promptMirrorPath = path.join(repoRoot, String(asset.promptMirrorFile));
      if (!fs.existsSync(promptMirrorPath)) fail(`HQ asset ${id} promptMirrorFile does not exist: ${asset.promptMirrorFile}`);
    }
    if (!asset?.promptHash) fail(`Asset ${id} missing promptHash`);
    if (!asset?.candidateId) fail(`Asset ${id} missing candidateId`);
    if (!asset?.candidatePath) fail(`Asset ${id} missing candidatePath`);
    if (!Array.isArray(asset?.postProcessing)) fail(`Asset ${id} missing postProcessing`);
    if (!asset?.dimensions || Number(asset?.width || 0) <= 0 || Number(asset?.height || 0) <= 0) {
      fail(`Asset ${id} is missing dimensions/width/height metadata`);
    }
    if (Number(asset?.byteSize || 0) <= 0 || Number(asset?.bytes || 0) <= 0) {
      fail(`Asset ${id} must declare byteSize and bytes`);
    }
    if (!asset?.alt) fail(`Asset ${id} missing alt text`);
    if (!asset?.approvedBy || !asset?.approvedAt || !asset?.approvalNotes) {
      fail(`Asset ${id} missing approval metadata`);
    }
    if (!asset?.optimizationStatus) fail(`Asset ${id} missing optimizationStatus`);
    if (asset?.styleReview?.passed !== true) fail(`Asset ${id} failed styleReview`);
    if (String(id).startsWith('founders_plot_scene_')) {
      if (asset?.layerRole !== 'scene-base') fail(`Scene asset ${id} must declare layerRole=scene-base`);
      if (asset?.sceneLayering?.mode !== 'layered_plates') fail(`Scene asset ${id} must declare layered_plates mode`);
      if (asset?.sceneLayering?.containsLiveStatefulObjects !== false) fail(`Scene asset ${id} must forbid baked live objects`);
      for (const forbiddenId of REQUIRED_LAYERED_FORBIDDEN) {
        if (!Array.isArray(asset?.sceneLayering?.forbiddenBakedContent) || !asset.sceneLayering.forbiddenBakedContent.includes(forbiddenId)) {
          fail(`Scene asset ${id} missing forbidden baked content ${forbiddenId}`);
        }
      }
    }
    if (String(id).startsWith('clover_')) {
      if (asset?.layerRole !== 'character') fail(`Clover asset ${id} must declare layerRole=character`);
      if (asset?.characterId !== 'clover') fail(`Clover asset ${id} must declare characterId=clover`);
      if (asset?.stateDriven !== true) fail(`Clover asset ${id} must be stateDriven`);
    }
    validateReferenceInputs(asset);
    totalBytes += Number(asset?.bytes || 0);
  }

  if (totalBytes > BYTE_BUDGET) {
    fail(`Asset pack exceeds budget: ${totalBytes}`);
  }

  console.log(`Validated Founders Plot V1.4.2 assets: ${assets.length} assets, ${totalBytes} bytes total.`);
}

main();
