const HOUSE_AUTH_CACHE_PREFIX = 'agentTownHouseAuth:';
const PONY_E2EE_P256_AESGCM_V1 = 'PONY_E2EE_P256_AESGCM_V1';
const PONY_INBOX_WRAP_INFO = 'elizatown-pony-inbox-wrap-v1';
const INBOX_AUTO_REFRESH_MS = 3000;
const houseKrootMemory = new Map();
const ponyUpgradeInFlight = new Map();
const ponyUpgradeDone = new Set();
const ponyUpgradeFailed = new Set();
const ponyUpgradeFailureMsg = new Map();
let lastFriends = [];
let loadInFlight = null;
let refreshTimer = null;
const inboxWalletClient = window.initWalletClient ? window.initWalletClient() : null;

function getHouseId() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  // /inbox/:houseId
  return parts[0] === 'inbox' ? parts[1] : null;
}

function houseAuthCacheKey(houseId) {
  return `${HOUSE_AUTH_CACHE_PREFIX}${houseId}`;
}

function getHouseAuthMemoryStore() {
  if (!window.__agentTownHouseAuthMemory || typeof window.__agentTownHouseAuthMemory !== 'object') {
    window.__agentTownHouseAuthMemory = Object.create(null);
  }
  return window.__agentTownHouseAuthMemory;
}

function unb64(str) {
  try {
    const bin = atob(str);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

function b64(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

async function sha256(bytes) {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return new Uint8Array(digest);
}

async function sha256Base64(input) {
  const bytes = new TextEncoder().encode(input || '');
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const arr = new Uint8Array(digest);
  let bin = '';
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin);
}

function cacheHouseAuthBytes(houseId, keyBytes) {
  if (!houseId || !keyBytes || keyBytes.length < 16) return;
  const encoded = b64(keyBytes);
  const store = getHouseAuthMemoryStore();
  const key = houseAuthCacheKey(houseId);
  store[key] = encoded;
  try {
    window.localStorage?.setItem(key, encoded);
  } catch {
    // ignore storage quota / privacy mode failures
  }
}

function loadCachedHouseAuthBytes(houseId) {
  const store = getHouseAuthMemoryStore();
  const key = houseAuthCacheKey(houseId);
  let raw = typeof store[key] === 'string' ? store[key] : '';
  if (!raw) {
    try {
      raw = typeof window.localStorage?.getItem(key) === 'string'
        ? window.localStorage.getItem(key)
        : '';
    } catch {
      raw = '';
    }
  }
  if (!raw) return null;
  const keyBytes = unb64(raw);
  if (!keyBytes || keyBytes.length < 16) return null;
  return keyBytes;
}

async function deriveHouseAuthBytesFromKroot(krootBytes) {
  const baseKey = await crypto.subtle.importKey('raw', krootBytes, 'HKDF', false, ['deriveBits']);
  const info = new TextEncoder().encode('elizatown-house-auth-v1');
  const bits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array([]), info },
    baseKey,
    256
  );
  return new Uint8Array(bits);
}

async function importHouseAuthKey(houseId) {
  let keyBytes = loadCachedHouseAuthBytes(houseId);
  if (!keyBytes) {
    const kroot = await recoverHouseKrootWithWallet(houseId);
    keyBytes = await deriveHouseAuthBytesFromKroot(kroot);
    cacheHouseAuthBytes(houseId, keyBytes);
  }
  if (!keyBytes || keyBytes.length < 16) return null;
  return crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}

async function houseAuthHeaders(houseId, method, path, body) {
  const key = await importHouseAuthKey(houseId);
  if (!key) throw new Error('HOUSE_AUTH_NOT_READY');
  const ts = String(Date.now());
  const bodyHash = await sha256Base64(body || '');
  const msg = `${houseId}.${ts}.${method.toUpperCase()}.${path}.${bodyHash}`;
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(msg));
  const bytes = new Uint8Array(sig);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return { 'x-house-ts': ts, 'x-house-auth': btoa(bin) };
}

function buildKeyWrapMessage({ houseId, origin }) {
  const parts = ['ElizaTown House Key Wrap', `houseId: ${houseId}`];
  if (origin) parts.push(`origin: ${origin}`);
  return parts.join('\n');
}

function base58Encode(bytes) {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  if (!bytes || !bytes.length) return '';
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
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) out += '1';
  for (let i = digits.length - 1; i >= 0; i--) out += alphabet[digits[i]];
  return out;
}

