'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');

process.env.NODE_ENV = 'test';
process.env.STORE_PATH = path.join(os.tmpdir(), `fp-scene-${Date.now()}-${process.pid}.sqlite`);

const engine = require('../server/founders_plot/engine');
const store = require('../server/founders_plot/store');
const sceneState = require('../public/experiences/founders-plot/scene_state');

function fresh(pairId = `pair-scene-${Math.random().toString(36).slice(2, 8)}`) {
  store.resetFoundersPlotStore();
  return engine.getFoundersPlotState({ pairId, houseId: null, nowMs: 1700_000_000_000 });
}

function seedClaimReadyConvoyFixture(pairId = 'pair-scene-civic') {
  const env = fresh(pairId);
  const bundle = store.readPlotBundleById(env.plotId);
  bundle.plot.hqLevel = 6;
  bundle.plot.townXp = 240;
  bundle.plot.inventory = { wood: 80, stone: 40, food: 60, coin: 20 };
  bundle.plot.storageCaps = engine.HQ_LEVEL_RULES[6].storageCaps;
  bundle.plot.constructionSlots = engine.HQ_LEVEL_RULES[6].constructionSlots;
  bundle.plot.scoutReports = [{
    reportId: 'scout_report_scene_civic',
    originPlotId: env.plotId,
    sourceBuildingId: 'bldg_expedition_scene_civic',
    title: 'Scene Civic Survey',
    siteType: 'woodland_ridge',
    risk: 'low',
    traits: ['wood-rich', 'settler-safe'],
    resourceHints: { wood: 2 },
    summary: 'A scene-test outpost candidate.',
    recommendedNext: 'Prepare a convoy.',
    sequence: 1,
    createdAt: 1700_000_000_000
  }];
  bundle.plot.sitePlans = [{
    planId: 'site_plan_scene_civic',
    reportId: 'scout_report_scene_civic',
    originPlotId: env.plotId,
    title: 'Scene Civic Outpost',
    focus: 'resource',
    status: 'REVIEWED',
    promotionStatus: 'reviewed_claim_ready',
    reviewStatus: 'reviewed',
    source: 'scout_report',
    authorityBoundary: 'claim_ready_planning_only_no_territory',
    siteType: 'woodland_ridge',
    risk: 'low',
    traits: ['wood-rich', 'settler-safe'],
    resourceHints: { wood: 2 },
    summary: 'A reviewed scene-test outpost candidate.',
    recommendedNext: 'Prepare a convoy.',
    reviewedAt: 1700_000_000_000,
    reviewNote: 'Reviewed.',
    sequence: 1,
    createdAt: 1700_000_000_000
  }];
  bundle.buildings.push({
    buildingId: 'bldg_expedition_scene_civic',
    plotId: env.plotId,
    objectInstanceId: null,
    type: 'EXPEDITION_BOARD',
    level: 1,
    x: 0,
    y: 2,
    state: 'READY',
    outputBuffer: {},
    priority: 'BALANCED',
    createdAt: 1700_000_000_000,
    updatedAt: 1700_000_000_000
  });
  store.writePlot(bundle.plot);
  store.writeBuildings(bundle.buildings);
  return {
    pairId: env.state.plot.pairId,
    plotId: env.plotId,
    planId: 'site_plan_scene_civic'
  };
}

function seedActiveCivicBeaconFixture(pairId = 'pair-scene-civic') {
  const ctx = seedClaimReadyConvoyFixture(pairId);
  const prepared = engine.prepareSettlerConvoy({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    sitePlanId: ctx.planId,
    actor: 'HUMAN',
    idempotencyKey: `${pairId}-prepare`,
    nowMs: 1700_000_040_000
  });
  assert.equal(prepared.ok, true, prepared.error?.message);
  const advanced = engine.advancePlotTimeForTests({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    advanceMs: engine.SETTLER_CONVOY_DEF.durationMs + 1,
    nowMs: 1700_000_040_000
  });
  assert.equal(advanced.ok, true, advanced.error?.message);
  const founded = engine.foundSettlement({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    claimId: prepared.settlementClaim.claimId,
    actor: 'HUMAN',
    idempotencyKey: `${pairId}-found`,
    nowMs: 1700_000_230_000
  });
  assert.equal(founded.ok, true, founded.error?.message);
  const selected = engine.selectDoctrine({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    doctrineId: 'survey_discipline',
    actor: 'HUMAN',
    idempotencyKey: `${pairId}-doctrine`,
    nowMs: 1700_000_231_000
  });
  assert.equal(selected.ok, true, selected.error?.message);
  const draftWorkOrder = engine.createWorkOrderDraft({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    templateId: 'collect_ready_outputs_once',
    scope: {},
    actor: 'HUMAN',
    idempotencyKey: `${pairId}-work-order`,
    nowMs: 1700_000_232_000
  });
  assert.equal(draftWorkOrder.ok, true, draftWorkOrder.error?.message);
  const proposal = engine.createCivicProposalRecord({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    title: 'Scene Civic Beacon review',
    category: 'public_work',
    summary: 'Reviewed basis for scene-only civic actors around the active beacon.',
    status: 'REVIEWED',
    actor: 'HUMAN',
    idempotencyKey: `${pairId}-proposal`,
    nowMs: 1700_000_233_000
  });
  assert.equal(proposal.ok, true, proposal.error?.message);
  const activated = engine.activateCivicProject({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    sourceProposalId: proposal.civicProposal.proposalId,
    projectType: 'civic_beacon',
    title: 'Scene Civic Beacon',
    summary: 'Active local civic beacon for visual-only scene actor projection.',
    actor: 'HUMAN',
    idempotencyKey: `${pairId}-activate`,
    nowMs: 1700_000_234_000
  });
  assert.equal(activated.ok, true, activated.error?.message);
  return {
    ...ctx,
    claimId: prepared.settlementClaim.claimId,
    foundedPlotId: founded.foundedPlot.plotId,
    proposalId: proposal.civicProposal.proposalId,
    civicProjectId: activated.civicProject.projectId
  };
}

