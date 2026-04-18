const crypto = require('crypto');

const BUILDING_TYPES = [
  'HQ',
  'LUMBER_CAMP',
  'FARM_PLOT',
  'QUARRY',
  'WORKSHOP',
  'MARKET_STALL'
];

const EVENT_TYPES = {
  PLOT_CREATED: 'PLOT_CREATED',
  BUILDING_PLACED: 'BUILDING_PLACED',
  BUILDING_STARTED: 'BUILDING_STARTED',
  BUILDING_COMPLETED: 'BUILDING_COMPLETED',
  JOB_QUEUED: 'JOB_QUEUED',
  JOB_COMPLETED: 'JOB_COMPLETED',
  OUTPUT_COLLECTED: 'OUTPUT_COLLECTED',
  HQ_UPGRADED: 'HQ_UPGRADED',
  APPROVAL_REQUESTED: 'APPROVAL_REQUESTED',
  APPROVAL_APPROVED: 'APPROVAL_APPROVED',
  APPROVAL_REJECTED: 'APPROVAL_REJECTED',
  AGENT_PERMISSION_CHANGED: 'AGENT_PERMISSION_CHANGED',
  AGENT_ACTION_EXECUTED: 'AGENT_ACTION_EXECUTED',
  REWARD_CLAIMED: 'REWARD_CLAIMED',
  RECAP_GENERATED: 'RECAP_GENERATED'
};

const BUILD_PADS = [
  { x: 0, y: 0, label: 'Northwest Pad' },
  { x: 1, y: 0, label: 'North Pad' },
  { x: 2, y: 0, label: 'Northeast Pad' },
  { x: 0, y: 1, label: 'West Pad' },
  { x: 2, y: 1, label: 'East Pad' },
  { x: 1, y: 2, label: 'South Pad' }
];

const INITIAL_PLOT_INVENTORY = {
  wood: 0,
  stone: 0,
  food: 0,
  coin: 20
};

const STORAGE_CAPS_BY_HQ = {
  1: { wood: 100, stone: 100, food: 100 },
  2: { wood: 100, stone: 100, food: 100 },
  3: { wood: 100, stone: 100, food: 100 },
  4: { wood: 150, stone: 150, food: 150 },
  5: { wood: 150, stone: 150, food: 150 }
};

const CONSTRUCTION_SLOTS_BY_HQ = {
  1: 1,
  2: 1,
  3: 2,
  4: 2,
  5: 2
};

const HQ_UPGRADE_RULES = {
  1: {
    nextLevel: 2,
    cost: { wood: 20 },
    xpRequired: 15,
    durationMs: 2 * 60 * 1000
  },
  2: {
    nextLevel: 3,
    cost: { wood: 30, food: 20 },
    xpRequired: 45,
    durationMs: 3 * 60 * 1000
  },
  3: {
    nextLevel: 4,
    cost: { wood: 40, stone: 30, food: 20 },
    xpRequired: 90,
    durationMs: 4 * 60 * 1000
  },
  4: {
    nextLevel: 5,
    cost: { wood: 60, stone: 50, food: 30 },
    xpRequired: 135,
    durationMs: 5 * 60 * 1000
  }
};

const BUILDING_RULES = {
  HQ: {
    label: 'Headquarters',
    unlockLevel: 1,
    buildCost: null,
    buildDurationMs: 0,
    maxLevel: 5
  },
  LUMBER_CAMP: {
    label: 'Lumber Camp',
    unlockLevel: 1,
    buildCost: { coin: 6 },
    buildDurationMs: 60 * 1000,
    maxLevel: 2,
    production: {
      1: { kind: 'PRODUCE', input: {}, output: { wood: 6 }, durationMs: 60 * 1000 },
      2: { kind: 'PRODUCE', input: {}, output: { wood: 8 }, durationMs: 60 * 1000 }
    },
    upgrade: {
      1: { toLevel: 2, cost: { wood: 18, stone: 8 }, durationMs: 90 * 1000 }
    }
  },
  FARM_PLOT: {
    label: 'Farm Plot',
    unlockLevel: 2,
    buildCost: { wood: 10, coin: 6 },
    buildDurationMs: 90 * 1000,
    maxLevel: 2,
    production: {
      1: { kind: 'PRODUCE', input: {}, output: { food: 6 }, durationMs: 90 * 1000 },
      2: { kind: 'PRODUCE', input: {}, output: { food: 8 }, durationMs: 90 * 1000 }
    },
    upgrade: {
      1: { toLevel: 2, cost: { wood: 20, stone: 6 }, durationMs: 120 * 1000 }
    }
  },
  QUARRY: {
    label: 'Quarry',
    unlockLevel: 3,
    buildCost: { wood: 14, coin: 8 },
    buildDurationMs: 90 * 1000,
    maxLevel: 2,
    production: {
      1: { kind: 'PRODUCE', input: {}, output: { stone: 4 }, durationMs: 90 * 1000 },
      2: { kind: 'PRODUCE', input: {}, output: { stone: 6 }, durationMs: 90 * 1000 }
    },
    upgrade: {
      1: { toLevel: 2, cost: { wood: 22, stone: 10 }, durationMs: 120 * 1000 }
    }
  },
  WORKSHOP: {
    label: 'Workshop',
    unlockLevel: 4,
    buildCost: { wood: 20, stone: 12, coin: 10 },
    buildDurationMs: 120 * 1000,
    maxLevel: 2,
    production: {
      1: { kind: 'PRODUCE', input: { wood: 8, stone: 4 }, output: { workshop_buff: 1 }, durationMs: 60 * 1000 },
      2: { kind: 'PRODUCE', input: { wood: 8, stone: 4 }, output: { workshop_buff: 1 }, durationMs: 45 * 1000 }
    },
    upgrade: {
      1: { toLevel: 2, cost: { wood: 24, stone: 18 }, durationMs: 150 * 1000 }
    }
  },
  MARKET_STALL: {
    label: 'Market Stall',
    unlockLevel: 5,
    buildCost: { wood: 18, stone: 8, coin: 12 },
    buildDurationMs: 90 * 1000,
    maxLevel: 2,
    production: {
      1: { kind: 'SELL', input: { food: 6 }, output: { coin: 3 }, durationMs: 60 * 1000 },
      2: { kind: 'SELL', input: { food: 6 }, output: { coin: 5 }, durationMs: 60 * 1000 }
    },
    upgrade: {
      1: { toLevel: 2, cost: { wood: 22, stone: 10 }, durationMs: 120 * 1000 }
    }
  }
};

const PERMISSION_RULES = [
  { key: 'observeAndSuggest', level: 1, defaultValue: true },
  { key: 'collectOutputs', level: 2, defaultValue: false },
  { key: 'queueProduction', level: 3, defaultValue: false },
  { key: 'setPriority', level: 4, defaultValue: false },
  { key: 'sellSurplusFood', level: 5, defaultValue: false }
];

const AUTONOMY_TIER_BY_POLICY = {
  collectOutputs: 'collect',
  queueProduction: 'queue',
  setPriority: 'priority',
  sellSurplusFood: 'sell'
};

const DEFAULT_POLICY = {
  observeAndSuggest: true,
  collectOutputs: false,
  queueProduction: false,
  setPriority: false,
  sellSurplusFood: false,
  sellDailyCoinCap: 12,
  sellDailyCoinDay: '',
  sellDailyCoinSold: 0,
  maxAutonomousActionsPerHour: 8,
  autonomyBucket: '',
  autonomyUsed: 0,
  emergencyPause: false
};

const XP_RULES = {
  firstPlacement: 10,
  firstCollection: 5,
  hqUpgrade: 20,
  automationTier: 10,
  dailyReturn: 5
};

const FOUNDERS_PLOT_SCHEMA_VERSION = 1;
const MAX_OFFLINE_MS = 8 * 60 * 60 * 1000;
const SIMULATION_TICK_MS = 60 * 1000;

const META_CORE_KEYS = new Set([
  'schemaVersion',
  'extensions',
  'pendingRewards',
  'claimedRewards',
  'firstPlacedTypes',
  'firstCollectedTypes',
  'automationAwards',
  'dailyReturnDay',
  'workshopBuffCharges',
  'recapSeenSeq',
  'lastGeneratedRecapSeq',
  'publicHeadline',
  'questDismissedAt'
]);

function nowBucketHour(nowMs) {
  return new Date(nowMs).toISOString().slice(0, 13);
}

function utcDay(nowMs) {
  return new Date(nowMs).toISOString().slice(0, 10);
}

function copyJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map((item) => stableValue(item));
  if (!value || typeof value !== 'object') return value;
  const out = {};
  for (const key of Object.keys(value).sort()) {
    out[key] = stableValue(value[key]);
  }
  return out;
}

function stateHash(value) {
  return crypto.createHash('sha256').update(JSON.stringify(stableValue(value))).digest('hex');
}

