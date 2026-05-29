'use strict';

const crypto = require('crypto');

const engine = require('./engine');
const store = require('./store');
const { FOUNDERS_PLOT_TOOL_SPECS } = require('./tools');
const {
  RESOURCE_KEYS,
  getAgentTownIcon,
  getAgentTownIconCatalog
} = require('../agent_town_icons');

const ATLAS_VERSION = 'founders-plot-progression-atlas-v1';
const DEFAULT_STRATEGY_KEY = 'rush-hq3';
const STEP_KINDS = Object.freeze(['canonical_node', 'custom_note', 'future_placeholder']);
const FUTURE_SYSTEMS = Object.freeze([
  'expedition',
  'research',
  'territory',
  'unit',
  'oracle',
  'settlement',
  'work_order',
  'civic',
  'world_grid',
  'generated_universe'
]);
const RISK_LEVELS = Object.freeze(['low', 'medium', 'high', 'unknown']);
const REVERSIBILITY_LEVELS = Object.freeze(['safe', 'layout_sensitive', 'irreversible', 'unknown']);
const PRIVACY_LEVELS = Object.freeze(['private', 'share_redacted', 'public_template_allowed']);
const STRATEGY_CREATED_BY = Object.freeze(['human', 'openclaw_lite', 'clover', 'atlas_oracle']);
const STRATEGY_SOURCES = Object.freeze(['template', 'editor', 'oracle_draft', 'import', 'fork']);
const STRATEGY_TEMPLATES = Object.freeze({
  'rush-hq3': Object.freeze({
    strategyKey: 'rush-hq3',
    title: 'Rush HQ3',
    goal: 'Reach HQ Level 3 through normal Founders Plot play and unlock Foreman queueProduction.',
    summary: 'Fastest safe route through Lumber Camp, Farm Plot, Quarry, and HQ Level 3.',
    focus: ['Fast HQ upgrades', 'Quarry unlock', 'queueProduction readiness'],
    tradeoff: 'Fastest path to HQ3, but it gives the player less time to inspect each resource loop before Foreman queueing appears.',
    approvalDelegationBurden: 'Medium: most actions stay player-run until HQ3, then queueProduction becomes the first major Foreman delegation gate.'
  }),
  'balanced-food-wood': Object.freeze({
    strategyKey: 'balanced-food-wood',
    title: 'Balanced Food-Wood',
    goal: 'Build a steadier early economy by proving both wood and food before pushing the stone gate.',
    summary: 'Balanced opening that keeps Lumber Camp and Farm Plot visible before the HQ2 and Quarry push.',
    focus: ['Wood and food base', 'Lower early resource whiplash', 'HQ2 after two production loops'],
    tradeoff: 'More legible for new players, but it sacrifices some rush speed to make the wood and food chains feel understood.',
    approvalDelegationBurden: 'Low: this plan keeps the human in direct control and delays Foreman delegation until the economy is easier to read.'
  }),
  'delegate-outputs-first': Object.freeze({
    strategyKey: 'delegate-outputs-first',
    title: 'Delegate Outputs First',
    goal: 'Reach HQ Level 2 deliberately, review collectOutputs, then continue toward Foreman queueProduction.',
    summary: 'Foreman-readiness route that makes the HQ2 collectOutputs permission an explicit checkpoint before HQ3.',
    focus: ['Foreman readiness', 'collectOutputs checkpoint', 'queueProduction policy gate'],
    tradeoff: 'Best for teaching delegation boundaries, but it asks the player to pause at HQ2 before pushing to HQ3.',
    approvalDelegationBurden: 'High: this plan asks the player to inspect output collection at HQ2 before approving deeper queueProduction delegation at HQ3.'
  }),
  'hq10-horizon': Object.freeze({
    strategyKey: 'hq10-horizon',
    title: 'HQ10 Horizon',
    goal: 'Extend the current settlement into expeditions, second plots, research, agent cohorts, and world-grid civilization.',
    summary: 'Uses current HQ1-HQ5 truth as the launchpad, then marks HQ6-HQ10 as advisory future milestones.',
    focus: ['Expansion', 'Research', 'Multi-plot strategy', 'Agent cohorts'],
    tradeoff: 'Most of the path past HQ5 is future design, so it must stay advisory until each gameplay model exists.',
    approvalDelegationBurden: 'High later: expeditions, claims, cohorts, and civic actions will all need explicit receipts and approval boundaries.'
  })
});
const STRATEGY_TEMPLATE_KEYS = Object.freeze(Object.keys(STRATEGY_TEMPLATES));
const HQ10_HORIZON_MILESTONES = Object.freeze([
  Object.freeze({
    id: 'expedition_board',
    level: 6,
    system: 'expedition',
    title: 'HQ6: Expedition Board',
    summary: 'Turn the first settlement into a launch point for scouting nearby sites.',
    possibilities: [
      'Scout units leave Founders Plot and return site reports.',
      'Atlas plans can compare nearby resource profiles before the player commits.',
      'Rook can surface scouting approvals and expedition receipts.'
    ],
    nextImplementableSlice: 'Add an Expedition Board building, read-only site records, and a scout report receipt model.',
    riskLevel: 'medium'
  }),
  Object.freeze({
    id: 'second_settlement',
    level: 7,
    system: 'territory',
    title: 'HQ7: Settler Convoy',
    summary: 'Let the player claim or found a second plot from a scouted site.',
    possibilities: [
      'Settlers can reserve a second plot with explicit approval.',
      'Plots can specialize by local resources and distance from the first town.',
      'Atlas strategies can plan routes, dependencies, and expansion timing.'
    ],
    nextImplementableSlice: 'Add claimable site state, a settler or convoy job, and a second-plot creation approval gate.',
    riskLevel: 'high'
  }),
  Object.freeze({
    id: 'research_doctrines',
    level: 8,
    system: 'research',
    title: 'HQ8: Research Lodge',
    summary: 'Introduce doctrines and tech choices that make towns diverge strategically.',
    possibilities: [
      'Players pick research lanes instead of only climbing linear HQ levels.',
      'Workshop buffs can evolve into named doctrines with tradeoffs.',
      'Atlas can compare food-first, quarry-first, logistics, and automation strategies.'
    ],
    nextImplementableSlice: 'Add a small research/doctrine table and one reversible doctrine that changes planning recommendations only.',
    riskLevel: 'medium'
  }),
  Object.freeze({
    id: 'agent_cohorts',
    level: 9,
    system: 'work_order',
    title: 'HQ9: Agent Cohorts',
    summary: 'Group Foremen, inhabitants, and future citizen agents into bounded work orders.',
    possibilities: [
      'Players can assign scoped cohorts to collect, build, scout, or research plans.',
      'Every delegated action keeps receipts, caps, idempotency, and human approval gates.',
      'Clover or an Atlas Oracle can explain why a cohort is blocked or safe to run.'
    ],
    nextImplementableSlice: 'Add private cohort/work-order schemas that reference existing et.plot.* tools without broadening authority.',
    riskLevel: 'high'
  }),
  Object.freeze({
    id: 'world_grid_civilization',
    level: 10,
    system: 'world_grid',
    title: 'HQ10: World Grid Civilization',
    summary: 'Connect multiple settlements into a civic/world-grid layer while keeping generated visuals separate from truth.',
    possibilities: [
      'World Grid routes, public works, and civic projects can span player-owned plots.',
      'Generated Universe packs can reskin the Atlas view without changing gameplay rules.',
      'Long-term Oracle memory can connect goals, decisions, strategy revisions, and receipts.'
    ],
    nextImplementableSlice: 'Define public-safe world-grid projection contracts before allowing any civic mutation tools.',
    riskLevel: 'high'
  })
]);
const RESOURCE_STORAGE_KEYS = Object.freeze(['wood', 'stone', 'food']);
const PRIORITY_OPTIONS = Object.freeze(['WOOD', 'STONE', 'FOOD', 'BALANCED']);
const REWARD_CATALOG = Object.freeze([
  {
    rewardId: 'quest.first-lumber',
    title: 'Supply crate',
    body: 'The first lumber haul kept the camp alive.',
    grant: { coin: 5 },
    requiredCollectedBuildingType: 'LUMBER_CAMP'
  },
  {
    rewardId: 'hq.level-2',
    title: 'Field notes',
    body: 'HQ Level 2 opens the food lane.',
    grant: { coin: 6 },
    requiredHqLevel: 2
  },
  {
    rewardId: 'hq.level-3',
    title: 'Quarry kit',
    body: 'A small reserve to help the new quarry boot.',
    grant: { wood: 8, stone: 4 },
    requiredHqLevel: 3
  },
  {
    rewardId: 'hq.level-4',
    title: 'Workshop charter',
    body: 'Your builders can now compress future timelines.',
    grant: { coin: 8 },
    requiredHqLevel: 4
  },
  {
    rewardId: 'hq.level-5',
    title: 'Founder stipend',
    body: 'Your overnight planner is now part of the town rhythm.',
    grant: { coin: 12, town_xp: 10 },
    requiredHqLevel: 5
  }
]);
const TOOL_HTTP = Object.freeze({
  'et.plot.get_state': { method: 'GET', path: '/api/founders-plot/state' },
  'et.plot.place_building': { method: 'POST', path: '/api/founders-plot/place-building' },
  'et.plot.queue_job': { method: 'POST', path: '/api/founders-plot/queue-job' },
  'et.plot.collect_outputs': { method: 'POST', path: '/api/founders-plot/collect-outputs' },
  'et.plot.upgrade_building': { method: 'POST', path: '/api/founders-plot/upgrade-building' },
  'et.plot.set_priority': { method: 'POST', path: '/api/founders-plot/set-priority' },
  'et.plot.claim_reward': { method: 'POST', path: '/api/founders-plot/claim-reward' },
  'et.plot.request_user_approval': { method: 'POST', path: '/api/founders-plot/request-approval' }
});

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function errorEnvelope(code, message, retryable = false, details = {}) {
  return {
    ok: false,
    error: {
      code: String(code || 'INVALID_STATE'),
      message: String(message || code || 'Progression Atlas failed.'),
      retryable: !!retryable,
      details: details && typeof details === 'object' ? details : {}
    }
  };
}

function successEnvelope(data) {
  return { ok: true, ...data };
}

function hashId(parts) {
  return crypto
    .createHash('sha256')
    .update(parts.map((part) => String(part || '')).join('|'))
    .digest('hex')
    .slice(0, 16);
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== 'object') return value;
  return Object.keys(value)
    .sort()
    .reduce((acc, key) => {
      acc[key] = stableValue(value[key]);
      return acc;
    }, {});
}

function stableHash(value) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(stableValue(value)))
    .digest('hex');
}

function normalizeStrategyKey(value) {
  return String(value || DEFAULT_STRATEGY_KEY).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
}

function cleanText(value, fallback = '', max = 160) {
  const text = String(value == null ? '' : value)
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return (text || fallback).slice(0, max);
}

function slugFor(value, fallback = 'step') {
  const slug = cleanText(value, fallback, 80)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return slug || fallback;
}

function strategyTemplateForKey(value) {
  const key = normalizeStrategyKey(value);
  return STRATEGY_TEMPLATES[key] || null;
}

function normalizeInventory(value) {
  const bag = value && typeof value === 'object' ? value : {};
  const out = {};
  for (const key of RESOURCE_KEYS) out[key] = Math.max(0, Math.floor(Number(bag[key] || 0)));
  return out;
}

function normalizeCost(value) {
  const cost = value && typeof value === 'object' ? value : {};
  const out = {};
  for (const key of RESOURCE_KEYS) {
    const amount = Math.max(0, Math.floor(Number(cost[key] || 0)));
    if (amount > 0) out[key] = amount;
  }
  return out;
}

function firstAllowed(value, allowed, fallback) {
  const clean = cleanText(value, '', 80).toLowerCase();
  return allowed.includes(clean) ? clean : fallback;
}

function nullableString(value, max = 120) {
  const text = cleanText(value, '', max);
  return text || null;
}

function normalizeStringArray(value, fallback = [], limit = 6, max = 160) {
  const source = Array.isArray(value) ? value : fallback;
  return uniqueStrings(source.map((entry) => cleanText(entry, '', max)), limit);
}

function normalizeTargetRef(value, fallback = null) {
  const raw = value && typeof value === 'object' ? value : fallback;
  if (!raw || typeof raw !== 'object') return null;
  const kind = nullableString(raw.kind, 60);
  const id = nullableString(raw.id ?? raw.buildingId ?? raw.stepId ?? raw.nodeId ?? raw.key, 120);
  const type = nullableString(raw.type ?? raw.buildingType ?? raw.resource ?? raw.permissionKey ?? raw.key, 120);
  if (!kind && !id && !type) return null;
  return { kind, id, type };
}

function targetRefFromTarget(target) {
  if (!target || typeof target !== 'object') return null;
  return normalizeTargetRef({
    kind: target.kind || null,
    id: target.buildingId || target.key || target.permissionKey || target.resource || target.level || null,
    type: target.type || target.buildingType || target.key || target.kind || null
  });
}

function normalizeRequirementItem(item, advisory) {
  if (!item || typeof item !== 'object') return null;
  const kind = cleanText(item.kind, 'note', 60).toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'note';
  const resource = nullableString(item.resource, 60);
  const label = nullableString(item.label || item.title || item.description, 180);
  const out = {
    kind,
    advisory: !!advisory
  };
  if (resource) out.resource = resource;
  if (label) out.label = label;
  for (const key of ['have', 'required', 'missing']) {
    if (item[key] == null) continue;
    out[key] = Math.max(0, Math.floor(Number(item[key] || 0)));
  }
  if (item.system) out.system = cleanText(item.system, '', 60).toLowerCase().replace(/[^a-z0-9_-]/g, '') || null;
  if (item.ref && typeof item.ref === 'object') out.ref = normalizeTargetRef(item.ref);
  return out;
}

function normalizePlanningRequirements(value, { fallback = null, advisory = false } = {}) {
  if (!value || typeof value !== 'object') {
    if (!fallback) return { items: [], affordable: true, missing: {}, advisory: !!advisory };
    return {
      ...clone(fallback),
      advisory: !!advisory
    };
  }
  const items = Array.isArray(value.items)
    ? value.items.map((item) => normalizeRequirementItem(item, advisory)).filter(Boolean)
    : [];
  const missing = value.missing && typeof value.missing === 'object' && !Array.isArray(value.missing)
    ? Object.entries(value.missing).reduce((acc, [key, amount]) => {
      const cleanKey = cleanText(key, '', 60);
      if (cleanKey) acc[cleanKey] = Math.max(0, Math.floor(Number(amount || 0)));
      return acc;
    }, {})
    : {};
  return {
    items,
    affordable: value.affordable == null ? Object.values(missing).every((amount) => Number(amount || 0) <= 0) : !!value.affordable,
    missing,
    advisory: !!advisory
  };
}

function normalizeEstimatedCost(value) {
  const cost = normalizeCost(value);
  return Object.keys(cost).length ? cost : null;
}

