const test = require('node:test');
const assert = require('node:assert/strict');

const { V6_WORLD_FEATURE_FLAG, parseWorldGridFeatureFlags } = require('../server/world_grid/feature_flags');
const {
  REQUIRED_DEBUG_TABS,
  V6_LAB_PANEL_IDS,
  assertV6LabSurfaceSafe,
  buildV6LabSurfaceContract
} = require('../server/world_civilization/lab_surface');

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

  assert.equal(v60.available, true);
  assert.deepEqual(v60.panels.map((panel) => panel.id), V6_LAB_PANEL_IDS);
  assert.deepEqual(assertV6LabSurfaceSafe(v60), { ok: true, errors: [] });
});
