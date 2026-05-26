const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const express = require('express');

const { createWorldGridRouter } = require('../server/world_grid/routes');
const {
  defaultWorldGridFeatureFlags,
  parseWorldGridFeatureFlags
} = require('../server/world_grid/feature_flags');
const {
  closeWorldGridIdempotencyStore,
  worldGridIdempotencyRecordCount
} = require('../server/world_grid/idempotency');
const { closeWorldGridClaimStore } = require('../server/world_grid/claims');
const {
  generateRegion,
  normalizeOwnerIdentity
} = require('../server/world_grid/region');
const { createInitialPlot } = require('../server/founders_plot/engine');
const { loadPlotByPairId, savePlotGraph } = require('../server/founders_plot/store');
const {
  closeWorldGridAuditLog,
  createWorldGridAuditLog
} = require('../server/world_grid/audit_log');

async function withWorldGridServer({ identity, envPatch = {} }, fn) {
  const previous = {
    NODE_ENV: process.env.NODE_ENV,
    ADMIN_TOKEN: process.env.ADMIN_TOKEN,
    FEATURE_WORLD_GRID_V50_REGION: process.env.FEATURE_WORLD_GRID_V50_REGION,
    WORLD_GRID_FEATURE_FLAGS: process.env.WORLD_GRID_FEATURE_FLAGS,
    WORLD_GRID_CSRF_REQUIRED: process.env.WORLD_GRID_CSRF_REQUIRED,
    WORLD_GRID_CSRF_TOKEN_TTL_MS: process.env.WORLD_GRID_CSRF_TOKEN_TTL_MS,
    WORLD_GRID_AUDIT_SQLITE_PATH: process.env.WORLD_GRID_AUDIT_SQLITE_PATH,
    WORLD_GRID_CLAIMS_SQLITE_PATH: process.env.WORLD_GRID_CLAIMS_SQLITE_PATH,
    WORLD_GRID_IDEMPOTENCY_SQLITE_PATH: process.env.WORLD_GRID_IDEMPOTENCY_SQLITE_PATH,
    WORLD_GRID_MUTATION_RATE_LIMIT_MAX: process.env.WORLD_GRID_MUTATION_RATE_LIMIT_MAX,
    WORLD_GRID_MUTATION_RATE_LIMIT_WINDOW_MS: process.env.WORLD_GRID_MUTATION_RATE_LIMIT_WINDOW_MS
  };
  for (const [key, value] of Object.entries(envPatch)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  const app = express();
  app.use(express.json());
  app.use(createWorldGridRouter({
    resolveIdentity: (req) => (typeof identity === 'function' ? identity(req) : identity)
  }));
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  try {
    return await fn(baseUrl);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    closeWorldGridAuditLog();
    closeWorldGridClaimStore();
    closeWorldGridIdempotencyStore();
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

async function withDynamicWorldGridServer(envPatch, fn) {
  return await withWorldGridServer({
    identity: (req) => ({
      pairId: String(req.header('x-test-pair-id') || 'session:dynamic-unused'),
      houseId: null
    }),
    envPatch
  }, async (baseUrl) => {
    return await fn(baseUrl, (pairId) => ({ 'x-test-pair-id': pairId }));
  });
}

function seedFoundersPlot(pairId, options = {}) {
  const state = createInitialPlot({
    pairId,
    houseId: options.houseId || null,
    nowMs: options.nowMs || Date.now()
  });
  savePlotGraph(state);
  return state;
}

function sameOriginMutationHeaders(baseUrl, extra = {}) {
  return {
    'content-type': 'application/json',
    origin: baseUrl,
    'sec-fetch-site': 'same-origin',
    'sec-fetch-mode': 'cors',
    'sec-fetch-dest': 'empty',
    ...extra
  };
}

async function fetchWorldGridCsrfToken(baseUrl, headers = {}) {
  const response = await fetch(`${baseUrl}/api/world/mutation-token`, { headers });
  const body = await response.json();
  assert.equal(response.status, 200, JSON.stringify(body));
  assert.match(body.csrfToken, /^wgcsrf_[a-f0-9]{48}$/);
  return body.csrfToken;
}

async function postWorldGridJson(baseUrl, route, body = {}, headers = {}) {
  const response = await fetch(`${baseUrl}${route}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body)
  });
  const payload = await response.json();
  return { response, payload };
}

async function assertWorldGridRouteIdempotency({ baseUrl, headers = {}, route, body, conflictBody }) {
  const first = await postWorldGridJson(baseUrl, route, body, headers);
  assert.equal(first.response.status, 200, `${route} first: ${JSON.stringify(first.payload)}`);

  const replay = await postWorldGridJson(baseUrl, route, body, headers);
  assert.equal(replay.response.status, 200, `${route} replay: ${JSON.stringify(replay.payload)}`);
  assert.equal(replay.response.headers.get('x-world-grid-idempotency-replay'), '1', route);
  assert.deepEqual(replay.payload, first.payload, route);

  const conflict = await postWorldGridJson(baseUrl, route, conflictBody, headers);
  assert.equal(conflict.response.status, 409, `${route} conflict: ${JSON.stringify(conflict.payload)}`);
  assert.equal(conflict.payload.error.code, 'IDEMPOTENCY_CONFLICT', route);
  return first.payload;
}

test('V5.0 region generation is deterministic with stable cells and home settlement', () => {
  const identity = { pairId: 'wallet:solana:WorldGridOwner111', houseId: null };
  const one = generateRegion(identity, { nowMs: 1_000, hqLevel: 2 });
  const two = generateRegion(identity, { nowMs: 2_000, hqLevel: 2 });

  assert.equal(one.regionId, two.regionId);
  assert.equal(one.ownerAccountId, two.ownerAccountId);
  assert.equal(one.seed, two.seed);
  assert.equal(one.cells.length, 19);
  assert.deepEqual(
    one.cells.map((cell) => [cell.cellId, cell.q, cell.r, cell.terrain, cell.state, cell.feature, cell.risk]),
    two.cells.map((cell) => [cell.cellId, cell.q, cell.r, cell.terrain, cell.state, cell.feature, cell.risk])
  );
  assert.equal(one.settlements[0].kind, 'home');
  assert.equal(one.cells.filter((cell) => cell.state === 'claimed').length, 1);
  assert.ok(one.cells.every((cell) => cell.cellId.startsWith(`${one.regionId}:`)));
});

test('world grid API is gated off by default and can be enabled by server config', async () => {
  assert.equal(defaultWorldGridFeatureFlags({}).FEATURE_WORLD_V60_AGENT_CIVILIZATION, false);
  assert.equal(parseWorldGridFeatureFlags('all').FEATURE_WORLD_GRID_V55_SANDBOX_DISTRICTS, true);
  assert.equal(parseWorldGridFeatureFlags('all').FEATURE_WORLD_V60_AGENT_CIVILIZATION, false);
  assert.equal(parseWorldGridFeatureFlags('v60').FEATURE_WORLD_V60_AGENT_CIVILIZATION, true);
  assert.equal(parseWorldGridFeatureFlags('all,v60').FEATURE_WORLD_V60_AGENT_CIVILIZATION, true);

  await withWorldGridServer({
    identity: { pairId: 'session:world-grid-default-off' },
    envPatch: { NODE_ENV: 'production', FEATURE_WORLD_GRID_V50_REGION: undefined }
  }, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/world/region`);
    const body = await response.json();
    assert.equal(response.status, 403, JSON.stringify(body));
    assert.equal(body.error.code, 'FEATURE_DISABLED');
  });

  await withWorldGridServer({
    identity: { pairId: 'session:world-grid-server-on' },
    envPatch: { NODE_ENV: 'production', FEATURE_WORLD_GRID_V50_REGION: '1' }
  }, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/world/region`);
    const body = await response.json();
    assert.equal(response.status, 200, JSON.stringify(body));
    assert.equal(body.ok, true);
    assert.equal(body.featureFlags.FEATURE_WORLD_GRID_V50_REGION, true);
    assert.equal(body.region.settlements[0].name, 'Founders Plot');
  });
});

test('production world grid query overrides are ignored unless admin authorized', async () => {
  await withWorldGridServer({
    identity: { pairId: 'session:world-grid-production-query' },
    envPatch: {
      NODE_ENV: 'production',
      ADMIN_TOKEN: 'admin-secret',
      FEATURE_WORLD_GRID_V50_REGION: undefined,
      WORLD_GRID_FEATURE_FLAGS: undefined
    }
  }, async (baseUrl) => {
    const playerResponse = await fetch(`${baseUrl}/api/world/region?worldGridFeatureFlags=all`, {
      headers: { 'x-world-grid-feature-flags': 'all' }
    });
    const playerBody = await playerResponse.json();
    assert.equal(playerResponse.status, 403, JSON.stringify(playerBody));
    assert.equal(playerBody.error.code, 'FEATURE_DISABLED');

    const playerToolsResponse = await fetch(`${baseUrl}/api/world/tools?worldGridFeatureFlags=all`, {
      headers: { 'x-world-grid-feature-flags': 'all' }
    });
    const playerToolsBody = await playerToolsResponse.json();
    assert.equal(playerToolsResponse.status, 403, JSON.stringify(playerToolsBody));
    assert.equal(playerToolsBody.error.code, 'FEATURE_DISABLED');

    const playerMutationResponse = await fetch(`${baseUrl}/api/world/territory/plan-claim?worldGridFeatureFlags=all`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-world-grid-feature-flags': 'all'
      },
      body: JSON.stringify({ cellId: 'region_fake:0,1' })
    });
    const playerMutationBody = await playerMutationResponse.json();
    assert.equal(playerMutationResponse.status, 403, JSON.stringify(playerMutationBody));
    assert.equal(playerMutationBody.error.code, 'FEATURE_DISABLED');
    assert.equal(loadPlotByPairId('session:world-grid-production-query'), null);

    const adminResponse = await fetch(`${baseUrl}/api/world/region`, {
      headers: {
        'x-admin-token': 'admin-secret',
        'x-world-grid-feature-flags': 'all'
      }
    });
    const adminBody = await adminResponse.json();
    assert.equal(adminResponse.status, 200, JSON.stringify(adminBody));
    assert.equal(adminBody.region.cells.length, 19);
    assert.equal(adminBody.featureFlags.FEATURE_WORLD_V60_AGENT_CIVILIZATION, false);

    const adminToolsResponse = await fetch(`${baseUrl}/api/world/tools`, {
      headers: {
        'x-admin-token': 'admin-secret',
        'x-world-grid-feature-flags': 'all'
      }
    });
    const adminToolsBody = await adminToolsResponse.json();
    assert.equal(adminToolsResponse.status, 200, JSON.stringify(adminToolsBody));
    assert.equal(adminToolsBody.tools.every((tool) => typeof tool.featureFlag === 'string'), true);
    assert.equal(adminToolsBody.featureFlags.FEATURE_WORLD_V60_AGENT_CIVILIZATION, false);
    assert.equal(adminToolsBody.tools.some((tool) => tool.featureFlag === 'FEATURE_WORLD_V60_AGENT_CIVILIZATION'), false);

    const adminExplicitV6ToolsResponse = await fetch(`${baseUrl}/api/world/tools`, {
      headers: {
        'x-admin-token': 'admin-secret',
        'x-world-grid-feature-flags': 'all,v60'
      }
    });
    const adminExplicitV6ToolsBody = await adminExplicitV6ToolsResponse.json();
    assert.equal(adminExplicitV6ToolsResponse.status, 200, JSON.stringify(adminExplicitV6ToolsBody));
    assert.equal(adminExplicitV6ToolsBody.featureFlags.FEATURE_WORLD_V60_AGENT_CIVILIZATION, true);
    assert.equal(adminExplicitV6ToolsBody.tools.some((tool) => tool.featureFlag === 'FEATURE_WORLD_V60_AGENT_CIVILIZATION'), false);
    assert.equal(adminExplicitV6ToolsBody.tools.some((tool) => tool.name.startsWith('et.world.civic.')), false);
    assert.equal(adminExplicitV6ToolsBody.tools.some((tool) => /civic\./.test(tool.name)), false);
  });
});

test('world grid focus and read-only tools do not mutate Founders Plot state', async () => {
  const identity = { pairId: 'session:world-grid-readonly' };
  const expectedOwner = normalizeOwnerIdentity(identity);
  await withWorldGridServer({
    identity,
    envPatch: { NODE_ENV: 'test', WORLD_GRID_FEATURE_FLAGS: 'all' }
  }, async (baseUrl) => {
    const stateResponse = await fetch(`${baseUrl}/api/world/region`);
    const stateBody = await stateResponse.json();
    assert.equal(stateResponse.status, 200, JSON.stringify(stateBody));
    assert.equal(stateBody.region.regionId, expectedOwner.regionId);

    const target = stateBody.region.cells.find((cell) => cell.state === 'claimable');
    assert.ok(target);

    const focusResponse = await fetch(`${baseUrl}/api/world/region/focus-cell`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cellId: target.cellId })
    });
    const focusBody = await focusResponse.json();
    assert.equal(focusResponse.status, 200, JSON.stringify(focusBody));
    assert.equal(focusBody.preferences.selectedCellId, target.cellId);

    const toolResponse = await fetch(`${baseUrl}/api/world/tool/et.world.region.explain_cell`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cellId: target.cellId })
    });
    const toolBody = await toolResponse.json();
    assert.equal(toolResponse.status, 200, JSON.stringify(toolBody));
    assert.equal(toolBody.data.cell.cellId, target.cellId);
    assert.equal(toolBody.data.canClaimNow, false);

    const wrongOwnerResponse = await fetch(`${baseUrl}/api/world/region?regionId=region_wrong_owner`);
    const wrongOwnerBody = await wrongOwnerResponse.json();
    assert.equal(wrongOwnerResponse.status, 403, JSON.stringify(wrongOwnerBody));
    assert.equal(wrongOwnerBody.error.code, 'FORBIDDEN');
    assert.equal(loadPlotByPairId(identity.pairId), null);
  });
});

test('mutating world-grid prototype routes require idempotency keys after plot prerequisite', async () => {
  const identity = { pairId: `session:world-grid-idempotency-${Date.now()}-${Math.random().toString(16).slice(2)}` };
  await withWorldGridServer({
    identity,
    envPatch: { NODE_ENV: 'test', WORLD_GRID_FEATURE_FLAGS: 'all' }
  }, async (baseUrl) => {
    seedFoundersPlot(identity.pairId);

    const stateResponse = await fetch(`${baseUrl}/api/world/region`);
    const stateBody = await stateResponse.json();
    assert.equal(stateResponse.status, 200, JSON.stringify(stateBody));
    const target = stateBody.region.cells.find((cell) => cell.state === 'claimable');
    assert.ok(target);

    const missingKeyRoutes = [
      ['/api/world/territory/plan-claim', { cellId: target.cellId }],
      ['/api/world/public-presence/opt-in', { townName: 'Idempotency Town', displayName: 'Founder' }],
      ['/api/world/public-presence/opt-out', {}],
      ['/api/world/follow-town', { publicTownId: 'public_missing' }],
      ['/api/world/services/request-advice', { serviceId: 'service_route_advisor', input: {} }],
      ['/api/world/services/accept-result', { requestId: 'request_missing' }],
      ['/api/world/services/report-issue', { requestId: 'request_missing', reason: 'test' }],
      ['/api/world/events/contribute', { eventId: 'event_great_ridge_bridge', bundle: { coin: 1 } }],
      ['/api/world/events/claim-reward', { eventId: 'event_great_ridge_bridge' }],
      ['/api/world/sandbox/enter', {}],
      ['/api/world/sandbox/place-prop', { payload: { cellId: 'sandbox_cell_0', propId: 'lantern' } }],
      ['/api/world/sandbox/agent-demo', { payload: { cellId: 'sandbox_cell_1', demoKind: 'route-signpost' } }],
      ['/api/world/sandbox/rollback-last', {}],
      ['/api/world/sandbox/leave', {}]
    ];

    for (const [route, body] of missingKeyRoutes) {
      const response = await fetch(`${baseUrl}${route}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body)
      });
      const payload = await response.json();
      assert.equal(response.status, 400, `${route}: ${JSON.stringify(payload)}`);
      assert.equal(payload.error.code, 'INVALID_IDEMPOTENCY_KEY', route);
    }

    const invalidToolResponse = await fetch(`${baseUrl}/api/world/tool/et.world.territory.plan_claim`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cellId: target.cellId, idempotencyKey: 'bad' })
    });
    const invalidToolBody = await invalidToolResponse.json();
    assert.equal(invalidToolResponse.status, 400, JSON.stringify(invalidToolBody));
    assert.equal(invalidToolBody.error.code, 'INVALID_IDEMPOTENCY_KEY');
  });
});

