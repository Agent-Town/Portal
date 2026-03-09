const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const { getStorePath } = require('./store');

const UNIFIED_PLATFORM_TABLES = Object.freeze([
  'runs',
  'trace_intake_records',
  'trace_events',
  'trace_artifacts',
  'config_versions',
  'config_component_versions',
  'integration_pack_versions',
  'integration_executions',
  'trainer_jobs',
  'trainer_results',
  'sealed_contexts',
  'approvals',
]);

const FIXTURES = Object.freeze({
  portal_default_skill_manual: {
    family: 'portal_default_skill_manual',
    sourcePath: '/skill.md',
    title: 'Portal default skill manual',
    skillLine: 'Follow the co-op onboarding flow with the connected human.',
    updatedAt: '2026-03-09T00:00:00.000Z',
  },
  portal_default_compiled_pack_expected: {
    family: 'portal_default_compiled_pack_expected',
    manifest: {
      packId: 'pack_portal_onboarding_v1',
      packVersionId: 'packv_fixture_portal_onboarding_v1',
      contentHash: 'sha256:portal-default-pack-fixture',
      sourceRefs: [
        {
          path: '/skill.md',
          hash: 'sha256:portal-default-skill-manual',
        },
      ],
      fileHashes: {
        'manual/skill.md': 'sha256:portal-default-skill-manual',
        'heartbeat.md': 'sha256:portal-default-heartbeat',
        'tools.md': 'sha256:portal-default-tools',
        'trace_map.json': 'sha256:portal-default-trace-map',
      },
    },
  },
  trace_web_run_seed: {
    family: 'trace_web_run_seed',
    run: {
      runId: 'run_fixture_web_01',
      experienceId: 'exp_web_portal',
      traceId: 'trace_fixture_web_01',
      traceAuthorityType: 'portal.worker',
      status: 'running',
    },
    ingestions: [
      {
        ingestKey: 'ingest_fixture_web_01',
        eventType: 'experience.started',
        occurredAt: '2026-03-09T00:00:00.000Z',
      },
    ],
  },
  trace_web_run_expected_archive: {
    family: 'trace_web_run_expected_archive',
    trace: {
      traceId: 'trace_fixture_web_01',
      eventCount: 2,
      status: 'completed',
    },
    events: [
      {
        seq: 1,
        eventHash: 'sha256:trace-fixture-web-event-1',
        prevEventHash: null,
        eventType: 'experience.started',
      },
      {
        seq: 2,
        eventHash: 'sha256:trace-fixture-web-event-2',
        prevEventHash: 'sha256:trace-fixture-web-event-1',
        eventType: 'experience.completed',
      },
    ],
  },
  trainer_compare_seed: {
    family: 'trainer_compare_seed',
    trainerJob: {
      trainerJobId: 'trjob_fixture_compare_01',
      jobKind: 'trainer_job.compare',
      status: 'queued',
    },
    attemptIds: ['attempt_fixture_01', 'attempt_fixture_02'],
  },
  sealed_context_seed: {
    family: 'sealed_context_seed',
    sealedContext: {
      sealedContextId: 'seal_fixture_entrant_01',
      traceId: 'trace_fixture_competitive_01',
      entrantId: 'entrant_fixture_01',
      scopeType: 'entrant',
      scopeKey: 'entrant_fixture_01',
      status: 'sealed',
    },
  },
  poker_operator_seed_jsonl: {
    family: 'poker_operator_seed_jsonl',
    source: {
      runId: 'pkr_fixture_01',
      contentType: 'application/x-ndjson',
    },
    eventsJsonl: [
      '{"seq":1,"eventType":"deal","payload":{"cards":["Ah","Kd"]}}',
      '{"seq":2,"eventType":"raise","payload":{"amount":20}}',
    ].join('\n'),
  },
  poker_operator_expected_canonical_trace: {
    family: 'poker_operator_expected_canonical_trace',
    trace: {
      traceId: 'trace_fixture_poker_01',
      runId: 'pkr_fixture_01',
      traceAuthorityType: 'operator.ingest',
      eventCount: 2,
    },
    seqs: [1, 2],
  },
});

