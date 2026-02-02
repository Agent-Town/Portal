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
  if (!st.signup?.complete) {
    window.location.href = '/';
    return;
  }

  const state = await api('/api/canvas/state');
  palette = state.palette;
  pixels = state.canvas.pixels.slice();

  renderPalette();
  renderCanvas(state.canvas.w, state.canvas.h);

  el('shareBtn').addEventListener('click', async () => {
    el('err').textContent = '';
    el('shareStatus').style.display = 'inline-flex';
    try {
      const r = await api('/api/share/create', { method: 'POST', body: '{}' });
      window.location.href = r.sharePath;
    } catch (e) {
      el('err').textContent = e.message;
      el('shareStatus').style.display = 'none';
    }
  });

  pollCanvas();
}

init().catch((e) => {
  console.error(e);
  el('err').textContent = e.message;
});
