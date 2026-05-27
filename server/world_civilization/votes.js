const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const { V6_WORLD_FEATURE_FLAG, isWorldGridFeatureEnabled } = require('../world_grid/feature_flags');
const { createCivicAuditLedger, sha256, stableJson } = require('./audit_ledger');
const {
  V6_CIVIC_MUTATION_SECURITY_VERSION,
  assertV6CivicMutationSecuritySafe
} = require('./mutation_security');
const { PROPOSAL_STATUS_READY_FOR_VOTE } = require('./proposals');
const { validateCivicVote } = require('./schemas');
const {
  V6_VOTING_TEMPLATE_REVIEW_VERSION,
  assertV6VotingTemplateReviewReportSafe
} = require('./voting_templates');
const {
  ensureCivicSqliteSchemaMetadata,
  readCivicSqliteSchemaMetadata
} = require('./sqlite_schema');

const MIGRATION_VERSION = 'v1';
const STORE_KEY = 'votes';
const V6_VOTE_AUTHORIZATION_READINESS_GATE_VERSION = 'agent-town.v6.vote_authorization_readiness.v1';
const V6_VOTE_ROUTE_AUTHORIZATION_VERSION = 'agent-town.v6.vote_route_authorization.v1';
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
const REQUIRED_VOTE_ROUTE_AUTHORIZATION_CHECKS = [
  'feature_flag',
  'research_opt_in',
  'route_surface',
  'vote_payload',
  'mutation_security',
  'proposal_exists',
  'proposal_ready_for_vote',
  'voter_authorization',
  'eligibility',
  'route_actor_binding',
  'no_runtime_exposure',
  'no_effect_application'
];
const VOTE_ROUTE_SURFACE_RULES = Object.freeze({
  human_vote_route: Object.freeze({
    routeSurface: 'human_vote_route',
    actorKind: 'human',
    authorizationKind: 'wallet_session',
    requiredDelegationScope: ''
  }),
  delegated_agent_vote_route: Object.freeze({
    routeSurface: 'delegated_agent_vote_route',
    actorKind: 'agent',
    authorizationKind: 'server_attested_delegation',
    requiredDelegationScope: 'vote_advice'
  }),
  worker_tool_vote_surface: Object.freeze({
    routeSurface: 'worker_tool_vote_surface',
    actorKind: 'agent',
    authorizationKind: 'server_attested_delegation',
    requiredDelegationScope: 'vote_advice'
  })
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeList(value) {
  return Array.isArray(value) ? value.map((entry) => String(entry || '')).filter(Boolean) : [];
}

function check(key, ok, error = '') {
  return { key, ok: ok === true, error: ok === true ? '' : error };
}

function inspectVotingTemplateReviewReport(report = null) {
  if (!report || typeof report !== 'object') {
    return {
      ok: false,
      version: '',
      researchReady: false,
      releaseReady: false,
      missingScopes: [],
      errors: ['VOTING_TEMPLATE_REVIEW_REPORT_REQUIRED']
    };
  }
  const safety = assertV6VotingTemplateReviewReportSafe(report);
  const ok = safety.ok === true
    && report.version === V6_VOTING_TEMPLATE_REVIEW_VERSION
    && report.researchReady === true
    && report.releaseReady === false
    && report.runtimeExposed === false
    && report.playerVisible === false
    && report.normalGameplayExposure === false
    && report.mutatesWorldState === false
    && report.appliesVoteOutcome === false
    && report.executionStatus === 'not_executable'
    && Array.isArray(report.missingScopes)
    && report.missingScopes.length === 0;
  return {
    ok,
    version: String(report.version || ''),
    researchReady: report.researchReady === true,
    releaseReady: report.releaseReady === true,
    templateScopes: Array.isArray(report.templateScopes) ? report.templateScopes : [],
    missingScopes: Array.isArray(report.missingScopes) ? report.missingScopes : [],
    errors: [
      ...(safety.errors || []),
      ...(Array.isArray(report.errors) ? report.errors : [])
    ]
  };
}

function disabledVoteRouteAuthorizationEnvelope({ source, routeSurface, reason }) {
  return {
    version: V6_VOTE_ROUTE_AUTHORIZATION_VERSION,
    status: 'research_only',
    source,
    featureFlag: V6_WORLD_FEATURE_FLAG,
    available: false,
    authorized: false,
    failClosed: true,
    runtimeExposed: false,
    playerVisible: false,
    normalGameplayExposure: false,
    recordsVote: false,
    appliesVoteOutcome: false,
    mutatesWorldState: false,
    exposesPrivateData: false,
    executionStatus: 'not_executable',
    routeSurface: String(routeSurface || ''),
    voteId: '',
    proposalId: '',
    voterAccountId: '',
    proposalStatus: '',
    mutationSecurity: null,
    checks: [],
    errors: [reason],
    disabledReason: reason
  };
}

function mutationSecurityEnvelopeOk(mutationSecurityEnvelope = null, vote = null, routeSurface = '') {
  if (!mutationSecurityEnvelope || typeof mutationSecurityEnvelope !== 'object') {
    return { ok: false, errors: ['MUTATION_SECURITY_ENVELOPE_REQUIRED'] };
  }
  const safety = assertV6CivicMutationSecuritySafe(mutationSecurityEnvelope);
  const errors = [...(safety.errors || [])];
  if (safety.ok !== true) errors.push('MUTATION_SECURITY_ENVELOPE_UNSAFE');
  if (mutationSecurityEnvelope.version !== V6_CIVIC_MUTATION_SECURITY_VERSION) {
    errors.push('MUTATION_SECURITY_VERSION_REQUIRED');
  }
  if (mutationSecurityEnvelope.allowed !== true) errors.push('MUTATION_SECURITY_ALLOWED_REQUIRED');
  if (mutationSecurityEnvelope.available !== true) errors.push('MUTATION_SECURITY_AVAILABLE_REQUIRED');
  if (mutationSecurityEnvelope.mutationApplied !== false) errors.push('MUTATION_SECURITY_NON_MUTATING_REQUIRED');
  if (mutationSecurityEnvelope.executionStatus !== 'not_executable') errors.push('MUTATION_SECURITY_NON_EXECUTING_REQUIRED');
  if (String(mutationSecurityEnvelope.surface || '') !== String(routeSurface || '')) {
    errors.push('MUTATION_SECURITY_SURFACE_MISMATCH');
  }
  if (vote) {
    if (String(mutationSecurityEnvelope.idempotencyKey || '') !== String(vote.idempotencyKey || '')) {
      errors.push('MUTATION_SECURITY_IDEMPOTENCY_MISMATCH');
    }
    if (String(mutationSecurityEnvelope.ownerAccountId || '') !== String(vote.voter?.accountId || '')) {
      errors.push('MUTATION_SECURITY_OWNER_MISMATCH');
    }
    if (String(mutationSecurityEnvelope.sessionAccountId || '') !== String(vote.voter?.accountId || '')) {
      errors.push('MUTATION_SECURITY_SESSION_MISMATCH');
    }
  }
  return {
    ok: errors.length === 0,
    errors
  };
}

function routeActorBindingOk({ mutationSecurityEnvelope = null, vote = null, routeRule = null } = {}) {
  if (!mutationSecurityEnvelope || !vote || !routeRule) return false;
  const actor = mutationSecurityEnvelope.actor || {};
  if (routeRule.actorKind === 'human') {
    return actor.kind === 'human'
      && String(actor.accountId || '') === String(vote.voter?.accountId || '');
  }
  if (routeRule.actorKind === 'agent') {
    const proof = mutationSecurityEnvelope.delegationProof || {};
    return actor.kind === 'agent'
      && proof.proofStatus === 'valid'
      && proof.requiredScope === routeRule.requiredDelegationScope
      && String(proof.principalAccountId || '') === String(vote.voter?.accountId || '');
  }
  return false;
}

function buildV6VoteRouteAuthorizationEnvelope({
  featureFlags = {},
  includeResearchVoteRouteAuth = false,
  source = 'runtime',
  routeSurface = '',
  rawVote = {},
  proposalStore = null,
  mutationSecurityEnvelope = null,
  nowMs = Date.now()
} = {}) {
  const featureEnabled = isWorldGridFeatureEnabled(featureFlags, V6_WORLD_FEATURE_FLAG);
  const normalizedRouteSurface = String(routeSurface || '').trim();
  if (!featureEnabled || includeResearchVoteRouteAuth !== true) {
    return disabledVoteRouteAuthorizationEnvelope({
      source,
      routeSurface: normalizedRouteSurface,
      reason: 'V6 vote route authorization requires explicit research opt-in and V6 feature flag'
    });
  }

  const validation = validateCivicVote(rawVote);
  const vote = validation.value;
  const routeRule = VOTE_ROUTE_SURFACE_RULES[normalizedRouteSurface] || null;
  const proposal = vote && proposalStore && typeof proposalStore.getProposal === 'function'
    ? proposalStore.getProposal(vote.proposalId)
    : null;
  const proposalReadyForVote = proposal?.status === PROPOSAL_STATUS_READY_FOR_VOTE;
  const proposalActive = proposal && proposal.expiresAtMs > nowMs;
  const mutationSecurity = mutationSecurityEnvelopeOk(mutationSecurityEnvelope, vote, normalizedRouteSurface);
  const voterAuthorizationOk = Boolean(vote)
    && vote.authorization?.serverVerified === true
    && vote.authorization?.kind === routeRule?.authorizationKind
    && vote.authorization?.subjectAccountId === vote.voter?.accountId;
  const eligibilityOk = Boolean(vote?.eligibilityProof?.eligible === true && vote.eligibilityProof.ruleId);
  const routeActorOk = routeActorBindingOk({ mutationSecurityEnvelope, vote, routeRule });
  const checks = [
    check('feature_flag', featureEnabled, 'FEATURE_DISABLED'),
    check('research_opt_in', includeResearchVoteRouteAuth === true, 'RESEARCH_OPT_IN_REQUIRED'),
    check('route_surface', Boolean(routeRule), 'VOTE_ROUTE_SURFACE_UNSUPPORTED'),
    check('vote_payload', validation.ok, 'CIVIC_VOTE_INVALID'),
    check('mutation_security', mutationSecurity.ok, mutationSecurity.errors[0] || 'MUTATION_SECURITY_REQUIRED'),
    check('proposal_exists', Boolean(proposal), 'CIVIC_VOTE_PROPOSAL_REQUIRED'),
    check('proposal_ready_for_vote', proposalReadyForVote && proposalActive, 'CIVIC_VOTE_PROPOSAL_NOT_READY'),
    check('voter_authorization', voterAuthorizationOk, 'VOTE_AUTHORIZATION_ROUTE_MISMATCH'),
    check('eligibility', eligibilityOk, 'VOTE_ELIGIBILITY_REQUIRED'),
    check('route_actor_binding', routeActorOk, 'VOTE_ROUTE_ACTOR_BINDING_REQUIRED'),
    check('no_runtime_exposure', true, ''),
    check('no_effect_application', true, '')
  ];
  const authorized = checks.every((entry) => entry.ok);
  return {
    version: V6_VOTE_ROUTE_AUTHORIZATION_VERSION,
    status: 'research_only',
    source,
    featureFlag: V6_WORLD_FEATURE_FLAG,
    available: true,
    authorized,
    failClosed: authorized !== true,
    runtimeExposed: false,
    playerVisible: false,
    normalGameplayExposure: false,
    recordsVote: false,
    appliesVoteOutcome: false,
    mutatesWorldState: false,
    exposesPrivateData: false,
    executionStatus: 'not_executable',
    routeSurface: normalizedRouteSurface,
    routeRule: routeRule ? clone(routeRule) : null,
    voteId: String(vote?.voteId || ''),
    proposalId: String(vote?.proposalId || ''),
    voterAccountId: String(vote?.voter?.accountId || ''),
    proposalStatus: String(proposal?.status || ''),
    proposalExpiresAtMs: proposal ? Number(proposal.expiresAtMs || 0) : 0,
    mutationSecurity: {
      ok: mutationSecurity.ok,
      errors: mutationSecurity.errors,
      surface: String(mutationSecurityEnvelope?.surface || ''),
      actorKind: String(mutationSecurityEnvelope?.actor?.kind || ''),
      delegationProofStatus: String(mutationSecurityEnvelope?.delegationProof?.proofStatus || '')
    },
    checks,
    errors: checks.filter((entry) => !entry.ok).map((entry) => entry.error)
  };
}

function assertV6VoteRouteAuthorizationEnvelopeSafe(report = {}) {
  const errors = [];
  if (report.version !== V6_VOTE_ROUTE_AUTHORIZATION_VERSION) {
    errors.push('V6_VOTE_ROUTE_AUTHORIZATION_VERSION_REQUIRED');
  }
  if (report.featureFlag !== V6_WORLD_FEATURE_FLAG) {
    errors.push('V6_VOTE_ROUTE_AUTHORIZATION_FEATURE_FLAG_REQUIRED');
  }
  if (report.status !== 'research_only') {
    errors.push('V6_VOTE_ROUTE_AUTHORIZATION_RESEARCH_ONLY_REQUIRED');
  }
  if (report.runtimeExposed !== false) {
    errors.push('V6_VOTE_ROUTE_AUTHORIZATION_RUNTIME_HIDDEN_REQUIRED');
  }
  if (report.playerVisible !== false) {
    errors.push('V6_VOTE_ROUTE_AUTHORIZATION_PLAYER_HIDDEN_REQUIRED');
  }
  if (report.normalGameplayExposure !== false) {
    errors.push('V6_VOTE_ROUTE_AUTHORIZATION_NORMAL_GAMEPLAY_FORBIDDEN');
  }
  if (report.recordsVote !== false) {
    errors.push('V6_VOTE_ROUTE_AUTHORIZATION_RECORDING_FORBIDDEN');
  }
  if (report.appliesVoteOutcome !== false) {
    errors.push('V6_VOTE_ROUTE_AUTHORIZATION_OUTCOME_APPLICATION_FORBIDDEN');
  }
  if (report.mutatesWorldState !== false) {
    errors.push('V6_VOTE_ROUTE_AUTHORIZATION_WORLD_MUTATION_FORBIDDEN');
  }
  if (report.exposesPrivateData !== false) {
    errors.push('V6_VOTE_ROUTE_AUTHORIZATION_PRIVATE_DATA_FORBIDDEN');
  }
  if (report.executionStatus !== 'not_executable') {
    errors.push('V6_VOTE_ROUTE_AUTHORIZATION_NON_EXECUTING_REQUIRED');
  }
  if (report.available === true) {
    const checkKeys = new Set((report.checks || []).map((entry) => entry.key));
    for (const key of REQUIRED_VOTE_ROUTE_AUTHORIZATION_CHECKS) {
      if (!checkKeys.has(key)) errors.push(`V6_VOTE_ROUTE_AUTHORIZATION_CHECK_REQUIRED:${key}`);
    }
    const failedChecks = (report.checks || []).filter((entry) => entry.ok !== true);
    if (report.authorized === true && failedChecks.length > 0) {
      errors.push('V6_VOTE_ROUTE_AUTHORIZATION_ALLOWED_WITH_FAILED_CHECKS');
    }
    if (report.authorized !== true && report.failClosed !== true) {
      errors.push('V6_VOTE_ROUTE_AUTHORIZATION_DENIAL_FAIL_CLOSED_REQUIRED');
    }
  } else if (report.failClosed !== true) {
    errors.push('V6_VOTE_ROUTE_AUTHORIZATION_DISABLED_FAIL_CLOSED_REQUIRED');
  }
  return {
    ok: errors.length === 0,
    errors
  };
}

function inspectVoteAuthorizationReadinessEvidence(evidence = {}) {
  const checks = normalizeList(evidence.checks);
  const routeSurfaces = normalizeList(evidence.routeSurfaces);
  const votingTemplateReview = inspectVotingTemplateReviewReport(evidence.votingTemplateReviewReport);
  const missingChecks = REQUIRED_VOTE_AUTHORIZATION_EVIDENCE_CHECKS.filter((entry) => !checks.includes(entry));
  const missingRouteSurfaces = REQUIRED_VOTE_ROUTE_SURFACES.filter((entry) => !routeSurfaces.includes(entry));
  const routeEdgeAuthReviewed = evidence.routeEdgeAuthReviewed === true;
  const votingTemplatesReviewed = evidence.votingTemplatesReviewed === true && votingTemplateReview.ok === true;
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
    votingTemplateReview,
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
    if (report.researchReady === true && evidence.votingTemplateReview?.ok !== true) {
      errors.push('V6_VOTE_AUTHORIZATION_READINESS_TEMPLATE_REVIEW_REQUIRED');
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
    beforeSummary: `No recorded civic vote existed for ${vote.proposalId} from this voter before ${vote.receiptId}.`,
    afterSummary: `Recorded ${vote.choice} vote ${vote.voteId} for ${vote.proposalId}; vote outcome remains non-executing.`,
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
  REQUIRED_VOTE_ROUTE_AUTHORIZATION_CHECKS: clone(REQUIRED_VOTE_ROUTE_AUTHORIZATION_CHECKS),
  REQUIRED_VOTE_ROUTE_SURFACES: clone(REQUIRED_VOTE_ROUTE_SURFACES),
  V6_VOTE_AUTHORIZATION_READINESS_GATE_VERSION,
  V6_VOTE_ROUTE_AUTHORIZATION_VERSION,
  assertV6VoteRouteAuthorizationEnvelopeSafe,
  assertV6VoteAuthorizationReadinessGateSafe,
  buildV6VoteRouteAuthorizationEnvelope,
  buildV6VoteAuthorizationReadinessGate,
  createCivicVoteStore,
  evaluateVoteApprovalPolicy,
  normalizeVoteApprovalPolicy
};
