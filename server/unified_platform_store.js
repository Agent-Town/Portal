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
  countUnifiedPlatformTableRows: countPlatformTableRows,
  countPlatformTableRows,
  getUnifiedPlatformTestFixture: loadFixtureFamily,
  getUnifiedPlatformTestStats,
  getPlatformTableCounts,
  isUnifiedPlatformTable,
  listFixtureFamilies,
  listUnifiedPlatformFixtureFamilies: listFixtureFamilies,
  loadFixtureFamily,
  resetUnifiedPlatformStore,
};
