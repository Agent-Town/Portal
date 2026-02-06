/* eslint-disable no-console */

async function api(url, opts) {
  const res = await fetch(url, {
    headers: { 'content-type': 'application/json', ...(opts && opts.headers ? opts.headers : {}) },
    credentials: 'include',
    ...opts
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
function setError(msg) {
  el('error').textContent = msg || '';
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

async function hkdfKeyFromSig(sigBytes) {
  // Derive a symmetric wrapping key from the wallet signature.
  const salt = new Uint8Array([]);
  const info = new TextEncoder().encode('elizatown-room-wrap-v1');
  const ikmHash = await sha256(sigBytes);

  const baseKey = await crypto.subtle.importKey('raw', ikmHash, 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt, info },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
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

async function aesGcmDecrypt(key, ivBytes, ctBytes, aadBytes) {
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBytes, additionalData: aadBytes || new Uint8Array([]) },
    key,
    ctBytes
  );
  return new Uint8Array(pt);
}

// --- wallet ---
let wallet = null;
let walletAddr = null;

async function connectWallet() {
  if (!window.solana || !window.solana.isPhantom) {
    throw new Error('NO_SOLANA_WALLET');
  }
  const resp = await window.solana.connect();
  wallet = window.solana;
  walletAddr = resp.publicKey.toString();
  el('walletAddr').textContent = walletAddr;
}

async function signMessage(message) {
  if (!wallet) throw new Error('WALLET_NOT_CONNECTED');
  const msgBytes = new TextEncoder().encode(message);
  const resp = await wallet.signMessage(msgBytes, 'utf8');
  // Phantom returns { signature: Uint8Array, publicKey }
  return resp.signature;
}

function buildUnlockMessage({ roomPubKey, nonce, origin }) {
  return [
    'ElizaTown Room Unlock',
    `roomPubKey: ${roomPubKey}`,
    `origin: ${origin}`,
    `nonce: ${nonce}`
  ].join('\n');
}

let unlocked = false;
let room = null; // { roomId, roomPubKey, nonce }
let KrootBytes = null; // Uint8Array (memory only)
let Kenc = null; // CryptoKey for room log encryption

// Phase 3: store minted ERC-8004 ids locally (not persisted yet)
let humanErc8004Id = null;
let agentErc8004Id = null;

function buildRoomDescriptor(currentRoomId) {
  const origin = window.location.origin;
  return {
    v: 1,
    kind: 'agent-town-room',
    room: {
      id: currentRoomId,
      pub: currentRoomId,
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
      meta: `${origin}/api/room/${encodeURIComponent(currentRoomId)}/meta`,
      log: `${origin}/api/room/${encodeURIComponent(currentRoomId)}/log`,
      append: `${origin}/api/room/${encodeURIComponent(currentRoomId)}/append`
    },
    ui: {
      roomUrl: `${origin}/room?room=${encodeURIComponent(currentRoomId)}`
    }
  };
}

function buildErc8004Statement(currentRoomId) {
  return {
    v: 1,
    kind: 'erc8004.link_room',
    roomPubKey: currentRoomId,
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
  const roomId = room?.roomId || new URLSearchParams(window.location.search).get('room');
  if (!roomId) throw new Error('NO_ROOM_ID');

  const chain = el('erc8004Chain')?.value || 'sepolia';
  const chainId = chain === 'mainnet' ? 1 : 11155111;

  if (chain === 'mainnet') {
    const ok = confirm('Mint on Ethereum mainnet? This will cost real gas.');
    if (!ok) return;
  }

  // Use the official Agent0 SDK (published on npm as `agent0-sdk`).
  // Prefer a vendored same-origin bundle for reliability (CSP/adblock/CDN flake).
  // Fallback to esm.sh if the vendored import fails.
  // For e2e tests we allow injecting a mock via window.__AG0_SDK_MOCK.
  const AGENT0_SDK_LOCAL_URL = '/vendor/agent0-sdk.1.4.2.bundle.mjs';
  const AGENT0_SDK_ESM_URL = 'https://esm.sh/agent0-sdk@1.4.2?bundle';

  let mod;
  if (window.__AG0_SDK_MOCK) {
    mod = window.__AG0_SDK_MOCK;
  } else {
    try {
      mod = await import(AGENT0_SDK_LOCAL_URL);
    } catch (eLocal) {
      console.warn('Agent0 SDK local import failed; falling back to esm.sh', eLocal);
      try {
        mod = await import(AGENT0_SDK_ESM_URL);
      } catch (eRemote) {
        console.error('Agent0 SDK esm.sh import also failed', eRemote);
        const detail = (eRemote && (eRemote.stack || eRemote.message)) || String(eRemote);
        throw new Error(`AG0_SDK_LOAD_FAILED: ${detail}`);
      }
    }
  }

  const SDKClass = mod && mod.SDK;
  if (typeof SDKClass !== 'function') {
    const keys = mod ? Object.keys(mod) : [];
    throw new Error(`AG0_SDK_LOAD_FAILED: missing SDK export (keys: ${keys.join(', ')})`);
  }

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

  const agentName = `Agent Town Room ${roomId.slice(0, 10)}`;
  const agentDesc = `E2EE shared room in Agent Town. roomId=${roomId}.`;

  const agent = sdk.createAgent(agentName, agentDesc);

  // Attach some metadata to make it discoverable off-chain later.
  try {
    agent.setMetadata?.({ roomId, origin: window.location.origin });
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
    status.innerHTML = txHash
      ? `Submitted: <a href="${explorerBase}${txHash}" target="_blank" rel="noreferrer">${txHash}</a>`
      : 'Submitted.';
  }

  // Wait for confirmation and then update the ERC-8004 statement.
  if (typeof tx?.waitConfirmed === 'function') {
    if (status) status.textContent = 'Waiting for confirmation…';
    const { result } = await tx.waitConfirmed();
    const agentId = result?.agentId;
    if (agentId) {
      humanErc8004Id = agentId;
      // If we haven't unlocked yet, still re-render the statement using the URL roomId
      renderDescriptorUI((room && room.roomId) ? room.roomId : roomId);
      if (status) status.textContent = `Minted identity: ${agentId}`;
    } else {
      if (status) status.textContent = 'Confirmed (no agentId returned).';
    }
  }
}

function renderDescriptorUI(currentRoomId) {
  const descriptor = buildRoomDescriptor(currentRoomId);
  const json = JSON.stringify(descriptor, null, 2);

  const d = el('descriptor');
  if (d) d.value = json;

  const stmt = buildErc8004Statement(currentRoomId);
  const s = el('erc8004');
  if (s) s.value = JSON.stringify(stmt, null, 2);

  const qrEl = el('qr');
  if (qrEl && typeof qrcode === 'function') {
    try {
      const qr = qrcode(0, 'M');
      qr.addData(json, 'Byte');
      qr.make();
      qrEl.innerHTML = qr.createSvgTag({ cellSize: 3, margin: 2, scalable: true, alt: 'Room descriptor QR' });
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

function wipeKeys() {
  unlocked = false;
  room = null;
  KrootBytes = null;
  Kenc = null;
  el('entries').textContent = '';
  el('roomId').textContent = '—';
  clearDescriptorUI();
}

async function deriveRoomEncKey(Kroot) {
  const info = new TextEncoder().encode('elizatown-room-enc-v1');
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

async function createRoom() {
  setError('');
  setStatus('Creating room…');
  if (!walletAddr) throw new Error('WALLET_NOT_CONNECTED');

  // Generate high-entropy room root key (Phase 1). Later: derive from ceremony.
  const Kroot = crypto.getRandomValues(new Uint8Array(32));
  const roomIdBytes = await sha256(Kroot);
  const roomPubKey = base58Encode(roomIdBytes); // public identifier

  // Ask server for a fresh nonce to bind the unlock signature.
  const n = await api('/api/room/nonce');
  const nonce = n.nonce;

  const msg = buildUnlockMessage({ roomPubKey, nonce, origin: window.location.origin });
  const sig = await signMessage(msg);
  const Kwrap = await hkdfKeyFromSig(sig);

  // Wrap Kroot for server storage (ciphertext only).
  const aad = new TextEncoder().encode(`roomPubKey=${roomPubKey}`);
  const wrapped = await aesGcmEncrypt(Kwrap, Kroot, aad);

  await api('/api/room/init', {
    method: 'POST',
    body: JSON.stringify({
      roomId: roomPubKey,
      roomPubKey,
      nonce,
      wrappedKey: { alg: 'AES-GCM', iv: b64(wrapped.iv), ct: b64(wrapped.ct) },
      unlock: { kind: 'solana-wallet-signature', address: walletAddr }
    })
  });

  // Now unlock locally.
  room = { roomId: roomPubKey, roomPubKey, nonce };
  KrootBytes = Kroot;
  Kenc = await deriveRoomEncKey(KrootBytes);
  unlocked = true;
  el('roomId').textContent = room.roomId;
  setStatus('Room created and unlocked.');

  renderDescriptorUI(room.roomId);
  await refreshEntries();
}

async function unlockExistingRoom(roomId) {
  setError('');
  setStatus('Unlocking room…');
  if (!walletAddr) throw new Error('WALLET_NOT_CONNECTED');

  const meta = await api(`/api/room/${encodeURIComponent(roomId)}/meta`);
  const { roomPubKey, nonce } = meta;

  const msg = buildUnlockMessage({ roomPubKey, nonce, origin: window.location.origin });
  const sig = await signMessage(msg);
  const Kwrap = await hkdfKeyFromSig(sig);

  const wrapped = meta.wrappedKey;
  const aad = new TextEncoder().encode(`roomPubKey=${roomPubKey}`);
  const Kroot = await aesGcmDecrypt(Kwrap, unb64(wrapped.iv), unb64(wrapped.ct), aad);

  room = { roomId, roomPubKey, nonce };
  KrootBytes = Kroot;
  Kenc = await deriveRoomEncKey(KrootBytes);
  unlocked = true;
  el('roomId').textContent = room.roomId;
  setStatus('Unlocked.');

  renderDescriptorUI(room.roomId);
  await refreshEntries();
}

async function appendEntry() {
  if (!unlocked || !room || !Kenc) throw new Error('LOCKED');
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
  const aad = new TextEncoder().encode(`room=${room.roomId}`);
  const enc = await aesGcmEncrypt(Kenc, pt, aad);
  const ciphertext = { alg: 'AES-GCM', iv: b64(enc.iv), ct: b64(enc.ct) };

  await api(`/api/room/${encodeURIComponent(room.roomId)}/append`, {
    method: 'POST',
    body: JSON.stringify({ ciphertext, author: 'human' })
  });

  el('entryText').value = '';
  await refreshEntries();
}

async function refreshEntries() {
  if (!unlocked || !room || !Kenc) return;
  const data = await api(`/api/room/${encodeURIComponent(room.roomId)}/log`);
  const aad = new TextEncoder().encode(`room=${room.roomId}`);
  const lines = [];
  for (const entry of data.entries || []) {
    try {
      const iv = unb64(entry.ciphertext.iv);
      const ct = unb64(entry.ciphertext.ct);
      const pt = await aesGcmDecrypt(Kenc, iv, ct, aad);
      const obj = JSON.parse(new TextDecoder().decode(pt));
      lines.push(`[${new Date(obj.ts).toLocaleString()}] (${obj.author}) ${obj.type}: ${obj.body?.text ?? ''}`);
    } catch (e) {
      lines.push(`[decrypt failed] ${e.message}`);
    }
  }
  el('entries').textContent = lines.join('\n\n');
}

async function init() {
  // If URL has ?room=<id>, auto-fill and try unlock.
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get('room');
  if (roomId) {
    el('roomId').textContent = roomId;
  }

  el('connectWalletBtn').addEventListener('click', async () => {
    setError('');
    try {
      await connectWallet();
      setStatus('Wallet connected.');
    } catch (e) {
      setError(e.message === 'NO_SOLANA_WALLET' ? 'No Solana wallet found (need Phantom/Solflare).' : e.message);
    }
  });

  el('unlockBtn').addEventListener('click', async () => {
    setError('');
    try {
      const rid = new URLSearchParams(window.location.search).get('room') || el('roomId').textContent;
      if (!rid || rid === '—') throw new Error('NO_ROOM_ID');
      await unlockExistingRoom(rid);
    } catch (e) {
      setError(e.message);
    }
  });

  el('createRoomBtn').addEventListener('click', async () => {
    setError('');
    try {
      await createRoom();
      // Put the room id into the URL for shareable re-open.
      const params2 = new URLSearchParams(window.location.search);
      params2.set('room', room.roomId);
      window.history.replaceState({}, '', `${window.location.pathname}?${params2.toString()}`);
    } catch (e) {
      setError(e.message);
    }
  });

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

  setStatus('Ready. Connect wallet, then create or unlock a room.');
}

init().catch((e) => {
  console.error(e);
  setError(e.message);
});
