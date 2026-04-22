const {
  advancePlot,
  placeFirstLumberCamp,
  postJson,
  runPlotTool,
  startForemanRuntime,
} = require('./founders_plot');

const OPENROUTER_MODEL = 'nvidia/nemotron-3-super-120b-a12b:free';

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

async function configureOpenRouterBrain(page, { apiKey = 'or-test-key' } = {}) {
  return await page.evaluate(async ({ provider, modelRef, modelId, api, baseUrl, apiKey: value }) => {
    return await window.__openclawLiteTest.setLlmConfig({
      provider,
      modelRef,
      modelId,
      api,
      baseUrl,
      apiKey: value,
      useProxy: true
    });
  }, {
    provider: 'openrouter',
    modelRef: `openrouter/${OPENROUTER_MODEL}`,
    modelId: OPENROUTER_MODEL,
    api: 'openai-completions',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey
  });
}

async function configureDeterministicBrain(page) {
  return await page.evaluate(async () => {
    return await window.__openclawLiteTest.setLlmConfig({
      provider: 'test-local',
      modelRef: 'test-local/deterministic',
      modelId: 'deterministic',
      api: 'mock',
      baseUrl: '',
      apiKey: 'test-local-key',
      useProxy: false
    });
  });
}

async function prepareReadyCollectScenario(frame, { startRuntime = true, enableScheduler = true, keyPrefix = 'v14-foreman' } = {}) {
  const started = startRuntime ? await startForemanRuntime(frame) : null;
  const placed = await placeFirstLumberCamp(frame, `${keyPrefix}:place`);
  if (!placed?.ok) {
    throw new Error(`PLACE_FAILED:${placed?.error?.code || 'UNKNOWN'}`);
  }
  await advancePlot(frame, 31_000);

  const lumberBuildingId = await frame.evaluate(() => {
    const state = window.__foundersPlotTest.getState()?.state;
    const lumber = Array.isArray(state?.buildings)
      ? state.buildings.find((building) => building?.type === 'LUMBER_CAMP')
      : null;
    return String(lumber?.buildingId || '');
  });
  if (!lumberBuildingId) throw new Error('NO_LUMBER_CAMP');

  const queueResp = await runPlotTool(frame, 'et.plot.queue_job', {
    buildingId: lumberBuildingId,
    idempotencyKey: `${keyPrefix}:queue`
  });
  if (!queueResp?.ok) {
    throw new Error(`QUEUE_FAILED:${queueResp?.error?.code || 'UNKNOWN'}`);
  }
  await advancePlot(frame, 61_000);

  const policy = await postJson(frame, '/api/founders-plot/policy', {
    key: 'collectOutputs',
    value: true
  });
  if (!policy?.ok) {
    throw new Error(`POLICY_FAILED:${policy?.error?.code || 'UNKNOWN'}`);
  }

  if (enableScheduler) {
    const enabled = await frame.evaluate(async () => window.__foundersPlotTest.enableCollectReadyOutputs());
    if (!enabled?.ok) {
      throw new Error(`SCHEDULER_FAILED:${enabled?.error?.code || 'UNKNOWN'}`);
    }
  }

  const observation = await frame.evaluate(async () => window.__foundersPlotTest.getForemanObservation());
  const actionableCandidateId = Array.isArray(observation?.safeCandidates)
    ? String(observation.safeCandidates.find((candidate) => candidate?.canActNow === true)?.candidateId || '')
    : '';
  return {
    started,
    lumberBuildingId,
    observation,
    actionableCandidateId
  };
}

module.exports = {
  OPENROUTER_MODEL,
  configureDeterministicBrain,
  configureOpenRouterBrain,
  makeTextChunks,
  prepareReadyCollectScenario,
  ssePayload
};
