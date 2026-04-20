const { test, expect } = require('@playwright/test');
const {
  EVENT_TYPES,
  applySetStandingOrder,
  createInitialPlot,
  resolvePrimaryGoal,
  stateView
} = require('../server/founders_plot/engine');

test('standing order defaults to Careful Steward and changing it emits an audit event', async () => {
  const state = createInitialPlot({
    pairId: 'standing-order-default',
    houseId: 'house_standing_order_default',
    nowMs: 1_713_456_000_000
  });

  expect(state?.meta?.standingOrder).toBe('CAREFUL_STEWARD');

  const events = [];
  const result = applySetStandingOrder(state, { standingOrder: 'BOLD_FOUNDER' }, {
    nowMs: 1_713_456_000_100,
    appendEvent: (event) => events.push(event)
  });

  expect(result?.standingOrder).toBe('BOLD_FOUNDER');
  expect(state?.meta?.standingOrder).toBe('BOLD_FOUNDER');
  expect(events.some((event) => event?.type === EVENT_TYPES.FOREMAN_STANDING_ORDER_CHANGED)).toBe(true);
});

test('state view only surfaces a persisted worker foreman decision instead of inventing a fresh server-side choice', async () => {
  const state = createInitialPlot({
    pairId: 'worker-decision-standing-order',
    houseId: 'house_worker_decision_standing_order',
    nowMs: 1_713_456_100_000
  });

  state.plot.hqLevel = 2;
  state.plot.townXp = 25;
  state.plot.inventory.wood = 14;
  state.plot.inventory.food = 6;
  state.policy.collectOutputs = true;
  state.meta.firstTimberRewarded = true;
  state.meta.contracts = {
    offers: [],
    activeContract: {
      contractId: 'con_supply_test',
      kind: 'SUPPLY',
      requester: 'Mara Vale',
      institution: 'Canteen Guild',
      whyNow: 'Camp kitchens are running low.',
      townSignal: 'Short rations',
      philosophyHint: 'Help the camp before expanding.',
      status: 'ACTIVE',
      requirements: { food: 6 },
      rewards: { coin: 4, townXp: 8 }
    },
    completed: []
  };
  state.buildings.push({
    buildingId: 'bld_farm_test',
    plotId: state.plot.plotId,
    type: 'FARM_PLOT',
    level: 1,
    x: 0,
    y: 0,
    state: 'OUTPUT_READY',
    outputBuffer: { wood: 0, stone: 0, food: 6, coin: 0 },
    priority: 'BALANCED',
    createdAt: state.plot.createdAt,
    updatedAt: state.plot.createdAt
  });

  const beforeWorkerDecision = stateView(state, []);
  expect(beforeWorkerDecision?.foreman?.lastDecision || null).toBeNull();
  expect(beforeWorkerDecision?.foreman?.planCard || null).toBeNull();

  state.meta.foremanLastDecision = {
    chosenCandidateId: 'collect:bld_farm_test',
    chosenTool: 'et.plot.collect_outputs',
    planCard: {
      headline: 'Foreman plan',
      goalServed: 'active_contract',
      observation: 'Collect ready output from Farm Plot.',
      recommendation: 'Use et.plot.collect_outputs on bld_farm_test.',
      reason: 'Careful Steward clears dependable stock before expansion.',
      standingOrderInfluence: 'Careful Steward favors predictable reserves.',
      canActNow: true,
      proposedTool: 'et.plot.collect_outputs',
      requiresApproval: false,
      alternative: ''
    }
  };

  const afterWorkerDecision = stateView(state, []);
  expect(afterWorkerDecision?.foreman?.lastDecision).toEqual(expect.objectContaining({
    chosenCandidateId: 'collect:bld_farm_test',
    chosenTool: 'et.plot.collect_outputs'
  }));
  expect(afterWorkerDecision?.foreman?.planCard).toEqual(expect.objectContaining({
    reason: 'Careful Steward clears dependable stock before expansion.',
    standingOrderInfluence: 'Careful Steward favors predictable reserves.'
  }));
});

test('goal arbitration gives the primary CTA to approvals before tutorial, and tutorial before contract progress', async () => {
  const state = createInitialPlot({
    pairId: 'goal-arbitration-test',
    houseId: 'house_goal_arbitration_test',
    nowMs: 1_713_456_200_000
  });

  state.approvals.push({
    approvalId: 'apr_priority',
    plotId: state.plot.plotId,
    requestedBy: 'AGENT',
    tool: 'et.plot.collect_outputs',
    title: 'Approve a collection',
    body: 'Approval should win the primary CTA.',
    status: 'PENDING',
    payload: { buildingId: 'bld_ready' },
    createdAt: state.plot.createdAt,
    resolvedAt: 0,
    resolutionNote: ''
  });
  state.meta.contracts = {
    offers: [],
    activeContract: {
      contractId: 'con_ready_priority',
      kind: 'SUPPLY',
      requester: 'Jon Weaver',
      institution: 'Town Hall',
      whyNow: 'Repairs are waiting on supplies.',
      townSignal: 'Work stoppage',
      philosophyHint: 'Finish the public need first.',
      status: 'READY_TO_TURN_IN',
      requirements: { wood: 12 },
      rewards: { coin: 6, townXp: 10 }
    },
    completed: []
  };

  const approvalGoal = resolvePrimaryGoal(state, { nowMs: 1_713_456_200_100 });
  expect(approvalGoal?.owner).toBe('approval');

  state.approvals = [];
  state.meta.firstTimberRewarded = false;
  const tutorialGoal = resolvePrimaryGoal(state, { nowMs: 1_713_456_200_200 });
  expect(tutorialGoal?.owner).toBe('tutorial');
});
