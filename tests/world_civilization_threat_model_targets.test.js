const test = require('node:test');
const assert = require('node:assert/strict');

const {
  REQUIRED_THREAT_MODEL_RELEASE_GAPS,
  REQUIRED_THREAT_MODEL_TARGET_KEYS,
  V6_THREAT_MODEL_TARGETS,
  V6_THREAT_MODEL_TARGETS_VERSION,
  assertV6ThreatModelTargetReportSafe,
  buildV6ThreatModelTargetReport,
  inspectThreatModelTargets
} = require('../server/world_civilization/threat_model_targets');

function observedEvidence(overrides = {}) {
  return {
    trustBoundaryProbeCount: 2,
    assetInventoryProbeCount: 2,
    attackerCapabilityProbeCount: 2,
    abusePathProbeCount: 2,
    mitigationMappingProbeCount: 3,
    residualRiskOwnerProbeCount: 1,
    workerRouteBoundaryProbeCount: 1,
    publicPrivateBoundaryProbeCount: 1,
    rollbackFailureModeProbeCount: 1,
    releaseSignoffInputProbeCount: 1,
    privateDataExposureCount: 0,
    playerVisibleThreatModelSurfaceCount: 0,
    appliesMitigations: false,
    appliesWorldState: false,
    mutatesWorldState: false,
    exposesPrivateData: false,
    ...overrides
  };
}

test('V6 threat model targets name every release threat-model surface', () => {
  const matrix = inspectThreatModelTargets();

  assert.equal(matrix.ok, true);
  assert.deepEqual(matrix.requiredKeys, REQUIRED_THREAT_MODEL_TARGET_KEYS);
  assert.deepEqual(matrix.missingKeys, []);
  assert.equal(matrix.targetCount, V6_THREAT_MODEL_TARGETS.length);
  assert.ok(matrix.targetKeys.includes('trust_boundaries'));
  assert.ok(matrix.targetKeys.includes('asset_inventory'));
  assert.ok(matrix.targetKeys.includes('attacker_capabilities'));
  assert.ok(matrix.targetKeys.includes('abuse_paths'));
  assert.ok(matrix.targetKeys.includes('rollback_failure_modes'));
  assert.match(matrix.digest, /^sha256:[a-f0-9]{64}$/);
});

test('V6 threat model report records research evidence without applying mitigations', () => {
  const report = buildV6ThreatModelTargetReport({
    observed: observedEvidence(),
    source: 'node_test'
  });

  assert.equal(report.version, V6_THREAT_MODEL_TARGETS_VERSION);
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
  assert.equal(report.appliesMitigations, false);
  assert.equal(report.executionStatus, 'not_executable');
  assert.equal(report.targetMatrix.ok, true);
  assert.equal(report.observedEvidence.abusePathProbeCount, 2);
  assert.equal(report.observedEvidence.mitigationMappingProbeCount, 3);
  assert.equal(report.observedEvidence.playerVisibleThreatModelSurfaceCount, 0);
  assert.deepEqual(report.releaseGaps, REQUIRED_THREAT_MODEL_RELEASE_GAPS);
  assert.deepEqual(assertV6ThreatModelTargetReportSafe(report), { ok: true, errors: [] });
});

test('V6 threat model report fails closed for incomplete targets or missing current probes', () => {
  const incomplete = buildV6ThreatModelTargetReport({
    targets: V6_THREAT_MODEL_TARGETS.filter((target) => target.key !== 'trust_boundaries'),
    observed: observedEvidence()
  });
  assert.equal(incomplete.ok, false);
  assert.match(incomplete.errors.join(','), /V6_THREAT_MODEL_TARGET_MATRIX_INCOMPLETE/);
  assert.match(assertV6ThreatModelTargetReportSafe(incomplete).errors.join(','), /V6_THREAT_MODEL_TARGET_ERRORS_PRESENT/);

  const missingProbes = buildV6ThreatModelTargetReport();
  assert.equal(missingProbes.ok, false);
  assert.match(missingProbes.errors.join(','), /V6_THREAT_MODEL_TRUST_BOUNDARY_PROBE_REQUIRED/);
  assert.match(missingProbes.errors.join(','), /V6_THREAT_MODEL_ASSET_INVENTORY_PROBE_REQUIRED/);
  assert.match(missingProbes.errors.join(','), /V6_THREAT_MODEL_ATTACKER_CAPABILITY_PROBE_REQUIRED/);
  assert.match(missingProbes.errors.join(','), /V6_THREAT_MODEL_ABUSE_PATH_PROBE_REQUIRED/);
  assert.match(missingProbes.errors.join(','), /V6_THREAT_MODEL_ROLLBACK_FAILURE_MODE_PROBE_REQUIRED/);
});

test('V6 threat model assertion rejects fake release readiness exposure and executable mitigations', () => {
  const report = buildV6ThreatModelTargetReport({
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
    appliesMitigations: true,
    executionStatus: 'executes',
    releaseGaps: [],
    observedEvidence: {
      ...report.observedEvidence,
      privateDataExposureCount: 1,
      playerVisibleThreatModelSurfaceCount: 1,
      appliesMitigations: true,
      appliesWorldState: true,
      mutatesWorldState: true,
      exposesPrivateData: true
    }
  };
  const safety = assertV6ThreatModelTargetReportSafe(unsafe);

  assert.equal(safety.ok, false);
  assert.match(safety.errors.join(','), /V6_THREAT_MODEL_TARGET_RESEARCH_ONLY_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_THREAT_MODEL_TARGET_RELEASE_READY_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_THREAT_MODEL_TARGET_RUNTIME_HIDDEN_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_THREAT_MODEL_TARGET_PLAYER_HIDDEN_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_THREAT_MODEL_TARGET_EXECUTION_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_THREAT_MODEL_TARGET_PRIVATE_DATA_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_THREAT_MODEL_TARGET_NON_EXECUTING_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_THREAT_MODEL_TARGET_RELEASE_GAPS_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_THREAT_MODEL_TARGET_EVIDENCE_SAFETY_REQUIRED/);
});
