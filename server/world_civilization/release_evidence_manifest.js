const crypto = require('crypto');

const V6_RELEASE_EVIDENCE_MANIFEST_VERSION = 'agent-town.v6.release_evidence_manifest.v1';

const REQUIRED_RELEASE_EVIDENCE_MANIFEST_KEYS = [
  'release_candidate_environment',
  'command_transcripts',
  'targeted_node_results',
  'split_playwright_results',
  'all_features_regression_results',
  'production_override_recheck',
  'runtime_tool_absence_recheck',
  'browser_console_error_budget',
  'playwright_trace_archive',
  'blocker_exception_register',
  'release_signoff_packet',
  'release_operations_handoff',
  'release_observability_handoff',
  'release_support_handoff',
  'audit_replay_health',
  'controlled_release_runbook'
];

const REQUIRED_RELEASE_EVIDENCE_MANIFEST_GAPS = [
  'release_candidate_environment_required',
  'command_transcripts_required',
  'targeted_node_results_required',
  'split_playwright_results_required',
  'all_features_regression_results_required',
  'production_override_recheck_required',
  'runtime_tool_absence_recheck_required',
  'browser_console_error_budget_required',
  'playwright_trace_archive_required',
  'blocker_exception_register_required',
  'release_signoff_packet_required',
  'release_operations_handoff_required',
  'release_observability_handoff_required',
  'release_support_handoff_required',
  'audit_replay_health_required',
  'controlled_release_runbook_required'
];

