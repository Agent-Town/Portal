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

function setStatus(msg) {
  const node = el('labStatus');
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
  const node = el('labError');
  if (node) node.textContent = msg || '';
}

function showNode(node, shouldShow) {
  if (!node) return;
  node.style.display = shouldShow ? '' : 'none';
}

function setHiddenByClass(node, hidden) {
  if (!node) return;
  node.classList.toggle('is-hidden', !!hidden);
}

function clearLinks(node) {
  if (node) node.innerHTML = '';
}

function setLinks(container, links) {
  if (!container) return;
  container.innerHTML = '';
  for (const l of links) {
    const a = document.createElement('a');
    a.href = l.href;
    a.textContent = l.label;
    a.target = '_blank';
    a.rel = 'noreferrer';
    container.appendChild(a);
  }
}

function configureCanvas(canvas, w, h) {
  if (!canvas) return null;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return ctx;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('IMAGE_LOAD_FAILED'));
    img.src = url;
  });
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

async function uploadStaticAsset(file, options) {
  const fd = new FormData();
  fd.append('asset', file, file.name || 'asset');
  if (options && typeof options.kind === 'string') fd.append('kind', options.kind);
  if (options && options.tileFootprintW != null) fd.append('tileFootprintW', String(options.tileFootprintW));
  if (options && options.tileFootprintH != null) fd.append('tileFootprintH', String(options.tileFootprintH));
  if (options && options.pixelateTo != null) fd.append('pixelateTo', String(options.pixelateTo));
  if (options && options.quantizeBits != null) fd.append('quantizeBits', String(options.quantizeBits));

  const res = await fetch('/api/static-asset/upload', {
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

async function waitForAvatarJob(jobId, timeoutMs = 25000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const r = await apiJson(`/api/avatar/jobs/${encodeURIComponent(jobId)}`);
    const st = r && r.job ? r.job.status : null;
    if (st === 'completed' || st === 'failed') return r.job;
    await new Promise((resolve) => setTimeout(resolve, 140));
  }
  throw new Error('TIMEOUT');
}

async function waitForStaticJob(jobId, timeoutMs = 25000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const r = await apiJson(`/api/static-asset/jobs/${encodeURIComponent(jobId)}`);
    const st = r && r.job ? r.job.status : null;
    if (st === 'completed' || st === 'failed') return r.job;
    await new Promise((resolve) => setTimeout(resolve, 140));
  }
  throw new Error('TIMEOUT');
}

let avatarAnimToken = 0;

function startDirectionalPreview({ metadata, atlasImg, atlasScale }) {
  avatarAnimToken += 1;
  const token = avatarAnimToken;

  const panel = el('avatarPreviewPanel');
  if (panel) panel.classList.remove('is-hidden');

  const directions = [
    { dir: 'se', canvas: el('aPrevSE') },
    { dir: 'sw', canvas: el('aPrevSW') },
    { dir: 'nw', canvas: el('aPrevNW') },
    { dir: 'ne', canvas: el('aPrevNE') }
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

  const debug = el('avatarDebug');

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
    if (token !== avatarAnimToken) return; // cancelled
    const t = now - startAt;
    const idxSe = frameIndex(framesByDir.se, t);
    if (debug) debug.textContent = `atlasScale=${atlasScale} walk(se) frame=${idxSe}`;

    for (const { dir, ctx } of contexts) {
      if (!ctx) continue;
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

async function renderAvatarPreview(avatarId) {
  const pkg = await apiJson(`/api/avatar/${encodeURIComponent(avatarId)}/package`);
  const meta = await apiJson(pkg.assets.metadataJson);
  const atlasUrl = pkg.assets.atlas2xPng || pkg.assets.atlasPng;
  const atlasImg = await loadImage(atlasUrl);

  const atlasScale = Math.max(
    1,
    Math.round(atlasImg.width / (meta.atlas && meta.atlas.w ? meta.atlas.w : atlasImg.width))
  );

  startDirectionalPreview({ metadata: meta, atlasImg, atlasScale });

  setLinks(el('avatarLinks'), [
    { label: 'package.json', href: `/api/avatar/${encodeURIComponent(avatarId)}/package` },
    { label: 'atlas.png', href: pkg.assets.atlasPng },
    { label: 'atlas@2x.png', href: pkg.assets.atlas2xPng },
    { label: 'atlas.json', href: pkg.assets.metadataJson },
    { label: 'manifest.json', href: pkg.assets.manifestJson }
  ]);
}

async function renderStaticPreview(assetId) {
  const pkg = await apiJson(`/api/static-asset/${encodeURIComponent(assetId)}/package`);
  const manifest = await apiJson(pkg.assets.manifestJson);

  const manifestNode = el('staticManifest');
  if (manifestNode) {
    manifestNode.textContent = JSON.stringify(manifest, null, 2);
  }

  const spriteUrl = pkg.assets.sprite2xPng || pkg.assets.spritePng;
  const spriteImg = await loadImage(spriteUrl);
  const canvas = el('sPrev');
  const ctx = configureCanvas(canvas, spriteImg.width, spriteImg.height);
  if (ctx) {
    ctx.clearRect(0, 0, spriteImg.width, spriteImg.height);
    ctx.drawImage(spriteImg, 0, 0);

    const origin = manifest && manifest.pivot && Array.isArray(manifest.pivot.origin) ? manifest.pivot.origin : [0.5, 1];
    const px = spriteImg.width * origin[0];
    const py = spriteImg.height * origin[1];

    ctx.fillStyle = 'rgba(255, 58, 58, 0.95)';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  const panel = el('staticPreviewPanel');
  if (panel) panel.classList.remove('is-hidden');

  setLinks(el('staticLinks'), [
    { label: 'package.json', href: `/api/static-asset/${encodeURIComponent(assetId)}/package` },
    { label: 'sprite.png', href: pkg.assets.spritePng },
    { label: 'sprite@2x.png', href: pkg.assets.sprite2xPng },
    { label: 'manifest.json', href: pkg.assets.manifestJson }
  ]);
}

function readStaticOptions() {
  const kind = el('staticKind') ? el('staticKind').value : 'prop';
  const tileFootprintW = el('footW') ? Number(el('footW').value) : 1;
  const tileFootprintH = el('footH') ? Number(el('footH').value) : 1;
  const pixelateTo = el('pixelateTo') ? Number(el('pixelateTo').value) : 128;
  const quantizeBits = el('quantBits') ? Number(el('quantBits').value) : 0;
  return { kind, tileFootprintW, tileFootprintH, pixelateTo, quantizeBits };
}

function resetPreviews() {
  avatarAnimToken += 1;
  setHiddenByClass(el('avatarPreviewPanel'), true);
  setHiddenByClass(el('staticPreviewPanel'), true);
  if (el('avatarDebug')) el('avatarDebug').textContent = '';
  if (el('staticManifest')) el('staticManifest').textContent = '';
  clearLinks(el('avatarLinks'));
  clearLinks(el('staticLinks'));

  // Clear canvases to avoid stale frames when switching modes.
  for (const id of ['aPrevSE', 'aPrevSW', 'aPrevNW', 'aPrevNE', 'sPrev']) {
    const c = el(id);
    if (!c) continue;
    const ctx = c.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, c.width, c.height);
  }
}

function init() {
  const modeAvatarBtn = el('modeAvatar');
  const modeStaticBtn = el('modeStatic');
  const staticOptions = el('staticOptions');
  const fileInput = el('labFile');
  const genBtn = el('labGenerateBtn');

  let mode = 'avatar'; // default

  function selectedFile() {
    const f = fileInput && fileInput.files ? fileInput.files[0] : null;
    return f || null;
  }

  function setMode(next) {
    mode = next === 'static' ? 'static' : 'avatar';
    setError('');
    setStatus('');
    resetPreviews();

    if (modeAvatarBtn) {
      const pressed = mode === 'avatar';
      modeAvatarBtn.setAttribute('aria-pressed', pressed ? 'true' : 'false');
      modeAvatarBtn.classList.toggle('primary', pressed);
    }
    if (modeStaticBtn) {
      const pressed = mode === 'static';
      modeStaticBtn.setAttribute('aria-pressed', pressed ? 'true' : 'false');
      modeStaticBtn.classList.toggle('primary', pressed);
    }

    showNode(staticOptions, mode === 'static');

    if (genBtn) {
      const f = selectedFile();
      genBtn.disabled = !f;
    }
  }

  function updateOutput(rangeId, outId) {
    const r = el(rangeId);
    const o = el(outId);
    if (!r || !o) return;
    o.textContent = String(r.value);
  }

  if (modeAvatarBtn) {
    modeAvatarBtn.addEventListener('click', () => setMode('avatar'));
  }
  if (modeStaticBtn) {
    modeStaticBtn.addEventListener('click', () => setMode('static'));
  }

  if (fileInput) {
    fileInput.addEventListener('change', () => {
      setError('');
      setStatus('');
      resetPreviews();
      if (genBtn) genBtn.disabled = !selectedFile();
    });
  }

  const onStaticOptChange = () => {
    updateOutput('footW', 'footWVal');
    updateOutput('footH', 'footHVal');
    updateOutput('pixelateTo', 'pixelateVal');
    updateOutput('quantBits', 'quantBitsVal');
  };

  for (const id of ['footW', 'footH', 'pixelateTo', 'quantBits']) {
    const node = el(id);
    if (node) node.addEventListener('input', onStaticOptChange);
  }
  onStaticOptChange();

  if (genBtn) {
    genBtn.addEventListener('click', async () => {
      const f = selectedFile();
      if (!f) return;
      setError('');
      setStatus('Uploading…');
      genBtn.disabled = true;

      try {
        resetPreviews();

        if (mode === 'avatar') {
          const up = await uploadAvatar(f);
          setStatus('Processing…');
          const job = await waitForAvatarJob(up.jobId);
          if (job.status !== 'completed') {
            setStatus('');
            setError(job.errorCode || 'FAILED');
            return;
          }
          setStatus('Ready');
          setHiddenByClass(el('staticPreviewPanel'), true);
          await renderAvatarPreview(up.avatarId);
          setHiddenByClass(el('avatarPreviewPanel'), false);
          return;
        }

        const opts = readStaticOptions();
        const up = await uploadStaticAsset(f, opts);
        setStatus('Processing…');
        const job = await waitForStaticJob(up.jobId);
        if (job.status !== 'completed') {
          setStatus('');
          setError(job.errorCode || 'FAILED');
          return;
        }
        setStatus('Ready');
        setHiddenByClass(el('avatarPreviewPanel'), true);
        await renderStaticPreview(up.assetId);
        setHiddenByClass(el('staticPreviewPanel'), false);
      } catch (e) {
        setStatus('');
        setError(e && e.message ? e.message : 'FAILED');
      } finally {
        genBtn.disabled = !selectedFile();
      }
    });
  }

  setMode('avatar');
}

init();

