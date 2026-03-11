const crypto = require('crypto');
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
  'house_offices',
  'house_staff_agents',
  'house_staff_assignments',
  'house_worker_deployments',
  'house_worker_shares',
  'house_worker_sessions',
  'house_worker_session_events',
  'track_progress_events',
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
  multi_team_archive_seed: 'multi_team_archive_seed.json',
  multi_team_trainer_seed: 'multi_team_trainer_seed.json',
  privy_email_otp_stub_seed: 'privy_email_otp_stub_seed.json',
  live_suite_manifest_expected: 'live_suite_manifest_expected.json',
  route_module_manifest_expected: 'route_module_manifest_expected.json',
  platform_export_roundtrip_seed: 'platform_export_roundtrip_seed.json',
  trainer_real_result_seed: 'trainer_real_result_seed.json',
  sealed_read_policy_seed: 'sealed_read_policy_seed.json',
  platform_experience_registration_seed: 'platform_experience_registration_seed.json',
  house_experiences_seed: 'house_experiences_seed.json',
  house_workshop_seed: 'house_workshop_seed.json',
  house_office_staff_seed: 'house_office_staff_seed.json',
  house_office_structure_seed: 'house_office_structure_seed.json',
  house_office_overview_seed: 'house_office_overview_seed.json',
  house_office_presence_seed: 'house_office_presence_seed.json',
  house_office_briefing_seed: 'house_office_briefing_seed.json',
  house_office_attention_seed: 'house_office_attention_seed.json',
  house_office_assignments_seed: 'house_office_assignments_seed.json',
  house_office_privacy_seed: 'house_office_privacy_seed.json',
  house_office_ops_breadth_seed: 'house_office_ops_breadth_seed.json',
  house_office_team_guard_seed: 'house_office_team_guard_seed.json',
  house_office_reality_smoke_seed: 'house_office_reality_smoke_seed.json',
  house_office_smoke_seed: 'house_office_smoke_seed.json',
  worker_package_registry_seed: 'worker_package_registry_seed.json',
  worker_package_install_seed: 'worker_package_install_seed.json',
  worker_package_share_seed: 'worker_package_share_seed.json',
  worker_package_secret_boundary_seed: 'worker_package_secret_boundary_seed.json',
  worker_package_guidance_seed: 'worker_package_guidance_seed.json',
  tracks_core_seed: 'tracks_core_seed.json',
  tracks_progress_seed: 'tracks_progress_seed.json',
  editor_pack_compat_seed: 'editor_pack_compat_seed.json',
  joined_completion_smoke_seed: 'joined_completion_smoke_seed.json',
});