test('mutating world-grid idempotency replays exact responses and rejects conflicting retries', async () => {
  const identity = { pairId: `session:world-grid-idempotency-replay-${Date.now()}-${Math.random().toString(16).slice(2)}` };
  await withWorldGridServer({
    identity,
    envPatch: { NODE_ENV: 'test', WORLD_GRID_FEATURE_FLAGS: 'all' }
  }, async (baseUrl) => {
    seedFoundersPlot(identity.pairId);
    const beforeRecordCount = worldGridIdempotencyRecordCount();

    const optionsResponse = await fetch(`${baseUrl}/api/world/territory/claim-options`);
    const optionsBody = await optionsResponse.json();
    assert.equal(optionsResponse.status, 200, JSON.stringify(optionsBody));
    assert.ok(optionsBody.options.length >= 2);
    const [firstOption, secondOption] = optionsBody.options;

    const planBody = { cellId: firstOption.cellId, idempotencyKey: 'idempotency_replay_plan_001' };
    const planResponse = await fetch(`${baseUrl}/api/world/territory/plan-claim`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(planBody)
    });
    const plan = await planResponse.json();
    assert.equal(planResponse.status, 200, JSON.stringify(plan));

    const planReplayResponse = await fetch(`${baseUrl}/api/world/territory/plan-claim`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(planBody)
    });
    const planReplay = await planReplayResponse.json();
    assert.equal(planReplayResponse.status, 200, JSON.stringify(planReplay));
    assert.equal(planReplayResponse.headers.get('x-world-grid-idempotency-replay'), '1');
    assert.deepEqual(planReplay, plan);

    const planConflictResponse = await fetch(`${baseUrl}/api/world/territory/plan-claim`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cellId: secondOption.cellId, idempotencyKey: planBody.idempotencyKey })
    });
    const planConflict = await planConflictResponse.json();
    assert.equal(planConflictResponse.status, 409, JSON.stringify(planConflict));
    assert.equal(planConflict.error.code, 'IDEMPOTENCY_CONFLICT');

    const regionAfterPlan = await (await fetch(`${baseUrl}/api/world/region`)).json();
    assert.equal(regionAfterPlan.territory.claims.length, 1);

    const serviceBody = {
      serviceId: 'service_route_advisor',
      input: { selectedCell: firstOption, brainSecrets: 'must-not-persist' },
      idempotencyKey: 'idempotency_replay_service_001'
    };
    const serviceResponse = await fetch(`${baseUrl}/api/world/services/request-advice`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(serviceBody)
    });
    const service = await serviceResponse.json();
    assert.equal(serviceResponse.status, 200, JSON.stringify(service));

    const serviceReplayResponse = await fetch(`${baseUrl}/api/world/services/request-advice`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(serviceBody)
    });
    const serviceReplay = await serviceReplayResponse.json();
    assert.equal(serviceReplayResponse.status, 200, JSON.stringify(serviceReplay));
    assert.equal(serviceReplayResponse.headers.get('x-world-grid-idempotency-replay'), '1');
    assert.equal(serviceReplay.request.requestId, service.request.requestId);

    const serviceConflictResponse = await fetch(`${baseUrl}/api/world/services/request-advice`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...serviceBody,
        input: { selectedCell: secondOption }
      })
    });
    const serviceConflict = await serviceConflictResponse.json();
    assert.equal(serviceConflictResponse.status, 409, JSON.stringify(serviceConflict));
    assert.equal(serviceConflict.error.code, 'IDEMPOTENCY_CONFLICT');

    const servicesState = await (await fetch(`${baseUrl}/api/world/services`)).json();
    assert.equal(servicesState.requests.length, 1);

    const sandboxBody = {
      payload: { cellId: 'sandbox_cell_0', propId: 'lantern' },
      idempotencyKey: 'idempotency_replay_sandbox_001'
    };
    const sandboxResponse = await fetch(`${baseUrl}/api/world/sandbox/place-prop`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(sandboxBody)
    });
    const sandbox = await sandboxResponse.json();
    assert.equal(sandboxResponse.status, 200, JSON.stringify(sandbox));

    const sandboxReplayResponse = await fetch(`${baseUrl}/api/world/sandbox/place-prop`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(sandboxBody)
    });
    const sandboxReplay = await sandboxReplayResponse.json();
    assert.equal(sandboxReplayResponse.status, 200, JSON.stringify(sandboxReplay));
    assert.equal(sandboxReplayResponse.headers.get('x-world-grid-idempotency-replay'), '1');
    assert.equal(sandboxReplay.action.actionId, sandbox.action.actionId);

    const sandboxConflictResponse = await fetch(`${baseUrl}/api/world/sandbox/place-prop`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        payload: { cellId: 'sandbox_cell_0', propId: 'bench' },
        idempotencyKey: sandboxBody.idempotencyKey
      })
    });
    const sandboxConflict = await sandboxConflictResponse.json();
    assert.equal(sandboxConflictResponse.status, 409, JSON.stringify(sandboxConflict));
    assert.equal(sandboxConflict.error.code, 'IDEMPOTENCY_CONFLICT');

    const sandboxCleanupResponse = await fetch(`${baseUrl}/api/world/sandbox/rollback-last`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ idempotencyKey: 'idempotency_replay_sandbox_cleanup' })
    });
    const sandboxCleanup = await sandboxCleanupResponse.json();
    assert.equal(sandboxCleanupResponse.status, 200, JSON.stringify(sandboxCleanup));
    assert.equal(sandboxCleanup.restored, true);

    assert.equal(worldGridIdempotencyRecordCount(), beforeRecordCount + 4);
  });
});

