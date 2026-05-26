const http = require('node:http');
const express = require('express');

const { createWorldGridRouter } = require('../server/world_grid/routes');
const {
  closeWorldGridRegionPreferenceStore,
  createWorldGridRegionPreferenceStore
} = require('../server/world_grid/preferences');

const DEFAULT_PAIR_ID = 'session:world-grid-durable-region-preferences';

function writeJson(value) {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}

async function withServer(pairId, fn) {
  const app = express();
  app.use(express.json());
  app.use(createWorldGridRouter({
    resolveIdentity: () => ({ pairId, houseId: null })
  }));
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  try {
    return await fn(baseUrl);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    closeWorldGridRegionPreferenceStore();
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
  const store = createWorldGridRegionPreferenceStore({ sqlitePath });
  try {
    return {
      durableCount: store.count(),
      durablePreference: store.preferencesForRegion(regionId),
      metadata: store.metadata()
    };
  } finally {
    store.close();
  }
}

async function main() {
  const mode = process.argv[2];
  const preferencesPath = process.argv[3];
  const pairId = process.argv[4] || DEFAULT_PAIR_ID;
  if (!mode || !preferencesPath) throw new Error('WORLD_GRID_REGION_PREFS_RESTART_ARGS_REQUIRED');

  process.env.NODE_ENV = 'test';
  process.env.WORLD_GRID_FEATURE_FLAGS = 'all';
  process.env.WORLD_GRID_REGION_PREFS_SQLITE_PATH = preferencesPath;

  await withServer(pairId, async (baseUrl) => {
    const before = await getJson(baseUrl, '/api/world/region');
    const target = before.region.cells.find((cell) => cell.state === 'claimable') || before.region.cells[0];
    let focus = { status: 0, body: {} };
    let camera = { status: 0, body: {} };

    if (mode === 'write') {
      focus = await postJson(baseUrl, '/api/world/region/focus-cell', { cellId: target.cellId });
      camera = await postJson(baseUrl, '/api/world/region/set-camera', {
        zoom: 'region',
        q: target.q,
        r: target.r
      });
    }

    const after = await getJson(baseUrl, '/api/world/region');
    const snapshot = durableSnapshot(preferencesPath, after.region.regionId);
    writeJson({
      ok: focus.status === 0 || focus.status === 200,
      mode,
      pairId,
      focusStatus: focus.status,
      cameraStatus: camera.status,
      regionId: after.region.regionId,
      targetCellId: target.cellId,
      defaultSelectedCellId: before.preferences.selectedCellId,
      selectedCellId: after.preferences.selectedCellId,
      camera: after.preferences.camera,
      ...snapshot
    });
  });
}

main().catch((error) => {
  writeJson({ ok: false, error: error.message });
  process.exitCode = 1;
});
