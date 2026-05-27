const crypto = require('crypto');

const V6_RELEASE_SIGNOFF_PACKET_VERSION = 'agent-town.v6.release_signoff_packet.v1';

const REQUIRED_RELEASE_SIGNOFF_PACKET_KEYS = [
  'product_owner_approval',
  'qa_owner_signoff',
  'security_owner_signoff',
  'privacy_owner_signoff',
  'support_owner_signoff',
  'release_manager_approval',
  'engineering_owner_approval',
  'blocker_register_acceptance',
  'release_candidate_packet_acceptance',
  'operations_handoff_acceptance',
  'observability_handoff_acceptance',
  'support_runbook_acceptance'
];

const REQUIRED_RELEASE_SIGNOFF_PACKET_GAPS = [
  'product_owner_signoff_required',
  'qa_owner_signoff_required',
  'security_owner_signoff_required',
  'privacy_owner_signoff_required',
  'support_owner_signoff_required',
  'release_manager_approval_required',
  'engineering_owner_approval_required',
  'blocker_register_acceptance_required',
  'release_candidate_packet_acceptance_required',
  'operations_handoff_acceptance_required',
  'observability_handoff_acceptance_required',
  'support_runbook_acceptance_required'
];

const V6_RELEASE_SIGNOFF_PACKET_REQUIREMENTS = [
  {
    key: 'product_owner_approval',
    owner: 'product_owner',
    requiredEvidence: 'Product owner approval must name the approved V6 scope, excluded surfaces, user-facing copy, support path, fallback decision, and release decision owner.',
    releaseEvidenceRequired: 'product_owner_signed_release_packet'
  },
  {
    key: 'qa_owner_signoff',
    owner: 'qa_owner',
    requiredEvidence: 'QA owner signoff must cite the release-candidate environment, targeted Node results, split Playwright smokes, all-features regression, console budget, trace archive, and blocker disposition.',
    releaseEvidenceRequired: 'qa_owner_signed_release_packet'
  },
  {
    key: 'security_owner_signoff',
    owner: 'security_owner',
    requiredEvidence: 'Security owner signoff must cite threat model, abuse-case, mutation security, session-auth, audit/replay, rollback, feature-flag override, and runtime-tool absence evidence.',
    releaseEvidenceRequired: 'security_owner_signed_release_packet'
  },
  {
    key: 'privacy_owner_signoff',
    owner: 'privacy_owner',
    requiredEvidence: 'Privacy owner signoff must cite public/private boundary review, public text rendering, private-data minimization, support-view redaction, trace redaction, and retention evidence.',
    releaseEvidenceRequired: 'privacy_owner_signed_release_packet'
  },
  {
    key: 'support_owner_signoff',
    owner: 'support_owner',
    requiredEvidence: 'Support owner signoff must cite known issues, support triage, incident response, escalation owners, privacy-safe support views, rollback contact, and user-comms approval.',
    releaseEvidenceRequired: 'support_owner_signed_release_packet'
  },
  {
    key: 'release_manager_approval',
    owner: 'release_manager',
    requiredEvidence: 'Release manager approval must cite the release window, go/no-go record, blocker disposition, canary boundary, emergency disable, rollback window, and evidence archive.',
    releaseEvidenceRequired: 'release_manager_signed_release_packet'
  },
  {
    key: 'engineering_owner_approval',
    owner: 'engineering_owner',
    requiredEvidence: 'Engineering owner approval must cite production flag ownership, rollout controls, rollback/disable drills, persistence health, route/store restart coverage, and post-release verification.',
    releaseEvidenceRequired: 'engineering_owner_signed_release_packet'
  },
  {
    key: 'blocker_register_acceptance',
    owner: 'release_manager',
    requiredEvidence: 'Signoff packet must accept the blocker/exception register only after P0/P1 disposition, exception owner/expiry/mitigation, and security dependency review are complete.',
    releaseEvidenceRequired: 'blocker_register_acceptance_record'
  },
  {
    key: 'release_candidate_packet_acceptance',
    owner: 'qa_security_product',
    requiredEvidence: 'Signoff packet must accept the release-candidate packet only after command transcripts, browser evidence, production override recheck, and runtime tool absence recheck are linked.',
    releaseEvidenceRequired: 'release_candidate_packet_acceptance_record'
  },
  {
    key: 'operations_handoff_acceptance',
    owner: 'release_engineering',
    requiredEvidence: 'Signoff packet must accept the release operations handoff only after production flag control, release window, canary exit, emergency disable, rollback, post-release verification, and audit health are linked.',
    releaseEvidenceRequired: 'operations_handoff_acceptance_record'
  },
  {
    key: 'observability_handoff_acceptance',
    owner: 'release_engineering',
    requiredEvidence: 'Signoff packet must accept the observability handoff only after privacy-safe metrics, alert owners, feature flag dashboard, runtime tool absence monitor, support escalation link, and post-release review are linked.',
    releaseEvidenceRequired: 'observability_handoff_acceptance_record'
  },
  {
    key: 'support_runbook_acceptance',
    owner: 'support_owner',
    requiredEvidence: 'Signoff packet must accept the support runbook only after known issues, triage, incident response, user comms, on-call coverage, escalation owners, and privacy-safe support views are linked.',
    releaseEvidenceRequired: 'support_runbook_acceptance_record'
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

function targetMatrixDigest(requirements = V6_RELEASE_SIGNOFF_PACKET_REQUIREMENTS) {
  return sha256(JSON.stringify(requirements.map((requirement) => ({
    key: requirement.key,
    owner: requirement.owner,
    requiredEvidence: requirement.requiredEvidence,
    releaseEvidenceRequired: requirement.releaseEvidenceRequired
  }))));
}

function inspectReleaseSignoffPacketRequirements(requirements = V6_RELEASE_SIGNOFF_PACKET_REQUIREMENTS) {
  const safeRequirements = Array.isArray(requirements) ? requirements : [];
  const requirementKeys = safeRequirements.map((requirement) => String(requirement.key || ''));
  const missingKeys = REQUIRED_RELEASE_SIGNOFF_PACKET_KEYS.filter((key) => !requirementKeys.includes(key));
  const incompleteRequirements = safeRequirements.filter((requirement) => (
    !requirement.key
    || !requirement.owner
    || !requirement.requiredEvidence
    || !requirement.releaseEvidenceRequired
  )).map((requirement) => String(requirement.key || 'unknown'));

  return {
    ok: missingKeys.length === 0 && incompleteRequirements.length === 0,
    requiredKeys: [...REQUIRED_RELEASE_SIGNOFF_PACKET_KEYS],
    requirementKeys,
    missingKeys,
    incompleteRequirements,
    requirementCount: safeRequirements.length,
    digest: targetMatrixDigest(safeRequirements)
  };
}

function buildMissingReport(errors = []) {
  return {
    version: V6_RELEASE_SIGNOFF_PACKET_VERSION,
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
    enablesProduction: false,
    publishesComms: false,
    opensCanary: false,
    executionStatus: 'not_executable',
    targetMatrix: inspectReleaseSignoffPacketRequirements([]),
    observedEvidence: {},
    releaseGaps: [...REQUIRED_RELEASE_SIGNOFF_PACKET_GAPS]
  };
}

function buildV6ReleaseSignoffPacketReport({
  requirements = V6_RELEASE_SIGNOFF_PACKET_REQUIREMENTS,
  observed = {},
  source = 'runtime'
} = {}) {
  const targetMatrix = inspectReleaseSignoffPacketRequirements(requirements);
  const observedEvidence = {
    productOwnerApprovalCount: numberValue(observed.productOwnerApprovalCount),
    qaOwnerSignoffCount: numberValue(observed.qaOwnerSignoffCount),
    securityOwnerSignoffCount: numberValue(observed.securityOwnerSignoffCount),
    privacyOwnerSignoffCount: numberValue(observed.privacyOwnerSignoffCount),
    supportOwnerSignoffCount: numberValue(observed.supportOwnerSignoffCount),
    releaseManagerApprovalCount: numberValue(observed.releaseManagerApprovalCount),
    engineeringOwnerApprovalCount: numberValue(observed.engineeringOwnerApprovalCount),
    blockerRegisterAcceptanceCount: numberValue(observed.blockerRegisterAcceptanceCount),
    releaseCandidatePacketAcceptanceCount: numberValue(observed.releaseCandidatePacketAcceptanceCount),
    operationsHandoffAcceptanceCount: numberValue(observed.operationsHandoffAcceptanceCount),
    observabilityHandoffAcceptanceCount: numberValue(observed.observabilityHandoffAcceptanceCount),
    supportRunbookAcceptanceCount: numberValue(observed.supportRunbookAcceptanceCount),
    privateDataExposureCount: numberValue(observed.privateDataExposureCount),
    runtimeCivicToolExposureCount: numberValue(observed.runtimeCivicToolExposureCount),
    unsignedApprovalCount: numberValue(observed.unsignedApprovalCount),
    expiredApprovalCount: numberValue(observed.expiredApprovalCount),
    missingOwnerCount: numberValue(observed.missingOwnerCount),
    appliesWorldState: observed.appliesWorldState === true,
    mutatesWorldState: observed.mutatesWorldState === true,
    exposesPrivateData: observed.exposesPrivateData === true,
    approvesRelease: observed.approvesRelease === true,
    enablesProduction: observed.enablesProduction === true,
    publishesComms: observed.publishesComms === true,
    opensCanary: observed.opensCanary === true,
    productionEnabled: observed.productionEnabled === true,
    publishesRuntimeTools: observed.publishesRuntimeTools === true
  };
  const errors = [];
  if (targetMatrix.ok !== true) errors.push('V6_RELEASE_SIGNOFF_PACKET_TARGET_MATRIX_INCOMPLETE');
  if (observedEvidence.productOwnerApprovalCount <= 0) errors.push('V6_RELEASE_SIGNOFF_PACKET_PRODUCT_OWNER_REQUIRED');
  if (observedEvidence.qaOwnerSignoffCount <= 0) errors.push('V6_RELEASE_SIGNOFF_PACKET_QA_OWNER_REQUIRED');
  if (observedEvidence.securityOwnerSignoffCount <= 0) errors.push('V6_RELEASE_SIGNOFF_PACKET_SECURITY_OWNER_REQUIRED');
  if (observedEvidence.privacyOwnerSignoffCount <= 0) errors.push('V6_RELEASE_SIGNOFF_PACKET_PRIVACY_OWNER_REQUIRED');
  if (observedEvidence.supportOwnerSignoffCount <= 0) errors.push('V6_RELEASE_SIGNOFF_PACKET_SUPPORT_OWNER_REQUIRED');
  if (observedEvidence.releaseManagerApprovalCount <= 0) errors.push('V6_RELEASE_SIGNOFF_PACKET_RELEASE_MANAGER_REQUIRED');
  if (observedEvidence.engineeringOwnerApprovalCount <= 0) errors.push('V6_RELEASE_SIGNOFF_PACKET_ENGINEERING_OWNER_REQUIRED');
  if (observedEvidence.blockerRegisterAcceptanceCount <= 0) errors.push('V6_RELEASE_SIGNOFF_PACKET_BLOCKER_REGISTER_REQUIRED');
  if (observedEvidence.releaseCandidatePacketAcceptanceCount <= 0) errors.push('V6_RELEASE_SIGNOFF_PACKET_RELEASE_CANDIDATE_REQUIRED');
  if (observedEvidence.operationsHandoffAcceptanceCount <= 0) errors.push('V6_RELEASE_SIGNOFF_PACKET_OPERATIONS_HANDOFF_REQUIRED');
  if (observedEvidence.observabilityHandoffAcceptanceCount <= 0) errors.push('V6_RELEASE_SIGNOFF_PACKET_OBSERVABILITY_HANDOFF_REQUIRED');
  if (observedEvidence.supportRunbookAcceptanceCount <= 0) errors.push('V6_RELEASE_SIGNOFF_PACKET_SUPPORT_RUNBOOK_REQUIRED');
  if (
    observedEvidence.unsignedApprovalCount > 0
    || observedEvidence.expiredApprovalCount > 0
    || observedEvidence.missingOwnerCount > 0
  ) {
    errors.push('V6_RELEASE_SIGNOFF_PACKET_APPROVAL_INTEGRITY_REQUIRED');
  }
  if (observedEvidence.privateDataExposureCount > 0 || observedEvidence.exposesPrivateData) {
    errors.push('V6_RELEASE_SIGNOFF_PACKET_PRIVATE_DATA_FORBIDDEN');
  }
  if (observedEvidence.runtimeCivicToolExposureCount > 0 || observedEvidence.publishesRuntimeTools) {
    errors.push('V6_RELEASE_SIGNOFF_PACKET_RUNTIME_TOOL_EXPOSURE_FORBIDDEN');
  }
  if (
    observedEvidence.appliesWorldState
    || observedEvidence.mutatesWorldState
    || observedEvidence.approvesRelease
    || observedEvidence.enablesProduction
    || observedEvidence.productionEnabled
    || observedEvidence.publishesComms
    || observedEvidence.opensCanary
  ) {
    errors.push('V6_RELEASE_SIGNOFF_PACKET_EXECUTION_FORBIDDEN');
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
    version: V6_RELEASE_SIGNOFF_PACKET_VERSION,
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
    enablesProduction: false,
    publishesComms: false,
    opensCanary: false,
    executionStatus: 'not_executable',
    targetMatrix,
    requirements: clone(requirements),
    observedEvidence,
    releaseGaps: [...REQUIRED_RELEASE_SIGNOFF_PACKET_GAPS]
  };
}

function assertV6ReleaseSignoffPacketReportSafe(report = {}) {
  const errors = [];
  if (report.version !== V6_RELEASE_SIGNOFF_PACKET_VERSION) {
    errors.push('V6_RELEASE_SIGNOFF_PACKET_VERSION_REQUIRED');
  }
  if (report.status !== 'research_only') {
    errors.push('V6_RELEASE_SIGNOFF_PACKET_RESEARCH_ONLY_REQUIRED');
  }
  if (report.releaseReady !== false || report.productionReady !== false) {
    errors.push('V6_RELEASE_SIGNOFF_PACKET_RELEASE_READY_FORBIDDEN');
  }
  if (report.productionEnabled !== false) {
    errors.push('V6_RELEASE_SIGNOFF_PACKET_PRODUCTION_ENABLEMENT_FORBIDDEN');
  }
  if (report.runtimeExposed !== false || report.playerVisible !== false || report.normalGameplayExposure !== false) {
    errors.push('V6_RELEASE_SIGNOFF_PACKET_RUNTIME_HIDDEN_REQUIRED');
  }
  if (report.executionStatus !== 'not_executable') {
    errors.push('V6_RELEASE_SIGNOFF_PACKET_NON_EXECUTING_REQUIRED');
  }
  if (
    report.mutatesWorldState !== false
    || report.approvesRelease !== false
    || report.enablesProduction !== false
    || report.publishesComms !== false
    || report.opensCanary !== false
  ) {
    errors.push('V6_RELEASE_SIGNOFF_PACKET_EXECUTION_FORBIDDEN');
  }
  if (report.exposesPrivateData !== false) {
    errors.push('V6_RELEASE_SIGNOFF_PACKET_PRIVATE_DATA_FORBIDDEN');
  }
  if (!Array.isArray(report.releaseGaps) || report.releaseGaps.length === 0) {
    errors.push('V6_RELEASE_SIGNOFF_PACKET_RELEASE_GAPS_REQUIRED');
  }
  if (Array.isArray(report.errors) && report.errors.length > 0) {
    errors.push('V6_RELEASE_SIGNOFF_PACKET_ERRORS_PRESENT');
  }
  const observedEvidence = report.observedEvidence || {};
  if (
    numberValue(observedEvidence.privateDataExposureCount) > 0
    || numberValue(observedEvidence.runtimeCivicToolExposureCount) > 0
    || numberValue(observedEvidence.unsignedApprovalCount) > 0
    || numberValue(observedEvidence.expiredApprovalCount) > 0
    || numberValue(observedEvidence.missingOwnerCount) > 0
    || observedEvidence.appliesWorldState === true
    || observedEvidence.mutatesWorldState === true
    || observedEvidence.exposesPrivateData === true
    || observedEvidence.approvesRelease === true
    || observedEvidence.enablesProduction === true
    || observedEvidence.productionEnabled === true
    || observedEvidence.publishesComms === true
    || observedEvidence.opensCanary === true
    || observedEvidence.publishesRuntimeTools === true
  ) {
    errors.push('V6_RELEASE_SIGNOFF_PACKET_EVIDENCE_SAFETY_REQUIRED');
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  REQUIRED_RELEASE_SIGNOFF_PACKET_GAPS,
  REQUIRED_RELEASE_SIGNOFF_PACKET_KEYS,
  V6_RELEASE_SIGNOFF_PACKET_REQUIREMENTS,
  V6_RELEASE_SIGNOFF_PACKET_VERSION,
  assertV6ReleaseSignoffPacketReportSafe,
  buildV6ReleaseSignoffPacketReport,
  inspectReleaseSignoffPacketRequirements
};
