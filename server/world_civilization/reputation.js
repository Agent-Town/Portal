const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const { createCivicAuditLedger, sha256, stableJson } = require('./audit_ledger');
const { validateReputationDispute, validateReputationRecord } = require('./schemas');
const {
  ensureCivicSqliteSchemaMetadata,
  readCivicSqliteSchemaMetadata
} = require('./sqlite_schema');

const MIGRATION_VERSION = 'v1';
const STORE_KEY = 'reputation';

function parseReputationRow(row) {
  if (!row) return null;
  return {
    recordId: row.record_id,
    subjectAccountId: row.subject_account_id,
    awardedByAccountId: row.awarded_by_account_id,
    kind: row.kind,
    delta: Number(row.delta),
    sourceRef: row.source_ref,
    disputeStatus: row.dispute_status,
    auditEntryId: row.audit_entry_id,
    createdAtMs: Number(row.created_at),
    record: JSON.parse(row.reputation_json)
  };
}

function parseDisputeRow(row) {
  if (!row) return null;
  return {
    disputeId: row.dispute_id,
    recordId: row.record_id,
    subjectAccountId: row.subject_account_id,
    disputedByAccountId: row.disputed_by_account_id,
    status: row.status,
    reviewerKind: row.reviewer_kind,
    moderationDecisionId: row.moderation_decision_id || '',
    auditEntryId: row.audit_entry_id,
    createdAtMs: Number(row.created_at),
    dispute: JSON.parse(row.dispute_json)
  };
}

