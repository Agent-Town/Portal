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

  const pivot = metadata && metadata.pivot && typeof metadata.pivot.x === 'number' ? metadata.pivot : { x: frameW / 2, y: frameH };

  // Isometric (2:1 diamond) world settings.
  const tileW = 64;
  const tileH = 32;
  const mapW = 18;
  const mapH = 18;

  const origin = {
    x: canvas.width / 2,
    y: 46
  };

  const drawScale = 2;
  const dstW = frameW * drawScale;
  const dstH = frameH * drawScale;
  const pivotX = pivot.x * drawScale;
  const pivotY = pivot.y * drawScale;

  const speedTiles = 2.2; // tiles/s

  const state = {
    tx: mapW / 2,
    ty: mapH / 2,
    vx: 0,
    vy: 0,
    dir: 'se',
    clip: 'idle',
    frameIdx: 0,
    tClipMs: 0,
    lastTs: performance.now()
  };

  function chooseDirection(vx, vy, current) {
    // Map motion vector to iso facings (SE, SW, NW, NE).
    if (vx > 0) return 'se'; // +x projects down-right
    if (vx < 0) return 'nw'; // -x projects up-left
    if (vy > 0) return 'sw'; // +y projects down-left
    if (vy < 0) return 'ne'; // -y projects up-right
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

  function tileTop(tx, ty) {
    return {
      x: origin.x + (tx - ty) * (tileW / 2),
      y: origin.y + (tx + ty) * (tileH / 2)
    };
  }

  function tileCenter(tx, ty) {
    const t = tileTop(tx, ty);
    return { x: t.x, y: t.y + tileH / 2 };
  }

  function drawDiamond(topX, topY, fill) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.lineTo(topX + tileW / 2, topY + tileH / 2);
    ctx.lineTo(topX, topY + tileH);
    ctx.lineTo(topX - tileW / 2, topY + tileH / 2);
    ctx.closePath();
    ctx.fill();
  }

  function drawMap() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(28, 70, 50, 1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let ty = 0; ty < mapH; ty += 1) {
      for (let tx = 0; tx < mapW; tx += 1) {
        const top = tileTop(tx, ty);
        const on = (tx + ty) % 2 === 0;
        drawDiamond(top.x, top.y, on ? 'rgba(45, 105, 70, 0.98)' : 'rgba(41, 97, 66, 0.98)');
      }
    }

    // A minimal "house" demo (base layer). Roof is drawn after the avatar for occlusion.
    const house = tileCenter(10, 8);
    drawHouseBase(house.x, house.y);
  }

  function drawHouseBase(x, y) {
    // Pivot at bottom-center contact point.
    // Footprint (ground) diamond:
    ctx.fillStyle = 'rgba(120, 85, 55, 0.95)';
    ctx.beginPath();
    ctx.moveTo(x, y - tileH / 2);
    ctx.lineTo(x + tileW / 2, y);
    ctx.lineTo(x, y + tileH / 2);
    ctx.lineTo(x - tileW / 2, y);
    ctx.closePath();
    ctx.fill();

    // Walls (simple block).
    ctx.fillStyle = 'rgba(145, 105, 70, 0.95)';
    ctx.fillRect(Math.round(x - 18), Math.round(y - 32), 36, 26);

    // Door hint.
    ctx.fillStyle = 'rgba(65, 45, 30, 0.95)';
    ctx.fillRect(Math.round(x - 6), Math.round(y - 18), 12, 12);
  }

  function drawHouseRoof(x, y) {
    // Roof sits above walls; intentionally drawn after avatar for "walk behind" occlusion.
    ctx.fillStyle = 'rgba(95, 52, 38, 0.98)';
    ctx.beginPath();
    ctx.moveTo(x, y - 54);
    ctx.lineTo(x + 26, y - 40);
    ctx.lineTo(x, y - 28);
    ctx.lineTo(x - 26, y - 40);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(78, 40, 30, 0.98)';
    ctx.fillRect(Math.round(x - 2), Math.round(y - 62), 4, 10);
  }

  function drawAvatar() {
    const frames = clipFrames(state.clip, state.dir);
    const idx = frameIndex(frames, state.tClipMs);
    const f = frames[idx];
    state.frameIdx = idx;
    if (!f) return;

    const sx = f.x * atlasScale;
    const sy = f.y * atlasScale;
    const sw = f.w * atlasScale;
    const sh = f.h * atlasScale;

    const pos = tileCenter(state.tx, state.ty);
    ctx.drawImage(
      atlasImg,
      sx,
      sy,
      sw,
      sh,
      Math.round(pos.x - pivotX),
      Math.round(pos.y - pivotY),
      dstW,
      dstH
    );
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
    state.tx = clamp(state.tx + state.vx * speedTiles * dt, 0, mapW - 1);
    state.ty = clamp(state.ty + state.vy * speedTiles * dt, 0, mapH - 1);

    drawMap();
    drawAvatar();
    const house = tileCenter(10, 8);
    drawHouseRoof(house.x, house.y);
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
    // Keep to 4 iso directions (no 8-way input).
    const next =
      keys.has('ArrowUp')
        ? { vx: -1, vy: 0 }
        : keys.has('ArrowDown')
          ? { vx: 1, vy: 0 }
          : keys.has('ArrowLeft')
            ? { vx: 0, vy: 1 }
            : keys.has('ArrowRight')
              ? { vx: 0, vy: -1 }
              : { vx: 0, vy: 0 };
    setMove(next.vx, next.vy);
  });
  window.addEventListener('keyup', (e) => {
    keys.delete(e.key);
    const next =
      keys.has('ArrowUp')
        ? { vx: -1, vy: 0 }
        : keys.has('ArrowDown')
          ? { vx: 1, vy: 0 }
          : keys.has('ArrowLeft')
            ? { vx: 0, vy: 1 }
            : keys.has('ArrowRight')
              ? { vx: 0, vy: -1 }
              : { vx: 0, vy: 0 };
    setMove(next.vx, next.vy);
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

  // D-pad maps to screen directions, which are diagonal in iso.
  bindHold(el('btnUp'), -1, 0); // NW
  bindHold(el('btnDown'), 1, 0); // SE
  bindHold(el('btnLeft'), 0, 1); // SW
  bindHold(el('btnRight'), 0, -1); // NE

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