const V6_RELEASE_EVIDENCE_MANIFEST_REQUIREMENTS = [
  {
    key: 'release_candidate_environment',
    owner: 'release_engineering',
    requiredEvidence: 'Evidence manifest must name branch, commit, Node version, browser version, OS, feature flags, env overrides, server mode, and runtime mode.',
    releaseEvidenceRequired: 'release_candidate_environment_manifest_entry'
  },
  {
    key: 'command_transcripts',
    owner: 'qa_engineering',
    requiredEvidence: 'Evidence manifest must link exact command transcripts for targeted Node contracts, world-grid contracts, split Playwright smokes, all-features regression, and override checks.',
    releaseEvidenceRequired: 'command_transcript_manifest_entry'
  },
  {
    key: 'targeted_node_results',
    owner: 'qa_engineering',
    requiredEvidence: 'Evidence manifest must link targeted Node result packets with command, commit, duration, pass/fail count, and owner.',
    releaseEvidenceRequired: 'targeted_node_results_manifest_entry'
  },
  {
    key: 'split_playwright_results',
    owner: 'qa_engineering',
    requiredEvidence: 'Evidence manifest must link V5.0-V5.5 split Playwright smoke outputs with screenshots or trace references per slice.',
    releaseEvidenceRequired: 'split_playwright_results_manifest_entry'
  },
  {
    key: 'all_features_regression_results',
    owner: 'qa_engineering',
    requiredEvidence: 'Evidence manifest must link the all-features world-grid regression as secondary browser evidence, not as the only coverage.',
    releaseEvidenceRequired: 'all_features_regression_manifest_entry'
  },
  {
    key: 'production_override_recheck',
    owner: 'security_engineering',
    requiredEvidence: 'Evidence manifest must link the production query/header override recheck proving broad player overrides cannot enable V6 or publish runtime civic tools.',
    releaseEvidenceRequired: 'production_override_recheck_manifest_entry'
  },
  {
    key: 'runtime_tool_absence_recheck',
    owner: 'security_engineering',
    requiredEvidence: 'Evidence manifest must link runtime `/api/world/tools` capture proving no `et.world.civic.*` tools are published before release.',
    releaseEvidenceRequired: 'runtime_tool_absence_manifest_entry'
  },
  {
    key: 'browser_console_error_budget',
    owner: 'qa_engineering',
    requiredEvidence: 'Evidence manifest must link browser console and page-error budget evidence with blocker or exception mapping for failures.',
    releaseEvidenceRequired: 'browser_console_error_budget_manifest_entry'
  },
  {
    key: 'playwright_trace_archive',
    owner: 'qa_engineering',
    requiredEvidence: 'Evidence manifest must link retained Playwright traces, screenshots, videos, and server logs for failed or sampled passing release-candidate runs.',
    releaseEvidenceRequired: 'playwright_trace_archive_manifest_entry'
  },
  {
    key: 'blocker_exception_register',
    owner: 'release_manager',
    requiredEvidence: 'Evidence manifest must link the blocker/exception register and record P0/P1 disposition, exception expiry, mitigation, and release decision mapping.',
    releaseEvidenceRequired: 'blocker_exception_register_manifest_entry'
  },
  {
    key: 'release_signoff_packet',
    owner: 'release_manager',
    requiredEvidence: 'Evidence manifest must link the structured cross-functional release signoff packet and its product, QA, security, privacy, support, release manager, and engineering approvals.',
    releaseEvidenceRequired: 'release_signoff_packet_manifest_entry'
  },
  {
    key: 'release_operations_handoff',
    owner: 'release_engineering',
    requiredEvidence: 'Evidence manifest must link release operations handoff for production flag control, release window, canary exit, emergency disable, rollback, post-release verification, and evidence archive.',
    releaseEvidenceRequired: 'release_operations_handoff_manifest_entry'
  },
  {
    key: 'release_observability_handoff',
    owner: 'release_engineering',
    requiredEvidence: 'Evidence manifest must link release observability handoff for privacy-safe metrics, alert owners, feature flag dashboard, runtime tool absence monitor, support escalation, and post-release review.',
    releaseEvidenceRequired: 'release_observability_handoff_manifest_entry'
  },
  {
    key: 'release_support_handoff',
    owner: 'support_owner',
    requiredEvidence: 'Evidence manifest must link support runbook handoff for known issues, triage, incident response, approved comms, on-call coverage, escalation owners, and privacy-safe support views.',
    releaseEvidenceRequired: 'release_support_handoff_manifest_entry'
  },
  {
    key: 'audit_replay_health',
    owner: 'security_engineering',
    requiredEvidence: 'Evidence manifest must link audit/replay health checks, hash-chain integrity, replay reconstruction, privacy-safe summaries, and rollback handle coverage.',
    releaseEvidenceRequired: 'audit_replay_health_manifest_entry'
  },
  {
    key: 'controlled_release_runbook',
    owner: 'release_manager',
    requiredEvidence: 'Evidence manifest must link the controlled-release runbook, emergency disable instructions, rollback contact path, release window, and final go/no-go record placeholder.',
    releaseEvidenceRequired: 'controlled_release_runbook_manifest_entry'
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

function targetMatrixDigest(requirements = V6_RELEASE_EVIDENCE_MANIFEST_REQUIREMENTS) {
  return sha256(JSON.stringify(requirements.map((requirement) => ({
    key: requirement.key,
    owner: requirement.owner,
    requiredEvidence: requirement.requiredEvidence,
    releaseEvidenceRequired: requirement.releaseEvidenceRequired
  }))));
}

function inspectReleaseEvidenceManifestRequirements(requirements = V6_RELEASE_EVIDENCE_MANIFEST_REQUIREMENTS) {
  const safeRequirements = Array.isArray(requirements) ? requirements : [];
  const requirementKeys = safeRequirements.map((requirement) => String(requirement.key || ''));
  const missingKeys = REQUIRED_RELEASE_EVIDENCE_MANIFEST_KEYS.filter((key) => !requirementKeys.includes(key));
  const incompleteRequirements = safeRequirements.filter((requirement) => (
    !requirement.key
    || !requirement.owner
    || !requirement.requiredEvidence
    || !requirement.releaseEvidenceRequired
  )).map((requirement) => String(requirement.key || 'unknown'));

  return {
    ok: missingKeys.length === 0 && incompleteRequirements.length === 0,
    requiredKeys: [...REQUIRED_RELEASE_EVIDENCE_MANIFEST_KEYS],
    requirementKeys,
    missingKeys,
    incompleteRequirements,
    requirementCount: safeRequirements.length,
    digest: targetMatrixDigest(safeRequirements)
  };
}

function buildMissingReport(errors = []) {
  return {
    version: V6_RELEASE_EVIDENCE_MANIFEST_VERSION,
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
    executesValidation: false,
    startsRuntimeMonitoring: false,
    executionStatus: 'not_executable',
    targetMatrix: inspectReleaseEvidenceManifestRequirements([]),
    observedEvidence: {},
    releaseGaps: [...REQUIRED_RELEASE_EVIDENCE_MANIFEST_GAPS]
  };
}

function buildV6ReleaseEvidenceManifestReport({
  requirements = V6_RELEASE_EVIDENCE_MANIFEST_REQUIREMENTS,
  observed = {},
  source = 'runtime'
} = {}) {
  const targetMatrix = inspectReleaseEvidenceManifestRequirements(requirements);
  const observedEvidence = {
    releaseCandidateEnvironmentCount: numberValue(observed.releaseCandidateEnvironmentCount),
    commandTranscriptCount: numberValue(observed.commandTranscriptCount),
    targetedNodeResultsCount: numberValue(observed.targetedNodeResultsCount),
    splitPlaywrightResultsCount: numberValue(observed.splitPlaywrightResultsCount),
    allFeaturesRegressionResultsCount: numberValue(observed.allFeaturesRegressionResultsCount),
    productionOverrideRecheckCount: numberValue(observed.productionOverrideRecheckCount),
    runtimeToolAbsenceRecheckCount: numberValue(observed.runtimeToolAbsenceRecheckCount),
    browserConsoleErrorBudgetCount: numberValue(observed.browserConsoleErrorBudgetCount),
    playwrightTraceArchiveCount: numberValue(observed.playwrightTraceArchiveCount),
    blockerExceptionRegisterCount: numberValue(observed.blockerExceptionRegisterCount),
    releaseSignoffPacketCount: numberValue(observed.releaseSignoffPacketCount),
    releaseOperationsHandoffCount: numberValue(observed.releaseOperationsHandoffCount),
    releaseObservabilityHandoffCount: numberValue(observed.releaseObservabilityHandoffCount),
    releaseSupportHandoffCount: numberValue(observed.releaseSupportHandoffCount),
    auditReplayHealthCount: numberValue(observed.auditReplayHealthCount),
    controlledReleaseRunbookCount: numberValue(observed.controlledReleaseRunbookCount),
    privateDataExposureCount: numberValue(observed.privateDataExposureCount),
    rawTraceLeakCount: numberValue(observed.rawTraceLeakCount),
    unsignedArtifactCount: numberValue(observed.unsignedArtifactCount),
    missingDigestCount: numberValue(observed.missingDigestCount),
    staleArtifactCount: numberValue(observed.staleArtifactCount),
    runtimeCivicToolExposureCount: numberValue(observed.runtimeCivicToolExposureCount),
    appliesWorldState: observed.appliesWorldState === true,
    mutatesWorldState: observed.mutatesWorldState === true,
    exposesPrivateData: observed.exposesPrivateData === true,
    approvesRelease: observed.approvesRelease === true,
    enablesProduction: observed.enablesProduction === true,
    publishesComms: observed.publishesComms === true,
    opensCanary: observed.opensCanary === true,
    executesValidation: observed.executesValidation === true,
    startsRuntimeMonitoring: observed.startsRuntimeMonitoring === true,
    productionEnabled: observed.productionEnabled === true,
    publishesRuntimeTools: observed.publishesRuntimeTools === true
  };
  const errors = [];
  if (targetMatrix.ok !== true) errors.push('V6_RELEASE_EVIDENCE_MANIFEST_TARGET_MATRIX_INCOMPLETE');
  if (observedEvidence.releaseCandidateEnvironmentCount <= 0) errors.push('V6_RELEASE_EVIDENCE_MANIFEST_ENVIRONMENT_REQUIRED');
  if (observedEvidence.commandTranscriptCount <= 0) errors.push('V6_RELEASE_EVIDENCE_MANIFEST_COMMAND_TRANSCRIPTS_REQUIRED');
  if (observedEvidence.targetedNodeResultsCount <= 0) errors.push('V6_RELEASE_EVIDENCE_MANIFEST_TARGETED_NODE_REQUIRED');
  if (observedEvidence.splitPlaywrightResultsCount <= 0) errors.push('V6_RELEASE_EVIDENCE_MANIFEST_SPLIT_PLAYWRIGHT_REQUIRED');
  if (observedEvidence.allFeaturesRegressionResultsCount <= 0) errors.push('V6_RELEASE_EVIDENCE_MANIFEST_ALL_FEATURES_REQUIRED');
  if (observedEvidence.productionOverrideRecheckCount <= 0) errors.push('V6_RELEASE_EVIDENCE_MANIFEST_PRODUCTION_OVERRIDE_REQUIRED');
  if (observedEvidence.runtimeToolAbsenceRecheckCount <= 0) errors.push('V6_RELEASE_EVIDENCE_MANIFEST_RUNTIME_TOOL_ABSENCE_REQUIRED');
  if (observedEvidence.browserConsoleErrorBudgetCount <= 0) errors.push('V6_RELEASE_EVIDENCE_MANIFEST_CONSOLE_BUDGET_REQUIRED');
  if (observedEvidence.playwrightTraceArchiveCount <= 0) errors.push('V6_RELEASE_EVIDENCE_MANIFEST_TRACE_ARCHIVE_REQUIRED');
  if (observedEvidence.blockerExceptionRegisterCount <= 0) errors.push('V6_RELEASE_EVIDENCE_MANIFEST_BLOCKER_REGISTER_REQUIRED');
  if (observedEvidence.releaseSignoffPacketCount <= 0) errors.push('V6_RELEASE_EVIDENCE_MANIFEST_SIGNOFF_PACKET_REQUIRED');
  if (observedEvidence.releaseOperationsHandoffCount <= 0) errors.push('V6_RELEASE_EVIDENCE_MANIFEST_OPERATIONS_HANDOFF_REQUIRED');
  if (observedEvidence.releaseObservabilityHandoffCount <= 0) errors.push('V6_RELEASE_EVIDENCE_MANIFEST_OBSERVABILITY_HANDOFF_REQUIRED');
  if (observedEvidence.releaseSupportHandoffCount <= 0) errors.push('V6_RELEASE_EVIDENCE_MANIFEST_SUPPORT_HANDOFF_REQUIRED');
  if (observedEvidence.auditReplayHealthCount <= 0) errors.push('V6_RELEASE_EVIDENCE_MANIFEST_AUDIT_REPLAY_HEALTH_REQUIRED');
  if (observedEvidence.controlledReleaseRunbookCount <= 0) errors.push('V6_RELEASE_EVIDENCE_MANIFEST_RUNBOOK_REQUIRED');
  if (
    observedEvidence.privateDataExposureCount > 0
    || observedEvidence.rawTraceLeakCount > 0
    || observedEvidence.exposesPrivateData
  ) {
    errors.push('V6_RELEASE_EVIDENCE_MANIFEST_PRIVATE_DATA_FORBIDDEN');
  }
  if (
    observedEvidence.unsignedArtifactCount > 0
    || observedEvidence.missingDigestCount > 0
    || observedEvidence.staleArtifactCount > 0
  ) {
    errors.push('V6_RELEASE_EVIDENCE_MANIFEST_ARTIFACT_INTEGRITY_REQUIRED');
  }
  if (observedEvidence.runtimeCivicToolExposureCount > 0 || observedEvidence.publishesRuntimeTools) {
    errors.push('V6_RELEASE_EVIDENCE_MANIFEST_RUNTIME_TOOL_EXPOSURE_FORBIDDEN');
  }
  if (
    observedEvidence.appliesWorldState
    || observedEvidence.mutatesWorldState
    || observedEvidence.approvesRelease
    || observedEvidence.enablesProduction
    || observedEvidence.productionEnabled
    || observedEvidence.publishesComms
    || observedEvidence.opensCanary
    || observedEvidence.executesValidation
    || observedEvidence.startsRuntimeMonitoring
  ) {
    errors.push('V6_RELEASE_EVIDENCE_MANIFEST_EXECUTION_FORBIDDEN');
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
    version: V6_RELEASE_EVIDENCE_MANIFEST_VERSION,
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
    executesValidation: false,
    startsRuntimeMonitoring: false,
    executionStatus: 'not_executable',
    targetMatrix,
    requirements: clone(requirements),
    observedEvidence,
    releaseGaps: [...REQUIRED_RELEASE_EVIDENCE_MANIFEST_GAPS]
  };
}

function assertV6ReleaseEvidenceManifestReportSafe(report = {}) {
  const errors = [];
  if (report.version !== V6_RELEASE_EVIDENCE_MANIFEST_VERSION) {
    errors.push('V6_RELEASE_EVIDENCE_MANIFEST_VERSION_REQUIRED');
  }
  if (report.status !== 'research_only') {
    errors.push('V6_RELEASE_EVIDENCE_MANIFEST_RESEARCH_ONLY_REQUIRED');
  }
  if (report.releaseReady !== false || report.productionReady !== false) {
    errors.push('V6_RELEASE_EVIDENCE_MANIFEST_RELEASE_READY_FORBIDDEN');
  }
  if (report.productionEnabled !== false) {
    errors.push('V6_RELEASE_EVIDENCE_MANIFEST_PRODUCTION_ENABLEMENT_FORBIDDEN');
  }
  if (report.runtimeExposed !== false || report.playerVisible !== false || report.normalGameplayExposure !== false) {
    errors.push('V6_RELEASE_EVIDENCE_MANIFEST_RUNTIME_HIDDEN_REQUIRED');
  }
  if (report.executionStatus !== 'not_executable') {
    errors.push('V6_RELEASE_EVIDENCE_MANIFEST_NON_EXECUTING_REQUIRED');
  }
  if (
    report.mutatesWorldState !== false
    || report.approvesRelease !== false
    || report.enablesProduction !== false
    || report.publishesComms !== false
    || report.opensCanary !== false
    || report.executesValidation !== false
    || report.startsRuntimeMonitoring !== false
  ) {
    errors.push('V6_RELEASE_EVIDENCE_MANIFEST_EXECUTION_FORBIDDEN');
  }
  if (report.exposesPrivateData !== false) {
    errors.push('V6_RELEASE_EVIDENCE_MANIFEST_PRIVATE_DATA_FORBIDDEN');
  }
  if (!Array.isArray(report.releaseGaps) || report.releaseGaps.length === 0) {
    errors.push('V6_RELEASE_EVIDENCE_MANIFEST_RELEASE_GAPS_REQUIRED');
  }
  if (Array.isArray(report.errors) && report.errors.length > 0) {
    errors.push('V6_RELEASE_EVIDENCE_MANIFEST_ERRORS_PRESENT');
  }
  const observedEvidence = report.observedEvidence || {};
  if (
    numberValue(observedEvidence.privateDataExposureCount) > 0
    || numberValue(observedEvidence.rawTraceLeakCount) > 0
    || numberValue(observedEvidence.unsignedArtifactCount) > 0
    || numberValue(observedEvidence.missingDigestCount) > 0
    || numberValue(observedEvidence.staleArtifactCount) > 0
    || numberValue(observedEvidence.runtimeCivicToolExposureCount) > 0
    || observedEvidence.appliesWorldState === true
    || observedEvidence.mutatesWorldState === true
    || observedEvidence.exposesPrivateData === true
    || observedEvidence.approvesRelease === true
    || observedEvidence.enablesProduction === true
    || observedEvidence.productionEnabled === true
    || observedEvidence.publishesComms === true
    || observedEvidence.opensCanary === true
    || observedEvidence.executesValidation === true
    || observedEvidence.startsRuntimeMonitoring === true
    || observedEvidence.publishesRuntimeTools === true
  ) {
    errors.push('V6_RELEASE_EVIDENCE_MANIFEST_EVIDENCE_SAFETY_REQUIRED');
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  REQUIRED_RELEASE_EVIDENCE_MANIFEST_GAPS,
  REQUIRED_RELEASE_EVIDENCE_MANIFEST_KEYS,
  V6_RELEASE_EVIDENCE_MANIFEST_REQUIREMENTS,
  V6_RELEASE_EVIDENCE_MANIFEST_VERSION,
  assertV6ReleaseEvidenceManifestReportSafe,
  buildV6ReleaseEvidenceManifestReport,
  inspectReleaseEvidenceManifestRequirements
};
