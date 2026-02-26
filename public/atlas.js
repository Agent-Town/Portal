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
const EMBED_MODE = new URLSearchParams(window.location.search).get('embed') === '1';
if (EMBED_MODE) {
  document.body.classList.add('atlas-embed');
}

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
const DISTRICT_AGENT_PAGE_SIZE = 24;
const DISTRICT_SEARCH_DEBOUNCE_MS = 220;
const DISTRICT_PREFETCH_NEXT_COUNT = 8;

const state = {
  districts: [],
  districtMap: new Map(),
  districtDetailCache: new Map(),
  districtAgentListCache: new Map(),
  agentsById: new Map(),
  searchRequestSeq: 0,
  districtAgentRequestSeq: 0,
  districtSearchDebounceTimer: null,
  districtAgentsObserver: null,
  districtTileImageObserver: null,
  districtPrefetchedImages: new Set(),
  storefrontAgentId: null,
  currentQuery: '',
  currentFamily: '',
  currentSearchOpts: {
    searchType: 'keyword',
    sortField: 'relevance',
    sortDirection: 'desc',
    hasWeb: null,
    hasMcp: null,
    hasA2a: null,
    active: null
  },
  selectedDistrictKey: null,
  districtDetailView: {
    key: null,
    network: 'mainnet',
    query: '',
    searchType: 'semantic',
    sort: 'score_desc',
    loadedCount: 0,
    nextCursor: null,
    hasMore: false,
    loading: false
  },
  workerPollTimer: null
};

function parseBoolQueryParam(raw) {
  const text = String(raw ?? '').trim().toLowerCase();
  if (!text) return null;
  if (['1', 'true', 'yes', 'on'].includes(text)) return true;
  if (['0', 'false', 'no', 'off'].includes(text)) return false;
  return null;
}

function normalizeSearchType(raw) {
  return String(raw || '').trim().toLowerCase() === 'semantic' ? 'semantic' : 'keyword';
}

function normalizeSortField(raw) {
  const value = String(raw || '').trim();
  if (value === 'updatedAt' || value === 'name' || value === 'score') return value;
  return 'relevance';
}

function normalizeSortDirection(raw) {
  return String(raw || '').trim().toLowerCase() === 'asc' ? 'asc' : 'desc';
}

function normalizeDistrictSearchType(raw) {
  return String(raw || '').trim().toLowerCase() === 'keyword' ? 'keyword' : 'semantic';
}

function normalizeDistrictSort(raw) {
  const value = String(raw || '').trim().toLowerCase();
  if (value === 'score_asc' || value === 'updated_desc' || value === 'updated_asc' || value === 'relevance_desc' || value === 'relevance_asc') {
    return value;
  }
  return 'score_desc';
}

function normalizeDistrictNetwork(raw) {
  const value = String(raw || '').trim().toLowerCase();
  if (value === 'testnet' || value === 'test') return 'testnet';
  return 'mainnet';
}

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
  if (family && q) return true;
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

