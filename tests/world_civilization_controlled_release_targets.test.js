const test = require('node:test');
const assert = require('node:assert/strict');

const {
  REQUIRED_CONTROLLED_RELEASE_TARGET_GAPS,
  REQUIRED_CONTROLLED_RELEASE_TARGET_KEYS,
  V6_CONTROLLED_RELEASE_TARGETS,
  V6_CONTROLLED_RELEASE_TARGETS_VERSION,
  assertV6ControlledReleaseTargetReportSafe,
  buildV6ControlledReleaseTargetReport,
  inspectControlledReleaseTargets
} = require('../server/world_civilization/controlled_release_targets');

function observedEvidence(overrides = {}) {
  return {
    readinessGateProbeCount: 1,
    productionFlagProbeCount: 1,
    rollbackDisableProbeCount: 1,
    releaseEvidenceManifestProbeCount: 1,
    observabilityProbeCount: 1,
    supportRunbookProbeCount: 1,
    releaseSignoffPacketProbeCount: 1,
    blockerClearanceProbeCount: 1,
    releaseWindowProbeCount: 1,
    canaryExitProbeCount: 1,
    emergencyDisableProbeCount: 1,
    postReleaseVerificationProbeCount: 1,
    privateDataExposureCount: 0,
    playerVisibleControlledReleaseSurfaceCount: 0,
    appliesWorldState: false,
    mutatesWorldState: false,
    exposesPrivateData: false,
    productionEnabled: false,
    exposesRuntime: false,
    approvesRelease: false,
    executesRelease: false,
    ...overrides
  };
}

test('V6 controlled release targets name every launch control surface', () => {
  const matrix = inspectControlledReleaseTargets();

  assert.equal(matrix.ok, true);
  assert.deepEqual(matrix.requiredKeys, REQUIRED_CONTROLLED_RELEASE_TARGET_KEYS);
  assert.deepEqual(matrix.missingKeys, []);
  assert.equal(matrix.targetCount, V6_CONTROLLED_RELEASE_TARGETS.length);
  assert.ok(matrix.targetKeys.includes('readiness_gate_closed'));
  assert.ok(matrix.targetKeys.includes('production_flag_safety'));
  assert.equal(
    V6_CONTROLLED_RELEASE_TARGETS.find((target) => target.key === 'production_flag_safety').currentEvidence,
    'server/world_civilization/release_operations.js'
  );
  assert.ok(matrix.targetKeys.includes('rollback_disable_controls'));
  assert.equal(
    V6_CONTROLLED_RELEASE_TARGETS.find((target) => target.key === 'rollback_disable_controls').currentEvidence,
    'server/world_civilization/release_operations.js'
  );
  assert.ok(matrix.targetKeys.includes('release_evidence_manifest'));
  assert.equal(
    V6_CONTROLLED_RELEASE_TARGETS.find((target) => target.key === 'release_evidence_manifest').currentEvidence,
    'server/world_civilization/release_evidence_manifest.js'
  );
  assert.ok(matrix.targetKeys.includes('observability'));
  assert.equal(
    V6_CONTROLLED_RELEASE_TARGETS.find((target) => target.key === 'observability').currentEvidence,
    'server/world_civilization/release_observability.js'
  );
  assert.ok(matrix.targetKeys.includes('support_runbook'));
  assert.equal(
    V6_CONTROLLED_RELEASE_TARGETS.find((target) => target.key === 'support_runbook').currentEvidence,
    'server/world_civilization/release_support.js'
  );
  assert.ok(matrix.targetKeys.includes('release_signoff_packet'));
  assert.equal(
    V6_CONTROLLED_RELEASE_TARGETS.find((target) => target.key === 'release_signoff_packet').currentEvidence,
    'server/world_civilization/release_signoff_packet.js'
  );
  assert.ok(matrix.targetKeys.includes('blocker_clearance'));
  assert.ok(matrix.targetKeys.includes('controlled_release_window'));
  assert.equal(
    V6_CONTROLLED_RELEASE_TARGETS.find((target) => target.key === 'controlled_release_window').currentEvidence,
    'server/world_civilization/release_operations.js'
  );
  assert.ok(matrix.targetKeys.includes('canary_exit'));
  assert.equal(
    V6_CONTROLLED_RELEASE_TARGETS.find((target) => target.key === 'canary_exit').currentEvidence,
    'server/world_civilization/release_operations.js'
  );
  assert.ok(matrix.targetKeys.includes('emergency_disable'));
  assert.equal(
    V6_CONTROLLED_RELEASE_TARGETS.find((target) => target.key === 'emergency_disable').currentEvidence,
    'server/world_civilization/release_operations.js'
  );
  assert.equal(
    V6_CONTROLLED_RELEASE_TARGETS.find((target) => target.key === 'post_release_verification').currentEvidence,
    'server/world_civilization/release_operations.js'
  );
  assert.equal(
    V6_CONTROLLED_RELEASE_TARGETS.find((target) => target.key === 'blocker_clearance').currentEvidence,
    'server/world_civilization/blocker_exception_register.js'
  );
  assert.match(matrix.digest, /^sha256:[a-f0-9]{64}$/);
});

