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

test.describe('OpenClaw Lite: Device Loss Restore (M5)', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
  });

  test('clear storage, recover keys via wallet wrap, restore from latest vault backup', async ({ browser, page }) => {
    await resetClientStorage(page);
    await page.goto('/lite');

    // Clear demo approval.
    await page.getByRole('button', { name: 'Approve' }).click();
    await expect(page.getByTestId('runtime-logs')).toContainText(/demo approval: approved/i);

    // Create house + backup.
    await page.getByRole('button', { name: 'Create house' }).click();
    await expect(page.getByTestId('house-id')).toHaveText(/^[1-9A-HJ-NP-Za-km-z]+$/);
    const houseId = (await page.getByTestId('house-id').innerText()).trim();
    expect(houseId).toBeTruthy();

    await page.getByRole('button', { name: 'Lock + backup' }).click();
    await page.getByRole('button', { name: 'Approve' }).click();
    await expect(page.getByTestId('runtime-logs')).toContainText(/backup ok vb_/i);

    const ctx2 = await browser.newContext();
    const page2 = await ctx2.newPage();
    await resetClientStorage(page2);
    await page2.goto('/lite');

    await expect(page2.getByTestId('runtime-status')).toHaveText(/ready/i);

    // Clear demo approval.
    await page2.getByRole('button', { name: 'Approve' }).click();
    await expect(page2.getByTestId('runtime-logs')).toContainText(/demo approval: approved/i);

    // Recover house via wallet lookup + keyWrap.
    await page2.getByRole('button', { name: 'Recover house' }).click();
    await expect(page2.getByTestId('runtime-logs')).toContainText(/house recovered/i);
    await expect(page2.getByTestId('house-id')).toHaveText(houseId);

    // Restore from latest vault backup (marker should be restored).
    await page2.getByRole('button', { name: 'Restore' }).click();
    await expect(page2.getByTestId('runtime-logs')).toContainText('restore ok marker=secret.marker=1');
  });
});
