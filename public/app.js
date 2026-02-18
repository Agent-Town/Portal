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
    err.data = data;
    throw err;
  }
  return data;
}

function el(id) {
  return document.getElementById(id);
}

function safeSetText(elementId, value, fallback = '') {
  const node = el(elementId);
  if (!node) return null;
  node.textContent = value == null ? fallback : value;
  return node;
}

function readTextContent(elementId, fallback = '') {
  const node = el(elementId);
  return node && typeof node.textContent === 'string' ? node.textContent : fallback;
}

function safeSetClassList(node, className, add) {
  if (!node || !node.classList) return;
  node.classList.toggle(className, add);
}

let appPrivyConfig = null;

let elements = [];
let lastState = null;
let redirecting = false;
const appWalletClient = window.initWalletClient ? window.initWalletClient() : null;
let walletAddr = null;
let walletHouseId = null;
let walletRecovered = false;
const WALLET_STORAGE_KEY = 'agentTownWallet';
const PATH_STORAGE_KEY = 'agentTownStartRole';
const TOKEN_ERROR_KEY = 'agentTownTokenError';
const SIGNUP_COMPLETE_AT_KEY = 'agentTownSignupCompleteAt';
const SHARE_CACHE_KEY = 'agentTownShareCache';
const LEGACY_PATH_STORAGE_KEY = 'agentTownPathMode';
const TOKEN_MINT = 'CZRsbB6BrHsAmGKeoxyfwzCyhttXvhfEukXCWnseBAGS';
const TOWNHALL_IMAGE_MAX_BYTES = 2 * 1024 * 1024;
const TOWNHALL_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const DEFAULT_EVM_ERC8004_IDENTITY_REGISTRY = '0x8004a818bfb912233c491871b3d84c89a494bd9e';
const ERC8004_REGISTER_SELECTOR = '8ea42286';
const ERC721_TRANSFER_TOPIC0 = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const DEFAULT_SOLANA_WEB3_MODULE_URL = 'https://esm.sh/@solana/web3.js@1.98.4?bundle';
const SPONSORED_EVM_TX_TIMEOUT_MS = 180000;
const SPONSORED_EVM_TX_POLL_MS = 1800;
const SOLANA_WEB3_MODULE_FALLBACK_URLS = [
  DEFAULT_SOLANA_WEB3_MODULE_URL,
  'https://cdn.jsdelivr.net/npm/@solana/web3.js@1.98.4/+esm',
  'https://cdn.skypack.dev/@solana/web3.js@1.98.4'
];
// startRole: 'human' | 'coop' | 'agent'
let pathMode = 'coop';
let activeDistrict = 'house';
const districtViews = {
  house: { title: 'Plan Wagons', viewPath: '/views/house.html' },
  townhall: { title: 'Town Hall', viewPath: '/views/townhall.html' },
  saloon: { title: 'Saloon', viewPath: '/views/saloon.html' },
  pony: { title: 'Pony Express', viewPath: '/views/pony.html' },
  leaderboard: { title: 'Town Board', viewPath: '/views/leaderboard.html' }
};
const districtViewCache = new Map();
let currentDistrict = null;
let lastDistrictLoad = 0;
let townBoardPollTimer = null;
let touchPrimedDistrict = null;
let touchPrimedAt = 0;
let suppressDistrictClickUntil = 0;
const TOUCH_PRIME_WINDOW_MS = 1500;
const TOUCH_CLICK_SUPPRESS_MS = 700;
const isTownHub = !!document.getElementById('districtMap') && !!document.getElementById('districtModalBackdrop');
const popupDistrictByPath = {
  '/leaderboard': 'leaderboard',
  '/wall': 'leaderboard',
  '/house': 'house'
};
let pendingTownhallHumanImage = null;
let pendingTownhallAgentImage = null;
let townhallMintConfig = null;
let townhallMintConfigPromise = null;
const townhallModuleCache = new Map();

function b64(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

async function loadPrivyConfigForApp() {
  if (appPrivyConfig !== null) return appPrivyConfig;
  try {
    const resp = await fetch('/api/privy/config', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store'
    });
    if (!resp.ok) {
      appPrivyConfig = { ok: false, enabled: false, appPath: '/app' };
      return appPrivyConfig;
    }
    const payload = await resp.json().catch(() => null);
    const enabled = payload && payload.enabled === true;
    appPrivyConfig = {
      ok: payload?.ok === true,
      enabled,
      appPath: payload?.appPath || '/app'
    };
    return appPrivyConfig;
  } catch {
    appPrivyConfig = { ok: false, enabled: false, appPath: '/app' };
    return appPrivyConfig;
  }
}

async function ensurePrivyAuthenticatedForHub() {
  if (!isTownHub) return true;

  const cfg = await loadPrivyConfigForApp();
  if (!cfg || cfg.enabled !== true) return true;
  if (!appWalletClient) return true;

  try {
    await connectWallet({ silent: true });
  } catch {
    // no-op; wallet actions will surface specific errors when needed.
  }

  updateWalletUI();
  return true;
}


function base58Decode(str) {
  if (!str || typeof str !== 'string') return null;
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let num = 0n;
  for (const ch of str) {
    const idx = alphabet.indexOf(ch);
    if (idx < 0) return null;
    num = num * 58n + BigInt(idx);
  }
  const bytes = [];
  while (num > 0n) {
    bytes.push(Number(num & 0xffn));
    num >>= 8n;
  }
  bytes.reverse();
  let leadingZeros = 0;
  for (let i = 0; i < str.length && str[i] === '1'; i++) leadingZeros++;
  if (leadingZeros) {
    return new Uint8Array(Array(leadingZeros).fill(0).concat(bytes));
  }
  return new Uint8Array(bytes);
}

function normalizeSignatureBytes(sig) {
  if (sig instanceof Uint8Array) return sig;
  if (sig instanceof ArrayBuffer) return new Uint8Array(sig);
  if (ArrayBuffer.isView(sig)) return new Uint8Array(sig.buffer);
  if (Array.isArray(sig)) return new Uint8Array(sig);
  if (typeof sig === 'string') {
    const b58 = base58Decode(sig);
    if (b58 && b58.length === 64) return b58;
    try {
      const bin = atob(sig);
      if (bin.length === 64) return Uint8Array.from(bin, (c) => c.charCodeAt(0));
    } catch {
      // ignore
    }
  }
  return null;
}

function setWalletStatus(msg, isError = false) {
  const elStatus = el('walletStatus');
  if (!elStatus) return;
  if (!msg || !isError) {
    elStatus.textContent = '';
    elStatus.style.display = 'none';
    return;
  }
  elStatus.style.display = 'block';
  elStatus.textContent = msg;
  elStatus.style.color = 'var(--bad)';
}

function updateWalletUI() {
  const btn = el('connectWalletBtn');
  if (btn) {
    btn.textContent = walletAddr ? 'Disconnect wallet' : 'Connect wallet';
    btn.setAttribute('aria-pressed', walletAddr ? 'true' : 'false');
  }
  const addr = el('walletAddr');
  if (addr) addr.textContent = walletAddr || '—';
}

let walletEventBindings = null;
function walletAddressFromEvent(next) {
  if (!next) return null;
  if (typeof next === 'string') return next || null;
  if (next.publicKey && typeof next.publicKey.toString === 'function') {
    const addr = next.publicKey.toString();
    return typeof addr === 'string' && addr ? addr : null;
  }
  if (typeof next.toString === 'function') {
    const addr = next.toString();
    if (typeof addr === 'string' && addr && addr !== '[object Object]') return addr;
  }
  return null;
}

function bindWalletEvents() {
  if (!appWalletClient) return;
  if (walletEventBindings) return;

  const onDisconnect = () => {
    // Wallet disconnected outside the app.
    disconnectWallet({ fromProvider: true })
      .then(() => maybeResetAfterWalletDisconnect())
      .catch(() => {});
  };
  const onAccountChanged = (next) => {
    const nextAddr = walletAddressFromEvent(next);
    if (!nextAddr) {
      disconnectWallet({ fromProvider: true }).catch(() => {});
      return;
    }
    if (walletAddr && walletAddr !== nextAddr) {
      walletAddr = nextAddr;
      walletHouseId = null;
      walletRecovered = false;
      updateWalletUI();
      saveWalletCache();
      if (lastState) updateUI(lastState);
    }
  };

  appWalletClient.on('disconnect', onDisconnect);
  appWalletClient.on('accountChanged', onAccountChanged);
  walletEventBindings = { onDisconnect, onAccountChanged };
}

function unbindWalletEvents() {
  if (!walletEventBindings) return;
  const { onDisconnect, onAccountChanged } = walletEventBindings;
  if (appWalletClient) {
    appWalletClient.off('disconnect', onDisconnect);
    appWalletClient.off('accountChanged', onAccountChanged);
  }
  walletEventBindings = null;
}

function loadWalletCache() {
  try {
    const raw = localStorage.getItem(WALLET_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data.address !== 'string') return null;
    return data;
  } catch {
    return null;
  }
}

function saveWalletCache() {
  try {
    if (!walletAddr) {
      localStorage.removeItem(WALLET_STORAGE_KEY);
      return;
    }
    const payload = {
      address: walletAddr,
      houseId: walletHouseId || null
    };
    localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage errors
  }
}

