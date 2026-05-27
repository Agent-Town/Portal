const test = require('node:test');
const assert = require('node:assert/strict');

const {
  REQUIRED_DATA_RETENTION_RELEASE_GAPS,
  REQUIRED_DATA_RETENTION_TARGET_KEYS,
  V6_DATA_RETENTION_TARGETS,
  V6_DATA_RETENTION_TARGETS_VERSION,
  assertV6DataRetentionTargetReportSafe,
  buildV6DataRetentionTargetReport,
  inspectDataRetentionTargets
} = require('../server/world_civilization/data_retention_targets');

function observedEvidence(overrides = {}) {
  return {
    auditRetentionTargetCount: 2,
    civicStoreCoverageCount: 6,
    debugTraceRedactionProbeCount: 1,
    privateCredentialExclusionProbeCount: 2,
    backupRetentionProbeCount: 0,
    subjectExportWorkflowProbeCount: 0,
    subjectDeletionWorkflowProbeCount: 0,
    retentionAwareReplayProbeCount: 1,
    privateDataExposureCount: 0,
    playerVisibleRetentionSurfaceCount: 0,
    deletesRuntimeData: false,
    appliesRetentionExpiry: false,
    mutatesWorldState: false,
    exposesPrivateData: false,
    ...overrides
  };
}

test('V6 data retention targets name every release privacy surface', () => {
  const matrix = inspectDataRetentionTargets();

  assert.equal(matrix.ok, true);
  assert.deepEqual(matrix.requiredKeys, REQUIRED_DATA_RETENTION_TARGET_KEYS);
  assert.deepEqual(matrix.missingKeys, []);
  assert.equal(matrix.targetCount, V6_DATA_RETENTION_TARGETS.length);
  assert.ok(matrix.targetKeys.includes('audit_ledger_retention'));
  assert.ok(matrix.targetKeys.includes('worker_debug_trace_retention'));
  assert.ok(matrix.targetKeys.includes('subject_export_boundary'));
  assert.ok(matrix.targetKeys.includes('subject_deletion_boundary'));
  assert.ok(matrix.targetKeys.includes('backup_restore_retention'));
  assert.match(matrix.digest, /^sha256:[a-f0-9]{64}$/);
});

test('V6 data retention report records current research evidence without applying expiry or deletion', () => {
  const report = buildV6DataRetentionTargetReport({
    observed: observedEvidence(),
    source: 'node_test'
  });

  assert.equal(report.version, V6_DATA_RETENTION_TARGETS_VERSION);
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
  assert.equal(report.deletesRuntimeData, false);
  assert.equal(report.executionStatus, 'not_executable');
  assert.equal(report.targetMatrix.ok, true);
  assert.equal(report.observedEvidence.civicStoreCoverageCount, 6);
  assert.equal(report.observedEvidence.subjectExportWorkflowPresent, false);
  assert.equal(report.observedEvidence.subjectDeletionWorkflowPresent, false);
  assert.equal(report.observedEvidence.backupRetentionDrillPresent, false);
  assert.deepEqual(report.releaseGaps, REQUIRED_DATA_RETENTION_RELEASE_GAPS);
  assert.deepEqual(assertV6DataRetentionTargetReportSafe(report), { ok: true, errors: [] });
});

test('V6 data retention report fails closed for incomplete targets or missing current probes', () => {
  const incomplete = buildV6DataRetentionTargetReport({
    targets: V6_DATA_RETENTION_TARGETS.filter((target) => target.key !== 'audit_ledger_retention'),
    observed: observedEvidence()
  });
  assert.equal(incomplete.ok, false);
  assert.match(incomplete.errors.join(','), /V6_DATA_RETENTION_TARGET_MATRIX_INCOMPLETE/);
  assert.match(assertV6DataRetentionTargetReportSafe(incomplete).errors.join(','), /V6_DATA_RETENTION_TARGET_ERRORS_PRESENT/);

  const missingProbes = buildV6DataRetentionTargetReport();
  assert.equal(missingProbes.ok, false);
  assert.match(missingProbes.errors.join(','), /V6_DATA_RETENTION_AUDIT_TARGET_PROBE_REQUIRED/);
  assert.match(missingProbes.errors.join(','), /V6_DATA_RETENTION_CIVIC_STORE_PROBE_REQUIRED/);
  assert.match(missingProbes.errors.join(','), /V6_DATA_RETENTION_DEBUG_TRACE_PROBE_REQUIRED/);
  assert.match(missingProbes.errors.join(','), /V6_DATA_RETENTION_PRIVATE_CREDENTIAL_EXCLUSION_PROBE_REQUIRED/);
  assert.match(missingProbes.errors.join(','), /V6_DATA_RETENTION_REPLAY_PROBE_REQUIRED/);
});

test('V6 data retention assertion rejects fake release readiness runtime deletion and private data', () => {
  const report = buildV6DataRetentionTargetReport({
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
    deletesRuntimeData: true,
    executionStatus: 'executes',
    releaseGaps: [],
    observedEvidence: {
      ...report.observedEvidence,
      privateDataExposureCount: 1,
      playerVisibleRetentionSurfaceCount: 1,
      deletesRuntimeData: true,
      appliesRetentionExpiry: true,
      mutatesWorldState: true,
      exposesPrivateData: true
    }
  };
  const safety = assertV6DataRetentionTargetReportSafe(unsafe);

  assert.equal(safety.ok, false);
  assert.match(safety.errors.join(','), /V6_DATA_RETENTION_TARGET_RESEARCH_ONLY_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_DATA_RETENTION_TARGET_RELEASE_READY_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_DATA_RETENTION_TARGET_RUNTIME_HIDDEN_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_DATA_RETENTION_TARGET_PLAYER_HIDDEN_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_DATA_RETENTION_TARGET_WORLD_MUTATION_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_DATA_RETENTION_TARGET_PRIVATE_DATA_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_DATA_RETENTION_TARGET_RUNTIME_DELETION_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_DATA_RETENTION_TARGET_NON_EXECUTING_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_DATA_RETENTION_TARGET_RELEASE_GAPS_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_DATA_RETENTION_TARGET_EVIDENCE_SAFETY_REQUIRED/);
});
