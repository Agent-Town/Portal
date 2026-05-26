const fs = require('fs');
const path = require('path');

const WORLD_GRID_REGION_PREFERENCES_SCHEMA_VERSION = 'agent-town.v5.world-grid.region-preferences.v1';
const WORLD_GRID_REGION_PREFERENCES_MIGRATION_VERSION = 'world_grid_region_preferences_v1';

// Prototype/ephemeral process-local store; release storage is documented in docs/technical/WORLD_GRID_STATE_MODEL.md.
const preferenceMemory = new Map();
let durableSingleton = null;
let durableSingletonPath = '';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeCamera(camera = {}) {
  return {
    zoom: ['settlement', 'region'].includes(String(camera?.zoom || '')) ? String(camera.zoom) : 'region',
    q: Number.isFinite(Number(camera?.q)) ? Number(camera.q) : 0,
    r: Number.isFinite(Number(camera?.r)) ? Number(camera.r) : 0
  };
}

function normalizePreference(preference = {}) {
  return {
    selectedCellId: String(preference?.selectedCellId || ''),
    camera: normalizeCamera(preference?.camera || {})
  };
}

function ensureDurableSchema(db) {
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = NORMAL;');
  db.exec('PRAGMA busy_timeout = 5000;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS world_grid_region_preferences (
      region_id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      selected_cell_id TEXT NOT NULL,
      zoom TEXT NOT NULL,
      q INTEGER NOT NULL,
      r INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      preference_json TEXT NOT NULL,
      migration_version TEXT NOT NULL,
      schema_version TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_world_grid_region_preferences_owner
      ON world_grid_region_preferences(account_id, region_id);
  `);
}

function parsePreference(row) {
  if (!row) return null;
  return JSON.parse(row.preference_json);
}

function createWorldGridRegionPreferenceStore({ sqlitePath } = {}) {
  if (!sqlitePath || typeof sqlitePath !== 'string') {
    throw new Error('WORLD_GRID_REGION_PREFS_SQLITE_PATH_REQUIRED');
  }
  fs.mkdirSync(path.dirname(sqlitePath), { recursive: true });
  const { DatabaseSync } = require('node:sqlite');
  const db = new DatabaseSync(sqlitePath);
  ensureDurableSchema(db);
  const statements = {
    byRegion: db.prepare(`
      SELECT *
      FROM world_grid_region_preferences
      WHERE region_id = ?
      LIMIT 1
    `),
    upsert: db.prepare(`
      INSERT INTO world_grid_region_preferences (
        region_id, account_id, selected_cell_id, zoom, q, r, updated_at,
        preference_json, migration_version, schema_version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(region_id) DO UPDATE SET
        account_id = excluded.account_id,
        selected_cell_id = excluded.selected_cell_id,
        zoom = excluded.zoom,
        q = excluded.q,
        r = excluded.r,
        updated_at = excluded.updated_at,
        preference_json = excluded.preference_json,
        migration_version = excluded.migration_version,
        schema_version = excluded.schema_version
    `),
    count: db.prepare('SELECT COUNT(1) AS count FROM world_grid_region_preferences'),
    metadata: db.prepare(`
      SELECT migration_version, schema_version, COUNT(1) AS count
      FROM world_grid_region_preferences
      GROUP BY migration_version, schema_version
      ORDER BY migration_version ASC, schema_version ASC
    `)
  };
  let closed = false;

  function preferencesForRegion(regionId = '') {
    return parsePreference(statements.byRegion.get(String(regionId || '')));
  }

  function savePreferences(owner = {}, preference = {}, updatedAtMs = Date.now()) {
    const regionId = String(owner?.regionId || '');
    const accountId = String(owner?.ownerAccountId || '');
    if (!regionId || !accountId) throw new Error('WORLD_GRID_REGION_PREFS_OWNER_REQUIRED');
    const normalized = normalizePreference(preference);
    statements.upsert.run(
      regionId,
      accountId,
      normalized.selectedCellId,
      normalized.camera.zoom,
      normalized.camera.q,
      normalized.camera.r,
      Number(updatedAtMs) || Date.now(),
      JSON.stringify(normalized),
      WORLD_GRID_REGION_PREFERENCES_MIGRATION_VERSION,
      WORLD_GRID_REGION_PREFERENCES_SCHEMA_VERSION
    );
    return clone(normalized);
  }

  function count() {
    return Number(statements.count.get().count || 0);
  }

  function metadata() {
    return statements.metadata.all().map((row) => ({
      migrationVersion: row.migration_version,
      schemaVersion: row.schema_version,
      count: Number(row.count || 0)
    }));
  }

  function close() {
    if (closed) return;
    closed = true;
    db.close();
  }

  return {
    close,
    count,
    metadata,
    preferencesForRegion,
    savePreferences,
    sqlitePath
  };
}

function configuredWorldGridRegionPreferencesPath(env = process.env) {
  return String(env.WORLD_GRID_REGION_PREFS_SQLITE_PATH || '').trim();
}

function getConfiguredWorldGridRegionPreferenceStore(env = process.env) {
  const sqlitePath = configuredWorldGridRegionPreferencesPath(env);
  if (!sqlitePath) return null;
  if (durableSingleton && durableSingletonPath === sqlitePath) return durableSingleton;
  if (durableSingleton) durableSingleton.close();
  durableSingleton = createWorldGridRegionPreferenceStore({ sqlitePath });
  durableSingletonPath = sqlitePath;
  return durableSingleton;
}

function preferencesForOwner(owner = {}, defaults = {}) {
  const fallback = normalizePreference(defaults);
  const durableStore = getConfiguredWorldGridRegionPreferenceStore();
  if (durableStore) return durableStore.preferencesForRegion(owner.regionId) || fallback;
  return preferenceMemory.has(owner.regionId)
    ? clone(preferenceMemory.get(owner.regionId))
    : fallback;
}

function savePreferencesForOwner(owner = {}, preference = {}, updatedAtMs = Date.now()) {
  const normalized = normalizePreference(preference);
  const durableStore = getConfiguredWorldGridRegionPreferenceStore();
  if (durableStore) return durableStore.savePreferences(owner, normalized, updatedAtMs);
  preferenceMemory.set(owner.regionId, clone(normalized));
  return clone(normalized);
}

function closeWorldGridRegionPreferenceStore() {
  if (durableSingleton) durableSingleton.close();
  durableSingleton = null;
  durableSingletonPath = '';
  preferenceMemory.clear();
}

module.exports = {
  WORLD_GRID_REGION_PREFERENCES_MIGRATION_VERSION,
  WORLD_GRID_REGION_PREFERENCES_SCHEMA_VERSION,
  closeWorldGridRegionPreferenceStore,
  createWorldGridRegionPreferenceStore,
  preferencesForOwner,
  savePreferencesForOwner
};