function requirementsFor(state, { cost = {}, xpRequired = null, hqLevelRequired = null } = {}) {
  const inventory = normalizeInventory(state?.plot?.inventory);
  const normalizedCost = normalizeCost(cost);
  const resources = RESOURCE_KEYS
    .filter((key) => Number(normalizedCost[key] || 0) > 0)
    .map((key) => {
      const required = Number(normalizedCost[key] || 0);
      const have = Number(inventory[key] || 0);
      return {
        kind: 'resource',
        resource: key,
        have,
        required,
        missing: Math.max(0, required - have)
      };
    });
  if (xpRequired != null) {
    const required = Math.max(0, Math.floor(Number(xpRequired || 0)));
    const have = Math.max(0, Math.floor(Number(state?.plot?.townXp || 0)));
    resources.push({
      kind: 'xp',
      resource: 'XP',
      have,
      required,
      missing: Math.max(0, required - have)
    });
  }
  if (hqLevelRequired != null) {
    const required = Math.max(1, Math.floor(Number(hqLevelRequired || 1)));
    const have = Math.max(1, Math.floor(Number(state?.plot?.hqLevel || 1)));
    resources.push({
      kind: 'hq',
      resource: 'HQ',
      have,
      required,
      missing: Math.max(0, required - have)
    });
  }
  return {
    items: resources,
    affordable: resources.every((entry) => entry.missing === 0),
    missing: resources
      .filter((entry) => entry.missing > 0)
      .reduce((acc, entry) => {
        acc[entry.resource] = entry.missing;
        return acc;
      }, {})
  };
}

function findBuilding(state, type) {
  return (state?.buildings || []).find((building) => building.type === type) || null;
}

function hqBuilding(state) {
  return findBuilding(state, 'HQ');
}

function isBuildingUnlocked(state, type) {
  return (state?.unlockedBuildings || []).includes(type);
}

function openPadCount(state) {
  return (state?.pads || []).filter((pad) => !pad.occupiedBy && String(pad.kind || '').toUpperCase() === 'BUILD').length;
}

function buildingDef(state, type) {
  return state?.buildingDefs?.[type] || engine.BUILDING_DEFS[type] || null;
}

function sortedStrings(value) {
  return Array.isArray(value) ? value.map((entry) => String(entry || '')).filter(Boolean).sort() : [];
}

function compactJob(job) {
  if (!job || typeof job !== 'object') return null;
  return {
    jobId: String(job.jobId || ''),
    buildingId: String(job.buildingId || ''),
    kind: String(job.kind || ''),
    status: String(job.status || ''),
    resource: String(job.resource || ''),
    startsAt: Number(job.startsAt || 0),
    endsAt: Number(job.endsAt || 0)
  };
}

function compactBuilding(building) {
  return {
    buildingId: String(building?.buildingId || ''),
    type: String(building?.type || ''),
    x: Number(building?.x || 0),
    y: Number(building?.y || 0),
    level: Number(building?.level || 1),
    state: String(building?.state || ''),
    priority: String(building?.priority || ''),
    outputBuffer: normalizeInventory(building?.outputBuffer),
    activeJob: compactJob(building?.activeJob)
  };
}

function buildGameplaySnapshot(state) {
  const buildings = Array.isArray(state?.buildings) ? state.buildings : [];
  const pads = Array.isArray(state?.pads) ? state.pads : [];
  const approvals = Array.isArray(state?.approvals) ? state.approvals : [];
  const rewards = Array.isArray(state?.rewards) ? state.rewards : [];
  return {
    graphVersion: ATLAS_VERSION,
    plot: {
      plotId: String(state?.plot?.plotId || ''),
      hqLevel: Number(state?.plot?.hqLevel || 1),
      townXp: Number(state?.plot?.townXp || 0),
      inventory: normalizeInventory(state?.plot?.inventory),
      storageCaps: normalizeInventory(state?.plot?.storageCaps),
      constructionSlots: Number(state?.plot?.constructionSlots || 0),
      nextBuildBuffPct: Number(state?.plot?.nextBuildBuffPct || 0),
      dailySoldCoin: Number(state?.plot?.dailySoldCoin || 0),
      dailySellDay: String(state?.plot?.dailySellDay || ''),
      collectedBuildingTypes: sortedStrings(state?.plot?.collectedBuildingTypes),
      seenBuildingTypes: sortedStrings(state?.plot?.seenBuildingTypes),
      claimedRewards: sortedStrings(state?.plot?.claimedRewards),
      policy: stableValue(state?.plot?.policy || {})
    },
    buildings: buildings
      .map(compactBuilding)
      .sort((a, b) => a.buildingId.localeCompare(b.buildingId)),
    pads: pads
      .map((pad) => ({
        x: Number(pad?.x || 0),
        y: Number(pad?.y || 0),
        kind: String(pad?.kind || ''),
        occupiedBy: String(pad?.occupiedBy || '')
      }))
      .sort((a, b) => (a.y - b.y) || (a.x - b.x)),
    unlockedBuildings: sortedStrings(state?.unlockedBuildings),
    permissions: stableValue(state?.permissions || {}),
    approvals: approvals
      .map((approval) => ({
        approvalId: String(approval?.approvalId || ''),
        actionName: String(approval?.actionName || approval?.action || ''),
        status: String(approval?.status || ''),
        requestedParams: stableValue(approval?.requestedParams || approval?.params || {})
      }))
      .sort((a, b) => a.approvalId.localeCompare(b.approvalId)),
    rewards: rewards
      .map((reward) => ({
        rewardId: String(reward?.rewardId || reward?.id || ''),
        status: String(reward?.status || ''),
        title: String(reward?.title || '')
      }))
      .sort((a, b) => a.rewardId.localeCompare(b.rewardId)),
    quest: {
      id: String(state?.quest?.id || ''),
      primaryAction: String(state?.quest?.primaryAction || '')
    },
    audit: {
      eventCount: Number(state?.audit?.eventCount || 0)
    }
  };
}

function gameplayStableHashForState(state) {
  return stableHash(buildGameplaySnapshot(state));
}

function labelForType(type) {
  return String(type || '')
    .toLowerCase()
    .split('_')
    .map((part) => part ? `${part[0].toUpperCase()}${part.slice(1)}` : '')
    .join(' ');
}

function makeIcon({ iconId, label, symbol, tone, source, assetPath = null }) {
  const overrides = {
    label: label || 'Progression step',
    symbol: symbol || '?',
    tone: tone || 'neutral',
    source: source || 'canonical_progression_graph'
  };
  if (assetPath != null) overrides.assetPath = assetPath;
  return getAgentTownIcon(iconId || 'progression.generic', overrides);
}

function buildingIcon(buildingType) {
  const type = String(buildingType || '').toUpperCase();
  const icons = {
    HQ: { symbol: 'HQ', tone: 'command', label: 'Headquarters' },
    LUMBER_CAMP: { symbol: 'W', tone: 'wood', label: 'Wood chain' },
    FARM_PLOT: { symbol: 'F', tone: 'food', label: 'Food chain' },
    QUARRY: { symbol: 'S', tone: 'stone', label: 'Stone chain' },
    WORKSHOP: { symbol: 'WK', tone: 'craft', label: 'Workshop chain' },
    MARKET_STALL: { symbol: 'C', tone: 'coin', label: 'Coin chain' }
  };
  const spec = icons[type] || { symbol: 'B', tone: 'building', label: labelForType(type) || 'Building' };
  const iconId = `building.${type.toLowerCase()}`;
  return makeIcon({
    iconId,
    label: spec.label,
    symbol: spec.symbol,
    tone: spec.tone,
    source: `building:${type}`
  });
}

function resourceIcon(resource) {
  const key = String(resource || '').toLowerCase();
  const icons = {
    wood: { symbol: 'W', tone: 'wood', label: 'Wood output' },
    food: { symbol: 'F', tone: 'food', label: 'Food output' },
    stone: { symbol: 'S', tone: 'stone', label: 'Stone output' },
    coin: { symbol: 'C', tone: 'coin', label: 'Coin output' },
    XP: { symbol: 'XP', tone: 'xp', label: 'Town XP' },
    xp: { symbol: 'XP', tone: 'xp', label: 'Town XP' }
  };
  const spec = icons[key] || { symbol: key.slice(0, 1).toUpperCase() || 'R', tone: 'resource', label: `${key} output` };
  const iconId = `resource.${key || 'unknown'}`;
  return makeIcon({
    iconId,
    label: spec.label,
    symbol: spec.symbol,
    tone: spec.tone,
    source: `resource:${key}`
  });
}

function hqIcon(level) {
  return getAgentTownIcon('hq.upgrade', {
    iconId: `hq.level.${Math.max(1, Number(level || 1))}`,
    label: `HQ Level ${Math.max(1, Number(level || 1))}`,
    symbol: `H${Math.max(1, Number(level || 1))}`,
    tone: 'command',
    source: `hq:${Math.max(1, Number(level || 1))}`
  });
}

function permissionIcon(permissionKey) {
  const key = String(permissionKey || 'permission');
  return getAgentTownIcon(`permission.${key}`, {
    label: key === 'queueProduction' ? 'Foreman queueing' : key === 'collectOutputs' ? 'Foreman output collection' : labelForType(key),
    symbol: key === 'queueProduction' ? 'Q' : key === 'collectOutputs' ? 'CO' : 'P',
    tone: 'foreman',
    source: `permission:${key}`
  });
}

function productionOutputFor(buildingType, level, resource) {
  const def = engine.BUILDING_DEFS[buildingType];
  if (!def || typeof def.produces !== 'function') return null;
  const produced = def.produces(level || 1);
  return produced?.output?.[resource] ?? null;
}

function makePlaceBuildingStep(state, {
  stepId,
  title,
  buildingType,
  reason
}) {
  const existing = findBuilding(state, buildingType);
  const def = buildingDef(state, buildingType) || {};
  const unlockedAt = Number(def.unlockHqLevel || 1);
  const unlocked = isBuildingUnlocked(state, buildingType);
  const requirements = requirementsFor(state, {
    cost: def.construction?.cost || {},
    hqLevelRequired: unlockedAt
  });
  let status = 'blocked';
  let blocker = null;
  let nextAction = `Build ${labelForType(buildingType)}`;

  if (existing) {
    status = 'done';
    blocker = null;
    nextAction = `${labelForType(buildingType)} is placed`;
  } else if (!unlocked) {
    status = 'blocked';
    blocker = `Requires HQ Level ${unlockedAt}.`;
  } else if (openPadCount(state) <= 0) {
    status = 'blocked';
    blocker = 'No open build pads remain.';
  } else if (!requirements.affordable) {
    status = 'blocked';
    blocker = 'Collect the missing construction resources.';
  } else {
    status = 'available';
  }

  return {
    stepId,
    nodeId: stepId,
    title,
    status,
    reason,
    icon: buildingIcon(buildingType),
    target: { kind: 'building', type: buildingType, buildingId: existing?.buildingId || null },
    requirements,
    blocker,
    nextAction,
    actionRef: existing ? null : {
      tool: 'et.plot.place_building',
      params: { type: buildingType }
    }
  };
}

function makeProductionStep(state, {
  stepId,
  title,
  buildingType,
  resource,
  reason
}) {
  const building = findBuilding(state, buildingType);
  const collected = new Set(state?.plot?.collectedBuildingTypes || []);
  let status = 'blocked';
  let blocker = null;
  let nextAction = `Produce ${resource}`;
  let actionRef = null;

  if (collected.has(buildingType)) {
    status = 'done';
    nextAction = `${resource} collection proven`;
  } else if (!building) {
    blocker = `Build ${labelForType(buildingType)} first.`;
  } else if (building.canCollect || building.state === 'OUTPUT_READY') {
    status = 'available';
    nextAction = `Collect ${resource}`;
    actionRef = {
      tool: 'et.plot.collect_outputs',
      params: { buildingId: building.buildingId }
    };
  } else if (building.canQueue) {
    status = 'available';
    nextAction = `Queue ${resource} production`;
    actionRef = {
      tool: 'et.plot.queue_job',
      params: { buildingId: building.buildingId, kind: 'PRODUCE' }
    };
  } else if (building.activeJob) {
    status = 'waiting';
    blocker = `${labelForType(buildingType)} has an active ${String(building.activeJob.kind || 'job').toLowerCase()} job.`;
  } else {
    status = 'waiting';
    blocker = `${labelForType(buildingType)} is ${String(building.state || 'not ready').toLowerCase()}.`;
  }

  return {
    stepId,
    nodeId: stepId,
    title,
    status,
    reason,
    icon: resourceIcon(resource),
    target: { kind: 'building', type: buildingType, buildingId: building?.buildingId || null },
    output: { [resource]: productionOutputFor(buildingType, building?.level || 1, resource) },
    requirements: { items: [], affordable: true, missing: {} },
    blocker,
    nextAction,
    actionRef
  };
}

function makeHqUpgradeStep(state, {
  stepId,
  title,
  targetLevel,
  reason
}) {
  const currentLevel = Math.max(1, Math.floor(Number(state?.plot?.hqLevel || 1)));
  const fromLevel = Math.max(1, targetLevel - 1);
  const rule = engine.HQ_UPGRADE_RULES[fromLevel] || null;
  const hq = hqBuilding(state);
  const requirements = requirementsFor(state, {
    cost: rule?.cost || {},
    xpRequired: rule?.xpRequired || null,
    hqLevelRequired: fromLevel
  });
  let status = 'blocked';
  let blocker = null;
  let nextAction = `Upgrade HQ to Level ${targetLevel}`;
  let actionRef = null;

  if (currentLevel >= targetLevel) {
    status = 'done';
    nextAction = `HQ Level ${targetLevel} reached`;
  } else if (currentLevel < fromLevel) {
    blocker = `Reach HQ Level ${fromLevel} first.`;
  } else if (hq?.activeJob) {
    status = 'waiting';
    blocker = 'Headquarters is already upgrading.';
  } else if (!requirements.affordable) {
    blocker = 'Collect the missing HQ upgrade requirements.';
  } else {
    status = 'available';
    actionRef = {
      tool: 'et.plot.upgrade_building',
      params: { buildingId: hq?.buildingId || null }
    };
  }

  return {
    stepId,
    nodeId: stepId,
    title,
    status,
    reason,
    icon: hqIcon(targetLevel),
    target: { kind: 'hq', level: targetLevel, buildingId: hq?.buildingId || null },
    requirements,
    blocker,
    nextAction,
    unlocks: engine.HQ_LEVEL_RULES[targetLevel]?.unlocks || [],
    permissionUnlocks: engine.HQ_LEVEL_RULES[targetLevel]?.permissionUnlocks || [],
    actionRef
  };
}

function makePermissionStep(state, {
  stepId,
  title,
  permissionKey,
  requiredHqLevel,
  reason,
  nextWhenBlocked,
  nextWhenDone
}) {
  const hqLevel = Math.max(1, Math.floor(Number(state?.plot?.hqLevel || 1)));
  const done = hqLevel >= requiredHqLevel;
  return {
    stepId,
    nodeId: stepId,
    title,
    status: done ? 'done' : 'blocked',
    reason,
    icon: permissionIcon(permissionKey),
    target: { kind: 'permission', key: permissionKey },
    requirements: requirementsFor(state, { hqLevelRequired: requiredHqLevel }),
    blocker: done ? null : `Reach HQ Level ${requiredHqLevel} first.`,
    nextAction: done ? nextWhenDone : nextWhenBlocked,
    actionRef: null
  };
}

