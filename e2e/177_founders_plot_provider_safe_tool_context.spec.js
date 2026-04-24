const { test, expect } = require('@playwright/test');
const { openFoundersPlotFrame } = require('./helpers/founders_plot');
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

test('Foreman provider request exposes provider-safe aliases instead of dotted tool names', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);
  await configureOpenRouterBrain(page);
  const scenario = await prepareReadyCollectScenario(frame, { keyPrefix: 'v14-provider-safe' });
  let requestRaw = '';

  await page.route('**/openrouter.ai/api/v1/chat/completions', async (route) => {
    requestRaw = route.request().postData() || '';
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: ssePayload(makeTextChunks({
        id: 'chatcmpl-v14-provider-safe',
        model: OPENROUTER_MODEL,
        text: JSON.stringify({
          selectedCandidateId: scenario.actionableCandidateId,
          confidence: 0.93,
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

  const requestBody = JSON.parse(requestRaw || '{}');
  const promptContent = Array.isArray(requestBody?.messages)
    ? requestBody.messages.map((message) => (
        typeof message?.content === 'string'
          ? message.content
          : JSON.stringify(message?.content || '')
      )).join('\n')
    : '';
  const normalizedPromptContent = promptContent.replace(/\\"/g, '"');

  expect(normalizedPromptContent).toContain('founders_plot_foreman_select_candidate');
  expect(normalizedPromptContent).toContain('founders_plot_collect_outputs');
  expect(normalizedPromptContent).toContain('"canonicalName":"et.plot.collect_outputs"');
  expect(normalizedPromptContent).not.toContain('"name":"et.plot.collect_outputs"');
});
