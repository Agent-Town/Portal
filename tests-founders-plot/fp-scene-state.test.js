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
  assert.match(builder.sourceObjectId, /^job_/);
  assert.match(builder.selectionKey, /^building:/);
  assert.equal(scene.objects.some((object) => object.id === 'CLOVER' && object.visualOnly === true), true);
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
  assert.ok(producingScene.actors.some((actor) => actor.canonicalRoleId === 'worker' && actor.visualOnly === true));

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
});
