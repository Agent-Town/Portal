const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const WORLD_GRID_IDEMPOTENCY_SCHEMA_VERSION = 'agent-town.v5.world-grid.idempotency.v1';
const WORLD_GRID_IDEMPOTENCY_MIGRATION_VERSION = 'world_grid_idempotency_v1';

// Prototype/ephemeral process-local replay guard; release storage is documented in docs/technical/WORLD_GRID_STATE_MODEL.md.
const recordsByOwnerAndKey = new Map();
let durableSingleton = null;
let durableSingletonPath = '';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((out, key) => {
      out[key] = stableValue(value[key]);
      return out;
    }, {});
  }
  return value;
}

function stableJson(value) {
  return JSON.stringify(stableValue(value));
}

function sha256(value = '') {
  return `sha256:${crypto.createHash('sha256').update(String(value || ''), 'utf8').digest('hex')}`;
}

function ownerKey(owner = {}) {
  return String(owner.ownerAccountId || owner.regionId || owner.pairId || '').trim();
}

function requestBodyWithoutIdempotency(body = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return {};
  const next = clone(body);
  delete next.idempotencyKey;
  delete next.csrfToken;
  return next;
}

function recordKey(owner, idempotencyKey = '') {
  return `${ownerKey(owner)}\n${String(idempotencyKey || '').trim()}`;
}

function requestHash({ surface = '', body = {} } = {}) {
  return sha256(stableJson({
    surface: String(surface || ''),
    body: requestBodyWithoutIdempotency(body)
  }));
}

