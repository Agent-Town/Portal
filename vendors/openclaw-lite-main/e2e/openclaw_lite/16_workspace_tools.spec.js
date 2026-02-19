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

test.describe('OpenClaw Lite: Workspace File Tools (M15)', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
  });

  test('workspace write/read/edit/mkdir/list/delete work and traversal is blocked', async ({ page }) => {
    await resetClientStorage(page);
    await page.goto('/lite');

    const bootApprovals = page.getByTestId('approvals').getByRole('button', { name: 'Approve' });
    if (await bootApprovals.count()) {
      await bootApprovals.first().click();
    }

    const writeRes = await page.evaluate(async () => {
      return await window.__openclawLiteTest.workspaceWriteFile({
        path: 'workspace/skill.md',
        content: '# Skill\nhello',
      });
    });
    expect(writeRes.ok).toBeTruthy();

    const readRes = await page.evaluate(async () => {
      return await window.__openclawLiteTest.workspaceReadFile({ path: 'workspace/skill.md' });
    });
    expect(readRes.ok).toBeTruthy();
    expect(readRes.data.content).toBe('# Skill\nhello');

    const editRes = await page.evaluate(async () => {
      return await window.__openclawLiteTest.workspaceEditFile({
        path: 'workspace/skill.md',
        find: 'hello',
        replace: 'world',
      });
    });
    expect(editRes.ok).toBeTruthy();
    expect(editRes.data.replacements).toBe(1);

    const readEdited = await page.evaluate(async () => {
      return await window.__openclawLiteTest.workspaceReadFile({ path: 'workspace/skill.md' });
    });
    expect(readEdited.ok).toBeTruthy();
    expect(readEdited.data.content).toContain('world');

    const mkdirRes = await page.evaluate(async () => {
      return await window.__openclawLiteTest.workspaceMkdir({ path: 'workspace/notes' });
    });
    expect(mkdirRes.ok).toBeTruthy();

    const listRes = await page.evaluate(async () => {
      return await window.__openclawLiteTest.workspaceList({ path: 'workspace/' });
    });
    expect(listRes.ok).toBeTruthy();
    expect(listRes.data.paths).toContain('workspace/skill.md');
    expect(listRes.data.paths).toContain('workspace/notes/');

    const deleteRes = await page.evaluate(async () => {
      return await window.__openclawLiteTest.workspaceDelete({ path: 'workspace/skill.md' });
    });
    expect(deleteRes.ok).toBeTruthy();

    const readDeleted = await page.evaluate(async () => {
      return await window.__openclawLiteTest.workspaceReadFile({ path: 'workspace/skill.md' });
    });
    expect(readDeleted.ok).toBeFalsy();
    expect(readDeleted.error.code).toBe('NOT_FOUND');

    const traversal = await page.evaluate(async () => {
      return await window.__openclawLiteTest.workspaceWriteFile({
        path: '../escape.txt',
        content: 'x',
      });
    });
    expect(traversal.ok).toBeFalsy();
    expect(traversal.error.code).toBe('INVALID_ARGUMENTS');
  });
});