function formatScore(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0';
  return n.toFixed(2);
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

function districtChainCount(district) {
  const mainnetChains = Array.isArray(district?.mainnet?.chains) ? district.mainnet.chains.length : 0;
  const testnetChains = Array.isArray(district?.testnets?.chains) ? district.testnets.chains.length : 0;
  return mainnetChains + testnetChains;
}

function districtPrimaryChain(district) {
  const mainnetChains = Array.isArray(district?.mainnet?.chains)
    ? district.mainnet.chains.map((row) => ({ ...row, isTestnet: false }))
    : [];
  const testnetChains = Array.isArray(district?.testnets?.chains)
    ? district.testnets.chains.map((row) => ({ ...row, isTestnet: true }))
    : [];
  const merged = mainnetChains.concat(testnetChains);
  if (!merged.length) return null;
  merged.sort((a, b) => Number(b?.agents || 0) - Number(a?.agents || 0) || Number(a?.chainId || 0) - Number(b?.chainId || 0));
  return merged[0];
}

function districtPriorityTier(rankIndex, total) {
  const index = Number(rankIndex) + 1;
  const size = Math.max(1, Number(total) || 1);
  const highCutoff = Math.max(1, Math.ceil(size * 0.3));
  const mediumCutoff = Math.max(highCutoff + 1, Math.ceil(size * 0.65));
  if (index <= highCutoff) return { key: 'high', label: 'high priority' };
  if (index <= mediumCutoff) return { key: 'medium', label: 'medium priority' };
  return { key: 'entry', label: 'entry priority' };
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

const DISTRICT_STYLE_BASE_BY_KEY = Object.freeze({
  ethereum: 'Ethereum',
  monad: 'Monad',
  base: 'Base',
  gnosis: 'gnosis',
  bsc: 'bsc',
  arbitrum: 'Arbitrum',
  optimism: 'Optimism',
  polygon: 'Polygon',
  celo: 'Celo',
  avalanche: 'Avalanche',
  scroll: 'Scroll',
  linea: 'linea',
  mantle: 'Mantle',
  metis: 'Metis',
  taiko: 'Taiko',
  abstract: 'Abstract',
  megaeth: 'MegaETH',
  'x-layer': 'XLayer',
  solana: 'Solana'
});

const DISTRICT_LOGO_FILE_BY_KEY = Object.freeze({
  ethereum: 'Ethereum.png',
  monad: 'Monad.ico',
  base: 'Base.png',
  gnosis: 'Gnosis.png',
  bsc: 'BSC.png',
  arbitrum: 'Arbitrum.png',
  optimism: 'Optimism.png',
  polygon: 'Polygon.png',
  celo: 'Celo.png',
  avalanche: 'Avalanche.png',
  scroll: 'Scroll.png',
  linea: 'Linea.png',
  mantle: 'Mantle.png',
  metis: 'Metis.png',
  taiko: 'Taiko.png',
  abstract: 'Abstract.jpg',
  megaeth: 'MegaETH.jpeg',
  'x-layer': 'X-layer.png',
  solana: 'Solana.jpeg'
});

function districtStyleImagePath(district) {
  const key = String(district?.key || '').trim().toLowerCase();
  const base = DISTRICT_STYLE_BASE_BY_KEY[key];
  if (!base) return null;
  const variant = (hashText(`${key}|${district?.totalAgents || 0}`) % 2) + 1;
  const webpFile = `${base}_${variant}.webp`;
  const pngFile = `${base}_${variant}.png`;
  return `image-set(url("/images/districts_style_images/${webpFile}") type("image/webp"), url("/images/districts_style_images/${pngFile}") type("image/png"))`;
}

function districtLogoPath(district) {
  const key = String(district?.key || '').trim().toLowerCase();
  const file = DISTRICT_LOGO_FILE_BY_KEY[key];
  if (!file) return null;
  return `/images/districts_style_images/logos/${file}`;
}

function clearDistrictTileImageObserver() {
  if (!state.districtTileImageObserver) return;
  state.districtTileImageObserver.disconnect();
  state.districtTileImageObserver = null;
}

function applyDistrictTileImage(card) {
  if (!card) return;
  const bgImage = String(card.dataset?.districtStyleImage || '').trim();
  if (!bgImage) {
    card.style.removeProperty('--district-style-image');
    return;
  }
  card.style.setProperty('--district-style-image', bgImage);
  card.dataset.districtStyleApplied = '1';
}

function hydrateDistrictTileImages(cards, rootNode) {
  clearDistrictTileImageObserver();
  const rows = Array.isArray(cards) ? cards : [];
  if (!rows.length) return;
  if (typeof window === 'undefined' || typeof window.IntersectionObserver !== 'function') {
    rows.forEach((card) => applyDistrictTileImage(card));
    return;
  }

  state.districtTileImageObserver = new IntersectionObserver(
    (entries, observer) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        applyDistrictTileImage(entry.target);
        observer.unobserve(entry.target);
      }
    },
    {
      root: rootNode || null,
      rootMargin: '260px 0px',
      threshold: 0.01
    }
  );

  rows.forEach((card, idx) => {
    if (!card) return;
    if (idx < 6) {
      applyDistrictTileImage(card);
      return;
    }
    state.districtTileImageObserver.observe(card);
  });
}

function computeDistrictBaseSpan(totalAgents, minAgents, maxAgents) {
  const min = Math.max(0, Number(minAgents) || 0);
  const max = Math.max(min + 1, Number(maxAgents) || 1);
  const value = Math.max(min, Number(totalAgents) || 0);
  const minLog = Math.log1p(min);
  const maxLog = Math.log1p(max);
  const valueLog = Math.log1p(value);
  const ratio = (valueLog - minLog) / Math.max(1e-9, maxLog - minLog);
  const eased = Math.pow(Math.max(0, Math.min(1, ratio)), 0.68);

  // Use equal spans for a square-like treemap tile system.
  return 5 + Math.round(eased * 4); // 5..9
}

function computeDistrictTileSpan(totalAgents, minAgents, maxAgents, sizeScale = 1) {
  const sideBase = computeDistrictBaseSpan(totalAgents, minAgents, maxAgents);
  const sideSpan = Math.round(sideBase * Math.max(0.6, Number(sizeScale) || 1));
  const side = Math.max(4, Math.min(12, sideSpan));

  return {
    colSpan: side,
    rowSpan: side
  };
}

function isMobileAtlasListLayout() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(max-width: 860px)').matches;
}

