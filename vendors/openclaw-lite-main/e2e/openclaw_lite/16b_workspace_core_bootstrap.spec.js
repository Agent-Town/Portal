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

test.describe('OpenClaw Lite: Workspace Core Bootstrap (M15)', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
  });

  test('bootstrap creates missing core files once and does not overwrite existing files', async ({ page }) => {
    await resetClientStorage(page);
    await page.goto('/lite');

    const bootApprovals = page.getByTestId('approvals').getByRole('button', { name: 'Approve' });
    if (await bootApprovals.count()) {
      await bootApprovals.first().click();
    }

    const coreFiles = [
      'workspace/AGENTS.md',
      'workspace/SOUL.md',
      'workspace/USER.md',
      'workspace/IDENTITY.md',
      'workspace/TOOLS.md',
    ];

    const initialList = await page.evaluate(async () => {
      return await window.__openclawLiteTest.workspaceList({ path: 'workspace/' });
    });
    expect(initialList.ok).toBeTruthy();
    for (const core of coreFiles) {
      expect(initialList.data.paths).toContain(core);
    }

    const custom = 'custom tools content';
    const writeCustom = await page.evaluate(async ({ content }) => {
      return await window.__openclawLiteTest.workspaceWriteFile({
        path: 'workspace/TOOLS.md',
        content,
      });
    }, { content: custom });
    expect(writeCustom.ok).toBeTruthy();

    const ensure1 = await page.evaluate(async () => {
      return await window.__openclawLiteTest.workspaceBootstrap();
    });
    expect(ensure1.ok).toBeTruthy();

    const readTools = await page.evaluate(async () => {
      return await window.__openclawLiteTest.workspaceReadFile({ path: 'workspace/TOOLS.md' });
    });
    expect(readTools.ok).toBeTruthy();
    expect(readTools.data.content).toBe(custom);

    const delAgents = await page.evaluate(async () => {
      return await window.__openclawLiteTest.workspaceDelete({ path: 'workspace/AGENTS.md' });
    });
    expect(delAgents.ok).toBeTruthy();

    const ensure2 = await page.evaluate(async () => {
      return await window.__openclawLiteTest.workspaceBootstrap();
    });
    expect(ensure2.ok).toBeTruthy();
    expect(ensure2.data.createdPaths).toContain('workspace/AGENTS.md');

    const ensure3 = await page.evaluate(async () => {
      return await window.__openclawLiteTest.workspaceBootstrap();
    });
    expect(ensure3.ok).toBeTruthy();
    expect(ensure3.data.createdPaths).not.toContain('workspace/AGENTS.md');
  });
});
