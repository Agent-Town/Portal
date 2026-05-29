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

function strategyFingerprint(strategy) {
  return {
    strategyId: strategy.strategyId,
    strategyKey: strategy.strategyKey,
    title: strategy.title,
    goal: strategy.goal,
    summary: strategy.summary,
    focus: strategy.focus,
    compare: strategy.compare,
    steps: strategy.steps.map((step) => ({
      stepId: step.stepId,
      title: step.title,
      status: step.status,
      blocker: step.blocker,
      nextAction: step.nextAction,
      requirements: step.requirements,
      actionRef: step.actionRef
    })),
    graph: strategy.graph
  };
}

async function getGameState(server) {
  const out = await request(server, 'GET', '/api/founders-plot/state');
  assert.equal(out.status, 200);
  assert.equal(out.body.ok, true);
  return out.body.state;
}

async function advanceGame(server, minutes = 5) {
  nowMs += minutes * 60_000;
  return getGameState(server);
}

async function catchUpGame(server) {
  let state = await getGameState(server);
  let guard = 12;
  while (Number(state.plot.lastSimulatedAt || 0) < nowMs && guard > 0) {
    state = await getGameState(server);
    guard -= 1;
  }
  return state;
}

function findBuildingInState(state, type) {
  return (state.buildings || []).find((building) => building.type === type);
}

function openBuildPad(state) {
  const pad = (state.pads || []).find((entry) => entry.kind === 'BUILD' && !entry.occupiedBy);
  assert.ok(pad, 'expected an open build pad');
  return pad;
}

async function claimAvailableRewards(server, plotId, tag) {
  let state = await getGameState(server);
  for (const reward of state.rewards || []) {
    const out = await request(server, 'POST', '/api/founders-plot/claim-reward', {
      plotId,
      rewardId: reward.rewardId,
      actor: 'HUMAN',
      idempotencyKey: `${tag}-claim-${reward.rewardId}-${nowMs}`
    });
    assert.equal(out.status, 200, out.body?.error?.message || `claim ${reward.rewardId}`);
    assert.equal(out.body.ok, true);
    state = out.body.state;
  }
  return state;
}

async function placeAndFinish(server, plotId, type, tag) {
  let state = await getGameState(server);
  if (findBuildingInState(state, type)) return findBuildingInState(state, type);
  const pad = openBuildPad(state);
  const out = await request(server, 'POST', '/api/founders-plot/place-building', {
    plotId,
    type,
    x: pad.x,
    y: pad.y,
    actor: 'HUMAN',
    idempotencyKey: `${tag}-place-${type}-${nowMs}`
  });
  assert.equal(out.status, 200, out.body?.error?.message || `place ${type}`);
  assert.equal(out.body.ok, true);
  state = await advanceGame(server, 5);
  const building = findBuildingInState(state, type);
  assert.ok(building, `${type} exists after placement`);
  assert.equal(building.state, 'READY');
  return building;
}

async function produceAndCollect(server, plotId, type, tag) {
  let state = await getGameState(server);
  const building = findBuildingInState(state, type);
  assert.ok(building, `${type} must exist`);
  assert.equal(building.state, 'READY', `${type} must be ready`);
  const kind = type === 'MARKET_STALL' ? 'SELL' : 'PRODUCE';
  const queued = await request(server, 'POST', '/api/founders-plot/queue-job', {
    plotId,
    buildingId: building.buildingId,
    kind,
    actor: 'HUMAN',
    idempotencyKey: `${tag}-queue-${type}-${nowMs}`
  });
  assert.equal(queued.status, 200, queued.body?.error?.message || `queue ${type}`);
  assert.equal(queued.body.ok, true);
  state = await advanceGame(server, 5);
  const ready = findBuildingInState(state, type);
  assert.equal(ready.state, 'OUTPUT_READY', `${type} output should be ready`);
  const collected = await request(server, 'POST', '/api/founders-plot/collect-outputs', {
    plotId,
    buildingId: ready.buildingId,
    actor: 'HUMAN',
    idempotencyKey: `${tag}-collect-${type}-${nowMs}`
  });
  assert.equal(collected.status, 200, collected.body?.error?.message || `collect ${type}`);
  assert.equal(collected.body.ok, true);
  return collected.body.state;
}