test('FP-SCENE-001 projects server visualActors into visual-only scene inhabitants', () => {
  const env = fresh();
  const placed = engine.placeBuilding({
    pairId: env.state.plot.pairId,
    plotId: env.plotId,
    type: 'LUMBER_CAMP',
    x: 0,
    y: 1,
    actor: 'HUMAN',
    idempotencyKey: 'scene-place-builder',
    nowMs: 1700_000_000_100
  });
  assert.equal(placed.ok, true);

  const duringConstruction = engine.getFoundersPlotState({
    pairId: env.state.plot.pairId,
    plotId: env.plotId,
    nowMs: 1700_000_000_200
  });
  const scene = sceneState.createSceneState({
    ...duringConstruction.state,
    stateHash: duringConstruction.stateHash
  });
  const roles = scene.actors.map((actor) => actor.canonicalRoleId);

  assert.ok(roles.includes('clover'));
  assert.ok(roles.includes('builder'));
  const builder = scene.actors.find((actor) => actor.canonicalRoleId === 'builder');
  assert.equal(builder.visualOnly, true);
  assert.equal(builder.sourceDomain, 'job');
  assert.equal(builder.actionKind, 'CONSTRUCT');
  assert.equal(builder.actionCue.cueType, 'construction_progress');
  assert.equal(builder.actionCue.accessory, 'hammer');
  assert.equal(builder.actionCue.targetId, builder.target.id);
  assert.equal(builder.actionAnimation.mode, 'work_swing');
  assert.equal(builder.actionAnimation.hasWalkOffset, true);
  assert.equal(builder.actionAnimation.stepStyle, 'shuffle');
  assert.equal(builder.route.visualOnly, true);
  assert.match(builder.route.routeId, /^ROUTE:builder:/);
  assert.match(builder.route.wayId, /^WAY:HQ:/);
  assert.equal(builder.route.mode, 'work');
  assert.equal(builder.route.to.kind, 'building');
  assert.equal(builder.route.targetId, builder.target.id);
  assert.equal(builder.route.points.length, 3);
  assert.ok(builder.route.progress > 0);
  assert.ok(builder.route.progress < 1);
  assert.equal(builder.assetSrc, '/experiences/founders-plot/assets/characters/inhabitants/builder/rigger-slate-builder-v2.png');
  assert.equal(builder.assetSprite.id, 'rigger-slate-builder-v2');
  assert.equal(builder.assetSprite.action, 'build');
  assert.equal(builder.assetSprite.columns, 4);
  assert.equal(builder.assetSprite.rows, 4);
  assert.equal(builder.assetSprite.row, 1);
  assert.deepEqual(builder.assetSprite.frames, [0, 1, 2, 3]);
  assert.match(builder.actionAnimation.phaseSeed, /builder/);
  assert.match(builder.sourceObjectId, /^job_/);
  assert.match(builder.selectionKey, /^building:/);
  const clover = scene.objects.find((object) => object.id === 'CLOVER');
  assert.equal(clover.visualOnly, true);
  assert.equal(clover.assetSrc, '/experiences/founders-plot/assets/characters/v1_4_4/clover-observing.webp');
  const lumberWay = scene.ways.find((way) => way.targetId === builder.target.id);
  assert.ok(lumberWay, 'construction target should have an HQ path');
  assert.equal(lumberWay.visualOnly, true);
  assert.equal(lumberWay.points.length, 3);
  assert.equal(scene.ways.some((way) => way.wayId === 'WAY:HQ:TOWN_SQUARE'), true);
});

test('FP-SCENE-002 represents Lumber Camp operator roles from production and ready output state', () => {
  const env = fresh();
  engine.placeBuilding({
    pairId: env.state.plot.pairId,
    plotId: env.plotId,
    type: 'LUMBER_CAMP',
    x: 0,
    y: 1,
    actor: 'HUMAN',
    idempotencyKey: 'scene-place-worker',
    nowMs: 1700_000_000_000
  });
  const ready = engine.advancePlotTimeForTests({
    pairId: env.state.plot.pairId,
    plotId: env.plotId,
    advanceMs: 2 * 60 * 1000,
    nowMs: 1700_000_000_000
  });
  const camp = ready.state.buildings.find((building) => building.type === 'LUMBER_CAMP');
  const queued = engine.queueJob({
    pairId: env.state.plot.pairId,
    plotId: env.plotId,
    buildingId: camp.buildingId,
    kind: 'PRODUCE',
    actor: 'HUMAN',
    idempotencyKey: 'scene-queue-worker',
    nowMs: 1700_000_130_000
  });
  assert.equal(queued.ok, true);

  const producingScene = sceneState.createSceneState({
    ...queued.state,
    stateHash: queued.stateHash
  });
  const lumberWorker = producingScene.actors.find((actor) => actor.canonicalRoleId === 'lumber_worker');
  assert.ok(lumberWorker && lumberWorker.visualOnly === true);
  assert.equal(lumberWorker.actionKind, 'PRODUCE');
  assert.equal(lumberWorker.actionCue.cueType, 'lumber_milling');
  assert.equal(lumberWorker.actionCue.accessory, 'wood_bundle');
  assert.equal(lumberWorker.actionAnimation.mode, 'lumber_mill');
  assert.equal(lumberWorker.assetSrc, '/experiences/founders-plot/assets/characters/inhabitants/lumber_worker/lumber-worker-jun-timberline-v1.png');
  assert.equal(lumberWorker.assetSprite.id, 'lumber-worker-jun-timberline-v1');
  assert.equal(lumberWorker.assetSprite.action, 'mill');
  assert.equal(lumberWorker.assetSprite.columns, 4);
  assert.equal(lumberWorker.assetSprite.rows, 4);
  assert.equal(lumberWorker.assetSprite.row, 2);
  assert.deepEqual(lumberWorker.assetSprite.frames, [0, 1, 2, 3]);
  assert.equal(lumberWorker.route.visualOnly, true);
  assert.match(lumberWorker.route.wayId, /^WAY:HQ:/);
  assert.equal(lumberWorker.route.mode, 'mill');
  assert.equal(lumberWorker.route.targetId, lumberWorker.target.id);

  const outputReady = engine.advancePlotTimeForTests({
    pairId: env.state.plot.pairId,
    plotId: env.plotId,
    advanceMs: 2 * 60 * 1000,
    nowMs: 1700_000_130_000
  });
  const readyScene = sceneState.createSceneState({
    ...outputReady.state,
    stateHash: outputReady.stateHash
  });
  const readyLumberWorker = readyScene.actors.find((actor) => (
    actor.canonicalRoleId === 'lumber_worker'
    && actor.sourceDomain === 'building'
  ));
  assert.ok(readyLumberWorker);
  assert.equal(readyLumberWorker.sourceDomain, 'building');
  assert.equal(readyLumberWorker.visualOnly, true);
  assert.equal(readyLumberWorker.actionKind, 'OUTPUT_READY');
  assert.equal(readyLumberWorker.actionCue.cueType, 'lumber_output_ready');
  assert.equal(readyLumberWorker.actionCue.accessory, 'wood_bundle');
  assert.equal(readyLumberWorker.actionAnimation.mode, 'lumber_mill');
  assert.equal(readyLumberWorker.actionAnimation.stepStyle, 'walk');
  assert.equal(readyLumberWorker.assetSrc, '/experiences/founders-plot/assets/characters/inhabitants/lumber_worker/lumber-worker-jun-timberline-v1.png');
  assert.equal(readyLumberWorker.assetSprite.id, 'lumber-worker-jun-timberline-v1');
  assert.equal(readyLumberWorker.assetSprite.action, 'ready');
  assert.equal(readyLumberWorker.assetSprite.columns, 4);
  assert.equal(readyLumberWorker.assetSprite.rows, 4);
  assert.equal(readyLumberWorker.assetSprite.row, 3);
  assert.deepEqual(readyLumberWorker.assetSprite.frames, [0, 1, 2, 3]);
  assert.equal(readyLumberWorker.route.visualOnly, true);
  assert.match(readyLumberWorker.route.wayId, /^WAY:HQ:/);
  assert.equal(readyLumberWorker.route.mode, 'mill');
  assert.equal(readyLumberWorker.route.targetId, readyLumberWorker.target.id);
  assert.ok(readyScene.ways.some((way) => way.targetId === readyLumberWorker.target.id));
});

