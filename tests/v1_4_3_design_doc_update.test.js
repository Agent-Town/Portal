const test = require('node:test');
const assert = require('node:assert/strict');
const { parseFrontMatter, readFile } = require('./v1_4_3_test_helpers');

test('V1.4.3 design and governance docs include the app-wide asset refresh rules', () => {
  const agents = readFile('AGENTS.md');
  const brand = readFile('Brand kit/guidelines/agent-town-design-pack/BRAND.md');
  const design = readFile('Brand kit/guidelines/agent-town-design-pack/DESIGN.md');
  const gameUx = readFile('Brand kit/guidelines/agent-town-design-pack/GAME_UX.md');
  const registry = readFile('Brand kit/guidelines/agent-town-design-pack/REGISTRY.md');
  const docsReadme = readFile('docs/README.md');

  assert.match(agents, /V1\.4\.3 app-wide GPT Image 2 asset refresh guardrail/);
  assert.match(agents, /Prompts are source files/);

  assert.match(brand, /V1\.4\.3 Platform Asset Direction/);
  assert.match(brand, /AI SLOP/);

  const frontMatter = parseFrontMatter(design);
  assert.ok(frontMatter, 'DESIGN.md front matter missing');
  assert.match(design, /assetGeneration:/);
  assert.match(design, /v1_4_3:/);
  assert.match(design, /App-Wide Asset Refresh/);

  assert.match(gameUx, /App-wide visual coherence rule/);
  assert.match(gameUx, /five-second test/i);

  assert.match(registry, /platform-start-gate-hero/);
  assert.match(registry, /platform-illustration-card/);
  assert.match(registry, /platform-empty-state/);

  assert.match(docsReadme, /app-wide GPT Image 2 asset refresh spec/i);
});
