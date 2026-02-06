#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const DEFAULT_API_BASE = process.env.PIXELLAB_API_BASE || 'https://api.pixellab.ai/v1';
const REQUEST_TIMEOUT_MS = Number(process.env.PIXELLAB_TIMEOUT_MS || 90_000);
const GIF_FPS = Number(process.env.PIXELLAB_GIF_FPS || 8);
const GIF_SCALE = Number(process.env.PIXELLAB_GIF_SCALE || 4);
const ANIMATION_SIZE = 64;
const DEFAULT_ANCHOR_SIZE = Number(process.env.PIXELLAB_ANCHOR_SIZE || 128);
const DEFAULT_DESCRIPTION =
  'pixel art chibi cowgirl with long black hair, brown hat with star badge, brown vest, white shirt, blue jeans, and boots';
const WALK_DIRECTIONS = ['south', 'east', 'west', 'north'];
const PIPELINES = {
  TEXT: 'text',
  BITFORGE_ROTATE_TEXT: 'bitforge-rotate-text'
};
const PIPELINE_VALUES = Object.values(PIPELINES);

function usageAndExit(message) {
  if (message) {
    console.error(message);
    console.error('');
  }
  console.error(
    [
      'Usage:',
      '  PIXELLAB_API_TOKEN=... node scripts/pixellab_sprite_flow.js [options]',
      '',
      'Options:',
      '  --input <path>         Source image path (default: assets/eliza.jpg)',
      '  --out-dir <path>       Output folder (default: assets/generated/pixellab/<timestamp>)',
      '  --description <text>   Character description for generation',
      `  --pipeline <name>      ${PIPELINE_VALUES.join(', ')} (default: ${PIPELINES.BITFORGE_ROTATE_TEXT})`,
      `  --anchor-size <int>    Anchor size for ${PIPELINES.BITFORGE_ROTATE_TEXT} pipeline (default: ${DEFAULT_ANCHOR_SIZE})`,
      '  --seed <int>           Optional seed for reproducibility',
      '  --walk-directions <v>  Comma-separated walk directions (default: south,east,west,north)',
      '  --skip-animation       Only generate idle directional sprites',
      '  --idle-dir <path>      Reuse existing idle sprites (idle_<dir>.png) and skip idle generation',
      '  --no-resize-reference  Use original reference image bytes (no pre-resize to 64x64)',
      '  --skip-gifs            Skip GIF assembly step',
      '  --dry-run              Validate setup and token balance, then exit',
      '  --help                 Show this help text'
    ].join('\n')
  );
  process.exit(1);
}

function parseArgs(argv) {
  const options = {
    input: path.join(process.cwd(), 'assets', 'eliza.jpg'),
    outDir: path.join(process.cwd(), 'assets', 'generated', 'pixellab', String(Date.now())),
    description: DEFAULT_DESCRIPTION,
    pipeline: PIPELINES.BITFORGE_ROTATE_TEXT,
    anchorSize: DEFAULT_ANCHOR_SIZE,
    seed: null,
    skipAnimation: false,
    walkDirections: WALK_DIRECTIONS.slice(),
    idleDir: null,
    noResizeReference: false,
    skipGifs: false,
    dryRun: false
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') usageAndExit();
    if (arg === '--skip-animation') {
      options.skipAnimation = true;
      continue;
    }
    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }
    if (arg === '--skip-gifs') {
      options.skipGifs = true;
      continue;
    }
    if (arg === '--no-resize-reference') {
      options.noResizeReference = true;
      continue;
    }
    if (arg === '--input') {
      options.input = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === '--out-dir') {
      options.outDir = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === '--description') {
      options.description = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === '--seed') {
      const value = Number(argv[i + 1]);
      if (!Number.isInteger(value)) usageAndExit('Invalid --seed. Expected an integer.');
      options.seed = value;
      i += 1;
      continue;
    }
    if (arg === '--pipeline') {
      const value = String(argv[i + 1] || '').trim();
      if (!PIPELINE_VALUES.includes(value)) {
        usageAndExit(`Invalid --pipeline. Expected one of: ${PIPELINE_VALUES.join(', ')}`);
      }
      options.pipeline = value;
      i += 1;
      continue;
    }
    if (arg === '--anchor-size') {
      const value = Number(argv[i + 1]);
      if (!Number.isInteger(value) || value < 16 || value > 200) {
        usageAndExit('Invalid --anchor-size. Expected an integer between 16 and 200.');
      }
      options.anchorSize = value;
      i += 1;
      continue;
    }
    if (arg === '--walk-directions') {
      const raw = String(argv[i + 1] || '')
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean);
      if (!raw.length) usageAndExit('Invalid --walk-directions. Expected at least one direction.');
      const invalid = raw.filter((x) => !WALK_DIRECTIONS.includes(x));
      if (invalid.length) {
        usageAndExit(`Invalid walk directions: ${invalid.join(', ')}`);
      }
      options.walkDirections = raw;
      i += 1;
      continue;
    }
    if (arg === '--idle-dir') {
      options.idleDir = argv[i + 1];
      i += 1;
      continue;
    }
    usageAndExit(`Unknown argument: ${arg}`);
  }

  if (!options.input) usageAndExit('Missing --input value');
  if (!options.outDir) usageAndExit('Missing --out-dir value');
  if (!options.description || typeof options.description !== 'string') {
    usageAndExit('Missing --description value');
  }

  options.input = path.resolve(options.input);
  options.outDir = path.resolve(options.outDir);
  if (options.idleDir) options.idleDir = path.resolve(options.idleDir);
  options.description = options.description.trim();
  if (!options.description) usageAndExit('Description must not be empty.');

  return options;
}

