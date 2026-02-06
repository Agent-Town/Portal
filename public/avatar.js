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

async function uploadAvatar(file) {
  const fd = new FormData();
  fd.append('avatar', file, file.name || 'avatar');
  const res = await fetch('/api/avatar/upload', {
    method: 'POST',
    credentials: 'include',
    body: fd
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data && data.error ? data.error : `HTTP_${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function waitForJob(jobId, timeoutMs = 20000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const r = await apiJson(`/api/avatar/jobs/${encodeURIComponent(jobId)}`);
    const st = r && r.job ? r.job.status : null;
    if (st === 'completed' || st === 'failed') return r.job;
    await new Promise((resolve) => setTimeout(resolve, 140));
  }
  throw new Error('TIMEOUT');
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('IMAGE_LOAD_FAILED'));
    img.src = url;
  });
}

function setStatus(msg) {
  const node = el('avatarStatus');
  if (!node) return;
  if (!msg) {
    node.style.display = 'none';
    node.textContent = '';
    return;
  }
  node.style.display = 'inline-flex';
  node.textContent = msg;
}

function setError(msg) {
  const node = el('avatarError');
  if (node) node.textContent = msg || '';
}

function setDebug(msg) {
  const node = el('avatarDebug');
  if (node) node.textContent = msg || '';
}

function configureCanvas(canvas, w, h) {
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return ctx;
}

function startDirectionalPreview({ metadata, atlasImg, atlasScale }) {
  const previewPanel = el('previewPanel');
  if (previewPanel) previewPanel.classList.remove('is-hidden');

  const directions = [
    { dir: 'south', canvas: el('prevSouth') },
    { dir: 'north', canvas: el('prevNorth') },
    { dir: 'west', canvas: el('prevWest') },
    { dir: 'east', canvas: el('prevEast') }
  ];

  const targetW = metadata.frame.w * 2;
  const targetH = metadata.frame.h * 2;
  const contexts = directions.map(({ dir, canvas }) => {
    const ctx = configureCanvas(canvas, targetW, targetH);
    return { dir, ctx };
  });

  const framesByDir = {};
  directions.forEach(({ dir }) => {
    framesByDir[dir] = (metadata.clips.walk && metadata.clips.walk[dir]) || [];
  });

  const startAt = performance.now();

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

  function tick(now) {
    const t = now - startAt;
    const idxSouth = frameIndex(framesByDir.south, t);
    setDebug(`atlasScale=${atlasScale} walk(south) frame=${idxSouth}`);

    for (const { dir, ctx } of contexts) {
      const frames = framesByDir[dir];
      const idx = frameIndex(frames, t);
      const f = frames[idx];
      ctx.clearRect(0, 0, targetW, targetH);
      if (!f) continue;
      ctx.drawImage(
        atlasImg,
        f.x * atlasScale,
        f.y * atlasScale,
        f.w * atlasScale,
        f.h * atlasScale,
        0,
        0,
        targetW,
        targetH
      );
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

async function renderPreview(avatarId) {
  const pkg = await apiJson(`/api/avatar/${encodeURIComponent(avatarId)}/package`);
  const meta = await apiJson(pkg.assets.metadataJson);
  const atlasUrl = pkg.assets.atlas2xPng || pkg.assets.atlasPng;
  const atlasImg = await loadImage(atlasUrl);

  const atlasScale = Math.max(1, Math.round(atlasImg.width / (meta.atlas && meta.atlas.w ? meta.atlas.w : atlasImg.width)));

  startDirectionalPreview({ metadata: meta, atlasImg, atlasScale });
}

async function run(file) {
  setError('');
  setStatus('Uploading…');

  const out = await uploadAvatar(file);
  const avatarId = out.avatarId;
  const jobId = out.jobId;

  try {
    localStorage.setItem('agentTownAvatarId', avatarId);
  } catch {
    // ignore
  }

  const openWorldLink = el('openWorldLink');
  if (openWorldLink) {
    openWorldLink.href = `/world?avatar=${encodeURIComponent(avatarId)}`;
  }

  setStatus('Processing…');
  const job = await waitForJob(jobId);

  if (job.status !== 'completed') {
    setStatus('');
    setError(job.errorCode || 'FAILED');
    return;
  }

  setStatus('Ready');
  if (openWorldLink) openWorldLink.classList.remove('is-hidden');

  await renderPreview(avatarId);
}

function init() {
  const file = el('avatarFile');
  const btn = el('avatarUploadBtn');

  function selectedFile() {
    const f = file && file.files ? file.files[0] : null;
    return f || null;
  }

  if (file) {
    file.addEventListener('change', () => {
      setError('');
      const f = selectedFile();
      if (btn) btn.disabled = !f;
    });
  }

  if (btn) {
    btn.addEventListener('click', async () => {
      try {
        btn.disabled = true;
        const f = selectedFile();
        if (!f) return;
        await run(f);
      } catch (e) {
        setStatus('');
        setError(e && e.message ? e.message : 'FAILED');
      } finally {
        btn.disabled = !selectedFile();
      }
    });
  }

  // Auto-open last avatar preview if present.
  try {
    const last = localStorage.getItem('agentTownAvatarId');
    if (last) {
      const openWorldLink = el('openWorldLink');
      if (openWorldLink) {
        openWorldLink.href = `/world?avatar=${encodeURIComponent(last)}`;
        openWorldLink.classList.remove('is-hidden');
      }
    }
  } catch {
    // ignore
  }
}

init();
