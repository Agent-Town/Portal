const http = require('node:http');
const express = require('express');

const { createInitialPlot } = require('../server/founders_plot/engine');
const { savePlotGraph } = require('../server/founders_plot/store');
const { closeWorldGridIdempotencyStore } = require('../server/world_grid/idempotency');
const {
  closeWorldGridPublicPresenceStore,
  createWorldGridPublicPresenceStore
} = require('../server/world_grid/public_presence');
const { createWorldGridRouter } = require('../server/world_grid/routes');

const OWNER_A = 'session:world-grid-durable-public-presence-a';
const OWNER_B = 'session:world-grid-durable-public-presence-b';

function writeJson(value) {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}

function seedFoundersPlots() {
  savePlotGraph(createInitialPlot({ pairId: OWNER_A, nowMs: 1_779_984_000_000 }));
  savePlotGraph(createInitialPlot({ pairId: OWNER_B, nowMs: 1_779_984_000_000 }));
}

async function withServer(fn) {
  const app = express();
  app.use(express.json());
  app.use(createWorldGridRouter({
    resolveIdentity: (req) => ({
      pairId: String(req.header('x-test-pair-id') || OWNER_A),
      houseId: null
    })
  }));
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  try {
    return await fn(baseUrl);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    closeWorldGridIdempotencyStore();
    closeWorldGridPublicPresenceStore();
  }
}

function headersFor(pairId) {
  return {
    'content-type': 'application/json',
    'x-test-pair-id': pairId
  };
}

async function getJson(baseUrl, route, headers = {}) {
  const response = await fetch(`${baseUrl}${route}`, { headers });
  const body = await response.json();
  return { status: response.status, body };
}

async function postJson(baseUrl, route, body, headers = {}) {
  const response = await fetch(`${baseUrl}${route}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body)
  });
  return {
    status: response.status,
    body: await response.json()
  };
}

function durableSnapshot(sqlitePath) {
  const store = createWorldGridPublicPresenceStore({ sqlitePath });
  try {
    return {
      counts: store.counts(),
      towns: store.listPublicTowns(),
      metadata: store.metadata()
    };
  } finally {
    store.close();
  }
}

async function main() {
  const mode = process.argv[2];
  const publicPresencePath = process.argv[3];
  const storePath = process.argv[4];
  const publicTownIdArg = process.argv[5] || '';
  if (!mode || !publicPresencePath || !storePath) {
    throw new Error('WORLD_GRID_PUBLIC_PRESENCE_RESTART_ARGS_REQUIRED');
  }

  process.env.NODE_ENV = 'test';
  process.env.STORE_PATH = storePath;
  process.env.WORLD_GRID_FEATURE_FLAGS = 'all';
  process.env.WORLD_GRID_PUBLIC_PRESENCE_SQLITE_PATH = publicPresencePath;

  if (mode === 'seed') seedFoundersPlots();

  await withServer(async (baseUrl) => {
    let mutation = { status: 0, body: {} };
    let followAgain = { status: 0, body: {} };
    if (mode === 'seed') {
      mutation = await postJson(baseUrl, '/api/world/public-presence/opt-in', {
        displayName: 'Founder <script>bad()</script>',
        townName: 'Copper <img src=x onerror=bad()> Lantern',
        privacy: { showOperatingStyle: true, showRegion: true, allowVisits: true },
        idempotencyKey: 'durable_public_presence_optin_a'
      }, headersFor(OWNER_A));
      followAgain = await postJson(baseUrl, '/api/world/follow-town', {
        publicTownId: mutation.body.town?.publicTownId,
        idempotencyKey: 'durable_public_presence_follow_b'
      }, headersFor(OWNER_B));
    } else if (mode === 'follow-again') {
      followAgain = await postJson(baseUrl, '/api/world/follow-town', {
        publicTownId: publicTownIdArg,
        idempotencyKey: 'durable_public_presence_follow_b_again'
      }, headersFor(OWNER_B));
    } else if (mode === 'opt-out') {
      mutation = await postJson(baseUrl, '/api/world/public-presence/opt-out', {
        idempotencyKey: 'durable_public_presence_optout_a'
      }, headersFor(OWNER_A));
    }

    const publicTownId = mutation.body.town?.publicTownId || publicTownIdArg;
    const list = await getJson(baseUrl, '/api/world/public-towns', headersFor(OWNER_B));
    const lookup = publicTownId
      ? await getJson(baseUrl, `/api/world/public-town/${encodeURIComponent(publicTownId)}`, headersFor(OWNER_B))
      : { status: 0, body: {} };
    const summarize = publicTownId
      ? await postJson(baseUrl, '/api/world/tool/et.world.public.summarize_neighbor', {
        publicTownId
      }, headersFor(OWNER_B))
      : { status: 0, body: {} };
    const snapshot = durableSnapshot(publicPresencePath);
    const serialized = JSON.stringify({ list: list.body, lookup: lookup.body, summarize: summarize.body });
    writeJson({
      ok: [0, 200].includes(mutation.status) && [0, 200].includes(followAgain.status),
      mode,
      mutationStatus: mutation.status,
      followStatus: followAgain.status,
      publicTownId,
      townName: mutation.body.town?.townName || lookup.body.town?.townName || '',
      listStatus: list.status,
      lookupStatus: lookup.status,
      summarizeStatus: summarize.status,
      listCount: Array.isArray(list.body.towns) ? list.body.towns.length : 0,
      followCount: followAgain.body.followCount || 0,
      containsRawHtml: /<script|<img|onerror=/i.test(serialized),
      containsPrivateText: /secret|token|credential|provider|brain|wallet/i.test(serialized),
      ...snapshot
    });
  });
}

main().catch((error) => {
  writeJson({ ok: false, error: error.message });
  process.exitCode = 1;
});
