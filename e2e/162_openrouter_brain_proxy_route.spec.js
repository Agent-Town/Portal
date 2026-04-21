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

test('openrouter brain config routes agent turns through the OpenRouter proxy path', async ({ page }) => {
  await enterHatch(page, 'signup');
  await completeHatch(page);

  const llmPaths = [];
  await page.route('**/api/llm/**', async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    llmPaths.push(pathname);
    await route.fulfill({
      status: 502,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: false,
        error: 'TEST_LLM_BLOCKED'
      })
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

  await expect.poll(() => llmPaths[0] || '', { timeout: 5_000 }).toContain('/api/llm/proxy/');
  expect(llmPaths[0]).toContain(encodeURIComponent('https://openrouter.ai/api/v1'));
  expect(llmPaths.some((path) => path.startsWith('/api/llm/openai/v1'))).toBe(false);
});
