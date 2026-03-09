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
      submitter_wallet_json TEXT NOT NULL,
      bundle_json TEXT NOT NULL,
      validation_json TEXT NOT NULL,
      status TEXT NOT NULL,
      idempotency_key TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (season_id) REFERENCES poker_seasons(season_id)
    );

    CREATE INDEX IF NOT EXISTS poker_submissions_season_wallet_created_idx
      ON poker_setup_submissions(season_id, created_at DESC);

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
  `);
  seedRegistryEntities();
  return db;
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

module.exports = {
  activateCredentialGrant,
  countTableRows,
  createApprovalRequest,
  createCredentialGrant,
  createEvidence,
  createImportJob,
  createInvocation,
  createWebSession,
  decideApproval,
  getActiveCredentialGrant,
  getApprovalById,
  getCheckpointByRef,
  getCredentialGrantById,
  getEvidenceById,
  getImportJobById: (importJobId) => hydrateImportJob(ensureDb().prepare('SELECT * FROM web_import_jobs WHERE import_job_id = ?').get(importJobId)),
  getInvocationById,
  getInvocationByIdempotency,
  getLatestCheckpointForSession,
  getRegistryEntityById,
  getWebSessionById,
  listApprovalsForSession,
  listCredentialStatusByOrigin,
  listEvidenceForSession,
  resetExtendedStore,
  searchRegistryEntities,
  setWebSessionRevisionAndState,
  touchCredentialGrant,
  writeCheckpoint,
};
