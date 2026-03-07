#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

const IMPORT_TAG = 'erc8004-preregister/v1';
const B58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const DEFAULT_SOURCE_SQLITE = './data/erc8004.sqlite3';

const DEFAULT_IMAGE_BASE_URL = 'https://www.8004scan.io/';
const DEFAULT_IMAGE_CACHE_DIR = './data/erc8004-image-cache';
const DEFAULT_IMAGE_TIMEOUT_MS = 12000;
const DEFAULT_IMAGE_MAX_BYTES = 256 * 1024;
const DEFAULT_IMAGE_CONCURRENCY = 8;
const DEFAULT_IMAGE_RETRIES = 2;
const DEFAULT_IMAGE_CACHE_SIZE = 512;

const MAX_PUBLIC_PROMPT_CHARS = 280;
const SUPPORTED_IMAGE_MIME = new Set(['image/png', 'image/jpeg', 'image/webp']);

function printHelp() {
  process.stdout.write(
    [
      'Import ERC-8004 data into the app store as pre-registered houses + anchors.',
      '',
      'Usage:',
      '  node scripts/import_erc8004_preregister_houses.js [options]',
      '',
      'Options:',
      `  --source-sqlite <path>      Source DB (default: ${DEFAULT_SOURCE_SQLITE})`,
      '  --store-path <path>         Target store sqlite path (default: server/store.js default)',
      '  --limit <n>                 Max ERC IDs to import (0 = unlimited, default: 0)',
      '  --evm-only                  Import EVM ERC-8004 IDs only',
      '  --solana-only               Import Solana IDs only',
      '  --testnet-only              EVM filter: testnets only',
      '  --mainnet-only              EVM filter: mainnets only',
      '  --solana-prefix <prefix>    Solana ID prefix (default: solana-devnet)',
      '  --reset-preregister         Remove prior pre-registered rows imported by this script first',
      '',
      'Image options:',
      '  --with-images               Attach image slots (media.agentAvatar + media.shareHero)',
      '  --download-images-only      Download/cache images only; do not touch store',
      '  --use-image-cache-only      Never fetch network; use cached images only',
      `  --image-cache-dir <path>    Cache directory (default: ${DEFAULT_IMAGE_CACHE_DIR})`,
      `  --image-base-url <url>      Base URL for relative image paths (default: ${DEFAULT_IMAGE_BASE_URL})`,
      `  --image-timeout-ms <n>      Per-image timeout (default: ${DEFAULT_IMAGE_TIMEOUT_MS})`,
      `  --image-max-bytes <n>       Max stored bytes per image (default: ${DEFAULT_IMAGE_MAX_BYTES})`,
      `  --image-concurrency <n>     Concurrent image downloads (default: ${DEFAULT_IMAGE_CONCURRENCY})`,
      `  --image-retries <n>         Retries per image (default: ${DEFAULT_IMAGE_RETRIES})`,
      `  --image-cache-size <n>      In-memory URL cache entries (default: ${DEFAULT_IMAGE_CACHE_SIZE})`,
      '',
      'Run mode:',
      '  --apply                     Persist changes (default is dry-run)',
      '  --dry-run                   Explicit dry-run (same as default)',
      '  --help                      Show this help',
      '',
      'Examples:',
      '  node scripts/import_erc8004_preregister_houses.js',
      '  node scripts/import_erc8004_preregister_houses.js --apply --reset-preregister',
      '  node scripts/import_erc8004_preregister_houses.js --with-images --limit 500 --apply',
      '  node scripts/import_erc8004_preregister_houses.js --download-images-only --limit 2000',
      '  node scripts/import_erc8004_preregister_houses.js --with-images --use-image-cache-only --apply'
    ].join('\n') + '\n'
  );
}

