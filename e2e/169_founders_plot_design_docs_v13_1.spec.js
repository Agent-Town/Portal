const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('V1.3.1 design governance docs contain the signoff-pass rules', async () => {
  const agents = read('AGENTS.md');
  const brand = read('Brand kit/guidelines/agent-town-design-pack/BRAND.md');
  const design = read('Brand kit/guidelines/agent-town-design-pack/DESIGN.md');
  const gameUx = read('Brand kit/guidelines/agent-town-design-pack/GAME_UX.md');
  const registry = read('Brand kit/guidelines/agent-town-design-pack/REGISTRY.md');
  const implPlan = read('IMPLEMENTATION_PLAN.md');

  expect(agents).toContain('Source-of-truth documents');
  expect(agents).toContain('Founders Plot visual/game-surface rule');

  expect(brand).toContain('primary-view assets');
  expect(brand).toContain('approved by a named human art/design owner');

  expect(design).toContain('clover-target-link');
  expect(design).toContain('full-route');

  expect(gameUx).toContain('full player route');
  expect(gameUx).toContain('Agent Comms / worker-debug console');

  [
    'hero-frame-baseline',
    'clover-target-link',
    'objective-attention-ring',
    'mobile-label-controller',
    'badge-stack-governor',
    'devtools-quarantine-toggle'
  ].forEach((needle) => expect(registry).toContain(needle));

  expect(implPlan).toMatch(/deprecated|historical|legacy/i);
});
