const crypto = require('crypto');

const store = require('./store');
const { buildRecapFromEvents } = require('./recap');
const { computeStateHash, stableJsonStringify, buildReplayAudit } = require('./replay');

const RESOURCE_KEYS = ['wood', 'stone', 'food', 'coin'];
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
    unlocks: [],
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
  }
});

const HQ_UPGRADE_RULES = Object.freeze({
  1: { nextLevel: 2, cost: { wood: 20, food: 10 }, xpRequired: 25, durationMs: 60_000 },
  2: { nextLevel: 3, cost: { wood: 20, stone: 16 }, xpRequired: 50, durationMs: 90_000 },
  3: { nextLevel: 4, cost: { wood: 40, stone: 30, food: 20 }, xpRequired: 90, durationMs: 120_000 },
  4: { nextLevel: 5, cost: { wood: 60, stone: 50, food: 30 }, xpRequired: 140, durationMs: 150_000 }
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
    approvals: clone(bundle.approvals || [])
  };
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
  bundle.policy = bundle.policy || defaultPolicy(bundle.plot.plotId, nowMs);
  bundle.approvals = store.listApprovals(bundle.plot.plotId);
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
  if (bundle.plot.hqLevel < 5) {
    return {
      id: `reach-hq-${Math.min(5, bundle.plot.hqLevel + 1)}`,
      title: `Reach HQ Level ${Math.min(5, bundle.plot.hqLevel + 1)}`,
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
    if (job.kind === 'PRODUCE' || job.kind === 'SELL') {
      actors.push(makeVisualActor({
        role: 'worker',
        generatedOverlayRoleId: 'inhabitant.worker',
        sourceDomain: 'job',
        sourceObjectId: job.jobId,
        sourceStateHash,
        visualState: job.status === 'QUEUED' ? 'waiting_to_work' : 'working',
        actionKind: job.kind,
        progress: visualActorProgress(job, nowMs),
        target
      }));
    }
  }

  for (const building of [...bundle.buildings].sort((a, b) => String(a.buildingId).localeCompare(String(b.buildingId)))) {
    if (building.state !== 'OUTPUT_READY') continue;
    actors.push(makeVisualActor({
      role: 'hauler',
      generatedOverlayRoleId: 'inhabitant.hauler',
      sourceDomain: 'building',
      sourceObjectId: building.buildingId,
      sourceStateHash,
      visualState: 'ready_to_collect',
      actionKind: 'OUTPUT_READY',
      progress: 1,
      target: actorTargetForBuilding(building)
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

  return actors.slice(0, 16);
}

function publicSummary(bundle) {
  const plot = bundle.plot;
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
    buildings,
    updatedAt: plot.updatedAt
  };
}

function buildState(bundle, { includeReplay = false, includePublicSummary = true } = {}) {
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
  const visualActors = visualActorProjections(bundle, { stateHash });
  const permissions = unlockedPermissionRows(bundle);
  const approvals = (bundle.approvals || [])
    .filter((approval) => approval.status !== 'USED')
    .slice(0, 20);
  const unlockedBuildings = unlockedBuildingsForHq(bundle.plot.hqLevel);
  const rewards = availableRewards(bundle);
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
    hqUpgrade: clone(HQ_UPGRADE_RULES[bundle.plot.hqLevel] || null),
    buildingDefs: publicBuildingDefs(),
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
  return HQ_LEVEL_RULES[Math.max(1, Math.min(5, Number(hqLevel) || 1))] || HQ_LEVEL_RULES[1];
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
    bundle.plot.hqLevel = Math.min(5, bundle.plot.hqLevel + 1);
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
      if (building.type === 'WORKSHOP') {
        markCompletedWorkshopJob(bundle, building, job, pendingEvents, eventTime);
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
    if (!verifyPlotId(bundle, plotId)) {
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
  includePublicSummary = true
}) {
  return store.withTransaction(() => {
    const bundle = ensurePlotBundle({ pairId, houseId, plotId, nowMs });
    if (!verifyPlotId(bundle, plotId)) {
      return errorEnvelope(plotId, 'UNAUTHORIZED', 'Requested plot does not match the current session plot.', false);
    }

    const pendingEvents = [];
    simulateBundleTo(bundle, nowMs, pendingEvents);
    maybeGrantDailyReturnBonus(bundle, nowMs, pendingEvents);
    maybeCreatePendingRecap(bundle.plot, nowMs);
    const inserted = applyPendingEvents(bundle, pendingEvents);
    persistBundle(bundle);
    const { state, recap, stateHash } = buildState(bundle, { includeReplay, includePublicSummary });
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
    if (!verifyPlotId(bundle, plotId)) {
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
      const spec = def.produces(building.level);
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
          kind: job.kind
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
      } else {
        const transfer = addResourcesWithCaps(bundle.plot.inventory, building.outputBuffer || {}, bundle.plot.storageCaps);
        bundle.plot.inventory = transfer.inventory;
        building.outputBuffer = transfer.remainder;
        collected = transfer.applied;
      }
      const stillBuffered = RESOURCE_KEYS.some((key) => Number(building.outputBuffer?.[key] || 0) > 0);
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
  HQ_LEVEL_RULES,
  HQ_UPGRADE_RULES,
  getFoundersPlotState,
  setFoundersPlotPolicy,
  resolveApproval,
  acknowledgeRecap,
  createApprovalRequest,
  placeBuilding,
  queueJob,
  collectOutputs,
  upgradeBuilding,
  setPriority,
  claimReward,
  readPublicPlot,
  listPublicPlots,
  advancePlotTimeForTests
};
