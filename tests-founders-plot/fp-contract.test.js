'use strict';

/**
 * Founders Plot — contract tests (FP-CT-*).
 *
 * These tests validate the argsSchema and resultSchema on each tool spec:
 *   - Every tool has valid schema shape (type: object, required arrays, etc.)
 *   - The engine's envelope shape satisfies each tool's resultSchema
 *   - A valid sample args payload is accepted by argsSchema
 *   - A deliberately invalid args payload is rejected
 *
 * We use a tiny hand-rolled JSON Schema checker (not ajv) so we don't pull a
 * new dev dependency. It covers object/array/string/integer/boolean/null
 * unions, required, additionalProperties=false, min/maxLength, minLength, and
 * simple nested objects — enough to fully validate the spec shapes here.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');

process.env.NODE_ENV = 'test';
process.env.STORE_PATH = path.join(os.tmpdir(), `fp-contract-${Date.now()}-${process.pid}.sqlite`);

const { FOUNDERS_PLOT_TOOL_SPECS } = require('../server/founders_plot/tools');
const engine = require('../server/founders_plot/engine');
const store = require('../server/founders_plot/store');

// ---------------------------------------------------------------------------
// Minimal JSON Schema validator — returns [] (no errors) when value conforms.
// ---------------------------------------------------------------------------

function typeOf(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  if (Number.isInteger(v)) return 'integer';
  return typeof v;
}

function typesAllowed(schemaType) {
  if (Array.isArray(schemaType)) return schemaType;
  if (typeof schemaType === 'string') return [schemaType];
  return [];
}

function validate(value, schema, path = '$') {
  const errs = [];
  if (!schema) return errs;
  const allowed = typesAllowed(schema.type);
  if (allowed.length) {
    const actual = typeOf(value);
    // integer passes "number"; number does NOT pass "integer".
    const ok = allowed.includes(actual)
      || (allowed.includes('number') && (actual === 'integer'));
    if (!ok) {
      errs.push(`${path}: expected ${allowed.join('|')} got ${actual}`);
      return errs;
    }
  }
  const t = typeOf(value);
  if (t === 'object' && schema.properties) {
    const props = schema.properties;
    for (const [k, sub] of Object.entries(props)) {
      if (k in value) errs.push(...validate(value[k], sub, `${path}.${k}`));
    }
    for (const req of (schema.required || [])) {
      if (!(req in value)) errs.push(`${path}.${req}: required`);
    }
    if (schema.additionalProperties === false) {
      for (const k of Object.keys(value)) {
        if (!(k in props)) errs.push(`${path}.${k}: not allowed (additionalProperties=false)`);
      }
    }
  }
  if (t === 'array' && schema.items) {
    for (let i = 0; i < value.length; i += 1) {
      errs.push(...validate(value[i], schema.items, `${path}[${i}]`));
    }
  }
  if (t === 'string') {
    if (Number.isFinite(schema.minLength) && value.length < schema.minLength) {
      errs.push(`${path}: shorter than minLength ${schema.minLength}`);
    }
    if (Number.isFinite(schema.maxLength) && value.length > schema.maxLength) {
      errs.push(`${path}: longer than maxLength ${schema.maxLength}`);
    }
  }
  return errs;
}

function expectValid(value, schema, label) {
  const errs = validate(value, schema, label);
  assert.deepEqual(errs, [], `${label} should be valid but got:\n${errs.join('\n')}`);
}

function expectInvalid(value, schema, label) {
  const errs = validate(value, schema, label);
  assert.ok(errs.length > 0, `${label} should have been invalid`);
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function fresh(pairId = `session:ct-${Math.random().toString(36).slice(2)}`) {
  store.resetFoundersPlotStore();
  return engine.getFoundersPlotState({ pairId, houseId: null, nowMs: 1700_000_000_000 });
}

function findSpec(name) {
  const spec = FOUNDERS_PLOT_TOOL_SPECS.find((s) => s.name === name);
  assert.ok(spec, `Missing tool spec: ${name}`);
  return spec;
}

// ---------------------------------------------------------------------------
// Schema shape invariants
// ---------------------------------------------------------------------------

test('FP-CT-001 every tool spec has name, description, argsSchema, resultSchema', () => {
  assert.ok(Array.isArray(FOUNDERS_PLOT_TOOL_SPECS) && FOUNDERS_PLOT_TOOL_SPECS.length >= 8);
  for (const spec of FOUNDERS_PLOT_TOOL_SPECS) {
    assert.equal(typeof spec.name, 'string', 'name is string');
    assert.ok(spec.name.startsWith('et.plot.'), `spec name must be namespaced: ${spec.name}`);
    assert.equal(typeof spec.description, 'string', `${spec.name} description is string`);
    assert.equal(spec.argsSchema.type, 'object', `${spec.name} argsSchema is object`);
    assert.equal(spec.resultSchema.type, 'object', `${spec.name} resultSchema is object`);
    // Envelope required fields present on every resultSchema
    const req = spec.resultSchema.required || [];
    for (const key of ['ok', 'plotId', 'worldDelta', 'error']) {
      assert.ok(req.includes(key), `${spec.name} resultSchema requires ${key}`);
    }
  }
});

test('FP-CT-002 argsSchema rejects requests missing idempotencyKey on mutations', () => {
  const mutators = ['et.plot.place_building', 'et.plot.queue_job', 'et.plot.collect_outputs',
    'et.plot.upgrade_building', 'et.plot.set_priority', 'et.plot.claim_reward',
    'et.plot.request_user_approval'];
  for (const name of mutators) {
    const spec = findSpec(name);
    assert.ok((spec.argsSchema.required || []).includes('idempotencyKey'),
      `${name} must require idempotencyKey`);
  }
});

// ---------------------------------------------------------------------------
// Args schema acceptance/rejection
// ---------------------------------------------------------------------------

test('FP-CT-003 place_building argsSchema validates', () => {
  const spec = findSpec('et.plot.place_building');
  expectValid({
    type: 'LUMBER_CAMP', x: 0, y: 1, idempotencyKey: 'ct-3-ok',
  }, spec.argsSchema, 'place_building valid');
  expectInvalid({ type: 'LUMBER_CAMP', x: 0, y: 1 /* missing idempotencyKey */ },
    spec.argsSchema, 'place_building missing idempotencyKey');
  expectInvalid({ type: 'LUMBER_CAMP', x: 'zero', y: 1, idempotencyKey: 'k' },
    spec.argsSchema, 'place_building bad x type');
});

