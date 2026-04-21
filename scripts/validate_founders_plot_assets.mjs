import fs from 'node:fs';
import path from 'node:path';

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const assetRoot = path.join(rootDir, 'public/experiences/founders-plot/assets');
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
  'clover_restart_needed',
  'overlay_construction',
  'overlay_ready_sparkle',
  'overlay_blocked_badge',
  'overlay_upgrade_badge',
  'overlay_approval_needed',
  'overlay_contract_available',
  'overlay_producing_timer_frame'
];

function fail(message) {
  throw new Error(message);
}

function main() {
  if (!fs.existsSync(manifestPath)) {
    fail(`Missing manifest: ${manifestPath}`);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest?.styleFamily !== 'agent-town-frontier-storybook-v1') {
    fail(`Unexpected styleFamily: ${manifest?.styleFamily || 'missing'}`);
  }
  const assets = Array.isArray(manifest?.assets) ? manifest.assets : [];
  const byId = new Map(assets.map((asset) => [String(asset?.id || ''), asset]));

  REQUIRED_IDS.forEach((id) => {
    if (!byId.has(id)) fail(`Missing required asset: ${id}`);
  });

  let totalBytes = 0;
  for (const asset of assets) {
    const id = String(asset?.id || '');
    const relativePath = String(asset?.path || '').trim();
    if (!relativePath) fail(`Asset ${id} missing path`);
    const filePath = path.join(assetRoot, relativePath);
    if (!fs.existsSync(filePath)) fail(`Missing asset file for ${id}: ${filePath}`);
    if (!asset?.promptFile) fail(`Asset ${id} missing promptFile`);
    if (!asset?.license) fail(`Asset ${id} missing license`);
    if (!asset?.reviewer) fail(`Asset ${id} missing reviewer`);
    if (!asset?.approvalStatus) fail(`Asset ${id} missing approvalStatus`);
    if (!asset?.optimizationStatus) fail(`Asset ${id} missing optimizationStatus`);
    if (!asset?.styleReview?.passed) fail(`Asset ${id} missing passed style review`);
    totalBytes += Number(asset?.bytes || 0);
  }

  if (totalBytes > 2_800_000) {
    fail(`Asset pack exceeds budget: ${totalBytes}`);
  }

  console.log(`Validated Founders Plot assets: ${assets.length} files, ${totalBytes} bytes total.`);
}

main();
