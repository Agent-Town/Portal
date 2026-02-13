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

async function approveNextSecretSet(page) {
  const approvalNode = page.locator('[data-testid="approvals"] .kv', { hasText: /secret set/i }).first();
  await expect(approvalNode).toBeVisible();
  await approvalNode.getByRole('button', { name: 'Approve' }).click();
}

test.describe('OpenClaw Lite: Moltbook Skill Conformance (M20)', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
  });

  test('registration secret is persisted and authenticated feed/post succeed via secret ref', async ({ page, request }) => {
    await resetClientStorage(page);
    await page.goto('/lite');

    const bootApprovals = page.getByTestId('approvals').getByRole('button', { name: 'Approve' });
    if (await bootApprovals.count()) {
      await bootApprovals.first().click();
    }

    const origin = new URL(page.url()).origin;

    const registerPromise = page.evaluate(async ({ base }) => {
      return await window.__openclawLiteTest.httpRequest({
        method: 'POST',
        url: `${base}/__test__/moltbook/register`,
        body: { kind: 'json', json: { username: 'agent_1' } },
        responseMode: 'json',
      });
    }, { base: origin });
    await approveNextHttpMutation(page);
    const registerRes = await registerPromise;

    expect(registerRes.ok).toBeTruthy();
    expect(registerRes.data.bodyJson.ok).toBeTruthy();
    const token = registerRes.data.bodyJson.apiKey;
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(8);

    const setPromise = page.evaluate(async ({ value }) => {
      return await window.__openclawLiteTest.setSecret({
        name: 'moltbook.api_key',
        value,
      });
    }, { value: token });
    await approveNextSecretSet(page);
    const setRes = await setPromise;
    expect(setRes.ok).toBeTruthy();

    const secrets = await page.evaluate(async () => {
      return await window.__openclawLiteTest.listSecrets();
    });
    expect(secrets.ok).toBeTruthy();
    expect(secrets.data.names).toContain('moltbook.api_key');

    const feedRes = await page.evaluate(async ({ base }) => {
      return await window.__openclawLiteTest.httpRequest({
        method: 'GET',
        url: `${base}/__test__/moltbook/feed`,
        auth: { kind: 'bearer_secret_ref', secretRef: 'moltbook.api_key' },
        responseMode: 'json',
      });
    }, { base: origin });

    expect(feedRes.ok).toBeTruthy();
    expect(feedRes.data.bodyJson.ok).toBeTruthy();

    const postPromise = page.evaluate(async ({ base }) => {
      return await window.__openclawLiteTest.httpRequest({
        method: 'POST',
        url: `${base}/__test__/moltbook/post`,
        auth: { kind: 'bearer_secret_ref', secretRef: 'moltbook.api_key' },
        body: { kind: 'json', json: { text: 'hello moltbook' } },
        responseMode: 'json',
      });
    }, { base: origin });
    await approveNextHttpMutation(page);
    const postRes = await postPromise;

    expect(postRes.ok).toBeTruthy();
    expect(postRes.data.bodyJson.ok).toBeTruthy();

    const trace = await (await request.get('/__test__/moltbook/trace')).json();
    expect(trace.ok).toBeTruthy();
    expect(trace.trace).toEqual(['register', 'feed', 'post']);
  });
});
