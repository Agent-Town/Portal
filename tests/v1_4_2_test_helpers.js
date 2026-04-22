const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const repoRoot = path.join(__dirname, '..');
const manifestPath = path.join(repoRoot, 'public', 'experiences', 'founders-plot', 'assets', 'asset-manifest.json');
const inventoryPath = path.join(repoRoot, 'docs', 'visual', 'ASSET_INVENTORY_V1_4_2.md');

function readFile(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function loadManifest() {
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

function sha256Text(text) {
  return crypto.createHash('sha256').update(String(text || ''), 'utf8').digest('hex');
}

function sha256File(relativeOrAbsolutePath) {
  const target = path.isAbsolute(relativeOrAbsolutePath)
    ? relativeOrAbsolutePath
    : path.join(repoRoot, relativeOrAbsolutePath);
  return crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex');
}

function parseFrontMatter(markdown) {
  const match = String(markdown || '').match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return null;
  const result = {};
  let currentArrayKey = '';
  for (const rawLine of match[1].split('\n')) {
    const line = rawLine.replace(/\r/g, '');
    if (!line.trim()) continue;
    const arrayMatch = line.match(/^\s*-\s*(.+?)\s*$/);
    if (arrayMatch && currentArrayKey) {
      if (!Array.isArray(result[currentArrayKey])) result[currentArrayKey] = [];
      result[currentArrayKey].push(arrayMatch[1].replace(/^["']|["']$/g, ''));
      continue;
    }
    const keyValueMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!keyValueMatch) continue;
    const [, key, rawValue] = keyValueMatch;
    currentArrayKey = '';
    const value = rawValue.trim();
    if (!value) {
      result[key] = [];
      currentArrayKey = key;
      continue;
    }
    result[key] = value.replace(/^["']|["']$/g, '');
  }
  return result;
}

function parseInventoryRows() {
  const text = fs.readFileSync(inventoryPath, 'utf8');
  return text
    .split('\n')
    .filter((line) => {
      if (!/^\|\s*`?.+`?\s*\|/.test(line)) return false;
      if (/\|\s*Asset path \/ group\s*\|/i.test(line)) return false;
      if (/^\|\s*:?-{2,}:?\s*\|\s*:?-{2,}:?\s*\|\s*:?-{2,}:?\s*\|\s*:?-{2,}:?\s*\|?$/.test(line.trim())) return false;
      return true;
    })
    .map((line) => {
      const parts = line.split('|').slice(1, -1).map((part) => part.trim());
      return {
        raw: line,
        pattern: parts[0].replace(/^`|`$/g, ''),
        classification: parts[1],
        replacement: parts[2],
        notes: parts[3]
      };
    });
}

function walkFiles(rootDir) {
  const entries = [];
  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      entries.push(...walkFiles(fullPath));
    } else {
      entries.push(fullPath);
    }
  }
  return entries;
}

function wildcardToRegExp(pattern) {
  const escaped = String(pattern || '')
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`);
}

function collectPlayerFacingAssetRefs() {
  const roots = [
    path.join(repoRoot, 'public'),
    path.join(repoRoot, 'server', 'index.js')
  ];
  const allowExtensions = /\.(png|jpe?g|webp|svg)$/i;
  const ignorePath = /(openclaw-lite|trainer\.html$|research\/|(^|\/)tmp\/|claim-wallet\.html$|share\.html$|leaderboard\.html$|create\.html$|house\.html$|inbox\.html$)/i;
  const refs = new Set();
  const patterns = [
    /['"`](\/[^'"`\s)]+\.(?:png|jpe?g|webp|svg))['"`]/g,
    /url\((['"]?)(\/[^'")\s]+\.(?:png|jpe?g|webp|svg))\1\)/g
  ];

  for (const root of roots) {
    const targets = fs.statSync(root).isDirectory() ? walkFiles(root) : [root];
    for (const target of targets) {
      const relativeTarget = path.relative(repoRoot, target).replace(/\\/g, '/');
      if (ignorePath.test(relativeTarget)) continue;
      if (!/\.(html|css|js)$/i.test(target)) continue;
      const text = fs.readFileSync(target, 'utf8');
      for (const pattern of patterns) {
        for (const match of text.matchAll(pattern)) {
          const assetPath = String(match[2] || match[1] || '').trim();
          if (!assetPath || !allowExtensions.test(assetPath)) continue;
          refs.add(`public${assetPath}`);
        }
      }
    }
  }
  return Array.from(refs).sort();
}

module.exports = {
  collectPlayerFacingAssetRefs,
  inventoryPath,
  loadManifest,
  manifestPath,
  parseFrontMatter,
  parseInventoryRows,
  readFile,
  repoRoot,
  sha256File,
  sha256Text,
  wildcardToRegExp
};
