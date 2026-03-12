const crypto = require('crypto');
const { expect } = require('@playwright/test');
const bs58Module = require('bs58');
const nacl = require('tweetnacl');
const bs58 = typeof bs58Module?.encode === 'function' ? bs58Module : bs58Module?.default;

const DEFAULT_TEST_TOKEN_ADDRESS = 'So1anaMockToken1111111111111111111111111111';

function makeSignatureBytes(multiplier = 11) {
  const sig = Buffer.alloc(64);
  for (let i = 0; i < sig.length; i += 1) sig[i] = (i * multiplier) & 0xff;
  return sig;
}

function createDeterministicSolanaSigner({
  seedLabel = 'phase1-deterministic-solana-signer',
} = {}) {
  const seed = crypto.createHash('sha256').update(String(seedLabel || 'phase1-deterministic-solana-signer')).digest();
  const keyPair = nacl.sign.keyPair.fromSeed(new Uint8Array(seed));
  return {
    seedLabel: String(seedLabel || 'phase1-deterministic-solana-signer'),
    address: bs58.encode(Buffer.from(keyPair.publicKey)),
    publicKey: Uint8Array.from(keyPair.publicKey),
    secretKey: Uint8Array.from(keyPair.secretKey),
    signBytes(bytes) {
      const input = bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes || []);
      return Buffer.from(nacl.sign.detached(input, keyPair.secretKey));
    },
    signMessage(message = '') {
      return this.signBytes(Buffer.from(String(message || ''), 'utf8'));
    }
  };
}

async function installMockSolanaWallet(page, {
  address = DEFAULT_TEST_TOKEN_ADDRESS,
  multiplier = 11,
  withDisconnect = true
} = {}) {
  const signature = Array.from(makeSignatureBytes(multiplier));
  await page.addInitScript(({ addr, sig, includeDisconnect }) => {
    const signatureBytes = Uint8Array.from(sig);
    const signResult = { signature: signatureBytes, publicKey: { toString: () => addr } };
    const walletProvider = {
      request: async ({ method }) => {
        if (method === 'signMessage' || method === 'solana_signMessage') return signResult;
        if (method === 'signAndSendTransaction' || method === 'solana_signAndSendTransaction') {
          return { signature: 'mock-solana-signature' };
        }
        return null;
      },
      on: () => {},
      off: () => {}
    };
    window.solana = {
      isPhantom: true,
      connect: async () => ({ publicKey: { toString: () => addr } }),
      signMessage: async () => signResult,
      ...(includeDisconnect ? { disconnect: async () => {} } : {})
    };
    window.__PRIVY_WALLET_BRIDGE__ = {
      connectSolana: async () => ({ address: addr, provider: walletProvider, wallet: walletProvider }),
      disconnectSolana: async () => {},
      signSolanaMessage: async () => signResult
    };
  }, { addr: address, sig: signature, includeDisconnect: withDisconnect });
}

async function installDeterministicSigningSolanaWallet(page, {
  seedLabel = 'phase1-deterministic-solana-signer',
  withDisconnect = true,
} = {}) {
  const signer = createDeterministicSolanaSigner({ seedLabel });
  const exposedFnName = `__phase1SignSolanaMessage_${crypto.randomBytes(6).toString('hex')}`;
  await page.exposeFunction(exposedFnName, async ({ bytes = [] } = {}) => {
    const signature = signer.signBytes(Uint8Array.from(Array.isArray(bytes) ? bytes : []));
    return {
      signature: Array.from(signature),
      address: signer.address,
    };
  });
  await page.addInitScript(({ addr, fnName, includeDisconnect }) => {
    async function signMessageBytes(input) {
      const bytes = input instanceof Uint8Array
        ? input
        : input instanceof ArrayBuffer
          ? new Uint8Array(input)
          : ArrayBuffer.isView(input)
            ? new Uint8Array(input.buffer)
            : Array.isArray(input)
              ? Uint8Array.from(input)
              : new Uint8Array();
      const out = await window[fnName]({ bytes: Array.from(bytes) });
      const signatureBytes = Uint8Array.from(Array.isArray(out?.signature) ? out.signature : []);
      return {
        signature: signatureBytes,
        publicKey: { toString: () => addr },
      };
    }
    const walletProvider = {
      request: async ({ method, params }) => {
        if (method === 'signMessage' || method === 'solana_signMessage') {
          const first = Array.isArray(params) && params.length ? params[0] : [];
          return await signMessageBytes(first);
        }
        if (method === 'signAndSendTransaction' || method === 'solana_signAndSendTransaction') {
          return { signature: 'mock-solana-signature' };
        }
        return null;
      },
      on: () => {},
      off: () => {},
    };
    window.solana = {
      isPhantom: true,
      connect: async () => ({ publicKey: { toString: () => addr } }),
      signMessage: async (messageBytes) => await signMessageBytes(messageBytes),
      ...(includeDisconnect ? { disconnect: async () => {} } : {}),
    };
    window.__PRIVY_WALLET_BRIDGE__ = {
      connectSolana: async () => ({ address: addr, provider: walletProvider, wallet: walletProvider }),
      disconnectSolana: async () => {},
      signSolanaMessage: async ({ message = '', bytes = null } = {}) => {
        const payload = bytes || new TextEncoder().encode(String(message || ''));
        return await signMessageBytes(payload);
      },
    };
  }, {
    addr: signer.address,
    fnName: exposedFnName,
    includeDisconnect: withDisconnect,
  });
  return signer;
}

