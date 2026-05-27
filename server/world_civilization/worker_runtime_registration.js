const crypto = require('crypto');

const V6_WORKER_RUNTIME_REGISTRATION_VERSION = 'agent-town.v6.worker_runtime_registration.v1';
const REQUIRED_WORKER_RUNTIME_REGISTRATION_TARGET_KEYS = [
  'openclaw_worker_boot',
  'runtime_tool_manifest_sync',
  'civic_tool_absence_before_release',
  'debug_observability_tabs',
  'skill_context_import',
  'worker_traffic_trace',
  'session_context_link',
  'modal_lifetime_continuity',
  'shared_state_route_adapter',
  'production_override_denial'
];
const REQUIRED_WORKER_RUNTIME_REGISTRATION_RELEASE_GAPS = [
  'browser_worker_registration_required',
  'production_browser_coverage_required',
  'worker_lifetime_modal_continuity_required',
  'runtime_tool_registration_parity_required',
  'observability_trace_artifacts_required',
  'shared_state_route_evidence_required',
  'production_override_signoff_required'
];

const V6_WORKER_RUNTIME_REGISTRATION_TARGETS = [
  {
    key: 'openclaw_worker_boot',
    surface: 'browser_openclaw_lite_worker',
    requiredEvidence: 'Worker startup is owned by the browser OpenClaw Lite runtime.',
    currentEvidence: 'server/world_civilization/worker_tool_adapter.js, e2e/246_v6_worker_runtime_registration_smoke.spec.js',
    releaseEvidenceRequired: 'browser_worker_boot_trace'
  },
  {
    key: 'runtime_tool_manifest_sync',
    surface: '/api/world/tools',
    requiredEvidence: 'Runtime tool manifest remains the source of truth.',
    currentEvidence: 'tests/world_civilization_tool_exposure_gate.test.js, e2e/246_v6_worker_runtime_registration_smoke.spec.js',
    releaseEvidenceRequired: 'browser_manifest_parity_trace'
  },
  {
    key: 'civic_tool_absence_before_release',
    surface: '/api/world/tools',
    requiredEvidence: 'No et.world.civic.* tool is runtime-callable before release gates close.',
    currentEvidence: 'tests/world_grid_region.test.js, e2e/246_v6_worker_runtime_registration_smoke.spec.js',
    releaseEvidenceRequired: 'production_runtime_absence_smoke'
  },
  {
    key: 'debug_observability_tabs',
    surface: 'Worker Tools / Skill Context / Worker Traffic / Brain / Session Context',
    requiredEvidence: 'Worker debug tabs are present before civic tool registration can be trusted.',
    currentEvidence: 'tests/world_civilization_tool_exposure_gate.test.js, e2e/246_v6_worker_runtime_registration_smoke.spec.js',
    releaseEvidenceRequired: 'browser_debug_tabs_trace'
  },
  {
    key: 'skill_context_import',
    surface: 'OpenClaw Lite skill context',
    requiredEvidence: 'Worker-imported skill context is observable and loaded before civic tools run.',
    currentEvidence: 'tests/world_civilization_worker_tool_adapter.test.js, e2e/246_v6_worker_runtime_registration_smoke.spec.js',
    releaseEvidenceRequired: 'browser_skill_context_trace'
  },
  {
    key: 'worker_traffic_trace',
    surface: 'Worker Traffic',
    requiredEvidence: 'Outbound and inbound worker tool traffic is traceable.',
    currentEvidence: 'tests/world_civilization_worker_vote_adapter.test.js, e2e/246_v6_worker_runtime_registration_smoke.spec.js',
    releaseEvidenceRequired: 'browser_worker_traffic_trace'
  },
  {
    key: 'session_context_link',
    surface: 'Session Context',
    requiredEvidence: 'Worker requests are linked to the current session and wallet context.',
    currentEvidence: 'server/world_civilization/mutation_security.js, e2e/246_v6_worker_runtime_registration_smoke.spec.js',
    releaseEvidenceRequired: 'browser_session_wallet_trace'
  },
  {
    key: 'modal_lifetime_continuity',
    surface: 'town_hub_modal',
    requiredEvidence: 'Modal launch preserves page-scoped worker lifetime.',
    currentEvidence: 'e2e/244_v6_lab_modal_boundary.spec.js',
    releaseEvidenceRequired: 'browser_worker_lifetime_trace'
  },
  {
    key: 'shared_state_route_adapter',
    surface: 'worker_adapter_to_server_store',
    requiredEvidence: 'Worker-origin requests validate and persist against shared server state only.',
    currentEvidence: 'tests/world_civilization_worker_tool_adapter.test.js',
    releaseEvidenceRequired: 'end_to_end_shared_state_worker_route_trace'
  },
  {
    key: 'production_override_denial',
    surface: 'production_feature_flags',
    requiredEvidence: 'Player-supplied production overrides cannot expose V6 civic tools.',
    currentEvidence: 'tests/world_grid_region.test.js, e2e/246_v6_worker_runtime_registration_smoke.spec.js',
    releaseEvidenceRequired: 'production_browser_override_smoke'
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

function targetMatrixDigest(targets = V6_WORKER_RUNTIME_REGISTRATION_TARGETS) {
  return sha256(JSON.stringify(targets.map((target) => ({
    key: target.key,
    surface: target.surface,
    requiredEvidence: target.requiredEvidence,
    releaseEvidenceRequired: target.releaseEvidenceRequired
  }))));
}

function inspectWorkerRuntimeRegistrationTargets(targets = V6_WORKER_RUNTIME_REGISTRATION_TARGETS) {
  const safeTargets = Array.isArray(targets) ? targets : [];
  const targetKeys = safeTargets.map((target) => String(target.key || ''));
  const missingKeys = REQUIRED_WORKER_RUNTIME_REGISTRATION_TARGET_KEYS.filter((key) => !targetKeys.includes(key));
  const incompleteTargets = safeTargets.filter((target) => (
    !target.key
    || !target.surface
    || !target.requiredEvidence
    || !target.currentEvidence
    || !target.releaseEvidenceRequired
  )).map((target) => String(target.key || 'unknown'));

  return {
    ok: missingKeys.length === 0 && incompleteTargets.length === 0,
    requiredKeys: [...REQUIRED_WORKER_RUNTIME_REGISTRATION_TARGET_KEYS],
    targetKeys,
    missingKeys,
    incompleteTargets,
    targetCount: safeTargets.length,
    digest: targetMatrixDigest(safeTargets)
  };
}

function buildMissingReport(errors = []) {
  return {
    version: V6_WORKER_RUNTIME_REGISTRATION_VERSION,
    status: 'research_only',
    ok: false,
    errors,
    releaseReady: false,
    productionReady: false,
    runtimeExposed: false,
    playerVisible: false,
    normalGameplayExposure: false,
    registersRuntimeCivicTools: false,
    usesBackendShortcut: false,
    mutatesWorldState: false,
    exposesPrivateData: false,
    executionStatus: 'not_executable',
    targetMatrix: inspectWorkerRuntimeRegistrationTargets([]),
    observedEvidence: {},
    releaseGaps: [...REQUIRED_WORKER_RUNTIME_REGISTRATION_RELEASE_GAPS]
  };
}

function buildV6WorkerRuntimeRegistrationReport({
  targets = V6_WORKER_RUNTIME_REGISTRATION_TARGETS,
  observed = {},
  source = 'runtime'
} = {}) {
  const targetMatrix = inspectWorkerRuntimeRegistrationTargets(targets);
  const observedEvidence = {
    runtimeManifestProbeCount: numberValue(observed.runtimeManifestProbeCount),
    workerAdapterContractProbeCount: numberValue(observed.workerAdapterContractProbeCount),
    observabilityContractProbeCount: numberValue(observed.observabilityContractProbeCount),
    productionOverrideProbeCount: numberValue(observed.productionOverrideProbeCount),
    browserWorkerRegistrationProbeCount: numberValue(observed.browserWorkerRegistrationProbeCount),
    civicRuntimeToolCount: numberValue(observed.civicRuntimeToolCount),
    registeredRuntimeCivicToolCount: numberValue(observed.registeredRuntimeCivicToolCount),
    playerVisibleCivicToolCount: numberValue(observed.playerVisibleCivicToolCount),
    backendShortcutCount: numberValue(observed.backendShortcutCount),
    productionOverrideBypass: observed.productionOverrideBypass === true,
    mutatesWorldState: observed.mutatesWorldState === true,
    exposesPrivateData: observed.exposesPrivateData === true
  };
  observedEvidence.browserWorkerRegistrationCovered = observedEvidence.browserWorkerRegistrationProbeCount > 0;
  const errors = [];
  if (targetMatrix.ok !== true) errors.push('V6_WORKER_RUNTIME_REGISTRATION_TARGET_MATRIX_INCOMPLETE');
  if (observedEvidence.runtimeManifestProbeCount <= 0) errors.push('V6_WORKER_RUNTIME_MANIFEST_PROBE_REQUIRED');
  if (observedEvidence.workerAdapterContractProbeCount <= 0) errors.push('V6_WORKER_RUNTIME_ADAPTER_CONTRACT_PROBE_REQUIRED');
  if (observedEvidence.observabilityContractProbeCount <= 0) errors.push('V6_WORKER_RUNTIME_OBSERVABILITY_PROBE_REQUIRED');
  if (observedEvidence.productionOverrideProbeCount <= 0) errors.push('V6_WORKER_RUNTIME_PRODUCTION_OVERRIDE_PROBE_REQUIRED');
  if (observedEvidence.civicRuntimeToolCount > 0 || observedEvidence.registeredRuntimeCivicToolCount > 0) {
    errors.push('V6_WORKER_RUNTIME_CIVIC_TOOL_EXPOSURE_FORBIDDEN');
  }
  if (observedEvidence.playerVisibleCivicToolCount > 0) errors.push('V6_WORKER_RUNTIME_PLAYER_TOOL_EXPOSURE_FORBIDDEN');
  if (observedEvidence.backendShortcutCount > 0) errors.push('V6_WORKER_RUNTIME_BACKEND_SHORTCUT_FORBIDDEN');
  if (observedEvidence.productionOverrideBypass) errors.push('V6_WORKER_RUNTIME_PRODUCTION_OVERRIDE_BYPASS_FORBIDDEN');
  if (observedEvidence.mutatesWorldState) errors.push('V6_WORKER_RUNTIME_WORLD_MUTATION_FORBIDDEN');
  if (observedEvidence.exposesPrivateData) errors.push('V6_WORKER_RUNTIME_PRIVATE_DATA_FORBIDDEN');
  if (errors.length > 0) {
    return {
      ...buildMissingReport(errors),
      source,
      targetMatrix,
      observedEvidence
    };
  }

  return {
    version: V6_WORKER_RUNTIME_REGISTRATION_VERSION,
    status: 'research_only',
    source,
    ok: true,
    errors: [],
    releaseReady: false,
    productionReady: false,
    runtimeExposed: false,
    playerVisible: false,
    normalGameplayExposure: false,
    registersRuntimeCivicTools: false,
    usesBackendShortcut: false,
    mutatesWorldState: false,
    exposesPrivateData: false,
    executionStatus: 'not_executable',
    targetMatrix,
    targets: clone(targets),
    observedEvidence,
    releaseGaps: [...REQUIRED_WORKER_RUNTIME_REGISTRATION_RELEASE_GAPS]
  };
}

function assertV6WorkerRuntimeRegistrationReportSafe(report = {}) {
  const errors = [];
  if (report.version !== V6_WORKER_RUNTIME_REGISTRATION_VERSION) {
    errors.push('V6_WORKER_RUNTIME_REGISTRATION_VERSION_REQUIRED');
  }
  if (report.status !== 'research_only') {
    errors.push('V6_WORKER_RUNTIME_REGISTRATION_RESEARCH_ONLY_REQUIRED');
  }
  if (report.releaseReady !== false || report.productionReady !== false) {
    errors.push('V6_WORKER_RUNTIME_REGISTRATION_RELEASE_READY_FORBIDDEN');
  }
  if (report.runtimeExposed !== false) {
    errors.push('V6_WORKER_RUNTIME_REGISTRATION_RUNTIME_HIDDEN_REQUIRED');
  }
  if (report.playerVisible !== false || report.normalGameplayExposure !== false) {
    errors.push('V6_WORKER_RUNTIME_REGISTRATION_PLAYER_HIDDEN_REQUIRED');
  }
  if (report.registersRuntimeCivicTools !== false) {
    errors.push('V6_WORKER_RUNTIME_REGISTRATION_TOOL_REGISTRATION_FORBIDDEN');
  }
  if (report.usesBackendShortcut !== false) {
    errors.push('V6_WORKER_RUNTIME_REGISTRATION_BACKEND_SHORTCUT_FORBIDDEN');
  }
  if (report.mutatesWorldState !== false) {
    errors.push('V6_WORKER_RUNTIME_REGISTRATION_WORLD_MUTATION_FORBIDDEN');
  }
  if (report.exposesPrivateData !== false) {
    errors.push('V6_WORKER_RUNTIME_REGISTRATION_PRIVATE_DATA_FORBIDDEN');
  }
  if (report.executionStatus !== 'not_executable') {
    errors.push('V6_WORKER_RUNTIME_REGISTRATION_NON_EXECUTING_REQUIRED');
  }
  if (
    !Array.isArray(report.releaseGaps)
    || REQUIRED_WORKER_RUNTIME_REGISTRATION_RELEASE_GAPS.some((gap) => !report.releaseGaps.includes(gap))
  ) {
    errors.push('V6_WORKER_RUNTIME_REGISTRATION_RELEASE_GAPS_REQUIRED');
  }
  if (report.targetMatrix?.ok !== true || (report.targetMatrix?.missingKeys || []).length > 0) {
    errors.push('V6_WORKER_RUNTIME_REGISTRATION_TARGET_MATRIX_REQUIRED');
  }
  const evidence = report.observedEvidence || {};
  if (
    evidence.civicRuntimeToolCount > 0
    || evidence.registeredRuntimeCivicToolCount > 0
    || evidence.playerVisibleCivicToolCount > 0
  ) {
    errors.push('V6_WORKER_RUNTIME_REGISTRATION_TOOL_EXPOSURE_FORBIDDEN');
  }
  if (evidence.backendShortcutCount > 0 || evidence.productionOverrideBypass === true) {
    errors.push('V6_WORKER_RUNTIME_REGISTRATION_CONTROL_BYPASS_FORBIDDEN');
  }
  if (evidence.mutatesWorldState === true || evidence.exposesPrivateData === true) {
    errors.push('V6_WORKER_RUNTIME_REGISTRATION_EVIDENCE_SAFETY_REQUIRED');
  }
  if (report.ok !== true || (Array.isArray(report.errors) && report.errors.length > 0)) {
    errors.push('V6_WORKER_RUNTIME_REGISTRATION_ERRORS_PRESENT');
  }
  return {
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  REQUIRED_WORKER_RUNTIME_REGISTRATION_RELEASE_GAPS: [...REQUIRED_WORKER_RUNTIME_REGISTRATION_RELEASE_GAPS],
  REQUIRED_WORKER_RUNTIME_REGISTRATION_TARGET_KEYS: [...REQUIRED_WORKER_RUNTIME_REGISTRATION_TARGET_KEYS],
  V6_WORKER_RUNTIME_REGISTRATION_TARGETS: clone(V6_WORKER_RUNTIME_REGISTRATION_TARGETS),
  V6_WORKER_RUNTIME_REGISTRATION_VERSION,
  assertV6WorkerRuntimeRegistrationReportSafe,
  buildV6WorkerRuntimeRegistrationReport,
  inspectWorkerRuntimeRegistrationTargets
};
