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

  const HP = window.HousesProtocol;
  if (!HP) throw new Error('HOUSES_PROTOCOL_MISSING');
  const { b64, unb64, sha256, base58Encode, aesGcmEncrypt, deriveHouseAuthKey, buildKeyWrapMessage, signMessageBytes } = HP;

  async function deriveRhFromCanvas(pxs) {
    const raw = new TextEncoder().encode(JSON.stringify({ v: 1, pixels: pxs }));
    return sha256(raw);
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
        const Ra = unb64(mat.agentReveal);

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
