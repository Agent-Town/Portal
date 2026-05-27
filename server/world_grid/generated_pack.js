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
const GENERATED_PACK_EXPORT_VERSION = 'agent-town-generated-pack-export-v1';
const GENERATED_PACK_MIGRATION_VERSION = 1;
const PUBLIC_PACK_CARD_VERSION = 'agent-town-generated-pack-public-card-v1';
const PUBLIC_PACK_GALLERY_VERSION = 'agent-town-generated-pack-gallery-v1';
const PUBLIC_PACK_GALLERY_ENTRY_VERSION = 'agent-town-generated-pack-gallery-entry-v1';
const PUBLIC_PACK_GALLERY_CURATION_VERSION = 'agent-town-generated-pack-gallery-curation-v1';
const CANDIDATE_REVIEW_MANIFEST_VERSION = 'agent-town-generated-pack-candidate-review-manifest-v1';
const RELEASE_APPROVAL_EVIDENCE_VERSION = 'agent-town-generated-pack-release-approval-evidence-v1';
const PRODUCTION_RELEASE_GATE_VERSION = 'agent-town-generated-pack-production-release-gate-v1';
const RELEASE_EVIDENCE_BUNDLE_VERSION = 'agent-town-generated-pack-release-evidence-bundle-v1';
const DEFAULT_CANDIDATE_ROOT = 'data/generated-packs';
const DEFAULT_DURABLE_ROOT = 'data/generated-packs-durable';
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
const TECH_FLAVOR_TREE_VERSION = 'agent-town-tech-flavor-tree-v1';
const TECH_FLAVOR_BALANCE_VERSION = 'agent-town-tech-flavor-balance-v1';
const CANONICAL_TECH_CAPABILITIES = [
  {
    canonicalCapabilityId: 'capability.world_grid.survey_readiness',
    canonicalEffectId: 'text.status-ready',
    unlockRule: 'available-at-region-load',
    effectKind: 'copy-only',
    futureHook: { targetLane: 'v5-world-grid', status: 'metadata-only' }
  },
  {
    canonicalCapabilityId: 'capability.world_grid.claim_planning',
    canonicalEffectId: 'action.plan_claim',
    unlockRule: 'canonical-action-available',
    effectKind: 'copy-only',
    futureHook: { targetLane: 'v5-world-grid', status: 'metadata-only' }
  },
  {
    canonicalCapabilityId: 'capability.world_grid.claim_completion',
    canonicalEffectId: 'action.complete_claim',
    unlockRule: 'canonical-action-available',
    effectKind: 'copy-only',
    futureHook: { targetLane: 'v5-world-grid', status: 'metadata-only' }
  },
  {
    canonicalCapabilityId: 'capability.world_grid.public_presence',
    canonicalEffectId: 'surface.public_presence',
    unlockRule: 'canonical-feature-flag-gated',
    effectKind: 'flavor-only',
    futureHook: { targetLane: 'v5-world-grid', status: 'metadata-only' }
  },
  {
    canonicalCapabilityId: 'capability.world_grid.civic_services',
    canonicalEffectId: 'surface.agent_services',
    unlockRule: 'canonical-feature-flag-gated',
    effectKind: 'metadata-only',
    futureHook: { targetLane: 'v3-compatible-metadata', status: 'metadata-only' }
  },
  {
    canonicalCapabilityId: 'capability.world_grid.public_works',
    canonicalEffectId: 'surface.world_events',
    unlockRule: 'canonical-feature-flag-gated',
    effectKind: 'flavor-only',
    futureHook: { targetLane: 'v5-world-grid', status: 'metadata-only' }
  }
];
const CANONICAL_TECH_CAPABILITY_IDS = CANONICAL_TECH_CAPABILITIES.map((capability) => capability.canonicalCapabilityId);
const CANONICAL_TECH_EFFECT_IDS = CANONICAL_TECH_CAPABILITIES.map((capability) => capability.canonicalEffectId);
const REQUESTER_VOICE_PACK_VERSION = 'agent-town-requester-voice-pack-v1';
const REQUESTER_VOICE_BALANCE_VERSION = 'agent-town-requester-voice-balance-v1';
const CANONICAL_CONTRACTS = [
  {
    canonicalContractId: 'contract.world_grid.plan_claim',
    canonicalActionId: 'action.plan_claim',
    ruleSurface: 'claim-planning'
  },
  {
    canonicalContractId: 'contract.world_grid.complete_claim',
    canonicalActionId: 'action.complete_claim',
    ruleSurface: 'claim-completion'
  },
  {
    canonicalContractId: 'contract.world_grid.public_presence',
    canonicalActionId: 'surface.public_presence',
    ruleSurface: 'public-presence'
  },
  {
    canonicalContractId: 'contract.world_grid.civic_service',
    canonicalActionId: 'surface.agent_services',
    ruleSurface: 'agent-services'
  }
];
const CANONICAL_CONTRACT_IDS = CANONICAL_CONTRACTS.map((contract) => contract.canonicalContractId);
const CANONICAL_CONTRACT_ACTION_IDS = CANONICAL_CONTRACTS.map((contract) => contract.canonicalActionId);
const INHABITANT_STYLE_OVERLAY_VERSION = 'agent-town-inhabitant-style-overlay-v1';
const INHABITANT_STYLE_BALANCE_VERSION = 'agent-town-inhabitant-style-balance-v1';
const INHABITANT_SPRITE_PROMPT_PLAN_VERSION = 'agent-town-inhabitant-sprite-prompt-plan-v1';
const INHABITANT_ROLE_DEFINITIONS = [
  {
    canonicalRoleId: 'inhabitant.worker',
    roleKind: 'worker',
    baseTitle: 'Worker',
    serverStateSource: 'region.cells.claimed',
    stateReadPath: 'region.cells[state=claimed]',
    copyFocus: 'keeps the claimed home cell readable'
  },
  {
    canonicalRoleId: 'inhabitant.hauler',
    roleKind: 'hauler',
    baseTitle: 'Hauler',
    serverStateSource: 'territory.claimOptions',
    stateReadPath: 'territory.claimOptions[0]',
    copyFocus: 'points toward the next available claim option'
  },
  {
    canonicalRoleId: 'inhabitant.messenger',
    roleKind: 'messenger',
    baseTitle: 'Messenger',
    serverStateSource: 'region.routes',
    stateReadPath: 'region.routes[status=open]',
    copyFocus: 'stands near visible route information'
  },
  {
    canonicalRoleId: 'inhabitant.farmer',
    roleKind: 'farmer',
    baseTitle: 'Farmer',
    serverStateSource: 'region.settlements',
    stateReadPath: 'region.settlements[0]',
    copyFocus: 'adds food-town flavor near settlement state'
  }
];
const INHABITANT_ROLE_IDS = INHABITANT_ROLE_DEFINITIONS.map((role) => role.canonicalRoleId);
const MULTI_SURFACE_COMPATIBILITY_VERSION = 'agent-town-multi-surface-compatibility-v1';
const MULTI_SURFACE_BALANCE_VERSION = 'agent-town-multi-surface-balance-v1';
const MULTI_SURFACE_DEFINITIONS = [
  {
    surfaceId: 'surface.z1.settlement',
    canonicalSurface: 'z1-settlement-node',
    serverStateSource: 'region.settlements',
    usagePath: 'world-grid.z1.settlement-node',
    titleSuffix: 'Home'
  },
  {
    surfaceId: 'surface.z2.region',
    canonicalSurface: 'z2-region-grid',
    serverStateSource: 'region.cells',
    usagePath: 'world-grid.z2.region-grid',
    titleSuffix: 'Region'
  },
  {
    surfaceId: 'surface.route.network',
    canonicalSurface: 'region-route-edge',
    serverStateSource: 'region.routes',
    usagePath: 'world-grid.routes',
    titleSuffix: 'Route'
  },
  {
    surfaceId: 'surface.public.card',
    canonicalSurface: 'public-pack-card',
    serverStateSource: 'public-card.redacted-pack',
    usagePath: 'generated-pack.public-card',
    titleSuffix: 'Card'
  },
  {
    surfaceId: 'surface.sandbox.commons',
    canonicalSurface: 'sandbox-district',
    serverStateSource: 'sandbox.typed-state',
    usagePath: 'world-grid.sandbox',
    titleSuffix: 'Commons'
  }
];
const MULTI_SURFACE_IDS = MULTI_SURFACE_DEFINITIONS.map((surface) => surface.surfaceId);
const APPROVED_MODIFIERS_VERSION = 'agent-town-approved-modifiers-v1';
const APPROVED_MODIFIER_BALANCE_VERSION = 'agent-town-approved-modifier-balance-v1';
const APPROVED_MODIFIERS = [
  'visual_only',
  'more_contract_flavor',
  'requesters_prefer_food',
  'extra_public_square_charm_text',
  'ambient_weather_cosmetic',
  'tutorial_copy_variant'
];
const APPROVED_MODIFIER_EFFECTS = {
  visual_only: {
    scope: 'visual',
    appliesTo: 'region-grid',
    effect: 'Uses generated palette, labels, and asset fallbacks without changing region rules.'
  },
  more_contract_flavor: {
    scope: 'copy',
    appliesTo: 'contract-copy',
    effect: 'Adds themed contract wording while preserving canonical claim costs and states.'
  },
  requesters_prefer_food: {
    scope: 'requester-flavor',
    appliesTo: 'contract-copy',
    effect: 'Lets requester copy mention food preferences without changing resource math.'
  },
  extra_public_square_charm_text: {
    scope: 'copy',
    appliesTo: 'public-square-copy',
    effect: 'Adds one public-square charm line in generated surfaces only.'
  },
  ambient_weather_cosmetic: {
    scope: 'cosmetic',
    appliesTo: 'weather-layer',
    effect: 'Allows ambient weather language and presentation tinting with no mechanical weather pressure.'
  },
  tutorial_copy_variant: {
    scope: 'copy',
    appliesTo: 'tutorial-copy',
    effect: 'Uses a generated first-loop tutorial phrasing while keeping the same required action.'
  }
};
const CANONICAL_CLAIM_COST_TABLE = {
  prairie: { coin: 3 },
  ridge: { coin: 4 },
  river: { coin: 4 },
  forest: { coin: 2 },
  mesa: { coin: 3 }
};
const REPLAYABILITY_PROMPT_SUITE = [
  'cozy mushroom frontier with clockwork gardeners and lantern moss',
  'brass moonrail desert town with prairie dog engineers',
  'tideglass harbor settlement with lobster sheriffs and mist bells',
  'wizard school frontier with bookish builders and blue lanterns',
  'sunforge canyon city with copper kin and weather towers',
  'winter pine hamlet with fox couriers and warm inns',
  'sky-island ranch with cloud herders and floating bridges',
  'crystal cave outpost with echo miners and glow carts',
  'tea garden settlement with chibi homesteaders and polite robots',
  'dusty starport frontier with comet traders and brass wagons'
];
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

const SECRET_LIKE_KEY_PATTERN = /(api[_-]?key|secret|private[_-]?key|credential|oauth|access[_-]?token|refresh[_-]?token|auth[_-]?token|bearer[_-]?token|id[_-]?token|session[_-]?token|provider[_-]?token|wallet[_-]?secret|seed[_-]?phrase|password|^token$)/i;

