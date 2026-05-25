const test = require('node:test');
const assert = require('node:assert/strict');
const {
  applyCompleteSettlementFoundingTask,
  applyFocusSettlement,
  applyLaunchSettlerExpedition,
  applyPersistentForemanTick,
  applyStartPersistentForeman,
  createInitialPlot,
  prepareLoadedState,
  settlementLedgerView,
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

function addReadyLumber(state, buildingId = `bld_lumber_ready_${state.buildings.length}`) {
  state.policy.collectOutputs = true;
  state.buildings.push({
    buildingId,
    plotId: state.plot.plotId,
    type: 'LUMBER_CAMP',
    x: 0,
    y: 0,
    level: 1,
    state: 'OUTPUT_READY',
    outputBuffer: { wood: 6, stone: 0, food: 0, coin: 0 },
    priority: 'BALANCED',
    createdAt: 1_000,
    updatedAt: 1_000
  });
}

function makeStableTown() {
  const state = createInitialPlot({ pairId: 'pair_v25_second_settlement', nowMs: 1_000 });
  state.plot.hqLevel = 2;
  addReadyLumber(state, 'bld_lumber_ready');
  const nowMs = Date.now();
  applyStartPersistentForeman(state, { durationMinutes: 120 }, mutationCtx(nowMs));
  const tick = applyPersistentForemanTick(state, { nowMs: nowMs + 1_000 }, mutationCtx(nowMs + 1_000));
  assert.equal(tick.ran, true);
  return state;
}

test('V2.5 stability gate blocks second settlement before first-town governance is proven', () => {
  const state = createInitialPlot({ pairId: 'pair_v25_gate', nowMs: 1_000 });
  assert.equal(settlementLedgerView(state).stabilityGate.ready, false);
  assert.throws(
    () => applyLaunchSettlerExpedition(state, {}, mutationCtx(2_000)),
    /STABILITY_GATE_REQUIRED/
  );
});

test('V2.5 Settler Expedition creates an independent second settlement shard', () => {
  const state = makeStableTown();
  const homeInventoryBefore = { ...state.plot.inventory };
  const launched = applyLaunchSettlerExpedition(state, {}, mutationCtx(Date.now() + 2_000));
  assert.equal(launched.expedition.status, 'LAUNCHED');
  assert.equal(launched.settlements.length, 2);

  const home = launched.settlements.find((entry) => entry.settlementId === 'town_1');
  const outpost = launched.settlements.find((entry) => entry.settlementId === 'town_2');
  assert.ok(home);
  assert.ok(outpost);
  assert.notEqual(home.plotId, outpost.plotId);
  assert.equal(outpost.name, 'Ridge Outpost');
  assert.equal(outpost.status, 'FOUNDING');
  assert.deepEqual(state.plot.inventory, homeInventoryBefore);

  const completed = applyCompleteSettlementFoundingTask(state, {
    settlementId: 'town_2',
    taskId: 'raise_outpost_camp'
  }, mutationCtx(Date.now() + 3_000));
  const completedOutpost = completed.settlements.find((entry) => entry.settlementId === 'town_2');
  assert.equal(completedOutpost.status, 'ACTIVE');
  assert.equal(completedOutpost.inventory.wood, 0);
  assert.equal(completedOutpost.inventory.food, 4);
  assert.deepEqual(state.plot.inventory, homeInventoryBefore);
  assert.equal(completedOutpost.pendingDecisionCount, 0);
});

test('V2.5 Governor Ledger switches settlement focus without losing state', () => {
  const state = makeStableTown();
  applyLaunchSettlerExpedition(state, {}, mutationCtx(Date.now() + 2_000));
  const focusedHome = applyFocusSettlement(state, { settlementId: 'town_1' }, mutationCtx(Date.now() + 3_000));
  assert.equal(focusedHome.activeSettlementId, 'town_1');
  const focusedOutpost = applyFocusSettlement(state, { settlementId: 'town_2' }, mutationCtx(Date.now() + 4_000));
  assert.equal(focusedOutpost.activeSettlementId, 'town_2');
  assert.equal(focusedOutpost.settlements.length, 2);

  addReadyLumber(state, 'bld_lumber_ready_after_launch');
  const outpostBefore = { ...focusedOutpost.settlements.find((entry) => entry.settlementId === 'town_2').inventory };
  const tickAtMs = Number(state.meta.scheduler.collectReadyOutputs.nextRunAtMs || Date.now()) + 1_000;
  const tick = applyPersistentForemanTick(state, { nowMs: tickAtMs }, mutationCtx(tickAtMs));
  assert.equal(tick.reason, 'COLLECTED_READY_OUTPUT');
  const afterTick = settlementLedgerView(state);
  assert.deepEqual(afterTick.settlements.find((entry) => entry.settlementId === 'town_2').inventory, outpostBefore);

  const view = stateView(state, []);
  assert.equal(view.settlements.settlements.length, 2);
  assert.equal(view.settlements.activeSettlementId, 'town_2');
});

test('V2.5 migration adds Governor Ledger state', () => {
  const old = createInitialPlot({ pairId: 'pair_v25_migrate', nowMs: 1_000 });
  old.meta.schemaVersion = 8;
  old.meta.settlements = undefined;
  const migrated = prepareLoadedState(old);
  assert.equal(migrated.fromVersion, 8);
  assert.equal(migrated.toVersion, 14);
  assert.equal(migrated.state.meta.settlements.activeSettlementId, 'town_1');
  assert.equal(migrated.state.meta.settlements.expedition.status, 'LOCKED');
});
