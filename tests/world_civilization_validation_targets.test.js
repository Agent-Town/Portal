const test = require('node:test');
const assert = require('node:assert/strict');

const {
  REQUIRED_VALIDATION_RELEASE_GAPS,
  REQUIRED_VALIDATION_TARGET_KEYS,
  V6_VALIDATION_TARGETS,
  V6_VALIDATION_TARGETS_VERSION,
  assertV6ValidationTargetReportSafe,
  buildV6ValidationTargetReport,
  inspectValidationTargets
} = require('../server/world_civilization/validation_targets');

function observedEvidence(overrides = {}) {
  return {
    targetedNodeSuiteProbeCount: 1,
    splitPlaywrightSmokeProbeCount: 1,
    allFeaturesRegressionProbeCount: 1,
    featureOverrideSafetyProbeCount: 1,
    runtimeToolAbsenceProbeCount: 1,
    modalLabBrowserProbeCount: 1,
    workerObservabilityProbeCount: 1,
    routeStoreRestartProbeCount: 1,
    mutationSecurityRegressionProbeCount: 1,
    releaseCandidateRunProbeCount: 1,
    noConsoleErrorsProbeCount: 1,
    artifactTraceabilityProbeCount: 1,
    privateDataExposureCount: 0,
    playerVisibleValidationSurfaceCount: 0,
    runtimeCivicToolExposureCount: 0,
    appliesWorldState: false,
    mutatesWorldState: false,
    exposesPrivateData: false,
    executesValidation: false,
    publishesRuntimeTools: false,
    ...overrides
  };
}

test('V6 validation targets name every Node and Playwright release evidence surface', () => {
  const matrix = inspectValidationTargets();

  assert.equal(matrix.ok, true);
  assert.deepEqual(matrix.requiredKeys, REQUIRED_VALIDATION_TARGET_KEYS);
  assert.deepEqual(matrix.missingKeys, []);
  assert.equal(matrix.targetCount, V6_VALIDATION_TARGETS.length);
  assert.ok(matrix.targetKeys.includes('targeted_node_suite'));
  assert.ok(matrix.targetKeys.includes('split_playwright_smokes'));
  assert.ok(matrix.targetKeys.includes('all_features_regression'));
  assert.ok(matrix.targetKeys.includes('feature_override_safety'));
  assert.ok(matrix.targetKeys.includes('runtime_tool_absence'));
  assert.ok(matrix.targetKeys.includes('worker_observability_smoke'));
  assert.ok(matrix.targetKeys.includes('release_candidate_run'));
  assert.ok(matrix.targetKeys.includes('artifact_traceability'));
  assert.ok(V6_VALIDATION_TARGETS.find((target) => target.key === 'worker_observability_smoke')
    .currentEvidence.includes('e2e/246_v6_worker_runtime_registration_smoke.spec.js'));
  assert.match(matrix.digest, /^sha256:[a-f0-9]{64}$/);
});

test('V6 validation report records research evidence without running validation or exposing tools', () => {
  const report = buildV6ValidationTargetReport({
    observed: observedEvidence(),
    source: 'node_test'
  });

  assert.equal(report.version, V6_VALIDATION_TARGETS_VERSION);
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
  assert.equal(report.executesValidation, false);
  assert.equal(report.publishesRuntimeTools, false);
  assert.equal(report.executionStatus, 'not_executable');
  assert.equal(report.targetMatrix.ok, true);
  assert.equal(report.observedEvidence.targetedNodeSuiteProbeCount, 1);
  assert.equal(report.observedEvidence.runtimeCivicToolExposureCount, 0);
  assert.deepEqual(report.releaseGaps, REQUIRED_VALIDATION_RELEASE_GAPS);
  assert.deepEqual(assertV6ValidationTargetReportSafe(report), { ok: true, errors: [] });
});

test('V6 validation report fails closed for incomplete targets or missing current probes', () => {
  const incomplete = buildV6ValidationTargetReport({
    targets: V6_VALIDATION_TARGETS.filter((target) => target.key !== 'targeted_node_suite'),
    observed: observedEvidence()
  });
  assert.equal(incomplete.ok, false);
  assert.match(incomplete.errors.join(','), /V6_VALIDATION_TARGET_MATRIX_INCOMPLETE/);
  assert.match(assertV6ValidationTargetReportSafe(incomplete).errors.join(','), /V6_VALIDATION_TARGET_ERRORS_PRESENT/);

  const missingProbes = buildV6ValidationTargetReport();
  assert.equal(missingProbes.ok, false);
  assert.match(missingProbes.errors.join(','), /V6_VALIDATION_NODE_SUITE_PROBE_REQUIRED/);
  assert.match(missingProbes.errors.join(','), /V6_VALIDATION_SPLIT_PLAYWRIGHT_PROBE_REQUIRED/);
  assert.match(missingProbes.errors.join(','), /V6_VALIDATION_RUNTIME_TOOL_ABSENCE_PROBE_REQUIRED/);
  assert.match(missingProbes.errors.join(','), /V6_VALIDATION_RELEASE_CANDIDATE_PROBE_REQUIRED/);
  assert.match(missingProbes.errors.join(','), /V6_VALIDATION_ARTIFACT_TRACEABILITY_PROBE_REQUIRED/);
});

test('V6 validation assertion rejects fake release readiness tool exposure and execution', () => {
  const report = buildV6ValidationTargetReport({
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
    executesValidation: true,
    publishesRuntimeTools: true,
    executionStatus: 'executes',
    releaseGaps: [],
    observedEvidence: {
      ...report.observedEvidence,
      privateDataExposureCount: 1,
      playerVisibleValidationSurfaceCount: 1,
      runtimeCivicToolExposureCount: 1,
      appliesWorldState: true,
      mutatesWorldState: true,
      exposesPrivateData: true,
      executesValidation: true,
      publishesRuntimeTools: true
    }
  };
  const safety = assertV6ValidationTargetReportSafe(unsafe);

  assert.equal(safety.ok, false);
  assert.match(safety.errors.join(','), /V6_VALIDATION_TARGET_RESEARCH_ONLY_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_VALIDATION_TARGET_RELEASE_READY_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_VALIDATION_TARGET_RUNTIME_HIDDEN_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_VALIDATION_TARGET_PLAYER_HIDDEN_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_VALIDATION_TARGET_EXECUTION_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_VALIDATION_TARGET_PRIVATE_DATA_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_VALIDATION_TARGET_NON_EXECUTING_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_VALIDATION_TARGET_RELEASE_GAPS_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_VALIDATION_TARGET_EVIDENCE_SAFETY_REQUIRED/);
});
