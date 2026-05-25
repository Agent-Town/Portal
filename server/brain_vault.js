const crypto = require('crypto');
const express = require('express');

const BRAIN_VAULT_SCHEMA = 'agent-town-brain-vault@1';
const BRAIN_VAULT_MODE = 'zero-knowledge-passphrase';
const MAX_CIPHERTEXT_BYTES = 128 * 1024;
const MAX_METADATA_BYTES = 8 * 1024;
const MAX_BACKUP_BYTES = 24 * 1024;

const SECRET_VALUE_RE = /\b(sk-[a-z0-9_-]{8,}|oauth[-_ ]?token|bearer\s+[a-z0-9._-]{8,})\b/i;
const ALLOWED_SECRET_STATUS_KEYS = new Set(['apikeyset', 'credentialpresent']);

function sha256Hex(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex');
}

function stableJsonBytes(value) {
  return Buffer.byteLength(JSON.stringify(value || null), 'utf8');
}

function nowMs() {
  return Date.now();
}

function safeString(value, max = 240) {
  const text = typeof value === 'string' ? value.trim() : '';
  return text.slice(0, max);
}

function isForbiddenSecretKey(key) {
  const normalized = String(key || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!normalized || ALLOWED_SECRET_STATUS_KEYS.has(normalized)) return false;
  return (
    normalized === 'apikey'
    || normalized === 'secret'
    || normalized === 'token'
    || normalized === 'credential'
    || normalized === 'access'
    || normalized === 'refresh'
    || normalized === 'password'
    || normalized === 'privatekey'
    || normalized.endsWith('apikey')
    || normalized.endsWith('secret')
    || normalized.endsWith('token')
    || normalized.endsWith('credential')
    || normalized.endsWith('password')
    || normalized.endsWith('privatekey')
  );
}

function isCanonicalBase64(value) {
  const text = safeString(value, MAX_CIPHERTEXT_BYTES * 2);
  if (!text || !/^[A-Za-z0-9+/]+={0,2}$/.test(text) || text.length % 4 !== 0) return false;
  try {
    const bytes = Buffer.from(text, 'base64');
    return bytes.length > 0 && bytes.toString('base64') === text;
  } catch {
    return false;
  }
}

function base64ByteLength(value) {
  if (!isCanonicalBase64(value)) return 0;
  return Buffer.from(value, 'base64').length;
}

function assertNoPlaintextSecret(value, path = 'payload') {
  if (value === null || value === undefined) return;
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) assertNoPlaintextSecret(value[i], `${path}[${i}]`);
    return;
  }
  if (typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (isForbiddenSecretKey(key)) {
        throw Object.assign(new Error('PLAINTEXT_SECRET_FIELD'), { path: `${path}.${key}` });
      }
      assertNoPlaintextSecret(child, `${path}.${key}`);
    }
    return;
  }
  if (typeof value === 'string' && SECRET_VALUE_RE.test(value)) {
    throw Object.assign(new Error('PLAINTEXT_SECRET_VALUE'), { path });
  }
}

function normalizeVaultMetadata(raw = {}) {
  const metadata = raw && typeof raw === 'object' ? raw : {};
  assertNoPlaintextSecret(metadata, 'metadata');
  const out = {
    provider: safeString(metadata.provider, 64),
    model: safeString(metadata.model || metadata.modelId, 160),
    modelRef: safeString(metadata.modelRef, 220),
    authMode: safeString(metadata.authMode, 48) || 'api-key',
    label: safeString(metadata.label, 96) || 'Brain vault',
    apiKeySet: metadata.apiKeySet === true || metadata.credentialPresent === true,
    restoredActsAutomatically: false
  };
  if (!out.provider) throw new Error('MISSING_VAULT_PROVIDER');
  if (!out.model) throw new Error('MISSING_VAULT_MODEL');
  if (!out.modelRef) out.modelRef = `${out.provider}/${out.model}`;
  if (stableJsonBytes(out) > MAX_METADATA_BYTES) throw new Error('VAULT_METADATA_TOO_LARGE');
  return out;
}

