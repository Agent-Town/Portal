const http = require('node:http');
const express = require('express');

const { createInitialPlot } = require('../server/founders_plot/engine');
const { savePlotGraph } = require('../server/founders_plot/store');
const {
  closeWorldGridClaimStore,
  createWorldGridClaimStore
} = require('../server/world_grid/claims');
const { closeWorldGridIdempotencyStore } = require('../server/world_grid/idempotency');
const { createWorldGridRouter } = require('../server/world_grid/routes');

const PAIR_ID = 'session:world-grid-durable-claims-restart';

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
    closeWorldGridClaimStore();
    closeWorldGridIdempotencyStore();
  }
}

async function getJson(baseUrl, route) {
  const response = await fetch(`${baseUrl}${route}`);
  const body = await response.json();
  if (response.status !== 200) throw new Error(`${route}:${response.status}:${JSON.stringify(body)}`);
  return body;
}

async function postJson(baseUrl, route, body) {
  const response = await fetch(`${baseUrl}${route}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  return {
    status: response.status,
    body: await response.json()
  };
}

function durableSnapshot(sqlitePath, regionId) {
  const store = createWorldGridClaimStore({ sqlitePath });
  try {
    return {
      durableCount: store.count(),
      durableClaims: store.claimsForRegion(regionId),
      metadata: store.metadata()
    };
  } finally {
    store.close();
  }
}

async function main() {
  const mode = process.argv[2];
  const claimsPath = process.argv[3];
  const storePath = process.argv[4];
  const claimIdArg = process.argv[5] || '';
  if (!mode || !claimsPath || !storePath) throw new Error('WORLD_GRID_CLAIMS_RESTART_ARGS_REQUIRED');

  process.env.NODE_ENV = 'test';
  process.env.STORE_PATH = storePath;
  process.env.WORLD_GRID_FEATURE_FLAGS = 'all';
  process.env.WORLD_GRID_CLAIMS_SQLITE_PATH = claimsPath;

  if (mode === 'plan') seedFoundersPlot();

  await withServer(async (baseUrl) => {
    const regionBefore = await getJson(baseUrl, '/api/world/region');
    const options = await getJson(baseUrl, '/api/world/territory/claim-options');
    let mutation = { status: 0, body: {} };
    if (mode === 'plan') {
      mutation = await postJson(baseUrl, '/api/world/territory/plan-claim', {
        cellId: options.options[0].cellId,
        idempotencyKey: 'durable_claim_plan_001'
      });
    } else if (mode === 'complete') {
      mutation = await postJson(baseUrl, '/api/world/territory/complete-claim', {
        claimId: claimIdArg,
        idempotencyKey: 'durable_claim_complete_001'
      });
    }
    const regionAfter = await getJson(baseUrl, '/api/world/region');
    const claims = regionAfter.territory.claims;
    const claim = claims.find((candidate) => candidate.claimId === (mutation.body.claim?.claimId || claimIdArg)) || claims[0] || null;
    const claimedCell = claim
      ? regionAfter.region.cells.find((cell) => cell.cellId === claim.cellId)
      : null;
    const route = claim
      ? regionAfter.region.routes.find((candidate) => candidate.routeId === claim.routePreview?.routeId)
      : null;
    writeJson({
      ok: mutation.status === 0 || mutation.status === 200,
      mode,
      mutationStatus: mutation.status,
      regionId: regionAfter.region.regionId,
      initialClaimCount: regionBefore.territory.claims.length,
      claimCount: claims.length,
      claimId: claim?.claimId || mutation.body.claim?.claimId || '',
      claimStatus: claim?.status || mutation.body.claim?.status || '',
      claimedCellState: claimedCell?.state || '',
      routeStatus: route?.status || '',
      ...durableSnapshot(claimsPath, regionAfter.region.regionId)
    });
  });
}

main().catch((error) => {
  writeJson({ ok: false, error: error.message });
  process.exitCode = 1;
});
