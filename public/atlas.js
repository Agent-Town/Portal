async function api(url, opts = {}) {
  const headers = { 'content-type': 'application/json', ...(opts.headers || {}) };
  const res = await fetch(url, { credentials: 'include', ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data && data.error ? data.error : `HTTP_${res.status}`;
    throw new Error(msg);
  }
  return data;
}

function el(id) { return document.getElementById(id); }

const state = {
  districts: [],
  districtMap: new Map(),
  districtDetailCache: new Map(),
  agentsById: new Map(),
  searchRequestSeq: 0,
  storefrontAgentId: null
};

function loadHouseIdFromCache() {
  try {
    const raw = localStorage.getItem('agentTownWallet');
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data && typeof data.houseId === 'string' && data.houseId) return data.houseId;
    return null;
  } catch {
    return null;
  }
}

async function resolveCurrentHouseId() {
  const cached = loadHouseIdFromCache();
  if (cached) return cached;
  try {
    const st = await api('/api/state');
    return st.houseId || null;
  } catch {
    return null;
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
}

function districtMatchesFilter(district, query, family) {
  const q = (query || '').trim().toLowerCase();
  const familyMatch = !family || district.key === family;
  if (!familyMatch) return false;
  if (!q) return true;
  return district.key.toLowerCase().includes(q) || String(district.label || '').toLowerCase().includes(q);
}

function setUrlState({ district = null, agent = null } = {}) {
  const next = new URL(window.location.href);
  if (district == null) next.searchParams.delete('district');
  else next.searchParams.set('district', district);
  if (agent == null) next.searchParams.delete('agent');
  else next.searchParams.set('agent', agent);
  window.history.replaceState({}, '', next.toString());
}

function mapAgentError(error) {
  const msg = String(error?.message || '');
  if (msg === 'NOT_FOUND') return 'Agent not found in current atlas source.';
  return `Error: ${msg || 'UNKNOWN'}`;
}

function upsertAgents(agents) {
  for (const agent of agents || []) {
    if (!agent || typeof agent !== 'object') continue;
    const id = String(agent.erc8004Id || '').trim();
    if (!id) continue;
    state.agentsById.set(id, agent);
  }
}

function renderSearchResults(payload) {
  const list = el('atlasSearchResults');
  const meta = el('atlasSearchMeta');
  if (!list || !meta) return;

  const results = Array.isArray(payload?.results) ? payload.results : [];
  const q = payload?.query?.q || '';
  const family = payload?.query?.family || '';
  const total = Number(payload?.query?.total || 0);
  const shown = results.length;
  const filterNote = family ? ` • family: ${family}` : '';
  const queryNote = q ? `query: "${q}"` : 'query: default';
  meta.textContent = `${queryNote}${filterNote} • showing ${shown} of ${total}`;

  list.innerHTML = '';
  if (!results.length) {
    const empty = document.createElement('div');
    empty.className = 'small';
    empty.textContent = 'No agents match this search.';
    list.appendChild(empty);
    return;
  }

  for (const row of results) {
    upsertAgents([row]);

    const card = document.createElement('div');
    card.className = 'card';
    card.setAttribute('data-testid', `atlas-search-result-${row.erc8004Id}`);

    const title = document.createElement('div');
    title.innerHTML = `<strong>${row.name || row.erc8004Id}</strong>`;

    const summary = document.createElement('div');
    summary.className = 'small';
    summary.style.color = 'var(--muted)';
    summary.textContent = `${row.erc8004Id} • ${row.districtLabel || row.districtKey} • chain ${row.chainId}`;

    const desc = document.createElement('div');
    desc.className = 'small';
    desc.style.marginTop = '6px';
    desc.textContent = row.description || '';

    const actions = document.createElement('div');
    actions.className = 'kv';
    actions.style.marginTop = '8px';

    const openBtn = document.createElement('button');
    openBtn.className = 'btn';
    openBtn.type = 'button';
    openBtn.textContent = 'Open storefront';
    openBtn.setAttribute('data-testid', `atlas-search-open-${row.erc8004Id}`);
    openBtn.addEventListener('click', () => {
      openAgentStorefront(row.erc8004Id).catch((err) => {
        const msg = el('atlasErr');
        if (msg) msg.textContent = mapAgentError(err);
      });
    });
    actions.appendChild(openBtn);

    if (row.sharePath) {
      const shareLink = document.createElement('a');
      shareLink.className = 'btn';
      shareLink.href = row.sharePath;
      shareLink.textContent = 'Share';
      shareLink.target = '_blank';
      shareLink.rel = 'noreferrer';
      actions.appendChild(shareLink);
    }

    card.appendChild(title);
    card.appendChild(summary);
    if (row.description) card.appendChild(desc);
    card.appendChild(actions);
    list.appendChild(card);
  }
}

async function runSearch(query, family) {
  const seq = ++state.searchRequestSeq;
  const params = new URLSearchParams();
  const q = String(query || '').trim();
  const f = String(family || '').trim();
  if (q) params.set('q', q);
  if (f) params.set('family', f);
  const searchPath = params.toString() ? `/api/atlas/search?${params.toString()}` : '/api/atlas/search';
  const payload = await api(searchPath);
  if (seq !== state.searchRequestSeq) return;
  renderSearchResults(payload);
}

function renderStorefront(agent) {
  const drawer = el('storefrontDrawer');
  const idEl = el('storefrontAgentId');
  const nameEl = el('storefrontAgentName');
  const descEl = el('storefrontAgentDesc');
  const shareLink = el('storefrontShareLink');
  const atlasLink = el('storefrontAtlasLink');
  if (!drawer || !idEl || !nameEl || !descEl || !shareLink || !atlasLink) return;

  const id = String(agent?.erc8004Id || '').trim();
  if (!id) return;
  state.storefrontAgentId = id;
  idEl.textContent = id;
  nameEl.textContent = agent?.name || `Agent ${id}`;
  descEl.textContent = agent?.description || '';
  shareLink.href = agent?.sharePath || `/atlas?agent=${encodeURIComponent(id)}`;
  atlasLink.href = `/atlas?agent=${encodeURIComponent(id)}`;
  drawer.classList.remove('is-hidden');
  resetStorefrontOptOutUi();
}

function closeStorefront() {
  const drawer = el('storefrontDrawer');
  if (drawer) drawer.classList.add('is-hidden');
  state.storefrontAgentId = null;
  const params = new URLSearchParams(window.location.search);
  const district = params.get('district');
  setUrlState({ district, agent: null });
}

function resetStorefrontOptOutUi() {
  const confirmBtn = el('storefrontOptOutConfirmBtn');
  const status = el('storefrontOptOutStatus');
  if (confirmBtn) confirmBtn.classList.add('is-hidden');
  if (status) {
    status.style.color = 'var(--muted)';
    status.textContent = '';
  }
}

function initStorefrontOptOutControls() {
  const openBtn = el('storefrontOptOutBtn');
  const confirmBtn = el('storefrontOptOutConfirmBtn');
  const status = el('storefrontOptOutStatus');
  if (!openBtn || !confirmBtn || !status) return;

  openBtn.addEventListener('click', () => {
    confirmBtn.classList.remove('is-hidden');
    status.style.color = 'var(--bad)';
    status.textContent = 'This requires wallet ownership proof and will remove the storefront.';
  });

  confirmBtn.addEventListener('click', () => {
    const id = state.storefrontAgentId || 'unknown';
    status.style.color = 'var(--muted)';
    status.textContent = `To finalize delete for ${id}, call /api/erc8004/optout with owner signature.`;
  });
}

async function openDistrictDetail(key, opts = {}) {
  if (!key) return;
  const detailPanel = el('atlasDistrictDetail');
  const title = el('atlasDistrictTitle');
  const stats = el('atlasDistrictStats');
  const agentsWrap = el('atlasDistrictAgents');
  if (!detailPanel || !title || !stats || !agentsWrap) return;

  let payload = state.districtDetailCache.get(key);
  if (!payload) {
    payload = await api(`/api/atlas/district/${encodeURIComponent(key)}`);
    state.districtDetailCache.set(key, payload);
  }

  const district = payload?.district || null;
  const agents = Array.isArray(payload?.agents) ? payload.agents : [];
  if (!district) throw new Error('DISTRICT_NOT_FOUND');

  upsertAgents(agents);
  title.textContent = district.label || district.key;
  stats.textContent = `total: ${district.totalAgents} • mainnet: ${district.mainnet?.agents || 0} • testnet: ${district.testnets?.agents || 0} • agents: ${agents.length}`;

  agentsWrap.innerHTML = '';
  if (!agents.length) {
    const empty = document.createElement('span');
    empty.className = 'small';
    empty.textContent = 'No storefront agents listed yet.';
    agentsWrap.appendChild(empty);
  } else {
    for (const agent of agents) {
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.type = 'button';
      btn.textContent = agent.name || agent.erc8004Id;
      btn.setAttribute('data-testid', `agent-open-${agent.erc8004Id}`);
      btn.addEventListener('click', () => {
        renderStorefront(agent);
        setUrlState({ district: district.key, agent: agent.erc8004Id });
      });
      agentsWrap.appendChild(btn);
    }
  }

  detailPanel.classList.remove('is-hidden');
  if (!opts.silent) {
    setUrlState({ district: district.key, agent: opts.agent || null });
  }
}

async function openAgentStorefront(erc8004Id) {
  const id = String(erc8004Id || '').trim();
  if (!id) return;

  let agent = state.agentsById.get(id) || null;
  if (!agent) {
    const payload = await api(`/api/atlas/agent/${encodeURIComponent(id)}`);
    agent = payload?.agent || null;
    if (!agent) throw new Error('NOT_FOUND');
    state.agentsById.set(id, agent);
  }
  if (agent.districtKey) {
    await openDistrictDetail(agent.districtKey, { silent: true, agent: id });
  }
  renderStorefront(agent);
  setUrlState({ district: agent.districtKey || null, agent: id });
}

function renderDistricts(districts, { query = '', family = '' } = {}) {
  const list = el('atlasDistrictList');
  if (!list) return;
  list.innerHTML = '';

  const filtered = districts.filter((d) => districtMatchesFilter(d, query, family));
  if (!filtered.length) {
    const empty = document.createElement('div');
    empty.className = 'small';
    empty.textContent = 'No districts match this filter.';
    list.appendChild(empty);
    return;
  }

  filtered.forEach((d) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.testid = `district-card-${d.key}`;
    card.setAttribute('data-testid', `district-card-${d.key}`);

    const heading = document.createElement('div');
    heading.innerHTML = `<strong>${d.label}</strong>`;

    const meta = document.createElement('div');
    meta.className = 'small';
    meta.style.color = 'var(--muted)';
    meta.textContent = `total: ${d.totalAgents} • mainnet: ${d.mainnet?.agents || 0} • testnet: ${d.testnets?.agents || 0} • size: ${d.districtSize}`;

    const ctaRow = document.createElement('div');
    ctaRow.className = 'kv';
    ctaRow.style.marginTop = '8px';

    const openBtn = document.createElement('button');
    openBtn.className = 'btn';
    openBtn.type = 'button';
    openBtn.textContent = 'Open district';
    openBtn.setAttribute('data-testid', `district-open-${d.key}`);
    openBtn.addEventListener('click', () => {
      openDistrictDetail(d.key).catch((err) => {
        const msg = el('atlasErr');
        if (msg) msg.textContent = mapAgentError(err);
      });
    });
    ctaRow.appendChild(openBtn);

    if (Array.isArray(d.previewAgents) && d.previewAgents.length) {
      for (const agent of d.previewAgents) {
        if (!agent || !agent.erc8004Id) continue;
        state.agentsById.set(agent.erc8004Id, { ...agent, districtKey: d.key });
        const agentBtn = document.createElement('button');
        agentBtn.className = 'btn';
        agentBtn.type = 'button';
        agentBtn.textContent = agent.name || agent.erc8004Id;
        agentBtn.setAttribute('data-testid', `agent-preview-open-${agent.erc8004Id}`);
        agentBtn.addEventListener('click', () => {
          openAgentStorefront(agent.erc8004Id).catch((err) => {
            const msg = el('atlasErr');
            if (msg) msg.textContent = mapAgentError(err);
          });
        });
        ctaRow.appendChild(agentBtn);
      }
    }

    card.appendChild(heading);
    card.appendChild(meta);
    card.appendChild(ctaRow);
    list.appendChild(card);
  });
}

