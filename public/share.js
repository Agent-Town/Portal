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

function setAgentPostsStatus(share) {
  const p = share.agentPosts || {};
  const parts = [];
  if (p.moltbookUrl) parts.push(`Moltbook: ${p.moltbookUrl}`);
  if (p.moltXUrl) parts.push(`MoltX: ${p.moltXUrl}`);
  el('agentPosts').textContent = parts.length ? parts.join(' • ') : 'Waiting for agent post links…';
}

function setOptInStatus(share) {
  if (share.public) {
    el('optInStatus').textContent = 'Added to wall ✓';
    return;
  }
  const o = share.optIn || {};
  const h = o.human;
  const a = o.agent;
  if (h === true && a === true) {
    el('optInStatus').textContent = 'Adding…';
  } else {
    el('optInStatus').textContent = `Human: ${h === true ? 'yes' : h === false ? 'no' : '…'} • Agent: ${a === true ? 'yes' : a === false ? 'no' : '…'}`;
  }
}

async function poll() {
  try {
    const r = await api(`/api/share/${encodeURIComponent(shareId)}`);
    renderSnapshot(r.share, r.palette);
    setAgentPostsStatus(r.share);
    setOptInStatus(r.share);

    // Update saved state for X
    if (r.share.xPostUrl) {
      el('xUrl').value = r.share.xPostUrl;
    }
  } catch (e) {
    // ignore
  } finally {
    setTimeout(poll, 900);
  }
}

async function init() {
  el('shareIdBadge').textContent = shareId;
  el('shareLink').textContent = shareLink;

  const tweetText = 'I paired with my OpenClaw agent and unlocked Eliza Town vNext.';
  el('xIntent').href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareLink)}`;

  el('copyLink').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      el('copyLink').textContent = 'Copied ✓';
      setTimeout(() => (el('copyLink').textContent = 'Copy'), 1200);
    } catch {
      alert(shareLink);
    }
  });

  el('saveX').addEventListener('click', async () => {
    el('err').textContent = '';
    try {
      await api('/api/human/posts', { method: 'POST', body: JSON.stringify({ xPostUrl: el('xUrl').value }) });
      el('xSaved').style.display = 'block';
      setTimeout(() => (el('xSaved').style.display = 'none'), 1200);
    } catch (e) {
      el('err').textContent = e.message;
    }
  });

  el('optInYes').addEventListener('click', async () => {
    el('err').textContent = '';
    try {
      await api('/api/human/optin', { method: 'POST', body: JSON.stringify({ appear: true }) });
    } catch (e) {
      el('err').textContent = e.message;
    }
  });

  el('optInNo').addEventListener('click', async () => {
    el('err').textContent = '';
    try {
      await api('/api/human/optin', { method: 'POST', body: JSON.stringify({ appear: false }) });
    } catch (e) {
      el('err').textContent = e.message;
    }
  });

  // Initial load
  const r = await api(`/api/share/${encodeURIComponent(shareId)}`);
  renderSnapshot(r.share, r.palette);
  setAgentPostsStatus(r.share);
  setOptInStatus(r.share);

  poll();
}

init().catch((e) => {
  el('err').textContent = e.message;
});