function parseArgs(argv) {
  const opts = {
    sourceSqlite: DEFAULT_SOURCE_SQLITE,
    storePath: null,
    limit: 0,
    includeEvm: true,
    includeSolana: true,
    evmTestnetFilter: null,
    solanaPrefix: 'solana-devnet',
    resetPreregister: false,
    withImages: false,
    downloadImagesOnly: false,
    useImageCacheOnly: false,
    imageCacheDir: DEFAULT_IMAGE_CACHE_DIR,
    imageBaseUrl: DEFAULT_IMAGE_BASE_URL,
    imageTimeoutMs: DEFAULT_IMAGE_TIMEOUT_MS,
    imageMaxBytes: DEFAULT_IMAGE_MAX_BYTES,
    imageConcurrency: DEFAULT_IMAGE_CONCURRENCY,
    imageRetries: DEFAULT_IMAGE_RETRIES,
    imageCacheSize: DEFAULT_IMAGE_CACHE_SIZE,
    apply: false,
    help: false
  };

  function nextValue(i, flag) {
    const value = argv[i + 1];
    if (!value || value.startsWith('--')) throw new Error(`MISSING_VALUE:${flag}`);
    return value;
  }

  function parseNonNegativeInt(raw, code) {
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) throw new Error(code);
    return Math.floor(n);
  }

  function parsePositiveInt(raw, code) {
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) throw new Error(code);
    return Math.floor(n);
  }

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--help') {
      opts.help = true;
      continue;
    }
    if (token === '--apply') {
      opts.apply = true;
      continue;
    }
    if (token === '--dry-run') {
      opts.apply = false;
      continue;
    }
    if (token === '--reset-preregister') {
      opts.resetPreregister = true;
      continue;
    }
    if (token === '--with-images') {
      opts.withImages = true;
      continue;
    }
    if (token === '--download-images-only') {
      opts.downloadImagesOnly = true;
      opts.withImages = true;
      continue;
    }
    if (token === '--use-image-cache-only') {
      opts.useImageCacheOnly = true;
      opts.withImages = true;
      continue;
    }
    if (token === '--evm-only') {
      opts.includeEvm = true;
      opts.includeSolana = false;
      continue;
    }
    if (token === '--solana-only') {
      opts.includeEvm = false;
      opts.includeSolana = true;
      continue;
    }
    if (token === '--testnet-only') {
      opts.evmTestnetFilter = true;
      continue;
    }
    if (token === '--mainnet-only') {
      opts.evmTestnetFilter = false;
      continue;
    }
    if (token === '--source-sqlite') {
      opts.sourceSqlite = nextValue(i, token);
      i += 1;
      continue;
    }
    if (token.startsWith('--source-sqlite=')) {
      opts.sourceSqlite = token.slice('--source-sqlite='.length);
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
    if (token === '--solana-prefix') {
      opts.solanaPrefix = nextValue(i, token);
      i += 1;
      continue;
    }
    if (token.startsWith('--solana-prefix=')) {
      opts.solanaPrefix = token.slice('--solana-prefix='.length);
      continue;
    }
    if (token === '--image-cache-dir') {
      opts.imageCacheDir = nextValue(i, token);
      i += 1;
      continue;
    }
    if (token.startsWith('--image-cache-dir=')) {
      opts.imageCacheDir = token.slice('--image-cache-dir='.length);
      continue;
    }
    if (token === '--image-base-url') {
      opts.imageBaseUrl = nextValue(i, token);
      i += 1;
      continue;
    }
    if (token.startsWith('--image-base-url=')) {
      opts.imageBaseUrl = token.slice('--image-base-url='.length);
      continue;
    }
    if (token === '--limit') {
      opts.limit = parseNonNegativeInt(nextValue(i, token), 'INVALID_LIMIT');
      i += 1;
      continue;
    }
    if (token.startsWith('--limit=')) {
      opts.limit = parseNonNegativeInt(token.slice('--limit='.length), 'INVALID_LIMIT');
      continue;
    }
    if (token === '--image-timeout-ms') {
      opts.imageTimeoutMs = parsePositiveInt(nextValue(i, token), 'INVALID_IMAGE_TIMEOUT_MS');
      i += 1;
      continue;
    }
    if (token.startsWith('--image-timeout-ms=')) {
      opts.imageTimeoutMs = parsePositiveInt(token.slice('--image-timeout-ms='.length), 'INVALID_IMAGE_TIMEOUT_MS');
      continue;
    }
    if (token === '--image-max-bytes') {
      opts.imageMaxBytes = parsePositiveInt(nextValue(i, token), 'INVALID_IMAGE_MAX_BYTES');
      i += 1;
      continue;
    }
    if (token.startsWith('--image-max-bytes=')) {
      opts.imageMaxBytes = parsePositiveInt(token.slice('--image-max-bytes='.length), 'INVALID_IMAGE_MAX_BYTES');
      continue;
    }
    if (token === '--image-concurrency') {
      opts.imageConcurrency = parsePositiveInt(nextValue(i, token), 'INVALID_IMAGE_CONCURRENCY');
      i += 1;
      continue;
    }
    if (token.startsWith('--image-concurrency=')) {
      opts.imageConcurrency = parsePositiveInt(token.slice('--image-concurrency='.length), 'INVALID_IMAGE_CONCURRENCY');
      continue;
    }
    if (token === '--image-retries') {
      opts.imageRetries = parseNonNegativeInt(nextValue(i, token), 'INVALID_IMAGE_RETRIES');
      i += 1;
      continue;
    }
    if (token.startsWith('--image-retries=')) {
      opts.imageRetries = parseNonNegativeInt(token.slice('--image-retries='.length), 'INVALID_IMAGE_RETRIES');
      continue;
    }
    if (token === '--image-cache-size') {
      opts.imageCacheSize = parsePositiveInt(nextValue(i, token), 'INVALID_IMAGE_CACHE_SIZE');
      i += 1;
      continue;
    }
    if (token.startsWith('--image-cache-size=')) {
      opts.imageCacheSize = parsePositiveInt(token.slice('--image-cache-size='.length), 'INVALID_IMAGE_CACHE_SIZE');
      continue;
    }
    throw new Error(`UNKNOWN_ARG:${token}`);
  }

  if (!opts.includeEvm && !opts.includeSolana) {
    throw new Error('NO_SOURCE_SELECTED');
  }
  if (!opts.solanaPrefix.trim()) {
    throw new Error('INVALID_SOLANA_PREFIX');
  }
  if (opts.downloadImagesOnly && opts.apply) {
    throw new Error('DOWNLOAD_ONLY_DOES_NOT_USE_APPLY');
  }

  if (opts.withImages) {
    let imageBase;
    try {
      imageBase = new URL(opts.imageBaseUrl);
    } catch {
      throw new Error('INVALID_IMAGE_BASE_URL');
    }
    opts.imageBaseUrl = imageBase.toString();
    opts.imageCacheDir = path.resolve(opts.imageCacheDir);
  }

  return opts;
}

