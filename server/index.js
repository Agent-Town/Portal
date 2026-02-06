const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const https = require('https');
const http = require('http');
const { spawn } = require('child_process');
const zlib = require('zlib');
const express = require('express');

const { parseCookies, nowIso, randomHex } = require('./util');
const { readStore, writeStore } = require('./store');
const { getWorldSnapshot, upsertTestWorldEntry, resetWorldState } = require('./world');
const { createPresenceAdapter, WorldInstanceManager } = require('./world_instances');
const { startWorldRealtimeServer } = require('./world_realtime');
const {
  createSession,
  getSessionById,
  getSessionByTeamCode,
  getSessionByHouseId,
  indexHouseId,
  listElements,
  evaluateMatch,
  resetAllSessions,
  CANVAS
} = require('./sessions');

function b64ToBytes(str) {
  const bin = Buffer.from(str, 'base64');
  return new Uint8Array(bin);
}

// --- Pony Express v0 (inbox + sealed notes) ---
const MAYOR_HOUSE_ID = 'npc_mayor';

function makeInboxMsg({ toHouseId, fromHouseId = null, body, status = 'request', kind = 'msg.chat' }) {
  const id = `msg_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  return {
    id,
    version: 1,
    kind,
    toHouseId,
    fromHouseId,
    // Forward-compatible: treat as ciphertext even if plaintext today.
    ciphertext: String(body || ''),
    createdAt: nowIso(),
    status // request | accepted | rejected
  };
}

function bytesToB64(bytes) {
  return Buffer.from(bytes).toString('base64');
}

function sha256Bytes(bytes) {
  return new Uint8Array(crypto.createHash('sha256').update(Buffer.from(bytes)).digest());
}

function sha256Base64(input) {
  return crypto.createHash('sha256').update(input).digest('base64');
}

function base58Encode(bytes) {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let x = BigInt('0x' + Buffer.from(bytes).toString('hex'));
  let out = '';
  while (x > 0n) {
    const mod = x % 58n;
    out = alphabet[Number(mod)] + out;
    x = x / 58n;
  }
  // leading zeros
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) out = '1' + out;
  return out || '1';
}

function base58Decode(str) {
  if (!str || typeof str !== 'string') return null;
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let num = 0n;
  for (const ch of str) {
    const idx = alphabet.indexOf(ch);
    if (idx < 0) return null;
    num = num * 58n + BigInt(idx);
  }
  const bytes = [];
  while (num > 0n) {
    bytes.push(Number(num & 0xffn));
    num >>= 8n;
  }
  bytes.reverse();
  let leadingZeros = 0;
  for (let i = 0; i < str.length && str[i] === '1'; i++) leadingZeros++;
  if (leadingZeros) {
    return new Uint8Array(Array(leadingZeros).fill(0).concat(bytes));
  }
  return new Uint8Array(bytes);
}

function buildWalletLookupMessage({ address, nonce, houseId }) {
  const parts = ['ElizaTown House Lookup', `address: ${address}`, `nonce: ${nonce}`];
  if (houseId) parts.push(`houseId: ${houseId}`);
  return parts.join('\n');
}

function buildHouseKeyWrapMessage({ houseId }) {
  return ['ElizaTown House Key Wrap', `houseId: ${houseId}`].join('\n');
}

function buildTokenCheckMessage({ address, nonce, ca }) {
  return ['ElizaTown Token Check', `address: ${address}`, `CA: ${ca}`, `nonce: ${nonce}`].join('\n');
}

function verifySolanaSignature(address, message, signatureB64) {
  try {
    const pubKey = base58Decode(address);
    if (!pubKey || pubKey.length !== 32) return false;
    const sig = Buffer.from(signatureB64 || '', 'base64');
    if (sig.length !== 64) return false;
    const spki = Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), Buffer.from(pubKey)]);
    const key = crypto.createPublicKey({ key: spki, format: 'der', type: 'spki' });
    return crypto.verify(null, Buffer.from(message, 'utf8'), key, sig);
  } catch (e) {
    console.warn('wallet signature verify failed', e);
    return false;
  }
}

function isTestMockAddress(address) {
  return process.env.NODE_ENV === 'test' && typeof address === 'string' && address.startsWith('So1anaMock');
}

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(
  express.json({
    limit: '3mb',
    verify: (req, _res, buf) => {
      req.rawBody = buf.toString('utf8');
    }
  })
);

app.use((err, req, res, next) => {
  if (err && err.type === 'entity.parse.failed') {
    const size = req.rawBody ? req.rawBody.length : 0;
    console.warn(`[bad-json] ${req.method} ${req.originalUrl} (${size} bytes)`);
    return res.status(400).json({ ok: false, error: 'INVALID_JSON' });
  }
  return next(err);
});

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const ASSETS_DIR = path.join(process.cwd(), 'assets');
const PHASER_DIST_DIR = path.join(process.cwd(), 'node_modules', 'phaser', 'dist');
const COLYSEUS_DIST_DIR = path.join(process.cwd(), 'node_modules', 'colyseus.js', 'dist');
const isProd = process.env.NODE_ENV === 'production';
const ELIZATOWN_MINT = 'CZRsbB6BrHsAmGKeoxyfwzCyhttXvhfEukXCWnseBAGS';
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const SOLANA_RPC_FALLBACKS = (process.env.SOLANA_RPC_FALLBACKS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const SOLANA_RPC_URLS = [SOLANA_RPC_URL, ...SOLANA_RPC_FALLBACKS].filter(Boolean);
const TOKEN_CHECK_TIMEOUT_MS = 5_000;
const TOKEN_VERIFY_TTL_MS = 5 * 60 * 1000;
const TOKEN_VERIFY_CACHE_MS = 60 * 1000;
const HOUSE_AUTH_SKEW_MS = 2 * 60 * 1000;

function setSecurityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('X-Frame-Options', 'DENY');

  const runtimePort = Number(process.env.PORT || 4173);
  const runtimeRtPort = Number(process.env.WORLD_RT_PORT || runtimePort + 1);
  const connectSrc = [
    "'self'",
    'https://eth.llamarpc.com',
    'https://rpc.ankr.com',
    `http://localhost:${runtimeRtPort}`,
    `https://localhost:${runtimeRtPort}`,
    `ws://localhost:${runtimeRtPort}`,
    `wss://localhost:${runtimeRtPort}`,
    `http://[::1]:${runtimeRtPort}`,
    `https://[::1]:${runtimeRtPort}`,
    `ws://[::1]:${runtimeRtPort}`,
    `wss://[::1]:${runtimeRtPort}`
  ];
  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    `connect-src ${connectSrc.join(' ')}`,
    "object-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'none'"
  ].join('; ');
  res.setHeader('Content-Security-Policy', csp);

  if (isProd) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  return next();
}

app.use((req, res, next) => {
  if (isProd && !req.secure) {
    const host = req.get('host');
    if (host) {
      return res.redirect(301, `https://${host}${req.originalUrl}`);
    }
  }
  return next();
});

app.use(setSecurityHeaders);

// --- rate limiting ---
const rateBuckets = new Map();
function rateLimit({ windowMs, max, keyFn }) {
  return (req, res, next) => {
    const key = keyFn(req);
    if (!key) return next();
    const now = Date.now();
    let bucket = rateBuckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      rateBuckets.set(key, bucket);
    }
    bucket.count += 1;
    if (bucket.count > max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({ ok: false, error: 'RATE_LIMITED' });
    }
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - bucket.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(bucket.resetAt / 1000));
    return next();
  };
}

app.use(
  '/api/agent',
  rateLimit({
    windowMs: 60_000,
    max: 120,
    keyFn: (req) => `agent:${req.ip}`
  })
);

app.use(
  '/api/house',
  rateLimit({
    windowMs: 60_000,
    max: 180,
    keyFn: (req) => `house:${req.ip}`
  })
);

const shareLimiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  keyFn: (req) => `share:${req.ip}`
});
app.use('/api/share/create', shareLimiter);

app.use(
  '/api/token',
  rateLimit({
    windowMs: 60_000,
    max: 30,
    keyFn: (req) => `token:${req.ip}`
  })
);

app.use(
  '/api/wallet',
  rateLimit({
    windowMs: 60_000,
    max: 30,
    keyFn: (req) => `wallet:${req.ip}`
  })
);

app.use(
  '/api/house/init',
  rateLimit({
    windowMs: 60_000,
    max: 20,
    keyFn: (req) => `house-init:${req.ip}`
  })
);

function ensureHumanSession(req, res) {
  const cookies = parseCookies(req.header('cookie') || '');
  let sid = cookies.et_session;
  let session = sid ? getSessionById(sid) : null;
  if (!session) {
    session = createSession();
    sid = session.sessionId;
    // Cookie is the only "identity". No external auth required.
    const secureFlag = isProd || req.secure ? '; Secure' : '';
    res.setHeader('Set-Cookie', `et_session=${encodeURIComponent(sid)}; Path=/; SameSite=Lax; HttpOnly${secureFlag}`);
  }
  return session;
}

function sanitizeUrl(url) {
  if (typeof url !== 'string') return null;
  const u = url.trim();
  if (!u) return null;
  if (u.length > 500) return null;
  try {
    const parsed = new URL(u);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function postJson(url, payload, { timeoutMs = TOKEN_CHECK_TIMEOUT_MS } = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const target = new URL(url);
    const lib = target.protocol === 'http:' ? http : https;
    const req = lib.request(
      {
        method: 'POST',
        hostname: target.hostname,
        port: target.port || (target.protocol === 'http:' ? 80 : 443),
        path: `${target.pathname}${target.search}`,
        headers: {
          'content-type': 'application/json',
          'content-length': Buffer.byteLength(body)
        }
      },
      (res) => {
        let raw = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(raw);
          } catch {
            // ignore
          }
          if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
            const err = new Error(`RPC_${res.statusCode || 0}`);
            err.status = res.statusCode || 0;
            err.body = raw;
            err.json = json;
            return reject(err);
          }
          if (!json) return reject(new Error('RPC_BAD_JSON'));
          return resolve(json);
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => req.destroy(new Error('RPC_TIMEOUT')));
    req.write(body);
    req.end();
  });
}

