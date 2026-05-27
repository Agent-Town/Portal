const crypto = require('crypto');

const V6_RELEASE_OPERATIONS_VERSION = 'agent-town.v6.release_operations.v1';

const REQUIRED_RELEASE_OPERATIONS_KEYS = [
  'production_flag_control',
  'release_window',
  'go_no_go_record',
  'canary_scope',
  'canary_exit',
  'emergency_disable',
  'rollback_window',
  'rollback_disable_drill',
  'post_release_verification',
  'normal_gameplay_baseline',
  'audit_replay_health_check',
  'evidence_archive'
];

const REQUIRED_RELEASE_OPERATIONS_GAPS = [
  'admin_enablement_signoff_required',
  'release_window_required',
  'go_no_go_required',
  'canary_scope_required',
  'canary_exit_required',
  'emergency_disable_drill_required',
  'rollback_disable_drill_required',
  'post_release_verification_required',
  'normal_gameplay_baseline_required',
  'audit_replay_health_required',
  'evidence_archive_required'
];

const V6_RELEASE_OPERATIONS_REQUIREMENTS = [
  {
    key: 'production_flag_control',
    owner: 'release_engineering',
    requiredEvidence: 'Production V6 enablement must be default-off, admin-only, cohort-scoped, broad-override-proof, and emergency-disableable.',
    releaseEvidenceRequired: 'production_flag_control_record'
  },
  {
    key: 'release_window',
    owner: 'release_manager',
    requiredEvidence: 'Controlled release must name an approved window, freeze boundary, decision deadline, rollback window, monitoring owner, and release manager.',
    releaseEvidenceRequired: 'controlled_release_window_record'
  },
  {
    key: 'go_no_go_record',
    owner: 'release_manager',
    requiredEvidence: 'Go/no-go must record product, engineering, security, QA, support, and release manager decisions with blocker disposition.',
    releaseEvidenceRequired: 'controlled_release_go_no_go_record'
  },
  {
    key: 'canary_scope',
    owner: 'product_engineering',
    requiredEvidence: 'Canary scope must name cohort identity, entry path, excluded surfaces, normal gameplay absence check, and expansion boundary.',
    releaseEvidenceRequired: 'canary_scope_record'
  },
  {
    key: 'canary_exit',
    owner: 'qa_engineering',
    requiredEvidence: 'Canary exit criteria must cover audit/replay health, runtime tool scope, support load, blocker state, console budget, and rollback readiness.',
    releaseEvidenceRequired: 'canary_exit_criteria_record'
  },
  {
    key: 'emergency_disable',
    owner: 'release_engineering',
    requiredEvidence: 'Emergency disable must stop new V6 civic writes, hide runtime civic tools and surfaces, preserve audit rows, and name verification owners.',
    releaseEvidenceRequired: 'emergency_disable_drill_record'
  },
  {
    key: 'rollback_window',
    owner: 'release_manager',
    requiredEvidence: 'Rollback window must name rollback owner, backup owner, decision deadline, data-preservation rule, and post-rollback verification owner.',
    releaseEvidenceRequired: 'rollback_window_record'
  },
  {
    key: 'rollback_disable_drill',
    owner: 'qa_engineering',
    requiredEvidence: 'Rollback and disable drills must prove the steps are rehearsed, idempotent, privacy-safe, and mapped to support and observability handoffs.',
    releaseEvidenceRequired: 'rollback_disable_drill_record'
  },
  {
    key: 'post_release_verification',
    owner: 'release_engineering',
    requiredEvidence: 'Post-release verification must confirm approved visibility, runtime tool scope, support routing, blocker updates, rollback readiness, and monitoring handoff.',
    releaseEvidenceRequired: 'post_release_verification_record'
  },
  {
    key: 'normal_gameplay_baseline',
    owner: 'qa_engineering',
    requiredEvidence: 'Normal gameplay baseline must prove non-cohort players still see no V6 civic surfaces, tools, public free play, or autonomous public mutations.',
    releaseEvidenceRequired: 'normal_gameplay_baseline_record'
  },
  {
    key: 'audit_replay_health_check',
    owner: 'security_engineering',
    requiredEvidence: 'Release operations must include audit ledger hash-chain, replay reconstruction, rollback handle, and privacy-safe summary health checks.',
    releaseEvidenceRequired: 'audit_replay_health_check'
  },
  {
    key: 'evidence_archive',
    owner: 'release_manager',
    requiredEvidence: 'Release evidence archive must link command transcripts, Playwright traces, signoff records, blocker disposition, support handoff, and observability handoff.',
    releaseEvidenceRequired: 'controlled_release_evidence_archive'
  }
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sha256(value = '') {
  return `sha256:${crypto.createHash('sha256').update(String(value || ''), 'utf8').digest('hex')}`;
}

function numberValue(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : fallback;
}

function targetMatrixDigest(requirements = V6_RELEASE_OPERATIONS_REQUIREMENTS) {
  return sha256(JSON.stringify(requirements.map((requirement) => ({
    key: requirement.key,
    owner: requirement.owner,
    requiredEvidence: requirement.requiredEvidence,
    releaseEvidenceRequired: requirement.releaseEvidenceRequired
  }))));
}

function inspectReleaseOperationsRequirements(requirements = V6_RELEASE_OPERATIONS_REQUIREMENTS) {
  const safeRequirements = Array.isArray(requirements) ? requirements : [];
  const requirementKeys = safeRequirements.map((requirement) => String(requirement.key || ''));
  const missingKeys = REQUIRED_RELEASE_OPERATIONS_KEYS.filter((key) => !requirementKeys.includes(key));
  const incompleteRequirements = safeRequirements.filter((requirement) => (
    !requirement.key
    || !requirement.owner
    || !requirement.requiredEvidence
    || !requirement.releaseEvidenceRequired
  )).map((requirement) => String(requirement.key || 'unknown'));

  return {
    ok: missingKeys.length === 0 && incompleteRequirements.length === 0,
    requiredKeys: [...REQUIRED_RELEASE_OPERATIONS_KEYS],
    requirementKeys,
    missingKeys,
    incompleteRequirements,
    requirementCount: safeRequirements.length,
    digest: targetMatrixDigest(safeRequirements)
  };
}

function buildMissingReport(errors = []) {
  return {
    version: V6_RELEASE_OPERATIONS_VERSION,
    status: 'research_only',
    ok: false,
    errors,
    releaseReady: false,
    productionReady: false,
    productionEnabled: false,
    runtimeExposed: false,
    playerVisible: false,
    normalGameplayExposure: false,
    mutatesWorldState: false,
    exposesPrivateData: false,
    approvesRelease: false,
    opensCanary: false,
    expandsCohort: false,
    triggersEmergencyDisable: false,
    triggersRollback: false,
    startsRuntimeMonitoring: false,
    executionStatus: 'not_executable',
    targetMatrix: inspectReleaseOperationsRequirements([]),
    observedEvidence: {},
    releaseGaps: [...REQUIRED_RELEASE_OPERATIONS_GAPS]
  };
}

function buildV6ReleaseOperationsReport({
  requirements = V6_RELEASE_OPERATIONS_REQUIREMENTS,
  observed = {},
  source = 'runtime'
} = {}) {
  const targetMatrix = inspectReleaseOperationsRequirements(requirements);
  const observedEvidence = {
    productionFlagControlCount: numberValue(observed.productionFlagControlCount),
    releaseWindowCount: numberValue(observed.releaseWindowCount),
    goNoGoRecordCount: numberValue(observed.goNoGoRecordCount),
    canaryScopeCount: numberValue(observed.canaryScopeCount),
    canaryExitCriteriaCount: numberValue(observed.canaryExitCriteriaCount),
    emergencyDisableDrillCount: numberValue(observed.emergencyDisableDrillCount),
    rollbackWindowCount: numberValue(observed.rollbackWindowCount),
    rollbackDisableDrillCount: numberValue(observed.rollbackDisableDrillCount),
    postReleaseVerificationCount: numberValue(observed.postReleaseVerificationCount),
    normalGameplayBaselineCount: numberValue(observed.normalGameplayBaselineCount),
    auditReplayHealthCheckCount: numberValue(observed.auditReplayHealthCheckCount),
    evidenceArchiveCount: numberValue(observed.evidenceArchiveCount),
    privateDataExposureCount: numberValue(observed.privateDataExposureCount),
    runtimeCivicToolExposureCount: numberValue(observed.runtimeCivicToolExposureCount),
    playerVisibleUnapprovedSurfaceCount: numberValue(observed.playerVisibleUnapprovedSurfaceCount),
    appliesWorldState: observed.appliesWorldState === true,
    mutatesWorldState: observed.mutatesWorldState === true,
    exposesPrivateData: observed.exposesPrivateData === true,
    enablesProduction: observed.enablesProduction === true,
    productionEnabled: observed.productionEnabled === true,
    approvesRelease: observed.approvesRelease === true,
    opensCanary: observed.opensCanary === true,
    expandsCohort: observed.expandsCohort === true,
    triggersEmergencyDisable: observed.triggersEmergencyDisable === true,
    triggersRollback: observed.triggersRollback === true,
    startsRuntimeMonitoring: observed.startsRuntimeMonitoring === true,
    publishesRuntimeTools: observed.publishesRuntimeTools === true
  };
  const errors = [];
  if (targetMatrix.ok !== true) errors.push('V6_RELEASE_OPERATIONS_TARGET_MATRIX_INCOMPLETE');
  if (observedEvidence.productionFlagControlCount <= 0) errors.push('V6_RELEASE_OPERATIONS_PRODUCTION_FLAG_CONTROL_REQUIRED');
  if (observedEvidence.releaseWindowCount <= 0) errors.push('V6_RELEASE_OPERATIONS_RELEASE_WINDOW_REQUIRED');
  if (observedEvidence.goNoGoRecordCount <= 0) errors.push('V6_RELEASE_OPERATIONS_GO_NO_GO_REQUIRED');
  if (observedEvidence.canaryScopeCount <= 0) errors.push('V6_RELEASE_OPERATIONS_CANARY_SCOPE_REQUIRED');
  if (observedEvidence.canaryExitCriteriaCount <= 0) errors.push('V6_RELEASE_OPERATIONS_CANARY_EXIT_REQUIRED');
  if (observedEvidence.emergencyDisableDrillCount <= 0) errors.push('V6_RELEASE_OPERATIONS_EMERGENCY_DISABLE_REQUIRED');
  if (observedEvidence.rollbackWindowCount <= 0) errors.push('V6_RELEASE_OPERATIONS_ROLLBACK_WINDOW_REQUIRED');
  if (observedEvidence.rollbackDisableDrillCount <= 0) errors.push('V6_RELEASE_OPERATIONS_ROLLBACK_DISABLE_DRILL_REQUIRED');
  if (observedEvidence.postReleaseVerificationCount <= 0) errors.push('V6_RELEASE_OPERATIONS_POST_RELEASE_VERIFICATION_REQUIRED');
  if (observedEvidence.normalGameplayBaselineCount <= 0) errors.push('V6_RELEASE_OPERATIONS_NORMAL_GAMEPLAY_BASELINE_REQUIRED');
  if (observedEvidence.auditReplayHealthCheckCount <= 0) errors.push('V6_RELEASE_OPERATIONS_AUDIT_REPLAY_HEALTH_REQUIRED');
  if (observedEvidence.evidenceArchiveCount <= 0) errors.push('V6_RELEASE_OPERATIONS_EVIDENCE_ARCHIVE_REQUIRED');
  if (observedEvidence.privateDataExposureCount > 0 || observedEvidence.exposesPrivateData) {
    errors.push('V6_RELEASE_OPERATIONS_PRIVATE_DATA_FORBIDDEN');
  }
  if (observedEvidence.runtimeCivicToolExposureCount > 0 || observedEvidence.publishesRuntimeTools) {
    errors.push('V6_RELEASE_OPERATIONS_RUNTIME_TOOL_EXPOSURE_FORBIDDEN');
  }
  if (observedEvidence.playerVisibleUnapprovedSurfaceCount > 0) {
    errors.push('V6_RELEASE_OPERATIONS_UNAPPROVED_VISIBILITY_FORBIDDEN');
  }
  if (
    observedEvidence.appliesWorldState
    || observedEvidence.mutatesWorldState
    || observedEvidence.enablesProduction
    || observedEvidence.productionEnabled
    || observedEvidence.approvesRelease
    || observedEvidence.opensCanary
    || observedEvidence.expandsCohort
    || observedEvidence.triggersEmergencyDisable
    || observedEvidence.triggersRollback
    || observedEvidence.startsRuntimeMonitoring
  ) {
    errors.push('V6_RELEASE_OPERATIONS_EXECUTION_FORBIDDEN');
  }
  if (errors.length > 0) {
    return {
      ...buildMissingReport(errors),
      source,
      targetMatrix,
      observedEvidence
    };
  }

  return {
    version: V6_RELEASE_OPERATIONS_VERSION,
    status: 'research_only',
    source,
    ok: true,
    errors: [],
    releaseReady: false,
    productionReady: false,
    productionEnabled: false,
    runtimeExposed: false,
    playerVisible: false,
    normalGameplayExposure: false,
    mutatesWorldState: false,
    exposesPrivateData: false,
    approvesRelease: false,
    opensCanary: false,
    expandsCohort: false,
    triggersEmergencyDisable: false,
    triggersRollback: false,
    startsRuntimeMonitoring: false,
    executionStatus: 'not_executable',
    targetMatrix,
    requirements: clone(requirements),
    observedEvidence,
    releaseGaps: [...REQUIRED_RELEASE_OPERATIONS_GAPS]
  };
}

function assertV6ReleaseOperationsReportSafe(report = {}) {
  const errors = [];
  if (report.version !== V6_RELEASE_OPERATIONS_VERSION) {
    errors.push('V6_RELEASE_OPERATIONS_VERSION_REQUIRED');
  }
  if (report.status !== 'research_only') {
    errors.push('V6_RELEASE_OPERATIONS_RESEARCH_ONLY_REQUIRED');
  }
  if (report.releaseReady !== false || report.productionReady !== false) {
    errors.push('V6_RELEASE_OPERATIONS_RELEASE_READY_FORBIDDEN');
  }
  if (report.productionEnabled !== false) {
    errors.push('V6_RELEASE_OPERATIONS_PRODUCTION_ENABLEMENT_FORBIDDEN');
  }
  if (report.runtimeExposed !== false || report.playerVisible !== false || report.normalGameplayExposure !== false) {
    errors.push('V6_RELEASE_OPERATIONS_RUNTIME_HIDDEN_REQUIRED');
  }
  if (report.executionStatus !== 'not_executable') {
    errors.push('V6_RELEASE_OPERATIONS_NON_EXECUTING_REQUIRED');
  }
  if (
    report.mutatesWorldState !== false
    || report.approvesRelease !== false
    || report.opensCanary !== false
    || report.expandsCohort !== false
    || report.triggersEmergencyDisable !== false
    || report.triggersRollback !== false
    || report.startsRuntimeMonitoring !== false
  ) {
    errors.push('V6_RELEASE_OPERATIONS_EXECUTION_FORBIDDEN');
  }
  if (report.exposesPrivateData !== false) {
    errors.push('V6_RELEASE_OPERATIONS_PRIVATE_DATA_FORBIDDEN');
  }
  if (!Array.isArray(report.releaseGaps) || report.releaseGaps.length === 0) {
    errors.push('V6_RELEASE_OPERATIONS_RELEASE_GAPS_REQUIRED');
  }
  if (Array.isArray(report.errors) && report.errors.length > 0) {
    errors.push('V6_RELEASE_OPERATIONS_ERRORS_PRESENT');
  }
  const observedEvidence = report.observedEvidence || {};
  if (
    numberValue(observedEvidence.privateDataExposureCount) > 0
    || numberValue(observedEvidence.runtimeCivicToolExposureCount) > 0
    || numberValue(observedEvidence.playerVisibleUnapprovedSurfaceCount) > 0
    || observedEvidence.appliesWorldState === true
    || observedEvidence.mutatesWorldState === true
    || observedEvidence.exposesPrivateData === true
    || observedEvidence.enablesProduction === true
    || observedEvidence.productionEnabled === true
    || observedEvidence.approvesRelease === true
    || observedEvidence.opensCanary === true
    || observedEvidence.expandsCohort === true
    || observedEvidence.triggersEmergencyDisable === true
    || observedEvidence.triggersRollback === true
    || observedEvidence.startsRuntimeMonitoring === true
    || observedEvidence.publishesRuntimeTools === true
  ) {
    errors.push('V6_RELEASE_OPERATIONS_EVIDENCE_SAFETY_REQUIRED');
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  REQUIRED_RELEASE_OPERATIONS_GAPS,
  REQUIRED_RELEASE_OPERATIONS_KEYS,
  V6_RELEASE_OPERATIONS_REQUIREMENTS,
  V6_RELEASE_OPERATIONS_VERSION,
  assertV6ReleaseOperationsReportSafe,
  buildV6ReleaseOperationsReport,
  inspectReleaseOperationsRequirements
};
