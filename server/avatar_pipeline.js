const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');

const { nowIso, randomHex } = require('./util');

// Bump when changing output bytes deterministically (atlas layout, QC, scaling, etc).
const PIPELINE_VERSION = 'v1.2.0';
const TEMPLATE_VERSION = 't1.0.0';

const WORK_CANVAS = 128;
const FRAME = { w: 32, h: 48 };
const SCALE_FACTORS = { x1: 1, x2: 2 };

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

const DIRECTIONS = ['south', 'east', 'west', 'north'];
const CLIPS = ['idle', 'walk'];

const ARTIFACT_ROOT = process.env.AVATAR_ARTIFACT_ROOT || path.join(process.cwd(), 'data', 'avatar_artifacts');

// In-memory metadata (MVP). Artifacts on disk are content-hash stable.
const avatarsById = new Map();
const jobsById = new Map();
const avatarIdBySessionArtifactKey = new Map();
const jobIdByAvatarId = new Map();
const artifactsByKey = new Map();

const jobQueue = [];
let jobWorkerActive = false;

class PipelineError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'PipelineError';
    this.code = code;
  }
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function sha256Hex(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

function dist2ToSegment(px, py, ax, ay, bx, by) {
  const abx = bx - ax;
  const aby = by - ay;
  const apx = px - ax;
  const apy = py - ay;
  const abLen2 = abx * abx + aby * aby;
  if (abLen2 <= 1e-6) {
    const dx = px - ax;
    const dy = py - ay;
    return dx * dx + dy * dy;
  }
  const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / abLen2));
  const cx = ax + abx * t;
  const cy = ay + aby * t;
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy;
}

function compositeOverwrite(dstRaw, srcRaw) {
  for (let i = 0; i < dstRaw.length; i += 4) {
    if (srcRaw[i + 3] === 0) continue;
    dstRaw[i] = srcRaw[i];
    dstRaw[i + 1] = srcRaw[i + 1];
    dstRaw[i + 2] = srcRaw[i + 2];
    dstRaw[i + 3] = srcRaw[i + 3];
  }
}

function transformRaw(rawIn, width, height, { angleRad = 0, pivotX = 0, pivotY = 0, dx = 0, dy = 0 } = {}) {
  const out = Buffer.alloc(rawIn.length);
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const a = rawIn[i + 3];
      if (!a) continue;
      let rx = x;
      let ry = y;
      if (angleRad) {
        const ox = x - pivotX;
        const oy = y - pivotY;
        rx = ox * cos - oy * sin + pivotX;
        ry = ox * sin + oy * cos + pivotY;
      }
      const nx = Math.round(rx + dx);
      const ny = Math.round(ry + dy);
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const j = (ny * width + nx) * 4;
      out[j] = rawIn[i];
      out[j + 1] = rawIn[i + 1];
      out[j + 2] = rawIn[i + 2];
      out[j + 3] = a;
    }
  }
  return out;
}

function inpaintRemovedCore(coreRaw, removedMask, width, height, iterations = 3) {
  // Simple deterministic dilation fill to avoid large transparent holes after limb extraction.
  const out = Buffer.from(coreRaw);
  for (let iter = 0; iter < iterations; iter += 1) {
    const next = Buffer.from(out);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const idx = y * width + x;
        if (!removedMask[idx]) continue;
        const i = idx * 4;
        if (out[i + 3] !== 0) continue;
        const neighbors = [
          [x - 1, y],
          [x + 1, y],
          [x, y - 1],
          [x, y + 1]
        ];
        for (const [nx, ny] of neighbors) {
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const ni = (ny * width + nx) * 4;
          if (out[ni + 3] === 0) continue;
          next[i] = out[ni];
          next[i + 1] = out[ni + 1];
          next[i + 2] = out[ni + 2];
          next[i + 3] = out[ni + 3];
          break;
        }
      }
    }
    out.set(next);
  }
  return out;
}

function pointsByLabel(keypoints) {
  const out = new Map();
  for (const kp of keypoints || []) {
    if (!kp || typeof kp.label !== 'string') continue;
    out.set(kp.label, kp);
  }
  return out;
}

function alphaBounds(raw, width, height) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  let area = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const a = raw[i + 3];
      if (a <= 24) continue;
      area += 1;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < minX || maxY < minY) return null;
  return {
    minX,
    minY,
    maxX,
    maxY,
    w: maxX - minX + 1,
    h: maxY - minY + 1,
    area,
    coverage: area / (width * height)
  };
}

function normalizedPoint(bounds, xPct, yPct, label, z = 0) {
  return {
    label,
    x: Number((bounds.minX + bounds.w * xPct).toFixed(3)),
    y: Number((bounds.minY + bounds.h * yPct).toFixed(3)),
    z_index: z
  };
}

function buildKeypoints(bounds) {
  return [
    normalizedPoint(bounds, 0.5, 0.18, 'NOSE', 9),
    normalizedPoint(bounds, 0.5, 0.28, 'NECK', 8),
    normalizedPoint(bounds, 0.31, 0.28, 'LEFT SHOULDER', 7),
    normalizedPoint(bounds, 0.21, 0.44, 'LEFT ELBOW', 7),
    normalizedPoint(bounds, 0.16, 0.63, 'LEFT ARM', 7),
    normalizedPoint(bounds, 0.69, 0.28, 'RIGHT SHOULDER', 7),
    normalizedPoint(bounds, 0.79, 0.44, 'RIGHT ELBOW', 7),
    normalizedPoint(bounds, 0.84, 0.63, 'RIGHT ARM', 7),
    normalizedPoint(bounds, 0.43, 0.58, 'LEFT HIP', 6),
    normalizedPoint(bounds, 0.38, 0.76, 'LEFT KNEE', 5),
    normalizedPoint(bounds, 0.36, 0.95, 'LEFT LEG', 4),
    normalizedPoint(bounds, 0.57, 0.58, 'RIGHT HIP', 6),
    normalizedPoint(bounds, 0.62, 0.76, 'RIGHT KNEE', 5),
    normalizedPoint(bounds, 0.64, 0.95, 'RIGHT LEG', 4),
    normalizedPoint(bounds, 0.42, 0.16, 'LEFT EYE', 10),
    normalizedPoint(bounds, 0.58, 0.16, 'RIGHT EYE', 10),
    normalizedPoint(bounds, 0.29, 0.18, 'LEFT EAR', 9),
    normalizedPoint(bounds, 0.71, 0.18, 'RIGHT EAR', 9)
  ];
}

