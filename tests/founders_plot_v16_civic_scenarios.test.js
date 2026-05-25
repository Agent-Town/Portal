const test = require('node:test');
const assert = require('node:assert/strict');

const {
  applyContributeCivicScenario,
  applyStartCivicScenario,
  createInitialPlot,
  simulatePlot,
  stateView
} = require('../server/founders_plot/engine');

function makeEventSink() {
  const events = [];
  return {
    events,
    appendEvent(event) {
      events.push({
        ...event,
        seq: events.length + 1,
        eventId: events.length + 1,
        createdAt: event.createdAt || 20_000 + events.length
      });
    }
  };
}

function makeScenarioReadyState() {
  const state = createInitialPlot({ pairId: 'pair_v16_scenario', nowMs: 1_000 });
  state.plot.hqLevel = 3;
  state.plot.townXp = 90;
  state.plot.inventory = {
    wood: 40,
    stone: 8,
    food: 20,
    coin: 18
  };
  state.plot.storageCaps = {
    wood: 100,
    stone: 100,
    food: 100
  };
  state.meta.firstPlacedTypes = ['LUMBER_CAMP', 'FARM_PLOT'];
  state.meta.firstCollectedTypes = ['LUMBER_CAMP', 'FARM_PLOT'];
  state.meta.townOpportunities.completed = [
    { opportunityId: 'first_campfire_choice', optionId: 'raise_waymarkers', title: 'Waymarkers raised' },
    { opportunityId: 'first_supply_council_choice', optionId: 'host_work_bee', title: 'Work bee hosted' },
    { opportunityId: 'level_two_charter_choice', optionId: 'seed_farm_coop', title: 'Farm co-op seeded' }
  ];
  state.buildings.push(
    {
      buildingId: 'bld_lumber_v16',
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
      buildingId: 'bld_farm_v16',
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
  state.meta.contracts.completed = [
    { contractId: 'con_done_1', status: 'COMPLETED', title: 'First request' },
    { contractId: 'con_done_2', status: 'COMPLETED', title: 'Second request' }
  ];
  return state;
}

test('V1.6 Storm Prep scenario can start, progress, complete, and recap', () => {
  const state = makeScenarioReadyState();
  const sink = makeEventSink();
  let view = stateView(state, sink.events);

  assert.equal(view.scenarios.offers.length, 1);
  assert.equal(view.scenarios.offers[0].scenarioId, 'storm_prep');
  assert.equal(view.currentGoal.owner, 'scenario');
  assert.equal(view.currentGoal.primaryAction.type, 'START_SCENARIO');

  const started = applyStartCivicScenario(state, {
    scenarioId: 'storm_prep'
  }, {
    nowMs: 30_000,
    appendEvent: sink.appendEvent
  }).scenario;
  assert.equal(started.status, 'ACTIVE');
  assert.equal(started.tasks.length, 3);

  const woodBefore = state.plot.inventory.wood;
  const first = applyContributeCivicScenario(state, {
    scenarioId: 'storm_prep',
    taskId: 'brace_roofs'
  }, {
    nowMs: 31_000,
    appendEvent: sink.appendEvent
  });
  assert.equal(first.completed, false);
  assert.equal(state.plot.inventory.wood, woodBefore - 12);
  assert.equal(state.meta.scenarios.active.completedTasks, 1);

  const second = applyContributeCivicScenario(state, {
    scenarioId: 'storm_prep',
    taskId: 'stock_supper'
  }, {
    nowMs: 32_000,
    appendEvent: sink.appendEvent
  });
  assert.equal(second.completed, true);
  assert.equal(second.scenario.status, 'COMPLETED');
  assert.equal(state.meta.scenarios.active, null);
  assert.equal(state.meta.scenarios.completed[0].scenarioId, 'storm_prep');
  assert.equal(state.meta.scenarios.completed[0].completedTasks, 2);

  view = stateView(state, sink.events);
  assert.equal(view.scenarios.completed[0].status, 'COMPLETED');
  assert.match(JSON.stringify(view.journal.entries), /Storm Prep/);
  assert.equal(view.recap.morningBrief.available, true);
  assert.match(view.recap.morningBrief.changed, /Storm Prep/);
});

test('V1.6 Storm Prep soft miss persists and emits a readable outcome', () => {
  const state = makeScenarioReadyState();
  const sink = makeEventSink();
  applyStartCivicScenario(state, {
    scenarioId: 'storm_prep'
  }, {
    nowMs: 40_000,
    appendEvent: sink.appendEvent
  });

  simulatePlot(state, 40_000 + (13 * 60 * 1000), sink.appendEvent);

  assert.equal(state.meta.scenarios.active, null);
  assert.equal(state.meta.scenarios.completed[0].status, 'SOFT_MISSED');
  assert.ok(sink.events.some((event) => event.type === 'CIVIC_SCENARIO_SOFT_MISSED'));

  const view = stateView(state, sink.events);
  assert.match(JSON.stringify(view.journal.entries), /slipped|Storm Prep/i);
  assert.equal(view.scenarios.completed[0].status, 'SOFT_MISSED');
});
