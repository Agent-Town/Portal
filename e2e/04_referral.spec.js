const { test, expect } = require('@playwright/test');
const crypto = require('crypto');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest();
}

function hkdf(ikm, info, len = 32) {
  return crypto.hkdfSync('sha256', ikm, Buffer.alloc(0), Buffer.from(info, 'utf8'), len);
}

function roomAuthHeaders(roomId, method, path, body, key) {
  const ts = String(Date.now());
  const bodyHash = crypto.createHash('sha256').update(body || '').digest('base64');
  const msg = `${roomId}.${ts}.${method}.${path}.${bodyHash}`;
  const auth = crypto.createHmac('sha256', key).update(msg).digest('base64');
  return { 'x-room-ts': ts, 'x-room-auth': auth };
}

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('room unlock is wallet-signature gated (mocked wallet)', async ({ page, request }) => {
  await page.addInitScript(() => {
    const sig = new Uint8Array(64);
    for (let i = 0; i < sig.length; i++) sig[i] = (255 - i) & 0xff;
    window.solana = {
      isPhantom: true,
      connect: async () => ({ publicKey: { toString: () => 'So1anaMock222222222222222222222222222222222' } }),
      signMessage: async () => ({ signature: sig, publicKey: { toString: () => 'So1anaMock222222222222222222222222222222222' } })
    };

    // Mock EVM wallet + Agent0 SDK for Phase 3 flow
    window.ethereum = {
      request: async ({ method, params }) => {
        if (method === 'eth_requestAccounts') return ['0x1111111111111111111111111111111111111111'];
        if (method === 'eth_chainId') return '0xaa36a7'; // sepolia
        if (method === 'wallet_switchEthereumChain') return null;
        // The SDK uses viem + wallet provider; in our mocked SDK we won't hit other methods.
        throw new Error(`unmocked ethereum.request: ${method} ${JSON.stringify(params || [])}`);
      }
    };

    window.__AG0_SDK_MOCK = {
      SDK: class SDK {
        constructor() {}
        createAgent() {
          return {
            setMetadata: () => {},
            registerHTTP: async () => ({
              hash: '0xdeadbeef',
              waitConfirmed: async () => ({
                receipt: { status: 'success' },
                result: { agentId: '11155111:123' }
              })
            })
          };
        }
      }
    };
  });

  await page.goto('/');
  const teamCodeA = (await page.getByTestId('team-code').innerText()).trim();

  await request.post('/api/agent/connect', { data: { teamCode: teamCodeA, agentName: 'RefSource' } });
  await page.getByTestId('sigil-key').click();
  await request.post('/api/agent/select', { data: { teamCode: teamCodeA, elementId: 'key' } });
  await expect(page.getByTestId('match-status')).toContainText('UNLOCKED');

  await page.getByTestId('open-btn').click();
  await request.post('/api/agent/open/press', { data: { teamCode: teamCodeA } });
  await page.waitForURL('**/create');

  // Agent contributes to ceremony (commit+reveal) before human locks in.
  // Use randomness to avoid deterministic roomId collisions when tests run in parallel workers.
  const ra = crypto.randomBytes(32);
  const raB64 = ra.toString('base64');
  const raCommit = crypto.createHash('sha256').update(ra).digest('base64');
  await request.post('/api/agent/room/commit', { data: { teamCode: teamCodeA, commit: raCommit } });
  await request.post('/api/agent/room/reveal', { data: { teamCode: teamCodeA, reveal: raB64 } });

  await page.getByTestId('px-0-0').click();
  await page.getByTestId('share-btn').click();
  await page.waitForURL(/\/room\?room=/);

  const roomId = new URL(page.url()).searchParams.get('room');
  expect(roomId).toBeTruthy();

  // Meta exists and includes nonce; ceremony rooms do not include wrappedKey.
  const matResp = await request.get(`/api/agent/room/material?teamCode=${encodeURIComponent(teamCodeA)}`);
  const mat = await matResp.json();
  const rh = Buffer.from(mat.humanReveal, 'base64');
  const kroot = sha256(Buffer.concat([rh, ra]));
  const kauth = hkdf(kroot, 'elizatown-room-auth-v1', 32);
  const metaPath = `/api/room/${roomId}/meta`;
  const metaHeaders = roomAuthHeaders(roomId, 'GET', metaPath, '', kauth);
  const metaResp = await request.get(metaPath, { headers: metaHeaders });
  expect(metaResp.ok()).toBeTruthy();
  const meta = await metaResp.json();
  expect(meta.ok).toBeTruthy();
  expect(meta.nonce).toContain('n_');
  expect(meta.keyMode).toBe('ceremony');
  expect(meta.wrappedKey ?? null).toBeNull();

  // Phase 3: mint identity (mocked SDK) updates UI
  await page.getByText('Mint ERC-8004 identity').click();
  await expect(page.locator('#erc8004MintStatus')).toContainText('Minted identity: 11155111:123');
  await expect(page.locator('#erc8004')).toHaveValue(/11155111:123/);
});
