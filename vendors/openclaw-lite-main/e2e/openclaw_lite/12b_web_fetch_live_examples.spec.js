const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';
const runLive = process.env.OPENCLAW_LITE_RUN_LIVE_FETCH === '1';

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

async function approveNextOriginGrant(page) {
  const approvalNode = page.locator('[data-testid="approvals"] .kv', { hasText: /origin grant/i }).first();
  await expect(approvalNode).toBeVisible();
  await approvalNode.getByRole('button', { name: 'Approve' }).click();
}

test.describe('OpenClaw Lite: web_fetch live examples (M11 nightly)', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
  });

  test('fetches live skill.md examples when enabled', async ({ page }) => {
    test.skip(!runLive, 'Set OPENCLAW_LITE_RUN_LIVE_FETCH=1 to run live web_fetch integration checks.');

    await resetClientStorage(page);
    await page.goto('/lite');

    const bootApprovals = page.getByTestId('approvals').getByRole('button', { name: 'Approve' });
    if (await bootApprovals.count()) {
      await bootApprovals.first().click();
    }

    const examples = [
      { url: 'https://agenttown.app/skill.md', expectedText: 'Agent Town' },
      { url: 'https://www.moltbook.com/skill.md', expectedText: 'Moltbook' },
      { url: 'http://localhost:4173/skill_agent_solo.md', expectedText: 'Solo Agent' },
    ];

    for (const ex of examples) {
      const grantPromise = page.evaluate(async ({ url }) => {
        return await window.__openclawLiteTest.requestOriginGrant({
          url,
          capability: 'web_fetch',
          scope: 'session',
        });
      }, { url: ex.url });
      await approveNextOriginGrant(page);
      const grant = await grantPromise;
      expect(grant.ok).toBeTruthy();

      const result = await page.evaluate(async ({ url }) => {
        return await window.__openclawLiteTest.webFetch({ url, maxBytes: 262144, followRedirects: true });
      }, { url: ex.url });

      expect(result.ok).toBeTruthy();
      expect(result.data.status).toBeGreaterThanOrEqual(200);
      expect(result.data.status).toBeLessThan(400);
      expect(result.data.text).toContain(ex.expectedText);
      expect(typeof result.data.sha256B64).toBe('string');
      expect(result.data.sha256B64.length).toBeGreaterThan(10);
    }
  });
});
