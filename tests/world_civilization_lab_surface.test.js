const test = require('node:test');
const assert = require('node:assert/strict');

const { V6_WORLD_FEATURE_FLAG, parseWorldGridFeatureFlags } = require('../server/world_grid/feature_flags');
const {
  REQUIRED_DEBUG_TABS,
  REQUIRED_LAB_EVIDENCE_CHECKS,
  REQUIRED_LAB_READINESS_CHECKS,
  REQUIRED_LAB_VISUAL_WIDTHS,
  V6_LAB_PANEL_IDS,
  V6_LAB_STANDALONE_PATHS,
  assertV6LabLaunchPlanSafe,
  assertV6LabReadinessGateSafe,
  assertV6LabSurfaceSafe,
  buildV6LabModalLaunchPlan,
  buildV6LabReadinessGate,
  buildV6LabSurfaceContract
} = require('../server/world_civilization/lab_surface');

function labReadinessEvidence(overrides = {}) {
  return {
    status: 'complete',
    executionStatus: 'not_executable',
    runtimeExposed: false,
    playerVisible: false,
    normalGameplayExposure: false,
    standaloneRouteAllowed: false,
    civicEffectsEnabled: false,
    mutatesPrivateTown: false,
    mutatesOtherUserWorld: false,
    exposesPrivateDebugData: false,
    townHubModalLaunch: true,
    standaloneRouteDenied: true,
    workerContinuityProven: true,
    debugObservabilityProven: true,
    browserVisualCoverage: true,
    accessibilityReviewed: true,
    runtimeToolExposureBlocked: true,
    checks: [...REQUIRED_LAB_EVIDENCE_CHECKS],
    debugTabs: [...REQUIRED_DEBUG_TABS],
    visualWidths: [...REQUIRED_LAB_VISUAL_WIDTHS],
    ...overrides
  };
}

test('V6 lab surface is hidden without explicit research opt-in and V6 flag', () => {
  const withoutResearchOptIn = buildV6LabSurfaceContract({
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true }
  });
  const withoutV6Flag = buildV6LabSurfaceContract({
    includeResearchLab: true,
    featureFlags: {}
  });

  for (const contract of [withoutResearchOptIn, withoutV6Flag]) {
    assert.equal(contract.available, false);
    assert.equal(contract.runtimeExposed, false);
    assert.equal(contract.playerVisible, false);
    assert.equal(contract.standaloneRouteAllowed, false);
    assert.equal(contract.mountMode, 'modal');
    assert.equal(contract.executionStatus, 'not_executable');
    assert.deepEqual(contract.requiredDebugTabs, []);
    assert.deepEqual(contract.panels, []);
    assert.deepEqual(assertV6LabSurfaceSafe(contract), { ok: true, errors: [] });
  }
});

test('V6 lab surface contract is modal-only, observable, and non-executing when enabled', () => {
  const contract = buildV6LabSurfaceContract({
    includeResearchLab: true,
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    source: 'node_test'
  });

  assert.equal(contract.available, true);
  assert.equal(contract.source, 'node_test');
  assert.equal(contract.runtimeExposed, false);
  assert.equal(contract.playerVisible, false);
  assert.equal(contract.standaloneRouteAllowed, false);
  assert.equal(contract.mountMode, 'modal');
  assert.equal(contract.launchSurface, 'town_hub_modal');
  assert.equal(contract.requiresWorkerContinuity, true);
  assert.deepEqual(contract.requiredDebugTabs, REQUIRED_DEBUG_TABS);
  assert.deepEqual(contract.panels.map((panel) => panel.id), V6_LAB_PANEL_IDS);
  assert.deepEqual(contract.effects, {
    executesCivicEffect: false,
    mutatesPrivateTown: false,
    mutatesOtherUserWorld: false
  });
  assert.equal(contract.executionStatus, 'not_executable');
  assert.deepEqual(assertV6LabSurfaceSafe(contract), { ok: true, errors: [] });
});