test('FP-SCENE-003 messenger actors project attention cues without mutating targets', () => {
  const env = fresh();
  const scene = sceneState.createSceneState({
    ...env.state,
    stateHash: env.stateHash
  });
  const messenger = scene.actors.find((actor) => actor.canonicalRoleId === 'messenger');

  assert.ok(messenger, 'current quest should project a messenger');
  assert.equal(messenger.visualOnly, true);
  assert.equal(messenger.sourceDomain, 'quest');
  assert.equal(messenger.drawerKey, 'quest');
  assert.equal(messenger.actionKind, 'QUEST');
  assert.equal(messenger.actionCue.cueType, 'attention_marker');
  assert.equal(messenger.actionCue.accessory, 'quest');
  assert.equal(messenger.actionAnimation.mode, 'attention_wave');
  assert.equal(messenger.actionAnimation.stepStyle, 'skip');
  assert.equal(messenger.assetSrc, '/experiences/founders-plot/assets/characters/inhabitants/messenger/rook-signalpost-messenger-v1.png');
  assert.equal(messenger.assetSprite.id, 'rook-signalpost-messenger-v1');
  assert.equal(messenger.assetSprite.metadataSrc, '/experiences/founders-plot/assets/characters/inhabitants/messenger/rook-signalpost-messenger-v1.json');
  assert.equal(messenger.assetSprite.action, 'ready');
  assert.equal(messenger.assetSprite.columns, 4);
  assert.equal(messenger.assetSprite.rows, 4);
  assert.equal(messenger.assetSprite.row, 3);
  assert.deepEqual(messenger.assetSprite.frames, [0, 1, 2, 3]);
  assert.equal(messenger.route.visualOnly, true);
  assert.equal(messenger.route.wayId, 'WAY:HQ:TOWN_SQUARE');
  assert.equal(messenger.route.mode, 'notify');
  const encounter = scene.encounters.find((entry) => entry.targetId === 'HQ');
  assert.ok(encounter, 'Clover and messenger should project a non-mutating HQ encounter');
  assert.equal(encounter.visualOnly, true);
  assert.equal(encounter.cueType, 'crossing_greeting');
  assert.deepEqual(encounter.roles.sort(), ['clover', 'messenger']);
});

test('FP-SCENE-004 Expedition Board projects scout actor and report-ready cues', () => {
  const scene = sceneState.createSceneState({
    stateHash: 'scene-expedition-state',
    plot: { plotId: 'plot_scene_expedition' },
    pads: [
      { x: 1, y: 0, kind: 'HQ' },
      { x: 0, y: 1, kind: 'BUILD' }
    ],
    buildings: [
      { buildingId: 'building_hq_1', type: 'HQ', x: 1, y: 0, level: 3, state: 'READY' },
      { buildingId: 'building_expedition_1', type: 'EXPEDITION_BOARD', x: 0, y: 1, level: 1, state: 'OUTPUT_READY' }
    ],
    visualActors: [
      {
        actorId: 'scout_running_1',
        canonicalRoleId: 'scout',
        generatedOverlayRoleId: 'inhabitant.messenger',
        sourceDomain: 'job',
        sourceObjectId: 'job_scout_1',
        sourceStateHash: 'scene-expedition-state',
        visualState: 'scouting',
        actionKind: 'SCOUT',
        progress: 0.5,
        target: { kind: 'building', id: 'building_expedition_1', type: 'EXPEDITION_BOARD' },
        visualOnly: true
      },
      {
        actorId: 'scout_ready_1',
        canonicalRoleId: 'scout',
        generatedOverlayRoleId: 'inhabitant.messenger',
        sourceDomain: 'building',
        sourceObjectId: 'building_expedition_1',
        sourceStateHash: 'scene-expedition-state',
        visualState: 'report_ready',
        actionKind: 'SCOUT_REPORT_READY',
        progress: 1,
        target: { kind: 'building', id: 'building_expedition_1', type: 'EXPEDITION_BOARD' },
        visualOnly: true
      }
    ]
  });

  const board = scene.objects.find((object) => object.buildingType === 'EXPEDITION_BOARD');
  assert.ok(board, 'Expedition Board object should be present');
  assert.equal(board.assetSrc, '/experiences/founders-plot/assets/buildings/expedition-board.webp');
  assert.equal(board.label, 'Expedition Board Lv 1');

  const scout = scene.actors.find((actor) => actor.actorId === 'scout_running_1');
  assert.ok(scout);
  assert.equal(scout.generatedOverlayRoleId, 'inhabitant.messenger');
  assert.equal(scout.actionKind, 'SCOUT');
  assert.equal(scout.actionCue.cueType, 'scout_route');
  assert.equal(scout.actionCue.lane, 'scouting');
  assert.equal(scout.actionAnimation.mode, 'scout_route');
  assert.equal(scout.actionAnimation.stepStyle, 'skip');
  assert.equal(scout.assetSrc, '/experiences/founders-plot/assets/characters/inhabitants/scout/pathfinder-scout-v1.png');
  assert.equal(scout.assetSprite.id, 'pathfinder-scout-v1');
  assert.equal(scout.assetSprite.metadataSrc, '/experiences/founders-plot/assets/characters/inhabitants/scout/pathfinder-scout-v1.json');
  assert.equal(scout.assetSprite.action, 'scout');
  assert.equal(scout.assetSprite.row, 2);
  assert.equal(scout.route.mode, 'scout');

  const ready = scene.actors.find((actor) => actor.actorId === 'scout_ready_1');
  assert.ok(ready);
  assert.equal(ready.actionKind, 'SCOUT_REPORT_READY');
  assert.equal(ready.actionCue.cueType, 'scout_report_ready');
  assert.equal(ready.actionCue.lane, 'report_ready');
  assert.equal(ready.assetSprite.action, 'ready');
});

