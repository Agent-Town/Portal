const test = require('node:test');
const assert = require('node:assert/strict');

const {
  REQUIRED_V5_WORLD_GRID_PROMOTION_TARGET_KEYS,
  REQUIRED_V5_WORLD_GRID_RELEASE_GAPS,
  V5_WORLD_GRID_RELEASE_PROMOTION_TARGETS,
  V5_WORLD_GRID_RELEASE_PROMOTION_VERSION,
  assertV5WorldGridReleasePromotionReportSafe,
  buildV5WorldGridReleasePromotionReport,
  inspectV5WorldGridReleasePromotionTargets
} = require('../server/world_grid/release_promotion');

function observedEvidence(overrides = {}) {
  return {
    v50RegionProbeCount: 1,
    v51ClaimsProbeCount: 1,
    v52PublicPresenceProbeCount: 1,
    v53ServiceAdviceProbeCount: 1,
    v54WorldEventsProbeCount: 1,
    v55SandboxProbeCount: 1,
    durableStorageProbeCount: 1,
    ownerIndexProbeCount: 1,
    migrationVersionProbeCount: 1,
    restartPersistenceProbeCount: 1,
    routeToolMutationSecurityProbeCount: 1,
    sessionBoundCsrfProbeCount: 1,
    ownerSurfaceRateLimitProbeCount: 1,
    idempotencyReplayProbeCount: 1,
    auditReplayMatrixProbeCount: 1,
    productionOverrideSafetyProbeCount: 1,
    publicTextPrivacyProbeCount: 1,
    playerRoutePlotPrerequisiteProbeCount: 1,
    releaseReplayReconstructionProbeCount: 1,
    providerLogoutSignoffProbeCount: 1,
    riskRateLimitIdentityProbeCount: 1,
    privateDataExposureCount: 0,
    playerVisibleByDefaultCount: 0,
    productionOverrideBypassCount: 0,
    unauthenticatedMutationCount: 0,
    sideEffectPlotCreationCount: 0,
    runtimeCivicToolExposureCount: 0,
    v6ExposureCount: 0,
    appliesWorldState: false,
    mutatesWorldState: false,
    exposesPrivateData: false,
    enablesProduction: false,
    enablesV6: false,
    playerVisibleByDefault: false,
    executesPromotion: false,
    ...overrides
  };
}

test('V5 world-grid promotion targets name every slice and release control', () => {
  const matrix = inspectV5WorldGridReleasePromotionTargets();

  assert.equal(matrix.ok, true);
  assert.deepEqual(matrix.requiredKeys, REQUIRED_V5_WORLD_GRID_PROMOTION_TARGET_KEYS);
  assert.deepEqual(matrix.missingKeys, []);
  assert.equal(matrix.targetCount, V5_WORLD_GRID_RELEASE_PROMOTION_TARGETS.length);
  assert.ok(matrix.targetKeys.includes('v50_region_grid'));
  assert.ok(matrix.targetKeys.includes('v51_territory_claims'));
  assert.ok(matrix.targetKeys.includes('v52_public_presence'));
  assert.ok(matrix.targetKeys.includes('v53_service_advice'));
  assert.ok(matrix.targetKeys.includes('v54_world_events'));
  assert.ok(matrix.targetKeys.includes('v55_sandbox_districts'));
  assert.ok(matrix.targetKeys.includes('durable_storage_matrix'));
  assert.ok(matrix.targetKeys.includes('session_bound_csrf'));
  assert.ok(matrix.targetKeys.includes('audit_replay_matrix'));
  assert.ok(matrix.targetKeys.includes('player_route_plot_prerequisite'));
  assert.ok(matrix.targetKeys.includes('release_replay_reconstruction'));
  assert.ok(matrix.targetKeys.includes('provider_logout_signoff'));
  assert.ok(matrix.targetKeys.includes('risk_rate_limit_identity'));
  assert.match(matrix.digest, /^sha256:[a-f0-9]{64}$/);
});

test('V5 world-grid promotion report records evidence without completing release or enabling V6', () => {
  const report = buildV5WorldGridReleasePromotionReport({
    observed: observedEvidence(),
    source: 'node_test'
  });

  assert.equal(report.version, V5_WORLD_GRID_RELEASE_PROMOTION_VERSION);
  assert.equal(report.status, 'prototype_promotion_gate');
  assert.equal(report.source, 'node_test');
  assert.equal(report.ok, true);
  assert.equal(report.releaseReady, false);
  assert.equal(report.promotionComplete, false);
  assert.equal(report.v6DependencyReady, false);
  assert.equal(report.productionReady, false);
  assert.equal(report.productionEnabled, false);
  assert.equal(report.runtimeExposed, false);
  assert.equal(report.playerVisibleByDefault, false);
  assert.equal(report.normalGameplayExposure, false);
  assert.equal(report.mutatesWorldState, false);
  assert.equal(report.exposesPrivateData, false);
  assert.equal(report.enablesV6, false);
  assert.equal(report.executesPromotion, false);
  assert.equal(report.executionStatus, 'not_executable');
  assert.equal(report.targetMatrix.ok, true);
  assert.equal(report.observedEvidence.v50RegionProbeCount, 1);
  assert.equal(report.observedEvidence.sideEffectPlotCreationCount, 0);
  assert.deepEqual(report.releaseGaps, REQUIRED_V5_WORLD_GRID_RELEASE_GAPS);
  assert.deepEqual(assertV5WorldGridReleasePromotionReportSafe(report), { ok: true, errors: [] });
});