function clearWalletCache() {
  try {
    localStorage.removeItem(WALLET_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}

function loadPathMode() {
  try {
    const raw = localStorage.getItem(PATH_STORAGE_KEY);
    return raw === 'human' || raw === 'coop' || raw === 'agent' ? raw : 'coop';
  } catch {
    return 'coop';
  }
}

function savePathMode(mode) {
  try {
    localStorage.setItem(PATH_STORAGE_KEY, mode);
  } catch {
    // ignore storage errors
  }
}

function loadTokenError() {
  try {
    const msg = localStorage.getItem(TOKEN_ERROR_KEY);
    if (msg) localStorage.removeItem(TOKEN_ERROR_KEY);
    return msg || null;
  } catch {
    return null;
  }
}

function setTokenError(msg) {
  const tokenError = el('tokenError');
  if (tokenError) tokenError.textContent = msg || '';
}

function updatePathButtons() {
  const humanBtn = el('pathHumanBtn');
  const coopBtn = el('pathCoopBtn');
  const agentBtn = el('pathAgentBtn');
  if (humanBtn) {
    const active = pathMode === 'human';
    humanBtn.classList.toggle('primary', active);
    humanBtn.setAttribute('aria-pressed', active ? 'true' : 'false');
  }
  if (coopBtn) {
    const active = pathMode === 'coop';
    coopBtn.classList.toggle('primary', active);
    coopBtn.setAttribute('aria-pressed', active ? 'true' : 'false');
  }
  if (agentBtn) {
    const active = pathMode === 'agent';
    agentBtn.classList.toggle('primary', active);
    agentBtn.setAttribute('aria-pressed', active ? 'true' : 'false');
  }
}

function setPathMode(mode, { persist = true, refresh = true } = {}) {
  const next = mode === 'human' || mode === 'agent' || mode === 'coop' ? mode : 'coop';
  pathMode = next;
  if (persist) savePathMode(next);
  updatePathButtons();
  if (refresh && lastState) updateUI(lastState);
}

function onboardingRequired(state) {
  return !!state?.onboarding?.required;
}

function isTownhallRegistrationComplete(state) {
  return !!state?.onboarding?.registrationComplete;
}

function isTownhallGateLocked(state) {
  if (!isTownHub) return false;
  if (!state) return false;
  const hasHouse = !!(state.houseId || walletHouseId);
  return onboardingRequired(state) && !hasHouse;
}

function canUseTownhallSigilFlow(state) {
  if (!onboardingRequired(state)) return true;
  if (state?.houseId || walletHouseId) return true;
  return isTownhallRegistrationComplete(state);
}

function applyDistrictHotspotLocks(state) {
  if (!isTownHub) return;
  const gateLocked = isTownhallGateLocked(state);
  document.querySelectorAll('.townDistrictHotspot[data-district]').forEach((hotspot) => {
    const district = normalizeDistrict(hotspot.getAttribute('data-district') || 'house');
    const blocked = gateLocked && district !== 'townhall';
    hotspot.classList.toggle('is-locked', blocked);
    hotspot.setAttribute('aria-disabled', blocked ? 'true' : 'false');
  });
}

function districtStatusText(district) {
  if (isTownhallGateLocked(lastState)) {
    if (district === 'townhall') return 'Town Hall is required until you complete onboarding and generate a house.';
    return 'Locked: finish Town Hall onboarding first.';
  }
  if (!district) return 'Select a district on the map.';
  if (district === 'townhall') return 'Town Hall selected: identity, ceremony, and picture management.';
  if (district === 'saloon') return 'Saloon selected: reserved for future menu content.';
  if (district === 'pony') return 'Pony Express selected: inbox and message routing.';
  if (district === 'leaderboard') return 'Town Board selected: public rankings and team snapshots.';
  return 'Plan Wagons selected: unlock and enter your house flow.';
}

function setActiveDistrict(district) {
  const next = district === 'townhall' || district === 'saloon' || district === 'pony' || district === 'leaderboard' || district === 'house'
    ? district
    : null;
  activeDistrict = next;

  document.querySelectorAll('.townDistrictHotspot[data-district]').forEach((hotspot) => {
    const isActive = hotspot.getAttribute('data-district') === next;
    hotspot.classList.toggle('is-active', isActive);
    hotspot.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });

  const status = el('townSceneStatus');
  if (status) status.textContent = districtStatusText(next);
}

function normalizeDistrict(district) {
  return district === 'townhall' || district === 'saloon' || district === 'pony' || district === 'leaderboard' || district === 'house'
    ? district
    : 'house';
}

function clearTouchDistrictPrime() {
  touchPrimedDistrict = null;
  touchPrimedAt = 0;
}

function clearDistrictSelection() {
  clearTouchDistrictPrime();
  setActiveDistrict(null);
}

function bindDistrictMapInteractions() {
  if (!isTownHub) return;

  const hotspots = document.querySelectorAll('.townDistrictHotspot[data-district]');
  hotspots.forEach((hotspot) => {
    const district = normalizeDistrict(hotspot.getAttribute('data-district') || 'house');

    hotspot.addEventListener('pointerenter', (ev) => {
      if (ev.pointerType === 'touch') return;
      hotspot.classList.add('is-hovered');
    });

    hotspot.addEventListener('pointerleave', () => {
      hotspot.classList.remove('is-hovered');
    });

    hotspot.addEventListener('pointerdown', (ev) => {
      if (ev.pointerType !== 'touch') {
        clearTouchDistrictPrime();
        return;
      }

      if (isTownhallGateLocked(lastState) && district !== 'townhall') {
        setActiveDistrict('townhall');
        ev.preventDefault();
        return;
      }

      suppressDistrictClickUntil = Date.now() + TOUCH_CLICK_SUPPRESS_MS;
      const now = Date.now();
      const isSecondTap = touchPrimedDistrict === district && (now - touchPrimedAt) <= TOUCH_PRIME_WINDOW_MS;

      if (isSecondTap) {
        clearTouchDistrictPrime();
        ev.preventDefault();
        showDistrict(district);
        return;
      }

      touchPrimedDistrict = district;
      touchPrimedAt = now;
      setActiveDistrict(district);
      ev.preventDefault();
    });

    hotspot.addEventListener('click', () => {
      if (isTownhallGateLocked(lastState) && district !== 'townhall') {
        setActiveDistrict('townhall');
        return;
      }
      if (Date.now() <= suppressDistrictClickUntil) {
        return;
      }
      clearTouchDistrictPrime();
      showDistrict(district);
    });
  });

  document.addEventListener('pointerdown', (ev) => {
    if (isTownhallGateLocked(lastState)) return;
    const districtHotspot = ev.target && ev.target.closest ? ev.target.closest('.townDistrictHotspot[data-district]') : null;
    if (!districtHotspot) {
      clearDistrictSelection();
    }
  });
}

function clearTownBoardPoll() {
  if (townBoardPollTimer) {
    clearTimeout(townBoardPollTimer);
    townBoardPollTimer = null;
  }
}

function formatPublicHandle(value) {
  if (!value) return '—';
  const trimmed = String(value).trim();
  if (!trimmed) return '—';
  return trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
}

function renderTownBoard(data) {
  const signups = el('townBoardSignups');
  const teams = el('townBoardTeams');
  const referrals = el('townBoardReferrals');
  const list = el('townBoardList');
  const empty = el('townBoardEmpty');
  if (!signups || !teams || !referrals || !list || !empty) return;

  signups.textContent = String(data?.signups ?? '—');
  teams.textContent = String((data?.teams || []).length);
  referrals.textContent = String(data?.referralsTotal ?? '—');

  const publicTeams = Array.isArray(data?.teams) ? data.teams : [];
  list.innerHTML = '';

  if (!publicTeams.length) {
    empty.classList.remove('is-hidden');
    return;
  }

  empty.classList.add('is-hidden');
  publicTeams.forEach((team) => {
    const card = document.createElement('div');
    card.className = 'card';
    const title = document.createElement('div');
    const heading = document.createElement('strong');
    heading.textContent = `Team ${team.shareId || '—'}`;
    title.appendChild(heading);
    card.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.appendChild(document.createTextNode(`Referrals: ${team.referrals || 0}`));
    if (team.createdAt) {
      meta.appendChild(document.createTextNode(` • Created: ${team.createdAt}`));
    }
    if (team.humanHandle || team.agentName || team.publicMedia?.prompt) {
      meta.appendChild(document.createTextNode(' • '));
      const human = team.humanHandle ? formatPublicHandle(team.humanHandle) : '';
      const agent = team.agentName ? `agent: ${team.agentName}` : '';
      const parts = [];
      if (human) parts.push(`human: ${human}`);
      if (agent) parts.push(agent);
      const label = parts.length ? parts.join(' • ') : '';
      meta.appendChild(document.createTextNode(label || ''));
    }
    card.appendChild(meta);

    if (team.publicMedia?.imageUrl) {
      const media = document.createElement('div');
      media.className = 'public-media';
      const img = document.createElement('img');
      img.src = team.publicMedia.imageUrl;
      img.alt = team.publicMedia.prompt ? `Public image: ${team.publicMedia.prompt}` : 'Public house image';
      img.loading = 'lazy';
      media.appendChild(img);
      if (team.publicMedia.prompt) {
        const caption = document.createElement('div');
        caption.className = 'small';
        caption.textContent = team.publicMedia.prompt;
        media.appendChild(caption);
      }
      card.appendChild(media);
    }

    const links = document.createElement('div');
    links.className = 'kv';

    const share = document.createElement('a');
    share.className = 'btn';
    if (team.shareId) {
      share.href = `/s/${team.shareId}`;
      share.textContent = 'Open share';
    } else {
      share.textContent = 'Share unavailable';
      share.href = '#';
      share.classList.add('is-hidden');
    }
    links.appendChild(share);

    if (team.publicMedia?.imageUrl && team.shareId) {
      const mediaBtn = document.createElement('a');
      mediaBtn.className = 'btn';
      mediaBtn.href = `/s/${team.shareId}`;
      mediaBtn.textContent = 'View public media';
      links.appendChild(mediaBtn);
    }
    card.appendChild(links);
    list.appendChild(card);
  });
}

function scheduleTownBoardPoll() {
  clearTownBoardPoll();
  const loadOnce = async () => {
    if (currentDistrict !== 'leaderboard' || !isTownHub) return;
    try {
      const data = await api('/api/leaderboard');
      if (currentDistrict === 'leaderboard') {
        renderTownBoard(data);
      }
    } catch {
      // ignore polling failures
    }
    if (currentDistrict === 'leaderboard') {
      townBoardPollTimer = setTimeout(loadOnce, 2000);
    }
  };
  loadOnce();
}

function setModalBusy(isBusy) {
  const body = el('districtModalBody');
  if (!body) return;
  safeSetClassList(body, 'is-loading', isBusy);
}

async function loadDistrictView(district) {
  const safeDistrict = normalizeDistrict(district);
  if (!districtViewCache.has(safeDistrict)) {
    const source = districtViews[safeDistrict]?.viewPath;
    if (!source) {
      throw new Error(`Missing view for district: ${safeDistrict}`);
    }
    const resp = await fetch(source);
    if (!resp.ok) {
      throw new Error(`HTTP_${resp.status}`);
    }
    const text = await resp.text();
    districtViewCache.set(safeDistrict, text);
  }
  return districtViewCache.get(safeDistrict);
}

const townhallDraftFieldIds = [
  'townhallHumanName',
  'townhallAgentName',
  'townhallHumanPrompt',
  'townhallAgentPrompt'
];

const townhallMintSteps = [
  { key: 'userEvm', role: 'user', chain: 'evm', statusId: 'townhallMintUserEvmStatus' },
  { key: 'userSolana', role: 'user', chain: 'solana', statusId: 'townhallMintUserSolanaStatus' },
  { key: 'agentEvm', role: 'agent', chain: 'evm', statusId: 'townhallMintAgentEvmStatus' },
  { key: 'agentSolana', role: 'agent', chain: 'solana', statusId: 'townhallMintAgentSolanaStatus' }
];

function createEmptyTownhallMintDraft() {
  return {
    user: {
      evm: { id: '', chain: 'sepolia', txHash: '' },
      solana: { id: '', cluster: 'devnet', txSig: '' }
    },
    agent: {
      evm: { id: '', chain: 'sepolia', txHash: '' },
      solana: { id: '', cluster: 'devnet', txSig: '' }
    }
  };
}

function cloneTownhallMintDraft(value) {
  if (!value || typeof value !== 'object') return createEmptyTownhallMintDraft();
  return JSON.parse(JSON.stringify(value));
}

function normalizeTownhallMintDraftFromOnboarding(onboarding) {
  const out = createEmptyTownhallMintDraft();
  const erc = onboarding?.erc8004 && typeof onboarding.erc8004 === 'object' ? onboarding.erc8004 : {};
  const userEvm = erc?.user?.evm && typeof erc.user.evm === 'object' ? erc.user.evm : {};
  const userSolana = erc?.user?.solana && typeof erc.user.solana === 'object' ? erc.user.solana : {};
  const agentEvm = erc?.agent?.evm && typeof erc.agent.evm === 'object' ? erc.agent.evm : {};
  const agentSolana = erc?.agent?.solana && typeof erc.agent.solana === 'object' ? erc.agent.solana : {};

  out.user.evm.id = typeof userEvm.id === 'string' ? userEvm.id : '';
  out.user.evm.chain = typeof userEvm.chain === 'string' && userEvm.chain.trim() ? userEvm.chain : 'sepolia';
  out.user.evm.txHash = typeof userEvm.txHash === 'string' ? userEvm.txHash : '';
  out.user.solana.id = typeof userSolana.id === 'string' ? userSolana.id : '';
  out.user.solana.cluster = typeof userSolana.cluster === 'string' && userSolana.cluster.trim()
    ? userSolana.cluster
    : 'devnet';
  out.user.solana.txSig = typeof userSolana.txSig === 'string' ? userSolana.txSig : '';

  out.agent.evm.id = typeof agentEvm.id === 'string' ? agentEvm.id : '';
  out.agent.evm.chain = typeof agentEvm.chain === 'string' && agentEvm.chain.trim()
    ? agentEvm.chain
    : 'sepolia';
  out.agent.evm.txHash = typeof agentEvm.txHash === 'string' ? agentEvm.txHash : '';

  out.agent.solana.id = typeof agentSolana.id === 'string' ? agentSolana.id : '';
  out.agent.solana.cluster = typeof agentSolana.cluster === 'string' && agentSolana.cluster.trim()
    ? agentSolana.cluster
    : 'devnet';
  out.agent.solana.txSig = typeof agentSolana.txSig === 'string' ? agentSolana.txSig : '';

  return out;
}

function hasTownhallMintIdentity(draft, role, chain) {
  if (!draft || typeof draft !== 'object') return false;
  const id = draft?.[role]?.[chain]?.id;
  return typeof id === 'string' && !!id.trim();
}

function setTownhallMintStepStatus(step, kind) {
  const node = el(step.statusId);
  if (!node) return;
  if (kind === 'running') {
    node.textContent = 'Registering...';
    node.style.color = 'var(--accent)';
    return;
  }
  if (kind === 'done') {
    node.textContent = 'Done ✓';
    node.style.color = 'var(--good)';
    return;
  }
  if (kind === 'error') {
    node.textContent = 'Failed';
    node.style.color = 'var(--bad)';
    return;
  }
  node.textContent = 'Pending';
  node.style.color = 'var(--muted)';
}

function syncTownhallMintChecklist(draft, { activeStep = null, errorStep = null } = {}) {
  const safeDraft = draft && typeof draft === 'object' ? draft : createEmptyTownhallMintDraft();
  for (const step of townhallMintSteps) {
    if (errorStep && step.key === errorStep) {
      setTownhallMintStepStatus(step, 'error');
      continue;
    }
    if (activeStep && step.key === activeStep) {
      setTownhallMintStepStatus(step, 'running');
      continue;
    }
    setTownhallMintStepStatus(step, hasTownhallMintIdentity(safeDraft, step.role, step.chain) ? 'done' : 'pending');
  }
}

let townhallMintDraft = createEmptyTownhallMintDraft();
let townhallMintDraftDirty = false;
let townhallMintInFlight = false;
let townhallMintLastErrorStep = null;
let townhallStoryStep = 'human';
let townhallHumanCustomizeOpen = false;
let townhallAgentCustomizeOpen = false;
let townhallAwaitingContinue = false;
let townhallSigilUnlockedByContinue = false;

function setTownhallStoryStep(step) {
  const next = step === 'agent' || step === 'processing' ? step : 'human';
  townhallStoryStep = next;
  const humanStep = el('townhallStepHuman');
  const agentStep = el('townhallStepAgent');
  const processingStep = el('townhallStepProcessing');
  if (humanStep) humanStep.classList.toggle('is-hidden', next !== 'human');
  if (agentStep) agentStep.classList.toggle('is-hidden', next !== 'agent');
  if (processingStep) processingStep.classList.toggle('is-hidden', next !== 'processing');
}

function setTownhallCustomizeOpen(kind, open) {
  const isHuman = kind === 'human';
  const panel = el(isHuman ? 'townhallHumanCustomize' : 'townhallAgentCustomize');
  const btn = el(isHuman ? 'townhallHumanCustomizeBtn' : 'townhallAgentCustomizeBtn');
  if (panel) panel.classList.toggle('is-hidden', !open);
  if (btn) {
    btn.textContent = open ? 'Hide customization' : 'Customize';
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  if (isHuman) {
    townhallHumanCustomizeOpen = open;
  } else {
    townhallAgentCustomizeOpen = open;
  }
}

function getTownhallDraftFieldNodes() {
  return townhallDraftFieldIds
    .map((id) => el(id))
    .filter(Boolean);
}

function markTownhallFieldDirty(inputEl) {
  if (!inputEl || !inputEl.dataset) return;
  inputEl.dataset.townhallDirty = '1';
}

function clearTownhallDraftDirtyFlags() {
  for (const input of getTownhallDraftFieldNodes()) {
    input.dataset.townhallDirty = '0';
  }
}

function bindTownhallDraftField(inputEl) {
  if (!inputEl || inputEl.dataset.townhallDraftBound === '1') return;
  inputEl.dataset.townhallDraftBound = '1';
  const markDirty = () => markTownhallFieldDirty(inputEl);
  inputEl.addEventListener('input', markDirty);
  inputEl.addEventListener('change', markDirty);
}

function syncTownhallInputValue(inputEl, nextValue) {
  if (!inputEl) return;
  const isFocused = document.activeElement === inputEl;
  const isDirty = inputEl.dataset.townhallDirty === '1';
  if (!isFocused && !isDirty) {
    const normalized = nextValue == null ? '' : String(nextValue);
    if (inputEl.value !== normalized) inputEl.value = normalized;
    inputEl.dataset.townhallDirty = '0';
  }
}

function normalizeTownhallMintConfig(payload) {
  const mint = payload?.mint && typeof payload.mint === 'object' ? payload.mint : {};
  const evm = mint.evm && typeof mint.evm === 'object' ? mint.evm : {};
  const solana = mint.solana && typeof mint.solana === 'object' ? mint.solana : {};
  const chainId = Number(evm.chainId || 11155111);
  const contractAddress = normalizeEvmAddress(evm.contractAddress || DEFAULT_EVM_ERC8004_IDENTITY_REGISTRY);
  return {
    enabled: mint.enabled === true,
    pinataEnabled: mint.pinataEnabled === true,
    evm: {
      enabled: evm.enabled === true,
      chainId: Number.isFinite(chainId) && chainId > 0 ? Math.floor(chainId) : 11155111,
      network: typeof evm.network === 'string' && evm.network.trim() ? evm.network.trim() : 'sepolia',
      rpcUrl: typeof evm.rpcUrl === 'string' && evm.rpcUrl.trim() ? evm.rpcUrl.trim() : '',
      contractAddress: contractAddress || DEFAULT_EVM_ERC8004_IDENTITY_REGISTRY
    },
    solana: {
      enabled: solana.enabled === true,
      cluster: typeof solana.cluster === 'string' && solana.cluster.trim() ? solana.cluster.trim() : 'devnet',
      rpcUrl: typeof solana.rpcUrl === 'string' && solana.rpcUrl.trim() ? solana.rpcUrl.trim() : 'https://api.devnet.solana.com',
      web3ModuleUrl: typeof solana.web3ModuleUrl === 'string' && solana.web3ModuleUrl.trim()
        ? solana.web3ModuleUrl.trim()
        : DEFAULT_SOLANA_WEB3_MODULE_URL,
      sponsorSendEnabled: solana.sponsorSendEnabled === true,
      sponsorFeePayer: typeof solana.sponsorFeePayer === 'string' && solana.sponsorFeePayer.trim()
        ? solana.sponsorFeePayer.trim()
        : null,
      sponsorSendError: typeof solana.sponsorSendError === 'string' && solana.sponsorSendError.trim()
        ? solana.sponsorSendError.trim()
        : null
    }
  };
}

function fallbackTownhallMintConfig() {
  return normalizeTownhallMintConfig({ mint: {} });
}

async function ensureTownhallMintConfig({ force = false } = {}) {
  if (!force && townhallMintConfig) return townhallMintConfig;
  if (!force && townhallMintConfigPromise) return townhallMintConfigPromise;

  townhallMintConfigPromise = api('/api/townhall/mint/config')
    .then((resp) => {
      townhallMintConfig = normalizeTownhallMintConfig(resp);
      return townhallMintConfig;
    })
    .catch(() => {
      townhallMintConfig = fallbackTownhallMintConfig();
      return townhallMintConfig;
    })
    .finally(() => {
      townhallMintConfigPromise = null;
    });
  return townhallMintConfigPromise;
}

function applyTownhallMintConfig(config) {
  const cfg = config || fallbackTownhallMintConfig();
  const registerBtn = el('townhallRegisterBtn');
  const allChainsReady = cfg.evm.enabled && cfg.solana.enabled;
  if (registerBtn) {
    registerBtn.disabled = townhallMintInFlight || !allChainsReady;
    registerBtn.title = allChainsReady ? '' : 'Both Sepolia and Solana mint must be configured.';
    registerBtn.textContent = townhallMintInFlight ? 'Processing registration...' : 'Retry registration';
  }
  const continueBtn = el('townhallContinueBtn');
  if (continueBtn && townhallMintInFlight) continueBtn.disabled = true;
}

function collectTownhallProfilePayload() {
  const payload = {
    humanName: (el('townhallHumanName')?.value || '').trim(),
    agentName: (el('townhallAgentName')?.value || '').trim(),
    humanAvatar: {
      prompt: (el('townhallHumanPrompt')?.value || '').trim()
    },
    agentAvatar: {
      prompt: (el('townhallAgentPrompt')?.value || '').trim()
    }
  };
  if (pendingTownhallHumanImage) payload.humanAvatar.image = pendingTownhallHumanImage;
  if (pendingTownhallAgentImage) payload.agentAvatar.image = pendingTownhallAgentImage;
  return payload;
}

function knownMintErrorMessage(err, chain = 'evm') {
  const code = String(err?.message || err || '').trim();
  if (!code) return chain === 'evm' ? 'Sepolia mint failed.' : 'Solana mint failed.';
  const lowerCode = code.toLowerCase();
  if (
    lowerCode.includes('wallet proxy not initialized')
    || lowerCode.includes('embedded_wallet_proxy_not_initialized')
    || lowerCode.includes('wallet_proxy_not_initialized')
  ) {
    return 'Privy embedded wallet proxy did not initialize. Check third-party cookie blocking and Privy app origin allowlist, then retry.';
  }
  if (code === 'MINT_ALL_CHAINS_NOT_ENABLED') return 'Both Sepolia and Solana mint must be configured on this server.';
  if (code === 'INVALID_MINT_SUBJECT') return 'Mint subject is invalid. Please refresh and try again.';
  if (code === 'MINT_DISABLED') return 'Live mint is disabled on this server.';
  if (code === 'PINATA_NOT_CONFIGURED') return 'Server is missing Pinata configuration.';
  if (code === 'PINATA_UPLOAD_FAILED') {
    const detailRaw = String(err?.data?.detail || err?.detail || '').trim();
    const detail = detailRaw.toUpperCase();
    if (detail.includes('NO_SCOPES_FOUND')) {
      return 'Pinata JWT is missing required pinning scopes. Update PINATA_JWT permissions.';
    }
    if (detail.includes('UNAUTHORIZED') || detail.includes('FORBIDDEN') || err?.status === 401 || err?.status === 403) {
      return 'Pinata rejected the JWT. Verify PINATA_JWT permissions and retry.';
    }
    return detailRaw ? `IPFS upload failed: ${detailRaw}` : 'IPFS upload failed on the server.';
  }
  if (code === 'MINT_EVM_NOT_CONFIGURED') return 'Sepolia mint is not configured on this server.';
  if (code === 'MINT_SOLANA_NOT_CONFIGURED') return 'Solana mint is not configured on this server.';
  if (code === 'MINT_EVM_CONTRACT_NOT_CONFIGURED') return 'Sepolia ERC-8004 contract address is not configured on this server.';
  if (code === 'INVALID_EVM_ADDRESS') return 'Privy EVM wallet address is invalid.';
  if (code === 'MISSING_HUMAN_NAME') return 'Enter your human name first.';
  if (code === 'MISSING_AGENT_NAME') return 'Enter your agent name first.';
  if (code === 'MISSING_HUMAN_AVATAR_PROMPT') return 'Add the exact human image prompt first.';
  if (code === 'MISSING_AGENT_AVATAR_PROMPT') return 'Add the exact agent image prompt first.';
  if (code === 'INVALID_TOWNHALL_IMAGE' || code === 'TOWNHALL_IMAGE_TOO_LARGE') {
    return 'Avatar image must be PNG/JPG/WebP and up to 2 MB.';
  }
  if (code === 'NO_EVM_WALLET' || code === 'NO_EVM_ACCOUNT') return 'Connect your Privy EVM wallet first.';
  if (code === 'NO_EVM_PROVIDER') return 'Could not access the Privy EVM provider.';
  if (code === 'EVM_CHAIN_SWITCH_FAILED') return 'Switch to Sepolia in Privy wallet and retry.';
  if (code === 'EVM_ACCOUNT_MISMATCH') return 'Privy EVM signer mismatch. Reconnect wallet and retry.';
  if (code === 'NO_SOLANA_WALLET' || code === 'NO_SOLANA_PUBKEY') return 'Connect your Privy Solana wallet first.';
  if (code === 'MISSING_SOLANA_ADDRESS') return 'Connect your Solana wallet first.';
  if (code === 'MISSING_SOLANA_ASSET_PUBKEY') return 'Could not prepare Solana asset key.';
  if (code === 'INVALID_SOLANA_ASSET_PUBKEY') return 'Solana asset key is invalid.';
  if (code === 'SOLANA_SIGNER_MISMATCH') return 'Prepared Solana signer does not match your connected wallet.';
  if (code === 'SOLANA_PREPARE_SIGNED') return 'Prepared Solana tx must be unsigned; refusing to send.';
  if (code === 'SOLANA_PREPARE_FAILED') {
    const detailRaw = String(err?.detail || err?.data?.detail || '').trim();
    return detailRaw ? `Could not prepare Solana mint transaction: ${detailRaw}` : 'Could not prepare Solana mint transaction.';
  }
  if (code === 'SOLANA_SPONSOR_NOT_CONFIGURED') {
    return 'Server-side Solana sponsorship is not configured. Add SOLANA_ERC8004_FEE_PAYER_SECRET on the server.';
  }
  if (code === 'SOLANA_SPONSOR_SECRET_INVALID') {
    return 'Server-side Solana sponsor key is invalid. Fix SOLANA_ERC8004_FEE_PAYER_SECRET and retry.';
  }
  if (code === 'INVALID_SOLANA_SPONSORED_TX') return 'Could not build the Solana sponsored transaction payload.';
  if (code === 'SOLANA_SPONSORED_WALLET_SIGNATURE_MISSING') {
    return 'Privy wallet signature was missing on the Solana transaction.';
  }
  if (code === 'SOLANA_SPONSORED_ASSET_SIGNATURE_MISSING') {
    return 'Asset signature was missing on the Solana transaction.';
  }
  if (code === 'SOLANA_SPONSORED_TX_NOT_PREPARED') {
    const detailRaw = String(err?.detail || err?.data?.detail || '').trim();
    return detailRaw
      ? `Solana sponsored transaction did not match the latest prepared registration. ${detailRaw}`
      : 'Solana sponsored transaction did not match the latest prepared registration. Retry registration.';
  }
  if (code === 'SOLANA_SPONSORED_FEEPAYER_NOT_SIGNER') {
    const detailRaw = String(err?.detail || err?.data?.detail || '').trim();
    return detailRaw || 'Prepared Solana transaction is missing the sponsor fee payer signer.';
  }
  if (code === 'SOLANA_SPONSOR_FEEPAYER_MATCHES_WALLET') {
    return 'Server sponsor fee payer is set to the user wallet. Configure a separate funded devnet fee payer key.';
  }
  if (code === 'SOLANA_SPONSOR_FEEPAYER_UNFUNDED') {
    const detailRaw = String(err?.detail || err?.data?.detail || '').trim();
    return detailRaw || 'Server sponsor fee payer does not have enough SOL to sponsor this Solana registration.';
  }
  if (code === 'SOLANA_SPONSORED_OWNER_UNFUNDED') {
    const detailRaw = String(err?.detail || err?.data?.detail || '').trim();
    return detailRaw || 'User Solana wallet needs temporary lamports for account creation and sponsor top-up failed.';
  }
  if (code === 'SOLANA_SIGN_TX_UNSUPPORTED') {
    return 'This Privy Solana wallet cannot sign transactions in the current session.';
  }
  if (code === 'SOLANA_SPONSOR_SEND_FAILED') {
    const detailRaw = String(err?.detail || err?.data?.detail || '').trim();
    return detailRaw ? `Solana sponsored send failed: ${detailRaw}` : 'Solana sponsored send failed.';
  }
  if (code === 'SOLANA_WEB3_UNAVAILABLE') return 'Solana web3 module could not be loaded.';
  if (code === 'SOLANA_TX_SEND_FAILED' || code === 'SOLANA_TX_SEND_UNSUPPORTED') {
    return 'Could not sign/send the Solana transaction with Privy wallet.';
  }
  if (code === 'MINT_EVM_FAILED') return 'Could not prepare Sepolia mint transaction.';
  if (code === 'PRIVY_SOLANA_SPONSORED_TX_UNAVAILABLE') {
    return 'Privy sponsored Solana send is unavailable for this wallet/session. Check Privy gas sponsorship settings for Solana Devnet.';
  }
  if (code === 'PRIVY_SPONSORED_TX_UNAVAILABLE') {
    return 'Privy sponsored Sepolia send is unavailable for this wallet/session. Check Privy gas sponsorship settings.';
  }
  if (code === 'INVALID_PRIVY_WALLET_ID') {
    return chain === 'solana'
      ? 'Could not determine the Privy wallet id for sponsored Solana send.'
      : 'Could not determine the Privy wallet id for sponsored Sepolia send.';
  }
  if (code === 'PRIVY_WALLET_RPC_SIGN_UNAVAILABLE') {
    return chain === 'solana'
      ? 'Privy signer is unavailable for sponsored Solana send.'
      : 'Privy signer is unavailable for sponsored Sepolia send.';
  }
  if (code === 'PRIVY_WALLET_RPC_SIGNING_PAYLOAD_MISSING') {
    return 'Server did not return a valid sponsored transaction payload.';
  }
  if (code === 'PRIVY_WALLET_RPC_SIGN_FAILED') {
    const detail = String(err?.detail || err?.cause?.message || '').trim();
    if (chain === 'solana') {
      return detail
        ? `Privy could not authorize the sponsored Solana transaction: ${detail}`
        : 'Privy could not authorize the sponsored Solana transaction.';
    }
    return detail
      ? `Privy could not authorize the sponsored Sepolia transaction: ${detail}`
      : 'Privy could not authorize the sponsored Sepolia transaction.';
  }
  if (code === 'PRIVY_WALLET_RPC_RELAY_FAILED') {
    const detailRaw = String(err?.detail || err?.data?.detail || '').trim();
    const detail = detailRaw.toLowerCase();
    if (detail.includes('does not support the method')) {
      return chain === 'solana'
        ? 'This Privy wallet cannot run sponsored Solana signAndSendTransaction in the current execution mode.'
        : 'This Privy wallet cannot run sponsored eth_sendTransaction in the current execution mode.';
    }
    if (
      detail.includes('insufficient funds')
      || detail.includes('exceeds the balance of the account')
      || detail.includes('total cost (gas * gas fee + value)')
    ) {
      return chain === 'solana'
        ? 'Privy gas sponsorship did not apply; this Solana wallet has insufficient SOL.'
        : 'Privy gas sponsorship did not apply; this Sepolia wallet has insufficient ETH.';
    }
    return detailRaw ? `Privy sponsorship relay failed: ${detailRaw}` : 'Privy sponsorship relay failed.';
  }
  if (code.startsWith('INVALID_PRIVY_WALLET_RPC_')) {
    return chain === 'solana'
      ? 'Sponsored Solana transaction payload is invalid.'
      : 'Sponsored Sepolia transaction payload is invalid.';
  }
  if (code === 'PRIVY_SOLANA_SPONSORED_TX_NO_RESULT') {
    return 'Privy sponsored Solana send did not return a transaction handle. Retry once.';
  }
  if (code === 'PRIVY_SPONSORED_TX_NO_RESULT') {
    return 'Privy sponsored Sepolia send did not return a transaction handle. Retry once.';
  }
  if (code === 'MINT_EVM_SPONSORED_NO_HANDLE') {
    return 'Privy sponsored Sepolia transaction handle was missing.';
  }
  if (code === 'PRIVY_SERVER_AUTH_NOT_CONFIGURED') {
    return 'Server is missing PRIVY_APP_SECRET to track sponsored Sepolia transactions.';
  }
  if (code === 'PRIVY_TRANSACTION_STATUS_UNAVAILABLE') {
    return 'Could not read Privy sponsored transaction status.';
  }
  if (code === 'MINT_EVM_SPONSORED_FAILED') {
    return 'Privy sponsored Sepolia transaction failed before confirmation.';
  }
  if (code === 'MINT_EVM_SPONSORED_TIMEOUT') {
    return 'Privy sponsored Sepolia transaction timed out before confirmation.';
  }
  if (code === 'MINT_EVM_REVERTED') return 'Sepolia registration transaction reverted on-chain.';
  if (code === 'MINT_EVM_RECEIPT_TIMEOUT') return 'Sepolia registration transaction timed out before confirmation.';
  if (code === 'MINT_EVM_NO_AGENT_ID') return 'Sepolia tx succeeded but no ERC-8004 ID was returned.';
  if (code === 'MINT_SOLANA_NO_SIGNATURE') return 'Solana tx sent but no signature was returned.';
  const lower = code.toLowerCase();
  if (
    lower.includes('attempt to debit an account but found no record of a prior credit')
    || lower.includes('did not pass signature verification')
  ) {
    return 'Solana registration failed before execution. Confirm Privy Solana Devnet gas sponsorship is enabled and retry.';
  }
  if (
    lower.includes('insufficient funds')
    || lower.includes('exceeds the balance of the account')
    || lower.includes('total cost (gas * gas fee + value)')
  ) {
    return 'Sepolia wallet has insufficient ETH for gas. Fund this Privy EVM wallet via a Sepolia faucet, or enable Privy gas sponsorship for this execution path.';
  }
  if (lower.includes('user rejected') || lower.includes('rejected') || lower.includes('denied')) {
    return 'Wallet action was rejected.';
  }
  return chain === 'evm' ? `Sepolia mint failed: ${code}` : `Solana mint failed: ${code}`;
}

function isPrivyWalletProxyInitError(err) {
  const msg = String(err?.message || err || '').toLowerCase();
  return msg.includes('wallet proxy not initialized')
    || msg.includes('embedded wallet proxy not initialized')
    || msg.includes('embedded_wallet_proxy_not_initialized')
    || msg.includes('wallet_proxy_not_initialized');
}

function inferMintErrorChain(err, fallback = 'evm') {
  const lower = String(err?.message || err || '').toLowerCase();
  if (lower.includes('solana')) return 'solana';
  if (lower.includes('sepolia') || lower.includes('evm') || lower.includes('ethereum')) return 'evm';
  return fallback === 'solana' ? 'solana' : 'evm';
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function forcePrivyWalletReady({ interactive = true } = {}) {
  if (typeof window.ensurePrivyWalletLogin === 'function') {
    try {
      await window.ensurePrivyWalletLogin({ interactive: !!interactive });
    } catch {
      // ignore and let caller retry/throw
    }
  }

  const bridge = window.__PRIVY_WALLET_BRIDGE__;
  if (bridge && typeof bridge.resetWalletProxies === 'function') {
    try {
      await bridge.resetWalletProxies({ refreshUserState: false });
    } catch {
      // ignore and continue; reconnect calls below can still succeed
    }
  }
  if (bridge && typeof bridge.ensureLoggedIn === 'function') {
    try {
      await bridge.ensureLoggedIn({ interactive: false, preferred: 'solana' });
    } catch {
      // ignore and continue; wallet methods below may still succeed
    }
  }
  if (bridge && typeof bridge.connectSolana === 'function') {
    try {
      await bridge.connectSolana({ silent: !interactive });
    } catch {
      // ignore and let caller retry/throw
    }
  }
  if (bridge && typeof bridge.connectEvm === 'function') {
    try {
      await bridge.connectEvm();
    } catch {
      // ignore and let caller retry/throw
    }
  }

  await sleep(220);
}

async function withPrivyProxyRetry(task, { maxAttempts = 4, onRetry = null } = {}) {
  const attempts = Number.isFinite(Number(maxAttempts)) ? Math.max(1, Math.floor(maxAttempts)) : 4;
  let lastErr = null;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await task();
    } catch (err) {
      lastErr = err;
      if (!isPrivyWalletProxyInitError(err)) throw err;
      await forcePrivyWalletReady({ interactive: i === 0 });
      if (i >= 1 && typeof window.resetPrivyBridge === 'function') {
        try {
          await window.resetPrivyBridge({ hard: i >= 2 });
        } catch {
          // ignore reset failures and continue retry flow
        }
      }
      if (typeof onRetry === 'function') {
        try {
          await onRetry({ attempt: i + 1, error: err });
        } catch {
          // ignore retry hook errors and continue retrying
        }
      }
      if (i < attempts - 1) {
        await sleep(180 * (i + 1));
      }
    }
  }
  throw lastErr || new Error('PRIVY_WALLET_PROXY_NOT_READY');
}

async function loadTownhallModule(url) {
  const key = String(url || '').trim();
  if (!key) throw new Error('MISSING_MODULE_URL');
  if (!townhallModuleCache.has(key)) {
    townhallModuleCache.set(
      key,
      import(/* @vite-ignore */ key).catch((err) => {
        townhallModuleCache.delete(key);
        throw err;
      })
    );
  }
  return townhallModuleCache.get(key);
}

function townhallModuleMocksEnabled() {
  const host = typeof window.location?.hostname === 'string' ? window.location.hostname : '';
  const localHost = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[?::1\]?)$/i.test(host);
  return localHost && window.__TOWNHALL_TEST_MOCKS_ENABLED__ === true;
}

async function loadSolanaWeb3(moduleUrl) {
  if (townhallModuleMocksEnabled() && window.__SOLANA_WEB3_MOCK && typeof window.__SOLANA_WEB3_MOCK === 'object') {
    return window.__SOLANA_WEB3_MOCK;
  }
  const configured = typeof moduleUrl === 'string' && moduleUrl.trim() ? moduleUrl.trim() : '';
  const candidates = [...new Set([configured, ...SOLANA_WEB3_MODULE_FALLBACK_URLS].filter(Boolean))];
  let lastErr = null;
  for (const url of candidates) {
    try {
      const mod = await loadTownhallModule(url);
      if (mod && typeof mod === 'object') return mod;
      lastErr = new Error('SOLANA_WEB3_INVALID_MODULE');
    } catch (err) {
      lastErr = err;
    }
  }
  const out = new Error('SOLANA_WEB3_UNAVAILABLE');
  if (lastErr) out.detail = String(lastErr?.message || lastErr);
  throw out;
}

async function ensureEvmMintWallet(config) {
  if (!appWalletClient) throw new Error('NO_EVM_WALLET');
  const connected = await withPrivyProxyRetry(() => appWalletClient.connect({ chain: 'evm' }));
  const address = connected?.address || appWalletClient.getAddress({ chain: 'evm' }) || null;
  const normalizedAddress = normalizeEvmAddress(address || '');
  if (!normalizedAddress) throw new Error('NO_EVM_ACCOUNT');
  let provider = connected?.provider || appWalletClient.getProvider({ chain: 'evm' });
  const refreshProvider = async () => {
    const refreshed = await appWalletClient.connect({ chain: 'evm' });
    const next = refreshed?.provider || appWalletClient.getProvider({ chain: 'evm' });
    if (next) provider = next;
    return provider;
  };
  const targetChainId = Number(config?.evm?.chainId || 11155111);
  if (Number.isFinite(targetChainId) && targetChainId > 0) {
    try {
      const currentChainId = await withPrivyProxyRetry(
        () => appWalletClient.getChainId({ chain: 'evm' }),
        { onRetry: refreshProvider }
      );
      if (currentChainId !== targetChainId) {
        await withPrivyProxyRetry(
          () => appWalletClient.switchChain({ chain: 'evm', chainId: targetChainId }),
          { onRetry: refreshProvider }
        );
      }
    } catch {
      throw new Error('EVM_CHAIN_SWITCH_FAILED');
    }
  }
  if (!provider) throw new Error('NO_EVM_PROVIDER');
  try {
    const accounts = await withPrivyProxyRetry(
      () => provider.request({ method: 'eth_requestAccounts' }),
      { onRetry: refreshProvider }
    );
    const primary = Array.isArray(accounts) && accounts.length ? normalizeEvmAddress(accounts[0]) : null;
    if (!primary || primary !== normalizedAddress) {
      throw new Error('EVM_ACCOUNT_MISMATCH');
    }
  } catch (err) {
    if (String(err?.message || '') === 'EVM_ACCOUNT_MISMATCH') throw err;
    throw new Error('EVM_ACCOUNT_MISMATCH');
  }
  return { address: normalizedAddress, provider, refreshProvider };
}

async function ensureSolanaMintWallet(config) {
  if (!appWalletClient) throw new Error('NO_SOLANA_WALLET');
  const connected = await withPrivyProxyRetry(() => appWalletClient.connect({ chain: 'solana', silent: false }));
  const address = connected?.address || appWalletClient.getAddress({ chain: 'solana' }) || walletAddr || null;
  const normalizedAddress = normalizeSolanaAddress(address || '');
  if (!normalizedAddress) throw new Error('MISSING_SOLANA_ADDRESS');

  if (walletAddr !== normalizedAddress) {
    walletAddr = normalizedAddress;
    updateWalletUI();
    saveWalletCache();
  }

  let provider = connected?.provider || appWalletClient.getProvider({ chain: 'solana' });
  const refreshProvider = async () => {
    const refreshed = await appWalletClient.connect({ chain: 'solana', silent: false });
    const next = refreshed?.provider || appWalletClient.getProvider({ chain: 'solana' });
    if (next) provider = next;
    return provider;
  };
  if (!provider && window.__PRIVY_WALLET_BRIDGE__ && typeof window.__PRIVY_WALLET_BRIDGE__.connectSolana === 'function') {
    const out = await withPrivyProxyRetry(() => window.__PRIVY_WALLET_BRIDGE__.connectSolana({ silent: false }));
    provider = out?.provider || out?.wallet || null;
  }
  if (!provider) throw new Error('SOLANA_TX_SEND_UNSUPPORTED');

  const web3 = await loadSolanaWeb3(config?.solana?.web3ModuleUrl);
  if (!web3?.Keypair || !web3?.Transaction || !web3?.Connection) {
    throw new Error('SOLANA_WEB3_UNAVAILABLE');
  }
  return { address: normalizedAddress, provider, web3, refreshProvider };
}

function base58Encode(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length === 0) return '';
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let num = 0n;
  for (let i = 0; i < bytes.length; i++) {
    num = (num << 8n) + BigInt(bytes[i]);
  }
  let out = '';
  while (num > 0n) {
    const idx = Number(num % 58n);
    out = alphabet[idx] + out;
    num /= 58n;
  }
  let leading = 0;
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) leading += 1;
  if (leading > 0) out = `${'1'.repeat(leading)}${out}`;
  return out || '1';
}