test('FP-SCENE-005 Batch A functional inhabitants map Workshop, Market, and Settler visual actors', () => {
  const scene = sceneState.createSceneState({
    stateHash: 'scene-batch-a-functional-inhabitants',
    plot: { plotId: 'plot_scene_batch_a' },
    pads: [
      { x: 1, y: 0, kind: 'HQ' },
      { x: 0, y: 1, kind: 'BUILD' },
      { x: 2, y: 1, kind: 'BUILD' }
    ],
    buildings: [
      { buildingId: 'building_hq_1', type: 'HQ', x: 1, y: 0, level: 7, state: 'READY' },
      { buildingId: 'building_workshop_1', type: 'WORKSHOP', x: 0, y: 1, level: 1, state: 'READY' },
      { buildingId: 'building_market_1', type: 'MARKET_STALL', x: 2, y: 1, level: 1, state: 'READY' }
    ],
    visualActors: [
      {
        actorId: 'workshop_active_1',
        canonicalRoleId: 'worker',
        generatedOverlayRoleId: 'inhabitant.worker',
        sourceDomain: 'job',
        sourceObjectId: 'job_workshop_1',
        sourceStateHash: 'scene-batch-a-functional-inhabitants',
        visualState: 'working',
        actionKind: 'PRODUCE',
        progress: 0.45,
        target: { kind: 'building', id: 'building_workshop_1', type: 'WORKSHOP' },
        visualOnly: true
      },
      {
        actorId: 'workshop_ready_1',
        canonicalRoleId: 'hauler',
        generatedOverlayRoleId: 'inhabitant.hauler',
        sourceDomain: 'building',
        sourceObjectId: 'building_workshop_1',
        sourceStateHash: 'scene-batch-a-functional-inhabitants',
        visualState: 'buff_ready',
        actionKind: 'BUFF_READY',
        progress: 1,
        target: { kind: 'building', id: 'building_workshop_1', type: 'WORKSHOP' },
        visualOnly: true
      },
      {
        actorId: 'market_active_1',
        canonicalRoleId: 'worker',
        generatedOverlayRoleId: 'inhabitant.worker',
        sourceDomain: 'job',
        sourceObjectId: 'job_market_1',
        sourceStateHash: 'scene-batch-a-functional-inhabitants',
        visualState: 'selling',
        actionKind: 'SELL',
        progress: 0.5,
        target: { kind: 'building', id: 'building_market_1', type: 'MARKET_STALL' },
        visualOnly: true
      },
      {
        actorId: 'market_ready_1',
        canonicalRoleId: 'market_trader',
        generatedOverlayRoleId: 'inhabitant.market_trader',
        sourceDomain: 'building',
        sourceObjectId: 'building_market_1',
        sourceStateHash: 'scene-batch-a-functional-inhabitants',
        visualState: 'coin_ready',
        actionKind: 'COIN_READY',
        progress: 1,
        target: { kind: 'building', id: 'building_market_1', type: 'MARKET_STALL' },
        visualOnly: true
      },
      {
        actorId: 'settler_departing_1',
        canonicalRoleId: 'settler',
        generatedOverlayRoleId: 'inhabitant.settler',
        sourceDomain: 'settlement_claim',
        sourceObjectId: 'claim_1',
        sourceStateHash: 'scene-batch-a-functional-inhabitants',
        visualState: 'convoy_preparing',
        actionKind: 'SETTLER_CONVOY',
        progress: 0.4,
        target: { kind: 'settlement_claim', id: 'claim_1', status: 'CONVOY_PREPARING' },
        visualOnly: true
      },
      {
        actorId: 'settler_ready_1',
        canonicalRoleId: 'settler',
        generatedOverlayRoleId: 'inhabitant.settler',
        sourceDomain: 'settlement_claim',
        sourceObjectId: 'claim_2',
        sourceStateHash: 'scene-batch-a-functional-inhabitants',
        visualState: 'convoy_arrived',
        actionKind: 'SETTLEMENT_READY',
        progress: 1,
        target: { kind: 'settlement_claim', id: 'claim_2', status: 'CONVOY_ARRIVED' },
        visualOnly: true
      }
    ]
  });

  const workshopActive = scene.actors.find((actor) => actor.actorId === 'workshop_active_1');
  assert.ok(workshopActive);
  assert.equal(workshopActive.canonicalRoleId, 'workshop_specialist');
  assert.equal(workshopActive.actionKind, 'PRODUCE');
  assert.equal(workshopActive.actionCue.cueType, 'workshop_tune');
  assert.equal(workshopActive.actionAnimation.mode, 'workshop_tune');
  assert.equal(workshopActive.route.mode, 'tune');
  assert.equal(workshopActive.assetSrc, '/experiences/founders-plot/assets/characters/inhabitants/workshop_specialist/workshop-specialist-v1.png');
  assert.equal(workshopActive.assetSprite.id, 'workshop-specialist-v1');
  assert.equal(workshopActive.assetSprite.metadataSrc, '/experiences/founders-plot/assets/characters/inhabitants/workshop_specialist/workshop-specialist-v1.json');
  assert.equal(workshopActive.assetSprite.action, 'tune');
  assert.equal(workshopActive.assetSprite.row, 2);

  const workshopReady = scene.actors.find((actor) => actor.actorId === 'workshop_ready_1');
  assert.ok(workshopReady);
  assert.equal(workshopReady.canonicalRoleId, 'workshop_specialist');
  assert.equal(workshopReady.actionCue.cueType, 'workshop_buff_ready');
  assert.equal(workshopReady.assetSprite.action, 'ready');
  assert.equal(workshopReady.assetSprite.row, 3);

  const marketActive = scene.actors.find((actor) => actor.actorId === 'market_active_1');
  assert.ok(marketActive);
  assert.equal(marketActive.canonicalRoleId, 'trader');
  assert.equal(marketActive.actionKind, 'SELL');
  assert.equal(marketActive.actionCue.cueType, 'sell_work');
  assert.equal(marketActive.actionAnimation.mode, 'market_trade');
  assert.equal(marketActive.route.mode, 'trade');
  assert.equal(marketActive.assetSrc, '/experiences/founders-plot/assets/characters/inhabitants/trader/market-trader-v1.png');
  assert.equal(marketActive.assetSprite.id, 'market-trader-v1');
  assert.equal(marketActive.assetSprite.metadataSrc, '/experiences/founders-plot/assets/characters/inhabitants/trader/market-trader-v1.json');
  assert.equal(marketActive.assetSprite.action, 'sell');
  assert.equal(marketActive.assetSprite.row, 2);

  const marketReady = scene.actors.find((actor) => actor.actorId === 'market_ready_1');
  assert.ok(marketReady);
  assert.equal(marketReady.canonicalRoleId, 'trader');
  assert.equal(marketReady.actionCue.cueType, 'coin_ready');
  assert.equal(marketReady.assetSprite.action, 'ready');
  assert.equal(marketReady.assetSprite.row, 3);

  const settlerDeparting = scene.actors.find((actor) => actor.actorId === 'settler_departing_1');
  assert.ok(settlerDeparting);
  assert.equal(settlerDeparting.canonicalRoleId, 'settler');
  assert.equal(settlerDeparting.actionKind, 'SETTLER_CONVOY');
  assert.equal(settlerDeparting.actionCue.cueType, 'settler_convoy');
  assert.equal(settlerDeparting.actionAnimation.mode, 'settler_convoy');
  assert.equal(settlerDeparting.actionAnimation.stepStyle, 'stride');
  assert.equal(settlerDeparting.route.mode, 'convoy');
  assert.equal(settlerDeparting.route.to.kind, 'settlement_claim');
  assert.equal(settlerDeparting.assetSrc, '/experiences/founders-plot/assets/characters/inhabitants/settler/settler-convoy-crew-v1.png');
  assert.equal(settlerDeparting.assetSprite.id, 'settler-convoy-crew-v1');
  assert.equal(settlerDeparting.assetSprite.metadataSrc, '/experiences/founders-plot/assets/characters/inhabitants/settler/settler-convoy-crew-v1.json');
  assert.equal(settlerDeparting.assetSprite.action, 'prepare');
  assert.equal(settlerDeparting.assetSprite.row, 2);

  const settlerReady = scene.actors.find((actor) => actor.actorId === 'settler_ready_1');
  assert.ok(settlerReady);
  assert.equal(settlerReady.canonicalRoleId, 'settler');
  assert.equal(settlerReady.actionCue.cueType, 'settlement_ready');
  assert.equal(settlerReady.assetSprite.action, 'ready');
  assert.equal(settlerReady.assetSprite.row, 3);
  assert.equal(settlerReady.route.progress, 0.90);
});

