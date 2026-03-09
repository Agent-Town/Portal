const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const { getStorePath } = require('./store');

const FIXTURE_DIR = path.join(__dirname, 'fixtures', 'unified-platform');

const PLATFORM_TABLES = Object.freeze([
  'compiled_pack_versions',
  'runs',
  'trace_intake_records',
  'trace_events',
  'trace_artifacts',
  'config_versions',
  'config_component_versions',
  'team_config_bindings',
  'integration_candidates',
  'integration_pack_versions',
  'integration_executions',
  'trainer_jobs',
  'trainer_results',
  'sealed_contexts',
  'sealed_context_violations',
  'approvals',
  'usage_ledger',
]);

const FIXTURE_FILES = Object.freeze({
  portal_default_skill_manual: 'portal_default_skill_manual.json',
  portal_default_compiled_pack_expected: 'portal_default_compiled_pack_expected.json',
  trace_web_run_seed: 'trace_web_run_seed.json',
  trace_web_run_expected_archive: 'trace_web_run_expected_archive.json',
  trainer_compare_seed: 'trainer_compare_seed.json',
  sealed_context_seed: 'sealed_context_seed.json',
  poker_operator_seed_jsonl: 'poker_operator_seed_jsonl.json',
  poker_operator_expected_canonical_trace: 'poker_operator_expected_canonical_trace.json',
});

let db = null;
const fixtureCache = new Map();

function hasTableColumn(database, tableName, columnName) {
  const rows = database.prepare(`PRAGMA table_info(${tableName})`).all();
  return rows.some((row) => String(row?.name || '').trim() === String(columnName || '').trim());
}

