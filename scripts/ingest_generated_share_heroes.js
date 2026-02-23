#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DEFAULT_MANIFEST = './data/erc8004-image-prompts-missing-share-hero.jsonl';
const DEFAULT_IMAGES_DIR = './data/generated-share-heroes';
const DEFAULT_STYLE_VERSION = 'v1';

const SUPPORTED_EXTS = ['.png', '.jpg', '.jpeg', '.webp'];
const SUPPORTED_MIME = new Set(['image/png', 'image/jpeg', 'image/webp']);

function printHelp() {
  process.stdout.write(
    [
      'Ingest generated share-hero images and map them to preregistered houses via erc8004Id.',
      '',
      'Usage:',
      '  node scripts/ingest_generated_share_heroes.js [options]',
      '',
      'Options:',
      `  --manifest <path>                Prompt manifest JSONL (default: ${DEFAULT_MANIFEST})`,
      `  --images-dir <path>              Generated image directory (default: ${DEFAULT_IMAGES_DIR})`,
      '  --store-path <path>              Backend store sqlite path',
      `  --style-version <v>              Fallback media version (default: ${DEFAULT_STYLE_VERSION})`,
      '  --set-agent-avatar-if-missing    Also set media.agentAvatar if missing',
      '  --limit <n>                      Stop after n successful ingests',
      '  --strict                         Exit non-zero on first missing/bad image',
      '  --apply                          Persist changes (default is dry-run)',
      '  --dry-run                        Explicit dry-run',
      '  --help                           Show this help',
      '',
      'Expected image naming:',
      '  Prefer filenames from manifest field `outputFilename`.',
      '  Fallback lookup: <outputFileBase>.<png|jpg|jpeg|webp>.',
      '',
      'Manifest fields used per line:',
      '  erc8004Id (required), prompt (optional), houseId (optional), outputFilename/outputFileBase (optional)'
    ].join('\n') + '\n'
  );
}

function parseArgs(argv) {
  const opts = {
    manifest: DEFAULT_MANIFEST,
    imagesDir: DEFAULT_IMAGES_DIR,
    storePath: null,
    styleVersion: DEFAULT_STYLE_VERSION,
    setAgentAvatarIfMissing: false,
    limit: 0,
    strict: false,
    apply: false,
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
    if (token === '--apply') {
      opts.apply = true;
      continue;
    }
    if (token === '--dry-run') {
      opts.apply = false;
      continue;
    }
    if (token === '--set-agent-avatar-if-missing') {
      opts.setAgentAvatarIfMissing = true;
      continue;
    }
    if (token === '--strict') {
      opts.strict = true;
      continue;
    }
    if (token === '--manifest') {
      opts.manifest = nextValue(i, token);
      i += 1;
      continue;
    }
    if (token.startsWith('--manifest=')) {
      opts.manifest = token.slice('--manifest='.length);
      continue;
    }
    if (token === '--images-dir') {
      opts.imagesDir = nextValue(i, token);
      i += 1;
      continue;
    }
    if (token.startsWith('--images-dir=')) {
      opts.imagesDir = token.slice('--images-dir='.length);
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
    if (token === '--style-version') {
      opts.styleVersion = nextValue(i, token);
      i += 1;
      continue;
    }
    if (token.startsWith('--style-version=')) {
      opts.styleVersion = token.slice('--style-version='.length);
      continue;
    }
    if (token === '--limit') {
      opts.limit = Number(nextValue(i, token));
      i += 1;
      continue;
    }
    if (token.startsWith('--limit=')) {
      opts.limit = Number(token.slice('--limit='.length));
      continue;
    }
    throw new Error(`UNKNOWN_ARG:${token}`);
  }

  if (!Number.isFinite(opts.limit) || opts.limit < 0) throw new Error('INVALID_LIMIT');
  opts.limit = Math.floor(opts.limit);
  opts.manifest = path.resolve(opts.manifest);
  opts.imagesDir = path.resolve(opts.imagesDir);
  if (opts.storePath) opts.storePath = path.resolve(opts.storePath);
  return opts;
}

function nonEmpty(value) {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  return v ? v : null;
}

function parseJsonl(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/).filter((line) => line.trim());
  const out = [];
  for (let i = 0; i < lines.length; i += 1) {
    try {
      out.push(JSON.parse(lines[i]));
    } catch (err) {
      throw new Error(`INVALID_JSONL_LINE:${i + 1}`);
    }
  }
  return out;
}

