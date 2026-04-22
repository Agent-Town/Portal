const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.join(__dirname, '..');
const signoffPath = path.join(repoRoot, 'docs', 'visual', 'VISUAL_SIGNOFF_SHEET_V1_4_2.md');

test('V1.4.2 visual signoff sheet records the approved art-baseline truth', () => {
  assert.ok(fs.existsSync(signoffPath), 'missing V1.4.2 visual signoff sheet');
  const text = fs.readFileSync(signoffPath, 'utf8');

  assert.match(text, /Reviewer \/ art owner:\s*Robin/i);
  assert.match(text, /Date:\s*2026-04-22/i);
  assert.match(text, /Final decision:\s*Approved/i);
  assert.match(text, /current .* art baseline/i);
  assert.match(text, /AI SLOP/i);
  assert.match(text, /product-owner-approved/i);
  assert.match(text, /targeted .* cleanup/i);

  [
    'Reviewer / art owner: TBD',
    'Date: TBD',
    'Final decision: TBD',
    'Screenshot status: TBD'
  ].forEach((placeholder) => {
    assert.ok(!text.includes(placeholder), `unexpected signoff placeholder: ${placeholder}`);
  });
});
