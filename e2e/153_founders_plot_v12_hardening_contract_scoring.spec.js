const { test, expect } = require('@playwright/test');
const {
  buildForemanObservation,
  buildSafeForemanCandidates,
  createInitialPlot
} = require('../server/founders_plot/engine');

function addOutputReadyBuilding(state, { buildingId, type, x, y, outputBuffer }) {
  state.buildings.push({
    buildingId,
    plotId: state.plot.plotId,
    type,
    level: 1,
    x,
    y,
    state: 'OUTPUT_READY',
    outputBuffer: { wood: 0, stone: 0, food: 0, coin: 0, ...(outputBuffer || {}) },
    priority: 'BALANCED',
    createdAt: state.plot.createdAt,
    updatedAt: state.plot.createdAt
  });
}

test('active wood contract boosts Lumber Camp collection above Farm Plot', async () => {
  const state = createInitialPlot({
    pairId: 'contract-scoring-wood',
    houseId: 'house_contract_scoring_wood',
    nowMs: 1_713_556_000_000
  });

  state.policy.collectOutputs = true;
  state.meta.standingOrder = 'CAREFUL_STEWARD';
  state.meta.scheduler.collectReadyOutputs.enabled = true;
  state.meta.scheduler.collectReadyOutputs.paused = false;
  state.meta.contracts.activeContract = {
    contractId: 'contract_test_wood',
    kind: 'SUPPLY',
    status: 'ACTIVE',
    requirements: {
      resources: { wood: 3 }
    },
    rewards: {
      resources: { coin: 2 }
    }
  };

  addOutputReadyBuilding(state, {
    buildingId: 'bld_lumber_test',
    type: 'LUMBER_CAMP',
    x: 0,
    y: 0,
    outputBuffer: { wood: 2 }
  });
  addOutputReadyBuilding(state, {
    buildingId: 'bld_farm_test',
    type: 'FARM_PLOT',
    x: 1,
    y: 0,
    outputBuffer: { food: 2 }
  });

  const observation = buildForemanObservation(state, {
    runtimeId: 'rt_contract_scoring',
    nowMs: 1_713_556_000_100,
    recentEvents: []
  });
  const candidates = buildSafeForemanCandidates(state, observation);
  const lumberCandidate = candidates.find((candidate) => candidate?.buildingId === 'bld_lumber_test');
  const farmCandidate = candidates.find((candidate) => candidate?.buildingId === 'bld_farm_test');

  expect(candidates[0]?.buildingId).toBe('bld_lumber_test');
  expect(Number(lumberCandidate?.score || 0)).toBeGreaterThan(Number(farmCandidate?.score || 0));
});

test('without an active contract the careful standing order still prefers Farm Plot stability', async () => {
  const state = createInitialPlot({
    pairId: 'contract-scoring-fallback',
    houseId: 'house_contract_scoring_fallback',
    nowMs: 1_713_556_100_000
  });

  state.policy.collectOutputs = true;
  state.meta.standingOrder = 'CAREFUL_STEWARD';
  state.meta.scheduler.collectReadyOutputs.enabled = true;
  state.meta.scheduler.collectReadyOutputs.paused = false;
  state.meta.contracts.activeContract = null;

  addOutputReadyBuilding(state, {
    buildingId: 'bld_lumber_test',
    type: 'LUMBER_CAMP',
    x: 0,
    y: 0,
    outputBuffer: { wood: 2 }
  });
  addOutputReadyBuilding(state, {
    buildingId: 'bld_farm_test',
    type: 'FARM_PLOT',
    x: 1,
    y: 0,
    outputBuffer: { food: 2 }
  });

  const observation = buildForemanObservation(state, {
    runtimeId: 'rt_contract_scoring_fallback',
    nowMs: 1_713_556_100_100,
    recentEvents: []
  });
  const candidates = buildSafeForemanCandidates(state, observation);

  expect(candidates[0]?.buildingId).toBe('bld_farm_test');
});
