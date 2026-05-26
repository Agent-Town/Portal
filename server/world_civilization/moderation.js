const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const { createCivicAuditLedger, sha256, stableJson } = require('./audit_ledger');
const { validateModerationDecision } = require('./schemas');
const {
  ensureCivicSqliteSchemaMetadata,
  readCivicSqliteSchemaMetadata
} = require('./sqlite_schema');

const MIGRATION_VERSION = 'v1';
const STORE_KEY = 'moderation';

function parseModerationRow(row) {
  if (!row) return null;
  return {
    decisionId: row.decision_id,
    subjectRef: row.subject_ref,
    surface: row.surface,
    status: row.status,
    policyVersion: row.policy_version,
    reviewerKind: row.reviewer_kind,
    auditEntryId: row.audit_entry_id,
    createdAtMs: Number(row.created_at),
    decision: JSON.parse(row.decision_json)
  };
}

function ensureSchema(db) {
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = NORMAL;');
  db.exec('PRAGMA busy_timeout = 5000;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS world_civic_moderation_decisions (
      decision_id TEXT PRIMARY KEY,
      subject_ref TEXT NOT NULL,
      surface TEXT NOT NULL,
      status TEXT NOT NULL,
      policy_version TEXT NOT NULL,
      reviewer_kind TEXT NOT NULL,
      audit_entry_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      decision_json TEXT NOT NULL,
      UNIQUE(subject_ref, surface, policy_version)
    );
    CREATE INDEX IF NOT EXISTS idx_world_civic_moderation_subject
      ON world_civic_moderation_decisions(subject_ref, created_at);
    CREATE INDEX IF NOT EXISTS idx_world_civic_moderation_surface_status
      ON world_civic_moderation_decisions(surface, status, created_at);
    CREATE INDEX IF NOT EXISTS idx_world_civic_moderation_policy
      ON world_civic_moderation_decisions(policy_version, created_at);
    CREATE INDEX IF NOT EXISTS idx_world_civic_moderation_reviewer
      ON world_civic_moderation_decisions(reviewer_kind, created_at);
  `);
  return ensureCivicSqliteSchemaMetadata(db, {
    storeKey: STORE_KEY,
    migrationVersion: MIGRATION_VERSION,
    modulePath: 'server/world_civilization/moderation.js'
  });
}

function buildStatements(db) {
  return {
    byDecisionId: db.prepare(`
      SELECT *
      FROM world_civic_moderation_decisions
      WHERE decision_id = ?
      LIMIT 1
    `),
    bySubjectSurfacePolicy: db.prepare(`
      SELECT *
      FROM world_civic_moderation_decisions
      WHERE subject_ref = ? AND surface = ? AND policy_version = ?
      LIMIT 1
    `),
    insert: db.prepare(`
      INSERT INTO world_civic_moderation_decisions (
        decision_id, subject_ref, surface, status, policy_version,
        reviewer_kind, audit_entry_id, created_at, decision_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `),
    list: db.prepare(`
      SELECT *
      FROM world_civic_moderation_decisions
      WHERE (? = '' OR subject_ref = ?)
        AND (? = '' OR surface = ?)
        AND (? = '' OR status = ?)
        AND (? = '' OR reviewer_kind = ?)
      ORDER BY created_at ASC, decision_id ASC
      LIMIT ?
    `),
    summaryCounts: db.prepare(`
      SELECT surface, status, COUNT(1) AS count
      FROM world_civic_moderation_decisions
      WHERE subject_ref = ?
      GROUP BY surface, status
    `),
    summaryDecisions: db.prepare(`
      SELECT *
      FROM world_civic_moderation_decisions
      WHERE subject_ref = ?
      ORDER BY created_at DESC, decision_id DESC
    `),
    count: db.prepare('SELECT COUNT(1) AS count FROM world_civic_moderation_decisions')
  };
}

function auditIdempotencyKey(decision) {
  return `idem_${decision.decisionId.replace(/^moderation_/, 'mod_').slice(0, 80)}`;
}

function auditActorFor(decision) {
  if (decision.reviewerKind === 'system') {
    return {
      kind: 'agent',
      accountId: 'acct_system_moderation',
      agentId: 'agent_system_moderation'
    };
  }
  return {
    kind: 'human',
    accountId: 'acct_human_moderator'
  };
}

function createModerationAuditEntry(decision, nowMs) {
  return {
    schemaVersion: decision.schemaVersion,
    entryId: `audit_${decision.decisionId.replace(/^moderation_/, 'moderation_')}`,
    actor: auditActorFor(decision),
    actionType: 'moderation.decided',
    objectRef: decision.decisionId,
    idempotencyKey: auditIdempotencyKey(decision),
    beforeHash: sha256(`agent-town.v6.civic.moderation.absent:${decision.decisionId}`),
    afterHash: sha256(stableJson(decision)),
    createdAtMs: nowMs,
    migrationVersion: MIGRATION_VERSION,
    replayable: true,
    rollbackId: '',
    privacy: {
      redacted: true,
      privateDataIncluded: false,
      dataClasses: ['public_audit_summary']
    }
  };
}

function createCivicModerationStore({ sqlitePath, auditLedger = null, auditSqlitePath = '' }) {
  if (!sqlitePath || typeof sqlitePath !== 'string') {
    throw new Error('CIVIC_MODERATION_SQLITE_PATH_REQUIRED');
  }
  fs.mkdirSync(path.dirname(sqlitePath), { recursive: true });
  const db = new DatabaseSync(sqlitePath);
  let schemaMetadata;
  try {
    schemaMetadata = ensureSchema(db);
  } catch (err) {
    db.close();
    throw err;
  }
  const statements = buildStatements(db);
  const ownsLedger = !auditLedger;
  const ledger = auditLedger || createCivicAuditLedger({ sqlitePath: auditSqlitePath || sqlitePath });
  let closed = false;

  function recordDecision(rawDecision = {}, { nowMs = Date.now() } = {}) {
    const validation = validateModerationDecision(rawDecision);
    if (!validation.ok) {
      const err = new Error('CIVIC_MODERATION_INVALID');
      err.details = { errors: validation.errors };
      throw err;
    }
    const decision = validation.value;
    const normalizedJson = stableJson(decision);

    const existingById = parseModerationRow(statements.byDecisionId.get(decision.decisionId));
    if (existingById) {
      if (stableJson(existingById.decision) !== normalizedJson) {
        const err = new Error('CIVIC_MODERATION_ID_CONFLICT');
        err.details = { decisionId: decision.decisionId };
        throw err;
      }
      return { ...existingById, duplicate: true };
    }

    const existingBySubjectPolicy = parseModerationRow(statements.bySubjectSurfacePolicy.get(
      decision.subjectRef,
      decision.surface,
      decision.policyVersion
    ));
    if (existingBySubjectPolicy) {
      const err = new Error('CIVIC_MODERATION_SUBJECT_POLICY_CONFLICT');
      err.details = {
        subjectRef: decision.subjectRef,
        surface: decision.surface,
        policyVersion: decision.policyVersion,
        existingDecisionId: existingBySubjectPolicy.decisionId
      };
      throw err;
    }

    const auditRow = ledger.append(createModerationAuditEntry(decision, nowMs));
    statements.insert.run(
      decision.decisionId,
      decision.subjectRef,
      decision.surface,
      decision.status,
      decision.policyVersion,
      decision.reviewerKind,
      auditRow.entry.entryId,
      nowMs,
      normalizedJson
    );
    return parseModerationRow(statements.byDecisionId.get(decision.decisionId));
  }

  function getDecision(decisionId = '') {
    return parseModerationRow(statements.byDecisionId.get(String(decisionId || '')));
  }

  function listDecisions({ subjectRef = '', surface = '', status = '', reviewerKind = '', limit = 100 } = {}) {
    const safeLimit = Number.isInteger(Number(limit)) ? Math.max(1, Math.min(500, Number(limit))) : 100;
    return statements.list.all(
      String(subjectRef || ''),
      String(subjectRef || ''),
      String(surface || ''),
      String(surface || ''),
      String(status || ''),
      String(status || ''),
      String(reviewerKind || ''),
      String(reviewerKind || ''),
      safeLimit
    ).map(parseModerationRow);
  }

  function summarizeSubjectModeration(subjectRef = '') {
    const rows = statements.summaryCounts.all(String(subjectRef || ''));
    const decisions = statements.summaryDecisions.all(String(subjectRef || '')).map(parseModerationRow);
    const bySurface = {};
    let decisionCount = 0;
    let rejectedCount = 0;
    let needsReviewCount = 0;
    let redactedFieldCount = 0;
    for (const row of rows) {
      const surface = String(row.surface || '');
      const status = String(row.status || '');
      const count = Number(row.count || 0);
      if (!bySurface[surface]) bySurface[surface] = { approved: 0, rejected: 0, needs_review: 0 };
      bySurface[surface][status] = (bySurface[surface][status] || 0) + count;
      decisionCount += count;
      if (status === 'rejected') rejectedCount += count;
      if (status === 'needs_review') needsReviewCount += count;
    }
    for (const row of decisions) {
      redactedFieldCount += Array.isArray(row.decision.redactedFields) ? row.decision.redactedFields.length : 0;
    }
    return {
      subjectRef: String(subjectRef || ''),
      decisionCount,
      rejectedCount,
      needsReviewCount,
      bySurface,
      redactedFieldCount,
      latestDecisionId: decisions[0]?.decisionId || '',
      privateDataIncluded: false,
      executionStatus: 'not_executable'
    };
  }

  function count() {
    return Number(statements.count.get().count || 0);
  }

  function getSchemaMetadata() {
    return readCivicSqliteSchemaMetadata(db, STORE_KEY);
  }

  function close() {
    if (closed) return;
    closed = true;
    if (ownsLedger && ledger?.close) ledger.close();
    db.close();
  }

  return {
    close,
    count,
    getDecision,
    getSchemaMetadata,
    listDecisions,
    migrationVersion: schemaMetadata.migrationVersion,
    recordDecision,
    sqlitePath,
    summarizeSubjectModeration
  };
}

module.exports = {
  createCivicModerationStore
};
