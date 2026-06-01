#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const scriptPath = fileURLToPath(import.meta.url);
const reportsDir = path.dirname(scriptPath);
const repoRoot = path.dirname(reportsDir);
const reportsMediaRoot = path.join(repoRoot, 'reports', 'media');
const defaultReviewDir = path.join(
  reportsMediaRoot,
  'agent-town-hq13k-candidate-02-gpt-image-2-review-assets-2026-06-01'
);

const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const colorTypes = {
  0: { label: 'grayscale', channels: 1, hasAlphaChannel: false },
  2: { label: 'truecolor_rgb', channels: 3, hasAlphaChannel: false },
  3: { label: 'indexed_color', channels: 1, hasAlphaChannel: false },
  4: { label: 'grayscale_alpha', channels: 2, hasAlphaChannel: true },
  6: { label: 'truecolor_rgba', channels: 4, hasAlphaChannel: true }
};

const slots = [
  {
    assetFile: 'fog-hinted-soft-veil-v1.png',
    slotId: 'expedition_map.fog.hinted',
    expectedDimensions: { width: 512, height: 512 },
    usage: 'Transparent mist overlay for server-owned hinted fog state.',
    exactBaseNames: [
      'fog-hinted-soft-veil-v1.png',
      'fog-hinted-soft-veil-v1.review-alpha.png',
      'fog-hinted-soft-veil-v1.gpt-image-2-source.png',
      'hinted-fog-veil-v1.review-alpha.png',
      'hinted-fog-veil-v1.gpt-image-2-source.png'
    ],
    infer: (name) => name.includes('hinted') && (name.includes('fog') || name.includes('veil')) && !name.includes('marker')
  },
  {
    assetFile: 'fog-locked-heavy-cloud-v1.png',
    slotId: 'expedition_map.fog.locked_unknown',
    expectedDimensions: { width: 512, height: 512 },
    usage: 'Heavy generic cloud overlay for locked unknown sectors.',
    exactBaseNames: [
      'fog-locked-heavy-cloud-v1.png',
      'fog-locked-heavy-cloud-v1.review-alpha.png',
      'fog-locked-heavy-cloud-v1.gpt-image-2-source.png',
      'locked-unknown-fog-v1.review-alpha.png',
      'locked-unknown-fog-v1.gpt-image-2-source.png'
    ],
    infer: (name) => name.includes('locked') && (name.includes('fog') || name.includes('cloud')) && !name.includes('marker')
  },
  {
    assetFile: 'frontier-dotted-boundary-v1.png',
    slotId: 'expedition_map.fog.frontier_border',
    expectedDimensions: { width: 1024, height: 128 },
    usage: 'Transparent dotted boundary strip for visible-to-hidden map edge presentation.',
    exactBaseNames: [
      'frontier-dotted-boundary-v1.png',
      'frontier-dotted-boundary-v1.review-alpha.png',
      'frontier-dotted-boundary-v1.gpt-image-2-source.png'
    ],
    infer: (name) => name.includes('frontier') && name.includes('boundary')
  },
  {
    assetFile: 'marker-known-site-plan-v1.png',
    slotId: 'expedition_map.marker.known_site_plan',
    expectedDimensions: { width: 128, height: 192 },
    usage: 'Pin for visible reviewed or known site-plan state.',
    exactBaseNames: [
      'marker-known-site-plan-v1.png',
      'marker-known-site-plan-v1.review-alpha.png',
      'marker-known-site-plan-v1.gpt-image-2-source.png'
    ],
    infer: (name) => name.includes('marker') && name.includes('known') && name.includes('site')
  },
  {
    assetFile: 'marker-hinted-unknown-v1.png',
    slotId: 'expedition_map.marker.hinted_unknown',
    expectedDimensions: { width: 128, height: 192 },
    usage: 'Generic hinted unknown marker with no hidden-sector clue.',
    exactBaseNames: [
      'marker-hinted-unknown-v1.png',
      'marker-hinted-unknown-v1.review-alpha.png',
      'marker-hinted-unknown-v1.gpt-image-2-source.png'
    ],
    infer: (name) => name.includes('marker') && name.includes('hinted') && name.includes('unknown')
  },
  {
    assetFile: 'marker-owned-outpost-v1.png',
    slotId: 'expedition_map.marker.owned_outpost',
    expectedDimensions: { width: 128, height: 192 },
    usage: 'Pin for visible server-owned outpost state.',
    exactBaseNames: [
      'marker-owned-outpost-v1.png',
      'marker-owned-outpost-v1.review-alpha.png',
      'marker-owned-outpost-v1.gpt-image-2-source.png'
    ],
    infer: (name) => name.includes('marker') && name.includes('owned') && name.includes('outpost')
  },
  {
    assetFile: 'survey-receipt-stroke-v1.png',
    slotId: 'expedition_map.stroke.scout_receipt_trace',
    expectedDimensions: { width: 1024, height: 128 },
    usage: 'Transparent decorative receipt or evidence trace; not route gameplay.',
    exactBaseNames: [
      'survey-receipt-stroke-v1.png',
      'survey-receipt-stroke-v1.review-alpha.png',
      'survey-receipt-stroke-v1.gpt-image-2-source.png'
    ],
    infer: (name) => name.includes('survey') && (name.includes('receipt') || name.includes('stroke') || name.includes('trace'))
  },
  {
    assetFile: 'hud-selected-sector-frame-v1.png',
    slotId: 'hud.frame.selected_sector_card',
    expectedDimensions: { width: 640, height: 360 },
    usage: 'Empty selected-sector card frame for app-rendered read-model text.',
    exactBaseNames: [
      'hud-selected-sector-frame-v1.png',
      'hud-selected-sector-frame-v1.review-alpha.png',
      'hud-selected-sector-frame-v1.gpt-image-2-source.png'
    ],
    infer: (name) => name.includes('hud') && name.includes('selected') && name.includes('sector') && name.includes('frame')
  }
];