function normalizeSignatureBytes(sig) {
  if (sig instanceof Uint8Array) return sig;
  if (sig instanceof ArrayBuffer) return new Uint8Array(sig);
  if (ArrayBuffer.isView(sig)) return new Uint8Array(sig.buffer);
  if (Array.isArray(sig)) return new Uint8Array(sig);
  if (typeof sig === 'string') {
    try {
      const bin = atob(sig);
      if (bin.length === 64) return Uint8Array.from(bin, (c) => c.charCodeAt(0));
    } catch {
      // ignore
    }
  }
  return null;
}

async function signWalletMessageBytes(message) {
  if (!inboxWalletClient) throw new Error('NO_SOLANA_WALLET');
  return inboxWalletClient.signMessage({ chain: 'solana', message });
}

async function connectWalletOrThrow() {
  if (!inboxWalletClient) throw new Error('NO_SOLANA_WALLET');
  const connected = await inboxWalletClient.connect({ chain: 'solana', silent: false });
  const address = connected?.address || inboxWalletClient.getAddress({ chain: 'solana' }) || null;
  if (!address) throw new Error('WALLET_NOT_CONNECTED');
  return { address };
}

async function aesGcmDecrypt(key, iv, ct) {
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv, additionalData: new Uint8Array([]) },
    key,
    ct
  );
  return new Uint8Array(pt);
}

async function recoverHouseKrootWithWallet(houseId) {
  if (houseKrootMemory.has(houseId)) return houseKrootMemory.get(houseId);

  const { address } = await connectWalletOrThrow();
  const primaryMsg = buildKeyWrapMessage({ houseId });
  const primarySig = await signWalletMessageBytes(primaryMsg);

  const lookup = await api('/api/wallet/lookup', {
    method: 'POST',
    body: JSON.stringify({
      address,
      signature: b64(primarySig),
      houseId
    })
  });
  if (!lookup?.keyWrap?.iv || !lookup?.keyWrap?.ct) throw new Error('KEY_WRAP_UNAVAILABLE');
  if (lookup.keyWrap.alg && lookup.keyWrap.alg !== 'AES-GCM') throw new Error('INVALID_KEY_WRAP');

  async function decryptWithSig(sigBytes) {
    const wrapKeyBytes = await sha256(sigBytes);
    const wrapKey = await crypto.subtle.importKey('raw', wrapKeyBytes, { name: 'AES-GCM' }, false, ['decrypt']);
    const iv = unb64(lookup.keyWrap.iv);
    const ct = unb64(lookup.keyWrap.ct);
    if (!iv || !ct) throw new Error('INVALID_KEY_WRAP');
    return aesGcmDecrypt(wrapKey, iv, ct);
  }

  async function decryptWithMessage(msg) {
    const sig = await signWalletMessageBytes(msg);
    return decryptWithSig(sig);
  }

  let kroot = null;
  let lastErr = null;
  try {
    kroot = await decryptWithSig(primarySig);
  } catch (e) {
    lastErr = e;
  }

  const origin = window.location.origin;
  const attempts = [];
  if (origin) {
    attempts.push(buildKeyWrapMessage({ houseId, origin }));
    try {
      const u = new URL(origin);
      const port = u.port ? `:${u.port}` : '';
      if (u.hostname === 'localhost') attempts.push(buildKeyWrapMessage({ houseId, origin: `${u.protocol}//127.0.0.1${port}` }));
      else if (u.hostname === '127.0.0.1') attempts.push(buildKeyWrapMessage({ houseId, origin: `${u.protocol}//localhost${port}` }));
    } catch {
      // ignore invalid origin parsing
    }
  }

  if (!kroot) {
    for (const msg of attempts) {
      try {
        kroot = await decryptWithMessage(msg);
        break;
      } catch (e) {
        lastErr = e;
      }
    }
  }
  if (!kroot) throw new Error(lastErr?.message || 'KEY_WRAP_DECRYPT_FAILED');

  const derivedHouseId = base58Encode(await sha256(kroot));
  if (derivedHouseId !== houseId) throw new Error('HOUSE_ID_MISMATCH');
  houseKrootMemory.set(houseId, kroot);
  return kroot;
}