const TRACK_DEFINITIONS = Object.freeze([
  {
    trackId: 'track_poker_mastery',
    title: 'Poker Mastery',
    targetCount: 4,
  },
  {
    trackId: 'track_web_ops',
    title: 'Web Ops',
    targetCount: 4,
  },
  {
    trackId: 'track_builder',
    title: 'Builder',
    targetCount: 4,
  },
  {
    trackId: 'track_analyst',
    title: 'Analyst',
    targetCount: 5,
  },
]);

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
      idempotency_key TEXT,
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

    CREATE TABLE IF NOT EXISTS house_offices (
      house_office_row_id TEXT PRIMARY KEY,
      house_id TEXT NOT NULL,
      office_id TEXT NOT NULL,
      slug TEXT NOT NULL,
      display_name TEXT NOT NULL,
      purpose TEXT NOT NULL DEFAULT '',
      office_order INTEGER NOT NULL DEFAULT 0,
      map_column INTEGER NOT NULL DEFAULT 1,
      map_row INTEGER NOT NULL DEFAULT 1,
      surface TEXT NOT NULL DEFAULT 'office',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (house_id, office_id),
      UNIQUE (house_id, slug)
    );

    CREATE TABLE IF NOT EXISTS house_staff_agents (
      house_staff_agent_row_id TEXT PRIMARY KEY,
      house_id TEXT NOT NULL,
      team_id TEXT NOT NULL DEFAULT '',
      staff_agent_id TEXT NOT NULL,
      office_id TEXT NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (house_id, team_id, staff_agent_id)
    );

    CREATE TABLE IF NOT EXISTS house_staff_assignments (
      assignment_id TEXT PRIMARY KEY,
      house_id TEXT NOT NULL,
      team_id TEXT NOT NULL,
      office_id TEXT NOT NULL,
      staff_agent_id TEXT NOT NULL,
      focus TEXT NOT NULL,
      source_kind TEXT NOT NULL,
      source_id TEXT NOT NULL,
      source_ref_json TEXT NOT NULL DEFAULT '{}',
      idempotency_key TEXT,
      started_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (house_id, team_id, office_id, staff_agent_id, focus, source_kind, source_id)
    );

    CREATE TABLE IF NOT EXISTS house_worker_deployments (
      deployment_id TEXT PRIMARY KEY,
      house_id TEXT NOT NULL,
      team_id TEXT NOT NULL,
      office_id TEXT NOT NULL,
      staff_agent_id TEXT NOT NULL,
      registry_entity_id TEXT NOT NULL,
      entity_version_id TEXT NOT NULL,
      loadout_id TEXT NOT NULL DEFAULT '',
      bundle_hash TEXT NOT NULL DEFAULT '',
      display_name TEXT NOT NULL,
      status TEXT NOT NULL,
      summary_json TEXT NOT NULL DEFAULT '{}',
      runtime_defaults_json TEXT NOT NULL DEFAULT '{}',
      install_source_json TEXT NOT NULL DEFAULT '{}',
      idempotency_key TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (house_id, team_id, office_id, registry_entity_id, entity_version_id, loadout_id)
    );

    CREATE TABLE IF NOT EXISTS house_worker_shares (
      share_id TEXT PRIMARY KEY,
      registry_entity_id TEXT NOT NULL,
      entity_version_id TEXT NOT NULL,
      loadout_id TEXT NOT NULL DEFAULT '',
      bundle_hash TEXT NOT NULL DEFAULT '',
      share_payload_json TEXT NOT NULL DEFAULT '{}',
      created_by_house_id TEXT,
      created_by_team_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (registry_entity_id, entity_version_id, loadout_id, bundle_hash)
    );

    CREATE TABLE IF NOT EXISTS house_worker_sessions (
      house_worker_session_id TEXT PRIMARY KEY,
      house_id TEXT NOT NULL,
      team_id TEXT NOT NULL,
      deployment_id TEXT NOT NULL,
      parent_session_id TEXT,
      runtime_agent_id TEXT NOT NULL,
      label TEXT NOT NULL,
      status TEXT NOT NULL,
      brain_profile_id TEXT,
      workspace_seed_ref TEXT,
      config_version_id TEXT,
      loadout_id TEXT,
      session_runtime_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS house_worker_session_events (
      house_worker_session_event_id TEXT PRIMARY KEY,
      house_worker_session_id TEXT NOT NULL,
      event_kind TEXT NOT NULL,
      actor TEXT NOT NULL,
      payload_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS track_progress_events (
      track_progress_event_id TEXT PRIMARY KEY,
      house_id TEXT NOT NULL,
      team_id TEXT NOT NULL,
      track_id TEXT NOT NULL,
      title TEXT NOT NULL,
      source_kind TEXT NOT NULL,
      source_id TEXT NOT NULL,
      source_trace_id TEXT,
      source_event_id TEXT,
      source_ref_json TEXT NOT NULL DEFAULT '{}',
      dedupe_key TEXT NOT NULL,
      progress_delta REAL NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      UNIQUE (house_id, team_id, track_id, source_kind, source_id)
    );

    CREATE TABLE IF NOT EXISTS sealed_contexts (
      sealed_context_id TEXT PRIMARY KEY,
      house_id TEXT,
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
  ensureColumn(db, 'config_versions', 'idempotency_key', 'TEXT');
  ensureColumn(db, 'runs', 'config_version_id', 'TEXT');
  ensureColumn(db, 'runs', 'entry_mode', `TEXT NOT NULL DEFAULT 'normal'`);
  ensureColumn(db, 'runs', 'metadata_json', `TEXT NOT NULL DEFAULT '{}'`);
  ensureColumn(db, 'runs', 'completed_at', 'TEXT');
  ensureColumn(db, 'trace_intake_records', 'trace_intake_record_id', 'TEXT');
  ensureColumn(db, 'trace_intake_records', 'source_type', 'TEXT');
  ensureColumn(db, 'trace_intake_records', 'payload_schema', 'TEXT');
  ensureColumn(db, 'trace_intake_records', 'record_kind', `TEXT NOT NULL DEFAULT 'fact'`);
  ensureColumn(db, 'trace_intake_records', 'accepted', 'INTEGER NOT NULL DEFAULT 1');
  ensureColumn(db, 'trace_intake_records', 'producer_kind', 'TEXT');
  ensureColumn(db, 'trace_intake_records', 'producer_id', 'TEXT');
  ensureColumn(db, 'trace_intake_records', 'status', `TEXT NOT NULL DEFAULT 'accepted'`);
  ensureColumn(db, 'trace_intake_records', 'received_at', `TEXT NOT NULL DEFAULT ''`);
  ensureColumn(db, 'trace_intake_records', 'intake_id', 'TEXT');
  ensureColumn(db, 'trace_events', 'event_kind', 'TEXT');
  ensureColumn(db, 'trace_events', 'event_type', 'TEXT');
  ensureColumn(db, 'trace_events', 'source_type', 'TEXT');
  ensureColumn(db, 'trace_events', 'audience_json', `TEXT NOT NULL DEFAULT '{}'`);
  ensureColumn(db, 'trace_events', 'seal_json', `TEXT NOT NULL DEFAULT '{}'`);
  ensureColumn(db, 'trace_events', 'actor_kind', 'TEXT');
  ensureColumn(db, 'trace_events', 'actor_id', 'TEXT');
  ensureColumn(db, 'trace_events', 'sealed_context_id', 'TEXT');
  ensureColumn(db, 'trace_events', 'canonical_at', `TEXT NOT NULL DEFAULT ''`);
  ensureColumn(db, 'sealed_contexts', 'house_id', 'TEXT');
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

function buildFixtureManifest() {
  return listFixtureFamilies().reduce((acc, family) => {
    const filePath = path.join(FIXTURE_DIR, FIXTURE_FILES[family]);
    const raw = fs.readFileSync(filePath, 'utf8');
    acc[family] = `sha256:${crypto.createHash('sha256').update(raw, 'utf8').digest('hex')}`;
    return acc;
  }, {});
}

function parseJsonColumn(raw, fallback) {
  if (typeof raw !== 'string' || !raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function getTrackDefinition(trackId = '') {
  const normalizedTrackId = String(trackId || '').trim();
  if (!normalizedTrackId) return null;
  const found = TRACK_DEFINITIONS.find((entry) => entry.trackId === normalizedTrackId);
  if (!found) return null;
  return {
    trackId: found.trackId,
    title: found.title,
    targetCount: Number(found.targetCount || 0),
  };
}

function listTrackDefinitions() {
  return TRACK_DEFINITIONS.map((entry) => ({
    trackId: entry.trackId,
    title: entry.title,
    targetCount: Number(entry.targetCount || 0),
  }));
}

function mapTrackProgressEventRow(row) {
  if (!row || typeof row !== 'object') return null;
  return {
    trackProgressEventId: String(row.track_progress_event_id || ''),
    houseId: String(row.house_id || ''),
    teamId: String(row.team_id || ''),
    trackId: String(row.track_id || ''),
    title: String(row.title || ''),
    sourceKind: String(row.source_kind || ''),
    sourceId: String(row.source_id || ''),
    sourceTraceId: row.source_trace_id ? String(row.source_trace_id) : null,
    sourceEventId: row.source_event_id ? String(row.source_event_id) : null,
    sourceRef: parseJsonColumn(row.source_ref_json, {}),
    dedupeKey: String(row.dedupe_key || ''),
    progressDelta: Number(row.progress_delta || 0),
    createdAt: String(row.created_at || ''),
  };
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
    idempotencyKey: row.idempotency_key ? String(row.idempotency_key) : null,
    manifest: parseJsonColumn(row.manifest_json, {}),
    lineage: parseJsonColumn(row.lineage_json, {}),
    createdAt: String(row.created_at || ''),
    updatedAt: String(row.updated_at || ''),
  };
}

function mapConfigComponentVersionRow(row) {
  if (!row || typeof row !== 'object') return null;
  return {
    configComponentVersionId: String(row.config_component_version_id || ''),
    configVersionId: String(row.config_version_id || ''),
    componentKind: String(row.component_kind || ''),
    componentKey: String(row.component_key || ''),
    immutableVersionId: String(row.immutable_version_id || ''),
    componentHash: String(row.component_hash || ''),
    metadata: parseJsonColumn(row.metadata_json, {}),
    createdAt: String(row.created_at || ''),
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

function getConfigVersionByIdempotency({
  houseId = '',
  teamId = '',
  idempotencyKey = '',
} = {}) {
  const normalizedHouseId = String(houseId || '').trim();
  const normalizedTeamId = String(teamId || '').trim();
  const normalizedIdempotencyKey = String(idempotencyKey || '').trim();
  if (!normalizedHouseId || !normalizedTeamId || !normalizedIdempotencyKey) return null;
  const database = ensureDb();
  const row = database.prepare(`
    SELECT *
    FROM config_versions
    WHERE house_id = ?
      AND team_id = ?
      AND idempotency_key = ?
    ORDER BY created_at ASC
    LIMIT 1
  `).get(normalizedHouseId, normalizedTeamId, normalizedIdempotencyKey);
  return mapConfigVersionRow(row);
}

function listConfigComponentVersions(configVersionId = '') {
  const normalizedConfigVersionId = String(configVersionId || '').trim();
  if (!normalizedConfigVersionId) return [];
  const database = ensureDb();
  const rows = database.prepare(`
    SELECT *
    FROM config_component_versions
    WHERE config_version_id = ?
    ORDER BY created_at ASC, component_key ASC
  `).all(normalizedConfigVersionId);
  return rows.map(mapConfigComponentVersionRow).filter(Boolean);
}

function mapTeamConfigBindingRow(row) {
  if (!row || typeof row !== 'object') return null;
  return {
    teamBindingId: String(row.team_binding_id || ''),
    houseId: String(row.house_id || ''),
    teamId: String(row.team_id || ''),
    activeConfigVersionId: String(row.active_config_version_id || ''),
    createdAt: String(row.created_at || ''),
    updatedAt: String(row.updated_at || ''),
  };
}

function mapIntegrationCandidateRow(row) {
  if (!row || typeof row !== 'object') return null;
  return {
    integrationCandidateId: String(row.integration_candidate_id || ''),
    idempotencyKey: row.idempotency_key ? String(row.idempotency_key) : null,
    targetUrl: String(row.target_url || ''),
    sourceKind: String(row.source_kind || ''),
    requiresCompilation: Number(row.requires_compilation || 0) === 1,
    candidate: parseJsonColumn(row.candidate_json, {}),
    createdAt: String(row.created_at || ''),
  };
}

function getTeamConfigBinding({
  houseId = '',
  teamId = '',
} = {}) {
  const normalizedHouseId = String(houseId || '').trim();
  const normalizedTeamId = String(teamId || '').trim();
  if (!normalizedHouseId || !normalizedTeamId) return null;
  const database = ensureDb();
  const row = database.prepare(`
    SELECT *
    FROM team_config_bindings
    WHERE house_id = ?
      AND team_id = ?
    LIMIT 1
  `).get(normalizedHouseId, normalizedTeamId);
  return mapTeamConfigBindingRow(row);
}

function listTeamConfigBindings({
  houseId = '',
  teamId = '',
} = {}) {
  const normalizedHouseId = String(houseId || '').trim();
  const normalizedTeamId = String(teamId || '').trim();
  const database = ensureDb();
  const clauses = [];
  const args = [];
  if (normalizedHouseId) {
    clauses.push('house_id = ?');
    args.push(normalizedHouseId);
  }
  if (normalizedTeamId) {
    clauses.push('team_id = ?');
    args.push(normalizedTeamId);
  }
  const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = database.prepare(`
    SELECT *
    FROM team_config_bindings
    ${whereSql}
    ORDER BY created_at DESC, team_binding_id DESC
  `).all(...args);
  return rows.map(mapTeamConfigBindingRow).filter(Boolean);
}

function listHouseTeamIds(houseId = '') {
  const normalizedHouseId = String(houseId || '').trim();
  if (!normalizedHouseId) return [];
  const database = ensureDb();
  const rows = database.prepare(`
    SELECT team_id AS team_id
    FROM team_config_bindings
    WHERE house_id = ?
    UNION
    SELECT team_id AS team_id
    FROM config_versions
    WHERE house_id = ?
    UNION
    SELECT team_id AS team_id
    FROM runs
    WHERE house_id = ?
    UNION
    SELECT team_id AS team_id
    FROM trainer_jobs
    WHERE house_id = ?
    ORDER BY team_id ASC
  `).all(
    normalizedHouseId,
    normalizedHouseId,
    normalizedHouseId,
    normalizedHouseId,
  );
  return rows
    .map((row) => String(row?.team_id || '').trim())
    .filter(Boolean);
}

function getIntegrationCandidateByIdempotency(idempotencyKey = '') {
  const normalizedIdempotencyKey = String(idempotencyKey || '').trim();
  if (!normalizedIdempotencyKey) return null;
  const database = ensureDb();
  const row = database.prepare(`
    SELECT *
    FROM integration_candidates
    WHERE idempotency_key = ?
    ORDER BY created_at ASC
    LIMIT 1
  `).get(normalizedIdempotencyKey);
  return mapIntegrationCandidateRow(row);
}

function getIntegrationCandidateById(integrationCandidateId = '') {
  const normalizedIntegrationCandidateId = String(integrationCandidateId || '').trim();
  if (!normalizedIntegrationCandidateId) return null;
  const database = ensureDb();
  const row = database.prepare(`
    SELECT *
    FROM integration_candidates
    WHERE integration_candidate_id = ?
    LIMIT 1
  `).get(normalizedIntegrationCandidateId);
  return mapIntegrationCandidateRow(row);
}

function upsertConfigVersion({
  configVersionId = '',
  houseId = '',
  teamId = '',
  experienceId = '',
  status = 'draft',
  configHash = '',
  idempotencyKey = '',
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
      idempotency_key,
      status,
      manifest_json,
      lineage_json,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(config_version_id) DO UPDATE SET
      house_id = excluded.house_id,
      team_id = excluded.team_id,
      experience_id = excluded.experience_id,
      config_hash = excluded.config_hash,
      idempotency_key = excluded.idempotency_key,
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
    String(idempotencyKey || '').trim() || null,
    String(status || 'draft').trim() || 'draft',
    JSON.stringify(manifest && typeof manifest === 'object' ? manifest : {}),
    JSON.stringify(lineage && typeof lineage === 'object' ? lineage : {}),
    nowIso,
    nowIso,
  );
  return getConfigVersion(normalizedConfigVersionId);
}

function replaceConfigComponentVersions({
  configVersionId = '',
  components = [],
  nowIso = new Date().toISOString(),
} = {}) {
  const normalizedConfigVersionId = String(configVersionId || '').trim();
  if (!normalizedConfigVersionId) {
    throw new Error('CONFIG_COMPONENT_INVALID');
  }
  const normalizedComponents = Array.isArray(components) ? components : [];
  const database = ensureDb();
  database.exec('BEGIN');
  try {
    database.prepare(`
      DELETE FROM config_component_versions
      WHERE config_version_id = ?
    `).run(normalizedConfigVersionId);
    const insert = database.prepare(`
      INSERT INTO config_component_versions (
        config_component_version_id,
        config_version_id,
        component_kind,
        component_key,
        immutable_version_id,
        component_hash,
        metadata_json,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const component of normalizedComponents) {
      const configComponentVersionId = String(component?.configComponentVersionId || '').trim();
      const componentKind = String(component?.componentKind || '').trim();
      const componentKey = String(component?.componentKey || '').trim();
      const immutableVersionId = String(component?.immutableVersionId || '').trim();
      const componentHash = String(component?.componentHash || '').trim();
      if (!configComponentVersionId || !componentKind || !componentKey || !immutableVersionId || !componentHash) {
        throw new Error('CONFIG_COMPONENT_INVALID');
      }
      insert.run(
        configComponentVersionId,
        normalizedConfigVersionId,
        componentKind,
        componentKey,
        immutableVersionId,
        componentHash,
        JSON.stringify(component?.metadata && typeof component.metadata === 'object' ? component.metadata : {}),
        nowIso,
      );
    }
    database.exec('COMMIT');
  } catch (err) {
    database.exec('ROLLBACK');
    throw err;
  }
  return listConfigComponentVersions(normalizedConfigVersionId);
}

function upsertTeamConfigBinding({
  teamBindingId = '',
  houseId = '',
  teamId = '',
  activeConfigVersionId = '',
  nowIso = new Date().toISOString(),
} = {}) {
  const normalizedHouseId = String(houseId || '').trim();
  const normalizedTeamId = String(teamId || '').trim();
  const normalizedActiveConfigVersionId = String(activeConfigVersionId || '').trim();
  if (!normalizedHouseId || !normalizedTeamId || !normalizedActiveConfigVersionId) {
    throw new Error('TEAM_CONFIG_BINDING_INVALID');
  }
  const existing = getTeamConfigBinding({
    houseId: normalizedHouseId,
    teamId: normalizedTeamId,
  });
  const bindingId = String(teamBindingId || '').trim() || existing?.teamBindingId || '';
  if (!bindingId) {
    throw new Error('TEAM_CONFIG_BINDING_INVALID');
  }
  const database = ensureDb();
  database.prepare(`
    INSERT INTO team_config_bindings (
      team_binding_id,
      house_id,
      team_id,
      active_config_version_id,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(house_id, team_id) DO UPDATE SET
      active_config_version_id = excluded.active_config_version_id,
      updated_at = excluded.updated_at
  `).run(
    bindingId,
    normalizedHouseId,
    normalizedTeamId,
    normalizedActiveConfigVersionId,
    existing?.createdAt || nowIso,
    nowIso,
  );
  return getTeamConfigBinding({
    houseId: normalizedHouseId,
    teamId: normalizedTeamId,
  });
}

function createIntegrationCandidate({
  integrationCandidateId = '',
  idempotencyKey = '',
  targetUrl = '',
  sourceKind = '',
  requiresCompilation = true,
  candidate = null,
  nowIso = new Date().toISOString(),
} = {}) {
  const normalizedIntegrationCandidateId = String(integrationCandidateId || '').trim();
  const normalizedTargetUrl = String(targetUrl || '').trim();
  const normalizedSourceKind = String(sourceKind || '').trim();
  if (!normalizedIntegrationCandidateId || !normalizedTargetUrl || !normalizedSourceKind) {
    throw new Error('INTEGRATION_CANDIDATE_INVALID');
  }
  const database = ensureDb();
  database.prepare(`
    INSERT INTO integration_candidates (
      integration_candidate_id,
      idempotency_key,
      target_url,
      source_kind,
      requires_compilation,
      candidate_json,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    normalizedIntegrationCandidateId,
    String(idempotencyKey || '').trim() || null,
    normalizedTargetUrl,
    normalizedSourceKind,
    requiresCompilation ? 1 : 0,
    JSON.stringify(candidate && typeof candidate === 'object' ? candidate : {}),
    nowIso,
  );
  return getIntegrationCandidateByIdempotency(idempotencyKey) || mapIntegrationCandidateRow({
    integration_candidate_id: normalizedIntegrationCandidateId,
    idempotency_key: String(idempotencyKey || '').trim() || null,
    target_url: normalizedTargetUrl,
    source_kind: normalizedSourceKind,
    requires_compilation: requiresCompilation ? 1 : 0,
    candidate_json: JSON.stringify(candidate && typeof candidate === 'object' ? candidate : {}),
    created_at: nowIso,
  });
}

function mapIntegrationPackVersionRow(row) {
  if (!row || typeof row !== 'object') return null;
  return {
    packVersionId: String(row.pack_version_id || ''),
    integrationId: String(row.integration_id || ''),
    sourceKind: String(row.source_kind || ''),
    contentHash: String(row.content_hash || ''),
    manifest: parseJsonColumn(row.manifest_json, {}),
    fileHashes: parseJsonColumn(row.file_hashes_json, {}),
    idempotencyKey: row.idempotency_key ? String(row.idempotency_key) : null,
    createdAt: String(row.created_at || ''),
    updatedAt: String(row.updated_at || ''),
  };
}

function getIntegrationPackVersionByIdempotency({
  integrationId = '',
  idempotencyKey = '',
} = {}) {
  const normalizedIntegrationId = String(integrationId || '').trim();
  const normalizedIdempotencyKey = String(idempotencyKey || '').trim();
  if (!normalizedIntegrationId || !normalizedIdempotencyKey) return null;
  const database = ensureDb();
  const row = database.prepare(`
    SELECT *
    FROM integration_pack_versions
    WHERE integration_id = ?
      AND idempotency_key = ?
    ORDER BY created_at ASC
    LIMIT 1
  `).get(normalizedIntegrationId, normalizedIdempotencyKey);
  return mapIntegrationPackVersionRow(row);
}

function createIntegrationPackVersion({
  packVersionId = '',
  integrationId = '',
  sourceKind = '',
  contentHash = '',
  manifest = null,
  fileHashes = null,
  idempotencyKey = '',
  nowIso = new Date().toISOString(),
} = {}) {
  const normalizedPackVersionId = String(packVersionId || '').trim();
  const normalizedIntegrationId = String(integrationId || '').trim();
  const normalizedSourceKind = String(sourceKind || '').trim();
  const normalizedContentHash = String(contentHash || '').trim();
  if (!normalizedPackVersionId || !normalizedIntegrationId || !normalizedSourceKind || !normalizedContentHash) {
    throw new Error('INTEGRATION_PACK_VERSION_INVALID');
  }
  const database = ensureDb();
  database.prepare(`
    INSERT INTO integration_pack_versions (
      pack_version_id,
      integration_id,
      source_kind,
      content_hash,
      manifest_json,
      file_hashes_json,
      idempotency_key,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    normalizedPackVersionId,
    normalizedIntegrationId,
    normalizedSourceKind,
    normalizedContentHash,
    JSON.stringify(manifest && typeof manifest === 'object' ? manifest : {}),
    JSON.stringify(fileHashes && typeof fileHashes === 'object' ? fileHashes : {}),
    String(idempotencyKey || '').trim() || null,
    nowIso,
    nowIso,
  );
  return getIntegrationPackVersionByIdempotency({
    integrationId: normalizedIntegrationId,
    idempotencyKey,
  }) || mapIntegrationPackVersionRow({
    pack_version_id: normalizedPackVersionId,
    integration_id: normalizedIntegrationId,
    source_kind: normalizedSourceKind,
    content_hash: normalizedContentHash,
    manifest_json: JSON.stringify(manifest && typeof manifest === 'object' ? manifest : {}),
    file_hashes_json: JSON.stringify(fileHashes && typeof fileHashes === 'object' ? fileHashes : {}),
    idempotency_key: String(idempotencyKey || '').trim() || null,
    created_at: nowIso,
    updated_at: nowIso,
  });
}

function mapIntegrationExecutionRow(row) {
  if (!row || typeof row !== 'object') return null;
  return {
    integrationExecutionId: String(row.integration_execution_id || ''),
    integrationId: String(row.integration_id || ''),
    actionId: String(row.action_id || ''),
    requestedBy: parseJsonColumn(row.requested_by_json, {}),
    approvalId: row.approval_id ? String(row.approval_id) : null,
    status: String(row.status || ''),
    request: parseJsonColumn(row.request_json, {}),
    result: parseJsonColumn(row.result_json, {}),
    idempotencyKey: row.idempotency_key ? String(row.idempotency_key) : null,
    createdAt: String(row.created_at || ''),
    updatedAt: String(row.updated_at || ''),
  };
}

function getIntegrationExecutionByIdempotency({
  integrationId = '',
  idempotencyKey = '',
} = {}) {
  const normalizedIntegrationId = String(integrationId || '').trim();
  const normalizedIdempotencyKey = String(idempotencyKey || '').trim();
  if (!normalizedIntegrationId || !normalizedIdempotencyKey) return null;
  const database = ensureDb();
  const row = database.prepare(`
    SELECT *
    FROM integration_executions
    WHERE integration_id = ?
      AND idempotency_key = ?
    ORDER BY created_at ASC
    LIMIT 1
  `).get(normalizedIntegrationId, normalizedIdempotencyKey);
  return mapIntegrationExecutionRow(row);
}

function createIntegrationExecution({
  integrationExecutionId = '',
  integrationId = '',
  actionId = '',
  requestedBy = null,
  approvalId = '',
  status = 'queued',
  request = null,
  result = null,
  idempotencyKey = '',
  nowIso = new Date().toISOString(),
} = {}) {
  const normalizedIntegrationExecutionId = String(integrationExecutionId || '').trim();
  const normalizedIntegrationId = String(integrationId || '').trim();
  const normalizedActionId = String(actionId || '').trim();
  const normalizedStatus = String(status || '').trim();
  if (!normalizedIntegrationExecutionId || !normalizedIntegrationId || !normalizedActionId || !normalizedStatus) {
    throw new Error('INTEGRATION_EXECUTION_INVALID');
  }
  const database = ensureDb();
  database.prepare(`
    INSERT INTO integration_executions (
      integration_execution_id,
      integration_id,
      action_id,
      requested_by_json,
      approval_id,
      status,
      request_json,
      result_json,
      idempotency_key,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    normalizedIntegrationExecutionId,
    normalizedIntegrationId,
    normalizedActionId,
    JSON.stringify(requestedBy && typeof requestedBy === 'object' ? requestedBy : {}),
    String(approvalId || '').trim() || null,
    normalizedStatus,
    JSON.stringify(request && typeof request === 'object' ? request : {}),
    JSON.stringify(result && typeof result === 'object' ? result : {}),
    String(idempotencyKey || '').trim() || null,
    nowIso,
    nowIso,
  );
  return getIntegrationExecutionByIdempotency({
    integrationId: normalizedIntegrationId,
    idempotencyKey,
  }) || mapIntegrationExecutionRow({
    integration_execution_id: normalizedIntegrationExecutionId,
    integration_id: normalizedIntegrationId,
    action_id: normalizedActionId,
    requested_by_json: JSON.stringify(requestedBy && typeof requestedBy === 'object' ? requestedBy : {}),
    approval_id: String(approvalId || '').trim() || null,
    status: normalizedStatus,
    request_json: JSON.stringify(request && typeof request === 'object' ? request : {}),
    result_json: JSON.stringify(result && typeof result === 'object' ? result : {}),
    idempotency_key: String(idempotencyKey || '').trim() || null,
    created_at: nowIso,
    updated_at: nowIso,
  });
}

function mapTrainerJobRow(row) {
  if (!row || typeof row !== 'object') return null;
  return {
    trainerJobId: String(row.trainer_job_id || ''),
    houseId: row.house_id ? String(row.house_id) : null,
    teamId: row.team_id ? String(row.team_id) : null,
    jobKind: String(row.job_kind || ''),
    status: String(row.status || ''),
    targets: parseJsonColumn(row.targets_json, {}),
    budget: parseJsonColumn(row.budget_json, {}),
    idempotencyKey: row.idempotency_key ? String(row.idempotency_key) : null,
    createdAt: String(row.created_at || ''),
    updatedAt: String(row.updated_at || ''),
  };
}

function getTrainerJobById(trainerJobId = '') {
  const normalizedTrainerJobId = String(trainerJobId || '').trim();
  if (!normalizedTrainerJobId) return null;
  const database = ensureDb();
  const row = database.prepare(`
    SELECT *
    FROM trainer_jobs
    WHERE trainer_job_id = ?
    LIMIT 1
  `).get(normalizedTrainerJobId);
  return mapTrainerJobRow(row);
}

function getTrainerJobByIdempotency({
  houseId = '',
  idempotencyKey = '',
} = {}) {
  const normalizedHouseId = String(houseId || '').trim();
  const normalizedIdempotencyKey = String(idempotencyKey || '').trim();
  if (!normalizedHouseId || !normalizedIdempotencyKey) return null;
  const database = ensureDb();
  const row = database.prepare(`
    SELECT *
    FROM trainer_jobs
    WHERE house_id = ?
      AND idempotency_key = ?
    ORDER BY created_at ASC
    LIMIT 1
  `).get(normalizedHouseId, normalizedIdempotencyKey);
  return mapTrainerJobRow(row);
}

function listTrainerJobs({
  houseId = '',
  teamId = '',
} = {}) {
  const normalizedHouseId = String(houseId || '').trim();
  const normalizedTeamId = String(teamId || '').trim();
  const database = ensureDb();
  let query = `
    SELECT *
    FROM trainer_jobs
  `;
  const args = [];
  if (normalizedHouseId || normalizedTeamId) {
    const clauses = [];
    if (normalizedHouseId) {
      clauses.push('house_id = ?');
      args.push(normalizedHouseId);
    }
    if (normalizedTeamId) {
      clauses.push('team_id = ?');
      args.push(normalizedTeamId);
    }
    query += ` WHERE ${clauses.join(' AND ')}`;
  }
  query += ' ORDER BY created_at DESC, trainer_job_id DESC';
  return database.prepare(query).all(...args).map(mapTrainerJobRow).filter(Boolean);
}

function createTrainerJob({
  trainerJobId = '',
  houseId = '',
  teamId = '',
  jobKind = '',
  status = 'queued',
  targets = null,
  budget = null,
  idempotencyKey = '',
  nowIso = new Date().toISOString(),
} = {}) {
  const normalizedTrainerJobId = String(trainerJobId || '').trim();
  const normalizedHouseId = String(houseId || '').trim();
  const normalizedTeamId = String(teamId || '').trim();
  const normalizedJobKind = String(jobKind || '').trim();
  const normalizedStatus = String(status || '').trim();
  if (!normalizedTrainerJobId || !normalizedHouseId || !normalizedTeamId || !normalizedJobKind || !normalizedStatus) {
    throw new Error('TRAINER_JOB_INVALID');
  }
  const database = ensureDb();
  database.prepare(`
    INSERT INTO trainer_jobs (
      trainer_job_id,
      house_id,
      team_id,
      job_kind,
      status,
      targets_json,
      budget_json,
      idempotency_key,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    normalizedTrainerJobId,
    normalizedHouseId,
    normalizedTeamId,
    normalizedJobKind,
    normalizedStatus,
    JSON.stringify(targets && typeof targets === 'object' ? targets : {}),
    JSON.stringify(budget && typeof budget === 'object' ? budget : {}),
    String(idempotencyKey || '').trim() || null,
    nowIso,
    nowIso,
  );
  return getTrainerJobById(normalizedTrainerJobId);
}

function updateTrainerJobStatus({
  trainerJobId = '',
  status = '',
  nowIso = new Date().toISOString(),
} = {}) {
  const normalizedTrainerJobId = String(trainerJobId || '').trim();
  const normalizedStatus = String(status || '').trim();
  if (!normalizedTrainerJobId || !normalizedStatus) {
    throw new Error('TRAINER_JOB_STATUS_INVALID');
  }
  const database = ensureDb();
  database.prepare(`
    UPDATE trainer_jobs
    SET status = ?,
        updated_at = ?
    WHERE trainer_job_id = ?
  `).run(
    normalizedStatus,
    nowIso,
    normalizedTrainerJobId,
  );
  return getTrainerJobById(normalizedTrainerJobId);
}

function mapTrainerResultRow(row) {
  if (!row || typeof row !== 'object') return null;
  return {
    trainerResultId: String(row.trainer_result_id || ''),
    trainerJobId: String(row.trainer_job_id || ''),
    status: String(row.status || ''),
    result: parseJsonColumn(row.result_json, {}),
    candidatePatchIds: parseJsonColumn(row.candidate_patch_ids_json, []),
    linkedConfigVersionId: row.linked_config_version_id ? String(row.linked_config_version_id) : null,
    approvalNeeded: Number(row.approval_needed || 0) === 1,
    createdAt: String(row.created_at || ''),
    updatedAt: String(row.updated_at || ''),
  };
}

function mapHouseOfficeRow(row) {
  if (!row || typeof row !== 'object') return null;
  return {
    houseOfficeRowId: String(row.house_office_row_id || ''),
    houseId: String(row.house_id || ''),
    officeId: String(row.office_id || ''),
    slug: String(row.slug || ''),
    displayName: String(row.display_name || ''),
    purpose: String(row.purpose || ''),
    order: Number(row.office_order || 0),
    mapColumn: Number(row.map_column || 0),
    mapRow: Number(row.map_row || 0),
    surface: String(row.surface || ''),
    createdAt: String(row.created_at || ''),
    updatedAt: String(row.updated_at || ''),
  };
}

function mapHouseStaffAgentRow(row) {
  if (!row || typeof row !== 'object') return null;
  return {
    houseStaffAgentRowId: String(row.house_staff_agent_row_id || ''),
    houseId: String(row.house_id || ''),
    teamId: String(row.team_id || ''),
    staffAgentId: String(row.staff_agent_id || ''),
    officeId: String(row.office_id || ''),
    displayName: String(row.display_name || ''),
    role: String(row.role || ''),
    createdAt: String(row.created_at || ''),
    updatedAt: String(row.updated_at || ''),
  };
}

function listHouseOffices({
  houseId = '',
} = {}) {
  const normalizedHouseId = String(houseId || '').trim();
  if (!normalizedHouseId) return [];
  const database = ensureDb();
  const rows = database.prepare(`
    SELECT *
    FROM house_offices
    WHERE house_id = ?
    ORDER BY office_order ASC, slug ASC, office_id ASC
  `).all(normalizedHouseId);
  return rows.map(mapHouseOfficeRow).filter(Boolean);
}

function listHouseStaffAgents({
  houseId = '',
  teamId = '',
} = {}) {
  const normalizedHouseId = String(houseId || '').trim();
  const normalizedTeamId = String(teamId || '').trim();
  if (!normalizedHouseId) return [];
  const database = ensureDb();
  let rows;
  if (normalizedTeamId) {
    rows = database.prepare(`
      SELECT *
      FROM house_staff_agents
      WHERE house_id = ?
        AND (team_id = '' OR team_id = ?)
      ORDER BY CASE WHEN team_id = ? THEN 0 ELSE 1 END ASC, display_name ASC, staff_agent_id ASC
    `).all(normalizedHouseId, normalizedTeamId, normalizedTeamId);
  } else {
    rows = database.prepare(`
      SELECT *
      FROM house_staff_agents
      WHERE house_id = ?
      ORDER BY CASE WHEN team_id = '' THEN 0 ELSE 1 END ASC, display_name ASC, staff_agent_id ASC
    `).all(normalizedHouseId);
  }
  const seen = new Set();
  return rows
    .map(mapHouseStaffAgentRow)
    .filter(Boolean)
    .filter((entry) => {
      const staffAgentId = String(entry?.staffAgentId || '').trim();
      if (!staffAgentId || seen.has(staffAgentId)) return false;
      seen.add(staffAgentId);
      return true;
    });
}

function buildDefaultHouseOfficeStructureSeed() {
  const structureFixture = loadFixtureFamily('house_office_structure_seed');
  if (structureFixture && typeof structureFixture === 'object' && !Array.isArray(structureFixture)) {
    return structureFixture;
  }
  const overviewFixture = loadFixtureFamily('house_office_overview_seed') || {};
  const staffFixture = loadFixtureFamily('house_office_staff_seed') || {};
  return {
    family: 'house_office_structure_seed',
    schema: 'agent-town-house-office-structure-seed/v1',
    offices: Array.isArray(overviewFixture?.offices) ? overviewFixture.offices : [],
    staffAgents: Array.isArray(staffFixture?.staffAgents) ? staffFixture.staffAgents : [],
  };
}

function ensureHouseOfficeStructure({
  houseId = '',
  nowIso = new Date().toISOString(),
} = {}) {
  const normalizedHouseId = String(houseId || '').trim();
  if (!normalizedHouseId) return {
    sourceKind: 'unattached_preview',
    offices: [],
    staffAgents: [],
  };
  const database = ensureDb();
  const structureSeed = buildDefaultHouseOfficeStructureSeed();
  const seededOffices = Array.isArray(structureSeed?.offices) ? structureSeed.offices : [];
  const seededStaffAgents = Array.isArray(structureSeed?.staffAgents) ? structureSeed.staffAgents : [];

  database.exec('BEGIN');
  try {
    for (const entry of seededOffices) {
      const officeId = String(entry?.officeId || '').trim();
      const slug = String(entry?.slug || '').trim();
      if (!officeId || !slug) continue;
      const rowId = `hoffice_${crypto.createHash('sha256').update(`${normalizedHouseId}:${officeId}`, 'utf8').digest('hex').slice(0, 24)}`;
      database.prepare(`
        INSERT INTO house_offices (
          house_office_row_id,
          house_id,
          office_id,
          slug,
          display_name,
          purpose,
          office_order,
          map_column,
          map_row,
          surface,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(house_id, office_id) DO UPDATE SET
          slug = excluded.slug,
          display_name = excluded.display_name,
          purpose = excluded.purpose,
          office_order = excluded.office_order,
          map_column = excluded.map_column,
          map_row = excluded.map_row,
          surface = excluded.surface,
          updated_at = excluded.updated_at
      `).run(
        rowId,
        normalizedHouseId,
        officeId,
        slug,
        String(entry?.displayName || slug || officeId).trim() || officeId,
        String(entry?.purpose || '').trim(),
        Number.isFinite(Number(entry?.order)) ? Math.floor(Number(entry.order)) : 0,
        Number.isFinite(Number(entry?.mapColumn)) ? Math.max(1, Math.floor(Number(entry.mapColumn))) : 1,
        Number.isFinite(Number(entry?.mapRow)) ? Math.max(1, Math.floor(Number(entry.mapRow))) : 1,
        String(entry?.surface || 'office').trim() || 'office',
        nowIso,
        nowIso,
      );
    }

    for (const entry of seededStaffAgents) {
      const staffAgentId = String(entry?.staffAgentId || '').trim();
      const officeId = String(entry?.officeId || '').trim();
      if (!staffAgentId || !officeId) continue;
      const teamId = String(entry?.teamId || '').trim();
      const rowId = `hstaff_${crypto.createHash('sha256').update(`${normalizedHouseId}:${teamId}:${staffAgentId}`, 'utf8').digest('hex').slice(0, 24)}`;
      database.prepare(`
        INSERT INTO house_staff_agents (
          house_staff_agent_row_id,
          house_id,
          team_id,
          staff_agent_id,
          office_id,
          display_name,
          role,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(house_id, team_id, staff_agent_id) DO UPDATE SET
          office_id = excluded.office_id,
          display_name = excluded.display_name,
          role = excluded.role,
          updated_at = excluded.updated_at
      `).run(
        rowId,
        normalizedHouseId,
        teamId,
        staffAgentId,
        officeId,
        String(entry?.displayName || staffAgentId).trim() || staffAgentId,
        String(entry?.role || 'staff').trim() || 'staff',
        nowIso,
        nowIso,
      );
    }
    database.exec('COMMIT');
  } catch (err) {
    database.exec('ROLLBACK');
    throw err;
  }
  return {
    sourceKind: 'durable_house_structure',
    offices: listHouseOffices({ houseId: normalizedHouseId }),
    staffAgents: listHouseStaffAgents({ houseId: normalizedHouseId }),
  };
}

function mapHouseStaffAssignmentRow(row) {
  if (!row || typeof row !== 'object') return null;
  return {
    assignmentId: String(row.assignment_id || ''),
    houseId: String(row.house_id || ''),
    teamId: String(row.team_id || ''),
    officeId: String(row.office_id || ''),
    staffAgentId: String(row.staff_agent_id || ''),
    focus: String(row.focus || ''),
    sourceKind: String(row.source_kind || ''),
    sourceId: String(row.source_id || ''),
    sourceRef: parseJsonColumn(row.source_ref_json, {}),
    idempotencyKey: row.idempotency_key ? String(row.idempotency_key) : null,
    startedAt: String(row.started_at || ''),
    createdAt: String(row.created_at || ''),
    updatedAt: String(row.updated_at || ''),
  };
}

function listHouseStaffAssignments({
  houseId = '',
  teamId = '',
} = {}) {
  const normalizedHouseId = String(houseId || '').trim();
  const normalizedTeamId = String(teamId || '').trim();
  const database = ensureDb();
  const clauses = [];
  const args = [];
  if (normalizedHouseId) {
    clauses.push('house_id = ?');
    args.push(normalizedHouseId);
  }
  if (normalizedTeamId) {
    clauses.push('team_id = ?');
    args.push(normalizedTeamId);
  }
  const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = database.prepare(`
    SELECT *
    FROM house_staff_assignments
    ${whereSql}
    ORDER BY started_at DESC, created_at DESC, assignment_id ASC
  `).all(...args);
  return rows.map(mapHouseStaffAssignmentRow).filter(Boolean);
}

function createHouseStaffAssignment({
  assignmentId = '',
  houseId = '',
  teamId = '',
  officeId = '',
  staffAgentId = '',
  focus = '',
  sourceKind = '',
  sourceId = '',
  sourceRef = null,
  idempotencyKey = '',
  startedAt = '',
  nowIso = new Date().toISOString(),
} = {}) {
  const normalizedAssignmentId = String(assignmentId || '').trim();
  const normalizedHouseId = String(houseId || '').trim();
  const normalizedTeamId = String(teamId || '').trim();
  const normalizedOfficeId = String(officeId || '').trim();
  const normalizedStaffAgentId = String(staffAgentId || '').trim();
  const normalizedFocus = String(focus || '').trim();
  const normalizedSourceKind = String(sourceKind || '').trim();
  const normalizedSourceId = String(sourceId || '').trim();
  const normalizedStartedAt = String(startedAt || '').trim() || nowIso;
  if (
    !normalizedAssignmentId
    || !normalizedHouseId
    || !normalizedTeamId
    || !normalizedOfficeId
    || !normalizedStaffAgentId
    || !normalizedFocus
    || !normalizedSourceKind
    || !normalizedSourceId
  ) {
    throw new Error('HOUSE_STAFF_ASSIGNMENT_INVALID');
  }
  const database = ensureDb();
  const existing = database.prepare(`
    SELECT *
    FROM house_staff_assignments
    WHERE house_id = ?
      AND team_id = ?
      AND office_id = ?
      AND staff_agent_id = ?
      AND focus = ?
      AND source_kind = ?
      AND source_id = ?
    LIMIT 1
  `).get(
    normalizedHouseId,
    normalizedTeamId,
    normalizedOfficeId,
    normalizedStaffAgentId,
    normalizedFocus,
    normalizedSourceKind,
    normalizedSourceId,
  );
  if (existing) {
    return mapHouseStaffAssignmentRow(existing);
  }
  database.prepare(`
    INSERT INTO house_staff_assignments (
      assignment_id,
      house_id,
      team_id,
      office_id,
      staff_agent_id,
      focus,
      source_kind,
      source_id,
      source_ref_json,
      idempotency_key,
      started_at,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    normalizedAssignmentId,
    normalizedHouseId,
    normalizedTeamId,
    normalizedOfficeId,
    normalizedStaffAgentId,
    normalizedFocus,
    normalizedSourceKind,
    normalizedSourceId,
    JSON.stringify(sourceRef && typeof sourceRef === 'object' ? sourceRef : {}),
    String(idempotencyKey || '').trim() || null,
    normalizedStartedAt,
    nowIso,
    nowIso,
  );
  const row = database.prepare(`
    SELECT *
    FROM house_staff_assignments
    WHERE assignment_id = ?
    LIMIT 1
  `).get(normalizedAssignmentId);
  return mapHouseStaffAssignmentRow(row);
}

function mapHouseWorkerDeploymentRow(row) {
  if (!row || typeof row !== 'object') return null;
  return {
    deploymentId: String(row.deployment_id || ''),
    houseId: String(row.house_id || ''),
    teamId: String(row.team_id || ''),
    officeId: String(row.office_id || ''),
    staffAgentId: String(row.staff_agent_id || ''),
    registryEntityId: String(row.registry_entity_id || ''),
    entityVersionId: String(row.entity_version_id || ''),
    loadoutId: String(row.loadout_id || ''),
    bundleHash: String(row.bundle_hash || ''),
    displayName: String(row.display_name || ''),
    status: String(row.status || ''),
    summary: parseJsonColumn(row.summary_json, {}),
    runtimeDefaults: parseJsonColumn(row.runtime_defaults_json, {}),
    installSource: parseJsonColumn(row.install_source_json, {}),
    idempotencyKey: row.idempotency_key ? String(row.idempotency_key) : null,
    createdAt: String(row.created_at || ''),
    updatedAt: String(row.updated_at || ''),
  };
}

function listHouseWorkerDeployments({
  houseId = '',
  teamId = '',
} = {}) {
  const normalizedHouseId = String(houseId || '').trim();
  const normalizedTeamId = String(teamId || '').trim();
  if (!normalizedHouseId) return [];
  const database = ensureDb();
  const rows = database.prepare(`
    SELECT *
    FROM house_worker_deployments
    WHERE house_id = ?
      AND (? = '' OR team_id = ?)
    ORDER BY created_at ASC, deployment_id ASC
  `).all(normalizedHouseId, normalizedTeamId, normalizedTeamId);
  return rows.map(mapHouseWorkerDeploymentRow).filter(Boolean);
}

function getHouseWorkerDeploymentById(deploymentId = '') {
  const normalizedDeploymentId = String(deploymentId || '').trim();
  if (!normalizedDeploymentId) return null;
  const database = ensureDb();
  const row = database.prepare(`
    SELECT *
    FROM house_worker_deployments
    WHERE deployment_id = ?
    LIMIT 1
  `).get(normalizedDeploymentId);
  return mapHouseWorkerDeploymentRow(row);
}

function createHouseWorkerDeployment({
  deploymentId = '',
  houseId = '',
  teamId = '',
  officeId = '',
  staffAgentId = '',
  registryEntityId = '',
  entityVersionId = '',
  loadoutId = '',
  bundleHash = '',
  displayName = '',
  status = '',
  summary = null,
  runtimeDefaults = null,
  installSource = null,
  idempotencyKey = '',
  nowIso = new Date().toISOString(),
} = {}) {
  const normalizedDeploymentId = String(deploymentId || '').trim();
  const normalizedHouseId = String(houseId || '').trim();
  const normalizedTeamId = String(teamId || '').trim();
  const normalizedOfficeId = String(officeId || '').trim();
  const normalizedStaffAgentId = String(staffAgentId || '').trim();
  const normalizedRegistryEntityId = String(registryEntityId || '').trim();
  const normalizedEntityVersionId = String(entityVersionId || '').trim();
  const normalizedLoadoutId = String(loadoutId || '').trim();
  const normalizedBundleHash = String(bundleHash || '').trim();
  const normalizedDisplayName = String(displayName || '').trim();
  const normalizedStatus = String(status || '').trim();
  if (
    !normalizedDeploymentId
    || !normalizedHouseId
    || !normalizedTeamId
    || !normalizedOfficeId
    || !normalizedStaffAgentId
    || !normalizedRegistryEntityId
    || !normalizedEntityVersionId
    || !normalizedDisplayName
    || !normalizedStatus
  ) {
    throw new Error('HOUSE_WORKER_DEPLOYMENT_INVALID');
  }
  const database = ensureDb();
  const existing = database.prepare(`
    SELECT *
    FROM house_worker_deployments
    WHERE house_id = ?
      AND team_id = ?
      AND office_id = ?
      AND registry_entity_id = ?
      AND entity_version_id = ?
      AND loadout_id = ?
    LIMIT 1
  `).get(
    normalizedHouseId,
    normalizedTeamId,
    normalizedOfficeId,
    normalizedRegistryEntityId,
    normalizedEntityVersionId,
    normalizedLoadoutId,
  );
  if (existing) {
    return mapHouseWorkerDeploymentRow(existing);
  }
  database.prepare(`
    INSERT INTO house_worker_deployments (
      deployment_id,
      house_id,
      team_id,
      office_id,
      staff_agent_id,
      registry_entity_id,
      entity_version_id,
      loadout_id,
      bundle_hash,
      display_name,
      status,
      summary_json,
      runtime_defaults_json,
      install_source_json,
      idempotency_key,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    normalizedDeploymentId,
    normalizedHouseId,
    normalizedTeamId,
    normalizedOfficeId,
    normalizedStaffAgentId,
    normalizedRegistryEntityId,
    normalizedEntityVersionId,
    normalizedLoadoutId,
    normalizedBundleHash,
    normalizedDisplayName,
    normalizedStatus,
    JSON.stringify(summary && typeof summary === 'object' ? summary : {}),
    JSON.stringify(runtimeDefaults && typeof runtimeDefaults === 'object' ? runtimeDefaults : {}),
    JSON.stringify(installSource && typeof installSource === 'object' ? installSource : {}),
    String(idempotencyKey || '').trim() || null,
    nowIso,
    nowIso,
  );
  return getHouseWorkerDeploymentById(normalizedDeploymentId);
}

function mapHouseWorkerShareRow(row) {
  if (!row || typeof row !== 'object') return null;
  return {
    shareId: String(row.share_id || ''),
    registryEntityId: String(row.registry_entity_id || ''),
    entityVersionId: String(row.entity_version_id || ''),
    loadoutId: String(row.loadout_id || ''),
    bundleHash: String(row.bundle_hash || ''),
    payload: parseJsonColumn(row.share_payload_json, {}),
    createdByHouseId: row.created_by_house_id ? String(row.created_by_house_id) : null,
    createdByTeamId: row.created_by_team_id ? String(row.created_by_team_id) : null,
    createdAt: String(row.created_at || ''),
    updatedAt: String(row.updated_at || ''),
  };
}

function getHouseWorkerShareById(shareId = '') {
  const normalizedShareId = String(shareId || '').trim();
  if (!normalizedShareId) return null;
  const database = ensureDb();
  const row = database.prepare(`
    SELECT *
    FROM house_worker_shares
    WHERE share_id = ?
    LIMIT 1
  `).get(normalizedShareId);
  return mapHouseWorkerShareRow(row);
}

function createHouseWorkerShare({
  shareId = '',
  registryEntityId = '',
  entityVersionId = '',
  loadoutId = '',
  bundleHash = '',
  payload = null,
  createdByHouseId = '',
  createdByTeamId = '',
  nowIso = new Date().toISOString(),
} = {}) {
  const normalizedShareId = String(shareId || '').trim();
  const normalizedRegistryEntityId = String(registryEntityId || '').trim();
  const normalizedEntityVersionId = String(entityVersionId || '').trim();
  const normalizedLoadoutId = String(loadoutId || '').trim();
  const normalizedBundleHash = String(bundleHash || '').trim();
  if (!normalizedShareId || !normalizedRegistryEntityId || !normalizedEntityVersionId) {
    throw new Error('HOUSE_WORKER_SHARE_INVALID');
  }
  const database = ensureDb();
  const existing = database.prepare(`
    SELECT *
    FROM house_worker_shares
    WHERE registry_entity_id = ?
      AND entity_version_id = ?
      AND loadout_id = ?
      AND bundle_hash = ?
    LIMIT 1
  `).get(
    normalizedRegistryEntityId,
    normalizedEntityVersionId,
    normalizedLoadoutId,
    normalizedBundleHash,
  );
  if (existing) {
    return mapHouseWorkerShareRow(existing);
  }
  database.prepare(`
    INSERT INTO house_worker_shares (
      share_id,
      registry_entity_id,
      entity_version_id,
      loadout_id,
      bundle_hash,
      share_payload_json,
      created_by_house_id,
      created_by_team_id,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    normalizedShareId,
    normalizedRegistryEntityId,
    normalizedEntityVersionId,
    normalizedLoadoutId,
    normalizedBundleHash,
    JSON.stringify(payload && typeof payload === 'object' ? payload : {}),
    String(createdByHouseId || '').trim() || null,
    String(createdByTeamId || '').trim() || null,
    nowIso,
    nowIso,
  );
  return getHouseWorkerShareById(normalizedShareId);
}

function mapHouseWorkerSessionRow(row) {
  if (!row || typeof row !== 'object') return null;
  return {
    houseWorkerSessionId: String(row.house_worker_session_id || ''),
    houseId: String(row.house_id || ''),
    teamId: String(row.team_id || ''),
    deploymentId: String(row.deployment_id || ''),
    parentSessionId: row.parent_session_id ? String(row.parent_session_id) : null,
    runtimeAgentId: String(row.runtime_agent_id || ''),
    label: String(row.label || ''),
    status: String(row.status || ''),
    brainProfileId: row.brain_profile_id ? String(row.brain_profile_id) : null,
    workspaceSeedRef: row.workspace_seed_ref ? String(row.workspace_seed_ref) : null,
    configVersionId: row.config_version_id ? String(row.config_version_id) : null,
    loadoutId: row.loadout_id ? String(row.loadout_id) : null,
    runtime: parseJsonColumn(row.session_runtime_json, {}),
    createdAt: String(row.created_at || ''),
    updatedAt: String(row.updated_at || ''),
  };
}

function getHouseWorkerSessionById(houseWorkerSessionId = '') {
  const normalizedSessionId = String(houseWorkerSessionId || '').trim();
  if (!normalizedSessionId) return null;
  const database = ensureDb();
  const row = database.prepare(`
    SELECT *
    FROM house_worker_sessions
    WHERE house_worker_session_id = ?
    LIMIT 1
  `).get(normalizedSessionId);
  return mapHouseWorkerSessionRow(row);
}

function listHouseWorkerSessions({
  houseId = '',
  teamId = '',
} = {}) {
  const normalizedHouseId = String(houseId || '').trim();
  const normalizedTeamId = String(teamId || '').trim();
  if (!normalizedHouseId) return [];
  const database = ensureDb();
  const rows = database.prepare(`
    SELECT *
    FROM house_worker_sessions
    WHERE house_id = ?
      AND (? = '' OR team_id = ?)
    ORDER BY created_at ASC, house_worker_session_id ASC
  `).all(normalizedHouseId, normalizedTeamId, normalizedTeamId);
  return rows.map(mapHouseWorkerSessionRow).filter(Boolean);
}

function createHouseWorkerSession({
  houseWorkerSessionId = '',
  houseId = '',
  teamId = '',
  deploymentId = '',
  parentSessionId = '',
  runtimeAgentId = '',
  label = '',
  status = '',
  brainProfileId = '',
  workspaceSeedRef = '',
  configVersionId = '',
  loadoutId = '',
  runtime = null,
  nowIso = new Date().toISOString(),
} = {}) {
  const normalizedHouseWorkerSessionId = String(houseWorkerSessionId || '').trim();
  const normalizedHouseId = String(houseId || '').trim();
  const normalizedTeamId = String(teamId || '').trim();
  const normalizedDeploymentId = String(deploymentId || '').trim();
  const normalizedRuntimeAgentId = String(runtimeAgentId || '').trim();
  const normalizedLabel = String(label || '').trim();
  const normalizedStatus = String(status || '').trim();
  if (
    !normalizedHouseWorkerSessionId
    || !normalizedHouseId
    || !normalizedTeamId
    || !normalizedDeploymentId
    || !normalizedRuntimeAgentId
    || !normalizedLabel
    || !normalizedStatus
  ) {
    throw new Error('HOUSE_WORKER_SESSION_INVALID');
  }
  const database = ensureDb();
  const existing = getHouseWorkerSessionById(normalizedHouseWorkerSessionId);
  if (existing) return existing;
  database.prepare(`
    INSERT INTO house_worker_sessions (
      house_worker_session_id,
      house_id,
      team_id,
      deployment_id,
      parent_session_id,
      runtime_agent_id,
      label,
      status,
      brain_profile_id,
      workspace_seed_ref,
      config_version_id,
      loadout_id,
      session_runtime_json,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    normalizedHouseWorkerSessionId,
    normalizedHouseId,
    normalizedTeamId,
    normalizedDeploymentId,
    String(parentSessionId || '').trim() || null,
    normalizedRuntimeAgentId,
    normalizedLabel,
    normalizedStatus,
    String(brainProfileId || '').trim() || null,
    String(workspaceSeedRef || '').trim() || null,
    String(configVersionId || '').trim() || null,
    String(loadoutId || '').trim() || null,
    JSON.stringify(runtime && typeof runtime === 'object' ? runtime : {}),
    nowIso,
    nowIso,
  );
  return getHouseWorkerSessionById(normalizedHouseWorkerSessionId);
}

function updateHouseWorkerSession({
  houseWorkerSessionId = '',
  status = undefined,
  runtime = undefined,
  updatedAt = new Date().toISOString(),
} = {}) {
  const existing = getHouseWorkerSessionById(houseWorkerSessionId);
  if (!existing) return null;
  const nextStatus = status === undefined ? existing.status : String(status || '').trim();
  const nextRuntime = runtime === undefined
    ? existing.runtime
    : (runtime && typeof runtime === 'object' ? runtime : {});
  const database = ensureDb();
  database.prepare(`
    UPDATE house_worker_sessions
    SET status = ?,
        session_runtime_json = ?,
        updated_at = ?
    WHERE house_worker_session_id = ?
  `).run(
    nextStatus || existing.status,
    JSON.stringify(nextRuntime),
    String(updatedAt || '').trim() || new Date().toISOString(),
    String(houseWorkerSessionId || '').trim(),
  );
  return getHouseWorkerSessionById(houseWorkerSessionId);
}

function mapHouseWorkerSessionEventRow(row) {
  if (!row || typeof row !== 'object') return null;
  return {
    houseWorkerSessionEventId: String(row.house_worker_session_event_id || ''),
    houseWorkerSessionId: String(row.house_worker_session_id || ''),
    eventKind: String(row.event_kind || ''),
    actor: String(row.actor || ''),
    payload: parseJsonColumn(row.payload_json, {}),
    createdAt: String(row.created_at || ''),
  };
}

function listHouseWorkerSessionEvents({
  houseWorkerSessionId = '',
} = {}) {
  const normalizedSessionId = String(houseWorkerSessionId || '').trim();
  if (!normalizedSessionId) return [];
  const database = ensureDb();
  const rows = database.prepare(`
    SELECT *
    FROM house_worker_session_events
    WHERE house_worker_session_id = ?
    ORDER BY created_at ASC, house_worker_session_event_id ASC
  `).all(normalizedSessionId);
  return rows.map(mapHouseWorkerSessionEventRow).filter(Boolean);
}

function createHouseWorkerSessionEvent({
  houseWorkerSessionEventId = '',
  houseWorkerSessionId = '',
  eventKind = '',
  actor = '',
  payload = null,
  createdAt = new Date().toISOString(),
} = {}) {
  const normalizedEventId = String(houseWorkerSessionEventId || '').trim();
  const normalizedSessionId = String(houseWorkerSessionId || '').trim();
  const normalizedEventKind = String(eventKind || '').trim();
  const normalizedActor = String(actor || '').trim();
  if (!normalizedEventId || !normalizedSessionId || !normalizedEventKind || !normalizedActor) {
    throw new Error('HOUSE_WORKER_SESSION_EVENT_INVALID');
  }
  const database = ensureDb();
  database.prepare(`
    INSERT INTO house_worker_session_events (
      house_worker_session_event_id,
      house_worker_session_id,
      event_kind,
      actor,
      payload_json,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    normalizedEventId,
    normalizedSessionId,
    normalizedEventKind,
    normalizedActor,
    JSON.stringify(payload && typeof payload === 'object' ? payload : {}),
    String(createdAt || '').trim() || new Date().toISOString(),
  );
  const row = database.prepare(`
    SELECT *
    FROM house_worker_session_events
    WHERE house_worker_session_event_id = ?
    LIMIT 1
  `).get(normalizedEventId);
  return mapHouseWorkerSessionEventRow(row);
}

function getTrainerResultById(trainerResultId = '') {
  const normalizedTrainerResultId = String(trainerResultId || '').trim();
  if (!normalizedTrainerResultId) return null;
  const database = ensureDb();
  const row = database.prepare(`
    SELECT *
    FROM trainer_results
    WHERE trainer_result_id = ?
    LIMIT 1
  `).get(normalizedTrainerResultId);
  return mapTrainerResultRow(row);
}

function getTrainerResultByJobId(trainerJobId = '') {
  const normalizedTrainerJobId = String(trainerJobId || '').trim();
  if (!normalizedTrainerJobId) return null;
  const database = ensureDb();
  const row = database.prepare(`
    SELECT *
    FROM trainer_results
    WHERE trainer_job_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `).get(normalizedTrainerJobId);
  return mapTrainerResultRow(row);
}

function listTrainerResults({
  houseId = '',
  teamId = '',
} = {}) {
  const normalizedHouseId = String(houseId || '').trim();
  const normalizedTeamId = String(teamId || '').trim();
  const database = ensureDb();
  const clauses = [];
  const args = [];
  if (normalizedHouseId) {
    clauses.push('j.house_id = ?');
    args.push(normalizedHouseId);
  }
  if (normalizedTeamId) {
    clauses.push('j.team_id = ?');
    args.push(normalizedTeamId);
  }
  const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = database.prepare(`
    SELECT r.*
    FROM trainer_results r
    JOIN trainer_jobs j
      ON j.trainer_job_id = r.trainer_job_id
    ${whereSql}
    ORDER BY r.created_at DESC, r.trainer_result_id DESC
  `).all(...args);
  return rows.map(mapTrainerResultRow).filter(Boolean);
}

function countTrackProgressEventsByDedupe({
  houseId = '',
  teamId = '',
  trackId = '',
  dedupeKey = '',
} = {}) {
  const normalizedHouseId = String(houseId || '').trim();
  const normalizedTeamId = String(teamId || '').trim();
  const normalizedTrackId = String(trackId || '').trim();
  const normalizedDedupeKey = String(dedupeKey || '').trim();
  if (!normalizedHouseId || !normalizedTeamId || !normalizedTrackId || !normalizedDedupeKey) {
    return 0;
  }
  const database = ensureDb();
  const row = database.prepare(`
    SELECT COUNT(1) AS count
    FROM track_progress_events
    WHERE house_id = ?
      AND team_id = ?
      AND track_id = ?
      AND dedupe_key = ?
  `).get(
    normalizedHouseId,
    normalizedTeamId,
    normalizedTrackId,
    normalizedDedupeKey,
  );
  return Number(row?.count || 0);
}

function listTrackProgressEvents({
  houseId = '',
  teamId = '',
  trackId = '',
} = {}) {
  const normalizedHouseId = String(houseId || '').trim();
  const normalizedTeamId = String(teamId || '').trim();
  const normalizedTrackId = String(trackId || '').trim();
  const database = ensureDb();
  const clauses = [];
  const args = [];
  if (normalizedHouseId) {
    clauses.push('house_id = ?');
    args.push(normalizedHouseId);
  }
  if (normalizedTeamId) {
    clauses.push('team_id = ?');
    args.push(normalizedTeamId);
  }
  if (normalizedTrackId) {
    clauses.push('track_id = ?');
    args.push(normalizedTrackId);
  }
  const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = database.prepare(`
    SELECT *
    FROM track_progress_events
    ${whereSql}
    ORDER BY created_at ASC, track_id ASC, source_kind ASC, source_id ASC
  `).all(...args);
  return rows.map(mapTrackProgressEventRow).filter(Boolean);
}

function createTrackProgressEvent({
  trackProgressEventId = '',
  houseId = '',
  teamId = '',
  trackId = '',
  sourceKind = '',
  sourceId = '',
  sourceTraceId = '',
  sourceEventId = '',
  sourceRef = null,
  dedupeKey = '',
  progressDelta = 1,
  nowIso = new Date().toISOString(),
} = {}) {
  const normalizedTrackProgressEventId = String(trackProgressEventId || '').trim();
  const normalizedHouseId = String(houseId || '').trim();
  const normalizedTeamId = String(teamId || '').trim();
  const normalizedTrackId = String(trackId || '').trim();
  const normalizedSourceKind = String(sourceKind || '').trim();
  const normalizedSourceId = String(sourceId || '').trim();
  const normalizedDedupeKey = String(dedupeKey || '').trim();
  const normalizedProgressDelta = Number(progressDelta || 0);
  const track = getTrackDefinition(normalizedTrackId);
  if (
    !normalizedTrackProgressEventId
    || !normalizedHouseId
    || !normalizedTeamId
    || !track
    || !normalizedSourceKind
    || !normalizedSourceId
    || !normalizedDedupeKey
    || !Number.isFinite(normalizedProgressDelta)
    || normalizedProgressDelta <= 0
  ) {
    throw new Error('TRACK_PROGRESS_EVENT_INVALID');
  }
  const database = ensureDb();
  database.prepare(`
    INSERT INTO track_progress_events (
      track_progress_event_id,
      house_id,
      team_id,
      track_id,
      title,
      source_kind,
      source_id,
      source_trace_id,
      source_event_id,
      source_ref_json,
      dedupe_key,
      progress_delta,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(house_id, team_id, track_id, source_kind, source_id) DO NOTHING
  `).run(
    normalizedTrackProgressEventId,
    normalizedHouseId,
    normalizedTeamId,
    track.trackId,
    track.title,
    normalizedSourceKind,
    normalizedSourceId,
    String(sourceTraceId || '').trim() || null,
    String(sourceEventId || '').trim() || null,
    JSON.stringify(sourceRef && typeof sourceRef === 'object' ? sourceRef : {}),
    normalizedDedupeKey,
    normalizedProgressDelta,
    nowIso,
  );
  const row = database.prepare(`
    SELECT *
    FROM track_progress_events
    WHERE house_id = ?
      AND team_id = ?
      AND track_id = ?
      AND source_kind = ?
      AND source_id = ?
    LIMIT 1
  `).get(
    normalizedHouseId,
    normalizedTeamId,
    track.trackId,
    normalizedSourceKind,
    normalizedSourceId,
  );
  return mapTrackProgressEventRow(row);
}

function createTrainerResult({
  trainerResultId = '',
  trainerJobId = '',
  status = 'succeeded',
  result = null,
  candidatePatchIds = [],
  linkedConfigVersionId = '',
  approvalNeeded = false,
  nowIso = new Date().toISOString(),
} = {}) {
  const normalizedTrainerResultId = String(trainerResultId || '').trim();
  const normalizedTrainerJobId = String(trainerJobId || '').trim();
  const normalizedStatus = String(status || '').trim();
  if (!normalizedTrainerResultId || !normalizedTrainerJobId || !normalizedStatus) {
    throw new Error('TRAINER_RESULT_INVALID');
  }
  const database = ensureDb();
  database.prepare(`
    INSERT INTO trainer_results (
      trainer_result_id,
      trainer_job_id,
      status,
      result_json,
      candidate_patch_ids_json,
      linked_config_version_id,
      approval_needed,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    normalizedTrainerResultId,
    normalizedTrainerJobId,
    normalizedStatus,
    JSON.stringify(result && typeof result === 'object' ? result : {}),
    JSON.stringify(Array.isArray(candidatePatchIds) ? candidatePatchIds : []),
    String(linkedConfigVersionId || '').trim() || null,
    approvalNeeded ? 1 : 0,
    nowIso,
    nowIso,
  );
  return getTrainerResultById(normalizedTrainerResultId);
}

function updateTrainerResultLink({
  trainerResultId = '',
  linkedConfigVersionId = '',
  nowIso = new Date().toISOString(),
} = {}) {
  const normalizedTrainerResultId = String(trainerResultId || '').trim();
  if (!normalizedTrainerResultId) {
    throw new Error('TRAINER_RESULT_INVALID');
  }
  const database = ensureDb();
  database.prepare(`
    UPDATE trainer_results
    SET linked_config_version_id = ?,
        updated_at = ?
    WHERE trainer_result_id = ?
  `).run(
    String(linkedConfigVersionId || '').trim() || null,
    nowIso,
    normalizedTrainerResultId,
  );
  return getTrainerResultById(normalizedTrainerResultId);
}

function mapApprovalRow(row) {
  if (!row || typeof row !== 'object') return null;
  return {
    approvalId: String(row.approval_id || ''),
    houseId: String(row.house_id || ''),
    approvalKind: String(row.approval_kind || ''),
    subject: parseJsonColumn(row.subject_json, {}),
    status: String(row.status || ''),
    requestedBy: parseJsonColumn(row.requested_by_json, {}),
    decidedBy: parseJsonColumn(row.decided_by_json, {}),
    createdAt: String(row.created_at || ''),
    updatedAt: String(row.updated_at || ''),
  };
}

function getApprovalRecordById(approvalId = '') {
  const normalizedApprovalId = String(approvalId || '').trim();
  if (!normalizedApprovalId) return null;
  const database = ensureDb();
  const row = database.prepare(`
    SELECT *
    FROM approvals
    WHERE approval_id = ?
    LIMIT 1
  `).get(normalizedApprovalId);
  return mapApprovalRow(row);
}

function upsertApprovalRecord({
  approvalId = '',
  houseId = '',
  approvalKind = '',
  subject = null,
  status = 'pending',
  requestedBy = null,
  decidedBy = null,
  nowIso = new Date().toISOString(),
} = {}) {
  const normalizedApprovalId = String(approvalId || '').trim();
  const normalizedHouseId = String(houseId || '').trim();
  const normalizedApprovalKind = String(approvalKind || '').trim();
  const normalizedStatus = String(status || '').trim();
  if (!normalizedApprovalId || !normalizedHouseId || !normalizedApprovalKind || !normalizedStatus) {
    throw new Error('APPROVAL_INVALID');
  }
  const existing = getApprovalRecordById(normalizedApprovalId);
  const database = ensureDb();
  database.prepare(`
    INSERT INTO approvals (
      approval_id,
      house_id,
      approval_kind,
      subject_json,
      status,
      requested_by_json,
      decided_by_json,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(approval_id) DO UPDATE SET
      house_id = excluded.house_id,
      approval_kind = excluded.approval_kind,
      subject_json = excluded.subject_json,
      status = excluded.status,
      requested_by_json = excluded.requested_by_json,
      decided_by_json = excluded.decided_by_json,
      updated_at = excluded.updated_at
  `).run(
    normalizedApprovalId,
    normalizedHouseId,
    normalizedApprovalKind,
    JSON.stringify(subject && typeof subject === 'object' ? subject : {}),
    normalizedStatus,
    JSON.stringify(requestedBy && typeof requestedBy === 'object' ? requestedBy : {}),
    JSON.stringify(decidedBy && typeof decidedBy === 'object' ? decidedBy : {}),
    existing?.createdAt || nowIso,
    nowIso,
  );
  return getApprovalRecordById(normalizedApprovalId);
}

function mapSealedContextRow(row) {
  if (!row || typeof row !== 'object') return null;
  const releasePolicy = parseJsonColumn(row.release_policy_json, {});
  return {
    sealedContextId: String(row.sealed_context_id || ''),
    houseId: row.house_id ? String(row.house_id) : null,
    traceId: row.trace_id ? String(row.trace_id) : null,
    runId: row.run_id ? String(row.run_id) : null,
    entrantId: String(row.entrant_id || ''),
    scopeType: String(row.scope_type || ''),
    scopeKey: String(row.scope_key || ''),
    allowedReaders: parseJsonColumn(row.allowed_readers_json, []),
    forbiddenSources: parseJsonColumn(row.forbidden_sources_json, []),
    releasePolicy: typeof releasePolicy === 'string'
      ? releasePolicy
      : String(releasePolicy?.mode || ''),
    releasePolicyMeta: typeof releasePolicy === 'object' && releasePolicy !== null
      ? releasePolicy
      : { mode: typeof releasePolicy === 'string' ? releasePolicy : '' },
    status: String(row.status || ''),
    createdAt: String(row.created_at || ''),
    updatedAt: String(row.updated_at || ''),
  };
}

function getSealedContextById(sealedContextId = '') {
  const normalizedSealedContextId = String(sealedContextId || '').trim();
  if (!normalizedSealedContextId) return null;
  const database = ensureDb();
  const row = database.prepare(`
    SELECT *
    FROM sealed_contexts
    WHERE sealed_context_id = ?
    LIMIT 1
  `).get(normalizedSealedContextId);
  return mapSealedContextRow(row);
}

function upsertSealedContext({
  sealedContextId = '',
  houseId = '',
  traceId = '',
  runId = '',
  entrantId = '',
  scopeType = '',
  scopeKey = '',
  allowedReaders = [],
  forbiddenSources = [],
  releasePolicy = 'manual',
  status = 'active',
  nowIso = new Date().toISOString(),
} = {}) {
  const normalizedSealedContextId = String(sealedContextId || '').trim();
  const normalizedEntrantId = String(entrantId || '').trim();
  const normalizedScopeType = String(scopeType || '').trim();
  const normalizedScopeKey = String(scopeKey || '').trim();
  const normalizedStatus = String(status || '').trim();
  if (!normalizedSealedContextId || !normalizedEntrantId || !normalizedScopeType || !normalizedScopeKey || !normalizedStatus) {
    throw new Error('SEALED_CONTEXT_INVALID');
  }
  const existing = getSealedContextById(normalizedSealedContextId);
  const database = ensureDb();
  const releasePolicyPayload = releasePolicy && typeof releasePolicy === 'object' && !Array.isArray(releasePolicy)
    ? releasePolicy
    : { mode: String(releasePolicy || '').trim() || 'manual' };
  database.prepare(`
    INSERT INTO sealed_contexts (
      sealed_context_id,
      house_id,
      trace_id,
      run_id,
      entrant_id,
      scope_type,
      scope_key,
      allowed_readers_json,
      forbidden_sources_json,
      release_policy_json,
      status,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(sealed_context_id) DO UPDATE SET
      house_id = excluded.house_id,
      trace_id = excluded.trace_id,
      run_id = excluded.run_id,
      entrant_id = excluded.entrant_id,
      scope_type = excluded.scope_type,
      scope_key = excluded.scope_key,
      allowed_readers_json = excluded.allowed_readers_json,
      forbidden_sources_json = excluded.forbidden_sources_json,
      release_policy_json = excluded.release_policy_json,
      status = excluded.status,
      updated_at = excluded.updated_at
  `).run(
    normalizedSealedContextId,
    String(houseId || '').trim() || null,
    String(traceId || '').trim() || null,
    String(runId || '').trim() || null,
    normalizedEntrantId,
    normalizedScopeType,
    normalizedScopeKey,
    JSON.stringify(Array.isArray(allowedReaders) ? allowedReaders : []),
    JSON.stringify(Array.isArray(forbiddenSources) ? forbiddenSources : []),
    JSON.stringify(releasePolicyPayload),
    normalizedStatus,
    existing?.createdAt || nowIso,
    nowIso,
  );
  return getSealedContextById(normalizedSealedContextId);
}

function updateSealedContextStatus({
  sealedContextId = '',
  status = '',
  nowIso = new Date().toISOString(),
} = {}) {
  const normalizedSealedContextId = String(sealedContextId || '').trim();
  const normalizedStatus = String(status || '').trim();
  if (!normalizedSealedContextId || !normalizedStatus) {
    throw new Error('SEALED_CONTEXT_INVALID');
  }
  const database = ensureDb();
  database.prepare(`
    UPDATE sealed_contexts
    SET status = ?,
        updated_at = ?
    WHERE sealed_context_id = ?
  `).run(
    normalizedStatus,
    nowIso,
    normalizedSealedContextId,
  );
  return getSealedContextById(normalizedSealedContextId);
}

function mapSealedContextViolationRow(row) {
  if (!row || typeof row !== 'object') return null;
  return {
    sealedContextViolationId: String(row.sealed_context_violation_id || ''),
    sealedContextId: String(row.sealed_context_id || ''),
    actor: parseJsonColumn(row.actor_json, {}),
    details: parseJsonColumn(row.details_json, {}),
    createdAt: String(row.created_at || ''),
  };
}

function createSealedContextViolation({
  sealedContextViolationId = '',
  sealedContextId = '',
  actor = null,
  details = null,
  nowIso = new Date().toISOString(),
} = {}) {
  const normalizedSealedContextViolationId = String(sealedContextViolationId || '').trim();
  const normalizedSealedContextId = String(sealedContextId || '').trim();
  if (!normalizedSealedContextViolationId || !normalizedSealedContextId) {
    throw new Error('SEALED_CONTEXT_VIOLATION_INVALID');
  }
  const database = ensureDb();
  database.prepare(`
    INSERT INTO sealed_context_violations (
      sealed_context_violation_id,
      sealed_context_id,
      actor_json,
      details_json,
      created_at
    ) VALUES (?, ?, ?, ?, ?)
  `).run(
    normalizedSealedContextViolationId,
    normalizedSealedContextId,
    JSON.stringify(actor && typeof actor === 'object' ? actor : {}),
    JSON.stringify(details && typeof details === 'object' ? details : {}),
    nowIso,
  );
  const row = database.prepare(`
    SELECT *
    FROM sealed_context_violations
    WHERE sealed_context_violation_id = ?
    LIMIT 1
  `).get(normalizedSealedContextViolationId);
  return mapSealedContextViolationRow(row);
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

function getRunByTraceId(traceId = '') {
  const normalizedTraceId = String(traceId || '').trim();
  if (!normalizedTraceId) return null;
  const database = ensureDb();
  const row = database.prepare(`
    SELECT *
    FROM runs
    WHERE trace_id = ?
    LIMIT 1
  `).get(normalizedTraceId);
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

function updateRunStatus({
  runId = '',
  status = '',
  completedAt = null,
  nowIso = new Date().toISOString(),
} = {}) {
  const normalizedRunId = String(runId || '').trim();
  const normalizedStatus = String(status || '').trim();
  if (!normalizedRunId || !normalizedStatus) {
    throw new Error('RUN_STATUS_INVALID');
  }
  const database = ensureDb();
  database.prepare(`
    UPDATE runs
    SET status = ?,
        updated_at = ?,
        completed_at = ?
    WHERE run_id = ?
  `).run(
    normalizedStatus,
    nowIso,
    completedAt ? String(completedAt) : null,
    normalizedRunId,
  );
  return getRunById(normalizedRunId);
}

function updateRunMetadata({
  runId = '',
  metadata = null,
  nowIso = new Date().toISOString(),
} = {}) {
  const normalizedRunId = String(runId || '').trim();
  if (!normalizedRunId) {
    throw new Error('RUN_METADATA_INVALID');
  }
  const current = getRunById(normalizedRunId);
  if (!current) return null;
  const nextMetadata = metadata && typeof metadata === 'object' && !Array.isArray(metadata)
    ? metadata
    : {};
  const database = ensureDb();
  database.prepare(`
    UPDATE runs
    SET metadata_json = ?,
        updated_at = ?
    WHERE run_id = ?
  `).run(
    JSON.stringify(nextMetadata),
    nowIso,
    normalizedRunId,
  );
  return getRunById(normalizedRunId);
}

function listRuns({
  houseId = '',
  teamId = '',
  traceAuthorityType = '',
} = {}) {
  const normalizedHouseId = String(houseId || '').trim();
  const normalizedTeamId = String(teamId || '').trim();
  const normalizedTraceAuthorityType = String(traceAuthorityType || '').trim();
  const database = ensureDb();
  const clauses = [];
  const args = [];
  if (normalizedHouseId) {
    clauses.push('house_id = ?');
    args.push(normalizedHouseId);
  }
  if (normalizedTeamId) {
    clauses.push('team_id = ?');
    args.push(normalizedTeamId);
  }
  if (normalizedTraceAuthorityType) {
    clauses.push('trace_authority_type = ?');
    args.push(normalizedTraceAuthorityType);
  }
  const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = database.prepare(`
    SELECT *
    FROM runs
    ${whereSql}
    ORDER BY created_at DESC, run_id DESC
  `).all(...args);
  return rows.map(mapRunRow).filter(Boolean);
}

function mapTraceIntakeRecordRow(row) {
  if (!row || typeof row !== 'object') return null;
  return {
    traceIntakeRecordId: String(row.trace_intake_record_id || row.intake_id || ''),
    intakeId: String(row.intake_id || row.trace_intake_record_id || ''),
    traceId: String(row.trace_id || ''),
    runId: row.run_id ? String(row.run_id) : null,
    ingestKey: String(row.ingest_key || ''),
    sourceType: row.source_type ? String(row.source_type) : (row.producer_kind ? String(row.producer_kind) : ''),
    payloadSchema: row.payload_schema ? String(row.payload_schema) : '',
    recordKind: row.record_kind ? String(row.record_kind) : 'fact',
    accepted: row.accepted == null ? String(row.status || '').trim().toLowerCase() === 'accepted' : Number(row.accepted) === 1,
    payload: parseJsonColumn(row.payload_json, {}),
    createdAt: String(row.created_at || ''),
    receivedAt: row.received_at ? String(row.received_at) : String(row.created_at || ''),
  };
}

function getTraceIntakeRecord({ runId = '', ingestKey = '' } = {}) {
  const normalizedRunId = String(runId || '').trim();
  const normalizedIngestKey = String(ingestKey || '').trim();
  if (!normalizedRunId || !normalizedIngestKey) return null;
  const database = ensureDb();
  const row = database.prepare(`
    SELECT *
    FROM trace_intake_records
    WHERE run_id = ?
      AND ingest_key = ?
    ORDER BY created_at ASC
    LIMIT 1
  `).get(normalizedRunId, normalizedIngestKey);
  return mapTraceIntakeRecordRow(row);
}

function createTraceIntakeRecord({
  traceIntakeRecordId = '',
  traceId = '',
  runId = '',
  ingestKey = '',
  sourceType = '',
  payloadSchema = '',
  recordKind = 'fact',
  payload = null,
  accepted = true,
  createdAt = new Date().toISOString(),
} = {}) {
  const normalizedTraceIntakeRecordId = String(traceIntakeRecordId || '').trim();
  const normalizedTraceId = String(traceId || '').trim();
  const normalizedRunId = String(runId || '').trim();
  const normalizedIngestKey = String(ingestKey || '').trim();
  const normalizedSourceType = String(sourceType || '').trim();
  const normalizedPayloadSchema = String(payloadSchema || '').trim();
  const normalizedRecordKind = String(recordKind || 'fact').trim() || 'fact';
  if (!normalizedTraceIntakeRecordId || !normalizedTraceId || !normalizedIngestKey) {
    throw new Error('TRACE_INTAKE_INVALID');
  }
  const database = ensureDb();
  database.prepare(`
    INSERT INTO trace_intake_records (
      trace_intake_record_id,
      intake_id,
      trace_id,
      run_id,
      ingest_key,
      source_type,
      payload_schema,
      record_kind,
      accepted,
      producer_kind,
      producer_id,
      status,
      payload_json,
      received_at,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    normalizedTraceIntakeRecordId,
    normalizedTraceIntakeRecordId,
    normalizedTraceId,
    normalizedRunId || null,
    normalizedIngestKey,
    normalizedSourceType || null,
    normalizedPayloadSchema || null,
    normalizedRecordKind,
    accepted ? 1 : 0,
    normalizedSourceType || null,
    null,
    accepted ? 'accepted' : 'rejected',
    JSON.stringify(payload && typeof payload === 'object' ? payload : {}),
    createdAt,
    createdAt,
  );
  return getTraceIntakeRecord({ runId: normalizedRunId, ingestKey: normalizedIngestKey });
}

function mapTraceEventRow(row) {
  if (!row || typeof row !== 'object') return null;
  return {
    eventId: String(row.event_id || ''),
    traceId: String(row.trace_id || ''),
    runId: row.run_id ? String(row.run_id) : null,
    seq: Number(row.seq || 0),
    eventKind: row.event_kind ? String(row.event_kind) : String(row.event_type || ''),
    eventType: row.event_type ? String(row.event_type) : String(row.event_kind || ''),
    sourceType: row.source_type ? String(row.source_type) : '',
    eventHash: String(row.event_hash || ''),
    prevEventHash: row.prev_event_hash ? String(row.prev_event_hash) : null,
    audience: parseJsonColumn(row.audience_json, {}),
    seal: parseJsonColumn(row.seal_json, {}),
    actorKind: row.actor_kind ? String(row.actor_kind) : null,
    actorId: row.actor_id ? String(row.actor_id) : null,
    sealedContextId: row.sealed_context_id ? String(row.sealed_context_id) : null,
    payload: parseJsonColumn(row.payload_json, {}),
    canonicalAt: row.canonical_at ? String(row.canonical_at) : String(row.created_at || ''),
    createdAt: String(row.created_at || ''),
  };
}

function getLatestTraceEvent(traceId = '') {
  const normalizedTraceId = String(traceId || '').trim();
  if (!normalizedTraceId) return null;
  const database = ensureDb();
  const row = database.prepare(`
    SELECT *
    FROM trace_events
    WHERE trace_id = ?
    ORDER BY seq DESC, created_at DESC
    LIMIT 1
  `).get(normalizedTraceId);
  return mapTraceEventRow(row);
}

function listTraceEvents(traceId = '') {
  const normalizedTraceId = String(traceId || '').trim();
  if (!normalizedTraceId) return [];
  const database = ensureDb();
  const rows = database.prepare(`
    SELECT *
    FROM trace_events
    WHERE trace_id = ?
    ORDER BY seq ASC, created_at ASC
  `).all(normalizedTraceId);
  return rows.map(mapTraceEventRow).filter(Boolean);
}

function createTraceEvent({
  eventId = '',
  traceId = '',
  runId = '',
  seq = 0,
  eventKind = '',
  sourceType = '',
  eventHash = '',
  prevEventHash = null,
  audience = null,
  seal = null,
  actorKind = 'service',
  actorId = 'house_trace_ingester',
  sealedContextId = null,
  payload = null,
  createdAt = new Date().toISOString(),
} = {}) {
  const normalizedEventId = String(eventId || '').trim();
  const normalizedTraceId = String(traceId || '').trim();
  const normalizedRunId = String(runId || '').trim();
  const normalizedSeq = Number(seq || 0);
  const normalizedEventKind = String(eventKind || '').trim();
  const normalizedSourceType = String(sourceType || '').trim();
  const normalizedEventHash = String(eventHash || '').trim();
  if (!normalizedEventId || !normalizedTraceId || !normalizedSeq || !normalizedEventKind || !normalizedEventHash) {
    throw new Error('TRACE_EVENT_INVALID');
  }
  const database = ensureDb();
  database.prepare(`
    INSERT INTO trace_events (
      event_id,
      trace_id,
      run_id,
      seq,
      event_kind,
      event_type,
      source_type,
      event_hash,
      prev_event_hash,
      audience_json,
      seal_json,
      actor_kind,
      actor_id,
      sealed_context_id,
      payload_json,
      canonical_at,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    normalizedEventId,
    normalizedTraceId,
    normalizedRunId || null,
    normalizedSeq,
    normalizedEventKind,
    normalizedEventKind,
    normalizedSourceType || null,
    normalizedEventHash,
    prevEventHash ? String(prevEventHash) : null,
    JSON.stringify(audience && typeof audience === 'object' ? audience : {}),
    JSON.stringify(seal && typeof seal === 'object' ? seal : {}),
    actorKind ? String(actorKind) : null,
    actorId ? String(actorId) : null,
    sealedContextId ? String(sealedContextId) : null,
    JSON.stringify(payload && typeof payload === 'object' ? payload : {}),
    createdAt,
    createdAt,
  );
  const row = database.prepare(`
    SELECT *
    FROM trace_events
    WHERE event_id = ?
    LIMIT 1
  `).get(normalizedEventId);
  return mapTraceEventRow(row);
}

function mapTraceArtifactRow(row) {
  if (!row || typeof row !== 'object') return null;
  return {
    traceArtifactId: String(row.trace_artifact_id || ''),
    traceId: String(row.trace_id || ''),
    runId: String(row.run_id || ''),
    artifactKind: String(row.artifact_kind || ''),
    metadata: parseJsonColumn(row.metadata_json, {}),
    createdAt: String(row.created_at || ''),
  };
}

function getTraceArtifactById(traceArtifactId = '') {
  const normalizedTraceArtifactId = String(traceArtifactId || '').trim();
  if (!normalizedTraceArtifactId) return null;
  const database = ensureDb();
  const row = database.prepare(`
    SELECT *
    FROM trace_artifacts
    WHERE trace_artifact_id = ?
    LIMIT 1
  `).get(normalizedTraceArtifactId);
  return mapTraceArtifactRow(row);
}

function createTraceArtifact({
  traceArtifactId = '',
  traceId = '',
  runId = '',
  artifactKind = '',
  metadata = null,
  createdAt = new Date().toISOString(),
} = {}) {
  const normalizedTraceArtifactId = String(traceArtifactId || '').trim();
  const normalizedTraceId = String(traceId || '').trim();
  const normalizedRunId = String(runId || '').trim();
  const normalizedArtifactKind = String(artifactKind || '').trim();
  if (!normalizedTraceArtifactId || !normalizedTraceId || !normalizedRunId || !normalizedArtifactKind) {
    throw new Error('TRACE_ARTIFACT_INVALID');
  }
  const database = ensureDb();
  const existing = database.prepare(`
    SELECT created_at
    FROM trace_artifacts
    WHERE trace_artifact_id = ?
    LIMIT 1
  `).get(normalizedTraceArtifactId);
  database.prepare(`
    INSERT INTO trace_artifacts (
      trace_artifact_id,
      trace_id,
      run_id,
      artifact_kind,
      metadata_json,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(trace_artifact_id) DO UPDATE SET
      trace_id = excluded.trace_id,
      run_id = excluded.run_id,
      artifact_kind = excluded.artifact_kind,
      metadata_json = excluded.metadata_json
  `).run(
    normalizedTraceArtifactId,
    normalizedTraceId,
    normalizedRunId,
    normalizedArtifactKind,
    JSON.stringify(metadata && typeof metadata === 'object' ? metadata : {}),
    existing?.created_at || createdAt,
  );
  return getTraceArtifactById(normalizedTraceArtifactId);
}

function isUnifiedPlatformTable(tableName) {
  return PLATFORM_TABLES.includes(String(tableName || '').trim());
}

function getUnifiedPlatformTestStats() {
  const fixtureFamilies = listFixtureFamilies();
  const fixtureManifest = buildFixtureManifest();
  return {
    counts: getPlatformTableCounts(),
    fixtureFamilies,
    fixtureManifest,
    fixtureManifestHash: `sha256:${crypto.createHash('sha256').update(JSON.stringify(fixtureManifest), 'utf8').digest('hex')}`,
    inspectors: {
      artifacts: true,
      seals: true,
      house: true,
      tracks: true,
      houseOffice: true,
      houseOfficePresence: true,
      houseOfficeBriefing: true,
      houseOfficeAttention: true,
      houseOfficeAssignments: true,
      houseWorkerDeployments: true,
      houseWorkerShares: true,
      houseWorkerSupervisor: true,
      houseWorkerSessions: true,
      houseWorkerEvents: true,
    },
  };
}

module.exports = {
  ensureHouseOfficeStructure,
  countTrackProgressEventsByDedupe,
  createTrackProgressEvent,
  createTraceArtifact,
  createTrainerJob,
  createTrainerResult,
  createHouseStaffAssignment,
  createHouseWorkerDeployment,
  createHouseWorkerSession,
  createHouseWorkerSessionEvent,
  createHouseWorkerShare,
  createIntegrationCandidate,
  createIntegrationExecution,
  createIntegrationPackVersion,
  createRun,
  createTraceEvent,
  createTraceIntakeRecord,
  countUnifiedPlatformTableRows: countPlatformTableRows,
  countPlatformTableRows,
  getConfigVersion,
  getConfigVersionByIdempotency,
  getIntegrationCandidateById,
  getIntegrationCandidateByIdempotency,
  getIntegrationExecutionByIdempotency,
  getIntegrationPackVersionByIdempotency,
  getApprovalRecordById,
  getRunById,
  getRunByTraceId,
  getRunByIdempotency,
  getSealedContextById,
  getTeamConfigBinding,
  getTrackDefinition,
  listHouseTeamIds,
  listHouseOffices,
  listHouseStaffAgents,
  listTeamConfigBindings,
  getHouseWorkerDeploymentById,
  getHouseWorkerShareById,
  getHouseWorkerSessionById,
  getTrainerJobById,
  getTrainerJobByIdempotency,
  getTrainerResultById,
  getTrainerResultByJobId,
  getTraceArtifactById,
  getTraceIntakeRecord,
  getUnifiedPlatformTestFixture: loadFixtureFamily,
  getUnifiedPlatformTestStats,
  getLatestTraceEvent,
  getPlatformTableCounts,
  isUnifiedPlatformTable,
  listHouseStaffAssignments,
  listHouseWorkerDeployments,
  listHouseWorkerSessionEvents,
  listHouseWorkerSessions,
  listConfigComponentVersions,
  listTrackDefinitions,
  listTrackProgressEvents,
  listRuns,
  listTrainerJobs,
  listTrainerResults,
  listTraceEvents,
  listFixtureFamilies,
  listUnifiedPlatformFixtureFamilies: listFixtureFamilies,
  loadFixtureFamily,
  replaceConfigComponentVersions,
  resetUnifiedPlatformStore,
  createSealedContextViolation,
  updateRunMetadata,
  updateHouseWorkerSession,
  updateSealedContextStatus,
  upsertSealedContext,
  updateTrainerJobStatus,
  updateTrainerResultLink,
  updateRunStatus,
  upsertApprovalRecord,
  upsertTeamConfigBinding,
  upsertConfigVersion,
};