function base58Encode(bytes) {
  let x = BigInt(`0x${Buffer.from(bytes).toString('hex')}`);
  let out = '';
  while (x > 0n) {
    const mod = x % 58n;
    out = B58_ALPHABET[Number(mod)] + out;
    x /= 58n;
  }
  for (let i = 0; i < bytes.length && bytes[i] === 0; i += 1) out = `1${out}`;
  return out || '1';
}

function deriveHouseId(erc8004Id) {
  const digest = crypto
    .createHash('sha256')
    .update(`erc8004-house-v1|${erc8004Id}`, 'utf8')
    .digest();
  return base58Encode(new Uint8Array(digest));
}

function hashHex(input) {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

function nonEmpty(value) {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  return v ? v : null;
}

function normalizePrompt(value) {
  const v = nonEmpty(value);
  if (!v) return null;
  return v.slice(0, MAX_PUBLIC_PROMPT_CHARS);
}

function normalizeEvmAddress(value) {
  const v = nonEmpty(value);
  if (!v) return null;
  if (!/^0x[0-9a-fA-F]{40}$/.test(v)) return null;
  return v.toLowerCase();
}

function isoOrFallback(value, fallbackIso) {
  const v = nonEmpty(value);
  if (!v) return fallbackIso;
  const ms = Date.parse(v);
  if (!Number.isFinite(ms)) return fallbackIso;
  return new Date(ms).toISOString();
}

function epochMsOrFallback(value, fallbackMs) {
  const v = nonEmpty(value);
  if (!v) return fallbackMs;
  const ms = Date.parse(v);
  if (!Number.isFinite(ms)) return fallbackMs;
  return Math.floor(ms);
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

function resolveImageSourceUrl(rawUrl, opts) {
  const raw = nonEmpty(rawUrl);
  if (!raw) return null;
  if (/^data:image\/(?:png|jpeg|webp);base64,/i.test(raw)) return raw;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^ipfs:\/\//i.test(raw)) {
    const suffix = raw.slice('ipfs://'.length).replace(/^ipfs\//i, '').trim();
    if (!suffix) return null;
    return `https://ipfs.io/ipfs/${suffix}`;
  }
  if (/^ar:\/\//i.test(raw)) {
    const suffix = raw.slice('ar://'.length).trim();
    if (!suffix) return null;
    return `https://arweave.net/${suffix}`;
  }
  if (raw.startsWith('//')) return `https:${raw}`;
  if (raw.startsWith('/')) {
    try {
      return new URL(raw, opts.imageBaseUrl).toString();
    } catch {
      return null;
    }
  }
  if (/^www\./i.test(raw)) return `https://${raw}`;
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/|$)/i.test(raw)) return `https://${raw}`;
  return null;
}

