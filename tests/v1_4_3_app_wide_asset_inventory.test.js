const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {
  collectInventoryFiles,
  collectPlayerFacingAssetRefs,
  inventoryPath,
  parseInventoryRows
} = require('./v1_4_3_test_helpers');

test('V1.4.3 app-wide asset inventory exists and covers inventoried files', () => {
  assert.ok(fs.existsSync(inventoryPath), 'missing V1.4.3 asset inventory');
  const rows = parseInventoryRows();
  assert.ok(rows.length > 0, 'inventory must contain rows');
  const rowMap = new Map(rows.map((row) => [row.currentPath, row]));
  for (const relativePath of collectInventoryFiles()) {
    assert.ok(rowMap.has(relativePath), `inventory missing ${relativePath}`);
  }
});

test('inventory rows cover player-facing non-game asset references', () => {
  const rows = parseInventoryRows();
  const covered = new Set(rows.map((row) => row.currentPath));
  const missingRefs = collectPlayerFacingAssetRefs().filter((assetPath) => {
    if (assetPath.startsWith('public/experiences/founders-plot/')) return false;
    return !covered.has(assetPath);
  });
  assert.deepEqual(missingRefs, []);
});