function toRawBase64(filePath) {
  const bytes = fs.readFileSync(filePath);
  return bytes.toString('base64');
}

function hasCommand(cmd) {
  try {
    execFileSync('which', [cmd], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function resizeImageNearest(inputPath, outputPath, width, height) {
  if (hasCommand('ffmpeg')) {
    execFileSync(
      'ffmpeg',
      [
        '-hide_banner',
        '-loglevel',
        'error',
        '-y',
        '-i',
        inputPath,
        '-vf',
        `scale=${width}:${height}:flags=neighbor`,
        outputPath
      ],
      { stdio: 'pipe' }
    );
    return;
  }
  execFileSync('sips', ['-s', 'format', 'png', '-z', String(height), String(width), inputPath, '--out', outputPath], {
    stdio: 'ignore'
  });
}

function prepareStyleImage(inputPath, outRoot, size = ANIMATION_SIZE) {
  const preparedDir = path.join(outRoot, '_tmp');
  ensureDir(preparedDir);
  const preparedPath = path.join(preparedDir, `style_${size}.png`);
  try {
    resizeImageNearest(inputPath, preparedPath, size, size);
  } catch (err) {
    throw new Error(
      `Failed to resize input image to ${size}x${size}. Ensure "ffmpeg" or "sips" exists and input is valid: ${inputPath}`
    );
  }
  return preparedPath;
}

function dataUrlToBuffer(dataUrl) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid image data URL returned by PixelLab.');
  }
  const mime = match[1];
  const base64 = match[2];
  return { mime, buffer: Buffer.from(base64, 'base64') };
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function extractRawBase64(imageValue) {
  if (typeof imageValue !== 'string' || !imageValue) {
    throw new Error('Missing base64 image value.');
  }
  if (imageValue.startsWith('data:')) {
    const { buffer } = dataUrlToBuffer(imageValue);
    return buffer.toString('base64');
  }
  return imageValue.trim();
}

function writeDataUrlPng(filePath, imageObj) {
  const rawBase64 = extractRawBase64(imageObj?.base64 || imageObj);
  const buffer = Buffer.from(rawBase64, 'base64');
  fs.writeFileSync(filePath, buffer);
  return rawBase64;
}

function createGifFromDirectionalFrames(outPath, framePaths) {
  if (!Array.isArray(framePaths) || framePaths.length < 2) {
    throw new Error(`Not enough frames to build GIF: ${outPath}`);
  }
  const resolved = framePaths.map((p) => path.resolve(p));
  const base = resolved[0];
  const m = base.match(/^(.*_f)(\d+)(\.png)$/);
  if (!m) {
    throw new Error(`Unexpected frame naming for GIF creation: ${base}`);
  }
  const prefix = m[1];
  const ext = m[3];
  const pattern = `${prefix}%d${ext}`;
  const palettePath = `${outPath}.palette.png`;
  const scaleFilter = `scale=iw*${GIF_SCALE}:ih*${GIF_SCALE}:flags=neighbor`;

  execFileSync(
    'ffmpeg',
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-framerate',
      String(GIF_FPS),
      '-start_number',
      '1',
      '-i',
      pattern,
      '-vf',
      `${scaleFilter},palettegen=stats_mode=single`,
      '-frames:v',
      '1',
      palettePath
    ],
    { stdio: 'pipe' }
  );

  execFileSync(
    'ffmpeg',
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-framerate',
      String(GIF_FPS),
      '-start_number',
      '1',
      '-i',
      pattern,
      '-i',
      palettePath,
      '-lavfi',
      `${scaleFilter} [x]; [x][1:v] paletteuse=dither=bayer:bayer_scale=3`,
      outPath
    ],
    { stdio: 'pipe' }
  );

  fs.rmSync(palettePath, { force: true });
}