function makeQueueProductionPermissionStep(state, nextWhenBlocked = 'Finish the Rush HQ3 plan') {
  return makePermissionStep(state, {
    stepId: 'foreman.queue_production',
    title: 'Unlock Foreman production queueing',
    permissionKey: 'queueProduction',
    requiredHqLevel: 3,
    reason: 'HQ Level 3 gives Clover the first real production-planning permission, still gated by player policy.',
    nextWhenBlocked,
    nextWhenDone: 'Review the queueProduction permission'
  });
}

function makeCollectOutputsPermissionStep(state) {
  return makePermissionStep(state, {
    stepId: 'foreman.collect_outputs',
    title: 'Review Foreman output collection',
    permissionKey: 'collectOutputs',
    requiredHqLevel: 2,
    reason: 'HQ Level 2 unlocks the first narrow Foreman action: collecting ready outputs under player policy.',
    nextWhenBlocked: 'Reach HQ Level 2 first',
    nextWhenDone: 'Review the collectOutputs permission'
  });
}

function buildRushHq3Steps(state) {
  return [
    makePlaceBuildingStep(state, {
      stepId: 'building.lumber_camp.place',
      title: 'Build Lumber Camp',
      buildingType: 'LUMBER_CAMP',
      reason: 'Wood is the settlement base resource and the first visible work loop.'
    }),
    makeProductionStep(state, {
      stepId: 'production.lumber_camp.collect_wood',
      title: 'Produce and collect wood',
      buildingType: 'LUMBER_CAMP',
      resource: 'wood',
      reason: 'Wood pays for Farm Plot and later HQ upgrades.'
    }),
    makePlaceBuildingStep(state, {
      stepId: 'building.farm_plot.place',
      title: 'Build Farm Plot',
      buildingType: 'FARM_PLOT',
      reason: 'Food removes the old HQ2 deadlock and starts the second production chain.'
    }),
    makeProductionStep(state, {
      stepId: 'production.farm_plot.collect_food',
      title: 'Produce and collect food',
      buildingType: 'FARM_PLOT',
      resource: 'food',
      reason: 'Food combines with wood to unlock HQ Level 2.'
    }),
    makeHqUpgradeStep(state, {
      stepId: 'hq.level.2',
      title: 'Upgrade HQ to Level 2',
      targetLevel: 2,
      reason: 'HQ Level 2 unlocks Quarry access and Foreman output collection.'
    }),
    makePlaceBuildingStep(state, {
      stepId: 'building.quarry.place',
      title: 'Build Quarry',
      buildingType: 'QUARRY',
      reason: 'Stone is the resource gate for HQ Level 3.'
    }),
    makeProductionStep(state, {
      stepId: 'production.quarry.collect_stone',
      title: 'Produce and collect stone',
      buildingType: 'QUARRY',
      resource: 'stone',
      reason: 'Stone plus wood finishes the first strategic milestone.'
    }),
    makeHqUpgradeStep(state, {
      stepId: 'hq.level.3',
      title: 'Upgrade HQ to Level 3',
      targetLevel: 3,
      reason: 'HQ Level 3 unlocks the first true Foreman planning loop: queue production.'
    }),
    makeQueueProductionPermissionStep(state)
  ];
}

function buildBalancedFoodWoodSteps(state) {
  return [
    makePlaceBuildingStep(state, {
      stepId: 'building.lumber_camp.place',
      title: 'Build Lumber Camp',
      buildingType: 'LUMBER_CAMP',
      reason: 'Start with wood so Farm Plot and HQ upgrade costs are easier to read.'
    }),
    makeProductionStep(state, {
      stepId: 'production.lumber_camp.collect_wood',
      title: 'Produce and collect wood',
      buildingType: 'LUMBER_CAMP',
      resource: 'wood',
      reason: 'Prove the wood chain before spending into food.'
    }),
    makePlaceBuildingStep(state, {
      stepId: 'building.farm_plot.place',
      title: 'Build Farm Plot',
      buildingType: 'FARM_PLOT',
      reason: 'Add food early so the opening is not only a timber sprint.'
    }),
    makeProductionStep(state, {
      stepId: 'production.farm_plot.collect_food',
      title: 'Produce and collect food',
      buildingType: 'FARM_PLOT',
      resource: 'food',
      reason: 'Food plus wood keeps HQ Level 2 reachable without hidden grants.'
    }),
    makeHqUpgradeStep(state, {
      stepId: 'hq.level.2',
      title: 'Upgrade HQ to Level 2',
      targetLevel: 2,
      reason: 'Upgrade only after both early production chains are visible.'
    }),
    makePlaceBuildingStep(state, {
      stepId: 'building.quarry.place',
      title: 'Build Quarry',
      buildingType: 'QUARRY',
      reason: 'Move into stone after the wood-food base is proven.'
    }),
    makeProductionStep(state, {
      stepId: 'production.quarry.collect_stone',
      title: 'Produce and collect stone',
      buildingType: 'QUARRY',
      resource: 'stone',
      reason: 'Stone completes the first broad resource triangle.'
    }),
    makeHqUpgradeStep(state, {
      stepId: 'hq.level.3',
      title: 'Upgrade HQ to Level 3',
      targetLevel: 3,
      reason: 'HQ Level 3 follows from a steadier wood, food, and stone base.'
    }),
    makeQueueProductionPermissionStep(state, 'Finish the Balanced Food-Wood plan')
  ];
}

function buildDelegateOutputsFirstSteps(state) {
  return [
    makePlaceBuildingStep(state, {
      stepId: 'building.lumber_camp.place',
      title: 'Build Lumber Camp',
      buildingType: 'LUMBER_CAMP',
      reason: 'Wood creates the first output loop the Foreman can later help collect.'
    }),
    makeProductionStep(state, {
      stepId: 'production.lumber_camp.collect_wood',
      title: 'Produce and collect wood',
      buildingType: 'LUMBER_CAMP',
      resource: 'wood',
      reason: 'A collected output makes delegation review concrete instead of abstract.'
    }),
    makePlaceBuildingStep(state, {
      stepId: 'building.farm_plot.place',
      title: 'Build Farm Plot',
      buildingType: 'FARM_PLOT',
      reason: 'Food gets HQ Level 2 within reach while adding a second output source.'
    }),
    makeProductionStep(state, {
      stepId: 'production.farm_plot.collect_food',
      title: 'Produce and collect food',
      buildingType: 'FARM_PLOT',
      resource: 'food',
      reason: 'Food collection proves the second loop before any Foreman authority expands.'
    }),
    makeHqUpgradeStep(state, {
      stepId: 'hq.level.2',
      title: 'Upgrade HQ to Level 2',
      targetLevel: 2,
      reason: 'HQ Level 2 unlocks the first output-delegation checkpoint.'
    }),
    makeCollectOutputsPermissionStep(state),
    makePlaceBuildingStep(state, {
      stepId: 'building.quarry.place',
      title: 'Build Quarry',
      buildingType: 'QUARRY',
      reason: 'Add stone after the player has reviewed collectOutputs.'
    }),
    makeProductionStep(state, {
      stepId: 'production.quarry.collect_stone',
      title: 'Produce and collect stone',
      buildingType: 'QUARRY',
      resource: 'stone',
      reason: 'Stone is still required for HQ Level 3 and queueProduction.'
    }),
    makeHqUpgradeStep(state, {
      stepId: 'hq.level.3',
      title: 'Upgrade HQ to Level 3',
      targetLevel: 3,
      reason: 'HQ Level 3 should follow a deliberate delegation checkpoint.'
    }),
    makeQueueProductionPermissionStep(state, 'Review collectOutputs, then finish the HQ3 plan')
  ];
}

function implementedHqCap() {
  const levels = Object.keys(engine.HQ_LEVEL_RULES || {}).map((level) => Number(level) || 1);
  return levels.length ? Math.max(...levels) : 1;
}

function canonicalStepFromNode(node, reason = null) {
  if (!node) return null;
  return {
    stepId: node.nodeId,
    nodeId: node.nodeId,
    title: node.title,
    status: node.status,
    reason: cleanText(reason || node.metadata?.body || node.title, node.title, 360),
    icon: node.icon,
    target: node.target,
    requirements: clone(node.requirements || { items: [], affordable: true, missing: {} }),
    blocker: node.blocker || node.availability?.blocker || null,
    nextAction: node.nextAction || node.availability?.nextAction || null,
    actionRef: node.actionRef || null,
    expectedBenefit: Array.isArray(node.effects) ? node.effects : []
  };
}

function futureHqNodeId(milestone) {
  return `future.hq.${milestone.level}.${milestone.id}`;
}

function makeFutureHqMilestoneStep(state, milestone) {
  const currentHq = Math.max(1, Math.floor(Number(state?.plot?.hqLevel || 1)));
  const cap = implementedHqCap();
  const nodeId = futureHqNodeId(milestone);
  const previousLevel = Number(milestone.level || 0) - 1;
  const previousNodeId = previousLevel <= cap
    ? `hq.level.${previousLevel}`
    : futureHqNodeId(HQ10_HORIZON_MILESTONES.find((item) => item.level === previousLevel) || { level: previousLevel, id: 'previous' });
  const requirementItems = [
    {
      kind: 'hq',
      resource: 'HQ',
      have: Math.min(currentHq, cap),
      required: Number(milestone.level || 0),
      missing: Math.max(0, Number(milestone.level || 0) - Math.min(currentHq, cap))
    },
    {
      kind: 'future_system',
      resource: milestone.system,
      have: 0,
      required: 1,
      missing: 1
    },
    {
      kind: 'canonical_model',
      resource: milestone.id,
      have: 0,
      required: 1,
      missing: 1
    }
  ];
  return {
    stepId: nodeId,
    nodeId,
    stepKind: 'future_placeholder',
    canonicalNodeId: null,
    futureSystem: milestone.system,
    title: milestone.title,
    status: 'locked',
    reason: milestone.summary,
    icon: hqIcon(milestone.level),
    target: {
      kind: 'future_hq_level',
      level: milestone.level,
      system: milestone.system,
      source: 'progression_atlas_hq10_horizon_v1'
    },
    targetRef: {
      type: 'future_hq_level',
      id: nodeId,
      system: milestone.system,
      level: milestone.level
    },
    requirements: {
      items: requirementItems,
      affordable: false,
      missing: {
        [`hq.level.${milestone.level}`]: Math.max(1, Number(milestone.level || 0) - Math.min(currentHq, cap)),
        [`future.${milestone.system}`]: 1
      }
    },
    blocker: `Future gameplay model not implemented yet; canonical Founders Plot currently stops at HQ${cap}.`,
    nextAction: milestone.nextImplementableSlice,
    expectedBenefit: [...milestone.possibilities],
    assumptions: [
      `HQ${milestone.level} is a planning milestone, not current engine truth.`,
      `Promote this only after ${milestone.system} has server-owned state, receipts, and approval boundaries.`,
      `Keep Generated Universe visuals presentation-only unless a later canonical model says otherwise.`
    ],
    riskLevel: milestone.riskLevel,
    reversibility: 'unknown',
    privacy: 'private',
    previousNodeId,
    actionRef: null
  };
}

function buildHq10HorizonSteps(state) {
  const graph = buildCanonicalAtlasGraph(state);
  const canonicalByNode = new Map(graph.canonicalNodes.map((node) => [node.nodeId, node]));
  const currentGamePath = [
    'hq.upgrade.4',
    'permission.setPriority.unlock',
    'building.WORKSHOP.place',
    'production.WORKSHOP.PRODUCE',
    'effect.workshop.next_build_buff',
    'hq.upgrade.5',
    'building.MARKET_STALL.place',
    'production.MARKET_STALL.SELL',
    'permission.sellSurplusFood.unlock'
  ]
    .map((nodeId) => canonicalStepFromNode(canonicalByNode.get(nodeId), `Bridge current Founders Plot truth through ${nodeId}.`))
    .filter(Boolean);
  const futureMilestones = HQ10_HORIZON_MILESTONES.map((milestone) => makeFutureHqMilestoneStep(state, milestone));
  return [
    ...buildDelegateOutputsFirstSteps(state),
    ...currentGamePath,
    ...futureMilestones
  ];
}

function buildGraph(state, steps) {
  const nodes = steps.map((step, index) => ({
    nodeId: step.nodeId,
    title: step.title,
    status: step.status,
    index,
    target: step.target,
    icon: step.icon,
    requirements: step.requirements,
    blocker: step.blocker,
    nextAction: step.nextAction
  }));
  const edges = [];
  for (let i = 0; i < steps.length - 1; i += 1) {
    edges.push({
      from: steps[i].nodeId,
      to: steps[i + 1].nodeId,
      kind: 'strategy_sequence'
    });
  }
  return { nodes, edges };
}

function toolSpecFor(toolName) {
  return FOUNDERS_PLOT_TOOL_SPECS.find((spec) => spec.name === toolName) || null;
}

function actionRefFor(toolName, paramsTemplate = {}, extra = {}) {
  const spec = toolSpecFor(toolName);
  const required = Array.isArray(spec?.argsSchema?.required) ? [...spec.argsSchema.required] : [];
  return {
    tool: toolName,
    http: TOOL_HTTP[toolName] || null,
    paramsTemplate: stableValue(paramsTemplate || {}),
    required,
    requiresIdempotencyKey: required.includes('idempotencyKey'),
    actorSupport: ['HUMAN', 'AGENT'],
    authority: 'et.plot.*',
    executable: false,
    executableByAtlas: false,
    toolSpec: spec ? {
      name: spec.name,
      description: spec.description,
      argsSchema: stableValue(spec.argsSchema || {}),
      resultSchema: stableValue(spec.resultSchema || {})
    } : null,
    ...stableValue(extra || {})
  };
}

function permissionLevelMap() {
  const out = {};
  for (const [level, rules] of Object.entries(engine.HQ_LEVEL_RULES || {})) {
    for (const key of rules.permissionUnlocks || []) out[key] = Number(level);
  }
  return out;
}

function permissionRowsByKey(state) {
  return Object.fromEntries((state?.permissions || []).map((row) => [row.key, row]));
}

function canonicalAvailability(node) {
  const status = cleanText(node?.status, 'blocked', 40);
  const blockedBy = Array.isArray(node?.availability?.blockedBy)
    ? node.availability.blockedBy.filter(Boolean)
    : [];
  return {
    status,
    unlocked: status !== 'locked',
    done: status === 'done',
    available: status === 'available',
    waiting: status === 'waiting',
    blockedBy,
    nextAction: node?.nextAction || node?.availability?.nextAction || null,
    blocker: node?.blocker || node?.availability?.blocker || null,
    ...stableValue(node?.availability || {})
  };
}