test('all externally visible mutating world-grid routes replay exact idempotent successes and reject conflicts', async () => {
  await withDynamicWorldGridServer({
    NODE_ENV: 'test',
    WORLD_GRID_FEATURE_FLAGS: 'all'
  }, async (baseUrl, headersFor) => {
    const ownerA = `session:world-grid-idempotency-matrix-a-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const ownerB = `session:world-grid-idempotency-matrix-b-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    seedFoundersPlot(ownerA);
    seedFoundersPlot(ownerB);
    const headersA = headersFor(ownerA);
    const headersB = headersFor(ownerB);

    const optionsResponse = await fetch(`${baseUrl}/api/world/territory/claim-options`, { headers: headersA });
    const optionsBody = await optionsResponse.json();
    assert.equal(optionsResponse.status, 200, JSON.stringify(optionsBody));
    assert.ok(optionsBody.options.length >= 5);
    const [planOption, cancelOption, completeOption, conflictOption] = optionsBody.options;

    await assertWorldGridRouteIdempotency({
      baseUrl,
      headers: headersA,
      route: '/api/world/territory/plan-claim',
      body: { cellId: planOption.cellId, idempotencyKey: 'matrix_plan_claim_001' },
      conflictBody: { cellId: conflictOption.cellId, idempotencyKey: 'matrix_plan_claim_001' }
    });

    const cancelPrep = await postWorldGridJson(baseUrl, '/api/world/territory/plan-claim', {
      cellId: cancelOption.cellId,
      idempotencyKey: 'matrix_cancel_prep_001'
    }, headersA);
    assert.equal(cancelPrep.response.status, 200, JSON.stringify(cancelPrep.payload));
    await assertWorldGridRouteIdempotency({
      baseUrl,
      headers: headersA,
      route: '/api/world/territory/cancel-claim',
      body: { claimId: cancelPrep.payload.claim.claimId, idempotencyKey: 'matrix_cancel_claim_001' },
      conflictBody: { claimId: 'claim_matrix_missing', idempotencyKey: 'matrix_cancel_claim_001' }
    });

    const completePrep = await postWorldGridJson(baseUrl, '/api/world/territory/plan-claim', {
      cellId: completeOption.cellId,
      idempotencyKey: 'matrix_complete_prep_001'
    }, headersA);
    assert.equal(completePrep.response.status, 200, JSON.stringify(completePrep.payload));
    await assertWorldGridRouteIdempotency({
      baseUrl,
      headers: headersA,
      route: '/api/world/territory/complete-claim',
      body: { claimId: completePrep.payload.claim.claimId, idempotencyKey: 'matrix_complete_claim_001' },
      conflictBody: { claimId: 'claim_matrix_missing', idempotencyKey: 'matrix_complete_claim_001' }
    });

    const publicOwnerB = await assertWorldGridRouteIdempotency({
      baseUrl,
      headers: headersB,
      route: '/api/world/public-presence/opt-in',
      body: { townName: 'Matrix Neighbor', displayName: 'Neighbor', idempotencyKey: 'matrix_public_optin_b_001' },
      conflictBody: { townName: 'Matrix Neighbor Changed', displayName: 'Neighbor', idempotencyKey: 'matrix_public_optin_b_001' }
    });
    const publicOwnerA = await assertWorldGridRouteIdempotency({
      baseUrl,
      headers: headersA,
      route: '/api/world/public-presence/opt-in',
      body: { townName: 'Matrix Home', displayName: 'Founder', idempotencyKey: 'matrix_public_optin_a_001' },
      conflictBody: { townName: 'Matrix Home Changed', displayName: 'Founder', idempotencyKey: 'matrix_public_optin_a_001' }
    });
    await assertWorldGridRouteIdempotency({
      baseUrl,
      headers: headersA,
      route: '/api/world/follow-town',
      body: { publicTownId: publicOwnerB.town.publicTownId, idempotencyKey: 'matrix_follow_town_001' },
      conflictBody: { publicTownId: publicOwnerA.town.publicTownId, idempotencyKey: 'matrix_follow_town_001' }
    });
    await assertWorldGridRouteIdempotency({
      baseUrl,
      headers: headersA,
      route: '/api/world/public-presence/opt-out',
      body: { idempotencyKey: 'matrix_public_optout_001' },
      conflictBody: { reason: 'changed', idempotencyKey: 'matrix_public_optout_001' }
    });

    const serviceRequest = await assertWorldGridRouteIdempotency({
      baseUrl,
      headers: headersA,
      route: '/api/world/services/request-advice',
      body: {
        serviceId: 'service_route_advisor',
        input: { selectedCell: planOption, brainSecrets: 'redact-me' },
        idempotencyKey: 'matrix_service_request_001'
      },
      conflictBody: {
        serviceId: 'service_route_advisor',
        input: { selectedCell: conflictOption },
        idempotencyKey: 'matrix_service_request_001'
      }
    });
    await assertWorldGridRouteIdempotency({
      baseUrl,
      headers: headersA,
      route: '/api/world/services/accept-result',
      body: { requestId: serviceRequest.request.requestId, idempotencyKey: 'matrix_service_accept_001' },
      conflictBody: { requestId: 'svc_req_matrix_missing', idempotencyKey: 'matrix_service_accept_001' }
    });
    const reportPrep = await postWorldGridJson(baseUrl, '/api/world/services/request-advice', {
      serviceId: 'service_public_works_planner',
      input: { claimSummary: cancelOption },
      idempotencyKey: 'matrix_service_report_prep_001'
    }, headersA);
    assert.equal(reportPrep.response.status, 200, JSON.stringify(reportPrep.payload));
    await assertWorldGridRouteIdempotency({
      baseUrl,
      headers: headersA,
      route: '/api/world/services/report-issue',
      body: { requestId: reportPrep.payload.request.requestId, reason: 'bad advice', idempotencyKey: 'matrix_service_report_001' },
      conflictBody: { requestId: reportPrep.payload.request.requestId, reason: 'changed reason', idempotencyKey: 'matrix_service_report_001' }
    });

    await assertWorldGridRouteIdempotency({
      baseUrl,
      headers: headersA,
      route: '/api/world/events/contribute',
      body: { eventId: 'event_great_ridge_bridge', bundle: { coin: 1 }, idempotencyKey: 'matrix_event_contribute_001' },
      conflictBody: { eventId: 'event_great_ridge_bridge', bundle: { coin: 2 }, idempotencyKey: 'matrix_event_contribute_001' }
    });
    await assertWorldGridRouteIdempotency({
      baseUrl,
      headers: headersA,
      route: '/api/world/events/claim-reward',
      body: { eventId: 'event_great_ridge_bridge', idempotencyKey: 'matrix_event_reward_001' },
      conflictBody: { eventId: 'event_great_ridge_bridge', ownerAccountId: 'owner_mismatch', idempotencyKey: 'matrix_event_reward_001' }
    });

    await assertWorldGridRouteIdempotency({
      baseUrl,
      headers: headersA,
      route: '/api/world/sandbox/enter',
      body: { idempotencyKey: 'matrix_sandbox_enter_001' },
      conflictBody: { note: 'changed', idempotencyKey: 'matrix_sandbox_enter_001' }
    });
    await assertWorldGridRouteIdempotency({
      baseUrl,
      headers: headersA,
      route: '/api/world/sandbox/place-prop',
      body: { payload: { cellId: 'sandbox_cell_0', propId: 'lantern' }, idempotencyKey: 'matrix_sandbox_place_001' },
      conflictBody: { payload: { cellId: 'sandbox_cell_0', propId: 'bench' }, idempotencyKey: 'matrix_sandbox_place_001' }
    });
    await assertWorldGridRouteIdempotency({
      baseUrl,
      headers: headersA,
      route: '/api/world/sandbox/agent-demo',
      body: { payload: { cellId: 'sandbox_cell_1', demoKind: 'route-signpost' }, idempotencyKey: 'matrix_sandbox_agent_001' },
      conflictBody: { payload: { cellId: 'sandbox_cell_2', demoKind: 'route-signpost' }, idempotencyKey: 'matrix_sandbox_agent_001' }
    });
    await assertWorldGridRouteIdempotency({
      baseUrl,
      headers: headersA,
      route: '/api/world/sandbox/rollback-last',
      body: { idempotencyKey: 'matrix_sandbox_rollback_001' },
      conflictBody: { note: 'changed', idempotencyKey: 'matrix_sandbox_rollback_001' }
    });
    const sandboxCleanup = await postWorldGridJson(baseUrl, '/api/world/sandbox/rollback-last', {
      idempotencyKey: 'matrix_sandbox_cleanup_001'
    }, headersA);
    assert.equal(sandboxCleanup.response.status, 200, JSON.stringify(sandboxCleanup.payload));
    assert.equal(sandboxCleanup.payload.restored, true);
    await assertWorldGridRouteIdempotency({
      baseUrl,
      headers: headersA,
      route: '/api/world/sandbox/leave',
      body: { idempotencyKey: 'matrix_sandbox_leave_001' },
      conflictBody: { note: 'changed', idempotencyKey: 'matrix_sandbox_leave_001' }
    });
  });
});

