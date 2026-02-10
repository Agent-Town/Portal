/* global crypto */

(function () {
  'use strict';

  // Minimal browser-side protocol helpers shared by /create and /house.
  // No external deps, pure functions where possible.

  // --- base64 helpers ---
  function b64(bytes) {
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }

  function unb64(str) {
    const bin = atob(str);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  // --- base58 (minimal) ---
  const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

  function base58Encode(bytes) {
    if (!bytes || bytes.length === 0) return '';
    const digits = [0];
    for (let i = 0; i < bytes.length; i++) {
      let carry = bytes[i];
      for (let j = 0; j < digits.length; j++) {
        carry += digits[j] << 8;
        digits[j] = carry % 58;
        carry = (carry / 58) | 0;
      }
      while (carry) {
        digits.push(carry % 58);
        carry = (carry / 58) | 0;
      }
    }
    let out = '';
    for (let k = 0; k < bytes.length && bytes[k] === 0; k++) out += '1';
    for (let q = digits.length - 1; q >= 0; q--) out += B58[digits[q]];
    return out;
  }

  function base58Decode(str) {
    if (!str || typeof str !== 'string') return null;
    let num = 0n;
    for (const ch of str) {
      const idx = B58.indexOf(ch);
      if (idx < 0) return null;
      num = num * 58n + BigInt(idx);
    }
    const bytes = [];
    while (num > 0n) {
      bytes.push(Number(num & 0xffn));
      num >>= 8n;
    }
    bytes.reverse();
    let leadingZeros = 0;
    for (let i = 0; i < str.length && str[i] === '1'; i++) leadingZeros++;
    if (leadingZeros) return new Uint8Array(Array(leadingZeros).fill(0).concat(bytes));
    return new Uint8Array(bytes);
  }

  // --- crypto primitives ---
  async function sha256(bytes) {
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return new Uint8Array(digest);
  }

  async function aesGcmEncrypt(key, plaintextBytes, aadBytes) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv, additionalData: aadBytes || new Uint8Array([]) },
      key,
      plaintextBytes
    );
    return { iv: new Uint8Array(iv), ct: new Uint8Array(ct) };
  }

  async function aesGcmDecrypt(key, ivBytes, ctBytes, aadBytes) {
    const pt = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBytes, additionalData: aadBytes || new Uint8Array([]) },
      key,
      ctBytes
    );
    return new Uint8Array(pt);
  }

  async function deriveHouseAuthKey(Kroot) {
    const info = new TextEncoder().encode('elizatown-house-auth-v1');
    const salt = new Uint8Array([]);
    const baseKey = await crypto.subtle.importKey('raw', Kroot, 'HKDF', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
      { name: 'HKDF', hash: 'SHA-256', salt, info },
      baseKey,
      256
    );
    return new Uint8Array(bits);
  }

  async function deriveHouseEncKey(Kroot) {
    const info = new TextEncoder().encode('elizatown-house-enc-v1');
    const salt = new Uint8Array([]);
    const baseKey = await crypto.subtle.importKey('raw', Kroot, 'HKDF', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'HKDF', hash: 'SHA-256', salt, info },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  // --- wallet helpers ---
  function normalizeSignatureBytes(sig) {
    if (sig instanceof Uint8Array) return sig;
    if (sig instanceof ArrayBuffer) return new Uint8Array(sig);
    if (ArrayBuffer.isView(sig)) return new Uint8Array(sig.buffer);
    if (Array.isArray(sig)) return new Uint8Array(sig);
    if (typeof sig === 'string') {
      const b58 = base58Decode(sig);
      if (b58 && b58.length === 64) return b58;
      try {
        const bin = atob(sig);
        if (bin.length === 64) return Uint8Array.from(bin, (c) => c.charCodeAt(0));
      } catch {
        // ignore
      }
    }
    return null;
  }

  async function signMessageBytes(wallet, message) {
    if (!wallet) throw new Error('NO_SOLANA_WALLET');
    if (typeof wallet.signMessage !== 'function') throw new Error('NO_SOLANA_SIGN');
    const msgBytes = new TextEncoder().encode(message);
    const resp = await wallet.signMessage(msgBytes, 'utf8');
    const sigBytes = resp?.signature || resp;
    const sigArr = normalizeSignatureBytes(sigBytes);
    if (!sigArr) throw new Error('SIGNATURE_FORMAT');
    return sigArr;
  }

  // --- house-auth headers ---
  async function bodyHashB64(body) {
    const bytes = body ? new TextEncoder().encode(body) : new Uint8Array([]);
    const digest = await sha256(bytes);
    return b64(digest);
  }

  async function houseAuthHeaders({ houseId, method, url, body, KauthKey }) {
    if (!KauthKey) throw new Error('HOUSE_AUTH_NOT_READY');
    const ts = String(Date.now());
    const path = new URL(url, window.location.origin).pathname;
    const bodyHash = await bodyHashB64(body || '');
    const msg = `${houseId}.${ts}.${method}.${path}.${bodyHash}`;
    const sig = await crypto.subtle.sign('HMAC', KauthKey, new TextEncoder().encode(msg));
    const auth = b64(new Uint8Array(sig));
    return { 'x-house-ts': ts, 'x-house-auth': auth };
  }

  // --- protocol messages ---
  function buildUnlockMessage({ housePubKey, nonce, origin }) {
    return [
      'ElizaTown House Unlock',
      `housePubKey: ${housePubKey}`,
      `origin: ${origin}`,
      `nonce: ${nonce}`
    ].join('\n');
  }

  function buildKeyWrapMessage({ houseId, origin }) {
    const parts = ['ElizaTown House Key Wrap', `houseId: ${houseId}`];
    if (origin) parts.push(`origin: ${origin}`);
    return parts.join('\n');
  }

  window.HousesProtocol = {
    // encoding
    b64,
    unb64,
    base58Encode,
    base58Decode,

    // primitives
    sha256,
    aesGcmEncrypt,
    aesGcmDecrypt,
    deriveHouseAuthKey,
    deriveHouseEncKey,

    // auth + wallet
    normalizeSignatureBytes,
    signMessageBytes,
    houseAuthHeaders,

    // messages
    buildUnlockMessage,
    buildKeyWrapMessage
  };
})();