function buildRig(bounds) {
  return {
    template: 'chibi-humanoid-v1',
    workCanvas: { w: WORK_CANVAS, h: WORK_CANVAS },
    frame: { w: FRAME.w, h: FRAME.h },
    bounds,
    constraints: {
      lockedRoot: true,
      maxLimbStretchPct: 12,
      pelvisYLockPct: 6
    },
    generatedBy: {
      pipelineVersion: PIPELINE_VERSION,
      templateVersion: TEMPLATE_VERSION
    }
  };
}

function extractLimbLayers(raw, width, height, bounds) {
  const keypoints = buildKeypoints(bounds);
  const pts = pointsByLabel(keypoints);
  const cx = bounds.minX + bounds.w * 0.5;
  const yArmMin = bounds.minY + bounds.h * 0.22;
  const yArmMax = bounds.minY + bounds.h * 0.78;
  const yLegMin = bounds.minY + bounds.h * 0.48;

  function p(label, fallbackX = cx, fallbackY = bounds.minY + bounds.h * 0.5) {
    const v = pts.get(label);
    if (!v) return { x: fallbackX, y: fallbackY };
    return { x: v.x, y: v.y };
  }

  const LS = p('LEFT SHOULDER');
  const LE = p('LEFT ELBOW');
  const LA = p('LEFT ARM');
  const RS = p('RIGHT SHOULDER');
  const RE = p('RIGHT ELBOW');
  const RA = p('RIGHT ARM');
  const LH = p('LEFT HIP');
  const LK = p('LEFT KNEE');
  const LL = p('LEFT LEG');
  const RH = p('RIGHT HIP');
  const RK = p('RIGHT KNEE');
  const RL = p('RIGHT LEG');

  // Wider thresholds to capture full limbs in pixel art.
  const armThreshold2 = 6.2 * 6.2;
  const legThreshold2 = 7.4 * 7.4;

  const armL = Buffer.alloc(raw.length);
  const armR = Buffer.alloc(raw.length);
  const legL = Buffer.alloc(raw.length);
  const legR = Buffer.alloc(raw.length);
  const core = Buffer.from(raw);
  const removed = new Uint8Array(width * height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = y * width + x;
      const i = idx * 4;
      const a = raw[i + 3];
      if (!a) continue;

      let part = null;

      if (y >= yLegMin) {
        const dLeft =
          Math.min(dist2ToSegment(x, y, LH.x, LH.y, LK.x, LK.y), dist2ToSegment(x, y, LK.x, LK.y, LL.x, LL.y)) ||
          1e9;
        const dRight =
          Math.min(dist2ToSegment(x, y, RH.x, RH.y, RK.x, RK.y), dist2ToSegment(x, y, RK.x, RK.y, RL.x, RL.y)) ||
          1e9;
        if (x < cx && dLeft <= legThreshold2) part = 'legL';
        if (x >= cx && dRight <= legThreshold2) part = 'legR';
      } else if (y >= yArmMin && y <= yArmMax) {
        const dLeft =
          Math.min(dist2ToSegment(x, y, LS.x, LS.y, LE.x, LE.y), dist2ToSegment(x, y, LE.x, LE.y, LA.x, LA.y)) ||
          1e9;
        const dRight =
          Math.min(dist2ToSegment(x, y, RS.x, RS.y, RE.x, RE.y), dist2ToSegment(x, y, RE.x, RE.y, RA.x, RA.y)) ||
          1e9;
        if (x < cx && dLeft <= armThreshold2) part = 'armL';
        if (x >= cx && dRight <= armThreshold2) part = 'armR';
      }

      if (!part) continue;

      removed[idx] = 1;
      core[i + 3] = 0;

      const dst = part === 'armL' ? armL : part === 'armR' ? armR : part === 'legL' ? legL : legR;
      dst[i] = raw[i];
      dst[i + 1] = raw[i + 1];
      dst[i + 2] = raw[i + 2];
      dst[i + 3] = a;
    }
  }

  const coreFilled = inpaintRemovedCore(core, removed, width, height, 4);

  return {
    layers: {
      core: coreFilled,
      armL,
      armR,
      legL,
      legR
    },
    pivots: {
      LS,
      RS,
      LH,
      RH
    },
    pts
  };
}

