const test = require('node:test');
const assert = require('node:assert/strict');

const {
  REQUIRED_RELEASE_OPERATIONS_GAPS,
  REQUIRED_RELEASE_OPERATIONS_KEYS,
  V6_RELEASE_OPERATIONS_REQUIREMENTS,
  V6_RELEASE_OPERATIONS_VERSION,
  assertV6ReleaseOperationsReportSafe,
  buildV6ReleaseOperationsReport,
  inspectReleaseOperationsRequirements
} = require('../server/world_civilization/release_operations');

function observedEvidence(overrides = {}) {
  return {
    productionFlagControlCount: 1,
    releaseWindowCount: 1,
    goNoGoRecordCount: 1,
    canaryScopeCount: 1,
    canaryExitCriteriaCount: 1,
    emergencyDisableDrillCount: 1,
    rollbackWindowCount: 1,
    rollbackDisableDrillCount: 1,
    postReleaseVerificationCount: 1,
    normalGameplayBaselineCount: 1,
    auditReplayHealthCheckCount: 1,
    evidenceArchiveCount: 1,
    privateDataExposureCount: 0,
    runtimeCivicToolExposureCount: 0,
    playerVisibleUnapprovedSurfaceCount: 0,
    appliesWorldState: false,
    mutatesWorldState: false,
    exposesPrivateData: false,
    enablesProduction: false,
    productionEnabled: false,
    approvesRelease: false,
    opensCanary: false,
    expandsCohort: false,
    triggersEmergencyDisable: false,
    triggersRollback: false,
    startsRuntimeMonitoring: false,
    publishesRuntimeTools: false,
    ...overrides
  };
}

test('V6 release operations requirements name every launch-control surface', () => {
  const matrix = inspectReleaseOperationsRequirements();

  assert.equal(matrix.ok, true);
  assert.deepEqual(matrix.requiredKeys, REQUIRED_RELEASE_OPERATIONS_KEYS);
  assert.deepEqual(matrix.missingKeys, []);
  assert.equal(matrix.requirementCount, V6_RELEASE_OPERATIONS_REQUIREMENTS.length);
  assert.ok(matrix.requirementKeys.includes('production_flag_control'));
  assert.ok(matrix.requirementKeys.includes('release_window'));
  assert.ok(matrix.requirementKeys.includes('go_no_go_record'));
  assert.ok(matrix.requirementKeys.includes('canary_scope'));
  assert.ok(matrix.requirementKeys.includes('canary_exit'));
  assert.ok(matrix.requirementKeys.includes('emergency_disable'));
  assert.ok(matrix.requirementKeys.includes('rollback_disable_drill'));
  assert.ok(matrix.requirementKeys.includes('post_release_verification'));
  assert.ok(matrix.requirementKeys.includes('normal_gameplay_baseline'));
  assert.ok(matrix.requirementKeys.includes('audit_replay_health_check'));
  assert.ok(matrix.requirementKeys.includes('evidence_archive'));
  assert.match(matrix.digest, /^sha256:[a-f0-9]{64}$/);
});

test('V6 release operations report records evidence without opening canary or enabling production', () => {
  const report = buildV6ReleaseOperationsReport({
    observed: observedEvidence(),
    source: 'node_test'
  });

  assert.equal(report.version, V6_RELEASE_OPERATIONS_VERSION);
  assert.equal(report.status, 'research_only');
  assert.equal(report.source, 'node_test');
  assert.equal(report.ok, true);
  assert.equal(report.releaseReady, false);
  assert.equal(report.productionReady, false);
  assert.equal(report.productionEnabled, false);
  assert.equal(report.runtimeExposed, false);
  assert.equal(report.playerVisible, false);
  assert.equal(report.normalGameplayExposure, false);
  assert.equal(report.mutatesWorldState, false);
  assert.equal(report.exposesPrivateData, false);
  assert.equal(report.approvesRelease, false);
  assert.equal(report.opensCanary, false);
  assert.equal(report.expandsCohort, false);
  assert.equal(report.triggersEmergencyDisable, false);
  assert.equal(report.triggersRollback, false);
  assert.equal(report.startsRuntimeMonitoring, false);
  assert.equal(report.executionStatus, 'not_executable');
  assert.equal(report.targetMatrix.ok, true);
  assert.equal(report.observedEvidence.goNoGoRecordCount, 1);
  assert.equal(report.observedEvidence.runtimeCivicToolExposureCount, 0);
  assert.deepEqual(report.releaseGaps, REQUIRED_RELEASE_OPERATIONS_GAPS);
  assert.deepEqual(assertV6ReleaseOperationsReportSafe(report), { ok: true, errors: [] });
});