function canonicalNode({
  nodeId,
  kind,
  title,
  status,
  icon = null,
  target = null,
  requirements = null,
  availability = {},
  effects = [],
  metadata = {},
  blocker = null,
  nextAction = null,
  actionRef = null,
  ui = {}
}) {
  const node = {
    nodeId,
    kind,
    canonical: true,
    title,
    status,
    icon,
    target,
    requirements: requirements || { items: [], affordable: true, missing: {} },
    availability: {
      ...availability,
      status,
      blocker: blocker || availability.blocker || null,
      nextAction: nextAction || availability.nextAction || null
    },
    effects: Array.isArray(effects) ? effects : [],
    metadata: stableValue(metadata || {}),
    blocker: blocker || null,
    nextAction: nextAction || null,
    actionRef,
    ui: stableValue(ui || {})
  };
  node.availability = canonicalAvailability(node);
  return node;
}

function canonicalEdge(edgeId, from, to, kind, label = null, metadata = {}) {
  return {
    edgeId: edgeId || `${from}->${to}:${kind}`,
    from,
    to,
    kind,
    canonical: true,
    label,
    metadata: stableValue(metadata || {})
  };
}

function missingRefs(requirements) {
  return (requirements?.items || [])
    .filter((item) => Number(item.missing || 0) > 0)
    .map((item) => item.kind === 'hq'
      ? `hq.level.${item.required}`
      : item.kind === 'xp'
        ? 'resource.xp'
        : `constraint.storage.${String(item.resource || '').toLowerCase()}`);
}

function productionSpecFor(buildingType, level = 1) {
  const def = engine.BUILDING_DEFS[buildingType];
  return typeof def?.produces === 'function' ? def.produces(level) : null;
}

function buildCanonicalHqNodes(state) {
  const nodes = [];
  const edges = [];
  const hqLevel = Math.max(1, Math.floor(Number(state?.plot?.hqLevel || 1)));
  const hq = hqBuilding(state);
  for (const [rawLevel, rules] of Object.entries(engine.HQ_LEVEL_RULES || {}).sort((a, b) => Number(a[0]) - Number(b[0]))) {
    const level = Number(rawLevel);
    const status = hqLevel >= level ? 'done' : level === hqLevel + 1 ? 'blocked' : 'locked';
    nodes.push(canonicalNode({
      nodeId: `hq.level.${level}`,
      kind: 'hq_level',
      title: `HQ Level ${level}`,
      status,
      icon: hqIcon(level),
      target: { kind: 'hq', level, buildingId: hq?.buildingId || null },
      requirements: requirementsFor(state, { hqLevelRequired: level }),
      availability: {
        hqLevel: hqLevel,
        hqLevelRequired: level,
        blockedBy: hqLevel >= level ? [] : [`hq.level.${Math.max(1, level - 1)}`]
      },
      effects: [
        ...(rules.unlocks || []).map((type) => ({ kind: 'unlocks_building', buildingType: type })),
        ...(rules.permissionUnlocks || []).map((key) => ({ kind: 'unlocks_permission', permissionKey: key })),
        { kind: 'sets_storage_caps', storageCaps: clone(rules.storageCaps || {}) },
        { kind: 'sets_construction_slots', constructionSlots: Number(rules.constructionSlots || 0) }
      ],
      nextAction: status === 'done' ? `HQ Level ${level} reached` : `Reach HQ Level ${level}`,
      ui: { tier: `HQ${level}`, lane: 'HQ', sort: level * 100 }
    }));
  }
  for (const [rawFromLevel, rule] of Object.entries(engine.HQ_UPGRADE_RULES || {}).sort((a, b) => Number(a[0]) - Number(b[0]))) {
    const fromLevel = Number(rawFromLevel);
    const targetLevel = Number(rule.nextLevel || fromLevel + 1);
    const requirements = requirementsFor(state, {
      cost: rule.cost || {},
      xpRequired: rule.xpRequired || null,
      hqLevelRequired: fromLevel
    });
    let status = 'locked';
    let blocker = null;
    let actionRef = null;
    if (hqLevel >= targetLevel) {
      status = 'done';
    } else if (hqLevel < fromLevel) {
      blocker = `Reach HQ Level ${fromLevel} first.`;
    } else if (hq?.activeJob) {
      status = 'waiting';
      blocker = 'Headquarters is already upgrading.';
    } else if (!requirements.affordable) {
      status = 'blocked';
      blocker = 'Collect the missing HQ upgrade requirements.';
    } else {
      status = 'available';
      actionRef = actionRefFor('et.plot.upgrade_building', {
        buildingId: hq?.buildingId || '$hqBuildingId',
        actor: 'HUMAN',
        idempotencyKey: '$idempotencyKey'
      });
    }
    const nodeId = `hq.upgrade.${targetLevel}`;
    nodes.push(canonicalNode({
      nodeId,
      kind: 'hq_upgrade',
      title: `Upgrade HQ to Level ${targetLevel}`,
      status,
      icon: hqIcon(targetLevel),
      target: { kind: 'hq_upgrade', fromLevel, targetLevel, buildingId: hq?.buildingId || null },
      requirements,
      availability: {
        hqLevel,
        hqLevelRequired: fromLevel,
        affordable: requirements.affordable,
        durationMs: Number(rule.durationMs || 0),
        blockedBy: [
          ...(hqLevel < fromLevel ? [`hq.level.${fromLevel}`] : []),
          ...missingRefs(requirements)
        ]
      },
      effects: [{ kind: 'unlocks_hq_level', level: targetLevel }],
      metadata: { cost: normalizeCost(rule.cost || {}), xpRequired: Number(rule.xpRequired || 0), durationMs: Number(rule.durationMs || 0) },
      blocker,
      nextAction: status === 'done' ? `HQ Level ${targetLevel} reached` : `Upgrade HQ to Level ${targetLevel}`,
      actionRef,
      ui: { tier: `HQ${targetLevel}`, lane: 'HQ', sort: targetLevel * 100 + 10 }
    }));
    edges.push(canonicalEdge(`hq.level.${fromLevel}->${nodeId}`, `hq.level.${fromLevel}`, nodeId, 'requires_hq_level', `Requires HQ Level ${fromLevel}`));
    edges.push(canonicalEdge(`${nodeId}->hq.level.${targetLevel}`, nodeId, `hq.level.${targetLevel}`, 'unlocks_hq_level', `Unlocks HQ Level ${targetLevel}`));
  }
  return { nodes, edges };
}

function buildCanonicalBuildingNodes(state) {
  const nodes = [];
  const edges = [];
  const hqLevel = Math.max(1, Math.floor(Number(state?.plot?.hqLevel || 1)));
  const openPads = openPadCount(state);
  const sortedDefs = Object.entries(engine.BUILDING_DEFS || {})
    .filter(([type, def]) => type !== 'HQ' && def?.construction)
    .sort((a, b) => Number(a[1].unlockHqLevel || 1) - Number(b[1].unlockHqLevel || 1) || a[0].localeCompare(b[0]));
  for (const [buildingType, def] of sortedDefs) {
    const label = labelForType(buildingType);
    const existing = findBuilding(state, buildingType);
    const requiredHq = Number(def.unlockHqLevel || 1);
    const unlocked = isBuildingUnlocked(state, buildingType) || hqLevel >= requiredHq;
    const unlockNodeId = `building.${buildingType}.unlock`;
    nodes.push(canonicalNode({
      nodeId: unlockNodeId,
      kind: 'building_unlock',
      title: `Unlock ${label}`,
      status: unlocked ? 'done' : 'locked',
      icon: buildingIcon(buildingType),
      target: { kind: 'building', type: buildingType },
      requirements: requirementsFor(state, { hqLevelRequired: requiredHq }),
      availability: {
        hqLevelRequired: requiredHq,
        unlocked,
        blockedBy: unlocked ? [] : [`hq.level.${requiredHq}`]
      },
      effects: [{ kind: 'unlocks_action', action: `building.${buildingType}.place` }],
      nextAction: unlocked ? `${label} unlocked` : `Reach HQ Level ${requiredHq}`,
      ui: { tier: `HQ${requiredHq}`, lane: label, sort: requiredHq * 100 + 20 }
    }));
    edges.push(canonicalEdge(`hq.level.${requiredHq}->${unlockNodeId}`, `hq.level.${requiredHq}`, unlockNodeId, 'unlocks_building', `HQ${requiredHq} unlocks ${label}`));

    const placeRequirements = requirementsFor(state, {
      cost: def.construction?.cost || {},
      hqLevelRequired: requiredHq
    });
    let placeStatus = 'locked';
    let placeBlocker = null;
    let placeActionRef = null;
    if (existing) {
      placeStatus = 'done';
    } else if (!unlocked) {
      placeBlocker = `Requires HQ Level ${requiredHq}.`;
    } else if (openPads <= 0) {
      placeStatus = 'blocked';
      placeBlocker = 'No open build pads remain.';
    } else if (!placeRequirements.affordable) {
      placeStatus = 'blocked';
      placeBlocker = 'Collect the missing construction resources.';
    } else {
      placeStatus = 'available';
      placeActionRef = actionRefFor('et.plot.place_building', {
        type: buildingType,
        x: '$padX',
        y: '$padY',
        actor: 'HUMAN',
        idempotencyKey: '$idempotencyKey'
      }, {
        note: 'Atlas does not choose a pad; gameplay placement still requires x/y.'
      });
    }
    const placeNodeId = `building.${buildingType}.place`;
    nodes.push(canonicalNode({
      nodeId: placeNodeId,
      kind: 'building_place',
      title: `Build ${label}`,
      status: placeStatus,
      icon: buildingIcon(buildingType),
      target: { kind: 'building', type: buildingType, buildingId: existing?.buildingId || null, level: existing?.level || 1 },
      requirements: placeRequirements,
      availability: {
        hqLevelRequired: requiredHq,
        unlocked,
        placed: !!existing,
        openPads,
        affordable: placeRequirements.affordable,
        durationMs: Number(def.construction?.durationMs || 0),
        blockedBy: [
          ...(unlocked ? [] : [`hq.level.${requiredHq}`]),
          ...(openPads <= 0 && !existing ? ['constraint.build_pads'] : []),
          ...missingRefs(placeRequirements)
        ]
      },
      effects: [{ kind: 'unlocks_action', action: `production.${buildingType}.${productionSpecFor(buildingType)?.kind || 'PRODUCE'}` }],
      metadata: { cost: normalizeCost(def.construction?.cost || {}), durationMs: Number(def.construction?.durationMs || 0) },
      blocker: placeBlocker,
      nextAction: existing ? `${label} is placed` : `Build ${label}`,
      actionRef: placeActionRef,
      ui: { tier: `HQ${requiredHq}`, lane: label, sort: requiredHq * 100 + 30 }
    }));
    edges.push(canonicalEdge(`${unlockNodeId}->${placeNodeId}`, unlockNodeId, placeNodeId, 'enables_action', `${label} can be placed once unlocked`));
    edges.push(canonicalEdge(`constraint.construction_slots->${placeNodeId}`, 'constraint.construction_slots', placeNodeId, 'uses_construction_slot', 'Construction uses a slot'));

    for (const [rawFromLevel, upgradeRule] of Object.entries(def.upgrade || {}).sort((a, b) => Number(a[0]) - Number(b[0]))) {
      const fromLevel = Number(rawFromLevel);
      const toLevel = Number(upgradeRule.toLevel || fromLevel + 1);
      const upgradeRequirements = requirementsFor(state, {
        cost: upgradeRule.cost || {},
        hqLevelRequired: requiredHq
      });
      let status = 'locked';
      let blocker = null;
      let actionRef = null;
      if (!existing) {
        blocker = `Build ${label} first.`;
      } else if (Number(existing.level || 1) >= toLevel) {
        status = 'done';
      } else if (Number(existing.level || 1) < fromLevel) {
        blocker = `Upgrade ${label} to Level ${fromLevel} first.`;
      } else if (existing.activeJob) {
        status = 'waiting';
        blocker = `${label} already has an active job.`;
      } else if (!upgradeRequirements.affordable) {
        status = 'blocked';
        blocker = 'Collect the missing building upgrade resources.';
      } else {
        status = 'available';
        actionRef = actionRefFor('et.plot.upgrade_building', {
          buildingId: existing.buildingId,
          actor: 'HUMAN',
          idempotencyKey: '$idempotencyKey'
        });
      }
      const nodeId = `building.${buildingType}.upgrade.${toLevel}`;
      nodes.push(canonicalNode({
        nodeId,
        kind: 'building_upgrade',
        title: `Upgrade ${label} to Level ${toLevel}`,
        status,
        icon: buildingIcon(buildingType),
        target: { kind: 'building_upgrade', type: buildingType, buildingId: existing?.buildingId || null, fromLevel, toLevel },
        requirements: upgradeRequirements,
        availability: {
          hqLevelRequired: requiredHq,
          placed: !!existing,
          currentLevel: Number(existing?.level || 0),
          affordable: upgradeRequirements.affordable,
          durationMs: Number(upgradeRule.durationMs || 0),
          blockedBy: [
            ...(existing ? [] : [placeNodeId]),
            ...missingRefs(upgradeRequirements)
          ]
        },
        effects: [{ kind: 'improves_building_output', buildingType, toLevel }],
        metadata: { cost: normalizeCost(upgradeRule.cost || {}), durationMs: Number(upgradeRule.durationMs || 0) },
        blocker,
        nextAction: status === 'done' ? `${label} Level ${toLevel} reached` : `Upgrade ${label}`,
        actionRef,
        ui: { tier: `HQ${requiredHq}`, lane: label, sort: requiredHq * 100 + 40 + toLevel }
      }));
      edges.push(canonicalEdge(`${placeNodeId}->${nodeId}`, placeNodeId, nodeId, 'requires_building', `Requires ${label}`));
      edges.push(canonicalEdge(`constraint.construction_slots->${nodeId}`, 'constraint.construction_slots', nodeId, 'uses_construction_slot', 'Upgrade uses a construction slot'));
    }
  }
  return { nodes, edges };
}