async function postJsonWithFallback(urls, payload) {
  let lastErr = null;
  for (const url of urls) {
    try {
      return await postJson(url, payload);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('RPC_UNAVAILABLE');
}

function addressHasTokenValue(account) {
  const amount = account?.account?.data?.parsed?.info?.tokenAmount?.amount;
  if (typeof amount !== 'string') return false;
  try {
    return BigInt(amount) > 0n;
  } catch {
    return false;
  }
}

const tokenVerifyCache = new Map();
function getCachedTokenEligibility(address) {
  const cached = tokenVerifyCache.get(address);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    tokenVerifyCache.delete(address);
    return null;
  }
  return cached.eligible;
}

function setCachedTokenEligibility(address, eligible) {
  tokenVerifyCache.set(address, { eligible, expiresAt: Date.now() + TOKEN_VERIFY_CACHE_MS });
}

async function hasElizaTownToken(address) {
  if (process.env.NODE_ENV === 'test') {
    const testAddr = process.env.TEST_TOKEN_ADDRESS || 'So1anaMockToken1111111111111111111111111111';
    return address === testAddr;
  }
  const cached = getCachedTokenEligibility(address);
  if (cached !== null) return cached;
  const payload = {
    jsonrpc: '2.0',
    id: 1,
    method: 'getTokenAccountsByOwner',
    params: [address, { mint: ELIZATOWN_MINT }, { encoding: 'jsonParsed' }]
  };
  const data = await postJsonWithFallback(SOLANA_RPC_URLS, payload);
  const accounts = Array.isArray(data?.result?.value) ? data.result.value : [];
  const eligible = accounts.some(addressHasTokenValue);
  setCachedTokenEligibility(address, eligible);
  return eligible;
}

const MAX_HOUSE_ENTRIES = 200;
const MAX_HOUSES = 500;
const MAX_SHARES = 2000;
const MAX_SIGNUPS = 5000;
const MAX_PUBLIC_TEAMS = 2000;
const MAX_PUBLIC_IMAGE_BYTES = 1024 * 1024;
const MAX_PUBLIC_PROMPT_CHARS = 280;
const MIN_AGENT_SOLO_PIXELS = 20;
const TEST_HOUSE_AUTH_KEY = Buffer.from('test-house-auth-key-material', 'utf8').toString('base64');
const CLIP_MIN_SECONDS = 1;
const CLIP_MAX_SECONDS = 60;
const MAX_CLIP_UPLOAD_BYTES = 8 * 1024 * 1024;
const MEDIA_DIR = path.join(process.cwd(), 'data', 'media', 'clips');

let worldInstanceManager = null;
let worldRealtime = null;
const clipFinalizeTimers = new Map();

function extractXHandle(url) {
  if (typeof url !== 'string') return null;
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const host = parsed.hostname.toLowerCase();
  const allowed = new Set(['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com', 'mobile.twitter.com']);
  if (!allowed.has(host)) return null;
  const parts = parsed.pathname.split('/').filter(Boolean);
  if (!parts.length) return null;
  const raw = parts[0].startsWith('@') ? parts[0].slice(1) : parts[0];
  const handle = raw.trim();
  if (!/^[A-Za-z0-9_]{1,15}$/.test(handle)) return null;
  const reserved = new Set(['i', 'intent', 'share', 'home']);
  if (reserved.has(handle.toLowerCase())) return null;
  return handle;
}

function palette() {
  // Tiny 8-color palette (0 = empty).
  return [
    '#000000', // 0 empty (rendered as dark)
    '#ffffff',
    '#ff004d',
    '#00e756',
    '#29adff',
    '#ffa300',
    '#7e2553',
    '#fff1e8'
  ];
}

function canvasHasInk(pixels) {
  return Array.isArray(pixels) && pixels.some((p) => p && p !== 0);
}

function countInk(pixels) {
  if (!Array.isArray(pixels)) return 0;
  let count = 0;
  for (const p of pixels) {
    if (p && p !== 0) count += 1;
  }
  return count;
}

function isShareLocked(share) {
  return !!share && share.locked !== false;
}

function normalizeAgentName(name) {
  if (typeof name !== 'string') return null;
  const trimmed = name.trim();
  if (!trimmed) return null;
  const cleaned = trimmed.replace(/[^A-Za-z0-9 _().-]/g, '').slice(0, 40);
  return cleaned || null;
}

function recordSignup(session, { mode, agentName = null, matchedElement = null, address = null } = {}) {
  if (session.signup.complete) {
    return { complete: true, already: true, createdAt: session.signup.createdAt || null };
  }

  const store = readStore();
  if (store.signups.length >= MAX_SIGNUPS) {
    return { complete: false, reason: 'STORE_FULL' };
  }
  const signupId = `s_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const referralShareId = session.referral?.shareId || null;
  const record = {
    id: signupId,
    createdAt: nowIso(),
    teamCode: session.teamCode,
    agentName,
    matchedElement,
    referralShareId,
    mode,
    walletAddress: address || null
  };
  if (referralShareId) {
    const share = store.shares.find((x) => x.id === referralShareId);
    if (share) {
      share.referrals = typeof share.referrals === 'number' ? share.referrals + 1 : 1;
    }
  }
  store.signups.push(record);
  writeStore(store);

  session.signup.complete = true;
  session.signup.createdAt = record.createdAt;
  session.signup.mode = mode;
  session.signup.address = address || null;

  return { complete: true, already: false, createdAt: record.createdAt };
}

function decodeB64(input) {
  try {
    return Buffer.from(input, 'base64');
  } catch {
    return null;
  }
}

function parsePublicImageDataUrl(dataUrl) {
  if (dataUrl == null || dataUrl === '') return { dataUrl: null };
  if (typeof dataUrl !== 'string') return { error: 'INVALID_PUBLIC_IMAGE' };
  const match = dataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return { error: 'INVALID_PUBLIC_IMAGE' };
  const mime = match[1];
  const payload = match[2];
  let bytes;
  try {
    bytes = Buffer.from(payload, 'base64');
  } catch {
    return { error: 'INVALID_PUBLIC_IMAGE' };
  }
  if (!bytes || bytes.length === 0) return { error: 'INVALID_PUBLIC_IMAGE' };
  if (bytes.length > MAX_PUBLIC_IMAGE_BYTES) return { error: 'PUBLIC_IMAGE_TOO_LARGE' };
  return { dataUrl, mime, bytes };
}

function normalizePublicPrompt(value) {
  if (value == null) return null;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, MAX_PUBLIC_PROMPT_CHARS);
}

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC32_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  const sum = crc32(Buffer.concat([typeBuf, data]));
  crc.writeUInt32BE(sum, 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function hexToRgba(hex) {
  if (!hex || typeof hex !== 'string') return [0, 0, 0, 255];
  const cleaned = hex.startsWith('#') ? hex.slice(1) : hex;
  if (cleaned.length !== 6) return [0, 0, 0, 255];
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  return [r, g, b, 255];
}

function canvasToPngDataUrl(canvas, paletteHex) {
  const w = canvas?.w || 0;
  const h = canvas?.h || 0;
  const pixels = Array.isArray(canvas?.pixels) ? canvas.pixels : [];
  if (!w || !h || pixels.length < w * h) return null;
  const palette = (paletteHex || palette()).map(hexToRgba);

  const stride = w * 4 + 1;
  const raw = Buffer.alloc(stride * h);
  let offset = 0;
  for (let y = 0; y < h; y++) {
    raw[offset++] = 0; // filter 0
    for (let x = 0; x < w; x++) {
      const idx = pixels[y * w + x] || 0;
      const [r, g, b, a] = palette[idx] || palette[0];
      raw[offset++] = r;
      raw[offset++] = g;
      raw[offset++] = b;
      raw[offset++] = a;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const header = Buffer.from('\x89PNG\r\n\x1a\n', 'binary');
  const idat = zlib.deflateSync(raw);
  const png = Buffer.concat([
    header,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0))
  ]);

  return `data:image/png;base64,${png.toString('base64')}`;
}

function serializePublicMedia(house) {
  const media = house?.publicMedia;
  if (!media) return null;
  const prompt = typeof media.prompt === 'string' ? media.prompt : null;
  const image = typeof media.image === 'string' ? media.image : null;
  if (!prompt && !image) return null;
  const imageUrl = image
    ? `/api/house/${encodeURIComponent(house.id)}/public-media/image${media.updatedAt ? `?v=${encodeURIComponent(media.updatedAt)}` : ''}`
    : null;
  return {
    prompt,
    imageUrl,
    updatedAt: media.updatedAt || null
  };
}

function escapeHtmlAttr(input) {
  return String(input || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildShareMeta({ shareId, publicMedia, origin }) {
  const title = 'Agent Town — House Share';
  const description = publicMedia?.prompt || 'Human + agent co-op house in Agent Town.';
  const url = `${origin}/s/${encodeURIComponent(shareId)}`;
  const imagePath = publicMedia?.imageUrl || '/logo.jpg';
  const imageUrl = imagePath.startsWith('http')
    ? imagePath
    : `${origin}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  const card = publicMedia?.imageUrl ? 'summary_large_image' : 'summary';

  return [
    `<meta property="og:title" content="${escapeHtmlAttr(title)}" />`,
    `<meta property="og:description" content="${escapeHtmlAttr(description)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${escapeHtmlAttr(url)}" />`,
    `<meta property="og:image" content="${escapeHtmlAttr(imageUrl)}" />`,
    `<meta name="twitter:card" content="${escapeHtmlAttr(card)}" />`,
    `<meta name="twitter:title" content="${escapeHtmlAttr(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtmlAttr(description)}" />`,
    `<meta name="twitter:image" content="${escapeHtmlAttr(imageUrl)}" />`
  ].join('\n  ');
}

function verifyHouseAuth(req, house) {
  if (!house || !house.authKey) return { ok: false, error: 'HOUSE_AUTH_REQUIRED' };
  const ts = req.header('x-house-ts');
  const auth = req.header('x-house-auth');
  if (!ts || !auth) return { ok: false, error: 'HOUSE_AUTH_REQUIRED' };
  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum)) return { ok: false, error: 'HOUSE_AUTH_INVALID' };
  const skew = Math.abs(Date.now() - tsNum);
  if (skew > HOUSE_AUTH_SKEW_MS) return { ok: false, error: 'HOUSE_AUTH_EXPIRED' };
  const key = decodeB64(house.authKey);
  if (!key || key.length < 16) return { ok: false, error: 'HOUSE_AUTH_INVALID' };
  const bodyHash = sha256Base64(req.rawBody || '');
  const msg = `${house.id}.${ts}.${req.method.toUpperCase()}.${req.path}.${bodyHash}`;
  const expected = crypto.createHmac('sha256', key).update(msg).digest('base64');
  const a = Buffer.from(expected, 'base64');
  const b = Buffer.from(auth, 'base64');
  if (a.length !== b.length) return { ok: false, error: 'HOUSE_AUTH_INVALID' };
  if (!crypto.timingSafeEqual(a, b)) return { ok: false, error: 'HOUSE_AUTH_INVALID' };
  return { ok: true };
}

function formatWsHost(hostname) {
  if (!hostname) return 'localhost';
  if (hostname.includes(':') && !hostname.startsWith('[')) return `[${hostname}]`;
  return hostname;
}

function worldRealtimeWsUrl(req) {
  const hostOverride = process.env.WORLD_RT_PUBLIC_HOST || '';
  const host = hostOverride || formatWsHost(req.hostname || 'localhost');
  const wsProto = req.secure || req.protocol === 'https' ? 'https' : 'http';
  const port = worldRealtime?.port || Number(process.env.WORLD_RT_PORT || 2570);
  return `${wsProto}://${host}:${port}`;
}

function ensureMediaDir() {
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
}

function clipSourcePath(clipId) {
  return path.join(MEDIA_DIR, `${clipId}.webm`);
}

function clipFinalPath(clipId) {
  return path.join(MEDIA_DIR, `${clipId}.mp4`);
}

function clipPublicPath(filename) {
  return `/media/clips/${filename}`;
}

function toBase64Bytes(input) {
  if (typeof input !== 'string' || !input) return null;
  try {
    return Buffer.from(input, 'base64');
  } catch {
    return null;
  }
}

function findClipRecord(store, clipId) {
  const clips = Array.isArray(store.clips) ? store.clips : [];
  return clips.find((clip) => clip && clip.clipId === clipId) || null;
}

function serializeClip(clip) {
  return {
    clipId: clip.clipId,
    ownerSessionId: clip.ownerSessionId,
    instanceId: clip.instanceId,
    durationSec: clip.durationSec,
    status: clip.status,
    error: clip.error || null,
    storage: clip.storage || { sourceUrl: null, mp4Url: null },
    sharePath: clip.sharePath || null,
    createdAt: clip.createdAt,
    updatedAt: clip.updatedAt || clip.createdAt
  };
}

function scheduleClipFinalize(clipId) {
  if (clipFinalizeTimers.has(clipId)) return;
  const timer = setTimeout(() => {
    clipFinalizeTimers.delete(clipId);
    finalizeClip(clipId).catch((err) => {
      console.warn('[clips] finalize failed', err?.message || err);
    });
  }, 250);
  clipFinalizeTimers.set(clipId, timer);
}

function runFfmpegTranscode({ inputPath, outputPath }) {
  return new Promise((resolve, reject) => {
    const args = [
      '-y',
      '-i',
      inputPath,
      // H.264 + faststart is broadly compatible for sharing.
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-crf',
      '28',
      '-movflags',
      '+faststart',
      // No audio for now (canvas capture is silent in this MVP).
      '-an',
      outputPath
    ];
    const proc = spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString('utf8');
      if (stderr.length > 8_000) stderr = stderr.slice(-8_000);
    });
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code === 0) return resolve();
      const err = new Error(`FFMPEG_${code || 0}`);
      err.stderr = stderr;
      return reject(err);
    });
  });
}

async function finalizeClip(clipId) {
  const store = readStore();
  const clip = findClipRecord(store, clipId);
  if (!clip || clip.status !== 'processing') return;

  ensureMediaDir();
  const sourceUrl = clipPublicPath(`${clipId}.webm`);
  const sourcePath = clipSourcePath(clipId);
  const finalPath = clipFinalPath(clipId);

  let mp4Url = null;

  // In tests we upload synthetic bytes, so ffmpeg would fail. Keep tests deterministic.
  if (process.env.NODE_ENV !== 'test') {
    try {
      await runFfmpegTranscode({ inputPath: sourcePath, outputPath: finalPath });
      mp4Url = clipPublicPath(`${clipId}.mp4`);
    } catch (err) {
      // Fall back to sharing the original WebM if transcoding fails.
      console.warn('[clips] transcode failed, using webm fallback', err?.message || err);
      mp4Url = null;
    }
  }

  clip.status = 'ready';
  clip.storage = {
    sourceUrl,
    mp4Url
  };
  clip.sharePath = `/c/${clipId}`;
  clip.updatedAt = nowIso();
  clip.error = null;

  writeStore(store);
}

