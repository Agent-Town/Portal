const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const { createCivicAuditLedger, sha256, stableJson } = require('./audit_ledger');
const { validateCivicProposal, validateModerationDecision } = require('./schemas');
const {
  ensureCivicSqliteSchemaMetadata,
  readCivicSqliteSchemaMetadata
} = require('./sqlite_schema');

const PROPOSAL_STATUS_DRAFTED = 'drafted';
const PROPOSAL_STATUS_READY_FOR_VOTE = 'ready_for_vote';
const PROPOSAL_STATUS_REJECTED = 'rejected';
const MODERATION_STATUS_NEEDS_REVIEW = 'needs_review';
const MODERATION_STATUS_APPROVED = 'approved';
const MODERATION_STATUS_REJECTED = 'rejected';
const MIGRATION_VERSION = 'v1';
const STORE_KEY = 'proposals';

function parseProposalRow(row) {
  if (!row) return null;
  return {
    proposalId: row.proposal_id,
    proposerAccountId: row.proposer_account_id,
    proposerKind: row.proposer_kind,
    proposerAgentId: row.proposer_agent_id || '',
    scopeKind: row.scope_kind,
    scopeTargetId: row.scope_target_id,
    status: row.status,
    moderationStatus: row.moderation_status,
    idempotencyKey: row.idempotency_key,
    expiresAtMs: Number(row.expires_at),
    createdAtMs: Number(row.created_at),
    updatedAtMs: Number(row.updated_at),
    auditEntryId: row.audit_entry_id,
    proposal: JSON.parse(row.proposal_json)
  };
}

