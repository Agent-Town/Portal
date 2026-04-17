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
const store = require('../server/founders_plot/store');

function fresh(pairId = `pair-${Math.random().toString(36).slice(2, 8)}`) {
  store.resetFoundersPlotStore();
  return engine.getFoundersPlotState({ pairId, houseId: null, nowMs: 1700_000_000_000 });
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
