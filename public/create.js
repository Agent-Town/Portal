const TEAM_CODE_HINT_STORAGE_KEY = 'agentTown:teamCodeHint';
const WALLET_IDENTITY_HINT_STORAGE_KEY = 'agentTown:walletIdentityHint';
const WALLET_RECOVERY_KEY_STORAGE_KEY = 'agentTown:walletRecoveryKey';
const WALLET_STORAGE_KEY = 'agentTownWallet';
const WALLET_IDENTITY_EVM_HEADER = 'x-wallet-evm-address';
const WALLET_IDENTITY_SOLANA_HEADER = 'x-wallet-solana-address';
const WALLET_RECOVERY_INTENT_HEADER = 'x-wallet-recovery-intent';
const CREATE_EMBED_QUERY_KEY = 'embed';

const isCeremonyEmbedMode = (() => {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get(CREATE_EMBED_QUERY_KEY) === '1' || window.self !== window.top;
  } catch {
    return window.self !== window.top;
  }
})();

if (isCeremonyEmbedMode) {
  document.documentElement.classList.add('ceremony-embed');
}
window.__agentTownCeremonyEmbed = isCeremonyEmbedMode;

function readTeamCodeHint() {
  try {
    return String(localStorage.getItem(TEAM_CODE_HINT_STORAGE_KEY) || '').trim();
  } catch {
    return '';
  }
}

function saveTeamCodeHint(value) {
  const raw = String(value || '').trim().toUpperCase();
  if (!/^TEAM-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(raw)) return;
  try {
    localStorage.setItem(TEAM_CODE_HINT_STORAGE_KEY, raw);
  } catch {
    // ignore storage errors
  }
}

function normalizeEvmAddress(value) {
  const raw = typeof value === 'string' ? value.trim() : '';
  return /^0x[a-fA-F0-9]{40}$/.test(raw) ? raw.toLowerCase() : '';
}

function normalizeSolanaAddress(value) {
  const raw = typeof value === 'string' ? value.trim() : '';
  return /^[1-9A-HJ-NP-Za-km-z]{32,64}$/.test(raw) ? raw : '';
}

