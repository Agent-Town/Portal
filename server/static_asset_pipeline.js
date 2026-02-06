const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');

const { nowIso, randomHex } = require('./util');
// Reuse the shared PipelineError class so server/index.js can treat errors uniformly.
const { PipelineError } = require('./avatar_pipeline');

// Bump when changing output bytes deterministically (sprite layout, scaling, manifest shape, etc).
const PIPELINE_VERSION = 'v1.0.0';
const TEMPLATE_VERSION = 't1.0.0';

const TILE = { w: 64, h: 32 };

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

const ARTIFACT_ROOT =
  process.env.STATIC_ASSET_ARTIFACT_ROOT || path.join(process.cwd(), 'data', 'static_asset_artifacts');

// In-memory metadata (MVP). Artifacts on disk are content-hash stable.
const assetsById = new Map();
const jobsById = new Map();
const assetIdBySessionArtifactKey = new Map();
const jobIdByAssetId = new Map();
const artifactsByKey = new Map();

const jobQueue = [];
let jobWorkerActive = false;

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function sha256Hex(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sanitizeKind(kind) {
  const k = String(kind || '').trim().toLowerCase();
  if (k === 'decal' || k === 'prop' || k === 'building') return k;
  return 'prop';
}

function clampInt(n, lo, hi, fallback) {
  const v = Number.isFinite(Number(n)) ? Math.trunc(Number(n)) : NaN;
  if (!Number.isFinite(v)) return fallback;
  return Math.max(lo, Math.min(hi, v));
}

function sanitizeFootprint(tileFootprint) {
  const w = clampInt(tileFootprint && tileFootprint.w, 1, 16, 1);
  const h = clampInt(tileFootprint && tileFootprint.h, 1, 16, 1);
  return { w, h };
}

function sanitizePixelateTo(pixelateTo) {
  // 0 disables pixelation; otherwise this is the maximum dimension of sprite.png.
  return clampInt(pixelateTo, 0, 512, 0);
}

function sanitizeQuantizeBits(quantizeBits) {
  // 0 disables quantization. 3..6 are typical; clamp for safety.
  return clampInt(quantizeBits, 0, 7, 0);
}

function optionsKeyFrom(options) {
  const o = options || {};
  const fp = o.tileFootprint || { w: 1, h: 1 };
  return `kind=${o.kind};fp=${fp.w}x${fp.h};pix=${o.pixelateTo};qbits=${o.quantizeBits}`;
}

function artifactDirFor({ sourceSha256, optionsHash }) {
  return path.join(ARTIFACT_ROOT, PIPELINE_VERSION, TEMPLATE_VERSION, optionsHash, sourceSha256);
}

async function alphaBounds(pngBuf, alphaMin = 24) {
  const raw = await sharp(pngBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const width = raw.info.width;
  const height = raw.info.height;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4 + 3;
      const a = raw.data[i];
      if (a <= alphaMin) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < minX || maxY < minY) return null;
  return { minX, minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

async function normalizeImage({ sourceBuffer, outPath }) {
  const MAX_DIM = 1024;
  let img = sharp(sourceBuffer, { failOn: 'none' }).rotate().ensureAlpha();
  const meta = await img.metadata().catch(() => null);
  const w = meta && typeof meta.width === 'number' ? meta.width : null;
  const h = meta && typeof meta.height === 'number' ? meta.height : null;
  if (w && h && (w > MAX_DIM || h > MAX_DIM)) {
    img = img.resize(MAX_DIM, MAX_DIM, { fit: 'inside', kernel: sharp.kernel.nearest });
  }
  const out = await img.png({ compressionLevel: 9 }).toBuffer({ resolveWithObject: true });
  fs.writeFileSync(outPath, out.data);
  return {
    normalizedBuffer: out.data,
    normalizedSha256: sha256Hex(out.data),
    width: out.info.width,
    height: out.info.height
  };
}

function quantizeRawRgb(raw, bits) {
  if (!bits) return raw;
  const levels = 2 ** bits;
  const scale = 255 / (levels - 1);
  const out = Buffer.from(raw);
  for (let i = 0; i < out.length; i += 4) {
    const a = out[i + 3];
    if (a === 0) continue;
    for (let c = 0; c < 3; c += 1) {
      const v = out[i + c];
      const q = Math.round((v / 255) * (levels - 1));
      out[i + c] = Math.max(0, Math.min(255, Math.round(q * scale)));
    }
  }
  return out;
}

async function exportSprite({ normalizedBuffer, options, artifactDir }) {
  const stageDir = path.join(artifactDir, 'stages');
  const normalizedPath = path.join(stageDir, 'normalized.png');
  if (!fs.existsSync(normalizedPath)) {
    ensureDir(stageDir);
    fs.writeFileSync(normalizedPath, normalizedBuffer);
  }

  let buf = normalizedBuffer;

  // Trim transparent padding first to keep pivots meaningful.
  const bounds = await alphaBounds(buf, 24);
  if (bounds) {
    buf = await sharp(buf)
      .extract({ left: bounds.minX, top: bounds.minY, width: bounds.w, height: bounds.h })
      .png({ compressionLevel: 9 })
      .toBuffer();
  }

  if (options.pixelateTo > 0) {
    // Pixelate by shrinking to a smaller max dimension; sprite@2x provides the larger variant.
    buf = await sharp(buf)
      .resize(options.pixelateTo, options.pixelateTo, { fit: 'inside', kernel: sharp.kernel.nearest })
      .png({ compressionLevel: 9 })
      .toBuffer();
  }

  if (options.quantizeBits > 0) {
    const raw = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const q = quantizeRawRgb(raw.data, options.quantizeBits);
    buf = await sharp(q, { raw: { width: raw.info.width, height: raw.info.height, channels: 4 } })
      .png({ compressionLevel: 9 })
      .toBuffer();
  }

  // Second trim after transforms to keep a tight bounding box.
  const bounds2 = await alphaBounds(buf, 24);
  if (bounds2) {
    buf = await sharp(buf)
      .extract({ left: bounds2.minX, top: bounds2.minY, width: bounds2.w, height: bounds2.h })
      .png({ compressionLevel: 9 })
      .toBuffer();
  }

  const spriteInfo = await sharp(buf).metadata();
  const spriteW = spriteInfo.width || 1;
  const spriteH = spriteInfo.height || 1;

  const sprite2xBuf = await sharp(buf)
    .resize(spriteW * 2, spriteH * 2, { kernel: sharp.kernel.nearest })
    .png({ compressionLevel: 9 })
    .toBuffer();

  const spritePath = path.join(artifactDir, 'sprite.png');
  const sprite2xPath = path.join(artifactDir, 'sprite@2x.png');
  fs.writeFileSync(spritePath, buf);
  fs.writeFileSync(sprite2xPath, sprite2xBuf);

  const isDecal = options.kind === 'decal';
  const origin = isDecal ? [0.5, 0.5] : [0.5, 1];
  const pivotPx = [Number((spriteW * origin[0]).toFixed(3)), Number((spriteH * origin[1]).toFixed(3))];

  const manifest = {
    schemaVersion: 1,
    kind: 'agent-town-static-asset-pack',
    assetKind: options.kind,
    pipelineVersion: PIPELINE_VERSION,
    templateVersion: TEMPLATE_VERSION,
    projection: { kind: 'iso-2:1', tile: TILE },
    tileFootprint: options.tileFootprint,
    pivot: {
      // Phaser-friendly: setOrigin(origin[0], origin[1])
      origin,
      pivotPx,
      name: isDecal ? 'center' : 'bottom-center'
    },
    options: {
      pixelateTo: options.pixelateTo,
      quantizeBits: options.quantizeBits
    },
    images: {
      sd: { file: 'sprite.png', w: spriteW, h: spriteH },
      hd: { file: 'sprite@2x.png', w: spriteW * 2, h: spriteH * 2 }
    }
  };

  const manifestPath = path.join(artifactDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  return { spritePath, sprite2xPath, manifestPath };
}

function buildPackageFromDisk({ artifactDir, sourceSha256 }) {
  const stageDir = path.join(artifactDir, 'stages');
  const normalizedPath = path.join(stageDir, 'normalized.png');
  const spritePath = path.join(artifactDir, 'sprite.png');
  const sprite2xPath = path.join(artifactDir, 'sprite@2x.png');
  const manifestPath = path.join(artifactDir, 'manifest.json');

  const required = [normalizedPath, spritePath, sprite2xPath, manifestPath];
  if (!required.every((p) => fs.existsSync(p))) return null;

  const normalizedBuf = fs.readFileSync(normalizedPath);
  const spriteBuf = fs.readFileSync(spritePath);
  const sprite2xBuf = fs.readFileSync(sprite2xPath);
  const manifestBuf = fs.readFileSync(manifestPath);

  return {
    pipelineVersion: PIPELINE_VERSION,
    templateVersion: TEMPLATE_VERSION,
    hashes: {
      sourceSha256,
      normalizedPngSha256: sha256Hex(normalizedBuf),
      spritePngSha256: sha256Hex(spriteBuf),
      sprite2xPngSha256: sha256Hex(sprite2xBuf),
      manifestJsonSha256: sha256Hex(manifestBuf)
    },
    paths: {
      artifactDir,
      stages: { normalized: normalizedPath },
      spritePath,
      sprite2xPath,
      manifestPath
    }
  };
}

function updateAsset(asset, patch) {
  Object.assign(asset, patch, { updatedAt: nowIso() });
}

function updateJob(job, patch) {
  Object.assign(job, patch, { updatedAt: nowIso() });
}

function validateInput({ buffer, mimeType }) {
  if (!Buffer.isBuffer(buffer) || !buffer.length) {
    throw new PipelineError('MISSING_IMAGE', 'Missing asset image.');
  }
  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw new PipelineError('IMAGE_TOO_LARGE', `Image exceeds ${MAX_UPLOAD_BYTES} bytes.`);
  }
  const normalizedMime = String(mimeType || '').trim().toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(normalizedMime)) {
    throw new PipelineError('UNSUPPORTED_MEDIA_TYPE', `Unsupported image type: ${normalizedMime || 'unknown'}`);
  }
}

function createJobRecord(assetId, sessionId, status = 'queued') {
  const jobId = `asj_${randomHex(12)}`;
  const job = {
    jobId,
    assetId,
    sessionId,
    artifactKey: null,
    status,
    stage: status === 'completed' ? 'export' : 'normalize',
    errorCode: null,
    errorDetail: null,
    attempts: 0,
    maxAttempts: 2,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
  jobsById.set(jobId, job);
  jobIdByAssetId.set(assetId, jobId);
  return job;
}

async function runPipelineJob(job) {
  const asset = assetsById.get(job.assetId);
  if (!asset) {
    updateJob(job, { status: 'failed', stage: 'export', errorCode: 'ASSET_NOT_FOUND' });
    return;
  }

  const optionsHash = sha256Hex(asset.optionsKey);
  const artifactDir = artifactDirFor({ sourceSha256: asset.sourceSha256, optionsHash });
  ensureDir(artifactDir);
  const stageDir = path.join(artifactDir, 'stages');
  ensureDir(stageDir);

  // Persist source bytes for later reuse/restarts.
  const sourcePath = path.join(artifactDir, 'source.bin');
  try {
    if (!fs.existsSync(sourcePath)) fs.writeFileSync(sourcePath, asset.sourceBuffer);
  } catch {
    // ignore
  }

  try {
    updateAsset(asset, { status: 'running', stage: 'normalize' });
    updateJob(job, { status: 'running', stage: 'normalize' });

    const normalizedPath = path.join(stageDir, 'normalized.png');
    const norm = await normalizeImage({ sourceBuffer: asset.sourceBuffer, outPath: normalizedPath });

    updateAsset(asset, { stage: 'export' });
    updateJob(job, { stage: 'export' });

    const exported = await exportSprite({ normalizedBuffer: norm.normalizedBuffer, options: asset.options, artifactDir });

    const spriteBuf = fs.readFileSync(exported.spritePath);
    const sprite2xBuf = fs.readFileSync(exported.sprite2xPath);
    const manifestBuf = fs.readFileSync(exported.manifestPath);

    const pkg = {
      pipelineVersion: PIPELINE_VERSION,
      templateVersion: TEMPLATE_VERSION,
      hashes: {
        sourceSha256: asset.sourceSha256,
        normalizedPngSha256: norm.normalizedSha256,
        spritePngSha256: sha256Hex(spriteBuf),
        sprite2xPngSha256: sha256Hex(sprite2xBuf),
        manifestJsonSha256: sha256Hex(manifestBuf)
      },
      paths: {
        artifactDir,
        stages: { normalized: normalizedPath },
        spritePath: exported.spritePath,
        sprite2xPath: exported.sprite2xPath,
        manifestPath: exported.manifestPath
      }
    };

    // Cache artifact for reuse across sessions.
    artifactsByKey.set(asset.artifactKey, {
      artifactKey: asset.artifactKey,
      status: 'completed',
      package: clone(pkg),
      updatedAt: nowIso(),
      createdAt: nowIso()
    });

    updateAsset(asset, { status: 'completed', stage: 'export', package: pkg, errorCode: null, errorDetail: null });
    updateJob(job, { status: 'completed', stage: 'export', errorCode: null, errorDetail: null });
  } catch (err) {
    const errorCode = err && err.code ? err.code : 'PIPELINE_FAILED';
    const errorDetail = err && err.message ? err.message : String(err);

    artifactsByKey.set(asset.artifactKey, {
      artifactKey: asset.artifactKey,
      status: 'failed',
      errorCode,
      errorDetail,
      updatedAt: nowIso(),
      createdAt: nowIso()
    });

    updateAsset(asset, { status: 'failed', stage: job.stage, errorCode, errorDetail });
    updateJob(job, { status: 'failed', stage: job.stage, errorCode, errorDetail });
  }
}

function kickJobWorker() {
  if (jobWorkerActive) return;
  jobWorkerActive = true;

  setImmediate(async () => {
    try {
      while (jobQueue.length) {
        const jobId = jobQueue.shift();
        const job = jobsById.get(jobId);
        if (!job) continue;
        if (job.status !== 'queued') continue;
        job.attempts += 1;

        const asset = assetsById.get(job.assetId);
        if (!asset) {
          updateJob(job, { status: 'failed', stage: 'export', errorCode: 'ASSET_NOT_FOUND' });
          continue;
        }

        const cached = artifactsByKey.get(asset.artifactKey);
        if (cached && cached.status === 'completed' && cached.package) {
          updateAsset(asset, { status: 'completed', stage: 'export', package: clone(cached.package), errorCode: null, errorDetail: null });
          updateJob(job, { status: 'completed', stage: 'export', errorCode: null, errorDetail: null });
          continue;
        }

        const optionsHash = sha256Hex(asset.optionsKey);
        const diskPkg = buildPackageFromDisk({
          artifactDir: artifactDirFor({ sourceSha256: asset.sourceSha256, optionsHash }),
          sourceSha256: asset.sourceSha256
        });
        if (diskPkg) {
          artifactsByKey.set(asset.artifactKey, {
            artifactKey: asset.artifactKey,
            status: 'completed',
            package: clone(diskPkg),
            updatedAt: nowIso(),
            createdAt: nowIso()
          });
          updateAsset(asset, { status: 'completed', stage: 'export', package: diskPkg, errorCode: null, errorDetail: null });
          updateJob(job, { status: 'completed', stage: 'export', errorCode: null, errorDetail: null });
          continue;
        }

        await runPipelineJob(job);

        // Retry only transient failures.
        const after = jobsById.get(jobId);
        if (after && after.status === 'failed') {
          const retriable = after.errorCode === 'PIPELINE_FAILED';
          if (retriable && after.attempts < after.maxAttempts) {
            updateJob(after, { status: 'queued', stage: 'normalize', errorCode: null, errorDetail: null });
            jobQueue.push(jobId);
          }
        }
      }
    } finally {
      jobWorkerActive = false;
    }
  });
}

function enqueueStaticAssetJob({ sessionId, buffer, mimeType, kind, tileFootprint, pixelateTo, quantizeBits } = {}) {
  validateInput({ buffer, mimeType });
  ensureDir(ARTIFACT_ROOT);

  const options = {
    kind: sanitizeKind(kind),
    tileFootprint: sanitizeFootprint(tileFootprint),
    pixelateTo: sanitizePixelateTo(pixelateTo),
    quantizeBits: sanitizeQuantizeBits(quantizeBits)
  };
  const optionsKey = optionsKeyFrom(options);

  const sourceSha256 = sha256Hex(buffer);
  const artifactKey = `${sourceSha256}:${PIPELINE_VERSION}:${TEMPLATE_VERSION}:${optionsKey}`;
  const sessionKey = `${sessionId}:${artifactKey}`;

  const existingAssetId = assetIdBySessionArtifactKey.get(sessionKey);
  if (existingAssetId) {
    const asset = assetsById.get(existingAssetId);
    const jobId = jobIdByAssetId.get(existingAssetId);
    const job = jobId ? jobsById.get(jobId) : null;
    if (asset && job) {
      return { asset: clone(asset), job: clone(job), reused: true };
    }
  }

  const assetId = `ast_${randomHex(12)}`;
  const asset = {
    assetId,
    sessionId,
    artifactKey,
    sourceSha256,
    sourceBuffer: buffer,
    pipelineVersion: PIPELINE_VERSION,
    templateVersion: TEMPLATE_VERSION,
    options,
    optionsKey,
    status: 'queued',
    stage: 'normalize',
    errorCode: null,
    errorDetail: null,
    package: null,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
  assetsById.set(assetId, asset);
  assetIdBySessionArtifactKey.set(sessionKey, assetId);

  const cached = artifactsByKey.get(artifactKey);
  if (cached && cached.status === 'completed' && cached.package) {
    const job = createJobRecord(assetId, sessionId, 'completed');
    job.artifactKey = artifactKey;
    updateAsset(asset, { status: 'completed', stage: 'export', package: clone(cached.package) });
    return { asset: clone(asset), job: clone(job), reused: true };
  }

  const job = createJobRecord(assetId, sessionId, 'queued');
  job.artifactKey = artifactKey;
  jobsById.set(job.jobId, job);
  jobQueue.push(job.jobId);
  kickJobWorker();

  return { asset: clone(asset), job: clone(job), reused: false };
}

function getStaticAsset(assetId) {
  const asset = assetsById.get(assetId);
  return asset ? clone(asset) : null;
}

function getStaticAssetJob(jobId) {
  const job = jobsById.get(jobId);
  return job ? clone(job) : null;
}

function resolveStaticAssetPath(assetId, kind) {
  const asset = assetsById.get(assetId);
  if (!asset || !asset.package || asset.status !== 'completed') return null;

  if (kind === 'sprite') return asset.package.paths.spritePath;
  if (kind === 'sprite2x') return asset.package.paths.sprite2xPath;
  if (kind === 'manifest') return asset.package.paths.manifestPath;

  if (kind && kind.startsWith('stage:')) {
    const k = kind.slice('stage:'.length);
    return asset.package.paths.stages?.[k] || null;
  }
  return null;
}

function buildStaticAssetPackagePayload(assetId) {
  const asset = assetsById.get(assetId);
  if (!asset || asset.status !== 'completed' || !asset.package) return null;
  return {
    ok: true,
    assetId: asset.assetId,
    pipelineVersion: asset.pipelineVersion,
    templateVersion: asset.templateVersion,
    hashes: asset.package.hashes,
    assets: {
      spritePng: `/api/static-asset/${encodeURIComponent(asset.assetId)}/sprite.png`,
      sprite2xPng: `/api/static-asset/${encodeURIComponent(asset.assetId)}/sprite@2x.png`,
      manifestJson: `/api/static-asset/${encodeURIComponent(asset.assetId)}/manifest.json`
    }
  };
}

function resetStaticAssetPipelineState() {
  assetsById.clear();
  jobsById.clear();
  assetIdBySessionArtifactKey.clear();
  jobIdByAssetId.clear();
  artifactsByKey.clear();
  jobQueue.length = 0;
  jobWorkerActive = false;

  fs.rmSync(ARTIFACT_ROOT, { recursive: true, force: true });
}

module.exports = {
  PIPELINE_VERSION,
  TEMPLATE_VERSION,
  MAX_UPLOAD_BYTES,
  ALLOWED_MIME_TYPES,
  enqueueStaticAssetJob,
  getStaticAsset,
  getStaticAssetJob,
  resolveStaticAssetPath,
  buildStaticAssetPackagePayload,
  resetStaticAssetPipelineState
};

