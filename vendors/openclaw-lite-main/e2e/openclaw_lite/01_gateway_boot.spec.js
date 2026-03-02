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

test.describe('OpenClaw Lite: Gateway Boot (M0)', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
  });

  test('GET /lite renders gateway and worker becomes ready', async ({ page }) => {
    // This test is intentionally skipped until OpenClaw Lite is implemented.
    // Acceptance criteria lives in:
    // - specs/07_openclaw_lite_web_runtime_spec_v1_2.md (M0)

    await resetClientStorage(page);
    await page.goto('/lite');

    // Stable selectors MUST be data-testid based.
    await expect(page.getByTestId('gateway')).toBeVisible();
    await expect(page.getByTestId('runtime-status')).toHaveText(/ready/i);
  });
});
