const test = require('node:test');
const assert = require('node:assert/strict');

const {
  REQUIRED_SESSION_AUTH_RELEASE_GAPS,
  REQUIRED_SESSION_AUTH_TARGET_KEYS,
  V6_SESSION_AUTH_TARGETS,
  V6_SESSION_AUTH_TARGETS_VERSION,
  assertV6SessionAuthTargetReportSafe,
  buildV6SessionAuthTargetReport,
  inspectSessionAuthTargets
} = require('../server/world_civilization/session_auth_targets');

function observedEvidence(overrides = {}) {
  return {
    sameSessionCsrfProbeCount: 3,
    crossSessionDenialProbeCount: 2,
    sessionResetInvalidationProbeCount: 1,
    providerDisconnectInvalidationProbeCount: 2,
    delegatedPrincipalProbeCount: 2,
    routeMiddlewareIntegrationProbeCount: 0,
    productionBrowserProbeCount: 0,
    riskAwareRateLimitProbeCount: 0,
    auditActorContinuityProbeCount: 1,
    privateDataExposureCount: 0,
    mutationWithoutSessionAuthCount: 0,
    playerVisibleV6AuthSurfaceCount: 0,
    routeMiddlewareIntegrated: false,
    productionBrowserCoveragePresent: false,
    riskAwareRateLimitCoveragePresent: false,
    liveProviderLogoutSignoffPresent: false,
    appliesWorldState: false,
    exposesPrivateData: false,
    ...overrides
  };
}

test('V6 session auth targets name every release identity surface', () => {
  const matrix = inspectSessionAuthTargets();

  assert.equal(matrix.ok, true);
  assert.deepEqual(matrix.requiredKeys, REQUIRED_SESSION_AUTH_TARGET_KEYS);
  assert.deepEqual(matrix.missingKeys, []);
  assert.equal(matrix.targetCount, V6_SESSION_AUTH_TARGETS.length);
  assert.ok(matrix.targetKeys.includes('session_wallet_binding'));
  assert.ok(matrix.targetKeys.includes('csrf_session_binding'));
  assert.ok(matrix.targetKeys.includes('route_tool_middleware_integration'));
  assert.ok(matrix.targetKeys.includes('risk_aware_rate_limit_identity'));
  assert.match(matrix.digest, /^sha256:[a-f0-9]{64}$/);
});

test('V6 session auth target report captures current CSRF and delegation probes while keeping release gates open', () => {
  const report = buildV6SessionAuthTargetReport({
    observed: observedEvidence(),
    source: 'node_test'
  });

  assert.equal(report.version, V6_SESSION_AUTH_TARGETS_VERSION);
  assert.equal(report.status, 'research_only');
  assert.equal(report.source, 'node_test');
  assert.equal(report.ok, true);
  assert.equal(report.releaseReady, false);
  assert.equal(report.productionReady, false);
  assert.equal(report.runtimeExposed, false);
  assert.equal(report.playerVisible, false);
  assert.equal(report.normalGameplayExposure, false);
  assert.equal(report.mutatesWorldState, false);
  assert.equal(report.exposesPrivateData, false);
  assert.equal(report.executionStatus, 'not_executable');
  assert.equal(report.targetMatrix.ok, true);
  assert.equal(report.observedEvidence.sameSessionCsrfProbeCount, 3);
  assert.equal(report.observedEvidence.crossSessionDenialProbeCount, 2);
  assert.equal(report.observedEvidence.delegatedPrincipalProbeCount, 2);
  assert.equal(report.observedEvidence.routeMiddlewareIntegrated, false);
  assert.equal(report.observedEvidence.productionBrowserCoveragePresent, false);
  assert.equal(report.observedEvidence.riskAwareRateLimitCoveragePresent, false);
  assert.equal(report.observedEvidence.liveProviderLogoutSignoffPresent, false);
  assert.deepEqual(report.releaseGaps, REQUIRED_SESSION_AUTH_RELEASE_GAPS);
  assert.deepEqual(assertV6SessionAuthTargetReportSafe(report), { ok: true, errors: [] });
});

test('V6 session auth target report fails closed for incomplete targets or missing existing probes', () => {
  const incomplete = buildV6SessionAuthTargetReport({
    targets: V6_SESSION_AUTH_TARGETS.filter((target) => target.key !== 'session_wallet_binding'),
    observed: observedEvidence()
  });
  assert.equal(incomplete.ok, false);
  assert.match(incomplete.errors.join(','), /V6_SESSION_AUTH_TARGET_MATRIX_INCOMPLETE/);
  assert.match(assertV6SessionAuthTargetReportSafe(incomplete).errors.join(','), /V6_SESSION_AUTH_TARGET_ERRORS_PRESENT/);

  const missingProbes = buildV6SessionAuthTargetReport();
  assert.equal(missingProbes.ok, false);
  assert.match(missingProbes.errors.join(','), /V6_SESSION_AUTH_SAME_SESSION_CSRF_PROBE_REQUIRED/);
  assert.match(missingProbes.errors.join(','), /V6_SESSION_AUTH_CROSS_SESSION_DENIAL_PROBE_REQUIRED/);
  assert.match(missingProbes.errors.join(','), /V6_SESSION_AUTH_SESSION_RESET_PROBE_REQUIRED/);
  assert.match(missingProbes.errors.join(','), /V6_SESSION_AUTH_PROVIDER_DISCONNECT_PROBE_REQUIRED/);
  assert.match(missingProbes.errors.join(','), /V6_SESSION_AUTH_DELEGATED_PRINCIPAL_PROBE_REQUIRED/);
  assert.match(missingProbes.errors.join(','), /V6_SESSION_AUTH_AUDIT_ACTOR_CONTINUITY_PROBE_REQUIRED/);
});

test('V6 session auth target assertion rejects fake release readiness unauthenticated mutation and private data', () => {
  const report = buildV6SessionAuthTargetReport({
    observed: observedEvidence()
  });
  const unsafe = {
    ...report,
    status: 'release_candidate',
    releaseReady: true,
    productionReady: true,
    runtimeExposed: true,
    playerVisible: true,
    normalGameplayExposure: true,
    mutatesWorldState: true,
    exposesPrivateData: true,
    executionStatus: 'executes',
    releaseGaps: [],
    observedEvidence: {
      ...report.observedEvidence,
      privateDataExposureCount: 1,
      mutationWithoutSessionAuthCount: 1,
      playerVisibleV6AuthSurfaceCount: 1,
      appliesWorldState: true,
      exposesPrivateData: true
    }
  };
  const safety = assertV6SessionAuthTargetReportSafe(unsafe);

  assert.equal(safety.ok, false);
  assert.match(safety.errors.join(','), /V6_SESSION_AUTH_TARGET_RESEARCH_ONLY_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_SESSION_AUTH_TARGET_RELEASE_READY_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_SESSION_AUTH_TARGET_RUNTIME_HIDDEN_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_SESSION_AUTH_TARGET_PLAYER_HIDDEN_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_SESSION_AUTH_TARGET_WORLD_MUTATION_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_SESSION_AUTH_TARGET_PRIVATE_DATA_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_SESSION_AUTH_TARGET_NON_EXECUTING_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_SESSION_AUTH_TARGET_RELEASE_GAPS_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_SESSION_AUTH_TARGET_EVIDENCE_SAFETY_REQUIRED/);
});
