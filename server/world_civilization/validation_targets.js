const crypto = require('crypto');

const V6_VALIDATION_TARGETS_VERSION = 'agent-town.v6.validation_targets.v1';
const REQUIRED_VALIDATION_TARGET_KEYS = [
  'targeted_node_suite',
  'split_playwright_smokes',
  'all_features_regression',
  'feature_override_safety',
  'runtime_tool_absence',
  'modal_lab_browser_coverage',
  'worker_observability_smoke',
  'route_store_restart_coverage',
  'mutation_security_regression',
  'release_candidate_run',
  'no_console_errors',
  'artifact_traceability'
];
const REQUIRED_VALIDATION_RELEASE_GAPS = [
  'release_candidate_run_required',
  'ci_validation_matrix_required',
  'browser_console_error_budget_required',
  'playwright_trace_retention_required',
  'qa_owner_signoff_required',
  'production_override_recheck_required'
];

const V6_VALIDATION_TARGETS = [
  {
    key: 'targeted_node_suite',
    surface: 'v6_node_contract_suite',
    requiredEvidence: 'Release validation must name and run the targeted V6 Node contract suite across schemas, security, persistence, governance, and release gates.',
    currentEvidence: 'tests/world_civilization_release_review.test.js',
    releaseEvidenceRequired: 'targeted_v6_node_suite_pass'
  },
  {
    key: 'split_playwright_smokes',
    surface: 'v5_v6_browser_smoke_slices',
    requiredEvidence: 'Release validation must include split V5.0-V5.5 Playwright smokes plus the V6 modal-boundary and player-route prerequisite smokes.',
    currentEvidence: 'docs/release-evidence/WORLD_GRID_V50_REGION_PROTOTYPE_EVIDENCE_2026-05-26.md',
    releaseEvidenceRequired: 'split_playwright_smoke_pass'
  },
  {
    key: 'all_features_regression',
    surface: 'world_grid_all_features_demo',
    requiredEvidence: 'The existing all-features world-grid demo regression must pass as a regression path, not as the only validation surface.',
    currentEvidence: 'e2e/242_world_grid_all_features_demo_regression.spec.js',
    releaseEvidenceRequired: 'all_features_regression_pass'
  },
  {
    key: 'feature_override_safety',
    surface: 'production_feature_override_denial',
    requiredEvidence: 'Production browser query/header overrides must not enable V6 or publish `et.world.civic.*` tools before controlled release.',
    currentEvidence: 'tests/world_grid_region.test.js',
    releaseEvidenceRequired: 'production_override_safety_pass'
  },
  {
    key: 'runtime_tool_absence',
    surface: 'api_world_tools_runtime_manifest',
    requiredEvidence: 'Runtime `/api/world/tools` must remain the source of truth and omit V6 civic tools until M6/M17/M18 close.',
    currentEvidence: 'server/world_civilization/tool_exposure_gate.js',
    releaseEvidenceRequired: 'runtime_tool_absence_browser_smoke'
  },
  {
    key: 'modal_lab_browser_coverage',
    surface: 'internal_v6_lab_modal',
    requiredEvidence: 'Internal lab coverage must prove standalone route denial, normal gameplay absence, modal launch, 390/768/1280 screenshots, and keyboard focus containment.',
    currentEvidence: 'e2e/244_v6_lab_modal_boundary.spec.js',
    releaseEvidenceRequired: 'modal_lab_browser_coverage_pass'
  },
  {
    key: 'worker_observability_smoke',
    surface: 'openclaw_worker_observability',
    requiredEvidence: 'Worker Tools, Skill Context, Worker Traffic, Brain, and Session Context observability must be present for internal V6 validation without leaking private data.',
    currentEvidence: 'server/world_civilization/worker_runtime_registration.js',
    releaseEvidenceRequired: 'worker_observability_browser_smoke'
  },
  {
    key: 'route_store_restart_coverage',
    surface: 'v6_route_store_persistence',
    requiredEvidence: 'Proposal, vote, reputation, moderation, effect, delegation, institution, public works, and audit stores need restart/replay coverage before release.',
    currentEvidence: 'tests/world_civilization_proposal_vote_process_restart.test.js',
    releaseEvidenceRequired: 'route_store_restart_validation_pass'
  },
  {
    key: 'mutation_security_regression',
    surface: 'm5_v6_mutation_security',
    requiredEvidence: 'Validation must re-run mutation security, session-auth targets, delegated-agent proof, idempotency, rate-limit, and CSRF regression coverage.',
    currentEvidence: 'tests/world_civilization_mutation_security.test.js',
    releaseEvidenceRequired: 'mutation_security_regression_pass'
  },
  {
    key: 'release_candidate_run',
    surface: 'm17_release_candidate_validation',
    requiredEvidence: 'Release-candidate validation must record exact commands, environment, commit, branch, browser, screenshots/traces, and pass/fail output.',
    currentEvidence: 'docs/security/V6_AGENT_CIVILIZATION_RELEASE_REVIEW.md',
    releaseEvidenceRequired: 'release_candidate_validation_packet'
  },
  {
    key: 'no_console_errors',
    surface: 'browser_console_health',
    requiredEvidence: 'Release browser validation must capture console/page errors and keep normal gameplay plus internal lab flows within the approved error budget.',
    currentEvidence: 'specs/release-gates/v60_agent_civilization_readiness_gate.md',
    releaseEvidenceRequired: 'browser_console_error_report'
  },
  {
    key: 'artifact_traceability',
    surface: 'qa_release_artifact_trace',
    requiredEvidence: 'QA evidence must trace each required command/test/screenshot/log to the commit, branch, owner, and release gate it satisfies.',
    currentEvidence: 'docs/release-evidence/V6_AGENT_CIVILIZATION_QA_BRANCH_REVIEW_RESPONSE_2026-05-28.md',
    releaseEvidenceRequired: 'qa_artifact_traceability_record'
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

function targetMatrixDigest(targets = V6_VALIDATION_TARGETS) {
  return sha256(JSON.stringify(targets.map((target) => ({
    key: target.key,
    surface: target.surface,
    requiredEvidence: target.requiredEvidence,
    releaseEvidenceRequired: target.releaseEvidenceRequired
  }))));
}

function inspectValidationTargets(targets = V6_VALIDATION_TARGETS) {
  const safeTargets = Array.isArray(targets) ? targets : [];
  const targetKeys = safeTargets.map((target) => String(target.key || ''));
  const missingKeys = REQUIRED_VALIDATION_TARGET_KEYS.filter((key) => !targetKeys.includes(key));
  const incompleteTargets = safeTargets.filter((target) => (
    !target.key
    || !target.surface
    || !target.requiredEvidence
    || !target.currentEvidence
    || !target.releaseEvidenceRequired
  )).map((target) => String(target.key || 'unknown'));

  return {
    ok: missingKeys.length === 0 && incompleteTargets.length === 0,
    requiredKeys: [...REQUIRED_VALIDATION_TARGET_KEYS],
    targetKeys,
    missingKeys,
    incompleteTargets,
    targetCount: safeTargets.length,
    digest: targetMatrixDigest(safeTargets)
  };
}

function buildMissingReport(errors = []) {
  return {
    version: V6_VALIDATION_TARGETS_VERSION,
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
    executesValidation: false,
    publishesRuntimeTools: false,
    executionStatus: 'not_executable',
    targetMatrix: inspectValidationTargets([]),
    observedEvidence: {},
    releaseGaps: [...REQUIRED_VALIDATION_RELEASE_GAPS]
  };
}

function buildV6ValidationTargetReport({
  targets = V6_VALIDATION_TARGETS,
  observed = {},
  source = 'runtime'
} = {}) {
  const targetMatrix = inspectValidationTargets(targets);
  const observedEvidence = {
    targetedNodeSuiteProbeCount: numberValue(observed.targetedNodeSuiteProbeCount),
    splitPlaywrightSmokeProbeCount: numberValue(observed.splitPlaywrightSmokeProbeCount),
    allFeaturesRegressionProbeCount: numberValue(observed.allFeaturesRegressionProbeCount),
    featureOverrideSafetyProbeCount: numberValue(observed.featureOverrideSafetyProbeCount),
    runtimeToolAbsenceProbeCount: numberValue(observed.runtimeToolAbsenceProbeCount),
    modalLabBrowserProbeCount: numberValue(observed.modalLabBrowserProbeCount),
    workerObservabilityProbeCount: numberValue(observed.workerObservabilityProbeCount),
    routeStoreRestartProbeCount: numberValue(observed.routeStoreRestartProbeCount),
    mutationSecurityRegressionProbeCount: numberValue(observed.mutationSecurityRegressionProbeCount),
    releaseCandidateRunProbeCount: numberValue(observed.releaseCandidateRunProbeCount),
    noConsoleErrorsProbeCount: numberValue(observed.noConsoleErrorsProbeCount),
    artifactTraceabilityProbeCount: numberValue(observed.artifactTraceabilityProbeCount),
    privateDataExposureCount: numberValue(observed.privateDataExposureCount),
    playerVisibleValidationSurfaceCount: numberValue(observed.playerVisibleValidationSurfaceCount),
    runtimeCivicToolExposureCount: numberValue(observed.runtimeCivicToolExposureCount),
    appliesWorldState: observed.appliesWorldState === true,
    mutatesWorldState: observed.mutatesWorldState === true,
    exposesPrivateData: observed.exposesPrivateData === true,
    executesValidation: observed.executesValidation === true,
    publishesRuntimeTools: observed.publishesRuntimeTools === true
  };
  const errors = [];
  if (targetMatrix.ok !== true) errors.push('V6_VALIDATION_TARGET_MATRIX_INCOMPLETE');
  if (observedEvidence.targetedNodeSuiteProbeCount <= 0) errors.push('V6_VALIDATION_NODE_SUITE_PROBE_REQUIRED');
  if (observedEvidence.splitPlaywrightSmokeProbeCount <= 0) errors.push('V6_VALIDATION_SPLIT_PLAYWRIGHT_PROBE_REQUIRED');
  if (observedEvidence.allFeaturesRegressionProbeCount <= 0) errors.push('V6_VALIDATION_ALL_FEATURES_PROBE_REQUIRED');
  if (observedEvidence.featureOverrideSafetyProbeCount <= 0) errors.push('V6_VALIDATION_FEATURE_OVERRIDE_PROBE_REQUIRED');
  if (observedEvidence.runtimeToolAbsenceProbeCount <= 0) errors.push('V6_VALIDATION_RUNTIME_TOOL_ABSENCE_PROBE_REQUIRED');
  if (observedEvidence.modalLabBrowserProbeCount <= 0) errors.push('V6_VALIDATION_MODAL_LAB_BROWSER_PROBE_REQUIRED');
  if (observedEvidence.workerObservabilityProbeCount <= 0) errors.push('V6_VALIDATION_WORKER_OBSERVABILITY_PROBE_REQUIRED');
  if (observedEvidence.routeStoreRestartProbeCount <= 0) errors.push('V6_VALIDATION_ROUTE_STORE_RESTART_PROBE_REQUIRED');
  if (observedEvidence.mutationSecurityRegressionProbeCount <= 0) errors.push('V6_VALIDATION_MUTATION_SECURITY_PROBE_REQUIRED');
  if (observedEvidence.releaseCandidateRunProbeCount <= 0) errors.push('V6_VALIDATION_RELEASE_CANDIDATE_PROBE_REQUIRED');
  if (observedEvidence.noConsoleErrorsProbeCount <= 0) errors.push('V6_VALIDATION_CONSOLE_ERROR_PROBE_REQUIRED');
  if (observedEvidence.artifactTraceabilityProbeCount <= 0) errors.push('V6_VALIDATION_ARTIFACT_TRACEABILITY_PROBE_REQUIRED');
  if (observedEvidence.privateDataExposureCount > 0 || observedEvidence.exposesPrivateData) {
    errors.push('V6_VALIDATION_PRIVATE_DATA_FORBIDDEN');
  }
  if (observedEvidence.playerVisibleValidationSurfaceCount > 0) errors.push('V6_VALIDATION_PLAYER_SURFACE_FORBIDDEN');
  if (observedEvidence.runtimeCivicToolExposureCount > 0 || observedEvidence.publishesRuntimeTools) {
    errors.push('V6_VALIDATION_RUNTIME_TOOL_EXPOSURE_FORBIDDEN');
  }
  if (observedEvidence.appliesWorldState || observedEvidence.mutatesWorldState || observedEvidence.executesValidation) {
    errors.push('V6_VALIDATION_EXECUTION_FORBIDDEN');
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
    version: V6_VALIDATION_TARGETS_VERSION,
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
    executesValidation: false,
    publishesRuntimeTools: false,
    executionStatus: 'not_executable',
    targetMatrix,
    targets: clone(targets),
    observedEvidence,
    releaseGaps: [...REQUIRED_VALIDATION_RELEASE_GAPS]
  };
}

function assertV6ValidationTargetReportSafe(report = {}) {
  const errors = [];
  if (report.version !== V6_VALIDATION_TARGETS_VERSION) {
    errors.push('V6_VALIDATION_TARGET_VERSION_REQUIRED');
  }
  if (report.status !== 'research_only') {
    errors.push('V6_VALIDATION_TARGET_RESEARCH_ONLY_REQUIRED');
  }
  if (report.releaseReady !== false || report.productionReady !== false) {
    errors.push('V6_VALIDATION_TARGET_RELEASE_READY_FORBIDDEN');
  }
  if (report.runtimeExposed !== false) {
    errors.push('V6_VALIDATION_TARGET_RUNTIME_HIDDEN_REQUIRED');
  }
  if (report.playerVisible !== false || report.normalGameplayExposure !== false) {
    errors.push('V6_VALIDATION_TARGET_PLAYER_HIDDEN_REQUIRED');
  }
  if (report.mutatesWorldState !== false || report.executesValidation !== false || report.publishesRuntimeTools !== false) {
    errors.push('V6_VALIDATION_TARGET_EXECUTION_FORBIDDEN');
  }
  if (report.exposesPrivateData !== false) {
    errors.push('V6_VALIDATION_TARGET_PRIVATE_DATA_FORBIDDEN');
  }
  if (report.executionStatus !== 'not_executable') {
    errors.push('V6_VALIDATION_TARGET_NON_EXECUTING_REQUIRED');
  }
  if (
    !Array.isArray(report.releaseGaps)
    || REQUIRED_VALIDATION_RELEASE_GAPS.some((gap) => !report.releaseGaps.includes(gap))
  ) {
    errors.push('V6_VALIDATION_TARGET_RELEASE_GAPS_REQUIRED');
  }
  if (report.targetMatrix?.ok !== true || (report.targetMatrix?.missingKeys || []).length > 0) {
    errors.push('V6_VALIDATION_TARGET_MATRIX_REQUIRED');
  }
  const evidence = report.observedEvidence || {};
  if (
    evidence.privateDataExposureCount > 0
    || evidence.playerVisibleValidationSurfaceCount > 0
    || evidence.runtimeCivicToolExposureCount > 0
    || evidence.appliesWorldState === true
    || evidence.mutatesWorldState === true
    || evidence.exposesPrivateData === true
    || evidence.executesValidation === true
    || evidence.publishesRuntimeTools === true
  ) {
    errors.push('V6_VALIDATION_TARGET_EVIDENCE_SAFETY_REQUIRED');
  }
  if (report.ok !== true || (Array.isArray(report.errors) && report.errors.length > 0)) {
    errors.push('V6_VALIDATION_TARGET_ERRORS_PRESENT');
  }
  return {
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  REQUIRED_VALIDATION_RELEASE_GAPS: [...REQUIRED_VALIDATION_RELEASE_GAPS],
  REQUIRED_VALIDATION_TARGET_KEYS: [...REQUIRED_VALIDATION_TARGET_KEYS],
  V6_VALIDATION_TARGETS: clone(V6_VALIDATION_TARGETS),
  V6_VALIDATION_TARGETS_VERSION,
  assertV6ValidationTargetReportSafe,
  buildV6ValidationTargetReport,
  inspectValidationTargets
};
