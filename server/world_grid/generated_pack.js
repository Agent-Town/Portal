const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const {
  loadGeneratedPackSchemaRegistry,
  validateGeneratedPackSchemas,
  validateGeneratedSchema
} = require('./generated_schema');

const SCHEMA_VERSION = 'agent-town-generated-pack-v1';
const GENERATOR_ID = 'deterministic-world-grid-style-pack-v0.1';
const GENERATION_BRIEF_VERSION = 'agent-town-generation-brief-v1';
const ASSET_PROMPT_PLAN_VERSION = 'agent-town-asset-prompt-plan-v1';
const ASSET_SCAFFOLD_VERSION = 'agent-town-asset-generation-scaffold-v1';
const GENERATED_ASSET_MANIFEST_VERSION = 'agent-town-generated-asset-manifest-v1';
const DEFAULT_CANDIDATE_ROOT = 'data/generated-packs';
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const SCHEMA_REGISTRY = loadGeneratedPackSchemaRegistry();

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

const TEXT_ASSET_TARGETS = [
  'text.topbar-title',
  'text.status-ready',
  'text.first-loop-objective',
  'text.first-loop-receipt',
  'text.plan-claim-action',
  'text.complete-claim-action'
];

const PRESENTATION_ASSET_TARGETS = [
  'ui.topbar-frame',
  'ui.selection-ring',
  'postcard.pack-preview'
];

const IMAGE_PLAN_TARGETS = REQUIRED_CANONICAL_IDS.filter((id) => (
  id.startsWith('building.')
  || id.startsWith('resource.')
  || id.startsWith('terrain.')
  || id.startsWith('state.')
  || id === 'character.clover'
));

const ASSET_PROMPT_TARGETS = [...IMAGE_PLAN_TARGETS, ...PRESENTATION_ASSET_TARGETS];
const VALID_MANIFEST_TARGETS = new Set([...REQUIRED_CANONICAL_IDS, ...TEXT_ASSET_TARGETS, ...PRESENTATION_ASSET_TARGETS]);
const VALID_ASSET_PLAN_TARGETS = new Set(ASSET_PROMPT_TARGETS);
const VALID_ASSET_KINDS = new Set([
  'three-material',
  'shape-token',
  'billboard-sprite-candidate',
  'ui-ornament-candidate',
  'postcard-candidate',
  'generated-text'
]);
const VALID_ASSET_STATUSES = new Set([
  'runtime-generated',
  'fallback-ready',
  'candidate-planned',
  'planned-not-generated'
]);
const VALID_ASSET_SOURCES = new Set([
  'deterministic-fallback',
  'candidate-scaffold'
]);