let db = null;

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
    CREATE TABLE IF NOT EXISTS runs (
      run_id TEXT PRIMARY KEY,
      experience_id TEXT NOT NULL,
      house_id TEXT,
      team_id TEXT,
      trace_id TEXT,
      trace_authority_type TEXT NOT NULL,
      status TEXT NOT NULL,
      idempotency_key TEXT,
      request_json TEXT NOT NULL DEFAULT '{}',
      response_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS trace_intake_records (
      intake_id TEXT PRIMARY KEY,
      trace_id TEXT NOT NULL,
      run_id TEXT,
      ingest_key TEXT NOT NULL,
      producer_kind TEXT,
      producer_id TEXT,
      status TEXT NOT NULL,
      payload_json TEXT NOT NULL DEFAULT '{}',
      received_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE (trace_id, ingest_key)
    );

    CREATE TABLE IF NOT EXISTS trace_events (
      event_id TEXT PRIMARY KEY,
      trace_id TEXT NOT NULL,
      run_id TEXT,
      seq INTEGER NOT NULL,
      event_type TEXT NOT NULL,
      event_hash TEXT NOT NULL,
      prev_event_hash TEXT,
      actor_kind TEXT,
      actor_id TEXT,
      sealed_context_id TEXT,
      payload_json TEXT NOT NULL DEFAULT '{}',
      canonical_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE (trace_id, seq)
    );

    CREATE TABLE IF NOT EXISTS trace_artifacts (
      artifact_id TEXT PRIMARY KEY,
      trace_id TEXT NOT NULL,
      run_id TEXT,
      seq INTEGER,
      artifact_kind TEXT NOT NULL,
      content_hash TEXT,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS config_versions (
      config_version_id TEXT PRIMARY KEY,
      house_id TEXT NOT NULL,
      team_id TEXT,
      experience_id TEXT,
      config_hash TEXT NOT NULL,
      status TEXT NOT NULL,
      manifest_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS config_component_versions (
      config_component_version_id TEXT PRIMARY KEY,
      config_version_id TEXT NOT NULL,
      component_kind TEXT NOT NULL,
      component_ref TEXT,
      immutable_ref TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      payload_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS integration_pack_versions (
      integration_pack_version_id TEXT PRIMARY KEY,
      integration_id TEXT NOT NULL,
      pack_version_id TEXT NOT NULL,
      source_kind TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      manifest_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS integration_executions (
      integration_execution_id TEXT PRIMARY KEY,
      integration_id TEXT NOT NULL,
      run_id TEXT,
      action_id TEXT NOT NULL,
      approval_id TEXT,
      idempotency_key TEXT,
      status TEXT NOT NULL,
      request_json TEXT NOT NULL DEFAULT '{}',
      response_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS trainer_jobs (
      trainer_job_id TEXT PRIMARY KEY,
      job_kind TEXT NOT NULL,
      house_id TEXT NOT NULL,
      team_id TEXT,
      run_id TEXT,
      config_version_id TEXT,
      status TEXT NOT NULL,
      idempotency_key TEXT,
      request_json TEXT NOT NULL DEFAULT '{}',
      result_summary_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS trainer_results (
      trainer_result_id TEXT PRIMARY KEY,
      trainer_job_id TEXT NOT NULL,
      result_kind TEXT NOT NULL,
      patch_json TEXT NOT NULL DEFAULT '{}',
      artifact_json TEXT NOT NULL DEFAULT '{}',
      promoted_config_version_id TEXT,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sealed_contexts (
      sealed_context_id TEXT PRIMARY KEY,
      trace_id TEXT NOT NULL,
      entrant_id TEXT,
      scope_type TEXT NOT NULL,
      scope_key TEXT NOT NULL,
      allowed_readers_json TEXT NOT NULL DEFAULT '[]',
      forbidden_sources_json TEXT NOT NULL DEFAULT '[]',
      release_policy_json TEXT NOT NULL DEFAULT '{}',
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS approvals (
      approval_id TEXT PRIMARY KEY,
      approval_kind TEXT NOT NULL,
      scope_type TEXT NOT NULL,
      scope_key TEXT NOT NULL,
      action_id TEXT,
      subject_id TEXT,
      status TEXT NOT NULL,
      decision_by TEXT,
      decision_reason TEXT,
      expires_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  return db;
}

function withTransaction(fn) {
  const database = ensureDb();
  database.exec('BEGIN');
  try {
    fn(database);
    database.exec('COMMIT');
  } catch (err) {
    database.exec('ROLLBACK');
    throw err;
  }
}

function isUnifiedPlatformTable(tableName) {
  return UNIFIED_PLATFORM_TABLES.includes(String(tableName || '').trim());
}

function countUnifiedPlatformTableRows(tableName) {
  const normalized = String(tableName || '').trim();
  if (!isUnifiedPlatformTable(normalized)) return null;
  const database = ensureDb();
  const row = database.prepare(`SELECT COUNT(1) AS count FROM ${normalized}`).get();
  return Number(row?.count || 0);
}

function resetUnifiedPlatformStore() {
  withTransaction((database) => {
    for (const tableName of UNIFIED_PLATFORM_TABLES) {
      database.prepare(`DELETE FROM ${tableName}`).run();
    }
  });
}

function getUnifiedPlatformTestStats() {
  const counts = {};
  for (const tableName of UNIFIED_PLATFORM_TABLES) {
    counts[tableName] = countUnifiedPlatformTableRows(tableName);
  }
  return {
    counts,
    tables: UNIFIED_PLATFORM_TABLES.slice(),
  };
}

function listUnifiedPlatformFixtureFamilies() {
  return Object.keys(FIXTURES).sort();
}

function getUnifiedPlatformTestFixture(family) {
  const normalized = String(family || '').trim();
  if (!normalized || !Object.prototype.hasOwnProperty.call(FIXTURES, normalized)) return null;
  return JSON.parse(JSON.stringify(FIXTURES[normalized]));
}

module.exports = {
  countUnifiedPlatformTableRows,
  getUnifiedPlatformTestFixture,
  getUnifiedPlatformTestStats,
  isUnifiedPlatformTable,
  listUnifiedPlatformFixtureFamilies,
  resetUnifiedPlatformStore,
  UNIFIED_PLATFORM_TABLES,
};
