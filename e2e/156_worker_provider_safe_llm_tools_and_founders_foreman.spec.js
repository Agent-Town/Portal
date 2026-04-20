const { test, expect } = require('@playwright/test');
const { gotoAppWithLite, runExperience, setDeterministicLlm, visitSkill } = require('./helpers/trainer');
const {
  advancePlot,
  bootstrapToHq2,
  getJson,
  getPlotState,
  openFoundersPlotFrame,
  postJson,
  runPlotTool,
  startForemanRuntime
} = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

function ssePayload(chunks) {
  return chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`).join('') + 'data: [DONE]\n\n';
}

function makeToolChunks({ id, model, name, args = {}, callId }) {
  const created = Math.floor(Date.now() / 1000);
  return [
    {
      id,
      object: 'chat.completion.chunk',
      created,
      model,
      choices: [{
        index: 0,
        delta: {
          role: 'assistant',
          tool_calls: [{
            index: 0,
            id: callId,
            type: 'function',
            function: {
              name: String(name || ''),
              arguments: JSON.stringify(args || {})
            }
          }]
        },
        finish_reason: null
      }]
    },
    {
      id,
      object: 'chat.completion.chunk',
      created,
      model,
      choices: [{ index: 0, delta: {}, finish_reason: 'tool_calls' }]
    }
  ];
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
        delta: { role: 'assistant', content: String(text || 'done') },
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

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('worker LLM requests use only provider-safe tool names and expose alias mapping for dotted tools', async ({ page }) => {
  await gotoAppWithLite(page, { trainerNamespace: true });
  await setDeterministicLlm(page);
  await visitSkill(page, '/skill.md');

  const llmRequests = [];
  const routeUrl = '**/api/llm/openai/v1/chat/completions';
  try {
    await page.unroute(routeUrl);
  } catch {
    // no-op
  }

  await page.route(routeUrl, async (route, req) => {
    let parsed = null;
    try {
      parsed = JSON.parse(req.postData() || '{}');
    } catch {
      parsed = null;
    }
    llmRequests.push(parsed);
    const id = `chatcmpl_provider_safe_${llmRequests.length}`;
    const model = String(parsed?.model || 'deterministic');
    await route.fulfill({
      status: 200,
      headers: { 'content-type': 'text/event-stream; charset=utf-8' },
      body: ssePayload(makeTextChunks({ id, model, text: 'provider-safe request checked' }))
    });
  });

  const run = await runExperience(page, 'Read workspace/SKILL.md and reply once.');
  expect(run?.ok).toBe(true);

  await expect.poll(() => llmRequests.length, { timeout: 10_000 }).toBeGreaterThan(0);
  const first = llmRequests[0] || {};
  const toolNames = Array.isArray(first?.tools)
    ? first.tools
      .map((tool) => String(tool?.function?.name || '').trim())
      .filter(Boolean)
    : [];

  expect(toolNames.length).toBeGreaterThan(0);
  expect(toolNames.every((name) => /^[A-Za-z0-9_-]+$/.test(name))).toBe(true);
  expect(toolNames.some((name) => name.includes('.'))).toBe(false);
  expect(toolNames).toContain('trainer_list_runs');
  expect(toolNames).toContain('founders_plot_get_state');
  expect(toolNames).not.toContain('trainer.list_runs');
  expect(toolNames).not.toContain('et.plot.get_state');

  const registry = await page.evaluate(async () => window.__openclawLiteTest.getToolRegistryInfo());
  const rows = Array.isArray(registry?.tools) ? registry.tools : [];
  const trainerAlias = rows.find((row) => row?.name === 'trainer.list_runs') || null;
  const foundersAlias = rows.find((row) => row?.name === 'et.plot.get_state') || null;

  expect(trainerAlias?.llmName).toBe('trainer_list_runs');
  expect(foundersAlias?.llmName).toBe('founders_plot_get_state');
});

test('Founders Plot Run now makes an LLM turn with a provider-safe foreman selection tool instead of relying on a fresh server-side chooser', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);
  await setDeterministicLlm(page);
  await bootstrapToHq2(frame);

  const started = await startForemanRuntime(frame);
  expect(started?.ok).toBe(true);
  expect(String(started?.runtime?.token || '')).toBeTruthy();

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
    idempotencyKey: 'v12-real-llm:queue'
  });
  expect(queueResp?.ok).toBe(true);
  await advancePlot(frame, 61_000);

  const policy = await postJson(frame, '/api/founders-plot/policy', { key: 'collectOutputs', value: true });
  expect(policy?.ok).toBe(true);

  const enabled = await frame.evaluate(async () => window.__foundersPlotTest.enableCollectReadyOutputs());
  expect(enabled?.ok).toBe(true);

  const observationBefore = await frame.evaluate(async ({ token }) => {
    const response = await fetch('/api/founders-plot/foreman/observation', {
      method: 'GET',
      credentials: 'include',
      headers: { authorization: `Bearer ${token}` }
    });
    return await response.json().catch(() => ({}));
  }, { token: started.runtime.token });

  expect(observationBefore?.ok).toBe(true);
  expect(Array.isArray(observationBefore?.safeCandidates)).toBe(true);
  expect(observationBefore.safeCandidates.some((candidate) => candidate?.buildingId === lumberBuildingId)).toBe(true);
  expect(observationBefore?.decision?.chosenCandidateId || null).toBeNull();
  expect(observationBefore?.decision?.planCard || null).toBeNull();

  const llmRequests = [];
  let callCount = 0;
  const routeUrl = '**/api/llm/openai/v1/chat/completions';
  try {
    await page.unroute(routeUrl);
  } catch {
    // no-op
  }

  await page.route(routeUrl, async (route, req) => {
    callCount += 1;
    let parsed = null;
    try {
      parsed = JSON.parse(req.postData() || '{}');
    } catch {
      parsed = null;
    }
    llmRequests.push(parsed);
    const id = `chatcmpl_foreman_${callCount}`;
    const model = String(parsed?.model || 'deterministic');
    const chunks = callCount === 1
      ? makeToolChunks({
        id,
        model,
        name: 'founders_plot_foreman_select_candidate',
        args: {
          candidateId: `collect:${lumberBuildingId}`,
          reason: 'Careful Steward takes the ready lumber now to keep reserves dependable.'
        },
        callId: 'call_foreman_collect'
      })
      : makeTextChunks({
        id,
        model,
        text: 'Careful Steward takes the ready lumber now to keep reserves dependable.'
      });
    await route.fulfill({
      status: 200,
      headers: { 'content-type': 'text/event-stream; charset=utf-8' },
      body: ssePayload(chunks)
    });
  });

  await frame.getByTestId('foreman-run-now-btn').click();

  await frame.waitForFunction(() => {
    const state = window.__foundersPlotTest.getState()?.state;
    return state?.foreman?.receipt?.action === 'collect_ready_outputs'
      && !!state?.foreman?.lastDecision?.chosenCandidateId;
  }, null, { timeout: 10_000 });

  await expect.poll(() => llmRequests.length, { timeout: 10_000 }).toBeGreaterThan(0);
  const first = llmRequests[0] || {};
  const toolNames = Array.isArray(first?.tools)
    ? first.tools
      .map((tool) => String(tool?.function?.name || '').trim())
      .filter(Boolean)
    : [];
  expect(toolNames.length).toBeGreaterThan(0);
  expect(toolNames.every((name) => /^[A-Za-z0-9_-]+$/.test(name))).toBe(true);
  expect(toolNames).toContain('founders_plot_foreman_select_candidate');
  expect(toolNames).not.toContain('et.plot.collect_outputs');

  const stateAfter = await getPlotState(frame);
  expect(stateAfter?.foreman?.receipt?.action).toBe('collect_ready_outputs');
  expect(stateAfter?.foreman?.lastDecision?.chosenCandidateId).toBe(`collect:${lumberBuildingId}`);
  expect(stateAfter?.foreman?.planCard?.proposedTool).toBe('et.plot.collect_outputs');
  expect(String(stateAfter?.foreman?.planCard?.reason || '')).toMatch(/careful|reserve|dependable/i);

  const replay = await getJson(frame, '/api/founders-plot/replay');
  expect(replay?.ok).toBe(true);
  const events = Array.isArray(replay?.replay?.events) ? replay.replay.events : [];
  const actionEvent = events.find((event) => event?.type === 'AGENT_ACTION_EXECUTED' && event?.data?.tool === 'et.plot.collect_outputs');
  expect(actionEvent?.data?.origin).toBe('OPENCLAW_LITE_WORKER');
  expect(actionEvent?.data?.runtimeId).toBe(started.runtime.runtimeId);
});