async function ensureResource(server, plotId, type, resource, amount, tag) {
  let state = await getGameState(server);
  let guard = 40;
  while (Number(state.plot.inventory[resource] || 0) < amount && guard > 0) {
    state = await produceAndCollect(server, plotId, type, `${tag}-${guard}`);
    guard -= 1;
  }
  assert.ok(Number(state.plot.inventory[resource] || 0) >= amount, `expected ${resource} >= ${amount}`);
  return state;
}

async function ensureTownXp(server, minXp) {
  let state = await getGameState(server);
  let guard = 20;
  while (Number(state.plot.townXp || 0) < minXp && guard > 0) {
    nowMs += (24 * 60 + 1) * 60_000;
    state = await catchUpGame(server);
    guard -= 1;
  }
  assert.ok(Number(state.plot.townXp || 0) >= minXp, `expected XP >= ${minXp}`);
  return state;
}

async function upgradeHqAndFinish(server, plotId, targetLevel, tag) {
  let state = await catchUpGame(server);
  const hq = findBuildingInState(state, 'HQ');
  const out = await request(server, 'POST', '/api/founders-plot/upgrade-building', {
    plotId,
    buildingId: hq.buildingId,
    actor: 'HUMAN',
    idempotencyKey: `${tag}-upgrade-hq-${targetLevel}-${nowMs}`
  });
  assert.equal(out.status, 200, out.body?.error?.message || `upgrade HQ${targetLevel}`);
  assert.equal(out.body.ok, true);
  state = await advanceGame(server, 5);
  if (state.plot.hqLevel < targetLevel) state = await catchUpGame(server);
  assert.equal(state.plot.hqLevel, targetLevel);
  return claimAvailableRewards(server, plotId, `${tag}-post-hq${targetLevel}`);
}

