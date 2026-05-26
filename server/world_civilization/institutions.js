const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const { createCivicAuditLedger, sha256, stableJson } = require('./audit_ledger');
const { validateCivicInstitution } = require('./schemas');
const {
  ensureCivicSqliteSchemaMetadata,
  readCivicSqliteSchemaMetadata
} = require('./sqlite_schema');

const INSTITUTION_STATUS_CHARTERED = 'chartered';
const MIGRATION_VERSION = 'v1';
const STORE_KEY = 'institutions';

function parseInstitutionRow(row) {
  if (!row) return null;
  return {
    institutionId: row.institution_id,
    charterId: row.charter_id,
    charteredByAccountId: row.chartered_by_account_id,
    displayName: row.display_name,
    scopeKind: row.scope_kind,
    scopeTargetId: row.scope_target_id,
    moderationPolicyId: row.moderation_policy_id,
    votingRuleId: row.voting_rule_id,
    membershipRuleId: row.membership_rule_id,
    eligibilityRuleId: row.eligibility_rule_id,
    status: row.status,
    auditEntryId: row.audit_entry_id,
    effectiveAtMs: Number(row.effective_at),
    createdAtMs: Number(row.created_at),
    updatedAtMs: Number(row.updated_at),
    institution: JSON.parse(row.institution_json)
  };
}

