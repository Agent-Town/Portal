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

async function approveNextSecretSet(page) {
  const approvalNode = page.locator('[data-testid="approvals"] .kv', { hasText: /secret set/i }).first();
  await expect(approvalNode).toBeVisible();
  await approvalNode.getByRole('button', { name: 'Approve' }).click();
}

async function approveNextSecretDelete(page) {
  const approvalNode = page.locator('[data-testid="approvals"] .kv', { hasText: /secret delete/i }).first();
  await expect(approvalNode).toBeVisible();
  await approvalNode.getByRole('button', { name: 'Approve' }).click();
}

test.describe('OpenClaw Lite: Secret Store Integration (M13)', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
  });

  test('secret refs work for authenticated requests and raw values are redacted', async ({ page }) => {
    await resetClientStorage(page);
    await page.goto('/lite');

    // Clear deterministic boot approval.
    const bootApprovals = page.getByTestId('approvals').getByRole('button', { name: 'Approve' });
    if (await bootApprovals.count()) {
      await bootApprovals.first().click();
    }

    const pageOrigin = new URL(page.url()).origin;
    const secretRef = 'moltbook.api_key';
    const secretValue = 'tok_live_super_secret_value';

    const setPromise = page.evaluate(async ({ name, value }) => {
      return await window.__openclawLiteTest.setSecret({ name, value });
    }, { name: secretRef, value: secretValue });
    await approveNextSecretSet(page);
    const setResult = await setPromise;
    expect(setResult.ok).toBeTruthy();

    const listAfterSet = await page.evaluate(async () => {
      return await window.__openclawLiteTest.listSecrets();
    });
    expect(listAfterSet.ok).toBeTruthy();
    expect(listAfterSet.data.names).toContain(secretRef);

    const authResult = await page.evaluate(async ({ origin, secretRefName }) => {
      return await window.__openclawLiteTest.httpRequest({
        method: 'GET',
        url: `${origin}/__test__/http/auth-echo`,
        auth: { kind: 'bearer_secret_ref', secretRef: secretRefName },
        responseMode: 'json',
      });
    }, { origin: pageOrigin, secretRefName: secretRef });

    expect(authResult.ok).toBeTruthy();
    expect(authResult.data.bodyJson).toBeTruthy();
    expect(authResult.data.bodyJson.receivedAuthorization).toBe('Bearer ****');

    const serializedResult = JSON.stringify(authResult);
    expect(serializedResult).not.toContain(secretValue);

    const transcriptDump = await page.evaluate(async () => {
      return await window.__openclawLiteTest.getTranscriptDump();
    });
    expect(typeof transcriptDump).toBe('string');
    expect(transcriptDump).not.toContain(secretValue);

    const runtimeLogs = await page.getByTestId('runtime-logs').textContent();
    expect(runtimeLogs || '').not.toContain(secretValue);

    const delPromise = page.evaluate(async ({ name }) => {
      return await window.__openclawLiteTest.deleteSecret({ name });
    }, { name: secretRef });
    await approveNextSecretDelete(page);
    const delResult = await delPromise;
    expect(delResult.ok).toBeTruthy();

    const listAfterDelete = await page.evaluate(async () => {
      return await window.__openclawLiteTest.listSecrets();
    });
    expect(listAfterDelete.ok).toBeTruthy();
    expect(listAfterDelete.data.names).not.toContain(secretRef);

    const missingSecret = await page.evaluate(async ({ origin, secretRefName }) => {
      return await window.__openclawLiteTest.httpRequest({
        method: 'GET',
        url: `${origin}/__test__/http/auth-echo`,
        auth: { kind: 'bearer_secret_ref', secretRef: secretRefName },
      });
    }, { origin: pageOrigin, secretRefName: secretRef });

    expect(missingSecret.ok).toBeFalsy();
    expect(missingSecret.error.code).toBe('NOT_FOUND');
  });
});
