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

test('invalid LLM candidate ids are rejected by the server and do not mutate the plot', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);
  await configureOpenRouterBrain(page);
  await prepareReadyCollectScenario(frame, { keyPrefix: 'v14-invalid-llm' });

  await page.route('**/openrouter.ai/api/v1/chat/completions', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: ssePayload(makeTextChunks({
        id: 'chatcmpl-v14-invalid-llm',
        model: OPENROUTER_MODEL,
        text: JSON.stringify({
          selectedCandidateId: 'collect:not_a_real_candidate',
          confidence: 0.61,
          reason: 'Collect ready output from Lumber Camp.',
          playerFacingLine: 'I tried to collect ready goods.',
          noopCode: null
        })
      }))
    });
  });

  await frame.getByTestId('founders-clover-avatar').click();
  await frame.getByTestId('foreman-run-now-btn').click();
  await expect.poll(async () => {
    const replay = await getJson(frame, '/api/founders-plot/replay');
    const rejected = Array.isArray(replay?.replay?.events)
      ? replay.replay.events.find((event) => event?.type === 'FOREMAN_ACTION_REJECTED')
      : null;
    return String(rejected?.data?.error?.code || '');
  }, { timeout: 10_000 }).toBe('INVALID_FOREMAN_DECISION_CANDIDATE');

  const state = await frame.evaluate(() => window.__foundersPlotTest.getState()?.state || null);
  expect(state?.foreman?.receipt).toBeNull();

  const replay = await getJson(frame, '/api/founders-plot/replay');
  const rejected = Array.isArray(replay?.replay?.events)
    ? replay.replay.events.find((event) => event?.type === 'FOREMAN_ACTION_REJECTED')
    : null;
  expect(rejected?.data?.error).toEqual(expect.objectContaining({
    code: 'INVALID_FOREMAN_DECISION_CANDIDATE',
    chosenCandidateId: 'collect:not_a_real_candidate'
  }));
});
