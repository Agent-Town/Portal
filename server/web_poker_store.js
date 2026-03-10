const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const { nowIso, randomHex } = require('./util');
const { getStorePath } = require('./store');

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
    CREATE TABLE IF NOT EXISTS web_import_jobs (
      import_job_id TEXT PRIMARY KEY,
      surface TEXT NOT NULL,
      portal_session_id TEXT NOT NULL,
      team_code TEXT,
      house_id TEXT,
      wallet_subjects_json TEXT NOT NULL,
      source_url TEXT NOT NULL,
      source_origin TEXT,
      request_kind TEXT NOT NULL,
      parse_fallback_allowed INTEGER NOT NULL DEFAULT 0,
      source_hints_json TEXT NOT NULL,
      idempotency_key TEXT NOT NULL,
      status TEXT NOT NULL,
      decision_code TEXT,
      decision_reason TEXT,
      result_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (surface, portal_session_id, idempotency_key)
    );

    CREATE INDEX IF NOT EXISTS web_import_jobs_surface_created_idx
      ON web_import_jobs(surface, created_at DESC);

    CREATE TABLE IF NOT EXISTS web_sessions (
      web_session_id TEXT PRIMARY KEY,
      portal_session_id TEXT NOT NULL,
      team_code TEXT,
      house_id TEXT,
      wallet_subjects_json TEXT NOT NULL,
      url TEXT NOT NULL,
      origin TEXT NOT NULL,
      website_registry_id TEXT,
      integration_registry_id TEXT,
      version_id TEXT,
      render_mode TEXT NOT NULL,
      autonomy_mode TEXT NOT NULL,
      runtime_state TEXT NOT NULL,
      page_class TEXT,
      active_revision INTEGER NOT NULL DEFAULT 1,
      checkpoint_ref TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS web_sessions_origin_updated_idx
      ON web_sessions(origin, updated_at DESC);
    CREATE INDEX IF NOT EXISTS web_sessions_team_code_idx
      ON web_sessions(team_code);

    CREATE TABLE IF NOT EXISTS web_approval_requests (
      approval_id TEXT PRIMARY KEY,
      web_session_id TEXT NOT NULL,
      action_id TEXT NOT NULL,
      status TEXT NOT NULL,
      reason TEXT NOT NULL,
      requested_by TEXT NOT NULL,
      decision_by TEXT,
      decision_reason TEXT,
      decision_idempotency_key TEXT,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (web_session_id) REFERENCES web_sessions(web_session_id)
    );

    CREATE INDEX IF NOT EXISTS web_approvals_session_status_idx
      ON web_approval_requests(web_session_id, status, created_at DESC);

    CREATE TABLE IF NOT EXISTS web_action_invocations (
      invocation_id TEXT PRIMARY KEY,
      web_session_id TEXT NOT NULL,
      action_id TEXT NOT NULL,
      idempotency_key TEXT NOT NULL,
      approval_id TEXT,
      credential_grant_id TEXT,
      status TEXT NOT NULL,
      verification_status TEXT NOT NULL,
      request_json TEXT NOT NULL,
      response_json TEXT,
      error_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (web_session_id, idempotency_key),
      FOREIGN KEY (web_session_id) REFERENCES web_sessions(web_session_id),
      FOREIGN KEY (approval_id) REFERENCES web_approval_requests(approval_id)
    );

    CREATE INDEX IF NOT EXISTS web_invocations_session_action_idx
      ON web_action_invocations(web_session_id, action_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS web_evidence_items (
      evidence_id TEXT PRIMARY KEY,
      web_session_id TEXT NOT NULL,
      invocation_id TEXT,
      category TEXT NOT NULL,
      actor TEXT NOT NULL,
      status TEXT NOT NULL,
      summary TEXT NOT NULL,
      target_url TEXT,
      page_class TEXT,
      artifact_refs_json TEXT NOT NULL,
      freshness_ttl_ms INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (web_session_id) REFERENCES web_sessions(web_session_id),
      FOREIGN KEY (invocation_id) REFERENCES web_action_invocations(invocation_id)
    );

    CREATE INDEX IF NOT EXISTS web_evidence_session_created_idx
      ON web_evidence_items(web_session_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS web_checkpoints (
      checkpoint_ref TEXT PRIMARY KEY,
      web_session_id TEXT NOT NULL,
      revision INTEGER NOT NULL,
      idempotency_key TEXT,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE (web_session_id, idempotency_key),
      FOREIGN KEY (web_session_id) REFERENCES web_sessions(web_session_id)
    );

    CREATE TABLE IF NOT EXISTS origin_credential_grants (
      credential_grant_id TEXT PRIMARY KEY,
      portal_session_id TEXT NOT NULL,
      web_session_id TEXT,
      origin TEXT NOT NULL,
      auth_class TEXT NOT NULL,
      scopes_json TEXT NOT NULL,
      status TEXT NOT NULL,
      redacted_label TEXT,
      encrypted_secret_ref TEXT NOT NULL,
      broker_session_id TEXT,
      approval_id TEXT,
      issued_at TEXT,
      expires_at TEXT,
      last_used_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (web_session_id) REFERENCES web_sessions(web_session_id)
    );

    CREATE INDEX IF NOT EXISTS credential_grants_origin_status_idx
      ON origin_credential_grants(origin, status, updated_at DESC);

    CREATE TABLE IF NOT EXISTS registry_entities (
      registry_entity_id TEXT PRIMARY KEY,
      entity_kind TEXT NOT NULL,
      family TEXT,
      slug TEXT NOT NULL,
      display_name TEXT NOT NULL,
      description TEXT,
      projection_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS registry_entities_kind_slug_idx
      ON registry_entities(entity_kind, slug);

    CREATE TABLE IF NOT EXISTS poker_seasons (
      season_id TEXT PRIMARY KEY,
      season_slug TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      rules_version TEXT,
      operator_version TEXT,
      status TEXT NOT NULL,
      submission_open_at TEXT,
      submission_close_at TEXT,
      raw_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS poker_seasons_slug_idx
      ON poker_seasons(season_slug);

    CREATE TABLE IF NOT EXISTS poker_divisions (
      division_id TEXT PRIMARY KEY,
      season_id TEXT NOT NULL,
      division_slug TEXT NOT NULL,
      runner_kind TEXT,
      raw_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (season_id) REFERENCES poker_seasons(season_id)
    );

    CREATE TABLE IF NOT EXISTS poker_setup_submissions (
      submission_id TEXT PRIMARY KEY,
      season_id TEXT NOT NULL,
      portal_submission_id TEXT UNIQUE,
      portal_session_id TEXT,
      wallet_subject TEXT,
      submitter_wallet_json TEXT NOT NULL,
      bundle_json TEXT NOT NULL,
      declared_capabilities_json TEXT NOT NULL DEFAULT '{}',
      validation_json TEXT NOT NULL,
      status TEXT NOT NULL,
      idempotency_key TEXT,
      raw_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (season_id) REFERENCES poker_seasons(season_id)
    );

    CREATE INDEX IF NOT EXISTS poker_submissions_season_wallet_created_idx
      ON poker_setup_submissions(season_id, wallet_subject, created_at DESC);

    CREATE TABLE IF NOT EXISTS poker_batches (
      batch_id TEXT PRIMARY KEY,
      season_id TEXT,
      batch_kind TEXT NOT NULL,
      submission_ids_json TEXT NOT NULL,
      batch_config_json TEXT NOT NULL,
      status TEXT NOT NULL,
      raw_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (season_id) REFERENCES poker_seasons(season_id)
    );

    CREATE TABLE IF NOT EXISTS poker_runs (
      run_id TEXT PRIMARY KEY,
      batch_id TEXT NOT NULL,
      season_id TEXT,
      summary_json TEXT NOT NULL,
      raw_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (batch_id) REFERENCES poker_batches(batch_id),
      FOREIGN KEY (season_id) REFERENCES poker_seasons(season_id)
    );

    CREATE INDEX IF NOT EXISTS poker_runs_batch_created_idx
      ON poker_runs(batch_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS poker_replay_artifacts (
      run_id TEXT PRIMARY KEY,
      replay_format TEXT NOT NULL,
      summary_json TEXT NOT NULL,
      events_jsonl_uri TEXT,
      artifact_sha256 TEXT,
      content_type TEXT,
      raw_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (run_id) REFERENCES poker_runs(run_id)
    );

    CREATE TABLE IF NOT EXISTS poker_leaderboard_snapshots (
      snapshot_id TEXT PRIMARY KEY,
      season_id TEXT NOT NULL,
      rankings_json TEXT NOT NULL,
      raw_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (season_id) REFERENCES poker_seasons(season_id)
    );

    CREATE INDEX IF NOT EXISTS poker_leaderboard_snapshots_season_created_idx
      ON poker_leaderboard_snapshots(season_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS poker_centaur_tournaments (
      tournament_id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      status TEXT NOT NULL,
      buy_in_oil INTEGER NOT NULL DEFAULT 0,
      required_lock_amount_atomic TEXT NOT NULL,
      token_symbol TEXT NOT NULL,
      entry_deadline_at TEXT,
      rules_json TEXT NOT NULL,
      summary_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS poker_centaur_tournaments_status_created_idx
      ON poker_centaur_tournaments(status, created_at DESC);

    CREATE TABLE IF NOT EXISTS poker_centaur_entries (
      entry_id TEXT PRIMARY KEY,
      tournament_id TEXT NOT NULL,
      portal_session_id TEXT,
      house_id TEXT,
      wallet_subject TEXT NOT NULL,
      display_name TEXT NOT NULL,
      status TEXT NOT NULL,
      wager_oil INTEGER NOT NULL DEFAULT 0,
      streamflow_verification_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (tournament_id, wallet_subject),
      FOREIGN KEY (tournament_id) REFERENCES poker_centaur_tournaments(tournament_id)
    );

    CREATE INDEX IF NOT EXISTS poker_centaur_entries_tournament_created_idx
      ON poker_centaur_entries(tournament_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS poker_centaur_hands (
      hand_id TEXT PRIMARY KEY,
      tournament_id TEXT NOT NULL,
      entry_id TEXT NOT NULL,
      hand_number INTEGER NOT NULL,
      phase TEXT NOT NULL,
      status TEXT NOT NULL,
      decision_expires_at TEXT,
      table_state_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (entry_id, hand_number),
      FOREIGN KEY (tournament_id) REFERENCES poker_centaur_tournaments(tournament_id),
      FOREIGN KEY (entry_id) REFERENCES poker_centaur_entries(entry_id)
    );

    CREATE INDEX IF NOT EXISTS poker_centaur_hands_entry_created_idx
      ON poker_centaur_hands(entry_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS poker_centaur_messages (
      message_id TEXT PRIMARY KEY,
      tournament_id TEXT NOT NULL,
      entry_id TEXT NOT NULL,
      hand_id TEXT NOT NULL,
      author_role TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (tournament_id) REFERENCES poker_centaur_tournaments(tournament_id),
      FOREIGN KEY (entry_id) REFERENCES poker_centaur_entries(entry_id),
      FOREIGN KEY (hand_id) REFERENCES poker_centaur_hands(hand_id)
    );

    CREATE INDEX IF NOT EXISTS poker_centaur_messages_hand_created_idx
      ON poker_centaur_messages(hand_id, created_at ASC);

    CREATE TABLE IF NOT EXISTS poker_centaur_actions (
      action_id TEXT PRIMARY KEY,
      tournament_id TEXT NOT NULL,
      entry_id TEXT NOT NULL,
      hand_id TEXT NOT NULL,
      actor_role TEXT NOT NULL,
      action_kind TEXT NOT NULL,
      amount_oil INTEGER NOT NULL DEFAULT 0,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (tournament_id) REFERENCES poker_centaur_tournaments(tournament_id),
      FOREIGN KEY (entry_id) REFERENCES poker_centaur_entries(entry_id),
      FOREIGN KEY (hand_id) REFERENCES poker_centaur_hands(hand_id)
    );

    CREATE INDEX IF NOT EXISTS poker_centaur_actions_hand_created_idx
      ON poker_centaur_actions(hand_id, created_at ASC);

    CREATE TABLE IF NOT EXISTS poker_streamflow_lock_verifications (
      verification_id TEXT PRIMARY KEY,
      portal_session_id TEXT,
      house_id TEXT,
      wallet_subject TEXT NOT NULL,
      chain TEXT NOT NULL,
      address TEXT NOT NULL,
      provider TEXT NOT NULL,
      stream_id TEXT NOT NULL,
      min_lock_amount_atomic TEXT NOT NULL,
      verified_amount_atomic TEXT NOT NULL,
      token_symbol TEXT NOT NULL,
      signature_message TEXT NOT NULL,
      status TEXT NOT NULL,
      verified_at TEXT NOT NULL,
      last_checked_at TEXT,
      raw_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (wallet_subject, provider, stream_id)
    );

    CREATE INDEX IF NOT EXISTS poker_streamflow_verifications_wallet_verified_idx
      ON poker_streamflow_lock_verifications(wallet_subject, verified_at DESC);

    CREATE TABLE IF NOT EXISTS poker_oil_snapshot_events (
      snapshot_id TEXT PRIMARY KEY,
      verification_id TEXT NOT NULL,
      wallet_subject TEXT NOT NULL,
      house_id TEXT,
      hour_bucket TEXT NOT NULL,
      scheduled_for TEXT NOT NULL,
      checked_at TEXT,
      status TEXT NOT NULL,
      amount_awarded INTEGER NOT NULL DEFAULT 0,
      provider_status_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (verification_id, scheduled_for),
      FOREIGN KEY (verification_id) REFERENCES poker_streamflow_lock_verifications(verification_id)
    );

    CREATE INDEX IF NOT EXISTS poker_oil_snapshot_events_wallet_hour_idx
      ON poker_oil_snapshot_events(wallet_subject, hour_bucket, scheduled_for ASC);

    CREATE TABLE IF NOT EXISTS poker_oil_ledger_entries (
      ledger_entry_id TEXT PRIMARY KEY,
      wallet_subject TEXT NOT NULL,
      house_id TEXT,
      verification_id TEXT,
      snapshot_id TEXT UNIQUE,
      tournament_id TEXT,
      entry_id TEXT,
      entry_kind TEXT NOT NULL,
      direction TEXT NOT NULL,
      amount INTEGER NOT NULL,
      memo TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (verification_id) REFERENCES poker_streamflow_lock_verifications(verification_id),
      FOREIGN KEY (snapshot_id) REFERENCES poker_oil_snapshot_events(snapshot_id),
      FOREIGN KEY (tournament_id) REFERENCES poker_centaur_tournaments(tournament_id),
      FOREIGN KEY (entry_id) REFERENCES poker_centaur_entries(entry_id)
    );

    CREATE INDEX IF NOT EXISTS poker_oil_ledger_wallet_created_idx
      ON poker_oil_ledger_entries(wallet_subject, created_at DESC);
  `);
  ensureColumnExists(db, 'poker_setup_submissions', 'wallet_subject', 'TEXT');
  ensureColumnExists(db, 'poker_setup_submissions', 'declared_capabilities_json', "TEXT NOT NULL DEFAULT '{}'");
  ensureColumnExists(db, 'poker_setup_submissions', 'raw_json', "TEXT NOT NULL DEFAULT '{}'");
  seedRegistryEntities();
  seedCentaurTournaments();
  return db;
}

function ensureColumnExists(database, tableName, columnName, columnSql) {
  const rows = database.prepare(`PRAGMA table_info(${tableName})`).all();
  const exists = rows.some((row) => String(row?.name || '').trim() === columnName);
  if (exists) return;
  database.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnSql};`);
}

function sqlNow() {
  return nowIso();
}

function withTransaction(fn) {
  const database = ensureDb();
  database.exec('BEGIN');
  try {
    const result = fn(database);
    database.exec('COMMIT');
    return result;
  } catch (err) {
    database.exec('ROLLBACK');
    throw err;
  }
}

function toJson(value, fallback) {
  try {
    return JSON.stringify(value == null ? fallback : value);
  } catch {
    return JSON.stringify(fallback);
  }
}

function fromJson(value, fallback) {
  try {
    return JSON.parse(String(value || ''));
  } catch {
    return fallback;
  }
}

function seedRegistryEntities() {
  const database = ensureDb();
  const count = database.prepare('SELECT COUNT(1) AS count FROM registry_entities').get();
  if (Number(count?.count || 0) > 0) return;
  const now = sqlNow();
  const rows = [
    {
      registryEntityId: 'reg_github_issue_reply',
      entityKind: 'integration',
      family: 'developer_workflows',
      slug: 'github-issue-reply',
      displayName: 'GitHub Issue Reply',
      description: 'Companion-mode issue drafting and reply publish workflow for GitHub issues.',
      projection: {
        origin: 'https://github.com',
        pageClass: 'issue_detail',
        capabilities: ['draft_reply', 'submit_reply'],
      },
    },
    {
      registryEntityId: 'reg_registry_catalog',
      entityKind: 'storefront',
      family: 'registry',
      slug: 'registry-catalog',
      displayName: 'Registry Catalog',
      description: 'Capability and storefront discovery projection for supported integrations.',
      projection: {
        capabilities: ['search', 'filter', 'project'],
      },
    },
  ];
  const insert = database.prepare(`
    INSERT INTO registry_entities (
      registry_entity_id,
      entity_kind,
      family,
      slug,
      display_name,
      description,
      projection_json,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const row of rows) {
    insert.run(
      row.registryEntityId,
      row.entityKind,
      row.family,
      row.slug,
      row.displayName,
      row.description,
      toJson(row.projection, {}),
      now,
      now
    );
  }
}

function seedCentaurTournaments() {
  const database = ensureDb();
  const count = database.prepare('SELECT COUNT(1) AS count FROM poker_centaur_tournaments').get();
  if (Number(count?.count || 0) > 0) return;
  const now = sqlNow();
  database.prepare(`
    INSERT INTO poker_centaur_tournaments (
      tournament_id,
      slug,
      title,
      status,
      buy_in_oil,
      required_lock_amount_atomic,
      token_symbol,
      entry_deadline_at,
      rules_json,
      summary_json,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'pkt_centaur_01',
    'centaur-open',
    'Centaur Open',
    'open',
    300,
    '1000000',
    '$AGENTTOWN',
    null,
    toJson({
      mode: 'centaur_no_limit_holdem',
      tableSize: 6,
      snapshotsPerHour: 15,
      oilPerEligibleSnapshot: 100,
      decisionCountdownSeconds: 45,
    }, {}),
    toJson({
      headline: 'Human + AI centaurs make one decision together under a live countdown.',
      stage: 'open',
      buyInOil: 300,
    }, {}),
    now,
    now
  );
}

function makeId(prefix) {
  return `${prefix}_${randomHex(10)}`;
}

function countTableRows(tableName) {
  const database = ensureDb();
  const allowed = new Set([
    'web_import_jobs',
    'web_sessions',
    'web_approval_requests',
    'web_action_invocations',
    'web_evidence_items',
    'web_checkpoints',
    'origin_credential_grants',
    'registry_entities',
    'poker_seasons',
    'poker_divisions',
    'poker_setup_submissions',
    'poker_batches',
    'poker_runs',
    'poker_replay_artifacts',
    'poker_leaderboard_snapshots',
    'poker_centaur_tournaments',
    'poker_centaur_entries',
    'poker_centaur_hands',
    'poker_centaur_messages',
    'poker_centaur_actions',
    'poker_streamflow_lock_verifications',
    'poker_oil_snapshot_events',
    'poker_oil_ledger_entries',
  ]);
  if (!allowed.has(tableName)) return 0;
  const row = database.prepare(`SELECT COUNT(1) AS count FROM ${tableName}`).get();
  return Number(row?.count || 0);
}

function resetExtendedStore() {
  const database = ensureDb();
  const tables = [
    'web_import_jobs',
    'web_evidence_items',
    'web_action_invocations',
    'web_approval_requests',
    'web_checkpoints',
    'origin_credential_grants',
    'poker_replay_artifacts',
    'poker_runs',
    'poker_batches',
    'poker_setup_submissions',
    'poker_divisions',
    'poker_leaderboard_snapshots',
    'poker_centaur_messages',
    'poker_centaur_actions',
    'poker_oil_ledger_entries',
    'poker_oil_snapshot_events',
    'poker_centaur_hands',
    'poker_centaur_entries',
    'poker_streamflow_lock_verifications',
    'poker_centaur_tournaments',
    'web_sessions',
    'poker_seasons',
    'registry_entities',
  ];
  withTransaction(() => {
    for (const table of tables) {
      database.prepare(`DELETE FROM ${table}`).run();
    }
  });
  seedRegistryEntities();
  seedCentaurTournaments();
}

function createImportJob({
  surface,
  portalSessionId,
  teamCode = null,
  houseId = null,
  walletSubjects = [],
  sourceUrl,
  sourceOrigin = null,
  requestKind,
  parseFallbackAllowed = false,
  sourceHints = {},
  idempotencyKey,
  status = 'queued',
  decisionCode = null,
  decisionReason = null,
  result = {},
}) {
  const database = ensureDb();
  const existing = database.prepare(`
    SELECT * FROM web_import_jobs
    WHERE surface = ? AND portal_session_id = ? AND idempotency_key = ?
  `).get(surface, portalSessionId, idempotencyKey);
  if (existing) return hydrateImportJob(existing);
  const now = sqlNow();
  const importJobId = makeId('rj');
  database.prepare(`
    INSERT INTO web_import_jobs (
      import_job_id,
      surface,
      portal_session_id,
      team_code,
      house_id,
      wallet_subjects_json,
      source_url,
      source_origin,
      request_kind,
      parse_fallback_allowed,
      source_hints_json,
      idempotency_key,
      status,
      decision_code,
      decision_reason,
      result_json,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    importJobId,
    surface,
    portalSessionId,
    teamCode,
    houseId,
    toJson(walletSubjects, []),
    sourceUrl,
    sourceOrigin,
    requestKind,
    parseFallbackAllowed ? 1 : 0,
    toJson(sourceHints, {}),
    idempotencyKey,
    status,
    decisionCode,
    decisionReason,
    toJson(result, {}),
    now,
    now
  );
  return hydrateImportJob(database.prepare('SELECT * FROM web_import_jobs WHERE import_job_id = ?').get(importJobId));
}

function hydrateImportJob(row) {
  if (!row) return null;
  return {
    importJobId: row.import_job_id,
    surface: row.surface,
    portalSessionId: row.portal_session_id,
    teamCode: row.team_code || null,
    houseId: row.house_id || null,
    walletSubjects: fromJson(row.wallet_subjects_json, []),
    sourceUrl: row.source_url,
    sourceOrigin: row.source_origin || null,
    requestKind: row.request_kind,
    parseFallbackAllowed: Number(row.parse_fallback_allowed || 0) === 1,
    sourceHints: fromJson(row.source_hints_json, {}),
    idempotencyKey: row.idempotency_key,
    status: row.status,
    decisionCode: row.decision_code || null,
    decisionReason: row.decision_reason || null,
    result: fromJson(row.result_json, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function createWebSession({
  portalSessionId,
  teamCode = null,
  houseId = null,
  walletSubjects = [],
  url,
  origin,
  websiteRegistryId = null,
  integrationRegistryId = null,
  versionId = null,
  renderMode,
  autonomyMode,
  runtimeState = 'ready',
  pageClass = null,
}) {
  const database = ensureDb();
  const now = sqlNow();
  const webSessionId = makeId('we');
  database.prepare(`
    INSERT INTO web_sessions (
      web_session_id,
      portal_session_id,
      team_code,
      house_id,
      wallet_subjects_json,
      url,
      origin,
      website_registry_id,
      integration_registry_id,
      version_id,
      render_mode,
      autonomy_mode,
      runtime_state,
      page_class,
      active_revision,
      checkpoint_ref,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NULL, ?, ?)
  `).run(
    webSessionId,
    portalSessionId,
    teamCode,
    houseId,
    toJson(walletSubjects, []),
    url,
    origin,
    websiteRegistryId,
    integrationRegistryId,
    versionId,
    renderMode,
    autonomyMode,
    runtimeState,
    pageClass,
    now,
    now
  );
  return getWebSessionById(webSessionId);
}

function getWebSessionById(webSessionId) {
  const database = ensureDb();
  const row = database.prepare('SELECT * FROM web_sessions WHERE web_session_id = ?').get(webSessionId);
  return hydrateWebSession(row);
}

function hydrateWebSession(row) {
  if (!row) return null;
  return {
    webSessionId: row.web_session_id,
    portalSessionId: row.portal_session_id,
    teamCode: row.team_code || null,
    houseId: row.house_id || null,
    walletSubjectsJson: fromJson(row.wallet_subjects_json, []),
    url: row.url,
    origin: row.origin,
    websiteRegistryId: row.website_registry_id || null,
    integrationRegistryId: row.integration_registry_id || null,
    versionId: row.version_id || null,
    renderMode: row.render_mode,
    autonomyMode: row.autonomy_mode,
    runtimeState: row.runtime_state,
    pageClass: row.page_class || null,
    activeRevision: Number(row.active_revision || 1),
    checkpointRef: row.checkpoint_ref || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getCheckpointByRef(checkpointRef) {
  const database = ensureDb();
  const row = database.prepare('SELECT * FROM web_checkpoints WHERE checkpoint_ref = ?').get(checkpointRef);
  return hydrateCheckpoint(row);
}

function getLatestCheckpointForSession(webSessionId) {
  const database = ensureDb();
  const row = database.prepare(`
    SELECT * FROM web_checkpoints
    WHERE web_session_id = ?
    ORDER BY revision DESC, created_at DESC
    LIMIT 1
  `).get(webSessionId);
  return hydrateCheckpoint(row);
}

function hydrateCheckpoint(row) {
  if (!row) return null;
  return {
    checkpointRef: row.checkpoint_ref,
    webSessionId: row.web_session_id,
    revision: Number(row.revision || 0),
    idempotencyKey: row.idempotency_key || null,
    payload: fromJson(row.payload_json, {}),
    createdAt: row.created_at,
  };
}

function writeCheckpoint({
  webSessionId,
  expectedRevision,
  idempotencyKey = null,
  checkpoint,
}) {
  return withTransaction((database) => {
    const row = database.prepare('SELECT * FROM web_sessions WHERE web_session_id = ?').get(webSessionId);
    if (!row) {
      const err = new Error('NOT_FOUND');
      err.code = 'NOT_FOUND';
      throw err;
    }
    const currentRevision = Number(row.active_revision || 1);
    if (Number(expectedRevision) !== currentRevision) {
      const err = new Error('WEB_CHECKPOINT_CONFLICT');
      err.code = 'WEB_CHECKPOINT_CONFLICT';
      err.currentRevision = currentRevision;
      throw err;
    }
    if (idempotencyKey) {
      const existing = database.prepare(`
        SELECT * FROM web_checkpoints
        WHERE web_session_id = ? AND idempotency_key = ?
      `).get(webSessionId, idempotencyKey);
      if (existing) return hydrateCheckpoint(existing);
    }
    const now = sqlNow();
    const nextRevision = currentRevision + 1;
    const checkpointRef = makeId('wcp');
    database.prepare(`
      INSERT INTO web_checkpoints (
        checkpoint_ref,
        web_session_id,
        revision,
        idempotency_key,
        payload_json,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      checkpointRef,
      webSessionId,
      nextRevision,
      idempotencyKey || null,
      toJson(checkpoint, {}),
      now
    );
    database.prepare(`
      UPDATE web_sessions
      SET checkpoint_ref = ?, active_revision = ?, page_class = ?, updated_at = ?
      WHERE web_session_id = ?
    `).run(
      checkpointRef,
      nextRevision,
      typeof checkpoint?.pageClass === 'string' ? checkpoint.pageClass : row.page_class,
      now,
      webSessionId
    );
    return hydrateCheckpoint(database.prepare('SELECT * FROM web_checkpoints WHERE checkpoint_ref = ?').get(checkpointRef));
  });
}

function listApprovalsForSession(webSessionId) {
  const database = ensureDb();
  const rows = database.prepare(`
    SELECT * FROM web_approval_requests
    WHERE web_session_id = ?
    ORDER BY created_at DESC
  `).all(webSessionId);
  return rows.map(hydrateApproval);
}

function getApprovalById(approvalId) {
  const database = ensureDb();
  return hydrateApproval(database.prepare('SELECT * FROM web_approval_requests WHERE approval_id = ?').get(approvalId));
}

function hydrateApproval(row) {
  if (!row) return null;
  return {
    approvalId: row.approval_id,
    webSessionId: row.web_session_id,
    actionId: row.action_id,
    status: row.status,
    reason: row.reason,
    requestedBy: row.requested_by,
    decisionBy: row.decision_by || null,
    decisionReason: row.decision_reason || null,
    decisionIdempotencyKey: row.decision_idempotency_key || null,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function createApprovalRequest({
  webSessionId,
  actionId,
  reason,
  requestedBy = 'agent',
  expiresAt,
}) {
  const database = ensureDb();
  const now = sqlNow();
  const approvalId = makeId('apr');
  database.prepare(`
    INSERT INTO web_approval_requests (
      approval_id,
      web_session_id,
      action_id,
      status,
      reason,
      requested_by,
      expires_at,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?)
  `).run(
    approvalId,
    webSessionId,
    actionId,
    reason,
    requestedBy,
    expiresAt,
    now,
    now
  );
  return getApprovalById(approvalId);
}

function createEvidence({
  webSessionId,
  invocationId = null,
  category,
  actor,
  status,
  summary,
  targetUrl = null,
  pageClass = null,
  artifactRefs = [],
  freshnessTtlMs = 300000,
  createdAt = null,
}) {
  const database = ensureDb();
  const evidenceId = makeId('ev');
  const now = createdAt || sqlNow();
  database.prepare(`
    INSERT INTO web_evidence_items (
      evidence_id,
      web_session_id,
      invocation_id,
      category,
      actor,
      status,
      summary,
      target_url,
      page_class,
      artifact_refs_json,
      freshness_ttl_ms,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    evidenceId,
    webSessionId,
    invocationId,
    category,
    actor,
    status,
    summary,
    targetUrl,
    pageClass,
    toJson(artifactRefs, []),
    Math.max(1, Number(freshnessTtlMs) || 300000),
    now
  );
  return getEvidenceById(evidenceId);
}

function getEvidenceById(evidenceId) {
  const database = ensureDb();
  return hydrateEvidence(database.prepare('SELECT * FROM web_evidence_items WHERE evidence_id = ?').get(evidenceId));
}

function hydrateEvidence(row) {
  if (!row) return null;
  const freshnessTtlMs = Math.max(1, Number(row.freshness_ttl_ms) || 300000);
  const createdAt = row.created_at;
  const expiresAtMs = Date.parse(createdAt) + freshnessTtlMs;
  return {
    evidenceId: row.evidence_id,
    webSessionId: row.web_session_id,
    invocationId: row.invocation_id || null,
    category: row.category,
    actor: row.actor,
    status: row.status,
    summary: row.summary,
    targetUrl: row.target_url || null,
    pageClass: row.page_class || null,
    artifactRefs: fromJson(row.artifact_refs_json, []),
    freshnessTtlMs,
    createdAt,
    expiresAt: Number.isFinite(expiresAtMs) ? new Date(expiresAtMs).toISOString() : createdAt,
  };
}

function encodeEvidenceCursor(item) {
  if (!item?.createdAt || !item?.evidenceId) return null;
  return Buffer.from(JSON.stringify({
    createdAt: item.createdAt,
    evidenceId: item.evidenceId,
  }), 'utf8').toString('base64');
}

function decodeEvidenceCursor(cursor) {
  if (!cursor) return null;
  try {
    const parsed = JSON.parse(Buffer.from(String(cursor), 'base64').toString('utf8'));
    if (!parsed || typeof parsed !== 'object') return null;
    const createdAt = typeof parsed.createdAt === 'string' ? parsed.createdAt : '';
    const evidenceId = typeof parsed.evidenceId === 'string' ? parsed.evidenceId : '';
    if (!createdAt || !evidenceId) return null;
    return { createdAt, evidenceId };
  } catch {
    return null;
  }
}

function listEvidenceForSession(webSessionId, { limit = 50, cursor = null, freshOnly = false } = {}) {
  const database = ensureDb();
  const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 200));
  const cursorParts = decodeEvidenceCursor(cursor);
  let sql = `
    SELECT * FROM web_evidence_items
    WHERE web_session_id = ?
  `;
  const params = [webSessionId];
  if (cursorParts) {
    sql += `
      AND (created_at < ? OR (created_at = ? AND evidence_id < ?))
    `;
    params.push(cursorParts.createdAt, cursorParts.createdAt, cursorParts.evidenceId);
  }
  sql += `
    ORDER BY created_at DESC, evidence_id DESC
    LIMIT ?
  `;
  params.push(safeLimit + 1);
  let items = database.prepare(sql).all(...params).map(hydrateEvidence);
  if (freshOnly) {
    const nowMs = Date.now();
    items = items.filter((item) => Date.parse(item.expiresAt) > nowMs);
  }
  const hasMore = items.length > safeLimit;
  const sliced = items.slice(0, safeLimit);
  return {
    items: sliced,
    nextCursor: hasMore ? encodeEvidenceCursor(sliced[sliced.length - 1]) : null,
  };
}

function getInvocationByIdempotency(webSessionId, idempotencyKey) {
  const database = ensureDb();
  const row = database.prepare(`
    SELECT * FROM web_action_invocations
    WHERE web_session_id = ? AND idempotency_key = ?
  `).get(webSessionId, idempotencyKey);
  return hydrateInvocation(row);
}

function getInvocationById(invocationId) {
  const database = ensureDb();
  return hydrateInvocation(database.prepare('SELECT * FROM web_action_invocations WHERE invocation_id = ?').get(invocationId));
}

function hydrateInvocation(row) {
  if (!row) return null;
  return {
    invocationId: row.invocation_id,
    webSessionId: row.web_session_id,
    actionId: row.action_id,
    idempotencyKey: row.idempotency_key,
    approvalId: row.approval_id || null,
    credentialGrantId: row.credential_grant_id || null,
    status: row.status,
    verificationStatus: row.verification_status,
    request: fromJson(row.request_json, {}),
    response: fromJson(row.response_json, null),
    error: fromJson(row.error_json, null),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function createInvocation({
  webSessionId,
  actionId,
  idempotencyKey,
  approvalId = null,
  credentialGrantId = null,
  status = 'success',
  verificationStatus = 'pending',
  request = {},
  response = null,
  error = null,
}) {
  const database = ensureDb();
  const existing = getInvocationByIdempotency(webSessionId, idempotencyKey);
  if (existing) return existing;
  const now = sqlNow();
  const invocationId = makeId('act');
  database.prepare(`
    INSERT INTO web_action_invocations (
      invocation_id,
      web_session_id,
      action_id,
      idempotency_key,
      approval_id,
      credential_grant_id,
      status,
      verification_status,
      request_json,
      response_json,
      error_json,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    invocationId,
    webSessionId,
    actionId,
    idempotencyKey,
    approvalId,
    credentialGrantId,
    status,
    verificationStatus,
    toJson(request, {}),
    toJson(response, null),
    toJson(error, null),
    now,
    now
  );
  return getInvocationById(invocationId);
}

function setWebSessionRevisionAndState(webSessionId, { nextRevision, runtimeState = null, pageClass = null, checkpointRef = undefined } = {}) {
  const database = ensureDb();
  const row = database.prepare('SELECT * FROM web_sessions WHERE web_session_id = ?').get(webSessionId);
  if (!row) return null;
  const now = sqlNow();
  database.prepare(`
    UPDATE web_sessions
    SET active_revision = ?,
        runtime_state = ?,
        page_class = ?,
        checkpoint_ref = ?,
        updated_at = ?
    WHERE web_session_id = ?
  `).run(
    Number(nextRevision) || Number(row.active_revision || 1),
    runtimeState || row.runtime_state,
    pageClass === null ? row.page_class : pageClass,
    checkpointRef === undefined ? row.checkpoint_ref : checkpointRef,
    now,
    webSessionId
  );
  return getWebSessionById(webSessionId);
}

function decideApproval({
  approvalId,
  decision,
  decisionBy = 'human',
  reason = '',
  expectedRevision,
  idempotencyKey = null,
}) {
  return withTransaction((database) => {
    const approvalRow = database.prepare('SELECT * FROM web_approval_requests WHERE approval_id = ?').get(approvalId);
    if (!approvalRow) {
      const err = new Error('NOT_FOUND');
      err.code = 'NOT_FOUND';
      throw err;
    }
    const approval = hydrateApproval(approvalRow);
    const session = getWebSessionById(approval.webSessionId);
    if (!session) {
      const err = new Error('NOT_FOUND');
      err.code = 'NOT_FOUND';
      throw err;
    }
    if (Date.parse(approval.expiresAt) <= Date.now()) {
      const err = new Error('WEB_APPROVAL_EXPIRED');
      err.code = 'WEB_APPROVAL_EXPIRED';
      throw err;
    }
    if (Number(expectedRevision) !== session.activeRevision) {
      const err = new Error('WEB_CHECKPOINT_CONFLICT');
      err.code = 'WEB_CHECKPOINT_CONFLICT';
      err.currentRevision = session.activeRevision;
      throw err;
    }
    if (approval.status !== 'pending') return approval;
    const now = sqlNow();
    const nextStatus = decision === 'approved' ? 'approved' : 'rejected';
    database.prepare(`
      UPDATE web_approval_requests
      SET status = ?, decision_by = ?, decision_reason = ?, decision_idempotency_key = ?, updated_at = ?
      WHERE approval_id = ?
    `).run(nextStatus, decisionBy, reason || null, idempotencyKey || null, now, approvalId);
    database.prepare(`
      UPDATE web_sessions
      SET active_revision = ?, runtime_state = ?, updated_at = ?
      WHERE web_session_id = ?
    `).run(session.activeRevision + 1, nextStatus === 'approved' ? 'ready' : 'error', now, session.webSessionId);
    const existingDecisionEvidence = database.prepare(`
      SELECT * FROM web_evidence_items
      WHERE web_session_id = ? AND category = 'approval_decided' AND summary = ?
      LIMIT 1
    `).get(session.webSessionId, approvalId);
    if (!existingDecisionEvidence) {
      createEvidence({
        webSessionId: session.webSessionId,
        category: 'approval_decided',
        actor: decisionBy,
        status: nextStatus,
        summary: approvalId,
        pageClass: session.pageClass,
        freshnessTtlMs: 300000,
      });
    }
    return getApprovalById(approvalId);
  });
}

function createCredentialGrant({
  portalSessionId,
  webSessionId = null,
  origin,
  authClass,
  scopes = [],
  status = 'pending',
  redactedLabel = null,
  encryptedSecretRef = null,
  brokerSessionId = null,
  approvalId = null,
  issuedAt = null,
  expiresAt = null,
}) {
  const database = ensureDb();
  const now = sqlNow();
  const credentialGrantId = makeId('wcg');
  database.prepare(`
    INSERT INTO origin_credential_grants (
      credential_grant_id,
      portal_session_id,
      web_session_id,
      origin,
      auth_class,
      scopes_json,
      status,
      redacted_label,
      encrypted_secret_ref,
      broker_session_id,
      approval_id,
      issued_at,
      expires_at,
      last_used_at,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)
  `).run(
    credentialGrantId,
    portalSessionId,
    webSessionId,
    origin,
    authClass,
    toJson(scopes, []),
    status,
    redactedLabel,
    encryptedSecretRef || `secretref_${randomHex(8)}`,
    brokerSessionId,
    approvalId,
    issuedAt,
    expiresAt,
    now,
    now
  );
  return getCredentialGrantById(credentialGrantId);
}

function getCredentialGrantById(credentialGrantId) {
  const database = ensureDb();
  const row = database.prepare('SELECT * FROM origin_credential_grants WHERE credential_grant_id = ?').get(credentialGrantId);
  return hydrateCredentialGrant(row);
}

function hydrateCredentialGrant(row) {
  if (!row) return null;
  return {
    credentialGrantId: row.credential_grant_id,
    portalSessionId: row.portal_session_id,
    webSessionId: row.web_session_id || null,
    origin: row.origin,
    authClass: row.auth_class,
    scopesJson: fromJson(row.scopes_json, []),
    status: row.status,
    redactedLabel: row.redacted_label || null,
    encryptedSecretRef: row.encrypted_secret_ref,
    brokerSessionId: row.broker_session_id || null,
    approvalId: row.approval_id || null,
    issuedAt: row.issued_at || null,
    expiresAt: row.expires_at || null,
    lastUsedAt: row.last_used_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getActiveCredentialGrant({ portalSessionId, webSessionId = null, origin, credentialGrantId = null }) {
  const database = ensureDb();
  if (credentialGrantId) {
    const row = database.prepare(`
      SELECT * FROM origin_credential_grants
      WHERE credential_grant_id = ? AND portal_session_id = ?
    `).get(credentialGrantId, portalSessionId);
    return hydrateCredentialGrant(row);
  }
  const row = database.prepare(`
    SELECT * FROM origin_credential_grants
    WHERE portal_session_id = ?
      AND origin = ?
      AND status = 'active'
      AND (web_session_id IS NULL OR web_session_id = ?)
    ORDER BY updated_at DESC
    LIMIT 1
  `).get(portalSessionId, origin, webSessionId);
  return hydrateCredentialGrant(row);
}

function activateCredentialGrant({ brokerSessionId, redactedLabel = null, expiresAt = null }) {
  const database = ensureDb();
  const now = sqlNow();
  database.prepare(`
    UPDATE origin_credential_grants
    SET status = 'active',
        redacted_label = COALESCE(?, redacted_label),
        issued_at = COALESCE(issued_at, ?),
        expires_at = COALESCE(?, expires_at),
        updated_at = ?
    WHERE broker_session_id = ?
  `).run(redactedLabel, now, expiresAt, now, brokerSessionId);
  const row = database.prepare(`
    SELECT * FROM origin_credential_grants
    WHERE broker_session_id = ?
    ORDER BY updated_at DESC
    LIMIT 1
  `).get(brokerSessionId);
  return hydrateCredentialGrant(row);
}

function touchCredentialGrant(credentialGrantId) {
  const database = ensureDb();
  const now = sqlNow();
  database.prepare(`
    UPDATE origin_credential_grants
    SET last_used_at = ?, updated_at = ?
    WHERE credential_grant_id = ?
  `).run(now, now, credentialGrantId);
  return getCredentialGrantById(credentialGrantId);
}

function listCredentialStatusByOrigin(portalSessionId, webSessionId = null) {
  const database = ensureDb();
  const rows = database.prepare(`
    SELECT origin, status, credential_grant_id, redacted_label, expires_at, updated_at
    FROM origin_credential_grants
    WHERE portal_session_id = ?
      AND (web_session_id IS NULL OR web_session_id = ?)
    ORDER BY updated_at DESC
  `).all(portalSessionId, webSessionId);
  const out = {};
  for (const row of rows) {
    if (out[row.origin]) continue;
    out[row.origin] = {
      status: row.status,
      credentialGrantId: row.credential_grant_id,
      redactedLabel: row.redacted_label || null,
      expiresAt: row.expires_at || null,
      updatedAt: row.updated_at,
    };
  }
  return out;
}

function searchRegistryEntities({ query = '', family = '' } = {}) {
  const database = ensureDb();
  const safeQuery = `%${String(query || '').trim().toLowerCase()}%`;
  const safeFamily = String(family || '').trim().toLowerCase();
  let sql = `
    SELECT * FROM registry_entities
    WHERE 1 = 1
  `;
  const params = [];
  if (safeFamily) {
    sql += ' AND lower(coalesce(family, \'\')) = ?';
    params.push(safeFamily);
  }
  if (String(query || '').trim()) {
    sql += ' AND (lower(display_name) LIKE ? OR lower(description) LIKE ? OR lower(slug) LIKE ?)';
    params.push(safeQuery, safeQuery, safeQuery);
  }
  sql += ' ORDER BY display_name ASC';
  const rows = database.prepare(sql).all(...params);
  return rows.map((row) => ({
    registryEntityId: row.registry_entity_id,
    entityKind: row.entity_kind,
    family: row.family || null,
    slug: row.slug,
    displayName: row.display_name,
    description: row.description || null,
    projection: fromJson(row.projection_json, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

function getRegistryEntityById(registryEntityId) {
  const database = ensureDb();
  const row = database.prepare('SELECT * FROM registry_entities WHERE registry_entity_id = ?').get(registryEntityId);
  if (!row) return null;
  return {
    registryEntityId: row.registry_entity_id,
    entityKind: row.entity_kind,
    family: row.family || null,
    slug: row.slug,
    displayName: row.display_name,
    description: row.description || null,
    projection: fromJson(row.projection_json, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function hydratePokerSeason(row) {
  if (!row) return null;
  return {
    seasonId: row.season_id,
    seasonSlug: row.season_slug,
    displayName: row.display_name,
    rulesVersion: row.rules_version || null,
    operatorVersion: row.operator_version || null,
    status: row.status,
    submissionOpenAt: row.submission_open_at || null,
    submissionCloseAt: row.submission_close_at || null,
    raw: fromJson(row.raw_json, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function listPokerSeasons() {
  const database = ensureDb();
  const rows = database.prepare(`
    SELECT * FROM poker_seasons
    ORDER BY created_at DESC, season_id DESC
  `).all();
  return rows.map((row) => getPokerSeasonById(row.season_id));
}

function getPokerSeasonById(seasonId) {
  const database = ensureDb();
  const row = database.prepare('SELECT * FROM poker_seasons WHERE season_id = ?').get(seasonId);
  if (!row) return null;
  const season = hydratePokerSeason(row);
  const divisionRows = database.prepare(`
    SELECT * FROM poker_divisions
    WHERE season_id = ?
    ORDER BY division_slug ASC, division_id ASC
  `).all(seasonId);
  return {
    ...season,
    divisions: divisionRows.map((divisionRow) => ({
      divisionId: divisionRow.division_id,
      seasonId: divisionRow.season_id,
      divisionSlug: divisionRow.division_slug,
      runnerKind: divisionRow.runner_kind || null,
      raw: fromJson(divisionRow.raw_json, {}),
      createdAt: divisionRow.created_at,
      updatedAt: divisionRow.updated_at,
    })),
  };
}

function upsertPokerSeason({
  seasonId,
  seasonSlug,
  displayName,
  rulesVersion = null,
  operatorVersion = null,
  status = 'scheduled',
  submissionOpenAt = null,
  submissionCloseAt = null,
  divisions = [],
  raw = {},
  createdAt = null,
  updatedAt = null,
}) {
  return withTransaction((database) => {
    const now = sqlNow();
    const existing = database.prepare('SELECT * FROM poker_seasons WHERE season_id = ?').get(seasonId);
    database.prepare(`
      INSERT INTO poker_seasons (
        season_id,
        season_slug,
        display_name,
        rules_version,
        operator_version,
        status,
        submission_open_at,
        submission_close_at,
        raw_json,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(season_id) DO UPDATE SET
        season_slug = excluded.season_slug,
        display_name = excluded.display_name,
        rules_version = excluded.rules_version,
        operator_version = excluded.operator_version,
        status = excluded.status,
        submission_open_at = excluded.submission_open_at,
        submission_close_at = excluded.submission_close_at,
        raw_json = excluded.raw_json,
        updated_at = excluded.updated_at
    `).run(
      seasonId,
      seasonSlug,
      displayName,
      rulesVersion,
      operatorVersion,
      status,
      submissionOpenAt,
      submissionCloseAt,
      toJson(raw, {}),
      existing?.created_at || createdAt || now,
      updatedAt || now
    );
    database.prepare('DELETE FROM poker_divisions WHERE season_id = ?').run(seasonId);
    const insertDivision = database.prepare(`
      INSERT INTO poker_divisions (
        division_id,
        season_id,
        division_slug,
        runner_kind,
        raw_json,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const division of Array.isArray(divisions) ? divisions : []) {
      const divisionId = typeof division?.divisionId === 'string' && division.divisionId.trim()
        ? division.divisionId.trim()
        : makeId('pkd');
      const rawDivision = division && typeof division === 'object' ? division : {};
      insertDivision.run(
        divisionId,
        seasonId,
        String(rawDivision.divisionSlug || rawDivision.slug || 'standard'),
        typeof rawDivision.runnerKind === 'string' ? rawDivision.runnerKind : null,
        toJson(rawDivision, {}),
        createdAt || now,
        updatedAt || now
      );
    }
    return getPokerSeasonById(seasonId);
  });
}

function hydratePokerSubmission(row) {
  if (!row) return null;
  return {
    submissionId: row.submission_id,
    seasonId: row.season_id,
    portalSubmissionId: row.portal_submission_id || null,
    portalSessionId: row.portal_session_id || null,
    walletSubject: row.wallet_subject || null,
    submitterWallet: fromJson(row.submitter_wallet_json, {}),
    bundle: fromJson(row.bundle_json, {}),
    declaredCapabilities: fromJson(row.declared_capabilities_json, {}),
    validation: fromJson(row.validation_json, {}),
    status: row.status,
    idempotencyKey: row.idempotency_key || null,
    raw: fromJson(row.raw_json, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getPokerSubmissionById(submissionId) {
  const database = ensureDb();
  const row = database.prepare('SELECT * FROM poker_setup_submissions WHERE submission_id = ?').get(submissionId);
  return hydratePokerSubmission(row);
}

function getPokerSubmissionByRequest({ seasonId, portalSessionId, idempotencyKey }) {
  if (!seasonId || !portalSessionId || !idempotencyKey) return null;
  const database = ensureDb();
  const row = database.prepare(`
    SELECT * FROM poker_setup_submissions
    WHERE season_id = ? AND portal_session_id = ? AND idempotency_key = ?
    ORDER BY created_at DESC
    LIMIT 1
  `).get(seasonId, portalSessionId, idempotencyKey);
  return hydratePokerSubmission(row);
}

function upsertPokerSubmission({
  submissionId,
  seasonId,
  portalSubmissionId = null,
  portalSessionId = null,
  walletSubject = null,
  submitterWallet = {},
  bundle = {},
  declaredCapabilities = {},
  validation = {},
  status = 'accepted',
  idempotencyKey = null,
  raw = {},
  createdAt = null,
  updatedAt = null,
}) {
  return withTransaction((database) => {
    const now = sqlNow();
    const existing = database.prepare('SELECT * FROM poker_setup_submissions WHERE submission_id = ?').get(submissionId);
    database.prepare(`
      INSERT INTO poker_setup_submissions (
        submission_id,
        season_id,
        portal_submission_id,
        portal_session_id,
        wallet_subject,
        submitter_wallet_json,
        bundle_json,
        declared_capabilities_json,
        validation_json,
        status,
        idempotency_key,
        raw_json,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(submission_id) DO UPDATE SET
        season_id = excluded.season_id,
        portal_submission_id = excluded.portal_submission_id,
        portal_session_id = excluded.portal_session_id,
        wallet_subject = excluded.wallet_subject,
        submitter_wallet_json = excluded.submitter_wallet_json,
        bundle_json = excluded.bundle_json,
        declared_capabilities_json = excluded.declared_capabilities_json,
        validation_json = excluded.validation_json,
        status = excluded.status,
        idempotency_key = excluded.idempotency_key,
        raw_json = excluded.raw_json,
        updated_at = excluded.updated_at
    `).run(
      submissionId,
      seasonId,
      portalSubmissionId,
      portalSessionId,
      walletSubject,
      toJson(submitterWallet, {}),
      toJson(bundle, {}),
      toJson(declaredCapabilities, {}),
      toJson(validation, {}),
      status,
      idempotencyKey,
      toJson(raw, {}),
      existing?.created_at || createdAt || now,
      updatedAt || now
    );
    return getPokerSubmissionById(submissionId);
  });
}

function hydratePokerBatch(row) {
  if (!row) return null;
  return {
    batchId: row.batch_id,
    seasonId: row.season_id || null,
    batchKind: row.batch_kind,
    submissionIds: fromJson(row.submission_ids_json, []),
    batchConfig: fromJson(row.batch_config_json, {}),
    status: row.status,
    raw: fromJson(row.raw_json, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getPokerBatchById(batchId) {
  const database = ensureDb();
  const row = database.prepare('SELECT * FROM poker_batches WHERE batch_id = ?').get(batchId);
  return hydratePokerBatch(row);
}

function upsertPokerBatch({
  batchId,
  seasonId = null,
  batchKind,
  submissionIds = [],
  batchConfig = {},
  status = 'queued',
  raw = {},
  createdAt = null,
  updatedAt = null,
}) {
  return withTransaction((database) => {
    const now = sqlNow();
    const existing = database.prepare('SELECT * FROM poker_batches WHERE batch_id = ?').get(batchId);
    database.prepare(`
      INSERT INTO poker_batches (
        batch_id,
        season_id,
        batch_kind,
        submission_ids_json,
        batch_config_json,
        status,
        raw_json,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(batch_id) DO UPDATE SET
        season_id = excluded.season_id,
        batch_kind = excluded.batch_kind,
        submission_ids_json = excluded.submission_ids_json,
        batch_config_json = excluded.batch_config_json,
        status = excluded.status,
        raw_json = excluded.raw_json,
        updated_at = excluded.updated_at
    `).run(
      batchId,
      seasonId,
      batchKind,
      toJson(submissionIds, []),
      toJson(batchConfig, {}),
      status,
      toJson(raw, {}),
      existing?.created_at || createdAt || now,
      updatedAt || now
    );
    return getPokerBatchById(batchId);
  });
}

function hydratePokerRun(row) {
  if (!row) return null;
  return {
    runId: row.run_id,
    batchId: row.batch_id,
    seasonId: row.season_id || null,
    summary: fromJson(row.summary_json, {}),
    raw: fromJson(row.raw_json, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getPokerRunById(runId) {
  const database = ensureDb();
  const row = database.prepare('SELECT * FROM poker_runs WHERE run_id = ?').get(runId);
  return hydratePokerRun(row);
}

function upsertPokerRun({
  runId,
  batchId,
  seasonId = null,
  summary = {},
  raw = {},
  createdAt = null,
  updatedAt = null,
}) {
  return withTransaction((database) => {
    const now = sqlNow();
    const existing = database.prepare('SELECT * FROM poker_runs WHERE run_id = ?').get(runId);
    database.prepare(`
      INSERT INTO poker_runs (
        run_id,
        batch_id,
        season_id,
        summary_json,
        raw_json,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(run_id) DO UPDATE SET
        batch_id = excluded.batch_id,
        season_id = excluded.season_id,
        summary_json = excluded.summary_json,
        raw_json = excluded.raw_json,
        updated_at = excluded.updated_at
    `).run(
      runId,
      batchId,
      seasonId,
      toJson(summary, {}),
      toJson(raw, {}),
      existing?.created_at || createdAt || now,
      updatedAt || now
    );
    return getPokerRunById(runId);
  });
}

function hydratePokerReplayArtifact(row) {
  if (!row) return null;
  return {
    runId: row.run_id,
    replayFormat: row.replay_format,
    summary: fromJson(row.summary_json, {}),
    eventsJsonlUri: row.events_jsonl_uri || null,
    artifactSha256: row.artifact_sha256 || null,
    contentType: row.content_type || null,
    raw: fromJson(row.raw_json, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getPokerReplayArtifactByRunId(runId) {
  const database = ensureDb();
  const row = database.prepare('SELECT * FROM poker_replay_artifacts WHERE run_id = ?').get(runId);
  return hydratePokerReplayArtifact(row);
}

function upsertPokerReplayArtifact({
  runId,
  replayFormat,
  summary = {},
  eventsJsonlUri = null,
  artifactSha256 = null,
  contentType = null,
  raw = {},
  createdAt = null,
  updatedAt = null,
}) {
  return withTransaction((database) => {
    const now = sqlNow();
    const existing = database.prepare('SELECT * FROM poker_replay_artifacts WHERE run_id = ?').get(runId);
    database.prepare(`
      INSERT INTO poker_replay_artifacts (
        run_id,
        replay_format,
        summary_json,
        events_jsonl_uri,
        artifact_sha256,
        content_type,
        raw_json,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(run_id) DO UPDATE SET
        replay_format = excluded.replay_format,
        summary_json = excluded.summary_json,
        events_jsonl_uri = excluded.events_jsonl_uri,
        artifact_sha256 = excluded.artifact_sha256,
        content_type = excluded.content_type,
        raw_json = excluded.raw_json,
        updated_at = excluded.updated_at
    `).run(
      runId,
      replayFormat,
      toJson(summary, {}),
      eventsJsonlUri,
      artifactSha256,
      contentType,
      toJson(raw, {}),
      existing?.created_at || createdAt || now,
      updatedAt || now
    );
    return getPokerReplayArtifactByRunId(runId);
  });
}

function hydratePokerLeaderboardSnapshot(row) {
  if (!row) return null;
  return {
    snapshotId: row.snapshot_id,
    seasonId: row.season_id,
    rankings: fromJson(row.rankings_json, []),
    raw: fromJson(row.raw_json, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getPokerLeaderboardSnapshotById(seasonId, snapshotId) {
  const database = ensureDb();
  const row = database.prepare(`
    SELECT * FROM poker_leaderboard_snapshots
    WHERE season_id = ? AND snapshot_id = ?
  `).get(seasonId, snapshotId);
  return hydratePokerLeaderboardSnapshot(row);
}

function getLatestPokerLeaderboardSnapshot(seasonId) {
  const database = ensureDb();
  const row = database.prepare(`
    SELECT * FROM poker_leaderboard_snapshots
    WHERE season_id = ?
    ORDER BY created_at DESC, snapshot_id DESC
    LIMIT 1
  `).get(seasonId);
  return hydratePokerLeaderboardSnapshot(row);
}

function upsertPokerLeaderboardSnapshot({
  snapshotId,
  seasonId,
  rankings = [],
  raw = {},
  createdAt = null,
  updatedAt = null,
}) {
  return withTransaction((database) => {
    const now = sqlNow();
    const existing = database.prepare('SELECT * FROM poker_leaderboard_snapshots WHERE snapshot_id = ?').get(snapshotId);
    database.prepare(`
      INSERT INTO poker_leaderboard_snapshots (
        snapshot_id,
        season_id,
        rankings_json,
        raw_json,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(snapshot_id) DO UPDATE SET
        season_id = excluded.season_id,
        rankings_json = excluded.rankings_json,
        raw_json = excluded.raw_json,
        updated_at = excluded.updated_at
    `).run(
      snapshotId,
      seasonId,
      toJson(rankings, []),
      toJson(raw, {}),
      existing?.created_at || createdAt || now,
      updatedAt || now
    );
    return getPokerLeaderboardSnapshotById(seasonId, snapshotId);
  });
}

function hydrateCentaurTournament(row) {
  if (!row) return null;
  return {
    tournamentId: row.tournament_id,
    slug: row.slug,
    title: row.title,
    status: row.status,
    buyInOil: Number(row.buy_in_oil || 0),
    requiredLockAmountAtomic: String(row.required_lock_amount_atomic || '0'),
    tokenSymbol: row.token_symbol || '$AGENTTOWN',
    entryDeadlineAt: row.entry_deadline_at || null,
    rules: fromJson(row.rules_json, {}),
    summary: fromJson(row.summary_json, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function listCentaurTournaments() {
  const database = ensureDb();
  const rows = database.prepare(`
    SELECT * FROM poker_centaur_tournaments
    ORDER BY created_at DESC, tournament_id DESC
  `).all();
  return rows.map(hydrateCentaurTournament).filter(Boolean);
}

function getCentaurTournamentById(tournamentId) {
  const database = ensureDb();
  const row = database.prepare('SELECT * FROM poker_centaur_tournaments WHERE tournament_id = ?').get(tournamentId);
  return hydrateCentaurTournament(row);
}

function upsertCentaurTournament({
  tournamentId,
  slug,
  title,
  status = 'scheduled',
  buyInOil = 0,
  requiredLockAmountAtomic = '0',
  tokenSymbol = '$AGENTTOWN',
  entryDeadlineAt = null,
  rules = {},
  summary = {},
  createdAt = null,
  updatedAt = null,
}) {
  return withTransaction((database) => {
    const now = sqlNow();
    const existing = database.prepare('SELECT * FROM poker_centaur_tournaments WHERE tournament_id = ?').get(tournamentId);
    database.prepare(`
      INSERT INTO poker_centaur_tournaments (
        tournament_id,
        slug,
        title,
        status,
        buy_in_oil,
        required_lock_amount_atomic,
        token_symbol,
        entry_deadline_at,
        rules_json,
        summary_json,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(tournament_id) DO UPDATE SET
        slug = excluded.slug,
        title = excluded.title,
        status = excluded.status,
        buy_in_oil = excluded.buy_in_oil,
        required_lock_amount_atomic = excluded.required_lock_amount_atomic,
        token_symbol = excluded.token_symbol,
        entry_deadline_at = excluded.entry_deadline_at,
        rules_json = excluded.rules_json,
        summary_json = excluded.summary_json,
        updated_at = excluded.updated_at
    `).run(
      tournamentId,
      slug,
      title,
      status,
      Number(buyInOil || 0),
      String(requiredLockAmountAtomic || '0'),
      tokenSymbol,
      entryDeadlineAt,
      toJson(rules, {}),
      toJson(summary, {}),
      existing?.created_at || createdAt || now,
      updatedAt || now
    );
    return getCentaurTournamentById(tournamentId);
  });
}

function hydrateCentaurEntry(row) {
  if (!row) return null;
  return {
    entryId: row.entry_id,
    tournamentId: row.tournament_id,
    portalSessionId: row.portal_session_id || null,
    houseId: row.house_id || null,
    walletSubject: row.wallet_subject,
    displayName: row.display_name,
    status: row.status,
    wagerOil: Number(row.wager_oil || 0),
    streamflowVerificationId: row.streamflow_verification_id || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getCentaurEntryById(entryId) {
  const database = ensureDb();
  const row = database.prepare('SELECT * FROM poker_centaur_entries WHERE entry_id = ?').get(entryId);
  return hydrateCentaurEntry(row);
}

function getCentaurEntryByWalletSubject(tournamentId, walletSubject) {
  const database = ensureDb();
  const row = database.prepare(`
    SELECT * FROM poker_centaur_entries
    WHERE tournament_id = ? AND wallet_subject = ?
    LIMIT 1
  `).get(tournamentId, walletSubject);
  return hydrateCentaurEntry(row);
}

function upsertCentaurEntry({
  entryId,
  tournamentId,
  portalSessionId = null,
  houseId = null,
  walletSubject,
  displayName,
  status = 'joined',
  wagerOil = 0,
  streamflowVerificationId = null,
  createdAt = null,
  updatedAt = null,
}) {
  return withTransaction((database) => {
    const now = sqlNow();
    const existing = database.prepare('SELECT * FROM poker_centaur_entries WHERE entry_id = ?').get(entryId);
    database.prepare(`
      INSERT INTO poker_centaur_entries (
        entry_id,
        tournament_id,
        portal_session_id,
        house_id,
        wallet_subject,
        display_name,
        status,
        wager_oil,
        streamflow_verification_id,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(entry_id) DO UPDATE SET
        tournament_id = excluded.tournament_id,
        portal_session_id = excluded.portal_session_id,
        house_id = excluded.house_id,
        wallet_subject = excluded.wallet_subject,
        display_name = excluded.display_name,
        status = excluded.status,
        wager_oil = excluded.wager_oil,
        streamflow_verification_id = excluded.streamflow_verification_id,
        updated_at = excluded.updated_at
    `).run(
      entryId,
      tournamentId,
      portalSessionId,
      houseId,
      walletSubject,
      displayName,
      status,
      Number(wagerOil || 0),
      streamflowVerificationId,
      existing?.created_at || createdAt || now,
      updatedAt || now
    );
    return getCentaurEntryById(entryId);
  });
}

function hydrateCentaurHand(row) {
  if (!row) return null;
  return {
    handId: row.hand_id,
    tournamentId: row.tournament_id,
    entryId: row.entry_id,
    handNumber: Number(row.hand_number || 0),
    phase: row.phase,
    status: row.status,
    decisionExpiresAt: row.decision_expires_at || null,
    tableState: fromJson(row.table_state_json, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getCentaurHandById(handId) {
  const database = ensureDb();
  const row = database.prepare('SELECT * FROM poker_centaur_hands WHERE hand_id = ?').get(handId);
  return hydrateCentaurHand(row);
}

function getCurrentCentaurHandForEntry(entryId) {
  const database = ensureDb();
  const row = database.prepare(`
    SELECT * FROM poker_centaur_hands
    WHERE entry_id = ?
    ORDER BY hand_number DESC, created_at DESC
    LIMIT 1
  `).get(entryId);
  return hydrateCentaurHand(row);
}

function upsertCentaurHand({
  handId,
  tournamentId,
  entryId,
  handNumber = 1,
  phase = 'preflop',
  status = 'live',
  decisionExpiresAt = null,
  tableState = {},
  createdAt = null,
  updatedAt = null,
}) {
  return withTransaction((database) => {
    const now = sqlNow();
    const existing = database.prepare('SELECT * FROM poker_centaur_hands WHERE hand_id = ?').get(handId);
    database.prepare(`
      INSERT INTO poker_centaur_hands (
        hand_id,
        tournament_id,
        entry_id,
        hand_number,
        phase,
        status,
        decision_expires_at,
        table_state_json,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(hand_id) DO UPDATE SET
        tournament_id = excluded.tournament_id,
        entry_id = excluded.entry_id,
        hand_number = excluded.hand_number,
        phase = excluded.phase,
        status = excluded.status,
        decision_expires_at = excluded.decision_expires_at,
        table_state_json = excluded.table_state_json,
        updated_at = excluded.updated_at
    `).run(
      handId,
      tournamentId,
      entryId,
      Number(handNumber || 1),
      phase,
      status,
      decisionExpiresAt,
      toJson(tableState, {}),
      existing?.created_at || createdAt || now,
      updatedAt || now
    );
    return getCentaurHandById(handId);
  });
}

function hydrateCentaurMessage(row) {
  if (!row) return null;
  return {
    messageId: row.message_id,
    tournamentId: row.tournament_id,
    entryId: row.entry_id,
    handId: row.hand_id,
    authorRole: row.author_role,
    body: row.body,
    createdAt: row.created_at,
  };
}

function listCentaurMessagesByHand(handId) {
  const database = ensureDb();
  const rows = database.prepare(`
    SELECT * FROM poker_centaur_messages
    WHERE hand_id = ?
    ORDER BY created_at ASC, message_id ASC
  `).all(handId);
  return rows.map(hydrateCentaurMessage).filter(Boolean);
}

function createCentaurMessage({
  messageId = null,
  tournamentId,
  entryId,
  handId,
  authorRole,
  body,
  createdAt = null,
}) {
  const database = ensureDb();
  const nextMessageId = messageId || makeId('pkmsg');
  const now = createdAt || sqlNow();
  database.prepare(`
    INSERT INTO poker_centaur_messages (
      message_id,
      tournament_id,
      entry_id,
      hand_id,
      author_role,
      body,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    nextMessageId,
    tournamentId,
    entryId,
    handId,
    authorRole,
    body,
    now
  );
  return hydrateCentaurMessage(database.prepare('SELECT * FROM poker_centaur_messages WHERE message_id = ?').get(nextMessageId));
}

function hydrateCentaurAction(row) {
  if (!row) return null;
  return {
    actionId: row.action_id,
    tournamentId: row.tournament_id,
    entryId: row.entry_id,
    handId: row.hand_id,
    actorRole: row.actor_role,
    actionKind: row.action_kind,
    amountOil: Number(row.amount_oil || 0),
    payload: fromJson(row.payload_json, {}),
    createdAt: row.created_at,
  };
}

function listCentaurActionsByHand(handId) {
  const database = ensureDb();
  const rows = database.prepare(`
    SELECT * FROM poker_centaur_actions
    WHERE hand_id = ?
    ORDER BY created_at ASC, action_id ASC
  `).all(handId);
  return rows.map(hydrateCentaurAction).filter(Boolean);
}

function createCentaurAction({
  actionId = null,
  tournamentId,
  entryId,
  handId,
  actorRole,
  actionKind,
  amountOil = 0,
  payload = {},
  createdAt = null,
}) {
  const database = ensureDb();
  const nextActionId = actionId || makeId('pkact');
  const now = createdAt || sqlNow();
  database.prepare(`
    INSERT INTO poker_centaur_actions (
      action_id,
      tournament_id,
      entry_id,
      hand_id,
      actor_role,
      action_kind,
      amount_oil,
      payload_json,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    nextActionId,
    tournamentId,
    entryId,
    handId,
    actorRole,
    actionKind,
    Number(amountOil || 0),
    toJson(payload, {}),
    now
  );
  return hydrateCentaurAction(database.prepare('SELECT * FROM poker_centaur_actions WHERE action_id = ?').get(nextActionId));
}

function hydrateStreamflowVerification(row) {
  if (!row) return null;
  return {
    verificationId: row.verification_id,
    portalSessionId: row.portal_session_id || null,
    houseId: row.house_id || null,
    walletSubject: row.wallet_subject,
    chain: row.chain,
    address: row.address,
    provider: row.provider,
    streamId: row.stream_id,
    minLockAmountAtomic: String(row.min_lock_amount_atomic || '0'),
    verifiedAmountAtomic: String(row.verified_amount_atomic || '0'),
    tokenSymbol: row.token_symbol || '$AGENTTOWN',
    signatureMessage: row.signature_message,
    status: row.status,
    verifiedAt: row.verified_at,
    lastCheckedAt: row.last_checked_at || null,
    raw: fromJson(row.raw_json, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getStreamflowVerificationById(verificationId) {
  const database = ensureDb();
  const row = database.prepare('SELECT * FROM poker_streamflow_lock_verifications WHERE verification_id = ?').get(verificationId);
  return hydrateStreamflowVerification(row);
}

function getStreamflowVerificationByWalletSubject(walletSubject) {
  const database = ensureDb();
  const row = database.prepare(`
    SELECT * FROM poker_streamflow_lock_verifications
    WHERE wallet_subject = ?
    ORDER BY verified_at DESC, created_at DESC
    LIMIT 1
  `).get(walletSubject);
  return hydrateStreamflowVerification(row);
}

function getStreamflowVerificationByWalletAndStream(walletSubject, provider, streamId) {
  const database = ensureDb();
  const row = database.prepare(`
    SELECT * FROM poker_streamflow_lock_verifications
    WHERE wallet_subject = ? AND provider = ? AND stream_id = ?
    ORDER BY verified_at DESC, created_at DESC
    LIMIT 1
  `).get(walletSubject, provider, streamId);
  return hydrateStreamflowVerification(row);
}

function listActiveStreamflowVerifications({ limit = 500 } = {}) {
  const database = ensureDb();
  const safeLimit = Math.max(1, Math.min(5000, Number(limit || 500)));
  const rows = database.prepare(`
    SELECT * FROM poker_streamflow_lock_verifications
    WHERE status = 'verified'
    ORDER BY COALESCE(last_checked_at, verified_at, created_at) ASC, verification_id ASC
    LIMIT ?
  `).all(safeLimit);
  return rows.map(hydrateStreamflowVerification).filter(Boolean);
}

function upsertStreamflowVerification({
  verificationId,
  portalSessionId = null,
  houseId = null,
  walletSubject,
  chain = 'solana',
  address,
  provider = 'streamflow',
  streamId,
  minLockAmountAtomic = '0',
  verifiedAmountAtomic = '0',
  tokenSymbol = '$AGENTTOWN',
  signatureMessage = '',
  status = 'verified',
  verifiedAt = null,
  lastCheckedAt = null,
  raw = {},
  createdAt = null,
  updatedAt = null,
}) {
  return withTransaction((database) => {
    const now = sqlNow();
    const existing = database.prepare('SELECT * FROM poker_streamflow_lock_verifications WHERE verification_id = ?').get(verificationId);
    database.prepare(`
      INSERT INTO poker_streamflow_lock_verifications (
        verification_id,
        portal_session_id,
        house_id,
        wallet_subject,
        chain,
        address,
        provider,
        stream_id,
        min_lock_amount_atomic,
        verified_amount_atomic,
        token_symbol,
        signature_message,
        status,
        verified_at,
        last_checked_at,
        raw_json,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(verification_id) DO UPDATE SET
        portal_session_id = excluded.portal_session_id,
        house_id = excluded.house_id,
        wallet_subject = excluded.wallet_subject,
        chain = excluded.chain,
        address = excluded.address,
        provider = excluded.provider,
        stream_id = excluded.stream_id,
        min_lock_amount_atomic = excluded.min_lock_amount_atomic,
        verified_amount_atomic = excluded.verified_amount_atomic,
        token_symbol = excluded.token_symbol,
        signature_message = excluded.signature_message,
        status = excluded.status,
        verified_at = excluded.verified_at,
        last_checked_at = excluded.last_checked_at,
        raw_json = excluded.raw_json,
        updated_at = excluded.updated_at
    `).run(
      verificationId,
      portalSessionId,
      houseId,
      walletSubject,
      chain,
      address,
      provider,
      streamId,
      String(minLockAmountAtomic || '0'),
      String(verifiedAmountAtomic || '0'),
      tokenSymbol,
      signatureMessage,
      status,
      verifiedAt || now,
      lastCheckedAt,
      toJson(raw, {}),
      existing?.created_at || createdAt || now,
      updatedAt || now
    );
    return getStreamflowVerificationById(verificationId);
  });
}

function hydrateOilSnapshotEvent(row) {
  if (!row) return null;
  return {
    snapshotId: row.snapshot_id,
    verificationId: row.verification_id,
    walletSubject: row.wallet_subject,
    houseId: row.house_id || null,
    hourBucket: row.hour_bucket,
    scheduledFor: row.scheduled_for,
    checkedAt: row.checked_at || null,
    status: row.status,
    amountAwarded: Number(row.amount_awarded || 0),
    providerStatus: fromJson(row.provider_status_json, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getOilSnapshotEventByVerificationAndScheduledFor(verificationId, scheduledFor) {
  const database = ensureDb();
  const row = database.prepare(`
    SELECT * FROM poker_oil_snapshot_events
    WHERE verification_id = ? AND scheduled_for = ?
    LIMIT 1
  `).get(verificationId, scheduledFor);
  return hydrateOilSnapshotEvent(row);
}

function listOilSnapshotEventsByVerificationAndHour(verificationId, hourBucket) {
  const database = ensureDb();
  const rows = database.prepare(`
    SELECT * FROM poker_oil_snapshot_events
    WHERE verification_id = ? AND hour_bucket = ?
    ORDER BY scheduled_for ASC, snapshot_id ASC
  `).all(verificationId, hourBucket);
  return rows.map(hydrateOilSnapshotEvent).filter(Boolean);
}

function upsertOilSnapshotEvent({
  snapshotId,
  verificationId,
  walletSubject,
  houseId = null,
  hourBucket,
  scheduledFor,
  checkedAt = null,
  status = 'pending',
  amountAwarded = 0,
  providerStatus = {},
  createdAt = null,
  updatedAt = null,
}) {
  return withTransaction((database) => {
    const now = sqlNow();
    const existing = database.prepare('SELECT * FROM poker_oil_snapshot_events WHERE snapshot_id = ?').get(snapshotId);
    database.prepare(`
      INSERT INTO poker_oil_snapshot_events (
        snapshot_id,
        verification_id,
        wallet_subject,
        house_id,
        hour_bucket,
        scheduled_for,
        checked_at,
        status,
        amount_awarded,
        provider_status_json,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(snapshot_id) DO UPDATE SET
        verification_id = excluded.verification_id,
        wallet_subject = excluded.wallet_subject,
        house_id = excluded.house_id,
        hour_bucket = excluded.hour_bucket,
        scheduled_for = excluded.scheduled_for,
        checked_at = excluded.checked_at,
        status = excluded.status,
        amount_awarded = excluded.amount_awarded,
        provider_status_json = excluded.provider_status_json,
        updated_at = excluded.updated_at
    `).run(
      snapshotId,
      verificationId,
      walletSubject,
      houseId,
      hourBucket,
      scheduledFor,
      checkedAt,
      status,
      Number(amountAwarded || 0),
      toJson(providerStatus, {}),
      existing?.created_at || createdAt || now,
      updatedAt || now
    );
    return hydrateOilSnapshotEvent(database.prepare('SELECT * FROM poker_oil_snapshot_events WHERE snapshot_id = ?').get(snapshotId));
  });
}

function hydrateOilLedgerEntry(row) {
  if (!row) return null;
  return {
    ledgerEntryId: row.ledger_entry_id,
    walletSubject: row.wallet_subject,
    houseId: row.house_id || null,
    verificationId: row.verification_id || null,
    snapshotId: row.snapshot_id || null,
    tournamentId: row.tournament_id || null,
    entryId: row.entry_id || null,
    entryKind: row.entry_kind,
    direction: row.direction,
    amount: Number(row.amount || 0),
    memo: row.memo || null,
    createdAt: row.created_at,
  };
}

function createOilLedgerEntry({
  ledgerEntryId = null,
  walletSubject,
  houseId = null,
  verificationId = null,
  snapshotId = null,
  tournamentId = null,
  entryId = null,
  entryKind,
  direction,
  amount = 0,
  memo = null,
  createdAt = null,
}) {
  return withTransaction((database) => {
    if (snapshotId) {
      const existing = database.prepare('SELECT * FROM poker_oil_ledger_entries WHERE snapshot_id = ?').get(snapshotId);
      if (existing) return hydrateOilLedgerEntry(existing);
    }
    const nextLedgerEntryId = ledgerEntryId || makeId('oil');
    const now = createdAt || sqlNow();
    database.prepare(`
      INSERT INTO poker_oil_ledger_entries (
        ledger_entry_id,
        wallet_subject,
        house_id,
        verification_id,
        snapshot_id,
        tournament_id,
        entry_id,
        entry_kind,
        direction,
        amount,
        memo,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      nextLedgerEntryId,
      walletSubject,
      houseId,
      verificationId,
      snapshotId,
      tournamentId,
      entryId,
      entryKind,
      direction,
      Number(amount || 0),
      memo,
      now
    );
    return hydrateOilLedgerEntry(database.prepare('SELECT * FROM poker_oil_ledger_entries WHERE ledger_entry_id = ?').get(nextLedgerEntryId));
  });
}

function listOilLedgerEntriesByWalletSubject(walletSubject, { limit = 50 } = {}) {
  const database = ensureDb();
  const safeLimit = Math.max(1, Math.min(500, Number(limit || 50)));
  const rows = database.prepare(`
    SELECT * FROM poker_oil_ledger_entries
    WHERE wallet_subject = ?
    ORDER BY created_at DESC, ledger_entry_id DESC
    LIMIT ?
  `).all(walletSubject, safeLimit);
  return rows.map(hydrateOilLedgerEntry).filter(Boolean);
}

function computeOilBalance(walletSubject) {
  const database = ensureDb();
  const row = database.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN direction = 'credit' THEN amount ELSE 0 END), 0) AS credits,
      COALESCE(SUM(CASE WHEN direction = 'debit' THEN amount ELSE 0 END), 0) AS debits
    FROM poker_oil_ledger_entries
    WHERE wallet_subject = ?
  `).get(walletSubject);
  const credits = Number(row?.credits || 0);
  const debits = Number(row?.debits || 0);
  return {
    walletSubject,
    credits,
    debits,
    balance: credits - debits,
  };
}

module.exports = {
  activateCredentialGrant,
  countTableRows,
  computeOilBalance,
  createApprovalRequest,
  createCentaurAction,
  createCentaurMessage,
  createCredentialGrant,
  createEvidence,
  createImportJob,
  createInvocation,
  createOilLedgerEntry,
  createWebSession,
  decideApproval,
  getActiveCredentialGrant,
  getApprovalById,
  getCentaurEntryById,
  getCentaurEntryByWalletSubject,
  getCentaurHandById,
  getCentaurTournamentById,
  getCheckpointByRef,
  getCredentialGrantById,
  getEvidenceById,
  getImportJobById: (importJobId) => hydrateImportJob(ensureDb().prepare('SELECT * FROM web_import_jobs WHERE import_job_id = ?').get(importJobId)),
  getInvocationById,
  getInvocationByIdempotency,
  getLatestCheckpointForSession,
  getLatestPokerLeaderboardSnapshot,
  getPokerBatchById,
  getPokerLeaderboardSnapshotById,
  getPokerReplayArtifactByRunId,
  getRegistryEntityById,
  getPokerRunById,
  getPokerSeasonById,
  getPokerSubmissionById,
  getPokerSubmissionByRequest,
  getCurrentCentaurHandForEntry,
  getOilSnapshotEventByVerificationAndScheduledFor,
  getWebSessionById,
  getStreamflowVerificationById,
  getStreamflowVerificationByWalletAndStream,
  getStreamflowVerificationByWalletSubject,
  listActiveStreamflowVerifications,
  listApprovalsForSession,
  listCentaurActionsByHand,
  listCentaurMessagesByHand,
  listCentaurTournaments,
  listCredentialStatusByOrigin,
  listEvidenceForSession,
  listOilLedgerEntriesByWalletSubject,
  listOilSnapshotEventsByVerificationAndHour,
  listPokerSeasons,
  resetExtendedStore,
  searchRegistryEntities,
  setWebSessionRevisionAndState,
  touchCredentialGrant,
  upsertCentaurEntry,
  upsertCentaurHand,
  upsertCentaurTournament,
  upsertOilSnapshotEvent,
  upsertPokerBatch,
  upsertPokerLeaderboardSnapshot,
  upsertPokerReplayArtifact,
  upsertPokerRun,
  upsertPokerSeason,
  upsertPokerSubmission,
  upsertStreamflowVerification,
  writeCheckpoint,
};
