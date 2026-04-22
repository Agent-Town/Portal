const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.join(__dirname, '..');
const signoffPath = path.join(repoRoot, 'docs', 'visual', 'VISUAL_SIGNOFF_SHEET_V1_4_2_PATCH_2.md');

test('Patch 2 signoff sheet is evidence-ready and free of stale placeholders', () => {
  assert.ok(fs.existsSync(signoffPath), 'missing Patch 2 signoff sheet');
  const text = fs.readFileSync(signoffPath, 'utf8');

  assert.match(text, /Final V1\.4\.2 route signoff:\s*Ready for Robin review/i);
  assert.match(text, /Reviewer:\s*Robin/i);
  assert.match(text, /Date:\s*2026-04-22/i);
  assert.match(text, /Mobile default 390px calmness.*Complete/i);
  assert.match(text, /HQ visual delta.*Complete/i);
  assert.match(text, /Tests passed.*Complete/i);

  [
    'TBD',
    'Pending',
    'pending Patch 2'
  ].forEach((placeholder) => {
    assert.ok(!text.includes(placeholder), `unexpected placeholder remains: ${placeholder}`);
  });
});