// --- API ---
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, time: nowIso() });
});

app.get('/api/world/snapshot', (req, res) => {
  const instanceParam = typeof req.query?.instance === 'string' ? req.query.instance.trim() : '';
  const instance = instanceParam || 'public';
  const snapshot = getWorldSnapshot(instance, readStore());
  if (!snapshot) {
    return res.status(400).json({ ok: false, error: 'INVALID_INSTANCE' });
  }
  return res.json({
    ok: true,
    instance: snapshot.instance,
    world: snapshot.world,
    houses: snapshot.houses,
    inhabitants: snapshot.inhabitants
  });
});

app.get('/api/world/realtime/config', (req, res) => {
  if (!worldRealtime) return res.status(503).json({ ok: false, error: 'REALTIME_UNAVAILABLE' });
  return res.json({
    ok: true,
    roomName: worldRealtime.roomName,
    wsUrl: worldRealtimeWsUrl(req),
    policy: worldInstanceManager.getPolicy()
  });
});

app.get('/api/world/instance/policy', (_req, res) => {
  if (!worldInstanceManager) return res.status(503).json({ ok: false, error: 'REALTIME_UNAVAILABLE' });
  return res.json({ ok: true, policy: worldInstanceManager.getPolicy() });
});

app.post('/api/world/instance/assign', (req, res) => {
  if (!worldInstanceManager || !worldRealtime) {
    return res.status(503).json({ ok: false, error: 'REALTIME_UNAVAILABLE' });
  }
  const s = ensureHumanSession(req, res);
  const requestedInstanceId = typeof req.body?.instanceId === 'string' ? req.body.instanceId.trim() : '';
  const assignment = worldInstanceManager.assign({
    sessionId: s.sessionId,
    houseId: s.houseCeremony?.houseId || null,
    requestedInstanceId: requestedInstanceId || null
  });
  if (!assignment) return res.status(500).json({ ok: false, error: 'ASSIGNMENT_FAILED' });
  return res.json({
    ok: true,
    instanceId: assignment.instanceId,
    roomName: assignment.roomName,
    policy: assignment.policy,
    composition: assignment.composition,
    houses: assignment.houses,
    realtime: {
      wsUrl: worldRealtimeWsUrl(req),
      roomName: worldRealtime.roomName
    }
  });
});

app.get('/api/world/instance/:instanceId', async (req, res) => {
  const instanceId = typeof req.params?.instanceId === 'string' ? req.params.instanceId.trim() : '';
  if (!instanceId) return res.status(400).json({ ok: false, error: 'MISSING_INSTANCE_ID' });
  const instance = worldInstanceManager.getInstance(instanceId);
  if (!instance) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  const presence = await worldInstanceManager.presence.count(instanceId);
  return res.json({ ok: true, instance: { ...instance, presence } });
});

app.get('/api/world/houses/:houseId', (req, res) => {
  const houseId = typeof req.params?.houseId === 'string' ? req.params.houseId.trim() : '';
  if (!houseId) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });

  const instanceParam = typeof req.query?.instance === 'string' ? req.query.instance.trim() : '';
  const instance = instanceParam || 'public';
  const snapshot = getWorldSnapshot(instance, readStore());
  if (!snapshot) return res.status(400).json({ ok: false, error: 'INVALID_INSTANCE' });

  const house = snapshot.houses.find((item) => item.houseId === houseId);
  if (!house) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  const inhabitants = snapshot.inhabitants.filter((inh) => inh.houseId === houseId);
  return res.json({ ok: true, house, inhabitants });
});

app.get('/api/world/inhabitants/:inhabitantId', (req, res) => {
  const inhabitantId = typeof req.params?.inhabitantId === 'string' ? req.params.inhabitantId.trim() : '';
  if (!inhabitantId) return res.status(400).json({ ok: false, error: 'MISSING_INHABITANT_ID' });

  const instanceParam = typeof req.query?.instance === 'string' ? req.query.instance.trim() : '';
  const instance = instanceParam || 'public';
  const snapshot = getWorldSnapshot(instance, readStore());
  if (!snapshot) return res.status(400).json({ ok: false, error: 'INVALID_INSTANCE' });

  const inhabitant = snapshot.inhabitants.find((item) => item.inhabitantId === inhabitantId);
  if (!inhabitant) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  return res.json({ ok: true, inhabitant });
});

app.post('/api/clips', (req, res) => {
  const s = ensureHumanSession(req, res);
  const durationSec = Number(req.body?.durationSec || 0);
  const instanceId = typeof req.body?.instanceId === 'string' ? req.body.instanceId.trim() : null;
  const mimeType = typeof req.body?.mimeType === 'string' ? req.body.mimeType.trim() : null;
  const sizeBytes = Number(req.body?.sizeBytes || 0);

  if (!Number.isFinite(durationSec) || durationSec < CLIP_MIN_SECONDS || durationSec > CLIP_MAX_SECONDS) {
    return res.status(400).json({ ok: false, error: 'INVALID_DURATION' });
  }
  if (mimeType && !mimeType.startsWith('video/')) {
    return res.status(400).json({ ok: false, error: 'INVALID_CLIP' });
  }
  if (!Number.isFinite(sizeBytes) || sizeBytes < 1 || sizeBytes > MAX_CLIP_UPLOAD_BYTES) {
    return res.status(400).json({ ok: false, error: 'INVALID_CLIP_SIZE' });
  }

  const store = readStore();
  store.clips = Array.isArray(store.clips) ? store.clips : [];
  const clipId = `clp_${randomHex(8)}`;
  const clip = {
    clipId,
    ownerSessionId: s.sessionId,
    instanceId: instanceId || null,
    durationSec: Number(durationSec.toFixed(1)),
    status: 'uploaded',
    storage: { sourceUrl: null, mp4Url: null },
    sharePath: null,
    error: null,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
  store.clips.unshift(clip);
  writeStore(store);
  return res.json({ ok: true, clipId: clip.clipId, status: clip.status });
});

app.post('/api/clips/:clipId/upload-complete', (req, res) => {
  const s = ensureHumanSession(req, res);
  const clipId = typeof req.params?.clipId === 'string' ? req.params.clipId.trim() : '';
  if (!clipId) return res.status(400).json({ ok: false, error: 'MISSING_CLIP_ID' });

  const mimeType = typeof req.body?.mimeType === 'string' ? req.body.mimeType.trim() : '';
  const sizeBytes = Number(req.body?.sizeBytes || 0);
  const dataBase64 = typeof req.body?.dataBase64 === 'string' ? req.body.dataBase64.trim() : '';
  if (!mimeType.startsWith('video/')) return res.status(400).json({ ok: false, error: 'INVALID_CLIP' });
  if (!Number.isFinite(sizeBytes) || sizeBytes < 1) return res.status(400).json({ ok: false, error: 'INVALID_CLIP_SIZE' });
  if (sizeBytes > MAX_CLIP_UPLOAD_BYTES) return res.status(413).json({ ok: false, error: 'CLIP_TOO_LARGE' });
  if (!dataBase64) return res.status(400).json({ ok: false, error: 'MISSING_DATA' });

  const store = readStore();
  const clip = findClipRecord(store, clipId);
  if (!clip) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  if (clip.ownerSessionId !== s.sessionId) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });

  if (clip.status === 'ready' || clip.status === 'processing') {
    return res.json({ ok: true, clipId: clip.clipId, status: clip.status });
  }

  const bytes = toBase64Bytes(dataBase64);
  if (!bytes || !bytes.length) return res.status(400).json({ ok: false, error: 'INVALID_CLIP' });
  if (bytes.length > MAX_CLIP_UPLOAD_BYTES) return res.status(413).json({ ok: false, error: 'CLIP_TOO_LARGE' });

  try {
    ensureMediaDir();
    fs.writeFileSync(clipSourcePath(clipId), bytes);
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'CLIP_WRITE_FAILED' });
  }

  clip.status = 'processing';
  clip.storage = {
    sourceUrl: clipPublicPath(`${clipId}.webm`),
    mp4Url: null
  };
  clip.updatedAt = nowIso();
  writeStore(store);
  scheduleClipFinalize(clipId);

  return res.json({ ok: true, clipId: clip.clipId, status: clip.status });
});

app.get('/api/clips/:clipId', (req, res) => {
  const clipId = typeof req.params?.clipId === 'string' ? req.params.clipId.trim() : '';
  if (!clipId) return res.status(400).json({ ok: false, error: 'MISSING_CLIP_ID' });
  const store = readStore();
  const clip = findClipRecord(store, clipId);
  if (!clip) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  return res.json({ ok: true, ...serializeClip(clip) });
});

app.get('/api/session', (req, res) => {
  const s = ensureHumanSession(req, res);
  const store = readStore();
  res.json({
    ok: true,
    teamCode: s.teamCode,
    elements: listElements(),
    stats: {
      signups: store.signups.length,
      publicTeams: store.publicTeams.length
    }
  });
});

app.get('/api/state', (req, res) => {
  const s = ensureHumanSession(req, res);
  const store = readStore();
  res.json({
    ok: true,
    teamCode: s.teamCode,
    elements: listElements(),
    agent: {
      connected: s.agent.connected,
      name: s.agent.name,
      selected: s.agent.selected,
      openPressed: s.agent.openPressed,
      optIn: s.agent.optIn,
      posts: s.agent.posts
    },
    human: {
      selected: s.human.selected,
      openPressed: s.human.openPressed,
      optIn: s.human.optIn,
      xPostUrl: s.human.xPostUrl
    },
    match: s.match,
    signup: s.signup,
    share: s.share,
    shareApproval: s.shareApproval || { human: false, agent: false },
    houseId: s.houseCeremony?.houseId || null,
    stats: {
      signups: store.signups.length,
      publicTeams: store.publicTeams.length
    }
  });
});

app.post('/api/referral', (req, res) => {
  const s = ensureHumanSession(req, res);
  const shareId = typeof req.body?.shareId === 'string' ? req.body.shareId.trim() : '';
  if (!shareId) return res.status(400).json({ ok: false, error: 'MISSING_SHARE_ID' });
  const store = readStore();
  const share = store.shares.find((x) => x.id === shareId);
  if (!share) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  s.referral.shareId = shareId;
  res.json({ ok: true });
});

app.post('/api/human/select', (req, res) => {
  const s = ensureHumanSession(req, res);
  const elementId = typeof req.body?.elementId === 'string' ? req.body.elementId.trim() : '';
  const allowed = new Set(listElements().map((e) => e.id));
  if (!allowed.has(elementId)) return res.status(400).json({ ok: false, error: 'INVALID_ELEMENT' });
  s.human.selected = elementId;
  evaluateMatch(s);
  res.json({ ok: true, match: s.match, humanSelected: s.human.selected });
});

app.post('/api/agent/session', (req, res) => {
  const agentName = normalizeAgentName(req.body?.agentName);
  const s = createSession({ flow: 'agent_solo' });
  s.agent.connected = true;
  s.agent.name = agentName || s.agent.name || 'OpenClaw';
  res.json({ ok: true, teamCode: s.teamCode, flow: s.flow });
});

app.post('/api/agent/connect', (req, res) => {
  const teamCode = typeof req.body?.teamCode === 'string' ? req.body.teamCode.trim() : '';
  const agentName = normalizeAgentName(req.body?.agentName);
  if (!teamCode) return res.status(400).json({ ok: false, error: 'MISSING_TEAM_CODE' });
  const s = getSessionByTeamCode(teamCode);
  if (!s) return res.status(404).json({ ok: false, error: 'TEAM_NOT_FOUND' });
  s.agent.connected = true;
  s.agent.name = agentName || s.agent.name || 'OpenClaw';
  s.shareApproval = s.shareApproval || { human: false, agent: false };
  s.shareApproval.agent = true;
  res.json({ ok: true });
});

