/* eslint-disable no-console */

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

function setStatus(msg) {
  el('status').textContent = msg || '';
}

const ERROR_MESSAGES = {
  AG0_SDK_NOT_BUNDLED: 'ERC-8004 minting is disabled until the Agent0 SDK is bundled.',
  AG0_SDK_LOAD_FAILED: 'Unable to load the Agent0 SDK. Check your network or try again.'
};

function setError(msg) {
  const node = el('error');
  if (!node) return;
  if (!msg) {
    node.textContent = '';
    return;
  }
  node.textContent = ERROR_MESSAGES[msg] || msg;
}

function setPublicMediaError(msg) {
  const node = el('publicUploadError');
  if (node) node.textContent = msg || '';
}

function setPublicMediaStatus(msg) {
  const node = el('publicUploadStatus');
  if (!node) return;
  node.textContent = msg || 'Saved';
  node.style.display = msg ? 'inline-flex' : 'none';
}

function setPublicMediaEnabled(enabled) {
  const prompt = el('publicPrompt');
  const file = el('publicImage');
  const upload = el('publicUploadBtn');
  const clear = el('publicClearBtn');
  if (prompt) prompt.disabled = !enabled;
  if (file) file.disabled = !enabled;
  if (upload) upload.disabled = !enabled || !currentPublicImageUrl();
  if (clear) clear.disabled = !enabled || !(publicMedia && publicMedia.imageUrl);
  if (!enabled) {
    setPublicMediaStatus('');
    setPublicMediaError('');
  }
}

function renderPublicMediaPreview({ imageUrl, prompt, pending }) {
  const preview = el('publicPreview');
  const img = el('publicPreviewImg');
  const label = el('publicPreviewLabel');
  const text = el('publicPreviewPrompt');
  if (!preview || !img || !label || !text) return;
  if (!imageUrl) {
    preview.classList.add('is-hidden');
    img.src = '';
    text.textContent = '';
    return;
  }
  preview.classList.remove('is-hidden');
  label.textContent = pending ? 'Preview (not saved)' : 'Current public image';
  img.src = imageUrl;
  img.alt = prompt ? `Public image: ${prompt}` : 'Public house image';
  img.style.display = 'block';
  text.textContent = prompt || '';
}

const SHARE_CACHE_KEY = 'agentTownShareCache';
const HOUSE_AUTH_CACHE_PREFIX = 'agentTownHouseAuth:';
const SHARE_COPY_LABEL = 'Copy share link';
const AGENT_COPY_LABEL = 'Copy agent message';
const TOKEN_MINT = 'CZRsbB6BrHsAmGKeoxyfwzCyhttXvhfEukXCWnseBAGS';
const PUBLIC_MEDIA_MAX_BYTES = 1024 * 1024;
const PUBLIC_MEDIA_PROMPT_MAX = 280;
const PUBLIC_MEDIA_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const AUTO_LOCK_MS = null;
const AGENT0_SDK_ESM_URL = '/vendor/agent0-sdk.mjs';
const AGENT0_SDK_CDN_URL = 'https://esm.sh/agent0-sdk@1.4.2?bundle';

async function loadAgent0Sdk(statusNode) {
  if (window.__AG0_SDK_MOCK) return window.__AG0_SDK_MOCK;

  let localMod = null;
  try {
    localMod = await import(AGENT0_SDK_ESM_URL);
  } catch {
    localMod = null;
  }

  if (!localMod || localMod.AG0_SDK_BUNDLED === false) {
    const ok = confirm('Agent0 SDK is not bundled locally. Load it from the official CDN for this mint?');
    if (!ok) throw new Error('AG0_SDK_NOT_BUNDLED');
    if (statusNode) statusNode.textContent = 'Loading Agent0 SDK…';
    return await import(AGENT0_SDK_CDN_URL);
  }

  return localMod;
}

// --- base64 helpers ---
function b64(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function unb64(str) {
  const bin = atob(str);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function houseAuthCacheKey(houseId) {
  return `${HOUSE_AUTH_CACHE_PREFIX}${houseId}`;
}

function cacheHouseAuthBytes(houseId, keyBytes) {
  if (!houseId || !keyBytes || !keyBytes.length) return;
  try {
    sessionStorage.setItem(houseAuthCacheKey(houseId), b64(keyBytes));
  } catch {
    // ignore storage errors
  }
}

function clearHouseAuthCache(houseId) {
  if (!houseId) return;
  try {
    sessionStorage.removeItem(houseAuthCacheKey(houseId));
  } catch {
    // ignore storage errors
  }
}

// --- base58 (minimal) ---
const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function base58Encode(bytes) {
  // Adapted minimal implementation.
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
  // leading zeros
  for (let k = 0; k < bytes.length && bytes[k] === 0; k++) out += '1';
  for (let q = digits.length - 1; q >= 0; q--) out += B58[digits[q]];
  return out;
}

// --- crypto primitives ---
async function sha256(bytes) {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return new Uint8Array(digest);
}

// (Publish convergence) Ceremony-only houses.
// We store only a wallet-wrapped K_root for recovery; wallet signature is still the UX gate.

async function aesGcmEncrypt(key, plaintextBytes, aadBytes) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: aadBytes || new Uint8Array([]) },
    key,
    plaintextBytes
  );
  return { iv: new Uint8Array(iv), ct: new Uint8Array(ct) };
}

async function aesGcmDecrypt(key, ivBytes, ctBytes, aadBytes) {
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBytes, additionalData: aadBytes || new Uint8Array([]) },
    key,
    ctBytes
  );
  return new Uint8Array(pt);
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

async function bodyHashB64(body) {
  const bytes = body ? new TextEncoder().encode(body) : new Uint8Array([]);
  const digest = await sha256(bytes);
  return b64(digest);
}

async function houseAuthHeaders(houseId, method, url, body) {
  if (!KauthKey) throw new Error('HOUSE_AUTH_NOT_READY');
  const ts = String(Date.now());
  const path = new URL(url, window.location.origin).pathname;
  const bodyHash = await bodyHashB64(body || '');
  const msg = `${houseId}.${ts}.${method}.${path}.${bodyHash}`;
  const sig = await crypto.subtle.sign('HMAC', KauthKey, new TextEncoder().encode(msg));
  const auth = b64(new Uint8Array(sig));
  return { 'x-house-ts': ts, 'x-house-auth': auth };
}

async function houseApi(houseId, url, opts = {}) {
  const method = (opts.method || 'GET').toUpperCase();
  const body = typeof opts.body === 'string' ? opts.body : '';
  const headers = await houseAuthHeaders(houseId, method, url, body);
  return api(url, {
    ...opts,
    headers: { ...(opts.headers || {}), ...headers }
  });
}

// --- wallet ---
let wallet = null;
let walletAddr = null;
let walletHouseId = null;
const WALLET_STORAGE_KEY = 'agentTownWallet';
let publicMedia = null;
let pendingPublicImage = null;

