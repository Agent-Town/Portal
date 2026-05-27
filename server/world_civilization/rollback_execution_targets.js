const crypto = require('crypto');

const { CIVIC_ACTION_EFFECT_HANDLERS } = require('./schemas');

const V6_ROLLBACK_EXECUTION_TARGETS_VERSION = 'agent-town.v6.rollback_execution_targets.v1';
const REQUIRED_ROLLBACK_EXECUTION_TARGET_CHECKS = [
  'real_before_after_state',
  'authorization_enforced',
  'idempotent_apply_rollback',
  'irreversible_action_review',
  'conservation_tests',
  'applied_and_rollback_audit',
  'worker_route_security',
  'rollback_recovery_execution_drill'
];
const REQUIRED_ROLLBACK_EXECUTION_TARGET_RELEASE_GAPS = [
  'executable_apply_handlers_required',
  'executable_rollback_handlers_required',
  'real_before_after_state_capture_required',
  'idempotent_apply_rollback_required',
  'conservation_tests_required',
  'applied_and_rollback_audit_required',
  'worker_route_security_required',
  'rollback_recovery_execution_drill_required'
];
const REQUIRED_ROLLBACK_EXECUTION_TARGET_KEYS = Object.keys(CIVIC_ACTION_EFFECT_HANDLERS);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sha256(value = '') {
  return `sha256:${crypto.createHash('sha256').update(String(value || ''), 'utf8').digest('hex')}`;
}

function numberValue(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : fallback;
}

function rollbackHandlerFor(applyHandler = '') {
  return String(applyHandler || '').endsWith('.apply')
    ? String(applyHandler).replace(/\.apply$/, '.rollback')
    : `${applyHandler}.rollback`;
}

function buildDefaultTargets() {
  return Object.entries(CIVIC_ACTION_EFFECT_HANDLERS).map(([effectType, applyHandler]) => ({
    key: effectType,
    effectType,
    applyHandler,
    rollbackHandler: rollbackHandlerFor(applyHandler),
    currentStatus: 'non_executing_target',
    requiredChecks: [...REQUIRED_ROLLBACK_EXECUTION_TARGET_CHECKS],
    currentEvidence: [
      'server/world_civilization/effects.js',
      'server/world_civilization/rollback_recovery.js',
      'tests/world_civilization_effects.test.js',
      'tests/world_civilization_rollback_recovery.test.js'
    ],
    releaseEvidenceRequired: 'typed_apply_rollback_execution_with_recovery_drill'
  }));
}

const V6_CIVIC_ROLLBACK_EXECUTION_TARGETS = buildDefaultTargets();

function targetMatrixDigest(targets = V6_CIVIC_ROLLBACK_EXECUTION_TARGETS) {
  return sha256(JSON.stringify(targets.map((target) => ({
    key: target.key,
    effectType: target.effectType,
    applyHandler: target.applyHandler,
    rollbackHandler: target.rollbackHandler,
    requiredChecks: target.requiredChecks,
    releaseEvidenceRequired: target.releaseEvidenceRequired
  }))));
}

function inspectRollbackExecutionTargetMatrix(targets = V6_CIVIC_ROLLBACK_EXECUTION_TARGETS) {
  const safeTargets = Array.isArray(targets) ? targets : [];
  const targetKeys = safeTargets.map((target) => String(target.key || ''));
  const missingKeys = REQUIRED_ROLLBACK_EXECUTION_TARGET_KEYS.filter((key) => !targetKeys.includes(key));
  const incompleteTargets = [];
  for (const target of safeTargets) {
    const key = String(target.key || '');
    const expectedApply = CIVIC_ACTION_EFFECT_HANDLERS[key];
    const expectedRollback = rollbackHandlerFor(expectedApply);
    const checks = Array.isArray(target.requiredChecks) ? target.requiredChecks : [];
    const missingChecks = REQUIRED_ROLLBACK_EXECUTION_TARGET_CHECKS.filter((check) => !checks.includes(check));
    if (
      !key
      || target.effectType !== key
      || target.applyHandler !== expectedApply
      || target.rollbackHandler !== expectedRollback
      || target.currentStatus !== 'non_executing_target'
      || missingChecks.length > 0
      || !target.releaseEvidenceRequired
    ) {
      incompleteTargets.push(key || 'unknown');
    }
  }
  return {
    ok: missingKeys.length === 0 && incompleteTargets.length === 0,
    requiredKeys: [...REQUIRED_ROLLBACK_EXECUTION_TARGET_KEYS],
    targetKeys,
    missingKeys,
    incompleteTargets,
    targetCount: safeTargets.length,
    digest: targetMatrixDigest(safeTargets)
  };
}

