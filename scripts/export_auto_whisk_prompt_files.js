#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DEFAULT_OUT_DIR = './data/erc8004-whisk-prompts';
const DEFAULT_BATCH_SIZE = 200;
const DEFAULT_SOLANA_PREFIX = 'solana-devnet';
const DEFAULT_STYLE_VERSION = 'v1';
const DEFAULT_API_BASE = 'https://www.8004scan.io/api/v1';
const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_DELAY_MS = 120;
const DEFAULT_STYLE_ANCHOR_FILE = './scripts/style_anchor_agent_town_wild_west.txt';

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
      'Export Auto Whisk prompt .txt files for service-like (worthy) ERC-8004 agents.',
      '',
      'Usage:',
      '  node scripts/export_auto_whisk_prompt_files.js [options]',
      '',
      'Options:',
      `  --out-dir <path>                 Output directory (default: ${DEFAULT_OUT_DIR})`,
      '  --store-path <path>              Store sqlite path (default: server/store.js default)',
      `  --style-anchor-file <path>       Style anchor file (default: ${DEFAULT_STYLE_ANCHOR_FILE})`,
      '  --style-anchor <text>            Style anchor text override',
      `  --solana-prefix <prefix>         Solana id prefix (default: ${DEFAULT_SOLANA_PREFIX})`,
      `  --batch-size <n>                 Prompts per batch file (default: ${DEFAULT_BATCH_SIZE})`,
      `  --style-version <v>              Style version label (default: ${DEFAULT_STYLE_VERSION})`,
      `  --api-base-url <url>             8004scan base url (default: ${DEFAULT_API_BASE})`,
      `  --timeout-ms <n>                 HTTP timeout (default: ${DEFAULT_TIMEOUT_MS})`,
      `  --delay-ms <n>                   Delay between API page calls (default: ${DEFAULT_DELAY_MS})`,
      '  --include-existing-share-hero    Include entries that already have a share hero image',
      '  --max-worthy <n>                 Stop after N worthy rows (0 = unlimited)',
      '  --help',
      '',
      'Worthy criteria:',
      '  x402_supported=true OR is_endpoint_verified=true',
      '',
      'Outputs:',
      '  <out-dir>/worthy/worthy-all.txt',
      '  <out-dir>/worthy/by-chain/*.txt',
      '  <out-dir>/worthy/batches/*.txt',
      '  <out-dir>/worthy/worthy-manifest.jsonl',
      '  <out-dir>/shared/by-category/*.txt',
      '  <out-dir>/shared/category-map.csv',
      '  <out-dir>/shared/category-manifest.jsonl',
      '  <out-dir>/summary.json'
    ].join('\n') + '\n'
  );
}

function nonEmpty(value) {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  return v ? v : null;
}

function parseIntStrict(raw, fallback) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.floor(n);
}

