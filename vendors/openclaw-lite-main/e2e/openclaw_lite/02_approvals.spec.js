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

test.describe('OpenClaw Lite: Approvals + Logs (M1)', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
  });

  test('runtime can request approval; human can accept; runtime logs outcome', async ({ page }) => {
    await resetClientStorage(page);
    await page.goto('/lite');

    // Expect one deterministic demo approval request emitted by the runtime.
    await expect(page.getByTestId('approvals')).toContainText(/approval/i);

    await page.getByRole('button', { name: 'Approve' }).click();

    await expect(page.getByTestId('runtime-logs')).toContainText(/approved/i);
  });
});
