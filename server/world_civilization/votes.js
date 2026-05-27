const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const { V6_WORLD_FEATURE_FLAG, isWorldGridFeatureEnabled } = require('../world_grid/feature_flags');
const { createCivicAuditLedger, sha256, stableJson } = require('./audit_ledger');
const { validateCivicVote } = require('./schemas');
const {
  ensureCivicSqliteSchemaMetadata,
  readCivicSqliteSchemaMetadata
} = require('./sqlite_schema');

const MIGRATION_VERSION = 'v1';
const STORE_KEY = 'votes';
const V6_VOTE_AUTHORIZATION_READINESS_GATE_VERSION = 'agent-town.v6.vote_authorization_readiness.v1';
const DEFAULT_VOTE_APPROVAL_POLICY = Object.freeze({
  policyId: 'policy_v6_simple_majority_v1',
  quorumMinVotes: 1,
  minApproveVotes: 1,
  approvalThresholdBps: 5001,
  countAbstainForQuorum: true
});
const REQUIRED_VOTE_AUTHORIZATION_READINESS_CHECKS = [
  'feature_flag',
  'research_opt_in',
  'vote_authorization_evidence',
  'route_edge_authorization',
  'voting_template_review',
  'replay_idempotency',
  'governance_preflight',
  'no_runtime_exposure',
  'no_world_mutation'
];
const REQUIRED_VOTE_AUTHORIZATION_EVIDENCE_CHECKS = [
  'server_verified_voter_authorization',
  'eligibility_rule_verification',
  'one_vote_accounting',
  'idempotent_receipt_replay',
  'changed_vote_replay_rejection',
  'proposal_expiry_denial',
  'delegation_policy_review',
  'per_institution_voting_templates',
  'route_edge_vote_auth',
  'quorum_threshold_policy',
  'governance_preflight_integration',
  'vote_audit_rows',
  'private_data_exclusion',
  'no_effect_application'
];
const REQUIRED_VOTE_ROUTE_SURFACES = [
  'human_vote_route',
  'delegated_agent_vote_route',
  'worker_tool_vote_surface'
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

function inspectVoteAuthorizationReadinessEvidence(evidence = {}) {
  const checks = normalizeList(evidence.checks);
  const routeSurfaces = normalizeList(evidence.routeSurfaces);
  const missingChecks = REQUIRED_VOTE_AUTHORIZATION_EVIDENCE_CHECKS.filter((entry) => !checks.includes(entry));
  const missingRouteSurfaces = REQUIRED_VOTE_ROUTE_SURFACES.filter((entry) => !routeSurfaces.includes(entry));
  const routeEdgeAuthReviewed = evidence.routeEdgeAuthReviewed === true;
  const votingTemplatesReviewed = evidence.votingTemplatesReviewed === true;
  const replayIdempotencyReviewed = evidence.replayIdempotencyReviewed === true;
  const governancePreflightReviewed = evidence.governancePreflightReviewed === true;
  const ok = evidence.status === 'complete'
    && evidence.executionStatus === 'not_executable'
    && evidence.runtimeExposed === false
    && evidence.playerVisible === false
    && evidence.normalGameplayExposure === false
    && evidence.mutatesWorldState === false
    && evidence.appliesVoteOutcome === false
    && evidence.exposesPrivateData === false
    && routeEdgeAuthReviewed
    && votingTemplatesReviewed
    && replayIdempotencyReviewed
    && governancePreflightReviewed
    && missingChecks.length === 0
    && missingRouteSurfaces.length === 0;
  return {
    ok,
    status: String(evidence.status || 'missing'),
    executionStatus: String(evidence.executionStatus || 'missing'),
    runtimeExposed: evidence.runtimeExposed === true,
    playerVisible: evidence.playerVisible === true,
    normalGameplayExposure: evidence.normalGameplayExposure === true,
    mutatesWorldState: evidence.mutatesWorldState === true,
    appliesVoteOutcome: evidence.appliesVoteOutcome === true,
    exposesPrivateData: evidence.exposesPrivateData === true,
    routeEdgeAuthReviewed,
    votingTemplatesReviewed,
    replayIdempotencyReviewed,
    governancePreflightReviewed,
    requiredChecks: [...REQUIRED_VOTE_AUTHORIZATION_EVIDENCE_CHECKS],
    checks,
    missingChecks,
    requiredRouteSurfaces: [...REQUIRED_VOTE_ROUTE_SURFACES],
    routeSurfaces,
    missingRouteSurfaces
  };
}

function disabledVoteAuthorizationReadinessReport({ source, reason }) {
  return {
    version: V6_VOTE_AUTHORIZATION_READINESS_GATE_VERSION,
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
    appliesVoteOutcome: false,
    exposesPrivateData: false,
    executionStatus: 'not_executable',
    evidence: inspectVoteAuthorizationReadinessEvidence({}),
    checks: [],
    errors: [reason],
    disabledReason: reason
  };
}

function buildV6VoteAuthorizationReadinessGate({
  featureFlags = {},
  includeResearchVoteReadiness = false,
  source = 'runtime',
  evidence = {}
} = {}) {
  const enabled = includeResearchVoteReadiness === true
    && isWorldGridFeatureEnabled(featureFlags, V6_WORLD_FEATURE_FLAG);
  if (!enabled) {
    return disabledVoteAuthorizationReadinessReport({
      source,
      reason: 'V6 vote authorization readiness requires explicit research opt-in and V6 feature flag'
    });
  }

  const evidenceReport = inspectVoteAuthorizationReadinessEvidence(evidence);
  const checks = [
    check('feature_flag', isWorldGridFeatureEnabled(featureFlags, V6_WORLD_FEATURE_FLAG), 'FEATURE_DISABLED'),
    check('research_opt_in', includeResearchVoteReadiness === true, 'RESEARCH_OPT_IN_REQUIRED'),
    check(
      'vote_authorization_evidence',
      evidenceReport.status === 'complete' && evidenceReport.missingChecks.length === 0,
      'VOTE_AUTHORIZATION_EVIDENCE_REQUIRED'
    ),
    check(
      'route_edge_authorization',
      evidenceReport.routeEdgeAuthReviewed && evidenceReport.missingRouteSurfaces.length === 0,
      'VOTE_ROUTE_EDGE_AUTHORIZATION_REQUIRED'
    ),
    check('voting_template_review', evidenceReport.votingTemplatesReviewed, 'VOTE_TEMPLATE_REVIEW_REQUIRED'),
    check('replay_idempotency', evidenceReport.replayIdempotencyReviewed, 'VOTE_REPLAY_IDEMPOTENCY_REQUIRED'),
    check('governance_preflight', evidenceReport.governancePreflightReviewed, 'VOTE_GOVERNANCE_PREFLIGHT_REQUIRED'),
    check(
      'no_runtime_exposure',
      evidenceReport.executionStatus === 'not_executable'
        && evidenceReport.runtimeExposed === false
        && evidenceReport.playerVisible === false
        && evidenceReport.normalGameplayExposure === false,
      'VOTE_RUNTIME_EXPOSURE_FORBIDDEN'
    ),
    check(
      'no_world_mutation',
      evidenceReport.mutatesWorldState === false
        && evidenceReport.appliesVoteOutcome === false
        && evidenceReport.exposesPrivateData === false,
      'VOTE_WORLD_MUTATION_FORBIDDEN'
    )
  ];
  const researchReady = checks.every((entry) => entry.ok);

  return {
    version: V6_VOTE_AUTHORIZATION_READINESS_GATE_VERSION,
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
    appliesVoteOutcome: false,
    exposesPrivateData: false,
    executionStatus: 'not_executable',
    evidence: evidenceReport,
    checks,
    errors: checks.filter((entry) => !entry.ok).map((entry) => entry.error)
  };
}

function assertV6VoteAuthorizationReadinessGateSafe(report = {}) {
  const errors = [];
  if (report.version !== V6_VOTE_AUTHORIZATION_READINESS_GATE_VERSION) {
    errors.push('V6_VOTE_AUTHORIZATION_READINESS_VERSION_REQUIRED');
  }
  if (report.featureFlag !== V6_WORLD_FEATURE_FLAG) {
    errors.push('V6_VOTE_AUTHORIZATION_READINESS_FEATURE_FLAG_REQUIRED');
  }
  if (report.status !== 'research_only') {
    errors.push('V6_VOTE_AUTHORIZATION_READINESS_RESEARCH_ONLY_REQUIRED');
  }
  if (report.runtimeExposed !== false) {
    errors.push('V6_VOTE_AUTHORIZATION_READINESS_RUNTIME_HIDDEN_REQUIRED');
  }
  if (report.playerVisible !== false) {
    errors.push('V6_VOTE_AUTHORIZATION_READINESS_PLAYER_HIDDEN_REQUIRED');
  }
  if (report.normalGameplayExposure !== false) {
    errors.push('V6_VOTE_AUTHORIZATION_READINESS_NORMAL_GAMEPLAY_FORBIDDEN');
  }
  if (report.mutatesWorldState !== false) {
    errors.push('V6_VOTE_AUTHORIZATION_READINESS_WORLD_MUTATION_FORBIDDEN');
  }
  if (report.appliesVoteOutcome !== false) {
    errors.push('V6_VOTE_AUTHORIZATION_READINESS_OUTCOME_APPLICATION_FORBIDDEN');
  }
  if (report.exposesPrivateData !== false) {
    errors.push('V6_VOTE_AUTHORIZATION_READINESS_PRIVATE_DATA_FORBIDDEN');
  }
  if (report.executionStatus !== 'not_executable') {
    errors.push('V6_VOTE_AUTHORIZATION_READINESS_NON_EXECUTING_REQUIRED');
  }
  if (report.releaseReady !== false) {
    errors.push('V6_VOTE_AUTHORIZATION_READINESS_RELEASE_READY_FORBIDDEN');
  }
  if (report.available === true) {
    const checkKeys = new Set((report.checks || []).map((entry) => entry.key));
    for (const key of REQUIRED_VOTE_AUTHORIZATION_READINESS_CHECKS) {
      if (!checkKeys.has(key)) errors.push(`V6_VOTE_AUTHORIZATION_READINESS_CHECK_REQUIRED:${key}`);
    }
    const failedChecks = (report.checks || []).filter((entry) => entry.ok !== true);
    if (report.researchReady === true && failedChecks.length > 0) {
      errors.push('V6_VOTE_AUTHORIZATION_READINESS_READY_WITH_FAILED_CHECKS');
    }
    if (report.researchReady !== true && report.failClosed !== true) {
      errors.push('V6_VOTE_AUTHORIZATION_READINESS_DENIAL_FAIL_CLOSED_REQUIRED');
    }
    const evidence = report.evidence || {};
    if (evidence.runtimeExposed === true) {
      errors.push('V6_VOTE_AUTHORIZATION_READINESS_EVIDENCE_RUNTIME_HIDDEN_REQUIRED');
    }
    if (evidence.playerVisible === true || evidence.normalGameplayExposure === true) {
      errors.push('V6_VOTE_AUTHORIZATION_READINESS_EVIDENCE_PLAYER_HIDDEN_REQUIRED');
    }
    if (evidence.mutatesWorldState === true) {
      errors.push('V6_VOTE_AUTHORIZATION_READINESS_EVIDENCE_WORLD_MUTATION_FORBIDDEN');
    }
    if (evidence.appliesVoteOutcome === true) {
      errors.push('V6_VOTE_AUTHORIZATION_READINESS_EVIDENCE_OUTCOME_APPLICATION_FORBIDDEN');
    }
    if (evidence.exposesPrivateData === true) {
      errors.push('V6_VOTE_AUTHORIZATION_READINESS_EVIDENCE_PRIVATE_DATA_FORBIDDEN');
    }
    if (report.researchReady === true && evidence.ok !== true) {
      errors.push('V6_VOTE_AUTHORIZATION_READINESS_READY_WITHOUT_EVIDENCE');
    }
  } else if (report.failClosed !== true) {
    errors.push('V6_VOTE_AUTHORIZATION_READINESS_DISABLED_FAIL_CLOSED_REQUIRED');
  }
  return {
    ok: errors.length === 0,
    errors
  };
}

function normalizePolicyInteger(errors, rawValue, key, fallback, { min, max }) {
  const value = rawValue === undefined ? fallback : rawValue;
  if (!Number.isInteger(value) || value < min || value > max) {
    errors.push(`${key} must be integer ${min}-${max}`);
    return fallback;
  }
  return value;
}

function normalizeVoteApprovalPolicy(rawPolicy = {}) {
  const policy = rawPolicy && typeof rawPolicy === 'object' ? rawPolicy : {};
  const errors = [];
  const normalized = {
    policyId: String(policy.policyId || DEFAULT_VOTE_APPROVAL_POLICY.policyId),
    quorumMinVotes: normalizePolicyInteger(
      errors,
      policy.quorumMinVotes,
      'quorumMinVotes',
      DEFAULT_VOTE_APPROVAL_POLICY.quorumMinVotes,
      { min: 1, max: 10_000 }
    ),
    minApproveVotes: normalizePolicyInteger(
      errors,
      policy.minApproveVotes,
      'minApproveVotes',
      DEFAULT_VOTE_APPROVAL_POLICY.minApproveVotes,
      { min: 1, max: 10_000 }
    ),
    approvalThresholdBps: normalizePolicyInteger(
      errors,
      policy.approvalThresholdBps,
      'approvalThresholdBps',
      DEFAULT_VOTE_APPROVAL_POLICY.approvalThresholdBps,
      { min: 1, max: 10_000 }
    ),
    countAbstainForQuorum: policy.countAbstainForQuorum === undefined
      ? DEFAULT_VOTE_APPROVAL_POLICY.countAbstainForQuorum
      : policy.countAbstainForQuorum === true
  };
  if (!/^policy_[a-z0-9_:-]{4,88}$/.test(normalized.policyId)) {
    errors.push('policyId must match policy id format');
  }
  return {
    ok: errors.length === 0,
    errors,
    policy: normalized
  };
}

function evaluateVoteApprovalPolicy(summary = null, rawPolicy = {}) {
  const normalized = normalizeVoteApprovalPolicy(rawPolicy);
  const counts = summary?.counts || { approve: 0, reject: 0, abstain: 0 };
  const approve = Number(counts.approve || 0);
  const reject = Number(counts.reject || 0);
  const abstain = Number(counts.abstain || 0);
  const decisiveVotes = approve + reject;
  const quorumVotes = normalized.policy.countAbstainForQuorum
    ? approve + reject + abstain
    : decisiveVotes;
  const approvalBps = decisiveVotes > 0 ? Math.floor((approve * 10_000) / decisiveVotes) : 0;
  const failures = [];

  if (!normalized.ok) failures.push('policy_invalid');
  if (quorumVotes < normalized.policy.quorumMinVotes) failures.push('quorum');
  if (approve < normalized.policy.minApproveVotes) failures.push('min_approve');
  if (approvalBps < normalized.policy.approvalThresholdBps) failures.push('approval_threshold');

  return {
    ok: failures.length === 0,
    policy: normalized.policy,
    policyErrors: normalized.errors,
    proposalId: String(summary?.proposalId || ''),
    counts: {
      approve,
      reject,
      abstain
    },
    total: approve + reject + abstain,
    quorumVotes,
    decisiveVotes,
    approvalBps,
    failures,
    executionStatus: 'not_executable'
  };
}

function parseVoteRow(row) {
  if (!row) return null;
  return {
    voteId: row.vote_id,
    proposalId: row.proposal_id,
    voterAccountId: row.voter_account_id,
    choice: row.choice,
    authorizationKind: row.authorization_kind,
    eligibilityRuleId: row.eligibility_rule_id,
    receiptId: row.receipt_id,
    idempotencyKey: row.idempotency_key,
    createdAtMs: Number(row.created_at),
    auditEntryId: row.audit_entry_id,
    vote: JSON.parse(row.vote_json)
  };
}

function ensureSchema(db) {
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = NORMAL;');
  db.exec('PRAGMA busy_timeout = 5000;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS world_civic_votes (
      vote_id TEXT PRIMARY KEY,
      proposal_id TEXT NOT NULL,
      voter_account_id TEXT NOT NULL,
      choice TEXT NOT NULL,
      authorization_kind TEXT NOT NULL,
      eligibility_rule_id TEXT NOT NULL,
      receipt_id TEXT NOT NULL,
      idempotency_key TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      audit_entry_id TEXT NOT NULL,
      vote_json TEXT NOT NULL,
      UNIQUE(voter_account_id, idempotency_key),
      UNIQUE(proposal_id, voter_account_id)
    );
    CREATE INDEX IF NOT EXISTS idx_world_civic_votes_proposal_choice
      ON world_civic_votes(proposal_id, choice, created_at);
    CREATE INDEX IF NOT EXISTS idx_world_civic_votes_voter_created
      ON world_civic_votes(voter_account_id, created_at);
  `);
  return ensureCivicSqliteSchemaMetadata(db, {
    storeKey: STORE_KEY,
    migrationVersion: MIGRATION_VERSION,
    modulePath: 'server/world_civilization/votes.js'
  });
}

function buildStatements(db) {
  return {
    byVoteId: db.prepare(`
      SELECT *
      FROM world_civic_votes
      WHERE vote_id = ?
      LIMIT 1
    `),
    byVoterIdempotency: db.prepare(`
      SELECT *
      FROM world_civic_votes
      WHERE voter_account_id = ? AND idempotency_key = ?
      LIMIT 1
    `),
    byProposalVoter: db.prepare(`
      SELECT *
      FROM world_civic_votes
      WHERE proposal_id = ? AND voter_account_id = ?
      LIMIT 1
    `),
    insert: db.prepare(`
      INSERT INTO world_civic_votes (
        vote_id, proposal_id, voter_account_id, choice, authorization_kind,
        eligibility_rule_id, receipt_id, idempotency_key, created_at,
        audit_entry_id, vote_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `),
    list: db.prepare(`
      SELECT *
      FROM world_civic_votes
      WHERE (? = '' OR proposal_id = ?)
        AND (? = '' OR voter_account_id = ?)
      ORDER BY created_at ASC, vote_id ASC
      LIMIT ?
    `),
    summary: db.prepare(`
      SELECT choice, COUNT(1) AS count
      FROM world_civic_votes
      WHERE proposal_id = ?
      GROUP BY choice
    `),
    count: db.prepare('SELECT COUNT(1) AS count FROM world_civic_votes')
  };
}

function createVoteAuditEntry(vote, nowMs) {
  return {
    schemaVersion: vote.schemaVersion,
    entryId: `audit_${vote.voteId.replace(/^vote_/, 'vote_')}`,
    actor: vote.voter,
    actionType: 'vote.recorded',
    objectRef: vote.voteId,
    idempotencyKey: vote.idempotencyKey,
    beforeHash: sha256(`agent-town.v6.civic.vote.absent:${vote.proposalId}:${vote.voter.accountId}`),
    afterHash: sha256(stableJson(vote)),
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

function createCivicVoteStore({ sqlitePath, proposalStore, auditLedger = null, auditSqlitePath = '' }) {
  if (!sqlitePath || typeof sqlitePath !== 'string') {
    throw new Error('CIVIC_VOTE_SQLITE_PATH_REQUIRED');
  }
  if (!proposalStore || typeof proposalStore.getProposal !== 'function') {
    throw new Error('CIVIC_VOTE_PROPOSAL_STORE_REQUIRED');
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

  function recordVote(rawVote = {}, { nowMs = Date.now() } = {}) {
    const validation = validateCivicVote(rawVote);
    if (!validation.ok) {
      const err = new Error('CIVIC_VOTE_INVALID');
      err.details = { errors: validation.errors };
      throw err;
    }
    const vote = validation.value;
    const normalizedJson = stableJson(vote);
    const proposal = proposalStore.getProposal(vote.proposalId);
    if (!proposal) {
      const err = new Error('CIVIC_VOTE_PROPOSAL_REQUIRED');
      err.details = { proposalId: vote.proposalId };
      throw err;
    }
    if (proposal.expiresAtMs <= nowMs) {
      const err = new Error('CIVIC_VOTE_PROPOSAL_EXPIRED');
      err.details = { proposalId: vote.proposalId, expiresAtMs: proposal.expiresAtMs, nowMs };
      throw err;
    }

    const existingByIdempotency = parseVoteRow(
      statements.byVoterIdempotency.get(vote.voter.accountId, vote.idempotencyKey)
    );
    if (existingByIdempotency) {
      if (stableJson(existingByIdempotency.vote) !== normalizedJson) {
        const err = new Error('CIVIC_VOTE_IDEMPOTENCY_CONFLICT');
        err.details = {
          voterAccountId: vote.voter.accountId,
          idempotencyKey: vote.idempotencyKey,
          existingVoteId: existingByIdempotency.voteId
        };
        throw err;
      }
      return { ...existingByIdempotency, duplicate: true };
    }

    const existingByProposalVoter = parseVoteRow(
      statements.byProposalVoter.get(vote.proposalId, vote.voter.accountId)
    );
    if (existingByProposalVoter) {
      const err = new Error('CIVIC_VOTE_ALREADY_RECORDED');
      err.details = {
        proposalId: vote.proposalId,
        voterAccountId: vote.voter.accountId,
        existingVoteId: existingByProposalVoter.voteId
      };
      throw err;
    }

    const existingByVoteId = parseVoteRow(statements.byVoteId.get(vote.voteId));
    if (existingByVoteId) {
      const err = new Error('CIVIC_VOTE_ID_CONFLICT');
      err.details = { voteId: vote.voteId };
      throw err;
    }

    const auditRow = ledger.append(createVoteAuditEntry(vote, nowMs));
    statements.insert.run(
      vote.voteId,
      vote.proposalId,
      vote.voter.accountId,
      vote.choice,
      vote.authorization.kind,
      vote.eligibilityProof.ruleId,
      vote.receiptId,
      vote.idempotencyKey,
      nowMs,
      auditRow.entry.entryId,
      normalizedJson
    );
    return parseVoteRow(statements.byVoteId.get(vote.voteId));
  }

  function getVote(voteId = '') {
    return parseVoteRow(statements.byVoteId.get(String(voteId || '')));
  }

  function listVotes({ proposalId = '', voterAccountId = '', limit = 100 } = {}) {
    const safeLimit = Number.isInteger(Number(limit)) ? Math.max(1, Math.min(500, Number(limit))) : 100;
    return statements.list.all(
      String(proposalId || ''),
      String(proposalId || ''),
      String(voterAccountId || ''),
      String(voterAccountId || ''),
      safeLimit
    ).map(parseVoteRow);
  }

  function summarizeProposalVotes(proposalId = '') {
    const rows = statements.summary.all(String(proposalId || ''));
    const counts = { approve: 0, reject: 0, abstain: 0 };
    for (const row of rows) counts[row.choice] = Number(row.count || 0);
    return {
      proposalId: String(proposalId || ''),
      counts,
      total: counts.approve + counts.reject + counts.abstain,
      executionStatus: 'not_executable'
    };
  }

  function evaluateProposalApproval(proposalId = '', policy = {}) {
    return evaluateVoteApprovalPolicy(summarizeProposalVotes(proposalId), policy);
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
    getSchemaMetadata,
    getVote,
    evaluateProposalApproval,
    listVotes,
    migrationVersion: schemaMetadata.migrationVersion,
    recordVote,
    sqlitePath,
    summarizeProposalVotes
  };
}

module.exports = {
  DEFAULT_VOTE_APPROVAL_POLICY,
  REQUIRED_VOTE_AUTHORIZATION_EVIDENCE_CHECKS: clone(REQUIRED_VOTE_AUTHORIZATION_EVIDENCE_CHECKS),
  REQUIRED_VOTE_AUTHORIZATION_READINESS_CHECKS: clone(REQUIRED_VOTE_AUTHORIZATION_READINESS_CHECKS),
  REQUIRED_VOTE_ROUTE_SURFACES: clone(REQUIRED_VOTE_ROUTE_SURFACES),
  V6_VOTE_AUTHORIZATION_READINESS_GATE_VERSION,
  assertV6VoteAuthorizationReadinessGateSafe,
  buildV6VoteAuthorizationReadinessGate,
  createCivicVoteStore,
  evaluateVoteApprovalPolicy,
  normalizeVoteApprovalPolicy
};
