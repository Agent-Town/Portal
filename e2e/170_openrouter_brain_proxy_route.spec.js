const { test, expect } = require('@playwright/test');
const {
  completeHatch,
  configureLiteLlm,
  enterHatch,
  ensureLiteConnected
} = require('./helpers/phase2');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('openrouter brain config keeps the browser on a direct OpenRouter path', async ({ page }) => {
  await enterHatch(page, 'signup');
  await completeHatch(page);

  const llmPaths = [];
  const backendProxyPaths = [];
  page.on('request', (request) => {
    const pathname = new URL(request.url()).pathname;
    if (!pathname.startsWith('/api/llm/')) return;
    backendProxyPaths.push(pathname);
  });
  await page.route('**/openrouter.ai/api/v1/chat/completions', async (route) => {
    llmPaths.push(route.request().url());
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: [
        `data: ${JSON.stringify({
          id: 'chatcmpl-openrouter-direct',
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model: 'nvidia/nemotron-3-super-120b-a12b:free',
          choices: [{
            index: 0,
            delta: { role: 'assistant', content: 'READY' },
            finish_reason: null
          }]
        })}\n\n`,
        `data: ${JSON.stringify({
          id: 'chatcmpl-openrouter-direct',
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model: 'nvidia/nemotron-3-super-120b-a12b:free',
          choices: [{ index: 0, delta: {}, finish_reason: 'stop' }]
        })}\n\n`,
        'data: [DONE]\n\n'
      ].join('')
    });
  });

  await configureLiteLlm(page, {
    provider: 'openrouter',
    model: 'nvidia/nemotron-3-super-120b-a12b:free',
    apiKey: 'or-test-key'
  });
  await ensureLiteConnected(page);

  await page.evaluate(async () => {
    const run = window.__openclawLiteTest?.experienceRun;
    if (typeof run !== 'function') return null;
    try {
      return await run({ prompt: 'Read SKILL.md and reply with exactly READY.' });
    } catch (error) {
      return { ok: false, error: String(error?.message || error) };
    }
  });

  await expect.poll(() => llmPaths[0] || '', { timeout: 5_000 }).toContain('https://openrouter.ai/api/v1/chat/completions');
  expect(backendProxyPaths).toEqual([]);
});