function normalizeSolanaTxSignature(value) {
  const normalizeRef = (raw) => {
    if (typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    if (!trimmed || /\s/.test(trimmed)) return null;
    if (trimmed.length > 256) return null;
    return trimmed;
  };
  if (!value) return null;
  if (typeof value === 'string') return normalizeRef(value);
  const direct = normalizeRef(
    value.signature
    || value.hash
    || value.transactionSignature
    || value.txSig
    || value.txHash
    || value?.data?.signature
    || value?.data?.hash
    || value?.data?.transactionSignature
  );
  if (direct) return direct;
  if (value.signature instanceof Uint8Array) return base58Encode(value.signature);
  if (value instanceof Uint8Array) return base58Encode(value);
  if (Array.isArray(value)) return base58Encode(new Uint8Array(value));
  return null;
}

function normalizeEvmAddress(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) return null;
  return trimmed.toLowerCase();
}

function normalizeSolanaAddress(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/\s/.test(trimmed)) return null;
  if (trimmed.length < 16 || trimmed.length > 128) return null;
  return trimmed;
}

function bytesToBase64(bytes) {
  if (!(bytes instanceof Uint8Array)) return '';
  let out = '';
  for (let i = 0; i < bytes.length; i += 1) out += String.fromCharCode(bytes[i]);
  return btoa(out);
}

