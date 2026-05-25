const test = require('node:test');
const assert = require('node:assert/strict');
const {
  applyPausePersistentForeman,
  applyPersistentForemanTick,
  applyStartPersistentForeman,
  createInitialPlot,
  prepareLoadedState,
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

function makeReadyOutputState({ collectPermission = true } = {}) {
  const state = createInitialPlot({ pairId: 'pair_v20_persistent', nowMs: 1_000 });
  state.policy.collectOutputs = collectPermission === true;
  state.buildings.push({
    buildingId: 'bld_lumber_ready',
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
  return state;
}

test('V2.0 persistent Foreman collects ready output under a time-boxed lease', () => {
  const state = makeReadyOutputState();
  const nowMs = Date.now();
  const startCtx = mutationCtx(nowMs);
  const started = applyStartPersistentForeman(state, { durationMinutes: 60 }, startCtx);
  assert.equal(started.persistent.active, true);
  assert.equal(state.meta.scheduler.collectReadyOutputs.runtimeScope, 'background_foreman_pool');
  assert.equal(startCtx.events.some((event) => event.type === 'FOREMAN_PERSISTENT_STARTED'), true);

  const tickCtx = mutationCtx(nowMs + 1_000);
  const tick = applyPersistentForemanTick(state, { nowMs: nowMs + 1_000 }, tickCtx);
  assert.equal(tick.ran, true);
  assert.equal(tick.reason, 'COLLECTED_READY_OUTPUT');
  assert.equal(state.plot.inventory.wood, 6);
  assert.equal(state.buildings.find((building) => building.buildingId === 'bld_lumber_ready').state, 'READY');
  assert.equal(state.meta.governance.persistent.actionCount, 1);
  assert.equal(state.meta.foremanReceipts[0].authorityUsed, 'Persistent Foreman lease');
  assert.equal(tickCtx.events.some((event) => event.type === 'OUTPUT_COLLECTED' && event.actor === 'AGENT'), true);
  assert.equal(tickCtx.events.some((event) => event.type === 'FOREMAN_RECEIPT_CREATED'), true);
  assert.equal(tickCtx.events.some((event) => event.type === 'FOREMAN_PERSISTENT_TICK'), true);

  const view = stateView(state, tickCtx.events);
  assert.equal(view.foreman.governance.persistent.active, true);
  assert.match(view.recap.morningBrief.changed, /while you were away|while-away/i);
});

test('V2.0 persistent Foreman raises an exception instead of bypassing missing permission', () => {
  const state = makeReadyOutputState({ collectPermission: false });
  const nowMs = Date.now();
  applyStartPersistentForeman(state, { durationMinutes: 60 }, mutationCtx(nowMs));

  const tickCtx = mutationCtx(nowMs + 1_000);
  const tick = applyPersistentForemanTick(state, { nowMs: nowMs + 1_000 }, tickCtx);
  assert.equal(tick.ran, false);
  assert.equal(tick.reason, 'COLLECT_PERMISSION_REQUIRED');
  assert.equal(state.plot.inventory.wood, 0);
  assert.equal(state.buildings.find((building) => building.buildingId === 'bld_lumber_ready').state, 'OUTPUT_READY');
  assert.equal(tickCtx.events.some((event) => event.type === 'FOREMAN_EXCEPTION_RAISED'), true);

  const view = stateView(state, tickCtx.events);
  assert.equal(view.foreman.governance.openExceptions.length, 1);
  assert.equal(view.foreman.governance.openExceptions[0].requestedAction, 'enable_collect_outputs_permission');
});

test('V2.0 persistent Foreman can pause and schema migration adds the persistent state', () => {
  const state = makeReadyOutputState();
  const nowMs = Date.now();
  applyStartPersistentForeman(state, { durationMinutes: 60 }, mutationCtx(nowMs));
  const paused = applyPausePersistentForeman(state, { reason: 'test pause' }, mutationCtx(nowMs + 1_000));
  assert.equal(paused.persistent.status, 'PAUSED');
  assert.equal(state.meta.scheduler.collectReadyOutputs.paused, true);

  const old = createInitialPlot({ pairId: 'pair_v20_persistent_migrate', nowMs: 1_000 });
  old.meta.schemaVersion = 7;
  old.meta.governance.persistent = undefined;
  const migrated = prepareLoadedState(old);
  assert.equal(migrated.fromVersion, 7);
  assert.equal(migrated.toVersion, 14);
  assert.equal(migrated.state.meta.governance.persistent.status, 'INACTIVE');
});
