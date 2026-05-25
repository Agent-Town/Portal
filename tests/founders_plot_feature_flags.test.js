const test = require('node:test');
const assert = require('node:assert/strict');

const {
  FUTURE_FEATURES,
  emptyFeatureFlags,
  filterToolSpecs,
  isToolEnabled,
  parseExplicitFeatureFlags,
  stripDisabledFutureState
} = require('../server/founders_plot/feature_flags');
const { FOUNDERS_PLOT_TOOL_SPECS } = require('../server/founders_plot/tools');
const { createSceneState } = require('../public/experiences/founders-plot/scene_state.js');

function futurePayload() {
  return {
    featureFlags: emptyFeatureFlags(true),
    scenarios: { offers: [{ scenarioId: 'scenario_1', title: 'Storm Prep' }], active: null, completed: [] },
    townPostcards: { available: true, latest: { captureId: 'postcard_1' } },
    settlements: {
      summary: 'Launch Ridge Outpost.',
      activeSettlementId: 'town_2',
      settlements: [
        { settlementId: 'town_1', name: 'Founders Plot' },
        { settlementId: 'town_2', name: 'Ridge Outpost' }
      ],
      expedition: { status: 'READY' }
    },
    operatingModel: { selectedCharterId: 'steady', charter: { label: 'Steady Charter' } },
    regionalNetwork: { routes: [{ routeId: 'ridge_route', status: 'ACTIVE', label: 'Ridge Route' }] },
    creatorExtensions: { installed: [{ extensionId: 'creator_notice_kiosk', active: true, label: 'Creator Notice Kiosk' }] },
    foreman: {
      allowedTools: FOUNDERS_PLOT_TOOL_SPECS.map((tool) => tool.name),
      governance: { openExceptions: [{ exceptionId: 'exc_1' }] },
      doctrine: { activeRules: [{ ruleId: 'prefer_reserves' }] },
      specialists: { assignments: [{ roleId: 'builder' }] },
      pendingApprovals: [],
      runtime: { status: 'NOT_STARTED' }
    }
  };
}

function sceneView(flags = emptyFeatureFlags(false)) {
  return {
    ...futurePayload(),
    featureFlags: flags,
    progress: { currentLevel: 5, next: { ratio: 1, xpCurrent: 100, xpRequired: 100 } },
    plot: {
      hqLevel: 5,
      townXp: 100,
      inventory: { wood: 80, stone: 60, food: 40, coin: 80 }
    },
    unlocks: { buildingTypes: ['LUMBER_CAMP', 'FARM_PLOT'] },
    currentGoal: {
      title: 'Keep building',
      body: 'Continue the first-hour loop.',
      owner: 'tutorial',
      primaryAction: { type: 'VIEW_CONTRACT_BOARD' }
    },
    quest: {
      title: 'Keep building',
      body: 'Continue the first-hour loop.',
      primaryAction: { type: 'VIEW_CONTRACT_BOARD' }
    },
    contracts: { boardLocked: false, offers: [], activeContract: null, completed: [] },
    townOpportunity: { active: null, completed: [] },
    landmarks: {
      publicSquare: {
        level: 1,
        styleId: 'garden',
        styleLabel: 'Garden Square',
        style: { styleId: 'garden', label: 'Garden Square', palette: { tint: '#9cc76d' } },
        availableStyles: [{ styleId: 'garden', label: 'Garden Square' }]
      }
    },
    recap: { unseenCount: 0 },
    rewards: [],
    pads: [{ x: 0, y: 0, occupied: false, label: 'Northwest Pad' }],
    buildings: [
      {
        buildingId: 'hq_1',
        type: 'HQ',
        x: 1,
        y: 1,
        level: 5,
        state: 'READY',
        outputBuffer: {},
        completedJobs: [],
        runningJob: null
      }
    ],
    jobs: []
  };
}

test('explicit Founders Plot feature flag parser supports all and V1.5-only modes', () => {
  const all = parseExplicitFeatureFlags('all');
  assert.ok(FUTURE_FEATURES.every((feature) => all[feature.key] === true));

  const none = parseExplicitFeatureFlags('none');
  assert.ok(FUTURE_FEATURES.every((feature) => none[feature.key] === false));

  const partial = parseExplicitFeatureFlags('v16,FEATURE_FOUNDERS_V45_CREATOR_BUILDINGS');
  assert.equal(partial.FEATURE_FOUNDERS_V16_SCENARIOS, true);
  assert.equal(partial.FEATURE_FOUNDERS_V45_CREATOR_BUILDINGS, true);
  assert.equal(partial.FEATURE_FOUNDERS_V35_REGIONAL_GOVERNANCE, false);
});

test('disabled future flags strip future payloads and tool availability', () => {
  const flags = emptyFeatureFlags(false);
  const stripped = stripDisabledFutureState(futurePayload(), flags);

  assert.equal(stripped.scenarios, undefined);
  assert.equal(stripped.townPostcards, undefined);
  assert.equal(stripped.settlements, undefined);
  assert.equal(stripped.operatingModel, undefined);
  assert.equal(stripped.regionalNetwork, undefined);
  assert.equal(stripped.creatorExtensions, undefined);
  assert.equal(stripped.foreman.governance, undefined);
  assert.equal(stripped.foreman.doctrine, undefined);
  assert.equal(stripped.foreman.specialists, undefined);

  const filteredTools = filterToolSpecs(FOUNDERS_PLOT_TOOL_SPECS, flags).map((tool) => tool.name);
  assert.equal(filteredTools.includes('et.plot.scenarios.start'), false);
  assert.equal(filteredTools.includes('et.plot.creator.install_building'), false);
  assert.equal(isToolEnabled('et.plot.collect_outputs', flags), true);
});

test('disabled future flags keep future objects and coverage out of Three.js scene state', () => {
  const scene = createSceneState(sceneView(emptyFeatureFlags(false)));
  const objectIds = scene.objects.map((object) => object.id);
  const domainIds = scene.stateCoverage.domains.map((domain) => domain.id);
  const anchorIds = scene.stateCoverage.anchors.map((anchor) => anchor.id);

  assert.equal(objectIds.includes('SCENARIO_SITE'), false);
  assert.equal(objectIds.includes('GOVERNOR_LEDGER'), false);
  assert.equal(objectIds.includes('SETTLEMENT_NODE_TOWN_2'), false);
  assert.equal(objectIds.includes('CREATOR_NOTICE_KIOSK'), false);
  assert.equal(domainIds.includes('civic-scenarios'), false);
  assert.equal(domainIds.includes('settlements'), false);
  assert.equal(domainIds.includes('regional-network'), false);
  assert.equal(domainIds.includes('creator-extensions'), false);
  assert.equal(anchorIds.includes('STATE:scenarios'), false);
  assert.equal(scene.regionalRoutes.length, 0);
  assert.equal(scene.regionalMap.enabled, false);
});
