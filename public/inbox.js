const HOUSE_AUTH_CACHE_PREFIX = 'agentTownHouseAuth:';
let lastFriends = [];

function getHouseId() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  // /inbox/:houseId
  return parts[0] === 'inbox' ? parts[1] : null;
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

function renderMsg(msg, { houseId, showActions }) {
  const wrap = document.createElement('div');
  wrap.className = 'card';
  const from = msg.fromHouseId ? msg.fromHouseId : 'anonymous';
  const c = messageCiphertext(msg);
  const preview = typeof c.ct === 'string' ? c.ct : JSON.stringify(c, null, 2);

  wrap.innerHTML = `
    <div class="muted" style="display:flex; justify-content:space-between; gap:10px;">
      <div>from <strong>${escapeHtml(from)}</strong> · <span>${escapeHtml(msg.kind || 'msg.chat.v1')}</span></div>
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
  const status = document.getElementById('sendStatus');
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

async function load() {
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

  const items = data.inbox || [];

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

  const payload = {
    fromHouseId: houseId,
    ciphertext: { alg: 'PLAINTEXT', iv: '', ct: body }
  };
  if (toRaw.includes(':')) payload.toErc8004Id = toRaw;
  else payload.toHouseId = toRaw;

  try {
    await authedApi({ houseId, url: '/api/pony/send', method: 'POST', json: payload });
    document.getElementById('body').value = '';
    sendStatus.textContent = 'Sent.';
  } catch (e) {
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

load();
