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

test.describe('OpenClaw Lite: Solo Skill Conformance (M21)', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
  });

  test('session, paint threshold, commit/reveal, and house init complete with key material present', async ({ page, request }) => {
    await resetClientStorage(page);
    await page.goto('/lite');

    const bootApprovals = page.getByTestId('approvals').getByRole('button', { name: 'Approve' });
    if (await bootApprovals.count()) {
      await bootApprovals.first().click();
    }

    const origin = new URL(page.url()).origin;

    const createPromise = page.evaluate(async ({ base }) => {
      return await window.__openclawLiteTest.httpRequest({
        method: 'POST',
        url: `${base}/__test__/solo/session/create`,
        body: { kind: 'json', json: { mode: 'solo' } },
        responseMode: 'json',
      });
    }, { base: origin });
    await approveNextHttpMutation(page);
    const createRes = await createPromise;
    expect(createRes.ok).toBeTruthy();
    expect(createRes.data.bodyJson.ok).toBeTruthy();

    const paintPromise = page.evaluate(async ({ base }) => {
      return await window.__openclawLiteTest.httpRequest({
        method: 'POST',
        url: `${base}/__test__/solo/paint`,
        body: { kind: 'json', json: { confidence: 0.93 } },
        responseMode: 'json',
      });
    }, { base: origin });
    await approveNextHttpMutation(page);
    const paintRes = await paintPromise;
    expect(paintRes.ok).toBeTruthy();
    expect(paintRes.data.bodyJson.ok).toBeTruthy();

    const commitPromise = page.evaluate(async ({ base }) => {
      return await window.__openclawLiteTest.httpRequest({
        method: 'POST',
        url: `${base}/__test__/solo/commit`,
        body: { kind: 'json', json: { commit: 'abc123' } },
        responseMode: 'json',
      });
    }, { base: origin });
    await approveNextHttpMutation(page);
    const commitRes = await commitPromise;
    expect(commitRes.ok).toBeTruthy();
    expect(commitRes.data.bodyJson.ok).toBeTruthy();

    const revealPromise = page.evaluate(async ({ base }) => {
      return await window.__openclawLiteTest.httpRequest({
        method: 'POST',
        url: `${base}/__test__/solo/reveal`,
        body: { kind: 'json', json: { reveal: 'abc123' } },
        responseMode: 'json',
      });
    }, { base: origin });
    await approveNextHttpMutation(page);
    const revealRes = await revealPromise;
    expect(revealRes.ok).toBeTruthy();
    expect(revealRes.data.bodyJson.ok).toBeTruthy();

    await page.getByRole('button', { name: 'Create house' }).click();
    await expect(page.getByTestId('house-id')).toHaveText(/^[1-9A-HJ-NP-Za-km-z]+$/);

    const keyStatus = await page.evaluate(async () => {
      return await window.__openclawLiteTest.runtimeKeyMaterialStatus();
    });
    expect(keyStatus.ok).toBeTruthy();
    expect(keyStatus.data.hasKroot).toBeTruthy();
    expect(keyStatus.data.hasKenc).toBeTruthy();
    expect(keyStatus.data.hasKauth).toBeTruthy();

    const trace = await (await request.get('/__test__/solo/trace')).json();
    expect(trace.ok).toBeTruthy();
    expect(trace.trace).toEqual(['session.create', 'paint', 'commit', 'reveal']);
  });
});
