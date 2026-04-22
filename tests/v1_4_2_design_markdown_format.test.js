const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { parseFrontMatter, readFile, repoRoot } = require('./v1_4_2_test_helpers');

function lineCount(text) {
  return String(text || '').split('\n').length;
}

test('V1.4.2 cleanup design docs stay readable and lintable', () => {
  const designPath = path.join(repoRoot, 'Brand kit', 'guidelines', 'agent-town-design-pack', 'DESIGN.md');
  const gameUxPath = path.join(repoRoot, 'Brand kit', 'guidelines', 'agent-town-design-pack', 'GAME_UX.md');
  const registryPath = path.join(repoRoot, 'Brand kit', 'guidelines', 'agent-town-design-pack', 'REGISTRY.md');
  const agentsPath = path.join(repoRoot, 'AGENTS.md');

  const designText = readFile(path.relative(repoRoot, designPath));
  const gameUxText = readFile(path.relative(repoRoot, gameUxPath));
  const registryText = readFile(path.relative(repoRoot, registryPath));
  const agentsText = readFile(path.relative(repoRoot, agentsPath));
  const frontMatter = parseFrontMatter(designText);

  assert.ok(designText.startsWith('---\n'), 'DESIGN.md must start with YAML front matter');
  assert.ok(/^---\n[\s\S]*?\n---\n/m.test(designText), 'DESIGN.md must include a closing YAML fence');
  ['version', 'name', 'colors', 'typography', 'components'].forEach((key) => {
    assert.ok(Object.prototype.hasOwnProperty.call(frontMatter || {}, key), `DESIGN.md front matter missing ${key}`);
  });
  ['## Overview', '## Colors', '## Components', "## Do's and Don'ts"].forEach((heading) => {
    assert.ok(designText.includes(heading), `DESIGN.md missing ${heading}`);
  });
  assert.ok(lineCount(designText) >= 40, 'DESIGN.md must remain multi-line and readable');

  [
    ['GAME_UX.md', gameUxText],
    ['REGISTRY.md', registryText],
    ['AGENTS.md', agentsText]
  ].forEach(([label, text]) => {
    assert.ok(lineCount(text) >= 20, `${label} must remain multi-line and readable`);
    assert.match(text, /V1\.4\.2/i, `${label} must mention the V1.4.2 cleanup lane`);
    assert.ok(!/^[^\n]{400,}$/.test(text), `${label} looks compressed into one line`);
  });
});