async function authedApi({ houseId, url, method = 'GET', json = null }) {
  const parsed = new URL(url, window.location.origin);
  const path = parsed.pathname;
  const body = json == null ? '' : JSON.stringify(json);
  const authHeaders = await houseAuthHeaders(houseId, method, path, body);

  return api(url, {
    method,
    body: json == null ? undefined : body,
    headers: {
      ...authHeaders
    }
  });
}

async function resolvePonyTarget(toRaw) {
  const raw = String(toRaw || '').trim();
  if (!raw) throw new Error('MISSING_TO');
  const isAnchor = raw.includes(':');
  const query = isAnchor
    ? `erc8004Id=${encodeURIComponent(raw)}`
    : `houseId=${encodeURIComponent(raw)}`;
  const resolved = await api(`/api/pony/resolve?${query}`);
  return {
    sourceInput: raw,
    isAnchor,
    houseId: typeof resolved?.houseId === 'string' ? resolved.houseId : raw,
    ponyInboxPub: typeof resolved?.ponyInboxPub === 'string' ? resolved.ponyInboxPub : ''
  };
}

function ponyMessageKeyInfo({ fromHouseId = '', toHouseId = '' }) {
  return `elizatown-pony-msg-v1|from=${fromHouseId || ''}|to=${toHouseId || ''}`;
}

async function derivePonyMessageKey({ sharedSecret, fromHouseId, toHouseId, usages = ['encrypt'] }) {
  const baseKey = await crypto.subtle.importKey('raw', sharedSecret, 'HKDF', false, ['deriveKey']);
  const info = new TextEncoder().encode(ponyMessageKeyInfo({ fromHouseId, toHouseId }));
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array([]), info },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    usages
  );
}

async function aesGcmEncrypt(key, plaintextBytes) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: new Uint8Array([]) },
    key,
    plaintextBytes
  );
  return { iv, ct: new Uint8Array(ciphertext) };
}

async function encryptPonyMessage({ fromHouseId, toHouseId, recipientPonyInboxPub, body }) {
  const recipientBytes = unb64(recipientPonyInboxPub);
  if (!recipientBytes || !recipientBytes.length) throw new Error('RECEIVER_KEY_UNAVAILABLE');

  const recipientPub = await crypto.subtle.importKey(
    'spki',
    recipientBytes,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );
  const eph = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );
  const sharedBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: recipientPub },
    eph.privateKey,
    256
  );
  const sharedSecret = new Uint8Array(sharedBits);
  const key = await derivePonyMessageKey({ sharedSecret, fromHouseId, toHouseId, usages: ['encrypt'] });

  const createdAt = new Date().toISOString();
  const aadObj = {
    v: 1,
    kind: 'msg.chat.v1',
    fromHouseId: fromHouseId || null,
    toHouseId,
    createdAt
  };
  const aadBytes = new TextEncoder().encode(JSON.stringify(aadObj));
  const plaintextObj = { v: 1, body: String(body || '') };
  const plaintextBytes = new TextEncoder().encode(JSON.stringify(plaintextObj));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertextBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: aadBytes },
    key,
    plaintextBytes
  );
  const epk = new Uint8Array(await crypto.subtle.exportKey('spki', eph.publicKey));

  return {
    createdAt,
    ciphertext: {
      alg: PONY_E2EE_P256_AESGCM_V1,
      epk: b64(epk),
      iv: b64(iv),
      ct: b64(new Uint8Array(ciphertextBuf)),
      aad: b64(aadBytes)
    }
  };
}

function messageCiphertext(msg) {
  if (msg?.envelope?.ciphertext && typeof msg.envelope.ciphertext === 'object') {
    return msg.envelope.ciphertext;
  }
  if (msg?.ciphertext && typeof msg.ciphertext === 'object') {
    return msg.ciphertext;
  }
  if (typeof msg?.ciphertext === 'string') {
    return { alg: 'PLAINTEXT', ct: msg.ciphertext, iv: '' };
  }
  return { alg: 'UNKNOWN', ct: '', iv: '' };
}

async function derivePonyInboxWrapKey(krootBytes, { usages = ['decrypt'] } = {}) {
  const info = new TextEncoder().encode(PONY_INBOX_WRAP_INFO);
  const baseKey = await crypto.subtle.importKey('raw', krootBytes, 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array([]), info },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    usages
  );
}

