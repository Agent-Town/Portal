const crypto = require('crypto');

const V6_CONTROLLED_RELEASE_TARGETS_VERSION = 'agent-town.v6.controlled_release_targets.v1';
const REQUIRED_CONTROLLED_RELEASE_TARGET_KEYS = [
  'readiness_gate_closed',
  'production_flag_safety',
  'rollback_disable_controls',
  'observability',
  'support_runbook',
  'blocker_clearance',
  'controlled_release_window',
  'canary_exit',
  'emergency_disable',
  'post_release_verification'
];
const REQUIRED_CONTROLLED_RELEASE_TARGET_GAPS = [
  'closed_readiness_gate_report_required',
  'admin_enablement_signoff_required',
  'rollback_disable_rehearsal_required',
  'privacy_safe_observability_owner_required',
  'support_oncall_signoff_required',
  'blocker_clearance_required',
  'controlled_release_go_no_go_required'
];

const V6_CONTROLLED_RELEASE_TARGETS = [
  {
    key: 'readiness_gate_closed',
    surface: 'm0_m17_readiness_gate',
    requiredEvidence: 'Controlled release requires M0-M17 done, a closed V6 readiness-gate report, readiness audit-summary proof, and M17 release review readiness.',
    currentEvidence: 'server/world_civilization/readiness_gate.js',
    releaseEvidenceRequired: 'closed_v6_readiness_gate_report'
  },
  {
    key: 'production_flag_safety',
    surface: 'production_v6_feature_flag',
    requiredEvidence: 'Production enablement must stay default-off, admin-only, canary-scoped, broad-override-proof, and emergency-disableable.',
    currentEvidence: 'server/world_civilization/controlled_release.js',
    releaseEvidenceRequired: 'production_flag_safety_signoff'
  },
  {
    key: 'rollback_disable_controls',
    surface: 'release_rollback_and_disable',
    requiredEvidence: 'Release must have named rollback owner, rehearsed disable and rollback steps, data-preservation behavior, and post-disable verification.',
    currentEvidence: 'docs/ops/V6_AGENT_CIVILIZATION_CONTROLLED_RELEASE_RUNBOOK.md',
    releaseEvidenceRequired: 'rollback_disable_rehearsal_record'
  },
  {
    key: 'observability',
    surface: 'privacy_safe_release_observability',
    requiredEvidence: 'Release observability must include privacy-safe audit metrics, worker traffic traces, error alerts, and feature flag dashboard ownership.',
    currentEvidence: 'server/world_civilization/product_signoff_targets.js',
    releaseEvidenceRequired: 'observability_handoff_record'
  },
  {
    key: 'support_runbook',
    surface: 'support_and_incident_response',
    requiredEvidence: 'Support needs known issues, triage path, incident response, user comms, and rollback contact coverage.',
    currentEvidence: 'docs/ops/V6_AGENT_CIVILIZATION_CONTROLLED_RELEASE_RUNBOOK.md',
    releaseEvidenceRequired: 'support_runbook_signoff'
  },
  {
    key: 'blocker_clearance',
    surface: 'release_blockers',
    requiredEvidence: 'No P0/P1 blockers may remain, and security dependency review, QA signoff, and product signoff must be approved.',
    currentEvidence: 'server/world_civilization/blocker_exception_register.js',
    releaseEvidenceRequired: 'blocker_clearance_record'
  },
  {
    key: 'controlled_release_window',
    surface: 'release_window',
    requiredEvidence: 'Release must have approved window, rollback window, monitoring owner, and go/no-go record.',
    currentEvidence: 'specs/69_agent_town_v6_controlled_release_completion_foundation.md',
    releaseEvidenceRequired: 'controlled_release_window_record'
  },
  {
    key: 'canary_exit',
    surface: 'canary_cohort_exit_criteria',
    requiredEvidence: 'Canary exit criteria must prove V6 stays inside the approved cohort and normal gameplay remains stable before expansion.',
    currentEvidence: 'docs/product/V6_AGENT_CIVILIZATION_MILESTONE_PLAN.md',
    releaseEvidenceRequired: 'canary_exit_criteria_record'
  },
  {
    key: 'emergency_disable',
    surface: 'emergency_disable_path',
    requiredEvidence: 'Emergency disable must stop new public civic writes, hide runtime V6 tools/surfaces, and preserve replayable audit records.',
    currentEvidence: 'docs/ops/V6_AGENT_CIVILIZATION_CONTROLLED_RELEASE_RUNBOOK.md',
    releaseEvidenceRequired: 'emergency_disable_drill_record'
  },
  {
    key: 'post_release_verification',
    surface: 'post_release_monitoring_and_verification',
    requiredEvidence: 'Post-release verification must confirm visibility, audit/replay health, support routing, and rollback readiness after launch.',
    currentEvidence: 'server/world_civilization/product_signoff_targets.js',
    releaseEvidenceRequired: 'post_release_verification_record'
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

function targetMatrixDigest(targets = V6_CONTROLLED_RELEASE_TARGETS) {
  return sha256(JSON.stringify(targets.map((target) => ({
    key: target.key,
    surface: target.surface,
    requiredEvidence: target.requiredEvidence,
    releaseEvidenceRequired: target.releaseEvidenceRequired
  }))));
}

function inspectControlledReleaseTargets(targets = V6_CONTROLLED_RELEASE_TARGETS) {
  const safeTargets = Array.isArray(targets) ? targets : [];
  const targetKeys = safeTargets.map((target) => String(target.key || ''));
  const missingKeys = REQUIRED_CONTROLLED_RELEASE_TARGET_KEYS.filter((key) => !targetKeys.includes(key));
  const incompleteTargets = safeTargets.filter((target) => (
    !target.key
    || !target.surface
    || !target.requiredEvidence
    || !target.currentEvidence
    || !target.releaseEvidenceRequired
  )).map((target) => String(target.key || 'unknown'));

  return {
    ok: missingKeys.length === 0 && incompleteTargets.length === 0,
    requiredKeys: [...REQUIRED_CONTROLLED_RELEASE_TARGET_KEYS],
    targetKeys,
    missingKeys,
    incompleteTargets,
    targetCount: safeTargets.length,
    digest: targetMatrixDigest(safeTargets)
  };
}

function buildMissingReport(errors = []) {
  return {
    version: V6_CONTROLLED_RELEASE_TARGETS_VERSION,
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
    executesRelease: false,
    executionStatus: 'not_executable',
    targetMatrix: inspectControlledReleaseTargets([]),
    observedEvidence: {},
    releaseGaps: [...REQUIRED_CONTROLLED_RELEASE_TARGET_GAPS]
  };
}

function buildV6ControlledReleaseTargetReport({
  targets = V6_CONTROLLED_RELEASE_TARGETS,
  observed = {},
  source = 'runtime'
} = {}) {
  const targetMatrix = inspectControlledReleaseTargets(targets);
  const observedEvidence = {
    readinessGateProbeCount: numberValue(observed.readinessGateProbeCount),
    productionFlagProbeCount: numberValue(observed.productionFlagProbeCount),
    rollbackDisableProbeCount: numberValue(observed.rollbackDisableProbeCount),
    observabilityProbeCount: numberValue(observed.observabilityProbeCount),
    supportRunbookProbeCount: numberValue(observed.supportRunbookProbeCount),
    blockerClearanceProbeCount: numberValue(observed.blockerClearanceProbeCount),
    releaseWindowProbeCount: numberValue(observed.releaseWindowProbeCount),
    canaryExitProbeCount: numberValue(observed.canaryExitProbeCount),
    emergencyDisableProbeCount: numberValue(observed.emergencyDisableProbeCount),
    postReleaseVerificationProbeCount: numberValue(observed.postReleaseVerificationProbeCount),
    privateDataExposureCount: numberValue(observed.privateDataExposureCount),
    playerVisibleControlledReleaseSurfaceCount: numberValue(observed.playerVisibleControlledReleaseSurfaceCount),
    appliesWorldState: observed.appliesWorldState === true,
    mutatesWorldState: observed.mutatesWorldState === true,
    exposesPrivateData: observed.exposesPrivateData === true,
    productionEnabled: observed.productionEnabled === true,
    exposesRuntime: observed.exposesRuntime === true,
    approvesRelease: observed.approvesRelease === true,
    executesRelease: observed.executesRelease === true
  };
  const errors = [];
  if (targetMatrix.ok !== true) errors.push('V6_CONTROLLED_RELEASE_TARGET_MATRIX_INCOMPLETE');
  if (observedEvidence.readinessGateProbeCount <= 0) errors.push('V6_CONTROLLED_RELEASE_READINESS_GATE_PROBE_REQUIRED');
  if (observedEvidence.productionFlagProbeCount <= 0) errors.push('V6_CONTROLLED_RELEASE_PRODUCTION_FLAG_PROBE_REQUIRED');
  if (observedEvidence.rollbackDisableProbeCount <= 0) errors.push('V6_CONTROLLED_RELEASE_ROLLBACK_DISABLE_PROBE_REQUIRED');
  if (observedEvidence.observabilityProbeCount <= 0) errors.push('V6_CONTROLLED_RELEASE_OBSERVABILITY_PROBE_REQUIRED');
  if (observedEvidence.supportRunbookProbeCount <= 0) errors.push('V6_CONTROLLED_RELEASE_SUPPORT_RUNBOOK_PROBE_REQUIRED');
  if (observedEvidence.blockerClearanceProbeCount <= 0) errors.push('V6_CONTROLLED_RELEASE_BLOCKER_CLEARANCE_PROBE_REQUIRED');
  if (observedEvidence.releaseWindowProbeCount <= 0) errors.push('V6_CONTROLLED_RELEASE_WINDOW_PROBE_REQUIRED');
  if (observedEvidence.canaryExitProbeCount <= 0) errors.push('V6_CONTROLLED_RELEASE_CANARY_EXIT_PROBE_REQUIRED');
  if (observedEvidence.emergencyDisableProbeCount <= 0) errors.push('V6_CONTROLLED_RELEASE_EMERGENCY_DISABLE_PROBE_REQUIRED');
  if (observedEvidence.postReleaseVerificationProbeCount <= 0) errors.push('V6_CONTROLLED_RELEASE_POST_RELEASE_VERIFICATION_PROBE_REQUIRED');
  if (observedEvidence.privateDataExposureCount > 0 || observedEvidence.exposesPrivateData) {
    errors.push('V6_CONTROLLED_RELEASE_PRIVATE_DATA_FORBIDDEN');
  }
  if (observedEvidence.playerVisibleControlledReleaseSurfaceCount > 0 || observedEvidence.exposesRuntime) {
    errors.push('V6_CONTROLLED_RELEASE_PLAYER_SURFACE_FORBIDDEN');
  }
  if (
    observedEvidence.appliesWorldState
    || observedEvidence.mutatesWorldState
    || observedEvidence.productionEnabled
    || observedEvidence.approvesRelease
    || observedEvidence.executesRelease
  ) {
    errors.push('V6_CONTROLLED_RELEASE_TARGET_EXECUTION_FORBIDDEN');
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
    version: V6_CONTROLLED_RELEASE_TARGETS_VERSION,
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
    executesRelease: false,
    executionStatus: 'not_executable',
    targetMatrix,
    targets: clone(targets),
    observedEvidence,
    releaseGaps: [...REQUIRED_CONTROLLED_RELEASE_TARGET_GAPS]
  };
}

function assertV6ControlledReleaseTargetReportSafe(report = {}) {
  const errors = [];
  if (report.version !== V6_CONTROLLED_RELEASE_TARGETS_VERSION) {
    errors.push('V6_CONTROLLED_RELEASE_TARGET_VERSION_REQUIRED');
  }
  if (report.status !== 'research_only') {
    errors.push('V6_CONTROLLED_RELEASE_TARGET_RESEARCH_ONLY_REQUIRED');
  }
  if (report.releaseReady !== false || report.productionReady !== false) {
    errors.push('V6_CONTROLLED_RELEASE_TARGET_READY_FORBIDDEN');
  }
  if (report.productionEnabled !== false) {
    errors.push('V6_CONTROLLED_RELEASE_TARGET_PRODUCTION_ENABLEMENT_FORBIDDEN');
  }
  if (report.runtimeExposed !== false || report.playerVisible !== false || report.normalGameplayExposure !== false) {
    errors.push('V6_CONTROLLED_RELEASE_TARGET_PLAYER_HIDDEN_REQUIRED');
  }
  if (
    report.mutatesWorldState !== false
    || report.approvesRelease !== false
    || report.executesRelease !== false
  ) {
    errors.push('V6_CONTROLLED_RELEASE_TARGET_EXECUTION_FORBIDDEN');
  }
  if (report.exposesPrivateData !== false) {
    errors.push('V6_CONTROLLED_RELEASE_TARGET_PRIVATE_DATA_FORBIDDEN');
  }
  if (report.executionStatus !== 'not_executable') {
    errors.push('V6_CONTROLLED_RELEASE_TARGET_NON_EXECUTING_REQUIRED');
  }
  if (
    !Array.isArray(report.releaseGaps)
    || REQUIRED_CONTROLLED_RELEASE_TARGET_GAPS.some((gap) => !report.releaseGaps.includes(gap))
  ) {
    errors.push('V6_CONTROLLED_RELEASE_TARGET_RELEASE_GAPS_REQUIRED');
  }
  if (report.targetMatrix?.ok !== true || (report.targetMatrix?.missingKeys || []).length > 0) {
    errors.push('V6_CONTROLLED_RELEASE_TARGET_MATRIX_REQUIRED');
  }
  const evidence = report.observedEvidence || {};
  if (
    evidence.privateDataExposureCount > 0
    || evidence.playerVisibleControlledReleaseSurfaceCount > 0
    || evidence.appliesWorldState === true
    || evidence.mutatesWorldState === true
    || evidence.exposesPrivateData === true
    || evidence.productionEnabled === true
    || evidence.exposesRuntime === true
    || evidence.approvesRelease === true
    || evidence.executesRelease === true
  ) {
    errors.push('V6_CONTROLLED_RELEASE_TARGET_EVIDENCE_SAFETY_REQUIRED');
  }
  if (report.ok !== true || (Array.isArray(report.errors) && report.errors.length > 0)) {
    errors.push('V6_CONTROLLED_RELEASE_TARGET_ERRORS_PRESENT');
  }
  return {
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  REQUIRED_CONTROLLED_RELEASE_TARGET_GAPS: [...REQUIRED_CONTROLLED_RELEASE_TARGET_GAPS],
  REQUIRED_CONTROLLED_RELEASE_TARGET_KEYS: [...REQUIRED_CONTROLLED_RELEASE_TARGET_KEYS],
  V6_CONTROLLED_RELEASE_TARGETS: clone(V6_CONTROLLED_RELEASE_TARGETS),
  V6_CONTROLLED_RELEASE_TARGETS_VERSION,
  assertV6ControlledReleaseTargetReportSafe,
  buildV6ControlledReleaseTargetReport,
  inspectControlledReleaseTargets
};