function normalizeCiphertext(raw = {}) {
  const ciphertext = raw && typeof raw === 'object' ? raw : {};
  const alg = safeString(ciphertext.alg, 64);
  const iv = safeString(ciphertext.iv, 4096);
  const ct = safeString(ciphertext.ct, MAX_CIPHERTEXT_BYTES * 2);
  const salt = safeString(ciphertext.salt, 4096);
  if (alg !== 'AES-GCM' && alg !== 'AES-256-GCM') throw new Error('UNSUPPORTED_VAULT_CIPHER');
  if (!isCanonicalBase64(iv) || base64ByteLength(iv) < 8 || base64ByteLength(iv) > 32) {
    throw new Error('INVALID_VAULT_IV');
  }
  if (!isCanonicalBase64(ct) || base64ByteLength(ct) < 17 || base64ByteLength(ct) > MAX_CIPHERTEXT_BYTES) {
    throw new Error('INVALID_VAULT_CIPHERTEXT');
  }
  if (!isCanonicalBase64(salt) || base64ByteLength(salt) < 8 || base64ByteLength(salt) > 64) {
    throw new Error('INVALID_VAULT_SALT');
  }
  const kdf = ciphertext.kdf && typeof ciphertext.kdf === 'object' ? ciphertext.kdf : {};
  const iterations = Number(kdf.iterations || ciphertext.iterations || 0);
  if (!Number.isFinite(iterations) || iterations < 10_000 || iterations > 1_000_000) {
    throw new Error('INVALID_VAULT_KDF');
  }
  return {
    alg,
    iv,
    ct,
    salt,
    kdf: {
      name: 'PBKDF2-SHA256',
      hash: 'SHA-256',
      iterations
    }
  };
}

function normalizeStringArray(value, maxItems = 12, maxLen = 160) {
  if (!Array.isArray(value)) return [];
  const out = [];
  for (const item of value) {
    const text = safeString(item, maxLen);
    if (text) out.push(text);
    if (out.length >= maxItems) break;
  }
  return out;
}

function normalizeSafeSettings(value = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  assertNoPlaintextSecret(value, 'agentBackup.safeSettings');
  const out = {};
  for (const [key, raw] of Object.entries(value)) {
    const safeKey = safeString(key, 64);
    if (!safeKey || isForbiddenSecretKey(safeKey)) continue;
    if (typeof raw === 'boolean' || typeof raw === 'number') {
      out[safeKey] = raw;
    } else if (typeof raw === 'string') {
      const text = safeString(raw, 180);
      if (text && !SECRET_VALUE_RE.test(text)) out[safeKey] = text;
    }
  }
  return out;
}

function normalizeAgentBackup(raw = {}) {
  const backup = raw && typeof raw === 'object' ? raw : {};
  assertNoPlaintextSecret(backup, 'agentBackup');
  const schemaVersion = Number(backup.schemaVersion || backup.v || 1);
  const out = {
    schemaVersion: Number.isFinite(schemaVersion) && schemaVersion > 0 ? Math.floor(schemaVersion) : 1,
    agentName: safeString(backup.agentName || backup.name || 'Clover', 96),
    packRefs: normalizeStringArray(backup.packRefs || backup.packs, 16, 180),
    memorySummary: safeString(backup.memorySummary, 1000),
    checkpointSummary: safeString(backup.checkpointSummary, 1000),
    safeSettings: normalizeSafeSettings(backup.safeSettings),
    migration: backup.migration && typeof backup.migration === 'object'
      ? {
          from: safeString(backup.migration.from, 80),
          to: safeString(backup.migration.to, 80)
        }
      : null,
    restoredActsAutomatically: false
  };
  if (stableJsonBytes(out) > MAX_BACKUP_BYTES) throw new Error('AGENT_BACKUP_TOO_LARGE');
  return out;
}

function normalizeBrainVaultEnvelope(raw = {}) {
  const payload = raw && typeof raw === 'object' ? raw : {};
  const schema = safeString(payload.schema || payload.kind);
  const vaultMode = safeString(payload.vaultMode || payload.mode);
  if (schema && schema !== BRAIN_VAULT_SCHEMA) throw new Error('UNSUPPORTED_VAULT_SCHEMA');
  if (vaultMode && vaultMode !== BRAIN_VAULT_MODE) throw new Error('UNSUPPORTED_VAULT_MODE');
  return {
    schema: BRAIN_VAULT_SCHEMA,
    vaultMode: BRAIN_VAULT_MODE,
    metadata: normalizeVaultMetadata(payload.metadata || {}),
    ciphertext: normalizeCiphertext(payload.ciphertext || {}),
    agentBackup: normalizeAgentBackup(payload.agentBackup || {}),
    unlockRequired: true,
    restoredActsAutomatically: false
  };
}

function redactSecrets(value) {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(redactSecrets);
  if (typeof value === 'object') {
    const out = {};
    for (const [key, child] of Object.entries(value)) {
      if (isForbiddenSecretKey(key) || key === 'ct') {
        out[key] = '[REDACTED]';
      } else {
        out[key] = redactSecrets(child);
      }
    }
    return out;
  }
  if (typeof value === 'string' && SECRET_VALUE_RE.test(value)) return '[REDACTED]';
  return value;
}

function publicBrainVaultView(record, { includeSealed = false } = {}) {
  if (!record) {
    return {
      available: false,
      unlockRequired: true,
      restoredActsAutomatically: false
    };
  }
  const view = {
    available: true,
    schema: BRAIN_VAULT_SCHEMA,
    vaultMode: BRAIN_VAULT_MODE,
    metadata: redactSecrets(record.metadata || {}),
    agentBackup: redactSecrets(record.agentBackup || {}),
    createdAtMs: Number(record.createdAtMs || 0) || 0,
    updatedAtMs: Number(record.updatedAtMs || 0) || 0,
    unlockRequired: true,
    restoredActsAutomatically: false
  };
  if (includeSealed) {
    view.ciphertext = record.ciphertext || null;
  }
  return view;
}

