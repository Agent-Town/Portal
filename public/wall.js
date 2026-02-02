async function api(url, opts) {
  const res = await fetch(url, {
    headers: { 'content-type': 'application/json', ...(opts && opts.headers ? opts.headers : {}) },
    credentials: 'include',
    ...opts
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data && data.error ? data.error : `HTTP_${res.status}`;
    throw new Error(msg);
  }
  return data;
}

function el(id) { return document.getElementById(id); }

function render(pairs) {
  const list = el('list');
  list.innerHTML = '';

  if (!pairs.length) {
    el('empty').style.display = 'block';
    return;
  }
  el('empty').style.display = 'none';

  pairs.forEach((p, idx) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.setAttribute('data-testid', `pair-${idx}`);

    const title = document.createElement('div');
    title.innerHTML = `<strong>Pair</strong> — agent: ${p.agentName || 'OpenClaw'} • sigil: ${p.matchedElement || '—'}`;

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = `Created: ${p.createdAt} • Share: ${p.shareId}`;

    const links = document.createElement('div');
    links.className = 'kv';

    const share = document.createElement('a');
    share.className = 'btn';
    share.href = p.sharePath;
    share.textContent = 'Open share';

    links.appendChild(share);

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

    if (p.agentPosts?.moltXUrl) {
      const mx = document.createElement('a');
      mx.className = 'btn';
      mx.href = p.agentPosts.moltXUrl;
      mx.target = '_blank';
      mx.rel = 'noreferrer';
      mx.textContent = 'MoltX post';
      links.appendChild(mx);
    }

    card.appendChild(title);
    card.appendChild(meta);
    card.appendChild(links);
    list.appendChild(card);
  });
}

async function poll() {
  try {
    const r = await api('/api/wall');
    el('signups').textContent = String(r.signups ?? '—');
    el('pairs').textContent = String(r.pairs?.length ?? '—');
    render(r.pairs || []);
  } catch (e) {
    // ignore
  } finally {
    setTimeout(poll, 1200);
  }
}

poll();