function buildCanonicalProductionNodes(state) {
  const nodes = [];
  const edges = [];
  const hqLevel = Math.max(1, Math.floor(Number(state?.plot?.hqLevel || 1)));
  for (const [buildingType, def] of Object.entries(engine.BUILDING_DEFS || {}).filter(([type, row]) => type !== 'HQ' && typeof row?.produces === 'function')) {
    const label = labelForType(buildingType);
    const existing = findBuilding(state, buildingType);
    const spec = productionSpecFor(buildingType, existing?.level || 1) || productionSpecFor(buildingType, 1);
    if (!spec) continue;
    const requiredHq = Number(def.unlockHqLevel || 1);
    const locked = hqLevel < requiredHq || !existing;
    const requirements = requirementsFor(state, { cost: spec.input || {}, hqLevelRequired: requiredHq });
    let status = 'locked';
    let blocker = null;
    let actionRef = null;
    if (locked) {
      blocker = !existing ? `Build ${label} first.` : `Requires HQ Level ${requiredHq}.`;
    } else if (existing.state === 'OUTPUT_READY' || existing.canCollect) {
      status = 'waiting';
      blocker = 'Collect the ready output before queueing another job.';
    } else if (existing.activeJob) {
      status = 'waiting';
      blocker = `${label} has an active ${String(existing.activeJob.kind || 'job').toLowerCase()} job.`;
    } else if (!requirements.affordable) {
      status = 'blocked';
      blocker = 'Collect the missing job inputs.';
    } else {
      status = 'available';
      actionRef = actionRefFor('et.plot.queue_job', {
        buildingId: existing.buildingId,
        kind: spec.kind,
        actor: 'HUMAN',
        idempotencyKey: '$idempotencyKey'
      }, {
        agentPolicy: spec.kind === 'SELL'
          ? { permissionKey: 'sellSurplusFood', requiredHqLevel: 5, requiresPolicyEnabled: true, dailyCapField: 'sellDailyCoinCap' }
          : { permissionKey: 'queueProduction', requiredHqLevel: 3, requiresPolicyEnabled: true }
      });
    }
    const productionNodeId = `production.${buildingType}.${spec.kind}`;
    const output = normalizeCost(spec.output || {});
    const input = normalizeCost(spec.input || {});
    const effects = Object.entries(output).map(([resource, amount]) => ({ kind: 'produces_resource', resource, amount }));
    if (buildingType === 'WORKSHOP') effects.push({ kind: 'applies_buff_to_next_build', construction_buff_pct: Number(spec.buffPct || 0) });
    nodes.push(canonicalNode({
      nodeId: productionNodeId,
      kind: spec.kind === 'SELL' ? 'production_sell' : buildingType === 'WORKSHOP' ? 'production_effect' : 'production_loop',
      title: spec.kind === 'SELL' ? `Sell food at ${label}` : `Run ${label}`,
      status,
      icon: spec.kind === 'SELL' ? resourceIcon('coin') : buildingIcon(buildingType),
      target: { kind: 'building_job', type: buildingType, buildingId: existing?.buildingId || null, jobKind: spec.kind },
      requirements,
      availability: {
        hqLevelRequired: requiredHq,
        placed: !!existing,
        buildingState: existing?.state || null,
        canQueue: !!existing?.canQueue,
        affordable: requirements.affordable,
        durationMs: Number(spec.durationMs || 0),
        blockedBy: [
          ...(existing ? [] : [`building.${buildingType}.place`]),
          ...(hqLevel >= requiredHq ? [] : [`hq.level.${requiredHq}`]),
          ...missingRefs(requirements)
        ]
      },
      effects,
      metadata: {
        kind: spec.kind,
        input,
        output,
        durationMs: Number(spec.durationMs || 0),
        buffPct: spec.buffPct == null ? null : Number(spec.buffPct)
      },
      blocker,
      nextAction: status === 'available' ? `Queue ${spec.kind.toLowerCase()} job` : (blocker || `Prepare ${label}`),
      actionRef,
      ui: { tier: `HQ${requiredHq}`, lane: label, sort: requiredHq * 100 + 60 }
    }));
    edges.push(canonicalEdge(`building.${buildingType}.place->${productionNodeId}`, `building.${buildingType}.place`, productionNodeId, 'requires_building', `Requires ${label}`));
    for (const resource of Object.keys(input)) {
      edges.push(canonicalEdge(`constraint.storage.${resource}->${productionNodeId}`, `constraint.storage.${resource}`, productionNodeId, 'consumes_resource', `Consumes ${resource}`));
    }

    let collectStatus = 'locked';
    let collectBlocker = null;
    let collectActionRef = null;
    if (!existing) {
      collectBlocker = `Build ${label} first.`;
    } else if (existing.canCollect || existing.state === 'OUTPUT_READY') {
      collectStatus = 'available';
      collectActionRef = actionRefFor('et.plot.collect_outputs', {
        buildingId: existing.buildingId,
        actor: 'HUMAN',
        idempotencyKey: '$idempotencyKey'
      }, {
        agentPolicy: { permissionKey: 'collectOutputs', requiredHqLevel: 2, requiresPolicyEnabled: true }
      });
    } else if (existing.activeJob) {
      collectStatus = 'waiting';
      collectBlocker = `${label} output is not ready yet.`;
    } else {
      collectStatus = 'blocked';
      collectBlocker = 'Queue a job before collecting output.';
    }
    const buffer = normalizeInventory(existing?.outputBuffer || {});
    const collectNodeId = `production.${buildingType}.collect`;
    nodes.push(canonicalNode({
      nodeId: collectNodeId,
      kind: buildingType === 'WORKSHOP' ? 'effect_collect' : 'production_collect',
      title: buildingType === 'WORKSHOP' ? 'Collect Workshop buff' : `Collect ${label} output`,
      status: collectStatus,
      icon: buildingType === 'WORKSHOP' ? permissionIcon('setPriority') : buildingIcon(buildingType),
      target: { kind: 'building_collect', type: buildingType, buildingId: existing?.buildingId || null },
      requirements: { items: [], affordable: true, missing: {} },
      availability: {
        placed: !!existing,
        buildingState: existing?.state || null,
        canCollect: !!existing?.canCollect || existing?.state === 'OUTPUT_READY',
        outputBuffer: buffer,
        blockedBy: existing ? [] : [`building.${buildingType}.place`]
      },
      effects: buildingType === 'WORKSHOP'
        ? [{ kind: 'applies_buff_to_next_build', construction_buff_pct: Number(spec.buffPct || 0) }]
        : Object.entries(output).map(([resource, amount]) => ({ kind: 'fills_storage', resource, amount })),
      metadata: {
        outputBuffer: buffer,
        storageCaps: normalizeInventory(state?.plot?.storageCaps),
        leavesOverflowWhenCapped: RESOURCE_STORAGE_KEYS.some((key) => Number(buffer[key] || 0) > 0 && Number(state?.plot?.inventory?.[key] || 0) >= Number(state?.plot?.storageCaps?.[key] || 0))
      },
      blocker: collectBlocker,
      nextAction: collectStatus === 'available' ? 'Collect outputs' : (collectBlocker || 'Wait for output'),
      actionRef: collectActionRef,
      ui: { tier: `HQ${requiredHq}`, lane: label, sort: requiredHq * 100 + 70 }
    }));
    edges.push(canonicalEdge(`${productionNodeId}->${collectNodeId}`, productionNodeId, collectNodeId, buildingType === 'WORKSHOP' ? 'applies_buff_to_next_build' : 'produces_resource', 'Job output becomes collectible'));
  }
  return { nodes, edges };
}

function buildCanonicalPermissionPolicyNodes(state) {
  const nodes = [];
  const edges = [];
  const hqLevel = Math.max(1, Math.floor(Number(state?.plot?.hqLevel || 1)));
  const policy = {
    sellDailyCoinCap: 15,
    maxAutonomousActionsPerHour: 12,
    emergencyPause: false,
    ...(state?.plot?.policy || {})
  };
  const levels = permissionLevelMap();
  const rows = permissionRowsByKey(state);
  for (const [permissionKey, requiredHq] of Object.entries(levels).sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]))) {
    const row = rows[permissionKey] || {};
    const unlocked = row.unlocked === true || hqLevel >= requiredHq;
    const nodeId = `permission.${permissionKey}.unlock`;
    nodes.push(canonicalNode({
      nodeId,
      kind: 'permission_unlock',
      title: row.label || labelForType(permissionKey),
      status: unlocked ? 'done' : 'locked',
      icon: permissionIcon(permissionKey),
      target: { kind: 'permission', key: permissionKey },
      requirements: requirementsFor(state, { hqLevelRequired: requiredHq }),
      availability: {
        hqLevelRequired: requiredHq,
        unlocked,
        enabled: row.enabled === true,
        requiresApproval: row.requiresApproval === true,
        blockedBy: unlocked ? [] : [`hq.level.${requiredHq}`]
      },
      effects: [{ kind: 'enables_policy', policyKey: permissionKey }],
      nextAction: unlocked ? `Review ${permissionKey}` : `Reach HQ Level ${requiredHq}`,
      ui: { tier: `HQ${requiredHq}`, lane: 'Permissions', sort: requiredHq * 100 + 80 }
    }));
    edges.push(canonicalEdge(`hq.level.${requiredHq}->${nodeId}`, `hq.level.${requiredHq}`, nodeId, 'unlocks_permission', `HQ${requiredHq} unlocks ${permissionKey}`));
    const policyNodeId = `policy.${permissionKey}.enable`;
    const policyStatus = unlocked ? (row.enabled === true ? 'done' : 'available') : 'locked';
    nodes.push(canonicalNode({
      nodeId: policyNodeId,
      kind: 'policy_enable',
      title: `Policy: ${row.label || labelForType(permissionKey)}`,
      status: policyStatus,
      icon: permissionIcon(permissionKey),
      target: { kind: 'policy', key: permissionKey },
      requirements: requirementsFor(state, { hqLevelRequired: requiredHq }),
      availability: {
        hqLevelRequired: requiredHq,
        unlocked,
        enabled: row.enabled === true,
        requiresApproval: row.requiresApproval === true,
        blockedBy: unlocked ? [] : [nodeId]
      },
      effects: [{ kind: 'enables_agent_action', permissionKey }],
      metadata: { policyValue: row.enabled === true },
      nextAction: row.enabled ? `${permissionKey} policy enabled` : `Enable ${permissionKey} policy if desired`,
      ui: { tier: `HQ${requiredHq}`, lane: 'Policy', sort: requiredHq * 100 + 85 }
    }));
    edges.push(canonicalEdge(`${nodeId}->${policyNodeId}`, nodeId, policyNodeId, 'enables_action', `${permissionKey} permission enables policy toggle`));
  }
  const capNodes = [
    {
      nodeId: 'policy.sellDailyCoinCap',
      title: 'Policy: daily sell coin cap',
      value: Number(policy.sellDailyCoinCap || 0),
      requiredHq: levels.sellSurplusFood || 5
    },
    {
      nodeId: 'policy.maxAutonomousActionsPerHour',
      title: 'Policy: hourly autonomous action cap',
      value: Number(policy.maxAutonomousActionsPerHour || 0),
      requiredHq: 1
    },
    {
      nodeId: 'policy.emergencyPause',
      title: 'Policy: emergency pause',
      value: policy.emergencyPause === true,
      requiredHq: 1
    }
  ];
  for (const cap of capNodes) {
    const unlocked = hqLevel >= cap.requiredHq;
    nodes.push(canonicalNode({
      nodeId: cap.nodeId,
      kind: 'policy_cap',
      title: cap.title,
      status: unlocked ? 'done' : 'locked',
      icon: permissionIcon(cap.nodeId.split('.')[1]),
      target: { kind: 'policy', key: cap.nodeId.replace('policy.', '') },
      requirements: requirementsFor(state, { hqLevelRequired: cap.requiredHq }),
      availability: {
        hqLevelRequired: cap.requiredHq,
        unlocked,
        value: cap.value,
        blockedBy: unlocked ? [] : [`hq.level.${cap.requiredHq}`]
      },
      metadata: { value: cap.value },
      nextAction: 'Review policy cap',
      ui: { tier: `HQ${cap.requiredHq}`, lane: 'Policy', sort: cap.requiredHq * 100 + 90 }
    }));
  }
  const setPriorityUnlocked = hqLevel >= (levels.setPriority || 4);
  nodes.push(canonicalNode({
    nodeId: 'action.set_priority',
    kind: 'policy_action',
    title: 'Set building priority',
    status: setPriorityUnlocked ? 'available' : 'locked',
    icon: permissionIcon('setPriority'),
    target: { kind: 'action', action: 'set_priority', options: [...PRIORITY_OPTIONS] },
    requirements: requirementsFor(state, { hqLevelRequired: levels.setPriority || 4 }),
    availability: {
      hqLevelRequired: levels.setPriority || 4,
      policyEnabled: rows.setPriority?.enabled === true,
      blockedBy: setPriorityUnlocked ? [] : ['permission.setPriority.unlock']
    },
    metadata: { priorityOptions: [...PRIORITY_OPTIONS] },
    nextAction: 'Set WOOD, STONE, FOOD, or BALANCED priority through gameplay tools',
    actionRef: actionRefFor('et.plot.set_priority', {
      buildingId: '$buildingId',
      priority: '$priority',
      actor: 'HUMAN',
      idempotencyKey: '$idempotencyKey'
    }),
    ui: { tier: `HQ${levels.setPriority || 4}`, lane: 'Policy', sort: (levels.setPriority || 4) * 100 + 95 }
  }));
  return { nodes, edges };
}

function buildCanonicalRewardNodes(state) {
  const nodes = [];
  const edges = [];
  const available = new Map((state?.rewards || []).map((reward) => [reward.rewardId, reward]));
  const claimed = new Set(state?.plot?.claimedRewards || []);
  const collected = new Set(state?.plot?.collectedBuildingTypes || []);
  const hqLevel = Math.max(1, Math.floor(Number(state?.plot?.hqLevel || 1)));
  for (const reward of REWARD_CATALOG) {
    const isAvailable = available.has(reward.rewardId);
    const isClaimed = claimed.has(reward.rewardId);
    const requiredHq = Number(reward.requiredHqLevel || 1);
    const requiredCollected = reward.requiredCollectedBuildingType || null;
    const unlocked = requiredCollected ? collected.has(requiredCollected) : hqLevel >= requiredHq;
    const status = isClaimed ? 'done' : isAvailable ? 'available' : unlocked ? 'blocked' : 'locked';
    const nodeId = `reward.${reward.rewardId}.claim`;
    nodes.push(canonicalNode({
      nodeId,
      kind: 'reward_claim',
      title: `Claim ${reward.title}`,
      status,
      icon: resourceIcon(reward.grant?.town_xp ? 'xp' : Object.keys(reward.grant || {})[0] || 'coin'),
      target: { kind: 'reward', rewardId: reward.rewardId },
      requirements: requiredCollected
        ? {
          items: [{
            kind: 'building_collection',
            resource: requiredCollected,
            have: collected.has(requiredCollected) ? 1 : 0,
            required: 1,
            missing: collected.has(requiredCollected) ? 0 : 1
          }],
          affordable: collected.has(requiredCollected),
          missing: collected.has(requiredCollected) ? {} : { [requiredCollected]: 1 }
        }
        : requirementsFor(state, { hqLevelRequired: requiredHq }),
      availability: {
        available: isAvailable,
        claimed: isClaimed,
        unlocked,
        blockedBy: isClaimed || isAvailable ? [] : requiredCollected ? [`production.${requiredCollected}.collect`] : [`hq.level.${requiredHq}`]
      },
      effects: [{ kind: 'grants_reward', grant: clone(available.get(reward.rewardId)?.grant || reward.grant || {}) }],
      metadata: {
        body: reward.body,
        grant: clone(available.get(reward.rewardId)?.grant || reward.grant || {})
      },
      blocker: status === 'locked' ? 'Reward requirement has not been met yet.' : null,
      nextAction: isClaimed ? `${reward.title} claimed` : isAvailable ? `Claim ${reward.title}` : 'Meet reward requirement',
      actionRef: isAvailable ? actionRefFor('et.plot.claim_reward', {
        rewardId: reward.rewardId,
        actor: 'HUMAN',
        idempotencyKey: '$idempotencyKey'
      }) : null,
      ui: { tier: requiredCollected ? 'HQ1' : `HQ${requiredHq}`, lane: 'Rewards', sort: requiredHq * 100 + 110 }
    }));
    if (requiredCollected) {
      edges.push(canonicalEdge(`production.${requiredCollected}.collect->${nodeId}`, `production.${requiredCollected}.collect`, nodeId, 'unlocks_reward', `${requiredCollected} collection unlocks ${reward.title}`));
    } else {
      edges.push(canonicalEdge(`hq.level.${requiredHq}->${nodeId}`, `hq.level.${requiredHq}`, nodeId, 'unlocks_reward', `HQ${requiredHq} unlocks ${reward.title}`));
    }
  }
  return { nodes, edges };
}

