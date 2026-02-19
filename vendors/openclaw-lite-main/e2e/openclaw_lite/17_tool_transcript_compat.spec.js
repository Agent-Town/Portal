const { test, expect } = require('@playwright/test');
const fs = require('fs');
const { unzipSync } = require('fflate');

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

test.describe('OpenClaw Lite: Tool Transcript + Export Compatibility (M16)', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
  });

  test('tool-rich session has no orphan tool results and export includes workspace artifacts', async ({ page }) => {
    await resetClientStorage(page);
    await page.goto('/lite');

    const bootApprovals = page.getByTestId('approvals').getByRole('button', { name: 'Approve' });
    if (await bootApprovals.count()) {
      await bootApprovals.first().click();
    }

    const smoke = await page.evaluate(async () => {
      return await window.__openclawLiteTest.runToolSmoke({ count: 5 });
    });
    expect(smoke.completed).toBeGreaterThanOrEqual(5);

    const stats = await page.evaluate(async () => {
      return await window.__openclawLiteTest.getTranscriptToolStats();
    });
    expect(stats.orphanToolResults).toBe(0);
    expect(stats.duplicateToolResults).toBe(0);
    expect(stats.displacedToolResults).toBe(0);

    const writeRes = await page.evaluate(async () => {
      return await window.__openclawLiteTest.workspaceWriteFile({
        path: 'workspace/skill.md',
        content: '# Skill\nexport-artifact',
      });
    });
    expect(writeRes.ok).toBeTruthy();

    const download = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Export' }).click(),
    ]).then((x) => x[0]);

    const path = await download.path();
    expect(path).toBeTruthy();

    const { validateOpenClawLiteExportZip } = await import('../../scripts/openclaw_compat/validate_export_zip.mjs');
    const result = await validateOpenClawLiteExportZip(path);
    expect(result.ok).toBeTruthy();

    const bytes = fs.readFileSync(path);
    const files = unzipSync(new Uint8Array(bytes));
    expect(files['workspace/skill.md']).toBeTruthy();
    const content = new TextDecoder().decode(files['workspace/skill.md']);
    expect(content).toContain('export-artifact');
  });
});
