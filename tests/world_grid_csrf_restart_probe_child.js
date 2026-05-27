const http = require('node:http');
const express = require('express');

const { createInitialPlot } = require('../server/founders_plot/engine');
const { loadPlotByPairId, savePlotGraph } = require('../server/founders_plot/store');
const { closeWorldGridCsrfStore } = require('../server/world_grid/csrf');
const { createWorldGridRouter } = require('../server/world_grid/routes');

const PAIR_ID = 'session:world-grid-durable-csrf';

function writeJson(value) {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}

function seedFoundersPlot() {
  if (loadPlotByPairId(PAIR_ID)) return;
  savePlotGraph(createInitialPlot({ pairId: PAIR_ID, nowMs: 1_779_984_000_000 }));
}

function sameOriginHeaders(baseUrl, extra = {}) {
  return {
    'content-type': 'application/json',
    origin: baseUrl,
    'sec-fetch-site': 'same-origin',
    'sec-fetch-mode': 'cors',
    'sec-fetch-dest': 'empty',
    ...extra
  };
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
    closeWorldGridCsrfStore();
  }
}

async function issueToken(baseUrl) {
  const response = await fetch(`${baseUrl}/api/world/mutation-token`, {
    headers: sameOriginHeaders(baseUrl)
  });
  return {
    status: response.status,
    body: await response.json()
  };
}

async function useToken(baseUrl, token) {
  const optionsResponse = await fetch(`${baseUrl}/api/world/territory/claim-options`);
  const options = await optionsResponse.json();
  if (optionsResponse.status !== 200) {
    throw new Error(`OPTIONS_FAILED:${optionsResponse.status}:${JSON.stringify(options)}`);
  }
  const response = await fetch(`${baseUrl}/api/world/territory/plan-claim`, {
    method: 'POST',
    headers: sameOriginHeaders(baseUrl, { 'x-world-grid-csrf': token }),
    body: JSON.stringify({
      cellId: options.options[0].cellId,
      idempotencyKey: 'csrf_restart_plan_001'
    })
  });
  return {
    status: response.status,
    body: await response.json()
  };
}

async function main() {
  const mode = process.argv[2];
  const sqlitePath = process.argv[3];
  const storePath = process.argv[4];
  const token = process.argv[5] || '';
  if (!mode || !sqlitePath || !storePath) throw new Error('WORLD_GRID_CSRF_RESTART_ARGS_REQUIRED');

  process.env.NODE_ENV = 'production';
  process.env.STORE_PATH = storePath;
  process.env.WORLD_GRID_FEATURE_FLAGS = 'all';
  process.env.WORLD_GRID_CSRF_SQLITE_PATH = sqlitePath;

  seedFoundersPlot();

  await withServer(async (baseUrl) => {
    if (mode === 'issue') {
      const issued = await issueToken(baseUrl);
      writeJson({
        ok: issued.status === 200,
        mode,
        status: issued.status,
        csrfToken: issued.body.csrfToken || '',
        expiresAtMs: issued.body.expiresAtMs || 0
      });
      return;
    }

    if (mode === 'use') {
      const used = await useToken(baseUrl, token);
      writeJson({
        ok: used.status === 200,
        mode,
        status: used.status,
        errorCode: used.body.error?.code || '',
        claimId: used.body.claim?.claimId || ''
      });
      return;
    }

    throw new Error(`WORLD_GRID_CSRF_RESTART_MODE_UNKNOWN:${mode}`);
  });
}

main().catch((error) => {
  writeJson({ ok: false, error: error.message });
  process.exitCode = 1;
});