function readWalletIdentityHint() {
  try {
    const raw = localStorage.getItem(WALLET_IDENTITY_HINT_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const cacheRaw = localStorage.getItem(WALLET_STORAGE_KEY);
    const cached = cacheRaw ? JSON.parse(cacheRaw) : {};
    return {
      evm: normalizeEvmAddress(parsed?.evm || parsed?.evmAddress || ''),
      solana: normalizeSolanaAddress(parsed?.solana || parsed?.solanaAddress || cached?.address || '')
    };
  } catch {
    return { evm: '', solana: '' };
  }
}

function readWalletRecoveryKey() {
  try {
    const raw = String(localStorage.getItem(WALLET_RECOVERY_KEY_STORAGE_KEY) || '').trim().toLowerCase();
    return /^wrk_[a-f0-9]{64}$/.test(raw) ? raw : '';
  } catch {
    return '';
  }
}

function saveWalletRecoveryKey(value) {
  const key = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (!/^wrk_[a-f0-9]{64}$/.test(key)) return;
  try {
    localStorage.setItem(WALLET_RECOVERY_KEY_STORAGE_KEY, key);
  } catch {
    // ignore storage errors
  }
}

function collectWalletIdentitiesFromClient() {
  const out = [];
  const seen = new Set();
  const add = (chain, address) => {
    const normalizedChain = chain === 'evm' ? 'evm' : chain === 'solana' ? 'solana' : '';
    if (!normalizedChain) return;
    const normalizedAddress = normalizedChain === 'evm'
      ? normalizeEvmAddress(address)
      : normalizeSolanaAddress(address);
    if (!normalizedAddress) return;
    const key = `${normalizedChain}:${normalizedAddress}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ chain: normalizedChain, address: normalizedAddress });
  };

  const walletIdentityHint = readWalletIdentityHint();
  if (walletIdentityHint.solana) add('solana', walletIdentityHint.solana);
  if (walletIdentityHint.evm) add('evm', walletIdentityHint.evm);

  try {
    const cacheRaw = localStorage.getItem(WALLET_STORAGE_KEY);
    const cached = cacheRaw ? JSON.parse(cacheRaw) : null;
    if (cached && typeof cached.address === 'string') add('solana', cached.address);
  } catch {
    // ignore malformed cache
  }

  if (walletClient && typeof walletClient.getAddress === 'function') {
    try {
      add('solana', walletClient.getAddress({ chain: 'solana' }));
    } catch {
      // ignore unavailable wallet state
    }
    try {
      add('evm', walletClient.getAddress({ chain: 'evm' }));
    } catch {
      // ignore unavailable wallet state
    }
  }

  return out;
}

async function api(url, opts = {}) {
  const headers = { 'content-type': 'application/json', ...(opts.headers || {}) };
  const walletIdentities = collectWalletIdentitiesFromClient();
  const walletRecoveryKey = readWalletRecoveryKey();
  for (const { chain, address } of walletIdentities) {
    if (chain === 'evm' && headers[WALLET_IDENTITY_EVM_HEADER] === undefined) {
      headers[WALLET_IDENTITY_EVM_HEADER] = address;
      continue;
    }
    if (chain === 'solana' && headers[WALLET_IDENTITY_SOLANA_HEADER] === undefined) {
      headers[WALLET_IDENTITY_SOLANA_HEADER] = address;
    }
  }
  if (
    walletRecoveryKey
    && headers['x-wallet-recovery-key'] === undefined
    && headers['X-Wallet-Recovery-Key'] === undefined
  ) {
    headers['x-wallet-recovery-key'] = walletRecoveryKey;
  }
  if (
    walletRecoveryKey
    && headers[WALLET_RECOVERY_INTENT_HEADER] === undefined
    && headers['X-Wallet-Recovery-Intent'] === undefined
  ) {
    headers[WALLET_RECOVERY_INTENT_HEADER] = '1';
  }
  const teamCodeHint = readTeamCodeHint();
  if (
    teamCodeHint
    && headers['x-team-code-hint'] === undefined
    && headers['X-Team-Code-Hint'] === undefined
  ) {
    headers['x-team-code-hint'] = teamCodeHint;
  }
  const res = await fetch(url, {
    credentials: 'include',
    cache: 'no-store',
    ...opts,
    headers
  });
  const data = await res.json().catch(() => ({}));
  if (typeof data?.teamCode === 'string') {
    saveTeamCodeHint(data.teamCode);
  }
  if (typeof data?.walletRecoveryKey === 'string') {
    saveWalletRecoveryKey(data.walletRecoveryKey);
  }
  if (!res.ok) {
    const msg = data && data.error ? data.error : `HTTP_${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}

function el(id) {
  return document.getElementById(id);
}

function setShareStatusVisible(visible) {
  const node = el('shareStatus');
  if (!node) return;
  node.classList.toggle('is-hidden', !visible);
}

function setHouseNavLink(houseId) {
  const link = el('houseNavLink');
  if (!link) return;
  if (houseId) {
    link.classList.remove('is-hidden');
    link.href = `/house?house=${encodeURIComponent(houseId)}`;
  } else {
    link.classList.add('is-hidden');
    link.href = '/house';
  }
}

let palette = [];
let pixels = [];
let selectedColor = 1;

let liteDriver = 'vendor';
let liteGatewayPromise = null;
let createSkillTurnPromise = null;
let createSkillLoopEnabled = false;
let createSkillLoopBusy = false;
let createSkillLoopTimer = null;
let createSkillLoopBackoffMs = 900;
let createTeamCode = '';
let createTokenMode = false;

const CREATE_SKILL_COMMIT_GOAL = 'Publish the agent ceremony commit and reveal public key for the current team session.';
const CREATE_SKILL_REVEAL_GOAL = 'Publish the agent ceremony reveal payload (`sealedForHuman`) for the current team session.';
const CREATE_SKILL_MIN_POLL_MS = 650;
const CREATE_SKILL_MAX_POLL_MS = 5_000;

function isVendorLiteDriver() {
  return liteDriver === 'vendor';
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadLiteGateway() {
  if (liteGatewayPromise) return liteGatewayPromise;
  liteGatewayPromise = import('/openclaw-lite/gateway.js')
    .then((mod) => mod?.default || mod)
    .then(async (gatewayOrPromise) => {
      if (gatewayOrPromise && typeof gatewayOrPromise.then === 'function') {
        return await gatewayOrPromise;
      }
      return gatewayOrPromise;
    })
    .then((gateway) => {
      if (!gateway || typeof gateway !== 'object') return null;
      const fallback = window.__openclawLiteTest;
      if (!fallback || typeof fallback !== 'object') return gateway;

      if (typeof gateway.skillState !== 'function' && typeof fallback.skillState === 'function') {
        gateway.skillState = (...args) => fallback.skillState(...args);
      }
      if (typeof gateway.systemPromptPreview !== 'function' && typeof fallback.systemPromptPreview === 'function') {
        gateway.systemPromptPreview = (...args) => fallback.systemPromptPreview(...args);
      }
      if (typeof gateway.experienceRun !== 'function' && typeof fallback.experienceRun === 'function') {
        gateway.experienceRun = (...args) => fallback.experienceRun(...args);
      }
      if (typeof gateway.visitExperience !== 'function' && typeof fallback.visitExperience === 'function') {
        gateway.visitExperience = (...args) => fallback.visitExperience(...args);
      }
      return gateway;
    })
    .catch(() => null);
  return liteGatewayPromise;
}

function isTrustedCreateSkill(skillState) {
  const status = String(skillState?.data?.status || skillState?.status || '').trim().toLowerCase();
  const activePath = String(skillState?.data?.activeSkillPath || skillState?.activeSkillPath || '').trim();
  if (status !== 'ready' || !activePath) return false;

  const sourceUrlRaw = String(skillState?.data?.sourceUrl || skillState?.sourceUrl || '').trim();
  if (!sourceUrlRaw) return false;
  try {
    const sourceUrl = new URL(sourceUrlRaw, window.location.origin);
    return sourceUrl.origin === window.location.origin && sourceUrl.pathname === '/skill.md';
  } catch {
    return false;
  }
}

async function ensureCreateSkillImported() {
  if (!isVendorLiteDriver()) return null;
  const gateway = await loadLiteGateway();
  if (!gateway || typeof gateway.experienceRun !== 'function') throw new Error('RUNTIME_NOT_READY');

  if (typeof gateway.skillState === 'function') {
    const skillState = await gateway.skillState().catch(() => null);
    if (isTrustedCreateSkill(skillState)) return gateway;
  }

  if (typeof gateway.visitExperience === 'function') {
    const visit = await gateway.visitExperience({ url: '/skill.md' });
    if (visit?.ok !== true) {
      const msg = String(visit?.error?.message || visit?.error?.code || 'VISIT_FAILED');
      throw new Error(msg);
    }
  }
  return gateway;
}

async function runCreateSkillTurn({ goal = '', runtimeState = null } = {}) {
  if (!isVendorLiteDriver()) return null;
  if (createSkillTurnPromise) return createSkillTurnPromise;
  createSkillTurnPromise = (async () => {
    const gateway = await ensureCreateSkillImported();
    if (!gateway || typeof gateway.experienceRun !== 'function') throw new Error('RUNTIME_NOT_READY');
    const goalLine = String(goal || '').trim();
    const prompt = [
      'Read SKILL.md and execute exactly the next required safe step for this /create ceremony flow.',
      goalLine ? `Goal: ${goalLine}` : '',
      'Use runtime session context values directly and avoid asking for teamCode/houseId when already provided.',
      'If waiting for human action, stop after one safe check/action.'
    ]
      .filter(Boolean)
      .join('\n');
    const run = await gateway.experienceRun({
      prompt,
      timeoutMs: 60_000,
      recordToTranscript: false,
      emitChat: false,
      runtimeContext: {
        origin: window.location.origin,
        teamCode: String(runtimeState?.teamCode || createTeamCode || ''),
        houseId: String(runtimeState?.houseId || '')
      },
      runtimeState: runtimeState && typeof runtimeState === 'object' ? runtimeState : undefined
    });
    if (run?.ok === false) {
      const msg = String(run?.error?.message || run?.error?.code || 'EXPERIENCE_RUN_FAILED');
      throw new Error(msg);
    }
    return run;
  })();
  try {
    return await createSkillTurnPromise;
  } finally {
    createSkillTurnPromise = null;
  }
}

function resolveCreateSkillGoal(ceremony = {}) {
  if (!ceremony || typeof ceremony !== 'object') return '';
  if (ceremony.humanReveal && !ceremony.agentReveal) return CREATE_SKILL_REVEAL_GOAL;
  if (ceremony.humanCommit && (!ceremony.agentCommit || !ceremony.agentRevealPub)) return CREATE_SKILL_COMMIT_GOAL;
  return '';
}

function resolveCreateSkillGoalFromState(state = {}) {
  const nextAgentAction = String(state?.experience?.nextAgentAction || '').trim();
  if (nextAgentAction === 'agent_town_ceremony_reveal') return CREATE_SKILL_REVEAL_GOAL;
  if (nextAgentAction === 'agent_town_ceremony_commit') return CREATE_SKILL_COMMIT_GOAL;
  return resolveCreateSkillGoal(state?.ceremony || {});
}

function resolveCreateSkillPollDelay(state = {}) {
  const n = Number(state?.experience?.pollMs);
  if (!Number.isFinite(n) || n <= 0) return 1_200;
  return Math.max(CREATE_SKILL_MIN_POLL_MS, Math.min(CREATE_SKILL_MAX_POLL_MS, Math.round(n)));
}

function clearCreateSkillLoopTimer() {
  if (!createSkillLoopTimer) return;
  clearTimeout(createSkillLoopTimer);
  createSkillLoopTimer = null;
}

function scheduleCreateSkillLoop(delayMs = createSkillLoopBackoffMs) {
  if (!createSkillLoopEnabled) return;
  clearCreateSkillLoopTimer();
  const wait = Math.max(CREATE_SKILL_MIN_POLL_MS, Number(delayMs) || CREATE_SKILL_MIN_POLL_MS);
  createSkillLoopTimer = setTimeout(() => {
    createSkillLoopTimer = null;
    runCreateSkillLoopTick().catch(() => { });
  }, wait);
}

function nudgeCreateSkillLoop(delayMs = 120) {
  if (!createSkillLoopEnabled) return;
  scheduleCreateSkillLoop(delayMs);
}

function startCreateSkillLoop({ enabled = false } = {}) {
  createSkillLoopEnabled = enabled && isVendorLiteDriver();
  createSkillLoopBackoffMs = 900;
  clearCreateSkillLoopTimer();
  if (!createSkillLoopEnabled) return;
  scheduleCreateSkillLoop(300);
}

window.addEventListener('beforeunload', () => {
  createSkillLoopEnabled = false;
  clearCreateSkillLoopTimer();
});

async function runCreateSkillLoopTick() {
  if (!createSkillLoopEnabled || createSkillLoopBusy || !isVendorLiteDriver()) return;
  createSkillLoopBusy = true;
  try {
    const state = await api('/api/state').catch(() => null);
    if (!state?.agent?.connected || state?.signup?.mode === 'token') {
      createSkillLoopBackoffMs = resolveCreateSkillPollDelay(state);
      return;
    }

    const goal = resolveCreateSkillGoalFromState(state);
    if (!goal) {
      createSkillLoopBackoffMs = resolveCreateSkillPollDelay(state);
      return;
    }

    await runCreateSkillTurn({ goal, runtimeState: state });
    createSkillLoopBackoffMs = CREATE_SKILL_MIN_POLL_MS;
  } catch {
    createSkillLoopBackoffMs = Math.min(
      CREATE_SKILL_MAX_POLL_MS,
      Math.max(1_000, Math.round(createSkillLoopBackoffMs * 1.6))
    );
  } finally {
    createSkillLoopBusy = false;
    scheduleCreateSkillLoop(createSkillLoopBackoffMs);
  }
}

async function driveAgentCeremonyStep({ needReveal = false } = {}) {
  let material = await api('/api/human/house/material');
  const isReady = () => (needReveal
    ? !!material?.agentRevealSealed
    : !!(material?.agentCommit && material?.agentRevealPub));
  if (isReady()) return material;
  if (!isVendorLiteDriver()) return material;

  const goal = needReveal ? CREATE_SKILL_REVEAL_GOAL : CREATE_SKILL_COMMIT_GOAL;
  const startedAt = Date.now();
  let attempt = 0;

  while (Date.now() - startedAt < 20_000) {
    if (attempt === 0 || attempt % 4 === 0) {
      try {
        await runCreateSkillTurn({ goal });
      } catch {
        // Keep polling material; the loop can recover on later turns.
      }
    } else {
      nudgeCreateSkillLoop(120);
    }
    await delay(350);
    material = await api('/api/human/house/material');
    if (isReady()) return material;
    attempt += 1;
  }
  return material;
}

function applyLocalPixel(x, y, color, w = 16) {
  const idx = y * w + x;
  if (!Number.isInteger(idx) || idx < 0 || idx >= pixels.length) return;
  pixels[idx] = color;
  const canvas = el('canvas');
  const cell = canvas ? canvas.querySelector(`[data-x="${x}"][data-y="${y}"]`) : null;
  if (!cell) return;
  cell.dataset.color = String(color);
  cell.style.background = palette[color] || '#000';
}

const walletClient = window.initWalletClient ? window.initWalletClient() : null;

function renderPalette() {
  const c = el('palette');
  c.innerHTML = '';
  palette.forEach((color, idx) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'swatch' + (idx === selectedColor ? ' selected' : '');
    b.style.background = color;
    b.dataset.color = String(idx);
    b.setAttribute('data-testid', `swatch-${idx}`);
    b.addEventListener('click', () => {
      selectedColor = idx;
      renderPalette();
    });
    c.appendChild(b);
  });
}

function hasInk() {
  return pixels.some((p) => p && p !== 0);
}

function updateLockState() {
  el('shareBtn').disabled = !hasInk();
}

function renderCanvas(w, h) {
  const c = el('canvas');
  c.innerHTML = '';
  c.style.gridTemplateColumns = `repeat(${w}, 18px)`;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pixel';
      b.dataset.x = String(x);
      b.dataset.y = String(y);
      b.dataset.color = String(pixels[idx] || 0);
      b.style.background = palette[pixels[idx] || 0] || '#000';
      b.setAttribute('data-testid', `px-${x}-${y}`);
      b.addEventListener('click', async () => {
        try {
          const humanColor = selectedColor;
          await api('/api/human/canvas/paint', {
            method: 'POST',
            body: JSON.stringify({ x, y, color: humanColor })
          });
          // Optimistically update local human paint first.
          applyLocalPixel(x, y, humanColor, w);
          updateLockState();
        } catch (e) {
          el('err').textContent = e.message;
        }
      });
      c.appendChild(b);
    }
  }
}

function patchCanvas(w, h, nextPixels) {
  // Update only changed cells.
  const c = el('canvas');
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (pixels[idx] === nextPixels[idx]) continue;
      pixels[idx] = nextPixels[idx];
      const cell = c.querySelector(`[data-x="${x}"][data-y="${y}"]`);
      if (!cell) continue;
      cell.dataset.color = String(nextPixels[idx]);
      cell.style.background = palette[nextPixels[idx]] || '#000';
    }
  }
  updateLockState();
}

