const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const { V6_WORLD_FEATURE_FLAG, isWorldGridFeatureEnabled } = require('../world_grid/feature_flags');
const { createCivicAuditLedger, sha256, stableJson } = require('./audit_ledger');
const { validateCivicInstitution, validateCivicInstitutionAmendment } = require('./schemas');
const {
  ensureCivicSqliteSchemaMetadata,
  readCivicSqliteSchemaMetadata
} = require('./sqlite_schema');

const INSTITUTION_STATUS_CHARTERED = 'chartered';
const INSTITUTION_AMENDMENT_STATUS_RECORDED = 'recorded';
const MIGRATION_VERSION = 'v1';
const STORE_KEY = 'institutions';
const V6_CIVIC_INSTITUTION_READINESS_GATE_VERSION = 'agent-town.v6.civic.institution_readiness.v1';
const REQUIRED_INSTITUTION_READINESS_CHECKS = [
  'feature_flag',
  'research_opt_in',
  'template_evidence',
  'worker_tool_integration',
  'delegation_policy_link',
  'charter_change_execution_review',
  'public_text_rendering',
  'no_runtime_exposure',
  'no_player_visible_institutions',
  'no_world_mutation'
];
const REQUIRED_INSTITUTION_TEMPLATE_EVIDENCE_CHECKS = [
  'charter_template_review',
  'membership_rule_review',
  'eligibility_rule_review',
  'voting_rule_review',
  'moderation_policy_review',
  'proposal_type_review',
  'public_audit_summary_review',
  'public_text_rendering_review',
  'delegation_policy_review',
  'charter_change_execution_review',
  'charter_change_rollback_review',
  'private_data_exclusion',
  'institution_audit_rows'
];
const REQUIRED_INSTITUTION_TEMPLATE_SCOPES = [
  'public_world',
  'public_works',
  'sandbox_policy',
  'institution_charter',
  'service_policy'
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

function inspectInstitutionReadinessEvidence(evidence = {}) {
  const checks = normalizeList(evidence.checks);
  const templateScopes = normalizeList(evidence.templateScopes);
  const missingChecks = REQUIRED_INSTITUTION_TEMPLATE_EVIDENCE_CHECKS.filter((entry) => !checks.includes(entry));
  const missingTemplateScopes = REQUIRED_INSTITUTION_TEMPLATE_SCOPES.filter((entry) => !templateScopes.includes(entry));
  const workerToolIntegrated = evidence.workerToolIntegrated === true;
  const delegationPolicyLinked = evidence.delegationPolicyLinked === true;
  const charterChangeExecutionReviewed = evidence.charterChangeExecutionReviewed === true;
  const charterChangeRollbackReviewed = evidence.charterChangeRollbackReviewed === true;
  const publicTextRenderingReviewed = evidence.publicTextRenderingReviewed === true;
  const ok = evidence.status === 'complete'
    && evidence.executionStatus === 'not_executable'
    && evidence.runtimeExposed === false
    && evidence.playerVisible === false
    && evidence.normalGameplayExposure === false
    && evidence.mutatesWorldState === false
    && evidence.appliesCharterChange === false
    && workerToolIntegrated
    && delegationPolicyLinked
    && charterChangeExecutionReviewed
    && charterChangeRollbackReviewed
    && publicTextRenderingReviewed
    && missingChecks.length === 0
    && missingTemplateScopes.length === 0;
  return {
    ok,
    status: String(evidence.status || 'missing'),
    executionStatus: String(evidence.executionStatus || 'missing'),
    runtimeExposed: evidence.runtimeExposed === true,
    playerVisible: evidence.playerVisible === true,
    normalGameplayExposure: evidence.normalGameplayExposure === true,
    mutatesWorldState: evidence.mutatesWorldState === true,
    appliesCharterChange: evidence.appliesCharterChange === true,
    workerToolIntegrated,
    delegationPolicyLinked,
    charterChangeExecutionReviewed,
    charterChangeRollbackReviewed,
    publicTextRenderingReviewed,
    requiredChecks: [...REQUIRED_INSTITUTION_TEMPLATE_EVIDENCE_CHECKS],
    checks,
    missingChecks,
    requiredTemplateScopes: [...REQUIRED_INSTITUTION_TEMPLATE_SCOPES],
    templateScopes,
    missingTemplateScopes
  };
}

function disabledInstitutionReadinessReport({ source, reason }) {
  return {
    version: V6_CIVIC_INSTITUTION_READINESS_GATE_VERSION,
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
    appliesCharterChange: false,
    executionStatus: 'not_executable',
    evidence: inspectInstitutionReadinessEvidence({}),
    checks: [],
    errors: [reason],
    disabledReason: reason
  };
}

function buildV6CivicInstitutionReadinessGate({
  featureFlags = {},
  includeResearchInstitutionReadiness = false,
  source = 'runtime',
  evidence = {}
} = {}) {
  const enabled = includeResearchInstitutionReadiness === true
    && isWorldGridFeatureEnabled(featureFlags, V6_WORLD_FEATURE_FLAG);
  if (!enabled) {
    return disabledInstitutionReadinessReport({
      source,
      reason: 'V6 civic institution readiness requires explicit research opt-in and V6 feature flag'
    });
  }

  const evidenceReport = inspectInstitutionReadinessEvidence(evidence);
  const checks = [
    check('feature_flag', isWorldGridFeatureEnabled(featureFlags, V6_WORLD_FEATURE_FLAG), 'FEATURE_DISABLED'),
    check('research_opt_in', includeResearchInstitutionReadiness === true, 'RESEARCH_OPT_IN_REQUIRED'),
    check(
      'template_evidence',
      evidenceReport.status === 'complete'
        && evidenceReport.missingChecks.length === 0
        && evidenceReport.missingTemplateScopes.length === 0,
      'INSTITUTION_TEMPLATE_EVIDENCE_REQUIRED'
    ),
    check('worker_tool_integration', evidenceReport.workerToolIntegrated, 'INSTITUTION_WORKER_TOOL_INTEGRATION_REQUIRED'),
    check('delegation_policy_link', evidenceReport.delegationPolicyLinked, 'INSTITUTION_DELEGATION_POLICY_LINK_REQUIRED'),
    check(
      'charter_change_execution_review',
      evidenceReport.charterChangeExecutionReviewed
        && evidenceReport.charterChangeRollbackReviewed
        && evidenceReport.appliesCharterChange === false,
      'INSTITUTION_CHARTER_CHANGE_EXECUTION_REVIEW_REQUIRED'
    ),
    check('public_text_rendering', evidenceReport.publicTextRenderingReviewed, 'INSTITUTION_PUBLIC_TEXT_RENDERING_REQUIRED'),
    check(
      'no_runtime_exposure',
      evidenceReport.executionStatus === 'not_executable' && evidenceReport.runtimeExposed === false,
      'INSTITUTION_RUNTIME_EXPOSURE_FORBIDDEN'
    ),
    check(
      'no_player_visible_institutions',
      evidenceReport.playerVisible === false && evidenceReport.normalGameplayExposure === false,
      'INSTITUTION_PLAYER_VISIBLE_SURFACE_FORBIDDEN'
    ),
    check(
      'no_world_mutation',
      evidenceReport.mutatesWorldState === false && evidenceReport.appliesCharterChange === false,
      'INSTITUTION_WORLD_MUTATION_FORBIDDEN'
    )
  ];
  const researchReady = checks.every((entry) => entry.ok);

  return {
    version: V6_CIVIC_INSTITUTION_READINESS_GATE_VERSION,
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
    appliesCharterChange: false,
    executionStatus: 'not_executable',
    evidence: evidenceReport,
    checks,
    errors: checks.filter((entry) => !entry.ok).map((entry) => entry.error)
  };
}

function assertV6CivicInstitutionReadinessGateSafe(report = {}) {
  const errors = [];
  if (report.version !== V6_CIVIC_INSTITUTION_READINESS_GATE_VERSION) {
    errors.push('V6_CIVIC_INSTITUTION_READINESS_VERSION_REQUIRED');
  }
  if (report.featureFlag !== V6_WORLD_FEATURE_FLAG) {
    errors.push('V6_CIVIC_INSTITUTION_READINESS_FEATURE_FLAG_REQUIRED');
  }
  if (report.status !== 'research_only') {
    errors.push('V6_CIVIC_INSTITUTION_READINESS_RESEARCH_ONLY_REQUIRED');
  }
  if (report.runtimeExposed !== false) {
    errors.push('V6_CIVIC_INSTITUTION_READINESS_RUNTIME_HIDDEN_REQUIRED');
  }
  if (report.playerVisible !== false) {
    errors.push('V6_CIVIC_INSTITUTION_READINESS_PLAYER_HIDDEN_REQUIRED');
  }
  if (report.normalGameplayExposure !== false) {
    errors.push('V6_CIVIC_INSTITUTION_READINESS_NORMAL_GAMEPLAY_FORBIDDEN');
  }
  if (report.mutatesWorldState !== false) {
    errors.push('V6_CIVIC_INSTITUTION_READINESS_WORLD_MUTATION_FORBIDDEN');
  }
  if (report.appliesCharterChange !== false) {
    errors.push('V6_CIVIC_INSTITUTION_READINESS_CHARTER_CHANGE_FORBIDDEN');
  }
  if (report.executionStatus !== 'not_executable') {
    errors.push('V6_CIVIC_INSTITUTION_READINESS_NON_EXECUTING_REQUIRED');
  }
  if (report.releaseReady !== false) {
    errors.push('V6_CIVIC_INSTITUTION_READINESS_RELEASE_READY_FORBIDDEN');
  }
  if (report.available === true) {
    const checkKeys = new Set((report.checks || []).map((entry) => entry.key));
    for (const key of REQUIRED_INSTITUTION_READINESS_CHECKS) {
      if (!checkKeys.has(key)) errors.push(`V6_CIVIC_INSTITUTION_READINESS_CHECK_REQUIRED:${key}`);
    }
    const failedChecks = (report.checks || []).filter((entry) => entry.ok !== true);
    if (report.researchReady === true && failedChecks.length > 0) {
      errors.push('V6_CIVIC_INSTITUTION_READINESS_READY_WITH_FAILED_CHECKS');
    }
    if (report.researchReady !== true && report.failClosed !== true) {
      errors.push('V6_CIVIC_INSTITUTION_READINESS_DENIAL_FAIL_CLOSED_REQUIRED');
    }
    const evidence = report.evidence || {};
    if (evidence.runtimeExposed === true) {
      errors.push('V6_CIVIC_INSTITUTION_READINESS_EVIDENCE_RUNTIME_HIDDEN_REQUIRED');
    }
    if (evidence.playerVisible === true || evidence.normalGameplayExposure === true) {
      errors.push('V6_CIVIC_INSTITUTION_READINESS_EVIDENCE_PLAYER_HIDDEN_REQUIRED');
    }
    if (evidence.mutatesWorldState === true) {
      errors.push('V6_CIVIC_INSTITUTION_READINESS_EVIDENCE_WORLD_MUTATION_FORBIDDEN');
    }
    if (evidence.appliesCharterChange === true) {
      errors.push('V6_CIVIC_INSTITUTION_READINESS_EVIDENCE_CHARTER_CHANGE_FORBIDDEN');
    }
    if (report.researchReady === true && evidence.ok !== true) {
      errors.push('V6_CIVIC_INSTITUTION_READINESS_READY_WITHOUT_EVIDENCE');
    }
  } else if (report.failClosed !== true) {
    errors.push('V6_CIVIC_INSTITUTION_READINESS_DISABLED_FAIL_CLOSED_REQUIRED');
  }
  return {
    ok: errors.length === 0,
    errors
  };
}

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

function parseAmendmentRow(row) {
  if (!row) return null;
  return {
    amendmentId: row.amendment_id,
    institutionId: row.institution_id,
    proposalId: row.proposal_id,
    requestedByAccountId: row.requested_by_account_id,
    approvalReceiptId: row.approval_receipt_id,
    newCharterId: row.new_charter_id,
    idempotencyKey: row.idempotency_key,
    status: row.status,
    auditEntryId: row.audit_entry_id,
    effectiveAtMs: Number(row.effective_at),
    createdAtMs: Number(row.created_at),
    amendment: JSON.parse(row.amendment_json)
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
    CREATE TABLE IF NOT EXISTS world_civic_institution_charter_amendments (
      amendment_id TEXT PRIMARY KEY,
      institution_id TEXT NOT NULL,
      proposal_id TEXT NOT NULL,
      requested_by_account_id TEXT NOT NULL,
      approval_receipt_id TEXT NOT NULL,
      new_charter_id TEXT NOT NULL,
      idempotency_key TEXT NOT NULL,
      status TEXT NOT NULL,
      audit_entry_id TEXT NOT NULL,
      effective_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      amendment_json TEXT NOT NULL,
      UNIQUE(institution_id, idempotency_key)
    );
    CREATE INDEX IF NOT EXISTS idx_world_civic_institution_amendments_institution
      ON world_civic_institution_charter_amendments(institution_id, status, created_at);
    CREATE INDEX IF NOT EXISTS idx_world_civic_institution_amendments_proposal
      ON world_civic_institution_charter_amendments(proposal_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_world_civic_institution_amendments_requester
      ON world_civic_institution_charter_amendments(requested_by_account_id, created_at);
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
    byAmendmentId: db.prepare(`
      SELECT *
      FROM world_civic_institution_charter_amendments
      WHERE amendment_id = ?
      LIMIT 1
    `),
    byInstitutionIdempotency: db.prepare(`
      SELECT *
      FROM world_civic_institution_charter_amendments
      WHERE institution_id = ? AND idempotency_key = ?
      LIMIT 1
    `),
    insertAmendment: db.prepare(`
      INSERT INTO world_civic_institution_charter_amendments (
        amendment_id, institution_id, proposal_id, requested_by_account_id,
        approval_receipt_id, new_charter_id, idempotency_key, status,
        audit_entry_id, effective_at, created_at, amendment_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `),
    listAmendments: db.prepare(`
      SELECT *
      FROM world_civic_institution_charter_amendments
      WHERE (? = '' OR institution_id = ?)
        AND (? = '' OR proposal_id = ?)
        AND (? = '' OR status = ?)
      ORDER BY created_at ASC, amendment_id ASC
      LIMIT ?
    `),
    amendmentSummary: db.prepare(`
      SELECT status, COUNT(1) AS count
      FROM world_civic_institution_charter_amendments
      WHERE institution_id = ?
      GROUP BY status
    `),
    latestAmendment: db.prepare(`
      SELECT amendment_id
      FROM world_civic_institution_charter_amendments
      WHERE institution_id = ?
      ORDER BY created_at DESC, amendment_id DESC
      LIMIT 1
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
  const scopeRef = `${institution.scope.kind}:${institution.scope.targetId}`;
  return {
    schemaVersion: institution.schemaVersion,
    entryId: `audit_${institution.institutionId.replace(/^institution_/, 'institution_')}`,
    actor: institution.charteredBy,
    actionType: 'institution.chartered',
    objectRef: institution.institutionId,
    idempotencyKey: `idem_${institution.institutionId.replace(/^institution_/, 'inst_').slice(0, 80)}`,
    beforeHash: sha256(`agent-town.v6.civic.institution.absent:${institution.institutionId}`),
    afterHash: sha256(stableJson(institution)),
    beforeSummary: `No civic institution existed for ${institution.institutionId} in ${scopeRef}.`,
    afterSummary: `Chartered institution ${institution.institutionId} for ${scopeRef} with ${institution.proposalTypes.length} proposal types, voting rule ${institution.votingRuleId}, and no player-visible mechanics.`,
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

function createCharterAmendmentAuditEntry({ amendment, institution, actor, nowMs }) {
  return {
    schemaVersion: amendment.schemaVersion,
    entryId: `audit_${amendment.amendmentId.replace(/^charteramend_/, 'charteramend_')}`,
    actor,
    actionType: 'institution.charter_amendment.recorded',
    objectRef: amendment.amendmentId,
    idempotencyKey: amendment.idempotencyKey,
    beforeHash: sha256(stableJson({
      institutionId: institution.institutionId,
      charterId: institution.charterId,
      status: institution.status
    })),
    afterHash: sha256(stableJson({
      amendment,
      status: INSTITUTION_AMENDMENT_STATUS_RECORDED
    })),
    beforeSummary: `Institution ${institution.institutionId} retained active charter ${institution.charterId} with status ${institution.status}.`,
    afterSummary: `Recorded charter amendment ${amendment.amendmentId} toward ${amendment.newCharterId} from proposal ${amendment.proposalId}; active charter was not applied.`,
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

function createCivicInstitutionStore({
  sqlitePath,
  auditLedger = null,
  auditSqlitePath = '',
  proposalStore = null,
  voteStore = null,
  moderationStore = null
}) {
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

  function validateCharterAmendmentPrerequisites({ amendment, institution, proposal, nowMs }) {
    if (!proposalStore || typeof proposalStore.getProposal !== 'function') {
      throw new Error('CIVIC_INSTITUTION_AMENDMENT_PROPOSAL_STORE_REQUIRED');
    }
    if (!voteStore || typeof voteStore.summarizeProposalVotes !== 'function') {
      throw new Error('CIVIC_INSTITUTION_AMENDMENT_VOTE_STORE_REQUIRED');
    }
    if (!moderationStore || typeof moderationStore.listDecisions !== 'function') {
      throw new Error('CIVIC_INSTITUTION_AMENDMENT_MODERATION_STORE_REQUIRED');
    }
    if (!institution) {
      const err = new Error('CIVIC_INSTITUTION_AMENDMENT_INSTITUTION_REQUIRED');
      err.details = { institutionId: amendment.institutionId };
      throw err;
    }
    if (!proposal) {
      const err = new Error('CIVIC_INSTITUTION_AMENDMENT_PROPOSAL_REQUIRED');
      err.details = { proposalId: amendment.proposalId };
      throw err;
    }
    if (proposal.expiresAtMs <= nowMs) {
      const err = new Error('CIVIC_INSTITUTION_AMENDMENT_PROPOSAL_EXPIRED');
      err.details = { proposalId: amendment.proposalId, expiresAtMs: proposal.expiresAtMs, nowMs };
      throw err;
    }
    if (proposal.scopeKind !== 'institution_charter' || proposal.scopeTargetId !== amendment.institutionId) {
      const err = new Error('CIVIC_INSTITUTION_AMENDMENT_PROPOSAL_SCOPE_REQUIRED');
      err.details = {
        proposalId: amendment.proposalId,
        expectedScopeKind: 'institution_charter',
        expectedScopeTargetId: amendment.institutionId,
        receivedScopeKind: proposal.scopeKind,
        receivedScopeTargetId: proposal.scopeTargetId
      };
      throw err;
    }
    if (proposal.proposal.effectPreview.effectType !== 'charter_update') {
      const err = new Error('CIVIC_INSTITUTION_AMENDMENT_EFFECT_REQUIRED');
      err.details = { proposalId: amendment.proposalId, effectType: proposal.proposal.effectPreview.effectType };
      throw err;
    }
    if (!proposal.proposal.affectedPublicState.includes(`institution:${amendment.institutionId}`)) {
      const err = new Error('CIVIC_INSTITUTION_AMENDMENT_AFFECTED_STATE_REQUIRED');
      err.details = { proposalId: amendment.proposalId, institutionId: amendment.institutionId };
      throw err;
    }
    const moderation = approvedModerationForProposal(moderationStore, proposal);
    if (!moderation) {
      const err = new Error('CIVIC_INSTITUTION_AMENDMENT_MODERATION_REQUIRED');
      err.details = { proposalId: amendment.proposalId };
      throw err;
    }
    const voteSummary = voteStore.summarizeProposalVotes(amendment.proposalId);
    if (!voteSummary || voteSummary.counts.approve <= voteSummary.counts.reject || voteSummary.counts.approve < 1) {
      const err = new Error('CIVIC_INSTITUTION_AMENDMENT_APPROVAL_REQUIRED');
      err.details = { proposalId: amendment.proposalId, counts: voteSummary?.counts || null };
      throw err;
    }
    const approvingVote = matchingVoteForReceipt(voteStore, amendment.proposalId, amendment.approvalReceiptId);
    if (!approvingVote) {
      const err = new Error('CIVIC_INSTITUTION_AMENDMENT_APPROVAL_RECEIPT_REQUIRED');
      err.details = { proposalId: amendment.proposalId, receiptId: amendment.approvalReceiptId };
      throw err;
    }
    return { approvingVote, moderation };
  }

  function recordCharterAmendment(rawAmendment = {}, { nowMs = Date.now() } = {}) {
    const validation = validateCivicInstitutionAmendment(rawAmendment);
    if (!validation.ok) {
      const err = new Error('CIVIC_INSTITUTION_AMENDMENT_INVALID');
      err.details = { errors: validation.errors };
      throw err;
    }
    const amendment = validation.value;
    const normalizedJson = stableJson(amendment);
    const existingByIdempotency = parseAmendmentRow(
      statements.byInstitutionIdempotency.get(amendment.institutionId, amendment.idempotencyKey)
    );
    if (existingByIdempotency) {
      if (stableJson(existingByIdempotency.amendment) !== normalizedJson) {
        const err = new Error('CIVIC_INSTITUTION_AMENDMENT_IDEMPOTENCY_CONFLICT');
        err.details = {
          institutionId: amendment.institutionId,
          idempotencyKey: amendment.idempotencyKey,
          existingAmendmentId: existingByIdempotency.amendmentId
        };
        throw err;
      }
      return { ...existingByIdempotency, duplicate: true };
    }
    const existingById = parseAmendmentRow(statements.byAmendmentId.get(amendment.amendmentId));
    if (existingById) {
      const err = new Error('CIVIC_INSTITUTION_AMENDMENT_ID_CONFLICT');
      err.details = { amendmentId: amendment.amendmentId };
      throw err;
    }

    const institution = getInstitution(amendment.institutionId);
    const proposal = proposalStore?.getProposal?.(amendment.proposalId) || null;
    const { approvingVote } = validateCharterAmendmentPrerequisites({
      amendment,
      institution,
      proposal,
      nowMs
    });
    const auditRow = ledger.append(createCharterAmendmentAuditEntry({
      amendment,
      institution,
      actor: approvingVote.vote.voter,
      nowMs
    }));
    statements.insertAmendment.run(
      amendment.amendmentId,
      amendment.institutionId,
      amendment.proposalId,
      amendment.requestedBy.accountId,
      amendment.approvalReceiptId,
      amendment.newCharterId,
      amendment.idempotencyKey,
      INSTITUTION_AMENDMENT_STATUS_RECORDED,
      auditRow.entry.entryId,
      amendment.effectiveAtMs,
      nowMs,
      normalizedJson
    );
    return parseAmendmentRow(statements.byAmendmentId.get(amendment.amendmentId));
  }

  function getCharterAmendment(amendmentId = '') {
    return parseAmendmentRow(statements.byAmendmentId.get(String(amendmentId || '')));
  }

  function listCharterAmendments({ institutionId = '', proposalId = '', status = '', limit = 100 } = {}) {
    const safeLimit = Number.isInteger(Number(limit)) ? Math.max(1, Math.min(500, Number(limit))) : 100;
    return statements.listAmendments.all(
      String(institutionId || ''),
      String(institutionId || ''),
      String(proposalId || ''),
      String(proposalId || ''),
      String(status || ''),
      String(status || ''),
      safeLimit
    ).map(parseAmendmentRow);
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

  function summarizeInstitutionGovernance(institutionId = '') {
    const institution = getInstitution(institutionId);
    const rows = statements.amendmentSummary.all(String(institutionId || ''));
    const amendmentsByStatus = {};
    let amendmentCount = 0;
    for (const row of rows) {
      const status = String(row.status || '');
      const count = Number(row.count || 0);
      amendmentsByStatus[status] = count;
      amendmentCount += count;
    }
    return {
      institutionId: String(institutionId || ''),
      charterId: institution?.charterId || '',
      amendmentCount,
      amendmentsByStatus,
      latestAmendmentId: statements.latestAmendment.get(String(institutionId || ''))?.amendment_id || '',
      playerVisible: false,
      appliesCharterChanges: false,
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
    getCharterAmendment,
    getInstitution,
    getSchemaMetadata,
    listCharterAmendments,
    listInstitutions,
    migrationVersion: schemaMetadata.migrationVersion,
    recordCharterAmendment,
    sqlitePath,
    summarizeInstitutionGovernance,
    summarizeScopeInstitutions
  };
}

module.exports = {
  INSTITUTION_AMENDMENT_STATUS_RECORDED,
  INSTITUTION_STATUS_CHARTERED,
  REQUIRED_INSTITUTION_READINESS_CHECKS: clone(REQUIRED_INSTITUTION_READINESS_CHECKS),
  REQUIRED_INSTITUTION_TEMPLATE_EVIDENCE_CHECKS: clone(REQUIRED_INSTITUTION_TEMPLATE_EVIDENCE_CHECKS),
  REQUIRED_INSTITUTION_TEMPLATE_SCOPES: clone(REQUIRED_INSTITUTION_TEMPLATE_SCOPES),
  V6_CIVIC_INSTITUTION_READINESS_GATE_VERSION,
  assertV6CivicInstitutionReadinessGateSafe,
  buildV6CivicInstitutionReadinessGate,
  createCivicInstitutionStore
};
