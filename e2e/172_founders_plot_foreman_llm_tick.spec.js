const { test, expect } = require('@playwright/test');
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
const OPENROUTER_MODEL = 'nvidia/nemotron-3-super-120b-a12b:free';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

function ssePayload(chunks) {
  return chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`).join('') + 'data: [DONE]\n\n';
}

function makeTextChunks({ id, model, text }) {
  const created = Math.floor(Date.now() / 1000);
  return [
    {
      id,
      object: 'chat.completion.chunk',
      created,
      model,
      choices: [{
        index: 0,
        delta: { role: 'assistant', content: String(text || '') },
        finish_reason: null
      }]
    },
    {
      id,
      object: 'chat.completion.chunk',
      created,
      model,
      choices: [{ index: 0, delta: {}, finish_reason: 'stop' }]
    }
  ];
}

test('live Foreman ticks use a client-only OpenRouter call and persist an llm-sourced decision before acting', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);
  const configured = await page.evaluate(async ({ provider, modelRef, modelId, api, baseUrl, apiKey }) => {
    return await window.__openclawLiteTest.setLlmConfig({
      provider,
      modelRef,
      modelId,
      api,
      baseUrl,
      apiKey,
      useProxy: true
    });
  }, {
    provider: 'openrouter',
    modelRef: `openrouter/${OPENROUTER_MODEL}`,
    modelId: OPENROUTER_MODEL,
    api: 'openai-completions',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: 'or-test-key'
  });
  expect(configured?.data || configured).toEqual(expect.objectContaining({
    provider: 'openrouter',
    modelRef: `openrouter/${OPENROUTER_MODEL}`
  }));

  const started = await startForemanRuntime(frame);
  expect(started?.ok).toBe(true);

  const placed = await placeFirstLumberCamp(frame, 'v13-llm-foreman');
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
    idempotencyKey: 'v13-llm-foreman:queue'
  });
  expect(queueResp?.ok).toBe(true);
  await advancePlot(frame, 61_000);

  const policy = await postJson(frame, '/api/founders-plot/policy', { key: 'collectOutputs', value: true });
  expect(policy?.ok).toBe(true);

  const enabled = await frame.evaluate(async () => window.__foundersPlotTest.enableCollectReadyOutputs());
  expect(enabled?.ok).toBe(true);

  const observation = await frame.evaluate(async () => window.__foundersPlotTest.getForemanObservation());
  expect(observation?.ok).toBe(true);
  const chosenCandidateId = Array.isArray(observation?.safeCandidates)
    ? String(observation.safeCandidates.find((candidate) => candidate?.canActNow === true)?.candidateId || '')
    : '';
  expect(chosenCandidateId).toMatch(/^collect:/);

  const backendLlmPaths = [];
  page.on('request', (request) => {
    const pathname = new URL(request.url()).pathname;
    if (!pathname.startsWith('/api/llm/')) return;
    backendLlmPaths.push(pathname);
  });
  const decisionSyncBodies = [];
  await page.route('**/api/founders-plot/foreman/decision', async (route) => {
    decisionSyncBodies.push(route.request().postDataJSON());
    await route.continue();
  });

  const llmUrls = [];
  await page.route('**/openrouter.ai/api/v1/chat/completions', async (route) => {
    llmUrls.push(route.request().url());
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: ssePayload(makeTextChunks({
        id: 'chatcmpl-founders-plot-foreman',
        model: OPENROUTER_MODEL,
        text: JSON.stringify({
          chosenCandidateId
        })
      }))
    });
  });

  await frame.getByTestId('founders-clover-avatar').click();
  await frame.getByTestId('foreman-run-now-btn').click();
  await frame.waitForFunction(() => {
    return !!window.__foundersPlotTest.getState()?.state?.foreman?.receipt?.receiptId;
  }, null, { timeout: 10_000 });

  const state = await frame.evaluate(() => window.__foundersPlotTest.getState()?.state || null);
  expect(state?.foreman?.lastDecision).toEqual(expect.objectContaining({
    source: 'llm',
    chosenCandidateId
  }));
  expect(state?.foreman?.planCard).toEqual(expect.objectContaining({
    proposedTool: 'et.plot.collect_outputs'
  }));

  const replay = await getJson(frame, '/api/founders-plot/replay');
  expect(replay?.ok).toBe(true);
  const events = Array.isArray(replay?.replay?.events) ? replay.replay.events : [];
  const actionEvent = events.find((event) => event?.type === 'AGENT_ACTION_EXECUTED');
  expect(actionEvent?.data).toEqual(expect.objectContaining({
    origin: 'OPENCLAW_LITE_WORKER',
    runtimeId: started.runtime.runtimeId
  }));

  await expect.poll(() => llmUrls[0] || '', { timeout: 5_000 }).toContain('https://openrouter.ai/api/v1/chat/completions');
  expect(backendLlmPaths).toEqual([]);
  expect(decisionSyncBodies[0]).toEqual({
    chosenCandidateId,
    selectedCandidateId: chosenCandidateId,
    source: 'llm',
    confidence: expect.any(Number),
    reason: expect.any(String),
    playerFacingLine: expect.any(String),
    noopCode: null,
    modelInvocationId: expect.stringMatching(/^fpllm_/),
    testBrainInvocationId: null,
    provider: 'openrouter',
    model: `openrouter/${OPENROUTER_MODEL}`,
    llmToolName: 'founders_plot_foreman_select_candidate',
    workerCommandId: expect.stringMatching(/^fpwcmd_/),
    workerTraceId: expect.stringMatching(/^fpwtrace_/),
    pack: expect.objectContaining({
      packHash: expect.any(String),
      files: expect.objectContaining({
        skillMdHash: expect.any(String),
        heartbeatMdHash: expect.any(String),
        toolsMdHash: expect.any(String),
        goalsMdHash: expect.any(String)
      })
    }),
    toolContract: expect.objectContaining({
      source: 'merged',
      aliasMap: expect.objectContaining({
        founders_plot_collect_outputs: 'et.plot.collect_outputs'
      })
    }),
    contextSummary: expect.objectContaining({
      contextVersion: 'founders-plot-foreman-context.v1',
      completeness: expect.objectContaining({
        canAct: true
      }),
      safeCandidates: expect.any(Array)
    })
  });
});