function mimeFromExt(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  return null;
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

function safeFileId(input) {
  return String(input || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'agent';
}

function resolveImagePath(imagesDir, rec) {
  const explicit = nonEmpty(rec?.outputFilename);
  if (explicit) {
    const p = path.join(imagesDir, explicit);
    if (fs.existsSync(p)) return p;
  }
  const base = nonEmpty(rec?.outputFileBase) || safeFileId(rec?.erc8004Id);
  for (const ext of SUPPORTED_EXTS) {
    const p = path.join(imagesDir, `${base}${ext}`);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function loadStore(opts) {
  if (opts.storePath) process.env.STORE_PATH = opts.storePath;
  const { readStore, writeStore, getStorePath } = require('../server/store');
  const store = readStore();
  return { readStore, writeStore, getStorePath, store };
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    printHelp();
    return;
  }
  if (!fs.existsSync(opts.manifest)) throw new Error(`MANIFEST_NOT_FOUND:${opts.manifest}`);
  if (!fs.existsSync(opts.imagesDir)) throw new Error(`IMAGES_DIR_NOT_FOUND:${opts.imagesDir}`);

  const records = parseJsonl(opts.manifest);
  const { writeStore, getStorePath, store } = loadStore(opts);
  store.houses = Array.isArray(store.houses) ? store.houses : [];
  store.anchors = Array.isArray(store.anchors) ? store.anchors : [];

  const houseById = new Map();
  for (const house of store.houses) {
    const houseId = nonEmpty(house?.id);
    if (!houseId || houseById.has(houseId)) continue;
    houseById.set(houseId, house);
  }
  const houseByErc8004Id = new Map();
  for (const anchor of store.anchors) {
    const ercId = nonEmpty(anchor?.erc8004Id);
    const houseId = nonEmpty(anchor?.houseId);
    if (!ercId || !houseId || houseByErc8004Id.has(ercId)) continue;
    houseByErc8004Id.set(ercId, houseId);
  }

  const nowIso = new Date().toISOString();
  const stats = {
    records: records.length,
    attempted: 0,
    updated: 0,
    missingImage: 0,
    missingHouse: 0,
    unsupportedMime: 0,
    skippedAlreadySame: 0,
    setAgentAvatar: 0
  };

  for (const rec of records) {
    const erc8004Id = nonEmpty(rec?.erc8004Id);
    if (!erc8004Id) continue;
    const houseId = nonEmpty(rec?.houseId) || houseByErc8004Id.get(erc8004Id) || null;
    if (!houseId) {
      stats.missingHouse += 1;
      if (opts.strict) throw new Error(`HOUSE_NOT_FOUND_FOR_ERC8004:${erc8004Id}`);
      continue;
    }
    const house = houseById.get(houseId);
    if (!house) {
      stats.missingHouse += 1;
      if (opts.strict) throw new Error(`HOUSE_ROW_NOT_FOUND:${houseId}`);
      continue;
    }

    const imagePath = resolveImagePath(opts.imagesDir, rec);
    if (!imagePath) {
      stats.missingImage += 1;
      if (opts.strict) throw new Error(`IMAGE_NOT_FOUND:${erc8004Id}`);
      continue;
    }

    const bytes = fs.readFileSync(imagePath);
    const mime = mimeFromExt(imagePath) || detectMimeFromBytes(bytes);
    if (!mime || !SUPPORTED_MIME.has(mime)) {
      stats.unsupportedMime += 1;
      if (opts.strict) throw new Error(`UNSUPPORTED_IMAGE_MIME:${imagePath}`);
      continue;
    }

    const imageDataUrl = `data:${mime};base64,${bytes.toString('base64')}`;
    const prompt = nonEmpty(rec?.prompt);
    const version = nonEmpty(rec?.styleVersion) || nonEmpty(opts.styleVersion) || DEFAULT_STYLE_VERSION;
    const current = house?.media?.shareHero?.image;
    if (current === imageDataUrl) {
      stats.skippedAlreadySame += 1;
      continue;
    }

    stats.attempted += 1;
    if (opts.apply) {
      if (!house.media || typeof house.media !== 'object' || Array.isArray(house.media)) house.media = {};
      house.media.shareHero = {
        image: imageDataUrl,
        prompt: prompt || null,
        source: 'generated',
        version,
        updatedAt: nowIso
      };
      house.publicMedia = {
        image: imageDataUrl,
        prompt: prompt || null,
        updatedAt: nowIso
      };

      if (opts.setAgentAvatarIfMissing) {
        const currentAgentAvatar = house?.media?.agentAvatar?.image;
        if (!(typeof currentAgentAvatar === 'string' && currentAgentAvatar.startsWith('data:image/'))) {
          house.media.agentAvatar = {
            image: imageDataUrl,
            prompt: prompt || null,
            source: 'generated',
            version,
            updatedAt: nowIso
          };
          stats.setAgentAvatar += 1;
        }
      }
    }
    stats.updated += 1;
    if (opts.limit > 0 && stats.updated >= opts.limit) break;
  }

  if (opts.apply) writeStore(store);

  process.stdout.write(
    [
      `[ingest-generated] manifest=${opts.manifest}`,
      `[ingest-generated] images_dir=${opts.imagesDir}`,
      `[ingest-generated] store=${path.resolve(getStorePath())}`,
      `[ingest-generated] records=${stats.records} attempted=${stats.attempted} updated=${stats.updated}`,
      `[ingest-generated] missing_image=${stats.missingImage} missing_house=${stats.missingHouse} unsupported_mime=${stats.unsupportedMime} skipped_same=${stats.skippedAlreadySame}`,
      `[ingest-generated] set_agent_avatar=${stats.setAgentAvatar}`,
      `[ingest-generated] mode=${opts.apply ? 'apply' : 'dry-run'}`
    ].join('\n') + '\n'
  );
}

try {
  main();
} catch (err) {
  process.stderr.write(`${err?.message || String(err)}\n`);
  process.exit(1);
}