test('FP-CT-004 queue_job argsSchema validates', () => {
  const spec = findSpec('et.plot.queue_job');
  expectValid({ buildingId: 'b-1', kind: 'PRODUCE', idempotencyKey: 'ct-4-ok' },
    spec.argsSchema, 'queue_job valid');
  expectInvalid({ buildingId: 'b-1', idempotencyKey: 'k' /* missing kind */ },
    spec.argsSchema, 'queue_job missing kind');
});

test('FP-CT-005 request_user_approval argsSchema requires action/params/title/body', () => {
  const spec = findSpec('et.plot.request_user_approval');
  expectValid({
    action: 'et.plot.upgrade_building',
    params: { buildingId: 'b-hq' },
    title: 'Upgrade HQ to Level 2',
    body: 'Costs 40 wood + 20 stone.',
    idempotencyKey: 'ct-5-ok',
  }, spec.argsSchema, 'request_user_approval valid');
  expectInvalid({
    action: 'et.plot.upgrade_building',
    title: 'x',
    body: 'y',
    idempotencyKey: 'k',
  }, spec.argsSchema, 'request_user_approval missing params');
});

// ---------------------------------------------------------------------------
// Engine envelope conforms to resultSchema
// ---------------------------------------------------------------------------

test('FP-CT-101 get_state envelope conforms to resultSchema', () => {
  const env = fresh();
  const spec = findSpec('et.plot.get_state');
  expectValid(env, spec.resultSchema, 'get_state envelope');
});

test('FP-CT-102 place_building envelope conforms to resultSchema', () => {
  const env = fresh();
  const spec = findSpec('et.plot.place_building');
  const out = engine.placeBuilding({
    pairId: env.state.plot.pairId, plotId: env.plotId,
    type: 'LUMBER_CAMP', x: 0, y: 1, actor: 'HUMAN',
    idempotencyKey: 'ct-102', nowMs: 1700_000_000_000,
  });
  expectValid(out, spec.resultSchema, 'place_building envelope');
});

test('FP-CT-103 queue_job + collect_outputs envelopes conform', () => {
  const env = fresh();
  engine.placeBuilding({
    pairId: env.state.plot.pairId, plotId: env.plotId,
    type: 'LUMBER_CAMP', x: 0, y: 1, actor: 'HUMAN',
    idempotencyKey: 'ct-103-place', nowMs: 1700_000_000_000,
  });
  engine.advancePlotTimeForTests({
    pairId: env.state.plot.pairId, plotId: env.plotId,
    advanceMs: 5 * 60_000, nowMs: 1700_000_000_000,
  });
  const s1 = engine.getFoundersPlotState({ pairId: env.state.plot.pairId, nowMs: 1700_000_300_000 });
  const lc = s1.state.buildings.find((b) => b.type === 'LUMBER_CAMP');
  assert.ok(lc, 'lumber camp present');
  const queued = engine.queueJob({
    pairId: env.state.plot.pairId, plotId: env.plotId,
    buildingId: lc.buildingId, kind: 'PRODUCE', actor: 'HUMAN',
    idempotencyKey: 'ct-103-queue', nowMs: 1700_000_300_000,
  });
  expectValid(queued, findSpec('et.plot.queue_job').resultSchema, 'queue_job envelope');
  engine.advancePlotTimeForTests({
    pairId: env.state.plot.pairId, plotId: env.plotId,
    advanceMs: 10 * 60_000, nowMs: 1700_000_300_000,
  });
  const collected = engine.collectOutputs({
    pairId: env.state.plot.pairId, plotId: env.plotId,
    buildingId: lc.buildingId, actor: 'HUMAN',
    idempotencyKey: 'ct-103-collect', nowMs: 1700_000_900_000,
  });
  expectValid(collected, findSpec('et.plot.collect_outputs').resultSchema, 'collect_outputs envelope');
});

test('FP-CT-104 error envelope also conforms to resultSchema', () => {
  const env = fresh();
  // Place a building then try to place over it (tiles are unique)
  engine.placeBuilding({
    pairId: env.state.plot.pairId, plotId: env.plotId,
    type: 'LUMBER_CAMP', x: 0, y: 1, actor: 'HUMAN',
    idempotencyKey: 'ct-104-a', nowMs: 1700_000_000_000,
  });
  const out = engine.placeBuilding({
    pairId: env.state.plot.pairId, plotId: env.plotId,
    type: 'FARM_PLOT', x: 0, y: 1, actor: 'HUMAN',
    idempotencyKey: 'ct-104-b', nowMs: 1700_000_000_000,
  });
  assert.equal(out.ok, false, 'second placement should fail');
  expectValid(out, findSpec('et.plot.place_building').resultSchema, 'place_building error envelope');
  assert.ok(out.error && typeof out.error.code === 'string', 'error.code present');
});
