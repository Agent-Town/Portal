async function api(url, opts = {}) {
  const headers = { 'content-type': 'application/json', ...(opts.headers || {}) };
  const res = await fetch(url, {
    credentials: 'include',
    ...opts,
    headers
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data && data.error ? data.error : `HTTP_${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}

function el(id) { return document.getElementById(id); }
const EMBED_MODE = new URLSearchParams(window.location.search).get('embed') === '1';
if (EMBED_MODE) {
  document.body.classList.add('share-embed');
}
const HOUSE_AUTH_CACHE_PREFIX = 'agentTownHouseAuth:';
const houseAuthRecoveryInFlight = new Map();
let cachedCurrentHouseId = null;
let currentHouseLookup = null;

function loadHouseIdFromCache() {
  try {
    const raw = localStorage.getItem('agentTownWallet');
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data && typeof data.houseId === 'string' && data.houseId) {
      return data.houseId;
    }
    return null;
  } catch {
    return null;
  }
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

function b64(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
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

async function sha256Base64(input) {
  const bytes = new TextEncoder().encode(input || '');
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const arr = new Uint8Array(digest);
  let bin = '';
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin);
}

async function sha256(bytes) {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return new Uint8Array(digest);
}

function cacheHouseAuthBytes(houseId, keyBytes) {
  if (!houseId || !keyBytes || keyBytes.length < 16) return;
  const store = getHouseAuthMemoryStore();
  store[houseAuthCacheKey(houseId)] = b64(keyBytes);
}

function loadCachedHouseAuthBytes(houseId) {
  const store = getHouseAuthMemoryStore();
  const raw = typeof store[houseAuthCacheKey(houseId)] === 'string'
    ? store[houseAuthCacheKey(houseId)]
    : '';
  if (!raw) return null;
  const keyBytes = unb64(raw);
  if (!keyBytes || keyBytes.length < 16) return null;
  return keyBytes;
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
    const b58 = sig.trim();
    if (b58 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(b58)) {
      const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
      let num = 0n;
      for (const ch of b58) {
        const idx = alphabet.indexOf(ch);
        if (idx < 0) return null;
        num = num * 58n + BigInt(idx);
      }
      const bytes = [];
      while (num > 0n) {
        bytes.push(Number(num & 0xffn));
        num >>= 8n;
      }
      bytes.reverse();
      let zeros = 0;
      for (let i = 0; i < b58.length && b58[i] === '1'; i++) zeros += 1;
      const out = new Uint8Array(zeros + bytes.length);
      for (let i = 0; i < bytes.length; i++) out[zeros + i] = bytes[i];
      if (out.length === 64) return out;
    }
    try {
      const b = unb64(sig);
      if (b && b.length === 64) return b;
    } catch {
      // ignore
    }
  }
  return null;
}

async function signWalletMessageBytes(wallet, message) {
  const msgBytes = new TextEncoder().encode(message);
  const resp = await wallet.signMessage(msgBytes, 'utf8');
  const sig = resp?.signature || resp;
  const bytes = normalizeSignatureBytes(sig);
  if (!bytes) throw new Error('SIGNATURE_FORMAT');
  return bytes;
}

async function connectWalletForRecovery() {
  if (!window.solana) throw new Error('NO_SOLANA_WALLET');
  if (typeof window.solana.signMessage !== 'function') throw new Error('NO_SOLANA_SIGN');
  if (typeof window.solana.connect !== 'function') throw new Error('NO_SOLANA_WALLET');

  if (!window.solana.isConnected || !window.solana.publicKey) {
    try {
      await window.solana.connect({ onlyIfTrusted: true });
    } catch {
      // ignore and try interactive connect next
    }
  }
  if (!window.solana.isConnected || !window.solana.publicKey) {
    await window.solana.connect();
  }
  const address = window.solana.publicKey?.toString?.();
  if (!address) throw new Error('WALLET_NOT_CONNECTED');
  return { wallet: window.solana, address };
}

async function aesGcmDecrypt(key, iv, ct) {
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv, additionalData: new Uint8Array([]) },
    key,
    ct
  );
  return new Uint8Array(pt);
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

async function recoverHouseAuthBytesWithWallet(houseId) {
  if (!houseId) throw new Error('HOUSE_NOT_READY');
  const pending = houseAuthRecoveryInFlight.get(houseId);
  if (pending) return pending;

  const run = (async () => {
    const cached = loadCachedHouseAuthBytes(houseId);
    if (cached) return cached;

    const { wallet, address } = await connectWalletForRecovery();
    const primaryMsg = buildKeyWrapMessage({ houseId });
    const primarySig = await signWalletMessageBytes(wallet, primaryMsg);

    const lookup = await api('/api/wallet/lookup', {
      method: 'POST',
      body: JSON.stringify({
        address,
        signature: b64(primarySig),
        houseId
      })
    });

    if (!lookup || lookup.houseId !== houseId) throw new Error('HOUSE_NOT_FOUND');
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
      const sig = await signWalletMessageBytes(wallet, msg);
      return decryptWithSig(sig);
    }

    let kroot = null;
    let lastErr = null;
    try {
      kroot = await decryptWithSig(primarySig);
    } catch (err) {
      lastErr = err;
    }

    const origin = window.location.origin;
    const attempts = [];
    if (origin) {
      attempts.push(buildKeyWrapMessage({ houseId, origin }));
      try {
        const parsed = new URL(origin);
        const port = parsed.port ? `:${parsed.port}` : '';
        if (parsed.hostname === 'localhost') {
          attempts.push(buildKeyWrapMessage({ houseId, origin: `${parsed.protocol}//127.0.0.1${port}` }));
        } else if (parsed.hostname === '127.0.0.1') {
          attempts.push(buildKeyWrapMessage({ houseId, origin: `${parsed.protocol}//localhost${port}` }));
        }
      } catch {
        // ignore
      }
    }

    if (!kroot) {
      for (const msg of attempts) {
        try {
          kroot = await decryptWithMessage(msg);
          break;
        } catch (err) {
          lastErr = err;
        }
      }
    }
    if (!kroot) throw new Error(lastErr?.message || 'KEY_WRAP_DECRYPT_FAILED');

    const derivedHouseId = base58Encode(await sha256(kroot));
    if (derivedHouseId !== houseId) throw new Error('HOUSE_ID_MISMATCH');

    const houseAuthBytes = await deriveHouseAuthBytesFromKroot(kroot);
    cacheHouseAuthBytes(houseId, houseAuthBytes);
    return houseAuthBytes;
  })();

  houseAuthRecoveryInFlight.set(houseId, run);
  try {
    return await run;
  } finally {
    houseAuthRecoveryInFlight.delete(houseId);
  }
}