test('FP-SCENE-006 functional Workshop and Market actors use building-specific inhabitant sheets', () => {
  const scene = sceneState.createSceneState({
    stateHash: 'scene-functional-inhabitants-state',
    plot: { plotId: 'plot_scene_functional' },
    pads: [
      { x: 1, y: 0, kind: 'HQ' },
      { x: 0, y: 1, kind: 'BUILD' },
      { x: 2, y: 1, kind: 'BUILD' }
    ],
    buildings: [
      { buildingId: 'building_hq_1', type: 'HQ', x: 1, y: 0, level: 5, state: 'READY' },
      { buildingId: 'building_workshop_1', type: 'WORKSHOP', x: 0, y: 1, level: 1, state: 'OUTPUT_READY' },
      { buildingId: 'building_market_1', type: 'MARKET_STALL', x: 2, y: 1, level: 1, state: 'OUTPUT_READY' }
    ],
    visualActors: [
      {
        actorId: 'workshop_running_1',
        canonicalRoleId: 'worker',
        generatedOverlayRoleId: 'inhabitant.worker',
        sourceDomain: 'job',
        sourceObjectId: 'job_workshop_1',
        sourceStateHash: 'scene-functional-inhabitants-state',
        visualState: 'working',
        actionKind: 'PRODUCE',
        progress: 0.4,
        target: { kind: 'building', id: 'building_workshop_1', type: 'WORKSHOP' },
        visualOnly: true
      },
      {
        actorId: 'workshop_ready_1',
        canonicalRoleId: 'hauler',
        generatedOverlayRoleId: 'inhabitant.hauler',
        sourceDomain: 'building',
        sourceObjectId: 'building_workshop_1',
        sourceStateHash: 'scene-functional-inhabitants-state',
        visualState: 'ready_to_collect',
        actionKind: 'OUTPUT_READY',
        progress: 1,
        target: { kind: 'building', id: 'building_workshop_1', type: 'WORKSHOP' },
        visualOnly: true
      },
      {
        actorId: 'market_running_1',
        canonicalRoleId: 'worker',
        generatedOverlayRoleId: 'inhabitant.worker',
        sourceDomain: 'job',
        sourceObjectId: 'job_market_1',
        sourceStateHash: 'scene-functional-inhabitants-state',
        visualState: 'working',
        actionKind: 'SELL',
        progress: 0.6,
        target: { kind: 'building', id: 'building_market_1', type: 'MARKET_STALL' },
        visualOnly: true
      },
      {
        actorId: 'market_ready_1',
        canonicalRoleId: 'hauler',
        generatedOverlayRoleId: 'inhabitant.hauler',
        sourceDomain: 'building',
        sourceObjectId: 'building_market_1',
        sourceStateHash: 'scene-functional-inhabitants-state',
        visualState: 'ready_to_collect',
        actionKind: 'OUTPUT_READY',
        progress: 1,
        target: { kind: 'building', id: 'building_market_1', type: 'MARKET_STALL' },
        visualOnly: true
      }
    ]
  });

  const workshop = scene.actors.find((actor) => actor.actorId === 'workshop_running_1');
  assert.ok(workshop);
  assert.equal(workshop.canonicalRoleId, 'workshop_specialist');
  assert.equal(workshop.assetSrc, '/experiences/founders-plot/assets/characters/inhabitants/workshop_specialist/workshop-specialist-v1.png');
  assert.equal(workshop.assetSprite.id, 'workshop-specialist-v1');
  assert.equal(workshop.assetSprite.metadataSrc, '/experiences/founders-plot/assets/characters/inhabitants/workshop_specialist/workshop-specialist-v1.json');
  assert.equal(workshop.assetSprite.action, 'tune');
  assert.equal(workshop.assetSprite.row, 2);
  assert.equal(workshop.actionCue.cueType, 'workshop_tune');
  assert.equal(workshop.actionCue.lane, 'buff_work');
  assert.equal(workshop.actionAnimation.mode, 'workshop_tune');
  assert.equal(workshop.route.mode, 'tune');

  const workshopReady = scene.actors.find((actor) => actor.actorId === 'workshop_ready_1');
  assert.ok(workshopReady);
  assert.equal(workshopReady.canonicalRoleId, 'workshop_specialist');
  assert.equal(workshopReady.assetSprite.action, 'ready');
  assert.equal(workshopReady.assetSprite.row, 3);
  assert.equal(workshopReady.actionCue.cueType, 'workshop_buff_ready');
  assert.equal(workshopReady.actionCue.lane, 'buff_ready');

  const market = scene.actors.find((actor) => actor.actorId === 'market_running_1');
  assert.ok(market);
  assert.equal(market.canonicalRoleId, 'trader');
  assert.equal(market.assetSrc, '/experiences/founders-plot/assets/characters/inhabitants/trader/market-trader-v1.png');
  assert.equal(market.assetSprite.id, 'market-trader-v1');
  assert.equal(market.assetSprite.metadataSrc, '/experiences/founders-plot/assets/characters/inhabitants/trader/market-trader-v1.json');
  assert.equal(market.assetSprite.action, 'sell');
  assert.equal(market.assetSprite.row, 2);
  assert.equal(market.actionCue.cueType, 'sell_work');
  assert.equal(market.actionCue.lane, 'selling');
  assert.equal(market.actionAnimation.mode, 'market_trade');
  assert.equal(market.route.mode, 'trade');

  const marketReady = scene.actors.find((actor) => actor.actorId === 'market_ready_1');
  assert.ok(marketReady);
  assert.equal(marketReady.canonicalRoleId, 'trader');
  assert.equal(marketReady.assetSprite.action, 'ready');
  assert.equal(marketReady.assetSprite.row, 3);
  assert.equal(marketReady.actionCue.cueType, 'coin_ready');
  assert.equal(marketReady.actionCue.lane, 'coin_ready');
});

