const test = require('node:test');
const assert = require('node:assert/strict');
const {
  applyAcceptRegionalContract,
  applyAssignSpecialist,
  applyChooseOperatingCharter,
  applyOpenRegionalSupplyRoute,
  applySetForemanDoctrineRule,
  applyTransferRegionalSupplyRoute,
  buildOperatingStyleCard,
  compareOperatingStyleCards,
  createInitialPlot,
  stateView
} = require('../server/founders_plot/engine');

function mutationCtx(nowMs = 10_000) {
  const events = [];
  return {
    nowMs,
    appendEvent: (event) => events.push({ ...event, seq: events.length + 1, createdAt: event.createdAt || nowMs }),
    events
  };
}

function makeShareReadyState() {
  const state = createInitialPlot({ pairId: 'pair_v40_operating_style', nowMs: 1_000 });
  state.plot.hqLevel = 2;
  state.plot.townXp = 50;
  state.plot.inventory = { wood: 16, stone: 0, food: 12, coin: 20 };
  state.meta.settlements.secondSettlement = {
    settlementId: 'town_2',
    plotId: 'plot_ridge_outpost',
    name: 'Ridge Outpost',
    role: 'second_settlement',
    status: 'ACTIVE',
    hqLevel: 1,
    inventory: { wood: 2, stone: 0, food: 4, coin: 6 },
    storageCaps: { wood: 60, stone: 60, food: 60, coin: 999 },
    buildings: [{ buildingId: 'outpost_camp', type: 'OUTPOST_CAMP', label: 'Outpost Camp', level: 1, state: 'READY' }],
    foundingTasks: [],
    events: [],
    readiness: 1,
    createdAtMs: 1_000,
    updatedAtMs: 1_000
  };
  state.meta.settlements.expedition = {
    status: 'LAUNCHED',
    expeditionId: 'exp_v40',
    fromSettlementId: 'town_1',
    toSettlementId: 'town_2',
    launchedAtMs: 1_000,
    focusedAtMs: 1_000
  };
  state.meta.governance.persistent = {
    runtimeId: 'pfr_v40_ready',
    status: 'ACTIVE',
    scope: 'collect_ready_outputs',
    authorizationId: 'pfa_v40_ready',
    authorizedBy: 'HUMAN_UNLOCKED_BRAIN',
    requiresUnlockedBrain: true,
    startedAtMs: 1_500,
    pausedAtMs: 0,
    expiresAtMs: 120_000,
    lastTickAtMs: 1_600,
    nextTickAtMs: 60_000,
    actionCount: 1,
    lastResult: { reason: 'COLLECTED_READY_OUTPUT' },
    lastErrorCode: ''
  };
  applyChooseOperatingCharter(state, { charterId: 'STEADY_COMMONS', source: 'test' }, mutationCtx(2_000));
  applySetForemanDoctrineRule(state, { ruleId: 'PREFER_RESERVES', enabled: true, source: 'test' }, mutationCtx(3_000));
  applyAssignSpecialist(state, { roleId: 'QUARTERMASTER', domainId: 'supplies', source: 'test' }, mutationCtx(4_000));
  applyOpenRegionalSupplyRoute(state, { routeId: 'founders_ridge_supply_route' }, mutationCtx(5_000));
  applyAcceptRegionalContract(state, { contractId: 'ridge_timber_bridge' }, mutationCtx(6_000));
  applyTransferRegionalSupplyRoute(state, {
    routeId: 'founders_ridge_supply_route',
    fromSettlementId: 'town_1',
    toSettlementId: 'town_2'
  }, mutationCtx(7_000));
  state.meta.foremanRuntime = {
    apiKey: 'sk-test-current-secret',
    provider: 'private-provider',
    model: 'private-model',
    runtimeId: 'runtime_private'
  };
  state.meta.foremanReceipts = [{ body: 'private log line', event: 'hidden_event' }];
  state.meta.privateEvents = [{ token: 'bearer-hidden' }];
  stateView(state, []);
  return state;
}

test('V4.0 operating style card exports public town-running style without private runtime data', () => {
  const state = makeShareReadyState();
  const card = buildOperatingStyleCard(state, { nowMs: 20_000 });
  const serialized = JSON.stringify(card).toLowerCase();

  assert.equal(card.schemaVersion, 'founders-plot.operating-style-card.v1');
  assert.equal(card.charter.label, 'Steady Commons');
  assert.equal(card.doctrine.activeRules[0].ruleId, 'PREFER_RESERVES');
  assert.equal(card.specialists.assignments[0].roleId, 'QUARTERMASTER');
  assert.equal(card.regionalNetwork.activeRouteCount, 1);
  assert.equal(card.shareSafety.shareable, true);
  assert.equal(card.shareSafety.styleOnly, true);
  assert.ok(card.styleTags.includes('Steady Commons'));
  assert.ok(!serialized.includes('sk-test-current-secret'));
  assert.ok(!serialized.includes('private-provider'));
  assert.ok(!serialized.includes('private-model'));
  assert.ok(!serialized.includes('runtime_private'));
  assert.ok(!serialized.includes('bearer-hidden'));
  assert.ok(!serialized.includes('hidden_event'));
});

test('V4.0 imported operating style comparison is inspiration only and sanitizes hostile fields', () => {
  const current = buildOperatingStyleCard(makeShareReadyState(), { nowMs: 20_000 });
  const comparison = compareOperatingStyleCards(current, {
    title: 'secret sk-test-imported',
    publicId: 'wallet private imported',
    charter: {
      charterId: 'SWIFT_DEPOT',
      label: 'Swift Depot',
      summary: 'provider model token should disappear'
    },
    doctrine: {
      activeRules: [{ ruleId: 'PREFER_SPEED', summary: 'private log' }],
      summary: 'brain runtime trace'
    },
    specialists: {
      assignments: [{ roleId: 'BUILDER_FOREMAN', domainId: 'construction' }],
      summary: 'api key leak'
    },
    regionalNetwork: { activeRouteCount: 99, summary: 'bearer token route' },
    styleTags: ['Swift Depot', 'apiKey=sk-test-imported', 'Fast logistics'],
    resources: { wood: 999 },
    buildings: [{ type: 'MARKET_STALL' }],
    capabilities: ['ADMIN_UNLOCK']
  });
  const serialized = JSON.stringify(comparison).toLowerCase();

  assert.equal(comparison.grants.resources, false);
  assert.equal(comparison.grants.buildings, false);
  assert.equal(comparison.grants.permissions, false);
  assert.equal(comparison.grants.capabilities, false);
  assert.equal(comparison.sameCharter, false);
  assert.ok(comparison.imported.styleTags.includes('Fast logistics'));
  assert.ok(!serialized.includes('sk-test-imported'));
  assert.ok(!serialized.includes('apikey'));
  assert.ok(!serialized.includes('bearer token'));
  assert.ok(!serialized.includes('admin_unlock'));
});
