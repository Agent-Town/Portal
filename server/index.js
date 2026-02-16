const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const https = require('https');
const http = require('http');
const zlib = require('zlib');
const express = require('express');
const { loadDotEnv } = require('./env');

loadDotEnv();

const { parseCookies, nowIso, randomHex } = require('./util');
const { readStore, writeStore } = require('./store');
const { createPonyTransportService } = require('./ponyTransport');
const { createServerHouseVaultBackend } = require('./houseVaultBackend');
const { createPostageVerifier } = require('./postageVerifier');
const { emitMilestone } = require('./milestones');
const { computeRewardsSummary } = require('./rewards');
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
const CEREMONY_E2EE_P256_AESGCM_V1 = 'CEREMONY_E2EE_P256_AESGCM_V1';
const PONY_E2EE_P256_AESGCM_V1 = 'PONY_E2EE_P256_AESGCM_V1';
const PONY_MAX_PLAINTEXT_CT_BYTES = 4096;
const PONY_MAX_E2EE_CT_BYTES = 32 * 1024;
const PONY_MAX_E2EE_AAD_BYTES = 4096;

function makePonyMsgKeyInfo({ fromHouseId = '', toHouseId = '' }) {
  const from = typeof fromHouseId === 'string' ? fromHouseId : '';
  const to = typeof toHouseId === 'string' ? toHouseId : '';
  return `elizatown-pony-msg-v1|from=${from}|to=${to}`;
}

function normalizePonyCiphertextE2EE(ciphertext) {
  const epk = typeof ciphertext.epk === 'string' ? ciphertext.epk.trim() : '';
  const ct = typeof ciphertext.ct === 'string' ? ciphertext.ct.trim() : '';
  const iv = typeof ciphertext.iv === 'string' ? ciphertext.iv.trim() : '';
  const aad = typeof ciphertext.aad === 'string' ? ciphertext.aad.trim() : '';
  if (!epk || !ct || !iv || !aad) throw new Error('INVALID_PONY_E2EE_ENVELOPE');
  if (!isCanonicalBase64(epk) || !isCanonicalBase64(ct) || !isCanonicalBase64(iv) || !isCanonicalBase64(aad)) {
    throw new Error('INVALID_PONY_E2EE_ENVELOPE');
  }

  const ivBytes = decodeB64(iv);
  const ctBytes = decodeB64(ct);
  const epkBytes = decodeB64(epk);
  const aadBytes = decodeB64(aad);
  if (!ivBytes || ivBytes.length < 8 || ivBytes.length > 32) throw new Error('INVALID_PONY_E2EE_ENVELOPE');
  if (!ctBytes || ctBytes.length < 17 || ctBytes.length > PONY_MAX_E2EE_CT_BYTES) throw new Error('PONY_CIPHERTEXT_TOO_LARGE');
  if (!epkBytes || epkBytes.length < 48 || epkBytes.length > 2048) throw new Error('INVALID_PONY_E2EE_ENVELOPE');
  if (!aadBytes || !aadBytes.length || aadBytes.length > PONY_MAX_E2EE_AAD_BYTES) {
    throw new Error('INVALID_PONY_E2EE_ENVELOPE');
  }

  return {
    alg: PONY_E2EE_P256_AESGCM_V1,
    epk,
    iv,
    ct,
    aad
  };
}

function normalizePonyCiphertext(ciphertext, legacyBody = '', opts = {}) {
  const allowCustomAlg = opts && opts.allowCustomAlg === true;
  if (ciphertext && typeof ciphertext === 'object') {
    const alg = typeof ciphertext.alg === 'string' ? ciphertext.alg.trim() : '';
    const ct = typeof ciphertext.ct === 'string' ? ciphertext.ct.trim() : '';
    const iv = typeof ciphertext.iv === 'string' ? ciphertext.iv.trim() : '';
    if (!alg || !ct) throw new Error('INVALID_CIPHERTEXT');
    if (alg === PONY_E2EE_P256_AESGCM_V1) return normalizePonyCiphertextE2EE(ciphertext);
    if (alg !== 'PLAINTEXT') {
      if (!allowCustomAlg) throw new Error('UNSUPPORTED_PONY_CIPHER');
      return { alg, iv, ct };
    }
    if (Buffer.byteLength(ct, 'utf8') > PONY_MAX_PLAINTEXT_CT_BYTES) throw new Error('PONY_CIPHERTEXT_TOO_LARGE');
    return { alg, iv, ct };
  }
  if (typeof legacyBody === 'string' && legacyBody.trim()) {
    if (Buffer.byteLength(legacyBody, 'utf8') > PONY_MAX_PLAINTEXT_CT_BYTES) throw new Error('PONY_CIPHERTEXT_TOO_LARGE');
    return { alg: 'PLAINTEXT', iv: '', ct: legacyBody };
  }
  throw new Error('MISSING_CIPHERTEXT');
}

