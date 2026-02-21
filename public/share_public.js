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
const HOUSE_AUTH_CACHE_PREFIX = 'agentTownHouseAuth:';
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

async function importHouseAuthKey(houseId) {
  const raw = sessionStorage.getItem(houseAuthCacheKey(houseId));
  if (!raw) return null;
  const keyBytes = unb64(raw);
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

function setLinks(share) {
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
    return 'Unlock your house first in this same tab, then try again.';
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