function randomId(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

function normalizeCount(value) {
  const numeric = Math.max(0, Math.floor(Number(value) || 0));
  return Number.isFinite(numeric) ? numeric : 0;
}

function normalizeSchemaVersion(value, fallback = 0) {
  const numeric = Math.floor(Number(value));
  if (!Number.isFinite(numeric) || numeric < 0) return fallback;
  return numeric;
}

function copyPersistedValue(value) {
  if (value === null || typeof value !== 'object') return value;
  return copyJson(value);
}

function normalizeInventory(raw = {}) {
  return {
    wood: normalizeCount(raw.wood),
    stone: normalizeCount(raw.stone),
    food: normalizeCount(raw.food),
    coin: normalizeCount(raw.coin)
  };
}

function normalizePolicy(raw = {}) {
  return {
    observeAndSuggest: raw.observeAndSuggest !== false,
    collectOutputs: raw.collectOutputs === true,
    queueProduction: raw.queueProduction === true,
    setPriority: raw.setPriority === true,
    sellSurplusFood: raw.sellSurplusFood === true,
    sellDailyCoinCap: Math.max(0, Math.floor(Number(raw.sellDailyCoinCap ?? DEFAULT_POLICY.sellDailyCoinCap) || 0)),
    sellDailyCoinDay: typeof raw.sellDailyCoinDay === 'string' ? raw.sellDailyCoinDay : '',
    sellDailyCoinSold: Math.max(0, Math.floor(Number(raw.sellDailyCoinSold ?? 0) || 0)),
    maxAutonomousActionsPerHour: Math.max(1, Math.floor(Number(raw.maxAutonomousActionsPerHour ?? DEFAULT_POLICY.maxAutonomousActionsPerHour) || 1)),
    autonomyBucket: typeof raw.autonomyBucket === 'string' ? raw.autonomyBucket : '',
    autonomyUsed: Math.max(0, Math.floor(Number(raw.autonomyUsed ?? 0) || 0)),
    emergencyPause: raw.emergencyPause === true,
    updatedAt: normalizeCount(raw.updatedAt)
  };
}

function collectMetaExtensions(raw = {}) {
  const extensions = raw.extensions && typeof raw.extensions === 'object' && !Array.isArray(raw.extensions)
    ? copyPersistedValue(raw.extensions)
    : {};
  for (const [key, value] of Object.entries(raw)) {
    if (key === 'extensions' || META_CORE_KEYS.has(key) || value === undefined) continue;
    extensions[key] = copyPersistedValue(value);
  }
  return extensions;
}

function normalizeMeta(raw = {}) {
  const pendingRewards = Array.isArray(raw.pendingRewards) ? raw.pendingRewards.map((reward) => ({
    key: String(reward?.key || ''),
    type: String(reward?.type || ''),
    title: String(reward?.title || ''),
    body: String(reward?.body || ''),
    grant: reward?.grant && typeof reward.grant === 'object' ? reward.grant : {},
    createdAt: normalizeCount(reward?.createdAt)
  })).filter((reward) => reward.key) : [];
  const claimedRewards = Array.isArray(raw.claimedRewards)
    ? raw.claimedRewards.map((entry) => String(entry || '')).filter(Boolean)
    : [];
  const firstPlacedTypes = Array.isArray(raw.firstPlacedTypes)
    ? raw.firstPlacedTypes.map((entry) => String(entry || '')).filter(Boolean)
    : [];
  const firstCollectedTypes = Array.isArray(raw.firstCollectedTypes)
    ? raw.firstCollectedTypes.map((entry) => String(entry || '')).filter(Boolean)
    : [];
  const automationAwards = Array.isArray(raw.automationAwards)
    ? raw.automationAwards.map((entry) => String(entry || '')).filter(Boolean)
    : [];
  return {
    schemaVersion: normalizeSchemaVersion(raw.schemaVersion, FOUNDERS_PLOT_SCHEMA_VERSION),
    pendingRewards,
    claimedRewards,
    firstPlacedTypes,
    firstCollectedTypes,
    automationAwards,
    dailyReturnDay: typeof raw.dailyReturnDay === 'string' ? raw.dailyReturnDay : null,
    workshopBuffCharges: normalizeCount(raw.workshopBuffCharges),
    recapSeenSeq: normalizeCount(raw.recapSeenSeq),
    lastGeneratedRecapSeq: normalizeCount(raw.lastGeneratedRecapSeq),
    publicHeadline: typeof raw.publicHeadline === 'string' ? raw.publicHeadline : '',
    questDismissedAt: normalizeCount(raw.questDismissedAt),
    extensions: collectMetaExtensions(raw)
  };
}

function emptyOutputBuffer() {
  return { wood: 0, stone: 0, food: 0, coin: 0 };
}

function getStorageCaps(hqLevel) {
  return copyJson(STORAGE_CAPS_BY_HQ[hqLevel] || STORAGE_CAPS_BY_HQ[1]);
}

function getConstructionSlots(hqLevel) {
  return CONSTRUCTION_SLOTS_BY_HQ[hqLevel] || 1;
}

function createInitialPolicy(nowMs) {
  return {
    ...DEFAULT_POLICY,
    updatedAt: nowMs
  };
}

function makeHeadquarters(plotId, nowMs) {
  return {
    buildingId: randomId('bld'),
    plotId,
    type: 'HQ',
    level: 1,
    x: 1,
    y: 1,
    state: 'READY',
    outputBuffer: emptyOutputBuffer(),
    priority: 'BALANCED',
    createdAt: nowMs,
    updatedAt: nowMs
  };
}

function createInitialPlot({ pairId, houseId = null, nowMs = Date.now() }) {
  const plotId = randomId('plot');
  return {
    plot: {
      plotId,
      pairId,
      houseId,
      worldId: null,
      status: 'ACTIVE',
      hqLevel: 1,
      townXp: 0,
      inventory: copyJson(INITIAL_PLOT_INVENTORY),
      storageCaps: getStorageCaps(1),
      constructionSlots: getConstructionSlots(1),
      createdAt: nowMs,
      updatedAt: nowMs,
      lastSimulatedAt: nowMs
    },
    buildings: [makeHeadquarters(plotId, nowMs)],
    jobs: [],
    policy: createInitialPolicy(nowMs),
    approvals: [],
    meta: normalizeMeta({ schemaVersion: FOUNDERS_PLOT_SCHEMA_VERSION })
  };
}

function loadedStateSchemaVersion(raw) {
  if (!raw || typeof raw !== 'object') return 0;
  const meta = raw.meta && typeof raw.meta === 'object' ? raw.meta : {};
  return normalizeSchemaVersion(meta.schemaVersion, 0);
}

function migrateStateV0ToV1(raw) {
  const next = raw && typeof raw === 'object' ? copyJson(raw) : {};
  const meta = next.meta && typeof next.meta === 'object' ? next.meta : {};
  meta.extensions = collectMetaExtensions(meta);
  meta.schemaVersion = FOUNDERS_PLOT_SCHEMA_VERSION;
  next.meta = meta;
  return next;
}

function prepareLoadedState(raw) {
  if (!raw || typeof raw !== 'object') {
    return {
      state: null,
      migrated: false,
      fromVersion: 0,
      toVersion: FOUNDERS_PLOT_SCHEMA_VERSION
    };
  }
  let migratedRaw = copyJson(raw);
  const fromVersion = loadedStateSchemaVersion(migratedRaw);
  let toVersion = fromVersion;
  if (toVersion < 1) {
    migratedRaw = migrateStateV0ToV1(migratedRaw);
    toVersion = FOUNDERS_PLOT_SCHEMA_VERSION;
  }
  return {
    state: normalizeLoadedStateObject(migratedRaw),
    migrated: toVersion !== fromVersion,
    fromVersion,
    toVersion
  };
}

function normalizeLoadedStateObject(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const plot = raw.plot && typeof raw.plot === 'object' ? raw.plot : {};
  const hqLevel = Math.min(5, Math.max(1, Math.floor(Number(plot.hqLevel || 1) || 1)));
  return {
    plot: {
      plotId: String(plot.plotId || ''),
      pairId: String(plot.pairId || ''),
      houseId: typeof plot.houseId === 'string' ? plot.houseId : null,
      worldId: typeof plot.worldId === 'string' ? plot.worldId : null,
      status: plot.status === 'PAUSED' || plot.status === 'ARCHIVED' ? plot.status : 'ACTIVE',
      hqLevel,
      townXp: normalizeCount(plot.townXp),
      inventory: normalizeInventory(plot.inventory),
      storageCaps: getStorageCaps(hqLevel),
      constructionSlots: getConstructionSlots(hqLevel),
      createdAt: normalizeCount(plot.createdAt),
      updatedAt: normalizeCount(plot.updatedAt),
      lastSimulatedAt: normalizeCount(plot.lastSimulatedAt)
    },
    buildings: Array.isArray(raw.buildings) ? raw.buildings.map((building) => ({
      buildingId: String(building?.buildingId || ''),
      plotId: String(building?.plotId || plot.plotId || ''),
      type: BUILDING_RULES[building?.type] ? building.type : 'LUMBER_CAMP',
      level: Math.max(1, Math.floor(Number(building?.level || 1) || 1)),
      x: Math.floor(Number(building?.x || 0) || 0),
      y: Math.floor(Number(building?.y || 0) || 0),
      state: String(building?.state || 'READY'),
      outputBuffer: {
        ...emptyOutputBuffer(),
        ...(building?.outputBuffer && typeof building.outputBuffer === 'object' ? building.outputBuffer : {})
      },
      priority: String(building?.priority || 'BALANCED'),
      createdAt: normalizeCount(building?.createdAt),
      updatedAt: normalizeCount(building?.updatedAt)
    })).filter((building) => building.buildingId) : [],
    jobs: Array.isArray(raw.jobs) ? raw.jobs.map((job) => ({
      jobId: String(job?.jobId || ''),
      plotId: String(job?.plotId || plot.plotId || ''),
      buildingId: String(job?.buildingId || ''),
      kind: String(job?.kind || ''),
      input: job?.input && typeof job.input === 'object' ? job.input : {},
      output: job?.output && typeof job.output === 'object' ? job.output : {},
      startedAt: normalizeCount(job?.startedAt),
      endsAt: normalizeCount(job?.endsAt),
      status: String(job?.status || 'QUEUED'),
      createdBy: String(job?.createdBy || 'SYSTEM'),
      explanation: typeof job?.explanation === 'string' ? job.explanation : '',
      createdAt: normalizeCount(job?.createdAt),
      claimedAt: normalizeCount(job?.claimedAt)
    })).filter((job) => job.jobId) : [],
    policy: normalizePolicy(raw.policy),
    approvals: Array.isArray(raw.approvals) ? raw.approvals.map((approval) => ({
      approvalId: String(approval?.approvalId || ''),
      plotId: String(approval?.plotId || plot.plotId || ''),
      requestedBy: String(approval?.requestedBy || 'AGENT'),
      tool: String(approval?.tool || ''),
      title: String(approval?.title || ''),
      body: String(approval?.body || ''),
      status: String(approval?.status || 'PENDING'),
      payload: approval?.payload && typeof approval.payload === 'object' ? approval.payload : {},
      createdAt: normalizeCount(approval?.createdAt),
      resolvedAt: normalizeCount(approval?.resolvedAt),
      resolutionNote: typeof approval?.resolutionNote === 'string' ? approval.resolutionNote : ''
    })).filter((approval) => approval.approvalId) : [],
    meta: normalizeMeta(raw.meta)
  };
}

function normalizeLoadedState(raw) {
  return prepareLoadedState(raw).state;
}

function getHqBuilding(state) {
  return state.buildings.find((building) => building.type === 'HQ') || null;
}

function getBuilding(state, buildingId) {
  return state.buildings.find((building) => building.buildingId === buildingId) || null;
}

function activeConstructionJobs(state) {
  return state.jobs.filter((job) => job.status === 'RUNNING' && (job.kind === 'CONSTRUCT' || job.kind === 'UPGRADE'));
}

function runningJobForBuilding(state, buildingId) {
  return state.jobs.find((job) => job.buildingId === buildingId && job.status === 'RUNNING') || null;
}

function completedUnclaimedJobsForBuilding(state, buildingId) {
  return state.jobs.filter((job) => (
    job.buildingId === buildingId
    && job.status === 'COMPLETED'
    && (job.kind === 'PRODUCE' || job.kind === 'SELL')
  ));
}

function isBuildPad(x, y) {
  return BUILD_PADS.some((pad) => pad.x === x && pad.y === y);
}

function isTileOccupied(state, x, y) {
  return state.buildings.some((building) => building.x === x && building.y === y && building.type !== 'HQ');
}

function availableBuildingTypes(state) {
  const unlockLevel = state.plot.hqLevel;
  return BUILDING_TYPES.filter((type) => type !== 'HQ' && BUILDING_RULES[type].unlockLevel <= unlockLevel);
}

function unlockedPermissionKeys(hqLevel) {
  return PERMISSION_RULES.filter((rule) => hqLevel >= rule.level).map((rule) => rule.key);
}

function unlockedToolNames(state) {
  const tools = ['et.plot.get_state', 'et.plot.request_user_approval', 'et.plot.place_building', 'et.plot.upgrade_building', 'et.plot.claim_reward'];
  if (state.plot.hqLevel >= 2) tools.push('et.plot.collect_outputs');
  if (state.plot.hqLevel >= 3) tools.push('et.plot.queue_job');
  if (state.plot.hqLevel >= 4) tools.push('et.plot.set_priority');
  return tools;
}

function clampInventoryToCaps(plot) {
  plot.inventory.wood = Math.min(plot.inventory.wood, plot.storageCaps.wood);
  plot.inventory.stone = Math.min(plot.inventory.stone, plot.storageCaps.stone);
  plot.inventory.food = Math.min(plot.inventory.food, plot.storageCaps.food);
}

function spendInventory(plot, cost, code = 'OUT_OF_RESOURCES') {
  const safeCost = cost && typeof cost === 'object' ? cost : {};
  for (const [resource, amount] of Object.entries(safeCost)) {
    const need = normalizeCount(amount);
    if (need <= 0) continue;
    if (normalizeCount(plot.inventory[resource]) < need) {
      const error = new Error(code);
      error.details = { resource, need, have: normalizeCount(plot.inventory[resource]) };
      throw error;
    }
  }
  for (const [resource, amount] of Object.entries(safeCost)) {
    plot.inventory[resource] = normalizeCount(plot.inventory[resource]) - normalizeCount(amount);
  }
}

function addInventory(plot, delta) {
  const safeDelta = delta && typeof delta === 'object' ? delta : {};
  for (const [resource, amount] of Object.entries(safeDelta)) {
    const next = normalizeCount(plot.inventory[resource]) + normalizeCount(amount);
    plot.inventory[resource] = next;
  }
  clampInventoryToCaps(plot);
}

function addXp(state, amount) {
  state.plot.townXp = normalizeCount(state.plot.townXp) + normalizeCount(amount);
}

function awardOnce(list, key) {
  if (list.includes(key)) return false;
  list.push(key);
  return true;
}

function maybeAwardPlacementXp(state, type) {
  if (awardOnce(state.meta.firstPlacedTypes, type)) {
    addXp(state, XP_RULES.firstPlacement);
    return true;
  }
  return false;
}

function maybeAwardCollectionXp(state, type) {
  if (awardOnce(state.meta.firstCollectedTypes, type)) {
    addXp(state, XP_RULES.firstCollection);
    return true;
  }
  return false;
}

function maybeAwardAutomationXp(state, policyKey) {
  const tier = AUTONOMY_TIER_BY_POLICY[policyKey];
  if (!tier) return false;
  if (awardOnce(state.meta.automationAwards, tier)) {
    addXp(state, XP_RULES.automationTier);
    return true;
  }
  return false;
}

function getPendingApproval(state, approvalId) {
  return state.approvals.find((approval) => approval.approvalId === approvalId) || null;
}

function requireApprovedAction(state, approvalId, toolName) {
  const approval = getPendingApproval(state, approvalId);
  if (!approval || approval.tool !== toolName) {
    const error = new Error('FORBIDDEN_POLICY');
    error.details = { approvalRequired: true, tool: toolName };
    throw error;
  }
  if (approval.status !== 'APPROVED') {
    const error = new Error('FORBIDDEN_POLICY');
    error.details = { approvalRequired: true, tool: toolName, approvalId, status: approval.status };
    throw error;
  }
  return approval;
}

function ensureAgentActionBudget(state, nowMs) {
  const bucket = nowBucketHour(nowMs);
  if (state.policy.autonomyBucket !== bucket) {
    state.policy.autonomyBucket = bucket;
    state.policy.autonomyUsed = 0;
  }
  const used = normalizeCount(state.policy.autonomyUsed);
  if (used >= state.policy.maxAutonomousActionsPerHour) {
    const error = new Error('RATE_LIMITED');
    error.details = {
      bucket,
      used,
      maxAutonomousActionsPerHour: state.policy.maxAutonomousActionsPerHour
    };
    throw error;
  }
  state.policy.autonomyUsed = used + 1;
}

function ensureAgentPermission(state, permissionKey, minimumLevel) {
  if (state.plot.hqLevel < minimumLevel) {
    const error = new Error('FORBIDDEN_POLICY');
    error.details = { permission: permissionKey, unlockLevel: minimumLevel, currentLevel: state.plot.hqLevel };
    throw error;
  }
  if (state.policy.emergencyPause) {
    const error = new Error('FORBIDDEN_POLICY');
    error.details = { permission: permissionKey, paused: true };
    throw error;
  }
  if (permissionKey && state.policy[permissionKey] !== true) {
    const error = new Error('FORBIDDEN_POLICY');
    error.details = { permission: permissionKey, enabled: false, retryAfterApproval: true };
    throw error;
  }
}

function jobSnapshot(job) {
  return {
    jobId: job.jobId,
    buildingId: job.buildingId,
    kind: job.kind,
    status: job.status,
    startedAt: job.startedAt,
    endsAt: job.endsAt,
    createdBy: job.createdBy,
    input: copyJson(job.input),
    output: copyJson(job.output),
    explanation: job.explanation || ''
  };
}

function buildingSnapshot(building) {
  return {
    buildingId: building.buildingId,
    type: building.type,
    level: building.level,
    x: building.x,
    y: building.y,
    state: building.state,
    priority: building.priority,
    outputBuffer: copyJson(building.outputBuffer || emptyOutputBuffer())
  };
}

function approvalSnapshot(approval) {
  return {
    approvalId: approval.approvalId,
    plotId: approval.plotId,
    requestedBy: approval.requestedBy,
    tool: approval.tool,
    title: approval.title,
    body: approval.body,
    status: approval.status,
    payload: copyJson(approval.payload || {}),
    createdAt: approval.createdAt,
    resolvedAt: approval.resolvedAt,
    resolutionNote: approval.resolutionNote || ''
  };
}

function plotSnapshot(state) {
  return {
    plotId: state.plot.plotId,
    pairId: state.plot.pairId,
    houseId: state.plot.houseId || null,
    hqLevel: state.plot.hqLevel,
    townXp: state.plot.townXp,
    inventory: copyJson(state.plot.inventory),
    storageCaps: copyJson(state.plot.storageCaps),
    constructionSlots: state.plot.constructionSlots,
    workshopBuffCharges: state.meta.workshopBuffCharges,
    pendingRewards: state.meta.pendingRewards.map((reward) => ({
      key: reward.key,
      type: reward.type,
      title: reward.title,
      grant: reward.grant
    }))
  };
}

function pushPendingReward(state, reward) {
  if (!reward || !reward.key) return;
  const existing = state.meta.pendingRewards.find((entry) => entry.key === reward.key);
  if (existing) return;
  state.meta.pendingRewards.push({
    key: reward.key,
    type: reward.type || 'GENERIC',
    title: reward.title || 'Reward ready',
    body: reward.body || '',
    grant: reward.grant && typeof reward.grant === 'object' ? reward.grant : {},
    createdAt: reward.createdAt || Date.now()
  });
}

function ensureDailyReward(state, nowMs) {
  const currentDay = utcDay(nowMs);
  if (!state.meta.dailyReturnDay) {
    state.meta.dailyReturnDay = currentDay;
    return;
  }
  if (state.meta.dailyReturnDay === currentDay) return;
  state.meta.dailyReturnDay = currentDay;
  pushPendingReward(state, {
    key: `daily_return:${currentDay}`,
    type: 'DAILY_RETURN',
    title: 'Daily return bonus',
    body: 'Claim your +5 town XP for returning to the plot.',
    grant: { town_xp: XP_RULES.dailyReturn },
    createdAt: nowMs
  });
}

function pushHqReward(state, level, nowMs) {
  pushPendingReward(state, {
    key: `hq_level:${level}`,
    type: 'HQ_LEVEL',
    title: `Headquarters level ${level} reward`,
    body: 'Claim a small founders stipend for expanding the settlement.',
    grant: { coin: 5 },
    createdAt: nowMs
  });
}

function firstCollectionQuest(state, {
  type,
  step,
  title,
  queuedBody,
  runningBody,
  collectingBody
}) {
  const building = state.buildings.find((entry) => entry.type === type) || null;
  if (!building || state.meta.firstCollectedTypes.includes(type)) return null;
  const runningJob = runningJobForBuilding(state, building.buildingId);
  const completedJobs = completedUnclaimedJobsForBuilding(state, building.buildingId);
  if (completedJobs.length > 0 || building.state === 'OUTPUT_READY') {
    return {
      step,
      title,
      body: collectingBody,
      primaryAction: { type: 'COLLECT_OUTPUTS', buildingId: building.buildingId }
    };
  }
  if (building.state === 'READY' && !runningJob) {
    return {
      step,
      title,
      body: queuedBody,
      primaryAction: { type: 'QUEUE_JOB', buildingId: building.buildingId }
    };
  }
  return {
    step,
    title,
    body: runningBody,
    primaryAction: null
  };
}

function nextQuest(state) {
  const hasType = (type) => state.buildings.some((building) => building.type === type);
  if (!hasType('LUMBER_CAMP')) {
    return {
      step: 'place_lumber_camp',
      title: 'Raise your first work camp',
      body: 'Place a Lumber Camp on an open pad so the town can produce its first wood.',
      primaryAction: { type: 'PLACE_BUILDING', buildingType: 'LUMBER_CAMP' }
    };
  }
  const firstWoodQuest = firstCollectionQuest(state, {
    type: 'LUMBER_CAMP',
    step: 'collect_first_wood',
    title: 'Collect your first wood',
    queuedBody: 'Queue the first Lumber Camp job, then collect the output before upgrading Headquarters.',
    runningBody: 'The first lumber run is underway. Wait for it to finish, then collect the output before upgrading Headquarters.',
    collectingBody: 'Bring in the first finished haul before pushing Headquarters to level 2.'
  });
  if (firstWoodQuest) {
    return firstWoodQuest;
  }
  if (state.plot.hqLevel < 2) {
    return {
      step: 'upgrade_hq_2',
      title: 'Open Headquarters level 2',
      body: 'Spend wood to unlock your first farm and the foreman collect permission tier.',
      primaryAction: { type: 'UPGRADE_HQ' }
    };
  }
  if (!hasType('FARM_PLOT')) {
    if (state.policy.collectOutputs !== true) {
      return {
        step: 'grant_collect_permission',
        title: 'Teach the foreman to collect',
        body: 'Enable the collect permission before opening the Farm Plot so the first automation tier is explicit and visible.',
        primaryAction: { type: 'ENABLE_PERMISSION', permission: 'collectOutputs' }
      };
    }
    return {
      step: 'place_farm_plot',
      title: 'Plant the first farm',
      body: 'A Farm Plot keeps the settlement fed and opens the next upgrade path.',
      primaryAction: { type: 'PLACE_BUILDING', buildingType: 'FARM_PLOT' }
    };
  }
  const firstFoodQuest = firstCollectionQuest(state, {
    type: 'FARM_PLOT',
    step: 'collect_first_food',
    title: 'Collect your first food',
    queuedBody: 'Queue the first Farm Plot job so the town can bank food before reaching Headquarters level 3.',
    runningBody: 'The first harvest is underway. Collect that food before pushing Headquarters to level 3.',
    collectingBody: 'Collect the first food haul before opening Headquarters level 3.'
  });
  if (firstFoodQuest) {
    return firstFoodQuest;
  }
  if (state.plot.hqLevel < 3) {
    return {
      step: 'upgrade_hq_3',
      title: 'Reach Headquarters level 3',
      body: 'Spend wood and food to unlock the Quarry, the next agent tier, and a second construction slot.',
      primaryAction: { type: 'UPGRADE_HQ' }
    };
  }
  if (state.policy.queueProduction !== true) {
    return {
      step: 'grant_queue_permission',
      title: 'Teach the foreman to queue work',
      body: 'Enable queue permission now that the plot can sustain multiple producers.',
      primaryAction: { type: 'ENABLE_PERMISSION', permission: 'queueProduction' }
    };
  }
  if (!hasType('QUARRY')) {
    return {
      step: 'place_quarry',
      title: 'Open the first quarry',
      body: 'Stone is needed for sturdier upgrades and later civic work.',
      primaryAction: { type: 'PLACE_BUILDING', buildingType: 'QUARRY' }
    };
  }
  const firstStoneQuest = firstCollectionQuest(state, {
    type: 'QUARRY',
    step: 'collect_first_stone',
    title: 'Collect your first stone',
    queuedBody: 'Queue the first quarry job before moving on to Headquarters level 4.',
    runningBody: 'The first quarry batch is underway. Collect that stone before moving to Headquarters level 4.',
    collectingBody: 'Collect the first stone haul before opening Headquarters level 4.'
  });
  if (firstStoneQuest) {
    return firstStoneQuest;
  }
  if (state.plot.hqLevel < 4) {
    return {
      step: 'upgrade_hq_4',
      title: 'Reach Headquarters level 4',
      body: 'This expands your storage and opens the Workshop for construction buffs.',
      primaryAction: { type: 'UPGRADE_HQ' }
    };
  }
  if (state.policy.setPriority !== true) {
    return {
      step: 'grant_priority_permission',
      title: 'Teach the foreman one priority',
      body: 'Enable one priority control now that the plot has multiple live resource lanes.',
      primaryAction: { type: 'ENABLE_PERMISSION', permission: 'setPriority' }
    };
  }
  if (!hasType('WORKSHOP')) {
    return {
      step: 'place_workshop',
      title: 'Raise a Workshop',
      body: 'The Workshop turns wood and stone into faster construction on the next job.',
      primaryAction: { type: 'PLACE_BUILDING', buildingType: 'WORKSHOP' }
    };
  }
  if (state.plot.hqLevel < 5) {
    return {
      step: 'upgrade_hq_5',
      title: 'Reach Headquarters level 5',
      body: 'Open the Market Stall and the final Phase 1 foreman permission tier.',
      primaryAction: { type: 'UPGRADE_HQ' }
    };
  }
  if (!hasType('MARKET_STALL')) {
    return {
      step: 'place_market_stall',
      title: 'Open the Market Stall',
      body: 'Turn extra food into coin and finish the full Founders Plot loop.',
      primaryAction: { type: 'PLACE_BUILDING', buildingType: 'MARKET_STALL' }
    };
  }
  if (state.policy.sellSurplusFood !== true) {
    return {
      step: 'grant_sell_permission',
      title: 'Teach the foreman to sell surplus food',
      body: 'Enable the final Phase 1 permission once the Market Stall is on the plot.',
      primaryAction: { type: 'ENABLE_PERMISSION', permission: 'sellSurplusFood' }
    };
  }
  return {
    step: 'optimize_founders_plot',
    title: 'Tune the settlement',
    body: 'Balance wood, stone, and food while using the foreman permissions you trust.',
    primaryAction: { type: 'QUEUE_BEST_JOB' }
  };
}

function recommendationText(state) {
  const quest = nextQuest(state);
  if (quest.step === 'place_lumber_camp') {
    return 'Set a Lumber Camp first. Wood unlocks the entire rest of the plot.';
  }
  if (quest.step === 'collect_first_wood' || quest.step === 'collect_first_food' || quest.step === 'collect_first_stone') {
    const type = quest.step === 'collect_first_food'
      ? 'FARM_PLOT'
      : quest.step === 'collect_first_stone'
        ? 'QUARRY'
        : 'LUMBER_CAMP';
    const label = BUILDING_RULES[type]?.label || type;
    const building = state.buildings.find((entry) => entry.type === type) || null;
    const runningJob = building ? runningJobForBuilding(state, building.buildingId) : null;
    const completedJobs = building ? completedUnclaimedJobsForBuilding(state, building.buildingId) : [];
    if (completedJobs.length > 0 || building?.state === 'OUTPUT_READY') {
      return `Your first ${label.toLowerCase()} haul is ready. Collect it before moving to the next Headquarters milestone.`;
    }
    if (building?.state === 'READY' && !runningJob) {
      return `Queue one ${label} job, then collect that first haul before moving to the next Headquarters milestone.`;
    }
    if (runningJob) {
      return `The first ${label.toLowerCase()} run is underway. Collect it as soon as it finishes.`;
    }
    return `Let the ${label} finish construction. The first haul still comes before the next Headquarters milestone.`;
  }
  if (quest.step === 'grant_collect_permission') {
    return 'Collect permission is the first trust milestone. Enable it before expanding into food.';
  }
  if (quest.step === 'grant_queue_permission') {
    return 'Queue permission matters once multiple producers exist. Enable it before adding more parallel work.';
  }
  if (quest.step === 'grant_priority_permission') {
    return 'Priority control becomes useful now that the plot has real tradeoffs between wood, food, and stone.';
  }
  if (quest.step === 'grant_sell_permission') {
    return 'Sell permission is the final automation tier. Only enable it once you trust the Market Stall loop.';
  }
  if (state.policy.emergencyPause) {
    return 'The foreman is paused. Lift the emergency pause before asking for autonomous work.';
  }
  const outputReady = state.buildings.find((building) => building.state === 'OUTPUT_READY' && ['LUMBER_CAMP', 'FARM_PLOT', 'QUARRY', 'MARKET_STALL'].includes(building.type));
  if (outputReady) {
    return `Collect from the ${BUILDING_RULES[outputReady.type].label} before queuing more work.`;
  }
  const running = state.jobs.filter((job) => job.status === 'RUNNING').sort((a, b) => a.endsAt - b.endsAt)[0];
  if (running) {
    const building = getBuilding(state, running.buildingId);
    return `${BUILDING_RULES[building?.type || 'LUMBER_CAMP']?.label || 'A building'} will finish soon. Let the queue breathe until it is ready.`;
  }
  if (quest.step.startsWith('upgrade_hq')) {
    return 'Your next permanent unlock is an HQ upgrade. Spend toward that before sidegrades.';
  }
  return 'Keep one resource producer active at all times and use the Workshop buff before expensive builds.';
}

function buildPadsView(state) {
  return BUILD_PADS.map((pad) => {
    const building = state.buildings.find((entry) => entry.x === pad.x && entry.y === pad.y) || null;
    return {
      ...pad,
      occupied: !!building,
      building: building ? buildingSnapshot(building) : null
    };
  });
}

function progressToNextHq(state) {
  const rule = HQ_UPGRADE_RULES[state.plot.hqLevel];
  if (!rule) return null;
  return {
    level: rule.nextLevel,
    xpRequired: rule.xpRequired,
    xpCurrent: state.plot.townXp,
    ratio: Math.max(0, Math.min(1, state.plot.townXp / Math.max(1, rule.xpRequired))),
    cost: copyJson(rule.cost)
  };
}

function pendingApprovalsView(state) {
  return state.approvals
    .filter((approval) => approval.status === 'PENDING')
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((approval) => ({
      approvalId: approval.approvalId,
      tool: approval.tool,
      title: approval.title,
      body: approval.body,
      createdAt: approval.createdAt,
      payload: copyJson(approval.payload)
    }));
}

function recentEventsView(events) {
  return events
    .slice(-10)
    .map((event) => ({
      seq: event.seq,
      type: event.type,
      createdAt: event.createdAt,
      actor: event.actor,
      explanation: event.explanation || '',
      recapLine: event.recapLine || ''
    }))
    .reverse();
}

function stateHashPayload(state) {
  return {
    plot: plotSnapshot(state),
    buildings: state.buildings.map((building) => buildingSnapshot(building)),
    jobs: state.jobs.map((job) => jobSnapshot(job)),
    approvals: state.approvals
      .map((approval) => approvalSnapshot(approval))
      .sort((a, b) => {
        if (a.createdAt !== b.createdAt) return a.createdAt - b.createdAt;
        return String(a.approvalId || '').localeCompare(String(b.approvalId || ''));
      }),
    policy: {
      observeAndSuggest: state.policy.observeAndSuggest,
      collectOutputs: state.policy.collectOutputs,
      queueProduction: state.policy.queueProduction,
      setPriority: state.policy.setPriority,
      sellSurplusFood: state.policy.sellSurplusFood,
      sellDailyCoinCap: state.policy.sellDailyCoinCap,
      maxAutonomousActionsPerHour: state.policy.maxAutonomousActionsPerHour,
      emergencyPause: state.policy.emergencyPause
    },
    meta: {
      schemaVersion: state.meta.schemaVersion,
      workshopBuffCharges: state.meta.workshopBuffCharges,
      pendingRewards: state.meta.pendingRewards.map((reward) => ({ key: reward.key, type: reward.type, grant: reward.grant })),
      claimedRewards: state.meta.claimedRewards,
      firstPlacedTypes: state.meta.firstPlacedTypes,
      firstCollectedTypes: state.meta.firstCollectedTypes,
      automationAwards: state.meta.automationAwards
    }
  };
}

function stateView(state, recentEvents = []) {
  return {
    plot: plotSnapshot(state),
    policy: {
      observeAndSuggest: state.policy.observeAndSuggest,
      collectOutputs: state.policy.collectOutputs,
      queueProduction: state.policy.queueProduction,
      setPriority: state.policy.setPriority,
      sellSurplusFood: state.policy.sellSurplusFood,
      sellDailyCoinCap: state.policy.sellDailyCoinCap,
      maxAutonomousActionsPerHour: state.policy.maxAutonomousActionsPerHour,
      emergencyPause: state.policy.emergencyPause
    },
    unlocks: {
      buildingTypes: availableBuildingTypes(state),
      permissions: unlockedPermissionKeys(state.plot.hqLevel)
    },
    quest: nextQuest(state),
    foreman: {
      recommendation: recommendationText(state),
      allowedTools: unlockedToolNames(state),
      pendingApprovals: pendingApprovalsView(state)
    },
    pads: buildPadsView(state),
    buildings: state.buildings.map((building) => ({
      ...buildingSnapshot(building),
      label: BUILDING_RULES[building.type]?.label || building.type,
      runningJob: runningJobForBuilding(state, building.buildingId)
        ? jobSnapshot(runningJobForBuilding(state, building.buildingId))
        : null,
      completedJobs: completedUnclaimedJobsForBuilding(state, building.buildingId).map((job) => jobSnapshot(job))
    })),
    jobs: state.jobs
      .filter((job) => job.status !== 'CLAIMED' && job.status !== 'CANCELLED')
      .sort((a, b) => a.endsAt - b.endsAt)
      .map((job) => jobSnapshot(job)),
    rewards: state.meta.pendingRewards.map((reward) => ({
      key: reward.key,
      type: reward.type,
      title: reward.title,
      body: reward.body,
      grant: copyJson(reward.grant)
    })),
    recap: {
      unseenCount: Math.max(0, recentEvents.filter((event) => event.seq > state.meta.recapSeenSeq).length),
      recent: recentEventsView(recentEvents)
    },
    progress: {
      currentLevel: state.plot.hqLevel,
      next: progressToNextHq(state)
    },
    compatibility: {
      schemaVersion: state.meta.schemaVersion
    },
    stateHash: stateHash(stateHashPayload(state))
  };
}

function buildWorldDelta(state, changed = []) {
  return {
    plotId: state.plot.plotId,
    updatedAt: state.plot.updatedAt,
    hqLevel: state.plot.hqLevel,
    inventory: copyJson(state.plot.inventory),
    changed
  };
}

function productionRuleForBuilding(building) {
  const buildingRule = BUILDING_RULES[building.type];
  if (!buildingRule || !buildingRule.production) return null;
  return buildingRule.production[building.level] || null;
}

function upgradeRuleForBuilding(building) {
  const buildingRule = BUILDING_RULES[building.type];
  if (!buildingRule || !buildingRule.upgrade) return null;
  return buildingRule.upgrade[building.level] || null;
}

function explainActor(actor, agentText, humanText) {
  return actor === 'AGENT' ? agentText : humanText;
}

function pushEvent(appendEvent, { type, actor, explanation, recapLine, data }) {
  if (typeof appendEvent === 'function') {
    appendEvent({ type, actor, explanation, recapLine, data });
  }
}

function completeRunningJob(state, job, nowMs, appendEvent) {
  const building = getBuilding(state, job.buildingId);
  if (!building) {
    job.status = 'FAILED';
    return;
  }

  job.status = 'COMPLETED';
  building.updatedAt = nowMs;

  if (job.kind === 'CONSTRUCT') {
    building.state = 'READY';
    pushEvent(appendEvent, {
      type: EVENT_TYPES.BUILDING_COMPLETED,
      actor: job.createdBy,
      explanation: `${BUILDING_RULES[building.type].label} finished construction.`,
      recapLine: `${BUILDING_RULES[building.type].label} opened on the plot.`,
      data: {
        building: buildingSnapshot(building),
        job: jobSnapshot(job),
        plot: plotSnapshot(state)
      }
    });
    return;
  }

  if (job.kind === 'UPGRADE') {
    if (building.type === 'HQ') {
      state.plot.hqLevel = Math.min(5, state.plot.hqLevel + 1);
      building.level = state.plot.hqLevel;
      state.plot.storageCaps = getStorageCaps(state.plot.hqLevel);
      state.plot.constructionSlots = getConstructionSlots(state.plot.hqLevel);
      addXp(state, XP_RULES.hqUpgrade);
      pushHqReward(state, state.plot.hqLevel, nowMs);
      building.state = 'READY';
      pushEvent(appendEvent, {
        type: EVENT_TYPES.HQ_UPGRADED,
        actor: job.createdBy,
        explanation: `Headquarters reached level ${state.plot.hqLevel}.`,
        recapLine: `Headquarters advanced to level ${state.plot.hqLevel}.`,
        data: {
          plot: plotSnapshot(state),
          building: buildingSnapshot(building),
          job: jobSnapshot(job)
        }
      });
    } else {
      building.level = Math.min(BUILDING_RULES[building.type].maxLevel, building.level + 1);
      building.state = 'READY';
      pushEvent(appendEvent, {
        type: EVENT_TYPES.BUILDING_COMPLETED,
        actor: job.createdBy,
        explanation: `${BUILDING_RULES[building.type].label} reached level ${building.level}.`,
        recapLine: `${BUILDING_RULES[building.type].label} upgraded to level ${building.level}.`,
        data: {
          plot: plotSnapshot(state),
          building: buildingSnapshot(building),
          job: jobSnapshot(job)
        }
      });
    }
    return;
  }

  const output = copyJson(job.output || {});
  if (output.workshop_buff) {
    state.meta.workshopBuffCharges = normalizeCount(state.meta.workshopBuffCharges) + normalizeCount(output.workshop_buff);
  }
  if (output.wood || output.stone || output.food || output.coin) {
    building.outputBuffer.wood = normalizeCount(building.outputBuffer.wood) + normalizeCount(output.wood);
    building.outputBuffer.stone = normalizeCount(building.outputBuffer.stone) + normalizeCount(output.stone);
    building.outputBuffer.food = normalizeCount(building.outputBuffer.food) + normalizeCount(output.food);
    building.outputBuffer.coin = normalizeCount(building.outputBuffer.coin) + normalizeCount(output.coin);
  }
  building.state = 'OUTPUT_READY';
  pushEvent(appendEvent, {
    type: EVENT_TYPES.JOB_COMPLETED,
    actor: job.createdBy,
    explanation: job.explanation || `${BUILDING_RULES[building.type].label} finished ${job.kind.toLowerCase()}.`,
    recapLine: job.kind === 'SELL'
      ? `${BUILDING_RULES[building.type].label} finished a food sale.`
      : `${BUILDING_RULES[building.type].label} finished production.`,
    data: {
      plot: plotSnapshot(state),
      building: buildingSnapshot(building),
      job: jobSnapshot(job)
    }
  });
}

function simulatePlot(state, toMs, appendEvent) {
  const safeTargetMs = Math.max(state.plot.lastSimulatedAt, Math.min(toMs, state.plot.lastSimulatedAt + MAX_OFFLINE_MS));
  if (safeTargetMs <= state.plot.lastSimulatedAt) {
    ensureDailyReward(state, safeTargetMs);
    return { simulatedToMs: state.plot.lastSimulatedAt, clamped: false };
  }

  const clamped = safeTargetMs !== toMs;
  let cursor = state.plot.lastSimulatedAt;
  while (cursor < safeTargetMs) {
    const nextTick = Math.min(safeTargetMs, cursor + SIMULATION_TICK_MS);
    const completions = state.jobs.filter((job) => job.status === 'RUNNING' && job.endsAt <= nextTick);
    completions.sort((a, b) => a.endsAt - b.endsAt);
    for (const job of completions) {
      completeRunningJob(state, job, job.endsAt || nextTick, appendEvent);
    }
    cursor = nextTick;
  }

  state.plot.lastSimulatedAt = safeTargetMs;
  state.plot.updatedAt = safeTargetMs;
  ensureDailyReward(state, safeTargetMs);
  return { simulatedToMs: safeTargetMs, clamped };
}

function startJob(state, { building, kind, createdBy, explanation, input, output, durationMs, nowMs }) {
  const startsAt = nowMs;
  const endsAt = nowMs + Math.max(1, durationMs);
  const job = {
    jobId: randomId('job'),
    plotId: state.plot.plotId,
    buildingId: building.buildingId,
    kind,
    input: copyJson(input || {}),
    output: copyJson(output || {}),
    startedAt: startsAt,
    endsAt,
    status: 'RUNNING',
    createdBy,
    explanation: explanation || '',
    createdAt: nowMs,
    claimedAt: 0
  };
  state.jobs.push(job);
  building.state = kind === 'PRODUCE' || kind === 'SELL' ? 'PRODUCING' : (kind === 'CONSTRUCT' ? 'UNDER_CONSTRUCTION' : 'UPGRADING');
  building.updatedAt = nowMs;
  state.plot.updatedAt = nowMs;
  return job;
}

function maybeConsumeWorkshopBuff(state, kind, durationMs) {
  if (kind !== 'CONSTRUCT' && kind !== 'UPGRADE') return durationMs;
  if (state.meta.workshopBuffCharges <= 0) return durationMs;
  state.meta.workshopBuffCharges -= 1;
  return Math.max(30 * 1000, Math.round(durationMs * 0.8));
}

function applyPlaceBuilding(state, { actor = 'HUMAN', type, x, y, approvalId = null }, ctx) {
  if (!BUILDING_RULES[type] || type === 'HQ') {
    const error = new Error('INVALID_STATE');
    error.details = { type };
    throw error;
  }
  if (state.plot.hqLevel < BUILDING_RULES[type].unlockLevel) {
    const error = new Error('FORBIDDEN_POLICY');
    error.details = { type, unlockLevel: BUILDING_RULES[type].unlockLevel, currentLevel: state.plot.hqLevel };
    throw error;
  }
  if (!isBuildPad(x, y)) {
    const error = new Error('OUT_OF_BOUNDS');
    error.details = { x, y };
    throw error;
  }
  if (isTileOccupied(state, x, y)) {
    const error = new Error('BUILD_SLOT_OCCUPIED');
    error.details = { x, y };
    throw error;
  }
  if (activeConstructionJobs(state).length >= state.plot.constructionSlots) {
    const error = new Error('INVALID_STATE');
    error.details = { reason: 'CONSTRUCTION_SLOT_BUSY', constructionSlots: state.plot.constructionSlots };
    throw error;
  }
  if (actor === 'AGENT') {
    ensureAgentActionBudget(state, ctx.nowMs);
    requireApprovedAction(state, approvalId, 'et.plot.place_building');
  }

  spendInventory(state.plot, BUILDING_RULES[type].buildCost || {});
  const building = {
    buildingId: randomId('bld'),
    plotId: state.plot.plotId,
    type,
    level: 1,
    x,
    y,
    state: 'EMPTY',
    outputBuffer: emptyOutputBuffer(),
    priority: 'BALANCED',
    createdAt: ctx.nowMs,
    updatedAt: ctx.nowMs
  };
  state.buildings.push(building);
  maybeAwardPlacementXp(state, type);
  const job = startJob(state, {
    building,
    kind: 'CONSTRUCT',
    createdBy: actor,
    explanation: explainActor(
      actor,
      `Foreman started ${BUILDING_RULES[type].label} construction after approval.`,
      `${BUILDING_RULES[type].label} construction started.`
    ),
    input: BUILDING_RULES[type].buildCost || {},
    output: {},
    durationMs: maybeConsumeWorkshopBuff(state, 'CONSTRUCT', BUILDING_RULES[type].buildDurationMs),
    nowMs: ctx.nowMs
  });
  pushEvent(ctx.appendEvent, {
    type: EVENT_TYPES.BUILDING_PLACED,
    actor,
    explanation: explainActor(actor, `Foreman placed ${BUILDING_RULES[type].label}.`, `${BUILDING_RULES[type].label} placed on the plot.`),
    recapLine: `${BUILDING_RULES[type].label} was placed on the plot.`,
    data: {
      plot: plotSnapshot(state),
      building: buildingSnapshot(building)
    }
  });
  pushEvent(ctx.appendEvent, {
    type: EVENT_TYPES.BUILDING_STARTED,
    actor,
    explanation: job.explanation,
    recapLine: `${BUILDING_RULES[type].label} began construction.`,
    data: {
      plot: plotSnapshot(state),
      building: buildingSnapshot(building),
      job: jobSnapshot(job)
    }
  });
  if (actor === 'AGENT') {
    pushEvent(ctx.appendEvent, {
      type: EVENT_TYPES.AGENT_ACTION_EXECUTED,
      actor,
      explanation: `Foreman placed ${BUILDING_RULES[type].label} on approved pad ${x},${y}.`,
      recapLine: `Foreman placed ${BUILDING_RULES[type].label} with approval.`,
      data: {
        tool: 'et.plot.place_building',
        plot: plotSnapshot(state),
        building: buildingSnapshot(building)
      }
    });
  }
  return {
    buildingId: building.buildingId,
    jobId: job.jobId
  };
}

function applyQueueJob(state, { actor = 'HUMAN', buildingId }, ctx) {
  const building = getBuilding(state, buildingId);
  if (!building) {
    const error = new Error('INVALID_STATE');
    error.details = { buildingId };
    throw error;
  }
  if (building.state === 'UNDER_CONSTRUCTION' || building.state === 'UPGRADING') {
    const error = new Error('INVALID_STATE');
    error.details = { buildingId, state: building.state };
    throw error;
  }
  if (runningJobForBuilding(state, buildingId)) {
    const error = new Error('JOB_ALREADY_RUNNING');
    error.details = { buildingId };
    throw error;
  }
  if (actor === 'AGENT') {
    ensureAgentPermission(state, 'queueProduction', 3);
    ensureAgentActionBudget(state, ctx.nowMs);
  }
  const production = productionRuleForBuilding(building);
  if (!production) {
    const error = new Error('INVALID_STATE');
    error.details = { buildingId, reason: 'NO_PRODUCTION_RULE' };
    throw error;
  }

  if (production.kind === 'SELL') {
    if (actor === 'AGENT') {
      ensureAgentPermission(state, 'sellSurplusFood', 5);
      const currentDay = utcDay(ctx.nowMs);
      if (state.policy.sellDailyCoinDay !== currentDay) {
        state.policy.sellDailyCoinDay = currentDay;
        state.policy.sellDailyCoinSold = 0;
      }
      const wouldSell = normalizeCount(state.policy.sellDailyCoinSold) + normalizeCount(production.output.coin);
      if (wouldSell > state.policy.sellDailyCoinCap) {
        const error = new Error('FORBIDDEN_POLICY');
        error.details = { sellDailyCoinCap: state.policy.sellDailyCoinCap, attempted: wouldSell };
        throw error;
      }
      state.policy.sellDailyCoinSold = wouldSell;
    }
  }

  spendInventory(state.plot, production.input || {});
  const explanation = actor === 'AGENT'
    ? building.type === 'MARKET_STALL'
      ? 'Foreman sold surplus food because the market permission is enabled.'
      : `Foreman queued work at ${BUILDING_RULES[building.type].label}.`
    : `${BUILDING_RULES[building.type].label} job queued.`;
  const job = startJob(state, {
    building,
    kind: production.kind,
    createdBy: actor,
    explanation,
    input: production.input || {},
    output: production.output || {},
    durationMs: production.durationMs,
    nowMs: ctx.nowMs
  });
  pushEvent(ctx.appendEvent, {
    type: EVENT_TYPES.JOB_QUEUED,
    actor,
    explanation,
    recapLine: building.type === 'MARKET_STALL'
      ? 'A market sale was queued.'
      : `${BUILDING_RULES[building.type].label} queued a new job.`,
    data: {
      plot: plotSnapshot(state),
      building: buildingSnapshot(building),
      job: jobSnapshot(job)
    }
  });
  if (actor === 'AGENT') {
    pushEvent(ctx.appendEvent, {
      type: EVENT_TYPES.AGENT_ACTION_EXECUTED,
      actor,
      explanation,
      recapLine: building.type === 'MARKET_STALL'
        ? 'Foreman queued a market sale.'
        : `Foreman queued work at ${BUILDING_RULES[building.type].label}.`,
      data: {
        tool: 'et.plot.queue_job',
        plot: plotSnapshot(state),
        building: buildingSnapshot(building),
        job: jobSnapshot(job)
      }
    });
  }
  return {
    jobId: job.jobId,
    buildingId: building.buildingId
  };
}

function applyCollectOutputs(state, { actor = 'HUMAN', buildingId }, ctx) {
  const building = getBuilding(state, buildingId);
  if (!building) {
    const error = new Error('INVALID_STATE');
    error.details = { buildingId };
    throw error;
  }
  if (actor === 'AGENT') {
    ensureAgentPermission(state, 'collectOutputs', 2);
    ensureAgentActionBudget(state, ctx.nowMs);
  }
  const delta = {
    wood: normalizeCount(building.outputBuffer.wood),
    stone: normalizeCount(building.outputBuffer.stone),
    food: normalizeCount(building.outputBuffer.food),
    coin: normalizeCount(building.outputBuffer.coin)
  };
  if (!delta.wood && !delta.stone && !delta.food && !delta.coin) {
    const error = new Error('INVALID_STATE');
    error.details = { buildingId, reason: 'NO_OUTPUT_READY' };
    throw error;
  }
  addInventory(state.plot, delta);
  building.outputBuffer = emptyOutputBuffer();
  building.state = 'READY';
  building.updatedAt = ctx.nowMs;
  const relatedJobs = completedUnclaimedJobsForBuilding(state, buildingId);
  for (const job of relatedJobs) {
    job.status = 'CLAIMED';
    job.claimedAt = ctx.nowMs;
  }
  maybeAwardCollectionXp(state, building.type);
  const explanation = actor === 'AGENT'
    ? `Foreman collected finished goods from ${BUILDING_RULES[building.type].label}.`
    : `Collected outputs from ${BUILDING_RULES[building.type].label}.`;
  pushEvent(ctx.appendEvent, {
    type: EVENT_TYPES.OUTPUT_COLLECTED,
    actor,
    explanation,
    recapLine: actor === 'AGENT'
      ? `Foreman collected ${BUILDING_RULES[building.type].label} outputs because permission was enabled.`
      : `${BUILDING_RULES[building.type].label} outputs were collected.`,
    data: {
      plot: plotSnapshot(state),
      building: buildingSnapshot(building),
      output: copyJson(delta)
    }
  });
  if (actor === 'AGENT') {
    pushEvent(ctx.appendEvent, {
      type: EVENT_TYPES.AGENT_ACTION_EXECUTED,
      actor,
      explanation,
      recapLine: `Foreman collected outputs from ${BUILDING_RULES[building.type].label}.`,
      data: {
        tool: 'et.plot.collect_outputs',
        plot: plotSnapshot(state),
        building: buildingSnapshot(building),
        output: copyJson(delta)
      }
    });
  }
  return {
    buildingId,
    collected: delta
  };
}

function applyUpgradeBuilding(state, { actor = 'HUMAN', buildingId = null, approvalId = null }, ctx) {
  const hq = getHqBuilding(state);
  const target = buildingId ? getBuilding(state, buildingId) : hq;
  if (!target) {
    const error = new Error('INVALID_STATE');
    error.details = { buildingId };
    throw error;
  }
  if (activeConstructionJobs(state).length >= state.plot.constructionSlots) {
    const error = new Error('INVALID_STATE');
    error.details = { reason: 'CONSTRUCTION_SLOT_BUSY' };
    throw error;
  }
  if (runningJobForBuilding(state, target.buildingId)) {
    const error = new Error('JOB_ALREADY_RUNNING');
    error.details = { buildingId: target.buildingId };
    throw error;
  }

  let cost;
  let durationMs;
  let nextLabel;
  if (target.type === 'HQ') {
    const rule = HQ_UPGRADE_RULES[state.plot.hqLevel];
    if (!rule) {
      const error = new Error('INVALID_STATE');
      error.details = { reason: 'HQ_MAX_LEVEL' };
      throw error;
    }
    if (state.plot.townXp < rule.xpRequired) {
      const error = new Error('OUT_OF_RESOURCES');
      error.details = { resource: 'town_xp', need: rule.xpRequired, have: state.plot.townXp };
      throw error;
    }
    if (actor === 'AGENT') {
      requireApprovedAction(state, approvalId, 'et.plot.upgrade_building');
      ensureAgentActionBudget(state, ctx.nowMs);
    }
    cost = rule.cost;
    durationMs = rule.durationMs;
    nextLabel = `HQ ${state.plot.hqLevel} -> ${rule.nextLevel}`;
  } else {
    const rule = upgradeRuleForBuilding(target);
    if (!rule) {
      const error = new Error('INVALID_STATE');
      error.details = { reason: 'BUILDING_MAX_LEVEL', buildingId: target.buildingId };
      throw error;
    }
    if (actor === 'AGENT') {
      requireApprovedAction(state, approvalId, 'et.plot.upgrade_building');
      ensureAgentActionBudget(state, ctx.nowMs);
    }
    cost = rule.cost;
    durationMs = rule.durationMs;
    nextLabel = `${BUILDING_RULES[target.type].label} -> level ${rule.toLevel}`;
  }

  spendInventory(state.plot, cost || {});
  const explanation = actor === 'AGENT'
    ? `Foreman started the approved upgrade: ${nextLabel}.`
    : `Upgrade started: ${nextLabel}.`;
  const job = startJob(state, {
    building: target,
    kind: 'UPGRADE',
    createdBy: actor,
    explanation,
    input: cost || {},
    output: {},
    durationMs: maybeConsumeWorkshopBuff(state, 'UPGRADE', durationMs),
    nowMs: ctx.nowMs
  });
  pushEvent(ctx.appendEvent, {
    type: EVENT_TYPES.BUILDING_STARTED,
    actor,
    explanation,
    recapLine: `${nextLabel} started.`,
    data: {
      plot: plotSnapshot(state),
      building: buildingSnapshot(target),
      job: jobSnapshot(job)
    }
  });
  if (actor === 'AGENT') {
    pushEvent(ctx.appendEvent, {
      type: EVENT_TYPES.AGENT_ACTION_EXECUTED,
      actor,
      explanation,
      recapLine: `Foreman started the approved upgrade ${nextLabel}.`,
      data: {
        tool: 'et.plot.upgrade_building',
        plot: plotSnapshot(state),
        building: buildingSnapshot(target),
        job: jobSnapshot(job)
      }
    });
  }
  return {
    jobId: job.jobId,
    buildingId: target.buildingId
  };
}

function applySetPriority(state, { actor = 'HUMAN', buildingId, priority }, ctx) {
  const building = getBuilding(state, buildingId);
  if (!building) {
    const error = new Error('INVALID_STATE');
    error.details = { buildingId };
    throw error;
  }
  if (!['WOOD', 'STONE', 'FOOD', 'BALANCED'].includes(priority)) {
    const error = new Error('INVALID_STATE');
    error.details = { priority };
    throw error;
  }
  if (actor === 'AGENT') {
    ensureAgentPermission(state, 'setPriority', 4);
    ensureAgentActionBudget(state, ctx.nowMs);
  } else if (state.plot.hqLevel < 4) {
    const error = new Error('FORBIDDEN_POLICY');
    error.details = { unlockLevel: 4 };
    throw error;
  }
  building.priority = priority;
  building.updatedAt = ctx.nowMs;
  pushEvent(ctx.appendEvent, {
    type: EVENT_TYPES.JOB_QUEUED,
    actor,
    explanation: actor === 'AGENT'
      ? `Foreman set ${BUILDING_RULES[building.type].label} priority to ${priority}.`
      : `${BUILDING_RULES[building.type].label} priority set to ${priority}.`,
    recapLine: actor === 'AGENT'
      ? `Foreman emphasized ${priority.toLowerCase()} work at ${BUILDING_RULES[building.type].label}.`
      : `${BUILDING_RULES[building.type].label} priority changed to ${priority.toLowerCase()}.`,
    data: {
      plot: plotSnapshot(state),
      building: buildingSnapshot(building),
      priority
    }
  });
  if (actor === 'AGENT') {
    pushEvent(ctx.appendEvent, {
      type: EVENT_TYPES.AGENT_ACTION_EXECUTED,
      actor,
      explanation: `Foreman set ${BUILDING_RULES[building.type].label} priority to ${priority}.`,
      recapLine: `Foreman changed a building priority.`,
      data: {
        tool: 'et.plot.set_priority',
        plot: plotSnapshot(state),
        building: buildingSnapshot(building),
        priority
      }
    });
  }
  return {
    buildingId,
    priority
  };
}

function applyClaimReward(state, { rewardKey }, ctx) {
  const reward = state.meta.pendingRewards.find((entry) => entry.key === rewardKey) || null;
  if (!reward) {
    const error = new Error('INVALID_STATE');
    error.details = { rewardKey };
    throw error;
  }
  const grant = reward.grant && typeof reward.grant === 'object' ? reward.grant : {};
  if (grant.coin) {
    state.plot.inventory.coin = normalizeCount(state.plot.inventory.coin) + normalizeCount(grant.coin);
  }
  if (grant.town_xp) {
    addXp(state, normalizeCount(grant.town_xp));
  }
  state.meta.pendingRewards = state.meta.pendingRewards.filter((entry) => entry.key !== rewardKey);
  awardOnce(state.meta.claimedRewards, rewardKey);
  pushEvent(ctx.appendEvent, {
    type: EVENT_TYPES.REWARD_CLAIMED,
    actor: 'HUMAN',
    explanation: `${reward.title} claimed.`,
    recapLine: `${reward.title} was claimed.`,
    data: {
      plot: plotSnapshot(state),
      reward: {
        key: reward.key,
        type: reward.type,
        grant: reward.grant
      }
    }
  });
  return {
    rewardKey,
    grant: copyJson(grant)
  };
}

function applyRequestUserApproval(state, { requestedBy = 'AGENT', tool, title, body, payload = {} }, ctx) {
  if (!tool) {
    const error = new Error('INVALID_STATE');
    error.details = { reason: 'MISSING_TOOL' };
    throw error;
  }
  const normalizedPayload = payload && typeof payload === 'object' ? payload : {};
  const existing = state.approvals.find((approval) => (
    approval.tool === tool
    && approval.status === 'PENDING'
    && stateHash(approval.payload) === stateHash(normalizedPayload)
  ));
  if (existing) {
    return {
      approvalId: existing.approvalId,
      status: existing.status
    };
  }
  const approval = {
    approvalId: randomId('apr'),
    plotId: state.plot.plotId,
    requestedBy,
    tool,
    title: title || 'Approval requested',
    body: body || 'Approve this foreman action.',
    status: 'PENDING',
    payload: copyJson(normalizedPayload),
    createdAt: ctx.nowMs,
    resolvedAt: 0,
    resolutionNote: ''
  };
  state.approvals.push(approval);
  pushEvent(ctx.appendEvent, {
    type: EVENT_TYPES.APPROVAL_REQUESTED,
    actor: requestedBy === 'AGENT' ? 'AGENT' : 'HUMAN',
    explanation: `${approval.title} is waiting for a human decision.`,
    recapLine: `Approval requested: ${approval.title}.`,
    data: {
      plot: plotSnapshot(state),
      approval: approvalSnapshot(approval)
    }
  });
  return {
    approvalId: approval.approvalId,
    status: approval.status
  };
}

function applyPolicyChange(state, { key, value }, ctx) {
  if (!(key in state.policy)) {
    const error = new Error('INVALID_STATE');
    error.details = { key };
    throw error;
  }
  const permissionRule = PERMISSION_RULES.find((rule) => rule.key === key) || null;
  if (permissionRule && state.plot.hqLevel < permissionRule.level) {
    const error = new Error('FORBIDDEN_POLICY');
    error.details = { key, unlockLevel: permissionRule.level, currentLevel: state.plot.hqLevel };
    throw error;
  }
  if (typeof state.policy[key] === 'boolean') {
    state.policy[key] = value === true;
  } else {
    state.policy[key] = normalizeCount(value);
  }
  state.policy.updatedAt = ctx.nowMs;
  maybeAwardAutomationXp(state, key);
  pushEvent(ctx.appendEvent, {
    type: EVENT_TYPES.AGENT_PERMISSION_CHANGED,
    actor: 'HUMAN',
    explanation: `Foreman permission ${key} set to ${String(state.policy[key])}.`,
    recapLine: `Foreman permission ${key} changed.`,
    data: {
      plot: plotSnapshot(state),
      policy: {
        key,
        value: state.policy[key]
      }
    }
  });
  return {
    key,
    value: state.policy[key]
  };
}

function applyResolveApproval(state, { approvalId, decision, note = '' }, ctx) {
  const approval = getPendingApproval(state, approvalId);
  if (!approval) {
    const error = new Error('INVALID_STATE');
    error.details = { approvalId };
    throw error;
  }
  approval.status = decision === 'approve' ? 'APPROVED' : 'REJECTED';
  approval.resolvedAt = ctx.nowMs;
  approval.resolutionNote = note || '';
  pushEvent(ctx.appendEvent, {
    type: approval.status === 'APPROVED' ? EVENT_TYPES.APPROVAL_APPROVED : EVENT_TYPES.APPROVAL_REJECTED,
    actor: 'HUMAN',
    explanation: `${approval.title} was ${approval.status === 'APPROVED' ? 'approved' : 'rejected'}.`,
    recapLine: `${approval.title} was ${approval.status === 'APPROVED' ? 'approved' : 'rejected'}.`,
    data: {
      plot: plotSnapshot(state),
      approval: approvalSnapshot(approval)
    }
  });
  return {
    approvalId,
    status: approval.status
  };
}

function summarizePublic(state) {
  const built = state.buildings.filter((building) => building.type !== 'HQ' && building.state !== 'UNDER_CONSTRUCTION');
  const claimedOperationalJobs = state.jobs.filter((job) => (
    job.status === 'CLAIMED'
    && (job.kind === 'PRODUCE' || job.kind === 'SELL')
  )).length;
  const scoreBreakdown = {
    hqLevel: state.plot.hqLevel * 20,
    builtStructures: built.length * 10,
    firstCollections: state.meta.firstCollectedTypes.length * 8,
    completedJobs: claimedOperationalJobs * 4,
    automationUnlocks: unlockedPermissionKeys(state.plot.hqLevel).length * 4
  };
  const progressScore = Object.values(scoreBreakdown).reduce((sum, value) => sum + normalizeCount(value), 0);
  return {
    plotId: state.plot.plotId,
    houseId: state.plot.houseId || null,
    hqLevel: state.plot.hqLevel,
    headline: state.meta.publicHeadline || nextQuest(state).title,
    scoreKind: 'founders_progress_v1',
    scoreLabel: 'Founders progress',
    progressScore,
    scoreBreakdown,
    buildings: built.map((building) => ({
      type: building.type,
      label: BUILDING_RULES[building.type]?.label || building.type,
      level: building.level
    })),
    inventory: {
      wood: state.plot.inventory.wood,
      stone: state.plot.inventory.stone,
      food: state.plot.inventory.food,
      coin: state.plot.inventory.coin
    },
    rewardCount: state.meta.pendingRewards.length
  };
}

module.exports = {
  AUTONOMY_TIER_BY_POLICY,
  BUILD_PADS,
  BUILDING_RULES,
  BUILDING_TYPES,
  DEFAULT_POLICY,
  EVENT_TYPES,
  FOUNDERS_PLOT_SCHEMA_VERSION,
  HQ_UPGRADE_RULES,
  MAX_OFFLINE_MS,
  PERMISSION_RULES,
  XP_RULES,
  activeConstructionJobs,
  applyClaimReward,
  applyCollectOutputs,
  applyPlaceBuilding,
  applyPolicyChange,
  applyQueueJob,
  applyRequestUserApproval,
  applyResolveApproval,
  applySetPriority,
  applyUpgradeBuilding,
  availableBuildingTypes,
  buildWorldDelta,
  createInitialPlot,
  getBuilding,
  getHqBuilding,
  nextQuest,
  normalizeLoadedState,
  prepareLoadedState,
  pendingApprovalsView,
  recommendationText,
  requireApprovedAction,
  simulatePlot,
  stateHash,
  stateHashPayload,
  stateView,
  summarizePublic,
  unlockedPermissionKeys,
  unlockedToolNames,
  utcDay
};