function parseArgs(argv) {
  let pretty = false;
  let target = null;
  for (const arg of argv) {
    if (arg === '--pretty') {
      pretty = true;
    } else if (arg === '--help' || arg === '-h') {
      return { help: true, pretty };
    } else if (!target) {
      target = arg;
    } else {
      return { error: `Unexpected argument: ${arg}` };
    }
  }
  return { pretty, target: target || defaultReviewDir };
}

function relativeToRepo(absPath) {
  const rel = path.relative(repoRoot, absPath);
  return rel || '.';
}

function resolveTarget(inputPath) {
  const resolved = path.resolve(repoRoot, inputPath);
  const insideReportsMedia = resolved === reportsMediaRoot || resolved.startsWith(`${reportsMediaRoot}${path.sep}`);
  if (!insideReportsMedia) {
    return {
      ok: false,
      exitCode: 2,
      error: 'Refusing to inspect outside reports/media; runtime asset directories are out of scope.',
      targetDirectory: inputPath,
      reportsMediaRoot: relativeToRepo(reportsMediaRoot)
    };
  }
  if (!fs.existsSync(resolved)) {
    return {
      ok: false,
      exitCode: 1,
      error: 'Target review asset directory does not exist.',
      targetDirectory: relativeToRepo(resolved),
      reportsMediaRoot: relativeToRepo(reportsMediaRoot)
    };
  }
  const stat = fs.statSync(resolved);
  if (!stat.isDirectory()) {
    return {
      ok: false,
      exitCode: 1,
      error: 'Target path is not a directory.',
      targetDirectory: relativeToRepo(resolved),
      reportsMediaRoot: relativeToRepo(reportsMediaRoot)
    };
  }
  return { ok: true, absPath: resolved };
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function parsePng(buffer) {
  if (buffer.length < 33 || !buffer.subarray(0, 8).equals(pngSignature)) {
    return { ok: false, error: 'not_a_png' };
  }

  const chunks = [];
  const idatChunks = [];
  let ihdr = null;
  let hasTransparencyChunk = false;
  let offset = 8;

  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    const nextOffset = dataEnd + 4;

    if (dataEnd > buffer.length || nextOffset > buffer.length) {
      return { ok: false, error: `truncated_chunk_${type}` };
    }

    chunks.push(type);
    if (type === 'IHDR') {
      ihdr = {
        width: buffer.readUInt32BE(dataStart),
        height: buffer.readUInt32BE(dataStart + 4),
        bitDepth: buffer[dataStart + 8],
        colorType: buffer[dataStart + 9],
        compression: buffer[dataStart + 10],
        filter: buffer[dataStart + 11],
        interlace: buffer[dataStart + 12]
      };
    } else if (type === 'IDAT') {
      idatChunks.push(buffer.subarray(dataStart, dataEnd));
    } else if (type === 'tRNS') {
      hasTransparencyChunk = true;
    } else if (type === 'IEND') {
      break;
    }

    offset = nextOffset;
  }

  if (!ihdr) {
    return { ok: false, error: 'missing_ihdr' };
  }

  const color = colorTypes[ihdr.colorType] || {
    label: `unknown_${ihdr.colorType}`,
    channels: null,
    hasAlphaChannel: false
  };

  return {
    ok: true,
    width: ihdr.width,
    height: ihdr.height,
    bitDepth: ihdr.bitDepth,
    colorType: ihdr.colorType,
    colorTypeLabel: color.label,
    channels: color.channels,
    hasAlphaChannel: color.hasAlphaChannel,
    hasTransparencyChunk,
    compression: ihdr.compression,
    filter: ihdr.filter,
    interlace: ihdr.interlace,
    chunks,
    idatChunks
  };
}