function buildCanonicalConstraintNodes(state) {
  const nodes = [];
  const edges = [];
  const inventory = normalizeInventory(state?.plot?.inventory);
  const caps = normalizeInventory(state?.plot?.storageCaps);
  for (const resource of RESOURCE_STORAGE_KEYS) {
    const current = Number(inventory[resource] || 0);
    const cap = Number(caps[resource] || 0);
    nodes.push(canonicalNode({
      nodeId: `constraint.storage.${resource}`,
      kind: 'storage_cap',
      title: `${labelForType(resource)} storage`,
      status: 'done',
      icon: resourceIcon(resource),
      target: { kind: 'storage', resource },
      requirements: { items: [], affordable: true, missing: {} },
      availability: {
        current,
        cap,
        remaining: Math.max(0, cap - current),
        full: cap > 0 && current >= cap,
        blockedBy: []
      },
      metadata: { current, cap, remaining: Math.max(0, cap - current) },
      nextAction: cap > 0 && current >= cap ? `Spend or upgrade before collecting more ${resource}` : `${resource} storage has room`,
      ui: { tier: 'Constraints', lane: 'Storage', sort: 900 + RESOURCE_STORAGE_KEYS.indexOf(resource) }
    }));
  }
  const jobs = Array.isArray(state?.jobs) ? state.jobs : [];
  const activeConstruction = jobs.filter((job) => ['CONSTRUCT', 'UPGRADE'].includes(job.kind) && ['QUEUED', 'RUNNING'].includes(job.status));
  const runningConstruction = activeConstruction.filter((job) => job.status === 'RUNNING');
  const queuedConstruction = activeConstruction.filter((job) => job.status === 'QUEUED');
  const constructionSlots = Number(state?.plot?.constructionSlots || 0);
  nodes.push(canonicalNode({
    nodeId: 'constraint.construction_slots',
    kind: 'construction_slots',
    title: 'Construction slots',
    status: runningConstruction.length >= constructionSlots ? 'waiting' : 'available',
    icon: permissionIcon('constructionSlots'),
    target: { kind: 'constraint', key: 'construction_slots' },
    requirements: { items: [], affordable: true, missing: {} },
    availability: {
      slots: constructionSlots,
      running: runningConstruction.length,
      queued: queuedConstruction.length,
      open: Math.max(0, constructionSlots - runningConstruction.length),
      blockedBy: []
    },
    metadata: {
      slots: constructionSlots,
      runningJobs: runningConstruction.map(compactJob).filter(Boolean),
      queuedJobs: queuedConstruction.map(compactJob).filter(Boolean)
    },
    nextAction: queuedConstruction.length ? 'Wait for a construction slot' : 'Construction slot available',
    ui: { tier: 'Constraints', lane: 'Construction', sort: 920 }
  }));
  const buffPct = Number(state?.plot?.nextBuildBuffPct || 0);
  const workshop = findBuilding(state, 'WORKSHOP');
  const workshopSpec = productionSpecFor('WORKSHOP', workshop?.level || 1);
  nodes.push(canonicalNode({
    nodeId: 'effect.workshop.next_build_buff',
    kind: 'workshop_buff',
    title: 'Workshop next-build buff',
    status: buffPct > 0 ? 'done' : workshop ? 'blocked' : 'locked',
    icon: buildingIcon('WORKSHOP'),
    target: { kind: 'effect', key: 'nextBuildBuffPct', buildingId: workshop?.buildingId || null },
    requirements: requirementsFor(state, { hqLevelRequired: 4 }),
    availability: {
      hqLevelRequired: 4,
      placed: !!workshop,
      activeBuffPct: buffPct,
      availableBuffPct: Number(workshopSpec?.buffPct || 20),
      blockedBy: workshop ? [] : ['building.WORKSHOP.place']
    },
    effects: [{ kind: 'applies_buff_to_next_build', construction_buff_pct: buffPct || Number(workshopSpec?.buffPct || 20) }],
    metadata: { activeBuffPct: buffPct, availableBuffPct: Number(workshopSpec?.buffPct || 20) },
    nextAction: buffPct > 0 ? 'Start the next construction to consume the buff' : 'Run and collect Workshop prep',
    ui: { tier: 'HQ4', lane: 'Workshop', sort: 480 }
  }));
  edges.push(canonicalEdge('production.WORKSHOP.collect->effect.workshop.next_build_buff', 'production.WORKSHOP.collect', 'effect.workshop.next_build_buff', 'applies_buff_to_next_build', 'Workshop collection applies next-build buff'));
  return { nodes, edges };
}

function buildCanonicalApprovalNodes(state) {
  const nodes = [];
  for (const approval of Array.isArray(state?.approvals) ? state.approvals : []) {
    const approvalId = String(approval.approvalId || '');
    if (!approvalId) continue;
    const status = String(approval.status || '').toUpperCase() === 'PENDING'
      ? 'available'
      : String(approval.status || '').toUpperCase() === 'APPROVED'
        ? 'done'
        : 'blocked';
    nodes.push(canonicalNode({
      nodeId: `approval.${approvalId}`,
      kind: 'approval',
      title: cleanText(approval.title || approval.actionName || 'Approval request', 'Approval request', 120),
      status,
      icon: permissionIcon('approval'),
      target: { kind: 'approval', approvalId, actionName: approval.actionName || approval.action || null },
      requirements: { items: [], affordable: true, missing: {} },
      availability: {
        approvalId,
        approvalStatus: approval.status || null,
        actionName: approval.actionName || approval.action || null,
        blockedBy: []
      },
      metadata: {
        actionName: approval.actionName || approval.action || null,
        requestedParams: stableValue(approval.requestedParams || approval.params || {})
      },
      nextAction: status === 'available' ? 'Resolve approval in the gameplay approval surface' : 'Review approval record',
      ui: { tier: 'Approvals', lane: 'Approvals', sort: 1000 }
    }));
  }
  return { nodes, edges: [] };
}

function buildCanonicalAtlasGraph(state) {
  const sections = [
    buildCanonicalHqNodes(state),
    buildCanonicalConstraintNodes(state),
    buildCanonicalBuildingNodes(state),
    buildCanonicalProductionNodes(state),
    buildCanonicalPermissionPolicyNodes(state),
    buildCanonicalRewardNodes(state),
    buildCanonicalApprovalNodes(state)
  ];
  const nodeMap = new Map();
  const edges = [];
  for (const section of sections) {
    for (const node of section.nodes || []) {
      if (!node?.nodeId || nodeMap.has(node.nodeId)) continue;
      nodeMap.set(node.nodeId, node);
    }
    for (const edge of section.edges || []) edges.push(edge);
  }
  const canonicalNodes = Array.from(nodeMap.values())
    .sort((a, b) => Number(a.ui?.sort || 0) - Number(b.ui?.sort || 0) || a.nodeId.localeCompare(b.nodeId));
  const seenEdges = new Set();
  const canonicalEdges = edges
    .filter((edge) => edge?.from && edge?.to && nodeMap.has(edge.from) && nodeMap.has(edge.to))
    .filter((edge) => {
      const key = edge.edgeId || `${edge.from}->${edge.to}:${edge.kind}`;
      if (seenEdges.has(key)) return false;
      seenEdges.add(key);
      return true;
    });
  const availabilityByNode = {};
  const actionRefsByNode = {};
  const receiptRefs = {};
  for (const node of canonicalNodes) {
    availabilityByNode[node.nodeId] = canonicalAvailability(node);
    receiptRefs[node.nodeId] = [];
    if (node.actionRef) actionRefsByNode[node.nodeId] = node.actionRef;
  }
  return {
    canonicalNodes,
    canonicalEdges,
    availabilityByNode,
    actionRefsByNode,
    receiptRefs
  };
}

function buildHq10Horizon(state) {
  const currentHqLevel = Math.max(1, Math.floor(Number(state?.plot?.hqLevel || 1)));
  const cap = implementedHqCap();
  const milestones = HQ10_HORIZON_MILESTONES.map((milestone) => {
    const nodeId = futureHqNodeId(milestone);
    const previousLevel = Number(milestone.level || 0) - 1;
    const previousMilestone = HQ10_HORIZON_MILESTONES.find((item) => item.level === previousLevel);
    return {
      nodeId,
      hqLevel: milestone.level,
      title: milestone.title,
      system: milestone.system,
      status: 'locked',
      gameplayTruth: 'future_placeholder',
      currentImplementedHqCap: cap,
      summary: milestone.summary,
      possibilities: [...milestone.possibilities],
      blocker: `Canonical gameplay currently stops at HQ${cap}.`,
      nextImplementableSlice: milestone.nextImplementableSlice,
      riskLevel: milestone.riskLevel,
      icon: hqIcon(milestone.level),
      previousNodeId: previousMilestone ? futureHqNodeId(previousMilestone) : `hq.level.${cap}`
    };
  });
  return {
    version: 'progression_atlas_hq10_horizon_v1',
    targetHqLevel: 10,
    currentHqLevel,
    currentImplementedHqCap: cap,
    gameplayTruthBoundary: `HQ1-HQ${cap} are current Founders Plot engine truth; HQ6-HQ10 are advisory horizon nodes.`,
    gameplayMutationPolicy: 'advisory_only',
    recommendedTemplateKey: 'hq10-horizon',
    currentBridge: {
      nodeId: `hq.level.${cap}`,
      title: `Current playable cap: HQ${cap}`,
      status: currentHqLevel >= cap ? 'done' : 'locked',
      gameplayTruth: 'implemented',
      nextAction: currentHqLevel >= cap ? 'Plan the HQ6 expedition model' : `Reach HQ${cap} through current gameplay first`
    },
    milestones,
    edges: milestones.map((milestone, index) => ({
      from: index === 0 ? `hq.level.${cap}` : milestones[index - 1].nodeId,
      to: milestone.nodeId,
      kind: 'future_horizon_sequence'
    })),
    possibleUntilHq10: milestones.map((milestone) => ({
      hqLevel: milestone.hqLevel,
      title: milestone.title,
      system: milestone.system,
      possibilities: milestone.possibilities,
      nextImplementableSlice: milestone.nextImplementableSlice
    })),
    guardrails: [
      'Do not add HQ6-HQ10 as real upgrade rules until the engine owns their state.',
      'Do not let generated visuals redefine costs, unlocks, resources, permissions, or receipts.',
      'Keep Atlas plans advisory until a human promotes a future milestone into canonical gameplay work.'
    ]
  };
}

function summarizeAtlas(state, steps) {
  const firstOpen = steps.find((step) => step.status !== 'done') || steps[steps.length - 1] || null;
  return {
    hqLevel: Number(state?.plot?.hqLevel || 1),
    townXp: Number(state?.plot?.townXp || 0),
    inventory: normalizeInventory(state?.plot?.inventory),
    quest: clone(state?.quest || null),
    currentStepId: firstOpen?.stepId || null,
    currentStepTitle: firstOpen?.title || null,
    currentBlocker: firstOpen?.blocker || null,
    currentNextAction: firstOpen?.nextAction || null
  };
}

function stepsForStrategyKey(state, strategyKey) {
  switch (strategyKey) {
    case 'balanced-food-wood':
      return buildBalancedFoodWoodSteps(state);
    case 'delegate-outputs-first':
      return buildDelegateOutputsFirstSteps(state);
    case 'hq10-horizon':
      return buildHq10HorizonSteps(state);
    case 'rush-hq3':
    default:
      return buildRushHq3Steps(state);
  }
}

function aggregateMissingRequirements(steps) {
  const totals = {};
  for (const step of Array.isArray(steps) ? steps : []) {
    for (const item of Array.isArray(step.requirements?.items) ? step.requirements.items : []) {
      const missing = Math.max(0, Math.floor(Number(item.missing || 0)));
      if (missing <= 0) continue;
      const key = String(item.resource || item.kind || 'unknown');
      totals[key] = Math.max(Number(totals[key] || 0), missing);
    }
  }
  return totals;
}

function uniqueStrings(items, limit = 4) {
  const seen = new Set();
  const out = [];
  for (const item of Array.isArray(items) ? items : []) {
    const text = String(item || '').trim();
    if (!text || seen.has(text)) continue;
    seen.add(text);
    out.push(text);
    if (out.length >= limit) break;
  }
  return out;
}

function compareForStrategy(template, steps) {
  const blockers = uniqueStrings(steps.map((step) => step.blocker).filter(Boolean));
  const approvalActions = steps.filter((step) => step.actionRef?.tool).length;
  const permissionCheckpoints = steps
    .filter((step) => step.target?.kind === 'permission')
    .map((step) => step.target.key);
  const futureMilestones = steps
    .filter((step) => step.stepKind === 'future_placeholder' || step.target?.kind === 'future_hq_level')
    .map((step) => ({
      stepId: step.stepId,
      title: step.title,
      level: step.target?.level || null,
      system: step.futureSystem || step.target?.system || null
    }));
  return {
    goal: template.goal,
    stepCount: steps.length,
    focus: [...template.focus],
    roughBlockers: blockers.length ? blockers : ['No current blocker from the read model.'],
    resourceShortfalls: aggregateMissingRequirements(steps),
    permissions: permissionCheckpoints,
    futureMilestones,
    tradeoff: template.tradeoff,
    approvalDelegationBurden: template.approvalDelegationBurden,
    burden: {
      playerActionRefs: approvalActions,
      delegationMilestones: permissionCheckpoints,
      futureMilestones: futureMilestones.length
    }
  };
}

function normalizeStrategyMetadata(raw = {}, fallback = {}) {
  const revision = Math.max(1, Math.floor(Number(raw.revision || fallback.revision || 1)));
  return {
    createdBy: firstAllowed(raw.createdBy, STRATEGY_CREATED_BY, fallback.createdBy || 'human'),
    source: firstAllowed(raw.source, STRATEGY_SOURCES, fallback.source || 'editor'),
    parentStrategyId: nullableString(raw.parentStrategyId ?? fallback.parentStrategyId, 140),
    revision,
    sharePolicy: firstAllowed(raw.sharePolicy, PRIVACY_LEVELS, fallback.sharePolicy || 'private')
  };
}

function strategyContentHash(strategy) {
  return stableHash({
    strategyKey: strategy.strategyKey,
    title: strategy.title,
    goal: strategy.goal,
    summary: strategy.summary,
    focus: strategy.focus,
    compare: strategy.compare,
    steps: strategy.steps,
    graph: strategy.graph,
    createdBy: strategy.createdBy,
    source: strategy.source,
    parentStrategyId: strategy.parentStrategyId,
    revision: strategy.revision,
    sharePolicy: strategy.sharePolicy,
    gameplayMutationPolicy: strategy.gameplayMutationPolicy
  });
}

