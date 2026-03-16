const { test, expect } = require('@playwright/test');
const { ensureAppShell } = require('./helpers/phase2');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('town hub primary shell copy stays plain-language and provider-neutral', async ({ page }) => {
  await ensureAppShell(page);

  const copy = await page.evaluate(() => {
    const nodes = [
      document.querySelector('[data-testid="town-focus-card"]'),
      document.querySelector('[data-testid="town-primary-action"]'),
      document.getElementById('townSceneStatus'),
    ].filter(Boolean);
    return nodes.map((node) => node.textContent || '').join(' ');
  });

  expect(copy).toMatch(/plan wagons|town hall|town board|pony express/i);
  expect(copy).not.toMatch(/\b(llm|model|provider|runtime|openai|anthropic|openrouter|ollama|brain config)\b/i);
});
