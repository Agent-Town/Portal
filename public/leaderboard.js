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
    return 'Unlock your house first in this same tab.';
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
