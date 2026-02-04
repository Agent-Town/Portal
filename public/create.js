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
    throw err;
  }
  return data;
}

function el(id) {
  return document.getElementById(id);
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

  const state = await api('/api/canvas/state');
  palette = state.palette;
  pixels = state.canvas.pixels.slice();

  renderPalette();
  renderCanvas(state.canvas.w, state.canvas.h);
  updateLockState();

  async function connectWalletOrThrow() {
    if (!window.solana) throw new Error('NO_SOLANA_WALLET');
    const resp = await window.solana.connect();
    return { wallet: window.solana, address: resp.publicKey.toString() };
  }

  async function sha256(bytes) {
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return new Uint8Array(digest);
  }

  async function deriveRoomAuthKey(Kroot) {
    const info = new TextEncoder().encode('elizatown-room-auth-v1');
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

  // (Ceremony rooms) We no longer wrap/store K_root on the server.
  // Wallet signature is used as a UX "unlock" gate on /room, not for persistence.

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

  function buildUnlockMessage({ roomPubKey, nonce, origin }) {
    return [
      'ElizaTown Room Unlock',
      `roomPubKey: ${roomPubKey}`,
      `origin: ${origin}`,
      `nonce: ${nonce}`
    ].join('\n');
  }

  el('shareBtn').addEventListener('click', async () => {
    el('err').textContent = '';
    el('shareStatus').style.display = 'inline-flex';
    try {
      const { wallet, address } = await connectWalletOrThrow();

      // 1) Human computes Rh from canvas and commits+reveals it.
      const Rh = await deriveRhFromCanvas(pixels);
      const humanCommit = b64(await sha256(Rh));
      const humanReveal = b64(Rh);
      await api('/api/human/room/commit', { method: 'POST', body: JSON.stringify({ commit: humanCommit }) });
      await api('/api/human/room/reveal', { method: 'POST', body: JSON.stringify({ reveal: humanReveal }) });

      // 2) Wait for agent reveal (agent contributes Ra) via agent endpoints.
      const mat = await api('/api/human/room/material');
      if (!mat.agentReveal) {
        throw new Error('WAITING_AGENT_REVEAL');
      }
      const Ra = Uint8Array.from(atob(mat.agentReveal), (c) => c.charCodeAt(0));

      // 3) Derive Kroot = sha256(Rh||Ra) and roomId.
      const combo = new Uint8Array(Rh.length + Ra.length);
      combo.set(Rh, 0);
      combo.set(Ra, Rh.length);
      const Kroot = await sha256(combo);
      const roomIdBytes = await sha256(Kroot);
      const roomPubKey = base58Encode(roomIdBytes);
      const roomAuthKey = b64(await deriveRoomAuthKey(Kroot));

      // 4) Create the room container on the server.
      // Key source of truth is the ceremony (K_root derived from Rh||Ra); we do NOT store K_root (wrapped or otherwise) at rest.
      // Wallet signature remains the human UX "unlock" gate on the room page.
      const n = await api('/api/room/nonce');
      const nonce = n.nonce;

      await api('/api/room/init', {
        method: 'POST',
        body: JSON.stringify({
          roomId: roomPubKey,
          roomPubKey,
          nonce,
          keyMode: 'ceremony',
          unlock: { kind: 'solana-wallet-signature', address },
          roomAuthKey
        })
      });

      window.location.href = `/room?room=${encodeURIComponent(roomPubKey)}`;
    } catch (e) {
      el('err').textContent = e.message === 'EMPTY_CANVAS'
        ? 'Add at least one pixel before locking in.'
        : e.message === 'WAITING_AGENT_REVEAL'
          ? 'Waiting for agent to contribute to the room ceremony. Ask your agent to call /api/agent/room/commit then /api/agent/room/reveal (see skill.md).'
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
