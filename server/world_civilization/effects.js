const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const { V6_WORLD_FEATURE_FLAG, isWorldGridFeatureEnabled } = require('../world_grid/feature_flags');
const { createCivicAuditLedger, sha256, stableJson } = require('./audit_ledger');
const {
  buildV6CivicGovernancePreflight,
  throwV6CivicGovernancePreflightError
} = require('./governance_preflight');
const { CIVIC_ACTION_EFFECT_HANDLERS } = require('./schemas');
const {
  ensureCivicSqliteSchemaMetadata,
  readCivicSqliteSchemaMetadata
} = require('./sqlite_schema');

const V6_CIVIC_EFFECT_EXECUTION_GATE_VERSION = 'agent-town.v6.civic.effect_execution_gate.v1';
const EFFECT_STATUS_PREPARED = 'prepared';
const ROLLBACK_STATUS_AVAILABLE = 'available';
const MIGRATION_VERSION = 'v1';
const STORE_KEY = 'effects';
const REQUIRED_EFFECT_EXECUTION_CHECKS = [
  'feature_flag',
  'research_opt_in',
  'execution_evidence',
  'typed_apply_handlers',
  'typed_rollback_handlers',
  'no_runtime_execution',
  'no_player_visible_execution',
  'no_world_mutation'
];
const REQUIRED_EFFECT_EXECUTION_EVIDENCE_CHECKS = [
  'real_before_after_state',
  'authorization_enforced',
  'idempotent_apply_rollback',
  'irreversible_action_review',
  'conservation_tests',
  'applied_and_rollback_audit',
  'worker_route_security'
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeList(value) {
  return Array.isArray(value) ? value.map((entry) => String(entry || '')).filter(Boolean) : [];
}

function check(key, ok, error = '') {
  return { key, ok: ok === true, error: ok === true ? '' : error };
}

function requiredApplyHandlers() {
  return Object.values(CIVIC_ACTION_EFFECT_HANDLERS);
}

function requiredRollbackHandlers() {
  return requiredApplyHandlers().map((handlerName) => (
    handlerName.endsWith('.apply')
      ? handlerName.replace(/\.apply$/, '.rollback')
      : `${handlerName}.rollback`
  ));
}

function inspectEffectExecutionEvidence(evidence = {}) {
  const checks = normalizeList(evidence.checks);
  const applyHandlers = normalizeList(evidence.applyHandlers);
  const rollbackHandlers = normalizeList(evidence.rollbackHandlers);
  const missingChecks = REQUIRED_EFFECT_EXECUTION_EVIDENCE_CHECKS.filter((entry) => !checks.includes(entry));
  const missingApplyHandlers = requiredApplyHandlers().filter((entry) => !applyHandlers.includes(entry));
  const missingRollbackHandlers = requiredRollbackHandlers().filter((entry) => !rollbackHandlers.includes(entry));
  const ok = evidence.status === 'complete'
    && evidence.executionStatus === 'not_executable'
    && evidence.runtimeExposed === false
    && evidence.playerVisible === false
    && evidence.appliesWorldState === false
    && missingChecks.length === 0
    && missingApplyHandlers.length === 0
    && missingRollbackHandlers.length === 0;
  return {
    ok,
    status: String(evidence.status || 'missing'),
    executionStatus: String(evidence.executionStatus || 'missing'),
    runtimeExposed: evidence.runtimeExposed === true,
    playerVisible: evidence.playerVisible === true,
    appliesWorldState: evidence.appliesWorldState === true,
    requiredChecks: [...REQUIRED_EFFECT_EXECUTION_EVIDENCE_CHECKS],
    checks,
    missingChecks,
    requiredApplyHandlers: requiredApplyHandlers(),
    applyHandlers,
    missingApplyHandlers,
    requiredRollbackHandlers: requiredRollbackHandlers(),
    rollbackHandlers,
    missingRollbackHandlers
  };
}

function disabledExecutionGateReport({ source, reason }) {
  return {
    version: V6_CIVIC_EFFECT_EXECUTION_GATE_VERSION,
    status: 'research_only',
    source,
    featureFlag: V6_WORLD_FEATURE_FLAG,
    available: false,
    researchReady: false,
    releaseReady: false,
    failClosed: true,
    runtimeExposed: false,
    playerVisible: false,
    normalGameplayExposure: false,
    appliesWorldState: false,
    executionStatus: 'not_executable',
    evidence: inspectEffectExecutionEvidence({}),
    checks: [],
    errors: [reason],
    disabledReason: reason
  };
}

function buildV6CivicEffectExecutionGate({
  featureFlags = {},
  includeResearchExecutionGate = false,
  source = 'runtime',
  evidence = {}
} = {}) {
  const enabled = includeResearchExecutionGate === true
    && isWorldGridFeatureEnabled(featureFlags, V6_WORLD_FEATURE_FLAG);
  if (!enabled) {
    return disabledExecutionGateReport({
      source,
      reason: 'V6 civic effect execution gate requires explicit research opt-in and V6 feature flag'
    });
  }

  const evidenceReport = inspectEffectExecutionEvidence(evidence);
  const checks = [
    check('feature_flag', isWorldGridFeatureEnabled(featureFlags, V6_WORLD_FEATURE_FLAG), 'FEATURE_DISABLED'),
    check('research_opt_in', includeResearchExecutionGate === true, 'RESEARCH_OPT_IN_REQUIRED'),
    check('execution_evidence', evidenceReport.status === 'complete' && evidenceReport.missingChecks.length === 0, 'EFFECT_EXECUTION_EVIDENCE_REQUIRED'),
    check('typed_apply_handlers', evidenceReport.missingApplyHandlers.length === 0, 'EFFECT_APPLY_HANDLER_EVIDENCE_REQUIRED'),
    check('typed_rollback_handlers', evidenceReport.missingRollbackHandlers.length === 0, 'EFFECT_ROLLBACK_HANDLER_EVIDENCE_REQUIRED'),
    check('no_runtime_execution', evidenceReport.executionStatus === 'not_executable' && evidenceReport.runtimeExposed === false, 'EFFECT_RUNTIME_EXECUTION_FORBIDDEN'),
    check('no_player_visible_execution', evidenceReport.playerVisible === false, 'EFFECT_PLAYER_VISIBLE_EXECUTION_FORBIDDEN'),
    check('no_world_mutation', evidenceReport.appliesWorldState === false, 'EFFECT_WORLD_MUTATION_FORBIDDEN')
  ];
  const researchReady = checks.every((entry) => entry.ok);

  return {
    version: V6_CIVIC_EFFECT_EXECUTION_GATE_VERSION,
    status: 'research_only',
    source,
    featureFlag: V6_WORLD_FEATURE_FLAG,
    available: true,
    researchReady,
    releaseReady: false,
    failClosed: researchReady !== true,
    runtimeExposed: false,
    playerVisible: false,
    normalGameplayExposure: false,
    appliesWorldState: false,
    executionStatus: 'not_executable',
    evidence: evidenceReport,
    checks,
    errors: checks.filter((entry) => !entry.ok).map((entry) => entry.error)
  };
}

function assertV6CivicEffectExecutionGateSafe(report = {}) {
  const errors = [];
  if (report.version !== V6_CIVIC_EFFECT_EXECUTION_GATE_VERSION) {
    errors.push('V6_CIVIC_EFFECT_EXECUTION_GATE_VERSION_REQUIRED');
  }
  if (report.featureFlag !== V6_WORLD_FEATURE_FLAG) {
    errors.push('V6_CIVIC_EFFECT_EXECUTION_GATE_FEATURE_FLAG_REQUIRED');
  }
  if (report.status !== 'research_only') {
    errors.push('V6_CIVIC_EFFECT_EXECUTION_RESEARCH_ONLY_REQUIRED');
  }
  if (report.runtimeExposed !== false) {
    errors.push('V6_CIVIC_EFFECT_EXECUTION_RUNTIME_HIDDEN_REQUIRED');
  }
  if (report.playerVisible !== false) {
    errors.push('V6_CIVIC_EFFECT_EXECUTION_PLAYER_HIDDEN_REQUIRED');
  }
  if (report.normalGameplayExposure !== false) {
    errors.push('V6_CIVIC_EFFECT_EXECUTION_NORMAL_GAMEPLAY_FORBIDDEN');
  }
  if (report.appliesWorldState !== false) {
    errors.push('V6_CIVIC_EFFECT_EXECUTION_WORLD_MUTATION_FORBIDDEN');
  }
  if (report.executionStatus !== 'not_executable') {
    errors.push('V6_CIVIC_EFFECT_EXECUTION_NON_EXECUTING_REQUIRED');
  }
  if (report.releaseReady !== false) {
    errors.push('V6_CIVIC_EFFECT_EXECUTION_RELEASE_READY_FORBIDDEN');
  }
  if (report.available === true) {
    const checkKeys = new Set((report.checks || []).map((entry) => entry.key));
    for (const key of REQUIRED_EFFECT_EXECUTION_CHECKS) {
      if (!checkKeys.has(key)) errors.push(`V6_CIVIC_EFFECT_EXECUTION_CHECK_REQUIRED:${key}`);
    }
    const failedChecks = (report.checks || []).filter((entry) => entry.ok !== true);
    if (report.researchReady === true && failedChecks.length > 0) {
      errors.push('V6_CIVIC_EFFECT_EXECUTION_READY_WITH_FAILED_CHECKS');
    }
    if (report.researchReady !== true && report.failClosed !== true) {
      errors.push('V6_CIVIC_EFFECT_EXECUTION_DENIAL_FAIL_CLOSED_REQUIRED');
    }
    const evidence = report.evidence || {};
    if (evidence.runtimeExposed === true) {
      errors.push('V6_CIVIC_EFFECT_EXECUTION_EVIDENCE_RUNTIME_HIDDEN_REQUIRED');
    }
    if (evidence.playerVisible === true) {
      errors.push('V6_CIVIC_EFFECT_EXECUTION_EVIDENCE_PLAYER_HIDDEN_REQUIRED');
    }
    if (evidence.appliesWorldState === true) {
      errors.push('V6_CIVIC_EFFECT_EXECUTION_EVIDENCE_WORLD_MUTATION_FORBIDDEN');
    }
    if (report.researchReady === true && evidence.ok !== true) {
      errors.push('V6_CIVIC_EFFECT_EXECUTION_READY_WITHOUT_EVIDENCE');
    }
  } else if (report.failClosed !== true) {
    errors.push('V6_CIVIC_EFFECT_EXECUTION_DISABLED_FAIL_CLOSED_REQUIRED');
  }
  return {
    ok: errors.length === 0,
    errors
  };
}

function parseEffectRow(row) {
  if (!row) return null;
  return {
    actionId: row.action_id,
    proposalId: row.proposal_id,
    effectType: row.effect_type,
    handlerName: row.handler_name,
    authorityKind: row.authority_kind,
    authorityReceiptId: row.authority_receipt_id,
    rollbackId: row.rollback_id,
    idempotencyKey: row.idempotency_key,
    status: row.status,
    auditEntryId: row.audit_entry_id,
    createdAtMs: Number(row.created_at),
    action: JSON.parse(row.action_json),
    rollbackPlan: JSON.parse(row.rollback_plan_json)
  };
}

function parseRollbackRow(row) {
  if (!row) return null;
  return {
    rollbackId: row.rollback_id,
    actionId: row.action_id,
    proposalId: row.proposal_id,
    planId: row.plan_id,
    status: row.status,
    maxRollbackMs: Number(row.max_rollback_ms),
    createdAtMs: Number(row.created_at),
    rollbackPlan: JSON.parse(row.rollback_plan_json)
  };
}

function ensureSchema(db) {
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = NORMAL;');
  db.exec('PRAGMA busy_timeout = 5000;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS world_civic_effect_actions (
      action_id TEXT PRIMARY KEY,
      proposal_id TEXT NOT NULL,
      effect_type TEXT NOT NULL,
      handler_name TEXT NOT NULL,
      authority_kind TEXT NOT NULL,
      authority_receipt_id TEXT NOT NULL,
      rollback_id TEXT NOT NULL UNIQUE,
      idempotency_key TEXT NOT NULL,
      status TEXT NOT NULL,
      audit_entry_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      action_json TEXT NOT NULL,
      rollback_plan_json TEXT NOT NULL,
      UNIQUE(proposal_id, idempotency_key)
    );
    CREATE TABLE IF NOT EXISTS world_civic_rollback_records (
      rollback_id TEXT PRIMARY KEY,
      action_id TEXT NOT NULL UNIQUE,
      proposal_id TEXT NOT NULL,
      plan_id TEXT NOT NULL,
      status TEXT NOT NULL,
      max_rollback_ms INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      rollback_plan_json TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_world_civic_effects_proposal_status
      ON world_civic_effect_actions(proposal_id, status, created_at);
    CREATE INDEX IF NOT EXISTS idx_world_civic_effects_type_created
      ON world_civic_effect_actions(effect_type, created_at);
    CREATE INDEX IF NOT EXISTS idx_world_civic_rollbacks_proposal_status
      ON world_civic_rollback_records(proposal_id, status, created_at);
  `);
  return ensureCivicSqliteSchemaMetadata(db, {
    storeKey: STORE_KEY,
    migrationVersion: MIGRATION_VERSION,
    modulePath: 'server/world_civilization/effects.js'
  });
}

function buildStatements(db) {
  return {
    byActionId: db.prepare(`
      SELECT *
      FROM world_civic_effect_actions
      WHERE action_id = ?
      LIMIT 1
    `),
    byProposalIdempotency: db.prepare(`
      SELECT *
      FROM world_civic_effect_actions
      WHERE proposal_id = ? AND idempotency_key = ?
      LIMIT 1
    `),
    insertAction: db.prepare(`
      INSERT INTO world_civic_effect_actions (
        action_id, proposal_id, effect_type, handler_name, authority_kind,
        authority_receipt_id, rollback_id, idempotency_key, status,
        audit_entry_id, created_at, action_json, rollback_plan_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `),
    insertRollback: db.prepare(`
      INSERT INTO world_civic_rollback_records (
        rollback_id, action_id, proposal_id, plan_id, status,
        max_rollback_ms, created_at, rollback_plan_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `),
    byRollbackId: db.prepare(`
      SELECT *
      FROM world_civic_rollback_records
      WHERE rollback_id = ?
      LIMIT 1
    `),
    listActions: db.prepare(`
      SELECT *
      FROM world_civic_effect_actions
      WHERE (? = '' OR proposal_id = ?)
        AND (? = '' OR status = ?)
        AND (? = '' OR effect_type = ?)
      ORDER BY created_at ASC, action_id ASC
      LIMIT ?
    `),
    listRollbacks: db.prepare(`
      SELECT *
      FROM world_civic_rollback_records
      WHERE (? = '' OR action_id = ?)
        AND (? = '' OR status = ?)
      ORDER BY created_at ASC, rollback_id ASC
      LIMIT ?
    `),
    summaryActions: db.prepare(`
      SELECT status, COUNT(1) AS count
      FROM world_civic_effect_actions
      WHERE proposal_id = ?
      GROUP BY status
    `),
    summaryLatestAction: db.prepare(`
      SELECT action_id
      FROM world_civic_effect_actions
      WHERE proposal_id = ?
      ORDER BY created_at DESC, action_id DESC
      LIMIT 1
    `),
    summaryRollbackCount: db.prepare(`
      SELECT COUNT(1) AS count
      FROM world_civic_rollback_records
      WHERE proposal_id = ?
    `),
    count: db.prepare('SELECT COUNT(1) AS count FROM world_civic_effect_actions')
  };
}

function createPreparedEffectAuditEntry({ action, rollbackPlan, actor, nowMs }) {
  return {
    schemaVersion: action.schemaVersion,
    entryId: action.auditLedgerEntryId,
    actor,
    actionType: 'civic_action.prepared',
    objectRef: action.actionId,
    idempotencyKey: action.idempotencyKey,
    beforeHash: sha256(`agent-town.v6.civic.effect.absent:${action.actionId}`),
    afterHash: sha256(stableJson({ action, rollbackPlan, status: EFFECT_STATUS_PREPARED })),
    createdAtMs: nowMs,
    migrationVersion: MIGRATION_VERSION,
    replayable: true,
    rollbackId: action.rollbackId,
    privacy: {
      redacted: true,
      privateDataIncluded: false,
      dataClasses: ['public_audit_summary']
    }
  };
}

function createCivicEffectStore({
  sqlitePath,
  proposalStore,
  voteStore,
  moderationStore,
  auditLedger = null,
  auditSqlitePath = ''
}) {
  if (!sqlitePath || typeof sqlitePath !== 'string') {
    throw new Error('CIVIC_EFFECT_SQLITE_PATH_REQUIRED');
  }
  if (!proposalStore || typeof proposalStore.getProposal !== 'function') {
    throw new Error('CIVIC_EFFECT_PROPOSAL_STORE_REQUIRED');
  }
  if (!voteStore || typeof voteStore.summarizeProposalVotes !== 'function') {
    throw new Error('CIVIC_EFFECT_VOTE_STORE_REQUIRED');
  }
  if (!moderationStore || typeof moderationStore.listDecisions !== 'function') {
    throw new Error('CIVIC_EFFECT_MODERATION_STORE_REQUIRED');
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

  function prepareEffect(rawAction = {}, rawRollbackPlan = {}, { nowMs = Date.now() } = {}) {
    const preflight = buildV6CivicGovernancePreflight({
      rawAction,
      rawRollbackPlan,
      proposalStore,
      voteStore,
      moderationStore,
      nowMs
    });
    throwV6CivicGovernancePreflightError(preflight);
    const action = preflight.action;
    const rollbackPlan = preflight.rollbackPlan;
    const approvingVote = preflight.approvingVote;
    const normalizedRecord = stableJson({ action, rollbackPlan });

    const existingByIdempotency = parseEffectRow(
      statements.byProposalIdempotency.get(action.proposalId, action.idempotencyKey)
    );
    if (existingByIdempotency) {
      if (stableJson({ action: existingByIdempotency.action, rollbackPlan: existingByIdempotency.rollbackPlan }) !== normalizedRecord) {
        const err = new Error('CIVIC_EFFECT_IDEMPOTENCY_CONFLICT');
        err.details = {
          proposalId: action.proposalId,
          idempotencyKey: action.idempotencyKey,
          existingActionId: existingByIdempotency.actionId
        };
        throw err;
      }
      return { ...existingByIdempotency, duplicate: true };
    }

    const existingByActionId = parseEffectRow(statements.byActionId.get(action.actionId));
    if (existingByActionId) {
      const err = new Error('CIVIC_EFFECT_ID_CONFLICT');
      err.details = { actionId: action.actionId };
      throw err;
    }
    const existingRollback = parseRollbackRow(statements.byRollbackId.get(action.rollbackId));
    if (existingRollback) {
      const err = new Error('CIVIC_EFFECT_ROLLBACK_ID_CONFLICT');
      err.details = { rollbackId: action.rollbackId, existingActionId: existingRollback.actionId };
      throw err;
    }

    const auditRow = ledger.append(createPreparedEffectAuditEntry({
      action,
      rollbackPlan,
      actor: approvingVote.vote.voter,
      nowMs
    }));
    statements.insertAction.run(
      action.actionId,
      action.proposalId,
      action.effectType,
      action.handlerName,
      action.executionAuthority.kind,
      action.executionAuthority.receiptId,
      action.rollbackId,
      action.idempotencyKey,
      EFFECT_STATUS_PREPARED,
      auditRow.entry.entryId,
      nowMs,
      stableJson(action),
      stableJson(rollbackPlan)
    );
    statements.insertRollback.run(
      action.rollbackId,
      action.actionId,
      action.proposalId,
      rollbackPlan.planId,
      ROLLBACK_STATUS_AVAILABLE,
      rollbackPlan.maxRollbackMs,
      nowMs,
      stableJson(rollbackPlan)
    );
    return parseEffectRow(statements.byActionId.get(action.actionId));
  }

  function getAction(actionId = '') {
    return parseEffectRow(statements.byActionId.get(String(actionId || '')));
  }

  function getRollback(rollbackId = '') {
    return parseRollbackRow(statements.byRollbackId.get(String(rollbackId || '')));
  }

  function listActions({ proposalId = '', status = '', effectType = '', limit = 100 } = {}) {
    const safeLimit = Number.isInteger(Number(limit)) ? Math.max(1, Math.min(500, Number(limit))) : 100;
    return statements.listActions.all(
      String(proposalId || ''),
      String(proposalId || ''),
      String(status || ''),
      String(status || ''),
      String(effectType || ''),
      String(effectType || ''),
      safeLimit
    ).map(parseEffectRow);
  }

  function listRollbacks({ actionId = '', status = '', limit = 100 } = {}) {
    const safeLimit = Number.isInteger(Number(limit)) ? Math.max(1, Math.min(500, Number(limit))) : 100;
    return statements.listRollbacks.all(
      String(actionId || ''),
      String(actionId || ''),
      String(status || ''),
      String(status || ''),
      safeLimit
    ).map(parseRollbackRow);
  }

  function summarizeProposalEffects(proposalId = '') {
    const statusRows = statements.summaryActions.all(String(proposalId || ''));
    const byStatus = {};
    let actionCount = 0;
    for (const row of statusRows) {
      const status = String(row.status || '');
      const count = Number(row.count || 0);
      byStatus[status] = count;
      actionCount += count;
    }
    return {
      proposalId: String(proposalId || ''),
      actionCount,
      rollbackCount: Number(statements.summaryRollbackCount.get(String(proposalId || '')).count || 0),
      byStatus,
      latestActionId: statements.summaryLatestAction.get(String(proposalId || ''))?.action_id || '',
      appliesWorldState: false,
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
    getAction,
    getRollback,
    getSchemaMetadata,
    listActions,
    listRollbacks,
    migrationVersion: schemaMetadata.migrationVersion,
    prepareEffect,
    sqlitePath,
    summarizeProposalEffects
  };
}

module.exports = {
  EFFECT_STATUS_PREPARED,
  REQUIRED_EFFECT_EXECUTION_CHECKS: [...REQUIRED_EFFECT_EXECUTION_CHECKS],
  REQUIRED_EFFECT_EXECUTION_EVIDENCE_CHECKS: [...REQUIRED_EFFECT_EXECUTION_EVIDENCE_CHECKS],
  ROLLBACK_STATUS_AVAILABLE,
  V6_CIVIC_EFFECT_EXECUTION_GATE_VERSION,
  assertV6CivicEffectExecutionGateSafe,
  buildV6CivicEffectExecutionGate,
  createCivicEffectStore
};
