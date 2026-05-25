const test = require('node:test');
const assert = require('node:assert/strict');
const {
  applyForemanPreference,
  applySetForemanDoctrineRule,
  buildForemanObservation,
  buildSafeForemanCandidates,
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

function makeContractState() {
  const state = createInitialPlot({ pairId: 'pair_v21_contracts', nowMs: 1_000 });
  state.plot.hqLevel = 2;
  state.plot.townXp = 30;
  state.plot.inventory = { wood: 12, stone: 0, food: 6, coin: 20 };
  state.plot.storageCaps = { wood: 100, stone: 100, food: 100 };
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
  stateView(state, []);
  return state;
}

function makeOutputState() {
  const state = createInitialPlot({ pairId: 'pair_v21_candidates', nowMs: 1_000 });
  state.policy.collectOutputs = true;
  state.buildings.push(
    {
      buildingId: 'bld_lumber_ready',
      plotId: state.plot.plotId,
      type: 'LUMBER_CAMP',
      x: 0,
      y: 0,
      level: 1,
      state: 'OUTPUT_READY',
      outputBuffer: { wood: 12, stone: 0, food: 0, coin: 0 },
      priority: 'BALANCED',
      createdAt: 1_000,
      updatedAt: 1_000
    },
    {
      buildingId: 'bld_farm_ready',
      plotId: state.plot.plotId,
      type: 'FARM_PLOT',
      x: 1,
      y: 0,
      level: 1,
      state: 'OUTPUT_READY',
      outputBuffer: { wood: 0, stone: 0, food: 1, coin: 0 },
      priority: 'BALANCED',
      createdAt: 1_000,
      updatedAt: 1_000
    }
  );
  return state;
}

test('V2.1 Doctrine Lite toggles a reversible preference and reranks contract suggestions', () => {
  const state = makeContractState();
  const before = stateView(state, []);
  assert.equal(before.contracts.recommendation.title, 'Clover pick');
  assert.match(before.contracts.recommendation.reason, /balancing requester need/);

  const ctx = mutationCtx(12_000);
  const result = applySetForemanDoctrineRule(state, {
    ruleId: 'PREFER_RESERVES',
    enabled: true
  }, ctx);

  assert.equal(result.doctrine.activeRules[0].ruleId, 'PREFER_RESERVES');
  assert.equal(ctx.events.some((event) => event.type === 'FOREMAN_DOCTRINE_UPDATED'), true);

  const after = stateView(state, ctx.events);
  assert.equal(after.foreman.doctrine.activeRules[0].ruleId, 'PREFER_RESERVES');
  assert.match(after.contracts.recommendation.reason, /protects reserves/);

  const disabled = applySetForemanDoctrineRule(state, {
    ruleId: 'PREFER_RESERVES',
    enabled: false
  }, mutationCtx(13_000));
  assert.equal(disabled.doctrine.activeRules.length, 0);
  assert.equal(stateView(state, []).foreman.doctrine.activeRules.length, 0);
});

test('V2.1 conflicting Doctrine Lite preferences raise a Foreman exception instead of switching silently', () => {
  const state = makeContractState();
  applySetForemanDoctrineRule(state, { ruleId: 'PREFER_RESERVES', enabled: true }, mutationCtx(14_000));

  const conflictCtx = mutationCtx(15_000);
  const conflict = applySetForemanDoctrineRule(state, {
    ruleId: 'PREFER_SPEED',
    enabled: true
  }, conflictCtx);

  assert.deepEqual(conflict.conflict.conflictRuleIds, ['PREFER_RESERVES']);
  assert.equal(conflict.doctrine.activeRules.map((rule) => rule.ruleId).includes('PREFER_SPEED'), false);
  assert.equal(conflictCtx.events.some((event) => event.type === 'FOREMAN_EXCEPTION_RAISED'), true);

  const view = stateView(state, conflictCtx.events);
  assert.equal(view.foreman.governance.openExceptions.length, 1);
  assert.match(view.foreman.governance.openExceptions[0].title, /Choose Clover priority/);

  applySetForemanDoctrineRule(state, { ruleId: 'PREFER_RESERVES', enabled: false }, mutationCtx(16_000));
  const speed = applySetForemanDoctrineRule(state, { ruleId: 'PREFER_SPEED', enabled: true }, mutationCtx(17_000));
  assert.equal(speed.doctrine.activeRules[0].ruleId, 'PREFER_SPEED');
});

test('V2.1 teaching affordance promotes into Doctrine Lite and schema migration preserves old preference', () => {
  const state = makeContractState();
  const result = applyForemanPreference(state, { correction: 'ASK_ME_FIRST' }, mutationCtx(18_000));
  assert.equal(result.doctrine.activeRules[0].ruleId, 'ASK_BEFORE_SPENDING');
  assert.equal(state.meta.scheduler.collectReadyOutputs.paused, true);

  const old = createInitialPlot({ pairId: 'pair_v21_migrate', nowMs: 1_000 });
  old.meta.schemaVersion = 6;
  old.meta.doctrine = undefined;
  old.meta.teachingPreferences.contractPreference = 'SPEED';
  const migrated = prepareLoadedState(old);
  assert.equal(migrated.fromVersion, 6);
  assert.equal(migrated.toVersion, 14);
  assert.equal(migrated.state.meta.doctrine.activeRules[0], 'PREFER_SPEED');
});

test('V2.1 Doctrine Lite changes deterministic Foreman candidate ranking', () => {
  const state = makeOutputState();
  const before = buildSafeForemanCandidates(state, buildForemanObservation(state));
  assert.equal(before[0].buildingId, 'bld_farm_ready');

  applySetForemanDoctrineRule(state, { ruleId: 'PREFER_SPEED', enabled: true }, mutationCtx(19_000));
  const after = buildSafeForemanCandidates(state, buildForemanObservation(state));
  assert.equal(after[0].buildingId, 'bld_lumber_ready');
});