function createPreviewSheetFromFrames(outPath, framePaths) {
  if (!Array.isArray(framePaths) || !framePaths.length) {
    throw new Error(`No frames available for preview sheet: ${outPath}`);
  }
  const frameA = path.resolve(framePaths[0]);
  const frameB = path.resolve(framePaths[1] || framePaths[0]);
  const stackScaleFilter = `hstack=inputs=2,scale=iw*${GIF_SCALE}:ih*${GIF_SCALE}:flags=neighbor`;
  execFileSync(
    'ffmpeg',
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-i',
      frameA,
      '-i',
      frameB,
      '-filter_complex',
      stackScaleFilter,
      '-frames:v',
      '1',
      outPath
    ],
    { stdio: 'pipe' }
  );
}

function buildWalkGifs(outRoot, walkSprites, { skipGifs = false } = {}) {
  if (skipGifs) return null;
  if (!walkSprites || typeof walkSprites !== 'object') return null;
  if (!hasCommand('ffmpeg')) {
    console.warn('[pixellab] ffmpeg not found; skipping GIF assembly.');
    return null;
  }

  const gifDir = path.join(outRoot, 'gifs');
  const previewDir = path.join(outRoot, 'gif_preview');
  ensureDir(gifDir);
  ensureDir(previewDir);

  const byDirection = {};
  const previewByDirection = {};
  for (const dir of Object.keys(walkSprites)) {
    const frames = walkSprites[dir];
    if (!Array.isArray(frames) || frames.length < 2) continue;
    const outPath = path.join(gifDir, `walk_${dir}.gif`);
    createGifFromDirectionalFrames(outPath, frames);
    byDirection[dir] = outPath;

    const previewPath = path.join(previewDir, `walk_${dir}.png`);
    createPreviewSheetFromFrames(previewPath, frames);
    previewByDirection[dir] = previewPath;
  }

  const byMeaning = {};
  const previewByMeaning = {};
  if (byDirection.west) byMeaning.left = byDirection.west;
  if (byDirection.east) byMeaning.right = byDirection.east;
  if (byDirection.south) byMeaning.towards_camera = byDirection.south;
  if (byDirection.north) byMeaning.away_from_camera = byDirection.north;
  if (previewByDirection.west) previewByMeaning.left = previewByDirection.west;
  if (previewByDirection.east) previewByMeaning.right = previewByDirection.east;
  if (previewByDirection.south) previewByMeaning.towards_camera = previewByDirection.south;
  if (previewByDirection.north) previewByMeaning.away_from_camera = previewByDirection.north;

  if (byMeaning.left) fs.copyFileSync(byMeaning.left, path.join(gifDir, 'walk_left.gif'));
  if (byMeaning.right) fs.copyFileSync(byMeaning.right, path.join(gifDir, 'walk_right.gif'));
  if (byMeaning.towards_camera) {
    fs.copyFileSync(byMeaning.towards_camera, path.join(gifDir, 'walk_towards_camera.gif'));
  }
  if (byMeaning.away_from_camera) {
    fs.copyFileSync(byMeaning.away_from_camera, path.join(gifDir, 'walk_away_from_camera.gif'));
  }
  if (previewByMeaning.left) fs.copyFileSync(previewByMeaning.left, path.join(previewDir, 'walk_left.png'));
  if (previewByMeaning.right) fs.copyFileSync(previewByMeaning.right, path.join(previewDir, 'walk_right.png'));
  if (previewByMeaning.towards_camera) {
    fs.copyFileSync(previewByMeaning.towards_camera, path.join(previewDir, 'walk_towards_camera.png'));
  }
  if (previewByMeaning.away_from_camera) {
    fs.copyFileSync(previewByMeaning.away_from_camera, path.join(previewDir, 'walk_away_from_camera.png'));
  }

  return { byDirection, byMeaning, dir: gifDir, previewByDirection, previewByMeaning, previewDir };
}