function readAtlasGridMetrics(stage) {
  if (!stage || typeof window === 'undefined' || typeof window.getComputedStyle !== 'function') return null;
  const styles = window.getComputedStyle(stage);

  let cols = Number(styles.getPropertyValue('--atlas-cols'));
  if (!Number.isFinite(cols) || cols <= 0) {
    const template = String(styles.gridTemplateColumns || '').trim();
    cols = template ? template.split(/\s+/).length : 0;
  }
  if (!Number.isFinite(cols) || cols <= 0) cols = 24;

  const rowHeight = parseFloat(String(styles.gridAutoRows || '')) || 16;
  const gap = parseFloat(String(styles.rowGap || styles.gap || '')) || 0;
  const visibleRows = Math.max(1, Math.floor((stage.clientHeight + gap) / Math.max(1, rowHeight + gap)));
  return {
    cols,
    rowHeight,
    gap,
    visibleRows,
    totalCells: cols * visibleRows
  };
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
  if (state.districtAgentsObserver) {
    state.districtAgentsObserver.disconnect();
    state.districtAgentsObserver = null;
  }
  state.storefrontAgentId = null;
  state.selectedDistrictKey = null;
  if (state.districtSearchDebounceTimer) {
    clearTimeout(state.districtSearchDebounceTimer);
    state.districtSearchDebounceTimer = null;
  }
  state.districtDetailView.loading = false;
  state.districtDetailView.hasMore = false;
  state.districtDetailView.nextCursor = null;
  state.districtDetailView.loadedCount = 0;
  state.districtDetailView.key = null;
  state.districtDetailView.network = 'mainnet';
  setDistrictLoadStatus('');
  updateDistrictNetworkSwitch();
  updateSelectedDistrictCards();
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
  const searchType = normalizeSearchType(payload?.query?.searchType || 'keyword');
  const sortField = normalizeSortField(payload?.query?.sortField || 'relevance');
  const sortDirection = normalizeSortDirection(payload?.query?.sortDirection || 'desc');
  const total = Number(payload?.query?.total || 0);
  const shown = results.length;
  const filterParts = [];
  if (family) filterParts.push(`family: ${family}`);
  if (payload?.query?.hasWeb === true) filterParts.push('has web');
  if (payload?.query?.hasMcp === true) filterParts.push('has MCP');
  if (payload?.query?.hasA2a === true) filterParts.push('has A2A');
  if (payload?.query?.active === true) filterParts.push('active only');
  const filterNote = filterParts.length ? ` • ${filterParts.join(' • ')}` : '';
  const queryNote = q ? `query: "${q}"` : 'query: all storefronts';
  meta.textContent = `${queryNote}${filterNote} • ${searchType}/${sortField}/${sortDirection} • showing ${shown} of ${total}`;

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

async function runSearch(query, family, opts = {}) {
  const seq = ++state.searchRequestSeq;
  const params = new URLSearchParams();
  const q = String(query || '').trim();
  const f = String(family || '').trim();
  const searchType = normalizeSearchType(opts.searchType);
  const sortField = normalizeSortField(opts.sortField);
  const sortDirection = normalizeSortDirection(opts.sortDirection);
  const hasWeb = opts.hasWeb === true ? true : opts.hasWeb === false ? false : null;
  const hasMcp = opts.hasMcp === true ? true : opts.hasMcp === false ? false : null;
  const hasA2a = opts.hasA2a === true ? true : opts.hasA2a === false ? false : null;
  const active = opts.active === true ? true : opts.active === false ? false : null;
  if (q) params.set('q', q);
  if (f) params.set('family', f);
  if (searchType !== 'keyword') params.set('searchType', searchType);
  if (sortField !== 'relevance') params.set('sortField', sortField);
  if (sortDirection !== 'desc') params.set('sortDirection', sortDirection);
  if (hasWeb !== null) params.set('hasWeb', hasWeb ? '1' : '0');
  if (hasMcp !== null) params.set('hasMcp', hasMcp ? '1' : '0');
  if (hasA2a !== null) params.set('hasA2a', hasA2a ? '1' : '0');
  if (active !== null) params.set('active', active ? '1' : '0');
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
  list.classList.add('atlas-tile-map');
  clearDistrictTileImageObserver();

  const filtered = districts
    .filter((d) => districtMatchesFilter(d, query, family))
    .slice()
    .sort((a, b) => Number(b?.totalAgents || 0) - Number(a?.totalAgents || 0) || String(a?.label || '').localeCompare(String(b?.label || '')));
  if (!filtered.length) {
    const empty = document.createElement('div');
    empty.className = 'small atlas-empty';
    empty.textContent = 'No districts match this filter.';
    list.appendChild(empty);
    return;
  }

  const allAgents = filtered.map((d) => Number(d?.totalAgents || 0));
  const minAgents = allAgents.reduce((acc, n) => Math.min(acc, n), Number.POSITIVE_INFINITY);
  const maxAgents = allAgents.reduce((acc, n) => Math.max(acc, n), 0);
  const mobileListLayout = isMobileAtlasListLayout();

  let tileScale = 1;
  if (!mobileListLayout) {
    const metrics = readAtlasGridMetrics(list);
    if (metrics && metrics.totalCells > 0) {
      const baseArea = filtered.reduce((sum, district) => {
        const side = computeDistrictBaseSpan(district.totalAgents, minAgents, maxAgents);
        return sum + side * side;
      }, 0);
      if (baseArea > 0) {
        const fillTarget = filtered.length <= 6 ? 0.98 : filtered.length <= 10 ? 0.95 : 0.93;
        tileScale = Math.sqrt((metrics.totalCells * fillTarget) / baseArea);
        tileScale = Math.max(0.75, Math.min(2.6, tileScale));
      }
    }
  }

  const renderedCards = [];
  filtered.forEach((district, idx) => {
    const card = document.createElement('article');
    card.className = 'card atlas-map-node';
    if (district.key === state.selectedDistrictKey) card.classList.add('is-selected');
    card.dataset.testid = `district-card-${district.key}`;
    card.setAttribute('data-testid', `district-card-${district.key}`);
    card.dataset.districtKey = district.key;

    const tile = computeDistrictTileSpan(district.totalAgents, minAgents, maxAgents, tileScale);
    card.style.setProperty('--tile-col-span', String(tile.colSpan));
    card.style.setProperty('--tile-row-span', String(tile.rowSpan));
    const bgImage = districtStyleImagePath(district);
    card.style.removeProperty('--district-style-image');
    if (bgImage) card.dataset.districtStyleImage = bgImage;
    else delete card.dataset.districtStyleImage;
    if (tile.colSpan <= 6) card.classList.add('is-compact');
    if (tile.colSpan >= 8) card.classList.add('is-large');

    const split = districtNetworkSplit(district);
    const primaryChain = districtPrimaryChain(district);
    const chainCount = districtChainCount(district);
    const priority = districtPriorityTier(idx, filtered.length);

    const head = document.createElement('div');
    head.className = 'atlas-district-head';

    const titleRow = document.createElement('div');
    titleRow.className = 'atlas-district-title-row';

    const title = document.createElement('h3');
    title.textContent = district.label;

    const logoPath = districtLogoPath(district);
    if (logoPath) {
      const logo = document.createElement('img');
      logo.className = 'atlas-district-logo';
      logo.src = logoPath;
      logo.alt = '';
      logo.loading = 'lazy';
      logo.decoding = 'async';
      logo.referrerPolicy = 'no-referrer';
      logo.addEventListener('error', () => {
        logo.remove();
      });
      titleRow.appendChild(logo);
    }
    titleRow.appendChild(title);

    const priorityChip = document.createElement('span');
    priorityChip.className = `atlas-district-priority is-${priority.key}`;
    priorityChip.textContent = `P${String(idx + 1).padStart(2, '0')}`;
    priorityChip.title = `${priority.label} (${idx + 1}/${filtered.length})`;
    titleRow.appendChild(priorityChip);

    const stats = document.createElement('div');
    stats.className = 'small';
    stats.textContent = `${formatNumber(district.totalAgents)} agents • ${formatNumber(chainCount)} chains`;

    const chainMeta = document.createElement('div');
    chainMeta.className = 'small atlas-district-chain-meta';
    if (primaryChain) {
      const primaryName = primaryChain?.name ? `${primaryChain.name}` : `Chain ${primaryChain.chainId}`;
      const networkText = primaryChain?.isTestnet ? 'testnet lead' : 'mainnet lead';
      chainMeta.textContent = `Lead: ${primaryName} (${primaryChain.chainId}) • ${networkText}`;
    } else {
      chainMeta.textContent = 'Lead: unknown chain';
    }

    head.appendChild(titleRow);
    head.appendChild(stats);
    head.appendChild(chainMeta);

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

    const splitMeta = document.createElement('div');
    splitMeta.className = 'small atlas-district-split-chip';
    splitMeta.textContent = `${split.mainnetPct}% main • ${split.testnetPct}% test`;

    const splitBar = document.createElement('div');
    splitBar.className = 'atlas-district-split-bar';
    const splitMain = document.createElement('span');
    splitMain.className = 'is-main';
    splitMain.style.width = `${Math.max(8, split.mainnetPct)}%`;
    const splitTest = document.createElement('span');
    splitTest.className = 'is-test';
    splitTest.style.width = `${Math.max(8, split.testnetPct)}%`;
    splitBar.appendChild(splitMain);
    splitBar.appendChild(splitTest);

    const splitWrap = document.createElement('div');
    splitWrap.className = 'atlas-district-split-wrap';
    splitWrap.appendChild(splitBar);
    splitWrap.appendChild(splitMeta);
    ctaRow.appendChild(splitWrap);

    card.appendChild(head);
    card.appendChild(ctaRow);
    list.appendChild(card);
    renderedCards.push(card);
  });
  hydrateDistrictTileImages(renderedCards, list);
}

function updateSelectedDistrictCards() {
  const cards = document.querySelectorAll('.atlas-map-node[data-district-key]');
  cards.forEach((card) => {
    const key = String(card?.dataset?.districtKey || '');
    card.classList.toggle('is-selected', !!key && key === state.selectedDistrictKey);
  });
}

function setDistrictLoadStatus(message) {
  const node = el('atlasDistrictLoadStatus');
  if (!node) return;
  node.textContent = String(message || '');
}

function updateDistrictNetworkSwitch() {
  const network = normalizeDistrictNetwork(state.districtDetailView.network);
  const mainBtn = el('atlasDistrictNetworkMain');
  const testBtn = el('atlasDistrictNetworkTest');
  if (mainBtn) {
    const active = network === 'mainnet';
    mainBtn.classList.toggle('is-active', active);
    mainBtn.setAttribute('aria-pressed', active ? 'true' : 'false');
  }
  if (testBtn) {
    const active = network === 'testnet';
    testBtn.classList.toggle('is-active', active);
    testBtn.setAttribute('aria-pressed', active ? 'true' : 'false');
  }
}

function renderDistrictSummaryPayload(payload) {
  const district = payload?.district || null;
  const summary = payload?.summary || null;
  if (!district || !summary) return;
  const summaryNetwork = normalizeDistrictNetwork(summary?.network || state.districtDetailView.network);
  state.districtDetailView.network = summaryNetwork;
  updateDistrictNetworkSwitch();

  const title = el('atlasDistrictTitle');
  const stats = el('atlasDistrictStats');
  const mainnetCount = el('atlasDistrictMainnetCount');
  const testnetCount = el('atlasDistrictTestnetCount');
  const averageScore = el('atlasDistrictAverageScore');
  const scoreGtZero = el('atlasDistrictScoreGtZero');
  const binsNode = el('atlasDistrictScoreBins');
  const serviceNode = el('atlasDistrictServiceCounts');

  if (title) title.textContent = `${district.label || district.key} District`;
  if (stats) {
    const networkLabel = summaryNetwork === 'testnet' ? 'testnet' : 'mainnet';
    stats.textContent = `${formatNumber(summary?.totals?.agents || 0)} ${networkLabel} storefront profiles • ${formatNumber(district?.totalAgents || 0)} total district agents`;
  }
  if (mainnetCount) mainnetCount.textContent = formatNumber(summary?.totals?.mainnet || 0);
  if (testnetCount) testnetCount.textContent = formatNumber(summary?.totals?.testnet || 0);
  if (averageScore) averageScore.textContent = formatScore(summary?.totals?.averageScore || 0);
  if (scoreGtZero) scoreGtZero.textContent = formatNumber(summary?.totals?.scoreGt0 || 0);

  if (binsNode) {
    const bins = summary?.scoreBins || {};
    binsNode.textContent = `Score bins • 0:${formatNumber(bins.score0)} • 1-19:${formatNumber(bins.score1to19)} • 20-39:${formatNumber(bins.score20to39)} • 40-59:${formatNumber(bins.score40to59)} • 60-79:${formatNumber(bins.score60to79)} • 80+:${formatNumber(bins.score80plus)}`;
  }
  if (serviceNode) {
    const svc = summary?.serviceCounts || {};
    serviceNode.textContent = `Service signals • web:${formatNumber(svc.hasWeb)} • MCP:${formatNumber(svc.hasMcp)} • A2A:${formatNumber(svc.hasA2a)} • endpoint verified:${formatNumber(svc.endpointVerified)} • x402:${formatNumber(svc.x402Supported)} • active:${formatNumber(svc.active)}`;
  }
}

function prefetchDistrictImages(prefetchRows) {
  const rows = Array.isArray(prefetchRows) ? prefetchRows : [];
  for (const row of rows.slice(0, DISTRICT_PREFETCH_NEXT_COUNT)) {
    const imageUrl = typeof row?.imageUrl === 'string' ? row.imageUrl.trim() : '';
    if (!imageUrl || state.districtPrefetchedImages.has(imageUrl)) continue;
    state.districtPrefetchedImages.add(imageUrl);
    const img = new Image();
    img.decoding = 'async';
    img.src = imageUrl;
    if (typeof img.decode === 'function') img.decode().catch(() => {});
  }
}

function buildDistrictAgentTile(agent, districtKey) {
  const id = String(agent?.erc8004Id || '').trim();
  if (!id) return null;
  const district = state.districtMap.get(districtKey) || null;
  const btn = document.createElement('button');
  btn.className = 'atlas-agent-tile';
  btn.type = 'button';
  btn.setAttribute('data-testid', `agent-open-${id}`);

  const media = document.createElement('div');
  media.className = 'atlas-agent-media';
  const img = document.createElement('img');
  img.alt = `${agent.name || id} avatar`;
  img.loading = 'lazy';
  img.decoding = 'async';
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
  const networkLabel = network === 'unknown' ? (agent?.networkType || 'network unknown') : network;
  const scoreLabel = Number.isFinite(Number(agent?.qualityScore)) ? ` • score ${Number(agent.qualityScore).toFixed(2)}` : '';
  meta.textContent = `${id} • ${networkLabel}${scoreLabel}`;

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
    setUrlState({ district: districtKey, agent: id });
  });
  return btn;
}

