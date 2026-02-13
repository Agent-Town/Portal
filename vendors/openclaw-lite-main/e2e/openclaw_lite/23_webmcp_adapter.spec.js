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

test.describe('OpenClaw Lite: WebMCP Adapter (M22)', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
  });

  test('discovers MCP tools and executes one call with transcript-compatible tool pairing', async ({ page }) => {
    await resetClientStorage(page);
    await page.goto('/lite');

    const bootApprovals = page.getByTestId('approvals').getByRole('button', { name: 'Approve' });
    if (await bootApprovals.count()) {
      await bootApprovals.first().click();
    }

    const discovered = await page.evaluate(async () => {
      return await window.__openclawLiteTest.webmcpDiscover();
    });
    expect(discovered.ok).toBeTruthy();
    expect(Array.isArray(discovered.data.tools)).toBeTruthy();
    expect(discovered.data.tools.some((t) => t && t.name === 'fixture.echo')).toBeTruthy();

    const called = await page.evaluate(async () => {
      return await window.__openclawLiteTest.webmcpCall({
        tool: 'fixture.echo',
        args: { text: 'hello webmcp' },
      });
    });
    expect(called.ok).toBeTruthy();
    expect(called.data.result.text).toBe('hello webmcp');

    const stats = await page.evaluate(async () => {
      return await window.__openclawLiteTest.getTranscriptToolStats();
    });
    expect(stats.orphanToolResults).toBe(0);
    expect(stats.duplicateToolResults).toBe(0);
    expect(stats.displacedToolResults).toBe(0);
    expect(stats.toolResultCount).toBeGreaterThanOrEqual(1);
  });
});
