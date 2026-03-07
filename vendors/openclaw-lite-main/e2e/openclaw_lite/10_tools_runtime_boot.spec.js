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

test.describe('OpenClaw Lite: Tools Runtime Skeleton (M9)', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
  });

  test('worker exposes non-empty tool registry and completes tool smoke run', async ({ page }) => {
    await resetClientStorage(page);
    await page.goto('/lite');

    const registry = await page.evaluate(async () => window.__openclawLiteTest.getToolRegistryInfo());
    expect(registry).toBeTruthy();
    expect(registry.count).toBeGreaterThanOrEqual(5);
    expect(Array.isArray(registry.names)).toBeTruthy();
    expect(registry.names.length).toBeGreaterThanOrEqual(5);

    const smoke = await page.evaluate(async () => window.__openclawLiteTest.runToolSmoke({ count: 5 }));
    expect(smoke).toBeTruthy();
    expect(smoke.completed).toBeGreaterThanOrEqual(5);
    expect(smoke.dispatchPath).toBe('lite_tool_dispatch_v1');
  });
});
