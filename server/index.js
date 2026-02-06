const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const https = require('https');
const http = require('http');
const zlib = require('zlib');
const express = require('express');

const { parseCookies, nowIso, randomHex } = require('./util');
const { readStore, writeStore } = require('./store');
const { createPonyTransportService } = require('./ponyTransport');
const { createServerHouseVaultBackend } = require('./houseVaultBackend');
const { createPostageVerifier } = require('./postageVerifier');
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

function normalizePonyCiphertext(ciphertext, legacyBody = '') {
  if (ciphertext && typeof ciphertext === 'object') {
    const alg = typeof ciphertext.alg === 'string' ? ciphertext.alg.trim() : '';
    const ct = typeof ciphertext.ct === 'string' ? ciphertext.ct : '';
    const iv = typeof ciphertext.iv === 'string' ? ciphertext.iv : '';
    if (!alg || !ct) throw new Error('INVALID_CIPHERTEXT');
    return { alg, iv, ct };
  }
  if (typeof legacyBody === 'string' && legacyBody.trim()) {
    return { alg: 'PLAINTEXT', iv: '', ct: legacyBody };
  }
  throw new Error('MISSING_CIPHERTEXT');
}

function resolveHouseAddress(store, input) {
  const raw = typeof input === 'string' ? input.trim() : '';
  if (!raw) return null;
  const house = store.houses.find((h) => h && h.id === raw);
  if (house) return { houseId: house.id, house, source: 'house' };

  // Legacy alias support: allow share ids to resolve to house ids.
  const share = store.shares.find((s) => s && s.id === raw && typeof s.houseId === 'string' && s.houseId.trim());
  if (!share) return null;
  const mappedHouse = store.houses.find((h) => h && h.id === share.houseId);
  if (!mappedHouse) return null;
  return { houseId: mappedHouse.id, house: mappedHouse, source: 'share' };
}

