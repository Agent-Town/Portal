const test = require('node:test');
const assert = require('node:assert/strict');

const {
  REQUIRED_PRODUCT_SIGNOFF_RELEASE_GAPS,
  REQUIRED_PRODUCT_SIGNOFF_TARGET_KEYS,
  V6_PRODUCT_SIGNOFF_TARGETS,
  V6_PRODUCT_SIGNOFF_TARGETS_VERSION,
  assertV6ProductSignoffTargetReportSafe,
  buildV6ProductSignoffTargetReport,
  inspectProductSignoffTargets
} = require('../server/world_civilization/product_signoff_targets');

function observedEvidence(overrides = {}) {
  return {
    playerVisibleScopeProbeCount: 1,
    normalGameplayAbsenceProbeCount: 2,
    productApprovalProbeCount: 1,
    qaEvidenceProbeCount: 1,
    securityEvidenceProbeCount: 1,
    rollbackPlanProbeCount: 1,
    disablePlanProbeCount: 1,
    supportRunbookProbeCount: 1,
    userCommsProbeCount: 1,
    observabilityHandoffProbeCount: 1,
    goNoGoProbeCount: 1,
    postReleaseMonitoringProbeCount: 1,
    privateDataExposureCount: 0,
    playerVisibleSignoffSurfaceCount: 0,
    appliesWorldState: false,
    mutatesWorldState: false,
    exposesPrivateData: false,
    approvesRelease: false,
    enablesProduction: false,
    publishesComms: false,
    ...overrides
  };
}

test('V6 product signoff targets name every release decision surface', () => {
  const matrix = inspectProductSignoffTargets();

  assert.equal(matrix.ok, true);
  assert.deepEqual(matrix.requiredKeys, REQUIRED_PRODUCT_SIGNOFF_TARGET_KEYS);
  assert.deepEqual(matrix.missingKeys, []);
  assert.equal(matrix.targetCount, V6_PRODUCT_SIGNOFF_TARGETS.length);
  assert.ok(matrix.targetKeys.includes('player_visible_scope'));
  assert.ok(matrix.targetKeys.includes('normal_gameplay_exposure_denial'));
  assert.ok(matrix.targetKeys.includes('product_owner_approval'));
  assert.ok(matrix.targetKeys.includes('qa_release_evidence'));
  assert.ok(matrix.targetKeys.includes('security_release_evidence'));
  assert.ok(matrix.targetKeys.includes('rollback_plan'));
  assert.ok(matrix.targetKeys.includes('disable_plan'));
  assert.ok(matrix.targetKeys.includes('support_runbook'));
  assert.ok(matrix.targetKeys.includes('observability_handoff'));
  assert.equal(
    V6_PRODUCT_SIGNOFF_TARGETS.find((target) => target.key === 'observability_handoff').currentEvidence,
    'server/world_civilization/release_observability.js'
  );
  assert.ok(matrix.targetKeys.includes('go_no_go_record'));
  assert.equal(
    V6_PRODUCT_SIGNOFF_TARGETS.find((target) => target.key === 'post_release_monitoring').currentEvidence,
    'server/world_civilization/release_observability.js'
  );
  assert.match(matrix.digest, /^sha256:[a-f0-9]{64}$/);
});

test('V6 product signoff report records research evidence without approving release', () => {
  const report = buildV6ProductSignoffTargetReport({
    observed: observedEvidence(),
    source: 'node_test'
  });

  assert.equal(report.version, V6_PRODUCT_SIGNOFF_TARGETS_VERSION);
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
  assert.equal(report.approvesRelease, false);
  assert.equal(report.enablesProduction, false);
  assert.equal(report.publishesComms, false);
  assert.equal(report.executionStatus, 'not_executable');
  assert.equal(report.targetMatrix.ok, true);
  assert.equal(report.observedEvidence.normalGameplayAbsenceProbeCount, 2);
  assert.equal(report.observedEvidence.playerVisibleSignoffSurfaceCount, 0);
  assert.deepEqual(report.releaseGaps, REQUIRED_PRODUCT_SIGNOFF_RELEASE_GAPS);
  assert.deepEqual(assertV6ProductSignoffTargetReportSafe(report), { ok: true, errors: [] });
});

test('V6 product signoff report fails closed for incomplete targets or missing current probes', () => {
  const incomplete = buildV6ProductSignoffTargetReport({
    targets: V6_PRODUCT_SIGNOFF_TARGETS.filter((target) => target.key !== 'player_visible_scope'),
    observed: observedEvidence()
  });
  assert.equal(incomplete.ok, false);
  assert.match(incomplete.errors.join(','), /V6_PRODUCT_SIGNOFF_TARGET_MATRIX_INCOMPLETE/);
  assert.match(assertV6ProductSignoffTargetReportSafe(incomplete).errors.join(','), /V6_PRODUCT_SIGNOFF_TARGET_ERRORS_PRESENT/);

  const missingProbes = buildV6ProductSignoffTargetReport();
  assert.equal(missingProbes.ok, false);
  assert.match(missingProbes.errors.join(','), /V6_PRODUCT_SIGNOFF_SCOPE_PROBE_REQUIRED/);
  assert.match(missingProbes.errors.join(','), /V6_PRODUCT_SIGNOFF_QA_EVIDENCE_PROBE_REQUIRED/);
  assert.match(missingProbes.errors.join(','), /V6_PRODUCT_SIGNOFF_SECURITY_EVIDENCE_PROBE_REQUIRED/);
  assert.match(missingProbes.errors.join(','), /V6_PRODUCT_SIGNOFF_ROLLBACK_PLAN_PROBE_REQUIRED/);
  assert.match(missingProbes.errors.join(','), /V6_PRODUCT_SIGNOFF_OBSERVABILITY_PROBE_REQUIRED/);
  assert.match(missingProbes.errors.join(','), /V6_PRODUCT_SIGNOFF_GO_NO_GO_PROBE_REQUIRED/);
});

test('V6 product signoff assertion rejects fake approval exposure and production enablement', () => {
  const report = buildV6ProductSignoffTargetReport({
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
    approvesRelease: true,
    enablesProduction: true,
    publishesComms: true,
    executionStatus: 'executes',
    releaseGaps: [],
    observedEvidence: {
      ...report.observedEvidence,
      privateDataExposureCount: 1,
      playerVisibleSignoffSurfaceCount: 1,
      appliesWorldState: true,
      mutatesWorldState: true,
      exposesPrivateData: true,
      approvesRelease: true,
      enablesProduction: true,
      publishesComms: true
    }
  };
  const safety = assertV6ProductSignoffTargetReportSafe(unsafe);

  assert.equal(safety.ok, false);
  assert.match(safety.errors.join(','), /V6_PRODUCT_SIGNOFF_TARGET_RESEARCH_ONLY_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_PRODUCT_SIGNOFF_TARGET_RELEASE_READY_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_PRODUCT_SIGNOFF_TARGET_RUNTIME_HIDDEN_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_PRODUCT_SIGNOFF_TARGET_PLAYER_HIDDEN_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_PRODUCT_SIGNOFF_TARGET_EXECUTION_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_PRODUCT_SIGNOFF_TARGET_PRIVATE_DATA_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_PRODUCT_SIGNOFF_TARGET_NON_EXECUTING_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_PRODUCT_SIGNOFF_TARGET_RELEASE_GAPS_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_PRODUCT_SIGNOFF_TARGET_EVIDENCE_SAFETY_REQUIRED/);
});
