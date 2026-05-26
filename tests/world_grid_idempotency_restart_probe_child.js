const http = require('node:http');
const express = require('express');
const { isDeepStrictEqual } = require('node:util');

const { createInitialPlot } = require('../server/founders_plot/engine');
const { savePlotGraph } = require('../server/founders_plot/store');
const {
  closeWorldGridIdempotencyStore,
  createWorldGridIdempotencyStore
} = require('../server/world_grid/idempotency');
const { createWorldGridRouter } = require('../server/world_grid/routes');

const PAIR_ID = 'session:world-grid-durable-idempotency-restart';
const ROUTE_OWNER_A = 'session:world-grid-durable-idempotency-route-a';
const ROUTE_OWNER_B = 'session:world-grid-durable-idempotency-route-b';
const IDEMPOTENCY_KEY = 'restart_plan_claim_001';

function writeJson(value) {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}

function seedFoundersPlot() {
  savePlotGraph(createInitialPlot({ pairId: PAIR_ID, nowMs: 1_779_984_000_000 }));
}

function seedPlotFor(pairId) {
  savePlotGraph(createInitialPlot({ pairId, nowMs: 1_779_984_000_000 }));
}

async function withServer(fn) {
  const app = express();
  app.use(express.json());
  app.use(createWorldGridRouter({
    resolveIdentity: (req) => ({ pairId: String(req.get('x-test-pair-id') || PAIR_ID), houseId: null })
  }));
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  try {
    return await fn(baseUrl);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    closeWorldGridIdempotencyStore();
  }
}

async function getClaimOptions(baseUrl) {
  const response = await fetch(`${baseUrl}/api/world/territory/claim-options`);
  const body = await response.json();
  if (response.status !== 200) throw new Error(`OPTIONS_FAILED:${response.status}:${JSON.stringify(body)}`);
  return body.options;
}

async function getClaimOptionsFor(baseUrl, pairId) {
  const response = await fetch(`${baseUrl}/api/world/territory/claim-options`, {
    headers: { 'x-test-pair-id': pairId }
  });
  const body = await response.json();
  if (response.status !== 200) throw new Error(`OPTIONS_FAILED:${response.status}:${JSON.stringify(body)}`);
  return body.options;
}

