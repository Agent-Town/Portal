const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('hero source index exists and records the partial recovery honestly', () => {
  const target = path.join(__dirname, '../docs/brand/HERO_VIDEO_SOURCE_INDEX.md');
  const text = fs.readFileSync(target, 'utf8');

  assert.match(text, /status:\s*partial/);
  assert.match(text, /Brand kit\/src\/app\/components\/CharacterStyleGuide\.tsx/);
  assert.match(text, /wizard kid source file or script/i);
  assert.match(text, /prairie dog source file or script/i);
});