function rgbDist(a, b) {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function pickBackgroundColor(raw, width, height) {
  const corners = [
    { x: 0, y: 0 },
    { x: width - 1, y: 0 },
    { x: 0, y: height - 1 },
    { x: width - 1, y: height - 1 }
  ];
  const cols = corners
    .map(({ x, y }) => {
      const i = (y * width + x) * 4;
      return { r: raw[i], g: raw[i + 1], b: raw[i + 2], a: raw[i + 3] };
    })
    .filter((c) => c.a > 24);
  if (cols.length < 2) return null;

  const mean = cols.reduce((acc, c) => ({ r: acc.r + c.r, g: acc.g + c.g, b: acc.b + c.b }), { r: 0, g: 0, b: 0 });
  mean.r /= cols.length;
  mean.g /= cols.length;
  mean.b /= cols.length;

  const maxDist = Math.max(...cols.map((c) => rgbDist(c, mean)));
  if (maxDist > 28) return null;
  return { r: Math.round(mean.r), g: Math.round(mean.g), b: Math.round(mean.b) };
}

function floodRemoveBackground(raw, width, height, bg, thresholdL1 = 36) {
  if (!bg) return 0;
  const visited = new Uint8Array(width * height);
  const q = [];

  function push(x, y) {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const idx = y * width + x;
    if (visited[idx]) return;
    visited[idx] = 1;
    q.push(idx);
  }

  for (let x = 0; x < width; x += 1) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    push(0, y);
    push(width - 1, y);
  }

  let removed = 0;
  while (q.length) {
    const idx = q.pop();
    const x = idx % width;
    const y = (idx - x) / width;
    const i = idx * 4;
    const a = raw[i + 3];
    if (a <= 24) continue;

    const d = Math.abs(raw[i] - bg.r) + Math.abs(raw[i + 1] - bg.g) + Math.abs(raw[i + 2] - bg.b);
    if (d > thresholdL1) continue;

    raw[i + 3] = 0;
    removed += 1;
    push(x - 1, y);
    push(x + 1, y);
    push(x, y - 1);
    push(x, y + 1);
  }

  return removed;
}

async function normalizeImage(sourceBuffer, outPath) {
  const sized = await sharp(sourceBuffer, { failOn: 'none' })
    .rotate()
    .ensureAlpha()
    .resize(WORK_CANVAS, WORK_CANVAS, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: sharp.kernel.nearest
    })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const raw = Buffer.from(sized.data);
  const width = sized.info.width;
  const height = sized.info.height;

  // Deterministic background separation:
  // 1) If corners agree, flood-remove contiguous background from edges.
  // 2) Remove near-white pixels (common for user-cutouts).
  const bg = pickBackgroundColor(raw, width, height);
  floodRemoveBackground(raw, width, height, bg, 36);

  for (let i = 0; i < raw.length; i += 4) {
    const r = raw[i];
    const g = raw[i + 1];
    const b = raw[i + 2];
    const a = raw[i + 3];
    if (a < 10) {
      raw[i + 3] = 0;
      continue;
    }
    if (r > 245 && g > 245 && b > 245) {
      raw[i + 3] = 0;
    }
  }

  const bounds = alphaBounds(raw, width, height);
  if (!bounds) {
    throw new PipelineError('NO_FOREGROUND', 'No clear foreground character detected.');
  }
  if (bounds.h < 70 || bounds.maxY < 108) {
    throw new PipelineError('FULL_BODY_REQUIRED', 'Please upload a full standing character.');
  }

  const normalizedBuffer = await sharp(raw, {
    raw: { width, height, channels: 4 }
  })
    .png({ compressionLevel: 9 })
    .toBuffer();

  fs.writeFileSync(outPath, normalizedBuffer);
  return { normalizedBuffer, bounds, normalizedSha256: sha256Hex(normalizedBuffer) };
}

