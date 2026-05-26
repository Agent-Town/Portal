const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const {
  DEFAULT_CANDIDATE_ROOT,
  validateAssetPromptPlan,
  validateGeneratedPack
} = require('./generated_pack');
const {
  validateGeneratedSchema
} = require('./generated_schema');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const SCHEMA_DIR = path.join(REPO_ROOT, 'schemas', 'generated-packs');
const ASSET_POSTPROCESS_PLAN_VERSION = 'agent-town-asset-postprocess-plan-v1';
const ASSET_POSTPROCESS_REPORT_VERSION = 'agent-town-asset-postprocess-report-v1';
const ATLAS_MAX_WIDTH = 4096;
const TARGET_BUDGET_BYTES = {
  'terrain-texture': 220_000,
  'building-billboard': 180_000,
  'resource-icon': 120_000,
  'character-sprite': 180_000,
  'ui-ornament': 80_000,
  postcard: 480_000
};

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function slugForTarget(value = '') {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'asset';
}

function relativePackPath(...parts) {
  return parts
    .map((part) => String(part || '').replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/');
}

function isSafeRelativePath(value = '') {
  const text = String(value || '').trim();
  return Boolean(text)
    && !path.isAbsolute(text)
    && !/^https?:\/\//i.test(text)
    && !/^data:/i.test(text)
    && !text.split(/[\\/]+/).some((part) => part === '..');
}

function repoPathForRelativePath(relativePath) {
  if (!isSafeRelativePath(relativePath)) {
    const error = new Error('INVALID_ASSET_POSTPROCESS_PATH');
    error.details = { relativePath };
    throw error;
  }
  const resolved = path.resolve(REPO_ROOT, relativePath);
  if (!resolved.startsWith(`${REPO_ROOT}${path.sep}`)) {
    const error = new Error('INVALID_ASSET_POSTPROCESS_PATH');
    error.details = { relativePath };
    throw error;
  }
  return resolved;
}

function replaceExtension(relativePath, extension) {
  return String(relativePath || '').replace(/\.[a-z0-9]+$/i, extension);
}

function budgetForTarget(target = {}) {
  return TARGET_BUDGET_BYTES[target.targetKind] || 180_000;
}

function packAtlasFrames(targets = []) {
  let cursorX = 0;
  let cursorY = 0;
  let rowHeight = 0;
  return targets.map((target) => {
    const width = Number(target?.targetSize?.width || 512);
    const height = Number(target?.targetSize?.height || 512);
    if (cursorX > 0 && cursorX + width > ATLAS_MAX_WIDTH) {
      cursorX = 0;
      cursorY += rowHeight;
      rowHeight = 0;
    }
    const frame = { x: cursorX, y: cursorY, width, height };
    cursorX += width;
    rowHeight = Math.max(rowHeight, height);
    return frame;
  });
}

function inspectImageHeader(relativePath) {
  const fullPath = repoPathForRelativePath(relativePath);
  if (!fs.existsSync(fullPath)) {
    return { exists: false, format: 'missing', byteSize: 0, width: 0, height: 0, hasAlpha: false };
  }
  const buffer = fs.readFileSync(fullPath);
  const stat = fs.statSync(fullPath);
  const pngSignature = '89504e470d0a1a0a';
  if (buffer.length >= 26 && buffer.subarray(0, 8).toString('hex') === pngSignature) {
    const colorType = buffer.readUInt8(25);
    return {
      exists: true,
      format: 'png',
      byteSize: stat.size,
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
      hasAlpha: colorType === 4 || colorType === 6
    };
  }
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') {
    return { exists: true, format: 'webp', byteSize: stat.size, width: 0, height: 0, hasAlpha: false };
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { exists: true, format: 'jpeg', byteSize: stat.size, width: 0, height: 0, hasAlpha: false };
  }
  return { exists: true, format: 'unknown', byteSize: stat.size, width: 0, height: 0, hasAlpha: false };
}

function transparentBackgroundPolicyFor({ imageInfo, target }) {
  const alphaPreferred = ['building-billboard', 'resource-icon', 'character-sprite', 'ui-ornament'].includes(target.targetKind);
  if (!alphaPreferred) {
    return {
      status: 'not_required',
      handledBy: 'opaque-or-material-target'
    };
  }
  if (imageInfo.hasAlpha) {
    return {
      status: 'preserved_alpha',
      handledBy: 'source_alpha_channel'
    };
  }
  return {
    status: 'clean_background_postprocess_required',
    handledBy: 'clean-background-plus-postprocess-policy'
  };
}

