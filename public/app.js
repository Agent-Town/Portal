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

let elements = [];
let lastState = null;
let redirecting = false;
let wallet = null;
let walletAddr = null;
let walletHouseId = null;
let walletRecovered = false;
const WALLET_STORAGE_KEY = 'agentTownWallet';
const PATH_STORAGE_KEY = 'agentTownPathMode';
const TOKEN_ERROR_KEY = 'agentTownTokenError';
const TOKEN_MINT = 'CZRsbB6BrHsAmGKeoxyfwzCyhttXvhfEukXCWnseBAGS';
let pathMode = 'agent';

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
    return raw === 'token' || raw === 'agent' ? raw : 'agent';
  } catch {
    return 'agent';
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
  const tokenBtn = el('pathTokenBtn');
  const agentBtn = el('pathAgentBtn');
  if (tokenBtn) {
    const active = pathMode === 'token';
    tokenBtn.classList.toggle('primary', active);
    tokenBtn.setAttribute('aria-pressed', active ? 'true' : 'false');
  }
  if (agentBtn) {
    const active = pathMode === 'agent';
    agentBtn.classList.toggle('primary', active);
    agentBtn.setAttribute('aria-pressed', active ? 'true' : 'false');
  }
}

function setPathMode(mode, { persist = true, refresh = true } = {}) {
  const next = mode === 'token' ? 'token' : 'agent';
  pathMode = next;
  if (persist) savePathMode(next);
  updatePathButtons();
  if (refresh && lastState) updateUI(lastState);
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
  if (!window.solana) throw new Error('NO_SOLANA_WALLET');
  if (typeof window.solana.connect !== 'function') throw new Error('NO_SOLANA_WALLET');
  if (typeof window.solana.signMessage !== 'function') throw new Error('NO_SOLANA_SIGN');
  const previousAddr = walletAddr;
  let resp = null;
  if (window.solana.isConnected && window.solana.publicKey) {
    wallet = window.solana;
  } else {
    const opts = silent ? { onlyIfTrusted: true } : undefined;
    resp = await window.solana.connect(opts);
    wallet = window.solana;
  }
  const pk = resp?.publicKey || wallet?.publicKey;
  walletAddr = pk && typeof pk.toString === 'function' ? pk.toString() : null;
  if (!walletAddr) throw new Error('NO_SOLANA_PUBKEY');
  if (previousAddr && previousAddr !== walletAddr) {
    walletHouseId = null;
    walletRecovered = false;
  }
  updateWalletUI();
  saveWalletCache();
}

async function disconnectWallet() {
  if (wallet && typeof wallet.disconnect === 'function') {
    try {
      await wallet.disconnect();
    } catch {
      // ignore disconnect errors; we still clear local state
    }
  }
  wallet = null;
  walletAddr = null;
  walletHouseId = null;
  walletRecovered = false;
  updateWalletUI();
  clearWalletCache();
  if (lastState) updateUI(lastState);
}