test('V6 release operations report fails closed for missing evidence private data or tool exposure', () => {
  const incomplete = buildV6ReleaseOperationsReport({
    requirements: V6_RELEASE_OPERATIONS_REQUIREMENTS.filter((requirement) => requirement.key !== 'release_window'),
    observed: observedEvidence()
  });
  assert.equal(incomplete.ok, false);
  assert.match(incomplete.errors.join(','), /V6_RELEASE_OPERATIONS_TARGET_MATRIX_INCOMPLETE/);
  assert.match(assertV6ReleaseOperationsReportSafe(incomplete).errors.join(','), /V6_RELEASE_OPERATIONS_ERRORS_PRESENT/);

  const missingEvidence = buildV6ReleaseOperationsReport();
  assert.equal(missingEvidence.ok, false);
  assert.match(missingEvidence.errors.join(','), /V6_RELEASE_OPERATIONS_PRODUCTION_FLAG_CONTROL_REQUIRED/);
  assert.match(missingEvidence.errors.join(','), /V6_RELEASE_OPERATIONS_RELEASE_WINDOW_REQUIRED/);
  assert.match(missingEvidence.errors.join(','), /V6_RELEASE_OPERATIONS_GO_NO_GO_REQUIRED/);
  assert.match(missingEvidence.errors.join(','), /V6_RELEASE_OPERATIONS_EMERGENCY_DISABLE_REQUIRED/);
  assert.match(missingEvidence.errors.join(','), /V6_RELEASE_OPERATIONS_POST_RELEASE_VERIFICATION_REQUIRED/);
  assert.match(missingEvidence.errors.join(','), /V6_RELEASE_OPERATIONS_EVIDENCE_ARCHIVE_REQUIRED/);

  const unsafeSurface = buildV6ReleaseOperationsReport({
    observed: observedEvidence({ runtimeCivicToolExposureCount: 1 })
  });
  assert.equal(unsafeSurface.ok, false);
  assert.match(unsafeSurface.errors.join(','), /V6_RELEASE_OPERATIONS_RUNTIME_TOOL_EXPOSURE_FORBIDDEN/);
});

test('V6 release operations assertion rejects fake execution release approval and canary actions', () => {
  const report = buildV6ReleaseOperationsReport({
    observed: observedEvidence()
  });
  const unsafe = {
    ...report,
    status: 'release_candidate',
    releaseReady: true,
    productionReady: true,
    productionEnabled: true,
    runtimeExposed: true,
    playerVisible: true,
    normalGameplayExposure: true,
    mutatesWorldState: true,
    exposesPrivateData: true,
    approvesRelease: true,
    opensCanary: true,
    expandsCohort: true,
    triggersEmergencyDisable: true,
    triggersRollback: true,
    startsRuntimeMonitoring: true,
    executionStatus: 'executes',
    releaseGaps: [],
    observedEvidence: {
      ...report.observedEvidence,
      privateDataExposureCount: 1,
      runtimeCivicToolExposureCount: 1,
      playerVisibleUnapprovedSurfaceCount: 1,
      appliesWorldState: true,
      mutatesWorldState: true,
      exposesPrivateData: true,
      enablesProduction: true,
      productionEnabled: true,
      approvesRelease: true,
      opensCanary: true,
      expandsCohort: true,
      triggersEmergencyDisable: true,
      triggersRollback: true,
      startsRuntimeMonitoring: true,
      publishesRuntimeTools: true
    }
  };
  const safety = assertV6ReleaseOperationsReportSafe(unsafe);

  assert.equal(safety.ok, false);
  assert.match(safety.errors.join(','), /V6_RELEASE_OPERATIONS_RESEARCH_ONLY_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_RELEASE_OPERATIONS_RELEASE_READY_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_RELEASE_OPERATIONS_PRODUCTION_ENABLEMENT_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_RELEASE_OPERATIONS_RUNTIME_HIDDEN_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_RELEASE_OPERATIONS_NON_EXECUTING_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_RELEASE_OPERATIONS_EXECUTION_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_RELEASE_OPERATIONS_PRIVATE_DATA_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_RELEASE_OPERATIONS_RELEASE_GAPS_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_RELEASE_OPERATIONS_EVIDENCE_SAFETY_REQUIRED/);
});