test('mutating world-grid routes write durable audit replay records when configured', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-world-grid-audit-'));
  const sqlitePath = path.join(dir, 'world-grid-audit.sqlite');
  const identity = { pairId: `session:world-grid-audit-${Date.now()}-${Math.random().toString(16).slice(2)}` };
  try {
    await withWorldGridServer({
      identity,
      envPatch: {
        NODE_ENV: 'test',
        WORLD_GRID_FEATURE_FLAGS: 'all',
        WORLD_GRID_AUDIT_SQLITE_PATH: sqlitePath
      }
    }, async (baseUrl) => {
      seedFoundersPlot(identity.pairId);

      const optionsResponse = await fetch(`${baseUrl}/api/world/territory/claim-options`);
      const optionsBody = await optionsResponse.json();
      assert.equal(optionsResponse.status, 200, JSON.stringify(optionsBody));
      const option = optionsBody.options[0];
      assert.ok(option);

      const planBody = {
        cellId: option.cellId,
        idempotencyKey: 'audit_plan_claim_001'
      };
      const planResponse = await fetch(`${baseUrl}/api/world/territory/plan-claim`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(planBody)
      });
      const plan = await planResponse.json();
      assert.equal(planResponse.status, 200, JSON.stringify(plan));

      const replayResponse = await fetch(`${baseUrl}/api/world/territory/plan-claim`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(planBody)
      });
      const replay = await replayResponse.json();
      assert.equal(replayResponse.status, 200, JSON.stringify(replay));
      assert.equal(replayResponse.headers.get('x-world-grid-idempotency-replay'), '1');

      const serviceResponse = await fetch(`${baseUrl}/api/world/services/request-advice`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          serviceId: 'service_route_advisor',
          input: {
            selectedCell: option,
            brainSecrets: 'must-not-persist-in-audit'
          },
          idempotencyKey: 'audit_service_request_001'
        })
      });
      const service = await serviceResponse.json();
      assert.equal(serviceResponse.status, 200, JSON.stringify(service));
    });

    const owner = normalizeOwnerIdentity(identity);
    const ledger = createWorldGridAuditLog({ sqlitePath });
    assert.equal(ledger.count(), 2);
    const entries = ledger.replay({ actorAccountId: owner.ownerAccountId });
    assert.equal(entries.length, 2);
    assert.equal(entries[0].actorAccountId, owner.ownerAccountId);
    assert.equal(entries[0].regionId, owner.regionId);
    assert.equal(entries[0].surface, '/api/world/territory/plan-claim');
    assert.equal(entries[0].idempotencyKey, 'audit_plan_claim_001');
    assert.equal(entries[0].entry.objectRef, entries[0].entry.afterSummary.objectRef);
    assert.match(entries[0].entry.objectRef, /^claim_/);
    assert.equal(entries[0].entry.privacy.privateDataIncluded, false);
    assert.equal(entries[0].entry.beforeSummary.state, 'unrecorded-prototype-before-state');
    const serviceEntry = entries.find((entry) => entry.surface === '/api/world/services/request-advice');
    assert.ok(serviceEntry);
    assert.equal(JSON.stringify(serviceEntry.entry).includes('must-not-persist-in-audit'), false);
    assert.equal(serviceEntry.entry.privacy.privateDataIncluded, false);
    ledger.close();

    const reopened = createWorldGridAuditLog({ sqlitePath });
    assert.equal(reopened.count(), 2);
    assert.equal(reopened.replay({ surface: '/api/world/territory/plan-claim' }).length, 1);
    assert.equal(reopened.replay({ surface: '/api/world/services/request-advice' }).length, 1);
    reopened.close();
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('mutating world-grid routes reject cross-origin metadata and require same-origin context in production', async () => {
  const identity = { pairId: `session:world-grid-origin-${Date.now()}-${Math.random().toString(16).slice(2)}` };
  await withWorldGridServer({
    identity,
    envPatch: { NODE_ENV: 'production', WORLD_GRID_FEATURE_FLAGS: 'all' }
  }, async (baseUrl) => {
    seedFoundersPlot(identity.pairId);

    const optionsResponse = await fetch(`${baseUrl}/api/world/territory/claim-options`);
    const optionsBody = await optionsResponse.json();
    assert.equal(optionsResponse.status, 200, JSON.stringify(optionsBody));
    assert.ok(optionsBody.options.length >= 2);
    const [firstOption, secondOption] = optionsBody.options;

    const missingContextResponse = await fetch(`${baseUrl}/api/world/territory/plan-claim`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cellId: firstOption.cellId, idempotencyKey: 'origin_missing_context_001' })
    });
    const missingContext = await missingContextResponse.json();
    assert.equal(missingContextResponse.status, 403, JSON.stringify(missingContext));
    assert.equal(missingContext.error.code, 'FORBIDDEN_ORIGIN');

    const crossOriginResponse = await fetch(`${baseUrl}/api/world/territory/plan-claim`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'https://evil.example',
        'sec-fetch-site': 'same-origin',
        'sec-fetch-mode': 'cors',
        'sec-fetch-dest': 'empty'
      },
      body: JSON.stringify({ cellId: firstOption.cellId, idempotencyKey: 'origin_cross_site_001' })
    });
    const crossOrigin = await crossOriginResponse.json();
    assert.equal(crossOriginResponse.status, 403, JSON.stringify(crossOrigin));
    assert.equal(crossOrigin.error.code, 'FORBIDDEN_ORIGIN');

    const crossFetchResponse = await fetch(`${baseUrl}/api/world/tool/et.world.territory.plan_claim`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'sec-fetch-site': 'cross-site',
        'sec-fetch-mode': 'cors',
        'sec-fetch-dest': 'empty'
      },
      body: JSON.stringify({ cellId: secondOption.cellId, idempotencyKey: 'origin_cross_fetch_001' })
    });
    const crossFetch = await crossFetchResponse.json();
    assert.equal(crossFetchResponse.status, 403, JSON.stringify(crossFetch));
    assert.equal(crossFetch.error.code, 'FORBIDDEN_ORIGIN');

    const csrfToken = await fetchWorldGridCsrfToken(baseUrl, sameOriginMutationHeaders(baseUrl));
    const sameOriginResponse = await fetch(`${baseUrl}/api/world/territory/plan-claim`, {
      method: 'POST',
      headers: sameOriginMutationHeaders(baseUrl, { 'x-world-grid-csrf': csrfToken }),
      body: JSON.stringify({ cellId: firstOption.cellId, idempotencyKey: 'origin_same_origin_001' })
    });
    const sameOrigin = await sameOriginResponse.json();
    assert.equal(sameOriginResponse.status, 200, JSON.stringify(sameOrigin));
    assert.equal(sameOrigin.claim.cellId, firstOption.cellId);

    const regionAfterOriginChecks = await (await fetch(`${baseUrl}/api/world/region`)).json();
    assert.equal(regionAfterOriginChecks.territory.claims.length, 1);
  });
});

