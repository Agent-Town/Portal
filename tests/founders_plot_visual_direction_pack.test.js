const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('visual direction pack exists with the required V1.4 sections', () => {
  const target = path.join(__dirname, '../docs/visual/FOUNDERS_PLOT_V1_4_VISUAL_DIRECTION_PACK.md');
  const text = fs.readFileSync(target, 'utf8');

  assert.match(text, /One-page visual brief/i);
  assert.match(text, /Mood board inventory/i);
  assert.match(text, /Reference board inventory/i);
  assert.match(text, /Anti-example strip/i);
  assert.match(text, /Required paintovers/i);
  assert.match(text, /Weak asset list/i);
  assert.match(text, /Signoff rubric/i);
});
