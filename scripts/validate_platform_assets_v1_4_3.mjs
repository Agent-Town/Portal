import fs from 'node:fs';
import {
  buildInventoryRows,
  buildPlatformManifest,
  inventoryPath,
  platformBudgetBytes,
  platformManifestPath,
  platformPromptRoot,
  repoRoot,
  sha256File
} from './platform_assets_v1_4_3_lib.mjs';

function fail(message) {
  throw new Error(message);
}

const manifest = buildPlatformManifest();
if (!fs.existsSync(platformManifestPath)) {
  fail('Missing platform manifest. Run scripts/generate_platform_assets_v1_4_3.mjs first.');
}
const savedManifest = JSON.parse(fs.readFileSync(platformManifestPath, 'utf8'));
if (savedManifest.schemaVersion !== 'v1.4.3') fail(`Unexpected schemaVersion: ${savedManifest.schemaVersion}`);
if (savedManifest.totalBytes > platformBudgetBytes) fail(`Platform asset budget exceeded: ${savedManifest.totalBytes}`);
if (!Array.isArray(savedManifest.assets) || savedManifest.assets.length < 10) fail('Platform manifest is missing required assets.');
for (const asset of savedManifest.assets) {
  if (!asset.id || !asset.path || !asset.surface || !asset.role || !asset.model) {
    fail(`Asset entry is incomplete: ${JSON.stringify(asset)}`);
  }
  if (!fs.existsSync(`${repoRoot}/${asset.path}`)) {
    fail(`Missing asset file: ${asset.path}`);
  }
  if (asset.model === 'gpt-image-2') {
    if (!asset.promptFile || !asset.promptHash) fail(`Generated asset missing prompt provenance: ${asset.id}`);
    if (`sha256:${sha256File(asset.promptFile)}` !== asset.promptHash) {
      fail(`Stale prompt hash for ${asset.id}`);
    }
  }
  for (const ref of asset.referenceInputs || []) {
    if (!fs.existsSync(`${repoRoot}/${ref}`)) fail(`Missing reference input ${ref} for ${asset.id}`);
  }
}
if (!fs.existsSync(inventoryPath)) fail('Missing app-wide asset inventory.');
const inventory = fs.readFileSync(inventoryPath, 'utf8');
const rows = buildInventoryRows();
if (!inventory.includes('| ID | Current path | Used by | Surface | Role | Current status | Priority | Replacement prompt | Replacement path | Notes |')) {
  fail('Inventory table header missing.');
}
for (const row of rows.slice(0, 5)) {
  if (!inventory.includes(row.currentPath)) fail(`Inventory missing path ${row.currentPath}`);
}
if (!fs.existsSync(`${repoRoot}/${platformPromptRoot}`)) fail('Missing V1.4.3 prompt directory.');

console.log(`Validated V1.4.3 platform assets: ${savedManifest.assets.length} assets, ${savedManifest.totalBytes} bytes.`);