async function makePonyInboxRegistration(krootBytes) {
  const pair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );
  const pub = new Uint8Array(await crypto.subtle.exportKey('spki', pair.publicKey));
  const priv = new Uint8Array(await crypto.subtle.exportKey('pkcs8', pair.privateKey));

  const wrapKey = await derivePonyInboxWrapKey(krootBytes, { usages: ['encrypt'] });
  const wrapped = await aesGcmEncrypt(wrapKey, priv);
  return {
    ponyInboxPub: b64(pub),
    ponyInboxPrivWrap: {
      alg: 'AES-GCM',
      iv: b64(wrapped.iv),
      ct: b64(wrapped.ct)
    }
  };
}

function legacyPonyUpgradeErrorMsg(err) {
  if (err?.message === 'NO_SOLANA_WALLET') {
    return 'Legacy house needs a one-time inbox key upgrade. Install/connect a Solana wallet, then reload.';
  }
  if (err?.message === 'NO_SOLANA_SIGN') {
    return 'Legacy house needs a one-time inbox key upgrade. Wallet must support message signing.';
  }
  if (err?.message === 'WALLET_NOT_CONNECTED') {
    return 'Legacy house needs a one-time inbox key upgrade. Connect the house wallet and reload.';
  }
  if (err?.message === 'KEY_WRAP_UNAVAILABLE') {
    return 'Legacy house needs a one-time inbox key upgrade. No key-wrap found for this house wallet.';
  }
  if (err?.message === 'HOUSE_ID_MISMATCH') {
    return 'Legacy house needs a one-time inbox key upgrade. Connected wallet does not match this house.';
  }
  if (err?.message === 'SIGNATURE_FORMAT') {
    return 'Legacy house needs a one-time inbox key upgrade. Wallet signature format is unsupported.';
  }
  return `Legacy house key upgrade failed: ${err?.message || 'UNKNOWN_ERROR'}`;
}

async function ensureLegacyPonyInboxRegistered(houseId) {
  if (!houseId) return false;
  if (ponyUpgradeDone.has(houseId)) return false;
  if (ponyUpgradeFailed.has(houseId)) return false;
  if (ponyUpgradeInFlight.has(houseId)) return ponyUpgradeInFlight.get(houseId);

  const run = (async () => {
    const krootBytes = await recoverHouseKrootWithWallet(houseId);
    const registration = await makePonyInboxRegistration(krootBytes);
    await authedApi({
      houseId,
      url: '/api/pony/keys/register',
      method: 'POST',
      json: {
        houseId,
        ponyInboxPub: registration.ponyInboxPub,
        ponyInboxPrivWrap: registration.ponyInboxPrivWrap
      }
    });
    ponyUpgradeDone.add(houseId);
    ponyUpgradeFailed.delete(houseId);
    ponyUpgradeFailureMsg.delete(houseId);
    return true;
  })().catch((err) => {
    ponyUpgradeFailed.add(houseId);
    const msg = legacyPonyUpgradeErrorMsg(err);
    ponyUpgradeFailureMsg.set(houseId, msg);
    throw err;
  }).finally(() => {
    ponyUpgradeInFlight.delete(houseId);
  });

  ponyUpgradeInFlight.set(houseId, run);
  return run;
}

async function loadInboxPrivateKey({ houseId, ponyInboxPrivWrap }) {
  if (!ponyInboxPrivWrap || typeof ponyInboxPrivWrap !== 'object') return null;
  if (ponyInboxPrivWrap.alg !== 'AES-GCM') return null;

  const krootBytes = await recoverHouseKrootWithWallet(houseId);

  const iv = unb64(ponyInboxPrivWrap.iv || '');
  const ct = unb64(ponyInboxPrivWrap.ct || '');
  if (!iv || iv.length !== 12 || !ct || ct.length < 17) return null;

  const wrapKey = await derivePonyInboxWrapKey(krootBytes);
  const privatePkcs8 = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, wrapKey, ct);
  return crypto.subtle.importKey(
    'pkcs8',
    privatePkcs8,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    ['deriveBits']
  );
}