function buildGeneratedAssetPostprocessPlan({
  assetPromptPlan,
  pack,
  nowMs = Date.now(),
  postprocessRoot
} = {}) {
  const planSource = assetPromptPlan || pack?.assetPromptPlan || {};
  const packId = planSource.packId || pack?.packId || '';
  const candidateRoot = planSource.candidateRoot || DEFAULT_CANDIDATE_ROOT;
  const outputRoot = postprocessRoot || relativePackPath(candidateRoot, packId, 'postprocessed');
  const targets = Array.isArray(planSource.targets) ? planSource.targets : [];
  const frames = packAtlasFrames(targets);
  const postprocessTargets = targets.map((target, index) => {
    const slug = slugForTarget(target.canonicalTarget);
    const processedOutputPath = relativePackPath(outputRoot, 'candidates', `${slug}.candidate.webp`);
    return {
      canonicalTarget: target.canonicalTarget,
      promptId: target.promptId,
      promptHash: target.promptHash,
      promptPlanHash: planSource.planHash || '',
      targetKind: target.targetKind,
      targetSize: target.targetSize,
      candidateInputPath: target.candidateOutputPath,
      processedOutputPath,
      pngFallbackOutputPath: replaceExtension(processedOutputPath, '.png'),
      promotionOutputPath: target.approvedOutputPath,
      usagePath: target.usagePath,
      fallbackAssetId: target.fallbackAssetId,
      visualManifestSidecarPath: relativePackPath(outputRoot, 'sidecars', `${slug}.sidecar.json`),
      atlasFrame: frames[index],
      maxBytes: budgetForTarget(target),
      outputFormat: 'webp',
      cropPolicy: 'contain-center-no-upscale',
      resizePolicy: 'fit-within-target-size-preserve-aspect',
      alphaPolicy: 'preserve-alpha-or-clean-background-postprocess'
    };
  });
  const plan = {
    schemaVersion: ASSET_POSTPROCESS_PLAN_VERSION,
    packId,
    promptHash: planSource.promptHash || pack?.prompt?.hash || '',
    promptPlanHash: planSource.planHash || '',
    createdAtMs: nowMs,
    candidateRoot,
    postprocessRoot: outputRoot,
    textureAtlasPath: relativePackPath(outputRoot, 'atlas', 'generated-asset-atlas.json'),
    textureAtlasImagePath: relativePackPath(outputRoot, 'atlas', 'generated-asset-atlas.webp'),
    visualManifestPath: relativePackPath(outputRoot, 'visual-manifest.generated-assets.json'),
    budget: {
      maxAtlasWidth: ATLAS_MAX_WIDTH,
      totalBudgetBytes: postprocessTargets.reduce((sum, target) => sum + target.maxBytes, 0)
    },
    pipeline: {
      crop: 'contain-center-no-upscale',
      resize: 'fit-within-target-size-preserve-aspect',
      alpha: 'preserve-alpha-or-clean-background-postprocess',
      conversion: 'webp-primary-png-fallback',
      packing: 'deterministic-shelf-atlas-metadata'
    },
    targets: postprocessTargets
  };
  plan.planHash = sha256(JSON.stringify({
    packId: plan.packId,
    promptPlanHash: plan.promptPlanHash,
    targets: postprocessTargets.map((target) => ({
      canonicalTarget: target.canonicalTarget,
      candidateInputPath: target.candidateInputPath,
      processedOutputPath: target.processedOutputPath,
      atlasFrame: target.atlasFrame
    }))
  }));
  return plan;
}

