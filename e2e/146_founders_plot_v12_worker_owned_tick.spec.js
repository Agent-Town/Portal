const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { prepareLoadedState } = require('../server/founders_plot/engine');
const {
  advancePlot,
  getJson,
  openFoundersPlotFrame,
  placeFirstLumberCamp,
  postJson,
  runPlotTool,
  startForemanRuntime
} = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('schema-2 saves migrate to schema 3 with living-town defaults and no resource drift', async () => {
  const raw = {
    plot: {
      plotId: 'plot_fixture_v11',
      pairId: 'pair_fixture_v11',
      houseId: 'house_fixture_v11',
      status: 'ACTIVE',
      hqLevel: 2,
      townXp: 25,
      inventory: { wood: 4, stone: 0, food: 0, coin: 20 },
      createdAt: 1000,
      updatedAt: 1000,
      lastSimulatedAt: 1000
    },
    buildings: [
      { buildingId: 'bld_hq', plotId: 'plot_fixture_v11', type: 'HQ', level: 2, x: 1, y: 1, state: 'READY', outputBuffer: {}, priority: 'BALANCED' },
      { buildingId: 'bld_lumber', plotId: 'plot_fixture_v11', type: 'LUMBER_CAMP', level: 1, x: 0, y: 0, state: 'READY', outputBuffer: {}, priority: 'BALANCED' }
    ],
    jobs: [],
    policy: {
      observeAndSuggest: true,
      collectOutputs: true,
      queueProduction: false,
      setPriority: false,
      sellSurplusFood: false,
      updatedAt: 1000
    },
    approvals: [],
    meta: {
      schemaVersion: 2,
      firstPlacedTypes: ['LUMBER_CAMP'],
      firstCollectedTypes: ['LUMBER_CAMP'],
      firstTimberRewarded: true,
      standingOrder: 'CAREFUL_STEWARD',
      contracts: {
        offers: [],
        activeContract: null,
        completed: []
      },
      scheduler: {
        collectReadyOutputs: {
          enabled: true,
          paused: false,
          nextRunAtMs: 0,
          runCount: 1,
          lease: { runtimeId: '', claimedAtMs: 0, expiresAtMs: 0 }
        }
      },
      foremanRuntime: {
        runtimeId: 'rt_v11',
        sessionId: 'frs_v11',
        status: 'OBSERVING',
        startedAt: 1000,
        lastHeartbeatAt: 1000,
        expiresAt: 2000,
        pack: { skillLoaded: true, toolsLoaded: true, goalsLoaded: true }
      },
      foremanReceipts: []
    }
  };

  const prepared = prepareLoadedState(raw);
  expect(prepared.fromVersion).toBe(2);
  expect(prepared.toVersion).toBe(3);
  expect(prepared.migrated).toBe(true);
  expect(prepared.state.meta.schemaVersion).toBe(3);
  expect(prepared.state.plot.inventory).toEqual({ wood: 4, stone: 0, food: 0, coin: 20 });
  expect(prepared.state.meta.townSignals).toEqual(expect.objectContaining({
    depotReadiness: 50,
    marketConfidence: 50,
    neighborGoodwill: 50,
    publicCharm: 0
  }));
  expect(Array.isArray(prepared.state.meta.requesters)).toBe(true);
  expect(prepared.state.meta.requesters).toHaveLength(4);
  expect(prepared.state.meta.landmarks?.publicSquare).toEqual(expect.objectContaining({
    level: 0,
    upgradedAtMs: 0
  }));
  expect(prepared.state.meta.contractDeck).toEqual(expect.objectContaining({
    version: 'v1.2',
    refreshCount: 0
  }));
  expect(prepared.state.meta.foremanWorker).toEqual(expect.objectContaining({
    lastWorkerCommandId: '',
    lastWorkerTraceId: ''
  }));
});

test('Run now dispatches a worker-owned Foreman tick and production app code avoids direct Foreman tool fetches', async ({ page }) => {
  const appJs = fs.readFileSync(path.join(__dirname, '..', 'public/experiences/founders-plot/app.js'), 'utf8');
  expect(appJs).not.toMatch(/\/api\/founders-plot\/foreman\/tool\//);
  const llmPaths = [];
  page.on('request', (request) => {
    const pathname = new URL(request.url()).pathname;
    if (!pathname.startsWith('/api/llm/')) return;
    llmPaths.push(pathname);
  });

  const frame = await openFoundersPlotFrame(page);
  const started = await startForemanRuntime(frame);
  expect(started?.ok).toBe(true);
  const llmPathCountBeforeForemanTick = llmPaths.length;

  const placed = await placeFirstLumberCamp(frame, 'v12-worker-owned');
  expect(placed?.ok).toBe(true);
  await advancePlot(frame, 31_000);

  const lumberBuildingId = await frame.evaluate(() => {
    const state = window.__foundersPlotTest.getState()?.state;
    const lumber = Array.isArray(state?.buildings)
      ? state.buildings.find((building) => building?.type === 'LUMBER_CAMP')
      : null;
    return String(lumber?.buildingId || '');
  });
  expect(lumberBuildingId).toMatch(/^bld_/);

  const queueResp = await runPlotTool(frame, 'et.plot.queue_job', {
    buildingId: lumberBuildingId,
    idempotencyKey: 'v12-worker-owned:queue'
  });
  expect(queueResp?.ok).toBe(true);
  await advancePlot(frame, 61_000);

  const policy = await postJson(frame, '/api/founders-plot/policy', { key: 'collectOutputs', value: true });
  expect(policy?.ok).toBe(true);

  const enabled = await frame.evaluate(async () => window.__foundersPlotTest.enableCollectReadyOutputs());
  expect(enabled?.ok).toBe(true);

  await frame.getByTestId('founders-clover-avatar').click();
  await frame.getByTestId('foreman-run-now-btn').click();
  await frame.waitForFunction(() => {
    return window.__foundersPlotTest.getState()?.state?.foreman?.receipt?.action === 'collect_ready_outputs';
  }, null, { timeout: 10_000 });

  const replay = await getJson(frame, '/api/founders-plot/replay');
  expect(replay?.ok).toBe(true);
  const events = Array.isArray(replay?.replay?.events) ? replay.replay.events : [];
  const startedEvent = events.find((event) => event?.type === 'FOREMAN_WORKER_COMMAND_STARTED');
  const completedEvent = events.find((event) => event?.type === 'FOREMAN_WORKER_COMMAND_COMPLETED');
  const actionEvent = events.find((event) => event?.type === 'AGENT_ACTION_EXECUTED');

  expect(startedEvent?.data?.origin).toBe('OPENCLAW_LITE_WORKER');
  expect(completedEvent?.data?.origin).toBe('OPENCLAW_LITE_WORKER');
  expect(actionEvent?.data).toEqual(expect.objectContaining({
    origin: 'OPENCLAW_LITE_WORKER',
    runtimeId: started.runtime.runtimeId
  }));
  expect(actionEvent?.data?.workerCommandId).toMatch(/^fpwcmd_/);
  expect(actionEvent?.data?.workerTraceId).toMatch(/^fpwtrace_/);
  expect(llmPaths.length).toBe(llmPathCountBeforeForemanTick);
});