async function postPlanClaim(baseUrl, body) {
  const response = await fetch(`${baseUrl}/api/world/territory/plan-claim`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  return {
    status: response.status,
    replayHeader: response.headers.get('x-world-grid-idempotency-replay') || '',
    body: await response.json()
  };
}

async function postJson(baseUrl, route, body, pairId = PAIR_ID) {
  const response = await fetch(`${baseUrl}${route}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-test-pair-id': pairId },
    body: JSON.stringify(body)
  });
  return {
    status: response.status,
    replayHeader: response.headers.get('x-world-grid-idempotency-replay') || '',
    body: await response.json()
  };
}

async function regionClaimCount(baseUrl) {
  const response = await fetch(`${baseUrl}/api/world/region`);
  const body = await response.json();
  if (response.status !== 200) throw new Error(`REGION_FAILED:${response.status}:${JSON.stringify(body)}`);
  return body.territory.claims.length;
}

function durableSnapshot(sqlitePath) {
  const store = createWorldGridIdempotencyStore({ sqlitePath });
  try {
    const records = store.listRecords();
    return {
      durableCount: records.length,
      durableRecords: records.map((record) => ({
        ownerAccountId: record.ownerAccountId,
        idempotencyKey: record.idempotencyKey,
        surface: record.surface,
        migrationVersion: record.migrationVersion,
        schemaVersion: record.schemaVersion
      })),
      surfaces: Array.from(new Set(records.map((record) => record.surface))).sort()
    };
  } finally {
    store.close();
  }
}

function durableCount(sqlitePath) {
  const store = createWorldGridIdempotencyStore({ sqlitePath });
  try {
    return store.count();
  } finally {
    store.close();
  }
}

function caseRecord({ route, owner = ROUTE_OWNER_A, body, conflictBody, result }) {
  return {
    route,
    owner,
    body,
    conflictBody,
    expectedStatus: result.status,
    expectedBody: result.body
  };
}

function assertOk(result, label) {
  if (result.status !== 200) {
    throw new Error(`${label}:${result.status}:${JSON.stringify(result.body)}`);
  }
}

async function seedRouteMatrix(baseUrl) {
  seedPlotFor(ROUTE_OWNER_A);
  seedPlotFor(ROUTE_OWNER_B);
  const cases = [];
  const options = await getClaimOptionsFor(baseUrl, ROUTE_OWNER_A);
  const completeOption = options[0];
  const cancelOption = options[1];

  const planBody = {
    cellId: completeOption.cellId,
    idempotencyKey: 'route_matrix_plan_claim_001'
  };
  const planned = await postJson(baseUrl, '/api/world/territory/plan-claim', planBody, ROUTE_OWNER_A);
  assertOk(planned, 'PLAN_CLAIM');
  cases.push(caseRecord({
    route: '/api/world/territory/plan-claim',
    body: planBody,
    conflictBody: { ...planBody, cellId: cancelOption.cellId },
    result: planned
  }));

  const cancelPrepBody = {
    cellId: cancelOption.cellId,
    idempotencyKey: 'route_matrix_plan_cancel_prep_001'
  };
  const cancelPrepared = await postJson(baseUrl, '/api/world/territory/plan-claim', cancelPrepBody, ROUTE_OWNER_A);
  assertOk(cancelPrepared, 'PLAN_CANCEL_PREP');
  cases.push(caseRecord({
    route: '/api/world/territory/plan-claim',
    body: cancelPrepBody,
    conflictBody: { ...cancelPrepBody, cellId: completeOption.cellId },
    result: cancelPrepared
  }));

  const completeBody = {
    claimId: planned.body.claim.claimId,
    idempotencyKey: 'route_matrix_complete_claim_001'
  };
  const completed = await postJson(baseUrl, '/api/world/territory/complete-claim', completeBody, ROUTE_OWNER_A);
  assertOk(completed, 'COMPLETE_CLAIM');
  cases.push(caseRecord({
    route: '/api/world/territory/complete-claim',
    body: completeBody,
    conflictBody: { ...completeBody, claimId: `${completeBody.claimId}_changed` },
    result: completed
  }));

  const cancelBody = {
    claimId: cancelPrepared.body.claim.claimId,
    idempotencyKey: 'route_matrix_cancel_claim_001'
  };
  const cancelled = await postJson(baseUrl, '/api/world/territory/cancel-claim', cancelBody, ROUTE_OWNER_A);
  assertOk(cancelled, 'CANCEL_CLAIM');
  cases.push(caseRecord({
    route: '/api/world/territory/cancel-claim',
    body: cancelBody,
    conflictBody: { ...cancelBody, claimId: `${cancelBody.claimId}_changed` },
    result: cancelled
  }));

  const ownerBPresenceBody = {
    displayName: 'Route Matrix Neighbor',
    townName: 'Neighbor Junction',
    idempotencyKey: 'route_matrix_public_opt_in_b_001'
  };
  const ownerBPresence = await postJson(baseUrl, '/api/world/public-presence/opt-in', ownerBPresenceBody, ROUTE_OWNER_B);
  assertOk(ownerBPresence, 'PUBLIC_OPT_IN_B');
  cases.push(caseRecord({
    route: '/api/world/public-presence/opt-in',
    owner: ROUTE_OWNER_B,
    body: ownerBPresenceBody,
    conflictBody: { ...ownerBPresenceBody, townName: 'Changed Neighbor' },
    result: ownerBPresence
  }));

  const ownerAPresenceBody = {
    displayName: 'Route Matrix Visitor',
    townName: 'Replay Crossing',
    idempotencyKey: 'route_matrix_public_opt_in_a_001'
  };
  const ownerAPresence = await postJson(baseUrl, '/api/world/public-presence/opt-in', ownerAPresenceBody, ROUTE_OWNER_A);
  assertOk(ownerAPresence, 'PUBLIC_OPT_IN_A');
  cases.push(caseRecord({
    route: '/api/world/public-presence/opt-in',
    body: ownerAPresenceBody,
    conflictBody: { ...ownerAPresenceBody, displayName: 'Changed Visitor' },
    result: ownerAPresence
  }));

  const followBody = {
    publicTownId: ownerBPresence.body.town.publicTownId,
    idempotencyKey: 'route_matrix_follow_town_001'
  };
  const followed = await postJson(baseUrl, '/api/world/follow-town', followBody, ROUTE_OWNER_A);
  assertOk(followed, 'FOLLOW_TOWN');
  cases.push(caseRecord({
    route: '/api/world/follow-town',
    body: followBody,
    conflictBody: { ...followBody, publicTownId: `${followBody.publicTownId}_changed` },
    result: followed
  }));

  const optOutBody = {
    idempotencyKey: 'route_matrix_public_opt_out_001'
  };
  const optedOut = await postJson(baseUrl, '/api/world/public-presence/opt-out', optOutBody, ROUTE_OWNER_A);
  assertOk(optedOut, 'PUBLIC_OPT_OUT');
  cases.push(caseRecord({
    route: '/api/world/public-presence/opt-out',
    body: optOutBody,
    conflictBody: { ...optOutBody, note: 'changed' },
    result: optedOut
  }));

  const requestBody = {
    serviceId: 'service_route_advisor',
    input: { regionSummary: { cellCount: 19 }, brainSecrets: 'sk-route-matrix-secret' },
    idempotencyKey: 'route_matrix_service_request_001'
  };
  const requested = await postJson(baseUrl, '/api/world/services/request-advice', requestBody, ROUTE_OWNER_A);
  assertOk(requested, 'SERVICE_REQUEST');
  cases.push(caseRecord({
    route: '/api/world/services/request-advice',
    body: requestBody,
    conflictBody: { ...requestBody, serviceId: 'service_public_works_planner' },
    result: requested
  }));

  const acceptBody = {
    requestId: requested.body.request.requestId,
    idempotencyKey: 'route_matrix_service_accept_001'
  };
  const accepted = await postJson(baseUrl, '/api/world/services/accept-result', acceptBody, ROUTE_OWNER_A);
  assertOk(accepted, 'SERVICE_ACCEPT');
  cases.push(caseRecord({
    route: '/api/world/services/accept-result',
    body: acceptBody,
    conflictBody: { ...acceptBody, requestId: `${acceptBody.requestId}_changed` },
    result: accepted
  }));

  const reportBody = {
    requestId: requested.body.request.requestId,
    reason: 'Route matrix dispute.',
    idempotencyKey: 'route_matrix_service_report_001'
  };
  const reported = await postJson(baseUrl, '/api/world/services/report-issue', reportBody, ROUTE_OWNER_A);
  assertOk(reported, 'SERVICE_REPORT');
  cases.push(caseRecord({
    route: '/api/world/services/report-issue',
    body: reportBody,
    conflictBody: { ...reportBody, reason: 'Changed dispute.' },
    result: reported
  }));

  const eventId = 'event_great_ridge_bridge';
  const contributeBody = {
    eventId,
    bundle: { coin: 1 },
    idempotencyKey: 'route_matrix_event_contribute_001'
  };
  const contributed = await postJson(baseUrl, '/api/world/events/contribute', contributeBody, ROUTE_OWNER_A);
  assertOk(contributed, 'EVENT_CONTRIBUTE');
  cases.push(caseRecord({
    route: '/api/world/events/contribute',
    body: contributeBody,
    conflictBody: { ...contributeBody, bundle: { coin: 2 } },
    result: contributed
  }));

  const rewardBody = {
    eventId,
    idempotencyKey: 'route_matrix_event_reward_001'
  };
  const rewarded = await postJson(baseUrl, '/api/world/events/claim-reward', rewardBody, ROUTE_OWNER_A);
  assertOk(rewarded, 'EVENT_REWARD');
  cases.push(caseRecord({
    route: '/api/world/events/claim-reward',
    body: rewardBody,
    conflictBody: { ...rewardBody, ownerAccountId: 'owner_mismatch' },
    result: rewarded
  }));

  const sandboxEnterBody = { idempotencyKey: 'route_matrix_sandbox_enter_001' };
  const sandboxEntered = await postJson(baseUrl, '/api/world/sandbox/enter', sandboxEnterBody, ROUTE_OWNER_A);
  assertOk(sandboxEntered, 'SANDBOX_ENTER');
  cases.push(caseRecord({
    route: '/api/world/sandbox/enter',
    body: sandboxEnterBody,
    conflictBody: { ...sandboxEnterBody, note: 'changed' },
    result: sandboxEntered
  }));

  const sandboxPlaceBody = {
    payload: { cellId: 'sandbox_cell_0', propId: 'lantern' },
    idempotencyKey: 'route_matrix_sandbox_place_001'
  };
  const sandboxPlaced = await postJson(baseUrl, '/api/world/sandbox/place-prop', sandboxPlaceBody, ROUTE_OWNER_A);
  assertOk(sandboxPlaced, 'SANDBOX_PLACE');
  cases.push(caseRecord({
    route: '/api/world/sandbox/place-prop',
    body: sandboxPlaceBody,
    conflictBody: { ...sandboxPlaceBody, payload: { cellId: 'sandbox_cell_0', propId: 'bench' } },
    result: sandboxPlaced
  }));

  const sandboxAgentBody = {
    payload: { cellId: 'sandbox_cell_1', demoKind: 'route-signpost' },
    idempotencyKey: 'route_matrix_sandbox_agent_001'
  };
  const sandboxAgent = await postJson(baseUrl, '/api/world/sandbox/agent-demo', sandboxAgentBody, ROUTE_OWNER_A);
  assertOk(sandboxAgent, 'SANDBOX_AGENT');
  cases.push(caseRecord({
    route: '/api/world/sandbox/agent-demo',
    body: sandboxAgentBody,
    conflictBody: { ...sandboxAgentBody, payload: { cellId: 'sandbox_cell_2', demoKind: 'route-signpost' } },
    result: sandboxAgent
  }));

  const sandboxRollbackBody = { idempotencyKey: 'route_matrix_sandbox_rollback_001' };
  const sandboxRollback = await postJson(baseUrl, '/api/world/sandbox/rollback-last', sandboxRollbackBody, ROUTE_OWNER_A);
  assertOk(sandboxRollback, 'SANDBOX_ROLLBACK');
  cases.push(caseRecord({
    route: '/api/world/sandbox/rollback-last',
    body: sandboxRollbackBody,
    conflictBody: { ...sandboxRollbackBody, note: 'changed' },
    result: sandboxRollback
  }));

  const sandboxLeaveBody = { idempotencyKey: 'route_matrix_sandbox_leave_001' };
  const sandboxLeave = await postJson(baseUrl, '/api/world/sandbox/leave', sandboxLeaveBody, ROUTE_OWNER_A);
  assertOk(sandboxLeave, 'SANDBOX_LEAVE');
  cases.push(caseRecord({
    route: '/api/world/sandbox/leave',
    body: sandboxLeaveBody,
    conflictBody: { ...sandboxLeaveBody, note: 'changed' },
    result: sandboxLeave
  }));

  return cases;
}

function readScenario(scenarioPath = '') {
  if (!scenarioPath) throw new Error('WORLD_GRID_IDEMPOTENCY_SCENARIO_REQUIRED');
  return JSON.parse(require('node:fs').readFileSync(scenarioPath, 'utf8'));
}

async function replayRouteMatrix(baseUrl, scenarioPath) {
  const cases = readScenario(scenarioPath);
  const results = [];
  for (const entry of cases) {
    const replay = await postJson(baseUrl, entry.route, entry.body, entry.owner);
    results.push({
      route: entry.route,
      owner: entry.owner,
      idempotencyKey: entry.body.idempotencyKey,
      status: replay.status,
      replayHeader: replay.replayHeader,
      body: replay.body,
      matchesSeededResponse: isDeepStrictEqual(replay.body, entry.expectedBody)
    });
  }
  return results;
}

async function conflictRouteMatrix(baseUrl, scenarioPath) {
  const cases = readScenario(scenarioPath);
  const results = [];
  for (const entry of cases) {
    const conflict = await postJson(baseUrl, entry.route, entry.conflictBody, entry.owner);
    results.push({
      route: entry.route,
      owner: entry.owner,
      idempotencyKey: entry.conflictBody.idempotencyKey,
      status: conflict.status,
      replayHeader: conflict.replayHeader,
      errorCode: conflict.body.error?.code || ''
    });
  }
  return results;
}

async function main() {
  const mode = process.argv[2];
  const sqlitePath = process.argv[3];
  const storePath = process.argv[4];
  const scenarioPath = process.argv[5] || '';
  if (!mode || !sqlitePath || !storePath) throw new Error('WORLD_GRID_IDEMPOTENCY_RESTART_ARGS_REQUIRED');

  process.env.NODE_ENV = 'test';
  process.env.STORE_PATH = storePath;
  process.env.WORLD_GRID_FEATURE_FLAGS = 'all';
  process.env.WORLD_GRID_IDEMPOTENCY_SQLITE_PATH = sqlitePath;

  if (mode === 'seed') seedFoundersPlot();

  await withServer(async (baseUrl) => {
    if (mode === 'route-matrix-seed') {
      const cases = await seedRouteMatrix(baseUrl);
      const snapshot = durableSnapshot(sqlitePath);
      writeJson({
        ok: cases.every((entry) => entry.expectedStatus === 200),
        mode,
        caseCount: cases.length,
        cases,
        ...snapshot
      });
      return;
    }
    if (mode === 'route-matrix-replay') {
      const results = await replayRouteMatrix(baseUrl, scenarioPath);
      writeJson({
        ok: results.every((entry) => entry.status === 200 && entry.replayHeader === '1' && entry.matchesSeededResponse),
        mode,
        results,
        ...durableSnapshot(sqlitePath)
      });
      return;
    }
    if (mode === 'route-matrix-conflict') {
      const results = await conflictRouteMatrix(baseUrl, scenarioPath);
      writeJson({
        ok: results.every((entry) => entry.status === 409 && entry.errorCode === 'IDEMPOTENCY_CONFLICT'),
        mode,
        results,
        ...durableSnapshot(sqlitePath)
      });
      return;
    }

    const options = await getClaimOptions(baseUrl);
    const target = mode === 'conflict' ? options[1] : options[0];
    const result = await postPlanClaim(baseUrl, {
      cellId: target.cellId,
      idempotencyKey: IDEMPOTENCY_KEY
    });
    const claimCount = await regionClaimCount(baseUrl);
    writeJson({
      ok: result.status === 200 || result.status === 409,
      mode,
      status: result.status,
      replayHeader: result.replayHeader,
      claimId: result.body.claim?.claimId || '',
      errorCode: result.body.error?.code || '',
      claimCount,
      durableCount: durableCount(sqlitePath)
    });
  });
}

main().catch((error) => {
  writeJson({ ok: false, error: error.message });
  process.exitCode = 1;
});