function updateWalletUI() {
  const connected = !!walletAddr;
  const btn = el('connectWalletBtn');
  if (btn) {
    btn.textContent = connected ? 'Disconnect wallet' : 'Connect wallet';
    btn.setAttribute('aria-pressed', connected ? 'true' : 'false');
  }
  const addr = el('walletAddr');
  if (addr) addr.textContent = connected ? walletAddr : '—';
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

async function connectWallet({ silent = false } = {}) {
  // Accept any Solana wallet adapter injected as `window.solana` that supports
  // `connect()` and `signMessage()` (Phantom, Solflare, Backpack, etc.).
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
  }
  if (!walletHouseId) {
    const cached = loadWalletCache();
    if (cached && cached.address === walletAddr && cached.houseId) {
      walletHouseId = cached.houseId;
    }
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
  updateWalletUI();
  clearWalletCache();
}

async function signMessage(message) {
  await signMessageBytes(message);
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

async function signMessageBytes(message) {
  if (!wallet) throw new Error('WALLET_NOT_CONNECTED');
  const msgBytes = new TextEncoder().encode(message);
  const resp = await wallet.signMessage(msgBytes, 'utf8');
  const sigBytes = resp?.signature || resp;
  const sigArr = normalizeSignatureBytes(sigBytes);
  if (!sigArr) throw new Error('SIGNATURE_FORMAT');
  return sigArr;
}

async function verifyTokenOwnershipForShare() {
  if (!walletAddr) {
    await connectWallet();
  }
  if (!walletAddr) throw new Error('WALLET_NOT_CONNECTED');
  const nonceResp = await api('/api/token/nonce');
  const msg = buildTokenCheckMessage({ address: walletAddr, nonce: nonceResp.nonce });
  const sigBytes = await signMessageBytes(msg);
  const result = await api('/api/token/verify', {
    method: 'POST',
    body: JSON.stringify({
      address: walletAddr,
      nonce: nonceResp.nonce,
      signature: b64(sigBytes)
    })
  });
  if (!result?.eligible) throw new Error('NO_TOKEN');
  return result;
}

function buildUnlockMessage({ housePubKey, nonce, origin }) {
  return [
    'ElizaTown House Unlock',
    `housePubKey: ${housePubKey}`,
    `origin: ${origin}`,
    `nonce: ${nonce}`
  ].join('\n');
}

function buildWalletLookupMessage({ address, nonce, houseId }) {
  const parts = ['ElizaTown House Lookup', `address: ${address}`, `nonce: ${nonce}`];
  if (houseId) parts.push(`houseId: ${houseId}`);
  return parts.join('\n');
}

function buildTokenCheckMessage({ address, nonce }) {
  return ['ElizaTown Token Check', `address: ${address}`, `CA: ${TOKEN_MINT}`, `nonce: ${nonce}`].join('\n');
}

function buildKeyWrapMessage({ houseId, origin }) {
  const parts = ['ElizaTown House Key Wrap', `houseId: ${houseId}`];
  if (origin) parts.push(`origin: ${origin}`);
  return parts.join('\n');
}

async function lookupWalletHouseId() {
  if (!wallet || !walletAddr) throw new Error('WALLET_NOT_CONNECTED');
  const nonceResp = await api('/api/wallet/nonce');
  const lookupMsg = buildWalletLookupMessage({ address: walletAddr, nonce: nonceResp.nonce, houseId: null });
  const lookupSig = await signMessageBytes(lookupMsg);
  const lookup = await api('/api/wallet/lookup', {
    method: 'POST',
    body: JSON.stringify({
      address: walletAddr,
      nonce: nonceResp.nonce,
      signature: b64(lookupSig)
    })
  });
  if (lookup?.houseId) {
    walletHouseId = lookup.houseId;
    saveWalletCache();
    return lookup.houseId;
  }
  return null;
}

async function restoreWalletConnection({ houseIdFromUrl } = {}) {
  const cached = loadWalletCache();
  if (!cached || !cached.address) return;
  try {
    await connectWallet({ silent: true });
  } catch {
    clearWalletCache();
    updateWalletUI();
    return;
  }
  if (cached.address !== walletAddr) {
    walletHouseId = null;
    saveWalletCache();
    return;
  }
  if (!houseIdFromUrl && cached.houseId) {
    walletHouseId = cached.houseId;
  }
  setStatus('Wallet connected.');
  saveWalletCache();
}

let unlocked = false;
let house = null; // { houseId, housePubKey, nonce }
let KrootBytes = null; // Uint8Array (memory only)
let Kenc = null; // CryptoKey for house log encryption
let KauthBytes = null; // Uint8Array (memory only)
let KauthKey = null; // CryptoKey for HMAC auth
let autoLockTimer = null;

// Phase 3: store minted ERC-8004 ids locally (not persisted yet)
let humanErc8004Id = null;
let agentErc8004Id = null;

function randomNonce(prefix = 'n_') {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return `${prefix}${Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')}`;
}

function buildAnchorLinkMessage({ houseId, erc8004Id, origin, nonce, createdAtMs }) {
  // Human-readable, stable message for EVM signature.
  return [
    'AgentTown Anchor Link',
    `houseId: ${houseId}`,
    `erc8004Id: ${erc8004Id}`,
    `origin: ${origin}`,
    `nonce: ${nonce}`,
    `createdAtMs: ${createdAtMs}`
  ].join('\n');
}

async function signEvmMessage(message) {
  if (!window.ethereum) throw new Error('NO_EVM_WALLET');
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  const signer = Array.isArray(accounts) && accounts.length ? accounts[0] : null;
  if (!signer) throw new Error('NO_EVM_ACCOUNT');
  // personal_sign expects [data, address]
  const sig = await window.ethereum.request({
    method: 'personal_sign',
    params: [message, signer]
  });
  const chainHex = await window.ethereum.request({ method: 'eth_chainId' });
  const chainId = parseInt(chainHex, 16);
  return { signer, signature: sig, chainId };
}

async function appendVaultObject({ type = 'anchor', body }) {
  if (!unlocked || !house || !Kenc) throw new Error('LOCKED');
  armAutoLock();

  const payload = {
    v: 1,
    id: `e_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    ts: Date.now(),
    author: 'human',
    type,
    body
  };

  const pt = new TextEncoder().encode(JSON.stringify(payload));
  const aad = new TextEncoder().encode(`house=${house.houseId}`);
  const enc = await aesGcmEncrypt(Kenc, pt, aad);
  const ciphertext = { alg: 'AES-GCM', iv: b64(enc.iv), ct: b64(enc.ct) };

  const url = `/api/house/${encodeURIComponent(house.houseId)}/append`;
  const reqBody = JSON.stringify({ ciphertext, author: 'human' });
  await houseApi(house.houseId, url, { method: 'POST', body: reqBody });
}

async function linkErc8004AnchorToVault(erc8004Id) {
  if (!unlocked || !house) throw new Error('LOCKED');
  const clean = (erc8004Id || '').trim();
  if (!clean) throw new Error('ERC8004_ID_REQUIRED');

  const discoverable = !!el('anchorDiscoverable')?.checked;

  setAnchorError('');
  setAnchorStatus('Requesting signature…');

  const createdAtMs = Date.now();
  // Use a server-issued nonce if we are publishing to a server directory (prevents replay).
  let nonce = randomNonce('a_');
  if (discoverable) {
    try {
      const n = await api('/api/anchors/nonce');
      if (n && n.nonce) nonce = String(n.nonce);
    } catch {
      // fallback to random nonce
    }
  }

  const msg = buildAnchorLinkMessage({
    houseId: house.houseId,
    erc8004Id: clean,
    origin: window.location.origin,
    nonce,
    createdAtMs
  });

  const { signer, signature, chainId } = await signEvmMessage(msg);

  setAnchorStatus('Saving to encrypted vault…');
  await appendVaultObject({
    type: 'anchor',
    body: {
      kind: 'anchor.link.v1',
      createdAtMs,
      nonce,
      origin: window.location.origin,
      anchor: {
        kind: 'erc8004',
        // Store exactly what Agent0 returns (includes chain id in the string).
        erc8004Id: clean,
        // Also store the wallet chainId for debugging/UX grouping.
        chainId
      },
      proof: {
        kind: 'eip191.personal_sign',
        signer,
        message: msg,
        signature
      },
      publish: {
        discoverable
      }
    }
  });

  if (discoverable) {
    setAnchorStatus('Publishing mapping…');
    await api('/api/anchors/register', {
      method: 'POST',
      body: JSON.stringify({
        houseId: house.houseId,
        erc8004Id: clean,
        createdAtMs,
        nonce,
        signer,
        signature,
        chainId,
        origin: window.location.origin
      })
    });
  }

  setAnchorStatus(discoverable ? 'Linked + published.' : 'Linked.');
  setTimeout(() => setAnchorStatus(''), 1200);
  await refreshEntries();
}

function buildHouseDescriptor(currentHouseId) {
  const origin = window.location.origin;
  return {
    v: 1,
    kind: 'agent-town-house',
    house: {
      id: currentHouseId,
      pub: currentHouseId,
      // Phase 1: placeholder mailbox list (PDA not yet deployed)
      mailboxes: [
        {
          chain: 'solana',
          kind: 'pda',
          status: 'placeholder',
          address: 'PDA_TODO',
          program: 'PROGRAM_TODO'
        }
      ]
    },
    endpoints: {
      meta: `${origin}/api/house/${encodeURIComponent(currentHouseId)}/meta`,
      log: `${origin}/api/house/${encodeURIComponent(currentHouseId)}/log`,
      append: `${origin}/api/house/${encodeURIComponent(currentHouseId)}/append`
    },
    ui: {
      houseUrl: `${origin}/house?house=${encodeURIComponent(currentHouseId)}`
    }
  };
}

function buildErc8004Statement(currentHouseId) {
  return {
    v: 1,
    kind: 'erc8004.link_house',
    housePubKey: currentHouseId,
    // human wallet used for unlock (Solana in Phase 1)
    human: walletAddr || null,
    // phase 2/3: fill in agent + human ERC-8004 identity ids once minted
    humanErc8004: humanErc8004Id,
    agentErc8004: agentErc8004Id,
    origin: window.location.origin,
    createdAtMs: Date.now()
  };
}

async function mintErc8004Identity() {
  const status = el('erc8004MintStatus');
  if (status) status.textContent = '';

  if (!window.ethereum) throw new Error('NO_EVM_WALLET');
  const houseId = house?.houseId || new URLSearchParams(window.location.search).get('house');
  if (!houseId) throw new Error('NO_HOUSE_ID');

  const chain = el('erc8004Chain')?.value || 'sepolia';
  const chainId = chain === 'mainnet' ? 1 : 11155111;

  if (chain === 'mainnet') {
    const ok = confirm('Mint on Ethereum mainnet? This will cost real gas.');
    if (!ok) return;
  }

  // Prefer a locally hosted Agent0 SDK bundle; allow a CDN fallback with confirmation.
  // For e2e tests we allow injecting a mock via window.__AG0_SDK_MOCK.
  const mod = await loadAgent0Sdk(status);

  const SDKClass = mod.SDK;
  if (typeof SDKClass !== 'function') throw new Error('AG0_SDK_LOAD_FAILED');

  // Ensure wallet is connected
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  const owner = Array.isArray(accounts) && accounts.length ? accounts[0] : null;
  if (!owner) throw new Error('NO_EVM_ACCOUNT');

  // Best-effort chain switch
  const currentChainHex = await window.ethereum.request({ method: 'eth_chainId' });
  const currentChainId = parseInt(currentChainHex, 16);
  if (currentChainId !== chainId) {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }]
      });
    } catch {
      throw new Error('WRONG_CHAIN');
    }
  }

  // Cheap-ish default RPCs (reads only). Writes go via the wallet provider.
  // If these ever flake, we can swap to Alchemy/Infura env-config later.
  const rpcUrl = chainId === 1 ? 'https://eth.llamarpc.com' : 'https://rpc.ankr.com/eth_sepolia';

  const sdk = new SDKClass({
    chainId,
    rpcUrl,
    walletProvider: window.ethereum
  });

  const agentName = `Agent Town House ${houseId.slice(0, 10)}`;
  const agentDesc = `E2EE shared house in Agent Town. houseId=${houseId}.`;

  const agent = sdk.createAgent(agentName, agentDesc);

  // Attach some metadata to make it discoverable off-chain later.
  try {
    agent.setMetadata?.({ houseId, origin: window.location.origin });
  } catch {
    // ignore - metadata support may vary by SDK version
  }

  if (status) status.textContent = `Submitting ERC-8004 registration on ${chain}…`;

  // NOTE: We register with an empty URI for now (no hosted registration JSON yet).
  // The SDK will still mint the identity and return the agentId once confirmed.
  const tx = await agent.registerHTTP('');

  const txHash = tx?.hash;
  const explorerBase = chainId === 1 ? 'https://etherscan.io/tx/' : 'https://sepolia.etherscan.io/tx/';
  if (status) {
    status.textContent = txHash ? `Submitted: ${txHash}` : 'Submitted.';
  }

  // Wait for confirmation and then update the ERC-8004 statement.
  if (typeof tx?.waitConfirmed === 'function') {
    if (status) status.textContent = 'Waiting for confirmation…';
    const { result } = await tx.waitConfirmed();
    const agentId = result?.agentId;
    if (agentId) {
      humanErc8004Id = agentId;
      // If we haven't unlocked yet, still re-render the statement using the URL houseId
      renderDescriptorUI((house && house.houseId) ? house.houseId : houseId);
      // Prefill anchor link input for convenience.
      const anchorInput = el('anchorErc8004Id');
      if (anchorInput && !anchorInput.value) anchorInput.value = String(agentId);
      if (status) status.textContent = `Minted identity: ${agentId}`;
    } else {
      if (status) status.textContent = 'Confirmed (no agentId returned).';
    }
  }
}

function renderDescriptorUI(currentHouseId) {
  const descriptor = buildHouseDescriptor(currentHouseId);
  const json = JSON.stringify(descriptor, null, 2);

  const d = el('descriptor');
  if (d) d.value = json;

  const stmt = buildErc8004Statement(currentHouseId);
  const s = el('erc8004');
  if (s) s.value = JSON.stringify(stmt, null, 2);

  const qrEl = el('qr');
  if (qrEl && typeof qrcode === 'function') {
    try {
      const qr = qrcode(0, 'M');
      qr.addData(json, 'Byte');
      qr.make();
      qrEl.innerHTML = qr.createSvgTag({ cellSize: 3, margin: 2, scalable: true, alt: 'House descriptor QR' });
    } catch (e) {
      qrEl.textContent = `QR render failed: ${e.message}`;
    }
  }
}

function clearDescriptorUI() {
  const qrEl = el('qr');
  if (qrEl) qrEl.innerHTML = '';
  const d = el('descriptor');
  if (d) d.value = '';
  const e = el('erc8004');
  if (e) e.value = '';
}

function armAutoLock() {
  if (!AUTO_LOCK_MS) return;
  if (autoLockTimer) clearTimeout(autoLockTimer);
  autoLockTimer = setTimeout(() => {
    wipeKeys();
    setStatus('Locked (inactive).');
  }, AUTO_LOCK_MS);
}

function setPanelVisible(panelId, visible) {
  const panel = el(panelId);
  if (!panel) return;
  panel.classList.toggle('is-hidden', !visible);
}

let descriptorOpen = false;
let erc8004Open = false;

function setDescriptorOpen(open) {
  descriptorOpen = !!open;
  setPanelVisible('descriptorPanel', descriptorOpen);
  const btn = el('toggleDescriptorBtn');
  if (btn) {
    btn.textContent = descriptorOpen ? 'Hide house QR' : 'Show house QR';
    btn.setAttribute('aria-pressed', descriptorOpen ? 'true' : 'false');
  }
  if (unlocked) armAutoLock();
}

function setErc8004Open(open) {
  erc8004Open = !!open;
  setPanelVisible('erc8004Panel', erc8004Open);
  const btn = el('toggleErc8004Btn');
  if (btn) {
    btn.textContent = erc8004Open ? 'Hide ERC-8004' : 'Show ERC-8004';
    btn.setAttribute('aria-pressed', erc8004Open ? 'true' : 'false');
  }
  if (unlocked) armAutoLock();
}

function setHousePanelButtonsEnabled(enabled) {
  const descBtn = el('toggleDescriptorBtn');
  const ercBtn = el('toggleErc8004Btn');
  if (descBtn) descBtn.disabled = !enabled;
  if (ercBtn) ercBtn.disabled = !enabled;
  setPublicMediaEnabled(enabled);
  if (!enabled) {
    setDescriptorOpen(false);
    setErc8004Open(false);
  }
}

function setUnlockButtonState(isUnlocked) {
  const btn = el('unlockBtn');
  if (!btn) return;
  btn.textContent = isUnlocked ? 'Unlocked' : 'Sign to unlock';
  btn.disabled = !!isUnlocked;
}

async function initKeysFromKroot(Kroot) {
  KrootBytes = Kroot;
  Kenc = await deriveHouseEncKey(KrootBytes);
  KauthBytes = await deriveHouseAuthKey(KrootBytes);
  KauthKey = await crypto.subtle.importKey('raw', KauthBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}

async function recoverHouseKeyWithWallet(houseId) {
  if (!walletAddr) throw new Error('WALLET_NOT_CONNECTED');
  setStatus('Recovering house key…');
  const primaryWrapMsg = buildKeyWrapMessage({ houseId });
  const primaryWrapSig = await signMessageBytes(primaryWrapMsg);
  const lookup = await api('/api/wallet/lookup', {
    method: 'POST',
    body: JSON.stringify({
      address: walletAddr,
      signature: b64(primaryWrapSig),
      houseId
    })
  });
  if (!lookup?.keyWrap || !lookup.keyWrap.iv || !lookup.keyWrap.ct) return false;
  if (lookup.keyWrap.alg && lookup.keyWrap.alg !== 'AES-GCM') throw new Error('INVALID_KEY_WRAP');

  async function decryptWithSignature(sigBytes) {
    const wrapKeyBytes = await sha256(sigBytes);
    const wrapKey = await crypto.subtle.importKey('raw', wrapKeyBytes, { name: 'AES-GCM' }, false, ['decrypt']);
    return aesGcmDecrypt(wrapKey, unb64(lookup.keyWrap.iv), unb64(lookup.keyWrap.ct));
  }

  async function decryptWithMessage(wrapMsg) {
    const wrapSig = await signMessageBytes(wrapMsg);
    return decryptWithSignature(wrapSig);
  }

  let kroot = null;
  let lastErr = null;
  try {
    kroot = await decryptWithSignature(primaryWrapSig);
  } catch (e) {
    lastErr = e;
  }

  const attempts = [];
  const currentOrigin = window.location.origin;
  if (currentOrigin) {
    attempts.push(buildKeyWrapMessage({ houseId, origin: currentOrigin }));
    const url = new URL(currentOrigin);
    const portSuffix = url.port ? `:${url.port}` : '';
    if (url.hostname === 'localhost') {
      attempts.push(buildKeyWrapMessage({ houseId, origin: `${url.protocol}//127.0.0.1${portSuffix}` }));
    } else if (url.hostname === '127.0.0.1') {
      attempts.push(buildKeyWrapMessage({ houseId, origin: `${url.protocol}//localhost${portSuffix}` }));
    }
  }

  if (!kroot) {
    for (const msg of attempts) {
      try {
        kroot = await decryptWithMessage(msg);
        break;
      } catch (e) {
        lastErr = e;
        setStatus('Retrying key recovery…');
      }
    }
  }
  if (!kroot) {
    throw new Error(lastErr?.message || 'KEY_WRAP_DECRYPT_FAILED');
  }
  const houseIdBytes = await sha256(kroot);
  const derivedHouseId = base58Encode(houseIdBytes);
  if (derivedHouseId !== houseId) throw new Error('HOUSE_ID_MISMATCH');
  await initKeysFromKroot(kroot);
  return true;
}

function wipeKeys() {
  const prevHouseId = house?.houseId || null;
  unlocked = false;
  house = null;
  KrootBytes = null;
  Kenc = null;
  KauthBytes = null;
  KauthKey = null;
  clearHouseAuthCache(prevHouseId);
  if (autoLockTimer) {
    clearTimeout(autoLockTimer);
    autoLockTimer = null;
  }
  publicMedia = null;
  pendingPublicImage = null;
  el('entries').textContent = '';
  clearDescriptorUI();
  renderPublicMediaPreview({ imageUrl: null, prompt: '', pending: false });
  setHousePanelButtonsEnabled(false);
  setUnlockButtonState(false);
  const inboxNav = el('inboxNavLink');
  if (inboxNav) {
    inboxNav.classList.add('is-hidden');
    inboxNav.href = '#';
  }
}

async function deriveHouseEncKey(Kroot) {
  const info = new TextEncoder().encode('elizatown-house-enc-v1');
  const salt = new Uint8Array([]);
  const baseKey = await crypto.subtle.importKey('raw', Kroot, 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt, info },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Ceremony-only publish: house creation happens on /create.

async function unlockExistingHouse(houseId) {
  setError('');
  setStatus('Unlocking house…');
  if (!walletAddr) throw new Error('WALLET_NOT_CONNECTED');

  // Derive K_root from ceremony material (humanReveal + agentReveal) stored in the session.
  const mat = await api('/api/human/house/material');
  let recovered = false;
  let usedCeremony = false;
  if (mat.humanReveal && mat.agentReveal) {
    const Rh = unb64(mat.humanReveal);
    const Ra = unb64(mat.agentReveal);
    const combo = new Uint8Array(Rh.length + Ra.length);
    combo.set(Rh, 0);
    combo.set(Ra, Rh.length);
    const Kroot = await sha256(combo);
    const houseIdBytes = await sha256(Kroot);
    const derivedHouseId = base58Encode(houseIdBytes);
    if (derivedHouseId === houseId) {
      await initKeysFromKroot(Kroot);
      usedCeremony = true;
    } else {
      setStatus('Ceremony mismatch. Trying wallet recovery…');
    }
  }

  if (!usedCeremony) {
    const recoveredOk = await recoverHouseKeyWithWallet(houseId);
    if (!recoveredOk) throw new Error(mat.humanReveal || mat.agentReveal ? 'HOUSE_ID_MISMATCH' : 'CEREMONY_INCOMPLETE');
    recovered = true;
  }

  const meta = await houseApi(houseId, `/api/house/${encodeURIComponent(houseId)}/meta`);
  const { housePubKey, nonce, keyMode } = meta;

  if (keyMode && keyMode !== 'ceremony') throw new Error('CEREMONY_ONLY');

  // UX gate: require a wallet signature each session.
  const msg = buildUnlockMessage({ housePubKey, nonce, origin: window.location.origin });
  await signMessage(msg);

  house = { houseId, housePubKey, nonce };
  unlocked = true;
  walletHouseId = house.houseId;
  saveWalletCache();
  cacheHouseAuthBytes(house.houseId, KauthBytes);
  const inboxNav = el('inboxNavLink');
  if (inboxNav) {
    inboxNav.href = `/inbox/${encodeURIComponent(house.houseId)}`;
    inboxNav.classList.remove('is-hidden');
  }
  setStatus(recovered ? 'Unlocked (wallet recovery).' : 'Unlocked.');
  setUnlockButtonState(true);
  armAutoLock();

  renderDescriptorUI(house.houseId);
  setHousePanelButtonsEnabled(true);
  setDescriptorOpen(false);
  setErc8004Open(false);
  await refreshEntries();
  await loadPublicMedia();
}

async function appendEntry() {
  if (!unlocked || !house || !Kenc) throw new Error('LOCKED');
  armAutoLock();
  const type = el('entryType').value;
  const text = el('entryText').value;
  const payload = {
    v: 1,
    id: `e_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    ts: Date.now(),
    author: 'human',
    type,
    body: { text }
  };
  const pt = new TextEncoder().encode(JSON.stringify(payload));
  const aad = new TextEncoder().encode(`house=${house.houseId}`);
  const enc = await aesGcmEncrypt(Kenc, pt, aad);
  const ciphertext = { alg: 'AES-GCM', iv: b64(enc.iv), ct: b64(enc.ct) };

  const url = `/api/house/${encodeURIComponent(house.houseId)}/append`;
  const body = JSON.stringify({ ciphertext, author: 'human' });
  await houseApi(house.houseId, url, { method: 'POST', body });

  el('entryText').value = '';
  await refreshEntries();
}

function setAnchorStatus(msg) {
  const s = el('anchorStatus');
  if (s) s.textContent = msg || '';
}
function setAnchorError(msg) {
  const e = el('anchorError');
  if (e) e.textContent = msg || '';
}

function parseAgent0Erc8004Id(str) {
  // Agent0 currently returns `chainId:agentId` (e.g. "11155111:123").
  if (!str || typeof str !== 'string') return null;
  const m = str.trim().match(/^(\d+):(.+)$/);
  if (!m) return null;
  return { chainId: Number(m[1]), id: m[2] };
}

function renderAnchors(anchorLinks) {
  const mainEl = el('anchorsMainnet');
  const devEl = el('anchorsDevnet');
  if (!mainEl || !devEl) return;

  const main = [];
  const dev = [];

  for (const a of anchorLinks) {
    const pub = a.discoverable ? ' · discoverable' : '';
    const label = `${a.erc8004Id}${a.signer ? ` (signer ${a.signer.slice(0, 6)}…${a.signer.slice(-4)})` : ''}${pub}`;
    const parsed = parseAgent0Erc8004Id(a.erc8004Id);
    const chainId = parsed?.chainId ?? a.chainId ?? null;
    // classification: 1 = Ethereum mainnet, 11155111 = Sepolia
    if (chainId === 1) main.push(`Ethereum: ${label}`);
    else if (chainId === 11155111) dev.push(`Sepolia: ${label}`);
    else if (chainId) dev.push(`Chain ${chainId}: ${label}`);
    else dev.push(label);
  }

  mainEl.textContent = main.length ? main.join('\n') : '—';
  devEl.textContent = dev.length ? dev.join('\n') : '—';
}

async function refreshEntries() {
  if (!unlocked || !house || !Kenc) return;
  const data = await houseApi(house.houseId, `/api/house/${encodeURIComponent(house.houseId)}/log`);
  const aad = new TextEncoder().encode(`house=${house.houseId}`);
  const lines = [];
  const anchorLinks = [];

  for (const entry of data.entries || []) {
    try {
      const iv = unb64(entry.ciphertext.iv);
      const ct = unb64(entry.ciphertext.ct);
      const pt = await aesGcmDecrypt(Kenc, iv, ct, aad);
      const obj = JSON.parse(new TextDecoder().decode(pt));

      const bodyText = obj.body?.text ?? (obj.body ? JSON.stringify(obj.body) : '');
      lines.push(`[${new Date(obj.ts).toLocaleString()}] (${obj.author}) ${obj.type}: ${bodyText}`);

      const b = obj.body || null;
      if (b && b.kind === 'anchor.link.v1' && b.anchor?.kind === 'erc8004' && typeof b.anchor?.erc8004Id === 'string') {
        anchorLinks.push({
          erc8004Id: b.anchor.erc8004Id,
          signer: b.proof?.signer || null,
          chainId: b.anchor?.chainId || null,
          discoverable: !!b.publish?.discoverable
        });
      }
    } catch (e) {
      lines.push(`[decrypt failed] ${e.message}`);
    }
  }

  el('entries').textContent = lines.join('\n\n');
  renderAnchors(anchorLinks);
}

async function loadPublicMedia() {
  if (!house) return;
  try {
    const data = await houseApi(house.houseId, `/api/house/${encodeURIComponent(house.houseId)}/public-media`);
    publicMedia = data.publicMedia || null;
    const prompt = publicMedia?.prompt || '';
    const promptEl = el('publicPrompt');
    if (promptEl) {
      promptEl.value = prompt;
      promptEl.setAttribute('maxlength', String(PUBLIC_MEDIA_PROMPT_MAX));
    }
    pendingPublicImage = null;
    refreshPublicPreview();
    setPublicMediaEnabled(true);
  } catch (e) {
    setPublicMediaError(e.message);
  }
}

async function submitPublicMedia() {
  if (!unlocked || !house) throw new Error('LOCKED');
  armAutoLock();
  const promptInput = el('publicPrompt');
  const prompt = promptInput ? promptInput.value.trim() : '';
  const imageUrl = currentPublicImageUrl();
  if (!imageUrl) throw new Error('PUBLIC_IMAGE_REQUIRED');
  if (!prompt) throw new Error('PUBLIC_PROMPT_REQUIRED');

  const body = { prompt };
  if (pendingPublicImage) body.image = pendingPublicImage;

  setPublicMediaStatus('Saving…');
  const res = await houseApi(
    house.houseId,
    `/api/house/${encodeURIComponent(house.houseId)}/public-media`,
    { method: 'POST', body: JSON.stringify(body) }
  );
  publicMedia = res.publicMedia || null;
  pendingPublicImage = null;
  const fileEl = el('publicImage');
  if (fileEl) fileEl.value = '';
  setPublicMediaStatus('Saved');
  setTimeout(() => setPublicMediaStatus(''), 1200);
  refreshPublicPreview();
  setPublicMediaEnabled(true);
}

async function clearPublicMedia() {
  if (!unlocked || !house) throw new Error('LOCKED');
  armAutoLock();
  setPublicMediaStatus('Clearing…');
  const res = await houseApi(
    house.houseId,
    `/api/house/${encodeURIComponent(house.houseId)}/public-media`,
    { method: 'POST', body: JSON.stringify({ clear: true }) }
  );
  publicMedia = res.publicMedia || null;
  pendingPublicImage = null;
  const promptEl = el('publicPrompt');
  if (promptEl) promptEl.value = '';
  const fileEl = el('publicImage');
  if (fileEl) fileEl.value = '';
  setPublicMediaStatus('');
  refreshPublicPreview();
  setPublicMediaEnabled(true);
}

function loadShareCache() {
  try {
    const raw = localStorage.getItem(SHARE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.shareId !== 'string') return null;
    const houseId = currentHouseId();
    if (houseId && parsed.houseId && parsed.houseId !== houseId) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveShareCache(payload) {
  try {
    const houseId = payload.houseId || currentHouseId();
    const next = { ...payload, houseId: houseId || null };
    localStorage.setItem(SHARE_CACHE_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
}

function clearShareCache() {
  try {
    localStorage.removeItem(SHARE_CACHE_KEY);
  } catch {
    // ignore storage errors
  }
}

function currentHouseId() {
  const fromUrl = new URLSearchParams(window.location.search).get('house');
  if (fromUrl) return fromUrl;
  const idEl = el('houseId');
  const fromEl = idEl ? idEl.textContent : '';
  if (fromEl && fromEl !== '—') return fromEl;
  return null;
}

function toAbsoluteUrl(path) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return new URL(path, window.location.origin).toString();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('FILE_READ_FAILED'));
    reader.readAsDataURL(file);
  });
}

function currentPublicImageUrl() {
  return pendingPublicImage || publicMedia?.imageUrl || null;
}

function refreshPublicPreview() {
  const prompt = el('publicPrompt')?.value?.trim() || '';
  renderPublicMediaPreview({
    imageUrl: currentPublicImageUrl(),
    prompt,
    pending: !!pendingPublicImage
  });
}

async function copyToClipboard(text, btn, label) {
  if (!text || !btn) return;
  try {
    await navigator.clipboard.writeText(text);
    btn.textContent = 'Copied ✓';
    setTimeout(() => {
      btn.textContent = label;
    }, 1200);
  } catch {
    alert(text);
  }
}

async function initSharePanel() {
  const createBtn = el('createShareBtn');
  if (!createBtn) return;
  const shareStatus = el('shareStatus');
  const shareLinks = el('shareLinks');
  const shareAgentDot = el('shareAgentDot');
  const shareAgentStatusText = el('shareAgentStatusText');
  const shareAgentDotActive = el('shareAgentDotActive');
  const shareAgentStatusTextActive = el('shareAgentStatusTextActive');
  const shareRequirement = el('shareRequirement');
  const sharePressRow = el('sharePressRow');
  const shareHumanPress = el('shareHumanPress');
  const shareAgentPress = el('shareAgentPress');
  const shareAgentMsg = el('shareAgentMsg');
  const copyAgentBtn = el('copyAgentMsg');
  const shareError = el('shareError');
  const sharePublicEl = el('sharePublic');
  const openShareLink = el('openShareLink');
  const copyShareBtn = el('copyShareLink');
  const shareSetup = el('shareSetup');
  const shareActive = el('shareActive');
  const shareHumanPost = el('shareHumanPost');
  const shareAgentPost = el('shareAgentPost');
  const saveSharePosts = el('saveSharePosts');
  const sharePostsStatus = el('sharePostsStatus');
  const sharePostsError = el('sharePostsError');

  let sharePublicUrl = null;
  let agentMessage = '';
  let lastState = null;
  let teamCode = null;
  let tokenMode = false;
  let shareIdForPosts = null;
  let sharePostsLoadedFor = null;
  let sharePostRecord = null;
  let shareLookupHouseId = null;

  if (createBtn) createBtn.disabled = true;

  function setShareError(msg) {
    if (shareError) shareError.textContent = msg || '';
  }

  function setShareRequirement(msg) {
    if (shareRequirement) shareRequirement.textContent = msg || '';
  }

  function setSharePanelMode(hasShare) {
    if (shareSetup) shareSetup.classList.toggle('is-hidden', hasShare);
    if (shareActive) shareActive.classList.toggle('is-hidden', !hasShare);
    if (!hasShare) {
      setSharePostsStatus('');
      setSharePostsError('');
    }
  }

  function setSharePostsStatus(msg) {
    if (!sharePostsStatus) return;
    sharePostsStatus.textContent = msg || 'Saved';
    sharePostsStatus.style.display = msg ? 'inline-flex' : 'none';
  }

  function setSharePostsError(msg) {
    if (sharePostsError) sharePostsError.textContent = msg || '';
  }

  function isValidHttpUrl(value) {
    if (!value) return true;
    try {
      const parsed = new URL(value);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  function updateSharePostInputs(state) {
    const nextHuman = state?.human?.xPostUrl ?? sharePostRecord?.xPostUrl ?? '';
    const nextAgent = state?.agent?.posts?.moltbookUrl ?? sharePostRecord?.agentPosts?.moltbookUrl ?? '';
    if (shareHumanPost && document.activeElement !== shareHumanPost && shareHumanPost.value !== nextHuman) {
      shareHumanPost.value = nextHuman;
    }
    if (shareAgentPost && document.activeElement !== shareAgentPost && shareAgentPost.value !== nextAgent) {
      shareAgentPost.value = nextAgent;
    }
  }

  async function hydrateSharePostsFromShare(shareId) {
    if (!shareId || shareId === sharePostsLoadedFor) return;
    sharePostsLoadedFor = shareId;
    try {
      const r = await api(`/api/share/${encodeURIComponent(shareId)}`);
      sharePostRecord = r.share || null;
      updateSharePostInputs(lastState);
    } catch (e) {
      if (e.message === 'NOT_FOUND') {
        sharePostRecord = null;
        shareIdForPosts = null;
        sharePostsLoadedFor = null;
        clearShareCache();
        setSharePostsError('Share not found. Regenerate the share link.');
        setSharePanelMode(false);
      }
    }
  }

  async function hydrateShareIdFromHouse(houseId) {
    if (!houseId || shareIdForPosts || shareLookupHouseId === houseId) return;
    shareLookupHouseId = houseId;
    try {
      const r = await api(`/api/share/by-house/${encodeURIComponent(houseId)}`);
      if (!r.shareId) return;
      shareIdForPosts = r.shareId;
      const payload = { shareId: r.shareId, sharePath: r.sharePath, houseId };
      saveShareCache(payload);
      updateShareLinks(payload);
    } catch (e) {
      if (e.message === 'NOT_FOUND') {
        shareLookupHouseId = null;
      }
    }
  }

  function resolveShareIdForPosts() {
    if (shareIdForPosts) return shareIdForPosts;
    const cached = loadShareCache();
    if (cached?.shareId) return cached.shareId;
    if (sharePublicUrl) {
      try {
        const url = new URL(sharePublicUrl);
        const parts = url.pathname.split('/').filter(Boolean);
        return parts[0] === 's' ? parts[1] || null : null;
      } catch {
        return null;
      }
    }
    return null;
  }

  function updateAgentStatus(connected, name) {
    if (shareAgentDot && shareAgentStatusText) {
      shareAgentDot.className = `dot ${connected ? 'good' : ''}`;
      shareAgentStatusText.textContent = connected
        ? `Agent connected${name ? `: ${name}` : ''}`
        : 'Agent not connected';
    }
    if (shareAgentDotActive && shareAgentStatusTextActive) {
      shareAgentDotActive.className = `dot ${connected ? 'good' : ''}`;
      shareAgentStatusTextActive.textContent = connected
        ? `Agent connected${name ? `: ${name}` : ''}`
        : 'Agent not connected';
    }
  }

  function updateAgentMessage() {
    if (!shareAgentMsg) return;
    const hid = currentHouseId();
    const origin = window.location.origin;
    agentMessage = hid
      ? `Read ${origin}/skill.md and reconnect to house: ${hid}`
      : `Read ${origin}/skill.md and reconnect to house: <houseId>`;
    shareAgentMsg.textContent = agentMessage;
  }

  function updateRequirementFromState(state) {
    if (!state) {
      setShareRequirement('Share links require a co-op house ceremony and agent approval so referrals stay attributable.');
      return;
    }
    if (state.share?.id) {
      setShareRequirement('Share link is active. New signups from it count as referrals.');
      return;
    }
    if (state.signup?.mode === 'token') {
      setShareRequirement('Token holder flow: generate a share link (no agent approval required).');
      return;
    }
    if (!state.houseId) {
      setShareRequirement('Finish the co-op house ceremony first (needs the agent reveal).');
      return;
    }
    const approval = state.shareApproval || {};
    const humanPressed = approval.human === true;
    const agentPressed = approval.agent === true || state.agent?.connected;
    if (humanPressed && agentPressed) {
      setShareRequirement('Both approved. Generate the share link.');
      return;
    }
    if (humanPressed && !agentPressed) {
      setShareRequirement('Waiting on agent approval. Ask them to reconnect to this house.');
      return;
    }
    if (!humanPressed && agentPressed) {
      setShareRequirement('Agent approved. Press Generate share link to approve and create it.');
      return;
    }
    setShareRequirement('Press Generate share link, then have your agent reconnect to approve.');
  }

  function updatePressStatus(state) {
    if (!sharePressRow || !shareHumanPress || !shareAgentPress) return;
    const approval = state?.shareApproval || {};
    const humanPressed = approval.human === true;
    const agentPressed = approval.agent === true || state?.agent?.connected;
    shareHumanPress.textContent = `Human pressed: ${humanPressed ? 'yes' : 'no'}`;
    shareAgentPress.textContent = `Agent pressed: ${agentPressed ? 'yes' : 'no'}`;
  }

  function updateShareLinks({ shareId, sharePath }) {
    const resolvedSharePath = sharePath || (shareId ? `/s/${shareId}` : null);
    sharePublicUrl = toAbsoluteUrl(resolvedSharePath);
    if (shareId) {
      shareIdForPosts = shareId;
      hydrateSharePostsFromShare(shareId);
    }

    if (sharePublicUrl && sharePublicEl && openShareLink && shareLinks) {
      sharePublicEl.textContent = sharePublicUrl;
      openShareLink.href = sharePublicUrl;
      shareLinks.classList.remove('is-hidden');
    }

    if (sharePublicUrl) {
      setSharePanelMode(true);
    }
  }

  function applyState(state) {
    lastState = state;
    teamCode = state?.teamCode || teamCode;
    tokenMode = state?.signup?.mode === 'token';
    if (state?.share?.id) shareIdForPosts = state.share.id;
    updateAgentStatus(!!state?.agent?.connected, state?.agent?.name || null);
    updatePressStatus(state);
    updateRequirementFromState(state);
    updateAgentMessage();
    document.querySelectorAll('.share-agent-only').forEach((node) => {
      node.classList.toggle('is-hidden', tokenMode);
    });
    updateSharePostInputs(state);
    if (createBtn && state) {
      const eligible = !!state.houseId && !state.share?.id && !shareIdForPosts;
      createBtn.disabled = !eligible;
    }
    const shareId = state?.share?.id || shareIdForPosts || null;
    if (shareId) {
      const cached = loadShareCache();
      const payload = {
        shareId,
        sharePath: `/s/${shareId}`,
        houseId: cached && cached.shareId === shareId ? cached.houseId : currentHouseId()
      };
      updateShareLinks(payload);
      if (!state?.share?.id && shareIdForPosts) {
        setShareRequirement('Share link is active (recovered from house).');
      }
    } else {
      setSharePanelMode(false);
      hydrateShareIdFromHouse(state?.houseId || currentHouseId());
    }
  }

  if (copyShareBtn) {
    copyShareBtn.textContent = SHARE_COPY_LABEL;
    copyShareBtn.addEventListener('click', () => copyToClipboard(sharePublicUrl, copyShareBtn, SHARE_COPY_LABEL));
  }

  if (copyAgentBtn) {
    copyAgentBtn.textContent = AGENT_COPY_LABEL;
    copyAgentBtn.addEventListener('click', () => copyToClipboard(agentMessage, copyAgentBtn, AGENT_COPY_LABEL));
  }

  if (saveSharePosts) {
    saveSharePosts.addEventListener('click', async () => {
      setSharePostsError('');
      const humanUrl = shareHumanPost ? shareHumanPost.value.trim() : '';
      const agentUrl = shareAgentPost ? shareAgentPost.value.trim() : '';
      if (shareHumanPost && !isValidHttpUrl(humanUrl)) {
        setSharePostsError('Enter a valid X post URL (http/https).');
        return;
      }
      if (shareAgentPost && !tokenMode && !isValidHttpUrl(agentUrl)) {
        setSharePostsError('Enter a valid Moltbook URL (http/https).');
        return;
      }
      if (saveSharePosts) saveSharePosts.disabled = true;
      setSharePostsStatus('Saving…');
      try {
        const houseId = currentHouseId();
        if (houseId && KauthKey) {
          const r = await houseApi(houseId, `/api/house/${encodeURIComponent(houseId)}/posts`, {
            method: 'POST',
            body: JSON.stringify({
              xPostUrl: humanUrl,
              moltbookUrl: tokenMode ? null : agentUrl
            })
          });
          if (r?.shareId) {
            shareIdForPosts = r.shareId;
            updateShareLinks({ shareId: r.shareId, sharePath: r.sharePath, houseId });
            await hydrateSharePostsFromShare(r.shareId);
          }
          setSharePostsStatus('Saved');
          setTimeout(() => setSharePostsStatus(''), 1200);
          return;
        }

        const shareId = resolveShareIdForPosts();
        if (shareId) shareIdForPosts = shareId;
        if (shareHumanPost) {
          await api('/api/human/posts', {
            method: 'POST',
            body: JSON.stringify({ xPostUrl: humanUrl, shareId: shareIdForPosts })
          });
        }
        if (shareAgentPost && !tokenMode) {
          if (!teamCode) throw new Error('TEAM_CODE_MISSING');
          await api('/api/agent/posts', { method: 'POST', body: JSON.stringify({ teamCode, moltbookUrl: agentUrl }) });
        }
        if (shareIdForPosts) {
          await hydrateSharePostsFromShare(shareIdForPosts);
        }
        setSharePostsStatus('Saved');
        setTimeout(() => setSharePostsStatus(''), 1200);
      } catch (e) {
        const msg = e.message === 'TEAM_CODE_MISSING'
          ? 'Team code missing. Refresh the page and try again.'
          : e.message === 'SHARE_NOT_FOUND'
            ? 'Share not found for this session. Regenerate the share link.'
          : e.message === 'NOT_FOUND'
            ? 'Share not found for this house. Generate a share link first.'
          : e.message === 'HTTP_404'
            ? 'Missing /api/human/posts. Restart the server and try again.'
          : e.message === 'INVALID_URL'
            ? 'Enter a valid URL (http/https).'
            : e.message;
        setSharePostsError(msg);
        setSharePostsStatus('');
      } finally {
        if (saveSharePosts) saveSharePosts.disabled = false;
      }
    });
  }

  createBtn.addEventListener('click', async () => {
    setShareError('');
    if (shareStatus) shareStatus.style.display = 'inline-flex';
    createBtn.disabled = true;
    try {
      const houseId = currentHouseId();
      if (houseId) {
        try {
          const existing = await api(`/api/share/by-house/${encodeURIComponent(houseId)}`);
          if (existing?.shareId) {
            const payload = { shareId: existing.shareId, sharePath: existing.sharePath, houseId };
            saveShareCache(payload);
            updateShareLinks(payload);
            setShareRequirement('Share link is active. New signups from it count as referrals.');
            return;
          }
        } catch (e) {
          if (e.message !== 'NOT_FOUND' && e.message !== 'HTTP_404') throw e;
        }
      }

      if (houseId && KauthKey) {
        const r = await houseApi(houseId, `/api/house/${encodeURIComponent(houseId)}/share`, { method: 'POST' });
        const payload = { shareId: r.shareId, sharePath: r.sharePath, houseId };
        saveShareCache(payload);
        updateShareLinks(payload);
        setShareRequirement('Share link is active. New signups from it count as referrals.');
        return;
      }

      if (lastState?.signup?.mode === 'token') {
        await verifyTokenOwnershipForShare();
      }
      const r = await api('/api/share/create', { method: 'POST' });
      const payload = { shareId: r.shareId, sharePath: r.sharePath, houseId };
      saveShareCache(payload);
      updateShareLinks(payload);
      setShareRequirement('Share link is active. New signups from it count as referrals.');
    } catch (e) {
      const msg = e.message === 'AGENT_REQUIRED'
        ? 'Agent approval required. Ask your agent to reconnect to this house.'
        : e.message === 'HOUSE_NOT_READY'
          ? 'Finish the co-op house ceremony first.'
          : e.message === 'CEREMONY_INCOMPLETE'
            ? (KauthKey ? 'Share is unlocked, but ceremony state is missing. Refresh and try again.'
              : 'Waiting for agent reveal to complete the ceremony.')
        : e.message === 'NO_TOKEN'
          ? 'No $ELIZATOWN found in this wallet.'
          : e.message === 'TOKEN_CHECK_REQUIRED'
            ? 'Verify your wallet to continue.'
            : e.message === 'TOKEN_ADDRESS_MISMATCH'
              ? 'Connect the same wallet used to create this house.'
              : e.message === 'ADDRESS_MISMATCH'
                ? 'Connect the same wallet used to create this house.'
                : e.message === 'BAD_SIGNATURE'
                  ? 'Wallet signature failed.'
                  : e.message === 'SIGNATURE_FORMAT'
                    ? 'Wallet signature failed.'
                    : e.message === 'NO_SOLANA_WALLET'
                      ? 'No Solana wallet found (need Phantom/Solflare).'
                      : e.message === 'NO_SOLANA_SIGN'
                        ? 'Wallet does not support message signing.'
        : e.message === 'EMPTY_CANVAS'
          ? 'Add at least one pixel before generating a share link.'
          : e.message === 'STORE_FULL'
            ? 'Share limit reached. Try again later.'
            : e.message;
      setShareError(msg);
      if (e.message === 'AGENT_REQUIRED') {
        setShareRequirement('Ask your agent to reconnect to this house to approve sharing.');
      }
    } finally {
      if (shareStatus) shareStatus.style.display = 'none';
      createBtn.disabled = false;
    }
  });

  updateAgentMessage();
  setSharePanelMode(false);
  try {
    const state = await api('/api/state');
    applyState(state);
  } catch {
    updateRequirementFromState(null);
  }
  updatePressStatus(null);
  const cached = loadShareCache();
  if (cached && cached.shareId) {
    shareIdForPosts = cached.shareId;
    hydrateSharePostsFromShare(cached.shareId);
    updateShareLinks(cached);
  } else {
    hydrateShareIdFromHouse(currentHouseId());
  }
  const poll = async () => {
    try {
      const state = await api('/api/state');
      applyState(state);
    } catch {
      // ignore
    } finally {
      setTimeout(poll, 1200);
    }
  };
  poll();
}

async function init() {
  // If URL has ?house=<id>, auto-fill and try unlock.
  const params = new URLSearchParams(window.location.search);
  const houseId = params.get('house');

  el('connectWalletBtn').addEventListener('click', async () => {
    setError('');
    try {
      if (walletAddr) {
        await disconnectWallet();
        setStatus('Wallet disconnected.');
        return;
      }
      await connectWallet();
      setStatus('Wallet connected.');
    } catch (e) {
      setError(
        e.message === 'NO_SOLANA_WALLET'
          ? 'No Solana wallet found (need Phantom/Solflare).'
          : e.message === 'NO_SOLANA_SIGN'
            ? 'Wallet does not support message signing.'
            : e.message
      );
    }
  });

  el('unlockBtn').addEventListener('click', async () => {
    setError('');
    try {
      const urlHouseId = new URLSearchParams(window.location.search).get('house');
      let rid = urlHouseId || walletHouseId;
      if (!rid) {
        rid = await lookupWalletHouseId();
      }
      if (!rid || rid === '—') throw new Error('NO_HOUSE_ID');
      await unlockExistingHouse(rid);
    } catch (e) {
      setError(e.message);
    }
  });

  el('toggleDescriptorBtn').addEventListener('click', () => {
    if (!unlocked) return;
    setDescriptorOpen(!descriptorOpen);
  });

  el('toggleErc8004Btn').addEventListener('click', () => {
    if (!unlocked) return;
    setErc8004Open(!erc8004Open);
  });

  // Ceremony-only publish: no on-page "create house" button.

  el('appendBtn').addEventListener('click', async () => {
    setError('');
    try {
      await appendEntry();
    } catch (e) {
      setError(e.message);
    }
  });

  el('lockBtn').addEventListener('click', () => {
    wipeKeys();
    setStatus('Locked (key wiped from memory).');
  });

  el('copyDescriptorBtn').addEventListener('click', async () => {
    setError('');
    try {
      const txt = el('descriptor').value;
      await navigator.clipboard.writeText(txt);
      el('copyDescriptorBtn').textContent = 'Copied ✓';
      setTimeout(() => (el('copyDescriptorBtn').textContent = 'Copy descriptor'), 1200);
    } catch {
      // fallback
      alert(el('descriptor').value);
    }
  });

  el('copyErc8004Btn').addEventListener('click', async () => {
    setError('');
    try {
      const txt = el('erc8004').value;
      await navigator.clipboard.writeText(txt);
      el('copyErc8004Btn').textContent = 'Copied ✓';
      setTimeout(() => (el('copyErc8004Btn').textContent = 'Copy ERC-8004 statement'), 1200);
    } catch {
      alert(el('erc8004').value);
    }
  });

  el('mintErc8004Btn').addEventListener('click', async () => {
    setError('');
    try {
      await mintErc8004Identity();
    } catch (e) {
      setError(e.message);
    }
  });

  const linkAnchorBtn = el('linkAnchorBtn');
  if (linkAnchorBtn) {
    linkAnchorBtn.addEventListener('click', async () => {
      setAnchorError('');
      try {
        const id = el('anchorErc8004Id')?.value || '';
        await linkErc8004AnchorToVault(id);
      } catch (e) {
        setAnchorStatus('');
        setAnchorError(e.message);
      }
    });
  }

  const publicImage = el('publicImage');
  if (publicImage) {
    publicImage.addEventListener('change', async (evt) => {
      setPublicMediaError('');
      setPublicMediaStatus('');
      const file = evt.target.files && evt.target.files[0];
      if (!file) {
        pendingPublicImage = null;
        refreshPublicPreview();
        setPublicMediaEnabled(true);
        return;
      }
      if (!PUBLIC_MEDIA_TYPES.has(file.type)) {
        pendingPublicImage = null;
        publicImage.value = '';
        setPublicMediaError('Unsupported file type. Use PNG, JPG, or WebP.');
        setPublicMediaEnabled(true);
        return;
      }
      if (file.size > PUBLIC_MEDIA_MAX_BYTES) {
        pendingPublicImage = null;
        publicImage.value = '';
        setPublicMediaError('Image too large. Max 1 MB.');
        setPublicMediaEnabled(true);
        return;
      }
      try {
        const dataUrl = await readFileAsDataUrl(file);
        pendingPublicImage = dataUrl;
        refreshPublicPreview();
        setPublicMediaEnabled(true);
      } catch (e) {
        pendingPublicImage = null;
        setPublicMediaError(e.message);
        setPublicMediaEnabled(true);
      }
    });
  }

  const publicPrompt = el('publicPrompt');
  if (publicPrompt) {
    publicPrompt.addEventListener('input', () => {
      setPublicMediaStatus('');
      setPublicMediaError('');
      refreshPublicPreview();
    });
  }

  const publicUploadBtn = el('publicUploadBtn');
  if (publicUploadBtn) {
    publicUploadBtn.addEventListener('click', async () => {
      setPublicMediaError('');
      try {
        await submitPublicMedia();
      } catch (e) {
        setPublicMediaStatus('');
        setPublicMediaError(e.message);
      }
    });
  }

  const publicClearBtn = el('publicClearBtn');
  if (publicClearBtn) {
    publicClearBtn.addEventListener('click', async () => {
      setPublicMediaError('');
      try {
        await clearPublicMedia();
      } catch (e) {
        setPublicMediaStatus('');
        setPublicMediaError(e.message);
      }
    });
  }

  initSharePanel();
  updateWalletUI();
  setHousePanelButtonsEnabled(false);
  setStatus('Ready. Connect wallet, then create or unlock a house.');
  restoreWalletConnection({ houseIdFromUrl: !!houseId });
}

init().catch((e) => {
  console.error(e);
  setError(e.message);
});