test('FP-SCENE-007 settler convoy actors use settler sprite, route, and ready mappings', () => {
  const scene = sceneState.createSceneState({
    stateHash: 'scene-settler-state',
    plot: { plotId: 'plot_scene_settler' },
    pads: [
      { x: 1, y: 0, kind: 'HQ' }
    ],
    buildings: [
      { buildingId: 'building_hq_1', type: 'HQ', x: 1, y: 0, level: 7, state: 'READY' }
    ],
    visualActors: [
      {
        actorId: 'settler_convoy_1',
        canonicalRoleId: 'settler',
        generatedOverlayRoleId: 'inhabitant.settler',
        sourceDomain: 'settlement_claim',
        sourceObjectId: 'claim_scene_1',
        sourceStateHash: 'scene-settler-state',
        visualState: 'convoy_preparing',
        actionKind: 'SETTLER_CONVOY',
        progress: 0.45,
        target: {
          kind: 'settlement_claim',
          id: 'claim_scene_1',
          title: 'Stonebank Outpost',
          status: 'CONVOY_PREPARING',
          route: { progress: 0.45, visualOnly: true },
          foundedPlotId: null
        },
        visualOnly: true
      },
      {
        actorId: 'settler_ready_1',
        canonicalRoleId: 'settler',
        generatedOverlayRoleId: 'inhabitant.settler',
        sourceDomain: 'settlement_claim',
        sourceObjectId: 'claim_scene_1',
        sourceStateHash: 'scene-settler-state',
        visualState: 'convoy_arrived',
        actionKind: 'SETTLEMENT_READY',
        progress: 1,
        target: {
          kind: 'settlement_claim',
          id: 'claim_scene_1',
          title: 'Stonebank Outpost',
          status: 'CONVOY_ARRIVED',
          route: { progress: 1, visualOnly: true },
          foundedPlotId: null
        },
        visualOnly: true
      }
    ]
  });

  const settler = scene.actors.find((actor) => actor.actorId === 'settler_convoy_1');
  assert.ok(settler);
  assert.equal(settler.canonicalRoleId, 'settler');
  assert.equal(settler.assetSrc, '/experiences/founders-plot/assets/characters/inhabitants/settler/settler-convoy-crew-v1.png');
  assert.equal(settler.assetSprite.id, 'settler-convoy-crew-v1');
  assert.equal(settler.assetSprite.metadataSrc, '/experiences/founders-plot/assets/characters/inhabitants/settler/settler-convoy-crew-v1.json');
  assert.equal(settler.assetSprite.action, 'prepare');
  assert.equal(settler.assetSprite.row, 2);
  assert.equal(settler.route.mode, 'convoy');
  assert.equal(settler.route.to.kind, 'settlement_claim');
  assert.equal(settler.route.targetId, 'claim_scene_1');
  assert.equal(settler.actionCue.cueType, 'settler_convoy');
  assert.equal(settler.actionCue.lane, 'convoy');
  assert.equal(settler.actionAnimation.mode, 'settler_convoy');
  assert.equal(settler.actionAnimation.stepStyle, 'stride');

  const ready = scene.actors.find((actor) => actor.actorId === 'settler_ready_1');
  assert.ok(ready);
  assert.equal(ready.assetSprite.action, 'ready');
  assert.equal(ready.assetSprite.row, 3);
  assert.equal(ready.actionCue.cueType, 'settlement_ready');
  assert.equal(ready.actionCue.lane, 'arrived_ready');
  assert.equal(ready.route.progress, 0.9);
});