function paeth(left, up, upLeft) {
  const p = left + up - upLeft;
  const pa = Math.abs(p - left);
  const pb = Math.abs(p - up);
  const pc = Math.abs(p - upLeft);
  if (pa <= pb && pa <= pc) return left;
  if (pb <= pc) return up;
  return upLeft;
}

function alphaByteForRow(row, colorType, x) {
  if (colorType === 6) return row[(x * 4) + 3];
  if (colorType === 4) return row[(x * 2) + 1];
  return null;
}

function inspectCornerAlpha(buffer, png) {
  if (!png.ok) {
    return { status: 'unavailable', reason: png.error };
  }
  if (!png.hasAlphaChannel && !png.hasTransparencyChunk) {
    return { status: 'no_alpha_channel', reason: 'PNG color type has no direct alpha channel.' };
  }
  if (png.hasTransparencyChunk && !png.hasAlphaChannel) {
    return {
      status: 'manual_review_required',
      reason: 'PNG uses tRNS transparency; palette/keyed transparency corner parsing is intentionally conservative.'
    };
  }
  if (![4, 6].includes(png.colorType) || png.bitDepth !== 8 || png.interlace !== 0) {
    return {
      status: 'manual_review_required',
      reason: 'Corner alpha parser only handles non-interlaced 8-bit grayscale-alpha or RGBA PNGs.'
    };
  }

  const bytesPerPixel = png.colorType === 6 ? 4 : 2;
  const rowBytes = png.width * bytesPerPixel;
  const expectedInflatedBytes = png.height * (rowBytes + 1);
  const maxInflatedBytes = 80 * 1024 * 1024;

  if (expectedInflatedBytes > maxInflatedBytes) {
    return {
      status: 'manual_review_required',
      reason: `Inflated pixel buffer would exceed ${maxInflatedBytes} bytes.`
    };
  }

  let inflated;
  try {
    inflated = zlib.inflateSync(Buffer.concat(png.idatChunks), { finishFlush: zlib.constants.Z_SYNC_FLUSH });
  } catch (error) {
    return { status: 'manual_review_required', reason: `IDAT inflate failed: ${error.message}` };
  }

  if (inflated.length < expectedInflatedBytes) {
    return {
      status: 'manual_review_required',
      reason: `Inflated data shorter than expected ${expectedInflatedBytes} bytes.`
    };
  }

  let previous = new Uint8Array(rowBytes);
  let first = null;
  let last = null;

  for (let y = 0; y < png.height; y += 1) {
    const scanlineOffset = y * (rowBytes + 1);
    const filterType = inflated[scanlineOffset];
    const source = inflated.subarray(scanlineOffset + 1, scanlineOffset + 1 + rowBytes);
    const current = new Uint8Array(rowBytes);

    for (let i = 0; i < rowBytes; i += 1) {
      const raw = source[i];
      const left = i >= bytesPerPixel ? current[i - bytesPerPixel] : 0;
      const up = previous[i] || 0;
      const upLeft = i >= bytesPerPixel ? previous[i - bytesPerPixel] : 0;

      if (filterType === 0) {
        current[i] = raw;
      } else if (filterType === 1) {
        current[i] = (raw + left) & 0xff;
      } else if (filterType === 2) {
        current[i] = (raw + up) & 0xff;
      } else if (filterType === 3) {
        current[i] = (raw + Math.floor((left + up) / 2)) & 0xff;
      } else if (filterType === 4) {
        current[i] = (raw + paeth(left, up, upLeft)) & 0xff;
      } else {
        return { status: 'manual_review_required', reason: `Unsupported PNG filter type ${filterType}.` };
      }
    }

    if (y === 0) first = current.slice();
    if (y === png.height - 1) last = current.slice();
    previous = current;
  }

  const values = {
    topLeft: alphaByteForRow(first, png.colorType, 0),
    topRight: alphaByteForRow(first, png.colorType, png.width - 1),
    bottomLeft: alphaByteForRow(last, png.colorType, 0),
    bottomRight: alphaByteForRow(last, png.colorType, png.width - 1)
  };
  const alphaValues = Object.values(values);
  const transparentCorners = alphaValues.filter((value) => value === 0).length;
  const partiallyTransparentCorners = alphaValues.filter((value) => value > 0 && value < 255).length;
  const opaqueCorners = alphaValues.filter((value) => value === 255).length;

  return {
    status: 'parsed',
    values,
    transparentCorners,
    partiallyTransparentCorners,
    opaqueCorners,
    anyCornerTransparent: alphaValues.some((value) => value < 255),
    allCornersOpaque: alphaValues.every((value) => value === 255)
  };
}

