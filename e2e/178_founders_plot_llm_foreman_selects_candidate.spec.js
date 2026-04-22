const { test, expect } = require('@playwright/test');
const { getJson, openFoundersPlotFrame } = require('./helpers/founders_plot');
const {
  OPENROUTER_MODEL,
  configureOpenRouterBrain,
  makeTextChunks,
  prepareReadyCollectScenario,
  ssePayload
} = require('./helpers/founders_plot_foreman');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('LLM Foreman selects one safe candidate and syncs rich decision metadata before acting', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);
  await configureOpenRouterBrain(page);
  const scenario = await prepareReadyCollectScenario(frame, { keyPrefix: 'v14-llm-select' });
  const decisionSyncBodies = [];

  await page.route('**/api/founders-plot/foreman/decision', async (route) => {
    decisionSyncBodies.push(route.request().postDataJSON());
    await route.continue();
  });
  await page.route('**/openrouter.ai/api/v1/chat/completions', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: ssePayload(makeTextChunks({
        id: 'chatcmpl-v14-llm-select',
        model: OPENROUTER_MODEL,
        text: JSON.stringify({
          selectedCandidateId: scenario.actionableCandidateId,
          confidence: 0.97,
          reason: 'Collect ready output from Lumber Camp.',
          playerFacingLine: 'I collected ready goods because the town could use the supplies.',
          noopCode: null
        })
      }))
    });
  });

  await frame.getByTestId('founders-clover-avatar').click();
  await frame.getByTestId('foreman-run-now-btn').click();
  await frame.waitForFunction(() => !!window.__foundersPlotTest.getState()?.state?.foreman?.receipt?.receiptId, null, { timeout: 10_000 });

  expect(decisionSyncBodies[0]).toEqual(expect.objectContaining({
    chosenCandidateId: scenario.actionableCandidateId,
    selectedCandidateId: scenario.actionableCandidateId,
    source: 'llm',
    provider: 'openrouter',
    model: `openrouter/${OPENROUTER_MODEL}`,
    llmToolName: 'founders_plot_foreman_select_candidate'
  }));
  expect(String(decisionSyncBodies[0]?.modelInvocationId || '')).toMatch(/^fpllm_/);
  expect(String(decisionSyncBodies[0]?.pack?.packHash || '')).not.toHaveLength(0);
  expect(decisionSyncBodies[0]?.toolContract?.aliasMap).toEqual(expect.objectContaining({
    founders_plot_collect_outputs: 'et.plot.collect_outputs'
  }));

  const state = await frame.evaluate(() => window.__foundersPlotTest.getState()?.state || null);
  expect(state?.foreman?.lastDecision).toEqual(expect.objectContaining({
    source: 'llm',
    chosenCandidateId: scenario.actionableCandidateId,
    playerFacingLine: 'I collected ready goods because the town could use the supplies.'
  }));

  const replay = await getJson(frame, '/api/founders-plot/replay');
  const llmDecisionEvent = Array.isArray(replay?.replay?.events)
    ? replay.replay.events.find((event) => event?.type === 'FOREMAN_LLM_DECISION_SELECTED')
    : null;
  expect(llmDecisionEvent?.data).toEqual(expect.objectContaining({
    selectedCandidateId: scenario.actionableCandidateId,
    llmToolName: 'founders_plot_foreman_select_candidate'
  }));
});
