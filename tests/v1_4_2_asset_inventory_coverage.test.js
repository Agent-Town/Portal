const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { collectPlayerFacingAssetRefs, inventoryPath, parseInventoryRows, wildcardToRegExp } = require('./v1_4_2_test_helpers');

const ALLOWED_CLASSIFICATIONS = new Set([
  'KEEP_AS_REFERENCE',
  'REGENERATE_P0',
  'REGENERATE_P1',
  'DEPRECATE_AFTER_REPLACEMENT',
  'DEBUG_ONLY',
  'DO_NOT_TOUCH'
]);

test('asset inventory exists and covers every normal player-facing asset reference', () => {
  assert.ok(fs.existsSync(inventoryPath), 'missing V1.4.2 asset inventory');
  const rows = parseInventoryRows();
  assert.ok(rows.length > 0, 'inventory must define rows');
  rows.forEach((row) => {
    assert.ok(ALLOWED_CLASSIFICATIONS.has(row.classification), `invalid classification for ${row.pattern}`);
  });

  const refs = collectPlayerFacingAssetRefs();
  assert.ok(refs.length > 0, 'expected to discover player-facing asset refs');
  const missing = refs.filter((assetPath) => !rows.some((row) => wildcardToRegExp(row.pattern).test(assetPath)));
  assert.deepEqual(missing, [], `inventory missing asset refs:\n${missing.join('\n')}`);
});
