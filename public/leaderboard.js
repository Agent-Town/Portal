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

function formatHuman(handle) {
  if (!handle) return '—';
  return `@${handle}`;
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

    card.appendChild(title);
    card.appendChild(meta);
    card.appendChild(links);
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