test('FP-SCENE-008 civic actors project only from active server-owned civic state', () => {
  const ctx = seedActiveCivicBeaconFixture('pair-scene-civic-actors');
  const envelope = engine.getFoundersPlotState({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    nowMs: 1700_000_235_000
  });
  const scene = sceneState.createSceneState({
    ...envelope.state,
    stateHash: envelope.stateHash
  });

  assert.equal(envelope.state.publicSummary.civicBeaconActive, true);
  assert.equal(envelope.state.worldGrid.civicReadiness.ready, true);
  assert.equal(envelope.state.worldGrid.civicProjects.localCivicBeaconActive, true);

  const serverRoutekeeper = envelope.state.visualActors.find((actor) => actor.canonicalRoleId === 'civic_routekeeper');
  const serverOracle = envelope.state.visualActors.find((actor) => actor.canonicalRoleId === 'oracle_adjunct');
  const serverOutpostKeeper = envelope.state.visualActors.find((actor) => actor.canonicalRoleId === 'outpost_keeper');

  assert.ok(serverRoutekeeper, 'active civic beacon should emit a routekeeper descriptor');
  assert.ok(serverOracle, 'active civic beacon should emit an oracle adjunct descriptor');
  assert.ok(serverOutpostKeeper, 'founded outpost should emit an outpost keeper descriptor');
  assert.equal(serverRoutekeeper.visualOnly, true);
  assert.equal(serverRoutekeeper.sourceDomain, 'civic_project');
  assert.equal(serverRoutekeeper.sourceObjectId, ctx.civicProjectId);
  assert.equal(serverRoutekeeper.actionKind, 'CIVIC_BEACON_ACTIVE');
  assert.equal(serverRoutekeeper.target.kind, 'civic_project');
  assert.equal(serverRoutekeeper.target.effectId, engine.CIVIC_BEACON_EFFECT_ID);
  assert.equal(serverOracle.visualOnly, true);
  assert.equal(serverOracle.sourceDomain, 'world_grid');
  assert.equal(serverOracle.sourceObjectId, envelope.state.worldGrid.projectionHash);
  assert.equal(serverOracle.actionKind, 'WORLD_GRID_READ_MODEL');
  assert.equal(serverOracle.target.authorityBoundary, envelope.state.worldGrid.authorityBoundary);
  assert.equal(serverOutpostKeeper.visualOnly, true);
  assert.equal(serverOutpostKeeper.sourceDomain, 'settlement_claim');
  assert.equal(serverOutpostKeeper.sourceObjectId, ctx.claimId);
  assert.equal(serverOutpostKeeper.actionKind, 'OUTPOST_FOUNDED');
  assert.equal(serverOutpostKeeper.target.foundedPlotId, ctx.foundedPlotId);

  const routekeeper = scene.actors.find((actor) => actor.canonicalRoleId === 'civic_routekeeper');
  const oracle = scene.actors.find((actor) => actor.canonicalRoleId === 'oracle_adjunct');
  const outpostKeeper = scene.actors.find((actor) => actor.canonicalRoleId === 'outpost_keeper');

  assert.ok(routekeeper);
  assert.equal(routekeeper.assetSrc, '/experiences/founders-plot/assets/characters/inhabitants/civic_routekeeper/civic-routekeeper-v1.png');
  assert.equal(routekeeper.assetSprite.id, 'civic-routekeeper-v1');
  assert.equal(routekeeper.assetSprite.metadataSrc, '/experiences/founders-plot/assets/characters/inhabitants/civic_routekeeper/civic-routekeeper-v1.json');
  assert.equal(routekeeper.assetSprite.action, 'mark');
  assert.equal(routekeeper.assetSprite.row, 2);
  assert.equal(routekeeper.actionCue.cueType, 'civic_beacon_route');
  assert.equal(routekeeper.actionCue.lane, 'civic_beacon');
  assert.equal(routekeeper.actionAnimation.mode, 'civic_route_mark');
  assert.equal(routekeeper.route.mode, 'mark');
  assert.equal(routekeeper.route.visualOnly, true);

  assert.ok(oracle);
  assert.equal(oracle.assetSrc, '/experiences/founders-plot/assets/characters/inhabitants/oracle_adjunct/oracle-adjunct-v1.png');
  assert.equal(oracle.assetSprite.id, 'oracle-adjunct-v1');
  assert.equal(oracle.assetSprite.metadataSrc, '/experiences/founders-plot/assets/characters/inhabitants/oracle_adjunct/oracle-adjunct-v1.json');
  assert.equal(oracle.assetSprite.action, 'consult');
  assert.equal(oracle.assetSprite.row, 2);
  assert.equal(oracle.actionCue.cueType, 'world_grid_read_model');
  assert.equal(oracle.actionCue.lane, 'read_model');
  assert.equal(oracle.actionAnimation.mode, 'world_grid_consult');
  assert.equal(oracle.route.mode, 'consult');
  assert.equal(oracle.route.visualOnly, true);

  assert.ok(outpostKeeper);
  assert.equal(outpostKeeper.assetSrc, '/experiences/founders-plot/assets/characters/inhabitants/outpost_keeper/outpost-keeper-v1.png');
  assert.equal(outpostKeeper.assetSprite.id, 'outpost-keeper-v1');
  assert.equal(outpostKeeper.assetSprite.metadataSrc, '/experiences/founders-plot/assets/characters/inhabitants/outpost_keeper/outpost-keeper-v1.json');
  assert.equal(outpostKeeper.assetSprite.action, 'tend');
  assert.equal(outpostKeeper.assetSprite.row, 2);
  assert.equal(outpostKeeper.actionCue.cueType, 'outpost_keeper_tending');
  assert.equal(outpostKeeper.actionCue.lane, 'outpost_founded');
  assert.equal(outpostKeeper.actionAnimation.mode, 'outpost_tend');
  assert.equal(outpostKeeper.route.mode, 'tend');
  assert.equal(outpostKeeper.route.to.kind, 'settlement_claim');
  assert.equal(outpostKeeper.route.targetId, ctx.claimId);
  assert.equal(outpostKeeper.route.visualOnly, true);
});