function decodeBase64Bytes(value) {
  if (typeof value !== 'string' || !value.trim()) throw new Error('INVALID_PREPARED_TRANSACTION');
  const bin = atob(value);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function deserializePreparedSolanaTransactionBytes({ txBytes, web3 }) {
  if (!web3?.Transaction || typeof web3.Transaction.from !== 'function') {
    throw new Error('SOLANA_WEB3_TRANSACTION_UNAVAILABLE');
  }
  try {
    const transaction = web3.Transaction.from(txBytes);
    if (!transaction) throw new Error('INVALID_PREPARED_TRANSACTION');
    return transaction;
  } catch {
    throw new Error('INVALID_PREPARED_TRANSACTION');
  }
}

function decodePreparedSolanaTransaction({ preparedTx, web3 }) {
  const txBytes = decodeBase64Bytes(preparedTx);
  return {
    tx: deserializePreparedSolanaTransactionBytes({ txBytes, web3 }),
    txBytes
  };
}

function prepareSolanaTransactionForClientSigning({ txBytes, web3, signerKeypairs = [] }) {
  const tx = deserializePreparedSolanaTransactionBytes({ txBytes, web3 });
  const signers = Array.isArray(signerKeypairs)
    ? signerKeypairs.filter((entry) => entry && entry.publicKey && entry.secretKey)
    : [];
  if (!signers.length) return tx;
  if (typeof tx.partialSign !== 'function') throw new Error('SOLANA_PARTIAL_SIGN_UNSUPPORTED');
  tx.partialSign(...signers);
  return tx;
}

function serializeSolanaTransactionForRpc(tx) {
  if (!tx || typeof tx.serialize !== 'function') throw new Error('SOLANA_TX_SERIALIZE_FAILED');
  const raw = tx.serialize({ requireAllSignatures: false, verifySignatures: false });
  let bytes = null;
  if (raw instanceof Uint8Array) bytes = raw;
  else if (raw instanceof ArrayBuffer) bytes = new Uint8Array(raw);
  else if (ArrayBuffer.isView(raw)) bytes = new Uint8Array(raw.buffer, raw.byteOffset, raw.byteLength);
  if (!(bytes instanceof Uint8Array) || bytes.length === 0) throw new Error('SOLANA_TX_SERIALIZE_FAILED');
  return bytesToBase64(bytes);
}

async function sendPreparedSolanaTransaction({
  provider,
  preparedTx,
  rpcUrl,
  web3,
  refreshProvider = null,
  signerKeypairs = [],
  sponsorSendEnabled = false,
  sponsorWalletAddress = null,
  sponsorAssetPubkey = null
}) {
  let activeProvider = provider && typeof provider === 'object' ? provider : null;
  const { txBytes } = decodePreparedSolanaTransaction({ preparedTx, web3 });
  const conn = new web3.Connection(rpcUrl || 'https://api.devnet.solana.com', 'confirmed');
  const makeTx = () => prepareSolanaTransactionForClientSigning({ txBytes, web3, signerKeypairs });
  const tryRefreshProvider = async () => {
    if (typeof refreshProvider === 'function') {
      try {
        const refreshed = await refreshProvider();
        if (refreshed) activeProvider = refreshed;
      } catch {
        // ignore; fallback to bridge connect below
      }
    }
    if ((!activeProvider || typeof activeProvider.request !== 'function')
      && window.__PRIVY_WALLET_BRIDGE__
      && typeof window.__PRIVY_WALLET_BRIDGE__.connectSolana === 'function') {
      try {
        const out = await window.__PRIVY_WALLET_BRIDGE__.connectSolana({ silent: false });
        const refreshed = out?.provider || out?.wallet || null;
        if (refreshed) activeProvider = refreshed;
      } catch {
        // ignore and continue; caller handles unsupported path
      }
    }
    return activeProvider;
  };

  const normalizeSignedTx = (value) => {
    if (!value || typeof value !== 'object') return null;
    if (typeof value.serialize === 'function') return value;
    if (value.signedTransaction && typeof value.signedTransaction.serialize === 'function') {
      return value.signedTransaction;
    }
    if (value.transaction && typeof value.transaction.serialize === 'function') {
      return value.transaction;
    }
    return null;
  };

  const signPreparedTxWithProvider = async () => {
    if (activeProvider && typeof activeProvider.request === 'function') {
      try {
        const signTx = makeTx();
        const signedOut = await withPrivyProxyRetry(
          () => activeProvider.request({
            method: 'signTransaction',
            params: { transaction: signTx }
          }),
          { onRetry: tryRefreshProvider }
        );
        const signedTx = normalizeSignedTx(signedOut);
        if (signedTx) return signedTx;
      } catch {
        // try next provider shape
      }
    }

    if (activeProvider && typeof activeProvider.signTransaction === 'function') {
      try {
        const signTx = makeTx();
        const signedOut = await withPrivyProxyRetry(
          () => activeProvider.signTransaction(signTx),
          { onRetry: tryRefreshProvider }
        );
        const signedTx = normalizeSignedTx(signedOut);
        if (signedTx) return signedTx;
      } catch {
        // fall through
      }
    }
    return null;
  };

  if (sponsorSendEnabled) {
    const signedTx = await signPreparedTxWithProvider();
    if (!signedTx) throw new Error('SOLANA_SIGN_TX_UNSUPPORTED');
    const transaction = serializeSolanaTransactionForRpc(signedTx);
    const relayOut = await api('/api/townhall/mint/solana/sponsor-send', {
      method: 'POST',
      body: JSON.stringify({
        transaction,
        ...(typeof sponsorWalletAddress === 'string' && sponsorWalletAddress.trim()
          ? { walletAddress: sponsorWalletAddress.trim() }
          : {}),
        ...(typeof sponsorAssetPubkey === 'string' && sponsorAssetPubkey.trim()
          ? { assetPubkey: sponsorAssetPubkey.trim() }
          : {})
      })
    });
    const sig = normalizeSolanaTxSignature(
      relayOut?.signature
      || relayOut?.txSig
      || relayOut?.solana?.signature
      || relayOut
    );
    if (sig) return sig;
    throw new Error('SOLANA_SPONSOR_SEND_FAILED');
  }

  if (activeProvider && typeof activeProvider.request === 'function') {
    const signAndSendAttempts = [
      { method: 'signAndSendTransaction', includeConnection: true, includeOptions: true },
      { method: 'signAndSendTransaction', includeConnection: true, includeOptions: false },
      { method: 'solana_signAndSendTransaction', includeConnection: true, includeOptions: true }
    ];
    for (const attempt of signAndSendAttempts) {
      try {
        const params = { transaction: makeTx() };
        if (attempt.includeConnection) params.connection = conn;
        if (attempt.includeOptions) params.options = { skipPreflight: false };
        const out = await withPrivyProxyRetry(
          () => activeProvider.request({ method: attempt.method, params }),
          { onRetry: tryRefreshProvider }
        );
        const sig = normalizeSolanaTxSignature(out);
        if (sig) return sig;
      } catch {
        // try next shape
      }
    }

    try {
      const signedTx = await signPreparedTxWithProvider();
      if (signedTx && typeof signedTx.serialize === 'function') {
        const raw = signedTx.serialize();
        const sig = await conn.sendRawTransaction(raw, { skipPreflight: false });
        await conn.confirmTransaction(sig, 'confirmed');
        return sig;
      }
    } catch {
      // fall through to non-request provider APIs
    }
  }

  if (activeProvider && typeof activeProvider.signAndSendTransaction === 'function') {
    const signAndSendTx = makeTx();
    const out = await withPrivyProxyRetry(
      () => activeProvider.signAndSendTransaction(signAndSendTx),
      { onRetry: tryRefreshProvider }
    );
    const sig = normalizeSolanaTxSignature(out);
    if (sig) return sig;
  }

  if (activeProvider && typeof activeProvider.signTransaction === 'function') {
    const signTx = makeTx();
    const signed = await withPrivyProxyRetry(
      () => activeProvider.signTransaction(signTx),
      { onRetry: tryRefreshProvider }
    );
    const raw = signed && typeof signed.serialize === 'function' ? signed.serialize() : signed;
    if (raw) {
      const sig = await conn.sendRawTransaction(raw, { skipPreflight: false });
      await conn.confirmTransaction(sig, 'confirmed');
      return sig;
    }
  }

  throw new Error('SOLANA_TX_SEND_UNSUPPORTED');
}

function normalizeEvmTxHash(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!/^0x[a-fA-F0-9]{64}$/.test(trimmed)) return null;
  return trimmed;
}

