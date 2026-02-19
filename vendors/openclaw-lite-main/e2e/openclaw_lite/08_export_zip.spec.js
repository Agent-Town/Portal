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

test.describe('OpenClaw Lite: Export Zip (M7)', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
  });

  test('export produces a zip with manifest + sessions JSONL', async ({ page }) => {
    await resetClientStorage(page);
    await page.goto('/lite');

    const download = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Export' }).click()
    ]).then((x) => x[0]);

    const path = await download.path();
    expect(path).toBeTruthy();

    const { validateOpenClawLiteExportZip } = await import('../../scripts/openclaw_compat/validate_export_zip.mjs');
    const result = await validateOpenClawLiteExportZip(path);
    expect(result.ok).toBeTruthy();
  });
});
