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
const engine = require('../server/founders_plot/engine');
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

async function seedResearchReadyPlot(server, tag) {
  const state = await getGameState(server);
  const plotId = state.plot.plotId;
  const pairId = state.plot.pairId;
  const bundle = store.readPlotBundleById(plotId);
  bundle.plot.hqLevel = 6;
  bundle.plot.townXp = 260;
  bundle.plot.inventory = { wood: 64, stone: 32, food: 40, coin: 12 };
  bundle.plot.storageCaps = engine.HQ_LEVEL_RULES[6].storageCaps;
  bundle.plot.constructionSlots = engine.HQ_LEVEL_RULES[6].constructionSlots;
  store.writePlot(bundle.plot);
  const claimId = `claim_${tag}`;
  const foundedPlotId = `plot_outpost_${tag}`;
  store.writeSettlementClaim({
    claimId,
    ownerPairId: pairId,
    originPlotId: plotId,
    sitePlanId: `site_plan_${tag}`,
    reportId: `scout_report_${tag}`,
    foundedPlotId,
    convoyJobId: `job_convoy_${tag}`,
    approvalId: null,
    status: 'FOUNDED',
    title: 'HTTP Research Outpost',
    focus: 'balanced',
    siteType: 'woodland_ridge',
    risk: 'low',
    traits: ['settler-safe'],
    resourceHints: { wood: 1 },
    route: { visualOnlyProjection: true, progress: 1 },
    cost: engine.SETTLER_CONVOY_DEF.cost,
    receipt: { kind: 'settlement_founded', foundedPlotId, authorityBoundary: 'server_owned_second_plot_no_world_map' },
    createdBy: 'HUMAN',
    createdAt: nowMs,
    updatedAt: nowMs,
    convoyStartedAt: nowMs - engine.SETTLER_CONVOY_DEF.durationMs,
    convoyEndsAt: nowMs - 1,
    foundedAt: nowMs
  });
  return { plotId, pairId, claimId, foundedPlotId };
}

function seedReadyOutputBuildings(plotId, tag, count = 3) {
  const defs = [
    [`bldg_${tag}_farm`, 'FARM_PLOT', { food: 9 }, 2, 1],
    [`bldg_${tag}_lumber`, 'LUMBER_CAMP', { wood: 12 }, 0, 1],
    [`bldg_${tag}_quarry`, 'QUARRY', { stone: 7 }, 1, 2]
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
    createdAt: nowMs + index,
    updatedAt: nowMs + index
  }));
  const bundle = store.readPlotBundleById(plotId);
  store.writeBuildings([
    ...bundle.buildings.filter((building) => !buildings.some((next) => next.buildingId === building.buildingId)),
    ...buildings
  ]);
  return buildings;
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
  const kind = type === 'MARKET_STALL' ? 'SELL' : type === 'EXPEDITION_BOARD' ? 'SCOUT' : 'PRODUCE';
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

  await ensureResource(server, plotId, 'LUMBER_CAMP', 'wood', 24, tag);
  await ensureResource(server, plotId, 'QUARRY', 'stone', 12, tag);
  await ensureResource(server, plotId, 'FARM_PLOT', 'food', 8, tag);
  await placeAndFinish(server, plotId, 'EXPEDITION_BOARD', tag);
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
  if (targetLevel <= 5) return getGameState(server);

  await ensureResource(server, plotId, 'LUMBER_CAMP', 'wood', 20, tag);
  await ensureResource(server, plotId, 'QUARRY', 'stone', 18, tag);
  await placeAndFinish(server, plotId, 'MARKET_STALL', tag);
  await ensureResource(server, plotId, 'LUMBER_CAMP', 'wood', 90, tag);
  await ensureResource(server, plotId, 'QUARRY', 'stone', 80, tag);
  await ensureResource(server, plotId, 'FARM_PLOT', 'food', 50, tag);
  await ensureTownXp(server, 220);
  state = await getGameState(server);
  if (state.plot.hqLevel < 6) await upgradeHqAndFinish(server, plotId, 6, tag);
  return getGameState(server);
}

