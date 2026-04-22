const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('owner-supplied hero-cast reference files are present in the repo', () => {
  const root = path.join(__dirname, '../docs/brand/reference/hero-cast');
  [
    'prairie-dog-ranger-source.png',
    'sheriff-lobster-source.jpeg',
    'chibi-homesteader-girl-source.png',
    'wizard-kid-source.png'
  ].forEach((file) => {
    const target = path.join(root, file);
    assert.ok(fs.existsSync(target), `missing ${file}`);
    assert.ok(fs.statSync(target).size > 0, `empty ${file}`);
  });
});