async function decryptPonyCiphertext({ houseId, msg, ciphertext, privateKey }) {
  if (ciphertext.alg !== PONY_E2EE_P256_AESGCM_V1) return null;

  const epk = unb64(ciphertext.epk || '');
  const iv = unb64(ciphertext.iv || '');
  const ct = unb64(ciphertext.ct || '');
  const aad = unb64(ciphertext.aad || '');
  if (!epk || !iv || !ct || !aad) throw new Error('INVALID_PONY_E2EE_ENVELOPE');

  const peerPublic = await crypto.subtle.importKey(
    'spki',
    epk,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );
  const sharedBits = await crypto.subtle.deriveBits({ name: 'ECDH', public: peerPublic }, privateKey, 256);
  const sharedSecret = new Uint8Array(sharedBits);
  const decryptKey = await derivePonyMessageKey({
    sharedSecret,
    fromHouseId: msg.fromHouseId || '',
    toHouseId: houseId,
    usages: ['decrypt']
  });

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv, additionalData: aad },
    decryptKey,
    ct
  );
  const decoded = new TextDecoder().decode(new Uint8Array(plaintext));
  const payload = JSON.parse(decoded);
  if (!payload || typeof payload.body !== 'string') throw new Error('INVALID_PONY_E2EE_PLAINTEXT');
  return payload.body;
}

async function hydrateInboxItemsForDisplay({ houseId, items, ponyInboxPrivWrap }) {
  let privateKey = null;
  let keyLoadError = null;
  try {
    privateKey = await loadInboxPrivateKey({ houseId, ponyInboxPrivWrap });
  } catch (e) {
    if (e?.message === 'NO_SOLANA_WALLET') keyLoadError = 'Connect a Solana wallet to decrypt.';
    else if (e?.message === 'NO_SOLANA_SIGN') keyLoadError = 'Wallet does not support message signing.';
    else if (e?.message === 'KEY_WRAP_UNAVAILABLE') keyLoadError = 'No wallet key-wrap is available for this house.';
    else if (e?.message === 'HOUSE_ID_MISMATCH') keyLoadError = 'Wallet key-wrap does not match this house.';
    else if (e?.message === 'SIGNATURE_FORMAT') keyLoadError = 'Wallet signature format is unsupported.';
    else keyLoadError = 'Encrypted key unavailable.';
  }

  for (const msg of items) {
    const c = messageCiphertext(msg);

    if (c.alg === 'PLAINTEXT') {
      msg.display = { label: 'Legacy plaintext', preview: String(c.ct || '') };
      continue;
    }

    if (c.alg !== PONY_E2EE_P256_AESGCM_V1) {
      const preview = typeof c.ct === 'string' ? c.ct : JSON.stringify(c, null, 2);
      msg.display = { label: c.alg || 'Ciphertext', preview };
      continue;
    }

    if (!privateKey) {
      msg.display = {
        label: 'E2EE encrypted',
        preview: keyLoadError || 'Unlock this house first to decrypt this message.'
      };
      continue;
    }

    try {
      const body = await decryptPonyCiphertext({ houseId, msg, ciphertext: c, privateKey });
      msg.display = { label: 'E2EE decrypted', preview: body };
    } catch {
      msg.display = { label: 'E2EE encrypted', preview: 'Decryption failed.' };
    }
  }

  return items;
}