function ensureDistrictAgentsObserver() {
  const sentinel = el('atlasDistrictSentinel');
  if (!sentinel) return;
  if (state.districtAgentsObserver) {
    state.districtAgentsObserver.disconnect();
    state.districtAgentsObserver = null;
  }
  state.districtAgentsObserver = new IntersectionObserver(
    (entries) => {
      const shouldLoad = entries.some((entry) => entry.isIntersecting);
      if (!shouldLoad) return;
      if (!state.districtDetailView.key || !state.districtDetailView.hasMore || state.districtDetailView.loading) return;
      loadDistrictAgentsPage({ reset: false }).catch((err) => {
        setAtlasError(mapAgentError(err));
      });
    },
    {
      root: null,
      rootMargin: '280px 0px',
      threshold: 0.01
    }
  );
  state.districtAgentsObserver.observe(sentinel);
}

async function loadDistrictAgentsPage({ reset = false } = {}) {
  const key = state.districtDetailView.key;
  if (!key) return;
  const agentsWrap = el('atlasDistrictAgents');
  if (!agentsWrap) return;
  if (!reset && (!state.districtDetailView.hasMore || state.districtDetailView.loading)) return;

  const query = String(state.districtDetailView.query || '').trim();
  const network = normalizeDistrictNetwork(state.districtDetailView.network);
  const searchType = normalizeDistrictSearchType(state.districtDetailView.searchType);
  const sort = normalizeDistrictSort(state.districtDetailView.sort);
  const cursor = reset ? null : state.districtDetailView.nextCursor;
  const cacheKey = `${key}|${network}|${query.toLowerCase()}|${searchType}|${sort}|${cursor || ''}`;

  if (reset) {
    agentsWrap.innerHTML = '';
    state.districtDetailView.loadedCount = 0;
    state.districtDetailView.nextCursor = null;
    state.districtDetailView.hasMore = false;
  }

  state.districtDetailView.loading = true;
  setDistrictLoadStatus(reset ? 'Loading district agents…' : 'Loading more…');
  const seq = ++state.districtAgentRequestSeq;
  try {
    let payload = state.districtAgentListCache.get(cacheKey) || null;
    if (!payload) {
      const params = new URLSearchParams();
      params.set('limit', String(DISTRICT_AGENT_PAGE_SIZE));
      params.set('network', network);
      params.set('searchType', searchType);
      params.set('sort', sort);
      if (query) params.set('q', query);
      if (cursor) params.set('cursor', cursor);
      payload = await api(`/api/atlas/district/${encodeURIComponent(key)}/agents?${params.toString()}`);
      state.districtAgentListCache.set(cacheKey, payload);
      if (state.districtAgentListCache.size > 240) {
        const oldestKey = state.districtAgentListCache.keys().next().value;
        if (oldestKey) state.districtAgentListCache.delete(oldestKey);
      }
    }

    if (seq !== state.districtAgentRequestSeq || state.districtDetailView.key !== key) return;

    const results = Array.isArray(payload?.results) ? payload.results : [];
    const pagination = payload?.pagination && typeof payload.pagination === 'object' ? payload.pagination : {};
    upsertAgents(results);

    for (const agent of results) {
      const tile = buildDistrictAgentTile(agent, key);
      if (!tile) continue;
      agentsWrap.appendChild(tile);
    }

    state.districtDetailView.loadedCount += results.length;
    state.districtDetailView.nextCursor = typeof pagination.nextCursor === 'string' ? pagination.nextCursor : null;
    state.districtDetailView.hasMore = pagination.hasMore === true;

    const total = Number.isFinite(Number(pagination.total)) ? Number(pagination.total) : state.districtDetailView.loadedCount;
    if (state.districtDetailView.loadedCount === 0) {
      const empty = document.createElement('div');
      empty.className = 'small atlas-empty';
      empty.textContent = query ? 'No agents match this district search.' : 'No storefront agents listed yet.';
      agentsWrap.appendChild(empty);
      setDistrictLoadStatus('No results.');
    } else if (state.districtDetailView.hasMore) {
      setDistrictLoadStatus(`Loaded ${formatNumber(state.districtDetailView.loadedCount)} of ${formatNumber(total)}. Scroll for more.`);
    } else {
      setDistrictLoadStatus(`Loaded ${formatNumber(state.districtDetailView.loadedCount)} of ${formatNumber(total)}.`);
    }

    prefetchDistrictImages(payload?.prefetch);
  } finally {
    if (seq === state.districtAgentRequestSeq) {
      state.districtDetailView.loading = false;
    }
  }
}

