const crypto = require('crypto');

const V6_ABUSE_CASE_TARGETS_VERSION = 'agent-town.v6.abuse_case_targets.v1';
const REQUIRED_ABUSE_CASE_TARGET_KEYS = [
  'spam',
  'harassment',
  'impersonation',
  'unauthorized_mutation',
  'delegation_abuse',
  'delegation_scope_mismatch',
  'delegation_budget_abuse',
  'vote_reputation_farming',
  'public_works_spend_abuse',
  'moderation_escalation',
  'rollback_bypass',
  'public_autonomous_agent_mutation'
];
const REQUIRED_ABUSE_CASE_RELEASE_GAPS = [
  'trust_safety_signoff_required',
  'abuse_case_table_required',
  'moderation_escalation_playbook_required',
  'browser_abuse_surface_smoke_required',
  'rate_limit_calibration_required',
  'incident_response_link_required',
  'release_candidate_review_required'
];

const V6_ABUSE_CASE_TARGETS = [
  {
    key: 'spam',
    surface: 'proposal_vote_public_works_submission_surfaces',
    requiredEvidence: 'Bound proposal, vote, public works, service, and sandbox submission spam with rate limits, idempotency, moderation queues, and audit trails.',
    currentEvidence: 'server/world_civilization/mutation_security.js',
    releaseEvidenceRequired: 'spam_abuse_case_table'
  },
  {
    key: 'harassment',
    surface: 'public_civic_text_profiles_agent_content',
    requiredEvidence: 'Future public civic text, profiles, agent-authored content, and moderation appeals need harassment handling before publication.',
    currentEvidence: 'server/world_civilization/moderation.js',
    releaseEvidenceRequired: 'harassment_moderation_escalation_table'
  },
  {
    key: 'impersonation',
    surface: 'session_wallet_agent_identity_public_profiles',
    requiredEvidence: 'Civic identity surfaces must prevent session/wallet confusion, agent impersonation, public profile spoofing, and forged delegation receipts.',
    currentEvidence: 'server/world_civilization/session_auth_targets.js',
    releaseEvidenceRequired: 'impersonation_identity_boundary_review'
  },
  {
    key: 'unauthorized_mutation',
    surface: 'v6_civic_mutation_routes_and_worker_tools',
    requiredEvidence: 'All future civic mutations must pass same-origin, CSRF, session/wallet, delegation, idempotency, and owner/surface rate-limit checks.',
    currentEvidence: 'docs/security/V6_CIVIC_MUTATION_SECURITY_PLAN.md',
    releaseEvidenceRequired: 'unauthorized_mutation_abuse_smoke'
  },
  {
    key: 'delegation_abuse',
    surface: 'human_to_agent_delegation',
    requiredEvidence: 'Delegated agents need explicit scope, expiry, revocation, budget, principal binding, and no backend shortcut path.',
    currentEvidence: 'server/world_civilization/delegations.js',
    releaseEvidenceRequired: 'delegation_abuse_case_review'
  },
  {
    key: 'delegation_scope_mismatch',
    surface: 'worker_tool_route_edge_authorization',
    requiredEvidence: 'Worker tools and HTTP route edges must fail closed when delegation scope does not match the requested civic action.',
    currentEvidence: 'tests/world_civilization_mutation_security.test.js',
    releaseEvidenceRequired: 'delegation_scope_mismatch_smoke'
  },
  {
    key: 'delegation_budget_abuse',
    surface: 'delegated_action_budget_consumption',
    requiredEvidence: 'Delegated action budget must be read-only for denied actions and consumed exactly once for successful idempotent receipts.',
    currentEvidence: 'tests/world_civilization_worker_tool_adapter.test.js',
    releaseEvidenceRequired: 'delegation_budget_abuse_smoke'
  },
  {
    key: 'vote_reputation_farming',
    surface: 'votes_reputation_public_rewards',
    requiredEvidence: 'Vote and reputation systems must not become transferable, farmable, self-awarded, or public reward exploits.',
    currentEvidence: 'server/world_civilization/reputation.js',
    releaseEvidenceRequired: 'vote_reputation_farming_review'
  },
  {
    key: 'public_works_spend_abuse',
    surface: 'public_works_shared_resources',
    requiredEvidence: 'Public works must prove explicit spend authorization, contribution caps, conservation, rollback, and no private inventory leakage.',
    currentEvidence: 'server/world_civilization/public_works.js',
    releaseEvidenceRequired: 'public_works_spend_abuse_review'
  },
  {
    key: 'moderation_escalation',
    surface: 'abuse_reports_reviews_appeals',
    requiredEvidence: 'Abuse reports, human review queues, appeals, and escalation paths need explicit owner and incident-response routing.',
    currentEvidence: 'specs/61_agent_town_v6_moderation_privacy_foundation.md',
    releaseEvidenceRequired: 'moderation_escalation_playbook'
  },
  {
    key: 'rollback_bypass',
    surface: 'effect_execution_rollback_replay',
    requiredEvidence: 'Civic effects must model failed apply, failed rollback, duplicate replay, irreversible action, and emergency disable abuse paths.',
    currentEvidence: 'server/world_civilization/rollback_execution_targets.js',
    releaseEvidenceRequired: 'rollback_bypass_abuse_review'
  },
  {
    key: 'public_autonomous_agent_mutation',
    surface: 'agent_participation_public_world_boundaries',
    requiredEvidence: 'No public autonomous agent may mutate another user world without explicit human approval or store-backed delegation.',
    currentEvidence: 'specs/63_agent_town_v6_agent_participation_delegation_foundation.md',
    releaseEvidenceRequired: 'public_autonomous_mutation_denial_smoke'
  }
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sha256(value = '') {
  return `sha256:${crypto.createHash('sha256').update(String(value || ''), 'utf8').digest('hex')}`;
}

function numberValue(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : fallback;
}

function targetMatrixDigest(targets = V6_ABUSE_CASE_TARGETS) {
  return sha256(JSON.stringify(targets.map((target) => ({
    key: target.key,
    surface: target.surface,
    requiredEvidence: target.requiredEvidence,
    releaseEvidenceRequired: target.releaseEvidenceRequired
  }))));
}

function inspectAbuseCaseTargets(targets = V6_ABUSE_CASE_TARGETS) {
  const safeTargets = Array.isArray(targets) ? targets : [];
  const targetKeys = safeTargets.map((target) => String(target.key || ''));
  const missingKeys = REQUIRED_ABUSE_CASE_TARGET_KEYS.filter((key) => !targetKeys.includes(key));
  const incompleteTargets = safeTargets.filter((target) => (
    !target.key
    || !target.surface
    || !target.requiredEvidence
    || !target.currentEvidence
    || !target.releaseEvidenceRequired
  )).map((target) => String(target.key || 'unknown'));

  return {
    ok: missingKeys.length === 0 && incompleteTargets.length === 0,
    requiredKeys: [...REQUIRED_ABUSE_CASE_TARGET_KEYS],
    targetKeys,
    missingKeys,
    incompleteTargets,
    targetCount: safeTargets.length,
    digest: targetMatrixDigest(safeTargets)
  };
}

function buildMissingReport(errors = []) {
  return {
    version: V6_ABUSE_CASE_TARGETS_VERSION,
    status: 'research_only',
    ok: false,
    errors,
    releaseReady: false,
    productionReady: false,
    runtimeExposed: false,
    playerVisible: false,
    normalGameplayExposure: false,
    mutatesWorldState: false,
    exposesPrivateData: false,
    enablesPublicAgentMutation: false,
    publishesPublicFreePlay: false,
    executionStatus: 'not_executable',
    targetMatrix: inspectAbuseCaseTargets([]),
    observedEvidence: {},
    releaseGaps: [...REQUIRED_ABUSE_CASE_RELEASE_GAPS]
  };
}

function buildV6AbuseCaseTargetReport({
  targets = V6_ABUSE_CASE_TARGETS,
  observed = {},
  source = 'runtime'
} = {}) {
  const targetMatrix = inspectAbuseCaseTargets(targets);
  const observedEvidence = {
    spamProbeCount: numberValue(observed.spamProbeCount),
    harassmentProbeCount: numberValue(observed.harassmentProbeCount),
    impersonationProbeCount: numberValue(observed.impersonationProbeCount),
    unauthorizedMutationProbeCount: numberValue(observed.unauthorizedMutationProbeCount),
    delegationAbuseProbeCount: numberValue(observed.delegationAbuseProbeCount),
    delegationScopeMismatchProbeCount: numberValue(observed.delegationScopeMismatchProbeCount),
    delegationBudgetProbeCount: numberValue(observed.delegationBudgetProbeCount),
    voteReputationFarmingProbeCount: numberValue(observed.voteReputationFarmingProbeCount),
    publicWorksSpendProbeCount: numberValue(observed.publicWorksSpendProbeCount),
    moderationEscalationProbeCount: numberValue(observed.moderationEscalationProbeCount),
    rollbackBypassProbeCount: numberValue(observed.rollbackBypassProbeCount),
    publicAutonomousMutationProbeCount: numberValue(observed.publicAutonomousMutationProbeCount),
    privateDataExposureCount: numberValue(observed.privateDataExposureCount),
    playerVisibleAbuseSurfaceCount: numberValue(observed.playerVisibleAbuseSurfaceCount),
    appliesWorldState: observed.appliesWorldState === true,
    mutatesWorldState: observed.mutatesWorldState === true,
    exposesPrivateData: observed.exposesPrivateData === true,
    enablesPublicAgentMutation: observed.enablesPublicAgentMutation === true,
    publishesPublicFreePlay: observed.publishesPublicFreePlay === true
  };
  const errors = [];
  if (targetMatrix.ok !== true) errors.push('V6_ABUSE_CASE_TARGET_MATRIX_INCOMPLETE');
  if (observedEvidence.spamProbeCount <= 0) errors.push('V6_ABUSE_CASE_SPAM_PROBE_REQUIRED');
  if (observedEvidence.harassmentProbeCount <= 0) errors.push('V6_ABUSE_CASE_HARASSMENT_PROBE_REQUIRED');
  if (observedEvidence.impersonationProbeCount <= 0) errors.push('V6_ABUSE_CASE_IMPERSONATION_PROBE_REQUIRED');
  if (observedEvidence.unauthorizedMutationProbeCount <= 0) errors.push('V6_ABUSE_CASE_UNAUTHORIZED_MUTATION_PROBE_REQUIRED');
  if (observedEvidence.delegationAbuseProbeCount <= 0) errors.push('V6_ABUSE_CASE_DELEGATION_ABUSE_PROBE_REQUIRED');
  if (observedEvidence.delegationScopeMismatchProbeCount <= 0) errors.push('V6_ABUSE_CASE_DELEGATION_SCOPE_PROBE_REQUIRED');
  if (observedEvidence.delegationBudgetProbeCount <= 0) errors.push('V6_ABUSE_CASE_DELEGATION_BUDGET_PROBE_REQUIRED');
  if (observedEvidence.voteReputationFarmingProbeCount <= 0) errors.push('V6_ABUSE_CASE_VOTE_REPUTATION_FARMING_PROBE_REQUIRED');
  if (observedEvidence.publicWorksSpendProbeCount <= 0) errors.push('V6_ABUSE_CASE_PUBLIC_WORKS_SPEND_PROBE_REQUIRED');
  if (observedEvidence.moderationEscalationProbeCount <= 0) errors.push('V6_ABUSE_CASE_MODERATION_ESCALATION_PROBE_REQUIRED');
  if (observedEvidence.rollbackBypassProbeCount <= 0) errors.push('V6_ABUSE_CASE_ROLLBACK_BYPASS_PROBE_REQUIRED');
  if (observedEvidence.publicAutonomousMutationProbeCount <= 0) errors.push('V6_ABUSE_CASE_PUBLIC_AUTONOMOUS_MUTATION_PROBE_REQUIRED');
  if (observedEvidence.privateDataExposureCount > 0 || observedEvidence.exposesPrivateData) {
    errors.push('V6_ABUSE_CASE_PRIVATE_DATA_FORBIDDEN');
  }
  if (observedEvidence.playerVisibleAbuseSurfaceCount > 0) errors.push('V6_ABUSE_CASE_PLAYER_SURFACE_FORBIDDEN');
  if (
    observedEvidence.appliesWorldState
    || observedEvidence.mutatesWorldState
    || observedEvidence.enablesPublicAgentMutation
    || observedEvidence.publishesPublicFreePlay
  ) {
    errors.push('V6_ABUSE_CASE_EXECUTION_FORBIDDEN');
  }
  if (errors.length > 0) {
    return {
      ...buildMissingReport(errors),
      source,
      targetMatrix,
      observedEvidence
    };
  }

  return {
    version: V6_ABUSE_CASE_TARGETS_VERSION,
    status: 'research_only',
    source,
    ok: true,
    errors: [],
    releaseReady: false,
    productionReady: false,
    runtimeExposed: false,
    playerVisible: false,
    normalGameplayExposure: false,
    mutatesWorldState: false,
    exposesPrivateData: false,
    enablesPublicAgentMutation: false,
    publishesPublicFreePlay: false,
    executionStatus: 'not_executable',
    targetMatrix,
    targets: clone(targets),
    observedEvidence,
    releaseGaps: [...REQUIRED_ABUSE_CASE_RELEASE_GAPS]
  };
}

function assertV6AbuseCaseTargetReportSafe(report = {}) {
  const errors = [];
  if (report.version !== V6_ABUSE_CASE_TARGETS_VERSION) {
    errors.push('V6_ABUSE_CASE_TARGET_VERSION_REQUIRED');
  }
  if (report.status !== 'research_only') {
    errors.push('V6_ABUSE_CASE_TARGET_RESEARCH_ONLY_REQUIRED');
  }
  if (report.releaseReady !== false || report.productionReady !== false) {
    errors.push('V6_ABUSE_CASE_TARGET_RELEASE_READY_FORBIDDEN');
  }
  if (report.runtimeExposed !== false) {
    errors.push('V6_ABUSE_CASE_TARGET_RUNTIME_HIDDEN_REQUIRED');
  }
  if (report.playerVisible !== false || report.normalGameplayExposure !== false) {
    errors.push('V6_ABUSE_CASE_TARGET_PLAYER_HIDDEN_REQUIRED');
  }
  if (
    report.mutatesWorldState !== false
    || report.enablesPublicAgentMutation !== false
    || report.publishesPublicFreePlay !== false
  ) {
    errors.push('V6_ABUSE_CASE_TARGET_EXECUTION_FORBIDDEN');
  }
  if (report.exposesPrivateData !== false) {
    errors.push('V6_ABUSE_CASE_TARGET_PRIVATE_DATA_FORBIDDEN');
  }
  if (report.executionStatus !== 'not_executable') {
    errors.push('V6_ABUSE_CASE_TARGET_NON_EXECUTING_REQUIRED');
  }
  if (
    !Array.isArray(report.releaseGaps)
    || REQUIRED_ABUSE_CASE_RELEASE_GAPS.some((gap) => !report.releaseGaps.includes(gap))
  ) {
    errors.push('V6_ABUSE_CASE_TARGET_RELEASE_GAPS_REQUIRED');
  }
  if (report.targetMatrix?.ok !== true || (report.targetMatrix?.missingKeys || []).length > 0) {
    errors.push('V6_ABUSE_CASE_TARGET_MATRIX_REQUIRED');
  }
  const evidence = report.observedEvidence || {};
  if (
    evidence.privateDataExposureCount > 0
    || evidence.playerVisibleAbuseSurfaceCount > 0
    || evidence.appliesWorldState === true
    || evidence.mutatesWorldState === true
    || evidence.exposesPrivateData === true
    || evidence.enablesPublicAgentMutation === true
    || evidence.publishesPublicFreePlay === true
  ) {
    errors.push('V6_ABUSE_CASE_TARGET_EVIDENCE_SAFETY_REQUIRED');
  }
  if (report.ok !== true || (Array.isArray(report.errors) && report.errors.length > 0)) {
    errors.push('V6_ABUSE_CASE_TARGET_ERRORS_PRESENT');
  }
  return {
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  REQUIRED_ABUSE_CASE_RELEASE_GAPS: [...REQUIRED_ABUSE_CASE_RELEASE_GAPS],
  REQUIRED_ABUSE_CASE_TARGET_KEYS: [...REQUIRED_ABUSE_CASE_TARGET_KEYS],
  V6_ABUSE_CASE_TARGETS: clone(V6_ABUSE_CASE_TARGETS),
  V6_ABUSE_CASE_TARGETS_VERSION,
  assertV6AbuseCaseTargetReportSafe,
  buildV6AbuseCaseTargetReport,
  inspectAbuseCaseTargets
};
