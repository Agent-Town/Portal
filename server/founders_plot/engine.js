const crypto = require('crypto');
const {
  REQUESTERS_V12,
  applyRequesterContractOutcome,
  createRequesterSnapshot,
  defaultRequesterState,
  findRequester,
  generateContractBoardOffers,
  markRequesterSeen,
  normalizeRequesterList
} = require('./contract_deck');
const {
  SIGNAL_KEYS,
  applySignalDelta,
  defaultTownSignals,
  normalizeSignalDelta,
  normalizeTownSignals,
  signalBand
} = require('./town_signals');

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
  CONTRACT_OFFERED: 'CONTRACT_OFFERED',
  CONTRACT_ACCEPTED: 'CONTRACT_ACCEPTED',
  CONTRACT_COMPLETED: 'CONTRACT_COMPLETED',
  CONTRACT_MISSED: 'CONTRACT_MISSED',
  APPROVAL_REQUESTED: 'APPROVAL_REQUESTED',
  APPROVAL_APPROVED: 'APPROVAL_APPROVED',
  APPROVAL_REJECTED: 'APPROVAL_REJECTED',
  AGENT_PERMISSION_CHANGED: 'AGENT_PERMISSION_CHANGED',
  AGENT_ACTION_EXECUTED: 'AGENT_ACTION_EXECUTED',
  FOREMAN_STANDING_ORDER_CHANGED: 'FOREMAN_STANDING_ORDER_CHANGED',
  FOREMAN_SESSION_STARTED: 'FOREMAN_SESSION_STARTED',
  FOREMAN_SESSION_HEARTBEAT: 'FOREMAN_SESSION_HEARTBEAT',
  FOREMAN_SESSION_PAUSED: 'FOREMAN_SESSION_PAUSED',
  FOREMAN_RECEIPT_CREATED: 'FOREMAN_RECEIPT_CREATED',
  FOREMAN_CONTEXT_ASSEMBLED: 'FOREMAN_CONTEXT_ASSEMBLED',
  FOREMAN_LLM_REQUESTED: 'FOREMAN_LLM_REQUESTED',
  FOREMAN_LLM_DECISION_SELECTED: 'FOREMAN_LLM_DECISION_SELECTED',
  FOREMAN_LLM_DECISION_NOOP: 'FOREMAN_LLM_DECISION_NOOP',
  FOREMAN_TOOL_ALIAS_MAPPED: 'FOREMAN_TOOL_ALIAS_MAPPED',
  FOREMAN_ACTION_REJECTED: 'FOREMAN_ACTION_REJECTED',
  SCHEDULER_ENABLED: 'SCHEDULER_ENABLED',
  SCHEDULER_PAUSED: 'SCHEDULER_PAUSED',
  SCHEDULER_RESUMED: 'SCHEDULER_RESUMED',
  REQUESTER_SEEN: 'REQUESTER_SEEN',
  TOWN_SIGNAL_CHANGED: 'TOWN_SIGNAL_CHANGED',
  LANDMARK_UPGRADED: 'LANDMARK_UPGRADED',
  TOWN_JOURNAL_ENTRY_CREATED: 'TOWN_JOURNAL_ENTRY_CREATED',
  FOREMAN_WORKER_COMMAND_STARTED: 'FOREMAN_WORKER_COMMAND_STARTED',
  FOREMAN_WORKER_COMMAND_COMPLETED: 'FOREMAN_WORKER_COMMAND_COMPLETED',
  FOREMAN_WORKER_COMMAND_FAILED: 'FOREMAN_WORKER_COMMAND_FAILED',
  REWARD_CLAIMED: 'REWARD_CLAIMED',
  RECAP_GENERATED: 'RECAP_GENERATED'
};

const STANDING_ORDERS = ['CAREFUL_STEWARD', 'BOLD_FOUNDER'];

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
    cost: { wood: 20, food: 10 },
    xpRequired: 25,
    durationMs: 2 * 60 * 1000
  },
  2: {
    nextLevel: 3,
    cost: { wood: 30, stone: 20 },
    xpRequired: 50,
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
    buildCost: {},
    buildDurationMs: 30 * 1000,
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
    buildCost: { wood: 10, coin: 5 },
    buildDurationMs: 45 * 1000,
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
    buildCost: { wood: 15, coin: 5 },
    buildDurationMs: 60 * 1000,
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
    buildCost: { wood: 20, stone: 10, coin: 10 },
    buildDurationMs: 90 * 1000,
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
    buildCost: { wood: 15, stone: 10, coin: 10 },
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
  { key: 'collectOutputs', level: 1, defaultValue: false },
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
  firstTimberRewardXp: 10,
  hqUpgrade: 20,
  contractTurnIn: 8,
  automationTier: 10,
  dailyReturn: 5
};

const PUBLIC_SQUARE_COST = { wood: 4, coin: 8 };
const PUBLIC_SQUARE_REWARD = {
  townXp: 8,
  signalDelta: { publicCharm: 10 }
};

const FOUNDERS_PLOT_SCHEMA_VERSION = 3;
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
  'questDismissedAt',
  'firstTimberRewarded',
  'standingOrder',
  'contracts',
  'contractDeck',
  'scheduler',
  'foremanRuntime',
  'foremanWorker',
  'foremanReceipts',
  'foremanLastDecision',
  'foremanLastReceiptId',
  'townSignals',
  'requesters',
  'landmarks'
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

function normalizeStandingOrder(value) {
  const normalized = String(value || '').trim().toUpperCase();
  if (STANDING_ORDERS.includes(normalized)) return normalized;
  return 'CAREFUL_STEWARD';
}

function normalizeContractRequirements(raw = {}) {
  const resourcesSource = raw.resources && typeof raw.resources === 'object' ? raw.resources : raw;
  const buildingsSource = Array.isArray(raw.buildings)
    ? raw.buildings
    : raw.buildingType
      ? [{ buildingType: raw.buildingType, minCount: 1 }]
      : [];
  return {
    resources: {
      wood: normalizeCount(resourcesSource.wood),
      stone: normalizeCount(resourcesSource.stone),
      food: normalizeCount(resourcesSource.food),
      coin: normalizeCount(resourcesSource.coin)
    },
    buildings: buildingsSource.map((entry) => ({
      buildingType: String(entry?.buildingType || ''),
      minCount: Math.max(1, normalizeCount(entry?.minCount || 1))
    })).filter((entry) => entry.buildingType)
  };
}

function normalizeContract(raw = {}) {
  const rewardsSource = raw.rewards && typeof raw.rewards === 'object' ? raw.rewards : {};
  const townMoment = raw.townMoment && typeof raw.townMoment === 'object' ? raw.townMoment : null;
  return {
    contractId: String(raw.contractId || ''),
    plotId: String(raw.plotId || ''),
    version: String(raw.version || 'v1.2'),
    kind: String(raw.kind || '').toUpperCase(),
    status: String(raw.status || 'OFFERED').toUpperCase(),
    requesterId: String(raw.requesterId || ''),
    requesterSnapshot: {
      displayName: String(raw?.requesterSnapshot?.displayName || raw.requester || ''),
      institution: String(raw?.requesterSnapshot?.institution || raw.institution || ''),
      roleTitle: String(raw?.requesterSnapshot?.roleTitle || ''),
      portraitEmoji: String(raw?.requesterSnapshot?.portraitEmoji || '')
    },
    whyNow: String(raw.whyNow || ''),
    townBenefit: String(raw.townBenefit || raw.description || ''),
    philosophyHint: String(raw.philosophyHint || ''),
    title: String(raw.title || ''),
    requirements: normalizeContractRequirements(raw.requirements || {}),
    rewards: {
      resources: {
        wood: normalizeCount(rewardsSource?.resources?.wood ?? rewardsSource?.wood),
        stone: normalizeCount(rewardsSource?.resources?.stone ?? rewardsSource?.stone),
        food: normalizeCount(rewardsSource?.resources?.food ?? rewardsSource?.food),
        coin: normalizeCount(rewardsSource?.resources?.coin ?? rewardsSource?.coin)
      },
      townXp: normalizeCount(rewardsSource?.townXp),
      signalDelta: normalizeSignalDelta(rewardsSource?.signalDelta || {})
    },
    missEffect: raw.missEffect && typeof raw.missEffect === 'object'
      ? {
        signalDelta: normalizeSignalDelta(raw.missEffect.signalDelta || {}),
        recapLine: String(raw.missEffect.recapLine || '')
      }
      : null,
    townMoment: townMoment
      ? {
        momentId: String(townMoment.momentId || ''),
        label: String(townMoment.label || ''),
        dueAtMs: normalizeCount(townMoment.dueAtMs),
        softDeadline: townMoment.softDeadline !== false
      }
      : null,
    deckKey: String(raw.deckKey || ''),
    generationSeed: String(raw.generationSeed || ''),
    offeredAtMs: normalizeCount(raw.offeredAtMs),
    acceptedAtMs: normalizeCount(raw.acceptedAtMs || raw.acceptedAt),
    completedAtMs: normalizeCount(raw.completedAtMs || raw.completedAt),
    missedAtMs: normalizeCount(raw.missedAtMs)
  };
}

