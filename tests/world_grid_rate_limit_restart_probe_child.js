const http = require('node:http');
const express = require('express');

const { createInitialPlot } = require('../server/founders_plot/engine');
const { loadPlotByPairId, savePlotGraph } = require('../server/founders_plot/store');
const { closeWorldGridClaimStore } = require('../server/world_grid/claims');
const { closeWorldGridRateLimitStore } = require('../server/world_grid/rate_limit');
const { createWorldGridRouter } = require('../server/world_grid/routes');

const PAIR_ID = 'session:world-grid-durable-rate-limit';

function writeJson(value) {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}

function seedFoundersPlot() {
  if (loadPlotByPairId(PAIR_ID)) return;
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
    closeWorldGridClaimStore();
    closeWorldGridRateLimitStore();
  }
}

async function getClaimOption(baseUrl) {
  const response = await fetch(`${baseUrl}/api/world/territory/claim-options`);
  const body = await response.json();
  if (response.status !== 200) throw new Error(`OPTIONS_FAILED:${response.status}:${JSON.stringify(body)}`);
  return body.options[0];
}

async function postPlanClaim(baseUrl, idempotencyKey) {
  const option = await getClaimOption(baseUrl);
  const response = await fetch(`${baseUrl}/api/world/territory/plan-claim`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      cellId: option.cellId,
      idempotencyKey
    })
  });
  return {
    status: response.status,
    retryAfter: response.headers.get('retry-after') || '',
    limit: response.headers.get('x-ratelimit-limit') || '',
    remaining: response.headers.get('x-ratelimit-remaining') || '',
    body: await response.json()
  };
}

async function main() {
  const mode = process.argv[2];
  const sqlitePath = process.argv[3];
  const storePath = process.argv[4];
  if (!mode || !sqlitePath || !storePath) throw new Error('WORLD_GRID_RATE_LIMIT_RESTART_ARGS_REQUIRED');

  process.env.NODE_ENV = 'test';
  process.env.STORE_PATH = storePath;
  process.env.WORLD_GRID_FEATURE_FLAGS = 'all';
  process.env.WORLD_GRID_RATE_LIMIT_SQLITE_PATH = sqlitePath;
  process.env.WORLD_GRID_MUTATION_RATE_LIMIT_MAX = '2';
  process.env.WORLD_GRID_MUTATION_RATE_LIMIT_WINDOW_MS = '60000';

  seedFoundersPlot();

  await withServer(async (baseUrl) => {
    const idempotencyKey = mode === 'seed'
      ? 'rate_limit_restart_001'
      : mode === 'second'
        ? 'rate_limit_restart_002'
        : 'rate_limit_restart_003';
    const result = await postPlanClaim(baseUrl, idempotencyKey);
    writeJson({
      ok: result.status === (mode === 'third' ? 429 : 200),
      mode,
      status: result.status,
      errorCode: result.body.error?.code || '',
      retryAfter: result.retryAfter,
      limit: result.limit,
      remaining: result.remaining
    });
  });
}

main().catch((error) => {
  writeJson({ ok: false, error: error.message });
  process.exitCode = 1;
});
