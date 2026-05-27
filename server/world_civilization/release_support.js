const crypto = require('crypto');

const V6_RELEASE_SUPPORT_VERSION = 'agent-town.v6.release_support.v1';

const REQUIRED_RELEASE_SUPPORT_KEYS = [
  'known_issues',
  'support_triage',
  'incident_response',
  'user_comms',
  'rollback_contact',
  'support_oncall',
  'escalation_owners',
  'privacy_safe_support_view',
  'blocker_register_link',
  'observability_link'
];

const REQUIRED_RELEASE_SUPPORT_GAPS = [
  'known_issues_required',
  'support_triage_required',
  'incident_response_required',
  'support_oncall_signoff_required',
  'rollback_contact_required',
  'privacy_safe_support_view_required',
  'blocker_register_link_required',
  'observability_link_required'
];

const V6_RELEASE_SUPPORT_REQUIREMENTS = [
  {
    key: 'known_issues',
    owner: 'support',
    requiredEvidence: 'Support must have a known-issues list for controlled release, including user impact, severity, workaround, owner, and blocker-register link.',
    releaseEvidenceRequired: 'known_issues_support_packet'
  },
  {
    key: 'support_triage',
    owner: 'support',
    requiredEvidence: 'Support triage must define severity mapping, first-response owner, escalation path, blocker update rules, and close criteria.',
    releaseEvidenceRequired: 'support_triage_path'
  },
  {
    key: 'incident_response',
    owner: 'support_security',
    requiredEvidence: 'Incident response must link alert states to security/product/engineering owners, privacy review, emergency disable, and rollback decisions.',
    releaseEvidenceRequired: 'incident_response_handoff'
  },
  {
    key: 'user_comms',
    owner: 'product_support',
    requiredEvidence: 'User communication templates must be approved and exclude provider jargon, private town data, debug traces, raw transcripts, and internal research details.',
    releaseEvidenceRequired: 'approved_support_user_comms'
  },
  {
    key: 'rollback_contact',
    owner: 'release_manager',
    requiredEvidence: 'Support must have a named rollback contact path, backup contact, rollback window, and post-rollback verification owner.',
    releaseEvidenceRequired: 'rollback_contact_record'
  },
  {
    key: 'support_oncall',
    owner: 'support',
    requiredEvidence: 'Support on-call coverage must name primary, backup, coverage window, escalation owner, and release go/no-go approval.',
    releaseEvidenceRequired: 'support_oncall_signoff'
  },
  {
    key: 'escalation_owners',
    owner: 'release_manager',
    requiredEvidence: 'Every support escalation path must name product, security, QA, engineering, and release manager owners.',
    releaseEvidenceRequired: 'support_escalation_owner_matrix'
  },
  {
    key: 'privacy_safe_support_view',
    owner: 'privacy_security',
    requiredEvidence: 'Support views must expose only redacted civic state, public-safe audit summaries, feature flag state, and support ticket metadata.',
    releaseEvidenceRequired: 'privacy_safe_support_view_review'
  },
  {
    key: 'blocker_register_link',
    owner: 'release_manager',
    requiredEvidence: 'Support handoff must link support issues to the blocker/exception register and define who updates release disposition.',
    releaseEvidenceRequired: 'support_blocker_register_link'
  },
  {
    key: 'observability_link',
    owner: 'release_engineering',
    requiredEvidence: 'Support handoff must link to release observability dashboards, alert owners, runtime tool absence monitor, and canary health checks.',
    releaseEvidenceRequired: 'support_observability_link'
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

function targetMatrixDigest(requirements = V6_RELEASE_SUPPORT_REQUIREMENTS) {
  return sha256(JSON.stringify(requirements.map((requirement) => ({
    key: requirement.key,
    owner: requirement.owner,
    requiredEvidence: requirement.requiredEvidence,
    releaseEvidenceRequired: requirement.releaseEvidenceRequired
  }))));
}

function inspectReleaseSupportRequirements(requirements = V6_RELEASE_SUPPORT_REQUIREMENTS) {
  const safeRequirements = Array.isArray(requirements) ? requirements : [];
  const requirementKeys = safeRequirements.map((requirement) => String(requirement.key || ''));
  const missingKeys = REQUIRED_RELEASE_SUPPORT_KEYS.filter((key) => !requirementKeys.includes(key));
  const incompleteRequirements = safeRequirements.filter((requirement) => (
    !requirement.key
    || !requirement.owner
    || !requirement.requiredEvidence
    || !requirement.releaseEvidenceRequired
  )).map((requirement) => String(requirement.key || 'unknown'));

  return {
    ok: missingKeys.length === 0 && incompleteRequirements.length === 0,
    requiredKeys: [...REQUIRED_RELEASE_SUPPORT_KEYS],
    requirementKeys,
    missingKeys,
    incompleteRequirements,
    requirementCount: safeRequirements.length,
    digest: targetMatrixDigest(safeRequirements)
  };
}

function buildMissingReport(errors = []) {
  return {
    version: V6_RELEASE_SUPPORT_VERSION,
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
    opensSupportQueue: false,
    publishesComms: false,
    triggersRollback: false,
    executionStatus: 'not_executable',
    targetMatrix: inspectReleaseSupportRequirements([]),
    observedEvidence: {},
    releaseGaps: [...REQUIRED_RELEASE_SUPPORT_GAPS]
  };
}

function buildV6ReleaseSupportReport({
  requirements = V6_RELEASE_SUPPORT_REQUIREMENTS,
  observed = {},
  source = 'runtime'
} = {}) {
  const targetMatrix = inspectReleaseSupportRequirements(requirements);
  const observedEvidence = {
    knownIssuesCount: numberValue(observed.knownIssuesCount),
    supportTriagePathCount: numberValue(observed.supportTriagePathCount),
    incidentResponseLinkCount: numberValue(observed.incidentResponseLinkCount),
    userCommsTemplateCount: numberValue(observed.userCommsTemplateCount),
    rollbackContactCount: numberValue(observed.rollbackContactCount),
    supportOncallSignoffCount: numberValue(observed.supportOncallSignoffCount),
    escalationOwnerMatrixCount: numberValue(observed.escalationOwnerMatrixCount),
    privacySafeSupportViewCount: numberValue(observed.privacySafeSupportViewCount),
    blockerRegisterLinkCount: numberValue(observed.blockerRegisterLinkCount),
    observabilityLinkCount: numberValue(observed.observabilityLinkCount),
    privateDataExposureCount: numberValue(observed.privateDataExposureCount),
    rawTraceExposureCount: numberValue(observed.rawTraceExposureCount),
    providerJargonCommsCount: numberValue(observed.providerJargonCommsCount),
    runtimeCivicToolExposureCount: numberValue(observed.runtimeCivicToolExposureCount),
    appliesWorldState: observed.appliesWorldState === true,
    mutatesWorldState: observed.mutatesWorldState === true,
    exposesPrivateData: observed.exposesPrivateData === true,
    opensSupportQueue: observed.opensSupportQueue === true,
    publishesComms: observed.publishesComms === true,
    triggersRollback: observed.triggersRollback === true,
    productionEnabled: observed.productionEnabled === true,
    publishesRuntimeTools: observed.publishesRuntimeTools === true
  };
  const errors = [];
  if (targetMatrix.ok !== true) errors.push('V6_RELEASE_SUPPORT_TARGET_MATRIX_INCOMPLETE');
  if (observedEvidence.knownIssuesCount <= 0) errors.push('V6_RELEASE_SUPPORT_KNOWN_ISSUES_REQUIRED');
  if (observedEvidence.supportTriagePathCount <= 0) errors.push('V6_RELEASE_SUPPORT_TRIAGE_REQUIRED');
  if (observedEvidence.incidentResponseLinkCount <= 0) errors.push('V6_RELEASE_SUPPORT_INCIDENT_RESPONSE_REQUIRED');
  if (observedEvidence.userCommsTemplateCount <= 0) errors.push('V6_RELEASE_SUPPORT_USER_COMMS_REQUIRED');
  if (observedEvidence.rollbackContactCount <= 0) errors.push('V6_RELEASE_SUPPORT_ROLLBACK_CONTACT_REQUIRED');
  if (observedEvidence.supportOncallSignoffCount <= 0) errors.push('V6_RELEASE_SUPPORT_ONCALL_SIGNOFF_REQUIRED');
  if (observedEvidence.escalationOwnerMatrixCount <= 0) errors.push('V6_RELEASE_SUPPORT_ESCALATION_OWNER_REQUIRED');
  if (observedEvidence.privacySafeSupportViewCount <= 0) errors.push('V6_RELEASE_SUPPORT_PRIVACY_SAFE_VIEW_REQUIRED');
  if (observedEvidence.blockerRegisterLinkCount <= 0) errors.push('V6_RELEASE_SUPPORT_BLOCKER_REGISTER_LINK_REQUIRED');
  if (observedEvidence.observabilityLinkCount <= 0) errors.push('V6_RELEASE_SUPPORT_OBSERVABILITY_LINK_REQUIRED');
  if (
    observedEvidence.privateDataExposureCount > 0
    || observedEvidence.rawTraceExposureCount > 0
    || observedEvidence.providerJargonCommsCount > 0
    || observedEvidence.exposesPrivateData
  ) {
    errors.push('V6_RELEASE_SUPPORT_PRIVATE_DATA_FORBIDDEN');
  }
  if (observedEvidence.runtimeCivicToolExposureCount > 0 || observedEvidence.publishesRuntimeTools) {
    errors.push('V6_RELEASE_SUPPORT_RUNTIME_TOOL_EXPOSURE_FORBIDDEN');
  }
  if (
    observedEvidence.appliesWorldState
    || observedEvidence.mutatesWorldState
    || observedEvidence.opensSupportQueue
    || observedEvidence.publishesComms
    || observedEvidence.triggersRollback
    || observedEvidence.productionEnabled
  ) {
    errors.push('V6_RELEASE_SUPPORT_EXECUTION_FORBIDDEN');
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
    version: V6_RELEASE_SUPPORT_VERSION,
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
    opensSupportQueue: false,
    publishesComms: false,
    triggersRollback: false,
    executionStatus: 'not_executable',
    targetMatrix,
    requirements: clone(requirements),
    observedEvidence,
    releaseGaps: [...REQUIRED_RELEASE_SUPPORT_GAPS]
  };
}

function assertV6ReleaseSupportReportSafe(report = {}) {
  const errors = [];
  if (report.version !== V6_RELEASE_SUPPORT_VERSION) {
    errors.push('V6_RELEASE_SUPPORT_VERSION_REQUIRED');
  }
  if (report.status !== 'research_only') {
    errors.push('V6_RELEASE_SUPPORT_RESEARCH_ONLY_REQUIRED');
  }
  if (report.releaseReady !== false || report.productionReady !== false) {
    errors.push('V6_RELEASE_SUPPORT_RELEASE_READY_FORBIDDEN');
  }
  if (report.productionEnabled !== false) {
    errors.push('V6_RELEASE_SUPPORT_PRODUCTION_ENABLEMENT_FORBIDDEN');
  }
  if (report.runtimeExposed !== false || report.playerVisible !== false || report.normalGameplayExposure !== false) {
    errors.push('V6_RELEASE_SUPPORT_RUNTIME_HIDDEN_REQUIRED');
  }
  if (report.executionStatus !== 'not_executable') {
    errors.push('V6_RELEASE_SUPPORT_NON_EXECUTING_REQUIRED');
  }
  if (
    report.mutatesWorldState !== false
    || report.opensSupportQueue !== false
    || report.publishesComms !== false
    || report.triggersRollback !== false
  ) {
    errors.push('V6_RELEASE_SUPPORT_EXECUTION_FORBIDDEN');
  }
  if (report.exposesPrivateData !== false) {
    errors.push('V6_RELEASE_SUPPORT_PRIVATE_DATA_FORBIDDEN');
  }
  if (!Array.isArray(report.releaseGaps) || report.releaseGaps.length === 0) {
    errors.push('V6_RELEASE_SUPPORT_RELEASE_GAPS_REQUIRED');
  }
  if (Array.isArray(report.errors) && report.errors.length > 0) {
    errors.push('V6_RELEASE_SUPPORT_ERRORS_PRESENT');
  }
  const observedEvidence = report.observedEvidence || {};
  if (
    numberValue(observedEvidence.privateDataExposureCount) > 0
    || numberValue(observedEvidence.rawTraceExposureCount) > 0
    || numberValue(observedEvidence.providerJargonCommsCount) > 0
    || numberValue(observedEvidence.runtimeCivicToolExposureCount) > 0
    || observedEvidence.appliesWorldState === true
    || observedEvidence.mutatesWorldState === true
    || observedEvidence.exposesPrivateData === true
    || observedEvidence.opensSupportQueue === true
    || observedEvidence.publishesComms === true
    || observedEvidence.triggersRollback === true
    || observedEvidence.productionEnabled === true
    || observedEvidence.publishesRuntimeTools === true
  ) {
    errors.push('V6_RELEASE_SUPPORT_EVIDENCE_SAFETY_REQUIRED');
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  REQUIRED_RELEASE_SUPPORT_GAPS,
  REQUIRED_RELEASE_SUPPORT_KEYS,
  V6_RELEASE_SUPPORT_REQUIREMENTS,
  V6_RELEASE_SUPPORT_VERSION,
  assertV6ReleaseSupportReportSafe,
  buildV6ReleaseSupportReport,
  inspectReleaseSupportRequirements
};