function classifyRole(baseName) {
  if (baseName.includes('.gpt-image-2-source.')) return 'gpt_image_2_source';
  if (baseName.includes('.review-alpha.')) return 'processed_alpha_review';
  if (baseName.includes('.preflight-placeholder.')) return 'preflight_placeholder';
  return 'review_asset';
}

function inspectFile(filePath) {
  const buffer = fs.readFileSync(filePath);
  const png = parsePng(buffer);
  const baseName = path.basename(filePath);
  const role = classifyRole(baseName.toLowerCase());
  const alphaCheck = role === 'processed_alpha_review' || role === 'review_asset'
    ? inspectCornerAlpha(buffer, png)
    : { status: 'not_checked', reason: 'Only processed alpha/review PNGs receive corner alpha checks.' };

  const warnings = [];
  if (!png.ok) {
    warnings.push(`PNG header parse failed: ${png.error}`);
  } else if ((role === 'processed_alpha_review' || role === 'review_asset') && !png.hasAlphaChannel && !png.hasTransparencyChunk) {
    warnings.push('Review PNG has no alpha channel or tRNS transparency chunk.');
  } else if (role === 'processed_alpha_review' && alphaCheck.status === 'parsed' && alphaCheck.allCornersOpaque) {
    warnings.push('Processed alpha PNG has opaque alpha on all four corners; inspect padding/matte manually.');
  } else if (role === 'processed_alpha_review' && alphaCheck.status === 'manual_review_required') {
    warnings.push(`Corner alpha requires manual review: ${alphaCheck.reason}`);
  }

  return {
    file: relativeToRepo(filePath),
    baseName,
    role,
    exists: true,
    sizeBytes: buffer.length,
    sha256: sha256(buffer),
    png: png.ok
      ? {
          width: png.width,
          height: png.height,
          bitDepth: png.bitDepth,
          colorType: png.colorType,
          colorTypeLabel: png.colorTypeLabel,
          channels: png.channels,
          hasAlphaChannel: png.hasAlphaChannel,
          hasTransparencyChunk: png.hasTransparencyChunk,
          interlace: png.interlace
        }
      : { error: png.error },
    cornerAlpha: alphaCheck,
    warnings
  };
}

function matchFilesForSlot(slot, entries) {
  const exact = new Set(slot.exactBaseNames.map((name) => name.toLowerCase()));
  const matches = [];
  const seen = new Set();

  for (const entry of entries) {
    const lower = entry.baseName.toLowerCase();
    if (exact.has(lower) || slot.infer(lower)) {
      matches.push(entry);
      seen.add(entry.absPath);
    }
  }

  return { matches, seen };
}

function compareDimensions(file, expectedDimensions) {
  if (!file.png || file.png.error) return 'unknown';
  return file.png.width === expectedDimensions.width && file.png.height === expectedDimensions.height
    ? 'match'
    : 'mismatch';
}