function makeInboxMsg({ toHouseId, fromHouseId = null, ciphertext, body, status = 'request', kind = 'msg.chat.v1' }) {
  const id = `msg_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const normalizedCiphertext = normalizePonyCiphertext(ciphertext, body);
  return {
    id,
    version: 1,
    kind,
    toHouseId,
    fromHouseId,
    to: { houseId: toHouseId },
    from: fromHouseId ? { houseId: fromHouseId } : null,
    envelope: { ciphertext: normalizedCiphertext },
    // Compatibility field (clients should migrate to envelope.ciphertext).
    ciphertext: normalizedCiphertext,
    createdAt: nowIso(),
    status // request | accepted | rejected
  };
}

const PONY_RATE_WINDOW_MS = 60_000;
const PONY_RATE_MAX_PER_PAIR = 20;
const PONY_MAX_VAULT_EVENTS = 2000;
const ponyRateBuckets = new Map();

function normalizeHouseList(values) {
  if (!Array.isArray(values)) return [];
  const out = new Set();
  for (const value of values) {
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    out.add(trimmed);
  }
  return [...out];
}

function getHousePonyPolicy(house) {
  const policy = house?.ponyPolicy || {};
  return {
    allowlist: normalizeHouseList(policy.allowlist),
    blocklist: normalizeHouseList(policy.blocklist),
    autoAcceptAllowlist: policy.autoAcceptAllowlist !== false,
    allowAnonymous: policy.allowAnonymous !== false,
    requirePostageAnonymous: policy.requirePostageAnonymous === true
  };
}

function normalizeRelayHints(values, max = 8) {
  if (!Array.isArray(values)) return [];
  const out = [];
  const seen = new Set();
  for (const value of values) {
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
    if (out.length >= max) break;
  }
  return out;
}

function normalizePonyTransport(transport) {
  if (transport == null) {
    return {
      kind: 'relay.http.v1',
      relayHints: []
    };
  }
  if (!transport || typeof transport !== 'object') throw new Error('INVALID_TRANSPORT');
  const kind = typeof transport.kind === 'string' && transport.kind.trim() ? transport.kind.trim() : 'relay.http.v1';
  return {
    kind,
    relayHints: normalizeRelayHints(transport.relayHints)
  };
}

function normalizePonyPostage(postage) {
  if (postage == null) return { kind: 'none' };
  if (!postage || typeof postage !== 'object') throw new Error('INVALID_POSTAGE');
  const kind = typeof postage.kind === 'string' ? postage.kind.trim() : '';
  if (!kind || kind === 'none') return { kind: 'none' };

  if (kind === 'pow.v1') {
    const nonce = typeof postage.nonce === 'string' ? postage.nonce.trim() : '';
    const digest = typeof postage.digest === 'string' ? postage.digest.trim() : '';
    const difficulty = Number(postage.difficulty || 0);
    if (!nonce || !digest || !Number.isFinite(difficulty) || difficulty < 1) {
      throw new Error('INVALID_POSTAGE');
    }
    return {
      kind,
      nonce,
      digest,
      difficulty: Math.floor(difficulty)
    };
  }

  if (kind === 'receipt.v1') {
    const receipts = normalizeRelayHints(postage.receipts, 16);
    if (!receipts.length) throw new Error('INVALID_POSTAGE');
    return {
      kind,
      receipts
    };
  }

  throw new Error('INVALID_POSTAGE_KIND');
}

function ensureHouseVault(house) {
  if (!house || typeof house !== 'object') return [];
  if (!Array.isArray(house.ponyVault)) house.ponyVault = [];
  return house.ponyVault;
}

function computeVaultEventHash(event) {
  const payload = {
    id: event.id,
    houseId: event.houseId,
    kind: event.kind,
    createdAt: event.createdAt,
    prevHash: event.prevHash || null,
    envelope: event.envelope,
    refs: Array.isArray(event.refs) ? event.refs : [],
    postage: event.postage || { kind: 'none' }
  };
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

function checkPonyRateLimit({ senderKey, toHouseId }) {
  const now = Date.now();
  const key = `${senderKey}->${toHouseId}`;
  let bucket = ponyRateBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + PONY_RATE_WINDOW_MS };
    ponyRateBuckets.set(key, bucket);
  }
  bucket.count += 1;
  if (bucket.count > PONY_RATE_MAX_PER_PAIR) {
    return { ok: false, retryAfterMs: bucket.resetAt - now };
  }
  return { ok: true };
}

function resolveHouseByErc8004Id(store, erc8004Id) {
  const rec = (store.anchors || []).find((a) => a && a.erc8004Id === erc8004Id);
  if (!rec || !rec.houseId) return null;
  const house = store.houses.find((h) => h && h.id === rec.houseId);
  if (!house) return null;
  return { houseId: house.id, house, source: 'anchor', erc8004Id };
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

  const connectSrc = ["'self'", 'https://eth.llamarpc.com', 'https://rpc.ankr.com'];
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
const PONY_ANON_POSTAGE_MIN_DIFFICULTY = 8;

const ponyTransportService = createPonyTransportService();
const ponyPostageVerifier = createPostageVerifier({
  basePowMinDifficulty: 1,
  anonymousPowMinDifficulty: PONY_ANON_POSTAGE_MIN_DIFFICULTY
});
const houseVaultBackend = createServerHouseVaultBackend({
  maxEntries: MAX_HOUSE_ENTRIES,
  nowIso
});

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

// --- API ---
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, time: nowIso() });
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
  const mayorTargetHouseId = record.houseId;
  if (mayorTargetHouseId) {
    const mayorBody = [
      `Welcome, House ${mayorTargetHouseId}.`,
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
      makeInboxMsg({
        toHouseId: mayorTargetHouseId,
        fromHouseId: MAYOR_HOUSE_ID,
        ciphertext: { alg: 'PLAINTEXT', iv: '', ct: mayorBody },
        status: 'accepted'
      })
    );
  }

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
function normalizePolicyHouseEntries(store, values) {
  const out = [];
  const seen = new Set();
  for (const value of normalizeHouseList(values)) {
    const resolved = resolveHouseAddress(store, value);
    if (!resolved) throw new Error(`INVALID_POLICY_HOUSE:${value}`);
    if (seen.has(resolved.houseId)) continue;
    seen.add(resolved.houseId);
    out.push(resolved.houseId);
  }
  return out;
}

app.get('/api/pony/resolve', (req, res) => {
  const houseAddress = typeof req.query?.houseId === 'string' ? req.query.houseId.trim() : '';
  const erc8004Id = typeof req.query?.erc8004Id === 'string' ? req.query.erc8004Id.trim() : '';
  if (!houseAddress && !erc8004Id) return res.status(400).json({ ok: false, error: 'MISSING_TARGET' });

  const store = readStore();
  if (houseAddress) {
    const resolved = resolveHouseAddress(store, houseAddress);
    if (!resolved) return res.status(404).json({ ok: false, error: 'HOUSE_NOT_FOUND' });
    return res.json({ ok: true, houseId: resolved.houseId, source: resolved.source || 'house' });
  }

  const resolvedByAnchor = resolveHouseByErc8004Id(store, erc8004Id);
  if (!resolvedByAnchor) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  return res.json({ ok: true, houseId: resolvedByAnchor.houseId, source: 'anchor', erc8004Id });
});

app.post('/api/pony/send', (req, res) => {
  const toAddress = typeof req.body?.toHouseId === 'string' ? req.body.toHouseId.trim() : '';
  const toErc8004Id = typeof req.body?.toErc8004Id === 'string' ? req.body.toErc8004Id.trim() : '';
  const fromAddress = typeof req.body?.fromHouseId === 'string' ? req.body.fromHouseId.trim() : '';
  const legacyBody = typeof req.body?.body === 'string' ? req.body.body : '';

  if (!toAddress && !toErc8004Id) return res.status(400).json({ ok: false, error: 'MISSING_TO' });
  if (fromAddress === MAYOR_HOUSE_ID) return res.status(403).json({ ok: false, error: 'RESERVED_FROM' });

  const store = readStore();

  let toResolved = null;
  if (toAddress) toResolved = resolveHouseAddress(store, toAddress);
  if (!toResolved && toErc8004Id) toResolved = resolveHouseByErc8004Id(store, toErc8004Id);
  if (!toResolved) return res.status(404).json({ ok: false, error: 'HOUSE_NOT_FOUND' });

  let fromResolved = null;
  if (fromAddress) {
    fromResolved = resolveHouseAddress(store, fromAddress);
    if (!fromResolved) return res.status(404).json({ ok: false, error: 'FROM_HOUSE_NOT_FOUND' });
    const auth = verifyHouseAuth(req, fromResolved.house);
    if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });
  }

  let normalizedCiphertext;
  let normalizedTransport;
  let normalizedPostage;
  try {
    normalizedCiphertext = normalizePonyCiphertext(req.body?.ciphertext, legacyBody);
    normalizedTransport = normalizePonyTransport(req.body?.transport);
    normalizedPostage = normalizePonyPostage(req.body?.postage);
  } catch (err) {
    const msg = String(err?.message || 'INVALID_PONY_MESSAGE');
    if (msg === 'INVALID_POSTAGE' || msg === 'INVALID_POSTAGE_KIND') {
      return res.status(400).json({ ok: false, error: msg });
    }
    if (msg === 'INVALID_TRANSPORT') {
      return res.status(400).json({ ok: false, error: msg });
    }
    return res.status(400).json({ ok: false, error: msg || 'INVALID_CIPHERTEXT' });
  }

  const policy = getHousePonyPolicy(toResolved.house);
  const senderHouseId = fromResolved?.houseId || null;

  if (!senderHouseId && !policy.allowAnonymous) {
    return res.status(403).json({ ok: false, error: 'ANONYMOUS_NOT_ALLOWED' });
  }
  if (!senderHouseId && policy.requirePostageAnonymous && normalizedPostage.kind === 'none') {
    return res.status(402).json({ ok: false, error: 'POSTAGE_REQUIRED' });
  }
  if (senderHouseId && policy.blocklist.includes(senderHouseId)) {
    return res.status(403).json({ ok: false, error: 'SENDER_BLOCKED' });
  }

  try {
    ponyPostageVerifier.verify({
      postage: normalizedPostage,
      context: {
        fromHouseId: senderHouseId,
        toHouseId: toResolved.houseId,
        requirePostageAnonymous: policy.requirePostageAnonymous
      }
    });
  } catch (err) {
    const msg = String(err?.message || 'INVALID_POSTAGE');
    if (msg === 'POSTAGE_POW_DIFFICULTY_TOO_LOW') {
      return res.status(402).json({
        ok: false,
        error: msg,
        requiredDifficulty: err?.requiredDifficulty || PONY_ANON_POSTAGE_MIN_DIFFICULTY,
        actualDifficulty: err?.actualDifficulty || 0
      });
    }
    if (msg.startsWith('POSTAGE_') || msg === 'INVALID_POSTAGE_KIND') {
      return res.status(400).json({ ok: false, error: msg });
    }
    return res.status(400).json({ ok: false, error: 'INVALID_POSTAGE' });
  }

  const senderKey = senderHouseId || 'anon';
  const rate = checkPonyRateLimit({ senderKey, toHouseId: toResolved.houseId });
  if (!rate.ok) {
    const retryAfter = Math.max(1, Math.ceil((rate.retryAfterMs || 0) / 1000));
    res.setHeader('Retry-After', retryAfter);
    return res.status(429).json({ ok: false, error: 'RATE_LIMITED_PONY', retryAfter });
  }

  let status = 'request';
  if (senderHouseId === MAYOR_HOUSE_ID) status = 'accepted';
  else if (senderHouseId && policy.autoAcceptAllowlist && policy.allowlist.includes(senderHouseId)) status = 'accepted';

  const msg = makeInboxMsg({
    toHouseId: toResolved.houseId,
    fromHouseId: senderHouseId,
    ciphertext: normalizedCiphertext,
    status
  });

  msg.transport = normalizedTransport;
  msg.postage = normalizedPostage;

  if (toErc8004Id) {
    msg.routing = {
      by: 'erc8004',
      erc8004Id: toErc8004Id
    };
  }

  try {
    ponyTransportService.dispatch({
      store,
      message: msg,
      transport: normalizedTransport,
      context: {
        fromHouseId: senderHouseId,
        toHouseId: toResolved.houseId
      }
    });
  } catch (err) {
    const msg = String(err?.message || 'TRANSPORT_DELIVERY_FAILED');
    if (msg === 'TRANSPORT_ADAPTER_UNAVAILABLE') {
      return res.status(500).json({ ok: false, error: msg });
    }
    return res.status(502).json({ ok: false, error: 'TRANSPORT_DELIVERY_FAILED' });
  }
  writeStore(store);

  res.json({
    ok: true,
    id: msg.id,
    toHouseId: toResolved.houseId,
    fromHouseId: senderHouseId,
    status
  });
});

app.get('/api/pony/inbox', (req, res) => {
  const houseAddress = typeof req.query?.houseId === 'string' ? req.query.houseId.trim() : '';
  if (!houseAddress) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE' });

  const store = readStore();
  const resolved = resolveHouseAddress(store, houseAddress);
  if (!resolved) return res.status(404).json({ ok: false, error: 'HOUSE_NOT_FOUND' });

  const auth = verifyHouseAuth(req, resolved.house);
  if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });

  const items = store.inbox
    .filter((m) => m.toHouseId === resolved.houseId)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

  res.json({ ok: true, houseId: resolved.houseId, inbox: items });
});

app.get('/api/pony/policy', (req, res) => {
  const houseAddress = typeof req.query?.houseId === 'string' ? req.query.houseId.trim() : '';
  if (!houseAddress) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE' });

  const store = readStore();
  const resolved = resolveHouseAddress(store, houseAddress);
  if (!resolved) return res.status(404).json({ ok: false, error: 'HOUSE_NOT_FOUND' });

  const auth = verifyHouseAuth(req, resolved.house);
  if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });

  return res.json({
    ok: true,
    houseId: resolved.houseId,
    policy: getHousePonyPolicy(resolved.house)
  });
});

app.post('/api/pony/policy', (req, res) => {
  const houseAddress = typeof req.body?.houseId === 'string'
    ? req.body.houseId.trim()
    : (typeof req.query?.houseId === 'string' ? req.query.houseId.trim() : '');
  if (!houseAddress) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE' });

  const store = readStore();
  const resolved = resolveHouseAddress(store, houseAddress);
  if (!resolved) return res.status(404).json({ ok: false, error: 'HOUSE_NOT_FOUND' });

  const auth = verifyHouseAuth(req, resolved.house);
  if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });

  try {
    const nextPolicy = getHousePonyPolicy({ ponyPolicy: resolved.house.ponyPolicy || {} });

    if (Object.prototype.hasOwnProperty.call(req.body || {}, 'allowlist')) {
      nextPolicy.allowlist = normalizePolicyHouseEntries(store, req.body.allowlist);
    }
    if (Object.prototype.hasOwnProperty.call(req.body || {}, 'blocklist')) {
      nextPolicy.blocklist = normalizePolicyHouseEntries(store, req.body.blocklist);
    }
    if (Object.prototype.hasOwnProperty.call(req.body || {}, 'autoAcceptAllowlist')) {
      nextPolicy.autoAcceptAllowlist = req.body.autoAcceptAllowlist !== false;
    }
    if (Object.prototype.hasOwnProperty.call(req.body || {}, 'allowAnonymous')) {
      nextPolicy.allowAnonymous = req.body.allowAnonymous !== false;
    }
    if (Object.prototype.hasOwnProperty.call(req.body || {}, 'requirePostageAnonymous')) {
      nextPolicy.requirePostageAnonymous = req.body.requirePostageAnonymous === true;
    }

    resolved.house.ponyPolicy = nextPolicy;
    writeStore(store);

    return res.json({ ok: true, houseId: resolved.houseId, policy: nextPolicy });
  } catch (err) {
    const msg = String(err?.message || 'INVALID_POLICY');
    if (msg.startsWith('INVALID_POLICY_HOUSE:')) {
      return res.status(400).json({ ok: false, error: 'INVALID_POLICY_HOUSE', value: msg.split(':').slice(1).join(':') });
    }
    return res.status(400).json({ ok: false, error: 'INVALID_POLICY' });
  }
});

app.get('/api/pony/vault', (req, res) => {
  const houseAddress = typeof req.query?.houseId === 'string' ? req.query.houseId.trim() : '';
  if (!houseAddress) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE' });

  const store = readStore();
  const resolved = resolveHouseAddress(store, houseAddress);
  if (!resolved) return res.status(404).json({ ok: false, error: 'HOUSE_NOT_FOUND' });

  const auth = verifyHouseAuth(req, resolved.house);
  if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });

  const limitRaw = Number(req.query?.limit || 50);
  const limit = Math.min(200, Math.max(1, Number.isFinite(limitRaw) ? Math.floor(limitRaw) : 50));

  const events = ensureHouseVault(resolved.house);
  const items = events.slice(-limit);
  const head = items.length ? items[items.length - 1].hash || null : null;

  return res.json({ ok: true, houseId: resolved.houseId, head, items });
});

app.post('/api/pony/vault/append', (req, res) => {
  const houseAddress = typeof req.body?.houseId === 'string'
    ? req.body.houseId.trim()
    : (typeof req.query?.houseId === 'string' ? req.query.houseId.trim() : '');
  if (!houseAddress) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE' });

  const store = readStore();
  const resolved = resolveHouseAddress(store, houseAddress);
  if (!resolved) return res.status(404).json({ ok: false, error: 'HOUSE_NOT_FOUND' });

  const auth = verifyHouseAuth(req, resolved.house);
  if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });

  let normalizedCiphertext;
  let normalizedPostage;
  const kind = typeof req.body?.kind === 'string' && req.body.kind.trim() ? req.body.kind.trim() : 'vault.append.v1';
  try {
    normalizedCiphertext = normalizePonyCiphertext(req.body?.ciphertext, req.body?.body);
    normalizedPostage = normalizePonyPostage(req.body?.postage);
    ponyPostageVerifier.verify({
      postage: normalizedPostage,
      context: {
        fromHouseId: resolved.houseId,
        toHouseId: resolved.houseId,
        requirePostageAnonymous: false
      }
    });
  } catch (err) {
    return res.status(400).json({ ok: false, error: String(err?.message || 'INVALID_VAULT_EVENT') });
  }

  const refs = normalizeRelayHints(req.body?.refs, 16);
  const events = ensureHouseVault(resolved.house);
  const prevHash = events.length ? events[events.length - 1].hash || null : null;
  const entry = {
    id: `pv_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    kind,
    houseId: resolved.houseId,
    envelope: { ciphertext: normalizedCiphertext },
    refs,
    postage: normalizedPostage,
    prevHash,
    createdAt: nowIso()
  };
  entry.hash = computeVaultEventHash(entry);

  events.push(entry);
  if (events.length > PONY_MAX_VAULT_EVENTS) {
    events.splice(0, events.length - PONY_MAX_VAULT_EVENTS);
  }
  writeStore(store);

  return res.json({
    ok: true,
    id: entry.id,
    hash: entry.hash,
    prevHash,
    head: entry.hash
  });
});

