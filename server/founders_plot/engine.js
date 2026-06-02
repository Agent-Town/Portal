const crypto = require('crypto');

const store = require('./store');
const { buildRecapFromEvents } = require('./recap');
const { computeStateHash, stableJsonStringify, buildReplayAudit } = require('./replay');

const RESOURCE_KEYS = ['wood', 'stone', 'food', 'coin'];
const CIVIC_PROPOSAL_STATUSES = Object.freeze(['DRAFT', 'REVIEWED', 'ARCHIVED']);
const CIVIC_PROPOSAL_CATEGORIES = Object.freeze(['coordination', 'public_work', 'route_study', 'civic_memory']);
const CIVIC_PROPOSAL_AUTHORITY_BOUNDARY = 'server_owned_civic_proposal_record_no_execution_v1';
const OVERLAY_PACK_STATUSES = Object.freeze(['DRAFT', 'REVIEWED', 'ARCHIVED']);
const OVERLAY_PACK_AUTHORITY_BOUNDARY = 'server_owned_generated_universe_overlay_pack_presentation_only_v1';
const CIVIC_PROJECT_STATUSES = Object.freeze(['ACTIVE', 'ARCHIVED']);
const CIVIC_PROJECT_TYPES = Object.freeze(['civic_beacon']);
const CIVIC_PROJECT_AUTHORITY_BOUNDARY = 'server_owned_civic_project_activation_local_public_work_v1';
const CIVIC_PROJECT_INSPECTION_AUTHORITY_BOUNDARY = 'server_owned_civic_project_inspection_current_plot_v1';
const CIVIC_PROJECT_INSPECTION_TYPES = Object.freeze(['baseline_readiness']);
const CIVIC_BEACON_EFFECT_ID = 'local_civic_beacon_v1';
const EXPEDITION_MAP_AUTHORITY_BOUNDARY = 'server_owned_read_only_expedition_map_fog_of_war_projection_v1';
const EXPEDITION_SCOUT_SECTOR_AUTHORITY_BOUNDARY = 'server_owned_scout_sector_current_plot_fog_receipt_v1';
const EXPEDITION_EVENT_PACKET_AUTHORITY_BOUNDARY = 'server_owned_expedition_event_packet_read_model_v1';
const EXPEDITION_PARTY_MANIFEST_AUTHORITY_BOUNDARY = 'server_owned_read_only_expedition_party_manifest_v1';
const EXPEDITION_UNIT_ROSTER_AUTHORITY_BOUNDARY = 'server_owned_read_only_expedition_unit_roster_v1';
const EXPEDITION_UNIT_ROSTER_VERSION = 'hq15a_server_owned_expedition_unit_roster_v1';
const EXPEDITION_UNIT_MOVE_AUTHORITY_BOUNDARY = 'server_owned_scout_unit_revealed_cell_move_receipt_v1';
const EXPEDITION_UNIT_MOVE_VERSION = 'hq15g_server_owned_scout_unit_move_v1';
const EXPEDITION_SURVEY_BRIDGE_AUTHORITY_BOUNDARY = 'server_owned_scout_packet_to_site_plan_readiness_v1';
const EXPEDITION_SURVEY_BRIDGE_VERSION = 'hq16h_scout_packet_to_site_plan_readiness_v1';
const EXPEDITION_PACKET_SITE_PLAN_AUTHORITY_BOUNDARY = 'server_owned_scout_packet_site_plan_draft_v1';
const EXPEDITION_PACKET_SITE_PLAN_VERSION = 'hq16i_scout_packet_site_plan_draft_v1';
const EXPEDITION_MAP_FOG_STATES = Object.freeze(['discovered', 'known', 'hinted', 'locked_unknown']);
const EXPEDITION_PUBLIC_TERRAIN_ASSET_CONTRACT_VERSION = 'agenttown_public_terrain_asset_slots_v1';
const EXPEDITION_PUBLIC_TERRAIN_ASSET_SLOT_SOURCE = 'server_read_model_v1';
const EXPEDITION_PUBLIC_TERRAIN_ASSET_SLOTS = Object.freeze(['field', 'forest', 'ridge', 'settled']);
const EXPEDITION_FOG_ASSET_SLOTS = Object.freeze({
  hinted: 'hinted_frontier_fog',
  locked_unknown: 'locked_unknown_fog'
});
const OFFLINE_CLAMP_MS = 8 * 60 * 60 * 1000;
const DAILY_RETURN_XP = 5;
const PADS = Object.freeze([
  { x: 1, y: 0, kind: 'HQ', locked: false },
  { x: 0, y: 1, kind: 'BUILD', locked: false },
  { x: 1, y: 1, kind: 'BUILD', locked: false },
  { x: 2, y: 1, kind: 'BUILD', locked: false },
  { x: 0, y: 2, kind: 'BUILD', locked: false },
  { x: 1, y: 2, kind: 'BUILD', locked: false },
  { x: 2, y: 2, kind: 'BUILD', locked: false }
]);

const BUILDING_LABELS = Object.freeze({
  HQ: 'Headquarters',
  LUMBER_CAMP: 'Lumber Camp',
  FARM_PLOT: 'Farm Plot',
  QUARRY: 'Quarry',
  EXPEDITION_BOARD: 'Expedition Board',
  WORKSHOP: 'Workshop',
  MARKET_STALL: 'Market Stall'
});

const HQ_LEVEL_RULES = Object.freeze({
  1: {
    storageCaps: { wood: 100, stone: 100, food: 100 },
    constructionSlots: 1,
    unlocks: ['LUMBER_CAMP', 'FARM_PLOT'],
    permissionUnlocks: ['observeAndSuggest']
  },
  2: {
    storageCaps: { wood: 100, stone: 100, food: 100 },
    constructionSlots: 1,
    unlocks: ['QUARRY'],
    permissionUnlocks: ['collectOutputs']
  },
  3: {
    storageCaps: { wood: 100, stone: 100, food: 100 },
    constructionSlots: 2,
    unlocks: ['EXPEDITION_BOARD'],
    permissionUnlocks: ['queueProduction']
  },
  4: {
    storageCaps: { wood: 160, stone: 160, food: 160 },
    constructionSlots: 2,
    unlocks: ['WORKSHOP'],
    permissionUnlocks: ['setPriority']
  },
  5: {
    storageCaps: { wood: 160, stone: 160, food: 160 },
    constructionSlots: 2,
    unlocks: ['MARKET_STALL'],
    permissionUnlocks: ['sellSurplusFood']
  },
  6: {
    storageCaps: { wood: 220, stone: 220, food: 220 },
    constructionSlots: 3,
    unlocks: [],
    permissionUnlocks: []
  }
});

const HQ_UPGRADE_RULES = Object.freeze({
  1: {
    nextLevel: 2,
    cost: { wood: 20, food: 10 },
    xpRequired: 25,
    durationMs: 60_000,
    buildingPrerequisites: Object.freeze([
      Object.freeze({ type: 'LUMBER_CAMP', requiredState: 'READY' }),
      Object.freeze({ type: 'FARM_PLOT', requiredState: 'READY' })
    ])
  },
  2: {
    nextLevel: 3,
    cost: { wood: 20, stone: 16 },
    xpRequired: 50,
    durationMs: 90_000,
    buildingPrerequisites: Object.freeze([
      Object.freeze({ type: 'QUARRY', requiredState: 'READY' })
    ])
  },
  3: {
    nextLevel: 4,
    cost: { wood: 40, stone: 30, food: 20 },
    xpRequired: 90,
    durationMs: 120_000,
    buildingPrerequisites: Object.freeze([
      Object.freeze({ type: 'EXPEDITION_BOARD', requiredState: 'READY' })
    ])
  },
  4: {
    nextLevel: 5,
    cost: { wood: 60, stone: 50, food: 30 },
    xpRequired: 140,
    durationMs: 150_000,
    buildingPrerequisites: Object.freeze([
      Object.freeze({ type: 'WORKSHOP', requiredState: 'READY' })
    ])
  },
  5: {
    nextLevel: 6,
    cost: { wood: 90, stone: 80, food: 50 },
    xpRequired: 220,
    durationMs: 180_000,
    buildingPrerequisites: Object.freeze([
      Object.freeze({ type: 'MARKET_STALL', requiredState: 'READY' })
    ])
  }
});

const BUILDING_DEFS = Object.freeze({
  HQ: {
    unlockHqLevel: 1,
    construction: null,
    upgrade: null,
    produces: null
  },
  LUMBER_CAMP: {
    unlockHqLevel: 1,
    construction: { cost: { coin: 8 }, durationMs: 60_000 },
    upgrade: {
      1: { toLevel: 2, cost: { wood: 20, stone: 6, coin: 8 }, durationMs: 90_000 }
    },
    produces(level = 1) {
      return {
        kind: 'PRODUCE',
        input: {},
        output: { wood: level >= 2 ? 14 : 10 },
        durationMs: 60_000
      };
    }
  },
  FARM_PLOT: {
    unlockHqLevel: 1,
    construction: { cost: { wood: 12, coin: 4 }, durationMs: 60_000 },
    upgrade: {
      1: { toLevel: 2, cost: { wood: 14, food: 8, coin: 8 }, durationMs: 90_000 }
    },
    produces(level = 1) {
      return {
        kind: 'PRODUCE',
        input: {},
        output: { food: level >= 2 ? 12 : 8 },
        durationMs: 90_000
      };
    }
  },
  QUARRY: {
    unlockHqLevel: 2,
    construction: { cost: { wood: 16, food: 10, coin: 6 }, durationMs: 90_000 },
    upgrade: {
      1: { toLevel: 2, cost: { wood: 18, stone: 12, coin: 10 }, durationMs: 120_000 }
    },
    produces(level = 1) {
      return {
        kind: 'PRODUCE',
        input: {},
        output: { stone: level >= 2 ? 12 : 8 },
        durationMs: 90_000
      };
    }
  },
  EXPEDITION_BOARD: {
    unlockHqLevel: 3,
    construction: { cost: { wood: 24, stone: 12, food: 8 }, durationMs: 120_000 },
    upgrade: null,
    produces() {
      return {
        kind: 'SCOUT',
        input: { food: 6, wood: 4 },
        output: { scout_report: 1 },
        durationMs: 90_000,
        reportKind: 'nearby_site'
      };
    }
  },
  WORKSHOP: {
    unlockHqLevel: 4,
    construction: { cost: { wood: 24, stone: 16, coin: 12 }, durationMs: 120_000 },
    upgrade: {
      1: { toLevel: 2, cost: { wood: 20, stone: 14, coin: 10 }, durationMs: 120_000 }
    },
    produces(level = 1) {
      return {
        kind: 'PRODUCE',
        input: { wood: 8, stone: 4 },
        output: {},
        durationMs: 60_000,
        buffPct: level >= 2 ? 30 : 20
      };
    }
  },
  MARKET_STALL: {
    unlockHqLevel: 5,
    construction: { cost: { wood: 20, stone: 18, coin: 14 }, durationMs: 120_000 },
    upgrade: {
      1: { toLevel: 2, cost: { wood: 20, food: 18, coin: 10 }, durationMs: 120_000 }
    },
    produces(level = 1) {
      return {
        kind: 'SELL',
        input: { food: 6 },
        output: { coin: level >= 2 ? 4 : 3 },
        durationMs: 60_000
      };
    }
  }
});

const SCOUT_REPORT_TEMPLATES = Object.freeze([
  {
    templateId: 'forest-ridge',
    title: 'Forest Ridge Survey',
    siteType: 'woodland_ridge',
    risk: 'low',
    traits: ['wood-rich', 'stone outcrop', 'settler-safe'],
    resourceHints: { wood: 2, stone: 1 },
    summary: 'A nearby ridge has timber, surface stone, and enough flat ground for a future outpost.',
    recommendedNext: 'Save this report as the first candidate for a later settler convoy.'
  },
  {
    templateId: 'river-flat',
    title: 'River Flat Survey',
    siteType: 'river_flat',
    risk: 'medium',
    traits: ['food-rich', 'water access', 'flood watch'],
    resourceHints: { food: 2, wood: 1 },
    summary: 'The scout marked a fertile bend that could support farms, but seasonal water needs planning.',
    recommendedNext: 'Compare this with other reports before committing a second settlement.'
  },
  {
    templateId: 'old-trail',
    title: 'Old Trail Signal',
    siteType: 'ruin_signal',
    risk: 'medium',
    traits: ['old road', 'signal marker', 'approval-needed'],
    resourceHints: { stone: 1, coin: 1 },
    summary: 'Rook found an old route marker. It is useful intelligence, not a claimable plot yet.',
    recommendedNext: 'Promote a proper expedition/claim rule before letting this become territory.'
  }
]);

const SITE_PLAN_FOCUS_OPTIONS = Object.freeze(['balanced', 'resource', 'safe', 'trade']);

const SETTLER_CONVOY_DEF = Object.freeze({
  unlockHqLevel: 7,
  bridgeRequiredHqLevel: 6,
  requiresSitePlanPromotionStatus: 'reviewed_claim_ready',
  cost: { wood: 32, food: 20, stone: 12, coin: 8 },
  durationMs: 180_000,
  output: { settlement_claim: 1 }
});

const SURVEY_DISCIPLINE_SCOUT_DURATION_MULTIPLIER = 0.95;
const SURVEY_DISCIPLINE_SCOUT_DURATION_REDUCTION_PCT = 5;

const DOCTRINE_CATALOG = Object.freeze({
  survey_discipline: Object.freeze({
    doctrineId: 'survey_discipline',
    title: 'Survey Discipline',
    unlockHqLevel: 6,
    requiresFoundedOutpost: true,
    cost: {},
    effectKind: 'scout_duration_modifier',
    effectValue: Object.freeze({
      buildingType: 'EXPEDITION_BOARD',
      jobKind: 'SCOUT',
      durationMultiplier: SURVEY_DISCIPLINE_SCOUT_DURATION_MULTIPLIER,
      reductionPct: SURVEY_DISCIPLINE_SCOUT_DURATION_REDUCTION_PCT
    }),
    gameplayBuff: true,
    engineOwnedEffect: true,
    reversibility: 'safe_replaceable_server_owned',
    riskLevel: 'low',
    privacyDefault: 'private',
    summary: 'Research Lodge doctrine that trims Expedition Board SCOUT job duration by 5% while preserving costs, outputs, and settlement rules.',
    authorityBoundary: 'server_owned_scout_duration_modifier_v1'
  })
});

const WORK_ORDER_TEMPLATES = Object.freeze({
  collect_ready_outputs_once: Object.freeze({
    templateId: 'collect_ready_outputs_once',
    title: 'Collect Ready Outputs Once',
    unlockHqLevel: 6,
    requiresFoundedOutpost: true,
    requiresSelectedDoctrine: 'survey_discipline',
    status: 'EXECUTOR_AVAILABLE',
    allowedActions: Object.freeze(['et.plot.collect_outputs']),
    caps: Object.freeze({
      maxChildActions: 2,
      maxResourceSpend: zeroInventory(),
      maxRuntimeMs: 120_000,
      allowedPlotScope: 'current_plot_only'
    }),
    summary: 'Drafts and explicitly executes a bounded cohort work order for collecting up to two ready outputs once.',
    authorityBoundary: 'server_owned_work_order_executor_collect_ready_outputs_once_v1'
  })
});

const EXPEDITION_MAP_RING_COORDINATES = Object.freeze([
  Object.freeze({ q: 1, r: 0 }),
  Object.freeze({ q: 1, r: -1 }),
  Object.freeze({ q: 0, r: -1 }),
  Object.freeze({ q: -1, r: 0 }),
  Object.freeze({ q: -1, r: 1 }),
  Object.freeze({ q: 0, r: 1 }),
  Object.freeze({ q: 2, r: -1 }),
  Object.freeze({ q: 1, r: 1 }),
  Object.freeze({ q: -1, r: 2 }),
  Object.freeze({ q: -2, r: 1 }),
  Object.freeze({ q: -1, r: -1 }),
  Object.freeze({ q: 1, r: -2 })
]);

const EXPEDITION_EVENT_PACKET_TEMPLATES = Object.freeze([
  Object.freeze({
    templateId: 'ridge-lantern',
    discoveryFlavor: 'Ridge Lantern packet',
    terrainExplanation: 'The sector has enough ridgeline and landmark context to become a map note, but no path or claim exists yet.',
    riskExplanation: 'Planning risk only: visibility improved, with no damage, combat, resource payout, or route opened.',
    operatorNote: 'Mira filed this as a receipt-bound frontier note for later human review.'
  }),
  Object.freeze({
    templateId: 'quiet-hollow',
    discoveryFlavor: 'Quiet Hollow packet',
    terrainExplanation: 'The scout marked a sheltered hollow on the edge of known ground; terrain remains descriptive until a later explicit rule uses it.',
    riskExplanation: 'Unresolved terrain risk remains advisory and cannot change inventory, actors, routes, or other plots.',
    operatorNote: 'The Expedition Board stamped this as read-only context, not an executable order.'
  }),
  Object.freeze({
    templateId: 'marker-stone',
    discoveryFlavor: 'Marker Stone packet',
    terrainExplanation: 'A stable landmark makes this sector easier to discuss on the map while deeper details stay behind fog.',
    riskExplanation: 'Unknown-world risk is preserved as flavor metadata with no autonomous travel, scheduling, or public sharing.',
    operatorNote: 'Rook linked the note back to the Scout Sector receipt so future planning can audit its source.'
  })
]);

const EXPEDITION_PARTY_MEMBERS = Object.freeze([
  Object.freeze({
    memberId: 'pathfinder-scout-v1',
    displayName: 'Mira Trailmark',
    role: 'scout',
    assetSrc: '/experiences/founders-plot/assets/characters/inhabitants/scout/pathfinder-scout-v1.png',
    metadataSrc: '/experiences/founders-plot/assets/characters/inhabitants/scout/pathfinder-scout-v1.json',
    flavorDuty: 'Reads the newly known edge.',
    authority: 'visual_read_model_only'
  }),
  Object.freeze({
    memberId: 'rook-signalpost-messenger-v1',
    displayName: 'Rook Signalpost',
    role: 'messenger',
    assetSrc: '/experiences/founders-plot/assets/characters/inhabitants/messenger/rook-signalpost-messenger-v1.png',
    metadataSrc: '/experiences/founders-plot/assets/characters/inhabitants/messenger/rook-signalpost-messenger-v1.json',
    flavorDuty: 'Carries the packet receipt back to the board.',
    authority: 'visual_read_model_only'
  }),
  Object.freeze({
    memberId: 'hq-civic-operator-vale-desk-7-v1',
    displayName: 'Vale-Desk 7',
    role: 'hq_civic_operator',
    assetSrc: '/experiences/founders-plot/assets/characters/inhabitants/hq_civic_operator/hq-civic-operator-vale-desk-7-v1.png',
    metadataSrc: '/experiences/founders-plot/assets/characters/inhabitants/hq_civic_operator/hq-civic-operator-vale-desk-7-v1.json',
    flavorDuty: 'Files the receipt at HQ without changing town state.',
    authority: 'visual_read_model_only'
  })
]);

const REWARD_DEFS = Object.freeze([
  {
    rewardId: 'quest.first-lumber',
    title: 'Supply crate',
    body: 'The first lumber haul kept the camp alive.',
    grant: { coin: 5 },
    isAvailable: (bundle) => bundle.plot.collectedBuildingTypes.includes('LUMBER_CAMP')
  },
  {
    rewardId: 'hq.level-2',
    title: 'Field notes',
    body: 'HQ Level 2 opens the food lane.',
    grant: { coin: 6 },
    isAvailable: (bundle) => bundle.plot.hqLevel >= 2
  },
  {
    rewardId: 'hq.level-3',
    title: 'Quarry kit',
    body: 'A small reserve to help the new quarry boot.',
    grant: { wood: 8, stone: 4 },
    isAvailable: (bundle) => bundle.plot.hqLevel >= 3
  },
  {
    rewardId: 'hq.level-4',
    title: 'Workshop charter',
    body: 'Your builders can now compress future timelines.',
    grant: { coin: 8 },
    isAvailable: (bundle) => bundle.plot.hqLevel >= 4
  },
  {
    rewardId: 'hq.level-5',
    title: 'Founder stipend',
    body: 'Your overnight planner is now part of the town rhythm.',
    grant: { coin: 12, town_xp: 10 },
    isAvailable: (bundle) => bundle.plot.hqLevel >= 5
  }
]);

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function publicBuildingDefs() {
  return Object.fromEntries(Object.entries(BUILDING_DEFS).map(([type, def]) => [type, {
    unlockHqLevel: def.unlockHqLevel,
    construction: clone(def.construction),
    upgrade: clone(def.upgrade),
    canProduce: typeof def.produces === 'function'
  }]));
}

function nowDayKey(ms) {
  return new Date(Number(ms || 0)).toISOString().slice(0, 10);
}

function randomId(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

function hashPayload(value) {
  return crypto.createHash('sha256').update(stableJsonStringify(value)).digest('hex');
}

function zeroInventory() {
  return { wood: 0, stone: 0, food: 0, coin: 0 };
}

function normalizeInventory(value) {
  const next = zeroInventory();
  const source = value && typeof value === 'object' ? value : {};
  for (const key of RESOURCE_KEYS) {
    next[key] = Math.max(0, Math.floor(Number(source[key] || 0)));
  }
  return next;
}

function normalizeScoutReports(value) {
  const rows = Array.isArray(value) ? value : [];
  return rows
    .filter((row) => row && typeof row === 'object')
    .slice(-30)
    .map((row, index) => {
      const sequence = Math.max(1, Math.floor(Number(row.sequence || index + 1)));
      const traits = Array.isArray(row.traits)
        ? row.traits.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 8)
        : [];
      const hints = {};
      const rawHints = row.resourceHints && typeof row.resourceHints === 'object' ? row.resourceHints : {};
      for (const key of RESOURCE_KEYS) {
        const amount = Math.max(0, Math.floor(Number(rawHints[key] || 0)));
        if (amount > 0) hints[key] = amount;
      }
      return {
        reportId: String(row.reportId || `scout_report_${sequence}`),
        originPlotId: String(row.originPlotId || row.plotId || ''),
        sourceBuildingId: String(row.sourceBuildingId || ''),
        title: String(row.title || `Scout Report ${sequence}`),
        siteType: String(row.siteType || 'nearby_site'),
        risk: String(row.risk || 'unknown'),
        traits,
        resourceHints: hints,
        summary: String(row.summary || ''),
        recommendedNext: String(row.recommendedNext || ''),
        sequence,
        createdAt: Number(row.createdAt || 0)
      };
    });
}

function safeText(value, fallback = '', max = 160) {
  const text = String(value == null ? '' : value)
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return (text || fallback).slice(0, max);
}

function slugFor(value, fallback = 'item') {
  const slug = safeText(value, fallback, 80)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return slug || fallback;
}

function sitePlanFocus(value) {
  const clean = String(value || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  return SITE_PLAN_FOCUS_OPTIONS.includes(clean) ? clean : 'balanced';
}

function normalizeSitePlans(value) {
  const rows = Array.isArray(value) ? value : [];
  return rows
    .filter((row) => row && typeof row === 'object')
    .slice(-30)
    .map((row, index) => {
      const sequence = Math.max(1, Math.floor(Number(row.sequence || index + 1)));
      const resourceHints = {};
      const rawHints = row.resourceHints && typeof row.resourceHints === 'object' ? row.resourceHints : {};
      for (const key of RESOURCE_KEYS) {
        const amount = Math.max(0, Math.floor(Number(rawHints[key] || 0)));
        if (amount > 0) resourceHints[key] = amount;
      }
      const traits = Array.isArray(row.traits)
        ? row.traits.map((item) => safeText(item, '', 48)).filter(Boolean).slice(0, 8)
        : [];
      const normalized = {
        planId: safeText(row.planId, `site_plan_${sequence}`, 120),
        reportId: safeText(row.reportId, '', 120),
        originPlotId: safeText(row.originPlotId || row.plotId, '', 120),
        title: safeText(row.title, `Site Plan ${sequence}`, 120),
        focus: sitePlanFocus(row.focus),
        status: safeText(row.status, 'DRAFT', 40).toUpperCase(),
        promotionStatus: safeText(row.promotionStatus, 'draft', 40).toLowerCase(),
        reviewStatus: safeText(row.reviewStatus, 'unreviewed', 40).toLowerCase(),
        source: safeText(row.source, 'scout_report', 80),
        authorityBoundary: safeText(row.authorityBoundary, 'requires_engine_promotion_for_settlement', 120),
        siteType: safeText(row.siteType, 'nearby_site', 80),
        risk: safeText(row.risk, 'unknown', 40),
        traits,
        resourceHints,
        summary: safeText(row.summary, '', 320),
        recommendedNext: safeText(row.recommendedNext, '', 240),
        reviewedAt: row.reviewedAt == null ? null : Number(row.reviewedAt),
        reviewNote: safeText(row.reviewNote, '', 320),
        sequence,
        createdAt: Number(row.createdAt || 0)
      };
      const claimId = safeText(row.claimId, '', 120);
      const convoyJobId = safeText(row.convoyJobId, '', 120);
      const foundedPlotId = safeText(row.foundedPlotId, '', 120);
      const sourcePacketId = safeText(row.sourcePacketId, '', 160);
      const sourceScoutId = safeText(row.sourceScoutId, '', 120);
      const sourceCellId = safeText(row.sourceCellId, '', 80);
      const sourceReceiptKind = safeText(row.sourceReceiptKind, '', 80);
      const sourceActionName = safeText(row.sourceActionName, '', 120);
      const sourceBridgeVersion = safeText(row.sourceBridgeVersion, '', 120);
      if (claimId) normalized.claimId = claimId;
      if (convoyJobId) normalized.convoyJobId = convoyJobId;
      if (foundedPlotId) normalized.foundedPlotId = foundedPlotId;
      if (sourcePacketId) normalized.sourcePacketId = sourcePacketId;
      if (sourceScoutId) normalized.sourceScoutId = sourceScoutId;
      if (sourceCellId) normalized.sourceCellId = sourceCellId;
      if (sourceReceiptKind) normalized.sourceReceiptKind = sourceReceiptKind;
      if (sourceActionName) normalized.sourceActionName = sourceActionName;
      if (sourceBridgeVersion) normalized.sourceBridgeVersion = sourceBridgeVersion;
      if (row.claimedAt != null) normalized.claimedAt = Number(row.claimedAt);
      return normalized;
    })
    .filter((plan) => plan.planId && plan.reportId);
}

function normalizeExpeditionScouts(value) {
  const rows = Array.isArray(value) ? value : [];
  return rows
    .filter((row) => row && typeof row === 'object')
    .slice(-60)
    .map((row, index) => {
      const q = Number(row.q || row.coord?.q || 0);
      const r = Number(row.r || row.coord?.r || 0);
      const cellId = safeText(row.cellId, expeditionCellId({ q, r }), 80);
      const receipt = row.receipt && typeof row.receipt === 'object' ? clone(row.receipt) : {};
      const scout = {
        scoutId: safeText(row.scoutId, `expedition_scout_${index + 1}`, 120),
        plotId: safeText(row.plotId, '', 120),
        cellId,
        q,
        r,
        sourceCellId: safeText(row.sourceCellId || row.adjacentCellId, '', 80) || null,
        sourceFogState: safeText(row.sourceFogState, 'hinted', 40),
        title: safeText(row.title, 'Scouted Frontier Sector', 120),
        status: safeText(row.status, 'SCOUTED', 40).toUpperCase(),
        sourceTruth: 'expedition_scout_sector',
        traits: Array.isArray(row.traits) ? row.traits.map((item) => safeText(item, '', 48)).filter(Boolean).slice(0, 8) : [],
        resourceHints: normalizeInventory(row.resourceHints || {}),
        siteType: safeText(row.siteType, 'scouted_frontier', 80),
        risk: safeText(row.risk, 'unknown', 40),
        summary: safeText(row.summary, 'A frontier sector was scouted from an adjacent map hint.', 320),
        recommendedNext: safeText(row.recommendedNext, 'Keep the sector as known map truth until a later explicit planning action exists.', 240),
        authorityBoundary: safeText(row.authorityBoundary, EXPEDITION_SCOUT_SECTOR_AUTHORITY_BOUNDARY, 160),
        receipt: {
          ...receipt,
          kind: safeText(receipt.kind, 'scout_sector_receipt', 80),
          actionName: safeText(receipt.actionName, 'et.plot.scout_sector', 80),
          authorityBoundary: safeText(receipt.authorityBoundary, EXPEDITION_SCOUT_SECTOR_AUTHORITY_BOUNDARY, 160)
        },
        createdBy: mutationActor(row.createdBy),
        approvedBy: row.approvedBy ? safeText(row.approvedBy, '', 80) : null,
        createdAt: Number(row.createdAt || 0),
        updatedAt: Number(row.updatedAt || row.createdAt || 0)
      };
      const eventPacket = buildExpeditionEventPacket({ scoutSector: scout });
      scout.receipt.eventPacketId = eventPacket.packetId;
      scout.eventPacket = eventPacket;
      return scout;
    })
    .filter((entry) => entry.scoutId && entry.cellId);
}

function normalizeExpeditionUnitMoves(value) {
  const rows = Array.isArray(value) ? value : [];
  return rows
    .filter((row) => row && typeof row === 'object')
    .slice(-80)
    .map((row, index) => {
      const sourceQ = Number(row.sourceQ ?? row.source?.q ?? 0);
      const sourceR = Number(row.sourceR ?? row.source?.r ?? 0);
      const targetQ = Number(row.targetQ ?? row.target?.q ?? 0);
      const targetR = Number(row.targetR ?? row.target?.r ?? 0);
      const receipt = row.receipt && typeof row.receipt === 'object' ? clone(row.receipt) : {};
      return {
        moveId: safeText(row.moveId, `expedition_unit_move_${index + 1}`, 120),
        plotId: safeText(row.plotId, '', 120),
        unitId: safeText(row.unitId, '', 160),
        unitType: safeText(row.unitType, 'scout', 80),
        sourceCellId: safeText(row.sourceCellId || row.fromCellId, expeditionCellId({ q: sourceQ, r: sourceR }), 80),
        targetCellId: safeText(row.targetCellId || row.cellId, expeditionCellId({ q: targetQ, r: targetR }), 80),
        sourceQ,
        sourceR,
        targetQ,
        targetR,
        status: safeText(row.status, 'MOVED', 40).toUpperCase(),
        authorityBoundary: safeText(row.authorityBoundary, EXPEDITION_UNIT_MOVE_AUTHORITY_BOUNDARY, 160),
        receipt: {
          ...receipt,
          kind: safeText(receipt.kind, 'expedition_unit_move_receipt', 80),
          actionName: safeText(receipt.actionName, 'et.plot.move_expedition_unit', 120),
          authorityBoundary: safeText(receipt.authorityBoundary, EXPEDITION_UNIT_MOVE_AUTHORITY_BOUNDARY, 160)
        },
        createdBy: mutationActor(row.createdBy),
        approvedBy: row.approvedBy ? safeText(row.approvedBy, '', 80) : null,
        createdAt: Number(row.createdAt || 0),
        updatedAt: Number(row.updatedAt || row.createdAt || 0)
      };
    })
    .filter((entry) => entry.moveId && entry.unitId && entry.targetCellId);
}

function normalizeDoctrineState(value) {
  const state = value && typeof value === 'object' ? value : {};
  const doctrineId = safeText(state.selectedDoctrineId || state.doctrineId, '', 80);
  if (!doctrineId) {
    return {
      selectedDoctrineId: null,
      status: 'NONE',
      selectedAt: null,
      selectedBy: null,
      revision: 0,
      authorityBoundary: 'no_doctrine_selected',
      receiptEventType: null
    };
  }
  return {
    selectedDoctrineId: doctrineId,
    status: safeText(state.status, 'SELECTED', 40).toUpperCase(),
    selectedAt: state.selectedAt == null ? null : Number(state.selectedAt),
    selectedBy: state.selectedBy ? mutationActor(state.selectedBy) : null,
    revision: Math.max(1, Math.floor(Number(state.revision || 1))),
    authorityBoundary: safeText(state.authorityBoundary, 'server_owned_doctrine_effect_v1', 120),
    receiptEventType: safeText(state.receiptEventType, 'DOCTRINE_SELECTED', 80)
  };
}

function foundedOutpostCount(bundle) {
  return normalizeSettlementClaims(bundle?.settlementClaims || [])
    .filter((claim) => claim.status === 'FOUNDED' && claim.foundedPlotId)
    .length;
}

function doctrineAvailability(bundle, doctrine) {
  const hqLevel = Number(bundle?.plot?.hqLevel || 1);
  const outpostCount = foundedOutpostCount(bundle);
  const blockedBy = [];
  if (hqLevel < Number(doctrine.unlockHqLevel || 1)) {
    blockedBy.push(`hq.level.${Number(doctrine.unlockHqLevel || 1)}`);
  }
  if (doctrine.requiresFoundedOutpost && outpostCount < 1) {
    blockedBy.push('settlement.outpost.founded');
  }
  return {
    unlocked: blockedBy.length === 0,
    hqLevel,
    hqLevelRequired: Number(doctrine.unlockHqLevel || 1),
    outpostCount,
    requiresFoundedOutpost: doctrine.requiresFoundedOutpost === true,
    blockedBy
  };
}

function publicDoctrineCatalog(bundle) {
  const selected = normalizeDoctrineState(bundle?.plot?.doctrineState);
  return Object.values(DOCTRINE_CATALOG).map((doctrine) => {
    const availability = doctrineAvailability(bundle, doctrine);
    return {
      ...clone(doctrine),
      selected: selected.selectedDoctrineId === doctrine.doctrineId && selected.status === 'SELECTED',
      availability
    };
  });
}

function selectedDoctrineForBundle(bundleOrState) {
  const state = normalizeDoctrineState(bundleOrState?.plot?.doctrineState || bundleOrState?.doctrineState);
  if (state.status !== 'SELECTED' || !state.selectedDoctrineId) return null;
  return DOCTRINE_CATALOG[state.selectedDoctrineId] || null;
}

function activeScoutDurationDoctrineEffect(bundleOrState) {
  const doctrine = selectedDoctrineForBundle(bundleOrState);
  if (!doctrine || doctrine.effectKind !== 'scout_duration_modifier') return null;
  const value = doctrine.effectValue && typeof doctrine.effectValue === 'object' ? doctrine.effectValue : {};
  if (value.buildingType !== 'EXPEDITION_BOARD' || value.jobKind !== 'SCOUT') return null;
  const multiplier = Number(value.durationMultiplier);
  if (!Number.isFinite(multiplier) || multiplier <= 0 || multiplier >= 1) return null;
  return {
    doctrineId: doctrine.doctrineId,
    effectKind: doctrine.effectKind,
    buildingType: value.buildingType,
    jobKind: value.jobKind,
    durationMultiplier: multiplier,
    reductionPct: Number(value.reductionPct || 0),
    authorityBoundary: doctrine.authorityBoundary
  };
}

function applyDoctrineEffectsToJobSpec(bundleOrState, buildingType, spec) {
  const next = clone(spec || {});
  const baseDurationMs = Math.max(1, Math.floor(Number(next.durationMs || 0)));
  next.baseDurationMs = baseDurationMs;
  const effect = activeScoutDurationDoctrineEffect(bundleOrState);
  if (effect && buildingType === effect.buildingType && next.kind === effect.jobKind) {
    next.durationMs = Math.max(1, Math.round(baseDurationMs * effect.durationMultiplier));
    next.doctrineEffect = effect;
  } else {
    next.durationMs = baseDurationMs;
    next.doctrineEffect = null;
  }
  return next;
}

function researchReadModel(bundle) {
  const catalog = publicDoctrineCatalog(bundle);
  const unlocked = catalog.some((entry) => entry.availability.unlocked);
  const selectedDoctrine = catalog.find((entry) => entry.selected) || null;
  const scoutDurationEffect = activeScoutDurationDoctrineEffect(bundle);
  return {
    lodge: {
      status: unlocked ? 'OPERATIONAL_READY' : 'LOCKED',
      title: 'Research Lodge',
      buildingRequired: false,
      implementation: 'hq6_plus_founded_outpost_doctrine_read_model',
      advisoryOnly: false,
      engineOwnedEffect: true,
      authorityBoundary: 'server_owned_read_model_no_building_scout_duration_effect_v1',
      requirements: {
        hqLevelRequired: 6,
        foundedOutpostRequired: true,
        blockedBy: unlocked ? [] : Array.from(new Set(catalog.flatMap((entry) => entry.availability.blockedBy || [])))
      }
    },
    doctrineState: normalizeDoctrineState(bundle?.plot?.doctrineState),
    selectedDoctrine,
    activeEffects: scoutDurationEffect ? [scoutDurationEffect] : [],
    doctrineCatalog: catalog
  };
}

function normalizeWorkOrders(value) {
  const rows = Array.isArray(value) ? value : [];
  return rows
    .filter((row) => row && typeof row === 'object')
    .map((row) => ({
      workOrderId: safeText(row.workOrderId, '', 120),
      plotId: safeText(row.plotId, '', 120),
      templateId: safeText(row.templateId, '', 120),
      status: safeText(row.status, 'DRAFT', 40).toUpperCase(),
      title: safeText(row.title, 'Work Order Draft', 120),
      scope: row.scope && typeof row.scope === 'object' ? clone(row.scope) : {},
      allowedActions: Array.isArray(row.allowedActions)
        ? row.allowedActions.map((entry) => safeText(entry, '', 80)).filter(Boolean).slice(0, 8)
        : [],
      caps: row.caps && typeof row.caps === 'object' ? clone(row.caps) : {},
      policySnapshot: row.policySnapshot && typeof row.policySnapshot === 'object' ? clone(row.policySnapshot) : {},
      childReceipts: Array.isArray(row.childReceipts) ? clone(row.childReceipts).slice(0, 20) : [],
      createdBy: mutationActor(row.createdBy || 'HUMAN'),
      approvedBy: safeText(row.approvedBy, '', 80) || null,
      failureReason: safeText(row.failureReason, '', 160) || null,
      createdAt: Number(row.createdAt || 0),
      updatedAt: Number(row.updatedAt || 0),
      expiresAt: row.expiresAt == null ? null : Number(row.expiresAt)
    }))
    .filter((row) => row.workOrderId && row.plotId && row.templateId);
}

function normalizeCivicProposalStatus(value, fallback = 'DRAFT') {
  const status = safeText(value, fallback, 40).toUpperCase();
  return CIVIC_PROPOSAL_STATUSES.includes(status) ? status : fallback;
}

function normalizeCivicProposalCategory(value) {
  const category = slugFor(value, 'coordination');
  return CIVIC_PROPOSAL_CATEGORIES.includes(category) ? category : 'coordination';
}

function normalizeCivicProposals(value) {
  const rows = Array.isArray(value) ? value : [];
  return rows
    .filter((row) => row && typeof row === 'object')
    .map((row) => ({
      proposalId: safeText(row.proposalId, '', 120),
      plotId: safeText(row.plotId, '', 120),
      status: normalizeCivicProposalStatus(row.status),
      title: safeText(row.title, 'Civic Proposal', 120),
      category: normalizeCivicProposalCategory(row.category),
      summary: safeText(row.summary, '', 480),
      scope: row.scope && typeof row.scope === 'object' ? clone(row.scope) : {},
      review: row.review && typeof row.review === 'object' ? clone(row.review) : {},
      authorityBoundary: safeText(row.authorityBoundary, CIVIC_PROPOSAL_AUTHORITY_BOUNDARY, 160),
      createdBy: mutationActor(row.createdBy || 'HUMAN'),
      approvedBy: safeText(row.approvedBy, '', 80) || null,
      createdAt: Number(row.createdAt || 0),
      updatedAt: Number(row.updatedAt || 0),
      reviewedAt: row.reviewedAt == null ? null : Number(row.reviewedAt),
      archivedAt: row.archivedAt == null ? null : Number(row.archivedAt)
    }))
    .filter((row) => row.proposalId && row.plotId);
}

function civicProposalCounts(proposals) {
  const counts = { DRAFT: 0, REVIEWED: 0, ARCHIVED: 0 };
  for (const proposal of normalizeCivicProposals(proposals)) {
    counts[proposal.status] = Number(counts[proposal.status] || 0) + 1;
  }
  return counts;
}

function civicProposalsReadModel(bundle) {
  const worldGrid = worldGridReadModel(bundle);
  const proposals = normalizeCivicProposals(bundle?.civicProposals || []);
  const byStatus = civicProposalCounts(proposals);
  return {
    status: worldGrid.civicReadiness.ready ? 'RECORDING_READY' : 'LOCKED',
    title: 'Civic Proposal Records',
    implementation: 'hq10b_server_owned_civic_proposal_records_v1',
    proposalOnly: true,
    readOnlyExecution: true,
    authorityBoundary: CIVIC_PROPOSAL_AUTHORITY_BOUNDARY,
    allowedStatuses: clone(CIVIC_PROPOSAL_STATUSES),
    allowedCategories: clone(CIVIC_PROPOSAL_CATEGORIES),
    requirements: clone(worldGrid.requirements),
    worldGridProjectionHash: worldGrid.projectionHash,
    counts: {
      total: proposals.length,
      byStatus,
      draftCount: byStatus.DRAFT,
      reviewedCount: byStatus.REVIEWED,
      archivedCount: byStatus.ARCHIVED
    },
    proposals
  };
}

function normalizeOverlayPackStatus(value, fallback = 'DRAFT') {
  const status = safeText(value, fallback, 40).toUpperCase();
  return OVERLAY_PACK_STATUSES.includes(status) ? status : fallback;
}

function sanitizeStringList(value, maxItems = 12, maxText = 120) {
  return Array.from(new Set((Array.isArray(value) ? value : [])
    .map((entry) => safeText(entry, '', maxText))
    .filter(Boolean)))
    .slice(0, maxItems);
}

function sanitizePresentationValue(value, depth = 0) {
  if (depth > 2) return null;
  if (Array.isArray(value)) {
    return value.slice(0, 12)
      .map((entry) => sanitizePresentationValue(entry, depth + 1))
      .filter((entry) => entry !== null && entry !== undefined);
  }
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, entry] of Object.entries(value).slice(0, 20)) {
      const cleanKey = slugFor(key, '').slice(0, 64);
      if (!cleanKey) continue;
      const cleanValue = sanitizePresentationValue(entry, depth + 1);
      if (cleanValue !== null && cleanValue !== undefined) out[cleanKey] = cleanValue;
    }
    return out;
  }
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'boolean') return value;
  return safeText(value, '', 220);
}

function normalizeOverlayDisplayHints(value) {
  const allowed = new Set([
    'labels', 'skins', 'iconIds', 'colorway', 'layout', 'decorativeRouteStyle',
    'surfaceStyle', 'assetManifest', 'notes'
  ]);
  const source = value && typeof value === 'object' ? value : {};
  const out = {};
  for (const [key, entry] of Object.entries(source)) {
    if (!allowed.has(key)) continue;
    const cleanValue = sanitizePresentationValue(entry);
    if (cleanValue !== null && cleanValue !== undefined) out[key] = cleanValue;
  }
  return out;
}

function normalizeOverlayPrompt(value) {
  const sanitizedPrompt = safeText(value, '', 600);
  return {
    sanitizedPrompt,
    promptDigest: sanitizedPrompt ? hashPayload({ prompt: sanitizedPrompt }).slice(0, 16) : null,
    redactionLevel: 'private_internal',
    rawPromptStored: false
  };
}

function normalizeOverlayProvenance(value, sourceProposalId) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    source: safeText(source.source, 'generated_universe_overlay_pack_record', 120),
    provider: safeText(source.provider, '', 80) || null,
    model: safeText(source.model, '', 80) || null,
    assetManifest: sanitizePresentationValue(source.assetManifest || {}),
    sourceProposalId: safeText(sourceProposalId, '', 120),
    generatedBy: 'hq10c_overlay_pack_record_v1',
    publicSharing: false,
    externalEffects: false
  };
}

function normalizeOverlayPacks(value) {
  const rows = Array.isArray(value) ? value : [];
  return rows
    .filter((row) => row && typeof row === 'object')
    .map((row) => ({
      overlayPackId: safeText(row.overlayPackId, '', 120),
      plotId: safeText(row.plotId, '', 120),
      sourceProposalId: safeText(row.sourceProposalId, '', 120),
      status: normalizeOverlayPackStatus(row.status),
      title: safeText(row.title, 'Generated Universe Overlay Pack', 120),
      theme: safeText(row.theme, 'civic', 80),
      summary: safeText(row.summary, '', 480),
      targetSurfaceIds: sanitizeStringList(row.targetSurfaceIds, 8, 80),
      targetNodeIds: sanitizeStringList(row.targetNodeIds, 20, 120),
      displayHints: normalizeOverlayDisplayHints(row.displayHints),
      prompt: row.prompt && typeof row.prompt === 'object'
        ? clone(row.prompt)
        : normalizeOverlayPrompt(row.prompt),
      provenance: row.provenance && typeof row.provenance === 'object'
        ? clone(row.provenance)
        : normalizeOverlayProvenance(row.provenance, row.sourceProposalId),
      visualOnly: true,
      presentationOnly: true,
      gameplayMutationPolicy: 'presentation_only',
      authorityBoundary: safeText(row.authorityBoundary, OVERLAY_PACK_AUTHORITY_BOUNDARY, 180),
      createdBy: mutationActor(row.createdBy || 'HUMAN'),
      approvedBy: safeText(row.approvedBy, '', 80) || null,
      createdAt: Number(row.createdAt || 0),
      updatedAt: Number(row.updatedAt || 0),
      reviewedAt: row.reviewedAt == null ? null : Number(row.reviewedAt),
      archivedAt: row.archivedAt == null ? null : Number(row.archivedAt)
    }))
    .filter((row) => row.overlayPackId && row.plotId && row.sourceProposalId);
}

function overlayPackCounts(packs) {
  const counts = { DRAFT: 0, REVIEWED: 0, ARCHIVED: 0 };
  for (const pack of normalizeOverlayPacks(packs)) {
    counts[pack.status] = Number(counts[pack.status] || 0) + 1;
  }
  return counts;
}

function overlayPacksReadModel(bundle) {
  const worldGrid = worldGridReadModel(bundle);
  const packs = normalizeOverlayPacks(bundle?.overlayPacks || []);
  const proposals = normalizeCivicProposals(bundle?.civicProposals || []);
  const reviewedProposalIds = proposals
    .filter((proposal) => proposal.status === 'REVIEWED')
    .map((proposal) => proposal.proposalId)
    .sort();
  const byStatus = overlayPackCounts(packs);
  const ready = worldGrid.civicReadiness.ready === true && reviewedProposalIds.length > 0;
  const blockedBy = [
    ...(worldGrid.requirements?.blockedBy || []),
    ...(reviewedProposalIds.length > 0 ? [] : ['civic_proposal.reviewed'])
  ];
  return {
    status: ready ? 'RECORDING_READY' : 'LOCKED',
    title: 'Generated Universe Overlay Packs',
    implementation: 'hq10c_server_owned_generated_universe_overlay_pack_records_v1',
    presentationOnly: true,
    visualOnly: true,
    gameplayMutationPolicy: 'presentation_only',
    stableGameplayHashExcluded: true,
    executableActions: [],
    publicSharing: false,
    renderingImplemented: false,
    authorityBoundary: OVERLAY_PACK_AUTHORITY_BOUNDARY,
    allowedStatuses: clone(OVERLAY_PACK_STATUSES),
    requirements: {
      items: [
        ...(worldGrid.requirements?.items || []),
        {
          key: 'civic_proposal.reviewed',
          label: 'Reviewed civic proposal',
          satisfied: reviewedProposalIds.length > 0,
          current: reviewedProposalIds.length,
          required: 1
        }
      ],
      blockedBy,
      satisfiedCount: Math.max(0, Number(worldGrid.requirements?.satisfiedCount || 0) + (reviewedProposalIds.length > 0 ? 1 : 0)),
      totalCount: Math.max(1, Number(worldGrid.requirements?.totalCount || 0) + 1)
    },
    sourceProposalIds: reviewedProposalIds,
    counts: {
      total: packs.length,
      byStatus,
      draftCount: byStatus.DRAFT,
      reviewedCount: byStatus.REVIEWED,
      archivedCount: byStatus.ARCHIVED
    },
    packs
  };
}

function normalizeCivicProjectStatus(value, fallback = 'ACTIVE') {
  const status = safeText(value, fallback, 40).toUpperCase();
  return CIVIC_PROJECT_STATUSES.includes(status) ? status : fallback;
}

function normalizeCivicProjectType(value) {
  const projectType = slugFor(value, 'civic_beacon');
  return CIVIC_PROJECT_TYPES.includes(projectType) ? projectType : 'civic_beacon';
}

function normalizeCivicProjectEffect(value, projectType = 'civic_beacon') {
  const source = value && typeof value === 'object' ? value : {};
  if (normalizeCivicProjectType(projectType) !== 'civic_beacon') return {};
  const inspection = source.inspection && typeof source.inspection === 'object' ? source.inspection : {};
  const baselineReadinessInspected = inspection.baselineReadinessInspected === true;
  const inspectionCount = Math.max(0, Math.floor(Number(inspection.inspectionCount || 0)));
  return {
    effectId: CIVIC_BEACON_EFFECT_ID,
    kind: 'local_civic_beacon',
    scope: 'local_plot',
    readinessDelta: 1,
    inspection: {
      baselineReadinessInspected,
      inspectionCount,
      latestInspectedAt: inspection.latestInspectedAt == null ? null : Number(inspection.latestInspectedAt),
      maintenanceState: baselineReadinessInspected ? 'INSPECTED' : 'PENDING_BASELINE_INSPECTION',
      inspectionReadinessDelta: baselineReadinessInspected ? 1 : 0
    },
    moraleMarker: 'civic_beacon_lit',
    publicWork: true,
    visibleInWorldGrid: true,
    resourceDelta: {},
    routeCreation: false,
    tradeRouteCreation: false,
    backgroundScheduling: false,
    externalEffects: false,
    appliedAt: source.appliedAt == null ? null : Number(source.appliedAt)
  };
}

function normalizeCivicProjectInspections(project) {
  const receipt = project?.receipt && typeof project.receipt === 'object' ? project.receipt : {};
  return (Array.isArray(receipt.inspections) ? receipt.inspections : [])
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry) => {
      const inspectionType = slugFor(entry.inspectionType, 'baseline_readiness');
      return {
        kind: 'civic_project_inspection',
        actionName: 'et.plot.inspect_civic_project',
        projectId: safeText(entry.projectId || project?.projectId, '', 120),
        inspectionType: CIVIC_PROJECT_INSPECTION_TYPES.includes(inspectionType) ? inspectionType : 'baseline_readiness',
        inspectedBy: mutationActor(entry.inspectedBy || entry.actor || 'HUMAN'),
        note: safeText(entry.note, '', 320),
        worldGridProjectionHash: safeText(entry.worldGridProjectionHash, '', 80) || null,
        authorityBoundary: safeText(entry.authorityBoundary, CIVIC_PROJECT_INSPECTION_AUTHORITY_BOUNDARY, 180),
        inspectedAt: entry.inspectedAt == null ? null : Number(entry.inspectedAt),
        resourceDelta: {},
        routeCreation: false,
        tradeRouteCreation: false,
        backgroundScheduling: false,
        externalEffects: false,
        atlasExecution: false,
        crossPlotMutation: false
      };
    })
    .filter((entry) => entry.projectId && entry.inspectionType);
}

function civicProjectInspectionStats(projects) {
  const rows = normalizeCivicProjects(projects);
  const inspections = rows.flatMap((project) => normalizeCivicProjectInspections(project));
  const baselineProjectIds = new Set(inspections
    .filter((entry) => entry.inspectionType === 'baseline_readiness')
    .map((entry) => entry.projectId));
  const latestInspectedAt = inspections
    .map((entry) => Number(entry.inspectedAt || 0))
    .filter((value) => value > 0)
    .sort((a, b) => b - a)[0] || null;
  return {
    totalInspectionCount: inspections.length,
    baselineInspectedCount: baselineProjectIds.size,
    latestInspectedAt,
    inspections
  };
}

function normalizeCivicProjects(value) {
  const rows = Array.isArray(value) ? value : [];
  return rows
    .filter((row) => row && typeof row === 'object')
    .map((row) => {
      const projectType = normalizeCivicProjectType(row.projectType);
      return {
        projectId: safeText(row.projectId, '', 120),
        plotId: safeText(row.plotId, '', 120),
        sourceProposalId: safeText(row.sourceProposalId, '', 120),
        status: normalizeCivicProjectStatus(row.status),
        projectType,
        title: safeText(row.title, 'Civic Beacon', 120),
        summary: safeText(row.summary, '', 480),
        effect: normalizeCivicProjectEffect(row.effect, projectType),
        receipt: row.receipt && typeof row.receipt === 'object' ? clone(row.receipt) : {},
        authorityBoundary: safeText(row.authorityBoundary, CIVIC_PROJECT_AUTHORITY_BOUNDARY, 180),
        createdBy: mutationActor(row.createdBy || 'HUMAN'),
        approvedBy: safeText(row.approvedBy, '', 80) || null,
        createdAt: Number(row.createdAt || 0),
        updatedAt: Number(row.updatedAt || 0),
        activatedAt: row.activatedAt == null ? null : Number(row.activatedAt),
        archivedAt: row.archivedAt == null ? null : Number(row.archivedAt)
      };
    })
    .filter((row) => row.projectId && row.plotId && row.sourceProposalId);
}

function civicProjectCounts(projects) {
  const byStatus = { ACTIVE: 0, ARCHIVED: 0 };
  const byType = { civic_beacon: 0 };
  for (const project of normalizeCivicProjects(projects)) {
    byStatus[project.status] = Number(byStatus[project.status] || 0) + 1;
    byType[project.projectType] = Number(byType[project.projectType] || 0) + 1;
  }
  return { byStatus, byType };
}

function civicProjectsReadModel(bundle) {
  const worldGrid = worldGridReadModel(bundle);
  const projects = normalizeCivicProjects(bundle?.civicProjects || []);
  const proposals = normalizeCivicProposals(bundle?.civicProposals || []);
  const reviewedProposalIds = proposals
    .filter((proposal) => proposal.status === 'REVIEWED')
    .map((proposal) => proposal.proposalId)
    .sort();
  const counts = civicProjectCounts(projects);
  const activeProjects = projects.filter((project) => project.status === 'ACTIVE');
  const activeBeaconCount = activeProjects.filter((project) => project.projectType === 'civic_beacon').length;
  const inspectionStats = civicProjectInspectionStats(activeProjects);
  const ready = worldGrid.civicReadiness.ready === true && reviewedProposalIds.length > 0;
  const blockedBy = [
    ...(worldGrid.requirements?.blockedBy || []),
    ...(reviewedProposalIds.length > 0 ? [] : ['civic_proposal.reviewed'])
  ];
  return {
    status: activeBeaconCount > 0 ? 'ACTIVE' : ready ? 'ACTIVATION_READY' : 'LOCKED',
    title: 'Civic Project Activation',
    implementation: 'hq10d_server_owned_civic_project_activation_v1',
    activationAllowed: ready,
    publicWork: true,
    authorityBoundary: CIVIC_PROJECT_AUTHORITY_BOUNDARY,
    allowedStatuses: clone(CIVIC_PROJECT_STATUSES),
    allowedProjectTypes: clone(CIVIC_PROJECT_TYPES),
    requirements: {
      items: [
        ...(worldGrid.requirements?.items || []),
        {
          key: 'civic_proposal.reviewed',
          label: 'Reviewed civic proposal',
          satisfied: reviewedProposalIds.length > 0,
          current: reviewedProposalIds.length,
          required: 1
        }
      ],
      blockedBy,
      satisfiedCount: Math.max(0, Number(worldGrid.requirements?.satisfiedCount || 0) + (reviewedProposalIds.length > 0 ? 1 : 0)),
      totalCount: Math.max(1, Number(worldGrid.requirements?.totalCount || 0) + 1)
    },
    sourceProposalIds: reviewedProposalIds,
    counts: {
      total: projects.length,
      activeCount: counts.byStatus.ACTIVE,
      archivedCount: counts.byStatus.ARCHIVED,
      byStatus: counts.byStatus,
      byType: counts.byType
    },
    activeEffects: {
      localCivicBeacon: activeBeaconCount > 0,
      activeBeaconCount,
      localReadinessDelta: Math.min(1, activeBeaconCount),
      baselineInspectionComplete: inspectionStats.baselineInspectedCount > 0,
      baselineInspectedCount: inspectionStats.baselineInspectedCount,
      inspectionCount: inspectionStats.totalInspectionCount,
      latestInspectedAt: inspectionStats.latestInspectedAt,
      inspectionReadinessDelta: Math.min(1, inspectionStats.baselineInspectedCount),
      moraleMarkers: [
        ...(activeBeaconCount > 0 ? ['civic_beacon_lit'] : []),
        ...(inspectionStats.baselineInspectedCount > 0 ? ['civic_beacon_inspected'] : [])
      ]
    },
    projects
  };
}

function workOrderTemplateAvailability(bundle, template) {
  const hqLevel = Math.max(1, Math.floor(Number(bundle?.plot?.hqLevel || 1)));
  const outpostCount = foundedOutpostCount(bundle);
  const doctrineState = normalizeDoctrineState(bundle?.plot?.doctrineState);
  const blockedBy = [];
  if (hqLevel < Number(template.unlockHqLevel || 1)) blockedBy.push(`hq.level.${Number(template.unlockHqLevel || 1)}`);
  if (template.requiresFoundedOutpost && outpostCount < 1) blockedBy.push('settlement.outpost.founded');
  if (template.requiresSelectedDoctrine && doctrineState.selectedDoctrineId !== template.requiresSelectedDoctrine) {
    blockedBy.push(`doctrine.${template.requiresSelectedDoctrine}.selected`);
  }
  return {
    unlocked: blockedBy.length === 0,
    hqLevelRequired: Number(template.unlockHqLevel || 1),
    outpostCount,
    selectedDoctrineId: doctrineState.selectedDoctrineId,
    requiresFoundedOutpost: template.requiresFoundedOutpost === true,
    requiresSelectedDoctrine: template.requiresSelectedDoctrine || null,
    blockedBy
  };
}

function publicWorkOrderTemplates(bundle) {
  return Object.values(WORK_ORDER_TEMPLATES).map((template) => ({
    templateId: template.templateId,
    title: template.title,
    status: template.status,
    summary: template.summary,
    allowedActions: clone(template.allowedActions || []),
    caps: clone(template.caps || {}),
    authorityBoundary: template.authorityBoundary,
    availability: workOrderTemplateAvailability(bundle, template)
  }));
}

function workOrderPlannerReadModel(bundle) {
  const templates = publicWorkOrderTemplates(bundle);
  const unlocked = templates.some((template) => template.availability.unlocked);
  const executionAvailable = templates.some((template) => (
    template.templateId === 'collect_ready_outputs_once'
    && template.availability.unlocked
  ));
  return {
    status: unlocked ? 'DRAFTING_READY' : 'LOCKED',
    title: 'Cohort Work Orders',
    implementation: 'hq9b_server_owned_single_executor_collect_ready_outputs_once',
    executionAvailable,
    authorityBoundary: 'server_owned_work_order_executor_collect_ready_outputs_once_v1',
    templates,
    workOrders: normalizeWorkOrders(bundle?.workOrders || [])
  };
}

function countByField(rows, field) {
  return (Array.isArray(rows) ? rows : []).reduce((acc, row) => {
    const key = safeText(row?.[field], 'UNKNOWN', 80).toUpperCase();
    acc[key] = Number(acc[key] || 0) + 1;
    return acc;
  }, {});
}

function expeditionCoordinateForIndex(index) {
  const safeIndex = Math.max(0, Math.floor(Number(index || 0)));
  const base = EXPEDITION_MAP_RING_COORDINATES[safeIndex % EXPEDITION_MAP_RING_COORDINATES.length];
  const multiplier = Math.floor(safeIndex / EXPEDITION_MAP_RING_COORDINATES.length) + 1;
  return {
    q: Number(base.q) * multiplier,
    r: Number(base.r) * multiplier
  };
}

function expeditionCellId(coord) {
  return `cell_q${Number(coord?.q || 0)}_r${Number(coord?.r || 0)}`;
}

function expeditionCoordinateFromCellId(cellId = '') {
  const match = /^cell_q(-?\d+)_r(-?\d+)$/.exec(String(cellId || '').trim());
  if (!match) return null;
  return { q: Number(match[1]), r: Number(match[2]) };
}

function expeditionReceipt(kind, sourceIds = {}) {
  return {
    kind,
    sourceIds: clone(sourceIds || {}),
    readOnly: true,
    authorityBoundary: EXPEDITION_MAP_AUTHORITY_BOUNDARY,
    resourceDelta: {},
    routeCreation: false,
    tradeRouteCreation: false,
    backgroundScheduling: false,
    atlasExecution: false,
    externalEffects: false
  };
}

function expeditionEventPacketBoundaryFlags() {
  return {
    readModelOnly: true,
    receiptMetadataOnly: true,
    autonomousMovement: false,
    resourceHarvesting: false,
    resourceDelta: {},
    resourceGain: false,
    resourceLoss: false,
    routeCreation: false,
    tradeRouteCreation: false,
    backgroundScheduling: false,
    combat: false,
    publicSharing: false,
    generatedUniverseRendering: false,
    crossPlotMutation: false,
    atlasExecution: false,
    externalEffects: false
  };
}

function expeditionSurveyBridgeBoundaryFlags() {
  return {
    readModelOnly: true,
    readinessOnly: true,
    createsSitePlan: false,
    createsSurveyor: false,
    addsMutationAuthority: false,
    autonomousMovement: false,
    operatorAssignment: false,
    resourceHarvesting: false,
    resourceDelta: {},
    resourceGain: false,
    resourceLoss: false,
    routeCreation: false,
    tradeRouteCreation: false,
    rewardCreation: false,
    backgroundScheduling: false,
    combat: false,
    publicSharing: false,
    generatedUniverseRendering: false,
    hiddenTruthLeakage: false,
    crossPlotMutation: false,
    atlasExecution: false,
    externalEffects: false
  };
}

function expeditionPacketSitePlanBoundaryFlags() {
  return {
    samePlotOnly: true,
    createsSitePlan: true,
    createsSurveyor: false,
    planningRecordOnly: true,
    reviewed: false,
    autonomousMovement: false,
    operatorAssignment: false,
    resourceHarvesting: false,
    resourceDelta: {},
    resourceGain: false,
    resourceLoss: false,
    routeCreation: false,
    tradeRouteCreation: false,
    rewardCreation: false,
    backgroundScheduling: false,
    combat: false,
    publicSharing: false,
    generatedUniverseRendering: false,
    hiddenTruthLeakage: false,
    crossPlotMutation: false,
    atlasExecution: false,
    externalEffects: false
  };
}

function expeditionPartyBoundaryFlags() {
  return {
    autonomousMovement: false,
    operatorAssignment: false,
    resourceHarvesting: false,
    resourceDelta: {},
    resourceGain: false,
    resourceLoss: false,
    routeCreation: false,
    tradeRouteCreation: false,
    backgroundScheduling: false,
    combat: false,
    publicSharing: false,
    generatedUniverseRendering: false,
    crossPlotMutation: false,
    atlasExecution: false,
    externalEffects: false
  };
}

function buildExpeditionPartyManifest({ plotId = null, projectionHash = null } = {}) {
  return {
    partyId: 'expedition_party_current_plot_v1',
    kind: 'expedition_party_manifest',
    version: 'hq12g.v1',
    readOnly: true,
    executableActions: [],
    authorityBoundary: EXPEDITION_PARTY_MANIFEST_AUTHORITY_BOUNDARY,
    source: {
      plotId: plotId || null,
      projectionHash: projectionHash || null
    },
    members: EXPEDITION_PARTY_MEMBERS.map((member) => clone(member)),
    boundaryFlags: expeditionPartyBoundaryFlags()
  };
}

function buildExpeditionPartySnapshot() {
  const manifest = buildExpeditionPartyManifest();
  return {
    partyId: manifest.partyId,
    kind: 'expedition_party_snapshot',
    version: manifest.version,
    readOnly: true,
    executableActions: [],
    authorityBoundary: manifest.authorityBoundary,
    members: manifest.members.map((member) => ({
      memberId: member.memberId,
      displayName: member.displayName,
      role: member.role
    })),
    boundaryFlags: clone(manifest.boundaryFlags)
  };
}

function expeditionUnitBoundaryFlags({ movementMutation = false } = {}) {
  return {
    serverOwnedPositions: true,
    readOnlySelection: true,
    movementMutation: movementMutation === true,
    movementMutationAuthority: movementMutation === true ? EXPEDITION_UNIT_MOVE_AUTHORITY_BOUNDARY : null,
    movementVersion: movementMutation === true ? EXPEDITION_UNIT_MOVE_VERSION : null,
    movementRevealsFog: false,
    autonomousMovement: false,
    operatorAssignment: false,
    resourceHarvesting: false,
    resourceDelta: {},
    resourceGain: false,
    resourceLoss: false,
    routeCreation: false,
    tradeRouteCreation: false,
    backgroundScheduling: false,
    combat: false,
    publicSharing: false,
    generatedUniverseRendering: false,
    crossPlotMutation: false,
    atlasExecution: false,
    externalEffects: false
  };
}

function expeditionAxialDistance(a = {}, b = {}) {
  const aq = Number(a.q || 0);
  const ar = Number(a.r || 0);
  const bq = Number(b.q || 0);
  const br = Number(b.r || 0);
  const as = -aq - ar;
  const bs = -bq - br;
  return Math.max(Math.abs(aq - bq), Math.abs(ar - br), Math.abs(as - bs));
}

function expeditionCellsAdjacent(a = {}, b = {}) {
  return expeditionAxialDistance(a, b) === 1;
}

function revealedExpeditionMoveTargetCells(location = {}, cellList = []) {
  const sourceCell = cellList.find((cell) => String(cell.cellId || '') === String(location.cellId || '')) || location;
  return cellList
    .filter((cell) => ['discovered', 'known'].includes(String(cell.fogState || '')))
    .filter((cell) => String(cell.cellId || '') !== String(sourceCell.cellId || ''))
    .filter((cell) => expeditionCellsAdjacent(sourceCell, cell))
    .sort((a, b) => a.q - b.q || a.r - b.r || a.cellId.localeCompare(b.cellId));
}

function hintedScoutTargetCells(location = {}, cellList = []) {
  const sourceCell = cellList.find((cell) => String(cell.cellId || '') === String(location.cellId || '')) || location;
  return cellList
    .filter((cell) => cell.fogState === 'hinted' && cell.kind === 'frontier_hint')
    .filter((cell) => expeditionCellsAdjacent(sourceCell, cell))
    .sort((a, b) => a.q - b.q || a.r - b.r || a.cellId.localeCompare(b.cellId));
}

function expeditionUnitMovementModel({ unitType, location, cellList }) {
  const canUseServerMove = safeText(unitType, '', 80).toLowerCase() === 'scout';
  const targets = canUseServerMove ? revealedExpeditionMoveTargetCells(location, cellList) : [];
  return {
    canMove: canUseServerMove && targets.length > 0,
    movementMutationImplemented: canUseServerMove,
    allowedTargetCellIds: targets.map((cell) => cell.cellId),
    authority: canUseServerMove
      ? EXPEDITION_UNIT_MOVE_AUTHORITY_BOUNDARY
      : 'future_server_authoritative_slice_required',
    allowedFogStates: canUseServerMove ? ['discovered', 'known'] : [],
    revealsFog: false,
    routeCreation: false,
    resourceDelta: {}
  };
}

function expeditionCellLocation(cell = {}, source = 'server_read_model_cell') {
  return {
    cellId: safeText(cell.cellId, 'cell_origin', 80),
    q: Number(cell.q || 0),
    r: Number(cell.r || 0),
    fogState: safeText(cell.fogState, 'discovered', 40),
    source
  };
}

function expeditionUnitCommandHints({ member = {}, unit = {}, cellList = [], eventPackets = [] } = {}) {
  const role = safeText(unit.role || member.role, '', 80).toLowerCase();
  const unitType = safeText(unit.unitType || role, '', 80).toLowerCase();
  const location = unit.location || null;
  if (role === 'scout') {
    const moveTargetCellIds = expeditionUnitMovementModel({ unitType, location, cellList }).allowedTargetCellIds;
    const scoutTargetCellIds = hintedScoutTargetCells(location, cellList).map((cell) => cell.cellId);
    return [
      {
        commandId: 'move_unit',
        label: 'Move',
        actionName: 'et.plot.move_expedition_unit',
        enabled: moveTargetCellIds.length > 0,
        targetCellIds: moveTargetCellIds,
        serverMutationImplemented: true,
        requiresHumanApprovalForAgent: true,
        previewOnlyUntilSelected: true,
        authorityBoundary: EXPEDITION_UNIT_MOVE_AUTHORITY_BOUNDARY,
        revealsFog: false,
        routeCreation: false
      },
      {
        commandId: 'scout_sector',
        label: 'Scout Sector',
        actionName: 'et.plot.scout_sector',
        enabled: scoutTargetCellIds.length > 0,
        targetCellIds: scoutTargetCellIds,
        serverMutationImplemented: true,
        requiresHumanApprovalForAgent: true,
        previewOnlyUntilSelected: true
      }
    ];
  }
  if (role === 'messenger') {
    return [{
      commandId: 'inspect_event_packet',
      label: 'Inspect packet',
      enabled: eventPackets.length > 0,
      targetPacketIds: eventPackets.map((packet) => packet.packetId),
      serverMutationImplemented: false,
      previewOnlyUntilSelected: true
    }];
  }
  return [{
    commandId: 'inspect_receipts',
    label: 'Open ledger',
    enabled: true,
    serverMutationImplemented: false,
    previewOnlyUntilSelected: true
  }];
}

function buildExpeditionPartyUnit({ member, cell, unitType, state, cellList, eventPackets }) {
  const unitRole = safeText(member.role, unitType, 80);
  const unitId = `expedition_unit_${slugFor(member.memberId || member.displayName || unitRole, unitType)}`;
  const unit = {
    unitId,
    kind: 'expedition_map_unit',
    unitType,
    displayName: safeText(member.displayName, friendlyRoleLabel(unitRole), 120),
    role: unitRole,
    state: safeText(state, 'READY', 40).toUpperCase(),
    readOnly: true,
    selectable: true,
    executableActions: [],
    authorityBoundary: EXPEDITION_UNIT_ROSTER_AUTHORITY_BOUNDARY,
    sourceMemberId: safeText(member.memberId, unitId, 120),
    assetSrc: safeText(member.assetSrc, '', 240) || null,
    metadataSrc: safeText(member.metadataSrc, '', 240) || null,
    location: expeditionCellLocation(cell),
    movement: null,
    commandHints: [],
    boundaryFlags: expeditionUnitBoundaryFlags({ movementMutation: unitType === 'scout' })
  };
  unit.movement = expeditionUnitMovementModel({ unitType, location: unit.location, cellList });
  unit.commandHints = expeditionUnitCommandHints({ member, unit, cellList, eventPackets });
  return unit;
}

function friendlyRoleLabel(role = '') {
  return safeText(role, 'unit', 80)
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`)
    .join(' ') || 'Unit';
}

function buildSettlementClaimUnit({ claim, coord, cell, status }) {
  const founded = status === 'FOUNDED';
  const preparing = status === 'CONVOY_PREPARING';
  const arrived = status === 'CONVOY_ARRIVED';
  const unitType = founded ? 'outpost_crew' : 'settler_convoy';
  const route = claim.route && typeof claim.route === 'object' ? clone(claim.route) : {};
  const targetCellId = cell?.cellId || expeditionCellId(coord);
  const commandHints = arrived ? [{
    commandId: 'found_settlement',
    label: 'Found Outpost',
    actionName: 'et.plot.found_settlement',
    enabled: true,
    claimId: claim.claimId,
    targetCellIds: [targetCellId],
    serverMutationImplemented: true,
    requiresHumanApprovalForAgent: true,
    previewOnlyUntilSelected: true,
    movementMutation: false,
    routeCreation: false
  }] : [{
    commandId: founded ? 'inspect_outpost' : 'inspect_convoy',
    label: founded ? 'Inspect outpost' : 'Inspect convoy',
    enabled: true,
    serverMutationImplemented: false,
    previewOnlyUntilSelected: true
  }];
  return {
    unitId: `expedition_unit_${unitType}_${slugFor(claim.claimId, 'claim')}`,
    kind: 'expedition_map_unit',
    unitType,
    displayName: founded ? 'Outpost Crew' : 'Settler Convoy',
    role: founded ? 'outpost_crew' : 'settler',
    state: founded ? 'STATIONED' : status,
    readOnly: true,
    selectable: true,
    executableActions: [],
    authorityBoundary: EXPEDITION_UNIT_ROSTER_AUTHORITY_BOUNDARY,
    sourceClaimId: claim.claimId,
    sourcePlanId: claim.sitePlanId || null,
    sourceReportId: claim.reportId || null,
    assetSrc: '/experiences/founders-plot/assets/characters/inhabitants/settler/settler-convoy-crew-v1.png',
    metadataSrc: '/experiences/founders-plot/assets/characters/inhabitants/settler/settler-convoy-crew-v1.json',
    location: expeditionCellLocation(cell || {
      cellId: expeditionCellId(coord),
      q: coord.q,
      r: coord.r,
      fogState: founded ? 'discovered' : 'known'
    }, 'settlement_claim_coordinate'),
    movement: {
      canMove: false,
      movementMutationImplemented: false,
      allowedTargetCellIds: [],
      authority: 'future_server_authoritative_slice_required',
      pathPreview: preparing ? {
        ...route,
        visualOnly: true,
        routeCreation: false
      } : null
    },
    commandHints,
    boundaryFlags: expeditionUnitBoundaryFlags()
  };
}

function buildSurveyorUnit({ plan, coord, cell, settlementClaims = [] }) {
  const targetCellId = cell?.cellId || expeditionCellId(coord);
  const reviewed = plan.reviewStatus === 'reviewed'
    || ['reviewed_claim_ready', 'convoy_preparing', 'claimed'].includes(plan.promotionStatus);
  const hasClaim = settlementClaims.some((claim) => String(claim.sitePlanId || '') === String(plan.planId || ''));
  const commandHints = [{
    commandId: 'inspect_survey',
    label: 'Inspect survey',
    enabled: true,
    serverMutationImplemented: false,
    previewOnlyUntilSelected: true
  }];
  if (reviewed && !hasClaim) {
    commandHints.push({
      commandId: 'prepare_settler_convoy',
      label: 'Prepare Convoy',
      actionName: 'et.plot.prepare_settler_convoy',
      enabled: true,
      sourcePlanId: plan.planId || null,
      targetCellIds: [targetCellId],
      serverMutationImplemented: true,
      requiresHumanApprovalForAgent: true,
      previewOnlyUntilSelected: true,
      movementMutation: false,
      routeCreation: false
    });
  }
  return {
    unitId: `expedition_unit_surveyor_${slugFor(plan.planId, 'plan')}`,
    kind: 'expedition_map_unit',
    unitType: 'surveyor',
    displayName: 'Surveyor Crew',
    role: 'surveyor',
    state: 'SURVEY_READY',
    readOnly: true,
    selectable: true,
    executableActions: [],
    authorityBoundary: EXPEDITION_UNIT_ROSTER_AUTHORITY_BOUNDARY,
    sourcePlanId: plan.planId || null,
    sourceReportId: plan.reportId || null,
    assetSrc: null,
    metadataSrc: null,
    location: expeditionCellLocation(cell || {
      cellId: expeditionCellId(coord),
      q: coord.q,
      r: coord.r,
      fogState: 'known'
    }, 'site_plan_coordinate'),
    movement: {
      canMove: false,
      movementMutationImplemented: false,
      allowedTargetCellIds: [],
      authority: 'future_server_authoritative_slice_required',
      allowedFogStates: [],
      revealsFog: false,
      routeCreation: false,
      resourceDelta: {}
    },
    commandHints,
    boundaryFlags: expeditionUnitBoundaryFlags()
  };
}

function latestExpeditionUnitMovesByUnitId(unitMoves = []) {
  const latest = new Map();
  normalizeExpeditionUnitMoves(unitMoves)
    .sort((a, b) => Number(a.createdAt || 0) - Number(b.createdAt || 0) || a.moveId.localeCompare(b.moveId))
    .forEach((move) => {
      latest.set(move.unitId, move);
    });
  return latest;
}

function applyExpeditionUnitMoves(units, { unitMoves = [], cellList = [], eventPackets = [] } = {}) {
  const latestMoves = latestExpeditionUnitMovesByUnitId(unitMoves);
  return units.map((unit) => {
    const move = latestMoves.get(unit.unitId);
    const targetCell = move
      ? cellList.find((cell) => (
        String(cell.cellId || '') === String(move.targetCellId || '')
        && ['discovered', 'known'].includes(String(cell.fogState || ''))
      ))
      : null;
    const next = targetCell ? {
      ...unit,
      state: unit.unitType === 'scout' ? 'MOVED' : unit.state,
      location: expeditionCellLocation(targetCell, 'expedition_unit_move_receipt'),
      lastMove: {
        moveId: move.moveId,
        sourceCellId: move.sourceCellId,
        targetCellId: move.targetCellId,
        receiptKind: move.receipt?.kind || 'expedition_unit_move_receipt',
        actionName: move.receipt?.actionName || 'et.plot.move_expedition_unit',
        createdAt: move.createdAt,
        readOnly: true
      }
    } : { ...unit };
    next.movement = expeditionUnitMovementModel({
      unitType: next.unitType,
      location: next.location,
      cellList
    });
    const refreshedCommandHints = expeditionUnitCommandHints({
      member: { role: next.role },
      unit: next,
      cellList,
      eventPackets
    });
    next.commandHints = ['scout', 'courier'].includes(String(next.unitType || ''))
      ? refreshedCommandHints
      : (Array.isArray(next.commandHints) && next.commandHints.length ? next.commandHints : refreshedCommandHints);
    next.boundaryFlags = expeditionUnitBoundaryFlags({
      movementMutation: next.movement?.movementMutationImplemented === true
    });
    return next;
  });
}

function buildExpeditionUnitRoster({ plotId, expeditionParty, cellList, eventPackets, sitePlans = [], planCoordinates, settlementClaims, claimCoordinates, unitMoves = [] }) {
  const originCell = cellList.find((cell) => cell.cellId === 'cell_origin') || { cellId: 'cell_origin', q: 0, r: 0, fogState: 'discovered' };
  const latestPacket = eventPackets.slice().sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))[0] || null;
  const latestPacketCell = latestPacket
    ? cellList.find((cell) => cell.cellId === latestPacket.cellId)
    : null;
  const latestKnownScoutCell = cellList
    .filter((cell) => cell.sourceTruth === 'expedition_scout_sector')
    .sort((a, b) => a.cellId.localeCompare(b.cellId))[0] || null;
  const members = Array.isArray(expeditionParty?.members) ? expeditionParty.members : [];
  const units = members.map((member) => {
    const role = safeText(member.role, '', 80).toLowerCase();
    if (role === 'scout') {
      return buildExpeditionPartyUnit({
        member,
        unitType: 'scout',
        state: latestKnownScoutCell ? 'FIELD_READY' : 'AT_ORIGIN',
        cell: latestKnownScoutCell || originCell,
        cellList,
        eventPackets
      });
    }
    if (role === 'messenger') {
      return buildExpeditionPartyUnit({
        member,
        unitType: 'courier',
        state: latestPacketCell ? 'PACKET_LINKED' : 'AT_ORIGIN',
        cell: latestPacketCell || originCell,
        cellList,
        eventPackets
      });
    }
    return buildExpeditionPartyUnit({
      member,
      unitType: 'field_support',
      state: 'SUPPORT_READY',
      cell: originCell,
      cellList,
      eventPackets
    });
  });

  const surveyPlans = sitePlans
    .filter((plan) => plan && plan.planId)
    .filter((plan) => (
      plan.reviewStatus === 'reviewed'
      || ['reviewed_claim_ready', 'convoy_preparing', 'claimed'].includes(plan.promotionStatus)
    ))
    .slice(0, 4);
  for (const plan of surveyPlans) {
    const coord = planCoordinates?.get(plan.planId);
    if (!coord) continue;
    const cellId = expeditionCellId(coord);
    units.push(buildSurveyorUnit({
      plan,
      coord,
      cell: cellList.find((entry) => entry.cellId === cellId),
      settlementClaims
    }));
  }

  for (const claim of settlementClaims) {
    const status = safeText(claim.status, '', 40).toUpperCase();
    if (!['CONVOY_PREPARING', 'CONVOY_ARRIVED', 'FOUNDED'].includes(status)) continue;
    const coord = claimCoordinates.get(claim.claimId);
    if (!coord) continue;
    const cellId = expeditionCellId(coord);
    units.push(buildSettlementClaimUnit({
      claim,
      coord,
      status,
      cell: cellList.find((entry) => entry.cellId === cellId)
    }));
  }

  const positionedUnits = applyExpeditionUnitMoves(units, { unitMoves, cellList, eventPackets });
  const movementMutation = positionedUnits.some((unit) => unit.movement?.movementMutationImplemented === true);
  const byCellId = {};
  for (const unit of positionedUnits) {
    const cellId = unit.location?.cellId || 'cell_origin';
    if (!byCellId[cellId]) byCellId[cellId] = [];
    byCellId[cellId].push(unit.unitId);
  }

  return {
    unitRosterId: 'expedition_unit_roster_current_plot_v1',
    kind: 'expedition_unit_roster',
    version: EXPEDITION_UNIT_ROSTER_VERSION,
    plotId: plotId || null,
    readOnly: true,
    executableActions: [],
    authorityBoundary: EXPEDITION_UNIT_ROSTER_AUTHORITY_BOUNDARY,
    interactionModel: {
      selectable: true,
      mapTokens: true,
      commandBarReady: true,
      movementPreviewOnly: false,
      movementCommandReady: movementMutation,
      serverAuthoritativeMovementRequiredForMutation: true
    },
    items: positionedUnits,
    byCellId,
    counts: positionedUnits.reduce((acc, unit) => {
      acc.total += 1;
      acc.byType[unit.unitType] = Number(acc.byType[unit.unitType] || 0) + 1;
      return acc;
    }, { total: 0, byType: {} }),
    boundaryFlags: expeditionUnitBoundaryFlags({ movementMutation })
  };
}

function expeditionEventPacketTemplate(coord) {
  const q = Number(coord?.q || 0);
  const r = Number(coord?.r || 0);
  const index = Math.abs((q * 31) + (r * 17)) % EXPEDITION_EVENT_PACKET_TEMPLATES.length;
  return EXPEDITION_EVENT_PACKET_TEMPLATES[index];
}

function buildExpeditionEventPacket({ scoutSector, targetCell = null }) {
  const scout = scoutSector && typeof scoutSector === 'object' ? scoutSector : {};
  const q = Number(scout.q ?? targetCell?.q ?? 0);
  const r = Number(scout.r ?? targetCell?.r ?? 0);
  const cellId = safeText(scout.cellId || targetCell?.cellId, expeditionCellId({ q, r }), 80);
  const scoutId = safeText(scout.scoutId, `expedition_scout_${cellId}`, 120);
  const plotId = safeText(scout.plotId || targetCell?.sourceIds?.plotId, '', 120) || null;
  const sourceCellId = safeText(scout.sourceCellId || targetCell?.sourceIds?.adjacentCellId, '', 80) || null;
  const template = expeditionEventPacketTemplate({ q, r });
  const partySnapshot = buildExpeditionPartySnapshot();
  const packetHash = hashPayload({
    kind: 'expedition_event_packet',
    version: 'hq12g.v1',
    templateId: template.templateId,
    plotId,
    scoutId,
    cellId,
    q,
    r,
    sourceCellId,
    partyId: partySnapshot.partyId
  }).slice(0, 16);
  return {
    packetId: `expedition_event_packet_${packetHash}`,
    kind: 'expedition_event_packet',
    version: 'hq12g.v1',
    readOnly: true,
    executableActions: [],
    authorityBoundary: EXPEDITION_EVENT_PACKET_AUTHORITY_BOUNDARY,
    partyId: partySnapshot.partyId,
    partySnapshot,
    templateId: template.templateId,
    scoutId,
    plotId,
    cellId,
    q,
    r,
    sourceCellId,
    discoveryFlavor: template.discoveryFlavor,
    terrainExplanation: template.terrainExplanation,
    riskExplanation: template.riskExplanation,
    operatorNote: template.operatorNote,
    receiptLink: {
      kind: 'scout_sector_receipt',
      actionName: 'et.plot.scout_sector',
      scoutId,
      cellId,
      via: 'scoutSector.receipt'
    },
    boundaryFlags: expeditionEventPacketBoundaryFlags(),
    createdAt: Number(scout.createdAt || scout.receipt?.scoutedAt || 0),
    packetHash
  };
}

function expeditionSurveyBridgePlanByCellId(sitePlans = [], planCoordinates = new Map()) {
  const out = new Map();
  for (const plan of sitePlans) {
    const coord = planCoordinates?.get(plan.planId);
    if (!coord) continue;
    out.set(expeditionCellId(coord), plan);
  }
  return out;
}

function expeditionSurveyBridgeSurveyorByPlanId(units = {}) {
  const out = new Map();
  for (const unit of Array.isArray(units?.items) ? units.items : []) {
    const planId = safeText(unit.sourcePlanId, '', 120);
    if (!planId || unit.unitType !== 'surveyor') continue;
    out.set(planId, unit);
  }
  return out;
}

function buildExpeditionSurveyBridgeCandidate({ packet, cell, plan = null, surveyorUnit = null, reviewAvailable = false } = {}) {
  const cellId = safeText(packet?.cellId || packet?.receiptLink?.cellId || cell?.cellId, '', 80);
  const planReviewed = !!plan && (
    plan.reviewStatus === 'reviewed'
    || ['reviewed_claim_ready', 'convoy_preparing', 'claimed'].includes(String(plan.promotionStatus || '').toLowerCase())
  );
  const prepareCommand = (Array.isArray(surveyorUnit?.commandHints) ? surveyorUnit.commandHints : [])
    .find((command) => (
      command?.commandId === 'prepare_settler_convoy'
      && command.enabled !== false
      && command.serverMutationImplemented === true
    )) || null;
  const status = prepareCommand
    ? 'SURVEYOR_COMMAND_READY'
    : (plan ? 'SITE_PLAN_PRESENT' : 'PACKET_READY_FOR_SITE_PLAN_PREFLIGHT');
  const nextRequiredContract = prepareCommand
    ? 'existing_prepare_settler_convoy_endpoint'
    : (plan
      ? (planReviewed ? 'reviewed_site_plan_to_surveyor_command_hint' : 'existing_review_site_plan_endpoint')
      : 'existing_draft_site_plan_from_packet_endpoint');
  return {
    candidateId: `survey_bridge_${safeText(packet?.packetHash || packet?.packetId || cellId, 'packet', 120)}`,
    kind: 'scout_packet_to_survey_readiness',
    status,
    readOnly: true,
    executableActions: [],
    packetId: safeText(packet?.packetId, '', 160),
    scoutId: safeText(packet?.scoutId || packet?.receiptLink?.scoutId, '', 120) || null,
    cellId,
    cellFogState: safeText(cell?.fogState, 'known', 40),
    cellStatus: safeText(cell?.status, '', 80) || null,
    sourceReceiptKind: safeText(packet?.receiptLink?.kind, 'scout_sector_receipt', 80),
    sourceActionName: safeText(packet?.receiptLink?.actionName, 'et.plot.scout_sector', 120),
    sitePlan: plan ? {
      planId: plan.planId,
      status: plan.status,
      reviewStatus: plan.reviewStatus,
      promotionStatus: plan.promotionStatus,
      readOnly: true
    } : null,
    surveyorUnit: surveyorUnit ? {
      unitId: surveyorUnit.unitId,
      unitType: surveyorUnit.unitType,
      state: surveyorUnit.state,
      readOnly: true
    } : null,
    commandState: prepareCommand ? {
      commandId: 'prepare_settler_convoy',
      actionName: 'et.plot.prepare_settler_convoy',
      label: 'Prepare Convoy',
      enabled: true,
      sourcePlanId: safeText(prepareCommand.sourcePlanId || surveyorUnit?.sourcePlanId, '', 120),
      targetCellIds: Array.isArray(prepareCommand.targetCellIds)
        ? prepareCommand.targetCellIds.map((entry) => safeText(entry, '', 80)).filter(Boolean)
        : [],
      serverMutationImplemented: true,
      executableThroughExistingEndpoint: true,
      readOnly: true,
      executableActions: []
    } : (plan ? {
      commandId: 'review_site_plan',
      actionName: 'et.plot.review_site_plan',
      label: 'Review',
      enabled: !planReviewed && reviewAvailable === true,
      sourcePlanId: plan.planId || null,
      targetCellIds: cellId ? [cellId] : [],
      serverMutationImplemented: !planReviewed && reviewAvailable === true,
      executableThroughExistingEndpoint: !planReviewed && reviewAvailable === true,
      reason: planReviewed
        ? 'Site Plan is already reviewed; wait for the existing Surveyor command hint.'
        : reviewAvailable === true
          ? 'Existing review_site_plan rules allow this packet-grounded Site Plan to be reviewed through the guarded endpoint.'
          : 'Site Plan exists, but existing review_site_plan rules have not unlocked it yet.',
      authorityBoundary: safeText(plan.authorityBoundary, 'requires_engine_promotion_for_settlement', 120),
      readOnly: true,
      executableActions: []
    } : {
      commandId: 'draft_site_plan_from_packet',
      actionName: 'et.plot.draft_site_plan_from_packet',
      label: 'Plan',
      enabled: true,
      sourcePlanId: plan?.planId || null,
      sourcePacketId: safeText(packet?.packetId, '', 160),
      targetCellIds: cellId ? [cellId] : [],
      serverMutationImplemented: true,
      executableThroughExistingEndpoint: true,
      reason: 'Event Packet can draft one planning-only Site Plan through an explicit guarded server contract.',
      readOnly: true,
      executableActions: []
    }),
    nextRequiredContract,
    boundaryFlags: expeditionSurveyBridgeBoundaryFlags()
  };
}

function buildExpeditionSurveyBridgeReadModel({ plotId, eventPackets = [], cellList = [], sitePlans = [], planCoordinates = new Map(), units = {}, reviewablePlanIds = new Set() } = {}) {
  const planByCellId = expeditionSurveyBridgePlanByCellId(sitePlans, planCoordinates);
  const surveyorByPlanId = expeditionSurveyBridgeSurveyorByPlanId(units);
  const candidates = eventPackets
    .map((packet) => {
      const cellId = safeText(packet?.cellId || packet?.receiptLink?.cellId, '', 80);
      if (!cellId) return null;
      const cell = cellList.find((entry) => String(entry.cellId || '') === cellId) || null;
      if (!cell || !['known', 'discovered'].includes(String(cell.fogState || ''))) return null;
      const plan = planByCellId.get(cellId) || null;
      const surveyorUnit = plan ? surveyorByPlanId.get(plan.planId) || null : null;
      const reviewAvailable = !!(plan?.planId && reviewablePlanIds?.has(plan.planId));
      return buildExpeditionSurveyBridgeCandidate({ packet, cell, plan, surveyorUnit, reviewAvailable });
    })
    .filter(Boolean)
    .sort((a, b) => {
      const packetA = eventPackets.find((packet) => packet.packetId === a.packetId) || {};
      const packetB = eventPackets.find((packet) => packet.packetId === b.packetId) || {};
      return Number(packetB.createdAt || 0) - Number(packetA.createdAt || 0)
        || String(b.packetId || '').localeCompare(String(a.packetId || ''));
    });
  const active = candidates[0] || null;
  return {
    bridgeId: 'scout_packet_to_survey_bridge_current_plot_v1',
    kind: 'scout_packet_to_survey_bridge',
    version: EXPEDITION_SURVEY_BRIDGE_VERSION,
    plotId: plotId || null,
    status: active ? active.status : 'WAITING_FOR_SCOUT_PACKET',
    readOnly: true,
    executableActions: [],
    authorityBoundary: EXPEDITION_SURVEY_BRIDGE_AUTHORITY_BOUNDARY,
    sourceProjectionHash: null,
    activeCandidateId: active?.candidateId || null,
    activePacketId: active?.packetId || null,
    activeCellId: active?.cellId || null,
    activeCandidate: active,
    candidates,
    derivedFrom: [
      'expeditionMap.eventPackets',
      'expeditionMap.cells',
      'expeditionMap.units.items.commandHints',
      'plot.sitePlans'
    ],
    ledgerText: active
      ? 'Scout Sector Event Packet is server-recognized as Site Plan preflight. The bridge itself is read-only; a separate guarded packet-to-plan endpoint can draft one planning record without routes, resources, Surveyors, Atlas execution, or external effects.'
      : 'No Scout Sector Event Packet exists yet; Scout Sector remains the only fog reveal path before survey/site-plan preflight can appear.',
    boundaryFlags: expeditionSurveyBridgeBoundaryFlags()
  };
}

function normalizeExpeditionSource(source) {
  if (!source || typeof source !== 'object') return null;
  return {
    kind: safeText(source.kind, 'unknown', 80),
    id: safeText(source.id, '', 160),
    status: safeText(source.status, '', 80) || null
  };
}

function mergeExpeditionResourceHints(left, right) {
  const a = normalizeInventory(left || {});
  const b = normalizeInventory(right || {});
  const out = zeroInventory();
  for (const key of RESOURCE_KEYS) out[key] = Math.max(Number(a[key] || 0), Number(b[key] || 0));
  return out;
}

function mergeExpeditionCells(cells, next) {
  const priority = { locked_unknown: 0, hinted: 1, known: 2, discovered: 3 };
  const source = {
    ...next,
    fogState: EXPEDITION_MAP_FOG_STATES.includes(next.fogState) ? next.fogState : 'locked_unknown',
    readOnly: true,
    authorityBoundary: EXPEDITION_MAP_AUTHORITY_BOUNDARY
  };
  const existing = cells.get(source.cellId);
  if (!existing) {
    cells.set(source.cellId, {
      ...source,
      sources: (Array.isArray(source.sources) ? source.sources : [])
        .map(normalizeExpeditionSource)
        .filter(Boolean),
      receipts: (Array.isArray(source.receipts) ? source.receipts : [])
        .filter((entry) => entry && typeof entry === 'object'),
      traits: Array.isArray(source.traits) ? source.traits.slice(0, 8) : [],
      resourceHints: normalizeInventory(source.resourceHints || {})
    });
    return;
  }
  const keepIncoming = (priority[source.fogState] || 0) >= (priority[existing.fogState] || 0);
  const sources = new Map();
  for (const entry of [...(existing.sources || []), ...(source.sources || [])]) {
    const normalized = normalizeExpeditionSource(entry);
    if (normalized?.id) sources.set(`${normalized.kind}:${normalized.id}`, normalized);
  }
  const receipts = new Map();
  for (const receipt of [...(existing.receipts || []), ...(source.receipts || [])]) {
    const kind = safeText(receipt?.kind, 'receipt', 80);
    const ids = stableJsonStringify(receipt?.sourceIds || {});
    receipts.set(`${kind}:${ids}`, receipt);
  }
  const resourceHints = mergeExpeditionResourceHints(existing.resourceHints, source.resourceHints);
  cells.set(source.cellId, {
    ...(keepIncoming ? existing : source),
    ...(keepIncoming ? source : existing),
    sources: Array.from(sources.values()),
    receipts: Array.from(receipts.values()),
    traits: Array.from(new Set([
      ...(Array.isArray(existing.traits) ? existing.traits : []),
      ...(Array.isArray(source.traits) ? source.traits : [])
    ])).slice(0, 8),
    resourceHints,
    readOnly: true,
    authorityBoundary: EXPEDITION_MAP_AUTHORITY_BOUNDARY
  });
}

function expeditionCoordinateMaps({ scoutReports, sitePlans, settlementClaims }) {
  const reportCoordinates = new Map();
  const planCoordinates = new Map();
  const claimCoordinates = new Map();
  let cursor = 0;
  const nextCoordinate = () => expeditionCoordinateForIndex(cursor++);

  for (const report of scoutReports) {
    if (!reportCoordinates.has(report.reportId)) {
      reportCoordinates.set(report.reportId, nextCoordinate());
    }
  }
  for (const plan of sitePlans) {
    const sourceCellCoord = expeditionCoordinateFromCellId(plan.sourceCellId);
    const coord = sourceCellCoord || reportCoordinates.get(plan.reportId) || nextCoordinate();
    planCoordinates.set(plan.planId, coord);
    if (plan.reportId && !reportCoordinates.has(plan.reportId)) reportCoordinates.set(plan.reportId, coord);
  }
  for (const claim of settlementClaims) {
    const coord = planCoordinates.get(claim.sitePlanId) || reportCoordinates.get(claim.reportId) || nextCoordinate();
    claimCoordinates.set(claim.claimId, coord);
    if (claim.sitePlanId && !planCoordinates.has(claim.sitePlanId)) planCoordinates.set(claim.sitePlanId, coord);
    if (claim.reportId && !reportCoordinates.has(claim.reportId)) reportCoordinates.set(claim.reportId, coord);
  }

  return { reportCoordinates, planCoordinates, claimCoordinates };
}

function adjacentExpeditionHintCoordinate(coord, index = 0) {
  const directions = EXPEDITION_MAP_RING_COORDINATES.slice(0, 6);
  const direction = directions[Math.max(0, Math.floor(Number(index || 0))) % directions.length];
  return {
    q: Number(coord?.q || 0) + Number(direction.q || 0),
    r: Number(coord?.r || 0) + Number(direction.r || 0)
  };
}

function expeditionCoordinateOccupied(cells, coord) {
  return Array.from(cells.values()).some((cell) => (
    Number(cell.q || 0) === Number(coord?.q || 0)
    && Number(cell.r || 0) === Number(coord?.r || 0)
  ));
}

function openAdjacentExpeditionHintCoordinate(cells, coord, index = 0) {
  for (let offset = 0; offset < 6; offset += 1) {
    const candidate = adjacentExpeditionHintCoordinate(coord, Number(index || 0) + offset);
    if (!cells.has(expeditionCellId(candidate)) && !expeditionCoordinateOccupied(cells, candidate)) return candidate;
  }
  return adjacentExpeditionHintCoordinate(coord, Number(index || 0) + 6);
}

function expeditionSitePlanMapObject(plan = {}, cellId = '') {
  const sourcePacketId = sitePlanPacketSourceId(plan);
  return {
    objectId: `map_object_${safeText(plan.planId, 'site_plan', 160)}`,
    kind: sourcePacketId ? 'packet_site_plan' : 'site_plan',
    planId: safeText(plan.planId, '', 160),
    source: safeText(plan.source, sourcePacketId ? 'scout_sector_event_packet' : 'scout_report', 80),
    sourcePacketId: sourcePacketId || null,
    sourceScoutId: safeText(plan.sourceScoutId, '', 120) || null,
    sourceCellId: safeText(plan.sourceCellId || cellId, '', 80) || null,
    status: safeText(plan.status, 'DRAFT', 80),
    promotionStatus: safeText(plan.promotionStatus, 'draft', 80),
    reviewStatus: safeText(plan.reviewStatus, 'unreviewed', 80),
    planningOnly: true,
    readOnly: true,
    executableActions: [],
    authorityBoundary: safeText(plan.authorityBoundary, 'requires_engine_promotion_for_settlement', 160),
    boundaryFlags: {
      createsSurveyor: false,
      createsConvoy: false,
      createsSettlement: false,
      resourceDelta: {},
      routeCreation: false,
      tradeRouteCreation: false,
      rewardCreation: false,
      backgroundScheduling: false,
      combat: false,
      publicSharing: false,
      generatedUniverseRendering: false,
      hiddenTruthLeakage: false,
      crossPlotMutation: false,
      atlasExecution: false,
      externalEffects: false
    }
  };
}

function expeditionCellFromSitePlan(plot = {}, plan = {}, coord = {}) {
  const reviewed = plan.reviewStatus === 'reviewed' || plan.promotionStatus === 'reviewed_claim_ready';
  const cellId = expeditionCellId(coord);
  return {
    cellId,
    q: coord.q,
    r: coord.r,
    fogState: 'known',
    kind: 'planned_site',
    title: plan.title,
    status: reviewed ? 'SITE_PLAN_REVIEWED' : 'SITE_PLAN_DRAFTED',
    sourceTruth: 'site_plan',
    sourceIds: {
      plotId: plot.plotId || null,
      reportId: plan.reportId,
      planId: plan.planId,
      sourcePacketId: plan.sourcePacketId || null,
      sourceScoutId: plan.sourceScoutId || null,
      sourceCellId: plan.sourceCellId || null
    },
    sources: [{ kind: 'site_plan', id: plan.planId, status: plan.promotionStatus }],
    receipts: [expeditionReceipt(reviewed ? 'reviewed_site_plan_known_cell' : 'draft_site_plan_known_cell', {
      reportId: plan.reportId,
      planId: plan.planId,
      sourcePacketId: plan.sourcePacketId || null
    })],
    traits: plan.traits,
    resourceHints: plan.resourceHints,
    siteType: plan.siteType,
    risk: plan.risk,
    summary: plan.summary,
    recommendedNext: plan.recommendedNext,
    sitePlanObject: expeditionSitePlanMapObject(plan, cellId)
  };
}

function expeditionFogCounts(cells) {
  const counts = {
    discovered: 0,
    known: 0,
    hinted: 0,
    locked_unknown: 0
  };
  for (const cell of cells) {
    counts[cell.fogState] = Number(counts[cell.fogState] || 0) + 1;
  }
  return counts;
}

function expeditionPublicTerrainSlotText(cell = {}) {
  const siteType = safeText(cell.siteType, '', 80).toLowerCase();
  const kind = safeText(cell.kind, '', 80).toLowerCase();
  const status = safeText(cell.status, '', 80).toLowerCase();
  const risk = safeText(cell.risk, '', 80).toLowerCase();
  const traits = Array.isArray(cell.traits)
    ? cell.traits.map((trait) => safeText(trait, '', 60).toLowerCase()).filter(Boolean)
    : [];
  return `${siteType} ${kind} ${status} ${risk} ${traits.join(' ')}`;
}

function cellExposesPublicTerrainAssetSlot(cell = {}) {
  return ['discovered', 'known'].includes(String(cell.fogState || 'locked_unknown'));
}

function expeditionPublicTerrainAssetSlotForCell(cell = {}) {
  if (!cellExposesPublicTerrainAssetSlot(cell)) return null;
  const text = expeditionPublicTerrainSlotText(cell);
  if (/(^|[_\s-])(forest|wood|wooded|woodland|timber)([_\s-]|$)/.test(text)) {
    return {
      slot: 'forest',
      reason: 'known/discovered public cell traits include forest, wood, woodland, or timber'
    };
  }
  if (/(^|[_\s-])(ridge|quarry|stone|rock|outcrop|ruin|signal)([_\s-]|$)/.test(text)) {
    return {
      slot: 'ridge',
      reason: 'known/discovered public cell traits include ridge, quarry, stone, outcrop, ruin, or signal'
    };
  }
  if (/(^|[_\s-])(settled|outpost|home|owned|founders|founded)([_\s-]|$)/.test(text)) {
    return {
      slot: 'settled',
      reason: 'known/discovered public cell traits include owned, home, founded, settled, or outpost status'
    };
  }
  return {
    slot: 'field',
    reason: /(^|[_\s-])(water|river|coast)([_\s-]|$)/.test(text)
      ? 'public terrain falls back to neutral field because water/coast assets are blocked until explicit public water truth exists'
      : 'known/discovered public cell traits expose only neutral field terrain'
  };
}

function expeditionTerrainAssetContractForCell(cell = {}) {
  const fogState = String(cell.fogState || 'locked_unknown');
  const base = {
    terrainAssetContractVersion: EXPEDITION_PUBLIC_TERRAIN_ASSET_CONTRACT_VERSION,
    publicTerrainAssetSlot: null,
    publicTerrainAssetSlotSource: null,
    publicTerrainAssetSlotReason: null,
    fogAssetSlot: null
  };
  if (!cellExposesPublicTerrainAssetSlot(cell)) {
    return {
      ...base,
      fogAssetSlot: EXPEDITION_FOG_ASSET_SLOTS[fogState] || EXPEDITION_FOG_ASSET_SLOTS.locked_unknown,
      publicTerrainAssetSlotReason: 'hidden expedition cell exposes only fog asset slots; no concrete terrain truth is public'
    };
  }
  const slot = expeditionPublicTerrainAssetSlotForCell(cell);
  return {
    ...base,
    publicTerrainAssetSlot: EXPEDITION_PUBLIC_TERRAIN_ASSET_SLOTS.includes(slot?.slot) ? slot.slot : 'field',
    publicTerrainAssetSlotSource: EXPEDITION_PUBLIC_TERRAIN_ASSET_SLOT_SOURCE,
    publicTerrainAssetSlotReason: slot?.reason || 'known/discovered public cell traits expose neutral field terrain'
  };
}

function applyExpeditionTerrainAssetContract(cell = {}) {
  return {
    ...cell,
    ...expeditionTerrainAssetContractForCell(cell)
  };
}

function buildExpeditionMapReadModel(bundle) {
  const plot = bundle?.plot || {};
  const scoutReports = normalizeScoutReports(plot.scoutReports);
  const sitePlans = normalizeSitePlans(plot.sitePlans);
  const expeditionScouts = normalizeExpeditionScouts(plot.expeditionScouts);
  const expeditionUnitMoves = normalizeExpeditionUnitMoves(plot.expeditionUnitMoves);
  const settlementClaims = normalizeSettlementClaims(bundle?.settlementClaims || []);
  const ownedPlots = ownedPlotSummaries(bundle?.ownerPairId || plot.pairId, plot.plotId);
  const worldGrid = worldGridReadModel(bundle);
  const maps = expeditionCoordinateMaps({ scoutReports, sitePlans, settlementClaims });
  const cells = new Map();

  mergeExpeditionCells(cells, {
    cellId: 'cell_origin',
    q: 0,
    r: 0,
    fogState: 'discovered',
    kind: 'origin_plot',
    title: 'Founders Plot',
    status: 'OWNED_HOME',
    sourceTruth: 'founder_plot',
    sourceIds: { plotId: plot.plotId || null },
    sources: [{ kind: 'plot', id: plot.plotId || 'origin', status: plot.status || 'ACTIVE' }],
    receipts: [expeditionReceipt('origin_plot_discovered', { plotId: plot.plotId || null })],
    traits: ['home', 'server-owned'],
    resourceHints: {},
    siteType: 'home_plot',
    risk: 'owned'
  });

  scoutReports.forEach((report, index) => {
    const coord = maps.reportCoordinates.get(report.reportId) || expeditionCoordinateForIndex(index);
    mergeExpeditionCells(cells, {
      cellId: expeditionCellId(coord),
      q: coord.q,
      r: coord.r,
      fogState: 'known',
      kind: 'frontier_site',
      title: report.title,
      status: 'SCOUT_REPORTED',
      sourceTruth: 'scout_report',
      sourceIds: { plotId: plot.plotId || null, reportId: report.reportId },
      sources: [{ kind: 'scout_report', id: report.reportId, status: 'COLLECTED' }],
      receipts: [expeditionReceipt('scout_report_known_cell', { reportId: report.reportId })],
      traits: report.traits,
      resourceHints: report.resourceHints,
      siteType: report.siteType,
      risk: report.risk,
      summary: report.summary,
      recommendedNext: report.recommendedNext
    });
  });

  sitePlans.forEach((plan) => {
    const coord = maps.planCoordinates.get(plan.planId) || maps.reportCoordinates.get(plan.reportId);
    if (!coord) return;
    mergeExpeditionCells(cells, expeditionCellFromSitePlan(plot, plan, coord));
  });

  settlementClaims.forEach((claim) => {
    const coord = maps.claimCoordinates.get(claim.claimId);
    if (!coord) return;
    const founded = claim.status === 'FOUNDED' && !!claim.foundedPlotId;
    mergeExpeditionCells(cells, {
      cellId: expeditionCellId(coord),
      q: coord.q,
      r: coord.r,
      fogState: founded ? 'discovered' : 'known',
      kind: founded ? 'owned_outpost' : 'settlement_claim',
      title: claim.title,
      status: claim.status,
      sourceTruth: 'settlement_claim',
      sourceIds: {
        plotId: claim.foundedPlotId || plot.plotId || null,
        originPlotId: claim.originPlotId,
        reportId: claim.reportId,
        planId: claim.sitePlanId,
        claimId: claim.claimId
      },
      sources: [{ kind: 'settlement_claim', id: claim.claimId, status: claim.status }],
      receipts: [expeditionReceipt(founded ? 'founded_outpost_discovered_cell' : 'settlement_claim_known_cell', {
        claimId: claim.claimId,
        foundedPlotId: claim.foundedPlotId || null
      })],
      traits: claim.traits,
      resourceHints: claim.resourceHints,
      siteType: claim.siteType,
      risk: claim.risk,
      summary: claim.receipt?.summary || ''
    });
  });

  ownedPlots
    .filter((entry) => entry.role !== 'HOME')
    .forEach((entry, index) => {
      const claimCoord = entry.originClaimId ? maps.claimCoordinates.get(entry.originClaimId) : null;
      const coord = claimCoord || expeditionCoordinateForIndex(scoutReports.length + sitePlans.length + settlementClaims.length + index);
      mergeExpeditionCells(cells, {
        cellId: expeditionCellId(coord),
        q: coord.q,
        r: coord.r,
        fogState: 'discovered',
        kind: 'owned_outpost',
        title: entry.title || 'Settler Outpost',
        status: 'OWNED_OUTPOST',
        sourceTruth: 'plot_membership',
        sourceIds: { plotId: entry.plotId, originClaimId: entry.originClaimId || null },
        sources: [{ kind: 'owned_plot', id: entry.plotId, status: entry.role }],
        receipts: [expeditionReceipt('owned_outpost_discovered_cell', {
          plotId: entry.plotId,
          originClaimId: entry.originClaimId || null
        })],
        traits: ['owned-outpost'],
        resourceHints: {},
        siteType: entry.siteType || 'outpost',
        risk: entry.risk || 'owned'
      });
    });

  expeditionScouts.forEach((scout) => {
    mergeExpeditionCells(cells, {
      cellId: scout.cellId,
      q: scout.q,
      r: scout.r,
      fogState: 'known',
      kind: 'scouted_sector',
      title: scout.title,
      status: scout.status,
      sourceTruth: 'expedition_scout_sector',
      sourceIds: {
        plotId: plot.plotId || null,
        scoutId: scout.scoutId,
        cellId: scout.cellId,
        sourceCellId: scout.sourceCellId || null
      },
      sources: [{
        kind: 'expedition_scout_sector',
        id: scout.scoutId,
        status: scout.status
      }],
      receipts: [
        expeditionReceipt('scout_sector_known_cell', {
          scoutId: scout.scoutId,
          cellId: scout.cellId,
          sourceCellId: scout.sourceCellId || null
        }),
        scout.receipt
      ],
      traits: scout.traits,
      resourceHints: scout.resourceHints,
      siteType: scout.siteType,
      risk: scout.risk,
      summary: scout.summary,
      recommendedNext: scout.recommendedNext,
      eventPacket: scout.eventPacket
    });
  });

  sitePlans
    .filter((plan) => plan.source === 'scout_sector_event_packet' || !!plan.sourcePacketId)
    .forEach((plan) => {
      const coord = maps.planCoordinates.get(plan.planId) || expeditionCoordinateFromCellId(plan.sourceCellId);
      if (!coord) return;
      mergeExpeditionCells(cells, expeditionCellFromSitePlan(plot, plan, coord));
    });

  const truthCells = Array.from(cells.values())
    .filter((cell) => cell.fogState === 'known' || cell.fogState === 'discovered')
    .sort((a, b) => a.q - b.q || a.r - b.r || a.cellId.localeCompare(b.cellId));
  truthCells.slice(0, 6).forEach((cell, index) => {
    const coord = openAdjacentExpeditionHintCoordinate(cells, cell, index);
    mergeExpeditionCells(cells, {
      cellId: expeditionCellId(coord),
      q: coord.q,
      r: coord.r,
      fogState: 'hinted',
      kind: 'frontier_hint',
      title: 'Unresolved Frontier Hint',
      status: 'HINTED_BY_KNOWN_FRONTIER',
      sourceTruth: 'derived_hint',
      sourceIds: { adjacentCellId: cell.cellId },
      sources: [{ kind: 'adjacent_fog_hint', id: cell.cellId, status: cell.fogState }],
      receipts: [expeditionReceipt('derived_frontier_hint_cell', { adjacentCellId: cell.cellId })],
      traits: [],
      resourceHints: {},
      siteType: 'unresolved_frontier',
      risk: 'unknown'
    });
  });

  EXPEDITION_MAP_RING_COORDINATES.slice(0, 8).forEach((base, index) => {
    const coord = {
      q: Number(base.q || 0) * 3,
      r: Number(base.r || 0) * 3
    };
    mergeExpeditionCells(cells, {
      cellId: expeditionCellId(coord),
      q: coord.q,
      r: coord.r,
      fogState: 'locked_unknown',
      kind: 'fog_placeholder',
      title: 'Locked Unknown',
      status: 'LOCKED_UNKNOWN',
      sourceTruth: 'fog_placeholder',
      sourceIds: { ring: 3, index },
      sources: [{ kind: 'fog_placeholder', id: `ring3_${index}`, status: 'LOCKED_UNKNOWN' }],
      receipts: [expeditionReceipt('locked_unknown_placeholder_cell', { ring: 3, index })],
      traits: [],
      resourceHints: {},
      siteType: 'unknown',
      risk: 'unknown'
    });
  });

  const cellList = Array.from(cells.values())
    .sort((a, b) => (b.fogState === 'discovered') - (a.fogState === 'discovered')
      || (b.fogState === 'known') - (a.fogState === 'known')
      || (b.fogState === 'hinted') - (a.fogState === 'hinted')
      || a.q - b.q
      || a.r - b.r
      || a.cellId.localeCompare(b.cellId))
    .map(applyExpeditionTerrainAssetContract);
  const eventPackets = expeditionScouts
    .map((scout) => scout.eventPacket)
    .filter((packet) => packet && packet.packetId)
    .sort((a, b) => a.packetId.localeCompare(b.packetId));
  const counts = expeditionFogCounts(cellList);
  const expeditionParty = buildExpeditionPartyManifest({ plotId: plot.plotId || null });
  const units = buildExpeditionUnitRoster({
    plotId: plot.plotId || null,
    expeditionParty,
    cellList,
    eventPackets,
    sitePlans,
    planCoordinates: maps.planCoordinates,
    settlementClaims,
    claimCoordinates: maps.claimCoordinates,
    unitMoves: expeditionUnitMoves
  });
  const reviewablePlanIds = new Set(sitePlans
    .filter((plan) => canReviewSitePlan(bundle, plan))
    .map((plan) => plan.planId));
  const surveyBridge = buildExpeditionSurveyBridgeReadModel({
    plotId: plot.plotId || null,
    eventPackets,
    cellList,
    sitePlans,
    planCoordinates: maps.planCoordinates,
    units,
    reviewablePlanIds
  });
  const baseReadModel = {
    status: scoutReports.length || expeditionScouts.length || sitePlans.length || settlementClaims.length || ownedPlots.length > 1
      ? 'FOG_READ_MODEL_READY'
      : 'ORIGIN_ONLY',
    title: 'Expedition Map',
    implementation: 'hq12a_server_owned_expedition_map_read_model_v1',
    readOnly: true,
    executableActions: [],
    authorityBoundary: EXPEDITION_MAP_AUTHORITY_BOUNDARY,
    fog: {
      states: clone(EXPEDITION_MAP_FOG_STATES),
      semantics: {
        discovered: 'Server-owned plots and founded outposts the player owns.',
        known: 'Collected Scout Reports, canonical Site Plans, and settlement claims grounded in receipts.',
        hinted: 'Adjacency hints derived from known frontier cells; not claimable and not resource truth.',
        locked_unknown: 'Opaque fog placeholders with no gameplay truth, resources, or actions.'
      },
      counts,
      cellsByFogState: {
        discovered: cellList.filter((cell) => cell.fogState === 'discovered').map((cell) => cell.cellId),
        known: cellList.filter((cell) => cell.fogState === 'known').map((cell) => cell.cellId),
        hinted: cellList.filter((cell) => cell.fogState === 'hinted').map((cell) => cell.cellId),
        locked_unknown: cellList.filter((cell) => cell.fogState === 'locked_unknown').map((cell) => cell.cellId)
      }
    },
    scope: {
      homePlotId: ownedPlots.find((entry) => entry.role === 'HOME')?.plotId || plot.plotId || null,
      activePlotId: plot.plotId || null,
      ownedPlotCount: ownedPlots.length,
      scoutReportCount: scoutReports.length,
      scoutedSectorCount: expeditionScouts.length,
      sitePlanCount: sitePlans.length,
      settlementClaimCount: settlementClaims.length
    },
    sourceSummary: {
      originPlotId: plot.plotId || null,
      worldGridStatus: worldGrid.status,
      worldGridProjectionHash: worldGrid.projectionHash || null,
      civicReadinessReady: worldGrid.civicReadiness?.ready === true,
      civicReadinessScore: Number(worldGrid.civicReadiness?.localProjectReadinessScore || 0),
      scoutReportIds: scoutReports.map((report) => report.reportId),
      scoutSectorIds: expeditionScouts.map((scout) => scout.scoutId),
      expeditionUnitMoveIds: expeditionUnitMoves.map((move) => move.moveId),
      eventPacketIds: eventPackets.map((packet) => packet.packetId),
      surveyBridgeCandidatePacketIds: surveyBridge.candidates.map((candidate) => candidate.packetId),
      reviewedSitePlanIds: sitePlans
        .filter((plan) => plan.reviewStatus === 'reviewed' || plan.promotionStatus === 'reviewed_claim_ready')
        .map((plan) => plan.planId),
      foundedPlotIds: settlementClaims
        .filter((claim) => claim.status === 'FOUNDED' && claim.foundedPlotId)
        .map((claim) => claim.foundedPlotId)
        .sort()
    },
    expeditionParty,
    units,
    surveyBridge,
    cells: cellList,
    eventPackets,
    receipt: expeditionReceipt('expedition_map_read_model_projection', {
      plotId: plot.plotId || null,
      worldGridProjectionHash: worldGrid.projectionHash || null
    })
  };
  const projectionHash = hashPayload({
    status: baseReadModel.status,
    fog: baseReadModel.fog,
    scope: baseReadModel.scope,
    sourceSummary: baseReadModel.sourceSummary,
    cells: baseReadModel.cells.map((cell) => ({
      cellId: cell.cellId,
      q: cell.q,
      r: cell.r,
      fogState: cell.fogState,
      kind: cell.kind,
      status: cell.status,
      publicTerrainAssetSlot: cell.publicTerrainAssetSlot || null,
      fogAssetSlot: cell.fogAssetSlot || null,
      terrainAssetContractVersion: cell.terrainAssetContractVersion || null,
      sourceIds: cell.sourceIds,
      sitePlanObject: cell.sitePlanObject ? {
        objectId: cell.sitePlanObject.objectId,
        kind: cell.sitePlanObject.kind,
        planId: cell.sitePlanObject.planId,
        sourcePacketId: cell.sitePlanObject.sourcePacketId || null,
        sourceCellId: cell.sitePlanObject.sourceCellId || null,
        reviewStatus: cell.sitePlanObject.reviewStatus,
        planningOnly: cell.sitePlanObject.planningOnly === true,
        readOnly: cell.sitePlanObject.readOnly === true
      } : null,
      eventPacketId: cell.eventPacket?.packetId || null
    })),
    expeditionParty: {
      partyId: baseReadModel.expeditionParty.partyId,
      version: baseReadModel.expeditionParty.version,
      members: baseReadModel.expeditionParty.members.map((member) => ({
        memberId: member.memberId,
        displayName: member.displayName,
        role: member.role
      })),
      boundaryFlags: baseReadModel.expeditionParty.boundaryFlags
    },
    units: baseReadModel.units.items.map((unit) => ({
      unitId: unit.unitId,
      unitType: unit.unitType,
      role: unit.role,
      state: unit.state,
      cellId: unit.location?.cellId || null,
      q: unit.location?.q ?? null,
      r: unit.location?.r ?? null,
      moveId: unit.lastMove?.moveId || null,
      commandIds: unit.commandHints.map((command) => command.commandId),
      movementMutationImplemented: unit.movement?.movementMutationImplemented === true
    })),
    unitBoundaryFlags: baseReadModel.units.boundaryFlags,
    eventPackets: baseReadModel.eventPackets.map((packet) => ({
      packetId: packet.packetId,
      templateId: packet.templateId,
      scoutId: packet.scoutId,
      cellId: packet.cellId,
      partyId: packet.partyId || null,
      packetHash: packet.packetHash
    })),
    surveyBridge: {
      status: baseReadModel.surveyBridge.status,
      activeCandidateId: baseReadModel.surveyBridge.activeCandidateId,
      activePacketId: baseReadModel.surveyBridge.activePacketId,
      activeCellId: baseReadModel.surveyBridge.activeCellId,
      candidateIds: baseReadModel.surveyBridge.candidates.map((candidate) => candidate.candidateId),
      boundaryFlags: baseReadModel.surveyBridge.boundaryFlags
    }
  }).slice(0, 16);
  return {
    ...baseReadModel,
    expeditionParty: buildExpeditionPartyManifest({
      plotId: plot.plotId || null,
      projectionHash
    }),
    units: {
      ...baseReadModel.units,
      projectionHash
    },
    surveyBridge: {
      ...baseReadModel.surveyBridge,
      sourceProjectionHash: projectionHash
    },
    projectionHash,
    receipt: {
      ...baseReadModel.receipt,
      projectionHash
    }
  };
}

function worldGridReadModel(bundle) {
  const plot = bundle?.plot || {};
  const hqLevel = Math.max(1, Math.floor(Number(plot.hqLevel || 1)));
  const settlementClaims = normalizeSettlementClaims(bundle?.settlementClaims || []);
  const ownedPlots = ownedPlotSummaries(bundle?.ownerPairId || plot.pairId, plot.plotId)
    .map((entry) => ({
      plotId: entry.plotId,
      role: entry.role,
      title: entry.title,
      hqLevel: entry.hqLevel,
      status: entry.status,
      originClaimId: entry.originClaimId || null,
      siteType: entry.siteType || null,
      risk: entry.risk || null,
      active: entry.active === true
    }));
  const sitePlans = normalizeSitePlans(plot.sitePlans);
  const doctrineState = normalizeDoctrineState(plot.doctrineState);
  const cohortPlanner = workOrderPlannerReadModel(bundle);
  const workOrders = normalizeWorkOrders(bundle?.workOrders || []);
  const civicProposals = normalizeCivicProposals(bundle?.civicProposals || []);
  const proposalCounts = civicProposalCounts(civicProposals);
  const reviewedProposalCount = civicProposals.filter((proposal) => proposal.status === 'REVIEWED').length;
  const civicProjects = normalizeCivicProjects(bundle?.civicProjects || []);
  const projectCounts = civicProjectCounts(civicProjects);
  const activeCivicProjects = civicProjects.filter((project) => project.status === 'ACTIVE');
  const activeCivicBeaconCount = activeCivicProjects.filter((project) => project.projectType === 'civic_beacon').length;
  const civicProjectInspection = civicProjectInspectionStats(activeCivicProjects);
  const localProjectReadinessScore = Math.min(2, Math.min(1, activeCivicBeaconCount) + Math.min(1, civicProjectInspection.baselineInspectedCount));
  const civicMoraleMarkers = [
    ...(activeCivicBeaconCount > 0 ? ['civic_beacon_lit'] : []),
    ...(civicProjectInspection.baselineInspectedCount > 0 ? ['civic_beacon_inspected'] : [])
  ];
  const outpostCount = settlementClaims.filter((claim) => claim.status === 'FOUNDED' && claim.foundedPlotId).length;
  const activeConvoyCount = settlementClaims.filter((claim) => claim.status === 'CONVOY_PREPARING').length;
  const claimReadyPlanCount = sitePlans.filter((plan) => (
    plan.reviewStatus === 'reviewed'
    || ['reviewed_claim_ready', 'convoy_preparing', 'claimed'].includes(plan.promotionStatus)
  )).length;
  const requirements = [
    {
      key: 'hq.level.6',
      label: 'HQ6 Settlement Charter',
      satisfied: hqLevel >= 6,
      current: hqLevel,
      required: 6
    },
    {
      key: 'settlement.outpost.founded',
      label: 'Founded outpost',
      satisfied: outpostCount > 0,
      current: outpostCount,
      required: 1
    },
    {
      key: 'doctrine.survey_discipline.selected',
      label: 'Survey Discipline selected',
      satisfied: doctrineState.selectedDoctrineId === 'survey_discipline' && doctrineState.status === 'SELECTED',
      current: doctrineState.selectedDoctrineId,
      required: 'survey_discipline'
    },
    {
      key: 'work_order.collect_ready_outputs_once.available',
      label: 'Collect-ready work-order executor available',
      satisfied: cohortPlanner.executionAvailable === true,
      current: cohortPlanner.executionAvailable === true,
      required: true
    }
  ];
  const blockedBy = requirements.filter((entry) => !entry.satisfied).map((entry) => entry.key);
  const ready = blockedBy.length === 0;
  const readModel = {
    status: ready ? 'READ_MODEL_READY' : 'LOCKED',
    title: 'World Grid',
    implementation: 'hq10a_server_owned_world_grid_read_model_v1',
    readOnly: true,
    executableActions: [],
    authorityBoundary: 'server_owned_read_only_world_grid_projection_no_civic_mutation_v1',
    requirements: {
      items: requirements,
      blockedBy,
      satisfiedCount: requirements.length - blockedBy.length,
      totalCount: requirements.length
    },
    scope: {
      homePlotId: ownedPlots.find((entry) => entry.role === 'HOME')?.plotId || plot.plotId || null,
      activePlotId: plot.plotId || null,
      knownPlotCount: ownedPlots.length,
      outpostCount,
      knownClaimCount: settlementClaims.length
    },
    plots: ownedPlots,
    claims: {
      total: settlementClaims.length,
      byStatus: countByField(settlementClaims, 'status'),
      claimReadyPlanCount,
      activeConvoyCount,
      foundedOutpostCount: outpostCount,
      foundedPlotIds: settlementClaims
        .filter((claim) => claim.status === 'FOUNDED' && claim.foundedPlotId)
        .map((claim) => claim.foundedPlotId)
        .sort()
    },
    doctrine: {
      selectedDoctrineId: doctrineState.selectedDoctrineId,
      status: doctrineState.status,
      activeEffects: researchReadModel(bundle).activeEffects
    },
    workOrders: {
      draftCount: workOrders.filter((order) => order.status === 'DRAFT').length,
      completedCount: workOrders.filter((order) => order.status === 'COMPLETED').length,
      executionAvailable: cohortPlanner.executionAvailable === true,
      templateIds: cohortPlanner.templates.map((template) => template.templateId).sort()
    },
    civicProposals: {
      proposalOnly: true,
      executionAllowed: false,
      authorityBoundary: CIVIC_PROPOSAL_AUTHORITY_BOUNDARY,
      total: civicProposals.length,
      byStatus: proposalCounts,
      latestProposalId: civicProposals[civicProposals.length - 1]?.proposalId || null
    },
    civicProjects: {
      publicWork: true,
      activationAllowed: ready && reviewedProposalCount > 0,
      authorityBoundary: CIVIC_PROJECT_AUTHORITY_BOUNDARY,
      total: civicProjects.length,
      activeCount: projectCounts.byStatus.ACTIVE,
      byStatus: projectCounts.byStatus,
      byType: projectCounts.byType,
      localCivicBeaconActive: activeCivicBeaconCount > 0,
      localReadinessDelta: Math.min(1, activeCivicBeaconCount),
      inspectionAuthorityBoundary: CIVIC_PROJECT_INSPECTION_AUTHORITY_BOUNDARY,
      baselineInspectedCount: civicProjectInspection.baselineInspectedCount,
      inspectionCount: civicProjectInspection.totalInspectionCount,
      latestInspectedAt: civicProjectInspection.latestInspectedAt,
      inspectionReadinessDelta: Math.min(1, civicProjectInspection.baselineInspectedCount),
      latestProjectId: civicProjects[civicProjects.length - 1]?.projectId || null
    },
    civicReadiness: {
      ready,
      nextPromotableSlice: ready
        ? activeCivicBeaconCount > 0
          ? 'HQ10D_CIVIC_PROJECT_ACTIVE'
          : reviewedProposalCount > 0
            ? 'HQ10D_CIVIC_PROJECT_ACTIVATION'
            : 'HQ10B_CIVIC_PROPOSAL_RECORDS'
        : null,
      blockedBy,
      localProjectReadinessScore,
      moraleMarkers: civicMoraleMarkers,
      signals: [
        { key: 'multi_plot_visibility', ready: ownedPlots.length > 1 || outpostCount > 0, value: ownedPlots.length },
        { key: 'claim_receipts', ready: settlementClaims.length > 0, value: settlementClaims.length },
        { key: 'doctrine_context', ready: !!doctrineState.selectedDoctrineId, value: doctrineState.selectedDoctrineId },
        { key: 'bounded_work_orders', ready: cohortPlanner.executionAvailable === true, value: cohortPlanner.executionAvailable === true },
        { key: 'local_civic_beacon', ready: activeCivicBeaconCount > 0, value: activeCivicBeaconCount },
        { key: 'civic_project_baseline_inspection', ready: civicProjectInspection.baselineInspectedCount > 0, value: civicProjectInspection.baselineInspectedCount }
      ],
      boundedCapabilities: [
        'local_civic_beacon_activation',
        'current_plot_civic_project_inspection'
      ],
      prohibitedCapabilities: [
        'civic_mutation',
        'trade_routes',
        'background_scheduling',
        'arbitrary_tool_execution',
        'resource_spending',
        'atlas_owned_execution',
        'external_or_public_effects'
      ]
    }
  };
  return {
    ...readModel,
    projectionHash: hashPayload({
      status: readModel.status,
      scope: readModel.scope,
      claims: readModel.claims,
      doctrine: readModel.doctrine,
      workOrders: readModel.workOrders,
      civicProposals: readModel.civicProposals,
      civicProjects: readModel.civicProjects,
      blockedBy
    }).slice(0, 16)
  };
}

function workOrderScopeForTemplate(bundle, template, scope = {}) {
  const rawIds = Array.isArray(scope?.buildingIds) ? scope.buildingIds : [];
  const known = new Set(bundle.buildings.map((building) => building.buildingId));
  const buildingIds = Array.from(new Set(rawIds
    .map((id) => safeText(id, '', 120))
    .filter(Boolean)
    .filter((id) => known.has(id))))
    .slice(0, Number(template.caps?.maxChildActions || 2));
  if (rawIds.length && !buildingIds.length) {
    return {
      ok: false,
      error: errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'Work order scope must reference buildings on the current plot.', false, {
        reason: 'unknown_building_scope'
      })
    };
  }
  return {
    ok: true,
    scope: {
      mode: buildingIds.length ? 'selected_buildings' : 'all_ready_outputs',
      plotId: bundle.plot.plotId,
      buildingIds,
      targetState: 'OUTPUT_READY',
      maxBuildings: Number(template.caps?.maxChildActions || 2)
    }
  };
}

function workOrderTemplateForExecution(workOrder) {
  const templateId = safeText(workOrder?.templateId, '', 120).toLowerCase();
  if (templateId !== 'collect_ready_outputs_once') return null;
  return WORK_ORDER_TEMPLATES.collect_ready_outputs_once;
}

function workOrderAllowedActionsAreSafe(workOrder, template) {
  const orderActions = Array.isArray(workOrder?.allowedActions) ? workOrder.allowedActions : [];
  const templateActions = Array.isArray(template?.allowedActions) ? template.allowedActions : [];
  if (orderActions.length !== templateActions.length) return false;
  return templateActions.every((action, index) => orderActions[index] === action);
}

function workOrderReadyBuildings(bundle, workOrder, template) {
  const maxChildren = Math.max(0, Math.min(2, Number(template?.caps?.maxChildActions || 2)));
  const scopedPlotId = safeText(workOrder?.scope?.plotId, '', 120);
  if (scopedPlotId && scopedPlotId !== bundle.plot.plotId) return [];
  const selectedIds = Array.isArray(workOrder?.scope?.buildingIds)
    ? Array.from(new Set(workOrder.scope.buildingIds.map((id) => safeText(id, '', 120)).filter(Boolean)))
    : [];
  const byId = new Map(bundle.buildings.map((building) => [building.buildingId, building]));
  const candidates = selectedIds.length
    ? selectedIds.map((id) => byId.get(id)).filter(Boolean)
    : [...bundle.buildings].sort((a, b) => String(a.buildingId).localeCompare(String(b.buildingId)));
  return candidates
    .filter((building) => building.plotId === bundle.plot.plotId)
    .filter((building) => building.state === 'OUTPUT_READY')
    .slice(0, maxChildren);
}

function pendingAgentActionCountLastHour(pendingEvents, nowMs) {
  return (Array.isArray(pendingEvents) ? pendingEvents : [])
    .filter((event) => event.eventType === 'AGENT_ACTION_EXECUTED')
    .filter((event) => Number(event.createdAt || 0) >= (nowMs - 60 * 60 * 1000))
    .length;
}

function assertAgentPolicyForWorkOrderChild(bundle, pendingEvents, { nowMs, actionName }) {
  const denied = assertAgentPolicy(bundle, 'collectOutputs', {
    nowMs,
    actionName,
    retryableMessage: 'Work-order output collection requires the collectOutputs policy toggle and approval discipline.'
  });
  if (denied) return denied;
  const recentActions = countAgentActionsLastHour(bundle, nowMs) + pendingAgentActionCountLastHour(pendingEvents, nowMs);
  if (recentActions >= Number(bundle.policy.maxAutonomousActionsPerHour || 0)) {
    return errorEnvelope(bundle.plot.plotId, 'RATE_LIMITED', 'Agent hourly action cap reached for this plot.', true, {
      reason: 'hourly_cap'
    });
  }
  return null;
}

function collectReadyOutputForWorkOrder(bundle, building, {
  actor,
  nowMs,
  pendingEvents,
  parentWorkOrderId,
  childIdempotencyKey
}) {
  let collected = {};
  if (building.type === 'WORKSHOP') {
    const buffPct = Number(BUILDING_DEFS.WORKSHOP.produces(building.level).buffPct || 20);
    bundle.plot.nextBuildBuffPct = buffPct;
    collected = { construction_buff_pct: buffPct };
    building.outputBuffer = {};
  } else if (building.type === 'EXPEDITION_BOARD') {
    collected = collectScoutReport(bundle, building, nowMs);
  } else {
    const transfer = addResourcesWithCaps(bundle.plot.inventory, building.outputBuffer || {}, bundle.plot.storageCaps);
    bundle.plot.inventory = transfer.inventory;
    building.outputBuffer = transfer.remainder;
    collected = transfer.applied;
  }
  const stillBuffered = RESOURCE_KEYS.some((key) => Number(building.outputBuffer?.[key] || 0) > 0)
    || !!building.outputBuffer?.scoutReport;
  building.state = stillBuffered ? 'OUTPUT_READY' : 'READY';
  building.updatedAt = nowMs;
  const completedJob = bundle.jobs
    .filter((job) => job.buildingId === building.buildingId && job.status === 'COMPLETED')
    .sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0))[0];
  if (completedJob && building.state === 'READY') {
    completedJob.status = 'CLAIMED';
    completedJob.updatedAt = nowMs;
  }
  const firstCollect = !(bundle.plot.collectedBuildingTypes || []).includes(building.type);
  bundle.plot.collectedBuildingTypes = includesOnce(bundle.plot.collectedBuildingTypes, building.type);
  if (firstCollect) addTownXp(bundle.plot, 5);
  createEvent(pendingEvents, {
    plotId: bundle.plot.plotId,
    eventType: 'OUTPUT_COLLECTED',
    actor,
    buildingId: building.buildingId,
    jobId: completedJob?.jobId || null,
    summary: building.type === 'WORKSHOP'
      ? `Workshop output collected. The next construction now has a ${bundle.plot.nextBuildBuffPct}% speed buff.`
      : building.type === 'EXPEDITION_BOARD'
        ? `Scout report collected: ${collected.report?.title || 'nearby site report'}.`
        : `${BUILDING_LABELS[building.type]} outputs were collected.`,
    explanation: actor === 'AGENT'
      ? 'The foreman collected finished outputs through an approved bounded work order.'
      : 'Collected through an explicit bounded cohort work order.',
    data: {
      collected: clone(collected),
      parentWorkOrderId,
      childIdempotencyKey
    },
    createdAt: nowMs
  });
  if (actor === 'AGENT') {
    markAgentAction(bundle, pendingEvents, 'collect_outputs', 'Foreman collected finished outputs from an approved work order.', nowMs, 'collectOutputs');
  }
  return {
    receiptId: `${parentWorkOrderId}:child:${building.buildingId}`,
    parentWorkOrderId,
    childAction: 'et.plot.collect_outputs',
    childIdempotencyKey,
    plotId: bundle.plot.plotId,
    buildingId: building.buildingId,
    buildingType: building.type,
    collected: clone(collected),
    completedJobId: completedJob?.jobId || null,
    statusAfter: building.state,
    executedBy: actor,
    executedAt: nowMs,
    authorityBoundary: 'server_owned_child_collect_outputs_same_plot_no_spend'
  };
}

function buildSitePlanFromReport(bundle, report, input = {}, nowMs) {
  const existingPlans = normalizeSitePlans(bundle.plot.sitePlans);
  const sequence = existingPlans.length + 1;
  const focus = sitePlanFocus(input.focus);
  const reportSlug = slugFor(report.reportId || report.title, `report_${sequence}`);
  const focusLabels = {
    balanced: 'balanced settlement',
    resource: 'resource outpost',
    safe: 'low-risk foothold',
    trade: 'trade waypoint'
  };
  const title = safeText(input.title, `${report.title || 'Scout Report'} Site Plan`, 120);
  const focusLabel = focusLabels[focus] || focusLabels.balanced;
  return {
    planId: `site_plan_${reportSlug}`,
    reportId: report.reportId,
    originPlotId: bundle.plot.plotId,
    title,
    focus,
    status: 'DRAFT',
    promotionStatus: 'draft',
    reviewStatus: 'unreviewed',
    source: 'scout_report',
    authorityBoundary: 'requires_engine_promotion_for_settlement',
    siteType: report.siteType,
    risk: report.risk,
    traits: clone(report.traits || []),
    resourceHints: clone(report.resourceHints || {}),
    summary: `Draft ${focusLabel} from ${report.title}. ${report.summary || 'The report is preserved as the planning receipt.'}`.slice(0, 320),
    recommendedNext: 'Compare in the Progression Atlas, then promote only after second-settlement rules, costs, and tools exist.',
    reviewedAt: null,
    reviewNote: '',
    sequence,
    createdAt: Number(nowMs)
  };
}

function buildSitePlanFromExpeditionPacket(bundle, packet, cell, input = {}, nowMs) {
  const existingPlans = normalizeSitePlans(bundle.plot.sitePlans);
  const sequence = existingPlans.length + 1;
  const focus = sitePlanFocus(input.focus);
  const packetId = safeText(packet?.packetId, `packet_${sequence}`, 160);
  const cellId = safeText(packet?.cellId || packet?.receiptLink?.cellId || cell?.cellId, '', 80);
  const packetSlug = slugFor(packetId || cellId, `packet_${sequence}`);
  const focusLabels = {
    balanced: 'balanced packet plan',
    resource: 'resource survey preflight',
    safe: 'low-risk survey preflight',
    trade: 'waypoint survey preflight'
  };
  const title = safeText(input.title, `${cell?.title || 'Scout Sector'} Site Plan`, 120);
  const focusLabel = focusLabels[focus] || focusLabels.balanced;
  return {
    planId: `site_plan_${packetSlug}`,
    reportId: packetId,
    originPlotId: bundle.plot.plotId,
    title,
    focus,
    status: 'DRAFT',
    promotionStatus: 'draft',
    reviewStatus: 'unreviewed',
    source: 'scout_sector_event_packet',
    authorityBoundary: EXPEDITION_PACKET_SITE_PLAN_AUTHORITY_BOUNDARY,
    siteType: safeText(cell?.siteType, 'scouted_frontier', 80),
    risk: safeText(cell?.risk, 'unknown', 40),
    traits: Array.from(new Set([
      ...(Array.isArray(cell?.traits) ? cell.traits : []),
      'packet-grounded',
      'planning-only'
    ])).slice(0, 8),
    resourceHints: {},
    summary: `Draft ${focusLabel} from Scout Sector packet ${packetId}. ${(packet?.operatorNote || cell?.summary || 'The packet is preserved as the planning receipt.')}`.slice(0, 320),
    recommendedNext: 'Review the Site Plan before any Surveyor command; no route, resource, reward, or territory exists from this draft.',
    reviewedAt: null,
    reviewNote: '',
    sourcePacketId: packetId,
    sourceScoutId: safeText(packet?.scoutId || packet?.receiptLink?.scoutId, '', 120),
    sourceCellId: cellId,
    sourceReceiptKind: safeText(packet?.receiptLink?.kind, 'scout_sector_receipt', 80),
    sourceActionName: safeText(packet?.receiptLink?.actionName, 'et.plot.scout_sector', 120),
    sourceBridgeVersion: EXPEDITION_PACKET_SITE_PLAN_VERSION,
    sequence,
    createdAt: Number(nowMs)
  };
}

function sitePlanPacketSourceId(plan = {}) {
  return safeText(plan.sourcePacketId || (plan.source === 'scout_sector_event_packet' ? plan.reportId : ''), '', 160);
}

function expeditionScoutPacketIds(bundle) {
  return new Set(normalizeExpeditionScouts(bundle?.plot?.expeditionScouts)
    .map((scout) => scout.eventPacket?.packetId)
    .filter(Boolean));
}

function sitePlanGroundingStatus(bundle, plan = {}) {
  const reportIds = new Set(normalizeScoutReports(bundle?.plot?.scoutReports).map((report) => report.reportId));
  if (reportIds.has(plan.reportId)) {
    return { ok: true, source: 'scout_report', id: plan.reportId };
  }
  const packetId = sitePlanPacketSourceId(plan);
  if (packetId && expeditionScoutPacketIds(bundle).has(packetId)) {
    return { ok: true, source: 'scout_sector_event_packet', id: packetId };
  }
  return {
    ok: false,
    source: packetId ? 'missing_scout_packet' : 'missing_scout_report',
    id: packetId || plan.reportId || null
  };
}

function canReviewSitePlan(bundle, plan = {}) {
  if (!plan || !plan.planId) return false;
  if (Number(bundle?.plot?.hqLevel || 1) < 6) return false;
  if (plan.reviewStatus === 'reviewed' || plan.promotionStatus === 'reviewed_claim_ready') return false;
  return sitePlanGroundingStatus(bundle, plan).ok === true;
}

function expeditionSurveyBridgeCandidateForPacket(expeditionMap = {}, packetId = '') {
  const bridge = expeditionMap?.surveyBridge && typeof expeditionMap.surveyBridge === 'object'
    ? expeditionMap.surveyBridge
    : {};
  const safePacketId = safeText(packetId, '', 160);
  const candidates = Array.isArray(bridge.candidates) ? bridge.candidates : [];
  if (safePacketId) {
    return candidates.find((candidate) => candidate?.packetId === safePacketId)
      || (bridge.activeCandidate?.packetId === safePacketId ? bridge.activeCandidate : null)
      || null;
  }
  return bridge.activeCandidate || candidates[0] || null;
}

function buildPacketSitePlanProof({ beforeMap, afterMap, sitePlansBefore = [], sitePlansAfter = [], packet, cell, sitePlan, existing = false }) {
  const beforePlanIds = new Set(sitePlansBefore.map((plan) => plan.planId));
  const afterPlanIds = new Set(sitePlansAfter.map((plan) => plan.planId));
  return {
    actionName: 'et.plot.draft_site_plan_from_packet',
    version: EXPEDITION_PACKET_SITE_PLAN_VERSION,
    plotId: sitePlan.originPlotId || packet?.plotId || null,
    packetId: packet?.packetId || sitePlan.sourcePacketId || null,
    scoutId: packet?.scoutId || sitePlan.sourceScoutId || null,
    cellId: cell?.cellId || sitePlan.sourceCellId || null,
    sitePlanId: sitePlan.planId,
    sourceActionName: packet?.receiptLink?.actionName || sitePlan.sourceActionName || null,
    existing,
    beforeProjectionHash: beforeMap?.projectionHash || null,
    afterProjectionHash: afterMap?.projectionHash || null,
    beforeSitePlanCount: Number(beforeMap?.scope?.sitePlanCount || 0),
    afterSitePlanCount: Number(afterMap?.scope?.sitePlanCount || 0),
    newSitePlanIds: Array.from(afterPlanIds).filter((planId) => !beforePlanIds.has(planId)).sort(),
    sitePlanReviewStatus: sitePlan.reviewStatus,
    createsSurveyor: false,
    createsSettlementClaim: false,
    inventoryMutation: false,
    routeCreation: false,
    resourceDelta: {},
    atlasExecution: false,
    externalEffects: false,
    hiddenTruthLeakage: false,
    boundaryFlags: expeditionPacketSitePlanBoundaryFlags()
  };
}

function normalizeSettlementClaims(value) {
  const rows = Array.isArray(value) ? value : [];
  return rows
    .filter((row) => row && typeof row === 'object')
    .map((row) => ({
      claimId: safeText(row.claimId, '', 120),
      ownerPairId: safeText(row.ownerPairId, '', 160),
      originPlotId: safeText(row.originPlotId, '', 120),
      sitePlanId: safeText(row.sitePlanId, '', 120),
      reportId: safeText(row.reportId, '', 120),
      foundedPlotId: safeText(row.foundedPlotId, '', 120) || null,
      convoyJobId: safeText(row.convoyJobId, '', 120) || null,
      approvalId: safeText(row.approvalId, '', 120) || null,
      status: safeText(row.status, 'CLAIM_READY', 40).toUpperCase(),
      title: safeText(row.title, 'Settlement Claim', 120),
      focus: sitePlanFocus(row.focus),
      siteType: safeText(row.siteType, 'nearby_site', 80),
      risk: safeText(row.risk, 'unknown', 40),
      traits: Array.isArray(row.traits) ? row.traits.map((item) => safeText(item, '', 48)).filter(Boolean).slice(0, 8) : [],
      resourceHints: normalizeInventory(row.resourceHints || {}),
      route: row.route && typeof row.route === 'object' ? clone(row.route) : {},
      cost: normalizeInventory(row.cost || {}),
      receipt: row.receipt && typeof row.receipt === 'object' ? clone(row.receipt) : {},
      createdBy: mutationActor(row.createdBy || 'HUMAN'),
      createdAt: Number(row.createdAt || 0),
      updatedAt: Number(row.updatedAt || 0),
      convoyStartedAt: row.convoyStartedAt == null ? null : Number(row.convoyStartedAt),
      convoyEndsAt: row.convoyEndsAt == null ? null : Number(row.convoyEndsAt),
      foundedAt: row.foundedAt == null ? null : Number(row.foundedAt)
    }))
    .filter((claim) => claim.claimId && claim.ownerPairId && claim.originPlotId && claim.sitePlanId);
}

function buildScoutReport(bundle, building, nowMs) {
  const existing = normalizeScoutReports(bundle.plot.scoutReports);
  const sequence = existing.length + 1;
  const template = SCOUT_REPORT_TEMPLATES[(sequence - 1) % SCOUT_REPORT_TEMPLATES.length];
  return {
    reportId: `scout_report_${sequence}_${template.templateId}`,
    originPlotId: bundle.plot.plotId,
    sourceBuildingId: building.buildingId,
    title: template.title,
    siteType: template.siteType,
    risk: template.risk,
    traits: clone(template.traits),
    resourceHints: clone(template.resourceHints),
    summary: template.summary,
    recommendedNext: template.recommendedNext,
    sequence,
    createdAt: Number(nowMs)
  };
}

function normalizeStorageCaps(value) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    wood: Math.max(0, Math.floor(Number(source.wood || 0))),
    stone: Math.max(0, Math.floor(Number(source.stone || 0))),
    food: Math.max(0, Math.floor(Number(source.food || 0)))
  };
}

function inventoryHasAtLeast(inventory, cost) {
  const bag = normalizeInventory(inventory);
  const needed = normalizeInventory(cost);
  return RESOURCE_KEYS.every((key) => bag[key] >= needed[key]);
}

function resourceShortfall(inventory, cost) {
  const bag = normalizeInventory(inventory);
  const needed = normalizeInventory(cost);
  const missing = {};
  for (const key of RESOURCE_KEYS) {
    const gap = Math.max(0, needed[key] - bag[key]);
    if (gap > 0) missing[key] = gap;
  }
  return missing;
}

function formatRequirementProgress(bundle, { cost = {}, xpRequired = null } = {}) {
  const parts = [];
  const inventory = normalizeInventory(bundle.plot.inventory);
  const required = normalizeInventory(cost);
  for (const key of RESOURCE_KEYS) {
    if (!required[key]) continue;
    const have = inventory[key];
    const need = required[key];
    const missing = Math.max(0, need - have);
    parts.push(`${key}: ${have}/${need}${missing > 0 ? `, need ${missing}` : ''}`);
  }
  if (xpRequired != null) {
    const haveXp = Math.max(0, Math.floor(Number(bundle.plot.townXp || 0)));
    const needXp = Math.max(0, Math.floor(Number(xpRequired || 0)));
    const missingXp = Math.max(0, needXp - haveXp);
    parts.push(`XP: ${haveXp}/${needXp}${missingXp > 0 ? `, need ${missingXp}` : ''}`);
  }
  return parts.length ? parts.join('; ') : 'No cost.';
}

function canAffordProgression(bundle, { cost = {}, xpRequired = null } = {}) {
  const missing = resourceShortfall(bundle.plot.inventory, cost);
  const missingXp = xpRequired == null
    ? 0
    : Math.max(0, Number(xpRequired || 0) - Number(bundle.plot.townXp || 0));
  return Object.keys(missing).length === 0 && missingXp === 0;
}

function normalizeBuildingPrerequisites(rule) {
  return (Array.isArray(rule?.buildingPrerequisites) ? rule.buildingPrerequisites : [])
    .map((entry) => ({
      type: String(entry?.type || '').trim().toUpperCase(),
      requiredState: String(entry?.requiredState || 'READY').trim().toUpperCase() || 'READY'
    }))
    .filter((entry) => entry.type);
}

function hqBuildingPrerequisiteStatus(bundle, rule) {
  return normalizeBuildingPrerequisites(rule).map((entry) => {
    const building = (bundle?.buildings || []).find((candidate) => candidate.type === entry.type) || null;
    const state = building?.state || null;
    const satisfied = !!building && state === entry.requiredState;
    return {
      type: entry.type,
      label: BUILDING_LABELS[entry.type] || entry.type,
      requiredState: entry.requiredState,
      buildingId: building?.buildingId || null,
      state,
      satisfied,
      reason: satisfied ? null : building ? 'building_not_ready' : 'missing_building'
    };
  });
}

function hqUpgradeReadModel(bundle) {
  const rule = HQ_UPGRADE_RULES[bundle.plot.hqLevel] || null;
  if (!rule) return null;
  const prerequisiteStatus = hqBuildingPrerequisiteStatus(bundle, rule);
  const missingPrerequisites = prerequisiteStatus.filter((entry) => !entry.satisfied);
  const missingResources = resourceShortfall(bundle.plot.inventory, rule.cost || {});
  const missingXp = Math.max(0, Number(rule.xpRequired || 0) - Number(bundle.plot.townXp || 0));
  return {
    ...clone(rule),
    buildingPrerequisites: prerequisiteStatus,
    missingBuildingPrerequisites: missingPrerequisites,
    prerequisitesSatisfied: missingPrerequisites.length === 0,
    canStart: missingPrerequisites.length === 0
      && Object.keys(missingResources).length === 0
      && missingXp === 0
  };
}

function deductResources(inventory, cost) {
  const bag = normalizeInventory(inventory);
  const needed = normalizeInventory(cost);
  if (!inventoryHasAtLeast(bag, needed)) return { ok: false, inventory: bag };
  for (const key of RESOURCE_KEYS) {
    bag[key] -= needed[key];
  }
  return { ok: true, inventory: bag };
}

function addResourcesWithCaps(inventory, delta, storageCaps) {
  const next = normalizeInventory(inventory);
  const applied = zeroInventory();
  const remainder = zeroInventory();
  const caps = normalizeStorageCaps(storageCaps);
  const incoming = normalizeInventory(delta);

  for (const key of RESOURCE_KEYS) {
    if (!incoming[key]) continue;
    if (key === 'coin') {
      next.coin += incoming.coin;
      applied.coin += incoming.coin;
      continue;
    }
    const cap = Number(caps[key] || 0);
    const available = Math.max(0, cap - next[key]);
    const transfer = Math.max(0, Math.min(available, incoming[key]));
    next[key] += transfer;
    applied[key] += transfer;
    remainder[key] += incoming[key] - transfer;
  }

  return { inventory: next, applied, remainder };
}

function addTownXp(plot, amount) {
  plot.townXp = Math.max(0, Number(plot.townXp || 0) + Math.max(0, Number(amount || 0)));
}

function includesOnce(list, value) {
  const out = Array.isArray(list) ? [...list] : [];
  if (!out.includes(value)) out.push(value);
  return out;
}

function errorEnvelope(plotId, code, message, retryable = false, details = {}) {
  return {
    ok: false,
    plotId: plotId || null,
    worldDelta: [],
    error: {
      code,
      message,
      retryable: !!retryable,
      details
    }
  };
}

function successEnvelope({ plotId, worldDelta = [], state = null, stateHash = null, recap = null, extras = {} }) {
  return {
    ok: true,
    plotId: plotId || null,
    worldDelta,
    error: null,
    ...(state ? { state } : {}),
    ...(stateHash ? { stateHash } : {}),
    ...(recap ? { recap } : {}),
    ...extras
  };
}

function makeWorldDelta(type, summary, target = null) {
  return {
    type: String(type || 'STATE_CHANGED'),
    target: target || null,
    summary: String(summary || '')
  };
}

function padAt(x, y) {
  return PADS.find((pad) => pad.x === Number(x) && pad.y === Number(y)) || null;
}

function unlockedBuildingsForHq(hqLevel) {
  const out = new Set(['HQ']);
  for (const [level, row] of Object.entries(HQ_LEVEL_RULES)) {
    if (Number(level) > Number(hqLevel)) continue;
    for (const buildingType of row.unlocks || []) out.add(buildingType);
  }
  return Array.from(out);
}

function policyAvailabilityForHq(hqLevel) {
  return {
    observeAndSuggest: Number(hqLevel) >= 1,
    collectOutputs: Number(hqLevel) >= 2,
    queueProduction: Number(hqLevel) >= 3,
    setPriority: Number(hqLevel) >= 4,
    sellSurplusFood: Number(hqLevel) >= 5
  };
}

function defaultPolicy(plotId, nowMs) {
  return {
    plotId,
    observeAndSuggest: true,
    collectOutputs: false,
    queueProduction: false,
    setPriority: false,
    sellSurplusFood: false,
    sellDailyCoinCap: 15,
    maxAutonomousActionsPerHour: 12,
    emergencyPause: false,
    updatedAt: nowMs
  };
}

function initialPlotForIdentity({ pairId, houseId = null, nowMs }) {
  const plotId = `plot_${hashPayload({ pairId }).slice(0, 16)}`;
  const plot = {
    plotId,
    pairId,
    houseId: houseId || null,
    status: 'ACTIVE',
    hqLevel: 1,
    townXp: 0,
    inventory: { wood: 0, stone: 0, food: 0, coin: 20 },
    storageCaps: clone(HQ_LEVEL_RULES[1].storageCaps),
    constructionSlots: HQ_LEVEL_RULES[1].constructionSlots,
    nextBuildBuffPct: 0,
    claimedRewards: [],
	    seenBuildingTypes: ['HQ'],
	    collectedBuildingTypes: [],
	    agentTiersXpAwarded: [],
	    scoutReports: [],
	    sitePlans: [],
	    doctrineState: {},
	    expeditionScouts: [],
	    expeditionUnitMoves: [],
	    lastDailyBonusDay: null,
    dailySoldCoin: 0,
    dailySellDay: nowDayKey(nowMs),
    lastViewedAt: nowMs,
    pendingRecapFrom: null,
    pendingRecapTo: null,
    createdAt: nowMs,
    updatedAt: nowMs,
    lastSimulatedAt: nowMs
  };
  const hq = {
    buildingId: `bldg_hq_${plotId.slice(-8)}`,
    plotId,
    objectInstanceId: null,
    type: 'HQ',
    level: 1,
    x: 1,
    y: 0,
    state: 'READY',
    outputBuffer: {},
    priority: 'BALANCED',
    createdAt: nowMs,
    updatedAt: nowMs
  };
  return { plot, buildings: [hq], policy: defaultPolicy(plotId, nowMs) };
}

function bundleSnapshot(bundle) {
  return {
    plot: clone(bundle.plot),
    policy: clone(bundle.policy),
    buildings: clone(bundle.buildings),
    jobs: clone(bundle.jobs),
    approvals: clone(bundle.approvals || []),
    settlementClaims: clone(bundle.settlementClaims || []),
    plotMemberships: clone(bundle.memberships || []),
    workOrders: clone(bundle.workOrders || []),
    civicProposals: clone(bundle.civicProposals || []),
    overlayPacks: clone(bundle.overlayPacks || []),
    civicProjects: clone(bundle.civicProjects || [])
  };
}

function ensureHomeMembership(pairId, plotId, nowMs) {
  const safePairId = safeText(pairId, '', 180);
  const safePlotId = safeText(plotId, '', 120);
  if (!safePairId || !safePlotId) return null;
  const existing = store.getPlotMembership(safePairId, safePlotId);
  if (existing) return existing;
  return store.writePlotMembership({
    pairId: safePairId,
    plotId: safePlotId,
    role: 'HOME',
    originClaimId: null,
    createdAt: nowMs,
    updatedAt: nowMs
  });
}

function verifyPlotAccess(bundle, pairId, requestedPlotId, nowMs) {
  if (!requestedPlotId) return true;
  if (!bundle?.plot || bundle.plot.plotId !== requestedPlotId) return false;
  const safePairId = safeText(pairId, '', 180);
  if (!safePairId) return false;
  const membership = store.getPlotMembership(safePairId, requestedPlotId);
  if (membership) return true;
  if (bundle.plot.pairId === safePairId) {
    ensureHomeMembership(safePairId, requestedPlotId, nowMs);
    return true;
  }
  return false;
}

function ownedPlotSummaries(pairId, activePlotId = null) {
  const memberships = pairId ? store.listPlotMemberships(pairId) : [];
  return memberships
    .map((membership) => {
      const bundle = store.readPlotBundleById(membership.plotId);
      if (!bundle?.plot) return null;
      const claims = membership.originClaimId
        ? [store.getSettlementClaim(membership.originClaimId)].filter(Boolean)
        : [];
      return {
        plotId: bundle.plot.plotId,
        role: membership.role,
        title: membership.role === 'HOME'
          ? 'Founders Plot'
          : (claims[0]?.title || 'Settler Outpost'),
        hqLevel: bundle.plot.hqLevel,
        townXp: bundle.plot.townXp,
        status: bundle.plot.status,
        originClaimId: membership.originClaimId,
        siteType: claims[0]?.siteType || null,
        risk: claims[0]?.risk || null,
        active: bundle.plot.plotId === activePlotId,
        updatedAt: bundle.plot.updatedAt
      };
    })
    .filter(Boolean);
}

function findBuilding(bundle, buildingId) {
  return bundle.buildings.find((building) => building.buildingId === buildingId) || null;
}

function findActiveJobForBuilding(bundle, buildingId) {
  return bundle.jobs.find((job) => (
    job.buildingId === buildingId
    && (job.status === 'QUEUED' || job.status === 'RUNNING' || job.status === 'COMPLETED')
  )) || null;
}

function currentConstructionRuns(bundle) {
  return bundle.jobs.filter((job) => (
    (job.kind === 'CONSTRUCT' || job.kind === 'UPGRADE')
    && job.status === 'RUNNING'
  ));
}

function countAgentActionsLastHour(bundle, nowMs) {
  return (Array.isArray(bundle.events) ? bundle.events : [])
    .filter((event) => event.eventType === 'AGENT_ACTION_EXECUTED')
    .filter((event) => Number(event.createdAt || 0) >= (nowMs - 60 * 60 * 1000))
    .length;
}

function createEvent(events, {
  plotId,
  eventType,
  actor = 'SYSTEM',
  buildingId = null,
  jobId = null,
  summary,
  explanation = null,
  data = {},
  createdAt
}) {
  const event = {
    plotId,
    eventType,
    actor,
    buildingId,
    jobId,
    summary,
    explanation,
    data,
    createdAt: Number(createdAt)
  };
  events.push(event);
  return event;
}

function ensurePlotBundle({
  pairId,
  houseId = null,
  plotId = null,
  nowMs
}) {
  let bundle = plotId ? store.readPlotBundleById(plotId) : null;
  if (!bundle && pairId) bundle = store.readPlotBundleByPairId(pairId);
  if (!bundle) {
    const initial = initialPlotForIdentity({ pairId, houseId, nowMs });
    store.writePlot(initial.plot);
    store.writeBuildings(initial.buildings);
    store.writePolicy(initial.policy);
    ensureHomeMembership(pairId, initial.plot.plotId, nowMs);
    store.appendEvents([
      {
        plotId: initial.plot.plotId,
        eventType: 'PLOT_CREATED',
        actor: 'SYSTEM',
        buildingId: initial.buildings[0].buildingId,
        jobId: null,
        summary: 'Founders Plot opened and the headquarters is standing.',
        explanation: 'The personal plot begins with a Level 1 headquarters and one construction slot.',
        data: {
          plotId: initial.plot.plotId,
          hqLevel: initial.plot.hqLevel
        },
        createdAt: nowMs
      }
    ]);
    bundle = store.readPlotBundleById(initial.plot.plotId);
  }
  if (bundle?.plot && bundle.plot.pairId === pairId) {
    ensureHomeMembership(pairId, bundle.plot.plotId, nowMs);
  }
	  bundle.policy = bundle.policy || defaultPolicy(bundle.plot.plotId, nowMs);
	  bundle.plot.scoutReports = normalizeScoutReports(bundle.plot.scoutReports);
	  bundle.plot.sitePlans = normalizeSitePlans(bundle.plot.sitePlans);
	  bundle.plot.doctrineState = normalizeDoctrineState(bundle.plot.doctrineState);
	  bundle.plot.expeditionScouts = normalizeExpeditionScouts(bundle.plot.expeditionScouts);
	  bundle.plot.expeditionUnitMoves = normalizeExpeditionUnitMoves(bundle.plot.expeditionUnitMoves);
	  bundle.approvals = store.listApprovals(bundle.plot.plotId);
  bundle.ownerPairId = pairId || bundle.plot.pairId;
  bundle.memberships = pairId ? store.listPlotMemberships(pairId) : [];
  bundle.settlementClaims = pairId ? normalizeSettlementClaims(store.listSettlementClaimsByOwner(pairId)) : [];
  bundle.workOrders = normalizeWorkOrders(store.listWorkOrdersByPlot(bundle.plot.plotId));
  bundle.civicProposals = normalizeCivicProposals(store.listCivicProposalsByPlot(bundle.plot.plotId));
  bundle.overlayPacks = normalizeOverlayPacks(store.listOverlayPacksByPlot(bundle.plot.plotId));
  bundle.civicProjects = normalizeCivicProjects(store.listCivicProjectsByPlot(bundle.plot.plotId));
  bundle.events = store.listEvents(bundle.plot.plotId);
  return bundle;
}

function applyRuleChangesForHq(plot) {
  const rules = HQ_LEVEL_RULES[plot.hqLevel] || HQ_LEVEL_RULES[1];
  plot.storageCaps = clone(rules.storageCaps);
  plot.constructionSlots = Number(rules.constructionSlots);
}

function maybeResetDailyCounters(plot, nowMs) {
  const dayKey = nowDayKey(nowMs);
  if (plot.dailySellDay !== dayKey) {
    plot.dailySellDay = dayKey;
    plot.dailySoldCoin = 0;
  }
}

function maybeGrantDailyReturnBonus(bundle, nowMs, pendingEvents) {
  const plot = bundle.plot;
  const dayKey = nowDayKey(nowMs);
  const lastViewedAt = Number(plot.lastViewedAt || 0);
  if (!lastViewedAt) return;
  if (plot.lastDailyBonusDay === dayKey) return;
  const startOfDayMs = Date.parse(`${dayKey}T00:00:00.000Z`);
  if (!Number.isFinite(startOfDayMs) || lastViewedAt >= startOfDayMs) return;
  addTownXp(plot, DAILY_RETURN_XP);
  plot.lastDailyBonusDay = dayKey;
  createEvent(pendingEvents, {
    plotId: plot.plotId,
    eventType: 'REWARD_CLAIMED',
    actor: 'SYSTEM',
    summary: 'Daily return bonus granted: +5 town XP.',
    explanation: 'Daily return bonus is awarded once per UTC day when the plot is resumed after a gap.',
    data: {
      rewardId: 'daily-return-bonus',
      townXp: DAILY_RETURN_XP
    },
    createdAt: nowMs
  });
}

function maybeCreatePendingRecap(plot, nowMs) {
  const previousViewedAt = Number(plot.lastViewedAt || 0);
  if (
    previousViewedAt > 0
    && !plot.pendingRecapFrom
    && (nowMs - previousViewedAt) >= 60_000
  ) {
    plot.pendingRecapFrom = Math.max(previousViewedAt, nowMs - OFFLINE_CLAMP_MS);
    plot.pendingRecapTo = nowMs;
  }
  plot.lastViewedAt = nowMs;
}

function availableRewards(bundle) {
  const claimed = new Set(Array.isArray(bundle.plot.claimedRewards) ? bundle.plot.claimedRewards : []);
  return REWARD_DEFS
    .filter((reward) => !claimed.has(reward.rewardId))
    .filter((reward) => reward.isAvailable(bundle))
    .map((reward) => ({
      rewardId: reward.rewardId,
      title: reward.title,
      body: reward.body,
      grant: clone(reward.grant)
    }));
}

function unlockedPermissionRows(bundle) {
  const availability = policyAvailabilityForHq(bundle.plot.hqLevel);
  const policy = bundle.policy;
  return [
    {
      key: 'observeAndSuggest',
      label: 'Observe + suggest',
      unlocked: availability.observeAndSuggest,
      enabled: policy.observeAndSuggest === true,
      requiresApproval: false
    },
    {
      key: 'collectOutputs',
      label: 'Collect outputs',
      unlocked: availability.collectOutputs,
      enabled: policy.collectOutputs === true,
      requiresApproval: true
    },
    {
      key: 'queueProduction',
      label: 'Queue production',
      unlocked: availability.queueProduction,
      enabled: policy.queueProduction === true,
      requiresApproval: true
    },
    {
      key: 'setPriority',
      label: 'Set one priority',
      unlocked: availability.setPriority,
      enabled: policy.setPriority === true,
      requiresApproval: true
    },
    {
      key: 'sellSurplusFood',
      label: 'Sell surplus food',
      unlocked: availability.sellSurplusFood,
      enabled: policy.sellSurplusFood === true,
      requiresApproval: true
    }
  ];
}

function currentQuest(bundle) {
  const buildings = bundle.buildings;
  const hasType = (type) => buildings.some((building) => building.type === type);
  const collectedTypes = new Set(bundle.plot.collectedBuildingTypes || []);
  const farmCost = BUILDING_DEFS.FARM_PLOT.construction.cost;
  const quarryCost = BUILDING_DEFS.QUARRY.construction.cost;
  const expeditionCost = BUILDING_DEFS.EXPEDITION_BOARD.construction.cost;
  const hqUpgrade = HQ_UPGRADE_RULES[bundle.plot.hqLevel] || null;

  if (!hasType('LUMBER_CAMP')) {
    return {
      id: 'place-lumber-camp',
      title: 'Raise your first Lumber Camp',
      body: 'Place a Lumber Camp on any open pad so the settlement can start producing wood.',
      primaryAction: 'Place Lumber Camp'
    };
  }
  if (!collectedTypes.has('LUMBER_CAMP')) {
    return {
      id: 'collect-first-wood',
      title: 'Collect the first wood output',
      body: 'Let the Lumber Camp finish a job, then collect the output and bank the first haul.',
      primaryAction: 'Collect wood'
    };
  }
  if (!hasType('FARM_PLOT')) {
    const farmProgress = formatRequirementProgress(bundle, { cost: farmCost });
    if (!canAffordProgression(bundle, { cost: farmCost })) {
      return {
        id: 'stock-farm-plot',
        title: 'Stock supplies for a Farm Plot',
        body: `Farm Plot cost progress: ${farmProgress}. Keep producing and collecting wood before placing it.`,
        primaryAction: 'Collect Farm Plot supplies'
      };
    }
    return {
      id: 'place-farm-plot',
      title: 'Establish a Farm Plot',
      body: `Food is the next bottleneck. Farm Plot is unlocked now. Cost progress: ${farmProgress}.`,
      primaryAction: 'Build Farm Plot'
    };
  }
  if (bundle.plot.hqLevel < 2) {
    const hq2Progress = formatRequirementProgress(bundle, {
      cost: hqUpgrade?.cost || {},
      xpRequired: hqUpgrade?.xpRequired
    });
    if (!canAffordProgression(bundle, {
      cost: hqUpgrade?.cost || {},
      xpRequired: hqUpgrade?.xpRequired
    })) {
      return {
        id: 'stock-hq-2',
        title: 'Stock supplies for HQ Level 2',
        body: `HQ Level 2 needs food from the Farm Plot and wood from the Lumber Camp. Progress: ${hq2Progress}.`,
        primaryAction: 'Collect HQ2 supplies'
      };
    }
    return {
      id: 'upgrade-hq-2',
      title: 'Upgrade Headquarters to Level 2',
      body: `Ready for HQ Level 2. Cost progress: ${hq2Progress}. Level 2 unlocks Quarry access and foreman collection.`,
      primaryAction: 'Upgrade HQ'
    };
  }
  if (!hasType('QUARRY')) {
    const quarryProgress = formatRequirementProgress(bundle, { cost: quarryCost });
    if (!canAffordProgression(bundle, { cost: quarryCost })) {
      return {
        id: 'stock-quarry',
        title: 'Stock supplies for a Quarry',
        body: `Quarry unlocks at HQ Level 2 and provides the stone needed for HQ Level 3. Progress: ${quarryProgress}.`,
        primaryAction: 'Collect Quarry supplies'
      };
    }
    return {
      id: 'place-quarry',
      title: 'Build the Quarry',
      body: `Stone creates the first real production tradeoff and prepares HQ Level 3. Cost progress: ${quarryProgress}.`,
      primaryAction: 'Build Quarry'
    };
  }
	  if (bundle.plot.hqLevel < 3) {
	    const hq3Progress = formatRequirementProgress(bundle, {
	      cost: hqUpgrade?.cost || {},
      xpRequired: hqUpgrade?.xpRequired
    });
    if (!canAffordProgression(bundle, {
      cost: hqUpgrade?.cost || {},
      xpRequired: hqUpgrade?.xpRequired
    })) {
      return {
        id: 'stock-hq-3',
        title: 'Stock supplies for HQ Level 3',
        body: `HQ Level 3 needs stone from the Quarry plus a deeper wood reserve. Progress: ${hq3Progress}.`,
        primaryAction: 'Collect HQ3 supplies'
      };
    }
    return {
      id: 'upgrade-hq-3',
      title: 'Upgrade Headquarters to Level 3',
      body: `Ready for HQ Level 3. Cost progress: ${hq3Progress}. Level 3 unlocks foreman production queueing.`,
      primaryAction: 'Upgrade HQ'
	    };
	  }
  if (!hasType('EXPEDITION_BOARD')) {
    const expeditionProgress = formatRequirementProgress(bundle, { cost: expeditionCost });
    if (!canAffordProgression(bundle, { cost: expeditionCost })) {
      return {
        id: 'stock-expedition-board',
        title: 'Stock supplies for an Expedition Board',
        body: `HQ Level 3 can now turn the settlement outward. Expedition Board cost progress: ${expeditionProgress}.`,
        primaryAction: 'Collect Expedition Board supplies'
      };
    }
    return {
      id: 'place-expedition-board',
      title: 'Build the Expedition Board',
      body: `The first post-HQ3 expansion loop starts with scouting. Cost progress: ${expeditionProgress}.`,
      primaryAction: 'Build Expedition Board'
    };
  }
  const expeditionBoard = buildings.find((building) => building.type === 'EXPEDITION_BOARD');
  const scoutReports = normalizeScoutReports(bundle.plot.scoutReports);
  if (scoutReports.length < 1 && expeditionBoard) {
    if (expeditionBoard.state === 'OUTPUT_READY') {
      return {
        id: 'collect-first-scout-report',
        title: 'Collect the first Scout Report',
        body: 'A scout has returned with a nearby-site receipt. Collect it before planning the second settlement.',
        primaryAction: 'Collect Scout Report'
      };
    }
    if (expeditionBoard.state === 'READY') {
      const scoutSpec = BUILDING_DEFS.EXPEDITION_BOARD.produces(expeditionBoard.level);
      const scoutProgress = formatRequirementProgress(bundle, { cost: scoutSpec.input || {} });
      if (!canAffordProgression(bundle, { cost: scoutSpec.input || {} })) {
        return {
          id: 'stock-first-scout',
          title: 'Stock supplies for the first scout',
          body: `Scouting spends a little food and wood so expansion has a real cost. Progress: ${scoutProgress}.`,
          primaryAction: 'Collect scout supplies'
        };
      }
      return {
        id: 'dispatch-first-scout',
        title: 'Dispatch the first scout',
        body: `Send Rook from the Expedition Board to bring back a report. Scout cost progress: ${scoutProgress}.`,
        primaryAction: 'Dispatch scout'
      };
    }
    return {
      id: 'finish-expedition-board',
      title: 'Finish the Expedition Board',
      body: 'The board is under construction. Once ready, it can dispatch the first scout.',
      primaryAction: 'Wait for construction'
    };
  }
  const sitePlans = normalizeSitePlans(bundle.plot.sitePlans);
  if (scoutReports.length >= 1 && sitePlans.length < 1) {
    const firstReport = scoutReports[0];
    return {
      id: 'draft-first-site-plan',
      title: 'Draft the first Site Plan',
      body: `${firstReport.title} is a real receipt now. Turn it into a server-owned Site Plan before any future claim or settler convoy exists.`,
      primaryAction: 'Draft Site Plan'
    };
  }
  const firstUnreviewedPlan = sitePlans.find((plan) => plan.reviewStatus !== 'reviewed');
  if (firstUnreviewedPlan && bundle.plot.hqLevel >= 6) {
    return {
      id: 'review-first-site-plan',
      title: 'Review the first Site Plan',
      body: `${firstUnreviewedPlan.title} can become claim-ready planning state. This still does not create territory or a second plot.`,
      primaryAction: 'Review Site Plan'
    };
  }
  if (bundle.plot.hqLevel < 6) {
    return {
      id: `reach-hq-${Math.min(6, bundle.plot.hqLevel + 1)}`,
      title: `Reach HQ Level ${Math.min(6, bundle.plot.hqLevel + 1)}`,
      body: 'Keep the loop moving: queue jobs, collect outputs, and convert the surplus into progression.',
      primaryAction: 'Advance the plot'
    };
  }
  return {
    id: 'overnight-planner',
    title: 'Keep the overnight planner honest',
    body: 'The town is stable. Tighten priorities, use the Workshop buff, and keep the recap trail readable.',
    primaryAction: 'Review recap'
  };
}

function buildingActiveJob(bundle, buildingId) {
  return bundle.jobs.find((job) => (
    job.buildingId === buildingId
    && (job.status === 'QUEUED' || job.status === 'RUNNING' || job.status === 'COMPLETED')
  )) || null;
}

function buildingUiState(bundle, building) {
  const def = BUILDING_DEFS[building.type];
  const activeJob = buildingActiveJob(bundle, building.buildingId);
  return {
    ...clone(building),
    label: BUILDING_LABELS[building.type] || building.type,
    unlockedAtHqLevel: def?.unlockHqLevel || 1,
    activeJob: clone(activeJob),
    hasOutputReady: building.state === 'OUTPUT_READY',
    canQueue: building.state === 'READY' && !!def?.produces && !activeJob,
    canCollect: building.state === 'OUTPUT_READY',
    canUpgrade: building.type === 'HQ'
      ? !!HQ_UPGRADE_RULES[bundle.plot.hqLevel]
      : !!def?.upgrade?.[building.level]
  };
}

function actorTargetForBuilding(building) {
  if (!building) return null;
  return {
    kind: 'building',
    id: building.buildingId,
    type: building.type,
    label: BUILDING_LABELS[building.type] || building.type,
    x: building.x,
    y: building.y
  };
}

function visualActorProgress(job, nowMs) {
  if (!job || !Number.isFinite(Number(job.startedAt)) || !Number.isFinite(Number(job.endsAt))) {
    return 0;
  }
  const startedAt = Number(job.startedAt);
  const endsAt = Number(job.endsAt);
  const duration = Math.max(1, endsAt - startedAt);
  const elapsed = Math.max(0, Math.min(duration, Number(nowMs || 0) - startedAt));
  return Number((elapsed / duration).toFixed(4));
}

function makeVisualActor({
  role,
  generatedOverlayRoleId,
  sourceDomain,
  sourceObjectId,
  sourceStateHash,
  visualState,
  actionKind = null,
  progress = 0,
  target = null
}) {
  const safeRole = String(role || 'worker');
  const safeDomain = String(sourceDomain || 'plot');
  const safeSourceId = String(sourceObjectId || 'plot');
  return {
    actorId: `actor:${safeRole}:${safeDomain}:${safeSourceId}`,
    canonicalRoleId: safeRole,
    generatedOverlayRoleId: generatedOverlayRoleId || null,
    sourceDomain: safeDomain,
    sourceObjectId: safeSourceId,
    sourceStateHash,
    visualState: String(visualState || 'idle'),
    actionKind: actionKind ? String(actionKind) : null,
    progress: Math.max(0, Math.min(1, Number(progress || 0))),
    target,
    selectionKey: target?.kind && target?.id ? `${target.kind}:${target.id}` : `${safeDomain}:${safeSourceId}`,
    drawerKey: target?.kind && target?.id ? `${target.kind}:${target.id}` : `${safeDomain}:${safeSourceId}`,
    visualOnly: true
  };
}

function visualActorProjections(bundle, { stateHash }) {
  const nowMs = Number(bundle.plot.lastSimulatedAt || bundle.plot.updatedAt || 0);
  const actors = [];
  const sourceStateHash = String(stateHash || '');
  const quest = currentQuest(bundle);
  const hq = bundle.buildings.find((building) => building.type === 'HQ') || bundle.buildings[0] || null;

  actors.push(makeVisualActor({
    role: 'clover',
    generatedOverlayRoleId: 'inhabitant.messenger',
    sourceDomain: 'foreman',
    sourceObjectId: bundle.plot.plotId,
    sourceStateHash,
    visualState: bundle.policy.emergencyPause ? 'paused' : 'observing',
    progress: 0,
    actionKind: 'OBSERVE',
    target: actorTargetForBuilding(hq)
  }));

  for (const job of [...bundle.jobs].sort((a, b) => Number(a.createdAt || 0) - Number(b.createdAt || 0))) {
    if (!['QUEUED', 'RUNNING', 'COMPLETED'].includes(job.status)) continue;
    const building = findBuilding(bundle, job.buildingId);
    const target = actorTargetForBuilding(building);
    if (job.kind === 'CONSTRUCT' || job.kind === 'UPGRADE') {
      actors.push(makeVisualActor({
        role: 'builder',
        generatedOverlayRoleId: 'inhabitant.worker',
        sourceDomain: 'job',
        sourceObjectId: job.jobId,
        sourceStateHash,
        visualState: job.status === 'QUEUED' ? 'waiting_to_build' : 'building',
        actionKind: job.kind,
        progress: visualActorProgress(job, nowMs),
        target
      }));
      continue;
    }
    if (job.kind === 'SCOUT') {
      actors.push(makeVisualActor({
        role: 'scout',
        generatedOverlayRoleId: 'inhabitant.messenger',
        sourceDomain: 'job',
        sourceObjectId: job.jobId,
        sourceStateHash,
        visualState: job.status === 'QUEUED' ? 'waiting_to_scout' : 'scouting',
        actionKind: job.kind,
        progress: visualActorProgress(job, nowMs),
        target
      }));
      continue;
    }
    if (job.kind === 'PRODUCE' || job.kind === 'SELL') {
      const operatorRole = building?.type === 'WORKSHOP'
        ? 'workshop_specialist'
        : building?.type === 'MARKET_STALL'
          ? 'market_trader'
          : 'worker';
      const overlayRole = operatorRole === 'worker'
        ? 'inhabitant.worker'
        : `inhabitant.${operatorRole}`;
      actors.push(makeVisualActor({
        role: operatorRole,
        generatedOverlayRoleId: overlayRole,
        sourceDomain: 'job',
        sourceObjectId: job.jobId,
        sourceStateHash,
        visualState: job.status === 'QUEUED'
          ? `waiting_to_${operatorRole === 'market_trader' ? 'trade' : operatorRole === 'workshop_specialist' ? 'tune' : 'work'}`
          : operatorRole === 'market_trader' ? 'trading' : operatorRole === 'workshop_specialist' ? 'tuning' : 'working',
        actionKind: job.kind,
        progress: visualActorProgress(job, nowMs),
        target
      }));
    }
  }

  for (const building of [...bundle.buildings].sort((a, b) => String(a.buildingId).localeCompare(String(b.buildingId)))) {
    if (building.state !== 'OUTPUT_READY') continue;
    const isScoutReport = building.type === 'EXPEDITION_BOARD';
    const isWorkshopBuff = building.type === 'WORKSHOP';
    const isMarketCoin = building.type === 'MARKET_STALL';
    const readyRole = isScoutReport
      ? 'scout'
      : isWorkshopBuff
        ? 'workshop_specialist'
        : isMarketCoin
          ? 'market_trader'
          : 'hauler';
    const readyAction = isScoutReport
      ? 'SCOUT_REPORT_READY'
      : isWorkshopBuff
        ? 'BUFF_READY'
        : isMarketCoin
          ? 'COIN_READY'
          : 'OUTPUT_READY';
    actors.push(makeVisualActor({
      role: readyRole,
      generatedOverlayRoleId: `inhabitant.${readyRole}`,
      sourceDomain: 'building',
      sourceObjectId: building.buildingId,
      sourceStateHash,
      visualState: isScoutReport ? 'report_ready' : isWorkshopBuff ? 'buff_ready' : isMarketCoin ? 'coin_ready' : 'ready_to_collect',
      actionKind: readyAction,
      progress: 1,
      target: actorTargetForBuilding(building)
    }));
  }

  for (const claim of normalizeSettlementClaims(bundle.settlementClaims || [])
    .filter((entry) => entry.originPlotId === bundle.plot.plotId)
    .sort((a, b) => Number(a.createdAt || 0) - Number(b.createdAt || 0))) {
    if (!['CONVOY_PREPARING', 'CONVOY_ARRIVED', 'FOUNDED'].includes(claim.status)) continue;
    const activeJob = claim.convoyJobId ? bundle.jobs.find((job) => job.jobId === claim.convoyJobId) : null;
    const route = {
      ...(claim.route || {}),
      progress: claim.status === 'CONVOY_PREPARING'
        ? visualActorProgress(activeJob, nowMs)
        : 1,
      visualOnly: true
    };
    actors.push(makeVisualActor({
      role: 'settler',
      generatedOverlayRoleId: 'inhabitant.settler',
      sourceDomain: 'settlement_claim',
      sourceObjectId: claim.claimId,
      sourceStateHash,
      visualState: claim.status.toLowerCase(),
      actionKind: claim.status === 'CONVOY_PREPARING' ? 'SETTLER_CONVOY' : 'SETTLEMENT_READY',
      progress: route.progress,
      target: {
        kind: 'settlement_claim',
        id: claim.claimId,
        title: claim.title,
        status: claim.status,
        route,
        foundedPlotId: claim.foundedPlotId || null
      }
    }));
  }

  const worldGrid = worldGridReadModel(bundle);
  const activeCivicBeacon = normalizeCivicProjects(bundle.civicProjects || [])
    .filter((project) => project.status === 'ACTIVE' && project.projectType === 'civic_beacon')
    .sort((a, b) => Number(a.createdAt || 0) - Number(b.createdAt || 0))[0] || null;
  const foundedOutpost = normalizeSettlementClaims(bundle.settlementClaims || [])
    .filter((claim) => claim.originPlotId === bundle.plot.plotId && claim.status === 'FOUNDED' && claim.foundedPlotId)
    .sort((a, b) => Number(a.foundedAt || a.updatedAt || 0) - Number(b.foundedAt || b.updatedAt || 0))[0] || null;

  if (foundedOutpost) {
    actors.push(makeVisualActor({
      role: 'outpost_keeper',
      generatedOverlayRoleId: 'inhabitant.outpost_keeper',
      sourceDomain: 'settlement_claim',
      sourceObjectId: foundedOutpost.claimId,
      sourceStateHash,
      visualState: 'outpost_tending',
      actionKind: 'OUTPOST_FOUNDED',
      progress: 1,
      target: {
        kind: 'settlement_claim',
        id: foundedOutpost.claimId,
        title: foundedOutpost.title,
        status: foundedOutpost.status,
        foundedPlotId: foundedOutpost.foundedPlotId,
        route: {
          ...(foundedOutpost.route || {}),
          progress: 1,
          visualOnly: true
        }
      }
    }));
  }

  if (activeCivicBeacon) {
    actors.push(makeVisualActor({
      role: 'civic_routekeeper',
      generatedOverlayRoleId: 'inhabitant.civic_routekeeper',
      sourceDomain: 'civic_project',
      sourceObjectId: activeCivicBeacon.projectId,
      sourceStateHash,
      visualState: 'civic_route_marking',
      actionKind: 'CIVIC_BEACON_ACTIVE',
      progress: worldGrid.civicReadiness?.localProjectReadinessScore || 1,
      target: {
        kind: 'civic_project',
        id: activeCivicBeacon.projectId,
        projectType: activeCivicBeacon.projectType,
        effectId: activeCivicBeacon.effect?.effectId || null,
        moraleMarkers: clone(worldGrid.civicReadiness?.moraleMarkers || []),
        visualOnly: true
      }
    }));

    actors.push(makeVisualActor({
      role: 'oracle_adjunct',
      generatedOverlayRoleId: 'inhabitant.oracle_adjunct',
      sourceDomain: 'world_grid',
      sourceObjectId: worldGrid.projectionHash || activeCivicBeacon.projectId,
      sourceStateHash,
      visualState: 'world_grid_consulting',
      actionKind: 'WORLD_GRID_READ_MODEL',
      progress: worldGrid.civicReadiness?.ready ? 1 : 0,
      target: {
        kind: 'world_grid',
        id: worldGrid.projectionHash || 'world_grid',
        status: worldGrid.status,
        ready: worldGrid.civicReadiness?.ready === true,
        authorityBoundary: worldGrid.authorityBoundary,
        visualOnly: true
      }
    }));
  }

  const messengerSource = (bundle.approvals || []).find((approval) => approval.status === 'PENDING')
    || availableRewards(bundle)[0]
    || quest;
  if (messengerSource) {
    actors.push(makeVisualActor({
      role: 'messenger',
      generatedOverlayRoleId: 'inhabitant.messenger',
      sourceDomain: messengerSource.approvalId ? 'approval' : messengerSource.rewardId ? 'reward' : 'quest',
      sourceObjectId: messengerSource.approvalId || messengerSource.rewardId || messengerSource.id || 'current',
      sourceStateHash,
      visualState: messengerSource.approvalId ? 'needs_approval' : 'notifying',
      actionKind: messengerSource.approvalId ? 'APPROVAL' : messengerSource.rewardId ? 'REWARD' : 'QUEST',
      progress: 0,
      target: actorTargetForBuilding(hq)
    }));
  }

  return actors.slice(0, 20);
}

function publicSummary(bundle) {
  const plot = bundle.plot;
  const settlementClaims = normalizeSettlementClaims(bundle.settlementClaims || []);
  const workOrders = normalizeWorkOrders(bundle.workOrders || []);
  const civicProposals = normalizeCivicProposals(bundle.civicProposals || []);
  const civicProposalStatusCounts = civicProposalCounts(civicProposals);
  const overlayPacks = normalizeOverlayPacks(bundle.overlayPacks || []);
  const overlayPackStatusCounts = overlayPackCounts(overlayPacks);
  const civicProjects = normalizeCivicProjects(bundle.civicProjects || []);
  const civicProjectStatusCounts = civicProjectCounts(civicProjects).byStatus;
  const activeCivicBeaconCount = civicProjects.filter((project) => (
    project.status === 'ACTIVE' && project.projectType === 'civic_beacon'
  )).length;
  const worldGrid = worldGridReadModel(bundle);
  const expeditionMap = buildExpeditionMapReadModel(bundle);
  const buildings = bundle.buildings.map((building) => ({
    buildingId: building.buildingId,
    type: building.type,
    level: building.level,
    x: building.x,
    y: building.y,
    state: building.state
  }));
	  return {
	    plotId: plot.plotId,
	    houseId: plot.houseId || null,
	    hqLevel: plot.hqLevel,
	    townXp: plot.townXp,
	    inventory: clone(plot.inventory),
	    scoutReportCount: normalizeScoutReports(plot.scoutReports).length,
	    sitePlanCount: normalizeSitePlans(plot.sitePlans).length,
	    selectedDoctrineId: normalizeDoctrineState(plot.doctrineState).selectedDoctrineId,
      settlementClaimCount: settlementClaims.length,
      outpostCount: settlementClaims.filter((claim) => claim.status === 'FOUNDED' && claim.foundedPlotId).length,
      workOrderDraftCount: workOrders.filter((order) => order.status === 'DRAFT').length,
      workOrderCompletedCount: workOrders.filter((order) => order.status === 'COMPLETED').length,
      workOrderExecutionAvailable: workOrderPlannerReadModel(bundle).executionAvailable === true,
      civicProposalCount: civicProposals.length,
      civicProposalDraftCount: civicProposalStatusCounts.DRAFT,
      civicProposalReviewedCount: civicProposalStatusCounts.REVIEWED,
      overlayPackCount: overlayPacks.length,
      overlayPackDraftCount: overlayPackStatusCounts.DRAFT,
      overlayPackReviewedCount: overlayPackStatusCounts.REVIEWED,
      civicProjectCount: civicProjects.length,
      civicProjectActiveCount: civicProjectStatusCounts.ACTIVE,
      civicBeaconActive: activeCivicBeaconCount > 0,
      civicProjectInspectionCount: worldGrid.civicProjects.inspectionCount,
      civicProjectBaselineInspectedCount: worldGrid.civicProjects.baselineInspectedCount,
      civicReadinessScore: worldGrid.civicReadiness.localProjectReadinessScore,
      worldGridStatus: worldGrid.status,
      worldGridReady: worldGrid.civicReadiness.ready,
      expeditionMapStatus: expeditionMap.status,
      expeditionMapDiscoveredCount: expeditionMap.fog.counts.discovered,
      expeditionMapKnownCount: expeditionMap.fog.counts.known,
      expeditionMapHintedCount: expeditionMap.fog.counts.hinted,
      expeditionMapLockedUnknownCount: expeditionMap.fog.counts.locked_unknown,
		    buildings,
		    updatedAt: plot.updatedAt
		  };
	}

function buildState(bundle, {
  includeReplay = false,
  includePublicSummary = true,
  includeAdvancedReadModels = true,
  includeVisualActors = true
} = {}) {
  const recap = bundle.plot.pendingRecapFrom && bundle.plot.pendingRecapTo
    ? buildRecapFromEvents(bundle.events, {
      fromMs: bundle.plot.pendingRecapFrom,
      toMs: bundle.plot.pendingRecapTo,
      maxItems: 10,
      hqLevel: bundle.plot.hqLevel
    })
    : null;

  const snapshot = bundleSnapshot(bundle);
  const stateHash = computeStateHash(snapshot);
  const visualActors = includeVisualActors ? visualActorProjections(bundle, { stateHash }) : [];
  const permissions = unlockedPermissionRows(bundle);
  const approvals = (bundle.approvals || [])
    .filter((approval) => approval.status !== 'USED')
    .slice(0, 20);
	  const unlockedBuildings = unlockedBuildingsForHq(bundle.plot.hqLevel);
	  const rewards = availableRewards(bundle);
	  const scoutReports = normalizeScoutReports(bundle.plot.scoutReports);
	  const sitePlans = normalizeSitePlans(bundle.plot.sitePlans);
  const research = includeAdvancedReadModels
    ? researchReadModel(bundle)
    : { status: 'COMPACT_OBSERVATION_OMITTED', doctrineCatalog: [], doctrineState: normalizeDoctrineState(bundle.plot.doctrineState) };
  const cohortPlanner = includeAdvancedReadModels
    ? workOrderPlannerReadModel(bundle)
    : { templates: [], workOrders: [], executionAvailable: false };
  const worldGrid = includeAdvancedReadModels ? worldGridReadModel(bundle) : null;
  const expeditionMap = includeAdvancedReadModels ? buildExpeditionMapReadModel(bundle) : null;
  const civicProposals = includeAdvancedReadModels ? civicProposalsReadModel(bundle) : null;
  const overlayPacks = includeAdvancedReadModels ? overlayPacksReadModel(bundle) : null;
  const civicProjects = includeAdvancedReadModels ? civicProjectsReadModel(bundle) : null;
  const settlementClaims = normalizeSettlementClaims(bundle.settlementClaims || []);
  const ownedPlots = ownedPlotSummaries(bundle.ownerPairId || bundle.plot.pairId, bundle.plot.plotId);
	  const queue = bundle.jobs
    .filter((job) => ['QUEUED', 'RUNNING', 'COMPLETED'].includes(job.status))
    .sort((a, b) => Number(a.createdAt || 0) - Number(b.createdAt || 0));

  const state = {
    plot: clone(bundle.plot),
    buildings: bundle.buildings.map((building) => buildingUiState(bundle, building)),
    jobs: clone(queue),
    permissions,
    approvals,
    rewards,
    quest: currentQuest(bundle),
    pads: PADS.map((pad) => ({
      ...pad,
      occupiedBy: bundle.buildings.find((building) => building.x === pad.x && building.y === pad.y)?.buildingId || null
    })),
    unlocks: {
      buildings: unlockedBuildings.filter((type) => type !== 'HQ')
    },
    unlockedBuildings,
    hqUpgrade: hqUpgradeReadModel(bundle),
	    buildingDefs: publicBuildingDefs(),
	    scoutReports,
	    sitePlans,
      research,
      doctrineCatalog: research.doctrineCatalog,
      doctrineState: research.doctrineState,
      cohortPlanner,
      worldGrid,
      expeditionMap,
      civicProposals,
      overlayPacks,
      civicProjects,
      workOrderTemplates: cohortPlanner.templates,
      workOrders: cohortPlanner.workOrders,
      settlementClaims,
      ownedPlots,
      activePlotId: bundle.plot.plotId,
      homePlotId: ownedPlots.find((plot) => plot.role === 'HOME')?.plotId || bundle.plot.plotId,
	    visualActors,
    publicSummary: includePublicSummary ? publicSummary(bundle) : null,
    audit: includeReplay
      ? {
        stateHash,
        eventCount: bundle.events.length,
        replay: buildReplayAudit(bundle.events)
      }
      : {
        stateHash,
        eventCount: bundle.events.length
      }
  };

  return { state, recap, stateHash };
}

function levelRules(hqLevel) {
  return HQ_LEVEL_RULES[Math.max(1, Math.min(6, Number(hqLevel) || 1))] || HQ_LEVEL_RULES[1];
}

function verifyPlotId(bundle, requestedPlotId) {
  if (!requestedPlotId) return true;
  return bundle.plot.plotId === requestedPlotId;
}

function pendingApprovalForAction(bundle, actionName, requestedParams) {
  return store.findApprovedUnusedApproval(
    bundle.plot.plotId,
    actionName,
    hashPayload({ action: actionName, params: requestedParams })
  );
}

function consumeActionApproval(bundle, actionName, requestedParams, nowMs) {
  const approval = pendingApprovalForAction(bundle, actionName, requestedParams);
  if (!approval) return null;
  approval.status = 'USED';
  approval.usedAt = nowMs;
  approval.updatedAt = nowMs;
  approval.resolvedAt = approval.resolvedAt || nowMs;
  store.writeApproval(approval);
  bundle.approvals = store.listApprovals(bundle.plot.plotId);
  return approval;
}

function markAgentAction(bundle, pendingEvents, actionName, explanation, nowMs, permissionKey = null) {
  createEvent(pendingEvents, {
    plotId: bundle.plot.plotId,
    eventType: 'AGENT_ACTION_EXECUTED',
    actor: 'AGENT',
    summary: `Foreman action: ${actionName}`,
    explanation,
    data: { actionName, permissionKey: permissionKey || null },
    createdAt: nowMs
  });
  if (!permissionKey) return;
  const awarded = Array.isArray(bundle.plot.agentTiersXpAwarded) ? bundle.plot.agentTiersXpAwarded : [];
  if (awarded.includes(permissionKey)) return;
  bundle.plot.agentTiersXpAwarded = [...awarded, permissionKey];
  addTownXp(bundle.plot, 10);
  createEvent(pendingEvents, {
    plotId: bundle.plot.plotId,
    eventType: 'XP_AWARDED',
    actor: 'AGENT',
    summary: `First agent automation in ${permissionKey} tier: +10 XP.`,
    explanation: `Awarded +10 town XP for the first successful agent action in the ${permissionKey} permission tier.`,
    data: { amount: 10, reason: 'first_agent_tier_automation', permissionKey },
    createdAt: nowMs
  });
}

function assertAgentPolicy(bundle, permissionKey, { nowMs, actionName, retryableMessage }) {
  if (bundle.policy.emergencyPause) {
    return errorEnvelope(bundle.plot.plotId, 'FORBIDDEN_POLICY', 'Agent actions are paused by emergency pause.', true, {
      reason: 'emergency_pause'
    });
  }
  const availability = policyAvailabilityForHq(bundle.plot.hqLevel);
  if (!availability[permissionKey]) {
    return errorEnvelope(bundle.plot.plotId, 'FORBIDDEN_POLICY', `HQ level has not unlocked ${permissionKey} yet.`, true, {
      reason: 'hq_locked'
    });
  }
  if (bundle.policy[permissionKey] !== true) {
    return errorEnvelope(bundle.plot.plotId, 'FORBIDDEN_POLICY', retryableMessage || `Human approval is required before the foreman can use ${actionName}.`, true, {
      reason: 'policy_disabled'
    });
  }
  const recentActions = countAgentActionsLastHour(bundle, nowMs);
  if (recentActions >= Number(bundle.policy.maxAutonomousActionsPerHour || 0)) {
    return errorEnvelope(bundle.plot.plotId, 'RATE_LIMITED', 'Agent hourly action cap reached for this plot.', true, {
      reason: 'hourly_cap'
    });
  }
  return null;
}

function maybeStartQueuedConstructionJobs(bundle, nowMs, pendingEvents) {
  maybeResetDailyCounters(bundle.plot, nowMs);
  const openSlots = Math.max(0, Number(bundle.plot.constructionSlots || 0) - currentConstructionRuns(bundle).length);
  if (!openSlots) return;
  const queued = bundle.jobs
    .filter((job) => (job.kind === 'CONSTRUCT' || job.kind === 'UPGRADE') && job.status === 'QUEUED')
    .sort((a, b) => Number(a.createdAt || 0) - Number(b.createdAt || 0));
  for (const job of queued.slice(0, openSlots)) {
    let durationMs = Math.max(1, Number(job.durationMs || 0));
    if (bundle.plot.nextBuildBuffPct > 0) {
      const modifier = Math.max(0, 1 - (Number(bundle.plot.nextBuildBuffPct || 0) / 100));
      durationMs = Math.max(1, Math.round(durationMs * modifier));
      bundle.plot.nextBuildBuffPct = 0;
    }
    job.status = 'RUNNING';
    job.startedAt = nowMs;
    job.endsAt = nowMs + durationMs;
    job.updatedAt = nowMs;
    const building = findBuilding(bundle, job.buildingId);
    if (building) {
      building.state = job.kind === 'UPGRADE' ? 'UPGRADING' : 'UNDER_CONSTRUCTION';
      building.updatedAt = nowMs;
    }
    createEvent(pendingEvents, {
      plotId: bundle.plot.plotId,
      eventType: 'BUILDING_STARTED',
      actor: job.createdBy,
      buildingId: job.buildingId,
      jobId: job.jobId,
      summary: `${BUILDING_LABELS[building?.type] || 'Building'} started ${job.kind === 'UPGRADE' ? 'upgrading' : 'construction'}.`,
      explanation: job.explanation || null,
      data: { kind: job.kind, buildingType: building?.type || null },
      createdAt: nowMs
    });
  }
}

function markCompletedProductionJob(bundle, building, job, pendingEvents, nowMs) {
  building.outputBuffer = normalizeInventory(building.outputBuffer || {});
  const output = normalizeInventory(job.output);
  for (const key of RESOURCE_KEYS) {
    building.outputBuffer[key] += output[key];
  }
  building.state = 'OUTPUT_READY';
  building.updatedAt = nowMs;
  job.status = 'COMPLETED';
  job.updatedAt = nowMs;
  createEvent(pendingEvents, {
    plotId: bundle.plot.plotId,
    eventType: 'JOB_COMPLETED',
    actor: job.createdBy,
    buildingId: building.buildingId,
    jobId: job.jobId,
    summary: `${BUILDING_LABELS[building.type]} finished a ${job.kind.toLowerCase()} job.`,
    explanation: job.explanation,
    data: {
      kind: job.kind,
      output: clone(job.output)
    },
    createdAt: nowMs
  });
}

function markCompletedWorkshopJob(bundle, building, job, pendingEvents, nowMs) {
  const def = BUILDING_DEFS.WORKSHOP;
  const buff = Number(def.produces(building.level).buffPct || 20);
  building.outputBuffer = {};
  building.state = 'OUTPUT_READY';
  building.updatedAt = nowMs;
  job.status = 'COMPLETED';
  job.updatedAt = nowMs;
  createEvent(pendingEvents, {
    plotId: bundle.plot.plotId,
    eventType: 'JOB_COMPLETED',
    actor: job.createdBy,
    buildingId: building.buildingId,
    jobId: job.jobId,
    summary: `Workshop prep finished. The next construction can be ${buff}% faster.`,
    explanation: 'Collect the Workshop output to apply the next-build buff.',
    data: {
      kind: job.kind,
      buffPct: buff
    },
    createdAt: nowMs
  });
}

function markCompletedScoutJob(bundle, building, job, pendingEvents, nowMs) {
  const report = buildScoutReport(bundle, building, nowMs);
  building.outputBuffer = {
    scout_report: 1,
    scoutReport: report
  };
  building.state = 'OUTPUT_READY';
  building.updatedAt = nowMs;
  job.status = 'COMPLETED';
  job.updatedAt = nowMs;
  createEvent(pendingEvents, {
    plotId: bundle.plot.plotId,
    eventType: 'JOB_COMPLETED',
    actor: job.createdBy,
    buildingId: building.buildingId,
    jobId: job.jobId,
    summary: `Scout returned with ${report.title}.`,
    explanation: 'Collect the Expedition Board output to add this scout report to the plot receipts.',
    data: {
      kind: job.kind,
      output: clone(job.output),
      scoutReport: {
        reportId: report.reportId,
        title: report.title,
        siteType: report.siteType,
        risk: report.risk
      }
    },
    createdAt: nowMs
  });
}

function collectScoutReport(bundle, building, nowMs) {
  const pending = building.outputBuffer?.scoutReport && typeof building.outputBuffer.scoutReport === 'object'
    ? building.outputBuffer.scoutReport
    : buildScoutReport(bundle, building, nowMs);
  const report = normalizeScoutReports([pending])[0] || pending;
  const reports = normalizeScoutReports(bundle.plot.scoutReports);
  if (!reports.some((entry) => entry.reportId === report.reportId)) {
    reports.push(report);
  }
  bundle.plot.scoutReports = normalizeScoutReports(reports);
  building.outputBuffer = {};
  return {
    scout_report: 1,
    report: clone(report)
  };
}

function canPrepareSettlerConvoy(bundle, sitePlan) {
  if (!sitePlan) return false;
  if (Number(bundle.plot.hqLevel || 1) < SETTLER_CONVOY_DEF.bridgeRequiredHqLevel) return false;
  return sitePlan.reviewStatus === 'reviewed'
    && ['reviewed_claim_ready', 'claim_ready'].includes(String(sitePlan.promotionStatus || '').toLowerCase());
}

function convoyRouteForClaim(claimId, sitePlan, nowMs) {
  return {
    routeId: `route_${claimId}`,
    from: { kind: 'plot', id: sitePlan.originPlotId },
    to: { kind: 'site_plan', id: sitePlan.planId },
    direction: 'east',
    progress: 0,
    visualOnlyProjection: true,
    createdAt: Number(nowMs)
  };
}

function buildSettlementClaimFromSitePlan(bundle, sitePlan, job, actor, nowMs) {
  const claimId = `claim_${hashPayload({
    ownerPairId: bundle.ownerPairId || bundle.plot.pairId,
    originPlotId: bundle.plot.plotId,
    sitePlanId: sitePlan.planId
  }).slice(0, 16)}`;
  return {
    claimId,
    ownerPairId: bundle.ownerPairId || bundle.plot.pairId,
    originPlotId: bundle.plot.plotId,
    sitePlanId: sitePlan.planId,
    reportId: sitePlan.reportId,
    foundedPlotId: null,
    convoyJobId: job.jobId,
    approvalId: null,
    status: 'CONVOY_PREPARING',
    title: sitePlan.title,
    focus: sitePlan.focus,
    siteType: sitePlan.siteType,
    risk: sitePlan.risk,
    traits: clone(sitePlan.traits || []),
    resourceHints: clone(sitePlan.resourceHints || {}),
    route: convoyRouteForClaim(claimId, sitePlan, nowMs),
    cost: clone(SETTLER_CONVOY_DEF.cost),
    receipt: {
      kind: 'settler_convoy_prepared',
      planId: sitePlan.planId,
      reportId: sitePlan.reportId,
      cost: clone(SETTLER_CONVOY_DEF.cost),
      durationMs: SETTLER_CONVOY_DEF.durationMs,
      authorityBoundary: 'engine_owned_expansion_claim_no_world_map'
    },
    createdBy: actor,
    createdAt: Number(nowMs),
    updatedAt: Number(nowMs),
    convoyStartedAt: Number(job.startedAt),
    convoyEndsAt: Number(job.endsAt),
    foundedAt: null
  };
}

function markCompletedSettlerConvoyJob(bundle, building, job, pendingEvents, nowMs) {
  const claim = store.getSettlementClaim(job.output?.claimId);
  if (!claim || claim.status === 'FOUNDED') {
    job.status = 'CLAIMED';
    job.updatedAt = nowMs;
    if (building) {
      building.state = 'READY';
      building.updatedAt = nowMs;
    }
    return;
  }
  claim.status = 'CONVOY_ARRIVED';
  claim.updatedAt = nowMs;
  claim.route = {
    ...(claim.route || {}),
    progress: 1,
    arrivedAt: Number(nowMs),
    visualOnlyProjection: true
  };
  claim.receipt = {
    ...(claim.receipt || {}),
    arrivedAt: Number(nowMs),
    kind: 'settler_convoy_arrived'
  };
  store.writeSettlementClaim(claim);
  bundle.settlementClaims = normalizeSettlementClaims(store.listSettlementClaimsByOwner(claim.ownerPairId));
  job.status = 'CLAIMED';
  job.updatedAt = nowMs;
  if (building) {
    building.state = 'READY';
    building.updatedAt = nowMs;
  }
  createEvent(pendingEvents, {
    plotId: bundle.plot.plotId,
    eventType: 'SETTLER_CONVOY_ARRIVED',
    actor: job.createdBy,
    buildingId: building?.buildingId || null,
    jobId: job.jobId,
    summary: `Settler Convoy arrived for ${claim.title}.`,
    explanation: 'The convoy arrived at the reviewed Site Plan. Founding a settlement still requires an explicit action.',
    data: {
      claimId: claim.claimId,
      sitePlanId: claim.sitePlanId,
      status: claim.status,
      createsSecondPlot: false
    },
    createdAt: nowMs
  });
}

function completeConstructionOrUpgrade(bundle, building, job, pendingEvents, nowMs) {
  job.status = 'CLAIMED';
  job.updatedAt = nowMs;
  building.updatedAt = nowMs;

  if (job.kind === 'CONSTRUCT') {
    building.state = 'READY';
    createEvent(pendingEvents, {
      plotId: bundle.plot.plotId,
      eventType: 'BUILDING_COMPLETED',
      actor: job.createdBy,
      buildingId: building.buildingId,
      jobId: job.jobId,
      summary: `${BUILDING_LABELS[building.type]} construction completed.`,
      explanation: job.explanation,
      data: { type: building.type },
      createdAt: nowMs
    });
    return;
  }

  if (building.type === 'HQ') {
    bundle.plot.hqLevel = Math.min(6, bundle.plot.hqLevel + 1);
    building.level = bundle.plot.hqLevel;
    building.state = 'READY';
    applyRuleChangesForHq(bundle.plot);
    addTownXp(bundle.plot, 20);
    createEvent(pendingEvents, {
      plotId: bundle.plot.plotId,
      eventType: 'HQ_UPGRADED',
      actor: job.createdBy,
      buildingId: building.buildingId,
      jobId: job.jobId,
      summary: `Headquarters reached Level ${bundle.plot.hqLevel}.`,
      explanation: `HQ Level ${bundle.plot.hqLevel} unlocked ${levelRules(bundle.plot.hqLevel).unlocks.join(', ')}.`,
      data: {
        hqLevel: bundle.plot.hqLevel,
        unlocks: clone(levelRules(bundle.plot.hqLevel).unlocks),
        permissionUnlocks: clone(levelRules(bundle.plot.hqLevel).permissionUnlocks)
      },
      createdAt: nowMs
    });
    return;
  }

  building.level += 1;
  building.state = 'READY';
  createEvent(pendingEvents, {
    plotId: bundle.plot.plotId,
    eventType: 'BUILDING_COMPLETED',
    actor: job.createdBy,
    buildingId: building.buildingId,
    jobId: job.jobId,
    summary: `${BUILDING_LABELS[building.type]} upgraded to Level ${building.level}.`,
    explanation: job.explanation,
    data: {
      type: building.type,
      level: building.level
    },
    createdAt: nowMs
  });
}

function simulateBundleTo(bundle, targetMs, pendingEvents) {
  const plot = bundle.plot;
  const startMs = Number(plot.lastSimulatedAt || 0);
  let safeTargetMs = Math.max(startMs, Number(targetMs || 0));
  // Offline catch-up clamp: advance at most OFFLINE_CLAMP_MS per call so
  // a player returning after hours or days cannot accrue unbounded production.
  if (startMs > 0 && safeTargetMs - startMs > OFFLINE_CLAMP_MS) {
    safeTargetMs = startMs + OFFLINE_CLAMP_MS;
  }
  maybeResetDailyCounters(plot, safeTargetMs);

  while (true) {
    maybeStartQueuedConstructionJobs(bundle, Number(plot.lastSimulatedAt || safeTargetMs), pendingEvents);
    const running = bundle.jobs
      .filter((job) => job.status === 'RUNNING' && Number.isFinite(Number(job.endsAt)))
      .sort((a, b) => Number(a.endsAt || 0) - Number(b.endsAt || 0));
    const next = running[0];
    if (!next || Number(next.endsAt || 0) > safeTargetMs) break;
    const eventTime = Number(next.endsAt || safeTargetMs);
    plot.lastSimulatedAt = eventTime;
    const finishing = running.filter((job) => Number(job.endsAt || 0) === eventTime);
    for (const job of finishing) {
      const building = findBuilding(bundle, job.buildingId);
      if (!building) {
        job.status = 'FAILED';
        job.updatedAt = eventTime;
        continue;
      }
      if (job.kind === 'CONSTRUCT' || job.kind === 'UPGRADE') {
        completeConstructionOrUpgrade(bundle, building, job, pendingEvents, eventTime);
        continue;
      }
      if (job.kind === 'SETTLER_CONVOY') {
        markCompletedSettlerConvoyJob(bundle, building, job, pendingEvents, eventTime);
        continue;
      }
	      if (building.type === 'WORKSHOP') {
	        markCompletedWorkshopJob(bundle, building, job, pendingEvents, eventTime);
	        continue;
	      }
	      if (job.kind === 'SCOUT') {
	        markCompletedScoutJob(bundle, building, job, pendingEvents, eventTime);
	        continue;
	      }
	      markCompletedProductionJob(bundle, building, job, pendingEvents, eventTime);
    }
  }

  plot.lastSimulatedAt = safeTargetMs;
  plot.updatedAt = Math.max(Number(plot.updatedAt || 0), safeTargetMs);
}

function applyPendingEvents(bundle, pendingEvents) {
  if (!pendingEvents.length) return [];
  const inserted = store.appendEvents(pendingEvents);
  bundle.events = bundle.events.concat(inserted);
  return inserted;
}

function persistBundle(bundle) {
  store.writePlot(bundle.plot);
  store.writeBuildings(bundle.buildings);
  store.writeJobs(bundle.jobs);
  store.writePolicy(bundle.policy);
}

function buildMutationResponse(bundle, pendingEvents, extras = {}) {
  const inserted = applyPendingEvents(bundle, pendingEvents);
  persistBundle(bundle);
  const { state, recap, stateHash } = buildState(bundle, {
    includeReplay: false,
    includePublicSummary: true
  });
  const worldDelta = inserted.map((event) => makeWorldDelta(event.eventType, event.summary, event.buildingId || event.jobId || bundle.plot.plotId));
  return successEnvelope({
    plotId: bundle.plot.plotId,
    worldDelta,
    state,
    recap,
    stateHash,
    extras
  });
}

function withIdempotency({
  pairId,
  houseId = null,
  plotId = null,
  actionName,
  idempotencyKey,
  requestPayload,
  nowMs,
  mutator
}) {
  return store.withTransaction(() => {
    const bundle = ensurePlotBundle({ pairId, houseId, plotId, nowMs });
    if (!verifyPlotAccess(bundle, pairId, plotId, nowMs)) {
      return errorEnvelope(plotId, 'UNAUTHORIZED', 'Requested plot does not match the current session plot.', false);
    }

    const key = typeof idempotencyKey === 'string' ? idempotencyKey.trim() : '';
    if (!key) {
      return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'Mutation requests require idempotencyKey.', false);
    }
    const requestHash = hashPayload({ actionName, requestPayload });
    const existing = store.getIdempotencyRecord(bundle.plot.plotId, actionName, key);
    if (existing) {
      if (existing.requestHash !== requestHash) {
        return errorEnvelope(bundle.plot.plotId, 'IDEMPOTENCY_CONFLICT', 'The same idempotency key was reused with different arguments.', false);
      }
      return existing.response;
    }

    const pendingEvents = [];
    simulateBundleTo(bundle, nowMs, pendingEvents);
    maybeGrantDailyReturnBonus(bundle, nowMs, pendingEvents);
    const result = mutator(bundle, pendingEvents);
    if (result?.ok === false) return result;
    const response = buildMutationResponse(bundle, pendingEvents, result?.extras || {});
    store.writeIdempotencyRecord({
      plotId: bundle.plot.plotId,
      actionName,
      idempotencyKey: key,
      requestHash,
      response,
      createdAt: nowMs
    });
    return response;
  });
}

function mutationActor(input) {
  const raw = String(input || '').trim().toUpperCase();
  return raw === 'AGENT' ? 'AGENT' : raw === 'SYSTEM' ? 'SYSTEM' : 'HUMAN';
}

function getFoundersPlotState({
  pairId,
  houseId = null,
  plotId = null,
  nowMs,
  includeReplay = false,
  includePublicSummary = true,
  includeAdvancedReadModels = true,
  includeVisualActors = true
}) {
  return store.withTransaction(() => {
    const bundle = ensurePlotBundle({ pairId, houseId, plotId, nowMs });
    if (!verifyPlotAccess(bundle, pairId, plotId, nowMs)) {
      return errorEnvelope(plotId, 'UNAUTHORIZED', 'Requested plot does not match the current session plot.', false);
    }

    const pendingEvents = [];
    simulateBundleTo(bundle, nowMs, pendingEvents);
    maybeGrantDailyReturnBonus(bundle, nowMs, pendingEvents);
    maybeCreatePendingRecap(bundle.plot, nowMs);
    const inserted = applyPendingEvents(bundle, pendingEvents);
    persistBundle(bundle);
    const { state, recap, stateHash } = buildState(bundle, {
      includeReplay,
      includePublicSummary,
      includeAdvancedReadModels,
      includeVisualActors
    });
    return successEnvelope({
      plotId: bundle.plot.plotId,
      worldDelta: inserted.map((event) => makeWorldDelta(event.eventType, event.summary, event.buildingId || event.jobId || bundle.plot.plotId)),
      state,
      recap,
      stateHash
    });
  });
}

function setFoundersPlotPolicy({
  pairId,
  houseId = null,
  plotId = null,
  input = {},
  nowMs
}) {
  return store.withTransaction(() => {
    const bundle = ensurePlotBundle({ pairId, houseId, plotId, nowMs });
    if (!verifyPlotAccess(bundle, pairId, plotId, nowMs)) {
      return errorEnvelope(plotId, 'UNAUTHORIZED', 'Requested plot does not match the current session plot.', false);
    }
    const availability = policyAvailabilityForHq(bundle.plot.hqLevel);
    const next = clone(bundle.policy);
    const pendingEvents = [];

    if (typeof input.collectOutputs === 'boolean' && availability.collectOutputs) next.collectOutputs = input.collectOutputs;
    if (typeof input.queueProduction === 'boolean' && availability.queueProduction) next.queueProduction = input.queueProduction;
    if (typeof input.setPriority === 'boolean' && availability.setPriority) next.setPriority = input.setPriority;
    if (typeof input.sellSurplusFood === 'boolean' && availability.sellSurplusFood) next.sellSurplusFood = input.sellSurplusFood;
    if (typeof input.emergencyPause === 'boolean') next.emergencyPause = input.emergencyPause;
    if (Number.isFinite(Number(input.sellDailyCoinCap))) {
      next.sellDailyCoinCap = Math.max(0, Math.floor(Number(input.sellDailyCoinCap)));
    }
    if (Number.isFinite(Number(input.maxAutonomousActionsPerHour))) {
      next.maxAutonomousActionsPerHour = Math.max(1, Math.floor(Number(input.maxAutonomousActionsPerHour)));
    }
    next.updatedAt = nowMs;
    bundle.policy = next;
    createEvent(pendingEvents, {
      plotId: bundle.plot.plotId,
      eventType: 'AGENT_PERMISSION_CHANGED',
      actor: 'HUMAN',
      summary: 'Foreman permissions updated.',
      explanation: 'The human updated one or more Founders Plot policy toggles.',
      data: { policy: clone(next) },
      createdAt: nowMs
    });
    return buildMutationResponse(bundle, pendingEvents);
  });
}

function resolveApproval({
  pairId,
  houseId = null,
  plotId = null,
  approvalId,
  decision,
  note = '',
  nowMs
}) {
  return store.withTransaction(() => {
    const bundle = ensurePlotBundle({ pairId, houseId, plotId, nowMs });
    const approval = store.getApproval(approvalId);
    if (!approval || approval.plotId !== bundle.plot.plotId) {
      return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'Approval request not found for this plot.', false);
    }
    approval.status = String(decision || '').trim().toLowerCase() === 'approve' ? 'APPROVED' : 'REJECTED';
    approval.resolutionNote = note ? String(note).trim().slice(0, 240) : null;
    approval.updatedAt = nowMs;
    approval.resolvedAt = nowMs;
    store.writeApproval(approval);
    bundle.approvals = store.listApprovals(bundle.plot.plotId);
    const pendingEvents = [];
    createEvent(pendingEvents, {
      plotId: bundle.plot.plotId,
      eventType: 'AGENT_PERMISSION_CHANGED',
      actor: 'HUMAN',
      summary: approval.status === 'APPROVED'
        ? 'A pending approval request was approved.'
        : 'A pending approval request was rejected.',
      explanation: approval.title,
      data: {
        approvalId: approval.approvalId,
        actionName: approval.actionName,
        status: approval.status
      },
      createdAt: nowMs
    });
    return buildMutationResponse(bundle, pendingEvents, { approval });
  });
}

function acknowledgeRecap({
  pairId,
  houseId = null,
  plotId = null,
  nowMs
}) {
  return store.withTransaction(() => {
    const bundle = ensurePlotBundle({ pairId, houseId, plotId, nowMs });
    bundle.plot.pendingRecapFrom = null;
    bundle.plot.pendingRecapTo = null;
    persistBundle(bundle);
    const { state, recap, stateHash } = buildState(bundle, { includeReplay: false, includePublicSummary: true });
    return successEnvelope({
      plotId: bundle.plot.plotId,
      worldDelta: [],
      state,
      recap,
      stateHash
    });
  });
}

function createApprovalRequest({
  pairId,
  houseId = null,
  plotId = null,
  actionName,
  requestedParams = {},
  title,
  body,
  actor = 'AGENT',
  idempotencyKey,
  nowMs
}) {
  return withIdempotency({
    pairId,
    houseId,
    plotId,
    actionName: 'request_user_approval',
    idempotencyKey,
    requestPayload: { actionName, requestedParams, title, body, actor },
    nowMs,
    mutator(bundle, pendingEvents) {
      if (!actionName || !title || !body) {
        return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'Approval requests require action, title, and body.', false);
      }
      const actionHash = hashPayload({ action: actionName, params: requestedParams });
      const existing = store.findMatchingApproval(bundle.plot.plotId, actionName, actionHash);
      if (existing) {
        return {
          ok: true,
          extras: { approval: existing }
        };
      }
      const approval = {
        approvalId: randomId('approval'),
        plotId: bundle.plot.plotId,
        actionName,
        actionHash,
        title: String(title).trim().slice(0, 120),
        body: String(body).trim().slice(0, 320),
        requestedParams: clone(requestedParams),
        status: 'PENDING',
        createdBy: mutationActor(actor),
        resolutionNote: null,
        usedAt: null,
        createdAt: nowMs,
        updatedAt: nowMs,
        resolvedAt: null
      };
      store.writeApproval(approval);
      bundle.approvals = store.listApprovals(bundle.plot.plotId);
      createEvent(pendingEvents, {
        plotId: bundle.plot.plotId,
        eventType: 'AGENT_PERMISSION_CHANGED',
        actor: mutationActor(actor),
        summary: 'A user approval request is waiting in the queue.',
        explanation: approval.title,
        data: {
          approvalId: approval.approvalId,
          actionName: approval.actionName
        },
        createdAt: nowMs
      });
      return {
        ok: true,
        extras: { approval }
      };
    }
  });
}

function placeBuilding({
  pairId,
  houseId = null,
  plotId = null,
  type,
  x,
  y,
  actor = 'HUMAN',
  idempotencyKey,
  nowMs
}) {
  return withIdempotency({
    pairId,
    houseId,
    plotId,
    actionName: 'place_building',
    idempotencyKey,
    requestPayload: { type, x, y, actor },
    nowMs,
    mutator(bundle, pendingEvents) {
      const safeActor = mutationActor(actor);
      const buildingType = String(type || '').trim().toUpperCase();
      const def = BUILDING_DEFS[buildingType];
      if (!def || buildingType === 'HQ') {
        return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'Only buildable Phase 1 structure types may be placed.', false);
      }
      if (!unlockedBuildingsForHq(bundle.plot.hqLevel).includes(buildingType)) {
        return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', `${BUILDING_LABELS[buildingType] || buildingType} is not unlocked yet.`, false);
      }
      const pad = padAt(x, y);
      if (!pad || pad.kind !== 'BUILD') {
        return errorEnvelope(bundle.plot.plotId, 'OUT_OF_BOUNDS', 'Buildings may only be placed on approved build pads.', false);
      }
      const occupied = bundle.buildings.find((building) => building.x === pad.x && building.y === pad.y);
      if (occupied) {
        return errorEnvelope(bundle.plot.plotId, 'BUILD_SLOT_OCCUPIED', 'That build pad is already occupied.', false);
      }
      if (safeActor === 'AGENT') {
        const approval = consumeActionApproval(bundle, 'place_building', {
          type: buildingType,
          x: Number(x),
          y: Number(y)
        }, nowMs);
        if (!approval) {
          return errorEnvelope(
            bundle.plot.plotId,
            'FORBIDDEN_POLICY',
            'Agent building placement requires a matching human approval request.',
            true,
            { requiresApproval: true }
          );
        }
      }
      const paid = deductResources(bundle.plot.inventory, def.construction.cost);
      if (!paid.ok) {
        return errorEnvelope(bundle.plot.plotId, 'OUT_OF_RESOURCES', 'Not enough resources to place that building.', false);
      }
      bundle.plot.inventory = paid.inventory;
      bundle.plot.seenBuildingTypes = includesOnce(bundle.plot.seenBuildingTypes, buildingType);
      addTownXp(bundle.plot, 10);
      const buildingId = randomId('bldg');
      const jobId = randomId('job');
      const building = {
        buildingId,
        plotId: bundle.plot.plotId,
        objectInstanceId: null,
        type: buildingType,
        level: 1,
        x: Number(x),
        y: Number(y),
        state: 'UNDER_CONSTRUCTION',
        outputBuffer: {},
        priority: buildingType === 'LUMBER_CAMP'
          ? 'WOOD'
          : buildingType === 'FARM_PLOT'
            ? 'FOOD'
            : buildingType === 'QUARRY'
              ? 'STONE'
              : 'BALANCED',
        createdAt: nowMs,
        updatedAt: nowMs
      };
      const job = {
        jobId,
        plotId: bundle.plot.plotId,
        buildingId,
        kind: 'CONSTRUCT',
        input: clone(def.construction.cost),
        output: {},
        startedAt: null,
        endsAt: null,
        durationMs: Number(def.construction.durationMs || 0),
        status: 'QUEUED',
        createdBy: safeActor,
        explanation: safeActor === 'AGENT'
          ? `Foreman placed ${BUILDING_LABELS[buildingType]} on an approved pad after human approval.`
          : `Placed ${BUILDING_LABELS[buildingType]} manually.`,
        createdAt: nowMs,
        updatedAt: nowMs
      };
      bundle.buildings.push(building);
      bundle.jobs.push(job);
      createEvent(pendingEvents, {
        plotId: bundle.plot.plotId,
        eventType: 'BUILDING_PLACED',
        actor: safeActor,
        buildingId,
        jobId,
        summary: `${BUILDING_LABELS[buildingType]} was placed on pad (${x}, ${y}).`,
        explanation: job.explanation,
        data: {
          type: buildingType,
          x: Number(x),
          y: Number(y),
          cost: clone(def.construction.cost)
        },
        createdAt: nowMs
      });
      if (safeActor === 'AGENT') {
        markAgentAction(bundle, pendingEvents, 'place_building', job.explanation, nowMs);
      }
      maybeStartQueuedConstructionJobs(bundle, nowMs, pendingEvents);
      return {
        ok: true,
        extras: { building: clone(building) }
      };
    }
  });
}

function queueJob({
  pairId,
  houseId = null,
  plotId = null,
  buildingId,
  kind,
  actor = 'HUMAN',
  idempotencyKey,
  nowMs
}) {
  return withIdempotency({
    pairId,
    houseId,
    plotId,
    actionName: 'queue_job',
    idempotencyKey,
    requestPayload: { buildingId, kind, actor },
    nowMs,
    mutator(bundle, pendingEvents) {
      const safeActor = mutationActor(actor);
      const building = findBuilding(bundle, buildingId);
      if (!building) {
        return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'Building not found on this plot.', false);
      }
      if (building.state !== 'READY') {
        return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'Only READY buildings can start a new job.', false);
      }
      const active = findActiveJobForBuilding(bundle, buildingId);
      if (active) {
        return errorEnvelope(bundle.plot.plotId, 'JOB_ALREADY_RUNNING', 'This building already has an active or claimable job.', false);
      }
      const def = BUILDING_DEFS[building.type];
      if (!def || typeof def.produces !== 'function') {
        return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'This building cannot queue jobs.', false);
      }
      const baseSpec = def.produces(building.level);
      const spec = applyDoctrineEffectsToJobSpec(bundle, building.type, baseSpec);
      const safeKind = String(kind || '').trim().toUpperCase();
      if (safeKind !== spec.kind) {
        return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', `Expected job kind ${spec.kind} for this building.`, false);
      }
      if (safeActor === 'AGENT') {
        const permissionKey = safeKind === 'SELL' ? 'sellSurplusFood' : 'queueProduction';
        const denied = assertAgentPolicy(bundle, permissionKey, {
          nowMs,
          actionName: safeKind,
          retryableMessage: safeKind === 'SELL'
            ? 'Agent selling is locked until HQ 5 and explicit approval are both enabled.'
            : 'Agent queueing is locked until HQ 3 and explicit approval are both enabled.'
        });
        if (denied) return denied;
      }
      maybeResetDailyCounters(bundle.plot, nowMs);
      if (safeKind === 'SELL' && safeActor === 'AGENT') {
        const projectedCoin = bundle.plot.dailySoldCoin + Number(spec.output.coin || 0);
        if (projectedCoin > Number(bundle.policy.sellDailyCoinCap || 0)) {
          return errorEnvelope(bundle.plot.plotId, 'FORBIDDEN_POLICY', 'Agent daily sell cap would be exceeded by this sell job.', true, {
            reason: 'daily_sell_cap'
          });
        }
      }
      const paid = deductResources(bundle.plot.inventory, spec.input);
      if (!paid.ok) {
        return errorEnvelope(bundle.plot.plotId, 'OUT_OF_RESOURCES', 'Not enough resources to start that job.', false);
      }
      bundle.plot.inventory = paid.inventory;
      building.state = 'PRODUCING';
      building.updatedAt = nowMs;
      const job = {
        jobId: randomId('job'),
        plotId: bundle.plot.plotId,
        buildingId: building.buildingId,
        kind: spec.kind,
        input: clone(spec.input),
        output: clone(spec.output),
        startedAt: nowMs,
        endsAt: nowMs + Number(spec.durationMs || 0),
        durationMs: Number(spec.durationMs || 0),
	        status: 'RUNNING',
	        createdBy: safeActor,
	        explanation: safeKind === 'SELL'
	          ? 'Sell surplus food for a controlled coin return.'
	          : safeKind === 'SCOUT'
	            ? 'Dispatch a scout to turn post-HQ3 expansion into a concrete report receipt.'
	            : `Queue ${BUILDING_LABELS[building.type]} production to relieve the current bottleneck.`,
        createdAt: nowMs,
        updatedAt: nowMs
      };
      bundle.jobs.push(job);
      createEvent(pendingEvents, {
        plotId: bundle.plot.plotId,
        eventType: 'JOB_QUEUED',
        actor: safeActor,
        buildingId: building.buildingId,
        jobId: job.jobId,
	        summary: `${BUILDING_LABELS[building.type]} queued a ${spec.kind.toLowerCase()} job.`,
        explanation: job.explanation,
        data: {
          input: clone(job.input),
          output: clone(job.output),
          kind: job.kind,
          baseDurationMs: Number(spec.baseDurationMs || job.durationMs),
          durationMs: job.durationMs,
          doctrineEffect: spec.doctrineEffect ? clone(spec.doctrineEffect) : null
        },
        createdAt: nowMs
      });
      if (safeActor === 'AGENT') {
        if (safeKind === 'SELL') {
          bundle.plot.dailySoldCoin += Number(spec.output.coin || 0);
        }
        const tierKey = safeKind === 'SELL' ? 'sellSurplusFood' : 'queueProduction';
        markAgentAction(bundle, pendingEvents, 'queue_job', job.explanation, nowMs, tierKey);
      }
      return {
        ok: true,
        extras: { job: clone(job) }
      };
    }
  });
}

function collectOutputs({
  pairId,
  houseId = null,
  plotId = null,
  buildingId,
  actor = 'HUMAN',
  idempotencyKey,
  nowMs
}) {
  return withIdempotency({
    pairId,
    houseId,
    plotId,
    actionName: 'collect_outputs',
    idempotencyKey,
    requestPayload: { buildingId, actor },
    nowMs,
    mutator(bundle, pendingEvents) {
      const safeActor = mutationActor(actor);
      const building = findBuilding(bundle, buildingId);
      if (!building) {
        return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'Building not found on this plot.', false);
      }
      if (building.state !== 'OUTPUT_READY') {
        return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'That building has no ready output to collect.', false);
      }
      if (safeActor === 'AGENT') {
        const denied = assertAgentPolicy(bundle, 'collectOutputs', {
          nowMs,
          actionName: 'collect_outputs',
          retryableMessage: 'Agent collection is locked until HQ 2 and explicit approval are both enabled.'
        });
        if (denied) return denied;
      }
      let collected = {};
	      if (building.type === 'WORKSHOP') {
	        const buffPct = Number(BUILDING_DEFS.WORKSHOP.produces(building.level).buffPct || 20);
	        bundle.plot.nextBuildBuffPct = buffPct;
	        collected = { construction_buff_pct: buffPct };
	        building.outputBuffer = {};
	      } else if (building.type === 'EXPEDITION_BOARD') {
	        collected = collectScoutReport(bundle, building, nowMs);
	      } else {
	        const transfer = addResourcesWithCaps(bundle.plot.inventory, building.outputBuffer || {}, bundle.plot.storageCaps);
	        bundle.plot.inventory = transfer.inventory;
	        building.outputBuffer = transfer.remainder;
	        collected = transfer.applied;
	      }
	      const stillBuffered = RESOURCE_KEYS.some((key) => Number(building.outputBuffer?.[key] || 0) > 0)
	        || !!building.outputBuffer?.scoutReport;
      building.state = stillBuffered ? 'OUTPUT_READY' : 'READY';
      building.updatedAt = nowMs;
      const completedJob = bundle.jobs
        .filter((job) => job.buildingId === building.buildingId && job.status === 'COMPLETED')
        .sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0))[0];
      if (completedJob && building.state === 'READY') {
        completedJob.status = 'CLAIMED';
        completedJob.updatedAt = nowMs;
      }
      const firstCollect = !(bundle.plot.collectedBuildingTypes || []).includes(building.type);
      bundle.plot.collectedBuildingTypes = includesOnce(bundle.plot.collectedBuildingTypes, building.type);
      if (firstCollect) {
        addTownXp(bundle.plot, 5);
      }
      createEvent(pendingEvents, {
        plotId: bundle.plot.plotId,
        eventType: 'OUTPUT_COLLECTED',
        actor: safeActor,
        buildingId: building.buildingId,
        jobId: completedJob?.jobId || null,
	        summary: building.type === 'WORKSHOP'
	          ? `Workshop output collected. The next construction now has a ${bundle.plot.nextBuildBuffPct}% speed buff.`
	          : building.type === 'EXPEDITION_BOARD'
	            ? `Scout report collected: ${collected.report?.title || 'nearby site report'}.`
	            : `${BUILDING_LABELS[building.type]} outputs were collected.`,
        explanation: safeActor === 'AGENT'
          ? 'The foreman collected finished outputs because the policy toggle is enabled.'
          : 'Collected manually from the building output buffer.',
        data: {
          collected: clone(collected)
        },
        createdAt: nowMs
      });
      if (safeActor === 'AGENT') {
        markAgentAction(bundle, pendingEvents, 'collect_outputs', 'Foreman collected finished outputs from an approved building.', nowMs, 'collectOutputs');
      }
      return {
        ok: true,
        extras: { collected }
      };
    }
  });
}

function draftSitePlan({
  pairId,
  houseId = null,
  plotId = null,
  reportId,
  title = '',
  focus = 'balanced',
  actor = 'HUMAN',
  idempotencyKey,
  nowMs
}) {
  return withIdempotency({
    pairId,
    houseId,
    plotId,
    actionName: 'draft_site_plan',
    idempotencyKey,
    requestPayload: { reportId, title, focus, actor },
    nowMs,
    mutator(bundle, pendingEvents) {
      const safeActor = mutationActor(actor);
      if (Number(bundle.plot.hqLevel || 1) < 3) {
        return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'Site Plans unlock after HQ Level 3 and the first Scout Report.', false, {
          reason: 'hq_locked'
        });
      }
      const reports = normalizeScoutReports(bundle.plot.scoutReports);
      const safeReportId = safeText(reportId, '', 120);
      const report = reports.find((entry) => entry.reportId === safeReportId);
      if (!report) {
        return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'A Site Plan must be grounded in a collected Scout Report.', false, {
          reason: 'missing_scout_report'
        });
      }
      const existing = normalizeSitePlans(bundle.plot.sitePlans).find((plan) => plan.reportId === report.reportId);
      if (existing) {
        return {
          ok: true,
          extras: { sitePlan: clone(existing), existing: true }
        };
      }
      const sitePlan = buildSitePlanFromReport(bundle, report, { title, focus }, nowMs);
      const nextPlans = normalizeSitePlans([...(bundle.plot.sitePlans || []), sitePlan]);
      bundle.plot.sitePlans = nextPlans;
      createEvent(pendingEvents, {
        plotId: bundle.plot.plotId,
        eventType: 'SITE_PLAN_DRAFTED',
        actor: safeActor,
        summary: `Site Plan drafted from ${report.title}.`,
        explanation: 'A Scout Report became a canonical planning record, but no territory or second plot was claimed.',
        data: {
          planId: sitePlan.planId,
          reportId: report.reportId,
          focus: sitePlan.focus,
          promotionStatus: sitePlan.promotionStatus,
          authorityBoundary: sitePlan.authorityBoundary
        },
        createdAt: nowMs
      });
      return {
        ok: true,
        extras: { sitePlan: clone(sitePlan), existing: false }
      };
    }
  });
}

function draftSitePlanFromPacket({
  pairId,
  houseId = null,
  plotId = null,
  packetId = '',
  title = '',
  focus = 'balanced',
  actor = 'HUMAN',
  actorType = null,
  idempotencyKey,
  nowMs
}) {
  const requestedPacketId = safeText(packetId, '', 160);
  const requestedActor = mutationActor(actorType || actor);
  return withIdempotency({
    pairId,
    houseId,
    plotId,
    actionName: 'draft_site_plan_from_packet',
    idempotencyKey,
    requestPayload: { packetId: requestedPacketId, title, focus, actor: requestedActor },
    nowMs,
    mutator(bundle, pendingEvents) {
      if (Number(bundle.plot.hqLevel || 1) < 3) {
        return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'Packet Site Plans unlock after HQ Level 3 and a Scout Sector packet.', false, {
          reason: 'hq_locked'
        });
      }
      const beforePlans = normalizeSitePlans(bundle.plot.sitePlans);
      const beforeMap = buildExpeditionMapReadModel(bundle);
      const candidate = expeditionSurveyBridgeCandidateForPacket(beforeMap, requestedPacketId);
      const safePacketId = safeText(candidate?.packetId || requestedPacketId, '', 160);
      const packet = (beforeMap.eventPackets || []).find((entry) => entry.packetId === safePacketId) || null;
      const cell = (beforeMap.cells || []).find((entry) => entry.cellId === candidate?.cellId) || null;
      if (!candidate || !packet || !cell) {
        return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'Packet Site Plan draft requires one Scout Sector Event Packet on a known current-plot cell.', false, {
          reason: requestedPacketId ? 'missing_packet_candidate' : 'no_packet_candidate',
          packetId: requestedPacketId || null
        });
      }
      if (!['known', 'discovered'].includes(String(cell.fogState || ''))) {
        return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'Packet Site Plan draft requires a known or discovered current-plot cell.', false, {
          reason: 'cell_not_known',
          packetId: packet.packetId,
          cellId: cell.cellId,
          fogState: cell.fogState
        });
      }
      const existing = beforePlans.find((plan) => (
        sitePlanPacketSourceId(plan) === packet.packetId
        || (plan.source === 'scout_sector_event_packet' && plan.reportId === packet.packetId)
      ));
      if (existing) {
        const afterMap = buildExpeditionMapReadModel(bundle);
        return {
          ok: true,
          extras: {
            sitePlan: clone(existing),
            existing: true,
            packetId: packet.packetId,
            cellId: cell.cellId,
            proof: buildPacketSitePlanProof({
              beforeMap,
              afterMap,
              sitePlansBefore: beforePlans,
              sitePlansAfter: beforePlans,
              packet,
              cell,
              sitePlan: existing,
              existing: true
            }),
            expeditionMap: afterMap
          }
        };
      }
      if (candidate.commandState?.serverMutationImplemented !== true || candidate.commandState?.actionName !== 'et.plot.draft_site_plan_from_packet') {
        return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'Scout Packet bridge is not ready for packet-to-plan drafting.', false, {
          reason: 'packet_plan_command_unavailable',
          packetId: packet.packetId,
          commandId: candidate.commandState?.commandId || null
        });
      }
      const approvalParams = { packetId: packet.packetId, cellId: cell.cellId };
      let consumedApproval = null;
      if (requestedActor === 'AGENT') {
        consumedApproval = consumeActionApproval(bundle, 'draft_site_plan_from_packet', approvalParams, nowMs);
        if (!consumedApproval) {
          return errorEnvelope(bundle.plot.plotId, 'FORBIDDEN_POLICY', 'Agent packet Site Plan drafting requires matching human approval.', true, {
            requiresApproval: true,
            actionName: 'draft_site_plan_from_packet',
            requestedParams: approvalParams
          });
        }
      }

      const sitePlan = buildSitePlanFromExpeditionPacket(bundle, packet, cell, { title, focus }, nowMs);
      const nextPlans = normalizeSitePlans([...beforePlans, sitePlan]);
      bundle.plot.sitePlans = nextPlans;
      bundle.plot.updatedAt = Number(nowMs);
      const afterMap = buildExpeditionMapReadModel(bundle);
      const proof = buildPacketSitePlanProof({
        beforeMap,
        afterMap,
        sitePlansBefore: beforePlans,
        sitePlansAfter: nextPlans,
        packet,
        cell,
        sitePlan
      });
      createEvent(pendingEvents, {
        plotId: bundle.plot.plotId,
        eventType: 'EXPEDITION_PACKET_SITE_PLAN_DRAFTED',
        actor: requestedActor,
        summary: `Site Plan drafted from Scout Sector packet ${packet.packetId}.`,
        explanation: 'HQ16I records one planning-only Site Plan from an existing Scout Sector Event Packet. It does not create a Surveyor, route, resource, reward, territory, Atlas execution, Generated Universe runtime behavior, or external effect.',
        data: {
          planId: sitePlan.planId,
          packetId: packet.packetId,
          cellId: cell.cellId,
          focus: sitePlan.focus,
          source: sitePlan.source,
          authorityBoundary: sitePlan.authorityBoundary,
          proof,
          approvalId: consumedApproval?.approvalId || null
        },
        createdAt: nowMs
      });
      if (requestedActor === 'AGENT') {
        markAgentAction(bundle, pendingEvents, 'draft_site_plan_from_packet', 'Foreman drafted one packet-grounded Site Plan after matching human approval.', nowMs);
      }
      return {
        ok: true,
        extras: {
          sitePlan: clone(sitePlan),
          existing: false,
          packetId: packet.packetId,
          cellId: cell.cellId,
          proof,
          expeditionMap: afterMap
        }
      };
    }
  });
}

function reviewSitePlan({
  pairId,
  houseId = null,
  plotId = null,
  planId,
  reviewNote = '',
  actor = 'HUMAN',
  idempotencyKey,
  nowMs
}) {
  return withIdempotency({
    pairId,
    houseId,
    plotId,
    actionName: 'review_site_plan',
    idempotencyKey,
    requestPayload: { planId, reviewNote, actor },
    nowMs,
    mutator(bundle, pendingEvents) {
      const safeActor = mutationActor(actor);
      if (Number(bundle.plot.hqLevel || 1) < 6) {
        return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'Site Plan review unlocks at HQ Level 6 Settlement Charter.', false, {
          reason: 'hq_locked',
          requiredHqLevel: 6
        });
      }
      const safePlanId = safeText(planId, '', 120);
      const plans = normalizeSitePlans(bundle.plot.sitePlans);
      const planIndex = plans.findIndex((entry) => entry.planId === safePlanId);
      if (planIndex < 0) {
        return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'A reviewed Site Plan must start from an existing canonical Site Plan draft.', false, {
          reason: 'missing_site_plan'
        });
      }
      const plan = plans[planIndex];
      const grounding = sitePlanGroundingStatus(bundle, plan);
      if (!grounding.ok) {
        return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'A reviewed Site Plan must remain grounded in its source Scout Report or Scout Sector packet.', false, {
          reason: grounding.source,
          reportId: plan.reportId,
          packetId: sitePlanPacketSourceId(plan) || null
        });
      }
      if (plan.reviewStatus === 'reviewed' || plan.promotionStatus === 'reviewed_claim_ready') {
        return {
          ok: true,
          extras: { sitePlan: clone(plan), existing: true }
        };
      }
      const reviewed = {
        ...plan,
        status: 'REVIEWED',
        promotionStatus: 'reviewed_claim_ready',
        reviewStatus: 'reviewed',
        authorityBoundary: 'claim_ready_planning_only_no_territory',
        reviewedAt: Number(nowMs),
        reviewNote: safeText(reviewNote, 'Reviewed for future claim readiness. No territory or second plot created.', 320),
        recommendedNext: 'Hold for HQ7 Settler Convoy claim rules before creating territory, routes, convoys, or a second plot.'
      };
      plans[planIndex] = reviewed;
      bundle.plot.sitePlans = normalizeSitePlans(plans);
      createEvent(pendingEvents, {
        plotId: bundle.plot.plotId,
        eventType: 'SITE_PLAN_REVIEWED',
        actor: safeActor,
        summary: `Site Plan reviewed for claim readiness: ${reviewed.title}.`,
        explanation: 'HQ6 Settlement Charter review marks the plan as claim-ready planning state only; no territory, route, convoy, resource payout, or second plot was created.',
        data: {
          planId: reviewed.planId,
          reportId: reviewed.reportId,
          promotionStatus: reviewed.promotionStatus,
          reviewStatus: reviewed.reviewStatus,
          authorityBoundary: reviewed.authorityBoundary,
          reviewedAt: reviewed.reviewedAt
        },
        createdAt: nowMs
      });
      return {
        ok: true,
        extras: { sitePlan: clone(reviewed), existing: false }
      };
    }
  });
}

function selectDoctrine({
  pairId,
  houseId = null,
  plotId = null,
  doctrineId,
  actor = 'HUMAN',
  idempotencyKey,
  nowMs
}) {
  return withIdempotency({
    pairId,
    houseId,
    plotId,
    actionName: 'select_doctrine',
    idempotencyKey,
    requestPayload: { doctrineId, actor },
    nowMs,
    mutator(bundle, pendingEvents) {
      const safeActor = mutationActor(actor);
      const safeDoctrineId = safeText(doctrineId, '', 80).toLowerCase();
      const doctrine = DOCTRINE_CATALOG[safeDoctrineId];
      if (!doctrine) {
        return errorEnvelope(bundle.plot.plotId, 'UNKNOWN_DOCTRINE', 'Doctrine is not in the engine-owned doctrine catalog.', false, {
          doctrineId: safeDoctrineId || null
        });
      }
      const availability = doctrineAvailability(bundle, doctrine);
      if (!availability.unlocked) {
        return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'Research Lodge doctrine stance unlocks after HQ6 and a founded outpost.', false, {
          reason: availability.hqLevel < doctrine.unlockHqLevel ? 'hq_locked' : 'outpost_required',
          ...availability
        });
      }
      if (safeActor === 'AGENT') {
        const approval = consumeActionApproval(bundle, 'select_doctrine', { doctrineId: safeDoctrineId }, nowMs);
        if (!approval) {
          return errorEnvelope(bundle.plot.plotId, 'FORBIDDEN_POLICY', 'Agent doctrine selection requires matching human approval.', true, {
            requiresApproval: true,
            actionName: 'select_doctrine',
            doctrineId: safeDoctrineId
          });
        }
      }
      const previous = normalizeDoctrineState(bundle.plot.doctrineState);
      if (previous.selectedDoctrineId === safeDoctrineId && previous.status === 'SELECTED') {
        return {
          ok: true,
          extras: {
            doctrineState: clone(previous),
            doctrine: clone(doctrine),
            existing: true
          }
        };
      }
      const next = {
        selectedDoctrineId: safeDoctrineId,
        status: 'SELECTED',
        selectedAt: Number(nowMs),
        selectedBy: safeActor,
        revision: Number(previous.revision || 0) + 1,
        authorityBoundary: doctrine.authorityBoundary,
        receiptEventType: 'DOCTRINE_SELECTED'
      };
      bundle.plot.doctrineState = normalizeDoctrineState(next);
      createEvent(pendingEvents, {
        plotId: bundle.plot.plotId,
        eventType: 'DOCTRINE_SELECTED',
        actor: safeActor,
        summary: `Research Lodge doctrine stance selected: ${doctrine.title}.`,
        explanation: 'This HQ8B doctrine has one server-owned effect: Expedition Board SCOUT duration is reduced by 5%. It does not change costs, outputs, settlement, routes, cohorts, or cross-plot math.',
        data: {
          doctrineId: doctrine.doctrineId,
          previousDoctrineId: previous.selectedDoctrineId,
          effectKind: doctrine.effectKind,
          effectValue: clone(doctrine.effectValue || null),
          gameplayBuff: doctrine.gameplayBuff === true,
          cost: clone(doctrine.cost || {}),
          authorityBoundary: doctrine.authorityBoundary,
          reversible: doctrine.reversibility
        },
        createdAt: nowMs
      });
      if (safeActor === 'AGENT') {
        markAgentAction(bundle, pendingEvents, 'select_doctrine', 'Foreman selected an engine-owned doctrine after matching human approval.', nowMs);
      }
      return {
        ok: true,
        extras: {
          doctrineState: clone(bundle.plot.doctrineState),
          doctrine: clone(doctrine),
          existing: false
        }
      };
    }
  });
}

function createWorkOrderDraft({
  pairId,
  houseId = null,
  plotId = null,
  templateId,
  scope = {},
  actor = 'HUMAN',
  idempotencyKey,
  nowMs
}) {
  return withIdempotency({
    pairId,
    houseId,
    plotId,
    actionName: 'create_work_order_draft',
    idempotencyKey,
    requestPayload: { templateId, scope, actor },
    nowMs,
    mutator(bundle, pendingEvents) {
      const safeActor = mutationActor(actor);
      const safeTemplateId = safeText(templateId, '', 120).toLowerCase();
      const template = WORK_ORDER_TEMPLATES[safeTemplateId];
      if (!template) {
        return errorEnvelope(bundle.plot.plotId, 'UNKNOWN_WORK_ORDER_TEMPLATE', 'Work order template is not in the engine-owned template catalog.', false, {
          templateId: safeTemplateId || null
        });
      }
      const availability = workOrderTemplateAvailability(bundle, template);
      if (!availability.unlocked) {
        return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'Cohort work-order drafts unlock after HQ6, a founded outpost, and the first selected doctrine.', false, {
          ...availability
        });
      }
      const scoped = workOrderScopeForTemplate(bundle, template, scope);
      if (!scoped.ok) return scoped.error;
      const workOrder = {
        workOrderId: randomId('work_order'),
        plotId: bundle.plot.plotId,
        templateId: template.templateId,
        status: 'DRAFT',
        title: template.title,
        scope: scoped.scope,
        allowedActions: clone(template.allowedActions || []),
        caps: clone(template.caps || {}),
        policySnapshot: {
          collectOutputs: bundle.policy.collectOutputs === true,
          queueProduction: bundle.policy.queueProduction === true,
          setPriority: bundle.policy.setPriority === true,
          sellSurplusFood: bundle.policy.sellSurplusFood === true,
          emergencyPause: bundle.policy.emergencyPause === true,
          maxAutonomousActionsPerHour: Number(bundle.policy.maxAutonomousActionsPerHour || 0)
        },
        childReceipts: [],
        createdBy: safeActor,
        approvedBy: null,
        failureReason: null,
        createdAt: Number(nowMs),
        updatedAt: Number(nowMs),
        expiresAt: Number(nowMs) + 24 * 60 * 60 * 1000
      };
      const persisted = store.writeWorkOrder(workOrder);
      bundle.workOrders = normalizeWorkOrders(store.listWorkOrdersByPlot(bundle.plot.plotId));
      createEvent(pendingEvents, {
        plotId: bundle.plot.plotId,
        eventType: 'WORK_ORDER_DRAFTED',
        actor: safeActor,
        summary: `Cohort work-order draft created: ${template.title}.`,
        explanation: 'This HQ9A draft records a bounded cohort plan with caps and allowed actions. It does not execute child actions.',
        data: {
          workOrderId: persisted.workOrderId,
          templateId: persisted.templateId,
          status: persisted.status,
          allowedActions: clone(persisted.allowedActions),
          caps: clone(persisted.caps),
          executionAvailable: true,
          authorityBoundary: template.authorityBoundary
        },
        createdAt: nowMs
      });
      return {
        ok: true,
        extras: {
          workOrder: clone(persisted),
          template: clone(publicWorkOrderTemplates(bundle).find((entry) => entry.templateId === template.templateId) || null),
          executionAvailable: true
        }
      };
    }
  });
}

function executeWorkOrder({
  pairId,
  houseId = null,
  plotId = null,
  workOrderId,
  actor = 'HUMAN',
  idempotencyKey,
  nowMs
}) {
  return withIdempotency({
    pairId,
    houseId,
    plotId,
    actionName: 'execute_work_order',
    idempotencyKey,
    requestPayload: { workOrderId, actor },
    nowMs,
    mutator(bundle, pendingEvents) {
      const safeActor = mutationActor(actor);
      const safeWorkOrderId = safeText(workOrderId, '', 120);
      const workOrder = normalizeWorkOrders(bundle.workOrders).find((entry) => entry.workOrderId === safeWorkOrderId);
      if (!workOrder) {
        return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'Work order not found on this plot.', false, {
          workOrderId: safeWorkOrderId || null
        });
      }
      if (workOrder.status !== 'DRAFT') {
        return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'Only DRAFT work orders can be executed once.', false, {
          workOrderId: workOrder.workOrderId,
          status: workOrder.status
        });
      }
      if (workOrder.plotId !== bundle.plot.plotId || safeText(workOrder.scope?.plotId, bundle.plot.plotId, 120) !== bundle.plot.plotId) {
        return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'Work orders may only execute against their current plot scope.', false, {
          workOrderId: workOrder.workOrderId,
          orderPlotId: workOrder.plotId
        });
      }
      if (workOrder.expiresAt != null && Number(workOrder.expiresAt) < Number(nowMs)) {
        return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'Work order draft has expired and must be recreated.', false, {
          workOrderId: workOrder.workOrderId,
          status: 'EXPIRED'
        });
      }
      const template = workOrderTemplateForExecution(workOrder);
      if (!template || !workOrderAllowedActionsAreSafe(workOrder, template)) {
        return errorEnvelope(bundle.plot.plotId, 'UNKNOWN_WORK_ORDER_TEMPLATE', 'Only engine-defined collect_ready_outputs_once work orders can execute in HQ9B.', false, {
          workOrderId: workOrder.workOrderId,
          templateId: workOrder.templateId
        });
      }
      const availability = workOrderTemplateAvailability(bundle, template);
      if (!availability.unlocked) {
        return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'Work order execution requires the live HQ9B unlock state.', false, {
          workOrderId: workOrder.workOrderId,
          ...availability
        });
      }
      const readyBuildings = workOrderReadyBuildings(bundle, workOrder, template);
      if (!readyBuildings.length) {
        return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'Work order has no ready outputs to collect.', true, {
          workOrderId: workOrder.workOrderId,
          reason: 'no_ready_outputs'
        });
      }
      if (safeActor === 'AGENT') {
        const approval = pendingApprovalForAction(bundle, 'execute_work_order', { workOrderId: workOrder.workOrderId });
        if (!approval) {
          return errorEnvelope(bundle.plot.plotId, 'FORBIDDEN_POLICY', 'Agent work-order execution requires matching human approval.', true, {
            requiresApproval: true,
            actionName: 'execute_work_order',
            requestedParams: { workOrderId: workOrder.workOrderId }
          });
        }
        const firstChildDenied = assertAgentPolicyForWorkOrderChild(bundle, pendingEvents, {
          nowMs,
          actionName: 'collect_outputs'
        });
        if (firstChildDenied) return firstChildDenied;
        const recentActions = countAgentActionsLastHour(bundle, nowMs) + pendingAgentActionCountLastHour(pendingEvents, nowMs);
        if ((recentActions + readyBuildings.length) > Number(bundle.policy.maxAutonomousActionsPerHour || 0)) {
          return errorEnvelope(bundle.plot.plotId, 'RATE_LIMITED', 'Agent hourly action cap reached for this work order.', true, {
            reason: 'hourly_cap',
            requestedChildActions: readyBuildings.length
          });
        }
        consumeActionApproval(bundle, 'execute_work_order', { workOrderId: workOrder.workOrderId }, nowMs);
      }
      const childReceipts = [];
      for (const [index, building] of readyBuildings.entries()) {
        if (building.plotId !== bundle.plot.plotId || building.state !== 'OUTPUT_READY') {
          return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'Work order child collection must revalidate a ready same-plot output.', true, {
            workOrderId: workOrder.workOrderId,
            buildingId: building.buildingId,
            reason: 'child_live_state_revalidation_failed'
          });
        }
        if (safeActor === 'AGENT') {
          const childDenied = assertAgentPolicyForWorkOrderChild(bundle, pendingEvents, {
            nowMs,
            actionName: 'collect_outputs'
          });
          if (childDenied) return childDenied;
        }
        const childIdempotencyKey = `${idempotencyKey}:child:${index + 1}:${building.buildingId}`;
        const receipt = collectReadyOutputForWorkOrder(bundle, building, {
          actor: safeActor,
          nowMs,
          pendingEvents,
          parentWorkOrderId: workOrder.workOrderId,
          childIdempotencyKey
        });
        childReceipts.push(receipt);
      }
      const updated = {
        ...workOrder,
        status: 'COMPLETED',
        childReceipts,
        approvedBy: safeActor === 'AGENT' ? 'HUMAN_APPROVAL' : null,
        failureReason: null,
        updatedAt: nowMs
      };
      const persisted = store.writeWorkOrder(updated);
      bundle.workOrders = normalizeWorkOrders(store.listWorkOrdersByPlot(bundle.plot.plotId));
      createEvent(pendingEvents, {
        plotId: bundle.plot.plotId,
        eventType: 'WORK_ORDER_EXECUTED',
        actor: safeActor,
        summary: `Cohort work order executed: ${persisted.title}.`,
        explanation: 'HQ9B executes only collect_ready_outputs_once, collecting at most two ready outputs on the same plot with no spend or cross-plot mutation.',
        data: {
          workOrderId: persisted.workOrderId,
          templateId: persisted.templateId,
          status: persisted.status,
          childReceiptCount: childReceipts.length,
          childReceipts: clone(childReceipts),
          caps: clone(template.caps || {}),
          authorityBoundary: template.authorityBoundary
        },
        createdAt: nowMs
      });
      return {
        ok: true,
        extras: {
          workOrder: clone(persisted),
          childReceipts: clone(childReceipts),
          executedChildCount: childReceipts.length,
          executionAvailable: true
        }
      };
    }
  });
}

function getWorldGridStatus({
  pairId,
  houseId = null,
  plotId = null,
  nowMs
}) {
  return store.withTransaction(() => {
    const bundle = ensurePlotBundle({ pairId, houseId, plotId, nowMs });
    if (!verifyPlotAccess(bundle, pairId, plotId, nowMs)) {
      return errorEnvelope(plotId, 'UNAUTHORIZED', 'Requested plot does not belong to the current session.', false);
    }
    return successEnvelope({
      plotId: bundle.plot.plotId,
      worldDelta: [],
      stateHash: computeStateHash(bundleSnapshot(bundle)),
      extras: {
        worldGrid: worldGridReadModel(bundle)
      }
    });
  });
}

function getExpeditionMapStatus({
  pairId,
  houseId = null,
  plotId = null,
  nowMs
}) {
  return store.withTransaction(() => {
    const bundle = ensurePlotBundle({ pairId, houseId, plotId, nowMs });
    if (!verifyPlotAccess(bundle, pairId, plotId, nowMs)) {
      return errorEnvelope(plotId, 'UNAUTHORIZED', 'Requested plot does not belong to the current session.', false);
    }
    return successEnvelope({
      plotId: bundle.plot.plotId,
      worldDelta: [],
      stateHash: computeStateHash(bundleSnapshot(bundle)),
      extras: {
        expeditionMap: buildExpeditionMapReadModel(bundle)
      }
    });
  });
}

function scoutSectorBoundaryFlags() {
  return {
    samePlotOnly: true,
    serverOwnedDiscoveryReceipt: true,
    revealsExactlyOneSector: true,
    autonomousMovement: false,
    resourceHarvesting: false,
    resourceDelta: {},
    routeCreation: false,
    tradeRouteCreation: false,
    backgroundScheduling: false,
    combat: false,
    publicSharing: false,
    generatedUniverseRendering: false,
    crossPlotMutation: false,
    atlasExecution: false,
    externalEffects: false
  };
}

function knownOrDiscoveredCellIds(map) {
  return new Set((Array.isArray(map?.cells) ? map.cells : [])
    .filter((cell) => cell.fogState === 'known' || cell.fogState === 'discovered')
    .map((cell) => cell.cellId));
}

function buildScoutSectorProof({ beforeMap, afterMap, targetCell, scoutSector, alreadyScouted = false }) {
  const beforeKnown = knownOrDiscoveredCellIds(beforeMap);
  const afterKnown = knownOrDiscoveredCellIds(afterMap);
  const afterTarget = (afterMap.cells || []).find((cell) => cell.cellId === targetCell.cellId) || null;
  return {
    actionName: 'et.plot.scout_sector',
    plotId: scoutSector.plotId,
    scoutId: scoutSector.scoutId,
    cellId: targetCell.cellId,
    sourceCellId: scoutSector.sourceCellId || null,
    alreadyScouted,
    beforeProjectionHash: beforeMap.projectionHash,
    afterProjectionHash: afterMap.projectionHash,
    targetBeforeFogState: targetCell.fogState || null,
    targetAfterFogState: afterTarget?.fogState || null,
    beforeFogCounts: clone(beforeMap.fog?.counts || {}),
    afterFogCounts: clone(afterMap.fog?.counts || {}),
    newlyKnownOrDiscoveredCellIds: Array.from(afterKnown).filter((cellId) => !beforeKnown.has(cellId)).sort(),
    eventPacketId: scoutSector.eventPacket?.packetId || null,
    boundaryFlags: scoutSectorBoundaryFlags()
  };
}

function expeditionUnitMoveBoundaryFlags() {
  return {
    samePlotOnly: true,
    serverOwnedPositionReceipt: true,
    movementMutation: true,
    movementVersion: EXPEDITION_UNIT_MOVE_VERSION,
    movementRevealsFog: false,
    autonomousMovement: false,
    operatorAssignment: false,
    resourceHarvesting: false,
    resourceDelta: {},
    resourceGain: false,
    resourceLoss: false,
    routeCreation: false,
    tradeRouteCreation: false,
    backgroundScheduling: false,
    combat: false,
    publicSharing: false,
    generatedUniverseRendering: false,
    crossPlotMutation: false,
    atlasExecution: false,
    externalEffects: false
  };
}

function buildExpeditionUnitMoveProof({ beforeMap, afterMap, unit, targetCell, move, alreadyMoved = false }) {
  return {
    actionName: 'et.plot.move_expedition_unit',
    plotId: move.plotId,
    moveId: move.moveId,
    unitId: unit.unitId,
    unitType: unit.unitType,
    alreadyMoved,
    sourceCellId: unit.location?.cellId || null,
    targetCellId: targetCell.cellId,
    sourceFogState: unit.location?.fogState || null,
    targetFogState: targetCell.fogState || null,
    beforeProjectionHash: beforeMap.projectionHash,
    afterProjectionHash: afterMap.projectionHash,
    beforeFogCounts: clone(beforeMap.fog?.counts || {}),
    afterFogCounts: clone(afterMap.fog?.counts || {}),
    fogCountsUnchanged: stableJsonStringify(beforeMap.fog?.counts || {}) === stableJsonStringify(afterMap.fog?.counts || {}),
    inventoryMutation: false,
    routeCreation: false,
    atlasExecution: false,
    externalEffects: false,
    boundaryFlags: expeditionUnitMoveBoundaryFlags()
  };
}

function moveExpeditionUnit({
  pairId,
  houseId = null,
  plotId = null,
  unitId = null,
  targetCellId = null,
  actor = 'HUMAN',
  actorType = null,
  idempotencyKey,
  nowMs
}) {
  const safeUnitId = safeText(unitId, '', 160);
  const safeTargetCellId = safeText(targetCellId, '', 80);
  const requestedActor = mutationActor(actorType || actor);
  return withIdempotency({
    pairId,
    houseId,
    plotId,
    actionName: 'move_expedition_unit',
    idempotencyKey,
    requestPayload: { unitId: safeUnitId, targetCellId: safeTargetCellId, actor: requestedActor },
    nowMs,
    mutator(bundle, pendingEvents) {
      const beforeMap = buildExpeditionMapReadModel(bundle);
      const unit = beforeMap.units?.items?.find((entry) => entry.unitId === safeUnitId) || null;
      if (!unit) {
        return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'Move Unit requires a server-owned Expedition Map unit.', false, {
          unitId: safeUnitId || null
        });
      }
      if (unit.unitType !== 'scout') {
        return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'Only the Scout unit has server-owned movement in this slice.', false, {
          unitId: unit.unitId,
          unitType: unit.unitType
        });
      }
      const targetCell = (beforeMap.cells || []).find((cell) => cell.cellId === safeTargetCellId) || null;
      if (!targetCell || !['discovered', 'known'].includes(targetCell.fogState)) {
        return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'Move Unit targets must be discovered or known server map cells.', false, {
          unitId: unit.unitId,
          targetCellId: safeTargetCellId || null,
          allowedFogStates: ['discovered', 'known']
        });
      }
      if (targetCell.cellId === unit.location?.cellId) {
        const noopMove = {
          moveId: `noop_${hashPayload({ unitId: unit.unitId, targetCellId: targetCell.cellId }).slice(0, 12)}`,
          plotId: bundle.plot.plotId,
          unitId: unit.unitId,
          unitType: unit.unitType,
          sourceCellId: unit.location?.cellId || null,
          targetCellId: targetCell.cellId
        };
        return {
          ok: true,
          extras: {
            move: noopMove,
            movement: noopMove,
            movedUnitId: unit.unitId,
            sourceCellId: unit.location?.cellId || null,
            targetCellId: targetCell.cellId,
            alreadyMoved: true,
            proof: buildExpeditionUnitMoveProof({ beforeMap, afterMap: beforeMap, unit, targetCell, move: noopMove, alreadyMoved: true }),
            expeditionMap: beforeMap
          }
        };
      }
      const allowedTargetCellIds = Array.isArray(unit.movement?.allowedTargetCellIds)
        ? unit.movement.allowedTargetCellIds
        : [];
      if (!allowedTargetCellIds.includes(targetCell.cellId)) {
        return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'Move Unit can only target adjacent discovered or known cells.', false, {
          unitId: unit.unitId,
          targetCellId: targetCell.cellId,
          allowedTargetCellIds
        });
      }

      const approvalParams = { unitId: unit.unitId, targetCellId: targetCell.cellId };
      let consumedApproval = null;
      if (requestedActor === 'AGENT') {
        consumedApproval = consumeActionApproval(bundle, 'move_expedition_unit', approvalParams, nowMs);
        if (!consumedApproval) {
          return errorEnvelope(bundle.plot.plotId, 'FORBIDDEN_POLICY', 'Agent Move Unit requires matching human approval.', true, {
            requiresApproval: true,
            actionName: 'move_expedition_unit',
            requestedParams: approvalParams
          });
        }
      }

      const moveId = randomId('expedition_unit_move');
      const receipt = {
        kind: 'expedition_unit_move_receipt',
        actionName: 'et.plot.move_expedition_unit',
        moveId,
        plotId: bundle.plot.plotId,
        unitId: unit.unitId,
        unitType: unit.unitType,
        sourceCellId: unit.location?.cellId || null,
        targetCellId: targetCell.cellId,
        sourceFogState: unit.location?.fogState || null,
        targetFogState: targetCell.fogState,
        beforeProjectionHash: beforeMap.projectionHash,
        authorityBoundary: EXPEDITION_UNIT_MOVE_AUTHORITY_BOUNDARY,
        createdBy: requestedActor,
        approvedBy: requestedActor === 'AGENT' ? 'HUMAN_APPROVAL' : null,
        movedAt: Number(nowMs),
        ...expeditionUnitMoveBoundaryFlags()
      };
      const move = {
        moveId,
        plotId: bundle.plot.plotId,
        unitId: unit.unitId,
        unitType: unit.unitType,
        sourceCellId: unit.location?.cellId || null,
        targetCellId: targetCell.cellId,
        sourceQ: Number(unit.location?.q || 0),
        sourceR: Number(unit.location?.r || 0),
        targetQ: Number(targetCell.q || 0),
        targetR: Number(targetCell.r || 0),
        status: 'MOVED',
        authorityBoundary: EXPEDITION_UNIT_MOVE_AUTHORITY_BOUNDARY,
        receipt,
        createdBy: requestedActor,
        approvedBy: requestedActor === 'AGENT' ? 'HUMAN_APPROVAL' : null,
        createdAt: Number(nowMs),
        updatedAt: Number(nowMs)
      };
      bundle.plot.expeditionUnitMoves = [
        ...normalizeExpeditionUnitMoves(bundle.plot.expeditionUnitMoves),
        move
      ];
      bundle.plot.updatedAt = Number(nowMs);
      const afterMap = buildExpeditionMapReadModel(bundle);
      const afterUnit = afterMap.units?.items?.find((entry) => entry.unitId === unit.unitId) || null;
      const proof = buildExpeditionUnitMoveProof({ beforeMap, afterMap, unit, targetCell, move });
      createEvent(pendingEvents, {
        plotId: bundle.plot.plotId,
        eventType: 'EXPEDITION_UNIT_MOVED',
        actor: requestedActor,
        summary: `Scout moved to ${targetCell.cellId}.`,
        explanation: 'HQ15G moves one selected Scout token between adjacent discovered/known cells. It does not reveal fog, gather resources, create routes, schedule work, mutate other plots, or grant Atlas execution.',
        data: {
          move: clone(move),
          receipt: clone(receipt),
          unitBefore: clone(unit),
          unitAfter: clone(afterUnit),
          proof,
          approvalId: consumedApproval?.approvalId || null
        },
        createdAt: nowMs
      });
      if (requestedActor === 'AGENT') {
        markAgentAction(bundle, pendingEvents, 'move_expedition_unit', 'Foreman moved one Scout token after matching human approval.', nowMs);
      }
      return {
        ok: true,
        extras: {
          move: clone(move),
          movement: clone(move),
          movedUnitId: unit.unitId,
          sourceCellId: unit.location?.cellId || null,
          targetCellId: targetCell.cellId,
          alreadyMoved: false,
          proof,
          expeditionMap: afterMap
        }
      };
    }
  });
}

function scoutExpeditionSector({
  pairId,
  houseId = null,
  plotId = null,
  cellId = null,
  actor = 'HUMAN',
  actorType = null,
  idempotencyKey,
  nowMs
}) {
  const requestedCellId = safeText(cellId, '', 80);
  const requestedActor = mutationActor(actorType || actor);
  return withIdempotency({
    pairId,
    houseId,
    plotId,
    actionName: 'scout_sector',
    idempotencyKey,
    requestPayload: { cellId: requestedCellId, actor: requestedActor },
    nowMs,
    mutator(bundle, pendingEvents) {
      const beforeMap = buildExpeditionMapReadModel(bundle);
      const existingScout = requestedCellId
        ? normalizeExpeditionScouts(bundle.plot.expeditionScouts)
          .find((entry) => entry.cellId === requestedCellId)
        : null;
      if (existingScout) {
        const afterMap = buildExpeditionMapReadModel(bundle);
        const targetCell = afterMap.cells.find((cell) => cell.cellId === existingScout.cellId) || {
          cellId: existingScout.cellId,
          fogState: 'known'
        };
        return {
          ok: true,
          extras: {
            scoutSector: clone(existingScout),
            sector: clone(existingScout),
            eventPacket: clone(existingScout.eventPacket),
            alreadyScouted: true,
            revealedCellId: existingScout.cellId,
            proof: buildScoutSectorProof({
              beforeMap,
              afterMap,
              targetCell,
              scoutSector: existingScout,
              alreadyScouted: true
            }),
            expeditionMap: afterMap
          }
        };
      }

      const hintedCells = (beforeMap.cells || [])
        .filter((cell) => cell.fogState === 'hinted' && cell.kind === 'frontier_hint')
        .sort((a, b) => a.q - b.q || a.r - b.r || a.cellId.localeCompare(b.cellId));
      const targetCell = requestedCellId
        ? hintedCells.find((cell) => cell.cellId === requestedCellId)
        : hintedCells[0];
      if (!targetCell) {
        return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'Scout Sector requires one eligible hinted frontier cell on the current plot.', false, {
          reason: requestedCellId ? 'hinted_frontier_cell_required' : 'no_hinted_frontier_cells',
          cellId: requestedCellId || null,
          availableHintedCellIds: hintedCells.map((cell) => cell.cellId)
        });
      }

      const approvalParams = { cellId: targetCell.cellId };
      let consumedApproval = null;
      if (requestedActor === 'AGENT') {
        consumedApproval = consumeActionApproval(bundle, 'scout_sector', approvalParams, nowMs);
        if (!consumedApproval) {
          return errorEnvelope(bundle.plot.plotId, 'FORBIDDEN_POLICY', 'Agent Scout Sector requires matching human approval.', true, {
            requiresApproval: true,
            actionName: 'scout_sector',
            requestedParams: approvalParams
          });
        }
      }

      const sourceCellId = safeText(targetCell.sourceIds?.adjacentCellId || targetCell.sources?.[0]?.id, '', 80) || null;
      const scoutId = randomId('expedition_scout');
      const receipt = {
        kind: 'scout_sector_receipt',
        actionName: 'et.plot.scout_sector',
        scoutId,
        plotId: bundle.plot.plotId,
        cellId: targetCell.cellId,
        sourceCellId,
        sourceFogState: targetCell.fogState,
        beforeProjectionHash: beforeMap.projectionHash,
        authorityBoundary: EXPEDITION_SCOUT_SECTOR_AUTHORITY_BOUNDARY,
        createdBy: requestedActor,
        approvedBy: requestedActor === 'AGENT' ? 'HUMAN_APPROVAL' : null,
        scoutedAt: Number(nowMs),
        ...scoutSectorBoundaryFlags()
      };
      const scoutSector = {
        scoutId,
        plotId: bundle.plot.plotId,
        cellId: targetCell.cellId,
        q: targetCell.q,
        r: targetCell.r,
        sourceCellId,
        sourceFogState: targetCell.fogState,
        title: 'Scouted Frontier Sector',
        status: 'SCOUTED',
        traits: ['scouted-frontier'],
        resourceHints: {},
        siteType: 'scouted_frontier',
        risk: 'unknown',
        summary: 'A hinted frontier sector was scouted and is now known map truth only.',
        recommendedNext: 'Keep this as read-model truth until a later explicit planning action exists.',
        authorityBoundary: EXPEDITION_SCOUT_SECTOR_AUTHORITY_BOUNDARY,
        receipt,
        createdBy: requestedActor,
        approvedBy: requestedActor === 'AGENT' ? 'HUMAN_APPROVAL' : null,
        createdAt: Number(nowMs),
        updatedAt: Number(nowMs)
      };
      const eventPacket = buildExpeditionEventPacket({ scoutSector, targetCell });
      scoutSector.receipt.eventPacketId = eventPacket.packetId;
      scoutSector.eventPacket = eventPacket;
      bundle.plot.expeditionScouts = [
        ...normalizeExpeditionScouts(bundle.plot.expeditionScouts),
        scoutSector
      ];
      bundle.plot.updatedAt = Number(nowMs);
      const afterMap = buildExpeditionMapReadModel(bundle);
      const proof = buildScoutSectorProof({
        beforeMap,
        afterMap,
        targetCell,
        scoutSector
      });
      createEvent(pendingEvents, {
        plotId: bundle.plot.plotId,
        eventType: 'EXPEDITION_SECTOR_SCOUTED',
        actor: requestedActor,
        summary: `Scout Sector revealed ${targetCell.cellId}.`,
        explanation: 'HQ12C reveals exactly one existing hinted frontier sector into same-plot known map truth. It does not move actors, gather resources, create routes, schedule work, mutate other plots, or grant Atlas execution.',
        data: {
          scoutSector: clone(scoutSector),
          eventPacket: clone(eventPacket),
          receipt: clone(receipt),
          proof,
          approvalId: consumedApproval?.approvalId || null
        },
        createdAt: nowMs
      });
      if (requestedActor === 'AGENT') {
        markAgentAction(bundle, pendingEvents, 'scout_sector', 'Foreman scouted one hinted same-plot frontier sector after matching human approval.', nowMs);
      }
      return {
        ok: true,
        extras: {
          scoutSector: clone(scoutSector),
          sector: clone(scoutSector),
          eventPacket: clone(eventPacket),
          alreadyScouted: false,
          revealedCellId: scoutSector.cellId,
          proof,
          expeditionMap: afterMap
        }
      };
    }
  });
}

function listCivicProposalRecords({
  pairId,
  houseId = null,
  plotId = null,
  nowMs
}) {
  return store.withTransaction(() => {
    const bundle = ensurePlotBundle({ pairId, houseId, plotId, nowMs });
    if (!verifyPlotAccess(bundle, pairId, plotId, nowMs)) {
      return errorEnvelope(plotId, 'UNAUTHORIZED', 'Requested plot does not belong to the current session.', false);
    }
    return successEnvelope({
      plotId: bundle.plot.plotId,
      worldDelta: [],
      stateHash: computeStateHash(bundleSnapshot(bundle)),
      extras: {
        civicProposals: civicProposalsReadModel(bundle),
        proposals: normalizeCivicProposals(bundle.civicProposals || [])
      }
    });
  });
}

function createCivicProposalRecord({
  pairId,
  houseId = null,
  plotId = null,
  title,
  category = 'coordination',
  summary,
  status = 'DRAFT',
  relatedPlotIds = [],
  reviewNote = '',
  actor = 'HUMAN',
  idempotencyKey,
  nowMs
}) {
  const safeTitle = safeText(title, '', 120);
  const safeCategory = normalizeCivicProposalCategory(category);
  const safeSummary = safeText(summary, '', 480);
  const safeStatus = normalizeCivicProposalStatus(status);
  const safeReviewNote = safeText(reviewNote, '', 320);
  const approvalParams = {
    title: safeTitle,
    category: safeCategory,
    status: safeStatus,
    summary: safeSummary
  };
  return withIdempotency({
    pairId,
    houseId,
    plotId,
    actionName: 'create_civic_proposal',
    idempotencyKey,
    requestPayload: { ...approvalParams, relatedPlotIds, reviewNote: safeReviewNote, actor },
    nowMs,
    mutator(bundle, pendingEvents) {
      const safeActor = mutationActor(actor);
      if (!safeTitle || !safeSummary) {
        return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'Civic proposal records require title and summary.', false, {
          reason: 'missing_title_or_summary'
        });
      }
      const worldGrid = worldGridReadModel(bundle);
      if (worldGrid.civicReadiness.ready !== true) {
        return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'Civic proposal records unlock only after HQ10A World Grid readiness.', false, {
          reason: 'world_grid_not_ready',
          blockedBy: clone(worldGrid.requirements.blockedBy || [])
        });
      }
      if (safeActor === 'AGENT') {
        const approval = consumeActionApproval(bundle, 'create_civic_proposal', approvalParams, nowMs);
        if (!approval) {
          return errorEnvelope(bundle.plot.plotId, 'FORBIDDEN_POLICY', 'Agent civic proposal records require matching human approval.', true, {
            requiresApproval: true,
            actionName: 'create_civic_proposal',
            requestedParams: approvalParams
          });
        }
      }
      const knownPlotIds = new Set((worldGrid.plots || []).map((entry) => entry.plotId).filter(Boolean));
      const safeRelatedPlotIds = Array.from(new Set((Array.isArray(relatedPlotIds) ? relatedPlotIds : [])
        .map((id) => safeText(id, '', 120))
        .filter((id) => knownPlotIds.has(id))))
        .slice(0, 8);
      const proposal = {
        proposalId: randomId('civic_proposal'),
        plotId: bundle.plot.plotId,
        status: safeStatus,
        title: safeTitle,
        category: safeCategory,
        summary: safeSummary,
        scope: {
          source: 'world_grid_read_model',
          proposalOnly: true,
          executionAllowed: false,
          plotId: bundle.plot.plotId,
          worldGridProjectionHash: worldGrid.projectionHash,
          knownPlotCount: Number(worldGrid.scope?.knownPlotCount || 0),
          outpostCount: Number(worldGrid.scope?.outpostCount || 0),
          relatedPlotIds: safeRelatedPlotIds
        },
        review: {
          note: safeReviewNote,
          reviewedBy: safeStatus === 'REVIEWED' ? safeActor : null,
          reviewStatus: safeStatus === 'REVIEWED' ? 'reviewed_record_only' : 'unreviewed',
          executionDecision: 'not_executable'
        },
        authorityBoundary: CIVIC_PROPOSAL_AUTHORITY_BOUNDARY,
        createdBy: safeActor,
        approvedBy: safeActor === 'AGENT' ? 'HUMAN_APPROVAL' : null,
        createdAt: Number(nowMs),
        updatedAt: Number(nowMs),
        reviewedAt: safeStatus === 'REVIEWED' ? Number(nowMs) : null,
        archivedAt: safeStatus === 'ARCHIVED' ? Number(nowMs) : null
      };
      const persisted = store.writeCivicProposal(proposal);
      bundle.civicProposals = normalizeCivicProposals(store.listCivicProposalsByPlot(bundle.plot.plotId));
      createEvent(pendingEvents, {
        plotId: bundle.plot.plotId,
        eventType: 'CIVIC_PROPOSAL_RECORDED',
        actor: safeActor,
        summary: `Civic proposal recorded: ${persisted.title}.`,
        explanation: 'HQ10B records advisory civic proposals only. It does not execute civic changes, spend resources, create routes, schedule work, or affect external systems.',
        data: {
          proposalId: persisted.proposalId,
          status: persisted.status,
          category: persisted.category,
          proposalOnly: true,
          executionAllowed: false,
          authorityBoundary: persisted.authorityBoundary,
          prohibitedCapabilities: clone(worldGrid.civicReadiness.prohibitedCapabilities || [])
        },
        createdAt: nowMs
      });
      if (safeActor === 'AGENT') {
        markAgentAction(bundle, pendingEvents, 'create_civic_proposal', 'Foreman recorded an advisory civic proposal after matching human approval.', nowMs);
      }
      return {
        ok: true,
        extras: {
          civicProposal: clone(persisted),
          proposal: clone(persisted),
          proposalOnly: true,
          executionAllowed: false,
          civicProposals: civicProposalsReadModel(bundle)
        }
      };
    }
  });
}

function listOverlayPackRecords({
  pairId,
  houseId = null,
  plotId = null,
  nowMs
}) {
  return store.withTransaction(() => {
    const bundle = ensurePlotBundle({ pairId, houseId, plotId, nowMs });
    if (!verifyPlotAccess(bundle, pairId, plotId, nowMs)) {
      return errorEnvelope(plotId, 'UNAUTHORIZED', 'Requested plot does not belong to the current session.', false);
    }
    return successEnvelope({
      plotId: bundle.plot.plotId,
      worldDelta: [],
      stateHash: computeStateHash(bundleSnapshot(bundle)),
      extras: {
        overlayPacks: overlayPacksReadModel(bundle),
        packs: normalizeOverlayPacks(bundle.overlayPacks || [])
      }
    });
  });
}

function createOverlayPackRecord({
  pairId,
  houseId = null,
  plotId = null,
  sourceProposalId,
  title,
  theme = 'civic',
  summary,
  status = 'DRAFT',
  targetSurfaceIds = [],
  targetNodeIds = [],
  displayHints = {},
  prompt = '',
  provenance = {},
  actor = 'HUMAN',
  idempotencyKey,
  nowMs
}) {
  const safeSourceProposalId = safeText(sourceProposalId, '', 120);
  const safeTitle = safeText(title, '', 120);
  const safeTheme = safeText(theme, 'civic', 80);
  const safeSummary = safeText(summary, '', 480);
  const safeStatus = normalizeOverlayPackStatus(status);
  const allowedSurfaceIds = new Set(['founders_plot', 'progression_atlas', 'world_grid']);
  const safeTargetSurfaceIds = sanitizeStringList(targetSurfaceIds, 8, 80)
    .filter((surfaceId) => allowedSurfaceIds.has(surfaceId));
  const finalTargetSurfaceIds = safeTargetSurfaceIds.length
    ? safeTargetSurfaceIds
    : ['progression_atlas', 'world_grid'];
  const safeTargetNodeIds = sanitizeStringList(targetNodeIds, 20, 120);
  const safeDisplayHints = normalizeOverlayDisplayHints(displayHints);
  const safePrompt = normalizeOverlayPrompt(prompt);
  const safeProvenance = normalizeOverlayProvenance(provenance, safeSourceProposalId);
  const approvalParams = {
    sourceProposalId: safeSourceProposalId,
    title: safeTitle,
    theme: safeTheme,
    status: safeStatus,
    summary: safeSummary
  };
  return withIdempotency({
    pairId,
    houseId,
    plotId,
    actionName: 'create_overlay_pack',
    idempotencyKey,
    requestPayload: {
      ...approvalParams,
      targetSurfaceIds: finalTargetSurfaceIds,
      targetNodeIds: safeTargetNodeIds,
      displayHints: safeDisplayHints,
      prompt: safePrompt,
      provenance: safeProvenance,
      actor
    },
    nowMs,
    mutator(bundle) {
      const safeActor = mutationActor(actor);
      if (!safeSourceProposalId || !safeTitle || !safeSummary) {
        return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'Overlay pack records require sourceProposalId, title, and summary.', false, {
          reason: 'missing_source_title_or_summary'
        });
      }
      const overlayReadModel = overlayPacksReadModel(bundle);
      if (overlayReadModel.status !== 'RECORDING_READY') {
        return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'Overlay pack records unlock after HQ10A readiness and a reviewed civic proposal.', false, {
          reason: 'overlay_pack_records_not_ready',
          blockedBy: clone(overlayReadModel.requirements.blockedBy || [])
        });
      }
      const sourceProposal = normalizeCivicProposals(bundle.civicProposals || [])
        .find((proposal) => proposal.proposalId === safeSourceProposalId);
      if (!sourceProposal || sourceProposal.status !== 'REVIEWED') {
        return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'Overlay pack records must reference a reviewed civic proposal on the same plot.', false, {
          reason: 'reviewed_civic_proposal_required',
          sourceProposalId: safeSourceProposalId
        });
      }
      if (safeActor === 'AGENT') {
        const approval = consumeActionApproval(bundle, 'create_overlay_pack', approvalParams, nowMs);
        if (!approval) {
          return errorEnvelope(bundle.plot.plotId, 'FORBIDDEN_POLICY', 'Agent overlay pack records require matching human approval.', true, {
            requiresApproval: true,
            actionName: 'create_overlay_pack',
            requestedParams: approvalParams
          });
        }
      }
      const pack = {
        overlayPackId: randomId('overlay_pack'),
        plotId: bundle.plot.plotId,
        sourceProposalId: sourceProposal.proposalId,
        status: safeStatus,
        title: safeTitle,
        theme: safeTheme,
        summary: safeSummary,
        targetSurfaceIds: finalTargetSurfaceIds,
        targetNodeIds: safeTargetNodeIds,
        displayHints: safeDisplayHints,
        prompt: safePrompt,
        provenance: {
          ...safeProvenance,
          sourceProposalTitle: sourceProposal.title,
          worldGridProjectionHash: worldGridReadModel(bundle).projectionHash
        },
        visualOnly: true,
        presentationOnly: true,
        gameplayMutationPolicy: 'presentation_only',
        authorityBoundary: OVERLAY_PACK_AUTHORITY_BOUNDARY,
        createdBy: safeActor,
        approvedBy: safeActor === 'AGENT' ? 'HUMAN_APPROVAL' : null,
        createdAt: Number(nowMs),
        updatedAt: Number(nowMs),
        reviewedAt: safeStatus === 'REVIEWED' ? Number(nowMs) : null,
        archivedAt: safeStatus === 'ARCHIVED' ? Number(nowMs) : null
      };
      const persisted = store.writeOverlayPack(pack);
      bundle.overlayPacks = normalizeOverlayPacks(store.listOverlayPacksByPlot(bundle.plot.plotId));
      return {
        ok: true,
        extras: {
          overlayPack: clone(persisted),
          pack: clone(persisted),
          presentationOnly: true,
          visualOnly: true,
          executionAllowed: false,
          gameplayMutationPolicy: 'presentation_only',
          overlayPacks: overlayPacksReadModel(bundle)
        }
      };
    }
  });
}

function listCivicProjectRecords({
  pairId,
  houseId = null,
  plotId = null,
  nowMs
}) {
  return store.withTransaction(() => {
    const bundle = ensurePlotBundle({ pairId, houseId, plotId, nowMs });
    if (!verifyPlotAccess(bundle, pairId, plotId, nowMs)) {
      return errorEnvelope(plotId, 'UNAUTHORIZED', 'Requested plot does not belong to the current session.', false);
    }
    return successEnvelope({
      plotId: bundle.plot.plotId,
      worldDelta: [],
      stateHash: computeStateHash(bundleSnapshot(bundle)),
      extras: {
        civicProjects: civicProjectsReadModel(bundle),
        projects: normalizeCivicProjects(bundle.civicProjects || [])
      }
    });
  });
}

function activateCivicProject({
  pairId,
  houseId = null,
  plotId = null,
  sourceProposalId,
  projectType = 'civic_beacon',
  title,
  summary = '',
  actor = 'HUMAN',
  idempotencyKey,
  nowMs
}) {
  const safeSourceProposalId = safeText(sourceProposalId, '', 120);
  const safeProjectType = normalizeCivicProjectType(projectType);
  const safeTitle = safeText(title, '', 120);
  const safeSummary = safeText(summary, '', 480);
  const approvalParams = {
    sourceProposalId: safeSourceProposalId,
    projectType: safeProjectType,
    title: safeTitle,
    summary: safeSummary
  };
  return withIdempotency({
    pairId,
    houseId,
    plotId,
    actionName: 'activate_civic_project',
    idempotencyKey,
    requestPayload: { ...approvalParams, actor },
    nowMs,
    mutator(bundle, pendingEvents) {
      const safeActor = mutationActor(actor);
      if (!safeSourceProposalId || !safeTitle) {
        return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'Civic project activation requires sourceProposalId and title.', false, {
          reason: 'missing_source_proposal_or_title'
        });
      }
      const worldGrid = worldGridReadModel(bundle);
      if (worldGrid.civicReadiness.ready !== true) {
        return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'Civic project activation unlocks only after HQ10A World Grid readiness.', false, {
          reason: 'world_grid_not_ready',
          blockedBy: clone(worldGrid.requirements.blockedBy || [])
        });
      }
      const sourceProposal = normalizeCivicProposals(bundle.civicProposals || [])
        .find((proposal) => proposal.proposalId === safeSourceProposalId);
      if (!sourceProposal || sourceProposal.status !== 'REVIEWED') {
        return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'Civic project activation requires a reviewed civic proposal on the same plot.', false, {
          reason: 'reviewed_civic_proposal_required',
          sourceProposalId: safeSourceProposalId
        });
      }
      const existing = store.getCivicProjectForProposal(bundle.plot.plotId, sourceProposal.proposalId);
      if (existing) {
        bundle.civicProjects = normalizeCivicProjects(store.listCivicProjectsByPlot(bundle.plot.plotId));
        return {
          ok: true,
          extras: {
            civicProject: clone(existing),
            project: clone(existing),
            alreadyActivated: true,
            effectApplied: existing.status === 'ACTIVE',
            civicProjects: civicProjectsReadModel(bundle)
          }
        };
      }
      if (safeActor === 'AGENT') {
        const approval = consumeActionApproval(bundle, 'activate_civic_project', approvalParams, nowMs);
        if (!approval) {
          return errorEnvelope(bundle.plot.plotId, 'FORBIDDEN_POLICY', 'Agent civic project activation requires matching human approval.', true, {
            requiresApproval: true,
            actionName: 'activate_civic_project',
            requestedParams: approvalParams
          });
        }
      }
      const effect = normalizeCivicProjectEffect({ appliedAt: nowMs }, safeProjectType);
      const project = {
        projectId: randomId('civic_project'),
        plotId: bundle.plot.plotId,
        sourceProposalId: sourceProposal.proposalId,
        status: 'ACTIVE',
        projectType: safeProjectType,
        title: safeTitle,
        summary: safeSummary || sourceProposal.summary,
        effect,
        receipt: {
          kind: 'civic_project_activation',
          actionName: 'et.plot.activate_civic_project',
          sourceProposalId: sourceProposal.proposalId,
          sourceProposalStatus: sourceProposal.status,
          projectType: safeProjectType,
          effectId: effect.effectId,
          worldGridProjectionHash: worldGrid.projectionHash,
          authorityBoundary: CIVIC_PROJECT_AUTHORITY_BOUNDARY,
          activatedAt: Number(nowMs),
          resourceDelta: {},
          routeCreation: false,
          backgroundScheduling: false,
          externalEffects: false
        },
        authorityBoundary: CIVIC_PROJECT_AUTHORITY_BOUNDARY,
        createdBy: safeActor,
        approvedBy: safeActor === 'AGENT' ? 'HUMAN_APPROVAL' : null,
        createdAt: Number(nowMs),
        updatedAt: Number(nowMs),
        activatedAt: Number(nowMs),
        archivedAt: null
      };
      const persisted = store.writeCivicProject(project);
      bundle.civicProjects = normalizeCivicProjects(store.listCivicProjectsByPlot(bundle.plot.plotId));
      createEvent(pendingEvents, {
        plotId: bundle.plot.plotId,
        eventType: 'CIVIC_PROJECT_ACTIVATED',
        actor: safeActor,
        summary: `Civic project activated: ${persisted.title}.`,
        explanation: 'HQ10D activates one bounded local public-work project. The Civic Beacon adds a deterministic local readiness marker only; it does not spend resources, create routes, schedule work, publish externally, or grant Atlas execution.',
        data: {
          projectId: persisted.projectId,
          sourceProposalId: persisted.sourceProposalId,
          projectType: persisted.projectType,
          status: persisted.status,
          effect: clone(persisted.effect),
          receipt: clone(persisted.receipt),
          authorityBoundary: persisted.authorityBoundary
        },
        createdAt: nowMs
      });
      if (safeActor === 'AGENT') {
        markAgentAction(bundle, pendingEvents, 'activate_civic_project', 'Foreman activated a bounded civic project after matching human approval.', nowMs);
      }
      return {
        ok: true,
        extras: {
          civicProject: clone(persisted),
          project: clone(persisted),
          alreadyActivated: false,
          effectApplied: true,
          civicProjects: civicProjectsReadModel(bundle)
        }
      };
    }
  });
}

function inspectCivicProject({
  pairId,
  houseId = null,
  plotId = null,
  projectId,
  inspectionType = 'baseline_readiness',
  note = '',
  actor = 'HUMAN',
  idempotencyKey,
  nowMs
}) {
  const safeProjectId = safeText(projectId, '', 120);
  const normalizedInspectionType = slugFor(inspectionType, 'baseline_readiness');
  const safeInspectionType = CIVIC_PROJECT_INSPECTION_TYPES.includes(normalizedInspectionType)
    ? normalizedInspectionType
    : 'baseline_readiness';
  const safeNote = safeText(note, '', 320);
  const approvalParams = {
    projectId: safeProjectId,
    inspectionType: safeInspectionType,
    note: safeNote
  };
  return withIdempotency({
    pairId,
    houseId,
    plotId,
    actionName: 'inspect_civic_project',
    idempotencyKey,
    requestPayload: { ...approvalParams, actor },
    nowMs,
    mutator(bundle, pendingEvents) {
      const safeActor = mutationActor(actor);
      if (!safeProjectId) {
        return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'Civic project inspection requires projectId.', false, {
          reason: 'missing_project_id'
        });
      }
      const project = normalizeCivicProjects(bundle.civicProjects || [])
        .find((candidate) => candidate.projectId === safeProjectId);
      if (!project) {
        return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'Civic project inspection requires an existing project on the current plot.', false, {
          reason: 'current_plot_civic_project_required',
          projectId: safeProjectId
        });
      }
      if (project.status !== 'ACTIVE') {
        return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'Only active civic projects can be inspected.', false, {
          reason: 'active_civic_project_required',
          projectId: safeProjectId,
          status: project.status
        });
      }
      if (safeActor === 'AGENT') {
        const approval = consumeActionApproval(bundle, 'inspect_civic_project', approvalParams, nowMs);
        if (!approval) {
          return errorEnvelope(bundle.plot.plotId, 'FORBIDDEN_POLICY', 'Agent civic project inspection requires matching human approval.', true, {
            requiresApproval: true,
            actionName: 'inspect_civic_project',
            requestedParams: approvalParams
          });
        }
      }
      const existingInspections = normalizeCivicProjectInspections(project);
      const existing = existingInspections.find((entry) => entry.inspectionType === safeInspectionType);
      if (existing) {
        return {
          ok: true,
          extras: {
            civicProject: clone(project),
            project: clone(project),
            inspection: clone(existing),
            alreadyInspected: true,
            inspectionApplied: false,
            civicProjects: civicProjectsReadModel(bundle)
          }
        };
      }
      const worldGrid = worldGridReadModel(bundle);
      const inspection = {
        kind: 'civic_project_inspection',
        actionName: 'et.plot.inspect_civic_project',
        projectId: project.projectId,
        inspectionType: safeInspectionType,
        inspectedBy: safeActor,
        note: safeNote,
        worldGridProjectionHash: worldGrid.projectionHash,
        authorityBoundary: CIVIC_PROJECT_INSPECTION_AUTHORITY_BOUNDARY,
        inspectedAt: Number(nowMs),
        resourceDelta: {},
        routeCreation: false,
        tradeRouteCreation: false,
        backgroundScheduling: false,
        externalEffects: false,
        atlasExecution: false,
        crossPlotMutation: false
      };
      const nextInspections = [...existingInspections, inspection];
      const updated = {
        ...project,
        effect: normalizeCivicProjectEffect({
          ...project.effect,
          inspection: {
            baselineReadinessInspected: nextInspections.some((entry) => entry.inspectionType === 'baseline_readiness'),
            inspectionCount: nextInspections.length,
            latestInspectedAt: Number(nowMs)
          }
        }, project.projectType),
        receipt: {
          ...(project.receipt && typeof project.receipt === 'object' ? clone(project.receipt) : {}),
          inspections: clone(nextInspections)
        },
        approvedBy: safeActor === 'AGENT' ? project.approvedBy || 'HUMAN_APPROVAL' : project.approvedBy,
        updatedAt: Number(nowMs)
      };
      const persisted = store.writeCivicProject(updated);
      bundle.civicProjects = normalizeCivicProjects(store.listCivicProjectsByPlot(bundle.plot.plotId));
      createEvent(pendingEvents, {
        plotId: bundle.plot.plotId,
        eventType: 'CIVIC_PROJECT_INSPECTED',
        actor: safeActor,
        summary: `Civic project inspected: ${persisted.title}.`,
        explanation: 'HQ11 records one bounded baseline inspection for an active same-plot civic project. It updates local readiness metadata only; it does not spend resources, create routes, schedule work, publish externally, mutate other plots, or grant Atlas execution.',
        data: {
          projectId: persisted.projectId,
          projectType: persisted.projectType,
          inspection,
          authorityBoundary: CIVIC_PROJECT_INSPECTION_AUTHORITY_BOUNDARY
        },
        createdAt: nowMs
      });
      if (safeActor === 'AGENT') {
        markAgentAction(bundle, pendingEvents, 'inspect_civic_project', 'Foreman inspected a same-plot civic project after matching human approval.', nowMs);
      }
      return {
        ok: true,
        extras: {
          civicProject: clone(persisted),
          project: clone(persisted),
          inspection: clone(inspection),
          alreadyInspected: false,
          inspectionApplied: true,
          civicProjects: civicProjectsReadModel(bundle)
        }
      };
    }
  });
}

function listOwnedPlots({
  pairId,
  houseId = null,
  plotId = null,
  nowMs
}) {
  return store.withTransaction(() => {
    const bundle = ensurePlotBundle({ pairId, houseId, plotId, nowMs });
    if (!verifyPlotAccess(bundle, pairId, plotId, nowMs)) {
      return errorEnvelope(plotId, 'UNAUTHORIZED', 'Requested plot does not belong to the current session.', false);
    }
    const plots = ownedPlotSummaries(pairId, bundle.plot.plotId);
    const homePlotId = plots.find((plot) => plot.role === 'HOME')?.plotId || bundle.plot.plotId;
    return successEnvelope({
      plotId: bundle.plot.plotId,
      worldDelta: [],
      extras: {
        homePlotId,
        activePlotId: bundle.plot.plotId,
        plots,
        settlementClaims: normalizeSettlementClaims(bundle.settlementClaims || [])
      }
    });
  });
}

function prepareSettlerConvoy({
  pairId,
  houseId = null,
  plotId = null,
  sitePlanId,
  actor = 'HUMAN',
  idempotencyKey,
  nowMs
}) {
  return withIdempotency({
    pairId,
    houseId,
    plotId,
    actionName: 'prepare_settler_convoy',
    idempotencyKey,
    requestPayload: { sitePlanId, actor },
    nowMs,
    mutator(bundle, pendingEvents) {
      const safeActor = mutationActor(actor);
      const safeSitePlanId = safeText(sitePlanId, '', 120);
      const existing = store.findSettlementClaimForPlan(bundle.plot.plotId, safeSitePlanId);
      if (existing) {
        return {
          ok: true,
          extras: {
            settlementClaim: clone(existing),
            job: existing.convoyJobId ? clone(bundle.jobs.find((job) => job.jobId === existing.convoyJobId) || null) : null,
            existing: true
          }
        };
      }
      const plans = normalizeSitePlans(bundle.plot.sitePlans);
      const planIndex = plans.findIndex((entry) => entry.planId === safeSitePlanId);
      if (planIndex < 0) {
        return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'Settler Convoy preparation requires an existing reviewed Site Plan.', false, {
          reason: 'missing_site_plan'
        });
      }
      const plan = plans[planIndex];
      if (!canPrepareSettlerConvoy(bundle, plan)) {
        return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'Settler Convoy preparation requires an HQ6-reviewed claim-ready Site Plan.', false, {
          reason: Number(bundle.plot.hqLevel || 1) < SETTLER_CONVOY_DEF.bridgeRequiredHqLevel ? 'hq_locked' : 'site_plan_not_claim_ready',
          requiredHqLevel: SETTLER_CONVOY_DEF.bridgeRequiredHqLevel,
          promotionStatus: plan.promotionStatus
        });
      }
      const expeditionBoard = bundle.buildings.find((building) => building.type === 'EXPEDITION_BOARD');
      if (!expeditionBoard) {
        return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'A Settler Convoy must be prepared from a built Expedition Board.', false, {
          reason: 'missing_expedition_board'
        });
      }
      if (expeditionBoard.state !== 'READY' || findActiveJobForBuilding(bundle, expeditionBoard.buildingId)) {
        return errorEnvelope(bundle.plot.plotId, 'JOB_ALREADY_RUNNING', 'The Expedition Board must be ready before preparing a Settler Convoy.', true, {
          reason: 'expedition_board_busy'
        });
      }
      if (safeActor === 'AGENT') {
        const approval = consumeActionApproval(bundle, 'prepare_settler_convoy', { sitePlanId: safeSitePlanId }, nowMs);
        if (!approval) {
          return errorEnvelope(bundle.plot.plotId, 'FORBIDDEN_POLICY', 'Agent Settler Convoy preparation requires matching human approval.', true, {
            requiresApproval: true
          });
        }
      }
      const paid = deductResources(bundle.plot.inventory, SETTLER_CONVOY_DEF.cost);
      if (!paid.ok) {
        return errorEnvelope(bundle.plot.plotId, 'OUT_OF_RESOURCES', 'Not enough resources to prepare a Settler Convoy.', false, {
          missing: resourceShortfall(bundle.plot.inventory, SETTLER_CONVOY_DEF.cost),
          cost: clone(SETTLER_CONVOY_DEF.cost)
        });
      }
      bundle.plot.inventory = paid.inventory;
      const job = {
        jobId: randomId('job'),
        plotId: bundle.plot.plotId,
        buildingId: expeditionBoard.buildingId,
        kind: 'SETTLER_CONVOY',
        input: clone(SETTLER_CONVOY_DEF.cost),
        output: clone(SETTLER_CONVOY_DEF.output),
        startedAt: nowMs,
        endsAt: nowMs + SETTLER_CONVOY_DEF.durationMs,
        durationMs: SETTLER_CONVOY_DEF.durationMs,
        status: 'RUNNING',
        createdBy: safeActor,
        explanation: 'Prepare a bounded Settler Convoy from one reviewed Site Plan. This creates a claim record and timed convoy, not a world map.',
        createdAt: nowMs,
        updatedAt: nowMs
      };
      const claim = buildSettlementClaimFromSitePlan(bundle, plan, job, safeActor, nowMs);
      job.output = { ...job.output, claimId: claim.claimId };
      expeditionBoard.state = 'PRODUCING';
      expeditionBoard.updatedAt = nowMs;
      bundle.jobs.push(job);
      const persistedClaim = store.writeSettlementClaim(claim);
      plans[planIndex] = {
        ...plan,
        status: 'CONVOY_PREPARING',
        promotionStatus: 'convoy_preparing',
        claimId: persistedClaim.claimId,
        convoyJobId: job.jobId,
        claimedAt: Number(nowMs),
        recommendedNext: 'Wait for the Settler Convoy to arrive, then explicitly found the outpost.'
      };
      bundle.plot.sitePlans = normalizeSitePlans(plans);
      bundle.settlementClaims = normalizeSettlementClaims(store.listSettlementClaimsByOwner(bundle.ownerPairId || pairId));
      createEvent(pendingEvents, {
        plotId: bundle.plot.plotId,
        eventType: 'SETTLER_CONVOY_PREPARED',
        actor: safeActor,
        buildingId: expeditionBoard.buildingId,
        jobId: job.jobId,
        summary: `Settler Convoy prepared for ${plan.title}.`,
        explanation: 'Resources were spent and a timed convoy was started. No second plot exists until founding is explicitly confirmed.',
        data: {
          claimId: persistedClaim.claimId,
          sitePlanId: plan.planId,
          cost: clone(SETTLER_CONVOY_DEF.cost),
          durationMs: SETTLER_CONVOY_DEF.durationMs,
          createsSecondPlot: false
        },
        createdAt: nowMs
      });
      if (safeActor === 'AGENT') {
        markAgentAction(bundle, pendingEvents, 'prepare_settler_convoy', 'Foreman prepared a Settler Convoy after human approval.', nowMs);
      }
      return {
        ok: true,
        extras: { settlementClaim: clone(persistedClaim), job: clone(job), existing: false }
      };
    }
  });
}

function createOutpostFromClaim({ pairId, houseId = null, claim, nowMs }) {
  const plotId = `plot_${hashPayload({ settlementClaimId: claim.claimId }).slice(0, 16)}`;
  const existing = store.readPlotBundleById(plotId);
  if (existing?.plot) {
    store.writePlotMembership({
      pairId,
      plotId,
      role: 'OUTPOST',
      originClaimId: claim.claimId,
      createdAt: nowMs,
      updatedAt: nowMs
    });
    return { plot: existing.plot, buildings: existing.buildings, policy: existing.policy || defaultPolicy(plotId, nowMs), existing: true };
  }
  const plot = {
    plotId,
    pairId: `settlement:${claim.claimId}`,
    houseId: houseId || null,
    status: 'ACTIVE',
    hqLevel: 1,
    townXp: 0,
    inventory: { wood: 8, stone: 0, food: 8, coin: 4 },
    storageCaps: clone(HQ_LEVEL_RULES[1].storageCaps),
    constructionSlots: HQ_LEVEL_RULES[1].constructionSlots,
    nextBuildBuffPct: 0,
    claimedRewards: [],
    seenBuildingTypes: ['HQ'],
    collectedBuildingTypes: [],
    agentTiersXpAwarded: [],
    scoutReports: [],
    sitePlans: [],
    doctrineState: {},
    lastDailyBonusDay: null,
    dailySoldCoin: 0,
    dailySellDay: nowDayKey(nowMs),
    lastViewedAt: nowMs,
    pendingRecapFrom: null,
    pendingRecapTo: null,
    createdAt: nowMs,
    updatedAt: nowMs,
    lastSimulatedAt: nowMs
  };
  const hq = {
    buildingId: `bldg_hq_${plotId.slice(-8)}`,
    plotId,
    objectInstanceId: null,
    type: 'HQ',
    level: 1,
    x: 1,
    y: 0,
    state: 'READY',
    outputBuffer: {},
    priority: 'BALANCED',
    createdAt: nowMs,
    updatedAt: nowMs
  };
  const policy = defaultPolicy(plotId, nowMs);
  store.writePlot(plot);
  store.writeBuildings([hq]);
  store.writePolicy(policy);
  store.writePlotMembership({
    pairId,
    plotId,
    role: 'OUTPOST',
    originClaimId: claim.claimId,
    createdAt: nowMs,
    updatedAt: nowMs
  });
  store.appendEvents([{
    plotId,
    eventType: 'PLOT_CREATED_FROM_CONVOY',
    actor: 'SYSTEM',
    buildingId: hq.buildingId,
    jobId: null,
    summary: `${claim.title} founded as a new outpost.`,
    explanation: 'A reviewed Site Plan and arrived Settler Convoy created this player-owned outpost record.',
    data: {
      claimId: claim.claimId,
      originPlotId: claim.originPlotId,
      sitePlanId: claim.sitePlanId,
      plotKind: 'OUTPOST',
      siteType: claim.siteType,
      risk: claim.risk,
      traits: clone(claim.traits || []),
      resourceHints: clone(claim.resourceHints || {})
    },
    createdAt: nowMs
  }]);
  return { plot, buildings: [hq], policy, existing: false };
}

function foundSettlement({
  pairId,
  houseId = null,
  plotId = null,
  claimId,
  actor = 'HUMAN',
  idempotencyKey,
  nowMs
}) {
  return withIdempotency({
    pairId,
    houseId,
    plotId,
    actionName: 'found_settlement',
    idempotencyKey,
    requestPayload: { claimId, actor },
    nowMs,
    mutator(bundle, pendingEvents) {
      const safeActor = mutationActor(actor);
      const safeClaimId = safeText(claimId, '', 120);
      const claim = store.getSettlementClaim(safeClaimId);
      if (!claim || claim.ownerPairId !== (bundle.ownerPairId || pairId) || claim.originPlotId !== bundle.plot.plotId) {
        return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'Settlement founding requires an arrived claim owned by this plot.', false, {
          reason: 'missing_settlement_claim'
        });
      }
      if (claim.status === 'FOUNDED' && claim.foundedPlotId) {
        return {
          ok: true,
          extras: {
            settlementClaim: clone(claim),
            foundedPlot: ownedPlotSummaries(pairId, claim.foundedPlotId).find((plot) => plot.plotId === claim.foundedPlotId) || { plotId: claim.foundedPlotId },
            ownedPlots: ownedPlotSummaries(pairId, bundle.plot.plotId),
            existing: true
          }
        };
      }
      if (claim.status !== 'CONVOY_ARRIVED') {
        return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'The Settler Convoy must arrive before founding a settlement.', true, {
          reason: 'convoy_not_arrived',
          status: claim.status
        });
      }
      if (safeActor === 'AGENT') {
        const approval = consumeActionApproval(bundle, 'found_settlement', { claimId: safeClaimId }, nowMs);
        if (!approval) {
          return errorEnvelope(bundle.plot.plotId, 'FORBIDDEN_POLICY', 'Agent settlement founding requires matching human approval.', true, {
            requiresApproval: true
          });
        }
      }
      const founded = createOutpostFromClaim({ pairId, houseId, claim, nowMs });
      claim.status = 'FOUNDED';
      claim.foundedPlotId = founded.plot.plotId;
      claim.foundedAt = Number(nowMs);
      claim.updatedAt = Number(nowMs);
      claim.route = {
        ...(claim.route || {}),
        progress: 1,
        foundedPlotId: founded.plot.plotId,
        visualOnlyProjection: true
      };
      claim.receipt = {
        ...(claim.receipt || {}),
        kind: 'settlement_founded',
        foundedPlotId: founded.plot.plotId,
        foundedAt: Number(nowMs),
        authorityBoundary: 'server_owned_second_plot_no_world_map'
      };
      const persistedClaim = store.writeSettlementClaim(claim);
      const plans = normalizeSitePlans(bundle.plot.sitePlans);
      const planIndex = plans.findIndex((plan) => plan.planId === claim.sitePlanId);
      if (planIndex >= 0) {
        plans[planIndex] = {
          ...plans[planIndex],
          status: 'FOUNDED',
          promotionStatus: 'claimed',
          claimId: claim.claimId,
          foundedPlotId: founded.plot.plotId,
          recommendedNext: 'Open the outpost as a separate player-owned plot. Site traits are recorded but have no mechanical effect yet.'
        };
        bundle.plot.sitePlans = normalizeSitePlans(plans);
      }
      bundle.settlementClaims = normalizeSettlementClaims(store.listSettlementClaimsByOwner(pairId));
      bundle.memberships = store.listPlotMemberships(pairId);
      createEvent(pendingEvents, {
        plotId: bundle.plot.plotId,
        eventType: 'SETTLEMENT_FOUNDED',
        actor: safeActor,
        buildingId: null,
        jobId: claim.convoyJobId || null,
        summary: `${claim.title} founded as a second plot.`,
        explanation: 'The server created one owned outpost plot from the arrived Settler Convoy claim.',
        data: {
          claimId: claim.claimId,
          foundedPlotId: founded.plot.plotId,
          sitePlanId: claim.sitePlanId,
          plotKind: 'OUTPOST'
        },
        createdAt: nowMs
      });
      if (safeActor === 'AGENT') {
        markAgentAction(bundle, pendingEvents, 'found_settlement', 'Foreman founded a settlement after human approval.', nowMs);
      }
      return {
        ok: true,
        extras: {
          settlementClaim: clone(persistedClaim),
          foundedPlot: ownedPlotSummaries(pairId, founded.plot.plotId).find((plot) => plot.plotId === founded.plot.plotId) || { plotId: founded.plot.plotId },
          ownedPlots: ownedPlotSummaries(pairId, bundle.plot.plotId),
          existing: founded.existing
        }
      };
    }
  });
}

function upgradeBuilding({
  pairId,
  houseId = null,
  plotId = null,
  buildingId,
  actor = 'HUMAN',
  idempotencyKey,
  nowMs
}) {
  return withIdempotency({
    pairId,
    houseId,
    plotId,
    actionName: 'upgrade_building',
    idempotencyKey,
    requestPayload: { buildingId, actor },
    nowMs,
    mutator(bundle, pendingEvents) {
      const safeActor = mutationActor(actor);
      const building = findBuilding(bundle, buildingId);
      if (!building) {
        return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'Building not found on this plot.', false);
      }
      const active = findActiveJobForBuilding(bundle, buildingId);
      if (active) {
        return errorEnvelope(bundle.plot.plotId, 'JOB_ALREADY_RUNNING', 'This building already has an active or claimable job.', false);
      }

      let upgradeRule = null;
      if (building.type === 'HQ') {
        upgradeRule = HQ_UPGRADE_RULES[bundle.plot.hqLevel] || null;
      } else {
        upgradeRule = BUILDING_DEFS[building.type]?.upgrade?.[building.level] || null;
      }
      if (!upgradeRule) {
        return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'No further upgrade path exists for this building in Phase 1.', false);
      }

      if (building.type === 'HQ') {
        const prerequisiteStatus = hqBuildingPrerequisiteStatus(bundle, upgradeRule);
        const missingPrerequisites = prerequisiteStatus.filter((entry) => !entry.satisfied);
        if (missingPrerequisites.length) {
          const names = missingPrerequisites.map((entry) => entry.label).join(', ');
          return errorEnvelope(
            bundle.plot.plotId,
            'MISSING_HQ_BUILDING_PREREQUISITES',
            `HQ Level ${upgradeRule.nextLevel} requires completed prerequisite building${missingPrerequisites.length === 1 ? '' : 's'}: ${names}.`,
            false,
            {
              fromLevel: bundle.plot.hqLevel,
              targetLevel: upgradeRule.nextLevel,
              buildingPrerequisites: prerequisiteStatus,
              missingPrerequisites
            }
          );
        }
        if (Number(bundle.plot.townXp || 0) < Number(upgradeRule.xpRequired || 0)) {
          return errorEnvelope(bundle.plot.plotId, 'OUT_OF_RESOURCES', 'Not enough town XP for the next HQ upgrade.', false);
        }
        if (safeActor === 'AGENT') {
          const approval = consumeActionApproval(bundle, 'upgrade_building', { buildingId }, nowMs);
          if (!approval) {
            return errorEnvelope(
              bundle.plot.plotId,
              'FORBIDDEN_POLICY',
              'Agent HQ upgrades require a matching human approval request.',
              true,
              { requiresApproval: true }
            );
          }
        }
      }

      const paid = deductResources(bundle.plot.inventory, upgradeRule.cost);
      if (!paid.ok) {
        return errorEnvelope(bundle.plot.plotId, 'OUT_OF_RESOURCES', 'Not enough resources to start that upgrade.', false);
      }
      bundle.plot.inventory = paid.inventory;
      const job = {
        jobId: randomId('job'),
        plotId: bundle.plot.plotId,
        buildingId: building.buildingId,
        kind: 'UPGRADE',
        input: clone(upgradeRule.cost),
        output: building.type === 'HQ' ? { hqLevel: upgradeRule.nextLevel } : { level: upgradeRule.toLevel },
        startedAt: null,
        endsAt: null,
        durationMs: Number(upgradeRule.durationMs || 0),
        status: 'QUEUED',
        createdBy: safeActor,
        explanation: building.type === 'HQ'
          ? `Upgrade HQ from Level ${bundle.plot.hqLevel} to ${upgradeRule.nextLevel}.`
          : `Upgrade ${BUILDING_LABELS[building.type]} to Level ${upgradeRule.toLevel}.`,
        createdAt: nowMs,
        updatedAt: nowMs
      };
      building.state = 'UPGRADING';
      building.updatedAt = nowMs;
      bundle.jobs.push(job);
      createEvent(pendingEvents, {
        plotId: bundle.plot.plotId,
        eventType: 'JOB_QUEUED',
        actor: safeActor,
        buildingId: building.buildingId,
        jobId: job.jobId,
        summary: `${BUILDING_LABELS[building.type]} upgrade queued.`,
        explanation: job.explanation,
        data: {
          kind: 'UPGRADE',
          cost: clone(job.input)
        },
        createdAt: nowMs
      });
      if (safeActor === 'AGENT') {
        markAgentAction(bundle, pendingEvents, 'upgrade_building', job.explanation, nowMs);
      }
      maybeStartQueuedConstructionJobs(bundle, nowMs, pendingEvents);
      return {
        ok: true,
        extras: { job: clone(job) }
      };
    }
  });
}

function setPriority({
  pairId,
  houseId = null,
  plotId = null,
  buildingId,
  priority,
  actor = 'HUMAN',
  idempotencyKey,
  nowMs
}) {
  return withIdempotency({
    pairId,
    houseId,
    plotId,
    actionName: 'set_priority',
    idempotencyKey,
    requestPayload: { buildingId, priority, actor },
    nowMs,
    mutator(bundle, pendingEvents) {
      const safeActor = mutationActor(actor);
      const building = findBuilding(bundle, buildingId);
      if (!building) {
        return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'Building not found on this plot.', false);
      }
      const safePriority = String(priority || '').trim().toUpperCase();
      if (!['WOOD', 'STONE', 'FOOD', 'BALANCED'].includes(safePriority)) {
        return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'Priority must be one of WOOD, STONE, FOOD, BALANCED.', false);
      }
      if (safeActor === 'AGENT') {
        const denied = assertAgentPolicy(bundle, 'setPriority', {
          nowMs,
          actionName: 'set_priority',
          retryableMessage: 'Priority changes are locked until HQ 4 and explicit approval are both enabled.'
        });
        if (denied) return denied;
      }
      building.priority = safePriority;
      building.updatedAt = nowMs;
      createEvent(pendingEvents, {
        plotId: bundle.plot.plotId,
        eventType: 'AGENT_PERMISSION_CHANGED',
        actor: safeActor,
        buildingId: building.buildingId,
        summary: `${BUILDING_LABELS[building.type]} priority set to ${safePriority}.`,
        explanation: safeActor === 'AGENT'
          ? `Foreman set priority to ${safePriority} because the policy toggle allows one priority control.`
          : `Priority set manually to ${safePriority}.`,
        data: { priority: safePriority },
        createdAt: nowMs
      });
      if (safeActor === 'AGENT') {
        markAgentAction(bundle, pendingEvents, 'set_priority', `Foreman set ${BUILDING_LABELS[building.type]} priority to ${safePriority}.`, nowMs, 'setPriority');
      }
      return {
        ok: true,
        extras: { building: clone(building) }
      };
    }
  });
}

function claimReward({
  pairId,
  houseId = null,
  plotId = null,
  rewardId,
  actor = 'HUMAN',
  idempotencyKey,
  nowMs
}) {
  return withIdempotency({
    pairId,
    houseId,
    plotId,
    actionName: 'claim_reward',
    idempotencyKey,
    requestPayload: { rewardId, actor },
    nowMs,
    mutator(bundle, pendingEvents) {
      const reward = availableRewards(bundle).find((entry) => entry.rewardId === rewardId);
      if (!reward) {
        return errorEnvelope(bundle.plot.plotId, 'INVALID_STATE', 'Reward is not claimable on this plot.', false);
      }
      const grant = clone(reward.grant || {});
      const resourceGrant = {};
      for (const key of RESOURCE_KEYS) {
        if (Number(grant[key] || 0) > 0) resourceGrant[key] = Number(grant[key]);
      }
      if (Object.keys(resourceGrant).length) {
        const transfer = addResourcesWithCaps(bundle.plot.inventory, resourceGrant, bundle.plot.storageCaps);
        bundle.plot.inventory = transfer.inventory;
      }
      if (Number(grant.town_xp || 0) > 0) addTownXp(bundle.plot, Number(grant.town_xp || 0));
      bundle.plot.claimedRewards = includesOnce(bundle.plot.claimedRewards, reward.rewardId);
      createEvent(pendingEvents, {
        plotId: bundle.plot.plotId,
        eventType: 'REWARD_CLAIMED',
        actor: mutationActor(actor),
        summary: `${reward.title} claimed.`,
        explanation: reward.body,
        data: {
          rewardId: reward.rewardId,
          grant
        },
        createdAt: nowMs
      });
      return {
        ok: true,
        extras: { reward }
      };
    }
  });
}

function readPublicPlot({ plotId, includeReplay = false }) {
  const bundle = store.readPlotBundleById(plotId);
  if (!bundle) {
    return errorEnvelope(plotId, 'INVALID_STATE', 'Public plot not found.', false);
  }
  bundle.approvals = [];
  bundle.events = store.listEvents(plotId);
  const { state, recap, stateHash } = buildState(bundle, {
    includeReplay,
    includePublicSummary: true
  });
  return successEnvelope({
    plotId,
    worldDelta: [],
    state,
    recap,
    stateHash
  });
}

function listPublicPlots(limit = 20) {
  const rows = store.listPublicPlots(limit);
  return {
    ok: true,
    plots: rows
  };
}

function advancePlotTimeForTests({
  pairId,
  houseId = null,
  plotId = null,
  advanceMs = 0,
  nowMs
}) {
  return store.withTransaction(() => {
    const bundle = ensurePlotBundle({ pairId, houseId, plotId, nowMs });
    if (!verifyPlotAccess(bundle, pairId, plotId, nowMs)) {
      return errorEnvelope(plotId, 'UNAUTHORIZED', 'Requested plot does not belong to the current session.', false);
    }
    const pendingEvents = [];
    const targetMs = Math.max(nowMs, Number(bundle.plot.lastSimulatedAt || nowMs) + Math.max(0, Number(advanceMs || 0)));
    simulateBundleTo(bundle, targetMs, pendingEvents);
    const inserted = applyPendingEvents(bundle, pendingEvents);
    persistBundle(bundle);
    const { state, recap, stateHash } = buildState(bundle, { includeReplay: false, includePublicSummary: true });
    return successEnvelope({
      plotId: bundle.plot.plotId,
      worldDelta: inserted.map((event) => makeWorldDelta(event.eventType, event.summary, event.buildingId || event.jobId || bundle.plot.plotId)),
      state,
      recap,
      stateHash
    });
  });
}

module.exports = {
  PADS,
  BUILDING_DEFS,
  SCOUT_REPORT_TEMPLATES,
  SETTLER_CONVOY_DEF,
  DOCTRINE_CATALOG,
  WORK_ORDER_TEMPLATES,
  CIVIC_PROPOSAL_STATUSES,
  CIVIC_PROPOSAL_CATEGORIES,
  CIVIC_PROPOSAL_AUTHORITY_BOUNDARY,
  OVERLAY_PACK_STATUSES,
  OVERLAY_PACK_AUTHORITY_BOUNDARY,
  CIVIC_PROJECT_STATUSES,
  CIVIC_PROJECT_TYPES,
  CIVIC_PROJECT_AUTHORITY_BOUNDARY,
  CIVIC_PROJECT_INSPECTION_AUTHORITY_BOUNDARY,
  CIVIC_PROJECT_INSPECTION_TYPES,
  CIVIC_BEACON_EFFECT_ID,
  EXPEDITION_MAP_AUTHORITY_BOUNDARY,
  EXPEDITION_SCOUT_SECTOR_AUTHORITY_BOUNDARY,
  EXPEDITION_EVENT_PACKET_AUTHORITY_BOUNDARY,
  EXPEDITION_PARTY_MANIFEST_AUTHORITY_BOUNDARY,
  EXPEDITION_UNIT_ROSTER_AUTHORITY_BOUNDARY,
  EXPEDITION_UNIT_ROSTER_VERSION,
  EXPEDITION_UNIT_MOVE_AUTHORITY_BOUNDARY,
  EXPEDITION_UNIT_MOVE_VERSION,
  EXPEDITION_SURVEY_BRIDGE_AUTHORITY_BOUNDARY,
  EXPEDITION_SURVEY_BRIDGE_VERSION,
  EXPEDITION_PACKET_SITE_PLAN_AUTHORITY_BOUNDARY,
  EXPEDITION_PACKET_SITE_PLAN_VERSION,
  EXPEDITION_MAP_FOG_STATES,
  EXPEDITION_PUBLIC_TERRAIN_ASSET_CONTRACT_VERSION,
  EXPEDITION_PUBLIC_TERRAIN_ASSET_SLOT_SOURCE,
  EXPEDITION_PUBLIC_TERRAIN_ASSET_SLOTS,
  EXPEDITION_FOG_ASSET_SLOTS,
  SURVEY_DISCIPLINE_SCOUT_DURATION_MULTIPLIER,
  SURVEY_DISCIPLINE_SCOUT_DURATION_REDUCTION_PCT,
  HQ_LEVEL_RULES,
  HQ_UPGRADE_RULES,
  hqBuildingPrerequisiteStatus,
  applyDoctrineEffectsToJobSpec,
  worldGridReadModel,
  buildExpeditionMapReadModel,
  civicProposalsReadModel,
  overlayPacksReadModel,
  civicProjectsReadModel,
  getFoundersPlotState,
  getWorldGridStatus,
  getExpeditionMapStatus,
  scoutExpeditionSector,
  moveExpeditionUnit,
  listCivicProposalRecords,
  createCivicProposalRecord,
  listOverlayPackRecords,
  createOverlayPackRecord,
  listCivicProjectRecords,
  activateCivicProject,
  inspectCivicProject,
  setFoundersPlotPolicy,
  resolveApproval,
  acknowledgeRecap,
  createApprovalRequest,
  placeBuilding,
  queueJob,
  collectOutputs,
  draftSitePlan,
  draftSitePlanFromPacket,
  reviewSitePlan,
  selectDoctrine,
  createWorkOrderDraft,
  executeWorkOrder,
  listOwnedPlots,
  prepareSettlerConvoy,
  foundSettlement,
  upgradeBuilding,
  setPriority,
  claimReward,
  readPublicPlot,
  listPublicPlots,
  advancePlotTimeForTests
};