test('FP-SCENE-009 maps base operators and HQ notices only over existing anchors', () => {
  const scene = sceneState.createSceneState({
    stateHash: 'scene-base-operators-state',
    plot: { plotId: 'plot_scene_base_operators' },
    pads: [
      { x: 1, y: 0, kind: 'HQ' },
      { x: 0, y: 1, kind: 'BUILD' },
      { x: 1, y: 1, kind: 'BUILD' },
      { x: 2, y: 1, kind: 'BUILD' }
    ],
    buildings: [
      { buildingId: 'building_hq_1', type: 'HQ', x: 1, y: 0, level: 3, state: 'READY' },
      { buildingId: 'building_farm_1', type: 'FARM_PLOT', x: 0, y: 1, level: 1, state: 'OUTPUT_READY' },
      { buildingId: 'building_quarry_1', type: 'QUARRY', x: 1, y: 1, level: 1, state: 'READY' },
      { buildingId: 'building_lumber_1', type: 'LUMBER_CAMP', x: 2, y: 1, level: 1, state: 'OUTPUT_READY' }
    ],
    visualActors: [
      {
        actorId: 'farm_running_1',
        canonicalRoleId: 'worker',
        generatedOverlayRoleId: 'inhabitant.worker',
        sourceDomain: 'job',
        sourceObjectId: 'job_farm_1',
        sourceStateHash: 'scene-base-operators-state',
        visualState: 'working',
        actionKind: 'PRODUCE',
        progress: 0.5,
        target: { kind: 'building', id: 'building_farm_1', type: 'FARM_PLOT' },
        visualOnly: true
      },
      {
        actorId: 'farm_ready_1',
        canonicalRoleId: 'hauler',
        generatedOverlayRoleId: 'inhabitant.hauler',
        sourceDomain: 'building',
        sourceObjectId: 'building_farm_1',
        sourceStateHash: 'scene-base-operators-state',
        visualState: 'ready_to_collect',
        actionKind: 'OUTPUT_READY',
        progress: 1,
        target: { kind: 'building', id: 'building_farm_1', type: 'FARM_PLOT' },
        visualOnly: true
      },
      {
        actorId: 'quarry_running_1',
        canonicalRoleId: 'worker',
        generatedOverlayRoleId: 'inhabitant.worker',
        sourceDomain: 'job',
        sourceObjectId: 'job_quarry_1',
        sourceStateHash: 'scene-base-operators-state',
        visualState: 'working',
        actionKind: 'PRODUCE',
        progress: 0.35,
        target: { kind: 'building', id: 'building_quarry_1', type: 'QUARRY' },
        visualOnly: true
      },
      {
        actorId: 'quarry_ready_1',
        canonicalRoleId: 'hauler',
        generatedOverlayRoleId: 'inhabitant.hauler',
        sourceDomain: 'building',
        sourceObjectId: 'building_quarry_1',
        sourceStateHash: 'scene-base-operators-state',
        visualState: 'ready_to_collect',
        actionKind: 'OUTPUT_READY',
        progress: 1,
        target: { kind: 'building', id: 'building_quarry_1', type: 'QUARRY' },
        visualOnly: true
      },
      {
        actorId: 'lumber_ready_1',
        canonicalRoleId: 'hauler',
        generatedOverlayRoleId: 'inhabitant.hauler',
        sourceDomain: 'building',
        sourceObjectId: 'building_lumber_1',
        sourceStateHash: 'scene-base-operators-state',
        visualState: 'ready_to_collect',
        actionKind: 'OUTPUT_READY',
        progress: 1,
        target: { kind: 'building', id: 'building_lumber_1', type: 'LUMBER_CAMP' },
        visualOnly: true
      },
      {
        actorId: 'hq_reward_1',
        canonicalRoleId: 'messenger',
        generatedOverlayRoleId: 'inhabitant.messenger',
        sourceDomain: 'reward',
        sourceObjectId: 'reward_1',
        sourceStateHash: 'scene-base-operators-state',
        visualState: 'notifying',
        actionKind: 'REWARD',
        progress: 0,
        target: { kind: 'building', id: 'building_hq_1', type: 'HQ' },
        visualOnly: true
      },
      {
        actorId: 'hq_quest_1',
        canonicalRoleId: 'messenger',
        generatedOverlayRoleId: 'inhabitant.messenger',
        sourceDomain: 'quest',
        sourceObjectId: 'quest_1',
        sourceStateHash: 'scene-base-operators-state',
        visualState: 'notifying',
        actionKind: 'QUEST',
        progress: 0,
        target: { kind: 'building', id: 'building_hq_1', type: 'HQ' },
        visualOnly: true
      }
    ]
  });

  const farm = scene.actors.find((actor) => actor.actorId === 'farm_running_1');
  const farmReady = scene.actors.find((actor) => actor.actorId === 'farm_ready_1');
  const quarry = scene.actors.find((actor) => actor.actorId === 'quarry_running_1');
  const quarryReady = scene.actors.find((actor) => actor.actorId === 'quarry_ready_1');
  const lumberReady = scene.actors.find((actor) => actor.actorId === 'lumber_ready_1');
  const hqReward = scene.actors.find((actor) => actor.actorId === 'hq_reward_1');
  const hqQuest = scene.actors.find((actor) => actor.actorId === 'hq_quest_1');

  assert.ok(farm);
  assert.equal(farm.canonicalRoleId, 'farmer');
  assert.equal(farm.assetSrc, '/experiences/founders-plot/assets/characters/inhabitants/farmer/farmer-mira-seedhand-v1.png');
  assert.equal(farm.assetSprite.id, 'farmer-mira-seedhand-v1');
  assert.equal(farm.assetSprite.metadataSrc, '/experiences/founders-plot/assets/characters/inhabitants/farmer/farmer-mira-seedhand-v1.json');
  assert.equal(farm.assetSprite.action, 'tend');
  assert.equal(farm.actionCue.cueType, 'farm_tending');
  assert.equal(farm.actionAnimation.mode, 'farm_tend');
  assert.equal(farm.route.mode, 'tend');

  assert.ok(farmReady);
  assert.equal(farmReady.canonicalRoleId, 'farmer');
  assert.equal(farmReady.assetSprite.action, 'ready');
  assert.equal(farmReady.assetSprite.row, 3);
  assert.equal(farmReady.actionCue.cueType, 'farm_output_ready');

  assert.ok(quarry);
  assert.equal(quarry.canonicalRoleId, 'quarry_mason');
  assert.equal(quarry.assetSrc, '/experiences/founders-plot/assets/characters/inhabitants/quarry_mason/quarry-mason-bram-stonecalm-v1.png');
  assert.equal(quarry.assetSprite.id, 'quarry-mason-bram-stonecalm-v1');
  assert.equal(quarry.assetSprite.metadataSrc, '/experiences/founders-plot/assets/characters/inhabitants/quarry_mason/quarry-mason-bram-stonecalm-v1.json');
  assert.equal(quarry.assetSprite.action, 'cut');
  assert.equal(quarry.actionCue.cueType, 'quarry_cutting');
  assert.equal(quarry.actionAnimation.mode, 'quarry_cut');
  assert.equal(quarry.route.mode, 'cut');

  assert.ok(quarryReady);
  assert.equal(quarryReady.canonicalRoleId, 'quarry_mason');
  assert.equal(quarryReady.assetSprite.action, 'ready');
  assert.equal(quarryReady.actionCue.cueType, 'quarry_output_ready');

  assert.ok(lumberReady);
  assert.equal(lumberReady.canonicalRoleId, 'lumber_worker');
  assert.equal(lumberReady.assetSprite.id, 'lumber-worker-jun-timberline-v1');
  assert.equal(lumberReady.assetSprite.action, 'ready');
  assert.equal(lumberReady.actionCue.cueType, 'lumber_output_ready');

  assert.ok(hqReward);
  assert.equal(hqReward.canonicalRoleId, 'hq_civic_operator');
  assert.equal(hqReward.sourceDomain, 'reward');
  assert.equal(hqReward.assetSrc, '/experiences/founders-plot/assets/characters/inhabitants/hq_civic_operator/hq-civic-operator-vale-desk-7-v1.png');
  assert.equal(hqReward.assetSprite.id, 'hq-civic-operator-vale-desk-7-v1');
  assert.equal(hqReward.assetSprite.action, 'ready');
  assert.equal(hqReward.actionCue.cueType, 'hq_reward_receipt');
  assert.equal(hqReward.actionAnimation.mode, 'hq_coordinate');
  assert.equal(hqReward.route.mode, 'coordinate');

  assert.ok(hqQuest);
  assert.equal(hqQuest.canonicalRoleId, 'messenger');
  assert.equal(hqQuest.assetSprite.id, 'rook-signalpost-messenger-v1');
  assert.equal(hqQuest.actionCue.cueType, 'attention_marker');
});
