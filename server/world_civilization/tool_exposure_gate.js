const { V6_WORLD_FEATURE_FLAG, isWorldGridFeatureEnabled } = require('../world_grid/feature_flags');
const { REQUIRED_DEBUG_TABS } = require('./lab_surface');
const { V6_CIVIC_MUTATION_SECURITY_VERSION } = require('./mutation_security');
const { V6_CIVIC_TOOL_DRAFTS, listV6CivicToolDrafts } = require('./tools');

const V6_CIVIC_TOOL_EXPOSURE_GATE_VERSION = 'agent-town.v6.civic.tool_exposure_gate.v1';
const RUNTIME_TOOL_SOURCE = '/api/world/tools';
const WORKER_ORIGIN = 'openclaw_lite_worker';

const REQUIRED_EXPOSURE_CHECKS = [
  'feature_flag',
  'research_opt_in',
  'runtime_manifest_source',
  'worker_origin',
  'worker_observability',
  'mutation_security',
  'non_executing_drafts',
  'approval_bound_mutations',
  'no_public_runtime'
];

const APPROVAL_BOUND_MODES = new Set([
  'submit_for_review',
  'authorized_receipt',
  'policy_update_request'
]);

const NO_CIVIC_EFFECT = {
  executesCivicEffect: false,
  mutatesPrivateTown: false,
  mutatesOtherUserWorld: false
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function check(key, ok, error = '') {
  return { key, ok: ok === true, error: ok === true ? '' : error };
}

function normalizeRuntimeToolNames(runtimeTools = []) {
  if (!Array.isArray(runtimeTools)) return [];
  return runtimeTools.map((tool) => {
    if (typeof tool === 'string') return tool.trim();
    return String(tool?.name || '').trim();
  }).filter(Boolean);
}

function missingDebugTabs(debugTabsAvailable = []) {
  const available = new Set(Array.isArray(debugTabsAvailable) ? debugTabsAvailable : []);
  return REQUIRED_DEBUG_TABS.filter((tab) => !available.has(tab));
}

function civicRuntimeToolNames(runtimeTools = []) {
  return normalizeRuntimeToolNames(runtimeTools).filter((name) => name.startsWith('et.world.civic.'));
}

function draftsAreNonExecuting(drafts = V6_CIVIC_TOOL_DRAFTS) {
  return drafts.every((tool) => tool.status === 'research_only'
    && tool.featureFlag === V6_WORLD_FEATURE_FLAG
    && tool.workerFirst === true
    && tool.runtimeExposed === false
    && tool.effects?.executesCivicEffect === false
    && tool.effects?.mutatesPrivateTown === false
    && tool.effects?.mutatesOtherUserWorld === false);
}

function approvalBoundMutations(drafts = V6_CIVIC_TOOL_DRAFTS) {
  return drafts
    .filter((tool) => APPROVAL_BOUND_MODES.has(tool.mode))
    .every((tool) => tool.authority?.requiresHumanApproval === true
      && tool.authority?.requiresVerifiedWalletSession === true
      && Array.isArray(tool.inputSchema?.required)
      && tool.inputSchema.required.includes('idempotencyKey'));
}

function disabledReport({ source, reason, runtimeTools }) {
  return {
    version: V6_CIVIC_TOOL_EXPOSURE_GATE_VERSION,
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
    productionEnabled: false,
    executionStatus: 'not_executable',
    runtimeToolSource: RUNTIME_TOOL_SOURCE,
    workerOrigin: '',
    requiredDebugTabs: [],
    debugTabsAvailable: [],
    missingDebugTabs: [],
    draftTools: [],
    runtimeToolNames: normalizeRuntimeToolNames(runtimeTools),
    civicRuntimeToolNames: civicRuntimeToolNames(runtimeTools),
    effects: clone(NO_CIVIC_EFFECT),
    checks: [],
    errors: [reason],
    disabledReason: reason
  };
}

function buildV6CivicToolExposureGate({
  featureFlags = {},
  includeResearchToolExposure = false,
  source = 'runtime',
  runtimeToolSource = RUNTIME_TOOL_SOURCE,
  runtimeTools = [],
  workerEvidence = {},
  mutationSecurityVersion = '',
  exposeRuntimeTools = false
} = {}) {
  const enabled = isWorldGridFeatureEnabled(featureFlags, V6_WORLD_FEATURE_FLAG);
  if (!enabled || includeResearchToolExposure !== true) {
    return disabledReport({
      source,
      runtimeTools,
      reason: 'V6 civic tool exposure requires explicit research opt-in and V6 feature flag'
    });
  }

  const draftTools = listV6CivicToolDrafts({
    includeResearchDrafts: true,
    featureFlags
  });
  const runtimeToolNames = normalizeRuntimeToolNames(runtimeTools);
  const runtimeCivicTools = civicRuntimeToolNames(runtimeTools);
  const missingTabs = missingDebugTabs(workerEvidence.debugTabsAvailable);
  const originOk = workerEvidence.origin === WORKER_ORIGIN
    && workerEvidence.backendShortcut !== true;
  const observabilityOk = missingTabs.length === 0
    && workerEvidence.workerTrafficTrace === true
    && workerEvidence.skillContextLoaded === true
    && workerEvidence.sessionContextLinked === true;
  const mutationSecurityOk = mutationSecurityVersion === V6_CIVIC_MUTATION_SECURITY_VERSION;
  const noPublicRuntime = exposeRuntimeTools !== true && runtimeCivicTools.length === 0;

  const checks = [
    check('feature_flag', enabled, 'FEATURE_DISABLED'),
    check('research_opt_in', includeResearchToolExposure === true, 'RESEARCH_OPT_IN_REQUIRED'),
    check('runtime_manifest_source', runtimeToolSource === RUNTIME_TOOL_SOURCE, 'RUNTIME_TOOL_SOURCE_REQUIRED'),
    check('worker_origin', originOk, 'OPENCLAW_LITE_WORKER_ORIGIN_REQUIRED'),
    check('worker_observability', observabilityOk, 'WORKER_OBSERVABILITY_REQUIRED'),
    check('mutation_security', mutationSecurityOk, 'MUTATION_SECURITY_ENVELOPE_REQUIRED'),
    check('non_executing_drafts', draftsAreNonExecuting(draftTools), 'NON_EXECUTING_DRAFTS_REQUIRED'),
    check('approval_bound_mutations', approvalBoundMutations(draftTools), 'APPROVAL_BOUND_MUTATIONS_REQUIRED'),
    check('no_public_runtime', noPublicRuntime, 'RUNTIME_CIVIC_TOOL_EXPOSURE_FORBIDDEN')
  ];
  const researchReady = checks.every((entry) => entry.ok);

  return {
    version: V6_CIVIC_TOOL_EXPOSURE_GATE_VERSION,
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
    productionEnabled: false,
    executionStatus: 'not_executable',
    runtimeToolSource,
    workerOrigin: String(workerEvidence.origin || ''),
    requiredDebugTabs: [...REQUIRED_DEBUG_TABS],
    debugTabsAvailable: Array.isArray(workerEvidence.debugTabsAvailable)
      ? [...workerEvidence.debugTabsAvailable]
      : [],
    missingDebugTabs: missingTabs,
    workerEvidence: clone(workerEvidence || {}),
    mutationSecurityVersion: String(mutationSecurityVersion || ''),
    draftTools: clone(draftTools),
    runtimeToolNames,
    civicRuntimeToolNames: runtimeCivicTools,
    effects: clone(NO_CIVIC_EFFECT),
    checks,
    errors: checks.filter((entry) => !entry.ok).map((entry) => entry.error)
  };
}

function assertV6CivicToolExposureGateSafe(report = {}) {
  const errors = [];
  if (report.version !== V6_CIVIC_TOOL_EXPOSURE_GATE_VERSION) {
    errors.push('V6_CIVIC_TOOL_EXPOSURE_GATE_VERSION_REQUIRED');
  }
  if (report.featureFlag !== V6_WORLD_FEATURE_FLAG) {
    errors.push('V6_CIVIC_TOOL_EXPOSURE_GATE_FEATURE_FLAG_REQUIRED');
  }
  if (report.status !== 'research_only') {
    errors.push('V6_CIVIC_TOOL_EXPOSURE_RESEARCH_ONLY_REQUIRED');
  }
  if (report.runtimeExposed !== false) {
    errors.push('V6_CIVIC_TOOL_EXPOSURE_RUNTIME_HIDDEN_REQUIRED');
  }
  if (report.playerVisible !== false) {
    errors.push('V6_CIVIC_TOOL_EXPOSURE_PLAYER_HIDDEN_REQUIRED');
  }
  if (report.normalGameplayExposure !== false) {
    errors.push('V6_CIVIC_TOOL_EXPOSURE_NORMAL_GAMEPLAY_FORBIDDEN');
  }
  if (report.productionEnabled !== false) {
    errors.push('V6_CIVIC_TOOL_EXPOSURE_PRODUCTION_ENABLEMENT_FORBIDDEN');
  }
  if (report.executionStatus !== 'not_executable') {
    errors.push('V6_CIVIC_TOOL_EXPOSURE_NON_EXECUTING_REQUIRED');
  }
  if (report.releaseReady !== false) {
    errors.push('V6_CIVIC_TOOL_EXPOSURE_RELEASE_READY_FORBIDDEN');
  }
  if ((report.civicRuntimeToolNames || []).length > 0) {
    errors.push('V6_CIVIC_TOOL_RUNTIME_EXPOSURE_FORBIDDEN');
  }
  if (report.effects?.executesCivicEffect !== false) {
    errors.push('V6_CIVIC_TOOL_EXPOSURE_CIVIC_EFFECT_FORBIDDEN');
  }
  if (report.effects?.mutatesPrivateTown !== false) {
    errors.push('V6_CIVIC_TOOL_EXPOSURE_PRIVATE_TOWN_MUTATION_FORBIDDEN');
  }
  if (report.effects?.mutatesOtherUserWorld !== false) {
    errors.push('V6_CIVIC_TOOL_EXPOSURE_OTHER_USER_MUTATION_FORBIDDEN');
  }
  if (report.available === true) {
    const checkKeys = new Set((report.checks || []).map((entry) => entry.key));
    for (const key of REQUIRED_EXPOSURE_CHECKS) {
      if (!checkKeys.has(key)) errors.push(`V6_CIVIC_TOOL_EXPOSURE_CHECK_REQUIRED:${key}`);
    }
    const failedChecks = (report.checks || []).filter((entry) => entry.ok !== true);
    if (report.researchReady === true && failedChecks.length > 0) {
      errors.push('V6_CIVIC_TOOL_EXPOSURE_READY_WITH_FAILED_CHECKS');
    }
    if (report.researchReady !== true && report.failClosed !== true) {
      errors.push('V6_CIVIC_TOOL_EXPOSURE_DENIAL_FAIL_CLOSED_REQUIRED');
    }
    if (!draftsAreNonExecuting(report.draftTools || [])) {
      errors.push('V6_CIVIC_TOOL_EXPOSURE_DRAFT_EXECUTION_FORBIDDEN');
    }
  } else if (report.failClosed !== true) {
    errors.push('V6_CIVIC_TOOL_EXPOSURE_DISABLED_FAIL_CLOSED_REQUIRED');
  }
  return {
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  REQUIRED_EXPOSURE_CHECKS: [...REQUIRED_EXPOSURE_CHECKS],
  RUNTIME_TOOL_SOURCE,
  V6_CIVIC_TOOL_EXPOSURE_GATE_VERSION,
  WORKER_ORIGIN,
  assertV6CivicToolExposureGateSafe,
  buildV6CivicToolExposureGate
};
