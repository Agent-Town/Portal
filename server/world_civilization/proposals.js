const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const { V6_WORLD_FEATURE_FLAG, isWorldGridFeatureEnabled } = require('../world_grid/feature_flags');
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
const V6_PROPOSAL_REVIEW_QUEUE_VERSION = 'agent-town.v6.proposal_review_queue.v1';
const V6_PROPOSAL_INTAKE_READINESS_GATE_VERSION = 'agent-town.v6.proposal_intake_readiness.v1';
const REQUIRED_PROPOSAL_INTAKE_READINESS_CHECKS = [
  'feature_flag',
  'research_opt_in',
  'proposal_intake_evidence',
  'route_tool_submission',
  'review_queue_integration',
  'worker_first_origin',
  'mutation_security_envelope',
  'public_text_privacy_review',
  'no_runtime_exposure',
  'no_player_visible_proposals',
  'no_effect_execution'
];
const REQUIRED_PROPOSAL_INTAKE_EVIDENCE_CHECKS = [
  'human_submission_envelope',
  'worker_tool_submission_envelope',
  'openclaw_lite_worker_origin',
  'skill_context_observability',
  'worker_traffic_observability',
  'mutation_security_envelope',
  'same_origin_csrf_session_auth',
  'idempotent_submission_replay',
  'review_queue_index',
  'review_queue_snapshot',
  'reviewed_proposal_queue_exclusion',
  'expired_proposal_queue_exclusion',
  'moderation_decision_link',
  'proposal_created_audit_rows',
  'proposal_reviewed_audit_rows',
  'public_text_rendering_review',
  'private_data_exclusion',
  'no_backend_shortcuts',
  'no_effect_execution'
];
const REQUIRED_PROPOSAL_SUBMISSION_SURFACES = [
  'human_route_submission',
  'worker_tool_submission',
  'review_queue'
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

function inspectProposalIntakeReadinessEvidence(evidence = {}) {
  const checks = normalizeList(evidence.checks);
  const submissionSurfaces = normalizeList(evidence.submissionSurfaces);
  const missingChecks = REQUIRED_PROPOSAL_INTAKE_EVIDENCE_CHECKS.filter((entry) => !checks.includes(entry));
  const missingSubmissionSurfaces = REQUIRED_PROPOSAL_SUBMISSION_SURFACES.filter((entry) => !submissionSurfaces.includes(entry));
  const routeToolSubmissionReviewed = evidence.routeToolSubmissionReviewed === true;
  const reviewQueueIntegrated = evidence.reviewQueueIntegrated === true;
  const workerFirstOriginReviewed = evidence.workerFirstOriginReviewed === true;
  const mutationSecurityEnvelopeReviewed = evidence.mutationSecurityEnvelopeReviewed === true;
  const publicTextPrivacyReviewed = evidence.publicTextPrivacyReviewed === true;
  const privateDataExcluded = evidence.privateDataExcluded === true;
  const auditRowsCovered = evidence.auditRowsCovered === true;
  const idempotencyReviewed = evidence.idempotencyReviewed === true;
  const noBackendShortcuts = evidence.noBackendShortcuts === true;
  const ok = evidence.status === 'complete'
    && evidence.executionStatus === 'not_executable'
    && evidence.runtimeExposed === false
    && evidence.playerVisible === false
    && evidence.normalGameplayExposure === false
    && evidence.mutatesWorldState === false
    && evidence.executesProposalEffects === false
    && evidence.exposesCivicTools === false
    && evidence.exposesPrivateData === false
    && routeToolSubmissionReviewed
    && reviewQueueIntegrated
    && workerFirstOriginReviewed
    && mutationSecurityEnvelopeReviewed
    && publicTextPrivacyReviewed
    && privateDataExcluded
    && auditRowsCovered
    && idempotencyReviewed
    && noBackendShortcuts
    && missingChecks.length === 0
    && missingSubmissionSurfaces.length === 0;
  return {
    ok,
    status: String(evidence.status || 'missing'),
    executionStatus: String(evidence.executionStatus || 'missing'),
    runtimeExposed: evidence.runtimeExposed === true,
    playerVisible: evidence.playerVisible === true,
    normalGameplayExposure: evidence.normalGameplayExposure === true,
    mutatesWorldState: evidence.mutatesWorldState === true,
    executesProposalEffects: evidence.executesProposalEffects === true,
    exposesCivicTools: evidence.exposesCivicTools === true,
    exposesPrivateData: evidence.exposesPrivateData === true,
    routeToolSubmissionReviewed,
    reviewQueueIntegrated,
    workerFirstOriginReviewed,
    mutationSecurityEnvelopeReviewed,
    publicTextPrivacyReviewed,
    privateDataExcluded,
    auditRowsCovered,
    idempotencyReviewed,
    noBackendShortcuts,
    requiredChecks: [...REQUIRED_PROPOSAL_INTAKE_EVIDENCE_CHECKS],
    checks,
    missingChecks,
    requiredSubmissionSurfaces: [...REQUIRED_PROPOSAL_SUBMISSION_SURFACES],
    submissionSurfaces,
    missingSubmissionSurfaces
  };
}

function disabledProposalIntakeReadinessReport({ source, reason }) {
  return {
    version: V6_PROPOSAL_INTAKE_READINESS_GATE_VERSION,
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
    mutatesWorldState: false,
    executesProposalEffects: false,
    exposesCivicTools: false,
    exposesPrivateData: false,
    executionStatus: 'not_executable',
    evidence: inspectProposalIntakeReadinessEvidence({}),
    checks: [],
    errors: [reason],
    disabledReason: reason
  };
}

function buildV6ProposalIntakeReadinessGate({
  featureFlags = {},
  includeResearchProposalIntake = false,
  source = 'runtime',
  evidence = {}
} = {}) {
  const enabled = includeResearchProposalIntake === true
    && isWorldGridFeatureEnabled(featureFlags, V6_WORLD_FEATURE_FLAG);
  if (!enabled) {
    return disabledProposalIntakeReadinessReport({
      source,
      reason: 'V6 proposal intake readiness requires explicit research opt-in and V6 feature flag'
    });
  }

  const evidenceReport = inspectProposalIntakeReadinessEvidence(evidence);
  const checks = [
    check('feature_flag', isWorldGridFeatureEnabled(featureFlags, V6_WORLD_FEATURE_FLAG), 'FEATURE_DISABLED'),
    check('research_opt_in', includeResearchProposalIntake === true, 'RESEARCH_OPT_IN_REQUIRED'),
    check(
      'proposal_intake_evidence',
      evidenceReport.status === 'complete' && evidenceReport.missingChecks.length === 0,
      'PROPOSAL_INTAKE_EVIDENCE_REQUIRED'
    ),
    check(
      'route_tool_submission',
      evidenceReport.routeToolSubmissionReviewed && evidenceReport.missingSubmissionSurfaces.length === 0,
      'PROPOSAL_ROUTE_TOOL_SUBMISSION_REQUIRED'
    ),
    check('review_queue_integration', evidenceReport.reviewQueueIntegrated, 'PROPOSAL_REVIEW_QUEUE_INTEGRATION_REQUIRED'),
    check(
      'worker_first_origin',
      evidenceReport.workerFirstOriginReviewed && evidenceReport.noBackendShortcuts,
      'PROPOSAL_WORKER_FIRST_ORIGIN_REQUIRED'
    ),
    check('mutation_security_envelope', evidenceReport.mutationSecurityEnvelopeReviewed, 'PROPOSAL_MUTATION_SECURITY_ENVELOPE_REQUIRED'),
    check(
      'public_text_privacy_review',
      evidenceReport.publicTextPrivacyReviewed
        && evidenceReport.privateDataExcluded
        && evidenceReport.exposesPrivateData === false,
      'PROPOSAL_PUBLIC_TEXT_PRIVACY_REVIEW_REQUIRED'
    ),
    check(
      'no_runtime_exposure',
      evidenceReport.executionStatus === 'not_executable'
        && evidenceReport.runtimeExposed === false
        && evidenceReport.exposesCivicTools === false,
      'PROPOSAL_RUNTIME_EXPOSURE_FORBIDDEN'
    ),
    check(
      'no_player_visible_proposals',
      evidenceReport.playerVisible === false && evidenceReport.normalGameplayExposure === false,
      'PROPOSAL_PLAYER_VISIBLE_SURFACE_FORBIDDEN'
    ),
    check(
      'no_effect_execution',
      evidenceReport.mutatesWorldState === false && evidenceReport.executesProposalEffects === false,
      'PROPOSAL_EFFECT_EXECUTION_FORBIDDEN'
    )
  ];
  const researchReady = checks.every((entry) => entry.ok);

  return {
    version: V6_PROPOSAL_INTAKE_READINESS_GATE_VERSION,
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
    mutatesWorldState: false,
    executesProposalEffects: false,
    exposesCivicTools: false,
    exposesPrivateData: false,
    executionStatus: 'not_executable',
    evidence: evidenceReport,
    checks,
    errors: checks.filter((entry) => !entry.ok).map((entry) => entry.error)
  };
}

function assertV6ProposalIntakeReadinessGateSafe(report = {}) {
  const errors = [];
  if (report.version !== V6_PROPOSAL_INTAKE_READINESS_GATE_VERSION) {
    errors.push('V6_PROPOSAL_INTAKE_READINESS_VERSION_REQUIRED');
  }
  if (report.featureFlag !== V6_WORLD_FEATURE_FLAG) {
    errors.push('V6_PROPOSAL_INTAKE_READINESS_FEATURE_FLAG_REQUIRED');
  }
  if (report.status !== 'research_only') {
    errors.push('V6_PROPOSAL_INTAKE_READINESS_RESEARCH_ONLY_REQUIRED');
  }
  if (report.runtimeExposed !== false) {
    errors.push('V6_PROPOSAL_INTAKE_READINESS_RUNTIME_HIDDEN_REQUIRED');
  }
  if (report.playerVisible !== false) {
    errors.push('V6_PROPOSAL_INTAKE_READINESS_PLAYER_HIDDEN_REQUIRED');
  }
  if (report.normalGameplayExposure !== false) {
    errors.push('V6_PROPOSAL_INTAKE_READINESS_NORMAL_GAMEPLAY_FORBIDDEN');
  }
  if (report.mutatesWorldState !== false) {
    errors.push('V6_PROPOSAL_INTAKE_READINESS_WORLD_MUTATION_FORBIDDEN');
  }
  if (report.executesProposalEffects !== false) {
    errors.push('V6_PROPOSAL_INTAKE_READINESS_EFFECT_EXECUTION_FORBIDDEN');
  }
  if (report.exposesCivicTools !== false) {
    errors.push('V6_PROPOSAL_INTAKE_READINESS_CIVIC_TOOL_EXPOSURE_FORBIDDEN');
  }
  if (report.exposesPrivateData !== false) {
    errors.push('V6_PROPOSAL_INTAKE_READINESS_PRIVATE_DATA_FORBIDDEN');
  }
  if (report.executionStatus !== 'not_executable') {
    errors.push('V6_PROPOSAL_INTAKE_READINESS_NON_EXECUTING_REQUIRED');
  }
  if (report.releaseReady !== false) {
    errors.push('V6_PROPOSAL_INTAKE_READINESS_RELEASE_READY_FORBIDDEN');
  }
  if (report.available === true) {
    const checkKeys = new Set((report.checks || []).map((entry) => entry.key));
    for (const key of REQUIRED_PROPOSAL_INTAKE_READINESS_CHECKS) {
      if (!checkKeys.has(key)) errors.push(`V6_PROPOSAL_INTAKE_READINESS_CHECK_REQUIRED:${key}`);
    }
    const failedChecks = (report.checks || []).filter((entry) => entry.ok !== true);
    if (report.researchReady === true && failedChecks.length > 0) {
      errors.push('V6_PROPOSAL_INTAKE_READINESS_READY_WITH_FAILED_CHECKS');
    }
    if (report.researchReady !== true && report.failClosed !== true) {
      errors.push('V6_PROPOSAL_INTAKE_READINESS_DENIAL_FAIL_CLOSED_REQUIRED');
    }
    const evidence = report.evidence || {};
    if (evidence.runtimeExposed === true || evidence.exposesCivicTools === true) {
      errors.push('V6_PROPOSAL_INTAKE_READINESS_EVIDENCE_RUNTIME_HIDDEN_REQUIRED');
    }
    if (evidence.playerVisible === true || evidence.normalGameplayExposure === true) {
      errors.push('V6_PROPOSAL_INTAKE_READINESS_EVIDENCE_PLAYER_HIDDEN_REQUIRED');
    }
    if (evidence.mutatesWorldState === true) {
      errors.push('V6_PROPOSAL_INTAKE_READINESS_EVIDENCE_WORLD_MUTATION_FORBIDDEN');
    }
    if (evidence.executesProposalEffects === true) {
      errors.push('V6_PROPOSAL_INTAKE_READINESS_EVIDENCE_EFFECT_EXECUTION_FORBIDDEN');
    }
    if (evidence.exposesPrivateData === true) {
      errors.push('V6_PROPOSAL_INTAKE_READINESS_EVIDENCE_PRIVATE_DATA_FORBIDDEN');
    }
    if (report.researchReady === true && evidence.ok !== true) {
      errors.push('V6_PROPOSAL_INTAKE_READINESS_READY_WITHOUT_EVIDENCE');
    }
  } else if (report.failClosed !== true) {
    errors.push('V6_PROPOSAL_INTAKE_READINESS_DISABLED_FAIL_CLOSED_REQUIRED');
  }
  return {
    ok: errors.length === 0,
    errors
  };
}

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

function buildProposalReviewQueueEntry(row, queuePosition, nowMs) {
  const proposal = parseProposalRow(row);
  if (!proposal) return null;
  return {
    queueId: `proposal_review_queue:${proposal.proposalId}`,
    queuePosition,
    proposalId: proposal.proposalId,
    proposerAccountId: proposal.proposerAccountId,
    proposerKind: proposal.proposerKind,
    proposerAgentId: proposal.proposerAgentId,
    scopeKind: proposal.scopeKind,
    scopeTargetId: proposal.scopeTargetId,
    status: proposal.status,
    moderationStatus: proposal.moderationStatus,
    reviewSurface: proposal.proposal.moderationClass,
    effectType: proposal.proposal.effectPreview.effectType,
    affectedPublicStateCount: proposal.proposal.affectedPublicState.length,
    createdAtMs: proposal.createdAtMs,
    updatedAtMs: proposal.updatedAtMs,
    expiresAtMs: proposal.expiresAtMs,
    expired: proposal.expiresAtMs <= nowMs,
    runtimeExposed: false,
    playerVisible: false,
    normalGameplayExposure: false,
    mutatesWorldState: false,
    executesProposalEffects: false,
    exposesCivicTools: false,
    exposesPrivateData: false,
    executionStatus: 'not_executable'
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
    reviewQueue: db.prepare(`
      SELECT *
      FROM world_civic_proposals
      WHERE status = ?
        AND moderation_status = ?
        AND (? = 1 OR expires_at > ?)
        AND (? = '' OR scope_kind = ?)
        AND (? = '' OR scope_target_id = ?)
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

  function getProposalReviewQueueSnapshot({
    scopeKind = '',
    scopeTargetId = '',
    limit = 100,
    nowMs = Date.now(),
    includeExpired = false
  } = {}) {
    const safeLimit = Number.isInteger(Number(limit)) ? Math.max(1, Math.min(250, Number(limit))) : 100;
    const safeNowMs = Number.isFinite(Number(nowMs)) ? Number(nowMs) : Date.now();
    const rows = statements.reviewQueue.all(
      PROPOSAL_STATUS_DRAFTED,
      MODERATION_STATUS_NEEDS_REVIEW,
      includeExpired === true ? 1 : 0,
      safeNowMs,
      String(scopeKind || ''),
      String(scopeKind || ''),
      String(scopeTargetId || ''),
      String(scopeTargetId || ''),
      safeLimit
    );
    const entries = rows
      .map((row, index) => buildProposalReviewQueueEntry(row, index + 1, safeNowMs))
      .filter(Boolean);
    return {
      version: V6_PROPOSAL_REVIEW_QUEUE_VERSION,
      status: 'research_only',
      runtimeExposed: false,
      playerVisible: false,
      normalGameplayExposure: false,
      mutatesWorldState: false,
      executesProposalEffects: false,
      exposesCivicTools: false,
      exposesPrivateData: false,
      executionStatus: 'not_executable',
      scopeKind: String(scopeKind || ''),
      scopeTargetId: String(scopeTargetId || ''),
      includeExpired: includeExpired === true,
      nowMs: safeNowMs,
      count: entries.length,
      entries
    };
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
    getProposalReviewQueueSnapshot,
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
  REQUIRED_PROPOSAL_INTAKE_EVIDENCE_CHECKS: clone(REQUIRED_PROPOSAL_INTAKE_EVIDENCE_CHECKS),
  REQUIRED_PROPOSAL_INTAKE_READINESS_CHECKS: clone(REQUIRED_PROPOSAL_INTAKE_READINESS_CHECKS),
  REQUIRED_PROPOSAL_SUBMISSION_SURFACES: clone(REQUIRED_PROPOSAL_SUBMISSION_SURFACES),
  V6_PROPOSAL_INTAKE_READINESS_GATE_VERSION,
  V6_PROPOSAL_REVIEW_QUEUE_VERSION,
  assertV6ProposalIntakeReadinessGateSafe,
  buildV6ProposalIntakeReadinessGate,
  createCivicProposalStore
};