app.post('/api/agent/house/connect', (req, res) => {
  const houseId = typeof req.body?.houseId === 'string' ? req.body.houseId.trim() : '';
  const agentName = normalizeAgentName(req.body?.agentName);
  if (!houseId) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
  const s = getSessionByHouseId(houseId);
  if (!s) return res.status(404).json({ ok: false, error: 'HOUSE_NOT_FOUND' });
  s.agent.connected = true;
  s.agent.name = agentName || s.agent.name || 'OpenClaw';
  s.shareApproval = s.shareApproval || { human: false, agent: false };
  s.shareApproval.agent = true;
  res.json({ ok: true, houseId });
});

app.get('/api/agent/state', (req, res) => {
  const teamCode = typeof req.query?.teamCode === 'string' ? req.query.teamCode.trim() : '';
  if (!teamCode) return res.status(400).json({ ok: false, error: 'MISSING_TEAM_CODE' });
  const s = getSessionByTeamCode(teamCode);
  if (!s) return res.status(404).json({ ok: false, error: 'TEAM_NOT_FOUND' });
  res.json({
    ok: true,
    flow: s.flow,
    agent: s.agent,
    human: {
      selected: s.human.selected,
      openPressed: s.human.openPressed,
      optIn: s.human.optIn,
      xPostUrl: s.human.xPostUrl
    },
    match: s.match,
    signup: s.signup,
    share: s.share,
    canvas: { w: s.canvas.w, h: s.canvas.h },
    houseId: s.houseCeremony?.houseId || null
  });
});

app.post('/api/agent/select', (req, res) => {
  const teamCode = typeof req.body?.teamCode === 'string' ? req.body.teamCode.trim() : '';
  const elementId = typeof req.body?.elementId === 'string' ? req.body.elementId.trim() : '';
  if (!teamCode) return res.status(400).json({ ok: false, error: 'MISSING_TEAM_CODE' });
  const s = getSessionByTeamCode(teamCode);
  if (!s) return res.status(404).json({ ok: false, error: 'TEAM_NOT_FOUND' });
  const allowed = new Set(listElements().map((e) => e.id));
  if (!allowed.has(elementId)) return res.status(400).json({ ok: false, error: 'INVALID_ELEMENT' });
  s.agent.selected = elementId;
  evaluateMatch(s);
  res.json({ ok: true, match: s.match, agentSelected: s.agent.selected });
});

function maybeCompleteOpen(session) {
  if (!session.match.matched) return { complete: false, reason: 'LOCKED' };
  if (!session.human.openPressed || !session.agent.openPressed) return { complete: false, reason: 'WAITING' };
  return recordSignup(session, {
    mode: 'agent',
    agentName: session.agent.name || null,
    matchedElement: session.match.elementId || null
  });
}

app.post('/api/human/open/press', (req, res) => {
  const s = ensureHumanSession(req, res);
  if (!s.match.matched) return res.status(403).json({ ok: false, error: 'LOCKED' });
  s.human.openPressed = true;

  const status = maybeCompleteOpen(s);
  res.json({ ok: true, status, nextUrl: status.complete ? '/create' : null });
});

app.post('/api/agent/open/press', (req, res) => {
  const teamCode = typeof req.body?.teamCode === 'string' ? req.body.teamCode.trim() : '';
  if (!teamCode) return res.status(400).json({ ok: false, error: 'MISSING_TEAM_CODE' });
  const s = getSessionByTeamCode(teamCode);
  if (!s) return res.status(404).json({ ok: false, error: 'TEAM_NOT_FOUND' });
  if (!s.match.matched) return res.status(403).json({ ok: false, error: 'LOCKED' });
  s.agent.openPressed = true;

  const status = maybeCompleteOpen(s);
  res.json({ ok: true, status, nextUrl: status.complete ? '/create' : null });
});

// Canvas state
app.get('/api/canvas/state', (req, res) => {
  const s = ensureHumanSession(req, res);
  res.json({ ok: true, canvas: s.canvas, palette: palette() });
});

function paint(session, x, y, color) {
  if (!Number.isInteger(x) || !Number.isInteger(y)) return { ok: false, error: 'INVALID_COORDS' };
  if (!Number.isInteger(color) || color < 0 || color >= palette().length) return { ok: false, error: 'INVALID_COLOR' };
  if (x < 0 || x >= CANVAS.w || y < 0 || y >= CANVAS.h) return { ok: false, error: 'OUT_OF_BOUNDS' };
  const idx = y * CANVAS.w + x;
  session.canvas.pixels[idx] = color;
  return { ok: true };
}

app.post('/api/human/canvas/paint', (req, res) => {
  const s = ensureHumanSession(req, res);
  const x = req.body?.x;
  const y = req.body?.y;
  const color = req.body?.color;
  const result = paint(s, x, y, color);
  if (!result.ok) return res.status(400).json(result);
  res.json({ ok: true });
});

app.post('/api/agent/canvas/paint', (req, res) => {
  const teamCode = typeof req.body?.teamCode === 'string' ? req.body.teamCode.trim() : '';
  if (!teamCode) return res.status(400).json({ ok: false, error: 'MISSING_TEAM_CODE' });
  const s = getSessionByTeamCode(teamCode);
  if (!s) return res.status(404).json({ ok: false, error: 'TEAM_NOT_FOUND' });
  const x = req.body?.x;
  const y = req.body?.y;
  const color = req.body?.color;
  const result = paint(s, x, y, color);
  if (!result.ok) return res.status(400).json(result);
  res.json({ ok: true });
});

app.get('/api/agent/canvas/image', (req, res) => {
  const teamCode = typeof req.query?.teamCode === 'string' ? req.query.teamCode.trim() : '';
  if (!teamCode) return res.status(400).json({ ok: false, error: 'MISSING_TEAM_CODE' });
  const s = getSessionByTeamCode(teamCode);
  if (!s) return res.status(404).json({ ok: false, error: 'TEAM_NOT_FOUND' });
  const image = canvasToPngDataUrl(s.canvas, palette());
  if (!image) return res.status(500).json({ ok: false, error: 'CANVAS_IMAGE_FAILED' });
  res.json({ ok: true, image, pixels: countInk(s.canvas.pixels) });
});

// --- House ceremony (agent + human) ---
app.get('/api/agent/house/state', (req, res) => {
  const teamCode = typeof req.query?.teamCode === 'string' ? req.query.teamCode.trim() : '';
  if (!teamCode) return res.status(400).json({ ok: false, error: 'MISSING_TEAM_CODE' });
  const s = getSessionByTeamCode(teamCode);
  if (!s) return res.status(404).json({ ok: false, error: 'TEAM_NOT_FOUND' });
  res.json({
    ok: true,
    teamCode: s.teamCode,
    ceremony: {
      humanCommit: !!s.houseCeremony?.humanCommit,
      agentCommit: !!s.houseCeremony?.agentCommit,
      humanReveal: !!s.houseCeremony?.humanReveal,
      agentReveal: !!s.houseCeremony?.agentReveal,
      houseId: s.houseCeremony?.houseId || null
    }
  });
});

app.post('/api/agent/house/commit', (req, res) => {
  const teamCode = typeof req.body?.teamCode === 'string' ? req.body.teamCode.trim() : '';
  const commit = typeof req.body?.commit === 'string' ? req.body.commit.trim() : '';
  if (!teamCode) return res.status(400).json({ ok: false, error: 'MISSING_TEAM_CODE' });
  if (!commit) return res.status(400).json({ ok: false, error: 'MISSING_COMMIT' });
  const s = getSessionByTeamCode(teamCode);
  if (!s) return res.status(404).json({ ok: false, error: 'TEAM_NOT_FOUND' });
  s.houseCeremony.agentCommit = commit;
  res.json({ ok: true });
});

app.post('/api/agent/house/reveal', (req, res) => {
  const teamCode = typeof req.body?.teamCode === 'string' ? req.body.teamCode.trim() : '';
  const reveal = typeof req.body?.reveal === 'string' ? req.body.reveal.trim() : '';
  if (!teamCode) return res.status(400).json({ ok: false, error: 'MISSING_TEAM_CODE' });
  if (!reveal) return res.status(400).json({ ok: false, error: 'MISSING_REVEAL' });
  const s = getSessionByTeamCode(teamCode);
  if (!s) return res.status(404).json({ ok: false, error: 'TEAM_NOT_FOUND' });

  // Verify reveal matches commit if present.
  const ra = b64ToBytes(reveal);
  const ch = bytesToB64(sha256Bytes(ra));
  if (s.houseCeremony.agentCommit && s.houseCeremony.agentCommit !== ch) {
    return res.status(400).json({ ok: false, error: 'COMMIT_MISMATCH' });
  }

  s.houseCeremony.agentReveal = reveal;

  if (s.flow === 'agent_solo') {
    // Solo flow: derive houseId from agent entropy only.
    const kroot = sha256Bytes(ra);
    const houseIdBytes = sha256Bytes(kroot);
    s.houseCeremony.houseId = base58Encode(houseIdBytes);
    s.houseCeremony.createdAt = s.houseCeremony.createdAt || nowIso();
    indexHouseId(s, s.houseCeremony.houseId);
  } else if (s.houseCeremony.humanReveal && s.houseCeremony.agentReveal) {
    // Co-op: derive houseId from Rh||Ra.
    const rh = b64ToBytes(s.houseCeremony.humanReveal);
    const combo = new Uint8Array(rh.length + ra.length);
    combo.set(rh, 0);
    combo.set(ra, rh.length);
    const kroot = sha256Bytes(combo);
    const houseIdBytes = sha256Bytes(kroot);
    s.houseCeremony.houseId = base58Encode(houseIdBytes);
    s.houseCeremony.createdAt = s.houseCeremony.createdAt || nowIso();
    indexHouseId(s, s.houseCeremony.houseId);
  }

  res.json({ ok: true, houseId: s.houseCeremony.houseId || null });
});

app.post('/api/human/house/commit', (req, res) => {
  const s = ensureHumanSession(req, res);
  const commit = typeof req.body?.commit === 'string' ? req.body.commit.trim() : '';
  if (!commit) return res.status(400).json({ ok: false, error: 'MISSING_COMMIT' });
  s.houseCeremony.humanCommit = commit;
  res.json({ ok: true });
});

app.post('/api/human/house/reveal', (req, res) => {
  const s = ensureHumanSession(req, res);
  const reveal = typeof req.body?.reveal === 'string' ? req.body.reveal.trim() : '';
  if (!reveal) return res.status(400).json({ ok: false, error: 'MISSING_REVEAL' });

  const rh = b64ToBytes(reveal);
  const ch = bytesToB64(sha256Bytes(rh));
  if (s.houseCeremony.humanCommit && s.houseCeremony.humanCommit !== ch) {
    return res.status(400).json({ ok: false, error: 'COMMIT_MISMATCH' });
  }

  s.houseCeremony.humanReveal = reveal;

  // If both reveals exist, compute houseId.
  if (s.houseCeremony.humanReveal && s.houseCeremony.agentReveal) {
    const ra = b64ToBytes(s.houseCeremony.agentReveal);
    const combo = new Uint8Array(rh.length + ra.length);
    combo.set(rh, 0);
    combo.set(ra, rh.length);
    const kroot = sha256Bytes(combo);
    const houseIdBytes = sha256Bytes(kroot);
    s.houseCeremony.houseId = base58Encode(houseIdBytes);
    s.houseCeremony.createdAt = s.houseCeremony.createdAt || nowIso();
    indexHouseId(s, s.houseCeremony.houseId);
  }

  res.json({ ok: true, houseId: s.houseCeremony.houseId || null });
});

app.get('/api/human/house/state', (req, res) => {
  const s = ensureHumanSession(req, res);
  res.json({
    ok: true,
    ceremony: {
      humanCommit: !!s.houseCeremony?.humanCommit,
      agentCommit: !!s.houseCeremony?.agentCommit,
      humanReveal: !!s.houseCeremony?.humanReveal,
      agentReveal: !!s.houseCeremony?.agentReveal,
      houseId: s.houseCeremony?.houseId || null
    }
  });
});

app.get('/api/human/house/material', (req, res) => {
  const s = ensureHumanSession(req, res);
  res.json({
    ok: true,
    houseId: s.houseCeremony?.houseId || null,
    humanReveal: s.houseCeremony?.humanReveal || null,
    agentReveal: s.houseCeremony?.agentReveal || null
  });
});