function ensureSchema(db) {
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = NORMAL;');
  db.exec('PRAGMA busy_timeout = 5000;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS world_civic_proposals (
      proposal_id TEXT PRIMARY KEY,
      proposer_account_id TEXT NOT NULL,
      proposer_kind TEXT NOT NULL,
      proposer_agent_id TEXT NOT NULL,
      scope_kind TEXT NOT NULL,
      scope_target_id TEXT NOT NULL,
      status TEXT NOT NULL,
      moderation_status TEXT NOT NULL,
      idempotency_key TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      audit_entry_id TEXT NOT NULL,
      proposal_json TEXT NOT NULL,
      UNIQUE(proposer_account_id, idempotency_key)
    );
    CREATE INDEX IF NOT EXISTS idx_world_civic_proposals_proposer_status
      ON world_civic_proposals(proposer_account_id, status, created_at);
    CREATE INDEX IF NOT EXISTS idx_world_civic_proposals_scope_status
      ON world_civic_proposals(scope_kind, scope_target_id, status, created_at);
    CREATE INDEX IF NOT EXISTS idx_world_civic_proposals_moderation_status
      ON world_civic_proposals(moderation_status, created_at);
  `);
  return ensureCivicSqliteSchemaMetadata(db, {
    storeKey: STORE_KEY,
    migrationVersion: MIGRATION_VERSION,
    modulePath: 'server/world_civilization/proposals.js'
  });
}

function buildStatements(db) {
  return {
    byProposalId: db.prepare(`
      SELECT *
      FROM world_civic_proposals
      WHERE proposal_id = ?
      LIMIT 1
    `),
    byProposerIdempotency: db.prepare(`
      SELECT *
      FROM world_civic_proposals
      WHERE proposer_account_id = ? AND idempotency_key = ?
      LIMIT 1
    `),
    insert: db.prepare(`
      INSERT INTO world_civic_proposals (
        proposal_id, proposer_account_id, proposer_kind, proposer_agent_id,
        scope_kind, scope_target_id, status, moderation_status,
        idempotency_key, expires_at, created_at, updated_at,
        audit_entry_id, proposal_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `),
    updateReview: db.prepare(`
      UPDATE world_civic_proposals
      SET status = ?, moderation_status = ?, updated_at = ?
      WHERE proposal_id = ?
    `),
    list: db.prepare(`
      SELECT *
      FROM world_civic_proposals
      WHERE (? = '' OR proposer_account_id = ?)
        AND (? = '' OR status = ?)
        AND (? = '' OR moderation_status = ?)
      ORDER BY created_at ASC, proposal_id ASC
      LIMIT ?
    `),
    count: db.prepare('SELECT COUNT(1) AS count FROM world_civic_proposals')
  };
}

function createProposalAuditEntry(proposal, nowMs) {
  const scopeRef = `${proposal.scope.kind}:${proposal.scope.targetId}`;
  return {
    schemaVersion: proposal.schemaVersion,
    entryId: `audit_${proposal.proposalId.replace(/^proposal_/, 'proposal_')}`,
    actor: proposal.proposer,
    actionType: 'proposal.created',
    objectRef: proposal.proposalId,
    idempotencyKey: proposal.idempotencyKey,
    beforeHash: sha256('agent-town.v6.civic.proposal.absent'),
    afterHash: sha256(stableJson(proposal)),
    beforeSummary: `No civic proposal existed for ${proposal.proposalId} in ${scopeRef}.`,
    afterSummary: `Drafted ${proposal.proposalId} for ${scopeRef} with preview-only ${proposal.effectPreview.effectType}; moderation status is needs_review.`,
    createdAtMs: nowMs,
    migrationVersion: MIGRATION_VERSION,
    replayable: true,
    rollbackId: '',
    privacy: proposal.privacy
  };
}

function normalizeModerationDecision(rawDecision = {}) {
  const decision = rawDecision.decision && typeof rawDecision.decision === 'object'
    ? rawDecision.decision
    : rawDecision;
  const validation = validateModerationDecision(decision);
  if (!validation.ok) {
    const err = new Error('CIVIC_PROPOSAL_REVIEW_MODERATION_DECISION_INVALID');
    err.details = { errors: validation.errors };
    throw err;
  }
  const normalized = validation.value;
  return {
    decisionId: normalized.decisionId,
    subjectRef: normalized.subjectRef,
    surface: normalized.surface,
    status: normalized.status,
    policyVersion: normalized.policyVersion,
    reviewerKind: normalized.reviewerKind,
    decision: normalized
  };
}

function reviewTransitionFor(decisionStatus = '') {
  if (decisionStatus === MODERATION_STATUS_APPROVED) {
    return {
      proposalStatus: PROPOSAL_STATUS_READY_FOR_VOTE,
      moderationStatus: MODERATION_STATUS_APPROVED
    };
  }
  if (decisionStatus === MODERATION_STATUS_REJECTED) {
    return {
      proposalStatus: PROPOSAL_STATUS_REJECTED,
      moderationStatus: MODERATION_STATUS_REJECTED
    };
  }
  return null;
}

function auditActorForReview(decision = {}) {
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

function createProposalReviewAuditEntry({ before, after, decision, nowMs }) {
  const scopeRef = `${before.scopeKind}:${before.scopeTargetId}`;
  return {
    schemaVersion: before.proposal.schemaVersion,
    entryId: `audit_proprev_${decision.decisionId}`.slice(0, 94),
    actor: auditActorForReview(decision),
    actionType: 'proposal.reviewed',
    objectRef: before.proposalId,
    idempotencyKey: `idem_proposal_review_${decision.decisionId}`.slice(0, 96),
    beforeHash: sha256(stableJson({
      proposalId: before.proposalId,
      status: before.status,
      moderationStatus: before.moderationStatus,
      updatedAtMs: before.updatedAtMs
    })),
    afterHash: sha256(stableJson({
      proposalId: before.proposalId,
      status: after.proposalStatus,
      moderationStatus: after.moderationStatus,
      decisionId: decision.decisionId,
      policyVersion: decision.policyVersion
    })),
    beforeSummary: `Proposal ${before.proposalId} in ${scopeRef} was ${before.status}/${before.moderationStatus} before moderation decision ${decision.decisionId}.`,
    afterSummary: `Proposal ${before.proposalId} moved to ${after.proposalStatus}/${after.moderationStatus} under ${decision.policyVersion}; no civic effect was applied.`,
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

function createCivicProposalStore({ sqlitePath, auditLedger = null, auditSqlitePath = '' }) {
  if (!sqlitePath || typeof sqlitePath !== 'string') {
    throw new Error('CIVIC_PROPOSAL_SQLITE_PATH_REQUIRED');
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

  function draftProposal(rawProposal = {}, { nowMs = Date.now() } = {}) {
    const validation = validateCivicProposal(rawProposal);
    if (!validation.ok) {
      const err = new Error('CIVIC_PROPOSAL_INVALID');
      err.details = { errors: validation.errors };
      throw err;
    }
    const proposal = validation.value;
    const normalizedJson = stableJson(proposal);
    if (proposal.expiresAtMs <= nowMs) {
      const err = new Error('CIVIC_PROPOSAL_EXPIRED');
      err.details = { proposalId: proposal.proposalId, expiresAtMs: proposal.expiresAtMs, nowMs };
      throw err;
    }

    const existingByIdempotency = parseProposalRow(
      statements.byProposerIdempotency.get(proposal.proposer.accountId, proposal.idempotencyKey)
    );
    if (existingByIdempotency) {
      if (stableJson(existingByIdempotency.proposal) !== normalizedJson) {
        const err = new Error('CIVIC_PROPOSAL_IDEMPOTENCY_CONFLICT');
        err.details = {
          proposerAccountId: proposal.proposer.accountId,
          idempotencyKey: proposal.idempotencyKey,
          existingProposalId: existingByIdempotency.proposalId
        };
        throw err;
      }
      return { ...existingByIdempotency, duplicate: true };
    }

    const existingById = parseProposalRow(statements.byProposalId.get(proposal.proposalId));
    if (existingById) {
      const err = new Error('CIVIC_PROPOSAL_ID_CONFLICT');
      err.details = { proposalId: proposal.proposalId };
      throw err;
    }

    const auditRow = ledger.append(createProposalAuditEntry(proposal, nowMs));
    statements.insert.run(
      proposal.proposalId,
      proposal.proposer.accountId,
      proposal.proposer.kind,
      proposal.proposer.agentId || '',
      proposal.scope.kind,
      proposal.scope.targetId,
      PROPOSAL_STATUS_DRAFTED,
      MODERATION_STATUS_NEEDS_REVIEW,
      proposal.idempotencyKey,
      proposal.expiresAtMs,
      nowMs,
      nowMs,
      auditRow.entry.entryId,
      normalizedJson
    );
    return parseProposalRow(statements.byProposalId.get(proposal.proposalId));
  }

  function getProposal(proposalId = '') {
    return parseProposalRow(statements.byProposalId.get(String(proposalId || '')));
  }

  function recordProposalReview(rawDecision = {}, { nowMs = Date.now() } = {}) {
    const decision = normalizeModerationDecision(rawDecision);
    const transition = reviewTransitionFor(decision.status);
    if (!transition) {
      const err = new Error('CIVIC_PROPOSAL_REVIEW_STATUS_UNSUPPORTED');
      err.details = { decisionId: decision.decisionId, status: decision.status };
      throw err;
    }
    const proposal = getProposal(decision.subjectRef);
    if (!proposal) {
      const err = new Error('CIVIC_PROPOSAL_REVIEW_PROPOSAL_REQUIRED');
      err.details = { proposalId: decision.subjectRef, decisionId: decision.decisionId };
      throw err;
    }
    if (proposal.expiresAtMs <= nowMs) {
      const err = new Error('CIVIC_PROPOSAL_REVIEW_EXPIRED');
      err.details = { proposalId: proposal.proposalId, expiresAtMs: proposal.expiresAtMs, nowMs };
      throw err;
    }
    if (decision.surface !== proposal.proposal.moderationClass) {
      const err = new Error('CIVIC_PROPOSAL_REVIEW_SURFACE_MISMATCH');
      err.details = {
        proposalId: proposal.proposalId,
        expected: proposal.proposal.moderationClass,
        received: decision.surface
      };
      throw err;
    }
    const auditEntry = createProposalReviewAuditEntry({
      before: proposal,
      after: transition,
      decision,
      nowMs
    });
    const existingAudit = ledger.getByEntryId(auditEntry.entryId);
    if (existingAudit) {
      return { ...getProposal(proposal.proposalId), duplicate: true };
    }
    if (proposal.status !== PROPOSAL_STATUS_DRAFTED) {
      if (
        proposal.status === transition.proposalStatus
        && proposal.moderationStatus === transition.moderationStatus
      ) {
        return { ...proposal, duplicate: true };
      }
      const err = new Error('CIVIC_PROPOSAL_REVIEW_STATE_CONFLICT');
      err.details = {
        proposalId: proposal.proposalId,
        status: proposal.status,
        moderationStatus: proposal.moderationStatus
      };
      throw err;
    }

    const auditRow = ledger.append(auditEntry);
    statements.updateReview.run(
      transition.proposalStatus,
      transition.moderationStatus,
      nowMs,
      proposal.proposalId
    );
    return {
      ...getProposal(proposal.proposalId),
      reviewAuditEntryId: auditRow.entry.entryId
    };
  }

  function listProposals({ proposerAccountId = '', status = '', moderationStatus = '', limit = 100 } = {}) {
    const safeLimit = Number.isInteger(Number(limit)) ? Math.max(1, Math.min(250, Number(limit))) : 100;
    return statements.list.all(
      String(proposerAccountId || ''),
      String(proposerAccountId || ''),
      String(status || ''),
      String(status || ''),
      String(moderationStatus || ''),
      String(moderationStatus || ''),
      safeLimit
    ).map(parseProposalRow);
  }

  function previewProposalEffect(proposalId = '') {
    const row = getProposal(proposalId);
    if (!row) return null;
    return {
      proposalId: row.proposalId,
      status: row.status,
      moderationStatus: row.moderationStatus,
      effectPreview: JSON.parse(JSON.stringify(row.proposal.effectPreview)),
      affectedPublicState: [...row.proposal.affectedPublicState]
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
    draftProposal,
    getProposal,
    getSchemaMetadata,
    listProposals,
    migrationVersion: schemaMetadata.migrationVersion,
    previewProposalEffect,
    recordProposalReview,
    sqlitePath
  };
}

module.exports = {
  MODERATION_STATUS_APPROVED,
  MODERATION_STATUS_NEEDS_REVIEW,
  MODERATION_STATUS_REJECTED,
  PROPOSAL_STATUS_DRAFTED,
  PROPOSAL_STATUS_READY_FOR_VOTE,
  PROPOSAL_STATUS_REJECTED,
  createCivicProposalStore
};
