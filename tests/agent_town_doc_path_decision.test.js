const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const ROOT = path.join(__dirname, '..');
const CANONICAL_DIR = 'Brand kit/guidelines/agent-town-design-pack';
const DESIGN_DOCS = ['BRAND.md', 'DESIGN.md', 'GAME_UX.md', 'REGISTRY.md'];

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

test('root design docs redirect to existing canonical design-pack files', () => {
  for (const doc of DESIGN_DOCS) {
    const rootPath = path.join(ROOT, doc);
    const canonicalRelPath = path.join(CANONICAL_DIR, doc);
    const canonicalPath = path.join(ROOT, canonicalRelPath);

    assert.ok(fs.existsSync(rootPath), `${doc} root redirect is missing`);
    assert.ok(fs.existsSync(canonicalPath), `${canonicalRelPath} canonical file is missing`);

    const rootDoc = fs.readFileSync(rootPath, 'utf8');
    assert.match(rootDoc, /Canonical source:/, `${doc} must identify its canonical source`);
    assert.ok(
      rootDoc.includes(canonicalRelPath),
      `${doc} must point to ${canonicalRelPath}`
    );
  }
});

test('AGENTS source-of-truth read order references existing docs', () => {
  const agents = read('AGENTS.md');
  const match = agents.match(/## Source-of-truth documents[\s\S]*?(?=\n## )/);
  assert.ok(match, 'AGENTS.md is missing source-of-truth section');

  const referencedPaths = [...match[0].matchAll(/`([^`]+)`/g)]
    .map((entry) => entry[1])
    .filter((entry) => entry.endsWith('.md') || entry.endsWith('/'));

  assert.ok(referencedPaths.length > 0, 'source-of-truth section should reference docs');

  for (const relPath of referencedPaths) {
    assert.ok(fs.existsSync(path.join(ROOT, relPath)), `${relPath} referenced by AGENTS.md does not exist`);
  }
});

test('current roadmap alignment docs are present and branch-aligned', () => {
  const roadmapSpec = read('specs/46_agent_town_future_roadmap_v1_5_to_v4.md');
  const roadmapDoc = read('docs/product/agent-town-future-roadmap-v1.5-to-v4.md');
  const threeAlignment = read('docs/technical/THREEJS_ROADMAP_ALIGNMENT.md');
  const securityGate = read('docs/security/V1_4_5_ACCOUNT_VAULT_SECURITY_GATE.md');

  assert.equal(roadmapDoc, roadmapSpec, 'product roadmap copy should match the specs copy');
  assert.match(roadmapSpec, /Three\.js is now the forward renderer path/);
  assert.match(roadmapSpec, /account\/wallet continuity/);
  assert.match(roadmapSpec, /V1\.5 — First-Hour and Return-Loop Expansion/);
  assert.match(threeAlignment, /Founders Plot V1\.x now uses Three\.js/);
  assert.match(securityGate, /no plaintext Brain secrets/i);
});
