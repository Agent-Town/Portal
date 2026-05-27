const test = require('node:test');
const assert = require('node:assert/strict');

const {
  REQUIRED_CI_VALIDATION_MATRIX_KEYS,
  REQUIRED_CI_VALIDATION_RELEASE_GAPS,
  V6_CI_VALIDATION_MATRIX_TARGETS,
  V6_CI_VALIDATION_MATRIX_TARGETS_VERSION,
  assertV6CiValidationMatrixReportSafe,
  buildV6CiValidationMatrixReport,
  inspectCiValidationMatrixTargets
} = require('../server/world_civilization/ci_validation_matrix_targets');

function observedEvidence(overrides = {}) {
  return {
    targetedNodeContractsCount: 1,
    splitPlaywrightSmokesCount: 1,
    allFeaturesRegressionCount: 1,
    v6ModalLabBrowserSmokeCount: 1,
    featureOverrideProductionSafetyCount: 1,
    runtimeToolAbsenceCount: 1,
    workerObservabilityBrowserSmokeCount: 1,
    routeStoreRestartSuiteCount: 1,
    mutationSecuritySuiteCount: 1,
    diffAndStaticChecksCount: 1,
    consoleErrorBudgetCount: 1,
    traceArtifactRetentionCount: 1,
    qaReleasePacketCount: 1,
    privateDataExposureCount: 0,
    playerVisibleCiSurfaceCount: 0,
    runtimeCivicToolExposureCount: 0,
    appliesWorldState: false,
    mutatesWorldState: false,
    exposesPrivateData: false,
    executesCi: false,
    executesValidation: false,
    publishesRuntimeTools: false,
    ...overrides
  };
}

test('V6 CI validation matrix targets name every release validation lane', () => {
  const matrix = inspectCiValidationMatrixTargets();

  assert.equal(matrix.ok, true);
  assert.deepEqual(matrix.requiredKeys, REQUIRED_CI_VALIDATION_MATRIX_KEYS);
  assert.deepEqual(matrix.missingKeys, []);
  assert.equal(matrix.targetCount, V6_CI_VALIDATION_MATRIX_TARGETS.length);
  assert.ok(matrix.targetKeys.includes('targeted_node_contracts'));
  assert.ok(matrix.targetKeys.includes('split_playwright_smokes'));
  assert.ok(matrix.targetKeys.includes('v6_modal_lab_browser_smoke'));
  assert.ok(matrix.targetKeys.includes('runtime_tool_absence'));
  assert.ok(matrix.targetKeys.includes('console_error_budget'));
  assert.ok(matrix.targetKeys.includes('trace_artifact_retention'));
  assert.ok(matrix.targetKeys.includes('qa_release_packet'));
  assert.ok(V6_CI_VALIDATION_MATRIX_TARGETS.find((target) => target.key === 'feature_override_production_safety')
    .currentEvidence.includes('e2e/247_v6_production_override_browser_smoke.spec.js'));
  assert.ok(V6_CI_VALIDATION_MATRIX_TARGETS.find((target) => target.key === 'runtime_tool_absence')
    .currentEvidence.includes('e2e/247_v6_production_override_browser_smoke.spec.js'));
  assert.ok(V6_CI_VALIDATION_MATRIX_TARGETS.find((target) => target.key === 'v6_modal_lab_browser_smoke')
    .command.includes('PW_NODE_ENV=production FEATURE_WORLD_GRID_V50_REGION=1 npx playwright test e2e/247_v6_production_override_browser_smoke.spec.js'));
  assert.ok(V6_CI_VALIDATION_MATRIX_TARGETS.find((target) => target.key === 'v6_modal_lab_browser_smoke')
    .currentEvidence.includes('e2e/249_v6_lab_modal_worker_lifetime_smoke.spec.js'));
  assert.ok(V6_CI_VALIDATION_MATRIX_TARGETS.find((target) => target.key === 'worker_observability_browser_smoke')
    .currentEvidence.includes('e2e/248_v6_production_worker_runtime_smoke.spec.js'));
  assert.ok(V6_CI_VALIDATION_MATRIX_TARGETS.find((target) => target.key === 'worker_observability_browser_smoke')
    .command.includes('PW_NODE_ENV=production FEATURE_WORLD_GRID_V50_REGION=1 npx playwright test e2e/248_v6_production_worker_runtime_smoke.spec.js'));
  assert.match(matrix.digest, /^sha256:[a-f0-9]{64}$/);
});

