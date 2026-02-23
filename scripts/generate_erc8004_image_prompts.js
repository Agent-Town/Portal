#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

const DEFAULT_SQLITE_PATH = './data/erc8004.sqlite3';
const DEFAULT_OUT_BASENAME = './data/erc8004-image-prompts';
const DEFAULT_SCOPE = 'missing-share-hero';
const DEFAULT_STYLE_VERSION = 'v1';
const DEFAULT_CANDIDATES_PER_AGENT = 1;
const DEFAULT_ESTIMATED_UNIT_COST_USD = 0.042; // GPT Image 1 medium 1024x1024
const DEFAULT_SOLANA_PREFIX = 'solana-devnet';
const DEFAULT_STYLE_ANCHOR = null;

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
  solana: 'high-speed coastal neon district, parallel transit vectors',
  unknown: 'futuristic but grounded district design, clean composition'
});

function printHelp() {
  process.stdout.write(
    [
      'Generate deterministic image prompts for ERC-8004 storefront/share-hero generation.',
      '',
      'Usage:',
      '  node scripts/generate_erc8004_image_prompts.js [options]',
      '',
      'Options:',
      `  --sqlite-path <path>             Source SQLite (default: ${DEFAULT_SQLITE_PATH})`,
      '  --store-path <path>              Backend store sqlite (default: server/store.js default)',
      `  --scope <${['all', 'missing-share-hero', 'missing-agent-avatar'].join('|')}>`,
      `                                  Filter set (default: ${DEFAULT_SCOPE})`,
      `  --style-version <v>              Prompt style version (default: ${DEFAULT_STYLE_VERSION})`,
      '  --style-anchor <text>            Global style anchor text appended to every prompt',
      '  --style-anchor-file <path>       File containing global style anchor text',
      `  --solana-prefix <prefix>         Solana id prefix (default: ${DEFAULT_SOLANA_PREFIX})`,
      `  --candidates-per-agent <n>       Cost planning multiplier (default: ${DEFAULT_CANDIDATES_PER_AGENT})`,
      `  --estimated-unit-cost-usd <n>    Cost per generated image (default: ${DEFAULT_ESTIMATED_UNIT_COST_USD})`,
      `  --out-basename <path>            Output basename (default: ${DEFAULT_OUT_BASENAME})`,
      '  --help                           Show this help',
      '',
      'Outputs:',
      '  <basename>.jsonl',
      '  <basename>.csv',
      '  <basename>-summary.json'
    ].join('\n') + '\n'
  );
}

