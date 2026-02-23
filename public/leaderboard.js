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
    throw new Error(msg);
  }
  return data;
}

function el(id) { return document.getElementById(id); }
const HOUSE_AUTH_CACHE_PREFIX = 'agentTownHouseAuth:';
const friendAddStatusByShare = new Map();
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
  sessionStorage.setItem(houseAuthCacheKey(houseId), b64(keyBytes));
}

function loadCachedHouseAuthBytes(houseId) {
  const raw = sessionStorage.getItem(houseAuthCacheKey(houseId));
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

function setFriendStatus(shareId, msg, isError = false) {
  if (!shareId) return;
  if (!msg) {
    friendAddStatusByShare.delete(shareId);
    return;
  }
  friendAddStatusByShare.set(shareId, { msg, isError });
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
  if (msg === 'FRIEND_NOT_FOUND') return 'Target share could not be resolved.';
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
}

function formatHuman(handle) {
  if (!handle) return '—';
  return `@${handle}`;
}

function resolveShareHeroMedia(team) {
  if (team?.media?.shareHero?.imageUrl) return team.media.shareHero;
  if (team?.publicMedia?.imageUrl) return team.publicMedia;
  return null;
}

function render(teams) {
  const list = el('list');
  list.innerHTML = '';

  if (!teams.length) {
    el('empty').style.display = 'block';
    return;
  }
  el('empty').style.display = 'none';

  teams.forEach((p, idx) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.setAttribute('data-testid', `team-${idx}`);

    const title = document.createElement('div');
    const titleLabel = document.createElement('strong');
    titleLabel.textContent = 'Team';
    title.appendChild(titleLabel);
    title.appendChild(
      document.createTextNode(
        ` — human: ${formatHuman(p.humanHandle)} • agent: ${p.agentName || 'OpenClaw'}`
      )
    );

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.appendChild(
      document.createTextNode(
        `Referrals: ${p.referrals ?? 0} • Created: ${p.createdAt} • Share: `
      )
    );
    const shareLink = document.createElement('a');
    shareLink.href = p.sharePath;
    shareLink.textContent = p.shareId;
    meta.appendChild(shareLink);

    const links = document.createElement('div');
    links.className = 'kv';

    const share = document.createElement('a');
    share.className = 'btn';
    share.href = p.sharePath;
    share.textContent = 'Open share';

    links.appendChild(share);

    const add = document.createElement('button');
    add.className = 'btn';
    add.type = 'button';
    add.textContent = 'Add as friend';
    add.onclick = async () => {
      add.disabled = true;
      setFriendStatus(p.shareId, 'Adding…', false);
      status.textContent = 'Adding…';
      status.style.color = 'var(--muted)';
      try {
        await addShareAsFriend(p.shareId);
        setFriendStatus(p.shareId, 'Added to Pony friends.', false);
        status.textContent = 'Added to Pony friends.';
        status.style.color = 'var(--muted)';
      } catch (error) {
        const msg = mapFriendError(error);
        setFriendStatus(p.shareId, msg, true);
        status.textContent = msg;
        status.style.color = 'var(--bad)';
      } finally {
        add.disabled = false;
      }
    };
    links.appendChild(add);

    if (p.xPostUrl) {
      const x = document.createElement('a');
      x.className = 'btn';
      x.href = p.xPostUrl;
      x.target = '_blank';
      x.rel = 'noreferrer';
      x.textContent = 'X post';
      links.appendChild(x);
    }

    if (p.agentPosts?.moltbookUrl) {
      const mb = document.createElement('a');
      mb.className = 'btn';
      mb.href = p.agentPosts.moltbookUrl;
      mb.target = '_blank';
      mb.rel = 'noreferrer';
      mb.textContent = 'Moltbook post';
      links.appendChild(mb);
    }

    const status = document.createElement('div');
    status.className = 'small';
    status.dataset.friendAddStatus = p.shareId;
    status.style.minHeight = '1em';
    const friendStatus = friendAddStatusByShare.get(p.shareId);
    if (friendStatus?.msg) {
      status.textContent = friendStatus.msg;
      status.style.color = friendStatus.isError ? 'var(--bad)' : 'var(--muted)';
    } else {
      status.textContent = '';
      status.style.color = 'var(--muted)';
    }

    card.appendChild(title);
    card.appendChild(meta);
    const shareHero = resolveShareHeroMedia(p);
    if (shareHero && shareHero.imageUrl) {
      const media = document.createElement('div');
      media.className = 'public-media';
      const img = document.createElement('img');
      img.src = shareHero.imageUrl;
      img.alt = shareHero.prompt ? `Public image: ${shareHero.prompt}` : 'Public house image';
      if (p.shareId) img.dataset.testid = `leaderboard-share-hero-${p.shareId}`;
      img.loading = 'lazy';
      media.appendChild(img);
      if (shareHero.prompt) {
        const prompt = document.createElement('div');
        prompt.className = 'small';
        prompt.textContent = shareHero.prompt;
        media.appendChild(prompt);
      }
      card.appendChild(media);
    }
    card.appendChild(links);
    card.appendChild(status);
    list.appendChild(card);
  });
}

async function poll() {
  try {
    const r = await api('/api/leaderboard');
    el('signups').textContent = String(r.signups ?? '—');
    el('teams').textContent = String(r.teams?.length ?? '—');
    el('referralsTotal').textContent = String(r.referralsTotal ?? '—');
    render(r.teams || []);
  } catch (e) {
    // ignore
  } finally {
    setTimeout(poll, 1200);
  }
}

poll();
initHouseNavLink();