async function pixellabPost(token, endpoint, payload) {
  const url = `${DEFAULT_API_BASE}${endpoint}`;
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });
  } catch (err) {
    if (err && err.name === 'TimeoutError') {
      throw new Error(`PixelLab ${endpoint} timed out after ${REQUEST_TIMEOUT_MS}ms.`);
    }
    throw err;
  }

  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    // keep raw text for error message
  }

  if (!response.ok) {
    const detail = json ? JSON.stringify(json) : text.slice(0, 400);
    throw new Error(`PixelLab ${endpoint} failed (${response.status}): ${detail}`);
  }
  if (!json) throw new Error(`PixelLab ${endpoint} returned non-JSON response.`);
  return json;
}

async function pixellabGet(token, endpoint) {
  const url = `${DEFAULT_API_BASE}${endpoint}`;
  let response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });
  } catch (err) {
    if (err && err.name === 'TimeoutError') {
      throw new Error(`PixelLab ${endpoint} timed out after ${REQUEST_TIMEOUT_MS}ms.`);
    }
    throw err;
  }

  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    // keep raw text for error message
  }
  if (!response.ok) {
    const detail = json ? JSON.stringify(json) : text.slice(0, 400);
    throw new Error(`PixelLab ${endpoint} failed (${response.status}): ${detail}`);
  }
  if (!json) throw new Error(`PixelLab ${endpoint} returned non-JSON response.`);
  return json;
}

function toBase64ImageObj(dataUrl) {
  return { type: 'base64', base64: dataUrl };
}

function maybeSeed(options) {
  if (options.seed == null) return {};
  return { seed: options.seed };
}