function parseArgs(argv) {
  const opts = {
    sqlitePath: DEFAULT_SQLITE_PATH,
    storePath: null,
    scope: DEFAULT_SCOPE,
    styleVersion: DEFAULT_STYLE_VERSION,
    outBasename: DEFAULT_OUT_BASENAME,
    candidatesPerAgent: DEFAULT_CANDIDATES_PER_AGENT,
    estimatedUnitCostUsd: DEFAULT_ESTIMATED_UNIT_COST_USD,
    solanaPrefix: DEFAULT_SOLANA_PREFIX,
    styleAnchor: DEFAULT_STYLE_ANCHOR,
    styleAnchorFile: null,
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
    if (token === '--scope') {
      opts.scope = nextValue(i, token);
      i += 1;
      continue;
    }
    if (token.startsWith('--scope=')) {
      opts.scope = token.slice('--scope='.length);
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
    if (token === '--style-anchor') {
      opts.styleAnchor = nextValue(i, token);
      i += 1;
      continue;
    }
    if (token.startsWith('--style-anchor=')) {
      opts.styleAnchor = token.slice('--style-anchor='.length);
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
    if (token === '--solana-prefix') {
      opts.solanaPrefix = nextValue(i, token);
      i += 1;
      continue;
    }
    if (token.startsWith('--solana-prefix=')) {
      opts.solanaPrefix = token.slice('--solana-prefix='.length);
      continue;
    }
    if (token === '--out-basename') {
      opts.outBasename = nextValue(i, token);
      i += 1;
      continue;
    }
    if (token.startsWith('--out-basename=')) {
      opts.outBasename = token.slice('--out-basename='.length);
      continue;
    }
    if (token === '--candidates-per-agent') {
      opts.candidatesPerAgent = Number(nextValue(i, token));
      i += 1;
      continue;
    }
    if (token.startsWith('--candidates-per-agent=')) {
      opts.candidatesPerAgent = Number(token.slice('--candidates-per-agent='.length));
      continue;
    }
    if (token === '--estimated-unit-cost-usd') {
      opts.estimatedUnitCostUsd = Number(nextValue(i, token));
      i += 1;
      continue;
    }
    if (token.startsWith('--estimated-unit-cost-usd=')) {
      opts.estimatedUnitCostUsd = Number(token.slice('--estimated-unit-cost-usd='.length));
      continue;
    }
    throw new Error(`UNKNOWN_ARG:${token}`);
  }

  const scopes = new Set(['all', 'missing-share-hero', 'missing-agent-avatar']);
  if (!scopes.has(opts.scope)) throw new Error('INVALID_SCOPE');
  if (!Number.isFinite(opts.candidatesPerAgent) || opts.candidatesPerAgent <= 0) {
    throw new Error('INVALID_CANDIDATES_PER_AGENT');
  }
  opts.candidatesPerAgent = Math.floor(opts.candidatesPerAgent);
  if (!Number.isFinite(opts.estimatedUnitCostUsd) || opts.estimatedUnitCostUsd < 0) {
    throw new Error('INVALID_ESTIMATED_UNIT_COST_USD');
  }
  opts.sqlitePath = path.resolve(opts.sqlitePath);
  opts.outBasename = path.resolve(opts.outBasename);
  opts.solanaPrefix = String(opts.solanaPrefix || '').trim() || DEFAULT_SOLANA_PREFIX;
  if (opts.styleAnchorFile) opts.styleAnchorFile = path.resolve(opts.styleAnchorFile);
  return opts;
}

function nonEmpty(value) {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  return v ? v : null;
}

function parseJsonSafe(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function pickFirstStringFromObject(obj, paths) {
  if (!obj || typeof obj !== 'object') return null;
  for (const pathParts of paths) {
    let value = obj;
    let ok = true;
    for (const p of pathParts) {
      if (!value || typeof value !== 'object' || Array.isArray(value) || !(p in value)) {
        ok = false;
        break;
      }
      value = value[p];
    }
    if (!ok) continue;
    const out = nonEmpty(value);
    if (out) return out;
  }
  return null;
}

function truncateText(input, maxLen) {
  const v = nonEmpty(input);
  if (!v) return null;
  if (v.length <= maxLen) return v;
  return `${v.slice(0, maxLen - 1)}…`;
}

function safeFileId(input) {
  return String(input || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'agent';
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

function deterministicSeed(erc8004Id, styleVersion) {
  return crypto.createHash('sha256').update(`${erc8004Id}|${styleVersion}`, 'utf8').digest('hex').slice(0, 16);
}

function promptForAgent(agent, styleAnchor) {
  const description = truncateText(agent.description, 320) || 'No capability description was provided.';
  const name = truncateText(agent.name, 120) || `Agent ${agent.erc8004Id}`;
  const familyLabel = agent.chainFamilyLabel || 'Unknown';
  const networkType = agent.networkType || 'unknown network';
  const styleHint = chainStyleHint(agent.chainFamilyKey);
  const avatarHint = agent.hasAgentAvatar
    ? 'Reference avatar is available; preserve recognizable palette and silhouette cues while reimagining scene composition.'
    : 'No avatar reference is available; build a distinct identity from name and capability description.';
  const styleAnchorLine = styleAnchor
    ? `Global style anchor: ${styleAnchor}`
    : null;

  return [
    'Create a premium 16:9 storefront hero illustration for Agent Town.',
    `Subject: autonomous agent "${name}" (ERC-8004 id: ${agent.erc8004Id}).`,
    `District context: ${familyLabel} family on ${networkType}.`,
    `Visual direction: ${styleHint}.`,
    `Capability cues: ${description}`,
    styleAnchorLine,
    avatarHint,
    'Constraints: no text overlays, no watermarks, no logos, no copyrighted characters.',
    'Output: cinematic but readable composition, high contrast focal subject, clean depth layering.',
    `Style version: ${agent.styleVersion}. Deterministic seed: ${agent.seed}.`
  ].filter(Boolean).join(' ');
}

function csvEscape(value) {
  const str = value == null ? '' : String(value);
  if (!str.includes('"') && !str.includes(',') && !str.includes('\n')) return str;
  return `"${str.replace(/"/g, '""')}"`;
}

function loadStoreIndex(opts) {
  if (opts.storePath) process.env.STORE_PATH = path.resolve(opts.storePath);
  const { readStore } = require('../server/store');
  const store = readStore();

  const anchorToHouse = new Map();
  for (const anchor of store.anchors || []) {
    const erc8004Id = nonEmpty(anchor?.erc8004Id);
    const houseId = nonEmpty(anchor?.houseId);
    if (!erc8004Id || !houseId || anchorToHouse.has(erc8004Id)) continue;
    anchorToHouse.set(erc8004Id, houseId);
  }

  const mediaByHouse = new Map();
  for (const house of store.houses || []) {
    const houseId = nonEmpty(house?.id);
    if (!houseId || mediaByHouse.has(houseId)) continue;
    const media = house?.media && typeof house.media === 'object' ? house.media : {};
    const shareHero = media?.shareHero || null;
    const agentAvatar = media?.agentAvatar || null;
    mediaByHouse.set(houseId, {
      hasShareHero: typeof shareHero?.image === 'string' && shareHero.image.startsWith('data:image/'),
      hasAgentAvatar: typeof agentAvatar?.image === 'string' && agentAvatar.image.startsWith('data:image/')
    });
  }

  return { anchorToHouse, mediaByHouse };
}

function loadEvmAgents(db) {
  const rows = db.prepare(
    [
      'SELECT',
      '  a.agent_id AS erc8004Id,',
      '  a.chain_id AS chainId,',
      "  COALESCE(c.name, 'Chain ' || a.chain_id) AS chainName,",
      '  COALESCE(c.is_testnet, a.is_testnet, 0) AS isTestnet,',
      "  COALESCE(a.name, '') AS name,",
      "  COALESCE(a.description, '') AS description,",
      "  COALESCE(a.image_url, '') AS imageUrl",
      'FROM erc8004_agents a',
      'LEFT JOIN erc8004_chains c ON c.chain_id = a.chain_id',
      "WHERE a.agent_id IS NOT NULL AND TRIM(a.agent_id) <> ''",
      'ORDER BY a.chain_id ASC, a.agent_id ASC'
    ].join('\n')
  ).all();

  return rows.map((row) => {
    const chainId = Number(row.chainId);
    const chainName = nonEmpty(row.chainName) || `Chain ${chainId}`;
    const family = familyForChain(chainId, chainName);
    return {
      erc8004Id: String(row.erc8004Id),
      source: 'evm',
      chainId,
      chainLabel: chainName,
      chainFamilyKey: family.key,
      chainFamilyLabel: family.label,
      networkType: Number(row.isTestnet) === 1 ? 'testnet' : 'mainnet',
      name: nonEmpty(row.name) || null,
      description: nonEmpty(row.description) || null,
      sourceAvatarUrl: nonEmpty(row.imageUrl) || null
    };
  });
}

function loadSolanaAgents(db, solanaPrefix) {
  const rows = db.prepare(
    [
      'SELECT',
      '  asset,',
      "  COALESCE(nft_name, '') AS nftName,",
      "  COALESCE(registration_json, '') AS registrationJson,",
      "  COALESCE(indexed_json, '') AS indexedJson",
      'FROM erc8004_solana_agents',
      "WHERE asset IS NOT NULL AND TRIM(asset) <> ''",
      'ORDER BY asset ASC'
    ].join('\n')
  ).all();

  const NAME_PATHS = [
    ['name'],
    ['title'],
    ['displayName'],
    ['metadata', 'name'],
    ['metadata', 'title']
  ];
  const DESCRIPTION_PATHS = [
    ['description'],
    ['bio'],
    ['summary'],
    ['metadata', 'description'],
    ['metadata', 'bio'],
    ['metadata', 'summary']
  ];
  const IMAGE_PATHS = [
    ['image'],
    ['image_url'],
    ['imageUrl'],
    ['avatar'],
    ['avatar_url'],
    ['avatarUrl'],
    ['profile_image'],
    ['profileImage'],
    ['metadata', 'image'],
    ['metadata', 'image_url'],
    ['metadata', 'imageUrl'],
    ['metadata', 'avatar'],
    ['metadata', 'avatar_url'],
    ['metadata', 'avatarUrl']
  ];

  return rows.map((row) => {
    const reg = parseJsonSafe(row.registrationJson);
    const idx = parseJsonSafe(row.indexedJson);
    const imageUrl =
      pickFirstStringFromObject(reg, IMAGE_PATHS) ||
      pickFirstStringFromObject(idx, IMAGE_PATHS) ||
      null;
    const name =
      pickFirstStringFromObject(reg, NAME_PATHS) ||
      pickFirstStringFromObject(idx, NAME_PATHS) ||
      nonEmpty(row.nftName) ||
      null;
    const description =
      pickFirstStringFromObject(reg, DESCRIPTION_PATHS) ||
      pickFirstStringFromObject(idx, DESCRIPTION_PATHS) ||
      null;

    return {
      erc8004Id: `${solanaPrefix}:${row.asset}`,
      source: 'solana',
      chainId: null,
      chainLabel: 'Solana Devnet',
      chainFamilyKey: 'solana',
      chainFamilyLabel: 'Solana',
      networkType: 'devnet',
      name,
      description,
      sourceAvatarUrl: imageUrl
    };
  });
}

function shouldIncludeAgent(agent, scope) {
  if (scope === 'all') return true;
  if (scope === 'missing-share-hero') return !agent.hasShareHero;
  if (scope === 'missing-agent-avatar') return !agent.hasAgentAvatar;
  return true;
}

function buildSummary(records, opts) {
  const byFamily = {};
  const bySource = {};
  let withSourceAvatarUrl = 0;
  let withImportedAvatar = 0;
  let withImportedShareHero = 0;
  for (const rec of records) {
    if (rec.sourceAvatarUrl) withSourceAvatarUrl += 1;
    if (rec.hasAgentAvatar) withImportedAvatar += 1;
    if (rec.hasShareHero) withImportedShareHero += 1;
    bySource[rec.source] = (bySource[rec.source] || 0) + 1;
    byFamily[rec.chainFamilyKey] = (byFamily[rec.chainFamilyKey] || 0) + 1;
  }

  const unit = opts.estimatedUnitCostUsd;
  const n = records.length;
  const c = opts.candidatesPerAgent;
  const estimatedImages = n * c;

  return {
    generatedAt: new Date().toISOString(),
    scope: opts.scope,
    styleVersion: opts.styleVersion,
    totals: {
      prompts: n,
      estimatedImages,
      candidatesPerAgent: c,
      withSourceAvatarUrl,
      withImportedAvatar,
      withImportedShareHero
    },
    estimatedCostUsd: {
      configuredUnitCost: Number(unit.toFixed(6)),
      configuredTotal: Number((estimatedImages * unit).toFixed(2)),
      gptImage1_1024: {
        low_0_011: Number((estimatedImages * 0.011).toFixed(2)),
        medium_0_042: Number((estimatedImages * 0.042).toFixed(2)),
        high_0_167: Number((estimatedImages * 0.167).toFixed(2))
      }
    },
    distribution: {
      bySource,
      byChainFamily: byFamily
    }
  };
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
  let styleAnchor = nonEmpty(opts.styleAnchor);
  if (opts.styleAnchorFile) {
    if (!fs.existsSync(opts.styleAnchorFile)) throw new Error(`STYLE_ANCHOR_FILE_NOT_FOUND:${opts.styleAnchorFile}`);
    styleAnchor = nonEmpty(fs.readFileSync(opts.styleAnchorFile, 'utf8'));
  }

  const { anchorToHouse, mediaByHouse } = loadStoreIndex(opts);
  const db = new DatabaseSync(opts.sqlitePath, { readOnly: true });
  let records = [];
  try {
    records = loadEvmAgents(db).concat(loadSolanaAgents(db, opts.solanaPrefix));
  } finally {
    db.close();
  }

  const promptRecords = [];
  for (const row of records) {
    const houseId = anchorToHouse.get(row.erc8004Id) || null;
    const mediaFlags = houseId ? mediaByHouse.get(houseId) : null;
    const hasShareHero = Boolean(mediaFlags?.hasShareHero);
    const hasAgentAvatar = Boolean(mediaFlags?.hasAgentAvatar);
    const seed = deterministicSeed(row.erc8004Id, opts.styleVersion);
    const agent = {
      ...row,
      houseId,
      hasShareHero,
      hasAgentAvatar,
      styleVersion: opts.styleVersion,
      seed
    };
    if (!shouldIncludeAgent(agent, opts.scope)) continue;
    const outputFileBase = `${safeFileId(agent.erc8004Id)}-${agent.seed}`;
    promptRecords.push({
      ...agent,
      styleAnchor: styleAnchor || null,
      outputFileBase,
      outputFilename: `${outputFileBase}.png`,
      prompt: promptForAgent(agent, styleAnchor)
    });
  }

  promptRecords.sort((a, b) => a.erc8004Id.localeCompare(b.erc8004Id));

  const outJsonl = `${opts.outBasename}.jsonl`;
  const outCsv = `${opts.outBasename}.csv`;
  const outSummary = `${opts.outBasename}-summary.json`;
  fs.mkdirSync(path.dirname(outJsonl), { recursive: true });

  const jsonlHandle = fs.createWriteStream(outJsonl, { encoding: 'utf8' });
  for (const rec of promptRecords) {
    jsonlHandle.write(`${JSON.stringify(rec)}\n`);
  }
  jsonlHandle.end();

  const csvHeaders = [
    'erc8004Id',
    'source',
    'chainId',
    'chainLabel',
    'chainFamilyKey',
    'chainFamilyLabel',
    'networkType',
    'houseId',
    'name',
    'description',
    'sourceAvatarUrl',
    'hasAgentAvatar',
    'hasShareHero',
    'styleVersion',
    'styleAnchor',
    'seed',
    'outputFileBase',
    'outputFilename',
    'prompt'
  ];
  const csvLines = [csvHeaders.join(',')];
  for (const rec of promptRecords) {
    const row = [
      rec.erc8004Id,
      rec.source,
      rec.chainId == null ? '' : rec.chainId,
      rec.chainLabel,
      rec.chainFamilyKey,
      rec.chainFamilyLabel,
      rec.networkType,
      rec.houseId || '',
      rec.name || '',
      rec.description || '',
      rec.sourceAvatarUrl || '',
      rec.hasAgentAvatar ? 'true' : 'false',
      rec.hasShareHero ? 'true' : 'false',
      rec.styleVersion,
      rec.styleAnchor || '',
      rec.seed,
      rec.outputFileBase,
      rec.outputFilename,
      rec.prompt
    ];
    csvLines.push(row.map(csvEscape).join(','));
  }
  fs.writeFileSync(outCsv, `${csvLines.join('\n')}\n`, 'utf8');

  const summary = buildSummary(promptRecords, opts);
  fs.writeFileSync(outSummary, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');

  process.stdout.write(
    [
      `[prompts] source_sqlite=${opts.sqlitePath}`,
      `[prompts] scope=${opts.scope} style=${opts.styleVersion}`,
      `[prompts] style_anchor=${styleAnchor ? 'set' : 'none'}`,
      `[prompts] records=${promptRecords.length}`,
      `[prompts] out_jsonl=${outJsonl}`,
      `[prompts] out_csv=${outCsv}`,
      `[prompts] out_summary=${outSummary}`,
      `[prompts] estimated_images=${summary.totals.estimatedImages} configured_cost_usd=${summary.estimatedCostUsd.configuredTotal}`
    ].join('\n') + '\n'
  );
}

try {
  main();
} catch (err) {
  process.stderr.write(`${err?.message || String(err)}\n`);
  process.exit(1);
}
