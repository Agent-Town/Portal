const test = require('node:test');
const assert = require('node:assert/strict');

const { generateContractBoardOffers } = require('../server/founders_plot/contract_deck');
const {
  applyAcceptContract,
  applyCollectOutputs,
  applyForemanPreference,
  applyPlaceBuilding,
  applyQueueJob,
  applyResolveTownOpportunity,
  applyTurnInContract,
  applyUpgradeBuilding,
  createInitialPlot,
  simulatePlot,
  stateView
} = require('../server/founders_plot/engine');

function deterministicIds(prefix = 'con') {
  let index = 0;
  return () => `${prefix}_${String(index += 1).padStart(2, '0')}`;
}

function makeV15State() {
  const state = createInitialPlot({ pairId: 'pair_v15_unit', nowMs: 1_000 });
  state.plot.hqLevel = 2;
  state.plot.townXp = 30;
  state.plot.inventory = {
    wood: 12,
    stone: 0,
    food: 6,
    coin: 20
  };
  state.plot.storageCaps = {
    wood: 100,
    stone: 100,
    food: 100
  };
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
  return state;
}

function makeEventSink() {
  const events = [];
  return {
    events,
    appendEvent(event) {
      events.push({
        ...event,
        seq: events.length + 1,
        eventId: events.length + 1,
        createdAt: 2_000 + events.length
      });
    }
  };
}

test('V1.5 contract board generation is deterministic and names requesters', () => {
  const state = makeV15State();
  const first = generateContractBoardOffers({
    state,
    nowMs: 10_000,
    refreshCount: 0,
    recentContractKeys: [],
    idFactory: deterministicIds()
  });
  const second = generateContractBoardOffers({
    state,
    nowMs: 10_000,
    refreshCount: 0,
    recentContractKeys: [],
    idFactory: deterministicIds()
  });

  const signature = (offers) => offers.map((offer) => ({
    contractId: offer.contractId,
    kind: offer.kind,
    title: offer.title,
    requester: offer.requesterSnapshot.displayName,
    institution: offer.requesterSnapshot.institution
  }));

  assert.deepEqual(signature(first), signature(second));
  assert.deepEqual(first.map((offer) => offer.kind).sort(), ['BUILD', 'PREPARATION', 'SUPPLY']);
  assert.ok(first.every((offer) => offer.requesterSnapshot.displayName && offer.requesterSnapshot.institution));
});

test('V1.5 teaching preference reranks future contract suggestions without unlocking autonomy', () => {
  const state = makeV15State();
  const before = stateView(state, []);
  assert.equal(before.contracts.recommendation.title, 'Clover pick');
  assert.match(before.contracts.recommendation.reason, /Clover is balancing/);

  const result = applyForemanPreference(state, {
    correction: 'PREFER_RESERVES'
  }, { nowMs: 12_000 });
  assert.equal(result.teachingPreferences.contractPreference, 'RESERVES');
  assert.equal(state.meta.scheduler.collectReadyOutputs.enabled, false);
  assert.equal(state.meta.foremanRuntime.status, 'NOT_STARTED');

  const after = stateView(state, []);
  assert.equal(after.foreman.teachingPreferences.contractPreference, 'RESERVES');
  assert.match(after.contracts.recommendation.reason, /protects reserves/);
  assert.equal(after.contracts.offers[0].kind, 'BUILD');
});

test('V1.5 supply turn-in conserves resources and appears in Morning Brief', () => {
  const state = makeV15State();
  const sink = makeEventSink();
  const initial = stateView(state, []);
  const supply = initial.contracts.offers.find((offer) => offer.kind === 'SUPPLY');
  assert.ok(supply);

  applyAcceptContract(state, { contractId: supply.contractId }, {
    nowMs: 13_000,
    appendEvent: sink.appendEvent
  });
  assert.equal(state.meta.contracts.activeContract.status, 'READY_TO_TURN_IN');

  const woodBefore = state.plot.inventory.wood;
  const coinBefore = state.plot.inventory.coin;
  const completed = applyTurnInContract(state, { contractId: supply.contractId }, {
    nowMs: 14_000,
    appendEvent: sink.appendEvent
  }).contract;

  assert.equal(completed.status, 'COMPLETED');
  assert.equal(state.plot.inventory.wood, woodBefore - supply.requirements.resources.wood + (supply.rewards.resources.wood || 0));
  assert.equal(state.plot.inventory.coin, coinBefore + (supply.rewards.resources.coin || 0));
  assert.equal(state.meta.contracts.activeContract, null);
  assert.equal(state.meta.contracts.completed[0].requesterSnapshot.displayName, supply.requesterSnapshot.displayName);

  const view = stateView(state, sink.events);
  assert.equal(view.recap.morningBrief.available, true);
  assert.match(view.recap.morningBrief.changed, new RegExp(supply.requesterSnapshot.displayName));
  assert.match(JSON.stringify(view.recap.recent), new RegExp(supply.requesterSnapshot.institution));
});