function loadEvmCandidates(db, opts) {
  const where = [];
  const params = [];
  if (typeof opts.evmTestnetFilter === 'boolean') {
    where.push('is_testnet = ?');
    params.push(opts.evmTestnetFilter ? 1 : 0);
  }
  let sql = `
    SELECT
      agent_id,
      chain_id,
      owner_address,
      created_at,
      updated_at,
      image_url,
      name,
      description
    FROM erc8004_agents
  `;
  if (where.length) sql += ` WHERE ${where.join(' AND ')}`;
  sql += ' ORDER BY chain_id ASC, token_id ASC';
  const rows = db.prepare(sql).all(...params);
  return rows
    .map((row) => {
      const erc8004Id = nonEmpty(row.agent_id);
      if (!erc8004Id) return null;
      const chainId = Number(row.chain_id);
      return {
        erc8004Id,
        source: 'evm',
        chainId: Number.isFinite(chainId) ? Math.floor(chainId) : null,
        signer: normalizeEvmAddress(row.owner_address) || '',
        unlockAddress: normalizeEvmAddress(row.owner_address),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        imageSourceUrl: resolveImageSourceUrl(row.image_url, opts),
        imagePrompt: normalizePrompt(row.name) || normalizePrompt(row.description)
      };
    })
    .filter(Boolean);
}

function loadSolanaCandidates(db, opts) {
  const sql = `
    SELECT
      asset,
      owner,
      created_at,
      updated_at,
      registration_json,
      indexed_json,
      nft_name
    FROM erc8004_solana_agents
    ORDER BY asset ASC
  `;
  const rows = db.prepare(sql).all();
  const prefix = opts.solanaPrefix.trim();

  const IMAGE_PATHS = [
    ['image'],
    ['image_url'],
    ['imageUrl'],
    ['avatar'],
    ['avatar_url'],
    ['avatarUrl'],
    ['profile_image'],
    ['profileImage'],
    ['pfp'],
    ['metadata', 'image'],
    ['metadata', 'image_url'],
    ['metadata', 'imageUrl'],
    ['metadata', 'avatar'],
    ['metadata', 'avatar_url'],
    ['metadata', 'avatarUrl']
  ];
  const PROMPT_PATHS = [
    ['name'],
    ['title'],
    ['displayName'],
    ['metadata', 'name'],
    ['metadata', 'title']
  ];

  return rows
    .map((row) => {
      const asset = nonEmpty(row.asset);
      if (!asset) return null;

      const registrationJson = parseJsonSafe(row.registration_json);
      const indexedJson = parseJsonSafe(row.indexed_json);
      const imageRaw =
        pickFirstStringFromObject(registrationJson, IMAGE_PATHS) ||
        pickFirstStringFromObject(indexedJson, IMAGE_PATHS);
      const promptRaw =
        pickFirstStringFromObject(registrationJson, PROMPT_PATHS) ||
        pickFirstStringFromObject(indexedJson, PROMPT_PATHS) ||
        nonEmpty(row.nft_name);

      return {
        erc8004Id: `${prefix}:${asset}`,
        source: 'solana',
        chainId: null,
        signer: nonEmpty(row.owner) || '',
        unlockAddress: nonEmpty(row.owner),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        imageSourceUrl: resolveImageSourceUrl(imageRaw, opts),
        imagePrompt: normalizePrompt(promptRaw)
      };
    })
    .filter(Boolean);
}

function isImportedPreRegisteredHouse(house) {
  if (!house || typeof house !== 'object') return false;
  if (house.preRegistered !== true) return false;
  return house.preRegistration?.importTag === IMPORT_TAG;
}

function listOptedOutErc8004Ids(store) {
  const ids = new Set();
  const rows = Array.isArray(store?.erc8004OptOut) ? store.erc8004OptOut : [];
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const erc8004Id = nonEmpty(row.erc8004Id);
    if (!erc8004Id) continue;
    const state = typeof row.state === 'string' ? row.state.trim().toLowerCase() : '';
    const optedOut = row.optedOut === true || state === 'opted_out' || state === 'deleted';
    if (!optedOut) continue;
    ids.add(erc8004Id);
  }
  return ids;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mimeFromContentType(value) {
  if (typeof value !== 'string') return null;
  const mime = value.split(';')[0].trim().toLowerCase();
  if (mime === 'image/jpg') return 'image/jpeg';
  return SUPPORTED_IMAGE_MIME.has(mime) ? mime : null;
}