function normalizeContracts(raw = {}) {
  return {
    offers: Array.isArray(raw.offers) ? raw.offers.map((contract) => normalizeContract(contract)).filter((contract) => contract.contractId) : [],
    activeContract: raw.activeContract ? normalizeContract(raw.activeContract) : null,
    completed: Array.isArray(raw.completed) ? raw.completed.map((contract) => normalizeContract(contract)).filter((contract) => contract.contractId) : []
  };
}

function defaultCollectScheduler() {
  return {
    preset: 'COLLECT_READY_OUTPUTS',
    enabled: false,
    paused: false,
    runtimeScope: 'active_foreman_session',
    nextRunAtMs: 0,
    runCount: 0,
    lease: {
      runtimeId: '',
      claimedAtMs: 0,
      expiresAtMs: 0
    },
    lastResult: null
  };
}

function normalizeScheduler(raw = {}) {
  const source = raw.collectReadyOutputs && typeof raw.collectReadyOutputs === 'object'
    ? raw.collectReadyOutputs
    : raw;
  return {
    collectReadyOutputs: {
      ...defaultCollectScheduler(),
      enabled: source.enabled === true,
      paused: source.paused === true,
      nextRunAtMs: normalizeCount(source.nextRunAtMs),
      runCount: normalizeCount(source.runCount),
      lease: {
        runtimeId: String(source?.lease?.runtimeId || ''),
        claimedAtMs: normalizeCount(source?.lease?.claimedAtMs),
        expiresAtMs: normalizeCount(source?.lease?.expiresAtMs)
      },
      lastResult: source.lastResult && typeof source.lastResult === 'object'
        ? copyPersistedValue(source.lastResult)
        : null
    }
  };
}

function normalizeForemanRuntime(raw = {}) {
  return {
    runtimeId: String(raw.runtimeId || ''),
    sessionId: String(raw.sessionId || ''),
    token: String(raw.token || ''),
    status: String(raw.status || 'NOT_STARTED'),
    startedAt: normalizeCount(raw.startedAt),
    lastHeartbeatAt: normalizeCount(raw.lastHeartbeatAt),
    expiresAt: normalizeCount(raw.expiresAt),
    pausedAt: normalizeCount(raw.pausedAt),
    lastError: String(raw.lastError || ''),
    pack: {
      skillLoaded: raw?.pack?.skillLoaded === true,
      heartbeatLoaded: raw?.pack?.heartbeatLoaded === true,
      toolsLoaded: raw?.pack?.toolsLoaded === true,
      goalsLoaded: raw?.pack?.goalsLoaded === true,
      safetyLoaded: raw?.pack?.safetyLoaded === true
    }
  };
}

function normalizeForemanReceipt(raw = {}) {
  return {
    receiptId: String(raw.receiptId || ''),
    action: String(raw.action || ''),
    result: String(raw.result || ''),
    reason: String(raw.reason || ''),
    authorityUsed: String(raw.authorityUsed || ''),
    standingOrderUsed: String(raw.standingOrderUsed || ''),
    correctionOptions: Array.isArray(raw.correctionOptions)
      ? raw.correctionOptions.map((entry) => String(entry || '')).filter(Boolean)
      : [],
    eventId: normalizeCount(raw.eventId),
    createdAt: normalizeCount(raw.createdAt)
  };
}

function normalizeContractDeck(raw = {}) {
  return {
    version: typeof raw.version === 'string' ? raw.version : 'v1.2',
    refreshCount: normalizeCount(raw.refreshCount),
    boardStateKey: String(raw.boardStateKey || ''),
    recentContractKeys: Array.isArray(raw.recentContractKeys)
      ? raw.recentContractKeys.map((entry) => String(entry || '')).filter(Boolean).slice(-6)
      : []
  };
}

function normalizeLandmarks(raw = {}) {
  const publicSquare = raw.publicSquare && typeof raw.publicSquare === 'object' ? raw.publicSquare : {};
  const level = Math.min(1, Math.max(0, Math.floor(Number(publicSquare.level || 0) || 0)));
  return {
    publicSquare: {
      landmarkId: 'public_square_welcome_sign',
      level,
      label: level >= 1 ? 'Welcome Sign' : 'Open Dust Lot',
      upgradedAtMs: normalizeCount(publicSquare.upgradedAtMs)
    }
  };
}

