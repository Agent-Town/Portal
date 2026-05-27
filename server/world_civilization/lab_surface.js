const { V6_WORLD_FEATURE_FLAG, isWorldGridFeatureEnabled } = require('../world_grid/feature_flags');

const V6_LAB_SURFACE_VERSION = 'agent-town.v6.lab_surface.v1';

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

const NO_CIVIC_EFFECT = {
  executesCivicEffect: false,
  mutatesPrivateTown: false,
  mutatesOtherUserWorld: false
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
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
  V6_LAB_PANEL_IDS,
  V6_LAB_STANDALONE_PATHS,
  V6_LAB_SURFACE_VERSION,
  assertV6LabLaunchPlanSafe,
  assertV6LabSurfaceSafe,
  buildV6LabModalLaunchPlan,
  buildV6LabSurfaceContract
};
