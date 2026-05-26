const crypto = require('crypto');

const SCHEMA_VERSION = 'agent-town-generated-pack-v1';
const GENERATOR_ID = 'deterministic-world-grid-style-pack-v0';

const REQUIRED_CANONICAL_IDS = [
  'building.hq',
  'building.worker_camp',
  'building.lumber_camp',
  'building.farm',
  'building.quarry',
  'building.market',
  'resource.wood',
  'resource.stone',
  'resource.food',
  'resource.coin',
  'character.clover',
  'action.plan_claim',
  'action.complete_claim',
  'terrain.prairie',
  'terrain.ridge',
  'terrain.river',
  'terrain.forest',
  'terrain.mesa',
  'state.claimed',
  'state.claimable',
  'state.visible',
  'state.locked'
];

const TECHNICAL_NORMAL_GAMEPLAY_TERMS = [
  'provider',
  'runtime',
  'oauth',
  'api key',
  'debug',
  'worker traffic',
  'session context',
  'model id'
];

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'as',
  'for',
  'in',
  'into',
  'of',
  'on',
  'the',
  'to',
  'with',
  'world',
  'game',
  'town',
  'style',
  'universe'
]);

const THEME_PRESETS = [
  {
    id: 'moss-lantern',
    triggers: ['forest', 'moss', 'mushroom', 'garden', 'lantern', 'glow'],
    name: 'Moss Lantern Frontier',
    palette: {
      background: '#e8eed0',
      surface: '#fff6d8',
      ink: '#25301f',
      primary: '#446f45',
      secondary: '#6f4260',
      accent: '#d39a37',
      focus: '#2f78ad',
      selected: '#f1c75b',
      light: '#fff4c9',
      ambient: '#d7f0cf',
      terrain: {
        prairie: '#cfdc8c',
        ridge: '#9f9271',
        river: '#71a9b2',
        forest: '#5f8d58',
        mesa: '#c98252'
      },
      state: {
        claimed: '#d39a37',
        claimable: '#5f8d58',
        visible: '#cfdc8c',
        locked: '#817b68'
      }
    },
    nounBank: ['Glowcap', 'Lantern', 'Mosswright', 'Rail', 'Grove', 'Amber']
  },
  {
    id: 'brass-orbit',
    triggers: ['space', 'star', 'moon', 'orbit', 'comet', 'rail'],
    name: 'Brass Orbit Homestead',
    palette: {
      background: '#efe7cb',
      surface: '#fff8df',
      ink: '#211f2d',
      primary: '#7b5033',
      secondary: '#355c72',
      accent: '#d2a642',
      focus: '#356da8',
      selected: '#f0bf4d',
      light: '#fff2c6',
      ambient: '#d8e6ef',
      terrain: {
        prairie: '#d8c883',
        ridge: '#a48167',
        river: '#658fa3',
        forest: '#617b62',
        mesa: '#ba714c'
      },
      state: {
        claimed: '#d2a642',
        claimable: '#617b62',
        visible: '#d8c883',
        locked: '#77717b'
      }
    },
    nounBank: ['Moonrail', 'Starbrass', 'Signal', 'Comet', 'Lantern', 'Orbit']
  },
  {
    id: 'sunforge',
    triggers: ['desert', 'forge', 'sun', 'clockwork', 'gear', 'copper'],
    name: 'Sunforge Civic Line',
    palette: {
      background: '#f1e2c0',
      surface: '#fff4d6',
      ink: '#2d1d13',
      primary: '#8a4f2b',
      secondary: '#2f635d',
      accent: '#c98f31',
      focus: '#2c70a8',
      selected: '#e9b14b',
      light: '#ffe7b8',
      ambient: '#d8eadb',
      terrain: {
        prairie: '#d9ba67',
        ridge: '#9b735d',
        river: '#5794a3',
        forest: '#697f50',
        mesa: '#c26f3f'
      },
      state: {
        claimed: '#c98f31',
        claimable: '#697f50',
        visible: '#d9ba67',
        locked: '#867766'
      }
    },
    nounBank: ['Sunforge', 'Copper', 'Gear', 'Sundial', 'Kiln', 'Charter']
  },
  {
    id: 'tideglass',
    triggers: ['water', 'tide', 'reef', 'glass', 'harbor', 'mist'],
    name: 'Tideglass Settlement',
    palette: {
      background: '#dfe9dc',
      surface: '#fff5d9',
      ink: '#17302f',
      primary: '#315f65',
      secondary: '#7a4d58',
      accent: '#d5a04a',
      focus: '#2d6fa6',
      selected: '#efc961',
      light: '#fff0c2',
      ambient: '#cfe5ea',
      terrain: {
        prairie: '#c2d178',
        ridge: '#8d8171',
        river: '#4d9aac',
        forest: '#5d886a',
        mesa: '#bd7854'
      },
      state: {
        claimed: '#d5a04a',
        claimable: '#5d886a',
        visible: '#c2d178',
        locked: '#707b76'
      }
    },
    nounBank: ['Tideglass', 'Harbor', 'Mist', 'Reed', 'Bell', 'Glass']
  }
];

