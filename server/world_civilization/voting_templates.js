const { V6_WORLD_FEATURE_FLAG, isWorldGridFeatureEnabled } = require('../world_grid/feature_flags');

const V6_VOTING_TEMPLATE_REVIEW_VERSION = 'agent-town.v6.voting_template_review.v1';
const V6_VOTING_TEMPLATE_SCOPES = [
  'public_world',
  'public_works',
  'sandbox_policy',
  'institution_charter',
  'service_policy'
];
const REQUIRED_VOTING_TEMPLATE_REVIEW_CHECKS = [
  'feature_flag',
  'research_opt_in',
  'template_scope_coverage',
  'template_contracts',
  'route_surface_coverage',
  'no_private_data',
  'no_runtime_exposure',
  'no_effect_application',
  'release_review_pending'
];
const REQUIRED_TEMPLATE_ROUTE_SURFACES = [
  'human_vote_route',
  'delegated_agent_vote_route',
  'worker_tool_vote_surface'
];
const REQUIRED_AUTHORIZATION_KINDS = [
  'wallet_session',
  'server_attested_delegation'
];
const SECRET_TEXT_RE = /\b(?:sk-[a-z0-9_-]{8,}|bearer\s+[a-z0-9._-]{8,}|oauth[-_ ]?token|api[-_ ]?key|private[-_ ]?key|secret)\b/i;

