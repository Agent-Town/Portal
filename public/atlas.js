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

const DISTRICT_POSITION_PRESETS = Object.freeze({
  ethereum: [52, 42],
  monad: [30, 26],
  base: [72, 24],
  gnosis: [33, 66],
  bsc: [70, 62],
  arbitrum: [82, 47],
  optimism: [20, 52],
  polygon: [52, 75],
  celo: [16, 76],
  avalanche: [78, 79],
  scroll: [64, 42],
  linea: [60, 35],
  mantle: [76, 38],
  metis: [41, 34],
  taiko: [57, 54],
  abstract: [44, 58],
  megaeth: [45, 20],
  'x-layer': [61, 67]
});

const state = {
  districts: [],
  districtMap: new Map(),
  districtDetailCache: new Map(),
  agentsById: new Map(),
  searchRequestSeq: 0,
  storefrontAgentId: null,
  currentQuery: '',
  currentFamily: '',
  selectedDistrictKey: null,
  workerPollTimer: null
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
  if (msg === 'DISTRICT_NOT_FOUND') return 'District not found in current atlas source.';
  return `Error: ${msg || 'UNKNOWN'}`;
}

function setAtlasError(message) {
  const node = el('atlasErr');
  if (node) node.textContent = String(message || '');
}

function clearAtlasError() {
  setAtlasError('');
}

function upsertAgents(agents) {
  for (const agent of agents || []) {
    if (!agent || typeof agent !== 'object') continue;
    const id = String(agent.erc8004Id || '').trim();
    if (!id) continue;
    state.agentsById.set(id, agent);
  }
}

function formatNumber(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0';
  return Math.max(0, Math.trunc(n)).toLocaleString();
}

