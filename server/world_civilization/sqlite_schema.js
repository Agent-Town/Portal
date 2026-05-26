const CIVIC_SQLITE_SCHEMA_METADATA_TABLE = 'world_civic_schema_metadata';
const CIVIC_SQLITE_SCHEMA_USER_VERSION = 1;
const CIVIC_SQLITE_SCHEMA_MIGRATION_VERSION = 'v1';

function assertDb(db) {
  if (!db || typeof db.prepare !== 'function' || typeof db.exec !== 'function') {
    throw new Error('CIVIC_SQLITE_DB_REQUIRED');
  }
}

function readSqliteUserVersion(db) {
  assertDb(db);
  const row = db.prepare('PRAGMA user_version').get() || {};
  return Number(row.user_version || 0);
}

function readCivicSqliteSchemaMetadata(db, storeKey = '') {
  assertDb(db);
  const key = String(storeKey || '');
  if (!key) throw new Error('CIVIC_SQLITE_SCHEMA_STORE_KEY_REQUIRED');
  const row = db.prepare(`
    SELECT store_key, migration_version, schema_user_version, metadata_json
    FROM ${CIVIC_SQLITE_SCHEMA_METADATA_TABLE}
    WHERE store_key = ?
    LIMIT 1
  `).get(key);
  if (!row) return null;
  const metadata = JSON.parse(row.metadata_json);
  return {
    storeKey: row.store_key,
    migrationVersion: row.migration_version,
    schemaUserVersion: Number(row.schema_user_version || 0),
    ...metadata
  };
}

function ensureCivicSqliteSchemaMetadata(db, {
  storeKey = '',
  migrationVersion = CIVIC_SQLITE_SCHEMA_MIGRATION_VERSION,
  modulePath = ''
} = {}) {
  assertDb(db);
  const key = String(storeKey || '');
  const version = String(migrationVersion || '');
  if (!key) throw new Error('CIVIC_SQLITE_SCHEMA_STORE_KEY_REQUIRED');
  if (!version) throw new Error('CIVIC_SQLITE_SCHEMA_MIGRATION_VERSION_REQUIRED');

  const userVersion = readSqliteUserVersion(db);
  if (userVersion === 0) {
    db.exec(`PRAGMA user_version = ${CIVIC_SQLITE_SCHEMA_USER_VERSION};`);
  } else if (userVersion !== CIVIC_SQLITE_SCHEMA_USER_VERSION) {
    const err = new Error('CIVIC_SQLITE_SCHEMA_USER_VERSION_UNSUPPORTED');
    err.details = {
      storeKey: key,
      expected: CIVIC_SQLITE_SCHEMA_USER_VERSION,
      received: userVersion
    };
    throw err;
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS ${CIVIC_SQLITE_SCHEMA_METADATA_TABLE} (
      store_key TEXT PRIMARY KEY,
      migration_version TEXT NOT NULL,
      schema_user_version INTEGER NOT NULL,
      metadata_json TEXT NOT NULL
    );
  `);

  const existing = readCivicSqliteSchemaMetadata(db, key);
  if (existing) {
    if (existing.migrationVersion !== version || existing.schemaUserVersion !== CIVIC_SQLITE_SCHEMA_USER_VERSION) {
      const err = new Error('CIVIC_SQLITE_SCHEMA_MIGRATION_VERSION_MISMATCH');
      err.details = {
        storeKey: key,
        expected: {
          migrationVersion: version,
          schemaUserVersion: CIVIC_SQLITE_SCHEMA_USER_VERSION
        },
        received: {
          migrationVersion: existing.migrationVersion,
          schemaUserVersion: existing.schemaUserVersion
        }
      };
      throw err;
    }
    return existing;
  }

  const metadata = {
    modulePath: String(modulePath || ''),
    releaseStatus: 'research_only'
  };
  db.prepare(`
    INSERT INTO ${CIVIC_SQLITE_SCHEMA_METADATA_TABLE} (
      store_key, migration_version, schema_user_version, metadata_json
    ) VALUES (?, ?, ?, ?)
  `).run(key, version, CIVIC_SQLITE_SCHEMA_USER_VERSION, JSON.stringify(metadata));
  return readCivicSqliteSchemaMetadata(db, key);
}

module.exports = {
  CIVIC_SQLITE_SCHEMA_METADATA_TABLE,
  CIVIC_SQLITE_SCHEMA_MIGRATION_VERSION,
  CIVIC_SQLITE_SCHEMA_USER_VERSION,
  ensureCivicSqliteSchemaMetadata,
  readCivicSqliteSchemaMetadata,
  readSqliteUserVersion
};
