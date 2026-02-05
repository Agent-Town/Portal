function getHouseId() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  // /inbox/:houseId
  return parts[0] === 'inbox' ? parts[1] : null;
}

function renderMsg(msg, { showActions }) {
  const wrap = document.createElement('div');
  wrap.className = 'card';
  const from = msg.fromHouseId ? msg.fromHouseId : 'anonymous';
  wrap.innerHTML = `
    <div class="muted" style="display:flex; justify-content:space-between; gap:10px;">
      <div>from <strong>${escapeHtml(from)}</strong></div>
      <div>${escapeHtml(msg.createdAt || '')}</div>
    </div>
    <pre style="white-space:pre-wrap; margin:10px 0;">${escapeHtml(msg.ciphertext || '')}</pre>
  `;

  if (showActions) {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.gap = '10px';

    const accept = document.createElement('button');
    accept.className = 'btn';
    accept.textContent = 'Accept';
    accept.onclick = async () => {
      await api(`/api/pony/inbox/${msg.id}/accept`, { method: 'POST', body: JSON.stringify({}) });
      await load();
    };

    const reject = document.createElement('button');
    reject.className = 'btn';
    reject.textContent = 'Reject';
    reject.onclick = async () => {
      await api(`/api/pony/inbox/${msg.id}/reject`, { method: 'POST', body: JSON.stringify({}) });
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

async function load() {
  const houseId = getHouseId();
  if (!houseId) return;

  document.getElementById('houseBadge').textContent = houseId;
  document.getElementById('backLink').href = `/share/${houseId}`;

  const data = await api(`/api/pony/inbox?houseId=${encodeURIComponent(houseId)}`);
  const items = data.inbox || [];

  const reqEl = document.getElementById('requests');
  const accEl = document.getElementById('accepted');
  reqEl.innerHTML = '';
  accEl.innerHTML = '';

  const requests = items.filter((m) => m.status === 'request');
  const accepted = items.filter((m) => m.status === 'accepted');

  if (!requests.length) reqEl.innerHTML = '<div class="muted">No requests.</div>';
  if (!accepted.length) accEl.innerHTML = '<div class="muted">No accepted messages.</div>';

  for (const m of requests) reqEl.appendChild(renderMsg(m, { showActions: true }));
  for (const m of accepted) accEl.appendChild(renderMsg(m, { showActions: false }));
}

async function send() {
  const houseId = getHouseId();
  const body = document.getElementById('body').value;
  const fromHouseId = document.getElementById('fromHouseId').value.trim();
  const sendStatus = document.getElementById('sendStatus');
  sendStatus.textContent = '';

  try {
    await api('/api/pony/send', {
      method: 'POST',
      body: JSON.stringify({
        toHouseId: houseId,
        fromHouseId: fromHouseId || null,
        body
      })
    });
    document.getElementById('body').value = '';
    sendStatus.textContent = 'Sent.';
    await load();
  } catch (e) {
    sendStatus.textContent = `Error: ${e.message}`;
  }
}

document.getElementById('sendBtn').onclick = send;
load();
