const fs = require('fs');
const path = require('path');

// Prototype/ephemeral process-local mutation buckets; release storage is documented in docs/technical/WORLD_GRID_STATE_MODEL.md.
const buckets = new Map();
let durableSingleton = null;
let durableSingletonPath = '';

const WORLD_GRID_RATE_LIMIT_SCHEMA_VERSION = 'agent-town.v5.world-grid.rate-limit.v1';
const WORLD_GRID_RATE_LIMIT_MIGRATION_VERSION = 'world_grid_rate_limit_v1';

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX = 30;

function readPositiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : fallback;
}

function worldGridMutationRateLimitConfig(env = process.env) {
  return {
    windowMs: readPositiveInteger(env.WORLD_GRID_MUTATION_RATE_LIMIT_WINDOW_MS, DEFAULT_WINDOW_MS),
    max: readPositiveInteger(env.WORLD_GRID_MUTATION_RATE_LIMIT_MAX, DEFAULT_MAX)
  };
}

function ownerKey(owner = {}) {
  return String(owner.ownerAccountId || owner.regionId || owner.pairId || '').trim();
}

function ensureDurableSchema(db) {
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = NORMAL;');
  db.exec('PRAGMA busy_timeout = 5000;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS world_grid_rate_limit_buckets (
      owner_account_id TEXT NOT NULL,
      surface TEXT NOT NULL,
      count INTEGER NOT NULL,
      reset_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      migration_version TEXT NOT NULL,
      schema_version TEXT NOT NULL,
      PRIMARY KEY (owner_account_id, surface)
    );
    CREATE INDEX IF NOT EXISTS idx_world_grid_rate_limit_reset
      ON world_grid_rate_limit_buckets(reset_at);
  `);
}

function parseBucket(row) {
  if (!row) return null;
  return {
    ownerAccountId: row.owner_account_id,
    surface: row.surface,
    count: Number(row.count),
    resetAtMs: Number(row.reset_at),
    updatedAtMs: Number(row.updated_at),
    migrationVersion: row.migration_version,
    schemaVersion: row.schema_version
  };
}

function createWorldGridRateLimitStore({ sqlitePath } = {}) {
  if (!sqlitePath || typeof sqlitePath !== 'string') {
    throw new Error('WORLD_GRID_RATE_LIMIT_SQLITE_PATH_REQUIRED');
  }
  fs.mkdirSync(path.dirname(sqlitePath), { recursive: true });
  const { DatabaseSync } = require('node:sqlite');
  const db = new DatabaseSync(sqlitePath);
  ensureDurableSchema(db);
  const statements = {
    byOwnerSurface: db.prepare(`
      SELECT *
      FROM world_grid_rate_limit_buckets
      WHERE owner_account_id = ? AND surface = ?
      LIMIT 1
    `),
    upsert: db.prepare(`
      INSERT INTO world_grid_rate_limit_buckets (
        owner_account_id, surface, count, reset_at, updated_at,
        migration_version, schema_version
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(owner_account_id, surface) DO UPDATE SET
        count = excluded.count,
        reset_at = excluded.reset_at,
        updated_at = excluded.updated_at,
        migration_version = excluded.migration_version,
        schema_version = excluded.schema_version
    `),
    listBuckets: db.prepare(`
      SELECT *
      FROM world_grid_rate_limit_buckets
      ORDER BY owner_account_id ASC, surface ASC
    `),
    count: db.prepare('SELECT COUNT(1) AS count FROM world_grid_rate_limit_buckets')
  };
  let closed = false;

  function consume({ ownerAccountId = '', surface = '', nowMs = Date.now(), env = process.env } = {}) {
    const normalizedOwner = String(ownerAccountId || '').trim();
    const normalizedSurface = String(surface || '').trim();
    if (!normalizedOwner || !normalizedSurface) return null;
    const { windowMs, max } = worldGridMutationRateLimitConfig(env);
    const existing = parseBucket(statements.byOwnerSurface.get(normalizedOwner, normalizedSurface));
    const resetAtMs = existing && existing.resetAtMs > nowMs
      ? existing.resetAtMs
      : nowMs + windowMs;
    const count = existing && existing.resetAtMs > nowMs
      ? existing.count + 1
      : 1;
    statements.upsert.run(
      normalizedOwner,
      normalizedSurface,
      count,
      resetAtMs,
      nowMs,
      WORLD_GRID_RATE_LIMIT_MIGRATION_VERSION,
      WORLD_GRID_RATE_LIMIT_SCHEMA_VERSION
    );
    const remaining = Math.max(0, max - count);
    const retryAfterSeconds = Math.max(1, Math.ceil((resetAtMs - nowMs) / 1000));
    return {
      allowed: count <= max,
      limit: max,
      remaining,
      retryAfterSeconds,
      resetAtMs
    };
  }

  function count() {
    return Number(statements.count.get().count || 0);
  }

  function listBuckets() {
    return statements.listBuckets.all().map(parseBucket);
  }

  function close() {
    if (closed) return;
    closed = true;
    db.close();
  }

  return {
    close,
    consume,
    count,
    listBuckets,
    sqlitePath
  };
}

function configuredWorldGridRateLimitPath(env = process.env) {
  return String(env.WORLD_GRID_RATE_LIMIT_SQLITE_PATH || '').trim();
}

function getConfiguredWorldGridRateLimitStore(env = process.env) {
  const sqlitePath = configuredWorldGridRateLimitPath(env);
  if (!sqlitePath) return null;
  if (durableSingleton && durableSingletonPath === sqlitePath) return durableSingleton;
  if (durableSingleton) durableSingleton.close();
  durableSingleton = createWorldGridRateLimitStore({ sqlitePath });
  durableSingletonPath = sqlitePath;
  return durableSingleton;
}

function consumeWorldGridMutationRateLimit({ owner, surface = '', nowMs = Date.now(), env = process.env } = {}) {
  const keyOwner = ownerKey(owner);
  if (!keyOwner) return null;
  const durableStore = getConfiguredWorldGridRateLimitStore(env);
  if (durableStore) {
    return durableStore.consume({
      ownerAccountId: keyOwner,
      surface,
      nowMs,
      env
    });
  }
  const { windowMs, max } = worldGridMutationRateLimitConfig(env);
  const key = `${keyOwner}\n${String(surface || '').trim()}`;
  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAtMs <= nowMs) {
    bucket = { count: 0, resetAtMs: nowMs + windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;
  const remaining = Math.max(0, max - bucket.count);
  const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAtMs - nowMs) / 1000));
  if (bucket.count > max) {
    return {
      allowed: false,
      limit: max,
      remaining: 0,
      retryAfterSeconds,
      resetAtMs: bucket.resetAtMs
    };
  }
  return {
    allowed: true,
    limit: max,
    remaining,
    retryAfterSeconds,
    resetAtMs: bucket.resetAtMs
  };
}

function worldGridMutationRateLimitBucketCount() {
  return buckets.size;
}

function closeWorldGridRateLimitStore() {
  if (!durableSingleton) return;
  durableSingleton.close();
  durableSingleton = null;
  durableSingletonPath = '';
}

module.exports = {
  WORLD_GRID_RATE_LIMIT_MIGRATION_VERSION,
  WORLD_GRID_RATE_LIMIT_SCHEMA_VERSION,
  closeWorldGridRateLimitStore,
  configuredWorldGridRateLimitPath,
  consumeWorldGridMutationRateLimit,
  createWorldGridRateLimitStore,
  worldGridMutationRateLimitBucketCount,
  worldGridMutationRateLimitConfig
};