function ensureColumn(database, tableName, columnName, definitionSql) {
  if (hasTableColumn(database, tableName, columnName)) return;
  database.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definitionSql}`);
}

function ensureDb() {
  if (db) return db;
  const storePath = getStorePath();
  fs.mkdirSync(path.dirname(storePath), { recursive: true });
  db = new DatabaseSync(storePath);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = NORMAL;');
  db.exec('PRAGMA busy_timeout = 5000;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS compiled_pack_versions (
      pack_version_id TEXT PRIMARY KEY,
      pack_kind TEXT NOT NULL,
      source_path TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      manifest_json TEXT NOT NULL,
      file_hashes_json TEXT NOT NULL,
      source_refs_json TEXT NOT NULL,
      idempotency_key TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS runs (
      run_id TEXT PRIMARY KEY,
      trace_id TEXT UNIQUE,
      experience_id TEXT NOT NULL,
      house_id TEXT,
      team_id TEXT,
      config_version_id TEXT,
      entry_mode TEXT NOT NULL,
      status TEXT NOT NULL,
      trace_authority_type TEXT NOT NULL,
      metadata_json TEXT NOT NULL,
      idempotency_key TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS trace_intake_records (
      trace_intake_record_id TEXT PRIMARY KEY,
      trace_id TEXT NOT NULL,
      run_id TEXT NOT NULL,
      ingest_key TEXT NOT NULL,
      source_type TEXT NOT NULL,
      payload_schema TEXT NOT NULL,
      record_kind TEXT NOT NULL DEFAULT 'fact',
      payload_json TEXT NOT NULL,
      accepted INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      UNIQUE (run_id, ingest_key)
    );

    CREATE TABLE IF NOT EXISTS trace_events (
      event_id TEXT PRIMARY KEY,
      trace_id TEXT NOT NULL,
      run_id TEXT NOT NULL,
      seq INTEGER NOT NULL,
      event_kind TEXT NOT NULL,
      source_type TEXT NOT NULL,
      event_hash TEXT NOT NULL,
      prev_event_hash TEXT,
      payload_json TEXT NOT NULL,
      audience_json TEXT NOT NULL DEFAULT '{}',
      seal_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      UNIQUE (trace_id, seq)
    );

    CREATE TABLE IF NOT EXISTS trace_artifacts (
      trace_artifact_id TEXT PRIMARY KEY,
      trace_id TEXT NOT NULL,
      run_id TEXT NOT NULL,
      artifact_kind TEXT NOT NULL,
      metadata_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS config_versions (
      config_version_id TEXT PRIMARY KEY,
      house_id TEXT NOT NULL,
      team_id TEXT NOT NULL,
      config_hash TEXT NOT NULL,
      manifest_json TEXT NOT NULL,
      lineage_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS config_component_versions (
      config_component_version_id TEXT PRIMARY KEY,
      config_version_id TEXT NOT NULL,
      component_kind TEXT NOT NULL,
      component_key TEXT NOT NULL,
      immutable_version_id TEXT NOT NULL,
      component_hash TEXT NOT NULL,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS team_config_bindings (
      team_binding_id TEXT PRIMARY KEY,
      house_id TEXT NOT NULL,
      team_id TEXT NOT NULL,
      active_config_version_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (house_id, team_id)
    );

    CREATE TABLE IF NOT EXISTS integration_candidates (
      integration_candidate_id TEXT PRIMARY KEY,
      idempotency_key TEXT,
      target_url TEXT NOT NULL,
      source_kind TEXT NOT NULL,
      requires_compilation INTEGER NOT NULL DEFAULT 1,
      candidate_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS integration_pack_versions (
      pack_version_id TEXT PRIMARY KEY,
      integration_id TEXT NOT NULL,
      source_kind TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      manifest_json TEXT NOT NULL,
      file_hashes_json TEXT NOT NULL,
      idempotency_key TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (integration_id, idempotency_key)
    );

    CREATE TABLE IF NOT EXISTS integration_executions (
      integration_execution_id TEXT PRIMARY KEY,
      integration_id TEXT NOT NULL,
      action_id TEXT NOT NULL,
      requested_by_json TEXT NOT NULL,
      approval_id TEXT,
      status TEXT NOT NULL,
      request_json TEXT NOT NULL,
      result_json TEXT NOT NULL,
      idempotency_key TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (integration_id, idempotency_key)
    );

    CREATE TABLE IF NOT EXISTS trainer_jobs (
      trainer_job_id TEXT PRIMARY KEY,
      house_id TEXT,
      team_id TEXT,
      job_kind TEXT NOT NULL,
      status TEXT NOT NULL,
      targets_json TEXT NOT NULL,
      budget_json TEXT NOT NULL,
      idempotency_key TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (house_id, idempotency_key)
    );

    CREATE TABLE IF NOT EXISTS trainer_results (
      trainer_result_id TEXT PRIMARY KEY,
      trainer_job_id TEXT NOT NULL,
      status TEXT NOT NULL,
      result_json TEXT NOT NULL,
      candidate_patch_ids_json TEXT NOT NULL,
      linked_config_version_id TEXT,
      approval_needed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sealed_contexts (
      sealed_context_id TEXT PRIMARY KEY,
      trace_id TEXT,
      run_id TEXT,
      entrant_id TEXT NOT NULL,
      scope_type TEXT NOT NULL,
      scope_key TEXT NOT NULL,
      allowed_readers_json TEXT NOT NULL,
      forbidden_sources_json TEXT NOT NULL,
      release_policy_json TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sealed_context_violations (
      sealed_context_violation_id TEXT PRIMARY KEY,
      sealed_context_id TEXT NOT NULL,
      actor_json TEXT NOT NULL,
      details_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS approvals (
      approval_id TEXT PRIMARY KEY,
      house_id TEXT NOT NULL,
      approval_kind TEXT NOT NULL,
      subject_json TEXT NOT NULL,
      status TEXT NOT NULL,
      requested_by_json TEXT NOT NULL,
      decided_by_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS usage_ledger (
      usage_ledger_id TEXT PRIMARY KEY,
      ledger_kind TEXT NOT NULL,
      scope_id TEXT NOT NULL,
      usage_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
  ensureColumn(db, 'config_versions', 'lineage_json', `TEXT NOT NULL DEFAULT '{}'`);
  ensureColumn(db, 'config_versions', 'experience_id', 'TEXT');
  ensureColumn(db, 'config_versions', 'status', `TEXT NOT NULL DEFAULT 'draft'`);
  ensureColumn(db, 'config_versions', 'updated_at', `TEXT NOT NULL DEFAULT ''`);
  ensureColumn(db, 'runs', 'config_version_id', 'TEXT');
  ensureColumn(db, 'runs', 'entry_mode', `TEXT NOT NULL DEFAULT 'normal'`);
  ensureColumn(db, 'runs', 'metadata_json', `TEXT NOT NULL DEFAULT '{}'`);
  ensureColumn(db, 'runs', 'completed_at', 'TEXT');
  return db;
}

function countPlatformTableRows(tableName) {
  if (!PLATFORM_TABLES.includes(tableName)) return 0;
  const database = ensureDb();
  const row = database.prepare(`SELECT COUNT(1) AS count FROM ${tableName}`).get();
  return Number(row?.count || 0);
}

function getPlatformTableCounts() {
  const out = {};
  for (const tableName of PLATFORM_TABLES) {
    out[tableName] = countPlatformTableRows(tableName);
  }
  return out;
}

function resetUnifiedPlatformStore() {
  const database = ensureDb();
  database.exec('BEGIN');
  try {
    for (const tableName of PLATFORM_TABLES) {
      database.prepare(`DELETE FROM ${tableName}`).run();
    }
    database.exec('COMMIT');
  } catch (err) {
    database.exec('ROLLBACK');
    throw err;
  }
}

function listFixtureFamilies() {
  return Object.keys(FIXTURE_FILES);
}

function loadFixtureFamily(family) {
  const key = String(family || '').trim();
  if (!key || !Object.prototype.hasOwnProperty.call(FIXTURE_FILES, key)) return null;
  if (fixtureCache.has(key)) return fixtureCache.get(key);
  const filePath = path.join(FIXTURE_DIR, FIXTURE_FILES[key]);
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  fixtureCache.set(key, parsed);
  return parsed;
}

function parseJsonColumn(raw, fallback) {
  if (typeof raw !== 'string' || !raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function mapConfigVersionRow(row) {
  if (!row || typeof row !== 'object') return null;
  return {
    configVersionId: String(row.config_version_id || ''),
    houseId: String(row.house_id || ''),
    teamId: String(row.team_id || ''),
    experienceId: row.experience_id ? String(row.experience_id) : null,
    status: row.status ? String(row.status) : null,
    configHash: String(row.config_hash || ''),
    manifest: parseJsonColumn(row.manifest_json, {}),
    lineage: parseJsonColumn(row.lineage_json, {}),
    createdAt: String(row.created_at || ''),
    updatedAt: String(row.updated_at || ''),
  };
}

function getConfigVersion(configVersionId = '') {
  const normalizedConfigVersionId = String(configVersionId || '').trim();
  if (!normalizedConfigVersionId) return null;
  const database = ensureDb();
  const row = database.prepare(`
    SELECT *
    FROM config_versions
    WHERE config_version_id = ?
    LIMIT 1
  `).get(normalizedConfigVersionId);
  return mapConfigVersionRow(row);
}

function upsertConfigVersion({
  configVersionId = '',
  houseId = '',
  teamId = '',
  experienceId = '',
  status = 'draft',
  configHash = '',
  manifest = null,
  lineage = null,
  nowIso = new Date().toISOString(),
} = {}) {
  const normalizedConfigVersionId = String(configVersionId || '').trim();
  const normalizedHouseId = String(houseId || '').trim();
  const normalizedTeamId = String(teamId || '').trim();
  const normalizedConfigHash = String(configHash || '').trim();
  if (!normalizedConfigVersionId || !normalizedHouseId || !normalizedTeamId || !normalizedConfigHash) {
    throw new Error('CONFIG_VERSION_INVALID');
  }
  const database = ensureDb();
  database.prepare(`
    INSERT INTO config_versions (
      config_version_id,
      house_id,
      team_id,
      experience_id,
      config_hash,
      status,
      manifest_json,
      lineage_json,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(config_version_id) DO UPDATE SET
      house_id = excluded.house_id,
      team_id = excluded.team_id,
      experience_id = excluded.experience_id,
      config_hash = excluded.config_hash,
      status = excluded.status,
      manifest_json = excluded.manifest_json,
      lineage_json = excluded.lineage_json,
      updated_at = excluded.updated_at
  `).run(
    normalizedConfigVersionId,
    normalizedHouseId,
    normalizedTeamId,
    String(experienceId || '').trim() || null,
    normalizedConfigHash,
    String(status || 'draft').trim() || 'draft',
    JSON.stringify(manifest && typeof manifest === 'object' ? manifest : {}),
    JSON.stringify(lineage && typeof lineage === 'object' ? lineage : {}),
    nowIso,
    nowIso,
  );
  return getConfigVersion(normalizedConfigVersionId);
}

function mapRunRow(row) {
  if (!row || typeof row !== 'object') return null;
  return {
    runId: String(row.run_id || ''),
    traceId: String(row.trace_id || ''),
    experienceId: String(row.experience_id || ''),
    houseId: row.house_id ? String(row.house_id) : null,
    teamId: row.team_id ? String(row.team_id) : null,
    configVersionId: row.config_version_id ? String(row.config_version_id) : null,
    entryMode: String(row.entry_mode || ''),
    status: String(row.status || ''),
    traceAuthorityType: String(row.trace_authority_type || ''),
    metadata: parseJsonColumn(row.metadata_json, {}),
    idempotencyKey: row.idempotency_key ? String(row.idempotency_key) : null,
    createdAt: String(row.created_at || ''),
    updatedAt: String(row.updated_at || ''),
    completedAt: row.completed_at ? String(row.completed_at) : null,
  };
}

function getRunById(runId = '') {
  const normalizedRunId = String(runId || '').trim();
  if (!normalizedRunId) return null;
  const database = ensureDb();
  const row = database.prepare(`
    SELECT *
    FROM runs
    WHERE run_id = ?
    LIMIT 1
  `).get(normalizedRunId);
  return mapRunRow(row);
}

function getRunByIdempotency({ houseId = '', idempotencyKey = '' } = {}) {
  const normalizedHouseId = String(houseId || '').trim();
  const normalizedIdempotencyKey = String(idempotencyKey || '').trim();
  if (!normalizedHouseId || !normalizedIdempotencyKey) return null;
  const database = ensureDb();
  const row = database.prepare(`
    SELECT *
    FROM runs
    WHERE house_id = ?
      AND idempotency_key = ?
    ORDER BY created_at ASC
    LIMIT 1
  `).get(normalizedHouseId, normalizedIdempotencyKey);
  return mapRunRow(row);
}

function createRun({
  runId = '',
  traceId = '',
  experienceId = '',
  houseId = '',
  teamId = '',
  configVersionId = '',
  entryMode = '',
  status = 'queued',
  traceAuthorityType = '',
  metadata = null,
  idempotencyKey = '',
  nowIso = new Date().toISOString(),
} = {}) {
  const normalizedRunId = String(runId || '').trim();
  const normalizedTraceId = String(traceId || '').trim();
  const normalizedExperienceId = String(experienceId || '').trim();
  const normalizedHouseId = String(houseId || '').trim();
  const normalizedTeamId = String(teamId || '').trim();
  const normalizedConfigVersionId = String(configVersionId || '').trim();
  const normalizedEntryMode = String(entryMode || '').trim();
  const normalizedStatus = String(status || '').trim();
  const normalizedTraceAuthorityType = String(traceAuthorityType || '').trim();
  if (
    !normalizedRunId
    || !normalizedTraceId
    || !normalizedExperienceId
    || !normalizedEntryMode
    || !normalizedStatus
    || !normalizedTraceAuthorityType
  ) {
    throw new Error('RUN_INVALID');
  }
  const database = ensureDb();
  database.prepare(`
    INSERT INTO runs (
      run_id,
      trace_id,
      experience_id,
      house_id,
      team_id,
      config_version_id,
      entry_mode,
      status,
      trace_authority_type,
      metadata_json,
      idempotency_key,
      created_at,
      updated_at,
      completed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    normalizedRunId,
    normalizedTraceId,
    normalizedExperienceId,
    normalizedHouseId || null,
    normalizedTeamId || null,
    normalizedConfigVersionId || null,
    normalizedEntryMode,
    normalizedStatus,
    normalizedTraceAuthorityType,
    JSON.stringify(metadata && typeof metadata === 'object' ? metadata : {}),
    String(idempotencyKey || '').trim() || null,
    nowIso,
    nowIso,
    null,
  );
  return getRunById(normalizedRunId);
}

function isUnifiedPlatformTable(tableName) {
  return PLATFORM_TABLES.includes(String(tableName || '').trim());
}

function getUnifiedPlatformTestStats() {
  return {
    counts: getPlatformTableCounts(),
    fixtureFamilies: listFixtureFamilies(),
  };
}

module.exports = {
  createRun,
  countUnifiedPlatformTableRows: countPlatformTableRows,
  countPlatformTableRows,
  getConfigVersion,
  getRunById,
  getRunByIdempotency,
  getUnifiedPlatformTestFixture: loadFixtureFamily,
  getUnifiedPlatformTestStats,
  getPlatformTableCounts,
  isUnifiedPlatformTable,
  listFixtureFamilies,
  listUnifiedPlatformFixtureFamilies: listFixtureFamilies,
  loadFixtureFamily,
  resetUnifiedPlatformStore,
  upsertConfigVersion,
};