async function lookupWalletHouse(houseIdOverride = null) {
  if (!wallet || !walletAddr) throw new Error('WALLET_NOT_CONNECTED');
  const nonceResp = await api('/api/wallet/nonce');
  const msg = buildWalletLookupMessage({
    address: walletAddr,
    nonce: nonceResp.nonce,
    houseId: houseIdOverride || null
  });
  const msgBytes = new TextEncoder().encode(msg);
  const resp = await wallet.signMessage(msgBytes, 'utf8');
  const sigBytes = resp?.signature || resp;
  const sigArr = normalizeSignatureBytes(sigBytes);
  if (!sigArr) throw new Error('SIGNATURE_FORMAT');
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
  if (!wallet || !walletAddr) throw new Error('WALLET_NOT_CONNECTED');
  const nonceResp = await api('/api/token/nonce');
  const msg = buildTokenCheckMessage({ address: walletAddr, nonce: nonceResp.nonce });
  const msgBytes = new TextEncoder().encode(msg);
  const resp = await wallet.signMessage(msgBytes, 'utf8');
  const sigBytes = resp?.signature || resp;
  const sigArr = normalizeSignatureBytes(sigBytes);
  if (!sigArr) throw new Error('SIGNATURE_FORMAT');
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

function setReconnectMode({ houseReady, tokenMode }) {
  const reconnect = el('reconnectPanel');
  const step1 = el('step1Panel');
  const step2 = el('step2Panel');
  const divider = el('stepDivider');
  const tokenPanel = el('tokenPanel');
  const showReconnect = !!houseReady;
  const showAgentSteps = !tokenMode && !showReconnect;
  if (reconnect) reconnect.classList.toggle('is-hidden', !showReconnect);
  if (step1) step1.classList.toggle('is-hidden', !showAgentSteps);
  if (step2) step2.classList.toggle('is-hidden', !showAgentSteps);
  if (divider) divider.classList.toggle('is-hidden', !showAgentSteps);
  if (tokenPanel) tokenPanel.classList.toggle('is-hidden', !tokenMode || showReconnect);
}

function renderSigils(state) {
  const grid = el('sigilGrid');
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

function updateUI(state) {
  lastState = state;

  const houseId = state.houseId || walletHouseId || null;
  const signupMode = state.signup?.mode || (state.signup?.complete ? 'agent' : null);
  if (signupMode === 'token' && pathMode !== 'token') {
    setPathMode('token', { persist: true, refresh: false });
  }
  const tokenMode = pathMode === 'token' || signupMode === 'token';

  // Counts (optional on index)
  const signupCount = el('signupCount');
  if (signupCount) signupCount.textContent = String(state.stats?.signups ?? '—');

  // Team code (fallback for older servers that still send pairCode)
  const teamCode = state.teamCode || state.pairCode || '…';
  el('teamCode').textContent = teamCode;

  const origin = window.location.origin;
  el('teamSnippet').textContent = `Read ${origin}/skill.md and team with code: ${teamCode}`;

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

  updatePathButtons();
  const pathNote = el('pathNote');
  if (pathNote) {
    pathNote.textContent = tokenMode ? 'Token holder flow selected.' : 'Agent co-op flow selected.';
  }

  // Agent status
  const connected = !!state.agent?.connected;
  updateAgentStatus('agentDot', 'agentStatusText', connected, state.agent?.name || null);
  updateAgentStatus('agentDotHouse', 'agentStatusTextHouse', connected, state.agent?.name || null);

  setReconnectMode({ houseReady: !!houseId, tokenMode });
  toggleAgentOnly(!tokenMode);

  const tokenComplete = !!state.signup?.complete && signupMode === 'token';
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
    const title = el('reconnectTitle');
    const intro = el('reconnectIntro');
    if (title && intro) {
      if (tokenMode) {
        title.textContent = 'House ready';
        intro.textContent = 'Your house is ready. Open it to unlock with your wallet.';
      } else if (walletRecovered) {
        title.textContent = 'Welcome back';
        intro.textContent = 'We found a house for this wallet. Share this reconnect message with your agent if needed.';
      } else {
        title.textContent = 'Reconnect to House';
        intro.textContent = 'Your house is ready. Share this reconnect message with your agent if needed.';
      }
    }
    const houseSnippet = el('houseSnippet');
    const openHouseLink = el('openHouseLink');
    if (houseSnippet) houseSnippet.textContent = `Read ${origin}/skill.md and reconnect to your house.`;
    if (openHouseLink) openHouseLink.href = `/house?house=${encodeURIComponent(houseId)}`;
    return;
  }

  // Sigils
  renderSigils(state);

  // Match lock
  const matched = !!state.match?.matched;
  el('matchState').textContent = matched ? 'UNLOCKED' : 'LOCKED';
  el('matchState').className = `state ${matched ? 'good' : 'bad'}`;
  el('matchDetail').textContent = matched
    ? `Matched on “${state.match.elementId}”. Now press Open together.`
    : 'Pick the same sigil to unlock.';

  // Open gating
  const openBtn = el('openBtn');
  openBtn.disabled = !matched;

  // Signup completion
  const complete = !!state.signup?.complete && signupMode === 'agent';
  el('openReady').style.display = complete ? 'inline-flex' : 'none';

  // Waiting pill: show if human pressed but not complete
  const waiting = !!state.human?.openPressed && !complete;
  el('openWaiting').style.display = waiting ? 'inline-flex' : 'none';

  // Auto-redirect only once per completed signup.
  let freshComplete = false;
  if (complete && state.signup?.createdAt) {
    try {
      const key = 'agentTownSignupCompleteAt';
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
  pathMode = loadPathMode();
  updatePathButtons();

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
    stats: session.stats
  });

  if (tokenErr) {
    setPathMode('token', { persist: true, refresh: true });
    setTokenError(tokenErr);
    setTokenStatus({ active: true, good: false, text: 'Verify wallet to continue' });
  }

  el('copyTeam').addEventListener('click', async () => {
    const msg = el('teamSnippet').textContent;
    try {
      await navigator.clipboard.writeText(msg);
      el('copyTeam').textContent = 'Copied ✓';
      setTimeout(() => (el('copyTeam').textContent = 'Copy team message'), 1200);
    } catch {
      // Fallback
      alert(msg);
    }
  });

  const connectWalletBtn = el('connectWalletBtn');
  if (connectWalletBtn) {
    connectWalletBtn.addEventListener('click', async () => {
      setWalletStatus('');
      try {
        if (walletAddr) {
          await disconnectWallet();
          setWalletStatus('Wallet disconnected.');
          return;
        }
        await connectWalletAndLookup();
      } catch (e) {
        setWalletStatus(
          e.message === 'NO_SOLANA_WALLET'
            ? 'No Solana wallet found (need Phantom/Solflare).'
            : e.message === 'NO_SOLANA_SIGN'
              ? 'Wallet does not support message signing.'
              : e.message,
          true
        );
      }
    });
  }

  const pathTokenBtn = el('pathTokenBtn');
  if (pathTokenBtn) {
    pathTokenBtn.addEventListener('click', () => setPathMode('token'));
  }
  const pathAgentBtn = el('pathAgentBtn');
  if (pathAgentBtn) {
    pathAgentBtn.addEventListener('click', () => setPathMode('agent'));
  }

  const tokenVerifyBtn = el('tokenVerifyBtn');
  if (tokenVerifyBtn) {
    tokenVerifyBtn.addEventListener('click', async () => {
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
                ? 'No Solana wallet found (need Phantom/Solflare).'
                : e.message === 'NO_SOLANA_SIGN'
                  ? 'Wallet does not support message signing.'
                  : e.message;
        if (tokenError) tokenError.textContent = msg;
        setTokenStatus({ active: true, good: false, text: 'Check failed' });
      } finally {
        tokenVerifyBtn.disabled = false;
      }
    });
  }

  const copyHouse = el('copyHouse');
  if (copyHouse) {
    copyHouse.addEventListener('click', async () => {
      const msg = el('houseSnippet').textContent;
      try {
        await navigator.clipboard.writeText(msg);
        copyHouse.textContent = 'Copied ✓';
        setTimeout(() => (copyHouse.textContent = 'Copy house message'), 1200);
      } catch {
        alert(msg);
      }
    });
  }

  el('openBtn').addEventListener('click', async () => {
    el('openError').textContent = '';
    try {
      await api('/api/human/open/press', {
        method: 'POST',
        body: JSON.stringify({})
      });
    } catch (e) {
      el('openError').textContent = `Error: ${e.message}`;
    }
  });

  updateWalletUI();
  restoreWalletConnection();
  poll();
}

init().catch((e) => {
  console.error(e);
});
