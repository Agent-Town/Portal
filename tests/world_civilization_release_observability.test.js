const test = require('node:test');
const assert = require('node:assert/strict');

const {
  REQUIRED_RELEASE_OBSERVABILITY_GAPS,
  REQUIRED_RELEASE_OBSERVABILITY_KEYS,
  V6_RELEASE_OBSERVABILITY_REQUIREMENTS,
  V6_RELEASE_OBSERVABILITY_VERSION,
  assertV6ReleaseObservabilityReportSafe,
  buildV6ReleaseObservabilityReport,
  inspectReleaseObservabilityRequirements
} = require('../server/world_civilization/release_observability');

function observedEvidence(overrides = {}) {
  return {
    auditMetricDashboardCount: 1,
    workerTrafficTracePlanCount: 1,
    errorAlertOwnerCount: 1,
    privacySafeLogReviewCount: 1,
    featureFlagDashboardCount: 1,
    monitoringOwnerCount: 1,
    canaryHealthProbeCount: 1,
    runtimeToolAbsenceMonitorCount: 1,
    supportEscalationLinkCount: 1,
    postReleaseReviewCount: 1,
    privateDataExposureCount: 0,
    rawTracePrivateDataCount: 0,
    runtimeCivicToolExposureCount: 0,
    appliesWorldState: false,
    mutatesWorldState: false,
    exposesPrivateData: false,
    activatesAlerts: false,
    startsRuntimeMonitoring: false,
    productionEnabled: false,
    publishesRuntimeTools: false,
    ...overrides
  };
}

test('V6 release observability requirements name every privacy-safe handoff surface', () => {
  const matrix = inspectReleaseObservabilityRequirements();

  assert.equal(matrix.ok, true);
  assert.deepEqual(matrix.requiredKeys, REQUIRED_RELEASE_OBSERVABILITY_KEYS);
  assert.deepEqual(matrix.missingKeys, []);
  assert.equal(matrix.requirementCount, V6_RELEASE_OBSERVABILITY_REQUIREMENTS.length);
  assert.ok(matrix.requirementKeys.includes('audit_metrics'));
  assert.ok(matrix.requirementKeys.includes('worker_traffic_trace'));
  assert.ok(matrix.requirementKeys.includes('error_alerts'));
  assert.ok(matrix.requirementKeys.includes('privacy_safe_logs'));
  assert.ok(matrix.requirementKeys.includes('feature_flag_dashboard'));
  assert.ok(matrix.requirementKeys.includes('monitoring_owner'));
  assert.ok(matrix.requirementKeys.includes('runtime_tool_absence_monitor'));
  assert.ok(matrix.requirementKeys.includes('support_escalation_link'));
  assert.match(matrix.digest, /^sha256:[a-f0-9]{64}$/);
});

test('V6 release observability report records handoff evidence without activating monitoring', () => {
  const report = buildV6ReleaseObservabilityReport({
    observed: observedEvidence(),
    source: 'node_test'
  });

  assert.equal(report.version, V6_RELEASE_OBSERVABILITY_VERSION);
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
  assert.equal(report.activatesAlerts, false);
  assert.equal(report.startsRuntimeMonitoring, false);
  assert.equal(report.publishesRuntimeTools, false);
  assert.equal(report.executionStatus, 'not_executable');
  assert.equal(report.targetMatrix.ok, true);
  assert.equal(report.observedEvidence.auditMetricDashboardCount, 1);
  assert.equal(report.observedEvidence.runtimeCivicToolExposureCount, 0);
  assert.equal(report.observedEvidence.rawTracePrivateDataCount, 0);
  assert.deepEqual(report.releaseGaps, REQUIRED_RELEASE_OBSERVABILITY_GAPS);
  assert.deepEqual(assertV6ReleaseObservabilityReportSafe(report), { ok: true, errors: [] });
});

test('V6 release observability report fails closed for missing handoff evidence or private traces', () => {
  const incomplete = buildV6ReleaseObservabilityReport({
    requirements: V6_RELEASE_OBSERVABILITY_REQUIREMENTS.filter((requirement) => requirement.key !== 'audit_metrics'),
    observed: observedEvidence()
  });
  assert.equal(incomplete.ok, false);
  assert.match(incomplete.errors.join(','), /V6_RELEASE_OBSERVABILITY_TARGET_MATRIX_INCOMPLETE/);
  assert.match(assertV6ReleaseObservabilityReportSafe(incomplete).errors.join(','), /V6_RELEASE_OBSERVABILITY_ERRORS_PRESENT/);

  const missingEvidence = buildV6ReleaseObservabilityReport();
  assert.equal(missingEvidence.ok, false);
  assert.match(missingEvidence.errors.join(','), /V6_RELEASE_OBSERVABILITY_AUDIT_METRICS_REQUIRED/);
  assert.match(missingEvidence.errors.join(','), /V6_RELEASE_OBSERVABILITY_WORKER_TRACE_REQUIRED/);
  assert.match(missingEvidence.errors.join(','), /V6_RELEASE_OBSERVABILITY_ALERT_OWNER_REQUIRED/);
  assert.match(missingEvidence.errors.join(','), /V6_RELEASE_OBSERVABILITY_FLAG_DASHBOARD_REQUIRED/);
  assert.match(missingEvidence.errors.join(','), /V6_RELEASE_OBSERVABILITY_RUNTIME_TOOL_ABSENCE_REQUIRED/);

  const privateTrace = buildV6ReleaseObservabilityReport({
    observed: observedEvidence({ rawTracePrivateDataCount: 1 })
  });
  assert.equal(privateTrace.ok, false);
  assert.match(privateTrace.errors.join(','), /V6_RELEASE_OBSERVABILITY_PRIVATE_DATA_FORBIDDEN/);
});

test('V6 release observability assertion rejects fake runtime exposure and execution', () => {
  const report = buildV6ReleaseObservabilityReport({
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
    activatesAlerts: true,
    startsRuntimeMonitoring: true,
    publishesRuntimeTools: true,
    executionStatus: 'executes',
    releaseGaps: [],
    observedEvidence: {
      ...report.observedEvidence,
      privateDataExposureCount: 1,
      rawTracePrivateDataCount: 1,
      runtimeCivicToolExposureCount: 1,
      appliesWorldState: true,
      mutatesWorldState: true,
      exposesPrivateData: true,
      activatesAlerts: true,
      startsRuntimeMonitoring: true,
      productionEnabled: true,
      publishesRuntimeTools: true
    }
  };
  const safety = assertV6ReleaseObservabilityReportSafe(unsafe);

  assert.equal(safety.ok, false);
  assert.match(safety.errors.join(','), /V6_RELEASE_OBSERVABILITY_RESEARCH_ONLY_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_RELEASE_OBSERVABILITY_RELEASE_READY_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_RELEASE_OBSERVABILITY_PRODUCTION_ENABLEMENT_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_RELEASE_OBSERVABILITY_RUNTIME_HIDDEN_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_RELEASE_OBSERVABILITY_NON_EXECUTING_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_RELEASE_OBSERVABILITY_EXECUTION_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_RELEASE_OBSERVABILITY_PRIVATE_DATA_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_RELEASE_OBSERVABILITY_RELEASE_GAPS_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_RELEASE_OBSERVABILITY_EVIDENCE_SAFETY_REQUIRED/);
});
