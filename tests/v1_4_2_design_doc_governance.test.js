const test = require('node:test');
const assert = require('node:assert/strict');
const { parseFrontMatter, readFile } = require('./v1_4_2_test_helpers');

test('V1.4.2 design docs carry the required GPT Image 2 governance rules', () => {
  const agents = readFile('AGENTS.md');
  const brand = readFile('Brand kit/guidelines/agent-town-design-pack/BRAND.md');
  const design = readFile('Brand kit/guidelines/agent-town-design-pack/DESIGN.md');
  const gameUx = readFile('Brand kit/guidelines/agent-town-design-pack/GAME_UX.md');
  const registry = readFile('Brand kit/guidelines/agent-town-design-pack/REGISTRY.md');

  assert.match(agents, /gpt-image-2/i);
  assert.match(agents, /candidate folders/i);

  assert.match(brand, /hero cast is the platform ensemble/i);
  assert.match(brand, /Clover Kincaid.*gameplay partner/is);

  const frontMatter = parseFrontMatter(design);
  assert.ok(frontMatter, 'DESIGN.md is missing YAML front matter');
  ['name', 'colors', 'typography', 'components'].forEach((key) => {
    assert.ok(Object.prototype.hasOwnProperty.call(frontMatter, key), `DESIGN.md front matter missing ${key}`);
  });
  assert.match(design, /^---\n[\s\S]*\n---\n/m);
  assert.match(design, /^## Asset Generation Law$/m);

  assert.match(gameUx, /Screenshot-first signoff/i);
  assert.match(gameUx, /full player route/i);

  assert.match(registry, /gpt-image-2-prompt-contract/i);
  assert.match(registry, /asset-manifest-entry/i);
  assert.match(registry, /hero-cast-reference-card/i);
});

test('DESIGN.md front matter is structurally sound for local lint fallback', () => {
  const design = readFile('Brand kit/guidelines/agent-town-design-pack/DESIGN.md');
  const frontMatter = parseFrontMatter(design);

  assert.ok(frontMatter, 'missing front matter');
  const text = String(design || '');
  assert.ok(text.startsWith('---\n'), 'front matter must start at file top');
  assert.match(text, /\n---\n\s*# DESIGN\.md/s);

  ['primary', 'background', 'surface', 'ink'].forEach((token) => {
    assert.match(text, new RegExp(`\\b${token}:\\s*["'#]`, 'i'));
  });
  assert.match(text, /\{colors\.background\}/);
  assert.match(text, /\{colors\.ink\}/);
});