function normalizePrivyTransactionId(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function parseSponsoredEvmSendResult(value) {
  const hash = normalizeEvmTxHash(
    value?.txHash
    || value?.transactionHash
    || value?.transaction_hash
    || value?.hash
    || value?.result?.txHash
    || value?.result?.transactionHash
    || value?.result?.transaction_hash
    || value?.result?.hash
    || value?.data?.txHash
    || value?.data?.transactionHash
    || value?.data?.transaction_hash
    || value?.data?.hash
    || value
  );
  const transactionId = normalizePrivyTransactionId(
    value?.transactionId
    || value?.transaction_id
    || value?.result?.transactionId
    || value?.result?.transaction_id
    || value?.data?.transactionId
    || value?.data?.transaction_id
  );
  const userOperationHash = normalizeEvmTxHash(
    value?.userOperationHash
    || value?.user_operation_hash
    || value?.result?.userOperationHash
    || value?.result?.user_operation_hash
    || value?.data?.userOperationHash
    || value?.data?.user_operation_hash
  );
  return { hash, transactionId, userOperationHash };
}

function isPrivySponsoredFailureStatus(status) {
  const normalized = String(status || '').trim().toLowerCase();
  if (!normalized) return false;
  return (
    normalized.includes('fail')
    || normalized.includes('revert')
    || normalized.includes('cancel')
    || normalized.includes('dropped')
    || normalized.includes('expired')
    || normalized.includes('error')
    || normalized.includes('reject')
  );
}

async function fetchPrivySponsoredEvmStatus(transactionId) {
  const id = normalizePrivyTransactionId(transactionId);
  if (!id) throw new Error('MINT_EVM_SPONSORED_NO_HANDLE');
  const payload = await api(`/api/privy/transactions/${encodeURIComponent(id)}`, {
    method: 'GET'
  });
  const tx = payload?.transaction && typeof payload.transaction === 'object'
    ? payload.transaction
    : payload;
  const hash = normalizeEvmTxHash(
    tx?.transactionHash
    || tx?.transaction_hash
    || tx?.hash
    || tx?.txHash
  );
  const status = typeof tx?.status === 'string' ? tx.status.trim().toLowerCase() : '';
  return { hash, status };
}

async function waitForSponsoredEvmTransactionHash({
  wallet,
  transactionId = null,
  userOperationHash = null,
  timeoutMs = SPONSORED_EVM_TX_TIMEOUT_MS,
  pollMs = SPONSORED_EVM_TX_POLL_MS
}) {
  let activeProvider = wallet?.provider || null;
  const txId = normalizePrivyTransactionId(transactionId);
  const opHash = normalizeEvmTxHash(userOperationHash || '');
  if (!txId && !opHash) throw new Error('MINT_EVM_SPONSORED_NO_HANDLE');

  const refreshProvider = async () => {
    if (typeof wallet?.refreshProvider === 'function') {
      try {
        const refreshed = await wallet.refreshProvider();
        if (refreshed && typeof refreshed.request === 'function') {
          activeProvider = refreshed;
        }
      } catch {
        // ignore refresh errors; status polling can still continue
      }
    }
    return activeProvider;
  };

  const startedAt = Date.now();
  let lastStatus = '';
  while (Date.now() - startedAt < timeoutMs) {
    if (txId) {
      try {
        const status = await fetchPrivySponsoredEvmStatus(txId);
        if (status.hash) return status.hash;
        if (status.status) {
          lastStatus = status.status;
          if (isPrivySponsoredFailureStatus(status.status)) {
            const failed = new Error('MINT_EVM_SPONSORED_FAILED');
            failed.detail = status.status;
            throw failed;
          }
        }
      } catch (err) {
        const code = String(err?.message || err || '');
        if (code === 'PRIVY_SERVER_AUTH_NOT_CONFIGURED' && !opHash) throw err;
        if (code === 'PRIVY_TRANSACTION_STATUS_UNAVAILABLE' && !opHash) throw err;
      }
    }

    if (opHash) {
      if (!activeProvider || typeof activeProvider.request !== 'function') {
        await refreshProvider();
      }
      if (activeProvider && typeof activeProvider.request === 'function') {
        try {
          const raw = await withPrivyProxyRetry(
            () => activeProvider.request({
              method: 'eth_getUserOperationReceipt',
              params: [opHash]
            }),
            { onRetry: refreshProvider }
          );
          const receipt = raw?.result?.receipt || raw?.receipt || raw?.result || raw;
          const hash = normalizeEvmTxHash(
            receipt?.transactionHash
            || receipt?.transaction_hash
            || raw?.result?.transactionHash
            || raw?.transactionHash
          );
          if (hash) return hash;
        } catch {
          // Some providers do not implement eth_getUserOperationReceipt.
        }
      }
    }

    await sleep(pollMs);
  }

  const timeout = new Error('MINT_EVM_SPONSORED_TIMEOUT');
  if (lastStatus) timeout.detail = lastStatus;
  throw timeout;
}

function uint256Hex(value) {
  const big = BigInt(value);
  if (big < 0n) throw new Error('MINT_EVM_FAILED');
  return big.toString(16).padStart(64, '0');
}

function bytesToHex(bytes) {
  if (!(bytes instanceof Uint8Array)) return '';
  let out = '';
  for (let i = 0; i < bytes.length; i += 1) {
    out += bytes[i].toString(16).padStart(2, '0');
  }
  return out;
}

function toEvmChainHex(chainId) {
  const numeric = Number(chainId);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return `0x${Math.floor(numeric).toString(16)}`;
}

function encodeEvmErc8004RegisterCall(tokenUri) {
  const uri = String(tokenUri || '');
  const uriBytes = new TextEncoder().encode(uri);
  const paddedBytesLen = Math.ceil(uriBytes.length / 32) * 32;
  const headTokenUriOffset = uint256Hex(64);
  const headMetadataOffset = uint256Hex(64 + 32 + paddedBytesLen);
  const uriLength = uint256Hex(uriBytes.length);
  const uriData = bytesToHex(uriBytes).padEnd(paddedBytesLen * 2, '0');
  const metadataEntriesLength = uint256Hex(0);
  return `0x${ERC8004_REGISTER_SELECTOR}${headTokenUriOffset}${headMetadataOffset}${uriLength}${uriData}${metadataEntriesLength}`;
}

function parseErc8004AgentIdFromEvmReceipt({ receipt, chainId, contractAddress }) {
  const logs = Array.isArray(receipt?.logs) ? receipt.logs : [];
  const expectedContract = normalizeEvmAddress(contractAddress || '');
  const resolvedChainId = Number.isFinite(Number(chainId)) && Number(chainId) > 0
    ? Math.floor(Number(chainId))
    : 11155111;

  for (const log of logs) {
    const logAddress = normalizeEvmAddress(log?.address || '');
    if (expectedContract && logAddress && logAddress !== expectedContract) continue;
    const topics = Array.isArray(log?.topics) ? log.topics : [];
    if (topics.length < 4) continue;
    if (String(topics[0] || '').toLowerCase() !== ERC721_TRANSFER_TOPIC0) continue;
    const tokenTopic = String(topics[3] || '').trim();
    if (!/^0x[a-fA-F0-9]{64}$/.test(tokenTopic)) continue;
    const tokenId = BigInt(tokenTopic).toString(10);
    return `${resolvedChainId}:${tokenId}`;
  }

  return null;
}

function isEvmReceiptSuccess(receipt) {
  const status = receipt?.status;
  if (status === null || status === undefined) return true;
  if (typeof status === 'number') return status > 0;
  if (typeof status === 'bigint') return status > 0n;
  if (typeof status === 'string') {
    const trimmed = status.trim().toLowerCase();
    if (trimmed === '0x1' || trimmed === '0x01' || trimmed === '1') return true;
    if (trimmed === '0x0' || trimmed === '0x00' || trimmed === '0') return false;
    if (/^0x[0-9a-f]+$/.test(trimmed)) return BigInt(trimmed) > 0n;
    const numeric = Number(trimmed);
    if (Number.isFinite(numeric)) return numeric > 0;
  }
  return true;
}

async function sendPreparedEvmTransaction({ wallet, chainId, to, data }) {
  let activeProvider = wallet?.provider || null;
  const numericChainId = Number(chainId);
  const caip2 = Number.isFinite(numericChainId) && numericChainId > 0
    ? `eip155:${Math.floor(numericChainId)}`
    : null;
  const tx = {
    from: wallet.address,
    to,
    data
  };

  const refreshProvider = async () => {
    if (typeof wallet?.refreshProvider === 'function') {
      try {
        const refreshed = await wallet.refreshProvider();
        if (refreshed && typeof refreshed.request === 'function') {
          activeProvider = refreshed;
        }
      } catch {
        // ignore refresh errors and keep retrying with existing provider
      }
    }
    return activeProvider;
  };

  const bridge = window.__PRIVY_WALLET_BRIDGE__;
  if (bridge && typeof bridge.sendEvmTransaction === 'function') {
    const out = await withPrivyProxyRetry(
      () => bridge.sendEvmTransaction({
        transaction: tx,
        sponsor: true,
        ...(caip2 ? { caip2 } : {}),
        ...(Number.isFinite(numericChainId) && numericChainId > 0 ? { chainId: Math.floor(numericChainId) } : {})
      }),
      { onRetry: refreshProvider }
    );
    const sponsored = parseSponsoredEvmSendResult(out);
    if (sponsored.hash) return sponsored.hash;
    if (sponsored.transactionId || sponsored.userOperationHash) {
      return waitForSponsoredEvmTransactionHash({
        wallet,
        transactionId: sponsored.transactionId,
        userOperationHash: sponsored.userOperationHash
      });
    }
    throw new Error('PRIVY_SPONSORED_TX_NO_RESULT');
  }

  throw new Error('PRIVY_SPONSORED_TX_UNAVAILABLE');
}

async function waitForEvmTransactionReceipt({ wallet, txHash, timeoutMs = 120000, pollMs = 1500 }) {
  let activeProvider = wallet?.provider || null;
  const startedAt = Date.now();

  const refreshProvider = async () => {
    if (typeof wallet?.refreshProvider === 'function') {
      try {
        const refreshed = await wallet.refreshProvider();
        if (refreshed && typeof refreshed.request === 'function') {
          activeProvider = refreshed;
        }
      } catch {
        // ignore refresh errors and keep retrying with existing provider
      }
    }
    return activeProvider;
  };

  while (Date.now() - startedAt < timeoutMs) {
    if (activeProvider && typeof activeProvider.request === 'function') {
      const raw = await withPrivyProxyRetry(
        () => activeProvider.request({
          method: 'eth_getTransactionReceipt',
          params: [txHash]
        }),
        { onRetry: refreshProvider }
      );
      const receipt = raw && typeof raw === 'object' && raw.result && typeof raw.result === 'object'
        ? raw.result
        : raw;
      if (receipt && typeof receipt === 'object') return receipt;
    } else {
      await refreshProvider();
    }
    await sleep(pollMs);
  }

  throw new Error('MINT_EVM_RECEIPT_TIMEOUT');
}

function setTownhallMintDraftRecord(role, chain, record) {
  if (!townhallMintDraft || typeof townhallMintDraft !== 'object') {
    townhallMintDraft = createEmptyTownhallMintDraft();
  }
  if (!townhallMintDraft[role] || typeof townhallMintDraft[role] !== 'object') {
    townhallMintDraft[role] = {};
  }
  townhallMintDraft[role][chain] = {
    ...(townhallMintDraft[role][chain] || {}),
    ...(record || {})
  };
  townhallMintDraftDirty = true;
}

async function mintTownhallEvmIdentity({ subject, profile, config, wallet }) {
  const safeSubject = subject === 'human' ? 'human' : 'agent';
  const prepared = await api('/api/townhall/mint/evm/prepare', {
    method: 'POST',
    body: JSON.stringify({
      walletAddress: wallet.address,
      subject: safeSubject,
      profile
    })
  });
  if (!prepared?.tokenUri) throw new Error('MINT_EVM_FAILED');
  const chainId = Number(prepared?.evm?.chainId || config?.evm?.chainId || 11155111);
  const contractAddress = normalizeEvmAddress(
    prepared?.evm?.contractAddress || config?.evm?.contractAddress || DEFAULT_EVM_ERC8004_IDENTITY_REGISTRY
  );
  if (!contractAddress) throw new Error('MINT_EVM_CONTRACT_NOT_CONFIGURED');
  const data = encodeEvmErc8004RegisterCall(prepared.tokenUri);
  const txHash = await sendPreparedEvmTransaction({
    wallet,
    chainId,
    to: contractAddress,
    data
  });
  const receipt = await waitForEvmTransactionReceipt({ wallet, txHash });
  if (!isEvmReceiptSuccess(receipt)) throw new Error('MINT_EVM_REVERTED');
  const mintedAgentId = parseErc8004AgentIdFromEvmReceipt({
    receipt,
    chainId,
    contractAddress
  });
  if (!mintedAgentId) throw new Error('MINT_EVM_NO_AGENT_ID');
  const confirmedTxHash = normalizeEvmTxHash(receipt?.transactionHash || txHash) || txHash;
  return {
    id: mintedAgentId,
    txHash: confirmedTxHash
  };
}

async function mintTownhallSolanaIdentity({ subject, profile, config, wallet }) {
  const safeSubject = subject === 'human' ? 'human' : 'agent';
  const assetKeypair = wallet.web3.Keypair.generate();
  const assetPubkey = assetKeypair.publicKey.toBase58();
  const prepared = await api('/api/townhall/mint/solana/prepare', {
    method: 'POST',
    body: JSON.stringify({
      walletAddress: wallet.address,
      assetPubkey,
      subject: safeSubject,
      profile
    })
  });

  const preparedSigner = normalizeSolanaAddress(prepared?.prepared?.signer || '');
  const expectedSigner = normalizeSolanaAddress(wallet.address || '');
  if (!preparedSigner || !expectedSigner || preparedSigner !== expectedSigner) {
    throw new Error('SOLANA_SIGNER_MISMATCH');
  }
  if (prepared?.prepared?.signed === true) {
    throw new Error('SOLANA_PREPARE_SIGNED');
  }
  const preparedTx = prepared?.prepared?.transaction;
  if (!preparedTx || typeof preparedTx !== 'string') throw new Error('SOLANA_PREPARE_FAILED');
  const preparedAssetPubkey = normalizeSolanaAddress(prepared?.solana?.assetPubkey || assetPubkey) || assetPubkey;
  const canUseMockFallback = townhallModuleMocksEnabled();
  if (!canUseMockFallback && config?.solana?.sponsorSendEnabled !== true) {
    throw new Error(config?.solana?.sponsorSendError || 'SOLANA_SPONSOR_NOT_CONFIGURED');
  }

  const txSig = await sendPreparedSolanaTransaction({
    provider: wallet.provider,
    refreshProvider: wallet.refreshProvider,
    preparedTx,
    rpcUrl: config?.solana?.rpcUrl,
    web3: wallet.web3,
    signerKeypairs: [assetKeypair],
    sponsorSendEnabled: config?.solana?.sponsorSendEnabled === true,
    sponsorWalletAddress: wallet.address,
    sponsorAssetPubkey: preparedAssetPubkey
  });
  if (!txSig) throw new Error('MINT_SOLANA_NO_SIGNATURE');

  return {
    id: prepared.erc8004Id || `solana:${preparedAssetPubkey}`,
    txSig
  };
}

async function runTownhallMintStep(stepKey, action) {
  const step = townhallMintSteps.find((entry) => entry.key === stepKey);
  if (!step) throw new Error('MINT_STEP_NOT_FOUND');
  townhallMintLastErrorStep = null;
  syncTownhallMintChecklist(townhallMintDraft, { activeStep: step.key });
  try {
    const out = await action();
    syncTownhallMintChecklist(townhallMintDraft);
    return out;
  } catch (err) {
    townhallMintLastErrorStep = step.key;
    syncTownhallMintChecklist(townhallMintDraft, { errorStep: step.key });
    throw new Error(knownMintErrorMessage(err, step.chain));
  }
}

function setTownhallRegisterFeedback(message = '', isError = false) {
  const status = el('townhallRegisterStatus');
  const error = el('townhallRegisterError');
  if (status) status.textContent = isError ? '' : message;
  if (error) error.textContent = isError ? message : '';
}

function setTownhallAvatarPreview(kind, imageUrl) {
  const isHuman = kind === 'human';
  const wrap = el(isHuman ? 'townhallHumanPreview' : 'townhallAgentPreview');
  const img = el(isHuman ? 'townhallHumanPreviewImg' : 'townhallAgentPreviewImg');
  if (!wrap || !img) return;
  if (!imageUrl) {
    wrap.classList.add('is-hidden');
    img.src = '';
    return;
  }
  wrap.classList.remove('is-hidden');
  img.src = imageUrl;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const out = typeof reader.result === 'string' ? reader.result : '';
      if (!out) {
        reject(new Error('FILE_READ_FAILED'));
        return;
      }
      resolve(out);
    };
    reader.onerror = () => reject(new Error('FILE_READ_FAILED'));
    reader.readAsDataURL(file);
  });
}