function scheduleDistrictSearch() {
  if (state.districtSearchDebounceTimer) clearTimeout(state.districtSearchDebounceTimer);
  state.districtSearchDebounceTimer = setTimeout(() => {
    loadDistrictAgentsPage({ reset: true }).catch((err) => {
      setAtlasError(mapAgentError(err));
    });
  }, DISTRICT_SEARCH_DEBOUNCE_MS);
}

async function openDistrictDetail(key, opts = {}) {
  if (!key) return;

  const detailPanel = el('atlasDistrictDetail');
  const searchInput = el('atlasDistrictSearch');
  const searchTypeSelect = el('atlasDistrictSearchType');
  if (!detailPanel) return;

  const keyChanged = state.districtDetailView.key !== key;
  const requestedNetwork = normalizeDistrictNetwork(
    opts.preferredNetwork || (keyChanged ? 'mainnet' : state.districtDetailView.network) || 'mainnet'
  );
  if (keyChanged) {
    state.districtDetailView.query = '';
    state.districtDetailView.searchType = 'semantic';
    state.districtDetailView.sort = 'score_desc';
    state.districtDetailView.network = requestedNetwork;
    state.districtAgentListCache.clear();
  } else {
    state.districtDetailView.network = requestedNetwork;
  }
  updateDistrictNetworkSwitch();

  const summaryCacheKey = `${key}|${state.districtDetailView.network}`;
  let payload = state.districtDetailCache.get(summaryCacheKey);
  if (!payload) {
    try {
      const params = new URLSearchParams();
      params.set('network', state.districtDetailView.network);
      payload = await api(`/api/atlas/district/${encodeURIComponent(key)}/summary?${params.toString()}`);
    } catch (err) {
      if (String(err?.message || '') === 'NOT_FOUND') throw new Error('DISTRICT_NOT_FOUND');
      throw err;
    }
    state.districtDetailCache.set(summaryCacheKey, payload);
  }

  const district = payload?.district || null;
  if (!district) throw new Error('DISTRICT_NOT_FOUND');

  state.districtDetailView.key = district.key;
  state.selectedDistrictKey = district.key;
  updateSelectedDistrictCards();

  if (searchInput) searchInput.value = state.districtDetailView.query;
  if (searchTypeSelect) searchTypeSelect.value = state.districtDetailView.searchType;
  renderDistrictSummaryPayload(payload);
  detailPanel.classList.remove('is-hidden');
  setModalOpen(true);
  ensureDistrictAgentsObserver();
  await loadDistrictAgentsPage({ reset: true });

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
    await openDistrictDetail(agent.districtKey, {
      silent: true,
      agent: id,
      preferredNetwork: normalizeDistrictNetwork(agent.networkType)
    });
    agent = state.agentsById.get(id) || agent;
  }

  renderStorefront(agent);
  setUrlState({ district: agent.districtKey || null, agent: id });
}

