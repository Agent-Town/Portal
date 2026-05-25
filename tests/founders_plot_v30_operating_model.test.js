const test = require('node:test');
const assert = require('node:assert/strict');
const {
  applyChooseOperatingCharter,
  applyRefreshOperatingContracts,
  applyUnlockOperatingCapability,
  createInitialPlot,
  prepareLoadedState,
  stateView
} = require('../server/founders_plot/engine');

function mutationCtx(nowMs = 10_000) {
  const events = [];
  return {
    nowMs,
    appendEvent: (event) => events.push({ ...event, createdAt: event.createdAt || nowMs }),
    events
  };
}

function makeNetworkReadyState() {
  const state = createInitialPlot({ pairId: 'pair_v30_operating', nowMs: 1_000 });
  state.plot.hqLevel = 2;
  state.plot.townXp = 50;
  state.plot.inventory = { wood: 30, stone: 0, food: 12, coin: 20 };
  state.buildings.push(
    {
      buildingId: 'bld_lumber',
      plotId: state.plot.plotId,
      type: 'LUMBER_CAMP',
      x: 0,
      y: 0,
      level: 1,
      state: 'READY',
      outputBuffer: { wood: 0, stone: 0, food: 0, coin: 0 },
      priority: 'BALANCED',
      createdAt: 1_000,
      updatedAt: 1_000
    },
    {
      buildingId: 'bld_farm',
      plotId: state.plot.plotId,
      type: 'FARM_PLOT',
      x: 1,
      y: 0,
      level: 1,
      state: 'READY',
      outputBuffer: { wood: 0, stone: 0, food: 0, coin: 0 },
      priority: 'BALANCED',
      createdAt: 1_000,
      updatedAt: 1_000
    }
  );
  state.meta.settlements.secondSettlement = {
    settlementId: 'town_2',
    plotId: 'plot_ridge_outpost',
    name: 'Ridge Outpost',
    status: 'ACTIVE',
    hqLevel: 1,
    inventory: { wood: 0, stone: 0, food: 4, coin: 6 },
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
    expeditionId: 'exp_probe',
    fromSettlementId: 'town_1',
    toSettlementId: 'town_2',
    launchedAtMs: 1_000,
    focusedAtMs: 1_000
  };
  stateView(state, []);
  return state;
}

test('V3.0 operating charter is gated until the town network is stable', () => {
  const state = createInitialPlot({ pairId: 'pair_v30_gate', nowMs: 1_000 });
  const view = stateView(state, []);

  assert.equal(view.operatingModel.gate.ready, false);
  assert.equal(view.operatingModel.allowedActions.includes('choose_charter'), false);
  assert.throws(
    () => applyChooseOperatingCharter(state, { charterId: 'STEADY_COMMONS' }, mutationCtx(11_000)),
    /OPERATING_MODEL_GATE_REQUIRED/
  );
});

test('V3.0 charter changes deterministic contract weighting and appears in recap state', () => {
  const state = makeNetworkReadyState();
  const before = stateView(state, []);
  assert.equal(before.operatingModel.gate.ready, true);
  assert.equal(before.contracts.recommendation.requesterName, 'Jasper at the Depot');

  const ctx = mutationCtx(12_000);
  const result = applyChooseOperatingCharter(state, { charterId: 'STEADY_COMMONS' }, ctx);
  assert.equal(result.operatingModel.selectedCharterId, 'STEADY_COMMONS');
  assert.equal(ctx.events.some((event) => event.type === 'OPERATING_CHARTER_CHOSEN'), true);

  const after = stateView(state, ctx.events);
  assert.equal(after.contracts.recommendation.requesterName, 'Nell from Neighbor Row');
  assert.match(after.contracts.recommendation.reason, /Steady Commons/);
  assert.match(after.recap.morningBrief.operatingModel, /Steady Commons/);
});

test('V3.0 capability unlock modifies allowed tools and gates contract refresh', () => {
  const state = makeNetworkReadyState();
  applyChooseOperatingCharter(state, { charterId: 'SWIFT_DEPOT' }, mutationCtx(13_000));

  let view = stateView(state, []);
  assert.equal(view.foreman.allowedTools.includes('et.plot.operating_model.refresh_contracts'), false);
  assert.throws(
    () => applyRefreshOperatingContracts(state, {}, mutationCtx(14_000)),
    /CAPABILITY_REQUIRED/
  );

  const unlockCtx = mutationCtx(15_000);
  const unlocked = applyUnlockOperatingCapability(state, { capabilityId: 'CHARTER_CONTRACTS' }, unlockCtx);
  assert.equal(unlocked.operatingModel.unlockedCapabilities[0].capabilityId, 'CHARTER_CONTRACTS');
  assert.equal(unlockCtx.events.some((event) => event.type === 'OPERATING_CAPABILITY_UNLOCKED'), true);

  view = stateView(state, unlockCtx.events);
  assert.equal(view.foreman.allowedTools.includes('et.plot.operating_model.refresh_contracts'), true);
  assert.equal(view.operatingModel.allowedActions.includes('refresh_contracts'), true);

  const refreshCtx = mutationCtx(16_000);
  const refreshed = applyRefreshOperatingContracts(state, {}, refreshCtx);
  assert.match(refreshed.contracts.recommendation.reason, /Swift Depot/);
  assert.equal(refreshCtx.events.some((event) => event.type === 'OPERATING_CONTRACTS_REFRESHED'), true);
});

test('V3.0 migration adds operating model state to older towns', () => {
  const old = createInitialPlot({ pairId: 'pair_v30_migrate', nowMs: 1_000 });
  old.meta.schemaVersion = 9;
  old.meta.operatingModel = undefined;

  const migrated = prepareLoadedState(old);
  assert.equal(migrated.fromVersion, 9);
  assert.equal(migrated.toVersion, 14);
  assert.equal(migrated.state.meta.operatingModel.version, 'v3.0');
  assert.equal(migrated.state.meta.operatingModel.selectedCharterId, '');
});
