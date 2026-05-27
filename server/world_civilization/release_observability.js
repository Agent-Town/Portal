const crypto = require('crypto');

const V6_RELEASE_OBSERVABILITY_VERSION = 'agent-town.v6.release_observability.v1';

const REQUIRED_RELEASE_OBSERVABILITY_KEYS = [
  'audit_metrics',
  'worker_traffic_trace',
  'error_alerts',
  'privacy_safe_logs',
  'feature_flag_dashboard',
  'monitoring_owner',
  'canary_health',
  'runtime_tool_absence_monitor',
  'support_escalation_link',
  'post_release_review'
];

const REQUIRED_RELEASE_OBSERVABILITY_GAPS = [
  'audit_metric_dashboard_required',
  'worker_trace_retention_required',
  'error_alert_owner_required',
  'privacy_safe_log_review_required',
  'feature_flag_dashboard_required',
  'monitoring_owner_required',
  'runtime_tool_absence_monitor_required',
  'support_escalation_link_required'
];

const V6_RELEASE_OBSERVABILITY_REQUIREMENTS = [
  {
    key: 'audit_metrics',
    owner: 'engineering_security',
    requiredEvidence: 'Release observability must define privacy-safe audit ledger health, replay lag, hash-chain failure, and rollback-handle counters.',
    releaseEvidenceRequired: 'privacy_safe_audit_metric_dashboard'
  },
  {
    key: 'worker_traffic_trace',
    owner: 'product_engineering',
    requiredEvidence: 'Worker Traffic traces must prove worker-origin V6 civic attempts stay scoped, redacted, retained, and absent from normal gameplay when gated off.',
    releaseEvidenceRequired: 'redacted_worker_traffic_trace_plan'
  },
  {
    key: 'error_alerts',
    owner: 'release_engineering',
    requiredEvidence: 'Error alerts must name owners, alert thresholds, escalation path, and release-blocking conditions.',
    releaseEvidenceRequired: 'release_error_alert_owner_record'
  },
  {
    key: 'privacy_safe_logs',
    owner: 'privacy_security',
    requiredEvidence: 'Release logs must exclude private town data, wallet secrets, Brain/provider tokens, raw transcripts, and raw debug traces.',
    releaseEvidenceRequired: 'privacy_safe_log_review'
  },
  {
    key: 'feature_flag_dashboard',
    owner: 'release_engineering',
    requiredEvidence: 'Feature flag monitoring must prove V6 remains default-off, cohort-scoped, broad-override-proof, and emergency-disableable.',
    releaseEvidenceRequired: 'feature_flag_dashboard_owner_record'
  },
  {
    key: 'monitoring_owner',
    owner: 'release_manager',
    requiredEvidence: 'Monitoring ownership must name primary, backup, review cadence, and handoff window for the controlled release.',
    releaseEvidenceRequired: 'monitoring_owner_handoff'
  },
  {
    key: 'canary_health',
    owner: 'qa_engineering',
    requiredEvidence: 'Canary health checks must cover normal gameplay absence, V6 cohort visibility, audit/replay health, and rollback readiness.',
    releaseEvidenceRequired: 'canary_health_probe_plan'
  },
  {
    key: 'runtime_tool_absence_monitor',
    owner: 'security_engineering',
    requiredEvidence: 'Runtime `/api/world/tools` monitoring must prove `et.world.civic.*` tools stay unpublished before controlled release and disappear after emergency disable.',
    releaseEvidenceRequired: 'runtime_tool_absence_monitor'
  },
  {
    key: 'support_escalation_link',
    owner: 'support',
    requiredEvidence: 'Release observability must link alert states to support triage, blocker register updates, incident response, and rollback contacts.',
    releaseEvidenceRequired: 'support_escalation_observability_link'
  },
  {
    key: 'post_release_review',
    owner: 'release_manager',
    requiredEvidence: 'Post-release review must define review window, evidence archive, blocker follow-up, audit/replay summary, and canary expansion decision.',
    releaseEvidenceRequired: 'post_release_observability_review'
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

function targetMatrixDigest(requirements = V6_RELEASE_OBSERVABILITY_REQUIREMENTS) {
  return sha256(JSON.stringify(requirements.map((requirement) => ({
    key: requirement.key,
    owner: requirement.owner,
    requiredEvidence: requirement.requiredEvidence,
    releaseEvidenceRequired: requirement.releaseEvidenceRequired
  }))));
}

function inspectReleaseObservabilityRequirements(requirements = V6_RELEASE_OBSERVABILITY_REQUIREMENTS) {
  const safeRequirements = Array.isArray(requirements) ? requirements : [];
  const requirementKeys = safeRequirements.map((requirement) => String(requirement.key || ''));
  const missingKeys = REQUIRED_RELEASE_OBSERVABILITY_KEYS.filter((key) => !requirementKeys.includes(key));
  const incompleteRequirements = safeRequirements.filter((requirement) => (
    !requirement.key
    || !requirement.owner
    || !requirement.requiredEvidence
    || !requirement.releaseEvidenceRequired
  )).map((requirement) => String(requirement.key || 'unknown'));

  return {
    ok: missingKeys.length === 0 && incompleteRequirements.length === 0,
    requiredKeys: [...REQUIRED_RELEASE_OBSERVABILITY_KEYS],
    requirementKeys,
    missingKeys,
    incompleteRequirements,
    requirementCount: safeRequirements.length,
    digest: targetMatrixDigest(safeRequirements)
  };
}

function buildMissingReport(errors = []) {
  return {
    version: V6_RELEASE_OBSERVABILITY_VERSION,
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
    activatesAlerts: false,
    startsRuntimeMonitoring: false,
    publishesRuntimeTools: false,
    executionStatus: 'not_executable',
    targetMatrix: inspectReleaseObservabilityRequirements([]),
    observedEvidence: {},
    releaseGaps: [...REQUIRED_RELEASE_OBSERVABILITY_GAPS]
  };
}

function buildV6ReleaseObservabilityReport({
  requirements = V6_RELEASE_OBSERVABILITY_REQUIREMENTS,
  observed = {},
  source = 'runtime'
} = {}) {
  const targetMatrix = inspectReleaseObservabilityRequirements(requirements);
  const observedEvidence = {
    auditMetricDashboardCount: numberValue(observed.auditMetricDashboardCount),
    workerTrafficTracePlanCount: numberValue(observed.workerTrafficTracePlanCount),
    errorAlertOwnerCount: numberValue(observed.errorAlertOwnerCount),
    privacySafeLogReviewCount: numberValue(observed.privacySafeLogReviewCount),
    featureFlagDashboardCount: numberValue(observed.featureFlagDashboardCount),
    monitoringOwnerCount: numberValue(observed.monitoringOwnerCount),
    canaryHealthProbeCount: numberValue(observed.canaryHealthProbeCount),
    runtimeToolAbsenceMonitorCount: numberValue(observed.runtimeToolAbsenceMonitorCount),
    supportEscalationLinkCount: numberValue(observed.supportEscalationLinkCount),
    postReleaseReviewCount: numberValue(observed.postReleaseReviewCount),
    privateDataExposureCount: numberValue(observed.privateDataExposureCount),
    rawTracePrivateDataCount: numberValue(observed.rawTracePrivateDataCount),
    runtimeCivicToolExposureCount: numberValue(observed.runtimeCivicToolExposureCount),
    appliesWorldState: observed.appliesWorldState === true,
    mutatesWorldState: observed.mutatesWorldState === true,
    exposesPrivateData: observed.exposesPrivateData === true,
    activatesAlerts: observed.activatesAlerts === true,
    startsRuntimeMonitoring: observed.startsRuntimeMonitoring === true,
    productionEnabled: observed.productionEnabled === true,
    publishesRuntimeTools: observed.publishesRuntimeTools === true
  };
  const errors = [];
  if (targetMatrix.ok !== true) errors.push('V6_RELEASE_OBSERVABILITY_TARGET_MATRIX_INCOMPLETE');
  if (observedEvidence.auditMetricDashboardCount <= 0) errors.push('V6_RELEASE_OBSERVABILITY_AUDIT_METRICS_REQUIRED');
  if (observedEvidence.workerTrafficTracePlanCount <= 0) errors.push('V6_RELEASE_OBSERVABILITY_WORKER_TRACE_REQUIRED');
  if (observedEvidence.errorAlertOwnerCount <= 0) errors.push('V6_RELEASE_OBSERVABILITY_ALERT_OWNER_REQUIRED');
  if (observedEvidence.privacySafeLogReviewCount <= 0) errors.push('V6_RELEASE_OBSERVABILITY_PRIVACY_LOG_REVIEW_REQUIRED');
  if (observedEvidence.featureFlagDashboardCount <= 0) errors.push('V6_RELEASE_OBSERVABILITY_FLAG_DASHBOARD_REQUIRED');
  if (observedEvidence.monitoringOwnerCount <= 0) errors.push('V6_RELEASE_OBSERVABILITY_MONITORING_OWNER_REQUIRED');
  if (observedEvidence.canaryHealthProbeCount <= 0) errors.push('V6_RELEASE_OBSERVABILITY_CANARY_HEALTH_REQUIRED');
  if (observedEvidence.runtimeToolAbsenceMonitorCount <= 0) errors.push('V6_RELEASE_OBSERVABILITY_RUNTIME_TOOL_ABSENCE_REQUIRED');
  if (observedEvidence.supportEscalationLinkCount <= 0) errors.push('V6_RELEASE_OBSERVABILITY_SUPPORT_LINK_REQUIRED');
  if (observedEvidence.postReleaseReviewCount <= 0) errors.push('V6_RELEASE_OBSERVABILITY_POST_RELEASE_REVIEW_REQUIRED');
  if (
    observedEvidence.privateDataExposureCount > 0
    || observedEvidence.rawTracePrivateDataCount > 0
    || observedEvidence.exposesPrivateData
  ) {
    errors.push('V6_RELEASE_OBSERVABILITY_PRIVATE_DATA_FORBIDDEN');
  }
  if (observedEvidence.runtimeCivicToolExposureCount > 0 || observedEvidence.publishesRuntimeTools) {
    errors.push('V6_RELEASE_OBSERVABILITY_RUNTIME_TOOL_EXPOSURE_FORBIDDEN');
  }
  if (
    observedEvidence.appliesWorldState
    || observedEvidence.mutatesWorldState
    || observedEvidence.activatesAlerts
    || observedEvidence.startsRuntimeMonitoring
    || observedEvidence.productionEnabled
  ) {
    errors.push('V6_RELEASE_OBSERVABILITY_EXECUTION_FORBIDDEN');
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
    version: V6_RELEASE_OBSERVABILITY_VERSION,
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
    activatesAlerts: false,
    startsRuntimeMonitoring: false,
    publishesRuntimeTools: false,
    executionStatus: 'not_executable',
    targetMatrix,
    requirements: clone(requirements),
    observedEvidence,
    releaseGaps: [...REQUIRED_RELEASE_OBSERVABILITY_GAPS]
  };
}

function assertV6ReleaseObservabilityReportSafe(report = {}) {
  const errors = [];
  if (report.version !== V6_RELEASE_OBSERVABILITY_VERSION) {
    errors.push('V6_RELEASE_OBSERVABILITY_VERSION_REQUIRED');
  }
  if (report.status !== 'research_only') {
    errors.push('V6_RELEASE_OBSERVABILITY_RESEARCH_ONLY_REQUIRED');
  }
  if (report.releaseReady !== false || report.productionReady !== false) {
    errors.push('V6_RELEASE_OBSERVABILITY_RELEASE_READY_FORBIDDEN');
  }
  if (report.productionEnabled !== false) {
    errors.push('V6_RELEASE_OBSERVABILITY_PRODUCTION_ENABLEMENT_FORBIDDEN');
  }
  if (report.runtimeExposed !== false || report.playerVisible !== false || report.normalGameplayExposure !== false) {
    errors.push('V6_RELEASE_OBSERVABILITY_RUNTIME_HIDDEN_REQUIRED');
  }
  if (report.executionStatus !== 'not_executable') {
    errors.push('V6_RELEASE_OBSERVABILITY_NON_EXECUTING_REQUIRED');
  }
  if (
    report.mutatesWorldState !== false
    || report.activatesAlerts !== false
    || report.startsRuntimeMonitoring !== false
    || report.publishesRuntimeTools !== false
  ) {
    errors.push('V6_RELEASE_OBSERVABILITY_EXECUTION_FORBIDDEN');
  }
  if (report.exposesPrivateData !== false) {
    errors.push('V6_RELEASE_OBSERVABILITY_PRIVATE_DATA_FORBIDDEN');
  }
  if (!Array.isArray(report.releaseGaps) || report.releaseGaps.length === 0) {
    errors.push('V6_RELEASE_OBSERVABILITY_RELEASE_GAPS_REQUIRED');
  }
  if (Array.isArray(report.errors) && report.errors.length > 0) {
    errors.push('V6_RELEASE_OBSERVABILITY_ERRORS_PRESENT');
  }
  const observedEvidence = report.observedEvidence || {};
  if (
    numberValue(observedEvidence.privateDataExposureCount) > 0
    || numberValue(observedEvidence.rawTracePrivateDataCount) > 0
    || numberValue(observedEvidence.runtimeCivicToolExposureCount) > 0
    || observedEvidence.appliesWorldState === true
    || observedEvidence.mutatesWorldState === true
    || observedEvidence.exposesPrivateData === true
    || observedEvidence.activatesAlerts === true
    || observedEvidence.startsRuntimeMonitoring === true
    || observedEvidence.productionEnabled === true
    || observedEvidence.publishesRuntimeTools === true
  ) {
    errors.push('V6_RELEASE_OBSERVABILITY_EVIDENCE_SAFETY_REQUIRED');
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  REQUIRED_RELEASE_OBSERVABILITY_GAPS,
  REQUIRED_RELEASE_OBSERVABILITY_KEYS,
  V6_RELEASE_OBSERVABILITY_REQUIREMENTS,
  V6_RELEASE_OBSERVABILITY_VERSION,
  assertV6ReleaseObservabilityReportSafe,
  buildV6ReleaseObservabilityReport,
  inspectReleaseObservabilityRequirements
};