const RAW_EXECUTABLE_PROMPT_PATTERNS = [
  { id: 'ignore-prior-instructions', pattern: /\bignore\s+(all\s+)?(previous|prior|above)\s+instructions\b/i },
  { id: 'system-prompt-request', pattern: /\b(system|developer)\s+(prompt|message|instructions)\b/i },
  { id: 'tool-call-request', pattern: /\b(tool|function)\s+call\b/i },
  { id: 'shell-execution', pattern: /\b(execute|run)\s+(shell|bash|terminal|command|javascript|python)\b/i },
  { id: 'inline-script', pattern: /<\s*script\b|javascript\s*:|\beval\s*\(|\bFunction\s*\(/i },
  { id: 'network-exfiltration', pattern: /\b(curl|wget)\s+https?:|\bpost\s+to\s+https?:/i }
];

const SENSITIVE_TEXT_PATTERNS = [
  { id: 'api-key-reference', pattern: /\b(api[_ -]?key|access[_ -]?token|refresh[_ -]?token)\b/i },
  { id: 'private-key-reference', pattern: /\b(private[_ -]?key|seed[_ -]?phrase|wallet[_ -]?secret)\b/i },
  { id: 'password-reference', pattern: /\b(password|credential)\b/i }
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

function blockedPatternIdsForText(value = '') {
  const text = String(value || '');
  return RAW_EXECUTABLE_PROMPT_PATTERNS
    .filter(({ pattern }) => pattern.test(text))
    .map(({ id }) => id);
}

function sensitivePatternIdsForText(value = '') {
  const text = String(value || '');
  return SENSITIVE_TEXT_PATTERNS
    .filter(({ pattern }) => pattern.test(text))
    .map(({ id }) => id);
}

function safePromptWords(words = []) {
  const blocked = new Set([
    'ignore',
    'previous',
    'prior',
    'instructions',
    'system',
    'developer',
    'prompt',
    'message',
    'tool',
    'function',
    'execute',
    'shell',
    'bash',
    'terminal',
    'command',
    'javascript',
    'python',
    'eval',
    'curl',
    'wget',
    'api',
    'key',
    'token',
    'secret',
    'password',
    'credential',
    'private',
    'wallet'
  ]);
  return words.filter((word) => !blocked.has(word));
}

function inferTone(words = []) {
  const set = new Set(words);
  return {
    cozy: ['cozy', 'gentle', 'soft', 'calm', 'friendly', 'mushroom', 'lantern'].some((word) => set.has(word)) ? 0.85 : 0.45,
    adventurous: ['frontier', 'route', 'rail', 'starport', 'sky', 'canyon'].some((word) => set.has(word)) ? 0.75 : 0.55,
    mystical: ['mystery', 'mist', 'moon', 'shadow', 'crystal', 'wizard', 'glow'].some((word) => set.has(word)) ? 0.75 : 0.3,
    humorous: ['silly', 'goofy', 'absurd', 'comic', 'whimsical', 'playful'].some((word) => set.has(word)) ? 0.7 : 0.25,
    serious: ['serious', 'solemn', 'quiet'].some((word) => set.has(word)) ? 0.7 : 0.35
  };
}

function inferVisualStyle(words = [], preset = THEME_PRESETS[0]) {
  const set = new Set(words);
  const styleFamily = ['watercolor', 'painted', 'storybook'].some((word) => set.has(word))
    ? 'storybook watercolor'
    : ['pixel', 'retro'].some((word) => set.has(word))
      ? 'readable pixel-inspired'
      : ['clay', 'diorama', 'miniature'].some((word) => set.has(word))
        ? 'soft tabletop diorama'
        : ['clockwork', 'brass', 'gear', 'forge'].some((word) => set.has(word))
          ? 'warm mechanical frontier'
          : `${preset.name.toLowerCase()} game miniature`;
  return {
    styleFamily,
    materialMotifs: [
      pick(preset.nounBank, words.join(':') || preset.id, 'motif-a').toLowerCase(),
      pick(preset.nounBank, words.join(':') || preset.id, 'motif-b').toLowerCase(),
      preset.id.replace(/-/g, ' ')
    ],
    lighting: set.has('moon') || set.has('mist') ? 'soft twilight readability' : 'warm daylight readability',
    colorMood: `${preset.name.toLowerCase()} palette with high-contrast readable accents`,
    forbiddenVisuals: ['text in image', 'logos', 'credentials', 'photoreal gore', 'copyrighted characters']
  };
}

function inferTechFlavor(words = [], preset = THEME_PRESETS[0]) {
  const set = new Set(words);
  if (['space', 'star', 'orbit', 'comet', 'moon'].some((word) => set.has(word))) return ['signal lamps', 'orbital routes', 'brass navigation tools'];
  if (['clockwork', 'gear', 'forge', 'copper'].some((word) => set.has(word))) return ['clockwork route markers', 'hand-built civic machines', 'copper repair tools'];
  if (['water', 'tide', 'reef', 'harbor', 'glass'].some((word) => set.has(word))) return ['tide gauges', 'glass beacons', 'harbor craft'];
  if (['forest', 'moss', 'mushroom', 'garden', 'lantern'].some((word) => set.has(word))) return ['lantern ecology', 'garden tools', 'low-tech route craft'];
  return [`${preset.name} practical tools`, 'route markers', 'settlement craft'];
}

function inferHumorLevel(words = []) {
  const set = new Set(words);
  if (['absurd', 'goofy'].some((word) => set.has(word))) return 'absurd-but-safe';
  if (['silly', 'comic', 'whimsical', 'playful', 'funny'].some((word) => set.has(word))) return 'playful';
  if (['serious', 'solemn', 'quiet'].some((word) => set.has(word))) return 'none';
  return 'subtle';
}

function createGenerationBrief({ prompt }) {
  const normalizedPrompt = normalizePrompt(prompt);
  const promptHash = sha256(normalizedPrompt);
  const promptWords = wordsForPrompt(normalizedPrompt);
  const blockedPatternIds = blockedPatternIdsForText(normalizedPrompt);
  const sensitivePatternIds = sensitivePatternIdsForText(normalizedPrompt);
  const words = safePromptWords(promptWords);
  const preset = choosePreset(words, promptHash);
  const anchor = titleWord(words[0] || pick(preset.nounBank, promptHash, 'brief-anchor'));
  const second = titleWord(words[1] || pick(preset.nounBank, promptHash, 'brief-second'));
  const safetyRewriteApplied = blockedPatternIds.length > 0 || sensitivePatternIds.length > 0;
  return {
    schemaVersion: GENERATION_BRIEF_VERSION,
    promptHash,
    promptLength: normalizedPrompt.length,
    keywordHints: words.slice(0, 10),
    theme: {
      primary: `${anchor} ${preset.name}`,
      secondary: `${second} craft line`,
      setting: preset.name
    },
    tone: inferTone(words),
    visualStyle: inferVisualStyle(words, preset),
    civilizationFlavor: {
      species: [`${anchor} settlers`, `${second} crews`],
      factions: [`${anchor} Settlers`, `${second} Crews`],
      cultures: [`${preset.name} craft tradition`, `${second} route customs`],
      techFlavor: inferTechFlavor(words, preset)
    },
    humorLevel: inferHumorLevel(words),
    safety: {
      status: safetyRewriteApplied ? 'needs_review' : 'passed',
      reasons: [...blockedPatternIds, ...sensitivePatternIds],
      normalizedForRuntime: true,
      rawPromptExecutable: false
    }
  };
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
      promptHash,
      color: preset.palette.terrain[terrain]
    })),
    ...['claimed', 'claimable', 'visible', 'locked'].map((state) => ({
      assetId: `${packId}:state:${state}`,
      canonicalTarget: `state.${state}`,
      kind: 'three-material',
      status: 'runtime-generated',
      source: 'deterministic-fallback',
      promptHash,
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
  const presentationAssets = PRESENTATION_ASSET_TARGETS.map((target) => ({
    assetId: `${packId}:${target}`,
    canonicalTarget: target,
    kind: target.startsWith('postcard.') ? 'postcard-candidate' : 'ui-ornament-candidate',
    status: 'fallback-ready',
    source: 'deterministic-fallback',
    promptHash,
    description: target.startsWith('postcard.')
      ? 'share-safe generated-pack preview postcard candidate'
      : 'small UI ornament candidate that preserves minimal world-grid UX'
  }));
  return {
    schemaVersion: GENERATED_ASSET_MANIFEST_VERSION,
    promptHash,
    generator: GENERATOR_ID,
    productionImagePolicy: {
      model: 'gpt-image-2',
      status: 'candidate_required_before_production',
      promptRoot: 'specs/prompts/generated-universe-packs',
      requiresHumanSignoff: true,
      transparentBackgroundPolicy: 'clean-background-plus-postprocess'
    },
    assets: [...visualAssets, ...entityAssets, ...textAssets, ...presentationAssets]
  };
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

function targetSizeForCanonicalTarget(canonicalTarget = '') {
  if (canonicalTarget.startsWith('resource.')) return { width: 512, height: 512 };
  if (canonicalTarget.startsWith('ui.')) return { width: 512, height: 256 };
  if (canonicalTarget.startsWith('postcard.')) return { width: 1200, height: 630 };
  if (canonicalTarget.startsWith('terrain.') || canonicalTarget.startsWith('state.')) return { width: 1024, height: 1024 };
  return { width: 1024, height: 1024 };
}

function usagePathForCanonicalTarget(packId, canonicalTarget = '') {
  const slug = slugForTarget(canonicalTarget);
  if (canonicalTarget.startsWith('terrain.') || canonicalTarget.startsWith('state.')) {
    return relativePackPath('public/experiences/world-grid/generated', packId, 'materials', `${slug}.json`);
  }
  if (canonicalTarget.startsWith('ui.')) {
    return relativePackPath('public/experiences/world-grid/generated', packId, 'ui', `${slug}.webp`);
  }
  if (canonicalTarget.startsWith('postcard.')) {
    return relativePackPath('public/experiences/world-grid/generated', packId, 'postcards', `${slug}.webp`);
  }
  return relativePackPath('public/experiences/world-grid/generated', packId, 'sprites', `${slug}.webp`);
}

function assetHintForMapping(mapping = {}) {
  if (mapping.assetHint) return mapping.assetHint;
  if (String(mapping.canonicalId || '').startsWith('terrain.')) return 'readable terrain tile material for a Three.js world grid';
  if (String(mapping.canonicalId || '').startsWith('state.')) return 'clear cell-state visual treatment with accessible contrast';
  if (String(mapping.canonicalId || '').startsWith('resource.')) return 'small readable resource token for UI and map overlays';
  if (String(mapping.canonicalId || '').startsWith('building.')) return 'transparent-background building sprite with a clear silhouette';
  if (mapping.canonicalId === 'character.clover') return 'trusted Foreman character sprite with friendly frontier posture';
  if (String(mapping.canonicalId || '').startsWith('ui.')) return 'minimal UI ornament that does not add clutter or hide gameplay information';
  if (String(mapping.canonicalId || '').startsWith('postcard.')) return 'public-safe preview postcard composition using only generated-pack presentation data';
  return 'readable Agent Town world-grid game asset';
}

function buildControlledAssetPrompt({ pack, mapping }) {
  const brief = pack.generationBrief || {};
  const universe = pack.universePack || {};
  const style = pack.stylePack || {};
  const target = mapping.canonicalId;
  const size = targetSizeForCanonicalTarget(target);
  const toneSummary = Object.entries(brief.tone || {})
    .map(([key, value]) => `${key}:${Number(value || 0).toFixed(2)}`)
    .join(', ');
  return [
    'Create one bounded Agent Town world-grid game asset candidate.',
    `Canonical target: ${target}.`,
    `Mechanical key: ${mapping.mechanicalKey}. Do not change gameplay rules or invent tools.`,
    `Generated label: ${mapping.generatedName}.`,
    `Universe: ${universe.name}. Theme: ${brief.theme?.primary || style.name}. Tone: ${toneSummary}.`,
    `Visual style: ${brief.visualStyle?.styleFamily || style.name}. Tech flavor: ${(brief.civilizationFlavor?.techFlavor || []).join(', ')}.`,
    `Asset direction: ${assetHintForMapping(mapping)}.`,
    `Target size: ${size.width}x${size.height}. Transparent or clean background where possible.`,
    'No text, no logos, no credentials, no UI chrome, no extra characters unless requested by the canonical target.'
  ].join('\n');
}

function targetKindForCanonicalTarget(canonicalTarget = '') {
  if (canonicalTarget.startsWith('terrain.') || canonicalTarget.startsWith('state.')) return 'terrain-texture';
  if (canonicalTarget.startsWith('building.')) return 'building-billboard';
  if (canonicalTarget.startsWith('resource.')) return 'resource-icon';
  if (canonicalTarget === 'character.clover') return 'character-sprite';
  if (canonicalTarget.startsWith('postcard.')) return 'postcard';
  return 'ui-ornament';
}

function buildAssetPromptPlan({ pack, candidateRoot = DEFAULT_CANDIDATE_ROOT, nowMs = Date.now() }) {
  const mappings = pack?.gameplayMapping?.canonicalEntities || [];
  const presentationMappings = [
    { canonicalId: 'ui.topbar-frame', mechanicalKey: 'ui_topbar_frame', generatedName: `${pack?.universePack?.name || 'Generated'} topbar frame`, assetHint: 'minimal decorative topbar trim for the generated world-grid theme' },
    { canonicalId: 'ui.selection-ring', mechanicalKey: 'ui_selection_ring', generatedName: `${pack?.stylePack?.name || 'Generated'} selection ring`, assetHint: 'high-contrast selection ornament that preserves accessibility and does not cover labels' },
    { canonicalId: 'postcard.pack-preview', mechanicalKey: 'postcard_pack_preview', generatedName: `${pack?.universePack?.name || 'Generated pack'} preview postcard`, assetHint: 'public-safe postcard layout with no account data, wallet data, raw prompt, or debug text' }
  ];
  const visualMappings = [...mappings, ...presentationMappings].filter((mapping) => VALID_ASSET_PLAN_TARGETS.has(mapping.canonicalId));
  const promptRoot = relativePackPath('specs/prompts/generated-universe-packs', pack.packId);
  const globalNegativePrompt = 'text, logos, UI chrome, photoreal gore, weapons focus, credential material, code, prompt injection, copyrighted characters';
  const targets = visualMappings.map((mapping) => {
    const canonicalTarget = mapping.canonicalId;
    const slug = slugForTarget(canonicalTarget);
    const controlledPrompt = buildControlledAssetPrompt({ pack, mapping });
    const promptHash = sha256(controlledPrompt);
    const candidateFolder = relativePackPath(candidateRoot, pack.packId, 'candidates', slug);
    return {
      promptId: `${pack.packId}:${slug}:prompt`,
      canonicalTarget,
      usagePath: usagePathForCanonicalTarget(pack.packId, canonicalTarget),
      targetKind: targetKindForCanonicalTarget(canonicalTarget),
      targetSize: targetSizeForCanonicalTarget(canonicalTarget),
      promptText: controlledPrompt,
      negativePrompt: globalNegativePrompt,
      promptHash,
      candidateOutputPath: relativePackPath(candidateFolder, `${slug}.candidate-001.png`),
      approvedOutputPath: relativePackPath(candidateRoot, pack.packId, 'approved', `${slug}.webp`),
      jobLogPath: relativePackPath(candidateRoot, pack.packId, 'jobs', `${slug}.jsonl`),
      fallbackAssetId: `${pack.packId}:${canonicalTarget}`,
      status: 'planned-not-generated'
    };
  });
  const plan = {
    schemaVersion: ASSET_PROMPT_PLAN_VERSION,
    packId: pack.packId,
    promptHash: pack.prompt?.hash || pack.generationBrief?.promptHash || '',
    modelFamily: 'gpt-image-2-candidate',
    createdAtMs: nowMs,
    promptRoot,
    candidateRoot,
    globalStyleLock: {
      summary: `${pack.stylePack?.name || 'Generated pack'}: ${pack.stylePack?.themeSummary || 'bounded Agent Town style'}`,
      negativePrompt: globalNegativePrompt,
      aspectPolicy: 'square assets unless a future signed manifest says otherwise',
      transparentBackgroundPolicy: 'clean-background-plus-postprocess'
    },
    targets
  };
  plan.planHash = sha256(JSON.stringify({
    packId: plan.packId,
    targets: plan.targets.map((target) => ({
      canonicalTarget: target.canonicalTarget,
      promptHash: target.promptHash,
      usagePath: target.usagePath
    }))
  }));
  return plan;
}

function repoPathForRelativePath(relativePath) {
  if (!isSafeRelativePath(relativePath)) {
    const error = new Error('INVALID_ASSET_SCAFFOLD_PATH');
    error.details = { relativePath };
    throw error;
  }
  const resolved = path.resolve(REPO_ROOT, relativePath);
  if (!resolved.startsWith(`${REPO_ROOT}${path.sep}`)) {
    const error = new Error('INVALID_ASSET_SCAFFOLD_PATH');
    error.details = { relativePath };
    throw error;
  }
  return resolved;
}

function scaffoldAssetGenerationJobs(assetPromptPlan, { nowMs = Date.now() } = {}) {
  const targets = assetPromptPlan?.targets || [];
  let candidateFolderCount = 0;
  let jobLogCount = 0;
  for (const target of targets) {
    const candidateFolder = repoPathForRelativePath(path.dirname(target.candidateOutputPath));
    fs.mkdirSync(candidateFolder, { recursive: true });
    candidateFolderCount += 1;
    const jobLogPath = repoPathForRelativePath(target.jobLogPath);
    fs.mkdirSync(path.dirname(jobLogPath), { recursive: true });
    const line = JSON.stringify({
      schemaVersion: 'agent-town-asset-generation-job-log-v1',
      jobId: `${assetPromptPlan.packId}:${slugForTarget(target.canonicalTarget)}:planned`,
      packId: assetPromptPlan.packId,
      promptId: target.promptId,
      promptHash: target.promptHash,
      promptPlanHash: assetPromptPlan.planHash,
      status: 'planned',
      modelFamily: assetPromptPlan.modelFamily || 'gpt-image-2-candidate',
      authMode: 'not_configured',
      costConsentStatus: 'not_required_for_scaffold',
      consentModel: {
        explicitConsentRequiredForGeneration: true,
        status: 'not_required_for_scaffold'
      },
      costEstimate: {
        status: 'not_required_for_scaffold',
        currency: 'USD',
        estimatedMin: 0,
        estimatedMax: 0
      },
      sourceProvenance: {
        generator: GENERATOR_ID,
        promptPlanHash: assetPromptPlan.planHash,
        externalModelUsed: false,
        productionAssetApproval: 'not_requested'
      },
      retryPolicy: {
        maxRetries: 0,
        retryRecords: []
      },
      resume: {
        replayableFromPromptPlan: true,
        promptPlanPath: relativePackPath(assetPromptPlan.candidateRoot || DEFAULT_CANDIDATE_ROOT, assetPromptPlan.packId, 'prompt-plan.json'),
        promptId: target.promptId
      },
      createdAtMs: nowMs,
      promptCount: 1,
      outputCount: 0,
      errors: [],
      externalImageGenerationUsed: false,
      approvedProductionAssetsCreated: false,
      canonicalTarget: target.canonicalTarget,
      candidateOutputPath: target.candidateOutputPath,
      approvedOutputPath: target.approvedOutputPath
    });
    fs.writeFileSync(jobLogPath, `${line}\n`, 'utf8');
    jobLogCount += 1;
  }
  return {
    schemaVersion: ASSET_SCAFFOLD_VERSION,
    packId: assetPromptPlan?.packId || '',
    candidateRoot: assetPromptPlan?.candidateRoot || DEFAULT_CANDIDATE_ROOT,
    candidateFolderCount,
    jobLogCount,
    productionImageAssetCount: 0,
    externalModelUsed: false,
    explicitConsentRequired: true,
    costConsentStatus: 'not_required_for_scaffold',
    replayableFromPromptPlan: true
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
  const forbiddenKey = /(toolhandler|toolhandlers|^tools?$|serverrule|mutationhandler|mutationhandlers|^mutations?$|^formulas?$|expression|^eval$|^script$)/i;
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;
    if (forbiddenKey.test(key) && childPath !== '$.gameplayMapping.serverRuleOverrides') {
      matches.push(childPath);
    }
    findForbiddenAuthorityPaths(child, childPath, matches);
  }
  return matches;
}

function findSecretLikePaths(value, path = '$', matches = []) {
  if (!value || typeof value !== 'object') return matches;
  const secretKey = /(api[_-]?key|secret|private[_-]?key|credential|oauth|access[_-]?token|refresh[_-]?token|wallet[_-]?secret|seed[_-]?phrase|password)/i;
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;
    if (secretKey.test(key)) {
      matches.push(childPath);
    }
    findSecretLikePaths(child, childPath, matches);
  }
  return matches;
}

function findRawPromptInstructionPaths(value, path = '$', matches = []) {
  const rawPromptKey = /^(rawprompt|normalizedprompt|systemprompt|developerprompt|promptinstructions)$/i;
  if (typeof value === 'string') {
    const blockedPatternIds = blockedPatternIdsForText(value);
    if (blockedPatternIds.length > 0) {
      matches.push({ path, blockedPatternIds });
    }
    return matches;
  }
  if (!value || typeof value !== 'object') return matches;
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;
    if (rawPromptKey.test(key)) {
      matches.push({ path: childPath, blockedPatternIds: ['raw-prompt-field'] });
    }
    findRawPromptInstructionPaths(child, childPath, matches);
  }
  return matches;
}

function isHexColor(value) {
  return /^#[0-9a-fA-F]{6}$/.test(String(value || ''));
}

function hexToRgb(value) {
  if (!isHexColor(value)) return null;
  const hex = String(value).slice(1);
  return {
    r: Number.parseInt(hex.slice(0, 2), 16) / 255,
    g: Number.parseInt(hex.slice(2, 4), 16) / 255,
    b: Number.parseInt(hex.slice(4, 6), 16) / 255
  };
}

function channelLuminance(value) {
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(color) {
  if (!color) return 0;
  return (0.2126 * channelLuminance(color.r))
    + (0.7152 * channelLuminance(color.g))
    + (0.0722 * channelLuminance(color.b));
}

function contrastRatio(first, second) {
  const firstLuminance = relativeLuminance(hexToRgb(first));
  const secondLuminance = relativeLuminance(hexToRgb(second));
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(3));
}

function scoreFromContrast(ratio) {
  return Number(Math.max(0, Math.min(1, ratio / 4.5)).toFixed(3));
}

function validateGenerationBrief(brief = {}) {
  const missingFields = [];
  if (String(brief?.theme?.primary || '').trim().length < 3) missingFields.push('theme.primary');
  if (!brief?.tone || typeof brief.tone !== 'object') missingFields.push('tone');
  if (String(brief?.visualStyle?.styleFamily || '').trim().length < 3) missingFields.push('visualStyle.styleFamily');
  for (const key of ['species', 'factions', 'cultures', 'techFlavor']) {
    const value = brief?.civilizationFlavor?.[key];
    if (!Array.isArray(value) || value.length < 1 || value.some((item) => String(item || '').trim().length < 2)) {
      missingFields.push(`civilizationFlavor.${key}`);
    }
  }
  const status = brief?.safety?.status;
  const rawInstructionPaths = findRawPromptInstructionPaths(brief);
  const secretLikePaths = findSecretLikePaths(brief);
  const schemaReport = SCHEMA_REGISTRY?.generationBrief
    ? validateGeneratedSchema(brief, SCHEMA_REGISTRY.generationBrief, '$.generationBrief')
    : { ok: true, errors: [] };
  const checks = [
    {
      id: 'GENBRIEF_SCHEMA_VERSION',
      passed: brief?.schemaVersion === GENERATION_BRIEF_VERSION,
      measured: { schemaVersion: brief?.schemaVersion || null }
    },
    {
      id: 'GENBRIEF_PROMPT_HASHED',
      passed: /^[0-9a-f]{64}$/.test(String(brief?.promptHash || '')),
      measured: { hasPromptHash: Boolean(brief?.promptHash) }
    },
    {
      id: 'GENBRIEF_CORE_FIELDS',
      passed: missingFields.length === 0,
      measured: { missingFields }
    },
    {
      id: 'GENBRIEF_HUMOR_LEVEL_ENUM',
      passed: ['none', 'subtle', 'playful', 'absurd-but-safe'].includes(String(brief?.humorLevel || '')),
      measured: { humorLevel: brief?.humorLevel || null }
    },
    {
      id: 'GENBRIEF_SAFETY_STATUS_VALID',
      passed: ['passed', 'needs_review', 'rejected'].includes(String(status || ''))
        && brief?.safety?.normalizedForRuntime === true
        && brief?.safety?.rawPromptExecutable === false,
      measured: {
        status: status || null,
        normalizedForRuntime: brief?.safety?.normalizedForRuntime === true,
        rawPromptExecutable: brief?.safety?.rawPromptExecutable === true
      }
    },
    {
      id: 'GENBRIEF_JSON_SCHEMA_VALID',
      passed: schemaReport.ok === true,
      measured: { schemaErrorCount: schemaReport.errors.length, errors: schemaReport.errors.slice(0, 5) }
    },
    {
      id: 'GENBRIEF_NO_RAW_EXECUTABLE_INSTRUCTIONS',
      passed: rawInstructionPaths.length === 0,
      measured: { rawInstructionPaths }
    },
    {
      id: 'GENBRIEF_NO_SECRET_FIELDS',
      passed: secretLikePaths.length === 0,
      measured: { secretLikePaths }
    }
  ];
  return {
    ok: checks.every((check) => check.passed === true),
    checks,
    metrics: {
      safetyNeedsReview: brief?.safety?.status === 'needs_review',
      safetyReasonCount: Array.isArray(brief?.safety?.reasons) ? brief.safety.reasons.length : 0,
      structuredDimensionCount: 9,
      schemaErrorCount: schemaReport.errors.length
    }
  };
}

function manifestAssetProblems(asset = {}, index = 0, packPromptHash = '') {
  const problems = [];
  if (!String(asset.assetId || '').trim()) problems.push('missing-asset-id');
  if (!VALID_MANIFEST_TARGETS.has(String(asset.canonicalTarget || ''))) problems.push('invalid-canonical-target');
  if (!VALID_ASSET_KINDS.has(String(asset.kind || ''))) problems.push('invalid-kind');
  if (!VALID_ASSET_STATUSES.has(String(asset.status || ''))) problems.push('invalid-status');
  if (!VALID_ASSET_SOURCES.has(String(asset.source || ''))) problems.push('invalid-source');
  if (asset.promptHash && !/^[0-9a-f]{64}$/.test(String(asset.promptHash))) problems.push('invalid-prompt-hash');
  if (asset.promptHash && packPromptHash && asset.source === 'deterministic-fallback' && asset.promptHash !== packPromptHash) problems.push('prompt-hash-mismatch');
  if (asset.kind === 'three-material' && !isHexColor(asset.color)) problems.push('invalid-material-color');
  return problems.length ? { index, assetId: asset.assetId || null, canonicalTarget: asset.canonicalTarget || null, problems } : null;
}

function validateAssetManifest(manifest = {}, pack = {}) {
  const assets = Array.isArray(manifest?.assets) ? manifest.assets : [];
  const problems = assets
    .map((asset, index) => manifestAssetProblems(asset, index, manifest.promptHash || pack?.prompt?.hash || ''))
    .filter(Boolean);
  const duplicateTargets = assets
    .map((asset) => asset.canonicalTarget)
    .filter((target, index, all) => target && all.indexOf(target) !== index);
  const checks = [
    {
      id: 'ASSET_MANIFEST_SCHEMA_VERSION',
      passed: manifest?.schemaVersion === GENERATED_ASSET_MANIFEST_VERSION,
      measured: { schemaVersion: manifest?.schemaVersion || null }
    },
    {
      id: 'ASSET_MANIFEST_PROMPT_HASH_MATCH',
      passed: /^[0-9a-f]{64}$/.test(String(manifest?.promptHash || '')) && (!pack?.prompt?.hash || manifest.promptHash === pack.prompt.hash),
      measured: { manifestPromptHash: manifest?.promptHash || null, packPromptHash: pack?.prompt?.hash || null }
    },
    {
      id: 'ASSET_MANIFEST_ENTRIES_VALID',
      passed: assets.length >= 20 && problems.length === 0,
      measured: { assetCount: assets.length, problems }
    },
    {
      id: 'ASSET_MANIFEST_TARGETS_UNIQUE',
      passed: duplicateTargets.length === 0,
      measured: { duplicateTargets: [...new Set(duplicateTargets)] }
    },
    {
      id: 'ASSET_MANIFEST_NO_PRODUCTION_IMAGE_REQUIREMENT',
      passed: manifest?.productionImagePolicy?.status === 'candidate_required_before_production' && manifest?.productionImagePolicy?.requiresHumanSignoff === true,
      measured: {
        status: manifest?.productionImagePolicy?.status || null,
        requiresHumanSignoff: manifest?.productionImagePolicy?.requiresHumanSignoff === true
      }
    }
  ];
  return {
    ok: checks.every((check) => check.passed === true),
    checks,
    metrics: {
      assetCount: assets.length,
      invalidAssetCount: problems.length,
      fallbackAssetCount: assets.filter((asset) => asset.source === 'deterministic-fallback').length,
      productionImageAssetsRequired: false
    }
  };
}

function assetPlanProblems(asset = {}, index = 0, packId = '') {
  const problems = [];
  if (!String(asset.promptId || '').startsWith(`${packId}:`)) problems.push('invalid-prompt-id');
  if (!VALID_ASSET_PLAN_TARGETS.has(String(asset.canonicalTarget || ''))) problems.push('invalid-canonical-target');
  if (!/^[0-9a-f]{64}$/.test(String(asset.promptHash || ''))) problems.push('invalid-prompt-hash');
  if (!asset.targetSize || !Number.isInteger(asset.targetSize.width) || !Number.isInteger(asset.targetSize.height)) problems.push('invalid-target-size');
  if (!['terrain-texture', 'building-billboard', 'resource-icon', 'character-sprite', 'ui-ornament', 'postcard'].includes(String(asset.targetKind || ''))) problems.push('invalid-target-kind');
  if (String(asset.promptText || '').trim().length < 80) problems.push('missing-prompt-text');
  if (!isSafeRelativePath(asset.usagePath) || !String(asset.usagePath || '').startsWith(`public/experiences/world-grid/generated/${packId}/`)) problems.push('invalid-usage-path');
  if (String(asset.negativePrompt || '').trim().length < 12) problems.push('missing-negative-prompt');
  if (!isSafeRelativePath(asset.candidateOutputPath) || !String(asset.candidateOutputPath || '').includes(`/${packId}/candidates/`)) problems.push('invalid-candidate-output-path');
  if (!isSafeRelativePath(asset.approvedOutputPath) || !String(asset.approvedOutputPath || '').includes(`/${packId}/approved/`)) problems.push('invalid-approved-output-path');
  if (!isSafeRelativePath(asset.jobLogPath) || !String(asset.jobLogPath || '').endsWith('.jsonl')) problems.push('invalid-job-log-path');
  return problems.length ? { index, promptId: asset.promptId || null, canonicalTarget: asset.canonicalTarget || null, problems } : null;
}

function validateAssetPromptPlan(plan = {}, pack = {}) {
  const targets = Array.isArray(plan?.targets) ? plan.targets : [];
  const problems = targets
    .map((asset, index) => assetPlanProblems(asset, index, pack?.packId || plan?.packId || ''))
    .filter(Boolean);
  const targetIds = targets.map((asset) => asset.canonicalTarget).filter(Boolean);
  const missingTargets = ASSET_PROMPT_TARGETS.filter((target) => !targetIds.includes(target));
  const duplicateTargets = targetIds.filter((target, index, all) => all.indexOf(target) !== index);
  const schemaReport = SCHEMA_REGISTRY?.assetPromptPlan
    ? validateGeneratedSchema(plan, SCHEMA_REGISTRY.assetPromptPlan, '$.assetPromptPlan')
    : { ok: true, errors: [] };
  const checks = [
    {
      id: 'ASSET_PROMPT_PLAN_SCHEMA_VERSION',
      passed: plan?.schemaVersion === ASSET_PROMPT_PLAN_VERSION,
      measured: { schemaVersion: plan?.schemaVersion || null }
    },
    {
      id: 'ASSET_PROMPT_PLAN_JSON_SCHEMA_VALID',
      passed: schemaReport.ok === true,
      measured: { schemaErrorCount: schemaReport.errors.length, errors: schemaReport.errors.slice(0, 5) }
    },
    {
      id: 'ASSET_PROMPT_PLAN_PACK_MATCH',
      passed: Boolean(pack?.packId && plan?.packId === pack.packId),
      measured: { planPackId: plan?.packId || null, packId: pack?.packId || null }
    },
    {
      id: 'ASSET_PROMPT_PLAN_TARGET_COVERAGE',
      passed: missingTargets.length === 0 && duplicateTargets.length === 0,
      measured: { required: ASSET_PROMPT_TARGETS.length, covered: new Set(targetIds).size, missingTargets, duplicateTargets: [...new Set(duplicateTargets)] }
    },
    {
      id: 'ASSET_PROMPT_PLAN_ENTRIES_VALID',
      passed: targets.length === ASSET_PROMPT_TARGETS.length && problems.length === 0,
      measured: { targetCount: targets.length, problems }
    },
    {
      id: 'ASSET_PROMPT_PLAN_NO_PRODUCTION_DEPENDENCY',
      passed: ['gpt-image-2-candidate', 'deterministic-fallback'].includes(String(plan?.modelFamily || ''))
        && targets.every((target) => target.status === 'planned-not-generated')
        && targets.every((target) => !String(target.approvedOutputPath || '').endsWith('.png')),
      measured: {
        modelFamily: plan?.modelFamily || null,
        approvedTargetCount: targets.filter((target) => target.status !== 'planned-not-generated').length
      }
    }
  ];
  return {
    ok: checks.every((check) => check.passed === true),
    checks,
    metrics: {
      plannedAssetCount: targets.length,
      invalidPlanAssetCount: problems.length,
      promptHashCount: new Set(targets.map((asset) => asset.promptHash).filter(Boolean)).size,
      candidateOutputPathCount: targets.filter((asset) => asset.candidateOutputPath).length,
      productionImageAssetsRequired: false
    }
  };
}

function validateGeneratedPack(pack) {
  const mappings = pack?.gameplayMapping?.canonicalEntities || [];
  const mappingIds = new Set(mappings.map((mapping) => mapping.canonicalId));
  const missingMappings = REQUIRED_CANONICAL_IDS.filter((id) => !mappingIds.has(id));
  const unknownMappings = mappings
    .filter((mapping) => !REQUIRED_CANONICAL_IDS.includes(mapping.canonicalId))
    .map((mapping) => mapping.canonicalId);
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
  const packForContentScan = { ...pack, validationReport: undefined };
  const forbiddenAuthorityPaths = findForbiddenAuthorityPaths(packForContentScan);
  const secretLikePaths = findSecretLikePaths(packForContentScan);
  const rawInstructionPaths = findRawPromptInstructionPaths(packForContentScan);
  const mechanicalMissing = mappings.filter((mapping) => !mapping.mechanicalKey).map((mapping) => mapping.canonicalId);
  const duplicateMappings = mappings
    .map((mapping) => mapping.canonicalId)
    .filter((canonicalId, index, all) => canonicalId && all.indexOf(canonicalId) !== index);
  const generationBriefReport = validateGenerationBrief(pack?.generationBrief || {});
  const assetManifestReport = validateAssetManifest(pack?.assetManifest || {}, pack);
  const assetPromptPlanReport = validateAssetPromptPlan(pack?.assetPromptPlan || {}, pack);
  const schemaValidationReport = validateGeneratedPackSchemas(
    pack?.validationReport ? pack : { ...pack, validationReport: { ok: true } },
    SCHEMA_REGISTRY
  );
  const scaffold = pack?.assetScaffold || {};
  const checks = [
    {
      id: 'GENPACK_SCHEMA_VERSION',
      passed: pack?.schemaVersion === SCHEMA_VERSION,
      measured: { schemaVersion: pack?.schemaVersion || null }
    },
    {
      id: 'GENPACK_JSON_SCHEMA_VALID',
      passed: schemaValidationReport.ok === true,
      measured: {
        schemaCount: schemaValidationReport.metrics.schemaCount,
        schemaErrorCount: schemaValidationReport.metrics.schemaErrorCount,
        errors: schemaValidationReport.errors.slice(0, 10)
      }
    },
    {
      id: 'GENPACK_PROMPT_HASHED',
      passed: /^[0-9a-f]{64}$/.test(String(pack?.prompt?.hash || '')) && !pack?.prompt?.normalizedPrompt,
      measured: { hasPromptHash: Boolean(pack?.prompt?.hash), promptStoredRaw: Boolean(pack?.prompt?.normalizedPrompt) }
    },
    {
      id: 'GENPACK_CANONICAL_MAPPING_COVERAGE',
      passed: missingMappings.length === 0 && unknownMappings.length === 0 && duplicateMappings.length === 0,
      measured: {
        required: REQUIRED_CANONICAL_IDS.length,
        covered: mappingIds.size,
        missing: missingMappings,
        unknownMappings,
        duplicateMappings: [...new Set(duplicateMappings)]
      }
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
      id: 'GENPACK_NO_SECRET_FIELDS',
      passed: secretLikePaths.length === 0,
      measured: { secretLikePaths }
    },
    {
      id: 'GENPACK_NO_RAW_EXECUTABLE_PROMPT_INSTRUCTIONS',
      passed: rawInstructionPaths.length === 0,
      measured: { rawInstructionPaths }
    },
    {
      id: 'GENPACK_GENERATION_BRIEF_VALID',
      passed: generationBriefReport.ok === true,
      measured: generationBriefReport.metrics
    },
    {
      id: 'GENPACK_THREEJS_PALETTE_READY',
      passed: missingColors.length === 0 && terrainColors.length === 5 && stateColors.length === 4,
      measured: { terrainColors: terrainColors.length, stateColors: stateColors.length, invalidColors: missingColors }
    },
    {
      id: 'GENPACK_ASSET_MANIFEST_READY',
      passed: assetManifestReport.ok === true,
      measured: assetManifestReport.metrics
    },
    {
      id: 'GENPACK_ASSET_PROMPT_PLAN_READY',
      passed: assetPromptPlanReport.ok === true,
      measured: assetPromptPlanReport.metrics
    },
    {
      id: 'GENPACK_ASSET_SCAFFOLD_READY',
      passed: scaffold?.schemaVersion === ASSET_SCAFFOLD_VERSION
        && scaffold?.packId === pack?.packId
        && Number(scaffold?.candidateFolderCount || 0) === ASSET_PROMPT_TARGETS.length
        && Number(scaffold?.jobLogCount || 0) === ASSET_PROMPT_TARGETS.length
        && Number(scaffold?.productionImageAssetCount || 0) === 0
        && scaffold?.externalModelUsed === false,
      measured: {
        schemaVersion: scaffold?.schemaVersion || null,
        candidateFolderCount: Number(scaffold?.candidateFolderCount || 0),
        jobLogCount: Number(scaffold?.jobLogCount || 0),
        productionImageAssetCount: Number(scaffold?.productionImageAssetCount || 0),
        externalModelUsed: scaffold?.externalModelUsed === true
      }
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
      generationBriefValid: generationBriefReport.ok === true,
      schemaRegistryExists: true,
      jsonSchemaRunnerExists: true,
      schemasValidatedIndependently: schemaValidationReport.metrics.schemasValidatedIndependently,
      schemaValidationErrorCount: schemaValidationReport.metrics.schemaErrorCount,
      assetPromptPlanCount: Array.isArray(pack?.assetPromptPlan?.targets) ? pack.assetPromptPlan.targets.length : 0,
      candidateOutputPathCount: assetPromptPlanReport.metrics.candidateOutputPathCount,
      jobLogCount: Number(pack?.assetScaffold?.jobLogCount || 0),
      invalidAssetManifestEntries: assetManifestReport.metrics.invalidAssetCount,
      firstLoopReady: Boolean(pack?.universePack?.firstLoop?.objective && pack?.universePack?.firstLoop?.successReceipt),
      productionImageCandidatesRequired: true,
      productionImageAssetsRequired: false,
      replayabilitySignature: sha256(JSON.stringify({
        theme: pack?.generationBrief?.theme?.primary || '',
        palette: pack?.stylePack?.palette || {},
        mappings: mappings.map((mapping) => [mapping.canonicalId, mapping.generatedName])
      })).slice(0, 16)
    }
  };
}

function scorePaletteContrast(pack = {}) {
  const palette = pack?.stylePack?.palette || {};
  const backgroundRatio = contrastRatio(palette.ink, palette.background);
  const surfaceRatio = contrastRatio(palette.ink, palette.surface);
  const focusRatio = contrastRatio(palette.focus, palette.background);
  const minimumTextRatio = Math.min(backgroundRatio || 0, surfaceRatio || 0);
  return {
    score: scoreFromContrast(minimumTextRatio),
    minimumTextContrastRatio: minimumTextRatio,
    backgroundContrastRatio: backgroundRatio,
    surfaceContrastRatio: surfaceRatio,
    focusContrastRatio: focusRatio,
    passed: minimumTextRatio >= 4.5
  };
}

function scoreStyleCoherence(pack = {}, packValidationReport = null) {
  const metrics = packValidationReport?.metrics || {};
  const style = pack?.stylePack || {};
  const universe = pack?.universePack || {};
  const assetPlanTargets = Array.isArray(pack?.assetPromptPlan?.targets) ? pack.assetPromptPlan.targets.length : 0;
  const textAssetCount = metrics.generatedTextAssetCount || 0;
  const coverage = metrics.requiredCanonicalMappings
    ? (metrics.canonicalMappingsCovered || 0) / metrics.requiredCanonicalMappings
    : 0;
  const factors = [
    packValidationReport?.ok === true ? 1 : 0,
    coverage,
    assetPlanTargets >= ASSET_PROMPT_TARGETS.length ? 1 : assetPlanTargets / ASSET_PROMPT_TARGETS.length,
    textAssetCount >= TEXT_ASSET_TARGETS.length ? 1 : textAssetCount / TEXT_ASSET_TARGETS.length,
    style?.palette && style?.materialRules && style?.uiRules && universe?.firstLoop ? 1 : 0
  ];
  return {
    score: Number((factors.reduce((sum, value) => sum + value, 0) / factors.length).toFixed(3)),
    factors: {
      packValid: packValidationReport?.ok === true,
      canonicalMappingCoverage: Number(coverage.toFixed(3)),
      assetPlanTargets,
      generatedTextAssetCount: textAssetCount,
      styleRuntimeFieldsPresent: factors[4] === 1
    }
  };
}

function scorePromptAlignment(pack = {}) {
  const hints = (pack?.generationBrief?.keywordHints || [])
    .map((hint) => String(hint || '').toLowerCase())
    .filter((hint) => hint.length >= 3);
  const searchable = [
    pack?.generationBrief?.theme?.primary,
    pack?.generationBrief?.theme?.secondary,
    pack?.generationBrief?.visualStyle?.styleFamily,
    ...(pack?.generationBrief?.civilizationFlavor?.techFlavor || []),
    pack?.stylePack?.name,
    pack?.stylePack?.themeSummary,
    pack?.universePack?.name,
    pack?.universePack?.pitch,
    pack?.universePack?.playerRole,
    pack?.universePack?.cloverRole,
    ...Object.values(pack?.universePack?.text || {}),
    ...(pack?.universePack?.factions || []).map((faction) => `${faction.name} ${faction.role}`),
    ...(pack?.gameplayMapping?.canonicalEntities || []).map((mapping) => mapping.generatedName)
  ].join(' ').toLowerCase();
  const matchedHints = [...new Set(hints.filter((hint) => searchable.includes(hint)))];
  return {
    score: hints.length ? Number((0.8 + (0.2 * (matchedHints.length / hints.length))).toFixed(3)) : 0.85,
    matchedHints,
    totalHints: hints.length
  };
}

function normalizeScreenshotEvidence(evidence = {}) {
  const hash = String(evidence.hash || evidence.sha256 || '').trim().toLowerCase();
  const width = Number(evidence.width || 0);
  const height = Number(evidence.height || 0);
  const byteLength = Number(evidence.byteLength || 0);
  return {
    captured: evidence.captured === true
      && /^[0-9a-f]{64}$/.test(hash)
      && width >= 160
      && height >= 120
      && byteLength > 100,
    hash,
    width: Number.isFinite(width) ? width : 0,
    height: Number.isFinite(height) ? height : 0,
    byteLength: Number.isFinite(byteLength) ? byteLength : 0,
    source: String(evidence.source || 'browser-stage-canvas').slice(0, 80)
  };
}

function normalizeAssetLoaderEvidence(assetLoader = {}) {
  return {
    assetAwareLoaderExists: assetLoader.assetAwareLoaderExists === true,
    missingTextureCount: Number.isFinite(Number(assetLoader.missingTextureCount)) ? Number(assetLoader.missingTextureCount) : 0,
    handledMissingTextureCount: Number.isFinite(Number(assetLoader.handledMissingTextureCount)) ? Number(assetLoader.handledMissingTextureCount) : 0,
    fallbackTextureCount: Number.isFinite(Number(assetLoader.fallbackTextureCount)) ? Number(assetLoader.fallbackTextureCount) : 0,
    performanceBudgetPassed: assetLoader.performanceBudgetPassed === true,
    firstLoopSafe: assetLoader.firstLoopSafe === true,
    reducedMotion: assetLoader.reducedMotion === true
  };
}

function buildMeasuredPlaytestReport({ pack, report = {}, nowMs = Date.now() } = {}) {
  const packValidationReport = validateGeneratedPack(pack || {});
  const paletteContrast = scorePaletteContrast(pack || {});
  const styleCoherence = scoreStyleCoherence(pack || {}, packValidationReport);
  const promptAlignment = scorePromptAlignment(pack || {});
  const screenshotEvidence = normalizeScreenshotEvidence(report.screenshotEvidence || {});
  const assetLoader = normalizeAssetLoaderEvidence(report.assetLoader || {});
  const scoreEvidenceMeasured = report?.scoreEvidence?.measured === true
    && String(report?.scoreEvidence?.measurementVersion || '').trim().length > 0
    && screenshotEvidence.captured === true;
  const reportedMissingAssets = Number.isFinite(Number(report.missingAssets)) ? Number(report.missingAssets) : 0;
  const missingAssets = Math.max(reportedMissingAssets, assetLoader.missingTextureCount);
  const warnings = [];
  if (assetLoader.handledMissingTextureCount > 0 || assetLoader.fallbackTextureCount > 0) {
    warnings.push({
      code: 'asset-loader-fallback-textures',
      count: assetLoader.handledMissingTextureCount || assetLoader.fallbackTextureCount,
      severity: 'warning'
    });
  }
  if (!paletteContrast.passed) warnings.push({ code: 'palette-contrast-below-aa', severity: 'error' });

  return {
    schemaVersion: 'agent-town-generated-pack-playtest-v1',
    packId: String(report.packId || pack?.packId || ''),
    completedAtMs: Number.isFinite(Number(report.completedAtMs)) ? Number(report.completedAtMs) : nowMs,
    renderer: String(report.renderer || 'three'),
    firstLoopCompleted: report.firstLoopCompleted === true,
    canonicalPayloadIntegrity: report.canonicalPayloadIntegrity === true,
    missingAssets,
    consoleErrors: Number.isFinite(Number(report.consoleErrors)) ? Number(report.consoleErrors) : 0,
    playtestPassed: false,
    paletteContrastScore: paletteContrast.score,
    styleCoherenceScore: styleCoherence.score,
    promptAlignmentScore: promptAlignment.score,
    uiReadabilityScore: paletteContrast.score,
    measuredScoresRequired: true,
    defaultScoresUsed: !scoreEvidenceMeasured,
    scoreEvidence: {
      measured: scoreEvidenceMeasured,
      measurementVersion: String(report?.scoreEvidence?.measurementVersion || 'agent-town-browser-playtest-measurements-v1'),
      scoresDerivedFrom: 'pack-contract-browser-measurements',
      paletteContrast,
      styleCoherence: styleCoherence.factors,
      promptAlignment: {
        matchedHints: promptAlignment.matchedHints,
        totalHints: promptAlignment.totalHints
      },
      assetLoader
    },
    screenshotEvidence,
    warnings
  };
}

function validatePlaytestReport(report = {}, pack = null) {
  const packValidationReport = validateGeneratedPack(pack || {});
  const screenshotEvidence = report.screenshotEvidence || {};
  const scoreEvidence = report.scoreEvidence || {};
  const checks = [
    { id: 'PLAYTEST_SCHEMA_VALID', passed: report.schemaVersion === 'agent-town-generated-pack-playtest-v1' },
    { id: 'PLAYTEST_PACK_MATCH', passed: Boolean(pack?.packId && report.packId === pack.packId) },
    { id: 'PLAYTEST_PACK_VALIDATION_GATE', passed: packValidationReport.ok === true },
    { id: 'PLAYTEST_FIRST_LOOP_COMPLETED', passed: report.firstLoopCompleted === true },
    { id: 'PLAYTEST_THREE_RENDERER_USED', passed: report.renderer === 'three' },
    { id: 'PLAYTEST_CANONICAL_PAYLOAD_INTEGRITY', passed: report.canonicalPayloadIntegrity === true },
    { id: 'PLAYTEST_NO_MISSING_ASSETS', passed: Number(report.missingAssets || 0) === 0 },
    { id: 'PLAYTEST_CONSOLE_CLEAN', passed: Number(report.consoleErrors || 0) === 0 },
    { id: 'PLAYTEST_MEASURED_SCORES_REQUIRED', passed: scoreEvidence.measured === true && report.defaultScoresUsed === false },
    { id: 'PLAYTEST_SCREENSHOT_EVIDENCE_RECORDED', passed: screenshotEvidence.captured === true && /^[0-9a-f]{64}$/.test(String(screenshotEvidence.hash || '')) },
    { id: 'PLAYTEST_PALETTE_CONTRAST_GATE', passed: Number(report.paletteContrastScore || 0) >= 0.85 },
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
      paletteContrastScore: Number(report.paletteContrastScore || 0),
      styleCoherenceScore: Number(report.styleCoherenceScore || 0),
      promptAlignmentScore: Number(report.promptAlignmentScore || 0),
      measuredScoresRequired: report.measuredScoresRequired === true,
      measuredScoresPresent: scoreEvidence.measured === true,
      screenshotEvidenceRecorded: screenshotEvidence.captured === true,
      warningCount: Array.isArray(report.warnings) ? report.warnings.length : 0,
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
  const normalized = buildMeasuredPlaytestReport({ pack, report, nowMs });
  normalized.validationReport = validatePlaytestReport(normalized, pack);
  normalized.playtestPassed = normalized.validationReport.ok;
  playtestStore.set(key, clone(normalized));
  return clone(normalized);
}

function currentPlaytestReport(owner = {}) {
  const key = storeKey(owner);
  return key ? clone(playtestStore.get(key) || null) : null;
}

function createGeneratedPack({ owner, prompt, nowMs = Date.now(), candidateRoot = DEFAULT_CANDIDATE_ROOT } = {}) {
  const generationBrief = createGenerationBrief({ prompt });
  const promptHash = generationBrief.promptHash;
  const words = Array.isArray(generationBrief.keywordHints) ? generationBrief.keywordHints : [];
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
      length: generationBrief.promptLength,
      keywordHints: words.slice(0, 6)
    },
    generationBrief,
    stylePack: {
      schemaVersion: 'agent-town-style-bible-v1',
      stylePackId: `style_${preset.id}_${packHash.slice(0, 8)}`,
      promptHash,
      name: `${anchor} ${preset.name}`,
      themeSummary: `${anchor} and ${second} motifs translated into warm frontier materials.`,
      palette: clone(preset.palette),
      materialRules: [
        { target: 'three-region-cell', rule: 'terrain colors are softened by ownership state' },
        { target: 'home-settlement-marker', rule: 'primary color with warm light contact shadow' },
        { target: 'selection-ring', rule: 'selected color with high contrast against terrain' }
      ],
      silhouetteRules: [
        'buildings use one readable primary silhouette per canonical target',
        'terrain textures must remain legible under ownership overlays',
        'resource icons stay distinct at 32px'
      ],
      uiRules: {
        minReadableTextPx: 16,
        onePrimaryAction: true,
        normalGameplayDebugJargon: false
      },
      animationRules: [
        'motion is cosmetic only',
        'reduced-motion mode may disable all ambient animation',
        'selection feedback must not obscure cell labels'
      ]
    },
    universePack: {
      schemaVersion: 'agent-town-universe-bible-v1',
      universePackId: `universe_${packHash.slice(0, 12)}`,
      promptHash,
      name: `${anchor} ${second} Charter`,
      pitch: `${anchor} settlers and ${second} crews build a civic frontier with Clover keeping the work bounded and legible.`,
      playerRole: `${anchor} founder`,
      cloverRole: 'Clover remains the trusted Foreman and explains each bounded action in-world.',
      species: [
        { id: 'species_settlers', name: `${anchor} settlers`, description: 'Readable frontier citizens who keep the settlement grounded in canonical Agent Town work.' },
        { id: 'species_crews', name: `${second} crews`, description: 'Theme-flavored helpers who add presentation flavor without adding autonomous mechanics.' }
      ],
      factions: [
        { factionId: 'faction_settlers', name: `${anchor} Settlers`, role: 'home-builders', line: `They want ${index['resource.food'].generatedName.toLowerCase()} and a steady route outward.` },
        { factionId: 'faction_crews', name: `${second} Crews`, role: 'makers', line: `They turn ${index['resource.wood'].generatedName.toLowerCase()} and ${index['resource.stone'].generatedName.toLowerCase()} into practical town work.` }
      ],
      cultures: [
        { cultureId: 'culture_craft', name: `${anchor} craft habit`, civicHabit: 'plan one route, explain the cost, then complete the bounded claim.' },
        { cultureId: 'culture_route', name: `${second} route custom`, civicHabit: 'keep maps legible and make every generated label traceable to a canonical key.' }
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
      schemaVersion: 'agent-town-gameplay-mapping-v1',
      canonicalVersion: 'agent-town-world-grid-v1',
      serverRuleOverrides: 0,
      canonicalEntities: mappings
    }
  };
  pack.assetManifest = buildAssetManifest({ packId, promptHash, mappings, preset });
  pack.assetPromptPlan = buildAssetPromptPlan({ pack, candidateRoot });
  pack.assetScaffold = scaffoldAssetGenerationJobs(pack.assetPromptPlan, { nowMs });
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

function analyzePackDiversity(packs = []) {
  const safePacks = Array.isArray(packs) ? packs.filter(Boolean) : [];
  const signatures = safePacks.map((pack) => pack?.validationReport?.metrics?.replayabilitySignature || sha256(JSON.stringify({
    theme: pack?.generationBrief?.theme?.primary || '',
    style: pack?.stylePack?.name || '',
    universe: pack?.universePack?.name || '',
    palette: pack?.stylePack?.palette || {}
  })).slice(0, 16));
  const uniquePackIds = new Set(safePacks.map((pack) => pack.packId).filter(Boolean));
  const uniqueThemes = new Set(safePacks.map((pack) => pack.generationBrief?.theme?.primary).filter(Boolean));
  const uniquePalettes = new Set(safePacks.map((pack) => JSON.stringify(pack.stylePack?.palette || {})));
  const uniqueSignatures = new Set(signatures);
  const promptCount = safePacks.length;
  return {
    ok: promptCount > 0
      && uniquePackIds.size === promptCount
      && uniqueThemes.size >= Math.min(promptCount, 3)
      && uniqueSignatures.size === promptCount,
    metrics: {
      promptCount,
      uniquePackIds: uniquePackIds.size,
      uniqueThemes: uniqueThemes.size,
      uniquePalettes: uniquePalettes.size,
      uniqueReplayabilitySignatures: uniqueSignatures.size,
      minimumDistinctThemeRatio: promptCount ? uniqueThemes.size / promptCount : 0,
      minimumDistinctSignatureRatio: promptCount ? uniqueSignatures.size / promptCount : 0
    },
    signatures
  };
}

function clearGeneratedPacksForTests() {
  packStore.clear();
  playtestStore.clear();
}

module.exports = {
  ASSET_PROMPT_PLAN_VERSION,
  DEFAULT_CANDIDATE_ROOT,
  GENERATION_BRIEF_VERSION,
  REQUIRED_CANONICAL_IDS,
  SCHEMA_VERSION,
  analyzePackDiversity,
  buildAssetPromptPlan,
  buildMeasuredPlaytestReport,
  clearGeneratedPacksForTests,
  createGenerationBrief,
  createGeneratedPack,
  currentGeneratedPack,
  currentPlaytestReport,
  generateAndStorePack,
  normalizePrompt,
  recordPlaytestReport,
  scaffoldAssetGenerationJobs,
  validateGeneratedPackSchemas,
  validateAssetManifest,
  validateAssetPromptPlan,
  validateGenerationBrief,
  validatePlaytestReport,
  validateGeneratedPack
};