test('HQ upgrade progress does not block ready production collection', () => {
  const state = createInitialPlot({ pairId: 'pair_v15_hq_progress', nowMs: 1_000 });
  state.plot.inventory = {
    wood: 20,
    stone: 0,
    food: 10,
    coin: 20
  };
  state.plot.townXp = 25;
  state.meta.firstPlacedTypes = ['LUMBER_CAMP'];
  state.meta.firstCollectedTypes = ['LUMBER_CAMP'];
  state.buildings.push({
    buildingId: 'bld_lumber_progress',
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
  });

  const sink = makeEventSink();
  applyResolveTownOpportunity(state, {
    opportunityId: 'first_campfire_choice',
    optionId: 'raise_waymarkers'
  }, {
    nowMs: 1_500,
    appendEvent: sink.appendEvent
  });
  applyResolveTownOpportunity(state, {
    opportunityId: 'first_supply_council_choice',
    optionId: 'host_work_bee'
  }, {
    nowMs: 1_600,
    appendEvent: sink.appendEvent
  });

  applyUpgradeBuilding(state, {}, {
    nowMs: 2_000,
    appendEvent: sink.appendEvent
  });
  let view = stateView(state, sink.events);
  assert.equal(view.currentGoal.title, 'Headquarters level 2 is opening');
  assert.equal(view.currentGoal.primaryAction, null);
  assert.equal(view.currentGoal.primaryCtaLabel, 'Work in progress');

  applyQueueJob(state, { buildingId: 'bld_lumber_progress' }, {
    nowMs: 3_000,
    appendEvent: sink.appendEvent
  });
  simulatePlot(state, 64_000, sink.appendEvent);
  view = stateView(state, sink.events);
  assert.equal(view.currentGoal.title, 'Collect while Headquarters opens');
  assert.deepEqual(view.currentGoal.primaryAction, {
    type: 'COLLECT_OUTPUTS',
    buildingId: 'bld_lumber_progress'
  });
  assert.equal(view.buildings.find((building) => building.buildingId === 'bld_lumber_progress')?.state, 'OUTPUT_READY');
  assert.equal(view.buildings.find((building) => building.type === 'HQ')?.state, 'UPGRADING');
});

test('HQ2 build catalog explains Farm Plot affordability after the upgrade', () => {
  const state = createInitialPlot({ pairId: 'pair_v15_hq2_catalog', nowMs: 1_000 });
  state.plot.hqLevel = 2;
  state.plot.inventory = {
    wood: 0,
    stone: 0,
    food: 4,
    coin: 18
  };

  const view = stateView(state, []);
  assert.deepEqual(view.unlocks.buildingTypes, ['LUMBER_CAMP', 'FARM_PLOT']);

  const catalog = view.unlocks.buildingCatalog;
  const lumber = catalog.find((entry) => entry.type === 'LUMBER_CAMP');
  const farm = catalog.find((entry) => entry.type === 'FARM_PLOT');
  const quarry = catalog.find((entry) => entry.type === 'QUARRY');

  assert.equal(lumber.unlocked, true);
  assert.equal(lumber.affordable, true);
  assert.equal(farm.unlocked, true);
  assert.equal(farm.affordable, false);
  assert.deepEqual(farm.buildCost, { wood: 10, coin: 5 });
  assert.deepEqual(farm.missing, { wood: 10 });
  assert.equal(quarry.unlocked, false);
  assert.equal(quarry.unlockLevel, 3);
});

