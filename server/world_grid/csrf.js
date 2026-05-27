const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Prototype/ephemeral process-local CSRF token store; release storage is documented in docs/technical/WORLD_GRID_STATE_MODEL.md.
const tokensByOwner = new Map();
let durableSingleton = null;
let durableSingletonPath = '';

const WORLD_GRID_CSRF_SCHEMA_VERSION = 'agent-town.v5.world-grid.csrf.v2';
const WORLD_GRID_CSRF_MIGRATION_VERSION = 'world_grid_csrf_v2';

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

function sessionBindingKey(owner = {}) {
  return String(owner.sessionBindingKey || owner.sessionId || owner.session?.sessionId || '').trim();
}

function tokenTtlMs(env = process.env) {
  return readPositiveInteger(env.WORLD_GRID_CSRF_TOKEN_TTL_MS, DEFAULT_TOKEN_TTL_MS);
}

function tokenHash(token = '') {
  return `sha256:${crypto.createHash('sha256').update(String(token || ''), 'utf8').digest('hex')}`;
}

function sessionBindingHash(value = '') {
  const key = String(value || '').trim();
  return key ? tokenHash(`world-grid-csrf-session:${key}`) : '';
}

function ensureDurableSchema(db) {
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = NORMAL;');
  db.exec('PRAGMA busy_timeout = 5000;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS world_grid_csrf_tokens (
      owner_account_id TEXT NOT NULL,
      token_hash TEXT NOT NULL,
      session_binding_hash TEXT NOT NULL DEFAULT '',
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
  const columns = new Set(db.prepare('PRAGMA table_info(world_grid_csrf_tokens)').all().map((row) => row.name));
  if (!columns.has('session_binding_hash')) {
    db.exec("ALTER TABLE world_grid_csrf_tokens ADD COLUMN session_binding_hash TEXT NOT NULL DEFAULT '';");
  }
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_world_grid_csrf_owner_session
      ON world_grid_csrf_tokens(owner_account_id, session_binding_hash, created_at);
  `);
}

function parseTokenRow(row) {
  if (!row) return null;
  return {
    ownerAccountId: row.owner_account_id,
    tokenHash: row.token_hash,
    sessionBindingHash: row.session_binding_hash || '',
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
      WHERE owner_account_id = ? AND token_hash = ? AND session_binding_hash = ?
      LIMIT 1
    `),
    insert: db.prepare(`
      INSERT OR REPLACE INTO world_grid_csrf_tokens (
        owner_account_id, token_hash, session_binding_hash, expires_at, created_at,
        migration_version, schema_version
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
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
    deleteOwnerSession: db.prepare(`
      DELETE FROM world_grid_csrf_tokens
      WHERE owner_account_id = ? AND session_binding_hash = ?
    `),
    deleteOwner: db.prepare(`
      DELETE FROM world_grid_csrf_tokens
      WHERE owner_account_id = ?
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

  function issue({ ownerAccountId = '', token = '', sessionBindingKey = '', nowMs = Date.now(), env = process.env } = {}) {
    const key = String(ownerAccountId || '').trim();
    if (!key || !token) return null;
    const createdAtMs = Number(nowMs) || Date.now();
    const expiresAtMs = createdAtMs + tokenTtlMs(env);
    const hash = tokenHash(token);
    const sessionHash = sessionBindingHash(sessionBindingKey);
    pruneOwner(key, createdAtMs);
    statements.deleteOwnerSession.run(key, sessionHash);
    statements.insert.run(
      key,
      hash,
      sessionHash,
      expiresAtMs,
      createdAtMs,
      WORLD_GRID_CSRF_MIGRATION_VERSION,
      WORLD_GRID_CSRF_SCHEMA_VERSION
    );
    pruneOwner(key, createdAtMs);
    return { tokenHash: hash, sessionBindingHash: sessionHash, expiresAtMs, createdAtMs };
  }

  function hasValidToken({ ownerAccountId = '', token = '', sessionBindingKey = '', nowMs = Date.now() } = {}) {
    const key = String(ownerAccountId || '').trim();
    if (!key || !token) return false;
    pruneOwner(key, nowMs);
    const row = parseTokenRow(statements.byOwnerHash.get(key, tokenHash(token), sessionBindingHash(sessionBindingKey)));
    return Boolean(row && row.expiresAtMs > nowMs);
  }

  function invalidate({ ownerAccountId = '', sessionBindingKey = '', sessionOnly = true } = {}) {
    const key = String(ownerAccountId || '').trim();
    if (!key) return 0;
    const before = statements.listOwner.all(key).length;
    if (sessionOnly) {
      statements.deleteOwnerSession.run(key, sessionBindingHash(sessionBindingKey));
    } else {
      statements.deleteOwner.run(key);
    }
    const after = statements.listOwner.all(key).length;
    return Math.max(0, before - after);
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
    invalidate,
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
    durableStore.issue({ ownerAccountId: key, token, sessionBindingKey: sessionBindingKey(owner), nowMs, env });
    return { token, expiresAtMs };
  }
  const sessionHash = sessionBindingHash(sessionBindingKey(owner));
  const records = pruneOwnerTokens(owner, nowMs, env).filter((record) => String(record.sessionBindingHash || '') !== sessionHash);
  records.push({ token, sessionBindingHash: sessionHash, expiresAtMs, createdAtMs: nowMs });
  tokensByOwner.set(key, records.slice(-MAX_TOKENS_PER_OWNER));
  return { token, expiresAtMs };
}

function invalidateWorldGridCsrfTokens(owner, { env = process.env, sessionOnly = true } = {}) {
  const key = ownerKey(owner);
  if (!key) return 0;
  const durableStore = getConfiguredWorldGridCsrfStore(env);
  if (durableStore) {
    return durableStore.invalidate({
      ownerAccountId: key,
      sessionBindingKey: sessionBindingKey(owner),
      sessionOnly
    });
  }
  const records = tokensByOwner.get(key) || [];
  const before = records.length;
  if (!sessionOnly) {
    tokensByOwner.delete(key);
    return before;
  }
  const sessionHash = sessionBindingHash(sessionBindingKey(owner));
  const kept = records.filter((record) => String(record.sessionBindingHash || '') !== sessionHash);
  if (kept.length) tokensByOwner.set(key, kept);
  else tokensByOwner.delete(key);
  return before - kept.length;
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
  const sessionHash = sessionBindingHash(sessionBindingKey(owner));
  const durableStore = getConfiguredWorldGridCsrfStore(env);
  const found = durableStore
    ? durableStore.hasValidToken({ ownerAccountId: key, token, sessionBindingKey: sessionBindingKey(owner), nowMs })
    : pruneOwnerTokens(owner, nowMs, env).some((record) => record.token === token && String(record.sessionBindingHash || '') === sessionHash);
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
  invalidateWorldGridCsrfTokens,
  requireWorldGridCsrfToken,
  sessionBindingHash,
  tokenHash,
  worldGridCsrfRequired,
  worldGridCsrfTokenCount
};
