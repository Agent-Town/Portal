#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

const DEFAULT_SQLITE_PATH = './data/erc8004.sqlite3';
const DEFAULT_OUT_DIR = './data/erc8004-score-image-plan';
const DEFAULT_STYLE_VERSION = 'v1';
const DEFAULT_STYLE_ANCHOR_FILE = './scripts/style_anchor_agent_town_wild_west.txt';
const DEFAULT_TOP_CHAIN_LIMIT = 8;
const DEFAULT_CHAIN_PRIORITY_MIN = 44;
const DEFAULT_AGENT_SCORE_MIN = 70;
const DEFAULT_LOW_SCORE_MAX = 40;
const DEFAULT_BATCH_SIZE = 200;
const DEFAULT_SHORTLIST_LIMIT = 600;
const DEFAULT_CANDIDATES_PER_PROMPT = 1;
const DEFAULT_ESTIMATED_UNIT_COST_USD = 0.042;
const DEFAULT_INCLUDE_TESTNETS = false;
const DEFAULT_FALLBACK_ASSIGNMENT = 'chain-default';
const DEFAULT_INCLUDE_SOLANA = true;
const DEFAULT_SOLANA_PREFIX = 'solana-devnet';
const DEFAULT_SOLANA_QUALITY_MIN = 0;

const CHAIN_FAMILY_BY_ID = new Map([
  [1, { key: 'ethereum', label: 'Ethereum' }],
  [11155111, { key: 'ethereum', label: 'Ethereum' }],
  [143, { key: 'monad', label: 'Monad' }],
  [10143, { key: 'monad', label: 'Monad' }],
  [8453, { key: 'base', label: 'Base' }],
  [84532, { key: 'base', label: 'Base' }],
  [100, { key: 'gnosis', label: 'Gnosis' }],
  [56, { key: 'bsc', label: 'BSC' }],
  [97, { key: 'bsc', label: 'BSC' }],
  [42161, { key: 'arbitrum', label: 'Arbitrum' }],
  [421614, { key: 'arbitrum', label: 'Arbitrum' }],
  [10, { key: 'optimism', label: 'Optimism' }],
  [137, { key: 'polygon', label: 'Polygon' }],
  [42220, { key: 'celo', label: 'Celo' }],
  [11142220, { key: 'celo', label: 'Celo' }],
  [43114, { key: 'avalanche', label: 'Avalanche' }],
  [43113, { key: 'avalanche', label: 'Avalanche' }],
  [4326, { key: 'megaeth', label: 'MegaETH' }],
  [6343, { key: 'megaeth', label: 'MegaETH' }],
  [1088, { key: 'metis', label: 'Metis' }],
  [59144, { key: 'linea', label: 'Linea' }],
  [534352, { key: 'scroll', label: 'Scroll' }],
  [5000, { key: 'mantle', label: 'Mantle' }],
  [196, { key: 'x-layer', label: 'X Layer' }],
  [2741, { key: 'abstract', label: 'Abstract' }],
  [167000, { key: 'taiko', label: 'Taiko' }]
]);

const CHAIN_STYLE_HINTS = Object.freeze({
  ethereum: 'clean silver-blue skyline, beacon arches, credible infra atmosphere',
  monad: 'high-energy neon green accents, geometric rhythm, playful velocity',
  base: 'electric cobalt structures, modular rails, developer-forward aesthetics',
  gnosis: 'teal civic district, calm utility, trust-forward public spaces',
  bsc: 'amber market district, high throughput energy, dense exchange lanes',
  arbitrum: 'layered elevated bridges, steel-indigo tones, efficient routing',
  optimism: 'warm orange highlights, optimistic civic design, open plazas',
  polygon: 'purple-magenta transit mesh, multi-lane creative corridors',
  celo: 'green-gold sustainable district, inclusive mobile-first motif',
  avalanche: 'crisp alpine lighting, red-white contrast, secure settlement feel',
  megaeth: 'ultra-fast experimental district, bright cyan edge lighting',
  metis: 'clean metropolitan business-core motif with practical services',
  linea: 'minimal line-work architecture, premium neutral color palette',
  scroll: 'layered parchment-to-neon contrast, deep corridor depth',
  mantle: 'sleek industrial towers, low-latency logistics atmosphere',
  'x-layer': 'hybrid exchange-finance district with luminous signage cues',
  abstract: 'conceptual bold forms, experimental yet legible composition',
  taiko: 'modular proving towers with disciplined high-contrast structure',
  solana: 'coastal neon megacity motif, ultra-fast lanes, clean high-contrast framing',
  unknown: 'futuristic but grounded district design, clean composition'
});

function printHelp() {
  process.stdout.write(
    [
      'Build deterministic ERC-8004 score-driven image generation artifacts from local data.',
      '',
      'Usage:',
      '  node scripts/build_erc8004_score_image_plan.js [options]',
      '',
      'Options:',
      `  --sqlite-path <path>              Source SQLite path (default: ${DEFAULT_SQLITE_PATH})`,
      '  --store-path <path>               Store sqlite path (default: server/store.js default)',
      `  --out-dir <path>                  Output directory (default: ${DEFAULT_OUT_DIR})`,
      `  --style-version <v>               Style version label (default: ${DEFAULT_STYLE_VERSION})`,
      `  --style-anchor-file <path>        Global style anchor file (default: ${DEFAULT_STYLE_ANCHOR_FILE})`,
      '  --style-anchor <text>             Global style anchor text override',
      `  --top-chain-limit <n>             Max unique chain prompts (default: ${DEFAULT_TOP_CHAIN_LIMIT})`,
      `  --chain-priority-min <n>          Minimum chain priority score for unique chain prompts (default: ${DEFAULT_CHAIN_PRIORITY_MIN})`,
      `  --agent-score-min <n>             Minimum total_score for unique-agent prompts (default: ${DEFAULT_AGENT_SCORE_MIN})`,
      `  --low-score-max <n>               Shared low-score cutoff (default: ${DEFAULT_LOW_SCORE_MAX})`,
      `  --shortlist-limit <n>             Ranked worthy shortlist cap (default: ${DEFAULT_SHORTLIST_LIMIT})`,
      `  --batch-size <n>                  Prompt batch size for .txt exports (default: ${DEFAULT_BATCH_SIZE})`,
      `  --candidates-per-prompt <n>       Image count multiplier estimate (default: ${DEFAULT_CANDIDATES_PER_PROMPT})`,
      `  --estimated-unit-cost-usd <n>     Cost estimate per generated image (default: ${DEFAULT_ESTIMATED_UNIT_COST_USD})`,
      `  --fallback-assignment <mode>      Non-special assignment mode: chain-default|shared-category (default: ${DEFAULT_FALLBACK_ASSIGNMENT})`,
      `  --solana-prefix <prefix>           Solana ERC-8004 id prefix (default: ${DEFAULT_SOLANA_PREFIX})`,
      `  --solana-quality-min <n>           Solana unique-image cutoff (quality_score > n, default: ${DEFAULT_SOLANA_QUALITY_MIN})`,
      `  --exclude-solana                   Exclude Solana agents from planning (default: ${DEFAULT_INCLUDE_SOLANA})`,
      '  --exclude-agent-file <path>       Optional list of ERC-8004 IDs forced to generic fallback',
      '  --exclude-agent-id <id>           Repeatable ERC-8004 ID forced to generic fallback',
      `  --include-testnets                Include testnet agents in per-agent planning (default: ${DEFAULT_INCLUDE_TESTNETS})`,
      '  --include-existing-share-hero     Include houses that already have share hero media',
      '  --help                            Show this help',
      '',
      'Outputs:',
      '  <out-dir>/analysis/signal-availability.json',
      '  <out-dir>/analysis/solana-signal-availability.json',
      '  <out-dir>/analysis/ranked-chain-distribution.(json|csv)',
      '  <out-dir>/analysis/ranked-chain-network-split.(json|csv)',
      '  <out-dir>/analysis/testnet-chain-distribution.(json|csv)',
      '  <out-dir>/analysis/ranked-worthy-agents.(jsonl|csv)',
      '  <out-dir>/prompts/*.txt|jsonl|csv',
      '  <out-dir>/prompts/chain-default-prompts.(txt|jsonl)',
      '  <out-dir>/ingest/agent-image-map.(jsonl|csv)',
      '  <out-dir>/summary.json'
    ].join('\n') + '\n'
  );
}

function nonEmpty(value) {
  if (typeof value !== 'string') return null;
  const out = value.trim();
  return out ? out : null;
}

function parseJsonSafe(raw) {
  const text = nonEmpty(raw);
  if (!text) return null;
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function parseIntStrict(raw, fallback) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.floor(n);
}

function parseFloatStrict(raw, fallback) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return n;
}

function toFiniteNumber(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' && !value.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toBool(value) {
  if (value === true || value === 1 || value === '1') return true;
  if (value === false || value === 0 || value === '0') return false;
  return false;
}