test('mutating world-grid routes require owner-bound CSRF tokens in production', async () => {
  await withDynamicWorldGridServer({
    NODE_ENV: 'production',
    WORLD_GRID_FEATURE_FLAGS: 'all'
  }, async (baseUrl, headersFor) => {
    const ownerA = `session:world-grid-csrf-a-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const ownerB = `session:world-grid-csrf-b-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    seedFoundersPlot(ownerA);
    seedFoundersPlot(ownerB);
    const headersA = headersFor(ownerA);
    const headersB = headersFor(ownerB);

    const optionsResponse = await fetch(`${baseUrl}/api/world/territory/claim-options`, { headers: headersA });
    const optionsBody = await optionsResponse.json();
    assert.equal(optionsResponse.status, 200, JSON.stringify(optionsBody));
    const option = optionsBody.options[0];
    assert.ok(option);

    const missingTokenResponse = await fetch(`${baseUrl}/api/world/territory/plan-claim`, {
      method: 'POST',
      headers: sameOriginMutationHeaders(baseUrl, headersA),
      body: JSON.stringify({ cellId: option.cellId, idempotencyKey: 'csrf_missing_001' })
    });
    const missingToken = await missingTokenResponse.json();
    assert.equal(missingTokenResponse.status, 403, JSON.stringify(missingToken));
    assert.equal(missingToken.error.code, 'CSRF_REQUIRED');

    const invalidTokenResponse = await fetch(`${baseUrl}/api/world/territory/plan-claim`, {
      method: 'POST',
      headers: sameOriginMutationHeaders(baseUrl, { ...headersA, 'x-world-grid-csrf': 'wgcsrf_invalid' }),
      body: JSON.stringify({ cellId: option.cellId, idempotencyKey: 'csrf_invalid_001' })
    });
    const invalidToken = await invalidTokenResponse.json();
    assert.equal(invalidTokenResponse.status, 403, JSON.stringify(invalidToken));
    assert.equal(invalidToken.error.code, 'CSRF_INVALID');

    const csrfTokenA = await fetchWorldGridCsrfToken(baseUrl, sameOriginMutationHeaders(baseUrl, headersA));
    const wrongOwnerResponse = await fetch(`${baseUrl}/api/world/territory/plan-claim`, {
      method: 'POST',
      headers: sameOriginMutationHeaders(baseUrl, { ...headersB, 'x-world-grid-csrf': csrfTokenA }),
      body: JSON.stringify({ cellId: option.cellId, idempotencyKey: 'csrf_wrong_owner_001' })
    });
    const wrongOwner = await wrongOwnerResponse.json();
    assert.equal(wrongOwnerResponse.status, 403, JSON.stringify(wrongOwner));
    assert.equal(wrongOwner.error.code, 'CSRF_INVALID');

    const validResponse = await fetch(`${baseUrl}/api/world/territory/plan-claim`, {
      method: 'POST',
      headers: sameOriginMutationHeaders(baseUrl, { ...headersA, 'x-world-grid-csrf': csrfTokenA }),
      body: JSON.stringify({ cellId: option.cellId, idempotencyKey: 'csrf_valid_001' })
    });
    const valid = await validResponse.json();
    assert.equal(validResponse.status, 200, JSON.stringify(valid));
    assert.equal(valid.claim.cellId, option.cellId);

    const regionAfterCsrf = await (await fetch(`${baseUrl}/api/world/region`, { headers: headersA })).json();
    assert.equal(regionAfterCsrf.territory.claims.length, 1);
  });
});

test('mutating world-grid routes enforce prototype owner and surface rate limits', async () => {
  const identity = { pairId: `session:world-grid-rate-${Date.now()}-${Math.random().toString(16).slice(2)}` };
  await withWorldGridServer({
    identity,
    envPatch: {
      NODE_ENV: 'test',
      WORLD_GRID_FEATURE_FLAGS: 'all',
      WORLD_GRID_MUTATION_RATE_LIMIT_MAX: '2',
      WORLD_GRID_MUTATION_RATE_LIMIT_WINDOW_MS: '60000'
    }
  }, async (baseUrl) => {
    seedFoundersPlot(identity.pairId);

    const optionsResponse = await fetch(`${baseUrl}/api/world/territory/claim-options`);
    const optionsBody = await optionsResponse.json();
    assert.equal(optionsResponse.status, 200, JSON.stringify(optionsBody));
    const option = optionsBody.options[0];
    assert.ok(option);

    const planBody = { cellId: option.cellId, idempotencyKey: 'rate_limit_plan_001' };
    const firstPlanResponse = await fetch(`${baseUrl}/api/world/territory/plan-claim`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(planBody)
    });
    const firstPlan = await firstPlanResponse.json();
    assert.equal(firstPlanResponse.status, 200, JSON.stringify(firstPlan));
    assert.equal(firstPlanResponse.headers.get('x-ratelimit-limit'), '2');
    assert.equal(firstPlanResponse.headers.get('x-ratelimit-remaining'), '1');

    const secondPlanResponse = await fetch(`${baseUrl}/api/world/territory/plan-claim`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(planBody)
    });
    const secondPlan = await secondPlanResponse.json();
    assert.equal(secondPlanResponse.status, 200, JSON.stringify(secondPlan));
    assert.equal(secondPlanResponse.headers.get('x-world-grid-idempotency-replay'), '1');
    assert.equal(secondPlanResponse.headers.get('x-ratelimit-remaining'), '0');

    const thirdPlanResponse = await fetch(`${baseUrl}/api/world/territory/plan-claim`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(planBody)
    });
    const thirdPlan = await thirdPlanResponse.json();
    assert.equal(thirdPlanResponse.status, 429, JSON.stringify(thirdPlan));
    assert.equal(thirdPlan.error.code, 'RATE_LIMITED');
    assert.ok(Number(thirdPlanResponse.headers.get('retry-after')) >= 1);

    const serviceResponse = await fetch(`${baseUrl}/api/world/services/request-advice`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        serviceId: 'service_route_advisor',
        input: { selectedCell: option },
        idempotencyKey: 'rate_limit_service_001'
      })
    });
    const service = await serviceResponse.json();
    assert.equal(serviceResponse.status, 200, JSON.stringify(service));
    assert.equal(serviceResponse.headers.get('x-ratelimit-remaining'), '1');
  });
});

