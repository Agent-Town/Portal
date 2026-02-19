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

test.describe('OpenClaw Lite: Public Profile + Town Grid (M6)', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
  });

  test('publish public profile and render in /town grid (sanitized)', async ({ page }) => {
    await resetClientStorage(page);
    await page.goto('/lite');

    // Clear demo approval.
    await page.getByRole('button', { name: 'Approve' }).click();
    await expect(page.getByTestId('runtime-logs')).toContainText(/demo approval: approved/i);

    // Create house
    await page.getByRole('button', { name: 'Create house' }).click();
    await expect(page.getByTestId('house-id')).toHaveText(/^[1-9A-HJ-NP-Za-km-z]+$/);

    // Publish profile (approval-gated)
    await page.getByRole('button', { name: 'Publish profile' }).click();
    await page.getByRole('button', { name: 'Approve' }).click();
    await expect(page.getByTestId('runtime-logs')).toContainText(/publish ok/i);

    await page.goto('/town');
    await expect(page.getByTestId('town-grid')).toBeVisible();
    await expect(page.getByTestId('town-grid')).toContainText('Lite House');
    // Sanitization: tags should not survive.
    await expect(page.getByTestId('town-grid')).not.toContainText('<script>');
    await expect(page.getByTestId('town-grid')).not.toContainText('<b>');
    await expect(page.getByTestId('town-grid')).toContainText('hello from lite');
  });
});