test('FP-HT-001 GET /api/founders-plot/tools returns all current Founders Plot tools', async () => {
  const { server, close } = await fresh('tools');
  try {
    const out = await request(server, 'GET', '/api/founders-plot/tools');
    assert.equal(out.status, 200);
    assert.ok(Array.isArray(out.body.tools));
    assert.ok(out.body.tools.length >= 15);
    const names = out.body.tools.map((t) => t.name).sort();
    for (const req of ['et.plot.get_state', 'et.plot.place_building', 'et.plot.queue_job',
      'et.plot.collect_outputs', 'et.plot.draft_site_plan', 'et.plot.draft_site_plan_from_packet', 'et.plot.review_site_plan',
      'et.plot.select_doctrine', 'et.plot.create_work_order_draft', 'et.plot.execute_work_order',
      'et.plot.list_plots', 'et.plot.get_world_grid_status', 'et.plot.list_civic_proposals',
      'et.plot.get_expedition_map', 'et.plot.scout_sector', 'et.plot.create_civic_proposal', 'et.plot.list_overlay_packs', 'et.plot.create_overlay_pack',
      'et.plot.list_civic_projects', 'et.plot.activate_civic_project',
      'et.plot.prepare_settler_convoy', 'et.plot.found_settlement',
      'et.plot.upgrade_building', 'et.plot.set_priority',
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

test('FP-HT-002b GET /api/founders-plot/state enforces plot membership', async () => {
  const { server, close } = await fresh('membership');
  const otherServer = await listen(makeApp('session:ht-membership-other'));
  try {
    const owner = await request(server, 'GET', '/api/founders-plot/state');
    const other = await request(otherServer, 'GET', '/api/founders-plot/state');
    assert.equal(owner.status, 200);
    assert.equal(other.status, 200);
    const denied = await request(server, 'GET', `/api/founders-plot/state?plotId=${other.body.state.plot.plotId}`);
    assert.equal(denied.status, 401);
    assert.equal(denied.body.error.code, 'UNAUTHORIZED');
  } finally {
    await new Promise((resolve) => otherServer.close(() => resolve()));
    await close();
  }
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
    assert.deepEqual(
      before.body.state.hqUpgrade.buildingPrerequisites.map((entry) => [entry.type, entry.satisfied]),
      [['LUMBER_CAMP', false], ['FARM_PLOT', false]]
    );

    const out = await request(server, 'GET', '/api/founders-plot/progression-atlas');
    assert.equal(out.status, 200);
    assert.equal(out.body.ok, true);
    assert.match(out.body.gameplayStableHash, /^[a-f0-9]{64}$/);
    assert.equal(out.body.atlas.gameplayStableHash, out.body.gameplayStableHash);
    assert.equal(out.body.atlas.graphVersion, 'founders-plot-progression-atlas-v1');
    assert.deepEqual(
      out.body.atlas.strategyTemplates.map((template) => template.strategyKey).sort(),
      ['balanced-food-wood', 'delegate-outputs-first', 'hq10-horizon', 'rush-hq3']
    );
    assert.deepEqual(
      out.body.atlas.strategyOptions.map((strategy) => strategy.strategyKey).sort(),
      ['balanced-food-wood', 'delegate-outputs-first', 'hq10-horizon', 'rush-hq3']
    );
    assert.equal(out.body.atlas.recommendedStrategy.strategyKey, 'rush-hq3');
    assert.equal(out.body.atlas.recommendedStrategy.baseGameplayStableHash, out.body.gameplayStableHash);
    const balanced = out.body.atlas.strategyOptions.find((strategy) => strategy.strategyKey === 'balanced-food-wood');
    const delegate = out.body.atlas.strategyOptions.find((strategy) => strategy.strategyKey === 'delegate-outputs-first');
    const hq10 = out.body.atlas.strategyOptions.find((strategy) => strategy.strategyKey === 'hq10-horizon');
    assert.equal(balanced.compare.goal, balanced.goal);
    assert.equal(balanced.compare.stepCount, balanced.steps.length);
    assert.ok(balanced.compare.focus.includes('Wood and food base'));
    assert.match(balanced.compare.tradeoff, /legible/);
    assert.match(balanced.compare.approvalDelegationBurden, /direct control/);
    assert.ok(delegate.steps.find((step) => step.stepId === 'foreman.collect_outputs'));
    assert.deepEqual(delegate.compare.permissions, ['collectOutputs', 'queueProduction']);
    assert.match(delegate.compare.tradeoff, /delegation boundaries/);
    assert.deepEqual(delegate.compare.burden.delegationMilestones, ['collectOutputs', 'queueProduction']);
    assert.equal(hq10.title, 'HQ10 Horizon');
    assert.equal(hq10.gameplayMutationPolicy, 'advisory_only');
    assert.equal(hq10.compare.futureMilestones.length, 4);
    assert.equal(hq10.compare.burden.futureMilestones, 4);
    const hq10Future = hq10.steps.filter((step) => step.stepKind === 'future_placeholder');
    assert.equal(hq10Future.length, 4);
    assert.deepEqual(hq10Future.map((step) => step.target.level), [7, 8, 9, 10]);
    assert.ok(hq10Future.every((step) => step.actionRef === null));
    assert.ok(hq10Future.every((step) => step.requirements.advisory === true));
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
    assert.equal(out.body.atlas.iconCatalog['building.expedition_board'].symbol, 'EB');
    assert.equal(out.body.atlas.iconCatalog['building.expedition_board'].assetPath, '/assets/icons/agent-town/expedition-board-gpt-image-2-v1.png');
    assert.equal(out.body.atlas.iconCatalog['action.scout'].symbol, 'SC');
    assert.equal(out.body.atlas.iconCatalog['action.scout'].assetPath, '/assets/icons/agent-town/scout-action-gpt-image-2-v1.png');
    assert.equal(out.body.atlas.iconCatalog['receipt.scout_report'].symbol, 'SR');
    assert.equal(out.body.atlas.iconCatalog['receipt.scout_report'].assetPath, '/assets/icons/agent-town/scout-report-gpt-image-2-v1.png');
    assert.equal(out.body.atlas.iconCatalog['planning.site_plan'].assetPath, '/assets/icons/agent-town/site-plan-gpt-image-2-v1.png');
    const hqStep = out.body.atlas.recommendedStrategy.steps.find((step) => step.stepId === 'hq.level.3');
    assert.equal(hqStep.icon.symbol, 'H3');
    assert.equal(hqStep.icon.tone, 'command');
    assert.equal(hqStep.icon.assetPath, '/assets/icons/agent-town/hq-upgrade-gpt-image-2-v1.png');
    const hq2Step = out.body.atlas.recommendedStrategy.steps.find((step) => step.stepId === 'hq.level.2');
    assert.equal(hq2Step.resourceGate.kind, 'resource_spending_gate');
    assert.equal(hq2Step.resourceGate.gameplayAuthority, 'founders_plot_engine');
    assert.equal(hq2Step.resourceGate.executableByAtlas, false);
    assert.deepEqual(hq2Step.resourceGate.estimatedCost, { wood: 20, food: 10 });
    assert.equal(hq2Step.resourceGate.requirements.items.find((item) => item.resource === 'XP').required, 25);
    assert.deepEqual(
      hq2Step.resourceGate.requirements.items
        .filter((item) => item.kind === 'building')
        .map((item) => [item.resource, item.requiredState, item.missing]),
      [['LUMBER_CAMP', 'READY', 1], ['FARM_PLOT', 'READY', 1]]
    );
    assert.equal(hqStep.resourceGate.kind, 'resource_spending_gate');
    assert.deepEqual(hqStep.resourceGate.estimatedCost, { wood: 20, stone: 16 });
    assert.equal(hqStep.resourceGate.requirements.items.find((item) => item.resource === 'XP').required, 50);
    assert.deepEqual(
      hqStep.resourceGate.requirements.items
        .filter((item) => item.kind === 'building')
        .map((item) => [item.resource, item.requiredState, item.missing]),
      [['QUARRY', 'READY', 1]]
    );
    assert.ok(Array.isArray(out.body.atlas.canonicalNodes));
    assert.ok(Array.isArray(out.body.atlas.canonicalEdges));
    assert.ok(out.body.atlas.availabilityByNode && typeof out.body.atlas.availabilityByNode === 'object');
    assert.ok(out.body.atlas.actionRefsByNode && typeof out.body.atlas.actionRefsByNode === 'object');
    assert.ok(out.body.atlas.receiptRefs && typeof out.body.atlas.receiptRefs === 'object');
    const canonical = new Map(out.body.atlas.canonicalNodes.map((node) => [node.nodeId, node]));
    assert.equal(canonical.has('hq.level.10'), false);
    for (const requiredNode of [
      'hq.level.1',
      'hq.level.5',
      'hq.level.6',
      'hq.upgrade.5',
      'hq.upgrade.6',
      'building.LUMBER_CAMP.place',
      'building.FARM_PLOT.place',
      'building.QUARRY.place',
      'building.EXPEDITION_BOARD.place',
      'production.EXPEDITION_BOARD.SCOUT',
      'production.EXPEDITION_BOARD.collect',
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
    assert.deepEqual(
      canonical.get('hq.upgrade.4').metadata.buildingPrerequisites.map((item) => [item.resource, item.requiredState, item.missing]),
      [['EXPEDITION_BOARD', 'READY', 1]]
    );
    assert.ok(out.body.atlas.canonicalEdges.find((edge) => (
      edge.kind === 'requires_building_prerequisite'
      && edge.from === 'building.EXPEDITION_BOARD.place'
      && edge.to === 'hq.upgrade.4'
    )));
    assert.equal(canonical.get('building.WORKSHOP.place').status, 'locked');
    assert.equal(canonical.get('building.EXPEDITION_BOARD.place').status, 'locked');
    assert.equal(canonical.get('building.MARKET_STALL.place').status, 'locked');
    assert.equal(canonical.get('permission.observeAndSuggest.unlock').status, 'done');
    assert.equal(canonical.get('permission.sellSurplusFood.unlock').status, 'locked');
    assert.equal(canonical.get('constraint.storage.wood').metadata.cap, 100);
    assert.equal(canonical.get('constraint.construction_slots').metadata.slots, 1);
    assert.equal(canonical.get('production.WORKSHOP.PRODUCE').metadata.input.wood, 8);
    assert.equal(canonical.get('production.WORKSHOP.PRODUCE').metadata.input.stone, 4);
    assert.equal(canonical.get('production.WORKSHOP.PRODUCE').metadata.output.wood, undefined);
    assert.equal(canonical.get('production.WORKSHOP.PRODUCE').metadata.buffPct, 20);
    assert.equal(canonical.get('production.EXPEDITION_BOARD.SCOUT').metadata.output.scout_report, 1);
    assert.equal(canonical.get('production.EXPEDITION_BOARD.SCOUT').metadata.input.food, 6);
    assert.equal(canonical.get('production.EXPEDITION_BOARD.SCOUT').metadata.input.wood, 4);
    assert.equal(canonical.get('production.MARKET_STALL.SELL').metadata.input.food, 6);
    assert.equal(canonical.get('production.MARKET_STALL.SELL').metadata.output.coin, 3);
    assert.equal(out.body.atlas.actionRefsByNode['building.LUMBER_CAMP.place'].tool, 'et.plot.place_building');
    assert.equal(out.body.atlas.actionRefsByNode['building.LUMBER_CAMP.place'].executableByAtlas, false);
    assert.equal(out.body.atlas.actionRefsByNode['building.LUMBER_CAMP.place'].executable, false);
    assert.equal(out.body.atlas.actionRefsByNode['production.MARKET_STALL.SELL'], undefined);
    assert.ok(out.body.atlas.canonicalEdges.find((edge) => edge.kind === 'unlocks_building' && edge.to === 'building.WORKSHOP.unlock'));
    assert.equal(out.body.atlas.openClawLiteSurface.generateIconDraft, 'agent_town_progression_generate_icon_draft');
    assert.equal(out.body.atlas.openClawLiteSurface.saveEditedStrategy, 'agent_town_progression_save_edited_strategy');
    assert.equal(out.body.atlas.futureHorizon.targetHqLevel, 10);
    assert.equal(out.body.atlas.futureHorizon.currentImplementedHqCap, 6);
    assert.equal(out.body.atlas.futureHorizon.gameplayMutationPolicy, 'advisory_only');
    assert.equal(out.body.atlas.futureHorizon.milestones.length, 4);
    assert.deepEqual(out.body.atlas.futureHorizon.milestones.map((node) => node.hqLevel), [7, 8, 9, 10]);
    assert.ok(out.body.atlas.futureHorizon.milestones.every((node) => node.gameplayTruth === 'future_placeholder'));
    assert.match(out.body.atlas.futureHorizon.milestones.find((node) => node.hqLevel === 10).summary, /civic\/world-grid/);

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

test('FP-HT-010b HQ upgrade endpoint blocks missing building prerequisites', async () => {
  const { server, close } = await fresh('hq-upgrade-building-prereq');
  try {
    let state = await reachHq(server, 3, 'hq-prereq');
    const plotId = state.plot.plotId;
    await ensureResource(server, plotId, 'LUMBER_CAMP', 'wood', 40, 'hq-prereq-hq4');
    await ensureResource(server, plotId, 'QUARRY', 'stone', 30, 'hq-prereq-hq4');
    await ensureResource(server, plotId, 'FARM_PLOT', 'food', 20, 'hq-prereq-hq4');
    await ensureTownXp(server, 90);
    state = await getGameState(server);
    const hq = findBuildingInState(state, 'HQ');
    const beforeInventory = state.plot.inventory;

    const blocked = await request(server, 'POST', '/api/founders-plot/upgrade-building', {
      plotId,
      buildingId: hq.buildingId,
      actor: 'HUMAN',
      idempotencyKey: `hq-prereq-blocked-${nowMs}`
    });
    assert.equal(blocked.status, 400);
    assert.equal(blocked.body.ok, false);
    assert.equal(blocked.body.error.code, 'MISSING_HQ_BUILDING_PREREQUISITES');
    assert.equal(blocked.body.error.retryable, false);
    assert.deepEqual(blocked.body.error.details.missingPrerequisites.map((entry) => entry.type), ['EXPEDITION_BOARD']);
    assert.deepEqual((await getGameState(server)).plot.inventory, beforeInventory);

    await ensureResource(server, plotId, 'LUMBER_CAMP', 'wood', 24, 'hq-prereq-board');
    await ensureResource(server, plotId, 'QUARRY', 'stone', 12, 'hq-prereq-board');
    await ensureResource(server, plotId, 'FARM_PLOT', 'food', 8, 'hq-prereq-board');
    await placeAndFinish(server, plotId, 'EXPEDITION_BOARD', 'hq-prereq-board');
    state = await getGameState(server);
    assert.equal(state.hqUpgrade.missingBuildingPrerequisites.length, 0);
    assert.equal(state.hqUpgrade.prerequisitesSatisfied, true);
  } finally { await close(); }
});

test('FP-HT-013 Expedition Board dispatches scout report receipts after HQ3', async () => {
  const { server, close } = await fresh('expedition-scout-report');
  try {
    let state = await reachHq(server, 3, 'expedition');
    const plotId = state.plot.plotId;
    assert.ok(state.unlockedBuildings.includes('EXPEDITION_BOARD'));
    assert.equal(state.buildingDefs.EXPEDITION_BOARD.unlockHqLevel, 3);
    assert.equal((state.scoutReports || []).length, 0);

    await ensureResource(server, plotId, 'LUMBER_CAMP', 'wood', 24, 'expedition-board');
    await ensureResource(server, plotId, 'QUARRY', 'stone', 12, 'expedition-board');
    await ensureResource(server, plotId, 'FARM_PLOT', 'food', 8, 'expedition-board');
    const board = await placeAndFinish(server, plotId, 'EXPEDITION_BOARD', 'expedition-board');
    assert.equal(board.state, 'READY');

    await ensureResource(server, plotId, 'LUMBER_CAMP', 'wood', 4, 'expedition-scout');
    await ensureResource(server, plotId, 'FARM_PLOT', 'food', 6, 'expedition-scout');
    const queued = await request(server, 'POST', '/api/founders-plot/queue-job', {
      plotId,
      buildingId: board.buildingId,
      kind: 'SCOUT',
      actor: 'HUMAN',
      idempotencyKey: `expedition-scout-queue-${nowMs}`
    });
    assert.equal(queued.status, 200, queued.body?.error?.message || 'queue scout');
    assert.equal(queued.body.ok, true);
    assert.equal(queued.body.job.kind, 'SCOUT');
    const runningScout = queued.body.state.visualActors.find((actor) => actor.canonicalRoleId === 'scout');
    assert.ok(runningScout, 'running scout projects a visual scout');
    assert.equal(runningScout.generatedOverlayRoleId, 'inhabitant.messenger');
    assert.equal(runningScout.actionKind, 'SCOUT');

    state = await advanceGame(server, 5);
    const readyBoard = findBuildingInState(state, 'EXPEDITION_BOARD');
    assert.equal(readyBoard.state, 'OUTPUT_READY');
    assert.equal(readyBoard.outputBuffer.scout_report, 1);
    assert.equal(readyBoard.outputBuffer.scoutReport.title, 'Forest Ridge Survey');
    const returningScout = state.visualActors.find((actor) => actor.canonicalRoleId === 'scout' && actor.actionKind === 'SCOUT_REPORT_READY');
    assert.ok(returningScout, 'ready scout report projects returning scout');

    const collected = await request(server, 'POST', '/api/founders-plot/collect-outputs', {
      plotId,
      buildingId: readyBoard.buildingId,
      actor: 'HUMAN',
      idempotencyKey: `expedition-scout-collect-${nowMs}`
    });
    assert.equal(collected.status, 200, collected.body?.error?.message || 'collect scout report');
    assert.equal(collected.body.ok, true);
    assert.equal(collected.body.collected.scout_report, 1);
    assert.equal(collected.body.collected.report.title, 'Forest Ridge Survey');
    assert.equal(collected.body.state.scoutReports.length, 1);
    const report = collected.body.state.scoutReports[0];
    assert.equal(report.reportId, 'scout_report_1_forest-ridge');
    assert.equal(report.originPlotId, plotId);
    assert.equal(report.risk, 'low');
    assert.equal(report.resourceHints.wood, 2);
    assert.equal('claimId' in report, false);
    assert.equal('claimedAt' in report, false);

    const persisted = await request(server, 'GET', '/api/founders-plot/state');
    assert.equal(persisted.status, 200);
    assert.equal(persisted.body.state.scoutReports.length, 1);
    assert.equal(persisted.body.state.publicSummary.scoutReportCount, 1);

    const atlas = await request(server, 'GET', '/api/founders-plot/progression-atlas');
    assert.equal(atlas.status, 200);
    const canonical = new Map(atlas.body.atlas.canonicalNodes.map((node) => [node.nodeId, node]));
    assert.equal(atlas.body.atlas.summary.scoutReportCount, 1);
    assert.equal(canonical.get('building.EXPEDITION_BOARD.place').status, 'done');
    assert.equal(canonical.get('production.EXPEDITION_BOARD.SCOUT').metadata.output.scout_report, 1);
	    assert.equal(canonical.get('production.EXPEDITION_BOARD.collect').metadata.scoutReportCount, 1);
	    assert.ok(canonical.has('receipt.scout_report.scout_report_1_forest_ridge'));
	    assert.equal(canonical.get('receipt.scout_report.scout_report_1_forest_ridge').metadata.report.title, 'Forest Ridge Survey');
	    assert.equal(canonical.get('planning.site_plan.scout_report_1_forest_ridge.draft').status, 'available');
	    assert.equal(canonical.get('planning.site_plan.scout_report_1_forest_ridge.draft').actionRef.tool, 'et.plot.draft_site_plan');
	    assert.deepEqual(atlas.body.atlas.receiptRefs['production.EXPEDITION_BOARD.collect'], ['receipt.scout_report.scout_report_1_forest_ridge']);

	    const drafted = await request(server, 'POST', '/api/founders-plot/draft-site-plan', {
	      plotId,
	      reportId: report.reportId,
	      title: 'Forest Ridge First Outpost',
	      focus: 'resource',
	      actor: 'HUMAN',
	      idempotencyKey: `draft-site-plan-${nowMs}`
	    });
	    assert.equal(drafted.status, 200, drafted.body?.error?.message || 'draft site plan');
	    assert.equal(drafted.body.ok, true);
	    assert.equal(drafted.body.sitePlan.reportId, report.reportId);
	    assert.equal(drafted.body.sitePlan.focus, 'resource');
	    assert.equal(drafted.body.sitePlan.status, 'DRAFT');
	    assert.equal(drafted.body.sitePlan.promotionStatus, 'draft');
	    assert.equal(drafted.body.sitePlan.authorityBoundary, 'requires_engine_promotion_for_settlement');
	    assert.equal('claimId' in drafted.body.sitePlan, false);
	    assert.equal('territoryId' in drafted.body.sitePlan, false);

	    const duplicate = await request(server, 'POST', '/api/founders-plot/draft-site-plan', {
	      plotId,
	      reportId: report.reportId,
	      title: 'Alternate Forest Ridge',
	      focus: 'trade',
	      actor: 'HUMAN',
	      idempotencyKey: `draft-site-plan-duplicate-${nowMs}`
	    });
	    assert.equal(duplicate.status, 200);
	    assert.equal(duplicate.body.ok, true);
	    assert.equal(duplicate.body.existing, true);
	    assert.equal(duplicate.body.sitePlan.planId, drafted.body.sitePlan.planId);
	    assert.equal(duplicate.body.sitePlan.focus, 'resource');

	    const afterPlan = await request(server, 'GET', '/api/founders-plot/state');
	    assert.equal(afterPlan.status, 200);
	    assert.equal(afterPlan.body.state.sitePlans.length, 1);
	    assert.equal(afterPlan.body.state.publicSummary.sitePlanCount, 1);
	    assert.equal(afterPlan.body.state.sitePlans[0].planId, 'site_plan_scout_report_1_forest_ridge');

	    const atlasAfterPlan = await request(server, 'GET', '/api/founders-plot/progression-atlas');
	    assert.equal(atlasAfterPlan.status, 200);
	    assert.equal(atlasAfterPlan.body.atlas.summary.sitePlanCount, 1);
	    const canonicalAfterPlan = new Map(atlasAfterPlan.body.atlas.canonicalNodes.map((node) => [node.nodeId, node]));
	    assert.equal(canonicalAfterPlan.get('planning.site_plan.scout_report_1_forest_ridge.draft').status, 'done');
	    assert.equal(canonicalAfterPlan.get('planning.site_plan.site_plan_scout_report_1_forest_ridge').metadata.plan.title, 'Forest Ridge First Outpost');
	    assert.equal(canonicalAfterPlan.get('planning.site_plan.site_plan_scout_report_1_forest_ridge').metadata.boundary, 'This is canonical planning state, not a second plot or territory claim.');
	    assert.equal(canonicalAfterPlan.get('planning.site_plan.site_plan_scout_report_1_forest_ridge.review').status, 'locked');
	    assert.equal(canonicalAfterPlan.get('planning.site_plan.site_plan_scout_report_1_forest_ridge.review').actionRef.tool, 'et.plot.review_site_plan');
	    assert.equal(canonicalAfterPlan.get('planning.site_plan.site_plan_scout_report_1_forest_ridge.review').actionRef.executableByAtlas, false);

	    const reviewBeforeHq6 = await request(server, 'POST', '/api/founders-plot/review-site-plan', {
	      plotId,
	      planId: drafted.body.sitePlan.planId,
	      reviewNote: 'Ready for claim review',
	      actor: 'HUMAN',
	      idempotencyKey: `review-site-plan-before-hq6-${nowMs}`
	    });
	    assert.equal(reviewBeforeHq6.status, 400);
	    assert.equal(reviewBeforeHq6.body.error.details.reason, 'hq_locked');

	    state = await reachHq(server, 6, 'settlement-charter');
	    assert.equal(state.plot.hqLevel, 6);
	    assert.equal(state.hqUpgrade, null);
	    assert.equal(state.plot.storageCaps.wood, 220);
	    assert.equal(state.plot.constructionSlots, 3);
	    const missingPlanReview = await request(server, 'POST', '/api/founders-plot/review-site-plan', {
	      plotId,
	      planId: 'site_plan_missing',
	      reviewNote: 'Bogus',
	      actor: 'HUMAN',
	      idempotencyKey: `review-site-plan-missing-${nowMs}`
	    });
	    assert.equal(missingPlanReview.status, 400);
	    assert.equal(missingPlanReview.body.error.details.reason, 'missing_site_plan');

	    const beforeReview = await request(server, 'GET', '/api/founders-plot/state');
	    const inventoryBeforeReview = beforeReview.body.state.plot.inventory;
	    const buildingCountBeforeReview = beforeReview.body.state.buildings.length;
	    const review = await request(server, 'POST', '/api/founders-plot/review-site-plan', {
	      plotId,
	      planId: drafted.body.sitePlan.planId,
	      reviewNote: 'Charter reviewed; wait for HQ7 claim mechanics.',
	      actor: 'HUMAN',
	      idempotencyKey: `review-site-plan-${nowMs}`
	    });
	    assert.equal(review.status, 200, review.body?.error?.message || 'review site plan');
	    assert.equal(review.body.ok, true);
	    assert.equal(review.body.existing, false);
	    assert.equal(review.body.sitePlan.status, 'REVIEWED');
	    assert.equal(review.body.sitePlan.reviewStatus, 'reviewed');
	    assert.equal(review.body.sitePlan.promotionStatus, 'reviewed_claim_ready');
	    assert.equal(review.body.sitePlan.authorityBoundary, 'claim_ready_planning_only_no_territory');
	    assert.equal(review.body.sitePlan.reviewNote, 'Charter reviewed; wait for HQ7 claim mechanics.');
	    assert.equal('claimId' in review.body.sitePlan, false);
	    assert.equal('territoryId' in review.body.sitePlan, false);
	    assert.equal('routeId' in review.body.sitePlan, false);
	    assert.equal('convoyId' in review.body.sitePlan, false);
	    assert.deepEqual(review.body.state.plot.inventory, inventoryBeforeReview);
	    assert.equal(review.body.state.buildings.length, buildingCountBeforeReview);

	    const reviewRepeat = await request(server, 'POST', '/api/founders-plot/review-site-plan', {
	      plotId,
	      planId: drafted.body.sitePlan.planId,
	      reviewNote: 'Charter reviewed; wait for HQ7 claim mechanics.',
	      actor: 'HUMAN',
	      idempotencyKey: `review-site-plan-${nowMs}`
	    });
	    assert.equal(reviewRepeat.status, 200);
	    assert.equal(reviewRepeat.body.sitePlan.reviewedAt, review.body.sitePlan.reviewedAt);
	    const reviewConflict = await request(server, 'POST', '/api/founders-plot/review-site-plan', {
	      plotId,
	      planId: drafted.body.sitePlan.planId,
	      reviewNote: 'Different note same key',
	      actor: 'HUMAN',
	      idempotencyKey: `review-site-plan-${nowMs}`
	    });
	    assert.equal(reviewConflict.status, 409);
	    assert.equal(reviewConflict.body.error.code, 'IDEMPOTENCY_CONFLICT');
	    const duplicateReview = await request(server, 'POST', '/api/founders-plot/review-site-plan', {
	      plotId,
	      planId: drafted.body.sitePlan.planId,
	      reviewNote: 'New key after review should not rewrite the note',
	      actor: 'HUMAN',
	      idempotencyKey: `review-site-plan-duplicate-${nowMs}`
	    });
	    assert.equal(duplicateReview.status, 200);
	    assert.equal(duplicateReview.body.existing, true);
	    assert.equal(duplicateReview.body.sitePlan.reviewNote, review.body.sitePlan.reviewNote);

	    const persistedReview = await request(server, 'GET', '/api/founders-plot/state');
	    assert.equal(persistedReview.body.state.sitePlans[0].reviewStatus, 'reviewed');
	    assert.equal(persistedReview.body.state.sitePlans[0].promotionStatus, 'reviewed_claim_ready');
	    const atlasAfterReview = await request(server, 'GET', '/api/founders-plot/progression-atlas');
	    assert.equal(atlasAfterReview.status, 200);
	    assert.equal(atlasAfterReview.body.atlas.summary.reviewedSitePlanCount, 1);
	    const canonicalAfterReview = new Map(atlasAfterReview.body.atlas.canonicalNodes.map((node) => [node.nodeId, node]));
	    const reviewNode = canonicalAfterReview.get('planning.site_plan.site_plan_scout_report_1_forest_ridge.review');
	    assert.equal(reviewNode.status, 'done');
	    assert.equal(reviewNode.metadata.plan.reviewStatus, 'reviewed');
	    assert.equal(reviewNode.metadata.boundary, 'HQ6 review is engine-owned claim-ready planning state only; it cannot create territory, routes, convoys, resources, or a second plot.');
	    assert.equal(atlasAfterReview.body.atlas.actionRefsByNode['planning.site_plan.site_plan_scout_report_1_forest_ridge.review'], undefined);
	    const repeatAtlas = await request(server, 'GET', '/api/founders-plot/progression-atlas');
	    assert.equal(repeatAtlas.status, 200);
	    assert.equal(repeatAtlas.body.gameplayStableHash, atlasAfterReview.body.gameplayStableHash);
	    assert.equal(repeatAtlas.body.gameplaySnapshot.audit.eventCount, atlasAfterReview.body.gameplaySnapshot.audit.eventCount);

	    await ensureResource(server, plotId, 'LUMBER_CAMP', 'wood', 32, 'settler-convoy');
	    await ensureResource(server, plotId, 'QUARRY', 'stone', 12, 'settler-convoy');
	    await ensureResource(server, plotId, 'FARM_PLOT', 'food', 20, 'settler-convoy');
	    await ensureResource(server, plotId, 'MARKET_STALL', 'coin', 8, 'settler-convoy');
	    await ensureResource(server, plotId, 'FARM_PLOT', 'food', 20, 'settler-convoy');
	    const plotsBefore = await request(server, 'GET', '/api/founders-plot/plots');
	    assert.equal(plotsBefore.status, 200);
	    assert.equal(plotsBefore.body.ok, true);
	    assert.equal(plotsBefore.body.plots.length, 1);
	    assert.equal(plotsBefore.body.plots[0].role, 'HOME');
	    const beforeConvoy = await request(server, 'GET', '/api/founders-plot/state');
	    const prepare = await request(server, 'POST', '/api/founders-plot/prepare-settler-convoy', {
	      plotId,
	      sitePlanId: drafted.body.sitePlan.planId,
	      actor: 'HUMAN',
	      idempotencyKey: `prepare-settler-convoy-${nowMs}`
	    });
	    assert.equal(prepare.status, 200, prepare.body?.error?.message || 'prepare settler convoy');
	    assert.equal(prepare.body.ok, true);
	    assert.equal(prepare.body.existing, false);
	    assert.equal(prepare.body.settlementClaim.status, 'CONVOY_PREPARING');
	    assert.equal(prepare.body.job.kind, 'SETTLER_CONVOY');
	    assert.deepEqual(prepare.body.settlementClaim.cost, { wood: 32, food: 20, stone: 12, coin: 8 });
	    assert.equal(prepare.body.state.plot.inventory.wood, beforeConvoy.body.state.plot.inventory.wood - 32);
	    assert.equal(prepare.body.state.settlementClaims.length, 1);
	    assert.equal(prepare.body.state.sitePlans[0].claimId, prepare.body.settlementClaim.claimId);
	    const settlerActor = prepare.body.state.visualActors.find((actor) => actor.canonicalRoleId === 'settler');
	    assert.ok(settlerActor, 'active convoy projects a settler actor');
	    assert.equal(settlerActor.visualOnly, true);
	    assert.equal(settlerActor.sourceDomain, 'settlement_claim');
	    const duplicatePrepare = await request(server, 'POST', '/api/founders-plot/prepare-settler-convoy', {
	      plotId,
	      sitePlanId: drafted.body.sitePlan.planId,
	      actor: 'HUMAN',
	      idempotencyKey: `prepare-settler-convoy-duplicate-${nowMs}`
	    });
	    assert.equal(duplicatePrepare.status, 200);
	    assert.equal(duplicatePrepare.body.existing, true);
	    assert.equal(duplicatePrepare.body.settlementClaim.claimId, prepare.body.settlementClaim.claimId);
	    const foundTooSoon = await request(server, 'POST', '/api/founders-plot/found-settlement', {
	      plotId,
	      claimId: prepare.body.settlementClaim.claimId,
	      actor: 'HUMAN',
	      idempotencyKey: `found-settlement-too-soon-${nowMs}`
	    });
	    assert.equal(foundTooSoon.status, 400);
	    assert.equal(foundTooSoon.body.error.details.reason, 'convoy_not_arrived');
	    state = await advanceGame(server, 5);
	    assert.equal(state.settlementClaims[0].status, 'CONVOY_ARRIVED');
	    const found = await request(server, 'POST', '/api/founders-plot/found-settlement', {
	      plotId,
	      claimId: prepare.body.settlementClaim.claimId,
	      actor: 'HUMAN',
	      idempotencyKey: `found-settlement-${nowMs}`
	    });
	    assert.equal(found.status, 200, found.body?.error?.message || 'found settlement');
	    assert.equal(found.body.ok, true);
	    assert.equal(found.body.settlementClaim.status, 'FOUNDED');
	    assert.ok(found.body.foundedPlot.plotId);
	    assert.ok(found.body.ownedPlots.some((plot) => plot.role === 'OUTPOST' && plot.plotId === found.body.foundedPlot.plotId));
	    const outpost = await request(server, 'GET', `/api/founders-plot/state?plotId=${found.body.foundedPlot.plotId}`);
	    assert.equal(outpost.status, 200);
	    assert.equal(outpost.body.ok, true);
	    assert.equal(outpost.body.state.plot.hqLevel, 1);
	    assert.equal(outpost.body.state.buildings.find((building) => building.type === 'HQ')?.state, 'READY');
	    assert.equal(outpost.body.state.activePlotId, found.body.foundedPlot.plotId);
	    const atlasAfterFounding = await request(server, 'GET', '/api/founders-plot/progression-atlas');
	    assert.equal(atlasAfterFounding.status, 200);
	    assert.equal(atlasAfterFounding.body.atlas.summary.settlementClaimCount, 1);
	    assert.equal(atlasAfterFounding.body.atlas.summary.outpostCount, 1);
	    const canonicalAfterFounding = new Map(atlasAfterFounding.body.atlas.canonicalNodes.map((node) => [node.nodeId, node]));
	    assert.ok(canonicalAfterFounding.has(`plot.outpost.${found.body.foundedPlot.plotId.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').toLowerCase()}`));
	    assert.equal(atlasAfterFounding.body.atlas.actionRefsByNode[`settlement.claim.${prepare.body.settlementClaim.claimId.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').toLowerCase()}.found`], undefined);
	  } finally { await close(); }
	});

test('FP-HT-011 HQ8B Research Lodge doctrine is server-owned, operational, and Atlas-backed', async () => {
  const { server, close } = await fresh('research-doctrine');
  try {
    const initial = await getGameState(server);
    const locked = await request(server, 'POST', '/api/founders-plot/select-doctrine', {
      plotId: initial.plot.plotId,
      doctrineId: 'survey_discipline',
      actor: 'HUMAN',
      idempotencyKey: 'ht-11-locked'
    });
    assert.equal(locked.status, 400);
    assert.equal(locked.body.error.details.reason, 'hq_locked');

    const seeded = await seedResearchReadyPlot(server, 'research_doctrine');
    const ready = await request(server, 'GET', '/api/founders-plot/state');
    assert.equal(ready.status, 200);
    assert.equal(ready.body.state.research.lodge.status, 'OPERATIONAL_READY');
    assert.equal(ready.body.state.doctrineCatalog[0].doctrineId, 'survey_discipline');
    assert.equal(ready.body.state.doctrineCatalog[0].gameplayBuff, true);
    assert.equal(ready.body.state.doctrineCatalog[0].engineOwnedEffect, true);
    assert.equal(ready.body.state.doctrineCatalog[0].effectKind, 'scout_duration_modifier');
    assert.equal(ready.body.state.doctrineCatalog[0].effectValue.durationMultiplier, 0.95);
    assert.equal(ready.body.state.doctrineState.status, 'NONE');
    assert.deepEqual(ready.body.state.research.activeEffects, []);

    const atlasBefore = await request(server, 'GET', '/api/founders-plot/progression-atlas');
    assert.equal(atlasBefore.status, 200);
    const canonicalBefore = new Map(atlasBefore.body.atlas.canonicalNodes.map((node) => [node.nodeId, node]));
    assert.equal(canonicalBefore.get('research_lodge.advisory_stance').status, 'available');
    assert.equal(canonicalBefore.get('doctrine.survey_discipline').status, 'available');
    assert.equal(canonicalBefore.get('doctrine.survey_discipline').metadata.doctrine.effectKind, 'scout_duration_modifier');
    assert.equal(canonicalBefore.get('doctrine.survey_discipline').metadata.doctrine.gameplayBuff, true);
    assert.equal(canonicalBefore.get('production.EXPEDITION_BOARD.SCOUT').metadata.durationMs, 90_000);
    assert.equal(canonicalBefore.get('production.EXPEDITION_BOARD.SCOUT').metadata.baseDurationMs, 90_000);
    assert.equal(canonicalBefore.get('production.EXPEDITION_BOARD.SCOUT').metadata.doctrineEffect, null);
    assert.equal(atlasBefore.body.atlas.actionRefsByNode['doctrine.survey_discipline'].tool, 'et.plot.select_doctrine');
    assert.equal(atlasBefore.body.atlas.actionRefsByNode['doctrine.survey_discipline'].executableByAtlas, false);

    const unknown = await request(server, 'POST', '/api/founders-plot/select-doctrine', {
      plotId: seeded.plotId,
      doctrineId: 'atlas_invented_buff',
      actor: 'HUMAN',
      idempotencyKey: 'ht-11-unknown'
    });
    assert.equal(unknown.status, 400);
    assert.equal(unknown.body.error.code, 'UNKNOWN_DOCTRINE');

    const inventoryBefore = ready.body.state.plot.inventory;
    const selected = await request(server, 'POST', '/api/founders-plot/select-doctrine', {
      plotId: seeded.plotId,
      doctrineId: 'survey_discipline',
      actor: 'HUMAN',
      idempotencyKey: 'ht-11-select'
    });
    assert.equal(selected.status, 200, selected.body?.error?.message || 'select doctrine');
    assert.equal(selected.body.ok, true);
    assert.equal(selected.body.existing, false);
    assert.equal(selected.body.doctrineState.selectedDoctrineId, 'survey_discipline');
    assert.equal(selected.body.doctrine.effectKind, 'scout_duration_modifier');
    assert.equal(selected.body.doctrine.effectValue.durationMultiplier, 0.95);
    assert.equal(selected.body.state.research.activeEffects[0].doctrineId, 'survey_discipline');
    assert.equal(selected.body.state.research.activeEffects[0].durationMultiplier, 0.95);
    assert.deepEqual(selected.body.state.plot.inventory, inventoryBefore);
    assert.equal(selected.body.worldDelta.some((entry) => entry.type === 'DOCTRINE_SELECTED'), true);

    const repeat = await request(server, 'POST', '/api/founders-plot/select-doctrine', {
      plotId: seeded.plotId,
      doctrineId: 'survey_discipline',
      actor: 'HUMAN',
      idempotencyKey: 'ht-11-select'
    });
    assert.equal(repeat.status, 200);
    assert.equal(repeat.body.doctrineState.selectedAt, selected.body.doctrineState.selectedAt);

    const conflict = await request(server, 'POST', '/api/founders-plot/select-doctrine', {
      plotId: seeded.plotId,
      doctrineId: 'survey_discipline',
      actor: 'AGENT',
      idempotencyKey: 'ht-11-select'
    });
    assert.equal(conflict.status, 409);
    assert.equal(conflict.body.error.code, 'IDEMPOTENCY_CONFLICT');

    const atlasAfter = await request(server, 'GET', '/api/founders-plot/progression-atlas');
    assert.equal(atlasAfter.status, 200);
    assert.equal(atlasAfter.body.atlas.summary.selectedDoctrineId, 'survey_discipline');
    assert.equal(atlasAfter.body.atlas.summary.doctrineAdvisoryOnly, false);
    assert.equal(atlasAfter.body.atlas.summary.doctrineEngineOwnedEffect, true);
    assert.equal(atlasAfter.body.gameplaySnapshot.plot.doctrineState.selectedDoctrineId, 'survey_discipline');
    assert.deepEqual(atlasAfter.body.gameplaySnapshot.plot.inventory, inventoryBefore);
    const canonicalAfter = new Map(atlasAfter.body.atlas.canonicalNodes.map((node) => [node.nodeId, node]));
    assert.equal(canonicalAfter.get('doctrine.survey_discipline').status, 'done');
    assert.equal(canonicalAfter.get('production.EXPEDITION_BOARD.SCOUT').metadata.baseDurationMs, 90_000);
    assert.equal(canonicalAfter.get('production.EXPEDITION_BOARD.SCOUT').metadata.durationMs, 85_500);
    assert.equal(canonicalAfter.get('production.EXPEDITION_BOARD.SCOUT').metadata.doctrineEffect.doctrineId, 'survey_discipline');
    assert.equal(canonicalAfter.get('production.EXPEDITION_BOARD.SCOUT').availability.doctrineEffect.durationMultiplier, 0.95);
    assert.ok(atlasAfter.body.atlas.canonicalEdges.find((edge) => edge.from === 'doctrine.survey_discipline' && edge.to === 'production.EXPEDITION_BOARD.SCOUT' && edge.kind === 'modifies_duration'));
    assert.equal(atlasAfter.body.atlas.actionRefsByNode['doctrine.survey_discipline'], undefined);
  } finally { await close(); }
});

test('FP-HT-011b HQ9B cohort work-order planner creates explicit executable drafts only', async () => {
  const { server, close } = await fresh('cohort-work-order');
  try {
    const initial = await getGameState(server);
    const locked = await request(server, 'POST', '/api/founders-plot/work-orders/draft', {
      plotId: initial.plot.plotId,
      templateId: 'collect_ready_outputs_once',
      scope: {},
      actor: 'AGENT',
      idempotencyKey: 'ht-11b-locked'
    });
    assert.equal(locked.status, 400);
    assert.ok((locked.body.error.details.blockedBy || []).includes('hq.level.6'));

    const seeded = await seedResearchReadyPlot(server, 'cohort_work_order');
    const stillLocked = await request(server, 'POST', '/api/founders-plot/work-orders/draft', {
      plotId: seeded.plotId,
      templateId: 'collect_ready_outputs_once',
      scope: {},
      actor: 'AGENT',
      idempotencyKey: 'ht-11b-before-doctrine'
    });
    assert.equal(stillLocked.status, 400);
    assert.ok((stillLocked.body.error.details.blockedBy || []).includes('doctrine.survey_discipline.selected'));

    const selected = await request(server, 'POST', '/api/founders-plot/select-doctrine', {
      plotId: seeded.plotId,
      doctrineId: 'survey_discipline',
      actor: 'HUMAN',
      idempotencyKey: 'ht-11b-select'
    });
    assert.equal(selected.status, 200, selected.body?.error?.message || 'select doctrine');
    const inventoryBefore = selected.body.state.plot.inventory;
    const eventCountBefore = selected.body.state.audit.eventCount;

    const ready = await request(server, 'GET', '/api/founders-plot/state');
    assert.equal(ready.status, 200);
    assert.equal(ready.body.state.cohortPlanner.status, 'DRAFTING_READY');
    assert.equal(ready.body.state.cohortPlanner.executionAvailable, true);
    assert.equal(ready.body.state.workOrderTemplates[0].templateId, 'collect_ready_outputs_once');
    assert.equal(ready.body.state.workOrderTemplates[0].availability.unlocked, true);

    const draft = await request(server, 'POST', '/api/founders-plot/work-orders/draft', {
      plotId: seeded.plotId,
      templateId: 'collect_ready_outputs_once',
      scope: {},
      actor: 'AGENT',
      idempotencyKey: 'ht-11b-draft'
    });
    assert.equal(draft.status, 200, draft.body?.error?.message || 'draft work order');
    assert.equal(draft.body.ok, true);
    assert.equal(draft.body.executionAvailable, true);
    assert.equal(draft.body.workOrder.status, 'DRAFT');
    assert.equal(draft.body.workOrder.templateId, 'collect_ready_outputs_once');
    assert.deepEqual(draft.body.workOrder.allowedActions, ['et.plot.collect_outputs']);
    assert.equal(draft.body.workOrder.caps.maxChildActions, 2);
    assert.equal(draft.body.workOrder.scope.mode, 'all_ready_outputs');
    assert.deepEqual(draft.body.workOrder.childReceipts, []);
    assert.deepEqual(draft.body.state.plot.inventory, inventoryBefore);
    assert.equal(draft.body.state.workOrders.length, 1);
    assert.equal(draft.body.state.publicSummary.workOrderDraftCount, 1);
    assert.equal(draft.body.state.audit.eventCount, eventCountBefore + 1);
    assert.equal(draft.body.worldDelta.some((entry) => entry.type === 'WORK_ORDER_DRAFTED'), true);

    const repeat = await request(server, 'POST', '/api/founders-plot/work-orders/draft', {
      plotId: seeded.plotId,
      templateId: 'collect_ready_outputs_once',
      scope: {},
      actor: 'AGENT',
      idempotencyKey: 'ht-11b-draft'
    });
    assert.equal(repeat.status, 200);
    assert.equal(repeat.body.workOrder.workOrderId, draft.body.workOrder.workOrderId);

    const conflict = await request(server, 'POST', '/api/founders-plot/work-orders/draft', {
      plotId: seeded.plotId,
      templateId: 'invented_executor',
      scope: {},
      actor: 'AGENT',
      idempotencyKey: 'ht-11b-draft'
    });
    assert.equal(conflict.status, 409);
    assert.equal(conflict.body.error.code, 'IDEMPOTENCY_CONFLICT');

    const atlas = await request(server, 'GET', '/api/founders-plot/progression-atlas');
    assert.equal(atlas.status, 200);
    assert.equal(atlas.body.atlas.summary.workOrderDraftCount, 1);
    assert.equal(atlas.body.atlas.summary.workOrderExecutionAvailable, true);
    const canonical = new Map(atlas.body.atlas.canonicalNodes.map((node) => [node.nodeId, node]));
    assert.equal(canonical.get('cohort.work_order_planner').status, 'available');
    assert.equal(canonical.get('work_order.template.collect_ready_outputs_once').status, 'available');
    assert.equal(atlas.body.atlas.actionRefsByNode['work_order.template.collect_ready_outputs_once'].tool, 'et.plot.create_work_order_draft');
    assert.equal(atlas.body.atlas.actionRefsByNode['work_order.template.collect_ready_outputs_once'].executableByAtlas, false);
    const orderNodeId = [...canonical.keys()].find((nodeId) => nodeId.startsWith('work_order.work_order_'));
    assert.ok(orderNodeId);
    assert.equal(atlas.body.atlas.actionRefsByNode[orderNodeId].tool, 'et.plot.execute_work_order');
    assert.equal(atlas.body.atlas.actionRefsByNode[orderNodeId].executableByAtlas, false);
  } finally { await close(); }
});

test('FP-HT-011c HQ9B work-order executor collects max two ready outputs with receipts and no overreach', async () => {
  const { server, close } = await fresh('cohort-work-order-execute');
  try {
    const seeded = await seedResearchReadyPlot(server, 'cohort_work_order_execute');
    const selected = await request(server, 'POST', '/api/founders-plot/select-doctrine', {
      plotId: seeded.plotId,
      doctrineId: 'survey_discipline',
      actor: 'HUMAN',
      idempotencyKey: 'ht-11c-select'
    });
    assert.equal(selected.status, 200, selected.body?.error?.message || 'select doctrine');
    const readyBuildings = seedReadyOutputBuildings(seeded.plotId, 'ht11c', 3);
    const before = await request(server, 'GET', '/api/founders-plot/state');
    const inventoryBefore = before.body.state.plot.inventory;
    const draft = await request(server, 'POST', '/api/founders-plot/work-orders/draft', {
      plotId: seeded.plotId,
      templateId: 'collect_ready_outputs_once',
      scope: {},
      actor: 'HUMAN',
      idempotencyKey: 'ht-11c-draft'
    });
    assert.equal(draft.status, 200, draft.body?.error?.message || 'draft');
    const executed = await request(server, 'POST', '/api/founders-plot/work-orders/execute', {
      plotId: seeded.plotId,
      workOrderId: draft.body.workOrder.workOrderId,
      actor: 'HUMAN',
      idempotencyKey: 'ht-11c-execute'
    });
    assert.equal(executed.status, 200, executed.body?.error?.message || 'execute');
    assert.equal(executed.body.ok, true);
    assert.equal(executed.body.executedChildCount, 2);
    assert.equal(executed.body.workOrder.status, 'COMPLETED');
    assert.equal(executed.body.workOrder.childReceipts.length, 2);
    assert.ok(executed.body.workOrder.childReceipts.every((receipt) => receipt.parentWorkOrderId === draft.body.workOrder.workOrderId));
    assert.ok(executed.body.workOrder.childReceipts.every((receipt) => receipt.childAction === 'et.plot.collect_outputs'));
    assert.ok(executed.body.workOrder.childReceipts.every((receipt) => receipt.childIdempotencyKey.includes('ht-11c-execute:child:')));
    assert.equal(executed.body.state.plot.inventory.food, inventoryBefore.food + 9);
    assert.equal(executed.body.state.plot.inventory.wood, inventoryBefore.wood + 12);
    assert.equal(executed.body.state.plot.inventory.stone, inventoryBefore.stone);
    assert.equal(executed.body.state.settlementClaims.length, before.body.state.settlementClaims.length);
    assert.equal(executed.body.state.buildings.find((building) => building.buildingId === readyBuildings[2].buildingId).state, 'OUTPUT_READY');
    assert.equal(executed.body.worldDelta.some((entry) => entry.type === 'WORK_ORDER_EXECUTED'), true);

    const repeat = await request(server, 'POST', '/api/founders-plot/work-orders/execute', {
      plotId: seeded.plotId,
      workOrderId: draft.body.workOrder.workOrderId,
      actor: 'HUMAN',
      idempotencyKey: 'ht-11c-execute'
    });
    assert.equal(repeat.status, 200);
    assert.equal(repeat.body.stateHash, executed.body.stateHash);

    const second = await request(server, 'POST', '/api/founders-plot/work-orders/execute', {
      plotId: seeded.plotId,
      workOrderId: draft.body.workOrder.workOrderId,
      actor: 'HUMAN',
      idempotencyKey: 'ht-11c-second'
    });
    assert.equal(second.status, 400);
    assert.equal(second.body.error.code, 'INVALID_STATE');
  } finally { await close(); }
});

test('FP-HT-011d HQ10A World Grid read model is read-only and Atlas-backed', async () => {
  const { server, close } = await fresh('world-grid-read-model');
  try {
    const locked = await request(server, 'GET', '/api/founders-plot/world-grid');
    assert.equal(locked.status, 200);
    assert.equal(locked.body.ok, true);
    assert.deepEqual(locked.body.worldDelta, []);
    assert.equal(locked.body.worldGrid.status, 'LOCKED');
    assert.equal(locked.body.worldGrid.readOnly, true);
    assert.deepEqual(locked.body.worldGrid.executableActions, []);
    assert.ok(locked.body.worldGrid.requirements.blockedBy.includes('hq.level.6'));

    const seeded = await seedResearchReadyPlot(server, 'world_grid');
    const selected = await request(server, 'POST', '/api/founders-plot/select-doctrine', {
      plotId: seeded.plotId,
      doctrineId: 'survey_discipline',
      actor: 'HUMAN',
      idempotencyKey: 'ht-11d-select'
    });
    assert.equal(selected.status, 200, selected.body?.error?.message || 'select doctrine');
    const draft = await request(server, 'POST', '/api/founders-plot/work-orders/draft', {
      plotId: seeded.plotId,
      templateId: 'collect_ready_outputs_once',
      scope: {},
      actor: 'HUMAN',
      idempotencyKey: 'ht-11d-draft'
    });
    assert.equal(draft.status, 200, draft.body?.error?.message || 'draft work order');

    const before = await request(server, 'GET', '/api/founders-plot/state');
    const world = await request(server, 'GET', `/api/founders-plot/world-grid?plotId=${encodeURIComponent(seeded.plotId)}`);
    assert.equal(world.status, 200);
    assert.equal(world.body.ok, true);
    assert.deepEqual(world.body.worldDelta, []);
    assert.equal(world.body.worldGrid.status, 'READ_MODEL_READY');
    assert.equal(world.body.worldGrid.civicReadiness.ready, true);
    assert.equal(world.body.worldGrid.civicReadiness.nextPromotableSlice, 'HQ10B_CIVIC_PROPOSAL_RECORDS');
    assert.equal(world.body.worldGrid.scope.outpostCount, 1);
    assert.equal(world.body.worldGrid.doctrine.selectedDoctrineId, 'survey_discipline');
    assert.equal(world.body.worldGrid.workOrders.draftCount, 1);
    assert.equal(world.body.worldGrid.workOrders.executionAvailable, true);
    assert.ok(world.body.worldGrid.civicReadiness.prohibitedCapabilities.includes('civic_mutation'));
    const after = await request(server, 'GET', '/api/founders-plot/state');
    assert.equal(after.body.state.audit.eventCount, before.body.state.audit.eventCount);
    assert.equal(after.body.state.publicSummary.worldGridReady, true);

    const atlas = await request(server, 'GET', '/api/founders-plot/progression-atlas');
    assert.equal(atlas.status, 200);
    assert.equal(atlas.body.atlas.summary.worldGridReady, true);
    assert.equal(atlas.body.atlas.summary.worldGridStatus, 'READ_MODEL_READY');
    const canonical = new Map(atlas.body.atlas.canonicalNodes.map((node) => [node.nodeId, node]));
    assert.equal(canonical.get('world_grid.read_model').status, 'available');
    assert.equal(canonical.get('world_grid.read_model').metadata.worldGrid.readOnly, true);
    assert.equal(canonical.get('world_grid.civic_readiness').status, 'waiting');
    assert.equal(atlas.body.atlas.actionRefsByNode['world_grid.read_model'], undefined);
    assert.equal(atlas.body.atlas.actionRefsByNode['world_grid.civic_readiness'], undefined);
    assert.ok(atlas.body.atlas.canonicalEdges.find((edge) => (
      edge.from === 'cohort.work_order_planner'
      && edge.to === 'world_grid.read_model'
      && edge.kind === 'enables_world_grid_projection'
    )));
  } finally { await close(); }
});

test('FP-HT-011d2 HQ12A Expedition Map route returns read-only fog cells', async () => {
  const { server, close } = await fresh('expedition-map');
  try {
    const locked = await request(server, 'GET', '/api/founders-plot/expedition-map');
    assert.equal(locked.status, 200);
    assert.equal(locked.body.ok, true);
    assert.deepEqual(locked.body.worldDelta, []);
    assert.equal(locked.body.expeditionMap.status, 'ORIGIN_ONLY');
    assert.equal(locked.body.expeditionMap.readOnly, true);
    assert.deepEqual(locked.body.expeditionMap.executableActions, []);
    assert.equal(locked.body.expeditionMap.surveyBridge.status, 'WAITING_FOR_SCOUT_PACKET');
    assert.equal(locked.body.expeditionMap.surveyBridge.readOnly, true);
    assert.deepEqual(locked.body.expeditionMap.surveyBridge.executableActions, []);

    const seeded = await seedResearchReadyPlot(server, 'expedition_map');
    const bundle = store.readPlotBundleById(seeded.plotId);
    bundle.plot.scoutReports = [{
      reportId: 'scout_report_http_river',
      originPlotId: seeded.plotId,
      sourceBuildingId: 'bldg_http_expedition',
      title: 'HTTP River Flat Survey',
      siteType: 'river_flat',
      risk: 'medium',
      traits: ['food-rich'],
      resourceHints: { food: 2 },
      summary: 'A known frontier cell for the HTTP route.',
      recommendedNext: 'Render only after a later UI slice.',
      sequence: 1,
      createdAt: nowMs
    }];
    bundle.plot.sitePlans = [{
      planId: 'site_plan_http_river',
      reportId: 'scout_report_http_river',
      originPlotId: seeded.plotId,
      title: 'HTTP River Plan',
      focus: 'balanced',
      status: 'REVIEWED',
      promotionStatus: 'reviewed_claim_ready',
      reviewStatus: 'reviewed',
      source: 'scout_report',
      authorityBoundary: 'claim_ready_planning_only_no_territory',
      siteType: 'river_flat',
      risk: 'medium',
      traits: ['food-rich'],
      resourceHints: { food: 2 },
      summary: 'Reviewed planning truth, not a route or settlement.',
      recommendedNext: 'Stay read-only.',
      reviewedAt: nowMs,
      reviewNote: 'Read-only map proof.',
      sequence: 1,
      createdAt: nowMs
    }];
    store.writePlot(bundle.plot);

    const before = await request(server, 'GET', `/api/founders-plot/state?plotId=${encodeURIComponent(seeded.plotId)}`);
    const map = await request(server, 'GET', `/api/founders-plot/expedition-map?plotId=${encodeURIComponent(seeded.plotId)}`);
    assert.equal(map.status, 200);
    assert.equal(map.body.ok, true);
    assert.deepEqual(map.body.worldDelta, []);
    assert.equal(map.body.expeditionMap.status, 'FOG_READ_MODEL_READY');
    assert.equal(map.body.expeditionMap.readOnly, true);
    assert.equal(map.body.expeditionMap.expeditionParty.partyId, 'expedition_party_current_plot_v1');
    assert.equal(map.body.expeditionMap.expeditionParty.readOnly, true);
    assert.deepEqual(map.body.expeditionMap.expeditionParty.executableActions, []);
    assert.deepEqual(map.body.expeditionMap.expeditionParty.members.map((member) => member.displayName), [
      'Mira Trailmark',
      'Rook Signalpost',
      'Vale-Desk 7'
    ]);
    assert.equal(map.body.expeditionMap.expeditionParty.boundaryFlags.operatorAssignment, false);
    assert.equal(map.body.expeditionMap.expeditionParty.boundaryFlags.autonomousMovement, false);
    assert.equal(map.body.expeditionMap.expeditionParty.boundaryFlags.externalEffects, false);
    assert.equal(map.body.expeditionMap.receipt.readOnly, true);
    assert.equal(map.body.expeditionMap.receipt.routeCreation, false);
    assert.equal(map.body.expeditionMap.receipt.atlasExecution, false);
    assert.equal(map.body.expeditionMap.surveyBridge.readOnly, true);
    assert.deepEqual(map.body.expeditionMap.surveyBridge.executableActions, []);
    assert.equal(map.body.expeditionMap.surveyBridge.status, 'WAITING_FOR_SCOUT_PACKET');
    assert.equal(map.body.expeditionMap.surveyBridge.boundaryFlags.addsMutationAuthority, false);
    assert.ok(map.body.expeditionMap.fog.counts.discovered >= 2);
    assert.ok(map.body.expeditionMap.fog.counts.known >= 1);
    assert.ok(map.body.expeditionMap.fog.counts.hinted >= 1);
    assert.ok(map.body.expeditionMap.fog.counts.locked_unknown >= 1);
    assert.ok(map.body.expeditionMap.cells.some((cell) => cell.fogState === 'hinted'));
    assert.ok(map.body.expeditionMap.cells.some((cell) => cell.fogState === 'locked_unknown'));
    assert.equal(map.body.expeditionMap.cells.every((cell) => cell.terrainAssetContractVersion === engine.EXPEDITION_PUBLIC_TERRAIN_ASSET_CONTRACT_VERSION), true);
    assert.equal(map.body.expeditionMap.cells
      .filter((cell) => ['discovered', 'known'].includes(cell.fogState))
      .every((cell) => engine.EXPEDITION_PUBLIC_TERRAIN_ASSET_SLOTS.includes(cell.publicTerrainAssetSlot)), true);
    assert.equal(map.body.expeditionMap.cells
      .filter((cell) => ['hinted', 'locked_unknown'].includes(cell.fogState))
      .every((cell) => cell.publicTerrainAssetSlot == null && ['hinted_frontier_fog', 'locked_unknown_fog'].includes(cell.fogAssetSlot)), true);
    assert.equal(map.body.expeditionMap.cells
      .filter((cell) => /river|water|coast/i.test(`${cell.siteType || ''} ${(cell.traits || []).join(' ')}`))
      .every((cell) => cell.publicTerrainAssetSlot !== 'water' && cell.publicTerrainAssetSlot !== 'coast'), true);

    const after = await request(server, 'GET', `/api/founders-plot/state?plotId=${encodeURIComponent(seeded.plotId)}`);
    assert.equal(after.body.state.audit.eventCount, before.body.state.audit.eventCount);
    assert.equal(after.body.state.publicSummary.expeditionMapStatus, 'FOG_READ_MODEL_READY');
    assert.equal(after.body.state.publicSummary.expeditionMapKnownCount, map.body.expeditionMap.fog.counts.known);
  } finally { await close(); }
});

test('FP-HT-011d3 POST /api/founders-plot/expedition-map/scout-sector reveals one hinted sector', async () => {
  const { server, close } = await fresh('scout-sector');
  try {
    const seeded = await seedResearchReadyPlot(server, 'scout_sector');
    const before = await request(server, 'GET', `/api/founders-plot/expedition-map?plotId=${encodeURIComponent(seeded.plotId)}`);
    assert.equal(before.status, 200);
    const target = before.body.expeditionMap.cells.find((cell) => cell.fogState === 'hinted');
    assert.ok(target, 'expected hinted frontier cell');
    const stateBefore = await request(server, 'GET', `/api/founders-plot/state?plotId=${encodeURIComponent(seeded.plotId)}`);

    const scouted = await request(server, 'POST', '/api/founders-plot/expedition-map/scout-sector', {
      plotId: seeded.plotId,
      cellId: target.cellId,
      actor: 'HUMAN',
      idempotencyKey: 'ht-11d3-scout'
    });
    assert.equal(scouted.status, 200, scouted.body?.error?.message || 'scout sector');
    assert.equal(scouted.body.ok, true);
    assert.equal(scouted.body.revealedCellId, target.cellId);
    assert.equal(scouted.body.proof.targetBeforeFogState, 'hinted');
    assert.equal(scouted.body.proof.targetAfterFogState, 'known');
    assert.deepEqual(scouted.body.proof.newlyKnownOrDiscoveredCellIds, [target.cellId]);
    assert.equal(scouted.body.proof.boundaryFlags.routeCreation, false);
    assert.equal(scouted.body.proof.boundaryFlags.crossPlotMutation, false);
    assert.equal(scouted.body.scoutSector.receipt.atlasExecution, false);
    assert.equal(scouted.body.eventPacket.packetId, scouted.body.scoutSector.eventPacket.packetId);
    assert.equal(scouted.body.scoutSector.receipt.eventPacketId, scouted.body.eventPacket.packetId);
    assert.equal(scouted.body.eventPacket.readOnly, true);
    assert.deepEqual(scouted.body.eventPacket.executableActions, []);
    assert.equal(scouted.body.eventPacket.partyId, 'expedition_party_current_plot_v1');
    assert.equal(scouted.body.eventPacket.partySnapshot.readOnly, true);
    assert.deepEqual(scouted.body.eventPacket.partySnapshot.executableActions, []);
    assert.deepEqual(scouted.body.eventPacket.partySnapshot.members.map((member) => member.memberId), [
      'pathfinder-scout-v1',
      'rook-signalpost-messenger-v1',
      'hq-civic-operator-vale-desk-7-v1'
    ]);
    assert.equal(scouted.body.eventPacket.partySnapshot.boundaryFlags.operatorAssignment, false);
    assert.equal(scouted.body.eventPacket.partySnapshot.boundaryFlags.resourceHarvesting, false);
    assert.equal(scouted.body.eventPacket.receiptLink.actionName, 'et.plot.scout_sector');
    assert.equal(scouted.body.eventPacket.boundaryFlags.resourceHarvesting, false);
    assert.deepEqual(scouted.body.eventPacket.boundaryFlags.resourceDelta, {});
    assert.equal(scouted.body.eventPacket.boundaryFlags.generatedUniverseRendering, false);
    assert.equal(scouted.body.expeditionMap.surveyBridge.activePacketId, scouted.body.eventPacket.packetId);
    assert.equal(scouted.body.expeditionMap.surveyBridge.status, 'PACKET_READY_FOR_SITE_PLAN_PREFLIGHT');
    assert.equal(scouted.body.expeditionMap.surveyBridge.activeCandidate.commandState.commandId, 'draft_site_plan_from_packet');
    assert.equal(scouted.body.expeditionMap.surveyBridge.activeCandidate.commandState.actionName, 'et.plot.draft_site_plan_from_packet');
    assert.equal(scouted.body.expeditionMap.surveyBridge.activeCandidate.commandState.serverMutationImplemented, true);
    assert.deepEqual(scouted.body.expeditionMap.surveyBridge.activeCandidate.commandState.executableActions, []);
    assert.equal(scouted.body.expeditionMap.surveyBridge.boundaryFlags.createsSitePlan, false);
    assert.equal(scouted.body.expeditionMap.surveyBridge.boundaryFlags.hiddenTruthLeakage, false);
    assert.equal(scouted.body.worldDelta.some((entry) => entry.type === 'EXPEDITION_SECTOR_SCOUTED'), true);
    assert.deepEqual(scouted.body.state.plot.inventory, stateBefore.body.state.plot.inventory);

    const repeat = await request(server, 'POST', '/api/founders-plot/expedition-map/scout-sector', {
      plotId: seeded.plotId,
      cellId: target.cellId,
      actor: 'HUMAN',
      idempotencyKey: 'ht-11d3-scout'
    });
    assert.equal(repeat.status, 200);
    assert.equal(repeat.body.scoutSector.scoutId, scouted.body.scoutSector.scoutId);
    assert.equal(repeat.body.eventPacket.packetId, scouted.body.eventPacket.packetId);
    assert.deepEqual(repeat.body.eventPacket.partySnapshot, scouted.body.eventPacket.partySnapshot);

    const duplicateTarget = await request(server, 'POST', '/api/founders-plot/expedition-map/scout-sector', {
      plotId: seeded.plotId,
      cellId: target.cellId,
      actor: 'HUMAN',
      idempotencyKey: 'ht-11d3-scout-duplicate-target'
    });
    assert.equal(duplicateTarget.status, 200);
    assert.equal(duplicateTarget.body.alreadyScouted, true);
    assert.equal(duplicateTarget.body.eventPacket.packetId, scouted.body.eventPacket.packetId);
    assert.deepEqual(duplicateTarget.body.eventPacket.partySnapshot, scouted.body.eventPacket.partySnapshot);
    assert.deepEqual(duplicateTarget.body.worldDelta, []);

    const later = await request(server, 'GET', `/api/founders-plot/expedition-map?plotId=${encodeURIComponent(seeded.plotId)}`);
    const revealed = later.body.expeditionMap.cells.find((cell) => cell.cellId === target.cellId);
    assert.equal(revealed.fogState, 'known');
    assert.equal(revealed.sourceTruth, 'expedition_scout_sector');
    assert.equal(revealed.eventPacket.packetId, scouted.body.eventPacket.packetId);
    assert.equal(later.body.expeditionMap.eventPackets.some((packet) => packet.packetId === scouted.body.eventPacket.packetId), true);
    assert.equal(later.body.expeditionMap.surveyBridge.activePacketId, scouted.body.eventPacket.packetId);
    assert.equal(later.body.expeditionMap.sourceSummary.surveyBridgeCandidatePacketIds.includes(scouted.body.eventPacket.packetId), true);

    const blockedAgent = await request(server, 'POST', '/api/founders-plot/expedition-map/scout-sector', {
      plotId: seeded.plotId,
      actorType: 'AGENT',
      idempotencyKey: 'ht-11d3-agent-blocked'
    });
    assert.equal(blockedAgent.status, 403);
    assert.equal(blockedAgent.body.error.details.requiresApproval, true);
  } finally { await close(); }
});

test('FP-HT-011d3b POST /api/founders-plot/expedition-map/draft-site-plan drafts one packet-grounded plan', async () => {
  const { server, close } = await fresh('packet-site-plan');
  try {
    const seeded = await seedResearchReadyPlot(server, 'packet_site_plan');
    const before = await request(server, 'GET', `/api/founders-plot/expedition-map?plotId=${encodeURIComponent(seeded.plotId)}`);
    const target = before.body.expeditionMap.cells.find((cell) => cell.fogState === 'hinted');
    assert.ok(target, 'expected hinted frontier cell');
    const scouted = await request(server, 'POST', '/api/founders-plot/expedition-map/scout-sector', {
      plotId: seeded.plotId,
      cellId: target.cellId,
      actor: 'HUMAN',
      idempotencyKey: 'ht-11d5-scout'
    });
    assert.equal(scouted.status, 200, scouted.body?.error?.message || 'scout sector');
    const stateBefore = await request(server, 'GET', `/api/founders-plot/state?plotId=${encodeURIComponent(seeded.plotId)}`);

    const agentBlocked = await request(server, 'POST', '/api/founders-plot/expedition-map/draft-site-plan', {
      plotId: seeded.plotId,
      packetId: scouted.body.eventPacket.packetId,
      actorType: 'AGENT',
      idempotencyKey: 'ht-11d5-agent-blocked'
    });
    assert.equal(agentBlocked.status, 403);
    assert.equal(agentBlocked.body.error.details.requiresApproval, true);

    const planned = await request(server, 'POST', '/api/founders-plot/expedition-map/draft-site-plan', {
      plotId: seeded.plotId,
      packetId: scouted.body.eventPacket.packetId,
      title: 'HTTP Packet Site Plan',
      focus: 'balanced',
      actor: 'HUMAN',
      idempotencyKey: 'ht-11d5-plan'
    });
    assert.equal(planned.status, 200, planned.body?.error?.message || 'packet site plan');
    assert.equal(planned.body.ok, true);
    assert.equal(planned.body.existing, false);
    assert.equal(planned.body.packetId, scouted.body.eventPacket.packetId);
    assert.equal(planned.body.cellId, target.cellId);
    assert.equal(planned.body.sitePlan.source, 'scout_sector_event_packet');
    assert.equal(planned.body.sitePlan.sourcePacketId, scouted.body.eventPacket.packetId);
    assert.equal(planned.body.sitePlan.sourceCellId, target.cellId);
    assert.deepEqual(planned.body.sitePlan.resourceHints, {});
    assert.equal(planned.body.proof.boundaryFlags.createsSitePlan, true);
    assert.equal(planned.body.proof.boundaryFlags.createsSurveyor, false);
    assert.equal(planned.body.proof.boundaryFlags.routeCreation, false);
    assert.equal(planned.body.proof.boundaryFlags.resourceHarvesting, false);
    assert.equal(planned.body.proof.boundaryFlags.rewardCreation, false);
    assert.equal(planned.body.proof.boundaryFlags.atlasExecution, false);
    assert.equal(planned.body.proof.boundaryFlags.externalEffects, false);
    assert.deepEqual(planned.body.state.plot.inventory, stateBefore.body.state.plot.inventory);
    assert.equal(planned.body.worldDelta.some((entry) => entry.type === 'EXPEDITION_PACKET_SITE_PLAN_DRAFTED'), true);
    assert.equal(planned.body.expeditionMap.surveyBridge.status, 'SITE_PLAN_PRESENT');
    assert.equal(planned.body.expeditionMap.surveyBridge.activeCandidate.sitePlan.planId, planned.body.sitePlan.planId);
    assert.equal(planned.body.expeditionMap.surveyBridge.activeCandidate.commandState.commandId, 'review_site_plan');
    assert.equal(planned.body.expeditionMap.surveyBridge.activeCandidate.commandState.actionName, 'et.plot.review_site_plan');
    assert.equal(planned.body.expeditionMap.surveyBridge.activeCandidate.commandState.enabled, true);
    assert.equal(planned.body.expeditionMap.surveyBridge.activeCandidate.commandState.serverMutationImplemented, true);
    assert.equal(planned.body.expeditionMap.surveyBridge.activeCandidate.commandState.executableThroughExistingEndpoint, true);
    assert.equal(planned.body.expeditionMap.surveyBridge.activeCandidate.commandState.sourcePlanId, planned.body.sitePlan.planId);
    assert.deepEqual(planned.body.expeditionMap.surveyBridge.activeCandidate.commandState.targetCellIds, [target.cellId]);
    assert.deepEqual(planned.body.expeditionMap.surveyBridge.activeCandidate.commandState.executableActions, []);
    assert.equal(planned.body.expeditionMap.surveyBridge.activeCandidate.nextRequiredContract, 'existing_review_site_plan_endpoint');
    const plannedCell = planned.body.expeditionMap.cells.find((cell) => cell.cellId === target.cellId);
    assert.ok(plannedCell, 'expected packet Site Plan cell on Expedition Map');
    assert.equal(plannedCell.status, 'SITE_PLAN_DRAFTED');
    assert.equal(plannedCell.sourceTruth, 'site_plan');
    assert.equal(plannedCell.sourceIds.planId, planned.body.sitePlan.planId);
    assert.equal(plannedCell.sourceIds.sourcePacketId, scouted.body.eventPacket.packetId);
    assert.equal(plannedCell.eventPacket.packetId, scouted.body.eventPacket.packetId);
    assert.equal(plannedCell.sitePlanObject.kind, 'packet_site_plan');
    assert.equal(plannedCell.sitePlanObject.planId, planned.body.sitePlan.planId);
    assert.equal(plannedCell.sitePlanObject.planningOnly, true);
    assert.equal(plannedCell.sitePlanObject.readOnly, true);
    assert.deepEqual(plannedCell.sitePlanObject.executableActions, []);
    assert.equal(plannedCell.sitePlanObject.boundaryFlags.createsSurveyor, false);
    assert.equal(plannedCell.sitePlanObject.boundaryFlags.routeCreation, false);
    assert.equal(plannedCell.sitePlanObject.boundaryFlags.atlasExecution, false);

    const repeated = await request(server, 'POST', '/api/founders-plot/expedition-map/draft-site-plan', {
      plotId: seeded.plotId,
      packetId: scouted.body.eventPacket.packetId,
      actor: 'HUMAN',
      idempotencyKey: 'ht-11d5-plan-repeat'
    });
    assert.equal(repeated.status, 200);
    assert.equal(repeated.body.existing, true);
    assert.equal(repeated.body.sitePlan.planId, planned.body.sitePlan.planId);
    assert.deepEqual(repeated.body.worldDelta, []);

    const reviewed = await request(server, 'POST', '/api/founders-plot/review-site-plan', {
      plotId: seeded.plotId,
      planId: planned.body.sitePlan.planId,
      reviewNote: 'HTTP packet Site Plan review only.',
      actor: 'HUMAN',
      idempotencyKey: 'ht-11d5-review'
    });
    assert.equal(reviewed.status, 200, reviewed.body?.error?.message || 'review packet site plan');
    assert.equal(reviewed.body.ok, true);
    assert.equal(reviewed.body.sitePlan.reviewStatus, 'reviewed');
    assert.equal(reviewed.body.sitePlan.sourcePacketId, scouted.body.eventPacket.packetId);
    assert.equal(reviewed.body.state.expeditionMap.surveyBridge.status, 'SURVEYOR_COMMAND_READY');
    assert.equal(reviewed.body.state.expeditionMap.surveyBridge.activeCandidate.sitePlan.planId, planned.body.sitePlan.planId);
    assert.equal(reviewed.body.state.expeditionMap.surveyBridge.activeCandidate.commandState.commandId, 'prepare_settler_convoy');
    assert.equal(reviewed.body.state.expeditionMap.surveyBridge.activeCandidate.commandState.actionName, 'et.plot.prepare_settler_convoy');
    assert.equal(reviewed.body.state.expeditionMap.surveyBridge.activeCandidate.commandState.serverMutationImplemented, true);
    assert.equal(reviewed.body.state.expeditionMap.sourceSummary.reviewedSitePlanIds.includes(planned.body.sitePlan.planId), true);
    assert.equal(reviewed.body.state.expeditionMap.units.items.some((unit) => (
      unit.unitType === 'surveyor'
      && unit.sourcePlanId === planned.body.sitePlan.planId
      && unit.commandHints.some((command) => command.commandId === 'prepare_settler_convoy' && command.serverMutationImplemented === true)
    )), true);

    const prepareBundle = store.readPlotBundleById(seeded.plotId);
    store.writeBuildings([
      ...prepareBundle.buildings,
      {
        buildingId: 'bldg_packet_plan_expedition_board',
        plotId: seeded.plotId,
        objectInstanceId: null,
        type: 'EXPEDITION_BOARD',
        level: 1,
        x: 0,
        y: 2,
        state: 'READY',
        outputBuffer: {},
        priority: 'BALANCED',
        createdAt: nowMs,
        updatedAt: nowMs
      }
    ]);

    const prepared = await request(server, 'POST', '/api/founders-plot/prepare-settler-convoy', {
      plotId: seeded.plotId,
      sitePlanId: planned.body.sitePlan.planId,
      actor: 'HUMAN',
      idempotencyKey: 'ht-11d5-prepare-convoy'
    });
    assert.equal(prepared.status, 200, prepared.body?.error?.message || 'prepare packet Site Plan convoy');
    assert.equal(prepared.body.ok, true);
    assert.equal(prepared.body.settlementClaim.sitePlanId, planned.body.sitePlan.planId);
    assert.equal(prepared.body.settlementClaim.status, 'CONVOY_PREPARING');
    assert.equal(prepared.body.state.expeditionMap.scope.settlementClaimCount, 2);
    const preparedCell = prepared.body.state.expeditionMap.cells.find((cell) => (
      cell.sourceIds?.claimId === prepared.body.settlementClaim.claimId
    ));
    assert.ok(preparedCell, 'expected prepared convoy claim cell in Expedition Map');
    assert.equal(preparedCell.cellId, target.cellId);
    assert.equal(preparedCell.sourceTruth, 'settlement_claim');
    assert.equal(preparedCell.status, 'CONVOY_PREPARING');
    const preparedConvoyUnit = prepared.body.state.expeditionMap.units.items.find((unit) => (
      unit.unitType === 'settler_convoy'
      && unit.sourceClaimId === prepared.body.settlementClaim.claimId
    ));
    assert.ok(preparedConvoyUnit, 'expected prepared Settler Convoy map unit from packet-derived plan');
    assert.equal(preparedConvoyUnit.location.cellId, target.cellId);
    assert.equal(preparedConvoyUnit.readOnly, true);
    assert.equal(preparedConvoyUnit.movement.movementMutationImplemented, false);
    assert.equal(preparedConvoyUnit.commandHints.some((command) => command.commandId === 'found_settlement'), false);
  } finally { await close(); }
});

test('FP-HT-011d4 POST /api/founders-plot/expedition-map/move-unit moves Scout between revealed cells', async () => {
  const { server, close } = await fresh('move-expedition-unit');
  try {
    const seeded = await seedResearchReadyPlot(server, 'move_unit');
    const before = await request(server, 'GET', `/api/founders-plot/expedition-map?plotId=${encodeURIComponent(seeded.plotId)}`);
    assert.equal(before.status, 200);
    const scout = before.body.expeditionMap.units.items.find((unit) => unit.unitType === 'scout');
    assert.ok(scout, 'expected Scout unit');
    const targetCellId = scout.movement.allowedTargetCellIds[0];
    assert.ok(targetCellId, 'expected adjacent revealed target');
    const stateBefore = await request(server, 'GET', `/api/founders-plot/state?plotId=${encodeURIComponent(seeded.plotId)}`);

    const moved = await request(server, 'POST', '/api/founders-plot/expedition-map/move-unit', {
      plotId: seeded.plotId,
      unitId: scout.unitId,
      targetCellId,
      actor: 'HUMAN',
      idempotencyKey: 'ht-11d4-move'
    });
    assert.equal(moved.status, 200, moved.body?.error?.message || 'move unit');
    assert.equal(moved.body.ok, true);
    assert.equal(moved.body.movedUnitId, scout.unitId);
    assert.equal(moved.body.targetCellId, targetCellId);
    assert.equal(moved.body.move.receipt.actionName, 'et.plot.move_expedition_unit');
    assert.equal(moved.body.move.receipt.movementRevealsFog, false);
    assert.equal(moved.body.move.receipt.routeCreation, false);
    assert.equal(moved.body.move.receipt.atlasExecution, false);
    assert.equal(moved.body.proof.fogCountsUnchanged, true);
    assert.equal(moved.body.proof.boundaryFlags.resourceHarvesting, false);
    assert.equal(moved.body.worldDelta.some((entry) => entry.type === 'EXPEDITION_UNIT_MOVED'), true);
    assert.deepEqual(moved.body.state.plot.inventory, stateBefore.body.state.plot.inventory);

    const repeat = await request(server, 'POST', '/api/founders-plot/expedition-map/move-unit', {
      plotId: seeded.plotId,
      unitId: scout.unitId,
      targetCellId,
      actor: 'HUMAN',
      idempotencyKey: 'ht-11d4-move'
    });
    assert.equal(repeat.status, 200);
    assert.equal(repeat.body.move.moveId, moved.body.move.moveId);

    const later = await request(server, 'GET', `/api/founders-plot/expedition-map?plotId=${encodeURIComponent(seeded.plotId)}`);
    const movedScout = later.body.expeditionMap.units.items.find((unit) => unit.unitId === scout.unitId);
    assert.equal(movedScout.location.cellId, targetCellId);
    assert.equal(movedScout.lastMove.moveId, moved.body.move.moveId);
    assert.deepEqual(later.body.expeditionMap.fog.counts, before.body.expeditionMap.fog.counts);

    const hidden = later.body.expeditionMap.cells.find((cell) => ['hinted', 'locked_unknown'].includes(cell.fogState));
    const blockedHidden = await request(server, 'POST', '/api/founders-plot/expedition-map/move-unit', {
      plotId: seeded.plotId,
      unitId: scout.unitId,
      targetCellId: hidden.cellId,
      actor: 'HUMAN',
      idempotencyKey: 'ht-11d4-hidden'
    });
    assert.equal(blockedHidden.status, 400);
    assert.equal(blockedHidden.body.error.details.allowedFogStates.includes('known'), true);

    const agentTargetCellId = movedScout.movement.allowedTargetCellIds[0];
    const blockedAgent = await request(server, 'POST', '/api/founders-plot/expedition-map/move-unit', {
      plotId: seeded.plotId,
      unitId: scout.unitId,
      targetCellId: agentTargetCellId,
      actorType: 'AGENT',
      idempotencyKey: 'ht-11d4-agent'
    });
    assert.equal(blockedAgent.status, 403);
    assert.equal(blockedAgent.body.error.details.requiresApproval, true);
  } finally { await close(); }
});

test('FP-HT-011e HQ10B civic proposal records are persisted, gated, and Atlas-visible', async () => {
  const { server, close } = await fresh('civic-proposals');
  try {
    const locked = await request(server, 'POST', '/api/founders-plot/civic-proposals', {
      title: 'Too early proposal',
      summary: 'Should wait for HQ10A readiness.',
      actor: 'HUMAN',
      idempotencyKey: 'ht-11e-locked'
    });
    assert.equal(locked.status, 400);
    assert.equal(locked.body.error.details.reason, 'world_grid_not_ready');

    const seeded = await seedResearchReadyPlot(server, 'civic_proposal');
    const selected = await request(server, 'POST', '/api/founders-plot/select-doctrine', {
      plotId: seeded.plotId,
      doctrineId: 'survey_discipline',
      actor: 'HUMAN',
      idempotencyKey: 'ht-11e-select'
    });
    assert.equal(selected.status, 200, selected.body?.error?.message || 'select doctrine');
    const draft = await request(server, 'POST', '/api/founders-plot/work-orders/draft', {
      plotId: seeded.plotId,
      templateId: 'collect_ready_outputs_once',
      scope: {},
      actor: 'HUMAN',
      idempotencyKey: 'ht-11e-draft'
    });
    assert.equal(draft.status, 200, draft.body?.error?.message || 'draft work order');

    const before = await request(server, 'GET', `/api/founders-plot/state?plotId=${encodeURIComponent(seeded.plotId)}`);
    const created = await request(server, 'POST', '/api/founders-plot/civic-proposals', {
      plotId: seeded.plotId,
      title: 'Shared map table review',
      category: 'coordination',
      summary: 'Record an advisory civic note for reviewing a future shared map table.',
      status: 'DRAFT',
      relatedPlotIds: [seeded.foundedPlotId],
      actor: 'HUMAN',
      idempotencyKey: 'ht-11e-create'
    });
    assert.equal(created.status, 200, created.body?.error?.message || 'create civic proposal');
    assert.equal(created.body.ok, true);
    assert.equal(created.body.civicProposal.status, 'DRAFT');
    assert.equal(created.body.civicProposal.scope.executionAllowed, false);
    assert.equal(created.body.executionAllowed, false);
    assert.equal(created.body.state.publicSummary.civicProposalCount, 1);
    assert.equal(created.body.state.worldGrid.civicProposals.total, 1);
    assert.equal(created.body.state.jobs.length, before.body.state.jobs.length);
    assert.equal(created.body.state.settlementClaims.length, before.body.state.settlementClaims.length);

    const repeated = await request(server, 'POST', '/api/founders-plot/civic-proposals', {
      plotId: seeded.plotId,
      title: 'Shared map table review',
      category: 'coordination',
      summary: 'Record an advisory civic note for reviewing a future shared map table.',
      status: 'DRAFT',
      relatedPlotIds: [seeded.foundedPlotId],
      actor: 'HUMAN',
      idempotencyKey: 'ht-11e-create'
    });
    assert.equal(repeated.status, 200);
    assert.equal(repeated.body.civicProposal.proposalId, created.body.civicProposal.proposalId);

    const listed = await request(server, 'GET', `/api/founders-plot/civic-proposals?plotId=${encodeURIComponent(seeded.plotId)}`);
    assert.equal(listed.status, 200);
    assert.equal(listed.body.ok, true);
    assert.deepEqual(listed.body.worldDelta, []);
    assert.equal(listed.body.proposals.length, 1);
    assert.equal(listed.body.civicProposals.status, 'RECORDING_READY');
    assert.equal(listed.body.civicProposals.proposalOnly, true);

    const atlas = await request(server, 'GET', `/api/founders-plot/progression-atlas?plotId=${encodeURIComponent(seeded.plotId)}`);
    assert.equal(atlas.status, 200);
    assert.equal(atlas.body.atlas.summary.civicProposalCount, 1);
    const canonical = new Map(atlas.body.atlas.canonicalNodes.map((node) => [node.nodeId, node]));
    assert.equal(canonical.get('world_grid.civic_proposal_records').status, 'available');
    assert.equal(canonical.get('world_grid.civic_proposal_records').metadata.counts.total, 1);
    assert.equal(atlas.body.atlas.actionRefsByNode['world_grid.civic_proposal_records'].executableByAtlas, false);
    assert.ok([...canonical.keys()].some((nodeId) => nodeId.startsWith('civic_proposal.')));
  } finally { await close(); }
});

test('FP-HT-011f HQ10C overlay pack records are presentation-only and Atlas-visible', async () => {
  const { server, close } = await fresh('overlay-packs');
  try {
    const locked = await request(server, 'POST', '/api/founders-plot/overlay-packs', {
      sourceProposalId: 'civic_proposal_missing',
      title: 'Too early overlay',
      summary: 'Should wait for HQ10A readiness and a reviewed civic proposal.',
      actor: 'HUMAN',
      idempotencyKey: 'ht-11f-locked'
    });
    assert.equal(locked.status, 400);
    assert.equal(locked.body.error.details.reason, 'overlay_pack_records_not_ready');

    const seeded = await seedResearchReadyPlot(server, 'overlay_pack');
    const selected = await request(server, 'POST', '/api/founders-plot/select-doctrine', {
      plotId: seeded.plotId,
      doctrineId: 'survey_discipline',
      actor: 'HUMAN',
      idempotencyKey: 'ht-11f-select'
    });
    assert.equal(selected.status, 200, selected.body?.error?.message || 'select doctrine');
    const draft = await request(server, 'POST', '/api/founders-plot/work-orders/draft', {
      plotId: seeded.plotId,
      templateId: 'collect_ready_outputs_once',
      scope: {},
      actor: 'HUMAN',
      idempotencyKey: 'ht-11f-draft'
    });
    assert.equal(draft.status, 200, draft.body?.error?.message || 'draft work order');
    const proposal = await request(server, 'POST', '/api/founders-plot/civic-proposals', {
      plotId: seeded.plotId,
      title: 'Generated Universe overlay review',
      category: 'civic_memory',
      summary: 'Reviewed civic proposal for presentation-only overlay metadata.',
      status: 'REVIEWED',
      actor: 'HUMAN',
      idempotencyKey: 'ht-11f-proposal'
    });
    assert.equal(proposal.status, 200, proposal.body?.error?.message || 'reviewed civic proposal');

    const beforeState = await request(server, 'GET', `/api/founders-plot/state?plotId=${encodeURIComponent(seeded.plotId)}`);
    const beforeAtlas = await request(server, 'GET', `/api/founders-plot/progression-atlas?plotId=${encodeURIComponent(seeded.plotId)}`);
    assert.equal(beforeAtlas.status, 200);
    const beforeGameplayHash = beforeAtlas.body.gameplayStableHash;
    const beforeInventory = beforeState.body.state.plot.inventory;
    const beforeEventCount = beforeState.body.state.audit.eventCount;

    const created = await request(server, 'POST', '/api/founders-plot/overlay-packs', {
      plotId: seeded.plotId,
      sourceProposalId: proposal.body.civicProposal.proposalId,
      title: 'Lantern Grid Overlay',
      theme: 'lantern_grid',
      summary: 'Presentation-only labels, skins, and display hints for World Grid and Atlas nodes.',
      status: 'DRAFT',
      targetSurfaceIds: ['progression_atlas', 'world_grid'],
      targetNodeIds: ['world_grid.read_model', 'generated_universe.overlay_pack_records'],
      displayHints: { labels: { world_grid: 'Lantern Grid' }, skins: ['lantern'] },
      prompt: 'Warm civic lantern overlay, presentation only.',
      provenance: { source: 'http-test', provider: 'none', model: 'none' },
      actor: 'HUMAN',
      idempotencyKey: 'ht-11f-create'
    });
    assert.equal(created.status, 200, created.body?.error?.message || 'create overlay pack');
    assert.equal(created.body.ok, true);
    assert.deepEqual(created.body.worldDelta, []);
    assert.equal(created.body.overlayPack.visualOnly, true);
    assert.equal(created.body.overlayPack.presentationOnly, true);
    assert.equal(created.body.overlayPack.gameplayMutationPolicy, 'presentation_only');
    assert.equal(created.body.overlayPack.provenance.publicSharing, false);
    assert.equal(created.body.overlayPack.provenance.externalEffects, false);
    assert.equal(created.body.overlayPack.prompt.rawPromptStored, false);
    assert.equal(created.body.executionAllowed, false);
    assert.equal(created.body.state.publicSummary.overlayPackCount, 1);
    assert.equal(created.body.state.overlayPacks.counts.total, 1);
    assert.equal(created.body.state.audit.eventCount, beforeEventCount);
    assert.deepEqual(created.body.state.plot.inventory, beforeInventory);
    assert.equal(Object.hasOwn(created.body.state.worldGrid, 'overlayPacks'), false);

    const repeated = await request(server, 'POST', '/api/founders-plot/overlay-packs', {
      plotId: seeded.plotId,
      sourceProposalId: proposal.body.civicProposal.proposalId,
      title: 'Lantern Grid Overlay',
      theme: 'lantern_grid',
      summary: 'Presentation-only labels, skins, and display hints for World Grid and Atlas nodes.',
      status: 'DRAFT',
      targetSurfaceIds: ['progression_atlas', 'world_grid'],
      targetNodeIds: ['world_grid.read_model', 'generated_universe.overlay_pack_records'],
      displayHints: { labels: { world_grid: 'Lantern Grid' }, skins: ['lantern'] },
      prompt: 'Warm civic lantern overlay, presentation only.',
      provenance: { source: 'http-test', provider: 'none', model: 'none' },
      actor: 'HUMAN',
      idempotencyKey: 'ht-11f-create'
    });
    assert.equal(repeated.status, 200);
    assert.equal(repeated.body.overlayPack.overlayPackId, created.body.overlayPack.overlayPackId);

    const listed = await request(server, 'GET', `/api/founders-plot/overlay-packs?plotId=${encodeURIComponent(seeded.plotId)}`);
    assert.equal(listed.status, 200);
    assert.equal(listed.body.ok, true);
    assert.deepEqual(listed.body.worldDelta, []);
    assert.equal(listed.body.packs.length, 1);
    assert.equal(listed.body.overlayPacks.status, 'RECORDING_READY');
    assert.equal(listed.body.overlayPacks.presentationOnly, true);

    const atlas = await request(server, 'GET', `/api/founders-plot/progression-atlas?plotId=${encodeURIComponent(seeded.plotId)}`);
    assert.equal(atlas.status, 200);
    assert.equal(atlas.body.gameplayStableHash, beforeGameplayHash);
    assert.equal(atlas.body.atlas.summary.overlayPackCount, 1);
    const canonical = new Map(atlas.body.atlas.canonicalNodes.map((node) => [node.nodeId, node]));
    assert.equal(canonical.get('generated_universe.overlay_pack_records').status, 'available');
    assert.equal(canonical.get('generated_universe.overlay_pack_records').metadata.stableGameplayHashExcluded, true);
    assert.equal(atlas.body.atlas.actionRefsByNode['generated_universe.overlay_pack_records'].executableByAtlas, false);
    assert.ok([...canonical.keys()].some((nodeId) => nodeId.startsWith('overlay_pack.')));
    const executableRefs = Object.values(atlas.body.atlas.actionRefsByNode)
      .filter((ref) => ref?.tool === 'et.plot.create_overlay_pack' && ref.executableByAtlas !== false);
    assert.equal(executableRefs.length, 0);
  } finally { await close(); }
});

test('FP-HT-011g HQ10D civic project activation creates a bounded local public-work effect', async () => {
  const { server, close } = await fresh('civic-projects');
  try {
    const locked = await request(server, 'POST', '/api/founders-plot/civic-projects/activate', {
      sourceProposalId: 'civic_proposal_missing',
      title: 'Too early beacon',
      actor: 'HUMAN',
      idempotencyKey: 'ht-11g-locked'
    });
    assert.equal(locked.status, 400);
    assert.equal(locked.body.error.details.reason, 'world_grid_not_ready');

    const seeded = await seedResearchReadyPlot(server, 'civic_project');
    const selected = await request(server, 'POST', '/api/founders-plot/select-doctrine', {
      plotId: seeded.plotId,
      doctrineId: 'survey_discipline',
      actor: 'HUMAN',
      idempotencyKey: 'ht-11g-select'
    });
    assert.equal(selected.status, 200, selected.body?.error?.message || 'select doctrine');
    const draft = await request(server, 'POST', '/api/founders-plot/work-orders/draft', {
      plotId: seeded.plotId,
      templateId: 'collect_ready_outputs_once',
      scope: {},
      actor: 'HUMAN',
      idempotencyKey: 'ht-11g-draft'
    });
    assert.equal(draft.status, 200, draft.body?.error?.message || 'draft work order');
    const draftProposal = await request(server, 'POST', '/api/founders-plot/civic-proposals', {
      plotId: seeded.plotId,
      title: 'Draft beacon proposal',
      category: 'public_work',
      summary: 'Draft proposals cannot activate public works.',
      status: 'DRAFT',
      actor: 'HUMAN',
      idempotencyKey: 'ht-11g-draft-proposal'
    });
    assert.equal(draftProposal.status, 200, draftProposal.body?.error?.message || 'draft proposal');
    const draftRejected = await request(server, 'POST', '/api/founders-plot/civic-projects/activate', {
      plotId: seeded.plotId,
      sourceProposalId: draftProposal.body.civicProposal.proposalId,
      title: 'Draft beacon',
      actor: 'HUMAN',
      idempotencyKey: 'ht-11g-draft-rejected'
    });
    assert.equal(draftRejected.status, 400);
    assert.equal(draftRejected.body.error.details.reason, 'reviewed_civic_proposal_required');

    const proposal = await request(server, 'POST', '/api/founders-plot/civic-proposals', {
      plotId: seeded.plotId,
      title: 'Civic Beacon review',
      category: 'public_work',
      summary: 'Reviewed proposal for a local civic beacon public work.',
      status: 'REVIEWED',
      actor: 'HUMAN',
      idempotencyKey: 'ht-11g-proposal'
    });
    assert.equal(proposal.status, 200, proposal.body?.error?.message || 'reviewed civic proposal');

    const beforeState = await request(server, 'GET', `/api/founders-plot/state?plotId=${encodeURIComponent(seeded.plotId)}`);
    const beforeAtlas = await request(server, 'GET', `/api/founders-plot/progression-atlas?plotId=${encodeURIComponent(seeded.plotId)}`);
    const beforeGameplayHash = beforeAtlas.body.gameplayStableHash;
    const beforeInventory = beforeState.body.state.plot.inventory;
    const beforeEventCount = beforeState.body.state.audit.eventCount;

    const activated = await request(server, 'POST', '/api/founders-plot/civic-projects/activate', {
      plotId: seeded.plotId,
      sourceProposalId: proposal.body.civicProposal.proposalId,
      projectType: 'civic_beacon',
      title: 'Civic Beacon',
      summary: 'Activate a local public-work beacon that marks civic readiness.',
      actor: 'HUMAN',
      idempotencyKey: 'ht-11g-activate'
    });
    assert.equal(activated.status, 200, activated.body?.error?.message || 'activate civic project');
    assert.equal(activated.body.ok, true);
    assert.equal(activated.body.alreadyActivated, false);
    assert.equal(activated.body.effectApplied, true);
    assert.equal(activated.body.civicProject.status, 'ACTIVE');
    assert.equal(activated.body.civicProject.projectType, 'civic_beacon');
    assert.equal(activated.body.civicProject.effect.effectId, 'local_civic_beacon_v1');
    assert.equal(activated.body.civicProject.receipt.kind, 'civic_project_activation');
    assert.equal(activated.body.civicProject.receipt.routeCreation, false);
    assert.equal(activated.body.worldDelta.some((entry) => entry.type === 'CIVIC_PROJECT_ACTIVATED'), true);
    assert.equal(activated.body.state.audit.eventCount, beforeEventCount + 1);
    assert.deepEqual(activated.body.state.plot.inventory, beforeInventory);
    assert.equal(activated.body.state.publicSummary.civicBeaconActive, true);
    assert.equal(activated.body.state.publicSummary.civicReadinessScore, 1);
    assert.equal(activated.body.state.worldGrid.civicProjects.localCivicBeaconActive, true);
    assert.equal(activated.body.state.worldGrid.civicReadiness.localProjectReadinessScore, 1);

    const repeated = await request(server, 'POST', '/api/founders-plot/civic-projects/activate', {
      plotId: seeded.plotId,
      sourceProposalId: proposal.body.civicProposal.proposalId,
      projectType: 'civic_beacon',
      title: 'Civic Beacon',
      summary: 'Activate a local public-work beacon that marks civic readiness.',
      actor: 'HUMAN',
      idempotencyKey: 'ht-11g-activate'
    });
    assert.equal(repeated.status, 200);
    assert.equal(repeated.body.civicProject.projectId, activated.body.civicProject.projectId);

    const duplicateSource = await request(server, 'POST', '/api/founders-plot/civic-projects/activate', {
      plotId: seeded.plotId,
      sourceProposalId: proposal.body.civicProposal.proposalId,
      projectType: 'civic_beacon',
      title: 'Civic Beacon duplicate',
      actor: 'HUMAN',
      idempotencyKey: 'ht-11g-duplicate-source'
    });
    assert.equal(duplicateSource.status, 200);
    assert.equal(duplicateSource.body.alreadyActivated, true);
    assert.deepEqual(duplicateSource.body.worldDelta, []);

    const listed = await request(server, 'GET', `/api/founders-plot/civic-projects?plotId=${encodeURIComponent(seeded.plotId)}`);
    assert.equal(listed.status, 200);
    assert.equal(listed.body.ok, true);
    assert.deepEqual(listed.body.worldDelta, []);
    assert.equal(listed.body.projects.length, 1);
    assert.equal(listed.body.civicProjects.status, 'ACTIVE');
    assert.equal(listed.body.civicProjects.activeEffects.localCivicBeacon, true);

    const beforeInspectionEventCount = activated.body.state.audit.eventCount;
    const inspected = await request(server, 'POST', '/api/founders-plot/civic-projects/inspect', {
      plotId: seeded.plotId,
      projectId: activated.body.civicProject.projectId,
      inspectionType: 'baseline_readiness',
      note: 'Baseline beacon inspection for HQ11 local operations.',
      actor: 'HUMAN',
      idempotencyKey: 'ht-11g-inspect'
    });
    assert.equal(inspected.status, 200, inspected.body?.error?.message || 'inspect civic project');
    assert.equal(inspected.body.ok, true);
    assert.equal(inspected.body.inspectionApplied, true);
    assert.equal(inspected.body.alreadyInspected, false);
    assert.equal(inspected.body.inspection.inspectionType, 'baseline_readiness');
    assert.equal(inspected.body.inspection.routeCreation, false);
    assert.equal(inspected.body.inspection.backgroundScheduling, false);
    assert.equal(inspected.body.inspection.externalEffects, false);
    assert.equal(inspected.body.inspection.crossPlotMutation, false);
    assert.equal(inspected.body.civicProject.effect.inspection.baselineReadinessInspected, true);
    assert.equal(inspected.body.civicProject.receipt.inspections.length, 1);
    assert.equal(inspected.body.worldDelta.some((entry) => entry.type === 'CIVIC_PROJECT_INSPECTED'), true);
    assert.equal(inspected.body.state.audit.eventCount, beforeInspectionEventCount + 1);
    assert.deepEqual(inspected.body.state.plot.inventory, beforeInventory);
    assert.equal(inspected.body.state.worldGrid.civicProjects.inspectionCount, 1);
    assert.equal(inspected.body.state.worldGrid.civicReadiness.localProjectReadinessScore, 2);

    const repeatedInspection = await request(server, 'POST', '/api/founders-plot/civic-projects/inspect', {
      plotId: seeded.plotId,
      projectId: activated.body.civicProject.projectId,
      inspectionType: 'baseline_readiness',
      note: 'A second key still returns the existing baseline inspection.',
      actor: 'HUMAN',
      idempotencyKey: 'ht-11g-inspect-duplicate'
    });
    assert.equal(repeatedInspection.status, 200);
    assert.equal(repeatedInspection.body.alreadyInspected, true);
    assert.equal(repeatedInspection.body.inspectionApplied, false);
    assert.deepEqual(repeatedInspection.body.worldDelta, []);

    const atlas = await request(server, 'GET', `/api/founders-plot/progression-atlas?plotId=${encodeURIComponent(seeded.plotId)}`);
    assert.equal(atlas.status, 200);
    assert.notEqual(atlas.body.gameplayStableHash, beforeGameplayHash);
    assert.equal(atlas.body.atlas.summary.civicProjectCount, 1);
    assert.equal(atlas.body.atlas.summary.civicBeaconActive, true);
    const canonical = new Map(atlas.body.atlas.canonicalNodes.map((node) => [node.nodeId, node]));
    assert.equal(canonical.get('world_grid.civic_project_activation').status, 'available');
    assert.equal(canonical.get('world_grid.civic_project_activation').metadata.activeEffects.localCivicBeacon, true);
    assert.equal(atlas.body.atlas.actionRefsByNode['world_grid.civic_project_activation'].executableByAtlas, false);
    assert.ok([...canonical.keys()].some((nodeId) => nodeId.startsWith('civic_project.')));
    const civicProjectNode = [...canonical.values()].find((node) => node.nodeId.startsWith('civic_project.'));
    assert.equal(civicProjectNode.metadata.inspectionBoundary, 'server_owned_civic_project_inspection_current_plot_v1');
    assert.equal(civicProjectNode.actionRef, null);
  } finally { await close(); }
});

test('FP-HT-012 progression atlas drafts, saves, selects, and explains private strategies without gameplay mutation', async () => {
  const { server, close } = await fresh('progression-strategy');
  try {
    const before = await request(server, 'GET', '/api/founders-plot/progression-atlas');
    assert.equal(before.status, 200);
    const beforeGameplayHash = before.body.gameplayStableHash;
    const beforeInventory = before.body.gameplaySnapshot.plot.inventory;
    const beforeEvents = before.body.gameplaySnapshot.audit.eventCount;

    const keys = ['rush-hq3', 'balanced-food-wood', 'delegate-outputs-first', 'hq10-horizon'];
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
    assert.equal(drafted['hq10-horizon'].steps.filter((step) => step.stepKind === 'future_placeholder').length, 4);
    assert.ok(drafted['hq10-horizon'].compare.futureMilestones.find((node) => node.level === 10));

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
    assert.equal(atlas.body.atlas.strategies.length, keys.length);
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

test('FP-HT-014 progression atlas saves edited strategy steps and GenAI icon drafts without gameplay mutation', async () => {
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
          doctrineEffect: { doctrineId: 'survey_discipline', durationMultiplier: 0.1 },
          effects: [{ kind: 'invented_doctrine_effect', resource: 'coin', amount: 999 }],
          gameplayBuff: true,
          engineOwnedEffect: true,
          resourceGate: {
            gateId: 'gate.expedition_board_frame',
            title: 'Expedition Board Frame',
            source: 'strategy_editor_gate_draft_v1',
            promotionStatus: 'draft',
            requirements: {
              items: [
                { kind: 'resource', resource: 'wood', have: 0, required: 30, missing: 30 },
                { kind: 'resource', resource: 'stone', have: 0, required: 12, missing: 12 },
                { kind: 'hq', resource: 'HQ', have: 1, required: 3, missing: 2 }
              ],
              affordable: false,
              missing: { wood: 30, stone: 12, HQ: 2 }
            },
            estimatedCost: { wood: 30, stone: 12 },
            targetRef: { kind: 'future_system', id: 'expedition_board', type: 'expedition' }
          },
          canonicalProposal: {
            proposalId: 'proposal.expedition_board_frame',
            title: 'Expedition Board placement',
            parentNodeId: 'hq.level.3',
            parentTitle: 'HQ Level 3',
            proposedNodeId: 'building.EXPEDITION_BOARD.place',
            nodeKind: 'building',
            summary: 'Promote this only after the engine owns Expedition Board construction.',
            promotionStatus: 'draft'
          },
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
          resourceGate: { canonicalNodeId: 'hq.level.2' },
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
    assert.equal(save.body.strategy.steps[0].resourceGate.canonicalNodeId, 'hq.level.3');
    assert.deepEqual(save.body.strategy.steps[0].resourceGate.estimatedCost, { wood: 20, stone: 16 });
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
    assert.equal(save.body.strategy.steps[1].resourceGate.gateId, 'gate.expedition_board_frame');
    assert.equal(save.body.strategy.steps[1].resourceGate.canonicalNodeId, null);
    assert.deepEqual(save.body.strategy.steps[1].resourceGate.estimatedCost, { wood: 30, stone: 12 });
    assert.equal(save.body.strategy.steps[1].resourceGate.requirements.advisory, true);
    assert.equal(save.body.strategy.steps[1].resourceGate.requirements.items.find((item) => item.resource === 'HQ').required, 3);
    assert.equal(save.body.strategy.steps[1].resourceGate.gameplayAuthority, 'strategy_editor_advisory');
    assert.equal(save.body.strategy.steps[1].resourceGate.source, 'strategy_editor_gate_draft_v1');
    assert.equal(save.body.strategy.steps[1].resourceGate.promotionStatus, 'draft');
    assert.equal(save.body.strategy.steps[1].canonicalProposal.parentNodeId, 'hq.level.3');
    assert.equal(save.body.strategy.steps[1].canonicalProposal.proposedNodeId, 'building.EXPEDITION_BOARD.place');
    assert.equal(save.body.strategy.steps[1].canonicalProposal.authorityBoundary, 'requires_engine_promotion');
    assert.equal(save.body.strategy.steps[1].doctrineEffect, undefined);
    assert.equal(save.body.strategy.steps[1].gameplayBuff, undefined);
    assert.equal(save.body.strategy.steps[1].engineOwnedEffect, undefined);
    assert.equal(save.body.strategy.steps[1].effects, undefined);
    assert.equal(save.body.strategy.steps[1].actionRef, null);
    assert.equal(save.body.strategy.steps[2].stepKind, 'custom_note');
    assert.equal(save.body.strategy.steps[2].requirements.advisory, true);
    assert.equal(save.body.strategy.steps[2].resourceGate.canonicalNodeId, 'hq.level.2');
    assert.deepEqual(save.body.strategy.steps[2].resourceGate.estimatedCost, { wood: 20, food: 10 });
    assert.equal(save.body.strategy.steps[2].requirements.items.find((item) => item.resource === 'food').required, 10);
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
