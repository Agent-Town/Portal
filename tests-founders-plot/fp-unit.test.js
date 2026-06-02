'use strict';

/**
 * Founders Plot — unit + integration smoke suite.
 *
 * Covers the mandated FP-UT-001..008 unit IDs and a compact slice of the
 * FP-IT-001..010 integration IDs. Run with:
 *
 *   NODE_ENV=test node --test tests-founders-plot/fp-unit.test.js
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

process.env.NODE_ENV = 'test';
process.env.STORE_PATH = path.join(os.tmpdir(), `fp-unit-${Date.now()}-${process.pid}.sqlite`);

const engine = require('../server/founders_plot/engine');
const { buildRecapFromEvents } = require('../server/founders_plot/recap');
const { computeStateHash, replayEventLog } = require('../server/founders_plot/replay');
const progressionAtlas = require('../server/founders_plot/progression_atlas');
const store = require('../server/founders_plot/store');

function fresh(pairId = `pair-${Math.random().toString(36).slice(2, 8)}`) {
  store.resetFoundersPlotStore();
  return engine.getFoundersPlotState({ pairId, houseId: null, nowMs: 1700_000_000_000 });
}

function buildingOf(stateEnvelope, type) {
  return stateEnvelope.state.buildings.find((building) => building.type === type);
}

function seedClaimReadyConvoyFixture(pairId = 'pair-hq7-unit') {
  const env = fresh(pairId);
  const bundle = store.readPlotBundleById(env.plotId);
  bundle.plot.hqLevel = 6;
  bundle.plot.townXp = 240;
  bundle.plot.inventory = { wood: 80, stone: 40, food: 60, coin: 20 };
  bundle.plot.storageCaps = engine.HQ_LEVEL_RULES[6].storageCaps;
  bundle.plot.constructionSlots = engine.HQ_LEVEL_RULES[6].constructionSlots;
  bundle.plot.scoutReports = [{
    reportId: 'scout_report_unit_forest',
    originPlotId: env.plotId,
    sourceBuildingId: 'bldg_expedition_unit',
    title: 'Unit Forest Survey',
    siteType: 'woodland_ridge',
    risk: 'low',
    traits: ['wood-rich', 'settler-safe'],
    resourceHints: { wood: 2 },
    summary: 'A unit-test outpost candidate.',
    recommendedNext: 'Prepare a convoy.',
    sequence: 1,
    createdAt: 1700_000_000_000
  }];
  bundle.plot.sitePlans = [{
    planId: 'site_plan_unit_forest',
    reportId: 'scout_report_unit_forest',
    originPlotId: env.plotId,
    title: 'Unit Forest Outpost',
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
    summary: 'A reviewed unit-test outpost candidate.',
    recommendedNext: 'Prepare a convoy.',
    reviewedAt: 1700_000_000_000,
    reviewNote: 'Reviewed.',
    sequence: 1,
    createdAt: 1700_000_000_000
  }];
  bundle.buildings.push({
    buildingId: 'bldg_expedition_unit',
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
    planId: 'site_plan_unit_forest'
  };
}

function seedFoundedOutpostFixture(pairId = 'pair-hq8-doctrine') {
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
  assert.equal(advanced.ok, true);
  const founded = engine.foundSettlement({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    claimId: prepared.settlementClaim.claimId,
    actor: 'HUMAN',
    idempotencyKey: `${pairId}-found`,
    nowMs: 1700_000_230_000
  });
  assert.equal(founded.ok, true, founded.error?.message);
  return {
    ...ctx,
    claimId: prepared.settlementClaim.claimId,
    foundedPlotId: founded.foundedPlot.plotId
  };
}

function seedReadyOutputBuildings(plotId, count = 3) {
  const defs = [
    ['bldg_work_order_lumber', 'LUMBER_CAMP', { wood: 12 }, 0, 1],
    ['bldg_work_order_farm', 'FARM_PLOT', { food: 9 }, 2, 1],
    ['bldg_work_order_quarry', 'QUARRY', { stone: 7 }, 1, 2]
  ];
  const buildings = defs.slice(0, count).map(([buildingId, type, outputBuffer, x, y], index) => ({
    buildingId,
    plotId,
    objectInstanceId: null,
    type,
    level: 1,
    x,
    y,
    state: 'OUTPUT_READY',
    outputBuffer,
    priority: 'BALANCED',
    createdAt: 1700_000_260_000 + index,
    updatedAt: 1700_000_260_000 + index
  }));
  const bundle = store.readPlotBundleById(plotId);
  store.writeBuildings([
    ...bundle.buildings.filter((building) => !buildings.some((next) => next.buildingId === building.buildingId)),
    ...buildings
  ]);
  return buildings;
}

function makeProgressionHarness() {
  const env = fresh('pair-hq1-hq3-reachability');
  const ctx = {
    pairId: env.state.plot.pairId,
    plotId: env.plotId,
    nowMs: 1700_000_000_000,
    idem: 0,
  };
  ctx.key = (label) => `reach-${label}-${ctx.idem += 1}`;
  ctx.state = () => engine.getFoundersPlotState({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    nowMs: ctx.nowMs,
  });
  ctx.advance = (minutes) => {
    const advanceMs = minutes * 60_000;
    ctx.nowMs += advanceMs;
    const out = engine.advancePlotTimeForTests({
      pairId: ctx.pairId,
      plotId: ctx.plotId,
      advanceMs,
      nowMs: ctx.nowMs,
    });
    assert.equal(out.ok, true);
    return out;
  };
  ctx.place = (type, x, y) => {
    const out = engine.placeBuilding({
      pairId: ctx.pairId,
      plotId: ctx.plotId,
      type,
      x,
      y,
      actor: 'HUMAN',
      idempotencyKey: ctx.key(`place-${type}`),
      nowMs: ctx.nowMs,
    });
    assert.equal(out.ok, true, out.error?.message || `${type} placement failed`);
    ctx.advance(5);
    return buildingOf(ctx.state(), type);
  };
  ctx.produceAndCollect = (type) => {
    const before = ctx.state();
    const building = buildingOf(before, type);
    assert.ok(building, `${type} must exist`);
    assert.equal(building.state, 'READY', `${type} must be ready`);
    const queued = engine.queueJob({
      pairId: ctx.pairId,
      plotId: ctx.plotId,
      buildingId: building.buildingId,
      kind: 'PRODUCE',
      actor: 'HUMAN',
      idempotencyKey: ctx.key(`queue-${type}`),
      nowMs: ctx.nowMs,
    });
    assert.equal(queued.ok, true, queued.error?.message || `${type} production failed`);
    ctx.advance(5);
    const ready = buildingOf(ctx.state(), type);
    assert.equal(ready.state, 'OUTPUT_READY', `${type} output must be ready`);
    const collected = engine.collectOutputs({
      pairId: ctx.pairId,
      plotId: ctx.plotId,
      buildingId: ready.buildingId,
      actor: 'HUMAN',
      idempotencyKey: ctx.key(`collect-${type}`),
      nowMs: ctx.nowMs,
    });
    assert.equal(collected.ok, true, collected.error?.message || `${type} collect failed`);
    return ctx.state();
  };
  ctx.upgradeHq = (targetLevel) => {
    const before = ctx.state();
    const hq = buildingOf(before, 'HQ');
    const out = engine.upgradeBuilding({
      pairId: ctx.pairId,
      plotId: ctx.plotId,
      buildingId: hq.buildingId,
      actor: 'HUMAN',
      idempotencyKey: ctx.key(`upgrade-hq-${targetLevel}`),
      nowMs: ctx.nowMs,
    });
    assert.equal(out.ok, true, out.error?.message || `HQ${targetLevel} upgrade failed`);
    ctx.advance(5);
    const after = ctx.state();
    assert.equal(after.state.plot.hqLevel, targetLevel);
    return after;
  };
  return ctx;
}

test('FP-UT-001 createPlot seeds HQ at center with starter coin', () => {
  const env = fresh();
  assert.equal(env.ok, true);
  const hq = (env.state.buildings || []).find((b) => b.type === 'HQ');
  assert.ok(hq, 'HQ must exist');
  assert.equal(env.state.plot.inventory.coin >= 10, true);
  assert.equal(env.state.plot.hqLevel, 1);
});

test('FP-UT-002 placeBuilding deducts cost and appends world delta', () => {
  const env = fresh();
  const res = engine.placeBuilding({
    pairId: env.state.plot.pairId, plotId: env.plotId,
    type: 'LUMBER_CAMP', x: 0, y: 1, actor: 'HUMAN',
    idempotencyKey: 'ut-2', nowMs: 1700_000_000_500,
  });
  assert.equal(res.ok, true);
  assert.ok(res.worldDelta.some((e) => e.type === 'BUILDING_PLACED'));
  const after = engine.getFoundersPlotState({ pairId: env.state.plot.pairId, nowMs: 1700_000_000_500 });
  assert.equal(after.state.plot.inventory.coin, env.state.plot.inventory.coin - 8);
});

test('FP-UT-003 invariant: tiles are unique — placing on occupied pad rejected', () => {
  const env = fresh();
  const a = engine.placeBuilding({
    pairId: env.state.plot.pairId, plotId: env.plotId,
    type: 'LUMBER_CAMP', x: 0, y: 1, actor: 'HUMAN',
    idempotencyKey: 'ut-3a', nowMs: 1700_000_001_000,
  });
  assert.equal(a.ok, true);
  const b = engine.placeBuilding({
    pairId: env.state.plot.pairId, plotId: env.plotId,
    type: 'LUMBER_CAMP', x: 0, y: 1, actor: 'HUMAN',
    idempotencyKey: 'ut-3b', nowMs: 1700_000_002_000,
  });
  assert.equal(b.ok, false);
  assert.ok(['BUILD_SLOT_OCCUPIED', 'INVALID_STATE'].includes(b.error.code));
});

test('FP-UT-004 idempotency: same key + same args returns stored response', () => {
  const env = fresh();
  const key = 'ut-4-stable';
  const a = engine.placeBuilding({
    pairId: env.state.plot.pairId, plotId: env.plotId,
    type: 'LUMBER_CAMP', x: 2, y: 1, actor: 'HUMAN',
    idempotencyKey: key, nowMs: 1700_000_003_000,
  });
  const b = engine.placeBuilding({
    pairId: env.state.plot.pairId, plotId: env.plotId,
    type: 'LUMBER_CAMP', x: 2, y: 1, actor: 'HUMAN',
    idempotencyKey: key, nowMs: 1700_000_004_000,
  });
  assert.equal(a.ok, true);
  assert.equal(b.ok, true);
  // Plot should have exactly one new building
  const s = engine.getFoundersPlotState({ pairId: env.state.plot.pairId, nowMs: 1700_000_005_000 });
  const count = s.state.buildings.filter((x) => x.type === 'LUMBER_CAMP').length;
  assert.equal(count, 1);
});

test('FP-UT-005 idempotency conflict: same key, different args → error', () => {
  const env = fresh();
  const key = 'ut-5-key';
  const a = engine.placeBuilding({
    pairId: env.state.plot.pairId, plotId: env.plotId,
    type: 'LUMBER_CAMP', x: 0, y: 1, actor: 'HUMAN',
    idempotencyKey: key, nowMs: 1700_000_003_000,
  });
  assert.equal(a.ok, true);
  const b = engine.placeBuilding({
    pairId: env.state.plot.pairId, plotId: env.plotId,
    type: 'LUMBER_CAMP', x: 1, y: 1, actor: 'HUMAN',
    idempotencyKey: key, nowMs: 1700_000_004_000,
  });
  assert.equal(b.ok, false);
  assert.equal(b.error.code, 'IDEMPOTENCY_CONFLICT');
});

test('FP-UT-006 simulate resolves construction at its endsAt', () => {
  const env = fresh();
  engine.placeBuilding({
    pairId: env.state.plot.pairId, plotId: env.plotId,
    type: 'LUMBER_CAMP', x: 0, y: 1, actor: 'HUMAN',
    idempotencyKey: 'ut-6', nowMs: 1700_000_000_000,
  });
  engine.advancePlotTimeForTests({
    pairId: env.state.plot.pairId, plotId: env.plotId,
    advanceMs: 2 * 60 * 1000, nowMs: 1700_000_000_000,
  });
  const s = engine.getFoundersPlotState({ pairId: env.state.plot.pairId, nowMs: 1700_000_200_000 });
  const b = s.state.buildings.find((x) => x.type === 'LUMBER_CAMP');
  assert.equal(b.state, 'READY');
});

test('FP-UT-007 offline catch-up is clamped at 8 hours', () => {
  const env = fresh();
  engine.placeBuilding({
    pairId: env.state.plot.pairId, plotId: env.plotId,
    type: 'LUMBER_CAMP', x: 0, y: 1, actor: 'HUMAN',
    idempotencyKey: 'ut-7', nowMs: 1700_000_000_000,
  });
  // Jump 100 hours; catch-up should only simulate up to 8 hours worth of ticks
  const adv = engine.advancePlotTimeForTests({
    pairId: env.state.plot.pairId, plotId: env.plotId,
    advanceMs: 100 * 60 * 60 * 1000, nowMs: 1700_000_000_000,
  });
  assert.equal(adv.ok, true);
  const s = engine.getFoundersPlotState({ pairId: env.state.plot.pairId, nowMs: 1700_000_000_000 });
  const jump = s.state.plot.lastSimulatedAt - 1700_000_000_000;
  assert.ok(jump <= 8 * 60 * 60 * 1000 + 1, `clamped jump ${jump}`);
});

test('FP-UT-008 state hash is deterministic across serializations', () => {
  const env = fresh();
  engine.placeBuilding({
    pairId: env.state.plot.pairId, plotId: env.plotId,
    type: 'LUMBER_CAMP', x: 0, y: 1, actor: 'HUMAN',
    idempotencyKey: 'ut-8', nowMs: 1700_000_000_000,
  });
  const s = engine.getFoundersPlotState({ pairId: env.state.plot.pairId, nowMs: 1700_000_100_000 });
  const h1 = computeStateHash({
    plot: s.state.plot, buildings: s.state.buildings, jobs: s.state.jobs, policy: s.state.policy,
  });
  const h2 = computeStateHash({
    plot: s.state.plot, buildings: s.state.buildings, jobs: s.state.jobs, policy: s.state.policy,
  });
  assert.equal(h1, h2);
  assert.match(h1, /^[0-9a-f]{64}$/);
});

test('FP-UT-009 visual actors are deterministic projections, not simulation actors', () => {
  const env = fresh();
  const placed = engine.placeBuilding({
    pairId: env.state.plot.pairId, plotId: env.plotId,
    type: 'LUMBER_CAMP', x: 0, y: 1, actor: 'HUMAN',
    idempotencyKey: 'ut-9-place', nowMs: 1700_000_000_000,
  });
  assert.equal(placed.ok, true);

  const s1 = engine.getFoundersPlotState({ pairId: env.state.plot.pairId, nowMs: 1700_000_010_000 });
  const s2 = engine.getFoundersPlotState({ pairId: env.state.plot.pairId, nowMs: 1700_000_010_000 });
  assert.deepEqual(s1.state.visualActors, s2.state.visualActors);

  const actors = s1.state.visualActors;
  assert.ok(Array.isArray(actors));
  assert.ok(actors.some((actor) => actor.canonicalRoleId === 'clover'));
  const builder = actors.find((actor) => actor.canonicalRoleId === 'builder');
  assert.ok(builder, 'active construction should project a builder');
  assert.equal(builder.generatedOverlayRoleId, 'inhabitant.worker');
  assert.equal(builder.sourceDomain, 'job');
  assert.equal(builder.sourceStateHash, s1.state.audit.stateHash);
  assert.equal(builder.actionKind, 'CONSTRUCT');
  assert.equal(builder.visualOnly, true);
  for (const actor of actors) {
    assert.equal('toolName' in actor, false);
    assert.equal('resourceDelta' in actor, false);
    assert.equal('mutatesResources' in actor, false);
    assert.equal('autonomousAgent' in actor, false);
  }
});

test('FP-UT-010 visual actors expose haulers for ready outputs', () => {
  const env = fresh();
  engine.placeBuilding({
    pairId: env.state.plot.pairId, plotId: env.plotId,
    type: 'LUMBER_CAMP', x: 0, y: 1, actor: 'HUMAN',
    idempotencyKey: 'ut-10-place', nowMs: 1700_000_000_000,
  });
  engine.advancePlotTimeForTests({
    pairId: env.state.plot.pairId, plotId: env.plotId,
    advanceMs: 2 * 60 * 1000, nowMs: 1700_000_000_000,
  });
  const ready = engine.getFoundersPlotState({ pairId: env.state.plot.pairId, nowMs: 1700_000_200_000 });
  const camp = ready.state.buildings.find((building) => building.type === 'LUMBER_CAMP');
  assert.equal(camp.state, 'READY');
  const queued = engine.queueJob({
    pairId: env.state.plot.pairId, plotId: env.plotId,
    buildingId: camp.buildingId, kind: 'PRODUCE', actor: 'HUMAN',
    idempotencyKey: 'ut-10-queue', nowMs: 1700_000_200_000,
  });
  assert.equal(queued.ok, true);
  engine.advancePlotTimeForTests({
    pairId: env.state.plot.pairId, plotId: env.plotId,
    advanceMs: 2 * 60 * 1000, nowMs: 1700_000_200_000,
  });
  const outputReady = engine.getFoundersPlotState({ pairId: env.state.plot.pairId, nowMs: 1700_000_400_000 });
  const hauler = outputReady.state.visualActors.find((actor) => actor.canonicalRoleId === 'hauler');
  assert.ok(hauler, 'ready output should project a hauler');
  assert.equal(hauler.generatedOverlayRoleId, 'inhabitant.hauler');
  assert.equal(hauler.visualState, 'ready_to_collect');
  assert.equal(hauler.target.id, camp.buildingId);
});

test('FP-IT-001 full loop: place → construct → produce → collect → inventory gained', () => {
  const env = fresh();
  engine.placeBuilding({
    pairId: env.state.plot.pairId, plotId: env.plotId,
    type: 'LUMBER_CAMP', x: 0, y: 1, actor: 'HUMAN',
    idempotencyKey: 'it-1-place', nowMs: 1700_000_000_000,
  });
  engine.advancePlotTimeForTests({
    pairId: env.state.plot.pairId, plotId: env.plotId,
    advanceMs: 2 * 60 * 1000, nowMs: 1700_000_000_000,
  });
  const s1 = engine.getFoundersPlotState({ pairId: env.state.plot.pairId, nowMs: 1700_000_200_000 });
  const b = s1.state.buildings.find((x) => x.type === 'LUMBER_CAMP');
  assert.equal(b.state, 'READY');
  const q = engine.queueJob({
    pairId: env.state.plot.pairId, plotId: env.plotId,
    buildingId: b.buildingId, kind: 'PRODUCE', actor: 'HUMAN',
    idempotencyKey: 'it-1-queue', nowMs: 1700_000_200_000,
  });
  assert.equal(q.ok, true);
  engine.advancePlotTimeForTests({
    pairId: env.state.plot.pairId, plotId: env.plotId,
    advanceMs: 2 * 60 * 1000, nowMs: 1700_000_200_000,
  });
  const s2 = engine.getFoundersPlotState({ pairId: env.state.plot.pairId, nowMs: 1700_000_400_000 });
  const b2 = s2.state.buildings.find((x) => x.type === 'LUMBER_CAMP');
  assert.equal(b2.state, 'OUTPUT_READY');
  const c = engine.collectOutputs({
    pairId: env.state.plot.pairId, plotId: env.plotId,
    buildingId: b2.buildingId, actor: 'HUMAN',
    idempotencyKey: 'it-1-collect', nowMs: 1700_000_400_000,
  });
  assert.equal(c.ok, true);
  const s3 = engine.getFoundersPlotState({ pairId: env.state.plot.pairId, nowMs: 1700_000_400_000 });
  assert.ok(s3.state.plot.inventory.wood > 0);
});

test('FP-IT-004 fresh plot can reach HQ Level 3 through normal progression', () => {
  const ctx = makeProgressionHarness();
  const initial = ctx.state();
  assert.ok(initial.state.unlockedBuildings.includes('LUMBER_CAMP'));
  assert.ok(initial.state.unlockedBuildings.includes('FARM_PLOT'));
  assert.equal(initial.state.unlockedBuildings.includes('QUARRY'), false);

  ctx.place('LUMBER_CAMP', 0, 1);
  ctx.produceAndCollect('LUMBER_CAMP');
  ctx.produceAndCollect('LUMBER_CAMP');
  const stocked = ctx.state();
  assert.equal(stocked.state.quest.id, 'place-farm-plot');

  ctx.place('FARM_PLOT', 1, 1);
  ctx.produceAndCollect('FARM_PLOT');
  ctx.produceAndCollect('FARM_PLOT');
  ctx.produceAndCollect('LUMBER_CAMP');
  const readyForHq2 = ctx.produceAndCollect('LUMBER_CAMP');
  assert.equal(readyForHq2.state.quest.id, 'upgrade-hq-2');
  assert.deepEqual(
    readyForHq2.state.hqUpgrade.buildingPrerequisites.map((entry) => [entry.type, entry.satisfied]),
    [['LUMBER_CAMP', true], ['FARM_PLOT', true]]
  );

  const hq2 = ctx.upgradeHq(2);
  assert.ok(hq2.state.unlockedBuildings.includes('QUARRY'));
  assert.equal(hq2.state.hqUpgrade.nextLevel, 3);

  ctx.produceAndCollect('LUMBER_CAMP');
  ctx.produceAndCollect('FARM_PLOT');
  ctx.place('QUARRY', 2, 1);
  ctx.produceAndCollect('QUARRY');
  ctx.produceAndCollect('QUARRY');
  ctx.produceAndCollect('LUMBER_CAMP');
  const readyForHq3 = ctx.produceAndCollect('LUMBER_CAMP');
  assert.equal(readyForHq3.state.quest.id, 'upgrade-hq-3');
  assert.deepEqual(readyForHq3.state.hqUpgrade.cost, { wood: 20, stone: 16 });
  assert.equal(readyForHq3.state.hqUpgrade.xpRequired, 50);
  assert.deepEqual(
    readyForHq3.state.hqUpgrade.buildingPrerequisites.map((entry) => [entry.type, entry.satisfied]),
    [['QUARRY', true]]
  );

  const hq3 = ctx.upgradeHq(3);
  assert.equal(hq3.state.plot.hqLevel, 3);
  assert.ok(hq3.state.permissions.find((row) => row.key === 'queueProduction')?.unlocked);
  assert.ok(hq3.state.unlockedBuildings.includes('EXPEDITION_BOARD'));
  assert.equal(hq3.state.buildingDefs.EXPEDITION_BOARD.construction.cost.wood, 24);
});

test('FP-UT-011a HQ upgrade rejects missing ready building prerequisite before spending', () => {
  const env = fresh('pair-hq4-prerequisite');
  const bundle = store.readPlotBundleById(env.plotId);
  bundle.plot.hqLevel = 3;
  bundle.plot.townXp = 100;
  bundle.plot.inventory = { wood: 50, stone: 40, food: 30, coin: 20 };
  bundle.plot.storageCaps = engine.HQ_LEVEL_RULES[3].storageCaps;
  bundle.plot.constructionSlots = engine.HQ_LEVEL_RULES[3].constructionSlots;
  const hq = bundle.buildings.find((building) => building.type === 'HQ');
  hq.level = 3;
  hq.state = 'READY';
  bundle.buildings.push({
    buildingId: 'bldg_prereq_lumber',
    plotId: env.plotId,
    objectInstanceId: null,
    type: 'LUMBER_CAMP',
    level: 1,
    x: 0,
    y: 1,
    state: 'READY',
    outputBuffer: {},
    priority: 'BALANCED',
    createdAt: 1700_000_000_000,
    updatedAt: 1700_000_000_000
  }, {
    buildingId: 'bldg_prereq_farm',
    plotId: env.plotId,
    objectInstanceId: null,
    type: 'FARM_PLOT',
    level: 1,
    x: 1,
    y: 1,
    state: 'READY',
    outputBuffer: {},
    priority: 'BALANCED',
    createdAt: 1700_000_000_000,
    updatedAt: 1700_000_000_000
  }, {
    buildingId: 'bldg_prereq_quarry',
    plotId: env.plotId,
    objectInstanceId: null,
    type: 'QUARRY',
    level: 1,
    x: 2,
    y: 1,
    state: 'READY',
    outputBuffer: {},
    priority: 'BALANCED',
    createdAt: 1700_000_000_000,
    updatedAt: 1700_000_000_000
  });
  store.writePlot(bundle.plot);
  store.writeBuildings(bundle.buildings);

  const blocked = engine.upgradeBuilding({
    pairId: env.state.plot.pairId,
    plotId: env.plotId,
    buildingId: hq.buildingId,
    actor: 'HUMAN',
    idempotencyKey: 'ut-hq4-missing-expedition-board',
    nowMs: 1700_000_000_000
  });
  assert.equal(blocked.ok, false);
  assert.equal(blocked.error.code, 'MISSING_HQ_BUILDING_PREREQUISITES');
  assert.equal(blocked.error.retryable, false);
  assert.equal(blocked.error.details.targetLevel, 4);
  assert.deepEqual(blocked.error.details.missingPrerequisites.map((entry) => entry.type), ['EXPEDITION_BOARD']);
  assert.deepEqual(store.readPlotBundleById(env.plotId).plot.inventory, { wood: 50, stone: 40, food: 30, coin: 20 });

  const readyBundle = store.readPlotBundleById(env.plotId);
  readyBundle.buildings.push({
    buildingId: 'bldg_prereq_expedition',
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
  store.writeBuildings(readyBundle.buildings);
  const started = engine.upgradeBuilding({
    pairId: env.state.plot.pairId,
    plotId: env.plotId,
    buildingId: hq.buildingId,
    actor: 'HUMAN',
    idempotencyKey: 'ut-hq4-expedition-board-ready',
    nowMs: 1700_000_000_000
  });
  assert.equal(started.ok, true, started.error?.message);
  assert.equal(started.state.plot.inventory.wood, 10);
  assert.equal(started.state.hqUpgrade.buildingPrerequisites[0].type, 'EXPEDITION_BOARD');
});

test('FP-UT-011 HQ6 Settlement Charter has deterministic cap and no HQ7 rule', () => {
  assert.deepEqual(engine.HQ_UPGRADE_RULES[5].cost, { wood: 90, stone: 80, food: 50 });
  assert.equal(engine.HQ_UPGRADE_RULES[5].xpRequired, 220);
  assert.equal(engine.HQ_UPGRADE_RULES[5].durationMs, 180_000);
  assert.equal(engine.HQ_UPGRADE_RULES[5].nextLevel, 6);
  assert.deepEqual(engine.HQ_UPGRADE_RULES[1].buildingPrerequisites.map((entry) => entry.type), ['LUMBER_CAMP', 'FARM_PLOT']);
  assert.deepEqual(engine.HQ_UPGRADE_RULES[2].buildingPrerequisites.map((entry) => entry.type), ['QUARRY']);
  assert.deepEqual(engine.HQ_UPGRADE_RULES[3].buildingPrerequisites.map((entry) => entry.type), ['EXPEDITION_BOARD']);
  assert.deepEqual(engine.HQ_UPGRADE_RULES[4].buildingPrerequisites.map((entry) => entry.type), ['WORKSHOP']);
  assert.deepEqual(engine.HQ_UPGRADE_RULES[5].buildingPrerequisites.map((entry) => entry.type), ['MARKET_STALL']);
  assert.equal(engine.HQ_UPGRADE_RULES[6], undefined);
  assert.deepEqual(engine.HQ_LEVEL_RULES[6].unlocks, []);
  assert.deepEqual(engine.HQ_LEVEL_RULES[6].permissionUnlocks, []);
  assert.equal(engine.HQ_LEVEL_RULES[6].storageCaps.wood, 220);
  assert.equal(engine.HQ_LEVEL_RULES[6].constructionSlots, 3);
});

test('FP-UT-012 Site Plan review requires the source Scout Report receipt', () => {
  const env = fresh('pair-site-plan-review-receipt');
  const bundle = store.readPlotBundleById(env.plotId);
  bundle.plot.hqLevel = 6;
  bundle.plot.storageCaps = engine.HQ_LEVEL_RULES[6].storageCaps;
  bundle.plot.constructionSlots = engine.HQ_LEVEL_RULES[6].constructionSlots;
  bundle.plot.scoutReports = [];
  bundle.plot.sitePlans = [{
    planId: 'site_plan_orphan',
    reportId: 'scout_report_missing',
    originPlotId: env.plotId,
    title: 'Orphan Plan',
    focus: 'balanced',
    status: 'DRAFT',
    promotionStatus: 'draft',
    reviewStatus: 'unreviewed',
    source: 'scout_report',
    authorityBoundary: 'requires_engine_promotion_for_settlement',
    createdAt: 1700_000_000_000
  }];
  store.writePlot(bundle.plot);
  const out = engine.reviewSitePlan({
    pairId: env.state.plot.pairId,
    plotId: env.plotId,
    planId: 'site_plan_orphan',
    reviewNote: 'Should fail without receipt.',
    actor: 'HUMAN',
    idempotencyKey: 'ut-12-review-orphan',
    nowMs: 1700_000_000_000
  });
  assert.equal(out.ok, false);
  assert.equal(out.error.details.reason, 'missing_scout_report');
});

test('FP-UT-013 prepareSettlerConvoy spends resources and creates one claim/job', () => {
  const ctx = seedClaimReadyConvoyFixture('pair-hq7-prepare');
  const out = engine.prepareSettlerConvoy({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    sitePlanId: ctx.planId,
    actor: 'HUMAN',
    idempotencyKey: 'ut-13-prepare',
    nowMs: 1700_000_010_000
  });
  assert.equal(out.ok, true, out.error?.message);
  assert.equal(out.existing, false);
  assert.equal(out.settlementClaim.status, 'CONVOY_PREPARING');
  assert.equal(out.job.kind, 'SETTLER_CONVOY');
  assert.deepEqual(out.settlementClaim.cost, engine.SETTLER_CONVOY_DEF.cost);
  assert.equal(out.state.plot.inventory.wood, 80 - engine.SETTLER_CONVOY_DEF.cost.wood);
  assert.equal(out.state.settlementClaims.length, 1);
  const repeat = engine.prepareSettlerConvoy({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    sitePlanId: ctx.planId,
    actor: 'HUMAN',
    idempotencyKey: 'ut-13-prepare-again',
    nowMs: 1700_000_011_000
  });
  assert.equal(repeat.ok, true);
  assert.equal(repeat.existing, true);
  assert.equal(repeat.settlementClaim.claimId, out.settlementClaim.claimId);
});

test('FP-UT-014 foundSettlement waits for arrival then creates one owned outpost', () => {
  const ctx = seedClaimReadyConvoyFixture('pair-hq7-found');
  const prepared = engine.prepareSettlerConvoy({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    sitePlanId: ctx.planId,
    actor: 'HUMAN',
    idempotencyKey: 'ut-14-prepare',
    nowMs: 1700_000_020_000
  });
  assert.equal(prepared.ok, true, prepared.error?.message);
  const tooSoon = engine.foundSettlement({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    claimId: prepared.settlementClaim.claimId,
    actor: 'HUMAN',
    idempotencyKey: 'ut-14-too-soon',
    nowMs: 1700_000_021_000
  });
  assert.equal(tooSoon.ok, false);
  assert.equal(tooSoon.error.details.reason, 'convoy_not_arrived');
  const advanced = engine.advancePlotTimeForTests({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    advanceMs: engine.SETTLER_CONVOY_DEF.durationMs + 1,
    nowMs: 1700_000_020_000
  });
  assert.equal(advanced.ok, true);
  assert.equal(advanced.state.settlementClaims[0].status, 'CONVOY_ARRIVED');
  const arrivedMap = engine.getExpeditionMapStatus({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    nowMs: 1700_000_299_000
  });
  assert.equal(arrivedMap.ok, true, arrivedMap.error?.message);
  const arrivedConvoyUnit = arrivedMap.expeditionMap.units.items.find((unit) => (
    unit.unitType === 'settler_convoy'
    && unit.sourceClaimId === prepared.settlementClaim.claimId
  ));
  assert.ok(arrivedConvoyUnit, 'expected arrived Settler Convoy map unit');
  assert.ok(arrivedConvoyUnit.commandHints.some((command) => (
    command.commandId === 'found_settlement'
    && command.actionName === 'et.plot.found_settlement'
    && command.claimId === prepared.settlementClaim.claimId
    && command.serverMutationImplemented === true
  )));
  const founded = engine.foundSettlement({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    claimId: prepared.settlementClaim.claimId,
    actor: 'HUMAN',
    idempotencyKey: 'ut-14-found',
    nowMs: 1700_000_300_000
  });
  assert.equal(founded.ok, true, founded.error?.message);
  assert.equal(founded.settlementClaim.status, 'FOUNDED');
  assert.ok(founded.foundedPlot.plotId);
  assert.ok(founded.ownedPlots.some((plot) => plot.role === 'OUTPOST' && plot.plotId === founded.foundedPlot.plotId));
  const outpostState = engine.getFoundersPlotState({
    pairId: ctx.pairId,
    plotId: founded.foundedPlot.plotId,
    nowMs: 1700_000_301_000
  });
  assert.equal(outpostState.ok, true);
  assert.equal(outpostState.state.plot.hqLevel, 1);
  assert.equal(outpostState.state.buildings.find((building) => building.type === 'HQ')?.state, 'READY');
  const repeat = engine.foundSettlement({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    claimId: prepared.settlementClaim.claimId,
    actor: 'HUMAN',
    idempotencyKey: 'ut-14-found-again',
    nowMs: 1700_000_302_000
  });
  assert.equal(repeat.ok, true);
  assert.equal(repeat.existing, true);
  assert.equal(repeat.foundedPlot.plotId, founded.foundedPlot.plotId);
});

test('FP-UT-015 agent Settler Convoy actions require matching approvals', () => {
  const ctx = seedClaimReadyConvoyFixture('pair-hq7-agent');
  const blocked = engine.prepareSettlerConvoy({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    sitePlanId: ctx.planId,
    actor: 'AGENT',
    idempotencyKey: 'ut-15-agent-blocked',
    nowMs: 1700_000_030_000
  });
  assert.equal(blocked.ok, false);
  assert.equal(blocked.error.code, 'FORBIDDEN_POLICY');
  const approval = engine.createApprovalRequest({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    actionName: 'prepare_settler_convoy',
    requestedParams: { sitePlanId: ctx.planId },
    title: 'Prepare convoy',
    body: 'Allow one bounded convoy.',
    actor: 'AGENT',
    idempotencyKey: 'ut-15-approval',
    nowMs: 1700_000_031_000
  });
  assert.equal(approval.ok, true);
  const resolved = engine.resolveApproval({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    approvalId: approval.approval.approvalId,
    decision: 'approve',
    nowMs: 1700_000_032_000
  });
  assert.equal(resolved.ok, true);
  const prepared = engine.prepareSettlerConvoy({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    sitePlanId: ctx.planId,
    actor: 'AGENT',
    idempotencyKey: 'ut-15-agent-prepare',
    nowMs: 1700_000_033_000
  });
  assert.equal(prepared.ok, true, prepared.error?.message);
  const used = store.listApprovals(ctx.plotId).find((entry) => entry.approvalId === approval.approval.approvalId);
  assert.equal(used.status, 'USED');
  assert.ok(used.usedAt);
});

test('FP-UT-016 Research Lodge doctrine is gated and rejects unknown catalog ids', () => {
  const env = fresh('pair-hq8-locked');
  const locked = engine.selectDoctrine({
    pairId: env.state.plot.pairId,
    plotId: env.plotId,
    doctrineId: 'survey_discipline',
    actor: 'HUMAN',
    idempotencyKey: 'ut-16-locked',
    nowMs: 1700_000_050_000
  });
  assert.equal(locked.ok, false);
  assert.equal(locked.error.details.reason, 'hq_locked');
  const ctx = seedFoundedOutpostFixture('pair-hq8-unknown');
  const unknown = engine.selectDoctrine({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    doctrineId: 'invented_buff_lane',
    actor: 'HUMAN',
    idempotencyKey: 'ut-16-unknown',
    nowMs: 1700_000_240_000
  });
  assert.equal(unknown.ok, false);
  assert.equal(unknown.error.code, 'UNKNOWN_DOCTRINE');
});

test('FP-UT-017 Research Lodge doctrine selection is engine-owned and idempotent', () => {
  const ctx = seedFoundedOutpostFixture('pair-hq8-select');
  const before = engine.getFoundersPlotState({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    nowMs: 1700_000_241_000
  });
  const inventoryBefore = before.state.plot.inventory;
  const selected = engine.selectDoctrine({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    doctrineId: 'survey_discipline',
    actor: 'HUMAN',
    idempotencyKey: 'ut-17-select',
    nowMs: 1700_000_242_000
  });
  assert.equal(selected.ok, true, selected.error?.message);
  assert.equal(selected.existing, false);
  assert.equal(selected.doctrineState.selectedDoctrineId, 'survey_discipline');
  assert.equal(selected.doctrine.effectKind, 'scout_duration_modifier');
  assert.equal(selected.doctrine.gameplayBuff, true);
  assert.equal(selected.doctrine.effectValue.durationMultiplier, 0.95);
  assert.deepEqual(selected.state.plot.inventory, inventoryBefore);
  assert.equal(selected.worldDelta.some((entry) => entry.type === 'DOCTRINE_SELECTED'), true);
  const repeat = engine.selectDoctrine({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    doctrineId: 'survey_discipline',
    actor: 'HUMAN',
    idempotencyKey: 'ut-17-select',
    nowMs: 1700_000_243_000
  });
  assert.equal(repeat.ok, true);
  assert.equal(repeat.doctrineState.selectedAt, selected.doctrineState.selectedAt);
  const duplicate = engine.selectDoctrine({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    doctrineId: 'survey_discipline',
    actor: 'HUMAN',
    idempotencyKey: 'ut-17-select-duplicate',
    nowMs: 1700_000_244_000
  });
  assert.equal(duplicate.ok, true);
  assert.equal(duplicate.existing, true);
  assert.deepEqual(duplicate.state.plot.inventory, inventoryBefore);
  const conflict = engine.selectDoctrine({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    doctrineId: 'survey_discipline',
    actor: 'AGENT',
    idempotencyKey: 'ut-17-select',
    nowMs: 1700_000_245_000
  });
  assert.equal(conflict.ok, false);
  assert.equal(conflict.error.code, 'IDEMPOTENCY_CONFLICT');
});

test('FP-UT-018 agent Research Lodge doctrine selection requires matching approval', () => {
  const ctx = seedFoundedOutpostFixture('pair-hq8-agent');
  const blocked = engine.selectDoctrine({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    doctrineId: 'survey_discipline',
    actor: 'AGENT',
    idempotencyKey: 'ut-18-agent-blocked',
    nowMs: 1700_000_246_000
  });
  assert.equal(blocked.ok, false);
  assert.equal(blocked.error.code, 'FORBIDDEN_POLICY');
  const approval = engine.createApprovalRequest({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    actionName: 'select_doctrine',
    requestedParams: { doctrineId: 'survey_discipline' },
    title: 'Select Survey Discipline',
    body: 'Allow one engine-owned Research Lodge doctrine stance.',
    actor: 'AGENT',
    idempotencyKey: 'ut-18-approval',
    nowMs: 1700_000_247_000
  });
  assert.equal(approval.ok, true);
  const resolved = engine.resolveApproval({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    approvalId: approval.approval.approvalId,
    decision: 'approve',
    nowMs: 1700_000_248_000
  });
  assert.equal(resolved.ok, true);
  const selected = engine.selectDoctrine({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    doctrineId: 'survey_discipline',
    actor: 'AGENT',
    idempotencyKey: 'ut-18-agent-select',
    nowMs: 1700_000_249_000
  });
  assert.equal(selected.ok, true, selected.error?.message);
  assert.equal(selected.doctrineState.selectedBy, 'AGENT');
  const used = store.listApprovals(ctx.plotId).find((entry) => entry.approvalId === approval.approval.approvalId);
  assert.equal(used.status, 'USED');
});

test('FP-UT-019 Survey Discipline applies only the 5% SCOUT duration effect', () => {
  const baseCtx = seedFoundedOutpostFixture('pair-hq8-scout-base');
  const baseBefore = engine.getFoundersPlotState({
    pairId: baseCtx.pairId,
    plotId: baseCtx.plotId,
    nowMs: 1700_000_250_000
  });
  const baseBoard = buildingOf(baseBefore, 'EXPEDITION_BOARD');
  const baseInventory = baseBefore.state.plot.inventory;
  const baseClaims = baseBefore.state.settlementClaims.map((claim) => ({ claimId: claim.claimId, status: claim.status, foundedPlotId: claim.foundedPlotId }));
  const baseQueued = engine.queueJob({
    pairId: baseCtx.pairId,
    plotId: baseCtx.plotId,
    buildingId: baseBoard.buildingId,
    kind: 'SCOUT',
    actor: 'HUMAN',
    idempotencyKey: 'ut-19-base-scout',
    nowMs: 1700_000_251_000
  });
  assert.equal(baseQueued.ok, true, baseQueued.error?.message);
  assert.equal(baseQueued.job.durationMs, 90_000);
  assert.equal(baseQueued.job.endsAt - baseQueued.job.startedAt, 90_000);
  assert.deepEqual(baseQueued.job.input, { food: 6, wood: 4 });
  assert.deepEqual(baseQueued.job.output, { scout_report: 1 });
  assert.equal(baseQueued.state.plot.inventory.wood, baseInventory.wood - 4);
  assert.equal(baseQueued.state.plot.inventory.food, baseInventory.food - 6);
  assert.equal(baseQueued.state.plot.inventory.stone, baseInventory.stone);
  assert.equal(baseQueued.state.plot.inventory.coin, baseInventory.coin);
  assert.deepEqual(baseQueued.state.settlementClaims.map((claim) => ({ claimId: claim.claimId, status: claim.status, foundedPlotId: claim.foundedPlotId })), baseClaims);
  const baseEarly = engine.advancePlotTimeForTests({
    pairId: baseCtx.pairId,
    plotId: baseCtx.plotId,
    advanceMs: 85_500,
    nowMs: 1700_000_251_000
  });
  assert.equal(baseEarly.ok, true);
  assert.equal(buildingOf(baseEarly, 'EXPEDITION_BOARD').state, 'PRODUCING');
  assert.equal(baseEarly.state.scoutReports.length, baseBefore.state.scoutReports.length);

  const effectCtx = seedFoundedOutpostFixture('pair-hq8-scout-effect');
  const selected = engine.selectDoctrine({
    pairId: effectCtx.pairId,
    plotId: effectCtx.plotId,
    doctrineId: 'survey_discipline',
    actor: 'HUMAN',
    idempotencyKey: 'ut-19-select',
    nowMs: 1700_000_250_000
  });
  assert.equal(selected.ok, true, selected.error?.message);
  assert.equal(selected.doctrine.effectValue.durationMultiplier, 0.95);
  const effectBefore = engine.getFoundersPlotState({
    pairId: effectCtx.pairId,
    plotId: effectCtx.plotId,
    nowMs: 1700_000_250_500
  });
  const effectBoard = buildingOf(effectBefore, 'EXPEDITION_BOARD');
  const effectInventory = effectBefore.state.plot.inventory;
  const effectClaims = effectBefore.state.settlementClaims.map((claim) => ({ claimId: claim.claimId, status: claim.status, foundedPlotId: claim.foundedPlotId }));
  const effectQueued = engine.queueJob({
    pairId: effectCtx.pairId,
    plotId: effectCtx.plotId,
    buildingId: effectBoard.buildingId,
    kind: 'SCOUT',
    actor: 'HUMAN',
    idempotencyKey: 'ut-19-effect-scout',
    nowMs: 1700_000_251_000
  });
  assert.equal(effectQueued.ok, true, effectQueued.error?.message);
  assert.equal(effectQueued.job.durationMs, 85_500);
  assert.equal(effectQueued.job.endsAt - effectQueued.job.startedAt, 85_500);
  assert.deepEqual(effectQueued.job.input, baseQueued.job.input);
  assert.deepEqual(effectQueued.job.output, baseQueued.job.output);
  assert.equal(effectQueued.state.plot.inventory.wood, effectInventory.wood - 4);
  assert.equal(effectQueued.state.plot.inventory.food, effectInventory.food - 6);
  assert.equal(effectQueued.state.plot.inventory.stone, effectInventory.stone);
  assert.equal(effectQueued.state.plot.inventory.coin, effectInventory.coin);
  assert.deepEqual(effectQueued.state.settlementClaims.map((claim) => ({ claimId: claim.claimId, status: claim.status, foundedPlotId: claim.foundedPlotId })), effectClaims);
  const repeat = engine.queueJob({
    pairId: effectCtx.pairId,
    plotId: effectCtx.plotId,
    buildingId: effectBoard.buildingId,
    kind: 'SCOUT',
    actor: 'HUMAN',
    idempotencyKey: 'ut-19-effect-scout',
    nowMs: 1700_000_252_000
  });
  assert.equal(repeat.ok, true);
  assert.equal(repeat.job.jobId, effectQueued.job.jobId);
  assert.equal(repeat.job.durationMs, 85_500);
  assert.equal(repeat.stateHash, effectQueued.stateHash);
  const effectDone = engine.advancePlotTimeForTests({
    pairId: effectCtx.pairId,
    plotId: effectCtx.plotId,
    advanceMs: 85_500,
    nowMs: 1700_000_251_000
  });
  assert.equal(effectDone.ok, true);
  assert.equal(buildingOf(effectDone, 'EXPEDITION_BOARD').state, 'OUTPUT_READY');
  assert.equal(effectDone.worldDelta.some((entry) => entry.type === 'JOB_COMPLETED'), true);
});

test('FP-UT-020 HQ9B work-order executor collects at most two ready outputs once', () => {
  const ctx = seedFoundedOutpostFixture('pair-hq9b-execute');
  const selected = engine.selectDoctrine({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    doctrineId: 'survey_discipline',
    actor: 'HUMAN',
    idempotencyKey: 'ut-20-select',
    nowMs: 1700_000_260_000
  });
  assert.equal(selected.ok, true, selected.error?.message);
  const readyBuildings = seedReadyOutputBuildings(ctx.plotId, 3);
  const before = engine.getFoundersPlotState({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    nowMs: 1700_000_261_000
  });
  const inventoryBefore = before.state.plot.inventory;
  const claimsBefore = before.state.settlementClaims.map((claim) => ({ claimId: claim.claimId, status: claim.status, foundedPlotId: claim.foundedPlotId }));
  const draft = engine.createWorkOrderDraft({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    templateId: 'collect_ready_outputs_once',
    scope: {},
    actor: 'HUMAN',
    idempotencyKey: 'ut-20-draft',
    nowMs: 1700_000_262_000
  });
  assert.equal(draft.ok, true, draft.error?.message);
  const executed = engine.executeWorkOrder({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    workOrderId: draft.workOrder.workOrderId,
    actor: 'HUMAN',
    idempotencyKey: 'ut-20-execute',
    nowMs: 1700_000_263_000
  });
  assert.equal(executed.ok, true, executed.error?.message);
  assert.equal(executed.executedChildCount, 2);
  assert.equal(executed.workOrder.status, 'COMPLETED');
  assert.equal(executed.workOrder.childReceipts.length, 2);
  assert.deepEqual(executed.workOrder.childReceipts.map((receipt) => receipt.parentWorkOrderId),
    [draft.workOrder.workOrderId, draft.workOrder.workOrderId]);
  assert.deepEqual(executed.workOrder.childReceipts.map((receipt) => receipt.childAction),
    ['et.plot.collect_outputs', 'et.plot.collect_outputs']);
  assert.ok(executed.workOrder.childReceipts.every((receipt) => receipt.childIdempotencyKey.includes('ut-20-execute:child:')));
  assert.equal(executed.state.plot.inventory.wood, inventoryBefore.wood + 12);
  assert.equal(executed.state.plot.inventory.food, inventoryBefore.food + 9);
  assert.equal(executed.state.plot.inventory.stone, inventoryBefore.stone);
  assert.deepEqual(executed.state.settlementClaims.map((claim) => ({ claimId: claim.claimId, status: claim.status, foundedPlotId: claim.foundedPlotId })), claimsBefore);
  assert.equal(executed.state.buildings.find((building) => building.buildingId === readyBuildings[2].buildingId).state, 'OUTPUT_READY');
  assert.equal(executed.worldDelta.some((entry) => entry.type === 'WORK_ORDER_EXECUTED'), true);
  const repeat = engine.executeWorkOrder({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    workOrderId: draft.workOrder.workOrderId,
    actor: 'HUMAN',
    idempotencyKey: 'ut-20-execute',
    nowMs: 1700_000_264_000
  });
  assert.equal(repeat.ok, true);
  assert.equal(repeat.stateHash, executed.stateHash);
  const secondAttempt = engine.executeWorkOrder({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    workOrderId: draft.workOrder.workOrderId,
    actor: 'HUMAN',
    idempotencyKey: 'ut-20-execute-again',
    nowMs: 1700_000_265_000
  });
  assert.equal(secondAttempt.ok, false);
  assert.equal(secondAttempt.error.code, 'INVALID_STATE');
});

test('FP-UT-021 HQ9B agent work-order execution requires parent approval and collect policy', () => {
  const ctx = seedFoundedOutpostFixture('pair-hq9b-agent');
  const selected = engine.selectDoctrine({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    doctrineId: 'survey_discipline',
    actor: 'HUMAN',
    idempotencyKey: 'ut-21-select',
    nowMs: 1700_000_270_000
  });
  assert.equal(selected.ok, true, selected.error?.message);
  seedReadyOutputBuildings(ctx.plotId, 1);
  const draft = engine.createWorkOrderDraft({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    templateId: 'collect_ready_outputs_once',
    scope: {},
    actor: 'HUMAN',
    idempotencyKey: 'ut-21-draft',
    nowMs: 1700_000_271_000
  });
  assert.equal(draft.ok, true, draft.error?.message);
  const blockedNoApproval = engine.executeWorkOrder({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    workOrderId: draft.workOrder.workOrderId,
    actor: 'AGENT',
    idempotencyKey: 'ut-21-agent-no-approval',
    nowMs: 1700_000_272_000
  });
  assert.equal(blockedNoApproval.ok, false);
  assert.equal(blockedNoApproval.error.code, 'FORBIDDEN_POLICY');
  const approval = engine.createApprovalRequest({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    actionName: 'execute_work_order',
    requestedParams: { workOrderId: draft.workOrder.workOrderId },
    title: 'Execute collect-ready work order',
    body: 'Allow one explicit collect-ready-outputs work order execution.',
    actor: 'AGENT',
    idempotencyKey: 'ut-21-approval',
    nowMs: 1700_000_273_000
  });
  assert.equal(approval.ok, true, approval.error?.message);
  const resolved = engine.resolveApproval({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    approvalId: approval.approval.approvalId,
    decision: 'approve',
    nowMs: 1700_000_274_000
  });
  assert.equal(resolved.ok, true);
  const blockedPolicy = engine.executeWorkOrder({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    workOrderId: draft.workOrder.workOrderId,
    actor: 'AGENT',
    idempotencyKey: 'ut-21-agent-policy-off',
    nowMs: 1700_000_275_000
  });
  assert.equal(blockedPolicy.ok, false);
  assert.equal(blockedPolicy.error.code, 'FORBIDDEN_POLICY');
  const stillApproved = store.listApprovals(ctx.plotId).find((entry) => entry.approvalId === approval.approval.approvalId);
  assert.equal(stillApproved.status, 'APPROVED');
  const policy = engine.setFoundersPlotPolicy({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    input: { collectOutputs: true, maxAutonomousActionsPerHour: 2 },
    nowMs: 1700_000_276_000
  });
  assert.equal(policy.ok, true);
  const executed = engine.executeWorkOrder({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    workOrderId: draft.workOrder.workOrderId,
    actor: 'AGENT',
    idempotencyKey: 'ut-21-agent-execute',
    nowMs: 1700_000_277_000
  });
  assert.equal(executed.ok, true, executed.error?.message);
  assert.equal(executed.executedChildCount, 1);
  assert.equal(executed.workOrder.approvedBy, 'HUMAN_APPROVAL');
  const used = store.listApprovals(ctx.plotId).find((entry) => entry.approvalId === approval.approvalId || entry.approvalId === approval.approval.approvalId);
  assert.equal(used.status, 'USED');
  assert.equal(executed.worldDelta.some((entry) => entry.type === 'AGENT_ACTION_EXECUTED'), true);
});

test('FP-UT-022 HQ9B work-order executor rejects empty and tampered executions before mutation', () => {
  const ctx = seedFoundedOutpostFixture('pair-hq9b-empty');
  const selected = engine.selectDoctrine({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    doctrineId: 'survey_discipline',
    actor: 'HUMAN',
    idempotencyKey: 'ut-22-select',
    nowMs: 1700_000_280_000
  });
  assert.equal(selected.ok, true, selected.error?.message);
  const draft = engine.createWorkOrderDraft({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    templateId: 'collect_ready_outputs_once',
    scope: {},
    actor: 'HUMAN',
    idempotencyKey: 'ut-22-draft',
    nowMs: 1700_000_281_000
  });
  assert.equal(draft.ok, true, draft.error?.message);
  const empty = engine.executeWorkOrder({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    workOrderId: draft.workOrder.workOrderId,
    actor: 'HUMAN',
    idempotencyKey: 'ut-22-empty-execute',
    nowMs: 1700_000_282_000
  });
  assert.equal(empty.ok, false);
  assert.equal(empty.error.code, 'INVALID_STATE');
  assert.equal(empty.error.details.reason, 'no_ready_outputs');
  assert.equal(store.getWorkOrder(draft.workOrder.workOrderId).status, 'DRAFT');

  const [readyBuilding] = seedReadyOutputBuildings(ctx.plotId, 1);
  store.writeWorkOrder({
    ...store.getWorkOrder(draft.workOrder.workOrderId),
    allowedActions: ['et.plot.found_settlement']
  });
  const tampered = engine.executeWorkOrder({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    workOrderId: draft.workOrder.workOrderId,
    actor: 'HUMAN',
    idempotencyKey: 'ut-22-tampered-execute',
    nowMs: 1700_000_283_000
  });
  assert.equal(tampered.ok, false);
  assert.equal(tampered.error.code, 'UNKNOWN_WORK_ORDER_TEMPLATE');
  const after = engine.getFoundersPlotState({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    nowMs: 1700_000_284_000
  });
  assert.equal(after.state.buildings.find((building) => building.buildingId === readyBuilding.buildingId).state, 'OUTPUT_READY');
});

test('FP-UT-023 HQ10A World Grid read model is read-only and follows server-owned readiness', () => {
  const locked = fresh('pair-hq10a-locked');
  assert.equal(locked.state.worldGrid.status, 'LOCKED');
  assert.equal(locked.state.worldGrid.readOnly, true);
  assert.deepEqual(locked.state.worldGrid.executableActions, []);
  assert.ok(locked.state.worldGrid.requirements.blockedBy.includes('hq.level.6'));

  const ctx = seedFoundedOutpostFixture('pair-hq10a-ready');
  const selected = engine.selectDoctrine({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    doctrineId: 'survey_discipline',
    actor: 'HUMAN',
    idempotencyKey: 'ut-23-select',
    nowMs: 1700_000_300_000
  });
  assert.equal(selected.ok, true, selected.error?.message);
  const draft = engine.createWorkOrderDraft({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    templateId: 'collect_ready_outputs_once',
    scope: {},
    actor: 'HUMAN',
    idempotencyKey: 'ut-23-draft',
    nowMs: 1700_000_301_000
  });
  assert.equal(draft.ok, true, draft.error?.message);

  const eventCountBefore = store.listEvents(ctx.plotId).length;
  const status = engine.getWorldGridStatus({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    nowMs: 1700_000_302_000
  });
  assert.equal(status.ok, true, status.error?.message);
  assert.deepEqual(status.worldDelta, []);
  assert.equal(store.listEvents(ctx.plotId).length, eventCountBefore);
  assert.equal(status.worldGrid.status, 'READ_MODEL_READY');
  assert.equal(status.worldGrid.civicReadiness.ready, true);
  assert.equal(status.worldGrid.civicReadiness.nextPromotableSlice, 'HQ10B_CIVIC_PROPOSAL_RECORDS');
  assert.equal(status.worldGrid.scope.outpostCount, 1);
  assert.ok(status.worldGrid.scope.knownPlotCount >= 2);
  assert.equal(status.worldGrid.claims.byStatus.FOUNDED, 1);
  assert.equal(status.worldGrid.doctrine.selectedDoctrineId, 'survey_discipline');
  assert.equal(status.worldGrid.workOrders.draftCount, 1);
  assert.equal(status.worldGrid.workOrders.executionAvailable, true);
  assert.ok(status.worldGrid.civicReadiness.prohibitedCapabilities.includes('atlas_owned_execution'));
  assert.match(status.worldGrid.projectionHash, /^[a-f0-9]{16}$/);

  const state = engine.getFoundersPlotState({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    nowMs: 1700_000_303_000
  });
  assert.equal(state.state.worldGrid.projectionHash, status.worldGrid.projectionHash);
  assert.equal(state.state.publicSummary.worldGridReady, true);
  assert.equal(Object.hasOwn(status.worldGrid.plots[0] || {}, 'updatedAt'), false);
});

test('FP-UT-027 HQ12A Expedition Map read model exposes fog cells from server truth only', () => {
  const locked = fresh('pair-hq12a-locked');
  assert.equal(locked.state.expeditionMap.status, 'ORIGIN_ONLY');
  assert.equal(locked.state.expeditionMap.readOnly, true);
  assert.deepEqual(locked.state.expeditionMap.executableActions, []);
  assert.equal(locked.state.expeditionMap.fog.counts.discovered, 1);
  assert.ok(locked.state.expeditionMap.fog.counts.locked_unknown > 0);

  const ctx = seedFoundedOutpostFixture('pair-hq12a-ready');
  const bundle = store.readPlotBundleById(ctx.plotId);
  bundle.plot.scoutReports = [
    ...bundle.plot.scoutReports,
    {
      reportId: 'scout_report_unit_river',
      originPlotId: ctx.plotId,
      sourceBuildingId: 'bldg_expedition_unit',
      title: 'Unit River Flat Survey',
      siteType: 'river_flat',
      risk: 'medium',
      traits: ['food-rich', 'water access'],
      resourceHints: { food: 2 },
      summary: 'A second visible frontier site, still unclaimed.',
      recommendedNext: 'Keep this as known map truth without founding anything.',
      sequence: 2,
      createdAt: 1700_000_001_000
    }
  ];
  bundle.plot.sitePlans = [
    ...bundle.plot.sitePlans,
    {
      planId: 'site_plan_unit_river',
      reportId: 'scout_report_unit_river',
      originPlotId: ctx.plotId,
      title: 'Unit River Outpost Plan',
      focus: 'safe',
      status: 'REVIEWED',
      promotionStatus: 'reviewed_claim_ready',
      reviewStatus: 'reviewed',
      source: 'scout_report',
      authorityBoundary: 'claim_ready_planning_only_no_territory',
      siteType: 'river_flat',
      risk: 'medium',
      traits: ['food-rich', 'water access'],
      resourceHints: { food: 2 },
      summary: 'Reviewed but intentionally not claimed.',
      recommendedNext: 'Wait for a separate convoy decision.',
      reviewedAt: 1700_000_002_000,
      reviewNote: 'Known frontier, no territory created.',
      sequence: 2,
      createdAt: 1700_000_001_000
    }
  ];
  store.writePlot(bundle.plot);

  const eventCountBefore = store.listEvents(ctx.plotId).length;
  const status = engine.getExpeditionMapStatus({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    nowMs: 1700_000_303_000
  });
  assert.equal(status.ok, true, status.error?.message);
  assert.deepEqual(status.worldDelta, []);
  assert.equal(store.listEvents(ctx.plotId).length, eventCountBefore);
  assert.equal(status.expeditionMap.status, 'FOG_READ_MODEL_READY');
  assert.equal(status.expeditionMap.readOnly, true);
  assert.deepEqual(status.expeditionMap.executableActions, []);
  assert.equal(status.expeditionMap.authorityBoundary, engine.EXPEDITION_MAP_AUTHORITY_BOUNDARY);
  assert.equal(status.expeditionMap.expeditionParty.partyId, 'expedition_party_current_plot_v1');
  assert.equal(status.expeditionMap.expeditionParty.readOnly, true);
  assert.deepEqual(status.expeditionMap.expeditionParty.executableActions, []);
  assert.equal(status.expeditionMap.expeditionParty.authorityBoundary, engine.EXPEDITION_PARTY_MANIFEST_AUTHORITY_BOUNDARY);
  assert.deepEqual(status.expeditionMap.expeditionParty.members.map((member) => member.displayName), [
    'Mira Trailmark',
    'Rook Signalpost',
    'Vale-Desk 7'
  ]);
  assert.equal(status.expeditionMap.expeditionParty.members[0].assetSrc, '/experiences/founders-plot/assets/characters/inhabitants/scout/pathfinder-scout-v1.png');
  assert.equal(status.expeditionMap.expeditionParty.members[1].metadataSrc, '/experiences/founders-plot/assets/characters/inhabitants/messenger/rook-signalpost-messenger-v1.json');
  assert.equal(status.expeditionMap.expeditionParty.boundaryFlags.operatorAssignment, false);
  assert.equal(status.expeditionMap.expeditionParty.boundaryFlags.autonomousMovement, false);
  assert.equal(status.expeditionMap.expeditionParty.boundaryFlags.resourceHarvesting, false);
  assert.deepEqual(status.expeditionMap.expeditionParty.boundaryFlags.resourceDelta, {});
  assert.equal(status.expeditionMap.expeditionParty.boundaryFlags.routeCreation, false);
  assert.equal(status.expeditionMap.expeditionParty.boundaryFlags.tradeRouteCreation, false);
  assert.equal(status.expeditionMap.expeditionParty.boundaryFlags.backgroundScheduling, false);
  assert.equal(status.expeditionMap.expeditionParty.boundaryFlags.combat, false);
  assert.equal(status.expeditionMap.expeditionParty.boundaryFlags.publicSharing, false);
  assert.equal(status.expeditionMap.expeditionParty.boundaryFlags.generatedUniverseRendering, false);
  assert.equal(status.expeditionMap.expeditionParty.boundaryFlags.crossPlotMutation, false);
  assert.equal(status.expeditionMap.expeditionParty.boundaryFlags.atlasExecution, false);
  assert.equal(status.expeditionMap.expeditionParty.boundaryFlags.externalEffects, false);
  assert.equal(status.expeditionMap.units.authorityBoundary, engine.EXPEDITION_UNIT_ROSTER_AUTHORITY_BOUNDARY);
  assert.equal(status.expeditionMap.units.version, engine.EXPEDITION_UNIT_ROSTER_VERSION);
  assert.equal(status.expeditionMap.units.readOnly, true);
  assert.deepEqual(status.expeditionMap.units.executableActions, []);
  assert.equal(status.expeditionMap.units.interactionModel.mapTokens, true);
  assert.equal(status.expeditionMap.units.interactionModel.movementPreviewOnly, false);
  assert.equal(status.expeditionMap.units.interactionModel.movementCommandReady, true);
  assert.equal(status.expeditionMap.units.boundaryFlags.movementMutation, true);
  assert.equal(status.expeditionMap.units.boundaryFlags.movementRevealsFog, false);
  assert.equal(status.expeditionMap.units.boundaryFlags.autonomousMovement, false);
  assert.equal(status.expeditionMap.units.boundaryFlags.routeCreation, false);
  assert.equal(status.expeditionMap.units.boundaryFlags.atlasExecution, false);
  assert.equal(status.expeditionMap.units.boundaryFlags.externalEffects, false);
  assert.ok(status.expeditionMap.units.items.length >= 4);
  assert.ok(status.expeditionMap.units.items.some((unit) => unit.unitType === 'scout' && unit.location.cellId));
  assert.ok(status.expeditionMap.units.items.some((unit) => unit.unitType === 'courier'));
  assert.ok(status.expeditionMap.units.items.some((unit) => unit.unitType === 'surveyor'));
  assert.ok(status.expeditionMap.units.items.some((unit) => unit.unitType === 'field_support'));
  assert.ok(status.expeditionMap.units.items.some((unit) => unit.unitType === 'outpost_crew'));
  assert.equal(status.expeditionMap.units.items.every((unit) => unit.readOnly === true), true);
  assert.equal(status.expeditionMap.units.items.every((unit) => unit.selectable === true), true);
  assert.equal(status.expeditionMap.units.items.some((unit) => unit.unitType === 'scout' && unit.movement.movementMutationImplemented === true), true);
  assert.equal(status.expeditionMap.units.items.filter((unit) => unit.unitType !== 'scout').every((unit) => unit.movement.movementMutationImplemented === false), true);
  assert.equal(status.expeditionMap.units.items.every((unit) => unit.boundaryFlags.resourceHarvesting === false), true);
  assert.equal(status.expeditionMap.units.items.every((unit) => unit.boundaryFlags.combat === false), true);
  const scoutUnit = status.expeditionMap.units.items.find((unit) => unit.unitType === 'scout');
  assert.ok(scoutUnit.commandHints.some((command) => command.commandId === 'move_unit' && command.actionName === 'et.plot.move_expedition_unit'));
  assert.ok(scoutUnit.movement.allowedTargetCellIds.length >= 1);
  assert.ok(scoutUnit.commandHints.some((command) => command.commandId === 'scout_sector' && command.actionName === 'et.plot.scout_sector'));
  assert.ok((status.expeditionMap.units.byCellId[scoutUnit.location.cellId] || []).includes(scoutUnit.unitId));
  const unclaimedSurveyor = status.expeditionMap.units.items.find((unit) => unit.unitId === 'expedition_unit_surveyor_site_plan_unit_river');
  assert.ok(unclaimedSurveyor, 'expected unclaimed reviewed Site Plan surveyor');
  assert.ok(unclaimedSurveyor.commandHints.some((command) => (
    command.commandId === 'prepare_settler_convoy'
    && command.actionName === 'et.plot.prepare_settler_convoy'
    && command.sourcePlanId === 'site_plan_unit_river'
    && command.serverMutationImplemented === true
  )));
  const claimedSurveyor = status.expeditionMap.units.items.find((unit) => unit.unitId === 'expedition_unit_surveyor_site_plan_unit_forest');
  assert.ok(claimedSurveyor, 'expected claimed reviewed Site Plan surveyor');
  assert.equal(claimedSurveyor.commandHints.some((command) => command.commandId === 'prepare_settler_convoy'), false);
  assert.ok(status.expeditionMap.fog.counts.discovered >= 2);
  assert.ok(status.expeditionMap.fog.counts.known >= 1);
  assert.ok(status.expeditionMap.fog.counts.hinted >= 1);
  assert.ok(status.expeditionMap.fog.counts.locked_unknown >= 1);
  assert.equal(status.expeditionMap.receipt.readOnly, true);
  assert.equal(status.expeditionMap.receipt.routeCreation, false);
  assert.equal(status.expeditionMap.receipt.atlasExecution, false);
  assert.equal(status.expeditionMap.cells.every((cell) => cell.readOnly === true), true);
  assert.ok(status.expeditionMap.cells.some((cell) => cell.status === 'OWNED_OUTPOST'));
  assert.ok(status.expeditionMap.cells.some((cell) => cell.status === 'SITE_PLAN_REVIEWED'));
  assert.ok(status.expeditionMap.cells.some((cell) => cell.fogState === 'hinted'));
  assert.ok(status.expeditionMap.cells.some((cell) => cell.fogState === 'locked_unknown'));
  assert.equal(status.expeditionMap.cells.every((cell) => cell.terrainAssetContractVersion === engine.EXPEDITION_PUBLIC_TERRAIN_ASSET_CONTRACT_VERSION), true);
  assert.equal(status.expeditionMap.cells
    .filter((cell) => ['discovered', 'known'].includes(cell.fogState))
    .every((cell) => engine.EXPEDITION_PUBLIC_TERRAIN_ASSET_SLOTS.includes(cell.publicTerrainAssetSlot)), true);
  assert.equal(status.expeditionMap.cells
    .filter((cell) => ['hinted', 'locked_unknown'].includes(cell.fogState))
    .every((cell) => cell.publicTerrainAssetSlot == null), true);
  assert.equal(status.expeditionMap.cells
    .filter((cell) => ['hinted', 'locked_unknown'].includes(cell.fogState))
    .every((cell) => ['hinted_frontier_fog', 'locked_unknown_fog'].includes(cell.fogAssetSlot)), true);
  assert.equal(status.expeditionMap.cells
    .filter((cell) => /river|water|coast/i.test(`${cell.siteType || ''} ${(cell.traits || []).join(' ')}`))
    .every((cell) => cell.publicTerrainAssetSlot !== 'water' && cell.publicTerrainAssetSlot !== 'coast'), true);
  assert.equal(status.expeditionMap.cells.some((cell) => cell.publicTerrainAssetSlot === 'forest'), true);
  assert.equal(status.expeditionMap.cells.some((cell) => cell.publicTerrainAssetSlot === 'settled'), true);

  const state = engine.getFoundersPlotState({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    nowMs: 1700_000_303_000
  });
  assert.equal(state.state.expeditionMap.projectionHash, status.expeditionMap.projectionHash);
  assert.equal(state.state.publicSummary.expeditionMapStatus, 'FOG_READ_MODEL_READY');
  assert.equal(state.state.publicSummary.expeditionMapKnownCount, status.expeditionMap.fog.counts.known);
});

test('FP-UT-028 HQ12C Scout Sector reveals one same-plot hinted sector with approval gates', () => {
  const ctx = seedFoundedOutpostFixture('pair-hq12c-human');
  const before = engine.getExpeditionMapStatus({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    nowMs: 1700_000_303_000
  });
  assert.equal(before.ok, true, before.error?.message);
  const target = before.expeditionMap.cells.find((cell) => cell.fogState === 'hinted');
  assert.ok(target, 'expected one eligible hinted frontier cell');
  const inventoryBefore = engine.getFoundersPlotState({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    nowMs: 1700_000_303_000
  }).state.plot.inventory;

  const scouted = engine.scoutExpeditionSector({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    cellId: target.cellId,
    actor: 'HUMAN',
    idempotencyKey: 'ut-28-scout-sector',
    nowMs: 1700_000_304_000
  });
  assert.equal(scouted.ok, true, scouted.error?.message);
  assert.equal(scouted.revealedCellId, target.cellId);
  assert.equal(scouted.alreadyScouted, false);
  assert.equal(scouted.scoutSector.cellId, target.cellId);
  assert.equal(scouted.scoutSector.receipt.routeCreation, false);
  assert.equal(scouted.scoutSector.receipt.atlasExecution, false);
  assert.equal(scouted.scoutSector.receipt.crossPlotMutation, false);
  assert.equal(scouted.eventPacket.packetId, scouted.scoutSector.eventPacket.packetId);
  assert.equal(scouted.scoutSector.receipt.eventPacketId, scouted.eventPacket.packetId);
  assert.equal(scouted.eventPacket.kind, 'expedition_event_packet');
  assert.equal(scouted.eventPacket.readOnly, true);
  assert.deepEqual(scouted.eventPacket.executableActions, []);
  assert.equal(scouted.eventPacket.authorityBoundary, engine.EXPEDITION_EVENT_PACKET_AUTHORITY_BOUNDARY);
  assert.equal(scouted.eventPacket.partyId, 'expedition_party_current_plot_v1');
  assert.equal(scouted.eventPacket.partySnapshot.readOnly, true);
  assert.deepEqual(scouted.eventPacket.partySnapshot.executableActions, []);
  assert.deepEqual(scouted.eventPacket.partySnapshot.members, [
    { memberId: 'pathfinder-scout-v1', displayName: 'Mira Trailmark', role: 'scout' },
    { memberId: 'rook-signalpost-messenger-v1', displayName: 'Rook Signalpost', role: 'messenger' },
    { memberId: 'hq-civic-operator-vale-desk-7-v1', displayName: 'Vale-Desk 7', role: 'hq_civic_operator' }
  ]);
  assert.equal(scouted.eventPacket.partySnapshot.boundaryFlags.operatorAssignment, false);
  assert.equal(scouted.eventPacket.partySnapshot.boundaryFlags.autonomousMovement, false);
  assert.equal(scouted.eventPacket.partySnapshot.boundaryFlags.externalEffects, false);
  assert.equal(scouted.eventPacket.receiptLink.scoutId, scouted.scoutSector.scoutId);
  assert.equal(scouted.eventPacket.receiptLink.cellId, target.cellId);
  assert.equal(scouted.eventPacket.boundaryFlags.resourceHarvesting, false);
  assert.deepEqual(scouted.eventPacket.boundaryFlags.resourceDelta, {});
  assert.equal(scouted.eventPacket.boundaryFlags.routeCreation, false);
  assert.equal(scouted.eventPacket.boundaryFlags.atlasExecution, false);
  assert.match(scouted.eventPacket.discoveryFlavor, /packet$/);
  assert.ok(scouted.eventPacket.terrainExplanation.length > 20);
  assert.ok(scouted.eventPacket.riskExplanation.length > 20);
  assert.equal(scouted.proof.targetBeforeFogState, 'hinted');
  assert.equal(scouted.proof.targetAfterFogState, 'known');
  assert.equal(scouted.proof.eventPacketId, scouted.eventPacket.packetId);
  assert.deepEqual(scouted.proof.newlyKnownOrDiscoveredCellIds, [target.cellId]);
  assert.equal(scouted.worldDelta.some((entry) => entry.type === 'EXPEDITION_SECTOR_SCOUTED'), true);
  assert.deepEqual(scouted.state.plot.inventory, inventoryBefore);

  const later = engine.getExpeditionMapStatus({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    nowMs: 1700_000_305_000
  });
  const revealed = later.expeditionMap.cells.find((cell) => cell.cellId === target.cellId);
  assert.equal(revealed.fogState, 'known');
  assert.equal(revealed.sourceTruth, 'expedition_scout_sector');
  assert.equal(revealed.eventPacket.packetId, scouted.eventPacket.packetId);
  assert.equal(later.expeditionMap.eventPackets.some((packet) => packet.packetId === scouted.eventPacket.packetId), true);
  assert.equal(later.expeditionMap.sourceSummary.eventPacketIds.includes(scouted.eventPacket.packetId), true);
  assert.equal(later.expeditionMap.scope.scoutedSectorCount, 1);
  assert.equal(later.expeditionMap.surveyBridge.kind, 'scout_packet_to_survey_bridge');
  assert.equal(later.expeditionMap.surveyBridge.version, engine.EXPEDITION_SURVEY_BRIDGE_VERSION);
  assert.equal(later.expeditionMap.surveyBridge.readOnly, true);
  assert.deepEqual(later.expeditionMap.surveyBridge.executableActions, []);
  assert.equal(later.expeditionMap.surveyBridge.authorityBoundary, engine.EXPEDITION_SURVEY_BRIDGE_AUTHORITY_BOUNDARY);
  assert.equal(later.expeditionMap.surveyBridge.activePacketId, scouted.eventPacket.packetId);
  assert.equal(later.expeditionMap.surveyBridge.activeCellId, target.cellId);
  assert.equal(later.expeditionMap.surveyBridge.status, 'PACKET_READY_FOR_SITE_PLAN_PREFLIGHT');
  assert.equal(later.expeditionMap.surveyBridge.activeCandidate.commandState.commandId, 'survey_site_plan_contract_required');
  assert.equal(later.expeditionMap.surveyBridge.activeCandidate.commandState.serverMutationImplemented, false);
  assert.deepEqual(later.expeditionMap.surveyBridge.activeCandidate.commandState.executableActions, []);
  assert.equal(later.expeditionMap.surveyBridge.activeCandidate.nextRequiredContract, 'explicit_packet_to_site_plan_server_contract');
  assert.equal(later.expeditionMap.surveyBridge.boundaryFlags.createsSitePlan, false);
  assert.equal(later.expeditionMap.surveyBridge.boundaryFlags.createsSurveyor, false);
  assert.equal(later.expeditionMap.surveyBridge.boundaryFlags.addsMutationAuthority, false);
  assert.equal(later.expeditionMap.surveyBridge.boundaryFlags.hiddenTruthLeakage, false);
  assert.equal(later.expeditionMap.surveyBridge.boundaryFlags.routeCreation, false);
  assert.equal(later.expeditionMap.surveyBridge.boundaryFlags.atlasExecution, false);
  assert.equal(later.expeditionMap.sourceSummary.surveyBridgeCandidatePacketIds.includes(scouted.eventPacket.packetId), true);

  const repeated = engine.scoutExpeditionSector({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    cellId: target.cellId,
    actor: 'HUMAN',
    idempotencyKey: 'ut-28-scout-sector',
    nowMs: 1700_000_306_000
  });
  assert.equal(repeated.scoutSector.scoutId, scouted.scoutSector.scoutId);
  assert.deepEqual(repeated.eventPacket.partySnapshot, scouted.eventPacket.partySnapshot);

  const duplicateTarget = engine.scoutExpeditionSector({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    cellId: target.cellId,
    actor: 'HUMAN',
    idempotencyKey: 'ut-28-scout-sector-duplicate-target',
    nowMs: 1700_000_307_000
  });
  assert.equal(duplicateTarget.ok, true);
  assert.equal(duplicateTarget.alreadyScouted, true);
  assert.equal(duplicateTarget.eventPacket.packetId, scouted.eventPacket.packetId);
  assert.deepEqual(duplicateTarget.eventPacket.partySnapshot, scouted.eventPacket.partySnapshot);
  assert.deepEqual(duplicateTarget.worldDelta, []);

  const agentCtx = seedFoundedOutpostFixture('pair-hq12c-agent');
  const agentBefore = engine.getExpeditionMapStatus({
    pairId: agentCtx.pairId,
    plotId: agentCtx.plotId,
    nowMs: 1700_000_310_000
  });
  const agentTarget = agentBefore.expeditionMap.cells.find((cell) => cell.fogState === 'hinted');
  const blocked = engine.scoutExpeditionSector({
    pairId: agentCtx.pairId,
    plotId: agentCtx.plotId,
    cellId: agentTarget.cellId,
    actorType: 'AGENT',
    idempotencyKey: 'ut-28-agent-blocked',
    nowMs: 1700_000_311_000
  });
  assert.equal(blocked.ok, false);
  assert.equal(blocked.error.code, 'FORBIDDEN_POLICY');
  assert.equal(blocked.error.details.requiresApproval, true);

  const approval = engine.createApprovalRequest({
    pairId: agentCtx.pairId,
    plotId: agentCtx.plotId,
    actionName: 'scout_sector',
    requestedParams: { cellId: agentTarget.cellId },
    title: 'Approve Scout Sector',
    body: 'Allow one approved scout-sector reveal for the current plot.',
    idempotencyKey: 'ut-28-agent-approval',
    nowMs: 1700_000_312_000
  });
  assert.equal(approval.ok, true, approval.error?.message);
  const resolved = engine.resolveApproval({
    pairId: agentCtx.pairId,
    plotId: agentCtx.plotId,
    approvalId: approval.approval.approvalId,
    decision: 'approve',
    nowMs: 1700_000_313_000
  });
  assert.equal(resolved.ok, true, resolved.error?.message);
  const agentScout = engine.scoutExpeditionSector({
    pairId: agentCtx.pairId,
    plotId: agentCtx.plotId,
    cellId: agentTarget.cellId,
    actorType: 'AGENT',
    idempotencyKey: 'ut-28-agent-approved',
    nowMs: 1700_000_314_000
  });
  assert.equal(agentScout.ok, true, agentScout.error?.message);
  assert.equal(agentScout.scoutSector.approvedBy, 'HUMAN_APPROVAL');
  assert.equal(agentScout.worldDelta.some((entry) => entry.type === 'AGENT_ACTION_EXECUTED'), true);
});

test('FP-UT-029 HQ15G Move Expedition Unit moves one Scout between revealed adjacent cells only', () => {
  const ctx = seedFoundedOutpostFixture('pair-hq15g-move-human');
  const before = engine.getExpeditionMapStatus({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    nowMs: 1700_000_330_000
  });
  assert.equal(before.ok, true, before.error?.message);
  const scoutUnit = before.expeditionMap.units.items.find((unit) => unit.unitType === 'scout');
  assert.ok(scoutUnit, 'expected Scout unit');
  assert.equal(scoutUnit.movement.movementMutationImplemented, true);
  assert.equal(scoutUnit.boundaryFlags.movementMutation, true);
  assert.equal(scoutUnit.boundaryFlags.autonomousMovement, false);
  assert.equal(scoutUnit.boundaryFlags.routeCreation, false);
  const targetCellId = scoutUnit.movement.allowedTargetCellIds[0];
  assert.ok(targetCellId, 'expected one adjacent revealed move target');
  const targetCell = before.expeditionMap.cells.find((cell) => cell.cellId === targetCellId);
  assert.ok(['discovered', 'known'].includes(targetCell.fogState));
  const hiddenCell = before.expeditionMap.cells.find((cell) => ['hinted', 'locked_unknown'].includes(cell.fogState));
  assert.ok(hiddenCell, 'expected hidden cell for negative fixture');
  const inventoryBefore = engine.getFoundersPlotState({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    nowMs: 1700_000_330_000
  }).state.plot.inventory;

  const moved = engine.moveExpeditionUnit({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    unitId: scoutUnit.unitId,
    targetCellId,
    actor: 'HUMAN',
    idempotencyKey: 'ut-29-move-scout',
    nowMs: 1700_000_331_000
  });
  assert.equal(moved.ok, true, moved.error?.message);
  assert.equal(moved.movedUnitId, scoutUnit.unitId);
  assert.equal(moved.sourceCellId, scoutUnit.location.cellId);
  assert.equal(moved.targetCellId, targetCellId);
  assert.equal(moved.alreadyMoved, false);
  assert.equal(moved.move.receipt.actionName, 'et.plot.move_expedition_unit');
  assert.equal(moved.move.receipt.authorityBoundary, engine.EXPEDITION_UNIT_MOVE_AUTHORITY_BOUNDARY);
  assert.equal(moved.move.receipt.movementRevealsFog, false);
  assert.equal(moved.move.receipt.routeCreation, false);
  assert.equal(moved.move.receipt.atlasExecution, false);
  assert.equal(moved.move.receipt.externalEffects, false);
  assert.equal(moved.proof.fogCountsUnchanged, true);
  assert.equal(moved.proof.boundaryFlags.movementMutation, true);
  assert.equal(moved.proof.boundaryFlags.movementRevealsFog, false);
  assert.equal(moved.proof.boundaryFlags.resourceHarvesting, false);
  assert.equal(moved.proof.boundaryFlags.routeCreation, false);
  assert.equal(moved.proof.boundaryFlags.atlasExecution, false);
  assert.equal(moved.worldDelta.some((entry) => entry.type === 'EXPEDITION_UNIT_MOVED'), true);
  assert.deepEqual(moved.state.plot.inventory, inventoryBefore);

  const later = engine.getExpeditionMapStatus({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    nowMs: 1700_000_332_000
  });
  const movedScout = later.expeditionMap.units.items.find((unit) => unit.unitId === scoutUnit.unitId);
  assert.equal(movedScout.location.cellId, targetCellId);
  assert.equal(movedScout.location.source, 'expedition_unit_move_receipt');
  assert.equal(movedScout.lastMove.moveId, moved.move.moveId);
  assert.ok((later.expeditionMap.units.byCellId[targetCellId] || []).includes(scoutUnit.unitId));
  assert.equal(later.expeditionMap.sourceSummary.expeditionUnitMoveIds.includes(moved.move.moveId), true);
  assert.deepEqual(later.expeditionMap.fog.counts, before.expeditionMap.fog.counts);

  const repeated = engine.moveExpeditionUnit({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    unitId: scoutUnit.unitId,
    targetCellId,
    actor: 'HUMAN',
    idempotencyKey: 'ut-29-move-scout',
    nowMs: 1700_000_333_000
  });
  assert.equal(repeated.move.moveId, moved.move.moveId);
  assert.equal(repeated.targetCellId, moved.targetCellId);

  const blockedHidden = engine.moveExpeditionUnit({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    unitId: scoutUnit.unitId,
    targetCellId: hiddenCell.cellId,
    actor: 'HUMAN',
    idempotencyKey: 'ut-29-hidden-blocked',
    nowMs: 1700_000_334_000
  });
  assert.equal(blockedHidden.ok, false);
  assert.equal(blockedHidden.error.details.allowedFogStates.includes('known'), true);

  const agentCtx = seedFoundedOutpostFixture('pair-hq15g-move-agent');
  const agentBefore = engine.getExpeditionMapStatus({
    pairId: agentCtx.pairId,
    plotId: agentCtx.plotId,
    nowMs: 1700_000_335_000
  });
  const agentScout = agentBefore.expeditionMap.units.items.find((unit) => unit.unitType === 'scout');
  const agentTargetCellId = agentScout.movement.allowedTargetCellIds[0];
  const blockedAgent = engine.moveExpeditionUnit({
    pairId: agentCtx.pairId,
    plotId: agentCtx.plotId,
    unitId: agentScout.unitId,
    targetCellId: agentTargetCellId,
    actorType: 'AGENT',
    idempotencyKey: 'ut-29-agent-blocked',
    nowMs: 1700_000_336_000
  });
  assert.equal(blockedAgent.ok, false);
  assert.equal(blockedAgent.error.code, 'FORBIDDEN_POLICY');
  assert.equal(blockedAgent.error.details.requiresApproval, true);
});

test('FP-UT-024 HQ10B civic proposal records are persisted, gated, and proposal-only', () => {
  const locked = fresh('pair-hq10b-locked');
  const rejected = engine.createCivicProposalRecord({
    pairId: locked.state.plot.pairId,
    plotId: locked.plotId,
    title: 'Locked proposal',
    summary: 'This should wait for World Grid readiness.',
    actor: 'HUMAN',
    idempotencyKey: 'ut-24-locked',
    nowMs: 1700_000_310_000
  });
  assert.equal(rejected.ok, false);
  assert.equal(rejected.error.details.reason, 'world_grid_not_ready');

  const ctx = seedFoundedOutpostFixture('pair-hq10b-ready');
  const selected = engine.selectDoctrine({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    doctrineId: 'survey_discipline',
    actor: 'HUMAN',
    idempotencyKey: 'ut-24-select',
    nowMs: 1700_000_311_000
  });
  assert.equal(selected.ok, true, selected.error?.message);
  const draftWorkOrder = engine.createWorkOrderDraft({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    templateId: 'collect_ready_outputs_once',
    scope: {},
    actor: 'HUMAN',
    idempotencyKey: 'ut-24-work-order',
    nowMs: 1700_000_312_000
  });
  assert.equal(draftWorkOrder.ok, true, draftWorkOrder.error?.message);

  const before = engine.getFoundersPlotState({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    nowMs: 1700_000_313_000
  });
  const created = engine.createCivicProposalRecord({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    title: 'Civic map table review',
    category: 'coordination',
    summary: 'Record a review note for a shared map table between the home plot and outpost.',
    status: 'REVIEWED',
    relatedPlotIds: [ctx.foundedPlotId, 'plot_not_owned'],
    reviewNote: 'Reviewed as a record only.',
    actor: 'HUMAN',
    idempotencyKey: 'ut-24-create',
    nowMs: 1700_000_314_000
  });
  assert.equal(created.ok, true, created.error?.message);
  assert.equal(created.civicProposal.status, 'REVIEWED');
  assert.equal(created.civicProposal.authorityBoundary, engine.CIVIC_PROPOSAL_AUTHORITY_BOUNDARY);
  assert.equal(created.civicProposal.scope.executionAllowed, false);
  assert.deepEqual(created.civicProposal.scope.relatedPlotIds, [ctx.foundedPlotId]);
  assert.equal(created.state.publicSummary.civicProposalCount, 1);
  assert.equal(created.state.publicSummary.civicProposalReviewedCount, 1);
  assert.equal(created.state.worldGrid.civicProposals.total, 1);
  assert.equal(created.state.worldGrid.civicProposals.executionAllowed, false);
  assert.deepEqual(created.state.jobs, before.state.jobs);
  assert.deepEqual(created.state.settlementClaims, before.state.settlementClaims);

  const repeated = engine.createCivicProposalRecord({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    title: 'Civic map table review',
    category: 'coordination',
    summary: 'Record a review note for a shared map table between the home plot and outpost.',
    status: 'REVIEWED',
    relatedPlotIds: [ctx.foundedPlotId, 'plot_not_owned'],
    reviewNote: 'Reviewed as a record only.',
    actor: 'HUMAN',
    idempotencyKey: 'ut-24-create',
    nowMs: 1700_000_315_000
  });
  assert.equal(repeated.civicProposal.proposalId, created.civicProposal.proposalId);

  const agentBlocked = engine.createCivicProposalRecord({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    title: 'Agent civic note',
    category: 'civic_memory',
    summary: 'A foreman-authored advisory note requiring human approval.',
    actor: 'AGENT',
    idempotencyKey: 'ut-24-agent-blocked',
    nowMs: 1700_000_316_000
  });
  assert.equal(agentBlocked.ok, false);
  assert.equal(agentBlocked.error.code, 'FORBIDDEN_POLICY');
  assert.equal(agentBlocked.error.details.actionName, 'create_civic_proposal');

  const approval = engine.createApprovalRequest({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    actionName: 'create_civic_proposal',
    requestedParams: agentBlocked.error.details.requestedParams,
    title: 'Approve advisory civic proposal',
    body: 'Record only; no civic execution.',
    actor: 'AGENT',
    idempotencyKey: 'ut-24-approval',
    nowMs: 1700_000_317_000
  });
  assert.equal(approval.ok, true, approval.error?.message);
  const resolved = engine.resolveApproval({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    approvalId: approval.approval.approvalId,
    decision: 'approve',
    nowMs: 1700_000_318_000
  });
  assert.equal(resolved.ok, true, resolved.error?.message);
  const agentCreated = engine.createCivicProposalRecord({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    title: 'Agent civic note',
    category: 'civic_memory',
    summary: 'A foreman-authored advisory note requiring human approval.',
    actor: 'AGENT',
    idempotencyKey: 'ut-24-agent-create',
    nowMs: 1700_000_319_000
  });
  assert.equal(agentCreated.ok, true, agentCreated.error?.message);
  assert.equal(agentCreated.civicProposal.createdBy, 'AGENT');
  assert.equal(agentCreated.civicProposal.approvedBy, 'HUMAN_APPROVAL');

  const listed = engine.listCivicProposalRecords({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    nowMs: 1700_000_320_000
  });
  assert.equal(listed.ok, true, listed.error?.message);
  assert.equal(listed.proposals.length, 2);
  assert.equal(listed.civicProposals.counts.reviewedCount, 1);
  assert.equal(listed.civicProposals.counts.draftCount, 1);
});

test('FP-UT-025 HQ10C overlay packs are presentation-only and stable-gameplay excluded', () => {
  const locked = fresh('pair-hq10c-locked');
  const rejected = engine.createOverlayPackRecord({
    pairId: locked.state.plot.pairId,
    plotId: locked.plotId,
    sourceProposalId: 'civic_proposal_missing',
    title: 'Locked overlay',
    summary: 'This should wait for World Grid readiness and a reviewed civic proposal.',
    actor: 'HUMAN',
    idempotencyKey: 'ut-25-locked',
    nowMs: 1700_000_330_000
  });
  assert.equal(rejected.ok, false);
  assert.equal(rejected.error.details.reason, 'overlay_pack_records_not_ready');

  const ctx = seedFoundedOutpostFixture('pair-hq10c-ready');
  const selected = engine.selectDoctrine({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    doctrineId: 'survey_discipline',
    actor: 'HUMAN',
    idempotencyKey: 'ut-25-select',
    nowMs: 1700_000_331_000
  });
  assert.equal(selected.ok, true, selected.error?.message);
  const draftWorkOrder = engine.createWorkOrderDraft({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    templateId: 'collect_ready_outputs_once',
    scope: {},
    actor: 'HUMAN',
    idempotencyKey: 'ut-25-work-order',
    nowMs: 1700_000_332_000
  });
  assert.equal(draftWorkOrder.ok, true, draftWorkOrder.error?.message);
  const proposal = engine.createCivicProposalRecord({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    title: 'Generated Universe civic review',
    category: 'civic_memory',
    summary: 'Reviewed civic basis for a visual-only overlay pack.',
    status: 'REVIEWED',
    actor: 'HUMAN',
    idempotencyKey: 'ut-25-proposal',
    nowMs: 1700_000_333_000
  });
  assert.equal(proposal.ok, true, proposal.error?.message);

  const before = engine.getFoundersPlotState({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    nowMs: 1700_000_334_000
  });
  const beforeStableHash = progressionAtlas.gameplayStableHashForState(before.state);
  const beforeEvents = store.listEvents(ctx.plotId).length;
  const created = engine.createOverlayPackRecord({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    sourceProposalId: proposal.civicProposal.proposalId,
    title: 'Lantern Grid Overlay',
    theme: 'lantern_grid',
    summary: 'Presentation-only labels, skins, and display hints for World Grid and Atlas nodes.',
    status: 'DRAFT',
    targetSurfaceIds: ['progression_atlas', 'world_grid', 'bad_surface'],
    targetNodeIds: ['world_grid.read_model', 'world_grid.civic_proposal_records'],
    displayHints: {
      labels: { world_grid: 'Lantern Grid' },
      skins: ['lantern'],
      cost: { wood: 999 },
      buffs: ['forbidden']
    },
    prompt: 'Warm civic lantern overlay, presentation only.',
    provenance: { source: 'unit-test', provider: 'none', model: 'none' },
    actor: 'HUMAN',
    idempotencyKey: 'ut-25-create',
    nowMs: 1700_000_335_000
  });
  assert.equal(created.ok, true, created.error?.message);
  assert.deepEqual(created.worldDelta, []);
  assert.equal(store.listEvents(ctx.plotId).length, beforeEvents);
  assert.equal(created.overlayPack.visualOnly, true);
  assert.equal(created.overlayPack.presentationOnly, true);
  assert.equal(created.overlayPack.gameplayMutationPolicy, 'presentation_only');
  assert.equal(created.overlayPack.authorityBoundary, engine.OVERLAY_PACK_AUTHORITY_BOUNDARY);
  assert.deepEqual(created.overlayPack.targetSurfaceIds, ['progression_atlas', 'world_grid']);
  assert.equal(Object.hasOwn(created.overlayPack.displayHints, 'cost'), false);
  assert.equal(Object.hasOwn(created.overlayPack.displayHints, 'buffs'), false);
  assert.equal(created.overlayPack.prompt.rawPromptStored, false);
  assert.match(created.overlayPack.prompt.promptDigest, /^[a-f0-9]{16}$/);
  assert.equal(created.state.publicSummary.overlayPackCount, 1);
  assert.equal(created.state.overlayPacks.counts.total, 1);
  assert.equal(created.state.overlayPacks.presentationOnly, true);
  assert.equal(Object.hasOwn(created.state.worldGrid, 'overlayPacks'), false);
  assert.deepEqual(created.state.plot.inventory, before.state.plot.inventory);
  assert.deepEqual(created.state.jobs, before.state.jobs);
  assert.deepEqual(created.state.settlementClaims, before.state.settlementClaims);
  assert.equal(progressionAtlas.gameplayStableHashForState(created.state), beforeStableHash);

  const repeated = engine.createOverlayPackRecord({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    sourceProposalId: proposal.civicProposal.proposalId,
    title: 'Lantern Grid Overlay',
    theme: 'lantern_grid',
    summary: 'Presentation-only labels, skins, and display hints for World Grid and Atlas nodes.',
    status: 'DRAFT',
    targetSurfaceIds: ['progression_atlas', 'world_grid', 'bad_surface'],
    targetNodeIds: ['world_grid.read_model', 'world_grid.civic_proposal_records'],
    displayHints: { labels: { world_grid: 'Lantern Grid' }, skins: ['lantern'] },
    prompt: 'Warm civic lantern overlay, presentation only.',
    provenance: { source: 'unit-test', provider: 'none', model: 'none' },
    actor: 'HUMAN',
    idempotencyKey: 'ut-25-create',
    nowMs: 1700_000_336_000
  });
  assert.equal(repeated.overlayPack.overlayPackId, created.overlayPack.overlayPackId);

  const agentBlocked = engine.createOverlayPackRecord({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    sourceProposalId: proposal.civicProposal.proposalId,
    title: 'Agent overlay',
    summary: 'Agent-created overlay records still need matching human approval.',
    actor: 'AGENT',
    idempotencyKey: 'ut-25-agent-blocked',
    nowMs: 1700_000_337_000
  });
  assert.equal(agentBlocked.ok, false);
  assert.equal(agentBlocked.error.code, 'FORBIDDEN_POLICY');
  assert.equal(agentBlocked.error.details.actionName, 'create_overlay_pack');

  const listed = engine.listOverlayPackRecords({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    nowMs: 1700_000_338_000
  });
  assert.equal(listed.ok, true, listed.error?.message);
  assert.deepEqual(listed.worldDelta, []);
  assert.equal(listed.packs.length, 1);
  assert.equal(listed.overlayPacks.status, 'RECORDING_READY');
  assert.deepEqual(listed.overlayPacks.executableActions, []);

  const approval = engine.createApprovalRequest({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    actionName: 'create_overlay_pack',
    requestedParams: agentBlocked.error.details.requestedParams,
    title: 'Approve presentation overlay pack',
    body: 'Record only; no gameplay or rendering authority.',
    actor: 'AGENT',
    idempotencyKey: 'ut-25-approval',
    nowMs: 1700_000_339_000
  });
  assert.equal(approval.ok, true, approval.error?.message);
  const resolved = engine.resolveApproval({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    approvalId: approval.approval.approvalId,
    decision: 'approve',
    nowMs: 1700_000_340_000
  });
  assert.equal(resolved.ok, true, resolved.error?.message);
  const agentCreated = engine.createOverlayPackRecord({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    sourceProposalId: proposal.civicProposal.proposalId,
    title: 'Agent overlay',
    summary: 'Agent-created overlay records still need matching human approval.',
    actor: 'AGENT',
    idempotencyKey: 'ut-25-agent-create',
    nowMs: 1700_000_341_000
  });
  assert.equal(agentCreated.ok, true, agentCreated.error?.message);
  assert.equal(agentCreated.overlayPack.createdBy, 'AGENT');
  assert.equal(agentCreated.overlayPack.approvedBy, 'HUMAN_APPROVAL');
});

test('FP-UT-026 HQ10D civic project activation promotes reviewed proposals into local gameplay truth', () => {
  const locked = fresh('pair-hq10d-locked');
  const tooEarly = engine.activateCivicProject({
    pairId: locked.state.plot.pairId,
    plotId: locked.plotId,
    sourceProposalId: 'civic_proposal_missing',
    title: 'Too early beacon',
    actor: 'HUMAN',
    idempotencyKey: 'ut-26-locked',
    nowMs: 1700_000_350_000
  });
  assert.equal(tooEarly.ok, false);
  assert.equal(tooEarly.error.details.reason, 'world_grid_not_ready');

  const ctx = seedFoundedOutpostFixture('pair-hq10d-ready');
  const selected = engine.selectDoctrine({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    doctrineId: 'survey_discipline',
    actor: 'HUMAN',
    idempotencyKey: 'ut-26-select',
    nowMs: 1700_000_351_000
  });
  assert.equal(selected.ok, true, selected.error?.message);
  const draftWorkOrder = engine.createWorkOrderDraft({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    templateId: 'collect_ready_outputs_once',
    scope: {},
    actor: 'HUMAN',
    idempotencyKey: 'ut-26-work-order',
    nowMs: 1700_000_352_000
  });
  assert.equal(draftWorkOrder.ok, true, draftWorkOrder.error?.message);
  const draftProposal = engine.createCivicProposalRecord({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    title: 'Draft civic note',
    category: 'public_work',
    summary: 'A draft public-work note that is not ready for activation.',
    status: 'DRAFT',
    actor: 'HUMAN',
    idempotencyKey: 'ut-26-draft-proposal',
    nowMs: 1700_000_353_000
  });
  assert.equal(draftProposal.ok, true, draftProposal.error?.message);
  const draftRejected = engine.activateCivicProject({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    sourceProposalId: draftProposal.civicProposal.proposalId,
    title: 'Draft beacon',
    actor: 'HUMAN',
    idempotencyKey: 'ut-26-draft-rejected',
    nowMs: 1700_000_354_000
  });
  assert.equal(draftRejected.ok, false);
  assert.equal(draftRejected.error.details.reason, 'reviewed_civic_proposal_required');

  const proposal = engine.createCivicProposalRecord({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    title: 'Civic Beacon public-work review',
    category: 'public_work',
    summary: 'Reviewed basis for a local civic beacon marker near the home plot.',
    status: 'REVIEWED',
    actor: 'HUMAN',
    idempotencyKey: 'ut-26-reviewed-proposal',
    nowMs: 1700_000_355_000
  });
  assert.equal(proposal.ok, true, proposal.error?.message);

  const before = engine.getFoundersPlotState({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    nowMs: 1700_000_356_000
  });
  const beforeStableHash = progressionAtlas.gameplayStableHashForState(before.state);
  const beforeEvents = store.listEvents(ctx.plotId).length;
  const activated = engine.activateCivicProject({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    sourceProposalId: proposal.civicProposal.proposalId,
    projectType: 'civic_beacon',
    title: 'Civic Beacon',
    summary: 'Light the local civic beacon as a bounded public-work readiness marker.',
    actor: 'HUMAN',
    idempotencyKey: 'ut-26-activate',
    nowMs: 1700_000_357_000
  });
  assert.equal(activated.ok, true, activated.error?.message);
  assert.equal(activated.alreadyActivated, false);
  assert.equal(activated.effectApplied, true);
  assert.equal(activated.civicProject.status, 'ACTIVE');
  assert.equal(activated.civicProject.projectType, 'civic_beacon');
  assert.equal(activated.civicProject.sourceProposalId, proposal.civicProposal.proposalId);
  assert.equal(activated.civicProject.authorityBoundary, engine.CIVIC_PROJECT_AUTHORITY_BOUNDARY);
  assert.equal(activated.civicProject.effect.effectId, engine.CIVIC_BEACON_EFFECT_ID);
  assert.equal(activated.civicProject.effect.readinessDelta, 1);
  assert.equal(activated.civicProject.receipt.kind, 'civic_project_activation');
  assert.equal(activated.civicProject.receipt.resourceDelta.wood, undefined);
  assert.equal(activated.civicProject.receipt.routeCreation, false);
  assert.equal(activated.worldDelta.some((entry) => entry.type === 'CIVIC_PROJECT_ACTIVATED'), true);
  assert.equal(store.listEvents(ctx.plotId).length, beforeEvents + 1);
  assert.equal(activated.state.publicSummary.civicProjectCount, 1);
  assert.equal(activated.state.publicSummary.civicProjectActiveCount, 1);
  assert.equal(activated.state.publicSummary.civicBeaconActive, true);
  assert.equal(activated.state.publicSummary.civicReadinessScore, 1);
  assert.equal(activated.state.worldGrid.civicProjects.localCivicBeaconActive, true);
  assert.equal(activated.state.worldGrid.civicReadiness.localProjectReadinessScore, 1);
  assert.deepEqual(activated.state.worldGrid.civicReadiness.moraleMarkers, ['civic_beacon_lit']);
  assert.equal(activated.state.civicProjects.activeEffects.localCivicBeacon, true);
  assert.deepEqual(activated.state.plot.inventory, before.state.plot.inventory);
  assert.deepEqual(activated.state.jobs, before.state.jobs);
  assert.deepEqual(activated.state.settlementClaims, before.state.settlementClaims);
  assert.notEqual(progressionAtlas.gameplayStableHashForState(activated.state), beforeStableHash);

  const repeated = engine.activateCivicProject({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    sourceProposalId: proposal.civicProposal.proposalId,
    projectType: 'civic_beacon',
    title: 'Civic Beacon',
    summary: 'Light the local civic beacon as a bounded public-work readiness marker.',
    actor: 'HUMAN',
    idempotencyKey: 'ut-26-activate',
    nowMs: 1700_000_358_000
  });
  assert.equal(repeated.civicProject.projectId, activated.civicProject.projectId);

  const duplicateSource = engine.activateCivicProject({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    sourceProposalId: proposal.civicProposal.proposalId,
    projectType: 'civic_beacon',
    title: 'Second beacon title ignored',
    actor: 'HUMAN',
    idempotencyKey: 'ut-26-duplicate-source',
    nowMs: 1700_000_359_000
  });
  assert.equal(duplicateSource.ok, true, duplicateSource.error?.message);
  assert.equal(duplicateSource.alreadyActivated, true);
  assert.equal(duplicateSource.civicProject.projectId, activated.civicProject.projectId);
  assert.deepEqual(duplicateSource.worldDelta, []);

  const listed = engine.listCivicProjectRecords({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    nowMs: 1700_000_360_000
  });
  assert.equal(listed.ok, true, listed.error?.message);
  assert.deepEqual(listed.worldDelta, []);
  assert.equal(listed.projects.length, 1);
  assert.equal(listed.civicProjects.status, 'ACTIVE');
  assert.equal(listed.civicProjects.counts.activeCount, 1);

  const atlasBeforeInspection = progressionAtlas.getProgressionAtlasState({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    nowMs: 1700_000_360_100
  });
  const civicNodeBeforeInspection = atlasBeforeInspection.atlas.canonicalNodes.find((node) => (
    node.nodeId.startsWith('civic_project.')
  ));
  assert.ok(civicNodeBeforeInspection?.actionRef, 'civic project inspection action ref present before inspection');
  assert.equal(civicNodeBeforeInspection.actionRef.tool, 'et.plot.inspect_civic_project');
  assert.equal(civicNodeBeforeInspection.actionRef.executableByAtlas, false);

  const beforeInspectionInventory = JSON.parse(JSON.stringify(activated.state.plot.inventory));
  const beforeInspectionEvents = store.listEvents(ctx.plotId).length;
  const inspected = engine.inspectCivicProject({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    projectId: activated.civicProject.projectId,
    inspectionType: 'baseline_readiness',
    note: 'Baseline beacon inspection for HQ11 local operations.',
    actor: 'HUMAN',
    idempotencyKey: 'ut-26-inspect',
    nowMs: 1700_000_360_500
  });
  assert.equal(inspected.ok, true, inspected.error?.message);
  assert.equal(inspected.inspectionApplied, true);
  assert.equal(inspected.alreadyInspected, false);
  assert.equal(inspected.inspection.inspectionType, 'baseline_readiness');
  assert.equal(inspected.inspection.resourceDelta.wood, undefined);
  assert.equal(inspected.inspection.routeCreation, false);
  assert.equal(inspected.inspection.backgroundScheduling, false);
  assert.equal(inspected.inspection.externalEffects, false);
  assert.equal(inspected.inspection.crossPlotMutation, false);
  assert.equal(inspected.civicProject.effect.inspection.baselineReadinessInspected, true);
  assert.equal(inspected.civicProject.receipt.inspections.length, 1);
  assert.equal(inspected.worldDelta.some((entry) => entry.type === 'CIVIC_PROJECT_INSPECTED'), true);
  assert.equal(store.listEvents(ctx.plotId).length, beforeInspectionEvents + 1);
  assert.deepEqual(inspected.state.plot.inventory, beforeInspectionInventory);
  assert.deepEqual(inspected.state.jobs, activated.state.jobs);
  assert.equal(inspected.state.publicSummary.civicProjectInspectionCount, 1);
  assert.equal(inspected.state.publicSummary.civicReadinessScore, 2);
  assert.equal(inspected.state.worldGrid.civicProjects.inspectionCount, 1);
  assert.equal(inspected.state.worldGrid.civicProjects.inspectionReadinessDelta, 1);
  assert.equal(inspected.state.worldGrid.civicReadiness.localProjectReadinessScore, 2);
  assert.deepEqual(inspected.state.worldGrid.civicReadiness.moraleMarkers, ['civic_beacon_lit', 'civic_beacon_inspected']);

  const repeatedInspection = engine.inspectCivicProject({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    projectId: activated.civicProject.projectId,
    inspectionType: 'baseline_readiness',
    note: 'Baseline beacon inspection for HQ11 local operations.',
    actor: 'HUMAN',
    idempotencyKey: 'ut-26-inspect',
    nowMs: 1700_000_360_600
  });
  assert.equal(repeatedInspection.inspectionApplied, true);
  assert.equal(repeatedInspection.civicProject.receipt.inspections.length, 1);

  const duplicateInspection = engine.inspectCivicProject({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    projectId: activated.civicProject.projectId,
    inspectionType: 'baseline_readiness',
    note: 'A different idempotency key still cannot add another baseline inspection.',
    actor: 'HUMAN',
    idempotencyKey: 'ut-26-inspect-duplicate',
    nowMs: 1700_000_360_700
  });
  assert.equal(duplicateInspection.ok, true, duplicateInspection.error?.message);
  assert.equal(duplicateInspection.alreadyInspected, true);
  assert.equal(duplicateInspection.inspectionApplied, false);
  assert.deepEqual(duplicateInspection.worldDelta, []);

  const atlasAfterInspection = progressionAtlas.getProgressionAtlasState({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    nowMs: 1700_000_360_800
  });
  const civicNode = atlasAfterInspection.atlas.canonicalNodes.find((node) => (
    node.nodeId.startsWith('civic_project.')
  ));
  assert.ok(civicNode, 'civic project node present');
  assert.equal(civicNode.metadata.inspectionBoundary, engine.CIVIC_PROJECT_INSPECTION_AUTHORITY_BOUNDARY);
  assert.equal(civicNode.actionRef, null);

  const agentProposal = engine.createCivicProposalRecord({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    title: 'Agent beacon review',
    category: 'public_work',
    summary: 'Reviewed proposal for an agent-activated civic beacon.',
    status: 'REVIEWED',
    actor: 'HUMAN',
    idempotencyKey: 'ut-26-agent-proposal',
    nowMs: 1700_000_361_000
  });
  assert.equal(agentProposal.ok, true, agentProposal.error?.message);
  const agentBlocked = engine.activateCivicProject({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    sourceProposalId: agentProposal.civicProposal.proposalId,
    projectType: 'civic_beacon',
    title: 'Agent Civic Beacon',
    summary: 'Agent activation still requires matching human approval.',
    actor: 'AGENT',
    idempotencyKey: 'ut-26-agent-blocked',
    nowMs: 1700_000_362_000
  });
  assert.equal(agentBlocked.ok, false);
  assert.equal(agentBlocked.error.code, 'FORBIDDEN_POLICY');
  assert.equal(agentBlocked.error.details.actionName, 'activate_civic_project');

  const approval = engine.createApprovalRequest({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    actionName: 'activate_civic_project',
    requestedParams: agentBlocked.error.details.requestedParams,
    title: 'Approve civic project activation',
    body: 'Bounded local beacon only; no route, spend, scheduler, or public share.',
    actor: 'AGENT',
    idempotencyKey: 'ut-26-approval',
    nowMs: 1700_000_363_000
  });
  assert.equal(approval.ok, true, approval.error?.message);
  const resolved = engine.resolveApproval({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    approvalId: approval.approval.approvalId,
    decision: 'approve',
    nowMs: 1700_000_364_000
  });
  assert.equal(resolved.ok, true, resolved.error?.message);
  const agentActivated = engine.activateCivicProject({
    pairId: ctx.pairId,
    plotId: ctx.plotId,
    sourceProposalId: agentProposal.civicProposal.proposalId,
    projectType: 'civic_beacon',
    title: 'Agent Civic Beacon',
    summary: 'Agent activation still requires matching human approval.',
    actor: 'AGENT',
    idempotencyKey: 'ut-26-agent-activate',
    nowMs: 1700_000_365_000
  });
  assert.equal(agentActivated.ok, true, agentActivated.error?.message);
  assert.equal(agentActivated.civicProject.createdBy, 'AGENT');
  assert.equal(agentActivated.civicProject.approvedBy, 'HUMAN_APPROVAL');
});

test('FP-IT-002 agent blocked when policy disabled; allowed when enabled', () => {
  const env = fresh();
  // Attempt agent-driven placement with default policy (should fail — agents cannot place).
  const rejected = engine.placeBuilding({
    pairId: env.state.plot.pairId, plotId: env.plotId,
    type: 'LUMBER_CAMP', x: 0, y: 1, actor: 'AGENT',
    idempotencyKey: 'it-2-agent-place', nowMs: 1700_000_000_000,
  });
  assert.equal(rejected.ok, false);
  assert.equal(rejected.error.code, 'FORBIDDEN_POLICY');
});

test('FP-IT-003 recap summarizes events in window', () => {
  const env = fresh();
  engine.placeBuilding({
    pairId: env.state.plot.pairId, plotId: env.plotId,
    type: 'LUMBER_CAMP', x: 0, y: 1, actor: 'HUMAN',
    idempotencyKey: 'it-3', nowMs: 1700_000_000_000,
  });
  engine.advancePlotTimeForTests({
    pairId: env.state.plot.pairId, plotId: env.plotId,
    advanceMs: 2 * 60 * 1000, nowMs: 1700_000_000_000,
  });
  const events = store.listEvents(env.plotId, {});
  const recap = buildRecapFromEvents(events, {
    fromMs: 0, toMs: 1700_000_300_000, maxItems: 8, hqLevel: 1,
  });
  assert.ok(recap.count > 0);
  assert.match(recap.title, /While you were away|Overnight planner/);
});

test('FP-RPL-001 replay an empty event log yields deterministic hash', () => {
  const r1 = replayEventLog({ initialSnapshot: { plot: { plotId: 'a' } }, events: [], applyEvent: (s) => s });
  const r2 = replayEventLog({ initialSnapshot: { plot: { plotId: 'a' } }, events: [], applyEvent: (s) => s });
  assert.equal(r1.stateHash, r2.stateHash);
  assert.match(r1.stateHash, /^[0-9a-f]{64}$/);
});

test('FP-RPL-002 replay of collected event log produces consistent hash', () => {
  const env = fresh();
  engine.placeBuilding({
    pairId: env.state.plot.pairId, plotId: env.plotId,
    type: 'LUMBER_CAMP', x: 0, y: 1, actor: 'HUMAN',
    idempotencyKey: 'rpl-2', nowMs: 1700_000_000_000,
  });
  engine.advancePlotTimeForTests({
    pairId: env.state.plot.pairId, plotId: env.plotId,
    advanceMs: 2 * 60 * 1000, nowMs: 1700_000_000_000,
  });
  const events = store.listEvents(env.plotId, {});
  const hash1 = replayEventLog({ initialSnapshot: { plotId: env.plotId }, events, applyEvent: (s, e) => ({ ...s, lastSeq: e.eventSeq }) }).stateHash;
  const hash2 = replayEventLog({ initialSnapshot: { plotId: env.plotId }, events, applyEvent: (s, e) => ({ ...s, lastSeq: e.eventSeq }) }).stateHash;
  assert.equal(hash1, hash2);
});

test.after(() => {
  // Best-effort cleanup of the temp sqlite file (and WAL side files).
  const p = process.env.STORE_PATH;
  for (const suffix of ['', '-wal', '-shm']) {
    try { fs.unlinkSync(p + suffix); } catch {}
    // Store's path logic may have rewritten to "founders-plot-..."; skip cleanup errors.
  }
});