function initDistrictDetailControls() {
  const searchInput = el('atlasDistrictSearch');
  const searchTypeSelect = el('atlasDistrictSearchType');
  const networkButtons = [...document.querySelectorAll('.atlas-district-network-btn[data-network]')];
  if (!searchInput || !searchTypeSelect || !networkButtons.length) return;
  if (searchInput.dataset.bound === '1') return;
  searchInput.dataset.bound = '1';
  updateDistrictNetworkSwitch();

  searchInput.addEventListener('input', () => {
    state.districtDetailView.query = String(searchInput.value || '');
    scheduleDistrictSearch();
  });
  searchTypeSelect.addEventListener('change', () => {
    state.districtDetailView.searchType = normalizeDistrictSearchType(searchTypeSelect.value);
    scheduleDistrictSearch();
  });

  for (const btn of networkButtons) {
    btn.addEventListener('click', () => {
      const districtKey = state.districtDetailView.key;
      if (!districtKey) return;
      const nextNetwork = normalizeDistrictNetwork(btn.dataset.network);
      if (state.districtDetailView.network === nextNetwork) return;
      state.districtDetailView.network = nextNetwork;
      updateDistrictNetworkSwitch();
      openDistrictDetail(districtKey, {
        silent: true,
        preferredNetwork: nextNetwork
      }).catch((err) => {
        setAtlasError(mapAgentError(err));
      });
    });
  }
}