function ensureDurableSchema(db) {
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = NORMAL;');
  db.exec('PRAGMA busy_timeout = 5000;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS world_grid_idempotency_records (
      owner_account_id TEXT NOT NULL,
      idempotency_key TEXT NOT NULL,
      surface TEXT NOT NULL,
      args_sha TEXT NOT NULL,
      response_json TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      migration_version TEXT NOT NULL,
      schema_version TEXT NOT NULL,
      PRIMARY KEY (owner_account_id, idempotency_key)
    );
    CREATE INDEX IF NOT EXISTS idx_world_grid_idempotency_surface_created
      ON world_grid_idempotency_records(surface, created_at);
  `);
}

function parseDurableRecord(row) {
  if (!row) return null;
  return {
    ownerAccountId: row.owner_account_id,
    surface: row.surface,
    idempotencyKey: row.idempotency_key,
    argsSha: row.args_sha,
    response: JSON.parse(row.response_json),
    createdAtMs: Number(row.created_at),
    migrationVersion: row.migration_version,
    schemaVersion: row.schema_version
  };
}

function assertSameRequest(existing, { surface = '', argsSha = '', idempotencyKey = '' } = {}) {
  if (!existing) return;
  if (existing.surface !== surface || existing.argsSha !== argsSha) {
    const error = new Error('IDEMPOTENCY_CONFLICT');
    error.details = {
      ownerAccountId: existing.ownerAccountId,
      idempotencyKey,
      existingSurface: existing.surface,
      requestedSurface: surface,
      existingArgsSha: existing.argsSha,
      requestedArgsSha: argsSha
    };
    throw error;
  }
}

function createWorldGridIdempotencyStore({ sqlitePath } = {}) {
  if (!sqlitePath || typeof sqlitePath !== 'string') {
    throw new Error('WORLD_GRID_IDEMPOTENCY_SQLITE_PATH_REQUIRED');
  }
  fs.mkdirSync(path.dirname(sqlitePath), { recursive: true });
  const { DatabaseSync } = require('node:sqlite');
  const db = new DatabaseSync(sqlitePath);
  ensureDurableSchema(db);
  const statements = {
    byOwnerKey: db.prepare(`
      SELECT *
      FROM world_grid_idempotency_records
      WHERE owner_account_id = ? AND idempotency_key = ?
      LIMIT 1
    `),
    insert: db.prepare(`
      INSERT INTO world_grid_idempotency_records (
        owner_account_id, idempotency_key, surface, args_sha, response_json,
        created_at, migration_version, schema_version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `),
    count: db.prepare('SELECT COUNT(1) AS count FROM world_grid_idempotency_records')
  };
  let closed = false;

  function get(ownerAccountId = '', idempotencyKey = '') {
    return parseDurableRecord(statements.byOwnerKey.get(String(ownerAccountId || ''), String(idempotencyKey || '')));
  }

  function record({
    ownerAccountId = '',
    idempotencyKey = '',
    surface = '',
    argsSha = '',
    response = {},
    createdAtMs = Date.now()
  } = {}) {
    const existing = get(ownerAccountId, idempotencyKey);
    if (existing) {
      assertSameRequest(existing, { surface, argsSha, idempotencyKey });
      return { duplicate: true, record: existing };
    }
    const record = {
      ownerAccountId: String(ownerAccountId || ''),
      surface: String(surface || ''),
      idempotencyKey: String(idempotencyKey || ''),
      argsSha: String(argsSha || ''),
      response: clone(response),
      createdAtMs: Number(createdAtMs) || Date.now(),
      migrationVersion: WORLD_GRID_IDEMPOTENCY_MIGRATION_VERSION,
      schemaVersion: WORLD_GRID_IDEMPOTENCY_SCHEMA_VERSION
    };
    statements.insert.run(
      record.ownerAccountId,
      record.idempotencyKey,
      record.surface,
      record.argsSha,
      stableJson(record.response),
      record.createdAtMs,
      record.migrationVersion,
      record.schemaVersion
    );
    return { duplicate: false, record };
  }

  function count() {
    return Number(statements.count.get().count || 0);
  }

  function close() {
    if (closed) return;
    closed = true;
    db.close();
  }

  return {
    close,
    count,
    get,
    record,
    sqlitePath
  };
}

function configuredWorldGridIdempotencyPath(env = process.env) {
  return String(env.WORLD_GRID_IDEMPOTENCY_SQLITE_PATH || '').trim();
}

function getConfiguredWorldGridIdempotencyStore(env = process.env) {
  const sqlitePath = configuredWorldGridIdempotencyPath(env);
  if (!sqlitePath) return null;
  if (durableSingleton && durableSingletonPath === sqlitePath) return durableSingleton;
  if (durableSingleton) durableSingleton.close();
  durableSingleton = createWorldGridIdempotencyStore({ sqlitePath });
  durableSingletonPath = sqlitePath;
  return durableSingleton;
}

function closeWorldGridIdempotencyStore() {
  if (!durableSingleton) return;
  durableSingleton.close();
  durableSingleton = null;
  durableSingletonPath = '';
}

function runIdempotentWorldGridMutation({
  owner,
  surface = '',
  idempotencyKey = '',
  body = {},
  nowMs = Date.now()
} = {}, mutate) {
  const key = String(idempotencyKey || '').trim();
  const accountKey = ownerKey(owner);
  if (!accountKey || !key || typeof mutate !== 'function') {
    throw new Error('INVALID_IDEMPOTENCY_KEY');
  }

  const argsSha = requestHash({ surface, body });
  const storeKey = recordKey(owner, key);
  const durableStore = getConfiguredWorldGridIdempotencyStore();
  if (durableStore) {
    const existing = durableStore.get(accountKey, key);
    if (existing) {
      assertSameRequest(existing, { surface, argsSha, idempotencyKey: key });
      recordsByOwnerAndKey.set(storeKey, existing);
      return {
        duplicate: true,
        response: clone(existing.response),
        record: clone(existing)
      };
    }
  }
  const existing = recordsByOwnerAndKey.get(storeKey);
  if (existing) {
    if (existing.surface !== surface || existing.argsSha !== argsSha) {
      const error = new Error('IDEMPOTENCY_CONFLICT');
      error.details = {
        ownerAccountId: accountKey,
        idempotencyKey: key,
        existingSurface: existing.surface,
        requestedSurface: surface,
        existingArgsSha: existing.argsSha,
        requestedArgsSha: argsSha
      };
      throw error;
    }
    return {
      duplicate: true,
      response: clone(existing.response),
      record: clone(existing)
    };
  }

  const response = mutate();
  const record = {
    ownerAccountId: accountKey,
    surface: String(surface || ''),
    idempotencyKey: key,
    argsSha,
    response: clone(response),
    createdAtMs: nowMs
  };
  if (durableStore) {
    const durable = durableStore.record(record);
    if (durable.duplicate) {
      recordsByOwnerAndKey.set(storeKey, durable.record);
      return {
        duplicate: true,
        response: clone(durable.record.response),
        record: clone(durable.record)
      };
    }
    Object.assign(record, durable.record);
  }
  recordsByOwnerAndKey.set(storeKey, record);
  return {
    duplicate: false,
    response: clone(response),
    record: clone(record)
  };
}

function worldGridIdempotencyRecordCount() {
  return recordsByOwnerAndKey.size;
}

module.exports = {
  WORLD_GRID_IDEMPOTENCY_MIGRATION_VERSION,
  WORLD_GRID_IDEMPOTENCY_SCHEMA_VERSION,
  closeWorldGridIdempotencyStore,
  configuredWorldGridIdempotencyPath,
  createWorldGridIdempotencyStore,
  runIdempotentWorldGridMutation,
  sha256,
  stableJson,
  worldGridIdempotencyRecordCount
};
