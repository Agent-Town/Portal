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

module.exports = {
  REQUIRED_DEBUG_TABS,
  V6_LAB_PANEL_IDS,
  V6_LAB_SURFACE_VERSION,
  assertV6LabSurfaceSafe,
  buildV6LabSurfaceContract
};
