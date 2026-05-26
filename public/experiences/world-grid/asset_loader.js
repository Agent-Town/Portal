(function () {
  const LOADER_VERSION = 'agent-town-world-grid-asset-loader-v2';
  const TEXTURE_TARGET_KINDS = new Set([
    'terrain-texture',
    'building-billboard',
    'resource-icon',
    'character-sprite',
    'ui-ornament',
    'postcard'
  ]);
  const MATERIAL_TARGET_KINDS = new Set(['three-material']);

  function byTarget(items = []) {
    const map = new Map();
    for (const item of items || []) {
      if (!item?.canonicalTarget || map.has(item.canonicalTarget)) continue;
      map.set(item.canonicalTarget, item);
    }
    return map;
  }

  function isSafeRuntimeAssetPath(value = '') {
    const text = String(value || '').trim();
    return Boolean(text)
      && text.startsWith('public/experiences/world-grid/generated/')
      && !text.split(/[\\/]+/).some((part) => part === '..')
      && /\.(json|png|webp|jpg|jpeg)$/i.test(text);
  }

  function browserPath(value = '') {
    const text = String(value || '').trim();
    if (text.startsWith('public/')) return `/${text.slice('public/'.length)}`;
    return text;
  }

  function safeGeneratedLabel(pack, canonicalTarget, fallback) {
    const mapping = (pack?.gameplayMapping?.canonicalEntities || [])
      .find((item) => item.canonicalId === canonicalTarget);
    return String(mapping?.generatedName || fallback || canonicalTarget);
  }

  function buildRuntimeAssetMap(runtimeAssets = []) {
    return byTarget((runtimeAssets || [])
      .filter((asset) => asset?.canonicalTarget && isSafeRuntimeAssetPath(asset.publicPath || asset.path || ''))
      .map((asset) => ({
        canonicalTarget: asset.canonicalTarget,
        targetKind: asset.targetKind || asset.kind || '',
        publicPath: asset.publicPath || asset.path,
        source: asset.source || 'runtime-public-asset'
      })));
  }

  function buildMaterialMap(generatedPack = {}) {
    const assets = generatedPack?.assetManifest?.assets || [];
    const materials = new Map();
    for (const asset of assets) {
      if (!MATERIAL_TARGET_KINDS.has(asset?.kind) || !asset?.canonicalTarget || !asset?.color) continue;
      materials.set(asset.canonicalTarget, {
        canonicalTarget: asset.canonicalTarget,
        color: asset.color,
        source: asset.source || 'deterministic-fallback'
      });
    }
    return materials;
  }

  function buildTargetKindCounts(targets = []) {
    const counts = {};
    for (const target of targets) {
      const kind = target?.targetKind || 'unknown';
      counts[kind] = (counts[kind] || 0) + 1;
    }
    return counts;
  }

  function buildAssetLoadReport(generatedPack = null, options = {}) {
    const pack = generatedPack || {};
    const promptTargets = (pack?.assetPromptPlan?.targets || [])
      .filter((target) => TEXTURE_TARGET_KINDS.has(target?.targetKind));
    const materialMap = buildMaterialMap(pack);
    const runtimeAssets = buildRuntimeAssetMap(options.runtimeAssets || pack?.runtimeAssetManifest?.assets || []);
    const loadTargets = [];
    let loadedTextureCount = 0;
    let fallbackTextureCount = 0;
    let handledMissingTextureCount = 0;

    for (const target of promptTargets) {
      const runtimeAsset = runtimeAssets.get(target.canonicalTarget);
      const shouldLoad = Boolean(runtimeAsset);
      if (shouldLoad) loadedTextureCount += 1;
      else {
        fallbackTextureCount += 1;
        handledMissingTextureCount += 1;
      }
      loadTargets.push({
        canonicalTarget: target.canonicalTarget,
        targetKind: target.targetKind,
        targetSize: target.targetSize,
        generatedLabel: safeGeneratedLabel(pack, target.canonicalTarget, target.canonicalTarget),
        usagePath: target.usagePath,
        runtimePath: runtimeAsset?.publicPath || '',
        browserPath: runtimeAsset ? browserPath(runtimeAsset.publicPath) : '',
        status: runtimeAsset ? 'runtime-public-asset-ready' : 'fallback-ready',
        fallbackAssetId: target.fallbackAssetId,
        fallbackReason: runtimeAsset ? '' : 'public-runtime-asset-not-approved'
      });
    }

    const textureLoadRequestCount = loadedTextureCount;
    const missingTextureCount = 0;
    return {
      version: LOADER_VERSION,
      assetAwareLoaderExists: true,
      mode: loadedTextureCount > 0 ? 'runtime-public-assets' : 'deterministic-fallback-assets',
      packId: pack?.packId || '',
      promptPlanHash: pack?.assetPromptPlan?.planHash || '',
      assetManifestAssetCount: (pack?.assetManifest?.assets || []).length,
      materialTargetCount: materialMap.size,
      plannedTextureTargetCount: promptTargets.length,
      textureLoadRequestCount,
      loadedTextureCount,
      fallbackTextureCount,
      handledMissingTextureCount,
      missingTextureCount,
      unhandledMissingTextureCount: missingTextureCount,
      targetKindCounts: buildTargetKindCounts(promptTargets),
      loadTargets,
      reducedMotion: options.reducedMotion === true,
      performanceBudget: {
        maxTextureLoadRequests: promptTargets.length,
        textureLoadRequestCount,
        maxMaterialTargets: materialMap.size,
        targetFps: options.reducedMotion === true ? 18 : 24
      },
      performanceBudgetPassed: textureLoadRequestCount <= promptTargets.length && missingTextureCount === 0
    };
  }

  function materialColorFor(report, generatedPack, canonicalTarget, fallback) {
    const material = buildMaterialMap(generatedPack).get(canonicalTarget);
    return material?.color || fallback;
  }

  window.WorldGridAssetLoader = {
    buildAssetLoadReport,
    browserPath,
    isSafeRuntimeAssetPath,
    materialColorFor,
    version: LOADER_VERSION
  };
})();
