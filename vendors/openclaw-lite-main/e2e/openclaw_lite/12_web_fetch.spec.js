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

test.describe('OpenClaw Lite: web_fetch + skill_fetch (M11)', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
  });

  test('same-origin and cross-origin fetches work with redirect/truncation and SSRF policy', async ({ page }) => {
    await resetClientStorage(page);
    await page.goto('/lite');

    // Clear deterministic boot approval.
    const bootApprovals = page.getByTestId('approvals').getByRole('button', { name: 'Approve' });
    if (await bootApprovals.count()) {
      await bootApprovals.first().click();
    }

    const pageOrigin = new URL(page.url()).origin;
    const pagePort = new URL(page.url()).port;

    const sameOriginUrl = `${pageOrigin}/__test__/web-fetch/doc/same`;
    const sameOrigin = await page.evaluate(async ({ url }) => {
      return await window.__openclawLiteTest.webFetch({ url, maxBytes: 4096, followRedirects: true });
    }, { url: sameOriginUrl });

    expect(sameOrigin.ok).toBeTruthy();
    expect(sameOrigin.data.status).toBe(200);
    expect(sameOrigin.data.finalUrl).toContain('/__test__/web-fetch/doc/same');
    expect(sameOrigin.data.text).toContain('Same Origin Fixture');
    expect(typeof sameOrigin.data.sha256B64).toBe('string');
    expect(sameOrigin.data.sha256B64.length).toBeGreaterThan(10);

    const crossRedirectUrl = 'https://fixture.openclaw.test/redirect/long-skill';

    const blocked = await page.evaluate(async ({ url }) => {
      return await window.__openclawLiteTest.webFetch({ url, maxBytes: 64, followRedirects: true });
    }, { url: crossRedirectUrl });
    expect(blocked.ok).toBeFalsy();
    expect(blocked.error.code).toBe('NETWORK_BLOCKED');

    const grantPromise = page.evaluate(async ({ url }) => {
      return await window.__openclawLiteTest.requestOriginGrant({
        url,
        capability: 'web_fetch',
        scope: 'session',
      });
    }, { url: crossRedirectUrl });
    const approvalNode = page.locator('[data-testid="approvals"] .kv', { hasText: /origin grant/i }).first();
    await expect(approvalNode).toBeVisible();
    await approvalNode.getByRole('button', { name: 'Approve' }).click();
    const grant = await grantPromise;
    expect(grant.ok).toBeTruthy();

    const cross = await page.evaluate(async ({ url }) => {
      return await window.__openclawLiteTest.webFetch({ url, maxBytes: 32, followRedirects: true });
    }, { url: crossRedirectUrl });
    expect(cross.ok).toBeTruthy();
    expect(cross.data.status).toBe(200);
    expect(cross.data.finalUrl).toBe('https://fixture.openclaw.test/docs/long-skill');
    expect(cross.data.truncated).toBeTruthy();
    expect(cross.data.text.length).toBeLessThanOrEqual(32);

    const alias = await page.evaluate(async () => {
      return await window.__openclawLiteTest.skillFetch({
        url: 'https://fixture.openclaw.test/docs/agenttown',
        maxBytes: 4096,
      });
    });
    expect(alias.ok).toBeTruthy();
    expect(alias.data.text).toContain('Agent Town');

    const localBlockedUrl = `http://localhost:${pagePort}/__test__/web-fetch/doc/blocked`;

    const localGrantPromise = page.evaluate(async ({ url }) => {
      return await window.__openclawLiteTest.requestOriginGrant({
        url,
        capability: 'web_fetch',
        scope: 'once',
      });
    }, { url: localBlockedUrl });
    const localApprovalNode = page.locator('[data-testid="approvals"] .kv', { hasText: /origin grant/i }).first();
    await expect(localApprovalNode).toBeVisible();
    await localApprovalNode.getByRole('button', { name: 'Approve' }).click();
    const localGrant = await localGrantPromise;
    expect(localGrant.ok).toBeTruthy();

    const localBlocked = await page.evaluate(async ({ url }) => {
      return await window.__openclawLiteTest.webFetch({ url, maxBytes: 1024, followRedirects: true });
    }, { url: localBlockedUrl });
    expect(localBlocked.ok).toBeFalsy();
    expect(localBlocked.error.code).toBe('NETWORK_BLOCKED');
  });
});