function normalizeForemanWorker(raw = {}) {
  return {
    lastWorkerCommandId: String(raw.lastWorkerCommandId || ''),
    lastWorkerTraceId: String(raw.lastWorkerTraceId || '')
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
    firstTimberRewarded: raw.firstTimberRewarded === true,
    standingOrder: normalizeStandingOrder(raw.standingOrder),
    contracts: normalizeContracts(raw.contracts),
    contractDeck: normalizeContractDeck(raw.contractDeck),
    scheduler: normalizeScheduler(raw.scheduler),
    foremanRuntime: normalizeForemanRuntime(raw.foremanRuntime),
    foremanWorker: normalizeForemanWorker(raw.foremanWorker),
    foremanReceipts: Array.isArray(raw.foremanReceipts)
      ? raw.foremanReceipts.map((receipt) => normalizeForemanReceipt(receipt)).filter((receipt) => receipt.receiptId)
      : [],
    foremanLastDecision: raw.foremanLastDecision && typeof raw.foremanLastDecision === 'object'
      ? copyPersistedValue(raw.foremanLastDecision)
      : null,
    foremanLastReceiptId: typeof raw.foremanLastReceiptId === 'string' ? raw.foremanLastReceiptId : '',
    townSignals: normalizeTownSignals(raw.townSignals),
    requesters: normalizeRequesterList(raw.requesters),
    landmarks: normalizeLandmarks(raw.landmarks),
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
  meta.schemaVersion = 1;
  next.meta = meta;
  return next;
}

function migrateStateV1ToV2(raw) {
  const next = raw && typeof raw === 'object' ? copyJson(raw) : {};
  const meta = next.meta && typeof next.meta === 'object' ? next.meta : {};
  meta.firstTimberRewarded = meta.firstTimberRewarded === true;
  meta.standingOrder = normalizeStandingOrder(meta.standingOrder);
  meta.contracts = normalizeContracts(meta.contracts);
  meta.scheduler = normalizeScheduler(meta.scheduler);
  meta.foremanRuntime = normalizeForemanRuntime(meta.foremanRuntime);
  meta.foremanReceipts = Array.isArray(meta.foremanReceipts) ? meta.foremanReceipts : [];
  meta.schemaVersion = 2;
  next.meta = meta;
  return next;
}

function migrateStateV2ToV3(raw) {
  const next = raw && typeof raw === 'object' ? copyJson(raw) : {};
  const meta = next.meta && typeof next.meta === 'object' ? next.meta : {};
  meta.contracts = normalizeContracts(meta.contracts);
  meta.contractDeck = normalizeContractDeck(meta.contractDeck);
  meta.townSignals = normalizeTownSignals(meta.townSignals);
  meta.requesters = normalizeRequesterList(meta.requesters);
  meta.landmarks = normalizeLandmarks(meta.landmarks);
  meta.foremanWorker = normalizeForemanWorker(meta.foremanWorker);
  meta.schemaVersion = 3;
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
    toVersion = 1;
  }
  if (toVersion < FOUNDERS_PLOT_SCHEMA_VERSION) {
    migratedRaw = migrateStateV1ToV2(migratedRaw);
    toVersion = 2;
  }
  if (toVersion < FOUNDERS_PLOT_SCHEMA_VERSION) {
    migratedRaw = migrateStateV2ToV3(migratedRaw);
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
  const tools = [
    'et.plot.get_state',
    'et.plot.request_user_approval',
    'et.plot.place_building',
    'et.plot.upgrade_building',
    'et.plot.claim_reward',
    'et.plot.town.get_signals',
    'et.plot.town.upgrade_landmark',
    'et.plot.journal.get_entries',
    'et.plot.contracts.get_state',
    'et.plot.contracts.accept',
    'et.plot.contracts.turn_in',
    'et.foreman.policy.get_standing_order',
    'et.foreman.policy.set_standing_order',
    'et.foreman.scheduler.get_status',
    'et.foreman.scheduler.enable_collect_ready_outputs',
    'et.foreman.scheduler.pause',
    'et.foreman.scheduler.resume'
  ];
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

function inventorySnapshot(plot) {
  return {
    wood: normalizeCount(plot?.inventory?.wood),
    stone: normalizeCount(plot?.inventory?.stone),
    food: normalizeCount(plot?.inventory?.food),
    coin: normalizeCount(plot?.inventory?.coin)
  };
}

function emptyResourceDeltaBlock() {
  return {
    wood: 0,
    stone: 0,
    food: 0,
    coin: 0,
    townXp: 0
  };
}

function mergeResourceDelta(target, patch) {
  const next = { ...(target || emptyResourceDeltaBlock()) };
  for (const key of Object.keys(emptyResourceDeltaBlock())) {
    next[key] = normalizeCount(next[key]) + normalizeCount(patch?.[key]);
  }
  return next;
}

function captureResourceDelta(state, { before, consumed = {}, produced = {}, collected = {}, rewarded = {}, cappedLost = {} } = {}) {
  return {
    before: before || { ...inventorySnapshot(state.plot), townXp: normalizeCount(state.plot.townXp) },
    consumed: mergeResourceDelta(emptyResourceDeltaBlock(), consumed),
    produced: mergeResourceDelta(emptyResourceDeltaBlock(), produced),
    collected: mergeResourceDelta(emptyResourceDeltaBlock(), collected),
    rewarded: mergeResourceDelta(emptyResourceDeltaBlock(), rewarded),
    cappedLost: mergeResourceDelta(emptyResourceDeltaBlock(), cappedLost),
    after: { ...inventorySnapshot(state.plot), townXp: normalizeCount(state.plot.townXp) }
  };
}

function addInventoryWithCaps(plot, delta) {
  const before = inventorySnapshot(plot);
  const safeDelta = delta && typeof delta === 'object' ? delta : {};
  const cappedLost = { wood: 0, stone: 0, food: 0, coin: 0 };
  for (const resource of ['wood', 'stone', 'food', 'coin']) {
    const current = normalizeCount(plot.inventory[resource]);
    const gain = normalizeCount(safeDelta[resource]);
    if (gain <= 0) continue;
    if (resource === 'coin') {
      plot.inventory.coin = current + gain;
      continue;
    }
    const cap = normalizeCount(plot.storageCaps[resource]);
    const next = current + gain;
    plot.inventory[resource] = Math.min(cap, next);
    cappedLost[resource] = Math.max(0, next - plot.inventory[resource]);
  }
  return {
    before,
    after: inventorySnapshot(plot),
    cappedLost
  };
}

function addXp(state, amount) {
  state.plot.townXp = normalizeCount(state.plot.townXp) + normalizeCount(amount);
}

function applyTownSignals(state, delta = {}, { actor = 'SYSTEM', reason = 'CONTRACT_COMPLETED', sourceId = '', appendEvent = null, nowMs = Date.now() } = {}) {
  const applied = applySignalDelta(state.meta.townSignals, delta, nowMs);
  state.meta.townSignals = applied.after;
  const changedKeys = Object.keys(applied.delta || {});
  if (changedKeys.length > 0) {
    pushEvent(appendEvent, {
      type: EVENT_TYPES.TOWN_SIGNAL_CHANGED,
      actor,
      explanation: `Town signals changed because of ${String(reason || '').toLowerCase().replace(/_/g, ' ')}.`,
      recapLine: '',
      data: {
        reason,
        sourceId: String(sourceId || ''),
        before: applied.before,
        delta: applied.delta,
        after: applied.after
      }
    });
  }
  return applied;
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

function maybeApplyFirstTimberReward(state) {
  if (state.meta.firstTimberRewarded === true) return null;
  if (!state.meta.firstCollectedTypes.includes('LUMBER_CAMP')) return null;
  state.meta.firstTimberRewarded = true;
  const reward = {
    food: 10,
    townXp: XP_RULES.firstTimberRewardXp
  };
  const inventoryGain = addInventoryWithCaps(state.plot, { food: reward.food });
  addXp(state, reward.townXp);
  return {
    reward,
    inventoryGain
  };
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

function contractRequesterName(contract) {
  return String(contract?.requesterSnapshot?.displayName || contract?.requester || '');
}

function contractRequesterInstitution(contract) {
  return String(contract?.requesterSnapshot?.institution || contract?.institution || '');
}

function pushRecentContractKeys(state, offers = []) {
  const keys = Array.isArray(state?.meta?.contractDeck?.recentContractKeys)
    ? state.meta.contractDeck.recentContractKeys.slice(-6)
    : [];
  for (const offer of offers) {
    const deckKey = String(offer?.deckKey || '');
    if (!deckKey) continue;
    keys.push(deckKey);
    while (keys.length > 6) keys.shift();
  }
  state.meta.contractDeck.recentContractKeys = keys;
}

function contractBoardStateKey(state) {
  const builtTypes = Array.isArray(state?.buildings)
    ? state.buildings
      .filter((building) => String(building?.state || '') !== 'UNDER_CONSTRUCTION')
      .map((building) => String(building?.type || '').trim())
      .filter(Boolean)
      .sort()
    : [];
  return JSON.stringify({
    hqLevel: normalizeCount(state?.plot?.hqLevel),
    builtTypes
  });
}

function refreshContractBoard(state, nowMs = Date.now()) {
  if (state.plot.hqLevel < 2) return [];
  if (activeContract(state)) return state.meta.contracts.offers;
  const offers = generateContractBoardOffers({
    state,
    nowMs,
    refreshCount: state.meta.contractDeck.refreshCount,
    recentContractKeys: state.meta.contractDeck.recentContractKeys,
    idFactory: () => randomId('con')
  }).map((offer) => normalizeContract(offer));
  state.meta.contracts.offers = offers;
  state.meta.contractDeck.refreshCount += 1;
  state.meta.contractDeck.boardStateKey = contractBoardStateKey(state);
  pushRecentContractKeys(state, offers);
  state.meta.requesters = offers.reduce((requesters, offer) => (
    markRequesterSeen(requesters, offer.requesterId, nowMs)
  ), state.meta.requesters);
  return offers;
}

function ensureContractBoard(state, nowMs = Date.now()) {
  if (state.plot.hqLevel < 2) return;
  const contracts = state.meta.contracts;
  if (contracts.activeContract) return;
  const nextBoardStateKey = contractBoardStateKey(state);
  if (
    Array.isArray(contracts.offers)
    && contracts.offers.length > 0
    && state.meta.contractDeck.boardStateKey === nextBoardStateKey
  ) return;
  refreshContractBoard(state, nowMs);
}

function activeContract(state) {
  return state?.meta?.contracts?.activeContract || null;
}

function contractRequirementStatus(state, contract) {
  if (!contract) return {
    ready: false,
    missing: {}
  };
  if (contract.kind === 'BUILD') {
    const requirements = Array.isArray(contract?.requirements?.buildings)
      ? contract.requirements.buildings
      : [];
    const missing = {};
    let ready = true;
    for (const requirement of requirements) {
      const count = state.buildings.filter((building) => (
        building.type === requirement.buildingType
        && building.state !== 'UNDER_CONSTRUCTION'
      )).length;
      if (count < requirement.minCount) {
        ready = false;
        missing[requirement.buildingType] = requirement.minCount - count;
      }
    }
    return {
      ready,
      missing
    };
  }
  const missing = {};
  let ready = true;
  for (const resource of ['wood', 'stone', 'food', 'coin']) {
    const need = normalizeCount(contract?.requirements?.resources?.[resource]);
    const have = normalizeCount(state?.plot?.inventory?.[resource]);
    if (need > have) {
      ready = false;
      missing[resource] = need - have;
    }
  }
  return { ready, missing };
}

function refreshActiveContractState(state, nowMs = Date.now()) {
  const contract = activeContract(state);
  if (!contract || contract.status === 'COMPLETED' || contract.status === 'CANCELLED_BY_SYSTEM') return contract;
  if (
    contract.kind === 'PREPARATION'
    && contract.townMoment?.softDeadline === true
    && normalizeCount(contract.townMoment?.dueAtMs) > 0
    && normalizeCount(contract.townMoment?.dueAtMs) <= nowMs
    && contract.status !== 'READY_TO_TURN_IN'
    && contract.status !== 'MISSED'
  ) {
    contract.status = 'MISSED';
    contract.missedAtMs = nowMs;
    return contract;
  }
  const status = contractRequirementStatus(state, contract);
  contract.status = status.ready ? 'READY_TO_TURN_IN' : 'ACTIVE';
  return contract;
}

function foremanStandingOrder(state) {
  return normalizeStandingOrder(state?.meta?.standingOrder);
}

function foremanRuntimeStatus(state) {
  return state?.meta?.foremanRuntime || normalizeForemanRuntime({});
}

function latestForemanReceipt(state) {
  const receipts = Array.isArray(state?.meta?.foremanReceipts) ? state.meta.foremanReceipts : [];
  return receipts.length > 0 ? receipts[0] : null;
}

function appendForemanReceipt(state, receipt) {
  const normalized = normalizeForemanReceipt(receipt);
  state.meta.foremanReceipts = [normalized, ...(state.meta.foremanReceipts || [])].slice(0, 12);
  state.meta.foremanLastReceiptId = normalized.receiptId;
  return normalized;
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
  ensureContractBoard(state);
  refreshActiveContractState(state);
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
      body: 'Spend your first timber and provisions to unlock the Farm Plot and the town contract board.',
      primaryAction: { type: 'UPGRADE_HQ' }
    };
  }
  if (!hasType('FARM_PLOT')) {
    return {
      step: 'place_farm_plot',
      title: 'Plant the first farm',
      body: 'A Farm Plot opens the first steady food lane and satisfies the town\'s first build request.',
      primaryAction: { type: 'PLACE_BUILDING', buildingType: 'FARM_PLOT' }
    };
  }
  const contract = activeContract(state);
  if (!contract && Array.isArray(state.meta.contracts.offers) && state.meta.contracts.offers.length > 0) {
    return {
      step: 'choose_first_contract',
      title: 'Choose who to help first',
      body: 'Pick one living town request from the Contract Board.',
      primaryAction: { type: 'VIEW_CONTRACT_BOARD' }
    };
  }
  if (contract && contract.status === 'READY_TO_TURN_IN') {
    return {
      step: 'turn_in_contract',
      title: `Complete: ${contract.title}`,
      body: `${contractRequesterName(contract)} is ready to receive the finished work.`,
      primaryAction: { type: 'TURN_IN_CONTRACT', contractId: contract.contractId }
    };
  }
  if (contract && contract.status === 'ACTIVE') {
    return {
      step: 'progress_contract',
      title: `Advance: ${contract.title}`,
      body: contract.kind === 'BUILD'
        ? 'Complete the requested structure and return to the board.'
        : 'Gather the requested supplies and return to the board.',
      primaryAction: { type: 'VIEW_CONTRACT_BOARD' }
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
      body: 'Spend wood and stone to unlock the Quarry and the next production lane.',
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

function isTutorialQuestStep(step) {
  return [
    'place_lumber_camp',
    'collect_first_wood',
    'upgrade_hq_2',
    'place_farm_plot',
    'choose_first_contract'
  ].includes(String(step || ''));
}

function resolvePrimaryGoal(state, { nowMs = Date.now() } = {}) {
  refreshActiveContractState(state);
  const approvals = pendingApprovalsView(state);
  if (approvals.length > 0) {
    return {
      owner: 'approval',
      priority: 1,
      title: approvals[0].title,
      body: approvals[0].body,
      primaryAction: { type: 'RESOLVE_APPROVAL', approvalId: approvals[0].approvalId }
    };
  }

  const quest = nextQuest(state);
  const contract = activeContract(state);
  const latestReceipt = latestForemanReceipt(state);
  if (isTutorialQuestStep(quest.step)) {
    return {
      owner: 'tutorial',
      priority: 3,
      title: quest.title,
      body: quest.body,
      primaryAction: quest.primaryAction
    };
  }
  if (contract && contract.status === 'READY_TO_TURN_IN') {
    return {
      owner: 'contract_ready',
      priority: 4,
      title: `Turn in: ${contract.title}`,
      body: `${contractRequesterName(contract)} is waiting for the finished work.`,
      primaryAction: { type: 'TURN_IN_CONTRACT', contractId: contract.contractId }
    };
  }
  if (contract && contract.status === 'ACTIVE') {
    const dueAtMs = normalizeCount(contract?.townMoment?.dueAtMs);
    if (
      contract.kind === 'PREPARATION'
      && dueAtMs > nowMs
      && dueAtMs - nowMs <= 2 * 60 * 1000
    ) {
      return {
        owner: 'contract_progress',
        priority: 5,
        title: `${contract.title} is due soon`,
        body: `${contractRequesterName(contract)} is still waiting before ${String(contract?.townMoment?.label || 'the town moment').toLowerCase()}.`,
        primaryAction: { type: 'VIEW_CONTRACT_BOARD' }
      };
    }
    return {
      owner: 'contract_progress',
      priority: 5,
      title: contract.title,
      body: contract.kind === 'BUILD'
        ? 'Advance the requested construction.'
        : 'Gather the requested supplies.',
      primaryAction: { type: 'VIEW_CONTRACT_BOARD' }
    };
  }
  if (latestReceipt && nowMs - normalizeCount(latestReceipt.createdAt) < 5 * 60 * 1000) {
    return {
      owner: 'receipt',
      priority: 6,
      title: 'Foreman receipt ready',
      body: latestReceipt.reason || latestReceipt.result,
      primaryAction: null
    };
  }
  if (canUpgradePublicSquare(state)) {
    return {
      owner: 'landmark',
      priority: 8,
      title: 'Raise the Welcome Sign',
      body: 'Spend a little wood and coin so the square feels like the start of a real town.',
      primaryAction: {
        type: 'UPGRADE_LANDMARK',
        landmarkId: 'public_square_welcome_sign'
      }
    };
  }
  return {
    owner: 'optimization',
    priority: 7,
    title: quest.title,
    body: quest.body,
    primaryAction: quest.primaryAction
  };
}

function observationBuildingState(state, building) {
  if (!building) return 'EMPTY_PAD';
  if (building.state === 'UNDER_CONSTRUCTION') return 'CONSTRUCTING';
  if (building.state === 'UPGRADING') return 'UPGRADING';
  if (building.state === 'OUTPUT_READY') return 'OUTPUT_READY';
  if (building.state === 'PRODUCING') return 'PRODUCING';
  return 'IDLE';
}

function buildForemanObservation(state, { runtimeId = '', nowMs = Date.now(), recentEvents = [] } = {}) {
  ensureContractBoard(state, nowMs);
  refreshActiveContractState(state, nowMs);
  const goal = resolvePrimaryGoal(state, { nowMs });
  const mappedGoalOwner = goal.owner === 'approval'
    ? 'approval'
    : goal.owner === 'contract_ready' || goal.owner === 'contract_progress'
      ? 'active_contract'
      : goal.owner === 'receipt'
        ? 'foreman'
        : 'tutorial';
  return {
    schema: 'founders-plot.obs.v1.2',
    schemaVersion: 'founders-plot.obs.v1.2',
    plotId: state.plot.plotId,
    nowMs,
    runtimeId: String(runtimeId || ''),
    currentGoal: {
      owner: mappedGoalOwner,
      text: `${goal.title}: ${goal.body}`,
      priorityRank: goal.priority,
      ownerRaw: goal.owner,
      title: goal.title,
      body: goal.body,
      priority: goal.priority
    },
    inventory: inventorySnapshot(state.plot),
    townSignals: copyJson(state.meta.townSignals),
    townXp: normalizeCount(state.plot.townXp),
    hqLevel: normalizeCount(state.plot.hqLevel),
    storageCaps: copyJson(state.plot.storageCaps),
    buildings: BUILD_PADS.map((pad) => {
      const building = state.buildings.find((entry) => entry.x === pad.x && entry.y === pad.y) || null;
      return {
        pad: { x: pad.x, y: pad.y, label: pad.label },
        buildingId: building?.buildingId || '',
        type: building?.type || '',
        state: observationBuildingState(state, building),
        jobEndsAtMs: runningJobForBuilding(state, building?.buildingId)?.endsAt || 0,
        outputReady: building && building.state === 'OUTPUT_READY'
          ? (() => {
              const buffer = copyJson(building.outputBuffer || emptyOutputBuffer());
              const resource = ['wood', 'stone', 'food', 'coin'].find((key) => normalizeCount(buffer[key]) > 0) || '';
              return resource ? { resource, qty: normalizeCount(buffer[resource]), buffer } : null;
            })()
          : null
      };
    }),
    activeContract: activeContract(state),
    standingOrder: foremanStandingOrder(state),
    permissions: {
      collectOutputs: !!state.policy.collectOutputs,
      queueProduction: !!state.policy.queueProduction,
      spendCoinCap: normalizeCount(state.policy.sellDailyCoinCap),
      setPriority: !!state.policy.setPriority,
      sellSurplusFood: !!state.policy.sellSurplusFood
    },
    scheduler: {
      enabled: state.meta.scheduler.collectReadyOutputs.enabled === true,
      activePresets: state.meta.scheduler.collectReadyOutputs.enabled === true ? ['COLLECT_READY_OUTPUTS'] : [],
      paused: state.meta.scheduler.collectReadyOutputs.paused === true,
      collectReadyOutputs: copyJson(state.meta.scheduler.collectReadyOutputs)
    },
    allowedTools: unlockedToolNames(state),
    recentEvents: recentEventsView(recentEvents).map((event) => ({
      eventId: `evt_${event.seq}`,
      seq: event.seq,
      type: event.type,
      summary: event.recapLine || event.explanation || '',
      atMs: event.createdAt,
      createdAt: event.createdAt
    }))
  };
}

function scoreCollectCandidate(state, candidate, observation) {
  let score = 50;
  const contract = observation.activeContract;
  const building = getBuilding(state, candidate.buildingId);
  if (contract?.status === 'ACTIVE' || contract?.status === 'READY_TO_TURN_IN') {
    const requirementResource = ['wood', 'stone', 'food', 'coin'].find((resource) => (
      normalizeCount(contract?.requirements?.resources?.[resource]) > 0
      || normalizeCount(contract?.requirements?.[resource]) > 0
    )) || '';
    if (requirementResource && normalizeCount(building?.outputBuffer?.[requirementResource]) > 0) score += 30;
  }
  if (foremanStandingOrder(state) === 'CAREFUL_STEWARD') {
    score += building?.type === 'FARM_PLOT' ? 12 : 4;
  } else {
    score += building?.type === 'LUMBER_CAMP' ? 12 : 6;
  }
  return score;
}

function claimSchedulerLease(state, runtimeId, nowMs) {
  const task = state.meta.scheduler.collectReadyOutputs;
  const lease = task.lease || { runtimeId: '', claimedAtMs: 0, expiresAtMs: 0 };
  const activeRuntimeId = String(runtimeId || '');
  if (!activeRuntimeId) return false;
  if (lease.runtimeId && lease.runtimeId !== activeRuntimeId && normalizeCount(lease.expiresAtMs) > nowMs) {
    return false;
  }
  task.lease = {
    runtimeId: activeRuntimeId,
    claimedAtMs: nowMs,
    expiresAtMs: nowMs + 10_000
  };
  return true;
}

function buildSafeForemanCandidates(state, observation) {
  refreshActiveContractState(state);
  const candidates = [];
  const scheduler = state.meta.scheduler.collectReadyOutputs;
  const runtime = foremanRuntimeStatus(state);
  const schedulerCanRun = scheduler.enabled === true
    && scheduler.paused !== true
    && (observation?.claimLease === true ? claimSchedulerLease(state, observation?.runtimeId, normalizeCount(observation?.nowMs)) : true);
  if (
    runtime.status !== 'PAUSED'
    && state.policy.collectOutputs === true
  ) {
    for (const building of state.buildings) {
      if (building.type === 'HQ' || building.state !== 'OUTPUT_READY') continue;
      const score = scoreCollectCandidate(state, building, observation);
      candidates.push({
        candidateId: `collect:${building.buildingId}`,
        toolName: 'et.plot.collect_outputs',
        buildingId: building.buildingId,
        reason: `Collect ready output from ${BUILDING_RULES[building.type].label}.`,
        goalServed: observation?.activeContract?.contractId ? 'active_contract' : 'town_stability',
        requiresApproval: false,
        canActNow: schedulerCanRun,
        score
      });
    }
  }
  return candidates.sort((a, b) => b.score - a.score || String(a.candidateId).localeCompare(String(b.candidateId)));
}

function normalizeForemanDecisionSource(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'llm' || raw === 'test_brain' || raw === 'server_default') return raw;
  return 'server_default';
}

function buildForemanDecision({ observation, safeCandidates = [], chosenCandidateId = null, source = 'server_default' } = {}) {
  const candidates = Array.isArray(safeCandidates) ? safeCandidates : [];
  const normalizedChosenId = typeof chosenCandidateId === 'string' ? chosenCandidateId.trim() : '';
  const chosen = normalizedChosenId
    ? candidates.find((candidate) => String(candidate?.candidateId || '') === normalizedChosenId) || null
    : null;
  if (!chosen) {
    return {
      chosenCandidateId: null,
      planCard: null,
      source: normalizeForemanDecisionSource(source)
    };
  }
  const standingOrder = normalizeStandingOrder(observation?.standingOrder);
  const influence = standingOrder === 'BOLD_FOUNDER'
    ? 'Bold Founder leans toward visible growth and momentum when the move is still safe.'
    : 'Careful Steward favors stable reserves and predictable town upkeep.';
  return {
    chosenCandidateId: chosen.candidateId,
    planCard: {
      headline: 'Foreman plan',
      goalServed: chosen.goalServed,
      observation: chosen.reason,
      recommendation: `Use ${chosen.toolName} on ${chosen.buildingId}.`,
      reason: standingOrder === 'BOLD_FOUNDER'
        ? 'This keeps the town moving and signals visible momentum.'
        : 'This is the safest useful action that protects the town’s baseline flow.',
      standingOrderInfluence: influence,
      canActNow: chosen.canActNow === true,
      proposedTool: chosen.toolName,
      requiresApproval: chosen.requiresApproval === true,
      alternative: candidates[1] ? `Alternative: ${candidates[1].reason}` : ''
    },
    source: normalizeForemanDecisionSource(source)
  };
}

function chooseForemanCandidateWithTestBrain({ observation, safeCandidates = [] } = {}) {
  const candidates = Array.isArray(safeCandidates) ? safeCandidates : [];
  if (candidates.length === 0) {
    return {
      chosenCandidateId: null,
      planCard: null,
      source: 'test_brain'
    };
  }
  return buildForemanDecision({
    observation,
    safeCandidates: candidates,
    chosenCandidateId: String(candidates[0]?.candidateId || ''),
    source: 'test_brain'
  });
}

function recommendationText(state) {
  const quest = nextQuest(state);
  const contract = activeContract(state);
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
  if (quest.step === 'choose_first_contract') {
    return 'Choose which town request matters first. The contract board is the first real civic choice.';
  }
  if (quest.step === 'turn_in_contract' && contract) {
    return `${contractRequesterName(contract)} is waiting. Turn in the contract before drifting back to optimization.`;
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

function signalLabel(signalKey) {
  switch (String(signalKey || '')) {
    case 'depotReadiness':
      return 'Depot Readiness';
    case 'marketConfidence':
      return 'Market Confidence';
    case 'neighborGoodwill':
      return 'Neighbor Goodwill';
    case 'publicCharm':
      return 'Public Charm';
    default:
      return String(signalKey || '');
  }
}

function buildTownJournalEntries(events = []) {
  const rows = [];
  for (const event of Array.isArray(events) ? events : []) {
    if (!event) continue;
    if (event.type === EVENT_TYPES.CONTRACT_ACCEPTED || event.type === EVENT_TYPES.CONTRACT_COMPLETED || event.type === EVENT_TYPES.CONTRACT_MISSED) {
      const contract = event?.data?.contract || {};
      rows.push({
        journalId: `journal_evt_${event.seq}`,
        eventId: event.seq,
        atMs: normalizeCount(event.createdAt),
        category: 'REQUEST',
        title: String(contract.title || event.type.replace(/_/g, ' ')),
        body: String(event.recapLine || event.explanation || ''),
        requesterId: String(contract.requesterId || event?.data?.requesterId || '')
      });
      continue;
    }
    if (event.type === EVENT_TYPES.TOWN_SIGNAL_CHANGED) {
      const after = event?.data?.after || {};
      const changedKey = SIGNAL_KEYS.find((key) => Number(event?.data?.delta?.[key] || 0) !== 0) || '';
      rows.push({
        journalId: `journal_evt_${event.seq}`,
        eventId: event.seq,
        atMs: normalizeCount(event.createdAt),
        category: 'SIGNAL',
        title: changedKey ? signalLabel(changedKey) : 'Town changed',
        body: changedKey
          ? `${signalLabel(changedKey)} shifted to ${signalBand(after[changedKey]).toLowerCase()}.`
          : String(event.explanation || ''),
        signalKey: changedKey || undefined
      });
      continue;
    }
    if (event.type === EVENT_TYPES.LANDMARK_UPGRADED) {
      rows.push({
        journalId: `journal_evt_${event.seq}`,
        eventId: event.seq,
        atMs: normalizeCount(event.createdAt),
        category: 'LANDMARK',
        title: 'Welcome Sign raised',
        body: String(event.recapLine || event.explanation || '')
      });
      continue;
    }
    if (event.type === EVENT_TYPES.FOREMAN_RECEIPT_CREATED || event.type === EVENT_TYPES.AGENT_ACTION_EXECUTED) {
      rows.push({
        journalId: `journal_evt_${event.seq}`,
        eventId: event.seq,
        atMs: normalizeCount(event.createdAt),
        category: 'FOREMAN',
        title: 'Clover handled one routine',
        body: String(event.recapLine || event.explanation || '')
      });
    }
  }
  return rows.reverse().slice(0, 12);
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
      automationAwards: state.meta.automationAwards,
      firstTimberRewarded: state.meta.firstTimberRewarded,
      standingOrder: state.meta.standingOrder,
      contracts: state.meta.contracts,
      contractDeck: state.meta.contractDeck,
      scheduler: state.meta.scheduler,
      foremanRuntime: {
        runtimeId: state.meta.foremanRuntime.runtimeId,
        sessionId: state.meta.foremanRuntime.sessionId,
        status: state.meta.foremanRuntime.status,
        startedAt: state.meta.foremanRuntime.startedAt,
        lastHeartbeatAt: state.meta.foremanRuntime.lastHeartbeatAt,
        expiresAt: state.meta.foremanRuntime.expiresAt,
        pack: state.meta.foremanRuntime.pack
      },
      foremanWorker: state.meta.foremanWorker,
      foremanReceipts: state.meta.foremanReceipts,
      townSignals: state.meta.townSignals,
      requesters: state.meta.requesters,
      landmarks: state.meta.landmarks
    }
  };
}

function stateView(state, recentEvents = []) {
  ensureContractBoard(state, Date.now());
  refreshActiveContractState(state, Date.now());
  const currentGoal = resolvePrimaryGoal(state);
  const observation = buildForemanObservation(state, {
    runtimeId: state.meta.foremanRuntime.runtimeId,
    nowMs: Date.now(),
    recentEvents
  });
  const safeCandidates = buildSafeForemanCandidates(state, observation);
  const persistedDecision = state.meta.foremanLastDecision && typeof state.meta.foremanLastDecision === 'object'
    ? copyPersistedValue(state.meta.foremanLastDecision)
    : null;
  const persistedChoiceId = typeof persistedDecision?.chosenCandidateId === 'string'
    ? persistedDecision.chosenCandidateId.trim()
    : '';
  const matchingPersistedCandidate = persistedChoiceId
    ? safeCandidates.find((candidate) => String(candidate?.candidateId || '') === persistedChoiceId) || null
    : null;
  let decision = null;
  if (matchingPersistedCandidate) {
    decision = {
      ...copyPersistedValue(persistedDecision),
      ...buildForemanDecision({
      observation,
      safeCandidates,
      chosenCandidateId: persistedChoiceId,
      source: persistedDecision?.source || 'server_default'
      }),
      confidence: Number.isFinite(Number(persistedDecision?.confidence)) ? Number(persistedDecision.confidence) : 0,
      reason: typeof persistedDecision?.reason === 'string' ? persistedDecision.reason : '',
      playerFacingLine: typeof persistedDecision?.playerFacingLine === 'string' ? persistedDecision.playerFacingLine : '',
      noopCode: typeof persistedDecision?.noopCode === 'string' ? persistedDecision.noopCode : null,
      meta: persistedDecision?.meta && typeof persistedDecision.meta === 'object'
        ? copyPersistedValue(persistedDecision.meta)
        : null
    };
  } else if (
    normalizeForemanDecisionSource(persistedDecision?.source) === 'llm'
    && persistedDecision?.planCard
    && typeof persistedDecision.planCard === 'object'
  ) {
    decision = {
      ...persistedDecision,
      source: 'llm',
      planCard: {
        ...copyPersistedValue(persistedDecision.planCard),
        canActNow: false
      },
      confidence: Number.isFinite(Number(persistedDecision?.confidence)) ? Number(persistedDecision.confidence) : 0,
      reason: typeof persistedDecision?.reason === 'string' ? persistedDecision.reason : '',
      playerFacingLine: typeof persistedDecision?.playerFacingLine === 'string' ? persistedDecision.playerFacingLine : '',
      noopCode: typeof persistedDecision?.noopCode === 'string' ? persistedDecision.noopCode : null,
      meta: persistedDecision?.meta && typeof persistedDecision.meta === 'object'
        ? copyPersistedValue(persistedDecision.meta)
        : null
    };
  } else {
    decision = chooseForemanCandidateWithTestBrain({
      observation,
      safeCandidates
    });
  }
  state.meta.foremanLastDecision = decision;
  const journalEntries = buildTownJournalEntries(recentEvents);
  return {
    plot: plotSnapshot(state),
    townSignals: {
      ...copyJson(state.meta.townSignals),
      bands: Object.fromEntries(SIGNAL_KEYS.map((key) => [key, signalBand(state.meta.townSignals[key])])),
      labels: {
        depotReadiness: 'Depot Readiness',
        marketConfidence: 'Market Confidence',
        neighborGoodwill: 'Neighbor Goodwill',
        publicCharm: 'Public Charm'
      }
    },
    requesters: copyJson(state.meta.requesters),
    landmarks: copyJson(state.meta.landmarks),
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
    currentGoal,
    quest: nextQuest(state),
    contracts: {
      boardLocked: state.plot.hqLevel < 2,
      offers: copyJson(state.meta.contracts.offers),
      activeContract: copyJson(state.meta.contracts.activeContract),
      completed: copyJson(state.meta.contracts.completed)
    },
    foreman: {
      recommendation: recommendationText(state),
      allowedTools: unlockedToolNames(state),
      pendingApprovals: pendingApprovalsView(state),
      standingOrder: foremanStandingOrder(state),
      runtime: {
        ...copyJson(state.meta.foremanRuntime),
        token: undefined
      },
      scheduler: copyJson(state.meta.scheduler),
      planCard: decision.planCard,
      receipt: latestForemanReceipt(state),
      lastDecision: decision
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
    journal: {
      entries: journalEntries
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

  const before = { ...inventorySnapshot(state.plot), townXp: normalizeCount(state.plot.townXp) };
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
      ensureContractBoard(state);
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
          job: jobSnapshot(job),
          resourceDelta: captureResourceDelta(state, { before })
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
          job: jobSnapshot(job),
          resourceDelta: captureResourceDelta(state, { before })
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
      job: jobSnapshot(job),
      resourceDelta: captureResourceDelta(state, {
        before,
        produced: output.workshop_buff
          ? {}
          : {
            wood: output.wood,
            stone: output.stone,
            food: output.food,
            coin: output.coin
          }
      })
    }
  });
}

function applyMissedPreparationContract(state, contract, nowMs, appendEvent) {
  if (!contract || contract.kind !== 'PREPARATION' || contract.status === 'MISSED') return null;
  contract.status = 'MISSED';
  contract.missedAtMs = nowMs;
  const missed = copyJson(contract);
  state.meta.contracts.completed.push(missed);
  state.meta.contracts.activeContract = null;
  state.meta.requesters = applyRequesterContractOutcome(state.meta.requesters, {
    requesterId: contract.requesterId,
    status: 'MISSED',
    contractId: contract.contractId,
    nowMs
  });
  const signalResult = applyTownSignals(state, contract?.missEffect?.signalDelta || {}, {
    actor: 'SYSTEM',
    reason: 'CONTRACT_MISSED',
    sourceId: contract.contractId,
    appendEvent,
    nowMs
  });
  pushEvent(appendEvent, {
    type: EVENT_TYPES.CONTRACT_MISSED,
    actor: 'SYSTEM',
    explanation: `${contract.title} was missed.`,
    recapLine: String(contract?.missEffect?.recapLine || `${contractRequesterName(contract)} did not get ${contract.title} in time.`),
    data: {
      contract: missed,
      requesterId: contract.requesterId,
      requesterSnapshot: copyJson(contract.requesterSnapshot || {}),
      signalDelta: signalResult.delta
    }
  });
  refreshContractBoard(state, nowMs);
  return missed;
}

function simulatePlot(state, toMs, appendEvent) {
  const safeTargetMs = Math.max(state.plot.lastSimulatedAt, Math.min(toMs, state.plot.lastSimulatedAt + MAX_OFFLINE_MS));
  if (safeTargetMs <= state.plot.lastSimulatedAt) {
    if (activeContract(state)?.kind === 'PREPARATION') {
      const contract = activeContract(state);
      if (normalizeCount(contract?.townMoment?.dueAtMs) > 0 && normalizeCount(contract.townMoment.dueAtMs) <= safeTargetMs) {
        applyMissedPreparationContract(state, contract, safeTargetMs, appendEvent);
      }
    }
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
    const contract = activeContract(state);
    if (contract?.kind === 'PREPARATION' && normalizeCount(contract?.townMoment?.dueAtMs) > 0 && normalizeCount(contract.townMoment.dueAtMs) <= nextTick) {
      applyMissedPreparationContract(state, contract, normalizeCount(contract.townMoment.dueAtMs) || nextTick, appendEvent);
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

  const before = { ...inventorySnapshot(state.plot), townXp: normalizeCount(state.plot.townXp) };
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
  const placementAwarded = maybeAwardPlacementXp(state, type);
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
      building: buildingSnapshot(building),
      resourceDelta: captureResourceDelta(state, {
        before,
        consumed: BUILDING_RULES[type].buildCost || {},
        rewarded: placementAwarded ? { townXp: XP_RULES.firstPlacement } : {}
      })
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
        ...(ctx.actorMeta || {}),
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

  const before = { ...inventorySnapshot(state.plot), townXp: normalizeCount(state.plot.townXp) };
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
      job: jobSnapshot(job),
      resourceDelta: captureResourceDelta(state, {
        before,
        consumed: production.input || {}
      })
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
        ...(ctx.actorMeta || {}),
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
    ensureAgentPermission(state, 'collectOutputs', 1);
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
  const before = { ...inventorySnapshot(state.plot), townXp: normalizeCount(state.plot.townXp) };
  const inventoryGain = addInventoryWithCaps(state.plot, delta);
  building.outputBuffer = emptyOutputBuffer();
  building.state = 'READY';
  building.updatedAt = ctx.nowMs;
  const relatedJobs = completedUnclaimedJobsForBuilding(state, buildingId);
  for (const job of relatedJobs) {
    job.status = 'CLAIMED';
    job.claimedAt = ctx.nowMs;
  }
  const firstCollectionAwarded = maybeAwardCollectionXp(state, building.type);
  const firstTimberReward = building.type === 'LUMBER_CAMP' ? maybeApplyFirstTimberReward(state) : null;
  const explanation = actor === 'AGENT'
    ? `Foreman collected finished goods from ${BUILDING_RULES[building.type].label}.`
    : `Collected outputs from ${BUILDING_RULES[building.type].label}.`;
  pushEvent(ctx.appendEvent, {
    type: EVENT_TYPES.OUTPUT_COLLECTED,
    actor,
    explanation,
    recapLine: actor === 'AGENT'
      ? `Foreman collected ${BUILDING_RULES[building.type].label} outputs under ${foremanStandingOrder(state) === 'BOLD_FOUNDER' ? 'Bold Founder' : 'Careful Steward'} because collect permission was enabled.`
      : `${BUILDING_RULES[building.type].label} outputs were collected.`,
    data: {
      plot: plotSnapshot(state),
      building: buildingSnapshot(building),
      output: copyJson(delta),
      firstTimberReward: firstTimberReward ? copyJson(firstTimberReward.reward) : null,
      resourceDelta: captureResourceDelta(state, {
        before,
        collected: delta,
        rewarded: mergeResourceDelta(
          firstCollectionAwarded ? { townXp: XP_RULES.firstCollection } : {},
          firstTimberReward ? { food: firstTimberReward.reward.food, townXp: firstTimberReward.reward.townXp } : {}
        ),
        cappedLost: inventoryGain.cappedLost
      })
    }
  });
  if (actor === 'AGENT') {
    pushEvent(ctx.appendEvent, {
      type: EVENT_TYPES.AGENT_ACTION_EXECUTED,
      actor,
      explanation,
      recapLine: `Foreman collected outputs from ${BUILDING_RULES[building.type].label}.`,
      data: {
        ...(ctx.actorMeta || {}),
        tool: 'et.plot.collect_outputs',
        plot: plotSnapshot(state),
        building: buildingSnapshot(building),
        output: copyJson(delta)
      }
    });
  }
  return {
    buildingId,
    collected: delta,
    firstTimberReward: firstTimberReward ? copyJson(firstTimberReward.reward) : null
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

  const before = { ...inventorySnapshot(state.plot), townXp: normalizeCount(state.plot.townXp) };
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
      job: jobSnapshot(job),
      resourceDelta: captureResourceDelta(state, {
        before,
        consumed: cost || {}
      })
    }
  });
  if (actor === 'AGENT') {
    pushEvent(ctx.appendEvent, {
      type: EVENT_TYPES.AGENT_ACTION_EXECUTED,
      actor,
      explanation,
      recapLine: `Foreman started the approved upgrade ${nextLabel}.`,
      data: {
        ...(ctx.actorMeta || {}),
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
        ...(ctx.actorMeta || {}),
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
  const before = { ...inventorySnapshot(state.plot), townXp: normalizeCount(state.plot.townXp) };
  addInventoryWithCaps(state.plot, {
    wood: grant.wood,
    stone: grant.stone,
    food: grant.food,
    coin: grant.coin
  });
  addXp(state, normalizeCount(grant.town_xp || grant.townXp));
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
      },
      resourceDelta: captureResourceDelta(state, {
        before,
        rewarded: {
          wood: grant.wood,
          stone: grant.stone,
          food: grant.food,
          coin: grant.coin,
          townXp: grant.town_xp || grant.townXp
        }
      })
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

function applySetStandingOrder(state, { standingOrder }, ctx) {
  const next = normalizeStandingOrder(standingOrder);
  state.meta.standingOrder = next;
  pushEvent(ctx.appendEvent, {
    type: EVENT_TYPES.FOREMAN_STANDING_ORDER_CHANGED,
    actor: 'HUMAN',
    explanation: `Foreman standing order set to ${next}.`,
    recapLine: `Standing order changed to ${next === 'BOLD_FOUNDER' ? 'Bold Founder' : 'Careful Steward'}.`,
    data: {
      plot: plotSnapshot(state),
      standingOrder: next
    }
  });
  return { standingOrder: next };
}

function applyAcceptContract(state, { contractId }, ctx) {
  ensureContractBoard(state, ctx.nowMs);
  if (activeContract(state)) {
    const error = new Error('INVALID_STATE');
    error.details = {
      activeContractId: activeContract(state).contractId
    };
    throw error;
  }
  const offer = state.meta.contracts.offers.find((contract) => contract.contractId === contractId) || null;
  if (!offer) {
    const error = new Error('INVALID_STATE');
    error.details = { contractId };
    throw error;
  }
  state.meta.contracts.offers = state.meta.contracts.offers.filter((contract) => contract.contractId !== contractId);
  state.meta.contracts.activeContract = {
    ...copyJson(offer),
    status: 'ACTIVE',
    acceptedAtMs: ctx.nowMs,
    townMoment: offer.townMoment
      ? {
        ...copyJson(offer.townMoment),
        dueAtMs: normalizeCount(offer?.townMoment?.dueAtMs) > 0
          ? normalizeCount(offer.townMoment.dueAtMs)
          : ctx.nowMs + (10 * 60 * 1000)
      }
      : null
  };
  state.meta.requesters = markRequesterSeen(state.meta.requesters, offer.requesterId, ctx.nowMs);
  refreshActiveContractState(state, ctx.nowMs);
  pushEvent(ctx.appendEvent, {
    type: EVENT_TYPES.CONTRACT_ACCEPTED,
    actor: 'HUMAN',
    explanation: `${contractRequesterName(offer)}'s contract was accepted.`,
    recapLine: `Accepted contract from ${contractRequesterName(offer)}.`,
    data: {
      plot: plotSnapshot(state),
      contract: copyJson(state.meta.contracts.activeContract)
    }
  });
  return {
    contract: copyJson(state.meta.contracts.activeContract)
  };
}

function applyTurnInContract(state, { contractId }, ctx) {
  refreshActiveContractState(state, ctx.nowMs);
  const contract = activeContract(state);
  if (!contract || contract.contractId !== contractId) {
    const error = new Error('INVALID_STATE');
    error.details = { contractId };
    throw error;
  }
  if (contract.status !== 'READY_TO_TURN_IN') {
    const error = new Error('INVALID_STATE');
    error.details = {
      contractId,
      status: contract.status
    };
    throw error;
  }
  const before = { ...inventorySnapshot(state.plot), townXp: normalizeCount(state.plot.townXp) };
  let consumed = {};
  if (contract.kind === 'SUPPLY') {
    consumed = {
      wood: contract.requirements.resources.wood,
      stone: contract.requirements.resources.stone,
      food: contract.requirements.resources.food,
      coin: contract.requirements.resources.coin
    };
    spendInventory(state.plot, consumed);
  }
  addInventoryWithCaps(state.plot, {
    wood: contract.rewards.resources.wood,
    stone: contract.rewards.resources.stone,
    food: contract.rewards.resources.food,
    coin: contract.rewards.resources.coin
  });
  addXp(state, contract.rewards.townXp);
  const signalResult = applyTownSignals(state, contract.rewards.signalDelta || {}, {
    actor: 'HUMAN',
    reason: 'CONTRACT_COMPLETED',
    sourceId: contract.contractId,
    appendEvent: ctx.appendEvent,
    nowMs: ctx.nowMs
  });
  const completed = {
    ...copyJson(contract),
    status: 'COMPLETED',
    completedAtMs: ctx.nowMs
  };
  state.meta.contracts.completed.push(completed);
  state.meta.contracts.activeContract = null;
  state.meta.requesters = applyRequesterContractOutcome(state.meta.requesters, {
    requesterId: contract.requesterId,
    status: 'COMPLETED',
    contractId: contract.contractId,
    nowMs: ctx.nowMs
  });
  refreshContractBoard(state, ctx.nowMs);
  pushEvent(ctx.appendEvent, {
    type: EVENT_TYPES.CONTRACT_COMPLETED,
    actor: 'HUMAN',
    explanation: `${contract.title} completed for ${contractRequesterName(contract)}.`,
    recapLine: `${contractRequesterName(contract)} says ${contract.townBenefit || `${contract.title} helped the town`}.`,
    data: {
      plot: plotSnapshot(state),
      contract: copyJson(completed),
      requesterId: contract.requesterId,
      requesterSnapshot: copyJson(contract.requesterSnapshot || {}),
      signalDelta: signalResult.delta,
      resourceDelta: captureResourceDelta(state, {
        before,
        consumed,
        rewarded: {
          wood: contract.rewards.resources.wood,
          stone: contract.rewards.resources.stone,
          food: contract.rewards.resources.food,
          coin: contract.rewards.resources.coin,
          townXp: contract.rewards.townXp
        }
      })
    }
  });
  return {
    contract: copyJson(completed)
  };
}

function canUpgradePublicSquare(state) {
  const landmark = state?.meta?.landmarks?.publicSquare;
  if (!landmark || normalizeCount(landmark.level) >= 1) return false;
  for (const [resource, amount] of Object.entries(PUBLIC_SQUARE_COST)) {
    if (normalizeCount(state?.plot?.inventory?.[resource]) < normalizeCount(amount)) return false;
  }
  return true;
}

function applyUpgradeLandmark(state, { landmarkId }, ctx) {
  const normalizedId = String(landmarkId || '').trim();
  if (normalizedId !== 'public_square_welcome_sign') {
    const error = new Error('INVALID_STATE');
    error.details = { landmarkId };
    throw error;
  }
  const landmark = state.meta.landmarks.publicSquare;
  if (normalizeCount(landmark.level) >= 1) {
    return {
      landmark: copyJson(landmark),
      resourceDelta: captureResourceDelta(state, { before: { ...inventorySnapshot(state.plot), townXp: normalizeCount(state.plot.townXp) } }),
      signalDelta: {}
    };
  }
  const before = { ...inventorySnapshot(state.plot), townXp: normalizeCount(state.plot.townXp) };
  spendInventory(state.plot, PUBLIC_SQUARE_COST);
  addXp(state, PUBLIC_SQUARE_REWARD.townXp);
  landmark.level = 1;
  landmark.label = 'Welcome Sign';
  landmark.upgradedAtMs = ctx.nowMs;
  const signalResult = applyTownSignals(state, PUBLIC_SQUARE_REWARD.signalDelta, {
    actor: 'HUMAN',
    reason: 'LANDMARK_UPGRADED',
    sourceId: landmark.landmarkId,
    appendEvent: ctx.appendEvent,
    nowMs: ctx.nowMs
  });
  pushEvent(ctx.appendEvent, {
    type: EVENT_TYPES.LANDMARK_UPGRADED,
    actor: 'HUMAN',
    explanation: 'The Public Square Welcome Sign was raised.',
    recapLine: 'The Public Square now has a proper Welcome Sign.',
    data: {
      landmark: copyJson(landmark),
      signalDelta: signalResult.delta,
      resourceDelta: captureResourceDelta(state, {
        before,
        consumed: PUBLIC_SQUARE_COST,
        rewarded: { townXp: PUBLIC_SQUARE_REWARD.townXp }
      })
    }
  });
  return {
    landmark: copyJson(landmark),
    resourceDelta: captureResourceDelta(state, {
      before,
      consumed: PUBLIC_SQUARE_COST,
      rewarded: { townXp: PUBLIC_SQUARE_REWARD.townXp }
    }),
    signalDelta: signalResult.delta
  };
}

function schedulerStatusView(state) {
  return copyJson(state.meta.scheduler);
}

function applyEnableCollectReadyOutputs(state, ctx) {
  state.meta.scheduler.collectReadyOutputs.enabled = true;
  state.meta.scheduler.collectReadyOutputs.paused = false;
  state.meta.scheduler.collectReadyOutputs.nextRunAtMs = ctx.nowMs;
  pushEvent(ctx.appendEvent, {
    type: EVENT_TYPES.SCHEDULER_ENABLED,
    actor: 'HUMAN',
    explanation: 'Collect ready outputs automation enabled.',
    recapLine: 'Collect ready outputs automation enabled.',
    data: {
      scheduler: schedulerStatusView(state)
    }
  });
  return schedulerStatusView(state);
}

function applyPauseScheduler(state, ctx) {
  state.meta.scheduler.collectReadyOutputs.paused = true;
  pushEvent(ctx.appendEvent, {
    type: EVENT_TYPES.SCHEDULER_PAUSED,
    actor: 'HUMAN',
    explanation: 'Collect ready outputs automation paused.',
    recapLine: 'Collect ready outputs automation paused.',
    data: {
      scheduler: schedulerStatusView(state)
    }
  });
  return schedulerStatusView(state);
}

function applyResumeScheduler(state, ctx) {
  state.meta.scheduler.collectReadyOutputs.enabled = true;
  state.meta.scheduler.collectReadyOutputs.paused = false;
  state.meta.scheduler.collectReadyOutputs.nextRunAtMs = ctx.nowMs;
  pushEvent(ctx.appendEvent, {
    type: EVENT_TYPES.SCHEDULER_RESUMED,
    actor: 'HUMAN',
    explanation: 'Collect ready outputs automation resumed.',
    recapLine: 'Collect ready outputs automation resumed.',
    data: {
      scheduler: schedulerStatusView(state)
    }
  });
  return schedulerStatusView(state);
}

function startForemanSession(state, { runtimeId = '', nowMs, pack = {} }) {
  const nextRuntimeId = runtimeId || randomId('rt');
  const sessionId = randomId('frs');
  const token = randomId('fpt');
  state.meta.foremanRuntime = normalizeForemanRuntime({
    runtimeId: nextRuntimeId,
    sessionId,
    token,
    status: 'OBSERVING',
    startedAt: nowMs,
    lastHeartbeatAt: nowMs,
    expiresAt: nowMs + (2 * 60 * 1000),
    pack
  });
  return {
    runtimeId: nextRuntimeId,
    sessionId,
    token,
    status: state.meta.foremanRuntime.status
  };
}

function heartbeatForemanSession(state, { nowMs, pack = {} }) {
  state.meta.foremanRuntime = normalizeForemanRuntime({
    ...state.meta.foremanRuntime,
    status: state.meta.foremanRuntime.status === 'PAUSED' ? 'PAUSED' : 'OBSERVING',
    lastHeartbeatAt: nowMs,
    expiresAt: nowMs + (2 * 60 * 1000),
    pack: {
      ...state.meta.foremanRuntime.pack,
      ...pack
    }
  });
  return copyJson(state.meta.foremanRuntime);
}

function pauseForemanSession(state, { nowMs }) {
  state.meta.foremanRuntime.status = 'PAUSED';
  state.meta.foremanRuntime.pausedAt = nowMs;
  return copyJson(state.meta.foremanRuntime);
}

function applyReceiptCorrection(state, { correction }, ctx) {
  const normalized = String(correction || '').trim().toUpperCase();
  if (normalized === 'ASK_ME_NEXT_TIME') {
    state.meta.scheduler.collectReadyOutputs.enabled = false;
    state.meta.scheduler.collectReadyOutputs.paused = true;
    return {
      correction: normalized,
      scheduler: schedulerStatusView(state)
    };
  }
  if (normalized === 'PAUSE_FOREMAN') {
    state.meta.foremanRuntime.status = 'PAUSED';
    state.meta.foremanRuntime.pausedAt = ctx.nowMs;
    state.meta.scheduler.collectReadyOutputs.paused = true;
    return {
      correction: normalized,
      runtime: copyJson(state.meta.foremanRuntime)
    };
  }
  const error = new Error('INVALID_STATE');
  error.details = { correction };
  throw error;
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
  applyAcceptContract,
  applyClaimReward,
  applyCollectOutputs,
  applyEnableCollectReadyOutputs,
  applyPauseScheduler,
  applyPlaceBuilding,
  applyPolicyChange,
  applyQueueJob,
  applyRequestUserApproval,
  applyResolveApproval,
  applyReceiptCorrection,
  applyResumeScheduler,
  applySetStandingOrder,
  applySetPriority,
  applyTurnInContract,
  applyUpgradeLandmark,
  applyUpgradeBuilding,
  availableBuildingTypes,
  buildForemanObservation,
  buildForemanDecision,
  buildSafeForemanCandidates,
  buildTownJournalEntries,
  buildWorldDelta,
  canUpgradePublicSquare,
  chooseForemanCandidateWithTestBrain,
  createInitialPlot,
  foremanRuntimeStatus,
  getBuilding,
  getHqBuilding,
  nextQuest,
  normalizeLoadedState,
  prepareLoadedState,
  pendingApprovalsView,
  recommendationText,
  requireApprovedAction,
  resolvePrimaryGoal,
  schedulerStatusView,
  simulatePlot,
  heartbeatForemanSession,
  pauseForemanSession,
  startForemanSession,
  stateHash,
  stateHashPayload,
  stateView,
  summarizePublic,
  unlockedPermissionKeys,
  unlockedToolNames,
  utcDay
};