function parseArgs(argv) {
  const opts = {
    outDir: DEFAULT_OUT_DIR,
    storePath: null,
    styleAnchorFile: DEFAULT_STYLE_ANCHOR_FILE,
    styleAnchor: null,
    solanaPrefix: DEFAULT_SOLANA_PREFIX,
    batchSize: DEFAULT_BATCH_SIZE,
    styleVersion: DEFAULT_STYLE_VERSION,
    apiBaseUrl: DEFAULT_API_BASE,
    timeoutMs: DEFAULT_TIMEOUT_MS,
    delayMs: DEFAULT_DELAY_MS,
    includeExistingShareHero: false,
    maxWorthy: 0,
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
    if (token === '--out-dir') {
      opts.outDir = nextValue(i, token);
      i += 1;
      continue;
    }
    if (token.startsWith('--out-dir=')) {
      opts.outDir = token.slice('--out-dir='.length);
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
    if (token === '--solana-prefix') {
      opts.solanaPrefix = nextValue(i, token);
      i += 1;
      continue;
    }
    if (token.startsWith('--solana-prefix=')) {
      opts.solanaPrefix = token.slice('--solana-prefix='.length);
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
    if (token === '--style-version') {
      opts.styleVersion = nextValue(i, token);
      i += 1;
      continue;
    }
    if (token.startsWith('--style-version=')) {
      opts.styleVersion = token.slice('--style-version='.length);
      continue;
    }
    if (token === '--api-base-url') {
      opts.apiBaseUrl = nextValue(i, token);
      i += 1;
      continue;
    }
    if (token.startsWith('--api-base-url=')) {
      opts.apiBaseUrl = token.slice('--api-base-url='.length);
      continue;
    }
    if (token === '--timeout-ms') {
      opts.timeoutMs = parseIntStrict(nextValue(i, token), DEFAULT_TIMEOUT_MS);
      i += 1;
      continue;
    }
    if (token.startsWith('--timeout-ms=')) {
      opts.timeoutMs = parseIntStrict(token.slice('--timeout-ms='.length), DEFAULT_TIMEOUT_MS);
      continue;
    }
    if (token === '--delay-ms') {
      opts.delayMs = parseIntStrict(nextValue(i, token), DEFAULT_DELAY_MS);
      i += 1;
      continue;
    }
    if (token.startsWith('--delay-ms=')) {
      opts.delayMs = parseIntStrict(token.slice('--delay-ms='.length), DEFAULT_DELAY_MS);
      continue;
    }
    if (token === '--max-worthy') {
      opts.maxWorthy = parseIntStrict(nextValue(i, token), 0);
      i += 1;
      continue;
    }
    if (token.startsWith('--max-worthy=')) {
      opts.maxWorthy = parseIntStrict(token.slice('--max-worthy='.length), 0);
      continue;
    }
    if (token === '--include-existing-share-hero') {
      opts.includeExistingShareHero = true;
      continue;
    }
    throw new Error(`UNKNOWN_ARG:${token}`);
  }

  opts.outDir = path.resolve(opts.outDir);
  if (opts.storePath) opts.storePath = path.resolve(opts.storePath);
  opts.styleAnchorFile = opts.styleAnchorFile ? path.resolve(opts.styleAnchorFile) : null;
  opts.solanaPrefix = nonEmpty(opts.solanaPrefix) || DEFAULT_SOLANA_PREFIX;
  opts.styleVersion = nonEmpty(opts.styleVersion) || DEFAULT_STYLE_VERSION;
  opts.apiBaseUrl = (nonEmpty(opts.apiBaseUrl) || DEFAULT_API_BASE).replace(/\/$/, '');
  opts.batchSize = Math.max(1, opts.batchSize || DEFAULT_BATCH_SIZE);
  opts.timeoutMs = Math.max(1000, opts.timeoutMs || DEFAULT_TIMEOUT_MS);
  opts.delayMs = Math.max(0, opts.delayMs || DEFAULT_DELAY_MS);
  opts.maxWorthy = Math.max(0, opts.maxWorthy || 0);
  return opts;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeFileId(input) {
  return String(input || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'agent';
}

function deterministicSeed(id, styleVersion) {
  return crypto
    .createHash('sha256')
    .update(`${id}|${styleVersion}`, 'utf8')
    .digest('hex')
    .slice(0, 16);
}

function normalizeFamily(rawLabel) {
  const label = nonEmpty(rawLabel) || 'Unknown';
  const key = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'unknown';
  return { key, label };
}

function familyForChain(chainId, chainName, source) {
  if (source === 'solana') return { key: 'solana', label: 'Solana' };
  const known = CHAIN_FAMILY_BY_ID.get(Number(chainId));
  if (known) return known;
  if (nonEmpty(chainName)) return normalizeFamily(chainName);
  return { key: 'unknown', label: `Chain ${chainId}` };
}

function chainStyleHint(familyKey) {
  return CHAIN_STYLE_HINTS[familyKey] || CHAIN_STYLE_HINTS.unknown;
}

function firstString(arr) {
  for (const v of arr) {
    const s = nonEmpty(v);
    if (s) return s;
  }
  return null;
}

function csvEscape(value) {
  const str = value == null ? '' : String(value);
  if (!str.includes('"') && !str.includes(',') && !str.includes('\n')) return str;
  return `"${str.replace(/"/g, '""')}"`;
}

function oneLine(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function normalizeServiceSignals(agent) {
  const tags = Array.isArray(agent.tags) ? agent.tags : [];
  const services = Array.isArray(agent.services) ? agent.services : [];
  const endpoints = Array.isArray(agent.endpoints) ? agent.endpoints : [];

  const tagNames = tags
    .map((t) => (typeof t === 'string' ? t : typeof t?.name === 'string' ? t.name : null))
    .filter(Boolean)
    .slice(0, 8);

  const serviceNames = services
    .map((s) =>
      firstString([
        typeof s === 'string' ? s : null,
        s?.name,
        s?.title,
        s?.type,
        s?.service,
        s?.category
      ])
    )
    .filter(Boolean)
    .slice(0, 8);

  const endpointHints = endpoints
    .map((e) =>
      firstString([
        typeof e === 'string' ? e : null,
        e?.url,
        e?.endpoint,
        e?.target,
        e?.path,
        e?.name
      ])
    )
    .filter(Boolean)
    .slice(0, 6);

  return {
    tagNames,
    serviceNames,
    endpointHints
  };
}

function buildWorthyPrompt(rec, styleAnchor) {
  const styleHint = chainStyleHint(rec.chainFamilyKey);
  const name = nonEmpty(rec.name) || `Agent ${rec.erc8004Id}`;
  const description = nonEmpty(rec.description) || 'Autonomous service agent in the Agent Town ecosystem.';
  const servicesText = rec.serviceNames.length
    ? `Service cues: ${rec.serviceNames.join(', ')}.`
    : 'Service cues: production-grade automation and API-driven actions.';
  const tagsText = rec.tagNames.length ? `Tags: ${rec.tagNames.join(', ')}.` : null;
  const endpointText = rec.endpointHints.length
    ? `Endpoint hints: ${rec.endpointHints.slice(0, 3).join(' | ')}.`
    : null;
  const styleAnchorLine = styleAnchor ? `Global style anchor: ${styleAnchor}` : null;

  return oneLine([
    'Create a premium cinematic 16:9 storefront hero illustration for Agent Town.',
    `Subject: autonomous agent "${name}" (ERC-8004 id: ${rec.erc8004Id}).`,
    `District context: ${rec.chainFamilyLabel} family on ${rec.networkType}.`,
    `Visual direction: ${styleHint}.`,
    `Capability cues: ${description}`,
    servicesText,
    tagsText,
    endpointText,
    styleAnchorLine,
    'Constraints: no text overlays, no watermarks, no logos, no copyrighted characters.',
    'Output: high-contrast focal subject, readable depth layers, share-card friendly framing.',
    `Style version: ${rec.styleVersion}. Deterministic seed: ${rec.seed}.`
  ]
    .filter(Boolean)
    .join(' '));
}

function buildCategoryPrompt(rec, styleAnchor) {
  const styleHint = chainStyleHint(rec.chainFamilyKey);
  const styleAnchorLine = styleAnchor ? `Global style anchor: ${styleAnchor}` : null;
  return oneLine([
    'Create a premium cinematic 16:9 shared district house hero illustration for Agent Town.',
    `District context: ${rec.chainFamilyLabel} family on ${rec.networkType}.`,
    `Visual direction: ${styleHint}.`,
    'This is a reusable category image for agents without rich service metadata.',
    styleAnchorLine,
    'Constraints: no text overlays, no watermarks, no logos, no copyrighted characters.',
    'Output: iconic district landmark, strong silhouette, social-share friendly composition.',
    `Style version: ${rec.styleVersion}. Deterministic seed: ${rec.seed}.`
  ]
    .filter(Boolean)
    .join(' '));
}

function loadStoreTargets(opts) {
  if (opts.storePath) process.env.STORE_PATH = opts.storePath;
  const { readStore } = require('../server/store');
  const store = readStore();

  const housesById = new Map();
  for (const house of store.houses || []) {
    const houseId = nonEmpty(house?.id);
    if (!houseId || housesById.has(houseId)) continue;

    const mediaShareImage = house?.media?.shareHero?.image;
    const legacyShareImage = house?.publicMedia?.image;
    const hasShareHero =
      (typeof mediaShareImage === 'string' && mediaShareImage.startsWith('data:image/')) ||
      (typeof legacyShareImage === 'string' && legacyShareImage.startsWith('data:image/'));

    housesById.set(houseId, {
      houseId,
      hasShareHero,
      source: house?.preRegistration?.source || null,
      sourceChainId: house?.preRegistration?.sourceChainId ?? null,
      importTag: house?.preRegistration?.importTag || null
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
      source: houseMeta.source,
      sourceChainId: houseMeta.sourceChainId,
      importTag: houseMeta.importTag
    });
  }

  return {
    store,
    housesById,
    targetsById
  };
}

async function fetchJson(url, opts) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        accept: 'application/json',
        'user-agent': 'agenttown/auto-whisk-export'
      }
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`HTTP_${res.status}:${url}:${body.slice(0, 180)}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchWithRetry(url, opts, attempts = 5) {
  let lastErr = null;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fetchJson(url, opts);
    } catch (err) {
      lastErr = err;
      const backoff = Math.min(10000, 400 * 2 ** i);
      await sleep(backoff);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

function buildAgentsUrl(apiBaseUrl, params) {
  const u = new URL(`${apiBaseUrl}/agents`);
  u.searchParams.set('limit', String(params.limit));
  u.searchParams.set('offset', String(params.offset));
  if (params.x402Supported === true) u.searchParams.set('x402_supported', 'true');
  if (params.endpointVerified === true) u.searchParams.set('is_endpoint_verified', 'true');
  return u.toString();
}

async function fetchAllByFilter(opts, filter) {
  const items = [];
  const limit = 100;
  let offset = 0;
  let total = null;

  for (;;) {
    const url = buildAgentsUrl(opts.apiBaseUrl, {
      limit,
      offset,
      x402Supported: filter === 'x402',
      endpointVerified: filter === 'endpoint'
    });

    const page = await fetchWithRetry(url, opts);
    if (!Array.isArray(page?.items)) throw new Error(`INVALID_RESPONSE:${filter}:items`);
    if (total === null) total = Number(page?.total || 0);

    if (page.items.length === 0) break;
    items.push(...page.items);

    offset += page.items.length;
    const pct = total > 0 ? ((Math.min(offset, total) / total) * 100).toFixed(1) : '0.0';
    process.stdout.write(`[whisk-export] ${filter} offset=${offset} total=${total || 0} (${pct}%)\n`);

    if (total > 0 && offset >= total) break;
    if (opts.delayMs > 0) await sleep(opts.delayMs);
  }

  return items;
}

async function fetchChainIndex(opts) {
  const payload = await fetchWithRetry(`${opts.apiBaseUrl}/chains`, opts);
  const rows = Array.isArray(payload?.data?.chains) ? payload.data.chains : [];
  const byId = new Map();
  for (const row of rows) {
    const id = Number(row?.chain_id);
    if (!Number.isFinite(id)) continue;
    byId.set(id, {
      chainId: id,
      chainName: nonEmpty(row?.name) || `Chain ${id}`,
      isTestnet: row?.is_testnet === true
    });
  }
  return byId;
}

function toBool(v) {
  return v === true || v === 1;
}

function toWorthyRecord(agent, target, chainIndex, opts, styleAnchor) {
  const chainId = Number(agent?.chain_id);
  const chainMeta = Number.isFinite(chainId) ? chainIndex.get(chainId) : null;
  const source = target?.source === 'solana' ? 'solana' : 'evm';
  const networkType = source === 'solana'
    ? 'devnet'
    : toBool(agent?.is_testnet) || chainMeta?.isTestnet
      ? 'testnet'
      : 'mainnet';

  const chainLabel = firstString([chainMeta?.chainName, `Chain ${chainId}`]);
  const family = familyForChain(chainId, chainLabel, source);
  const serviceSignals = normalizeServiceSignals(agent);

  const erc8004Id = nonEmpty(agent?.agent_id);
  if (!erc8004Id) return null;

  const seed = deterministicSeed(erc8004Id, opts.styleVersion);
  const outputFileBase = `${safeFileId(erc8004Id)}-${seed}`;

  const rec = {
    erc8004Id,
    houseId: target.houseId,
    source,
    chainId: Number.isFinite(chainId) ? chainId : null,
    chainLabel,
    chainFamilyKey: family.key,
    chainFamilyLabel: family.label,
    networkType,
    name: nonEmpty(agent?.name),
    description: nonEmpty(agent?.description),
    imageUrl: nonEmpty(agent?.image_url),
    agentUrl: nonEmpty(agent?.agent_url),
    x402Supported: toBool(agent?.x402_supported),
    endpointVerified: toBool(agent?.is_endpoint_verified),
    tagNames: serviceSignals.tagNames,
    serviceNames: serviceSignals.serviceNames,
    endpointHints: serviceSignals.endpointHints,
    styleVersion: opts.styleVersion,
    styleAnchor: styleAnchor || null,
    seed,
    outputFileBase,
    outputFilename: `${outputFileBase}.png`
  };
  rec.prompt = buildWorthyPrompt(rec, styleAnchor);
  return rec;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeTxtLines(filePath, lines) {
  const normalized = lines.map((line) => oneLine(line));
  const body = `${normalized.join('\n')}${normalized.length ? '\n' : ''}`;
  fs.writeFileSync(filePath, body, 'utf8');
}

function writeJsonl(filePath, rows) {
  const body = rows.map((r) => JSON.stringify(r)).join('\n');
  fs.writeFileSync(filePath, `${body}${rows.length ? '\n' : ''}`, 'utf8');
}

function chunk(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function summarizeCounts(rows, keyFn) {
  const counts = {};
  for (const row of rows) {
    const key = keyFn(row);
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1]));
}

function buildCategoryRecords(targetsById, worthyIdSet, styleAnchor, opts) {
  const categoryByKey = new Map();
  const mapRows = [];

  for (const [erc8004Id, target] of targetsById.entries()) {
    if (!opts.includeExistingShareHero && target.hasShareHero) continue;
    if (worthyIdSet.has(erc8004Id)) continue;

    const source = target.source === 'solana' ? 'solana' : 'evm';
    const chainId = source === 'evm' ? Number(target.sourceChainId) : null;
    const family = familyForChain(chainId, null, source);
    const networkType = source === 'solana' ? 'devnet' : 'mainnet/testnet';
    const categoryKey = `${source}-${family.key}`;

    if (!categoryByKey.has(categoryKey)) {
      const seed = deterministicSeed(categoryKey, opts.styleVersion);
      const outputFileBase = `category-${safeFileId(categoryKey)}-${seed}`;
      const rec = {
        categoryKey,
        source,
        chainFamilyKey: family.key,
        chainFamilyLabel: family.label,
        networkType,
        styleVersion: opts.styleVersion,
        styleAnchor: styleAnchor || null,
        seed,
        outputFileBase,
        outputFilename: `${outputFileBase}.png`
      };
      rec.prompt = buildCategoryPrompt(rec, styleAnchor);
      categoryByKey.set(categoryKey, rec);
    }

    const category = categoryByKey.get(categoryKey);
    mapRows.push({
      erc8004Id,
      houseId: target.houseId,
      categoryKey,
      chainFamilyKey: category.chainFamilyKey,
      outputFileBase: category.outputFileBase,
      outputFilename: category.outputFilename
    });
  }

  const categoryRecords = [...categoryByKey.values()].sort((a, b) => a.categoryKey.localeCompare(b.categoryKey));
  mapRows.sort((a, b) => a.erc8004Id.localeCompare(b.erc8004Id));
  return { categoryRecords, mapRows };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    printHelp();
    return;
  }

  let styleAnchor = nonEmpty(opts.styleAnchor);
  if (!styleAnchor && opts.styleAnchorFile && fs.existsSync(opts.styleAnchorFile)) {
    styleAnchor = nonEmpty(fs.readFileSync(opts.styleAnchorFile, 'utf8'));
  }

  const { targetsById } = loadStoreTargets(opts);
  process.stdout.write(`[whisk-export] targets_in_store=${targetsById.size}\n`);

  const chainIndex = await fetchChainIndex(opts);
  process.stdout.write(`[whisk-export] chains=${chainIndex.size}\n`);

  const x402Agents = await fetchAllByFilter(opts, 'x402');
  const endpointAgents = await fetchAllByFilter(opts, 'endpoint');

  const worthyById = new Map();
  const merged = x402Agents.concat(endpointAgents);
  for (const agent of merged) {
    const erc8004Id = nonEmpty(agent?.agent_id);
    if (!erc8004Id || worthyById.has(erc8004Id)) continue;

    const target = targetsById.get(erc8004Id);
    if (!target) continue;
    if (!opts.includeExistingShareHero && target.hasShareHero) continue;

    const rec = toWorthyRecord(agent, target, chainIndex, opts, styleAnchor);
    if (!rec) continue;

    worthyById.set(erc8004Id, rec);
    if (opts.maxWorthy > 0 && worthyById.size >= opts.maxWorthy) break;
  }

  const worthyRecords = [...worthyById.values()].sort((a, b) => a.erc8004Id.localeCompare(b.erc8004Id));
  const worthyPrompts = worthyRecords.map((r) => r.prompt);
  const worthyIdSet = new Set(worthyRecords.map((r) => r.erc8004Id));

  const { categoryRecords, mapRows } = buildCategoryRecords(targetsById, worthyIdSet, styleAnchor, opts);

  ensureDir(opts.outDir);

  const worthyDir = path.join(opts.outDir, 'worthy');
  const worthyByChainDir = path.join(worthyDir, 'by-chain');
  const worthyByChainMapsDir = path.join(worthyByChainDir, 'maps');
  const worthyBatchesDir = path.join(worthyDir, 'batches');
  ensureDir(worthyDir);
  ensureDir(worthyByChainDir);
  ensureDir(worthyByChainMapsDir);
  ensureDir(worthyBatchesDir);

  writeTxtLines(path.join(worthyDir, 'worthy-all.txt'), worthyPrompts);
  writeJsonl(path.join(worthyDir, 'worthy-manifest.jsonl'), worthyRecords);

  const byChain = new Map();
  for (const rec of worthyRecords) {
    if (!byChain.has(rec.chainFamilyKey)) byChain.set(rec.chainFamilyKey, []);
    byChain.get(rec.chainFamilyKey).push(rec);
  }
  for (const [chainKey, records] of byChain.entries()) {
    const prompts = records.map((rec) => rec.prompt);
    writeTxtLines(path.join(worthyByChainDir, `${chainKey}.txt`), prompts);
    const mapRows = records.map((rec, idx) => ({
      lineNumber: idx + 1,
      erc8004Id: rec.erc8004Id,
      houseId: rec.houseId,
      outputFileBase: rec.outputFileBase,
      outputFilename: rec.outputFilename
    }));
    writeJsonl(path.join(worthyByChainMapsDir, `${chainKey}.map.jsonl`), mapRows);
  }

  const promptBatches = chunk(worthyPrompts, opts.batchSize);
  const recordBatches = chunk(worthyRecords, opts.batchSize);
  for (let i = 0; i < promptBatches.length; i += 1) {
    const n = String(i + 1).padStart(4, '0');
    writeTxtLines(path.join(worthyBatchesDir, `worthy-batch-${n}.txt`), promptBatches[i]);
    const mapRows = recordBatches[i].map((rec, idx) => ({
      lineNumber: idx + 1,
      erc8004Id: rec.erc8004Id,
      houseId: rec.houseId,
      outputFileBase: rec.outputFileBase,
      outputFilename: rec.outputFilename
    }));
    writeJsonl(path.join(worthyBatchesDir, `worthy-batch-${n}.map.jsonl`), mapRows);
  }

  const sharedDir = path.join(opts.outDir, 'shared');
  const sharedByCategoryDir = path.join(sharedDir, 'by-category');
  ensureDir(sharedDir);
  ensureDir(sharedByCategoryDir);

  writeTxtLines(path.join(sharedDir, 'category-prompts.txt'), categoryRecords.map((r) => r.prompt));
  writeJsonl(path.join(sharedDir, 'category-manifest.jsonl'), categoryRecords);

  for (const rec of categoryRecords) {
    writeTxtLines(path.join(sharedByCategoryDir, `${rec.categoryKey}.txt`), [rec.prompt]);
  }

  const csvHeader = [
    'erc8004Id',
    'houseId',
    'categoryKey',
    'chainFamilyKey',
    'outputFileBase',
    'outputFilename'
  ];
  const csvLines = [csvHeader.join(',')];
  for (const row of mapRows) {
    csvLines.push(
      [
        row.erc8004Id,
        row.houseId,
        row.categoryKey,
        row.chainFamilyKey,
        row.outputFileBase,
        row.outputFilename
      ]
        .map(csvEscape)
        .join(',')
    );
  }
  fs.writeFileSync(path.join(sharedDir, 'category-map.csv'), `${csvLines.join('\n')}\n`, 'utf8');

  const categoryByKey = new Map(categoryRecords.map((rec) => [rec.categoryKey, rec]));
  const sharedAgentManifest = mapRows.map((row) => {
    const category = categoryByKey.get(row.categoryKey);
    return {
      erc8004Id: row.erc8004Id,
      houseId: row.houseId,
      source: category?.source || null,
      chainFamilyKey: row.chainFamilyKey,
      chainFamilyLabel: category?.chainFamilyLabel || null,
      networkType: category?.networkType || null,
      categoryKey: row.categoryKey,
      styleVersion: category?.styleVersion || opts.styleVersion,
      styleAnchor: category?.styleAnchor || (styleAnchor || null),
      seed: category?.seed || null,
      outputFileBase: row.outputFileBase,
      outputFilename: row.outputFilename,
      prompt: category?.prompt || null
    };
  });
  writeJsonl(path.join(sharedDir, 'shared-agent-manifest.jsonl'), sharedAgentManifest);

  const summary = {
    generatedAt: new Date().toISOString(),
    worthyCriteria: 'x402_supported=true OR is_endpoint_verified=true',
    options: {
      includeExistingShareHero: opts.includeExistingShareHero,
      batchSize: opts.batchSize,
      styleVersion: opts.styleVersion,
      styleAnchorSet: Boolean(styleAnchor)
    },
    counts: {
      storeTargets: targetsById.size,
      worthyFromApi: worthyRecords.length,
      worthyBatchFiles: promptBatches.length,
      sharedCategories: categoryRecords.length,
      sharedMappedAgents: mapRows.length
    },
    distribution: {
      worthyByChainFamily: summarizeCounts(worthyRecords, (r) => r.chainFamilyKey),
      sharedByCategory: summarizeCounts(mapRows, (r) => r.categoryKey)
    },
    paths: {
      outDir: opts.outDir,
      worthyAllTxt: path.join(worthyDir, 'worthy-all.txt'),
      worthyManifestJsonl: path.join(worthyDir, 'worthy-manifest.jsonl'),
      categoryPromptsTxt: path.join(sharedDir, 'category-prompts.txt'),
      categoryMapCsv: path.join(sharedDir, 'category-map.csv'),
      sharedAgentManifestJsonl: path.join(sharedDir, 'shared-agent-manifest.jsonl')
    }
  };
  fs.writeFileSync(path.join(opts.outDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');

  process.stdout.write(`[whisk-export] worthy_records=${worthyRecords.length}\n`);
  process.stdout.write(`[whisk-export] shared_categories=${categoryRecords.length} shared_map_rows=${mapRows.length}\n`);
  process.stdout.write(`[whisk-export] out_dir=${opts.outDir}\n`);
}

main().catch((err) => {
  process.stderr.write(`${err?.message || String(err)}\n`);
  process.exit(1);
});
