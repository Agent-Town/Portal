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

test('FP-SCENE-002 represents worker and hauler roles from production and ready output state', () => {
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
  const worker = producingScene.actors.find((actor) => actor.canonicalRoleId === 'worker');
  assert.ok(worker && worker.visualOnly === true);
  assert.equal(worker.actionKind, 'PRODUCE');
  assert.equal(worker.actionCue.cueType, 'production_work');
  assert.equal(worker.actionCue.accessory, 'tools');
  assert.equal(worker.actionAnimation.mode, 'busy_work');
  assert.equal(worker.assetSrc, '/experiences/founders-plot/assets/characters/inhabitants/worker/kettle-37-worker-v1.png');
  assert.equal(worker.assetSprite.id, 'kettle-37-worker-v1');
  assert.equal(worker.assetSprite.action, 'work');
  assert.equal(worker.assetSprite.columns, 4);
  assert.equal(worker.assetSprite.rows, 4);
  assert.equal(worker.assetSprite.row, 2);
  assert.deepEqual(worker.assetSprite.frames, [0, 1, 2, 3]);
  assert.equal(worker.route.visualOnly, true);
  assert.match(worker.route.wayId, /^WAY:HQ:/);
  assert.equal(worker.route.mode, 'work');
  assert.equal(worker.route.targetId, worker.target.id);

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
  const hauler = readyScene.actors.find((actor) => actor.canonicalRoleId === 'hauler');
  assert.ok(hauler);
  assert.equal(hauler.sourceDomain, 'building');
  assert.equal(hauler.visualOnly, true);
  assert.equal(hauler.actionKind, 'OUTPUT_READY');
  assert.equal(hauler.actionCue.cueType, 'carry_bundle');
  assert.equal(hauler.actionCue.accessory, 'bundle');
  assert.equal(hauler.actionAnimation.mode, 'carry_wobble');
  assert.equal(hauler.actionAnimation.stepStyle, 'waddle');
  assert.equal(hauler.assetSrc, '/experiences/founders-plot/assets/characters/inhabitants/hauler/oona-tallpack-hauler-v1.png');
  assert.equal(hauler.assetSprite.id, 'oona-tallpack-hauler-v1');
  assert.equal(hauler.assetSprite.action, 'ready');
  assert.equal(hauler.assetSprite.columns, 4);
  assert.equal(hauler.assetSprite.rows, 4);
  assert.equal(hauler.assetSprite.row, 3);
  assert.deepEqual(hauler.assetSprite.frames, [0, 1, 2, 3]);
  assert.equal(hauler.route.visualOnly, true);
  assert.match(hauler.route.wayId, /^WAY:HQ:/);
  assert.equal(hauler.route.mode, 'carry');
  assert.equal(hauler.route.targetId, hauler.target.id);
  assert.ok(readyScene.ways.some((way) => way.targetId === hauler.target.id));
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
  assert.equal(messenger.assetSrc, '/experiences/founders-plot/assets/characters/inhabitants/messenger/messenger-agentfolk-v1.png');
  assert.equal(messenger.assetSprite.id, 'messenger-agentfolk-v1');
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