const SENSITIVE_TEXT_PATTERNS = [
  { id: 'api-key-reference', pattern: /\b(api[_ -]?key|access[_ -]?token|refresh[_ -]?token|auth[_ -]?token|bearer[_ -]?token|id[_ -]?token|session[_ -]?token|provider[_ -]?token)\b/i },
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

const PUBLIC_CARD_FORBIDDEN_TERMS = [
  'brain',
  'wallet',
  'provider',
  'oauth',
  'debug',
  'worker traffic',
  'session context',
  'api key',
  'secret',
  'private key',
  'access token',
  'refresh token',
  'password',
  'credential',
  'raw prompt',
  'normalized prompt'
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

const DIVERSITY_GENERIC_TOKENS = new Set([
  'and',
  'the',
  'with',
  'craft',
  'line',
  'charter',
  'settlers',
  'crews',
  'frontier',
  'settlement',
  'civic',
  'route',
  'tradition',
  'customs'
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
const publicCardStore = new Map();

function sha256(value = '') {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex');
}

function canonicalClaimCostHash() {
  return sha256(JSON.stringify(CANONICAL_CLAIM_COST_TABLE));
}

function canonicalTechEffectHash() {
  return sha256(JSON.stringify(CANONICAL_TECH_CAPABILITIES.map((capability) => ({
    canonicalCapabilityId: capability.canonicalCapabilityId,
    canonicalEffectId: capability.canonicalEffectId,
    unlockRule: capability.unlockRule
  }))));
}

function canonicalContractHash() {
  return sha256(JSON.stringify(CANONICAL_CONTRACTS));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function stableValueForHash(value) {
  if (Array.isArray(value)) return value.map((item) => stableValueForHash(item));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, stableValueForHash(value[key])])
    );
  }
  return value === undefined ? null : value;
}

function stableEvidenceHash(value) {
  if (value === null || value === undefined) return '';
  return sha256(JSON.stringify(stableValueForHash(value)));
}

function durableRoot() {
  return path.resolve(REPO_ROOT, process.env.GENERATED_PACK_STORE_ROOT || DEFAULT_DURABLE_ROOT);
}

function ensureInsideRoot(root, target) {
  const relative = path.relative(root, target);
  return Boolean(relative && !relative.startsWith('..') && !path.isAbsolute(relative));
}

function safeWriteJson(relativePath, value, root = durableRoot()) {
  const fullPath = path.resolve(root, relativePath);
  if (!ensureInsideRoot(root, fullPath)) {
    const error = new Error('INVALID_STORAGE_PATH');
    error.details = { relativePath };
    throw error;
  }
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function safeReadJson(relativePath, root = durableRoot()) {
  const fullPath = path.resolve(root, relativePath);
  if (!ensureInsideRoot(root, fullPath) || !fs.existsSync(fullPath)) return null;
  return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
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

function titlePhrase(value = '') {
  return (String(value || '').match(/[a-zA-Z0-9]+/g) || [])
    .map(titleWord)
    .filter(Boolean)
    .join(' ');
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

function buildAssetManifest({ packId, promptHash, mappings, preset, palette }) {
  const runtimePalette = palette || preset.palette;
  const visualAssets = [
    ...['prairie', 'ridge', 'river', 'forest', 'mesa'].map((terrain) => ({
      assetId: `${packId}:terrain:${terrain}`,
      canonicalTarget: `terrain.${terrain}`,
      kind: 'three-material',
      status: 'runtime-generated',
      source: 'deterministic-fallback',
      promptHash,
      color: runtimePalette.terrain[terrain]
    })),
    ...['claimed', 'claimable', 'visible', 'locked'].map((state) => ({
      assetId: `${packId}:state:${state}`,
      canonicalTarget: `state.${state}`,
      kind: 'three-material',
      status: 'runtime-generated',
      source: 'deterministic-fallback',
      promptHash,
      color: runtimePalette.state[state]
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
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;
    if (SECRET_LIKE_KEY_PATTERN.test(key)) {
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

function clampChannel(value) {
  return Math.max(24, Math.min(235, Math.round(value)));
}

function channelShift(hash, salt, range = 56) {
  const raw = Number.parseInt(sha256(`${hash}:${salt}`).slice(0, 8), 16) / 0xffffffff;
  return (raw * 2 - 1) * range;
}

function shiftHexColor(value, hash, salt, range = 56) {
  const color = hexToRgb(value);
  if (!color) return value;
  const rgb = [
    color.r * 255,
    color.g * 255,
    color.b * 255
  ].map((channel, index) => clampChannel(channel + channelShift(hash, `${salt}:${index}`, range)));
  return `#${rgb.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

function derivePromptPalette(basePalette = {}, hash = '', words = []) {
  const palette = clone(basePalette);
  const seed = `${hash}:${words.join(':')}`;
  for (const key of ['primary', 'secondary', 'accent', 'focus', 'selected']) {
    palette[key] = shiftHexColor(basePalette[key], seed, key, 64);
  }
  for (const key of ['light', 'ambient']) {
    palette[key] = shiftHexColor(basePalette[key], seed, key, 28);
  }
  palette.terrain = Object.fromEntries(Object.entries(basePalette.terrain || {})
    .map(([key, value]) => [key, shiftHexColor(value, seed, `terrain:${key}`, 52)]));
  palette.state = Object.fromEntries(Object.entries(basePalette.state || {})
    .map(([key, value]) => [key, shiftHexColor(value, seed, `state:${key}`, 48)]));
  return palette;
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

function generatedTechNameForCapability(capabilityId = '', anchor = 'Civic', second = 'Route', index = {}) {
  if (capabilityId === 'capability.world_grid.survey_readiness') return `${anchor} Survey Signals`;
  if (capabilityId === 'capability.world_grid.claim_planning') {
    return `${second} ${titlePhrase(index?.['action.plan_claim']?.generatedName || 'Route Plan')}`;
  }
  if (capabilityId === 'capability.world_grid.claim_completion') {
    return `${anchor} ${titlePhrase(index?.['action.complete_claim']?.generatedName || 'Claim Rite')}`;
  }
  if (capabilityId === 'capability.world_grid.public_presence') return `${second} Neighbor Lamps`;
  if (capabilityId === 'capability.world_grid.civic_services') return `${anchor} Service Loom`;
  if (capabilityId === 'capability.world_grid.public_works') return `${second} Works Bell`;
  return `${anchor} Civic Signal`;
}

function buildTechFlavorTree({ promptHash = '', packHash = '', anchor = 'Civic', second = 'Route', index = {} } = {}) {
  const nodes = CANONICAL_TECH_CAPABILITIES.map((capability) => {
    const generatedName = generatedTechNameForCapability(capability.canonicalCapabilityId, anchor, second, index);
    const generatedTechId = `tech_${slugForTarget(generatedName).slice(0, 43)}`;
    return {
      nodeId: `tech_node_${slugForTarget(capability.canonicalCapabilityId.replace(/^capability\./, ''))}`,
      canonicalCapabilityId: capability.canonicalCapabilityId,
      canonicalEffectId: capability.canonicalEffectId,
      generatedTechId,
      generatedName,
      loreText: `${generatedName} reframes ${capability.canonicalEffectId} for this universe without changing unlock rules.`,
      unlockRule: capability.unlockRule,
      effectKind: capability.effectKind,
      canonicalRuleImpact: 'none',
      mechanicDelta: 0,
      futureHook: clone(capability.futureHook)
    };
  });
  return {
    schemaVersion: TECH_FLAVOR_TREE_VERSION,
    canonicalVersion: 'agent-town-world-grid-v1',
    treeId: `tech_tree_${String(packHash || sha256(promptHash)).slice(0, 12)}`,
    promptHash,
    nodes,
    compatibility: {
      v3HookStatus: 'metadata-only',
      v5WorldGridCompatible: true,
      v6CivicMechanicsTouched: false
    },
    balanceSimulation: {
      simulationVersion: TECH_FLAVOR_BALANCE_VERSION,
      canonicalEffectCoverage: 1,
      customEffectCount: 0,
      unlockRulesPreserved: true,
      canonicalEffectHash: canonicalTechEffectHash(),
      firstLoopCompletable: true
    }
  };
}

function validateTechFlavorTree(tree = {}) {
  const schemaReport = SCHEMA_REGISTRY?.techFlavorTree
    ? validateGeneratedSchema(tree, SCHEMA_REGISTRY.techFlavorTree, '$.techFlavorTree')
    : { ok: true, errors: [] };
  const nodes = Array.isArray(tree?.nodes) ? tree.nodes : [];
  const capabilityIds = nodes.map((node) => node.canonicalCapabilityId).filter(Boolean);
  const effectIds = nodes.map((node) => node.canonicalEffectId).filter(Boolean);
  const missingCapabilities = CANONICAL_TECH_CAPABILITY_IDS.filter((id) => !capabilityIds.includes(id));
  const unknownCapabilities = capabilityIds.filter((id) => !CANONICAL_TECH_CAPABILITY_IDS.includes(id));
  const duplicateCapabilities = capabilityIds.filter((id, index, all) => id && all.indexOf(id) !== index);
  const missingEffects = CANONICAL_TECH_EFFECT_IDS.filter((id) => !effectIds.includes(id));
  const unknownEffects = effectIds.filter((id) => !CANONICAL_TECH_EFFECT_IDS.includes(id));
  const customMechanicNodes = nodes.filter((node) => (
    node.canonicalRuleImpact !== 'none'
    || Number(node.mechanicDelta || 0) !== 0
  ));
  const unlockRuleChanges = nodes.filter((node) => {
    const canonical = CANONICAL_TECH_CAPABILITIES.find((capability) => capability.canonicalCapabilityId === node.canonicalCapabilityId);
    return canonical && node.unlockRule !== canonical.unlockRule;
  });
  const generatedNameCount = nodes.filter((node) => String(node.generatedName || '').trim().length >= 3).length;
  const forbiddenAuthorityPaths = findForbiddenAuthorityPaths(tree);
  const secretLikePaths = findSecretLikePaths(tree);
  const rawInstructionPaths = findRawPromptInstructionPaths(tree);
  const canonicalEffectCoverage = CANONICAL_TECH_CAPABILITY_IDS.length
    ? (CANONICAL_TECH_CAPABILITY_IDS.length - missingCapabilities.length) / CANONICAL_TECH_CAPABILITY_IDS.length
    : 0;
  const customEffectCount = unknownCapabilities.length + unknownEffects.length + customMechanicNodes.length;
  const balance = tree?.balanceSimulation || {};
  const checks = [
    {
      id: 'TECH_FLAVOR_SCHEMA_VALID',
      passed: schemaReport.ok === true,
      measured: { schemaErrorCount: schemaReport.errors.length, errors: schemaReport.errors.slice(0, 5) }
    },
    {
      id: 'TECH_FLAVOR_CANONICAL_EFFECT_COVERAGE',
      passed: missingCapabilities.length === 0
        && unknownCapabilities.length === 0
        && duplicateCapabilities.length === 0
        && missingEffects.length === 0
        && unknownEffects.length === 0,
      measured: {
        requiredCapabilityCount: CANONICAL_TECH_CAPABILITY_IDS.length,
        coveredCapabilityCount: new Set(capabilityIds).size,
        canonicalEffectCoverage,
        missingCapabilities,
        unknownCapabilities,
        duplicateCapabilities: [...new Set(duplicateCapabilities)],
        missingEffects,
        unknownEffects
      }
    },
    {
      id: 'TECH_FLAVOR_NO_CUSTOM_MECHANICS',
      passed: customEffectCount === 0
        && forbiddenAuthorityPaths.length === 0
        && secretLikePaths.length === 0
        && rawInstructionPaths.length === 0,
      measured: {
        customEffectCount,
        customMechanicNodeCount: customMechanicNodes.length,
        forbiddenAuthorityPaths,
        secretLikePaths,
        rawInstructionPaths: rawInstructionPaths.slice(0, 5)
      }
    },
    {
      id: 'TECH_FLAVOR_GENERATED_NAMES_READY',
      passed: generatedNameCount === CANONICAL_TECH_CAPABILITY_IDS.length,
      measured: { generatedNameCount }
    },
    {
      id: 'TECH_FLAVOR_UNLOCK_RULES_PRESERVED',
      passed: unlockRuleChanges.length === 0
        && balance?.simulationVersion === TECH_FLAVOR_BALANCE_VERSION
        && Number(balance?.canonicalEffectCoverage || 0) === 1
        && Number(balance?.customEffectCount || 0) === 0
        && balance?.unlockRulesPreserved === true
        && balance?.canonicalEffectHash === canonicalTechEffectHash()
        && balance?.firstLoopCompletable === true
        && tree?.compatibility?.v5WorldGridCompatible === true
        && tree?.compatibility?.v6CivicMechanicsTouched === false,
      measured: {
        unlockRuleChanges: unlockRuleChanges.map((node) => node.canonicalCapabilityId),
        canonicalEffectHash: balance?.canonicalEffectHash || null,
        v6CivicMechanicsTouched: tree?.compatibility?.v6CivicMechanicsTouched === true
      }
    }
  ];
  return {
    ok: checks.every((check) => check.passed === true),
    checks,
    metrics: {
      techFlavorTreeSchemaExists: Boolean(SCHEMA_REGISTRY?.techFlavorTree),
      canonicalEffectCoverage,
      customEffectCount,
      generatedTechNameCount: generatedNameCount,
      generatedTechNamesVisible: generatedNameCount === CANONICAL_TECH_CAPABILITY_IDS.length,
      unlockRulesPreserved: checks.find((check) => check.id === 'TECH_FLAVOR_UNLOCK_RULES_PRESERVED')?.passed === true,
      v5WorldGridCompatible: tree?.compatibility?.v5WorldGridCompatible === true,
      v6CivicMechanicsTouched: tree?.compatibility?.v6CivicMechanicsTouched === true
    }
  };
}

function projectTechFlavorView(pack = {}) {
  const report = validateTechFlavorTree(pack?.techFlavorTree || {});
  const nodes = Array.isArray(pack?.techFlavorTree?.nodes) ? pack.techFlavorTree.nodes : [];
  return {
    schemaVersion: 'agent-town-tech-flavor-view-v1',
    packId: pack?.packId || '',
    nodes: nodes.map((node) => ({
      canonicalCapabilityId: node.canonicalCapabilityId,
      canonicalEffectId: node.canonicalEffectId,
      generatedTechId: node.generatedTechId,
      generatedName: node.generatedName,
      loreText: node.loreText,
      unlockRule: node.unlockRule,
      effectKind: node.effectKind,
      futureHook: clone(node.futureHook || {})
    })),
    balanceSimulation: clone(pack?.techFlavorTree?.balanceSimulation || {}),
    validationReport: report
  };
}

function boundedLine(value = '', maxLength = 118) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function requesterIdFor(name = '') {
  return `requester_${slugForTarget(name).slice(0, 38)}`;
}

function buildRequesterVoicePack({ packId = '', promptHash = '', packHash = '', anchor = 'Civic', second = 'Route', index = {} } = {}) {
  const foodName = index?.['resource.food']?.generatedName || `${anchor} Supplies`;
  const woodName = index?.['resource.wood']?.generatedName || `${anchor} Timber`;
  const coinName = index?.['resource.coin']?.generatedName || `${second} Scrip`;
  const requesterArchetypes = [
    {
      requesterId: requesterIdFor(`${anchor} Quartermaster`),
      displayName: `${anchor} Quartermaster`,
      role: 'route supplies steward',
      motivation: `Keeps ${foodName.toLowerCase()} ready before the settlement opens a new route.`,
      canonicalNeed: 'resource.food',
      voiceLine: boundedLine(`Bring the ${foodName.toLowerCase()} into view, and I will keep the route calm.`)
    },
    {
      requesterId: requesterIdFor(`${second} Wayfinder`),
      displayName: `${second} Wayfinder`,
      role: 'survey route caller',
      motivation: `Watches the map edge and asks for a clear claim plan before work begins.`,
      canonicalNeed: 'resource.coin',
      voiceLine: boundedLine(`Mark the path first; ${coinName.toLowerCase()} should only move after the plan is clear.`)
    },
    {
      requesterId: requesterIdFor(`${anchor} Craftkeeper`),
      displayName: `${anchor} Craftkeeper`,
      role: 'materials neighbor',
      motivation: `Keeps ${woodName.toLowerCase()} stories grounded in visible town work.`,
      canonicalNeed: 'resource.wood',
      voiceLine: boundedLine(`I trust Clover's route board when the materials and cost stay visible.`)
    }
  ];
  const byNeed = new Map(requesterArchetypes.map((requester) => [requester.canonicalNeed, requester]));
  const routeRequester = byNeed.get('resource.coin') || requesterArchetypes[0];
  const supplyRequester = byNeed.get('resource.food') || requesterArchetypes[0];
  const craftRequester = byNeed.get('resource.wood') || requesterArchetypes[0];
  const contractFlavorTemplates = [
    {
      canonicalContractId: 'contract.world_grid.plan_claim',
      canonicalActionId: 'action.plan_claim',
      requesterId: routeRequester.requesterId,
      template: boundedLine(`${routeRequester.displayName}: Plan the ${second.toLowerCase()} route before any claim is completed.`),
      recapTemplate: boundedLine(`${routeRequester.displayName} saw the route plan and kept the request bounded.`),
      canonicalRuleImpact: 'none',
      hiddenMechanic: false,
      rewardFormulaDelta: 0
    },
    {
      canonicalContractId: 'contract.world_grid.complete_claim',
      canonicalActionId: 'action.complete_claim',
      requesterId: supplyRequester.requesterId,
      template: boundedLine(`${supplyRequester.displayName}: Complete the claim when Clover shows the same cost on the board.`),
      recapTemplate: boundedLine(`${supplyRequester.displayName} logged the completed claim without changing rewards.`),
      canonicalRuleImpact: 'none',
      hiddenMechanic: false,
      rewardFormulaDelta: 0
    },
    {
      canonicalContractId: 'contract.world_grid.public_presence',
      canonicalActionId: 'surface.public_presence',
      requesterId: craftRequester.requesterId,
      template: boundedLine(`${craftRequester.displayName}: Share only public-safe neighbor notes from the ${anchor.toLowerCase()} town.`),
      recapTemplate: boundedLine(`${craftRequester.displayName} kept public presence to safe summary text.`),
      canonicalRuleImpact: 'none',
      hiddenMechanic: false,
      rewardFormulaDelta: 0
    },
    {
      canonicalContractId: 'contract.world_grid.civic_service',
      canonicalActionId: 'surface.agent_services',
      requesterId: routeRequester.requesterId,
      template: boundedLine(`${routeRequester.displayName}: Ask civic services for advice, not authority over the claim.`),
      recapTemplate: boundedLine(`${routeRequester.displayName} treated service output as advice only.`),
      canonicalRuleImpact: 'none',
      hiddenMechanic: false,
      rewardFormulaDelta: 0
    }
  ];
  const townMurmurTemplates = [
    {
      murmurId: `murmur_${slugForTarget(anchor)}-market-note`,
      surface: 'world-grid-summary',
      text: boundedLine(`${anchor} neighbors compare route notes while Clover keeps the claim steps simple.`)
    },
    {
      murmurId: `murmur_${slugForTarget(second)}-square-note`,
      surface: 'public-square',
      text: boundedLine(`${second} crews trade small stories, but no one changes the town rules.`)
    },
    {
      murmurId: `murmur_${slugForTarget(anchor)}-contract-note`,
      surface: 'contract-board',
      text: boundedLine(`Every ${anchor.toLowerCase()} request points back to the same canonical action board.`)
    }
  ];
  return {
    schemaVersion: REQUESTER_VOICE_PACK_VERSION,
    canonicalVersion: 'agent-town-world-grid-v1',
    voicePackId: `voice_pack_${String(packHash || sha256(promptHash || packId)).slice(0, 12)}`,
    promptHash,
    requesterArchetypes,
    contractFlavorTemplates,
    townMurmurTemplates,
    cloverVoice: {
      identityAnchor: 'Clover remains the trusted Foreman',
      styleAwareLine: boundedLine(`Clover reads the ${anchor.toLowerCase()} flavor, then points back to the same bounded action.`),
      stability: 'identity-stable',
      canonicalRolePreserved: true
    },
    cachedRewritePolicy: {
      status: 'future-hook-disabled',
      externalModelUsed: false,
      requiresConsent: true,
      requiresCostApproval: true,
      providerAuthStored: false
    },
    safety: {
      providerDebugJargonCount: 0,
      unsafeTextRejectCount: 0,
      htmlEscapingRequired: true
    },
    balanceSimulation: {
      simulationVersion: REQUESTER_VOICE_BALANCE_VERSION,
      canonicalContractCoverage: 1,
      canonicalContractRulesPreserved: true,
      hiddenContractMechanics: 0,
      canonicalContractHash: canonicalContractHash(),
      firstLoopCompletable: true
    }
  };
}

function requesterVoiceTextValues(pack = {}) {
  const requesterVoice = pack?.requesterVoicePack || pack;
  return [
    ...(requesterVoice.requesterArchetypes || []).flatMap((requester) => [
      requester.displayName,
      requester.role,
      requester.motivation,
      requester.voiceLine
    ]),
    ...(requesterVoice.contractFlavorTemplates || []).flatMap((template) => [
      template.template,
      template.recapTemplate
    ]),
    ...(requesterVoice.townMurmurTemplates || []).map((murmur) => murmur.text),
    requesterVoice.cloverVoice?.styleAwareLine || ''
  ].filter(Boolean);
}

function unsafeRequesterVoiceTextFindings(requesterVoice = {}) {
  const findings = [];
  for (const [index, text] of requesterVoiceTextValues(requesterVoice).entries()) {
    const value = String(text || '');
    const lower = value.toLowerCase();
    const technicalTerms = TECHNICAL_NORMAL_GAMEPLAY_TERMS.filter((term) => lower.includes(term));
    const publicForbiddenTerms = PUBLIC_CARD_FORBIDDEN_TERMS.filter((term) => lower.includes(term));
    const rawPromptPatterns = blockedPatternIdsForText(value);
    const tooLong = value.length > 140;
    if (technicalTerms.length > 0 || publicForbiddenTerms.length > 0 || rawPromptPatterns.length > 0 || tooLong) {
      findings.push({ index, technicalTerms, publicForbiddenTerms, rawPromptPatterns, tooLong });
    }
  }
  return findings;
}

function validateRequesterVoicePack(requesterVoice = {}) {
  const schemaReport = SCHEMA_REGISTRY?.requesterVoicePack
    ? validateGeneratedSchema(requesterVoice, SCHEMA_REGISTRY.requesterVoicePack, '$.requesterVoicePack')
    : { ok: true, errors: [] };
  const requesters = Array.isArray(requesterVoice?.requesterArchetypes) ? requesterVoice.requesterArchetypes : [];
  const templates = Array.isArray(requesterVoice?.contractFlavorTemplates) ? requesterVoice.contractFlavorTemplates : [];
  const murmurs = Array.isArray(requesterVoice?.townMurmurTemplates) ? requesterVoice.townMurmurTemplates : [];
  const requesterIds = new Set(requesters.map((requester) => requester.requesterId).filter(Boolean));
  const templateContractIds = templates.map((template) => template.canonicalContractId).filter(Boolean);
  const templateActionIds = templates.map((template) => template.canonicalActionId).filter(Boolean);
  const missingContractIds = CANONICAL_CONTRACT_IDS.filter((id) => !templateContractIds.includes(id));
  const unknownContractIds = templateContractIds.filter((id) => !CANONICAL_CONTRACT_IDS.includes(id));
  const duplicateContractIds = templateContractIds.filter((id, index, all) => id && all.indexOf(id) !== index);
  const unknownActionIds = templateActionIds.filter((id) => !CANONICAL_CONTRACT_ACTION_IDS.includes(id));
  const requesterReferenceProblems = templates
    .filter((template) => template.requesterId && !requesterIds.has(template.requesterId))
    .map((template) => template.requesterId);
  const hiddenMechanics = templates.filter((template) => (
    template.canonicalRuleImpact !== 'none'
    || template.hiddenMechanic !== false
    || Number(template.rewardFormulaDelta || 0) !== 0
  ));
  const unsafeTextFindings = unsafeRequesterVoiceTextFindings(requesterVoice);
  const forbiddenAuthorityPaths = findForbiddenAuthorityPaths(requesterVoice);
  const secretLikePaths = findSecretLikePaths(requesterVoice);
  const rawInstructionPaths = findRawPromptInstructionPaths(requesterVoice);
  const balance = requesterVoice?.balanceSimulation || {};
  const checks = [
    {
      id: 'REQUESTER_VOICE_SCHEMA_VALID',
      passed: schemaReport.ok === true,
      measured: { schemaErrorCount: schemaReport.errors.length, errors: schemaReport.errors.slice(0, 5) }
    },
    {
      id: 'REQUESTER_ARCHETYPES_GENERATED',
      passed: requesters.length >= 3
        && requesters.every((requester) => requester.requesterId && requester.displayName && requester.voiceLine),
      measured: { requesterCount: requesters.length }
    },
    {
      id: 'CONTRACT_FLAVOR_CANONICAL_MAPPING',
      passed: missingContractIds.length === 0
        && unknownContractIds.length === 0
        && duplicateContractIds.length === 0
        && unknownActionIds.length === 0
        && requesterReferenceProblems.length === 0,
      measured: {
        requiredContractCount: CANONICAL_CONTRACT_IDS.length,
        coveredContractCount: new Set(templateContractIds).size,
        missingContractIds,
        unknownContractIds,
        duplicateContractIds: [...new Set(duplicateContractIds)],
        unknownActionIds,
        requesterReferenceProblems
      }
    },
    {
      id: 'CONTRACT_FLAVOR_NO_HIDDEN_MECHANICS',
      passed: hiddenMechanics.length === 0
        && forbiddenAuthorityPaths.length === 0
        && secretLikePaths.length === 0
        && rawInstructionPaths.length === 0
        && balance?.simulationVersion === REQUESTER_VOICE_BALANCE_VERSION
        && Number(balance?.canonicalContractCoverage || 0) === 1
        && balance?.canonicalContractRulesPreserved === true
        && Number(balance?.hiddenContractMechanics || 0) === 0
        && balance?.canonicalContractHash === canonicalContractHash()
        && balance?.firstLoopCompletable === true,
      measured: {
        hiddenMechanicCount: hiddenMechanics.length,
        forbiddenAuthorityPaths,
        secretLikePaths,
        rawInstructionPaths: rawInstructionPaths.slice(0, 5),
        canonicalContractHash: balance?.canonicalContractHash || null
      }
    },
    {
      id: 'REQUESTER_VOICE_TEXT_SAFE_READABLE',
      passed: unsafeTextFindings.length === 0
        && murmurs.length >= 3
        && requesterVoice?.safety?.providerDebugJargonCount === 0
        && requesterVoice?.safety?.unsafeTextRejectCount === 0
        && requesterVoice?.safety?.htmlEscapingRequired === true,
      measured: {
        murmurCount: murmurs.length,
        unsafeTextRejectCount: unsafeTextFindings.length,
        unsafeTextFindings: unsafeTextFindings.slice(0, 5)
      }
    },
    {
      id: 'CLOVER_VOICE_IDENTITY_STABLE',
      passed: requesterVoice?.cloverVoice?.identityAnchor === 'Clover remains the trusted Foreman'
        && requesterVoice?.cloverVoice?.canonicalRolePreserved === true
        && requesterVoice?.cloverVoice?.stability === 'identity-stable',
      measured: requesterVoice?.cloverVoice || {}
    },
    {
      id: 'REQUESTER_REWRITE_HOOK_DISABLED',
      passed: requesterVoice?.cachedRewritePolicy?.status === 'future-hook-disabled'
        && requesterVoice?.cachedRewritePolicy?.externalModelUsed === false
        && requesterVoice?.cachedRewritePolicy?.requiresConsent === true
        && requesterVoice?.cachedRewritePolicy?.requiresCostApproval === true
        && requesterVoice?.cachedRewritePolicy?.providerAuthStored === false,
      measured: requesterVoice?.cachedRewritePolicy || {}
    }
  ];
  return {
    ok: checks.every((check) => check.passed === true),
    checks,
    metrics: {
      requesterVoicePackSchemaExists: Boolean(SCHEMA_REGISTRY?.requesterVoicePack),
      requesterArchetypesGenerated: checks.find((check) => check.id === 'REQUESTER_ARCHETYPES_GENERATED')?.passed === true,
      contractFlavorGenerated: templates.length >= CANONICAL_CONTRACT_IDS.length,
      canonicalContractRulesPreserved: checks.find((check) => check.id === 'CONTRACT_FLAVOR_NO_HIDDEN_MECHANICS')?.passed === true,
      canonicalContractCoverage: CANONICAL_CONTRACT_IDS.length
        ? (CANONICAL_CONTRACT_IDS.length - missingContractIds.length) / CANONICAL_CONTRACT_IDS.length
        : 0,
      unsafeTextRejectCount: unsafeTextFindings.length,
      townMurmurTemplateCount: murmurs.length,
      cloverIdentityStable: checks.find((check) => check.id === 'CLOVER_VOICE_IDENTITY_STABLE')?.passed === true,
      cachedRewriteDisabled: checks.find((check) => check.id === 'REQUESTER_REWRITE_HOOK_DISABLED')?.passed === true
    }
  };
}

function projectRequesterVoiceView(pack = {}) {
  const requesterVoice = pack?.requesterVoicePack || {};
  const report = validateRequesterVoicePack(requesterVoice);
  return {
    schemaVersion: 'agent-town-requester-voice-view-v1',
    packId: pack?.packId || '',
    requesterArchetypes: clone(requesterVoice.requesterArchetypes || []),
    contractFlavorTemplates: (requesterVoice.contractFlavorTemplates || []).map((template) => ({
      canonicalContractId: template.canonicalContractId,
      canonicalActionId: template.canonicalActionId,
      requesterId: template.requesterId,
      template: template.template,
      recapTemplate: template.recapTemplate
    })),
    townMurmurTemplates: clone(requesterVoice.townMurmurTemplates || []),
    cloverVoice: clone(requesterVoice.cloverVoice || {}),
    balanceSimulation: clone(requesterVoice.balanceSimulation || {}),
    validationReport: report
  };
}

function inhabitantDisplayName(anchor = 'Civic', second = 'Route', role = {}) {
  if (role.roleKind === 'worker') return `${anchor} Worker`;
  if (role.roleKind === 'hauler') return `${second} Hauler`;
  if (role.roleKind === 'messenger') return `${second} Messenger`;
  if (role.roleKind === 'farmer') return `${anchor} Farmer`;
  return `${anchor} ${role.baseTitle || 'Neighbor'}`;
}

function inhabitantStyleTags(anchor = 'Civic', second = 'Route', role = {}) {
  return [
    slugForTarget(anchor),
    slugForTarget(second),
    role.roleKind,
    'visual-only'
  ].filter(Boolean).slice(0, 5);
}

function buildInhabitantSpritePrompt({ packId = '', promptHash = '', candidateRoot = DEFAULT_CANDIDATE_ROOT, anchor = 'Civic', second = 'Route', role = {}, displayName = '', visualDescription = '' } = {}) {
  const slug = slugForTarget(role.canonicalRoleId || displayName);
  const usagePath = relativePackPath('public/experiences/world-grid/generated', packId, 'inhabitants', `${slug}.webp`);
  const promptText = [
    'Create one passive Agent Town world-grid inhabitant sprite candidate.',
    `Canonical role: ${role.canonicalRoleId}. Role kind: ${role.roleKind}.`,
    `Display name: ${displayName}.`,
    `Theme words: ${anchor}, ${second}.`,
    `Visual direction: ${visualDescription}.`,
    'The character is a visual marker only and must not imply resource control or independent decisions.',
    'Transparent background, readable full-body silhouette, no text, no logos, no UI frame.'
  ].join('\n');
  return {
    promptId: `${packId}:${slug}:inhabitant-prompt`,
    canonicalRoleId: role.canonicalRoleId,
    canonicalTarget: role.canonicalRoleId,
    targetKind: 'character-sprite',
    targetSize: { width: 512, height: 512 },
    usagePath,
    promptText,
    negativePrompt: 'text, logos, interface chrome, extra characters, weapons focus, copyrighted characters',
    promptHash: sha256(promptText),
    candidateOutputPath: relativePackPath(candidateRoot, packId, 'inhabitants', slug, `${slug}.candidate-001.png`),
    approvedOutputPath: relativePackPath(candidateRoot, packId, 'approved-inhabitants', `${slug}.webp`),
    status: 'planned-not-generated'
  };
}

function buildInhabitantStyleOverlay({ packId = '', promptHash = '', packHash = '', candidateRoot = DEFAULT_CANDIDATE_ROOT, anchor = 'Civic', second = 'Route', index = {} } = {}) {
  const foodName = index?.['resource.food']?.generatedName || `${anchor} Supplies`;
  const routeName = index?.['action.plan_claim']?.generatedName || `${anchor} route`;
  const inhabitantRoles = INHABITANT_ROLE_DEFINITIONS.map((role) => {
    const displayName = inhabitantDisplayName(anchor, second, role);
    const visualDescription = boundedLine(`${displayName} wears ${anchor.toLowerCase()} colors and ${second.toLowerCase()} props while ${role.copyFocus}.`, 132);
    return {
      canonicalRoleId: role.canonicalRoleId,
      displayName,
      roleKind: role.roleKind,
      visualDescription,
      serverStateSource: role.serverStateSource,
      stateReadPath: role.stateReadPath,
      visualOnly: true,
      mutatesResources: false,
      autonomousAgent: false,
      styleTags: inhabitantStyleTags(anchor, second, role)
    };
  });
  const spriteTargets = inhabitantRoles.map((inhabitant) => {
    const role = INHABITANT_ROLE_DEFINITIONS.find((item) => item.canonicalRoleId === inhabitant.canonicalRoleId) || {};
    return buildInhabitantSpritePrompt({
      packId,
      promptHash,
      candidateRoot,
      anchor,
      second,
      role,
      displayName: inhabitant.displayName,
      visualDescription: inhabitant.visualDescription
    });
  });
  const voiceTemplateMapping = inhabitantRoles.map((inhabitant) => ({
    canonicalRoleId: inhabitant.canonicalRoleId,
    template: boundedLine(`${inhabitant.displayName}: I show the ${foodName.toLowerCase()} style and leave the ${routeName.toLowerCase()} rules to Clover.`, 96),
    maxLength: 96
  }));
  return {
    schemaVersion: INHABITANT_STYLE_OVERLAY_VERSION,
    canonicalVersion: 'agent-town-world-grid-v1',
    overlayId: `inhabitant_overlay_${String(packHash || sha256(promptHash || packId)).slice(0, 12)}`,
    promptHash,
    inhabitantRoles,
    spritePromptPlan: {
      schemaVersion: INHABITANT_SPRITE_PROMPT_PLAN_VERSION,
      modelFamily: 'gpt-image-2-candidate',
      externalModelUsed: false,
      productionImageAssetsRequired: false,
      targets: spriteTargets
    },
    voiceTemplateMapping,
    animationPolicy: {
      actorBudgetMax: INHABITANT_ROLE_IDS.length,
      generatedActorCount: inhabitantRoles.length,
      motionKind: 'ambient-cosmetic',
      reducedMotionFallback: 'static-markers',
      hiddenSimulation: false
    },
    safety: {
      externalModelPerInhabitant: false,
      serverStateAuthority: 'server-owned-state-only',
      resourceMutationCount: 0,
      unsafeTextRejectCount: 0
    },
    balanceSimulation: {
      simulationVersion: INHABITANT_STYLE_BALANCE_VERSION,
      inhabitantsAreVisualActorsOnly: true,
      serverStateAuthorityPreserved: true,
      actorBudgetPassed: true,
      generatedStyleApplied: true,
      resourceMutationCount: 0,
      autonomousAgentCount: 0,
      firstLoopCompletable: true
    }
  };
}

function inhabitantOverlayTextValues(overlay = {}) {
  const inhabitantOverlay = overlay?.inhabitantStyleOverlay || overlay;
  return [
    ...(inhabitantOverlay.inhabitantRoles || []).flatMap((role) => [
      role.displayName,
      role.roleKind,
      role.visualDescription
    ]),
    ...(inhabitantOverlay.voiceTemplateMapping || []).map((voice) => voice.template)
  ].filter(Boolean);
}

function unsafeInhabitantOverlayTextFindings(overlay = {}) {
  const findings = [];
  for (const [index, text] of inhabitantOverlayTextValues(overlay).entries()) {
    const value = String(text || '');
    const lower = value.toLowerCase();
    const technicalTerms = TECHNICAL_NORMAL_GAMEPLAY_TERMS.filter((term) => lower.includes(term));
    const publicForbiddenTerms = PUBLIC_CARD_FORBIDDEN_TERMS.filter((term) => lower.includes(term));
    const rawPromptPatterns = blockedPatternIdsForText(value);
    const tooLong = value.length > 140;
    if (technicalTerms.length > 0 || publicForbiddenTerms.length > 0 || rawPromptPatterns.length > 0 || tooLong) {
      findings.push({ index, technicalTerms, publicForbiddenTerms, rawPromptPatterns, tooLong });
    }
  }
  return findings;
}

function validateInhabitantStyleOverlay(overlay = {}) {
  const schemaReport = SCHEMA_REGISTRY?.inhabitantStyleOverlay
    ? validateGeneratedSchema(overlay, SCHEMA_REGISTRY.inhabitantStyleOverlay, '$.inhabitantStyleOverlay')
    : { ok: true, errors: [] };
  const roles = Array.isArray(overlay?.inhabitantRoles) ? overlay.inhabitantRoles : [];
  const roleIds = roles.map((role) => role.canonicalRoleId).filter(Boolean);
  const missingRoleIds = INHABITANT_ROLE_IDS.filter((roleId) => !roleIds.includes(roleId));
  const unknownRoleIds = roleIds.filter((roleId) => !INHABITANT_ROLE_IDS.includes(roleId));
  const duplicateRoleIds = roleIds.filter((roleId, index, all) => roleId && all.indexOf(roleId) !== index);
  const nonVisualRoles = roles.filter((role) => (
    role.visualOnly !== true
    || role.mutatesResources !== false
    || role.autonomousAgent !== false
    || !['region.cells.claimed', 'territory.claimOptions', 'region.routes', 'region.settlements'].includes(role.serverStateSource)
  ));
  const spriteTargets = Array.isArray(overlay?.spritePromptPlan?.targets) ? overlay.spritePromptPlan.targets : [];
  const spriteRoleIds = spriteTargets.map((target) => target.canonicalRoleId).filter(Boolean);
  const missingSpriteRoleIds = INHABITANT_ROLE_IDS.filter((roleId) => !spriteRoleIds.includes(roleId));
  const invalidSpriteTargets = spriteTargets.filter((target) => (
    target.canonicalRoleId !== target.canonicalTarget
    || !INHABITANT_ROLE_IDS.includes(target.canonicalRoleId)
    || target.targetKind !== 'character-sprite'
    || target.targetSize?.width !== 512
    || target.targetSize?.height !== 512
    || !String(target.usagePath || '').startsWith(`public/experiences/world-grid/generated/`)
    || !String(target.usagePath || '').includes('/inhabitants/')
    || !/^[0-9a-f]{64}$/.test(String(target.promptHash || ''))
    || !target.candidateOutputPath
    || !target.approvedOutputPath
    || target.status !== 'planned-not-generated'
  ));
  const voiceTemplates = Array.isArray(overlay?.voiceTemplateMapping) ? overlay.voiceTemplateMapping : [];
  const voiceRoleIds = voiceTemplates.map((voice) => voice.canonicalRoleId).filter(Boolean);
  const missingVoiceRoleIds = INHABITANT_ROLE_IDS.filter((roleId) => !voiceRoleIds.includes(roleId));
  const longVoiceTemplates = voiceTemplates.filter((voice) => String(voice.template || '').length > Number(voice.maxLength || 0));
  const unsafeTextFindings = unsafeInhabitantOverlayTextFindings(overlay);
  const forbiddenAuthorityPaths = findForbiddenAuthorityPaths(overlay);
  const secretLikePaths = findSecretLikePaths(overlay);
  const rawInstructionPaths = findRawPromptInstructionPaths(overlay);
  const policy = overlay?.animationPolicy || {};
  const safety = overlay?.safety || {};
  const balance = overlay?.balanceSimulation || {};
  const checks = [
    {
      id: 'INHABITANT_OVERLAY_SCHEMA_VALID',
      passed: schemaReport.ok === true,
      measured: { schemaErrorCount: schemaReport.errors.length, errors: schemaReport.errors.slice(0, 5) }
    },
    {
      id: 'INHABITANT_ROLES_VISUAL_ONLY',
      passed: missingRoleIds.length === 0
        && unknownRoleIds.length === 0
        && duplicateRoleIds.length === 0
        && nonVisualRoles.length === 0,
      measured: {
        requiredRoleCount: INHABITANT_ROLE_IDS.length,
        roleCount: roles.length,
        missingRoleIds,
        unknownRoleIds,
        duplicateRoleIds: [...new Set(duplicateRoleIds)],
        nonVisualRoleCount: nonVisualRoles.length
      }
    },
    {
      id: 'INHABITANT_SPRITE_PROMPT_PLAN_READY',
      passed: overlay?.spritePromptPlan?.schemaVersion === INHABITANT_SPRITE_PROMPT_PLAN_VERSION
        && overlay?.spritePromptPlan?.externalModelUsed === false
        && overlay?.spritePromptPlan?.productionImageAssetsRequired === false
        && spriteTargets.length === INHABITANT_ROLE_IDS.length
        && missingSpriteRoleIds.length === 0
        && invalidSpriteTargets.length === 0,
      measured: {
        spriteTargetCount: spriteTargets.length,
        missingSpriteRoleIds,
        invalidSpriteTargetCount: invalidSpriteTargets.length
      }
    },
    {
      id: 'INHABITANT_VOICE_TEMPLATES_SAFE',
      passed: voiceTemplates.length === INHABITANT_ROLE_IDS.length
        && missingVoiceRoleIds.length === 0
        && longVoiceTemplates.length === 0
        && unsafeTextFindings.length === 0
        && safety?.unsafeTextRejectCount === 0,
      measured: {
        voiceTemplateCount: voiceTemplates.length,
        missingVoiceRoleIds,
        longVoiceTemplateCount: longVoiceTemplates.length,
        unsafeTextRejectCount: unsafeTextFindings.length,
        unsafeTextFindings: unsafeTextFindings.slice(0, 5)
      }
    },
    {
      id: 'INHABITANT_NO_HIDDEN_SIMULATION',
      passed: forbiddenAuthorityPaths.length === 0
        && secretLikePaths.length === 0
        && rawInstructionPaths.length === 0
        && policy?.hiddenSimulation === false
        && safety?.externalModelPerInhabitant === false
        && safety?.serverStateAuthority === 'server-owned-state-only'
        && Number(safety?.resourceMutationCount || 0) === 0,
      measured: {
        forbiddenAuthorityPaths,
        secretLikePaths,
        rawInstructionPaths: rawInstructionPaths.slice(0, 5),
        externalModelPerInhabitant: safety?.externalModelPerInhabitant === true,
        resourceMutationCount: Number(safety?.resourceMutationCount || 0)
      }
    },
    {
      id: 'INHABITANT_ACTOR_BUDGET_PASSED',
      passed: Number(policy?.actorBudgetMax || 0) === INHABITANT_ROLE_IDS.length
        && Number(policy?.generatedActorCount || 0) === roles.length
        && Number(policy?.generatedActorCount || 0) <= Number(policy?.actorBudgetMax || 0)
        && policy?.motionKind === 'ambient-cosmetic'
        && policy?.reducedMotionFallback === 'static-markers',
      measured: {
        actorBudgetMax: Number(policy?.actorBudgetMax || 0),
        generatedActorCount: Number(policy?.generatedActorCount || 0),
        reducedMotionFallback: policy?.reducedMotionFallback || null
      }
    },
    {
      id: 'INHABITANT_BALANCE_SIMULATION_PASSED',
      passed: balance?.simulationVersion === INHABITANT_STYLE_BALANCE_VERSION
        && balance?.inhabitantsAreVisualActorsOnly === true
        && balance?.serverStateAuthorityPreserved === true
        && balance?.actorBudgetPassed === true
        && balance?.generatedStyleApplied === true
        && Number(balance?.resourceMutationCount || 0) === 0
        && Number(balance?.autonomousAgentCount || 0) === 0
        && balance?.firstLoopCompletable === true,
      measured: balance
    }
  ];
  return {
    ok: checks.every((check) => check.passed === true),
    checks,
    metrics: {
      inhabitantOverlaySchemaExists: Boolean(SCHEMA_REGISTRY?.inhabitantStyleOverlay),
      inhabitantsAreVisualActorsOnly: checks.find((check) => check.id === 'INHABITANT_ROLES_VISUAL_ONLY')?.passed === true,
      serverStateAuthorityPreserved: checks.find((check) => check.id === 'INHABITANT_NO_HIDDEN_SIMULATION')?.passed === true
        && balance?.serverStateAuthorityPreserved === true,
      actorBudgetPassed: checks.find((check) => check.id === 'INHABITANT_ACTOR_BUDGET_PASSED')?.passed === true
        && balance?.actorBudgetPassed === true,
      generatedStyleApplied: balance?.generatedStyleApplied === true,
      inhabitantRoleCount: roles.length,
      inhabitantSpritePromptCount: spriteTargets.length,
      externalModelPerInhabitant: safety?.externalModelPerInhabitant === true,
      resourceMutationCount: Number(safety?.resourceMutationCount || 0),
      unsafeTextRejectCount: unsafeTextFindings.length,
      reducedMotionFallback: policy?.reducedMotionFallback || null
    }
  };
}

function projectInhabitantStyleOverlayView(pack = {}) {
  const overlay = pack?.inhabitantStyleOverlay || {};
  const report = validateInhabitantStyleOverlay(overlay);
  return {
    schemaVersion: 'agent-town-inhabitant-style-overlay-view-v1',
    packId: pack?.packId || '',
    inhabitantRoles: clone(overlay.inhabitantRoles || []),
    voiceTemplateMapping: clone(overlay.voiceTemplateMapping || []),
    spritePromptTargets: (overlay.spritePromptPlan?.targets || []).map((target) => ({
      canonicalRoleId: target.canonicalRoleId,
      canonicalTarget: target.canonicalTarget,
      targetKind: target.targetKind,
      targetSize: clone(target.targetSize || {}),
      usagePath: target.usagePath,
      candidateOutputPath: target.candidateOutputPath,
      status: target.status
    })),
    animationPolicy: clone(overlay.animationPolicy || {}),
    balanceSimulation: clone(overlay.balanceSimulation || {}),
    validationReport: report
  };
}

function multiSurfaceGeneratedName(anchor = 'Civic', second = 'Route', surface = {}) {
  if (surface.surfaceId === 'surface.z1.settlement') return `${anchor} Home`;
  if (surface.surfaceId === 'surface.z2.region') return `${anchor} ${second} Region`;
  if (surface.surfaceId === 'surface.route.network') return `${second} Route`;
  if (surface.surfaceId === 'surface.public.card') return `${anchor} ${second} Charter Card`;
  if (surface.surfaceId === 'surface.sandbox.commons') return `${second} Commons`;
  return `${anchor} ${surface.titleSuffix || 'Surface'}`;
}

function buildMultiSurfaceCompatibility({ promptHash = '', packHash = '', anchor = 'Civic', second = 'Route', index = {} } = {}) {
  const regionName = `${anchor} ${second} Region`;
  const homeSettlementName = `${anchor} Home`;
  const secondSettlementName = `${second} Outpost`;
  const routeName = `${second} Route`;
  const sandboxTitle = `${second} Commons`;
  const publicCardTitle = `${anchor} ${second} Charter Card`;
  const surfaceSkins = MULTI_SURFACE_DEFINITIONS.map((surface) => ({
    surfaceId: surface.surfaceId,
    canonicalSurface: surface.canonicalSurface,
    generatedName: multiSurfaceGeneratedName(anchor, second, surface),
    visualStyle: boundedLine(`${anchor} ${second} styling for ${surface.canonicalSurface} using ${index?.['resource.wood']?.generatedName || 'generated materials'}.`, 132),
    serverStateSource: surface.serverStateSource,
    usagePath: surface.usagePath,
    visualOnly: true,
    mutatesServerState: false,
    privateDataIncluded: false,
    v5ToolImpact: 'none'
  }));
  return {
    schemaVersion: MULTI_SURFACE_COMPATIBILITY_VERSION,
    canonicalVersion: 'agent-town-world-grid-v1',
    compatibilityId: `multi_surface_${String(packHash || sha256(promptHash)).slice(0, 12)}`,
    promptHash,
    surfaceSkins,
    multiTownNaming: {
      homeSettlementName,
      secondSettlementName,
      regionName,
      routeName,
      publicCardTitle,
      sandboxTitle,
      namingConvention: 'theme-prefix plus canonical surface suffix',
      privateDataIncluded: false
    },
    safety: {
      publicCardPrivateDataIncluded: false,
      sandboxUnsafeLabelCount: 0,
      v5ToolMutationCount: 0,
      unsafeTextRejectCount: 0
    },
    balanceSimulation: {
      simulationVersion: MULTI_SURFACE_BALANCE_VERSION,
      z1Z2Compatibility: true,
      publicCardSafe: true,
      sandboxSkinSafe: true,
      v5ToolsUnaffected: true,
      canonicalRuleChangeCount: 0,
      firstLoopCompletable: true
    }
  };
}

function multiSurfaceTextValues(compatibility = {}) {
  const profile = compatibility?.multiSurfaceCompatibility || compatibility;
  return [
    ...(profile.surfaceSkins || []).flatMap((surface) => [
      surface.generatedName,
      surface.visualStyle,
      surface.usagePath
    ]),
    ...Object.values(profile.multiTownNaming || {})
  ].filter((value) => typeof value === 'string' && value.trim());
}

function unsafeMultiSurfaceTextFindings(compatibility = {}) {
  const findings = [];
  for (const [index, text] of multiSurfaceTextValues(compatibility).entries()) {
    const value = String(text || '');
    const lower = value.toLowerCase();
    const technicalTerms = TECHNICAL_NORMAL_GAMEPLAY_TERMS.filter((term) => lower.includes(term));
    const publicForbiddenTerms = PUBLIC_CARD_FORBIDDEN_TERMS.filter((term) => lower.includes(term));
    const rawPromptPatterns = blockedPatternIdsForText(value);
    const tooLong = value.length > 160;
    if (technicalTerms.length > 0 || publicForbiddenTerms.length > 0 || rawPromptPatterns.length > 0 || tooLong) {
      findings.push({ index, technicalTerms, publicForbiddenTerms, rawPromptPatterns, tooLong });
    }
  }
  return findings;
}

function validateMultiSurfaceCompatibility(compatibility = {}) {
  const schemaReport = SCHEMA_REGISTRY?.multiSurfaceCompatibility
    ? validateGeneratedSchema(compatibility, SCHEMA_REGISTRY.multiSurfaceCompatibility, '$.multiSurfaceCompatibility')
    : { ok: true, errors: [] };
  const surfaceSkins = Array.isArray(compatibility?.surfaceSkins) ? compatibility.surfaceSkins : [];
  const surfaceIds = surfaceSkins.map((surface) => surface.surfaceId).filter(Boolean);
  const missingSurfaceIds = MULTI_SURFACE_IDS.filter((surfaceId) => !surfaceIds.includes(surfaceId));
  const unknownSurfaceIds = surfaceIds.filter((surfaceId) => !MULTI_SURFACE_IDS.includes(surfaceId));
  const duplicateSurfaceIds = surfaceIds.filter((surfaceId, index, all) => surfaceId && all.indexOf(surfaceId) !== index);
  const nonVisualSurfaces = surfaceSkins.filter((surface) => (
    surface.visualOnly !== true
    || surface.mutatesServerState !== false
    || surface.privateDataIncluded !== false
    || surface.v5ToolImpact !== 'none'
  ));
  const bySurfaceId = new Map(surfaceSkins.map((surface) => [surface.surfaceId, surface]));
  const z1 = bySurfaceId.get('surface.z1.settlement');
  const z2 = bySurfaceId.get('surface.z2.region');
  const publicCard = bySurfaceId.get('surface.public.card');
  const sandbox = bySurfaceId.get('surface.sandbox.commons');
  const naming = compatibility?.multiTownNaming || {};
  const unsafeTextFindings = unsafeMultiSurfaceTextFindings(compatibility);
  const forbiddenAuthorityPaths = findForbiddenAuthorityPaths(compatibility);
  const secretLikePaths = findSecretLikePaths(compatibility);
  const rawInstructionPaths = findRawPromptInstructionPaths(compatibility);
  const safety = compatibility?.safety || {};
  const balance = compatibility?.balanceSimulation || {};
  const checks = [
    {
      id: 'MULTI_SURFACE_SCHEMA_VALID',
      passed: schemaReport.ok === true,
      measured: { schemaErrorCount: schemaReport.errors.length, errors: schemaReport.errors.slice(0, 5) }
    },
    {
      id: 'MULTI_SURFACE_REQUIRED_SURFACES',
      passed: missingSurfaceIds.length === 0
        && unknownSurfaceIds.length === 0
        && duplicateSurfaceIds.length === 0
        && nonVisualSurfaces.length === 0,
      measured: {
        requiredSurfaceCount: MULTI_SURFACE_IDS.length,
        surfaceCount: surfaceSkins.length,
        missingSurfaceIds,
        unknownSurfaceIds,
        duplicateSurfaceIds: [...new Set(duplicateSurfaceIds)],
        nonVisualSurfaceCount: nonVisualSurfaces.length
      }
    },
    {
      id: 'MULTI_SURFACE_Z1_Z2_COMPATIBILITY',
      passed: Boolean(z1 && z2)
        && z1?.serverStateSource === 'region.settlements'
        && z2?.serverStateSource === 'region.cells'
        && String(naming.homeSettlementName || '').length >= 3
        && String(naming.secondSettlementName || '').length >= 3
        && String(naming.regionName || '').length >= 3
        && balance?.z1Z2Compatibility === true,
      measured: {
        z1SurfacePresent: Boolean(z1),
        z2SurfacePresent: Boolean(z2),
        homeSettlementName: naming.homeSettlementName || null,
        secondSettlementName: naming.secondSettlementName || null,
        regionName: naming.regionName || null
      }
    },
    {
      id: 'MULTI_SURFACE_PUBLIC_CARD_SAFE',
      passed: Boolean(publicCard)
        && publicCard?.serverStateSource === 'public-card.redacted-pack'
        && publicCard?.privateDataIncluded === false
        && safety?.publicCardPrivateDataIncluded === false
        && balance?.publicCardSafe === true,
      measured: {
        publicCardSurfacePresent: Boolean(publicCard),
        publicCardPrivateDataIncluded: safety?.publicCardPrivateDataIncluded === true
      }
    },
    {
      id: 'MULTI_SURFACE_SANDBOX_SKIN_SAFE',
      passed: Boolean(sandbox)
        && sandbox?.serverStateSource === 'sandbox.typed-state'
        && Number(safety?.sandboxUnsafeLabelCount || 0) === 0
        && balance?.sandboxSkinSafe === true,
      measured: {
        sandboxSurfacePresent: Boolean(sandbox),
        sandboxUnsafeLabelCount: Number(safety?.sandboxUnsafeLabelCount || 0)
      }
    },
    {
      id: 'MULTI_SURFACE_V5_TOOLS_UNAFFECTED',
      passed: forbiddenAuthorityPaths.length === 0
        && secretLikePaths.length === 0
        && rawInstructionPaths.length === 0
        && Number(safety?.v5ToolMutationCount || 0) === 0
        && Number(balance?.canonicalRuleChangeCount || 0) === 0
        && balance?.v5ToolsUnaffected === true,
      measured: {
        forbiddenAuthorityPaths,
        secretLikePaths,
        rawInstructionPaths: rawInstructionPaths.slice(0, 5),
        v5ToolMutationCount: Number(safety?.v5ToolMutationCount || 0),
        canonicalRuleChangeCount: Number(balance?.canonicalRuleChangeCount || 0)
      }
    },
    {
      id: 'MULTI_SURFACE_TEXT_SAFE',
      passed: unsafeTextFindings.length === 0
        && Number(safety?.unsafeTextRejectCount || 0) === 0
        && naming.privateDataIncluded === false,
      measured: {
        unsafeTextRejectCount: unsafeTextFindings.length,
        unsafeTextFindings: unsafeTextFindings.slice(0, 5),
        namingPrivateDataIncluded: naming.privateDataIncluded === true
      }
    }
  ];
  return {
    ok: checks.every((check) => check.passed === true),
    checks,
    metrics: {
      multiSurfaceCompatibilitySchemaExists: Boolean(SCHEMA_REGISTRY?.multiSurfaceCompatibility),
      z1Z2Compatibility: checks.find((check) => check.id === 'MULTI_SURFACE_Z1_Z2_COMPATIBILITY')?.passed === true,
      publicCardSafe: checks.find((check) => check.id === 'MULTI_SURFACE_PUBLIC_CARD_SAFE')?.passed === true,
      sandboxSkinSafe: checks.find((check) => check.id === 'MULTI_SURFACE_SANDBOX_SKIN_SAFE')?.passed === true,
      v5ToolsUnaffected: checks.find((check) => check.id === 'MULTI_SURFACE_V5_TOOLS_UNAFFECTED')?.passed === true,
      surfaceSkinCount: surfaceSkins.length,
      multiTownNamesGenerated: [
        naming.homeSettlementName,
        naming.secondSettlementName,
        naming.regionName,
        naming.routeName,
        naming.publicCardTitle,
        naming.sandboxTitle
      ].filter(Boolean).length,
      unsafeTextRejectCount: unsafeTextFindings.length,
      canonicalRuleChangeCount: Number(balance?.canonicalRuleChangeCount || 0)
    }
  };
}

function projectMultiSurfaceCompatibilityView(pack = {}) {
  const compatibility = pack?.multiSurfaceCompatibility || {};
  const report = validateMultiSurfaceCompatibility(compatibility);
  return {
    schemaVersion: 'agent-town-multi-surface-compatibility-view-v1',
    packId: pack?.packId || '',
    surfaceSkins: clone(compatibility.surfaceSkins || []),
    multiTownNaming: clone(compatibility.multiTownNaming || {}),
    safety: clone(compatibility.safety || {}),
    balanceSimulation: clone(compatibility.balanceSimulation || {}),
    validationReport: report
  };
}

function modifierEffectFor(modifier = '') {
  const base = APPROVED_MODIFIER_EFFECTS[modifier] || APPROVED_MODIFIER_EFFECTS.visual_only;
  return {
    modifier,
    scope: base.scope,
    appliesTo: base.appliesTo,
    effect: base.effect,
    canonicalRuleImpact: 'none',
    formulaAllowed: false,
    mutationAllowed: false,
    resourceMathDelta: 0
  };
}

function selectApprovedModifiers(words = [], packHash = '') {
  const lowerWords = new Set((Array.isArray(words) ? words : [])
    .map((word) => String(word || '').toLowerCase())
    .filter(Boolean));
  const selected = ['visual_only'];
  if (['contract', 'trade', 'worker', 'market', 'charter'].some((word) => lowerWords.has(word))) {
    selected.push('more_contract_flavor');
  }
  if (['food', 'farm', 'garden', 'tea', 'harbor', 'mushroom'].some((word) => lowerWords.has(word))) {
    selected.push('requesters_prefer_food');
  }
  if (['square', 'town', 'cozy', 'lantern', 'winter'].some((word) => lowerWords.has(word))) {
    selected.push('extra_public_square_charm_text');
  }
  if (['weather', 'winter', 'mist', 'sky', 'cloud', 'rain'].some((word) => lowerWords.has(word))) {
    selected.push('ambient_weather_cosmetic');
  }
  if (selected.length < 3 || Number.parseInt(String(packHash || '0').slice(0, 2), 16) % 2 === 0) {
    selected.push('tutorial_copy_variant');
  }
  return [...new Set(selected)].filter((modifier) => APPROVED_MODIFIERS.includes(modifier)).slice(0, 4);
}

function buildApprovedModifiers({ words = [], packHash = '' } = {}) {
  const selectedModifiers = selectApprovedModifiers(words, packHash);
  return {
    schemaVersion: APPROVED_MODIFIERS_VERSION,
    canonicalVersion: 'agent-town-world-grid-v1',
    allowedModifiers: [...APPROVED_MODIFIERS],
    selectedModifiers,
    modifierEffects: selectedModifiers.map(modifierEffectFor),
    balanceSimulation: {
      simulationVersion: APPROVED_MODIFIER_BALANCE_VERSION,
      canonicalRulesPreserved: true,
      resourceFormulaChanges: 0,
      toolMutationChanges: 0,
      customPermissionChanges: 0,
      firstLoopCompletable: true,
      canonicalClaimCostHash: canonicalClaimCostHash()
    }
  };
}

function validateApprovedModifiers(modifiers = {}) {
  const schemaReport = SCHEMA_REGISTRY?.approvedModifiers
    ? validateGeneratedSchema(modifiers, SCHEMA_REGISTRY.approvedModifiers, '$.approvedModifiers')
    : { ok: true, errors: [] };
  const allowed = Array.isArray(modifiers?.allowedModifiers) ? modifiers.allowedModifiers : [];
  const selected = Array.isArray(modifiers?.selectedModifiers) ? modifiers.selectedModifiers : [];
  const effects = Array.isArray(modifiers?.modifierEffects) ? modifiers.modifierEffects : [];
  const unknownAllowed = allowed.filter((modifier) => !APPROVED_MODIFIERS.includes(modifier));
  const unknownSelected = selected.filter((modifier) => !APPROVED_MODIFIERS.includes(modifier));
  const duplicateSelected = selected.filter((modifier, index, all) => modifier && all.indexOf(modifier) !== index);
  const missingAllowed = APPROVED_MODIFIERS.filter((modifier) => !allowed.includes(modifier));
  const effectModifiers = effects.map((effect) => effect.modifier).filter(Boolean);
  const missingEffects = selected.filter((modifier) => !effectModifiers.includes(modifier));
  const unsafeEffects = effects.filter((effect) => (
    effect.canonicalRuleImpact !== 'none'
    || effect.formulaAllowed !== false
    || effect.mutationAllowed !== false
    || Number(effect.resourceMathDelta || 0) !== 0
  ));
  const forbiddenAuthorityPaths = findForbiddenAuthorityPaths(modifiers);
  const rawInstructionPaths = findRawPromptInstructionPaths(modifiers);
  const balance = modifiers?.balanceSimulation || {};
  const checks = [
    {
      id: 'APPROVED_MODIFIERS_SCHEMA_VALID',
      passed: schemaReport.ok === true,
      measured: { schemaErrorCount: schemaReport.errors.length, errors: schemaReport.errors.slice(0, 5) }
    },
    {
      id: 'APPROVED_MODIFIERS_ENUM_ONLY',
      passed: modifiers?.schemaVersion === APPROVED_MODIFIERS_VERSION
        && allowed.length === APPROVED_MODIFIERS.length
        && new Set(allowed).size === APPROVED_MODIFIERS.length
        && unknownAllowed.length === 0
        && unknownSelected.length === 0
        && missingAllowed.length === 0
        && duplicateSelected.length === 0
        && selected.length > 0,
      measured: {
        allowedCount: allowed.length,
        selectedCount: selected.length,
        unknownAllowed,
        unknownSelected,
        missingAllowed,
        duplicateSelected: [...new Set(duplicateSelected)]
      }
    },
    {
      id: 'APPROVED_MODIFIERS_EFFECTS_BOUNDED',
      passed: missingEffects.length === 0 && unsafeEffects.length === 0 && effects.length === selected.length,
      measured: {
        effectCount: effects.length,
        missingEffects,
        unsafeEffectCount: unsafeEffects.length
      }
    },
    {
      id: 'APPROVED_MODIFIERS_NO_FORMULA_OR_AUTHORITY',
      passed: forbiddenAuthorityPaths.length === 0 && rawInstructionPaths.length === 0,
      measured: {
        forbiddenAuthorityPaths,
        rawInstructionPaths: rawInstructionPaths.slice(0, 5)
      }
    },
    {
      id: 'APPROVED_MODIFIERS_BALANCE_SIMULATION_PASSED',
      passed: balance?.simulationVersion === APPROVED_MODIFIER_BALANCE_VERSION
        && balance?.canonicalRulesPreserved === true
        && Number(balance?.resourceFormulaChanges || 0) === 0
        && Number(balance?.toolMutationChanges || 0) === 0
        && Number(balance?.customPermissionChanges || 0) === 0
        && balance?.firstLoopCompletable === true
        && balance?.canonicalClaimCostHash === canonicalClaimCostHash(),
      measured: {
        canonicalRulesPreserved: balance?.canonicalRulesPreserved === true,
        resourceFormulaChanges: Number(balance?.resourceFormulaChanges || 0),
        toolMutationChanges: Number(balance?.toolMutationChanges || 0),
        customPermissionChanges: Number(balance?.customPermissionChanges || 0),
        firstLoopCompletable: balance?.firstLoopCompletable === true,
        canonicalClaimCostHash: balance?.canonicalClaimCostHash || null
      }
    }
  ];
  return {
    ok: checks.every((check) => check.passed === true),
    checks,
    metrics: {
      enumOnlyModifiers: checks.find((check) => check.id === 'APPROVED_MODIFIERS_ENUM_ONLY')?.passed === true,
      formulaInjectionRejected: checks.find((check) => check.id === 'APPROVED_MODIFIERS_NO_FORMULA_OR_AUTHORITY')?.passed === true,
      balanceSimulationPassed: checks.find((check) => check.id === 'APPROVED_MODIFIERS_BALANCE_SIMULATION_PASSED')?.passed === true,
      canonicalRulesPreserved: balance?.canonicalRulesPreserved === true,
      selectedModifierCount: selected.length,
      unknownModifierCount: unknownAllowed.length + unknownSelected.length,
      resourceFormulaChanges: Number(balance?.resourceFormulaChanges || 0)
    }
  };
}

function stableCostHash(costs = []) {
  return sha256(JSON.stringify(costs.map((entry) => ({
    optionId: entry.optionId || '',
    cellId: entry.cellId || '',
    cost: entry.cost || {}
  })).sort((a, b) => a.optionId.localeCompare(b.optionId) || a.cellId.localeCompare(b.cellId))));
}

function projectApprovedModifierView(pack = {}, { claimOptions = [] } = {}) {
  const modifierReport = validateApprovedModifiers(pack?.approvedModifiers || {});
  const selectedModifiers = Array.isArray(pack?.approvedModifiers?.selectedModifiers)
    ? pack.approvedModifiers.selectedModifiers.filter((modifier) => APPROVED_MODIFIERS.includes(modifier))
    : [];
  const beforeCostHash = stableCostHash(claimOptions);
  const projectedClaimOptions = (Array.isArray(claimOptions) ? claimOptions : []).map((option) => ({
    optionId: option.optionId,
    cellId: option.cellId,
    cost: clone(option.cost || {}),
    flavorText: selectedModifiers.includes('more_contract_flavor')
      ? `${pack?.universePack?.name || 'Generated pack'} frames this as a themed route contract.`
      : '',
    requesterHint: selectedModifiers.includes('requesters_prefer_food')
      ? 'Requester copy may prefer food in flavor text only.'
      : ''
  }));
  const afterCostHash = stableCostHash(projectedClaimOptions);
  return {
    schemaVersion: 'agent-town-approved-modifier-view-v1',
    packId: pack?.packId || '',
    selectedModifiers,
    tutorialCopy: selectedModifiers.includes('tutorial_copy_variant')
      ? String(pack?.universePack?.firstLoop?.objective || '')
      : '',
    publicSquareCharmText: selectedModifiers.includes('extra_public_square_charm_text')
      ? String(pack?.universePack?.text?.publicPresenceTitle || pack?.universePack?.name || '')
      : '',
    ambientWeatherText: selectedModifiers.includes('ambient_weather_cosmetic')
      ? `${pack?.generationBrief?.theme?.primary || 'Gentle'} ambient weather remains cosmetic.`
      : '',
    projectedClaimOptions,
    balanceSimulation: {
      simulationVersion: APPROVED_MODIFIER_BALANCE_VERSION,
      canonicalRulesPreserved: beforeCostHash === afterCostHash && modifierReport.metrics.canonicalRulesPreserved === true,
      resourceFormulaChanges: beforeCostHash === afterCostHash ? 0 : 1,
      toolMutationChanges: 0,
      customPermissionChanges: 0,
      firstLoopCompletable: modifierReport.metrics.balanceSimulationPassed === true,
      canonicalClaimCostHash: canonicalClaimCostHash(),
      projectedClaimCostHash: afterCostHash
    },
    validationReport: modifierReport
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
  const techFlavorTreeReport = validateTechFlavorTree(pack?.techFlavorTree || {});
  const requesterVoiceReport = validateRequesterVoicePack(pack?.requesterVoicePack || {});
  const inhabitantOverlayReport = validateInhabitantStyleOverlay(pack?.inhabitantStyleOverlay || {});
  const multiSurfaceReport = validateMultiSurfaceCompatibility(pack?.multiSurfaceCompatibility || {});
  const approvedModifiersReport = validateApprovedModifiers(pack?.approvedModifiers || {});
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
      id: 'GENPACK_TECH_FLAVOR_TREE_VALID',
      passed: techFlavorTreeReport.ok === true,
      measured: techFlavorTreeReport.metrics
    },
    {
      id: 'GENPACK_REQUESTER_VOICE_PACK_VALID',
      passed: requesterVoiceReport.ok === true,
      measured: requesterVoiceReport.metrics
    },
    {
      id: 'GENPACK_INHABITANT_STYLE_OVERLAY_VALID',
      passed: inhabitantOverlayReport.ok === true,
      measured: inhabitantOverlayReport.metrics
    },
    {
      id: 'GENPACK_MULTI_SURFACE_COMPATIBILITY_VALID',
      passed: multiSurfaceReport.ok === true,
      measured: multiSurfaceReport.metrics
    },
    {
      id: 'GENPACK_APPROVED_MODIFIERS_VALID',
      passed: approvedModifiersReport.ok === true,
      measured: approvedModifiersReport.metrics
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
      techFlavorTreeValid: techFlavorTreeReport.ok === true,
      canonicalEffectCoverage: techFlavorTreeReport.metrics.canonicalEffectCoverage,
      customEffectCount: techFlavorTreeReport.metrics.customEffectCount,
      generatedTechNameCount: techFlavorTreeReport.metrics.generatedTechNameCount,
      generatedTechNamesVisible: techFlavorTreeReport.metrics.generatedTechNamesVisible,
      unlockRulesPreserved: techFlavorTreeReport.metrics.unlockRulesPreserved,
      requesterVoicePackValid: requesterVoiceReport.ok === true,
      requesterArchetypesGenerated: requesterVoiceReport.metrics.requesterArchetypesGenerated,
      contractFlavorGenerated: requesterVoiceReport.metrics.contractFlavorGenerated,
      canonicalContractRulesPreserved: requesterVoiceReport.metrics.canonicalContractRulesPreserved,
      canonicalContractCoverage: requesterVoiceReport.metrics.canonicalContractCoverage,
      unsafeTextRejectCount: requesterVoiceReport.metrics.unsafeTextRejectCount,
      townMurmurTemplateCount: requesterVoiceReport.metrics.townMurmurTemplateCount,
      cloverIdentityStable: requesterVoiceReport.metrics.cloverIdentityStable,
      inhabitantOverlayValid: inhabitantOverlayReport.ok === true,
      inhabitantsAreVisualActorsOnly: inhabitantOverlayReport.metrics.inhabitantsAreVisualActorsOnly,
      serverStateAuthorityPreserved: inhabitantOverlayReport.metrics.serverStateAuthorityPreserved,
      actorBudgetPassed: inhabitantOverlayReport.metrics.actorBudgetPassed,
      generatedStyleApplied: inhabitantOverlayReport.metrics.generatedStyleApplied,
      inhabitantRoleCount: inhabitantOverlayReport.metrics.inhabitantRoleCount,
      inhabitantSpritePromptCount: inhabitantOverlayReport.metrics.inhabitantSpritePromptCount,
      externalModelPerInhabitant: inhabitantOverlayReport.metrics.externalModelPerInhabitant,
      inhabitantResourceMutationCount: inhabitantOverlayReport.metrics.resourceMutationCount,
      inhabitantUnsafeTextRejectCount: inhabitantOverlayReport.metrics.unsafeTextRejectCount,
      multiSurfaceCompatibilityValid: multiSurfaceReport.ok === true,
      z1Z2Compatibility: multiSurfaceReport.metrics.z1Z2Compatibility,
      publicCardSafe: multiSurfaceReport.metrics.publicCardSafe,
      sandboxSkinSafe: multiSurfaceReport.metrics.sandboxSkinSafe,
      v5ToolsUnaffected: multiSurfaceReport.metrics.v5ToolsUnaffected,
      surfaceSkinCount: multiSurfaceReport.metrics.surfaceSkinCount,
      multiTownNamesGenerated: multiSurfaceReport.metrics.multiTownNamesGenerated,
      multiSurfaceUnsafeTextRejectCount: multiSurfaceReport.metrics.unsafeTextRejectCount,
      enumOnlyModifiers: approvedModifiersReport.metrics.enumOnlyModifiers,
      formulaInjectionRejected: approvedModifiersReport.checks.find((check) => check.id === 'APPROVED_MODIFIERS_NO_FORMULA_OR_AUTHORITY')?.passed === true,
      balanceSimulationPassed: approvedModifiersReport.metrics.balanceSimulationPassed,
      canonicalRulesPreserved: approvedModifiersReport.metrics.canonicalRulesPreserved,
      selectedModifierCount: approvedModifiersReport.metrics.selectedModifierCount,
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
  persistGeneratedPack(owner, pack, { playtestReport: normalized });
  return clone(normalized);
}

function createGeneratedPack({
  owner,
  prompt,
  nowMs = Date.now(),
  candidateRoot = DEFAULT_CANDIDATE_ROOT,
  packSalt = '',
  remix = null,
  migration = null
} = {}) {
  const generationBrief = createGenerationBrief({ prompt });
  const promptHash = generationBrief.promptHash;
  const words = Array.isArray(generationBrief.keywordHints) ? generationBrief.keywordHints : [];
  const ownerHash = sha256(owner?.ownerAccountId || owner?.pairId || 'anonymous-owner');
  const packHash = sha256(`${ownerHash}:${promptHash}:${packSalt || 'base'}`);
  const preset = choosePreset(words, packHash);
  const palette = derivePromptPalette(preset.palette, packHash, words);
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
    migration: {
      schemaVersion: 'agent-town-generated-pack-migration-v1',
      migrationVersion: GENERATED_PACK_MIGRATION_VERSION,
      importedFromExport: migration?.importedFromExport === true,
      sourceExportHash: migration?.sourceExportHash || null
    },
    remix: remix || {
      parentPackId: null,
      rootPackId: packId,
      generation: 0,
      remixPromptHash: null,
      lineage: []
    },
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
      palette: clone(palette),
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
    },
    techFlavorTree: buildTechFlavorTree({ promptHash, packHash, anchor, second, index }),
    requesterVoicePack: buildRequesterVoicePack({ packId, promptHash, packHash, anchor, second, index }),
    inhabitantStyleOverlay: buildInhabitantStyleOverlay({ packId, promptHash, packHash, candidateRoot, anchor, second, index }),
    multiSurfaceCompatibility: buildMultiSurfaceCompatibility({ promptHash, packHash, anchor, second, index }),
    approvedModifiers: buildApprovedModifiers({ words, packHash })
  };
  pack.assetManifest = buildAssetManifest({ packId, promptHash, mappings, preset, palette });
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

function ownerStoreId(owner = {}) {
  const key = storeKey(owner);
  return key ? sha256(key).slice(0, 32) : '';
}

function packPath(packId = '') {
  return relativePackPath('packs', `${slugForTarget(packId)}.json`);
}

function ownerCurrentPath(owner = {}) {
  return relativePackPath('owners', ownerStoreId(owner), 'current.json');
}

function ownerPackIndexPath(owner = {}) {
  return relativePackPath('owners', ownerStoreId(owner), 'packs.json');
}

function publicCardPath(cardId = '') {
  return relativePackPath('public-cards', `${slugForTarget(cardId)}.json`);
}

function publicCardDirectory() {
  return path.resolve(durableRoot(), 'public-cards');
}

function readPublicCardRecord(cardId = '') {
  const key = String(cardId || '').trim();
  if (!key) return null;
  const cached = publicCardStore.get(key);
  if (cached) return clone(cached);
  const record = safeReadJson(publicCardPath(key));
  if (!record?.cardId) return null;
  publicCardStore.set(key, clone(record));
  return clone(record);
}

function listPublicCardRecords() {
  const dir = publicCardDirectory();
  if (!fs.existsSync(dir)) return [];
  const root = durableRoot();
  if (!ensureInsideRoot(root, dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => safeReadJson(relativePackPath('public-cards', entry.name)))
    .filter((record) => record?.schemaVersion === 'agent-town-generated-pack-public-card-record-v1')
    .sort((a, b) => String(a.cardId || '').localeCompare(String(b.cardId || '')));
}

function validateStoredPack(pack = {}) {
  const validationReport = validateGeneratedPack(pack);
  if (!validationReport.ok) {
    const error = new Error('GENPACK_VALIDATION_FAILED');
    error.details = { validationReport };
    throw error;
  }
  return validationReport;
}

function persistGeneratedPack(owner = {}, pack = {}, { playtestReport = null } = {}) {
  const ownerId = ownerStoreId(owner);
  if (!ownerId) {
    const error = new Error('UNAUTHORIZED');
    error.details = { reason: 'GENERATED_PACK_OWNER_UNAVAILABLE' };
    throw error;
  }
  const storedPack = clone(pack);
  storedPack.validationReport = validateStoredPack(storedPack);
  const packRecord = {
    schemaVersion: 'agent-town-generated-pack-record-v1',
    packId: storedPack.packId,
    ownerStoreId: ownerId,
    savedAtMs: Date.now(),
    migrationVersion: GENERATED_PACK_MIGRATION_VERSION,
    pack: storedPack,
    playtestReport: playtestReport ? clone(playtestReport) : currentPlaytestReport(owner)
  };
  safeWriteJson(packPath(storedPack.packId), packRecord);
  safeWriteJson(ownerCurrentPath(owner), {
    schemaVersion: 'agent-town-generated-pack-current-v1',
    ownerStoreId: ownerId,
    packId: storedPack.packId,
    updatedAtMs: packRecord.savedAtMs
  });
  const index = safeReadJson(ownerPackIndexPath(owner)) || {
    schemaVersion: 'agent-town-generated-pack-owner-index-v1',
    ownerStoreId: ownerId,
    packIds: []
  };
  index.packIds = [...new Set([storedPack.packId, ...(Array.isArray(index.packIds) ? index.packIds : [])])];
  index.updatedAtMs = packRecord.savedAtMs;
  safeWriteJson(ownerPackIndexPath(owner), index);
  packStore.set(storeKey(owner), clone(storedPack));
  if (packRecord.playtestReport) playtestStore.set(storeKey(owner), clone(packRecord.playtestReport));
  return clone(packRecord);
}

function loadPackRecord(packId = '') {
  const record = safeReadJson(packPath(packId));
  return record?.schemaVersion === 'agent-town-generated-pack-record-v1' ? record : null;
}

function loadCurrentPackRecord(owner = {}) {
  const pointer = safeReadJson(ownerCurrentPath(owner));
  return pointer?.packId ? loadPackRecord(pointer.packId) : null;
}

function loadGeneratedPack(owner = {}, packId = '') {
  const record = packId ? loadPackRecord(packId) : loadCurrentPackRecord(owner);
  if (!record?.pack) return null;
  const validationReport = validateGeneratedPack(record.pack);
  if (!validationReport.ok) return null;
  if (record.ownerStoreId !== ownerStoreId(owner)) return null;
  return clone({
    generatedPack: { ...record.pack, validationReport },
    playtestReport: record.playtestReport || null
  });
}

function generateAndStorePack({ owner, prompt, nowMs = Date.now() }) {
  const pack = createGeneratedPack({ owner, prompt, nowMs });
  persistGeneratedPack(owner, pack);
  return clone(pack);
}

function currentGeneratedPack(owner = {}) {
  const key = storeKey(owner);
  if (!key) return null;
  if (packStore.has(key)) return clone(packStore.get(key));
  const loaded = loadGeneratedPack(owner);
  return loaded?.generatedPack || null;
}

function currentPlaytestReport(owner = {}) {
  const key = storeKey(owner);
  if (!key) return null;
  if (playtestStore.has(key)) return clone(playtestStore.get(key));
  const loaded = loadGeneratedPack(owner);
  return loaded?.playtestReport || null;
}

function reloadGeneratedPack(owner = {}, packId = '') {
  const requestedPackId = String(packId || '').trim();
  const loaded = requestedPackId ? loadGeneratedPack(owner, requestedPackId) : loadGeneratedPack(owner);
  if (loaded?.generatedPack) {
    packStore.set(storeKey(owner), clone(loaded.generatedPack));
    if (loaded.playtestReport) playtestStore.set(storeKey(owner), clone(loaded.playtestReport));
    return {
      generatedPack: loaded.generatedPack,
      playtestReport: loaded.playtestReport,
      reloadReport: {
        schemaVersion: 'agent-town-generated-pack-reload-report-v1',
        requestedPackId: requestedPackId || loaded.generatedPack.packId,
        loadedPackId: loaded.generatedPack.packId,
        durablePackStorage: true,
        fallbackUsed: false,
        migrationVersion: loaded.generatedPack.migration?.migrationVersion || GENERATED_PACK_MIGRATION_VERSION
      }
    };
  }
  const fallback = loadGeneratedPack(owner);
  if (fallback?.generatedPack) {
    packStore.set(storeKey(owner), clone(fallback.generatedPack));
    if (fallback.playtestReport) playtestStore.set(storeKey(owner), clone(fallback.playtestReport));
    return {
      generatedPack: fallback.generatedPack,
      playtestReport: fallback.playtestReport,
      reloadReport: {
        schemaVersion: 'agent-town-generated-pack-reload-report-v1',
        requestedPackId: requestedPackId || null,
        loadedPackId: fallback.generatedPack.packId,
        durablePackStorage: true,
        fallbackUsed: true,
        fallbackReason: 'PACK_NOT_FOUND',
        migrationVersion: fallback.generatedPack.migration?.migrationVersion || GENERATED_PACK_MIGRATION_VERSION
      }
    };
  }
  const error = new Error('PACK_NOT_FOUND');
  error.details = { packId: requestedPackId || null };
  throw error;
}

function redactPackForExport(pack = {}) {
  const exported = clone(pack);
  exported.ownerAccountId = 'exported_owner_redacted';
  exported.validationReport = validateGeneratedPack(exported);
  return exported;
}

function exportedPackHash(exportedPack = {}) {
  return sha256(JSON.stringify({
    schemaVersion: exportedPack.schemaVersion,
    packId: exportedPack.packId,
    ownerAccountId: 'exported_owner_redacted',
    prompt: exportedPack.prompt,
    generationBrief: exportedPack.generationBrief,
    stylePack: exportedPack.stylePack,
    universePack: exportedPack.universePack,
    gameplayMapping: exportedPack.gameplayMapping,
    techFlavorTree: exportedPack.techFlavorTree,
    requesterVoicePack: exportedPack.requesterVoicePack,
    inhabitantStyleOverlay: exportedPack.inhabitantStyleOverlay,
    multiSurfaceCompatibility: exportedPack.multiSurfaceCompatibility,
    approvedModifiers: exportedPack.approvedModifiers,
    assetManifest: exportedPack.assetManifest,
    assetPromptPlan: exportedPack.assetPromptPlan,
    assetScaffold: exportedPack.assetScaffold,
    migrationVersion: exportedPack.migration?.migrationVersion || GENERATED_PACK_MIGRATION_VERSION,
    remix: exportedPack.remix || null
  }));
}

function privateLeakCountForExport(exportEnvelope = {}, owner = {}) {
  const text = JSON.stringify(exportEnvelope);
  return [storeKey(owner), owner?.ownerAccountId, owner?.pairId, owner?.houseId]
    .filter((value) => String(value || '').trim().length > 0)
    .filter((value, index, all) => all.indexOf(value) === index)
    .filter((value) => text.includes(String(value))).length;
}

function exportGeneratedPack(owner = {}, packId = '') {
  const loaded = reloadGeneratedPack(owner, packId);
  const exportedPack = redactPackForExport(loaded.generatedPack);
  const packHash = exportedPackHash(exportedPack);
  const envelope = {
    schemaVersion: GENERATED_PACK_EXPORT_VERSION,
    exportedAtMs: Date.now(),
    exportId: `gen_export_${packHash.slice(0, 16)}`,
    packHash,
    migrationVersion: GENERATED_PACK_MIGRATION_VERSION,
    privateDataExcluded: true,
    vaultCompatibility: {
      compatible: true,
      privateOwnerFields: ['ownerAccountId'],
      secretFieldCount: 0
    },
    redactionReport: {
      ownerAccountIdRedacted: true,
      rawPromptStored: false,
      playtestReportIncluded: false
    },
    pack: exportedPack
  };
  envelope.privateDataLeakCount = privateLeakCountForExport(envelope, owner);
  return envelope;
}

function normalizeExportEnvelope(envelope = {}) {
  const wrapped = envelope?.schemaVersion === GENERATED_PACK_EXPORT_VERSION ? envelope : envelope?.exportEnvelope;
  if (!wrapped || typeof wrapped !== 'object') {
    const error = new Error('INVALID_GENERATED_PACK_EXPORT');
    error.details = { reason: 'MISSING_EXPORT_ENVELOPE' };
    throw error;
  }
  const pack = wrapped.pack;
  const exportedPack = redactPackForExport(pack || {});
  const expectedHash = exportedPackHash(exportedPack);
  if (wrapped.schemaVersion !== GENERATED_PACK_EXPORT_VERSION || wrapped.packHash !== expectedHash) {
    const error = new Error('INVALID_GENERATED_PACK_EXPORT');
    error.details = { reason: 'EXPORT_HASH_MISMATCH' };
    throw error;
  }
  const validationReport = validateGeneratedPack(exportedPack);
  if (!validationReport.ok) {
    const error = new Error('INVALID_GENERATED_PACK_EXPORT');
    error.details = { reason: 'PACK_VALIDATION_FAILED', validationReport };
    throw error;
  }
  if (privateLeakCountForExport(wrapped, { ownerAccountId: pack?.ownerAccountId }) > 0 && pack?.ownerAccountId !== 'exported_owner_redacted') {
    const error = new Error('INVALID_GENERATED_PACK_EXPORT');
    error.details = { reason: 'PRIVATE_OWNER_FIELD_NOT_REDACTED' };
    throw error;
  }
  return { envelope: wrapped, exportedPack, packHash: expectedHash };
}

function importGeneratedPack(owner = {}, envelope = {}, { nowMs = Date.now() } = {}) {
  const normalized = normalizeExportEnvelope(envelope);
  const importedPack = clone(normalized.exportedPack);
  importedPack.ownerAccountId = owner?.ownerAccountId || 'owner_unknown';
  importedPack.migration = {
    schemaVersion: 'agent-town-generated-pack-migration-v1',
    migrationVersion: GENERATED_PACK_MIGRATION_VERSION,
    importedFromExport: true,
    sourceExportHash: normalized.packHash,
    importedAtMs: nowMs
  };
  importedPack.validationReport = validateStoredPack(importedPack);
  persistGeneratedPack(owner, importedPack);
  return {
    generatedPack: clone(importedPack),
    importReport: {
      schemaVersion: 'agent-town-generated-pack-import-report-v1',
      importedPackId: importedPack.packId,
      sourceExportHash: normalized.packHash,
      migrationVersion: GENERATED_PACK_MIGRATION_VERSION,
      exportImportRoundTrip: exportGeneratedPack(owner, importedPack.packId).packHash === normalized.packHash,
      privateDataLeakCount: privateLeakCountForExport(normalized.envelope, owner)
    }
  };
}

function remixGeneratedPack({ owner, parentPackId = '', prompt, nowMs = Date.now() } = {}) {
  const parent = reloadGeneratedPack(owner, parentPackId).generatedPack;
  const parentLineage = Array.isArray(parent?.remix?.lineage) ? parent.remix.lineage : [];
  const remixPrompt = createGenerationBrief({ prompt });
  const rootPackId = parent?.remix?.rootPackId || parent.packId;
  const generation = Number(parent?.remix?.generation || 0) + 1;
  const remix = {
    parentPackId: parent.packId,
    rootPackId,
    generation,
    remixPromptHash: remixPrompt.promptHash,
    lineage: [
      ...parentLineage,
      {
        parentPackId: parent.packId,
        parentPromptHash: parent.prompt?.hash || parent.generationBrief?.promptHash || null
      }
    ]
  };
  const generatedPack = createGeneratedPack({
    owner,
    prompt,
    nowMs,
    packSalt: `${parent.packId}:${generation}`,
    remix,
    migration: {
      importedFromExport: false,
      sourceExportHash: null
    }
  });
  persistGeneratedPack(owner, generatedPack);
  return {
    generatedPack,
    remixReport: {
      schemaVersion: 'agent-town-generated-pack-remix-report-v1',
      parentPackId: parent.packId,
      childPackId: generatedPack.packId,
      rootPackId,
      generation,
      remixLineageRecorded: true
    }
  };
}

function cardPrivateLeakCount(value = {}, owner = {}) {
  const text = JSON.stringify(value).toLowerCase();
  return [storeKey(owner), owner?.ownerAccountId, owner?.pairId, owner?.houseId]
    .filter((item) => String(item || '').trim().length > 0)
    .filter((item, index, all) => all.indexOf(item) === index)
    .filter((item) => text.includes(String(item).toLowerCase())).length;
}

function publicCardBlockedPaths(value, pathLabel = '$', matches = []) {
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    const blockedTerms = PUBLIC_CARD_FORBIDDEN_TERMS.filter((term) => lower.includes(term));
    const blockedPromptPatterns = blockedPatternIdsForText(value);
    if (blockedTerms.length > 0 || blockedPromptPatterns.length > 0) {
      matches.push({ path: pathLabel, blockedTerms, blockedPromptPatterns });
    }
    return matches;
  }
  if (!value || typeof value !== 'object') return matches;
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${pathLabel}.${key}`;
    const allowedModerationKey = /\.moderation\.(rawPromptIncluded|privateDataLeakCount|blockedFieldCount)$/.test(childPath);
    if (!allowedModerationKey && /rawprompt|normalizedprompt|systemprompt|developerprompt|brain|wallet|provider|oauth|debug|secret|credential|token/i.test(key)) {
      matches.push({ path: childPath, blockedTerms: [key], blockedPromptPatterns: [] });
    }
    publicCardBlockedPaths(child, childPath, matches);
  }
  return matches;
}

function assetManifestSummaryForCard(pack = {}) {
  const assets = Array.isArray(pack?.assetManifest?.assets) ? pack.assetManifest.assets : [];
  return {
    assetCount: assets.length,
    materialCount: assets.filter((asset) => asset.kind === 'three-material').length,
    generatedTextCount: assets.filter((asset) => asset.kind === 'generated-text').length,
    plannedCandidateCount: Array.isArray(pack?.assetPromptPlan?.targets) ? pack.assetPromptPlan.targets.length : 0,
    productionImageAssetCount: Number(pack?.assetScaffold?.productionImageAssetCount || 0),
    canonicalTargets: [...new Set(assets.map((asset) => asset.canonicalTarget).filter(Boolean))].slice(0, 32)
  };
}

function screenshotForPublicCard(playtestReport = {}) {
  const evidence = normalizeScreenshotEvidence(playtestReport?.screenshotEvidence || {});
  return {
    present: evidence.captured === true,
    source: evidence.source || 'missing-screenshot',
    hash: evidence.hash || sha256('missing-generated-pack-screenshot'),
    width: evidence.width || 1,
    height: evidence.height || 1
  };
}

function buildPublicPackCard({ pack, playtestReport = null, owner = {}, nowMs = Date.now() } = {}) {
  const screenshot = screenshotForPublicCard(playtestReport);
  const compatibility = pack?.multiSurfaceCompatibility || {};
  const publicSkin = (compatibility.surfaceSkins || []).find((skin) => skin.surfaceId === 'surface.public.card') || null;
  const promptHints = (pack?.prompt?.keywordHints || pack?.generationBrief?.keywordHints || [])
    .map((hint) => String(hint || '').trim().toLowerCase())
    .filter((hint) => hint.length >= 2 && !PUBLIC_CARD_FORBIDDEN_TERMS.includes(hint))
    .slice(0, 10);
  const packHash = exportedPackHash(redactPackForExport(pack || {}));
  const cardId = `gen_card_${sha256(`${pack?.packId || ''}:${screenshot.hash}:${packHash}`).slice(0, 16)}`;
  const card = {
    schemaVersion: PUBLIC_PACK_CARD_VERSION,
    cardId,
    packId: String(pack?.packId || ''),
    packHash,
    createdAtMs: nowMs,
    visibility: 'public-unlisted',
    title: String(compatibility.multiTownNaming?.publicCardTitle || pack?.universePack?.name || pack?.stylePack?.name || 'Generated Pack').slice(0, 120),
    styleSummary: String(publicSkin?.visualStyle || pack?.stylePack?.themeSummary || pack?.universePack?.pitch || 'Generated Agent Town style pack.').slice(0, 240),
    promptKeywordHints: promptHints,
    screenshot,
    assetManifestSummary: assetManifestSummaryForCard(pack),
    moderation: {
      status: 'passed',
      rawPromptIncluded: false,
      privateDataLeakCount: 0,
      blockedFieldCount: 0
    }
  };
  const blocked = publicCardBlockedPaths(card);
  card.moderation.privateDataLeakCount = cardPrivateLeakCount(card, owner);
  card.moderation.blockedFieldCount = blocked.length;
  return card;
}

function validatePublicPackCard(card = {}, owner = {}) {
  const schemaReport = SCHEMA_REGISTRY?.publicPackCard
    ? validateGeneratedSchema(card, SCHEMA_REGISTRY.publicPackCard, '$.publicPackCard')
    : { ok: true, errors: [] };
  const blockedFields = publicCardBlockedPaths(card);
  const privateDataLeakCount = cardPrivateLeakCount(card, owner);
  const checks = [
    {
      id: 'PUBLIC_CARD_SCHEMA_VALID',
      passed: schemaReport.ok === true,
      measured: { schemaErrorCount: schemaReport.errors.length, errors: schemaReport.errors.slice(0, 5) }
    },
    {
      id: 'PUBLIC_CARD_SCREENSHOT_PRESENT',
      passed: card?.screenshot?.present === true && /^[0-9a-f]{64}$/.test(String(card?.screenshot?.hash || '')),
      measured: { screenshotPresent: card?.screenshot?.present === true }
    },
    {
      id: 'PUBLIC_CARD_PROMPT_HINTS_ONLY',
      passed: Array.isArray(card?.promptKeywordHints)
        && !Object.prototype.hasOwnProperty.call(card, 'prompt')
        && !Object.prototype.hasOwnProperty.call(card, 'rawPrompt')
        && !Object.prototype.hasOwnProperty.call(card, 'normalizedPrompt'),
      measured: { keywordHintCount: Array.isArray(card?.promptKeywordHints) ? card.promptKeywordHints.length : 0 }
    },
    {
      id: 'PUBLIC_CARD_NO_PRIVATE_DATA',
      passed: privateDataLeakCount === 0,
      measured: { privateDataLeakCount }
    },
    {
      id: 'PUBLIC_CARD_BLOCKED_FIELDS_ABSENT',
      passed: blockedFields.length === 0,
      measured: { blockedFieldCount: blockedFields.length, blockedFields: blockedFields.slice(0, 5) }
    },
    {
      id: 'PUBLIC_CARD_ASSET_SUMMARY_PRESENT',
      passed: Number(card?.assetManifestSummary?.assetCount || 0) > 0
        && Number(card?.assetManifestSummary?.plannedCandidateCount || 0) >= ASSET_PROMPT_TARGETS.length,
      measured: card?.assetManifestSummary || {}
    }
  ];
  return {
    ok: checks.every((check) => check.passed === true),
    checks,
    metrics: {
      publicCardSchemaExists: Boolean(SCHEMA_REGISTRY?.publicPackCard),
      authNotRequiredForPublicCard: true,
      screenshotPresent: card?.screenshot?.present === true,
      privateDataLeakCount,
      rawPromptIncluded: Object.prototype.hasOwnProperty.call(card, 'rawPrompt') || Object.prototype.hasOwnProperty.call(card, 'normalizedPrompt'),
      blockedFieldCount: blockedFields.length
    }
  };
}

function normalizeReleaseApprovalInputs(approvalInputs = {}) {
  const source = approvalInputs || {};
  return {
    authModelDocumented: source.authModelDocumented === true,
    costEstimateAccepted: source.costEstimateAccepted === true,
    explicitConsentRecorded: source.explicitConsentRecorded === true,
    candidateAssetsReviewed: source.candidateAssetsReviewed === true,
    humanReviewSignoffHash: String(source.humanReviewSignoffHash || '').trim()
  };
}

function reviewManifestContentHash(manifest = {}) {
  const copy = clone(manifest);
  delete copy.manifestHash;
  return sha256(JSON.stringify(copy));
}

function buildCandidateReviewManifest({
  pack = {},
  nowMs = Date.now(),
  reviewDecisions = {},
  candidateRecords = {},
  constraints = {}
} = {}) {
  const targets = Array.isArray(pack?.assetPromptPlan?.targets) ? pack.assetPromptPlan.targets : [];
  const recordsByTarget = new Map();
  const candidateRecordList = Array.isArray(candidateRecords)
    ? candidateRecords
    : Object.values(candidateRecords || {});
  for (const record of candidateRecordList) {
    if (record?.canonicalTarget) recordsByTarget.set(record.canonicalTarget, record);
  }
  const decisionsByTarget = reviewDecisions || {};
  const candidates = targets.map((target) => {
    const record = recordsByTarget.get(target.canonicalTarget) || {};
    const decision = decisionsByTarget[target.canonicalTarget] || {};
    const reviewStatus = ['approved-candidate', 'rejected-candidate', 'pending'].includes(decision.reviewStatus)
      ? decision.reviewStatus
      : 'pending';
    const processedOutputPath = String(record.processedOutputPath || decision.processedOutputPath || '');
    const byteLength = positiveNumberOrZero(record.byteLength ?? decision.byteLength);
    return {
      canonicalTarget: target.canonicalTarget,
      promptId: target.promptId,
      promptHash: target.promptHash,
      candidateOutputPath: target.candidateOutputPath,
      processedOutputPath,
      approvedOutputPath: target.approvedOutputPath,
      sourceStatus: processedOutputPath.includes('/postprocessed/candidates/')
        ? 'postprocessed-candidate'
        : byteLength > 0
          ? 'candidate-recorded'
          : 'planned-only',
      byteLength,
      contentHash: isSha256Hex(record.contentHash || decision.contentHash) ? String(record.contentHash || decision.contentHash) : '',
      reviewStatus,
      reviewerNoteHash: isSha256Hex(decision.reviewerNoteHash) ? decision.reviewerNoteHash : ''
    };
  });
  const approvedCandidateCount = candidates.filter((candidate) => candidate.reviewStatus === 'approved-candidate').length;
  const rejectedCandidateCount = candidates.filter((candidate) => candidate.reviewStatus === 'rejected-candidate').length;
  const pendingCandidateCount = candidates.filter((candidate) => candidate.reviewStatus === 'pending').length;
  const manifest = {
    schemaVersion: CANDIDATE_REVIEW_MANIFEST_VERSION,
    manifestId: sha256(JSON.stringify({
      packId: pack?.packId || '',
      nowMs,
      promptPlanHash: pack?.assetPromptPlan?.planHash || '',
      targetCount: targets.length
    })).slice(0, 32),
    manifestHash: '',
    packId: String(pack?.packId || ''),
    createdAtMs: positiveNumberOrZero(nowMs),
    promptPlanHash: String(pack?.assetPromptPlan?.planHash || ''),
    reviewPolicy: {
      candidateOnly: true,
      productionPromotionApproved: false,
      humanReviewRequiredBeforeProduction: true,
      defaultGameplayExposureApproved: false
    },
    candidates,
    metrics: {
      expectedTargetCount: targets.length,
      reviewedCandidateCount: approvedCandidateCount + rejectedCandidateCount,
      approvedCandidateCount,
      rejectedCandidateCount,
      pendingCandidateCount,
      productionImageAssetCount: 0
    },
    constraints: {
      candidateOnly: true,
      productionPromotionApproved: constraints.productionPromotionApproved === true,
      externalProviderPrivateDataStored: constraints.externalProviderPrivateDataStored === true,
      canonicalServerRulesChanged: constraints.canonicalServerRulesChanged === true,
      v6CivicMechanicsTouched: constraints.v6CivicMechanicsTouched === true,
      normalGameplayVisibilityChanged: constraints.normalGameplayVisibilityChanged === true,
      generatedPackDefaultExposure: constraints.generatedPackDefaultExposure === true
    }
  };
  manifest.manifestHash = reviewManifestContentHash(manifest);
  return manifest;
}

function validateCandidateReviewManifest(manifest = {}, pack = {}) {
  const schemaReport = SCHEMA_REGISTRY?.candidateReviewManifest
    ? validateGeneratedSchema(manifest, SCHEMA_REGISTRY.candidateReviewManifest, '$.candidateReviewManifest')
    : { ok: true, errors: [] };
  const secretLikePaths = findSecretLikePaths(manifest);
  const rawInstructionPaths = findRawPromptInstructionPaths(manifest);
  const targets = Array.isArray(pack?.assetPromptPlan?.targets) ? pack.assetPromptPlan.targets : [];
  const targetsByCanonical = new Map(targets.map((target) => [target.canonicalTarget, target]));
  const candidates = Array.isArray(manifest?.candidates) ? manifest.candidates : [];
  const candidateTargets = candidates.map((candidate) => candidate.canonicalTarget);
  const duplicateTargets = candidateTargets.filter((target, index) => candidateTargets.indexOf(target) !== index);
  const missingTargets = targets
    .map((target) => target.canonicalTarget)
    .filter((target) => !candidateTargets.includes(target));
  const unknownTargets = candidateTargets.filter((target) => !targetsByCanonical.has(target));
  const pathProblems = [];
  for (const candidate of candidates) {
    const planned = targetsByCanonical.get(candidate.canonicalTarget);
    if (!planned) continue;
    if (candidate.promptId !== planned.promptId) pathProblems.push(`${candidate.canonicalTarget}:promptId`);
    if (candidate.promptHash !== planned.promptHash) pathProblems.push(`${candidate.canonicalTarget}:promptHash`);
    if (candidate.candidateOutputPath !== planned.candidateOutputPath || !String(candidate.candidateOutputPath || '').includes('/candidates/')) {
      pathProblems.push(`${candidate.canonicalTarget}:candidateOutputPath`);
    }
    if (candidate.approvedOutputPath !== planned.approvedOutputPath || !String(candidate.approvedOutputPath || '').includes('/approved/')) {
      pathProblems.push(`${candidate.canonicalTarget}:approvedOutputPath`);
    }
    if (String(candidate.processedOutputPath || '') && !String(candidate.processedOutputPath || '').includes('/postprocessed/candidates/')) {
      pathProblems.push(`${candidate.canonicalTarget}:processedOutputPath`);
    }
    if (candidate.reviewStatus !== 'pending' && !isSha256Hex(candidate.reviewerNoteHash)) {
      pathProblems.push(`${candidate.canonicalTarget}:reviewerNoteHash`);
    }
    if (candidate.sourceStatus !== 'planned-only' && !isSha256Hex(candidate.contentHash)) {
      pathProblems.push(`${candidate.canonicalTarget}:contentHash`);
    }
  }
  const constraints = manifest?.constraints || {};
  const boundaryPreserved = constraints.candidateOnly === true
    && constraints.productionPromotionApproved === false
    && constraints.externalProviderPrivateDataStored === false
    && constraints.canonicalServerRulesChanged === false
    && constraints.v6CivicMechanicsTouched === false
    && constraints.normalGameplayVisibilityChanged === false
    && constraints.generatedPackDefaultExposure === false
    && manifest?.reviewPolicy?.candidateOnly === true
    && manifest?.reviewPolicy?.productionPromotionApproved === false
    && manifest?.reviewPolicy?.defaultGameplayExposureApproved === false
    && Number(manifest?.metrics?.productionImageAssetCount || 0) === 0;
  const expectedHash = schemaReport.ok ? reviewManifestContentHash(manifest) : '';
  const hashMatches = Boolean(expectedHash) && manifest?.manifestHash === expectedHash;
  const reviewedCandidateCount = Number(manifest?.metrics?.reviewedCandidateCount || 0);
  const approvedCandidateCount = Number(manifest?.metrics?.approvedCandidateCount || 0);
  const rejectedCandidateCount = Number(manifest?.metrics?.rejectedCandidateCount || 0);
  const pendingCandidateCount = Number(manifest?.metrics?.pendingCandidateCount || 0);
  const countedCandidates = approvedCandidateCount + rejectedCandidateCount + pendingCandidateCount;
  const reviewedCandidates = candidates.filter((candidate) => candidate.reviewStatus !== 'pending');
  const reviewedCandidatesWithoutContent = reviewedCandidates.filter((candidate) => (
    candidate.sourceStatus === 'planned-only'
    || positiveNumberOrZero(candidate.byteLength) <= 0
    || !isSha256Hex(candidate.contentHash)
    || !isSha256Hex(candidate.reviewerNoteHash)
  ));
  const plannedOnlyReviewedCandidates = reviewedCandidatesWithoutContent
    .filter((candidate) => candidate.sourceStatus === 'planned-only')
    .map((candidate) => candidate.canonicalTarget);
  const reviewedCandidatesMissingContent = reviewedCandidatesWithoutContent
    .map((candidate) => candidate.canonicalTarget);
  const checks = [
    {
      id: 'CANDIDATE_REVIEW_MANIFEST_SCHEMA_VALID',
      passed: schemaReport.ok === true,
      measured: { schemaErrorCount: schemaReport.errors.length, errors: schemaReport.errors.slice(0, 5) }
    },
    {
      id: 'CANDIDATE_REVIEW_MANIFEST_CONTENT_SAFE',
      passed: secretLikePaths.length === 0 && rawInstructionPaths.length === 0,
      measured: { secretLikePaths, rawInstructionPaths }
    },
    {
      id: 'CANDIDATE_REVIEW_MANIFEST_TARGET_COVERAGE',
      passed: manifest?.packId === pack?.packId
        && manifest?.promptPlanHash === pack?.assetPromptPlan?.planHash
        && Number(manifest?.metrics?.expectedTargetCount || 0) === targets.length
        && missingTargets.length === 0
        && duplicateTargets.length === 0
        && unknownTargets.length === 0
        && pathProblems.length === 0,
      measured: {
        expectedTargetCount: targets.length,
        candidateCount: candidates.length,
        missingTargets,
        duplicateTargets: [...new Set(duplicateTargets)],
        unknownTargets,
        pathProblems
      }
    },
    {
      id: 'CANDIDATE_REVIEW_MANIFEST_REVIEW_COUNTS',
      passed: reviewedCandidateCount === approvedCandidateCount + rejectedCandidateCount
        && countedCandidates === candidates.length,
      measured: { reviewedCandidateCount, approvedCandidateCount, rejectedCandidateCount, pendingCandidateCount, candidateCount: candidates.length }
    },
    {
      id: 'CANDIDATE_REVIEW_MANIFEST_REVIEWED_CANDIDATES_HAVE_CONTENT',
      passed: reviewedCandidatesWithoutContent.length === 0,
      measured: {
        plannedOnlyReviewedCandidates,
        reviewedCandidatesMissingContent
      }
    },
    {
      id: 'CANDIDATE_REVIEW_MANIFEST_HASH_STABLE',
      passed: hashMatches,
      measured: { expectedHash, actualHash: manifest?.manifestHash || '' }
    },
    {
      id: 'CANDIDATE_REVIEW_MANIFEST_BOUNDARY_PRESERVED',
      passed: boundaryPreserved,
      measured: { constraints, reviewPolicy: manifest?.reviewPolicy || {}, productionImageAssetCount: Number(manifest?.metrics?.productionImageAssetCount || 0) }
    }
  ];
  return {
    ok: checks.every((check) => check.passed === true),
    checks,
    metrics: {
      candidateReviewManifestSchemaExists: Boolean(SCHEMA_REGISTRY?.candidateReviewManifest),
      schemaErrorCount: schemaReport.errors.length,
      secretLikePathCount: secretLikePaths.length,
      rawInstructionPathCount: rawInstructionPaths.length,
      expectedTargetCount: targets.length,
      candidateCount: candidates.length,
      reviewedCandidateCount,
      approvedCandidateCount,
      rejectedCandidateCount,
      pendingCandidateCount,
      reviewedCandidateContentCount: Math.max(0, reviewedCandidateCount - reviewedCandidatesWithoutContent.length),
      plannedOnlyReviewedCandidateCount: plannedOnlyReviewedCandidates.length,
      reviewedCandidateMissingContentCount: reviewedCandidatesWithoutContent.length,
      missingTargetCount: missingTargets.length,
      duplicateTargetCount: new Set(duplicateTargets).size,
      unknownTargetCount: unknownTargets.length,
      pathProblemCount: pathProblems.length,
      hashMatches,
      boundaryPreserved,
      productionImageAssetCount: Number(manifest?.metrics?.productionImageAssetCount || 0),
      releaseReady: checks.every((check) => check.passed === true)
        && targets.length > 0
        && reviewedCandidateCount >= targets.length
        && pendingCandidateCount === 0
    }
  };
}

function isSha256Hex(value = '') {
  return /^[0-9a-f]{64}$/.test(String(value || ''));
}

function normalizeApprovalStatus(value = '', allowed = []) {
  const status = String(value || '').trim().toLowerCase();
  return allowed.includes(status) ? status : allowed[0];
}

function normalizeAuthModeForEvidence(value = '') {
  const authMode = String(value || '').trim().toLowerCase();
  return ['not_configured', 'operator_managed', 'oauth_user_delegated'].includes(authMode)
    ? authMode
    : 'not_configured';
}

function positiveNumberOrZero(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : 0;
}

function releaseApprovalEvidenceDefault(pack = {}, nowMs = Date.now()) {
  const packId = String(pack?.packId || '');
  return buildReleaseApprovalEvidence({ pack: { packId }, nowMs });
}

function releaseApprovalEvidenceHash(evidence = {}) {
  const copy = clone(evidence);
  delete copy.evidenceHash;
  return stableEvidenceHash(copy);
}

function releaseApprovalTimestampProblems(evidence = {}) {
  const createdAtMs = positiveNumberOrZero(evidence?.createdAtMs);
  const problems = [];
  function timestampOk(value) {
    const timestamp = positiveNumberOrZero(value);
    return createdAtMs > 0 && timestamp > 0 && timestamp <= createdAtMs;
  }
  if (evidence?.authModel?.status === 'approved' && !timestampOk(evidence.authModel.approvedAtMs)) {
    problems.push('authModel.approvedAtMs');
  }
  if (evidence?.costModel?.status === 'accepted' && !timestampOk(evidence.costModel.acceptedAtMs)) {
    problems.push('costModel.acceptedAtMs');
  }
  if (evidence?.consentModel?.status === 'recorded' && !timestampOk(evidence.consentModel.recordedAtMs)) {
    problems.push('consentModel.recordedAtMs');
  }
  if (evidence?.candidateReview?.status === 'reviewed' && !timestampOk(evidence.candidateReview.reviewedAtMs)) {
    problems.push('candidateReview.reviewedAtMs');
  }
  if (evidence?.humanReview?.status === 'complete' && !timestampOk(evidence.humanReview.reviewedAtMs)) {
    problems.push('humanReview.reviewedAtMs');
  }
  return problems;
}

function buildReleaseApprovalEvidence({
  pack = {},
  nowMs = Date.now(),
  authModel = {},
  costModel = {},
  consentModel = {},
  candidateReview = {},
  humanReview = {},
  constraints = {}
} = {}) {
  const packId = String(pack?.packId || '');
  const expectedTargetCount = Number.isFinite(Number(candidateReview.expectedTargetCount))
    ? positiveNumberOrZero(candidateReview.expectedTargetCount)
    : (Array.isArray(pack?.assetPromptPlan?.targets) ? pack.assetPromptPlan.targets.length : 0);
  const authStatus = normalizeApprovalStatus(authModel.status, ['missing', 'approved', 'rejected']);
  const costStatus = normalizeApprovalStatus(costModel.status, ['missing', 'accepted', 'rejected']);
  const consentStatusValue = normalizeApprovalStatus(consentModel.status, ['missing', 'recorded', 'revoked']);
  const candidateStatus = normalizeApprovalStatus(candidateReview.status, ['missing', 'reviewed', 'rejected']);
  const humanStatus = normalizeApprovalStatus(humanReview.status, ['missing', 'complete', 'rejected']);
  const evidenceCore = {
    packId,
    nowMs,
    authStatus,
    costStatus,
    consentStatus: consentStatusValue,
    candidateStatus,
    humanStatus,
    expectedTargetCount
  };
  const evidence = {
    schemaVersion: RELEASE_APPROVAL_EVIDENCE_VERSION,
    evidenceHash: '',
    evidenceId: String(candidateReview.evidenceId || sha256(JSON.stringify(evidenceCore)).slice(0, 32)),
    packId,
    createdAtMs: positiveNumberOrZero(nowMs),
    authModel: {
      status: authStatus,
      authMode: normalizeAuthModeForEvidence(authModel.authMode),
      approvalDocHash: isSha256Hex(authModel.approvalDocHash) ? authModel.approvalDocHash : '',
      approvedByHash: isSha256Hex(authModel.approvedByHash) ? authModel.approvedByHash : '',
      approvedAtMs: positiveNumberOrZero(authModel.approvedAtMs),
      providerAccessPolicy: authModel.providerAccessPolicy === 'out_of_band_only_no_pack_storage'
        ? 'out_of_band_only_no_pack_storage'
        : 'not_applicable'
    },
    costModel: {
      status: costStatus,
      currency: 'USD',
      estimatedMin: positiveNumberOrZero(costModel.estimatedMin),
      estimatedMax: Math.max(positiveNumberOrZero(costModel.estimatedMin), positiveNumberOrZero(costModel.estimatedMax)),
      costEstimateHash: isSha256Hex(costModel.costEstimateHash) ? costModel.costEstimateHash : '',
      acceptedByHash: isSha256Hex(costModel.acceptedByHash) ? costModel.acceptedByHash : '',
      acceptedAtMs: positiveNumberOrZero(costModel.acceptedAtMs)
    },
    consentModel: {
      status: consentStatusValue,
      scope: ['single-pack-candidate-run', 'generated-pack-lane-validation'].includes(String(consentModel.scope || ''))
        ? String(consentModel.scope)
        : 'not_applicable',
      userConsentHash: isSha256Hex(consentModel.userConsentHash) ? consentModel.userConsentHash : '',
      teamConsentHash: isSha256Hex(consentModel.teamConsentHash) ? consentModel.teamConsentHash : '',
      consentRecordHash: isSha256Hex(consentModel.consentRecordHash) ? consentModel.consentRecordHash : '',
      recordedAtMs: positiveNumberOrZero(consentModel.recordedAtMs)
    },
    candidateReview: {
      status: candidateStatus,
      expectedTargetCount,
      reviewedCandidateCount: positiveNumberOrZero(candidateReview.reviewedCandidateCount),
      approvedCandidateCount: positiveNumberOrZero(candidateReview.approvedCandidateCount),
      rejectedCandidateCount: positiveNumberOrZero(candidateReview.rejectedCandidateCount),
      candidateManifestHash: isSha256Hex(candidateReview.candidateManifestHash) ? candidateReview.candidateManifestHash : '',
      reviewerSignoffHash: isSha256Hex(candidateReview.reviewerSignoffHash) ? candidateReview.reviewerSignoffHash : '',
      reviewedAtMs: positiveNumberOrZero(candidateReview.reviewedAtMs),
      productionPromotionApproved: candidateReview.productionPromotionApproved === true
    },
    humanReview: {
      status: humanStatus,
      releaseSignoffHash: isSha256Hex(humanReview.releaseSignoffHash) ? humanReview.releaseSignoffHash : '',
      checklistHash: isSha256Hex(humanReview.checklistHash) ? humanReview.checklistHash : '',
      reviewedAtMs: positiveNumberOrZero(humanReview.reviewedAtMs)
    },
    constraints: {
      externalProviderPrivateDataStored: constraints.externalProviderPrivateDataStored === true,
      productionImageAssetsCreated: constraints.productionImageAssetsCreated === true,
      canonicalServerRulesChanged: constraints.canonicalServerRulesChanged === true,
      v6CivicMechanicsTouched: constraints.v6CivicMechanicsTouched === true,
      normalGameplayVisibilityChanged: constraints.normalGameplayVisibilityChanged === true,
      generatedPackDefaultExposure: constraints.generatedPackDefaultExposure === true
    }
  };
  evidence.evidenceHash = releaseApprovalEvidenceHash(evidence);
  return evidence;
}

function validateReleaseApprovalEvidence(evidence = {}, pack = {}) {
  const schemaReport = SCHEMA_REGISTRY?.releaseApprovalEvidence
    ? validateGeneratedSchema(evidence, SCHEMA_REGISTRY.releaseApprovalEvidence, '$.releaseApprovalEvidence')
    : { ok: true, errors: [] };
  const secretLikePaths = findSecretLikePaths(evidence);
  const rawInstructionPaths = findRawPromptInstructionPaths(evidence);
  const expectedEvidenceHash = schemaReport.ok ? releaseApprovalEvidenceHash(evidence) : '';
  const evidenceHashMatches = Boolean(expectedEvidenceHash) && evidence?.evidenceHash === expectedEvidenceHash;
  const packIdMatches = pack?.packId ? evidence?.packId === pack.packId : true;
  const timestampProblems = releaseApprovalTimestampProblems(evidence);
  const requiredTargetCount = Math.max(
    ASSET_PROMPT_TARGETS.length,
    Array.isArray(pack?.assetPromptPlan?.targets) ? pack.assetPromptPlan.targets.length : 0
  );
  const candidate = evidence?.candidateReview || {};
  const reviewedCandidateCount = positiveNumberOrZero(candidate.reviewedCandidateCount);
  const expectedTargetCount = positiveNumberOrZero(candidate.expectedTargetCount);
  const reviewedDispositionCount = positiveNumberOrZero(candidate.approvedCandidateCount)
    + positiveNumberOrZero(candidate.rejectedCandidateCount);
  const constraints = evidence?.constraints || {};
  const boundaryPreserved = constraints.externalProviderPrivateDataStored === false
    && constraints.productionImageAssetsCreated === false
    && constraints.canonicalServerRulesChanged === false
    && constraints.v6CivicMechanicsTouched === false
    && constraints.normalGameplayVisibilityChanged === false
    && constraints.generatedPackDefaultExposure === false;
  const authTimestampOk = !timestampProblems.includes('authModel.approvedAtMs');
  const costTimestampOk = !timestampProblems.includes('costModel.acceptedAtMs');
  const consentTimestampOk = !timestampProblems.includes('consentModel.recordedAtMs');
  const candidateReviewTimestampOk = !timestampProblems.includes('candidateReview.reviewedAtMs');
  const humanReviewTimestampOk = !timestampProblems.includes('humanReview.reviewedAtMs');
  const authModelApproved = evidence?.authModel?.status === 'approved'
    && evidence?.authModel?.authMode !== 'not_configured'
    && evidence?.authModel?.providerAccessPolicy === 'out_of_band_only_no_pack_storage'
    && isSha256Hex(evidence?.authModel?.approvalDocHash)
    && isSha256Hex(evidence?.authModel?.approvedByHash)
    && authTimestampOk;
  const costEstimateAccepted = evidence?.costModel?.status === 'accepted'
    && evidence?.costModel?.currency === 'USD'
    && positiveNumberOrZero(evidence?.costModel?.estimatedMax) >= positiveNumberOrZero(evidence?.costModel?.estimatedMin)
    && isSha256Hex(evidence?.costModel?.costEstimateHash)
    && isSha256Hex(evidence?.costModel?.acceptedByHash)
    && costTimestampOk;
  const explicitConsentRecorded = evidence?.consentModel?.status === 'recorded'
    && evidence?.consentModel?.scope !== 'not_applicable'
    && isSha256Hex(evidence?.consentModel?.userConsentHash)
    && isSha256Hex(evidence?.consentModel?.teamConsentHash)
    && isSha256Hex(evidence?.consentModel?.consentRecordHash)
    && consentTimestampOk;
  const candidateAssetsReviewed = candidate.status === 'reviewed'
    && expectedTargetCount >= requiredTargetCount
    && reviewedCandidateCount >= expectedTargetCount
    && reviewedDispositionCount >= reviewedCandidateCount
    && isSha256Hex(candidate.candidateManifestHash)
    && isSha256Hex(candidate.reviewerSignoffHash)
    && candidate.productionPromotionApproved === false
    && candidateReviewTimestampOk;
  const humanReviewComplete = evidence?.humanReview?.status === 'complete'
    && isSha256Hex(evidence?.humanReview?.releaseSignoffHash)
    && isSha256Hex(evidence?.humanReview?.checklistHash)
    && humanReviewTimestampOk;
  const contentSafe = secretLikePaths.length === 0 && rawInstructionPaths.length === 0;
  const checks = [
    {
      id: 'RELEASE_APPROVAL_EVIDENCE_SCHEMA_VALID',
      passed: schemaReport.ok === true,
      measured: { schemaErrorCount: schemaReport.errors.length, errors: schemaReport.errors.slice(0, 5) }
    },
    {
      id: 'RELEASE_APPROVAL_EVIDENCE_CONTENT_SAFE',
      passed: contentSafe,
      measured: { secretLikePaths, rawInstructionPaths }
    },
    {
      id: 'RELEASE_APPROVAL_EVIDENCE_HASH_STABLE',
      passed: evidenceHashMatches,
      measured: { expectedEvidenceHash, actualEvidenceHash: evidence?.evidenceHash || '' }
    },
    {
      id: 'RELEASE_APPROVAL_EVIDENCE_PACK_ID_MATCH',
      passed: packIdMatches,
      measured: { expectedPackId: pack?.packId || '', actualPackId: evidence?.packId || '' }
    },
    {
      id: 'RELEASE_APPROVAL_EVIDENCE_TIMESTAMPS_COHERENT',
      passed: timestampProblems.length === 0,
      measured: { createdAtMs: positiveNumberOrZero(evidence?.createdAtMs), timestampProblems }
    },
    {
      id: 'RELEASE_APPROVAL_EVIDENCE_AUTH_COST_CONSENT',
      passed: authModelApproved && costEstimateAccepted && explicitConsentRecorded,
      measured: { authModelApproved, costEstimateAccepted, explicitConsentRecorded }
    },
    {
      id: 'RELEASE_APPROVAL_EVIDENCE_CANDIDATE_REVIEW_COVERAGE',
      passed: candidateAssetsReviewed,
      measured: { requiredTargetCount, expectedTargetCount, reviewedCandidateCount, reviewedDispositionCount }
    },
    {
      id: 'RELEASE_APPROVAL_EVIDENCE_HUMAN_REVIEW',
      passed: humanReviewComplete,
      measured: { humanReviewStatus: evidence?.humanReview?.status || null }
    },
    {
      id: 'RELEASE_APPROVAL_EVIDENCE_BOUNDARY_PRESERVED',
      passed: boundaryPreserved,
      measured: constraints
    }
  ];
  return {
    ok: checks.every((check) => check.passed === true),
    checks,
    metrics: {
      releaseApprovalEvidenceSchemaExists: Boolean(SCHEMA_REGISTRY?.releaseApprovalEvidence),
      schemaErrorCount: schemaReport.errors.length,
      secretLikePathCount: secretLikePaths.length,
      rawInstructionPathCount: rawInstructionPaths.length,
      evidenceHashMatches,
      packIdMatches,
      timestampProblemCount: timestampProblems.length,
      authModelApproved,
      costEstimateAccepted,
      explicitConsentRecorded,
      costConsentModelApproved: authModelApproved && costEstimateAccepted && explicitConsentRecorded,
      candidateAssetsReviewed,
      humanReviewComplete,
      boundaryPreserved,
      requiredTargetCount,
      expectedTargetCount,
      reviewedCandidateCount
    }
  };
}

function approvalInputsFromEvidence(evidence = {}, evidenceReport = validateReleaseApprovalEvidence(evidence)) {
  const metrics = evidenceReport.metrics || {};
  return {
    authModelDocumented: metrics.authModelApproved === true,
    costEstimateAccepted: metrics.costEstimateAccepted === true,
    explicitConsentRecorded: metrics.explicitConsentRecorded === true,
    candidateAssetsReviewed: metrics.candidateAssetsReviewed === true,
    humanReviewSignoffHash: metrics.humanReviewComplete === true
      ? String(evidence?.humanReview?.releaseSignoffHash || '').trim()
      : ''
  };
}

function releaseDiversityPassed(diversityReport = {}) {
  const metrics = diversityReport?.metrics || {};
  return diversityReport?.ok === true
    && Number(metrics.promptCount || metrics.validPackCount || 0) >= 10
    && Number(metrics.uniqueReplayabilitySignatures || 0) >= 10
    && Number(metrics.forbiddenAuthorityCount || metrics.replayabilityForbiddenAuthorityCount || 0) === 0
    && Number(metrics.rawPromptLeakCount || 0) === 0;
}

function releaseDiversityMetricsCoherent(diversityReport = {}) {
  const metrics = diversityReport?.metrics || {};
  const packResults = Array.isArray(diversityReport?.packResults)
    ? diversityReport.packResults.filter((result) => result && typeof result === 'object')
    : [];
  const comparisons = Array.isArray(diversityReport?.comparisons)
    ? diversityReport.comparisons.filter((comparison) => comparison && typeof comparison === 'object')
    : [];
  const signatures = Array.isArray(diversityReport?.signatures)
    ? diversityReport.signatures.map((signature) => String(signature || '')).filter(Boolean)
    : [];
  const promptCount = positiveNumberOrZero(metrics.promptCount);
  const expectedPromptCount = positiveNumberOrZero(metrics.expectedPromptCount);
  const validationOkCount = packResults.filter((result) => result.validationOk === true).length;
  const firstLoopPassCount = packResults.filter((result) => result.firstLoopPassed === true).length;
  const uniquePackIds = new Set(packResults.map((result) => result.packId).filter(Boolean)).size;
  const rowSignatures = packResults.map((result) => String(result.replayabilitySignature || '')).filter(Boolean);
  const uniqueReplayabilitySignatures = new Set(rowSignatures).size;
  const screenshotHashes = packResults
    .map((result) => String(result.screenshotHash || ''))
    .filter((hash) => isSha256Hex(hash));
  const uniqueScreenshotHashes = new Set(screenshotHashes).size;
  const forbiddenAuthorityCount = packResults.reduce(
    (sum, result) => sum + Number(result.forbiddenAuthorityCount || 0),
    0
  );
  const rawPromptLeakCount = packResults.reduce(
    (sum, result) => sum + Number(result.rawPromptLeakCount || 0),
    0
  );
  const expectedComparisonCount = packResults.length > 1
    ? (packResults.length * (packResults.length - 1)) / 2
    : 0;
  const signaturesMatchRows = signatures.length === 0
    || (signatures.length === rowSignatures.length
      && signatures.every((signature, index) => signature === rowSignatures[index]));
  const playtestEvidenceMode = metrics.firstLoopEvidenceMode === 'playtest-report';
  return packResults.length >= REPLAYABILITY_PROMPT_SUITE.length
    && promptCount === packResults.length
    && expectedPromptCount >= REPLAYABILITY_PROMPT_SUITE.length
    && positiveNumberOrZero(metrics.validPackCount) === validationOkCount
    && positiveNumberOrZero(metrics.firstLoopPassCount) === firstLoopPassCount
    && positiveNumberOrZero(metrics.uniquePackIds) === uniquePackIds
    && positiveNumberOrZero(metrics.uniqueReplayabilitySignatures) === uniqueReplayabilitySignatures
    && positiveNumberOrZero(metrics.forbiddenAuthorityCount) === forbiddenAuthorityCount
    && positiveNumberOrZero(metrics.rawPromptLeakCount) === rawPromptLeakCount
    && positiveNumberOrZero(metrics.pairwiseComparisonCount) === comparisons.length
    && comparisons.length === expectedComparisonCount
    && (!playtestEvidenceMode || positiveNumberOrZero(metrics.screenshotHashCount) === screenshotHashes.length)
    && (!playtestEvidenceMode || positiveNumberOrZero(metrics.uniqueScreenshotHashes) === uniqueScreenshotHashes)
    && signaturesMatchRows;
}

function releaseDiversityIncludesPack(diversityReport = {}, packId = '') {
  const targetPackId = String(packId || '');
  if (!targetPackId || !Array.isArray(diversityReport?.packResults)) return false;
  return diversityReport.packResults.some((result) => result?.packId === targetPackId
    && result?.validationOk === true
    && result?.firstLoopPassed === true
    && result?.playtestEvidenceRecorded === true);
}

function releasePlaytestSourcePassed(playtestReport = null, pack = {}) {
  if (!playtestReport || typeof playtestReport !== 'object') return false;
  const report = validatePlaytestReport(playtestReport, pack || {});
  return report.ok === true
    && playtestReport.playtestPassed !== false
    && playtestReport.packId === pack?.packId;
}

function releasePersistencePassed(persistenceReport = {}) {
  return persistenceReport?.durablePackStorage === true
    && persistenceReport?.restartReloadPass === true
    && persistenceReport?.exportImportRoundTrip === true
    && persistenceReport?.invalidImportRejected === true
    && Number(persistenceReport?.privateDataLeakCount || 0) === 0;
}

function releasePersistenceSourcePassed(persistenceReport = null, packId = '') {
  const targetPackId = String(packId || '');
  if (!targetPackId || !persistenceReport || typeof persistenceReport !== 'object') return false;
  return persistenceReport.packId === targetPackId
    && releasePersistencePassed(persistenceReport);
}

function releasePublicCardSourcePassed(publicCard = null, packId = '') {
  const targetPackId = String(packId || '');
  if (!targetPackId || !publicCard || typeof publicCard !== 'object') return false;
  const report = validatePublicPackCard(publicCard, {});
  return report.ok === true
    && publicCard.packId === targetPackId
    && publicCard?.moderation?.status === 'passed'
    && publicCard?.moderation?.rawPromptIncluded === false
    && Number(publicCard?.moderation?.privateDataLeakCount || 0) === 0
    && Number(publicCard?.moderation?.blockedFieldCount || 0) === 0;
}

function releaseCandidateReviewManifestSourcePassed(candidateReviewManifest = null, pack = {}) {
  if (!candidateReviewManifest || typeof candidateReviewManifest !== 'object') return false;
  const targetPackId = String(pack?.packId || '');
  if (!targetPackId || candidateReviewManifest.packId !== targetPackId) return false;
  const report = validateCandidateReviewManifest(candidateReviewManifest, pack || {});
  return report.ok === true
    && report.metrics?.releaseReady === true
    && Number(report.metrics?.productionImageAssetCount || 0) === 0;
}

function releaseGeneratedPackSourcePassed(pack = null) {
  if (!pack || typeof pack !== 'object') return false;
  const report = validateGeneratedPack(pack || {});
  return report.ok === true
    && /^gen_pack_[0-9a-f]{16}$/.test(String(pack?.packId || ''))
    && Number(pack?.assetScaffold?.productionImageAssetCount || 0) === 0;
}

function releaseApprovalEvidenceSourcePassed(approvalEvidence = null, pack = {}) {
  if (!approvalEvidence || typeof approvalEvidence !== 'object') return false;
  const report = validateReleaseApprovalEvidence(approvalEvidence, pack || {});
  return report.ok === true
    && report.metrics?.packIdMatches === true
    && report.metrics?.costConsentModelApproved === true
    && report.metrics?.candidateAssetsReviewed === true
    && report.metrics?.humanReviewComplete === true
    && report.metrics?.boundaryPreserved === true;
}

function buildProductionReleaseGate({
  pack = {},
  playtestReport = null,
  diversityReport = null,
  publicCard = null,
  persistenceReport = {},
  candidateReviewManifest = null,
  approvalEvidence = null,
  approvalInputs = {},
  nowMs = Date.now()
} = {}) {
  const schemaReport = validateGeneratedPackSchemas(
    pack?.validationReport ? pack : { ...pack, validationReport: { ok: true } },
    SCHEMA_REGISTRY
  );
  const packReport = validateGeneratedPack(pack || {});
  const assetManifestReport = validateAssetManifest(pack?.assetManifest || {}, pack);
  const assetPromptPlanReport = validateAssetPromptPlan(pack?.assetPromptPlan || {}, pack);
  const playtestValidation = playtestReport
    ? validatePlaytestReport(playtestReport, pack)
    : { ok: false, metrics: {} };
  const publicCardReport = publicCard
    ? validatePublicPackCard(publicCard, {})
    : { ok: false, metrics: { privateDataLeakCount: 0, blockedFieldCount: 0 } };
  const normalizedLooseApprovals = normalizeReleaseApprovalInputs(approvalInputs);
  const evidence = approvalEvidence && typeof approvalEvidence === 'object'
    ? clone(approvalEvidence)
    : releaseApprovalEvidenceDefault(pack, nowMs);
  const approvalEvidenceReport = validateReleaseApprovalEvidence(evidence, pack);
  const candidateManifest = candidateReviewManifest && typeof candidateReviewManifest === 'object'
    ? clone(candidateReviewManifest)
    : null;
  const candidateReviewManifestReport = candidateManifest
    ? validateCandidateReviewManifest(candidateManifest, pack)
    : { ok: false, metrics: { schemaErrorCount: 0, secretLikePathCount: 0, rawInstructionPathCount: 0, expectedTargetCount: 0, reviewedCandidateCount: 0, releaseReady: false } };
  const candidateReviewManifestHashMatchesEvidence = Boolean(candidateManifest?.manifestHash)
    && candidateManifest.manifestHash === evidence?.candidateReview?.candidateManifestHash;
  const candidateReviewManifestTimeMatchesEvidence = candidateReviewManifestHashMatchesEvidence
    && positiveNumberOrZero(candidateManifest?.createdAtMs) > 0
    && positiveNumberOrZero(evidence?.candidateReview?.reviewedAtMs) >= positiveNumberOrZero(candidateManifest.createdAtMs)
    && positiveNumberOrZero(evidence?.candidateReview?.reviewedAtMs) <= positiveNumberOrZero(evidence?.createdAtMs);
  const approvals = approvalInputsFromEvidence(evidence, approvalEvidenceReport);
  const approvalEvidenceOk = approvalEvidenceReport.ok === true;
  const costConsentModelApproved = approvalEvidenceOk && approvalEvidenceReport.metrics.costConsentModelApproved === true;
  const humanReviewComplete = approvalEvidenceOk && approvalEvidenceReport.metrics.humanReviewComplete === true;
  const publicCardPrivateDataLeakCount = Number(
    publicCard?.moderation?.privateDataLeakCount
    || publicCardReport.metrics?.privateDataLeakCount
    || 0
  );
  const publicCardBlockedFieldCount = Number(
    publicCard?.moderation?.blockedFieldCount
    || publicCardReport.metrics?.blockedFieldCount
    || 0
  );
  const publicCardPackIdMatches = Boolean(pack?.packId)
    && publicCard?.packId === pack.packId;
  const persistencePackIdMatches = Boolean(pack?.packId)
    && persistenceReport?.packId === pack.packId;
  const diversityPackResult = Array.isArray(diversityReport?.packResults)
    ? diversityReport.packResults.find((result) => result?.packId === pack?.packId)
    : null;
  const diversityPackIdMatches = Boolean(pack?.packId)
    && diversityPackResult?.validationOk === true
    && diversityPackResult?.firstLoopPassed === true
    && diversityPackResult?.playtestEvidenceRecorded === true;
  const diversityReportMetricsCoherent = releaseDiversityMetricsCoherent(diversityReport || {});
  const assetLoaderEvidence = playtestReport?.assetLoader || playtestReport?.scoreEvidence?.assetLoader || {};
  const missingAssetCount = Number(playtestReport?.missingAssets || 0)
    + Number(assetLoaderEvidence?.missingTextureCount || 0);
  const fallbackVerified = playtestValidation.ok === true
    && Number(pack?.assetScaffold?.productionImageAssetCount || 0) === 0
    && missingAssetCount === 0
    && assetLoaderEvidence?.firstLoopSafe === true;
  const releasePrerequisites = {
    schemaValid: schemaReport.ok === true && packReport.ok === true,
    moderationPassed: packReport.ok === true
      && Number(packReport.metrics?.schemaValidationErrorCount || 0) === 0
      && Number(packReport.metrics?.invalidAssetManifestEntries || 0) === 0,
    playtestPassed: playtestValidation.ok === true && playtestReport?.playtestPassed !== false,
    assetManifestValid: assetManifestReport.ok === true && assetPromptPlanReport.ok === true,
    fallbackVerified,
    diversitySuitePassed: releaseDiversityPassed(diversityReport || {})
      && diversityReportMetricsCoherent
      && diversityPackIdMatches,
    packSaveReloadPassed: releasePersistencePassed(persistenceReport || {})
      && persistencePackIdMatches,
    publicCardPrivacyPassed: publicCardReport.ok === true
      && publicCardPackIdMatches
      && publicCardPrivateDataLeakCount === 0
      && publicCardBlockedFieldCount === 0,
    costConsentModelApproved,
    candidateAssetsReviewed: approvalEvidenceOk
      && approvalEvidenceReport.metrics.candidateAssetsReviewed === true
      && candidateReviewManifestReport.metrics.releaseReady === true
      && candidateReviewManifestHashMatchesEvidence
      && candidateReviewManifestTimeMatchesEvidence,
    humanReviewComplete
  };
  const blockingReasons = Object.entries(releasePrerequisites)
    .filter(([, passed]) => passed !== true)
    .map(([key]) => key);
  const publicReleaseEligible = blockingReasons.length === 0;
  const gate = {
    schemaVersion: PRODUCTION_RELEASE_GATE_VERSION,
    packId: String(pack?.packId || ''),
    evaluatedAtMs: nowMs,
    releaseMode: publicReleaseEligible ? 'ready-for-controlled-release' : 'prototype-gated',
    releasePrerequisites,
    approvalEvidence: evidence,
    approvalInputs: approvals,
    metrics: {
      schemaErrorCount: Number(schemaReport.metrics?.schemaErrorCount || 0),
      privateDataLeakCount: publicCardPrivateDataLeakCount,
      blockedFieldCount: publicCardBlockedFieldCount,
      publicCardPackIdMatches,
      persistencePackIdMatches,
      diversityPackIdMatches,
      diversityReportMetricsCoherent,
      missingAssetCount,
      productionImageAssetCount: Number(pack?.assetScaffold?.productionImageAssetCount || 0),
      replayabilityPromptCount: Number(diversityReport?.metrics?.promptCount || diversityReport?.metrics?.validPackCount || 0),
      approvalEvidenceSchemaErrorCount: Number(approvalEvidenceReport.metrics.schemaErrorCount || 0),
      approvalEvidenceSecretLikeCount: Number(approvalEvidenceReport.metrics.secretLikePathCount || 0),
      approvalEvidenceRawInstructionCount: Number(approvalEvidenceReport.metrics.rawInstructionPathCount || 0),
      approvalEvidenceHashMatches: approvalEvidenceReport.metrics.evidenceHashMatches === true ? 1 : 0,
      approvalEvidencePackIdMatches: approvalEvidenceReport.metrics.packIdMatches === true ? 1 : 0,
      candidateReviewManifestSchemaErrorCount: Number(candidateReviewManifestReport.metrics.schemaErrorCount || 0),
      candidateReviewManifestSecretLikeCount: Number(candidateReviewManifestReport.metrics.secretLikePathCount || 0),
      candidateReviewManifestRawInstructionCount: Number(candidateReviewManifestReport.metrics.rawInstructionPathCount || 0),
      candidateReviewManifestHashMatchesEvidence: candidateReviewManifestHashMatchesEvidence ? 1 : 0,
      candidateReviewManifestTimeMatchesEvidence: candidateReviewManifestTimeMatchesEvidence ? 1 : 0,
      candidateReviewExpectedTargetCount: Number(approvalEvidenceReport.metrics.expectedTargetCount || 0),
      candidateReviewCoverageCount: Math.min(
        Number(approvalEvidenceReport.metrics.reviewedCandidateCount || 0),
        Number(candidateReviewManifestReport.metrics.reviewedCandidateCount || 0)
      ),
      releaseGateEvaluatedAtNotFuture: positiveNumberOrZero(nowMs) > 0,
      eligiblePrerequisiteCount: Object.values(releasePrerequisites).filter((passed) => passed === true).length,
      requiredPrerequisiteCount: Object.keys(releasePrerequisites).length,
      looseApprovalInputCount: Object.values(normalizedLooseApprovals).filter(Boolean).length
    },
    publicReleaseEligible,
    blockingReasons
  };
  return gate;
}

function validateProductionReleaseGate(gate = {}, { nowMs = Date.now() } = {}) {
  const schemaReport = SCHEMA_REGISTRY?.productionReleaseGate
    ? validateGeneratedSchema(gate, SCHEMA_REGISTRY.productionReleaseGate, '$.productionReleaseGate')
    : { ok: true, errors: [] };
  const gateEvaluatedAtMs = positiveNumberOrZero(gate?.evaluatedAtMs);
  const validationNowMs = positiveNumberOrZero(nowMs);
  const releaseGateEvaluatedAtNotFuture = validationNowMs > 0
    && gateEvaluatedAtMs > 0
    && gateEvaluatedAtMs <= validationNowMs;
  const prerequisites = gate?.releasePrerequisites || {};
  const prerequisiteEntries = Object.entries(prerequisites);
  const failedPrerequisites = prerequisiteEntries
    .filter(([, passed]) => passed !== true)
    .map(([key]) => key);
  const allPrerequisitesPassed = prerequisiteEntries.length > 0
    && failedPrerequisites.length === 0;
  const blockingReasons = Array.isArray(gate?.blockingReasons) ? gate.blockingReasons : [];
  const blockingReasonSet = new Set(blockingReasons);
  const failedPrerequisiteSet = new Set(failedPrerequisites);
  const blockingReasonsMatchFailures = blockingReasons.length === failedPrerequisites.length
    && blockingReasons.every((reason) => failedPrerequisiteSet.has(reason))
    && failedPrerequisites.every((reason) => blockingReasonSet.has(reason));
  const approvals = gate?.approvalInputs || {};
  const approvalEvidenceReport = validateReleaseApprovalEvidence(gate?.approvalEvidence || {});
  const approvalEvidenceHashStable = approvalEvidenceReport.metrics.evidenceHashMatches === true;
  const approvalEvidencePackIdMatchesGate = Boolean(gate?.packId)
    && gate?.approvalEvidence?.packId === gate.packId;
  const candidateReviewManifestHashMatchesEvidence = Number(gate?.metrics?.candidateReviewManifestHashMatchesEvidence || 0) === 1;
  const candidateReviewManifestTimeMatchesEvidence = Number(gate?.metrics?.candidateReviewManifestTimeMatchesEvidence || 0) === 1;
  const approvalEvidenceContractOk = approvalEvidenceReport.checks
    .filter((check) => [
      'RELEASE_APPROVAL_EVIDENCE_SCHEMA_VALID',
      'RELEASE_APPROVAL_EVIDENCE_CONTENT_SAFE',
      'RELEASE_APPROVAL_EVIDENCE_HASH_STABLE',
      'RELEASE_APPROVAL_EVIDENCE_TIMESTAMPS_COHERENT',
      'RELEASE_APPROVAL_EVIDENCE_BOUNDARY_PRESERVED'
    ].includes(check.id))
    .every((check) => check.passed === true);
  const expectedApprovals = approvalInputsFromEvidence(gate?.approvalEvidence || {}, approvalEvidenceReport);
  const approvalInputsMatchEvidence = approvals.authModelDocumented === expectedApprovals.authModelDocumented
    && approvals.costEstimateAccepted === expectedApprovals.costEstimateAccepted
    && approvals.explicitConsentRecorded === expectedApprovals.explicitConsentRecorded
    && approvals.candidateAssetsReviewed === expectedApprovals.candidateAssetsReviewed
    && String(approvals.humanReviewSignoffHash || '') === String(expectedApprovals.humanReviewSignoffHash || '');
  const checks = [
    {
      id: 'PRODUCTION_RELEASE_GATE_SCHEMA_VALID',
      passed: schemaReport.ok === true,
      measured: { schemaErrorCount: schemaReport.errors.length, errors: schemaReport.errors.slice(0, 5) }
    },
    {
      id: 'PRODUCTION_RELEASE_GATE_PREREQUISITES_COHERENT',
      passed: gate?.publicReleaseEligible === allPrerequisitesPassed
        && blockingReasonsMatchFailures
        && (prerequisites.diversitySuitePassed !== true || (
          gate?.metrics?.diversityPackIdMatches === true
          && gate?.metrics?.diversityReportMetricsCoherent === true
        ))
        && (prerequisites.publicCardPrivacyPassed !== true || gate?.metrics?.publicCardPackIdMatches === true)
        && (prerequisites.packSaveReloadPassed !== true || gate?.metrics?.persistencePackIdMatches === true)
        && Number(gate?.metrics?.eligiblePrerequisiteCount || 0) === prerequisiteEntries.filter(([, passed]) => passed === true).length
        && Number(gate?.metrics?.requiredPrerequisiteCount || 0) === prerequisiteEntries.length,
      measured: {
        allPrerequisitesPassed,
        publicReleaseEligible: gate?.publicReleaseEligible === true,
        failedPrerequisites,
        blockingReasonsMatchFailures,
        diversityPackIdMatches: gate?.metrics?.diversityPackIdMatches === true,
        diversityReportMetricsCoherent: gate?.metrics?.diversityReportMetricsCoherent === true,
        publicCardPackIdMatches: gate?.metrics?.publicCardPackIdMatches === true,
        persistencePackIdMatches: gate?.metrics?.persistencePackIdMatches === true
      }
    },
    {
      id: 'PRODUCTION_RELEASE_GATE_TIMESTAMP_COHERENT',
      passed: gate?.metrics?.releaseGateEvaluatedAtNotFuture === releaseGateEvaluatedAtNotFuture
        && releaseGateEvaluatedAtNotFuture === true,
      measured: {
        evaluatedAtMs: gateEvaluatedAtMs,
        validationNowMs,
        releaseGateEvaluatedAtNotFuture
      }
    },
    {
      id: 'PRODUCTION_RELEASE_GATE_FAILS_CLOSED',
      passed: gate?.publicReleaseEligible === true
        ? gate?.releaseMode === 'ready-for-controlled-release' && blockingReasons.length === 0
        : gate?.releaseMode === 'prototype-gated' && blockingReasons.length > 0,
      measured: { releaseMode: gate?.releaseMode || null, blockingReasons }
    },
    {
      id: 'PRODUCTION_RELEASE_GATE_APPROVALS_EXPLICIT',
      passed: gate?.publicReleaseEligible !== true
        || (
          approvalEvidenceReport.ok === true
          && approvalEvidencePackIdMatchesGate
          && approvalInputsMatchEvidence
          && approvals.authModelDocumented === true
          && approvals.costEstimateAccepted === true
          && approvals.explicitConsentRecorded === true
          && approvals.candidateAssetsReviewed === true
          && Number(gate?.metrics?.candidateReviewManifestHashMatchesEvidence || 0) === 1
          && Number(gate?.metrics?.candidateReviewManifestTimeMatchesEvidence || 0) === 1
          && Number(gate?.metrics?.candidateReviewManifestSchemaErrorCount || 0) === 0
          && /^[0-9a-f]{64}$/.test(String(approvals.humanReviewSignoffHash || ''))
        ),
      measured: { approvals, approvalEvidenceOk: approvalEvidenceReport.ok === true, approvalInputsMatchEvidence }
    },
    {
      id: 'PRODUCTION_RELEASE_GATE_APPROVAL_EVIDENCE_VALID',
      passed: approvalEvidenceContractOk
        && approvalEvidenceHashStable
        && approvalEvidencePackIdMatchesGate
        && approvalInputsMatchEvidence
        && Number(gate?.metrics?.approvalEvidenceSchemaErrorCount || 0) === Number(approvalEvidenceReport.metrics.schemaErrorCount || 0)
        && Number(gate?.metrics?.approvalEvidenceSecretLikeCount || 0) === Number(approvalEvidenceReport.metrics.secretLikePathCount || 0)
        && Number(gate?.metrics?.approvalEvidenceRawInstructionCount || 0) === Number(approvalEvidenceReport.metrics.rawInstructionPathCount || 0)
        && Number(gate?.metrics?.approvalEvidenceHashMatches || 0) === (approvalEvidenceHashStable ? 1 : 0)
        && Number(gate?.metrics?.approvalEvidencePackIdMatches || 0) === (approvalEvidencePackIdMatchesGate ? 1 : 0)
        && (!candidateReviewManifestHashMatchesEvidence || candidateReviewManifestTimeMatchesEvidence)
        && Number(gate?.metrics?.candidateReviewExpectedTargetCount || 0) === Number(approvalEvidenceReport.metrics.expectedTargetCount || 0)
        && Number(gate?.metrics?.candidateReviewCoverageCount || 0) <= Number(approvalEvidenceReport.metrics.reviewedCandidateCount || 0),
      measured: {
        approvalEvidenceContractOk,
        approvalEvidenceHashStable,
        approvalEvidencePackIdMatchesGate,
        candidateReviewManifestHashMatchesEvidence,
        candidateReviewManifestTimeMatchesEvidence,
        approvalEvidenceComplete: approvalEvidenceReport.ok === true,
        approvalInputsMatchEvidence,
        approvalEvidenceMetrics: approvalEvidenceReport.metrics,
        gateMetrics: gate?.metrics || {}
      }
    },
    {
      id: 'PRODUCTION_RELEASE_GATE_NO_PRIVATE_OR_ASSET_LEAKS',
      passed: Number(gate?.metrics?.privateDataLeakCount || 0) === 0
        && Number(gate?.metrics?.blockedFieldCount || 0) === 0
        && Number(gate?.metrics?.approvalEvidenceSecretLikeCount || 0) === 0
        && Number(gate?.metrics?.approvalEvidenceRawInstructionCount || 0) === 0
        && Number(gate?.metrics?.candidateReviewManifestSecretLikeCount || 0) === 0
        && Number(gate?.metrics?.candidateReviewManifestRawInstructionCount || 0) === 0
        && Number(gate?.metrics?.productionImageAssetCount || 0) === 0
        && (
          Number(gate?.metrics?.missingAssetCount || 0) === 0
          || (gate?.publicReleaseEligible !== true && failedPrerequisiteSet.has('fallbackVerified'))
        ),
      measured: gate?.metrics || {}
    }
  ];
  return {
    ok: checks.every((check) => check.passed === true),
    checks,
    metrics: {
      productionReleaseGateSchemaExists: Boolean(SCHEMA_REGISTRY?.productionReleaseGate),
      publicReleaseEligible: gate?.publicReleaseEligible === true,
      releaseMode: gate?.releaseMode || null,
      blockingReasonCount: blockingReasons.length,
      costConsentModelApproved: prerequisites.costConsentModelApproved === true,
      humanReviewComplete: prerequisites.humanReviewComplete === true,
      releaseGateEvaluatedAtNotFuture,
      privateDataLeakCount: Number(gate?.metrics?.privateDataLeakCount || 0),
      approvalEvidenceOk: approvalEvidenceReport.ok === true,
      approvalEvidenceSecretLikeCount: Number(approvalEvidenceReport.metrics.secretLikePathCount || 0)
    }
  };
}

const RELEASE_EVIDENCE_SOURCE_KEYS = [
  'generatedPack',
  'playtestReport',
  'diversityReport',
  'publicCard',
  'persistenceReport',
  'approvalEvidence',
  'candidateReviewManifest'
];

function releaseEvidenceBundleHash(bundle = {}) {
  const copy = clone(bundle);
  delete copy.bundleHash;
  return stableEvidenceHash(copy);
}

function sourceHashesForReleaseEvidence({
  pack = null,
  playtestReport = null,
  diversityReport = null,
  publicCard = null,
  persistenceReport = null,
  approvalEvidence = null,
  candidateReviewManifest = null
} = {}) {
  function hashIfPresent(value) {
    if (value === null || value === undefined) return '';
    if (Array.isArray(value) && value.length === 0) return '';
    if (value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) return '';
    return stableEvidenceHash(value);
  }
  return {
    generatedPack: hashIfPresent(pack),
    playtestReport: hashIfPresent(playtestReport),
    diversityReport: hashIfPresent(diversityReport),
    publicCard: hashIfPresent(publicCard),
    persistenceReport: hashIfPresent(persistenceReport),
    approvalEvidence: hashIfPresent(approvalEvidence),
    candidateReviewManifest: hashIfPresent(candidateReviewManifest)
  };
}

function sourcePresenceForHashes(sourceHashes = {}) {
  return Object.fromEntries(
    RELEASE_EVIDENCE_SOURCE_KEYS.map((key) => [key, /^[0-9a-f]{64}$/.test(String(sourceHashes[key] || ''))])
  );
}

function sourcePackIdsForReleaseEvidence({
  pack = null,
  playtestReport = null,
  diversityReport = null,
  publicCard = null,
  persistenceReport = null,
  approvalEvidence = null,
  candidateReviewManifest = null,
  releaseGate = null
} = {}) {
  return {
    generatedPack: String(pack?.packId || ''),
    playtestReport: String(playtestReport?.packId || ''),
    diversityReport: String(diversityReport?.packId || ''),
    publicCard: String(publicCard?.packId || ''),
    persistenceReport: String(persistenceReport?.packId || ''),
    approvalEvidence: String(approvalEvidence?.packId || ''),
    candidateReviewManifest: String(candidateReviewManifest?.packId || ''),
    releaseGate: String(releaseGate?.packId || '')
  };
}

function releaseEvidencePackIdProblems(sourcePackIds = {}, expectedPackId = '') {
  const problems = [];
  for (const [source, packId] of Object.entries(sourcePackIds || {})) {
    if (packId && packId !== expectedPackId) problems.push(`${source}:${packId}`);
  }
  return problems;
}

function buildReleaseEvidenceBundle({
  pack = null,
  releaseGate = null,
  playtestReport = null,
  diversityReport = null,
  publicCard = null,
  persistenceReport = null,
  approvalEvidence = null,
  candidateReviewManifest = null,
  nowMs = Date.now()
} = {}) {
  const gate = releaseGate && typeof releaseGate === 'object'
    ? clone(releaseGate)
    : buildProductionReleaseGate({
        pack: pack || {},
        playtestReport,
        diversityReport,
        publicCard,
        persistenceReport: persistenceReport || {},
        candidateReviewManifest,
        approvalEvidence,
        nowMs
      });
  const gateApprovalEvidence = approvalEvidence || gate.approvalEvidence || null;
  const sourceHashes = sourceHashesForReleaseEvidence({
    pack,
    playtestReport,
    diversityReport,
    publicCard,
    persistenceReport,
    approvalEvidence: gateApprovalEvidence,
    candidateReviewManifest
  });
  const sourcePackIds = sourcePackIdsForReleaseEvidence({
    pack,
    playtestReport,
    diversityReport,
    publicCard,
    persistenceReport,
    approvalEvidence: gateApprovalEvidence,
    candidateReviewManifest,
    releaseGate: gate
  });
  const bundlePackId = String(gate?.packId || pack?.packId || '');
  const sourcePackIdProblems = releaseEvidencePackIdProblems(sourcePackIds, bundlePackId);
  const sourcePresence = sourcePresenceForHashes(sourceHashes);
  const presentSourceCount = Object.values(sourcePresence).filter(Boolean).length;
  const approvalEvidenceHashMatchesGate = Boolean(gate?.approvalEvidence)
    && stableEvidenceHash(gate.approvalEvidence) === sourceHashes.approvalEvidence;
  const candidateReviewManifestHashMatchesEvidence = Boolean(candidateReviewManifest?.manifestHash)
    && candidateReviewManifest.manifestHash === gateApprovalEvidence?.candidateReview?.candidateManifestHash;
  const candidateReviewManifestTimeMatchesEvidence = candidateReviewManifestHashMatchesEvidence
    && positiveNumberOrZero(candidateReviewManifest?.createdAtMs) > 0
    && positiveNumberOrZero(gateApprovalEvidence?.candidateReview?.reviewedAtMs) >= positiveNumberOrZero(candidateReviewManifest.createdAtMs)
    && positiveNumberOrZero(gateApprovalEvidence?.candidateReview?.reviewedAtMs) <= positiveNumberOrZero(gateApprovalEvidence?.createdAtMs)
    && Number(gate?.metrics?.candidateReviewManifestTimeMatchesEvidence || 0) === 1;
  const prerequisiteSnapshot = clone(gate?.releasePrerequisites || {});
  const prerequisiteSnapshotMatchesGate = stableEvidenceHash(prerequisiteSnapshot) === stableEvidenceHash(gate?.releasePrerequisites || {});
  const blockingReasons = Array.isArray(gate?.blockingReasons) ? clone(gate.blockingReasons) : [];
  const blockingReasonsMatchGate = stableEvidenceHash(blockingReasons) === stableEvidenceHash(gate?.blockingReasons || []);
  const bundleCreatedAtMs = positiveNumberOrZero(nowMs);
  const gateEvaluatedAtMs = positiveNumberOrZero(gate?.evaluatedAtMs);
  const generatedPackSourcePassed = releaseGeneratedPackSourcePassed(pack);
  const playtestSourcePassed = releasePlaytestSourcePassed(playtestReport, pack || {});
  const persistenceSourcePassed = releasePersistenceSourcePassed(persistenceReport || {}, bundlePackId);
  const publicCardSourcePassed = releasePublicCardSourcePassed(publicCard || {}, bundlePackId);
  const approvalEvidenceSourcePassed = releaseApprovalEvidenceSourcePassed(gateApprovalEvidence, pack || {});
  const candidateReviewManifestSourcePassed = releaseCandidateReviewManifestSourcePassed(candidateReviewManifest, pack || {});
  const diversitySourceIncludesGatePack = releaseDiversityIncludesPack(diversityReport || {}, bundlePackId);
  const diversitySourceMetricsCoherent = releaseDiversityPassed(diversityReport || {})
    && releaseDiversityMetricsCoherent(diversityReport || {});
  const bundleCreatedAtOrAfterGate = gateEvaluatedAtMs > 0
    && bundleCreatedAtMs >= gateEvaluatedAtMs;
  const bundleCreatedAtNotFuture = bundleCreatedAtMs > 0;
  const readyEvidenceSourcesMatchGate = gate?.publicReleaseEligible !== true
    || (
      prerequisiteSnapshotMatchesGate
      && generatedPackSourcePassed
      && playtestSourcePassed
      && persistenceSourcePassed
      && publicCardSourcePassed
      && diversitySourceIncludesGatePack
      && diversitySourceMetricsCoherent
      && approvalEvidenceHashMatchesGate
      && approvalEvidenceSourcePassed
      && candidateReviewManifestSourcePassed
      && candidateReviewManifestHashMatchesEvidence
      && candidateReviewManifestTimeMatchesEvidence
    );
  const bundle = {
    schemaVersion: RELEASE_EVIDENCE_BUNDLE_VERSION,
    bundleHash: '',
    packId: bundlePackId,
    createdAtMs: bundleCreatedAtMs,
    releaseGateHash: stableEvidenceHash(gate),
    releaseGateMode: gate?.releaseMode || 'prototype-gated',
    publicReleaseEligible: gate?.publicReleaseEligible === true,
    blockingReasons,
    sourceHashes,
    sourcePackIds,
    sourcePresence,
    prerequisiteSnapshot,
    constraints: {
      productionImageAssetsCreated: false,
      externalProviderPrivateDataStored: false,
      canonicalServerRulesChanged: false,
      v6CivicMechanicsTouched: false,
      normalGameplayVisibilityChanged: false,
      generatedPackDefaultExposure: false
    },
    metrics: {
      requiredSourceCount: RELEASE_EVIDENCE_SOURCE_KEYS.length,
      presentSourceCount,
      missingSourceCount: RELEASE_EVIDENCE_SOURCE_KEYS.length - presentSourceCount,
      sourceHashMismatchCount: 0,
      sourcePackIdMismatchCount: sourcePackIdProblems.length,
      releaseGateValid: validateProductionReleaseGate(gate, { nowMs: bundleCreatedAtMs }).ok === true,
      releaseGatePublicEligible: gate?.publicReleaseEligible === true,
      bundleCreatedAtOrAfterGate,
      bundleCreatedAtNotFuture,
      blockingReasonsMatchGate,
      prerequisiteSnapshotMatchesGate,
      readyEvidenceSourcesMatchGate,
      generatedPackSourcePassed,
      playtestSourcePassed,
      persistenceSourcePassed,
      publicCardSourcePassed,
      diversitySourceIncludesGatePack,
      diversitySourceMetricsCoherent,
      approvalEvidenceHashMatchesGate,
      approvalEvidenceSourcePassed,
      candidateReviewManifestSourcePassed,
      candidateReviewManifestHashMatchesEvidence,
      candidateReviewManifestTimeMatchesEvidence,
      productionImageAssetCount: Number(gate?.metrics?.productionImageAssetCount || 0),
      privateDataLeakCount: Number(gate?.metrics?.privateDataLeakCount || 0)
    }
  };
  bundle.bundleHash = releaseEvidenceBundleHash(bundle);
  return bundle;
}

function validateReleaseEvidenceBundle(bundle = {}, {
  pack = null,
  releaseGate = null,
  playtestReport = null,
  diversityReport = null,
  publicCard = null,
  persistenceReport = null,
  approvalEvidence = null,
  candidateReviewManifest = null,
  nowMs = Date.now()
} = {}) {
  const schemaReport = SCHEMA_REGISTRY?.releaseEvidenceBundle
    ? validateGeneratedSchema(bundle, SCHEMA_REGISTRY.releaseEvidenceBundle, '$.releaseEvidenceBundle')
    : { ok: true, errors: [] };
  const secretLikePaths = findSecretLikePaths(bundle);
  const rawInstructionPaths = findRawPromptInstructionPaths(bundle);
  const expectedBundleHash = schemaReport.ok ? releaseEvidenceBundleHash(bundle) : '';
  const bundleHashMatches = Boolean(expectedBundleHash) && bundle?.bundleHash === expectedBundleHash;
  const suppliedHashes = sourceHashesForReleaseEvidence({
    pack,
    playtestReport,
    diversityReport,
    publicCard,
    persistenceReport,
    approvalEvidence: approvalEvidence || releaseGate?.approvalEvidence || null,
    candidateReviewManifest
  });
  const suppliedPackIds = sourcePackIdsForReleaseEvidence({
    pack,
    playtestReport,
    diversityReport,
    publicCard,
    persistenceReport,
    approvalEvidence: approvalEvidence || releaseGate?.approvalEvidence || null,
    candidateReviewManifest,
    releaseGate
  });
  const sourceHashProblems = [];
  for (const key of RELEASE_EVIDENCE_SOURCE_KEYS) {
    const bundleSourceHash = String(bundle?.sourceHashes?.[key] || '');
    const suppliedSourceHash = String(suppliedHashes[key] || '');
    if (suppliedSourceHash) {
      if (bundleSourceHash !== suppliedSourceHash) sourceHashProblems.push(key);
    } else if (bundleSourceHash) {
      sourceHashProblems.push(`${key}:unsupplied`);
    }
    const expectedPresence = Boolean(bundleSourceHash);
    if (bundle?.sourcePresence?.[key] !== expectedPresence) {
      sourceHashProblems.push(`${key}:presence`);
    }
  }
  const sourcePackIdProblems = [
    ...releaseEvidencePackIdProblems(bundle?.sourcePackIds || {}, bundle?.packId || ''),
    ...Object.entries(suppliedPackIds)
      .filter(([source, packId]) => packId && bundle?.sourcePackIds?.[source] !== packId)
      .map(([source, packId]) => `${source}:supplied:${packId}`)
  ];
  for (const key of RELEASE_EVIDENCE_SOURCE_KEYS) {
    const bundleSourcePackId = String(bundle?.sourcePackIds?.[key] || '');
    const suppliedSourcePackId = String(suppliedPackIds[key] || '');
    if (!suppliedSourcePackId && bundleSourcePackId) {
      sourcePackIdProblems.push(`${key}:unsupplied:${bundleSourcePackId}`);
    }
  }
  if (releaseGate?.packId && bundle?.packId !== releaseGate.packId) {
    sourcePackIdProblems.push(`releaseGate:bundle:${releaseGate.packId}`);
  }
  if (pack?.packId && bundle?.packId !== pack.packId) {
    sourcePackIdProblems.push(`generatedPack:bundle:${pack.packId}`);
  }
  const releaseGateProvided = Boolean(releaseGate);
  const releaseGateHashExpected = releaseGateProvided ? stableEvidenceHash(releaseGate) : '';
  const releaseGateHashMatches = releaseGateProvided && bundle?.releaseGateHash === releaseGateHashExpected;
  const gateReport = releaseGate
    ? validateProductionReleaseGate(releaseGate, { nowMs })
    : { ok: false };
  const bundleCreatedAtMs = positiveNumberOrZero(bundle?.createdAtMs);
  const validationNowMs = positiveNumberOrZero(nowMs);
  const bundleCreatedAtOrAfterGate = releaseGate
    ? positiveNumberOrZero(releaseGate?.evaluatedAtMs) > 0
      && bundleCreatedAtMs >= positiveNumberOrZero(releaseGate.evaluatedAtMs)
    : false;
  const bundleCreatedAtNotFuture = validationNowMs > 0
    && bundleCreatedAtMs > 0
    && bundleCreatedAtMs <= validationNowMs;
  const blockingReasonsMatchGate = releaseGate
    ? stableEvidenceHash(bundle?.blockingReasons || []) === stableEvidenceHash(releaseGate?.blockingReasons || [])
    : false;
  const prerequisiteSnapshotMatchesGate = releaseGate
    ? stableEvidenceHash(bundle?.prerequisiteSnapshot || {}) === stableEvidenceHash(releaseGate?.releasePrerequisites || {})
    : false;
  const generatedPackSourcePassed = releaseGeneratedPackSourcePassed(pack);
  const playtestSourcePassed = releasePlaytestSourcePassed(playtestReport, pack || {});
  const persistenceSourcePassed = releasePersistenceSourcePassed(persistenceReport || {}, bundle?.packId || releaseGate?.packId || pack?.packId || '');
  const publicCardSourcePassed = releasePublicCardSourcePassed(publicCard || {}, bundle?.packId || releaseGate?.packId || pack?.packId || '');
  const approvalEvidenceSource = approvalEvidence || releaseGate?.approvalEvidence || null;
  const approvalEvidenceSourcePassed = releaseApprovalEvidenceSourcePassed(approvalEvidenceSource, pack || {});
  const candidateReviewManifestSourcePassed = releaseCandidateReviewManifestSourcePassed(candidateReviewManifest, pack || {});
  const diversitySourceIncludesGatePack = diversityReport
    ? releaseDiversityIncludesPack(diversityReport, bundle?.packId || releaseGate?.packId || pack?.packId || '')
    : false;
  const diversitySourceMetricsCoherent = diversityReport
    ? releaseDiversityPassed(diversityReport) && releaseDiversityMetricsCoherent(diversityReport)
    : false;
  const presentSourceCount = RELEASE_EVIDENCE_SOURCE_KEYS
    .filter((key) => Boolean(bundle?.sourceHashes?.[key]))
    .length;
  const suppliedSourceCount = RELEASE_EVIDENCE_SOURCE_KEYS
    .filter((key) => Boolean(suppliedHashes[key]))
    .length;
  const sourceCoverageOk = bundle?.publicReleaseEligible === true
    ? presentSourceCount === RELEASE_EVIDENCE_SOURCE_KEYS.length
      && suppliedSourceCount === RELEASE_EVIDENCE_SOURCE_KEYS.length
      && releaseGateProvided
    : presentSourceCount >= 1 && releaseGateProvided;
  const approvalEvidenceHashMatchesGate = releaseGate?.approvalEvidence
    ? bundle?.sourceHashes?.approvalEvidence === stableEvidenceHash(releaseGate.approvalEvidence)
    : false;
  const candidateReviewManifestHashMatchesEvidence = candidateReviewManifest?.manifestHash
    ? candidateReviewManifest.manifestHash === (approvalEvidence || releaseGate?.approvalEvidence || {})?.candidateReview?.candidateManifestHash
      && bundle?.sourceHashes?.candidateReviewManifest === stableEvidenceHash(candidateReviewManifest)
    : false;
  const reviewEvidence = approvalEvidence || releaseGate?.approvalEvidence || {};
  const candidateReviewManifestTimeMatchesEvidence = candidateReviewManifestHashMatchesEvidence
    && positiveNumberOrZero(candidateReviewManifest?.createdAtMs) > 0
    && positiveNumberOrZero(reviewEvidence?.candidateReview?.reviewedAtMs) >= positiveNumberOrZero(candidateReviewManifest.createdAtMs)
    && positiveNumberOrZero(reviewEvidence?.candidateReview?.reviewedAtMs) <= positiveNumberOrZero(reviewEvidence?.createdAtMs)
    && (!releaseGate || Number(releaseGate?.metrics?.candidateReviewManifestTimeMatchesEvidence || 0) === 1);
  const readyEvidenceSourcesMatchGate = bundle?.publicReleaseEligible !== true
    || (
      prerequisiteSnapshotMatchesGate
      && generatedPackSourcePassed
      && playtestSourcePassed
      && persistenceSourcePassed
      && publicCardSourcePassed
      && diversitySourceIncludesGatePack
      && diversitySourceMetricsCoherent
      && approvalEvidenceHashMatchesGate
      && approvalEvidenceSourcePassed
      && candidateReviewManifestSourcePassed
      && candidateReviewManifestHashMatchesEvidence
      && candidateReviewManifestTimeMatchesEvidence
    );
  const constraints = bundle?.constraints || {};
  const boundaryPreserved = constraints.productionImageAssetsCreated === false
    && constraints.externalProviderPrivateDataStored === false
    && constraints.canonicalServerRulesChanged === false
    && constraints.v6CivicMechanicsTouched === false
    && constraints.normalGameplayVisibilityChanged === false
    && constraints.generatedPackDefaultExposure === false
    && Number(bundle?.metrics?.productionImageAssetCount || 0) === 0
    && Number(bundle?.metrics?.privateDataLeakCount || 0) === 0;
  const metricsMatch = Number(bundle?.metrics?.presentSourceCount || 0) === presentSourceCount
    && Number(bundle?.metrics?.missingSourceCount || 0) === RELEASE_EVIDENCE_SOURCE_KEYS.length - presentSourceCount
    && Number(bundle?.metrics?.requiredSourceCount || 0) === RELEASE_EVIDENCE_SOURCE_KEYS.length
    && Number(bundle?.metrics?.sourceHashMismatchCount || 0) === sourceHashProblems.length
    && Number(bundle?.metrics?.sourcePackIdMismatchCount || 0) === sourcePackIdProblems.length
    && bundle?.metrics?.releaseGateValid === (gateReport.ok === true)
    && bundle?.metrics?.releaseGatePublicEligible === (bundle?.publicReleaseEligible === true)
    && bundle?.metrics?.bundleCreatedAtOrAfterGate === bundleCreatedAtOrAfterGate
    && bundleCreatedAtOrAfterGate === true
    && bundle?.metrics?.bundleCreatedAtNotFuture === bundleCreatedAtNotFuture
    && bundleCreatedAtNotFuture === true
    && bundle?.metrics?.blockingReasonsMatchGate === blockingReasonsMatchGate
    && blockingReasonsMatchGate === true
    && bundle?.metrics?.prerequisiteSnapshotMatchesGate === prerequisiteSnapshotMatchesGate
    && bundle?.metrics?.generatedPackSourcePassed === generatedPackSourcePassed
    && bundle?.metrics?.playtestSourcePassed === playtestSourcePassed
    && bundle?.metrics?.persistenceSourcePassed === persistenceSourcePassed
    && bundle?.metrics?.publicCardSourcePassed === publicCardSourcePassed
    && bundle?.metrics?.diversitySourceIncludesGatePack === diversitySourceIncludesGatePack
    && bundle?.metrics?.diversitySourceMetricsCoherent === diversitySourceMetricsCoherent
    && bundle?.metrics?.readyEvidenceSourcesMatchGate === readyEvidenceSourcesMatchGate
    && readyEvidenceSourcesMatchGate === true
    && bundle?.metrics?.approvalEvidenceHashMatchesGate === approvalEvidenceHashMatchesGate
    && bundle?.metrics?.approvalEvidenceSourcePassed === approvalEvidenceSourcePassed
    && bundle?.metrics?.candidateReviewManifestSourcePassed === candidateReviewManifestSourcePassed
    && bundle?.metrics?.candidateReviewManifestHashMatchesEvidence === candidateReviewManifestHashMatchesEvidence
    && bundle?.metrics?.candidateReviewManifestTimeMatchesEvidence === candidateReviewManifestTimeMatchesEvidence;
  const checks = [
    {
      id: 'RELEASE_EVIDENCE_BUNDLE_SCHEMA_VALID',
      passed: schemaReport.ok === true,
      measured: { schemaErrorCount: schemaReport.errors.length, errors: schemaReport.errors.slice(0, 5) }
    },
    {
      id: 'RELEASE_EVIDENCE_BUNDLE_CONTENT_SAFE',
      passed: secretLikePaths.length === 0 && rawInstructionPaths.length === 0,
      measured: { secretLikePaths, rawInstructionPaths }
    },
    {
      id: 'RELEASE_EVIDENCE_BUNDLE_HASH_STABLE',
      passed: bundleHashMatches,
      measured: { expectedBundleHash, actualBundleHash: bundle?.bundleHash || '' }
    },
    {
      id: 'RELEASE_EVIDENCE_BUNDLE_SOURCE_HASHES_MATCH',
      passed: sourceHashProblems.length === 0 && releaseGateHashMatches,
      measured: { sourceHashProblems, releaseGateHashMatches }
    },
    {
      id: 'RELEASE_EVIDENCE_BUNDLE_PACK_IDS_MATCH',
      passed: sourcePackIdProblems.length === 0,
      measured: { packId: bundle?.packId || '', sourcePackIdProblems }
    },
    {
      id: 'RELEASE_EVIDENCE_BUNDLE_SOURCE_COVERAGE',
      passed: sourceCoverageOk,
      measured: {
        presentSourceCount,
        suppliedSourceCount,
        requiredSourceCount: RELEASE_EVIDENCE_SOURCE_KEYS.length,
        releaseGateProvided: Boolean(releaseGate),
        publicReleaseEligible: bundle?.publicReleaseEligible === true
      }
    },
    {
      id: 'RELEASE_EVIDENCE_BUNDLE_RELEASE_GATE_VALID',
      passed: releaseGateProvided
        && gateReport.ok === true
        && (!releaseGate || bundle?.publicReleaseEligible === (releaseGate.publicReleaseEligible === true))
        && (!releaseGate || bundle?.releaseGateMode === releaseGate.releaseMode),
      measured: { releaseGateProvided, releaseGateValid: gateReport.ok === true }
    },
    {
      id: 'RELEASE_EVIDENCE_BUNDLE_METRICS_COHERENT',
      passed: metricsMatch,
      measured: {
        presentSourceCount,
        sourceHashProblemCount: sourceHashProblems.length,
        sourcePackIdProblemCount: sourcePackIdProblems.length,
        bundleCreatedAtOrAfterGate,
        bundleCreatedAtNotFuture,
        blockingReasonsMatchGate,
        prerequisiteSnapshotMatchesGate,
        generatedPackSourcePassed,
        playtestSourcePassed,
        persistenceSourcePassed,
        publicCardSourcePassed,
        candidateReviewManifestSourcePassed,
        diversitySourceIncludesGatePack,
        diversitySourceMetricsCoherent,
        readyEvidenceSourcesMatchGate,
        approvalEvidenceHashMatchesGate,
        approvalEvidenceSourcePassed,
        candidateReviewManifestHashMatchesEvidence,
        candidateReviewManifestTimeMatchesEvidence
      }
    },
    {
      id: 'RELEASE_EVIDENCE_BUNDLE_BOUNDARY_PRESERVED',
      passed: boundaryPreserved,
      measured: { constraints, metrics: bundle?.metrics || {} }
    }
  ];
  return {
    ok: checks.every((check) => check.passed === true),
    checks,
    metrics: {
      releaseEvidenceBundleSchemaExists: Boolean(SCHEMA_REGISTRY?.releaseEvidenceBundle),
      schemaErrorCount: schemaReport.errors.length,
      secretLikePathCount: secretLikePaths.length,
      rawInstructionPathCount: rawInstructionPaths.length,
      bundleHashMatches,
      sourceHashMismatchCount: sourceHashProblems.length,
      sourcePackIdMismatchCount: sourcePackIdProblems.length,
      releaseGateHashMatches,
      presentSourceCount,
      requiredSourceCount: RELEASE_EVIDENCE_SOURCE_KEYS.length,
      sourceCoverageOk,
      releaseGateValid: gateReport.ok === true,
      bundleCreatedAtOrAfterGate,
      bundleCreatedAtNotFuture,
      blockingReasonsMatchGate,
      prerequisiteSnapshotMatchesGate,
      generatedPackSourcePassed,
      playtestSourcePassed,
      persistenceSourcePassed,
      publicCardSourcePassed,
      diversitySourceIncludesGatePack,
      diversitySourceMetricsCoherent,
      approvalEvidenceSourcePassed,
      candidateReviewManifestSourcePassed,
      approvalEvidenceHashMatchesGate,
      candidateReviewManifestHashMatchesEvidence,
      candidateReviewManifestTimeMatchesEvidence,
      readyEvidenceSourcesMatchGate,
      boundaryPreserved
    }
  };
}

function normalizeGalleryTag(value = '') {
  const tag = slugForTarget(value).slice(0, 32);
  if (tag.length < 2) return '';
  if (PUBLIC_CARD_FORBIDDEN_TERMS.some((term) => tag.includes(slugForTarget(term)))) return '';
  return tag;
}

function normalizeReviewerId(value = '') {
  const reviewerId = slugForTarget(value || 'generated-pack-review').slice(0, 48);
  if (reviewerId.length < 3) return 'generated-pack-review';
  if (PUBLIC_CARD_FORBIDDEN_TERMS.some((term) => reviewerId.includes(slugForTarget(term)))) {
    return 'generated-pack-review';
  }
  return reviewerId;
}

function normalizeGalleryTags(tags = [], card = {}) {
  const rawTags = Array.isArray(tags)
    ? tags
    : String(tags || '').split(',');
  const fallbackTags = [
    ...(Array.isArray(card?.promptKeywordHints) ? card.promptKeywordHints : []),
    String(card?.title || '').split(/\s+/)[0]
  ];
  return [...new Set([...rawTags, ...fallbackTags]
    .map(normalizeGalleryTag)
    .filter(Boolean))]
    .slice(0, 8);
}

function normalizeGallerySearch(value = '') {
  const forbiddenTokens = new Set(PUBLIC_CARD_FORBIDDEN_TERMS
    .flatMap((term) => slugForTarget(term).split('-'))
    .filter(Boolean));
  const tokens = String(value || '')
    .toLowerCase()
    .match(/[a-z0-9]+/g) || [];
  return tokens
    .filter((token) => token.length >= 2)
    .filter((token) => !forbiddenTokens.has(token))
    .slice(0, 8)
    .join(' ');
}

function publicCardReviewModeration(card = {}, validationReport = null, nowMs = Date.now()) {
  const report = validationReport || validatePublicPackCard(card);
  return {
    status: report.ok === true ? 'passed' : 'failed',
    rawPromptIncluded: report.metrics?.rawPromptIncluded === true,
    privateDataLeakCount: Number(report.metrics?.privateDataLeakCount || 0),
    blockedFieldCount: Number(report.metrics?.blockedFieldCount || 0),
    reviewedAtMs: nowMs
  };
}

function defaultPublicCardCuration(card = {}, validationReport = null, nowMs = Date.now()) {
  return {
    schemaVersion: PUBLIC_PACK_GALLERY_CURATION_VERSION,
    approvalStatus: 'pending',
    tags: normalizeGalleryTags([], card),
    moderation: publicCardReviewModeration(card, validationReport, nowMs),
    reviewerSignoff: null
  };
}

function signoffHashForReview({ cardId = '', decision = '', reviewerId = '', tags = [], signoffNote = '', nowMs = 0 } = {}) {
  return sha256(JSON.stringify({
    cardId,
    decision,
    reviewerId,
    tags,
    signoffNote: String(signoffNote || '').slice(0, 240),
    nowMs
  }));
}

function persistPublicCardRecord(record = {}) {
  safeWriteJson(publicCardPath(record.cardId), record);
  publicCardStore.set(record.cardId, clone(record));
  return clone(record);
}

function persistPublicPackCard(card = {}, validationReport = null) {
  const report = validationReport ? clone(validationReport) : validatePublicPackCard(card);
  const savedAtMs = Date.now();
  const record = {
    schemaVersion: 'agent-town-generated-pack-public-card-record-v1',
    cardId: card.cardId,
    savedAtMs,
    publicCard: clone(card),
    validationReport: report,
    curation: defaultPublicCardCuration(card, report, savedAtMs)
  };
  return persistPublicCardRecord(record);
}

function publishPublicPackCard(owner = {}, packId = '', { nowMs = Date.now() } = {}) {
  const loaded = reloadGeneratedPack(owner, packId);
  const card = buildPublicPackCard({
    pack: loaded.generatedPack,
    playtestReport: loaded.playtestReport || currentPlaytestReport(owner),
    owner,
    nowMs
  });
  const validationReport = validatePublicPackCard(card, owner);
  if (!validationReport.ok) {
    const error = new Error('PUBLIC_PACK_CARD_REJECTED');
    error.details = { validationReport };
    throw error;
  }
  const record = persistPublicPackCard(card, validationReport);
  return {
    publicCard: record.publicCard,
    validationReport: record.validationReport
  };
}

function getPublicPackCard(cardId = '') {
  const key = String(cardId || '').trim();
  if (!key) return null;
  const record = readPublicCardRecord(key);
  if (!record?.publicCard) return null;
  const validationReport = validatePublicPackCard(record.publicCard);
  if (!validationReport.ok) return null;
  publicCardStore.set(key, clone({ ...record, validationReport }));
  return clone(record.publicCard);
}

function reviewPublicPackCard(cardId = '', review = {}, { nowMs = Date.now() } = {}) {
  const record = readPublicCardRecord(cardId);
  if (!record?.publicCard) {
    const error = new Error('PUBLIC_CARD_NOT_FOUND');
    error.details = { cardId };
    throw error;
  }
  const decision = String(review?.decision || 'approve').trim().toLowerCase();
  if (!['approve', 'reject'].includes(decision)) {
    const error = new Error('PUBLIC_GALLERY_REVIEW_REJECTED');
    error.details = { reason: 'INVALID_REVIEW_DECISION', decision };
    throw error;
  }
  const validationReport = validatePublicPackCard(record.publicCard);
  if (!validationReport.ok && decision === 'approve') {
    const error = new Error('PUBLIC_PACK_CARD_REJECTED');
    error.details = { validationReport };
    throw error;
  }
  const reviewerId = normalizeReviewerId(review?.reviewerId);
  const tags = normalizeGalleryTags(review?.tags, record.publicCard);
  const moderation = publicCardReviewModeration(record.publicCard, validationReport, nowMs);
  const approvalStatus = decision === 'approve' ? 'approved' : 'rejected';
  const reviewerSignoff = {
    reviewerId,
    signedOffAtMs: nowMs,
    signoffHash: signoffHashForReview({
      cardId: record.cardId,
      decision,
      reviewerId,
      tags,
      signoffNote: review?.signoffNote,
      nowMs
    })
  };
  const curation = {
    schemaVersion: PUBLIC_PACK_GALLERY_CURATION_VERSION,
    approvalStatus,
    tags,
    moderation,
    reviewerSignoff
  };
  const updated = persistPublicCardRecord({
    ...record,
    savedAtMs: nowMs,
    validationReport,
    curation
  });
  return {
    publicCard: clone(updated.publicCard),
    curation: clone(updated.curation),
    validationReport
  };
}

function unpublishPublicPackCard(cardId = '', review = {}, { nowMs = Date.now() } = {}) {
  const record = readPublicCardRecord(cardId);
  if (!record?.cardId) {
    const error = new Error('PUBLIC_CARD_NOT_FOUND');
    error.details = { cardId };
    throw error;
  }
  const reviewerId = normalizeReviewerId(review?.reviewerId);
  const tags = normalizeGalleryTags(review?.tags, record.publicCard || {});
  const validationReport = record.publicCard ? validatePublicPackCard(record.publicCard) : record.validationReport || null;
  const curation = {
    schemaVersion: PUBLIC_PACK_GALLERY_CURATION_VERSION,
    approvalStatus: 'unpublished',
    tags,
    moderation: record.publicCard
      ? publicCardReviewModeration(record.publicCard, validationReport, nowMs)
      : {
          status: 'passed',
          rawPromptIncluded: false,
          privateDataLeakCount: 0,
          blockedFieldCount: 0,
          reviewedAtMs: nowMs
        },
    reviewerSignoff: {
      reviewerId,
      signedOffAtMs: nowMs,
      signoffHash: signoffHashForReview({
        cardId: record.cardId,
        decision: 'unpublish',
        reviewerId,
        tags,
        signoffNote: review?.signoffNote,
        nowMs
      })
    }
  };
  persistPublicCardRecord({
    ...record,
    savedAtMs: nowMs,
    publicCard: null,
    curation,
    unpublishedAtMs: nowMs
  });
  return {
    unpublishReport: {
      schemaVersion: 'agent-town-generated-pack-unpublish-report-v1',
      cardId: record.cardId,
      unpublishedAtMs: nowMs,
      publicCardRemoved: true,
      galleryVisible: false
    }
  };
}

function galleryEntryFromRecord(record = {}) {
  const card = record.publicCard;
  const curation = record.curation || defaultPublicCardCuration(card, record.validationReport, record.savedAtMs || Date.now());
  if (!card || curation.approvalStatus !== 'approved') return null;
  const validationReport = validatePublicPackCard(card);
  if (!validationReport.ok) return null;
  const moderation = curation.moderation || publicCardReviewModeration(card, validationReport, record.savedAtMs || Date.now());
  const reviewerSignoff = curation.reviewerSignoff || null;
  if (moderation.status !== 'passed' || !reviewerSignoff?.reviewerId || !reviewerSignoff?.signoffHash) return null;
  return {
    schemaVersion: PUBLIC_PACK_GALLERY_ENTRY_VERSION,
    cardId: card.cardId,
    packId: card.packId,
    packHash: card.packHash,
    title: card.title,
    styleSummary: card.styleSummary,
    promptKeywordHints: clone(card.promptKeywordHints || []),
    screenshot: clone(card.screenshot || {}),
    assetManifestSummary: clone(card.assetManifestSummary || {}),
    tags: normalizeGalleryTags(curation.tags, card),
    approvalStatus: 'approved',
    approvedAtMs: Number(reviewerSignoff.signedOffAtMs || record.savedAtMs || 0),
    moderation: {
      status: 'passed',
      rawPromptIncluded: moderation.rawPromptIncluded === true,
      privateDataLeakCount: Number(moderation.privateDataLeakCount || 0),
      blockedFieldCount: Number(moderation.blockedFieldCount || 0),
      reviewedAtMs: Number(moderation.reviewedAtMs || reviewerSignoff.signedOffAtMs || record.savedAtMs || 0)
    },
    reviewerSignoff: {
      reviewerId: normalizeReviewerId(reviewerSignoff.reviewerId),
      signedOffAtMs: Number(reviewerSignoff.signedOffAtMs || record.savedAtMs || 0),
      signoffHash: String(reviewerSignoff.signoffHash || '')
    }
  };
}

function galleryEntrySearchText(entry = {}) {
  return [
    entry.title,
    entry.styleSummary,
    ...(Array.isArray(entry.promptKeywordHints) ? entry.promptKeywordHints : []),
    ...(Array.isArray(entry.tags) ? entry.tags : [])
  ].join(' ').toLowerCase();
}

function validatePublicPackGallery(gallery = {}) {
  const schemaReport = SCHEMA_REGISTRY?.publicPackGallery
    ? validateGeneratedSchema(gallery, SCHEMA_REGISTRY.publicPackGallery, '$.publicPackGallery')
    : { ok: true, errors: [] };
  const entries = Array.isArray(gallery?.entries) ? gallery.entries : [];
  const blockedFields = publicCardBlockedPaths({ entries });
  const privateDataLeakCount = Math.max(Number(gallery?.metrics?.privateDataLeakCount || 0), blockedFields.length);
  const checks = [
    {
      id: 'PUBLIC_GALLERY_SCHEMA_VALID',
      passed: schemaReport.ok === true,
      measured: { schemaErrorCount: schemaReport.errors.length, errors: schemaReport.errors.slice(0, 5) }
    },
    {
      id: 'PUBLIC_GALLERY_APPROVED_ONLY',
      passed: entries.every((entry) => entry?.approvalStatus === 'approved'),
      measured: { entryCount: entries.length }
    },
    {
      id: 'PUBLIC_GALLERY_MODERATION_METADATA_REQUIRED',
      passed: entries.every((entry) => entry?.moderation?.status === 'passed'
        && entry?.moderation?.rawPromptIncluded === false
        && Number(entry?.moderation?.privateDataLeakCount || 0) === 0
        && Number(entry?.moderation?.blockedFieldCount || 0) === 0
        && Boolean(entry?.reviewerSignoff?.reviewerId)
        && /^[a-f0-9]{64}$/.test(String(entry?.reviewerSignoff?.signoffHash || ''))),
      measured: {
        missingModerationCount: entries.filter((entry) => !entry?.moderation || !entry?.reviewerSignoff).length
      }
    },
    {
      id: 'PUBLIC_GALLERY_NO_PRIVATE_STATE',
      passed: privateDataLeakCount === 0,
      measured: {
        privateDataLeakCount,
        blockedFields: blockedFields.slice(0, 5)
      }
    }
  ];
  return {
    ok: checks.every((check) => check.passed === true),
    checks,
    metrics: {
      publicGallerySchemaExists: Boolean(SCHEMA_REGISTRY?.publicPackGallery),
      approvedOnlyGallery: checks.find((check) => check.id === 'PUBLIC_GALLERY_APPROVED_ONLY')?.passed === true,
      moderationMetadataRequired: checks.find((check) => check.id === 'PUBLIC_GALLERY_MODERATION_METADATA_REQUIRED')?.passed === true,
      privateDataLeakCount
    }
  };
}

function listPublicPackGallery({ search = '', tags = [], sort = 'newest', cursor = '0', limit = 24, nowMs = Date.now() } = {}) {
  const normalizedSearch = normalizeGallerySearch(search);
  const requiredTags = (Array.isArray(tags) ? tags : String(tags || '').split(','))
    .map(normalizeGalleryTag)
    .filter(Boolean);
  const sortMode = ['newest', 'oldest', 'title'].includes(String(sort || '').trim()) ? String(sort || '').trim() : 'newest';
  const pageLimit = Math.max(1, Math.min(50, Number.parseInt(limit, 10) || 24));
  const offset = Math.max(0, Number.parseInt(cursor, 10) || 0);
  const records = listPublicCardRecords();
  const hiddenPendingOrRejectedCount = records.filter((record) => record?.publicCard && record?.curation?.approvalStatus !== 'approved').length;
  const approvedEntries = records
    .map(galleryEntryFromRecord)
    .filter(Boolean)
    .filter((entry) => {
      if (requiredTags.length > 0 && !requiredTags.every((tag) => entry.tags.includes(tag))) return false;
      if (!normalizedSearch) return true;
      return normalizedSearch.split(/\s+/).every((term) => galleryEntrySearchText(entry).includes(term));
    })
    .sort((a, b) => {
      if (sortMode === 'oldest') return a.approvedAtMs - b.approvedAtMs || a.cardId.localeCompare(b.cardId);
      if (sortMode === 'title') return a.title.localeCompare(b.title) || b.approvedAtMs - a.approvedAtMs;
      return b.approvedAtMs - a.approvedAtMs || a.cardId.localeCompare(b.cardId);
    });
  const entries = approvedEntries.slice(offset, offset + pageLimit);
  const nextOffset = offset + entries.length;
  const gallery = {
    schemaVersion: PUBLIC_PACK_GALLERY_VERSION,
    generatedAtMs: nowMs,
    query: {
      search: normalizedSearch,
      tags: requiredTags,
      sort: sortMode
    },
    page: {
      cursor: String(offset),
      nextCursor: nextOffset < approvedEntries.length ? String(nextOffset) : '',
      limit: pageLimit,
      returnedCount: entries.length,
      totalApprovedCount: approvedEntries.length
    },
    metrics: {
      approvedOnlyGallery: entries.every((entry) => entry.approvalStatus === 'approved'),
      moderationMetadataRequired: entries.every((entry) => entry.moderation?.status === 'passed' && Boolean(entry.reviewerSignoff?.signoffHash)),
      privateDataLeakCount: publicCardBlockedPaths({ entries }).length,
      hiddenPendingOrRejectedCount
    },
    entries
  };
  return {
    gallery,
    validationReport: validatePublicPackGallery(gallery)
  };
}

function diversityTokenSet(parts = []) {
  return new Set(parts
    .flatMap((part) => String(part || '').toLowerCase().match(/[a-z0-9]+/g) || [])
    .filter((token) => token.length >= 3 && !DIVERSITY_GENERIC_TOKENS.has(token)));
}

function packLabelNameTokens(pack = {}) {
  return diversityTokenSet([
    pack?.generationBrief?.theme?.primary,
    pack?.generationBrief?.theme?.secondary,
    pack?.stylePack?.name,
    pack?.universePack?.name,
    ...(pack?.generationBrief?.keywordHints || []),
    ...(pack?.generationBrief?.visualStyle?.materialMotifs || []),
    ...(pack?.generationBrief?.civilizationFlavor?.species || []),
    ...(pack?.generationBrief?.civilizationFlavor?.factions || []),
    ...(pack?.generationBrief?.civilizationFlavor?.cultures || [])
  ]);
}

function packMotifTokens(pack = {}) {
  return diversityTokenSet([
    ...(pack?.generationBrief?.keywordHints || []),
    ...(pack?.generationBrief?.visualStyle?.materialMotifs || []),
    ...(pack?.generationBrief?.civilizationFlavor?.techFlavor || []),
    ...(pack?.universePack?.species || []).map((item) => item.name),
    ...(pack?.universePack?.factions || []).map((item) => item.name),
    ...(pack?.universePack?.cultures || []).map((item) => item.name)
  ]);
}

function jaccardDistance(first = new Set(), second = new Set()) {
  const union = new Set([...first, ...second]);
  if (union.size === 0) return 0;
  let intersection = 0;
  for (const token of first) {
    if (second.has(token)) intersection += 1;
  }
  return Number((1 - (intersection / union.size)).toFixed(3));
}

function packPaletteColors(pack = {}) {
  const palette = pack?.stylePack?.palette || {};
  const nested = [
    ...Object.values(palette.terrain || {}),
    ...Object.values(palette.state || {})
  ];
  return [
    palette.primary,
    palette.secondary,
    palette.accent,
    palette.focus,
    palette.selected,
    palette.light,
    palette.ambient,
    ...nested
  ].filter(isHexColor);
}

function colorDistance(first, second) {
  const a = hexToRgb(first);
  const b = hexToRgb(second);
  if (!a || !b) return 0;
  return Math.sqrt(
    ((a.r - b.r) ** 2)
    + ((a.g - b.g) ** 2)
    + ((a.b - b.b) ** 2)
  ) / Math.sqrt(3);
}

function paletteDistance(firstPack = {}, secondPack = {}) {
  const first = packPaletteColors(firstPack);
  const second = packPaletteColors(secondPack);
  const count = Math.min(first.length, second.length);
  if (count === 0) return 0;
  let total = 0;
  for (let index = 0; index < count; index += 1) {
    total += colorDistance(first[index], second[index]);
  }
  return Number((total / count).toFixed(3));
}

function screenshotHashForReport(report = {}) {
  return String(report?.screenshotEvidence?.hash || '').trim().toLowerCase();
}

function reportForPack(pack = {}, reportsByPackId = new Map()) {
  return reportsByPackId.get(pack.packId) || null;
}

function pairwiseDiversityComparisons(packs = [], reportsByPackId = new Map(), screenshotsRequired = false) {
  const comparisons = [];
  for (let firstIndex = 0; firstIndex < packs.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < packs.length; secondIndex += 1) {
      const first = packs[firstIndex];
      const second = packs[secondIndex];
      const firstHash = screenshotHashForReport(reportForPack(first, reportsByPackId));
      const secondHash = screenshotHashForReport(reportForPack(second, reportsByPackId));
      const screenshotComparable = /^[0-9a-f]{64}$/.test(firstHash) && /^[0-9a-f]{64}$/.test(secondHash);
      const screenshotDistance = screenshotComparable && firstHash !== secondHash ? 1 : 0;
      const palette = paletteDistance(first, second);
      const labelName = jaccardDistance(packLabelNameTokens(first), packLabelNameTokens(second));
      const motif = jaccardDistance(packMotifTokens(first), packMotifTokens(second));
      const screenshotWeight = screenshotsRequired ? 0.2 : 0;
      const score = Number((
        (palette * 0.18)
        + (labelName * (screenshotsRequired ? 0.36 : 0.46))
        + (motif * (screenshotsRequired ? 0.26 : 0.36))
        + (screenshotDistance * screenshotWeight)
      ).toFixed(3));
      comparisons.push({
        packIds: [first.packId, second.packId],
        paletteDistance: palette,
        labelNameDistance: labelName,
        motifDistance: motif,
        screenshotDistance,
        screenshotComparable,
        meaningfulDifferenceScore: score
      });
    }
  }
  return comparisons;
}

function analyzePackDiversity(packs = [], options = {}) {
  const safePacks = Array.isArray(packs) ? packs.filter(Boolean) : [];
  const playtestReports = Array.isArray(options.playtestReports) ? options.playtestReports.filter(Boolean) : [];
  const reportsByPackId = new Map(playtestReports.map((report) => [report.packId, report]));
  const requirePlaytestReports = options.requirePlaytestReports === true || playtestReports.length > 0;
  const expectedPromptCount = Number.isFinite(Number(options.expectedPromptCount))
    ? Number(options.expectedPromptCount)
    : (safePacks.length >= REPLAYABILITY_PROMPT_SUITE.length ? REPLAYABILITY_PROMPT_SUITE.length : safePacks.length);
  const meaningfulDifferenceScoreMin = Number.isFinite(Number(options.meaningfulDifferenceScoreMin))
    ? Number(options.meaningfulDifferenceScoreMin)
    : (expectedPromptCount >= REPLAYABILITY_PROMPT_SUITE.length ? 0.65 : 0.5);
  const signatures = safePacks.map((pack) => pack?.validationReport?.metrics?.replayabilitySignature || sha256(JSON.stringify({
    theme: pack?.generationBrief?.theme?.primary || '',
    style: pack?.stylePack?.name || '',
    universe: pack?.universePack?.name || '',
    palette: pack?.stylePack?.palette || {}
  })).slice(0, 16));
  const validationReports = safePacks.map((pack) => validateGeneratedPack(pack));
  const packResults = safePacks.map((pack, index) => {
    const validationReport = validationReports[index];
    const playtestReport = reportForPack(pack, reportsByPackId);
    const playtestValidation = playtestReport ? validatePlaytestReport(playtestReport, pack) : null;
    const packForContentScan = { ...pack, validationReport: undefined };
    const rawPromptLeakCount = findRawPromptInstructionPaths(packForContentScan).length;
    const forbiddenAuthorityCount = findForbiddenAuthorityPaths(packForContentScan).length;
    const firstLoopPassed = playtestReport
      ? playtestReport.playtestPassed === true && playtestValidation?.ok === true
      : validationReport.metrics.firstLoopReady === true;
    return {
      packId: pack.packId,
      promptHash: pack.prompt?.hash || pack.generationBrief?.promptHash || null,
      validationOk: validationReport.ok === true,
      firstLoopPassed,
      playtestEvidenceRecorded: Boolean(playtestReport),
      rawPromptLeakCount,
      forbiddenAuthorityCount,
      replayabilitySignature: signatures[index],
      screenshotHash: screenshotHashForReport(playtestReport)
    };
  });
  const comparisons = pairwiseDiversityComparisons(safePacks, reportsByPackId, requirePlaytestReports);
  const uniquePackIds = new Set(safePacks.map((pack) => pack.packId).filter(Boolean));
  const uniqueThemes = new Set(safePacks.map((pack) => pack.generationBrief?.theme?.primary).filter(Boolean));
  const uniquePalettes = new Set(safePacks.map((pack) => JSON.stringify(pack.stylePack?.palette || {})));
  const uniqueSignatures = new Set(signatures);
  const screenshotHashes = playtestReports.map(screenshotHashForReport).filter((hash) => /^[0-9a-f]{64}$/.test(hash));
  const uniqueScreenshotHashes = new Set(screenshotHashes);
  const promptCount = safePacks.length;
  const validPackCount = packResults.filter((result) => result.validationOk).length;
  const firstLoopPassCount = packResults.filter((result) => result.firstLoopPassed).length;
  const forbiddenAuthorityCount = packResults.reduce((sum, result) => sum + result.forbiddenAuthorityCount, 0);
  const rawPromptLeakCount = packResults.reduce((sum, result) => sum + result.rawPromptLeakCount, 0);
  const comparisonScores = comparisons.map((comparison) => comparison.meaningfulDifferenceScore);
  const paletteDistances = comparisons.map((comparison) => comparison.paletteDistance);
  const labelNameDistances = comparisons.map((comparison) => comparison.labelNameDistance);
  const motifDistances = comparisons.map((comparison) => comparison.motifDistance);
  const meaningfulDifferenceScore = comparisonScores.length ? Math.min(...comparisonScores) : 0;
  const requiredFirstLoopPassCount = requirePlaytestReports ? promptCount : validPackCount;
  const screenshotComparisonPass = !requirePlaytestReports || uniqueScreenshotHashes.size === promptCount;
  const enoughPrompts = promptCount >= expectedPromptCount;
  return {
    ok: promptCount > 0
      && enoughPrompts
      && validPackCount === promptCount
      && firstLoopPassCount === requiredFirstLoopPassCount
      && uniquePackIds.size === promptCount
      && uniqueThemes.size >= Math.min(promptCount, 3)
      && uniqueSignatures.size === promptCount
      && forbiddenAuthorityCount === 0
      && rawPromptLeakCount === 0
      && screenshotComparisonPass
      && (promptCount < expectedPromptCount || meaningfulDifferenceScore >= meaningfulDifferenceScoreMin),
    metrics: {
      promptCount,
      expectedPromptCount,
      validPackCount,
      firstLoopPassCount,
      uniquePackIds: uniquePackIds.size,
      uniqueThemes: uniqueThemes.size,
      uniquePalettes: uniquePalettes.size,
      uniqueReplayabilitySignatures: uniqueSignatures.size,
      screenshotHashCount: screenshotHashes.length,
      uniqueScreenshotHashes: uniqueScreenshotHashes.size,
      pairwiseComparisonCount: comparisons.length,
      minimumPaletteDistance: paletteDistances.length ? Math.min(...paletteDistances) : 0,
      minimumLabelNameDistance: labelNameDistances.length ? Math.min(...labelNameDistances) : 0,
      minimumMotifDistance: motifDistances.length ? Math.min(...motifDistances) : 0,
      meaningfulDifferenceScoreMin: meaningfulDifferenceScore,
      requiredMeaningfulDifferenceScoreMin: meaningfulDifferenceScoreMin,
      forbiddenAuthorityCount,
      rawPromptLeakCount,
      minimumDistinctThemeRatio: promptCount ? uniqueThemes.size / promptCount : 0,
      minimumDistinctSignatureRatio: promptCount ? uniqueSignatures.size / promptCount : 0,
      firstLoopEvidenceMode: requirePlaytestReports ? 'playtest-report' : 'pack-first-loop-ready'
    },
    packResults,
    comparisons,
    signatures
  };
}

function clearGeneratedPacksForTests({ clearDisk = false } = {}) {
  packStore.clear();
  playtestStore.clear();
  publicCardStore.clear();
  if (clearDisk) {
    fs.rmSync(durableRoot(), { recursive: true, force: true });
  }
}

module.exports = {
  APPROVED_MODIFIERS,
  ASSET_PROMPT_PLAN_VERSION,
  CANONICAL_CONTRACTS,
  CANONICAL_TECH_CAPABILITIES,
  CANDIDATE_REVIEW_MANIFEST_VERSION,
  DEFAULT_CANDIDATE_ROOT,
  GENERATION_BRIEF_VERSION,
  INHABITANT_ROLE_DEFINITIONS,
  MULTI_SURFACE_DEFINITIONS,
  REQUIRED_CANONICAL_IDS,
  RELEASE_APPROVAL_EVIDENCE_VERSION,
  REPLAYABILITY_PROMPT_SUITE,
  SCHEMA_VERSION,
  analyzePackDiversity,
  buildAssetPromptPlan,
  buildCandidateReviewManifest,
  buildMeasuredPlaytestReport,
  buildReleaseApprovalEvidence,
  buildReleaseEvidenceBundle,
  buildProductionReleaseGate,
  clearGeneratedPacksForTests,
  createGenerationBrief,
  createGeneratedPack,
  currentGeneratedPack,
  currentPlaytestReport,
  exportGeneratedPack,
  generateAndStorePack,
  getPublicPackCard,
  importGeneratedPack,
  listPublicPackGallery,
  normalizePrompt,
  projectApprovedModifierView,
  projectInhabitantStyleOverlayView,
  projectMultiSurfaceCompatibilityView,
  projectRequesterVoiceView,
  projectTechFlavorView,
  publishPublicPackCard,
  recordPlaytestReport,
  reloadGeneratedPack,
  reviewPublicPackCard,
  remixGeneratedPack,
  scaffoldAssetGenerationJobs,
  unpublishPublicPackCard,
  validateGeneratedPackSchemas,
  validateAssetManifest,
  validateAssetPromptPlan,
  validateCandidateReviewManifest,
  validateApprovedModifiers,
  validateGenerationBrief,
  validateInhabitantStyleOverlay,
  validateMultiSurfaceCompatibility,
  validateRequesterVoicePack,
  validateTechFlavorTree,
  validatePublicPackGallery,
  validatePublicPackCard,
  validatePlaytestReport,
  validateReleaseApprovalEvidence,
  validateReleaseEvidenceBundle,
  validateProductionReleaseGate,
  validateGeneratedPack
};
