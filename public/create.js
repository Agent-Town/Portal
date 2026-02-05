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
    throw err;
  }
  return data;
}

function el(id) {
  return document.getElementById(id);
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
          await api('/api/human/canvas/paint', {
            method: 'POST',
            body: JSON.stringify({ x, y, color: selectedColor })
          });
          // Optimistically update
          pixels[idx] = selectedColor;
          b.dataset.color = String(selectedColor);
          b.style.background = palette[selectedColor];
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
  setHouseNavLink(st.houseId || null);
  const params = new URLSearchParams(window.location.search);
  const requestedToken = params.get('mode') === 'token';
  const signupMode = st.signup?.mode || (st.signup?.complete ? 'agent' : null);
  const tokenMode = signupMode === 'token';
  const tokenAddress = st.signup?.address || null;
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
  if (requestedToken && signupMode !== 'token') {
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
    intro.textContent = tokenMode
      ? 'Solo flow: paint a few pixels to seed your house key, then lock it in.'
      : 'Human: click pixels. Agent: paint via the skill API. When it feels done, lock it in.';
  }
  const nextNote = el('createNextNote');
  if (nextNote) {
    nextNote.textContent = tokenMode
      ? 'Next: unlock the house with a Solana wallet signature. You can invite an agent later.'
      : 'Next: unlock the house with a Solana wallet signature. Then you and the agent can read/write encrypted entries.';
  }

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
    if (!window.solana) throw new Error('NO_SOLANA_WALLET');
    if (typeof window.solana.signMessage !== 'function') throw new Error('NO_SOLANA_SIGN');
    const resp = await window.solana.connect();
    return { wallet: window.solana, address: resp.publicKey.toString() };
  }

  async function sha256(bytes) {
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return new Uint8Array(digest);
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

  async function signMessageBytes(wallet, message) {
    const msgBytes = new TextEncoder().encode(message);
    const resp = await wallet.signMessage(msgBytes, 'utf8');
    const sigBytes = resp?.signature || resp;
    const sigArr = normalizeSignatureBytes(sigBytes);
    if (!sigArr) throw new Error('SIGNATURE_FORMAT');
    return sigArr;
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

  el('shareBtn').addEventListener('click', async () => {
    el('err').textContent = '';
    el('shareStatus').style.display = 'inline-flex';
    try {
      const { wallet, address } = await connectWalletOrThrow();
      if (tokenMode && tokenAddress && address !== tokenAddress) {
        throw new Error('WALLET_MISMATCH');
      }

      // 1) Human computes Rh from canvas and commits+reveals it.
      const Rh = await deriveRhFromCanvas(pixels);
      const humanCommit = b64(await sha256(Rh));
      const humanReveal = b64(Rh);
      await api('/api/human/house/commit', { method: 'POST', body: JSON.stringify({ commit: humanCommit }) });
      await api('/api/human/house/reveal', { method: 'POST', body: JSON.stringify({ reveal: humanReveal }) });

      let Kroot = null;
      if (tokenMode) {
        // Solo flow: derive Kroot from the human entropy only.
        Kroot = await sha256(Rh);
      } else {
        // 2) Wait for agent reveal (agent contributes Ra) via agent endpoints.
        const mat = await api('/api/human/house/material');
        if (!mat.agentReveal) {
          throw new Error('WAITING_AGENT_REVEAL');
        }
        const Ra = Uint8Array.from(atob(mat.agentReveal), (c) => c.charCodeAt(0));

        // 3) Derive Kroot = sha256(Rh||Ra) and houseId.
        const combo = new Uint8Array(Rh.length + Ra.length);
        combo.set(Rh, 0);
        combo.set(Ra, Rh.length);
        Kroot = await sha256(combo);
      }

      const houseIdBytes = await sha256(Kroot);
      const housePubKey = base58Encode(houseIdBytes);
      const houseAuthKey = b64(await deriveHouseAuthKey(Kroot));

      // 3.5) Wrap K_root with a deterministic wallet signature for recovery.
      const wrapMsg = buildKeyWrapMessage({ houseId: housePubKey, origin: window.location.origin });
      const wrapSig = await signMessageBytes(wallet, wrapMsg);
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
          unlock: { kind: 'solana-wallet-signature', address },
          keyWrap,
          houseAuthKey
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
          ? 'Waiting for agent to contribute to the house ceremony. Ask your agent to call /api/agent/house/commit then /api/agent/house/reveal (see skill.md).'
          : e.message;
      el('shareStatus').style.display = 'none';
    }
  });

  pollCanvas();
}

init().catch((e) => {
  console.error(e);
  el('err').textContent = e.message;
});
