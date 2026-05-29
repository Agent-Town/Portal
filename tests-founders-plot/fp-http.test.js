'use strict';

/**
 * Founders Plot — HTTP integration tests (FP-HT-*).
 *
 * Spins up an isolated Express app that mounts the router and exercises the
 * real HTTP path. No separate server binding — we use supertest-style inline
 * requests via the app's request handler.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const express = require('express');

process.env.NODE_ENV = 'test';
process.env.STORE_PATH = path.join(os.tmpdir(), `fp-http-${Date.now()}-${process.pid}.sqlite`);

const { createFoundersPlotRouter } = require('../server/founders_plot/routes');
const store = require('../server/founders_plot/store');

let nowMs = 1700_000_000_000;

function makeApp(pairId) {
  const app = express();
  app.use(express.json());
  app.use(createFoundersPlotRouter({
    resolveIdentity: () => ({ pairId, houseId: null }),
    nowMs: () => nowMs,
  }));
  return app;
}

function listen(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, '127.0.0.1', (err) => {
      if (err) reject(err);
      else resolve(server);
    });
  });
}

function request(server, method, pathname, body) {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const data = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: addr.address,
      port: addr.port,
      path: pathname,
      method,
      headers: {
        'content-type': 'application/json',
        ...(data ? { 'content-length': Buffer.byteLength(data) } : {}),
      },
    }, (res) => {
      let chunks = '';
      res.setEncoding('utf8');
      res.on('data', (c) => { chunks += c; });
      res.on('end', () => {
        try {
          const json = chunks ? JSON.parse(chunks) : null;
          resolve({ status: res.statusCode, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, body: null, raw: chunks });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function fresh(tag) {
  store.resetFoundersPlotStore();
  nowMs = 1700_000_000_000;
  const app = makeApp(`session:ht-${tag}-${Math.random().toString(36).slice(2)}`);
  const server = await listen(app);
  return { server, close: () => new Promise((r) => server.close(() => r())) };
}

test('FP-HT-001 GET /api/founders-plot/tools returns all 8 tools', async () => {
  const { server, close } = await fresh('tools');
  try {
    const out = await request(server, 'GET', '/api/founders-plot/tools');
    assert.equal(out.status, 200);
    assert.ok(Array.isArray(out.body.tools));
    assert.ok(out.body.tools.length >= 8);
    const names = out.body.tools.map((t) => t.name).sort();
    for (const req of ['et.plot.get_state', 'et.plot.place_building', 'et.plot.queue_job',
      'et.plot.collect_outputs', 'et.plot.upgrade_building', 'et.plot.set_priority',
      'et.plot.claim_reward', 'et.plot.request_user_approval']) {
      assert.ok(names.includes(req), `tools list contains ${req}`);
    }
  } finally { await close(); }
});

test('FP-HT-002 GET /api/founders-plot/state seeds new plot with HQ', async () => {
  const { server, close } = await fresh('state');
  try {
    const out = await request(server, 'GET', '/api/founders-plot/state');
    assert.equal(out.status, 200);
    assert.equal(out.body.ok, true);
    assert.ok(out.body.state.plot.plotId);
    const hq = out.body.state.buildings.find((b) => b.type === 'HQ');
    assert.ok(hq, 'HQ is seeded');
    assert.equal(hq.level, 1);
  } finally { await close(); }
});

test('FP-HT-003 POST /api/founders-plot/place-building creates building', async () => {
  const { server, close } = await fresh('place');
  try {
    const s0 = await request(server, 'GET', '/api/founders-plot/state');
    const plotId = s0.body.state.plot.plotId;
    const out = await request(server, 'POST', '/api/founders-plot/place-building', {
      plotId, type: 'LUMBER_CAMP', x: 0, y: 1, actor: 'HUMAN',
      idempotencyKey: 'ht-3',
    });
    assert.equal(out.status, 200);
    assert.equal(out.body.ok, true);
    assert.ok(out.body.state.buildings.find((b) => b.type === 'LUMBER_CAMP'));
  } finally { await close(); }
});

test('FP-HT-004 idempotency: same key → same response', async () => {
  const { server, close } = await fresh('idem');
  try {
    const s0 = await request(server, 'GET', '/api/founders-plot/state');
    const plotId = s0.body.state.plot.plotId;
    const args = {
      plotId, type: 'LUMBER_CAMP', x: 0, y: 1, actor: 'HUMAN',
      idempotencyKey: 'ht-4-key',
    };
    const a = await request(server, 'POST', '/api/founders-plot/place-building', args);
    const b = await request(server, 'POST', '/api/founders-plot/place-building', args);
    assert.equal(a.status, 200);
    assert.equal(b.status, 200);
    assert.equal(b.body.ok, true);
    // Building count stays at 2 (HQ + LUMBER_CAMP)
    const sAfter = await request(server, 'GET', '/api/founders-plot/state');
    assert.equal(sAfter.body.state.buildings.filter((x) => x.type === 'LUMBER_CAMP').length, 1);
  } finally { await close(); }
});

test('FP-HT-005 idempotency conflict → 409', async () => {
  const { server, close } = await fresh('conflict');
  try {
    const s0 = await request(server, 'GET', '/api/founders-plot/state');
    const plotId = s0.body.state.plot.plotId;
    const keyArgs = (x) => ({
      plotId, type: 'LUMBER_CAMP', x, y: 1, actor: 'HUMAN',
      idempotencyKey: 'ht-5-conflict',
    });
    const a = await request(server, 'POST', '/api/founders-plot/place-building', keyArgs(0));
    assert.equal(a.status, 200);
    const b = await request(server, 'POST', '/api/founders-plot/place-building', keyArgs(1));
    assert.equal(b.status, 409);
    assert.equal(b.body.error.code, 'IDEMPOTENCY_CONFLICT');
  } finally { await close(); }
});

test('FP-HT-006 agent placement blocked (FORBIDDEN_POLICY → 403)', async () => {
  const { server, close } = await fresh('policy');
  try {
    const s0 = await request(server, 'GET', '/api/founders-plot/state');
    const plotId = s0.body.state.plot.plotId;
    const out = await request(server, 'POST', '/api/founders-plot/place-building', {
      plotId, type: 'LUMBER_CAMP', x: 0, y: 1, actor: 'AGENT',
      idempotencyKey: 'ht-6',
    });
    // Agent has no place_building permission at HQ level 1.
    assert.equal(out.status, 403);
    assert.equal(out.body.error.code, 'FORBIDDEN_POLICY');
  } finally { await close(); }
});

test('FP-HT-007 public summary endpoint exposes read-only view', async () => {
  const { server, close } = await fresh('public');
  try {
    const s0 = await request(server, 'GET', '/api/founders-plot/state');
    const plotId = s0.body.state.plot.plotId;
    const out = await request(server, 'GET', `/api/founders-plot/public/${plotId}`);
    assert.equal(out.status, 200);
    assert.equal(out.body.ok, true);
    assert.ok(out.body.plot || out.body.state);
  } finally { await close(); }
});

test('FP-HT-008 leaderboard endpoint responds', async () => {
  const { server, close } = await fresh('leaderboard');
  try {
    // Make sure at least one plot is visible
    await request(server, 'GET', '/api/founders-plot/state');
    const out = await request(server, 'GET', '/api/founders-plot/leaderboard');
    assert.equal(out.status, 200);
    assert.equal(out.body.ok, true);
    assert.ok(Array.isArray(out.body.plots));
  } finally { await close(); }
});

test('FP-HT-009 progression atlas exposes Rush HQ3 graph without gameplay mutation', async () => {
  const { server, close } = await fresh('progression-atlas');
  try {
    const before = await request(server, 'GET', '/api/founders-plot/state');
    assert.equal(before.status, 200);
    const beforeEvents = before.body.state.audit.eventCount;

    const out = await request(server, 'GET', '/api/founders-plot/progression-atlas');
    assert.equal(out.status, 200);
    assert.equal(out.body.ok, true);
    assert.match(out.body.gameplayStableHash, /^[a-f0-9]{64}$/);
    assert.equal(out.body.atlas.gameplayStableHash, out.body.gameplayStableHash);
    assert.equal(out.body.atlas.graphVersion, 'founders-plot-progression-atlas-v1');
    assert.equal(out.body.atlas.recommendedStrategy.strategyKey, 'rush-hq3');
    assert.equal(out.body.atlas.recommendedStrategy.baseGameplayStableHash, out.body.gameplayStableHash);
    const nodeIds = out.body.atlas.nodes.map((node) => node.nodeId);
    for (const requiredNode of ['building.lumber_camp.place', 'building.farm_plot.place', 'building.quarry.place', 'hq.level.3']) {
      assert.ok(nodeIds.includes(requiredNode), `atlas includes ${requiredNode}`);
    }
    const farmNode = out.body.atlas.nodes.find((node) => node.nodeId === 'building.farm_plot.place');
    assert.equal(farmNode.icon.generatedBy, 'agent_town_global_icon_registry_v1');
    assert.equal(farmNode.icon.generatedAdHoc, true);
    assert.equal(farmNode.icon.global, true);
    assert.equal(farmNode.icon.symbol, 'F');
    assert.equal(farmNode.icon.source, 'building:FARM_PLOT');
    assert.equal(farmNode.icon.assetSet, 'agent-town-global-icons-v1');
    assert.equal(farmNode.icon.assetPath, '/assets/icons/agent-town/farm-plot-gpt-image-2-v1.png');
    assert.equal(out.body.atlas.iconCatalog['resource.wood'].assetPath, '/assets/icons/agent-town/wood-resource-gpt-image-2-v1.png');
    assert.equal(out.body.atlas.iconCatalog['resource.coin'].symbol, 'C');
    assert.equal(out.body.atlas.iconCatalog['resource.coin'].assetPath, null);
    const hqStep = out.body.atlas.recommendedStrategy.steps.find((step) => step.stepId === 'hq.level.3');
    assert.equal(hqStep.icon.symbol, 'H3');
    assert.equal(hqStep.icon.tone, 'command');
    assert.equal(hqStep.icon.assetPath, '/assets/icons/agent-town/hq-upgrade-gpt-image-2-v1.png');

    const repeat = await request(server, 'GET', '/api/founders-plot/progression-atlas');
    assert.equal(repeat.status, 200);
    assert.equal(repeat.body.gameplayStableHash, out.body.gameplayStableHash);

    const after = await request(server, 'GET', '/api/founders-plot/state');
    assert.equal(after.status, 200);
    assert.equal(after.body.state.audit.eventCount, beforeEvents);
  } finally { await close(); }
});

test('FP-HT-010 progression atlas drafts, saves, selects, and explains private strategy', async () => {
  const { server, close } = await fresh('progression-strategy');
  try {
    const before = await request(server, 'GET', '/api/founders-plot/progression-atlas');
    assert.equal(before.status, 200);
    const beforeGameplayHash = before.body.gameplayStableHash;

    const draft = await request(server, 'POST', '/api/founders-plot/progression-atlas/strategies/draft', {
      strategyKey: 'rush-hq3'
    });
    assert.equal(draft.status, 200);
    assert.equal(draft.body.ok, true);
    assert.equal(draft.body.gameplayStableHash, beforeGameplayHash);
    assert.equal(draft.body.strategy.title, 'Rush HQ3');
    assert.ok(draft.body.strategy.steps.find((step) => step.stepId === 'hq.level.3'));

    const save = await request(server, 'POST', '/api/founders-plot/progression-atlas/strategies', {
      strategyKey: 'rush-hq3',
      title: 'Rush HQ3',
      select: true
    });
    assert.equal(save.status, 200);
    assert.equal(save.body.ok, true);
    assert.equal(save.body.gameplayStableHash, beforeGameplayHash);
    assert.equal(save.body.selectedStrategyId, draft.body.strategy.strategyId);
    assert.equal(save.body.strategies.length, 1);
    assert.equal(save.body.strategies[0].selected, true);

    const atlas = await request(server, 'GET', '/api/founders-plot/progression-atlas');
    assert.equal(atlas.status, 200);
    assert.equal(atlas.body.gameplayStableHash, beforeGameplayHash);
    assert.equal(atlas.body.atlas.selectedStrategyId, draft.body.strategy.strategyId);

    const explain = await request(server, 'POST', '/api/founders-plot/progression-atlas/explain', {
      nodeId: 'hq.level.3'
    });
    assert.equal(explain.status, 200);
    assert.equal(explain.body.ok, true);
    assert.equal(explain.body.gameplayStableHash, beforeGameplayHash);
    assert.match(explain.body.explanation, /HQ Level 3/);
  } finally { await close(); }
});
