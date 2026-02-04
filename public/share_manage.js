async function api(url, opts) {
  const res = await fetch(url, {
    headers: { 'content-type': 'application/json', ...(opts && opts.headers ? opts.headers : {}) },
    credentials: 'include',
    ...opts
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

const shareId = window.location.pathname.split('/').filter(Boolean).pop();
const shareLink = `${window.location.origin}/s/${shareId}`;
const manageToken = new URLSearchParams(window.location.search).get('k') || '';

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

function renderSnapshot(share, palette) {
  const grid = el('snapshot');
  grid.innerHTML = '';
  grid.style.gridTemplateColumns = `repeat(${share.canvas.w}, 18px)`;

  const pixels = share.pixels || [];
  for (let y = 0; y < share.canvas.h; y++) {
    for (let x = 0; x < share.canvas.w; x++) {
      const idx = y * share.canvas.w + x;
      const d = document.createElement('div');
      d.className = 'pixel';
      d.style.cursor = 'default';
      const colorIdx = pixels[idx] || 0;
      d.style.background = palette[colorIdx] || '#000';
      grid.appendChild(d);
    }
  }
}

function setTeamLine(share) {
  const handle = share.humanHandle || handleFromUrl(share.xPostUrl);
  const human = handle ? `@${handle}` : '--';
  const agent = share.agentName || 'OpenClaw';
  el('teamLine').textContent = `human: ${human} | agent: ${agent}`;
}

function setAgentPostsStatus(share) {
  const p = share.agentPosts || {};
  const parts = [];
  if (p.moltbookUrl) parts.push(`Moltbook: ${p.moltbookUrl}`);
  el('agentPosts').textContent = parts.length ? parts.join(' | ') : 'Waiting for agent post links...';
}

function setOptInStatus(share) {
  if (share.public) {
    el('optInStatus').textContent = 'Added to leaderboard';
    return;
  }
  const o = share.optIn || {};
  const h = o.human;
  const a = o.agent;
  if (h === true && a === true) {
    el('optInStatus').textContent = 'Adding...';
  } else {
    const human = h === true ? 'yes' : h === false ? 'no' : '...';
    const agent = a === true ? 'yes' : a === false ? 'no' : '...';
    el('optInStatus').textContent = `Human: ${human} | Agent: ${agent}`;
  }
}

async function poll() {
  try {
    const r = await api(`/api/share/${encodeURIComponent(shareId)}`);
    renderSnapshot(r.share, r.palette);
    setTeamLine(r.share);
    setAgentPostsStatus(r.share);
    setOptInStatus(r.share);
    if (r.share.xPostUrl) {
      el('xUrl').value = r.share.xPostUrl;
    }
  } catch {
    // ignore
  } finally {
    setTimeout(poll, 900);
  }
}

async function init() {
  el('shareIdBadge').textContent = shareId;
  el('shareLink').textContent = shareLink;
  if (!manageToken) {
    el('err').textContent = 'Missing manage token. Use the manage link from share creation.';
  }

  const tweetText = 'I teamed up with my OpenClaw agent and unlocked Agent Town.';
  el('xIntent').href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareLink)}`;

  el('copyLink').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      el('copyLink').textContent = 'Copied';
      setTimeout(() => (el('copyLink').textContent = 'Copy'), 1200);
    } catch {
      alert(shareLink);
    }
  });

  el('saveX').addEventListener('click', async () => {
    el('err').textContent = '';
    el('xErr').textContent = '';
    try {
      if (!manageToken) throw new Error('MISSING_MANAGE_TOKEN');
      await api('/api/human/posts', {
        method: 'POST',
        body: JSON.stringify({ shareId, manageToken, xPostUrl: el('xUrl').value })
      });
      el('xSaved').style.display = 'block';
      el('xErr').textContent = '';
      setTimeout(() => (el('xSaved').style.display = 'none'), 1200);
    } catch (e) {
      el('xErr').textContent = e.message === 'HANDLE_TAKEN'
        ? 'That X account has already been used.'
        : e.message;
    }
  });

  el('optInYes').addEventListener('click', async () => {
    el('err').textContent = '';
    try {
      if (!manageToken) throw new Error('MISSING_MANAGE_TOKEN');
      await api('/api/human/optin', {
        method: 'POST',
        body: JSON.stringify({ shareId, manageToken, appear: true })
      });
    } catch (e) {
      el('err').textContent = e.message;
    }
  });

  el('optInNo').addEventListener('click', async () => {
    el('err').textContent = '';
    try {
      if (!manageToken) throw new Error('MISSING_MANAGE_TOKEN');
      await api('/api/human/optin', {
        method: 'POST',
        body: JSON.stringify({ shareId, manageToken, appear: false })
      });
    } catch (e) {
      el('err').textContent = e.message;
    }
  });

  const r = await api(`/api/share/${encodeURIComponent(shareId)}`);
  renderSnapshot(r.share, r.palette);
  setTeamLine(r.share);
  setAgentPostsStatus(r.share);
  setOptInStatus(r.share);
  if (r.share.xPostUrl) {
    el('xUrl').value = r.share.xPostUrl;
  }

  poll();
}

init().catch((e) => {
  el('err').textContent = e.message;
});
