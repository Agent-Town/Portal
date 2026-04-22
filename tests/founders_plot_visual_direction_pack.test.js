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

test('hero-cast addendum docs exist for V1.4.1 follow-on visual work', () => {
  const addendum = path.join(__dirname, '../docs/brand/HERO_CAST_AND_VIDEO_SOURCE_ADDENDUM_V1_4_1.md');
  const noExtraction = path.join(__dirname, '../docs/brand/HERO_VIDEO_NO_EXTRACTION_UPDATE_V1_4_1.md');
  const promptLibrary = path.join(__dirname, '../docs/visual/gpt-image-2-prompts/hero_cast_prompt_library_v1_4_1.md');

  assert.ok(fs.existsSync(addendum));
  assert.ok(fs.existsSync(noExtraction));
  assert.ok(fs.existsSync(promptLibrary));
  assert.match(fs.readFileSync(addendum, 'utf8'), /The hero cast is the platform ensemble/i);
  assert.match(fs.readFileSync(noExtraction, 'utf8'), /Do \*\*not\*\* require video-frame extraction/i);
});
