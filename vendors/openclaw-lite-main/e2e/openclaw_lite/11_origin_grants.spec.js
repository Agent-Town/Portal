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

test.describe('OpenClaw Lite: Origin Grants + Approval Scopes (M10)', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
  });

  test('cross-origin blocked by default, once/session grants work, revoke works', async ({ page }) => {
    await resetClientStorage(page);
    await page.goto('/lite');

    // Clear deterministic boot-time demo approval so grant approvals are unambiguous.
    const bootApprovals = page.getByTestId('approvals').getByRole('button', { name: 'Approve' });
    if (await bootApprovals.count()) {
      await bootApprovals.first().click();
    }

    const target = 'https://example.com/skill.md';
    const capability = 'web_fetch';
    const method = 'GET';

    const blocked = await page.evaluate(async ({ targetUrl, capabilityName, methodName }) => {
      return await window.__openclawLiteTest.checkOriginAccess({
        url: targetUrl,
        capability: capabilityName,
        method: methodName,
      });
    }, { targetUrl: target, capabilityName: capability, methodName: method });
    expect(blocked.allowed).toBeFalsy();
    expect(blocked.error).toBe('NETWORK_BLOCKED');

    const onceGrantPromise = page.evaluate(async ({ targetUrl, capabilityName }) => {
      return await window.__openclawLiteTest.requestOriginGrant({
        url: targetUrl,
        capability: capabilityName,
        scope: 'once',
      });
    }, { targetUrl: target, capabilityName: capability });
    const originOnceApproval = page.locator('[data-testid="approvals"] .kv', { hasText: /origin grant/i }).first();
    await expect(originOnceApproval).toBeVisible();
    await originOnceApproval.getByRole('button', { name: 'Approve' }).click();
    const onceGrant = await onceGrantPromise;
    expect(onceGrant.ok).toBeTruthy();
    expect(typeof onceGrant.grantId).toBe('string');

    const allowedOnce = await page.evaluate(async ({ targetUrl, capabilityName, methodName }) => {
      return await window.__openclawLiteTest.checkOriginAccess({
        url: targetUrl,
        capability: capabilityName,
        method: methodName,
      });
    }, { targetUrl: target, capabilityName: capability, methodName: method });
    expect(allowedOnce.allowed).toBeTruthy();

    const blockedAfterOnce = await page.evaluate(async ({ targetUrl, capabilityName, methodName }) => {
      return await window.__openclawLiteTest.checkOriginAccess({
        url: targetUrl,
        capability: capabilityName,
        method: methodName,
      });
    }, { targetUrl: target, capabilityName: capability, methodName: method });
    expect(blockedAfterOnce.allowed).toBeFalsy();
    expect(blockedAfterOnce.error).toBe('NETWORK_BLOCKED');

    const sessionGrantPromise = page.evaluate(async ({ targetUrl, capabilityName }) => {
      return await window.__openclawLiteTest.requestOriginGrant({
        url: targetUrl,
        capability: capabilityName,
        scope: 'session',
      });
    }, { targetUrl: target, capabilityName: capability });
    const originSessionApproval = page.locator('[data-testid="approvals"] .kv', { hasText: /origin grant/i }).first();
    await expect(originSessionApproval).toBeVisible();
    await originSessionApproval.getByRole('button', { name: 'Approve' }).click();
    const sessionGrant = await sessionGrantPromise;
    expect(sessionGrant.ok).toBeTruthy();

    const allowedSessionA = await page.evaluate(async ({ targetUrl, capabilityName, methodName }) => {
      return await window.__openclawLiteTest.checkOriginAccess({
        url: targetUrl,
        capability: capabilityName,
        method: methodName,
      });
    }, { targetUrl: target, capabilityName: capability, methodName: method });
    const allowedSessionB = await page.evaluate(async ({ targetUrl, capabilityName, methodName }) => {
      return await window.__openclawLiteTest.checkOriginAccess({
        url: targetUrl,
        capability: capabilityName,
        method: methodName,
      });
    }, { targetUrl: target, capabilityName: capability, methodName: method });
    expect(allowedSessionA.allowed).toBeTruthy();
    expect(allowedSessionB.allowed).toBeTruthy();

    const revoked = await page.evaluate(async ({ grantId }) => {
      return await window.__openclawLiteTest.revokeOriginGrant({ grantId });
    }, { grantId: sessionGrant.grantId });
    expect(revoked.ok).toBeTruthy();
    expect(revoked.removed).toBeTruthy();

    const blockedAfterRevoke = await page.evaluate(async ({ targetUrl, capabilityName, methodName }) => {
      return await window.__openclawLiteTest.checkOriginAccess({
        url: targetUrl,
        capability: capabilityName,
        method: methodName,
      });
    }, { targetUrl: target, capabilityName: capability, methodName: method });
    expect(blockedAfterRevoke.allowed).toBeFalsy();
    expect(blockedAfterRevoke.error).toBe('NETWORK_BLOCKED');
  });
});