function buildProgressionStrategy(state, stateHash, strategyKey = DEFAULT_STRATEGY_KEY, { title = null } = {}) {
  const template = strategyTemplateForKey(strategyKey) || STRATEGY_TEMPLATES[DEFAULT_STRATEGY_KEY];
  const steps = stepsForStrategyKey(state, template.strategyKey)
    .map((step) => addStepContract(step, {
      stepKind: step.stepKind || 'canonical_node',
      canonicalNodeId: step.stepKind === 'future_placeholder' ? null : (step.canonicalNodeId || step.stepId),
      futureSystem: step.futureSystem || null
    }));
  const graph = buildGraph(state, steps);
  const strategyId = `strategy_${hashId([state?.plot?.plotId, template.strategyKey])}`;
  const gameplayStableHash = gameplayStableHashForState(state);
  const strategy = {
    strategyId,
    strategyKey: template.strategyKey,
    title: String(title || template.title).trim().slice(0, 80) || template.title,
    visibility: 'private',
    generatedBy: 'progression_atlas_v1',
    ...normalizeStrategyMetadata({}, {
      createdBy: 'clover',
      source: 'template',
      parentStrategyId: null,
      revision: 1,
      sharePolicy: 'private'
    }),
    baseGraphVersion: ATLAS_VERSION,
    baseStateHash: String(stateHash || state?.audit?.stateHash || ''),
    baseGameplayStableHash: gameplayStableHash,
    goal: template.goal,
    summary: template.summary,
    focus: [...template.focus],
    compare: compareForStrategy(template, steps),
    steps,
    graph,
    openClawLiteTools: [
      'agent_town_progression_get_state',
      'agent_town_progression_draft_strategy',
      'agent_town_progression_save_strategy',
      'agent_town_progression_select_strategy',
      'agent_town_progression_explain_node'
    ],
    gameplayMutationPolicy: 'advisory_only',
    createdAt: null,
    updatedAt: null
  };
  strategy.contentHash = strategyContentHash(strategy);
  return strategy;
}

function buildRushHq3Strategy(state, stateHash, options = {}) {
  return buildProgressionStrategy(state, stateHash, DEFAULT_STRATEGY_KEY, options);
}

function listStrategyTemplates() {
  return STRATEGY_TEMPLATE_KEYS.map((key) => clone(STRATEGY_TEMPLATES[key]));
}