test('work camp chain continues through first contract, food, and HQ3 without locked resources', () => {
  const state = createInitialPlot({ pairId: 'pair_v15_work_camp_chain', nowMs: 1_000 });
  const sink = makeEventSink();
  const ctx = (nowMs) => ({
    nowMs,
    appendEvent: sink.appendEvent
  });

  const lumber = applyPlaceBuilding(state, {
    type: 'LUMBER_CAMP',
    x: 0,
    y: 0
  }, ctx(1_000));
  simulatePlot(state, 32_000, sink.appendEvent);
  applyQueueJob(state, { buildingId: lumber.buildingId }, ctx(33_000));
  simulatePlot(state, 94_000, sink.appendEvent);
  applyCollectOutputs(state, { buildingId: lumber.buildingId }, ctx(95_000));

  applyResolveTownOpportunity(state, {
    opportunityId: 'first_campfire_choice',
    optionId: 'host_neighbor_supper'
  }, ctx(96_000));
  applyResolveTownOpportunity(state, {
    opportunityId: 'first_supply_council_choice',
    optionId: 'host_work_bee'
  }, ctx(97_000));
  applyUpgradeBuilding(state, {}, ctx(98_000));
  simulatePlot(state, 219_000, sink.appendEvent);
  applyResolveTownOpportunity(state, {
    opportunityId: 'level_two_charter_choice',
    optionId: 'seed_farm_coop'
  }, ctx(220_000));

  const farm = applyPlaceBuilding(state, {
    type: 'FARM_PLOT',
    x: 1,
    y: 0
  }, ctx(221_000));
  simulatePlot(state, 267_000, sink.appendEvent);

  let view = stateView(state, sink.events);
  assert.equal(view.quest.step, 'choose_first_contract');
  assert.equal(view.currentGoal.primaryAction.type, 'VIEW_CONTRACT_BOARD');

  const buildContract = view.contracts.offers.find((offer) => offer.kind === 'BUILD');
  assert.ok(buildContract);
  applyAcceptContract(state, { contractId: buildContract.contractId }, ctx(268_000));
  view = stateView(state, sink.events);
  assert.equal(view.contracts.activeContract.status, 'READY_TO_TURN_IN');
  applyTurnInContract(state, {
    contractId: view.contracts.activeContract.contractId
  }, ctx(269_000));

  view = stateView(state, sink.events);
  assert.equal(view.contracts.completed.length, 1);
  assert.equal(view.quest.step, 'collect_first_food');
  assert.equal(view.currentGoal.title, 'Collect your first food');
  assert.equal(view.currentGoal.primaryAction.type, 'QUEUE_JOB');
  assert.equal(view.currentGoal.primaryAction.buildingId, farm.buildingId);

  applyQueueJob(state, { buildingId: farm.buildingId }, ctx(270_000));
  simulatePlot(state, 361_000, sink.appendEvent);
  applyCollectOutputs(state, { buildingId: farm.buildingId }, ctx(362_000));

  view = stateView(state, sink.events);
  assert.equal(view.quest.step, 'upgrade_hq_3');
  assert.deepEqual(view.progress.next.cost, { wood: 30, food: 12 });
  assert.equal(view.progress.next.cost.stone, undefined);
  assert.equal(view.currentGoal.primaryAction.type, 'QUEUE_JOB');
  assert.equal(view.currentGoal.primaryAction.buildingId, lumber.buildingId);

  while (state.plot.inventory.wood < view.progress.next.cost.wood) {
    const now = state.plot.updatedAt + 1_000;
    applyQueueJob(state, { buildingId: lumber.buildingId }, ctx(now));
    simulatePlot(state, now + 61_000, sink.appendEvent);
    applyCollectOutputs(state, { buildingId: lumber.buildingId }, ctx(now + 62_000));
    view = stateView(state, sink.events);
  }

  assert.equal(view.currentGoal.primaryAction.type, 'UPGRADE_HQ');
  applyUpgradeBuilding(state, {}, ctx(state.plot.updatedAt + 1_000));
  simulatePlot(state, state.plot.updatedAt + 181_000, sink.appendEvent);

  view = stateView(state, sink.events);
  assert.equal(view.plot.hqLevel, 3);
  assert.ok(view.unlocks.buildingTypes.includes('QUARRY'));
  assert.equal(view.quest.step, 'choose_second_contract');
  assert.equal(view.currentGoal.title, 'Choose the next town request');
  assert.equal(view.currentGoal.primaryAction.type, 'VIEW_CONTRACT_BOARD');
  assert.ok(view.contracts.offers.length >= 2);
});