app.get('/api/agent/house/material', (req, res) => {
  const teamCode = typeof req.query?.teamCode === 'string' ? req.query.teamCode.trim() : '';
  if (!teamCode) return res.status(400).json({ ok: false, error: 'MISSING_TEAM_CODE' });
  const s = getSessionByTeamCode(teamCode);
  if (!s) return res.status(404).json({ ok: false, error: 'TEAM_NOT_FOUND' });
  res.json({ ok: true, houseId: s.houseCeremony?.houseId || null, humanReveal: s.houseCeremony?.humanReveal || null });
});

// Share creation + retrieval
app.post('/api/share/create', (req, res) => {
  const s = ensureHumanSession(req, res);
  const tokenMode = s.signup?.mode === 'token';
  const tokenVerifiedAt = s.token?.verifiedAt || null;
  const tokenVerifiedAddress = s.token?.address || null;
  s.shareApproval = s.shareApproval || { human: false, agent: false };
  s.shareApproval.human = true;
  if (tokenMode) {
    s.shareApproval.agent = true;
    if (!s.agent.name) s.agent.name = '$ELIZATOWN';
  }
  if (!s.houseCeremony?.houseId) return res.status(403).json({ ok: false, error: 'HOUSE_NOT_READY' });
  if (!tokenMode) {
    if (!s.houseCeremony?.humanReveal || !s.houseCeremony?.agentReveal) {
      return res.status(403).json({ ok: false, error: 'CEREMONY_INCOMPLETE' });
    }
    if (!s.agent?.connected) return res.status(403).json({ ok: false, error: 'AGENT_REQUIRED' });
  } else {
    const now = Date.now();
    if (!tokenVerifiedAt || now - tokenVerifiedAt > TOKEN_VERIFY_TTL_MS) {
      return res.status(403).json({ ok: false, error: 'TOKEN_CHECK_REQUIRED' });
    }
    if (s.signup?.address && tokenVerifiedAddress && s.signup.address !== tokenVerifiedAddress) {
      return res.status(403).json({ ok: false, error: 'TOKEN_ADDRESS_MISMATCH' });
    }
  }
  if (!canvasHasInk(s.canvas.pixels)) {
    return res.status(403).json({ ok: false, error: 'EMPTY_CANVAS' });
  }

  const store = readStore();
  if (store.shares.length >= MAX_SHARES) {
    return res.status(403).json({ ok: false, error: 'STORE_FULL' });
  }
  const shareId = `sh_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const record = {
    id: shareId,
    createdAt: nowIso(),
    matchedElement: tokenMode ? null : s.match.elementId,
    agentName: tokenMode ? (s.agent.name || '$ELIZATOWN') : s.agent.name,
    mode: tokenMode ? 'token' : 'agent',
    houseId: s.houseCeremony?.houseId || null,
    // These are optionally added later:
    xPostUrl: s.human.xPostUrl,
    humanHandle: s.human.xHandle || null,
    agentPosts: {
      moltbookUrl: s.agent.posts?.moltbookUrl || null
    },
    referrals: 0,
    locked: true,
    lockedAt: nowIso(),
    optIn: { human: null, agent: null },
    public: false
  };

  store.shares.push(record);

  // Pony Express v0: Mayor welcome message on house registration.
  const mayorBody = [
    `Welcome, House ${shareId}.`,
    `I’m the Mayor of Agent Town. You just claimed your address on these streets.`,
    ``,
    `Two ways to live here:`,
    `1) Co‑op: move in with a human + an agent.`,
    `2) Solo: a house that stands on its own.`,
    ``,
    `Your first task: leave a sealed note at another house — introduce yourself in one sentence.`,
    ``,
    `— The Mayor`
  ].join('\n');

  store.inbox.push(
    makeInboxMsg({ toHouseId: shareId, fromHouseId: MAYOR_HOUSE_ID, body: mayorBody, status: 'accepted' })
  );

  writeStore(store);

  s.share.id = shareId;
  s.share.createdAt = record.createdAt;
  s.human.optIn = true;
  s.agent.optIn = true;
  maybeAddToLeaderboard(s);

  res.json({
    ok: true,
    shareId,
    sharePath: `/s/${shareId}`
  });
});

// --- Pony Express v0 API ---
app.post('/api/pony/send', (req, res) => {
  const toHouseId = typeof req.body?.toHouseId === 'string' ? req.body.toHouseId.trim() : '';
  const fromHouseId = typeof req.body?.fromHouseId === 'string' ? req.body.fromHouseId.trim() : null;
  const body = typeof req.body?.body === 'string' ? req.body.body : '';

  if (!toHouseId) return res.status(400).json({ ok: false, error: 'MISSING_TO' });

  const store = readStore();
  const exists = store.shares.some((s) => s.id === toHouseId);
  if (!exists) return res.status(404).json({ ok: false, error: 'HOUSE_NOT_FOUND' });

  const status = fromHouseId === MAYOR_HOUSE_ID ? 'accepted' : 'request';
  const msg = makeInboxMsg({ toHouseId, fromHouseId, body, status });
  store.inbox.push(msg);
  writeStore(store);

  res.json({ ok: true, id: msg.id });
});

app.get('/api/pony/inbox', (req, res) => {
  const houseId = typeof req.query?.houseId === 'string' ? req.query.houseId.trim() : '';
  if (!houseId) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE' });

  const store = readStore();
  const items = store.inbox
    .filter((m) => m.toHouseId === houseId)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

  res.json({ ok: true, inbox: items });
});

app.post('/api/pony/inbox/:id/accept', (req, res) => {
  const id = req.params.id;
  const store = readStore();
  const msg = store.inbox.find((m) => m.id === id);
  if (!msg) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  msg.status = 'accepted';
  writeStore(store);
  res.json({ ok: true });
});

app.post('/api/pony/inbox/:id/reject', (req, res) => {
  const id = req.params.id;
  const store = readStore();
  const msg = store.inbox.find((m) => m.id === id);
  if (!msg) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  msg.status = 'rejected';
  writeStore(store);
  res.json({ ok: true });
});

app.get('/api/share/:id', (req, res) => {
  const id = req.params.id;
  const store = readStore();
  const rec = store.shares.find((x) => x.id === id);
  if (!rec) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  const { teamCode, houseId, ...rest } = rec;
  if (rest.agentPosts) {
    rest.agentPosts = { moltbookUrl: rest.agentPosts.moltbookUrl || null };
  }
  const house = houseId ? store.houses.find((h) => h.id === houseId) : null;
  const publicMedia = house ? serializePublicMedia(house) : null;
  rest.publicMedia = publicMedia;
  res.json({ ok: true, share: rest });
});

app.get('/api/share/by-house/:houseId', (req, res) => {
  const houseId = req.params.houseId;
  if (!houseId) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
  const store = readStore();
  const rec = store.shares.find((x) => x.houseId === houseId);
  if (!rec) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  res.json({ ok: true, shareId: rec.id, sharePath: `/s/${rec.id}` });
});

app.post('/api/house/:id/share', (req, res) => {
  const houseId = typeof req.params?.id === 'string' ? req.params.id.trim() : '';
  if (!houseId) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
  const store = readStore();
  const house = store.houses.find((r) => r.id === houseId);
  if (!house) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  const auth = verifyHouseAuth(req, house);
  if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });

  let share = store.shares.find((x) => x.houseId === houseId);
  const session = getSessionByHouseId(houseId);

  if (!share) {
    if (store.shares.length >= MAX_SHARES) {
      return res.status(403).json({ ok: false, error: 'STORE_FULL' });
    }
    const shareId = `sh_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    share = {
      id: shareId,
      createdAt: nowIso(),
      matchedElement: session?.match?.elementId || null,
      agentName: session?.agent?.name || 'OpenClaw',
      mode: session?.flow === 'agent_solo' ? 'agent_solo' : 'agent',
      houseId,
      xPostUrl: session?.human?.xPostUrl || null,
      humanHandle: session?.human?.xHandle || null,
      agentPosts: {
        moltbookUrl: session?.agent?.posts?.moltbookUrl || null
      },
      referrals: 0,
      locked: true,
      lockedAt: nowIso(),
      optIn: { human: true, agent: true },
      public: false
    };

    store.shares.push(share);
  }

  ensurePublicTeamForShare(store, share, session);
  writeStore(store);

  if (session) {
    session.share.id = share.id;
    session.share.createdAt = share.createdAt;
    session.human.optIn = true;
    session.agent.optIn = true;
  }

  res.json({ ok: true, shareId: share.id, sharePath: `/s/${share.id}` });
});

app.post('/api/house/:id/posts', (req, res) => {
  const houseId = typeof req.params?.id === 'string' ? req.params.id.trim() : '';
  if (!houseId) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
  const store = readStore();
  const house = store.houses.find((r) => r.id === houseId);
  if (!house) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  const auth = verifyHouseAuth(req, house);
  if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });

  const rawX = typeof req.body?.xPostUrl === 'string' ? req.body.xPostUrl.trim() : '';
  const rawM = typeof req.body?.moltbookUrl === 'string' ? req.body.moltbookUrl.trim() : '';
  const xPostUrl = rawX ? sanitizeUrl(rawX) : null;
  const moltbookUrl = rawM ? sanitizeUrl(rawM) : null;
  if (rawX && !xPostUrl) return res.status(400).json({ ok: false, error: 'INVALID_URL' });
  if (rawM && !moltbookUrl) return res.status(400).json({ ok: false, error: 'INVALID_URL' });

  const share = store.shares.find((x) => x.houseId === houseId);
  if (!share) return res.status(404).json({ ok: false, error: 'SHARE_NOT_FOUND' });

  share.xPostUrl = xPostUrl;
  share.humanHandle = extractXHandle(xPostUrl) || null;
  share.agentPosts = share.agentPosts || {};
  share.agentPosts.moltbookUrl = moltbookUrl;

  const pub = store.publicTeams.find((p) => p.shareId === share.id);
  if (pub) {
    pub.xPostUrl = xPostUrl;
    pub.humanHandle = share.humanHandle;
    pub.agentPosts = pub.agentPosts || {};
    pub.agentPosts.moltbookUrl = moltbookUrl;
  }

  const session = getSessionByHouseId(houseId);
  if (session) {
    session.human.xPostUrl = xPostUrl;
    session.human.xHandle = share.humanHandle;
    session.agent.posts.moltbookUrl = moltbookUrl;
  }

  writeStore(store);
  res.json({ ok: true, shareId: share.id, sharePath: `/s/${share.id}` });
});

app.get('/api/agent/share/instructions', (req, res) => {
  const teamCode = typeof req.query?.teamCode === 'string' ? req.query.teamCode.trim() : '';
  if (!teamCode) return res.status(400).json({ ok: false, error: 'MISSING_TEAM_CODE' });
  const s = getSessionByTeamCode(teamCode);
  if (!s || !s.share.id) return res.status(404).json({ ok: false, error: 'SHARE_NOT_READY' });

  const sharePath = `/s/${s.share.id}`;
  // We don't know the public hostname; agent should use the same base URL as configured.
  const agentText = `We just unlocked Agent Town together (human + agent co-op).\n\nShare: {BASE_URL}${sharePath}`;
  const humanText = `I teamed up with my OpenClaw agent and unlocked Agent Town.\n\n{BASE_URL}${sharePath}`;

  res.json({ ok: true, shareId: s.share.id, sharePath, agentPostText: agentText, humanPostText: humanText });
});

// Posts
app.post('/api/human/posts', (req, res) => {
  const s = ensureHumanSession(req, res);
  const raw = typeof req.body?.xPostUrl === 'string' ? req.body.xPostUrl.trim() : '';
  const shareIdRaw = typeof req.body?.shareId === 'string' ? req.body.shareId.trim() : '';
  const xPostUrl = raw ? sanitizeUrl(raw) : null;
  if (raw && !xPostUrl) return res.status(400).json({ ok: false, error: 'INVALID_URL' });

  s.human.xPostUrl = xPostUrl;
  s.human.xHandle = extractXHandle(xPostUrl) || null;

  const targetShareId = s.share.id || shareIdRaw || null;
  if (targetShareId) {
    const store = readStore();
    const rec = store.shares.find((x) => x.id === targetShareId);
    if (!rec) return res.status(404).json({ ok: false, error: 'SHARE_NOT_FOUND' });
    rec.xPostUrl = xPostUrl;
    rec.humanHandle = s.human.xHandle || null;
    const pub = store.publicTeams.find((p) => p.shareId === targetShareId);
    if (pub) {
      pub.xPostUrl = xPostUrl;
      pub.humanHandle = s.human.xHandle || null;
    }
    writeStore(store);
  }

  res.json({ ok: true });
});