async function onTownhallImageChanged(kind, inputEl) {
  const file = inputEl && inputEl.files && inputEl.files[0] ? inputEl.files[0] : null;
  if (!file) return;
  if (!TOWNHALL_IMAGE_TYPES.has(file.type)) {
    setTownhallRegisterFeedback('Use PNG, JPG, or WebP images for Town Hall avatars.', true);
    return;
  }
  if (file.size > TOWNHALL_IMAGE_MAX_BYTES) {
    setTownhallRegisterFeedback('Avatar image is too large (max 2 MB).', true);
    return;
  }
  const dataUrl = await readFileAsDataUrl(file);
  if (kind === 'human') pendingTownhallHumanImage = dataUrl;
  else pendingTownhallAgentImage = dataUrl;
  setTownhallAvatarPreview(kind, dataUrl);
  setTownhallRegisterFeedback('');
}

async function submitTownhallRegistration() {
  const profile = collectTownhallProfilePayload();
  const draft = cloneTownhallMintDraft(townhallMintDraft);

  const payload = {
    profile,
    erc8004: {
      user: {
        evm: {
          id: (draft?.user?.evm?.id || '').trim(),
          chain: draft?.user?.evm?.chain || 'sepolia',
          txHash: (draft?.user?.evm?.txHash || '').trim() || null
        },
        solana: {
          id: (draft?.user?.solana?.id || '').trim(),
          cluster: draft?.user?.solana?.cluster || 'devnet',
          txSig: (draft?.user?.solana?.txSig || '').trim() || null
        }
      },
      agent: {
        evm: {
          id: (draft?.agent?.evm?.id || '').trim(),
          chain: draft?.agent?.evm?.chain || 'sepolia',
          txHash: (draft?.agent?.evm?.txHash || '').trim() || null
        },
        solana: {
          id: (draft?.agent?.solana?.id || '').trim(),
          cluster: draft?.agent?.solana?.cluster || 'devnet',
          txSig: (draft?.agent?.solana?.txSig || '').trim() || null
        }
      }
    }
  };

  if (pendingTownhallHumanImage) {
    payload.profile.humanAvatar.image = pendingTownhallHumanImage;
  }
  if (pendingTownhallAgentImage) {
    payload.profile.agentAvatar.image = pendingTownhallAgentImage;
  }

  setTownhallRegisterFeedback('Saving Town Hall registration...');

  try {
    const out = await api('/api/townhall/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    pendingTownhallHumanImage = null;
    pendingTownhallAgentImage = null;
    clearTownhallDraftDirtyFlags();
    townhallMintDraft = normalizeTownhallMintDraftFromOnboarding(out?.onboarding || null);
    townhallMintDraftDirty = false;
    townhallMintLastErrorStep = null;
    syncTownhallMintChecklist(townhallMintDraft);
    setTownhallRegisterFeedback('Registration saved. Continue with sigil unlock.');
    if (lastState) {
      updateUI({ ...lastState, onboarding: out.onboarding || lastState.onboarding });
    }
    return out;
  } catch (e) {
    const message = e?.message === 'MISSING_HUMAN_NAME'
      ? 'Enter your human name.'
      : e?.message === 'MISSING_AGENT_NAME'
        ? 'Enter your agent name.'
        : e?.message === 'MISSING_HUMAN_AVATAR_PROMPT'
          ? 'Add the prompt used for the human avatar.'
          : e?.message === 'MISSING_AGENT_AVATAR_PROMPT'
            ? 'Add the prompt used for the agent avatar.'
            : e?.message === 'MISSING_ERC8004_USER_EVM_ID'
              ? 'User Sepolia mint ID is missing.'
              : e?.message === 'MISSING_ERC8004_USER_SOLANA_ID'
                ? 'User Solana mint ID is missing.'
                : e?.message === 'MISSING_ERC8004_AGENT_EVM_ID'
                  ? 'Agent Sepolia mint ID is missing.'
                  : e?.message === 'MISSING_ERC8004_AGENT_SOLANA_ID'
                    ? 'Agent Solana mint ID is missing.'
                : e?.message === 'TOWNHALL_IMAGE_TOO_LARGE'
                  ? 'Avatar image is too large (max 2 MB).'
                  : e?.message === 'INVALID_TOWNHALL_IMAGE'
                    ? 'Avatar upload must be PNG, JPG, or WebP.'
                    : `Registration failed: ${e.message}`;
    setTownhallRegisterFeedback(message, true);
    throw new Error(message);
  } finally {
    const cfg = townhallMintConfig || fallbackTownhallMintConfig();
    applyTownhallMintConfig(cfg);
  }
}

async function mintAllTownhallIdentitiesAndRegister() {
  if (townhallMintInFlight) return;
  townhallMintInFlight = true;
  townhallMintLastErrorStep = null;
  setTownhallStoryStep('processing');
  const registerBtn = el('townhallRegisterBtn');
  if (registerBtn) registerBtn.disabled = true;
  setTownhallRegisterFeedback('Checking mint configuration...');
  syncTownhallMintChecklist(townhallMintDraft);

  try {
    const config = await ensureTownhallMintConfig();
    applyTownhallMintConfig(config);
    if (!config?.evm?.enabled || !config?.solana?.enabled) throw new Error('MINT_ALL_CHAINS_NOT_ENABLED');

    const profile = collectTownhallProfilePayload();
    setTownhallRegisterFeedback('Preparing Privy wallets...');
    let evmWallet;
    let solanaWallet;
    try {
      await forcePrivyWalletReady();
      evmWallet = await ensureEvmMintWallet(config);
      solanaWallet = await ensureSolanaMintWallet(config);
    } catch (walletErr) {
      const chain = inferMintErrorChain(walletErr, 'evm');
      throw new Error(knownMintErrorMessage(walletErr, chain));
    }

    const firstRejected = (results) => {
      for (const result of results) {
        if (result?.status !== 'rejected') continue;
        const reason = result.reason;
        return reason instanceof Error ? reason : new Error(String(reason || 'Mint failed.'));
      }
      return null;
    };

    const mintUserEvm = async () => {
      const userEvm = await runTownhallMintStep('userEvm', () => mintTownhallEvmIdentity({
        subject: 'human',
        profile,
        config,
        wallet: evmWallet
      }));
      setTownhallMintDraftRecord('user', 'evm', {
        id: userEvm.id,
        chain: config?.evm?.network || 'sepolia',
        txHash: userEvm.txHash || ''
      });
      syncTownhallMintChecklist(townhallMintDraft);
      return userEvm;
    };

    const mintUserSolana = async () => {
      const userSolana = await runTownhallMintStep('userSolana', () => mintTownhallSolanaIdentity({
        subject: 'human',
        profile,
        config,
        wallet: solanaWallet
      }));
      setTownhallMintDraftRecord('user', 'solana', {
        id: userSolana.id,
        cluster: config?.solana?.cluster || 'devnet',
        txSig: userSolana.txSig || ''
      });
      syncTownhallMintChecklist(townhallMintDraft);
      return userSolana;
    };

    const mintAgentEvm = async () => {
      const agentEvm = await runTownhallMintStep('agentEvm', () => mintTownhallEvmIdentity({
        subject: 'agent',
        profile,
        config,
        wallet: evmWallet
      }));
      setTownhallMintDraftRecord('agent', 'evm', {
        id: agentEvm.id,
        chain: config?.evm?.network || 'sepolia',
        txHash: agentEvm.txHash || ''
      });
      syncTownhallMintChecklist(townhallMintDraft);
      return agentEvm;
    };

    const mintAgentSolana = async () => {
      const agentSolana = await runTownhallMintStep('agentSolana', () => mintTownhallSolanaIdentity({
        subject: 'agent',
        profile,
        config,
        wallet: solanaWallet
      }));
      setTownhallMintDraftRecord('agent', 'solana', {
        id: agentSolana.id,
        cluster: config?.solana?.cluster || 'devnet',
        txSig: agentSolana.txSig || ''
      });
      syncTownhallMintChecklist(townhallMintDraft);
      return agentSolana;
    };

    setTownhallRegisterFeedback('User is registering on Ethereum and Solana...');
    const userMintResults = await Promise.allSettled([mintUserEvm(), mintUserSolana()]);
    const userMintError = firstRejected(userMintResults);
    if (userMintError) throw userMintError;

    setTownhallRegisterFeedback('Agent is registering on Ethereum and Solana...');
    const agentMintResults = await Promise.allSettled([mintAgentEvm(), mintAgentSolana()]);
    const agentMintError = firstRejected(agentMintResults);
    if (agentMintError) throw agentMintError;

    setTownhallRegisterFeedback('Saving Town Hall registration...');
    await submitTownhallRegistration();
    townhallMintLastErrorStep = null;
    setTownhallRegisterFeedback('Registration complete. Click Continue to start the sigil test.');
  } catch (err) {
    townhallSigilUnlockedByContinue = false;
    const raw = String(err?.message || err || 'Mint failed.');
    const msg = isPrivyWalletProxyInitError(err)
      ? knownMintErrorMessage(err, inferMintErrorChain(err, 'evm'))
      : raw;
    setTownhallRegisterFeedback(msg, true);
  } finally {
    townhallMintInFlight = false;
    const cfg = townhallMintConfig || fallbackTownhallMintConfig();
    applyTownhallMintConfig(cfg);
  }
}

function bindTownhallRegistrationControls() {
  for (const input of getTownhallDraftFieldNodes()) bindTownhallDraftField(input);

  const requireName = (kind) => {
    const isHuman = kind === 'human';
    const input = el(isHuman ? 'townhallHumanName' : 'townhallAgentName');
    const value = (input?.value || '').trim();
    if (value) return true;
    setTownhallRegisterFeedback(isHuman ? 'Enter your name to continue.' : 'Enter your agent name to continue.', true);
    if (input) input.focus();
    return false;
  };

  const humanSubmitBtn = el('townhallHumanSubmitBtn');
  if (humanSubmitBtn && humanSubmitBtn.dataset.bound !== '1') {
    humanSubmitBtn.dataset.bound = '1';
    humanSubmitBtn.addEventListener('click', () => {
      if (!requireName('human')) return;
      setTownhallRegisterFeedback('');
      setTownhallStoryStep('agent');
    });
  }

  const agentBackBtn = el('townhallAgentBackBtn');
  if (agentBackBtn && agentBackBtn.dataset.bound !== '1') {
    agentBackBtn.dataset.bound = '1';
    agentBackBtn.addEventListener('click', () => {
      setTownhallRegisterFeedback('');
      setTownhallStoryStep('human');
    });
  }

  const agentSubmitBtn = el('townhallAgentSubmitBtn');
  if (agentSubmitBtn && agentSubmitBtn.dataset.bound !== '1') {
    agentSubmitBtn.dataset.bound = '1';
    agentSubmitBtn.addEventListener('click', () => {
      if (!requireName('human')) return;
      if (!requireName('agent')) return;
      townhallAwaitingContinue = true;
      townhallSigilUnlockedByContinue = false;
      setTownhallStoryStep('processing');
      setTownhallRegisterFeedback('Welcome to Agent Town, processing your registration.');
      mintAllTownhallIdentitiesAndRegister();
    });
  }

  const continueBtn = el('townhallContinueBtn');
  if (continueBtn && continueBtn.dataset.bound !== '1') {
    continueBtn.dataset.bound = '1';
    continueBtn.addEventListener('click', () => {
      if (continueBtn.disabled) return;
      townhallAwaitingContinue = false;
      townhallSigilUnlockedByContinue = true;
      setTownhallRegisterFeedback('Continue with the sigil test.');
      if (lastState) syncTownhallRegistrationUI(lastState);
      const sigilFlow = el('townhallSigilFlow');
      if (sigilFlow && !sigilFlow.classList.contains('is-hidden')) {
        sigilFlow.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  const registerBtn = el('townhallRegisterBtn');
  if (registerBtn && registerBtn.dataset.bound !== '1') {
    registerBtn.dataset.bound = '1';
    registerBtn.addEventListener('click', () => {
      townhallAwaitingContinue = true;
      townhallSigilUnlockedByContinue = false;
      mintAllTownhallIdentitiesAndRegister();
    });
  }

  const humanCustomizeBtn = el('townhallHumanCustomizeBtn');
  if (humanCustomizeBtn && humanCustomizeBtn.dataset.bound !== '1') {
    humanCustomizeBtn.dataset.bound = '1';
    humanCustomizeBtn.addEventListener('click', () => {
      setTownhallCustomizeOpen('human', !townhallHumanCustomizeOpen);
    });
  }

  const agentCustomizeBtn = el('townhallAgentCustomizeBtn');
  if (agentCustomizeBtn && agentCustomizeBtn.dataset.bound !== '1') {
    agentCustomizeBtn.dataset.bound = '1';
    agentCustomizeBtn.addEventListener('click', () => {
      setTownhallCustomizeOpen('agent', !townhallAgentCustomizeOpen);
    });
  }

  const humanImageInput = el('townhallHumanImage');
  if (humanImageInput && humanImageInput.dataset.bound !== '1') {
    humanImageInput.dataset.bound = '1';
    humanImageInput.addEventListener('change', () => {
      onTownhallImageChanged('human', humanImageInput).catch((e) => {
        setTownhallRegisterFeedback(`Avatar upload failed: ${e.message}`, true);
      });
    });
  }

  const agentImageInput = el('townhallAgentImage');
  if (agentImageInput && agentImageInput.dataset.bound !== '1') {
    agentImageInput.dataset.bound = '1';
    agentImageInput.addEventListener('change', () => {
      onTownhallImageChanged('agent', agentImageInput).catch((e) => {
        setTownhallRegisterFeedback(`Avatar upload failed: ${e.message}`, true);
      });
    });
  }

  ensureTownhallMintConfig()
    .then((cfg) => {
      applyTownhallMintConfig(cfg);
    })
    .catch(() => {
      applyTownhallMintConfig(fallbackTownhallMintConfig());
    });
}

function syncTownhallRegistrationUI(state) {
  const panel = el('townhallRegisterPanel');
  if (!panel) return;

  const onboarding = state?.onboarding || {};
  const profile = onboarding.profile || {};
  const humanAvatar = profile.humanAvatar || {};
  const agentAvatar = profile.agentAvatar || {};
  const required = onboardingRequired(state);
  const hasHouse = !!(state?.houseId || walletHouseId);
  const registrationComplete = isTownhallRegistrationComplete(state);

  const humanNameInput = el('townhallHumanName');
  syncTownhallInputValue(humanNameInput, profile.humanName || '');
  const agentNameInput = el('townhallAgentName');
  syncTownhallInputValue(agentNameInput, profile.agentName || '');

  const humanPromptInput = el('townhallHumanPrompt');
  syncTownhallInputValue(humanPromptInput, humanAvatar.prompt || '');
  const agentPromptInput = el('townhallAgentPrompt');
  syncTownhallInputValue(agentPromptInput, agentAvatar.prompt || '');

  const onboardingMint = normalizeTownhallMintDraftFromOnboarding(onboarding);
  if (!townhallMintDraftDirty || registrationComplete) {
    townhallMintDraft = onboardingMint;
    townhallMintDraftDirty = false;
  }
  if (!townhallMintInFlight) {
    if (townhallMintLastErrorStep && !registrationComplete) {
      syncTownhallMintChecklist(townhallMintDraft, { errorStep: townhallMintLastErrorStep });
    } else {
      syncTownhallMintChecklist(townhallMintDraft);
    }
  }

  const humanImage = pendingTownhallHumanImage || humanAvatar.image || null;
  const agentImage = pendingTownhallAgentImage || agentAvatar.image || null;
  setTownhallAvatarPreview('human', humanImage);
  setTownhallAvatarPreview('agent', agentImage);
  setTownhallCustomizeOpen('human', townhallHumanCustomizeOpen);
  setTownhallCustomizeOpen('agent', townhallAgentCustomizeOpen);

  if (hasHouse) {
    townhallAwaitingContinue = false;
    townhallSigilUnlockedByContinue = true;
  } else if (registrationComplete && !townhallAwaitingContinue) {
    townhallSigilUnlockedByContinue = true;
  } else if (!registrationComplete && required && !townhallAwaitingContinue) {
    townhallSigilUnlockedByContinue = false;
  } else if (!required) {
    townhallSigilUnlockedByContinue = true;
  }

  if (registrationComplete || hasHouse || townhallMintInFlight || townhallAwaitingContinue || townhallStoryStep === 'processing') {
    setTownhallStoryStep('processing');
  } else if (townhallStoryStep !== 'agent') {
    setTownhallStoryStep('human');
  }

  const registerState = el('townhallRegisterState');
  if (registerState) registerState.textContent = registrationComplete ? 'Registered' : 'Not registered';

  const continueBtn = el('townhallContinueBtn');
  if (continueBtn) {
    const canContinue = (registrationComplete || hasHouse) && !townhallMintInFlight;
    continueBtn.disabled = !canContinue;
  }

  const gateHint = el('townHallGateHint');
  if (gateHint) {
    if (hasHouse) {
      gateHint.textContent = 'House unlocked. Explore town freely.';
    } else if (registrationComplete) {
      gateHint.textContent = 'Registration complete.';
    } else if (required) {
      gateHint.textContent = 'Complete Town Hall onboarding to continue.';
    } else {
      gateHint.textContent = 'Town Hall onboarding is optional here.';
    }
  }

  const canUseSigil = canUseTownhallSigilFlow(state);
  const showSigil = canUseSigil && (townhallSigilUnlockedByContinue || !required || hasHouse);
  const sigilFlow = el('townhallSigilFlow');
  if (sigilFlow) sigilFlow.classList.toggle('is-hidden', !showSigil);
  panel.classList.toggle('is-hidden', required && registrationComplete && !hasHouse && showSigil);

  bindTownhallRegistrationControls();
}

function bindTownDistrictControls() {
  if (lastState) syncTownhallRegistrationUI(lastState);

  const connectWalletBtn = el('connectWalletBtn');
  if (connectWalletBtn) {
    connectWalletBtn.onclick = async () => {
      connectWalletBtn.disabled = true;
      setWalletStatus('');
      try {
        if (walletAddr) {
          await disconnectWallet();
          await maybeResetAfterWalletDisconnect();
        } else {
          await connectWalletAndLookup();
        }
      } catch (e) {
        const msg = e.message === 'NO_SOLANA_WALLET'
          ? 'No Privy-connected Solana wallet found.'
          : e.message === 'NO_SOLANA_SIGN'
            ? 'Wallet does not support message signing.'
            : e.message === 'BAD_SIGNATURE'
              ? 'Wallet signature failed.'
              : e.message;
        setWalletStatus(msg, true);
      } finally {
        connectWalletBtn.disabled = false;
        updateWalletUI();
      }
    };
  }

  const pathHumanBtn = el('pathHumanBtn');
  if (pathHumanBtn) {
    pathHumanBtn.onclick = () => setPathMode('human');
  }

  const pathCoopBtn = el('pathCoopBtn');
  if (pathCoopBtn) {
    pathCoopBtn.onclick = () => setPathMode('coop');
  }

  const pathAgentBtn = el('pathAgentBtn');
  if (pathAgentBtn) {
    pathAgentBtn.onclick = () => setPathMode('agent');
  }

  const tokenVerifyBtn = el('tokenVerifyBtn');
  if (tokenVerifyBtn) {
    tokenVerifyBtn.onclick = async () => {
      setTokenError('');
      setTokenStatus({ active: true, good: false, text: 'Checking wallet…' });
      tokenVerifyBtn.disabled = true;
      try {
        const result = await verifyTokenOwnership();
        if (result?.eligible) {
          setTokenStatus({ active: true, good: true, text: 'Verified' });
        } else {
          setTokenStatus({ active: true, good: false, text: 'No $ELIZATOWN found' });
        }
      } catch (e) {
        const msg = e.message === 'ALREADY_SIGNED_UP'
          ? 'This session already signed up.'
          : e.message === 'BAD_SIGNATURE'
            ? 'Wallet signature failed.'
            : e.message === 'SIGNATURE_FORMAT'
              ? 'Wallet signature failed.'
              : e.message === 'RPC_UNAVAILABLE'
                ? 'Token check is unavailable. Try again.'
                : e.message === 'NO_SOLANA_WALLET'
                  ? 'No Privy-connected Solana wallet found.'
                  : e.message === 'NO_SOLANA_SIGN'
                    ? 'Wallet does not support message signing.'
                    : e.message;
        setTokenError(msg);
        setTokenStatus({ active: true, good: false, text: 'Check failed' });
      } finally {
        tokenVerifyBtn.disabled = false;
      }
    };
  }

  const copyTeam = el('copyTeam');
  if (copyTeam) {
    copyTeam.onclick = async () => {
      const msg = readTextContent('teamSnippet');
      try {
        await navigator.clipboard.writeText(msg);
        copyTeam.textContent = 'Copied ✓';
        setTimeout(() => (copyTeam.textContent = 'Copy team message'), 1200);
      } catch {
        alert(msg);
      }
    };
  }

  const copyHouse = el('copyHouse');
  if (copyHouse) {
    copyHouse.onclick = async () => {
      const msg = readTextContent('houseSnippet');
      try {
        await navigator.clipboard.writeText(msg);
        copyHouse.textContent = 'Copied ✓';
        setTimeout(() => (copyHouse.textContent = 'Copy house message'), 1200);
      } catch {
        alert(msg);
      }
    };
  }

  const openBtn = el('openBtn');
  if (openBtn) {
    openBtn.onclick = async () => {
      const openError = safeSetText('openError');
      if (openError) openError.textContent = '';
      try {
        await api('/api/human/open/press', {
          method: 'POST',
          body: JSON.stringify({})
        });
      } catch (e) {
        if (openError) openError.textContent = `Error: ${e.message}`;
      }
    };
  }
}

function isBlankOrModifierClick(event) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
}

function routeHasSameOrigin(rawHref) {
  try {
    const url = new URL(rawHref, window.location.href);
    return url.origin === window.location.origin;
  } catch {
    return false;
  }
}

function resolveDistrictRoute(rawHref) {
  try {
    const url = new URL(rawHref, window.location.href);
    if (url.origin !== window.location.origin) return null;
    const path = url.pathname;
    if (popupDistrictByPath[path]) {
      return { mode: 'district', district: popupDistrictByPath[path] };
    }
    return null;
  } catch {
    return null;
  }
}

function routeToPopupMode(rawHref) {
  let parsed;
  try {
    parsed = new URL(rawHref, window.location.href);
  } catch {
    return null;
  }
  if (parsed.origin !== window.location.origin) return null;

  const route = resolveDistrictRoute(parsed.pathname);
  if (route) return route;

  const path = parsed.pathname;
  if (path === '/app' || path === '/') {
    return { mode: 'leave', url: parsed.pathname };
  }
  if (path === '/start') {
    return { mode: 'leave', url: '/start' };
  }
  if (path === '/inbox' || path.startsWith('/inbox/')) {
    return {
      mode: 'leave',
      url: `${parsed.pathname}${parsed.search}${parsed.hash}`
    };
  }
  if (path === '/create') {
    return {
      mode: 'leave',
      url: `${parsed.pathname}${parsed.search}${parsed.hash}`
    };
  }
  if (path === '/claim-wallet' || path === '/claim') {
    return {
      mode: 'leave',
      url: path === '/claim' ? '/claim' : '/claim-wallet'
    };
  }
  if (path === '/wall') {
    return { mode: 'district', district: 'leaderboard' };
  }
  if (path.startsWith('/s/')) {
    return {
      mode: 'frame',
      url: `${parsed.pathname}${parsed.search}${parsed.hash}`,
      title: 'Share'
    };
  }

  if (path === '/house') {
    return { mode: 'district', district: 'house' };
  }

  return {
    mode: 'leave',
    url: `${parsed.pathname}${parsed.search}${parsed.hash}`
  };
}

function extractSafeUrlFromEventTarget(linkEl) {
  if (!linkEl) return '';
  if (linkEl.getAttribute('target') === '_blank') return null;
  if (linkEl.hasAttribute('download')) return null;
  const href = linkEl.getAttribute('href');
  if (!href || href.startsWith('javascript:') || href.startsWith('#')) return null;
  if (!routeHasSameOrigin(href)) return null;
  return href;
}

function onDistrictModalLinkClick(ev) {
  const anchor = ev.target && ev.target.closest ? ev.target.closest('a') : null;
  if (!anchor) return;
  if (isBlankOrModifierClick(ev)) return;
  const safeHref = extractSafeUrlFromEventTarget(anchor);
  if (!safeHref) return;
  const resolved = routeToPopupMode(safeHref);
  if (!resolved) return;
  ev.preventDefault();
  if (resolved.mode === 'district') {
    showDistrict(resolved.district);
    return;
  }
  if (resolved.mode === 'leave') {
    hideDistrict();
    window.location.assign(resolved.url);
    return;
  }
  if (resolved.mode === 'frame') {
    openRouteInModalFrame(resolved.url, resolved.title);
    return;
  }
}

function setDistrictModalMode(mode) {
  const modal = document.querySelector('#districtModalBackdrop .districtModal');
  if (!modal) return;
  modal.classList.toggle('is-district', mode === 'district');
  modal.classList.toggle('is-frame', mode === 'frame');
}

function openRouteInModalFrame(url, title) {
  if (!isTownHub) return;

  const body = el('districtModalBody');
  const backdrop = el('districtModalBackdrop');
  const modalTitle = el('districtModalTitle');
  const safeTitle = title || 'District detail';
  const loadId = ++lastDistrictLoad;
  currentDistrict = null;
  clearTownBoardPoll();
  setDistrictModalMode('frame');

  if (body) {
    if (modalTitle) modalTitle.textContent = safeTitle;
    body.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'districtFrameWrap';
    const frame = document.createElement('iframe');
    frame.className = 'districtFrame';
    frame.title = safeTitle;
    frame.loading = 'eager';
    frame.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    frame.src = url;
    wrap.appendChild(frame);
    body.appendChild(wrap);
    setModalBusy(true);
    frame.addEventListener('load', () => {
      if (loadId !== lastDistrictLoad) return;
      setModalBusy(false);
    });
    frame.addEventListener('error', () => {
      if (loadId !== lastDistrictLoad) return;
      setModalBusy(false);
      body.innerHTML = '<p class="small" style="color: var(--bad)">Could not load this page.</p>';
    });
    if (backdrop) backdrop.classList.remove('is-hidden');
    backdrop.setAttribute('aria-hidden', 'false');
    document.body.classList.add('district-modal-open');
  }
}

async function showDistrict(district) {
  if (!isTownHub) return;

  const safeDistrict = normalizeDistrict(district);
  if (isTownhallGateLocked(lastState) && safeDistrict !== 'townhall') {
    setActiveDistrict('townhall');
    const status = el('townSceneStatus');
    if (status) status.textContent = 'Locked: complete Town Hall onboarding first.';
    return;
  }
  const currentLoad = ++lastDistrictLoad;
  currentDistrict = safeDistrict;
  setActiveDistrict(safeDistrict);

  const modal = el('districtModalBackdrop');
  const body = el('districtModalBody');
  const title = el('districtModalTitle');
  const cfg = districtViews[safeDistrict] || districtViews.house;
  setDistrictModalMode('district');

  if (title) title.textContent = cfg.title;
  if (modal) modal.classList.remove('is-hidden');
  if (modal) modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('district-modal-open');
  setModalBusy(true);

  try {
    const html = await loadDistrictView(safeDistrict);
    if (lastDistrictLoad !== currentLoad) return;
    if (body) {
      body.innerHTML = html;
      if (body.classList.contains('is-loading')) body.classList.remove('is-loading');
    }
    if (lastState) {
      updateUI(lastState);
    }
    setModalBusy(false);
    bindTownDistrictControls();
    if (safeDistrict === 'leaderboard') {
      scheduleTownBoardPoll();
    } else {
      clearTownBoardPoll();
    }
  } catch (e) {
    if (lastDistrictLoad !== currentLoad) return;
    if (body) {
      body.classList.remove('is-loading');
      body.innerHTML = `<p class="small" style="color: var(--bad)">Could not load this district: ${e.message}</p>`;
    }
    console.warn('Failed to load district view', e);
  }
}

function hideDistrict() {
  if (isTownhallGateLocked(lastState)) return;
  const modal = el('districtModalBackdrop');
  currentDistrict = null;
  lastDistrictLoad += 1;
  clearTouchDistrictPrime();
  setDistrictModalMode('district');
  if (modal) modal.classList.add('is-hidden');
  if (modal) modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('district-modal-open');
  const body = el('districtModalBody');
  if (body) {
    body.innerHTML = '';
    body.classList.remove('is-loading');
  }
  clearTownBoardPoll();
}

function updateTownHubLinks(houseId) {
  const targetHousePath = houseId ? `/house?house=${encodeURIComponent(houseId)}` : '/house';
  const targetInboxPath = houseId ? `/inbox/${encodeURIComponent(houseId)}` : '#';

  const townHallHouseLink = el('townHallHouseLink');
  if (townHallHouseLink) townHallHouseLink.href = targetHousePath;

  const townHallStatus = el('townHallStatus');
  if (townHallStatus) {
    townHallStatus.textContent = houseId
      ? `House ${houseId} is available. Continue ERC-8004 ceremony and image updates.`
      : 'Connect or recover a house first, then continue ERC-8004 ceremony and picture updates.';
  }

  const ponyInboxLink = el('ponyInboxLink');
  if (ponyInboxLink) {
    ponyInboxLink.href = targetInboxPath;
    ponyInboxLink.setAttribute('aria-disabled', houseId ? 'false' : 'true');
  }

  const ponyInboxHint = el('ponyInboxHint');
  if (ponyInboxHint) {
    ponyInboxHint.textContent = houseId
      ? `Inbox route ready for house ${houseId}.`
      : 'Connect or recover a house to open a house-scoped inbox directly.';
  }
}

function toggleAgentOnly(show) {
  document.querySelectorAll('.agent-only').forEach((el) => {
    el.classList.toggle('is-hidden', !show);
  });
}

function buildWalletLookupMessage({ address, nonce, houseId }) {
  const parts = ['ElizaTown House Lookup', `address: ${address}`, `nonce: ${nonce}`];
  if (houseId) parts.push(`houseId: ${houseId}`);
  return parts.join('\n');
}

function buildTokenCheckMessage({ address, nonce }) {
  return ['ElizaTown Token Check', `address: ${address}`, `CA: ${TOKEN_MINT}`, `nonce: ${nonce}`].join('\n');
}

async function connectWallet({ silent = false } = {}) {
  if (!appWalletClient) throw new Error('NO_SOLANA_WALLET');
  const previousAddr = walletAddr;
  const connected = await appWalletClient.connect({ chain: 'solana', silent: !!silent });
  bindWalletEvents();
  walletAddr = connected?.address || appWalletClient.getAddress({ chain: 'solana' }) || null;
  if (!walletAddr) throw new Error('NO_SOLANA_PUBKEY');
  if (previousAddr && previousAddr !== walletAddr) {
    walletHouseId = null;
    walletRecovered = false;
  }
  updateWalletUI();
  saveWalletCache();
}

async function disconnectWallet({ fromProvider = false } = {}) {
  if (!fromProvider && appWalletClient) {
    try {
      await appWalletClient.disconnect({ chain: 'solana' });
    } catch {
      // ignore disconnect errors; we still clear local state
    }
  }
  unbindWalletEvents();
  walletAddr = null;
  walletHouseId = null;
  walletRecovered = false;
  updateWalletUI();
  clearWalletCache();
  if (lastState) updateUI(lastState);
}

function clearClientFlowState() {
  try {
    localStorage.removeItem(WALLET_STORAGE_KEY);
    localStorage.removeItem(PATH_STORAGE_KEY);
    localStorage.removeItem(LEGACY_PATH_STORAGE_KEY);
    localStorage.removeItem(TOKEN_ERROR_KEY);
    localStorage.removeItem(SIGNUP_COMPLETE_AT_KEY);
    localStorage.removeItem(SHARE_CACHE_KEY);
  } catch {
    // ignore storage errors
  }
}

async function resetSessionAndReload() {
  try {
    await api('/api/session/reset', { method: 'POST', body: JSON.stringify({}) });
  } catch (e) {
    console.warn('session reset failed', e);
  }
  clearClientFlowState();
  // Full reload so we pick up the new `et_session` cookie.
  window.location.replace('/');
}

async function maybeResetAfterWalletDisconnect() {
  // Auto-reset when this session is carrying identity-bound progress.
  // This includes:
  // - existing house session (shared-device safety)
  // - token-verified human flow on the landing page
  const shouldResetForState = (st) => !!(
    st && (
      st.houseId
      || (st.signup?.complete && (st.signup?.mode === 'token' || st.signup?.mode === 'claim'))
    )
  );

  if (shouldResetForState(lastState)) {
    await resetSessionAndReload();
    return;
  }
  try {
    const st = await api('/api/state');
    if (shouldResetForState(st)) {
      await resetSessionAndReload();
    }
  } catch {
    // ignore
  }
}

async function lookupWalletHouse(houseIdOverride = null) {
  if (!walletAddr) throw new Error('WALLET_NOT_CONNECTED');
  if (!appWalletClient) throw new Error('NO_SOLANA_WALLET');
  const nonceResp = await api('/api/wallet/nonce');
  const msg = buildWalletLookupMessage({
    address: walletAddr,
    nonce: nonceResp.nonce,
    houseId: houseIdOverride || null
  });
  const sigArr = await appWalletClient.signMessage({ chain: 'solana', message: msg });
  const signature = b64(sigArr);
  const body = {
    address: walletAddr,
    nonce: nonceResp.nonce,
    signature
  };
  if (houseIdOverride) body.houseId = houseIdOverride;
  const lookup = await api('/api/wallet/lookup', { method: 'POST', body: JSON.stringify(body) });
  return lookup;
}

async function connectWalletAndLookup({ silent = false } = {}) {
  await connectWallet({ silent });
  setWalletStatus('Wallet connected. Checking for houses…');
  const lookup = await lookupWalletHouse();
  if (lookup.houseId) {
    walletHouseId = lookup.houseId;
    walletRecovered = true;
    setWalletStatus('Welcome back. House found.');
    if (lastState) updateUI({ ...lastState, houseId: lookup.houseId });
  } else {
    walletHouseId = null;
    walletRecovered = false;
    setWalletStatus('No houses found for this wallet yet.');
    if (lastState) updateUI({ ...lastState, houseId: null });
  }
  saveWalletCache();
}

async function restoreWalletConnection() {
  const cached = loadWalletCache();
  if (!cached || !cached.address) return;
  try {
    await connectWallet({ silent: true });
  } catch {
    clearWalletCache();
    updateWalletUI();
    return;
  }
  if (cached.houseId) {
    walletHouseId = cached.houseId;
    walletRecovered = true;
    if (lastState) updateUI({ ...lastState, houseId: cached.houseId });
  }
  setWalletStatus('Wallet connected.');
  saveWalletCache();
}

async function verifyTokenOwnership() {
  if (!walletAddr) {
    await connectWallet();
  }
  if (!walletAddr) throw new Error('WALLET_NOT_CONNECTED');
  if (!appWalletClient) throw new Error('NO_SOLANA_WALLET');
  const nonceResp = await api('/api/token/nonce');
  const msg = buildTokenCheckMessage({ address: walletAddr, nonce: nonceResp.nonce });
  const sigArr = await appWalletClient.signMessage({ chain: 'solana', message: msg });
  const signature = b64(sigArr);
  const result = await api('/api/token/verify', {
    method: 'POST',
    body: JSON.stringify({ address: walletAddr, nonce: nonceResp.nonce, signature })
  });
  return result;
}

function updateAgentStatus(dotId, textId, connected, name) {
  const dot = el(dotId);
  const text = el(textId);
  if (!dot || !text) return;
  dot.className = `dot ${connected ? 'good' : ''}`;
  text.textContent = connected ? `Agent connected${name ? `: ${name}` : ''}` : 'Agent not connected';
}

function setTokenStatus({ active = false, good = false, text = '' } = {}) {
  const pill = el('tokenStatus');
  const dot = el('tokenDot');
  const label = el('tokenStatusText');
  if (!pill || !dot || !label) return;
  pill.classList.toggle('is-hidden', !active);
  dot.className = `dot ${good ? 'good' : ''}`;
  label.textContent = text || '';
}

function setReconnectMode({ houseReady, role }) {
  const reconnect = el('reconnectPanel');
  const step1 = el('step1Panel');
  const step2 = el('step2Panel');
  const divider = el('stepDivider');
  const tokenPanel = el('tokenPanel');

  const showReconnect = !!houseReady;

  // role = human | coop | agent
  const showToken = role === 'human' && !showReconnect;
  const showStep1 = (role === 'coop' || role === 'agent') && !showReconnect;
  const showStep2 = role === 'coop' && !showReconnect;

  if (reconnect) reconnect.classList.toggle('is-hidden', !showReconnect);
  if (tokenPanel) tokenPanel.classList.toggle('is-hidden', !showToken);

  if (step1) step1.classList.toggle('is-hidden', !showStep1);
  if (step2) step2.classList.toggle('is-hidden', !showStep2);
  if (divider) divider.classList.toggle('is-hidden', !(showStep1 || showStep2));
}

function renderSigils(state) {
  const grid = el('sigilGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const humanSel = state.human?.selected || null;
  const agentSel = state.agent?.selected || null;

  for (const item of elements) {
    const btn = document.createElement('button');
    btn.className = 'btn sigil';
    btn.type = 'button';
    btn.dataset.elementId = item.id;
    btn.setAttribute('data-testid', `sigil-${item.id}`);

    const left = document.createElement('div');
    const icon = item.icon ? `<span class="sigilIcon" aria-hidden="true">${item.icon}</span>` : '';
    left.innerHTML = `<div class="name">${icon}<span>${item.label}</span></div><div class="hint">click to pick</div>`;

    const right = document.createElement('div');
    right.style.display = 'grid';
    right.style.gap = '6px';
    right.style.justifyItems = 'end';

    const you = document.createElement('div');
    you.className = 'pill';
    you.style.padding = '4px 8px';
    you.textContent = humanSel === item.id ? 'you' : '';

    const agent = document.createElement('div');
    agent.className = 'pill';
    agent.style.padding = '4px 8px';
    agent.textContent = agentSel === item.id ? 'agent' : '';

    right.appendChild(you);
    right.appendChild(agent);

    btn.appendChild(left);
    btn.appendChild(right);

    if (humanSel === item.id || agentSel === item.id) {
      btn.classList.add('selected');
    }

    btn.addEventListener('click', async () => {
      try {
        await api('/api/human/select', {
          method: 'POST',
          body: JSON.stringify({ elementId: item.id })
        });
      } catch (e) {
        console.warn(e);
      }
    });

    grid.appendChild(btn);
  }
}

function syncTownhallGate(state) {
  if (!isTownHub) return;
  const gateLocked = isTownhallGateLocked(state);
  applyDistrictHotspotLocks(state);

  const closeBtn = el('districtModalClose');
  if (closeBtn) {
    closeBtn.classList.toggle('is-hidden', gateLocked);
    closeBtn.disabled = gateLocked;
  }

  if (!gateLocked) return;

  const status = el('townSceneStatus');
  if (status) status.textContent = 'Town Hall is required until you complete onboarding and generate a house.';

  const backdrop = el('districtModalBackdrop');
  const modalHidden = !backdrop || backdrop.classList.contains('is-hidden');
  if (currentDistrict !== 'townhall' || modalHidden) {
    showDistrict('townhall');
  }
}

function updateUI(state) {
  lastState = state;

  const houseId = state.houseId || walletHouseId || null;
  const signupMode = state.signup?.mode || (state.signup?.complete ? 'agent' : null);
  if ((signupMode === 'token' || signupMode === 'claim') && pathMode !== 'human') {
    setPathMode('human', { persist: true, refresh: false });
  }
  const tokenMode = pathMode === 'human' || signupMode === 'token' || signupMode === 'claim';

  // Counts (optional on index)
  safeSetText('signupCount', String(state.stats?.signups ?? '—'));

  // Team code (fallback for older servers that still send pairCode)
  const teamCode = state.teamCode || state.pairCode || '…';
  safeSetText('teamCode', teamCode);

  const origin = window.location.origin;
  safeSetText(
    'teamSnippet',
    pathMode === 'agent'
      ? `Use this base URL (${origin}) and connect with team code: ${teamCode}`
      : `Read ${origin}/skill.md and team with code: ${teamCode}`
  );

  const houseNavLink = el('houseNavLink');
  if (houseNavLink) {
    if (houseId) {
      houseNavLink.classList.remove('is-hidden');
      houseNavLink.href = `/house?house=${encodeURIComponent(houseId)}`;
    } else {
      houseNavLink.classList.add('is-hidden');
      houseNavLink.href = '/house';
    }
  }
  updateTownHubLinks(houseId);
  syncTownhallRegistrationUI(state);
  syncTownhallGate(state);

  updatePathButtons();
  safeSetText(
    'pathNote',
    pathMode === 'human'
      ? 'Human mode: solo house (token) + wallet reconnect.'
      : pathMode === 'agent'
        ? 'Agent mode: read skill.md and connect using a team code from a human.'
        : 'Co-op mode: human + agent unlock together.'
  );

  // Agent status
  const connected = !!state.agent?.connected;
  updateAgentStatus('agentDot', 'agentStatusText', connected, state.agent?.name || null);
  updateAgentStatus('agentDotHouse', 'agentStatusTextHouse', connected, state.agent?.name || null);

  setReconnectMode({ houseReady: !!houseId, role: pathMode });
  toggleAgentOnly(pathMode !== 'human');

  const tokenComplete = !!state.signup?.complete && (signupMode === 'token' || signupMode === 'claim');
  const tokenCreateLink = el('tokenCreateLink');
  if (tokenCreateLink) {
    tokenCreateLink.style.display = tokenComplete ? 'inline-flex' : 'none';
    if (tokenComplete) tokenCreateLink.href = '/create?mode=token';
  }
  if (tokenComplete) {
    setTokenStatus({ active: true, good: true, text: 'Verified' });
  } else if (!tokenMode) {
    setTokenStatus({ active: false });
  }

  if (houseId) {
    if (tokenMode) {
      safeSetText('reconnectTitle', 'House ready');
      safeSetText('reconnectIntro', 'Your house is ready. Open it to unlock with your wallet.');
    } else if (walletRecovered) {
      safeSetText('reconnectTitle', 'Welcome back');
      safeSetText('reconnectIntro', 'We found a house for this wallet. Share this reconnect message with your agent if needed.');
    } else {
      safeSetText('reconnectTitle', 'Reconnect to House');
      safeSetText('reconnectIntro', 'Your house is ready. Share this reconnect message with your agent if needed.');
    }
    safeSetText('houseSnippet', `Read ${origin}/skill.md and reconnect to your house.`);
    const openHouseLink = el('openHouseLink');
    if (openHouseLink) openHouseLink.href = `/house?house=${encodeURIComponent(houseId)}`;
    return;
  }

  const matched = !!state.match?.matched;
  const matchState = el('matchState');
  if (matchState) {
    matchState.textContent = matched ? 'UNLOCKED' : 'LOCKED';
    matchState.className = `state ${matched ? 'good' : 'bad'}`;
  }

  safeSetText('matchDetail', matched
    ? `Matched on “${state.match?.elementId || ''}”. Now press Open together.`
    : 'Pick the same sigil to unlock.'
  );

  const openBtn = el('openBtn');
  if (openBtn) openBtn.disabled = !matched;

  const complete = !!state.signup?.complete && signupMode === 'agent';
  const openReady = el('openReady');
  if (openReady) openReady.style.display = complete ? 'inline-flex' : 'none';

  const waiting = !!state.human?.openPressed && !complete;
  const waitingNode = el('openWaiting');
  if (waitingNode) waitingNode.style.display = waiting ? 'inline-flex' : 'none';

  // Sigils
  renderSigils(state);

  // Auto-redirect only once per completed signup.
  let freshComplete = false;
  if (complete && state.signup?.createdAt) {
    try {
      const key = SIGNUP_COMPLETE_AT_KEY;
      const last = localStorage.getItem(key);
      if (last !== state.signup.createdAt) {
        localStorage.setItem(key, state.signup.createdAt);
        freshComplete = true;
      }
    } catch {
      freshComplete = true;
    }
  }
  if (complete && freshComplete && !redirecting) {
    redirecting = true;
    // small delay for perceived continuity
    setTimeout(() => {
      window.location.href = '/create';
    }, 150);
  }
}

async function poll() {
  try {
    const state = await api('/api/state');
    updateUI(state);
  } catch (e) {
    console.warn('state poll failed', e);
  } finally {
    setTimeout(poll, 800);
  }
}

async function init() {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref');
  if (ref) {
    try {
      await api('/api/referral', { method: 'POST', body: JSON.stringify({ shareId: ref }) });
    } catch {
      // ignore invalid referral
    }
    params.delete('ref');
    const qs = params.toString();
    const nextUrl = `${window.location.pathname}${qs ? `?${qs}` : ''}`;
    window.history.replaceState({}, '', nextUrl);
  }

  const tokenErr = loadTokenError();
  const modeParam = params.get('mode');
  const districtParam = params.get('district');
  pathMode = (modeParam === 'human' || modeParam === 'coop' || modeParam === 'agent')
    ? modeParam
    : loadPathMode();
  const initialDistrict = normalizeDistrict(districtParam || 'house');
  activeDistrict = initialDistrict;
  updatePathButtons();
  setActiveDistrict(initialDistrict);

  if (isTownHub) {
    bindDistrictMapInteractions();

    const closeBtn = el('districtModalClose');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => hideDistrict());
    }

    const backdrop = el('districtModalBackdrop');
    if (backdrop) {
      backdrop.addEventListener('click', (ev) => {
        if (ev.target === backdrop) hideDistrict();
      });
    }

    const modalBody = el('districtModalBody');
    if (modalBody) {
      modalBody.addEventListener('click', onDistrictModalLinkClick);
    }
  }

  const canRun = await ensurePrivyAuthenticatedForHub();
  if (!canRun) return;

  const session = await api('/api/session');
  elements = session.elements || [];
  // Update UI quickly using /api/state next.
  updateUI({
    teamCode: session.teamCode,
    elements,
    agent: { connected: false },
    human: {},
    match: { matched: false },
    signup: { complete: false, mode: null },
    share: { id: null },
    onboarding: session.onboarding || { required: false, registrationComplete: true },
    stats: session.stats
  });

  if (isTownHub) {
    await showDistrict(activeDistrict);
  }

  if (tokenErr) {
    setPathMode('human', { persist: true, refresh: true });
    setTokenError(tokenErr);
    setTokenStatus({ active: true, good: false, text: 'Verify wallet to continue' });
  }

  updateWalletUI();
  restoreWalletConnection();
  poll();
}

init().catch((e) => {
  console.error(e);
});