function encryptPonyE2EEForHouse({ plaintext, fromHouseId = null, toHouseId, recipientPonyInboxPub, kind = 'msg.chat.v1', createdAt = nowIso() }) {
  if (!toHouseId || typeof toHouseId !== 'string') throw new Error('INVALID_PONY_E2EE_TARGET');
  if (!recipientPonyInboxPub || typeof recipientPonyInboxPub !== 'string') throw new Error('INVALID_PONY_E2EE_TARGET_KEY');
  const recipientKeyDer = decodeB64(recipientPonyInboxPub);
  if (!recipientKeyDer || !recipientKeyDer.length) throw new Error('INVALID_PONY_E2EE_TARGET_KEY');

  let recipientPub;
  try {
    recipientPub = crypto.createPublicKey({ key: recipientKeyDer, format: 'der', type: 'spki' });
  } catch {
    throw new Error('INVALID_PONY_E2EE_TARGET_KEY');
  }

  const eph = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const shared = crypto.diffieHellman({ privateKey: eph.privateKey, publicKey: recipientPub });
  const key = Buffer.from(crypto.hkdfSync('sha256', shared, Buffer.alloc(0), Buffer.from(makePonyMsgKeyInfo({
    fromHouseId: fromHouseId || '',
    toHouseId
  }), 'utf8'), 32));
  const iv = crypto.randomBytes(12);

  const aadPayload = {
    v: 1,
    kind,
    fromHouseId: fromHouseId || null,
    toHouseId,
    createdAt
  };
  const aadBytes = Buffer.from(JSON.stringify(aadPayload), 'utf8');
  const plaintextPayload = Buffer.from(JSON.stringify({
    v: 1,
    body: String(plaintext || '')
  }), 'utf8');

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(aadBytes);
  const enc = Buffer.concat([cipher.update(plaintextPayload), cipher.final()]);
  const tag = cipher.getAuthTag();
  const ct = Buffer.concat([enc, tag]);
  const epkDer = eph.publicKey.export({ type: 'spki', format: 'der' });

  return {
    alg: PONY_E2EE_P256_AESGCM_V1,
    epk: epkDer.toString('base64'),
    iv: iv.toString('base64'),
    ct: ct.toString('base64'),
    aad: aadBytes.toString('base64')
  };
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

function makeDispatchReceiptId() {
  return `dr_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

const PONY_RATE_WINDOW_MS = 60_000;
const PONY_RATE_MAX_PER_PAIR = 20;
const PONY_MAX_VAULT_EVENTS = 2000;
const PONY_INBOX_KEY_VERSION = 1;
const BASE64_RE = /^[A-Za-z0-9+/]+={0,2}$/;
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
    requirePostageAnonymous: policy.requirePostageAnonymous === true,
    requireReceiptAnonymous: policy.requireReceiptAnonymous === true,
    allowLegacyPlaintext: typeof policy.allowLegacyPlaintext === 'boolean'
      ? policy.allowLegacyPlaintext
      : false
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

const HEX_SHA256_RE = /^[0-9a-f]{64}$/i;

function normalizePostageReceipts(values, max = 16) {
  if (!Array.isArray(values)) return [];
  const out = [];
  for (const value of values) {
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    out.push(trimmed);
    if (out.length > max) throw new Error('INVALID_POSTAGE');
  }
  return out;
}

function normalizeVaultRefsMeta(refs, refsMeta, max = 16, maxBytes = 1024 * 1024 * 1024) {
  if (refsMeta == null) return [];
  if (!Array.isArray(refsMeta)) throw new Error('INVALID_VAULT_REFS_META');
  if (refsMeta.length > max) throw new Error('VAULT_REFS_META_TOO_MANY');

  const knownRefs = new Set(Array.isArray(refs) ? refs : []);
  const out = [];
  const seen = new Set();

  for (const item of refsMeta) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error('INVALID_VAULT_REFS_META');
    }

    const ref = typeof item.ref === 'string' ? item.ref.trim() : '';
    if (!ref) throw new Error('VAULT_REF_META_MISSING_REF');
    if (!knownRefs.has(ref)) throw new Error('VAULT_REF_META_REF_UNKNOWN');
    if (seen.has(ref)) throw new Error('VAULT_REF_META_DUPLICATE');
    seen.add(ref);

    const normalized = { ref };
    let hasMeta = false;

    if (Object.prototype.hasOwnProperty.call(item, 'mediaType')) {
      const mediaType = typeof item.mediaType === 'string' ? item.mediaType.trim() : '';
      if (!mediaType || mediaType.length > 120) throw new Error('VAULT_REF_META_MEDIA_TYPE_INVALID');
      normalized.mediaType = mediaType;
      hasMeta = true;
    }

    if (Object.prototype.hasOwnProperty.call(item, 'bytes')) {
      const bytes = Number(item.bytes);
      if (!Number.isFinite(bytes) || bytes < 0 || Math.floor(bytes) !== bytes || bytes > maxBytes) {
        throw new Error('VAULT_REF_META_BYTES_INVALID');
      }
      normalized.bytes = bytes;
      hasMeta = true;
    }

    if (Object.prototype.hasOwnProperty.call(item, 'sha256')) {
      const sha256 = typeof item.sha256 === 'string' ? item.sha256.trim().toLowerCase() : '';
      if (!HEX_SHA256_RE.test(sha256)) throw new Error('VAULT_REF_META_SHA256_INVALID');
      normalized.sha256 = sha256;
      hasMeta = true;
    }

    if (!hasMeta) throw new Error('VAULT_REF_META_EMPTY');
    out.push(normalized);
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
    const receipts = normalizePostageReceipts(postage.receipts, 16);
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

function normalizePonyFriendLabel(label) {
  if (typeof label !== 'string') return null;
  const trimmed = label.trim();
  if (!trimmed) return null;
  return trimmed.length > 64 ? trimmed.slice(0, 64) : trimmed;
}

function ensureHousePonyFriends(house) {
  if (!house || typeof house !== 'object') return [];
  if (!Array.isArray(house.ponyFriends)) house.ponyFriends = [];
  house.ponyFriends = house.ponyFriends.filter(
    (f) => f && typeof f === 'object' && typeof f.houseId === 'string' && f.houseId.trim()
  );
  return house.ponyFriends;
}

function deriveHousePonyFriendsFromAcceptedInbox(store, houseId) {
  const out = new Set();
  for (const m of store?.inbox || []) {
    if (!m || m.status !== 'accepted') continue;
    const from = typeof m.fromHouseId === 'string' ? m.fromHouseId : '';
    const to = typeof m.toHouseId === 'string' ? m.toHouseId : '';

    if (to === houseId && from && from !== houseId) out.add(from);
    if (from === houseId && to && to !== houseId) out.add(to);
  }
  return [...out];
}

function isCanonicalBase64(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length % 4 !== 0) return false;
  if (!BASE64_RE.test(trimmed)) return false;
  const decoded = decodeB64(trimmed);
  return !!(decoded && decoded.length);
}

function normalizeCeremonyCommit(value) {
  const commit = typeof value === 'string' ? value.trim() : '';
  if (!commit) throw new Error('MISSING_COMMIT');
  if (!isCanonicalBase64(commit)) throw new Error('INVALID_COMMIT');
  const bytes = decodeB64(commit);
  if (!bytes || bytes.length !== 32) throw new Error('INVALID_COMMIT');
  return commit;
}

function normalizeCeremonyRevealPub(value, { required = false } = {}) {
  const pub = typeof value === 'string' ? value.trim() : '';
  if (!pub) {
    if (required) throw new Error('MISSING_REVEAL_PUB');
    return null;
  }
  if (!isCanonicalBase64(pub)) throw new Error('INVALID_REVEAL_PUB');
  const pubBytes = decodeB64(pub);
  if (!pubBytes || pubBytes.length < 48 || pubBytes.length > 2048) throw new Error('INVALID_REVEAL_PUB');
  try {
    crypto.createPublicKey({ key: pubBytes, format: 'der', type: 'spki' });
  } catch {
    throw new Error('INVALID_REVEAL_PUB');
  }
  return pub;
}

function normalizeCeremonySealedReveal(sealed, { required = false } = {}) {
  if (sealed == null) {
    if (required) throw new Error('MISSING_REVEAL');
    return null;
  }
  if (!sealed || typeof sealed !== 'object' || Array.isArray(sealed)) {
    throw new Error('INVALID_REVEAL_ENVELOPE');
  }

  const alg = typeof sealed.alg === 'string' ? sealed.alg.trim() : '';
  const epk = typeof sealed.epk === 'string' ? sealed.epk.trim() : '';
  const iv = typeof sealed.iv === 'string' ? sealed.iv.trim() : '';
  const ct = typeof sealed.ct === 'string' ? sealed.ct.trim() : '';
  const aad = typeof sealed.aad === 'string' ? sealed.aad.trim() : '';

  if (alg !== CEREMONY_E2EE_P256_AESGCM_V1 || !epk || !iv || !ct || !aad) {
    throw new Error('INVALID_REVEAL_ENVELOPE');
  }
  if (!isCanonicalBase64(epk) || !isCanonicalBase64(iv) || !isCanonicalBase64(ct) || !isCanonicalBase64(aad)) {
    throw new Error('INVALID_REVEAL_ENVELOPE');
  }

  const epkBytes = decodeB64(epk);
  const ivBytes = decodeB64(iv);
  const ctBytes = decodeB64(ct);
  const aadBytes = decodeB64(aad);
  if (!epkBytes || epkBytes.length < 48 || epkBytes.length > 2048) throw new Error('INVALID_REVEAL_ENVELOPE');
  if (!ivBytes || ivBytes.length !== 12) throw new Error('INVALID_REVEAL_ENVELOPE');
  if (!ctBytes || ctBytes.length < 17 || ctBytes.length > 4096) throw new Error('INVALID_REVEAL_ENVELOPE');
  if (!aadBytes || !aadBytes.length || aadBytes.length > 1024) throw new Error('INVALID_REVEAL_ENVELOPE');

  return { alg, epk, iv, ct, aad };
}

function normalizePonyInboxPrivWrap(ponyInboxPrivWrap, { required = false } = {}) {
  if (ponyInboxPrivWrap == null) {
    if (required) throw new Error('MISSING_PONY_INBOX_PRIV_WRAP');
    return null;
  }
  if (!ponyInboxPrivWrap || typeof ponyInboxPrivWrap !== 'object' || Array.isArray(ponyInboxPrivWrap)) {
    throw new Error('INVALID_PONY_INBOX_PRIV_WRAP');
  }

  const alg = typeof ponyInboxPrivWrap.alg === 'string' ? ponyInboxPrivWrap.alg.trim() : '';
  const iv = typeof ponyInboxPrivWrap.iv === 'string' ? ponyInboxPrivWrap.iv.trim() : '';
  const ct = typeof ponyInboxPrivWrap.ct === 'string' ? ponyInboxPrivWrap.ct.trim() : '';
  if (alg !== 'AES-GCM' || !iv || !ct) throw new Error('INVALID_PONY_INBOX_PRIV_WRAP');
  if (!isCanonicalBase64(iv) || !isCanonicalBase64(ct)) throw new Error('INVALID_PONY_INBOX_PRIV_WRAP');

  const ivBytes = decodeB64(iv);
  const ctBytes = decodeB64(ct);
  if (!ivBytes || ivBytes.length < 8 || ivBytes.length > 32) throw new Error('INVALID_PONY_INBOX_PRIV_WRAP');
  if (!ctBytes || ctBytes.length < 16) throw new Error('INVALID_PONY_INBOX_PRIV_WRAP');

  return { alg: 'AES-GCM', iv, ct };
}

function normalizePonyInboxRegistration({ ponyInboxPub, ponyInboxPrivWrap }, { required = false } = {}) {
  const pub = typeof ponyInboxPub === 'string' ? ponyInboxPub.trim() : '';
  const hasPub = !!pub;
  const hasPrivWrap = ponyInboxPrivWrap != null;

  if (!hasPub && !hasPrivWrap) {
    if (required) throw new Error('MISSING_PONY_INBOX_PUB');
    return null;
  }
  if (!hasPub) throw new Error('MISSING_PONY_INBOX_PUB');
  if (!isCanonicalBase64(pub)) throw new Error('INVALID_PONY_INBOX_PUB');

  const pubBytes = decodeB64(pub);
  if (!pubBytes || pubBytes.length < 48 || pubBytes.length > 2048) throw new Error('INVALID_PONY_INBOX_PUB');

  const privWrap = normalizePonyInboxPrivWrap(ponyInboxPrivWrap, { required: true });
  return {
    version: PONY_INBOX_KEY_VERSION,
    pub,
    privWrap
  };
}

function getHousePonyInboxKey(house) {
  if (!house || typeof house !== 'object') return null;
  const ponyInbox = house.ponyInbox;
  if (!ponyInbox || typeof ponyInbox !== 'object') return null;

  const pub = typeof ponyInbox.pub === 'string' ? ponyInbox.pub.trim() : '';
  if (!pub) return null;

  const versionRaw = Number(ponyInbox.version);
  const version = Number.isFinite(versionRaw) && versionRaw >= 1 ? Math.floor(versionRaw) : PONY_INBOX_KEY_VERSION;

  let privWrap = null;
  if (ponyInbox.privWrap && typeof ponyInbox.privWrap === 'object') {
    const alg = typeof ponyInbox.privWrap.alg === 'string' ? ponyInbox.privWrap.alg.trim() : '';
    const iv = typeof ponyInbox.privWrap.iv === 'string' ? ponyInbox.privWrap.iv.trim() : '';
    const ct = typeof ponyInbox.privWrap.ct === 'string' ? ponyInbox.privWrap.ct.trim() : '';
    if (alg === 'AES-GCM' && iv && ct) privWrap = { alg, iv, ct };
  }

  return {
    version,
    pub,
    privWrap,
    createdAt: typeof ponyInbox.createdAt === 'string' ? ponyInbox.createdAt : null,
    updatedAt: typeof ponyInbox.updatedAt === 'string' ? ponyInbox.updatedAt : null
  };
}

function writeHousePonyInboxKey(house, registration) {
  if (!house || typeof house !== 'object' || !registration) return;
  const existing = getHousePonyInboxKey(house);
  const now = nowIso();
  house.ponyInbox = {
    version: registration.version || PONY_INBOX_KEY_VERSION,
    pub: registration.pub,
    privWrap: registration.privWrap,
    createdAt: existing?.createdAt || now,
    updatedAt: now
  };
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
    refsMeta: Array.isArray(event.refsMeta) ? event.refsMeta : [],
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

function reservedHouseId(kind, key) {
  const seed = `agenttown:reserved:${kind}:${key}`;
  const bytes = crypto.createHash('sha256').update(seed).digest();
  return base58Encode(bytes);
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

function unlockAddressForLookup(unlock) {
  if (!unlock || typeof unlock !== 'object') return null;
  const address = typeof unlock.address === 'string' ? unlock.address.trim() : '';
  if (!address) return null;
  if (unlock.kind === 'solana-wallet-signature') return address;
  if (unlock.kind === 'wallet-signature') {
    const chain = typeof unlock.chain === 'string' ? unlock.chain.trim().toLowerCase() : '';
    if (chain === 'solana') return address;
  }
  return null;
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

function splitCsvEnv(raw) {
  return String(raw || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseBoolEnv(raw, fallback = false) {
  if (raw === undefined || raw === null || String(raw).trim() === '') return !!fallback;
  const normalized = String(raw).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return !!fallback;
}

function parseJsonObjectEnv(raw) {
  const src = String(raw || '').trim();
  if (!src) return {};
  try {
    const parsed = JSON.parse(src);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed;
  } catch {
    return {};
  }
}

function sanitizePublicConfig(value) {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((item) => sanitizePublicConfig(item));

  const out = {};
  for (const [key, val] of Object.entries(value)) {
    const lower = key.toLowerCase();
    if (lower.includes('secret') || lower.includes('private') || lower.includes('api_key')) continue;
    out[key] = sanitizePublicConfig(val);
  }
  return out;
}

const PRIVY_APP_ID = String(process.env.PRIVY_APP_ID || '').trim();
const PRIVY_CLIENT_ID = String(process.env.PRIVY_CLIENT_ID || '').trim();
const PRIVY_SDK_SCRIPT_URL = String(process.env.PRIVY_SDK_SCRIPT_URL || '').trim();
const PRIVY_SDK_MODULE_URL = String(process.env.PRIVY_SDK_MODULE_URL || '').trim();
const PRIVY_LOGIN_METHOD = String(process.env.PRIVY_LOGIN_METHOD || 'email').trim().toLowerCase();
const PRIVY_PUBLIC_CONFIG_JSON = sanitizePublicConfig(parseJsonObjectEnv(process.env.PRIVY_PUBLIC_CONFIG_JSON));
const PRIVY_PUBLIC_CONFIG = {
  ...PRIVY_PUBLIC_CONFIG_JSON,
  ...(PRIVY_APP_ID ? { appId: PRIVY_APP_ID } : {}),
  ...(PRIVY_CLIENT_ID ? { clientId: PRIVY_CLIENT_ID } : {}),
  ...(PRIVY_SDK_SCRIPT_URL ? { sdkScriptUrl: PRIVY_SDK_SCRIPT_URL } : {}),
  ...(PRIVY_SDK_MODULE_URL ? { sdkModuleUrl: PRIVY_SDK_MODULE_URL } : {}),
  ...(PRIVY_LOGIN_METHOD ? { loginMethod: PRIVY_LOGIN_METHOD } : {})
};
const PRIVY_ENABLED_RAW = !!PRIVY_PUBLIC_CONFIG.appId;
const PRIVY_ENABLED_IN_TEST = parseBoolEnv(process.env.ENABLE_PRIVY_IN_TEST, false);
const PRIVY_ENABLED = PRIVY_ENABLED_RAW && (process.env.NODE_ENV !== 'test' || PRIVY_ENABLED_IN_TEST);
const START_PAGE_ENABLED = parseBoolEnv(process.env.START_PAGE_ENABLED, PRIVY_ENABLED);
const HOME_ROUTE_FILE = 'start.html';

const CSP_SCRIPT_SRC_EXTRA = splitCsvEnv(process.env.CSP_SCRIPT_SRC_EXTRA);
const PRIVY_SCRIPT_SRC_DEFAULT = [
  'https://esm.sh',
  'https://auth.privy.io',
  'https://*.privy.io',
  'https://*.privy.app',
  'https://*.privy.com'
];
const scriptSrc = [
  "'self'",
  ...(PRIVY_ENABLED ? PRIVY_SCRIPT_SRC_DEFAULT : []),
  ...CSP_SCRIPT_SRC_EXTRA
];
const SCRIPT_SRC = [...new Set(scriptSrc)];
const CSP_CONNECT_SRC_EXTRA = splitCsvEnv(process.env.CSP_CONNECT_SRC_EXTRA);
const PRIVY_CONNECT_SRC_DEFAULT = [
  'https://auth.privy.io',
  'https://api.privy.io',
  'https://*.privy.io',
  'https://*.privy.app',
  'https://*.privy.com',
  'wss://*.privy.io',
  'wss://*.privy.app',
  'wss://*.privy.com'
];
const connectSrc = [
  "'self'",
  'https://eth.llamarpc.com',
  'https://rpc.ankr.com',
  ...(PRIVY_ENABLED ? PRIVY_CONNECT_SRC_DEFAULT : []),
  ...CSP_CONNECT_SRC_EXTRA
];
const CONNECT_SRC = [...new Set(connectSrc)];
const CSP_FRAME_SRC_EXTRA = splitCsvEnv(process.env.CSP_FRAME_SRC_EXTRA);
const frameSrc = [
  "'self'",
  'https://www.youtube.com',
  'https://www.youtube-nocookie.com',
  ...(PRIVY_ENABLED ? ['https://auth.privy.io', 'https://*.privy.io', 'https://*.privy.app', 'https://*.privy.com'] : []),
  ...CSP_FRAME_SRC_EXTRA
];
const FRAME_SRC = [...new Set(frameSrc)];
 
function isAdmin(req) {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return false;
  const header = req.header('x-admin-token');
  if (!header) return false;
  return header === token;
}

function normalizeXHandle(input) {
  if (typeof input !== 'string') return null;
  const handle = input.trim().replace(/^@/, '').toLowerCase();
  if (!handle) return null;
  if (!/^[a-z0-9_]{1,15}$/.test(handle)) return null;
  return handle;
}

function setSecurityHeaders(req, res, next) {
  const allowSameOriginFrame = typeof req.path === 'string' && req.path.startsWith('/s/');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('X-Frame-Options', allowSameOriginFrame ? 'SAMEORIGIN' : 'DENY');

  const csp = [
    "default-src 'self'",
    `script-src ${SCRIPT_SRC.join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "media-src 'self'",
    "worker-src 'self' blob:",
    `frame-src ${FRAME_SRC.join(' ')}`,
    `connect-src ${CONNECT_SRC.join(' ')}`,
    "object-src 'none'",
    "base-uri 'none'",
    `frame-ancestors ${allowSameOriginFrame ? "'self'" : "'none'"}`
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
const MAX_VAULT_REF_BYTES = 1024 * 1024 * 1024;

const ponyTransportService = createPonyTransportService();
const ponyPostageVerifier = createPostageVerifier({
  basePowMinDifficulty: 1,
  anonymousPowMinDifficulty: PONY_ANON_POSTAGE_MIN_DIFFICULTY,
  resolveReceipt: ({ receiptId, context } = {}) => {
    const store = context?.store;
    if (!store || !Array.isArray(store.inbox)) return null;
    const message = store.inbox.find((entry) => entry?.dispatch?.receiptId === receiptId);
    if (!message) return null;
    return {
      id: receiptId,
      messageId: message.id || null,
      toHouseId: message.toHouseId || null
    };
  }
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

app.get('/api/privy/config', (_req, res) => {
  res.json({
    ok: true,
    enabled: PRIVY_ENABLED,
    config: PRIVY_ENABLED ? PRIVY_PUBLIC_CONFIG : null,
    startPageEnabled: START_PAGE_ENABLED,
    appPath: '/app'
  });
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

// Rotates the human session cookie to a fresh session/team code.
// Useful for shared devices where multiple people onboard sequentially.
app.post('/api/session/reset', (req, res) => {
  // Ensure we still have a valid response cookie context (Secure flag in prod).
  const store = readStore();
  const next = createSession();
  const secureFlag = isProd || req.secure ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `et_session=${encodeURIComponent(next.sessionId)}; Path=/; SameSite=Lax; HttpOnly${secureFlag}`
  );
  res.json({
    ok: true,
    teamCode: next.teamCode,
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

// --- Reservations (admin-only for MVP) ---
app.post('/api/reservations/x', (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });

  const handle = normalizeXHandle(req.body?.handle);
  if (!handle) return res.status(400).json({ ok: false, error: 'INVALID_HANDLE' });

  const store = readStore();
  store.reservations = Array.isArray(store.reservations) ? store.reservations : [];
  const key = `@${handle}`;
  const existing = store.reservations.find((r) => r && r.kind === 'x' && r.key === key);
  if (existing) {
    return res.json({ ok: true, already: true, houseId: existing.houseId, status: existing.status || 'reserved' });
  }

  const houseId = reservedHouseId('x', key);
  const record = {
    id: `rv_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    createdAt: nowIso(),
    kind: 'x',
    key,
    houseId,
    status: 'reserved',
    verifiedAt: null,
    claimedAt: null,
    meta: {}
  };
  store.reservations.push(record);
  writeStore(store);

  res.json({ ok: true, houseId, status: record.status });
});

app.get('/api/reservations/x', (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
  const handle = normalizeXHandle(req.query?.handle);
  if (!handle) return res.status(400).json({ ok: false, error: 'INVALID_HANDLE' });
  const store = readStore();
  const key = `@${handle}`;
  const rec = (store.reservations || []).find((r) => r && r.kind === 'x' && r.key === key);
  if (!rec) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  res.json({ ok: true, houseId: rec.houseId, status: rec.status || 'reserved' });
});

app.post('/api/reservations/erc8004', (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });

  const agentIdRaw = typeof req.body?.agentId === 'string' ? req.body.agentId.trim() : '';
  if (!agentIdRaw) return res.status(400).json({ ok: false, error: 'MISSING_AGENT_ID' });

  const claimChainRaw = typeof req.body?.claimChain === 'string' ? req.body.claimChain.trim().toLowerCase() : '';
  const claimChain = claimChainRaw || guessClaimChain(agentIdRaw) || 'evm';
  if (claimChain !== 'evm' && claimChain !== 'solana') {
    return res.status(400).json({ ok: false, error: 'INVALID_CLAIM_CHAIN' });
  }

  const ownerAddressRaw = typeof req.body?.ownerAddress === 'string' ? req.body.ownerAddress.trim() : '';
  const ownerAddress = claimChain === 'evm'
    ? normalizeEvmAddress(ownerAddressRaw)
    : normalizeSolanaAddress(ownerAddressRaw);
  if (!ownerAddress) return res.status(400).json({ ok: false, error: 'INVALID_OWNER_ADDRESS' });

  const aliasesRaw = Array.isArray(req.body?.aliases) ? req.body.aliases : [];
  const aliases = [];
  for (const alias of aliasesRaw) {
    if (typeof alias !== 'string') continue;
    const clean = alias.trim();
    if (!clean) continue;
    aliases.push(clean);
  }
  const agentId = claimChain === 'evm' ? agentIdRaw.toLowerCase() : agentIdRaw;
  const claimAliases = [...new Set([agentId, ...aliases.map((a) => (claimChain === 'evm' ? a.toLowerCase() : a))])];

  const store = readStore();
  store.reservations = Array.isArray(store.reservations) ? store.reservations : [];
  const existing = store.reservations.find((r) =>
    r
      && r.kind === 'erc8004'
      && listErc8004ClaimAliases(r).some((alias) => reservationAliasMatchesInput(alias, agentId)),
  );
  if (existing) {
    return res.json({
      ok: true,
      already: true,
      reservationId: existing.id,
      houseId: existing.houseId,
      status: existing.status || 'reserved'
    });
  }

  const houseId = reservedHouseId('erc8004', agentId);
  const record = {
    id: `rv_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    createdAt: nowIso(),
    kind: 'erc8004',
    key: agentId,
    houseId,
    status: 'reserved',
    verifiedAt: null,
    claimedAt: null,
    meta: {
      source: 'manual_admin',
      claimChain,
      ownerAddress,
      agentId,
      claimAliases
    }
  };

  store.reservations.push(record);
  writeStore(store);

  res.json({
    ok: true,
    reservationId: record.id,
    houseId: record.houseId,
    status: record.status,
    claimChain,
    agentId
  });
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
      humanReveal: !!s.houseCeremony?.humanRevealSealed,
      agentReveal: !!s.houseCeremony?.agentRevealSealed,
      humanRevealPub: !!s.houseCeremony?.humanRevealPub,
      agentRevealPub: !!s.houseCeremony?.agentRevealPub,
      houseId: s.houseCeremony?.houseId || null
    }
  });
});

app.post('/api/agent/house/commit', (req, res) => {
  const teamCode = typeof req.body?.teamCode === 'string' ? req.body.teamCode.trim() : '';
  const commitRaw = req.body?.commit;
  const revealPubRaw = req.body?.revealPub;
  if (!teamCode) return res.status(400).json({ ok: false, error: 'MISSING_TEAM_CODE' });
  const s = getSessionByTeamCode(teamCode);
  if (!s) return res.status(404).json({ ok: false, error: 'TEAM_NOT_FOUND' });

  let commit;
  let revealPub;
  try {
    commit = normalizeCeremonyCommit(commitRaw);
    revealPub = normalizeCeremonyRevealPub(revealPubRaw, { required: false });
  } catch (err) {
    return res.status(400).json({ ok: false, error: String(err?.message || 'INVALID_CEREMONY_COMMIT') });
  }

  s.houseCeremony.agentCommit = commit;
  if (revealPub) s.houseCeremony.agentRevealPub = revealPub;
  s.houseCeremony.createdAt = s.houseCeremony.createdAt || nowIso();
  res.json({ ok: true, agentRevealPub: s.houseCeremony.agentRevealPub || null });
});

app.post('/api/agent/house/reveal', (req, res) => {
  const teamCode = typeof req.body?.teamCode === 'string' ? req.body.teamCode.trim() : '';
  const sealedRaw = req.body?.sealedForHuman || req.body?.sealedReveal || req.body?.sealed || null;
  if (!teamCode) return res.status(400).json({ ok: false, error: 'MISSING_TEAM_CODE' });
  const s = getSessionByTeamCode(teamCode);
  if (!s) return res.status(404).json({ ok: false, error: 'TEAM_NOT_FOUND' });
  if (!s.houseCeremony?.humanCommit) return res.status(409).json({ ok: false, error: 'WAITING_HUMAN_COMMIT' });
  if (!s.houseCeremony?.humanRevealPub) return res.status(409).json({ ok: false, error: 'WAITING_HUMAN_REVEAL_PUB' });

  let sealed;
  try {
    sealed = normalizeCeremonySealedReveal(sealedRaw, { required: true });
  } catch (err) {
    return res.status(400).json({ ok: false, error: String(err?.message || 'INVALID_REVEAL_ENVELOPE') });
  }

  s.houseCeremony.agentRevealSealed = sealed;
  s.houseCeremony.createdAt = s.houseCeremony.createdAt || nowIso();

  res.json({ ok: true, houseId: s.houseCeremony.houseId || null });
});

app.post('/api/human/house/commit', (req, res) => {
  const s = ensureHumanSession(req, res);
  const commitRaw = req.body?.commit;
  const revealPubRaw = req.body?.revealPub;
  let commit;
  let revealPub;
  try {
    commit = normalizeCeremonyCommit(commitRaw);
    revealPub = normalizeCeremonyRevealPub(revealPubRaw, { required: false });
  } catch (err) {
    return res.status(400).json({ ok: false, error: String(err?.message || 'INVALID_CEREMONY_COMMIT') });
  }
  s.houseCeremony.humanCommit = commit;
  if (revealPub) s.houseCeremony.humanRevealPub = revealPub;
  s.houseCeremony.createdAt = s.houseCeremony.createdAt || nowIso();
  res.json({ ok: true, humanRevealPub: s.houseCeremony.humanRevealPub || null });
});

app.post('/api/human/house/reveal', (req, res) => {
  const s = ensureHumanSession(req, res);
  const sealedRaw = req.body?.sealedForAgent || req.body?.sealedReveal || req.body?.sealed || null;
  if (!s.houseCeremony?.agentCommit) return res.status(409).json({ ok: false, error: 'WAITING_AGENT_COMMIT' });
  if (!s.houseCeremony?.agentRevealPub) return res.status(409).json({ ok: false, error: 'WAITING_AGENT_REVEAL_PUB' });

  let sealed;
  try {
    sealed = normalizeCeremonySealedReveal(sealedRaw, { required: true });
  } catch (err) {
    return res.status(400).json({ ok: false, error: String(err?.message || 'INVALID_REVEAL_ENVELOPE') });
  }

  s.houseCeremony.humanRevealSealed = sealed;
  s.houseCeremony.createdAt = s.houseCeremony.createdAt || nowIso();

  res.json({ ok: true, houseId: s.houseCeremony.houseId || null });
});

app.get('/api/human/house/state', (req, res) => {
  const s = ensureHumanSession(req, res);
  res.json({
    ok: true,
    ceremony: {
      humanCommit: !!s.houseCeremony?.humanCommit,
      agentCommit: !!s.houseCeremony?.agentCommit,
      humanReveal: !!s.houseCeremony?.humanRevealSealed,
      agentReveal: !!s.houseCeremony?.agentRevealSealed,
      humanRevealPub: !!s.houseCeremony?.humanRevealPub,
      agentRevealPub: !!s.houseCeremony?.agentRevealPub,
      houseId: s.houseCeremony?.houseId || null
    }
  });
});

app.get('/api/human/house/material', (req, res) => {
  const s = ensureHumanSession(req, res);
  res.json({
    ok: true,
    houseId: s.houseCeremony?.houseId || null,
    humanCommit: s.houseCeremony?.humanCommit || null,
    agentCommit: s.houseCeremony?.agentCommit || null,
    humanRevealPub: s.houseCeremony?.humanRevealPub || null,
    agentRevealPub: s.houseCeremony?.agentRevealPub || null,
    agentRevealSealed: s.houseCeremony?.agentRevealSealed || null
  });
});

app.get('/api/agent/house/material', (req, res) => {
  const teamCode = typeof req.query?.teamCode === 'string' ? req.query.teamCode.trim() : '';
  if (!teamCode) return res.status(400).json({ ok: false, error: 'MISSING_TEAM_CODE' });
  const s = getSessionByTeamCode(teamCode);
  if (!s) return res.status(404).json({ ok: false, error: 'TEAM_NOT_FOUND' });
  res.json({
    ok: true,
    houseId: s.houseCeremony?.houseId || null,
    humanCommit: s.houseCeremony?.humanCommit || null,
    agentCommit: s.houseCeremony?.agentCommit || null,
    humanRevealPub: s.houseCeremony?.humanRevealPub || null,
    agentRevealPub: s.houseCeremony?.agentRevealPub || null,
    humanRevealSealed: s.houseCeremony?.humanRevealSealed || null
  });
});

// Share creation + retrieval
app.post('/api/share/create', (req, res) => {
  const s = ensureHumanSession(req, res);
  const tokenMode = s.signup?.mode === 'token';
  const claimMode = s.signup?.mode === 'claim';
  const soloMode = tokenMode || claimMode;
  const tokenVerifiedAt = s.token?.verifiedAt || null;
  const tokenVerifiedAddress = s.token?.address || null;
  s.shareApproval = s.shareApproval || { human: false, agent: false };
  s.shareApproval.human = true;
  if (soloMode) {
    s.shareApproval.agent = true;
    if (!s.agent.name) s.agent.name = '$ELIZATOWN';
  }
  if (!s.houseCeremony?.houseId) return res.status(403).json({ ok: false, error: 'HOUSE_NOT_READY' });
  if (!soloMode) {
    if (!s.houseCeremony?.humanCommit || !s.houseCeremony?.agentCommit
      || !s.houseCeremony?.humanRevealSealed || !s.houseCeremony?.agentRevealSealed) {
      return res.status(403).json({ ok: false, error: 'CEREMONY_INCOMPLETE' });
    }
    if (!s.agent?.connected) return res.status(403).json({ ok: false, error: 'AGENT_REQUIRED' });
  } else if (tokenMode) {
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
    matchedElement: soloMode ? null : s.match.elementId,
    agentName: soloMode ? (s.agent.name || '$ELIZATOWN') : s.agent.name,
    mode: soloMode ? 'token' : 'agent',
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
    const mayorTarget = store.houses.find((h) => h && h.id === mayorTargetHouseId) || null;
    const mayorTargetPony = getHousePonyInboxKey(mayorTarget);
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

    let mayorCiphertext = null;
    if (mayorTargetPony?.pub) {
      try {
        mayorCiphertext = encryptPonyE2EEForHouse({
          plaintext: mayorBody,
          fromHouseId: MAYOR_HOUSE_ID,
          toHouseId: mayorTargetHouseId,
          recipientPonyInboxPub: mayorTargetPony.pub,
          createdAt: nowIso()
        });
      } catch {
        mayorCiphertext = null;
      }
    }

    if (mayorCiphertext) {
      store.inbox.push(
        makeInboxMsg({
          toHouseId: mayorTargetHouseId,
          fromHouseId: MAYOR_HOUSE_ID,
          ciphertext: mayorCiphertext,
          status: 'accepted'
        })
      );
    }
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
    const ponyInbox = getHousePonyInboxKey(resolved.house);
    return res.json({
      ok: true,
      houseId: resolved.houseId,
      source: resolved.source || 'house',
      ponyInboxPub: ponyInbox?.pub || null,
      ponyInboxKeyVersion: ponyInbox?.version || null
    });
  }

  const resolvedByAnchor = resolveHouseByErc8004Id(store, erc8004Id);
  if (!resolvedByAnchor) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  const ponyInbox = getHousePonyInboxKey(resolvedByAnchor.house);
  return res.json({
    ok: true,
    houseId: resolvedByAnchor.houseId,
    source: 'anchor',
    erc8004Id,
    ponyInboxPub: ponyInbox?.pub || null,
    ponyInboxKeyVersion: ponyInbox?.version || null
  });
});

app.post('/api/pony/keys/register', (req, res) => {
  const houseAddress = typeof req.body?.houseId === 'string'
    ? req.body.houseId.trim()
    : (typeof req.query?.houseId === 'string' ? req.query.houseId.trim() : '');
  if (!houseAddress) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE' });

  let registration;
  try {
    registration = normalizePonyInboxRegistration({
      ponyInboxPub: req.body?.ponyInboxPub,
      ponyInboxPrivWrap: req.body?.ponyInboxPrivWrap
    }, { required: true });
  } catch (err) {
    return res.status(400).json({ ok: false, error: String(err?.message || 'INVALID_PONY_INBOX_KEY') });
  }

  const store = readStore();
  const resolved = resolveHouseAddress(store, houseAddress);
  if (!resolved) return res.status(404).json({ ok: false, error: 'HOUSE_NOT_FOUND' });

  const auth = verifyHouseAuth(req, resolved.house);
  if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });

  writeHousePonyInboxKey(resolved.house, registration);
  writeStore(store);

  return res.json({
    ok: true,
    houseId: resolved.houseId,
    ponyInboxPub: registration.pub,
    ponyInboxKeyVersion: registration.version
  });
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
    if (msg === 'UNSUPPORTED_PONY_CIPHER' || msg === 'PONY_CIPHERTEXT_TOO_LARGE') {
      return res.status(400).json({ ok: false, error: msg });
    }
    return res.status(400).json({ ok: false, error: msg || 'INVALID_CIPHERTEXT' });
  }

  const policy = getHousePonyPolicy(toResolved.house);
  const senderHouseId = fromResolved?.houseId || null;

  if (normalizedCiphertext.alg === 'PLAINTEXT' && !policy.allowLegacyPlaintext) {
    return res.status(400).json({ ok: false, error: 'PONY_CIPHERTEXT_REQUIRED' });
  }

  if (!senderHouseId && !policy.allowAnonymous) {
    return res.status(403).json({ ok: false, error: 'ANONYMOUS_NOT_ALLOWED' });
  }
  if (!senderHouseId && policy.requirePostageAnonymous && normalizedPostage.kind === 'none') {
    return res.status(402).json({ ok: false, error: 'POSTAGE_REQUIRED' });
  }
  if (!senderHouseId && policy.requireReceiptAnonymous && normalizedPostage.kind !== 'receipt.v1') {
    return res.status(402).json({ ok: false, error: 'POSTAGE_RECEIPT_REQUIRED' });
  }
  if (senderHouseId && policy.blocklist.includes(senderHouseId)) {
    return res.status(403).json({ ok: false, error: 'SENDER_BLOCKED' });
  }

  try {
    ponyPostageVerifier.verify({
      postage: normalizedPostage,
      context: {
        store,
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
      const payload = { ok: false, error: msg };
      if (typeof err?.receiptId === 'string' && err.receiptId) payload.receiptId = err.receiptId;
      if (msg === 'POSTAGE_RECEIPT_HOUSE_MISMATCH') {
        if (typeof err?.receiptToHouseId === 'string') payload.receiptToHouseId = err.receiptToHouseId;
        if (typeof err?.expectedToHouseId === 'string') payload.expectedToHouseId = err.expectedToHouseId;
      }
      return res.status(400).json(payload);
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

  let dispatchResult;
  try {
    dispatchResult = ponyTransportService.dispatch({
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

  msg.dispatch = {
    receiptId: makeDispatchReceiptId(),
    ok: dispatchResult?.ok !== false,
    adapter: typeof dispatchResult?.adapter === 'string' && dispatchResult.adapter.trim()
      ? dispatchResult.adapter.trim()
      : 'relay.unknown.v1',
    transportKind: normalizedTransport.kind,
    relayHints: normalizedTransport.relayHints,
    dispatchedAt: nowIso()
  };

  writeStore(store);

  res.json({
    ok: true,
    id: msg.id,
    toHouseId: toResolved.houseId,
    fromHouseId: senderHouseId,
    status,
    dispatch: msg.dispatch
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
  const ponyInbox = getHousePonyInboxKey(resolved.house);

  res.json({
    ok: true,
    houseId: resolved.houseId,
    inbox: items,
    ponyInboxPrivWrap: ponyInbox?.privWrap || null,
    ponyInboxKeyVersion: ponyInbox?.version || null
  });
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
    // Seed from the resolved house so defaults that depend on house state (e.g. ponyInbox presence)
    // are preserved when patching only a subset of policy fields.
    const nextPolicy = getHousePonyPolicy(resolved.house);

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
    if (Object.prototype.hasOwnProperty.call(req.body || {}, 'requireReceiptAnonymous')) {
      nextPolicy.requireReceiptAnonymous = req.body.requireReceiptAnonymous === true;
    }
    if (Object.prototype.hasOwnProperty.call(req.body || {}, 'allowLegacyPlaintext')) {
      nextPolicy.allowLegacyPlaintext = req.body.allowLegacyPlaintext === true;
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

app.get('/api/pony/friends', (req, res) => {
  const houseAddress = typeof req.query?.houseId === 'string' ? req.query.houseId.trim() : '';
  if (!houseAddress) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE' });

  const store = readStore();
  const resolved = resolveHouseAddress(store, houseAddress);
  if (!resolved) return res.status(404).json({ ok: false, error: 'HOUSE_NOT_FOUND' });

  const auth = verifyHouseAuth(req, resolved.house);
  if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });

  const derived = deriveHousePonyFriendsFromAcceptedInbox(store, resolved.houseId);
  const manual = ensureHousePonyFriends(resolved.house);

  const friendMap = new Map();
  for (const friendHouseId of derived) {
    friendMap.set(friendHouseId, { houseId: friendHouseId, sources: ['accepted'] });
  }

  for (const f of manual) {
    const friendHouseId = typeof f?.houseId === 'string' ? f.houseId.trim() : '';
    if (!friendHouseId || friendHouseId === resolved.houseId) continue;

    const prev = friendMap.get(friendHouseId);
    const sources = new Set(Array.isArray(prev?.sources) ? prev.sources : []);
    sources.add('manual');
    if (prev?.sources?.includes?.('accepted')) sources.add('accepted');

    friendMap.set(friendHouseId, {
      houseId: friendHouseId,
      sources: [...sources],
      label: normalizePonyFriendLabel(f?.label),
      addedAt: typeof f?.addedAt === 'string' ? f.addedAt : null,
      erc8004Id: typeof f?.erc8004Id === 'string' ? f.erc8004Id : null
    });
  }

  const friends = [...friendMap.values()].sort((a, b) => String(a.houseId).localeCompare(String(b.houseId)));
  return res.json({ ok: true, houseId: resolved.houseId, friends });
});

app.post('/api/pony/friends', (req, res) => {
  const houseAddress = typeof req.body?.houseId === 'string'
    ? req.body.houseId.trim()
    : (typeof req.query?.houseId === 'string' ? req.query.houseId.trim() : '');
  if (!houseAddress) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE' });

  const friendHouseAddress = typeof req.body?.friendHouseId === 'string' ? req.body.friendHouseId.trim() : '';
  const friendErc8004Id = typeof req.body?.friendErc8004Id === 'string' ? req.body.friendErc8004Id.trim() : '';
  if (!friendHouseAddress && !friendErc8004Id) return res.status(400).json({ ok: false, error: 'MISSING_FRIEND' });

  const store = readStore();
  const resolved = resolveHouseAddress(store, houseAddress);
  if (!resolved) return res.status(404).json({ ok: false, error: 'HOUSE_NOT_FOUND' });

  const auth = verifyHouseAuth(req, resolved.house);
  if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });

  let friendResolved = null;
  if (friendHouseAddress) friendResolved = resolveHouseAddress(store, friendHouseAddress);
  if (!friendResolved && friendErc8004Id) friendResolved = resolveHouseByErc8004Id(store, friendErc8004Id);
  if (!friendResolved) return res.status(404).json({ ok: false, error: 'FRIEND_NOT_FOUND' });
  if (friendResolved.houseId === resolved.houseId) return res.status(400).json({ ok: false, error: 'SELF_FRIEND' });

  const label = normalizePonyFriendLabel(req.body?.label);
  const friends = ensureHousePonyFriends(resolved.house);
  const existing = friends.find((f) => f && f.houseId === friendResolved.houseId) || null;
  if (existing) {
    if (label) existing.label = label;
    if (!existing.erc8004Id && friendResolved.erc8004Id) existing.erc8004Id = friendResolved.erc8004Id;
  } else {
    friends.unshift({
      houseId: friendResolved.houseId,
      erc8004Id: friendResolved.erc8004Id || null,
      label: label || null,
      addedAt: nowIso()
    });
  }

  writeStore(store);
  return res.json({ ok: true, houseId: resolved.houseId, friend: { houseId: friendResolved.houseId } });
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
  const refs = normalizeRelayHints(req.body?.refs, 16);
  let refsMeta = [];
  const kind = typeof req.body?.kind === 'string' && req.body.kind.trim() ? req.body.kind.trim() : 'vault.append.v1';
  try {
    normalizedCiphertext = normalizePonyCiphertext(req.body?.ciphertext, req.body?.body, { allowCustomAlg: true });
    normalizedPostage = normalizePonyPostage(req.body?.postage);
    refsMeta = normalizeVaultRefsMeta(refs, req.body?.refsMeta, 16, MAX_VAULT_REF_BYTES);
    ponyPostageVerifier.verify({
      postage: normalizedPostage,
      context: {
        store,
        fromHouseId: resolved.houseId,
        toHouseId: resolved.houseId,
        requirePostageAnonymous: false
      }
    });
  } catch (err) {
    const payload = { ok: false, error: String(err?.message || 'INVALID_VAULT_EVENT') };
    if (typeof err?.receiptId === 'string' && err.receiptId) payload.receiptId = err.receiptId;
    if (payload.error === 'POSTAGE_RECEIPT_HOUSE_MISMATCH') {
      if (typeof err?.receiptToHouseId === 'string') payload.receiptToHouseId = err.receiptToHouseId;
      if (typeof err?.expectedToHouseId === 'string') payload.expectedToHouseId = err.expectedToHouseId;
    }
    return res.status(400).json(payload);
  }

  const events = ensureHouseVault(resolved.house);
  const prevHash = events.length ? events[events.length - 1].hash || null : null;
  const entry = {
    id: `pv_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    kind,
    houseId: resolved.houseId,
    envelope: { ciphertext: normalizedCiphertext },
    refs,
    refsMeta,
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

function buildErc8004ClaimMessage({ agentId, nonce }) {
  return [
    'Agent Town ERC-8004 Claim',
    `agentId: ${agentId}`,
    `nonce: ${nonce}`
  ].join('\n');
}

function normalizeEvmAddress(value) {
  if (typeof value !== 'string') return null;
  const v = value.trim().toLowerCase();
  if (!/^0x[a-f0-9]{40}$/.test(v)) return null;
  return v;
}

function normalizeSolanaAddress(value) {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  if (!v) return null;
  const bytes = base58Decode(v);
  if (!bytes || bytes.length !== 32) return null;
  return v;
}

function guessClaimChain(value) {
  const v = typeof value === 'string' ? value.trim() : '';
  if (!v) return null;
  if (/^solana:/i.test(v)) return 'solana';
  if (/^[1-9A-HJ-NP-Za-km-z]{32,64}$/.test(v)) return 'solana';
  return 'evm';
}

function listErc8004ClaimAliases(reservation) {
  if (!reservation || typeof reservation !== 'object') return [];
  const aliases = new Set();
  if (typeof reservation.key === 'string' && reservation.key.trim()) aliases.add(reservation.key.trim());
  const claimAliases = reservation.meta?.claimAliases;
  if (Array.isArray(claimAliases)) {
    for (const alias of claimAliases) {
      if (typeof alias !== 'string') continue;
      const clean = alias.trim();
      if (!clean) continue;
      aliases.add(clean);
    }
  }
  if (typeof reservation.meta?.agentId === 'string' && reservation.meta.agentId.trim()) {
    aliases.add(reservation.meta.agentId.trim());
  }
  return [...aliases];
}

function reservationAliasMatchesInput(alias, input) {
  if (alias === input) return true;

  // EVM IDs are case-insensitive; Solana asset IDs remain case-sensitive.
  const evmLike = alias.startsWith('evm:')
    || /^\d+:/.test(alias)
    || alias.includes('0x')
    || input.startsWith('evm:')
    || /^\d+:/.test(input)
    || input.includes('0x');
  if (!evmLike) return false;
  return alias.toLowerCase() === input.toLowerCase();
}

function resolveErc8004ClaimReservation(store, inputAgentId) {
  const cleanInput = typeof inputAgentId === 'string' ? inputAgentId.trim() : '';
  if (!cleanInput) return null;

  const candidates = (store.reservations || []).filter(
    (r) => r && r.kind === 'erc8004' && (r.status || 'reserved') !== 'deleted',
  );

  for (const reservation of candidates) {
    const aliases = listErc8004ClaimAliases(reservation);
    if (aliases.some((alias) => reservationAliasMatchesInput(alias, cleanInput))) {
      const chain = reservation.meta?.claimChain || guessClaimChain(reservation.key);
      const ownerRaw = reservation.meta?.ownerAddress;
      const ownerAddress = chain === 'evm'
        ? normalizeEvmAddress(ownerRaw)
        : chain === 'solana'
          ? normalizeSolanaAddress(ownerRaw)
          : null;
      if (!ownerAddress) return null;
      const canonicalAgentId = typeof reservation.meta?.agentId === 'string' && reservation.meta.agentId.trim()
        ? reservation.meta.agentId.trim()
        : reservation.key;
      return {
        reservation,
        claimChain: chain,
        ownerAddress,
        canonicalAgentId
      };
    }
  }
  return null;
}

function verifyEvmClaimSignature({ message, signature, address }) {
  const expected = normalizeEvmAddress(address);
  if (!expected) return false;
  let recovered = '';
  try {
    recovered = verifyMessage(message, signature) || '';
  } catch {
    return false;
  }
  return recovered.toLowerCase() === expected;
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
    writeStore({
      signups: [],
      shares: [],
      publicTeams: [],
      houses: [],
      claims: [],
      reservations: [],
      milestones: [],
      rewardsLedger: [],
      anchors: [],
      inbox: []
    });
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
    (r) => r && unlockAddressForLookup(r.unlock) === address
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

app.get('/api/claim/erc8004/nonce', (req, res) => {
  const s = ensureHumanSession(req, res);
  const agentId = typeof req.query?.agentId === 'string' ? req.query.agentId.trim() : '';
  const forceRealInTest = String(req.query?.real || '').trim() === '1';
  if (!agentId) return res.status(400).json({ ok: false, error: 'MISSING_AGENT_ID' });

  const nonce = randomHex(16);
  const testBypass = process.env.NODE_ENV === 'test'
    && !forceRealInTest
    && String(process.env.ENABLE_REAL_ERC8004_CLAIMS_IN_TEST || '').trim() !== 'true';

  if (testBypass) {
    const message = buildErc8004ClaimMessage({ agentId, nonce });
    s.claim = s.claim || {};
    s.claim.erc8004 = {
      agentId,
      nonce,
      message,
      claimChain: null,
      ownerAddress: null,
      reservedHouseId: null,
      reservationId: null,
      createdAt: Date.now(),
      testBypass: true
    };
    return res.json({ ok: true, nonce, message, claimChain: null, agentId });
  }

  const store = readStore();
  const resolved = resolveErc8004ClaimReservation(store, agentId);
  if (!resolved || !resolved.reservation) {
    return res.status(404).json({ ok: false, error: 'RESERVATION_REQUIRED' });
  }
  const reservationStatus = resolved.reservation.status || 'reserved';
  if (reservationStatus === 'claimed') {
    return res.status(409).json({ ok: false, error: 'CLAIM_UNAVAILABLE' });
  }

  const message = buildErc8004ClaimMessage({
    agentId: resolved.canonicalAgentId,
    nonce
  });

  s.claim = s.claim || {};
  s.claim.erc8004 = {
    agentId: resolved.canonicalAgentId,
    nonce,
    message,
    claimChain: resolved.claimChain,
    ownerAddress: resolved.ownerAddress,
    reservedHouseId: resolved.reservation.houseId || null,
    reservationId: resolved.reservation.id || null,
    createdAt: Date.now(),
    testBypass: false
  };

  res.json({
    ok: true,
    nonce,
    message,
    agentId: resolved.canonicalAgentId,
    claimChain: resolved.claimChain
  });
});

app.post('/api/claim/erc8004/verify', (req, res) => {
  const s = ensureHumanSession(req, res);
  const agentId = typeof req.body?.agentId === 'string' ? req.body.agentId.trim() : '';
  const nonce = typeof req.body?.nonce === 'string' ? req.body.nonce.trim() : '';
  const signature = typeof req.body?.signature === 'string' ? req.body.signature.trim() : '';

  if (!agentId) return res.status(400).json({ ok: false, error: 'MISSING_AGENT_ID' });
  if (!nonce) return res.status(400).json({ ok: false, error: 'MISSING_NONCE' });
  if (!signature) return res.status(400).json({ ok: false, error: 'MISSING_SIGNATURE' });

  const expected = s.claim?.erc8004;
  if (!expected) {
    return res.status(400).json({ ok: false, error: 'NO_PENDING_CLAIM' });
  }
  if (!reservationAliasMatchesInput(expected.agentId || '', agentId)) {
    return res.status(400).json({ ok: false, error: 'NO_PENDING_CLAIM' });
  }
  if (expected.nonce !== nonce) {
    return res.status(400).json({ ok: false, error: 'NONCE_MISMATCH' });
  }

  const message = typeof expected.message === 'string' && expected.message
    ? expected.message
    : buildErc8004ClaimMessage({ agentId, nonce });
  const claimedAddress = typeof req.body?.address === 'string' ? req.body.address.trim() : '';
  const claimChain = expected.claimChain;

  if (expected.testBypass === true) {
    s.signup = s.signup || {};
    s.signup.complete = true;
    s.signup.mode = 'claim';
    s.signup.address = null;
    s.claim.erc8004.address = claimedAddress || null;
    s.claim.erc8004.claimChain = null;
    s.claim.erc8004.verifiedAt = Date.now();
    return res.json({ ok: true, verified: true, nextUrl: '/create' });
  }

  if (!claimChain || !expected.ownerAddress) {
    return res.status(400).json({ ok: false, error: 'NO_PENDING_CLAIM' });
  }
  if (!claimedAddress) return res.status(400).json({ ok: false, error: 'MISSING_ADDRESS' });

  let verified = false;
  if (claimChain === 'evm') {
    const owner = normalizeEvmAddress(expected.ownerAddress);
    const address = normalizeEvmAddress(claimedAddress);
    if (!owner || !address || owner !== address) {
      return res.status(401).json({ ok: false, error: 'OWNER_MISMATCH' });
    }
    verified = verifyEvmClaimSignature({ message, signature, address });
  } else if (claimChain === 'solana') {
    const owner = normalizeSolanaAddress(expected.ownerAddress);
    const address = normalizeSolanaAddress(claimedAddress);
    if (!owner || !address || owner !== address) {
      return res.status(401).json({ ok: false, error: 'OWNER_MISMATCH' });
    }
    verified = verifySolanaSignature(address, message, signature);
  } else {
    return res.status(400).json({ ok: false, error: 'UNSUPPORTED_CLAIM_CHAIN' });
  }
  if (!verified) return res.status(401).json({ ok: false, error: 'BAD_SIGNATURE' });
  if (s.signup.complete && s.signup.mode && s.signup.mode !== 'claim') {
    return res.status(409).json({ ok: false, error: 'ALREADY_SIGNED_UP' });
  }

  const store = readStore();
  const reservation = (store.reservations || []).find(
    (r) => r && r.kind === 'erc8004' && r.id === expected.reservationId,
  );
  if (!reservation) return res.status(404).json({ ok: false, error: 'RESERVATION_REQUIRED' });
  if ((reservation.status || 'reserved') === 'claimed') {
    return res.status(409).json({ ok: false, error: 'CLAIM_UNAVAILABLE' });
  }

  const now = nowIso();
  reservation.status = 'verified';
  reservation.verifiedAt = now;

  store.claims = Array.isArray(store.claims) ? store.claims : [];
  const claimAddressCmp = claimChain === 'evm' ? claimedAddress.toLowerCase() : claimedAddress;
  const existingClaim = store.claims.find((c) =>
    c
      && c.kind === 'erc8004'
      && c.reservationId === reservation.id
      && typeof c.address === 'string'
      && (claimChain === 'evm' ? c.address.toLowerCase() : c.address) === claimAddressCmp,
  );
  if (!existingClaim) {
    store.claims.push({
      id: `cl_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      createdAt: now,
      kind: 'erc8004',
      claimChain,
      agentId: expected.agentId,
      address: claimedAddress,
      reservationId: reservation.id,
      houseId: reservation.houseId
    });
  }
  writeStore(store);

  // Bind this session to the reserved house from the verified claim.
  s.reservedHouseId = reservation.houseId;

  s.signup = s.signup || {};
  s.signup.complete = true;
  s.signup.mode = 'claim';
  s.signup.address = null;
  s.claim.erc8004.address = claimedAddress;
  s.claim.erc8004.claimChain = claimChain;
  s.claim.erc8004.reservedHouseId = reservation.houseId;

  s.claim.erc8004.verifiedAt = Date.now();
  res.json({
    ok: true,
    verified: true,
    claimChain,
    houseId: reservation.houseId,
    nextUrl: `/create?reserved=${encodeURIComponent(reservation.houseId)}`
  });
});

// --- X claim (public post challenge) ---
app.get('/api/claim/x/challenge', (req, res) => {
  const s = ensureHumanSession(req, res);
  const handle = normalizeXHandle(req.query?.handle);
  if (!handle) return res.status(400).json({ ok: false, error: 'INVALID_HANDLE' });

  const store = readStore();
  const key = `@${handle}`;
  const reservation = (store.reservations || []).find((r) => r && r.kind === 'x' && r.key === key);
  if (!reservation) return res.status(404).json({ ok: false, error: 'RESERVATION_REQUIRED' });

  const nonce = randomHex(12);
  const challenge = `AgentTown X Claim\nhandle: @${handle}\nnonce: ${nonce}`;
  const ttlMs = 30 * 60 * 1000;
  s.claim = s.claim || {};
  s.claim.x = {
    handle,
    nonce,
    challenge,
    createdAt: Date.now(),
    expiresAt: Date.now() + ttlMs,
    reservedHouseId: reservation.houseId
  };
  res.json({ ok: true, handle, nonce, challenge, expiresInMs: ttlMs });
});

app.post('/api/claim/x/verify', async (req, res) => {
  const s = ensureHumanSession(req, res);
  const raw = typeof req.body?.handle === 'string' ? req.body.handle.trim() : '';
  const handle = raw.replace(/^@/, '').toLowerCase();
  const nonce = typeof req.body?.nonce === 'string' ? req.body.nonce.trim() : '';
  const tweetUrl = typeof req.body?.tweetUrl === 'string' ? req.body.tweetUrl.trim() : '';

  if (!handle) return res.status(400).json({ ok: false, error: 'MISSING_HANDLE' });
  if (!nonce) return res.status(400).json({ ok: false, error: 'MISSING_NONCE' });
  if (!tweetUrl) return res.status(400).json({ ok: false, error: 'MISSING_TWEET_URL' });

  const pending = s.claim?.x;
  if (!pending || pending.handle !== handle) return res.status(400).json({ ok: false, error: 'NO_PENDING_CLAIM' });
  if (pending.nonce !== nonce) return res.status(400).json({ ok: false, error: 'NONCE_MISMATCH' });
  if (pending.expiresAt && Date.now() > pending.expiresAt) return res.status(400).json({ ok: false, error: 'CHALLENGE_EXPIRED' });

  let u;
  try {
    u = new URL(tweetUrl);
  } catch {
    return res.status(400).json({ ok: false, error: 'INVALID_TWEET_URL' });
  }
  if (!/^https?:$/.test(u.protocol)) return res.status(400).json({ ok: false, error: 'INVALID_TWEET_URL' });
  if (!/(^|\.)x\.com$/.test(u.hostname) && !/(^|\.)twitter\.com$/.test(u.hostname)) {
    return res.status(400).json({ ok: false, error: 'INVALID_TWEET_URL' });
  }

  const html = await new Promise((resolve, reject) => {
    const getter = u.protocol === 'https:' ? https.get : http.get;
    const req2 = getter(
      {
        hostname: u.hostname,
        path: u.pathname + u.search,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AgentTownBot/1.0; +https://github.com/Agent-Town)'
        },
        timeout: 10_000
      },
      (r) => {
        let buf = '';
        r.setEncoding('utf8');
        r.on('data', (chunk) => (buf += chunk));
        r.on('end', () => resolve({ status: r.statusCode || 0, body: buf }));
      }
    );
    req2.on('error', reject);
    req2.on('timeout', () => {
      req2.destroy(new Error('timeout'));
    });
  }).catch(() => null);

  if (!html || html.status < 200 || html.status >= 400) {
    return res.status(502).json({ ok: false, error: 'TWEET_FETCH_FAILED' });
  }

  const body = html.body || '';
  const challenge = pending.challenge;
  if (!body.includes(challenge)) {
    return res.status(401).json({ ok: false, error: 'CHALLENGE_NOT_FOUND' });
  }

  // Best-effort author check: require the handle to appear in the URL path.
  // (This is not perfect; can be tightened later with API/oEmbed.)
  const pathLower = u.pathname.toLowerCase();
  if (!pathLower.includes(`/${handle}/status/`)) {
    return res.status(401).json({ ok: false, error: 'HANDLE_MISMATCH' });
  }

  const store = readStore();

  const key = `@${handle}`;
  const reservation = (store.reservations || []).find((r) => r && r.kind === 'x' && r.key === key);
  if (!reservation) return res.status(404).json({ ok: false, error: 'RESERVATION_REQUIRED' });

  // Record durable claim (no expiry).
  store.claims = Array.isArray(store.claims) ? store.claims : [];
  store.claims.push({
    id: `cl_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    createdAt: nowIso(),
    kind: 'x',
    handle,
    tweetUrl,
    challenge
  });

  // Update reservation
  reservation.status = 'verified';
  reservation.verifiedAt = nowIso();

  // Session binds this verification to a reserved house id.
  s.reservedHouseId = reservation.houseId;

  emitMilestone(store, {
    houseId: reservation.houseId,
    event: 'CLAIM_VERIFIED',
    source: 'human',
    value: 1,
    meta: { kind: 'x', handle }
  });

  writeStore(store);

  s.signup = s.signup || {};
  s.signup.complete = true;
  s.signup.mode = 'x';
  s.signup.handle = handle;

  s.claim.x.verifiedAt = Date.now();
  res.json({ ok: true, verified: true, houseId: reservation.houseId, nextUrl: `/create?reserved=${encodeURIComponent(reservation.houseId)}` });
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
  let ponyInboxRegistration = null;

  if (!houseId || !housePubKey) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
  if (houseId !== housePubKey) return res.status(400).json({ ok: false, error: 'HOUSE_ID_MISMATCH' });
  if (!nonce) return res.status(400).json({ ok: false, error: 'MISSING_NONCE' });
  if (!houseAuthKey) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_AUTH' });
  const authKeyBytes = decodeB64(houseAuthKey);
  if (!authKeyBytes || authKeyBytes.length < 16) {
    return res.status(400).json({ ok: false, error: 'INVALID_HOUSE_AUTH' });
  }
  const tokenMode = s.signup?.mode === 'token';
  const claimMode = s.signup?.mode === 'claim';
  const soloMode = tokenMode || claimMode;
  if (!soloMode) {
    if (!s.houseCeremony?.humanCommit || !s.houseCeremony?.agentCommit
      || !s.houseCeremony?.humanRevealSealed || !s.houseCeremony?.agentRevealSealed) {
      return res.status(403).json({ ok: false, error: 'CEREMONY_INCOMPLETE' });
    }
  }
 
  const enforcedReserved = (s && (s.reservedHouseId || s.claim?.x?.reservedHouseId)) || null;
  if (enforcedReserved && enforcedReserved !== houseId) {
    return res.status(403).json({ ok: false, error: 'RESERVED_HOUSE_MISMATCH' });
  }
  if (claimMode && s.claim?.erc8004?.claimChain === 'solana' && typeof s.claim?.erc8004?.address === 'string') {
    const expectedAddress = normalizeSolanaAddress(s.claim.erc8004.address);
    const unlockAddress = normalizeSolanaAddress(unlockAddressForLookup(unlock));
    if (expectedAddress && unlockAddress !== expectedAddress) {
      return res.status(403).json({ ok: false, error: 'CLAIM_ADDRESS_MISMATCH' });
    }
  }
  if (s.houseCeremony?.houseId && s.houseCeremony.houseId !== houseId) {
    return res.status(409).json({ ok: false, error: 'HOUSE_ALREADY_EXISTS' });
  }

  // Converged for today's publish: ceremony-only houses.
  if (keyMode !== 'ceremony') {
    return res.status(400).json({ ok: false, error: 'CEREMONY_ONLY' });
  }

  try {
    ponyInboxRegistration = normalizePonyInboxRegistration({
      ponyInboxPub: req.body?.ponyInboxPub,
      ponyInboxPrivWrap: req.body?.ponyInboxPrivWrap
    }, { required: false });
  } catch (err) {
    return res.status(400).json({ ok: false, error: String(err?.message || 'INVALID_PONY_INBOX_KEY') });
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
    entries: [],
    ponyInbox: ponyInboxRegistration
      ? {
        version: ponyInboxRegistration.version,
        pub: ponyInboxRegistration.pub,
        privWrap: ponyInboxRegistration.privWrap,
        createdAt: nowIso(),
        updatedAt: nowIso()
      }
      : null
  });

  if (enforcedReserved) {
    const reservation = (store.reservations || []).find((r) => r && r.houseId === houseId);
    if (reservation) {
      reservation.status = 'claimed';
      reservation.verifiedAt = reservation.verifiedAt || nowIso();
      reservation.claimedAt = nowIso();
    }
  }

  emitMilestone(store, {
    houseId,
    event: 'CEREMONY_COMPLETED',
    source: 'human',
    value: 1,
    meta: { reserved: !!enforcedReserved }
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
  let ponyInboxRegistration = null;

  if (!teamCode) return res.status(400).json({ ok: false, error: 'MISSING_TEAM_CODE' });
  const s = getSessionByTeamCode(teamCode);
  if (!s) return res.status(404).json({ ok: false, error: 'TEAM_NOT_FOUND' });
  if (s.flow !== 'agent_solo') return res.status(403).json({ ok: false, error: 'AGENT_SOLO_ONLY' });
  if (!s.houseCeremony?.agentCommit) return res.status(403).json({ ok: false, error: 'CEREMONY_INCOMPLETE' });

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

  try {
    ponyInboxRegistration = normalizePonyInboxRegistration({
      ponyInboxPub: req.body?.ponyInboxPub,
      ponyInboxPrivWrap: req.body?.ponyInboxPrivWrap
    }, { required: false });
  } catch (err) {
    return res.status(400).json({ ok: false, error: String(err?.message || 'INVALID_PONY_INBOX_KEY') });
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
    entries: [],
    ponyInbox: ponyInboxRegistration
      ? {
        version: ponyInboxRegistration.version,
        pub: ponyInboxRegistration.pub,
        privWrap: ponyInboxRegistration.privWrap,
        createdAt: nowIso(),
        updatedAt: nowIso()
      }
      : null
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

app.get('/api/house/:id/rewards', (req, res) => {
  const houseId = typeof req.params?.id === 'string' ? req.params.id.trim() : '';
  if (!houseId) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
  const store = readStore();
  const house = store.houses.find((r) => r.id === houseId);
  if (!house) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  const auth = verifyHouseAuth(req, house);
  if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });

  const summary = computeRewardsSummary(store, houseId);
  res.json({ ok: true, ...summary });
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

  const ctLen = typeof ciphertext.ct === 'string' ? ciphertext.ct.length : 0;
  if (ctLen >= 32) {
    emitMilestone(store, {
      houseId,
      event: 'HOUSE_APPEND',
      source: 'human',
      value: 1,
      meta: { ctLen }
    });
  }
  writeStore(store);
  res.json({ ok: true });
});

// --- Static + routes ---
app.use(
  express.static(PUBLIC_DIR, {
    index: false,
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

app.get('/', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, HOME_ROUTE_FILE)));
app.get('/start', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'start.html')));
app.get('/app', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'index.html')));
app.get('/create', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'create.html')));
app.get('/inbox/:houseId', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'inbox.html')));
app.get('/claim', (_req, res) => res.redirect(302, '/claim-wallet'));
app.get('/claim-wallet', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'claim-wallet.html')));
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
app.get('*', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, HOME_ROUTE_FILE)));

const port = Number(process.env.PORT || 4173);
app.listen(port, () => {
  console.log(`[agent-town] http://localhost:${port}`);
});