app.post('/api/agent/posts', (req, res) => {
  const teamCode = typeof req.body?.teamCode === 'string' ? req.body.teamCode.trim() : '';
  if (!teamCode) return res.status(400).json({ ok: false, error: 'MISSING_TEAM_CODE' });
  const s = getSessionByTeamCode(teamCode);
  if (!s) return res.status(404).json({ ok: false, error: 'TEAM_NOT_FOUND' });

  const moltbookUrl = sanitizeUrl(req.body?.moltbookUrl);
  // Guardrail: avoid polluting leaderboard/publicTeams with obviously-bad URLs.
  // (The Moltbook API can rate-limit post creation; callers should not send placeholder/null URLs.)
  if (!moltbookUrl || /moltbook\.comnull\/?$/i.test(moltbookUrl)) {
    return res.status(400).json({ ok: false, error: 'INVALID_URL' });
  }

  s.agent.posts.moltbookUrl = moltbookUrl;

  if (s.share.id) {
    const store = readStore();
    const rec = store.shares.find((x) => x.id === s.share.id);
    if (rec) {
      rec.agentPosts = { moltbookUrl };
      const pub = store.publicTeams.find((p) => p.shareId === s.share.id);
      if (pub) {
        pub.agentPosts = { moltbookUrl };
      }
      writeStore(store);
    }
  }
  res.json({ ok: true });
});

// Leaderboard helper: list team when share exists.
function maybeAddToLeaderboard(session) {
  if (!session.share.id) return { ok: false, error: 'SHARE_NOT_READY' };
  if (session.human.optIn !== true || session.agent.optIn !== true) return { ok: false, error: 'WAITING' };

  const store = readStore();
  if (store.publicTeams.length >= MAX_PUBLIC_TEAMS) {
    return { ok: false, error: 'STORE_FULL' };
  }

  const already = store.publicTeams.find((p) => p.shareId === session.share.id);
  if (already) return { ok: true, already: true };

  const share = store.shares.find((x) => x.id === session.share.id);
  if (!share) return { ok: false, error: 'SHARE_NOT_FOUND' };

  const humanHandle = share.humanHandle || extractXHandle(share.xPostUrl);
  const record = {
    id: `p_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    createdAt: nowIso(),
    shareId: session.share.id,
    sharePath: `/s/${session.share.id}`,
    houseId: session.houseCeremony?.houseId || null,
    matchedElement: session.match.elementId,
    agentName: session.agent.name,
    xPostUrl: share.xPostUrl,
    humanHandle,
    agentPosts: share.agentPosts
  };

  store.publicTeams.unshift(record);
  share.public = true;
  share.optIn = { human: true, agent: true };

  writeStore(store);
  return { ok: true, already: false };
}

function ensurePublicTeamForShare(store, share, session = null) {
  if (!share || !share.id) return false;
  const exists = store.publicTeams.find((p) => p.shareId === share.id);
  if (exists) return true;

  const humanHandle = share.humanHandle || extractXHandle(share.xPostUrl);
  const record = {
    id: `p_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    createdAt: nowIso(),
    shareId: share.id,
    sharePath: `/s/${share.id}`,
    houseId: share.houseId || session?.houseCeremony?.houseId || null,
    matchedElement: session?.match?.elementId || share.matchedElement || null,
    agentName: share.agentName || session?.agent?.name || 'OpenClaw',
    xPostUrl: share.xPostUrl || null,
    humanHandle,
    agentPosts: share.agentPosts ? { moltbookUrl: share.agentPosts.moltbookUrl || null } : null
  };

  store.publicTeams.unshift(record);
  share.public = true;
  share.optIn = { human: true, agent: true };
  return true;
}

function buildLeaderboard(store) {
  const referralsByShare = new Map(
    store.shares.map((s) => [s.id, typeof s.referrals === 'number' ? s.referrals : 0])
  );
  const sharesById = new Map(store.shares.map((s) => [s.id, s]));
  const housesById = new Map(store.houses.map((h) => [h.id, h]));
  const teams = store.publicTeams.map((p) => {
    const share = sharesById.get(p.shareId);
    const { houseId: storedHouseId, ...rest } = p;
    const houseId = storedHouseId || share?.houseId || null;
    const house = houseId ? housesById.get(houseId) : null;
    return {
      ...rest,
      humanHandle: p.humanHandle || extractXHandle(p.xPostUrl),
      referrals: referralsByShare.get(p.shareId) || 0,
      agentPosts: p.agentPosts ? { moltbookUrl: p.agentPosts.moltbookUrl || null } : null,
      publicMedia: house ? serializePublicMedia(house) : null
    };
  });
  teams.sort((a, b) => (b.referrals || 0) - (a.referrals || 0));
  const referralsTotal = teams.reduce((sum, t) => sum + (t.referrals || 0), 0);
  return { teams, referralsTotal };
}

app.get('/api/leaderboard', (_req, res) => {
  const store = readStore();
  const { teams, referralsTotal } = buildLeaderboard(store);
  res.json({ ok: true, signups: store.signups.length, referralsTotal, teams });
});

app.get('/api/wall', (_req, res) => {
  const store = readStore();
  const { teams, referralsTotal } = buildLeaderboard(store);
  res.json({ ok: true, signups: store.signups.length, referralsTotal, teams });
});

// --- Anchors (ERC-8004 routing directory) ---
const { verifyMessage } = require('ethers');

function makeAnchorNonce() {
  return `an_${randomHex(16)}`;
}

function buildAnchorLinkMessage({ houseId, erc8004Id, origin, nonce, createdAtMs }) {
  return [
    'AgentTown Anchor Link',
    `houseId: ${houseId}`,
    `erc8004Id: ${erc8004Id}`,
    `origin: ${origin}`,
    `nonce: ${nonce}`,
    `createdAtMs: ${createdAtMs}`
  ].join('\n');
}

app.get('/api/anchors/nonce', (req, res) => {
  const s = ensureHumanSession(req, res);
  const nonce = makeAnchorNonce();
  s.anchorPublishNonce = nonce;
  res.json({ ok: true, nonce });
});

app.post('/api/anchors/register', (req, res) => {
  const s = ensureHumanSession(req, res);
  const houseId = typeof req.body?.houseId === 'string' ? req.body.houseId.trim() : '';
  const erc8004Id = typeof req.body?.erc8004Id === 'string' ? req.body.erc8004Id.trim() : '';
  const signer = typeof req.body?.signer === 'string' ? req.body.signer.trim() : '';
  const signature = typeof req.body?.signature === 'string' ? req.body.signature.trim() : '';
  const origin = typeof req.body?.origin === 'string' ? req.body.origin.trim() : '';
  const nonce = typeof req.body?.nonce === 'string' ? req.body.nonce.trim() : '';
  const createdAtMs = Number(req.body?.createdAtMs || 0);
  const chainId = Number(req.body?.chainId || 0);

  if (!houseId) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
  if (!erc8004Id) return res.status(400).json({ ok: false, error: 'MISSING_ERC8004_ID' });
  if (!signer) return res.status(400).json({ ok: false, error: 'MISSING_SIGNER' });
  if (!signature) return res.status(400).json({ ok: false, error: 'MISSING_SIGNATURE' });
  if (!nonce) return res.status(400).json({ ok: false, error: 'MISSING_NONCE' });
  if (!createdAtMs) return res.status(400).json({ ok: false, error: 'MISSING_TIMESTAMP' });

  if (!s.anchorPublishNonce || nonce !== s.anchorPublishNonce) {
    return res.status(400).json({ ok: false, error: 'NONCE_MISMATCH' });
  }

  const expectedOrigin = `${req.protocol}://${req.get('host')}`;
  // Require message origin to match server origin (prevents signing for a different site).
  if (origin && origin !== expectedOrigin) {
    return res.status(400).json({ ok: false, error: 'ORIGIN_MISMATCH' });
  }

  const msg = buildAnchorLinkMessage({
    houseId,
    erc8004Id,
    origin: expectedOrigin,
    nonce,
    createdAtMs
  });

  let recovered = '';
  try {
    recovered = verifyMessage(msg, signature) || '';
  } catch {
    return res.status(401).json({ ok: false, error: 'BAD_SIGNATURE' });
  }

  if (recovered.toLowerCase() !== signer.toLowerCase()) {
    return res.status(401).json({ ok: false, error: 'SIGNER_MISMATCH' });
  }

  // Consume nonce
  s.anchorPublishNonce = null;

  const store = readStore();
  const houseExists = store.houses.find((h) => h && h.id === houseId);
  if (!houseExists) return res.status(404).json({ ok: false, error: 'HOUSE_NOT_FOUND' });

  // Upsert by erc8004Id (latest wins)
  store.anchors = Array.isArray(store.anchors) ? store.anchors : [];
  store.anchors = store.anchors.filter((a) => a && a.erc8004Id !== erc8004Id);
  store.anchors.unshift({
    erc8004Id,
    houseId,
    signer,
    chainId: chainId || null,
    createdAtMs,
    updatedAt: nowIso()
  });

  writeStore(store);
  res.json({ ok: true });
});

app.get('/api/anchors/resolve', (req, res) => {
  const erc8004Id = typeof req.query?.erc8004Id === 'string' ? req.query.erc8004Id.trim() : '';
  if (!erc8004Id) return res.status(400).json({ ok: false, error: 'MISSING_ERC8004_ID' });
  const store = readStore();
  const rec = (store.anchors || []).find((a) => a && a.erc8004Id === erc8004Id);
  if (!rec) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  res.json({ ok: true, erc8004Id, houseId: rec.houseId });
});

// --- Test-only reset endpoint ---
if (process.env.NODE_ENV === 'test') {
  app.post('/__test__/reset', async (_req, res) => {
    const token = process.env.TEST_RESET_TOKEN;
    if (!token) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const header = _req.header('x-test-reset');
    if (header !== token) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    writeStore({ signups: [], shares: [], publicTeams: [], houses: [], anchors: [], inbox: [], clips: [] });
    resetAllSessions();
    resetWorldState();
    if (worldInstanceManager) await worldInstanceManager.reset();
    res.json({ ok: true });
  });

  app.post('/__test__/world/upsert', (req, res) => {
    const instance = typeof req.body?.instance === 'string' ? req.body.instance.trim() : 'public';
    const house = req.body?.house || null;
    const inhabitants = Array.isArray(req.body?.inhabitants) ? req.body.inhabitants : [];
    const houseId = typeof house?.houseId === 'string' ? house.houseId.trim() : '';
    if (!houseId) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
    const ok = upsertTestWorldEntry({ instance, house, inhabitants });
    if (!ok) return res.status(400).json({ ok: false, error: 'INVALID_INSTANCE' });
    return res.json({ ok: true });
  });

  app.post('/__test__/world/policy', (req, res) => {
    const token = process.env.TEST_RESET_TOKEN;
    if (!token) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const header = req.header('x-test-reset');
    if (header !== token) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    if (!worldInstanceManager) return res.status(503).json({ ok: false, error: 'REALTIME_UNAVAILABLE' });
    const policy = worldInstanceManager.setPolicy(req.body || {});
    return res.json({ ok: true, policy });
  });

  app.post('/__test__/world/session-house', (req, res) => {
    const token = process.env.TEST_RESET_TOKEN;
    if (!token) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const header = req.header('x-test-reset');
    if (header !== token) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });

    const houseId = typeof req.body?.houseId === 'string' ? req.body.houseId.trim() : '';
    if (!houseId) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });

    const s = ensureHumanSession(req, res);
    s.houseCeremony.houseId = houseId;
    s.houseCeremony.createdAt = s.houseCeremony.createdAt || nowIso();
    indexHouseId(s, houseId);

    const store = readStore();
    if (!store.houses.find((h) => h.id === houseId)) {
      store.houses.push({
        id: houseId,
        housePubKey: houseId,
        createdAt: nowIso(),
        nonce: `n_test_${randomHex(8)}`,
        keyMode: 'ceremony',
        unlock: null,
        keyWrap: null,
        authKey: TEST_HOUSE_AUTH_KEY,
        entries: []
      });
      writeStore(store);
    }
    return res.json({ ok: true, houseId });
  });
}