function ensureSchema(db) {
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = NORMAL;');
  db.exec('PRAGMA busy_timeout = 5000;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS world_civic_reputation_records (
      record_id TEXT PRIMARY KEY,
      subject_account_id TEXT NOT NULL,
      awarded_by_account_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      delta INTEGER NOT NULL,
      source_ref TEXT NOT NULL,
      dispute_status TEXT NOT NULL,
      audit_entry_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      reputation_json TEXT NOT NULL,
      UNIQUE(subject_account_id, awarded_by_account_id, source_ref, kind)
    );
    CREATE INDEX IF NOT EXISTS idx_world_civic_reputation_subject_kind
      ON world_civic_reputation_records(subject_account_id, kind, created_at);
    CREATE INDEX IF NOT EXISTS idx_world_civic_reputation_awarder_created
      ON world_civic_reputation_records(awarded_by_account_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_world_civic_reputation_source
      ON world_civic_reputation_records(source_ref, created_at);
    CREATE INDEX IF NOT EXISTS idx_world_civic_reputation_dispute
      ON world_civic_reputation_records(dispute_status, created_at);

    CREATE TABLE IF NOT EXISTS world_civic_reputation_disputes (
      dispute_id TEXT PRIMARY KEY,
      record_id TEXT NOT NULL,
      subject_account_id TEXT NOT NULL,
      disputed_by_account_id TEXT NOT NULL,
      status TEXT NOT NULL,
      reviewer_kind TEXT NOT NULL,
      moderation_decision_id TEXT NOT NULL,
      audit_entry_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      dispute_json TEXT NOT NULL,
      UNIQUE(record_id, disputed_by_account_id)
    );
    CREATE INDEX IF NOT EXISTS idx_world_civic_reputation_disputes_record
      ON world_civic_reputation_disputes(record_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_world_civic_reputation_disputes_subject
      ON world_civic_reputation_disputes(subject_account_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_world_civic_reputation_disputes_status
      ON world_civic_reputation_disputes(status, created_at);
    CREATE INDEX IF NOT EXISTS idx_world_civic_reputation_disputes_requester
      ON world_civic_reputation_disputes(disputed_by_account_id, created_at);
  `);
  return ensureCivicSqliteSchemaMetadata(db, {
    storeKey: STORE_KEY,
    migrationVersion: MIGRATION_VERSION,
    modulePath: 'server/world_civilization/reputation.js'
  });
}

function buildStatements(db) {
  return {
    byRecordId: db.prepare(`
      SELECT *
      FROM world_civic_reputation_records
      WHERE record_id = ?
      LIMIT 1
    `),
    bySubjectAwarderSourceKind: db.prepare(`
      SELECT *
      FROM world_civic_reputation_records
      WHERE subject_account_id = ?
        AND awarded_by_account_id = ?
        AND source_ref = ?
        AND kind = ?
      LIMIT 1
    `),
    insert: db.prepare(`
      INSERT INTO world_civic_reputation_records (
        record_id, subject_account_id, awarded_by_account_id, kind,
        delta, source_ref, dispute_status, audit_entry_id, created_at,
        reputation_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `),
    list: db.prepare(`
      SELECT *
      FROM world_civic_reputation_records
      WHERE (? = '' OR subject_account_id = ?)
        AND (? = '' OR kind = ?)
        AND (? = '' OR dispute_status = ?)
      ORDER BY created_at ASC, record_id ASC
      LIMIT ?
    `),
    byDisputeId: db.prepare(`
      SELECT *
      FROM world_civic_reputation_disputes
      WHERE dispute_id = ?
      LIMIT 1
    `),
    byRecordDisputer: db.prepare(`
      SELECT *
      FROM world_civic_reputation_disputes
      WHERE record_id = ? AND disputed_by_account_id = ?
      LIMIT 1
    `),
    insertDispute: db.prepare(`
      INSERT INTO world_civic_reputation_disputes (
        dispute_id, record_id, subject_account_id, disputed_by_account_id,
        status, reviewer_kind, moderation_decision_id, audit_entry_id,
        created_at, dispute_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `),
    listDisputes: db.prepare(`
      SELECT *
      FROM world_civic_reputation_disputes
      WHERE (? = '' OR record_id = ?)
        AND (? = '' OR subject_account_id = ?)
        AND (? = '' OR status = ?)
        AND (? = '' OR disputed_by_account_id = ?)
      ORDER BY created_at ASC, dispute_id ASC
      LIMIT ?
    `),
    summary: db.prepare(`
      SELECT kind, dispute_status, SUM(delta) AS total_delta, COUNT(1) AS count
      FROM world_civic_reputation_records
      WHERE subject_account_id = ?
      GROUP BY kind, dispute_status
    `),
    count: db.prepare('SELECT COUNT(1) AS count FROM world_civic_reputation_records'),
    disputeCount: db.prepare('SELECT COUNT(1) AS count FROM world_civic_reputation_disputes')
  };
}

function auditIdempotencyKey(record) {
  return `idem_${record.recordId.replace(/^reputation_/, 'rep_').slice(0, 80)}`;
}

function createReputationAuditEntry(record, nowMs) {
  return {
    schemaVersion: record.schemaVersion,
    entryId: record.auditLedgerEntryId,
    actor: {
      kind: 'human',
      accountId: record.awardedByAccountId
    },
    actionType: 'reputation.recorded',
    objectRef: record.recordId,
    idempotencyKey: auditIdempotencyKey(record),
    beforeHash: sha256(`agent-town.v6.civic.reputation.absent:${record.recordId}`),
    afterHash: sha256(stableJson(record)),
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

function disputeAuditIdempotencyKey(dispute) {
  return `idem_${dispute.disputeId.replace(/^repdispute_/, 'repdispute_').slice(0, 80)}`;
}

function createReputationDisputeAuditEntry(dispute, nowMs) {
  return {
    schemaVersion: dispute.schemaVersion,
    entryId: `audit_${dispute.disputeId.replace(/^repdispute_/, 'repdispute_')}`,
    actor: {
      kind: 'human',
      accountId: dispute.disputedBy.accountId
    },
    actionType: dispute.status === 'opened' ? 'reputation.disputed' : 'reputation.reviewed',
    objectRef: dispute.disputeId,
    idempotencyKey: disputeAuditIdempotencyKey(dispute),
    beforeHash: sha256(`agent-town.v6.civic.reputation.dispute.absent:${dispute.disputeId}`),
    afterHash: sha256(stableJson(dispute)),
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

function verifyDisputeModerationDecision({ dispute, record, moderationStore, requireModerationDecision }) {
  if (!moderationStore || typeof moderationStore.getDecision !== 'function') {
    return;
  }
  if (!dispute.moderationDecisionId) {
    if (requireModerationDecision === true) {
      const err = new Error('CIVIC_REPUTATION_DISPUTE_MODERATION_DECISION_REQUIRED');
      err.details = { disputeId: dispute.disputeId, recordId: dispute.recordId };
      throw err;
    }
    return;
  }
  const decision = moderationStore.getDecision(dispute.moderationDecisionId);
  if (!decision) {
    const err = new Error('CIVIC_REPUTATION_DISPUTE_MODERATION_DECISION_REQUIRED');
    err.details = {
      disputeId: dispute.disputeId,
      recordId: dispute.recordId,
      moderationDecisionId: dispute.moderationDecisionId
    };
    throw err;
  }
  if (decision.subjectRef !== record.sourceRef) {
    const err = new Error('CIVIC_REPUTATION_DISPUTE_MODERATION_DECISION_MISMATCH');
    err.details = {
      disputeId: dispute.disputeId,
      recordId: dispute.recordId,
      moderationDecisionId: dispute.moderationDecisionId,
      expectedSubjectRef: record.sourceRef,
      receivedSubjectRef: decision.subjectRef
    };
    throw err;
  }
}

function createCivicReputationStore({
  sqlitePath,
  auditLedger = null,
  auditSqlitePath = '',
  moderationStore = null,
  requireModerationDecisionForDisputes = false
}) {
  if (!sqlitePath || typeof sqlitePath !== 'string') {
    throw new Error('CIVIC_REPUTATION_SQLITE_PATH_REQUIRED');
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

  function recordReputation(rawRecord = {}, { nowMs = Date.now() } = {}) {
    const validation = validateReputationRecord(rawRecord);
    if (!validation.ok) {
      const err = new Error('CIVIC_REPUTATION_INVALID');
      err.details = { errors: validation.errors };
      throw err;
    }
    const record = validation.value;
    const normalizedJson = stableJson(record);

    const existingById = parseReputationRow(statements.byRecordId.get(record.recordId));
    if (existingById) {
      if (stableJson(existingById.record) !== normalizedJson) {
        const err = new Error('CIVIC_REPUTATION_ID_CONFLICT');
        err.details = { recordId: record.recordId };
        throw err;
      }
      return { ...existingById, duplicate: true };
    }

    const existingBySource = parseReputationRow(statements.bySubjectAwarderSourceKind.get(
      record.subjectAccountId,
      record.awardedByAccountId,
      record.sourceRef,
      record.kind
    ));
    if (existingBySource) {
      const err = new Error('CIVIC_REPUTATION_SOURCE_CONFLICT');
      err.details = {
        subjectAccountId: record.subjectAccountId,
        awardedByAccountId: record.awardedByAccountId,
        sourceRef: record.sourceRef,
        kind: record.kind,
        existingRecordId: existingBySource.recordId
      };
      throw err;
    }

    const auditRow = ledger.append(createReputationAuditEntry(record, nowMs));
    statements.insert.run(
      record.recordId,
      record.subjectAccountId,
      record.awardedByAccountId,
      record.kind,
      record.delta,
      record.sourceRef,
      record.disputeStatus,
      auditRow.entry.entryId,
      nowMs,
      normalizedJson
    );
    return parseReputationRow(statements.byRecordId.get(record.recordId));
  }

  function getRecord(recordId = '') {
    return parseReputationRow(statements.byRecordId.get(String(recordId || '')));
  }

  function recordDispute(rawDispute = {}, { nowMs = Date.now() } = {}) {
    const validation = validateReputationDispute(rawDispute);
    if (!validation.ok) {
      const err = new Error('CIVIC_REPUTATION_DISPUTE_INVALID');
      err.details = { errors: validation.errors };
      throw err;
    }
    const dispute = validation.value;
    const normalizedJson = stableJson(dispute);

    const existingById = parseDisputeRow(statements.byDisputeId.get(dispute.disputeId));
    if (existingById) {
      if (stableJson(existingById.dispute) !== normalizedJson) {
        const err = new Error('CIVIC_REPUTATION_DISPUTE_ID_CONFLICT');
        err.details = { disputeId: dispute.disputeId };
        throw err;
      }
      return { ...existingById, duplicate: true };
    }

    const record = getRecord(dispute.recordId);
    if (!record) {
      const err = new Error('CIVIC_REPUTATION_DISPUTE_RECORD_REQUIRED');
      err.details = { recordId: dispute.recordId };
      throw err;
    }
    if (record.subjectAccountId !== dispute.subjectAccountId) {
      const err = new Error('CIVIC_REPUTATION_DISPUTE_RECORD_MISMATCH');
      err.details = {
        recordId: dispute.recordId,
        subjectAccountId: dispute.subjectAccountId
      };
      throw err;
    }
    verifyDisputeModerationDecision({
      dispute,
      record,
      moderationStore,
      requireModerationDecision: requireModerationDecisionForDisputes
    });

    const existingByRecordDisputer = parseDisputeRow(statements.byRecordDisputer.get(
      dispute.recordId,
      dispute.disputedBy.accountId
    ));
    if (existingByRecordDisputer) {
      const err = new Error('CIVIC_REPUTATION_DISPUTE_SOURCE_CONFLICT');
      err.details = {
        recordId: dispute.recordId,
        disputedByAccountId: dispute.disputedBy.accountId,
        existingDisputeId: existingByRecordDisputer.disputeId
      };
      throw err;
    }

    const auditRow = ledger.append(createReputationDisputeAuditEntry(dispute, nowMs));
    statements.insertDispute.run(
      dispute.disputeId,
      dispute.recordId,
      dispute.subjectAccountId,
      dispute.disputedBy.accountId,
      dispute.status,
      dispute.reviewerKind,
      dispute.moderationDecisionId,
      auditRow.entry.entryId,
      nowMs,
      normalizedJson
    );
    return parseDisputeRow(statements.byDisputeId.get(dispute.disputeId));
  }

  function getDispute(disputeId = '') {
    return parseDisputeRow(statements.byDisputeId.get(String(disputeId || '')));
  }

  function listRecords({ subjectAccountId = '', kind = '', disputeStatus = '', limit = 100 } = {}) {
    const safeLimit = Number.isInteger(Number(limit)) ? Math.max(1, Math.min(500, Number(limit))) : 100;
    return statements.list.all(
      String(subjectAccountId || ''),
      String(subjectAccountId || ''),
      String(kind || ''),
      String(kind || ''),
      String(disputeStatus || ''),
      String(disputeStatus || ''),
      safeLimit
    ).map(parseReputationRow);
  }

  function listDisputes({ recordId = '', subjectAccountId = '', status = '', disputedByAccountId = '', limit = 100 } = {}) {
    const safeLimit = Number.isInteger(Number(limit)) ? Math.max(1, Math.min(500, Number(limit))) : 100;
    return statements.listDisputes.all(
      String(recordId || ''),
      String(recordId || ''),
      String(subjectAccountId || ''),
      String(subjectAccountId || ''),
      String(status || ''),
      String(status || ''),
      String(disputedByAccountId || ''),
      String(disputedByAccountId || ''),
      safeLimit
    ).map(parseDisputeRow);
  }

  function summarizeSubjectReputation(subjectAccountId = '') {
    const rows = statements.summary.all(String(subjectAccountId || ''));
    const disputes = listDisputes({ subjectAccountId, limit: 500 });
    const byKind = {};
    let totalScore = 0;
    let openDisputeCount = 0;
    let recordCount = 0;
    let disputeReviewCount = disputes.length;
    let openDisputeReviewCount = 0;
    for (const row of rows) {
      const kind = String(row.kind || '');
      const totalDelta = Number(row.total_delta || 0);
      const count = Number(row.count || 0);
      if (!byKind[kind]) byKind[kind] = { score: 0, recordCount: 0, openDisputeCount: 0 };
      byKind[kind].score += totalDelta;
      byKind[kind].recordCount += count;
      totalScore += totalDelta;
      recordCount += count;
      if (row.dispute_status === 'open') {
        byKind[kind].openDisputeCount += count;
        openDisputeCount += count;
      }
    }
    for (const dispute of disputes) {
      if (dispute.status === 'opened' || dispute.status === 'under_review') openDisputeReviewCount += 1;
    }
    return {
      subjectAccountId: String(subjectAccountId || ''),
      totalScore,
      recordCount,
      openDisputeCount,
      disputeReviewCount,
      openDisputeReviewCount,
      latestDisputeId: disputes[disputes.length - 1]?.disputeId || '',
      byKind,
      transferable: false,
      executionStatus: 'not_executable'
    };
  }

  function count() {
    return Number(statements.count.get().count || 0);
  }

  function disputeCount() {
    return Number(statements.disputeCount.get().count || 0);
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
    disputeCount,
    getDispute,
    getRecord,
    getSchemaMetadata,
    listDisputes,
    listRecords,
    migrationVersion: schemaMetadata.migrationVersion,
    recordReputation,
    recordDispute,
    sqlitePath,
    summarizeSubjectReputation
  };
}

module.exports = {
  createCivicReputationStore
};