function detectMimeFromBytes(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 12) return null;
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return 'image/png';
  }
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (
    buf.length >= 12 &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

function parseDataUrlImage(dataUrl, maxBytes) {
  const raw = nonEmpty(dataUrl);
  if (!raw) throw new Error('IMAGE_INVALID_DATA_URL');
  const m = raw.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/i);
  if (!m) throw new Error('IMAGE_INVALID_DATA_URL');
  const mime = m[1].toLowerCase();
  if (!SUPPORTED_IMAGE_MIME.has(mime)) throw new Error('IMAGE_UNSUPPORTED_MIME');
  let bytes;
  try {
    bytes = Buffer.from(m[2], 'base64');
  } catch {
    throw new Error('IMAGE_INVALID_DATA_URL');
  }
  if (!bytes.length) throw new Error('IMAGE_INVALID_DATA_URL');
  if (bytes.length > maxBytes) throw new Error('IMAGE_TOO_LARGE');
  return { mime, bytes };
}

function cacheEntryPaths(opts, url) {
  const id = hashHex(url);
  const dir = path.join(opts.imageCacheDir, id.slice(0, 2));
  return {
    id,
    dir,
    metaPath: path.join(dir, `${id}.json`),
    binPath: path.join(dir, `${id}.bin`)
  };
}

function readImageFromDiskCache(url, opts) {
  const paths = cacheEntryPaths(opts, url);
  if (!fs.existsSync(paths.metaPath) || !fs.existsSync(paths.binPath)) return null;
  try {
    const meta = JSON.parse(fs.readFileSync(paths.metaPath, 'utf8'));
    const mime = typeof meta?.mime === 'string' ? meta.mime.toLowerCase() : '';
    if (!SUPPORTED_IMAGE_MIME.has(mime)) return null;
    if (meta?.url && meta.url !== url) return null;
    const bytes = fs.readFileSync(paths.binPath);
    if (!bytes.length || bytes.length > opts.imageMaxBytes) return null;
    return `data:${mime};base64,${bytes.toString('base64')}`;
  } catch {
    return null;
  }
}

function writeImageToDiskCache(url, dataUrl, opts) {
  const parsed = parseDataUrlImage(dataUrl, opts.imageMaxBytes);
  const paths = cacheEntryPaths(opts, url);
  fs.mkdirSync(paths.dir, { recursive: true });

  const tmpTag = `${process.pid}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const binTmp = `${paths.binPath}.${tmpTag}.tmp`;
  const metaTmp = `${paths.metaPath}.${tmpTag}.tmp`;

  fs.writeFileSync(binTmp, parsed.bytes);
  fs.renameSync(binTmp, paths.binPath);

  const meta = {
    v: 1,
    url,
    mime: parsed.mime,
    bytes: parsed.bytes.length,
    cachedAt: new Date().toISOString()
  };
  fs.writeFileSync(metaTmp, `${JSON.stringify(meta)}\n`, 'utf8');
  fs.renameSync(metaTmp, paths.metaPath);
}

function updateUrlCache(cache, key, value, maxEntries) {
  if (cache.has(key)) cache.delete(key);
  cache.set(key, value);
  while (cache.size > maxEntries) {
    const oldest = cache.keys().next();
    if (oldest.done) break;
    cache.delete(oldest.value);
  }
}

async function readResponseBodyWithLimit(res, maxBytes) {
  const contentLength = Number(res.headers.get('content-length') || 0);
  if (Number.isFinite(contentLength) && contentLength > 0 && contentLength > maxBytes) {
    throw new Error('IMAGE_TOO_LARGE');
  }

  if (!res.body || typeof res.body.getReader !== 'function') {
    const arr = await res.arrayBuffer();
    const buf = Buffer.from(arr);
    if (buf.length > maxBytes) throw new Error('IMAGE_TOO_LARGE');
    return buf;
  }

  const reader = res.body.getReader();
  const chunks = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = Buffer.from(value);
    total += chunk.length;
    if (total > maxBytes) throw new Error('IMAGE_TOO_LARGE');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function fetchImageAsDataUrl(url, opts) {
  if (/^data:image\/(?:png|jpeg|webp);base64,/i.test(url)) {
    const parsed = parseDataUrlImage(url, opts.imageMaxBytes);
    return `data:${parsed.mime};base64,${parsed.bytes.toString('base64')}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), opts.imageTimeoutMs);
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        accept: 'image/png,image/jpeg,image/webp,image/*;q=0.9,*/*;q=0.5',
        'user-agent': 'agenttown/erc8004-preregister-import'
      }
    });
    if (!res.ok) throw new Error(`IMAGE_HTTP_${res.status}`);

    const bytes = await readResponseBodyWithLimit(res, opts.imageMaxBytes);
    if (!bytes.length) throw new Error('IMAGE_EMPTY');

    const mime =
      mimeFromContentType(res.headers.get('content-type')) ||
      detectMimeFromBytes(bytes);
    if (!mime || !SUPPORTED_IMAGE_MIME.has(mime)) throw new Error('IMAGE_UNSUPPORTED_MIME');

    return `data:${mime};base64,${bytes.toString('base64')}`;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchImageWithRetry(url, opts) {
  let lastErr = null;
  for (let i = 0; i <= opts.imageRetries; i += 1) {
    try {
      return await fetchImageAsDataUrl(url, opts);
    } catch (err) {
      lastErr = err;
      if (i >= opts.imageRetries) break;
      await sleep(Math.min(5000, 300 * 2 ** i));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

async function mapWithConcurrency(items, concurrency, worker) {
  if (!Array.isArray(items) || items.length === 0) return;
  const total = items.length;
  let cursor = 0;
  const workerCount = Math.max(1, Math.min(total, concurrency));
  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      for (;;) {
        const idx = cursor;
        cursor += 1;
        if (idx >= total) break;
        await worker(items[idx], idx);
      }
    })
  );
}