test('V5.1+ mutating world-grid routes require an existing Founders Plot without side effects', async () => {
  const identity = { pairId: `session:world-grid-missing-plot-${Date.now()}-${Math.random().toString(16).slice(2)}` };
  await withWorldGridServer({
    identity,
    envPatch: { NODE_ENV: 'test', WORLD_GRID_FEATURE_FLAGS: 'all' }
  }, async (baseUrl) => {
    assert.equal(loadPlotByPairId(identity.pairId), null);

    const stateResponse = await fetch(`${baseUrl}/api/world/region`);
    const stateBody = await stateResponse.json();
    assert.equal(stateResponse.status, 200, JSON.stringify(stateBody));
    const target = stateBody.region.cells.find((cell) => cell.state === 'claimable');
    assert.ok(target);

    const focusResponse = await fetch(`${baseUrl}/api/world/region/focus-cell`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cellId: target.cellId })
    });
    assert.equal(focusResponse.status, 200, await focusResponse.text());
    assert.equal(loadPlotByPairId(identity.pairId), null);

    const planResponse = await fetch(`${baseUrl}/api/world/territory/plan-claim`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cellId: target.cellId })
    });
    const planBody = await planResponse.json();
    assert.equal(planResponse.status, 409, JSON.stringify(planBody));
    assert.equal(planBody.error.code, 'WORLD_GRID_PLOT_REQUIRED');
    assert.equal(loadPlotByPairId(identity.pairId), null);

    const eventResponse = await fetch(`${baseUrl}/api/world/events/contribute`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ eventId: 'event_great_ridge_bridge', bundle: { coin: 1 }, idempotencyKey: 'missing-plot' })
    });
    const eventBody = await eventResponse.json();
    assert.equal(eventResponse.status, 409, JSON.stringify(eventBody));
    assert.equal(eventBody.error.code, 'WORLD_GRID_PLOT_REQUIRED');
    assert.equal(loadPlotByPairId(identity.pairId), null);

    const sandboxResponse = await fetch(`${baseUrl}/api/world/sandbox/enter`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({})
    });
    const sandboxBody = await sandboxResponse.json();
    assert.equal(sandboxResponse.status, 409, JSON.stringify(sandboxBody));
    assert.equal(sandboxBody.error.code, 'WORLD_GRID_PLOT_REQUIRED');
    assert.equal(loadPlotByPairId(identity.pairId), null);
  });
});

test('runtime world-grid tools are feature-gated and match the pack manifest metadata', async () => {
  const manifestPath = path.join(__dirname, '..', 'public', 'experiences', 'world-grid', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const manifestTools = Array.isArray(manifest.toolMetadata) ? manifest.toolMetadata : [];

  await withWorldGridServer({
    identity: { pairId: 'session:world-grid-tool-parity' },
    envPatch: { NODE_ENV: 'test', WORLD_GRID_FEATURE_FLAGS: 'all' }
  }, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/world/tools`);
    const body = await response.json();
    assert.equal(response.status, 200, JSON.stringify(body));
    assert.equal(body.featureFlags.FEATURE_WORLD_V60_AGENT_CIVILIZATION, false);
    assert.equal(body.tools.every((tool) => typeof tool.featureFlag === 'string' && tool.featureFlag.startsWith('FEATURE_WORLD_GRID_')), true);

    const runtimePairs = body.tools
      .map((tool) => [tool.name, tool.featureFlag])
      .sort((a, b) => a[0].localeCompare(b[0]));
    const manifestPairs = manifestTools
      .map((tool) => [tool.name, tool.featureFlag])
      .sort((a, b) => a[0].localeCompare(b[0]));
    assert.deepEqual(manifestPairs, runtimePairs);
  });
});

test('V5.1 territory claim tools plan and complete one adjacent claim with exact resource spend', async () => {
  const identity = { pairId: `session:world-grid-v51-claim-${Date.now()}-${Math.random().toString(16).slice(2)}` };
  await withWorldGridServer({
    identity,
    envPatch: { NODE_ENV: 'test', WORLD_GRID_FEATURE_FLAGS: 'all' }
  }, async (baseUrl) => {
    seedFoundersPlot(identity.pairId);

    const toolsResponse = await fetch(`${baseUrl}/api/world/tools`);
    const toolsBody = await toolsResponse.json();
    assert.equal(toolsResponse.status, 200, JSON.stringify(toolsBody));
    assert.equal(toolsBody.tools.some((tool) => tool.name === 'et.world.territory.complete_claim'), true);

    const optionsResponse = await fetch(`${baseUrl}/api/world/territory/claim-options`);
    const optionsBody = await optionsResponse.json();
    assert.equal(optionsResponse.status, 200, JSON.stringify(optionsBody));
    assert.ok(optionsBody.options.length >= 2);

    const option = optionsBody.options.find((candidate) => (candidate.cost.coin || 0) <= 20) || optionsBody.options[0];

    const planResponse = await fetch(`${baseUrl}/api/world/territory/plan-claim`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cellId: option.cellId, idempotencyKey: 'v51_plan_claim_001' })
    });
    const planBody = await planResponse.json();
    assert.equal(planResponse.status, 200, JSON.stringify(planBody));
    assert.equal(planBody.claim.cellId, option.cellId);
    assert.equal(planBody.claim.status, 'planned');
    assert.deepEqual(planBody.claim.cost, option.cost);

    const completeResponse = await fetch(`${baseUrl}/api/world/territory/complete-claim`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ claimId: planBody.claim.claimId, idempotencyKey: 'v51_complete_claim_001' })
    });
    const completeBody = await completeResponse.json();
    assert.equal(completeResponse.status, 200, JSON.stringify(completeBody));
    assert.equal(completeBody.claim.status, 'claimed');
    assert.equal(completeBody.region.cells.find((cell) => cell.cellId === option.cellId)?.state, 'claimed');
    assert.equal(completeBody.region.routes.some((route) => route.status === 'open' && route.pathCellIds.includes(option.cellId)), true);

    const plot = loadPlotByPairId(identity.pairId);
    assert.ok(plot?.plot?.inventory);
    assert.equal(plot.plot.inventory.wood, 0 - (option.cost.wood || 0));
    assert.equal(plot.plot.inventory.food, 0 - (option.cost.food || 0));
    assert.equal(plot.plot.inventory.stone, 0 - (option.cost.stone || 0));
    assert.equal(plot.plot.inventory.coin, 20 - (option.cost.coin || 0));

    const replayCompleteResponse = await fetch(`${baseUrl}/api/world/territory/complete-claim`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ claimId: planBody.claim.claimId, idempotencyKey: 'v51_complete_claim_002' })
    });
    const replayCompleteBody = await replayCompleteResponse.json();
    assert.equal(replayCompleteResponse.status, 200, JSON.stringify(replayCompleteBody));
    const plotAfterReplay = loadPlotByPairId(identity.pairId);
    assert.deepEqual(plotAfterReplay.plot.inventory, plot.plot.inventory);
  });
});

test('V5.2 public presence is opt-in, redacted, followable, and removable', async () => {
  await withDynamicWorldGridServer({
    NODE_ENV: 'test',
    WORLD_GRID_FEATURE_FLAGS: 'all'
  }, async (baseUrl, headersFor) => {
    const ownerA = `session:world-grid-public-a-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const ownerB = `session:world-grid-public-b-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    seedFoundersPlot(ownerA);
    seedFoundersPlot(ownerB);

    const optInA = await fetch(`${baseUrl}/api/world/public-presence/opt-in`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headersFor(ownerA) },
      body: JSON.stringify({
        displayName: 'Founder A',
        townName: 'Copper Lantern',
        idempotencyKey: 'v52_opt_in_owner_a',
        privacy: { showOperatingStyle: true, showRegion: true, allowVisits: true }
      })
    });
    const optInABody = await optInA.json();
    assert.equal(optInA.status, 200, JSON.stringify(optInABody));
    assert.equal(optInABody.town.townName, 'Copper Lantern');

    const listA = await fetch(`${baseUrl}/api/world/public-towns`, {
      headers: headersFor(ownerB)
    });
    const listABody = await listA.json();
    assert.equal(listA.status, 200, JSON.stringify(listABody));
    assert.equal(listABody.towns.some((town) => town.publicTownId === optInABody.town.publicTownId), true);
    const serialized = JSON.stringify(listABody);
    assert.equal(serialized.includes(ownerA), false);
    assert.equal(/brain|wallet|runtime|provider|secret/i.test(serialized), false);

    const follow = await fetch(`${baseUrl}/api/world/follow-town`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headersFor(ownerB) },
      body: JSON.stringify({ publicTownId: optInABody.town.publicTownId, idempotencyKey: 'v52_follow_owner_b' })
    });
    const followBody = await follow.json();
    assert.equal(follow.status, 200, JSON.stringify(followBody));
    assert.equal(followBody.followed, true);

    const summarize = await fetch(`${baseUrl}/api/world/tool/et.world.public.summarize_neighbor`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headersFor(ownerB) },
      body: JSON.stringify({ publicTownId: optInABody.town.publicTownId })
    });
    const summarizeBody = await summarize.json();
    assert.equal(summarize.status, 200, JSON.stringify(summarizeBody));
    assert.match(summarizeBody.data.summary, /Copper Lantern/);

    const optOutA = await fetch(`${baseUrl}/api/world/public-presence/opt-out`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headersFor(ownerA) },
      body: JSON.stringify({ idempotencyKey: 'v52_opt_out_owner_a' })
    });
    const optOutABody = await optOutA.json();
    assert.equal(optOutA.status, 200, JSON.stringify(optOutABody));
    assert.equal(optOutABody.removed, true);

    const listAfter = await fetch(`${baseUrl}/api/world/public-towns`, {
      headers: headersFor(ownerB)
    });
    const listAfterBody = await listAfter.json();
    assert.equal(listAfterBody.towns.some((town) => town.publicTownId === optInABody.town.publicTownId), false);
  });
});

test('V5.3 agent services redact inputs and never mutate world state on accept', async () => {
  await withDynamicWorldGridServer({
    NODE_ENV: 'test',
    WORLD_GRID_FEATURE_FLAGS: 'all'
  }, async (baseUrl, headersFor) => {
    const owner = `session:world-grid-services-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const headers = headersFor(owner);
    const ownerIdentity = normalizeOwnerIdentity({ pairId: owner });
    seedFoundersPlot(owner);

    const beforeRegionResponse = await fetch(`${baseUrl}/api/world/region`, { headers });
    const beforeRegion = await beforeRegionResponse.json();
    assert.equal(beforeRegionResponse.status, 200, JSON.stringify(beforeRegion));
    const stableRegionSnapshot = (region) => JSON.stringify({
      regionId: region.regionId,
      ownerAccountId: region.ownerAccountId,
      seed: region.seed,
      activeSettlementId: region.activeSettlementId,
      cells: region.cells,
      settlements: region.settlements,
      routes: region.routes
    });
    const beforeRegionJson = stableRegionSnapshot(beforeRegion.region);

    const servicesResponse = await fetch(`${baseUrl}/api/world/services`, { headers });
    const servicesBody = await servicesResponse.json();
    assert.equal(servicesResponse.status, 200, JSON.stringify(servicesBody));
    assert.ok(servicesBody.services.length >= 3);
    assert.equal(servicesBody.services.some((service) => service.serviceId === 'service_route_advisor'), true);

    const requestResponse = await fetch(`${baseUrl}/api/world/services/request-advice`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify({
        serviceId: 'service_route_advisor',
        idempotencyKey: 'v53_request_advice_001',
        input: {
          selectedCell: beforeRegion.region.cells.find((cell) => cell.state === 'claimable'),
          regionSummary: { cellCount: beforeRegion.region.cells.length },
          brainSecrets: 'sk-live-secret',
          walletSecrets: 'wallet-secret',
          providerConfig: { token: 'provider-token' },
          privateEventLog: ['private'],
          workerTraffic: ['debug']
        }
      })
    });
    const requestBody = await requestResponse.json();
    assert.equal(requestResponse.status, 200, JSON.stringify(requestBody));
    assert.equal(requestBody.request.serviceId, 'service_route_advisor');
    assert.equal(requestBody.request.providerAccountId, 'civic_service_route_office');
    assert.equal(requestBody.request.requesterAccountId, ownerIdentity.ownerAccountId);
    assert.equal(requestBody.request.requesterAccountId.includes(owner), false);
    assert.deepEqual(Object.keys(requestBody.request.input).sort(), ['regionSummary', 'selectedCell']);
    assert.equal(JSON.stringify(requestBody.request.input).includes('sk-live-secret'), false);
    assert.equal(JSON.stringify(requestBody.request.input).includes('wallet-secret'), false);
    assert.equal(JSON.stringify(requestBody.request.input).includes('provider-token'), false);
    assert.equal(requestBody.request.output.recommendation.length > 0, true);
    assert.equal(typeof requestBody.request.output.rationale, 'string');
    assert.equal(typeof requestBody.request.output.nextStep, 'string');

    const acceptResponse = await fetch(`${baseUrl}/api/world/services/accept-result`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify({ requestId: requestBody.request.requestId, idempotencyKey: 'v53_accept_result_001' })
    });
    const acceptBody = await acceptResponse.json();
    assert.equal(acceptResponse.status, 200, JSON.stringify(acceptBody));
    assert.equal(acceptBody.mutationApplied, false);
    assert.equal(acceptBody.request.status, 'accepted');

    const afterRegionResponse = await fetch(`${baseUrl}/api/world/region`, { headers });
    const afterRegion = await afterRegionResponse.json();
    assert.equal(stableRegionSnapshot(afterRegion.region), beforeRegionJson);

    const afterServicesResponse = await fetch(`${baseUrl}/api/world/services`, { headers });
    const afterServices = await afterServicesResponse.json();
    const routeAdvisor = afterServices.services.find((service) => service.serviceId === 'service_route_advisor');
    assert.equal(routeAdvisor.reputation.completedJobs >= 1, true);

    const reportResponse = await fetch(`${baseUrl}/api/world/services/report-issue`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify({
        requestId: requestBody.request.requestId,
        reason: 'Advice was not relevant.',
        idempotencyKey: 'v53_report_issue_001'
      })
    });
    const reportBody = await reportResponse.json();
    assert.equal(reportResponse.status, 200, JSON.stringify(reportBody));
    assert.equal(reportBody.request.status, 'reported');

    const afterReportResponse = await fetch(`${baseUrl}/api/world/services`, { headers });
    const afterReport = await afterReportResponse.json();
    const routeAdvisorAfterReport = afterReport.services.find((service) => service.serviceId === 'service_route_advisor');
    assert.equal(routeAdvisorAfterReport.reputation.disputeCount >= 1, true);

    const duplicateReportResponse = await fetch(`${baseUrl}/api/world/services/report-issue`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify({
        requestId: requestBody.request.requestId,
        reason: 'Duplicate report.',
        idempotencyKey: 'v53_report_issue_002'
      })
    });
    const duplicateReportBody = await duplicateReportResponse.json();
    assert.equal(duplicateReportResponse.status, 200, JSON.stringify(duplicateReportBody));

    const afterDuplicateResponse = await fetch(`${baseUrl}/api/world/services`, { headers });
    const afterDuplicate = await afterDuplicateResponse.json();
    const routeAdvisorAfterDuplicate = afterDuplicate.services.find((service) => service.serviceId === 'service_route_advisor');
    assert.equal(routeAdvisorAfterDuplicate.reputation.disputeCount, routeAdvisorAfterReport.reputation.disputeCount);

    const acceptAfterReportResponse = await fetch(`${baseUrl}/api/world/services/accept-result`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify({ requestId: requestBody.request.requestId, idempotencyKey: 'v53_accept_result_002' })
    });
    const acceptAfterReportBody = await acceptAfterReportResponse.json();
    assert.equal(acceptAfterReportResponse.status, 409, JSON.stringify(acceptAfterReportBody));
    assert.equal(acceptAfterReportBody.error.code, 'INVALID_SERVICE_REQUEST_STATE');
  });
});