function initFilters(districts) {
  const search = el('atlasSearch');
  const familySelect = el('atlasChainFamily');
  const searchTypeSelect = el('atlasSearchType');
  const sortFieldSelect = el('atlasSortField');
  const sortDirectionSelect = el('atlasSortDirection');
  const hasWebInput = el('atlasFilterHasWeb');
  const hasMcpInput = el('atlasFilterHasMcp');
  const hasA2aInput = el('atlasFilterHasA2a');
  const activeInput = el('atlasFilterActive');
  const foldout = el('atlasSearchFoldout');
  const foldoutBody = el('atlasSearchFoldoutBody');
  const toggleBtn = el('atlasSearchToggle');
  const summaryEl = el('atlasSearchToggleSummary');
  if (
    !search
    || !familySelect
    || !searchTypeSelect
    || !sortFieldSelect
    || !sortDirectionSelect
    || !hasWebInput
    || !hasMcpInput
    || !hasA2aInput
    || !activeInput
    || !foldout
    || !foldoutBody
    || !toggleBtn
    || !summaryEl
  ) return;

  for (const district of districts) {
    const option = document.createElement('option');
    option.value = district.key;
    option.textContent = district.label;
    familySelect.appendChild(option);
  }

  function collectSearchOpts() {
    return {
      searchType: normalizeSearchType(searchTypeSelect.value),
      sortField: normalizeSortField(sortFieldSelect.value),
      sortDirection: normalizeSortDirection(sortDirectionSelect.value),
      hasWeb: hasWebInput.checked ? true : null,
      hasMcp: hasMcpInput.checked ? true : null,
      hasA2a: hasA2aInput.checked ? true : null,
      active: activeInput.checked ? true : null
    };
  }

  function countActiveSignals(opts) {
    let count = 0;
    if (opts.hasWeb === true) count += 1;
    if (opts.hasMcp === true) count += 1;
    if (opts.hasA2a === true) count += 1;
    if (opts.active === true) count += 1;
    if (opts.searchType !== 'keyword') count += 1;
    if (opts.sortField !== 'relevance') count += 1;
    if (opts.sortDirection !== 'desc') count += 1;
    return count;
  }

  function setFoldoutOpen(open) {
    const isOpen = open === true;
    foldout.classList.toggle('is-collapsed', !isOpen);
    foldoutBody.classList.toggle('is-hidden', !isOpen);
    toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }

  function updateSummary(query, family, opts) {
    const activeSignals = countActiveSignals(opts);
    const parts = [];
    if (query) parts.push(`q: ${query.length > 16 ? `${query.slice(0, 16)}…` : query}`);
    if (family) parts.push(family);
    if (activeSignals > 0) parts.push(`${activeSignals} advanced`);
    summaryEl.textContent = parts.length ? parts.join(' • ') : 'all storefronts';
  }

  const urlParams = new URLSearchParams(window.location.search);
  const initialQuery = urlParams.get('q');
  const initialFamily = urlParams.get('family') || urlParams.get('chainFamily');
  const initialSearchType = normalizeSearchType(urlParams.get('searchType'));
  const initialSortField = normalizeSortField(urlParams.get('sortField'));
  const initialSortDirection = normalizeSortDirection(urlParams.get('sortDirection'));
  const initialHasWeb = parseBoolQueryParam(urlParams.get('hasWeb'));
  const initialHasMcp = parseBoolQueryParam(urlParams.get('hasMcp'));
  const initialHasA2a = parseBoolQueryParam(urlParams.get('hasA2a'));
  const initialActive = parseBoolQueryParam(urlParams.get('active'));

  if (initialQuery) search.value = initialQuery;
  if (initialFamily) familySelect.value = initialFamily;
  searchTypeSelect.value = initialSearchType;
  sortFieldSelect.value = initialSortField;
  sortDirectionSelect.value = initialSortDirection;
  hasWebInput.checked = initialHasWeb === true;
  hasMcpInput.checked = initialHasMcp === true;
  hasA2aInput.checked = initialHasA2a === true;
  activeInput.checked = initialActive === true;

  const hasInitialParams = !!(
    initialQuery
    || initialFamily
    || initialSearchType !== 'keyword'
    || initialSortField !== 'relevance'
    || initialSortDirection !== 'desc'
    || initialHasWeb === true
    || initialHasMcp === true
    || initialHasA2a === true
    || initialActive === true
  );
  setFoldoutOpen(hasInitialParams);

  if (toggleBtn.dataset.bound !== '1') {
    toggleBtn.dataset.bound = '1';
    toggleBtn.addEventListener('click', () => {
      setFoldoutOpen(foldout.classList.contains('is-collapsed'));
    });
  }

  async function rerender() {
    const query = search.value || '';
    const family = familySelect.value || '';
    const opts = collectSearchOpts();
    state.currentQuery = query;
    state.currentFamily = family;
    state.currentSearchOpts = opts;
    updateSummary(query, family, opts);
    clearAtlasError();
    renderDistricts(districts, { query, family });
    try {
      await runSearch(query, family, opts);
    } catch (err) {
      setAtlasError(mapAgentError(err));
    }
  }

  search.addEventListener('input', () => { rerender(); });
  familySelect.addEventListener('change', () => { rerender(); });
  searchTypeSelect.addEventListener('change', () => { rerender(); });
  sortFieldSelect.addEventListener('change', () => { rerender(); });
  sortDirectionSelect.addEventListener('change', () => { rerender(); });
  hasWebInput.addEventListener('change', () => { rerender(); });
  hasMcpInput.addEventListener('change', () => { rerender(); });
  hasA2aInput.addEventListener('change', () => { rerender(); });
  activeInput.addEventListener('change', () => { rerender(); });
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

  initFilters(districts);
  initDistrictDetailControls();

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

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      renderDistricts(state.districts, { query: state.currentQuery, family: state.currentFamily });
    }, 100);
  });
}

init().catch((err) => {
  setAtlasError(`Error: ${err.message || 'UNKNOWN'}`);
});