function createImageStats(candidates) {
  const targets = candidates.filter((c) => !!c.imageSourceUrl).length;
  return {
    candidatesWithImage: targets,
    uniqueImageUrls: 0,
    memoryCacheHit: 0,
    diskCacheHit: 0,
    cacheOnlyMiss: 0,
    fetched: 0,
    failed: 0,
    persistedToCache: 0
  };
}

async function resolveImageDataUrl(url, opts, runtime, imageStats) {
  if (!url) return null;
  if (runtime.urlCache.has(url)) {
    imageStats.memoryCacheHit += 1;
    return runtime.urlCache.get(url);
  }

  const fromDisk = readImageFromDiskCache(url, opts);
  if (fromDisk) {
    imageStats.diskCacheHit += 1;
    updateUrlCache(runtime.urlCache, url, fromDisk, opts.imageCacheSize);
    return fromDisk;
  }

  if (opts.useImageCacheOnly) {
    imageStats.cacheOnlyMiss += 1;
    updateUrlCache(runtime.urlCache, url, null, opts.imageCacheSize);
    return null;
  }

  let fetched = null;
  try {
    fetched = await fetchImageWithRetry(url, opts);
    imageStats.fetched += 1;
    try {
      writeImageToDiskCache(url, fetched, opts);
      imageStats.persistedToCache += 1;
    } catch {
      // Cache write failure should not block import.
    }
  } catch {
    imageStats.failed += 1;
    fetched = null;
  }
  updateUrlCache(runtime.urlCache, url, fetched, opts.imageCacheSize);
  return fetched;
}

