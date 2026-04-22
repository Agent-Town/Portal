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

test('receipt, replay, and recap preserve the LLM Foreman trace without debug jargon in the player-facing line', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);
  await configureOpenRouterBrain(page);
  const scenario = await prepareReadyCollectScenario(frame, { keyPrefix: 'v14-recap-trace' });

  await page.route('**/openrouter.ai/api/v1/chat/completions', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: ssePayload(makeTextChunks({
        id: 'chatcmpl-v14-recap-trace',
        model: OPENROUTER_MODEL,
        text: JSON.stringify({
          selectedCandidateId: scenario.actionableCandidateId,
          confidence: 0.95,
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

  const state = await frame.evaluate(() => window.__foundersPlotTest.getState()?.state || null);
  expect(state?.foreman?.receipt?.reason).toBe('I collected ready goods because the town could use the supplies.');
  expect(state?.foreman?.receipt?.reason).not.toMatch(/provider|runtime|openclaw|schema/i);

  const replay = await getJson(frame, '/api/founders-plot/replay');
  const eventTypes = Array.isArray(replay?.replay?.events) ? replay.replay.events.map((event) => event.type) : [];
  expect(eventTypes).toEqual(expect.arrayContaining([
    'FOREMAN_CONTEXT_ASSEMBLED',
    'FOREMAN_LLM_REQUESTED',
    'FOREMAN_LLM_DECISION_SELECTED',
    'FOREMAN_TOOL_ALIAS_MAPPED',
    'AGENT_ACTION_EXECUTED',
    'FOREMAN_RECEIPT_CREATED'
  ]));

  const recap = await getJson(frame, '/api/founders-plot/recap');
  const lines = Array.isArray(recap?.recap?.lines) ? recap.recap.lines.map((entry) => entry.line || '') : [];
  expect(lines.some((line) => /town could use the supplies/i.test(line))).toBe(true);
});