function oneLine(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function shortText(value, maxLen) {
  const text = nonEmpty(value);
  if (!text) return null;
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen - 1)}…`;
}

function safeFileId(input) {
  return String(input || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'item';
}

function deterministicSeed(key, styleVersion) {
  return crypto.createHash('sha256').update(`${key}|${styleVersion}`, 'utf8').digest('hex').slice(0, 16);
}

function csvEscape(value) {
  const text = value == null ? '' : String(value);
  if (!text.includes(',') && !text.includes('"') && !text.includes('\n')) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function writeJsonl(filePath, rows) {
  const body = rows.map((row) => JSON.stringify(row)).join('\n');
  fs.writeFileSync(filePath, `${body}${rows.length ? '\n' : ''}`, 'utf8');
}

function writeTxt(filePath, lines) {
  const out = lines.map((line) => oneLine(line));
  fs.writeFileSync(filePath, `${out.join('\n')}${out.length ? '\n' : ''}`, 'utf8');
}

function writeCsv(filePath, columns, rows) {
  const lines = [columns.join(',')];
  for (const row of rows) {
    lines.push(columns.map((col) => csvEscape(row[col])).join(','));
  }
  fs.writeFileSync(filePath, `${lines.join('\n')}\n`, 'utf8');
}

function quantile(values, q) {
  if (!Array.isArray(values) || values.length === 0) return 0;
  const sorted = values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] === undefined) return sorted[base];
  return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
}

function round2(value) {
  return Number(Number(value || 0).toFixed(2));
}

function pct(part, total) {
  const p = Number(part || 0);
  const t = Number(total || 0);
  if (!Number.isFinite(p) || !Number.isFinite(t) || t <= 0) return 0;
  return round2((p / t) * 100);
}

function normalizeFamily(rawLabel) {
  const label = nonEmpty(rawLabel) || 'Unknown';
  const key = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'unknown';
  return { key, label };
}

function familyForChain(chainId, chainName) {
  const known = CHAIN_FAMILY_BY_ID.get(Number(chainId));
  if (known) return known;
  if (nonEmpty(chainName)) return normalizeFamily(chainName);
  return { key: 'unknown', label: `Chain ${chainId}` };
}

function chainStyleHint(familyKey) {
  return CHAIN_STYLE_HINTS[familyKey] || CHAIN_STYLE_HINTS.unknown;
}

function chainTier(priorityScore) {
  const score = Number(priorityScore || 0);
  if (score >= 72) return 'elite';
  if (score >= 58) return 'strong';
  if (score >= 44) return 'emerging';
  return 'early';
}

function hasSqliteTable(db, tableName) {
  const table = nonEmpty(tableName);
  if (!table || !/^[a-zA-Z0-9_]+$/.test(table)) return false;
  const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ? LIMIT 1").get(table);
  return Boolean(row?.name);
}

function getSqliteColumns(db, tableName) {
  const table = nonEmpty(tableName);
  if (!table || !/^[a-zA-Z0-9_]+$/.test(table)) return new Set();
  const rows = db.prepare(`PRAGMA table_info(${table})`).all();
  return new Set(rows.map((row) => String(row?.name || '').trim()).filter(Boolean));
}

function firstString(values) {
  for (const value of values) {
    const out = nonEmpty(value);
    if (out) return out;
  }
  return null;
}

function extractServiceEndpoint(service) {
  if (!service || typeof service !== 'object') return null;
  return firstString([service.endpoint, service.url, service.target, service.path, service.href]);
}

function normalizeCategories(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const value of raw) {
    const text = nonEmpty(typeof value === 'string' ? value : null);
    if (!text) continue;
    const normalized = text.toLowerCase();
    if (out.includes(normalized)) continue;
    out.push(normalized);
  }
  return out;
}

function parseArgs(argv) {
  const opts = {
    sqlitePath: DEFAULT_SQLITE_PATH,
    storePath: null,
    outDir: DEFAULT_OUT_DIR,
    styleVersion: DEFAULT_STYLE_VERSION,
    styleAnchorFile: DEFAULT_STYLE_ANCHOR_FILE,
    styleAnchor: null,
    topChainLimit: DEFAULT_TOP_CHAIN_LIMIT,
    chainPriorityMin: DEFAULT_CHAIN_PRIORITY_MIN,
    agentScoreMin: DEFAULT_AGENT_SCORE_MIN,
    lowScoreMax: DEFAULT_LOW_SCORE_MAX,
    shortlistLimit: DEFAULT_SHORTLIST_LIMIT,
    batchSize: DEFAULT_BATCH_SIZE,
    candidatesPerPrompt: DEFAULT_CANDIDATES_PER_PROMPT,
    estimatedUnitCostUsd: DEFAULT_ESTIMATED_UNIT_COST_USD,
    fallbackAssignment: DEFAULT_FALLBACK_ASSIGNMENT,
    includeSolana: DEFAULT_INCLUDE_SOLANA,
    solanaPrefix: DEFAULT_SOLANA_PREFIX,
    solanaQualityMin: DEFAULT_SOLANA_QUALITY_MIN,
    excludedAgentFile: null,
    excludedAgentIds: [],
    includeTestnets: DEFAULT_INCLUDE_TESTNETS,
    includeExistingShareHero: false,
    help: false
  };

  function nextValue(i, flag) {
    const value = argv[i + 1];
    if (!value || value.startsWith('--')) throw new Error(`MISSING_VALUE:${flag}`);
    return value;
  }

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--help') {
      opts.help = true;
      continue;
    }
    if (token === '--sqlite-path') {
      opts.sqlitePath = nextValue(i, token);
      i += 1;
      continue;
    }
    if (token.startsWith('--sqlite-path=')) {
      opts.sqlitePath = token.slice('--sqlite-path='.length);
      continue;
    }
    if (token === '--store-path') {
      opts.storePath = nextValue(i, token);
      i += 1;
      continue;
    }
    if (token.startsWith('--store-path=')) {
      opts.storePath = token.slice('--store-path='.length);
      continue;
    }
    if (token === '--out-dir') {
      opts.outDir = nextValue(i, token);
      i += 1;
      continue;
    }
    if (token.startsWith('--out-dir=')) {
      opts.outDir = token.slice('--out-dir='.length);
      continue;
    }
    if (token === '--style-version') {
      opts.styleVersion = nextValue(i, token);
      i += 1;
      continue;
    }
    if (token.startsWith('--style-version=')) {
      opts.styleVersion = token.slice('--style-version='.length);
      continue;
    }
    if (token === '--style-anchor-file') {
      opts.styleAnchorFile = nextValue(i, token);
      i += 1;
      continue;
    }
    if (token.startsWith('--style-anchor-file=')) {
      opts.styleAnchorFile = token.slice('--style-anchor-file='.length);
      continue;
    }
    if (token === '--style-anchor') {
      opts.styleAnchor = nextValue(i, token);
      i += 1;
      continue;
    }
    if (token.startsWith('--style-anchor=')) {
      opts.styleAnchor = token.slice('--style-anchor='.length);
      continue;
    }
    if (token === '--top-chain-limit') {
      opts.topChainLimit = parseIntStrict(nextValue(i, token), DEFAULT_TOP_CHAIN_LIMIT);
      i += 1;
      continue;
    }
    if (token.startsWith('--top-chain-limit=')) {
      opts.topChainLimit = parseIntStrict(token.slice('--top-chain-limit='.length), DEFAULT_TOP_CHAIN_LIMIT);
      continue;
    }
    if (token === '--chain-priority-min') {
      opts.chainPriorityMin = parseFloatStrict(nextValue(i, token), DEFAULT_CHAIN_PRIORITY_MIN);
      i += 1;
      continue;
    }
    if (token.startsWith('--chain-priority-min=')) {
      opts.chainPriorityMin = parseFloatStrict(token.slice('--chain-priority-min='.length), DEFAULT_CHAIN_PRIORITY_MIN);
      continue;
    }
    if (token === '--agent-score-min') {
      opts.agentScoreMin = parseFloatStrict(nextValue(i, token), DEFAULT_AGENT_SCORE_MIN);
      i += 1;
      continue;
    }
    if (token.startsWith('--agent-score-min=')) {
      opts.agentScoreMin = parseFloatStrict(token.slice('--agent-score-min='.length), DEFAULT_AGENT_SCORE_MIN);
      continue;
    }
    if (token === '--low-score-max') {
      opts.lowScoreMax = parseFloatStrict(nextValue(i, token), DEFAULT_LOW_SCORE_MAX);
      i += 1;
      continue;
    }
    if (token.startsWith('--low-score-max=')) {
      opts.lowScoreMax = parseFloatStrict(token.slice('--low-score-max='.length), DEFAULT_LOW_SCORE_MAX);
      continue;
    }
    if (token === '--shortlist-limit') {
      opts.shortlistLimit = parseIntStrict(nextValue(i, token), DEFAULT_SHORTLIST_LIMIT);
      i += 1;
      continue;
    }
    if (token.startsWith('--shortlist-limit=')) {
      opts.shortlistLimit = parseIntStrict(token.slice('--shortlist-limit='.length), DEFAULT_SHORTLIST_LIMIT);
      continue;
    }
    if (token === '--batch-size') {
      opts.batchSize = parseIntStrict(nextValue(i, token), DEFAULT_BATCH_SIZE);
      i += 1;
      continue;
    }
    if (token.startsWith('--batch-size=')) {
      opts.batchSize = parseIntStrict(token.slice('--batch-size='.length), DEFAULT_BATCH_SIZE);
      continue;
    }
    if (token === '--candidates-per-prompt') {
      opts.candidatesPerPrompt = parseIntStrict(nextValue(i, token), DEFAULT_CANDIDATES_PER_PROMPT);
      i += 1;
      continue;
    }
    if (token.startsWith('--candidates-per-prompt=')) {
      opts.candidatesPerPrompt = parseIntStrict(token.slice('--candidates-per-prompt='.length), DEFAULT_CANDIDATES_PER_PROMPT);
      continue;
    }
    if (token === '--estimated-unit-cost-usd') {
      opts.estimatedUnitCostUsd = parseFloatStrict(nextValue(i, token), DEFAULT_ESTIMATED_UNIT_COST_USD);
      i += 1;
      continue;
    }
    if (token.startsWith('--estimated-unit-cost-usd=')) {
      opts.estimatedUnitCostUsd = parseFloatStrict(token.slice('--estimated-unit-cost-usd='.length), DEFAULT_ESTIMATED_UNIT_COST_USD);
      continue;
    }
    if (token === '--fallback-assignment') {
      opts.fallbackAssignment = nextValue(i, token);
      i += 1;
      continue;
    }
    if (token.startsWith('--fallback-assignment=')) {
      opts.fallbackAssignment = token.slice('--fallback-assignment='.length);
      continue;
    }
    if (token === '--solana-prefix') {
      opts.solanaPrefix = nextValue(i, token);
      i += 1;
      continue;
    }
    if (token.startsWith('--solana-prefix=')) {
      opts.solanaPrefix = token.slice('--solana-prefix='.length);
      continue;
    }
    if (token === '--solana-quality-min') {
      opts.solanaQualityMin = parseFloatStrict(nextValue(i, token), DEFAULT_SOLANA_QUALITY_MIN);
      i += 1;
      continue;
    }
    if (token.startsWith('--solana-quality-min=')) {
      opts.solanaQualityMin = parseFloatStrict(token.slice('--solana-quality-min='.length), DEFAULT_SOLANA_QUALITY_MIN);
      continue;
    }
    if (token === '--exclude-solana') {
      opts.includeSolana = false;
      continue;
    }
    if (token === '--exclude-agent-file') {
      opts.excludedAgentFile = nextValue(i, token);
      i += 1;
      continue;
    }
    if (token.startsWith('--exclude-agent-file=')) {
      opts.excludedAgentFile = token.slice('--exclude-agent-file='.length);
      continue;
    }
    if (token === '--exclude-agent-id') {
      opts.excludedAgentIds.push(nextValue(i, token));
      i += 1;
      continue;
    }
    if (token.startsWith('--exclude-agent-id=')) {
      opts.excludedAgentIds.push(token.slice('--exclude-agent-id='.length));
      continue;
    }
    if (token === '--include-testnets') {
      opts.includeTestnets = true;
      continue;
    }
    if (token === '--include-existing-share-hero') {
      opts.includeExistingShareHero = true;
      continue;
    }
    throw new Error(`UNKNOWN_ARG:${token}`);
  }

  opts.sqlitePath = path.resolve(opts.sqlitePath);
  opts.outDir = path.resolve(opts.outDir);
  opts.storePath = opts.storePath ? path.resolve(opts.storePath) : null;
  opts.styleVersion = nonEmpty(opts.styleVersion) || DEFAULT_STYLE_VERSION;
  opts.styleAnchor = nonEmpty(opts.styleAnchor);
  opts.styleAnchorFile = opts.styleAnchorFile ? path.resolve(opts.styleAnchorFile) : null;
  opts.fallbackAssignment = nonEmpty(opts.fallbackAssignment) || DEFAULT_FALLBACK_ASSIGNMENT;
  if (opts.fallbackAssignment !== 'chain-default' && opts.fallbackAssignment !== 'shared-category') {
    throw new Error(`INVALID_FALLBACK_ASSIGNMENT:${opts.fallbackAssignment}`);
  }
  opts.solanaPrefix = nonEmpty(opts.solanaPrefix) || DEFAULT_SOLANA_PREFIX;
  opts.solanaQualityMin = Number.isFinite(opts.solanaQualityMin) ? opts.solanaQualityMin : DEFAULT_SOLANA_QUALITY_MIN;
  opts.excludedAgentFile = opts.excludedAgentFile ? path.resolve(opts.excludedAgentFile) : null;
  opts.excludedAgentIds = opts.excludedAgentIds
    .map((value) => nonEmpty(value))
    .filter(Boolean);
  opts.topChainLimit = Math.max(1, opts.topChainLimit || DEFAULT_TOP_CHAIN_LIMIT);
  opts.chainPriorityMin = Number.isFinite(opts.chainPriorityMin) ? opts.chainPriorityMin : DEFAULT_CHAIN_PRIORITY_MIN;
  opts.agentScoreMin = Number.isFinite(opts.agentScoreMin) ? opts.agentScoreMin : DEFAULT_AGENT_SCORE_MIN;
  opts.lowScoreMax = Number.isFinite(opts.lowScoreMax) ? opts.lowScoreMax : DEFAULT_LOW_SCORE_MAX;
  opts.shortlistLimit = Math.max(1, opts.shortlistLimit || DEFAULT_SHORTLIST_LIMIT);
  opts.batchSize = Math.max(1, opts.batchSize || DEFAULT_BATCH_SIZE);
  opts.candidatesPerPrompt = Math.max(1, opts.candidatesPerPrompt || DEFAULT_CANDIDATES_PER_PROMPT);
  opts.estimatedUnitCostUsd = Math.max(0, opts.estimatedUnitCostUsd || DEFAULT_ESTIMATED_UNIT_COST_USD);

  return opts;
}

function loadStyleAnchor(opts) {
  if (opts.styleAnchor) return opts.styleAnchor;
  if (opts.styleAnchorFile && fs.existsSync(opts.styleAnchorFile)) {
    return nonEmpty(fs.readFileSync(opts.styleAnchorFile, 'utf8'));
  }
  return null;
}

function extractAgentIdFromRecord(value) {
  if (typeof value === 'string') return nonEmpty(value);
  if (!value || typeof value !== 'object') return null;
  return firstString([value.erc8004Id, value.agentId, value.id]);
}

function collectAgentIdFromLine(line, out) {
  const text = nonEmpty(line);
  if (!text || text.startsWith('#')) return;

  if (text.startsWith('{') || text.startsWith('[')) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          const id = extractAgentIdFromRecord(item);
          if (id) out.add(id);
        }
        return;
      }
      const id = extractAgentIdFromRecord(parsed);
      if (id) out.add(id);
      return;
    } catch {
      // fall through to delimited parsing
    }
  }

  const first = nonEmpty(text.split(/[,\t\s]/)[0]);
  if (!first) return;
  const lowered = first.toLowerCase();
  if (lowered === 'erc8004id' || lowered === 'agentid' || lowered === 'agent_id' || lowered === 'id') return;
  out.add(first);
}

function loadExcludedAgentIds(opts) {
  const out = new Set(opts.excludedAgentIds || []);
  if (!opts.excludedAgentFile) return out;
  if (!fs.existsSync(opts.excludedAgentFile)) {
    throw new Error(`EXCLUDE_AGENT_FILE_NOT_FOUND:${opts.excludedAgentFile}`);
  }

  const raw = fs.readFileSync(opts.excludedAgentFile, 'utf8');
  const ext = path.extname(opts.excludedAgentFile).toLowerCase();

  if (ext === '.json') {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        const id = extractAgentIdFromRecord(item);
        if (id) out.add(id);
      }
      return out;
    }
    const ids = Array.isArray(parsed?.ids) ? parsed.ids : [];
    for (const item of ids) {
      const id = extractAgentIdFromRecord(item);
      if (id) out.add(id);
    }
    return out;
  }

  const lines = raw.split(/\r?\n/);
  for (const line of lines) collectAgentIdFromLine(line, out);
  return out;
}

function loadStoreTargets(opts) {
  if (opts.storePath) process.env.STORE_PATH = opts.storePath;
  const { readStore } = require('../server/store');
  const store = readStore();

  const housesById = new Map();
  for (const house of store.houses || []) {
    const houseId = nonEmpty(house?.id);
    if (!houseId || housesById.has(houseId)) continue;

    const shareHeroValue = firstString([
      house?.media?.shareHero?.image,
      house?.media?.shareHero?.imageUrl,
      house?.publicMedia?.image
    ]);

    housesById.set(houseId, {
      houseId,
      hasShareHero: Boolean(shareHeroValue),
      source: nonEmpty(house?.preRegistration?.source),
      sourceChainId: toFiniteNumber(house?.preRegistration?.sourceChainId)
    });
  }

  const targetsById = new Map();
  for (const anchor of store.anchors || []) {
    const erc8004Id = nonEmpty(anchor?.erc8004Id);
    const houseId = nonEmpty(anchor?.houseId);
    if (!erc8004Id || !houseId || targetsById.has(erc8004Id)) continue;
    const houseMeta = housesById.get(houseId);
    if (!houseMeta) continue;

    targetsById.set(erc8004Id, {
      erc8004Id,
      houseId,
      hasShareHero: houseMeta.hasShareHero,
      source: houseMeta.source || null,
      sourceChainId: houseMeta.sourceChainId
    });
  }

  return {
    housesById,
    targetsById
  };
}

function normalizeAgentRow(row) {
  const chainId = Number(row.chainId);
  if (!Number.isFinite(chainId)) return null;
  const chainName = nonEmpty(row.chainName) || `Chain ${chainId}`;
  const family = familyForChain(chainId, chainName);
  const parsedData = parseJsonSafe(row.dataJson) || {};
  const services = parsedData && typeof parsedData.services === 'object' ? parsedData.services : null;
  const mcpEndpoint = extractServiceEndpoint(services?.mcp);
  const a2aEndpoint = extractServiceEndpoint(services?.a2a);
  const oasfEndpoint = extractServiceEndpoint(services?.oasf);

  const totalScore = toFiniteNumber(parsedData.total_score);
  const rankFieldPresent = Object.prototype.hasOwnProperty.call(parsedData, 'rank');
  const rank = rankFieldPresent ? toFiniteNumber(parsedData.rank) : null;

  const agentUrl = firstString([row.agentUrl, parsedData.agent_url]);
  const hasExternalUrl = Boolean(agentUrl);
  const x402Supported = toBool(row.x402Supported);
  const endpointVerified = toBool(row.isEndpointVerified);
  const hasServiceEndpoint = Boolean(mcpEndpoint || a2aEndpoint || oasfEndpoint);
  const serviceLike = x402Supported || endpointVerified || hasServiceEndpoint || hasExternalUrl;

  return {
    erc8004Id: String(row.erc8004Id || ''),
    source: 'evm',
    chainId,
    chainName,
    chainFamilyKey: family.key,
    chainFamilyLabel: family.label,
    isTestnet: toBool(row.isTestnet),
    networkType: toBool(row.isTestnet) ? 'testnet' : 'mainnet',
    name: nonEmpty(row.name) || null,
    description: nonEmpty(row.description) || null,
    agentUrl,
    imageUrl: nonEmpty(row.imageUrl) || null,
    isActive: toBool(row.isActive),
    x402Supported,
    endpointVerified,
    hasServiceEndpoint,
    hasExternalUrl,
    serviceLike,
    mcpEndpoint,
    a2aEndpoint,
    oasfEndpoint,
    categories: normalizeCategories(parsedData.categories),
    totalScore,
    rank,
    rankFieldPresent,
    updatedAt: nonEmpty(row.updatedAt) || null
  };
}

function loadEvmAgents(sqlitePath) {
  if (!fs.existsSync(sqlitePath)) throw new Error(`SQLITE_NOT_FOUND:${sqlitePath}`);

  const db = new DatabaseSync(sqlitePath, { readOnly: true });
  try {
    if (!hasSqliteTable(db, 'erc8004_agents')) throw new Error(`SQLITE_TABLE_NOT_FOUND:erc8004_agents:${sqlitePath}`);

    const cols = getSqliteColumns(db, 'erc8004_agents');
    const hasChainsTable = hasSqliteTable(db, 'erc8004_chains');
    const hasAgentUrl = cols.has('agent_url');
    const hasImageUrl = cols.has('image_url');
    const hasName = cols.has('name');
    const hasDescription = cols.has('description');
    const hasIsTestnet = cols.has('is_testnet');
    const hasIsActive = cols.has('is_active');
    const hasX402 = cols.has('x402_supported');
    const hasEndpointVerified = cols.has('is_endpoint_verified');
    const hasUpdatedAt = cols.has('updated_at');
    const hasDataJson = cols.has('data_json');

    const rows = db.prepare(
      [
        'SELECT',
        '  a.agent_id AS erc8004Id,',
        '  a.chain_id AS chainId,',
        `  ${hasName ? "COALESCE(a.name, '')" : "''"} AS name,`,
        `  ${hasDescription ? "COALESCE(a.description, '')" : "''"} AS description,`,
        `  ${hasAgentUrl ? "COALESCE(a.agent_url, '')" : "''"} AS agentUrl,`,
        `  ${hasImageUrl ? "COALESCE(a.image_url, '')" : "''"} AS imageUrl,`,
        `  ${hasIsTestnet ? 'COALESCE(a.is_testnet, 0)' : '0'} AS isTestnet,`,
        `  ${hasIsActive ? 'COALESCE(a.is_active, 0)' : '0'} AS isActive,`,
        `  ${hasX402 ? 'COALESCE(a.x402_supported, 0)' : '0'} AS x402Supported,`,
        `  ${hasEndpointVerified ? 'COALESCE(a.is_endpoint_verified, 0)' : '0'} AS isEndpointVerified,`,
        `  ${hasUpdatedAt ? "COALESCE(a.updated_at, '')" : "''"} AS updatedAt,`,
        `  ${hasDataJson ? "COALESCE(a.data_json, '{}')" : "'{}'"} AS dataJson,`,
        `  ${hasChainsTable ? "COALESCE(c.name, 'Chain ' || a.chain_id)" : "'Chain ' || a.chain_id"} AS chainName`,
        'FROM erc8004_agents a',
        ...(hasChainsTable ? ['LEFT JOIN erc8004_chains c ON c.chain_id = a.chain_id'] : []),
        "WHERE a.agent_id IS NOT NULL AND TRIM(a.agent_id) <> ''",
        'ORDER BY a.chain_id ASC, a.agent_id ASC'
      ].join('\n')
    ).all();

    const out = [];
    for (const row of rows) {
      const normalized = normalizeAgentRow(row);
      if (!normalized) continue;
      out.push(normalized);
    }
    return out;
  } finally {
    db.close();
  }
}

function loadSolanaAgents(sqlitePath, opts) {
  if (!opts.includeSolana) return [];
  if (!fs.existsSync(sqlitePath)) throw new Error(`SQLITE_NOT_FOUND:${sqlitePath}`);

  const db = new DatabaseSync(sqlitePath, { readOnly: true });
  try {
    if (!hasSqliteTable(db, 'erc8004_solana_agents')) return [];
    const cols = getSqliteColumns(db, 'erc8004_solana_agents');

    const hasAsset = cols.has('asset');
    if (!hasAsset) return [];

    const hasName = cols.has('nft_name');
    const hasAgentUri = cols.has('agent_uri');
    const hasQualityScore = cols.has('quality_score');
    const hasConfidence = cols.has('confidence');
    const hasRiskScore = cols.has('risk_score');
    const hasUpdatedAt = cols.has('updated_at');
    const hasRegistrationJson = cols.has('registration_json');
    const hasIndexedJson = cols.has('indexed_json');

    const rows = db.prepare(
      [
        'SELECT',
        '  asset,',
        `  ${hasName ? "COALESCE(nft_name, '')" : "''"} AS nftName,`,
        `  ${hasAgentUri ? "COALESCE(agent_uri, '')" : "''"} AS agentUri,`,
        `  ${hasQualityScore ? 'quality_score' : 'NULL'} AS qualityScore,`,
        `  ${hasConfidence ? 'confidence' : 'NULL'} AS confidence,`,
        `  ${hasRiskScore ? 'risk_score' : 'NULL'} AS riskScore,`,
        `  ${hasUpdatedAt ? "COALESCE(updated_at, '')" : "''"} AS updatedAt,`,
        `  ${hasRegistrationJson ? "COALESCE(registration_json, '')" : "''"} AS registrationJson,`,
        `  ${hasIndexedJson ? "COALESCE(indexed_json, '')" : "''"} AS indexedJson`,
        'FROM erc8004_solana_agents',
        "WHERE asset IS NOT NULL AND TRIM(asset) <> ''",
        'ORDER BY asset ASC'
      ].join('\n')
    ).all();

    const out = [];
    for (const row of rows) {
      const asset = nonEmpty(row.asset);
      if (!asset) continue;
      const erc8004Id = `${opts.solanaPrefix}:${asset}`;
      const qualityScore = toFiniteNumber(row.qualityScore) || 0;
      const confidence = toFiniteNumber(row.confidence) || 0;
      const riskScore = toFiniteNumber(row.riskScore) || 0;
      const registrationJson = parseJsonSafe(row.registrationJson) || {};
      const indexedJson = parseJsonSafe(row.indexedJson) || {};
      const name = firstString([row.nftName, registrationJson.name, indexedJson.name, registrationJson.title, indexedJson.title]);
      const description = firstString([registrationJson.description, indexedJson.description, registrationJson.bio, indexedJson.bio]);
      const agentUrl = firstString([row.agentUri, registrationJson.agent_uri, indexedJson.agent_uri, registrationJson.url, indexedJson.url]);

      out.push({
        erc8004Id,
        source: 'solana',
        chainId: null,
        chainName: 'Solana Devnet',
        chainFamilyKey: 'solana',
        chainFamilyLabel: 'Solana',
        isTestnet: true,
        networkType: 'devnet',
        name: name || null,
        description: description || null,
        agentUrl,
        imageUrl: null,
        isActive: true,
        x402Supported: false,
        endpointVerified: false,
        hasServiceEndpoint: Boolean(agentUrl),
        hasExternalUrl: Boolean(agentUrl),
        serviceLike: Boolean(agentUrl),
        mcpEndpoint: null,
        a2aEndpoint: null,
        oasfEndpoint: null,
        categories: [],
        totalScore: qualityScore,
        rank: null,
        rankFieldPresent: false,
        qualityScore: round2(qualityScore),
        confidence: round2(confidence),
        riskScore: round2(riskScore),
        updatedAt: nonEmpty(row.updatedAt) || null
      });
    }
    return out;
  } finally {
    db.close();
  }
}

function summarizeSignalAvailability(agents) {
  const summary = {
    totalAgents: agents.length,
    totalScore: { available: 0, gt0: 0, ge40: 0, ge60: 0, ge80: 0, min: null, max: null, avg: 0 },
    rank: { fieldPresent: 0, nonNull: 0 },
    serviceSignals: {
      x402Supported: 0,
      endpointVerified: 0,
      hasAgentUrl: 0,
      hasServiceEndpoint: 0,
      hasMcp: 0,
      hasA2a: 0,
      hasOasf: 0,
      serviceLike: 0
    }
  };

  let scoreSum = 0;
  const scores = [];

  for (const agent of agents) {
    const score = agent.totalScore;
    if (Number.isFinite(score)) {
      summary.totalScore.available += 1;
      scoreSum += score;
      scores.push(score);
      if (score > 0) summary.totalScore.gt0 += 1;
      if (score >= 40) summary.totalScore.ge40 += 1;
      if (score >= 60) summary.totalScore.ge60 += 1;
      if (score >= 80) summary.totalScore.ge80 += 1;
    }

    if (agent.rankFieldPresent) summary.rank.fieldPresent += 1;
    if (Number.isFinite(agent.rank)) summary.rank.nonNull += 1;

    if (agent.x402Supported) summary.serviceSignals.x402Supported += 1;
    if (agent.endpointVerified) summary.serviceSignals.endpointVerified += 1;
    if (agent.hasExternalUrl) summary.serviceSignals.hasAgentUrl += 1;
    if (agent.hasServiceEndpoint) summary.serviceSignals.hasServiceEndpoint += 1;
    if (agent.mcpEndpoint) summary.serviceSignals.hasMcp += 1;
    if (agent.a2aEndpoint) summary.serviceSignals.hasA2a += 1;
    if (agent.oasfEndpoint) summary.serviceSignals.hasOasf += 1;
    if (agent.serviceLike) summary.serviceSignals.serviceLike += 1;
  }

  if (scores.length) {
    summary.totalScore.min = round2(Math.min(...scores));
    summary.totalScore.max = round2(Math.max(...scores));
    summary.totalScore.avg = round2(scoreSum / scores.length);
  }

  return summary;
}

function summarizeSolanaSignalAvailability(agents) {
  const summary = {
    totalAgents: agents.length,
    qualityScore: { gt0: 0, min: null, avg: 0, max: null },
    confidence: { gt0: 0, min: null, avg: 0, max: null },
    riskScore: { gt0: 0, min: null, avg: 0, max: null }
  };
  if (!agents.length) return summary;

  let qualitySum = 0;
  let confidenceSum = 0;
  let riskSum = 0;
  const qualityValues = [];
  const confidenceValues = [];
  const riskValues = [];

  for (const agent of agents) {
    const quality = toFiniteNumber(agent.qualityScore) || 0;
    const confidence = toFiniteNumber(agent.confidence) || 0;
    const risk = toFiniteNumber(agent.riskScore) || 0;

    qualityValues.push(quality);
    confidenceValues.push(confidence);
    riskValues.push(risk);
    qualitySum += quality;
    confidenceSum += confidence;
    riskSum += risk;
    if (quality > 0) summary.qualityScore.gt0 += 1;
    if (confidence > 0) summary.confidence.gt0 += 1;
    if (risk > 0) summary.riskScore.gt0 += 1;
  }

  summary.qualityScore.min = round2(Math.min(...qualityValues));
  summary.qualityScore.max = round2(Math.max(...qualityValues));
  summary.qualityScore.avg = round2(qualitySum / agents.length);

  summary.confidence.min = round2(Math.min(...confidenceValues));
  summary.confidence.max = round2(Math.max(...confidenceValues));
  summary.confidence.avg = round2(confidenceSum / agents.length);

  summary.riskScore.min = round2(Math.min(...riskValues));
  summary.riskScore.max = round2(Math.max(...riskValues));
  summary.riskScore.avg = round2(riskSum / agents.length);

  return summary;
}

function computePriorityScore(avgScore, p90Score, serviceLikePct, highScorePct) {
  return round2(avgScore * 0.55 + p90Score * 0.3 + serviceLikePct * 0.1 + highScorePct * 0.05);
}

function finalizeAggregateRow(base, opts) {
  const scoreCount = base.scores.length;
  const avgScore = scoreCount ? round2(base.scoreSum / scoreCount) : 0;
  const p90Score = scoreCount ? round2(quantile(base.scores, 0.9)) : 0;
  const maxScore = scoreCount ? round2(Math.max(...base.scores)) : 0;
  const serviceLikePct = pct(base.serviceLikeCount, base.agentCount);
  const highScorePct = pct(base.highScoreCount, base.agentCount);
  const priorityScore = computePriorityScore(avgScore, p90Score, serviceLikePct, highScorePct);

  return {
    ...base,
    avgScore,
    p90Score,
    maxScore,
    serviceLikePct,
    highScorePct,
    priorityScore,
    tier: chainTier(priorityScore),
    topChainId: base.topChain ? base.topChain.chainId : null,
    topChainName: base.topChain ? base.topChain.chainName : null,
    chainCount: base.chainCount || 0
  };
}

function aggregateFamilies(agents, opts) {
  const byFamily = new Map();
  for (const agent of agents) {
    const key = agent.chainFamilyKey;
    const current = byFamily.get(key) || {
      familyKey: key,
      familyLabel: agent.chainFamilyLabel,
      agentCount: 0,
      mainnetAgents: 0,
      testnetAgents: 0,
      otherNetworkAgents: 0,
      x402SupportedCount: 0,
      endpointVerifiedCount: 0,
      hasExternalUrlCount: 0,
      serviceLikeCount: 0,
      highScoreCount: 0,
      scoreSum: 0,
      scores: [],
      chainRefs: new Map(),
      topChain: null,
      chainCount: 0
    };

    current.agentCount += 1;
    if (agent.networkType === 'testnet') current.testnetAgents += 1;
    else if (agent.networkType === 'mainnet') current.mainnetAgents += 1;
    else current.otherNetworkAgents += 1;
    if (agent.x402Supported) current.x402SupportedCount += 1;
    if (agent.endpointVerified) current.endpointVerifiedCount += 1;
    if (agent.hasExternalUrl) current.hasExternalUrlCount += 1;
    if (agent.serviceLike) current.serviceLikeCount += 1;
    if (Number.isFinite(agent.totalScore)) {
      current.scoreSum += agent.totalScore;
      current.scores.push(agent.totalScore);
      if (agent.totalScore >= opts.agentScoreMin) current.highScoreCount += 1;
    }

    const chainKey = String(agent.chainId);
    const existingChainCount = current.chainRefs.get(chainKey) || 0;
    const nextChainCount = existingChainCount + 1;
    current.chainRefs.set(chainKey, nextChainCount);

    if (!current.topChain || nextChainCount > current.topChain.count) {
      current.topChain = { chainId: agent.chainId, chainName: agent.chainName, count: nextChainCount };
    }

    byFamily.set(key, current);
  }

  const rows = [...byFamily.values()].map((row) => {
    row.chainCount = row.chainRefs.size;
    const finalized = finalizeAggregateRow(row, opts);
    delete finalized.chainRefs;
    delete finalized.scores;
    delete finalized.scoreSum;
    delete finalized.topChain;
    return finalized;
  });

  rows.sort((a, b) =>
    b.priorityScore - a.priorityScore
    || b.highScoreCount - a.highScoreCount
    || b.agentCount - a.agentCount
    || a.familyKey.localeCompare(b.familyKey)
  );

  rows.forEach((row, idx) => {
    row.rank = idx + 1;
  });

  return rows;
}

function aggregateChains(agents, opts) {
  const byChain = new Map();
  for (const agent of agents) {
    const key = `${agent.chainId}`;
    const current = byChain.get(key) || {
      chainId: agent.chainId,
      chainName: agent.chainName,
      familyKey: agent.chainFamilyKey,
      familyLabel: agent.chainFamilyLabel,
      networkType: agent.networkType,
      agentCount: 0,
      x402SupportedCount: 0,
      endpointVerifiedCount: 0,
      hasExternalUrlCount: 0,
      serviceLikeCount: 0,
      highScoreCount: 0,
      scoreSum: 0,
      scores: [],
      chainCount: 1
    };

    current.agentCount += 1;
    if (agent.x402Supported) current.x402SupportedCount += 1;
    if (agent.endpointVerified) current.endpointVerifiedCount += 1;
    if (agent.hasExternalUrl) current.hasExternalUrlCount += 1;
    if (agent.serviceLike) current.serviceLikeCount += 1;
    if (Number.isFinite(agent.totalScore)) {
      current.scoreSum += agent.totalScore;
      current.scores.push(agent.totalScore);
      if (agent.totalScore >= opts.agentScoreMin) current.highScoreCount += 1;
    }

    byChain.set(key, current);
  }

  const rows = [...byChain.values()].map((row) => {
    const finalized = finalizeAggregateRow(row, opts);
    delete finalized.scores;
    delete finalized.scoreSum;
    delete finalized.topChain;
    return finalized;
  });

  rows.sort((a, b) =>
    b.priorityScore - a.priorityScore
    || b.highScoreCount - a.highScoreCount
    || b.agentCount - a.agentCount
    || a.chainId - b.chainId
  );

  rows.forEach((row, idx) => {
    row.rank = idx + 1;
  });

  return rows;
}

function scoreAgentForPlanning(agent, familyPriorityScore) {
  if (agent.source === 'solana') {
    const qualityScore = Number(agent.qualityScore || 0);
    const confidence = Number(agent.confidence || 0);
    const riskScore = Number(agent.riskScore || 0);
    const weighted = qualityScore + confidence * 10 - riskScore * 4 + Number(familyPriorityScore || 0) * 0.08;
    return round2(weighted);
  }

  const score = Number(agent.totalScore || 0);
  let weighted = score;
  if (agent.serviceLike) weighted += 10;
  if (agent.x402Supported) weighted += 4;
  if (agent.endpointVerified) weighted += 5;
  if (agent.hasExternalUrl) weighted += 3;
  if (agent.mcpEndpoint) weighted += 2;
  if (agent.a2aEndpoint) weighted += 2;
  weighted += Number(familyPriorityScore || 0) * 0.08;
  return round2(weighted);
}

function buildPlanningCandidates(agents, familyRows, targetsById, opts) {
  const familyPriorityByKey = new Map(familyRows.map((row) => [row.familyKey, row.priorityScore]));
  const agentsById = new Map(agents.map((agent) => [agent.erc8004Id, agent]));

  const candidates = [];
  let missingInSqlite = 0;
  let skippedWithExistingShareHero = 0;

  const targetIds = [...targetsById.keys()].sort((a, b) => a.localeCompare(b));
  for (const erc8004Id of targetIds) {
    const target = targetsById.get(erc8004Id);
    const agent = agentsById.get(erc8004Id);
    if (!agent) {
      missingInSqlite += 1;
      continue;
    }
    if (!opts.includeExistingShareHero && target.hasShareHero) {
      skippedWithExistingShareHero += 1;
      continue;
    }

    candidates.push({
      ...agent,
      houseId: target.houseId,
      targetHasShareHero: target.hasShareHero,
      planningScore: scoreAgentForPlanning(agent, familyPriorityByKey.get(agent.chainFamilyKey) || 0)
    });
  }

  candidates.sort((a, b) =>
    b.planningScore - a.planningScore
    || Number(b.totalScore || 0) - Number(a.totalScore || 0)
    || a.erc8004Id.localeCompare(b.erc8004Id)
  );

  candidates.forEach((row, idx) => {
    row.rank = idx + 1;
  });

  return {
    candidates,
    missingInSqlite,
    skippedWithExistingShareHero
  };
}

function pickTopChains(familyRows, opts) {
  const filtered = familyRows.filter((row) => row.priorityScore >= opts.chainPriorityMin);
  const rows = (filtered.length ? filtered : familyRows).slice(0, opts.topChainLimit);
  return rows;
}

function classifySharedBucket(agent, opts) {
  if (!agent.serviceLike) return 'no-service';
  if (!agent.hasExternalUrl) return 'no-external-url';
  if (Number(agent.totalScore || 0) <= opts.lowScoreMax) return 'low-score';
  return 'service-general';
}

function assignImagePlan(candidates, topChainRows, excludedAgentIds, opts) {
  const topChainSet = new Set(topChainRows.map((row) => row.familyKey));
  const uniqueAgents = [];
  const sharedByKey = new Map();
  const assigned = [];
  const chainDefaultFamilyKeys = new Set();
  let excludedForcedGenericCount = 0;

  for (const agent of candidates) {
    const forcedGeneric = excludedAgentIds.has(agent.erc8004Id);
    if (forcedGeneric) excludedForcedGenericCount += 1;
    const uniqueAgent = !forcedGeneric && (
      agent.source === 'solana'
        ? Number(agent.qualityScore || 0) > Number(opts.solanaQualityMin || 0)
        : (agent.serviceLike && Number(agent.totalScore || 0) >= opts.agentScoreMin)
    );
    if (uniqueAgent) {
      const out = {
        ...agent,
        assignmentKind: 'unique-agent',
        clusterKey: null,
        clusterType: null,
        inTopChain: topChainSet.has(agent.chainFamilyKey),
        forcedGeneric: false
      };
      uniqueAgents.push(out);
      assigned.push(out);
      continue;
    }

    if (opts.fallbackAssignment === 'chain-default') {
      chainDefaultFamilyKeys.add(agent.chainFamilyKey);
      const out = {
        ...agent,
        assignmentKind: 'chain-default',
        clusterKey: `chain-default:${agent.chainFamilyKey}`,
        clusterType: 'chain-family-default',
        inTopChain: topChainSet.has(agent.chainFamilyKey),
        forcedGeneric
      };
      assigned.push(out);
      continue;
    }

    const clusterType = classifySharedBucket(agent, opts);
    const clusterKey = `${clusterType}:${agent.chainFamilyKey}`;
    if (!sharedByKey.has(clusterKey)) {
      sharedByKey.set(clusterKey, {
        clusterKey,
        clusterType,
        familyKey: agent.chainFamilyKey,
        familyLabel: agent.chainFamilyLabel,
        networkType: agent.networkType,
        agents: []
      });
    }

    const out = {
      ...agent,
      assignmentKind: 'shared-category',
      clusterKey,
      clusterType,
      inTopChain: topChainSet.has(agent.chainFamilyKey),
      forcedGeneric
    };
    sharedByKey.get(clusterKey).agents.push(out);
    assigned.push(out);
  }

  const sharedClusters = [...sharedByKey.values()].map((cluster) => {
    cluster.agents.sort((a, b) =>
      b.planningScore - a.planningScore
      || Number(b.totalScore || 0) - Number(a.totalScore || 0)
      || a.erc8004Id.localeCompare(b.erc8004Id)
    );
    cluster.agentCount = cluster.agents.length;
    cluster.representative = cluster.agents[0] || null;
    return cluster;
  });

  sharedClusters.sort((a, b) => b.agentCount - a.agentCount || a.clusterKey.localeCompare(b.clusterKey));
  uniqueAgents.sort((a, b) => b.planningScore - a.planningScore || a.erc8004Id.localeCompare(b.erc8004Id));

  return {
    topChainSet,
    uniqueAgents,
    sharedClusters,
    assigned,
    chainDefaultFamilyKeys: [...chainDefaultFamilyKeys].sort((a, b) => a.localeCompare(b)),
    excludedForcedGenericCount
  };
}

function buildChainPrompt(row, styleAnchor, styleVersion) {
  const styleHint = chainStyleHint(row.familyKey);
  const styleAnchorLine = styleAnchor ? `Global style anchor: ${styleAnchor}` : null;
  const networkParts = [`${row.mainnetAgents} mainnet`, `${row.testnetAgents} testnet`];
  if (Number(row.otherNetworkAgents || 0) > 0) networkParts.push(`${row.otherNetworkAgents} other-network`);

  return oneLine([
    'Create a premium cinematic 16:9 district hero image for Agent Town Atlas.',
    `District: ${row.familyLabel} (${row.familyKey}).`,
    `Priority tier: ${row.tier} with chain score ${row.priorityScore}.`,
    `Context: ${row.agentCount} agents (${networkParts.join(', ')}).`,
    `Visual direction: ${styleHint}.`,
    styleAnchorLine,
    'Constraints: no text overlays, no watermarks, no logos, no copyrighted characters.',
    `Style version: ${styleVersion}.`
  ].filter(Boolean).join(' '));
}

function buildChainDefaultPrompt(row, styleAnchor, styleVersion, seed) {
  const styleHint = chainStyleHint(row.familyKey);
  const styleAnchorLine = styleAnchor ? `Global style anchor: ${styleAnchor}` : null;

  return oneLine([
    'Create a premium cinematic 16:9 reusable storefront hero illustration for Agent Town.',
    `District family: ${row.familyLabel} (${row.familyKey}).`,
    `Coverage target: fallback image for non-custom agents in this district (${row.agentCount} known agents).`,
    `Visual direction: ${styleHint}.`,
    styleAnchorLine,
    'Constraints: no text overlays, no watermarks, no logos, no copyrighted characters.',
    'Output: legible, reusable chain-level storefront visual with strong focal landmark.',
    `Style version: ${styleVersion}. Deterministic seed: ${seed}.`
  ].filter(Boolean).join(' '));
}

function buildUniqueAgentPrompt(agent, styleAnchor, styleVersion, seed) {
  const styleHint = chainStyleHint(agent.chainFamilyKey);
  const styleAnchorLine = styleAnchor ? `Global style anchor: ${styleAnchor}` : null;
  const name = shortText(agent.name, 120) || `Agent ${agent.erc8004Id}`;
  const description = shortText(agent.description, 360) || 'Autonomous service agent in the Agent Town ecosystem.';

  const serviceCues = [
    agent.x402Supported ? 'x402 enabled' : null,
    agent.endpointVerified ? 'endpoint verified' : null,
    agent.mcpEndpoint ? 'MCP endpoint' : null,
    agent.a2aEndpoint ? 'A2A endpoint' : null,
    agent.oasfEndpoint ? 'OASF endpoint' : null,
    agent.hasExternalUrl ? 'external URL present' : null
  ].filter(Boolean);
  const solanaScoreCues = agent.source === 'solana'
    ? [
      `quality_score ${round2(agent.qualityScore || 0)}`,
      `confidence ${round2(agent.confidence || 0)}`,
      `risk_score ${round2(agent.riskScore || 0)}`
    ].join(', ')
    : null;

  return oneLine([
    'Create a premium cinematic 16:9 storefront hero illustration for Agent Town.',
    `Subject: autonomous agent "${name}" (ERC-8004 id: ${agent.erc8004Id}).`,
    `District context: ${agent.chainFamilyLabel} family on ${agent.networkType}.`,
    `Visual direction: ${styleHint}.`,
    `Capability cues: ${description}`,
    solanaScoreCues ? `Solana signal cues: ${solanaScoreCues}.` : null,
    serviceCues.length ? `Service cues: ${serviceCues.join(', ')}.` : null,
    styleAnchorLine,
    'Constraints: no text overlays, no watermarks, no logos, no copyrighted characters.',
    'Output: high-contrast focal subject, readable depth layers, share-card friendly framing.',
    `Style version: ${styleVersion}. Deterministic seed: ${seed}.`
  ].filter(Boolean).join(' '));
}

function sharedBucketLabel(clusterType) {
  if (clusterType === 'no-service') return 'agents without service-like metadata';
  if (clusterType === 'no-external-url') return 'service-like agents without external URL';
  if (clusterType === 'low-score') return 'low-score service-like agents';
  return 'service-like agents using shared category art';
}

function buildSharedPrompt(cluster, styleAnchor, styleVersion, seed) {
  const styleHint = chainStyleHint(cluster.familyKey);
  const styleAnchorLine = styleAnchor ? `Global style anchor: ${styleAnchor}` : null;

  return oneLine([
    'Create a premium cinematic 16:9 shared storefront hero illustration for Agent Town.',
    `Category target: ${sharedBucketLabel(cluster.clusterType)}.`,
    `District context: ${cluster.familyLabel} family.`,
    `Visual direction: ${styleHint}.`,
    `Cluster size: ${cluster.agentCount} agents in ${cluster.clusterType} bucket.`,
    styleAnchorLine,
    'Constraints: no text overlays, no watermarks, no logos, no copyrighted characters.',
    'Output: reusable district-compatible image with clear focal landmark and readable composition.',
    `Style version: ${styleVersion}. Deterministic seed: ${seed}.`
  ].filter(Boolean).join(' '));
}

function buildTestnetGenericPrompt(row, styleAnchor, styleVersion, seed) {
  const styleHint = chainStyleHint(row.familyKey);
  const styleAnchorLine = styleAnchor ? `Global style anchor: ${styleAnchor}` : null;

  return oneLine([
    'Create a premium cinematic 16:9 generic TESTNET storefront hero image for Agent Town Atlas.',
    `District family: ${row.familyLabel} (${row.familyKey}).`,
    `Coverage target: ${row.agentCount} testnet agents across ${row.chainCount} testnet chains.`,
    `Visual direction: ${styleHint}.`,
    'Purpose: placeholder visual for not-yet-mainnet agents; should be reusable across testnet storefront cards for this family.',
    styleAnchorLine,
    'Constraints: no text overlays, no watermarks, no logos, no copyrighted characters.',
    'Output: clear district identity, restrained detail, category-level reusability.',
    `Style version: ${styleVersion}. Deterministic seed: ${seed}.`
  ].filter(Boolean).join(' '));
}

function chunk(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function buildPromptArtifacts(topChainRows, chainDefaultRows, uniqueAgents, sharedClusters, testnetFamilyRows, styleAnchor, opts) {
  const chainPrompts = topChainRows.map((row) => {
    const promptId = `chain:${row.familyKey}`;
    const seed = deterministicSeed(promptId, opts.styleVersion);
    const outputFileBase = `chain-${safeFileId(row.familyKey)}-${seed}`;
    return {
      promptId,
      kind: 'unique-chain',
      familyKey: row.familyKey,
      familyLabel: row.familyLabel,
      priorityRank: row.rank,
      priorityScore: row.priorityScore,
      tier: row.tier,
      seed,
      outputFileBase,
      outputFilename: `${outputFileBase}.png`,
      prompt: buildChainPrompt(row, styleAnchor, opts.styleVersion)
    };
  });

  const chainDefaultPrompts = chainDefaultRows.map((row) => {
    const promptId = `chain-default:${row.familyKey}`;
    const seed = deterministicSeed(promptId, opts.styleVersion);
    const outputFileBase = `chain-default-${safeFileId(row.familyKey)}-${seed}`;
    return {
      promptId,
      kind: 'chain-default',
      familyKey: row.familyKey,
      familyLabel: row.familyLabel,
      priorityRank: row.rank,
      priorityScore: row.priorityScore,
      tier: row.tier,
      agentCount: row.agentCount,
      chainCount: row.chainCount,
      seed,
      outputFileBase,
      outputFilename: `${outputFileBase}.png`,
      prompt: buildChainDefaultPrompt(row, styleAnchor, opts.styleVersion, seed)
    };
  });

  const uniqueAgentPrompts = uniqueAgents.map((agent) => {
    const promptId = `agent:${agent.erc8004Id}`;
    const seed = deterministicSeed(promptId, opts.styleVersion);
    const outputFileBase = `${safeFileId(agent.erc8004Id)}-${seed}`;
    return {
      promptId,
      kind: 'unique-agent',
      erc8004Id: agent.erc8004Id,
      houseId: agent.houseId,
      source: agent.source || 'evm',
      familyKey: agent.chainFamilyKey,
      familyLabel: agent.chainFamilyLabel,
      chainId: agent.chainId,
      chainName: agent.chainName,
      networkType: agent.networkType,
      totalScore: Number(agent.totalScore || 0),
      qualityScore: Number(agent.qualityScore || 0),
      confidence: Number(agent.confidence || 0),
      riskScore: Number(agent.riskScore || 0),
      planningScore: Number(agent.planningScore || 0),
      rank: agent.rank,
      seed,
      outputFileBase,
      outputFilename: `${outputFileBase}.png`,
      prompt: buildUniqueAgentPrompt(agent, styleAnchor, opts.styleVersion, seed)
    };
  });

  const sharedCategoryPrompts = sharedClusters.map((cluster) => {
    const promptId = `shared:${cluster.clusterKey}`;
    const seed = deterministicSeed(promptId, opts.styleVersion);
    const outputFileBase = `shared-${safeFileId(cluster.clusterKey)}-${seed}`;
    return {
      promptId,
      kind: 'shared-category',
      clusterKey: cluster.clusterKey,
      clusterType: cluster.clusterType,
      familyKey: cluster.familyKey,
      familyLabel: cluster.familyLabel,
      agentCount: cluster.agentCount,
      seed,
      outputFileBase,
      outputFilename: `${outputFileBase}.png`,
      prompt: buildSharedPrompt(cluster, styleAnchor, opts.styleVersion, seed)
    };
  });

  const testnetGenericPrompts = testnetFamilyRows.map((row) => {
    const promptId = `testnet-generic:${row.familyKey}`;
    const seed = deterministicSeed(promptId, opts.styleVersion);
    const outputFileBase = `testnet-generic-${safeFileId(row.familyKey)}-${seed}`;
    return {
      promptId,
      kind: 'testnet-generic-chain',
      familyKey: row.familyKey,
      familyLabel: row.familyLabel,
      agentCount: row.agentCount,
      chainCount: row.chainCount,
      seed,
      outputFileBase,
      outputFilename: `${outputFileBase}.png`,
      prompt: buildTestnetGenericPrompt(row, styleAnchor, opts.styleVersion, seed)
    };
  });

  const allPrompts = chainPrompts.concat(chainDefaultPrompts, uniqueAgentPrompts, sharedCategoryPrompts, testnetGenericPrompts);
  allPrompts.forEach((row, idx) => {
    row.lineNumber = idx + 1;
  });

  return {
    chainPrompts,
    chainDefaultPrompts,
    uniqueAgentPrompts,
    sharedCategoryPrompts,
    testnetGenericPrompts,
    allPrompts
  };
}

function buildIngestMap(assignments, uniqueAgentPrompts, sharedPrompts, chainDefaultPrompts) {
  const uniqueById = new Map(uniqueAgentPrompts.map((row) => [row.erc8004Id, row]));
  const sharedByCluster = new Map(sharedPrompts.map((row) => [row.clusterKey, row]));
  const chainDefaultByFamily = new Map(chainDefaultPrompts.map((row) => [row.familyKey, row]));

  const rows = [];
  for (const entry of assignments) {
    let prompt = null;
    if (entry.assignmentKind === 'unique-agent') {
      prompt = uniqueById.get(entry.erc8004Id);
    } else if (entry.assignmentKind === 'chain-default') {
      prompt = chainDefaultByFamily.get(entry.chainFamilyKey);
    } else {
      prompt = sharedByCluster.get(entry.clusterKey);
    }
    if (!prompt) continue;

    rows.push({
      erc8004Id: entry.erc8004Id,
      houseId: entry.houseId,
      source: entry.source || 'evm',
      chainId: entry.chainId,
      chainName: entry.chainName,
      chainFamilyKey: entry.chainFamilyKey,
      chainFamilyLabel: entry.chainFamilyLabel,
      networkType: entry.networkType,
      totalScore: Number(entry.totalScore || 0),
      qualityScore: Number(entry.qualityScore || 0),
      confidence: Number(entry.confidence || 0),
      riskScore: Number(entry.riskScore || 0),
      planningScore: Number(entry.planningScore || 0),
      assignmentKind: entry.assignmentKind,
      clusterType: entry.clusterType || null,
      clusterKey: entry.clusterKey || null,
      inTopChain: entry.inTopChain ? '1' : '0',
      forcedGeneric: entry.forcedGeneric ? '1' : '0',
      promptId: prompt.promptId,
      outputFileBase: prompt.outputFileBase,
      outputFilename: prompt.outputFilename
    });
  }

  rows.sort((a, b) =>
    a.assignmentKind.localeCompare(b.assignmentKind)
    || Number(b.planningScore || 0) - Number(a.planningScore || 0)
    || String(a.erc8004Id || '').localeCompare(String(b.erc8004Id || ''))
  );

  return rows;
}

function summarizeCountsBy(rows, key) {
  const counts = {};
  for (const row of rows) {
    const value = String(row[key] || 'unknown');
    counts[value] = (counts[value] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    printHelp();
    return;
  }

  if (!fs.existsSync(opts.sqlitePath)) {
    throw new Error(`SQLITE_NOT_FOUND:${opts.sqlitePath}`);
  }

  const styleAnchor = loadStyleAnchor(opts);
  const excludedAgentIds = loadExcludedAgentIds(opts);
  const { targetsById } = loadStoreTargets(opts);
  const evmAgents = loadEvmAgents(opts.sqlitePath);
  const solanaAgents = loadSolanaAgents(opts.sqlitePath, opts);
  const evmPlanningAgents = opts.includeTestnets
    ? evmAgents.slice()
    : evmAgents.filter((agent) => agent.networkType !== 'testnet');
  const planningAgents = evmPlanningAgents.concat(solanaAgents);
  const excludedTestnetAgents = Math.max(0, evmAgents.length - evmPlanningAgents.length);
  const testnetAgents = evmAgents.filter((agent) => agent.networkType === 'testnet');

  const signalAvailability = summarizeSignalAvailability(evmAgents);
  const solanaSignalAvailability = summarizeSolanaSignalAvailability(solanaAgents);
  const rankedFamilies = aggregateFamilies(planningAgents, opts);
  const rankedChains = aggregateChains(planningAgents, opts);
  const testnetFamilyRows = aggregateFamilies(testnetAgents, opts);

  const { candidates, missingInSqlite, skippedWithExistingShareHero } = buildPlanningCandidates(
    planningAgents,
    rankedFamilies,
    targetsById,
    opts
  );

  const topChainRows = pickTopChains(rankedFamilies, opts);
  const {
    uniqueAgents,
    sharedClusters,
    assigned,
    chainDefaultFamilyKeys,
    excludedForcedGenericCount
  } = assignImagePlan(candidates, topChainRows, excludedAgentIds, opts);
  const chainDefaultKeySet = new Set(chainDefaultFamilyKeys);
  const chainDefaultRows = opts.fallbackAssignment === 'chain-default'
    ? rankedFamilies.filter((row) => chainDefaultKeySet.has(row.familyKey))
    : [];

  const worthyAgents = uniqueAgents
    .slice(0, opts.shortlistLimit)
    .map((row) => ({
      rank: row.rank,
      erc8004Id: row.erc8004Id,
      houseId: row.houseId,
      source: row.source || 'evm',
      chainId: row.chainId,
      chainName: row.chainName,
      chainFamilyKey: row.chainFamilyKey,
      chainFamilyLabel: row.chainFamilyLabel,
      networkType: row.networkType,
      totalScore: Number(row.totalScore || 0),
      qualityScore: Number(row.qualityScore || 0),
      confidence: Number(row.confidence || 0),
      riskScore: Number(row.riskScore || 0),
      planningScore: Number(row.planningScore || 0),
      serviceLike: row.serviceLike ? '1' : '0',
      x402Supported: row.x402Supported ? '1' : '0',
      endpointVerified: row.endpointVerified ? '1' : '0',
      hasExternalUrl: row.hasExternalUrl ? '1' : '0',
      hasMcp: row.mcpEndpoint ? '1' : '0',
      hasA2a: row.a2aEndpoint ? '1' : '0',
      hasOasf: row.oasfEndpoint ? '1' : '0'
    }));

  const promptArtifacts = buildPromptArtifacts(
    topChainRows,
    chainDefaultRows,
    uniqueAgents,
    sharedClusters,
    testnetFamilyRows,
    styleAnchor,
    opts
  );
  const ingestRows = buildIngestMap(
    assigned,
    promptArtifacts.uniqueAgentPrompts,
    promptArtifacts.sharedCategoryPrompts,
    promptArtifacts.chainDefaultPrompts
  );

  fs.rmSync(opts.outDir, { recursive: true, force: true });
  ensureDir(opts.outDir);
  const outAnalysis = path.join(opts.outDir, 'analysis');
  const outPrompts = path.join(opts.outDir, 'prompts');
  const outPromptBatches = path.join(outPrompts, 'batches');
  const outIngest = path.join(opts.outDir, 'ingest');
  ensureDir(outAnalysis);
  ensureDir(outPrompts);
  ensureDir(outPromptBatches);
  ensureDir(outIngest);

  writeJson(path.join(outAnalysis, 'signal-availability.json'), signalAvailability);
  writeJson(path.join(outAnalysis, 'solana-signal-availability.json'), solanaSignalAvailability);

  writeJson(path.join(outAnalysis, 'ranked-chain-distribution.json'), rankedFamilies);
  writeCsv(
    path.join(outAnalysis, 'ranked-chain-distribution.csv'),
    [
      'rank',
      'familyKey',
      'familyLabel',
      'agentCount',
      'mainnetAgents',
      'testnetAgents',
      'otherNetworkAgents',
      'chainCount',
      'priorityScore',
      'tier',
      'avgScore',
      'p90Score',
      'maxScore',
      'serviceLikePct',
      'highScoreCount',
      'x402SupportedCount',
      'endpointVerifiedCount',
      'hasExternalUrlCount',
      'topChainId',
      'topChainName'
    ],
    rankedFamilies
  );

  writeJson(path.join(outAnalysis, 'ranked-chain-network-split.json'), rankedChains);
  writeCsv(
    path.join(outAnalysis, 'ranked-chain-network-split.csv'),
    [
      'rank',
      'chainId',
      'chainName',
      'familyKey',
      'familyLabel',
      'networkType',
      'agentCount',
      'priorityScore',
      'tier',
      'avgScore',
      'p90Score',
      'maxScore',
      'serviceLikePct',
      'highScoreCount',
      'x402SupportedCount',
      'endpointVerifiedCount',
      'hasExternalUrlCount'
    ],
    rankedChains
  );

  writeJson(path.join(outAnalysis, 'testnet-chain-distribution.json'), testnetFamilyRows);
  writeCsv(
    path.join(outAnalysis, 'testnet-chain-distribution.csv'),
    [
      'rank',
      'familyKey',
      'familyLabel',
      'agentCount',
      'mainnetAgents',
      'testnetAgents',
      'chainCount',
      'priorityScore',
      'tier',
      'avgScore',
      'p90Score',
      'maxScore',
      'serviceLikePct',
      'highScoreCount',
      'x402SupportedCount',
      'endpointVerifiedCount',
      'hasExternalUrlCount',
      'topChainId',
      'topChainName'
    ],
    testnetFamilyRows
  );

  writeJsonl(path.join(outAnalysis, 'ranked-worthy-agents.jsonl'), worthyAgents);
  writeCsv(
    path.join(outAnalysis, 'ranked-worthy-agents.csv'),
    [
      'rank',
      'erc8004Id',
      'houseId',
      'source',
      'chainId',
      'chainName',
      'chainFamilyKey',
      'chainFamilyLabel',
      'networkType',
      'totalScore',
      'qualityScore',
      'confidence',
      'riskScore',
      'planningScore',
      'serviceLike',
      'x402Supported',
      'endpointVerified',
      'hasExternalUrl',
      'hasMcp',
      'hasA2a',
      'hasOasf'
    ],
    worthyAgents
  );

  writeTxt(path.join(outPrompts, 'all-prompts.txt'), promptArtifacts.allPrompts.map((row) => row.prompt));
  writeJsonl(path.join(outPrompts, 'all-prompts.jsonl'), promptArtifacts.allPrompts);
  writeCsv(
    path.join(outPrompts, 'all-prompts.csv'),
    [
      'lineNumber',
      'promptId',
      'kind',
      'familyKey',
      'familyLabel',
      'erc8004Id',
      'houseId',
      'clusterKey',
      'outputFileBase',
      'outputFilename',
      'seed',
      'prompt'
    ],
    promptArtifacts.allPrompts
  );

  writeTxt(path.join(outPrompts, 'chain-prompts.txt'), promptArtifacts.chainPrompts.map((row) => row.prompt));
  writeJsonl(path.join(outPrompts, 'chain-prompts.jsonl'), promptArtifacts.chainPrompts);

  writeTxt(path.join(outPrompts, 'chain-default-prompts.txt'), promptArtifacts.chainDefaultPrompts.map((row) => row.prompt));
  writeJsonl(path.join(outPrompts, 'chain-default-prompts.jsonl'), promptArtifacts.chainDefaultPrompts);

  writeTxt(path.join(outPrompts, 'unique-agent-prompts.txt'), promptArtifacts.uniqueAgentPrompts.map((row) => row.prompt));
  writeJsonl(path.join(outPrompts, 'unique-agent-prompts.jsonl'), promptArtifacts.uniqueAgentPrompts);

  writeTxt(path.join(outPrompts, 'shared-category-prompts.txt'), promptArtifacts.sharedCategoryPrompts.map((row) => row.prompt));
  writeJsonl(path.join(outPrompts, 'shared-category-prompts.jsonl'), promptArtifacts.sharedCategoryPrompts);

  writeTxt(path.join(outPrompts, 'testnet-generic-chain-prompts.txt'), promptArtifacts.testnetGenericPrompts.map((row) => row.prompt));
  writeJsonl(path.join(outPrompts, 'testnet-generic-chain-prompts.jsonl'), promptArtifacts.testnetGenericPrompts);

  const batches = chunk(promptArtifacts.allPrompts, opts.batchSize);
  for (let i = 0; i < batches.length; i += 1) {
    const index = String(i + 1).padStart(4, '0');
    const batchRows = batches[i];
    writeTxt(path.join(outPromptBatches, `batch-${index}.txt`), batchRows.map((row) => row.prompt));
    writeJsonl(
      path.join(outPromptBatches, `batch-${index}.map.jsonl`),
      batchRows.map((row, lineIndex) => ({
        lineNumber: lineIndex + 1,
        promptId: row.promptId,
        kind: row.kind,
        erc8004Id: row.erc8004Id || null,
        houseId: row.houseId || null,
        clusterKey: row.clusterKey || null,
        outputFilename: row.outputFilename
      }))
    );
  }

  writeJsonl(path.join(outIngest, 'agent-image-map.jsonl'), ingestRows);
  writeCsv(
    path.join(outIngest, 'agent-image-map.csv'),
    [
      'erc8004Id',
      'houseId',
      'source',
      'chainId',
      'chainName',
      'chainFamilyKey',
      'chainFamilyLabel',
      'networkType',
      'totalScore',
      'qualityScore',
      'confidence',
      'riskScore',
      'planningScore',
      'assignmentKind',
      'clusterType',
      'clusterKey',
      'inTopChain',
      'forcedGeneric',
      'promptId',
      'outputFileBase',
      'outputFilename'
    ],
    ingestRows
  );

  const chainMapRows = promptArtifacts.chainPrompts
    .concat(promptArtifacts.chainDefaultPrompts)
    .concat(promptArtifacts.testnetGenericPrompts);
  writeJsonl(path.join(outIngest, 'chain-image-map.jsonl'), chainMapRows);
  writeCsv(
    path.join(outIngest, 'chain-image-map.csv'),
    [
      'promptId',
      'kind',
      'familyKey',
      'familyLabel',
      'priorityRank',
      'priorityScore',
      'tier',
      'agentCount',
      'chainCount',
      'outputFileBase',
      'outputFilename'
    ],
    chainMapRows
  );

  const beforeClusteringImages =
    candidates.length
    + promptArtifacts.chainPrompts.length
    + promptArtifacts.chainDefaultPrompts.length
    + promptArtifacts.testnetGenericPrompts.length;
  const afterClusteringImages =
    promptArtifacts.chainPrompts.length
    + promptArtifacts.chainDefaultPrompts.length
    + promptArtifacts.uniqueAgentPrompts.length
    + promptArtifacts.sharedCategoryPrompts.length
    + promptArtifacts.testnetGenericPrompts.length;
  const reducedImages = Math.max(0, beforeClusteringImages - afterClusteringImages);
  const reductionPct = beforeClusteringImages > 0 ? round2((reducedImages / beforeClusteringImages) * 100) : 0;

  const estimatedImages = afterClusteringImages * opts.candidatesPerPrompt;
  const estimatedCostUsd = round2(estimatedImages * opts.estimatedUnitCostUsd);

  const summary = {
    generatedAt: new Date().toISOString(),
    source: {
      sqlitePath: opts.sqlitePath,
      storePath: opts.storePath || null,
      solanaPrefix: opts.solanaPrefix
    },
    policy: {
      uniqueChains: {
        topChainLimit: opts.topChainLimit,
        chainPriorityMin: opts.chainPriorityMin
      },
      uniqueAgents: {
        minTotalScore: opts.agentScoreMin,
        requiresServiceLike: true,
        allowsSolanaQualityOverride: true,
        solanaQualityScoreGt: opts.solanaQualityMin
      },
      includeSolana: opts.includeSolana,
      fallbackAssignment: opts.fallbackAssignment,
      excludedAgents: {
        file: opts.excludedAgentFile || null,
        explicitIds: opts.excludedAgentIds.length,
        totalLoaded: excludedAgentIds.size
      },
      sharedCategories: {
        lowScoreMax: opts.lowScoreMax,
        buckets: ['no-service', 'no-external-url', 'low-score', 'service-general']
      },
      planningNetwork: opts.includeTestnets ? 'all' : 'mainnet-only',
      excludedTestnetAgents: opts.includeTestnets ? 0 : excludedTestnetAgents,
      includeExistingShareHero: opts.includeExistingShareHero
    },
    signalAvailability: {
      evm: signalAvailability,
      solana: solanaSignalAvailability
    },
    counts: {
      agentsInSqlite: evmAgents.length + solanaAgents.length,
      evmAgents: evmAgents.length,
      solanaAgents: solanaAgents.length,
      planningAgents: planningAgents.length,
      evmPlanningAgents: evmPlanningAgents.length,
      excludedTestnetAgents,
      testnetAgents: testnetAgents.length,
      testnetFamilies: testnetFamilyRows.length,
      storeTargets: targetsById.size,
      planningCandidates: candidates.length,
      skippedWithExistingShareHero,
      missingTargetsInSqlite: missingInSqlite,
      excludedAgentIdsLoaded: excludedAgentIds.size,
      excludedForcedGenericCount,
      rankedWorthyAgents: worthyAgents.length,
      uniqueChainPrompts: promptArtifacts.chainPrompts.length,
      chainDefaultPrompts: promptArtifacts.chainDefaultPrompts.length,
      testnetGenericChainPrompts: promptArtifacts.testnetGenericPrompts.length,
      uniqueAgentPrompts: promptArtifacts.uniqueAgentPrompts.length,
      sharedCategoryPrompts: promptArtifacts.sharedCategoryPrompts.length,
      promptRowsTotal: promptArtifacts.allPrompts.length,
      ingestMapRows: ingestRows.length,
      imagesBeforeClustering: beforeClusteringImages,
      imagesAfterClustering: afterClusteringImages,
      imagesReduced: reducedImages,
      reductionPct,
      candidatesPerPrompt: opts.candidatesPerPrompt,
      estimatedImagesToGenerate: estimatedImages,
      estimatedUnitCostUsd: round2(opts.estimatedUnitCostUsd),
      estimatedCostUsd
    },
    distributions: {
      familyTiers: summarizeCountsBy(rankedFamilies, 'tier'),
      planningNetworkSplit: summarizeCountsBy(planningAgents, 'networkType'),
      testnetFamilyTiers: summarizeCountsBy(testnetFamilyRows, 'tier'),
      assignedKinds: summarizeCountsBy(ingestRows, 'assignmentKind'),
      forcedGeneric: summarizeCountsBy(ingestRows, 'forcedGeneric'),
      sharedClusterTypes: summarizeCountsBy(ingestRows.filter((row) => row.assignmentKind === 'shared-category'), 'clusterType')
    },
    top: {
      chains: rankedFamilies.slice(0, 20).map((row) => ({
        rank: row.rank,
        familyKey: row.familyKey,
        familyLabel: row.familyLabel,
        agentCount: row.agentCount,
        mainnetAgents: row.mainnetAgents,
        testnetAgents: row.testnetAgents,
        otherNetworkAgents: row.otherNetworkAgents,
        priorityScore: row.priorityScore,
        tier: row.tier,
        avgScore: row.avgScore
      })),
      worthyAgents: worthyAgents.slice(0, 100)
    },
    outputs: {
      analysisDir: outAnalysis,
      promptsDir: outPrompts,
      ingestDir: outIngest,
      solanaSignalAvailabilityFile: path.join(outAnalysis, 'solana-signal-availability.json'),
      testnetDistributionFile: path.join(outAnalysis, 'testnet-chain-distribution.csv'),
      chainDefaultPromptsFile: path.join(outPrompts, 'chain-default-prompts.txt'),
      testnetGenericPromptsFile: path.join(outPrompts, 'testnet-generic-chain-prompts.txt'),
      summaryFile: path.join(opts.outDir, 'summary.json')
    }
  };

  writeJson(path.join(opts.outDir, 'summary.json'), summary);

  process.stdout.write(`[image-plan] sqlite_agents=${evmAgents.length + solanaAgents.length} evm_agents=${evmAgents.length} solana_agents=${solanaAgents.length} planning_agents=${planningAgents.length} excluded_testnet=${excludedTestnetAgents} store_targets=${targetsById.size} candidates=${candidates.length}\n`);
  process.stdout.write(`[image-plan] chain_rank_rows=${rankedFamilies.length} worthy_agents=${worthyAgents.length} testnet_families=${testnetFamilyRows.length}\n`);
  process.stdout.write(`[image-plan] prompts total=${promptArtifacts.allPrompts.length} chain=${promptArtifacts.chainPrompts.length} chain_default=${promptArtifacts.chainDefaultPrompts.length} unique_agent=${promptArtifacts.uniqueAgentPrompts.length} shared=${promptArtifacts.sharedCategoryPrompts.length} testnet_generic=${promptArtifacts.testnetGenericPrompts.length}\n`);
  process.stdout.write(`[image-plan] fallback_assignment=${opts.fallbackAssignment} solana_quality_gt=${opts.solanaQualityMin} excluded_ids_loaded=${excludedAgentIds.size} forced_generic=${excludedForcedGenericCount}\n`);
  process.stdout.write(`[image-plan] images before=${beforeClusteringImages} after=${afterClusteringImages} reduced=${reducedImages} (${reductionPct}%) estimated_images=${estimatedImages}\n`);
  process.stdout.write(`[image-plan] out_dir=${opts.outDir}\n`);
}

main();