async function reachHq(server, targetLevel, tag) {
  let state = await getGameState(server);
  const plotId = state.plot.plotId;
  await placeAndFinish(server, plotId, 'LUMBER_CAMP', tag);
  await ensureResource(server, plotId, 'LUMBER_CAMP', 'wood', 32, tag);
  await claimAvailableRewards(server, plotId, tag);
  await placeAndFinish(server, plotId, 'FARM_PLOT', tag);
  await ensureResource(server, plotId, 'LUMBER_CAMP', 'wood', 20, tag);
  await ensureResource(server, plotId, 'FARM_PLOT', 'food', 10, tag);
  await ensureTownXp(server, 25);
  state = await getGameState(server);
  if (state.plot.hqLevel < 2) await upgradeHqAndFinish(server, plotId, 2, tag);
  if (targetLevel <= 2) return getGameState(server);

  await ensureResource(server, plotId, 'LUMBER_CAMP', 'wood', 36, tag);
  await ensureResource(server, plotId, 'FARM_PLOT', 'food', 10, tag);
  await placeAndFinish(server, plotId, 'QUARRY', tag);
  await ensureResource(server, plotId, 'LUMBER_CAMP', 'wood', 20, tag);
  await ensureResource(server, plotId, 'QUARRY', 'stone', 16, tag);
  await ensureTownXp(server, 50);
  state = await getGameState(server);
  if (state.plot.hqLevel < 3) await upgradeHqAndFinish(server, plotId, 3, tag);
  if (targetLevel <= 3) return getGameState(server);

  await ensureResource(server, plotId, 'LUMBER_CAMP', 'wood', 40, tag);
  await ensureResource(server, plotId, 'QUARRY', 'stone', 30, tag);
  await ensureResource(server, plotId, 'FARM_PLOT', 'food', 20, tag);
  await ensureTownXp(server, 90);
  state = await getGameState(server);
  if (state.plot.hqLevel < 4) await upgradeHqAndFinish(server, plotId, 4, tag);
  if (targetLevel <= 4) return getGameState(server);

  await ensureResource(server, plotId, 'LUMBER_CAMP', 'wood', 84, tag);
  await ensureResource(server, plotId, 'QUARRY', 'stone', 66, tag);
  await ensureResource(server, plotId, 'FARM_PLOT', 'food', 30, tag);
  await placeAndFinish(server, plotId, 'WORKSHOP', tag);
  await produceAndCollect(server, plotId, 'WORKSHOP', tag);
  await ensureResource(server, plotId, 'LUMBER_CAMP', 'wood', 60, tag);
  await ensureResource(server, plotId, 'QUARRY', 'stone', 50, tag);
  await ensureResource(server, plotId, 'FARM_PLOT', 'food', 30, tag);
  await ensureTownXp(server, 140);
  state = await getGameState(server);
  if (state.plot.hqLevel < 5) await upgradeHqAndFinish(server, plotId, 5, tag);
  return getGameState(server);
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
    assert.deepEqual(
      out.body.atlas.strategyTemplates.map((template) => template.strategyKey).sort(),
      ['balanced-food-wood', 'delegate-outputs-first', 'rush-hq3']
    );
    assert.deepEqual(
      out.body.atlas.strategyOptions.map((strategy) => strategy.strategyKey).sort(),
      ['balanced-food-wood', 'delegate-outputs-first', 'rush-hq3']
    );
    assert.equal(out.body.atlas.recommendedStrategy.strategyKey, 'rush-hq3');
    assert.equal(out.body.atlas.recommendedStrategy.baseGameplayStableHash, out.body.gameplayStableHash);
    const balanced = out.body.atlas.strategyOptions.find((strategy) => strategy.strategyKey === 'balanced-food-wood');
    const delegate = out.body.atlas.strategyOptions.find((strategy) => strategy.strategyKey === 'delegate-outputs-first');
    assert.equal(balanced.compare.goal, balanced.goal);
    assert.equal(balanced.compare.stepCount, balanced.steps.length);
    assert.ok(balanced.compare.focus.includes('Wood and food base'));
    assert.match(balanced.compare.tradeoff, /legible/);
    assert.match(balanced.compare.approvalDelegationBurden, /direct control/);
    assert.ok(delegate.steps.find((step) => step.stepId === 'foreman.collect_outputs'));
    assert.deepEqual(delegate.compare.permissions, ['collectOutputs', 'queueProduction']);
    assert.match(delegate.compare.tradeoff, /delegation boundaries/);
    assert.deepEqual(delegate.compare.burden.delegationMilestones, ['collectOutputs', 'queueProduction']);
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
    assert.ok(Array.isArray(out.body.atlas.canonicalNodes));
    assert.ok(Array.isArray(out.body.atlas.canonicalEdges));
    assert.ok(out.body.atlas.availabilityByNode && typeof out.body.atlas.availabilityByNode === 'object');
    assert.ok(out.body.atlas.actionRefsByNode && typeof out.body.atlas.actionRefsByNode === 'object');
    assert.ok(out.body.atlas.receiptRefs && typeof out.body.atlas.receiptRefs === 'object');
    const canonical = new Map(out.body.atlas.canonicalNodes.map((node) => [node.nodeId, node]));
    for (const requiredNode of [
      'hq.level.1',
      'hq.level.5',
      'hq.upgrade.5',
      'building.LUMBER_CAMP.place',
      'building.FARM_PLOT.place',
      'building.QUARRY.place',
      'building.WORKSHOP.place',
      'building.MARKET_STALL.place',
      'production.WORKSHOP.PRODUCE',
      'production.MARKET_STALL.SELL',
      'permission.observeAndSuggest.unlock',
      'permission.setPriority.unlock',
      'permission.sellSurplusFood.unlock',
      'policy.sellSurplusFood.enable',
      'policy.sellDailyCoinCap',
      'reward.hq.level-5.claim',
      'constraint.storage.wood',
      'constraint.construction_slots',
      'effect.workshop.next_build_buff'
    ]) {
      assert.ok(canonical.has(requiredNode), `canonical graph includes ${requiredNode}`);
      assert.deepEqual(out.body.atlas.receiptRefs[requiredNode], []);
    }
    assert.equal(canonical.get('hq.level.1').status, 'done');
    assert.equal(canonical.get('hq.level.5').status, 'locked');
    assert.equal(canonical.get('building.WORKSHOP.place').status, 'locked');
    assert.equal(canonical.get('building.MARKET_STALL.place').status, 'locked');
    assert.equal(canonical.get('permission.observeAndSuggest.unlock').status, 'done');
    assert.equal(canonical.get('permission.sellSurplusFood.unlock').status, 'locked');
    assert.equal(canonical.get('constraint.storage.wood').metadata.cap, 100);
    assert.equal(canonical.get('constraint.construction_slots').metadata.slots, 1);
    assert.equal(canonical.get('production.WORKSHOP.PRODUCE').metadata.input.wood, 8);
    assert.equal(canonical.get('production.WORKSHOP.PRODUCE').metadata.input.stone, 4);
    assert.equal(canonical.get('production.WORKSHOP.PRODUCE').metadata.output.wood, undefined);
    assert.equal(canonical.get('production.WORKSHOP.PRODUCE').metadata.buffPct, 20);
    assert.equal(canonical.get('production.MARKET_STALL.SELL').metadata.input.food, 6);
    assert.equal(canonical.get('production.MARKET_STALL.SELL').metadata.output.coin, 3);
    assert.equal(out.body.atlas.actionRefsByNode['building.LUMBER_CAMP.place'].tool, 'et.plot.place_building');
    assert.equal(out.body.atlas.actionRefsByNode['building.LUMBER_CAMP.place'].executableByAtlas, false);
    assert.equal(out.body.atlas.actionRefsByNode['building.LUMBER_CAMP.place'].executable, false);
    assert.equal(out.body.atlas.actionRefsByNode['production.MARKET_STALL.SELL'], undefined);
    assert.ok(out.body.atlas.canonicalEdges.find((edge) => edge.kind === 'unlocks_building' && edge.to === 'building.WORKSHOP.unlock'));
    assert.equal(out.body.atlas.openClawLiteSurface.generateIconDraft, 'agent_town_progression_generate_icon_draft');
    assert.equal(out.body.atlas.openClawLiteSurface.saveEditedStrategy, 'agent_town_progression_save_edited_strategy');

    const repeat = await request(server, 'GET', '/api/founders-plot/progression-atlas');
    assert.equal(repeat.status, 200);
    assert.equal(repeat.body.gameplayStableHash, out.body.gameplayStableHash);
    assert.equal(repeat.body.gameplaySnapshot.audit.eventCount, out.body.gameplaySnapshot.audit.eventCount);
    assert.deepEqual(repeat.body.gameplaySnapshot.plot.inventory, out.body.gameplaySnapshot.plot.inventory);

    const after = await request(server, 'GET', '/api/founders-plot/state');
    assert.equal(after.status, 200);
    assert.equal(after.body.state.audit.eventCount, beforeEvents);
  } finally { await close(); }
});