test('V6 lab modal launch plan opens only from the town hub modal context', () => {
  const plan = buildV6LabModalLaunchPlan({
    includeResearchLab: true,
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    requestPath: '/app?district=town',
    launchSurface: 'town_hub_modal',
    source: 'node_test'
  });

  assert.equal(plan.available, true);
  assert.equal(plan.allowed, true);
  assert.equal(plan.failClosed, false);
  assert.equal(plan.routeAction, 'open_modal');
  assert.equal(plan.modalId, 'v6-research-lab');
  assert.equal(plan.mountMode, 'modal');
  assert.equal(plan.launchSurface, 'town_hub_modal');
  assert.equal(plan.requestPath, '/app');
  assert.equal(plan.standaloneRouteAllowed, false);
  assert.equal(plan.preservesWorkerContinuity, true);
  assert.deepEqual(plan.requiredDebugTabs, REQUIRED_DEBUG_TABS);
  assert.deepEqual(plan.missingDebugTabs, []);
  assert.deepEqual(plan.panels.map((panel) => panel.id), V6_LAB_PANEL_IDS);
  assert.equal(plan.executionStatus, 'not_executable');
  assert.deepEqual(assertV6LabLaunchPlanSafe(plan), { ok: true, errors: [] });
});

test('V6 lab modal launch plan fails closed for standalone routes and missing debug tabs', () => {
  for (const path of V6_LAB_STANDALONE_PATHS) {
    const standalone = buildV6LabModalLaunchPlan({
      includeResearchLab: true,
      featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
      requestPath: `${path}?open=1`
    });
    assert.equal(standalone.allowed, false);
    assert.equal(standalone.failClosed, true);
    assert.equal(standalone.routeAction, 'redirect_to_town_hub');
    assert.equal(standalone.redirectPath, '/app');
    assert.equal(standalone.preservesWorkerContinuity, false);
    assert.match(standalone.reason, /standalone route is forbidden/);
    assert.deepEqual(assertV6LabLaunchPlanSafe(standalone), { ok: true, errors: [] });
  }

  const missingTabs = buildV6LabModalLaunchPlan({
    includeResearchLab: true,
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    requestPath: '/app',
    debugTabsAvailable: ['Worker Tools', 'Brain']
  });
  assert.equal(missingTabs.allowed, false);
  assert.equal(missingTabs.failClosed, true);
  assert.equal(missingTabs.routeAction, 'deny');
  assert.match(missingTabs.reason, /debug observability/);
  assert.deepEqual(missingTabs.missingDebugTabs, ['Skill Context', 'Worker Traffic', 'Session Context']);
  assert.deepEqual(assertV6LabLaunchPlanSafe(missingTabs), { ok: true, errors: [] });
});

test('V6 lab safety assertion fails closed for route, visibility, debug, and mutation drift', () => {
  const unsafe = {
    ...buildV6LabSurfaceContract({
      includeResearchLab: true,
      featureFlags: { [V6_WORLD_FEATURE_FLAG]: true }
    }),
    runtimeExposed: true,
    playerVisible: true,
    standaloneRouteAllowed: true,
    mountMode: 'page',
    launchSurface: '/v6',
    requiresWorkerContinuity: false,
    requiredDebugTabs: ['Worker Tools'],
    effects: {
      executesCivicEffect: true,
      mutatesPrivateTown: true,
      mutatesOtherUserWorld: true
    },
    panels: [{ id: 'effects', executionStatus: 'executes' }],
    executionStatus: 'executes'
  };
  const result = assertV6LabSurfaceSafe(unsafe);

  assert.equal(result.ok, false);
  assert.match(result.errors.join(','), /V6_LAB_RUNTIME_HIDDEN_REQUIRED/);
  assert.match(result.errors.join(','), /V6_LAB_PLAYER_HIDDEN_REQUIRED/);
  assert.match(result.errors.join(','), /V6_LAB_STANDALONE_ROUTE_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_LAB_MODAL_MOUNT_REQUIRED/);
  assert.match(result.errors.join(','), /V6_LAB_TOWN_HUB_LAUNCH_REQUIRED/);
  assert.match(result.errors.join(','), /V6_LAB_WORKER_CONTINUITY_REQUIRED/);
  assert.match(result.errors.join(','), /V6_LAB_DEBUG_TABS_REQUIRED/);
  assert.match(result.errors.join(','), /V6_LAB_CIVIC_EFFECT_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_LAB_PRIVATE_TOWN_MUTATION_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_LAB_OTHER_USER_MUTATION_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_LAB_PANEL_EXECUTION_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_LAB_NON_EXECUTING_REQUIRED/);

  const unsafeLaunch = {
    ...buildV6LabModalLaunchPlan({
      includeResearchLab: true,
      featureFlags: { [V6_WORLD_FEATURE_FLAG]: true }
    }),
    requestPath: '/v6',
    standaloneRouteAllowed: true,
    routeAction: 'render_page',
    mountMode: 'page',
    launchSurface: '/v6',
    preservesWorkerContinuity: false,
    effects: {
      executesCivicEffect: true,
      mutatesPrivateTown: true,
      mutatesOtherUserWorld: true
    },
    executionStatus: 'executes'
  };
  const launchResult = assertV6LabLaunchPlanSafe(unsafeLaunch);
  assert.equal(launchResult.ok, false);
  assert.match(launchResult.errors.join(','), /V6_LAB_LAUNCH_STANDALONE_ROUTE_FORBIDDEN/);
  assert.match(launchResult.errors.join(','), /V6_LAB_LAUNCH_MODAL_REQUIRED/);
  assert.match(launchResult.errors.join(','), /V6_LAB_LAUNCH_STANDALONE_ALLOWED/);
  assert.match(launchResult.errors.join(','), /V6_LAB_LAUNCH_WORKER_CONTINUITY_REQUIRED/);
  assert.match(launchResult.errors.join(','), /V6_LAB_LAUNCH_NON_EXECUTING_REQUIRED/);
});

