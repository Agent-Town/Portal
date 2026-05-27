const crypto = require('crypto');

const V6_RELEASE_CANDIDATE_TARGETS_VERSION = 'agent-town.v6.release_candidate_targets.v1';
const REQUIRED_RELEASE_CANDIDATE_TARGET_KEYS = [
  'release_candidate_environment',
  'command_transcript',
  'targeted_node_results',
  'split_playwright_results',
  'all_features_regression_results',
  'browser_console_error_budget',
  'playwright_trace_archive',
  'production_override_recheck',
  'runtime_tool_absence_recheck',
  'qa_owner_signoff',
  'security_product_signoff_packet',
  'blocker_exception_register',
  'controlled_release_handoff'
];
const REQUIRED_RELEASE_CANDIDATE_GAPS = [
  'release_candidate_environment_required',
  'command_transcript_required',
  'browser_console_budget_signoff_required',
  'playwright_trace_archive_required',
  'blocker_exception_register_required',
  'qa_owner_signoff_required',
  'security_product_signoff_required',
  'controlled_release_handoff_required'
];

const V6_RELEASE_CANDIDATE_TARGETS = [
  {
    key: 'release_candidate_environment',
    owner: 'release_engineering',
    requiredEvidence: 'Release-candidate evidence must name branch, commit, Node version, browser version, OS, feature flags, env overrides, and server/runtime mode.',
    currentEvidence: 'docs/release-evidence/V6_AGENT_CIVILIZATION_QA_BRANCH_REVIEW_RESPONSE_2026-05-28.md',
    releaseEvidenceRequired: 'release_candidate_environment_record'
  },
  {
    key: 'command_transcript',
    owner: 'qa_engineering',
    requiredEvidence: 'Release-candidate evidence must include exact command transcripts for Node suites, Playwright smokes, static checks, and production override checks.',
    currentEvidence: 'server/world_civilization/ci_validation_matrix_targets.js',
    releaseEvidenceRequired: 'release_candidate_command_transcript'
  },
  {
    key: 'targeted_node_results',
    owner: 'qa_engineering',
    requiredEvidence: 'Targeted V5/V6 Node contracts must include pass/fail output, duration, command, and commit mapping.',
    currentEvidence: 'tests/world_civilization_ci_validation_matrix_targets.test.js',
    releaseEvidenceRequired: 'targeted_node_results_packet'
  },
  {
    key: 'split_playwright_results',
    owner: 'qa_engineering',
    requiredEvidence: 'Split V5.0-V5.5 and V6 modal-boundary Playwright smokes must include per-slice pass/fail output and screenshot/trace references.',
    currentEvidence: 'e2e/236_world_grid_v50_region_prototype.spec.js',
    releaseEvidenceRequired: 'split_playwright_results_packet'
  },
  {
    key: 'all_features_regression_results',
    owner: 'qa_engineering',
    requiredEvidence: 'The all-features world-grid demo regression must be recorded as a secondary regression lane, not as the only browser evidence.',
    currentEvidence: 'e2e/242_world_grid_all_features_demo_regression.spec.js',
    releaseEvidenceRequired: 'all_features_regression_results_packet'
  },
  {
    key: 'browser_console_error_budget',
    owner: 'qa_engineering',
    requiredEvidence: 'Browser release-candidate runs must capture console/page errors, apply the approved budget, and link failures to blockers or explicit exceptions.',
    currentEvidence: 'server/world_civilization/validation_targets.js',
    releaseEvidenceRequired: 'browser_console_error_budget_signoff'
  },
  {
    key: 'playwright_trace_archive',
    owner: 'qa_engineering',
    requiredEvidence: 'Playwright traces, screenshots, videos, and server logs must be retained or linked for release-candidate failures and sampled passing critical flows.',
    currentEvidence: 'server/world_civilization/ci_validation_matrix_targets.js',
    releaseEvidenceRequired: 'playwright_trace_archive_record'
  },
  {
    key: 'production_override_recheck',
    owner: 'security_engineering',
    requiredEvidence: 'Release-candidate validation must recheck that production player query/header overrides cannot enable V6 or publish runtime civic tools.',
    currentEvidence: 'tests/world_grid_region.test.js',
    releaseEvidenceRequired: 'production_override_recheck_pass'
  },
  {
    key: 'runtime_tool_absence_recheck',
    owner: 'security_engineering',
    requiredEvidence: 'Runtime `/api/world/tools` must be captured during release-candidate validation and prove no `et.world.civic.*` tools are published.',
    currentEvidence: 'tests/world_civilization_tool_exposure_gate.test.js',
    releaseEvidenceRequired: 'runtime_tool_absence_recheck_pass'
  },
  {
    key: 'qa_owner_signoff',
    owner: 'qa_owner',
    requiredEvidence: 'QA owner must sign the release-candidate packet with unresolved blocker disposition and explicit acceptance or rejection.',
    currentEvidence: 'server/world_civilization/release_signoff_packet.js',
    releaseEvidenceRequired: 'qa_owner_release_candidate_signoff'
  },
  {
    key: 'security_product_signoff_packet',
    owner: 'security_product',
    requiredEvidence: 'Security and product signoff must reference the release-candidate packet, privacy review, abuse-case review, threat model, rollback plan, and support readiness.',
    currentEvidence: 'server/world_civilization/release_signoff_packet.js',
    releaseEvidenceRequired: 'security_product_release_candidate_signoff'
  },
  {
    key: 'blocker_exception_register',
    owner: 'release_manager',
    requiredEvidence: 'Every blocker, exception, owner, expiry, mitigation, and release decision must be recorded before controlled release.',
    currentEvidence: 'server/world_civilization/blocker_exception_register.js',
    releaseEvidenceRequired: 'blocker_exception_register'
  },
  {
    key: 'controlled_release_handoff',
    owner: 'release_manager',
    requiredEvidence: 'Release-candidate output must feed M18 controlled release with rollback/disable instructions, observability links, support owner, and go/no-go record.',
    currentEvidence: 'server/world_civilization/release_operations.js',
    releaseEvidenceRequired: 'controlled_release_handoff_packet'
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

function targetMatrixDigest(targets = V6_RELEASE_CANDIDATE_TARGETS) {
  return sha256(JSON.stringify(targets.map((target) => ({
    key: target.key,
    owner: target.owner,
    requiredEvidence: target.requiredEvidence,
    releaseEvidenceRequired: target.releaseEvidenceRequired
  }))));
}

function inspectReleaseCandidateTargets(targets = V6_RELEASE_CANDIDATE_TARGETS) {
  const safeTargets = Array.isArray(targets) ? targets : [];
  const targetKeys = safeTargets.map((target) => String(target.key || ''));
  const missingKeys = REQUIRED_RELEASE_CANDIDATE_TARGET_KEYS.filter((key) => !targetKeys.includes(key));
  const incompleteTargets = safeTargets.filter((target) => (
    !target.key
    || !target.owner
    || !target.requiredEvidence
    || !target.currentEvidence
    || !target.releaseEvidenceRequired
  )).map((target) => String(target.key || 'unknown'));

  return {
    ok: missingKeys.length === 0 && incompleteTargets.length === 0,
    requiredKeys: [...REQUIRED_RELEASE_CANDIDATE_TARGET_KEYS],
    targetKeys,
    missingKeys,
    incompleteTargets,
    targetCount: safeTargets.length,
    digest: targetMatrixDigest(safeTargets)
  };
}

function buildMissingReport(errors = []) {
  return {
    version: V6_RELEASE_CANDIDATE_TARGETS_VERSION,
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
    executesRelease: false,
    executesValidation: false,
    publishesRuntimeTools: false,
    executionStatus: 'not_executable',
    targetMatrix: inspectReleaseCandidateTargets([]),
    observedEvidence: {},
    releaseGaps: [...REQUIRED_RELEASE_CANDIDATE_GAPS]
  };
}

function buildV6ReleaseCandidateTargetReport({
  targets = V6_RELEASE_CANDIDATE_TARGETS,
  observed = {},
  source = 'runtime'
} = {}) {
  const targetMatrix = inspectReleaseCandidateTargets(targets);
  const observedEvidence = {
    releaseCandidateEnvironmentCount: numberValue(observed.releaseCandidateEnvironmentCount),
    commandTranscriptCount: numberValue(observed.commandTranscriptCount),
    targetedNodeResultsCount: numberValue(observed.targetedNodeResultsCount),
    splitPlaywrightResultsCount: numberValue(observed.splitPlaywrightResultsCount),
    allFeaturesRegressionResultsCount: numberValue(observed.allFeaturesRegressionResultsCount),
    browserConsoleErrorBudgetCount: numberValue(observed.browserConsoleErrorBudgetCount),
    playwrightTraceArchiveCount: numberValue(observed.playwrightTraceArchiveCount),
    productionOverrideRecheckCount: numberValue(observed.productionOverrideRecheckCount),
    runtimeToolAbsenceRecheckCount: numberValue(observed.runtimeToolAbsenceRecheckCount),
    qaOwnerSignoffCount: numberValue(observed.qaOwnerSignoffCount),
    securityProductSignoffPacketCount: numberValue(observed.securityProductSignoffPacketCount),
    blockerExceptionRegisterCount: numberValue(observed.blockerExceptionRegisterCount),
    controlledReleaseHandoffCount: numberValue(observed.controlledReleaseHandoffCount),
    privateDataExposureCount: numberValue(observed.privateDataExposureCount),
    playerVisibleReleaseSurfaceCount: numberValue(observed.playerVisibleReleaseSurfaceCount),
    runtimeCivicToolExposureCount: numberValue(observed.runtimeCivicToolExposureCount),
    appliesWorldState: observed.appliesWorldState === true,
    mutatesWorldState: observed.mutatesWorldState === true,
    exposesPrivateData: observed.exposesPrivateData === true,
    executesRelease: observed.executesRelease === true,
    executesValidation: observed.executesValidation === true,
    publishesRuntimeTools: observed.publishesRuntimeTools === true
  };
  const errors = [];
  if (targetMatrix.ok !== true) errors.push('V6_RELEASE_CANDIDATE_TARGET_MATRIX_INCOMPLETE');
  if (observedEvidence.releaseCandidateEnvironmentCount <= 0) errors.push('V6_RELEASE_CANDIDATE_ENVIRONMENT_REQUIRED');
  if (observedEvidence.commandTranscriptCount <= 0) errors.push('V6_RELEASE_CANDIDATE_COMMAND_TRANSCRIPT_REQUIRED');
  if (observedEvidence.targetedNodeResultsCount <= 0) errors.push('V6_RELEASE_CANDIDATE_NODE_RESULTS_REQUIRED');
  if (observedEvidence.splitPlaywrightResultsCount <= 0) errors.push('V6_RELEASE_CANDIDATE_SPLIT_PLAYWRIGHT_REQUIRED');
  if (observedEvidence.allFeaturesRegressionResultsCount <= 0) errors.push('V6_RELEASE_CANDIDATE_ALL_FEATURES_REQUIRED');
  if (observedEvidence.browserConsoleErrorBudgetCount <= 0) errors.push('V6_RELEASE_CANDIDATE_CONSOLE_BUDGET_REQUIRED');
  if (observedEvidence.playwrightTraceArchiveCount <= 0) errors.push('V6_RELEASE_CANDIDATE_TRACE_ARCHIVE_REQUIRED');
  if (observedEvidence.productionOverrideRecheckCount <= 0) errors.push('V6_RELEASE_CANDIDATE_PRODUCTION_OVERRIDE_REQUIRED');
  if (observedEvidence.runtimeToolAbsenceRecheckCount <= 0) errors.push('V6_RELEASE_CANDIDATE_RUNTIME_TOOL_ABSENCE_REQUIRED');
  if (observedEvidence.qaOwnerSignoffCount <= 0) errors.push('V6_RELEASE_CANDIDATE_QA_SIGNOFF_REQUIRED');
  if (observedEvidence.securityProductSignoffPacketCount <= 0) errors.push('V6_RELEASE_CANDIDATE_SECURITY_PRODUCT_SIGNOFF_REQUIRED');
  if (observedEvidence.blockerExceptionRegisterCount <= 0) errors.push('V6_RELEASE_CANDIDATE_BLOCKER_REGISTER_REQUIRED');
  if (observedEvidence.controlledReleaseHandoffCount <= 0) errors.push('V6_RELEASE_CANDIDATE_CONTROLLED_RELEASE_HANDOFF_REQUIRED');
  if (observedEvidence.privateDataExposureCount > 0 || observedEvidence.exposesPrivateData) {
    errors.push('V6_RELEASE_CANDIDATE_PRIVATE_DATA_FORBIDDEN');
  }
  if (observedEvidence.playerVisibleReleaseSurfaceCount > 0) errors.push('V6_RELEASE_CANDIDATE_PLAYER_SURFACE_FORBIDDEN');
  if (observedEvidence.runtimeCivicToolExposureCount > 0 || observedEvidence.publishesRuntimeTools) {
    errors.push('V6_RELEASE_CANDIDATE_RUNTIME_TOOL_EXPOSURE_FORBIDDEN');
  }
  if (
    observedEvidence.appliesWorldState
    || observedEvidence.mutatesWorldState
    || observedEvidence.executesRelease
    || observedEvidence.executesValidation
  ) {
    errors.push('V6_RELEASE_CANDIDATE_EXECUTION_FORBIDDEN');
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
    version: V6_RELEASE_CANDIDATE_TARGETS_VERSION,
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
    executesRelease: false,
    executesValidation: false,
    publishesRuntimeTools: false,
    executionStatus: 'not_executable',
    targetMatrix,
    targets: clone(targets),
    observedEvidence,
    releaseGaps: [...REQUIRED_RELEASE_CANDIDATE_GAPS]
  };
}

function assertV6ReleaseCandidateTargetReportSafe(report = {}) {
  const errors = [];
  if (report.version !== V6_RELEASE_CANDIDATE_TARGETS_VERSION) {
    errors.push('V6_RELEASE_CANDIDATE_TARGET_VERSION_REQUIRED');
  }
  if (report.status !== 'research_only') {
    errors.push('V6_RELEASE_CANDIDATE_TARGET_RESEARCH_ONLY_REQUIRED');
  }
  if (report.releaseReady !== false || report.productionReady !== false) {
    errors.push('V6_RELEASE_CANDIDATE_TARGET_RELEASE_READY_FORBIDDEN');
  }
  if (report.runtimeExposed !== false) {
    errors.push('V6_RELEASE_CANDIDATE_TARGET_RUNTIME_HIDDEN_REQUIRED');
  }
  if (report.playerVisible !== false || report.normalGameplayExposure !== false) {
    errors.push('V6_RELEASE_CANDIDATE_TARGET_PLAYER_HIDDEN_REQUIRED');
  }
  if (
    report.mutatesWorldState !== false
    || report.executesRelease !== false
    || report.executesValidation !== false
    || report.publishesRuntimeTools !== false
  ) {
    errors.push('V6_RELEASE_CANDIDATE_TARGET_EXECUTION_FORBIDDEN');
  }
  if (report.exposesPrivateData !== false) {
    errors.push('V6_RELEASE_CANDIDATE_TARGET_PRIVATE_DATA_FORBIDDEN');
  }
  if (report.executionStatus !== 'not_executable') {
    errors.push('V6_RELEASE_CANDIDATE_TARGET_NON_EXECUTING_REQUIRED');
  }
  if (
    !Array.isArray(report.releaseGaps)
    || REQUIRED_RELEASE_CANDIDATE_GAPS.some((gap) => !report.releaseGaps.includes(gap))
  ) {
    errors.push('V6_RELEASE_CANDIDATE_TARGET_RELEASE_GAPS_REQUIRED');
  }
  if (report.targetMatrix?.ok !== true || (report.targetMatrix?.missingKeys || []).length > 0) {
    errors.push('V6_RELEASE_CANDIDATE_TARGET_MATRIX_REQUIRED');
  }
  const evidence = report.observedEvidence || {};
  if (
    evidence.privateDataExposureCount > 0
    || evidence.playerVisibleReleaseSurfaceCount > 0
    || evidence.runtimeCivicToolExposureCount > 0
    || evidence.appliesWorldState === true
    || evidence.mutatesWorldState === true
    || evidence.exposesPrivateData === true
    || evidence.executesRelease === true
    || evidence.executesValidation === true
    || evidence.publishesRuntimeTools === true
  ) {
    errors.push('V6_RELEASE_CANDIDATE_TARGET_EVIDENCE_SAFETY_REQUIRED');
  }
  if (report.ok !== true || (Array.isArray(report.errors) && report.errors.length > 0)) {
    errors.push('V6_RELEASE_CANDIDATE_TARGET_ERRORS_PRESENT');
  }
  return {
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  REQUIRED_RELEASE_CANDIDATE_GAPS: [...REQUIRED_RELEASE_CANDIDATE_GAPS],
  REQUIRED_RELEASE_CANDIDATE_TARGET_KEYS: [...REQUIRED_RELEASE_CANDIDATE_TARGET_KEYS],
  V6_RELEASE_CANDIDATE_TARGETS: clone(V6_RELEASE_CANDIDATE_TARGETS),
  V6_RELEASE_CANDIDATE_TARGETS_VERSION,
  assertV6ReleaseCandidateTargetReportSafe,
  buildV6ReleaseCandidateTargetReport,
  inspectReleaseCandidateTargets
};
