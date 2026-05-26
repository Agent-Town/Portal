const crypto = require('crypto');

// Prototype/ephemeral process-local CSRF token store; release storage is documented in docs/technical/WORLD_GRID_STATE_MODEL.md.
const tokensByOwner = new Map();

const DEFAULT_TOKEN_TTL_MS = 60 * 60 * 1000;
const MAX_TOKENS_PER_OWNER = 10;

function truthy(value) {
  return ['1', 'true', 'yes', 'on', 'enabled'].includes(String(value || '').trim().toLowerCase());
}

function falsey(value) {
  return ['0', 'false', 'no', 'off', 'disabled'].includes(String(value || '').trim().toLowerCase());
}

function readPositiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : fallback;
}

function worldGridCsrfRequired(env = process.env) {
  if (Object.prototype.hasOwnProperty.call(env, 'WORLD_GRID_CSRF_REQUIRED')) {
    return truthy(env.WORLD_GRID_CSRF_REQUIRED) && !falsey(env.WORLD_GRID_CSRF_REQUIRED);
  }
  return env.NODE_ENV === 'production';
}

function ownerKey(owner = {}) {
  return String(owner.ownerAccountId || owner.regionId || owner.pairId || '').trim();
}

function tokenTtlMs(env = process.env) {
  return readPositiveInteger(env.WORLD_GRID_CSRF_TOKEN_TTL_MS, DEFAULT_TOKEN_TTL_MS);
}

function pruneOwnerTokens(owner, nowMs = Date.now()) {
  const key = ownerKey(owner);
  if (!key) return [];
  const records = (tokensByOwner.get(key) || [])
    .filter((record) => record.expiresAtMs > nowMs)
    .slice(-MAX_TOKENS_PER_OWNER);
  if (records.length) tokensByOwner.set(key, records);
  else tokensByOwner.delete(key);
  return records;
}

function issueWorldGridCsrfToken(owner, { nowMs = Date.now(), env = process.env } = {}) {
  const key = ownerKey(owner);
  if (!key) {
    const error = new Error('CSRF_UNAVAILABLE');
    error.details = { reason: 'OWNER_UNAVAILABLE' };
    throw error;
  }
  const token = `wgcsrf_${crypto.randomBytes(24).toString('hex')}`;
  const expiresAtMs = nowMs + tokenTtlMs(env);
  const records = pruneOwnerTokens(owner, nowMs);
  records.push({ token, expiresAtMs, createdAtMs: nowMs });
  tokensByOwner.set(key, records.slice(-MAX_TOKENS_PER_OWNER));
  return { token, expiresAtMs };
}

function readWorldGridCsrfToken(req = null) {
  return String(req?.get?.('x-world-grid-csrf') || req?.body?.csrfToken || '').trim();
}

function requireWorldGridCsrfToken(req = null, owner = {}, { env = process.env, nowMs = Date.now() } = {}) {
  if (!worldGridCsrfRequired(env)) return true;
  const token = readWorldGridCsrfToken(req);
  if (!token) {
    const error = new Error('CSRF_REQUIRED');
    error.details = { reason: 'MISSING_WORLD_GRID_CSRF_TOKEN' };
    throw error;
  }
  const records = pruneOwnerTokens(owner, nowMs);
  const found = records.some((record) => record.token === token);
  if (!found) {
    const error = new Error('CSRF_INVALID');
    error.details = { reason: 'WORLD_GRID_CSRF_TOKEN_INVALID_OR_EXPIRED' };
    throw error;
  }
  return true;
}

function worldGridCsrfTokenCount() {
  return [...tokensByOwner.values()].reduce((sum, records) => sum + records.length, 0);
}

module.exports = {
  issueWorldGridCsrfToken,
  requireWorldGridCsrfToken,
  worldGridCsrfRequired,
  worldGridCsrfTokenCount
};