test('broad V5 feature overrides do not enable the V6 lab surface accidentally', () => {
  const v5All = buildV6LabSurfaceContract({
    includeResearchLab: true,
    featureFlags: parseWorldGridFeatureFlags('all')
  });
  const v60 = buildV6LabSurfaceContract({
    includeResearchLab: true,
    featureFlags: parseWorldGridFeatureFlags('v60')
  });

  assert.equal(v5All.available, false);
  assert.equal(v5All.playerVisible, false);
  assert.deepEqual(v5All.panels, []);
  assert.deepEqual(assertV6LabSurfaceSafe(v5All), { ok: true, errors: [] });
  assert.equal(buildV6LabModalLaunchPlan({
    includeResearchLab: true,
    featureFlags: parseWorldGridFeatureFlags('all')
  }).allowed, false);

  assert.equal(v60.available, true);
  assert.deepEqual(v60.panels.map((panel) => panel.id), V6_LAB_PANEL_IDS);
  assert.deepEqual(assertV6LabSurfaceSafe(v60), { ok: true, errors: [] });
  assert.equal(buildV6LabModalLaunchPlan({
    includeResearchLab: true,
    featureFlags: parseWorldGridFeatureFlags('v60')
  }).allowed, true);
});

test('V6 lab readiness gate is hidden without explicit research opt-in and V6 flag', () => {
  const withoutResearchOptIn = buildV6LabReadinessGate({
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    evidence: labReadinessEvidence()
  });
  const broadV5Override = buildV6LabReadinessGate({
    includeResearchLabReadiness: true,
    featureFlags: parseWorldGridFeatureFlags('all'),
    evidence: labReadinessEvidence()
  });

  for (const report of [withoutResearchOptIn, broadV5Override]) {
    assert.equal(report.available, false);
    assert.equal(report.researchReady, false);
    assert.equal(report.releaseReady, false);
    assert.equal(report.failClosed, true);
    assert.equal(report.runtimeExposed, false);
    assert.equal(report.playerVisible, false);
    assert.equal(report.normalGameplayExposure, false);
    assert.equal(report.standaloneRouteAllowed, false);
    assert.equal(report.civicEffectsEnabled, false);
    assert.equal(report.mutatesPrivateTown, false);
    assert.equal(report.mutatesOtherUserWorld, false);
    assert.equal(report.exposesPrivateDebugData, false);
    assert.deepEqual(report.checks, []);
    assert.deepEqual(assertV6LabReadinessGateSafe(report), { ok: true, errors: [] });
  }
});

test('V6 lab readiness gate records modal visual accessibility and observability evidence without exposure', () => {
  const report = buildV6LabReadinessGate({
    includeResearchLabReadiness: true,
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    source: 'node_test',
    evidence: labReadinessEvidence()
  });

  assert.equal(report.available, true);
  assert.equal(report.source, 'node_test');
  assert.equal(report.researchReady, true);
  assert.equal(report.releaseReady, false);
  assert.equal(report.failClosed, false);
  assert.equal(report.runtimeExposed, false);
  assert.equal(report.playerVisible, false);
  assert.equal(report.normalGameplayExposure, false);
  assert.equal(report.standaloneRouteAllowed, false);
  assert.equal(report.civicEffectsEnabled, false);
  assert.equal(report.mutatesPrivateTown, false);
  assert.equal(report.mutatesOtherUserWorld, false);
  assert.equal(report.exposesPrivateDebugData, false);
  assert.equal(report.executionStatus, 'not_executable');
  assert.deepEqual(report.checks.map((entry) => entry.key), REQUIRED_LAB_READINESS_CHECKS);
  assert.equal(report.evidence.ok, true);
  assert.deepEqual(report.evidence.missingChecks, []);
  assert.deepEqual(report.evidence.missingDebugTabs, []);
  assert.deepEqual(report.evidence.missingVisualWidths, []);
  assert.deepEqual(assertV6LabReadinessGateSafe(report), { ok: true, errors: [] });
});