async function importHouseAuthKey(houseId) {
  let keyBytes = loadCachedHouseAuthBytes(houseId);
  if (!keyBytes) {
    keyBytes = await recoverHouseAuthBytesWithWallet(houseId);
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

async function resolveCurrentHouseId() {
  if (cachedCurrentHouseId) return cachedCurrentHouseId;
  if (currentHouseLookup) return currentHouseLookup;
  currentHouseLookup = (async () => {
    let houseId = loadHouseIdFromCache();
    if (!houseId) {
      try {
        const st = await api('/api/state');
        houseId = st.houseId || null;
      } catch {
        houseId = null;
      }
    }
    cachedCurrentHouseId = houseId || null;
    return cachedCurrentHouseId;
  })();
  try {
    return await currentHouseLookup;
  } finally {
    currentHouseLookup = null;
  }
}

function syncInboxLink(houseId) {
  const link = el('openInboxLink');
  if (!link) return;
  if (houseId) {
    link.classList.remove('is-hidden');
    link.href = `/inbox/${encodeURIComponent(houseId)}`;
  } else {
    link.classList.add('is-hidden');
    link.href = '#';
  }
}

async function initHouseNavLink() {
  const link = el('houseNavLink');
  if (!link) return;
  const houseId = await resolveCurrentHouseId();
  if (houseId) {
    link.classList.remove('is-hidden');
    link.href = `/house?house=${encodeURIComponent(houseId)}`;
  } else {
    link.classList.add('is-hidden');
    link.href = '/house';
  }
  syncInboxLink(houseId);
}

const shareId = window.location.pathname.split('/').filter(Boolean).pop();

function handleFromUrl(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (!parts.length) return null;
    const raw = parts[0].startsWith('@') ? parts[0].slice(1) : parts[0];
    return raw || null;
  } catch {
    return null;
  }
}

function setTeamLine(share) {
  const handle = share.humanHandle || handleFromUrl(share.xPostUrl);
  const human = handle ? `@${handle}` : '--';
  const agent = share.mode === 'token' ? (share.agentName || '$ELIZATOWN') : (share.agentName || 'OpenClaw');
  el('teamLine').textContent = `human: ${human} | agent: ${agent}`;
}

function setLink(linkId, missingId, url) {
  const link = el(linkId);
  const missing = el(missingId);
  if (url) {
    link.href = url;
    link.style.display = 'inline-flex';
    if (missing) missing.style.display = 'none';
  } else {
    link.style.display = 'none';
    if (missing) missing.style.display = 'inline-flex';
  }
}

function isLinkFirstShare(share) {
  return String(share?.experiencePreference?.sharePolicy || '').trim() === 'link-first'
    || String(share?.experiencePreference?.presetId || '').trim() === 'cn-mainland';
}

function applyShareLinkPolicy(share) {
  const humanLink = el('xPostLink');
  const humanMissing = el('xPostMissing');
  if (humanLink) {
    humanLink.textContent = isLinkFirstShare(share) ? 'Public post' : 'X post';
  }
  if (humanMissing) {
    humanMissing.textContent = isLinkFirstShare(share) ? 'No public post' : 'No X post';
  }
}

function setLinks(share) {
  applyShareLinkPolicy(share);
  setLink('xPostLink', 'xPostMissing', share.xPostUrl);
  const posts = share.agentPosts || {};
  setLink('moltbookLink', 'moltbookMissing', posts.moltbookUrl);
}

function setPublicMedia(media) {
  const wrap = el('shareMedia');
  const img = el('shareMediaImg');
  const prompt = el('shareMediaPrompt');
  if (!wrap || !img || !prompt) return;
  if (!media || !media.imageUrl) {
    wrap.classList.add('is-hidden');
    img.src = '';
    prompt.textContent = '';
    return;
  }
  wrap.classList.remove('is-hidden');
  img.src = media.imageUrl;
  img.alt = media.prompt ? `Public image: ${media.prompt}` : 'Public house image';
  prompt.textContent = media.prompt || '';
}

function resolveShareHero(share) {
  const hero = share?.media?.shareHero;
  if (hero && typeof hero.imageUrl === 'string' && hero.imageUrl) return hero;
  return share?.publicMedia || null;
}

function setFriendAddStatus(msg, isError = false) {
  const status = el('friendAddStatus');
  if (!status) return;
  status.textContent = msg || '';
  status.style.color = isError ? 'var(--bad)' : 'var(--muted)';
}

function mapFriendError(error) {
  const msg = String(error?.message || '');
  if (msg === 'HOUSE_AUTH_NOT_READY' || msg === 'HOUSE_AUTH_REQUIRED' || msg === 'HOUSE_AUTH_INVALID' || msg === 'HOUSE_AUTH_EXPIRED') {
    return 'Unlock your house at /house, then try again.';
  }
  if (msg === 'NO_SOLANA_WALLET') return 'Connect a Solana wallet to continue.';
  if (msg === 'NO_SOLANA_SIGN') return 'Wallet does not support message signing.';
  if (msg === 'WALLET_NOT_CONNECTED') return 'Connect your Solana wallet, then try again.';
  if (msg === 'KEY_WRAP_UNAVAILABLE') return 'This house has no wallet key-wrap; unlock it once at /house first.';
  if (msg === 'HOUSE_NOT_FOUND' || msg === 'HOUSE_ID_MISMATCH') {
    return 'Connected wallet does not match this house.';
  }
  if (msg === 'HOUSE_NOT_READY') return 'Create or reconnect to your house first.';
  if (msg === 'FRIEND_NOT_FOUND') return 'Share target could not be resolved.';
  if (msg === 'SELF_FRIEND') return 'That is already your house.';
  return `Error: ${msg || 'UNKNOWN'}`;
}

async function addShareAsFriend(targetShareId) {
  const houseId = await resolveCurrentHouseId();
  if (!houseId) throw new Error('HOUSE_NOT_READY');
  await authedApi({
    houseId,
    url: '/api/pony/friends',
    method: 'POST',
    json: {
      houseId,
      friendHouseId: targetShareId
    }
  });
  return houseId;
}

async function init() {
  el('shareIdBadge').textContent = shareId;
  await initHouseNavLink();
  const signup = el('signupBtn');
  if (signup) {
    signup.href = `/?ref=${encodeURIComponent(shareId)}`;
  }
  const addBtn = el('addFriendBtn');
  if (addBtn) {
    addBtn.onclick = async () => {
      addBtn.disabled = true;
      setFriendAddStatus('Adding…');
      try {
        const houseId = await addShareAsFriend(shareId);
        syncInboxLink(houseId);
        setFriendAddStatus('Added to Pony friends.');
      } catch (error) {
        setFriendAddStatus(mapFriendError(error), true);
      } finally {
        addBtn.disabled = false;
      }
    };
  }
  const r = await api(`/api/share/${encodeURIComponent(shareId)}`);
  setTeamLine(r.share);
  setLinks(r.share);
  setPublicMedia(resolveShareHero(r.share));
}

init().catch((e) => {
  el('err').textContent = e.message;
});
