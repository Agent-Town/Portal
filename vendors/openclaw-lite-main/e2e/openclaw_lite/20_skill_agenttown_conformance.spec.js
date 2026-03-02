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

async function approveNextHttpMutation(page) {
  const approvalNode = page.locator('[data-testid="approvals"] .kv', { hasText: /http (post|put|patch|delete)/i }).first();
  await expect(approvalNode).toBeVisible();
  await approvalNode.getByRole('button', { name: 'Approve' }).click();
}

test.describe('OpenClaw Lite: Agent Town Skill Conformance (M19)', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
  });

  test('connect, poll, select, open sequence completes and APIs are observed in order', async ({ page, request }) => {
    await resetClientStorage(page);
    await page.goto('/lite');

    const bootApprovals = page.getByTestId('approvals').getByRole('button', { name: 'Approve' });
    if (await bootApprovals.count()) {
      await bootApprovals.first().click();
    }

    const origin = new URL(page.url()).origin;

    const connectRes = await page.evaluate(async ({ base }) => {
      return await window.__openclawLiteTest.httpRequest({
        method: 'GET',
        url: `${base}/__test__/agenttown/connect`,
        responseMode: 'json',
      });
    }, { base: origin });
    expect(connectRes.ok).toBeTruthy();
    expect(connectRes.data.bodyJson.ok).toBeTruthy();

    const pollRes = await page.evaluate(async ({ base }) => {
      return await window.__openclawLiteTest.httpRequest({
        method: 'GET',
        url: `${base}/__test__/agenttown/poll`,
        responseMode: 'json',
      });
    }, { base: origin });
    expect(pollRes.ok).toBeTruthy();
    expect(pollRes.data.bodyJson.ok).toBeTruthy();

    const selectPromise = page.evaluate(async ({ base }) => {
      return await window.__openclawLiteTest.httpRequest({
        method: 'POST',
        url: `${base}/__test__/agenttown/select`,
        body: { kind: 'json', json: { target: 'lobby-1' } },
        responseMode: 'json',
      });
    }, { base: origin });
    await approveNextHttpMutation(page);
    const selectRes = await selectPromise;
    expect(selectRes.ok).toBeTruthy();
    expect(selectRes.data.bodyJson.ok).toBeTruthy();

    const openPromise = page.evaluate(async ({ base }) => {
      return await window.__openclawLiteTest.httpRequest({
        method: 'POST',
        url: `${base}/__test__/agenttown/open`,
        body: { kind: 'json', json: { target: 'lobby-1' } },
        responseMode: 'json',
      });
    }, { base: origin });
    await approveNextHttpMutation(page);
    const openRes = await openPromise;
    expect(openRes.ok).toBeTruthy();
    expect(openRes.data.bodyJson.ok).toBeTruthy();

    const traceResp = await (await request.get('/__test__/agenttown/trace')).json();
    expect(traceResp.ok).toBeTruthy();
    expect(traceResp.trace).toEqual(['connect', 'poll', 'select', 'open']);
  });
});
