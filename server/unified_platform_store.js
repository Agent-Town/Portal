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
  'library_items',
  'library_item_revisions',
  'library_links',
  'conversation_artifacts',
  'library_shelves',
  'library_shelf_items',
  'scope_sets',
  'scope_set_items',
  'library_publications',
  'library_public_stacks',
  'library_public_stack_members',
  'library_peer_relays',
  'library_peer_receipts',
  'library_satchel_relays',
  'library_satchel_receipts',
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
  tracks_core_seed: 'tracks_core_seed.json',
  tracks_progress_seed: 'tracks_progress_seed.json',
  editor_pack_compat_seed: 'editor_pack_compat_seed.json',
  joined_completion_smoke_seed: 'joined_completion_smoke_seed.json',
  library_private_seed: 'library_private_seed.json',
  library_item_link_seed: 'library_item_link_seed.json',
  library_scope_seed: 'library_scope_seed.json',
  library_prompt_scope_seed: 'library_prompt_scope_seed.json',
  library_workshop_seed: 'library_workshop_seed.json',
  library_trace_promotion_seed: 'library_trace_promotion_seed.json',
  library_publish_seed: 'library_publish_seed.json',
  library_import_seed: 'library_import_seed.json',
  library_seal_seed: 'library_seal_seed.json',
  library_skill_pack_seed: 'library_skill_pack_seed.json',
  library_full_smoke_seed: 'library_full_smoke_seed.json',
  library_authoring_seed: 'library_authoring_seed.json',
  library_revision_seed: 'library_revision_seed.json',
  library_conversation_capture_seed: 'library_conversation_capture_seed.json',
  library_shelf_seed: 'library_shelf_seed.json',
  library_satchel_seed: 'library_satchel_seed.json',
  library_registry_browse_seed: 'library_registry_browse_seed.json',
  library_guided_exchange_seed: 'library_guided_exchange_seed.json',
  library_copy_a11y_seed: 'library_copy_a11y_seed.json',
  library_skill_contract_v2_seed: 'library_skill_contract_v2_seed.json',
  library_benchmark_seed: 'library_benchmark_seed.json',
  library_guided_flow_seed: 'library_guided_flow_seed.json',
  library_peer_relay_seed: 'library_peer_relay_seed.json',
  library_satchel_exchange_seed: 'library_satchel_exchange_seed.json',
  library_public_stack_seed: 'library_public_stack_seed.json',
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
let unifiedPlatformInspectors = {
  promptPreview: buildDefaultPromptPreviewInspector(),
  editor: buildDefaultEditorInspector(),
  registryPreview: buildDefaultRegistryPreviewInspector(),
  benchmarks: buildDefaultBenchmarkInspector(),
  peerRelay: buildDefaultPeerRelayInspector(),
  satchelExchange: buildDefaultSatchelExchangeInspector(),
  publicStacks: buildDefaultPublicStacksInspector(),
};

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

    CREATE TABLE IF NOT EXISTS library_items (
      library_item_id TEXT PRIMARY KEY,
      house_id TEXT NOT NULL,
      team_id TEXT NOT NULL,
      item_type TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      content_text TEXT NOT NULL DEFAULT '',
      content_ref TEXT,
      source_kind TEXT NOT NULL,
      source_ref TEXT NOT NULL,
      visibility TEXT NOT NULL DEFAULT 'house_private',
      seal_policy TEXT NOT NULL DEFAULT 'inherit',
      imported_state TEXT NOT NULL DEFAULT 'local',
      registry_id TEXT,
      read_only INTEGER NOT NULL DEFAULT 0,
      content_hash TEXT NOT NULL,
      idempotency_key TEXT,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (house_id, team_id, idempotency_key)
    );

    CREATE TABLE IF NOT EXISTS library_item_revisions (
      library_item_revision_id TEXT PRIMARY KEY,
      library_item_id TEXT NOT NULL,
      house_id TEXT NOT NULL,
      team_id TEXT NOT NULL,
      revision_index INTEGER NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL DEFAULT '',
      content_text TEXT NOT NULL DEFAULT '',
      content_hash TEXT NOT NULL,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_by TEXT NOT NULL DEFAULT 'human',
      created_at TEXT NOT NULL,
      UNIQUE (library_item_id, revision_index)
    );

    CREATE TABLE IF NOT EXISTS library_links (
      library_link_id TEXT PRIMARY KEY,
      library_item_id TEXT NOT NULL,
      link_kind TEXT NOT NULL,
      source_kind TEXT NOT NULL,
      source_ref TEXT NOT NULL,
      target_library_item_id TEXT,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      UNIQUE (library_item_id, link_kind, source_kind, source_ref, target_library_item_id)
    );

    CREATE TABLE IF NOT EXISTS conversation_artifacts (
      conversation_artifact_id TEXT PRIMARY KEY,
      house_id TEXT NOT NULL,
      team_id TEXT NOT NULL,
      title TEXT NOT NULL,
      transcript_text TEXT NOT NULL DEFAULT '',
      message_ids_json TEXT NOT NULL DEFAULT '[]',
      messages_json TEXT NOT NULL DEFAULT '[]',
      source_scope_set_id TEXT,
      created_by TEXT NOT NULL DEFAULT 'human',
      metadata_json TEXT NOT NULL DEFAULT '{}',
      idempotency_key TEXT,
      created_at TEXT NOT NULL,
      UNIQUE (house_id, team_id, idempotency_key)
    );

    CREATE TABLE IF NOT EXISTS library_shelves (
      library_shelf_id TEXT PRIMARY KEY,
      house_id TEXT NOT NULL,
      team_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      created_by TEXT NOT NULL DEFAULT 'human',
      metadata_json TEXT NOT NULL DEFAULT '{}',
      idempotency_key TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (house_id, team_id, idempotency_key)
    );

    CREATE TABLE IF NOT EXISTS library_shelf_items (
      library_shelf_item_id TEXT PRIMARY KEY,
      library_shelf_id TEXT NOT NULL,
      library_item_id TEXT NOT NULL,
      order_index INTEGER NOT NULL DEFAULT 0,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      UNIQUE (library_shelf_id, order_index),
      UNIQUE (library_shelf_id, library_item_id)
    );

    CREATE TABLE IF NOT EXISTS scope_sets (
      scope_set_id TEXT PRIMARY KEY,
      house_id TEXT NOT NULL,
      team_id TEXT NOT NULL,
      title TEXT NOT NULL,
      created_by TEXT NOT NULL DEFAULT 'human',
      idempotency_key TEXT,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (house_id, team_id, idempotency_key)
    );

    CREATE TABLE IF NOT EXISTS scope_set_items (
      scope_set_item_id TEXT PRIMARY KEY,
      scope_set_id TEXT NOT NULL,
      library_item_id TEXT NOT NULL,
      order_index INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE (scope_set_id, order_index),
      UNIQUE (scope_set_id, library_item_id)
    );

    CREATE TABLE IF NOT EXISTS library_publications (
      library_publication_id TEXT PRIMARY KEY,
      house_id TEXT NOT NULL,
      team_id TEXT NOT NULL,
      library_item_id TEXT,
      publication_state TEXT NOT NULL,
      registry_id TEXT,
      visibility TEXT NOT NULL DEFAULT 'registry_public',
      content_hash TEXT NOT NULL,
      source_ref TEXT NOT NULL DEFAULT '',
      idempotency_key TEXT,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (house_id, team_id, idempotency_key)
    );

    CREATE TABLE IF NOT EXISTS library_public_stacks (
      library_public_stack_id TEXT PRIMARY KEY,
      house_id TEXT NOT NULL,
      team_id TEXT NOT NULL,
      scope_set_id TEXT NOT NULL,
      family_slug TEXT NOT NULL DEFAULT 'house_library_stacks',
      title TEXT NOT NULL,
      summary TEXT NOT NULL DEFAULT '',
      bundle_hash TEXT NOT NULL,
      publication_state TEXT NOT NULL,
      idempotency_key TEXT,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (house_id, team_id, idempotency_key)
    );

    CREATE TABLE IF NOT EXISTS library_public_stack_members (
      library_public_stack_member_id TEXT PRIMARY KEY,
      library_public_stack_id TEXT NOT NULL,
      library_publication_id TEXT NOT NULL,
      registry_id TEXT NOT NULL,
      library_item_id TEXT,
      sort_index INTEGER NOT NULL DEFAULT 0,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      UNIQUE (library_public_stack_id, sort_index),
      UNIQUE (library_public_stack_id, library_publication_id)
    );

    CREATE TABLE IF NOT EXISTS library_peer_relays (
      library_peer_relay_id TEXT PRIMARY KEY,
      house_id TEXT NOT NULL,
      team_id TEXT NOT NULL,
      library_publication_id TEXT NOT NULL,
      registry_id TEXT NOT NULL,
      target_house_id TEXT NOT NULL,
      transport_kind TEXT NOT NULL,
      relay_state TEXT NOT NULL,
      idempotency_key TEXT,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (house_id, team_id, idempotency_key)
    );

    CREATE TABLE IF NOT EXISTS library_peer_receipts (
      library_peer_receipt_id TEXT PRIMARY KEY,
      library_peer_relay_id TEXT NOT NULL,
      target_house_id TEXT NOT NULL,
      receipt_kind TEXT NOT NULL,
      receipt_ref TEXT NOT NULL,
      status TEXT NOT NULL,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      UNIQUE (library_peer_relay_id, receipt_kind, receipt_ref)
    );

    CREATE TABLE IF NOT EXISTS library_satchel_relays (
      library_satchel_relay_id TEXT PRIMARY KEY,
      house_id TEXT NOT NULL,
      team_id TEXT NOT NULL,
      scope_set_id TEXT NOT NULL,
      target_house_id TEXT NOT NULL,
      bundle_manifest_json TEXT NOT NULL DEFAULT '{}',
      relay_state TEXT NOT NULL,
      idempotency_key TEXT,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (house_id, team_id, idempotency_key)
    );

    CREATE TABLE IF NOT EXISTS library_satchel_receipts (
      library_satchel_receipt_id TEXT PRIMARY KEY,
      library_satchel_relay_id TEXT NOT NULL,
      target_house_id TEXT NOT NULL,
      receipt_kind TEXT NOT NULL,
      receipt_ref TEXT NOT NULL,
      status TEXT NOT NULL,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      UNIQUE (library_satchel_relay_id, receipt_kind, receipt_ref)
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
  resetUnifiedPlatformInspectors();
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

function cloneStructuredData(value, fallback) {
  try {
    return JSON.parse(JSON.stringify(value === undefined ? fallback : value));
  } catch {
    return JSON.parse(JSON.stringify(fallback));
  }
}

function buildDefaultPromptPreviewInspector() {
  return {
    activeScopeSetId: null,
    selectedItemIds: [],
    itemRefs: [],
    promptText: '',
  };
}

function buildDefaultEditorInspector() {
  return {
    openFilePath: null,
    content: '',
    diffPreview: '',
    writeEvents: [],
    lastApprovalId: null,
  };
}

function buildDefaultRegistryPreviewInspector() {
  return {
    query: '',
    family: '',
    resultCount: 0,
    selectedRegistryId: null,
    preview: null,
  };
}

function buildDefaultBenchmarkInspector() {
  return {
    runId: null,
    metrics: {},
    scenarios: [],
    outputHash: '',
  };
}

function buildDefaultPeerRelayInspector() {
  return {
    relays: [],
    receipts: [],
    filters: {
      sourceHouseId: '',
      targetHouseId: '',
      transportKind: '',
    },
  };
}

function buildDefaultSatchelExchangeInspector() {
  return {
    relays: [],
    receipts: [],
    filters: {
      sourceHouseId: '',
      targetHouseId: '',
      scopeSetId: '',
    },
  };
}

function buildDefaultPublicStacksInspector() {
  return {
    publicStacks: [],
    members: [],
    filters: {
      sourceHouseId: '',
      familySlug: '',
      scopeSetId: '',
    },
  };
}

function resetUnifiedPlatformInspectors() {
  unifiedPlatformInspectors = {
    promptPreview: buildDefaultPromptPreviewInspector(),
    editor: buildDefaultEditorInspector(),
    registryPreview: buildDefaultRegistryPreviewInspector(),
    benchmarks: buildDefaultBenchmarkInspector(),
    peerRelay: buildDefaultPeerRelayInspector(),
    satchelExchange: buildDefaultSatchelExchangeInspector(),
    publicStacks: buildDefaultPublicStacksInspector(),
  };
}

function mapLibraryItemRow(row) {
  if (!row || typeof row !== 'object') return null;
  return {
    libraryItemId: String(row.library_item_id || ''),
    houseId: String(row.house_id || ''),
    teamId: String(row.team_id || ''),
    itemType: String(row.item_type || ''),
    title: String(row.title || ''),
    summary: String(row.summary || ''),
    contentText: String(row.content_text || ''),
    contentRef: row.content_ref ? String(row.content_ref) : null,
    sourceKind: String(row.source_kind || ''),
    sourceRef: String(row.source_ref || ''),
    visibility: String(row.visibility || 'house_private'),
    sealPolicy: String(row.seal_policy || 'inherit'),
    importedState: String(row.imported_state || 'local'),
    registryId: row.registry_id ? String(row.registry_id) : null,
    readOnly: Number(row.read_only || 0) === 1,
    contentHash: String(row.content_hash || ''),
    idempotencyKey: row.idempotency_key ? String(row.idempotency_key) : null,
    metadata: parseJsonColumn(row.metadata_json, {}),
    createdAt: String(row.created_at || ''),
    updatedAt: String(row.updated_at || ''),
  };
}

function getLibraryItemById(libraryItemId = '') {
  const normalizedLibraryItemId = String(libraryItemId || '').trim();
  if (!normalizedLibraryItemId) return null;
  const database = ensureDb();
  const row = database.prepare(`
    SELECT *
    FROM library_items
    WHERE library_item_id = ?
    LIMIT 1
  `).get(normalizedLibraryItemId);
  return mapLibraryItemRow(row);
}

function getLibraryItemByIdempotency({
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
    FROM library_items
    WHERE house_id = ?
      AND team_id = ?
      AND idempotency_key = ?
    ORDER BY created_at ASC
    LIMIT 1
  `).get(
    normalizedHouseId,
    normalizedTeamId,
    normalizedIdempotencyKey,
  );
  return mapLibraryItemRow(row);
}

function listLibraryItems({
  houseId = '',
  teamId = '',
} = {}) {
  const normalizedHouseId = String(houseId || '').trim();
  const normalizedTeamId = String(teamId || '').trim();
  const database = ensureDb();
  let query = `
    SELECT *
    FROM library_items
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
  query += ' ORDER BY created_at DESC, library_item_id DESC';
  return database.prepare(query).all(...args).map(mapLibraryItemRow).filter(Boolean);
}

function mapLibraryItemRevisionRow(row) {
  if (!row || typeof row !== 'object') return null;
  return {
    libraryItemRevisionId: String(row.library_item_revision_id || ''),
    libraryItemId: String(row.library_item_id || ''),
    houseId: String(row.house_id || ''),
    teamId: String(row.team_id || ''),
    revisionIndex: Number(row.revision_index || 0),
    title: String(row.title || ''),
    summary: String(row.summary || ''),
    contentText: String(row.content_text || ''),
    contentHash: String(row.content_hash || ''),
    metadata: parseJsonColumn(row.metadata_json, {}),
    createdBy: String(row.created_by || 'human'),
    createdAt: String(row.created_at || ''),
  };
}

function listLibraryItemRevisions({
  houseId = '',
  teamId = '',
  libraryItemId = '',
} = {}) {
  const normalizedHouseId = String(houseId || '').trim();
  const normalizedTeamId = String(teamId || '').trim();
  const normalizedLibraryItemId = String(libraryItemId || '').trim();
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
  if (normalizedLibraryItemId) {
    clauses.push('library_item_id = ?');
    args.push(normalizedLibraryItemId);
  }
  const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = database.prepare(`
    SELECT *
    FROM library_item_revisions
    ${whereSql}
    ORDER BY house_id ASC, team_id ASC, library_item_id ASC, revision_index ASC, created_at ASC
  `).all(...args);
  return rows.map(mapLibraryItemRevisionRow).filter(Boolean);
}

function createLibraryItemRevision({
  libraryItemRevisionId = '',
  libraryItemId = '',
  houseId = '',
  teamId = '',
  revisionIndex = 1,
  title = '',
  summary = '',
  contentText = '',
  contentHash = '',
  metadata = null,
  createdBy = 'human',
  createdAt = new Date().toISOString(),
} = {}) {
  const normalizedRevisionId = String(libraryItemRevisionId || '').trim();
  const normalizedLibraryItemId = String(libraryItemId || '').trim();
  const normalizedHouseId = String(houseId || '').trim();
  const normalizedTeamId = String(teamId || '').trim();
  const normalizedTitle = String(title || '').trim();
  const normalizedSummary = String(summary || '').trim();
  const normalizedHash = String(contentHash || '').trim();
  const normalizedCreatedBy = String(createdBy || 'human').trim() || 'human';
  const normalizedRevisionIndex = Number.isFinite(Number(revisionIndex)) ? Number(revisionIndex) : 0;
  if (
    !normalizedRevisionId
    || !normalizedLibraryItemId
    || !normalizedHouseId
    || !normalizedTeamId
    || !normalizedTitle
    || normalizedRevisionIndex < 1
    || !normalizedHash
  ) {
    throw new Error('LIBRARY_ITEM_REVISION_INVALID');
  }
  const database = ensureDb();
  database.prepare(`
    INSERT INTO library_item_revisions (
      library_item_revision_id,
      library_item_id,
      house_id,
      team_id,
      revision_index,
      title,
      summary,
      content_text,
      content_hash,
      metadata_json,
      created_by,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    normalizedRevisionId,
    normalizedLibraryItemId,
    normalizedHouseId,
    normalizedTeamId,
    normalizedRevisionIndex,
    normalizedTitle,
    normalizedSummary,
    String(contentText || ''),
    normalizedHash,
    JSON.stringify(metadata && typeof metadata === 'object' ? metadata : {}),
    normalizedCreatedBy,
    createdAt,
  );
  return listLibraryItemRevisions({
    houseId: normalizedHouseId,
    teamId: normalizedTeamId,
    libraryItemId: normalizedLibraryItemId,
  }).find((entry) => entry.libraryItemRevisionId === normalizedRevisionId) || null;
}

function createLibraryItem({
  libraryItemId = '',
  houseId = '',
  teamId = '',
  itemType = '',
  title = '',
  summary = '',
  contentText = '',
  contentRef = '',
  sourceKind = '',
  sourceRef = '',
  visibility = 'house_private',
  sealPolicy = 'inherit',
  importedState = 'local',
  registryId = '',
  readOnly = false,
  contentHash = '',
  idempotencyKey = '',
  metadata = null,
  nowIso = new Date().toISOString(),
} = {}) {
  const normalizedLibraryItemId = String(libraryItemId || '').trim();
  const normalizedHouseId = String(houseId || '').trim();
  const normalizedTeamId = String(teamId || '').trim();
  const normalizedItemType = String(itemType || '').trim();
  const normalizedTitle = String(title || '').trim();
  const normalizedSummary = String(summary || '').trim();
  const normalizedSourceKind = String(sourceKind || '').trim();
  const normalizedSourceRef = String(sourceRef || '').trim();
  const normalizedVisibility = String(visibility || 'house_private').trim() || 'house_private';
  const normalizedSealPolicy = String(sealPolicy || 'inherit').trim() || 'inherit';
  const normalizedImportedState = String(importedState || 'local').trim() || 'local';
  const normalizedContentHash = String(contentHash || '').trim();
  if (
    !normalizedLibraryItemId
    || !normalizedHouseId
    || !normalizedTeamId
    || !normalizedItemType
    || !normalizedTitle
    || !normalizedSummary
    || !normalizedSourceKind
    || !normalizedSourceRef
    || !normalizedContentHash
  ) {
    throw new Error('LIBRARY_ITEM_INVALID');
  }
  const database = ensureDb();
  database.prepare(`
    INSERT INTO library_items (
      library_item_id,
      house_id,
      team_id,
      item_type,
      title,
      summary,
      content_text,
      content_ref,
      source_kind,
      source_ref,
      visibility,
      seal_policy,
      imported_state,
      registry_id,
      read_only,
      content_hash,
      idempotency_key,
      metadata_json,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    normalizedLibraryItemId,
    normalizedHouseId,
    normalizedTeamId,
    normalizedItemType,
    normalizedTitle,
    normalizedSummary,
    String(contentText || ''),
    String(contentRef || '').trim() || null,
    normalizedSourceKind,
    normalizedSourceRef,
    normalizedVisibility,
    normalizedSealPolicy,
    normalizedImportedState,
    String(registryId || '').trim() || null,
    readOnly ? 1 : 0,
    normalizedContentHash,
    String(idempotencyKey || '').trim() || null,
    JSON.stringify(metadata && typeof metadata === 'object' ? metadata : {}),
    nowIso,
    nowIso,
  );
  return getLibraryItemById(normalizedLibraryItemId);
}

function updateLibraryItem({
  libraryItemId = '',
  title = '',
  summary = '',
  contentText = '',
  contentRef = '',
  contentHash = '',
  metadata = null,
  nowIso = new Date().toISOString(),
} = {}) {
  const normalizedLibraryItemId = String(libraryItemId || '').trim();
  const normalizedTitle = String(title || '').trim();
  const normalizedSummary = String(summary || '').trim();
  const normalizedContentHash = String(contentHash || '').trim();
  if (!normalizedLibraryItemId || !normalizedTitle || !normalizedSummary || !normalizedContentHash) {
    throw new Error('LIBRARY_ITEM_UPDATE_INVALID');
  }
  const existing = getLibraryItemById(normalizedLibraryItemId);
  if (!existing) {
    throw new Error('LIBRARY_ITEM_NOT_FOUND');
  }
  const mergedMetadata = {
    ...(existing.metadata && typeof existing.metadata === 'object' ? existing.metadata : {}),
    ...(metadata && typeof metadata === 'object' ? metadata : {}),
  };
  const database = ensureDb();
  database.prepare(`
    UPDATE library_items
    SET title = ?,
        summary = ?,
        content_text = ?,
        content_ref = ?,
        content_hash = ?,
        metadata_json = ?,
        updated_at = ?
    WHERE library_item_id = ?
  `).run(
    normalizedTitle,
    normalizedSummary,
    String(contentText || ''),
    String(contentRef || '').trim() || null,
    normalizedContentHash,
    JSON.stringify(mergedMetadata),
    nowIso,
    normalizedLibraryItemId,
  );
  return getLibraryItemById(normalizedLibraryItemId);
}

function mapLibraryLinkRow(row) {
  if (!row || typeof row !== 'object') return null;
  return {
    libraryLinkId: String(row.library_link_id || ''),
    libraryItemId: String(row.library_item_id || ''),
    linkKind: String(row.link_kind || ''),
    sourceKind: String(row.source_kind || ''),
    sourceRef: String(row.source_ref || ''),
    targetLibraryItemId: row.target_library_item_id ? String(row.target_library_item_id) : null,
    metadata: parseJsonColumn(row.metadata_json, {}),
    createdAt: String(row.created_at || ''),
  };
}

function listLibraryLinks({
  libraryItemId = '',
} = {}) {
  const normalizedLibraryItemId = String(libraryItemId || '').trim();
  const database = ensureDb();
  let query = `
    SELECT *
    FROM library_links
  `;
  const args = [];
  if (normalizedLibraryItemId) {
    query += ' WHERE library_item_id = ?';
    args.push(normalizedLibraryItemId);
  }
  query += ' ORDER BY created_at ASC, library_link_id ASC';
  return database.prepare(query).all(...args).map(mapLibraryLinkRow).filter(Boolean);
}

function mapConversationArtifactRow(row) {
  if (!row || typeof row !== 'object') return null;
  return {
    conversationArtifactId: String(row.conversation_artifact_id || ''),
    houseId: String(row.house_id || ''),
    teamId: String(row.team_id || ''),
    title: String(row.title || ''),
    transcriptText: String(row.transcript_text || ''),
    messageIds: parseJsonColumn(row.message_ids_json, []),
    messages: parseJsonColumn(row.messages_json, []),
    sourceScopeSetId: row.source_scope_set_id ? String(row.source_scope_set_id) : null,
    createdBy: String(row.created_by || 'human'),
    metadata: parseJsonColumn(row.metadata_json, {}),
    idempotencyKey: row.idempotency_key ? String(row.idempotency_key) : null,
    createdAt: String(row.created_at || ''),
  };
}

function listConversationArtifacts({
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
    FROM conversation_artifacts
    ${whereSql}
    ORDER BY house_id ASC, team_id ASC, created_at ASC, conversation_artifact_id ASC
  `).all(...args);
  return rows.map(mapConversationArtifactRow).filter(Boolean);
}

function getConversationArtifactById(conversationArtifactId = '') {
  const normalizedConversationArtifactId = String(conversationArtifactId || '').trim();
  if (!normalizedConversationArtifactId) return null;
  const database = ensureDb();
  const row = database.prepare(`
    SELECT *
    FROM conversation_artifacts
    WHERE conversation_artifact_id = ?
    LIMIT 1
  `).get(normalizedConversationArtifactId);
  return mapConversationArtifactRow(row);
}

function getConversationArtifactByIdempotency({
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
    FROM conversation_artifacts
    WHERE house_id = ?
      AND team_id = ?
      AND idempotency_key = ?
    ORDER BY created_at ASC
    LIMIT 1
  `).get(
    normalizedHouseId,
    normalizedTeamId,
    normalizedIdempotencyKey,
  );
  return mapConversationArtifactRow(row);
}

function createConversationArtifact({
  conversationArtifactId = '',
  houseId = '',
  teamId = '',
  title = '',
  transcriptText = '',
  messageIds = [],
  messages = [],
  sourceScopeSetId = '',
  createdBy = 'human',
  metadata = null,
  idempotencyKey = '',
  nowIso = new Date().toISOString(),
} = {}) {
  const normalizedConversationArtifactId = String(conversationArtifactId || '').trim();
  const normalizedHouseId = String(houseId || '').trim();
  const normalizedTeamId = String(teamId || '').trim();
  const normalizedTitle = String(title || '').trim();
  const normalizedCreatedBy = String(createdBy || 'human').trim() || 'human';
  if (!normalizedConversationArtifactId || !normalizedHouseId || !normalizedTeamId || !normalizedTitle) {
    throw new Error('CONVERSATION_ARTIFACT_INVALID');
  }
  const normalizedMessageIds = Array.isArray(messageIds)
    ? messageIds.map((entry) => String(entry || '').trim()).filter(Boolean)
    : [];
  const normalizedMessages = Array.isArray(messages)
    ? messages.filter((entry) => entry && typeof entry === 'object')
    : [];
  const database = ensureDb();
  database.prepare(`
    INSERT INTO conversation_artifacts (
      conversation_artifact_id,
      house_id,
      team_id,
      title,
      transcript_text,
      message_ids_json,
      messages_json,
      source_scope_set_id,
      created_by,
      metadata_json,
      idempotency_key,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    normalizedConversationArtifactId,
    normalizedHouseId,
    normalizedTeamId,
    normalizedTitle,
    String(transcriptText || ''),
    JSON.stringify(normalizedMessageIds),
    JSON.stringify(normalizedMessages),
    String(sourceScopeSetId || '').trim() || null,
    normalizedCreatedBy,
    JSON.stringify(metadata && typeof metadata === 'object' ? metadata : {}),
    String(idempotencyKey || '').trim() || null,
    nowIso,
  );
  return getConversationArtifactById(normalizedConversationArtifactId);
}

function mapLibraryShelfRow(row) {
  if (!row || typeof row !== 'object') return null;
  return {
    libraryShelfId: String(row.library_shelf_id || ''),
    houseId: String(row.house_id || ''),
    teamId: String(row.team_id || ''),
    title: String(row.title || ''),
    description: String(row.description || ''),
    createdBy: String(row.created_by || 'human'),
    metadata: parseJsonColumn(row.metadata_json, {}),
    idempotencyKey: row.idempotency_key ? String(row.idempotency_key) : null,
    createdAt: String(row.created_at || ''),
    updatedAt: String(row.updated_at || ''),
  };
}

function mapLibraryShelfItemRow(row) {
  if (!row || typeof row !== 'object') return null;
  return {
    libraryShelfItemId: String(row.library_shelf_item_id || ''),
    libraryShelfId: String(row.library_shelf_id || ''),
    libraryItemId: String(row.library_item_id || ''),
    orderIndex: Number(row.order_index || 0),
    metadata: parseJsonColumn(row.metadata_json, {}),
    createdAt: String(row.created_at || ''),
  };
}

function listLibraryShelves({
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
    FROM library_shelves
    ${whereSql}
    ORDER BY house_id ASC, team_id ASC, created_at ASC, library_shelf_id ASC
  `).all(...args);
  return rows.map(mapLibraryShelfRow).filter(Boolean);
}

function getLibraryShelfById(libraryShelfId = '') {
  const normalizedLibraryShelfId = String(libraryShelfId || '').trim();
  if (!normalizedLibraryShelfId) return null;
  const database = ensureDb();
  const row = database.prepare(`
    SELECT *
    FROM library_shelves
    WHERE library_shelf_id = ?
    LIMIT 1
  `).get(normalizedLibraryShelfId);
  return mapLibraryShelfRow(row);
}

function getLibraryShelfByIdempotency({
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
    FROM library_shelves
    WHERE house_id = ?
      AND team_id = ?
      AND idempotency_key = ?
    ORDER BY created_at ASC
    LIMIT 1
  `).get(
    normalizedHouseId,
    normalizedTeamId,
    normalizedIdempotencyKey,
  );
  return mapLibraryShelfRow(row);
}

function listLibraryShelfItems(libraryShelfId = '') {
  const normalizedLibraryShelfId = String(libraryShelfId || '').trim();
  if (!normalizedLibraryShelfId) return [];
  const database = ensureDb();
  const rows = database.prepare(`
    SELECT *
    FROM library_shelf_items
    WHERE library_shelf_id = ?
    ORDER BY order_index ASC, created_at ASC, library_shelf_item_id ASC
  `).all(normalizedLibraryShelfId);
  return rows.map(mapLibraryShelfItemRow).filter(Boolean);
}

function createLibraryShelf({
  libraryShelfId = '',
  houseId = '',
  teamId = '',
  title = '',
  description = '',
  createdBy = 'human',
  metadata = null,
  idempotencyKey = '',
  nowIso = new Date().toISOString(),
} = {}) {
  const normalizedLibraryShelfId = String(libraryShelfId || '').trim();
  const normalizedHouseId = String(houseId || '').trim();
  const normalizedTeamId = String(teamId || '').trim();
  const normalizedTitle = String(title || '').trim();
  const normalizedCreatedBy = String(createdBy || 'human').trim() || 'human';
  if (!normalizedLibraryShelfId || !normalizedHouseId || !normalizedTeamId || !normalizedTitle) {
    throw new Error('LIBRARY_SHELF_INVALID');
  }
  const database = ensureDb();
  database.prepare(`
    INSERT INTO library_shelves (
      library_shelf_id,
      house_id,
      team_id,
      title,
      description,
      created_by,
      metadata_json,
      idempotency_key,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    normalizedLibraryShelfId,
    normalizedHouseId,
    normalizedTeamId,
    normalizedTitle,
    String(description || '').trim(),
    normalizedCreatedBy,
    JSON.stringify(metadata && typeof metadata === 'object' ? metadata : {}),
    String(idempotencyKey || '').trim() || null,
    nowIso,
    nowIso,
  );
  return getLibraryShelfById(normalizedLibraryShelfId);
}

function addLibraryShelfItem({
  libraryShelfItemId = '',
  libraryShelfId = '',
  libraryItemId = '',
  orderIndex = 0,
  metadata = null,
  nowIso = new Date().toISOString(),
} = {}) {
  const normalizedShelfItemId = String(libraryShelfItemId || '').trim();
  const normalizedLibraryShelfId = String(libraryShelfId || '').trim();
  const normalizedLibraryItemId = String(libraryItemId || '').trim();
  const normalizedOrderIndex = Number.isFinite(Number(orderIndex)) ? Number(orderIndex) : 0;
  if (!normalizedShelfItemId || !normalizedLibraryShelfId || !normalizedLibraryItemId || normalizedOrderIndex < 0) {
    throw new Error('LIBRARY_SHELF_ITEM_INVALID');
  }
  const database = ensureDb();
  const existingByItem = database.prepare(`
    SELECT *
    FROM library_shelf_items
    WHERE library_shelf_id = ?
      AND library_item_id = ?
    LIMIT 1
  `).get(normalizedLibraryShelfId, normalizedLibraryItemId);
  if (existingByItem) {
    return mapLibraryShelfItemRow(existingByItem);
  }
  database.prepare(`
    INSERT INTO library_shelf_items (
      library_shelf_item_id,
      library_shelf_id,
      library_item_id,
      order_index,
      metadata_json,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    normalizedShelfItemId,
    normalizedLibraryShelfId,
    normalizedLibraryItemId,
    normalizedOrderIndex,
    JSON.stringify(metadata && typeof metadata === 'object' ? metadata : {}),
    nowIso,
  );
  return listLibraryShelfItems(normalizedLibraryShelfId).find((entry) => entry.libraryShelfItemId === normalizedShelfItemId) || null;
}

function removeLibraryShelfItem({
  libraryShelfId = '',
  libraryItemId = '',
} = {}) {
  const normalizedLibraryShelfId = String(libraryShelfId || '').trim();
  const normalizedLibraryItemId = String(libraryItemId || '').trim();
  if (!normalizedLibraryShelfId || !normalizedLibraryItemId) {
    throw new Error('LIBRARY_SHELF_ITEM_INVALID');
  }
  const database = ensureDb();
  const info = database.prepare(`
    DELETE FROM library_shelf_items
    WHERE library_shelf_id = ?
      AND library_item_id = ?
  `).run(normalizedLibraryShelfId, normalizedLibraryItemId);
  return Number(info?.changes || 0);
}

function createLibraryLink({
  libraryLinkId = '',
  libraryItemId = '',
  linkKind = '',
  sourceKind = '',
  sourceRef = '',
  targetLibraryItemId = '',
  metadata = null,
  nowIso = new Date().toISOString(),
} = {}) {
  const normalizedLibraryLinkId = String(libraryLinkId || '').trim();
  const normalizedLibraryItemId = String(libraryItemId || '').trim();
  const normalizedLinkKind = String(linkKind || '').trim();
  const normalizedSourceKind = String(sourceKind || '').trim();
  const normalizedSourceRef = String(sourceRef || '').trim();
  if (!normalizedLibraryLinkId || !normalizedLibraryItemId || !normalizedLinkKind || !normalizedSourceKind || !normalizedSourceRef) {
    throw new Error('LIBRARY_LINK_INVALID');
  }
  const database = ensureDb();
  database.prepare(`
    INSERT INTO library_links (
      library_link_id,
      library_item_id,
      link_kind,
      source_kind,
      source_ref,
      target_library_item_id,
      metadata_json,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    normalizedLibraryLinkId,
    normalizedLibraryItemId,
    normalizedLinkKind,
    normalizedSourceKind,
    normalizedSourceRef,
    String(targetLibraryItemId || '').trim() || null,
    JSON.stringify(metadata && typeof metadata === 'object' ? metadata : {}),
    nowIso,
  );
  return listLibraryLinks({ libraryItemId: normalizedLibraryItemId }).find((entry) => entry.libraryLinkId === normalizedLibraryLinkId) || null;
}

function mapScopeSetRow(row) {
  if (!row || typeof row !== 'object') return null;
  return {
    scopeSetId: String(row.scope_set_id || ''),
    houseId: String(row.house_id || ''),
    teamId: String(row.team_id || ''),
    title: String(row.title || ''),
    createdBy: String(row.created_by || 'human'),
    idempotencyKey: row.idempotency_key ? String(row.idempotency_key) : null,
    metadata: parseJsonColumn(row.metadata_json, {}),
    createdAt: String(row.created_at || ''),
    updatedAt: String(row.updated_at || ''),
  };
}

function getScopeSetById(scopeSetId = '') {
  const normalizedScopeSetId = String(scopeSetId || '').trim();
  if (!normalizedScopeSetId) return null;
  const database = ensureDb();
  const row = database.prepare(`
    SELECT *
    FROM scope_sets
    WHERE scope_set_id = ?
    LIMIT 1
  `).get(normalizedScopeSetId);
  return mapScopeSetRow(row);
}

function listScopeSets({
  houseId = '',
  teamId = '',
} = {}) {
  const normalizedHouseId = String(houseId || '').trim();
  const normalizedTeamId = String(teamId || '').trim();
  const database = ensureDb();
  let query = `
    SELECT *
    FROM scope_sets
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
  query += ' ORDER BY created_at DESC, scope_set_id DESC';
  return database.prepare(query).all(...args).map(mapScopeSetRow).filter(Boolean);
}

function getScopeSetByIdempotency({
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
    FROM scope_sets
    WHERE house_id = ?
      AND team_id = ?
      AND idempotency_key = ?
    ORDER BY created_at ASC
    LIMIT 1
  `).get(
    normalizedHouseId,
    normalizedTeamId,
    normalizedIdempotencyKey,
  );
  return mapScopeSetRow(row);
}

function createScopeSet({
  scopeSetId = '',
  houseId = '',
  teamId = '',
  title = '',
  createdBy = 'human',
  idempotencyKey = '',
  metadata = null,
  nowIso = new Date().toISOString(),
} = {}) {
  const normalizedScopeSetId = String(scopeSetId || '').trim();
  const normalizedHouseId = String(houseId || '').trim();
  const normalizedTeamId = String(teamId || '').trim();
  const normalizedTitle = String(title || '').trim();
  const normalizedCreatedBy = String(createdBy || 'human').trim() || 'human';
  if (!normalizedScopeSetId || !normalizedHouseId || !normalizedTeamId || !normalizedTitle) {
    throw new Error('SCOPE_SET_INVALID');
  }
  const database = ensureDb();
  database.prepare(`
    INSERT INTO scope_sets (
      scope_set_id,
      house_id,
      team_id,
      title,
      created_by,
      idempotency_key,
      metadata_json,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    normalizedScopeSetId,
    normalizedHouseId,
    normalizedTeamId,
    normalizedTitle,
    normalizedCreatedBy,
    String(idempotencyKey || '').trim() || null,
    JSON.stringify(metadata && typeof metadata === 'object' ? metadata : {}),
    nowIso,
    nowIso,
  );
  return getScopeSetById(normalizedScopeSetId);
}

function listScopeSetItems(scopeSetId = '') {
  const normalizedScopeSetId = String(scopeSetId || '').trim();
  if (!normalizedScopeSetId) return [];
  const database = ensureDb();
  const rows = database.prepare(`
    SELECT *
    FROM scope_set_items
    WHERE scope_set_id = ?
    ORDER BY order_index ASC, scope_set_item_id ASC
  `).all(normalizedScopeSetId);
  return rows.map((row) => ({
    scopeSetItemId: String(row.scope_set_item_id || ''),
    scopeSetId: String(row.scope_set_id || ''),
    libraryItemId: String(row.library_item_id || ''),
    orderIndex: Number(row.order_index || 0),
    createdAt: String(row.created_at || ''),
  }));
}

function replaceScopeSetItems({
  scopeSetId = '',
  itemIds = [],
  nowIso = new Date().toISOString(),
} = {}) {
  const normalizedScopeSetId = String(scopeSetId || '').trim();
  if (!normalizedScopeSetId) {
    throw new Error('SCOPE_SET_ITEMS_INVALID');
  }
  const orderedItemIds = Array.isArray(itemIds)
    ? itemIds.map((itemId) => String(itemId || '').trim()).filter(Boolean)
    : [];
  const database = ensureDb();
  database.exec('BEGIN');
  try {
    database.prepare(`
      DELETE FROM scope_set_items
      WHERE scope_set_id = ?
    `).run(normalizedScopeSetId);
    orderedItemIds.forEach((libraryItemId, index) => {
      database.prepare(`
        INSERT INTO scope_set_items (
          scope_set_item_id,
          scope_set_id,
          library_item_id,
          order_index,
          created_at
        ) VALUES (?, ?, ?, ?, ?)
      `).run(
        `${normalizedScopeSetId}_item_${String(index + 1).padStart(2, '0')}`,
        normalizedScopeSetId,
        libraryItemId,
        index,
        nowIso,
      );
    });
    database.prepare(`
      UPDATE scope_sets
      SET updated_at = ?
      WHERE scope_set_id = ?
    `).run(nowIso, normalizedScopeSetId);
    database.exec('COMMIT');
  } catch (err) {
    database.exec('ROLLBACK');
    throw err;
  }
  return listScopeSetItems(normalizedScopeSetId);
}

function mapLibraryPublicationRow(row) {
  if (!row || typeof row !== 'object') return null;
  return {
    libraryPublicationId: String(row.library_publication_id || ''),
    houseId: String(row.house_id || ''),
    teamId: String(row.team_id || ''),
    libraryItemId: row.library_item_id ? String(row.library_item_id) : null,
    publicationState: String(row.publication_state || ''),
    registryId: row.registry_id ? String(row.registry_id) : null,
    visibility: String(row.visibility || 'registry_public'),
    contentHash: String(row.content_hash || ''),
    sourceRef: String(row.source_ref || ''),
    idempotencyKey: row.idempotency_key ? String(row.idempotency_key) : null,
    metadata: parseJsonColumn(row.metadata_json, {}),
    createdAt: String(row.created_at || ''),
    updatedAt: String(row.updated_at || ''),
  };
}

function mapLibraryPublicStackRow(row) {
  if (!row || typeof row !== 'object') return null;
  return {
    libraryPublicStackId: String(row.library_public_stack_id || ''),
    houseId: String(row.house_id || ''),
    teamId: String(row.team_id || ''),
    scopeSetId: String(row.scope_set_id || ''),
    familySlug: String(row.family_slug || 'house_library_stacks'),
    title: String(row.title || ''),
    summary: String(row.summary || ''),
    bundleHash: String(row.bundle_hash || ''),
    publicationState: String(row.publication_state || ''),
    idempotencyKey: row.idempotency_key ? String(row.idempotency_key) : null,
    metadata: parseJsonColumn(row.metadata_json, {}),
    createdAt: String(row.created_at || ''),
    updatedAt: String(row.updated_at || ''),
  };
}

function mapLibraryPublicStackMemberRow(row) {
  if (!row || typeof row !== 'object') return null;
  return {
    libraryPublicStackMemberId: String(row.library_public_stack_member_id || ''),
    libraryPublicStackId: String(row.library_public_stack_id || ''),
    libraryPublicationId: String(row.library_publication_id || ''),
    registryId: String(row.registry_id || ''),
    libraryItemId: row.library_item_id ? String(row.library_item_id) : null,
    sortIndex: Number.isFinite(Number(row.sort_index)) ? Number(row.sort_index) : 0,
    metadata: parseJsonColumn(row.metadata_json, {}),
    createdAt: String(row.created_at || ''),
  };
}

function mapLibraryPeerRelayRow(row) {
  if (!row || typeof row !== 'object') return null;
  return {
    libraryPeerRelayId: String(row.library_peer_relay_id || ''),
    houseId: String(row.house_id || ''),
    teamId: String(row.team_id || ''),
    libraryPublicationId: String(row.library_publication_id || ''),
    registryId: String(row.registry_id || ''),
    targetHouseId: String(row.target_house_id || ''),
    transportKind: String(row.transport_kind || ''),
    relayState: String(row.relay_state || ''),
    idempotencyKey: row.idempotency_key ? String(row.idempotency_key) : null,
    metadata: parseJsonColumn(row.metadata_json, {}),
    createdAt: String(row.created_at || ''),
    updatedAt: String(row.updated_at || ''),
  };
}

function mapLibraryPeerReceiptRow(row) {
  if (!row || typeof row !== 'object') return null;
  return {
    libraryPeerReceiptId: String(row.library_peer_receipt_id || ''),
    libraryPeerRelayId: String(row.library_peer_relay_id || ''),
    targetHouseId: String(row.target_house_id || ''),
    receiptKind: String(row.receipt_kind || ''),
    receiptRef: String(row.receipt_ref || ''),
    status: String(row.status || ''),
    metadata: parseJsonColumn(row.metadata_json, {}),
    createdAt: String(row.created_at || ''),
  };
}

function mapLibrarySatchelRelayRow(row) {
  if (!row || typeof row !== 'object') return null;
  return {
    librarySatchelRelayId: String(row.library_satchel_relay_id || ''),
    houseId: String(row.house_id || ''),
    teamId: String(row.team_id || ''),
    scopeSetId: String(row.scope_set_id || ''),
    targetHouseId: String(row.target_house_id || ''),
    bundleManifest: parseJsonColumn(row.bundle_manifest_json, {}),
    relayState: String(row.relay_state || ''),
    idempotencyKey: row.idempotency_key ? String(row.idempotency_key) : null,
    metadata: parseJsonColumn(row.metadata_json, {}),
    createdAt: String(row.created_at || ''),
    updatedAt: String(row.updated_at || ''),
  };
}

function mapLibrarySatchelReceiptRow(row) {
  if (!row || typeof row !== 'object') return null;
  return {
    librarySatchelReceiptId: String(row.library_satchel_receipt_id || ''),
    librarySatchelRelayId: String(row.library_satchel_relay_id || ''),
    targetHouseId: String(row.target_house_id || ''),
    receiptKind: String(row.receipt_kind || ''),
    receiptRef: String(row.receipt_ref || ''),
    status: String(row.status || ''),
    metadata: parseJsonColumn(row.metadata_json, {}),
    createdAt: String(row.created_at || ''),
  };
}

function listLibraryPublications({
  houseId = '',
  teamId = '',
} = {}) {
  const normalizedHouseId = String(houseId || '').trim();
  const normalizedTeamId = String(teamId || '').trim();
  const database = ensureDb();
  let query = `
    SELECT *
    FROM library_publications
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
  query += ' ORDER BY created_at DESC, library_publication_id DESC';
  return database.prepare(query).all(...args).map(mapLibraryPublicationRow).filter(Boolean);
}

function getLibraryPublicationById(libraryPublicationId = '') {
  const normalizedLibraryPublicationId = String(libraryPublicationId || '').trim();
  if (!normalizedLibraryPublicationId) return null;
  const database = ensureDb();
  const row = database.prepare(`
    SELECT *
    FROM library_publications
    WHERE library_publication_id = ?
    LIMIT 1
  `).get(normalizedLibraryPublicationId);
  return mapLibraryPublicationRow(row);
}

function getLibraryPublicationByIdempotency({
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
    FROM library_publications
    WHERE house_id = ?
      AND team_id = ?
      AND idempotency_key = ?
    ORDER BY created_at ASC
    LIMIT 1
  `).get(
    normalizedHouseId,
    normalizedTeamId,
    normalizedIdempotencyKey,
  );
  return mapLibraryPublicationRow(row);
}

function createLibraryPublication({
  libraryPublicationId = '',
  houseId = '',
  teamId = '',
  libraryItemId = '',
  publicationState = 'draft',
  registryId = '',
  visibility = 'registry_public',
  contentHash = '',
  sourceRef = '',
  idempotencyKey = '',
  metadata = null,
  nowIso = new Date().toISOString(),
} = {}) {
  const normalizedLibraryPublicationId = String(libraryPublicationId || '').trim();
  const normalizedHouseId = String(houseId || '').trim();
  const normalizedTeamId = String(teamId || '').trim();
  const normalizedPublicationState = String(publicationState || '').trim();
  const normalizedVisibility = String(visibility || 'registry_public').trim() || 'registry_public';
  const normalizedContentHash = String(contentHash || '').trim();
  if (!normalizedLibraryPublicationId || !normalizedHouseId || !normalizedTeamId || !normalizedPublicationState || !normalizedContentHash) {
    throw new Error('LIBRARY_PUBLICATION_INVALID');
  }
  const database = ensureDb();
  database.prepare(`
    INSERT INTO library_publications (
      library_publication_id,
      house_id,
      team_id,
      library_item_id,
      publication_state,
      registry_id,
      visibility,
      content_hash,
      source_ref,
      idempotency_key,
      metadata_json,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    normalizedLibraryPublicationId,
    normalizedHouseId,
    normalizedTeamId,
    String(libraryItemId || '').trim() || null,
    normalizedPublicationState,
    String(registryId || '').trim() || null,
    normalizedVisibility,
    normalizedContentHash,
    String(sourceRef || ''),
    String(idempotencyKey || '').trim() || null,
    JSON.stringify(metadata && typeof metadata === 'object' ? metadata : {}),
    nowIso,
    nowIso,
  );
  return listLibraryPublications({ houseId: normalizedHouseId, teamId: normalizedTeamId })
    .find((entry) => entry.libraryPublicationId === normalizedLibraryPublicationId) || null;
}

function listLibraryPublicStacks({
  houseId = '',
  teamId = '',
  familySlug = '',
  scopeSetId = '',
} = {}) {
  const normalizedHouseId = String(houseId || '').trim();
  const normalizedTeamId = String(teamId || '').trim();
  const normalizedFamilySlug = String(familySlug || '').trim();
  const normalizedScopeSetId = String(scopeSetId || '').trim();
  const database = ensureDb();
  let query = `
    SELECT *
    FROM library_public_stacks
  `;
  const args = [];
  if (normalizedHouseId || normalizedTeamId || normalizedFamilySlug || normalizedScopeSetId) {
    const clauses = [];
    if (normalizedHouseId) {
      clauses.push('house_id = ?');
      args.push(normalizedHouseId);
    }
    if (normalizedTeamId) {
      clauses.push('team_id = ?');
      args.push(normalizedTeamId);
    }
    if (normalizedFamilySlug) {
      clauses.push('family_slug = ?');
      args.push(normalizedFamilySlug);
    }
    if (normalizedScopeSetId) {
      clauses.push('scope_set_id = ?');
      args.push(normalizedScopeSetId);
    }
    query += ` WHERE ${clauses.join(' AND ')}`;
  }
  query += ' ORDER BY created_at DESC, library_public_stack_id DESC';
  return database.prepare(query).all(...args).map(mapLibraryPublicStackRow).filter(Boolean);
}

function getLibraryPublicStackById(libraryPublicStackId = '') {
  const normalizedLibraryPublicStackId = String(libraryPublicStackId || '').trim();
  if (!normalizedLibraryPublicStackId) return null;
  const database = ensureDb();
  const row = database.prepare(`
    SELECT *
    FROM library_public_stacks
    WHERE library_public_stack_id = ?
    LIMIT 1
  `).get(normalizedLibraryPublicStackId);
  return mapLibraryPublicStackRow(row);
}

function getLibraryPublicStackByIdempotency({
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
    FROM library_public_stacks
    WHERE house_id = ?
      AND team_id = ?
      AND idempotency_key = ?
    ORDER BY created_at ASC
    LIMIT 1
  `).get(
    normalizedHouseId,
    normalizedTeamId,
    normalizedIdempotencyKey,
  );
  return mapLibraryPublicStackRow(row);
}

function createLibraryPublicStack({
  libraryPublicStackId = '',
  houseId = '',
  teamId = '',
  scopeSetId = '',
  familySlug = 'house_library_stacks',
  title = '',
  summary = '',
  bundleHash = '',
  publicationState = 'published',
  idempotencyKey = '',
  metadata = null,
  nowIso = new Date().toISOString(),
} = {}) {
  const normalizedLibraryPublicStackId = String(libraryPublicStackId || '').trim();
  const normalizedHouseId = String(houseId || '').trim();
  const normalizedTeamId = String(teamId || '').trim();
  const normalizedScopeSetId = String(scopeSetId || '').trim();
  const normalizedFamilySlug = String(familySlug || 'house_library_stacks').trim() || 'house_library_stacks';
  const normalizedTitle = String(title || '').trim();
  const normalizedSummary = String(summary || '').trim();
  const normalizedBundleHash = String(bundleHash || '').trim();
  const normalizedPublicationState = String(publicationState || 'published').trim() || 'published';
  if (
    !normalizedLibraryPublicStackId
    || !normalizedHouseId
    || !normalizedTeamId
    || !normalizedScopeSetId
    || !normalizedTitle
    || !normalizedBundleHash
  ) {
    throw new Error('LIBRARY_PUBLIC_STACK_INVALID');
  }
  const database = ensureDb();
  database.prepare(`
    INSERT INTO library_public_stacks (
      library_public_stack_id,
      house_id,
      team_id,
      scope_set_id,
      family_slug,
      title,
      summary,
      bundle_hash,
      publication_state,
      idempotency_key,
      metadata_json,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    normalizedLibraryPublicStackId,
    normalizedHouseId,
    normalizedTeamId,
    normalizedScopeSetId,
    normalizedFamilySlug,
    normalizedTitle,
    normalizedSummary,
    normalizedBundleHash,
    normalizedPublicationState,
    String(idempotencyKey || '').trim() || null,
    JSON.stringify(metadata && typeof metadata === 'object' ? metadata : {}),
    nowIso,
    nowIso,
  );
  return listLibraryPublicStacks({ houseId: normalizedHouseId, teamId: normalizedTeamId })
    .find((entry) => entry.libraryPublicStackId === normalizedLibraryPublicStackId) || null;
}

function listLibraryPublicStackMembers({
  libraryPublicStackId = '',
} = {}) {
  const normalizedLibraryPublicStackId = String(libraryPublicStackId || '').trim();
  const database = ensureDb();
  let query = `
    SELECT *
    FROM library_public_stack_members
  `;
  const args = [];
  if (normalizedLibraryPublicStackId) {
    query += ' WHERE library_public_stack_id = ?';
    args.push(normalizedLibraryPublicStackId);
  }
  query += ' ORDER BY sort_index ASC, library_public_stack_member_id ASC';
  return database.prepare(query).all(...args).map(mapLibraryPublicStackMemberRow).filter(Boolean);
}

function createLibraryPublicStackMember({
  libraryPublicStackMemberId = '',
  libraryPublicStackId = '',
  libraryPublicationId = '',
  registryId = '',
  libraryItemId = '',
  sortIndex = 0,
  metadata = null,
  nowIso = new Date().toISOString(),
} = {}) {
  const normalizedLibraryPublicStackMemberId = String(libraryPublicStackMemberId || '').trim();
  const normalizedLibraryPublicStackId = String(libraryPublicStackId || '').trim();
  const normalizedLibraryPublicationId = String(libraryPublicationId || '').trim();
  const normalizedRegistryId = String(registryId || '').trim();
  const normalizedSortIndex = Number.isFinite(Number(sortIndex)) ? Number(sortIndex) : -1;
  if (
    !normalizedLibraryPublicStackMemberId
    || !normalizedLibraryPublicStackId
    || !normalizedLibraryPublicationId
    || !normalizedRegistryId
    || normalizedSortIndex < 0
  ) {
    throw new Error('LIBRARY_PUBLIC_STACK_MEMBER_INVALID');
  }
  const database = ensureDb();
  database.prepare(`
    INSERT INTO library_public_stack_members (
      library_public_stack_member_id,
      library_public_stack_id,
      library_publication_id,
      registry_id,
      library_item_id,
      sort_index,
      metadata_json,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    normalizedLibraryPublicStackMemberId,
    normalizedLibraryPublicStackId,
    normalizedLibraryPublicationId,
    normalizedRegistryId,
    String(libraryItemId || '').trim() || null,
    normalizedSortIndex,
    JSON.stringify(metadata && typeof metadata === 'object' ? metadata : {}),
    nowIso,
  );
  return listLibraryPublicStackMembers({ libraryPublicStackId: normalizedLibraryPublicStackId })
    .find((entry) => entry.libraryPublicStackMemberId === normalizedLibraryPublicStackMemberId) || null;
}

function listLibraryPeerRelays({
  houseId = '',
  teamId = '',
  targetHouseId = '',
} = {}) {
  const normalizedHouseId = String(houseId || '').trim();
  const normalizedTeamId = String(teamId || '').trim();
  const normalizedTargetHouseId = String(targetHouseId || '').trim();
  const database = ensureDb();
  let query = `
    SELECT *
    FROM library_peer_relays
  `;
  const args = [];
  if (normalizedHouseId || normalizedTeamId || normalizedTargetHouseId) {
    const clauses = [];
    if (normalizedHouseId) {
      clauses.push('house_id = ?');
      args.push(normalizedHouseId);
    }
    if (normalizedTeamId) {
      clauses.push('team_id = ?');
      args.push(normalizedTeamId);
    }
    if (normalizedTargetHouseId) {
      clauses.push('target_house_id = ?');
      args.push(normalizedTargetHouseId);
    }
    query += ` WHERE ${clauses.join(' AND ')}`;
  }
  query += ' ORDER BY created_at DESC, library_peer_relay_id DESC';
  return database.prepare(query).all(...args).map(mapLibraryPeerRelayRow).filter(Boolean);
}

function getLibraryPeerRelayByIdempotency({
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
    FROM library_peer_relays
    WHERE house_id = ?
      AND team_id = ?
      AND idempotency_key = ?
    ORDER BY created_at ASC
    LIMIT 1
  `).get(
    normalizedHouseId,
    normalizedTeamId,
    normalizedIdempotencyKey,
  );
  return mapLibraryPeerRelayRow(row);
}

function getLibraryPeerRelayById(libraryPeerRelayId = '') {
  const normalizedLibraryPeerRelayId = String(libraryPeerRelayId || '').trim();
  if (!normalizedLibraryPeerRelayId) return null;
  const database = ensureDb();
  const row = database.prepare(`
    SELECT *
    FROM library_peer_relays
    WHERE library_peer_relay_id = ?
    LIMIT 1
  `).get(normalizedLibraryPeerRelayId);
  return mapLibraryPeerRelayRow(row);
}

function createLibraryPeerRelay({
  libraryPeerRelayId = '',
  houseId = '',
  teamId = '',
  libraryPublicationId = '',
  registryId = '',
  targetHouseId = '',
  transportKind = 'pony.relay.registry.v1',
  relayState = 'queued',
  idempotencyKey = '',
  metadata = null,
  nowIso = new Date().toISOString(),
} = {}) {
  const normalizedLibraryPeerRelayId = String(libraryPeerRelayId || '').trim();
  const normalizedHouseId = String(houseId || '').trim();
  const normalizedTeamId = String(teamId || '').trim();
  const normalizedLibraryPublicationId = String(libraryPublicationId || '').trim();
  const normalizedRegistryId = String(registryId || '').trim();
  const normalizedTargetHouseId = String(targetHouseId || '').trim();
  const normalizedTransportKind = String(transportKind || 'pony.relay.registry.v1').trim() || 'pony.relay.registry.v1';
  const normalizedRelayState = String(relayState || 'queued').trim() || 'queued';
  if (
    !normalizedLibraryPeerRelayId
    || !normalizedHouseId
    || !normalizedTeamId
    || !normalizedLibraryPublicationId
    || !normalizedRegistryId
    || !normalizedTargetHouseId
  ) {
    throw new Error('LIBRARY_PEER_RELAY_INVALID');
  }
  const database = ensureDb();
  database.prepare(`
    INSERT INTO library_peer_relays (
      library_peer_relay_id,
      house_id,
      team_id,
      library_publication_id,
      registry_id,
      target_house_id,
      transport_kind,
      relay_state,
      idempotency_key,
      metadata_json,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    normalizedLibraryPeerRelayId,
    normalizedHouseId,
    normalizedTeamId,
    normalizedLibraryPublicationId,
    normalizedRegistryId,
    normalizedTargetHouseId,
    normalizedTransportKind,
    normalizedRelayState,
    String(idempotencyKey || '').trim() || null,
    JSON.stringify(metadata && typeof metadata === 'object' ? metadata : {}),
    nowIso,
    nowIso,
  );
  return listLibraryPeerRelays({ houseId: normalizedHouseId, teamId: normalizedTeamId })
    .find((entry) => entry.libraryPeerRelayId === normalizedLibraryPeerRelayId) || null;
}

function updateLibraryPeerRelay({
  libraryPeerRelayId = '',
  relayState = '',
  metadata = null,
  nowIso = new Date().toISOString(),
} = {}) {
  const normalizedLibraryPeerRelayId = String(libraryPeerRelayId || '').trim();
  if (!normalizedLibraryPeerRelayId) return null;
  const existing = getLibraryPeerRelayById(normalizedLibraryPeerRelayId);
  if (!existing) return null;
  const nextRelayState = String(relayState || existing.relayState || '').trim() || existing.relayState || 'queued';
  const nextMetadata = metadata && typeof metadata === 'object'
    ? {
        ...(existing.metadata && typeof existing.metadata === 'object' ? existing.metadata : {}),
        ...metadata,
      }
    : (existing.metadata && typeof existing.metadata === 'object' ? existing.metadata : {});
  const database = ensureDb();
  database.prepare(`
    UPDATE library_peer_relays
    SET relay_state = ?,
        metadata_json = ?,
        updated_at = ?
    WHERE library_peer_relay_id = ?
  `).run(
    nextRelayState,
    JSON.stringify(nextMetadata),
    nowIso,
    normalizedLibraryPeerRelayId,
  );
  return getLibraryPeerRelayById(normalizedLibraryPeerRelayId);
}

function listLibraryPeerReceipts({
  libraryPeerRelayId = '',
} = {}) {
  const normalizedLibraryPeerRelayId = String(libraryPeerRelayId || '').trim();
  const database = ensureDb();
  let query = `
    SELECT *
    FROM library_peer_receipts
  `;
  const args = [];
  if (normalizedLibraryPeerRelayId) {
    query += ' WHERE library_peer_relay_id = ?';
    args.push(normalizedLibraryPeerRelayId);
  }
  query += ' ORDER BY created_at DESC, library_peer_receipt_id DESC';
  return database.prepare(query).all(...args).map(mapLibraryPeerReceiptRow).filter(Boolean);
}

function createLibraryPeerReceipt({
  libraryPeerReceiptId = '',
  libraryPeerRelayId = '',
  targetHouseId = '',
  receiptKind = 'pony_dispatch_receipt',
  receiptRef = '',
  status = 'accepted',
  metadata = null,
  nowIso = new Date().toISOString(),
} = {}) {
  const normalizedLibraryPeerReceiptId = String(libraryPeerReceiptId || '').trim();
  const normalizedLibraryPeerRelayId = String(libraryPeerRelayId || '').trim();
  const normalizedTargetHouseId = String(targetHouseId || '').trim();
  const normalizedReceiptKind = String(receiptKind || 'pony_dispatch_receipt').trim() || 'pony_dispatch_receipt';
  const normalizedReceiptRef = String(receiptRef || '').trim();
  const normalizedStatus = String(status || 'accepted').trim() || 'accepted';
  if (
    !normalizedLibraryPeerReceiptId
    || !normalizedLibraryPeerRelayId
    || !normalizedTargetHouseId
    || !normalizedReceiptRef
  ) {
    throw new Error('LIBRARY_PEER_RECEIPT_INVALID');
  }
  const database = ensureDb();
  database.prepare(`
    INSERT INTO library_peer_receipts (
      library_peer_receipt_id,
      library_peer_relay_id,
      target_house_id,
      receipt_kind,
      receipt_ref,
      status,
      metadata_json,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    normalizedLibraryPeerReceiptId,
    normalizedLibraryPeerRelayId,
    normalizedTargetHouseId,
    normalizedReceiptKind,
    normalizedReceiptRef,
    normalizedStatus,
    JSON.stringify(metadata && typeof metadata === 'object' ? metadata : {}),
    nowIso,
  );
  return listLibraryPeerReceipts({ libraryPeerRelayId: normalizedLibraryPeerRelayId })
    .find((entry) => entry.libraryPeerReceiptId === normalizedLibraryPeerReceiptId) || null;
}

function listLibrarySatchelRelays({
  houseId = '',
  teamId = '',
  targetHouseId = '',
} = {}) {
  const normalizedHouseId = String(houseId || '').trim();
  const normalizedTeamId = String(teamId || '').trim();
  const normalizedTargetHouseId = String(targetHouseId || '').trim();
  const database = ensureDb();
  let query = `
    SELECT *
    FROM library_satchel_relays
  `;
  const args = [];
  if (normalizedHouseId || normalizedTeamId || normalizedTargetHouseId) {
    const clauses = [];
    if (normalizedHouseId) {
      clauses.push('house_id = ?');
      args.push(normalizedHouseId);
    }
    if (normalizedTeamId) {
      clauses.push('team_id = ?');
      args.push(normalizedTeamId);
    }
    if (normalizedTargetHouseId) {
      clauses.push('target_house_id = ?');
      args.push(normalizedTargetHouseId);
    }
    query += ` WHERE ${clauses.join(' AND ')}`;
  }
  query += ' ORDER BY created_at DESC, library_satchel_relay_id DESC';
  return database.prepare(query).all(...args).map(mapLibrarySatchelRelayRow).filter(Boolean);
}

function getLibrarySatchelRelayById(librarySatchelRelayId = '') {
  const normalizedLibrarySatchelRelayId = String(librarySatchelRelayId || '').trim();
  if (!normalizedLibrarySatchelRelayId) return null;
  const database = ensureDb();
  const row = database.prepare(`
    SELECT *
    FROM library_satchel_relays
    WHERE library_satchel_relay_id = ?
    LIMIT 1
  `).get(normalizedLibrarySatchelRelayId);
  return mapLibrarySatchelRelayRow(row);
}

function getLibrarySatchelRelayByIdempotency({
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
    FROM library_satchel_relays
    WHERE house_id = ?
      AND team_id = ?
      AND idempotency_key = ?
    ORDER BY created_at ASC
    LIMIT 1
  `).get(
    normalizedHouseId,
    normalizedTeamId,
    normalizedIdempotencyKey,
  );
  return mapLibrarySatchelRelayRow(row);
}

function createLibrarySatchelRelay({
  librarySatchelRelayId = '',
  houseId = '',
  teamId = '',
  scopeSetId = '',
  targetHouseId = '',
  bundleManifest = null,
  relayState = 'queued',
  idempotencyKey = '',
  metadata = null,
  nowIso = new Date().toISOString(),
} = {}) {
  const normalizedLibrarySatchelRelayId = String(librarySatchelRelayId || '').trim();
  const normalizedHouseId = String(houseId || '').trim();
  const normalizedTeamId = String(teamId || '').trim();
  const normalizedScopeSetId = String(scopeSetId || '').trim();
  const normalizedTargetHouseId = String(targetHouseId || '').trim();
  const normalizedRelayState = String(relayState || 'queued').trim() || 'queued';
  if (
    !normalizedLibrarySatchelRelayId
    || !normalizedHouseId
    || !normalizedTeamId
    || !normalizedScopeSetId
    || !normalizedTargetHouseId
  ) {
    throw new Error('LIBRARY_SATCHEL_RELAY_INVALID');
  }
  const database = ensureDb();
  database.prepare(`
    INSERT INTO library_satchel_relays (
      library_satchel_relay_id,
      house_id,
      team_id,
      scope_set_id,
      target_house_id,
      bundle_manifest_json,
      relay_state,
      idempotency_key,
      metadata_json,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    normalizedLibrarySatchelRelayId,
    normalizedHouseId,
    normalizedTeamId,
    normalizedScopeSetId,
    normalizedTargetHouseId,
    JSON.stringify(bundleManifest && typeof bundleManifest === 'object' ? bundleManifest : {}),
    normalizedRelayState,
    String(idempotencyKey || '').trim() || null,
    JSON.stringify(metadata && typeof metadata === 'object' ? metadata : {}),
    nowIso,
    nowIso,
  );
  return listLibrarySatchelRelays({ houseId: normalizedHouseId, teamId: normalizedTeamId })
    .find((entry) => entry.librarySatchelRelayId === normalizedLibrarySatchelRelayId) || null;
}

function updateLibrarySatchelRelay({
  librarySatchelRelayId = '',
  relayState = '',
  metadata = null,
  nowIso = new Date().toISOString(),
} = {}) {
  const normalizedLibrarySatchelRelayId = String(librarySatchelRelayId || '').trim();
  if (!normalizedLibrarySatchelRelayId) return null;
  const existing = getLibrarySatchelRelayById(normalizedLibrarySatchelRelayId);
  if (!existing) return null;
  const nextRelayState = String(relayState || existing.relayState || '').trim() || existing.relayState || 'queued';
  const nextMetadata = metadata && typeof metadata === 'object'
    ? {
        ...(existing.metadata && typeof existing.metadata === 'object' ? existing.metadata : {}),
        ...metadata,
      }
    : (existing.metadata && typeof existing.metadata === 'object' ? existing.metadata : {});
  const database = ensureDb();
  database.prepare(`
    UPDATE library_satchel_relays
    SET relay_state = ?,
        metadata_json = ?,
        updated_at = ?
    WHERE library_satchel_relay_id = ?
  `).run(
    nextRelayState,
    JSON.stringify(nextMetadata),
    nowIso,
    normalizedLibrarySatchelRelayId,
  );
  return getLibrarySatchelRelayById(normalizedLibrarySatchelRelayId);
}

function listLibrarySatchelReceipts({
  librarySatchelRelayId = '',
} = {}) {
  const normalizedLibrarySatchelRelayId = String(librarySatchelRelayId || '').trim();
  const database = ensureDb();
  let query = `
    SELECT *
    FROM library_satchel_receipts
  `;
  const args = [];
  if (normalizedLibrarySatchelRelayId) {
    query += ' WHERE library_satchel_relay_id = ?';
    args.push(normalizedLibrarySatchelRelayId);
  }
  query += ' ORDER BY created_at DESC, library_satchel_receipt_id DESC';
  return database.prepare(query).all(...args).map(mapLibrarySatchelReceiptRow).filter(Boolean);
}

function createLibrarySatchelReceipt({
  librarySatchelReceiptId = '',
  librarySatchelRelayId = '',
  targetHouseId = '',
  receiptKind = 'pony_dispatch_receipt',
  receiptRef = '',
  status = 'accepted',
  metadata = null,
  nowIso = new Date().toISOString(),
} = {}) {
  const normalizedLibrarySatchelReceiptId = String(librarySatchelReceiptId || '').trim();
  const normalizedLibrarySatchelRelayId = String(librarySatchelRelayId || '').trim();
  const normalizedTargetHouseId = String(targetHouseId || '').trim();
  const normalizedReceiptKind = String(receiptKind || 'pony_dispatch_receipt').trim() || 'pony_dispatch_receipt';
  const normalizedReceiptRef = String(receiptRef || '').trim();
  const normalizedStatus = String(status || 'accepted').trim() || 'accepted';
  if (
    !normalizedLibrarySatchelReceiptId
    || !normalizedLibrarySatchelRelayId
    || !normalizedTargetHouseId
    || !normalizedReceiptRef
  ) {
    throw new Error('LIBRARY_SATCHEL_RECEIPT_INVALID');
  }
  const database = ensureDb();
  database.prepare(`
    INSERT INTO library_satchel_receipts (
      library_satchel_receipt_id,
      library_satchel_relay_id,
      target_house_id,
      receipt_kind,
      receipt_ref,
      status,
      metadata_json,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    normalizedLibrarySatchelReceiptId,
    normalizedLibrarySatchelRelayId,
    normalizedTargetHouseId,
    normalizedReceiptKind,
    normalizedReceiptRef,
    normalizedStatus,
    JSON.stringify(metadata && typeof metadata === 'object' ? metadata : {}),
    nowIso,
  );
  return listLibrarySatchelReceipts({ librarySatchelRelayId: normalizedLibrarySatchelRelayId })
    .find((entry) => entry.librarySatchelReceiptId === normalizedLibrarySatchelReceiptId) || null;
}

function setUnifiedPlatformPromptPreview(snapshot = null) {
  const source = snapshot && typeof snapshot === 'object' ? snapshot : {};
  unifiedPlatformInspectors.promptPreview = {
    activeScopeSetId: source.activeScopeSetId ? String(source.activeScopeSetId) : null,
    selectedItemIds: Array.isArray(source.selectedItemIds)
      ? source.selectedItemIds.map((itemId) => String(itemId || '').trim()).filter(Boolean)
      : [],
    itemRefs: Array.isArray(source.itemRefs)
      ? source.itemRefs.map((item) => (item && typeof item === 'object' ? cloneStructuredData(item, {}) : item)).filter(Boolean)
      : [],
    promptText: String(source.promptText || ''),
  };
  return getUnifiedPlatformPromptPreview();
}

function getUnifiedPlatformPromptPreview() {
  return cloneStructuredData(unifiedPlatformInspectors.promptPreview, buildDefaultPromptPreviewInspector());
}

function setUnifiedPlatformEditorSnapshot(snapshot = null) {
  const source = snapshot && typeof snapshot === 'object' ? snapshot : {};
  unifiedPlatformInspectors.editor = {
    openFilePath: source.openFilePath ? String(source.openFilePath) : null,
    content: String(source.content || ''),
    diffPreview: String(source.diffPreview || ''),
    writeEvents: Array.isArray(source.writeEvents)
      ? source.writeEvents.map((event) => (event && typeof event === 'object' ? cloneStructuredData(event, {}) : event)).filter(Boolean)
      : [],
    lastApprovalId: source.lastApprovalId ? String(source.lastApprovalId) : null,
  };
  return getUnifiedPlatformEditorSnapshot();
}

function getUnifiedPlatformEditorSnapshot() {
  return cloneStructuredData(unifiedPlatformInspectors.editor, buildDefaultEditorInspector());
}

function setUnifiedPlatformRegistryPreviewSnapshot(snapshot = null) {
  const source = snapshot && typeof snapshot === 'object' ? snapshot : {};
  unifiedPlatformInspectors.registryPreview = {
    query: String(source.query || ''),
    family: String(source.family || ''),
    resultCount: Math.max(0, Number(source.resultCount || 0)),
    selectedRegistryId: source.selectedRegistryId ? String(source.selectedRegistryId) : null,
    preview: source.preview && typeof source.preview === 'object'
      ? cloneStructuredData(source.preview, {})
      : null,
  };
  return getUnifiedPlatformRegistryPreviewSnapshot();
}

function getUnifiedPlatformRegistryPreviewSnapshot() {
  return cloneStructuredData(unifiedPlatformInspectors.registryPreview, buildDefaultRegistryPreviewInspector());
}

function setUnifiedPlatformBenchmarkSnapshot(snapshot = null) {
  const source = snapshot && typeof snapshot === 'object' ? snapshot : {};
  unifiedPlatformInspectors.benchmarks = {
    runId: source.runId ? String(source.runId) : null,
    metrics: source.metrics && typeof source.metrics === 'object'
      ? cloneStructuredData(source.metrics, {})
      : {},
    scenarios: Array.isArray(source.scenarios)
      ? source.scenarios.map((entry) => (entry && typeof entry === 'object' ? cloneStructuredData(entry, {}) : entry)).filter(Boolean)
      : [],
    outputHash: String(source.outputHash || ''),
  };
  return getUnifiedPlatformBenchmarksSnapshot();
}

function getUnifiedPlatformBenchmarksSnapshot() {
  return cloneStructuredData(unifiedPlatformInspectors.benchmarks, buildDefaultBenchmarkInspector());
}

function getUnifiedPlatformLibraryInspector({
  houseId = '',
  teamId = '',
} = {}) {
  const items = listLibraryItems({ houseId, teamId });
  const links = items.length
    ? items.flatMap((item) => listLibraryLinks({ libraryItemId: item.libraryItemId }))
    : [];
  return {
    items,
    links,
  };
}

function getUnifiedPlatformScopesInspector({
  houseId = '',
  teamId = '',
} = {}) {
  const scopeSets = listScopeSets({ houseId, teamId }).map((scopeSet) => ({
    ...scopeSet,
    scopeKind: String(scopeSet?.metadata?.scopeKind || 'reading_table').trim() || 'reading_table',
    sourceShelfId: typeof scopeSet?.metadata?.sourceShelfId === 'string' && scopeSet.metadata.sourceShelfId.trim()
      ? scopeSet.metadata.sourceShelfId.trim()
      : null,
    orderedItemIds: listScopeSetItems(scopeSet.scopeSetId).map((entry) => entry.libraryItemId),
  }));
  return {
    scopeSets,
    activeScopeSetId: getUnifiedPlatformPromptPreview().activeScopeSetId || null,
    orderedItemIds: Array.isArray(scopeSets[0]?.orderedItemIds) ? scopeSets[0].orderedItemIds : [],
  };
}

function getUnifiedPlatformPublicationsInspector({
  houseId = '',
  teamId = '',
} = {}) {
  return {
    publications: listLibraryPublications({ houseId, teamId }),
  };
}

function getUnifiedPlatformPeerRelayInspector({
  houseId = '',
  teamId = '',
  targetHouseId = '',
} = {}) {
  const relays = listLibraryPeerRelays({ houseId, teamId, targetHouseId });
  const receipts = relays.flatMap((relay) => listLibraryPeerReceipts({
    libraryPeerRelayId: String(relay?.libraryPeerRelayId || '').trim(),
  }));
  return {
    relays,
    receipts,
    filters: {
      sourceHouseId: String(houseId || '').trim(),
      targetHouseId: String(targetHouseId || '').trim(),
      transportKind: '',
    },
  };
}

function getUnifiedPlatformSatchelExchangeInspector({
  houseId = '',
  teamId = '',
  targetHouseId = '',
} = {}) {
  const relays = listLibrarySatchelRelays({ houseId, teamId, targetHouseId });
  const receipts = relays.flatMap((relay) => listLibrarySatchelReceipts({
    librarySatchelRelayId: String(relay?.librarySatchelRelayId || '').trim(),
  }));
  return {
    relays,
    receipts,
    filters: {
      sourceHouseId: String(houseId || '').trim(),
      targetHouseId: String(targetHouseId || '').trim(),
      scopeSetId: '',
    },
  };
}

function getUnifiedPlatformPublicStacksInspector({
  houseId = '',
  teamId = '',
  familySlug = '',
  scopeSetId = '',
} = {}) {
  const publicStacks = listLibraryPublicStacks({ houseId, teamId, familySlug, scopeSetId });
  const members = publicStacks.flatMap((publicStack) => listLibraryPublicStackMembers({
    libraryPublicStackId: String(publicStack?.libraryPublicStackId || '').trim(),
  }));
  return {
    publicStacks,
    members,
    filters: {
      sourceHouseId: String(houseId || '').trim(),
      familySlug: String(familySlug || '').trim(),
      scopeSetId: String(scopeSetId || '').trim(),
    },
  };
}

function getUnifiedPlatformRevisionsInspector({
  houseId = '',
  teamId = '',
  libraryItemId = '',
} = {}) {
  const revisions = listLibraryItemRevisions({ houseId, teamId, libraryItemId });
  const latestByItem = revisions.reduce((acc, revision) => {
    const itemId = String(revision?.libraryItemId || '').trim();
    if (!itemId) return acc;
    acc[itemId] = revision;
    return acc;
  }, {});
  return {
    revisions,
    latestByItem,
  };
}

function getUnifiedPlatformConversationArtifactsInspector({
  houseId = '',
  teamId = '',
} = {}) {
  return {
    artifacts: listConversationArtifacts({ houseId, teamId }),
  };
}

function getUnifiedPlatformShelvesInspector({
  houseId = '',
  teamId = '',
} = {}) {
  return {
    shelves: listLibraryShelves({ houseId, teamId }).map((shelf) => ({
      ...shelf,
      orderedItemIds: listLibraryShelfItems(shelf.libraryShelfId).map((entry) => entry.libraryItemId),
    })),
  };
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
    UNION
    SELECT team_id AS team_id
    FROM library_items
    WHERE house_id = ?
    UNION
    SELECT team_id AS team_id
    FROM conversation_artifacts
    WHERE house_id = ?
    UNION
    SELECT team_id AS team_id
    FROM library_shelves
    WHERE house_id = ?
    UNION
    SELECT team_id AS team_id
    FROM scope_sets
    WHERE house_id = ?
    UNION
    SELECT team_id AS team_id
    FROM library_publications
    WHERE house_id = ?
    ORDER BY team_id ASC
  `).all(
    normalizedHouseId,
    normalizedHouseId,
    normalizedHouseId,
    normalizedHouseId,
    normalizedHouseId,
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
      library: true,
      revisions: true,
      conversationArtifacts: true,
      shelves: true,
      scopes: true,
      publications: true,
      peerRelay: true,
      satchelExchange: true,
      publicStacks: true,
      promptPreview: true,
      editor: true,
      registryPreview: true,
      benchmarks: true,
    },
  };
}

module.exports = {
  addLibraryShelfItem,
  countTrackProgressEventsByDedupe,
  createConversationArtifact,
  createLibraryItem,
  createLibraryItemRevision,
  createLibraryLink,
  createLibraryPeerReceipt,
  createLibraryPeerRelay,
  createLibraryPublicStack,
  createLibraryPublicStackMember,
  createLibrarySatchelReceipt,
  createLibrarySatchelRelay,
  createLibraryShelf,
  createLibraryPublication,
  createScopeSet,
  createTrackProgressEvent,
  createTraceArtifact,
  createTrainerJob,
  createTrainerResult,
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
  getConversationArtifactById,
  getConversationArtifactByIdempotency,
  getLibraryItemById,
  getLibraryItemByIdempotency,
  getLibraryPeerRelayById,
  getLibraryPeerRelayByIdempotency,
  getLibraryPublicationById,
  getLibraryPublicStackById,
  getLibraryPublicStackByIdempotency,
  getLibrarySatchelRelayById,
  getLibrarySatchelRelayByIdempotency,
  getLibraryShelfById,
  getLibraryShelfByIdempotency,
  getLibraryPublicationByIdempotency,
  getRunById,
  getRunByTraceId,
  getRunByIdempotency,
  getSealedContextById,
  getTeamConfigBinding,
  getTrackDefinition,
  listHouseTeamIds,
  getScopeSetById,
  getScopeSetByIdempotency,
  getTrainerJobById,
  getTrainerJobByIdempotency,
  getTrainerResultById,
  getTrainerResultByJobId,
  getTraceArtifactById,
  getTraceIntakeRecord,
  getUnifiedPlatformBenchmarksSnapshot,
  getUnifiedPlatformConversationArtifactsInspector,
  getUnifiedPlatformEditorSnapshot,
  getUnifiedPlatformLibraryInspector,
  getUnifiedPlatformPeerRelayInspector,
  getUnifiedPlatformPromptPreview,
  getUnifiedPlatformPublicStacksInspector,
  getUnifiedPlatformPublicationsInspector,
  getUnifiedPlatformRegistryPreviewSnapshot,
  getUnifiedPlatformRevisionsInspector,
  getUnifiedPlatformSatchelExchangeInspector,
  getUnifiedPlatformShelvesInspector,
  getUnifiedPlatformScopesInspector,
  getUnifiedPlatformTestFixture: loadFixtureFamily,
  getUnifiedPlatformTestStats,
  getLatestTraceEvent,
  getPlatformTableCounts,
  isUnifiedPlatformTable,
  listConfigComponentVersions,
  listConversationArtifacts,
  listLibraryItems,
  listLibraryItemRevisions,
  listLibraryLinks,
  listLibraryPeerReceipts,
  listLibraryPeerRelays,
  listLibraryPublicStackMembers,
  listLibraryPublicStacks,
  listLibrarySatchelReceipts,
  listLibrarySatchelRelays,
  listLibraryPublications,
  listLibraryShelfItems,
  listLibraryShelves,
  listScopeSetItems,
  listScopeSets,
  listTrackDefinitions,
  listTrackProgressEvents,
  listRuns,
  listTrainerJobs,
  listTrainerResults,
  listTraceEvents,
  listFixtureFamilies,
  listUnifiedPlatformFixtureFamilies: listFixtureFamilies,
  loadFixtureFamily,
  removeLibraryShelfItem,
  replaceScopeSetItems,
  replaceConfigComponentVersions,
  resetUnifiedPlatformStore,
  createSealedContextViolation,
  setUnifiedPlatformBenchmarkSnapshot,
  setUnifiedPlatformEditorSnapshot,
  setUnifiedPlatformPromptPreview,
  setUnifiedPlatformRegistryPreviewSnapshot,
  updateLibraryPeerRelay,
  updateLibrarySatchelRelay,
  updateRunMetadata,
  updateSealedContextStatus,
  upsertSealedContext,
  updateTrainerJobStatus,
  updateTrainerResultLink,
  updateRunStatus,
  upsertApprovalRecord,
  upsertTeamConfigBinding,
  upsertConfigVersion,
  updateLibraryItem,
};
