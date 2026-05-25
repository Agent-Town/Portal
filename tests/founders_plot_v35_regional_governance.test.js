const test = require('node:test');
const assert = require('node:assert/strict');
const {
  applyAcceptRegionalContract,
  applyOpenRegionalSupplyRoute,
  applyTransferRegionalSupplyRoute,
  applyTurnInRegionalContract,
  createInitialPlot,
  prepareLoadedState,
  regionalLedgerView,
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

function totalWood(state) {
  return Number(state.plot.inventory.wood || 0) + Number(state.meta.settlements.secondSettlement?.inventory?.wood || 0);
}

function makeRegionalReadyState() {
  const state = createInitialPlot({ pairId: 'pair_v35_regional', nowMs: 1_000 });
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
    expeditionId: 'exp_v35',
    fromSettlementId: 'town_1',
    toSettlementId: 'town_2',
    launchedAtMs: 1_000,
    focusedAtMs: 1_000
  };
  state.meta.operatingModel.selectedCharterId = 'STEADY_COMMONS';
  state.meta.operatingModel.selectedAtMs = 2_000;
  state.meta.specialists.roles.QUARTERMASTER = {
    roleId: 'QUARTERMASTER',
    status: 'ACTIVE',
    domainId: 'supplies',
    assignedAtMs: 3_000
  };
  stateView(state, []);
  return state;
}

test('V3.5 regional governance is gated behind an active outpost, charter, and staffed specialist lane', () => {
  const state = createInitialPlot({ pairId: 'pair_v35_gate', nowMs: 1_000 });
  const view = regionalLedgerView(state, { nowMs: 2_000 });

  assert.equal(view.gate.ready, false);
  assert.equal(view.allowedActions.includes('open_supply_route'), false);
  assert.throws(
    () => applyOpenRegionalSupplyRoute(state, { routeId: 'founders_ridge_supply_route' }, mutationCtx(3_000)),
    /REGIONAL_GATE_REQUIRED/
  );
});

test('V3.5 supply route transfers resources deterministically and conserves cross-town resources', () => {
  const state = makeRegionalReadyState();
  const opened = applyOpenRegionalSupplyRoute(state, { routeId: 'founders_ridge_supply_route' }, mutationCtx(4_000));
  assert.equal(opened.regionalNetwork.routes[0].status, 'ACTIVE');

  const accepted = applyAcceptRegionalContract(state, { contractId: 'ridge_timber_bridge' }, mutationCtx(5_000));
  assert.equal(accepted.regionalNetwork.contracts[0].status, 'ACTIVE');

  const woodBefore = totalWood(state);
  const transferred = applyTransferRegionalSupplyRoute(state, {
    routeId: 'founders_ridge_supply_route',
    fromSettlementId: 'town_1',
    toSettlementId: 'town_2'
  }, mutationCtx(6_000));

  assert.equal(transferred.transfer.status, 'TRANSFERRED');
  assert.equal(totalWood(state), woodBefore);
  assert.equal(state.plot.inventory.wood, 12);
  assert.equal(state.meta.settlements.secondSettlement.inventory.wood, 6);
  assert.equal(transferred.regionalNetwork.contracts[0].status, 'READY_TO_TURN_IN');

  const xpBefore = state.plot.townXp;
  const completed = applyTurnInRegionalContract(state, { contractId: 'ridge_timber_bridge' }, mutationCtx(7_000));
  assert.equal(completed.regionalNetwork.contracts[0].status, 'COMPLETED');
  assert.equal(state.plot.inventory.coin, 30);
  assert.equal(state.plot.townXp, xpBefore + 12);
});

test('V3.5 route shortage is visible and recoverable without losing resources', () => {
  const state = makeRegionalReadyState();
  state.plot.inventory.wood = 0;
  applyOpenRegionalSupplyRoute(state, { routeId: 'founders_ridge_supply_route' }, mutationCtx(4_000));
  const woodBefore = totalWood(state);

  const shortage = applyTransferRegionalSupplyRoute(state, {
    routeId: 'founders_ridge_supply_route',
    fromSettlementId: 'town_1',
    toSettlementId: 'town_2'
  }, mutationCtx(5_000));
  assert.equal(shortage.transfer.status, 'SHORTAGE');
  assert.equal(totalWood(state), woodBefore);
  assert.equal(shortage.regionalNetwork.routes[0].status, 'SHORTAGE');
  assert.equal(shortage.regionalNetwork.pendingIssueCount, 1);

  state.plot.inventory.wood = 8;
  const recovered = applyTransferRegionalSupplyRoute(state, {
    routeId: 'founders_ridge_supply_route',
    fromSettlementId: 'town_1',
    toSettlementId: 'town_2'
  }, mutationCtx(6_000));
  assert.equal(recovered.transfer.status, 'TRANSFERRED');
  assert.equal(recovered.regionalNetwork.routes[0].status, 'ACTIVE');
  assert.equal(recovered.regionalNetwork.issues.some((issue) => issue.type === 'route_shortage'), false);
});

test('V3.5 route cannot transfer from the wrong town', () => {
  const state = makeRegionalReadyState();
  applyOpenRegionalSupplyRoute(state, { routeId: 'founders_ridge_supply_route' }, mutationCtx(4_000));

  assert.throws(
    () => applyTransferRegionalSupplyRoute(state, {
      routeId: 'founders_ridge_supply_route',
      fromSettlementId: 'town_2',
      toSettlementId: 'town_1'
    }, mutationCtx(5_000)),
    /REGIONAL_ROUTE_FORBIDDEN/
  );
});

test('V3.5 regional state restores from loaded account state', () => {
  const old = makeRegionalReadyState();
  old.meta.schemaVersion = 11;
  old.meta.regionalNetwork = undefined;

  const migrated = prepareLoadedState(old);
  assert.equal(migrated.fromVersion, 11);
  assert.equal(migrated.toVersion, 14);
  const view = regionalLedgerView(migrated.state, { nowMs: 6_000 });
  assert.equal(view.version, 'v3.5');
  assert.equal(view.routes[0].routeId, 'founders_ridge_supply_route');
});
