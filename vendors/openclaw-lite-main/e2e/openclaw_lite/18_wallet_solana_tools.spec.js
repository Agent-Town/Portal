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

async function approveNextWalletSign(page) {
  const approvalNode = page.locator('[data-testid="approvals"] .kv', { hasText: /wallet sign message/i }).first();
  await expect(approvalNode).toBeVisible();
  await approvalNode.getByRole('button', { name: 'Approve' }).click();
}

test.describe('OpenClaw Lite: Solana Wallet Toolization (M17)', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
  });

  test('wallet_sign_message yields valid signature and lookup verifies house', async ({ page, request }) => {
    await resetClientStorage(page);
    await page.goto('/lite');

    // Clear deterministic boot approval.
    const bootApprovals = page.getByTestId('approvals').getByRole('button', { name: 'Approve' });
    if (await bootApprovals.count()) {
      await bootApprovals.first().click();
    }

    // Ensure a house exists for this wallet address.
    await page.getByRole('button', { name: 'Create house' }).click();
    await expect(page.getByTestId('house-id')).toHaveText(/^[1-9A-HJ-NP-Za-km-z]+$/);
    const houseId = (await page.getByTestId('house-id').innerText()).trim();

    const connect = await page.evaluate(async () => {
      return await window.__openclawLiteTest.walletConnectTool({ chain: 'solana' });
    });
    expect(connect.ok).toBeTruthy();
    const address = connect.data.address;
    expect(typeof address).toBe('string');
    expect(address.length).toBeGreaterThan(20);

    const nonceResp = await (await request.get('/api/wallet/nonce')).json();
    expect(nonceResp.ok).toBeTruthy();
    const nonce = nonceResp.nonce;

    const message = ['ElizaTown House Lookup', `address: ${address}`, `nonce: ${nonce}`].join('\n');

    const signPromise = page.evaluate(async ({ msg }) => {
      return await window.__openclawLiteTest.walletSignMessageTool({ chain: 'solana', message: msg });
    }, { msg: message });
    await approveNextWalletSign(page);
    const signed = await signPromise;

    expect(signed.ok).toBeTruthy();
    expect(typeof signed.data.signatureB64).toBe('string');
    const sigBytes = Buffer.from(signed.data.signatureB64, 'base64');
    expect(sigBytes.length).toBe(64);

    const lookupResp = await (await request.post('/api/wallet/lookup', {
      data: {
        address,
        nonce,
        signature: signed.data.signatureB64,
      },
    })).json();

    expect(lookupResp.ok).toBeTruthy();
    expect(lookupResp.houseId).toBe(houseId);
  });
});