test('FP-HT-010 progression atlas canonical graph follows real HQ4/HQ5 gameplay state', async () => {
  const { server, close } = await fresh('progression-canonical-hq5');
  try {
    let state = await reachHq(server, 4, 'canon-hq4');
    const plotId = state.plot.plotId;
    let atlas = await request(server, 'GET', '/api/founders-plot/progression-atlas');
    assert.equal(atlas.status, 200);
    let canonical = new Map(atlas.body.atlas.canonicalNodes.map((node) => [node.nodeId, node]));
    assert.equal(canonical.get('hq.level.4').status, 'done');
    assert.equal(canonical.get('permission.setPriority.unlock').status, 'done');
    assert.equal(canonical.get('constraint.storage.wood').metadata.cap, 160);
    assert.notEqual(canonical.get('building.WORKSHOP.place').status, 'locked');
    assert.equal(canonical.get('building.MARKET_STALL.place').status, 'locked');
    assert.equal(canonical.get('production.WORKSHOP.PRODUCE').metadata.buffPct, 20);
    assert.deepEqual(canonical.get('production.WORKSHOP.PRODUCE').metadata.output, {});
    assert.equal(canonical.get('production.WORKSHOP.PRODUCE').metadata.input.wood, 8);
    assert.equal(canonical.get('production.WORKSHOP.PRODUCE').metadata.input.stone, 4);
    assert.equal(atlas.body.atlas.actionRefsByNode['action.set_priority'].tool, 'et.plot.set_priority');
    assert.equal(atlas.body.atlas.actionRefsByNode['action.set_priority'].executableByAtlas, false);

    state = await reachHq(server, 5, 'canon-hq5');
    atlas = await request(server, 'GET', '/api/founders-plot/progression-atlas');
    assert.equal(atlas.status, 200);
    canonical = new Map(atlas.body.atlas.canonicalNodes.map((node) => [node.nodeId, node]));
    assert.equal(canonical.get('hq.level.5').status, 'done');
    assert.equal(canonical.get('permission.sellSurplusFood.unlock').status, 'done');
    assert.equal(canonical.get('building.WORKSHOP.place').status, 'done');
    assert.equal(canonical.get('effect.workshop.next_build_buff').metadata.availableBuffPct, 20);
    assert.notEqual(canonical.get('building.MARKET_STALL.place').status, 'locked');
    assert.equal(canonical.get('policy.sellDailyCoinCap').metadata.value, 15);
    assert.equal(canonical.get('production.MARKET_STALL.SELL').metadata.input.food, 6);
    assert.equal(canonical.get('production.MARKET_STALL.SELL').metadata.output.coin, 3);
    assert.equal(canonical.get('production.MARKET_STALL.SELL').metadata.kind, 'SELL');
    assert.equal(atlas.body.atlas.actionRefsByNode['production.MARKET_STALL.SELL'], undefined);

    await ensureResource(server, plotId, 'LUMBER_CAMP', 'wood', 20, 'canon-market');
    await ensureResource(server, plotId, 'QUARRY', 'stone', 18, 'canon-market');
    await ensureResource(server, plotId, 'FARM_PLOT', 'food', 6, 'canon-market');
    await placeAndFinish(server, plotId, 'MARKET_STALL', 'canon-market');
    atlas = await request(server, 'GET', '/api/founders-plot/progression-atlas');
    assert.equal(atlas.status, 200);
    canonical = new Map(atlas.body.atlas.canonicalNodes.map((node) => [node.nodeId, node]));
    assert.equal(canonical.get('building.MARKET_STALL.place').status, 'done');
    assert.equal(canonical.get('production.MARKET_STALL.SELL').status, 'available');
    assert.equal(atlas.body.atlas.actionRefsByNode['production.MARKET_STALL.SELL'].tool, 'et.plot.queue_job');
    assert.equal(atlas.body.atlas.actionRefsByNode['production.MARKET_STALL.SELL'].agentPolicy.permissionKey, 'sellSurplusFood');
    assert.equal(atlas.body.atlas.actionRefsByNode['production.MARKET_STALL.SELL'].agentPolicy.dailyCapField, 'sellDailyCoinCap');

    const beforeReadHash = atlas.body.gameplayStableHash;
    const beforeReadEvents = atlas.body.gameplaySnapshot.audit.eventCount;
    const beforeReadInventory = atlas.body.gameplaySnapshot.plot.inventory;
    const repeat = await request(server, 'GET', '/api/founders-plot/progression-atlas');
    assert.equal(repeat.status, 200);
    assert.equal(repeat.body.gameplayStableHash, beforeReadHash);
    assert.equal(repeat.body.gameplaySnapshot.audit.eventCount, beforeReadEvents);
    assert.deepEqual(repeat.body.gameplaySnapshot.plot.inventory, beforeReadInventory);
  } finally { await close(); }
});

