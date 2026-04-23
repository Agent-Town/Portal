const test = require('node:test');
const assert = require('node:assert/strict');
const { loadManifest, platformBudgetBytes } = require('./v1_4_3_test_helpers');

test('V1.4.3 platform pack remains inside the byte budget', () => {
  const manifest = loadManifest();
  assert.ok(Number(manifest.totalBytes) > 0);
  assert.ok(Number(manifest.totalBytes) <= platformBudgetBytes, `budget exceeded: ${manifest.totalBytes}`);
});
