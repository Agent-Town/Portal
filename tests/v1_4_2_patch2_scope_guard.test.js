const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { repoRoot } = require('./v1_4_2_test_helpers');

const ROOTS = [
  path.join(repoRoot, 'public'),
  path.join(repoRoot, 'server'),
  path.join(repoRoot, 'vendors'),
  path.join(repoRoot, 'specs', '02_api_contract.md'),
  path.join(repoRoot, 'public', 'experiences', 'founders-plot', 'tools.md')
];
const ALLOWED_PLOT_TOOLS = new Set([
  'et.plot.action',
  'et.plot.claim_reward',
  'et.plot.collect_outputs',
  'et.plot.contracts',
  'et.plot.get_state',
  'et.plot.journal',
  'et.plot.place_building',
  'et.plot.queue_job',
  'et.plot.request_user_approval',
  'et.plot.set_priority',
  'et.plot.town',
  'et.plot.upgrade_building'
]);

function walkFiles(rootDir) {
  const entries = [];
  if (!fs.existsSync(rootDir)) return entries;
  const stat = fs.statSync(rootDir);
  if (!stat.isDirectory()) return [rootDir];
  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'tmp') continue;
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      entries.push(...walkFiles(fullPath));
    } else if (/\.(js|md|html|css)$/i.test(entry.name)) {
      entries.push(fullPath);
    }
  }
  return entries;
}

test('Patch 2 does not introduce new gameplay tool surface', () => {
  const found = new Set();
  for (const root of ROOTS) {
    for (const filePath of walkFiles(root)) {
      const text = fs.readFileSync(filePath, 'utf8');
      for (const match of text.matchAll(/\bet\.plot\.[a-z_]+\b/g)) {
        found.add(match[0]);
      }
    }
  }

  assert.deepEqual([...found].sort(), [...ALLOWED_PLOT_TOOLS].sort());
});