test('FP-HT-011 progression atlas drafts, saves, selects, and explains private strategies without gameplay mutation', async () => {
  const { server, close } = await fresh('progression-strategy');
  try {
    const before = await request(server, 'GET', '/api/founders-plot/progression-atlas');
    assert.equal(before.status, 200);
    const beforeGameplayHash = before.body.gameplayStableHash;
    const beforeInventory = before.body.gameplaySnapshot.plot.inventory;
    const beforeEvents = before.body.gameplaySnapshot.audit.eventCount;

    const keys = ['rush-hq3', 'balanced-food-wood', 'delegate-outputs-first'];
    const drafted = {};
    for (const key of keys) {
      const first = await request(server, 'POST', '/api/founders-plot/progression-atlas/strategies/draft', { strategyKey: key });
      const second = await request(server, 'POST', '/api/founders-plot/progression-atlas/strategies/draft', { strategyKey: key });
      assert.equal(first.status, 200);
      assert.equal(second.status, 200);
      assert.equal(first.body.ok, true);
      assert.equal(first.body.gameplayStableHash, beforeGameplayHash);
      assert.equal(second.body.gameplayStableHash, beforeGameplayHash);
      assert.deepEqual(strategyFingerprint(first.body.strategy), strategyFingerprint(second.body.strategy));
      assert.equal(first.body.strategy.visibility, 'private');
      assert.equal(first.body.strategy.gameplayMutationPolicy, 'advisory_only');
      assert.ok(first.body.strategy.steps.find((step) => step.stepId === 'hq.level.3'));
      assert.ok(first.body.strategy.compare.goal);
      assert.equal(first.body.strategy.compare.stepCount, first.body.strategy.steps.length);
      assert.ok(first.body.strategy.compare.tradeoff);
      assert.ok(Array.isArray(first.body.strategy.compare.roughBlockers));
      drafted[key] = first.body.strategy;
    }
    assert.notEqual(drafted['rush-hq3'].strategyId, drafted['balanced-food-wood'].strategyId);
    assert.notEqual(drafted['rush-hq3'].strategyId, drafted['delegate-outputs-first'].strategyId);
    assert.ok(drafted['delegate-outputs-first'].steps.find((step) => step.stepId === 'foreman.collect_outputs'));

    for (const key of keys) {
      const save = await request(server, 'POST', '/api/founders-plot/progression-atlas/strategies', {
        strategyKey: key,
        title: drafted[key].title,
        select: key === 'delegate-outputs-first'
      });
      assert.equal(save.status, 200);
      assert.equal(save.body.ok, true);
      assert.equal(save.body.gameplayStableHash, beforeGameplayHash);
    }

    const atlas = await request(server, 'GET', '/api/founders-plot/progression-atlas');
    assert.equal(atlas.status, 200);
    assert.equal(atlas.body.gameplayStableHash, beforeGameplayHash);
    assert.equal(atlas.body.atlas.strategies.length, 3);
    assert.deepEqual(
      atlas.body.atlas.strategies.map((strategy) => strategy.strategyKey).sort(),
      keys.slice().sort()
    );
    assert.equal(atlas.body.atlas.selectedStrategyId, drafted['delegate-outputs-first'].strategyId);
    assert.equal(atlas.body.atlas.strategies.filter((strategy) => strategy.selected).length, 1);

    const select = await request(server, 'POST', `/api/founders-plot/progression-atlas/strategies/${drafted['balanced-food-wood'].strategyId}/select`, {});
    assert.equal(select.status, 200);
    assert.equal(select.body.ok, true);
    assert.equal(select.body.gameplayStableHash, beforeGameplayHash);
    assert.equal(select.body.selectedStrategyId, drafted['balanced-food-wood'].strategyId);

    const explain = await request(server, 'POST', '/api/founders-plot/progression-atlas/explain', {
      nodeId: 'foreman.collect_outputs'
    });
    assert.equal(explain.status, 200);
    assert.equal(explain.body.ok, true);
    assert.equal(explain.body.gameplayStableHash, beforeGameplayHash);
    assert.match(explain.body.explanation, /output collection/);

    const afterState = await request(server, 'GET', '/api/founders-plot/state');
    assert.equal(afterState.status, 200);
    assert.equal(afterState.body.state.audit.eventCount, beforeEvents);
    assert.deepEqual(afterState.body.state.plot.inventory, beforeInventory);

    const afterAtlas = await request(server, 'GET', '/api/founders-plot/progression-atlas');
    assert.equal(afterAtlas.body.gameplayStableHash, beforeGameplayHash);
    assert.deepEqual(afterAtlas.body.gameplaySnapshot.plot.inventory, beforeInventory);
    assert.equal(afterAtlas.body.gameplaySnapshot.audit.eventCount, beforeEvents);
  } finally { await close(); }
});

