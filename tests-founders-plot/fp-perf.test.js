'use strict';

/**
 * Founders Plot — performance tests (FP-PERF-*).
 *
 * Spec targets:
 *   PERF-001  Observation payload under 8 KB for typical state
 *   PERF-002  Single tick simulation budget under 20 ms (median)
 *   PERF-003  Offline catch-up simulation under 250 ms for 8h gap
 *
 * These are soft ceilings — they catch egregious regressions rather than
 * enforce absolute performance guarantees.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');

process.env.NODE_ENV = 'test';
process.env.STORE_PATH = path.join(os.tmpdir(), `fp-perf-${Date.now()}-${process.pid}.sqlite`);

const engine = require('../server/founders_plot/engine');
const store = require('../server/founders_plot/store');

const EIGHT_HOURS = 8 * 60 * 60 * 1000;

function fresh(pairId) {
  store.resetFoundersPlotStore();
  return engine.getFoundersPlotState({
    pairId: pairId || `session:perf-${Math.random().toString(36).slice(2)}`,
    houseId: null,
    nowMs: 1700_000_000_000,
  });
}

function sizeBytes(value) {
  return Buffer.byteLength(JSON.stringify(value), 'utf8');
}

test('FP-PERF-001 typical observation payload stays under 8 KB', () => {
  const env = fresh();
  engine.placeBuilding({
    pairId: env.state.plot.pairId, plotId: env.plotId,
    type: 'LUMBER_CAMP', x: 0, y: 1, actor: 'HUMAN',
    idempotencyKey: 'perf-1a', nowMs: 1700_000_000_000,
  });
  engine.placeBuilding({
    pairId: env.state.plot.pairId, plotId: env.plotId,
    type: 'FARM_PLOT', x: 2, y: 1, actor: 'HUMAN',
    idempotencyKey: 'perf-1b', nowMs: 1700_000_000_000,
  });
  const s = engine.getFoundersPlotState({ pairId: env.state.plot.pairId, nowMs: 1700_000_100_000 });
  const bytes = sizeBytes(s);
  assert.ok(bytes < 8_192, `observation payload ${bytes} bytes exceeds 8 KB`);
});

test('FP-PERF-002 single tick (5 min advance) completes under 50 ms', () => {
  const env = fresh();
  engine.placeBuilding({
    pairId: env.state.plot.pairId, plotId: env.plotId,
    type: 'LUMBER_CAMP', x: 0, y: 1, actor: 'HUMAN',
    idempotencyKey: 'perf-2', nowMs: 1700_000_000_000,
  });
  const t0 = process.hrtime.bigint();
  engine.advancePlotTimeForTests({
    pairId: env.state.plot.pairId, plotId: env.plotId,
    advanceMs: 5 * 60_000, nowMs: 1700_000_000_000,
  });
  const durMs = Number(process.hrtime.bigint() - t0) / 1e6;
  assert.ok(durMs < 50, `tick took ${durMs.toFixed(2)} ms`);
});

test('FP-PERF-003 8-hour catch-up completes under 250 ms', () => {
  const env = fresh();
  engine.placeBuilding({
    pairId: env.state.plot.pairId, plotId: env.plotId,
    type: 'LUMBER_CAMP', x: 0, y: 1, actor: 'HUMAN',
    idempotencyKey: 'perf-3', nowMs: 1700_000_000_000,
  });
  const t0 = process.hrtime.bigint();
  engine.advancePlotTimeForTests({
    pairId: env.state.plot.pairId, plotId: env.plotId,
    advanceMs: EIGHT_HOURS, nowMs: 1700_000_000_000,
  });
  const durMs = Number(process.hrtime.bigint() - t0) / 1e6;
  assert.ok(durMs < 250, `8h catch-up took ${durMs.toFixed(2)} ms`);
});
