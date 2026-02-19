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

test.describe('OpenClaw Lite: Local Checkpoints (M2)', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
  });

  test('writing checkpoints on chat send and pagehide', async ({ page }) => {
    await resetClientStorage(page);
    await page.goto('/lite');

    // Configure LLM (NO MOCKS): Lite must call the OpenAI-compatible proxy.
    await page.getByTestId('llm-key-input').fill('test-key');
    await page.getByTestId('llm-key-save').click();

    await page.getByTestId('chat-input').fill('checkpoint please');
    await page.getByTestId('chat-send').click();

    await expect.poll(async () => await page.evaluate(async () => window.__openclawLiteTest.countCheckpoints())).toBeGreaterThan(0);
    const countAfterChat = await page.evaluate(async () => window.__openclawLiteTest.countCheckpoints());
    expect(countAfterChat).toBeGreaterThan(0);

    // Trigger pagehide
    await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));

    await expect
      .poll(async () => await page.evaluate(async () => window.__openclawLiteTest.countCheckpoints()))
      .toBeGreaterThan(countAfterChat);
    const countAfterHide = await page.evaluate(async () => window.__openclawLiteTest.countCheckpoints());
    expect(countAfterHide).toBeGreaterThan(countAfterChat);
  });
});