function ensureSchema(db) {
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = NORMAL;');
  db.exec('PRAGMA busy_timeout = 5000;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS world_civic_institutions (
      institution_id TEXT PRIMARY KEY,
      charter_id TEXT NOT NULL,
      chartered_by_account_id TEXT NOT NULL,
      display_name TEXT NOT NULL,
      scope_kind TEXT NOT NULL,
      scope_target_id TEXT NOT NULL,
      moderation_policy_id TEXT NOT NULL,
      voting_rule_id TEXT NOT NULL,
      membership_rule_id TEXT NOT NULL,
      eligibility_rule_id TEXT NOT NULL,
      status TEXT NOT NULL,
      audit_entry_id TEXT NOT NULL,
      effective_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      institution_json TEXT NOT NULL,
      UNIQUE(scope_kind, scope_target_id, charter_id)
    );
    CREATE INDEX IF NOT EXISTS idx_world_civic_institutions_scope_status
      ON world_civic_institutions(scope_kind, scope_target_id, status, created_at);
    CREATE INDEX IF NOT EXISTS idx_world_civic_institutions_policy
      ON world_civic_institutions(moderation_policy_id, voting_rule_id);
    CREATE INDEX IF NOT EXISTS idx_world_civic_institutions_chartered_by
      ON world_civic_institutions(chartered_by_account_id, created_at);
  `);
  return ensureCivicSqliteSchemaMetadata(db, {
    storeKey: STORE_KEY,
    migrationVersion: MIGRATION_VERSION,
    modulePath: 'server/world_civilization/institutions.js'
  });
}

function buildStatements(db) {
  return {
    byInstitutionId: db.prepare(`
      SELECT *
      FROM world_civic_institutions
      WHERE institution_id = ?
      LIMIT 1
    `),
    byScopeCharter: db.prepare(`
      SELECT *
      FROM world_civic_institutions
      WHERE scope_kind = ? AND scope_target_id = ? AND charter_id = ?
      LIMIT 1
    `),
    insert: db.prepare(`
      INSERT INTO world_civic_institutions (
        institution_id, charter_id, chartered_by_account_id, display_name,
        scope_kind, scope_target_id, moderation_policy_id, voting_rule_id,
        membership_rule_id, eligibility_rule_id, status, audit_entry_id,
        effective_at, created_at, updated_at, institution_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `),
    list: db.prepare(`
      SELECT *
      FROM world_civic_institutions
      WHERE (? = '' OR scope_kind = ?)
        AND (? = '' OR scope_target_id = ?)
        AND (? = '' OR status = ?)
        AND (? = '' OR chartered_by_account_id = ?)
      ORDER BY created_at ASC, institution_id ASC
      LIMIT ?
    `),
    summary: db.prepare(`
      SELECT status, scope_kind, COUNT(1) AS count
      FROM world_civic_institutions
      WHERE scope_target_id = ?
      GROUP BY status, scope_kind
    `),
    count: db.prepare('SELECT COUNT(1) AS count FROM world_civic_institutions')
  };
}

function createInstitutionAuditEntry(institution, nowMs) {
  return {
    schemaVersion: institution.schemaVersion,
    entryId: `audit_${institution.institutionId.replace(/^institution_/, 'institution_')}`,
    actor: institution.charteredBy,
    actionType: 'institution.chartered',
    objectRef: institution.institutionId,
    idempotencyKey: `idem_${institution.institutionId.replace(/^institution_/, 'inst_').slice(0, 80)}`,
    beforeHash: sha256(`agent-town.v6.civic.institution.absent:${institution.institutionId}`),
    afterHash: sha256(stableJson(institution)),
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

function createCivicInstitutionStore({ sqlitePath, auditLedger = null, auditSqlitePath = '' }) {
  if (!sqlitePath || typeof sqlitePath !== 'string') {
    throw new Error('CIVIC_INSTITUTION_SQLITE_PATH_REQUIRED');
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

  function charterInstitution(rawInstitution = {}, { nowMs = Date.now() } = {}) {
    const validation = validateCivicInstitution(rawInstitution);
    if (!validation.ok) {
      const err = new Error('CIVIC_INSTITUTION_INVALID');
      err.details = { errors: validation.errors };
      throw err;
    }
    const institution = validation.value;
    const normalizedJson = stableJson(institution);

    const existingById = parseInstitutionRow(statements.byInstitutionId.get(institution.institutionId));
    if (existingById) {
      if (stableJson(existingById.institution) !== normalizedJson) {
        const err = new Error('CIVIC_INSTITUTION_ID_CONFLICT');
        err.details = { institutionId: institution.institutionId };
        throw err;
      }
      return { ...existingById, duplicate: true };
    }

    const existingByScopeCharter = parseInstitutionRow(statements.byScopeCharter.get(
      institution.scope.kind,
      institution.scope.targetId,
      institution.charterId
    ));
    if (existingByScopeCharter) {
      const err = new Error('CIVIC_INSTITUTION_SCOPE_CHARTER_CONFLICT');
      err.details = {
        scopeKind: institution.scope.kind,
        scopeTargetId: institution.scope.targetId,
        charterId: institution.charterId,
        existingInstitutionId: existingByScopeCharter.institutionId
      };
      throw err;
    }

    const auditRow = ledger.append(createInstitutionAuditEntry(institution, nowMs));
    statements.insert.run(
      institution.institutionId,
      institution.charterId,
      institution.charteredBy.accountId,
      institution.displayName,
      institution.scope.kind,
      institution.scope.targetId,
      institution.moderationPolicyId,
      institution.votingRuleId,
      institution.membershipRuleId,
      institution.eligibilityRuleId,
      INSTITUTION_STATUS_CHARTERED,
      auditRow.entry.entryId,
      institution.effectiveAtMs,
      nowMs,
      nowMs,
      normalizedJson
    );
    return parseInstitutionRow(statements.byInstitutionId.get(institution.institutionId));
  }

  function getInstitution(institutionId = '') {
    return parseInstitutionRow(statements.byInstitutionId.get(String(institutionId || '')));
  }

  function listInstitutions({
    scopeKind = '',
    scopeTargetId = '',
    status = '',
    charteredByAccountId = '',
    limit = 100
  } = {}) {
    const safeLimit = Number.isInteger(Number(limit)) ? Math.max(1, Math.min(500, Number(limit))) : 100;
    return statements.list.all(
      String(scopeKind || ''),
      String(scopeKind || ''),
      String(scopeTargetId || ''),
      String(scopeTargetId || ''),
      String(status || ''),
      String(status || ''),
      String(charteredByAccountId || ''),
      String(charteredByAccountId || ''),
      safeLimit
    ).map(parseInstitutionRow);
  }

  function summarizeScopeInstitutions(scopeTargetId = '') {
    const rows = statements.summary.all(String(scopeTargetId || ''));
    const byScope = {};
    let institutionCount = 0;
    for (const row of rows) {
      const scopeKind = String(row.scope_kind || '');
      const status = String(row.status || '');
      const count = Number(row.count || 0);
      if (!byScope[scopeKind]) byScope[scopeKind] = {};
      byScope[scopeKind][status] = count;
      institutionCount += count;
    }
    return {
      scopeTargetId: String(scopeTargetId || ''),
      institutionCount,
      byScope,
      playerVisible: false,
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
    charterInstitution,
    close,
    count,
    getInstitution,
    getSchemaMetadata,
    listInstitutions,
    migrationVersion: schemaMetadata.migrationVersion,
    sqlitePath,
    summarizeScopeInstitutions
  };
}

module.exports = {
  INSTITUTION_STATUS_CHARTERED,
  createCivicInstitutionStore
};
