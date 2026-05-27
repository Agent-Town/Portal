const { V6_WORLD_FEATURE_FLAG, isWorldGridFeatureEnabled } = require('../world_grid/feature_flags');

const V6_LAB_SURFACE_VERSION = 'agent-town.v6.lab_surface.v1';
const V6_LAB_READINESS_GATE_VERSION = 'agent-town.v6.lab_surface.readiness.v1';

const REQUIRED_DEBUG_TABS = [
  'Worker Tools',
  'Skill Context',
  'Worker Traffic',
  'Brain',
  'Session Context'
];

const V6_LAB_PANEL_IDS = [
  'readiness',
  'schemas',
  'proposals',
  'votes',
  'moderation',
  'reputation',
  'effects',
  'delegations',
  'institutions',
  'public_works',
  'audit'
];

const V6_LAB_STANDALONE_PATHS = [
  '/v6',
  '/v6-lab',
  '/civilization'
];
const REQUIRED_LAB_READINESS_CHECKS = [
  'feature_flag',
  'research_opt_in',
  'modal_evidence',
  'town_hub_modal_launch',
  'standalone_route_denial',
  'worker_continuity',
  'debug_observability',
  'browser_visual_coverage',
  'accessibility_review',
  'no_runtime_tool_exposure',
  'no_player_visible_lab',
  'no_civic_execution'
];
const REQUIRED_LAB_EVIDENCE_CHECKS = [
  'town_hub_modal_launch',
  'standalone_route_denial',
  'worker_continuity',
  'debug_observability',
  'non_executing_panels',
  'browser_visual_390',
  'browser_visual_768',
  'browser_visual_1280',
  'keyboard_accessibility',
  'focus_trap_review',
  'screen_reader_names',
  'runtime_tool_absence',
  'private_debug_data_exclusion',
  'normal_gameplay_exposure_denial'
];
const REQUIRED_LAB_VISUAL_WIDTHS = [390, 768, 1280];

