const { test, expect } = require('@playwright/test');
const { getJson, openFoundersPlotFrame } = require('./helpers/founders_plot');
const {
  OPENROUTER_MODEL,
  configureOpenRouterBrain,
  prepareReadyCollectScenario,
} = require('./helpers/founders_plot_foreman');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';
const SMOKE_ENABLED = process.env.REAL_LLM_FOREMAN_SMOKE === '1';
const SMOKE_PROVIDER = String(process.env.FOUNDERS_PLOT_SMOKE_PROVIDER || 'openrouter').trim().toLowerCase();
const SMOKE_MODEL = String(process.env.FOUNDERS_PLOT_SMOKE_MODEL || OPENROUTER_MODEL).trim();
const SMOKE_API_KEY = String(process.env.OPENROUTER_API_KEY || '').trim();

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('gated live-provider smoke proves the real Foreman path exists', async ({ page }) => {
  test.skip(!SMOKE_ENABLED, 'REAL_LLM_FOREMAN_SMOKE is not enabled.');
  test.skip(SMOKE_PROVIDER !== 'openrouter', 'Only the OpenRouter smoke path is defined in this branch.');
  test.skip(!SMOKE_API_KEY, 'OPENROUTER_API_KEY is required for the live-provider smoke.');

  const frame = await openFoundersPlotFrame(page);
  await configureOpenRouterBrain(page, { apiKey: SMOKE_API_KEY });
  const scenario = await prepareReadyCollectScenario(frame, { keyPrefix: 'v14-live-smoke' });

  await frame.getByTestId('founders-clover-avatar').click();
  await frame.getByTestId('foreman-run-now-btn').click();
  await frame.waitForFunction(() => !!window.__foundersPlotTest.getState()?.state?.foreman?.receipt?.receiptId, null, { timeout: 20_000 });

  const state = await frame.evaluate(() => window.__foundersPlotTest.getState()?.state || null);
  expect(state?.foreman?.lastDecision?.source).toBe('llm');

  const replay = await getJson(frame, '/api/founders-plot/replay');
  const llmDecisionEvent = Array.isArray(replay?.replay?.events)
    ? replay.replay.events.find((event) => event?.type === 'FOREMAN_LLM_DECISION_SELECTED')
    : null;
  expect(llmDecisionEvent?.data).toEqual(expect.objectContaining({
    provider: 'openrouter',
    model: `openrouter/${SMOKE_MODEL}`,
    selectedCandidateId: scenario.actionableCandidateId
  }));
});
