const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const { createCivicAuditLedger, sha256, stableJson } = require('./audit_ledger');
const { validateCivicDelegation } = require('./schemas');
const {
  ensureCivicSqliteSchemaMetadata,
  readCivicSqliteSchemaMetadata
} = require('./sqlite_schema');

const DELEGATION_STATUS_ACTIVE = 'active';
const DELEGATION_STATUS_REVOKED = 'revoked';
const MIGRATION_VERSION = 'v1';
const STORE_KEY = 'delegations';
const CIVIC_ID_RE = /^[a-z][a-z0-9_:-]{5,96}$/;
const DELEGATION_SCOPES = new Set(['proposal_drafting', 'vote_advice', 'civic_execution']);
const SECRET_TEXT_RE = /\b(?:sk-[a-z0-9_-]{8,}|bearer\s+[a-z0-9._-]{8,}|oauth[-_ ]?token|api[-_ ]?key|private[-_ ]?key|secret)\b/i;
const FORBIDDEN_USAGE_KEYS = new Set([
  'brain',
  'credential',
  'debugtrace',
  'idtoken',
  'oauth',
  'password',
  'privatekey',
  'providercredential',
  'secret',
  'token',
  'transcript',
  'walletsecret'
]);

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

function parseUsageRow(row) {
  if (!row) return null;
  return {
    usageId: row.usage_id,
    delegationId: row.delegation_id,
    principalAccountId: row.principal_account_id,
    delegateAgentId: row.delegate_agent_id,
    scope: row.scope,
    actionRef: row.action_ref,
    idempotencyKey: row.idempotency_key,
    auditEntryId: row.audit_entry_id,
    createdAtMs: Number(row.created_at),
    usage: JSON.parse(row.usage_json)
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
    CREATE TABLE IF NOT EXISTS world_civic_delegation_action_uses (
      usage_id TEXT PRIMARY KEY,
      delegation_id TEXT NOT NULL,
      principal_account_id TEXT NOT NULL,
      delegate_agent_id TEXT NOT NULL,
      scope TEXT NOT NULL,
      action_ref TEXT NOT NULL,
      idempotency_key TEXT NOT NULL,
      audit_entry_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      usage_json TEXT NOT NULL,
      UNIQUE(delegation_id, idempotency_key)
    );
    CREATE INDEX IF NOT EXISTS idx_world_civic_delegation_uses_delegation
      ON world_civic_delegation_action_uses(delegation_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_world_civic_delegation_uses_principal
      ON world_civic_delegation_action_uses(principal_account_id, scope, created_at);
    CREATE INDEX IF NOT EXISTS idx_world_civic_delegation_uses_agent
      ON world_civic_delegation_action_uses(delegate_agent_id, scope, created_at);
  `);
  return ensureCivicSqliteSchemaMetadata(db, {
    storeKey: STORE_KEY,
    migrationVersion: MIGRATION_VERSION,
    modulePath: 'server/world_civilization/delegations.js'
  });
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
    byUsageId: db.prepare(`
      SELECT *
      FROM world_civic_delegation_action_uses
      WHERE usage_id = ?
      LIMIT 1
    `),
    byDelegationIdempotency: db.prepare(`
      SELECT *
      FROM world_civic_delegation_action_uses
      WHERE delegation_id = ? AND idempotency_key = ?
      LIMIT 1
    `),
    insertUsage: db.prepare(`
      INSERT INTO world_civic_delegation_action_uses (
        usage_id, delegation_id, principal_account_id, delegate_agent_id,
        scope, action_ref, idempotency_key, audit_entry_id, created_at,
        usage_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `),
    listUsages: db.prepare(`
      SELECT *
      FROM world_civic_delegation_action_uses
      WHERE (? = '' OR delegation_id = ?)
        AND (? = '' OR principal_account_id = ?)
        AND (? = '' OR delegate_agent_id = ?)
        AND (? = '' OR scope = ?)
      ORDER BY created_at ASC, usage_id ASC
      LIMIT ?
    `),
    countUsageByDelegation: db.prepare(`
      SELECT COUNT(1) AS count
      FROM world_civic_delegation_action_uses
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

function normalizedKey(key = '') {
  return String(key || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function findPrivateUsageData(value, path = 'usage', found = []) {
  if (value === null || value === undefined) return found;
  if (Array.isArray(value)) {
    value.forEach((entry, index) => findPrivateUsageData(entry, `${path}[${index}]`, found));
    return found;
  }
  if (typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      const normalized = normalizedKey(key);
      if (FORBIDDEN_USAGE_KEYS.has(normalized) || normalized.endsWith('token') || normalized.endsWith('secret')) {
        found.push(`${path}.${key}`);
      }
      findPrivateUsageData(child, `${path}.${key}`, found);
    }
    return found;
  }
  if (typeof value === 'string' && SECRET_TEXT_RE.test(value)) found.push(path);
  return found;
}

function validateUsageString(errors, raw, key, { pattern = CIVIC_ID_RE } = {}) {
  const text = typeof raw?.[key] === 'string' ? raw[key].trim().slice(0, 96) : '';
  if (!text) {
    errors.push(`${key} required`);
    return '';
  }
  if (pattern && !pattern.test(text)) errors.push(`${key} invalid`);
  return text;
}

function normalizeDelegatedActionUsage(raw = {}) {
  const errors = [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, errors: ['delegated action usage must be object'], value: null };
  }
  const usageId = validateUsageString(errors, raw, 'usageId', { pattern: /^delegationuse_[a-z0-9_:-]{4,80}$/ });
  const delegationId = validateUsageString(errors, raw, 'delegationId', { pattern: /^delegation_[a-z0-9_:-]{4,88}$/ });
  const principalAccountId = validateUsageString(errors, raw, 'principalAccountId');
  const delegateAgentId = validateUsageString(errors, raw, 'delegateAgentId');
  const scope = typeof raw.scope === 'string' ? raw.scope.trim().slice(0, 80) : '';
  if (!DELEGATION_SCOPES.has(scope)) errors.push('scope unsupported');
  const actionRef = validateUsageString(errors, raw, 'actionRef');
  const idempotencyKey = validateUsageString(errors, raw, 'idempotencyKey');
  const privatePaths = findPrivateUsageData(raw);
  if (privatePaths.length) errors.push(`private data forbidden: ${privatePaths.join(', ')}`);
  return {
    ok: errors.length === 0,
    errors,
    value: errors.length ? null : {
      usageId,
      delegationId,
      principalAccountId,
      delegateAgentId,
      scope,
      actionRef,
      idempotencyKey
    }
  };
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

function createDelegationActionConsumedAuditEntry({ usage, delegation, consumedBefore, consumedAfter, nowMs }) {
  return {
    schemaVersion: delegation.delegation.schemaVersion,
    entryId: safeAuditId(usage.usageId),
    actor: {
      kind: 'agent',
      accountId: usage.principalAccountId,
      agentId: usage.delegateAgentId
    },
    actionType: 'delegation.action_consumed',
    objectRef: usage.usageId,
    idempotencyKey: usage.idempotencyKey,
    beforeHash: sha256(stableJson({
      delegationId: usage.delegationId,
      consumedActionCount: consumedBefore,
      maxActions: delegation.maxActions
    })),
    afterHash: sha256(stableJson({ usage, consumedActionCount: consumedAfter, maxActions: delegation.maxActions })),
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

  function getUsageCountForDelegation(delegationId = '') {
    return Number(statements.countUsageByDelegation.get(String(delegationId || '')).count || 0);
  }

  function consumeDelegatedAction(rawUsage = {}, { nowMs = Date.now() } = {}) {
    const validation = normalizeDelegatedActionUsage(rawUsage);
    if (!validation.ok) {
      const err = new Error('CIVIC_DELEGATION_USAGE_INVALID');
      err.details = { errors: validation.errors };
      throw err;
    }
    const usage = validation.value;
    const normalizedJson = stableJson(usage);
    const existingByKey = parseUsageRow(
      statements.byDelegationIdempotency.get(usage.delegationId, usage.idempotencyKey)
    );
    if (existingByKey) {
      if (stableJson(existingByKey.usage) !== normalizedJson) {
        const err = new Error('CIVIC_DELEGATION_USAGE_IDEMPOTENCY_CONFLICT');
        err.details = {
          delegationId: usage.delegationId,
          idempotencyKey: usage.idempotencyKey,
          existingUsageId: existingByKey.usageId
        };
        throw err;
      }
      return { ...existingByKey, duplicate: true };
    }

    const existingById = parseUsageRow(statements.byUsageId.get(usage.usageId));
    if (existingById) {
      const err = new Error('CIVIC_DELEGATION_USAGE_ID_CONFLICT');
      err.details = { usageId: usage.usageId };
      throw err;
    }

    const delegation = getDelegation(usage.delegationId);
    if (!delegation) {
      const err = new Error('CIVIC_DELEGATION_USAGE_DELEGATION_REQUIRED');
      err.details = { delegationId: usage.delegationId };
      throw err;
    }
    if (delegation.principalAccountId !== usage.principalAccountId) {
      const err = new Error('CIVIC_DELEGATION_USAGE_PRINCIPAL_MISMATCH');
      err.details = { delegationId: usage.delegationId, principalAccountId: usage.principalAccountId };
      throw err;
    }
    if (delegation.delegateAgentId !== usage.delegateAgentId) {
      const err = new Error('CIVIC_DELEGATION_USAGE_AGENT_MISMATCH');
      err.details = { delegationId: usage.delegationId, delegateAgentId: usage.delegateAgentId };
      throw err;
    }
    if (delegation.scope !== usage.scope) {
      const err = new Error('CIVIC_DELEGATION_USAGE_SCOPE_MISMATCH');
      err.details = { delegationId: usage.delegationId, expected: delegation.scope, received: usage.scope };
      throw err;
    }
    if (delegation.status !== DELEGATION_STATUS_ACTIVE) {
      const err = new Error('CIVIC_DELEGATION_USAGE_INACTIVE');
      err.details = { delegationId: usage.delegationId, status: delegation.status };
      throw err;
    }
    if (delegation.expiresAtMs <= nowMs) {
      const err = new Error('CIVIC_DELEGATION_USAGE_EXPIRED');
      err.details = { delegationId: usage.delegationId, expiresAtMs: delegation.expiresAtMs, nowMs };
      throw err;
    }
    const consumedBefore = getUsageCountForDelegation(usage.delegationId);
    if (consumedBefore >= delegation.maxActions) {
      const err = new Error('CIVIC_DELEGATION_ACTION_BUDGET_EXHAUSTED');
      err.details = { delegationId: usage.delegationId, maxActions: delegation.maxActions, consumedActionCount: consumedBefore };
      throw err;
    }
    const consumedAfter = consumedBefore + 1;
    const auditRow = ledger.append(createDelegationActionConsumedAuditEntry({
      usage,
      delegation,
      consumedBefore,
      consumedAfter,
      nowMs
    }));
    statements.insertUsage.run(
      usage.usageId,
      usage.delegationId,
      usage.principalAccountId,
      usage.delegateAgentId,
      usage.scope,
      usage.actionRef,
      usage.idempotencyKey,
      auditRow.entry.entryId,
      nowMs,
      normalizedJson
    );
    return parseUsageRow(statements.byUsageId.get(usage.usageId));
  }

  function listDelegatedActionUses({
    delegationId = '',
    principalAccountId = '',
    delegateAgentId = '',
    scope = '',
    limit = 100
  } = {}) {
    const safeLimit = Number.isInteger(Number(limit)) ? Math.max(1, Math.min(500, Number(limit))) : 100;
    return statements.listUsages.all(
      String(delegationId || ''),
      String(delegationId || ''),
      String(principalAccountId || ''),
      String(principalAccountId || ''),
      String(delegateAgentId || ''),
      String(delegateAgentId || ''),
      String(scope || ''),
      String(scope || ''),
      safeLimit
    ).map(parseUsageRow);
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
        const consumedActionCount = getUsageCountForDelegation(row.delegationId);
        const remainingActions = Math.max(0, row.maxActions - consumedActionCount);
        activeDelegationIds.push(row.delegationId);
        if (remainingActions > 0) {
          allowedScopes.push(row.scope);
          remainingActionBudgetByScope[row.scope] = (remainingActionBudgetByScope[row.scope] || 0) + remainingActions;
        }
        if (remainingActions > 0 && row.scope === 'civic_execution' && row.canExecuteCivicEffects) {
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
    let consumedActionCount = 0;
    const remainingActionBudgetByScope = {};
    for (const row of rows) {
      const rowConsumedActionCount = getUsageCountForDelegation(row.delegationId);
      consumedActionCount += rowConsumedActionCount;
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
        remainingActionBudgetByScope[row.scope] = (remainingActionBudgetByScope[row.scope] || 0)
          + Math.max(0, row.maxActions - rowConsumedActionCount);
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
      consumedActionCount,
      remainingActionBudgetByScope,
      byScope,
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
    consumeDelegatedAction,
    getAgentParticipationPolicy,
    getDelegation,
    getSchemaMetadata,
    listDelegatedActionUses,
    listDelegations,
    migrationVersion: schemaMetadata.migrationVersion,
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
