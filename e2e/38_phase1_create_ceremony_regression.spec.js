const { test, expect } = require('@playwright/test');
const {
  installMockSolanaWallet,
  houseAuthHeadersFromKeyB64
} = require('./helpers/phase1');
const { reachCreateViaLite } = require('./helpers/phase2');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('create flow preserves ceremony + house generation and keeps house-auth meta access', async ({ page, request }) => {
  await installMockSolanaWallet(page);
  await reachCreateViaLite(page);

  let initPayload = null;
  await page.route('**/api/house/init', async (route) => {
    initPayload = route.request().postDataJSON();
    await route.continue();
  });

  await page.evaluate(() => {
    const bridge = window.__PRIVY_WALLET_BRIDGE__ || null;
    window.__PRIVY_WALLET_BRIDGE__ = null;
    window.ensurePrivyLogin = async () => {
      window.__PRIVY_WALLET_BRIDGE__ = bridge;
      return true;
    };
  });

  await page.getByTestId('px-0-0').click();
  await expect(page.getByTestId('px-0-0')).toHaveAttribute('data-color', /[1-9]/);

  const teamCode = await page.evaluate(async () => {
    const resp = await fetch('/api/state', { credentials: 'include' });
    const state = await resp.json().catch(() => ({}));
    return String(state?.teamCode || '');
  });
  expect(teamCode).toMatch(/^TEAM-/);

  const agentPaint = await page.evaluate(async (code) => {
    const resp = await fetch('/api/agent/canvas/paint', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ teamCode: code, x: 1, y: 0, color: 2 })
    });
    const body = await resp.json().catch(() => ({}));
    return { ok: resp.ok, body };
  }, teamCode);
  expect(agentPaint.ok).toBeTruthy();
  expect(agentPaint.body?.ok).toBe(true);
  await expect(page.getByTestId('px-1-0')).toHaveAttribute('data-color', '2');

  const agentCommit = await page.evaluate(async (code) => {
    const bytesToB64 = (bytes) => {
      let binary = '';
      for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
      return btoa(binary);
    };
    const Ra = crypto.getRandomValues(new Uint8Array(32));
    const commitBytes = new Uint8Array(await crypto.subtle.digest('SHA-256', Ra));
    const revealPair = await crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveBits']
    );
    const revealPub = bytesToB64(new Uint8Array(await crypto.subtle.exportKey('spki', revealPair.publicKey)));
    const commit = bytesToB64(commitBytes);
    const resp = await fetch('/api/agent/house/commit', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ teamCode: code, commit, revealPub })
    });
    const body = await resp.json().catch(() => ({}));
    window.__e2eAgentCeremony = { teamCode: code, RaB64: bytesToB64(Ra) };
    return { ok: resp.ok, body };
  }, teamCode);
  expect(agentCommit.ok).toBeTruthy();
  expect(agentCommit.body?.ok).toBe(true);

  await page.getByTestId('share-btn').click();
  const agentReveal = await page.evaluate(async () => {
    const rec = window.__e2eAgentCeremony;
    if (!rec || typeof rec !== 'object') return { ok: false, error: 'MISSING_AGENT_STATE' };
    const teamCode = typeof rec.teamCode === 'string' ? rec.teamCode : '';
    const raB64 = typeof rec.RaB64 === 'string' ? rec.RaB64 : '';
    if (!teamCode || !raB64) return { ok: false, error: 'MISSING_AGENT_STATE' };

    const bytesToB64 = (bytes) => {
      let binary = '';
      for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
      return btoa(binary);
    };
    const b64ToBytes = (text) => {
      const binary = atob(String(text || ''));
      const out = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
      return out;
    };
    const Ra = b64ToBytes(raB64);

    for (let i = 0; i < 30; i += 1) {
      const matResp = await fetch('/api/human/house/material', { credentials: 'include' });
      const mat = await matResp.json().catch(() => ({}));
      const humanRevealPub = typeof mat?.humanRevealPub === 'string' ? mat.humanRevealPub : '';
      if (!humanRevealPub) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        continue;
      }

      let humanPub;
      try {
        humanPub = await crypto.subtle.importKey(
          'spki',
          b64ToBytes(humanRevealPub),
          { name: 'ECDH', namedCurve: 'P-256' },
          false,
          []
        );
      } catch {
        return { ok: false, error: 'INVALID_HUMAN_REVEAL_PUB' };
      }

      const eph = await crypto.subtle.generateKey(
        { name: 'ECDH', namedCurve: 'P-256' },
        true,
        ['deriveBits']
      );
      const sharedBits = await crypto.subtle.deriveBits(
        { name: 'ECDH', public: humanPub },
        eph.privateKey,
        256
      );
      const sharedSecret = new Uint8Array(sharedBits);
      const info = new TextEncoder().encode(`elizatown-ceremony-reveal-v1|dir=agent_to_human|team=${teamCode || ''}`);
      const baseKey = await crypto.subtle.importKey('raw', sharedSecret, 'HKDF', false, ['deriveKey']);
      const aesKey = await crypto.subtle.deriveKey(
        { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array([]), info },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
      );

      const aad = new TextEncoder().encode(JSON.stringify({
        v: 1,
        direction: 'agent_to_human',
        teamCode: teamCode || null
      }));
      const plaintext = new TextEncoder().encode(JSON.stringify({
        v: 1,
        reveal: bytesToB64(Ra)
      }));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const ciphertext = new Uint8Array(await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv, additionalData: aad },
        aesKey,
        plaintext
      ));
      const epk = new Uint8Array(await crypto.subtle.exportKey('spki', eph.publicKey));
      const sealedForHuman = {
        alg: 'CEREMONY_E2EE_P256_AESGCM_V1',
        epk: bytesToB64(epk),
        iv: bytesToB64(iv),
        ct: bytesToB64(ciphertext),
        aad: bytesToB64(aad)
      };

      const revealResp = await fetch('/api/agent/house/reveal', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ teamCode, sealedForHuman })
      });
      const revealBody = await revealResp.json().catch(() => ({}));
      if (revealResp.ok && revealBody?.ok) {
        return { ok: true };
      }
      const code = String(revealBody?.error || '').toUpperCase();
      if (code.startsWith('WAITING_')) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        continue;
      }
      return { ok: false, error: code || `HTTP_${revealResp.status}` };
    }
    return { ok: false, error: 'REVEAL_TIMEOUT' };
  });
  expect(agentReveal?.ok).toBe(true);

  await page.waitForURL(/\/house\?house=/, { timeout: 15000 });
  expect(typeof initPayload?.keyWrapSig).toBe('string');
  expect(initPayload.keyWrapSig.length).toBeGreaterThan(20);

  const houseId = new URL(page.url()).searchParams.get('house');
  expect(houseId).toBeTruthy();

  const connectWalletBtn = page.getByRole('button', { name: /Connect wallet|Disconnect wallet/ });
  const walletLabel = (await connectWalletBtn.textContent()) || '';
  if (walletLabel.includes('Connect')) {
    await connectWalletBtn.click();
  }
  await page.getByRole('button', { name: 'Sign to unlock' }).click();
  await expect(page.getByRole('button', { name: 'Unlocked' })).toBeVisible();

  const houseAuthKeyB64 = await page.evaluate((id) => {
    const store = window.__agentTownHouseAuthMemory || {};
    const value = store[`agentTownHouseAuth:${id}`];
    return typeof value === 'string' ? value : null;
  }, houseId);
  expect(houseAuthKeyB64).toBeTruthy();

  const metaPath = `/api/house/${houseId}/meta`;
  const headers = houseAuthHeadersFromKeyB64(houseId, 'GET', metaPath, '', houseAuthKeyB64);
  const metaResp = await request.get(metaPath, { headers });
  expect(metaResp.ok()).toBeTruthy();
  const meta = await metaResp.json();
  expect(meta.housePubKey).toBe(houseId);
});