app.post('/api/pony/inbox/:id/accept', (req, res) => {
  const id = req.params.id;
  const houseAddress = typeof req.body?.houseId === 'string'
    ? req.body.houseId.trim()
    : (typeof req.query?.houseId === 'string' ? req.query.houseId.trim() : '');
  if (!houseAddress) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE' });

  const store = readStore();
  const resolved = resolveHouseAddress(store, houseAddress);
  if (!resolved) return res.status(404).json({ ok: false, error: 'HOUSE_NOT_FOUND' });

  const auth = verifyHouseAuth(req, resolved.house);
  if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });

  const msg = store.inbox.find((m) => m.id === id);
  if (!msg) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  if (msg.toHouseId !== resolved.houseId) return res.status(403).json({ ok: false, error: 'MESSAGE_NOT_FOR_HOUSE' });

  msg.status = 'accepted';
  writeStore(store);
  res.json({ ok: true });
});

app.post('/api/pony/inbox/:id/reject', (req, res) => {
  const id = req.params.id;
  const houseAddress = typeof req.body?.houseId === 'string'
    ? req.body.houseId.trim()
    : (typeof req.query?.houseId === 'string' ? req.query.houseId.trim() : '');
  if (!houseAddress) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE' });

  const store = readStore();
  const resolved = resolveHouseAddress(store, houseAddress);
  if (!resolved) return res.status(404).json({ ok: false, error: 'HOUSE_NOT_FOUND' });

  const auth = verifyHouseAuth(req, resolved.house);
  if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });

  const msg = store.inbox.find((m) => m.id === id);
  if (!msg) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  if (msg.toHouseId !== resolved.houseId) return res.status(403).json({ ok: false, error: 'MESSAGE_NOT_FOR_HOUSE' });

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
  app.post('/__test__/reset', (_req, res) => {
    const token = process.env.TEST_RESET_TOKEN;
    if (!token) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const header = _req.header('x-test-reset');
    if (header !== token) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    writeStore({ signups: [], shares: [], publicTeams: [], houses: [], anchors: [], inbox: [] });
    resetAllSessions();
    rateBuckets.clear();
    ponyRateBuckets.clear();
    res.json({ ok: true });
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
  const entries = houseVaultBackend.listEntries({ house });
  res.json({ ok: true, entries });
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
  try {
    houseVaultBackend.appendEntry({
      house,
      author,
      ciphertext
    });
  } catch (err) {
    const msg = String(err?.message || 'HOUSE_APPEND_FAILED');
    if (msg === 'HOUSE_FULL') return res.status(403).json({ ok: false, error: 'HOUSE_FULL' });
    return res.status(500).json({ ok: false, error: 'HOUSE_APPEND_FAILED' });
  }
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

app.get('/create', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'create.html')));
app.get('/inbox/:houseId', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'inbox.html')));
app.get('/house', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'house.html')));
app.get('/leaderboard', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'leaderboard.html')));
app.get('/wall', (_req, res) => res.redirect(302, '/leaderboard'));
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
app.listen(port, () => {
  console.log(`[agent-town] http://localhost:${port}`);
});
