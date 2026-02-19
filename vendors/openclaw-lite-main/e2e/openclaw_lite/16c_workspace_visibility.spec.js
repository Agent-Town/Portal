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

test.describe('OpenClaw Lite: Workspace Visibility UI (M15)', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
  });

  test('workspace panel shows agent-created/updated files with actor, path, and timestamp', async ({ page }) => {
    await resetClientStorage(page);
    await page.goto('/lite');

    const bootApprovals = page.getByTestId('approvals').getByRole('button', { name: 'Approve' });
    if (await bootApprovals.count()) {
      await bootApprovals.first().click();
    }

    const writeRes = await page.evaluate(async () => {
      return await window.__openclawLiteTest.workspaceWriteFile({
        path: 'workspace/skill.md',
        content: 'alpha',
      });
    });
    expect(writeRes.ok).toBeTruthy();

    const editRes = await page.evaluate(async () => {
      return await window.__openclawLiteTest.workspaceEditFile({
        path: 'workspace/skill.md',
        find: 'alpha',
        replace: 'beta',
      });
    });
    expect(editRes.ok).toBeTruthy();

    const events = await page.evaluate(async () => {
      return await window.__openclawLiteTest.workspaceEvents();
    });
    expect(events.ok).toBeTruthy();
    expect(Array.isArray(events.data.events)).toBeTruthy();

    const agentEvents = events.data.events.filter((e) => e && e.actor === 'agent' && e.path === 'workspace/skill.md');
    expect(agentEvents.length).toBeGreaterThanOrEqual(2);

    const panel = page.getByTestId('workspace-events');
    await expect(panel).toContainText('agent');
    await expect(panel).toContainText('workspace/skill.md');
    await expect(panel).toContainText(/\d{4}-\d{2}-\d{2}T/);
  });
});
