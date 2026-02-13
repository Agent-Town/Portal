const { test, expect } = require('@playwright/test');
const { ethers } = require('ethers');

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

test.describe('OpenClaw Lite: EVM Wallet Bridge + Verification (M18)', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
  });

  test('wallet_connect/sign_message chain=evm verifies on init and lookup paths', async ({ page, request }) => {
    await resetClientStorage(page);
    await page.goto('/lite');

    // Clear deterministic boot approval.
    const bootApprovals = page.getByTestId('approvals').getByRole('button', { name: 'Approve' });
    if (await bootApprovals.count()) {
      await bootApprovals.first().click();
    }

    const connected = await page.evaluate(async () => {
      return await window.__openclawLiteTest.walletConnectTool({ chain: 'evm' });
    });
    expect(connected.ok).toBeTruthy();
    const address = connected.data.address;
    expect(address).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect(ethers.getAddress(address)).toBe(address);

    const nonceInitResp = await (await request.get('/api/house/nonce')).json();
    expect(nonceInitResp.ok).toBeTruthy();
    const initNonce = nonceInitResp.nonce;

    const houseId = `evm-house-${Date.now()}`;
    const initMessage = ['ElizaTown EVM House Init', `address: ${address}`, `houseId: ${houseId}`, `nonce: ${initNonce}`].join('\n');

    const initSignPromise = page.evaluate(async ({ message }) => {
      return await window.__openclawLiteTest.walletSignMessageTool({ chain: 'evm', message });
    }, { message: initMessage });
    await approveNextWalletSign(page);
    const initSign = await initSignPromise;

    expect(initSign.ok).toBeTruthy();
    expect(initSign.data.signatureHex).toMatch(/^0x[0-9a-fA-F]+$/);

    const houseAuthKey = Buffer.from('0123456789abcdef0123456789abcdef', 'utf8').toString('base64');
    const initResp = await (await request.post('/api/house/init', {
      data: {
        houseId,
        housePubKey: houseId,
        nonce: initNonce,
        keyMode: 'ceremony',
        unlock: {
          kind: 'evm-wallet-signature',
          address,
          nonce: initNonce,
          signature: initSign.data.signatureHex,
        },
        keyWrap: { alg: 'AES-GCM', iv: 'AA==', ct: 'AA==' },
        houseAuthKey,
      },
    })).json();

    expect(initResp.ok).toBeTruthy();
    expect(initResp.houseId).toBe(houseId);

    const nonceLookupResp = await (await request.get('/api/wallet/nonce')).json();
    expect(nonceLookupResp.ok).toBeTruthy();
    const lookupNonce = nonceLookupResp.nonce;

    const lookupMessage = ['ElizaTown House Lookup', `address: ${address}`, `nonce: ${lookupNonce}`, `houseId: ${houseId}`].join('\n');

    const lookupSignPromise = page.evaluate(async ({ message }) => {
      return await window.__openclawLiteTest.walletSignMessageTool({ chain: 'evm', message });
    }, { message: lookupMessage });
    await approveNextWalletSign(page);
    const lookupSign = await lookupSignPromise;

    expect(lookupSign.ok).toBeTruthy();

    const lookupResp = await (await request.post('/api/wallet/lookup', {
      data: {
        chain: 'evm',
        address,
        nonce: lookupNonce,
        houseId,
        signature: lookupSign.data.signatureHex,
      },
    })).json();

    expect(lookupResp.ok).toBeTruthy();
    expect(lookupResp.houseId).toBe(houseId);
    expect(lookupResp.keyWrap).toBeTruthy();
    expect(lookupResp.keyWrap.alg).toBe('AES-GCM');
  });
});