function writeJson(relativePath, value) {
  const fullPath = repoPathForRelativePath(relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function outputStats(relativePath) {
  const fullPath = repoPathForRelativePath(relativePath);
  if (!fs.existsSync(fullPath)) return { exists: false, byteSize: 0 };
  return { exists: true, byteSize: fs.statSync(fullPath).size };
}

async function processOneTarget({ converter, pack, plan, target }) {
  const imageInfo = inspectImageHeader(target.candidateInputPath);
  const transparentBackgroundPolicy = transparentBackgroundPolicyFor({ imageInfo, target });
  if (!imageInfo.exists) {
    return {
      status: 'fallback-ready',
      fallbackUsed: true,
      reason: 'candidate-missing',
      outputPath: '',
      outputByteSize: 0,
      imageInfo,
      transparentBackgroundPolicy
    };
  }
  if (!['png', 'webp', 'jpeg'].includes(imageInfo.format)) {
    return {
      status: 'fallback-ready',
      fallbackUsed: true,
      reason: 'unsupported-candidate-format',
      outputPath: '',
      outputByteSize: 0,
      imageInfo,
      transparentBackgroundPolicy
    };
  }
  if (typeof converter !== 'function') {
    return {
      status: 'fallback-ready',
      fallbackUsed: true,
      reason: 'postprocess-adapter-not-configured',
      outputPath: '',
      outputByteSize: 0,
      imageInfo,
      transparentBackgroundPolicy
    };
  }
  fs.mkdirSync(path.dirname(repoPathForRelativePath(target.processedOutputPath)), { recursive: true });
  let conversionResult;
  try {
    conversionResult = await converter({
      pack,
      plan,
      target,
      sourcePath: target.candidateInputPath,
      sourcePathAbs: repoPathForRelativePath(target.candidateInputPath),
      outputPath: target.processedOutputPath,
      outputPathAbs: repoPathForRelativePath(target.processedOutputPath),
      pngFallbackOutputPath: target.pngFallbackOutputPath,
      targetSize: target.targetSize
    });
  } catch {
    return {
      status: 'fallback-ready',
      fallbackUsed: true,
      reason: 'postprocess-conversion-failed',
      outputPath: '',
      outputByteSize: 0,
      imageInfo,
      transparentBackgroundPolicy
    };
  }
  const outputPath = String(conversionResult?.outputPath || target.processedOutputPath);
  if (outputPath !== target.processedOutputPath || !isSafeRelativePath(outputPath)) {
    return {
      status: 'fallback-ready',
      fallbackUsed: true,
      reason: 'invalid-processed-output-path',
      outputPath: '',
      outputByteSize: 0,
      imageInfo,
      transparentBackgroundPolicy
    };
  }
  const stats = outputStats(outputPath);
  if (!stats.exists) {
    return {
      status: 'fallback-ready',
      fallbackUsed: true,
      reason: 'processed-output-missing',
      outputPath: '',
      outputByteSize: 0,
      imageInfo,
      transparentBackgroundPolicy
    };
  }
  if (stats.byteSize > target.maxBytes) {
    return {
      status: 'fallback-ready',
      fallbackUsed: true,
      reason: 'asset-budget-exceeded',
      outputPath,
      outputByteSize: stats.byteSize,
      imageInfo,
      transparentBackgroundPolicy
    };
  }
  return {
    status: 'postprocessed-candidate',
    fallbackUsed: false,
    reason: 'processed',
    outputPath,
    outputByteSize: stats.byteSize,
    outputSize: {
      width: Number(conversionResult?.width || target.targetSize?.width || 0),
      height: Number(conversionResult?.height || target.targetSize?.height || 0)
    },
    imageInfo,
    transparentBackgroundPolicy
  };
}

async function runGeneratedAssetPostprocessPlan(plan, {
  converter,
  nowMs = Date.now(),
  pack
} = {}) {
  const packValidation = validateGeneratedPack(pack || {});
  const promptPlanValidation = validateAssetPromptPlan(pack?.assetPromptPlan || {}, pack || {});
  const targetResults = [];
  for (const target of plan.targets || []) {
    const result = await processOneTarget({ converter, pack, plan, target });
    const sidecar = {
      schemaVersion: 'agent-town-asset-postprocess-sidecar-v1',
      packId: plan.packId,
      canonicalTarget: target.canonicalTarget,
      promptHash: target.promptHash,
      promptPlanHash: target.promptPlanHash,
      postprocessPlanHash: plan.planHash,
      status: result.status,
      reason: result.reason,
      fallbackUsed: result.fallbackUsed,
      fallbackAssetId: target.fallbackAssetId,
      candidateInputPath: target.candidateInputPath,
      processedOutputPath: result.outputPath,
      promotionOutputPath: target.promotionOutputPath,
      approvedProductionAssetCreated: false,
      outputByteSize: result.outputByteSize,
      outputSize: result.outputSize || target.targetSize,
      targetSize: target.targetSize,
      atlasFrame: target.atlasFrame,
      transparentBackgroundPolicy: result.transparentBackgroundPolicy,
      createdAtMs: nowMs
    };
    writeJson(target.visualManifestSidecarPath, sidecar);
    targetResults.push({ ...sidecar, sidecarPath: target.visualManifestSidecarPath });
  }
  const atlas = {
    schemaVersion: 'agent-town-generated-asset-atlas-v1',
    packId: plan.packId,
    postprocessPlanHash: plan.planHash,
    atlasImagePath: plan.textureAtlasImagePath,
    atlasImageStatus: 'metadata-only-until-approved-candidates',
    frames: targetResults.map((result) => ({
      canonicalTarget: result.canonicalTarget,
      status: result.status,
      fallbackAssetId: result.fallbackAssetId,
      outputPath: result.processedOutputPath,
      frame: result.atlasFrame
    }))
  };
  const visualManifest = {
    schemaVersion: 'agent-town-generated-visual-manifest-v1',
    packId: plan.packId,
    postprocessPlanHash: plan.planHash,
    generatedAtMs: nowMs,
    approvedProductionAssetCount: 0,
    assets: targetResults.map((result) => ({
      canonicalTarget: result.canonicalTarget,
      status: result.status,
      fallbackUsed: result.fallbackUsed,
      outputPath: result.processedOutputPath,
      promotionOutputPath: result.promotionOutputPath,
      sidecarPath: result.sidecarPath
    }))
  };
  writeJson(plan.textureAtlasPath, atlas);
  writeJson(plan.visualManifestPath, visualManifest);

  const processedCount = targetResults.filter((result) => result.status === 'postprocessed-candidate').length;
  const fallbackCount = targetResults.filter((result) => result.fallbackUsed).length;
  const missingCandidateCount = targetResults.filter((result) => result.reason === 'candidate-missing').length;
  const budgetExceededCount = targetResults.filter((result) => result.reason === 'asset-budget-exceeded').length;
  const report = {
    schemaVersion: ASSET_POSTPROCESS_REPORT_VERSION,
    packId: plan.packId,
    postprocessPlanHash: plan.planHash,
    createdAtMs: nowMs,
    status: processedCount > 0 && budgetExceededCount === 0 ? 'postprocessed-candidates-ready' : 'fallback-ready',
    targetCount: targetResults.length,
    processedCandidateOutputCount: processedCount,
    fallbackCount,
    missingCandidateCount,
    failedOutputCount: targetResults.filter((result) => result.reason !== 'processed' && result.reason !== 'candidate-missing').length,
    assetBudgetPassed: budgetExceededCount === 0,
    budgetExceededCount,
    spriteAtlasMetadataExists: fs.existsSync(repoPathForRelativePath(plan.textureAtlasPath)),
    visualManifestSidecarExists: fs.existsSync(repoPathForRelativePath(plan.visualManifestPath)),
    transparentBackgroundPolicyHandled: targetResults.every((result) => result.transparentBackgroundPolicy?.status !== 'unhandled'),
    fallbackOnAssetFailure: fallbackCount > 0,
    approvedProductionAssetCount: 0,
    approvedProductionAssetsCreated: false,
    generatedImageAssetsCanChangeServerRules: false,
    packValidationPassed: packValidation.ok,
    assetPromptPlanValidationPassed: promptPlanValidation.ok,
    textureAtlasPath: plan.textureAtlasPath,
    visualManifestPath: plan.visualManifestPath,
    targetResults
  };
  return report;
}

function schema(filename) {
  return JSON.parse(fs.readFileSync(path.join(SCHEMA_DIR, filename), 'utf8'));
}

function validateAssetPostprocessPlan(plan = {}) {
  const result = validateGeneratedSchema(plan, schema('asset_postprocess_plan.schema.json'), '$.assetPostprocessPlan');
  return { ok: result.ok, errors: result.errors };
}

function validateAssetPostprocessReport(report = {}) {
  const result = validateGeneratedSchema(report, schema('asset_postprocess_report.schema.json'), '$.assetPostprocessReport');
  return { ok: result.ok, errors: result.errors };
}

module.exports = {
  ASSET_POSTPROCESS_PLAN_VERSION,
  ASSET_POSTPROCESS_REPORT_VERSION,
  buildGeneratedAssetPostprocessPlan,
  inspectImageHeader,
  runGeneratedAssetPostprocessPlan,
  validateAssetPostprocessPlan,
  validateAssetPostprocessReport
};
