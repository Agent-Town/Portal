'use strict';

const crypto = require('crypto');

const engine = require('./engine');
const store = require('./store');
const {
  RESOURCE_KEYS,
  getAgentTownIcon,
  getAgentTownIconCatalog
} = require('../agent_town_icons');

const ATLAS_VERSION = 'founders-plot-progression-atlas-v1';
const DEFAULT_STRATEGY_KEY = 'rush-hq3';
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
  })
});
const STRATEGY_TEMPLATE_KEYS = Object.freeze(Object.keys(STRATEGY_TEMPLATES));

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
  return {
    goal: template.goal,
    stepCount: steps.length,
    focus: [...template.focus],
    roughBlockers: blockers.length ? blockers : ['No current blocker from the read model.'],
    resourceShortfalls: aggregateMissingRequirements(steps),
    permissions: permissionCheckpoints,
    tradeoff: template.tradeoff,
    approvalDelegationBurden: template.approvalDelegationBurden,
    burden: {
      playerActionRefs: approvalActions,
      delegationMilestones: permissionCheckpoints
    }
  };
}

function buildProgressionStrategy(state, stateHash, strategyKey = DEFAULT_STRATEGY_KEY, { title = null } = {}) {
  const template = strategyTemplateForKey(strategyKey) || STRATEGY_TEMPLATES[DEFAULT_STRATEGY_KEY];
  const steps = stepsForStrategyKey(state, template.strategyKey);
  const graph = buildGraph(state, steps);
  const strategyId = `strategy_${hashId([state?.plot?.plotId, template.strategyKey])}`;
  const gameplayStableHash = gameplayStableHashForState(state);
  return {
    strategyId,
    strategyKey: template.strategyKey,
    title: String(title || template.title).trim().slice(0, 80) || template.title,
    visibility: 'private',
    generatedBy: 'progression_atlas_v1',
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
}

function buildRushHq3Strategy(state, stateHash, options = {}) {
  return buildProgressionStrategy(state, stateHash, DEFAULT_STRATEGY_KEY, options);
}

function listStrategyTemplates() {
  return STRATEGY_TEMPLATE_KEYS.map((key) => clone(STRATEGY_TEMPLATES[key]));
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
        explain: 'agent_town_progression_explain_node'
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
  const step = strategies
    .flatMap((strategy) => strategy.steps)
    .find((entry) => entry.nodeId === safeNodeId || entry.stepId === safeNodeId);
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
  selectProgressionStrategy,
  explainProgressionNode
};
