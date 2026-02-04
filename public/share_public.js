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

async function init() {
  el('shareIdBadge').textContent = shareId;
  const signup = el('signupBtn');
  if (signup) {
    signup.href = `/?ref=${encodeURIComponent(shareId)}`;
  }
  const r = await api(`/api/share/${encodeURIComponent(shareId)}`);
  setTeamLine(r.share);
  setLinks(r.share);
  setPublicMedia(r.share.publicMedia || null);
}

init().catch((e) => {
  el('err').textContent = e.message;
});