test('V6 lab readiness gate fails closed without visual accessibility worker and debug evidence', () => {
  const report = buildV6LabReadinessGate({
    includeResearchLabReadiness: true,
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    evidence: labReadinessEvidence({
      checks: REQUIRED_LAB_EVIDENCE_CHECKS.filter((check) => (
        check !== 'worker_continuity'
        && check !== 'browser_visual_768'
        && check !== 'keyboard_accessibility'
        && check !== 'runtime_tool_absence'
      )),
      debugTabs: REQUIRED_DEBUG_TABS.filter((tab) => tab !== 'Worker Traffic'),
      visualWidths: REQUIRED_LAB_VISUAL_WIDTHS.filter((width) => width !== 768),
      workerContinuityProven: false,
      browserVisualCoverage: false,
      accessibilityReviewed: false,
      runtimeToolExposureBlocked: false
    })
  });

  assert.equal(report.available, true);
  assert.equal(report.researchReady, false);
  assert.equal(report.failClosed, true);
  assert.deepEqual(report.evidence.missingChecks, [
    'worker_continuity',
    'browser_visual_768',
    'keyboard_accessibility',
    'runtime_tool_absence'
  ]);
  assert.deepEqual(report.evidence.missingDebugTabs, ['Worker Traffic']);
  assert.deepEqual(report.evidence.missingVisualWidths, [768]);
  assert.deepEqual(report.errors, [
    'V6_LAB_MODAL_EVIDENCE_REQUIRED',
    'V6_LAB_WORKER_CONTINUITY_EVIDENCE_REQUIRED',
    'V6_LAB_BROWSER_VISUAL_COVERAGE_REQUIRED',
    'V6_LAB_ACCESSIBILITY_REVIEW_REQUIRED',
    'V6_LAB_RUNTIME_TOOL_EXPOSURE_FORBIDDEN'
  ]);
  assert.deepEqual(assertV6LabReadinessGateSafe(report), { ok: true, errors: [] });
});

test('V6 lab readiness assertion rejects fake visible executable lab readiness', () => {
  const report = buildV6LabReadinessGate({
    includeResearchLabReadiness: true,
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    evidence: labReadinessEvidence()
  });
  const unsafe = {
    ...report,
    runtimeExposed: true,
    playerVisible: true,
    normalGameplayExposure: true,
    standaloneRouteAllowed: true,
    civicEffectsEnabled: true,
    mutatesPrivateTown: true,
    mutatesOtherUserWorld: true,
    exposesPrivateDebugData: true,
    releaseReady: true,
    executionStatus: 'executes',
    evidence: {
      ...report.evidence,
      runtimeExposed: true,
      playerVisible: true,
      normalGameplayExposure: true,
      standaloneRouteAllowed: true,
      civicEffectsEnabled: true,
      mutatesPrivateTown: true,
      mutatesOtherUserWorld: true,
      exposesPrivateDebugData: true
    }
  };
  const result = assertV6LabReadinessGateSafe(unsafe);

  assert.equal(result.ok, false);
  assert.match(result.errors.join(','), /V6_LAB_READINESS_RUNTIME_HIDDEN_REQUIRED/);
  assert.match(result.errors.join(','), /V6_LAB_READINESS_PLAYER_HIDDEN_REQUIRED/);
  assert.match(result.errors.join(','), /V6_LAB_READINESS_NORMAL_GAMEPLAY_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_LAB_READINESS_STANDALONE_ROUTE_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_LAB_READINESS_CIVIC_EFFECT_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_LAB_READINESS_PRIVATE_TOWN_MUTATION_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_LAB_READINESS_OTHER_USER_MUTATION_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_LAB_READINESS_PRIVATE_DEBUG_DATA_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_LAB_READINESS_NON_EXECUTING_REQUIRED/);
  assert.match(result.errors.join(','), /V6_LAB_READINESS_RELEASE_READY_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_LAB_READINESS_EVIDENCE_STANDALONE_ROUTE_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_LAB_READINESS_EVIDENCE_PRIVATE_DEBUG_DATA_FORBIDDEN/);
});
