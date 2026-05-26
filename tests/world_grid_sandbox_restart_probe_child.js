const http = require('node:http');
const express = require('express');

const { createInitialPlot } = require('../server/founders_plot/engine');
const { loadPlotByPairId, savePlotGraph } = require('../server/founders_plot/store');
const { closeWorldGridIdempotencyStore } = require('../server/world_grid/idempotency');
const { createWorldGridRouter } = require('../server/world_grid/routes');
const {
  closeWorldGridSandboxStore,
  createWorldGridSandboxStore
} = require('../server/world_grid/sandbox');

const OWNER_ID = 'session:world-grid-durable-sandbox';

function writeJson(value) {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}

function seedFoundersPlot() {
  savePlotGraph(createInitialPlot({ pairId: OWNER_ID, nowMs: 1_779_984_000_000 }));
}

async function withServer(fn) {
  const app = express();
  app.use(express.json());
  app.use(createWorldGridRouter({
    resolveIdentity: () => ({ pairId: OWNER_ID, houseId: null })
  }));
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  try {
    return await fn(baseUrl);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    closeWorldGridIdempotencyStore();
    closeWorldGridSandboxStore();
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

function durableSnapshot(sqlitePath) {
  const store = createWorldGridSandboxStore({ sqlitePath });
  try {
    return {
      counts: store.counts(),
      participants: store.listParticipants(),
      actions: store.listActions(),
      snapshotIds: store.listSnapshotIds(),
      cells: store.cells(),
      metadata: store.metadata()
    };
  } finally {
    store.close();
  }
}

function propCountFromCells(cells = []) {
  return cells.reduce((sum, cell) => sum + (Array.isArray(cell.props) ? cell.props.length : 0), 0);
}

function summarizeState(stateBody = {}) {
  const district = stateBody.district || stateBody.sandbox?.district || {};
  const cells = Array.isArray(district.cells) ? district.cells : [];
  return {
    participantPresent: Boolean(stateBody.participant || stateBody.sandbox?.participant),
    participantCount: Array.isArray(district.participants) ? district.participants.length : 0,
    propCount: propCountFromCells(cells),
    snapshotCount: Array.isArray(district.snapshots) ? district.snapshots.length : 0,
    recentActionCount: Array.isArray(district.recentActions) ? district.recentActions.length : 0
  };
}

function actionSummary(actions = []) {
  return actions.map((action) => ({
    kind: action.kind,
    status: action.moderationStatus,
    rolledBack: Boolean(action.rolledBackAtMs)
  }));
}

async function main() {
  const mode = process.argv[2];
  const sandboxPath = process.argv[3];
  const storePath = process.argv[4];
  if (!mode || !sandboxPath || !storePath) throw new Error('WORLD_GRID_SANDBOX_RESTART_ARGS_REQUIRED');

  process.env.NODE_ENV = 'test';
  process.env.STORE_PATH = storePath;
  process.env.WORLD_GRID_FEATURE_FLAGS = 'all';
  process.env.WORLD_GRID_SANDBOX_SQLITE_PATH = sandboxPath;

  if (mode === 'seed') seedFoundersPlot();

  await withServer(async (baseUrl) => {
    const region = await getJson(baseUrl, '/api/world/region');
    const responses = [];

    if (mode === 'seed') {
      responses.push(await postJson(baseUrl, '/api/world/sandbox/enter', {
        idempotencyKey: 'durable_sandbox_enter_001'
      }));
      responses.push(await postJson(baseUrl, '/api/world/sandbox/place-prop', {
        payload: { cellId: 'sandbox_cell_0', propId: 'lantern' },
        idempotencyKey: 'durable_sandbox_place_001'
      }));
      responses.push(await postJson(baseUrl, '/api/world/sandbox/place-prop', {
        payload: { cellId: 'sandbox_cell_0', propId: 'uploaded-dragon' },
        idempotencyKey: 'durable_sandbox_reject_001'
      }));
      responses.push(await postJson(baseUrl, '/api/world/sandbox/agent-demo', {
        payload: { cellId: 'sandbox_cell_1', demoKind: 'route-signpost' },
        idempotencyKey: 'durable_sandbox_demo_001'
      }));
      responses.push(await postJson(baseUrl, '/api/world/sandbox/rollback-last', {
        idempotencyKey: 'durable_sandbox_rollback_demo_001'
      }));
    } else if (mode === 'reject-forbidden') {
      responses.push(await postJson(baseUrl, '/api/world/sandbox/place-prop', {
        payload: { cellId: 'sandbox_cell_0', propId: 'uploaded-dragon' },
        idempotencyKey: 'durable_sandbox_reject_after_restart_001'
      }));
    } else if (mode === 'rollback-lantern') {
      responses.push(await postJson(baseUrl, '/api/world/sandbox/rollback-last', {
        idempotencyKey: 'durable_sandbox_rollback_lantern_001'
      }));
    } else if (mode === 'leave') {
      responses.push(await postJson(baseUrl, '/api/world/sandbox/leave', {
        idempotencyKey: 'durable_sandbox_leave_001'
      }));
    }

    const state = await getJson(baseUrl, '/api/world/sandbox');
    const snapshot = durableSnapshot(sandboxPath);
    const plotState = loadPlotByPairId(OWNER_ID);
    const serialized = JSON.stringify({
      state: state.body,
      durable: snapshot
    });
    writeJson({
      ok: region.status === 200
        && state.status === 200
        && responses.every((response) => response.status === 200),
      mode,
      responseStatuses: responses.map((response) => response.status),
      responseModerationStatuses: responses
        .map((response) => response.body?.action?.moderationStatus)
        .filter(Boolean),
      responseRestored: responses.some((response) => response.body?.restored === true),
      responseRemoved: responses.some((response) => response.body?.removed === true),
      inventory: plotState?.plot?.inventory || null,
      leakedOwnerId: serialized.includes(OWNER_ID),
      actionSummary: actionSummary(snapshot.actions),
      durablePropCount: propCountFromCells(snapshot.cells),
      ...summarizeState(state.body),
      ...snapshot
    });
  });
}

main().catch((error) => {
  writeJson({ ok: false, error: error.message });
  process.exitCode = 1;
});
