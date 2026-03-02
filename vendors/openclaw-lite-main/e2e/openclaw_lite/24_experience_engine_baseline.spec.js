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

test.describe('OpenClaw Lite: Experience Engine Baseline (M23)', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
  });

  test('workspace experience files drive websocket coordination with backend', async ({ page }) => {
    await resetClientStorage(page);
    await page.goto('/lite');

    const bootApprovals = page.getByTestId('approvals').getByRole('button', { name: 'Approve' });
    if (await bootApprovals.count()) {
      await bootApprovals.first().click();
    }

    const files = {
      'workspace/skill.md': '# Skill\nCoordinate with experience backend.',
      'workspace/heartbeat.md': 'heartbeat: 5s',
      'workspace/goals.md': '- stay in sync\n- complete objective',
      'workspace/tools.md': '- ws_open\n- ws_send\n- ws_recv',
      'workspace/penalty.md': 'missed heartbeat -> -1',
    };

    for (const [path, content] of Object.entries(files)) {
      const writeRes = await page.evaluate(async ({ p, c }) => {
        return await window.__openclawLiteTest.workspaceWriteFile({ path: p, content: c });
      }, { p: path, c: content });
      expect(writeRes.ok).toBeTruthy();
    }

    const runRes = await page.evaluate(async () => {
      return await window.__openclawLiteTest.experienceRun();
    });

    expect(runRes.ok).toBeTruthy();
    expect(runRes.data.ack).toBeTruthy();
    expect(runRes.data.ack.ok).toBeTruthy();
    expect(Array.isArray(runRes.data.ack.receivedFiles)).toBeTruthy();
    expect(runRes.data.ack.receivedFiles).toEqual(['skill', 'heartbeat', 'goals', 'tools', 'penalty']);
  });
});
