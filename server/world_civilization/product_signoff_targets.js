const crypto = require('crypto');

const V6_PRODUCT_SIGNOFF_TARGETS_VERSION = 'agent-town.v6.product_signoff_targets.v1';
const REQUIRED_PRODUCT_SIGNOFF_TARGET_KEYS = [
  'player_visible_scope',
  'normal_gameplay_exposure_denial',
  'product_owner_approval',
  'qa_release_evidence',
  'security_release_evidence',
  'rollback_plan',
  'disable_plan',
  'support_runbook',
  'user_comms_plan',
  'observability_handoff',
  'go_no_go_record',
  'post_release_monitoring'
];
const REQUIRED_PRODUCT_SIGNOFF_RELEASE_GAPS = [
  'product_owner_signoff_required',
  'qa_signoff_required',
  'security_signoff_required',
  'support_oncall_required',
  'rollback_rehearsal_required',
  'disable_rehearsal_required',
  'controlled_release_go_no_go_required'
];

const V6_PRODUCT_SIGNOFF_TARGETS = [
  {
    key: 'player_visible_scope',
    surface: 'v6_player_visible_release_scope',
    requiredEvidence: 'Product release signoff must name the exact V6 player-visible surfaces, entry points, cohorts, and excluded surfaces.',
    currentEvidence: 'docs/product/V6_AGENT_CIVILIZATION_MILESTONE_PLAN.md',
    releaseEvidenceRequired: 'approved_player_visible_scope'
  },
  {
    key: 'normal_gameplay_exposure_denial',
    surface: 'normal_gameplay_v6_absence',
    requiredEvidence: 'Normal gameplay must keep V6 civic surfaces absent until controlled release explicitly opens the approved scope.',
    currentEvidence: 'e2e/244_v6_lab_modal_boundary.spec.js',
    releaseEvidenceRequired: 'normal_gameplay_v6_absence_smoke'
  },
  {
    key: 'product_owner_approval',
    surface: 'product_release_approval',
    requiredEvidence: 'Product owner must approve the scope, rollout sequence, user-facing copy, support path, and fallback decision before release.',
    currentEvidence: 'docs/security/V6_AGENT_CIVILIZATION_RELEASE_REVIEW.md',
    releaseEvidenceRequired: 'product_owner_approval_record'
  },
  {
    key: 'qa_release_evidence',
    surface: 'deterministic_validation_evidence',
    requiredEvidence: 'QA signoff must cite the targeted Node suite, split Playwright smokes, all-features regression, and production override safety evidence.',
    currentEvidence: 'server/world_civilization/release_review.js',
    releaseEvidenceRequired: 'qa_release_evidence_packet'
  },
  {
    key: 'security_release_evidence',
    surface: 'security_release_gates',
    requiredEvidence: 'Security signoff must cite threat, abuse, privacy, data-retention, session-auth, mutation-security, rollback, and audit/replay gates.',
    currentEvidence: 'server/world_civilization/readiness_gate.js',
    releaseEvidenceRequired: 'security_release_evidence_packet'
  },
  {
    key: 'rollback_plan',
    surface: 'release_rollback',
    requiredEvidence: 'Release must include owners, rehearsed rollback steps, data-preservation behavior, and post-rollback verification.',
    currentEvidence: 'server/world_civilization/release_operations.js',
    releaseEvidenceRequired: 'rollback_rehearsal_record'
  },
  {
    key: 'disable_plan',
    surface: 'feature_flag_disable',
    requiredEvidence: 'Release must include emergency disable steps, admin-only feature flag ownership, and verification that V6 disappears from runtime surfaces.',
    currentEvidence: 'server/world_civilization/release_operations.js',
    releaseEvidenceRequired: 'emergency_disable_rehearsal_record'
  },
  {
    key: 'support_runbook',
    surface: 'support_and_incident_response',
    requiredEvidence: 'Support must have triage, known issues, incident response, escalation owners, and rollback contact paths.',
    currentEvidence: 'server/world_civilization/release_support.js',
    releaseEvidenceRequired: 'support_oncall_signoff'
  },
  {
    key: 'user_comms_plan',
    surface: 'release_communications',
    requiredEvidence: 'User communication plan must be approved without exposing debug, provider, private-town, or internal research details.',
    currentEvidence: 'server/world_civilization/release_support.js',
    releaseEvidenceRequired: 'approved_user_comms_plan'
  },
  {
    key: 'observability_handoff',
    surface: 'privacy_safe_release_observability',
    requiredEvidence: 'Release observability must include privacy-safe audit metrics, worker traces, error alerts, and feature flag monitoring owners.',
    currentEvidence: 'server/world_civilization/release_observability.js',
    releaseEvidenceRequired: 'observability_owner_handoff'
  },
  {
    key: 'go_no_go_record',
    surface: 'controlled_release_go_no_go',
    requiredEvidence: 'Controlled release must have a dated go/no-go record with product, engineering, security, QA, and support owners.',
    currentEvidence: 'server/world_civilization/release_operations.js',
    releaseEvidenceRequired: 'controlled_release_go_no_go_record'
  },
  {
    key: 'post_release_monitoring',
    surface: 'canary_and_post_release_monitoring',
    requiredEvidence: 'Post-release monitoring must define canary exit criteria, rollback window, monitoring owner, and blocker response path.',
    currentEvidence: 'server/world_civilization/release_operations.js',
    releaseEvidenceRequired: 'post_release_monitoring_plan'
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

function targetMatrixDigest(targets = V6_PRODUCT_SIGNOFF_TARGETS) {
  return sha256(JSON.stringify(targets.map((target) => ({
    key: target.key,
    surface: target.surface,
    requiredEvidence: target.requiredEvidence,
    releaseEvidenceRequired: target.releaseEvidenceRequired
  }))));
}

function inspectProductSignoffTargets(targets = V6_PRODUCT_SIGNOFF_TARGETS) {
  const safeTargets = Array.isArray(targets) ? targets : [];
  const targetKeys = safeTargets.map((target) => String(target.key || ''));
  const missingKeys = REQUIRED_PRODUCT_SIGNOFF_TARGET_KEYS.filter((key) => !targetKeys.includes(key));
  const incompleteTargets = safeTargets.filter((target) => (
    !target.key
    || !target.surface
    || !target.requiredEvidence
    || !target.currentEvidence
    || !target.releaseEvidenceRequired
  )).map((target) => String(target.key || 'unknown'));

  return {
    ok: missingKeys.length === 0 && incompleteTargets.length === 0,
    requiredKeys: [...REQUIRED_PRODUCT_SIGNOFF_TARGET_KEYS],
    targetKeys,
    missingKeys,
    incompleteTargets,
    targetCount: safeTargets.length,
    digest: targetMatrixDigest(safeTargets)
  };
}

function buildMissingReport(errors = []) {
  return {
    version: V6_PRODUCT_SIGNOFF_TARGETS_VERSION,
    status: 'research_only',
    ok: false,
    errors,
    releaseReady: false,
    productionReady: false,
    runtimeExposed: false,
    playerVisible: false,
    normalGameplayExposure: false,
    mutatesWorldState: false,
    exposesPrivateData: false,
    approvesRelease: false,
    enablesProduction: false,
    publishesComms: false,
    executionStatus: 'not_executable',
    targetMatrix: inspectProductSignoffTargets([]),
    observedEvidence: {},
    releaseGaps: [...REQUIRED_PRODUCT_SIGNOFF_RELEASE_GAPS]
  };
}

function buildV6ProductSignoffTargetReport({
  targets = V6_PRODUCT_SIGNOFF_TARGETS,
  observed = {},
  source = 'runtime'
} = {}) {
  const targetMatrix = inspectProductSignoffTargets(targets);
  const observedEvidence = {
    playerVisibleScopeProbeCount: numberValue(observed.playerVisibleScopeProbeCount),
    normalGameplayAbsenceProbeCount: numberValue(observed.normalGameplayAbsenceProbeCount),
    productApprovalProbeCount: numberValue(observed.productApprovalProbeCount),
    qaEvidenceProbeCount: numberValue(observed.qaEvidenceProbeCount),
    securityEvidenceProbeCount: numberValue(observed.securityEvidenceProbeCount),
    rollbackPlanProbeCount: numberValue(observed.rollbackPlanProbeCount),
    disablePlanProbeCount: numberValue(observed.disablePlanProbeCount),
    supportRunbookProbeCount: numberValue(observed.supportRunbookProbeCount),
    userCommsProbeCount: numberValue(observed.userCommsProbeCount),
    observabilityHandoffProbeCount: numberValue(observed.observabilityHandoffProbeCount),
    goNoGoProbeCount: numberValue(observed.goNoGoProbeCount),
    postReleaseMonitoringProbeCount: numberValue(observed.postReleaseMonitoringProbeCount),
    privateDataExposureCount: numberValue(observed.privateDataExposureCount),
    playerVisibleSignoffSurfaceCount: numberValue(observed.playerVisibleSignoffSurfaceCount),
    appliesWorldState: observed.appliesWorldState === true,
    mutatesWorldState: observed.mutatesWorldState === true,
    exposesPrivateData: observed.exposesPrivateData === true,
    approvesRelease: observed.approvesRelease === true,
    enablesProduction: observed.enablesProduction === true,
    publishesComms: observed.publishesComms === true
  };
  const errors = [];
  if (targetMatrix.ok !== true) errors.push('V6_PRODUCT_SIGNOFF_TARGET_MATRIX_INCOMPLETE');
  if (observedEvidence.playerVisibleScopeProbeCount <= 0) errors.push('V6_PRODUCT_SIGNOFF_SCOPE_PROBE_REQUIRED');
  if (observedEvidence.normalGameplayAbsenceProbeCount <= 0) errors.push('V6_PRODUCT_SIGNOFF_NORMAL_GAMEPLAY_ABSENCE_PROBE_REQUIRED');
  if (observedEvidence.productApprovalProbeCount <= 0) errors.push('V6_PRODUCT_SIGNOFF_PRODUCT_APPROVAL_PROBE_REQUIRED');
  if (observedEvidence.qaEvidenceProbeCount <= 0) errors.push('V6_PRODUCT_SIGNOFF_QA_EVIDENCE_PROBE_REQUIRED');
  if (observedEvidence.securityEvidenceProbeCount <= 0) errors.push('V6_PRODUCT_SIGNOFF_SECURITY_EVIDENCE_PROBE_REQUIRED');
  if (observedEvidence.rollbackPlanProbeCount <= 0) errors.push('V6_PRODUCT_SIGNOFF_ROLLBACK_PLAN_PROBE_REQUIRED');
  if (observedEvidence.disablePlanProbeCount <= 0) errors.push('V6_PRODUCT_SIGNOFF_DISABLE_PLAN_PROBE_REQUIRED');
  if (observedEvidence.supportRunbookProbeCount <= 0) errors.push('V6_PRODUCT_SIGNOFF_SUPPORT_RUNBOOK_PROBE_REQUIRED');
  if (observedEvidence.userCommsProbeCount <= 0) errors.push('V6_PRODUCT_SIGNOFF_USER_COMMS_PROBE_REQUIRED');
  if (observedEvidence.observabilityHandoffProbeCount <= 0) errors.push('V6_PRODUCT_SIGNOFF_OBSERVABILITY_PROBE_REQUIRED');
  if (observedEvidence.goNoGoProbeCount <= 0) errors.push('V6_PRODUCT_SIGNOFF_GO_NO_GO_PROBE_REQUIRED');
  if (observedEvidence.postReleaseMonitoringProbeCount <= 0) errors.push('V6_PRODUCT_SIGNOFF_POST_RELEASE_MONITORING_PROBE_REQUIRED');
  if (observedEvidence.privateDataExposureCount > 0 || observedEvidence.exposesPrivateData) {
    errors.push('V6_PRODUCT_SIGNOFF_PRIVATE_DATA_FORBIDDEN');
  }
  if (observedEvidence.playerVisibleSignoffSurfaceCount > 0) errors.push('V6_PRODUCT_SIGNOFF_PLAYER_SURFACE_FORBIDDEN');
  if (
    observedEvidence.appliesWorldState
    || observedEvidence.mutatesWorldState
    || observedEvidence.approvesRelease
    || observedEvidence.enablesProduction
    || observedEvidence.publishesComms
  ) {
    errors.push('V6_PRODUCT_SIGNOFF_EXECUTION_FORBIDDEN');
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
    version: V6_PRODUCT_SIGNOFF_TARGETS_VERSION,
    status: 'research_only',
    source,
    ok: true,
    errors: [],
    releaseReady: false,
    productionReady: false,
    runtimeExposed: false,
    playerVisible: false,
    normalGameplayExposure: false,
    mutatesWorldState: false,
    exposesPrivateData: false,
    approvesRelease: false,
    enablesProduction: false,
    publishesComms: false,
    executionStatus: 'not_executable',
    targetMatrix,
    targets: clone(targets),
    observedEvidence,
    releaseGaps: [...REQUIRED_PRODUCT_SIGNOFF_RELEASE_GAPS]
  };
}

function assertV6ProductSignoffTargetReportSafe(report = {}) {
  const errors = [];
  if (report.version !== V6_PRODUCT_SIGNOFF_TARGETS_VERSION) {
    errors.push('V6_PRODUCT_SIGNOFF_TARGET_VERSION_REQUIRED');
  }
  if (report.status !== 'research_only') {
    errors.push('V6_PRODUCT_SIGNOFF_TARGET_RESEARCH_ONLY_REQUIRED');
  }
  if (report.releaseReady !== false || report.productionReady !== false) {
    errors.push('V6_PRODUCT_SIGNOFF_TARGET_RELEASE_READY_FORBIDDEN');
  }
  if (report.runtimeExposed !== false) {
    errors.push('V6_PRODUCT_SIGNOFF_TARGET_RUNTIME_HIDDEN_REQUIRED');
  }
  if (report.playerVisible !== false || report.normalGameplayExposure !== false) {
    errors.push('V6_PRODUCT_SIGNOFF_TARGET_PLAYER_HIDDEN_REQUIRED');
  }
  if (
    report.mutatesWorldState !== false
    || report.approvesRelease !== false
    || report.enablesProduction !== false
    || report.publishesComms !== false
  ) {
    errors.push('V6_PRODUCT_SIGNOFF_TARGET_EXECUTION_FORBIDDEN');
  }
  if (report.exposesPrivateData !== false) {
    errors.push('V6_PRODUCT_SIGNOFF_TARGET_PRIVATE_DATA_FORBIDDEN');
  }
  if (report.executionStatus !== 'not_executable') {
    errors.push('V6_PRODUCT_SIGNOFF_TARGET_NON_EXECUTING_REQUIRED');
  }
  if (
    !Array.isArray(report.releaseGaps)
    || REQUIRED_PRODUCT_SIGNOFF_RELEASE_GAPS.some((gap) => !report.releaseGaps.includes(gap))
  ) {
    errors.push('V6_PRODUCT_SIGNOFF_TARGET_RELEASE_GAPS_REQUIRED');
  }
  if (report.targetMatrix?.ok !== true || (report.targetMatrix?.missingKeys || []).length > 0) {
    errors.push('V6_PRODUCT_SIGNOFF_TARGET_MATRIX_REQUIRED');
  }
  const evidence = report.observedEvidence || {};
  if (
    evidence.privateDataExposureCount > 0
    || evidence.playerVisibleSignoffSurfaceCount > 0
    || evidence.appliesWorldState === true
    || evidence.mutatesWorldState === true
    || evidence.exposesPrivateData === true
    || evidence.approvesRelease === true
    || evidence.enablesProduction === true
    || evidence.publishesComms === true
  ) {
    errors.push('V6_PRODUCT_SIGNOFF_TARGET_EVIDENCE_SAFETY_REQUIRED');
  }
  if (report.ok !== true || (Array.isArray(report.errors) && report.errors.length > 0)) {
    errors.push('V6_PRODUCT_SIGNOFF_TARGET_ERRORS_PRESENT');
  }
  return {
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  REQUIRED_PRODUCT_SIGNOFF_RELEASE_GAPS: [...REQUIRED_PRODUCT_SIGNOFF_RELEASE_GAPS],
  REQUIRED_PRODUCT_SIGNOFF_TARGET_KEYS: [...REQUIRED_PRODUCT_SIGNOFF_TARGET_KEYS],
  V6_PRODUCT_SIGNOFF_TARGETS: clone(V6_PRODUCT_SIGNOFF_TARGETS),
  V6_PRODUCT_SIGNOFF_TARGETS_VERSION,
  assertV6ProductSignoffTargetReportSafe,
  buildV6ProductSignoffTargetReport,
  inspectProductSignoffTargets
};