function buildMissingReport(errors = []) {
  return {
    version: V6_ROLLBACK_EXECUTION_TARGETS_VERSION,
    status: 'research_only',
    ok: false,
    errors,
    releaseReady: false,
    productionReady: false,
    executionEnabled: false,
    runtimeExposed: false,
    playerVisible: false,
    normalGameplayExposure: false,
    appliesWorldState: false,
    exposesPrivateData: false,
    reportPayloadIncludesRows: false,
    executionStatus: 'not_executable',
    targetMatrix: inspectRollbackExecutionTargetMatrix([]),
    researchCalibration: {},
    releaseGaps: [...REQUIRED_ROLLBACK_EXECUTION_TARGET_RELEASE_GAPS]
  };
}

function buildV6RollbackExecutionTargetReport({
  targets = V6_CIVIC_ROLLBACK_EXECUTION_TARGETS,
  observed = {},
  source = 'runtime'
} = {}) {
  const targetMatrix = inspectRollbackExecutionTargetMatrix(targets);
  const researchCalibration = {
    preparedHandleCount: numberValue(observed.preparedHandleCount),
    recoverableHandleCount: numberValue(observed.recoverableHandleCount),
    applyHandlerImplementationCount: numberValue(observed.applyHandlerImplementationCount),
    rollbackHandlerImplementationCount: numberValue(observed.rollbackHandlerImplementationCount),
    executionDrillCount: numberValue(observed.executionDrillCount),
    runtimeExecutionAttempted: observed.runtimeExecutionAttempted === true,
    privateRowsIncluded: observed.privateRowsIncluded === true,
    appliesWorldState: observed.appliesWorldState === true
  };
  const errors = [];
  if (targetMatrix.ok !== true) errors.push('V6_ROLLBACK_EXECUTION_TARGET_MATRIX_INCOMPLETE');
  if (researchCalibration.preparedHandleCount <= 0) errors.push('V6_ROLLBACK_EXECUTION_PREPARED_HANDLE_CALIBRATION_REQUIRED');
  if (researchCalibration.recoverableHandleCount <= 0) errors.push('V6_ROLLBACK_EXECUTION_RECOVERABLE_HANDLE_CALIBRATION_REQUIRED');
  if (researchCalibration.applyHandlerImplementationCount > 0) errors.push('V6_ROLLBACK_EXECUTION_APPLY_HANDLER_IMPLEMENTATION_FORBIDDEN');
  if (researchCalibration.rollbackHandlerImplementationCount > 0) errors.push('V6_ROLLBACK_EXECUTION_ROLLBACK_HANDLER_IMPLEMENTATION_FORBIDDEN');
  if (researchCalibration.executionDrillCount > 0 || researchCalibration.runtimeExecutionAttempted) {
    errors.push('V6_ROLLBACK_EXECUTION_RUNTIME_EXECUTION_FORBIDDEN');
  }
  if (researchCalibration.privateRowsIncluded) errors.push('V6_ROLLBACK_EXECUTION_PRIVATE_ROW_REPORT_FORBIDDEN');
  if (researchCalibration.appliesWorldState) errors.push('V6_ROLLBACK_EXECUTION_WORLD_APPLICATION_FORBIDDEN');
  if (errors.length > 0) {
    return {
      ...buildMissingReport(errors),
      source,
      targetMatrix,
      researchCalibration
    };
  }

  return {
    version: V6_ROLLBACK_EXECUTION_TARGETS_VERSION,
    status: 'research_only',
    source,
    ok: true,
    errors: [],
    releaseReady: false,
    productionReady: false,
    executionEnabled: false,
    runtimeExposed: false,
    playerVisible: false,
    normalGameplayExposure: false,
    appliesWorldState: false,
    exposesPrivateData: false,
    reportPayloadIncludesRows: false,
    executionStatus: 'not_executable',
    targetMatrix,
    targets: clone(targets),
    researchCalibration,
    releaseGaps: [...REQUIRED_ROLLBACK_EXECUTION_TARGET_RELEASE_GAPS]
  };
}

