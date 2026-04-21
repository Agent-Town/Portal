const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { test, expect } = require('@playwright/test');

const repoRoot = path.resolve(__dirname, '..');
const quarantineDoc = path.join(repoRoot, 'specs/OPENROUTER_SCOPE_QUARANTINE.md');
const quarantinedPaths = new Set([
  'public/llm_catalog.js',
  'public/house.js',
  'public/openclaw-lite/llm-config-library.js',
  'public/openclaw-lite/gateway.js',
  'public/openclaw-lite/gateway.js.map',
  'vendors/openclaw-lite-main/src/openclaw-lite/gateway.js'
]);

test('OpenRouter/proxy scope is either absent from the sprint diff or quarantined', async () => {
  const diffOutput = execFileSync('git', [
    'diff',
    '--name-only',
    'codex/founders-plot-v1-3-visual-surface...HEAD'
  ], {
    cwd: repoRoot,
    encoding: 'utf8'
  });
  const changed = diffOutput.split('\n').map((line) => line.trim()).filter(Boolean);
  const openRouterScope = changed.filter((file) => quarantinedPaths.has(file));

  if (openRouterScope.length === 0) {
    expect(openRouterScope).toHaveLength(0);
    return;
  }

  expect(fs.existsSync(quarantineDoc)).toBe(true);
  const text = fs.readFileSync(quarantineDoc, 'utf8');
  [
    '# OpenRouter Scope Quarantine',
    '## Why this is present',
    '## Files changed',
    '## Owner',
    '## Reviewer / signoff',
    '## Tests run',
    '## Impact on Founders Plot visual signoff',
    '## Rollback plan'
  ].forEach((needle) => expect(text).toContain(needle));
});
