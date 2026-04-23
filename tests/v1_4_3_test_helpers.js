const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const repoRoot = path.join(__dirname, '..');
const manifestPath = path.join(repoRoot, 'public', 'assets', 'platform', 'asset-manifest.json');
const inventoryPath = path.join(repoRoot, 'docs', 'visual', 'APP_WIDE_ASSET_INVENTORY_V1_4_3.md');
const promptRoot = path.join(repoRoot, 'specs', 'prompts', 'v1_4_3');
const promptMirrorRoot = path.join(repoRoot, 'public', 'assets', 'platform', 'prompts', 'v1_4_3');
const platformBudgetBytes = 8_388_608;

function readFile(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function loadManifest() {
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

function sha256File(relativeOrAbsolutePath) {
  const absolutePath = path.isAbsolute(relativeOrAbsolutePath)
    ? relativeOrAbsolutePath
    : path.join(repoRoot, relativeOrAbsolutePath);
  return crypto.createHash('sha256').update(fs.readFileSync(absolutePath)).digest('hex');
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
    } else {
      entries.push(fullPath);
    }
  }
  return entries;
}

function listPromptFiles() {
  return walkFiles(promptRoot)
    .filter((filePath) => filePath.endsWith('.md'))
    .map((filePath) => path.relative(repoRoot, filePath).replace(/\\/g, '/'))
    .sort((a, b) => a.localeCompare(b));
}

function listPromptMirrorFiles() {
  return walkFiles(promptMirrorRoot)
    .filter((filePath) => filePath.endsWith('.md'))
    .map((filePath) => path.relative(repoRoot, filePath).replace(/\\/g, '/'))
    .sort((a, b) => a.localeCompare(b));
}

function parseInventoryRows() {
  const text = fs.readFileSync(inventoryPath, 'utf8');
  return text
    .split('\n')
    .filter((line) => /^\|\s+[^-]/.test(line) && !/\|\s*ID\s*\|/i.test(line))
    .map((line) => {
      const parts = line.split('|').slice(1, -1).map((part) => part.trim());
      return {
        raw: line,
        id: parts[0],
        currentPath: parts[1].replace(/^`|`$/g, ''),
        usedBy: parts[2],
        surface: parts[3],
        role: parts[4],
        currentStatus: parts[5],
        priority: parts[6],
        replacementPrompt: parts[7].replace(/^`|`$/g, ''),
        replacementPath: parts[8].replace(/^`|`$/g, ''),
        notes: parts[9]
      };
    });
}

function collectInventoryFiles() {
  const roots = [
    path.join(repoRoot, 'public', 'assets'),
    path.join(repoRoot, 'public', 'images'),
    path.join(repoRoot, 'public', 'brand-kit'),
    path.join(repoRoot, 'public', 'agenttown.jpeg'),
    path.join(repoRoot, 'public', 'logo.jpg'),
    path.join(repoRoot, 'public', 'background.webp'),
    path.join(repoRoot, 'public', 'favicon-16x16.png'),
    path.join(repoRoot, 'public', 'favicon-32x32.png'),
    path.join(repoRoot, 'public', 'favicon.ico')
  ];
  return roots
    .flatMap((rootPath) => walkFiles(rootPath))
    .map((filePath) => path.relative(repoRoot, filePath).replace(/\\/g, '/'))
    .filter((relativePath) => !relativePath.startsWith('public/experiences/founders-plot/assets/'))
    .sort((a, b) => a.localeCompare(b));
}

function collectPlayerFacingAssetRefs() {
  const roots = [
    path.join(repoRoot, 'public'),
    path.join(repoRoot, 'server', 'index.js')
  ];
  const refs = new Set();
  const patterns = [
    /['"`](\/[^'"`\s)]+\.(?:png|jpe?g|webp|svg|ico))['"`]/g,
    /url\((['"]?)(\/[^'")\s]+\.(?:png|jpe?g|webp|svg|ico))\1\)/g
  ];

  for (const root of roots) {
    for (const filePath of walkFiles(root)) {
      const relative = path.relative(repoRoot, filePath).replace(/\\/g, '/');
      if (relative.startsWith('public/experiences/founders-plot/')) continue;
      if (!/\.(html|css|js)$/i.test(filePath)) continue;
      const text = fs.readFileSync(filePath, 'utf8');
      for (const pattern of patterns) {
        for (const match of text.matchAll(pattern)) {
          const assetPath = String(match[2] || match[1] || '').trim();
          if (!assetPath) continue;
          refs.add(`public${assetPath}`);
        }
      }
    }
  }

  return Array.from(refs).sort((a, b) => a.localeCompare(b));
}

module.exports = {
  collectInventoryFiles,
  collectPlayerFacingAssetRefs,
  inventoryPath,
  listPromptFiles,
  listPromptMirrorFiles,
  loadManifest,
  manifestPath,
  parseFrontMatter,
  parseInventoryRows,
  platformBudgetBytes,
  promptMirrorRoot,
  promptRoot,
  readFile,
  repoRoot,
  sha256File,
  walkFiles
};