async function pollCanvas() {
  try {
    const state = await api('/api/canvas/state');
    if (!Array.isArray(state.canvas?.pixels)) return;
    patchCanvas(state.canvas.w, state.canvas.h, state.canvas.pixels);
  } catch (e) {
    // ignore transient
  } finally {
    setTimeout(pollCanvas, 700);
  }
}

async function init() {
  // Gate: if not signed up, go home.
  const st = await api('/api/state');
  liteDriver = typeof st?.lite?.driver === 'string' ? st.lite.driver : 'vendor';
  setHouseNavLink(st.houseId || null);
  const params = new URLSearchParams(window.location.search);
  const requestedToken = params.get('mode') === 'token';
  const signupMode = st.signup?.mode || (st.signup?.complete ? 'agent' : null);
  const tokenMode = signupMode === 'token';
  createTokenMode = tokenMode;
  const claimMode = signupMode === 'claim';
  const soloMode = tokenMode || claimMode;
  const tokenAddress = st.signup?.address || null;
  createTeamCode = typeof st?.teamCode === 'string' ? st.teamCode.trim() : '';
  if (st.signup?.complete && st.signup?.createdAt) {
    try {
      localStorage.setItem('agentTownSignupCompleteAt', st.signup.createdAt);
    } catch {
      // ignore storage failures
    }
  }
  if (!st.signup?.complete) {
    window.location.href = '/';
    return;
  }
  if (requestedToken && !soloMode) {
    try {
      localStorage.setItem('agentTownPathMode', 'token');
      localStorage.setItem('agentTownTokenError', 'Verify your wallet to create a token-gated house.');
    } catch {
      // ignore storage errors
    }
    window.location.href = '/';
    return;
  }
  const intro = el('createIntro');
  if (intro) {
    intro.textContent = soloMode
      ? 'Solo flow: paint a few pixels to seed your house key, then lock it in.'
      : 'Human: click pixels. Agent: paint via the skill API. When it feels done, lock it in.';
  }
  const nextNote = el('createNextNote');
  if (nextNote) {
    nextNote.textContent = soloMode
      ? 'Next: unlock the house with a wallet signature. You can invite an agent later.'
      : 'Next: unlock the house with a wallet signature. Then you and the agent can read/write encrypted entries.';
  }
  startCreateSkillLoop({ enabled: !tokenMode });

  const state = await api('/api/canvas/state');
  palette = state.palette;

  renderPalette();
  renderCanvas(state.canvas.w, state.canvas.h);

  // IMPORTANT: apply the initial pixels to the DOM.
  // `patchCanvas()` only paints *diffs*, so we initialize `pixels` to a sentinel
  // value to force a full paint on first render.
  pixels = new Array(state.canvas.w * state.canvas.h).fill(-1);
  patchCanvas(state.canvas.w, state.canvas.h, state.canvas.pixels);

  updateLockState();

  async function connectWalletOrThrow() {
    if (!walletClient) throw new Error('NO_SOLANA_WALLET');
    const connected = await walletClient.connect({ chain: 'solana', silent: false });
    const address = connected?.address || walletClient.getAddress({ chain: 'solana' }) || null;
    if (!address) throw new Error('NO_SOLANA_PUBKEY');
    return { address };
  }

  async function sha256(bytes) {
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return new Uint8Array(digest);
  }

  const CEREMONY_E2EE_P256_AESGCM_V1 = 'CEREMONY_E2EE_P256_AESGCM_V1';

  function unb64(str) {
    try {
      const bin = atob(str);
      const out = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
      return out;
    } catch {
      return null;
    }
  }

  async function deriveHouseAuthKey(Kroot) {
    const info = new TextEncoder().encode('elizatown-house-auth-v1');
    const salt = new Uint8Array([]);
    const baseKey = await crypto.subtle.importKey('raw', Kroot, 'HKDF', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
      { name: 'HKDF', hash: 'SHA-256', salt, info },
      baseKey,
      256
    );
    return new Uint8Array(bits);
  }

  function makeCeremonyRevealKeyInfo({ direction = '', teamCode = '' }) {
    return `elizatown-ceremony-reveal-v1|dir=${direction}|team=${teamCode || ''}`;
  }

  async function deriveCeremonyRevealKey({ sharedSecret, direction, teamCode, usages = ['encrypt'] }) {
    const baseKey = await crypto.subtle.importKey('raw', sharedSecret, 'HKDF', false, ['deriveKey']);
    const info = new TextEncoder().encode(makeCeremonyRevealKeyInfo({ direction, teamCode }));
    return crypto.subtle.deriveKey(
      { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array([]), info },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      usages
    );
  }

  async function encryptCeremonyReveal({ revealBytes, recipientRevealPub, direction, teamCode }) {
    const recipientBytes = unb64(recipientRevealPub || '');
    if (!recipientBytes || !recipientBytes.length) throw new Error('WAITING_AGENT_REVEAL');

    const recipientPub = await crypto.subtle.importKey(
      'spki',
      recipientBytes,
      { name: 'ECDH', namedCurve: 'P-256' },
      false,
      []
    );
    const eph = await crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveBits']
    );
    const sharedBits = await crypto.subtle.deriveBits(
      { name: 'ECDH', public: recipientPub },
      eph.privateKey,
      256
    );
    const sharedSecret = new Uint8Array(sharedBits);
    const key = await deriveCeremonyRevealKey({
      sharedSecret,
      direction,
      teamCode,
      usages: ['encrypt']
    });

    const aadBytes = new TextEncoder().encode(JSON.stringify({
      v: 1,
      direction,
      teamCode: teamCode || null
    }));
    const plaintext = new TextEncoder().encode(JSON.stringify({
      v: 1,
      reveal: b64(revealBytes)
    }));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv, additionalData: aadBytes },
      key,
      plaintext
    );
    const epk = new Uint8Array(await crypto.subtle.exportKey('spki', eph.publicKey));

    return {
      alg: CEREMONY_E2EE_P256_AESGCM_V1,
      epk: b64(epk),
      iv: b64(iv),
      ct: b64(new Uint8Array(ciphertext)),
      aad: b64(aadBytes)
    };
  }

  async function decryptCeremonyReveal({ sealed, privateKey, direction, teamCode }) {
    const epk = unb64(sealed?.epk || '');
    const iv = unb64(sealed?.iv || '');
    const ct = unb64(sealed?.ct || '');
    const aad = unb64(sealed?.aad || '');
    if (!epk || !iv || !ct || !aad) throw new Error('INVALID_REVEAL_ENVELOPE');

    const peerPublic = await crypto.subtle.importKey(
      'spki',
      epk,
      { name: 'ECDH', namedCurve: 'P-256' },
      false,
      []
    );
    const sharedBits = await crypto.subtle.deriveBits({ name: 'ECDH', public: peerPublic }, privateKey, 256);
    const sharedSecret = new Uint8Array(sharedBits);
    const decryptKey = await deriveCeremonyRevealKey({
      sharedSecret,
      direction,
      teamCode,
      usages: ['decrypt']
    });
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv, additionalData: aad },
      decryptKey,
      ct
    );
    const decoded = JSON.parse(new TextDecoder().decode(new Uint8Array(plaintext)));
    const reveal = unb64(decoded?.reveal || '');
    if (!reveal || !reveal.length) throw new Error('INVALID_REVEAL_ENVELOPE');
    return reveal;
  }

  async function derivePonyInboxWrapKey(Kroot) {
    const info = new TextEncoder().encode('elizatown-pony-inbox-wrap-v1');
    const salt = new Uint8Array([]);
    const baseKey = await crypto.subtle.importKey('raw', Kroot, 'HKDF', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
      { name: 'HKDF', hash: 'SHA-256', salt, info },
      baseKey,
      256
    );
    return new Uint8Array(bits);
  }

  async function makePonyInboxRegistration(Kroot) {
    const pair = await crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveBits']
    );
    const pub = new Uint8Array(await crypto.subtle.exportKey('spki', pair.publicKey));
    const priv = new Uint8Array(await crypto.subtle.exportKey('pkcs8', pair.privateKey));

    const wrapKeyBytes = await derivePonyInboxWrapKey(Kroot);
    const wrapKey = await crypto.subtle.importKey('raw', wrapKeyBytes, { name: 'AES-GCM' }, false, ['encrypt']);
    const wrapped = await aesGcmEncrypt(wrapKey, priv);

    return {
      ponyInboxPub: b64(pub),
      ponyInboxPrivWrap: {
        alg: 'AES-GCM',
        iv: b64(wrapped.iv),
        ct: b64(wrapped.ct)
      }
    };
  }

  async function deriveRhFromCanvas(pxs) {
    const raw = new TextEncoder().encode(JSON.stringify({ v: 1, pixels: pxs }));
    return sha256(raw);
  }

  function b64(bytes) {
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
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

  async function aesGcmEncrypt(key, plaintextBytes, aadBytes) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv, additionalData: aadBytes || new Uint8Array([]) },
      key,
      plaintextBytes
    );
    return { iv: new Uint8Array(iv), ct: new Uint8Array(ct) };
  }

  function buildKeyWrapMessage({ houseId, origin }) {
    const parts = ['ElizaTown House Key Wrap', `houseId: ${houseId}`];
    if (origin) parts.push(`origin: ${origin}`);
    return parts.join('\n');
  }

  async function signMessageBytes(message) {
    if (!walletClient) throw new Error('NO_SOLANA_WALLET');
    return walletClient.signMessage({ chain: 'solana', message });
  }

  // (Ceremony houses) We store only a wallet-wrapped K_root (never raw).
  // Wallet signature is still the UX "unlock" gate on /house.

  function base58Encode(bytes) {
    const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    if (!bytes || bytes.length === 0) return '';
    const digits = [0];
    for (let i = 0; i < bytes.length; i++) {
      let carry = bytes[i];
      for (let j = 0; j < digits.length; j++) {
        carry += digits[j] << 8;
        digits[j] = carry % 58;
        carry = (carry / 58) | 0;
      }
      while (carry) {
        digits.push(carry % 58);
        carry = (carry / 58) | 0;
      }
    }
    let out = '';
    for (let k = 0; k < bytes.length && bytes[k] === 0; k++) out += '1';
    for (let q = digits.length - 1; q >= 0; q--) out += B58[digits[q]];
    return out;
  }

  function buildUnlockMessage({ housePubKey, nonce, origin }) {
    return [
      'ElizaTown House Unlock',
      `housePubKey: ${housePubKey}`,
      `origin: ${origin}`,
      `nonce: ${nonce}`
    ].join('\n');
  }

  let ceremonyRevealPair = null;
  let ceremonyRevealPub = '';

  el('shareBtn').addEventListener('click', async () => {
    el('err').textContent = '';
    setShareStatusVisible(true);
    try {
      const { address } = await connectWalletOrThrow();
      if (tokenMode && tokenAddress && address !== tokenAddress) {
        throw new Error('WALLET_MISMATCH');
      }

      // 1) Human computes Rh from canvas and commits with a reveal-exchange pubkey.
      const Rh = await deriveRhFromCanvas(pixels);
      const humanCommit = b64(await sha256(Rh));
      if (!soloMode && !ceremonyRevealPair) {
        ceremonyRevealPair = await crypto.subtle.generateKey(
          { name: 'ECDH', namedCurve: 'P-256' },
          true,
          ['deriveBits']
        );
        const revealPubBytes = new Uint8Array(await crypto.subtle.exportKey('spki', ceremonyRevealPair.publicKey));
        ceremonyRevealPub = b64(revealPubBytes);
      }
      await api('/api/human/house/commit', {
        method: 'POST',
        body: JSON.stringify({
          commit: humanCommit,
          revealPub: soloMode ? undefined : ceremonyRevealPub
        })
      });
      nudgeCreateSkillLoop(80);

      let Kroot = null;
      if (soloMode) {
        // Solo flow: derive Kroot from the human entropy only.
        Kroot = await sha256(Rh);
      } else {
        // 2) Exchange sealed reveals and derive Kroot locally once agent payload is available.
        const mat = await driveAgentCeremonyStep({ needReveal: false });
        if (!mat.agentCommit || !mat.agentRevealPub) {
          throw new Error('WAITING_AGENT_REVEAL');
        }

        const sealedForAgent = await encryptCeremonyReveal({
          revealBytes: Rh,
          recipientRevealPub: mat.agentRevealPub,
          direction: 'human_to_agent',
          teamCode: st.teamCode
        });
        await api('/api/human/house/reveal', {
          method: 'POST',
          body: JSON.stringify({ sealedForAgent })
        });
        nudgeCreateSkillLoop(80);

        const matAfter = await driveAgentCeremonyStep({ needReveal: true });
        if (!matAfter.agentRevealSealed) throw new Error('WAITING_AGENT_REVEAL');
        const Ra = await decryptCeremonyReveal({
          sealed: matAfter.agentRevealSealed,
          privateKey: ceremonyRevealPair.privateKey,
          direction: 'agent_to_human',
          teamCode: st.teamCode
        });
        const expectedCommitBytes = await sha256(Ra);
        if (b64(expectedCommitBytes) !== matAfter.agentCommit) {
          throw new Error('COMMIT_MISMATCH');
        }

        // 3) Derive Kroot = sha256(Rh||Ra) and houseId.
        const combo = new Uint8Array(Rh.length + Ra.length);
        combo.set(Rh, 0);
        combo.set(Ra, Rh.length);
        Kroot = await sha256(combo);
      }

      const houseIdBytes = await sha256(Kroot);
      const housePubKey = base58Encode(houseIdBytes);
      const houseAuthKey = b64(await deriveHouseAuthKey(Kroot));
      const ponyInbox = await makePonyInboxRegistration(Kroot);

      // 3.5) Wrap K_root with a deterministic wallet signature for recovery.
      const wrapMsg = buildKeyWrapMessage({ houseId: housePubKey, origin: window.location.origin });
      const wrapSig = await signMessageBytes(wrapMsg);
      const wrapKeyBytes = await sha256(wrapSig);
      const wrapKey = await crypto.subtle.importKey('raw', wrapKeyBytes, { name: 'AES-GCM' }, false, ['encrypt']);
      const wrapped = await aesGcmEncrypt(wrapKey, Kroot);
      const keyWrap = { alg: 'AES-GCM', iv: b64(wrapped.iv), ct: b64(wrapped.ct) };

      // 4) Create the house container on the server.
      // Key source of truth is the ceremony (K_root derived from Rh||Ra); we store only the wallet-wrapped K_root for recovery.
      // Wallet signature remains the human UX "unlock" gate on the house page.
      const n = await api('/api/house/nonce');
      const nonce = n.nonce;

      await api('/api/house/init', {
        method: 'POST',
        body: JSON.stringify({
          houseId: housePubKey,
          housePubKey,
          nonce,
          keyMode: 'ceremony',
          unlock: {
            kind: 'wallet-signature',
            provider: 'privy',
            chain: 'solana',
            address
          },
          keyWrap,
          houseAuthKey,
          ponyInboxPub: ponyInbox.ponyInboxPub,
          ponyInboxPrivWrap: ponyInbox.ponyInboxPrivWrap
        })
      });

      window.location.href = `/house?house=${encodeURIComponent(housePubKey)}`;
    } catch (e) {
      el('err').textContent = e.message === 'EMPTY_CANVAS'
        ? 'Add at least one pixel before locking in.'
        : e.message === 'WALLET_MISMATCH'
          ? 'Connect the same wallet you verified on the home page.'
        : e.message === 'SIGNATURE_FORMAT'
          ? 'Wallet signature failed.'
        : e.message === 'WAITING_AGENT_REVEAL'
          ? 'Waiting for OpenClaw Lite runtime to finish the house ceremony.'
          : e.message;
      setShareStatusVisible(false);
    }
  });

  pollCanvas();
}

init().catch((e) => {
  console.error(e);
  el('err').textContent = e.message;
});