function base58Encode(bytes) {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let x = BigInt(`0x${Buffer.from(bytes).toString('hex')}`);
  let out = '';
  while (x > 0n) {
    const mod = x % 58n;
    out = alphabet[Number(mod)] + out;
    x /= 58n;
  }
  for (let i = 0; i < bytes.length && bytes[i] === 0; i += 1) out = `1${out}`;
  return out || '1';
}

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest();
}

function hkdf(ikm, info, len = 32) {
  return crypto.hkdfSync('sha256', ikm, Buffer.alloc(0), Buffer.from(info, 'utf8'), len);
}

function aesGcmEncrypt(keyBytes, plaintextBytes) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBytes, iv);
  const enc = Buffer.concat([cipher.update(plaintextBytes), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    iv: iv.toString('base64'),
    ct: Buffer.concat([enc, tag]).toString('base64')
  };
}

async function seedRecoverableTokenHouse(request, {
  address = DEFAULT_TEST_TOKEN_ADDRESS,
  signatureMultiplier = 11
} = {}) {
  const tokenNonceResp = await request.get('/api/token/nonce');
  expect(tokenNonceResp.ok()).toBeTruthy();
  const tokenNonce = (await tokenNonceResp.json()).nonce;

  const tokenVerifyResp = await request.post('/api/token/verify', {
    data: { address, nonce: tokenNonce, signature: 'phase1-test-signature' }
  });
  expect(tokenVerifyResp.ok()).toBeTruthy();
  const tokenVerify = await tokenVerifyResp.json();
  expect(tokenVerify.ok).toBeTruthy();
  expect(tokenVerify.eligible).toBeTruthy();

  const kroot = crypto.randomBytes(32);
  const houseId = base58Encode(sha256(kroot));
  const wrapSig = makeSignatureBytes(signatureMultiplier);
  const wrapKey = sha256(wrapSig);
  const keyWrap = aesGcmEncrypt(wrapKey, kroot);
  const houseAuthKey = Buffer.from(hkdf(kroot, 'elizatown-house-auth-v1', 32)).toString('base64');

  const nonceResp = await request.get('/api/house/nonce');
  expect(nonceResp.ok()).toBeTruthy();
  const nonce = (await nonceResp.json()).nonce;

  const initResp = await request.post('/api/house/init', {
    data: {
      houseId,
      housePubKey: houseId,
      nonce,
      keyMode: 'ceremony',
      unlock: { kind: 'solana-wallet-signature', address },
      keyWrap: { alg: 'AES-GCM', iv: keyWrap.iv, ct: keyWrap.ct },
      houseAuthKey
    }
  });
  expect(initResp.ok()).toBeTruthy();
  const init = await initResp.json();
  expect(init.ok).toBeTruthy();
  expect(init.houseId).toBe(houseId);

  return {
    houseId,
    houseAuthKey
  };
}

async function fetchSessionState(page) {
  return page.evaluate(async () => {
    const resp = await fetch('/api/state', { credentials: 'include' });
    return resp.json();
  });
}

async function expectHiddenOrAbsent(locator) {
  const count = await locator.count();
  if (count === 0) return;
  await expect(locator).toBeHidden();
}

function houseAuthHeadersFromKeyB64(houseId, method, path, body, keyB64) {
  const ts = String(Date.now());
  const bodyHash = crypto.createHash('sha256').update(body || '').digest('base64');
  const msg = `${houseId}.${ts}.${method}.${path}.${bodyHash}`;
  const auth = crypto.createHmac('sha256', Buffer.from(keyB64, 'base64')).update(msg).digest('base64');
  return { 'x-house-ts': ts, 'x-house-auth': auth };
}

module.exports = {
  DEFAULT_TEST_TOKEN_ADDRESS,
  createDeterministicSolanaSigner,
  makeSignatureBytes,
  installDeterministicSigningSolanaWallet,
  installMockSolanaWallet,
  seedRecoverableTokenHouse,
  fetchSessionState,
  expectHiddenOrAbsent,
  houseAuthHeadersFromKeyB64
};
