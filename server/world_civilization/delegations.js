const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const { createCivicAuditLedger, sha256, stableJson } = require('./audit_ledger');
const { validateCivicDelegation } = require('./schemas');

const DELEGATION_STATUS_ACTIVE = 'active';
const DELEGATION_STATUS_REVOKED = 'revoked';
const MIGRATION_VERSION = 'v1';

function parseDelegationRow(row) {
  if (!row) return null;
  return {
    delegationId: row.delegation_id,
    principalAccountId: row.principal_account_id,
    delegateAgentId: row.delegate_agent_id,
    scope: row.scope,
    expiresAtMs: Number(row.expires_at),
    maxActions: Number(row.max_actions),
    approvalReceiptId: row.approval_receipt_id,
    canExecuteCivicEffects: row.can_execute_civic_effects === 1,
    status: row.status,
    auditEntryId: row.audit_entry_id,
    createdAtMs: Number(row.created_at),
    updatedAtMs: Number(row.updated_at),
    delegation: JSON.parse(row.delegation_json)
  };
}

function ensureSchema(db) {
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = NORMAL;');
  db.exec('PRAGMA busy_timeout = 5000;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS world_civic_delegations (
      delegation_id TEXT PRIMARY KEY,
      principal_account_id TEXT NOT NULL,
      delegate_agent_id TEXT NOT NULL,
      scope TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      max_actions INTEGER NOT NULL,
      approval_receipt_id TEXT NOT NULL,
      can_execute_civic_effects INTEGER NOT NULL,
      status TEXT NOT NULL,
      audit_entry_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      delegation_json TEXT NOT NULL,
      UNIQUE(principal_account_id, approval_receipt_id)
    );
    CREATE INDEX IF NOT EXISTS idx_world_civic_delegations_principal_status
      ON world_civic_delegations(principal_account_id, status, created_at);
    CREATE INDEX IF NOT EXISTS idx_world_civic_delegations_agent_scope
      ON world_civic_delegations(delegate_agent_id, scope, status);
    CREATE INDEX IF NOT EXISTS idx_world_civic_delegations_expiry
      ON world_civic_delegations(expires_at, status);
  `);
}

function buildStatements(db) {
  return {
    byDelegationId: db.prepare(`
      SELECT *
      FROM world_civic_delegations
      WHERE delegation_id = ?
      LIMIT 1
    `),
    byPrincipalReceipt: db.prepare(`
      SELECT *
      FROM world_civic_delegations
      WHERE principal_account_id = ? AND approval_receipt_id = ?
      LIMIT 1
    `),
    insert: db.prepare(`
      INSERT INTO world_civic_delegations (
        delegation_id, principal_account_id, delegate_agent_id, scope,
        expires_at, max_actions, approval_receipt_id,
        can_execute_civic_effects, status, audit_entry_id, created_at,
        updated_at, delegation_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `),
    revoke: db.prepare(`
      UPDATE world_civic_delegations
      SET status = ?, updated_at = ?
      WHERE delegation_id = ?
    `),
    list: db.prepare(`
      SELECT *
      FROM world_civic_delegations
      WHERE (? = '' OR principal_account_id = ?)
        AND (? = '' OR delegate_agent_id = ?)
        AND (? = '' OR scope = ?)
        AND (? = '' OR status = ?)
      ORDER BY created_at ASC, delegation_id ASC
      LIMIT ?
    `),
    summary: db.prepare(`
      SELECT status, scope, can_execute_civic_effects, COUNT(1) AS count
      FROM world_civic_delegations
      WHERE principal_account_id = ?
      GROUP BY status, scope, can_execute_civic_effects
    `),
    count: db.prepare('SELECT COUNT(1) AS count FROM world_civic_delegations')
  };
}

function safeAuditId(value) {
  return `audit_${String(value || '').replace(/[^a-z0-9_:-]/g, '_').slice(0, 88)}`;
}

function delegationAuditIdempotencyKey(delegation) {
  return `idem_${delegation.approvalReceiptId.replace(/^receipt_/, 'delegation_').slice(0, 80)}`;
}

function revokeAuditIdempotencyKey(delegationId) {
  return `idem_${`${delegationId}_revoke`.slice(0, 80)}`;
}

function createDelegationAuditEntry(delegation, nowMs) {
  return {
    schemaVersion: delegation.schemaVersion,
    entryId: safeAuditId(delegation.delegationId),
    actor: {
      kind: 'human',
      accountId: delegation.principalAccountId
    },
    actionType: 'delegation.created',
    objectRef: delegation.delegationId,
    idempotencyKey: delegationAuditIdempotencyKey(delegation),
    beforeHash: sha256(`agent-town.v6.civic.delegation.absent:${delegation.delegationId}`),
    afterHash: sha256(stableJson(delegation)),
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

function createDelegationRevokedAuditEntry(row, nowMs) {
  return {
    schemaVersion: row.delegation.schemaVersion,
    entryId: safeAuditId(`${row.delegationId}_revoked`),
    actor: {
      kind: 'human',
      accountId: row.principalAccountId
    },
    actionType: 'delegation.revoked',
    objectRef: row.delegationId,
    idempotencyKey: revokeAuditIdempotencyKey(row.delegationId),
    beforeHash: sha256(stableJson({ delegation: row.delegation, status: row.status })),
    afterHash: sha256(stableJson({ delegation: row.delegation, status: DELEGATION_STATUS_REVOKED })),
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

function isActiveAt(row, atMs) {
  return row.status === DELEGATION_STATUS_ACTIVE && row.expiresAtMs > atMs;
}

function assertDelegationStorePolicy(delegation, nowMs) {
  if (delegation.expiresAtMs <= nowMs) {
    const err = new Error('CIVIC_DELEGATION_EXPIRED');
    err.details = { delegationId: delegation.delegationId, expiresAtMs: delegation.expiresAtMs, nowMs };
    throw err;
  }
  if (delegation.principalAccountId === delegation.delegateAgentId) {
    const err = new Error('CIVIC_DELEGATION_SELF_DELEGATION_UNSUPPORTED');
    err.details = { delegationId: delegation.delegationId };
    throw err;
  }
  if (delegation.scope === 'civic_execution' && delegation.canExecuteCivicEffects !== true) {
    const err = new Error('CIVIC_DELEGATION_EXECUTION_PERMISSION_REQUIRED');
    err.details = { delegationId: delegation.delegationId };
    throw err;
  }
}

function createCivicDelegationStore({ sqlitePath, auditLedger = null, auditSqlitePath = '' }) {
  if (!sqlitePath || typeof sqlitePath !== 'string') {
    throw new Error('CIVIC_DELEGATION_SQLITE_PATH_REQUIRED');
  }
  fs.mkdirSync(path.dirname(sqlitePath), { recursive: true });
  const db = new DatabaseSync(sqlitePath);
  ensureSchema(db);
  const statements = buildStatements(db);
  const ownsLedger = !auditLedger;
  const ledger = auditLedger || createCivicAuditLedger({ sqlitePath: auditSqlitePath || sqlitePath });
  let closed = false;

  function recordDelegation(rawDelegation = {}, { nowMs = Date.now() } = {}) {
    const validation = validateCivicDelegation(rawDelegation);
    if (!validation.ok) {
      const err = new Error('CIVIC_DELEGATION_INVALID');
      err.details = { errors: validation.errors };
      throw err;
    }
    const delegation = validation.value;
    assertDelegationStorePolicy(delegation, nowMs);
    const normalizedJson = stableJson(delegation);

    const existingByReceipt = parseDelegationRow(
      statements.byPrincipalReceipt.get(delegation.principalAccountId, delegation.approvalReceiptId)
    );
    if (existingByReceipt) {
      if (stableJson(existingByReceipt.delegation) !== normalizedJson) {
        const err = new Error('CIVIC_DELEGATION_RECEIPT_CONFLICT');
        err.details = {
          principalAccountId: delegation.principalAccountId,
          approvalReceiptId: delegation.approvalReceiptId,
          existingDelegationId: existingByReceipt.delegationId
        };
        throw err;
      }
      return { ...existingByReceipt, duplicate: true };
    }

    const existingById = parseDelegationRow(statements.byDelegationId.get(delegation.delegationId));
    if (existingById) {
      const err = new Error('CIVIC_DELEGATION_ID_CONFLICT');
      err.details = { delegationId: delegation.delegationId };
      throw err;
    }

    const auditRow = ledger.append(createDelegationAuditEntry(delegation, nowMs));
    statements.insert.run(
      delegation.delegationId,
      delegation.principalAccountId,
      delegation.delegateAgentId,
      delegation.scope,
      delegation.expiresAtMs,
      delegation.maxActions,
      delegation.approvalReceiptId,
      delegation.canExecuteCivicEffects ? 1 : 0,
      DELEGATION_STATUS_ACTIVE,
      auditRow.entry.entryId,
      nowMs,
      nowMs,
      normalizedJson
    );
    return parseDelegationRow(statements.byDelegationId.get(delegation.delegationId));
  }

  function getDelegation(delegationId = '') {
    return parseDelegationRow(statements.byDelegationId.get(String(delegationId || '')));
  }

  function listDelegations({
    principalAccountId = '',
    delegateAgentId = '',
    scope = '',
    status = '',
    limit = 100
  } = {}) {
    const safeLimit = Number.isInteger(Number(limit)) ? Math.max(1, Math.min(500, Number(limit))) : 100;
    return statements.list.all(
      String(principalAccountId || ''),
      String(principalAccountId || ''),
      String(delegateAgentId || ''),
      String(delegateAgentId || ''),
      String(scope || ''),
      String(scope || ''),
      String(status || ''),
      String(status || ''),
      safeLimit
    ).map(parseDelegationRow);
  }

  function revokeDelegation(delegationId = '', { principalAccountId = '', nowMs = Date.now() } = {}) {
    const existing = getDelegation(delegationId);
    if (!existing) {
      const err = new Error('CIVIC_DELEGATION_REQUIRED');
      err.details = { delegationId };
      throw err;
    }
    if (existing.principalAccountId !== String(principalAccountId || '')) {
      const err = new Error('CIVIC_DELEGATION_REVOKE_PRINCIPAL_MISMATCH');
      err.details = { delegationId, principalAccountId };
      throw err;
    }
    if (existing.status === DELEGATION_STATUS_REVOKED) {
      return { ...existing, duplicate: true };
    }
    const auditRow = ledger.append(createDelegationRevokedAuditEntry(existing, nowMs));
    statements.revoke.run(DELEGATION_STATUS_REVOKED, nowMs, existing.delegationId);
    return {
      ...getDelegation(existing.delegationId),
      revokeAuditEntryId: auditRow.entry.entryId
    };
  }

  function getAgentParticipationPolicy({
    principalAccountId = '',
    delegateAgentId = '',
    atMs = Date.now()
  } = {}) {
    const rows = listDelegations({ principalAccountId, delegateAgentId, limit: 500 });
    const allowedScopes = [];
    const activeDelegationIds = [];
    const expiredDelegationIds = [];
    const revokedDelegationIds = [];
    const remainingActionBudgetByScope = {};
    let civicExecutionAllowed = false;

    for (const row of rows) {
      if (isActiveAt(row, atMs)) {
        allowedScopes.push(row.scope);
        activeDelegationIds.push(row.delegationId);
        remainingActionBudgetByScope[row.scope] = Math.max(
          remainingActionBudgetByScope[row.scope] || 0,
          row.maxActions
        );
        if (row.scope === 'civic_execution' && row.canExecuteCivicEffects) {
          civicExecutionAllowed = true;
        }
      } else if (row.status === DELEGATION_STATUS_REVOKED) {
        revokedDelegationIds.push(row.delegationId);
      } else {
        expiredDelegationIds.push(row.delegationId);
      }
    }

    return {
      principalAccountId: String(principalAccountId || ''),
      delegateAgentId: String(delegateAgentId || ''),
      allowedScopes,
      activeDelegationIds,
      expiredDelegationIds,
      revokedDelegationIds,
      remainingActionBudgetByScope,
      civicExecutionAllowed,
      executionStatus: 'not_executable'
    };
  }

  function summarizePrincipalDelegations(principalAccountId = '', { atMs = Date.now() } = {}) {
    const rows = listDelegations({ principalAccountId, limit: 500 });
    const byScope = {};
    let activeCount = 0;
    let expiredCount = 0;
    let revokedCount = 0;
    let civicExecutionDelegationCount = 0;
    for (const row of rows) {
      if (!byScope[row.scope]) byScope[row.scope] = { active: 0, expired: 0, revoked: 0 };
      if (row.status === DELEGATION_STATUS_REVOKED) {
        revokedCount += 1;
        byScope[row.scope].revoked += 1;
      } else if (row.expiresAtMs <= atMs) {
        expiredCount += 1;
        byScope[row.scope].expired += 1;
      } else {
        activeCount += 1;
        byScope[row.scope].active += 1;
      }
      if (row.scope === 'civic_execution' && row.canExecuteCivicEffects) {
        civicExecutionDelegationCount += 1;
      }
    }
    return {
      principalAccountId: String(principalAccountId || ''),
      delegationCount: rows.length,
      activeCount,
      expiredCount,
      revokedCount,
      civicExecutionDelegationCount,
      byScope,
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
    getAgentParticipationPolicy,
    getDelegation,
    listDelegations,
    recordDelegation,
    revokeDelegation,
    sqlitePath,
    summarizePrincipalDelegations
  };
}

module.exports = {
  DELEGATION_STATUS_ACTIVE,
  DELEGATION_STATUS_REVOKED,
  createCivicDelegationStore
};
