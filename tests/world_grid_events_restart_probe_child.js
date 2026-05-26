const http = require('node:http');
const express = require('express');

const { createInitialPlot } = require('../server/founders_plot/engine');
const { loadPlotByPairId, savePlotGraph } = require('../server/founders_plot/store');
const {
  closeWorldGridEventStore,
  createWorldGridEventStore
} = require('../server/world_grid/events');
const { closeWorldGridIdempotencyStore } = require('../server/world_grid/idempotency');
const { createWorldGridRouter } = require('../server/world_grid/routes');

const PAIR_ID = 'session:world-grid-durable-events';
const EVENT_ID = 'event_great_ridge_bridge';

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
    closeWorldGridEventStore();
    closeWorldGridIdempotencyStore();
  }
}

async function getJson(baseUrl, route) {
  const response = await fetch(`${baseUrl}${route}`);
  return {
    status: response.status,
    body: await response.json()
  };
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

function durableSnapshot(sqlitePath, ownerAccountId) {
  const store = createWorldGridEventStore({ sqlitePath });
  try {
    return {
      counts: store.counts(),
      contributions: store.contributionsForEvent(EVENT_ID),
      reward: store.getReward(EVENT_ID, ownerAccountId),
      metadata: store.metadata()
    };
  } finally {
    store.close();
  }
}

function eventSummary(body = {}) {
  const row = (body.events || []).find((entry) => entry.event?.eventId === EVENT_ID) || {};
  return {
    totalCoin: Number(row.event?.totalContributions?.coin || 0),
    participantCount: Number(row.event?.participantCount || 0),
    personalCoin: Number(row.personal?.total?.coin || 0),
    contributionCount: Number(row.personal?.contributionCount || 0),
    rewardStatus: row.personal?.reward?.status || ''
  };
}

async function main() {
  const mode = process.argv[2];
  const eventsPath = process.argv[3];
  const storePath = process.argv[4];
  if (!mode || !eventsPath || !storePath) throw new Error('WORLD_GRID_EVENTS_RESTART_ARGS_REQUIRED');

  process.env.NODE_ENV = 'test';
  process.env.STORE_PATH = storePath;
  process.env.WORLD_GRID_FEATURE_FLAGS = 'all';
  process.env.WORLD_GRID_EVENTS_SQLITE_PATH = eventsPath;

  if (mode === 'seed') seedFoundersPlot();

  await withServer(async (baseUrl) => {
    const region = await getJson(baseUrl, '/api/world/region');
    const ownerAccountId = region.body.owner?.ownerAccountId || '';
    let contribution = { status: 0, body: {} };
    let reward = { status: 0, body: {} };
    if (mode === 'seed') {
      contribution = await postJson(baseUrl, '/api/world/events/contribute', {
        eventId: EVENT_ID,
        bundle: { coin: 2 },
        idempotencyKey: 'durable_events_contribute_001'
      });
      reward = await postJson(baseUrl, '/api/world/events/claim-reward', {
        eventId: EVENT_ID,
        idempotencyKey: 'durable_events_reward_001'
      });
    } else if (mode === 'duplicate-contribute') {
      contribution = await postJson(baseUrl, '/api/world/events/contribute', {
        eventId: EVENT_ID,
        bundle: { coin: 2 },
        idempotencyKey: 'durable_events_contribute_001'
      });
    } else if (mode === 'cap-fill') {
      contribution = await postJson(baseUrl, '/api/world/events/contribute', {
        eventId: EVENT_ID,
        bundle: { coin: 99 },
        idempotencyKey: 'durable_events_contribute_002'
      });
    } else if (mode === 'duplicate-reward') {
      reward = await postJson(baseUrl, '/api/world/events/claim-reward', {
        eventId: EVENT_ID,
        idempotencyKey: 'durable_events_reward_002'
      });
    }

    const events = await getJson(baseUrl, '/api/world/events');
    const preview = await postJson(baseUrl, '/api/world/events/preview-contribution', {
      eventId: EVENT_ID,
      bundle: { coin: 99 }
    });
    const plotState = loadPlotByPairId(PAIR_ID);
    const snapshot = durableSnapshot(eventsPath, ownerAccountId);
    writeJson({
      ok: region.status === 200 && events.status === 200 && [0, 200].includes(contribution.status) && [0, 200].includes(reward.status),
      mode,
      contributionStatus: contribution.status,
      contributionDuplicate: contribution.body.duplicate === true,
      contributedCoin: Number(contribution.body.contribution?.bundle?.coin || 0),
      rewardStatusCode: reward.status,
      rewardId: reward.body.reward?.rewardId || '',
      mutationApplied: reward.body.mutationApplied,
      previewAcceptedCoin: Number(preview.body.preview?.accepted?.coin || 0),
      previewAllowed: preview.body.preview?.allowed === true,
      inventoryCoin: Number(plotState?.plot?.inventory?.coin || 0),
      ...eventSummary(events.body),
      ...snapshot
    });
  });
}

main().catch((error) => {
  writeJson({ ok: false, error: error.message });
  process.exitCode = 1;
});