test('V6 CI validation matrix report records evidence without running CI or exposing tools', () => {
  const report = buildV6CiValidationMatrixReport({
    observed: observedEvidence(),
    source: 'node_test'
  });

  assert.equal(report.version, V6_CI_VALIDATION_MATRIX_TARGETS_VERSION);
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
  assert.equal(report.executesCi, false);
  assert.equal(report.executesValidation, false);
  assert.equal(report.publishesRuntimeTools, false);
  assert.equal(report.executionStatus, 'not_executable');
  assert.equal(report.targetMatrix.ok, true);
  assert.equal(report.observedEvidence.targetedNodeContractsCount, 1);
  assert.equal(report.observedEvidence.runtimeCivicToolExposureCount, 0);
  assert.deepEqual(report.releaseGaps, REQUIRED_CI_VALIDATION_RELEASE_GAPS);
  assert.deepEqual(assertV6CiValidationMatrixReportSafe(report), { ok: true, errors: [] });
});

test('V6 CI validation matrix report fails closed for incomplete targets or missing evidence', () => {
  const incomplete = buildV6CiValidationMatrixReport({
    targets: V6_CI_VALIDATION_MATRIX_TARGETS.filter((target) => target.key !== 'targeted_node_contracts'),
    observed: observedEvidence()
  });
  assert.equal(incomplete.ok, false);
  assert.match(incomplete.errors.join(','), /V6_CI_VALIDATION_MATRIX_INCOMPLETE/);
  assert.match(assertV6CiValidationMatrixReportSafe(incomplete).errors.join(','), /V6_CI_VALIDATION_MATRIX_ERRORS_PRESENT/);

  const missingEvidence = buildV6CiValidationMatrixReport();
  assert.equal(missingEvidence.ok, false);
  assert.match(missingEvidence.errors.join(','), /V6_CI_VALIDATION_NODE_CONTRACTS_REQUIRED/);
  assert.match(missingEvidence.errors.join(','), /V6_CI_VALIDATION_SPLIT_PLAYWRIGHT_REQUIRED/);
  assert.match(missingEvidence.errors.join(','), /V6_CI_VALIDATION_RUNTIME_TOOL_ABSENCE_REQUIRED/);
  assert.match(missingEvidence.errors.join(','), /V6_CI_VALIDATION_CONSOLE_BUDGET_REQUIRED/);
  assert.match(missingEvidence.errors.join(','), /V6_CI_VALIDATION_TRACE_RETENTION_REQUIRED/);
  assert.match(missingEvidence.errors.join(','), /V6_CI_VALIDATION_QA_PACKET_REQUIRED/);
});

test('V6 CI validation matrix assertion rejects fake release readiness and execution', () => {
  const report = buildV6CiValidationMatrixReport({
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
    executesCi: true,
    executesValidation: true,
    publishesRuntimeTools: true,
    executionStatus: 'executes',
    releaseGaps: [],
    observedEvidence: {
      ...report.observedEvidence,
      privateDataExposureCount: 1,
      playerVisibleCiSurfaceCount: 1,
      runtimeCivicToolExposureCount: 1,
      appliesWorldState: true,
      mutatesWorldState: true,
      exposesPrivateData: true,
      executesCi: true,
      executesValidation: true,
      publishesRuntimeTools: true
    }
  };
  const safety = assertV6CiValidationMatrixReportSafe(unsafe);

  assert.equal(safety.ok, false);
  assert.match(safety.errors.join(','), /V6_CI_VALIDATION_MATRIX_RESEARCH_ONLY_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_CI_VALIDATION_MATRIX_RELEASE_READY_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_CI_VALIDATION_MATRIX_RUNTIME_HIDDEN_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_CI_VALIDATION_MATRIX_PLAYER_HIDDEN_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_CI_VALIDATION_MATRIX_EXECUTION_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_CI_VALIDATION_MATRIX_PRIVATE_DATA_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_CI_VALIDATION_MATRIX_NON_EXECUTING_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_CI_VALIDATION_MATRIX_RELEASE_GAPS_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_CI_VALIDATION_MATRIX_EVIDENCE_SAFETY_REQUIRED/);
});