// --- Houses (Phase 1 MVP) ---
function makeNonce() {
  return `n_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

app.get('/api/house/nonce', (_req, res) => {
  res.json({ ok: true, nonce: makeNonce() });
});

app.get('/api/wallet/nonce', (req, res) => {
  const s = ensureHumanSession(req, res);
  const nonce = `wn_${randomHex(16)}`;
  s.walletLookupNonce = nonce;
  res.json({ ok: true, nonce });
});

app.post('/api/wallet/lookup', (req, res) => {
  const s = ensureHumanSession(req, res);
  const address = typeof req.body?.address === 'string' ? req.body.address.trim() : '';
  const signature = typeof req.body?.signature === 'string' ? req.body.signature.trim() : '';
  const nonce = typeof req.body?.nonce === 'string' ? req.body.nonce.trim() : '';
  const houseId = typeof req.body?.houseId === 'string' ? req.body.houseId.trim() : '';
  if (!address) return res.status(400).json({ ok: false, error: 'MISSING_ADDRESS' });
  if (!signature) return res.status(400).json({ ok: false, error: 'MISSING_SIGNATURE' });
  const usingNonce = !!nonce;
  if (usingNonce) {
    if (nonce !== s.walletLookupNonce) return res.status(400).json({ ok: false, error: 'NONCE_MISMATCH' });
    const msg = buildWalletLookupMessage({ address, nonce, houseId: houseId || null });
    if (!isTestMockAddress(address) && !verifySolanaSignature(address, msg, signature)) {
      return res.status(401).json({ ok: false, error: 'BAD_SIGNATURE' });
    }
    s.walletLookupNonce = null;
  } else {
    if (!houseId) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
    const msg = buildHouseKeyWrapMessage({ houseId });
    if (!isTestMockAddress(address) && !verifySolanaSignature(address, msg, signature)) {
      return res.status(401).json({ ok: false, error: 'BAD_SIGNATURE' });
    }
  }

  const store = readStore();
  let matches = store.houses.filter(
    (r) => r && r.unlock && r.unlock.kind === 'solana-wallet-signature' && r.unlock.address === address
  );
  if (houseId) {
    matches = matches.filter((r) => r.id === houseId);
    if (!matches.length) return res.status(404).json({ ok: false, error: 'HOUSE_NOT_FOUND' });
  }
  if (!matches.length) return res.json({ ok: true, houseId: null, keyWrap: null });
  matches.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
  const house = matches[matches.length - 1];
  if (house?.id) {
    s.houseCeremony.houseId = house.id;
    s.houseCeremony.createdAt = s.houseCeremony.createdAt || house.createdAt || nowIso();
    indexHouseId(s, house.id);
  }
  res.json({
    ok: true,
    houseId: house.id,
    keyWrap: house.keyWrap || null
  });
});

app.get('/api/token/nonce', (req, res) => {
  const s = ensureHumanSession(req, res);
  const nonce = `tn_${randomHex(16)}`;
  s.tokenLookupNonce = nonce;
  res.json({ ok: true, nonce });
});

app.post('/api/token/verify', async (req, res) => {
  const s = ensureHumanSession(req, res);
  const address = typeof req.body?.address === 'string' ? req.body.address.trim() : '';
  const signature = typeof req.body?.signature === 'string' ? req.body.signature.trim() : '';
  const nonce = typeof req.body?.nonce === 'string' ? req.body.nonce.trim() : '';
  if (!address) return res.status(400).json({ ok: false, error: 'MISSING_ADDRESS' });
  if (!signature) return res.status(400).json({ ok: false, error: 'MISSING_SIGNATURE' });
  if (!nonce) return res.status(400).json({ ok: false, error: 'MISSING_NONCE' });
  if (nonce !== s.tokenLookupNonce) return res.status(400).json({ ok: false, error: 'NONCE_MISMATCH' });

  const msg = buildTokenCheckMessage({ address, nonce, ca: ELIZATOWN_MINT });
  const testAddr = process.env.TEST_TOKEN_ADDRESS || 'So1anaMockToken1111111111111111111111111111';
  const skipSig = process.env.NODE_ENV === 'test' && address === testAddr;
  if (!skipSig && !verifySolanaSignature(address, msg, signature)) {
    return res.status(401).json({ ok: false, error: 'BAD_SIGNATURE' });
  }
  s.tokenLookupNonce = null;

  if (s.signup.complete && s.signup.mode === 'token' && s.signup.address && s.signup.address !== address) {
    return res.status(409).json({ ok: false, error: 'ADDRESS_MISMATCH' });
  }
  if (s.signup.complete && s.signup.mode && s.signup.mode !== 'token') {
    return res.status(409).json({ ok: false, error: 'ALREADY_SIGNED_UP' });
  }

  let eligible = false;
  try {
    eligible = await hasElizaTownToken(address);
  } catch (e) {
    console.warn('token verify failed', e);
    return res.status(503).json({ ok: false, error: 'RPC_UNAVAILABLE' });
  }
  if (!eligible) return res.json({ ok: true, eligible: false });

  const status = recordSignup(s, { mode: 'token', address });
  if (!status.complete) return res.status(403).json({ ok: false, error: status.reason || 'STORE_FULL' });
  if (!s.signup.address) s.signup.address = address;
  s.token = s.token || { verifiedAt: null, address: null };
  s.token.verifiedAt = Date.now();
  s.token.address = address;

  res.json({ ok: true, eligible: true, status });
});

app.post('/api/house/init', (req, res) => {
  const s = ensureHumanSession(req, res);
  const houseId = typeof req.body?.houseId === 'string' ? req.body.houseId.trim() : '';
  const housePubKey = typeof req.body?.housePubKey === 'string' ? req.body.housePubKey.trim() : '';
  const nonce = typeof req.body?.nonce === 'string' ? req.body.nonce.trim() : '';
  const keyMode = typeof req.body?.keyMode === 'string' ? req.body.keyMode.trim() : 'ceremony';
  const unlock = req.body?.unlock || null;
  const keyWrap = req.body?.keyWrap || null;
  const houseAuthKey = typeof req.body?.houseAuthKey === 'string' ? req.body.houseAuthKey.trim() : '';

  if (!houseId || !housePubKey) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
  if (houseId !== housePubKey) return res.status(400).json({ ok: false, error: 'HOUSE_ID_MISMATCH' });
  if (!nonce) return res.status(400).json({ ok: false, error: 'MISSING_NONCE' });
  if (!houseAuthKey) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_AUTH' });
  const authKeyBytes = decodeB64(houseAuthKey);
  if (!authKeyBytes || authKeyBytes.length < 16) {
    return res.status(400).json({ ok: false, error: 'INVALID_HOUSE_AUTH' });
  }
  if (s.houseCeremony?.houseId && s.houseCeremony.houseId !== houseId) {
    return res.status(409).json({ ok: false, error: 'HOUSE_ALREADY_EXISTS' });
  }

  // Converged for today's publish: ceremony-only houses.
  if (keyMode !== 'ceremony') {
    return res.status(400).json({ ok: false, error: 'CEREMONY_ONLY' });
  }

  let normalizedKeyWrap = null;
  if (keyWrap && typeof keyWrap === 'object') {
    const alg = typeof keyWrap.alg === 'string' ? keyWrap.alg.trim() : '';
    const iv = typeof keyWrap.iv === 'string' ? keyWrap.iv.trim() : '';
    const ct = typeof keyWrap.ct === 'string' ? keyWrap.ct.trim() : '';
    if (alg && iv && ct) {
      if (alg !== 'AES-GCM') {
        return res.status(400).json({ ok: false, error: 'INVALID_KEY_WRAP' });
      }
      normalizedKeyWrap = { alg, iv, ct };
    }
  }

  const store = readStore();
  if (store.houses.length >= MAX_HOUSES) {
    return res.status(403).json({ ok: false, error: 'STORE_FULL' });
  }
  const exists = store.houses.find((r) => r.id === houseId);
  if (exists) return res.status(409).json({ ok: false, error: 'HOUSE_EXISTS' });

  store.houses.push({
    id: houseId,
    housePubKey,
    createdAt: nowIso(),
    nonce,
    keyMode: 'ceremony',
    unlock,
    keyWrap: normalizedKeyWrap,
    authKey: houseAuthKey,
    entries: []
  });
  writeStore(store);

  if (s && s.houseCeremony) {
    s.houseCeremony.houseId = houseId;
    s.houseCeremony.createdAt = s.houseCeremony.createdAt || nowIso();
    indexHouseId(s, houseId);
  }

  res.json({ ok: true, houseId });
});

app.post('/api/agent/house/init', (req, res) => {
  const teamCode = typeof req.body?.teamCode === 'string' ? req.body.teamCode.trim() : '';
  const houseId = typeof req.body?.houseId === 'string' ? req.body.houseId.trim() : '';
  const housePubKey = typeof req.body?.housePubKey === 'string' ? req.body.housePubKey.trim() : '';
  const nonce = typeof req.body?.nonce === 'string' ? req.body.nonce.trim() : '';
  const keyMode = typeof req.body?.keyMode === 'string' ? req.body.keyMode.trim() : 'ceremony';
  const unlock = req.body?.unlock || null;
  const keyWrap = req.body?.keyWrap || null;
  const houseAuthKey = typeof req.body?.houseAuthKey === 'string' ? req.body.houseAuthKey.trim() : '';

  if (!teamCode) return res.status(400).json({ ok: false, error: 'MISSING_TEAM_CODE' });
  const s = getSessionByTeamCode(teamCode);
  if (!s) return res.status(404).json({ ok: false, error: 'TEAM_NOT_FOUND' });
  if (s.flow !== 'agent_solo') return res.status(403).json({ ok: false, error: 'AGENT_SOLO_ONLY' });
  if (!s.houseCeremony?.agentReveal) return res.status(403).json({ ok: false, error: 'CEREMONY_INCOMPLETE' });

  const painted = countInk(s.canvas?.pixels);
  if (painted < MIN_AGENT_SOLO_PIXELS) {
    return res.status(403).json({ ok: false, error: 'INSUFFICIENT_PIXELS', minPixels: MIN_AGENT_SOLO_PIXELS, painted });
  }

  if (!houseId || !housePubKey) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
  if (houseId !== housePubKey) return res.status(400).json({ ok: false, error: 'HOUSE_ID_MISMATCH' });
  if (!nonce) return res.status(400).json({ ok: false, error: 'MISSING_NONCE' });
  if (!houseAuthKey) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_AUTH' });
  const authKeyBytes = decodeB64(houseAuthKey);
  if (!authKeyBytes || authKeyBytes.length < 16) {
    return res.status(400).json({ ok: false, error: 'INVALID_HOUSE_AUTH' });
  }
  if (s.houseCeremony?.houseId && s.houseCeremony.houseId !== houseId) {
    return res.status(409).json({ ok: false, error: 'HOUSE_ALREADY_EXISTS' });
  }

  // Solo flow uses ceremony-style keys with agent entropy.
  if (keyMode !== 'ceremony') {
    return res.status(400).json({ ok: false, error: 'CEREMONY_ONLY' });
  }

  const ra = b64ToBytes(s.houseCeremony.agentReveal);
  if (!ra || !ra.length) return res.status(400).json({ ok: false, error: 'INVALID_REVEAL' });
  const kroot = sha256Bytes(ra);
  const expectedHouseId = base58Encode(sha256Bytes(kroot));
  if (expectedHouseId !== houseId) {
    return res.status(400).json({ ok: false, error: 'HOUSE_ID_MISMATCH' });
  }

  let normalizedKeyWrap = null;
  if (keyWrap && typeof keyWrap === 'object') {
    const alg = typeof keyWrap.alg === 'string' ? keyWrap.alg.trim() : '';
    const iv = typeof keyWrap.iv === 'string' ? keyWrap.iv.trim() : '';
    const ct = typeof keyWrap.ct === 'string' ? keyWrap.ct.trim() : '';
    if (alg && iv && ct) {
      if (alg !== 'AES-GCM') {
        return res.status(400).json({ ok: false, error: 'INVALID_KEY_WRAP' });
      }
      normalizedKeyWrap = { alg, iv, ct };
    }
  }

  const store = readStore();
  if (store.houses.length >= MAX_HOUSES) {
    return res.status(403).json({ ok: false, error: 'STORE_FULL' });
  }
  if (store.signups.length >= MAX_SIGNUPS) {
    return res.status(403).json({ ok: false, error: 'STORE_FULL' });
  }
  const exists = store.houses.find((r) => r.id === houseId);
  if (exists) return res.status(409).json({ ok: false, error: 'HOUSE_EXISTS' });

  store.houses.push({
    id: houseId,
    housePubKey,
    createdAt: nowIso(),
    nonce,
    keyMode: 'ceremony',
    unlock,
    keyWrap: normalizedKeyWrap,
    authKey: houseAuthKey,
    entries: []
  });
  writeStore(store);

  s.houseCeremony.houseId = houseId;
  s.houseCeremony.createdAt = s.houseCeremony.createdAt || nowIso();
  indexHouseId(s, houseId);

  const status = recordSignup(s, {
    mode: 'agent_solo',
    agentName: s.agent.name || null,
    matchedElement: null,
    address: unlock?.address || null
  });

  if (!status.complete) {
    return res.status(403).json({ ok: false, error: status.reason || 'STORE_FULL', houseId });
  }

  res.json({ ok: true, houseId, status });
});

app.get('/api/house/:id/meta', (req, res) => {
  const houseId = typeof req.params?.id === 'string' ? req.params.id.trim() : '';
  if (!houseId) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
  const store = readStore();
  const house = store.houses.find((r) => r.id === houseId);
  if (!house) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  const auth = verifyHouseAuth(req, house);
  if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });
  res.json({
    ok: true,
    houseId: house.id,
    housePubKey: house.housePubKey,
    nonce: house.nonce,
    keyMode: 'ceremony'
  });
});

app.get('/api/house/:id/descriptor', (req, res) => {
  const houseId = typeof req.params?.id === 'string' ? req.params.id.trim() : '';
  if (!houseId) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
  const store = readStore();
  const house = store.houses.find((r) => r.id === houseId);
  if (!house) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  const auth = verifyHouseAuth(req, house);
  if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });

  const origin = `${req.protocol}://${req.get('host')}`;
  res.json({
    ok: true,
    descriptor: {
      v: 1,
      kind: 'agent-town-house',
      house: {
        id: house.id,
        pub: house.housePubKey,
        mailboxes: [
          {
            chain: 'solana',
            kind: 'pda',
            status: 'placeholder',
            address: 'PDA_TODO',
            program: 'PROGRAM_TODO'
          }
        ]
      },
      endpoints: {
        meta: `${origin}/api/house/${encodeURIComponent(house.id)}/meta`,
        log: `${origin}/api/house/${encodeURIComponent(house.id)}/log`,
        append: `${origin}/api/house/${encodeURIComponent(house.id)}/append`
      },
      ui: {
        houseUrl: `${origin}/house?house=${encodeURIComponent(house.id)}`
      }
    }
  });
});

