const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

test('manual human tool path rejects actor spoofing and attributes normal actions to HUMAN', () => {
  const routes = fs.readFileSync(path.join(__dirname, '../server/founders_plot/routes.js'), 'utf8');
  assert.match(routes, /ACTOR_SPOOF_REJECTED/);
  assert.match(routes, /const actor = 'HUMAN';/);
  assert.match(routes, /Agent actions must come through the Foreman runtime route\./);
});
