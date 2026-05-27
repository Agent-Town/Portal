const crypto = require('crypto');

const V6_SESSION_AUTH_TARGETS_VERSION = 'agent-town.v6.session_auth_targets.v1';
const REQUIRED_SESSION_AUTH_TARGET_KEYS = [
  'session_wallet_binding',
  'csrf_session_binding',
  'delegated_agent_principal_binding',
  'provider_disconnect_invalidation',
  'session_reset_invalidation',
  'route_tool_middleware_integration',
  'production_browser_coverage',
  'risk_aware_rate_limit_identity',
  'audit_actor_continuity',
  'private_data_exclusion'
];
const REQUIRED_SESSION_AUTH_RELEASE_GAPS = [
  'final_session_auth_middleware_required',
  'live_privy_provider_logout_signoff_required',
  'route_tool_middleware_integration_required',
  'production_browser_session_coverage_required',
  'risk_aware_rate_limit_identity_required',
  'audit_actor_continuity_release_review_required'
];

const V6_SESSION_AUTH_TARGETS = [
  {
    key: 'session_wallet_binding',
    surface: 'server_identity_context',
    requiredEvidence: 'Every mutating V6 route/tool must bind the session subject to the verified wallet subject.',
    currentEvidence: 'server/world_civilization/mutation_security.js',
    releaseEvidenceRequired: 'final_session_auth_middleware_trace'
  },
  {
    key: 'csrf_session_binding',
    surface: 'world_grid_csrf_tokens',
    requiredEvidence: 'CSRF tokens must be owner-bound and session-bound before civic mutation reuse is allowed.',
    currentEvidence: 'tests/world_grid_csrf_persistence.test.js',
    releaseEvidenceRequired: 'v6_route_tool_csrf_session_binding_trace'
  },
  {
    key: 'delegated_agent_principal_binding',
    surface: 'delegated_agent_routes_and_worker_tools',
    requiredEvidence: 'Delegated-agent requests must bind delegate agent, principal account, session account, scope, and idempotency.',
    currentEvidence: 'tests/world_civilization_mutation_security.test.js',
    releaseEvidenceRequired: 'route_tool_delegated_principal_binding_trace'
  },
  {
    key: 'provider_disconnect_invalidation',
    surface: '/api/session/world-grid-csrf/invalidate',
    requiredEvidence: 'Wallet/provider disconnect must invalidate old session-bound mutation tokens.',
    currentEvidence: 'tests/world_grid_csrf_persistence.test.js',
    releaseEvidenceRequired: 'live_privy_provider_logout_signoff'
  },
  {
    key: 'session_reset_invalidation',
    surface: '/api/session/reset',
    requiredEvidence: 'Session reset must invalidate old session-bound mutation tokens.',
    currentEvidence: 'tests/world_grid_csrf_persistence.test.js',
    releaseEvidenceRequired: 'production_session_reset_browser_trace'
  },
  {
    key: 'route_tool_middleware_integration',
    surface: 'mutating_v6_routes_and_worker_tools',
    requiredEvidence: 'Every mutating V6 route/tool must pass through the final same-origin, CSRF, session, wallet, idempotency, and rate-limit middleware stack.',
    currentEvidence: 'server/world_civilization/routes.js',
    releaseEvidenceRequired: 'complete_route_tool_middleware_matrix'
  },
  {
    key: 'production_browser_coverage',
    surface: 'production_browser_smokes',
    requiredEvidence: 'Browser coverage must prove same-session success, stale-session denial, cross-wallet denial, provider logout invalidation, and worker-tool session continuity.',
    currentEvidence: 'e2e/243_world_grid_csrf_session_binding.spec.js',
    releaseEvidenceRequired: 'production_browser_session_continuity_suite'
  },
  {
    key: 'risk_aware_rate_limit_identity',
    surface: 'production_rate_limits',
    requiredEvidence: 'Rate-limit identity must combine final session, wallet/owner, route/tool surface, and production risk dimensions.',
    currentEvidence: 'server/world_grid/rate_limit.js',
    releaseEvidenceRequired: 'distributed_risk_aware_rate_limit_trace'
  },
  {
    key: 'audit_actor_continuity',
    surface: 'civic_audit_ledger',
    requiredEvidence: 'Audit rows must preserve session/wallet/actor continuity without storing private credential material.',
    currentEvidence: 'server/world_civilization/audit_ledger.js',
    releaseEvidenceRequired: 'security_reviewed_actor_continuity_audit_trace'
  },
  {
    key: 'private_data_exclusion',
    surface: 'session_auth_reports_and_audit_summaries',
    requiredEvidence: 'Session-auth evidence reports must not expose wallet secrets, provider tokens, Brain secrets, or private row payloads.',
    currentEvidence: 'docs/security/V6_AGENT_CIVILIZATION_RELEASE_REVIEW.md',
    releaseEvidenceRequired: 'privacy_reviewed_session_auth_report'
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

function targetMatrixDigest(targets = V6_SESSION_AUTH_TARGETS) {
  return sha256(JSON.stringify(targets.map((target) => ({
    key: target.key,
    surface: target.surface,
    requiredEvidence: target.requiredEvidence,
    releaseEvidenceRequired: target.releaseEvidenceRequired
  }))));
}

function inspectSessionAuthTargets(targets = V6_SESSION_AUTH_TARGETS) {
  const safeTargets = Array.isArray(targets) ? targets : [];
  const targetKeys = safeTargets.map((target) => String(target.key || ''));
  const missingKeys = REQUIRED_SESSION_AUTH_TARGET_KEYS.filter((key) => !targetKeys.includes(key));
  const incompleteTargets = safeTargets.filter((target) => (
    !target.key
    || !target.surface
    || !target.requiredEvidence
    || !target.currentEvidence
    || !target.releaseEvidenceRequired
  )).map((target) => String(target.key || 'unknown'));

  return {
    ok: missingKeys.length === 0 && incompleteTargets.length === 0,
    requiredKeys: [...REQUIRED_SESSION_AUTH_TARGET_KEYS],
    targetKeys,
    missingKeys,
    incompleteTargets,
    targetCount: safeTargets.length,
    digest: targetMatrixDigest(safeTargets)
  };
}

function buildMissingReport(errors = []) {
  return {
    version: V6_SESSION_AUTH_TARGETS_VERSION,
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
    executionStatus: 'not_executable',
    targetMatrix: inspectSessionAuthTargets([]),
    observedEvidence: {},
    releaseGaps: [...REQUIRED_SESSION_AUTH_RELEASE_GAPS]
  };
}

function buildV6SessionAuthTargetReport({
  targets = V6_SESSION_AUTH_TARGETS,
  observed = {},
  source = 'runtime'
} = {}) {
  const targetMatrix = inspectSessionAuthTargets(targets);
  const observedEvidence = {
    sameSessionCsrfProbeCount: numberValue(observed.sameSessionCsrfProbeCount),
    crossSessionDenialProbeCount: numberValue(observed.crossSessionDenialProbeCount),
    sessionResetInvalidationProbeCount: numberValue(observed.sessionResetInvalidationProbeCount),
    providerDisconnectInvalidationProbeCount: numberValue(observed.providerDisconnectInvalidationProbeCount),
    delegatedPrincipalProbeCount: numberValue(observed.delegatedPrincipalProbeCount),
    routeMiddlewareIntegrationProbeCount: numberValue(observed.routeMiddlewareIntegrationProbeCount),
    productionBrowserProbeCount: numberValue(observed.productionBrowserProbeCount),
    riskAwareRateLimitProbeCount: numberValue(observed.riskAwareRateLimitProbeCount),
    auditActorContinuityProbeCount: numberValue(observed.auditActorContinuityProbeCount),
    privateDataExposureCount: numberValue(observed.privateDataExposureCount),
    mutationWithoutSessionAuthCount: numberValue(observed.mutationWithoutSessionAuthCount),
    playerVisibleV6AuthSurfaceCount: numberValue(observed.playerVisibleV6AuthSurfaceCount),
    routeMiddlewareIntegrated: observed.routeMiddlewareIntegrated === true,
    productionBrowserCoveragePresent: observed.productionBrowserCoveragePresent === true,
    riskAwareRateLimitCoveragePresent: observed.riskAwareRateLimitCoveragePresent === true,
    liveProviderLogoutSignoffPresent: observed.liveProviderLogoutSignoffPresent === true,
    appliesWorldState: observed.appliesWorldState === true,
    exposesPrivateData: observed.exposesPrivateData === true
  };
  const errors = [];
  if (targetMatrix.ok !== true) errors.push('V6_SESSION_AUTH_TARGET_MATRIX_INCOMPLETE');
  if (observedEvidence.sameSessionCsrfProbeCount <= 0) errors.push('V6_SESSION_AUTH_SAME_SESSION_CSRF_PROBE_REQUIRED');
  if (observedEvidence.crossSessionDenialProbeCount <= 0) errors.push('V6_SESSION_AUTH_CROSS_SESSION_DENIAL_PROBE_REQUIRED');
  if (observedEvidence.sessionResetInvalidationProbeCount <= 0) errors.push('V6_SESSION_AUTH_SESSION_RESET_PROBE_REQUIRED');
  if (observedEvidence.providerDisconnectInvalidationProbeCount <= 0) errors.push('V6_SESSION_AUTH_PROVIDER_DISCONNECT_PROBE_REQUIRED');
  if (observedEvidence.delegatedPrincipalProbeCount <= 0) errors.push('V6_SESSION_AUTH_DELEGATED_PRINCIPAL_PROBE_REQUIRED');
  if (observedEvidence.auditActorContinuityProbeCount <= 0) errors.push('V6_SESSION_AUTH_AUDIT_ACTOR_CONTINUITY_PROBE_REQUIRED');
  if (observedEvidence.mutationWithoutSessionAuthCount > 0) errors.push('V6_SESSION_AUTH_UNAUTHENTICATED_MUTATION_FORBIDDEN');
  if (observedEvidence.privateDataExposureCount > 0 || observedEvidence.exposesPrivateData) {
    errors.push('V6_SESSION_AUTH_PRIVATE_DATA_FORBIDDEN');
  }
  if (observedEvidence.playerVisibleV6AuthSurfaceCount > 0) errors.push('V6_SESSION_AUTH_PLAYER_SURFACE_FORBIDDEN');
  if (observedEvidence.appliesWorldState) errors.push('V6_SESSION_AUTH_WORLD_APPLICATION_FORBIDDEN');
  if (errors.length > 0) {
    return {
      ...buildMissingReport(errors),
      source,
      targetMatrix,
      observedEvidence
    };
  }

  return {
    version: V6_SESSION_AUTH_TARGETS_VERSION,
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
    executionStatus: 'not_executable',
    targetMatrix,
    targets: clone(targets),
    observedEvidence,
    releaseGaps: [...REQUIRED_SESSION_AUTH_RELEASE_GAPS]
  };
}

function assertV6SessionAuthTargetReportSafe(report = {}) {
  const errors = [];
  if (report.version !== V6_SESSION_AUTH_TARGETS_VERSION) {
    errors.push('V6_SESSION_AUTH_TARGET_VERSION_REQUIRED');
  }
  if (report.status !== 'research_only') {
    errors.push('V6_SESSION_AUTH_TARGET_RESEARCH_ONLY_REQUIRED');
  }
  if (report.releaseReady !== false || report.productionReady !== false) {
    errors.push('V6_SESSION_AUTH_TARGET_RELEASE_READY_FORBIDDEN');
  }
  if (report.runtimeExposed !== false) {
    errors.push('V6_SESSION_AUTH_TARGET_RUNTIME_HIDDEN_REQUIRED');
  }
  if (report.playerVisible !== false || report.normalGameplayExposure !== false) {
    errors.push('V6_SESSION_AUTH_TARGET_PLAYER_HIDDEN_REQUIRED');
  }
  if (report.mutatesWorldState !== false) {
    errors.push('V6_SESSION_AUTH_TARGET_WORLD_MUTATION_FORBIDDEN');
  }
  if (report.exposesPrivateData !== false) {
    errors.push('V6_SESSION_AUTH_TARGET_PRIVATE_DATA_FORBIDDEN');
  }
  if (report.executionStatus !== 'not_executable') {
    errors.push('V6_SESSION_AUTH_TARGET_NON_EXECUTING_REQUIRED');
  }
  if (
    !Array.isArray(report.releaseGaps)
    || REQUIRED_SESSION_AUTH_RELEASE_GAPS.some((gap) => !report.releaseGaps.includes(gap))
  ) {
    errors.push('V6_SESSION_AUTH_TARGET_RELEASE_GAPS_REQUIRED');
  }
  if (report.targetMatrix?.ok !== true || (report.targetMatrix?.missingKeys || []).length > 0) {
    errors.push('V6_SESSION_AUTH_TARGET_MATRIX_REQUIRED');
  }
  const evidence = report.observedEvidence || {};
  if (
    evidence.mutationWithoutSessionAuthCount > 0
    || evidence.privateDataExposureCount > 0
    || evidence.playerVisibleV6AuthSurfaceCount > 0
    || evidence.appliesWorldState === true
    || evidence.exposesPrivateData === true
  ) {
    errors.push('V6_SESSION_AUTH_TARGET_EVIDENCE_SAFETY_REQUIRED');
  }
  if (report.ok !== true || (Array.isArray(report.errors) && report.errors.length > 0)) {
    errors.push('V6_SESSION_AUTH_TARGET_ERRORS_PRESENT');
  }
  return {
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  REQUIRED_SESSION_AUTH_RELEASE_GAPS: [...REQUIRED_SESSION_AUTH_RELEASE_GAPS],
  REQUIRED_SESSION_AUTH_TARGET_KEYS: [...REQUIRED_SESSION_AUTH_TARGET_KEYS],
  V6_SESSION_AUTH_TARGETS: clone(V6_SESSION_AUTH_TARGETS),
  V6_SESSION_AUTH_TARGETS_VERSION,
  assertV6SessionAuthTargetReportSafe,
  buildV6SessionAuthTargetReport,
  inspectSessionAuthTargets
};
