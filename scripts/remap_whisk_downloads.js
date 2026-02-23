#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const IMAGE_EXT_RE = /\.(png|jpe?g|webp)$/i;

function printHelp() {
  process.stdout.write(
    [
      'Remap Auto Whisk downloaded files to deterministic output filenames via map jsonl.',
      '',
      'Usage:',
      '  node scripts/remap_whisk_downloads.js --map <batch.map.jsonl> --downloads-dir <dir> --out-dir <dir> [--copy]',
      '',
      'Options:',
      '  --map <path>             Map file with lineNumber/outputFilename',
      '  --downloads-dir <path>   Folder containing raw downloaded images',
      '  --out-dir <path>         Destination folder for renamed images',
      '  --order <mtime|name>     Download ordering (default: mtime)',
      '  --copy                   Copy files instead of move',
      '  --allow-partial          Allow fewer downloaded files than map rows',
      '  --help'
    ].join('\n') + '\n'
  );
}

function parseArgs(argv) {
  const opts = {
    mapPath: null,
    downloadsDir: null,
    outDir: null,
    order: 'mtime',
    copy: false,
    allowPartial: false,
    help: false
  };

  function next(i, flag) {
    const v = argv[i + 1];
    if (!v || v.startsWith('--')) throw new Error(`MISSING_VALUE:${flag}`);
    return v;
  }

  for (let i = 0; i < argv.length; i += 1) {
    const t = argv[i];
    if (t === '--help') { opts.help = true; continue; }
    if (t === '--map') { opts.mapPath = next(i, t); i += 1; continue; }
    if (t.startsWith('--map=')) { opts.mapPath = t.slice('--map='.length); continue; }
    if (t === '--downloads-dir') { opts.downloadsDir = next(i, t); i += 1; continue; }
    if (t.startsWith('--downloads-dir=')) { opts.downloadsDir = t.slice('--downloads-dir='.length); continue; }
    if (t === '--out-dir') { opts.outDir = next(i, t); i += 1; continue; }
    if (t.startsWith('--out-dir=')) { opts.outDir = t.slice('--out-dir='.length); continue; }
    if (t === '--order') { opts.order = next(i, t); i += 1; continue; }
    if (t.startsWith('--order=')) { opts.order = t.slice('--order='.length); continue; }
    if (t === '--copy') { opts.copy = true; continue; }
    if (t === '--allow-partial') { opts.allowPartial = true; continue; }
    throw new Error(`UNKNOWN_ARG:${t}`);
  }

  if (!opts.help) {
    if (!opts.mapPath) throw new Error('MISSING_ARG:--map');
    if (!opts.downloadsDir) throw new Error('MISSING_ARG:--downloads-dir');
    if (!opts.outDir) throw new Error('MISSING_ARG:--out-dir');
  }

  opts.mapPath = opts.mapPath ? path.resolve(opts.mapPath) : null;
  opts.downloadsDir = opts.downloadsDir ? path.resolve(opts.downloadsDir) : null;
  opts.outDir = opts.outDir ? path.resolve(opts.outDir) : null;
  opts.order = opts.order === 'name' ? 'name' : 'mtime';
  return opts;
}

function readMap(pathname) {
  const rows = fs
    .readFileSync(pathname, 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  rows.sort((a, b) => Number(a.lineNumber || 0) - Number(b.lineNumber || 0));
  return rows;
}

function listImages(dir, order) {
  const items = fs
    .readdirSync(dir)
    .filter((name) => IMAGE_EXT_RE.test(name))
    .map((name) => {
      const abs = path.join(dir, name);
      const st = fs.statSync(abs);
      return { name, abs, mtimeMs: st.mtimeMs };
    });

  items.sort((a, b) => {
    if (order === 'name') return a.name.localeCompare(b.name);
    if (a.mtimeMs !== b.mtimeMs) return a.mtimeMs - b.mtimeMs;
    return a.name.localeCompare(b.name);
  });

  return items;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    printHelp();
    return;
  }

  if (!fs.existsSync(opts.mapPath)) throw new Error(`MAP_NOT_FOUND:${opts.mapPath}`);
  if (!fs.existsSync(opts.downloadsDir)) throw new Error(`DOWNLOADS_DIR_NOT_FOUND:${opts.downloadsDir}`);

  const mapRows = readMap(opts.mapPath);
  const images = listImages(opts.downloadsDir, opts.order);

  if (!opts.allowPartial && images.length !== mapRows.length) {
    throw new Error(`COUNT_MISMATCH:map=${mapRows.length}:images=${images.length}`);
  }

  const n = Math.min(mapRows.length, images.length);
  fs.mkdirSync(opts.outDir, { recursive: true });

  for (let i = 0; i < n; i += 1) {
    const src = images[i].abs;
    const dest = path.join(opts.outDir, mapRows[i].outputFilename);
    if (opts.copy) {
      fs.copyFileSync(src, dest);
    } else {
      fs.renameSync(src, dest);
    }
  }

  process.stdout.write(`remapped=${n} out_dir=${opts.outDir} mode=${opts.copy ? 'copy' : 'move'} order=${opts.order}\n`);
}

try {
  main();
} catch (err) {
  process.stderr.write(`${err?.message || String(err)}\n`);
  process.exit(1);
}
