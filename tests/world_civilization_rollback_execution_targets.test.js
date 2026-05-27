const test = require('node:test');
const assert = require('node:assert/strict');

const { CIVIC_ACTION_EFFECT_HANDLERS } = require('../server/world_civilization/schemas');
const {
  REQUIRED_ROLLBACK_EXECUTION_TARGET_KEYS,
  REQUIRED_ROLLBACK_EXECUTION_TARGET_RELEASE_GAPS,
  V6_CIVIC_ROLLBACK_EXECUTION_TARGETS,
  V6_ROLLBACK_EXECUTION_TARGETS_VERSION,
  assertV6RollbackExecutionTargetReportSafe,
  buildV6RollbackExecutionTargetReport,
  inspectRollbackExecutionTargetMatrix,
  rollbackHandlerFor
} = require('../server/world_civilization/rollback_execution_targets');

test('V6 rollback execution targets map every civic effect to a future rollback handler', () => {
  const matrix = inspectRollbackExecutionTargetMatrix();

  assert.equal(matrix.ok, true);
  assert.deepEqual(matrix.requiredKeys, REQUIRED_ROLLBACK_EXECUTION_TARGET_KEYS);
  assert.deepEqual(matrix.requiredKeys, Object.keys(CIVIC_ACTION_EFFECT_HANDLERS));
  assert.deepEqual(matrix.missingKeys, []);
  assert.equal(matrix.targetCount, V6_CIVIC_ROLLBACK_EXECUTION_TARGETS.length);
  assert.match(matrix.digest, /^sha256:[a-f0-9]{64}$/);
  for (const target of V6_CIVIC_ROLLBACK_EXECUTION_TARGETS) {
    assert.equal(target.applyHandler, CIVIC_ACTION_EFFECT_HANDLERS[target.effectType]);
    assert.equal(target.rollbackHandler, rollbackHandlerFor(target.applyHandler));
    assert.equal(target.currentStatus, 'non_executing_target');
    assert.ok(target.requiredChecks.includes('rollback_recovery_execution_drill'));
  }
});

test('V6 rollback execution target report records recovery evidence without executable handlers', () => {
  const report = buildV6RollbackExecutionTargetReport({
    observed: {
      preparedHandleCount: 1,
      recoverableHandleCount: 1,
      applyHandlerImplementationCount: 0,
      rollbackHandlerImplementationCount: 0,
      executionDrillCount: 0,
      runtimeExecutionAttempted: false,
      privateRowsIncluded: false,
      appliesWorldState: false
    },
    source: 'node_test'
  });

  assert.equal(report.version, V6_ROLLBACK_EXECUTION_TARGETS_VERSION);
  assert.equal(report.status, 'research_only');
  assert.equal(report.source, 'node_test');
  assert.equal(report.ok, true);
  assert.equal(report.releaseReady, false);
  assert.equal(report.productionReady, false);
  assert.equal(report.executionEnabled, false);
  assert.equal(report.runtimeExposed, false);
  assert.equal(report.playerVisible, false);
  assert.equal(report.normalGameplayExposure, false);
  assert.equal(report.appliesWorldState, false);
  assert.equal(report.exposesPrivateData, false);
  assert.equal(report.reportPayloadIncludesRows, false);
  assert.equal(report.executionStatus, 'not_executable');
  assert.equal(report.targetMatrix.ok, true);
  assert.equal(report.researchCalibration.preparedHandleCount, 1);
  assert.equal(report.researchCalibration.recoverableHandleCount, 1);
  assert.equal(report.researchCalibration.applyHandlerImplementationCount, 0);
  assert.deepEqual(report.releaseGaps, REQUIRED_ROLLBACK_EXECUTION_TARGET_RELEASE_GAPS);
  assert.deepEqual(assertV6RollbackExecutionTargetReportSafe(report), { ok: true, errors: [] });
});

test('V6 rollback execution target report fails closed for incomplete targets or missing calibration', () => {
  const incomplete = buildV6RollbackExecutionTargetReport({
    targets: V6_CIVIC_ROLLBACK_EXECUTION_TARGETS.filter((target) => target.key !== 'charter_update'),
    observed: {
      preparedHandleCount: 1,
      recoverableHandleCount: 1
    }
  });
  assert.equal(incomplete.ok, false);
  assert.match(incomplete.errors.join(','), /V6_ROLLBACK_EXECUTION_TARGET_MATRIX_INCOMPLETE/);
  assert.match(assertV6RollbackExecutionTargetReportSafe(incomplete).errors.join(','), /V6_ROLLBACK_EXECUTION_TARGET_ERRORS_PRESENT/);

  const missingCalibration = buildV6RollbackExecutionTargetReport();
  assert.equal(missingCalibration.ok, false);
  assert.match(missingCalibration.errors.join(','), /V6_ROLLBACK_EXECUTION_PREPARED_HANDLE_CALIBRATION_REQUIRED/);
  assert.match(missingCalibration.errors.join(','), /V6_ROLLBACK_EXECUTION_RECOVERABLE_HANDLE_CALIBRATION_REQUIRED/);
});

test('V6 rollback execution target assertion rejects fake release execution and private row drift', () => {
  const report = buildV6RollbackExecutionTargetReport({
    observed: {
      preparedHandleCount: 1,
      recoverableHandleCount: 1
    }
  });
  const unsafe = {
    ...report,
    status: 'release_candidate',
    releaseReady: true,
    productionReady: true,
    executionEnabled: true,
    runtimeExposed: true,
    playerVisible: true,
    normalGameplayExposure: true,
    appliesWorldState: true,
    exposesPrivateData: true,
    reportPayloadIncludesRows: true,
    executionStatus: 'executes',
    releaseGaps: [],
    researchCalibration: {
      ...report.researchCalibration,
      applyHandlerImplementationCount: 1,
      rollbackHandlerImplementationCount: 1,
      executionDrillCount: 1,
      runtimeExecutionAttempted: true,
      privateRowsIncluded: true,
      appliesWorldState: true
    }
  };
  const safety = assertV6RollbackExecutionTargetReportSafe(unsafe);

  assert.equal(safety.ok, false);
  assert.match(safety.errors.join(','), /V6_ROLLBACK_EXECUTION_TARGET_RESEARCH_ONLY_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_ROLLBACK_EXECUTION_TARGET_RELEASE_READY_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_ROLLBACK_EXECUTION_TARGET_EXECUTION_ENABLED_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_ROLLBACK_EXECUTION_TARGET_RUNTIME_HIDDEN_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_ROLLBACK_EXECUTION_TARGET_PLAYER_HIDDEN_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_ROLLBACK_EXECUTION_TARGET_WORLD_APPLICATION_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_ROLLBACK_EXECUTION_TARGET_PRIVATE_ROW_REPORT_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_ROLLBACK_EXECUTION_TARGET_NON_EXECUTING_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_ROLLBACK_EXECUTION_TARGET_RELEASE_GAPS_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_ROLLBACK_EXECUTION_TARGET_IMPLEMENTATION_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_ROLLBACK_EXECUTION_TARGET_CALIBRATION_SAFETY_REQUIRED/);
});