app.get('/api/house/:id/log', (req, res) => {
  const houseId = typeof req.params?.id === 'string' ? req.params.id.trim() : '';
  if (!houseId) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
  const store = readStore();
  const house = store.houses.find((r) => r.id === houseId);
  if (!house) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  const auth = verifyHouseAuth(req, house);
  if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });
  res.json({ ok: true, entries: Array.isArray(house.entries) ? house.entries : [] });
});

app.get('/api/house/:id/public-media', (req, res) => {
  const houseId = typeof req.params?.id === 'string' ? req.params.id.trim() : '';
  if (!houseId) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
  const store = readStore();
  const house = store.houses.find((r) => r.id === houseId);
  if (!house) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  res.json({ ok: true, publicMedia: serializePublicMedia(house) });
});

app.get('/api/house/:id/public-media/image', (req, res) => {
  const houseId = typeof req.params?.id === 'string' ? req.params.id.trim() : '';
  if (!houseId) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
  const store = readStore();
  const house = store.houses.find((r) => r.id === houseId);
  if (!house || !house.publicMedia?.image) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  const parsed = parsePublicImageDataUrl(house.publicMedia.image);
  if (parsed.error || !parsed.bytes) return res.status(500).json({ ok: false, error: 'INVALID_PUBLIC_IMAGE' });
  res.setHeader('Content-Type', parsed.mime || 'application/octet-stream');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.end(parsed.bytes);
});

app.post('/api/house/:id/public-media', (req, res) => {
  const houseId = typeof req.params?.id === 'string' ? req.params.id.trim() : '';
  if (!houseId) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
  const store = readStore();
  const house = store.houses.find((r) => r.id === houseId);
  if (!house) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  const auth = verifyHouseAuth(req, house);
  if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });

  const body = req.body || {};
  const hasImage = Object.prototype.hasOwnProperty.call(body, 'image');
  const hasPrompt = Object.prototype.hasOwnProperty.call(body, 'prompt');
  const clear = body?.clear === true;
  if (!clear && !hasImage && !hasPrompt) {
    return res.status(400).json({ ok: false, error: 'MISSING_PUBLIC_MEDIA' });
  }

  let nextImage = house.publicMedia?.image || null;
  let nextPrompt = house.publicMedia?.prompt || null;

  if (clear) {
    nextImage = null;
    nextPrompt = null;
  }

  if (hasImage) {
    if (body.image == null || body.image === '') {
      nextImage = null;
    } else {
      const parsed = parsePublicImageDataUrl(body.image);
      if (parsed.error) return res.status(400).json({ ok: false, error: parsed.error });
      nextImage = parsed.dataUrl;
    }
  }

  if (hasPrompt) {
    if (body.prompt != null && typeof body.prompt !== 'string') {
      return res.status(400).json({ ok: false, error: 'INVALID_PUBLIC_PROMPT' });
    }
    nextPrompt = normalizePublicPrompt(body.prompt);
  }

  if (nextImage && !nextPrompt) {
    return res.status(400).json({ ok: false, error: 'PUBLIC_PROMPT_REQUIRED' });
  }
  if (nextPrompt && !nextImage) {
    return res.status(400).json({ ok: false, error: 'PUBLIC_IMAGE_REQUIRED' });
  }

  if (!nextImage && !nextPrompt) {
    house.publicMedia = null;
  } else {
    house.publicMedia = {
      image: nextImage,
      prompt: nextPrompt,
      updatedAt: nowIso()
    };
  }

  writeStore(store);
  res.json({ ok: true, publicMedia: serializePublicMedia(house) });
});

app.post('/api/house/:id/append', (req, res) => {
  const houseId = typeof req.params?.id === 'string' ? req.params.id.trim() : '';
  if (!houseId) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
  const ciphertext = req.body?.ciphertext;
  const author = typeof req.body?.author === 'string' ? req.body.author.trim() : 'unknown';
  if (!ciphertext || typeof ciphertext.iv !== 'string' || typeof ciphertext.ct !== 'string') {
    return res.status(400).json({ ok: false, error: 'INVALID_CIPHERTEXT' });
  }

  const store = readStore();
  const house = store.houses.find((r) => r.id === houseId);
  if (!house) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  const auth = verifyHouseAuth(req, house);
  if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });
  house.entries = Array.isArray(house.entries) ? house.entries : [];
  if (house.entries.length >= MAX_HOUSE_ENTRIES) {
    return res.status(403).json({ ok: false, error: 'HOUSE_FULL' });
  }
  house.entries.push({
    id: `re_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    createdAt: nowIso(),
    author,
    ciphertext
  });
  writeStore(store);
  res.json({ ok: true });
});

// --- Static + routes ---
app.use(
  express.static(PUBLIC_DIR, {
    etag: true,
    maxAge: isProd ? '1h' : 0,
    setHeaders: (res) => {
      if (!isProd) {
        res.setHeader('Cache-Control', 'no-store');
      }
    }
  })
);

app.use(
  '/assets',
  express.static(ASSETS_DIR, {
    etag: true,
    maxAge: isProd ? '1h' : 0,
    setHeaders: (res) => {
      if (!isProd) {
        res.setHeader('Cache-Control', 'no-store');
      }
    }
  })
);

ensureMediaDir();
app.use(
  '/media/clips',
  express.static(MEDIA_DIR, {
    etag: true,
    maxAge: isProd ? '1h' : 0,
    setHeaders: (res) => {
      if (!isProd) {
        res.setHeader('Cache-Control', 'no-store');
      }
    }
  })
);

if (fs.existsSync(PHASER_DIST_DIR)) {
  app.use(
    '/vendor/phaser',
    express.static(PHASER_DIST_DIR, {
      etag: true,
      maxAge: isProd ? '1h' : 0,
      setHeaders: (res) => {
        if (!isProd) {
          res.setHeader('Cache-Control', 'no-store');
        }
      }
    })
  );
}

if (fs.existsSync(COLYSEUS_DIST_DIR)) {
  app.use(
    '/vendor/colyseus',
    express.static(COLYSEUS_DIST_DIR, {
      etag: true,
      maxAge: isProd ? '1h' : 0,
      setHeaders: (res) => {
        if (!isProd) {
          res.setHeader('Cache-Control', 'no-store');
        }
      }
    })
  );
}

app.get('/create', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'create.html')));
app.get('/inbox/:houseId', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'inbox.html')));
app.get('/house', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'house.html')));
app.get('/world', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'world.html')));
app.get('/leaderboard', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'leaderboard.html')));
app.get('/wall', (_req, res) => res.redirect(302, '/leaderboard'));
app.get('/c/:id', (req, res) => {
  const clipId = typeof req.params?.id === 'string' ? req.params.id.trim() : '';
  if (!clipId) return res.status(400).send('Missing clip id');
  const store = readStore();
  const clip = findClipRecord(store, clipId);
  if (!clip || clip.status !== 'ready' || (!clip.storage?.mp4Url && !clip.storage?.sourceUrl)) {
    return res.status(404).send('Clip not found');
  }
  const origin = `${req.protocol}://${req.get('host')}`;
  const videoPath = clip.storage.mp4Url || clip.storage.sourceUrl;
  const videoUrl = `${origin}${videoPath}`;
  const videoType = videoPath.endsWith('.webm') ? 'video/webm' : 'video/mp4';
  const title = `Agent Town clip ${clipId}`;
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtmlAttr(title)}</title>
  <meta property="og:title" content="${escapeHtmlAttr(title)}" />
  <meta property="og:type" content="video.other" />
  <meta property="og:video" content="${escapeHtmlAttr(videoUrl)}" />
  <meta property="og:video:type" content="${escapeHtmlAttr(videoType)}" />
  <meta property="og:url" content="${escapeHtmlAttr(`${origin}/c/${clipId}`)}" />
  <meta name="twitter:card" content="summary_large_image" />
</head>
<body style="font-family: monospace; margin: 20px;">
  <h1>${escapeHtmlAttr(title)}</h1>
  <video controls playsinline src="${escapeHtmlAttr(videoUrl)}" style="max-width: 100%;"></video>
</body>
</html>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  if (!isProd) res.setHeader('Cache-Control', 'no-store');
  return res.send(html);
});
app.get('/s/:id', (req, res) => {
  const shareId = req.params.id;
  const store = readStore();
  const share = store.shares.find((x) => x.id === shareId) || null;
  const house = share?.houseId ? store.houses.find((h) => h.id === share.houseId) : null;
  const publicMedia = house ? serializePublicMedia(house) : null;
  const origin = `${req.protocol}://${req.get('host')}`;
  const meta = buildShareMeta({ shareId, publicMedia, origin });
  const template = fs.readFileSync(path.join(PUBLIC_DIR, 'share.html'), 'utf8');
  const html = template.replace('</head>', `  ${meta}\n</head>`);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  if (!isProd) res.setHeader('Cache-Control', 'no-store');
  res.send(html);
});

// Default route
app.get('*', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'index.html')));

const port = Number(process.env.PORT || 4173);
const realtimePort = Number(process.env.WORLD_RT_PORT || port + 1);

async function start() {
  const httpServer = http.createServer(app);
  const presence = await createPresenceAdapter();
  worldInstanceManager = new WorldInstanceManager({
    getSnapshot: (instance) => getWorldSnapshot(instance, readStore()),
    presence
  });

  worldRealtime = await startWorldRealtimeServer({
    port: realtimePort,
    publicPort: port,
    manager: worldInstanceManager,
    server: httpServer
  });

  httpServer.listen(port, () => {
    console.log(`[agent-town] http://localhost:${port}`);
    console.log(`[agent-town] realtime on same origin port ${worldRealtime.port}`);
  });
}

start().catch((err) => {
  console.error('[agent-town] failed to start', err);
  process.exit(1);
});