function assertV6RollbackExecutionTargetReportSafe(report = {}) {
  const errors = [];
  if (report.version !== V6_ROLLBACK_EXECUTION_TARGETS_VERSION) {
    errors.push('V6_ROLLBACK_EXECUTION_TARGET_VERSION_REQUIRED');
  }
  if (report.status !== 'research_only') {
    errors.push('V6_ROLLBACK_EXECUTION_TARGET_RESEARCH_ONLY_REQUIRED');
  }
  if (report.releaseReady !== false || report.productionReady !== false) {
    errors.push('V6_ROLLBACK_EXECUTION_TARGET_RELEASE_READY_FORBIDDEN');
  }
  if (report.executionEnabled !== false) {
    errors.push('V6_ROLLBACK_EXECUTION_TARGET_EXECUTION_ENABLED_FORBIDDEN');
  }
  if (report.runtimeExposed !== false) {
    errors.push('V6_ROLLBACK_EXECUTION_TARGET_RUNTIME_HIDDEN_REQUIRED');
  }
  if (report.playerVisible !== false || report.normalGameplayExposure !== false) {
    errors.push('V6_ROLLBACK_EXECUTION_TARGET_PLAYER_HIDDEN_REQUIRED');
  }
  if (report.appliesWorldState !== false) {
    errors.push('V6_ROLLBACK_EXECUTION_TARGET_WORLD_APPLICATION_FORBIDDEN');
  }
  if (report.exposesPrivateData !== false || report.reportPayloadIncludesRows !== false) {
    errors.push('V6_ROLLBACK_EXECUTION_TARGET_PRIVATE_ROW_REPORT_FORBIDDEN');
  }
  if (report.executionStatus !== 'not_executable') {
    errors.push('V6_ROLLBACK_EXECUTION_TARGET_NON_EXECUTING_REQUIRED');
  }
  if (
    !Array.isArray(report.releaseGaps)
    || REQUIRED_ROLLBACK_EXECUTION_TARGET_RELEASE_GAPS.some((gap) => !report.releaseGaps.includes(gap))
  ) {
    errors.push('V6_ROLLBACK_EXECUTION_TARGET_RELEASE_GAPS_REQUIRED');
  }
  if (report.targetMatrix?.ok !== true || (report.targetMatrix?.missingKeys || []).length > 0) {
    errors.push('V6_ROLLBACK_EXECUTION_TARGET_MATRIX_REQUIRED');
  }
  const calibration = report.researchCalibration || {};
  if (
    calibration.applyHandlerImplementationCount > 0
    || calibration.rollbackHandlerImplementationCount > 0
    || calibration.executionDrillCount > 0
    || calibration.runtimeExecutionAttempted === true
  ) {
    errors.push('V6_ROLLBACK_EXECUTION_TARGET_IMPLEMENTATION_FORBIDDEN');
  }
  if (calibration.privateRowsIncluded === true || calibration.appliesWorldState === true) {
    errors.push('V6_ROLLBACK_EXECUTION_TARGET_CALIBRATION_SAFETY_REQUIRED');
  }
  if (report.ok !== true || (Array.isArray(report.errors) && report.errors.length > 0)) {
    errors.push('V6_ROLLBACK_EXECUTION_TARGET_ERRORS_PRESENT');
  }
  return {
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  REQUIRED_ROLLBACK_EXECUTION_TARGET_CHECKS: [...REQUIRED_ROLLBACK_EXECUTION_TARGET_CHECKS],
  REQUIRED_ROLLBACK_EXECUTION_TARGET_KEYS: [...REQUIRED_ROLLBACK_EXECUTION_TARGET_KEYS],
  REQUIRED_ROLLBACK_EXECUTION_TARGET_RELEASE_GAPS: [...REQUIRED_ROLLBACK_EXECUTION_TARGET_RELEASE_GAPS],
  V6_CIVIC_ROLLBACK_EXECUTION_TARGETS: clone(V6_CIVIC_ROLLBACK_EXECUTION_TARGETS),
  V6_ROLLBACK_EXECUTION_TARGETS_VERSION,
  assertV6RollbackExecutionTargetReportSafe,
  buildV6RollbackExecutionTargetReport,
  inspectRollbackExecutionTargetMatrix,
  rollbackHandlerFor
};