async function directionPose(baseBuffer, direction) {
  if (direction === 'south') return baseBuffer;

  if (direction === 'north') {
    const occluder = await sharp({
      create: {
        width: 12,
        height: 8,
        channels: 4,
        background: { r: 35, g: 30, b: 32, alpha: 190 }
      }
    })
      .png()
      .toBuffer();
    return sharp(baseBuffer)
      .modulate({ brightness: 0.84, saturation: 0.88 })
      .composite([{ input: occluder, left: 10, top: 14 }])
      .png()
      .toBuffer();
  }

  let side = await sharp(baseBuffer)
    .resize(28, FRAME.h, { fit: 'fill', kernel: sharp.kernel.nearest })
    .extend({
      top: 0,
      bottom: 0,
      left: 2,
      right: 2,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer();

  if (direction === 'west') {
    side = await sharp(side).flop().png().toBuffer();
  }
  return side;
}

function transformPoint(x, y, { angleRad = 0, pivotX = 0, pivotY = 0, dx = 0, dy = 0 } = {}) {
  let rx = x;
  let ry = y;
  if (angleRad) {
    const ox = x - pivotX;
    const oy = y - pivotY;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    rx = ox * cos - oy * sin + pivotX;
    ry = ox * sin + oy * cos + pivotY;
  }
  return { x: Number((rx + dx).toFixed(3)), y: Number((ry + dy).toFixed(3)) };
}

async function writePreviewSheet(previewPath, frameA, frameB) {
  const buf = await sharp({
    create: {
      width: FRAME.w * 2,
      height: FRAME.h,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([
      { input: frameA, left: 0, top: 0 },
      { input: frameB, left: FRAME.w, top: 0 }
    ])
    .png()
    .toBuffer();
  fs.writeFileSync(previewPath, buf);
}

async function frameStatsPng(framePng) {
  const { data, info } = await sharp(framePng).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const width = info.width;
  const height = info.height;
  let count = 0;
  let sumX = 0;
  let sumY = 0;
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const a = data[i + 3];
      if (a <= 24) continue;
      count += 1;
      sumX += x;
      sumY += y;
      sumR += data[i];
      sumG += data[i + 1];
      sumB += data[i + 2];
    }
  }
  if (!count) return null;
  return {
    cx: sumX / count,
    cy: sumY / count,
    mean: {
      r: sumR / count,
      g: sumG / count,
      b: sumB / count
    }
  };
}

async function analyzeAnimationClips(clips) {
  let maxStepJitter = 0;
  let maxPaletteDrift = 0;

  if (!clips) {
    return { temporalJitterPx: 0, paletteDrift: 0 };
  }

  for (const clipName of CLIPS) {
    for (const direction of DIRECTIONS) {
      const frames = clips[clipName]?.[direction] || [];
      if (!frames.length) continue;
      const stats = [];
      for (const frame of frames) {
        const st = await frameStatsPng(frame);
        if (st) stats.push(st);
      }
      for (let i = 1; i < stats.length; i += 1) {
        const dx = stats[i].cx - stats[i - 1].cx;
        const dy = stats[i].cy - stats[i - 1].cy;
        maxStepJitter = Math.max(maxStepJitter, Math.abs(dx), Math.abs(dy));
      }
      const base = stats[0]?.mean;
      if (!base) continue;
      for (const st of stats) {
        const d =
          (Math.abs(st.mean.r - base.r) + Math.abs(st.mean.g - base.g) + Math.abs(st.mean.b - base.b)) /
          (255 * 3);
        maxPaletteDrift = Math.max(maxPaletteDrift, d);
      }
    }
  }

  return {
    temporalJitterPx: Number(maxStepJitter.toFixed(3)),
    paletteDrift: Number(maxPaletteDrift.toFixed(3))
  };
}

async function renderPackage(normalizedBuffer, artifactDir) {
  const baseFrame = await sharp(normalizedBuffer)
    .resize(FRAME.w, FRAME.h, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: sharp.kernel.nearest
    })
    .png()
    .toBuffer();

  const clips = {
    idle: {},
    walk: {}
  };
  const anchors = {
    idle: {},
    walk: {}
  };

  for (const direction of DIRECTIONS) {
    const posed = await directionPose(baseFrame, direction);
    const posedRaw = await sharp(posed).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const width = posedRaw.info.width;
    const height = posedRaw.info.height;
    const raw = Buffer.from(posedRaw.data);

    const bounds =
      alphaBounds(raw, width, height) || { minX: 0, minY: 0, maxX: width - 1, maxY: height - 1, w: width, h: height };

    const rig = extractLimbLayers(raw, width, height, bounds);

    clips.idle[direction] = [];
    clips.walk[direction] = [];
    anchors.idle[direction] = [];
    anchors.walk[direction] = [];

    // Idle: 2 frames.
    for (let i = 0; i < 2; i += 1) {
      const breath = Math.sin((i / 2) * Math.PI * 2);
      const bob = Math.round(Math.abs(breath) * 1);
      const aSwing = breath * 4;

      const coreF = transformRaw(rig.layers.core, width, height, { dx: 0, dy: bob });
      const armLF = transformRaw(rig.layers.armL, width, height, {
        angleRad: degToRad(-aSwing),
        pivotX: rig.pivots.LS.x,
        pivotY: rig.pivots.LS.y,
        dx: 0,
        dy: bob
      });
      const armRF = transformRaw(rig.layers.armR, width, height, {
        angleRad: degToRad(aSwing),
        pivotX: rig.pivots.RS.x,
        pivotY: rig.pivots.RS.y,
        dx: 0,
        dy: bob
      });

      const frameRaw = Buffer.alloc(raw.length);
      compositeOverwrite(frameRaw, coreF);
      compositeOverwrite(frameRaw, armLF);
      compositeOverwrite(frameRaw, armRF);

      const png = await sharp(frameRaw, { raw: { width, height, channels: 4 } }).png().toBuffer();
      clips.idle[direction].push(png);

      const handL = transformPoint(rig.pts.get('LEFT ARM')?.x || rig.pivots.LS.x, rig.pts.get('LEFT ARM')?.y || rig.pivots.LS.y, {
        angleRad: degToRad(-aSwing),
        pivotX: rig.pivots.LS.x,
        pivotY: rig.pivots.LS.y,
        dx: 0,
        dy: bob
      });
      const handR = transformPoint(rig.pts.get('RIGHT ARM')?.x || rig.pivots.RS.x, rig.pts.get('RIGHT ARM')?.y || rig.pivots.RS.y, {
        angleRad: degToRad(aSwing),
        pivotX: rig.pivots.RS.x,
        pivotY: rig.pivots.RS.y,
        dx: 0,
        dy: bob
      });
      const head = transformPoint(rig.pts.get('NOSE')?.x || bounds.minX + bounds.w * 0.5, rig.pts.get('NOSE')?.y || bounds.minY, { dx: 0, dy: bob });
      anchors.idle[direction].push({ handL, handR, head });
    }

    // Walk: 8 frames.
    for (let i = 0; i < 8; i += 1) {
      const phase = (i / 8) * Math.PI * 2;
      const step = Math.sin(phase);
      const bob = Math.round(Math.abs(step) * 2);

      const legSwing = step * 18;
      const armSwing = step * 14;
      const leftForward = step > 0;
      const lift = Math.round(Math.max(0, step) * -1);
      const liftOpp = Math.round(Math.max(0, -step) * -1);

      const legLF = transformRaw(rig.layers.legL, width, height, {
        angleRad: degToRad(legSwing),
        pivotX: rig.pivots.LH.x,
        pivotY: rig.pivots.LH.y,
        dx: 0,
        dy: bob + lift
      });
      const legRF = transformRaw(rig.layers.legR, width, height, {
        angleRad: degToRad(-legSwing),
        pivotX: rig.pivots.RH.x,
        pivotY: rig.pivots.RH.y,
        dx: 0,
        dy: bob + liftOpp
      });
      const coreF = transformRaw(rig.layers.core, width, height, { dx: 0, dy: bob });
      const armLF = transformRaw(rig.layers.armL, width, height, {
        angleRad: degToRad(-armSwing),
        pivotX: rig.pivots.LS.x,
        pivotY: rig.pivots.LS.y,
        dx: 0,
        dy: bob
      });
      const armRF = transformRaw(rig.layers.armR, width, height, {
        angleRad: degToRad(armSwing),
        pivotX: rig.pivots.RS.x,
        pivotY: rig.pivots.RS.y,
        dx: 0,
        dy: bob
      });

      const frameRaw = Buffer.alloc(raw.length);
      // Legs behind torso/core, with a simple front/back swap for gait.
      compositeOverwrite(frameRaw, leftForward ? legRF : legLF);
      compositeOverwrite(frameRaw, leftForward ? legLF : legRF);
      compositeOverwrite(frameRaw, coreF);
      // Arms on top, opposite swing from legs.
      compositeOverwrite(frameRaw, leftForward ? armLF : armRF);
      compositeOverwrite(frameRaw, leftForward ? armRF : armLF);

      const png = await sharp(frameRaw, { raw: { width, height, channels: 4 } }).png().toBuffer();
      clips.walk[direction].push(png);

      const handL = transformPoint(rig.pts.get('LEFT ARM')?.x || rig.pivots.LS.x, rig.pts.get('LEFT ARM')?.y || rig.pivots.LS.y, {
        angleRad: degToRad(-armSwing),
        pivotX: rig.pivots.LS.x,
        pivotY: rig.pivots.LS.y,
        dx: 0,
        dy: bob
      });
      const handR = transformPoint(rig.pts.get('RIGHT ARM')?.x || rig.pivots.RS.x, rig.pts.get('RIGHT ARM')?.y || rig.pivots.RS.y, {
        angleRad: degToRad(armSwing),
        pivotX: rig.pivots.RS.x,
        pivotY: rig.pivots.RS.y,
        dx: 0,
        dy: bob
      });
      const head = transformPoint(rig.pts.get('NOSE')?.x || bounds.minX + bounds.w * 0.5, rig.pts.get('NOSE')?.y || bounds.minY, { dx: 0, dy: bob });
      anchors.walk[direction].push({ handL, handR, head });
    }
  }

  // Rows: idle (south,east,west,north) then walk (south,east,west,north).
  const rows = [];
  for (const clip of CLIPS) {
    for (const direction of DIRECTIONS) {
      rows.push({ clip, direction, frames: clips[clip][direction] });
    }
  }

  const atlasWidth = 8 * FRAME.w;
  const atlasHeight = rows.length * FRAME.h;
  const composites = [];

  const metadata = {
    version: 1,
    pipelineVersion: PIPELINE_VERSION,
    templateVersion: TEMPLATE_VERSION,
    frame: { w: FRAME.w, h: FRAME.h },
    atlas: { w: atlasWidth, h: atlasHeight },
    scales: {
      x1: { factor: 1, frame: { w: FRAME.w, h: FRAME.h }, atlas: { w: atlasWidth, h: atlasHeight } },
      x2: { factor: 2, frame: { w: FRAME.w * 2, h: FRAME.h * 2 }, atlas: { w: atlasWidth * 2, h: atlasHeight * 2 } }
    },
    clips: {
      idle: {},
      walk: {}
    },
    anchors
  };

  for (let row = 0; row < rows.length; row += 1) {
    const item = rows[row];
    metadata.clips[item.clip][item.direction] = [];
    for (let col = 0; col < item.frames.length; col += 1) {
      const left = col * FRAME.w;
      const top = row * FRAME.h;
      composites.push({ input: item.frames[col], left, top });
      metadata.clips[item.clip][item.direction].push({
        x: left,
        y: top,
        w: FRAME.w,
        h: FRAME.h,
        durationMs: item.clip === 'idle' ? 220 : 120
      });
    }
  }

  const atlasBuffer = await sharp({
    create: {
      width: atlasWidth,
      height: atlasHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite(composites)
    .png()
    .toBuffer();

  const atlas2xBuffer = await sharp(atlasBuffer)
    .resize(atlasWidth * SCALE_FACTORS.x2, atlasHeight * SCALE_FACTORS.x2, { kernel: sharp.kernel.nearest })
    .png()
    .toBuffer();

  const atlasPath = path.join(artifactDir, 'atlas.png');
  const atlas2xPath = path.join(artifactDir, 'atlas@2x.png');
  const metadataPath = path.join(artifactDir, 'atlas.json');
  fs.writeFileSync(atlasPath, atlasBuffer);
  fs.writeFileSync(atlas2xPath, atlas2xBuffer);
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

  const previewDir = path.join(artifactDir, 'preview');
  ensureDir(previewDir);
  await writePreviewSheet(path.join(previewDir, 'walk_south.png'), clips.walk.south[0], clips.walk.south[1]);
  await writePreviewSheet(path.join(previewDir, 'walk_east.png'), clips.walk.east[0], clips.walk.east[1]);
  await writePreviewSheet(path.join(previewDir, 'walk_west.png'), clips.walk.west[0], clips.walk.west[1]);
  await writePreviewSheet(path.join(previewDir, 'walk_north.png'), clips.walk.north[0], clips.walk.north[1]);

  fs.copyFileSync(path.join(previewDir, 'walk_west.png'), path.join(previewDir, 'walk_left.png'));
  fs.copyFileSync(path.join(previewDir, 'walk_east.png'), path.join(previewDir, 'walk_right.png'));
  fs.copyFileSync(path.join(previewDir, 'walk_south.png'), path.join(previewDir, 'walk_towards_camera.png'));
  fs.copyFileSync(path.join(previewDir, 'walk_north.png'), path.join(previewDir, 'walk_away_from_camera.png'));

  return {
    atlasPath,
    atlas2xPath,
    metadataPath,
    previewDir,
    previewByMeaning: {
      left: path.join(previewDir, 'walk_left.png'),
      right: path.join(previewDir, 'walk_right.png'),
      towards_camera: path.join(previewDir, 'walk_towards_camera.png'),
      away_from_camera: path.join(previewDir, 'walk_away_from_camera.png')
    },
    qcInputs: { clips }
  };
}

async function evaluateQuality(bounds, qcInputs) {
  const silhouetteIntegrity = Math.min(1, bounds.coverage / 0.42);
  const grounded = bounds.maxY >= 112 ? 1 : 0.5;
  const anim = await analyzeAnimationClips(qcInputs?.clips || null);

  const qc = {
    silhouetteIntegrity: Number(silhouetteIntegrity.toFixed(3)),
    grounded: Number(grounded.toFixed(3)),
    temporalJitterPx: anim.temporalJitterPx,
    paletteDrift: anim.paletteDrift,
    score: 0
  };

  qc.score = Number(
    (
      qc.silhouetteIntegrity * 0.55 +
      qc.grounded * 0.15 +
      Math.max(0, 1 - qc.temporalJitterPx / 6) * 0.15 +
      Math.max(0, 1 - qc.paletteDrift / 0.18) * 0.15
    ).toFixed(3)
  );

  if (qc.silhouetteIntegrity < 0.35) {
    throw new PipelineError('QC_SILHOUETTE_LOW', 'Silhouette integrity too low.');
  }
  if (qc.temporalJitterPx > 7.5) {
    throw new PipelineError('QC_TEMPORAL_JITTER', 'Temporal jitter too high.');
  }
  if (qc.paletteDrift > 0.14) {
    throw new PipelineError('QC_PALETTE_DRIFT', 'Palette drift too high.');
  }

  return qc;
}

function updateAvatar(avatar, patch) {
  Object.assign(avatar, patch, { updatedAt: nowIso() });
}

function updateJob(job, patch) {
  Object.assign(job, patch, { updatedAt: nowIso() });
}

function artifactDirFor(sourceSha256) {
  return path.join(ARTIFACT_ROOT, PIPELINE_VERSION, TEMPLATE_VERSION, sourceSha256);
}

function buildPackageFromDisk({ artifactDir, sourceSha256 }) {
  const stageDir = path.join(artifactDir, 'stages');
  const normalizedPath = path.join(stageDir, 'normalized.png');
  const keypointsPath = path.join(stageDir, 'keypoints.json');
  const rigPath = path.join(stageDir, 'rig.json');
  const qcPath = path.join(stageDir, 'qc.json');
  const atlasPath = path.join(artifactDir, 'atlas.png');
  const atlas2xPath = path.join(artifactDir, 'atlas@2x.png');
  const metadataPath = path.join(artifactDir, 'atlas.json');
  const previewDir = path.join(artifactDir, 'preview');

  const required = [normalizedPath, keypointsPath, rigPath, atlasPath, atlas2xPath, metadataPath, qcPath];
  if (!required.every((p) => fs.existsSync(p))) return null;

  const qcRaw = JSON.parse(fs.readFileSync(qcPath, 'utf8'));
  const atlasBuf = fs.readFileSync(atlasPath);
  const atlas2xBuf = fs.readFileSync(atlas2xPath);
  const metaBuf = fs.readFileSync(metadataPath);
  const normalizedBuf = fs.readFileSync(normalizedPath);

  return {
    pipelineVersion: PIPELINE_VERSION,
    templateVersion: TEMPLATE_VERSION,
    hashes: {
      sourceSha256,
      normalizedPngSha256: sha256Hex(normalizedBuf),
      atlasPngSha256: sha256Hex(atlasBuf),
      atlas2xPngSha256: sha256Hex(atlas2xBuf),
      metadataJsonSha256: sha256Hex(metaBuf)
    },
    qc: qcRaw?.qc || null,
    paths: {
      artifactDir,
      stages: {
        normalized: normalizedPath,
        keypoints: keypointsPath,
        rig: rigPath,
        qc: qcPath
      },
      atlasPath,
      atlas2xPath,
      metadataPath,
      previewDir,
      previewByMeaning: {
        left: path.join(previewDir, 'walk_left.png'),
        right: path.join(previewDir, 'walk_right.png'),
        towards_camera: path.join(previewDir, 'walk_towards_camera.png'),
        away_from_camera: path.join(previewDir, 'walk_away_from_camera.png')
      }
    }
  };
}

async function runPipelineJob(job) {
  const avatar = avatarsById.get(job.avatarId);
  if (!avatar) {
    updateJob(job, { status: 'failed', stage: 'qc', errorCode: 'AVATAR_NOT_FOUND' });
    return;
  }

  if (job.injectFailOnce && job.attempts === 1) {
    job.injectFailOnce = false;
    throw new PipelineError('PIPELINE_FAILED', 'Injected transient failure (test-only).');
  }

  const artifactDir = artifactDirFor(avatar.sourceSha256);
  ensureDir(artifactDir);
  const stageDir = path.join(artifactDir, 'stages');
  ensureDir(stageDir);

  // Persist the source bytes for later reuse/restarts.
  const sourcePath = path.join(artifactDir, 'source.bin');
  try {
    if (!fs.existsSync(sourcePath)) fs.writeFileSync(sourcePath, avatar.sourceBuffer);
  } catch {
    // ignore
  }

  try {
    updateAvatar(avatar, { status: 'running', stage: 'normalize' });
    updateJob(job, { status: 'running', stage: 'normalize' });

    const normalizedPath = path.join(stageDir, 'normalized.png');
    const { normalizedBuffer, bounds, normalizedSha256 } = await normalizeImage(avatar.sourceBuffer, normalizedPath);

    updateAvatar(avatar, { stage: 'keypoints' });
    updateJob(job, { stage: 'keypoints' });

    const keypoints = buildKeypoints(bounds);
    fs.writeFileSync(path.join(stageDir, 'keypoints.json'), JSON.stringify({ keypoints }, null, 2));

    updateAvatar(avatar, { stage: 'rig' });
    updateJob(job, { stage: 'rig' });

    const rig = buildRig(bounds);
    fs.writeFileSync(path.join(stageDir, 'rig.json'), JSON.stringify(rig, null, 2));

    updateAvatar(avatar, { stage: 'render' });
    updateJob(job, { stage: 'render' });

    const rendered = await renderPackage(normalizedBuffer, artifactDir);

    updateAvatar(avatar, { stage: 'qc' });
    updateJob(job, { stage: 'qc' });

    const qc = await evaluateQuality(bounds, rendered.qcInputs);
    const qcPath = path.join(stageDir, 'qc.json');
    fs.writeFileSync(qcPath, JSON.stringify({ qc }, null, 2));

    const atlasBuf = fs.readFileSync(rendered.atlasPath);
    const atlas2xBuf = fs.readFileSync(rendered.atlas2xPath);
    const metaBuf = fs.readFileSync(rendered.metadataPath);

    const pkg = {
      pipelineVersion: PIPELINE_VERSION,
      templateVersion: TEMPLATE_VERSION,
      hashes: {
        sourceSha256: avatar.sourceSha256,
        normalizedPngSha256: normalizedSha256,
        atlasPngSha256: sha256Hex(atlasBuf),
        atlas2xPngSha256: sha256Hex(atlas2xBuf),
        metadataJsonSha256: sha256Hex(metaBuf)
      },
      qc,
      paths: {
        artifactDir,
        stages: {
          normalized: normalizedPath,
          keypoints: path.join(stageDir, 'keypoints.json'),
          rig: path.join(stageDir, 'rig.json'),
          qc: qcPath
        },
        atlasPath: rendered.atlasPath,
        atlas2xPath: rendered.atlas2xPath,
        metadataPath: rendered.metadataPath,
        previewDir: rendered.previewDir,
        previewByMeaning: rendered.previewByMeaning
      }
    };

    // Cache artifact for reuse across sessions.
    artifactsByKey.set(avatar.artifactKey, {
      artifactKey: avatar.artifactKey,
      status: 'completed',
      package: clone(pkg),
      updatedAt: nowIso(),
      createdAt: nowIso()
    });

    updateAvatar(avatar, {
      status: 'completed',
      stage: 'qc',
      package: pkg,
      errorCode: null,
      errorDetail: null
    });

    updateJob(job, { status: 'completed', stage: 'qc', errorCode: null, errorDetail: null });
  } catch (err) {
    const errorCode = err && err.code ? err.code : 'PIPELINE_FAILED';
    const errorDetail = err && err.message ? err.message : String(err);

    artifactsByKey.set(avatar.artifactKey, {
      artifactKey: avatar.artifactKey,
      status: 'failed',
      errorCode,
      errorDetail,
      updatedAt: nowIso(),
      createdAt: nowIso()
    });

    updateAvatar(avatar, { status: 'failed', stage: job.stage, errorCode, errorDetail });
    updateJob(job, { status: 'failed', stage: job.stage, errorCode, errorDetail });
  }
}

function validateInput({ buffer, mimeType }) {
  if (!Buffer.isBuffer(buffer) || !buffer.length) {
    throw new PipelineError('MISSING_IMAGE', 'Missing avatar image.');
  }
  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw new PipelineError('IMAGE_TOO_LARGE', `Image exceeds ${MAX_UPLOAD_BYTES} bytes.`);
  }
  const normalizedMime = String(mimeType || '').trim().toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(normalizedMime)) {
    throw new PipelineError('UNSUPPORTED_MEDIA_TYPE', `Unsupported image type: ${normalizedMime || 'unknown'}`);
  }
}

function createJobRecord(avatarId, sessionId, status = 'queued') {
  const jobId = `avj_${randomHex(12)}`;
  const job = {
    jobId,
    avatarId,
    sessionId,
    artifactKey: null,
    status,
    stage: status === 'completed' ? 'qc' : 'normalize',
    errorCode: null,
    errorDetail: null,
    attempts: 0,
    maxAttempts: 2,
    injectFailOnce: false,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
  jobsById.set(jobId, job);
  jobIdByAvatarId.set(avatarId, jobId);
  return job;
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

        const avatar = avatarsById.get(job.avatarId);
        if (!avatar) {
          updateJob(job, { status: 'failed', stage: 'qc', errorCode: 'AVATAR_NOT_FOUND' });
          continue;
        }

        const cached = artifactsByKey.get(avatar.artifactKey);
        if (cached && cached.status === 'completed' && cached.package) {
          updateAvatar(avatar, {
            status: 'completed',
            stage: 'qc',
            package: clone(cached.package),
            errorCode: null,
            errorDetail: null
          });
          updateJob(job, { status: 'completed', stage: 'qc', errorCode: null, errorDetail: null });
          continue;
        }

        // If artifact exists on disk, reuse it even if memory cache was lost.
        const diskPkg = buildPackageFromDisk({ artifactDir: artifactDirFor(avatar.sourceSha256), sourceSha256: avatar.sourceSha256 });
        if (diskPkg) {
          artifactsByKey.set(avatar.artifactKey, {
            artifactKey: avatar.artifactKey,
            status: 'completed',
            package: clone(diskPkg),
            updatedAt: nowIso(),
            createdAt: nowIso()
          });
          updateAvatar(avatar, { status: 'completed', stage: 'qc', package: diskPkg, errorCode: null, errorDetail: null });
          updateJob(job, { status: 'completed', stage: 'qc', errorCode: null, errorDetail: null });
          continue;
        }

        try {
          await runPipelineJob(job);
        } catch (err) {
          // runPipelineJob should not throw; if it does, treat as transient.
          updateJob(job, { status: 'failed', stage: job.stage, errorCode: 'PIPELINE_FAILED', errorDetail: String(err) });
        }

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

function enqueueAvatarJob({ sessionId, buffer, mimeType, injectFailOnce = false } = {}) {
  validateInput({ buffer, mimeType });
  ensureDir(ARTIFACT_ROOT);

  const sourceSha256 = sha256Hex(buffer);
  const artifactKey = `${sourceSha256}:${PIPELINE_VERSION}:${TEMPLATE_VERSION}`;
  const sessionKey = `${sessionId}:${artifactKey}`;

  const existingAvatarId = avatarIdBySessionArtifactKey.get(sessionKey);
  if (existingAvatarId) {
    const avatar = avatarsById.get(existingAvatarId);
    const jobId = jobIdByAvatarId.get(existingAvatarId);
    const job = jobId ? jobsById.get(jobId) : null;
    if (avatar && job) {
      return { avatar: clone(avatar), job: clone(job), reused: true };
    }
  }

  const avatarId = `ava_${randomHex(12)}`;
  const avatar = {
    avatarId,
    sessionId,
    artifactKey,
    sourceSha256,
    sourceBuffer: buffer,
    pipelineVersion: PIPELINE_VERSION,
    templateVersion: TEMPLATE_VERSION,
    status: 'queued',
    stage: 'normalize',
    errorCode: null,
    errorDetail: null,
    package: null,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
  avatarsById.set(avatarId, avatar);
  avatarIdBySessionArtifactKey.set(sessionKey, avatarId);

  const cached = artifactsByKey.get(artifactKey);
  if (cached && cached.status === 'completed' && cached.package) {
    const job = createJobRecord(avatarId, sessionId, 'completed');
    job.artifactKey = artifactKey;
    updateAvatar(avatar, { status: 'completed', stage: 'qc', package: clone(cached.package) });
    return { avatar: clone(avatar), job: clone(job), reused: true };
  }

  const job = createJobRecord(avatarId, sessionId, 'queued');
  job.artifactKey = artifactKey;
  if (injectFailOnce) job.injectFailOnce = true;

  jobsById.set(job.jobId, job);
  jobQueue.push(job.jobId);
  kickJobWorker();

  return { avatar: clone(avatar), job: clone(job), reused: false };
}

function getAvatar(avatarId) {
  const avatar = avatarsById.get(avatarId);
  return avatar ? clone(avatar) : null;
}

function getAvatarJob(jobId) {
  const job = jobsById.get(jobId);
  return job ? clone(job) : null;
}

function resolveAvatarAssetPath(avatarId, kind) {
  const avatar = avatarsById.get(avatarId);
  if (!avatar || !avatar.package || avatar.status !== 'completed') return null;

  if (kind === 'atlas') return avatar.package.paths.atlasPath;
  if (kind === 'atlas2x') return avatar.package.paths.atlas2xPath;
  if (kind === 'metadata') return avatar.package.paths.metadataPath;
  if (kind === 'previewDir') return avatar.package.paths.previewDir;

  if (kind && kind.startsWith('stage:')) {
    const k = kind.slice('stage:'.length);
    return avatar.package.paths.stages?.[k] || null;
  }

  if (kind && kind.startsWith('preview:')) {
    const k = kind.slice('preview:'.length);
    return avatar.package.paths.previewByMeaning[k] || null;
  }
  return null;
}

function buildPackagePayload(avatarId) {
  const avatar = avatarsById.get(avatarId);
  if (!avatar || avatar.status !== 'completed' || !avatar.package) return null;
  return {
    ok: true,
    avatarId: avatar.avatarId,
    pipelineVersion: avatar.pipelineVersion,
    templateVersion: avatar.templateVersion,
    hashes: avatar.package.hashes,
    qc: avatar.package.qc,
    assets: {
      atlasPng: `/api/avatar/${encodeURIComponent(avatar.avatarId)}/atlas.png`,
      atlas2xPng: `/api/avatar/${encodeURIComponent(avatar.avatarId)}/atlas@2x.png`,
      metadataJson: `/api/avatar/${encodeURIComponent(avatar.avatarId)}/atlas.json`
    }
  };
}

function buildPreviewPayload(avatarId) {
  const avatar = avatarsById.get(avatarId);
  if (!avatar) return null;
  const out = {
    ok: true,
    avatarId: avatar.avatarId,
    status: avatar.status,
    stage: avatar.stage,
    errorCode: avatar.errorCode || null
  };
  if (avatar.status === 'completed' && avatar.package) {
    out.preview = {
      walk_left: `/api/avatar/${encodeURIComponent(avatar.avatarId)}/preview/walk_left.png`,
      walk_right: `/api/avatar/${encodeURIComponent(avatar.avatarId)}/preview/walk_right.png`,
      walk_towards_camera: `/api/avatar/${encodeURIComponent(avatar.avatarId)}/preview/walk_towards_camera.png`,
      walk_away_from_camera: `/api/avatar/${encodeURIComponent(avatar.avatarId)}/preview/walk_away_from_camera.png`
    };
  }
  return out;
}

function resetAvatarPipelineState() {
  avatarsById.clear();
  jobsById.clear();
  avatarIdBySessionArtifactKey.clear();
  jobIdByAvatarId.clear();
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
  PipelineError,
  enqueueAvatarJob,
  getAvatar,
  getAvatarJob,
  resolveAvatarAssetPath,
  buildPackagePayload,
  buildPreviewPayload,
  resetAvatarPipelineState
};