function initFilters(districts) {
  const search = el('atlasSearch');
  const familySelect = el('atlasChainFamily');
  if (!search || !familySelect) return;

  for (const d of districts) {
    const option = document.createElement('option');
    option.value = d.key;
    option.textContent = d.label;
    familySelect.appendChild(option);
  }

  async function rerender() {
    const query = search.value || '';
    const family = familySelect.value || '';
    renderDistricts(districts, { query, family });
    try {
      await runSearch(query, family);
    } catch (err) {
      const msg = el('atlasErr');
      if (msg) msg.textContent = mapAgentError(err);
    }
  }

  search.addEventListener('input', () => { rerender(); });
  familySelect.addEventListener('change', () => { rerender(); });
  rerender();
}

async function init() {
  await initHouseNavLink();
  const data = await api('/api/atlas/districts');
  const districts = Array.isArray(data?.districts) ? data.districts : [];
  state.districts = districts;
  state.districtMap = new Map(districts.map((d) => [d.key, d]));
  const meta = el('atlasMeta');
  if (meta) {
    const source = data?.meta?.source || 'unknown';
    const formula = data?.meta?.formula || {};
    meta.textContent = `source: ${source} • size formula: ${formula.base} + ${formula.scale} * log10(1 + agents)`;
  }
  initFilters(districts);

  const closeBtn = el('storefrontCloseBtn');
  if (closeBtn) closeBtn.addEventListener('click', closeStorefront);
  initStorefrontOptOutControls();

  const params = new URLSearchParams(window.location.search);
  const districtParam = params.get('district');
  const agentParam = params.get('agent');

  if (districtParam) {
    await openDistrictDetail(districtParam, { silent: true });
  }
  if (agentParam) {
    await openAgentStorefront(agentParam);
  }
}

init().catch((err) => {
  const msg = el('atlasErr');
  if (msg) msg.textContent = `Error: ${err.message || 'UNKNOWN'}`;
});
