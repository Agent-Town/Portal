/* eslint-disable no-console */

function el(id) {
  return document.getElementById(id);
}

async function apiJson(url, opts = {}) {
  const headers = { 'content-type': 'application/json', ...(opts.headers || {}) };
  const res = await fetch(url, { credentials: 'include', ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data && data.error ? data.error : `HTTP_${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('IMAGE_LOAD_FAILED'));
    img.src = url;
  });
}

function setError(msg) {
  const node = el('worldError');
  if (node) node.textContent = msg || '';
}

function setStateText(s) {
  const node = el('worldAvatarState');
  if (node) node.textContent = s || 'avatar: —';
}

function configureCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return ctx;
}

function parseQuery() {
  const params = new URLSearchParams(window.location.search);
  return {
    avatar: params.get('avatar')
  };
}

function pickStoredAvatar() {
  try {
    return localStorage.getItem('agentTownAvatarId') || null;
  } catch {
    return null;
  }
}

function saveStoredAvatar(id) {
  try {
    localStorage.setItem('agentTownAvatarId', id);
  } catch {
    // ignore
  }
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function startWorld({ avatarId, metadata, atlasImg, atlasScale }) {
  const canvas = el('worldCanvas');
  const ctx = configureCanvas(canvas);

  const frameW = metadata.frame.w;
  const frameH = metadata.frame.h;

  const speed = 60; // px/s

  const state = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    vx: 0,
    vy: 0,
    dir: 'south',
    clip: 'idle',
    frameIdx: 0,
    tClipMs: 0,
    lastTs: performance.now()
  };

  function chooseDirection(vx, vy, current) {
    if (Math.abs(vx) > Math.abs(vy)) {
      if (vx > 0) return 'east';
      if (vx < 0) return 'west';
    } else {
      if (vy > 0) return 'south';
      if (vy < 0) return 'north';
    }
    return current;
  }

  function clipFrames(clip, dir) {
    const byClip = metadata.clips && metadata.clips[clip] ? metadata.clips[clip] : null;
    const frames = byClip && byClip[dir] ? byClip[dir] : [];
    return frames;
  }

  function frameIndex(frames, tMs) {
    if (!frames.length) return 0;
    const dur = frames.reduce((acc, f) => acc + (f.durationMs || 0), 0) || 1;
    let t = tMs % dur;
    for (let i = 0; i < frames.length; i++) {
      const d = frames[i].durationMs || 0;
      if (t < d) return i;
      t -= d;
    }
    return frames.length - 1;
  }

  function drawMap() {
    // Simple grass checkerboard.
    const tile = 16;
    for (let y = 0; y < canvas.height; y += tile) {
      for (let x = 0; x < canvas.width; x += tile) {
        const on = ((x / tile) | 0) % 2 === ((y / tile) | 0) % 2;
        ctx.fillStyle = on ? 'rgba(45, 105, 70, 0.95)' : 'rgba(40, 95, 64, 0.95)';
        ctx.fillRect(x, y, tile, tile);
      }
    }
    // Path strip.
    ctx.fillStyle = 'rgba(210, 180, 110, 0.9)';
    ctx.fillRect(canvas.width / 2 - 60, 0, 120, canvas.height);
  }

  function drawAvatar() {
    const frames = clipFrames(state.clip, state.dir);
    const idx = frameIndex(frames, state.tClipMs);
    const f = frames[idx];
    state.frameIdx = idx;
    if (!f) return;

    const dstW = frameW * 2;
    const dstH = frameH * 2;
    const sx = f.x * atlasScale;
    const sy = f.y * atlasScale;
    const sw = f.w * atlasScale;
    const sh = f.h * atlasScale;

    ctx.drawImage(atlasImg, sx, sy, sw, sh, Math.round(state.x - dstW / 2), Math.round(state.y - dstH), dstW, dstH);
  }

  function updateDebug() {
    setStateText(`avatar: ${avatarId} clip=${state.clip} dir=${state.dir} frame=${state.frameIdx}`);
  }

  function tick(now) {
    const dtMs = now - state.lastTs;
    state.lastTs = now;

    const moving = state.vx !== 0 || state.vy !== 0;
    const nextClip = moving ? 'walk' : 'idle';
    const nextDir = chooseDirection(state.vx, state.vy, state.dir);

    if (nextClip !== state.clip || nextDir !== state.dir) {
      state.tClipMs = 0;
    } else {
      state.tClipMs += dtMs;
    }

    state.clip = nextClip;
    state.dir = nextDir;

    const dt = dtMs / 1000;
    state.x = clamp(state.x + state.vx * speed * dt, 24, canvas.width - 24);
    state.y = clamp(state.y + state.vy * speed * dt, 48, canvas.height - 8);

    drawMap();
    drawAvatar();
    updateDebug();

    requestAnimationFrame(tick);
  }

  function setMove(vx, vy) {
    state.vx = vx;
    state.vy = vy;
  }

  // Keyboard.
  const keys = new Set();
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      keys.add(e.key);
      e.preventDefault();
    }
    const vx = keys.has('ArrowLeft') ? -1 : keys.has('ArrowRight') ? 1 : 0;
    const vy = keys.has('ArrowUp') ? -1 : keys.has('ArrowDown') ? 1 : 0;
    setMove(vx, vy);
  });
  window.addEventListener('keyup', (e) => {
    keys.delete(e.key);
    const vx = keys.has('ArrowLeft') ? -1 : keys.has('ArrowRight') ? 1 : 0;
    const vy = keys.has('ArrowUp') ? -1 : keys.has('ArrowDown') ? 1 : 0;
    setMove(vx, vy);
  });

  // D-pad buttons (mouse/touch).
  function bindHold(btn, vx, vy) {
    let holding = false;
    function down(ev) {
      holding = true;
      setMove(vx, vy);
      ev.preventDefault();
    }
    function up(ev) {
      if (!holding) return;
      holding = false;
      setMove(0, 0);
      ev.preventDefault();
    }
    btn.addEventListener('pointerdown', down);
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', up);
    btn.addEventListener('pointerleave', up);
  }

  bindHold(el('btnLeft'), -1, 0);
  bindHold(el('btnRight'), 1, 0);
  bindHold(el('btnUp'), 0, -1);
  bindHold(el('btnDown'), 0, 1);

  // Start.
  drawMap();
  updateDebug();
  requestAnimationFrame(tick);
}

async function init() {
  setError('');

  const q = parseQuery();
  const avatarId = q.avatar || pickStoredAvatar();
  if (!avatarId) {
    setStateText('avatar: —');
    return;
  }

  saveStoredAvatar(avatarId);

  try {
    const pkg = await apiJson(`/api/avatar/${encodeURIComponent(avatarId)}/package`);
    const meta = await apiJson(pkg.assets.metadataJson);
    const atlasUrl = pkg.assets.atlas2xPng || pkg.assets.atlasPng;
    const atlasImg = await loadImage(atlasUrl);

    const atlasScale = Math.max(1, Math.round(atlasImg.width / (meta.atlas && meta.atlas.w ? meta.atlas.w : atlasImg.width)));

    startWorld({ avatarId, metadata: meta, atlasImg, atlasScale });
  } catch (e) {
    setError(e && e.message ? e.message : 'FAILED');
  }
}

init();