function renderMsg(msg, { houseId, showActions }) {
  const wrap = document.createElement('div');
  wrap.className = 'card';
  const from = msg.fromHouseId ? msg.fromHouseId : 'anonymous';
  const c = messageCiphertext(msg);
  const display = msg.display || { label: c.alg || 'Ciphertext', preview: typeof c.ct === 'string' ? c.ct : '' };
  const preview = typeof display.preview === 'string' ? display.preview : '';

  wrap.innerHTML = `
    <div class="muted" style="display:flex; justify-content:space-between; gap:10px;">
      <div>
        from <strong>${escapeHtml(from)}</strong> ·
        <span>${escapeHtml(msg.kind || 'msg.chat.v1')}</span> ·
        <span>${escapeHtml(display.label || 'Ciphertext')}</span>
      </div>
      <div>${escapeHtml(msg.createdAt || '')}</div>
    </div>
    <pre style="white-space:pre-wrap; margin:10px 0;">${escapeHtml(preview)}</pre>
  `;

  if (showActions) {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.gap = '10px';

    const accept = document.createElement('button');
    accept.className = 'btn';
    accept.textContent = 'Accept';
    accept.onclick = async () => {
      await authedApi({
        houseId,
        url: `/api/pony/inbox/${msg.id}/accept`,
        method: 'POST',
        json: { houseId }
      });
      await load();
    };

    const reject = document.createElement('button');
    reject.className = 'btn';
    reject.textContent = 'Reject';
    reject.onclick = async () => {
      await authedApi({
        houseId,
        url: `/api/pony/inbox/${msg.id}/reject`,
        method: 'POST',
        json: { houseId }
      });
      await load();
    };

    row.appendChild(accept);
    row.appendChild(reject);
    wrap.appendChild(row);
  }

  return wrap;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function setInboxError(msg) {
  const status = document.getElementById('inboxStatus');
  if (!status) return;
  status.textContent = msg || '';
}

function setFriendsStatus(msg) {
  const el = document.getElementById('friendsStatus');
  if (!el) return;
  el.textContent = msg || '';
}

function setComposeReceiver(value) {
  const toInput = document.getElementById('toInput');
  if (!toInput) return;
  toInput.value = value || '';
}

function friendOptionLabel(friend) {
  const label = typeof friend?.label === 'string' ? friend.label.trim() : '';
  if (label) return `${label} (${friend.houseId})`;
  return friend.houseId;
}

function renderFriend(friend) {
  const wrap = document.createElement('div');
  wrap.className = 'card';

  const sources = Array.isArray(friend?.sources) ? friend.sources : [];
  const sourceText = sources.length ? sources.join(', ') : '';
  const label = typeof friend?.label === 'string' ? friend.label.trim() : '';

  wrap.innerHTML = `
    <div class="muted" style="display:flex; justify-content:space-between; gap:10px;">
      <div>
        <strong>${escapeHtml(label || friend.houseId)}</strong>
        ${label ? `<span class="muted"> · ${escapeHtml(friend.houseId)}</span>` : ''}
      </div>
      <div>${escapeHtml(sourceText)}</div>
    </div>
  `;

  const row = document.createElement('div');
  row.style.display = 'flex';
  row.style.gap = '10px';
  row.style.marginTop = '10px';

  const compose = document.createElement('button');
  compose.className = 'btn';
  compose.textContent = 'Compose';
  compose.onclick = () => {
    const sel = document.getElementById('friendSelect');
    if (sel) sel.value = friend.houseId;
    setComposeReceiver(friend.houseId);
  };

  row.appendChild(compose);
  wrap.appendChild(row);

  return wrap;
}

async function loadFriends(houseId) {
  const data = await authedApi({ houseId, url: `/api/pony/friends?houseId=${encodeURIComponent(houseId)}` });
  lastFriends = Array.isArray(data?.friends) ? data.friends : [];

  const friendsEl = document.getElementById('friends');
  if (friendsEl) {
    friendsEl.innerHTML = '';
    if (!lastFriends.length) friendsEl.innerHTML = '<div class="muted">No friends yet.</div>';
    for (const f of lastFriends) friendsEl.appendChild(renderFriend(f));
  }

  const sel = document.getElementById('friendSelect');
  if (sel) {
    sel.innerHTML = '';
    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = 'Select friend…';
    sel.appendChild(empty);
    for (const f of lastFriends) {
      const opt = document.createElement('option');
      opt.value = f.houseId;
      opt.textContent = friendOptionLabel(f);
      sel.appendChild(opt);
    }
  }
}

async function loadInternal() {
  const houseId = getHouseId();
  if (!houseId) return;

  document.getElementById('houseBadge').textContent = houseId;
  document.getElementById('backLink').href = `/house?house=${encodeURIComponent(houseId)}`;

  let data;
  try {
    data = await authedApi({ houseId, url: `/api/pony/inbox?houseId=${encodeURIComponent(houseId)}` });
    setInboxError('');
  } catch (e) {
    if (e.message === 'HOUSE_AUTH_NOT_READY' || e.message === 'HOUSE_AUTH_REQUIRED' || e.message === 'HOUSE_AUTH_INVALID') {
      setInboxError('Unlock this house first at /house and then open inbox from the same tab.');
    } else {
      setInboxError(`Error: ${e.message}`);
    }
    return;
  }

  if (!data.ponyInboxPrivWrap && !ponyUpgradeDone.has(houseId) && !ponyUpgradeFailed.has(houseId)) {
    try {
      const upgraded = await ensureLegacyPonyInboxRegistered(houseId);
      if (upgraded) {
        data = await authedApi({ houseId, url: `/api/pony/inbox?houseId=${encodeURIComponent(houseId)}` });
      }
    } catch (e) {
      setInboxError(ponyUpgradeFailureMsg.get(houseId) || legacyPonyUpgradeErrorMsg(e));
    }
  } else if (ponyUpgradeFailureMsg.has(houseId)) {
    setInboxError(ponyUpgradeFailureMsg.get(houseId));
  }

  const items = data.inbox || [];
  await hydrateInboxItemsForDisplay({
    houseId,
    items,
    ponyInboxPrivWrap: data.ponyInboxPrivWrap
  });

  const reqEl = document.getElementById('requests');
  const accEl = document.getElementById('accepted');
  reqEl.innerHTML = '';
  accEl.innerHTML = '';

  const requests = items.filter((m) => m.status === 'request');
  const accepted = items.filter((m) => m.status === 'accepted');

  if (!requests.length) reqEl.innerHTML = '<div class="muted">No requests.</div>';
  if (!accepted.length) accEl.innerHTML = '<div class="muted">No accepted messages.</div>';

  for (const m of requests) reqEl.appendChild(renderMsg(m, { houseId, showActions: true }));
  for (const m of accepted) accEl.appendChild(renderMsg(m, { houseId, showActions: false }));

  try {
    await loadFriends(houseId);
    setFriendsStatus('');
  } catch (e) {
    setFriendsStatus(`Error: ${e.message}`);
  }
}

async function load() {
  if (loadInFlight) return loadInFlight;
  loadInFlight = (async () => {
    try {
      await loadInternal();
    } finally {
      loadInFlight = null;
    }
  })();
  return loadInFlight;
}

function startAutoRefresh() {
  if (refreshTimer) return;
  refreshTimer = window.setInterval(() => {
    if (document.hidden) return;
    load().catch(() => {});
  }, INBOX_AUTO_REFRESH_MS);
}

async function send() {
  const houseId = getHouseId();
  const body = document.getElementById('body').value;
  const toRaw = document.getElementById('toInput')?.value?.trim() || '';
  const sendStatus = document.getElementById('sendStatus');
  sendStatus.textContent = '';

  if (!toRaw) {
    sendStatus.textContent = 'Error: missing receiver.';
    return;
  }

  try {
    const resolved = await resolvePonyTarget(toRaw);
    const payload = {
      fromHouseId: houseId
    };
    if (resolved.isAnchor) payload.toErc8004Id = resolved.sourceInput;
    else payload.toHouseId = resolved.houseId;

    if (resolved.ponyInboxPub) {
      const encrypted = await encryptPonyMessage({
        fromHouseId: houseId,
        toHouseId: resolved.houseId,
        recipientPonyInboxPub: resolved.ponyInboxPub,
        body
      });
      payload.ciphertext = encrypted.ciphertext;
    } else {
      throw new Error('RECEIVER_KEY_UNAVAILABLE');
    }

    await authedApi({ houseId, url: '/api/pony/send', method: 'POST', json: payload });
    document.getElementById('body').value = '';
    sendStatus.textContent = 'Sent.';
    await load();
  } catch (e) {
    if (e.message === 'RECEIVER_KEY_UNAVAILABLE') {
      sendStatus.textContent = 'Error: receiver does not publish Pony inbox keys yet.';
      return;
    }
    sendStatus.textContent = `Error: ${e.message}`;
  }
}

async function addFriend() {
  const houseId = getHouseId();
  const raw = document.getElementById('addFriendInput')?.value?.trim() || '';
  if (!raw) return;

  const payload = { houseId };
  if (raw.includes(':')) payload.friendErc8004Id = raw;
  else payload.friendHouseId = raw;

  try {
    await authedApi({ houseId, url: '/api/pony/friends', method: 'POST', json: payload });
    document.getElementById('addFriendInput').value = '';
    await loadFriends(houseId);
    setFriendsStatus('Added.');
  } catch (e) {
    setFriendsStatus(`Error: ${e.message}`);
  }
}

const sendBtn = document.getElementById('sendBtn');
if (sendBtn) sendBtn.onclick = send;

const addBtn = document.getElementById('addFriendBtn');
if (addBtn) addBtn.onclick = addFriend;

const friendSelect = document.getElementById('friendSelect');
if (friendSelect) {
  friendSelect.onchange = () => {
    const v = friendSelect.value;
    if (v) setComposeReceiver(v);
  };
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) load().catch(() => {});
});

window.addEventListener('beforeunload', () => {
  if (!refreshTimer) return;
  clearInterval(refreshTimer);
  refreshTimer = null;
});

load()
  .catch(() => {})
  .finally(() => {
    startAutoRefresh();
  });