test('V6 controlled release target report records evidence without enabling production', () => {
  const report = buildV6ControlledReleaseTargetReport({
    observed: observedEvidence(),
    source: 'node_test'
  });

  assert.equal(report.version, V6_CONTROLLED_RELEASE_TARGETS_VERSION);
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
  assert.equal(report.executesRelease, false);
  assert.equal(report.executionStatus, 'not_executable');
  assert.equal(report.targetMatrix.ok, true);
  assert.equal(report.observedEvidence.productionFlagProbeCount, 1);
  assert.equal(report.observedEvidence.releaseEvidenceManifestProbeCount, 1);
  assert.equal(report.observedEvidence.releaseSignoffPacketProbeCount, 1);
  assert.equal(report.observedEvidence.playerVisibleControlledReleaseSurfaceCount, 0);
  assert.deepEqual(report.releaseGaps, REQUIRED_CONTROLLED_RELEASE_TARGET_GAPS);
  assert.deepEqual(assertV6ControlledReleaseTargetReportSafe(report), { ok: true, errors: [] });
});

test('V6 controlled release target report fails closed for incomplete targets or missing current probes', () => {
  const incomplete = buildV6ControlledReleaseTargetReport({
    targets: V6_CONTROLLED_RELEASE_TARGETS.filter((target) => target.key !== 'production_flag_safety'),
    observed: observedEvidence()
  });
  assert.equal(incomplete.ok, false);
  assert.match(incomplete.errors.join(','), /V6_CONTROLLED_RELEASE_TARGET_MATRIX_INCOMPLETE/);
  assert.match(assertV6ControlledReleaseTargetReportSafe(incomplete).errors.join(','), /V6_CONTROLLED_RELEASE_TARGET_ERRORS_PRESENT/);

  const missingProbes = buildV6ControlledReleaseTargetReport();
  assert.equal(missingProbes.ok, false);
  assert.match(missingProbes.errors.join(','), /V6_CONTROLLED_RELEASE_READINESS_GATE_PROBE_REQUIRED/);
  assert.match(missingProbes.errors.join(','), /V6_CONTROLLED_RELEASE_PRODUCTION_FLAG_PROBE_REQUIRED/);
  assert.match(missingProbes.errors.join(','), /V6_CONTROLLED_RELEASE_ROLLBACK_DISABLE_PROBE_REQUIRED/);
  assert.match(missingProbes.errors.join(','), /V6_CONTROLLED_RELEASE_EVIDENCE_MANIFEST_PROBE_REQUIRED/);
  assert.match(missingProbes.errors.join(','), /V6_CONTROLLED_RELEASE_SIGNOFF_PACKET_PROBE_REQUIRED/);
  assert.match(missingProbes.errors.join(','), /V6_CONTROLLED_RELEASE_BLOCKER_CLEARANCE_PROBE_REQUIRED/);
  assert.match(missingProbes.errors.join(','), /V6_CONTROLLED_RELEASE_EMERGENCY_DISABLE_PROBE_REQUIRED/);
});

test('V6 controlled release assertion rejects fake production enablement or exposure', () => {
  const report = buildV6ControlledReleaseTargetReport({
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
    executesRelease: true,
    executionStatus: 'executes',
    releaseGaps: [],
    observedEvidence: {
      ...report.observedEvidence,
      privateDataExposureCount: 1,
      playerVisibleControlledReleaseSurfaceCount: 1,
      appliesWorldState: true,
      mutatesWorldState: true,
      exposesPrivateData: true,
      productionEnabled: true,
      exposesRuntime: true,
      approvesRelease: true,
      executesRelease: true
    }
  };
  const safety = assertV6ControlledReleaseTargetReportSafe(unsafe);

  assert.equal(safety.ok, false);
  assert.match(safety.errors.join(','), /V6_CONTROLLED_RELEASE_TARGET_RESEARCH_ONLY_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_CONTROLLED_RELEASE_TARGET_READY_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_CONTROLLED_RELEASE_TARGET_PRODUCTION_ENABLEMENT_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_CONTROLLED_RELEASE_TARGET_PLAYER_HIDDEN_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_CONTROLLED_RELEASE_TARGET_EXECUTION_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_CONTROLLED_RELEASE_TARGET_PRIVATE_DATA_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_CONTROLLED_RELEASE_TARGET_NON_EXECUTING_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_CONTROLLED_RELEASE_TARGET_RELEASE_GAPS_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_CONTROLLED_RELEASE_TARGET_EVIDENCE_SAFETY_REQUIRED/);
});