function run(targetAbsPath) {
  const entries = fs.readdirSync(targetAbsPath, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.png'))
    .map((entry) => ({
      baseName: entry.name,
      absPath: path.join(targetAbsPath, entry.name)
    }))
    .sort((a, b) => a.baseName.localeCompare(b.baseName));

  const inspectedByPath = new Map(entries.map((entry) => [entry.absPath, inspectFile(entry.absPath)]));
  const matchedPaths = new Set();

  const slotResults = slots.map((slot) => {
    const { matches } = matchFilesForSlot(slot, entries);
    const files = matches.map((entry) => inspectedByPath.get(entry.absPath));
    files.forEach((file) => matchedPaths.add(path.join(repoRoot, file.file)));

    const warnings = [];
    const exists = files.length > 0;
    const canonicalAssetFileExists = files.some((file) => file.baseName === slot.assetFile);
    const processedAlphaFileExists = files.some((file) => file.role === 'processed_alpha_review');
    const sourceFileExists = files.some((file) => file.role === 'gpt_image_2_source');

    if (!exists) {
      warnings.push('No matching review/source PNG found yet; current batch may still be in progress.');
    }

    for (const file of files) {
      const dimensionStatus = compareDimensions(file, slot.expectedDimensions);
      file.dimensionStatus = dimensionStatus;
      if (dimensionStatus === 'mismatch') {
        warnings.push(
          `${file.baseName} dimensions ${file.png.width}x${file.png.height} differ from rubric ${slot.expectedDimensions.width}x${slot.expectedDimensions.height}.`
        );
      }
      file.warnings.forEach((warning) => warnings.push(`${file.baseName}: ${warning}`));
    }

    return {
      slotId: slot.slotId,
      expectedAssetFile: slot.assetFile,
      expectedDimensions: slot.expectedDimensions,
      usage: slot.usage,
      existence: {
        anyMappedFileExists: exists,
        canonicalAssetFileExists,
        processedAlphaFileExists,
        sourceFileExists,
        matchedFileCount: files.length
      },
      files,
      status: warnings.length === 0 ? 'pass' : 'warn',
      warnings
    };
  });

  const unmatchedFiles = [...inspectedByPath.values()]
    .filter((file) => !matchedPaths.has(path.join(repoRoot, file.file)));

  const presentSlots = slotResults.filter((slot) => slot.existence.anyMappedFileExists).length;
  const warnSlots = slotResults.filter((slot) => slot.status === 'warn').length;
  const warningCount = slotResults.reduce((total, slot) => total + slot.warnings.length, 0)
    + unmatchedFiles.reduce((total, file) => total + file.warnings.length, 0);
  const processedAlphaFilesFound = [...inspectedByPath.values()].filter((file) => file.role === 'processed_alpha_review').length;
  const sourceFilesFound = [...inspectedByPath.values()].filter((file) => file.role === 'gpt_image_2_source').length;

  return {
    ok: true,
    harness: 'HQ13M generated asset QA harness',
    date: '2026-06-01',
    targetDirectory: relativeToRepo(targetAbsPath),
    rubricSource: 'reports/agent-town-hq13l-generated-asset-review-rubric-2026-06-01.md',
    guardrails: {
      reportsMediaOnly: true,
      runtimeAssetDirectoriesInspected: false,
      mutatesFiles: false,
      dependencies: 'Node built-ins only',
      runtimeAssetPromotion: false,
      runtimePackDirectory: false,
      runtimeLoader: false,
      atlasExecution: false,
      generatedUniverseRendering: false,
      publicSharing: false,
      scoutSectorOnlyCurrentExpeditionMapMutationPath: true
    },
    summary: {
      expectedSlots: slots.length,
      pngFilesFound: inspectedByPath.size,
      presentSlots,
      missingSlots: slots.length - presentSlots,
      processedAlphaFilesFound,
      sourceFilesFound,
      unmatchedPngFiles: unmatchedFiles.length,
      warnSlots,
      passSlots: slots.length - warnSlots,
      warningCount,
      status: warningCount === 0 && presentSlots === slots.length ? 'pass' : 'warn',
      verdict: presentSlots === slots.length && warningCount === 0
        ? 'PASS_ALL_EXPECTED_REVIEW_ASSETS_PRESENT'
        : 'PARTIAL_OR_WARN_REVIEW_INPUT'
    },
    slots: slotResults,
    unmatchedFiles
  };
}

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  console.log(`Usage: node ${relativeToRepo(scriptPath)} [--pretty] [reports/media/<review-asset-dir>]`);
  process.exit(0);
}
if (args.error) {
  console.error(JSON.stringify({ ok: false, error: args.error }, null, 2));
  process.exit(2);
}

const target = resolveTarget(args.target);
if (!target.ok) {
  console.error(JSON.stringify(target, null, 2));
  process.exit(target.exitCode);
}

const result = run(target.absPath);
console.log(JSON.stringify(result, null, args.pretty ? 2 : 0));
