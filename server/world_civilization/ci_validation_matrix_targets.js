const crypto = require('crypto');

const V6_CI_VALIDATION_MATRIX_TARGETS_VERSION = 'agent-town.v6.ci_validation_matrix_targets.v1';
const REQUIRED_CI_VALIDATION_MATRIX_KEYS = [
  'targeted_node_contracts',
  'split_playwright_smokes',
  'all_features_regression',
  'v6_modal_lab_browser_smoke',
  'feature_override_production_safety',
  'runtime_tool_absence',
  'worker_observability_browser_smoke',
  'route_store_restart_suite',
  'mutation_security_suite',
  'diff_and_static_checks',
  'console_error_budget',
  'trace_artifact_retention',
  'qa_release_packet'
];
const REQUIRED_CI_VALIDATION_RELEASE_GAPS = [
  'ci_runner_configuration_required',
  'release_candidate_environment_required',
  'playwright_trace_archive_required',
  'browser_console_budget_signoff_required',
  'qa_owner_approval_required',
  'production_override_recheck_required'
];

const V6_CI_VALIDATION_MATRIX_TARGETS = [
  {
    key: 'targeted_node_contracts',
    lane: 'node_contracts',
    command: 'node --test tests/world_civilization_*.test.js tests/world_grid_*_persistence.test.js',
    requiredEvidence: 'Release CI must run the targeted V6/V5 Node contract suites that cover schemas, security gates, persistence, replay, and validation targets.',
    currentEvidence: 'tests/world_civilization_validation_targets.test.js',
    releaseEvidenceRequired: 'targeted_node_contracts_ci_pass'
  },
  {
    key: 'split_playwright_smokes',
    lane: 'browser_smokes',
    command: 'npx playwright test e2e/236_world_grid_v50_region_prototype.spec.js e2e/237_world_grid_v51_claims_prototype.spec.js e2e/238_world_grid_v52_public_presence_prototype.spec.js e2e/239_world_grid_v53_service_redaction_prototype.spec.js e2e/240_world_grid_v54_event_accounting_prototype.spec.js e2e/241_world_grid_v55_sandbox_prototype.spec.js',
    requiredEvidence: 'Release CI must preserve the split V5.0-V5.5 browser smoke lanes so failures are attributable by slice.',
    currentEvidence: 'e2e/236_world_grid_v50_region_prototype.spec.js',
    releaseEvidenceRequired: 'split_playwright_smokes_ci_pass'
  },
  {
    key: 'all_features_regression',
    lane: 'browser_regression',
    command: 'npx playwright test e2e/242_world_grid_all_features_demo_regression.spec.js',
    requiredEvidence: 'The all-features world-grid demo remains a regression lane, but not the only browser validation lane.',
    currentEvidence: 'e2e/242_world_grid_all_features_demo_regression.spec.js',
    releaseEvidenceRequired: 'all_features_regression_ci_pass'
  },
  {
    key: 'v6_modal_lab_browser_smoke',
    lane: 'internal_v6_browser_smoke',
    command: 'npx playwright test e2e/244_v6_lab_modal_boundary.spec.js && PW_NODE_ENV=production FEATURE_WORLD_GRID_V50_REGION=1 npx playwright test e2e/247_v6_production_override_browser_smoke.spec.js',
    requiredEvidence: 'Internal V6 lab validation must prove modal-only launch, standalone denial, focus containment, screenshots, production player override denial, and runtime civic-tool absence.',
    currentEvidence: 'e2e/244_v6_lab_modal_boundary.spec.js, e2e/247_v6_production_override_browser_smoke.spec.js',
    releaseEvidenceRequired: 'v6_modal_lab_browser_ci_pass'
  },
  {
    key: 'feature_override_production_safety',
    lane: 'feature_flag_security',
    command: 'node --test tests/world_grid_region.test.js tests/world_civilization_tool_exposure_gate.test.js && PW_NODE_ENV=production FEATURE_WORLD_GRID_V50_REGION=1 npx playwright test e2e/247_v6_production_override_browser_smoke.spec.js',
    requiredEvidence: 'Production query/header overrides must not enable V6, publish runtime civic tools, or expose the V6 lab in a production browser server.',
    currentEvidence: 'tests/world_grid_region.test.js, e2e/247_v6_production_override_browser_smoke.spec.js',
    releaseEvidenceRequired: 'production_override_safety_ci_pass'
  },
  {
    key: 'runtime_tool_absence',
    lane: 'runtime_manifest_security',
    command: 'node --test tests/world_civilization_tool_exposure_gate.test.js tests/world_civilization_worker_runtime_registration.test.js && PW_NODE_ENV=production FEATURE_WORLD_GRID_V50_REGION=1 npx playwright test e2e/247_v6_production_override_browser_smoke.spec.js',
    requiredEvidence: 'Runtime `/api/world/tools` must remain the source of truth and omit `et.world.civic.*` tools until release gates close.',
    currentEvidence: 'tests/world_civilization_tool_exposure_gate.test.js, e2e/247_v6_production_override_browser_smoke.spec.js',
    releaseEvidenceRequired: 'runtime_tool_absence_ci_pass'
  },
  {
    key: 'worker_observability_browser_smoke',
    lane: 'worker_observability',
    command: 'npx playwright test e2e/53_agent_panel_global_presence.spec.js e2e/244_v6_lab_modal_boundary.spec.js',
    requiredEvidence: 'Worker Tools, Skill Context, Worker Traffic, Brain, and Session Context must remain observable for internal validation without leaking private data.',
    currentEvidence: 'tests/world_civilization_worker_runtime_registration.test.js',
    releaseEvidenceRequired: 'worker_observability_browser_ci_pass'
  },
  {
    key: 'route_store_restart_suite',
    lane: 'restart_persistence',
    command: 'node --test tests/world_civilization_process_restart.test.js tests/world_civilization_proposal_vote_process_restart.test.js tests/world_civilization_reputation_moderation_process_restart.test.js tests/world_civilization_effect_process_restart.test.js tests/world_civilization_delegation_process_restart.test.js tests/world_civilization_institution_process_restart.test.js tests/world_civilization_public_works_process_restart.test.js',
    requiredEvidence: 'Every current civic store restart/replay probe must run as a release lane without relying on process-local state.',
    currentEvidence: 'tests/world_civilization_proposal_vote_process_restart.test.js',
    releaseEvidenceRequired: 'route_store_restart_ci_pass'
  },
  {
    key: 'mutation_security_suite',
    lane: 'mutation_security',
    command: 'node --test tests/world_civilization_mutation_security.test.js tests/world_civilization_session_auth_targets.test.js tests/world_grid_csrf_persistence.test.js tests/world_grid_idempotency_persistence.test.js tests/world_grid_rate_limit_persistence.test.js',
    requiredEvidence: 'Mutation security CI must rerun V6 session/auth targets and V5 CSRF, idempotency, rate-limit, and delegated-agent proof coverage.',
    currentEvidence: 'tests/world_civilization_mutation_security.test.js',
    releaseEvidenceRequired: 'mutation_security_ci_pass'
  },
  {
    key: 'diff_and_static_checks',
    lane: 'static_integrity',
    command: 'git diff --check && node --check server/world_civilization/*.js server/world_grid/*.js',
    requiredEvidence: 'Release packets must include whitespace/static syntax checks for changed server surfaces.',
    currentEvidence: 'tests/roadmap_feedback_compliance.test.js',
    releaseEvidenceRequired: 'diff_static_checks_pass'
  },
  {
    key: 'console_error_budget',
    lane: 'browser_console_health',
    command: 'npx playwright test --reporter=line e2e/236_world_grid_v50_region_prototype.spec.js e2e/244_v6_lab_modal_boundary.spec.js',
    requiredEvidence: 'Browser release validation must capture console/page errors and prove the approved error budget for normal gameplay plus the internal V6 lab.',
    currentEvidence: 'server/world_civilization/validation_targets.js',
    releaseEvidenceRequired: 'browser_console_error_budget_report'
  },
  {
    key: 'trace_artifact_retention',
    lane: 'artifact_retention',
    command: 'npx playwright test --trace=retain-on-failure e2e/236_world_grid_v50_region_prototype.spec.js e2e/244_v6_lab_modal_boundary.spec.js',
    requiredEvidence: 'Playwright trace, screenshot, and log artifacts must be retained or linked in the release packet for failed release-candidate runs.',
    currentEvidence: 'docs/security/V6_AGENT_CIVILIZATION_RELEASE_REVIEW.md',
    releaseEvidenceRequired: 'playwright_trace_retention_record'
  },
  {
    key: 'qa_release_packet',
    lane: 'qa_release_evidence',
    command: 'manual QA release packet assembly',
    requiredEvidence: 'QA evidence must map every command, environment, commit, artifact, owner, and pass/fail output to the release gate it satisfies.',
    currentEvidence: 'docs/release-evidence/V6_AGENT_CIVILIZATION_QA_BRANCH_REVIEW_RESPONSE_2026-05-28.md',
    releaseEvidenceRequired: 'qa_release_packet_approval'
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

function targetMatrixDigest(targets = V6_CI_VALIDATION_MATRIX_TARGETS) {
  return sha256(JSON.stringify(targets.map((target) => ({
    key: target.key,
    lane: target.lane,
    command: target.command,
    requiredEvidence: target.requiredEvidence,
    releaseEvidenceRequired: target.releaseEvidenceRequired
  }))));
}

function inspectCiValidationMatrixTargets(targets = V6_CI_VALIDATION_MATRIX_TARGETS) {
  const safeTargets = Array.isArray(targets) ? targets : [];
  const targetKeys = safeTargets.map((target) => String(target.key || ''));
  const missingKeys = REQUIRED_CI_VALIDATION_MATRIX_KEYS.filter((key) => !targetKeys.includes(key));
  const incompleteTargets = safeTargets.filter((target) => (
    !target.key
    || !target.lane
    || !target.command
    || !target.requiredEvidence
    || !target.currentEvidence
    || !target.releaseEvidenceRequired
  )).map((target) => String(target.key || 'unknown'));

  return {
    ok: missingKeys.length === 0 && incompleteTargets.length === 0,
    requiredKeys: [...REQUIRED_CI_VALIDATION_MATRIX_KEYS],
    targetKeys,
    missingKeys,
    incompleteTargets,
    targetCount: safeTargets.length,
    digest: targetMatrixDigest(safeTargets)
  };
}

function buildMissingReport(errors = []) {
  return {
    version: V6_CI_VALIDATION_MATRIX_TARGETS_VERSION,
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
    executesCi: false,
    executesValidation: false,
    publishesRuntimeTools: false,
    executionStatus: 'not_executable',
    targetMatrix: inspectCiValidationMatrixTargets([]),
    observedEvidence: {},
    releaseGaps: [...REQUIRED_CI_VALIDATION_RELEASE_GAPS]
  };
}

function buildV6CiValidationMatrixReport({
  targets = V6_CI_VALIDATION_MATRIX_TARGETS,
  observed = {},
  source = 'runtime'
} = {}) {
  const targetMatrix = inspectCiValidationMatrixTargets(targets);
  const observedEvidence = {
    targetedNodeContractsCount: numberValue(observed.targetedNodeContractsCount),
    splitPlaywrightSmokesCount: numberValue(observed.splitPlaywrightSmokesCount),
    allFeaturesRegressionCount: numberValue(observed.allFeaturesRegressionCount),
    v6ModalLabBrowserSmokeCount: numberValue(observed.v6ModalLabBrowserSmokeCount),
    featureOverrideProductionSafetyCount: numberValue(observed.featureOverrideProductionSafetyCount),
    runtimeToolAbsenceCount: numberValue(observed.runtimeToolAbsenceCount),
    workerObservabilityBrowserSmokeCount: numberValue(observed.workerObservabilityBrowserSmokeCount),
    routeStoreRestartSuiteCount: numberValue(observed.routeStoreRestartSuiteCount),
    mutationSecuritySuiteCount: numberValue(observed.mutationSecuritySuiteCount),
    diffAndStaticChecksCount: numberValue(observed.diffAndStaticChecksCount),
    consoleErrorBudgetCount: numberValue(observed.consoleErrorBudgetCount),
    traceArtifactRetentionCount: numberValue(observed.traceArtifactRetentionCount),
    qaReleasePacketCount: numberValue(observed.qaReleasePacketCount),
    privateDataExposureCount: numberValue(observed.privateDataExposureCount),
    playerVisibleCiSurfaceCount: numberValue(observed.playerVisibleCiSurfaceCount),
    runtimeCivicToolExposureCount: numberValue(observed.runtimeCivicToolExposureCount),
    appliesWorldState: observed.appliesWorldState === true,
    mutatesWorldState: observed.mutatesWorldState === true,
    exposesPrivateData: observed.exposesPrivateData === true,
    executesCi: observed.executesCi === true,
    executesValidation: observed.executesValidation === true,
    publishesRuntimeTools: observed.publishesRuntimeTools === true
  };
  const errors = [];
  if (targetMatrix.ok !== true) errors.push('V6_CI_VALIDATION_MATRIX_INCOMPLETE');
  if (observedEvidence.targetedNodeContractsCount <= 0) errors.push('V6_CI_VALIDATION_NODE_CONTRACTS_REQUIRED');
  if (observedEvidence.splitPlaywrightSmokesCount <= 0) errors.push('V6_CI_VALIDATION_SPLIT_PLAYWRIGHT_REQUIRED');
  if (observedEvidence.allFeaturesRegressionCount <= 0) errors.push('V6_CI_VALIDATION_ALL_FEATURES_REQUIRED');
  if (observedEvidence.v6ModalLabBrowserSmokeCount <= 0) errors.push('V6_CI_VALIDATION_MODAL_LAB_BROWSER_REQUIRED');
  if (observedEvidence.featureOverrideProductionSafetyCount <= 0) errors.push('V6_CI_VALIDATION_FEATURE_OVERRIDE_REQUIRED');
  if (observedEvidence.runtimeToolAbsenceCount <= 0) errors.push('V6_CI_VALIDATION_RUNTIME_TOOL_ABSENCE_REQUIRED');
  if (observedEvidence.workerObservabilityBrowserSmokeCount <= 0) errors.push('V6_CI_VALIDATION_WORKER_OBSERVABILITY_REQUIRED');
  if (observedEvidence.routeStoreRestartSuiteCount <= 0) errors.push('V6_CI_VALIDATION_ROUTE_STORE_RESTART_REQUIRED');
  if (observedEvidence.mutationSecuritySuiteCount <= 0) errors.push('V6_CI_VALIDATION_MUTATION_SECURITY_REQUIRED');
  if (observedEvidence.diffAndStaticChecksCount <= 0) errors.push('V6_CI_VALIDATION_DIFF_STATIC_REQUIRED');
  if (observedEvidence.consoleErrorBudgetCount <= 0) errors.push('V6_CI_VALIDATION_CONSOLE_BUDGET_REQUIRED');
  if (observedEvidence.traceArtifactRetentionCount <= 0) errors.push('V6_CI_VALIDATION_TRACE_RETENTION_REQUIRED');
  if (observedEvidence.qaReleasePacketCount <= 0) errors.push('V6_CI_VALIDATION_QA_PACKET_REQUIRED');
  if (observedEvidence.privateDataExposureCount > 0 || observedEvidence.exposesPrivateData) {
    errors.push('V6_CI_VALIDATION_PRIVATE_DATA_FORBIDDEN');
  }
  if (observedEvidence.playerVisibleCiSurfaceCount > 0) errors.push('V6_CI_VALIDATION_PLAYER_SURFACE_FORBIDDEN');
  if (observedEvidence.runtimeCivicToolExposureCount > 0 || observedEvidence.publishesRuntimeTools) {
    errors.push('V6_CI_VALIDATION_RUNTIME_TOOL_EXPOSURE_FORBIDDEN');
  }
  if (
    observedEvidence.appliesWorldState
    || observedEvidence.mutatesWorldState
    || observedEvidence.executesCi
    || observedEvidence.executesValidation
  ) {
    errors.push('V6_CI_VALIDATION_EXECUTION_FORBIDDEN');
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
    version: V6_CI_VALIDATION_MATRIX_TARGETS_VERSION,
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
    executesCi: false,
    executesValidation: false,
    publishesRuntimeTools: false,
    executionStatus: 'not_executable',
    targetMatrix,
    targets: clone(targets),
    observedEvidence,
    releaseGaps: [...REQUIRED_CI_VALIDATION_RELEASE_GAPS]
  };
}

function assertV6CiValidationMatrixReportSafe(report = {}) {
  const errors = [];
  if (report.version !== V6_CI_VALIDATION_MATRIX_TARGETS_VERSION) {
    errors.push('V6_CI_VALIDATION_MATRIX_VERSION_REQUIRED');
  }
  if (report.status !== 'research_only') {
    errors.push('V6_CI_VALIDATION_MATRIX_RESEARCH_ONLY_REQUIRED');
  }
  if (report.releaseReady !== false || report.productionReady !== false) {
    errors.push('V6_CI_VALIDATION_MATRIX_RELEASE_READY_FORBIDDEN');
  }
  if (report.runtimeExposed !== false) {
    errors.push('V6_CI_VALIDATION_MATRIX_RUNTIME_HIDDEN_REQUIRED');
  }
  if (report.playerVisible !== false || report.normalGameplayExposure !== false) {
    errors.push('V6_CI_VALIDATION_MATRIX_PLAYER_HIDDEN_REQUIRED');
  }
  if (
    report.mutatesWorldState !== false
    || report.executesCi !== false
    || report.executesValidation !== false
    || report.publishesRuntimeTools !== false
  ) {
    errors.push('V6_CI_VALIDATION_MATRIX_EXECUTION_FORBIDDEN');
  }
  if (report.exposesPrivateData !== false) {
    errors.push('V6_CI_VALIDATION_MATRIX_PRIVATE_DATA_FORBIDDEN');
  }
  if (report.executionStatus !== 'not_executable') {
    errors.push('V6_CI_VALIDATION_MATRIX_NON_EXECUTING_REQUIRED');
  }
  if (
    !Array.isArray(report.releaseGaps)
    || REQUIRED_CI_VALIDATION_RELEASE_GAPS.some((gap) => !report.releaseGaps.includes(gap))
  ) {
    errors.push('V6_CI_VALIDATION_MATRIX_RELEASE_GAPS_REQUIRED');
  }
  if (report.targetMatrix?.ok !== true || (report.targetMatrix?.missingKeys || []).length > 0) {
    errors.push('V6_CI_VALIDATION_MATRIX_TARGETS_REQUIRED');
  }
  const evidence = report.observedEvidence || {};
  if (
    evidence.privateDataExposureCount > 0
    || evidence.playerVisibleCiSurfaceCount > 0
    || evidence.runtimeCivicToolExposureCount > 0
    || evidence.appliesWorldState === true
    || evidence.mutatesWorldState === true
    || evidence.exposesPrivateData === true
    || evidence.executesCi === true
    || evidence.executesValidation === true
    || evidence.publishesRuntimeTools === true
  ) {
    errors.push('V6_CI_VALIDATION_MATRIX_EVIDENCE_SAFETY_REQUIRED');
  }
  if (report.ok !== true || (Array.isArray(report.errors) && report.errors.length > 0)) {
    errors.push('V6_CI_VALIDATION_MATRIX_ERRORS_PRESENT');
  }
  return {
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  REQUIRED_CI_VALIDATION_MATRIX_KEYS: [...REQUIRED_CI_VALIDATION_MATRIX_KEYS],
  REQUIRED_CI_VALIDATION_RELEASE_GAPS: [...REQUIRED_CI_VALIDATION_RELEASE_GAPS],
  V6_CI_VALIDATION_MATRIX_TARGETS: clone(V6_CI_VALIDATION_MATRIX_TARGETS),
  V6_CI_VALIDATION_MATRIX_TARGETS_VERSION,
  assertV6CiValidationMatrixReportSafe,
  buildV6CiValidationMatrixReport,
  inspectCiValidationMatrixTargets
};
