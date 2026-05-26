const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const { createCivicAuditLedger, sha256, stableJson } = require('./audit_ledger');
const { validateCivicAction, validateRollbackPlan } = require('./schemas');

const EFFECT_STATUS_PREPARED = 'prepared';
const ROLLBACK_STATUS_AVAILABLE = 'available';
const MIGRATION_VERSION = 'v1';

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

function matchingVoteForReceipt(voteStore, proposalId, receiptId) {
  if (!voteStore || typeof voteStore.listVotes !== 'function') return null;
  return voteStore
    .listVotes({ proposalId, limit: 500 })
    .find((vote) => vote.receiptId === receiptId && vote.choice === 'approve') || null;
}

function approvedModerationForProposal(moderationStore, proposal) {
  if (!moderationStore || typeof moderationStore.listDecisions !== 'function') return null;
  return moderationStore
    .listDecisions({
      subjectRef: proposal.proposalId,
      surface: proposal.proposal.moderationClass,
      status: 'approved',
      limit: 1
    })[0] || null;
}

function validateEffectPrerequisites({ action, proposal, voteStore, moderationStore, nowMs }) {
  if (!proposal) {
    const err = new Error('CIVIC_EFFECT_PROPOSAL_REQUIRED');
    err.details = { proposalId: action.proposalId };
    throw err;
  }
  if (proposal.expiresAtMs <= nowMs) {
    const err = new Error('CIVIC_EFFECT_PROPOSAL_EXPIRED');
    err.details = { proposalId: action.proposalId, expiresAtMs: proposal.expiresAtMs, nowMs };
    throw err;
  }
  if (proposal.proposal.effectPreview.effectType !== action.effectType) {
    const err = new Error('CIVIC_EFFECT_TYPE_MISMATCH');
    err.details = {
      proposalId: action.proposalId,
      expected: proposal.proposal.effectPreview.effectType,
      received: action.effectType
    };
    throw err;
  }

  const moderation = approvedModerationForProposal(moderationStore, proposal);
  if (!moderation) {
    const err = new Error('CIVIC_EFFECT_MODERATION_REQUIRED');
    err.details = { proposalId: action.proposalId };
    throw err;
  }

  const voteSummary = voteStore?.summarizeProposalVotes?.(action.proposalId);
  if (!voteSummary || voteSummary.counts.approve <= voteSummary.counts.reject || voteSummary.counts.approve < 1) {
    const err = new Error('CIVIC_EFFECT_APPROVAL_REQUIRED');
    err.details = { proposalId: action.proposalId, counts: voteSummary?.counts || null };
    throw err;
  }
  if (action.executionAuthority.kind === 'delegated') {
    const err = new Error('CIVIC_EFFECT_DELEGATION_UNSUPPORTED');
    err.details = { proposalId: action.proposalId };
    throw err;
  }
  const approvingVote = matchingVoteForReceipt(voteStore, action.proposalId, action.executionAuthority.receiptId);
  if (!approvingVote) {
    const err = new Error('CIVIC_EFFECT_APPROVAL_RECEIPT_REQUIRED');
    err.details = { proposalId: action.proposalId, receiptId: action.executionAuthority.receiptId };
    throw err;
  }
  return { approvingVote, moderation };
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
  ensureSchema(db);
  const statements = buildStatements(db);
  const ownsLedger = !auditLedger;
  const ledger = auditLedger || createCivicAuditLedger({ sqlitePath: auditSqlitePath || sqlitePath });
  let closed = false;

  function prepareEffect(rawAction = {}, rawRollbackPlan = {}, { nowMs = Date.now() } = {}) {
    const actionValidation = validateCivicAction(rawAction);
    if (!actionValidation.ok) {
      const err = new Error('CIVIC_EFFECT_ACTION_INVALID');
      err.details = { errors: actionValidation.errors };
      throw err;
    }
    const rollbackValidation = validateRollbackPlan(rawRollbackPlan);
    if (!rollbackValidation.ok) {
      const err = new Error('CIVIC_EFFECT_ROLLBACK_INVALID');
      err.details = { errors: rollbackValidation.errors };
      throw err;
    }

    const action = actionValidation.value;
    const rollbackPlan = rollbackValidation.value;
    const normalizedRecord = stableJson({ action, rollbackPlan });
    const proposal = proposalStore.getProposal(action.proposalId);
    if (proposal && rollbackPlan.planId !== proposal.proposal.rollbackPlan.planId) {
      const err = new Error('CIVIC_EFFECT_ROLLBACK_PLAN_MISMATCH');
      err.details = {
        proposalId: action.proposalId,
        expected: proposal.proposal.rollbackPlan.planId,
        received: rollbackPlan.planId
      };
      throw err;
    }
    const { approvingVote } = validateEffectPrerequisites({
      action,
      proposal,
      voteStore,
      moderationStore,
      nowMs
    });

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
    listActions,
    listRollbacks,
    prepareEffect,
    sqlitePath,
    summarizeProposalEffects
  };
}

module.exports = {
  EFFECT_STATUS_PREPARED,
  ROLLBACK_STATUS_AVAILABLE,
  createCivicEffectStore
};
