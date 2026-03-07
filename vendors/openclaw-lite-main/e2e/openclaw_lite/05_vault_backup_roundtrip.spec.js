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

test.describe('OpenClaw Lite: Vault Backup Roundtrip (M4)', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
  });

  test('upload encrypted vault backup; pointer updates; download and decrypt', async ({ page }) => {
    await resetClientStorage(page);
    await page.goto('/lite');

    // Clear demo approval.
    await page.getByRole('button', { name: 'Approve' }).click();
    await expect(page.getByTestId('runtime-logs')).toContainText(/demo approval: approved/i);

    // Create house
    await page.getByRole('button', { name: 'Create house' }).click();
    await expect(page.getByTestId('house-id')).toHaveText(/^[1-9A-HJ-NP-Za-km-z]+$/);
    const houseId = (await page.getByTestId('house-id').innerText()).trim();
    expect(houseId).toBeTruthy();

    // Trigger "Lock + Backup" (approval-gated)
    await page.getByRole('button', { name: 'Lock + backup' }).click();
    await page.getByRole('button', { name: 'Approve' }).click();
    await expect(page.getByTestId('runtime-logs')).toContainText(/backup ok vb_/i);
    await expect(page.getByTestId('vault-backup-status')).toContainText(/latest vb_/i);

    // Restore
    await page.getByRole('button', { name: 'Restore' }).click();
    await expect(page.getByTestId('runtime-logs')).toContainText('restore ok marker=secret.marker=1');

    // House ID should remain the same after restore.
    await expect(page.getByTestId('house-id')).toHaveText(houseId);
  });
});
