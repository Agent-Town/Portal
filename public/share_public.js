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
  setLink('moltXLink', 'moltXMissing', posts.moltXUrl);
}

async function init() {
  el('shareIdBadge').textContent = shareId;
  const r = await api(`/api/share/${encodeURIComponent(shareId)}`);
  renderSnapshot(r.share, r.palette);
  setTeamLine(r.share);
  setLinks(r.share);
}

init().catch((e) => {
  el('err').textContent = e.message;
});