function initialsFromAgent(agent) {
  const raw = String(agent?.name || agent?.erc8004Id || '?').trim();
  if (!raw) return '?';
  const words = raw.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] || ''}${words[1][0] || ''}`.toUpperCase();
}

function resolveAgentHero(agent) {
  const shareHero = agent?.media?.shareHero?.imageUrl;
  const avatar = agent?.media?.agentAvatar?.imageUrl;
  const rawImage = typeof agent?.imageUrl === 'string' ? agent.imageUrl : null;
  return shareHero || avatar || rawImage || null;
}

function resolveAgentMediaSource(agent) {
  return agent?.media?.shareHero?.source || agent?.media?.agentAvatar?.source || null;
}

function mediaSourceLabel(source) {
  const key = String(source || '').trim().toLowerCase();
  if (!key) return 'source unknown';
  if (key === 'generated') return 'generated hero';
  if (key === 'erc8004') return '8004scan import';
  if (key === 'uploaded') return 'owner uploaded';
  if (key === 'legacy-public-media') return 'legacy media';
  return key;
}

function mediaSourceTone(source) {
  const key = String(source || '').trim().toLowerCase();
  if (key === 'generated' || key === 'uploaded') return 'good';
  if (key === 'erc8004' || key === 'legacy-public-media') return 'accent';
  return 'muted';
}

function districtNetworkSplit(district) {
  const mainnet = Number(district?.mainnet?.agents || 0);
  const testnet = Number(district?.testnets?.agents || 0);
  const total = Math.max(1, Number(district?.totalAgents || 0));
  return {
    mainnet,
    testnet,
    mainnetPct: Math.max(0, Math.min(100, Math.round((mainnet / total) * 100))),
    testnetPct: Math.max(0, Math.min(100, Math.round((testnet / total) * 100)))
  };
}

function updateAtlasKpis(districts, opts = {}) {
  const query = opts.query || '';
  const family = opts.family || '';
  const filtered = (districts || []).filter((d) => districtMatchesFilter(d, query, family));

  const districtCount = el('atlasDistrictCount');
  if (districtCount) districtCount.textContent = formatNumber(filtered.length);

  const visibleAgents = el('atlasVisibleAgents');
  if (visibleAgents) {
    const total = filtered.reduce((sum, d) => sum + Number(d?.agentCount || 0), 0);
    visibleAgents.textContent = formatNumber(total);
  }
}

function setAgentVisual(img, fallback, url, label) {
  const text = String(label || '?').slice(0, 2).toUpperCase();
  if (!img || !fallback) return;

  fallback.textContent = text;
  if (!url) {
    img.removeAttribute('src');
    img.classList.add('is-hidden');
    fallback.classList.remove('is-hidden');
    return;
  }

  img.classList.remove('is-hidden');
  fallback.classList.add('is-hidden');
  img.src = url;
  img.onerror = () => {
    img.classList.add('is-hidden');
    fallback.classList.remove('is-hidden');
  };
}

function shortAddress(value, start = 6, end = 4) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (raw.length <= start + end + 2) return raw;
  return `${raw.slice(0, start)}...${raw.slice(-end)}`;
}

function makeChip(text, tone = 'muted') {
  const chip = document.createElement('span');
  chip.className = 'atlas-chip';
  if (tone === 'good') chip.classList.add('is-good');
  else if (tone === 'accent') chip.classList.add('is-accent');
  else chip.classList.add('is-muted');
  chip.textContent = text;
  return chip;
}

function classifyChainType(agent, district) {
  const chainId = Number(agent?.chainId);
  if (!district || !Number.isFinite(chainId)) return 'unknown';

  const mainnetChains = Array.isArray(district?.mainnet?.chains) ? district.mainnet.chains : [];
  const testnetChains = Array.isArray(district?.testnets?.chains) ? district.testnets.chains : [];

  if (mainnetChains.some((row) => Number(row?.chainId) === chainId)) return 'mainnet';
  if (testnetChains.some((row) => Number(row?.chainId) === chainId)) return 'testnet';
  return 'unknown';
}

function hashText(value) {
  const str = String(value || '');
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return h >>> 0;
}

function resolveDistrictPosition(district, index, total) {
  const key = String(district?.key || '').trim().toLowerCase();
  const preset = DISTRICT_POSITION_PRESETS[key];
  if (Array.isArray(preset)) return preset;

  const h = hashText(`${key}|${index}|${total}`);
  const x = 14 + (h % 72);
  const y = 12 + (Math.floor(h / 131) % 74);
  return [x, y];
}

function setModalOpen(open) {
  const backdrop = el('atlasModalBackdrop');
  if (!backdrop) return;
  backdrop.classList.toggle('is-hidden', !open);
  backdrop.setAttribute('aria-hidden', open ? 'false' : 'true');
  document.body.classList.toggle('atlas-modal-open', open);
}

function closeAtlasModal() {
  const detail = el('atlasDistrictDetail');
  const storefront = el('storefrontDrawer');
  if (detail) detail.classList.add('is-hidden');
  if (storefront) storefront.classList.add('is-hidden');
  setModalOpen(false);
  state.storefrontAgentId = null;
  state.selectedDistrictKey = null;
  renderDistricts(state.districts, { query: state.currentQuery, family: state.currentFamily });
  setUrlState({ district: null, agent: null });
}

function closeStorefront() {
  const drawer = el('storefrontDrawer');
  if (drawer) drawer.classList.add('is-hidden');
  state.storefrontAgentId = null;

  const params = new URLSearchParams(window.location.search);
  const district = params.get('district');
  setUrlState({ district, agent: null });

  const detail = el('atlasDistrictDetail');
  if (detail && detail.classList.contains('is-hidden')) {
    setModalOpen(false);
  }
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

function extractCapabilityTags(agent) {
  const text = `${agent?.name || ''} ${agent?.description || ''}`.toLowerCase();
  const tags = [];
  if (text.includes('monitor') || text.includes('sentinel') || text.includes('watch')) tags.push('monitoring');
  if (text.includes('route') || text.includes('dispatch') || text.includes('courier')) tags.push('routing');
  if (text.includes('coord') || text.includes('orchestr') || text.includes('ops')) tags.push('orchestration');
  if (text.includes('archive') || text.includes('index') || text.includes('search')) tags.push('knowledge');
  if (text.includes('trade') || text.includes('market') || text.includes('price')) tags.push('market');
  return tags.slice(0, 3);
}

function renderStorefront(agent) {
  const drawer = el('storefrontDrawer');
  const idEl = el('storefrontAgentId');
  const nameEl = el('storefrontAgentName');
  const descEl = el('storefrontAgentDesc');
  const metaEl = el('storefrontMeta');
  const chipsEl = el('storefrontChips');
  const shareLink = el('storefrontShareLink');
  const atlasLink = el('storefrontAtlasLink');
  const hero = el('storefrontHeroImage');
  const heroFallback = el('storefrontHeroFallback');

  if (!drawer || !idEl || !nameEl || !descEl || !shareLink || !atlasLink) return;

  const id = String(agent?.erc8004Id || '').trim();
  if (!id) return;

  const district = state.districtMap.get(agent?.districtKey) || null;
  const districtLabel = district?.label || String(agent?.districtKey || 'Unknown district');
  const chainText = Number.isFinite(Number(agent?.chainId)) ? `chain ${agent.chainId}` : 'chain n/a';
  const chainType = classifyChainType(agent, district);
  const owner = shortAddress(agent?.ownerAddress || '');

  state.storefrontAgentId = id;
  idEl.textContent = id;
  nameEl.textContent = agent?.name || `Agent ${id}`;
  descEl.textContent = agent?.description || 'No description provided from source metadata.';
  if (metaEl) metaEl.textContent = `${districtLabel} • ${chainText}${owner ? ` • owner ${owner}` : ''}`;

  const deepLinkParams = new URLSearchParams();
  if (agent?.districtKey) deepLinkParams.set('district', agent.districtKey);
  deepLinkParams.set('agent', id);

  shareLink.href = agent?.sharePath || `/atlas?${deepLinkParams.toString()}`;
  atlasLink.href = `/atlas?${deepLinkParams.toString()}`;

  if (chipsEl) {
    chipsEl.innerHTML = '';
    chipsEl.appendChild(makeChip(chainType === 'unknown' ? 'network unknown' : chainType, chainType === 'mainnet' ? 'good' : 'accent'));
    chipsEl.appendChild(makeChip(mediaSourceLabel(resolveAgentMediaSource(agent)), mediaSourceTone(resolveAgentMediaSource(agent))));
    const caps = extractCapabilityTags(agent);
    for (const cap of caps) chipsEl.appendChild(makeChip(cap, 'muted'));
    if (agent?.media?.shareHero?.imageUrl) chipsEl.appendChild(makeChip('share hero', 'good'));
    if (agent?.media?.agentAvatar?.imageUrl) chipsEl.appendChild(makeChip('agent avatar', 'accent'));
  }

  setAgentVisual(hero, heroFallback, resolveAgentHero(agent), initialsFromAgent(agent));
  drawer.classList.remove('is-hidden');
  setModalOpen(true);
  resetStorefrontOptOutUi();
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
  const queryNote = q ? `query: "${q}"` : 'query: all storefronts';
  meta.textContent = `${queryNote}${filterNote} • showing ${shown} of ${total}`;

  list.innerHTML = '';
  if (!results.length) {
    const empty = document.createElement('div');
    empty.className = 'small atlas-empty';
    empty.textContent = 'No agents match this search.';
    list.appendChild(empty);
    return;
  }

  for (const row of results) {
    upsertAgents([row]);

    const card = document.createElement('article');
    card.className = 'card atlas-market-card';
    card.setAttribute('data-testid', `atlas-search-result-${row.erc8004Id}`);

    const heroWrap = document.createElement('div');
    heroWrap.className = 'atlas-market-hero';
    const hero = document.createElement('img');
    hero.alt = `${row.name || row.erc8004Id} hero`;
    hero.loading = 'lazy';
    const fallback = document.createElement('div');
    fallback.className = 'atlas-agent-fallback';
    setAgentVisual(hero, fallback, resolveAgentHero(row), initialsFromAgent(row));
    heroWrap.appendChild(hero);
    heroWrap.appendChild(fallback);

    const body = document.createElement('div');
    body.className = 'atlas-market-body';

    const title = document.createElement('div');
    title.className = 'atlas-market-title';
    title.textContent = row.name || row.erc8004Id;

    const idLine = document.createElement('div');
    idLine.className = 'small';
    const chainLabel = row.chainName ? `${row.chainName} (${row.chainId})` : `chain ${row.chainId}`;
    const networkLabel = row.networkType || 'network unknown';
    idLine.textContent = `${row.erc8004Id} • ${chainLabel} • ${networkLabel} • ${row.districtLabel || row.districtKey}`;

    const desc = document.createElement('div');
    desc.className = 'small atlas-market-desc';
    desc.textContent = row.description || 'No storefront description available.';

    const chipRow = document.createElement('div');
    chipRow.className = 'atlas-chip-row';
    chipRow.appendChild(makeChip('quick view modal', 'accent'));
    if (row.networkType) chipRow.appendChild(makeChip(row.networkType, row.networkType === 'mainnet' ? 'good' : 'accent'));
    chipRow.appendChild(makeChip(mediaSourceLabel(resolveAgentMediaSource(row)), mediaSourceTone(resolveAgentMediaSource(row))));
    if (row.updatedAt) chipRow.appendChild(makeChip('recently indexed', 'muted'));

    const actions = document.createElement('div');
    actions.className = 'kv atlas-market-actions';

    const openBtn = document.createElement('button');
    openBtn.className = 'btn';
    openBtn.type = 'button';
    openBtn.textContent = 'Open storefront';
    openBtn.setAttribute('data-testid', `atlas-search-open-${row.erc8004Id}`);
    openBtn.addEventListener('click', () => {
      openAgentStorefront(row.erc8004Id).catch((err) => {
        setAtlasError(mapAgentError(err));
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

    body.appendChild(title);
    body.appendChild(idLine);
    body.appendChild(desc);
    body.appendChild(chipRow);
    body.appendChild(actions);

    card.appendChild(heroWrap);
    card.appendChild(body);
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

function buildMapRoutes(stage, points) {
  const svgNs = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNs, 'svg');
  svg.setAttribute('class', 'atlas-map-routes');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('preserveAspectRatio', 'none');

  const ordered = points.slice().sort((a, b) => b.weight - a.weight);
  for (let i = 1; i < ordered.length; i += 1) {
    const prev = ordered[i - 1];
    const next = ordered[i];
    const line = document.createElementNS(svgNs, 'line');
    line.setAttribute('x1', String(prev.x));
    line.setAttribute('y1', String(prev.y));
    line.setAttribute('x2', String(next.x));
    line.setAttribute('y2', String(next.y));
    line.setAttribute('class', 'atlas-route-line');
    svg.appendChild(line);
  }

  stage.appendChild(svg);
}

function renderDistricts(districts, { query = '', family = '' } = {}) {
  const list = el('atlasDistrictList');
  if (!list) return;

  updateAtlasKpis(districts, { query, family });
  list.innerHTML = '';

  const filtered = districts.filter((d) => districtMatchesFilter(d, query, family));
  if (!filtered.length) {
    const empty = document.createElement('div');
    empty.className = 'small atlas-empty';
    empty.textContent = 'No districts match this filter.';
    list.appendChild(empty);
    return;
  }

  const points = filtered.map((district, index) => {
    const [x, y] = resolveDistrictPosition(district, index, filtered.length);
    return {
      district,
      x,
      y,
      weight: Number(district?.totalAgents || 0)
    };
  });

  buildMapRoutes(list, points);

  points.forEach((point) => {
    const district = point.district;
    const card = document.createElement('article');
    card.className = 'card atlas-map-node';
    if (district.key === state.selectedDistrictKey) card.classList.add('is-selected');
    card.dataset.testid = `district-card-${district.key}`;
    card.setAttribute('data-testid', `district-card-${district.key}`);

    const normalizedSize = Math.max(0.56, Math.min(1.15, Number(district.districtSize || 1) / 4.4));
    card.style.left = `${point.x}%`;
    card.style.top = `${point.y}%`;
    card.style.setProperty('--district-scale', normalizedSize.toFixed(3));

    const split = districtNetworkSplit(district);

    const head = document.createElement('div');
    head.className = 'atlas-district-head';

    const title = document.createElement('h3');
    title.textContent = district.label;

    const stats = document.createElement('div');
    stats.className = 'small';
    stats.textContent = `${formatNumber(district.totalAgents)} agents`;

    head.appendChild(title);
    head.appendChild(stats);

    const splitBar = document.createElement('div');
    splitBar.className = 'atlas-node-split';
    const mainBar = document.createElement('span');
    mainBar.className = 'is-mainnet';
    mainBar.style.width = `${Math.max(8, split.mainnetPct)}%`;
    const testBar = document.createElement('span');
    testBar.className = 'is-testnet';
    testBar.style.width = `${Math.max(8, split.testnetPct)}%`;
    splitBar.appendChild(mainBar);
    splitBar.appendChild(testBar);

    const splitMeta = document.createElement('div');
    splitMeta.className = 'small atlas-node-meta';
    splitMeta.textContent = `${split.mainnetPct}% mainnet • ${split.testnetPct}% testnet`;

    const ctaRow = document.createElement('div');
    ctaRow.className = 'kv atlas-district-actions';

    const openBtn = document.createElement('button');
    openBtn.className = 'btn';
    openBtn.type = 'button';
    openBtn.textContent = 'Open district';
    openBtn.setAttribute('data-testid', `district-open-${district.key}`);
    openBtn.addEventListener('click', () => {
      openDistrictDetail(district.key).catch((err) => {
        setAtlasError(mapAgentError(err));
      });
    });
    ctaRow.appendChild(openBtn);

    if (Array.isArray(district.previewAgents) && district.previewAgents.length) {
      const previewStrip = document.createElement('div');
      previewStrip.className = 'atlas-preview-strip';
      for (const agent of district.previewAgents) {
        if (!agent || !agent.erc8004Id) continue;
        state.agentsById.set(agent.erc8004Id, { ...agent, districtKey: district.key });

        const agentBtn = document.createElement('button');
        agentBtn.className = 'atlas-preview-agent';
        agentBtn.type = 'button';
        agentBtn.textContent = initialsFromAgent(agent);
        agentBtn.title = agent.name || agent.erc8004Id;
        agentBtn.setAttribute('aria-label', `Open ${agent.name || agent.erc8004Id}`);
        agentBtn.setAttribute('data-testid', `agent-preview-open-${agent.erc8004Id}`);
        agentBtn.addEventListener('click', () => {
          openAgentStorefront(agent.erc8004Id).catch((err) => {
            setAtlasError(mapAgentError(err));
          });
        });
        previewStrip.appendChild(agentBtn);
      }
      ctaRow.appendChild(previewStrip);
    }

    card.appendChild(head);
    card.appendChild(splitBar);
    card.appendChild(splitMeta);
    card.appendChild(ctaRow);
    list.appendChild(card);
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

  state.selectedDistrictKey = district.key;
  upsertAgents(agents);
  renderDistricts(state.districts, { query: state.currentQuery, family: state.currentFamily });

  title.textContent = `${district.label || district.key} District`;
  stats.textContent = `${formatNumber(district.totalAgents)} total • ${formatNumber(district.mainnet?.agents || 0)} mainnet • ${formatNumber(district.testnets?.agents || 0)} testnet • ${formatNumber(agents.length)} storefront profiles`;

  agentsWrap.innerHTML = '';
  if (!agents.length) {
    const empty = document.createElement('div');
    empty.className = 'small atlas-empty';
    empty.textContent = 'No storefront agents listed yet.';
    agentsWrap.appendChild(empty);
  } else {
    for (const agent of agents) {
      const id = String(agent?.erc8004Id || '').trim();
      if (!id) continue;

      const btn = document.createElement('button');
      btn.className = 'atlas-agent-tile';
      btn.type = 'button';
      btn.setAttribute('data-testid', `agent-open-${id}`);

      const media = document.createElement('div');
      media.className = 'atlas-agent-media';
      const img = document.createElement('img');
      img.alt = `${agent.name || id} avatar`;
      img.loading = 'lazy';
      const fb = document.createElement('div');
      fb.className = 'atlas-agent-fallback';
      setAgentVisual(img, fb, resolveAgentHero(agent), initialsFromAgent(agent));
      media.appendChild(img);
      media.appendChild(fb);

      const content = document.createElement('div');
      content.className = 'atlas-agent-copy';

      const name = document.createElement('div');
      name.className = 'atlas-agent-name';
      name.textContent = agent.name || id;

      const meta = document.createElement('div');
      meta.className = 'small';
      const network = classifyChainType(agent, district);
      const networkLabel = network === 'unknown' ? 'network unknown' : network;
      meta.textContent = `${id} • ${networkLabel}`;

      const desc = document.createElement('div');
      desc.className = 'small atlas-agent-desc';
      desc.textContent = agent.description || 'No description available.';

      const chips = document.createElement('div');
      chips.className = 'atlas-chip-row';
      const capTags = extractCapabilityTags(agent);
      for (const tag of capTags) chips.appendChild(makeChip(tag, 'muted'));

      content.appendChild(name);
      content.appendChild(meta);
      content.appendChild(desc);
      if (capTags.length) content.appendChild(chips);

      btn.appendChild(media);
      btn.appendChild(content);

      btn.addEventListener('click', () => {
        renderStorefront(agent);
        setUrlState({ district: district.key, agent: id });
      });

      agentsWrap.appendChild(btn);
    }
  }

  detailPanel.classList.remove('is-hidden');
  setModalOpen(true);
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
    agent = state.agentsById.get(id) || agent;
  }

  renderStorefront(agent);
  setUrlState({ district: agent.districtKey || null, agent: id });
}

function initFilters(districts) {
  const search = el('atlasSearch');
  const familySelect = el('atlasChainFamily');
  if (!search || !familySelect) return;

  for (const district of districts) {
    const option = document.createElement('option');
    option.value = district.key;
    option.textContent = district.label;
    familySelect.appendChild(option);
  }

  async function rerender() {
    const query = search.value || '';
    const family = familySelect.value || '';
    state.currentQuery = query;
    state.currentFamily = family;
    clearAtlasError();
    renderDistricts(districts, { query, family });
    try {
      await runSearch(query, family);
    } catch (err) {
      setAtlasError(mapAgentError(err));
    }
  }

  search.addEventListener('input', () => { rerender(); });
  familySelect.addEventListener('change', () => { rerender(); });
  rerender();
}

function setWorkerDockState(payload) {
  const dot = el('atlasWorkerDot');
  const status = el('atlasWorkerStatus');
  const team = el('atlasWorkerTeam');
  const name = el('atlasWorkerName');
  if (!dot || !status || !team || !name) return;

  const connected = payload?.agent?.connected === true;
  const matched = payload?.match?.matched === true;
  const openReady = payload?.human?.openPressed && payload?.agent?.openPressed;

  dot.classList.toggle('is-online', connected);
  dot.classList.toggle('is-busy', connected && !matched);

  if (!connected) status.textContent = 'Worker idle. Connect agent to enable co-op signals.';
  else if (!matched) status.textContent = 'Worker connected. Waiting for a matched sigil.';
  else if (!openReady) status.textContent = 'Match locked. Awaiting both open presses.';
  else status.textContent = 'Worker active. Co-op state synchronized.';

  team.textContent = payload?.teamCode || '—';
  name.textContent = payload?.agent?.name || 'Unassigned';
}

async function refreshWorkerDock() {
  try {
    const payload = await api('/api/state');
    setWorkerDockState(payload);
  } catch {
    setWorkerDockState(null);
  }
}

function initWorkerDock() {
  refreshWorkerDock();
  if (state.workerPollTimer) clearInterval(state.workerPollTimer);
  state.workerPollTimer = setInterval(() => {
    refreshWorkerDock();
  }, 15000);
}

function initModalControls() {
  const closeBtn = el('atlasModalCloseBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      closeAtlasModal();
    });
  }

  const backdrop = el('atlasModalBackdrop');
  if (backdrop) {
    backdrop.addEventListener('click', (ev) => {
      if (ev.target !== backdrop) return;
      closeAtlasModal();
    });
  }

  document.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Escape') return;
    const open = backdrop && !backdrop.classList.contains('is-hidden');
    if (!open) return;
    closeAtlasModal();
  });
}

async function init() {
  await initHouseNavLink();
  initWorkerDock();

  const data = await api('/api/atlas/districts');
  const districts = Array.isArray(data?.districts) ? data.districts : [];
  state.districts = districts;
  state.districtMap = new Map(districts.map((d) => [d.key, d]));

  const meta = el('atlasMeta');
  if (meta) {
    const source = data?.meta?.source || 'unknown';
    const formula = data?.meta?.formula || {};
    meta.textContent = `source: ${source} • district size: ${formula.base} + ${formula.scale} * log10(1 + agents)`;
  }

  initFilters(districts);

  const closeBtn = el('storefrontCloseBtn');
  if (closeBtn) closeBtn.addEventListener('click', closeStorefront);
  initStorefrontOptOutControls();
  initModalControls();

  const params = new URLSearchParams(window.location.search);
  const districtParam = params.get('district');
  const agentParam = params.get('agent');

  if (districtParam) {
    try {
      await openDistrictDetail(districtParam, { silent: true });
    } catch (err) {
      setAtlasError(mapAgentError(err));
    }
  }

  if (agentParam) {
    try {
      await openAgentStorefront(agentParam);
    } catch (err) {
      setAtlasError(mapAgentError(err));
    }
  }
}

init().catch((err) => {
  setAtlasError(`Error: ${err.message || 'UNKNOWN'}`);
});