function symbolFromText(value) {
  const words = cleanText(value, 'S', 80)
    .split(/[^A-Za-z0-9]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const symbol = words.length > 1
    ? words.slice(0, 2).map((word) => word[0]).join('')
    : (words[0] || 'S').slice(0, 2);
  return symbol.toUpperCase();
}

function makeEditorIconDraft({ title, prompt, nowMs }) {
  const safeTitle = cleanText(title, 'Custom strategy step', 80);
  const safePrompt = cleanText(prompt, `${safeTitle}, Agent Town strategy icon`, 300);
  const slug = slugFor(safeTitle, 'custom_step');
  return makeIcon({
    iconId: `strategy.custom.${slug}.${hashId([safeTitle, safePrompt]).slice(0, 8)}`,
    label: safeTitle,
    symbol: symbolFromText(safeTitle),
    tone: 'custom',
    source: 'progression_atlas_strategy_editor',
    assetPath: null
  });
}

function normalizeEditorIcon(rawIcon, { title, prompt, nowMs }) {
  const base = rawIcon && typeof rawIcon === 'object' ? rawIcon : {};
  const draft = makeEditorIconDraft({ title, prompt: base.prompt || prompt, nowMs });
  const label = cleanText(base.label, draft.label, 80);
  const icon = {
    ...draft,
    iconId: cleanText(base.iconId, draft.iconId, 100).replace(/[^a-zA-Z0-9._:-]/g, '_'),
    label,
    symbol: cleanText(base.symbol, draft.symbol, 4).toUpperCase(),
    tone: cleanText(base.tone, draft.tone, 24).replace(/[^a-zA-Z0-9_-]/g, '') || 'custom',
    source: 'progression_atlas_strategy_editor',
    assetPath: null,
    generatedBy: 'progression_atlas_genai_icon_prompt_v1',
    generatedAdHoc: true,
    global: false,
    generationMode: 'prompt_artifact',
    prompt: cleanText(base.prompt, prompt || `${label}, Agent Town strategy icon`, 300),
    genAi: {
      status: 'draft_prompt_attached',
      modelHint: 'openclaw-visible-genai',
      prompt: cleanText(base.prompt, prompt || `${label}, Agent Town strategy icon`, 300),
      createdAt: Number(nowMs || Date.now())
    }
  };
  return icon;
}

function normalizeConnection(value, knownIds) {
  const id = cleanText(value, '', 100);
  return id && knownIds.has(id) ? id : null;
}

function normalizeActionRef(value) {
  if (!value || typeof value !== 'object') return null;
  const tool = cleanText(value.tool, '', 80);
  if (!tool.startsWith('et.plot.')) return null;
  return {
    tool,
    params: value.params && typeof value.params === 'object' && !Array.isArray(value.params)
      ? stableValue(value.params)
      : {},
    executable: false
  };
}

function addStepContract(step, overrides = {}) {
  const stepKind = firstAllowed(overrides.stepKind || step.stepKind, STEP_KINDS, 'canonical_node');
  const canonicalNodeId = stepKind === 'canonical_node'
    ? nullableString(overrides.canonicalNodeId || step.canonicalNodeId || step.nodeId || step.stepId, 120)
    : null;
  const futureSystem = stepKind === 'future_placeholder'
    ? firstAllowed(overrides.futureSystem || step.futureSystem, FUTURE_SYSTEMS, null)
    : null;
  return {
    ...step,
    stepKind,
    canonicalNodeId,
    futureSystem,
    targetRef: normalizeTargetRef(overrides.targetRef || step.targetRef, targetRefFromTarget(step.target)),
    requirements: normalizePlanningRequirements(step.requirements, {
      fallback: step.requirements,
      advisory: stepKind !== 'canonical_node'
    }),
    estimatedCost: normalizeEstimatedCost(overrides.estimatedCost || step.estimatedCost || step.requirements?.cost),
    expectedBenefit: normalizeStringArray(overrides.expectedBenefit || step.expectedBenefit, [], 8, 180),
    riskLevel: firstAllowed(overrides.riskLevel || step.riskLevel, RISK_LEVELS, stepKind === 'canonical_node' ? 'low' : 'unknown'),
    reversibility: firstAllowed(overrides.reversibility || step.reversibility, REVERSIBILITY_LEVELS, stepKind === 'canonical_node' ? 'safe' : 'unknown'),
    assumptions: normalizeStringArray(overrides.assumptions || step.assumptions, [], 8, 220),
    privacy: firstAllowed(overrides.privacy || step.privacy, PRIVACY_LEVELS, 'private'),
    actionRef: normalizeActionRef(step.actionRef)
  };
}

function buildCanonicalStepIndex(state) {
  const index = new Map();
  for (const key of STRATEGY_TEMPLATE_KEYS) {
    for (const step of stepsForStrategyKey(state, key)) {
      if (!step?.stepId || index.has(step.stepId)) continue;
      index.set(step.stepId, addStepContract(step, {
        stepKind: step.stepKind || 'canonical_node',
        canonicalNodeId: step.stepKind === 'future_placeholder' ? null : (step.canonicalNodeId || step.stepId),
        futureSystem: step.futureSystem || null
      }));
    }
  }
  const canonicalGraph = buildCanonicalAtlasGraph(state);
  for (const node of canonicalGraph.canonicalNodes || []) {
    if (!node?.nodeId || index.has(node.nodeId)) continue;
    index.set(node.nodeId, addStepContract({
      stepId: node.nodeId,
      nodeId: node.nodeId,
      title: node.title,
      status: node.status,
      reason: node.metadata?.body || node.title,
      icon: node.icon,
      target: node.target,
      requirements: node.requirements,
      blocker: node.blocker,
      nextAction: node.nextAction,
      actionRef: node.actionRef
    }, { stepKind: 'canonical_node', canonicalNodeId: node.nodeId }));
  }
  return index;
}

function inferFutureSystem(raw) {
  const explicit = firstAllowed(raw?.futureSystem || raw?.targetRef?.system || raw?.target?.system, FUTURE_SYSTEMS, null);
  if (explicit) return explicit;
  const haystack = `${raw?.stepId || ''} ${raw?.nodeId || ''} ${raw?.title || ''}`.toLowerCase();
  return FUTURE_SYSTEMS.find((system) => haystack.includes(system)) || null;
}

function resolveEditorStepKind(raw, canonicalSteps) {
  const requestedKind = firstAllowed(raw?.stepKind, STEP_KINDS, null);
  const requestedCanonicalId = nullableString(raw?.canonicalNodeId || raw?.nodeId || raw?.stepId, 120);
  if (requestedCanonicalId && canonicalSteps.has(requestedCanonicalId)) {
    return {
      stepKind: 'canonical_node',
      canonicalNodeId: requestedCanonicalId,
      futureSystem: null,
      requestedCanonicalId
    };
  }
  const futureSystem = inferFutureSystem(raw);
  if (requestedKind === 'future_placeholder' || futureSystem) {
    return {
      stepKind: 'future_placeholder',
      canonicalNodeId: null,
      futureSystem,
      requestedCanonicalId
    };
  }
  return {
    stepKind: 'custom_note',
    canonicalNodeId: null,
    futureSystem: null,
    requestedCanonicalId: requestedKind === 'canonical_node' ? requestedCanonicalId : null
  };
}

function normalizeEditorSteps(rawSteps, nowMs, { canonicalSteps = new Map() } = {}) {
  const inputSteps = Array.isArray(rawSteps) ? rawSteps.slice(0, 24) : [];
  if (!inputSteps.length) return [];
  const used = new Set();
  const firstPass = inputSteps.map((raw, index) => {
    const title = cleanText(raw?.title, `Strategy Step ${index + 1}`, 80);
    const resolved = resolveEditorStepKind(raw, canonicalSteps);
    const baseId = cleanText(raw?.stepId || raw?.nodeId || resolved.canonicalNodeId, '', 100)
      .replace(/[^a-zA-Z0-9._:-]/g, '_') || `editor.${slugFor(title, 'step')}`;
    let stepId = baseId;
    let suffix = 2;
    while (used.has(stepId)) {
      stepId = `${baseId}.${suffix}`;
      suffix += 1;
    }
    used.add(stepId);
    return { raw, title, stepId, resolved };
  });
  const knownIds = new Set(firstPass.map((entry) => entry.stepId));
  return firstPass.map(({ raw, title, stepId, resolved }) => {
    const beforeStepId = normalizeConnection(raw?.beforeStepId || raw?.before, knownIds);
    const afterStepId = normalizeConnection(raw?.afterStepId || raw?.after, knownIds);
    const reason = cleanText(raw?.reason || raw?.note, 'Player-authored progression step.', 400);
    const prompt = cleanText(raw?.iconPrompt || raw?.icon?.prompt, `${title}, Agent Town strategy icon`, 300);
    const canonical = resolved.canonicalNodeId ? canonicalSteps.get(resolved.canonicalNodeId) : null;
    const fallbackRequirements = canonical?.requirements || null;
    const requirements = resolved.stepKind === 'canonical_node'
      ? normalizePlanningRequirements(fallbackRequirements, { fallback: fallbackRequirements, advisory: false })
      : normalizePlanningRequirements(raw?.requirements, { advisory: true });
    const target = canonical?.target || {
      kind: resolved.stepKind === 'future_placeholder' ? 'future_system_placeholder' : 'custom_strategy_step',
      source: 'progression_atlas_strategy_editor',
      system: resolved.futureSystem
    };
    const normalized = {
      stepId,
      nodeId: stepId,
      title,
      status: cleanText(raw?.status, 'planned', 24).toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'planned',
      reason,
      icon: normalizeEditorIcon(raw?.icon, { title, prompt, nowMs }),
      target,
      requirements,
      blocker: cleanText(raw?.blocker, '', 180) || null,
      nextAction: cleanText(raw?.nextAction, title, 120),
      actionRef: normalizeActionRef(raw?.actionRef || canonical?.actionRef),
      connections: { beforeStepId, afterStepId },
      beforeStepId,
      afterStepId,
      requestedCanonicalNodeId: resolved.stepKind === 'canonical_node' ? null : resolved.requestedCanonicalId,
      editorEditable: true
    };
    return addStepContract(normalized, {
      stepKind: resolved.stepKind,
      canonicalNodeId: resolved.canonicalNodeId,
      futureSystem: resolved.futureSystem,
      targetRef: normalizeTargetRef(raw?.targetRef || raw?.target, targetRefFromTarget(target)),
      estimatedCost: raw?.estimatedCost || raw?.cost || canonical?.estimatedCost || canonical?.requirements?.cost,
      expectedBenefit: raw?.expectedBenefit || raw?.expectedBenefits || raw?.benefits || canonical?.expectedBenefit,
      riskLevel: raw?.riskLevel || canonical?.riskLevel,
      reversibility: raw?.reversibility || canonical?.reversibility,
      assumptions: raw?.assumptions || canonical?.assumptions,
      privacy: raw?.privacy || canonical?.privacy
    });
  });
}

function buildEditorGraph(steps) {
  const nodes = steps.map((step, index) => ({
    nodeId: step.nodeId,
    title: step.title,
    status: step.status,
    index,
    target: step.target,
    icon: step.icon,
    requirements: step.requirements,
    blocker: step.blocker,
    nextAction: step.nextAction,
    connections: step.connections || {}
  }));
  const edges = [];
  const seen = new Set();
  function addEdge(from, to, kind) {
    if (!from || !to || from === to) return;
    const key = `${from}->${to}:${kind}`;
    if (seen.has(key)) return;
    seen.add(key);
    edges.push({ from, to, kind });
  }
  for (const step of steps) {
    addEdge(step.beforeStepId, step.stepId, 'editor_before');
    addEdge(step.stepId, step.afterStepId, 'editor_after');
  }
  if (!edges.length) {
    for (let i = 0; i < steps.length - 1; i += 1) addEdge(steps[i].stepId, steps[i + 1].stepId, 'editor_sequence');
  }
  return { nodes, edges };
}

function buildEditedStrategyFromInput({ state, stateHash, strategyInput, nowMs }) {
  const raw = strategyInput && typeof strategyInput === 'object' ? strategyInput : {};
  const timestamp = Number(nowMs || Date.now());
  const sourceSteps = Array.isArray(raw.steps) && raw.steps.length
    ? raw.steps
    : buildRushHq3Strategy(state, stateHash).steps;
  const canonicalSteps = buildCanonicalStepIndex(state);
  const steps = normalizeEditorSteps(sourceSteps, timestamp, { canonicalSteps });
  if (!steps.length) return null;
  const title = cleanText(raw.title, 'Custom Progression Strategy', 80);
  const goal = cleanText(raw.goal, raw.summary || 'Player-authored Founders Plot strategy.', 220);
  const focus = Array.isArray(raw.focus)
    ? uniqueStrings(raw.focus, 6)
    : ['Player-authored plan', 'Private strategy', 'Advisory only'];
  const graph = buildEditorGraph(steps);
  const strategyHash = stableHash({ title, goal, focus, steps, graph });
  const strategyKey = normalizeStrategyKey(raw.strategyKey || `custom-${slugFor(title, 'strategy')}`);
  const strategy = {
    strategyId: `strategy_custom_${hashId([state?.plot?.plotId, strategyHash])}`,
    strategyKey: strategyKey.startsWith('custom-') ? strategyKey : `custom-${strategyKey}`,
    title,
    visibility: 'private',
    generatedBy: 'progression_atlas_strategy_editor_v1',
    ...normalizeStrategyMetadata(raw, {
      createdBy: 'human',
      source: 'editor',
      parentStrategyId: null,
      revision: 1,
      sharePolicy: 'private'
    }),
    baseGraphVersion: ATLAS_VERSION,
    baseStateHash: String(stateHash || state?.audit?.stateHash || ''),
    baseGameplayStableHash: gameplayStableHashForState(state),
    goal,
    summary: cleanText(raw.summary, goal, 240),
    focus,
    compare: {
      goal,
      stepCount: steps.length,
      focus,
      roughBlockers: uniqueStrings(steps.map((step) => step.blocker).filter(Boolean), 4),
      resourceShortfalls: {},
      permissions: uniqueStrings(steps.map((step) => step.target?.key).filter(Boolean), 4),
      tradeoff: 'Custom editor plan. It can guide play, but canonical gameplay still requires normal Founders Plot tools and approvals.',
      approvalDelegationBurden: 'User-authored: review every linked action before execution.',
      burden: {
        playerActionRefs: steps.filter((step) => step.actionRef?.tool).length,
        delegationMilestones: []
      }
    },
    steps,
    graph,
    editor: {
      version: 'progression_atlas_strategy_editor_v1',
      connectionModel: 'before_after_step_ids',
      iconModel: 'prompt_backed_genai_draft'
    },
    openClawLiteTools: [
      'agent_town_progression_get_state',
      'agent_town_progression_save_strategy',
      'agent_town_progression_generate_icon_draft',
      'agent_town_progression_save_edited_strategy',
      'agent_town_progression_select_strategy'
    ],
    gameplayMutationPolicy: 'advisory_only',
    createdAt: timestamp,
    updatedAt: timestamp
  };
  strategy.contentHash = strategyContentHash(strategy);
  return strategy;
}

function getStateEnvelope({ pairId, houseId = null, plotId = null, nowMs }) {
  const envelope = engine.getFoundersPlotState({
    pairId,
    houseId,
    plotId,
    nowMs,
    includeReplay: false,
    includePublicSummary: true
  });
  if (!envelope || envelope.ok === false) return envelope;
  return envelope;
}

function strategyFromRecord(record) {
  if (!record?.strategy) return null;
  return {
    ...clone(record.strategy),
    selected: record.selected === true,
    savedAt: record.updatedAt,
    createdAt: record.strategy.createdAt || record.createdAt,
    updatedAt: record.strategy.updatedAt || record.updatedAt
  };
}

function buildAtlasEnvelope({ stateEnvelope, nowMs }) {
  const state = stateEnvelope.state;
  const stateHash = stateEnvelope.stateHash || state?.audit?.stateHash || '';
  const gameplaySnapshot = buildGameplaySnapshot(state);
  const gameplayStableHash = stableHash(gameplaySnapshot);
  const draft = buildRushHq3Strategy(state, stateHash);
  const strategyOptions = STRATEGY_TEMPLATE_KEYS.map((key) => buildProgressionStrategy(state, stateHash, key));
  const records = store.listProgressionStrategies(state.plot.plotId);
  const strategies = records.map(strategyFromRecord).filter(Boolean);
  const selectedStrategy = strategies.find((strategy) => strategy.selected) || null;
  const summary = summarizeAtlas(state, draft.steps);
  const canonicalGraph = buildCanonicalAtlasGraph(state);
  const futureHorizon = buildHq10Horizon(state);
  return successEnvelope({
    plotId: state.plot.plotId,
    stateHash,
    gameplayStableHash,
    gameplaySnapshot,
    generatedAt: Number(nowMs || Date.now()),
    atlas: {
      graphVersion: ATLAS_VERSION,
      gameplayStableHash,
      iconCatalog: getAgentTownIconCatalog(),
      summary,
      canonicalNodes: canonicalGraph.canonicalNodes,
      canonicalEdges: canonicalGraph.canonicalEdges,
      availabilityByNode: canonicalGraph.availabilityByNode,
      actionRefsByNode: canonicalGraph.actionRefsByNode,
      receiptRefs: canonicalGraph.receiptRefs,
      futureHorizon,
      nodes: draft.graph.nodes,
      edges: draft.graph.edges,
      strategyTemplates: listStrategyTemplates(),
      strategyOptions,
      recommendedStrategy: draft,
      strategies,
      selectedStrategyId: selectedStrategy?.strategyId || null,
      openClawLiteSurface: {
        uiIntent: 'agent_town_ui_open_progression_atlas',
        read: 'agent_town_progression_get_state',
        draft: 'agent_town_progression_draft_strategy',
        save: 'agent_town_progression_save_strategy',
        select: 'agent_town_progression_select_strategy',
        explain: 'agent_town_progression_explain_node',
        editor: 'progression_atlas_iframe_editor',
        iconDraft: '/api/founders-plot/progression-atlas/icons/generate',
        generateIconDraft: 'agent_town_progression_generate_icon_draft',
        saveEditedStrategy: 'agent_town_progression_save_edited_strategy'
      }
    }
  });
}

function getProgressionAtlasState({ pairId, houseId = null, plotId = null, nowMs }) {
  const stateEnvelope = getStateEnvelope({ pairId, houseId, plotId, nowMs });
  if (!stateEnvelope || stateEnvelope.ok === false) return stateEnvelope;
  return buildAtlasEnvelope({ stateEnvelope, nowMs });
}

function draftProgressionStrategy({ pairId, houseId = null, plotId = null, strategyKey = DEFAULT_STRATEGY_KEY, title = null, nowMs }) {
  const key = normalizeStrategyKey(strategyKey);
  const template = strategyTemplateForKey(key);
  if (!template) {
    return errorEnvelope('INVALID_REQUEST', `Unknown Progression Atlas strategy template: ${key || 'empty'}.`);
  }
  const stateEnvelope = getStateEnvelope({ pairId, houseId, plotId, nowMs });
  if (!stateEnvelope || stateEnvelope.ok === false) return stateEnvelope;
  const strategy = buildProgressionStrategy(stateEnvelope.state, stateEnvelope.stateHash, template.strategyKey, { title });
  strategy.createdAt = Number(nowMs || Date.now());
  strategy.updatedAt = strategy.createdAt;
  return successEnvelope({
    plotId: stateEnvelope.state.plot.plotId,
    stateHash: stateEnvelope.stateHash,
    gameplayStableHash: gameplayStableHashForState(stateEnvelope.state),
    strategy
  });
}

function saveProgressionStrategy({
  pairId,
  houseId = null,
  plotId = null,
  strategyKey = DEFAULT_STRATEGY_KEY,
  title = null,
  select = false,
  nowMs
}) {
  const drafted = draftProgressionStrategy({ pairId, houseId, plotId, strategyKey, title, nowMs });
  if (!drafted || drafted.ok === false) return drafted;
  const timestamp = Number(nowMs || Date.now());
  const strategy = {
    ...drafted.strategy,
    createdAt: timestamp,
    updatedAt: timestamp
  };
  const saved = store.writeProgressionStrategy({
    strategyId: strategy.strategyId,
    plotId: drafted.plotId,
    strategyKey: strategy.strategyKey,
    title: strategy.title,
    selected: !!select,
    strategy,
    createdAt: timestamp,
    updatedAt: timestamp
  });
  let selected = saved;
  if (select) {
    selected = store.selectProgressionStrategy(drafted.plotId, strategy.strategyId, timestamp);
  }
  const latest = store.listProgressionStrategies(drafted.plotId).map(strategyFromRecord).filter(Boolean);
  return successEnvelope({
    plotId: drafted.plotId,
    stateHash: drafted.stateHash,
    gameplayStableHash: drafted.gameplayStableHash,
    strategy: strategyFromRecord(selected) || strategy,
    strategies: latest,
    selectedStrategyId: select ? strategy.strategyId : (latest.find((entry) => entry.selected)?.strategyId || null)
  });
}

function saveEditedProgressionStrategy({
  pairId,
  houseId = null,
  plotId = null,
  strategy = null,
  select = false,
  nowMs
}) {
  const stateEnvelope = getStateEnvelope({ pairId, houseId, plotId, nowMs });
  if (!stateEnvelope || stateEnvelope.ok === false) return stateEnvelope;
  const edited = buildEditedStrategyFromInput({
    state: stateEnvelope.state,
    stateHash: stateEnvelope.stateHash,
    strategyInput: strategy,
    nowMs
  });
  if (!edited) return errorEnvelope('INVALID_REQUEST', 'At least one strategy step is required.');
  const timestamp = Number(nowMs || Date.now());
  const saved = store.writeProgressionStrategy({
    strategyId: edited.strategyId,
    plotId: stateEnvelope.state.plot.plotId,
    strategyKey: edited.strategyKey,
    title: edited.title,
    selected: !!select,
    strategy: edited,
    createdAt: timestamp,
    updatedAt: timestamp
  });
  let selected = saved;
  if (select) {
    selected = store.selectProgressionStrategy(stateEnvelope.state.plot.plotId, edited.strategyId, timestamp);
  }
  const latest = store.listProgressionStrategies(stateEnvelope.state.plot.plotId).map(strategyFromRecord).filter(Boolean);
  return successEnvelope({
    plotId: stateEnvelope.state.plot.plotId,
    stateHash: stateEnvelope.stateHash,
    gameplayStableHash: gameplayStableHashForState(stateEnvelope.state),
    strategy: strategyFromRecord(selected) || edited,
    strategies: latest,
    selectedStrategyId: select ? edited.strategyId : (latest.find((entry) => entry.selected)?.strategyId || null)
  });
}

function generateProgressionIconDraft({
  pairId,
  houseId = null,
  plotId = null,
  title = null,
  prompt = null,
  nowMs
}) {
  const stateEnvelope = getStateEnvelope({ pairId, houseId, plotId, nowMs });
  if (!stateEnvelope || stateEnvelope.ok === false) return stateEnvelope;
  const safeTitle = cleanText(title, 'Custom strategy step', 80);
  const icon = normalizeEditorIcon(null, {
    title: safeTitle,
    prompt: cleanText(prompt, `${safeTitle}, Agent Town strategy icon`, 300),
    nowMs
  });
  return successEnvelope({
    plotId: stateEnvelope.state.plot.plotId,
    stateHash: stateEnvelope.stateHash,
    gameplayStableHash: gameplayStableHashForState(stateEnvelope.state),
    icon
  });
}

function selectProgressionStrategy({ pairId, houseId = null, plotId = null, strategyId, nowMs }) {
  const stateEnvelope = getStateEnvelope({ pairId, houseId, plotId, nowMs });
  if (!stateEnvelope || stateEnvelope.ok === false) return stateEnvelope;
  const safeStrategyId = String(strategyId || '').trim();
  if (!safeStrategyId) return errorEnvelope('INVALID_REQUEST', 'strategyId is required.');
  const existing = store.getProgressionStrategy(safeStrategyId);
  if (!existing || existing.plotId !== stateEnvelope.state.plot.plotId) {
    return errorEnvelope('INVALID_STATE', 'Strategy not found for this plot.');
  }
  const selected = store.selectProgressionStrategy(stateEnvelope.state.plot.plotId, safeStrategyId, Number(nowMs || Date.now()));
  const strategies = store.listProgressionStrategies(stateEnvelope.state.plot.plotId).map(strategyFromRecord).filter(Boolean);
  return successEnvelope({
    plotId: stateEnvelope.state.plot.plotId,
    gameplayStableHash: gameplayStableHashForState(stateEnvelope.state),
    strategy: strategyFromRecord(selected),
    strategies,
    selectedStrategyId: safeStrategyId
  });
}

function explainProgressionNode({ pairId, houseId = null, plotId = null, nodeId, nowMs }) {
  const stateEnvelope = getStateEnvelope({ pairId, houseId, plotId, nowMs });
  if (!stateEnvelope || stateEnvelope.ok === false) return stateEnvelope;
  const strategies = STRATEGY_TEMPLATE_KEYS.map((key) => buildProgressionStrategy(stateEnvelope.state, stateEnvelope.stateHash, key));
  const safeNodeId = String(nodeId || '').trim();
  const strategyStep = strategies
    .flatMap((strategy) => strategy.steps)
    .find((entry) => entry.nodeId === safeNodeId || entry.stepId === safeNodeId);
  const canonicalNode = strategyStep ? null : buildCanonicalAtlasGraph(stateEnvelope.state).canonicalNodes
    .find((entry) => entry.nodeId === safeNodeId);
  const step = strategyStep || (canonicalNode ? {
    stepId: canonicalNode.nodeId,
    nodeId: canonicalNode.nodeId,
    title: canonicalNode.title,
    status: canonicalNode.status,
    reason: canonicalNode.metadata?.body || `${canonicalNode.title} is part of the canonical Founders Plot graph.`,
    requirements: canonicalNode.requirements,
    blocker: canonicalNode.blocker,
    nextAction: canonicalNode.nextAction,
    icon: canonicalNode.icon,
    target: canonicalNode.target,
    actionRef: canonicalNode.actionRef
  } : null);
  if (!step) return errorEnvelope('INVALID_REQUEST', 'Unknown progression node.');
  const missing = Object.entries(step.requirements?.missing || {})
    .map(([key, amount]) => `${key} ${amount}`)
    .join(', ');
  const explanation = [
    `${step.title}: ${step.reason}`,
    step.status === 'done' ? 'Status: complete.' : `Status: ${step.status}.`,
    step.blocker ? `Blocker: ${step.blocker}` : null,
    missing ? `Missing: ${missing}.` : null,
    `Next action: ${step.nextAction}.`
  ].filter(Boolean).join(' ');
  return successEnvelope({
    plotId: stateEnvelope.state.plot.plotId,
    gameplayStableHash: gameplayStableHashForState(stateEnvelope.state),
    nodeId: step.nodeId,
    step,
    explanation
  });
}

module.exports = {
  ATLAS_VERSION,
  DEFAULT_STRATEGY_KEY,
  STRATEGY_TEMPLATE_KEYS,
  buildGameplaySnapshot,
  gameplayStableHashForState,
  getProgressionAtlasState,
  draftProgressionStrategy,
  saveProgressionStrategy,
  saveEditedProgressionStrategy,
  generateProgressionIconDraft,
  selectProgressionStrategy,
  explainProgressionNode
};
