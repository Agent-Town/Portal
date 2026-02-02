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
let lastState = null;

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
  const hasHuman = !!(lastState && lastState.human && lastState.human.xPostUrl);
  const hasAgent = !!(lastState && lastState.agent && lastState.agent.posts && lastState.agent.posts.moltbookUrl);
  const ready = hasHuman && hasAgent && hasInk();
  el('shareBtn').disabled = !ready;
}

function setAgentPostsStatus(state) {
  const p = state && state.agent && state.agent.posts ? state.agent.posts : {};
  const parts = [];
  if (p.moltbookUrl) parts.push(`Moltbook: ${p.moltbookUrl}`);
  if (p.moltXUrl) parts.push(`MoltX: ${p.moltXUrl}`);
  el('agentPostsCreate').textContent = parts.length ? parts.join(' | ') : 'Waiting for agent post links...';
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

async function pollState() {
  try {
    const state = await api('/api/state');
    lastState = state;
    if (state.human?.xPostUrl && !el('xUrlCreate').value) {
      el('xUrlCreate').value = state.human.xPostUrl;
    }
    setAgentPostsStatus(state);
    updateLockState();
  } catch (e) {
    // ignore transient
  } finally {
    setTimeout(pollState, 900);
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
  lastState = st;

  const state = await api('/api/canvas/state');
  palette = state.palette;
  pixels = state.canvas.pixels.slice();

  renderPalette();
  renderCanvas(state.canvas.w, state.canvas.h);

  if (st.human?.xPostUrl) {
    el('xUrlCreate').value = st.human.xPostUrl;
  }
  setAgentPostsStatus(st);
  updateLockState();

  el('saveXCreate').addEventListener('click', async () => {
    el('err').textContent = '';
    try {
      await api('/api/human/posts', { method: 'POST', body: JSON.stringify({ xPostUrl: el('xUrlCreate').value }) });
      el('xSavedCreate').style.display = 'inline-flex';
      setTimeout(() => (el('xSavedCreate').style.display = 'none'), 1200);
      const next = await api('/api/state');
      lastState = next;
      updateLockState();
    } catch (e) {
      el('err').textContent = e.message === 'HANDLE_TAKEN'
        ? 'That X account has already been used.'
        : e.message;
    }
  });

  el('shareBtn').addEventListener('click', async () => {
    el('err').textContent = '';
    el('shareStatus').style.display = 'inline-flex';
    try {
      const r = await api('/api/share/create', { method: 'POST', body: '{}' });
      window.location.href = `/share/${r.shareId}`;
    } catch (e) {
      el('err').textContent = e.message === 'POSTS_REQUIRED'
        ? 'Add your X link and have your agent save its post link before locking in.'
        : e.message === 'EMPTY_CANVAS'
          ? 'Add at least one pixel before locking in.'
          : e.message;
      el('shareStatus').style.display = 'none';
    }
  });

  pollCanvas();
  pollState();
}

init().catch((e) => {
  console.error(e);
  el('err').textContent = e.message;
});
