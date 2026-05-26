const http = require('node:http');
const express = require('express');

const { createInitialPlot } = require('../server/founders_plot/engine');
const { savePlotGraph } = require('../server/founders_plot/store');
const {
  closeWorldGridIdempotencyStore,
  createWorldGridIdempotencyStore
} = require('../server/world_grid/idempotency');
const { createWorldGridRouter } = require('../server/world_grid/routes');

const PAIR_ID = 'session:world-grid-durable-idempotency-restart';
const IDEMPOTENCY_KEY = 'restart_plan_claim_001';

function writeJson(value) {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}

function seedFoundersPlot() {
  savePlotGraph(createInitialPlot({ pairId: PAIR_ID, nowMs: 1_779_984_000_000 }));
}

async function withServer(fn) {
  const app = express();
  app.use(express.json());
  app.use(createWorldGridRouter({
    resolveIdentity: () => ({ pairId: PAIR_ID, houseId: null })
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

async function regionClaimCount(baseUrl) {
  const response = await fetch(`${baseUrl}/api/world/region`);
  const body = await response.json();
  if (response.status !== 200) throw new Error(`REGION_FAILED:${response.status}:${JSON.stringify(body)}`);
  return body.territory.claims.length;
}

function durableCount(sqlitePath) {
  const store = createWorldGridIdempotencyStore({ sqlitePath });
  try {
    return store.count();
  } finally {
    store.close();
  }
}

async function main() {
  const mode = process.argv[2];
  const sqlitePath = process.argv[3];
  const storePath = process.argv[4];
  if (!mode || !sqlitePath || !storePath) throw new Error('WORLD_GRID_IDEMPOTENCY_RESTART_ARGS_REQUIRED');

  process.env.NODE_ENV = 'test';
  process.env.STORE_PATH = storePath;
  process.env.WORLD_GRID_FEATURE_FLAGS = 'all';
  process.env.WORLD_GRID_IDEMPOTENCY_SQLITE_PATH = sqlitePath;

  if (mode === 'seed') seedFoundersPlot();

  await withServer(async (baseUrl) => {
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