async function run() {
  const options = parseArgs(process.argv.slice(2));
  const token = process.env.PIXELLAB_API_TOKEN;
  if (!token) usageAndExit('Missing PIXELLAB_API_TOKEN environment variable.');
  if (!fs.existsSync(options.input)) usageAndExit(`Input image not found: ${options.input}`);

  const outRoot = options.outDir;
  const idleDir = path.join(outRoot, 'idle');
  const walkDir = path.join(outRoot, 'walk');
  const anchorDir = path.join(outRoot, 'anchor');
  ensureDir(idleDir);
  ensureDir(walkDir);
  ensureDir(anchorDir);

  if (
    options.pipeline === PIPELINES.BITFORGE_ROTATE_TEXT &&
    options.noResizeReference &&
    options.anchorSize !== ANIMATION_SIZE
  ) {
    console.warn(
      `[pixellab] --no-resize-reference with --pipeline ${PIPELINES.BITFORGE_ROTATE_TEXT} can fail unless input already matches both ${ANIMATION_SIZE}x${ANIMATION_SIZE} and ${options.anchorSize}x${options.anchorSize}.`
    );
  }

  const preparedInputPathAnimation = options.noResizeReference
    ? options.input
    : prepareStyleImage(options.input, outRoot, ANIMATION_SIZE);
  const preparedInputPathAnchor = options.noResizeReference
    ? options.input
    : prepareStyleImage(options.input, outRoot, options.anchorSize);
  const sourceImageDataUrl = toRawBase64(preparedInputPathAnimation);
  const sourceAnchorDataUrl = toRawBase64(preparedInputPathAnchor);

  const usage = [];
  const manifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    inputImage: options.input,
    preparedInputImage: preparedInputPathAnimation,
    preparedAnchorImage: preparedInputPathAnchor,
    noResizeReference: options.noResizeReference,
    pipeline: options.pipeline,
    anchorSize: options.anchorSize,
    description: options.description,
    apiBase: DEFAULT_API_BASE,
    steps: [],
    sprites: {
      idle: {},
      idleHiRes: {},
      walk: {}
    }
  };

  const balance = await pixellabGet(token, '/balance');
  const balanceUsd = Number(balance?.usd || 0);
  manifest.balanceUsd = balanceUsd;

  if (options.dryRun) {
    ensureDir(outRoot);
    const dryPath = path.join(outRoot, 'dry-run.json');
    fs.writeFileSync(
      dryPath,
      JSON.stringify(
        {
          ok: true,
          mode: 'dry-run',
          generatedAt: new Date().toISOString(),
          inputImage: options.input,
          preparedInputImage: preparedInputPathAnimation,
          preparedAnchorImage: preparedInputPathAnchor,
          noResizeReference: options.noResizeReference,
          pipeline: options.pipeline,
          anchorSize: options.anchorSize,
          walkDirections: options.walkDirections,
          skipAnimation: options.skipAnimation,
          balanceUsd
        },
        null,
        2
      )
    );
    console.log(`Dry run complete. Balance USD: ${balanceUsd}`);
    console.log(`Report: ${dryPath}`);
    return;
  }

  if (balanceUsd <= 0) {
    console.warn('[pixellab] /balance returned 0 USD; continuing because subscription plans can still allow API usage.');
  }

  const idleDataByDirection = {};
  const idleSourceDir = options.idleDir ? options.idleDir : idleDir;
  if (options.idleDir) {
    for (const dir of WALK_DIRECTIONS) {
      const idlePath = path.join(idleSourceDir, `idle_${dir}.png`);
      if (!fs.existsSync(idlePath)) {
        throw new Error(`Missing idle sprite in --idle-dir: ${idlePath}`);
      }
      idleDataByDirection[dir] = toRawBase64(idlePath);
      manifest.sprites.idle[dir] = idlePath;
    }
    manifest.steps.push({ endpoint: 'idle-reuse', source: idleSourceDir });
  } else if (options.pipeline === PIPELINES.TEXT) {
    console.log('1/2 Generating directional idle sprites from reference image...');
    for (const dir of WALK_DIRECTIONS) {
      const idleResponse = await pixellabPost(token, '/animate-with-text', {
        image_size: { width: ANIMATION_SIZE, height: ANIMATION_SIZE },
        description: options.description,
        action: 'idle standing',
        view: 'side',
        direction: dir,
        n_frames: 4,
        reference_image: toBase64ImageObj(sourceImageDataUrl),
        text_guidance_scale: 2.0,
        image_guidance_scale: 8.0,
        ...maybeSeed(options)
      });
      const idleUsd = Number(idleResponse?.usage?.usd || 0);
      usage.push(idleUsd);
      const frames = Array.isArray(idleResponse?.images) ? idleResponse.images : [];
      if (!frames.length) {
        throw new Error(`Idle generation returned no frames for direction: ${dir}`);
      }
      const outPath = path.join(idleDir, `idle_${dir}.png`);
      const frameBase64 = writeDataUrlPng(outPath, frames[0]);
      idleDataByDirection[dir] = frameBase64;
      manifest.sprites.idle[dir] = outPath;
      manifest.steps.push({
        endpoint: '/animate-with-text',
        action: 'idle standing',
        direction: dir,
        frames: frames.length,
        usd: idleUsd
      });
    }
  } else if (options.pipeline === PIPELINES.BITFORGE_ROTATE_TEXT) {
    console.log(`1/3 Generating ${options.anchorSize}x${options.anchorSize} anchor sprite via bitforge...`);
    const bitforgeResponse = await pixellabPost(token, '/generate-image-bitforge', {
      image_size: { width: options.anchorSize, height: options.anchorSize },
      description: options.description,
      view: 'side',
      direction: 'south',
      no_background: true,
      style_image: toBase64ImageObj(sourceAnchorDataUrl),
      style_strength: 35,
      init_image: toBase64ImageObj(sourceAnchorDataUrl),
      init_image_strength: 800,
      text_guidance_scale: 1.8,
      ...maybeSeed(options)
    });
    const bitforgeUsd = Number(bitforgeResponse?.usage?.usd || 0);
    usage.push(bitforgeUsd);
    const anchorPath = path.join(anchorDir, `anchor_${options.anchorSize}.png`);
    const anchorBase64 = writeDataUrlPng(anchorPath, bitforgeResponse?.image);
    manifest.anchorImage = anchorPath;
    manifest.steps.push({
      endpoint: '/generate-image-bitforge',
      action: 'anchor',
      size: options.anchorSize,
      usd: bitforgeUsd
    });

    console.log('2/3 Generating directional idle references (rotate + downscale)...');
    for (const dir of WALK_DIRECTIONS) {
      const hiResIdlePath = path.join(idleDir, `idle_${dir}_${options.anchorSize}.png`);
      if (dir !== 'south') {
        const rotateResponse = await pixellabPost(token, '/rotate', {
          image_size: { width: options.anchorSize, height: options.anchorSize },
          from_view: 'side',
          to_view: 'side',
          from_direction: 'south',
          to_direction: dir,
          from_image: toBase64ImageObj(anchorBase64),
          image_guidance_scale: 10,
          ...maybeSeed(options)
        });
        const rotateUsd = Number(rotateResponse?.usage?.usd || 0);
        usage.push(rotateUsd);
        writeDataUrlPng(hiResIdlePath, rotateResponse?.image);
        manifest.steps.push({
          endpoint: '/rotate',
          from_direction: 'south',
          to_direction: dir,
          size: options.anchorSize,
          usd: rotateUsd
        });
      } else {
        fs.copyFileSync(anchorPath, hiResIdlePath);
      }

      const idlePath = path.join(idleDir, `idle_${dir}.png`);
      resizeImageNearest(hiResIdlePath, idlePath, ANIMATION_SIZE, ANIMATION_SIZE);
      idleDataByDirection[dir] = toRawBase64(idlePath);
      manifest.sprites.idle[dir] = idlePath;
      manifest.sprites.idleHiRes[dir] = hiResIdlePath;
      if (dir === 'south') {
        manifest.steps.push({
          endpoint: 'idle-from-anchor',
          direction: dir,
          size: options.anchorSize
        });
      }
    }
  } else {
    throw new Error(`Unsupported pipeline: ${options.pipeline}`);
  }

  if (!options.skipAnimation) {
    const phaseLabel = options.pipeline === PIPELINES.BITFORGE_ROTATE_TEXT ? '3/3' : '2/2';
    for (const dir of options.walkDirections) {
      console.log(`${phaseLabel} Generating walk animation (${dir})...`);
      const directionRef = idleDataByDirection[dir] || sourceImageDataUrl;
      const animatePayload =
        options.pipeline === PIPELINES.BITFORGE_ROTATE_TEXT
          ? {
              image_size: { width: ANIMATION_SIZE, height: ANIMATION_SIZE },
              description: options.description,
              negative_description: 'extra limbs, extra heads, noisy background, abstract artifacts',
              action: 'walk cycle',
              view: 'side',
              direction: dir,
              n_frames: 4,
              reference_image: toBase64ImageObj(directionRef),
              text_guidance_scale: 1.6,
              image_guidance_scale: 13.5,
              ...maybeSeed(options)
            }
          : {
              image_size: { width: ANIMATION_SIZE, height: ANIMATION_SIZE },
              description: options.description,
              action: 'walk cycle',
              view: 'side',
              direction: dir,
              n_frames: 4,
              reference_image: toBase64ImageObj(directionRef),
              text_guidance_scale: 2.0,
              image_guidance_scale: 8.0,
              ...maybeSeed(options)
            };
      const animateResponse = await pixellabPost(token, '/animate-with-text', animatePayload);
      const animateUsd = Number(animateResponse?.usage?.usd || 0);
      usage.push(animateUsd);
      const frames = Array.isArray(animateResponse?.images) ? animateResponse.images : [];
      manifest.sprites.walk[dir] = [];
      for (let i = 0; i < frames.length; i += 1) {
        const outPath = path.join(walkDir, `walk_${dir}_f${i + 1}.png`);
        writeDataUrlPng(outPath, frames[i]);
        manifest.sprites.walk[dir].push(outPath);
      }
      manifest.steps.push({
        endpoint: '/animate-with-text',
        direction: dir,
        frames: frames.length,
        usd: animateUsd
      });
    }
  }

  const totalUsd = usage.reduce((sum, value) => sum + value, 0);
  manifest.totalUsd = Number(totalUsd.toFixed(6));

  const gifSummary = buildWalkGifs(outRoot, manifest.sprites.walk, { skipGifs: options.skipGifs });
  if (gifSummary) {
    manifest.gifs = gifSummary;
  }

  const manifestPath = path.join(outRoot, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log('');
  console.log(`Sprite flow complete.`);
  console.log(`Output: ${outRoot}`);
  console.log(`Manifest: ${manifestPath}`);
  console.log(`Estimated API usage (USD): ${manifest.totalUsd}`);
}

run().catch((err) => {
  console.error('');
  console.error('Sprite flow failed.');
  console.error(err && err.message ? err.message : err);
  process.exit(1);
});