function findVaultRecord(store, ownerHash) {
  const vaults = Array.isArray(store?.brainVaults) ? store.brainVaults : [];
  return vaults.find((entry) => entry && entry.ownerHash === ownerHash) || null;
}

function upsertVaultRecord(store, owner, envelope) {
  const ownerHash = sha256Hex(owner.key);
  const vaults = Array.isArray(store.brainVaults) ? store.brainVaults.slice() : [];
  const existing = vaults.find((entry) => entry && entry.ownerHash === ownerHash) || null;
  const timestamp = nowMs();
  const record = {
    id: existing?.id || `bv_${ownerHash.slice(0, 24)}`,
    ownerHash,
    ownerKind: owner.kind,
    schema: envelope.schema,
    vaultMode: envelope.vaultMode,
    metadata: envelope.metadata,
    ciphertext: envelope.ciphertext,
    agentBackup: envelope.agentBackup,
    createdAtMs: Number(existing?.createdAtMs || timestamp),
    updatedAtMs: timestamp,
    unlockRequired: true,
    restoredActsAutomatically: false
  };
  const next = vaults.filter((entry) => entry && entry.ownerHash !== ownerHash);
  next.unshift(record);
  store.brainVaults = next;
  return record;
}

function createBrainVaultRouter({ resolveOwner, readStore, writeStore }) {
  if (typeof resolveOwner !== 'function') throw new Error('MISSING_BRAIN_VAULT_OWNER_RESOLVER');
  const router = express.Router();

  router.get('/api/agent/lite/brain-vault', (req, res) => {
    const owner = resolveOwner(req, res);
    const includeSealed = String(req.query?.includeSealed || '').trim() === '1';
    const store = readStore();
    const record = findVaultRecord(store, sha256Hex(owner.key));
    res.json({
      ok: true,
      scope: { kind: owner.kind, localOnly: owner.localOnly === true },
      vault: publicBrainVaultView(record, { includeSealed })
    });
  });

  router.put('/api/agent/lite/brain-vault', (req, res) => {
    let owner;
    let envelope;
    try {
      owner = resolveOwner(req, res);
      envelope = normalizeBrainVaultEnvelope(req.body || {});
    } catch (error) {
      return res.status(400).json({
        ok: false,
        error: String(error?.message || 'INVALID_BRAIN_VAULT')
      });
    }

    const store = readStore();
    const record = upsertVaultRecord(store, owner, envelope);
    writeStore(store);
    res.json({
      ok: true,
      scope: { kind: owner.kind, localOnly: owner.localOnly === true },
      vault: publicBrainVaultView(record)
    });
  });

  router.delete('/api/agent/lite/brain-vault', (req, res) => {
    const owner = resolveOwner(req, res);
    const ownerHash = sha256Hex(owner.key);
    const store = readStore();
    const before = Array.isArray(store.brainVaults) ? store.brainVaults.length : 0;
    store.brainVaults = (Array.isArray(store.brainVaults) ? store.brainVaults : [])
      .filter((entry) => entry && entry.ownerHash !== ownerHash);
    writeStore(store);
    res.json({ ok: true, deleted: before !== store.brainVaults.length });
  });

  router.post('/api/agent/lite/brain-vault/unlock-confirmed', (req, res) => {
    const owner = resolveOwner(req, res);
    const store = readStore();
    const record = findVaultRecord(store, sha256Hex(owner.key));
    if (!record) return res.status(404).json({ ok: false, error: 'BRAIN_VAULT_NOT_FOUND' });
    const session = owner.session && typeof owner.session === 'object' ? owner.session : null;
    if (session) {
      session.lite = session.lite && typeof session.lite === 'object' ? session.lite : {};
      session.lite.brainVault = {
        unlockedAtMs: nowMs(),
        ownerKind: owner.kind,
        provider: record.metadata?.provider || null,
        model: record.metadata?.model || null,
        modelRef: record.metadata?.modelRef || null,
        explicitUnlock: true
      };
    }
    res.json({
      ok: true,
      unlock: {
        explicitUnlock: true,
        restoredActsAutomatically: false
      },
      vault: publicBrainVaultView(record)
    });
  });

  return router;
}

module.exports = {
  BRAIN_VAULT_MODE,
  BRAIN_VAULT_SCHEMA,
  assertNoPlaintextSecret,
  createBrainVaultRouter,
  normalizeAgentBackup,
  normalizeBrainVaultEnvelope,
  publicBrainVaultView,
  redactSecrets,
  sha256Hex
};