test('V5.4 world events enforce caps, idempotency, conservation, and cosmetic rewards', async () => {
  await withDynamicWorldGridServer({
    NODE_ENV: 'test',
    WORLD_GRID_FEATURE_FLAGS: 'all'
  }, async (baseUrl, headersFor) => {
    const ownerA = `session:world-grid-events-a-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const ownerB = `session:world-grid-events-b-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const headersA = headersFor(ownerA);
    const headersB = headersFor(ownerB);
    const ownerAIdentity = normalizeOwnerIdentity({ pairId: ownerA });
    seedFoundersPlot(ownerA);
    seedFoundersPlot(ownerB);

    const toolsResponse = await fetch(`${baseUrl}/api/world/tools`, { headers: headersA });
    const toolsBody = await toolsResponse.json();
    assert.equal(toolsResponse.status, 200, JSON.stringify(toolsBody));
    assert.equal(toolsBody.tools.some((tool) => tool.name === 'et.world.events.contribute'), true);

    const stateResponse = await fetch(`${baseUrl}/api/world/events`, { headers: headersA });
    const stateBody = await stateResponse.json();
    assert.equal(stateResponse.status, 200, JSON.stringify(stateBody));
    const eventId = stateBody.events[0].event.eventId;
    assert.equal(eventId, 'event_great_ridge_bridge');
    assert.equal(stateBody.events[0].event.status, 'active');

    const previewResponse = await fetch(`${baseUrl}/api/world/events/preview-contribution`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headersA },
      body: JSON.stringify({ eventId, bundle: { coin: 2 } })
    });
    const previewBody = await previewResponse.json();
    assert.equal(previewResponse.status, 200, JSON.stringify(previewBody));
    assert.equal(previewBody.preview.accepted.coin, 2);
    assert.equal(previewBody.preview.allowed, true);

    const contributeResponse = await fetch(`${baseUrl}/api/world/events/contribute`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headersA },
      body: JSON.stringify({ eventId, bundle: { coin: 2 }, idempotencyKey: 'bridge-day-1' })
    });
    const contributeBody = await contributeResponse.json();
    assert.equal(contributeResponse.status, 200, JSON.stringify(contributeBody));
    assert.equal(contributeBody.duplicate, false);
    assert.equal(contributeBody.contribution.bundle.coin, 2);
    assert.equal(contributeBody.events[0].event.totalContributions.coin >= 2, true);

    const plotAfterContribution = loadPlotByPairId(ownerA);
    assert.equal(
      plotAfterContribution.plot.inventory.coin,
      contributeBody.contribution.inventoryBefore.coin - contributeBody.contribution.bundle.coin
    );

    const duplicateResponse = await fetch(`${baseUrl}/api/world/events/contribute`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headersA },
      body: JSON.stringify({ eventId, bundle: { coin: 2 }, idempotencyKey: 'bridge-day-1' })
    });
    const duplicateBody = await duplicateResponse.json();
    assert.equal(duplicateResponse.status, 200, JSON.stringify(duplicateBody));
    assert.equal(duplicateResponse.headers.get('x-world-grid-idempotency-replay'), '1');
    assert.equal(duplicateBody.duplicate, false);
    assert.equal(duplicateBody.contribution.contributionId, contributeBody.contribution.contributionId);
    assert.deepEqual(loadPlotByPairId(ownerA).plot.inventory, plotAfterContribution.plot.inventory);

    const conflictResponse = await fetch(`${baseUrl}/api/world/events/contribute`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headersA },
      body: JSON.stringify({ eventId, bundle: { coin: 5 }, idempotencyKey: 'bridge-day-1' })
    });
    const conflictBody = await conflictResponse.json();
    assert.equal(conflictResponse.status, 409, JSON.stringify(conflictBody));
    assert.equal(conflictBody.error.code, 'IDEMPOTENCY_CONFLICT');
    assert.deepEqual(loadPlotByPairId(ownerA).plot.inventory, plotAfterContribution.plot.inventory);

    const capFillResponse = await fetch(`${baseUrl}/api/world/events/contribute`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headersA },
      body: JSON.stringify({ eventId, bundle: { coin: 99 }, idempotencyKey: 'bridge-day-2' })
    });
    const capFillBody = await capFillResponse.json();
    assert.equal(capFillResponse.status, 200, JSON.stringify(capFillBody));
    assert.equal(capFillBody.contribution.bundle.coin, 3);

    const overCapResponse = await fetch(`${baseUrl}/api/world/events/contribute`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headersA },
      body: JSON.stringify({ eventId, bundle: { coin: 1 }, idempotencyKey: 'bridge-day-3' })
    });
    const overCapBody = await overCapResponse.json();
    assert.equal(overCapResponse.status, 409, JSON.stringify(overCapBody));
    assert.equal(overCapBody.error.code, 'CONTRIBUTION_CAP_EXCEEDED');

    const wrongOwnerReward = await fetch(`${baseUrl}/api/world/events/claim-reward`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headersB },
      body: JSON.stringify({ eventId, ownerAccountId: ownerAIdentity.ownerAccountId, idempotencyKey: 'v54_wrong_reward_001' })
    });
    const wrongOwnerRewardBody = await wrongOwnerReward.json();
    assert.equal(wrongOwnerReward.status, 403, JSON.stringify(wrongOwnerRewardBody));
    assert.equal(wrongOwnerRewardBody.error.code, 'FORBIDDEN');

    const inventoryBeforeReward = { ...loadPlotByPairId(ownerA).plot.inventory };
    const rewardResponse = await fetch(`${baseUrl}/api/world/events/claim-reward`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headersA },
      body: JSON.stringify({ eventId, idempotencyKey: 'v54_reward_001' })
    });
    const rewardBody = await rewardResponse.json();
    assert.equal(rewardResponse.status, 200, JSON.stringify(rewardBody));
    assert.equal(rewardBody.mutationApplied, false);
    assert.equal(rewardBody.reward.kind, 'cosmetic_status');
    assert.deepEqual(loadPlotByPairId(ownerA).plot.inventory, inventoryBeforeReward);

    const rewardReplay = await fetch(`${baseUrl}/api/world/events/claim-reward`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headersA },
      body: JSON.stringify({ eventId, idempotencyKey: 'v54_reward_002' })
    });
    const rewardReplayBody = await rewardReplay.json();
    assert.equal(rewardReplay.status, 200, JSON.stringify(rewardReplayBody));
    assert.equal(rewardReplayBody.reward.rewardId, rewardBody.reward.rewardId);
  });
});