test('V5 world-grid promotion report fails closed for incomplete targets or missing probes', () => {
  const incomplete = buildV5WorldGridReleasePromotionReport({
    targets: V5_WORLD_GRID_RELEASE_PROMOTION_TARGETS.filter((target) => target.key !== 'v52_public_presence'),
    observed: observedEvidence()
  });
  assert.equal(incomplete.ok, false);
  assert.match(incomplete.errors.join(','), /V5_WORLD_GRID_RELEASE_PROMOTION_TARGET_MATRIX_INCOMPLETE/);
  assert.match(assertV5WorldGridReleasePromotionReportSafe(incomplete).errors.join(','), /V5_WORLD_GRID_PROMOTION_ERRORS_PRESENT/);

  const missingProbes = buildV5WorldGridReleasePromotionReport();
  assert.equal(missingProbes.ok, false);
  assert.match(missingProbes.errors.join(','), /V5_WORLD_GRID_PROMOTION_V50_REGION_REQUIRED/);
  assert.match(missingProbes.errors.join(','), /V5_WORLD_GRID_PROMOTION_V52_PUBLIC_PRESENCE_REQUIRED/);
  assert.match(missingProbes.errors.join(','), /V5_WORLD_GRID_PROMOTION_SESSION_CSRF_REQUIRED/);
  assert.match(missingProbes.errors.join(','), /V5_WORLD_GRID_PROMOTION_AUDIT_REPLAY_REQUIRED/);
  assert.match(missingProbes.errors.join(','), /V5_WORLD_GRID_PROMOTION_PLAYER_ROUTE_PREREQUISITE_REQUIRED/);
  assert.match(missingProbes.errors.join(','), /V5_WORLD_GRID_PROMOTION_PROVIDER_LOGOUT_SIGNOFF_REQUIRED/);
});

test('V5 world-grid promotion assertion rejects fake release readiness and unsafe exposure', () => {
  const report = buildV5WorldGridReleasePromotionReport({
    observed: observedEvidence()
  });
  const unsafe = {
    ...report,
    status: 'release_ready',
    releaseReady: true,
    promotionComplete: true,
    v6DependencyReady: true,
    productionReady: true,
    productionEnabled: true,
    runtimeExposed: true,
    playerVisibleByDefault: true,
    normalGameplayExposure: true,
    mutatesWorldState: true,
    exposesPrivateData: true,
    enablesV6: true,
    executesPromotion: true,
    executionStatus: 'executes',
    releaseGaps: [],
    observedEvidence: {
      ...report.observedEvidence,
      privateDataExposureCount: 1,
      playerVisibleByDefaultCount: 1,
      productionOverrideBypassCount: 1,
      unauthenticatedMutationCount: 1,
      sideEffectPlotCreationCount: 1,
      runtimeCivicToolExposureCount: 1,
      v6ExposureCount: 1,
      appliesWorldState: true,
      mutatesWorldState: true,
      exposesPrivateData: true,
      enablesProduction: true,
      enablesV6: true,
      playerVisibleByDefault: true,
      executesPromotion: true
    }
  };
  const safety = assertV5WorldGridReleasePromotionReportSafe(unsafe);

  assert.equal(safety.ok, false);
  assert.match(safety.errors.join(','), /V5_WORLD_GRID_PROMOTION_STATUS_REQUIRED/);
  assert.match(safety.errors.join(','), /V5_WORLD_GRID_PROMOTION_RELEASE_READY_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V5_WORLD_GRID_PROMOTION_PRODUCTION_ENABLEMENT_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V5_WORLD_GRID_PROMOTION_VISIBILITY_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V5_WORLD_GRID_PROMOTION_NON_EXECUTING_REQUIRED/);
  assert.match(safety.errors.join(','), /V5_WORLD_GRID_PROMOTION_EXECUTION_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V5_WORLD_GRID_PROMOTION_PRIVATE_DATA_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V5_WORLD_GRID_PROMOTION_RELEASE_GAPS_REQUIRED/);
  assert.match(safety.errors.join(','), /V5_WORLD_GRID_PROMOTION_EVIDENCE_SAFETY_REQUIRED/);
});
