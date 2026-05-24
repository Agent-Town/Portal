import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

function fail(message) {
  throw new Error(message);
}

function argValue(name, fallback = '') {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  return process.argv[index + 1] || fallback;
}

function boolArg(name) {
  return process.argv.includes(name);
}

function ensureDir(target) {
  fs.mkdirSync(target, { recursive: true });
}

function run(binary, args, options = {}) {
  return execFileSync(binary, args, { stdio: options.stdio || 'pipe', encoding: options.encoding || 'utf8' });
}

function resolveBinary(candidates) {
  for (const candidate of candidates) {
    try {
      if (candidate.includes(path.sep) && fs.existsSync(candidate)) return candidate;
      run('which', [candidate]);
      return candidate;
    } catch {
      // Try next candidate.
    }
  }
  fail(`Missing binary. Tried: ${candidates.join(', ')}`);
}

function parseGrid(value) {
  const match = String(value || '').match(/^(\d+)x(\d+)$/);
  if (!match) fail(`Invalid --grid value "${value}". Expected COLSxROWS, for example 3x3.`);
  return { cols: Number(match[1]), rows: Number(match[2]) };
}

function parseStates(value, expected) {
  const states = String(value || '')
    .split(',')
    .map((state) => state.trim())
    .filter(Boolean);
  if (states.length !== expected) {
    fail(`Expected ${expected} states for the grid, got ${states.length}.`);
  }
  return states;
}

function relativePath(absolutePath) {
  return path.relative(repoRoot, absolutePath).replace(/\\/g, '/');
}

function publicSrc(relativeAssetPath) {
  return `/${relativeAssetPath.replace(/^public\//, '')}`;
}

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function imageInfo(filePath, magick) {
  const output = run(magick, ['identify', '-format', '%w %h %[channels]', filePath]).trim();
  const [width, height, ...channelParts] = output.split(/\s+/);
  return {
    width: Number(width),
    height: Number(height),
    channels: channelParts.join(' ')
  };
}

function alphaPixel(filePath, x, y, magick) {
  return run(magick, [filePath, '-format', `%[pixel:p{${x},${y}}]`, 'info:']).trim();
}

function assertTransparentCorners(filePath, magick) {
  const info = imageInfo(filePath, magick);
  const corners = [
    alphaPixel(filePath, 0, 0, magick),
    alphaPixel(filePath, Math.max(0, info.width - 1), 0, magick),
    alphaPixel(filePath, 0, Math.max(0, info.height - 1), magick),
    alphaPixel(filePath, Math.max(0, info.width - 1), Math.max(0, info.height - 1), magick)
  ];
  if (!corners.every((pixel) => /,0\)$|none|transparent/i.test(pixel))) {
    fail(`Expected transparent corners in ${filePath}, got: ${corners.join(' | ')}`);
  }
}

function main() {
  const inputArg = argValue('--input');
  const outDirArg = argValue('--out-dir');
  const prefix = argValue('--prefix');
  const statesArg = argValue('--states');
  const grid = parseGrid(argValue('--grid', '1x1'));
  const targetSize = Number(argValue('--size', '512'));
  const key = argValue('--key', '#ff00ff');
  const fuzz = argValue('--fuzz', '18%');
  const quality = argValue('--quality', '90');
  const pngOnly = boolArg('--png-only');

  if (!inputArg) fail('Missing --input');
  if (!outDirArg) fail('Missing --out-dir');
  if (!prefix) fail('Missing --prefix');
  if (!Number.isFinite(targetSize) || targetSize <= 0) fail(`Invalid --size: ${targetSize}`);

  const input = path.resolve(repoRoot, inputArg);
  const outDir = path.resolve(repoRoot, outDirArg);
  if (!fs.existsSync(input)) fail(`Input file does not exist: ${input}`);
  ensureDir(outDir);

  const states = parseStates(statesArg, grid.cols * grid.rows);
  const magick = resolveBinary(['/opt/homebrew/bin/magick', '/usr/local/bin/magick', 'magick']);
  const cwebp = pngOnly ? '' : resolveBinary(['/opt/homebrew/bin/cwebp', '/usr/local/bin/cwebp', 'cwebp']);
  const sourceInfo = imageInfo(input, magick);
  const cellWidth = Math.floor(sourceInfo.width / grid.cols);
  const cellHeight = Math.floor(sourceInfo.height / grid.rows);
  if (cellWidth <= 0 || cellHeight <= 0) fail(`Invalid source dimensions: ${sourceInfo.width}x${sourceInfo.height}`);

  const entries = [];
  for (let index = 0; index < states.length; index += 1) {
    const state = states[index];
    const col = index % grid.cols;
    const row = Math.floor(index / grid.cols);
    const x = col * cellWidth;
    const y = row * cellHeight;
    const pngPath = path.join(outDir, `${prefix}-${state}.png`);
    const webpPath = path.join(outDir, `${prefix}-${state}.webp`);
    const crop = `${cellWidth}x${cellHeight}+${x}+${y}`;

    run(magick, [
      input,
      '-alpha',
      'set',
      '-crop',
      crop,
      '+repage',
      '-fuzz',
      fuzz,
      '-transparent',
      key,
      '-resize',
      `${targetSize}x${targetSize}`,
      '-background',
      'none',
      '-gravity',
      'center',
      '-extent',
      `${targetSize}x${targetSize}`,
      pngPath
    ]);
    assertTransparentCorners(pngPath, magick);

    const entry = {
      state,
      png: {
        path: relativePath(pngPath),
        src: publicSrc(relativePath(pngPath)),
        bytes: fs.statSync(pngPath).size,
        sha256: sha256File(pngPath),
        ...imageInfo(pngPath, magick)
      }
    };

    if (!pngOnly) {
      run(cwebp, ['-quiet', '-q', quality, '-alpha_q', '100', pngPath, '-o', webpPath]);
      assertTransparentCorners(webpPath, magick);
      entry.webp = {
        path: relativePath(webpPath),
        src: publicSrc(relativePath(webpPath)),
        bytes: fs.statSync(webpPath).size,
        sha256: sha256File(webpPath),
        ...imageInfo(webpPath, magick)
      };
    }

    entries.push(entry);
  }

  const metadata = {
    source: {
      path: relativePath(input),
      bytes: fs.statSync(input).size,
      sha256: sha256File(input),
      ...sourceInfo
    },
    options: {
      grid,
      targetSize,
      key,
      fuzz,
      quality,
      prefix
    },
    entries
  };
  const metadataPath = path.join(outDir, `${prefix}-sprite-sheet-normalized.json`);
  fs.writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');
  console.log(`Normalized ${entries.length} sprites to ${relativePath(outDir)}`);
  console.log(relativePath(metadataPath));
}

main();
