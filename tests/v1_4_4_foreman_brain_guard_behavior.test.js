const http = require('node:http');
const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { createFoundersPlotRouter } = require('../server/founders_plot/routes');
const { startForemanSession } = require('../server/founders_plot/engine');
const {
  listEvents,
  loadPlotByPairId,
  savePlotGraph
} = require('../server/founders_plot/store');

async function withFoundersPlotServer(fn) {
  const pairId = `pair-v144-guard-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const app = express();
  app.use(express.json());
  app.use(createFoundersPlotRouter({
    resolveIdentity: () => ({
      pairId,
      houseId: null
    })
  }));
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    return await fn({ baseUrl, pairId });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('Foreman mutation route rejects brainless runtime without world mutation or AGENT events', async () => {
  await withFoundersPlotServer(async ({ baseUrl, pairId }) => {
    const stateResp = await fetch(`${baseUrl}/api/founders-plot/state`);
    assert.equal(stateResp.status, 200);

    const state = loadPlotByPairId(pairId);
    assert.ok(state?.plot?.plotId);
    const inventoryBefore = { ...state.plot.inventory };
    const eventCountBefore = listEvents(state.plot.plotId, { limit: 500 }).length;

    const runtime = startForemanSession(state, {
      nowMs: Date.now(),
      brainReady: false,
      pack: {
        skillLoaded: true,
        heartbeatLoaded: true,
        toolsLoaded: true,
        goalsLoaded: true
      }
    });
    savePlotGraph(state);

    const toolResp = await fetch(`${baseUrl}/api/founders-plot/foreman/tool/et.plot.collect_outputs`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${runtime.token}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        buildingId: 'bld_missing',
        idempotencyKey: 'v144-guard-no-brain',
        origin: 'OPENCLAW_LITE_WORKER',
        runtimeId: runtime.runtimeId,
        workerCommandId: 'cmd-no-brain',
        workerTraceId: 'trace-no-brain'
      })
    });

    const body = await toolResp.json();
    assert.equal(toolResp.status, 403, JSON.stringify(body));
    assert.equal(body?.error?.code, 'BRAIN_REQUIRED');
    assert.match(body?.error?.message || '', /Connect a Brain/);

    const after = loadPlotByPairId(pairId);
    assert.deepEqual(after.plot.inventory, inventoryBefore);
    const eventsAfter = listEvents(after.plot.plotId, { limit: 500 });
    assert.equal(eventsAfter.length, eventCountBefore);
    assert.equal(eventsAfter.some((event) => event.actor === 'AGENT'), false);
    assert.equal(eventsAfter.some((event) => event.type === 'AGENT_ACTION_EXECUTED'), false);
  });
});
