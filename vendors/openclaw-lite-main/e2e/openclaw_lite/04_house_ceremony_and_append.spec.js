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

test.describe('OpenClaw Lite: House Ceremony + Append (M3)', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
  });

  test('lite derives house keys locally, creates house, and appends an E2EE entry', async ({ page }) => {
    await resetClientStorage(page);
    await page.goto('/lite');

    // Configure LLM (NO MOCKS)
    await page.getByTestId('llm-key-input').fill('test-key');
    await page.getByTestId('llm-key-save').click();

    // Clear the demo approval so later approvals are unambiguous.
    await page.getByRole('button', { name: 'Approve' }).click();
    await expect(page.getByTestId('runtime-logs')).toContainText(/demo approval: approved/i);

    // Trigger local ceremony and house init from the runtime.
    await page.getByRole('button', { name: 'Create house' }).click();
    await expect(page.getByTestId('house-id')).toHaveText(/^[1-9A-HJ-NP-Za-km-z]+$/);

    const houseId = (await page.getByTestId('house-id').innerText()).trim();
    expect(houseId).toBeTruthy();

    // Append an entry via runtime (approval-gated).
    await page.getByTestId('chat-input').fill('append: hello');
    await page.getByTestId('chat-send').click();
    await page.getByRole('button', { name: 'Approve' }).click();
    await expect(page.getByTestId('runtime-logs')).toContainText(/append ok/i);

    // Validate the house page can decrypt and render the appended entry.
    await page.goto(`/house?house=${encodeURIComponent(houseId)}`);
    await page.getByRole('button', { name: 'Connect wallet' }).click();
    await page.getByRole('button', { name: 'Sign to unlock' }).click();
    await expect(page.locator('#entries')).toContainText('hello');
  });
});