test('FP-HT-012 progression atlas saves edited strategy steps and GenAI icon drafts without gameplay mutation', async () => {
  const { server, close } = await fresh('progression-editor');
  try {
    const before = await request(server, 'GET', '/api/founders-plot/progression-atlas');
    assert.equal(before.status, 200);
    const beforeGameplayHash = before.body.gameplayStableHash;
    const beforeInventory = before.body.gameplaySnapshot.plot.inventory;
    const beforeEvents = before.body.gameplaySnapshot.audit.eventCount;

    const iconDraft = await request(server, 'POST', '/api/founders-plot/progression-atlas/icons/generate', {
      title: 'Scout Ridge',
      prompt: 'frontier ridge scout marker, Agent Town strategy icon'
    });
    assert.equal(iconDraft.status, 200);
    assert.equal(iconDraft.body.ok, true);
    assert.equal(iconDraft.body.gameplayStableHash, beforeGameplayHash);
    assert.equal(iconDraft.body.icon.generatedBy, 'progression_atlas_genai_icon_prompt_v1');
    assert.equal(iconDraft.body.icon.generatedAdHoc, true);
    assert.equal(iconDraft.body.icon.generationMode, 'prompt_artifact');
    assert.match(iconDraft.body.icon.genAi.prompt, /frontier ridge scout marker/);

    const edited = {
      title: 'Expansion Sketch',
      goal: 'Sketch an editable expansion sequence without changing gameplay truth.',
      summary: 'Player-authored strategy draft for future scout planning.',
      focus: ['Private editor', 'Before-after links', 'Generated icon draft'],
      createdBy: 'openclaw_lite',
      source: 'editor',
      parentStrategyId: 'strategy_delegate_outputs_first_seed',
      revision: 2,
      sharePolicy: 'share_redacted',
      steps: [
        {
          stepId: 'hq.level.3',
          title: 'Upgrade HQ to Level 3',
          stepKind: 'canonical_node',
          canonicalNodeId: 'hq.level.3',
          reason: 'Keep the edited plan anchored to the canonical HQ3 node.',
          nextAction: 'Reach HQ3 through normal Founders Plot play.',
          afterStepId: 'editor.scout_ridge',
          expectedBenefit: ['Unlock queueProduction planning'],
          assumptions: ['Canonical HQ3 rules still own the gameplay upgrade.'],
          actionRef: { tool: 'et.plot.upgrade_building', params: { buildingId: 'building_hq_1' } },
          icon: iconDraft.body.icon
        },
        {
          stepId: 'editor.scout_ridge',
          title: 'Scout Ridge',
          stepKind: 'future_placeholder',
          futureSystem: 'expedition',
          reason: 'Mark the first scouting thought after HQ3 planning.',
          nextAction: 'Attach this as a future scouting idea.',
          beforeStepId: 'hq.level.3',
          afterStepId: 'editor.claim_second_plot',
          targetRef: { kind: 'future_system', id: 'scout_ridge', type: 'expedition' },
          requirements: {
            items: [{ kind: 'future_tool', label: 'Expedition Board exists' }],
            affordable: false,
            missing: { ExpeditionBoard: 1 }
          },
          estimatedCost: { wood: 2, food: 1, unknown: 99 },
          expectedBenefit: ['Reveal a candidate second plot'],
          riskLevel: 'medium',
          reversibility: 'layout_sensitive',
          assumptions: ['Scouting will become canonical later.'],
          privacy: 'share_redacted',
          actionRef: { tool: 'wallet.sign', params: { message: 'nope' } },
          icon: iconDraft.body.icon
        },
        {
          stepId: 'editor.claim_second_plot',
          title: 'Claim Second Plot',
          stepKind: 'custom_note',
          reason: 'Connect the scouting thought to a later territory claim.',
          nextAction: 'Wait for canonical expedition tools.',
          beforeStepId: 'editor.scout_ridge',
          requirements: {
            items: [{ kind: 'note', label: 'Player still wants expansion.' }],
            affordable: true,
            missing: {}
          },
          actionRef: { tool: 'et.plot.set_priority', params: { buildingId: 'building_hq_1', priority: 'HIGH' } }
        },
        {
          stepId: 'editor.unknown_canonical',
          title: 'Oracle Research Placeholder',
          stepKind: 'canonical_node',
          canonicalNodeId: 'research.oracle_lane',
          reason: 'This should not become a canonical node until it exists.',
          nextAction: 'Wait for research/oracle progression.',
          beforeStepId: 'editor.claim_second_plot',
          actionRef: { tool: 'browser.open', params: { url: 'https://example.com' } }
        }
      ]
    };
    const save = await request(server, 'POST', '/api/founders-plot/progression-atlas/strategies', {
      strategy: edited,
      select: true
    });
    assert.equal(save.status, 200);
    assert.equal(save.body.ok, true);
    assert.equal(save.body.gameplayStableHash, beforeGameplayHash);
    assert.equal(save.body.strategy.generatedBy, 'progression_atlas_strategy_editor_v1');
    assert.equal(save.body.strategy.strategyKey, 'custom-expansion_sketch');
    assert.equal(save.body.strategy.createdBy, 'openclaw_lite');
    assert.equal(save.body.strategy.source, 'editor');
    assert.equal(save.body.strategy.parentStrategyId, 'strategy_delegate_outputs_first_seed');
    assert.equal(save.body.strategy.revision, 2);
    assert.equal(save.body.strategy.sharePolicy, 'share_redacted');
    assert.match(save.body.strategy.contentHash, /^[a-f0-9]{64}$/);
    assert.equal(save.body.strategy.steps.length, 4);
    assert.equal(save.body.strategy.steps[0].stepKind, 'canonical_node');
    assert.equal(save.body.strategy.steps[0].canonicalNodeId, 'hq.level.3');
    assert.equal(save.body.strategy.steps[0].targetRef.kind, 'hq');
    assert.equal(save.body.strategy.steps[0].requirements.advisory, false);
    assert.equal(save.body.strategy.steps[0].actionRef.tool, 'et.plot.upgrade_building');
    assert.equal(save.body.strategy.steps[0].actionRef.executable, false);
    assert.equal(save.body.strategy.steps[1].stepKind, 'future_placeholder');
    assert.equal(save.body.strategy.steps[1].canonicalNodeId, null);
    assert.equal(save.body.strategy.steps[1].futureSystem, 'expedition');
    assert.equal(save.body.strategy.steps[1].targetRef.type, 'expedition');
    assert.deepEqual(save.body.strategy.steps[1].estimatedCost, { wood: 2, food: 1 });
    assert.deepEqual(save.body.strategy.steps[1].expectedBenefit, ['Reveal a candidate second plot']);
    assert.equal(save.body.strategy.steps[1].riskLevel, 'medium');
    assert.equal(save.body.strategy.steps[1].reversibility, 'layout_sensitive');
    assert.deepEqual(save.body.strategy.steps[1].assumptions, ['Scouting will become canonical later.']);
    assert.equal(save.body.strategy.steps[1].privacy, 'share_redacted');
    assert.equal(save.body.strategy.steps[1].requirements.advisory, true);
    assert.equal(save.body.strategy.steps[1].requirements.items[0].advisory, true);
    assert.equal(save.body.strategy.steps[1].actionRef, null);
    assert.equal(save.body.strategy.steps[2].stepKind, 'custom_note');
    assert.equal(save.body.strategy.steps[2].requirements.advisory, true);
    assert.equal(save.body.strategy.steps[2].actionRef.tool, 'et.plot.set_priority');
    assert.equal(save.body.strategy.steps[2].actionRef.executable, false);
    assert.notEqual(save.body.strategy.steps[3].stepKind, 'canonical_node');
    assert.equal(save.body.strategy.steps[3].canonicalNodeId, null);
    assert.equal(save.body.strategy.steps[3].futureSystem, 'research');
    assert.equal(save.body.strategy.steps[3].requestedCanonicalNodeId, 'research.oracle_lane');
    assert.equal(save.body.strategy.steps[3].actionRef, null);
    assert.equal(save.body.strategy.steps[0].afterStepId, 'editor.scout_ridge');
    assert.equal(save.body.strategy.steps[1].afterStepId, 'editor.claim_second_plot');
    assert.equal(save.body.strategy.steps[2].beforeStepId, 'editor.scout_ridge');
    assert.ok(save.body.strategy.graph.edges.find((edge) => edge.from === 'editor.scout_ridge' && edge.to === 'editor.claim_second_plot'));
    assert.equal(save.body.strategy.steps[1].icon.generatedBy, 'progression_atlas_genai_icon_prompt_v1');
    assert.equal(save.body.strategy.steps[1].icon.genAi.status, 'draft_prompt_attached');
    assert.equal(save.body.selectedStrategyId, save.body.strategy.strategyId);

    const afterState = await request(server, 'GET', '/api/founders-plot/state');
    assert.equal(afterState.status, 200);
    assert.equal(afterState.body.state.audit.eventCount, beforeEvents);
    assert.deepEqual(afterState.body.state.plot.inventory, beforeInventory);

    const afterAtlas = await request(server, 'GET', '/api/founders-plot/progression-atlas');
    assert.equal(afterAtlas.status, 200);
    assert.equal(afterAtlas.body.gameplayStableHash, beforeGameplayHash);
    assert.equal(afterAtlas.body.atlas.strategies.find((strategy) => strategy.selected)?.title, 'Expansion Sketch');
    assert.equal(afterAtlas.body.gameplaySnapshot.audit.eventCount, beforeEvents);
    assert.deepEqual(afterAtlas.body.gameplaySnapshot.plot.inventory, beforeInventory);
  } finally { await close(); }
});
