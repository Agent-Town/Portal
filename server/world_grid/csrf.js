const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Prototype/ephemeral process-local CSRF token store; release storage is documented in docs/technical/WORLD_GRID_STATE_MODEL.md.
const tokensByOwner = new Map();
let durableSingleton = null;
let durableSingletonPath = '';

const WORLD_GRID_CSRF_SCHEMA_VERSION = 'agent-town.v5.world-grid.csrf.v1';
const WORLD_GRID_CSRF_MIGRATION_VERSION = 'world_grid_csrf_v1';

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

function tokenHash(token = '') {
  return `sha256:${crypto.createHash('sha256').update(String(token || ''), 'utf8').digest('hex')}`;
}

function ensureDurableSchema(db) {
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = NORMAL;');
  db.exec('PRAGMA busy_timeout = 5000;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS world_grid_csrf_tokens (
      owner_account_id TEXT NOT NULL,
      token_hash TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      migration_version TEXT NOT NULL,
      schema_version TEXT NOT NULL,
      PRIMARY KEY (owner_account_id, token_hash)
    );
    CREATE INDEX IF NOT EXISTS idx_world_grid_csrf_owner_created
      ON world_grid_csrf_tokens(owner_account_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_world_grid_csrf_expires
      ON world_grid_csrf_tokens(expires_at);
  `);
}

function parseTokenRow(row) {
  if (!row) return null;
  return {
    ownerAccountId: row.owner_account_id,
    tokenHash: row.token_hash,
    expiresAtMs: Number(row.expires_at),
    createdAtMs: Number(row.created_at),
    migrationVersion: row.migration_version,
    schemaVersion: row.schema_version
  };
}

function createWorldGridCsrfStore({ sqlitePath } = {}) {
  if (!sqlitePath || typeof sqlitePath !== 'string') {
    throw new Error('WORLD_GRID_CSRF_SQLITE_PATH_REQUIRED');
  }
  fs.mkdirSync(path.dirname(sqlitePath), { recursive: true });
  const { DatabaseSync } = require('node:sqlite');
  const db = new DatabaseSync(sqlitePath);
  ensureDurableSchema(db);
  const statements = {
    byOwnerHash: db.prepare(`
      SELECT *
      FROM world_grid_csrf_tokens
      WHERE owner_account_id = ? AND token_hash = ?
      LIMIT 1
    `),
    insert: db.prepare(`
      INSERT OR REPLACE INTO world_grid_csrf_tokens (
        owner_account_id, token_hash, expires_at, created_at,
        migration_version, schema_version
      ) VALUES (?, ?, ?, ?, ?, ?)
    `),
    listOwner: db.prepare(`
      SELECT *
      FROM world_grid_csrf_tokens
      WHERE owner_account_id = ?
      ORDER BY created_at DESC, token_hash ASC
    `),
    listAll: db.prepare(`
      SELECT *
      FROM world_grid_csrf_tokens
      ORDER BY owner_account_id ASC, created_at ASC
    `),
    deleteExpiredForOwner: db.prepare(`
      DELETE FROM world_grid_csrf_tokens
      WHERE owner_account_id = ? AND expires_at <= ?
    `),
    deleteOwnerHash: db.prepare(`
      DELETE FROM world_grid_csrf_tokens
      WHERE owner_account_id = ? AND token_hash = ?
    `),
    count: db.prepare('SELECT COUNT(1) AS count FROM world_grid_csrf_tokens')
  };
  let closed = false;

  function pruneOwner(ownerAccountId = '', nowMs = Date.now()) {
    const key = String(ownerAccountId || '').trim();
    if (!key) return [];
    statements.deleteExpiredForOwner.run(key, nowMs);
    const rows = statements.listOwner.all(key).map(parseTokenRow);
    for (const stale of rows.slice(MAX_TOKENS_PER_OWNER)) {
      statements.deleteOwnerHash.run(key, stale.tokenHash);
    }
    return rows.slice(0, MAX_TOKENS_PER_OWNER);
  }

  function issue({ ownerAccountId = '', token = '', nowMs = Date.now(), env = process.env } = {}) {
    const key = String(ownerAccountId || '').trim();
    if (!key || !token) return null;
    const createdAtMs = Number(nowMs) || Date.now();
    const expiresAtMs = createdAtMs + tokenTtlMs(env);
    const hash = tokenHash(token);
    pruneOwner(key, createdAtMs);
    statements.insert.run(
      key,
      hash,
      expiresAtMs,
      createdAtMs,
      WORLD_GRID_CSRF_MIGRATION_VERSION,
      WORLD_GRID_CSRF_SCHEMA_VERSION
    );
    pruneOwner(key, createdAtMs);
    return { tokenHash: hash, expiresAtMs, createdAtMs };
  }

  function hasValidToken({ ownerAccountId = '', token = '', nowMs = Date.now() } = {}) {
    const key = String(ownerAccountId || '').trim();
    if (!key || !token) return false;
    pruneOwner(key, nowMs);
    const row = parseTokenRow(statements.byOwnerHash.get(key, tokenHash(token)));
    return Boolean(row && row.expiresAtMs > nowMs);
  }

  function count() {
    return Number(statements.count.get().count || 0);
  }

  function listTokens() {
    return statements.listAll.all().map(parseTokenRow);
  }

  function close() {
    if (closed) return;
    closed = true;
    db.close();
  }

  return {
    close,
    count,
    hasValidToken,
    issue,
    listTokens,
    pruneOwner,
    sqlitePath
  };
}

function configuredWorldGridCsrfPath(env = process.env) {
  return String(env.WORLD_GRID_CSRF_SQLITE_PATH || '').trim();
}

function getConfiguredWorldGridCsrfStore(env = process.env) {
  const sqlitePath = configuredWorldGridCsrfPath(env);
  if (!sqlitePath) return null;
  if (durableSingleton && durableSingletonPath === sqlitePath) return durableSingleton;
  if (durableSingleton) durableSingleton.close();
  durableSingleton = createWorldGridCsrfStore({ sqlitePath });
  durableSingletonPath = sqlitePath;
  return durableSingleton;
}

function pruneOwnerTokens(owner, nowMs = Date.now(), env = process.env) {
  const key = ownerKey(owner);
  if (!key) return [];
  const durableStore = getConfiguredWorldGridCsrfStore(env);
  if (durableStore) return durableStore.pruneOwner(key, nowMs);
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
  const durableStore = getConfiguredWorldGridCsrfStore(env);
  if (durableStore) {
    durableStore.issue({ ownerAccountId: key, token, nowMs, env });
    return { token, expiresAtMs };
  }
  const records = pruneOwnerTokens(owner, nowMs, env);
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
  const key = ownerKey(owner);
  const durableStore = getConfiguredWorldGridCsrfStore(env);
  const found = durableStore
    ? durableStore.hasValidToken({ ownerAccountId: key, token, nowMs })
    : pruneOwnerTokens(owner, nowMs, env).some((record) => record.token === token);
  if (!found) {
    const error = new Error('CSRF_INVALID');
    error.details = { reason: 'WORLD_GRID_CSRF_TOKEN_INVALID_OR_EXPIRED' };
    throw error;
  }
  return true;
}

function worldGridCsrfTokenCount(env = process.env) {
  const durableStore = getConfiguredWorldGridCsrfStore(env);
  if (durableStore) return durableStore.count();
  return [...tokensByOwner.values()].reduce((sum, records) => sum + records.length, 0);
}

function closeWorldGridCsrfStore() {
  if (!durableSingleton) return;
  durableSingleton.close();
  durableSingleton = null;
  durableSingletonPath = '';
}

module.exports = {
  WORLD_GRID_CSRF_MIGRATION_VERSION,
  WORLD_GRID_CSRF_SCHEMA_VERSION,
  closeWorldGridCsrfStore,
  configuredWorldGridCsrfPath,
  createWorldGridCsrfStore,
  issueWorldGridCsrfToken,
  requireWorldGridCsrfToken,
  tokenHash,
  worldGridCsrfRequired,
  worldGridCsrfTokenCount
};