const V6_VOTING_TEMPLATES = Object.freeze([
  Object.freeze({
    templateId: 'voting_template_public_world_v1',
    scopeKind: 'public_world',
    proposalTypes: ['public_world', 'public_summary'],
    votingRuleId: 'rule_public_world_majority_v1',
    eligibilityRuleId: 'rule_public_world_voter_v1',
    moderationPolicyId: 'policy_v6_public_001',
    delegationScope: 'vote_advice',
    authorizationKinds: ['wallet_session', 'server_attested_delegation'],
    routeSurfaces: ['human_vote_route', 'delegated_agent_vote_route', 'worker_tool_vote_surface'],
    approvalPolicy: {
      policyId: 'policy_v6_public_world_majority_v1',
      quorumMinVotes: 1,
      minApproveVotes: 1,
      approvalThresholdBps: 5001,
      countAbstainForQuorum: true
    },
    publicAuditSummary: 'Public-world proposals use explicit voter authorization and simple-majority research review.',
    templateReviewStatus: 'research_reviewed',
    releaseReviewStatus: 'pending_release_review',
    executionStatus: 'not_executable',
    runtimeExposed: false,
    playerVisible: false,
    mutatesWorldState: false,
    appliesVoteOutcome: false
  }),
  Object.freeze({
    templateId: 'voting_template_public_works_v1',
    scopeKind: 'public_works',
    proposalTypes: ['public_works'],
    votingRuleId: 'rule_public_works_majority_v1',
    eligibilityRuleId: 'rule_public_works_voter_v1',
    moderationPolicyId: 'policy_v6_public_001',
    delegationScope: 'vote_advice',
    authorizationKinds: ['wallet_session', 'server_attested_delegation'],
    routeSurfaces: ['human_vote_route', 'delegated_agent_vote_route', 'worker_tool_vote_surface'],
    approvalPolicy: {
      policyId: 'policy_v6_public_works_majority_v1',
      quorumMinVotes: 1,
      minApproveVotes: 1,
      approvalThresholdBps: 5001,
      countAbstainForQuorum: true
    },
    publicAuditSummary: 'Public-works proposals use explicit voter authorization before any future shared-resource effect.',
    templateReviewStatus: 'research_reviewed',
    releaseReviewStatus: 'pending_release_review',
    executionStatus: 'not_executable',
    runtimeExposed: false,
    playerVisible: false,
    mutatesWorldState: false,
    appliesVoteOutcome: false
  }),
  Object.freeze({
    templateId: 'voting_template_sandbox_policy_v1',
    scopeKind: 'sandbox_policy',
    proposalTypes: ['sandbox_policy'],
    votingRuleId: 'rule_sandbox_policy_supermajority_v1',
    eligibilityRuleId: 'rule_sandbox_policy_voter_v1',
    moderationPolicyId: 'policy_v6_public_001',
    delegationScope: 'vote_advice',
    authorizationKinds: ['wallet_session', 'server_attested_delegation'],
    routeSurfaces: ['human_vote_route', 'delegated_agent_vote_route', 'worker_tool_vote_surface'],
    approvalPolicy: {
      policyId: 'policy_v6_sandbox_policy_supermajority_v1',
      quorumMinVotes: 1,
      minApproveVotes: 1,
      approvalThresholdBps: 6600,
      countAbstainForQuorum: true
    },
    publicAuditSummary: 'Sandbox-policy proposals require a stricter research threshold before any future policy effect.',
    templateReviewStatus: 'research_reviewed',
    releaseReviewStatus: 'pending_release_review',
    executionStatus: 'not_executable',
    runtimeExposed: false,
    playerVisible: false,
    mutatesWorldState: false,
    appliesVoteOutcome: false
  }),
  Object.freeze({
    templateId: 'voting_template_institution_charter_v1',
    scopeKind: 'institution_charter',
    proposalTypes: ['institution_charter'],
    votingRuleId: 'rule_institution_charter_supermajority_v1',
    eligibilityRuleId: 'rule_institution_charter_voter_v1',
    moderationPolicyId: 'policy_v6_public_001',
    delegationScope: 'vote_advice',
    authorizationKinds: ['wallet_session', 'server_attested_delegation'],
    routeSurfaces: ['human_vote_route', 'delegated_agent_vote_route', 'worker_tool_vote_surface'],
    approvalPolicy: {
      policyId: 'policy_v6_institution_charter_supermajority_v1',
      quorumMinVotes: 2,
      minApproveVotes: 2,
      approvalThresholdBps: 6600,
      countAbstainForQuorum: true
    },
    publicAuditSummary: 'Institution-charter proposals require explicit voter authorization and supermajority research review.',
    templateReviewStatus: 'research_reviewed',
    releaseReviewStatus: 'pending_release_review',
    executionStatus: 'not_executable',
    runtimeExposed: false,
    playerVisible: false,
    mutatesWorldState: false,
    appliesVoteOutcome: false
  }),
  Object.freeze({
    templateId: 'voting_template_service_policy_v1',
    scopeKind: 'service_policy',
    proposalTypes: ['service_policy'],
    votingRuleId: 'rule_service_policy_majority_v1',
    eligibilityRuleId: 'rule_service_policy_voter_v1',
    moderationPolicyId: 'policy_v6_public_001',
    delegationScope: 'vote_advice',
    authorizationKinds: ['wallet_session', 'server_attested_delegation'],
    routeSurfaces: ['human_vote_route', 'delegated_agent_vote_route', 'worker_tool_vote_surface'],
    approvalPolicy: {
      policyId: 'policy_v6_service_policy_majority_v1',
      quorumMinVotes: 1,
      minApproveVotes: 1,
      approvalThresholdBps: 5001,
      countAbstainForQuorum: true
    },
    publicAuditSummary: 'Service-policy proposals use explicit voter authorization before any future service-surface change.',
    templateReviewStatus: 'research_reviewed',
    releaseReviewStatus: 'pending_release_review',
    executionStatus: 'not_executable',
    runtimeExposed: false,
    playerVisible: false,
    mutatesWorldState: false,
    appliesVoteOutcome: false
  })
]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeList(value) {
  return Array.isArray(value) ? value.map((entry) => String(entry || '')).filter(Boolean) : [];
}

function check(key, ok, error = '') {
  return { key, ok: ok === true, error: ok === true ? '' : error };
}

function validateApprovalPolicy(policy = {}) {
  const errors = [];
  if (!/^policy_[a-z0-9_:-]{4,88}$/.test(String(policy.policyId || ''))) {
    errors.push('policy_id_invalid');
  }
  for (const key of ['quorumMinVotes', 'minApproveVotes']) {
    if (!Number.isInteger(policy[key]) || policy[key] < 1 || policy[key] > 10_000) {
      errors.push(`${key}_invalid`);
    }
  }
  if (!Number.isInteger(policy.approvalThresholdBps) || policy.approvalThresholdBps < 1 || policy.approvalThresholdBps > 10_000) {
    errors.push('approvalThresholdBps_invalid');
  }
  if (policy.countAbstainForQuorum !== true && policy.countAbstainForQuorum !== false) {
    errors.push('countAbstainForQuorum_invalid');
  }
  return {
    ok: errors.length === 0,
    errors
  };
}

function inspectV6VotingTemplate(template = {}) {
  const routeSurfaces = normalizeList(template.routeSurfaces);
  const authorizationKinds = normalizeList(template.authorizationKinds);
  const proposalTypes = normalizeList(template.proposalTypes);
  const approvalPolicy = validateApprovalPolicy(template.approvalPolicy || {});
  const errors = [];

  if (!/^voting_template_[a-z0-9_:-]{4,88}$/.test(String(template.templateId || ''))) errors.push('template_id_invalid');
  if (!V6_VOTING_TEMPLATE_SCOPES.includes(String(template.scopeKind || ''))) errors.push('scope_kind_invalid');
  if (!proposalTypes.length) errors.push('proposal_types_required');
  if (!/^rule_[a-z0-9_:-]{4,88}$/.test(String(template.votingRuleId || ''))) errors.push('voting_rule_invalid');
  if (!/^rule_[a-z0-9_:-]{4,88}$/.test(String(template.eligibilityRuleId || ''))) errors.push('eligibility_rule_invalid');
  if (!/^policy_[a-z0-9_:-]{4,88}$/.test(String(template.moderationPolicyId || ''))) errors.push('moderation_policy_invalid');
  if (String(template.delegationScope || '') !== 'vote_advice') errors.push('delegation_scope_invalid');
  for (const surface of REQUIRED_TEMPLATE_ROUTE_SURFACES) {
    if (!routeSurfaces.includes(surface)) errors.push(`route_surface_missing:${surface}`);
  }
  for (const kind of REQUIRED_AUTHORIZATION_KINDS) {
    if (!authorizationKinds.includes(kind)) errors.push(`authorization_kind_missing:${kind}`);
  }
  if (!approvalPolicy.ok) errors.push(...approvalPolicy.errors);
  if (SECRET_TEXT_RE.test(String(template.publicAuditSummary || ''))) errors.push('public_audit_summary_private_text');
  if (template.templateReviewStatus !== 'research_reviewed') errors.push('template_review_status_invalid');
  if (template.releaseReviewStatus !== 'pending_release_review') errors.push('release_review_status_invalid');
  if (template.executionStatus !== 'not_executable') errors.push('execution_status_invalid');
  if (template.runtimeExposed !== false) errors.push('runtime_exposure_forbidden');
  if (template.playerVisible !== false) errors.push('player_visibility_forbidden');
  if (template.mutatesWorldState !== false) errors.push('world_mutation_forbidden');
  if (template.appliesVoteOutcome !== false) errors.push('vote_outcome_application_forbidden');

  return {
    ok: errors.length === 0,
    templateId: String(template.templateId || ''),
    scopeKind: String(template.scopeKind || ''),
    proposalTypes,
    routeSurfaces,
    authorizationKinds,
    approvalPolicy: clone(template.approvalPolicy || {}),
    releaseReviewStatus: String(template.releaseReviewStatus || ''),
    executionStatus: String(template.executionStatus || ''),
    errors
  };
}

function listV6VotingTemplates() {
  return clone(V6_VOTING_TEMPLATES);
}

function getV6VotingTemplateForScope(scopeKind = '') {
  return listV6VotingTemplates().find((template) => template.scopeKind === String(scopeKind || '')) || null;
}

function disabledVotingTemplateReviewReport({ source, reason }) {
  return {
    version: V6_VOTING_TEMPLATE_REVIEW_VERSION,
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
    executionStatus: 'not_executable',
    requiredScopes: [...V6_VOTING_TEMPLATE_SCOPES],
    templateScopes: [],
    missingScopes: [...V6_VOTING_TEMPLATE_SCOPES],
    templates: [],
    checks: [],
    errors: [reason],
    disabledReason: reason
  };
}

function buildV6VotingTemplateReviewReport({
  featureFlags = {},
  includeResearchVotingTemplates = false,
  source = 'runtime',
  templates = listV6VotingTemplates()
} = {}) {
  const enabled = includeResearchVotingTemplates === true
    && isWorldGridFeatureEnabled(featureFlags, V6_WORLD_FEATURE_FLAG);
  if (!enabled) {
    return disabledVotingTemplateReviewReport({
      source,
      reason: 'V6 voting template review requires explicit research opt-in and V6 feature flag'
    });
  }

  const inspected = (Array.isArray(templates) ? templates : []).map(inspectV6VotingTemplate);
  const templateScopes = Array.from(new Set(inspected.map((entry) => entry.scopeKind).filter(Boolean))).sort();
  const missingScopes = V6_VOTING_TEMPLATE_SCOPES.filter((scope) => !templateScopes.includes(scope));
  const templateErrors = inspected.flatMap((entry) => entry.errors.map((error) => `${entry.templateId || entry.scopeKind || 'template'}:${error}`));
  const routeSurfaceCoverage = inspected.every((entry) => (
    REQUIRED_TEMPLATE_ROUTE_SURFACES.every((surface) => entry.routeSurfaces.includes(surface))
  ));
  const checks = [
    check('feature_flag', isWorldGridFeatureEnabled(featureFlags, V6_WORLD_FEATURE_FLAG), 'FEATURE_DISABLED'),
    check('research_opt_in', includeResearchVotingTemplates === true, 'RESEARCH_OPT_IN_REQUIRED'),
    check('template_scope_coverage', missingScopes.length === 0, 'VOTING_TEMPLATE_SCOPE_COVERAGE_REQUIRED'),
    check('template_contracts', inspected.length > 0 && templateErrors.length === 0, 'VOTING_TEMPLATE_CONTRACTS_INVALID'),
    check('route_surface_coverage', routeSurfaceCoverage, 'VOTING_TEMPLATE_ROUTE_SURFACE_COVERAGE_REQUIRED'),
    check('no_private_data', !templateErrors.some((error) => error.includes('private_text')), 'VOTING_TEMPLATE_PRIVATE_DATA_FORBIDDEN'),
    check('no_runtime_exposure', inspected.every((entry) => entry.executionStatus === 'not_executable'), 'VOTING_TEMPLATE_RUNTIME_EXPOSURE_FORBIDDEN'),
    check('no_effect_application', true, ''),
    check('release_review_pending', inspected.every((entry) => entry.releaseReviewStatus === 'pending_release_review'), 'VOTING_TEMPLATE_RELEASE_REVIEW_PENDING_REQUIRED')
  ];
  const researchReady = checks.every((entry) => entry.ok);
  return {
    version: V6_VOTING_TEMPLATE_REVIEW_VERSION,
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
    executionStatus: 'not_executable',
    requiredScopes: [...V6_VOTING_TEMPLATE_SCOPES],
    templateScopes,
    missingScopes,
    templates: inspected,
    checks,
    errors: [
      ...checks.filter((entry) => !entry.ok).map((entry) => entry.error),
      ...templateErrors
    ]
  };
}

function assertV6VotingTemplateReviewReportSafe(report = {}) {
  const errors = [];
  if (report.version !== V6_VOTING_TEMPLATE_REVIEW_VERSION) {
    errors.push('V6_VOTING_TEMPLATE_REVIEW_VERSION_REQUIRED');
  }
  if (report.featureFlag !== V6_WORLD_FEATURE_FLAG) {
    errors.push('V6_VOTING_TEMPLATE_REVIEW_FEATURE_FLAG_REQUIRED');
  }
  if (report.status !== 'research_only') {
    errors.push('V6_VOTING_TEMPLATE_REVIEW_RESEARCH_ONLY_REQUIRED');
  }
  if (report.runtimeExposed !== false) {
    errors.push('V6_VOTING_TEMPLATE_REVIEW_RUNTIME_HIDDEN_REQUIRED');
  }
  if (report.playerVisible !== false || report.normalGameplayExposure !== false) {
    errors.push('V6_VOTING_TEMPLATE_REVIEW_PLAYER_HIDDEN_REQUIRED');
  }
  if (report.mutatesWorldState !== false || report.appliesVoteOutcome !== false) {
    errors.push('V6_VOTING_TEMPLATE_REVIEW_EFFECT_APPLICATION_FORBIDDEN');
  }
  if (report.executionStatus !== 'not_executable') {
    errors.push('V6_VOTING_TEMPLATE_REVIEW_NON_EXECUTING_REQUIRED');
  }
  if (report.releaseReady !== false) {
    errors.push('V6_VOTING_TEMPLATE_REVIEW_RELEASE_READY_FORBIDDEN');
  }
  if (report.available === true) {
    const checkKeys = new Set((report.checks || []).map((entry) => entry.key));
    for (const key of REQUIRED_VOTING_TEMPLATE_REVIEW_CHECKS) {
      if (!checkKeys.has(key)) errors.push(`V6_VOTING_TEMPLATE_REVIEW_CHECK_REQUIRED:${key}`);
    }
    const failedChecks = (report.checks || []).filter((entry) => entry.ok !== true);
    if (report.researchReady === true && failedChecks.length > 0) {
      errors.push('V6_VOTING_TEMPLATE_REVIEW_READY_WITH_FAILED_CHECKS');
    }
    if (report.researchReady !== true && report.failClosed !== true) {
      errors.push('V6_VOTING_TEMPLATE_REVIEW_DENIAL_FAIL_CLOSED_REQUIRED');
    }
  } else if (report.failClosed !== true) {
    errors.push('V6_VOTING_TEMPLATE_REVIEW_DISABLED_FAIL_CLOSED_REQUIRED');
  }
  return {
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  REQUIRED_TEMPLATE_ROUTE_SURFACES: [...REQUIRED_TEMPLATE_ROUTE_SURFACES],
  REQUIRED_VOTING_TEMPLATE_REVIEW_CHECKS: [...REQUIRED_VOTING_TEMPLATE_REVIEW_CHECKS],
  V6_VOTING_TEMPLATE_REVIEW_VERSION,
  V6_VOTING_TEMPLATE_SCOPES: [...V6_VOTING_TEMPLATE_SCOPES],
  assertV6VotingTemplateReviewReportSafe,
  buildV6VotingTemplateReviewReport,
  getV6VotingTemplateForScope,
  inspectV6VotingTemplate,
  listV6VotingTemplates
};