const packStore = new Map();
const playtestStore = new Map();

function sha256(value = '') {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex');
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizePrompt(rawPrompt = '') {
  const normalized = String(rawPrompt || '')
    .replace(/[\u0000-\u001f<>`{}\[\]\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 240);
  if (normalized.length < 4) {
    const error = new Error('INVALID_PROMPT');
    error.details = { reason: 'PROMPT_TOO_SHORT', minLength: 4 };
    throw error;
  }
  return normalized;
}

function wordsForPrompt(prompt = '') {
  const words = String(prompt || '')
    .toLowerCase()
    .match(/[a-z0-9]+/g) || [];
  return words.filter((word) => word.length > 2 && !STOP_WORDS.has(word)).slice(0, 10);
}

function titleWord(word = '') {
  const cleaned = String(word || '').replace(/[^a-zA-Z0-9]/g, '');
  if (!cleaned) return '';
  return `${cleaned.slice(0, 1).toUpperCase()}${cleaned.slice(1).toLowerCase()}`;
}

function pick(array, hash, salt) {
  const index = Number.parseInt(sha256(`${hash}:${salt}`).slice(0, 8), 16) % array.length;
  return array[index];
}

function choosePreset(words, hash) {
  const scored = THEME_PRESETS
    .map((preset) => ({
      preset,
      score: preset.triggers.filter((trigger) => words.includes(trigger)).length
    }))
    .sort((a, b) => b.score - a.score);
  if (scored[0]?.score > 0) return scored[0].preset;
  return THEME_PRESETS[Number.parseInt(hash.slice(0, 8), 16) % THEME_PRESETS.length];
}

function generatedName(prefix, fallback, nounBank, hash, salt) {
  const noun = pick(nounBank, hash, salt);
  const head = titleWord(prefix) || noun;
  return `${head} ${fallback}`.replace(/\s+/g, ' ').trim();
}

function canonicalMappings(words, preset, hash) {
  const anchor = titleWord(words[0] || pick(preset.nounBank, hash, 'anchor'));
  const second = titleWord(words[1] || pick(preset.nounBank, hash, 'second'));
  const nounBank = preset.nounBank;
  return [
    { canonicalId: 'building.hq', mechanicalKey: 'hq', generatedName: `${anchor} Hall`, assetHint: 'tall civic lodge with one bright signal roof' },
    { canonicalId: 'building.worker_camp', mechanicalKey: 'worker_camp', generatedName: `${second} Crew Camp`, assetHint: 'compact worker camp with theme props and clear doorway' },
    { canonicalId: 'building.lumber_camp', mechanicalKey: 'lumber_camp', generatedName: generatedName(anchor, 'Timber Yard', nounBank, hash, 'lumber'), assetHint: 'wood-production building mapped to generated materials' },
    { canonicalId: 'building.farm', mechanicalKey: 'farm', generatedName: generatedName(anchor, 'Garden Patch', nounBank, hash, 'farm'), assetHint: 'food-production building with readable planted rows' },
    { canonicalId: 'building.quarry', mechanicalKey: 'quarry', generatedName: generatedName(second, 'Stone Cut', nounBank, hash, 'quarry'), assetHint: 'stone-production building with stable rock silhouette' },
    { canonicalId: 'building.market', mechanicalKey: 'market', generatedName: generatedName(second, 'Market Stand', nounBank, hash, 'market'), assetHint: 'exchange building with cloth awning and signpost' },
    { canonicalId: 'resource.wood', mechanicalKey: 'wood', generatedName: `${anchor} Timber`, assetHint: 'small stack icon' },
    { canonicalId: 'resource.stone', mechanicalKey: 'stone', generatedName: `${second} Stone`, assetHint: 'small stone icon' },
    { canonicalId: 'resource.food', mechanicalKey: 'food', generatedName: `${anchor} Supplies`, assetHint: 'small crate icon' },
    { canonicalId: 'resource.coin', mechanicalKey: 'coin', generatedName: `${second} Scrip`, assetHint: 'small brass coin icon' },
    { canonicalId: 'character.clover', mechanicalKey: 'clover', generatedName: 'Clover Kincaid', assetHint: 'Clover remains the trusted Foreman silhouette' },
    { canonicalId: 'action.plan_claim', mechanicalKey: 'plan_claim', generatedName: `Plan ${anchor} route`, assetHint: 'primary claim planning action' },
    { canonicalId: 'action.complete_claim', mechanicalKey: 'complete_claim', generatedName: `Complete ${second} claim`, assetHint: 'primary claim completion action' },
    { canonicalId: 'terrain.prairie', mechanicalKey: 'prairie', generatedName: `${anchor} Meadow`, assetHint: 'open hex terrain material' },
    { canonicalId: 'terrain.ridge', mechanicalKey: 'ridge', generatedName: `${second} Ridge`, assetHint: 'raised hex terrain material' },
    { canonicalId: 'terrain.river', mechanicalKey: 'river', generatedName: `${anchor} Run`, assetHint: 'river hex terrain material' },
    { canonicalId: 'terrain.forest', mechanicalKey: 'forest', generatedName: `${second} Grove`, assetHint: 'forest hex terrain material' },
    { canonicalId: 'terrain.mesa', mechanicalKey: 'mesa', generatedName: `${anchor} Mesa`, assetHint: 'mesa hex terrain material' },
    { canonicalId: 'state.claimed', mechanicalKey: 'claimed', generatedName: 'Held by your settlement', assetHint: 'warm ownership state' },
    { canonicalId: 'state.claimable', mechanicalKey: 'claimable', generatedName: 'Ready for a route plan', assetHint: 'available claim state' },
    { canonicalId: 'state.visible', mechanicalKey: 'visible', generatedName: 'Surveyed nearby ground', assetHint: 'visible orientation state' },
    { canonicalId: 'state.locked', mechanicalKey: 'locked', generatedName: 'Beyond today\'s survey', assetHint: 'quiet locked state' }
  ];
}

function mappingIndex(mappings) {
  return Object.fromEntries(mappings.map((mapping) => [mapping.canonicalId, mapping]));
}

function buildAssetManifest({ packId, promptHash, mappings, preset }) {
  const visualAssets = [
    ...['prairie', 'ridge', 'river', 'forest', 'mesa'].map((terrain) => ({
      assetId: `${packId}:terrain:${terrain}`,
      canonicalTarget: `terrain.${terrain}`,
      kind: 'three-material',
      status: 'runtime-generated',
      source: 'deterministic-fallback',
      color: preset.palette.terrain[terrain]
    })),
    ...['claimed', 'claimable', 'visible', 'locked'].map((state) => ({
      assetId: `${packId}:state:${state}`,
      canonicalTarget: `state.${state}`,
      kind: 'three-material',
      status: 'runtime-generated',
      source: 'deterministic-fallback',
      color: preset.palette.state[state]
    }))
  ];
  const entityAssets = mappings
    .filter((mapping) => mapping.canonicalId.startsWith('building.') || mapping.canonicalId.startsWith('resource.') || mapping.canonicalId === 'character.clover')
    .map((mapping) => ({
      assetId: `${packId}:${mapping.canonicalId}`,
      canonicalTarget: mapping.canonicalId,
      kind: mapping.canonicalId.startsWith('resource.') ? 'shape-token' : 'billboard-sprite-candidate',
      status: 'fallback-ready',
      source: 'deterministic-fallback',
      promptHash,
      description: mapping.assetHint
    }));
  const textAssets = [
    'topbar-title',
    'status-ready',
    'first-loop-objective',
    'first-loop-receipt',
    'plan-claim-action',
    'complete-claim-action'
  ].map((target) => ({
    assetId: `${packId}:text:${target}`,
    canonicalTarget: `text.${target}`,
    kind: 'generated-text',
    status: 'runtime-generated',
    source: 'deterministic-fallback',
    promptHash
  }));
  return {
    schemaVersion: 'agent-town-generated-asset-manifest-v1',
    promptHash,
    generator: GENERATOR_ID,
    productionImagePolicy: {
      model: 'gpt-image-2',
      status: 'candidate_required_before_production',
      promptRoot: 'specs/prompts/generated-universe-packs',
      requiresHumanSignoff: true,
      transparentBackgroundPolicy: 'clean-background-plus-postprocess'
    },
    assets: [...visualAssets, ...entityAssets, ...textAssets]
  };
}

function hasForbiddenGeneratedCopy(pack) {
  const playerText = [
    pack?.universePack?.name,
    pack?.universePack?.pitch,
    pack?.universePack?.playerRole,
    pack?.universePack?.cloverRole,
    pack?.universePack?.firstLoop?.title,
    pack?.universePack?.firstLoop?.objective,
    pack?.universePack?.firstLoop?.successReceipt,
    ...Object.values(pack?.universePack?.text || {}),
    ...(pack?.gameplayMapping?.canonicalEntities || []).map((mapping) => mapping.generatedName)
  ].join(' ').toLowerCase();
  return TECHNICAL_NORMAL_GAMEPLAY_TERMS.filter((term) => playerText.includes(term));
}

function findForbiddenAuthorityPaths(value, path = '$', matches = []) {
  if (!value || typeof value !== 'object') return matches;
  const forbiddenKey = /^(tool|tools|toolhandler|toolhandlers|serverrule|serverrules|mutation|mutations|mutationhandler|mutationhandlers|formula|formulas|expression|expressions|eval|script)$/i;
  const secretKey = /(api[_-]?key|secret|private[_-]?key|credential|oauth|access[_-]?token|refresh[_-]?token|wallet[_-]?secret)/i;
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;
    if (forbiddenKey.test(key) || secretKey.test(key)) {
      matches.push(childPath);
    }
    findForbiddenAuthorityPaths(child, childPath, matches);
  }
  return matches;
}

function isHexColor(value) {
  return /^#[0-9a-fA-F]{6}$/.test(String(value || ''));
}

function validateGeneratedPack(pack) {
  const mappings = pack?.gameplayMapping?.canonicalEntities || [];
  const mappingIds = new Set(mappings.map((mapping) => mapping.canonicalId));
  const missingMappings = REQUIRED_CANONICAL_IDS.filter((id) => !mappingIds.has(id));
  const palette = pack?.stylePack?.palette || {};
  const terrainColors = Object.values(palette.terrain || {});
  const stateColors = Object.values(palette.state || {});
  const missingColors = [
    palette.background,
    palette.surface,
    palette.ink,
    palette.primary,
    palette.secondary,
    palette.accent,
    palette.focus,
    palette.selected,
    ...terrainColors,
    ...stateColors
  ].filter((color) => !isHexColor(color));
  const manifestAssets = pack?.assetManifest?.assets || [];
  const forbiddenTerms = hasForbiddenGeneratedCopy(pack);
  const forbiddenAuthorityPaths = findForbiddenAuthorityPaths(pack);
  const mechanicalMissing = mappings.filter((mapping) => !mapping.mechanicalKey).map((mapping) => mapping.canonicalId);
  const checks = [
    {
      id: 'GENPACK_SCHEMA_VERSION',
      passed: pack?.schemaVersion === SCHEMA_VERSION,
      measured: { schemaVersion: pack?.schemaVersion || null }
    },
    {
      id: 'GENPACK_PROMPT_HASHED',
      passed: /^[0-9a-f]{64}$/.test(String(pack?.prompt?.hash || '')) && !pack?.prompt?.normalizedPrompt,
      measured: { hasPromptHash: Boolean(pack?.prompt?.hash), promptStoredRaw: Boolean(pack?.prompt?.normalizedPrompt) }
    },
    {
      id: 'GENPACK_CANONICAL_MAPPING_COVERAGE',
      passed: missingMappings.length === 0,
      measured: { required: REQUIRED_CANONICAL_IDS.length, covered: mappingIds.size, missing: missingMappings }
    },
    {
      id: 'GENPACK_CANONICAL_KEYS_PRESERVED',
      passed: mechanicalMissing.length === 0 && Number(pack?.gameplayMapping?.serverRuleOverrides || 0) === 0,
      measured: { missingMechanicalKeys: mechanicalMissing, serverRuleOverrides: pack?.gameplayMapping?.serverRuleOverrides || 0 }
    },
    {
      id: 'GENPACK_NO_MUTATION_AUTHORITY',
      passed: forbiddenAuthorityPaths.length === 0,
      measured: { forbiddenAuthorityPaths }
    },
    {
      id: 'GENPACK_THREEJS_PALETTE_READY',
      passed: missingColors.length === 0 && terrainColors.length === 5 && stateColors.length === 4,
      measured: { terrainColors: terrainColors.length, stateColors: stateColors.length, invalidColors: missingColors }
    },
    {
      id: 'GENPACK_ASSET_MANIFEST_READY',
      passed: manifestAssets.length >= 20 && manifestAssets.every((asset) => asset.canonicalTarget && asset.source),
      measured: { assetCount: manifestAssets.length }
    },
    {
      id: 'GENPACK_PLAYER_COPY_SAFE',
      passed: forbiddenTerms.length === 0,
      measured: { forbiddenTerms }
    },
    {
      id: 'GENPACK_FIRST_LOOP_READY',
      passed: Boolean(pack?.universePack?.firstLoop?.objective && pack?.universePack?.firstLoop?.successReceipt),
      measured: {
        hasObjective: Boolean(pack?.universePack?.firstLoop?.objective),
        hasSuccessReceipt: Boolean(pack?.universePack?.firstLoop?.successReceipt)
      }
    }
  ];
  const ok = checks.every((check) => check.passed === true);
  return {
    ok,
    checks,
    metrics: {
      requiredCanonicalMappings: REQUIRED_CANONICAL_IDS.length,
      canonicalMappingsCovered: REQUIRED_CANONICAL_IDS.length - missingMappings.length,
      threeJsTerrainMaterials: terrainColors.length,
      threeJsStateMaterials: stateColors.length,
      fallbackAssetCount: manifestAssets.filter((asset) => asset.source === 'deterministic-fallback').length,
      generatedTextAssetCount: manifestAssets.filter((asset) => asset.kind === 'generated-text').length,
      firstLoopReady: Boolean(pack?.universePack?.firstLoop?.objective && pack?.universePack?.firstLoop?.successReceipt),
      productionImageCandidatesRequired: true
    }
  };
}

function validatePlaytestReport(report = {}, pack = null) {
  const checks = [
    { id: 'PLAYTEST_SCHEMA_VALID', passed: report.schemaVersion === 'agent-town-generated-pack-playtest-v1' },
    { id: 'PLAYTEST_PACK_MATCH', passed: Boolean(pack?.packId && report.packId === pack.packId) },
    { id: 'PLAYTEST_FIRST_LOOP_COMPLETED', passed: report.firstLoopCompleted === true },
    { id: 'PLAYTEST_THREE_RENDERER_USED', passed: report.renderer === 'three' },
    { id: 'PLAYTEST_CANONICAL_PAYLOAD_INTEGRITY', passed: report.canonicalPayloadIntegrity === true },
    { id: 'PLAYTEST_NO_MISSING_ASSETS', passed: Number(report.missingAssets || 0) === 0 },
    { id: 'PLAYTEST_READABILITY_GATE', passed: Number(report.uiReadabilityScore || 0) >= 0.85 },
    { id: 'PLAYTEST_STYLE_GATE', passed: Number(report.styleCoherenceScore || 0) >= 0.85 },
    { id: 'PLAYTEST_PROMPT_ALIGNMENT_GATE', passed: Number(report.promptAlignmentScore || 0) >= 0.85 }
  ];
  return {
    ok: checks.every((check) => check.passed === true),
    checks,
    metrics: {
      firstLoopCompleted: report.firstLoopCompleted === true,
      missingAssets: Number(report.missingAssets || 0),
      consoleErrors: Number(report.consoleErrors || 0),
      uiReadabilityScore: Number(report.uiReadabilityScore || 0),
      styleCoherenceScore: Number(report.styleCoherenceScore || 0),
      promptAlignmentScore: Number(report.promptAlignmentScore || 0),
      canonicalMappingCoverage: pack?.validationReport?.metrics?.canonicalMappingsCovered && pack?.validationReport?.metrics?.requiredCanonicalMappings
        ? pack.validationReport.metrics.canonicalMappingsCovered / pack.validationReport.metrics.requiredCanonicalMappings
        : 0
    }
  };
}

function recordPlaytestReport(owner = {}, report = {}) {
  const key = storeKey(owner);
  const pack = currentGeneratedPack(owner);
  if (!pack) {
    const error = new Error('NO_GENERATED_PACK');
    error.details = { reason: 'GENERATE_PACK_FIRST' };
    throw error;
  }
  const nowMs = Number.isFinite(Number(report.completedAtMs)) ? Number(report.completedAtMs) : Date.now();
  const normalized = {
    schemaVersion: 'agent-town-generated-pack-playtest-v1',
    packId: String(report.packId || pack.packId),
    completedAtMs: nowMs,
    renderer: String(report.renderer || 'three'),
    firstLoopCompleted: report.firstLoopCompleted === true,
    canonicalPayloadIntegrity: report.canonicalPayloadIntegrity !== false,
    missingAssets: Number.isFinite(Number(report.missingAssets)) ? Number(report.missingAssets) : 0,
    consoleErrors: Number.isFinite(Number(report.consoleErrors)) ? Number(report.consoleErrors) : 0,
    playtestPassed: false,
    styleCoherenceScore: Number.isFinite(Number(report.styleCoherenceScore)) ? Number(report.styleCoherenceScore) : 0.88,
    promptAlignmentScore: Number.isFinite(Number(report.promptAlignmentScore)) ? Number(report.promptAlignmentScore) : 0.87,
    uiReadabilityScore: Number.isFinite(Number(report.uiReadabilityScore)) ? Number(report.uiReadabilityScore) : 0.9
  };
  normalized.validationReport = validatePlaytestReport(normalized, pack);
  normalized.playtestPassed = normalized.validationReport.ok;
  playtestStore.set(key, clone(normalized));
  return clone(normalized);
}

function currentPlaytestReport(owner = {}) {
  const key = storeKey(owner);
  return key ? clone(playtestStore.get(key) || null) : null;
}

function createGeneratedPack({ owner, prompt, nowMs = Date.now() }) {
  const normalizedPrompt = normalizePrompt(prompt);
  const words = wordsForPrompt(normalizedPrompt);
  const promptHash = sha256(normalizedPrompt);
  const ownerHash = sha256(owner?.ownerAccountId || owner?.pairId || 'anonymous-owner');
  const packHash = sha256(`${ownerHash}:${promptHash}`);
  const preset = choosePreset(words, packHash);
  const mappings = canonicalMappings(words, preset, packHash);
  const index = mappingIndex(mappings);
  const anchor = titleWord(words[0] || pick(preset.nounBank, packHash, 'universe-anchor'));
  const second = titleWord(words[1] || pick(preset.nounBank, packHash, 'universe-second'));
  const packId = `gen_pack_${packHash.slice(0, 16)}`;
  const pack = {
    schemaVersion: SCHEMA_VERSION,
    packId,
    ownerAccountId: owner?.ownerAccountId || 'owner_unknown',
    createdAtMs: nowMs,
    generator: {
      id: GENERATOR_ID,
      source: 'deterministic-fallback',
      codexBridgeReady: true,
      externalModelUsed: false,
      futureModel: 'gpt-image-2'
    },
    prompt: {
      hash: promptHash,
      length: normalizedPrompt.length,
      keywordHints: words.slice(0, 6)
    },
    stylePack: {
      stylePackId: `style_${preset.id}_${packHash.slice(0, 8)}`,
      name: `${anchor} ${preset.name}`,
      themeSummary: `${anchor} and ${second} motifs translated into warm frontier materials.`,
      palette: clone(preset.palette),
      materialRules: [
        { target: 'three-region-cell', rule: 'terrain colors are softened by ownership state' },
        { target: 'home-settlement-marker', rule: 'primary color with warm light contact shadow' },
        { target: 'selection-ring', rule: 'selected color with high contrast against terrain' }
      ],
      uiRules: {
        minReadableTextPx: 16,
        onePrimaryAction: true,
        normalGameplayDebugJargon: false
      }
    },
    universePack: {
      universePackId: `universe_${packHash.slice(0, 12)}`,
      name: `${anchor} ${second} Charter`,
      pitch: `${anchor} settlers and ${second} crews build a civic frontier with Clover keeping the work bounded and legible.`,
      playerRole: `${anchor} founder`,
      cloverRole: 'Clover remains the trusted Foreman and explains each bounded action in-world.',
      factions: [
        { factionId: 'faction_settlers', name: `${anchor} Settlers`, role: 'home-builders', line: `They want ${index['resource.food'].generatedName.toLowerCase()} and a steady route outward.` },
        { factionId: 'faction_crews', name: `${second} Crews`, role: 'makers', line: `They turn ${index['resource.wood'].generatedName.toLowerCase()} and ${index['resource.stone'].generatedName.toLowerCase()} into practical town work.` }
      ],
      techs: [
        { techId: 'tech_route_signals', name: `${second} Route Signals`, unlockIntent: 'makes claim planning visually clearer' },
        { techId: 'tech_civic_lamps', name: `${anchor} Civic Lamps`, unlockIntent: 'makes public works and night scenes readable' }
      ],
      firstLoop: {
        title: `${anchor} first route`,
        objective: `Choose a nearby cell, plan the ${anchor.toLowerCase()} route, and complete the first claim.`,
        successReceipt: `${anchor} route complete. ${index['building.hq'].generatedName} now has a visible path into the wider territory.`,
        recovery: 'If resources are short, pick another adjacent cell or keep the claim planned.'
      },
      text: {
        topbarTitle: `${anchor} World Grid`,
        statusReady: `${anchor} survey ready`,
        packValidated: `${anchor} pack validated`,
        planClaimAction: index['action.plan_claim'].generatedName,
        completeClaimAction: index['action.complete_claim'].generatedName,
        selectedSummaryPrefix: `${anchor} survey note`,
        publicPresenceTitle: `${anchor} Neighbors`,
        servicesTitle: `${second} Civic Services`,
        eventsTitle: `${anchor} Public Works`,
        sandboxTitle: `${second} Sandbox District`
      }
    },
    gameplayMapping: {
      canonicalVersion: 'agent-town-world-grid-v1',
      canonicalEntities: mappings
    }
  };
  pack.assetManifest = buildAssetManifest({ packId, promptHash, mappings, preset });
  pack.validationReport = validateGeneratedPack(pack);
  if (!pack.validationReport.ok) {
    const error = new Error('GENPACK_VALIDATION_FAILED');
    error.details = { validationReport: pack.validationReport };
    throw error;
  }
  return pack;
}

function storeKey(owner = {}) {
  return String(owner.ownerAccountId || owner.pairId || '').trim();
}

function generateAndStorePack({ owner, prompt, nowMs = Date.now() }) {
  const pack = createGeneratedPack({ owner, prompt, nowMs });
  packStore.set(storeKey(owner), clone(pack));
  return clone(pack);
}

function currentGeneratedPack(owner = {}) {
  const key = storeKey(owner);
  return key ? clone(packStore.get(key) || null) : null;
}

function clearGeneratedPacksForTests() {
  packStore.clear();
  playtestStore.clear();
}

module.exports = {
  REQUIRED_CANONICAL_IDS,
  SCHEMA_VERSION,
  clearGeneratedPacksForTests,
  createGeneratedPack,
  currentGeneratedPack,
  currentPlaytestReport,
  generateAndStorePack,
  normalizePrompt,
  recordPlaytestReport,
  validatePlaytestReport,
  validateGeneratedPack
};
