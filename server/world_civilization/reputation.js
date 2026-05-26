const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const { createCivicAuditLedger, sha256, stableJson } = require('./audit_ledger');
const { validateReputationRecord } = require('./schemas');

const MIGRATION_VERSION = 'v1';

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
  `);
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
    summary: db.prepare(`
      SELECT kind, dispute_status, SUM(delta) AS total_delta, COUNT(1) AS count
      FROM world_civic_reputation_records
      WHERE subject_account_id = ?
      GROUP BY kind, dispute_status
    `),
    count: db.prepare('SELECT COUNT(1) AS count FROM world_civic_reputation_records')
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

function createCivicReputationStore({ sqlitePath, auditLedger = null, auditSqlitePath = '' }) {
  if (!sqlitePath || typeof sqlitePath !== 'string') {
    throw new Error('CIVIC_REPUTATION_SQLITE_PATH_REQUIRED');
  }
  fs.mkdirSync(path.dirname(sqlitePath), { recursive: true });
  const db = new DatabaseSync(sqlitePath);
  ensureSchema(db);
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

  function summarizeSubjectReputation(subjectAccountId = '') {
    const rows = statements.summary.all(String(subjectAccountId || ''));
    const byKind = {};
    let totalScore = 0;
    let openDisputeCount = 0;
    let recordCount = 0;
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
    return {
      subjectAccountId: String(subjectAccountId || ''),
      totalScore,
      recordCount,
      openDisputeCount,
      byKind,
      transferable: false,
      executionStatus: 'not_executable'
    };
  }

  function count() {
    return Number(statements.count.get().count || 0);
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
    getRecord,
    listRecords,
    recordReputation,
    sqlitePath,
    summarizeSubjectReputation
  };
}

module.exports = {
  createCivicReputationStore
};