async function prefetchImageCache(candidates, opts, imageStats) {
  const urls = [...new Set(candidates.map((c) => c.imageSourceUrl).filter(Boolean))];
  imageStats.uniqueImageUrls = urls.length;
  if (!urls.length) return;

  fs.mkdirSync(opts.imageCacheDir, { recursive: true });
  process.stdout.write(
    `[preregister] image prefetch start: unique_urls=${urls.length}, concurrency=${opts.imageConcurrency}, cache_dir=${opts.imageCacheDir}\n`
  );

  const runtime = { urlCache: new Map() };
  let completed = 0;
  await mapWithConcurrency(urls, opts.imageConcurrency, async (url) => {
    await resolveImageDataUrl(url, opts, runtime, imageStats);
    completed += 1;
    if (completed % 500 === 0 || completed === urls.length) {
      process.stdout.write(`[preregister] image prefetch progress: ${completed}/${urls.length}\n`);
    }
  });
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    printHelp();
    return;
  }

  const sourcePath = path.resolve(opts.sourceSqlite);
  if (!fs.existsSync(sourcePath)) throw new Error(`SOURCE_DB_NOT_FOUND:${sourcePath}`);

  const sourceDb = new DatabaseSync(sourcePath, { readOnly: true });
  let candidates = [];
  try {
    if (opts.includeEvm) candidates = candidates.concat(loadEvmCandidates(sourceDb, opts));
    if (opts.includeSolana) candidates = candidates.concat(loadSolanaCandidates(sourceDb, opts));
  } finally {
    sourceDb.close();
  }

  if (opts.limit > 0) candidates = candidates.slice(0, opts.limit);

  const importedAtIso = new Date().toISOString();
  const importedAtMs = Date.now();

  const imageStats = createImageStats(candidates);
  if (opts.withImages && (opts.downloadImagesOnly || !opts.useImageCacheOnly)) {
    await prefetchImageCache(candidates, opts, imageStats);
  }

  if (opts.downloadImagesOnly) {
    process.stdout.write(`[preregister] source sqlite: ${sourcePath}\n`);
    process.stdout.write(
      `[preregister] image prefetch done: candidates=${candidates.length} targets=${imageStats.candidatesWithImage} unique_urls=${imageStats.uniqueImageUrls} fetched=${imageStats.fetched} failed=${imageStats.failed} disk_cache_hit=${imageStats.diskCacheHit} memory_cache_hit=${imageStats.memoryCacheHit} persisted_to_cache=${imageStats.persistedToCache}\n`
    );
    return;
  }

  if (opts.storePath) {
    process.env.STORE_PATH = path.resolve(opts.storePath);
  }
  const { getStorePath, readStore, writeStore } = require('../server/store');
  const resolvedStorePath = path.resolve(getStorePath());

  const store = readStore();
  store.houses = Array.isArray(store.houses) ? store.houses : [];
  store.anchors = Array.isArray(store.anchors) ? store.anchors : [];
  store.erc8004OptOut = Array.isArray(store.erc8004OptOut) ? store.erc8004OptOut : [];

  let removedHouses = 0;
  let removedAnchors = 0;
  if (opts.resetPreregister) {
    const removedHouseIds = new Set();
    store.houses = store.houses.filter((house) => {
      if (!isImportedPreRegisteredHouse(house)) return true;
      removedHouses += 1;
      if (typeof house.id === 'string' && house.id.trim()) removedHouseIds.add(house.id.trim());
      return false;
    });
    store.anchors = store.anchors.filter((anchor) => {
      if (!anchor || typeof anchor !== 'object') return false;
      if (anchor.importTag === IMPORT_TAG) {
        removedAnchors += 1;
        return false;
      }
      if (typeof anchor.houseId === 'string' && removedHouseIds.has(anchor.houseId)) {
        removedAnchors += 1;
        return false;
      }
      return true;
    });
  }

  const houseById = new Map();
  for (const house of store.houses) {
    if (!house || typeof house !== 'object') continue;
    const id = nonEmpty(house.id);
    if (!id || houseById.has(id)) continue;
    houseById.set(id, house);
  }

  const anchorByErcId = new Map();
  for (const anchor of store.anchors) {
    if (!anchor || typeof anchor !== 'object') continue;
    const erc8004Id = nonEmpty(anchor.erc8004Id);
    if (!erc8004Id || anchorByErcId.has(erc8004Id)) continue;
    anchorByErcId.set(erc8004Id, anchor);
  }

  const stats = {
    sourceCandidates: candidates.length,
    housesAdded: 0,
    anchorsAdded: 0,
    skippedOptedOut: 0,
    skippedExistingAnchor: 0,
    skippedHouseCollision: 0,
    housesWithImage: 0
  };

  const importImageRuntime = { urlCache: new Map() };
  const newHouses = [];
  const newAnchors = [];
  const optedOutErcIds = listOptedOutErc8004Ids(store);

  for (const c of candidates) {
    if (optedOutErcIds.has(c.erc8004Id)) {
      stats.skippedOptedOut += 1;
      continue;
    }

    if (anchorByErcId.has(c.erc8004Id)) {
      stats.skippedExistingAnchor += 1;
      continue;
    }

    const houseId = deriveHouseId(c.erc8004Id);
    const existingHouse = houseById.get(houseId);
    if (existingHouse && existingHouse.preRegistered !== true) {
      stats.skippedHouseCollision += 1;
      continue;
    }

    if (!existingHouse) {
      const createdAt = isoOrFallback(c.createdAt || c.updatedAt, importedAtIso);
      const nonceHex = crypto
        .createHash('sha256')
        .update(`erc8004-preregister-nonce|${c.erc8004Id}`, 'utf8')
        .digest('hex')
        .slice(0, 24);

      const prompt = normalizePrompt(c.imagePrompt);
      const imageDataUrl = opts.withImages && c.imageSourceUrl
        ? await resolveImageDataUrl(c.imageSourceUrl, opts, importImageRuntime, imageStats)
        : null;
      const hasImage = typeof imageDataUrl === 'string' && imageDataUrl.startsWith('data:image/');
      const shareHeroSlot = hasImage || prompt
        ? {
            image: hasImage ? imageDataUrl : null,
            prompt: prompt || null,
            source: 'erc8004',
            version: 'v1',
            updatedAt: importedAtIso
          }
        : null;
      const agentAvatarSlot = hasImage
        ? {
            image: imageDataUrl,
            prompt: prompt || null,
            source: 'erc8004',
            version: 'v1',
            updatedAt: importedAtIso
          }
        : null;
      const media =
        shareHeroSlot || agentAvatarSlot
          ? {
              ...(shareHeroSlot ? { shareHero: shareHeroSlot } : {}),
              ...(agentAvatarSlot ? { agentAvatar: agentAvatarSlot } : {})
            }
          : null;

      const house = {
        id: houseId,
        housePubKey: houseId,
        createdAt,
        nonce: `pr_${nonceHex}`,
        keyMode: 'preregister',
        unlock: {
          kind: 'erc8004-preregister',
          erc8004Id: c.erc8004Id,
          chain: c.source,
          address: c.unlockAddress || null
        },
        keyWrap: null,
        authKey: null,
        entries: [],
        ponyInbox: null,
        ...(media ? { media } : {}),
        ...(shareHeroSlot
          ? {
              publicMedia: {
                prompt: shareHeroSlot.prompt || null,
                image: shareHeroSlot.image || null,
                updatedAt: shareHeroSlot.updatedAt
              }
            }
          : {}),
        preRegistered: true,
        preRegistration: {
          importTag: IMPORT_TAG,
          source: c.source,
          sourceChainId: c.chainId,
          importedAt: importedAtIso,
          imageSourceUrl: c.imageSourceUrl || null
        }
      };
      if (hasImage) stats.housesWithImage += 1;
      houseById.set(houseId, house);
      newHouses.push(house);
      stats.housesAdded += 1;
    }

    const createdAtMs = epochMsOrFallback(c.updatedAt || c.createdAt, importedAtMs);
    const anchor = {
      erc8004Id: c.erc8004Id,
      houseId,
      signer: c.signer || '',
      chainId: c.chainId,
      createdAtMs,
      updatedAt: importedAtIso,
      importTag: IMPORT_TAG
    };
    anchorByErcId.set(c.erc8004Id, anchor);
    newAnchors.push(anchor);
    stats.anchorsAdded += 1;
  }

  if (newHouses.length > 0) store.houses = store.houses.concat(newHouses);
  if (newAnchors.length > 0) store.anchors = newAnchors.concat(store.anchors);

  process.stdout.write(`[preregister] source sqlite: ${sourcePath}\n`);
  process.stdout.write(`[preregister] target store: ${resolvedStorePath}\n`);
  process.stdout.write(
    `[preregister] candidates=${stats.sourceCandidates} houses_added=${stats.housesAdded} anchors_added=${stats.anchorsAdded} skipped_opted_out=${stats.skippedOptedOut} skipped_existing_anchor=${stats.skippedExistingAnchor} skipped_house_collision=${stats.skippedHouseCollision}\n`
  );
  if (opts.withImages) {
    process.stdout.write(
      `[preregister] images targets=${imageStats.candidatesWithImage} unique_urls=${imageStats.uniqueImageUrls} fetched=${imageStats.fetched} failed=${imageStats.failed} disk_cache_hit=${imageStats.diskCacheHit} memory_cache_hit=${imageStats.memoryCacheHit} cache_only_miss=${imageStats.cacheOnlyMiss} houses_with_image=${stats.housesWithImage}\n`
    );
  }
  if (opts.resetPreregister) {
    process.stdout.write(`[preregister] reset removed_houses=${removedHouses} removed_anchors=${removedAnchors}\n`);
  }

  if (!opts.apply) {
    process.stdout.write('[preregister] dry-run only. Re-run with --apply to persist changes.\n');
    return;
  }

  writeStore(store);
  process.stdout.write(
    `[preregister] wrote store: houses=${store.houses.length} anchors=${store.anchors.length}\n`
  );
}

main().catch((err) => {
  process.stderr.write(`${err?.message || String(err)}\n`);
  process.exit(1);
});
