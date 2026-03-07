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

test.describe('OpenClaw Lite: Tool Pairing Invariants (M9)', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
  });

  test('tool call/result transcript pairing remains valid after synthetic tool run', async ({ page }) => {
    await resetClientStorage(page);
    await page.goto('/lite');

    const smoke = await page.evaluate(async () => window.__openclawLiteTest.runToolSmoke({ count: 5 }));
    expect(smoke.completed).toBeGreaterThanOrEqual(5);

    const stats = await page.evaluate(async () => window.__openclawLiteTest.getTranscriptToolStats());
    expect(stats).toBeTruthy();
    expect(stats.toolResultCount).toBeGreaterThanOrEqual(5);
    expect(stats.orphanToolResults).toBe(0);
    expect(stats.duplicateToolResults).toBe(0);
    expect(stats.displacedToolResults).toBe(0);
  });
});