test('V5.5 sandbox districts moderate typed actions, rollback, and keep private towns untouched', async () => {
  await withDynamicWorldGridServer({
    NODE_ENV: 'test',
    WORLD_GRID_FEATURE_FLAGS: 'all'
  }, async (baseUrl, headersFor) => {
    const owner = `session:world-grid-sandbox-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const headers = headersFor(owner);
    seedFoundersPlot(owner);
    const initialPlotInventory = { ...loadPlotByPairId(owner).plot.inventory };

    const toolsResponse = await fetch(`${baseUrl}/api/world/tools`, { headers });
    const toolsBody = await toolsResponse.json();
    assert.equal(toolsResponse.status, 200, JSON.stringify(toolsBody));
    assert.equal(toolsBody.tools.some((tool) => tool.name === 'et.world.sandbox.place_prop'), true);

    const enterResponse = await fetch(`${baseUrl}/api/world/sandbox/enter`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify({ idempotencyKey: 'v55_enter_001' })
    });
    const enterBody = await enterResponse.json();
    assert.equal(enterResponse.status, 200, JSON.stringify(enterBody));
    assert.match(enterBody.participant.publicId, /^sandbox_/);
    assert.equal(JSON.stringify(enterBody).includes(owner), false);

    const propCount = (sandbox) => sandbox.district.cells.reduce((sum, cell) => sum + cell.props.length, 0);

    const placeResponse = await fetch(`${baseUrl}/api/world/sandbox/place-prop`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify({
        payload: { cellId: 'sandbox_cell_0', propId: 'lantern' },
        idempotencyKey: 'v55_place_001'
      })
    });
    const placeBody = await placeResponse.json();
    assert.equal(placeResponse.status, 200, JSON.stringify(placeBody));
    assert.equal(placeBody.action.moderationStatus, 'auto-approved');
    assert.equal(placeBody.action.payload.propId, 'lantern');
    assert.equal(propCount(placeBody.sandbox), 1);

    const rejectedResponse = await fetch(`${baseUrl}/api/world/sandbox/place-prop`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify({
        payload: { cellId: 'sandbox_cell_0', propId: 'uploaded-dragon' },
        idempotencyKey: 'v55_place_002'
      })
    });
    const rejectedBody = await rejectedResponse.json();
    assert.equal(rejectedResponse.status, 200, JSON.stringify(rejectedBody));
    assert.equal(rejectedBody.action.moderationStatus, 'rejected');
    assert.equal(propCount(rejectedBody.sandbox), 1);

    const demoResponse = await fetch(`${baseUrl}/api/world/sandbox/agent-demo`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify({
        payload: { cellId: 'sandbox_cell_1', demoKind: 'route-signpost' },
        idempotencyKey: 'v55_demo_001'
      })
    });
    const demoBody = await demoResponse.json();
    assert.equal(demoResponse.status, 200, JSON.stringify(demoBody));
    assert.equal(demoBody.action.kind, 'agent_demo');
    assert.equal(demoBody.action.moderationStatus, 'auto-approved');
    assert.equal(propCount(demoBody.sandbox), 2);

    const rejectedDemoResponse = await fetch(`${baseUrl}/api/world/sandbox/agent-demo`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify({
        payload: { cellId: 'sandbox_cell_1', demoKind: 'freeform-chat' },
        idempotencyKey: 'v55_demo_002'
      })
    });
    const rejectedDemoBody = await rejectedDemoResponse.json();
    assert.equal(rejectedDemoResponse.status, 200, JSON.stringify(rejectedDemoBody));
    assert.equal(rejectedDemoBody.action.moderationStatus, 'rejected');

    const rollbackDemoResponse = await fetch(`${baseUrl}/api/world/sandbox/rollback-last`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify({ idempotencyKey: 'v55_rollback_001' })
    });
    const rollbackDemoBody = await rollbackDemoResponse.json();
    assert.equal(rollbackDemoResponse.status, 200, JSON.stringify(rollbackDemoBody));
    assert.equal(rollbackDemoBody.restored, true);
    assert.equal(propCount({ district: rollbackDemoBody.district }), 1);

    const rollbackLanternResponse = await fetch(`${baseUrl}/api/world/sandbox/rollback-last`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify({ idempotencyKey: 'v55_rollback_002' })
    });
    const rollbackLanternBody = await rollbackLanternResponse.json();
    assert.equal(rollbackLanternResponse.status, 200, JSON.stringify(rollbackLanternBody));
    assert.equal(propCount({ district: rollbackLanternBody.district }), 0);

    const leaveResponse = await fetch(`${baseUrl}/api/world/sandbox/leave`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify({ idempotencyKey: 'v55_leave_001' })
    });
    const leaveBody = await leaveResponse.json();
    assert.equal(leaveResponse.status, 200, JSON.stringify(leaveBody));
    assert.equal(leaveBody.removed, true);
    assert.deepEqual(loadPlotByPairId(owner).plot.inventory, initialPlotInventory);
  });
});
