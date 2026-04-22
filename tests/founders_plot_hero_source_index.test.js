const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('hero source index records the recovered cast and the no-extraction rule', () => {
  const target = path.join(__dirname, '../docs/brand/HERO_VIDEO_SOURCE_INDEX.md');
  const text = fs.readFileSync(target, 'utf8');

  assert.match(text, /status:\s*found/);
  assert.match(text, /prairie-dog-ranger-source\.png/);
  assert.match(text, /sheriff-lobster-source\.jpeg/);
  assert.match(text, /chibi-homesteader-girl-source\.png/);
  assert.match(text, /wizard-kid-source\.png/);
  assert.match(text, /https:\/\/www\.youtube\.com\/watch\?v=ZW7tUUZqhdY/);
  assert.match(text, /frameExtractionRequired:\s*false/);
  assert.doesNotMatch(text, /status:\s*partial/);
});
