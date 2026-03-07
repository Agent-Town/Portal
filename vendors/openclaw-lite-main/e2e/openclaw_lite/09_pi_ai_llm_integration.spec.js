const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

async function resetClientStorage(page) {
  await page.goto('/test_blank.html');
  await page.evaluate(async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore
    }
    await new Promise((resolve) => {
      const req = indexedDB.deleteDatabase('openclaw-lite');
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => resolve();
    });
  });
}

test.describe('OpenClaw Lite: PI-AI LLM Integration (M8)', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
  });

  test('chat calls OpenAI-compatible proxy via PI-AI (no mocks)', async ({ page, request }) => {
    const stats0 = await (await request.get('/__test__/llm/stats')).json();
    expect(stats0.ok).toBeTruthy();
    expect(stats0.chatCompletions).toBe(0);

    await resetClientStorage(page);
    await page.goto('/lite');

    await page.getByTestId('llm-key-input').fill('test-key');
    await page.getByTestId('llm-key-save').click();

    await page.getByTestId('chat-input').fill('ping');
    await page.getByTestId('chat-send').click();

    await expect(page.getByTestId('chat-transcript')).toContainText('assistant: pi-ai ok');

    const stats1 = await (await request.get('/__test__/llm/stats')).json();
    expect(stats1.ok).toBeTruthy();
    expect(stats1.chatCompletions).toBe(1);
    expect(stats1.lastPath).toBe('/api/llm/openai/v1/chat/completions');
  });
});