const NO_CIVIC_EFFECT = {
  executesCivicEffect: false,
  mutatesPrivateTown: false,
  mutatesOtherUserWorld: false
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeList(value) {
  return Array.isArray(value) ? value.map((entry) => String(entry || '')).filter(Boolean) : [];
}

function normalizeNumberList(value) {
  return Array.isArray(value)
    ? value.map((entry) => Number(entry)).filter((entry) => Number.isFinite(entry))
    : [];
}

function check(key, ok, error = '') {
  return { key, ok: ok === true, error: ok === true ? '' : error };
}

function disabledContract(source) {
  return {
    version: V6_LAB_SURFACE_VERSION,
    status: 'research_only',
    source,
    featureFlag: V6_WORLD_FEATURE_FLAG,
    available: false,
    runtimeExposed: false,
    playerVisible: false,
    standaloneRouteAllowed: false,
    mountMode: 'modal',
    launchSurface: 'town_hub_modal',
    requiresWorkerContinuity: true,
    requiredDebugTabs: [],
    panels: [],
    effects: clone(NO_CIVIC_EFFECT),
    executionStatus: 'not_executable',
    disabledReason: 'V6 lab requires explicit research opt-in and V6 feature flag'
  };
}

function buildV6LabSurfaceContract({
  featureFlags = {},
  includeResearchLab = false,
  source = 'runtime'
} = {}) {
  const enabled = includeResearchLab === true
    && isWorldGridFeatureEnabled(featureFlags, V6_WORLD_FEATURE_FLAG);
  if (!enabled) return disabledContract(source);

  return {
    version: V6_LAB_SURFACE_VERSION,
    status: 'research_only',
    source,
    featureFlag: V6_WORLD_FEATURE_FLAG,
    available: true,
    runtimeExposed: false,
    playerVisible: false,
    standaloneRouteAllowed: false,
    mountMode: 'modal',
    launchSurface: 'town_hub_modal',
    requiresWorkerContinuity: true,
    requiredDebugTabs: [...REQUIRED_DEBUG_TABS],
    panels: V6_LAB_PANEL_IDS.map((id) => ({
      id,
      featureFlag: V6_WORLD_FEATURE_FLAG,
      status: 'research_only',
      executionStatus: 'not_executable'
    })),
    effects: clone(NO_CIVIC_EFFECT),
    executionStatus: 'not_executable'
  };
}

function hasRequiredDebugTabs(contract) {
  const tabs = new Set(contract?.requiredDebugTabs || []);
  return REQUIRED_DEBUG_TABS.every((tab) => tabs.has(tab));
}

function normalizePath(path = '') {
  const raw = String(path || '').trim();
  if (!raw) return '/';
  try {
    const url = raw.startsWith('http://') || raw.startsWith('https://')
      ? new URL(raw)
      : new URL(raw, 'https://portal.local');
    return url.pathname || '/';
  } catch {
    return raw.split('?')[0].split('#')[0] || '/';
  }
}

function isStandaloneV6LabPath(path = '') {
  return V6_LAB_STANDALONE_PATHS.includes(normalizePath(path));
}

function assertV6LabSurfaceSafe(contract = {}) {
  const errors = [];
  if (contract.version !== V6_LAB_SURFACE_VERSION) {
    errors.push('V6_LAB_SURFACE_VERSION_REQUIRED');
  }
  if (contract.featureFlag !== V6_WORLD_FEATURE_FLAG) {
    errors.push('V6_LAB_FEATURE_FLAG_REQUIRED');
  }
  if (contract.status !== 'research_only') {
    errors.push('V6_LAB_RESEARCH_ONLY_REQUIRED');
  }
  if (contract.runtimeExposed !== false) {
    errors.push('V6_LAB_RUNTIME_HIDDEN_REQUIRED');
  }
  if (contract.playerVisible !== false) {
    errors.push('V6_LAB_PLAYER_HIDDEN_REQUIRED');
  }
  if (contract.standaloneRouteAllowed !== false) {
    errors.push('V6_LAB_STANDALONE_ROUTE_FORBIDDEN');
  }
  if (contract.mountMode !== 'modal') {
    errors.push('V6_LAB_MODAL_MOUNT_REQUIRED');
  }
  if (contract.launchSurface !== 'town_hub_modal') {
    errors.push('V6_LAB_TOWN_HUB_LAUNCH_REQUIRED');
  }
  if (contract.requiresWorkerContinuity !== true) {
    errors.push('V6_LAB_WORKER_CONTINUITY_REQUIRED');
  }
  if (contract.available === true && !hasRequiredDebugTabs(contract)) {
    errors.push('V6_LAB_DEBUG_TABS_REQUIRED');
  }
  if (contract.executionStatus !== 'not_executable') {
    errors.push('V6_LAB_NON_EXECUTING_REQUIRED');
  }
  if (contract.effects?.executesCivicEffect !== false) {
    errors.push('V6_LAB_CIVIC_EFFECT_FORBIDDEN');
  }
  if (contract.effects?.mutatesPrivateTown !== false) {
    errors.push('V6_LAB_PRIVATE_TOWN_MUTATION_FORBIDDEN');
  }
  if (contract.effects?.mutatesOtherUserWorld !== false) {
    errors.push('V6_LAB_OTHER_USER_MUTATION_FORBIDDEN');
  }
  if ((contract.panels || []).some((panel) => panel.executionStatus !== 'not_executable')) {
    errors.push('V6_LAB_PANEL_EXECUTION_FORBIDDEN');
  }
  return {
    ok: errors.length === 0,
    errors
  };
}

function missingDebugTabs(debugTabsAvailable = []) {
  const available = new Set(Array.isArray(debugTabsAvailable) ? debugTabsAvailable : []);
  return REQUIRED_DEBUG_TABS.filter((tab) => !available.has(tab));
}

function inspectLabReadinessEvidence(evidence = {}) {
  const checks = normalizeList(evidence.checks);
  const debugTabs = normalizeList(evidence.debugTabs);
  const visualWidths = normalizeNumberList(evidence.visualWidths);
  const missingChecks = REQUIRED_LAB_EVIDENCE_CHECKS.filter((entry) => !checks.includes(entry));
  const missingDebugTabs = REQUIRED_DEBUG_TABS.filter((entry) => !debugTabs.includes(entry));
  const missingVisualWidths = REQUIRED_LAB_VISUAL_WIDTHS.filter((entry) => !visualWidths.includes(entry));
  const townHubModalLaunch = evidence.townHubModalLaunch === true;
  const standaloneRouteDenied = evidence.standaloneRouteDenied === true;
  const workerContinuityProven = evidence.workerContinuityProven === true;
  const debugObservabilityProven = evidence.debugObservabilityProven === true;
  const browserVisualCoverage = evidence.browserVisualCoverage === true;
  const accessibilityReviewed = evidence.accessibilityReviewed === true;
  const runtimeToolExposureBlocked = evidence.runtimeToolExposureBlocked === true;
  const ok = evidence.status === 'complete'
    && evidence.executionStatus === 'not_executable'
    && evidence.runtimeExposed === false
    && evidence.playerVisible === false
    && evidence.normalGameplayExposure === false
    && evidence.standaloneRouteAllowed === false
    && evidence.civicEffectsEnabled === false
    && evidence.mutatesPrivateTown === false
    && evidence.mutatesOtherUserWorld === false
    && evidence.exposesPrivateDebugData === false
    && townHubModalLaunch
    && standaloneRouteDenied
    && workerContinuityProven
    && debugObservabilityProven
    && browserVisualCoverage
    && accessibilityReviewed
    && runtimeToolExposureBlocked
    && missingChecks.length === 0
    && missingDebugTabs.length === 0
    && missingVisualWidths.length === 0;
  return {
    ok,
    status: String(evidence.status || 'missing'),
    executionStatus: String(evidence.executionStatus || 'missing'),
    runtimeExposed: evidence.runtimeExposed === true,
    playerVisible: evidence.playerVisible === true,
    normalGameplayExposure: evidence.normalGameplayExposure === true,
    standaloneRouteAllowed: evidence.standaloneRouteAllowed === true,
    civicEffectsEnabled: evidence.civicEffectsEnabled === true,
    mutatesPrivateTown: evidence.mutatesPrivateTown === true,
    mutatesOtherUserWorld: evidence.mutatesOtherUserWorld === true,
    exposesPrivateDebugData: evidence.exposesPrivateDebugData === true,
    townHubModalLaunch,
    standaloneRouteDenied,
    workerContinuityProven,
    debugObservabilityProven,
    browserVisualCoverage,
    accessibilityReviewed,
    runtimeToolExposureBlocked,
    requiredChecks: [...REQUIRED_LAB_EVIDENCE_CHECKS],
    checks,
    missingChecks,
    requiredDebugTabs: [...REQUIRED_DEBUG_TABS],
    debugTabs,
    missingDebugTabs,
    requiredVisualWidths: [...REQUIRED_LAB_VISUAL_WIDTHS],
    visualWidths,
    missingVisualWidths
  };
}

function disabledLabReadinessReport({ source, reason }) {
  return {
    version: V6_LAB_READINESS_GATE_VERSION,
    status: 'research_only',
    source,
    featureFlag: V6_WORLD_FEATURE_FLAG,
    available: false,
    researchReady: false,
    releaseReady: false,
    failClosed: true,
    runtimeExposed: false,
    playerVisible: false,
    normalGameplayExposure: false,
    standaloneRouteAllowed: false,
    civicEffectsEnabled: false,
    mutatesPrivateTown: false,
    mutatesOtherUserWorld: false,
    exposesPrivateDebugData: false,
    executionStatus: 'not_executable',
    evidence: inspectLabReadinessEvidence({}),
    checks: [],
    errors: [reason],
    disabledReason: reason
  };
}

function buildV6LabReadinessGate({
  featureFlags = {},
  includeResearchLabReadiness = false,
  source = 'runtime',
  evidence = {}
} = {}) {
  const enabled = includeResearchLabReadiness === true
    && isWorldGridFeatureEnabled(featureFlags, V6_WORLD_FEATURE_FLAG);
  if (!enabled) {
    return disabledLabReadinessReport({
      source,
      reason: 'V6 lab readiness requires explicit research opt-in and V6 feature flag'
    });
  }

  const evidenceReport = inspectLabReadinessEvidence(evidence);
  const checks = [
    check('feature_flag', isWorldGridFeatureEnabled(featureFlags, V6_WORLD_FEATURE_FLAG), 'FEATURE_DISABLED'),
    check('research_opt_in', includeResearchLabReadiness === true, 'RESEARCH_OPT_IN_REQUIRED'),
    check(
      'modal_evidence',
      evidenceReport.status === 'complete'
        && evidenceReport.missingChecks.length === 0
        && evidenceReport.missingDebugTabs.length === 0
        && evidenceReport.missingVisualWidths.length === 0,
      'V6_LAB_MODAL_EVIDENCE_REQUIRED'
    ),
    check('town_hub_modal_launch', evidenceReport.townHubModalLaunch, 'V6_LAB_TOWN_HUB_MODAL_LAUNCH_REQUIRED'),
    check('standalone_route_denial', evidenceReport.standaloneRouteDenied, 'V6_LAB_STANDALONE_ROUTE_DENIAL_REQUIRED'),
    check('worker_continuity', evidenceReport.workerContinuityProven, 'V6_LAB_WORKER_CONTINUITY_EVIDENCE_REQUIRED'),
    check('debug_observability', evidenceReport.debugObservabilityProven, 'V6_LAB_DEBUG_OBSERVABILITY_REQUIRED'),
    check('browser_visual_coverage', evidenceReport.browserVisualCoverage, 'V6_LAB_BROWSER_VISUAL_COVERAGE_REQUIRED'),
    check('accessibility_review', evidenceReport.accessibilityReviewed, 'V6_LAB_ACCESSIBILITY_REVIEW_REQUIRED'),
    check('no_runtime_tool_exposure', evidenceReport.runtimeToolExposureBlocked, 'V6_LAB_RUNTIME_TOOL_EXPOSURE_FORBIDDEN'),
    check(
      'no_player_visible_lab',
      evidenceReport.playerVisible === false
        && evidenceReport.normalGameplayExposure === false
        && evidenceReport.standaloneRouteAllowed === false,
      'V6_LAB_PLAYER_VISIBLE_SURFACE_FORBIDDEN'
    ),
    check(
      'no_civic_execution',
      evidenceReport.executionStatus === 'not_executable'
        && evidenceReport.civicEffectsEnabled === false
        && evidenceReport.mutatesPrivateTown === false
        && evidenceReport.mutatesOtherUserWorld === false,
      'V6_LAB_CIVIC_EXECUTION_FORBIDDEN'
    )
  ];
  const researchReady = checks.every((entry) => entry.ok);

  return {
    version: V6_LAB_READINESS_GATE_VERSION,
    status: 'research_only',
    source,
    featureFlag: V6_WORLD_FEATURE_FLAG,
    available: true,
    researchReady,
    releaseReady: false,
    failClosed: researchReady !== true,
    runtimeExposed: false,
    playerVisible: false,
    normalGameplayExposure: false,
    standaloneRouteAllowed: false,
    civicEffectsEnabled: false,
    mutatesPrivateTown: false,
    mutatesOtherUserWorld: false,
    exposesPrivateDebugData: false,
    executionStatus: 'not_executable',
    evidence: evidenceReport,
    checks,
    errors: checks.filter((entry) => !entry.ok).map((entry) => entry.error)
  };
}

function assertV6LabReadinessGateSafe(report = {}) {
  const errors = [];
  if (report.version !== V6_LAB_READINESS_GATE_VERSION) {
    errors.push('V6_LAB_READINESS_VERSION_REQUIRED');
  }
  if (report.featureFlag !== V6_WORLD_FEATURE_FLAG) {
    errors.push('V6_LAB_READINESS_FEATURE_FLAG_REQUIRED');
  }
  if (report.status !== 'research_only') {
    errors.push('V6_LAB_READINESS_RESEARCH_ONLY_REQUIRED');
  }
  if (report.runtimeExposed !== false) {
    errors.push('V6_LAB_READINESS_RUNTIME_HIDDEN_REQUIRED');
  }
  if (report.playerVisible !== false) {
    errors.push('V6_LAB_READINESS_PLAYER_HIDDEN_REQUIRED');
  }
  if (report.normalGameplayExposure !== false) {
    errors.push('V6_LAB_READINESS_NORMAL_GAMEPLAY_FORBIDDEN');
  }
  if (report.standaloneRouteAllowed !== false) {
    errors.push('V6_LAB_READINESS_STANDALONE_ROUTE_FORBIDDEN');
  }
  if (report.civicEffectsEnabled !== false) {
    errors.push('V6_LAB_READINESS_CIVIC_EFFECT_FORBIDDEN');
  }
  if (report.mutatesPrivateTown !== false) {
    errors.push('V6_LAB_READINESS_PRIVATE_TOWN_MUTATION_FORBIDDEN');
  }
  if (report.mutatesOtherUserWorld !== false) {
    errors.push('V6_LAB_READINESS_OTHER_USER_MUTATION_FORBIDDEN');
  }
  if (report.exposesPrivateDebugData !== false) {
    errors.push('V6_LAB_READINESS_PRIVATE_DEBUG_DATA_FORBIDDEN');
  }
  if (report.executionStatus !== 'not_executable') {
    errors.push('V6_LAB_READINESS_NON_EXECUTING_REQUIRED');
  }
  if (report.releaseReady !== false) {
    errors.push('V6_LAB_READINESS_RELEASE_READY_FORBIDDEN');
  }
  if (report.available === true) {
    const checkKeys = new Set((report.checks || []).map((entry) => entry.key));
    for (const key of REQUIRED_LAB_READINESS_CHECKS) {
      if (!checkKeys.has(key)) errors.push(`V6_LAB_READINESS_CHECK_REQUIRED:${key}`);
    }
    const failedChecks = (report.checks || []).filter((entry) => entry.ok !== true);
    if (report.researchReady === true && failedChecks.length > 0) {
      errors.push('V6_LAB_READINESS_READY_WITH_FAILED_CHECKS');
    }
    if (report.researchReady !== true && report.failClosed !== true) {
      errors.push('V6_LAB_READINESS_DENIAL_FAIL_CLOSED_REQUIRED');
    }
    const evidence = report.evidence || {};
    if (evidence.runtimeExposed === true) {
      errors.push('V6_LAB_READINESS_EVIDENCE_RUNTIME_HIDDEN_REQUIRED');
    }
    if (evidence.playerVisible === true || evidence.normalGameplayExposure === true) {
      errors.push('V6_LAB_READINESS_EVIDENCE_PLAYER_HIDDEN_REQUIRED');
    }
    if (evidence.standaloneRouteAllowed === true) {
      errors.push('V6_LAB_READINESS_EVIDENCE_STANDALONE_ROUTE_FORBIDDEN');
    }
    if (evidence.civicEffectsEnabled === true) {
      errors.push('V6_LAB_READINESS_EVIDENCE_CIVIC_EFFECT_FORBIDDEN');
    }
    if (evidence.mutatesPrivateTown === true) {
      errors.push('V6_LAB_READINESS_EVIDENCE_PRIVATE_TOWN_MUTATION_FORBIDDEN');
    }
    if (evidence.mutatesOtherUserWorld === true) {
      errors.push('V6_LAB_READINESS_EVIDENCE_OTHER_USER_MUTATION_FORBIDDEN');
    }
    if (evidence.exposesPrivateDebugData === true) {
      errors.push('V6_LAB_READINESS_EVIDENCE_PRIVATE_DEBUG_DATA_FORBIDDEN');
    }
    if (report.researchReady === true && evidence.ok !== true) {
      errors.push('V6_LAB_READINESS_READY_WITHOUT_EVIDENCE');
    }
  } else if (report.failClosed !== true) {
    errors.push('V6_LAB_READINESS_DISABLED_FAIL_CLOSED_REQUIRED');
  }
  return {
    ok: errors.length === 0,
    errors
  };
}

function buildDisabledLaunchPlan({ contract, requestPath, source, reason }) {
  return {
    version: V6_LAB_SURFACE_VERSION,
    status: 'research_only',
    source,
    featureFlag: V6_WORLD_FEATURE_FLAG,
    available: false,
    allowed: false,
    failClosed: true,
    reason,
    requestPath,
    routeAction: isStandaloneV6LabPath(requestPath) ? 'redirect_to_town_hub' : 'deny',
    redirectPath: '/app',
    modalId: '',
    mountMode: 'modal',
    launchSurface: 'town_hub_modal',
    standaloneRouteAllowed: false,
    preservesWorkerContinuity: false,
    requiredDebugTabs: [],
    debugTabsAvailable: [],
    missingDebugTabs: [],
    panels: [],
    effects: clone(NO_CIVIC_EFFECT),
    executionStatus: 'not_executable',
    surface: contract
  };
}

function buildV6LabModalLaunchPlan({
  featureFlags = {},
  includeResearchLab = false,
  source = 'runtime',
  requestPath = '/app',
  launchSurface = 'town_hub_modal',
  debugTabsAvailable = REQUIRED_DEBUG_TABS
} = {}) {
  const normalizedRequestPath = normalizePath(requestPath);
  const contract = buildV6LabSurfaceContract({ featureFlags, includeResearchLab, source });
  const surfaceSafety = assertV6LabSurfaceSafe(contract);
  if (!contract.available || !surfaceSafety.ok) {
    return buildDisabledLaunchPlan({
      contract,
      requestPath: normalizedRequestPath,
      source,
      reason: contract.disabledReason || surfaceSafety.errors.join(',')
    });
  }
  if (isStandaloneV6LabPath(normalizedRequestPath)) {
    return buildDisabledLaunchPlan({
      contract,
      requestPath: normalizedRequestPath,
      source,
      reason: 'V6 lab standalone route is forbidden; launch from the town hub modal'
    });
  }
  const missingTabs = missingDebugTabs(debugTabsAvailable);
  if (launchSurface !== 'town_hub_modal' || missingTabs.length > 0) {
    return {
      ...buildDisabledLaunchPlan({
        contract,
        requestPath: normalizedRequestPath,
        source,
        reason: launchSurface !== 'town_hub_modal'
          ? 'V6 lab launch surface must be the town hub modal'
          : 'V6 lab launch requires current debug observability tabs'
      }),
      requiredDebugTabs: [...REQUIRED_DEBUG_TABS],
      debugTabsAvailable: Array.isArray(debugTabsAvailable) ? [...debugTabsAvailable] : [],
      missingDebugTabs: missingTabs
    };
  }
  return {
    version: V6_LAB_SURFACE_VERSION,
    status: 'research_only',
    source,
    featureFlag: V6_WORLD_FEATURE_FLAG,
    available: true,
    allowed: true,
    failClosed: false,
    reason: '',
    requestPath: normalizedRequestPath,
    routeAction: 'open_modal',
    redirectPath: '',
    modalId: 'v6-research-lab',
    mountMode: 'modal',
    launchSurface: 'town_hub_modal',
    standaloneRouteAllowed: false,
    preservesWorkerContinuity: true,
    requiredDebugTabs: [...REQUIRED_DEBUG_TABS],
    debugTabsAvailable: [...debugTabsAvailable],
    missingDebugTabs: [],
    panels: clone(contract.panels),
    effects: clone(NO_CIVIC_EFFECT),
    executionStatus: 'not_executable',
    surface: contract
  };
}

function assertV6LabLaunchPlanSafe(plan = {}) {
  const errors = [];
  if (plan.version !== V6_LAB_SURFACE_VERSION) {
    errors.push('V6_LAB_LAUNCH_VERSION_REQUIRED');
  }
  if (plan.featureFlag !== V6_WORLD_FEATURE_FLAG) {
    errors.push('V6_LAB_LAUNCH_FEATURE_FLAG_REQUIRED');
  }
  if (plan.status !== 'research_only') {
    errors.push('V6_LAB_LAUNCH_RESEARCH_ONLY_REQUIRED');
  }
  if (plan.standaloneRouteAllowed !== false) {
    errors.push('V6_LAB_LAUNCH_STANDALONE_ROUTE_FORBIDDEN');
  }
  if (plan.mountMode !== 'modal' || plan.launchSurface !== 'town_hub_modal') {
    errors.push('V6_LAB_LAUNCH_MODAL_REQUIRED');
  }
  if (isStandaloneV6LabPath(plan.requestPath) && plan.allowed === true) {
    errors.push('V6_LAB_LAUNCH_STANDALONE_ALLOWED');
  }
  if (plan.allowed === true) {
    if (plan.routeAction !== 'open_modal') errors.push('V6_LAB_LAUNCH_OPEN_MODAL_REQUIRED');
    if (plan.modalId !== 'v6-research-lab') errors.push('V6_LAB_LAUNCH_MODAL_ID_REQUIRED');
    if (plan.preservesWorkerContinuity !== true) errors.push('V6_LAB_LAUNCH_WORKER_CONTINUITY_REQUIRED');
    if ((plan.missingDebugTabs || []).length > 0) errors.push('V6_LAB_LAUNCH_DEBUG_TABS_REQUIRED');
    if (plan.failClosed !== false) errors.push('V6_LAB_LAUNCH_FAIL_CLOSED_DRIFT');
  } else if (plan.failClosed !== true) {
    errors.push('V6_LAB_LAUNCH_DENIAL_FAIL_CLOSED_REQUIRED');
  }
  if (plan.executionStatus !== 'not_executable') {
    errors.push('V6_LAB_LAUNCH_NON_EXECUTING_REQUIRED');
  }
  if (plan.effects?.executesCivicEffect !== false) {
    errors.push('V6_LAB_LAUNCH_CIVIC_EFFECT_FORBIDDEN');
  }
  if (plan.effects?.mutatesPrivateTown !== false) {
    errors.push('V6_LAB_LAUNCH_PRIVATE_TOWN_MUTATION_FORBIDDEN');
  }
  if (plan.effects?.mutatesOtherUserWorld !== false) {
    errors.push('V6_LAB_LAUNCH_OTHER_USER_MUTATION_FORBIDDEN');
  }
  const surfaceSafety = assertV6LabSurfaceSafe(plan.surface || {});
  if (!surfaceSafety.ok) errors.push(...surfaceSafety.errors.map((error) => `SURFACE:${error}`));
  return {
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  REQUIRED_DEBUG_TABS,
  REQUIRED_LAB_EVIDENCE_CHECKS: clone(REQUIRED_LAB_EVIDENCE_CHECKS),
  REQUIRED_LAB_READINESS_CHECKS: clone(REQUIRED_LAB_READINESS_CHECKS),
  REQUIRED_LAB_VISUAL_WIDTHS: clone(REQUIRED_LAB_VISUAL_WIDTHS),
  V6_LAB_PANEL_IDS,
  V6_LAB_READINESS_GATE_VERSION,
  V6_LAB_STANDALONE_PATHS,
  V6_LAB_SURFACE_VERSION,
  assertV6LabLaunchPlanSafe,
  assertV6LabReadinessGateSafe,
  assertV6LabSurfaceSafe,
  buildV6LabModalLaunchPlan,
  buildV6LabReadinessGate,
  buildV6LabSurfaceContract
};
