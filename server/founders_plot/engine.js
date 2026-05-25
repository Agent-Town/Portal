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
const {
  approvedCreatorManifests,
  manifestById,
  safeCreatorText,
  validateCreatorManifest,
  validateCreatorToolInput
} = require('./creator_extensions');

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
  FOREMAN_LEASE_GRANTED: 'FOREMAN_LEASE_GRANTED',
  FOREMAN_LEASE_REVOKED: 'FOREMAN_LEASE_REVOKED',
  FOREMAN_EXCEPTION_RAISED: 'FOREMAN_EXCEPTION_RAISED',
  FOREMAN_EXCEPTION_RESOLVED: 'FOREMAN_EXCEPTION_RESOLVED',
  FOREMAN_DOCTRINE_UPDATED: 'FOREMAN_DOCTRINE_UPDATED',
  FOREMAN_PERSISTENT_STARTED: 'FOREMAN_PERSISTENT_STARTED',
  FOREMAN_PERSISTENT_PAUSED: 'FOREMAN_PERSISTENT_PAUSED',
  FOREMAN_PERSISTENT_TICK: 'FOREMAN_PERSISTENT_TICK',
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
  TOWN_IDENTITY_SET: 'TOWN_IDENTITY_SET',
  TOWN_POSTCARD_CAPTURED: 'TOWN_POSTCARD_CAPTURED',
  TOWN_OPPORTUNITY_RESOLVED: 'TOWN_OPPORTUNITY_RESOLVED',
  TOWN_JOURNAL_ENTRY_CREATED: 'TOWN_JOURNAL_ENTRY_CREATED',
  CIVIC_SCENARIO_STARTED: 'CIVIC_SCENARIO_STARTED',
  CIVIC_SCENARIO_PROGRESS: 'CIVIC_SCENARIO_PROGRESS',
  CIVIC_SCENARIO_COMPLETED: 'CIVIC_SCENARIO_COMPLETED',
  CIVIC_SCENARIO_SOFT_MISSED: 'CIVIC_SCENARIO_SOFT_MISSED',
  SETTLER_EXPEDITION_LAUNCHED: 'SETTLER_EXPEDITION_LAUNCHED',
  SETTLEMENT_FOCUSED: 'SETTLEMENT_FOCUSED',
  SETTLEMENT_FOUNDING_TASK_COMPLETED: 'SETTLEMENT_FOUNDING_TASK_COMPLETED',
  OPERATING_CHARTER_CHOSEN: 'OPERATING_CHARTER_CHOSEN',
  OPERATING_CAPABILITY_UNLOCKED: 'OPERATING_CAPABILITY_UNLOCKED',
  OPERATING_CONTRACTS_REFRESHED: 'OPERATING_CONTRACTS_REFRESHED',
  SPECIALIST_ASSIGNED: 'SPECIALIST_ASSIGNED',
  SPECIALIST_PAUSED: 'SPECIALIST_PAUSED',
  SPECIALIST_RECOMMENDATION_REVIEWED: 'SPECIALIST_RECOMMENDATION_REVIEWED',
  SPECIALIST_CONFLICT_RAISED: 'SPECIALIST_CONFLICT_RAISED',
  REGIONAL_SUPPLY_ROUTE_OPENED: 'REGIONAL_SUPPLY_ROUTE_OPENED',
  REGIONAL_SUPPLY_TRANSFERRED: 'REGIONAL_SUPPLY_TRANSFERRED',
  REGIONAL_ROUTE_SHORTAGE: 'REGIONAL_ROUTE_SHORTAGE',
  REGIONAL_CONTRACT_ACCEPTED: 'REGIONAL_CONTRACT_ACCEPTED',
  REGIONAL_CONTRACT_COMPLETED: 'REGIONAL_CONTRACT_COMPLETED',
  CREATOR_BUILDING_INSTALLED: 'CREATOR_BUILDING_INSTALLED',
  CREATOR_BUILDING_DISABLED: 'CREATOR_BUILDING_DISABLED',
  CREATOR_BUILDING_REMOVED: 'CREATOR_BUILDING_REMOVED',
  CREATOR_TOOL_RAN: 'CREATOR_TOOL_RAN',
  FOREMAN_PREFERENCE_RECORDED: 'FOREMAN_PREFERENCE_RECORDED',
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
    cost: { wood: 30, food: 12 },
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
const PUBLIC_SQUARE_STYLES = [
  {
    styleId: 'homestead',
    label: 'Homestead Welcome',
    body: 'A warm sign, lantern, and practical rail fence for a neighborly first impression.',
    ornament: 'lantern',
    palette: { tint: '#ffd88a', accent: '#7a3f22' }
  },
  {
    styleId: 'garden',
    label: 'Garden Square',
    body: 'Planters, soft greenery, and a softer civic corner for a town that feels cared for.',
    ornament: 'planters',
    palette: { tint: '#b9d88a', accent: '#2f5d50' }
  },
  {
    styleId: 'market',
    label: 'Market Corner',
    body: 'A brass-trimmed notice rail and trade bunting for a town that wants passing work.',
    ornament: 'bunting',
    palette: { tint: '#f0b35a', accent: '#8a4f1f' }
  }
];
const PUBLIC_SQUARE_STYLE_IDS = new Set(PUBLIC_SQUARE_STYLES.map((style) => style.styleId));

const FIRST_TOWN_OPPORTUNITY = {
  opportunityId: 'first_campfire_choice',
  title: 'A campfire decision',
  body: 'The first timber haul draws neighbors to the square. Choose the town mood you want to build around.',
  sourceObjectId: 'PUBLIC_SQUARE',
  options: [
    {
      optionId: 'raise_waymarkers',
      label: 'Raise waymarkers',
      body: 'Spend wood on trail signs so travelers and depot runners find the plot faster.',
      cost: { wood: 4, coin: 2 },
      reward: { townXp: 6 },
      signalDelta: { depotReadiness: 8, publicCharm: 4 },
      cloverTradeoff: {
        pro: 'Depot reach.',
        con: 'Costs early wood and coin.'
      },
      outcomeTitle: 'Waymarkers raised',
      outcomeBody: 'The depot route is easier to follow, and the square feels a little more official.'
    },
    {
      optionId: 'host_neighbor_supper',
      label: 'Host a neighbor supper',
      body: 'Spend food on a warm first meal so nearby families feel invited into the new town.',
      cost: { food: 4, coin: 2 },
      reward: { townXp: 6 },
      signalDelta: { neighborGoodwill: 10, marketConfidence: 3 },
      cloverTradeoff: {
        pro: 'Goodwill.',
        con: 'Uses the food cushion.'
      },
      outcomeTitle: 'Neighbor supper hosted',
      outcomeBody: 'The first shared meal gives the town a friendlier reputation.'
    }
  ]
};

const SUPPLY_COUNCIL_OPPORTUNITY = {
  opportunityId: 'first_supply_council_choice',
  title: 'A supply council',
  body: 'The first choice has neighbors talking. Choose how the town gathers enough supplies to open Headquarters level 2.',
  sourceObjectId: 'PUBLIC_SQUARE',
  options: [
    {
      optionId: 'hire_depot_haulers',
      label: 'Hire depot haulers',
      body: 'Spend coin for a fast wood and food drop that gets the Headquarters upgrade moving.',
      cost: { coin: 4 },
      reward: { townXp: 4, resources: { wood: 20, food: 4 } },
      signalDelta: { depotReadiness: 8, marketConfidence: -2 },
      cloverTradeoff: {
        pro: 'Fast HQ2 supplies.',
        con: 'Costs coin; market dips.'
      },
      outcomeTitle: 'Depot haulers hired',
      outcomeBody: 'A paid crew brings the missing stores, and the depot route starts to feel real.'
    },
    {
      optionId: 'host_work_bee',
      label: 'Host a work bee',
      body: 'Keep coin in reserve and invite neighbors to haul enough wood and food together.',
      cost: {},
      reward: { townXp: 4, resources: { wood: 18, food: 4 } },
      signalDelta: { neighborGoodwill: 7, publicCharm: 3 },
      cloverTradeoff: {
        pro: 'Saves coin; goodwill.',
        con: 'Slightly less wood.'
      },
      outcomeTitle: 'Work bee hosted',
      outcomeBody: 'Neighbors pitch in with a communal haul, leaving coin ready for the next build.'
    }
  ]
};

const LEVEL_TWO_CHARTER_OPPORTUNITY = {
  opportunityId: 'level_two_charter_choice',
  title: 'A level 2 charter',
  body: 'With Headquarters level 2 open, the town wants a first civic priority. Choose the next lane.',
  sourceObjectId: 'PUBLIC_SQUARE',
  options: [
    {
      optionId: 'seed_farm_coop',
      label: 'Seed the farm co-op',
      body: 'Spend coin on seed stock so the first Farm Plot starts with neighbors already bought in.',
      cost: { coin: 3 },
      reward: { townXp: 5, resources: { wood: 10, food: 8 } },
      signalDelta: { neighborGoodwill: 6, publicCharm: 3 },
      cloverTradeoff: {
        pro: 'Food safety.',
        con: 'Delays request momentum.'
      },
      outcomeTitle: 'Farm co-op seeded',
      outcomeBody: 'The town has enough lumber for the Farm Plot and a food cushion for the next push.'
    },
    {
      optionId: 'organize_request_board',
      label: 'Organize request board',
      body: 'Spend coin to frame the first town requests and reserve stone for sturdier work.',
      cost: { coin: 3 },
      reward: { townXp: 5, resources: { wood: 10, stone: 4 } },
      signalDelta: { marketConfidence: 6, depotReadiness: 4 },
      cloverTradeoff: {
        pro: 'Request momentum.',
        con: 'Less food safety.'
      },
      outcomeTitle: 'Request board organized',
      outcomeBody: 'The town is ready to track outside work, and the next Farm Plot still has enough lumber.'
    }
  ]
};

const TOWN_OPPORTUNITY_TEMPLATES = [
  FIRST_TOWN_OPPORTUNITY,
  SUPPLY_COUNCIL_OPPORTUNITY,
  LEVEL_TWO_CHARTER_OPPORTUNITY
];

const STORM_PREP_SCENARIO = {
  scenarioId: 'storm_prep',
  title: 'Storm Prep',
  body: 'A fast storm line is moving toward the plot. Spend limited reserves on practical prep without losing contract momentum.',
  sourceObjectId: 'PUBLIC_SQUARE',
  durationMs: 12 * 60 * 1000,
  minCompletedTasks: 2,
  reward: {
    townXp: 12,
    resources: { coin: 4 },
    signalDelta: { publicCharm: 5, neighborGoodwill: 4 }
  },
  softMiss: {
    signalDelta: { publicCharm: -2, neighborGoodwill: -2 },
    recapLine: 'Storm Prep slipped by. The town stayed safe, but neighbors noticed the scramble.'
  },
  tasks: [
    {
      taskId: 'brace_roofs',
      label: 'Brace roofs',
      body: 'Use lumber to brace the public shed and the weakest porch roofs.',
      cost: { wood: 12 },
      signalDelta: { publicCharm: 4, neighborGoodwill: 2 }
    },
    {
      taskId: 'stock_supper',
      label: 'Stock supper stores',
      body: 'Reserve food for a shared supper if the storm stalls travel.',
      cost: { food: 8 },
      signalDelta: { neighborGoodwill: 5, marketConfidence: 1 }
    },
    {
      taskId: 'mark_depot_route',
      label: 'Mark depot route',
      body: 'Spend a little wood and coin so depot runners can find the plot after rain.',
      cost: { wood: 6, coin: 2 },
      signalDelta: { depotReadiness: 6, publicCharm: 2 }
    }
  ]
};

const CIVIC_SCENARIO_TEMPLATES = [
  STORM_PREP_SCENARIO
];

const FOUNDERS_PLOT_SCHEMA_VERSION = 14;
const MAX_OFFLINE_MS = 8 * 60 * 60 * 1000;
const SIMULATION_TICK_MS = 60 * 1000;
const FOREMAN_DEFAULT_LEASE_MS = 15 * 60 * 1000;
const FOREMAN_MAX_LEASE_MS = 4 * 60 * 60 * 1000;

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
  'governance',
  'doctrine',
  'foremanRuntime',
  'foremanWorker',
  'foremanReceipts',
  'foremanLastDecision',
  'foremanLastReceiptId',
  'townSignals',
  'requesters',
  'landmarks',
  'townPostcards',
  'townOpportunities',
  'scenarios',
  'settlements',
  'operatingModel',
  'specialists',
  'regionalNetwork',
  'creatorExtensions',
  'teachingPreferences'
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
      runtimeScope: String(source.runtimeScope || 'active_foreman_session'),
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
    brainReady: raw.brainReady === true,
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
    doctrineUsed: raw.doctrineUsed && typeof raw.doctrineUsed === 'object'
      ? copyPersistedValue(raw.doctrineUsed)
      : null,
    correctionOptions: Array.isArray(raw.correctionOptions)
      ? raw.correctionOptions.map((entry) => String(entry || '')).filter(Boolean)
      : [],
    eventId: normalizeCount(raw.eventId),
    createdAt: normalizeCount(raw.createdAt)
  };
}

function normalizeForemanLease(raw = {}) {
  const status = String(raw.status || 'ACTIVE').trim().toUpperCase();
  return {
    leaseId: String(raw.leaseId || ''),
    status: status === 'REVOKED' || status === 'EXPIRED' ? status : 'ACTIVE',
    scope: String(raw.scope || 'collect_ready_outputs'),
    grantedBy: String(raw.grantedBy || 'HUMAN'),
    runtimeId: String(raw.runtimeId || ''),
    requiresUnlockedBrain: raw.requiresUnlockedBrain !== false,
    grantedAtMs: normalizeCount(raw.grantedAtMs),
    expiresAtMs: normalizeCount(raw.expiresAtMs),
    revokedAtMs: normalizeCount(raw.revokedAtMs),
    revokeReason: String(raw.revokeReason || '')
  };
}

function normalizeForemanException(raw = {}) {
  const status = String(raw.status || 'OPEN').trim().toUpperCase();
  return {
    exceptionId: String(raw.exceptionId || ''),
    status: status === 'RESOLVED' || status === 'DISMISSED' ? status : 'OPEN',
    severity: String(raw.severity || 'needs_review').trim().toLowerCase(),
    title: String(raw.title || 'Clover needs a decision'),
    body: String(raw.body || ''),
    requestedAction: String(raw.requestedAction || ''),
    source: String(raw.source || 'foreman'),
    payload: raw.payload && typeof raw.payload === 'object' ? copyPersistedValue(raw.payload) : {},
    createdAtMs: normalizeCount(raw.createdAtMs),
    resolvedAtMs: normalizeCount(raw.resolvedAtMs),
    resolution: String(raw.resolution || '')
  };
}

function normalizePersistentForeman(raw = {}) {
  const status = String(raw.status || 'INACTIVE').trim().toUpperCase();
  const normalizedStatus = ['ACTIVE', 'PAUSED', 'EXPIRED'].includes(status) ? status : 'INACTIVE';
  return {
    runtimeId: String(raw.runtimeId || ''),
    status: normalizedStatus,
    scope: String(raw.scope || 'collect_ready_outputs'),
    authorizationId: String(raw.authorizationId || ''),
    authorizedBy: String(raw.authorizedBy || ''),
    requiresUnlockedBrain: raw.requiresUnlockedBrain !== false,
    startedAtMs: normalizeCount(raw.startedAtMs),
    pausedAtMs: normalizeCount(raw.pausedAtMs),
    expiresAtMs: normalizeCount(raw.expiresAtMs),
    lastTickAtMs: normalizeCount(raw.lastTickAtMs),
    nextTickAtMs: normalizeCount(raw.nextTickAtMs),
    actionCount: normalizeCount(raw.actionCount),
    lastResult: raw.lastResult && typeof raw.lastResult === 'object'
      ? copyPersistedValue(raw.lastResult)
      : null,
    lastErrorCode: String(raw.lastErrorCode || '')
  };
}

function normalizeForemanGovernance(raw = {}) {
  return {
    activeLease: raw.activeLease ? normalizeForemanLease(raw.activeLease) : null,
    leaseHistory: Array.isArray(raw.leaseHistory)
      ? raw.leaseHistory.map((lease) => normalizeForemanLease(lease)).filter((lease) => lease.leaseId).slice(0, 10)
      : [],
    exceptions: Array.isArray(raw.exceptions)
      ? raw.exceptions.map((entry) => normalizeForemanException(entry)).filter((entry) => entry.exceptionId).slice(0, 20)
      : [],
    persistent: normalizePersistentForeman(raw.persistent)
  };
}

function normalizeSettlementEvent(raw = {}) {
  return {
    eventId: String(raw.eventId || ''),
    type: String(raw.type || ''),
    actor: String(raw.actor || 'SYSTEM'),
    summary: String(raw.summary || ''),
    createdAtMs: normalizeCount(raw.createdAtMs)
  };
}

function normalizeSettlementBuilding(raw = {}) {
  const state = String(raw.state || 'READY').trim().toUpperCase();
  return {
    buildingId: String(raw.buildingId || ''),
    type: String(raw.type || 'OUTPOST_CAMP'),
    label: String(raw.label || 'Outpost Camp'),
    level: Math.max(1, Math.floor(Number(raw.level || 1) || 1)),
    state: ['READY', 'FOUNDATION', 'UNDER_CONSTRUCTION'].includes(state) ? state : 'READY',
    createdAtMs: normalizeCount(raw.createdAtMs),
    updatedAtMs: normalizeCount(raw.updatedAtMs)
  };
}

function normalizeSettlementFoundingTask(raw = {}) {
  const status = String(raw.status || 'READY').trim().toUpperCase();
  return {
    taskId: String(raw.taskId || ''),
    label: String(raw.label || 'Raise Outpost Camp'),
    body: String(raw.body || 'Use outpost supplies to make the new settlement livable.'),
    status: status === 'COMPLETED' ? 'COMPLETED' : 'READY',
    cost: normalizeInventory(raw.cost || { wood: 4, food: 4 }),
    completedAtMs: normalizeCount(raw.completedAtMs)
  };
}

function normalizeSecondSettlement(raw = {}) {
  if (!raw || typeof raw !== 'object' || !raw.settlementId) return null;
  const status = String(raw.status || 'FOUNDING').trim().toUpperCase();
  return {
    settlementId: String(raw.settlementId || ''),
    plotId: String(raw.plotId || ''),
    name: String(raw.name || 'Ridge Outpost'),
    role: String(raw.role || 'second_settlement'),
    status: status === 'ACTIVE' ? 'ACTIVE' : 'FOUNDING',
    hqLevel: Math.max(1, Math.floor(Number(raw.hqLevel || 1) || 1)),
    inventory: normalizeInventory(raw.inventory || { wood: 4, stone: 0, food: 8, coin: 6 }),
    storageCaps: normalizeInventory(raw.storageCaps || { wood: 60, stone: 60, food: 60, coin: 999 }),
    buildings: Array.isArray(raw.buildings)
      ? raw.buildings.map((building) => normalizeSettlementBuilding(building)).filter((building) => building.buildingId)
      : [],
    foundingTasks: Array.isArray(raw.foundingTasks)
      ? raw.foundingTasks.map((task) => normalizeSettlementFoundingTask(task)).filter((task) => task.taskId)
      : [],
    events: Array.isArray(raw.events)
      ? raw.events.map((event) => normalizeSettlementEvent(event)).filter((event) => event.eventId).slice(-20)
      : [],
    readiness: normalizeCount(raw.readiness),
    createdAtMs: normalizeCount(raw.createdAtMs),
    updatedAtMs: normalizeCount(raw.updatedAtMs)
  };
}

function normalizeSettlements(raw = {}) {
  const activeSettlementId = String(raw.activeSettlementId || 'town_1');
  const expeditionStatus = String(raw?.expedition?.status || 'LOCKED').trim().toUpperCase();
  return {
    activeSettlementId,
    expedition: {
      status: ['READY', 'LAUNCHED'].includes(expeditionStatus) ? expeditionStatus : 'LOCKED',
      expeditionId: String(raw?.expedition?.expeditionId || ''),
      fromSettlementId: String(raw?.expedition?.fromSettlementId || 'town_1'),
      toSettlementId: String(raw?.expedition?.toSettlementId || ''),
      launchedAtMs: normalizeCount(raw?.expedition?.launchedAtMs),
      focusedAtMs: normalizeCount(raw?.expedition?.focusedAtMs)
    },
    secondSettlement: normalizeSecondSettlement(raw.secondSettlement)
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

const TEACHING_CORRECTIONS = new Set([
  'DO_THIS_AGAIN',
  'ASK_ME_FIRST',
  'PREFER_RESERVES',
  'PREFER_SPEED'
]);

const FOREMAN_DOCTRINE_RULES = [
  {
    ruleId: 'PREFER_RESERVES',
    label: 'Prefer reserves',
    summary: 'Favor requests that protect wood, food, and coin.',
    conflicts: ['PREFER_SPEED']
  },
  {
    ruleId: 'PREFER_SPEED',
    label: 'Prefer speed',
    summary: 'Favor the quickest useful request when several options are safe.',
    conflicts: ['PREFER_RESERVES']
  },
  {
    ruleId: 'ASK_BEFORE_SPENDING',
    label: 'Ask before spending',
    summary: 'Pause and ask before Clover repeats routines that spend reserves.',
    conflicts: []
  },
  {
    ruleId: 'FINISH_ACTIVE_CONTRACTS_FIRST',
    label: 'Finish active contracts first',
    summary: 'Rank actions that finish current requester promises ahead of general upkeep.',
    conflicts: []
  }
];
const FOREMAN_DOCTRINE_RULE_IDS = new Set(FOREMAN_DOCTRINE_RULES.map((rule) => rule.ruleId));

const OPERATING_CHARTERS = [
  {
    charterId: 'STEADY_COMMONS',
    label: 'Steady Commons',
    axis: 'stability + care',
    summary: 'Protect reserves, favor neighbors, and grow without brittle rushes.',
    bannerText: 'Steady Commons',
    contractWeights: {
      requesterIds: { nell_neighbor_lead: 24, jasper_depot_clerk: 8 },
      signalDelta: { neighborGoodwill: 4, depotReadiness: 1 },
      kinds: { BUILD: 8, PREPARATION: 10 }
    },
    foremanHint: 'Clover should prefer work that protects reserves and keeps neighbors confident.'
  },
  {
    charterId: 'SWIFT_DEPOT',
    label: 'Swift Depot',
    axis: 'speed + logistics',
    summary: 'Keep wagons moving, clear short jobs, and make the town easy to supply.',
    bannerText: 'Swift Depot',
    contractWeights: {
      requesterIds: { jasper_depot_clerk: 28, mara_market_host: 8 },
      signalDelta: { depotReadiness: 4, marketConfidence: 2 },
      kinds: { SUPPLY: 12, PREPARATION: 6 }
    },
    foremanHint: 'Clover should prefer fast completable logistics work and depot momentum.'
  },
  {
    charterId: 'CIVIC_BEACON',
    label: 'Civic Beacon',
    axis: 'prestige + public charm',
    summary: 'Invest in visible town identity, formal requests, and public trust.',
    bannerText: 'Civic Beacon',
    contractWeights: {
      requesterIds: { clara_town_scribe: 28, mara_market_host: 8 },
      signalDelta: { publicCharm: 5, marketConfidence: 1 },
      kinds: { PREPARATION: 10, BUILD: 6 }
    },
    foremanHint: 'Clover should prefer public-facing work that makes the town feel intentional.'
  }
];
const OPERATING_CHARTER_IDS = new Set(OPERATING_CHARTERS.map((charter) => charter.charterId));

const OPERATING_CAPABILITIES = [
  {
    capabilityId: 'CHARTER_CONTRACTS',
    label: 'Charter Contract Board',
    summary: 'Refresh the Contract Board through the chosen charter lens.',
    unlocksTools: ['et.plot.operating_model.refresh_contracts'],
    requiresCharter: true
  },
  {
    capabilityId: 'SETTLEMENT_BANNERS',
    label: 'Settlement Banners',
    summary: 'Show the charter identity in town signage and flyover state.',
    unlocksTools: [],
    requiresCharter: true
  },
  {
    capabilityId: 'FOREMAN_BRIEFING',
    label: 'Foreman Briefing Flags',
    summary: 'Carry the charter into Clover suggestions and the Morning Brief.',
    unlocksTools: [],
    requiresCharter: true
  }
];
const OPERATING_CAPABILITY_IDS = new Set(OPERATING_CAPABILITIES.map((capability) => capability.capabilityId));

const SPECIALIST_DOMAINS = [
  {
    domainId: 'construction',
    label: 'Construction',
    summary: 'Building placement, HQ upgrades, and structure upgrades.',
    toolNames: ['et.plot.place_building', 'et.plot.upgrade_building']
  },
  {
    domainId: 'supplies',
    label: 'Supplies',
    summary: 'Producer queues and ready output collection.',
    toolNames: ['et.plot.queue_job', 'et.plot.collect_outputs']
  },
  {
    domainId: 'contracts',
    label: 'Contracts',
    summary: 'Contract board choice and turn-in timing.',
    toolNames: ['et.plot.contracts.accept', 'et.plot.contracts.turn_in']
  },
  {
    domainId: 'public_works',
    label: 'Public Works',
    summary: 'Public Square, scenario, and civic contribution timing.',
    toolNames: ['et.plot.town.upgrade_landmark', 'et.plot.scenarios.contribute']
  }
];
const SPECIALIST_DOMAIN_IDS = new Set(SPECIALIST_DOMAINS.map((domain) => domain.domainId));

const SPECIALIST_ROLES = [
  {
    roleId: 'BUILDER_FOREMAN',
    label: 'Builder Foreman',
    summary: 'Keeps construction and upgrade choices inside a bounded build lane.',
    defaultDomainId: 'construction',
    eligibleDomains: ['construction', 'public_works']
  },
  {
    roleId: 'QUARTERMASTER',
    label: 'Quartermaster',
    summary: 'Keeps supplies, reserves, and contract handoff timing inside a bounded stores lane.',
    defaultDomainId: 'supplies',
    eligibleDomains: ['supplies', 'contracts']
  }
];
const SPECIALIST_ROLE_IDS = new Set(SPECIALIST_ROLES.map((role) => role.roleId));

const REGIONAL_ROUTE_DEFINITIONS = [
  {
    routeId: 'founders_ridge_supply_route',
    label: 'Ridge Supply Route',
    fromSettlementId: 'town_1',
    toSettlementId: 'town_2',
    resource: 'wood',
    transferAmount: 4,
    summary: 'Move bounded lumber shipments from Founders Plot to Ridge Outpost.'
  }
];
const REGIONAL_ROUTE_IDS = new Set(REGIONAL_ROUTE_DEFINITIONS.map((route) => route.routeId));

const REGIONAL_CONTRACT_DEFINITIONS = [
  {
    contractId: 'ridge_timber_bridge',
    routeId: 'founders_ridge_supply_route',
    title: 'Ridge Timber Bridge',
    requester: 'Regional Council',
    summary: 'Send one Founders Plot lumber shipment to Ridge Outpost, then close the bridge request.',
    fromSettlementId: 'town_1',
    toSettlementId: 'town_2',
    requiredTransfers: 1,
    reward: { coin: 10, townXp: 12 }
  }
];
const REGIONAL_CONTRACT_IDS = new Set(REGIONAL_CONTRACT_DEFINITIONS.map((contract) => contract.contractId));

function normalizeTeachingPreferences(raw = {}) {
  const latestCorrection = TEACHING_CORRECTIONS.has(String(raw.latestCorrection || '').trim().toUpperCase())
    ? String(raw.latestCorrection || '').trim().toUpperCase()
    : '';
  const contractPreference = ['RESERVES', 'SPEED'].includes(String(raw.contractPreference || '').trim().toUpperCase())
    ? String(raw.contractPreference || '').trim().toUpperCase()
    : '';
  const history = Array.isArray(raw.history)
    ? raw.history.map((entry) => ({
      correction: TEACHING_CORRECTIONS.has(String(entry?.correction || '').trim().toUpperCase())
        ? String(entry.correction || '').trim().toUpperCase()
        : '',
      contractPreference: ['RESERVES', 'SPEED'].includes(String(entry?.contractPreference || '').trim().toUpperCase())
        ? String(entry.contractPreference || '').trim().toUpperCase()
        : '',
      repeatRequesterId: String(entry?.repeatRequesterId || ''),
      repeatContractKind: String(entry?.repeatContractKind || '').trim().toUpperCase(),
      note: String(entry?.note || ''),
      createdAt: normalizeCount(entry?.createdAt)
    })).filter((entry) => entry.correction).slice(-8)
    : [];
  return {
    version: 'v1.5',
    latestCorrection,
    contractPreference,
    askBeforeAutomation: raw.askBeforeAutomation === true,
    repeatRequesterId: String(raw.repeatRequesterId || ''),
    repeatContractKind: String(raw.repeatContractKind || '').trim().toUpperCase(),
    note: String(raw.note || ''),
    updatedAt: normalizeCount(raw.updatedAt),
    history
  };
}

function normalizeDoctrineRuleId(value) {
  const ruleId = String(value || '').trim().toUpperCase();
  return FOREMAN_DOCTRINE_RULE_IDS.has(ruleId) ? ruleId : '';
}

function doctrineRuleDefinition(ruleId) {
  const normalized = normalizeDoctrineRuleId(ruleId);
  return FOREMAN_DOCTRINE_RULES.find((rule) => rule.ruleId === normalized) || null;
}

function normalizeForemanDoctrine(raw = {}) {
  const sourceStates = raw?.ruleStates && typeof raw.ruleStates === 'object' ? raw.ruleStates : {};
  const rawActiveRules = Array.isArray(raw?.activeRules)
    ? raw.activeRules.map((entry) => normalizeDoctrineRuleId(entry)).filter(Boolean)
    : [];
  const activeSet = new Set(rawActiveRules);
  const ruleStates = {};
  for (const rule of FOREMAN_DOCTRINE_RULES) {
    const hasSourceState = Object.prototype.hasOwnProperty.call(sourceStates, rule.ruleId);
    const source = sourceStates[rule.ruleId] && typeof sourceStates[rule.ruleId] === 'object'
      ? sourceStates[rule.ruleId]
      : {};
    ruleStates[rule.ruleId] = {
      enabled: hasSourceState ? source.enabled === true : activeSet.has(rule.ruleId),
      updatedAtMs: normalizeCount(source.updatedAtMs),
      source: String(source.source || '')
    };
  }
  const history = Array.isArray(raw?.history)
    ? raw.history.map((entry) => ({
      ruleId: normalizeDoctrineRuleId(entry?.ruleId),
      enabled: entry?.enabled === true,
      source: String(entry?.source || ''),
      createdAtMs: normalizeCount(entry?.createdAtMs)
    })).filter((entry) => entry.ruleId).slice(-12)
    : [];
  const activeRules = FOREMAN_DOCTRINE_RULES
    .filter((rule) => ruleStates[rule.ruleId]?.enabled === true)
    .map((rule) => rule.ruleId);
  return {
    version: 'v2.1',
    activeRules,
    ruleStates,
    latestRuleId: normalizeDoctrineRuleId(raw?.latestRuleId),
    updatedAtMs: normalizeCount(raw?.updatedAtMs),
    history
  };
}

function normalizeOperatingCharterId(value) {
  const charterId = String(value || '').trim().toUpperCase();
  return OPERATING_CHARTER_IDS.has(charterId) ? charterId : '';
}

function operatingCharterDefinition(charterId) {
  const normalized = normalizeOperatingCharterId(charterId);
  return OPERATING_CHARTERS.find((charter) => charter.charterId === normalized) || null;
}

function normalizeOperatingCapabilityId(value) {
  const capabilityId = String(value || '').trim().toUpperCase();
  return OPERATING_CAPABILITY_IDS.has(capabilityId) ? capabilityId : '';
}

function operatingCapabilityDefinition(capabilityId) {
  const normalized = normalizeOperatingCapabilityId(capabilityId);
  return OPERATING_CAPABILITIES.find((capability) => capability.capabilityId === normalized) || null;
}

function normalizeOperatingModel(raw = {}) {
  const selectedCharterId = normalizeOperatingCharterId(raw.selectedCharterId || raw.charterId);
  const unlockedCapabilities = Array.isArray(raw.unlockedCapabilities)
    ? raw.unlockedCapabilities.map((entry) => normalizeOperatingCapabilityId(entry)).filter(Boolean)
    : [];
  const capabilityHistory = Array.isArray(raw.capabilityHistory)
    ? raw.capabilityHistory.map((entry) => ({
      capabilityId: normalizeOperatingCapabilityId(entry?.capabilityId),
      source: String(entry?.source || ''),
      createdAtMs: normalizeCount(entry?.createdAtMs)
    })).filter((entry) => entry.capabilityId).slice(-12)
    : [];
  const charterHistory = Array.isArray(raw.charterHistory || raw.history)
    ? (raw.charterHistory || raw.history).map((entry) => ({
      charterId: normalizeOperatingCharterId(entry?.charterId),
      source: String(entry?.source || ''),
      createdAtMs: normalizeCount(entry?.createdAtMs)
    })).filter((entry) => entry.charterId).slice(-8)
    : [];
  return {
    version: 'v3.0',
    selectedCharterId,
    selectedAtMs: normalizeCount(raw.selectedAtMs),
    unlockedCapabilities: [...new Set(unlockedCapabilities)],
    capabilityHistory,
    charterHistory,
    updatedAtMs: normalizeCount(raw.updatedAtMs)
  };
}

function operatingModelHasCapability(state, capabilityId) {
  const normalized = normalizeOperatingCapabilityId(capabilityId);
  if (!normalized) return false;
  const operatingModel = normalizeOperatingModel(state?.meta?.operatingModel || {});
  return operatingModel.unlockedCapabilities.includes(normalized);
}

function operatingModelGate(state) {
  const settlement = normalizeSecondSettlement(state?.meta?.settlements?.secondSettlement || null);
  const criteria = [
    {
      id: 'hq2',
      label: 'Headquarters level 2 reached',
      met: normalizeCount(state?.plot?.hqLevel) >= 2
    },
    {
      id: 'second_settlement',
      label: 'Ridge Outpost founded',
      met: !!settlement && settlement.status === 'ACTIVE'
    }
  ];
  const ready = criteria.every((entry) => entry.met === true);
  return {
    ready,
    criteria,
    summary: ready
      ? 'The town network is ready to choose an operating charter.'
      : 'Found Ridge Outpost before choosing an operating charter.'
  };
}

function operatingModelView(state) {
  const operatingModel = normalizeOperatingModel(state?.meta?.operatingModel || {});
  const gate = operatingModelGate(state);
  const selected = operatingCharterDefinition(operatingModel.selectedCharterId);
  const selectedCapabilityIds = new Set(operatingModel.unlockedCapabilities);
  const capabilities = OPERATING_CAPABILITIES.map((capability) => {
    const unlocked = selectedCapabilityIds.has(capability.capabilityId);
    const available = selected && gate.ready && !unlocked && capability.requiresCharter === true;
    return {
      capabilityId: capability.capabilityId,
      label: capability.label,
      summary: capability.summary,
      unlocked,
      available: available === true,
      unlocksTools: capability.unlocksTools.slice(),
      lockedReason: unlocked
        ? ''
        : !selected
          ? 'Choose a charter first.'
          : !gate.ready
            ? gate.summary
            : ''
    };
  });
  const allowedActions = [
    gate.ready && !selected ? 'choose_charter' : '',
    selected ? 'unlock_capability' : '',
    operatingModelHasCapability(state, 'CHARTER_CONTRACTS') ? 'refresh_contracts' : ''
  ].filter(Boolean);
  return {
    version: operatingModel.version,
    gate,
    selectedCharterId: operatingModel.selectedCharterId,
    selectedAtMs: operatingModel.selectedAtMs,
    charter: selected ? copyJson(selected) : null,
    availableCharters: OPERATING_CHARTERS.map((charter) => copyJson(charter)),
    capabilities,
    unlockedCapabilities: capabilities.filter((capability) => capability.unlocked),
    allowedActions,
    bannerText: selected?.bannerText || '',
    summary: selected
      ? `${selected.label} is shaping contracts, Clover suggestions, and town signage.`
      : gate.summary
  };
}

function operatingModelInfluenceLine(state) {
  const selected = operatingCharterDefinition(state?.meta?.operatingModel?.selectedCharterId);
  return selected ? `${selected.label} charter: ${selected.summary}` : '';
}

function operatingModelContractScoreAdjustment(state, contract) {
  const selected = operatingCharterDefinition(state?.meta?.operatingModel?.selectedCharterId);
  if (!selected || !contract) return 0;
  const weights = selected.contractWeights || {};
  let score = 0;
  score += normalizeCount(weights?.requesterIds?.[contract.requesterId]);
  score += normalizeCount(weights?.kinds?.[String(contract.kind || '').toUpperCase()]);
  const signalDelta = contract?.rewards?.signalDelta || {};
  for (const [key, weight] of Object.entries(weights.signalDelta || {})) {
    score += normalizeCount(signalDelta[key]) * normalizeCount(weight);
  }
  return score;
}

function operatingModelContractReason(state) {
  const selected = operatingCharterDefinition(state?.meta?.operatingModel?.selectedCharterId);
  if (!selected) return '';
  return `${selected.label} is weighting this board toward ${selected.axis}.`;
}

function normalizeSpecialistRoleId(value) {
  const roleId = String(value || '').trim().toUpperCase();
  return SPECIALIST_ROLE_IDS.has(roleId) ? roleId : '';
}

function specialistRoleDefinition(roleId) {
  const normalized = normalizeSpecialistRoleId(roleId);
  return SPECIALIST_ROLES.find((role) => role.roleId === normalized) || null;
}

function normalizeSpecialistDomainId(value) {
  const domainId = String(value || '').trim().toLowerCase();
  return SPECIALIST_DOMAIN_IDS.has(domainId) ? domainId : '';
}

function specialistDomainDefinition(domainId) {
  const normalized = normalizeSpecialistDomainId(domainId);
  return SPECIALIST_DOMAINS.find((domain) => domain.domainId === normalized) || null;
}

function normalizeSpecialistStatus(value) {
  const status = String(value || '').trim().toUpperCase();
  return ['ACTIVE', 'PAUSED', 'UNASSIGNED'].includes(status) ? status : 'UNASSIGNED';
}

function specialistToolsForDomain(domainId) {
  const domain = specialistDomainDefinition(domainId);
  return domain ? domain.toolNames.slice() : [];
}

function normalizeSpecialistRoleState(roleDefinition, raw = {}) {
  const roleId = roleDefinition.roleId;
  const domainId = normalizeSpecialistDomainId(raw.domainId);
  const eligible = new Set(roleDefinition.eligibleDomains || []);
  const safeDomainId = domainId && eligible.has(domainId) ? domainId : '';
  const status = safeDomainId ? normalizeSpecialistStatus(raw.status || 'ACTIVE') : 'UNASSIGNED';
  return {
    roleId,
    label: roleDefinition.label,
    summary: roleDefinition.summary,
    status,
    domainId: safeDomainId,
    assignedAtMs: normalizeCount(raw.assignedAtMs),
    reassignedAtMs: normalizeCount(raw.reassignedAtMs),
    pausedAtMs: normalizeCount(raw.pausedAtMs),
    lastRecommendationId: String(raw.lastRecommendationId || ''),
    allowedTools: status === 'ACTIVE' ? specialistToolsForDomain(safeDomainId) : [],
    eligibleDomains: roleDefinition.eligibleDomains.slice()
  };
}

function normalizeSpecialistRecommendation(raw = {}) {
  const roleId = normalizeSpecialistRoleId(raw.roleId);
  const domainId = normalizeSpecialistDomainId(raw.domainId);
  const status = String(raw.status || 'OPEN').trim().toUpperCase();
  return {
    recommendationId: String(raw.recommendationId || ''),
    roleId,
    domainId,
    toolName: String(raw.toolName || ''),
    targetObjectId: String(raw.targetObjectId || ''),
    summary: String(raw.summary || ''),
    status: ['OPEN', 'CONFLICT_ESCALATED', 'DISMISSED'].includes(status) ? status : 'OPEN',
    conflictsWith: Array.isArray(raw.conflictsWith)
      ? raw.conflictsWith.map((entry) => String(entry || '')).filter(Boolean)
      : [],
    createdAtMs: normalizeCount(raw.createdAtMs),
    resolvedAtMs: normalizeCount(raw.resolvedAtMs)
  };
}

function normalizeSpecialists(raw = {}) {
  const sourceRoles = raw?.roles && typeof raw.roles === 'object' ? raw.roles : {};
  const roles = {};
  for (const role of SPECIALIST_ROLES) {
    roles[role.roleId] = normalizeSpecialistRoleState(role, sourceRoles[role.roleId] || {});
  }
  const recommendations = Array.isArray(raw?.recommendations)
    ? raw.recommendations.map((entry) => normalizeSpecialistRecommendation(entry)).filter((entry) => (
      entry.recommendationId
      && entry.roleId
      && entry.domainId
      && entry.toolName
    )).slice(-20)
    : [];
  return {
    version: 'v3.1',
    roles,
    recommendations,
    latestConflictId: String(raw.latestConflictId || ''),
    updatedAtMs: normalizeCount(raw.updatedAtMs)
  };
}

function specialistStaffingGate(state, { nowMs = Date.now() } = {}) {
  const operatingModel = normalizeOperatingModel(state?.meta?.operatingModel || {});
  const persistent = persistentForemanView(state, { nowMs });
  const criteria = [
    {
      id: 'charter',
      label: 'Operating charter chosen',
      met: !!operatingModel.selectedCharterId
    },
    {
      id: 'trusted_foreman',
      label: 'Clover has proven one bounded while-away routine',
      met: normalizeCount(persistent.actionCount) >= 1
    }
  ];
  const ready = criteria.every((entry) => entry.met === true);
  return {
    ready,
    criteria,
    summary: ready
      ? 'The Foreman bench is ready for specialist staffing.'
      : 'Choose a town charter and prove one bounded Clover routine before adding specialists.'
  };
}

function specialistRoleView(roleState) {
  const domain = specialistDomainDefinition(roleState.domainId);
  const role = specialistRoleDefinition(roleState.roleId);
  return {
    ...copyJson(roleState),
    domain: domain ? copyJson(domain) : null,
    assignableDomains: (role?.eligibleDomains || []).map((domainId) => {
      const definition = specialistDomainDefinition(domainId);
      return definition ? copyJson(definition) : null;
    }).filter(Boolean),
    active: roleState.status === 'ACTIVE',
    paused: roleState.status === 'PAUSED'
  };
}

function specialistConflictExceptions(state) {
  const exceptions = Array.isArray(state?.meta?.governance?.exceptions) ? state.meta.governance.exceptions : [];
  return exceptions
    .map((entry) => normalizeForemanException(entry))
    .filter((entry) => entry.status === 'OPEN' && String(entry.source || '') === 'specialist_staffing')
    .map((entry) => copyJson(entry));
}

function specialistsView(state, { nowMs = Date.now() } = {}) {
  const specialists = normalizeSpecialists(state?.meta?.specialists || {});
  const gate = specialistStaffingGate(state, { nowMs });
  const roles = Object.values(specialists.roles).map((roleState) => specialistRoleView(roleState));
  const activeAssignments = roles.filter((role) => role.active === true);
  const openRecommendations = specialists.recommendations
    .filter((entry) => entry.status === 'OPEN' || entry.status === 'CONFLICT_ESCALATED')
    .map((entry) => copyJson(entry))
    .reverse();
  return {
    version: specialists.version,
    gate,
    domains: SPECIALIST_DOMAINS.map((domain) => copyJson(domain)),
    roles,
    activeAssignments,
    recommendations: openRecommendations,
    conflicts: specialistConflictExceptions(state),
    allowedActions: [
      gate.ready ? 'assign' : '',
      activeAssignments.length > 0 ? 'pause' : '',
      activeAssignments.length > 0 ? 'review_recommendation' : ''
    ].filter(Boolean),
    summary: activeAssignments.length > 0
      ? `${activeAssignments.length} specialist lane${activeAssignments.length === 1 ? '' : 's'} staffed.`
      : gate.summary
  };
}

function normalizeRegionalRouteId(value) {
  const routeId = String(value || '').trim();
  return REGIONAL_ROUTE_IDS.has(routeId) ? routeId : '';
}

function regionalRouteDefinition(routeId) {
  const normalized = normalizeRegionalRouteId(routeId);
  return REGIONAL_ROUTE_DEFINITIONS.find((route) => route.routeId === normalized) || null;
}

function normalizeRegionalRouteStatus(value) {
  const status = String(value || '').trim().toUpperCase();
  return ['LOCKED', 'READY', 'ACTIVE', 'SHORTAGE'].includes(status) ? status : 'LOCKED';
}

function normalizeRegionalRoute(raw = {}) {
  const definition = regionalRouteDefinition(raw.routeId) || REGIONAL_ROUTE_DEFINITIONS[0];
  const shortage = raw.lastShortage && typeof raw.lastShortage === 'object'
    ? {
      resource: String(raw.lastShortage.resource || definition.resource),
      needed: normalizeCount(raw.lastShortage.needed),
      available: normalizeCount(raw.lastShortage.available),
      fromSettlementId: String(raw.lastShortage.fromSettlementId || definition.fromSettlementId),
      toSettlementId: String(raw.lastShortage.toSettlementId || definition.toSettlementId),
      reason: String(raw.lastShortage.reason || 'shortage'),
      failedAtMs: normalizeCount(raw.lastShortage.failedAtMs)
    }
    : null;
  return {
    routeId: definition.routeId,
    label: definition.label,
    fromSettlementId: definition.fromSettlementId,
    toSettlementId: definition.toSettlementId,
    resource: definition.resource,
    transferAmount: normalizeCount(definition.transferAmount),
    summary: definition.summary,
    status: normalizeRegionalRouteStatus(raw.status),
    openedAtMs: normalizeCount(raw.openedAtMs),
    lastTransferAtMs: normalizeCount(raw.lastTransferAtMs),
    lastFailureAtMs: normalizeCount(raw.lastFailureAtMs),
    totalTransfers: normalizeCount(raw.totalTransfers),
    lastShortage: shortage
  };
}

function normalizeRegionalContractId(value) {
  const contractId = String(value || '').trim();
  return REGIONAL_CONTRACT_IDS.has(contractId) ? contractId : '';
}

function regionalContractDefinition(contractId) {
  const normalized = normalizeRegionalContractId(contractId);
  return REGIONAL_CONTRACT_DEFINITIONS.find((contract) => contract.contractId === normalized) || null;
}

function normalizeRegionalContractStatus(value) {
  const status = String(value || '').trim().toUpperCase();
  return ['LOCKED', 'AVAILABLE', 'ACTIVE', 'READY_TO_TURN_IN', 'COMPLETED'].includes(status) ? status : 'LOCKED';
}

function normalizeRegionalContract(raw = {}) {
  const definition = regionalContractDefinition(raw.contractId) || REGIONAL_CONTRACT_DEFINITIONS[0];
  return {
    contractId: definition.contractId,
    routeId: definition.routeId,
    title: definition.title,
    requester: definition.requester,
    summary: definition.summary,
    fromSettlementId: definition.fromSettlementId,
    toSettlementId: definition.toSettlementId,
    requiredTransfers: normalizeCount(definition.requiredTransfers),
    reward: copyJson(definition.reward),
    status: normalizeRegionalContractStatus(raw.status),
    acceptedAtMs: normalizeCount(raw.acceptedAtMs),
    completedAtMs: normalizeCount(raw.completedAtMs),
    progressTransfers: Math.min(normalizeCount(raw.progressTransfers), normalizeCount(definition.requiredTransfers)),
    lastRouteId: normalizeRegionalRouteId(raw.lastRouteId)
  };
}

function normalizeRegionalNetwork(raw = {}) {
  const sourceRoutes = Array.isArray(raw.routes)
    ? Object.fromEntries(raw.routes.map((route) => [String(route?.routeId || ''), route]).filter(([routeId]) => routeId))
    : raw.routes && typeof raw.routes === 'object'
      ? raw.routes
      : {};
  const routes = {};
  for (const definition of REGIONAL_ROUTE_DEFINITIONS) {
    routes[definition.routeId] = normalizeRegionalRoute({
      ...(sourceRoutes[definition.routeId] || {}),
      routeId: definition.routeId
    });
  }

  const sourceContracts = Array.isArray(raw.contracts)
    ? Object.fromEntries(raw.contracts.map((contract) => [String(contract?.contractId || ''), contract]).filter(([contractId]) => contractId))
    : raw.contracts && typeof raw.contracts === 'object'
      ? raw.contracts
      : {};
  const contracts = {};
  for (const definition of REGIONAL_CONTRACT_DEFINITIONS) {
    contracts[definition.contractId] = normalizeRegionalContract({
      ...(sourceContracts[definition.contractId] || {}),
      contractId: definition.contractId
    });
  }

  return {
    version: 'v3.5',
    routes,
    contracts,
    updatedAtMs: normalizeCount(raw.updatedAtMs)
  };
}

function regionalGovernanceGate(state, { nowMs = Date.now() } = {}) {
  const settlement = normalizeSecondSettlement(state?.meta?.settlements?.secondSettlement || null);
  const operatingModel = normalizeOperatingModel(state?.meta?.operatingModel || {});
  const specialists = specialistsView(state, { nowMs });
  const criteria = [
    {
      id: 'ridge_outpost_active',
      label: 'Ridge Outpost is active',
      met: !!settlement && settlement.status === 'ACTIVE'
    },
    {
      id: 'charter',
      label: 'Town charter chosen',
      met: !!operatingModel.selectedCharterId
    },
    {
      id: 'specialist_lane',
      label: 'At least one specialist lane is staffed',
      met: specialists.activeAssignments.length > 0
    }
  ];
  const ready = criteria.every((entry) => entry.met === true);
  return {
    ready,
    criteria,
    summary: ready
      ? 'The Governor Ledger can open bounded regional routes.'
      : 'Stabilize Ridge Outpost, choose a charter, and staff a specialist lane before regional allocation.'
  };
}

function regionalSettlementName(settlementId, ledger = null) {
  const entry = Array.isArray(ledger?.settlements)
    ? ledger.settlements.find((settlement) => settlement.settlementId === settlementId)
    : null;
  if (entry?.name) return entry.name;
  return settlementId === 'town_1' ? 'Founders Plot' : settlementId === 'town_2' ? 'Ridge Outpost' : settlementId;
}

function regionalSharedReserves(ledger = {}) {
  const totals = emptyOutputBuffer();
  const settlements = Array.isArray(ledger.settlements) ? ledger.settlements : [];
  for (const settlement of settlements) {
    const inventory = normalizeInventory(settlement.inventory || {});
    for (const resource of Object.keys(totals)) {
      totals[resource] += normalizeCount(inventory[resource]);
    }
  }
  return totals;
}

function regionalRouteView(route, gate, ledger) {
  const storedStatus = normalizeRegionalRouteStatus(route.status);
  const visibleStatus = !gate.ready
    ? 'LOCKED'
    : ['ACTIVE', 'SHORTAGE'].includes(storedStatus)
      ? storedStatus
      : 'READY';
  return {
    ...copyJson(route),
    status: visibleStatus,
    fromSettlementName: regionalSettlementName(route.fromSettlementId, ledger),
    toSettlementName: regionalSettlementName(route.toSettlementId, ledger),
    ready: visibleStatus === 'READY',
    active: visibleStatus === 'ACTIVE',
    shortage: visibleStatus === 'SHORTAGE' ? copyJson(route.lastShortage) : null,
    summary: visibleStatus === 'SHORTAGE'
      ? `${route.label} is waiting on ${route.lastShortage?.resource || route.resource}.`
      : route.summary
  };
}

function regionalContractView(contract, routes) {
  const route = routes.find((entry) => entry.routeId === contract.routeId) || null;
  const storedStatus = normalizeRegionalContractStatus(contract.status);
  const routeActive = route && ['ACTIVE', 'SHORTAGE'].includes(route.status);
  const status = storedStatus === 'LOCKED' && routeActive ? 'AVAILABLE' : storedStatus;
  return {
    ...copyJson(contract),
    status,
    available: status === 'AVAILABLE',
    active: status === 'ACTIVE',
    readyToTurnIn: status === 'READY_TO_TURN_IN',
    completed: status === 'COMPLETED',
    routeLabel: route?.label || '',
    fromSettlementName: route?.fromSettlementName || contract.fromSettlementId,
    toSettlementName: route?.toSettlementName || contract.toSettlementId,
    progressLabel: `${normalizeCount(contract.progressTransfers)} / ${normalizeCount(contract.requiredTransfers)} shipments`
  };
}

function regionalLedgerView(state, { nowMs = Date.now() } = {}) {
  state.meta.regionalNetwork = normalizeRegionalNetwork(state?.meta?.regionalNetwork || {});
  const gate = regionalGovernanceGate(state, { nowMs });
  const settlementLedger = settlementLedgerView(state, { nowMs });
  const routes = Object.values(state.meta.regionalNetwork.routes).map((route) => regionalRouteView(route, gate, settlementLedger));
  const contracts = Object.values(state.meta.regionalNetwork.contracts).map((contract) => regionalContractView(contract, routes));
  const issues = [];
  for (const route of routes) {
    if (route.status === 'SHORTAGE') {
      issues.push({
        issueId: `route-shortage:${route.routeId}`,
        type: 'route_shortage',
        routeId: route.routeId,
        title: `${route.label} shortage`,
        summary: `${route.fromSettlementName} needs ${normalizeCount(route.shortage?.needed || route.transferAmount)} ${route.shortage?.resource || route.resource} before the next shipment.`
      });
    }
  }
  for (const contract of contracts) {
    if (contract.status === 'ACTIVE' && normalizeCount(contract.progressTransfers) < normalizeCount(contract.requiredTransfers)) {
      issues.push({
        issueId: `contract-transfer:${contract.contractId}`,
        type: 'regional_contract_waiting',
        contractId: contract.contractId,
        title: `${contract.title} needs a shipment`,
        summary: `${contract.fromSettlementName} and ${contract.toSettlementName} are linked by this request.`
      });
    }
  }
  const routeReady = routes.some((route) => route.status === 'READY');
  const routeActive = routes.some((route) => ['ACTIVE', 'SHORTAGE'].includes(route.status));
  const contractAvailable = contracts.some((contract) => contract.status === 'AVAILABLE');
  const contractReady = contracts.some((contract) => contract.status === 'READY_TO_TURN_IN');
  return {
    version: state.meta.regionalNetwork.version,
    gate,
    routes,
    contracts,
    sharedReserves: regionalSharedReserves(settlementLedger),
    issues,
    pendingIssueCount: issues.length,
    allowedActions: [
      routeReady ? 'open_supply_route' : '',
      routeActive ? 'transfer_supply_route' : '',
      contractAvailable ? 'accept_contract' : '',
      contractReady ? 'turn_in_contract' : ''
    ].filter(Boolean),
    summary: !gate.ready
      ? gate.summary
      : issues.length > 0
        ? `Regional ledger has ${issues.length} pending issue${issues.length === 1 ? '' : 's'}.`
        : routeActive
          ? 'The Ridge Supply Route is connecting Founders Plot and Ridge Outpost.'
          : 'A bounded regional route is ready to open.'
  };
}

function doctrineRuleEnabled(state, ruleId) {
  const normalized = normalizeDoctrineRuleId(ruleId);
  if (!normalized) return false;
  const doctrine = normalizeForemanDoctrine(state?.meta?.doctrine || {});
  return doctrine.ruleStates[normalized]?.enabled === true;
}

function doctrineRuleLabel(ruleId) {
  return doctrineRuleDefinition(ruleId)?.label || 'Clover preference';
}

function doctrineRuleLabels(ruleIds = []) {
  return (Array.isArray(ruleIds) ? ruleIds : [])
    .map((ruleId) => doctrineRuleLabel(ruleId))
    .filter(Boolean);
}

function doctrineConflictsFor(state, ruleId) {
  const definition = doctrineRuleDefinition(ruleId);
  if (!definition) return [];
  return (definition.conflicts || []).filter((conflictId) => doctrineRuleEnabled(state, conflictId));
}

function setDoctrineRuleState(state, { ruleId, enabled = true, nowMs = Date.now(), source = 'human' } = {}) {
  const normalized = normalizeDoctrineRuleId(ruleId);
  if (!normalized) {
    const error = new Error('INVALID_STATE');
    error.details = { ruleId };
    throw error;
  }
  const doctrine = normalizeForemanDoctrine(state?.meta?.doctrine || {});
  doctrine.ruleStates[normalized] = {
    enabled: enabled === true,
    updatedAtMs: normalizeCount(nowMs),
    source: String(source || '')
  };
  doctrine.latestRuleId = normalized;
  doctrine.updatedAtMs = normalizeCount(nowMs);
  doctrine.history = [
    ...(doctrine.history || []),
    {
      ruleId: normalized,
      enabled: enabled === true,
      source: String(source || ''),
      createdAtMs: normalizeCount(nowMs)
    }
  ].slice(-12);
  state.meta.doctrine = normalizeForemanDoctrine(doctrine);
  return state.meta.doctrine;
}

function foremanDoctrineView(state) {
  const doctrine = normalizeForemanDoctrine(state?.meta?.doctrine || {});
  const rules = FOREMAN_DOCTRINE_RULES.map((rule) => ({
    ruleId: rule.ruleId,
    label: rule.label,
    summary: rule.summary,
    conflicts: rule.conflicts.slice(),
    enabled: doctrine.ruleStates[rule.ruleId]?.enabled === true,
    updatedAtMs: normalizeCount(doctrine.ruleStates[rule.ruleId]?.updatedAtMs)
  }));
  const activeRules = rules.filter((rule) => rule.enabled);
  return {
    version: doctrine.version,
    activeRules: activeRules.map((rule) => ({
      ruleId: rule.ruleId,
      label: rule.label,
      summary: rule.summary
    })),
    rules,
    latestRuleId: doctrine.latestRuleId,
    updatedAtMs: doctrine.updatedAtMs,
    summary: activeRules.length > 0
      ? `Clover is following ${activeRules.map((rule) => rule.label.toLowerCase()).join(', ')}.`
      : 'No Clover preferences set yet.'
  };
}

function doctrineInfluenceLine(state) {
  const doctrine = foremanDoctrineView(state);
  return doctrine.activeRules.length > 0 ? doctrine.summary : '';
}

function doctrinePreferenceKey(state) {
  if (doctrineRuleEnabled(state, 'PREFER_RESERVES')) return 'PREFER_RESERVES';
  if (doctrineRuleEnabled(state, 'PREFER_SPEED')) return 'PREFER_SPEED';
  if (doctrineRuleEnabled(state, 'FINISH_ACTIVE_CONTRACTS_FIRST')) return 'FINISH_ACTIVE_CONTRACTS_FIRST';
  if (doctrineRuleEnabled(state, 'ASK_BEFORE_SPENDING')) return 'ASK_BEFORE_SPENDING';
  return '';
}

function publicSquareStyleForId(styleId = '') {
  const normalized = String(styleId || '').trim().toLowerCase();
  return PUBLIC_SQUARE_STYLES.find((style) => style.styleId === normalized) || null;
}

function normalizePublicSquareStyleId(styleId = '') {
  const normalized = String(styleId || '').trim().toLowerCase();
  return PUBLIC_SQUARE_STYLE_IDS.has(normalized) ? normalized : '';
}

function publicSquareStyleOptions() {
  return PUBLIC_SQUARE_STYLES.map((style) => copyJson(style));
}

const PUBLIC_CARD_FORBIDDEN_RE = /(?:\b(?:api[-_ ]?key|secret|token|bearer|authorization|provider|model|brain|runtime|worker|trace|logs?|events?|private|wallet|debug|openclaw)\b|sk-[a-z0-9_-]+)/i;

function safePublicCardText(value, fallback = '') {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text || PUBLIC_CARD_FORBIDDEN_RE.test(text)) return fallback;
  return text.slice(0, 180);
}

function normalizeLandmarks(raw = {}) {
  const publicSquare = raw.publicSquare && typeof raw.publicSquare === 'object' ? raw.publicSquare : {};
  const level = Math.min(1, Math.max(0, Math.floor(Number(publicSquare.level || 0) || 0)));
  const styleId = normalizePublicSquareStyleId(publicSquare.styleId);
  const style = publicSquareStyleForId(styleId);
  return {
    publicSquare: {
      landmarkId: 'public_square_welcome_sign',
      level,
      label: level >= 1 ? 'Welcome Sign' : 'Open Dust Lot',
      upgradedAtMs: normalizeCount(publicSquare.upgradedAtMs),
      styleId,
      styleLabel: style?.label || '',
      styleAppliedAtMs: normalizeCount(publicSquare.styleAppliedAtMs)
    }
  };
}

function landmarksView(state) {
  const landmarks = normalizeLandmarks(state?.meta?.landmarks || {});
  const publicSquare = landmarks.publicSquare;
  const style = publicSquareStyleForId(publicSquare.styleId);
  return {
    publicSquare: {
      ...copyJson(publicSquare),
      style: style ? copyJson(style) : null,
      availableStyles: publicSquareStyleOptions(),
      plotCardAvailable: normalizeCount(publicSquare.level) >= 1
    }
  };
}

function normalizeTownPostcardCapture(raw = {}) {
  const focusObjectId = String(raw.focusObjectId || 'PUBLIC_SQUARE').trim() || 'PUBLIC_SQUARE';
  const styleId = normalizePublicSquareStyleId(raw.publicSquareStyleId || raw.styleId);
  const style = publicSquareStyleForId(styleId);
  const stops = Array.isArray(raw.flyoverStops)
    ? raw.flyoverStops.map((entry) => ({
      objectId: String(entry?.objectId || '').trim(),
      label: String(entry?.label || '').trim()
    })).filter((entry) => entry.objectId && entry.label).slice(0, 5)
    : [];
  return {
    captureId: String(raw.captureId || '').trim(),
    schemaVersion: 'founders-plot.postcard.v1',
    title: safePublicCardText(raw.title, 'Agent Town: Founders Plot'),
    subtitle: safePublicCardText(raw.subtitle, style?.label || 'Frontier postcard'),
    publicSquareStyleId: style?.styleId || '',
    publicSquareStyleLabel: style?.label || '',
    focusObjectId,
    cameraMode: String(raw.cameraMode || 'postcard_flyover').trim() || 'postcard_flyover',
    cameraLabel: safePublicCardText(raw.cameraLabel, 'Public Square postcard'),
    flyoverStops: stops,
    generatedAtMs: normalizeCount(raw.generatedAtMs || raw.capturedAtMs)
  };
}

function normalizeTownPostcards(raw = {}) {
  const captures = Array.isArray(raw?.captures)
    ? raw.captures.map((entry) => normalizeTownPostcardCapture(entry)).filter((entry) => entry.captureId)
    : [];
  const latestCaptureId = String(raw?.latestCaptureId || captures[captures.length - 1]?.captureId || '').trim();
  return {
    version: 'v1.7',
    latestCaptureId,
    captures: captures.slice(-8),
    updatedAtMs: normalizeCount(raw?.updatedAtMs)
  };
}

function townPostcardView(state) {
  state.meta.townPostcards = normalizeTownPostcards(state?.meta?.townPostcards || {});
  const captures = state.meta.townPostcards.captures;
  const latest = captures.find((entry) => entry.captureId === state.meta.townPostcards.latestCaptureId)
    || captures[captures.length - 1]
    || null;
  const square = landmarksView(state).publicSquare || {};
  return {
    available: normalizeCount(square.level) >= 1,
    captureCount: captures.length,
    latest: latest ? copyJson(latest) : null,
    summary: latest
      ? `${latest.cameraLabel} captured for ${latest.publicSquareStyleLabel || 'the town'}.`
      : normalizeCount(square.level) >= 1
        ? 'Ready to capture a public postcard.'
        : 'Raise the Welcome Sign before capturing a postcard.'
  };
}

function normalizeResourceDelta(raw = {}) {
  return {
    wood: normalizeCount(raw.wood),
    stone: normalizeCount(raw.stone),
    food: normalizeCount(raw.food),
    coin: normalizeCount(raw.coin)
  };
}

function normalizeTownOpportunityOption(raw = {}) {
  return {
    optionId: String(raw.optionId || ''),
    label: String(raw.label || ''),
    body: String(raw.body || ''),
    cost: normalizeResourceDelta(raw.cost || {}),
    reward: {
      townXp: normalizeCount(raw?.reward?.townXp ?? raw?.reward?.town_xp),
      resources: normalizeResourceDelta(raw?.reward?.resources || raw?.reward?.resourceDelta || {})
    },
    signalDelta: normalizeSignalDelta(raw.signalDelta || {}),
    cloverTradeoff: {
      pro: String(raw?.cloverTradeoff?.pro || raw?.tradeoff?.pro || ''),
      con: String(raw?.cloverTradeoff?.con || raw?.tradeoff?.con || '')
    },
    outcomeTitle: String(raw.outcomeTitle || raw.label || ''),
    outcomeBody: String(raw.outcomeBody || raw.body || '')
  };
}

function normalizeTownOpportunity(raw = {}) {
  if (!raw || typeof raw !== 'object') return null;
  const opportunityId = String(raw.opportunityId || '');
  if (!opportunityId) return null;
  return {
    opportunityId,
    title: String(raw.title || ''),
    body: String(raw.body || ''),
    sourceObjectId: String(raw.sourceObjectId || 'PUBLIC_SQUARE'),
    offeredAtMs: normalizeCount(raw.offeredAtMs),
    options: Array.isArray(raw.options)
      ? raw.options.map((option) => normalizeTownOpportunityOption(option)).filter((option) => option.optionId)
      : []
  };
}

function normalizeTownOpportunityResult(raw = {}) {
  return {
    opportunityId: String(raw.opportunityId || ''),
    optionId: String(raw.optionId || ''),
    title: String(raw.title || raw.outcomeTitle || ''),
    body: String(raw.body || raw.outcomeBody || ''),
    cost: normalizeResourceDelta(raw.cost || {}),
    reward: {
      townXp: normalizeCount(raw?.reward?.townXp ?? raw?.reward?.town_xp),
      resources: normalizeResourceDelta(raw?.reward?.resources || raw?.reward?.resourceDelta || {})
    },
    signalDelta: normalizeSignalDelta(raw.signalDelta || {}),
    resolvedAtMs: normalizeCount(raw.resolvedAtMs)
  };
}

function normalizeTownOpportunities(raw = {}) {
  return {
    active: normalizeTownOpportunity(raw.active || raw.current || null),
    completed: Array.isArray(raw.completed)
      ? raw.completed.map((entry) => normalizeTownOpportunityResult(entry)).filter((entry) => entry.opportunityId && entry.optionId).slice(-8)
      : []
  };
}

function townOpportunityTemplateSnapshot(template, nowMs = Date.now()) {
  return normalizeTownOpportunity({
    opportunityId: template.opportunityId,
    title: template.title,
    body: template.body,
    sourceObjectId: template.sourceObjectId,
    offeredAtMs: nowMs,
    options: template.options
  });
}

function normalizeScenarioTask(raw = {}) {
  return {
    taskId: String(raw.taskId || ''),
    label: String(raw.label || ''),
    body: String(raw.body || ''),
    cost: normalizeResourceDelta(raw.cost || {}),
    signalDelta: normalizeSignalDelta(raw.signalDelta || {}),
    completed: raw.completed === true,
    completedAtMs: normalizeCount(raw.completedAtMs)
  };
}

function normalizeScenarioReward(raw = {}) {
  return {
    townXp: normalizeCount(raw?.townXp ?? raw?.town_xp),
    resources: normalizeResourceDelta(raw?.resources || raw?.resourceDelta || {}),
    signalDelta: normalizeSignalDelta(raw?.signalDelta || {})
  };
}

function normalizeCivicScenario(raw = {}) {
  if (!raw || typeof raw !== 'object') return null;
  const scenarioId = String(raw.scenarioId || '');
  if (!scenarioId) return null;
  const tasks = Array.isArray(raw.tasks)
    ? raw.tasks.map((task) => normalizeScenarioTask(task)).filter((task) => task.taskId)
    : [];
  const minCompletedTasks = Math.max(1, normalizeCount(raw.minCompletedTasks || Math.min(2, tasks.length || 1)));
  const completedTasks = tasks.filter((task) => task.completed === true).length;
  return {
    scenarioId,
    title: String(raw.title || ''),
    body: String(raw.body || ''),
    sourceObjectId: String(raw.sourceObjectId || 'PUBLIC_SQUARE'),
    status: String(raw.status || 'OFFERED').trim().toUpperCase(),
    startedAtMs: normalizeCount(raw.startedAtMs),
    dueAtMs: normalizeCount(raw.dueAtMs),
    completedAtMs: normalizeCount(raw.completedAtMs),
    missedAtMs: normalizeCount(raw.missedAtMs),
    minCompletedTasks,
    completedTasks,
    progress: Math.max(0, Math.min(1, completedTasks / Math.max(1, minCompletedTasks))),
    tasks,
    reward: normalizeScenarioReward(raw.reward || {}),
    softMiss: {
      signalDelta: normalizeSignalDelta(raw?.softMiss?.signalDelta || {}),
      recapLine: String(raw?.softMiss?.recapLine || '')
    }
  };
}

function normalizeCivicScenarios(raw = {}) {
  return {
    active: normalizeCivicScenario(raw.active || raw.current || null),
    completed: Array.isArray(raw.completed)
      ? raw.completed.map((entry) => normalizeCivicScenario(entry)).filter((entry) => entry && entry.scenarioId).slice(-8)
      : []
  };
}

function scenarioTemplateSnapshot(template, nowMs = Date.now()) {
  return normalizeCivicScenario({
    scenarioId: template.scenarioId,
    title: template.title,
    body: template.body,
    sourceObjectId: template.sourceObjectId,
    status: 'OFFERED',
    startedAtMs: 0,
    dueAtMs: 0,
    completedAtMs: 0,
    missedAtMs: 0,
    minCompletedTasks: template.minCompletedTasks,
    tasks: template.tasks,
    reward: template.reward,
    softMiss: template.softMiss,
    offeredAtMs: nowMs
  });
}

function normalizeForemanWorker(raw = {}) {
  return {
    lastWorkerCommandId: String(raw.lastWorkerCommandId || ''),
    lastWorkerTraceId: String(raw.lastWorkerTraceId || '')
  };
}

function defaultCreatorStateForManifest(manifest) {
  return {
    noticeCount: 0,
    featuredNotice: '',
    enabled: true,
    manifestId: String(manifest?.id || '')
  };
}

function normalizeCreatorInstallation(raw = {}) {
  const manifest = manifestById(raw.extensionId || raw.manifestId || raw.id) || null;
  const extensionId = String(manifest?.id || raw.extensionId || raw.manifestId || '').trim();
  const status = ['ACTIVE', 'DISABLED'].includes(String(raw.status || '').toUpperCase())
    ? String(raw.status || '').toUpperCase()
    : 'ACTIVE';
  const state = raw.state && typeof raw.state === 'object' ? raw.state : {};
  return {
    extensionId,
    manifestId: extensionId,
    buildingType: String(manifest?.buildingType || raw.buildingType || ''),
    objectId: String(manifest?.install?.objectId || raw.objectId || ''),
    label: String(manifest?.label || raw.label || 'Creator building'),
    summary: String(manifest?.summary || raw.summary || ''),
    status,
    installedAtMs: normalizeCount(raw.installedAtMs),
    disabledAtMs: normalizeCount(raw.disabledAtMs),
    updatedAtMs: normalizeCount(raw.updatedAtMs),
    state: {
      ...defaultCreatorStateForManifest(manifest),
      noticeCount: normalizeCount(state.noticeCount),
      featuredNotice: safeCreatorText(state.featuredNotice),
      enabled: status === 'ACTIVE',
      manifestId: extensionId
    }
  };
}

function normalizeCreatorExtensions(raw = {}) {
  const installedEntries = raw?.installed && typeof raw.installed === 'object' && !Array.isArray(raw.installed)
    ? Object.values(raw.installed)
    : Array.isArray(raw?.installed)
      ? raw.installed
      : [];
  const installed = {};
  for (const entry of installedEntries) {
    const normalized = normalizeCreatorInstallation(entry);
    if (normalized.extensionId && manifestById(normalized.extensionId)) {
      installed[normalized.extensionId] = normalized;
    }
  }
  const history = Array.isArray(raw?.history)
    ? raw.history.map((entry) => ({
      action: String(entry?.action || ''),
      extensionId: String(entry?.extensionId || ''),
      atMs: normalizeCount(entry?.atMs)
    })).filter((entry) => entry.action && entry.extensionId).slice(-24)
    : [];
  return {
    version: 'v4.5',
    installed,
    history,
    updatedAtMs: normalizeCount(raw?.updatedAtMs)
  };
}

function creatorExtensionGate(state, manifest) {
  const requiredHqLevel = normalizeCount(manifest?.install?.requiresHqLevel || 1);
  const criteria = [
    {
      id: 'hq_level',
      label: `Headquarters level ${requiredHqLevel}`,
      met: normalizeCount(state?.plot?.hqLevel) >= requiredHqLevel
    },
    {
      id: 'manifest_approved',
      label: 'Curated manifest approved',
      met: validateCreatorManifest(manifest).ok
    },
    {
      id: 'no_network_access',
      label: 'No network access',
      met: manifest?.moderation?.networkAccess === false
    },
    {
      id: 'curated_local_import',
      label: 'Curated local pack import',
      met: manifest?.source?.importMode === 'curated_local_pack' && manifest?.source?.externalUpload === false
    },
    {
      id: 'asset_governance',
      label: 'Asset governance approved',
      met: manifest?.assetGovernance?.status === 'APPROVED' && manifest?.assetGovernance?.promptProvenanceRequired === true
    },
    {
      id: 'credit_only_model',
      label: 'Credit-only creator model',
      met: manifest?.creatorEconomics?.revenueEnabled === false
    }
  ];
  return {
    ready: criteria.every((criterion) => criterion.met),
    criteria,
    summary: criteria.every((criterion) => criterion.met)
      ? 'Creator building can be installed.'
      : 'Creator building unlocks after HQ2 and approved-manifest checks.'
  };
}

function creatorExtensionsView(state) {
  state.meta.creatorExtensions = normalizeCreatorExtensions(state?.meta?.creatorExtensions || {});
  const manifests = approvedCreatorManifests();
  const installed = Object.values(state.meta.creatorExtensions.installed).map((entry) => {
    const manifest = manifestById(entry.extensionId) || {};
    return {
      extensionId: entry.extensionId,
      manifestId: entry.manifestId,
      buildingType: entry.buildingType,
      objectId: entry.objectId,
      label: entry.label,
      summary: entry.summary,
      status: entry.status,
      active: entry.status === 'ACTIVE',
      creator: copyJson(manifest.creator || {}),
      source: copyJson(manifest.source || {}),
      assetGovernance: copyJson(manifest.assetGovernance || {}),
      creatorEconomics: copyJson(manifest.creatorEconomics || {}),
      tools: (manifest.tools || []).map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: copyJson(tool.inputSchema || {}),
        resultSchema: copyJson(tool.resultSchema || {})
      })),
      state: copyJson(entry.state)
    };
  });
  const catalog = manifests.map((manifest) => {
    const entry = state.meta.creatorExtensions.installed[manifest.id] || null;
    const gate = creatorExtensionGate(state, manifest);
    return {
      extensionId: manifest.id,
      manifestId: manifest.id,
      buildingType: manifest.buildingType,
      objectId: manifest.install.objectId,
      label: manifest.label,
      summary: manifest.summary,
      creator: copyJson(manifest.creator || {}),
      source: copyJson(manifest.source || {}),
      assetGovernance: copyJson(manifest.assetGovernance || {}),
      creatorEconomics: copyJson(manifest.creatorEconomics || {}),
      moderation: {
        status: manifest.moderation.status,
        rating: manifest.moderation.rating,
        networkAccess: manifest.moderation.networkAccess,
        dataAccess: copyJson(manifest.moderation.dataAccess || [])
      },
      tools: (manifest.tools || []).map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: copyJson(tool.inputSchema || {}),
        resultSchema: copyJson(tool.resultSchema || {})
      })),
      gate,
      installed: !!entry,
      status: entry?.status || 'AVAILABLE',
      allowedActions: [
        ...(!entry && gate.ready ? ['install'] : []),
        ...(entry?.status === 'ACTIVE' ? ['post_notice', 'disable', 'remove'] : []),
        ...(entry?.status === 'DISABLED' ? ['install', 'remove'] : [])
      ]
    };
  });
  return {
    version: 'v4.5',
    summary: installed.length > 0
      ? `${installed.length} curated creator building${installed.length === 1 ? '' : 's'} attached.`
      : 'No creator buildings attached yet.',
    catalog,
    installed,
    history: copyJson(state.meta.creatorExtensions.history),
    pendingIssueCount: 0
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
    governance: normalizeForemanGovernance(raw.governance),
    doctrine: normalizeForemanDoctrine(raw.doctrine),
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
    townPostcards: normalizeTownPostcards(raw.townPostcards),
    townOpportunities: normalizeTownOpportunities(raw.townOpportunities),
    scenarios: normalizeCivicScenarios(raw.scenarios),
    settlements: normalizeSettlements(raw.settlements),
    operatingModel: normalizeOperatingModel(raw.operatingModel),
    specialists: normalizeSpecialists(raw.specialists),
    regionalNetwork: normalizeRegionalNetwork(raw.regionalNetwork),
    creatorExtensions: normalizeCreatorExtensions(raw.creatorExtensions),
    teachingPreferences: normalizeTeachingPreferences(raw.teachingPreferences),
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

function migrateStateV3ToV4(raw) {
  const next = raw && typeof raw === 'object' ? copyJson(raw) : {};
  const meta = next.meta && typeof next.meta === 'object' ? next.meta : {};
  meta.scenarios = normalizeCivicScenarios(meta.scenarios);
  meta.schemaVersion = 4;
  next.meta = meta;
  return next;
}

function migrateStateV4ToV5(raw) {
  const next = raw && typeof raw === 'object' ? copyJson(raw) : {};
  const meta = next.meta && typeof next.meta === 'object' ? next.meta : {};
  meta.landmarks = normalizeLandmarks(meta.landmarks);
  meta.schemaVersion = 5;
  next.meta = meta;
  return next;
}

function migrateStateV5ToV6(raw) {
  const next = raw && typeof raw === 'object' ? copyJson(raw) : {};
  const meta = next.meta && typeof next.meta === 'object' ? next.meta : {};
  meta.governance = normalizeForemanGovernance(meta.governance);
  meta.schemaVersion = 6;
  next.meta = meta;
  return next;
}

function migrateStateV6ToV7(raw) {
  const next = raw && typeof raw === 'object' ? copyJson(raw) : {};
  const meta = next.meta && typeof next.meta === 'object' ? next.meta : {};
  const doctrineSeed = {};
  const teaching = normalizeTeachingPreferences(meta.teachingPreferences || {});
  if (teaching.contractPreference === 'RESERVES') {
    doctrineSeed.activeRules = ['PREFER_RESERVES'];
  } else if (teaching.contractPreference === 'SPEED') {
    doctrineSeed.activeRules = ['PREFER_SPEED'];
  }
  if (teaching.askBeforeAutomation === true) {
    doctrineSeed.activeRules = [...(doctrineSeed.activeRules || []), 'ASK_BEFORE_SPENDING'];
  }
  meta.doctrine = normalizeForemanDoctrine(meta.doctrine || doctrineSeed);
  meta.schemaVersion = 7;
  next.meta = meta;
  return next;
}

function migrateStateV7ToV8(raw) {
  const next = raw && typeof raw === 'object' ? copyJson(raw) : {};
  const meta = next.meta && typeof next.meta === 'object' ? next.meta : {};
  meta.governance = normalizeForemanGovernance(meta.governance);
  meta.schemaVersion = 8;
  next.meta = meta;
  return next;
}

function migrateStateV8ToV9(raw) {
  const next = raw && typeof raw === 'object' ? copyJson(raw) : {};
  const meta = next.meta && typeof next.meta === 'object' ? next.meta : {};
  meta.settlements = normalizeSettlements(meta.settlements);
  meta.schemaVersion = 9;
  next.meta = meta;
  return next;
}

function migrateStateV9ToV10(raw) {
  const next = raw && typeof raw === 'object' ? copyJson(raw) : {};
  const meta = next.meta && typeof next.meta === 'object' ? next.meta : {};
  meta.operatingModel = normalizeOperatingModel(meta.operatingModel);
  meta.schemaVersion = 10;
  next.meta = meta;
  return next;
}

function migrateStateV10ToV11(raw) {
  const next = raw && typeof raw === 'object' ? copyJson(raw) : {};
  const meta = next.meta && typeof next.meta === 'object' ? next.meta : {};
  meta.specialists = normalizeSpecialists(meta.specialists);
  meta.schemaVersion = 11;
  next.meta = meta;
  return next;
}

function migrateStateV11ToV12(raw) {
  const next = raw && typeof raw === 'object' ? copyJson(raw) : {};
  const meta = next.meta && typeof next.meta === 'object' ? next.meta : {};
  meta.regionalNetwork = normalizeRegionalNetwork(meta.regionalNetwork);
  meta.schemaVersion = 12;
  next.meta = meta;
  return next;
}

function migrateStateV12ToV13(raw) {
  const next = raw && typeof raw === 'object' ? copyJson(raw) : {};
  const meta = next.meta && typeof next.meta === 'object' ? next.meta : {};
  meta.creatorExtensions = normalizeCreatorExtensions(meta.creatorExtensions);
  meta.schemaVersion = 13;
  next.meta = meta;
  return next;
}

function migrateStateV13ToV14(raw) {
  const next = raw && typeof raw === 'object' ? copyJson(raw) : {};
  const meta = next.meta && typeof next.meta === 'object' ? next.meta : {};
  meta.townPostcards = normalizeTownPostcards(meta.townPostcards);
  meta.schemaVersion = 14;
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
    toVersion = 3;
  }
  if (toVersion < FOUNDERS_PLOT_SCHEMA_VERSION) {
    migratedRaw = migrateStateV3ToV4(migratedRaw);
    toVersion = 4;
  }
  if (toVersion < FOUNDERS_PLOT_SCHEMA_VERSION) {
    migratedRaw = migrateStateV4ToV5(migratedRaw);
    toVersion = 5;
  }
  if (toVersion < FOUNDERS_PLOT_SCHEMA_VERSION) {
    migratedRaw = migrateStateV5ToV6(migratedRaw);
    toVersion = 6;
  }
  if (toVersion < FOUNDERS_PLOT_SCHEMA_VERSION) {
    migratedRaw = migrateStateV6ToV7(migratedRaw);
    toVersion = 7;
  }
  if (toVersion < FOUNDERS_PLOT_SCHEMA_VERSION) {
    migratedRaw = migrateStateV7ToV8(migratedRaw);
    toVersion = 8;
  }
  if (toVersion < FOUNDERS_PLOT_SCHEMA_VERSION) {
    migratedRaw = migrateStateV8ToV9(migratedRaw);
    toVersion = 9;
  }
  if (toVersion < FOUNDERS_PLOT_SCHEMA_VERSION) {
    migratedRaw = migrateStateV9ToV10(migratedRaw);
    toVersion = 10;
  }
  if (toVersion < FOUNDERS_PLOT_SCHEMA_VERSION) {
    migratedRaw = migrateStateV10ToV11(migratedRaw);
    toVersion = 11;
  }
  if (toVersion < FOUNDERS_PLOT_SCHEMA_VERSION) {
    migratedRaw = migrateStateV11ToV12(migratedRaw);
    toVersion = 12;
  }
  if (toVersion < FOUNDERS_PLOT_SCHEMA_VERSION) {
    migratedRaw = migrateStateV12ToV13(migratedRaw);
    toVersion = 13;
  }
  if (toVersion < FOUNDERS_PLOT_SCHEMA_VERSION) {
    migratedRaw = migrateStateV13ToV14(migratedRaw);
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
    'et.plot.town.set_identity',
    'et.plot.town.resolve_opportunity',
    'et.plot.journal.get_entries',
    'et.plot.contracts.get_state',
    'et.plot.contracts.accept',
    'et.plot.contracts.turn_in',
    'et.plot.scenarios.get_state',
    'et.plot.scenarios.start',
    'et.plot.scenarios.contribute',
    'et.plot.settlements.get_ledger',
    'et.plot.settlements.launch_expedition',
    'et.plot.settlements.focus',
    'et.plot.settlements.complete_founding_task',
    'et.plot.operating_model.get_state',
    'et.plot.operating_model.choose_charter',
    'et.plot.operating_model.unlock_capability',
    'et.plot.regional.get_ledger',
    'et.plot.regional.open_supply_route',
    'et.plot.regional.transfer_supply_route',
    'et.plot.regional.accept_contract',
    'et.plot.regional.turn_in_contract',
    'et.plot.creator.get_catalog',
    'et.plot.creator.install_building',
    'et.plot.creator.disable_building',
    'et.plot.creator.remove_building',
    'et.creator.notice_kiosk.post_notice',
    'et.foreman.specialists.get_state',
    'et.foreman.specialists.assign',
    'et.foreman.specialists.pause',
    'et.foreman.specialists.review_recommendation',
    'et.foreman.policy.get_standing_order',
    'et.foreman.policy.set_standing_order',
    'et.foreman.scheduler.get_status',
    'et.foreman.scheduler.enable_collect_ready_outputs',
    'et.foreman.scheduler.pause',
    'et.foreman.scheduler.resume',
    'et.foreman.governance.grant_lease',
    'et.foreman.governance.revoke_lease',
    'et.foreman.governance.raise_exception',
    'et.foreman.governance.resolve_exception',
    'et.foreman.governance.start_persistent',
    'et.foreman.governance.pause_persistent'
  ];
  if (state.plot.hqLevel >= 2) tools.push('et.plot.collect_outputs');
  if (state.plot.hqLevel >= 3) tools.push('et.plot.queue_job');
  if (state.plot.hqLevel >= 4) tools.push('et.plot.set_priority');
  if (operatingModelHasCapability(state, 'CHARTER_CONTRACTS')) tools.push('et.plot.operating_model.refresh_contracts');
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

function completedOpportunityIds(state) {
  return new Set((state?.meta?.townOpportunities?.completed || []).map((entry) => String(entry.opportunityId || '')));
}

function isTownOpportunityUnlocked(state, opportunityId) {
  const completed = completedOpportunityIds(state);
  if (opportunityId === FIRST_TOWN_OPPORTUNITY.opportunityId) {
    return Array.isArray(state.meta.firstCollectedTypes) && state.meta.firstCollectedTypes.includes('LUMBER_CAMP');
  }
  if (opportunityId === SUPPLY_COUNCIL_OPPORTUNITY.opportunityId) {
    return completed.has(FIRST_TOWN_OPPORTUNITY.opportunityId);
  }
  if (opportunityId === LEVEL_TWO_CHARTER_OPPORTUNITY.opportunityId) {
    return completed.has(SUPPLY_COUNCIL_OPPORTUNITY.opportunityId) && normalizeCount(state?.plot?.hqLevel) >= 2;
  }
  return false;
}

function ensureTownOpportunity(state, nowMs = Date.now()) {
  if (!state?.meta) return null;
  state.meta.townOpportunities = normalizeTownOpportunities(state.meta.townOpportunities);
  if (state.meta.townOpportunities.active) return state.meta.townOpportunities.active;
  const completed = completedOpportunityIds(state);
  const nextTemplate = TOWN_OPPORTUNITY_TEMPLATES.find((template) => (
    !completed.has(template.opportunityId) && isTownOpportunityUnlocked(state, template.opportunityId)
  ));
  if (!nextTemplate) return null;
  state.meta.townOpportunities.active = townOpportunityTemplateSnapshot(nextTemplate, nowMs);
  return state.meta.townOpportunities.active;
}

function activeTownOpportunity(state, nowMs = Date.now()) {
  return ensureTownOpportunity(state, nowMs);
}

function completedScenarioIds(state) {
  return new Set((state?.meta?.scenarios?.completed || []).map((entry) => String(entry.scenarioId || '')));
}

function isCivicScenarioUnlocked(state, scenarioId) {
  const completedContracts = Array.isArray(state?.meta?.contracts?.completed)
    ? state.meta.contracts.completed.length
    : 0;
  if (String(scenarioId || '') === STORM_PREP_SCENARIO.scenarioId) {
    return normalizeCount(state?.plot?.hqLevel) >= 3 && completedContracts >= 2;
  }
  return false;
}

function availableCivicScenarioOffers(state, nowMs = Date.now()) {
  state.meta.scenarios = normalizeCivicScenarios(state.meta.scenarios);
  if (state.meta.scenarios.active) return [];
  const completed = completedScenarioIds(state);
  return CIVIC_SCENARIO_TEMPLATES
    .filter((template) => !completed.has(template.scenarioId) && isCivicScenarioUnlocked(state, template.scenarioId))
    .map((template) => scenarioTemplateSnapshot(template, nowMs));
}

function activeCivicScenario(state) {
  state.meta.scenarios = normalizeCivicScenarios(state.meta.scenarios);
  return state.meta.scenarios.active || null;
}

function nextScenarioTask(state, scenario = activeCivicScenario(state)) {
  if (!scenario) return null;
  return (Array.isArray(scenario.tasks) ? scenario.tasks : []).find((task) => task.completed !== true) || null;
}

function civicScenarioView(state, nowMs = Date.now()) {
  const active = activeCivicScenario(state);
  const offers = availableCivicScenarioOffers(state, nowMs);
  const nextTask = active ? nextScenarioTask(state, active) : null;
  return {
    offers: copyJson(offers),
    active: active ? copyJson(active) : null,
    completed: copyJson(state.meta.scenarios.completed || []),
    recommendation: active
      ? {
        scenarioId: active.scenarioId,
        title: 'Clover scenario read',
        reason: nextTask
          ? `${active.title} needs ${nextTask.label.toLowerCase()} before the deadline.`
          : `${active.title} is ready to resolve.`
      }
      : offers[0]
        ? {
          scenarioId: offers[0].scenarioId,
          title: 'Clover scenario read',
          reason: `${offers[0].title} creates a short civic goal that competes with contract reserves.`
        }
        : null
  };
}

function canAffordCost(plot, cost = {}) {
  for (const [resource, amount] of Object.entries(cost || {})) {
    if (normalizeCount(amount) > normalizeCount(plot?.inventory?.[resource])) return false;
  }
  return true;
}

function missingResourcesForCost(plot, cost = {}) {
  const missing = {};
  for (const [resource, amount] of Object.entries(cost || {})) {
    const need = normalizeCount(amount);
    const have = normalizeCount(plot?.inventory?.[resource]);
    if (need > have) missing[resource] = need - have;
  }
  return missing;
}

function buildingCatalog(state) {
  return BUILDING_TYPES
    .filter((type) => type !== 'HQ')
    .map((type) => {
      const rule = BUILDING_RULES[type];
      const unlocked = normalizeCount(state?.plot?.hqLevel) >= normalizeCount(rule.unlockLevel);
      const buildCost = copyJson(rule.buildCost || {});
      const missing = unlocked ? missingResourcesForCost(state.plot, buildCost) : {};
      return {
        type,
        label: rule.label,
        unlockLevel: rule.unlockLevel,
        buildCost,
        buildDurationMs: rule.buildDurationMs,
        unlocked,
        affordable: unlocked && Object.keys(missing).length === 0,
        missing
      };
    });
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

function latestCompletedContract(state) {
  const completed = Array.isArray(state?.meta?.contracts?.completed) ? state.meta.contracts.completed : [];
  return completed.length > 0 ? completed[completed.length - 1] : null;
}

function contractResourceNeedTotal(contract) {
  const resources = contract?.requirements?.resources || {};
  return ['wood', 'stone', 'food', 'coin'].reduce((total, key) => total + normalizeCount(resources[key]), 0);
}

function contractMissingNeedTotal(state, contract) {
  const status = contractRequirementStatus(state, contract);
  const resourceMissing = Object.values(status.missing || {}).reduce((total, value) => total + normalizeCount(value), 0);
  return status.ready ? 0 : Math.max(1, resourceMissing);
}

function contractOfferScore(state, contract) {
  let score = 100;
  const teaching = normalizeTeachingPreferences(state?.meta?.teachingPreferences || {});
  const prefersReserves = doctrineRuleEnabled(state, 'PREFER_RESERVES') || teaching.contractPreference === 'RESERVES';
  const prefersSpeed = doctrineRuleEnabled(state, 'PREFER_SPEED') || teaching.contractPreference === 'SPEED';
  const status = contractRequirementStatus(state, contract);
  const resourceNeed = contractResourceNeedTotal(contract);
  const missingNeed = contractMissingNeedTotal(state, contract);

  if (status.ready) score += 24;
  score -= missingNeed * 4;

  if (prefersReserves) {
    score -= resourceNeed * 3;
    if (contract.kind === 'BUILD') score += 18;
    if (status.ready) score += 8;
  } else if (prefersSpeed) {
    score -= missingNeed * 7;
    if (status.ready) score += 22;
    if (contract.kind === 'SUPPLY') score += 5;
  }

  if (teaching.latestCorrection === 'DO_THIS_AGAIN') {
    if (teaching.repeatRequesterId && teaching.repeatRequesterId === contract.requesterId) score += 18;
    if (teaching.repeatContractKind && teaching.repeatContractKind === contract.kind) score += 12;
  }
  score += operatingModelContractScoreAdjustment(state, contract);

  return score;
}

function rankContractOffersForPreference(state, offers = []) {
  return (Array.isArray(offers) ? offers : [])
    .map((offer, index) => ({
      offer,
      index,
      score: contractOfferScore(state, offer)
    }))
    .sort((left, right) => (
      right.score - left.score
      || left.index - right.index
      || String(left.offer?.contractId || '').localeCompare(String(right.offer?.contractId || ''))
    ))
    .map((entry) => entry.offer);
}

function recommendContractChoice(state, offers = null) {
  const active = activeContract(state);
  const doctrineKey = doctrinePreferenceKey(state);
  const doctrineInfluence = doctrineInfluenceLine(state);
  if (active) {
    const status = contractRequirementStatus(state, active);
    const missingSummary = Object.entries(status.missing || {})
      .filter(([, amount]) => normalizeCount(amount) > 0)
      .map(([key, amount]) => `${normalizeCount(amount)} ${String(key).toLowerCase()}`)
      .join(', ');
    return {
      contractId: active.contractId,
      mode: active.status === 'READY_TO_TURN_IN' || status.ready ? 'turn_in' : 'active',
      title: active.status === 'READY_TO_TURN_IN' || status.ready ? 'Turn this in' : 'Work this request',
      reason: active.status === 'READY_TO_TURN_IN' || status.ready
        ? `${contractRequesterName(active)} is ready for ${active.title}.`
        : `${contractRequesterName(active)} still needs ${missingSummary || 'the requested work'}.`,
      requesterName: contractRequesterName(active),
      preference: doctrineKey || normalizeTeachingPreferences(state?.meta?.teachingPreferences || {}).contractPreference || '',
      doctrineInfluence,
      operatingModelInfluence: operatingModelInfluenceLine(state)
    };
  }

  const pool = Array.isArray(offers) ? offers : state?.meta?.contracts?.offers || [];
  if (pool.length === 0) return null;
  const ranked = rankContractOffersForPreference(state, pool);
  const recommended = ranked[0] || null;
  if (!recommended) return null;
  const teaching = normalizeTeachingPreferences(state?.meta?.teachingPreferences || {});
  const operatingReason = operatingModelContractReason(state);
  const preferenceReason = operatingReason
    ? operatingReason
    : doctrineRuleEnabled(state, 'PREFER_RESERVES') || teaching.contractPreference === 'RESERVES'
    ? 'Clover is favoring a request that protects reserves.'
    : doctrineRuleEnabled(state, 'PREFER_SPEED') || teaching.contractPreference === 'SPEED'
      ? 'Clover is favoring the fastest completable request.'
      : doctrineRuleEnabled(state, 'FINISH_ACTIVE_CONTRACTS_FIRST')
        ? 'Clover is favoring the request most likely to become active work quickly.'
      : teaching.latestCorrection === 'DO_THIS_AGAIN'
        ? 'Clover is favoring a familiar requester or request type.'
        : 'Clover is balancing requester need, readiness, and town momentum.';
  return {
    contractId: recommended.contractId,
    mode: 'offer',
    title: 'Clover pick',
    reason: `${preferenceReason} ${contractRequesterName(recommended)} is asking for ${recommended.title}.`,
    requesterName: contractRequesterName(recommended),
    preference: doctrineKey || teaching.contractPreference || teaching.latestCorrection || '',
    doctrineInfluence,
    operatingModelInfluence: operatingModelInfluenceLine(state)
  };
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
    builtTypes,
    operatingCharterId: normalizeOperatingCharterId(state?.meta?.operatingModel?.selectedCharterId)
  });
}

function refreshContractBoard(state, nowMs = Date.now()) {
  if (state.plot.hqLevel < 2) return [];
  if (activeContract(state)) return state.meta.contracts.offers;
  const offers = rankContractOffersForPreference(state, generateContractBoardOffers({
    state,
    nowMs,
    refreshCount: state.meta.contractDeck.refreshCount,
    recentContractKeys: state.meta.contractDeck.recentContractKeys,
    idFactory: () => randomId('con')
  }).map((offer) => normalizeContract(offer)));
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

function firstReadyOutputBuilding(state) {
  return state.buildings.find((building) => (
    building
    && building.type !== 'HQ'
    && (
      building.state === 'OUTPUT_READY'
      || completedUnclaimedJobsForBuilding(state, building.buildingId).length > 0
    )
  )) || null;
}

function producerForResource(state, resource) {
  const producerTypes = {
    wood: 'LUMBER_CAMP',
    food: 'FARM_PLOT',
    stone: 'QUARRY',
    coin: 'MARKET_STALL'
  };
  const type = producerTypes[String(resource || '')] || '';
  if (!type) return null;
  return state.buildings.find((building) => (
    building.type === type
    && building.state !== 'UNDER_CONSTRUCTION'
    && building.state !== 'UPGRADING'
  )) || null;
}

function hqUpgradeWorkAction(state, rule, targetLevel) {
  const collectTarget = firstReadyOutputBuilding(state);
  if (collectTarget) {
    return {
      body: `${BUILDING_RULES[collectTarget.type]?.label || 'A building'} has finished output. Collect it before opening Headquarters level ${targetLevel}.`,
      primaryAction: { type: 'COLLECT_OUTPUTS', buildingId: collectTarget.buildingId }
    };
  }

  const missingResources = Object.keys(missingResourcesForCost(state.plot, rule.cost || {}));
  for (const resource of missingResources) {
    const producer = producerForResource(state, resource);
    if (!producer) continue;
    const running = runningJobForBuilding(state, producer.buildingId);
    const label = BUILDING_RULES[producer.type]?.label || 'producer';
    if (running) {
      return {
        body: `${label} is working on the supplies for Headquarters level ${targetLevel}. Collect the output when it finishes.`,
        primaryAction: null,
        primaryCtaLabel: 'Work in progress'
      };
    }
    const production = BUILDING_RULES[producer.type]?.production?.[producer.level] || null;
    if (producer.state === 'READY' && production && canAffordCost(state.plot, production.input || {})) {
      return {
        body: `Queue ${label} to gather ${missingResourceSummary(rule.cost, state.plot.inventory)} before opening Headquarters level ${targetLevel}.`,
        primaryAction: { type: 'QUEUE_JOB', buildingId: producer.buildingId }
      };
    }
  }

  return null;
}

function hqUpgradeQuest(state, {
  step,
  targetLevel,
  readyTitle,
  readyBody,
  progressTitle,
  progressBody
}) {
  const hq = getHqBuilding(state);
  const running = hq ? runningJobForBuilding(state, hq.buildingId) : null;
  if (running?.kind === 'UPGRADE') {
    const collectTarget = firstReadyOutputBuilding(state);
    if (collectTarget) {
      return {
        step: `${step}_collect_ready`,
        title: 'Collect while Headquarters opens',
        body: `${BUILDING_RULES[collectTarget.type]?.label || 'A building'} has finished output while Headquarters level ${targetLevel} is underway.`,
        primaryAction: { type: 'COLLECT_OUTPUTS', buildingId: collectTarget.buildingId }
      };
    }
    return {
      step,
      title: progressTitle,
      body: progressBody,
      primaryAction: null,
      primaryCtaLabel: 'Work in progress'
    };
  }
  const rule = HQ_UPGRADE_RULES[state.plot.hqLevel];
  if (rule && (state.plot.townXp < rule.xpRequired || !canAffordCost(state.plot, rule.cost || {}))) {
    const workAction = hqUpgradeWorkAction(state, rule, targetLevel);
    const missingResources = missingResourceSummary(rule.cost, state.plot.inventory);
    return {
      step,
      title: readyTitle,
      body: workAction?.body || (
        state.plot.townXp < rule.xpRequired
          ? `Earn ${rule.xpRequired - state.plot.townXp} more town XP before opening Headquarters level ${targetLevel}.`
          : `Gather ${missingResources || 'the remaining supplies'} before opening Headquarters level ${targetLevel}.`
      ),
      primaryAction: workAction?.primaryAction || null,
      primaryCtaLabel: workAction?.primaryCtaLabel || ''
    };
  }
  return {
    step,
    title: readyTitle,
    body: readyBody,
    primaryAction: { type: 'UPGRADE_HQ' }
  };
}

function summarizeResourceBlock(resources = {}) {
  return ['wood', 'stone', 'food', 'coin']
    .map((key) => normalizeCount(resources?.[key]) > 0 ? `${normalizeCount(resources[key])} ${key}` : '')
    .filter(Boolean)
    .join(', ');
}

function scenarioTaskSummary(task) {
  const cost = summarizeResourceBlock(task?.cost || {});
  return cost ? `${task.label} needs ${cost}.` : `${task?.label || 'A scenario task'} is ready.`;
}

function scenarioQuest(state) {
  const scenario = activeCivicScenario(state);
  if (scenario) {
    const task = nextScenarioTask(state, scenario);
    if (task) {
      return {
        step: 'progress_civic_scenario',
        title: `${scenario.title}: ${task.label}`,
        body: `${task.body || scenario.body} ${scenarioTaskSummary(task)}`,
        primaryAction: {
          type: 'CONTRIBUTE_SCENARIO',
          scenarioId: scenario.scenarioId,
          taskId: task.taskId
        }
      };
    }
    return {
      step: 'finish_civic_scenario',
      title: `${scenario.title} is ready`,
      body: 'The civic project has enough preparation to resolve cleanly.',
      primaryAction: { type: 'VIEW_SCENARIO_BOARD', scenarioId: scenario.scenarioId }
    };
  }
  const offers = availableCivicScenarioOffers(state);
  if (offers.length > 0) {
    const offer = offers[0];
    return {
      step: 'start_civic_scenario',
      title: `Start ${offer.title}`,
      body: `${offer.body} It will compete with the next town requests for wood, food, and coin.`,
      primaryAction: { type: 'START_SCENARIO', scenarioId: offer.scenarioId }
    };
  }
  return null;
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
    return hqUpgradeQuest(state, {
      step: 'upgrade_hq_2',
      targetLevel: 2,
      readyTitle: 'Open Headquarters level 2',
      readyBody: 'Spend your first timber and provisions to unlock the Farm Plot and the town contract board.',
      progressTitle: 'Headquarters level 2 is opening',
      progressBody: 'The Headquarters upgrade is underway. Keep collecting finished output while the work crew finishes.'
    });
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
  const completedContracts = Array.isArray(state?.meta?.contracts?.completed)
    ? state.meta.contracts.completed.length
    : 0;
  if (!contract && completedContracts === 0 && Array.isArray(state.meta.contracts.offers) && state.meta.contracts.offers.length > 0) {
    return {
      step: 'choose_first_contract',
      title: 'Choose who to help first',
      body: 'Pick one living town request from the Contract Board.',
      primaryAction: { type: 'VIEW_CONTRACT_BOARD' }
    };
  }
  const civicScenarioQuest = scenarioQuest(state);
  if (civicScenarioQuest) {
    return civicScenarioQuest;
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
    return hqUpgradeQuest(state, {
      step: 'upgrade_hq_3',
      targetLevel: 3,
      readyTitle: 'Reach Headquarters level 3',
      readyBody: 'Spend wood and stored food to unlock the Quarry and the next production lane.',
      progressTitle: 'Headquarters level 3 is underway',
      progressBody: 'The Headquarters upgrade is underway. Collect any ready output while the crew finishes.'
    });
  }
  const publicSquareLevel = normalizeCount(state?.meta?.landmarks?.publicSquare?.level);
  if (
    !contract
    && completedContracts === 1
    && (state.plot.hqLevel >= 3 || publicSquareLevel >= 1)
    && Array.isArray(state.meta.contracts.offers)
    && state.meta.contracts.offers.length > 0
  ) {
    return {
      step: 'choose_second_contract',
      title: 'Choose the next town request',
      body: 'The first request is complete. Pick the next neighbor, depot, or market need from the Contract Board.',
      primaryAction: { type: 'VIEW_CONTRACT_BOARD' }
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
    return hqUpgradeQuest(state, {
      step: 'upgrade_hq_4',
      targetLevel: 4,
      readyTitle: 'Reach Headquarters level 4',
      readyBody: 'This expands your storage and opens the Workshop for construction buffs.',
      progressTitle: 'Headquarters level 4 is underway',
      progressBody: 'The Headquarters upgrade is underway. Keep the town productive while the crew finishes.'
    });
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
    return hqUpgradeQuest(state, {
      step: 'upgrade_hq_5',
      targetLevel: 5,
      readyTitle: 'Reach Headquarters level 5',
      readyBody: 'Open the Market Stall and the final Phase 1 foreman permission tier.',
      progressTitle: 'Headquarters level 5 is underway',
      progressBody: 'The Headquarters upgrade is underway. Keep collecting ready output until it finishes.'
    });
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
    'upgrade_hq_2_collect_ready',
    'place_farm_plot',
    'choose_first_contract',
    'turn_in_contract',
    'progress_contract',
    'collect_first_food',
    'upgrade_hq_3',
    'upgrade_hq_3_collect_ready',
    'choose_second_contract',
    'start_civic_scenario',
    'progress_civic_scenario',
    'finish_civic_scenario',
    'grant_queue_permission',
    'place_quarry',
    'collect_first_stone',
    'upgrade_hq_4',
    'upgrade_hq_4_collect_ready'
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
  const opportunity = activeTownOpportunity(state, nowMs);
  if (opportunity) {
    return {
      owner: 'opportunity',
      priority: 2,
      title: opportunity.title,
      body: opportunity.body,
      primaryAction: {
        type: 'VIEW_TOWN_OPPORTUNITY',
        opportunityId: opportunity.opportunityId
      }
    };
  }
  const contract = activeContract(state);
  const latestReceipt = latestForemanReceipt(state);
  if (['start_civic_scenario', 'progress_civic_scenario', 'finish_civic_scenario'].includes(String(quest.step || ''))) {
    return {
      owner: 'scenario',
      priority: 3,
      title: quest.title,
      body: quest.body,
      primaryAction: quest.primaryAction,
      primaryCtaLabel: quest.primaryCtaLabel || ''
    };
  }
  if (isTutorialQuestStep(quest.step)) {
    return {
      owner: 'tutorial',
      priority: 3,
      title: quest.title,
      body: quest.body,
      primaryAction: quest.primaryAction,
      primaryCtaLabel: quest.primaryCtaLabel || ''
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
  if (canChoosePublicSquareStyle(state)) {
    return {
      owner: 'identity',
      priority: 8,
      title: 'Choose the square style',
      body: 'Pick how the Public Square greets visitors. This changes the town look without spending supplies.',
      primaryAction: {
        type: 'VIEW_TOWN_IDENTITY',
        landmarkId: 'public_square_welcome_sign'
      }
    };
  }
  return {
    owner: 'optimization',
    priority: 7,
    title: quest.title,
    body: quest.body,
    primaryAction: quest.primaryAction,
    primaryCtaLabel: quest.primaryCtaLabel || ''
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

function buildForemanObservation(state, { runtimeId = '', nowMs = Date.now(), recentEvents = [], runtimeScope = 'active_foreman_session' } = {}) {
  ensureContractBoard(state, nowMs);
  refreshActiveContractState(state, nowMs);
  const goal = resolvePrimaryGoal(state, { nowMs });
  const mappedGoalOwner = goal.owner === 'approval'
    ? 'approval'
    : goal.owner === 'contract_ready' || goal.owner === 'contract_progress'
      ? 'active_contract'
      : goal.owner === 'receipt'
      ? 'foreman'
      : goal.owner === 'opportunity'
        ? 'town_opportunity'
        : goal.owner === 'scenario'
          ? 'civic_scenario'
          : 'tutorial';
  const companion = companionAdvice(state, { goal });
  return {
    schema: 'founders-plot.obs.v1.2',
    schemaVersion: 'founders-plot.obs.v1.2',
    plotId: state.plot.plotId,
    nowMs,
    runtimeId: String(runtimeId || ''),
    runtimeScope: String(runtimeScope || 'active_foreman_session'),
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
    townOpportunity: copyJson(state.meta.townOpportunities?.active || null),
    scenario: copyJson(activeCivicScenario(state) || null),
    companionAdvice: copyJson(companion),
    doctrine: foremanDoctrineView(state),
    specialists: specialistsView(state, { nowMs }),
    regionalNetwork: regionalLedgerView(state, { nowMs }),
    teachingPreferences: copyJson(state.meta.teachingPreferences),
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
  let matchesContractNeed = false;
  if (contract?.status === 'ACTIVE' || contract?.status === 'READY_TO_TURN_IN') {
    const requirementResource = ['wood', 'stone', 'food', 'coin'].find((resource) => (
      normalizeCount(contract?.requirements?.resources?.[resource]) > 0
      || normalizeCount(contract?.requirements?.[resource]) > 0
    )) || '';
    matchesContractNeed = !!(requirementResource && normalizeCount(building?.outputBuffer?.[requirementResource]) > 0);
    if (matchesContractNeed) score += 30;
  }
  if (foremanStandingOrder(state) === 'CAREFUL_STEWARD') {
    score += building?.type === 'FARM_PLOT' ? 12 : 4;
  } else {
    score += building?.type === 'LUMBER_CAMP' ? 12 : 6;
  }
  if (doctrineRuleEnabled(state, 'FINISH_ACTIVE_CONTRACTS_FIRST') && matchesContractNeed) score += 22;
  if (doctrineRuleEnabled(state, 'PREFER_SPEED')) {
    const outputTotal = Object.values(building?.outputBuffer || {}).reduce((total, amount) => total + normalizeCount(amount), 0);
    score += Math.min(16, outputTotal * 2);
  }
  if (doctrineRuleEnabled(state, 'PREFER_RESERVES') && building?.type === 'FARM_PLOT') score += 6;
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
  const persistentRuntime = String(observation?.runtimeScope || '') === 'background_foreman_pool';
  const schedulerCanRun = scheduler.enabled === true
    && scheduler.paused !== true
    && (observation?.claimLease === true ? claimSchedulerLease(state, observation?.runtimeId, normalizeCount(observation?.nowMs)) : true);
  if (
    (runtime.status !== 'PAUSED' || persistentRuntime)
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
  const doctrineInfluence = observation?.doctrine?.activeRules?.length > 0
    ? observation.doctrine.summary
    : '';
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
      doctrineInfluence,
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
  const opportunity = activeTownOpportunity(state);
  if (opportunity) {
    return 'A town opportunity is waiting at the Public Square. Compare the costs and choose the mood you want the settlement to grow toward.';
  }
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

function missingResourceSummary(cost = {}, inventory = {}) {
  return ['wood', 'stone', 'food', 'coin']
    .map((key) => {
      const missing = Math.max(0, normalizeCount(cost?.[key]) - normalizeCount(inventory?.[key]));
      return missing > 0 ? `${missing} ${key}` : '';
    })
    .filter(Boolean)
    .join(', ');
}

function firstOpenPadObjectId(state) {
  const pad = BUILD_PADS.find((entry) => !state.buildings.some((building) => building.x === entry.x && building.y === entry.y));
  return pad ? `PAD:${pad.x},${pad.y}` : 'HQ';
}

function companionOpportunitySceneLine(opportunity) {
  switch (String(opportunity?.opportunityId || '')) {
    case 'first_campfire_choice':
      return 'Clover: waymarkers grow depot reach; supper grows goodwill.';
    case 'first_supply_council_choice':
      return 'Clover: haulers are faster; work bee saves coin.';
    case 'level_two_charter_choice':
      return 'Clover: farm co-op buys food safety; request board builds contract momentum.';
    default:
      return 'Clover: compare cost, reward, and town mood before choosing.';
  }
}

function companionOptionTradeoffs(opportunity) {
  return (Array.isArray(opportunity?.options) ? opportunity.options : []).map((option) => ({
    optionId: option.optionId,
    label: option.label,
    pro: String(option?.cloverTradeoff?.pro || 'Useful for the current town plan.'),
    con: String(option?.cloverTradeoff?.con || 'Changes the next resource tradeoff.')
  }));
}

function companionAdvice(state, { goal = null } = {}) {
  const opportunity = activeTownOpportunity(state);
  if (opportunity) {
    const tradeoffs = companionOptionTradeoffs(opportunity);
    return {
      mode: 'town_choice_tradeoff',
      headline: 'Clover tradeoff',
      sceneLine: companionOpportunitySceneLine(opportunity),
      recommendation: 'Clover sees a town opportunity at the Public Square; compare choices before spending because each option changes the next bottleneck.',
      targetObjectId: 'PUBLIC_SQUARE',
      bottleneck: 'town_choice',
      tradeoffs
    };
  }

  const quest = goal || resolvePrimaryGoal(state);
  const step = String(nextQuest(state).step || '');
  if (step === 'place_lumber_camp') {
    return {
      mode: 'bottleneck',
      headline: 'Clover bottleneck',
      sceneLine: 'Clover: start with wood; every early unlock needs it.',
      recommendation: 'Clover suggests placing a Lumber Camp first so the town can fund construction, choices, and HQ2.',
      targetObjectId: firstOpenPadObjectId(state),
      bottleneck: 'wood'
    };
  }

  const firstProduction = {
    collect_first_wood: 'LUMBER_CAMP',
    collect_first_food: 'FARM_PLOT',
    collect_first_stone: 'QUARRY'
  }[step] || '';
  if (firstProduction) {
    const building = state.buildings.find((entry) => entry.type === firstProduction) || null;
    const label = BUILDING_RULES[firstProduction]?.label || firstProduction;
    const runningJob = building ? runningJobForBuilding(state, building.buildingId) : null;
    const completedJobs = building ? completedUnclaimedJobsForBuilding(state, building.buildingId) : [];
    if (building?.state === 'UNDER_CONSTRUCTION' || building?.state === 'UPGRADING') {
      return {
        mode: 'timer',
        headline: 'Clover timer',
        sceneLine: `Clover: ${label.toLowerCase()} is building; queue work when it opens.`,
        recommendation: `Wait for ${label} construction to finish, then queue its first production job.`,
        targetObjectId: firstProduction,
        bottleneck: 'construction_timer'
      };
    }
    if (completedJobs.length > 0 || building?.state === 'OUTPUT_READY') {
      return {
        mode: 'next_action',
        headline: 'Clover next step',
        sceneLine: `Clover: collect ${label.toLowerCase()} output before spending again.`,
        recommendation: `Collect the ready ${label} output. That clears the current bottleneck and reveals the next choice.`,
        targetObjectId: firstProduction,
        bottleneck: 'ready_output'
      };
    }
    if (building?.state === 'READY' && !runningJob) {
      return {
        mode: 'next_action',
        headline: 'Clover next step',
        sceneLine: `Clover: queue ${label.toLowerCase()} now; the next unlock needs it.`,
        recommendation: `Queue one ${label} job, then collect the first haul before upgrading or branching.`,
        targetObjectId: firstProduction,
        bottleneck: 'idle_producer'
      };
    }
    if (runningJob) {
      return {
        mode: 'timer',
        headline: 'Clover timer',
        sceneLine: `Clover: ${label.toLowerCase()} is working; watch the timer.`,
        recommendation: `Let the ${label} finish, then collect immediately so the town can move on.`,
        targetObjectId: firstProduction,
        bottleneck: 'production_timer'
      };
    }
    return {
      mode: 'timer',
      headline: 'Clover timer',
      sceneLine: `Clover: ${label.toLowerCase()} is not ready yet; check the build slot.`,
      recommendation: `Get ${label} built before chasing the next Headquarters milestone.`,
      targetObjectId: firstProduction,
      bottleneck: 'construction_timer'
    };
  }

  if (step.startsWith('upgrade_hq') || String(quest?.primaryAction?.type || '') === 'UPGRADE_HQ') {
    const rule = HQ_UPGRADE_RULES[state.plot.hqLevel] || null;
    const missing = rule ? missingResourceSummary(rule.cost || {}, state.plot.inventory || {}) : '';
    return {
      mode: missing ? 'bottleneck' : 'unlock',
      headline: missing ? 'Clover bottleneck' : 'Clover unlock',
      sceneLine: missing
        ? `Clover: HQ upgrade still needs ${missing}.`
        : 'Clover: upgrade HQ now; it opens the next play lane.',
      recommendation: missing
        ? `Close the resource gap for HQ${rule?.nextLevel || state.plot.hqLevel + 1}: ${missing}.`
        : 'Start the Headquarters upgrade while the town has enough stores.',
      targetObjectId: 'HQ',
      bottleneck: missing ? 'hq_resources' : 'hq_unlock'
    };
  }

  const scenario = activeCivicScenario(state);
  if (scenario) {
    const task = nextScenarioTask(state, scenario);
    const taskCost = task ? summarizeResourceBlock(task.cost || {}) : '';
    return {
      mode: task ? 'scenario_pressure' : 'scenario_ready',
      headline: 'Clover scenario read',
      sceneLine: task
        ? `Clover: ${scenario.title} needs ${task.label.toLowerCase()}.`
        : `Clover: ${scenario.title} is ready to recap.`,
      recommendation: task
        ? `${scenario.title} is competing with town requests for ${taskCost || 'supplies'}. Finish ${task.label.toLowerCase()} if you want the cleaner outcome.`
        : `${scenario.title} has enough prep. Check the Public Square for the outcome.`,
      targetObjectId: 'SCENARIO_SITE',
      bottleneck: task ? 'scenario_preparation' : 'scenario_outcome',
      activeScenarioId: scenario.scenarioId
    };
  }

  const scenarioOffers = availableCivicScenarioOffers(state);
  if (scenarioOffers.length > 0) {
    const offer = scenarioOffers[0];
    return {
      mode: 'scenario_offer',
      headline: 'Clover scenario read',
      sceneLine: `Clover: ${offer.title} can start at the square.`,
      recommendation: `${offer.title} is the next short civic project. It gives the town a memorable session goal, but it will spend reserves you may want for contracts.`,
      targetObjectId: 'SCENARIO_SITE',
      bottleneck: 'scenario_choice',
      activeScenarioId: offer.scenarioId
    };
  }

  const contract = activeContract(state);
  if (contract) {
    const status = contractRequirementStatus(state, contract);
    const missing = Object.entries(status.missing || {})
      .filter(([, amount]) => normalizeCount(amount) > 0)
      .map(([key, amount]) => `${normalizeCount(amount)} ${String(key).toLowerCase()}`)
      .join(', ');
    if (contract.status === 'READY_TO_TURN_IN' || status.ready) {
      return {
        mode: 'contract_turn_in',
        headline: 'Clover request read',
        sceneLine: `Clover: ${contractRequesterName(contract)} is ready for turn-in.`,
        recommendation: `${contractRequesterName(contract)} is waiting at the Contract Board. Turn in ${contract.title} before choosing more work.`,
        targetObjectId: 'CONTRACT_BOARD',
        bottleneck: 'contract_turn_in',
        activeContractId: contract.contractId
      };
    }
    return {
      mode: 'contract_bottleneck',
      headline: 'Clover request read',
      sceneLine: `Clover: ${contractRequesterName(contract)} still needs ${missing || 'the request'}.`,
      recommendation: `${contractRequesterName(contract)} needs ${missing || contract.title}. Focus production there before opening a new lane.`,
      targetObjectId: 'CONTRACT_BOARD',
      bottleneck: 'active_contract',
      activeContractId: contract.contractId
    };
  }

  const outputReady = state.buildings.find((building) => building.state === 'OUTPUT_READY' && building.type !== 'HQ');
  if (outputReady) {
    const label = BUILDING_RULES[outputReady.type]?.label || outputReady.type;
    return {
      mode: 'next_action',
      headline: 'Clover next step',
      sceneLine: `Clover: collect from ${label} before queuing more work.`,
      recommendation: `Collect ready output from ${label}; full buffers slow the next plan down.`,
      targetObjectId: outputReady.type,
      bottleneck: 'ready_output'
    };
  }

  return {
    mode: 'stewardship',
    headline: 'Clover read',
    sceneLine: 'Clover: keep one producer active and protect reserves.',
    recommendation: recommendationText(state),
    targetObjectId: quest?.primaryAction?.buildingType || 'FOREMAN_HUT',
    bottleneck: 'steady_growth'
  };
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
    if (event.type === EVENT_TYPES.TOWN_OPPORTUNITY_RESOLVED) {
      const result = event?.data?.result || {};
      rows.push({
        journalId: `journal_evt_${event.seq}`,
        eventId: event.seq,
        atMs: normalizeCount(event.createdAt),
        category: 'OPPORTUNITY',
        title: String(result.title || 'Town choice made'),
        body: String(result.body || event.recapLine || event.explanation || '')
      });
      continue;
    }
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
    if (
      event.type === EVENT_TYPES.CIVIC_SCENARIO_STARTED
      || event.type === EVENT_TYPES.CIVIC_SCENARIO_PROGRESS
      || event.type === EVENT_TYPES.CIVIC_SCENARIO_COMPLETED
      || event.type === EVENT_TYPES.CIVIC_SCENARIO_SOFT_MISSED
    ) {
      const scenario = event?.data?.scenario || {};
      rows.push({
        journalId: `journal_evt_${event.seq}`,
        eventId: event.seq,
        atMs: normalizeCount(event.createdAt),
        category: 'SCENARIO',
        title: String(scenario.title || event.type.replace(/_/g, ' ')),
        body: String(event.recapLine || event.explanation || ''),
        scenarioId: String(scenario.scenarioId || '')
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
    if (event.type === EVENT_TYPES.TOWN_IDENTITY_SET) {
      const style = event?.data?.style || {};
      rows.push({
        journalId: `journal_evt_${event.seq}`,
        eventId: event.seq,
        atMs: normalizeCount(event.createdAt),
        category: 'IDENTITY',
        title: String(style.label || 'Town identity set'),
        body: String(event.recapLine || event.explanation || '')
      });
      continue;
    }
    if (event.type === EVENT_TYPES.TOWN_POSTCARD_CAPTURED) {
      const postcard = event?.data?.postcard || {};
      rows.push({
        journalId: `journal_evt_${event.seq}`,
        eventId: event.seq,
        atMs: normalizeCount(event.createdAt),
        category: 'IDENTITY',
        title: String(postcard.cameraLabel || 'Town postcard captured'),
        body: String(event.recapLine || event.explanation || '')
      });
      continue;
    }
    if (
      event.type === EVENT_TYPES.OPERATING_CHARTER_CHOSEN
      || event.type === EVENT_TYPES.OPERATING_CAPABILITY_UNLOCKED
      || event.type === EVENT_TYPES.OPERATING_CONTRACTS_REFRESHED
    ) {
      const operatingModel = event?.data?.operatingModel || {};
      rows.push({
        journalId: `journal_evt_${event.seq}`,
        eventId: event.seq,
        atMs: normalizeCount(event.createdAt),
        category: 'OPERATING_MODEL',
        title: String(operatingModel?.charter?.label || event.type.replace(/_/g, ' ')),
        body: String(event.recapLine || event.explanation || '')
      });
      continue;
    }
    if (
      event.type === EVENT_TYPES.SPECIALIST_ASSIGNED
      || event.type === EVENT_TYPES.SPECIALIST_PAUSED
      || event.type === EVENT_TYPES.SPECIALIST_RECOMMENDATION_REVIEWED
      || event.type === EVENT_TYPES.SPECIALIST_CONFLICT_RAISED
    ) {
      const role = event?.data?.role || {};
      rows.push({
        journalId: `journal_evt_${event.seq}`,
        eventId: event.seq,
        atMs: normalizeCount(event.createdAt),
        category: 'SPECIALIST',
        title: String(role.label || event.type.replace(/_/g, ' ')),
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

function visibleRecapEvents(events = [], afterSeq = 0) {
  return (Array.isArray(events) ? events : [])
    .filter((event) => event && normalizeCount(event.seq) > normalizeCount(afterSeq))
    .filter((event) => {
      const line = typeof event.recapLine === 'string' && event.recapLine.trim()
        ? event.recapLine.trim()
        : typeof event.explanation === 'string' ? event.explanation.trim() : '';
      return !!line && !String(event.type || '').startsWith('FOREMAN_LLM_') && String(event.type || '') !== EVENT_TYPES.FOREMAN_CONTEXT_ASSEMBLED;
    });
}

function formatContractMissingForBrief(state, contract) {
  if (!contract) return '';
  const status = contractRequirementStatus(state, contract);
  return Object.entries(status.missing || {})
    .filter(([, amount]) => normalizeCount(amount) > 0)
    .map(([key, amount]) => `${normalizeCount(amount)} ${String(key).toLowerCase()}`)
    .join(', ');
}

function buildMorningBrief(state, recentEvents = [], { goal = null, companion = null, nowMs = Date.now() } = {}) {
  const currentGoal = goal || resolvePrimaryGoal(state, { nowMs });
  const currentCompanion = companion || companionAdvice(state, { goal: currentGoal });
  const visible = visibleRecapEvents(recentEvents, state.meta.recapSeenSeq);
  const latestLine = visible.length > 0
    ? String(visible[visible.length - 1].recapLine || visible[visible.length - 1].explanation || '').trim()
    : '';
  const contract = activeContract(state);
  const scenario = activeCivicScenario(state);
  const scenarioTask = scenario ? nextScenarioTask(state, scenario) : null;
  const requester = contract ? contractRequesterName(contract) : '';
  const missing = formatContractMissingForBrief(state, contract);
  const openExceptions = foremanGovernanceView(state, { nowMs }).openExceptions || [];
  const doctrine = foremanDoctrineView(state);
  const operatingModel = operatingModelView(state);
  const specialists = specialistsView(state, { nowMs });
  const regionalNetwork = regionalLedgerView(state, { nowMs });
  const receipt = latestForemanReceipt(state);
  const doctrineLine = receipt?.doctrineUsed?.summary || (doctrine.activeRules.length > 0 ? doctrine.summary : '');
  const approvals = pendingApprovalsView(state);
  const blocked = approvals[0]
    ? approvals[0].title
    : openExceptions[0]
      ? openExceptions[0].title
    : scenarioTask
      ? `${scenario.title} needs ${scenarioTask.label.toLowerCase()}`
      : missing
      ? `${contract.title} needs ${missing}`
      : state.policy.emergencyPause
        ? 'Clover is paused'
        : '';
  const active = contract
    ? `${requester} has ${contract.title} ${String(contract.status || '').replace(/_/g, ' ').toLowerCase()}.`
    : scenario
      ? `${scenario.title} is ${String(scenario.status || '').replace(/_/g, ' ').toLowerCase()}.`
    : currentGoal.title;
  return {
    version: 'v1.6',
    title: 'Morning brief',
    available: visible.length > 0,
    unseenCount: visible.length,
    generatedAtMs: normalizeCount(nowMs),
    changed: latestLine || 'No new town changes since the last brief.',
    active,
    blocked: blocked || 'Nothing is blocking the next step.',
    clover: currentCompanion?.recommendation || recommendationText(state),
    doctrine: doctrineLine,
    operatingModel: operatingModel.charter ? operatingModel.summary : '',
    specialists: specialists.activeAssignments.length > 0 ? specialists.summary : '',
    regionalNetwork: regionalNetwork.gate.ready ? regionalNetwork.summary : '',
    nextAction: currentGoal.title,
    requester: requester || '',
    focusObjectId: currentCompanion?.targetObjectId || (scenario ? 'SCENARIO_SITE' : 'JOURNAL')
  };
}

function settlementStabilityGate(state, { nowMs = Date.now() } = {}) {
  const persistent = persistentForemanView(state, { nowMs });
  const criteria = [
    {
      id: 'hq2',
      label: 'Headquarters level 2 reached',
      met: normalizeCount(state?.plot?.hqLevel) >= 2
    },
    {
      id: 'while_away_active',
      label: 'While-away Clover help is active',
      met: persistent.active === true
    },
    {
      id: 'routine_proven',
      label: 'Clover has completed one while-away routine task',
      met: normalizeCount(persistent.actionCount) >= 1
    }
  ];
  const ready = criteria.every((entry) => entry.met === true);
  return {
    ready,
    criteria,
    summary: ready
      ? 'Founders Plot is stable enough to launch a second settlement.'
      : 'Stabilize the first town before launching settlers.'
  };
}

function settlementLedgerEntryForHomeTown(state, { nowMs = Date.now() } = {}) {
  const persistent = persistentForemanView(state, { nowMs });
  const openExceptions = Array.isArray(state?.meta?.governance?.exceptions)
    ? state.meta.governance.exceptions.filter((entry) => normalizeForemanException(entry).status === 'OPEN')
    : [];
  return {
    settlementId: 'town_1',
    plotId: state.plot.plotId,
    name: 'Founders Plot',
    role: 'home_town',
    status: persistent.active ? 'GOVERNED' : 'ACTIVE',
    hqLevel: normalizeCount(state.plot.hqLevel),
    inventory: copyJson(state.plot.inventory),
    buildingCount: Array.isArray(state.buildings) ? state.buildings.length : 0,
    pendingDecisionCount: pendingApprovalsView(state).length + openExceptions.length,
    foreman: {
      persistentActive: persistent.active === true,
      actionCount: normalizeCount(persistent.actionCount),
      summary: persistent.summary || ''
    },
    updatedAtMs: normalizeCount(state.plot.updatedAt)
  };
}

function settlementLedgerEntryForSecondTown(raw = {}) {
  const second = normalizeSecondSettlement(raw);
  if (!second) return null;
  const pendingDecisionCount = second.foundingTasks.filter((task) => task.status !== 'COMPLETED').length;
  return {
    settlementId: second.settlementId,
    plotId: second.plotId,
    name: second.name,
    role: second.role,
    status: second.status,
    hqLevel: second.hqLevel,
    inventory: copyJson(second.inventory),
    buildingCount: second.buildings.length,
    pendingDecisionCount,
    readiness: second.readiness,
    foundingTasks: copyJson(second.foundingTasks),
    events: copyJson(second.events),
    updatedAtMs: second.updatedAtMs
  };
}

function settlementLedgerView(state, { nowMs = Date.now() } = {}) {
  state.meta.settlements = normalizeSettlements(state?.meta?.settlements || {});
  const gate = settlementStabilityGate(state, { nowMs });
  const second = normalizeSecondSettlement(state.meta.settlements.secondSettlement);
  const home = settlementLedgerEntryForHomeTown(state, { nowMs });
  const secondEntry = settlementLedgerEntryForSecondTown(second);
  const settlements = secondEntry ? [home, secondEntry] : [home];
  const activeSettlementId = settlements.some((entry) => entry.settlementId === state.meta.settlements.activeSettlementId)
    ? state.meta.settlements.activeSettlementId
    : 'town_1';
  state.meta.settlements.activeSettlementId = activeSettlementId;
  const activeSettlement = settlements.find((entry) => entry.settlementId === activeSettlementId) || home;
  const expedition = {
    ...copyJson(state.meta.settlements.expedition),
    status: secondEntry
      ? 'LAUNCHED'
      : gate.ready
        ? 'READY'
        : 'LOCKED'
  };
  return {
    activeSettlementId,
    activeSettlement,
    expedition,
    stabilityGate: gate,
    settlements,
    pendingDecisionCount: settlements.reduce((sum, entry) => sum + normalizeCount(entry.pendingDecisionCount), 0),
    summary: secondEntry
      ? `${settlements.length} settlements in the Governor Ledger.`
      : gate.ready
        ? 'Settler Expedition is ready.'
        : gate.summary
  };
}

function createSecondSettlement({ nowMs = Date.now() } = {}) {
  const settlementId = 'town_2';
  return normalizeSecondSettlement({
    settlementId,
    plotId: randomId('plot_outpost'),
    name: 'Ridge Outpost',
    role: 'second_settlement',
    status: 'FOUNDING',
    hqLevel: 1,
    inventory: { wood: 4, stone: 0, food: 8, coin: 6 },
    storageCaps: { wood: 60, stone: 60, food: 60, coin: 999 },
    buildings: [{
      buildingId: randomId('outpost_bld'),
      type: 'OUTPOST_CAMP',
      label: 'Outpost Camp',
      level: 1,
      state: 'FOUNDATION',
      createdAtMs: nowMs,
      updatedAtMs: nowMs
    }],
    foundingTasks: [{
      taskId: 'raise_outpost_camp',
      label: 'Raise Outpost Camp',
      body: 'Spend starter supplies to turn the new camp into a real foothold.',
      status: 'READY',
      cost: { wood: 4, food: 4 },
      completedAtMs: 0
    }],
    events: [{
      eventId: randomId('outpost_evt'),
      type: 'SETTLEMENT_FOUNDED',
      actor: 'HUMAN',
      summary: 'Settlers reached Ridge Outpost.',
      createdAtMs: nowMs
    }],
    readiness: 0,
    createdAtMs: nowMs,
    updatedAtMs: nowMs
  });
}

function applyLaunchSettlerExpedition(state, _args = {}, ctx = {}) {
  const nowMs = normalizeCount(ctx.nowMs || Date.now());
  state.meta.settlements = normalizeSettlements(state?.meta?.settlements || {});
  if (state.meta.settlements.secondSettlement) {
    return settlementLedgerView(state, { nowMs });
  }
  const gate = settlementStabilityGate(state, { nowMs });
  if (!gate.ready) {
    const error = new Error('STABILITY_GATE_REQUIRED');
    error.details = { criteria: gate.criteria };
    throw error;
  }
  const second = createSecondSettlement({ nowMs });
  state.meta.settlements = normalizeSettlements({
    activeSettlementId: second.settlementId,
    expedition: {
      status: 'LAUNCHED',
      expeditionId: randomId('exp'),
      fromSettlementId: 'town_1',
      toSettlementId: second.settlementId,
      launchedAtMs: nowMs,
      focusedAtMs: nowMs
    },
    secondSettlement: second
  });
  state.plot.updatedAt = nowMs;
  pushEvent(ctx.appendEvent, {
    type: EVENT_TYPES.SETTLER_EXPEDITION_LAUNCHED,
    actor: 'HUMAN',
    explanation: 'Settler Expedition launched a second settlement shard.',
    recapLine: 'A settler party founded Ridge Outpost.',
    data: {
      settlement: settlementLedgerEntryForSecondTown(second),
      ledger: settlementLedgerView(state, { nowMs })
    }
  });
  return settlementLedgerView(state, { nowMs });
}

function applyFocusSettlement(state, { settlementId = 'town_1' } = {}, ctx = {}) {
  const nowMs = normalizeCount(ctx.nowMs || Date.now());
  const requested = String(settlementId || 'town_1').trim() || 'town_1';
  const ledger = settlementLedgerView(state, { nowMs });
  if (!ledger.settlements.some((entry) => entry.settlementId === requested)) {
    const error = new Error('SETTLEMENT_NOT_FOUND');
    error.details = { settlementId: requested };
    throw error;
  }
  state.meta.settlements.activeSettlementId = requested;
  state.meta.settlements.expedition.focusedAtMs = nowMs;
  state.plot.updatedAt = nowMs;
  pushEvent(ctx.appendEvent, {
    type: EVENT_TYPES.SETTLEMENT_FOCUSED,
    actor: 'HUMAN',
    explanation: `Governor Ledger focused ${requested}.`,
    recapLine: requested === 'town_1' ? 'Governor Ledger returned focus to Founders Plot.' : 'Governor Ledger focused Ridge Outpost.',
    data: {
      settlementId: requested,
      ledger: settlementLedgerView(state, { nowMs })
    }
  });
  return settlementLedgerView(state, { nowMs });
}

function applyCompleteSettlementFoundingTask(state, { settlementId = 'town_2', taskId = 'raise_outpost_camp' } = {}, ctx = {}) {
  const nowMs = normalizeCount(ctx.nowMs || Date.now());
  state.meta.settlements = normalizeSettlements(state?.meta?.settlements || {});
  const second = normalizeSecondSettlement(state.meta.settlements.secondSettlement);
  if (!second || String(second.settlementId) !== String(settlementId || '')) {
    const error = new Error('SETTLEMENT_NOT_FOUND');
    error.details = { settlementId };
    throw error;
  }
  const task = second.foundingTasks.find((entry) => entry.taskId === taskId);
  if (!task || task.status === 'COMPLETED') {
    const error = new Error('INVALID_STATE');
    error.details = { taskId, reason: task ? 'TASK_ALREADY_COMPLETED' : 'TASK_NOT_FOUND' };
    throw error;
  }
  if (!canAffordCost({ inventory: second.inventory }, task.cost)) {
    const error = new Error('OUT_OF_RESOURCES');
    error.details = { cost: task.cost, inventory: second.inventory };
    throw error;
  }
  for (const [resource, amount] of Object.entries(task.cost || {})) {
    second.inventory[resource] = normalizeCount(second.inventory[resource]) - normalizeCount(amount);
  }
  task.status = 'COMPLETED';
  task.completedAtMs = nowMs;
  second.status = 'ACTIVE';
  second.readiness = normalizeCount(second.readiness) + 1;
  second.updatedAtMs = nowMs;
  second.buildings = second.buildings.map((building) => (
    building.type === 'OUTPOST_CAMP'
      ? { ...building, state: 'READY', updatedAtMs: nowMs }
      : building
  ));
  second.events = [{
    eventId: randomId('outpost_evt'),
    type: EVENT_TYPES.SETTLEMENT_FOUNDING_TASK_COMPLETED,
    actor: 'HUMAN',
    summary: `${task.label} completed at Ridge Outpost.`,
    createdAtMs: nowMs
  }, ...second.events].slice(0, 20);
  state.meta.settlements.secondSettlement = normalizeSecondSettlement(second);
  state.meta.settlements.activeSettlementId = second.settlementId;
  state.plot.updatedAt = nowMs;
  pushEvent(ctx.appendEvent, {
    type: EVENT_TYPES.SETTLEMENT_FOUNDING_TASK_COMPLETED,
    actor: 'HUMAN',
    explanation: `${task.label} completed at Ridge Outpost.`,
    recapLine: `Ridge Outpost completed ${task.label}.`,
    data: {
      settlement: settlementLedgerEntryForSecondTown(second),
      task,
      ledger: settlementLedgerView(state, { nowMs })
    }
  });
  return settlementLedgerView(state, { nowMs });
}

function applyChooseOperatingCharter(state, { charterId = '', source = 'human' } = {}, ctx = {}) {
  const nowMs = normalizeCount(ctx.nowMs || Date.now());
  const normalized = normalizeOperatingCharterId(charterId);
  const charter = operatingCharterDefinition(normalized);
  if (!charter) {
    const error = new Error('INVALID_STATE');
    error.details = { charterId };
    throw error;
  }
  const gate = operatingModelGate(state);
  if (!gate.ready) {
    const error = new Error('OPERATING_MODEL_GATE_REQUIRED');
    error.details = { criteria: gate.criteria };
    throw error;
  }
  const operatingModel = normalizeOperatingModel(state?.meta?.operatingModel || {});
  if (operatingModel.selectedCharterId && operatingModel.selectedCharterId !== normalized) {
    const error = new Error('INVALID_STATE');
    error.details = { reason: 'CHARTER_ALREADY_CHOSEN', selectedCharterId: operatingModel.selectedCharterId };
    throw error;
  }
  operatingModel.selectedCharterId = normalized;
  operatingModel.selectedAtMs = operatingModel.selectedAtMs || nowMs;
  operatingModel.updatedAtMs = nowMs;
  operatingModel.charterHistory = [
    ...(operatingModel.charterHistory || []),
    { charterId: normalized, source: String(source || 'human'), createdAtMs: nowMs }
  ].slice(-8);
  state.meta.operatingModel = normalizeOperatingModel(operatingModel);
  if (!activeContract(state) && state.plot.hqLevel >= 2) {
    refreshContractBoard(state, nowMs);
  }
  state.plot.updatedAt = nowMs;
  const view = operatingModelView(state);
  pushEvent(ctx.appendEvent, {
    type: EVENT_TYPES.OPERATING_CHARTER_CHOSEN,
    actor: 'HUMAN',
    explanation: `${charter.label} charter chosen.`,
    recapLine: `${charter.label} became the town operating charter.`,
    data: {
      operatingModel: view
    }
  });
  return {
    operatingModel: view,
    contracts: {
      offers: copyJson(state.meta.contracts.offers),
      recommendation: copyJson(recommendContractChoice(state))
    }
  };
}

function applyUnlockOperatingCapability(state, { capabilityId = '', source = 'human' } = {}, ctx = {}) {
  const nowMs = normalizeCount(ctx.nowMs || Date.now());
  const normalized = normalizeOperatingCapabilityId(capabilityId);
  const capability = operatingCapabilityDefinition(normalized);
  if (!capability) {
    const error = new Error('INVALID_STATE');
    error.details = { capabilityId };
    throw error;
  }
  const operatingModel = normalizeOperatingModel(state?.meta?.operatingModel || {});
  if (!operatingModel.selectedCharterId) {
    const error = new Error('INVALID_STATE');
    error.details = { reason: 'CHARTER_REQUIRED', capabilityId: normalized };
    throw error;
  }
  if (operatingModel.unlockedCapabilities.includes(normalized)) {
    return {
      operatingModel: operatingModelView(state)
    };
  }
  operatingModel.unlockedCapabilities = [...operatingModel.unlockedCapabilities, normalized];
  operatingModel.updatedAtMs = nowMs;
  operatingModel.capabilityHistory = [
    ...(operatingModel.capabilityHistory || []),
    { capabilityId: normalized, source: String(source || 'human'), createdAtMs: nowMs }
  ].slice(-12);
  state.meta.operatingModel = normalizeOperatingModel(operatingModel);
  state.plot.updatedAt = nowMs;
  const view = operatingModelView(state);
  pushEvent(ctx.appendEvent, {
    type: EVENT_TYPES.OPERATING_CAPABILITY_UNLOCKED,
    actor: 'HUMAN',
    explanation: `${capability.label} unlocked for the operating model.`,
    recapLine: `${capability.label} was added to the town capability web.`,
    data: {
      capabilityId: normalized,
      operatingModel: view
    }
  });
  return {
    operatingModel: view
  };
}

function applyRefreshOperatingContracts(state, _args = {}, ctx = {}) {
  const nowMs = normalizeCount(ctx.nowMs || Date.now());
  if (!operatingModelHasCapability(state, 'CHARTER_CONTRACTS')) {
    const error = new Error('CAPABILITY_REQUIRED');
    error.details = { capabilityId: 'CHARTER_CONTRACTS' };
    throw error;
  }
  if (activeContract(state)) {
    const error = new Error('INVALID_STATE');
    error.details = { reason: 'ACTIVE_CONTRACT_IN_PROGRESS' };
    throw error;
  }
  const offers = refreshContractBoard(state, nowMs);
  state.plot.updatedAt = nowMs;
  const view = operatingModelView(state);
  pushEvent(ctx.appendEvent, {
    type: EVENT_TYPES.OPERATING_CONTRACTS_REFRESHED,
    actor: 'HUMAN',
    explanation: 'Contract Board refreshed through the town operating charter.',
    recapLine: 'The Contract Board was refreshed through the operating charter.',
    data: {
      operatingModel: view,
      offerIds: offers.map((offer) => offer.contractId)
    }
  });
  return {
    operatingModel: view,
    contracts: {
      offers: copyJson(state.meta.contracts.offers),
      recommendation: copyJson(recommendContractChoice(state))
    }
  };
}

function activeSpecialistForDomain(specialists, domainId, exceptRoleId = '') {
  const normalizedDomainId = normalizeSpecialistDomainId(domainId);
  const normalizedExceptRoleId = normalizeSpecialistRoleId(exceptRoleId);
  return Object.values(specialists.roles || {}).find((role) => (
    role
    && role.status === 'ACTIVE'
    && role.domainId === normalizedDomainId
    && role.roleId !== normalizedExceptRoleId
  )) || null;
}

function applySpecialistConflict(state, {
  title = 'Specialists need your decision',
  body = '',
  requestedAction = 'specialist_conflict',
  payload = {}
} = {}, ctx = {}) {
  const nowMs = normalizeCount(ctx.nowMs || Date.now());
  const governance = applyRaiseForemanException(state, {
    title,
    body,
    requestedAction,
    severity: 'needs_review',
    source: 'specialist_staffing',
    payload
  }, ctx);
  const latest = governance.openExceptions?.[0] || null;
  state.meta.specialists.latestConflictId = String(latest?.exceptionId || state.meta.specialists.latestConflictId || '');
  pushEvent(ctx.appendEvent, {
    type: EVENT_TYPES.SPECIALIST_CONFLICT_RAISED,
    actor: 'AGENT',
    explanation: body || title,
    recapLine: title,
    data: {
      exception: latest,
      specialists: specialistsView(state, { nowMs }),
      payload: copyJson(payload || {})
    }
  });
  return latest;
}

function applyAssignSpecialist(state, { roleId = '', domainId = '', source = 'human' } = {}, ctx = {}) {
  const nowMs = normalizeCount(ctx.nowMs || Date.now());
  const normalizedRoleId = normalizeSpecialistRoleId(roleId);
  const roleDefinition = specialistRoleDefinition(normalizedRoleId);
  const normalizedDomainId = normalizeSpecialistDomainId(domainId || roleDefinition?.defaultDomainId);
  const domainDefinition = specialistDomainDefinition(normalizedDomainId);
  if (!roleDefinition || !domainDefinition || !roleDefinition.eligibleDomains.includes(normalizedDomainId)) {
    const error = new Error('INVALID_STATE');
    error.details = { roleId, domainId };
    throw error;
  }
  const gate = specialistStaffingGate(state, { nowMs });
  if (!gate.ready) {
    const error = new Error('SPECIALIST_GATE_REQUIRED');
    error.details = { criteria: gate.criteria };
    throw error;
  }
  state.meta.specialists = normalizeSpecialists(state?.meta?.specialists || {});
  const occupied = activeSpecialistForDomain(state.meta.specialists, normalizedDomainId, normalizedRoleId);
  if (occupied) {
    const exception = applySpecialistConflict(state, {
      title: 'Specialists need your decision',
      body: `${domainDefinition.label} is already staffed by ${occupied.label}. Choose who should own that lane before reassigning it.`,
      requestedAction: 'specialist_domain_conflict',
      payload: {
        roleId: normalizedRoleId,
        otherRoleId: occupied.roleId,
        domainId: normalizedDomainId
      }
    }, ctx);
    return {
      specialists: specialistsView(state, { nowMs }),
      conflict: exception
    };
  }
  const current = state.meta.specialists.roles[normalizedRoleId] || normalizeSpecialistRoleState(roleDefinition, {});
  const previousDomainId = current.domainId;
  state.meta.specialists.roles[normalizedRoleId] = normalizeSpecialistRoleState(roleDefinition, {
    ...current,
    status: 'ACTIVE',
    domainId: normalizedDomainId,
    assignedAtMs: current.assignedAtMs || nowMs,
    reassignedAtMs: previousDomainId && previousDomainId !== normalizedDomainId ? nowMs : current.reassignedAtMs,
    pausedAtMs: 0
  });
  state.meta.specialists.updatedAtMs = nowMs;
  state.plot.updatedAt = nowMs;
  const role = state.meta.specialists.roles[normalizedRoleId];
  pushEvent(ctx.appendEvent, {
    type: EVENT_TYPES.SPECIALIST_ASSIGNED,
    actor: 'HUMAN',
    explanation: `${role.label} assigned to ${domainDefinition.label}.`,
    recapLine: previousDomainId && previousDomainId !== normalizedDomainId
      ? `${role.label} was reassigned to ${domainDefinition.label}.`
      : `${role.label} took the ${domainDefinition.label} lane.`,
    data: {
      role: copyJson(role),
      domain: copyJson(domainDefinition),
      source: String(source || 'human'),
      specialists: specialistsView(state, { nowMs })
    }
  });
  return {
    specialists: specialistsView(state, { nowMs })
  };
}

function applyPauseSpecialist(state, { roleId = '', reason = 'Player paused specialist lane.' } = {}, ctx = {}) {
  const nowMs = normalizeCount(ctx.nowMs || Date.now());
  const normalizedRoleId = normalizeSpecialistRoleId(roleId);
  const roleDefinition = specialistRoleDefinition(normalizedRoleId);
  if (!roleDefinition) {
    const error = new Error('INVALID_STATE');
    error.details = { roleId };
    throw error;
  }
  state.meta.specialists = normalizeSpecialists(state?.meta?.specialists || {});
  const current = state.meta.specialists.roles[normalizedRoleId] || normalizeSpecialistRoleState(roleDefinition, {});
  if (current.status !== 'ACTIVE') {
    return {
      specialists: specialistsView(state, { nowMs })
    };
  }
  state.meta.specialists.roles[normalizedRoleId] = normalizeSpecialistRoleState(roleDefinition, {
    ...current,
    status: 'PAUSED',
    pausedAtMs: nowMs
  });
  state.meta.specialists.updatedAtMs = nowMs;
  state.plot.updatedAt = nowMs;
  const role = state.meta.specialists.roles[normalizedRoleId];
  pushEvent(ctx.appendEvent, {
    type: EVENT_TYPES.SPECIALIST_PAUSED,
    actor: 'HUMAN',
    explanation: `${role.label} paused.`,
    recapLine: `${role.label} was paused.`,
    data: {
      role: copyJson(role),
      reason: String(reason || ''),
      specialists: specialistsView(state, { nowMs })
    }
  });
  return {
    specialists: specialistsView(state, { nowMs })
  };
}

function specialistRecommendationConflicts(existing, incoming) {
  if (!existing || !incoming || existing.roleId === incoming.roleId) return false;
  if (incoming.conflictsWith.includes(existing.recommendationId) || existing.conflictsWith.includes(incoming.recommendationId)) return true;
  if (incoming.targetObjectId && incoming.targetObjectId === existing.targetObjectId && incoming.toolName !== existing.toolName) return true;
  return false;
}

function applyReviewSpecialistRecommendation(state, {
  roleId = '',
  domainId = '',
  toolName = '',
  targetObjectId = '',
  summary = '',
  recommendationId = '',
  conflictsWith = []
} = {}, ctx = {}) {
  const nowMs = normalizeCount(ctx.nowMs || Date.now());
  const normalizedRoleId = normalizeSpecialistRoleId(roleId);
  const normalizedDomainId = normalizeSpecialistDomainId(domainId);
  state.meta.specialists = normalizeSpecialists(state?.meta?.specialists || {});
  const role = state.meta.specialists.roles[normalizedRoleId] || null;
  if (!role || role.status !== 'ACTIVE' || role.domainId !== normalizedDomainId) {
    const error = new Error('SPECIALIST_ASSIGNMENT_REQUIRED');
    error.details = { roleId, domainId };
    throw error;
  }
  const allowedTools = new Set(role.allowedTools || []);
  if (!allowedTools.has(String(toolName || '').trim())) {
    const error = new Error('SPECIALIST_DOMAIN_VIOLATION');
    error.details = {
      roleId: normalizedRoleId,
      domainId: normalizedDomainId,
      toolName: String(toolName || '').trim(),
      allowedTools: role.allowedTools
    };
    throw error;
  }
  const recommendation = normalizeSpecialistRecommendation({
    recommendationId: String(recommendationId || randomId('spr')),
    roleId: normalizedRoleId,
    domainId: normalizedDomainId,
    toolName: String(toolName || '').trim(),
    targetObjectId: String(targetObjectId || ''),
    summary: String(summary || `${role.label} reviewed ${specialistDomainDefinition(normalizedDomainId)?.label || normalizedDomainId}.`),
    status: 'OPEN',
    conflictsWith,
    createdAtMs: nowMs
  });
  const conflict = state.meta.specialists.recommendations.find((entry) => (
    (entry.status === 'OPEN' || entry.status === 'CONFLICT_ESCALATED')
    && specialistRecommendationConflicts(entry, recommendation)
  )) || null;
  if (conflict) {
    recommendation.status = 'CONFLICT_ESCALATED';
    conflict.status = 'CONFLICT_ESCALATED';
  }
  state.meta.specialists.recommendations = [
    ...state.meta.specialists.recommendations.filter((entry) => entry.recommendationId !== recommendation.recommendationId),
    recommendation
  ].slice(-20);
  state.meta.specialists.roles[normalizedRoleId] = normalizeSpecialistRoleState(specialistRoleDefinition(normalizedRoleId), {
    ...role,
    lastRecommendationId: recommendation.recommendationId
  });
  state.meta.specialists.updatedAtMs = nowMs;
  state.plot.updatedAt = nowMs;
  pushEvent(ctx.appendEvent, {
    type: EVENT_TYPES.SPECIALIST_RECOMMENDATION_REVIEWED,
    actor: 'AGENT',
    explanation: `${role.label} reviewed ${recommendation.toolName}.`,
    recapLine: `${role.label} recommended: ${recommendation.summary}`,
    data: {
      role: copyJson(state.meta.specialists.roles[normalizedRoleId]),
      recommendation: copyJson(recommendation)
    }
  });
  let conflictException = null;
  if (conflict) {
    conflictException = applySpecialistConflict(state, {
      title: 'Specialists need your decision',
      body: `${role.label} and ${specialistRoleDefinition(conflict.roleId)?.label || 'another specialist'} disagree about ${recommendation.targetObjectId || 'the next move'}.`,
      requestedAction: 'specialist_recommendation_conflict',
      payload: {
        recommendation: copyJson(recommendation),
        conflict: copyJson(conflict)
      }
    }, ctx);
  }
  return {
    specialists: specialistsView(state, { nowMs }),
    recommendation: copyJson(recommendation),
    conflict: conflictException
  };
}

function regionalSettlementInventoryRef(state, settlementId, { nowMs = Date.now() } = {}) {
  const normalized = String(settlementId || '').trim();
  if (normalized === 'town_1') {
    return {
      settlementId: 'town_1',
      name: 'Founders Plot',
      inventory: state.plot.inventory,
      storageCaps: state.plot.storageCaps,
      save: () => {
        state.plot.inventory = normalizeInventory(state.plot.inventory);
        state.plot.updatedAt = normalizeCount(nowMs);
      }
    };
  }
  if (normalized === 'town_2') {
    state.meta.settlements = normalizeSettlements(state?.meta?.settlements || {});
    const second = normalizeSecondSettlement(state.meta.settlements.secondSettlement);
    if (!second || second.status !== 'ACTIVE') return null;
    return {
      settlementId: second.settlementId,
      name: second.name,
      inventory: second.inventory,
      storageCaps: second.storageCaps,
      save: () => {
        second.inventory = normalizeInventory(second.inventory);
        second.updatedAtMs = normalizeCount(nowMs);
        state.meta.settlements.secondSettlement = normalizeSecondSettlement(second);
      }
    };
  }
  return null;
}

function regionalTargetCapacity(ref, resource) {
  const cap = normalizeCount(ref?.storageCaps?.[resource]);
  if (cap > 0) return cap;
  return resource === 'coin' ? 999999 : 0;
}

function recordRegionalRouteShortage(state, route, shortage, ctx = {}) {
  const nowMs = normalizeCount(ctx.nowMs || Date.now());
  route.status = 'SHORTAGE';
  route.lastFailureAtMs = nowMs;
  route.lastShortage = {
    resource: String(shortage.resource || route.resource),
    needed: normalizeCount(shortage.needed),
    available: normalizeCount(shortage.available),
    fromSettlementId: route.fromSettlementId,
    toSettlementId: route.toSettlementId,
    reason: String(shortage.reason || 'shortage'),
    failedAtMs: nowMs
  };
  state.meta.regionalNetwork.routes[route.routeId] = normalizeRegionalRoute(route);
  state.meta.regionalNetwork.updatedAtMs = nowMs;
  state.plot.updatedAt = nowMs;
  pushEvent(ctx.appendEvent, {
    type: EVENT_TYPES.REGIONAL_ROUTE_SHORTAGE,
    actor: 'SYSTEM',
    explanation: `${route.label} could not move ${route.transferAmount} ${route.resource}.`,
    recapLine: `${route.label} is short on ${route.resource}.`,
    data: {
      route: copyJson(route),
      shortage: copyJson(route.lastShortage),
      regionalNetwork: regionalLedgerView(state, { nowMs })
    }
  });
  return {
    regionalNetwork: regionalLedgerView(state, { nowMs }),
    transfer: {
      routeId: route.routeId,
      status: 'SHORTAGE',
      shortage: copyJson(route.lastShortage)
    }
  };
}

function applyOpenRegionalSupplyRoute(state, { routeId = 'founders_ridge_supply_route' } = {}, ctx = {}) {
  const nowMs = normalizeCount(ctx.nowMs || Date.now());
  const normalizedRouteId = normalizeRegionalRouteId(routeId);
  if (!normalizedRouteId) {
    const error = new Error('INVALID_STATE');
    error.details = { routeId };
    throw error;
  }
  const gate = regionalGovernanceGate(state, { nowMs });
  if (!gate.ready) {
    const error = new Error('REGIONAL_GATE_REQUIRED');
    error.details = { criteria: gate.criteria };
    throw error;
  }
  state.meta.regionalNetwork = normalizeRegionalNetwork(state?.meta?.regionalNetwork || {});
  const route = state.meta.regionalNetwork.routes[normalizedRouteId];
  if (route.status === 'ACTIVE' || route.status === 'SHORTAGE') {
    return {
      regionalNetwork: regionalLedgerView(state, { nowMs })
    };
  }
  route.status = 'ACTIVE';
  route.openedAtMs = route.openedAtMs || nowMs;
  route.lastShortage = null;
  state.meta.regionalNetwork.routes[normalizedRouteId] = normalizeRegionalRoute(route);
  state.meta.regionalNetwork.updatedAtMs = nowMs;
  state.plot.updatedAt = nowMs;
  pushEvent(ctx.appendEvent, {
    type: EVENT_TYPES.REGIONAL_SUPPLY_ROUTE_OPENED,
    actor: 'HUMAN',
    explanation: `${route.label} opened between Founders Plot and Ridge Outpost.`,
    recapLine: `${route.label} opened between Founders Plot and Ridge Outpost.`,
    data: {
      route: copyJson(route),
      regionalNetwork: regionalLedgerView(state, { nowMs })
    }
  });
  return {
    regionalNetwork: regionalLedgerView(state, { nowMs })
  };
}

function applyTransferRegionalSupplyRoute(state, {
  routeId = 'founders_ridge_supply_route',
  fromSettlementId = 'town_1',
  toSettlementId = 'town_2'
} = {}, ctx = {}) {
  const nowMs = normalizeCount(ctx.nowMs || Date.now());
  const normalizedRouteId = normalizeRegionalRouteId(routeId);
  if (!normalizedRouteId) {
    const error = new Error('INVALID_STATE');
    error.details = { routeId };
    throw error;
  }
  state.meta.regionalNetwork = normalizeRegionalNetwork(state?.meta?.regionalNetwork || {});
  const route = state.meta.regionalNetwork.routes[normalizedRouteId];
  if (!route || !['ACTIVE', 'SHORTAGE'].includes(route.status)) {
    const error = new Error('REGIONAL_ROUTE_REQUIRED');
    error.details = { routeId: normalizedRouteId };
    throw error;
  }
  if (String(fromSettlementId || '').trim() !== route.fromSettlementId || String(toSettlementId || '').trim() !== route.toSettlementId) {
    const error = new Error('REGIONAL_ROUTE_FORBIDDEN');
    error.details = {
      routeId: normalizedRouteId,
      expected: { fromSettlementId: route.fromSettlementId, toSettlementId: route.toSettlementId },
      received: { fromSettlementId, toSettlementId }
    };
    throw error;
  }
  const source = regionalSettlementInventoryRef(state, route.fromSettlementId, { nowMs });
  const target = regionalSettlementInventoryRef(state, route.toSettlementId, { nowMs });
  if (!source || !target) {
    const error = new Error('SETTLEMENT_NOT_FOUND');
    error.details = { fromSettlementId: route.fromSettlementId, toSettlementId: route.toSettlementId };
    throw error;
  }
  const amount = normalizeCount(route.transferAmount);
  const resource = route.resource;
  const available = normalizeCount(source.inventory[resource]);
  if (available < amount) {
    return recordRegionalRouteShortage(state, route, {
      resource,
      needed: amount,
      available,
      reason: 'source_shortage'
    }, ctx);
  }
  const targetCurrent = normalizeCount(target.inventory[resource]);
  const targetCap = regionalTargetCapacity(target, resource);
  if (targetCap > 0 && targetCurrent + amount > targetCap) {
    return recordRegionalRouteShortage(state, route, {
      resource,
      needed: amount,
      available: Math.max(0, targetCap - targetCurrent),
      reason: 'target_storage_full'
    }, ctx);
  }

  source.inventory[resource] = available - amount;
  target.inventory[resource] = targetCurrent + amount;
  source.save();
  target.save();

  route.status = 'ACTIVE';
  route.lastTransferAtMs = nowMs;
  route.lastShortage = null;
  route.totalTransfers = normalizeCount(route.totalTransfers) + 1;
  state.meta.regionalNetwork.routes[normalizedRouteId] = normalizeRegionalRoute(route);

  let progressedContract = null;
  for (const contract of Object.values(state.meta.regionalNetwork.contracts)) {
    if (contract.routeId !== normalizedRouteId || contract.status !== 'ACTIVE') continue;
    contract.progressTransfers = Math.min(normalizeCount(contract.requiredTransfers), normalizeCount(contract.progressTransfers) + 1);
    contract.lastRouteId = normalizedRouteId;
    if (contract.progressTransfers >= contract.requiredTransfers) {
      contract.status = 'READY_TO_TURN_IN';
    }
    state.meta.regionalNetwork.contracts[contract.contractId] = normalizeRegionalContract(contract);
    progressedContract = state.meta.regionalNetwork.contracts[contract.contractId];
    break;
  }

  state.meta.regionalNetwork.updatedAtMs = nowMs;
  state.plot.updatedAt = nowMs;
  pushEvent(ctx.appendEvent, {
    type: EVENT_TYPES.REGIONAL_SUPPLY_TRANSFERRED,
    actor: 'HUMAN',
    explanation: `${route.label} moved ${amount} ${resource} from ${source.name} to ${target.name}.`,
    recapLine: `${route.label} moved ${amount} ${resource} to ${target.name}.`,
    data: {
      route: copyJson(route),
      contract: progressedContract ? copyJson(progressedContract) : null,
      transfer: {
        resource,
        amount,
        fromSettlementId: route.fromSettlementId,
        toSettlementId: route.toSettlementId
      },
      regionalNetwork: regionalLedgerView(state, { nowMs })
    }
  });
  return {
    regionalNetwork: regionalLedgerView(state, { nowMs }),
    transfer: {
      routeId: normalizedRouteId,
      status: 'TRANSFERRED',
      resource,
      amount,
      fromSettlementId: route.fromSettlementId,
      toSettlementId: route.toSettlementId
    }
  };
}

function applyAcceptRegionalContract(state, { contractId = 'ridge_timber_bridge' } = {}, ctx = {}) {
  const nowMs = normalizeCount(ctx.nowMs || Date.now());
  const normalizedContractId = normalizeRegionalContractId(contractId);
  if (!normalizedContractId) {
    const error = new Error('INVALID_STATE');
    error.details = { contractId };
    throw error;
  }
  state.meta.regionalNetwork = normalizeRegionalNetwork(state?.meta?.regionalNetwork || {});
  const ledger = regionalLedgerView(state, { nowMs });
  const viewContract = ledger.contracts.find((entry) => entry.contractId === normalizedContractId);
  if (!viewContract || viewContract.status !== 'AVAILABLE') {
    const error = new Error('REGIONAL_ROUTE_REQUIRED');
    error.details = { contractId: normalizedContractId };
    throw error;
  }
  const active = Object.values(state.meta.regionalNetwork.contracts).find((entry) => (
    entry.contractId !== normalizedContractId
    && ['ACTIVE', 'READY_TO_TURN_IN'].includes(entry.status)
  ));
  if (active) {
    const error = new Error('REGIONAL_CONTRACT_ACTIVE_EXISTS');
    error.details = { activeContractId: active.contractId };
    throw error;
  }
  const contract = state.meta.regionalNetwork.contracts[normalizedContractId];
  contract.status = 'ACTIVE';
  contract.acceptedAtMs = contract.acceptedAtMs || nowMs;
  contract.progressTransfers = 0;
  state.meta.regionalNetwork.contracts[normalizedContractId] = normalizeRegionalContract(contract);
  state.meta.regionalNetwork.updatedAtMs = nowMs;
  state.plot.updatedAt = nowMs;
  pushEvent(ctx.appendEvent, {
    type: EVENT_TYPES.REGIONAL_CONTRACT_ACCEPTED,
    actor: 'HUMAN',
    explanation: `${contract.title} accepted for Founders Plot and Ridge Outpost.`,
    recapLine: `${contract.title} became the active regional contract.`,
    data: {
      contract: copyJson(contract),
      regionalNetwork: regionalLedgerView(state, { nowMs })
    }
  });
  return {
    regionalNetwork: regionalLedgerView(state, { nowMs })
  };
}

function applyTurnInRegionalContract(state, { contractId = 'ridge_timber_bridge' } = {}, ctx = {}) {
  const nowMs = normalizeCount(ctx.nowMs || Date.now());
  const normalizedContractId = normalizeRegionalContractId(contractId);
  if (!normalizedContractId) {
    const error = new Error('INVALID_STATE');
    error.details = { contractId };
    throw error;
  }
  state.meta.regionalNetwork = normalizeRegionalNetwork(state?.meta?.regionalNetwork || {});
  const contract = state.meta.regionalNetwork.contracts[normalizedContractId];
  if (!contract || contract.status !== 'READY_TO_TURN_IN') {
    const error = new Error('INVALID_STATE');
    error.details = { contractId: normalizedContractId, reason: 'REGIONAL_CONTRACT_NOT_READY' };
    throw error;
  }
  const reward = contract.reward || {};
  state.plot.inventory.coin = normalizeCount(state.plot.inventory.coin) + normalizeCount(reward.coin);
  state.plot.townXp = normalizeCount(state.plot.townXp) + normalizeCount(reward.townXp);
  contract.status = 'COMPLETED';
  contract.completedAtMs = nowMs;
  state.meta.regionalNetwork.contracts[normalizedContractId] = normalizeRegionalContract(contract);
  state.meta.regionalNetwork.updatedAtMs = nowMs;
  state.plot.updatedAt = nowMs;
  pushEvent(ctx.appendEvent, {
    type: EVENT_TYPES.REGIONAL_CONTRACT_COMPLETED,
    actor: 'HUMAN',
    explanation: `${contract.title} completed across Founders Plot and Ridge Outpost.`,
    recapLine: `${contract.title} completed across both towns.`,
    data: {
      contract: copyJson(contract),
      reward: copyJson(reward),
      regionalNetwork: regionalLedgerView(state, { nowMs })
    }
  });
  return {
    regionalNetwork: regionalLedgerView(state, { nowMs }),
    reward: copyJson(reward)
  };
}

function requireCreatorManifest(extensionId) {
  const manifest = manifestById(extensionId);
  if (!manifest) {
    const error = new Error('CREATOR_MANIFEST_NOT_FOUND');
    error.details = { extensionId };
    throw error;
  }
  const validation = validateCreatorManifest(manifest);
  if (!validation.ok) {
    const error = new Error('CREATOR_MANIFEST_REJECTED');
    error.details = { extensionId, errors: validation.errors };
    throw error;
  }
  return manifest;
}

function applyInstallCreatorBuilding(state, { extensionId = 'creator.notice-kiosk' } = {}, ctx = {}) {
  const nowMs = normalizeCount(ctx.nowMs || Date.now());
  const manifest = requireCreatorManifest(extensionId);
  const gate = creatorExtensionGate(state, manifest);
  if (!gate.ready) {
    const error = new Error('CREATOR_GATE_REQUIRED');
    error.details = { extensionId: manifest.id, criteria: gate.criteria };
    throw error;
  }
  state.meta.creatorExtensions = normalizeCreatorExtensions(state?.meta?.creatorExtensions || {});
  const current = state.meta.creatorExtensions.installed[manifest.id] || null;
  const installation = normalizeCreatorInstallation({
    ...(current || {}),
    extensionId: manifest.id,
    manifestId: manifest.id,
    buildingType: manifest.buildingType,
    objectId: manifest.install.objectId,
    label: manifest.label,
    summary: manifest.summary,
    status: 'ACTIVE',
    installedAtMs: current?.installedAtMs || nowMs,
    disabledAtMs: 0,
    updatedAtMs: nowMs,
    state: {
      ...(current?.state || defaultCreatorStateForManifest(manifest)),
      enabled: true,
      manifestId: manifest.id
    }
  });
  state.meta.creatorExtensions.installed[manifest.id] = installation;
  state.meta.creatorExtensions.history = [
    ...state.meta.creatorExtensions.history,
    { action: current ? 'ENABLED' : 'INSTALLED', extensionId: manifest.id, atMs: nowMs }
  ].slice(-24);
  state.meta.creatorExtensions.updatedAtMs = nowMs;
  state.plot.updatedAt = nowMs;
  pushEvent(ctx.appendEvent, {
    type: EVENT_TYPES.CREATOR_BUILDING_INSTALLED,
    actor: 'HUMAN',
    explanation: `${manifest.label} attached to Founders Plot.`,
    recapLine: `${manifest.label} was attached as a curated creator building.`,
    data: {
      extensionId: manifest.id,
      buildingType: manifest.buildingType,
      objectId: manifest.install.objectId,
      moderation: {
        status: manifest.moderation.status,
        networkAccess: manifest.moderation.networkAccess,
        dataAccess: copyJson(manifest.moderation.dataAccess || [])
      }
    }
  });
  return {
    creatorExtensions: creatorExtensionsView(state),
    installation: copyJson(installation)
  };
}

function applyDisableCreatorBuilding(state, { extensionId = 'creator.notice-kiosk' } = {}, ctx = {}) {
  const nowMs = normalizeCount(ctx.nowMs || Date.now());
  const manifest = requireCreatorManifest(extensionId);
  state.meta.creatorExtensions = normalizeCreatorExtensions(state?.meta?.creatorExtensions || {});
  const current = state.meta.creatorExtensions.installed[manifest.id] || null;
  if (!current) {
    const error = new Error('CREATOR_INSTALLATION_REQUIRED');
    error.details = { extensionId: manifest.id };
    throw error;
  }
  current.status = 'DISABLED';
  current.disabledAtMs = nowMs;
  current.updatedAtMs = nowMs;
  current.state.enabled = false;
  state.meta.creatorExtensions.installed[manifest.id] = normalizeCreatorInstallation(current);
  state.meta.creatorExtensions.history = [
    ...state.meta.creatorExtensions.history,
    { action: 'DISABLED', extensionId: manifest.id, atMs: nowMs }
  ].slice(-24);
  state.meta.creatorExtensions.updatedAtMs = nowMs;
  state.plot.updatedAt = nowMs;
  pushEvent(ctx.appendEvent, {
    type: EVENT_TYPES.CREATOR_BUILDING_DISABLED,
    actor: 'HUMAN',
    explanation: `${manifest.label} disabled.`,
    recapLine: `${manifest.label} was disabled.`,
    data: { extensionId: manifest.id, objectId: manifest.install.objectId }
  });
  return {
    creatorExtensions: creatorExtensionsView(state)
  };
}

function applyRemoveCreatorBuilding(state, { extensionId = 'creator.notice-kiosk' } = {}, ctx = {}) {
  const nowMs = normalizeCount(ctx.nowMs || Date.now());
  const manifest = requireCreatorManifest(extensionId);
  state.meta.creatorExtensions = normalizeCreatorExtensions(state?.meta?.creatorExtensions || {});
  if (!state.meta.creatorExtensions.installed[manifest.id]) {
    const error = new Error('CREATOR_INSTALLATION_REQUIRED');
    error.details = { extensionId: manifest.id };
    throw error;
  }
  delete state.meta.creatorExtensions.installed[manifest.id];
  state.meta.creatorExtensions.history = [
    ...state.meta.creatorExtensions.history,
    { action: 'REMOVED', extensionId: manifest.id, atMs: nowMs }
  ].slice(-24);
  state.meta.creatorExtensions.updatedAtMs = nowMs;
  state.plot.updatedAt = nowMs;
  pushEvent(ctx.appendEvent, {
    type: EVENT_TYPES.CREATOR_BUILDING_REMOVED,
    actor: 'HUMAN',
    explanation: `${manifest.label} removed from Founders Plot.`,
    recapLine: `${manifest.label} was removed safely.`,
    data: { extensionId: manifest.id, objectId: manifest.install.objectId }
  });
  return {
    creatorExtensions: creatorExtensionsView(state)
  };
}

function applyCreatorNoticeKioskPostNotice(state, { text = '' } = {}, ctx = {}) {
  const nowMs = normalizeCount(ctx.nowMs || Date.now());
  const manifest = requireCreatorManifest('creator.notice-kiosk');
  const validation = validateCreatorToolInput(manifest, 'et.creator.notice_kiosk.post_notice', {
    text,
    idempotencyKey: 'validated-by-route'
  });
  if (!validation.ok) {
    const error = new Error(validation.error);
    error.details = { extensionId: manifest.id, toolName: 'et.creator.notice_kiosk.post_notice' };
    throw error;
  }
  state.meta.creatorExtensions = normalizeCreatorExtensions(state?.meta?.creatorExtensions || {});
  const current = state.meta.creatorExtensions.installed[manifest.id] || null;
  if (!current || current.status !== 'ACTIVE') {
    const error = new Error('CREATOR_INSTALLATION_REQUIRED');
    error.details = { extensionId: manifest.id };
    throw error;
  }
  const notice = validation.args.text;
  current.state.noticeCount = normalizeCount(current.state.noticeCount) + 1;
  current.state.featuredNotice = notice;
  current.state.enabled = true;
  current.updatedAtMs = nowMs;
  state.meta.creatorExtensions.installed[manifest.id] = normalizeCreatorInstallation(current);
  state.meta.creatorExtensions.history = [
    ...state.meta.creatorExtensions.history,
    { action: 'TOOL_RAN', extensionId: manifest.id, atMs: nowMs }
  ].slice(-24);
  state.meta.creatorExtensions.updatedAtMs = nowMs;
  state.plot.updatedAt = nowMs;
  pushEvent(ctx.appendEvent, {
    type: EVENT_TYPES.CREATOR_TOOL_RAN,
    actor: 'HUMAN',
    explanation: `${manifest.label} posted a town notice.`,
    recapLine: `${manifest.label} posted a notice.`,
    data: {
      extensionId: manifest.id,
      toolName: 'et.creator.notice_kiosk.post_notice',
      objectId: manifest.install.objectId,
      result: {
        noticeCount: current.state.noticeCount,
        featuredNotice: notice
      }
    }
  });
  return {
    creatorExtensions: creatorExtensionsView(state),
    notice: {
      noticeCount: current.state.noticeCount,
      featuredNotice: notice
    }
  };
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
      governance: state.meta.governance,
      doctrine: state.meta.doctrine,
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
      landmarks: state.meta.landmarks,
      townPostcards: state.meta.townPostcards,
      townOpportunities: state.meta.townOpportunities,
      scenarios: state.meta.scenarios,
      settlements: state.meta.settlements,
      operatingModel: state.meta.operatingModel,
      specialists: state.meta.specialists,
      regionalNetwork: state.meta.regionalNetwork,
      creatorExtensions: state.meta.creatorExtensions,
      teachingPreferences: state.meta.teachingPreferences
    }
  };
}

function stateView(state, recentEvents = []) {
  const viewNowMs = Date.now();
  ensureContractBoard(state, viewNowMs);
  refreshActiveContractState(state, viewNowMs);
  const currentGoal = resolvePrimaryGoal(state);
  const observation = buildForemanObservation(state, {
    runtimeId: state.meta.foremanRuntime.runtimeId,
    nowMs: viewNowMs,
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
  const companion = companionAdvice(state, { goal: currentGoal });
  const journalEntries = buildTownJournalEntries(recentEvents);
  const morningBrief = buildMorningBrief(state, recentEvents, {
    goal: currentGoal,
    companion,
    nowMs: Date.now()
  });
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
    landmarks: landmarksView(state),
    townPostcards: townPostcardView(state),
    townOpportunity: copyJson(state.meta.townOpportunities),
    scenarios: civicScenarioView(state),
    settlements: settlementLedgerView(state, { nowMs: viewNowMs }),
    operatingModel: operatingModelView(state),
    regionalNetwork: regionalLedgerView(state, { nowMs: viewNowMs }),
    creatorExtensions: creatorExtensionsView(state),
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
      buildingCatalog: buildingCatalog(state),
      permissions: unlockedPermissionKeys(state.plot.hqLevel)
    },
    currentGoal,
    quest: nextQuest(state),
    contracts: {
      boardLocked: state.plot.hqLevel < 2,
      offers: copyJson(state.meta.contracts.offers),
      activeContract: copyJson(state.meta.contracts.activeContract),
      completed: copyJson(state.meta.contracts.completed),
      recommendation: copyJson(recommendContractChoice(state))
    },
    foreman: {
      recommendation: companion.recommendation || recommendationText(state),
      companionAdvice: companion,
      allowedTools: unlockedToolNames(state),
      pendingApprovals: pendingApprovalsView(state),
      standingOrder: foremanStandingOrder(state),
      governance: foremanGovernanceView(state, { nowMs: viewNowMs }),
      doctrine: foremanDoctrineView(state),
      specialists: specialistsView(state, { nowMs: viewNowMs }),
      runtime: {
        ...copyJson(state.meta.foremanRuntime),
        token: undefined
      },
      scheduler: copyJson(state.meta.scheduler),
      teachingPreferences: copyJson(state.meta.teachingPreferences),
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
      recent: recentEventsView(recentEvents),
      morningBrief
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

function applySoftMissedCivicScenario(state, scenario, nowMs, appendEvent) {
  if (!scenario || scenario.status !== 'ACTIVE') return null;
  if (normalizeCount(scenario.completedTasks) >= normalizeCount(scenario.minCompletedTasks)) return null;
  const missed = normalizeCivicScenario({
    ...copyJson(scenario),
    status: 'SOFT_MISSED',
    missedAtMs: nowMs
  });
  state.meta.scenarios.completed.push(missed);
  state.meta.scenarios.completed = state.meta.scenarios.completed.slice(-8);
  state.meta.scenarios.active = null;
  const signalResult = applyTownSignals(state, missed?.softMiss?.signalDelta || {}, {
    actor: 'SYSTEM',
    reason: 'CIVIC_SCENARIO_SOFT_MISSED',
    sourceId: missed.scenarioId,
    appendEvent,
    nowMs
  });
  pushEvent(appendEvent, {
    type: EVENT_TYPES.CIVIC_SCENARIO_SOFT_MISSED,
    actor: 'SYSTEM',
    explanation: `${missed.title} passed with unfinished prep.`,
    recapLine: missed.softMiss.recapLine || `${missed.title} slipped by with a soft miss.`,
    data: {
      scenario: copyJson(missed),
      signalDelta: signalResult.delta
    }
  });
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
    const scenario = activeCivicScenario(state);
    if (scenario && normalizeCount(scenario.dueAtMs) > 0 && normalizeCount(scenario.dueAtMs) <= safeTargetMs) {
      applySoftMissedCivicScenario(state, scenario, normalizeCount(scenario.dueAtMs) || safeTargetMs, appendEvent);
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
    const scenario = activeCivicScenario(state);
    if (scenario && normalizeCount(scenario.dueAtMs) > 0 && normalizeCount(scenario.dueAtMs) <= nextTick) {
      applySoftMissedCivicScenario(state, scenario, normalizeCount(scenario.dueAtMs) || nextTick, appendEvent);
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
  if (building.type === 'LUMBER_CAMP') ensureTownOpportunity(state, ctx.nowMs);
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
    recapLine: `Accepted contract from ${contractRequesterName(offer)} at ${contractRequesterInstitution(offer)}.`,
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
    recapLine: `${contractRequesterName(contract)} at ${contractRequesterInstitution(contract)} says ${contract.townBenefit || `${contract.title} helped the town`}.`,
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

function canChoosePublicSquareStyle(state) {
  const landmark = state?.meta?.landmarks?.publicSquare;
  return !!landmark
    && normalizeCount(landmark.level) >= 1
    && !normalizePublicSquareStyleId(landmark.styleId);
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

function applyResolveTownOpportunity(state, { opportunityId, optionId }, ctx) {
  const opportunity = activeTownOpportunity(state, ctx.nowMs);
  if (!opportunity || String(opportunity.opportunityId || '') !== String(opportunityId || '')) {
    const error = new Error('INVALID_STATE');
    error.details = { opportunityId, reason: 'NO_ACTIVE_OPPORTUNITY' };
    throw error;
  }
  const option = opportunity.options.find((candidate) => String(candidate.optionId || '') === String(optionId || '')) || null;
  if (!option) {
    const error = new Error('INVALID_STATE');
    error.details = { opportunityId, optionId, reason: 'UNKNOWN_OPTION' };
    throw error;
  }
  if (!canAffordCost(state.plot, option.cost)) {
    const error = new Error('OUT_OF_RESOURCES');
    error.details = { opportunityId, optionId, cost: copyJson(option.cost), inventory: inventorySnapshot(state.plot) };
    throw error;
  }

  const before = { ...inventorySnapshot(state.plot), townXp: normalizeCount(state.plot.townXp) };
  spendInventory(state.plot, option.cost);
  addInventory(state.plot, option.reward.resources);
  addXp(state, option.reward.townXp);
  const signalResult = applyTownSignals(state, option.signalDelta, {
    actor: 'HUMAN',
    reason: 'TOWN_OPPORTUNITY_RESOLVED',
    sourceId: opportunity.opportunityId,
    appendEvent: ctx.appendEvent,
    nowMs: ctx.nowMs
  });
  const result = normalizeTownOpportunityResult({
    opportunityId: opportunity.opportunityId,
    optionId: option.optionId,
    title: option.outcomeTitle,
    body: option.outcomeBody,
    cost: option.cost,
    reward: option.reward,
    signalDelta: signalResult.delta,
    resolvedAtMs: ctx.nowMs
  });
  state.meta.townOpportunities.completed.push(result);
  state.meta.townOpportunities.completed = state.meta.townOpportunities.completed.slice(-8);
  state.meta.townOpportunities.active = null;
  pushEvent(ctx.appendEvent, {
    type: EVENT_TYPES.TOWN_OPPORTUNITY_RESOLVED,
    actor: 'HUMAN',
    explanation: `${option.label} resolved the town opportunity.`,
    recapLine: result.body || `${option.label} shaped the town mood.`,
    data: {
      opportunity: copyJson(opportunity),
      option: copyJson(option),
      result: copyJson(result),
      signalDelta: signalResult.delta,
      resourceDelta: captureResourceDelta(state, {
        before,
        consumed: option.cost,
        rewarded: {
          ...option.reward.resources,
          townXp: option.reward.townXp
        }
      })
    }
  });
  return {
    opportunityId: opportunity.opportunityId,
    optionId: option.optionId,
    result: copyJson(result),
    resourceDelta: captureResourceDelta(state, {
      before,
      consumed: option.cost,
      rewarded: {
        ...option.reward.resources,
        townXp: option.reward.townXp
      }
    }),
    signalDelta: signalResult.delta
  };
}

function applySetTownIdentity(state, { landmarkId, styleId }, ctx) {
  const normalizedId = String(landmarkId || '').trim();
  if (normalizedId !== 'public_square_welcome_sign') {
    const error = new Error('INVALID_STATE');
    error.details = { landmarkId, reason: 'UNKNOWN_LANDMARK' };
    throw error;
  }
  state.meta.landmarks = normalizeLandmarks(state.meta.landmarks);
  const landmark = state.meta.landmarks.publicSquare;
  if (normalizeCount(landmark.level) < 1) {
    const error = new Error('INVALID_STATE');
    error.details = { landmarkId, reason: 'LANDMARK_NOT_RAISED' };
    throw error;
  }
  const style = publicSquareStyleForId(styleId);
  if (!style) {
    const error = new Error('INVALID_STATE');
    error.details = { landmarkId, styleId, reason: 'UNKNOWN_STYLE' };
    throw error;
  }
  const before = { ...inventorySnapshot(state.plot), townXp: normalizeCount(state.plot.townXp) };
  if (landmark.styleId === style.styleId) {
    return {
      landmark: landmarksView(state).publicSquare,
      style: copyJson(style),
      resourceDelta: captureResourceDelta(state, { before })
    };
  }
  landmark.styleId = style.styleId;
  landmark.styleLabel = style.label;
  landmark.styleAppliedAtMs = ctx.nowMs;
  state.plot.updatedAt = ctx.nowMs;
  pushEvent(ctx.appendEvent, {
    type: EVENT_TYPES.TOWN_IDENTITY_SET,
    actor: 'HUMAN',
    explanation: `The Public Square style became ${style.label}.`,
    recapLine: `The Public Square now carries the ${style.label} style.`,
    data: {
      landmark: copyJson(landmark),
      style: copyJson(style),
      resourceDelta: captureResourceDelta(state, { before })
    }
  });
  return {
    landmark: landmarksView(state).publicSquare,
    style: copyJson(style),
    resourceDelta: captureResourceDelta(state, { before })
  };
}

function applyStartCivicScenario(state, { scenarioId }, ctx) {
  state.meta.scenarios = normalizeCivicScenarios(state.meta.scenarios);
  if (state.meta.scenarios.active) {
    const error = new Error('INVALID_STATE');
    error.details = {
      reason: 'SCENARIO_ACTIVE_EXISTS',
      scenarioId: state.meta.scenarios.active.scenarioId
    };
    throw error;
  }
  const offer = availableCivicScenarioOffers(state, ctx.nowMs)
    .find((candidate) => String(candidate.scenarioId || '') === String(scenarioId || '')) || null;
  if (!offer) {
    const error = new Error('INVALID_STATE');
    error.details = { scenarioId, reason: 'SCENARIO_NOT_AVAILABLE' };
    throw error;
  }
  const active = normalizeCivicScenario({
    ...copyJson(offer),
    status: 'ACTIVE',
    startedAtMs: ctx.nowMs,
    dueAtMs: ctx.nowMs + (CIVIC_SCENARIO_TEMPLATES.find((template) => template.scenarioId === offer.scenarioId)?.durationMs || 10 * 60 * 1000)
  });
  state.meta.scenarios.active = active;
  state.plot.updatedAt = ctx.nowMs;
  pushEvent(ctx.appendEvent, {
    type: EVENT_TYPES.CIVIC_SCENARIO_STARTED,
    actor: 'HUMAN',
    explanation: `${active.title} started at the Public Square.`,
    recapLine: `${active.title} started at the Public Square.`,
    data: {
      plot: plotSnapshot(state),
      scenario: copyJson(active)
    }
  });
  return {
    scenario: copyJson(active)
  };
}

function applyContributeCivicScenario(state, { scenarioId, taskId }, ctx) {
  state.meta.scenarios = normalizeCivicScenarios(state.meta.scenarios);
  const scenario = state.meta.scenarios.active;
  if (!scenario || String(scenario.scenarioId || '') !== String(scenarioId || '')) {
    const error = new Error('INVALID_STATE');
    error.details = { scenarioId, reason: 'NO_ACTIVE_SCENARIO' };
    throw error;
  }
  if (scenario.status !== 'ACTIVE') {
    const error = new Error('INVALID_STATE');
    error.details = { scenarioId, status: scenario.status };
    throw error;
  }
  if (normalizeCount(scenario.dueAtMs) > 0 && normalizeCount(scenario.dueAtMs) <= ctx.nowMs) {
    applySoftMissedCivicScenario(state, scenario, normalizeCount(scenario.dueAtMs), ctx.appendEvent);
    const error = new Error('INVALID_STATE');
    error.details = { scenarioId, reason: 'SCENARIO_SOFT_MISSED' };
    throw error;
  }
  const task = scenario.tasks.find((candidate) => String(candidate.taskId || '') === String(taskId || '')) || null;
  if (!task) {
    const error = new Error('INVALID_STATE');
    error.details = { scenarioId, taskId, reason: 'UNKNOWN_TASK' };
    throw error;
  }
  if (task.completed === true) {
    return {
      scenario: copyJson(scenario),
      task: copyJson(task),
      completed: false
    };
  }
  if (!canAffordCost(state.plot, task.cost)) {
    const error = new Error('OUT_OF_RESOURCES');
    error.details = { scenarioId, taskId, cost: copyJson(task.cost), inventory: inventorySnapshot(state.plot) };
    throw error;
  }

  const before = { ...inventorySnapshot(state.plot), townXp: normalizeCount(state.plot.townXp) };
  spendInventory(state.plot, task.cost);
  task.completed = true;
  task.completedAtMs = ctx.nowMs;
  scenario.completedTasks = scenario.tasks.filter((entry) => entry.completed === true).length;
  scenario.progress = Math.max(0, Math.min(1, scenario.completedTasks / Math.max(1, scenario.minCompletedTasks)));
  const taskSignalResult = applyTownSignals(state, task.signalDelta, {
    actor: 'HUMAN',
    reason: 'CIVIC_SCENARIO_PROGRESS',
    sourceId: `${scenario.scenarioId}:${task.taskId}`,
    appendEvent: ctx.appendEvent,
    nowMs: ctx.nowMs
  });
  pushEvent(ctx.appendEvent, {
    type: EVENT_TYPES.CIVIC_SCENARIO_PROGRESS,
    actor: 'HUMAN',
    explanation: `${task.label} advanced ${scenario.title}.`,
    recapLine: `${scenario.title}: ${task.label} completed.`,
    data: {
      plot: plotSnapshot(state),
      scenario: copyJson(scenario),
      task: copyJson(task),
      signalDelta: taskSignalResult.delta,
      resourceDelta: captureResourceDelta(state, {
        before,
        consumed: task.cost
      })
    }
  });

  if (scenario.completedTasks >= scenario.minCompletedTasks) {
    addInventoryWithCaps(state.plot, scenario.reward.resources);
    addXp(state, scenario.reward.townXp);
    const rewardSignalResult = applyTownSignals(state, scenario.reward.signalDelta, {
      actor: 'HUMAN',
      reason: 'CIVIC_SCENARIO_COMPLETED',
      sourceId: scenario.scenarioId,
      appendEvent: ctx.appendEvent,
      nowMs: ctx.nowMs
    });
    const completed = normalizeCivicScenario({
      ...copyJson(scenario),
      status: 'COMPLETED',
      completedAtMs: ctx.nowMs
    });
    state.meta.scenarios.completed.push(completed);
    state.meta.scenarios.completed = state.meta.scenarios.completed.slice(-8);
    state.meta.scenarios.active = null;
    pushEvent(ctx.appendEvent, {
      type: EVENT_TYPES.CIVIC_SCENARIO_COMPLETED,
      actor: 'HUMAN',
      explanation: `${completed.title} completed.`,
      recapLine: `${completed.title} completed; the town handled the storm calmly.`,
      data: {
        plot: plotSnapshot(state),
        scenario: copyJson(completed),
        signalDelta: rewardSignalResult.delta,
        resourceDelta: captureResourceDelta(state, {
          before,
          consumed: task.cost,
          rewarded: {
            ...scenario.reward.resources,
            townXp: scenario.reward.townXp
          }
        })
      }
    });
    return {
      scenario: copyJson(completed),
      task: copyJson(task),
      completed: true
    };
  }

  state.meta.scenarios.active = normalizeCivicScenario(scenario);
  state.plot.updatedAt = ctx.nowMs;
  return {
    scenario: copyJson(state.meta.scenarios.active),
    task: copyJson(task),
    completed: false
  };
}

function schedulerStatusView(state) {
  return copyJson(state.meta.scheduler);
}

function currentForemanLease(state, nowMs = Date.now()) {
  const lease = state?.meta?.governance?.activeLease ? normalizeForemanLease(state.meta.governance.activeLease) : null;
  if (!lease || !lease.leaseId || lease.status !== 'ACTIVE') return null;
  if (lease.expiresAtMs > 0 && lease.expiresAtMs <= nowMs) {
    state.meta.governance.activeLease = {
      ...lease,
      status: 'EXPIRED'
    };
    state.meta.governance.leaseHistory = [state.meta.governance.activeLease, ...(state.meta.governance.leaseHistory || [])].slice(0, 10);
    return null;
  }
  return lease;
}

function currentPersistentForeman(state, nowMs = Date.now()) {
  const persistent = normalizePersistentForeman(state?.meta?.governance?.persistent || {});
  if (persistent.status === 'ACTIVE' && persistent.expiresAtMs > 0 && persistent.expiresAtMs <= nowMs) {
    const expired = normalizePersistentForeman({
      ...persistent,
      status: 'EXPIRED',
      lastErrorCode: 'LEASE_EXPIRED',
      nextTickAtMs: 0
    });
    state.meta.governance.persistent = expired;
    state.meta.scheduler.collectReadyOutputs.paused = true;
    return expired;
  }
  state.meta.governance.persistent = persistent;
  return persistent;
}

function persistentForemanView(state, { nowMs = Date.now() } = {}) {
  const persistent = currentPersistentForeman(state, nowMs);
  const active = persistent.status === 'ACTIVE';
  const paused = persistent.status === 'PAUSED' || persistent.status === 'EXPIRED';
  return {
    ...copyJson(persistent),
    active,
    paused,
    summary: active
      ? `Clover can watch while you are away until ${new Date(persistent.expiresAtMs).toISOString()}.`
      : paused
        ? 'While-away Clover help is paused.'
        : 'While-away Clover help is off.'
  };
}

function foremanGovernanceView(state, { nowMs = Date.now() } = {}) {
  const activeLease = currentForemanLease(state, nowMs);
  const exceptions = Array.isArray(state?.meta?.governance?.exceptions)
    ? state.meta.governance.exceptions.map((entry) => normalizeForemanException(entry))
    : [];
  const openExceptions = exceptions.filter((entry) => entry.status === 'OPEN');
  const persistent = persistentForemanView(state, { nowMs });
  return {
    activeLease: activeLease ? copyJson(activeLease) : null,
    leaseRequiredForRoutine: true,
    persistent,
    openExceptions: openExceptions.map((entry) => copyJson(entry)),
    resolvedExceptions: exceptions.filter((entry) => entry.status !== 'OPEN').slice(0, 8).map((entry) => copyJson(entry)),
    summary: activeLease
      ? `${persistent.active ? 'While-away help active. ' : ''}Lease active until ${new Date(activeLease.expiresAtMs).toISOString()}`
      : 'No active Foreman lease'
  };
}

function applyGrantForemanLease(state, { durationMinutes = 15, scope = 'collect_ready_outputs' } = {}, ctx = {}) {
  const nowMs = normalizeCount(ctx.nowMs || Date.now());
  const requestedMs = Math.max(5 * 60 * 1000, Math.floor(Number(durationMinutes || 15) * 60 * 1000));
  const durationMs = Math.min(FOREMAN_MAX_LEASE_MS, requestedMs);
  const runtime = normalizeForemanRuntime(state.meta.foremanRuntime || {});
  const lease = normalizeForemanLease({
    leaseId: randomId('fls'),
    status: 'ACTIVE',
    scope: String(scope || 'collect_ready_outputs').trim() || 'collect_ready_outputs',
    grantedBy: 'HUMAN',
    runtimeId: runtime.runtimeId,
    requiresUnlockedBrain: true,
    grantedAtMs: nowMs,
    expiresAtMs: nowMs + durationMs
  });
  const previous = state.meta.governance.activeLease ? normalizeForemanLease(state.meta.governance.activeLease) : null;
  state.meta.governance.activeLease = lease;
  state.meta.governance.leaseHistory = [
    ...(previous && previous.leaseId ? [previous] : []),
    ...(state.meta.governance.leaseHistory || [])
  ].slice(0, 10);
  pushEvent(ctx.appendEvent, {
    type: EVENT_TYPES.FOREMAN_LEASE_GRANTED,
    actor: 'HUMAN',
    explanation: 'Foreman governance lease granted.',
    recapLine: 'Clover received a time-boxed Foreman lease.',
    data: {
      lease
    }
  });
  return foremanGovernanceView(state, { nowMs });
}

function applyRevokeForemanLease(state, { reason = 'Player revoked Foreman lease.' } = {}, ctx = {}) {
  const nowMs = normalizeCount(ctx.nowMs || Date.now());
  const current = state.meta.governance.activeLease ? normalizeForemanLease(state.meta.governance.activeLease) : null;
  if (!current || !current.leaseId || current.status !== 'ACTIVE') {
    return foremanGovernanceView(state, { nowMs });
  }
  const revoked = normalizeForemanLease({
    ...current,
    status: 'REVOKED',
    revokedAtMs: nowMs,
    revokeReason: String(reason || 'Player revoked Foreman lease.').trim()
  });
  state.meta.governance.activeLease = null;
  state.meta.governance.leaseHistory = [revoked, ...(state.meta.governance.leaseHistory || [])].slice(0, 10);
  state.meta.scheduler.collectReadyOutputs.paused = true;
  if (state.meta.foremanRuntime.status && state.meta.foremanRuntime.status !== 'NOT_STARTED') {
    state.meta.foremanRuntime.status = 'PAUSED';
    state.meta.foremanRuntime.pausedAt = nowMs;
  }
  pushEvent(ctx.appendEvent, {
    type: EVENT_TYPES.FOREMAN_LEASE_REVOKED,
    actor: 'HUMAN',
    explanation: 'Foreman governance lease revoked.',
    recapLine: 'Clover paused because the Foreman lease was revoked.',
    data: {
      lease: revoked,
      scheduler: schedulerStatusView(state)
    }
  });
  return foremanGovernanceView(state, { nowMs });
}

function applyRaiseForemanException(state, {
  title = '',
  body = '',
  requestedAction = '',
  severity = 'needs_review',
  source = 'foreman',
  payload = {}
} = {}, ctx = {}) {
  const nowMs = normalizeCount(ctx.nowMs || Date.now());
  const exception = normalizeForemanException({
    exceptionId: randomId('fex'),
    status: 'OPEN',
    severity,
    title: title || 'Clover needs a decision',
    body: body || 'Review this before Clover continues.',
    requestedAction,
    source,
    payload,
    createdAtMs: nowMs
  });
  state.meta.governance.exceptions = [exception, ...(state.meta.governance.exceptions || [])].slice(0, 20);
  pushEvent(ctx.appendEvent, {
    type: EVENT_TYPES.FOREMAN_EXCEPTION_RAISED,
    actor: 'AGENT',
    explanation: 'Foreman exception raised for player review.',
    recapLine: exception.title,
    data: {
      exception
    }
  });
  return foremanGovernanceView(state, { nowMs });
}

function applyResolveForemanException(state, { exceptionId = '', resolution = 'RESOLVED' } = {}, ctx = {}) {
  const nowMs = normalizeCount(ctx.nowMs || Date.now());
  const targetId = String(exceptionId || '').trim();
  const exceptions = Array.isArray(state.meta.governance.exceptions) ? state.meta.governance.exceptions : [];
  const index = exceptions.findIndex((entry) => entry && entry.exceptionId === targetId);
  if (index < 0) {
    const error = new Error('INVALID_STATE');
    error.details = { reason: 'FOREMAN_EXCEPTION_NOT_FOUND', exceptionId };
    throw error;
  }
  const resolved = normalizeForemanException({
    ...exceptions[index],
    status: 'RESOLVED',
    resolvedAtMs: nowMs,
    resolution: String(resolution || 'RESOLVED').trim().toUpperCase()
  });
  exceptions[index] = resolved;
  state.meta.governance.exceptions = exceptions;
  pushEvent(ctx.appendEvent, {
    type: EVENT_TYPES.FOREMAN_EXCEPTION_RESOLVED,
    actor: 'HUMAN',
    explanation: 'Foreman exception resolved.',
    recapLine: 'A Foreman exception was resolved.',
    data: {
      exception: resolved
    }
  });
  return foremanGovernanceView(state, { nowMs });
}

function hasOpenForemanException(state, requestedAction = '') {
  const action = String(requestedAction || '').trim();
  return (Array.isArray(state?.meta?.governance?.exceptions) ? state.meta.governance.exceptions : [])
    .some((entry) => normalizeForemanException(entry).status === 'OPEN' && (!action || String(entry?.requestedAction || '') === action));
}

function applyStartPersistentForeman(state, { durationMinutes = 120, scope = 'collect_ready_outputs' } = {}, ctx = {}) {
  const nowMs = normalizeCount(ctx.nowMs || Date.now());
  const lease = applyGrantForemanLease(state, {
    durationMinutes,
    scope
  }, ctx).activeLease;
  const persistent = normalizePersistentForeman({
    runtimeId: randomId('pfr'),
    status: 'ACTIVE',
    scope: String(scope || 'collect_ready_outputs').trim() || 'collect_ready_outputs',
    authorizationId: randomId('pfa'),
    authorizedBy: 'HUMAN_UNLOCKED_BRAIN',
    requiresUnlockedBrain: true,
    startedAtMs: nowMs,
    expiresAtMs: normalizeCount(lease?.expiresAtMs || nowMs),
    lastTickAtMs: 0,
    nextTickAtMs: nowMs,
    actionCount: 0,
    lastResult: null,
    lastErrorCode: ''
  });
  state.meta.governance.persistent = persistent;
  state.meta.scheduler.collectReadyOutputs.enabled = true;
  state.meta.scheduler.collectReadyOutputs.paused = false;
  state.meta.scheduler.collectReadyOutputs.runtimeScope = 'background_foreman_pool';
  state.meta.scheduler.collectReadyOutputs.nextRunAtMs = nowMs;
  state.plot.updatedAt = nowMs;
  pushEvent(ctx.appendEvent, {
    type: EVENT_TYPES.FOREMAN_PERSISTENT_STARTED,
    actor: 'HUMAN',
    explanation: 'Persistent Foreman governance started for bounded routine help.',
    recapLine: 'Clover can watch for ready outputs while you are away.',
    data: {
      persistent,
      scheduler: schedulerStatusView(state)
    }
  });
  return foremanGovernanceView(state, { nowMs });
}

function applyPausePersistentForeman(state, { reason = 'Player paused while-away Clover help.' } = {}, ctx = {}) {
  const nowMs = normalizeCount(ctx.nowMs || Date.now());
  const current = normalizePersistentForeman(state?.meta?.governance?.persistent || {});
  if (current.status !== 'ACTIVE') {
    return foremanGovernanceView(state, { nowMs });
  }
  const paused = normalizePersistentForeman({
    ...current,
    status: 'PAUSED',
    pausedAtMs: nowMs,
    lastErrorCode: String(reason || '').trim()
  });
  state.meta.governance.persistent = paused;
  state.meta.scheduler.collectReadyOutputs.paused = true;
  state.plot.updatedAt = nowMs;
  pushEvent(ctx.appendEvent, {
    type: EVENT_TYPES.FOREMAN_PERSISTENT_PAUSED,
    actor: 'HUMAN',
    explanation: 'Persistent Foreman governance paused.',
    recapLine: 'Clover stopped watching while you are away.',
    data: {
      persistent: paused,
      scheduler: schedulerStatusView(state)
    }
  });
  return foremanGovernanceView(state, { nowMs });
}

function applyPersistentForemanBlocked(state, { nowMs, requestedAction, title, body, errorCode }, ctx = {}) {
  const persistent = normalizePersistentForeman(state.meta.governance.persistent || {});
  state.meta.governance.persistent = normalizePersistentForeman({
    ...persistent,
    lastTickAtMs: nowMs,
    nextTickAtMs: nowMs + 60_000,
    lastErrorCode: errorCode,
    lastResult: {
      status: 'blocked',
      reason: errorCode,
      atMs: nowMs
    }
  });
  if (!hasOpenForemanException(state, requestedAction)) {
    applyRaiseForemanException(state, {
      title,
      body,
      requestedAction,
      severity: 'blocked',
      payload: {
        runtimeScope: 'background_foreman_pool',
        errorCode
      }
    }, ctx);
  }
}

function applyPersistentForemanTick(state, { nowMs = Date.now(), recentEvents = [] } = {}, ctx = {}) {
  const tickMs = normalizeCount(nowMs || Date.now());
  const persistent = currentPersistentForeman(state, tickMs);
  const task = state.meta.scheduler.collectReadyOutputs;
  if (persistent.status !== 'ACTIVE') {
    return { ran: false, reason: 'NOT_ACTIVE', governance: foremanGovernanceView(state, { nowMs: tickMs }) };
  }
  if (normalizeCount(task.nextRunAtMs) > tickMs) {
    return { ran: false, reason: 'NOT_DUE', governance: foremanGovernanceView(state, { nowMs: tickMs }) };
  }
  const lease = currentForemanLease(state, tickMs);
  if (!lease) {
    applyPersistentForemanBlocked(state, {
      nowMs: tickMs,
      requestedAction: 'renew_foreman_lease',
      title: 'Renew Clover lease',
      body: 'Clover needs a fresh time-boxed lease before while-away help continues.',
      errorCode: 'LEASE_REQUIRED'
    }, ctx);
    state.meta.scheduler.collectReadyOutputs.paused = true;
    return { ran: false, reason: 'LEASE_REQUIRED', governance: foremanGovernanceView(state, { nowMs: tickMs }) };
  }
  if (task.enabled !== true || task.paused === true) {
    state.meta.governance.persistent = normalizePersistentForeman({
      ...persistent,
      lastTickAtMs: tickMs,
      nextTickAtMs: tickMs + 60_000,
      lastResult: {
        status: 'skipped',
        reason: task.enabled === true ? 'SCHEDULER_PAUSED' : 'SCHEDULER_DISABLED',
        atMs: tickMs
      }
    });
    return { ran: false, reason: task.enabled === true ? 'SCHEDULER_PAUSED' : 'SCHEDULER_DISABLED', governance: foremanGovernanceView(state, { nowMs: tickMs }) };
  }
  if (state.policy.collectOutputs !== true) {
    applyPersistentForemanBlocked(state, {
      nowMs: tickMs,
      requestedAction: 'enable_collect_outputs_permission',
      title: 'Allow Clover to collect outputs',
      body: 'While-away Clover help can only collect ready goods after you allow the collect outputs permission.',
      errorCode: 'COLLECT_PERMISSION_REQUIRED'
    }, ctx);
    return { ran: false, reason: 'COLLECT_PERMISSION_REQUIRED', governance: foremanGovernanceView(state, { nowMs: tickMs }) };
  }

  const observation = buildForemanObservation(state, {
    runtimeId: persistent.runtimeId,
    runtimeScope: 'background_foreman_pool',
    nowMs: tickMs,
    recentEvents
  });
  const candidates = buildSafeForemanCandidates(state, observation);
  const chosen = candidates.find((candidate) => candidate.canActNow === true && candidate.toolName === 'et.plot.collect_outputs') || null;
  if (!chosen) {
    state.meta.governance.persistent = normalizePersistentForeman({
      ...persistent,
      lastTickAtMs: tickMs,
      nextTickAtMs: tickMs + 60_000,
      lastResult: {
        status: 'noop',
        reason: 'NO_READY_OUTPUT',
        atMs: tickMs
      }
    });
    task.nextRunAtMs = tickMs + 60_000;
    return { ran: false, reason: 'NO_READY_OUTPUT', governance: foremanGovernanceView(state, { nowMs: tickMs }) };
  }

  const decision = buildForemanDecision({
    observation,
    safeCandidates: candidates,
    chosenCandidateId: chosen.candidateId,
    source: 'server_default'
  });
  state.meta.foremanLastDecision = {
    ...decision,
    reason: decision.planCard?.reason || '',
    playerFacingLine: 'Clover collected ready output while you were away under your lease.',
    meta: {
      runtimeScope: 'background_foreman_pool',
      persistentRuntimeId: persistent.runtimeId,
      selectedCandidateId: chosen.candidateId,
      canonicalToolName: chosen.toolName
    }
  };
  const result = applyCollectOutputs(state, {
    actor: 'AGENT',
    buildingId: chosen.buildingId
  }, {
    ...ctx,
    nowMs: tickMs,
    actorMeta: {
      runtimeScope: 'background_foreman_pool',
      persistentRuntimeId: persistent.runtimeId,
      authorityUsed: 'Persistent Foreman lease'
    }
  });
  const doctrine = foremanDoctrineView(state);
  const receipt = appendForemanReceipt(state, {
    receiptId: randomId('rcpt'),
    action: 'collect_ready_outputs',
    result: 'completed',
    reason: 'Clover collected ready output while you were away under your lease.',
    authorityUsed: 'Persistent Foreman lease',
    standingOrderUsed: foremanStandingOrder(state),
    doctrineUsed: doctrine.activeRules.length > 0
      ? {
        activeRules: doctrine.activeRules,
        summary: doctrine.summary
      }
      : null,
    correctionOptions: ['ASK_ME_NEXT_TIME', 'PAUSE_FOREMAN'],
    createdAt: tickMs,
    eventId: 0
  });
  task.runCount += 1;
  task.nextRunAtMs = tickMs + 15_000;
  task.lastResult = {
    status: 'completed',
    action: 'collect_ready_outputs',
    buildingId: chosen.buildingId,
    atMs: tickMs
  };
  state.meta.governance.persistent = normalizePersistentForeman({
    ...persistent,
    lastTickAtMs: tickMs,
    nextTickAtMs: task.nextRunAtMs,
    actionCount: persistent.actionCount + 1,
    lastErrorCode: '',
    lastResult: task.lastResult
  });
  state.plot.updatedAt = tickMs;
  pushEvent(ctx.appendEvent, {
    type: EVENT_TYPES.FOREMAN_RECEIPT_CREATED,
    actor: 'SYSTEM',
    explanation: 'Persistent Foreman receipt created for collect_ready_outputs.',
    recapLine: receipt.reason,
    data: {
      receipt
    }
  });
  pushEvent(ctx.appendEvent, {
    type: EVENT_TYPES.FOREMAN_PERSISTENT_TICK,
    actor: 'SYSTEM',
    explanation: 'Persistent Foreman tick completed one bounded routine action.',
    recapLine: 'Clover handled one while-away routine task.',
    data: {
      persistent: persistentForemanView(state, { nowMs: tickMs }),
      receipt,
      result
    }
  });
  return {
    ran: true,
    reason: 'COLLECTED_READY_OUTPUT',
    receipt,
    result,
    governance: foremanGovernanceView(state, { nowMs: tickMs })
  };
}

function applySetForemanDoctrineRule(state, { ruleId = '', enabled = true, source = 'human' } = {}, ctx = {}) {
  const nowMs = normalizeCount(ctx.nowMs || Date.now());
  const normalized = normalizeDoctrineRuleId(ruleId);
  if (!normalized) {
    const error = new Error('INVALID_STATE');
    error.details = { ruleId };
    throw error;
  }
  const nextEnabled = enabled !== false;
  const conflicts = nextEnabled ? doctrineConflictsFor(state, normalized) : [];
  if (conflicts.length > 0) {
    const governance = applyRaiseForemanException(state, {
      title: 'Choose Clover priority',
      body: `${doctrineRuleLabel(normalized)} conflicts with ${doctrineRuleLabels(conflicts).join(', ')}. Turn one off before Clover uses it.`,
      requestedAction: `set_doctrine_rule:${normalized}`,
      severity: 'needs_review',
      payload: {
        ruleId: normalized,
        conflictRuleIds: conflicts
      }
    }, ctx);
    return {
      doctrine: foremanDoctrineView(state),
      conflict: {
        ruleId: normalized,
        conflictRuleIds: conflicts,
        exceptionId: governance.openExceptions[0]?.exceptionId || ''
      },
      governance
    };
  }

  setDoctrineRuleState(state, {
    ruleId: normalized,
    enabled: nextEnabled,
    nowMs,
    source
  });

  const teaching = normalizeTeachingPreferences(state.meta.teachingPreferences || {});
  if (normalized === 'PREFER_RESERVES' && nextEnabled) teaching.contractPreference = 'RESERVES';
  if (normalized === 'PREFER_SPEED' && nextEnabled) teaching.contractPreference = 'SPEED';
  if (normalized === 'PREFER_RESERVES' && !nextEnabled && teaching.contractPreference === 'RESERVES') teaching.contractPreference = '';
  if (normalized === 'PREFER_SPEED' && !nextEnabled && teaching.contractPreference === 'SPEED') teaching.contractPreference = '';
  if (normalized === 'ASK_BEFORE_SPENDING') {
    teaching.askBeforeAutomation = nextEnabled;
    if (nextEnabled) {
      state.meta.scheduler.collectReadyOutputs.enabled = false;
      state.meta.scheduler.collectReadyOutputs.paused = true;
    }
  }
  teaching.latestCorrection = normalized === 'ASK_BEFORE_SPENDING'
    ? 'ASK_ME_FIRST'
    : normalized === 'FINISH_ACTIVE_CONTRACTS_FIRST'
      ? 'DO_THIS_AGAIN'
      : normalized;
  teaching.updatedAt = nowMs;
  state.meta.teachingPreferences = normalizeTeachingPreferences(teaching);
  state.meta.contracts.offers = rankContractOffersForPreference(state, state.meta.contracts.offers || []);
  state.plot.updatedAt = nowMs;

  const doctrine = foremanDoctrineView(state);
  pushEvent(ctx.appendEvent, {
    type: EVENT_TYPES.FOREMAN_DOCTRINE_UPDATED,
    actor: 'HUMAN',
    explanation: `Clover preference ${doctrineRuleLabel(normalized)} ${nextEnabled ? 'enabled' : 'disabled'}.`,
    recapLine: `${doctrineRuleLabel(normalized)} ${nextEnabled ? 'enabled' : 'disabled'} for Clover.`,
    data: {
      ruleId: normalized,
      enabled: nextEnabled,
      doctrine
    }
  });
  return {
    doctrine,
    conflict: null,
    contractRecommendation: recommendContractChoice(state)
  };
}

function applyEnableCollectReadyOutputs(state, ctx) {
  if (!currentForemanLease(state, ctx.nowMs)) {
    applyGrantForemanLease(state, {
      durationMinutes: 15,
      scope: 'collect_ready_outputs'
    }, ctx);
  }
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

function startForemanSession(state, { runtimeId = '', nowMs, pack = {}, brainReady = false }) {
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
    brainReady: brainReady === true,
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

function teachingCorrectionLabel(correction) {
  switch (String(correction || '').trim().toUpperCase()) {
    case 'DO_THIS_AGAIN':
      return 'Do this again';
    case 'ASK_ME_FIRST':
      return 'Ask me first';
    case 'PREFER_RESERVES':
      return 'Prefer reserves';
    case 'PREFER_SPEED':
      return 'Prefer speed';
    default:
      return 'Teaching note';
  }
}

function doctrineRuleForTeachingCorrection(correction) {
  switch (String(correction || '').trim().toUpperCase()) {
    case 'DO_THIS_AGAIN':
      return 'FINISH_ACTIVE_CONTRACTS_FIRST';
    case 'ASK_ME_FIRST':
      return 'ASK_BEFORE_SPENDING';
    case 'PREFER_RESERVES':
      return 'PREFER_RESERVES';
    case 'PREFER_SPEED':
      return 'PREFER_SPEED';
    default:
      return '';
  }
}

function applyForemanPreference(state, { correction, note = '' } = {}, ctx = {}) {
  const normalized = String(correction || '').trim().toUpperCase();
  if (!TEACHING_CORRECTIONS.has(normalized)) {
    const error = new Error('INVALID_STATE');
    error.details = { correction };
    throw error;
  }
  const nowMs = normalizeCount(ctx.nowMs || Date.now());
  const current = normalizeTeachingPreferences(state.meta.teachingPreferences || {});
  const contract = activeContract(state) || latestCompletedContract(state) || null;
  const doctrineRuleId = doctrineRuleForTeachingCorrection(normalized);
  const next = {
    ...current,
    latestCorrection: normalized,
    note: String(note || '').trim(),
    updatedAt: nowMs
  };

  const conflicts = doctrineRuleId ? doctrineConflictsFor(state, doctrineRuleId) : [];
  if (conflicts.length > 0) {
    const governance = applyRaiseForemanException(state, {
      title: 'Choose Clover priority',
      body: `${teachingCorrectionLabel(normalized)} conflicts with ${doctrineRuleLabels(conflicts).join(', ')}. Turn one off before Clover uses it.`,
      requestedAction: `teaching_preference:${normalized}`,
      severity: 'needs_review',
      payload: {
        correction: normalized,
        ruleId: doctrineRuleId,
        conflictRuleIds: conflicts
      }
    }, ctx);
    next.history = [...(current.history || []), {
      correction: normalized,
      contractPreference: current.contractPreference,
      repeatRequesterId: current.repeatRequesterId,
      repeatContractKind: current.repeatContractKind,
      note: next.note,
      createdAt: nowMs
    }].slice(-8);
    state.meta.teachingPreferences = normalizeTeachingPreferences({
      ...next,
      contractPreference: current.contractPreference,
      askBeforeAutomation: current.askBeforeAutomation,
      repeatRequesterId: current.repeatRequesterId,
      repeatContractKind: current.repeatContractKind
    });
    return {
      correction: normalized,
      label: teachingCorrectionLabel(normalized),
      teachingPreferences: copyJson(state.meta.teachingPreferences),
      doctrine: foremanDoctrineView(state),
      conflict: {
        ruleId: doctrineRuleId,
        conflictRuleIds: conflicts,
        exceptionId: governance.openExceptions[0]?.exceptionId || ''
      },
      contractRecommendation: recommendContractChoice(state)
    };
  }

  if (normalized === 'PREFER_RESERVES') {
    next.contractPreference = 'RESERVES';
  }
  if (normalized === 'PREFER_SPEED') {
    next.contractPreference = 'SPEED';
  }
  if (normalized === 'DO_THIS_AGAIN' && contract) {
    next.repeatRequesterId = contract.requesterId;
    next.repeatContractKind = contract.kind;
  }
  if (normalized === 'ASK_ME_FIRST') {
    next.askBeforeAutomation = true;
    state.meta.scheduler.collectReadyOutputs.enabled = false;
    state.meta.scheduler.collectReadyOutputs.paused = true;
  }

  const historyEntry = {
    correction: normalized,
    contractPreference: next.contractPreference,
    repeatRequesterId: next.repeatRequesterId,
    repeatContractKind: next.repeatContractKind,
    note: next.note,
    createdAt: nowMs
  };
  next.history = [...(current.history || []), historyEntry].slice(-8);
  state.meta.teachingPreferences = normalizeTeachingPreferences(next);
  if (doctrineRuleId) {
    setDoctrineRuleState(state, {
      ruleId: doctrineRuleId,
      enabled: true,
      nowMs,
      source: 'teaching'
    });
    pushEvent(ctx.appendEvent, {
      type: EVENT_TYPES.FOREMAN_DOCTRINE_UPDATED,
      actor: 'HUMAN',
      explanation: `Clover preference ${doctrineRuleLabel(doctrineRuleId)} enabled by teaching.`,
      recapLine: `${doctrineRuleLabel(doctrineRuleId)} enabled for Clover.`,
      data: {
        ruleId: doctrineRuleId,
        enabled: true,
        doctrine: foremanDoctrineView(state)
      }
    });
  }
  state.meta.contracts.offers = rankContractOffersForPreference(state, state.meta.contracts.offers || []);
  state.plot.updatedAt = nowMs;
  return {
    correction: normalized,
    label: teachingCorrectionLabel(normalized),
    teachingPreferences: copyJson(state.meta.teachingPreferences),
    doctrine: foremanDoctrineView(state),
    conflict: null,
    contractRecommendation: recommendContractChoice(state)
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

function buildPlotCard(state, { nowMs = Date.now() } = {}) {
  const landmarks = landmarksView(state);
  const square = landmarks.publicSquare || {};
  const style = square.style || null;
  const built = state.buildings
    .filter((building) => building.type !== 'HQ' && building.state !== 'UNDER_CONSTRUCTION')
    .map((building) => ({
      type: building.type,
      label: BUILDING_RULES[building.type]?.label || building.type,
      level: normalizeCount(building.level)
    }));
  const completedContracts = Array.isArray(state?.meta?.contracts?.completed)
    ? state.meta.contracts.completed.length
    : 0;
  const completedScenarios = Array.isArray(state?.meta?.scenarios?.completed)
    ? state.meta.scenarios.completed.length
    : 0;
  const signalBands = Object.fromEntries(SIGNAL_KEYS.map((key) => [
    key,
    signalBand(normalizeCount(state?.meta?.townSignals?.[key]))
  ]));
  return {
    schemaVersion: 'founders-plot.plot-card.v1',
    title: 'Agent Town: Founders Plot',
    subtitle: style?.label || (normalizeCount(square.level) >= 1 ? 'Welcome Sign raised' : 'Frontier plot'),
    generatedAtMs: normalizeCount(nowMs),
    hqLevel: normalizeCount(state?.plot?.hqLevel),
    townXp: normalizeCount(state?.plot?.townXp),
    publicSquare: {
      level: normalizeCount(square.level),
      label: square.label || 'Public Square',
      styleId: style?.styleId || '',
      styleLabel: style?.label || '',
      ornament: style?.ornament || '',
      palette: style?.palette ? copyJson(style.palette) : null
    },
    buildings: built,
    completedContracts,
    completedScenarios,
    townMood: signalBands
  };
}

function buildTownPostcard(state, { nowMs = Date.now(), captureId = '' } = {}) {
  const card = buildPlotCard(state, { nowMs });
  const styleLabel = safePublicCardText(card.publicSquare?.styleLabel, card.subtitle || 'Frontier plot');
  const hqLevel = normalizeCount(state?.plot?.hqLevel || 1);
  const builtLabels = (Array.isArray(card.buildings) ? card.buildings : [])
    .map((building) => safePublicCardText(building.label, 'Building'))
    .filter(Boolean)
    .slice(0, 3);
  const stops = [
    { objectId: 'HQ', label: `Headquarters level ${hqLevel}` },
    { objectId: 'PUBLIC_SQUARE', label: styleLabel || 'Public Square' },
    ...(builtLabels.length > 0
      ? [{ objectId: 'CONTRACT_BOARD', label: `${builtLabels.length} town feature${builtLabels.length === 1 ? '' : 's'} visible` }]
      : [{ objectId: 'CONTRACT_BOARD', label: 'Contract Board' }])
  ];
  return normalizeTownPostcardCapture({
    captureId: captureId || randomId('pcap'),
    title: card.title,
    subtitle: styleLabel,
    publicSquareStyleId: card.publicSquare?.styleId || '',
    focusObjectId: 'PUBLIC_SQUARE',
    cameraMode: 'postcard_flyover',
    cameraLabel: `${styleLabel || 'Founders Plot'} postcard`,
    flyoverStops: stops,
    generatedAtMs: nowMs
  });
}

function applyCaptureTownPostcard(state, { focusObjectId = 'PUBLIC_SQUARE' } = {}, ctx = {}) {
  const nowMs = normalizeCount(ctx.nowMs || Date.now());
  const square = landmarksView(state).publicSquare || {};
  if (normalizeCount(square.level) < 1) {
    const error = new Error('INVALID_STATE');
    error.details = { reason: 'WELCOME_SIGN_REQUIRED' };
    throw error;
  }
  const capture = buildTownPostcard(state, {
    nowMs,
    captureId: randomId('pcap')
  });
  capture.focusObjectId = String(focusObjectId || 'PUBLIC_SQUARE').trim() || 'PUBLIC_SQUARE';
  state.meta.townPostcards = normalizeTownPostcards({
    ...state.meta.townPostcards,
    latestCaptureId: capture.captureId,
    captures: [...(state.meta.townPostcards?.captures || []), capture],
    updatedAtMs: nowMs
  });
  state.plot.updatedAt = nowMs;
  pushEvent(ctx.appendEvent, {
    type: EVENT_TYPES.TOWN_POSTCARD_CAPTURED,
    actor: 'HUMAN',
    explanation: 'A public-safe town postcard was captured.',
    recapLine: `${capture.cameraLabel} captured.`,
    data: {
      postcard: copyJson(capture)
    }
  });
  return {
    postcard: copyJson(capture),
    postcards: townPostcardView(state)
  };
}

const PUBLIC_OPERATING_STYLE_FORBIDDEN_RE = /(?:\b(?:api[-_ ]?key|secret|token|bearer|authorization|provider|model|brain|runtime|worker|trace|logs?|events?|private|wallet)\b|sk-[a-z0-9_-]+)/i;

function safeOperatingStyleText(value, fallback = '') {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text || PUBLIC_OPERATING_STYLE_FORBIDDEN_RE.test(text)) return fallback;
  return text.slice(0, 180);
}

function safeOperatingStyleTags({ operatingModel, doctrine, specialists, regionalNetwork } = {}) {
  const tags = [];
  if (operatingModel?.charter?.label) tags.push(operatingModel.charter.label);
  for (const rule of doctrine?.activeRuleDetails || []) {
    if (rule?.label) tags.push(rule.label);
  }
  for (const role of specialists?.activeAssignments || []) {
    const domainLabel = role?.domain?.label || '';
    if (role?.label && domainLabel) tags.push(`${role.label}: ${domainLabel}`);
  }
  if ((regionalNetwork?.routes || []).some((route) => String(route.status || '').toUpperCase() === 'ACTIVE')) {
    tags.push('Regional route operator');
  }
  return [...new Set(tags.map((tag) => safeOperatingStyleText(tag)).filter(Boolean))].slice(0, 8);
}

function buildOperatingStyleCard(state, { nowMs = Date.now() } = {}) {
  const operatingModel = operatingModelView(state);
  const doctrine = foremanDoctrineView(state);
  const specialists = specialistsView(state, { nowMs });
  const regionalNetwork = regionalLedgerView(state, { nowMs });
  const landmarks = landmarksView(state);
  const activeRules = doctrine.activeRules
    .map((entry) => doctrineRuleDefinition(entry?.ruleId || entry))
    .filter(Boolean)
    .map((rule) => ({
      ruleId: rule.ruleId,
      label: rule.label,
      summary: rule.summary
    }));
  const specialistAssignments = (specialists.activeAssignments || []).map((role) => ({
    roleId: role.roleId,
    label: role.label,
    domainId: role.domainId,
    domainLabel: role.domain?.label || ''
  }));
  const completedRegionalContracts = (regionalNetwork.contracts || [])
    .filter((contract) => String(contract.status || '').toUpperCase() === 'COMPLETED')
    .length;
  const cardBasis = {
    operatingModel,
    doctrine: { activeRuleDetails: activeRules },
    specialists,
    regionalNetwork
  };
  return {
    schemaVersion: 'founders-plot.operating-style-card.v1',
    title: 'Founders Plot Operating Style',
    generatedAtMs: normalizeCount(nowMs),
    publicId: state.plot.plotId,
    hqLevel: normalizeCount(state?.plot?.hqLevel),
    charter: operatingModel.charter ? {
      charterId: operatingModel.charter.charterId,
      label: operatingModel.charter.label,
      axis: operatingModel.charter.axis,
      summary: operatingModel.charter.summary,
      bannerText: operatingModel.charter.bannerText
    } : null,
    capabilityWeb: (operatingModel.unlockedCapabilities || []).map((capability) => ({
      capabilityId: capability.capabilityId,
      label: capability.label,
      summary: capability.summary
    })),
    doctrine: {
      activeRules,
      summary: activeRules.length > 0 ? doctrine.summary : ''
    },
    specialists: {
      assignments: specialistAssignments,
      summary: specialistAssignments.length > 0 ? specialists.summary : ''
    },
    regionalNetwork: {
      routeCount: (regionalNetwork.routes || []).length,
      activeRouteCount: (regionalNetwork.routes || []).filter((route) => ['ACTIVE', 'SHORTAGE'].includes(String(route.status || '').toUpperCase())).length,
      completedContractCount: completedRegionalContracts,
      pendingIssueCount: normalizeCount(regionalNetwork.pendingIssueCount),
      summary: regionalNetwork.gate?.ready ? regionalNetwork.summary : ''
    },
    townIdentity: {
      publicSquareStyleId: landmarks.publicSquare?.styleId || '',
      publicSquareStyleLabel: landmarks.publicSquare?.styleLabel || ''
    },
    styleTags: safeOperatingStyleTags(cardBasis),
    shareSafety: {
      shareable: true,
      styleOnly: true,
      excludesPersonalData: true
    }
  };
}

function sanitizeOperatingStyleCard(raw = {}) {
  const card = raw && typeof raw === 'object' ? raw : {};
  const charter = card.charter && typeof card.charter === 'object' ? card.charter : null;
  const doctrine = card.doctrine && typeof card.doctrine === 'object' ? card.doctrine : {};
  const specialists = card.specialists && typeof card.specialists === 'object' ? card.specialists : {};
  const regionalNetwork = card.regionalNetwork && typeof card.regionalNetwork === 'object' ? card.regionalNetwork : {};
  return {
    schemaVersion: String(card.schemaVersion || ''),
    title: safeOperatingStyleText(card.title, 'Operating style'),
    publicId: safeOperatingStyleText(card.publicId),
    hqLevel: normalizeCount(card.hqLevel),
    charter: charter ? {
      charterId: normalizeOperatingCharterId(charter.charterId),
      label: safeOperatingStyleText(charter.label),
      axis: safeOperatingStyleText(charter.axis),
      summary: safeOperatingStyleText(charter.summary),
      bannerText: safeOperatingStyleText(charter.bannerText)
    } : null,
    capabilityWeb: Array.isArray(card.capabilityWeb)
      ? card.capabilityWeb.map((entry) => {
        const definition = operatingCapabilityDefinition(entry?.capabilityId);
        return definition ? {
          capabilityId: definition.capabilityId,
          label: definition.label,
          summary: definition.summary
        } : null;
      }).filter(Boolean).slice(0, 8)
      : [],
    doctrine: {
      activeRules: Array.isArray(doctrine.activeRules)
        ? doctrine.activeRules.map((entry) => {
          const definition = doctrineRuleDefinition(entry?.ruleId);
          return definition ? {
            ruleId: definition.ruleId,
            label: definition.label,
            summary: definition.summary
          } : null;
        }).filter(Boolean).slice(0, 8)
        : [],
      summary: safeOperatingStyleText(doctrine.summary)
    },
    specialists: {
      assignments: Array.isArray(specialists.assignments)
        ? specialists.assignments.map((entry) => ({
          roleId: normalizeSpecialistRoleId(entry?.roleId),
          label: specialistRoleDefinition(entry?.roleId)?.label || safeOperatingStyleText(entry?.label),
          domainId: normalizeSpecialistDomainId(entry?.domainId),
          domainLabel: specialistDomainDefinition(entry?.domainId)?.label || safeOperatingStyleText(entry?.domainLabel)
        })).filter((entry) => entry.roleId && entry.domainId).slice(0, 6)
        : [],
      summary: safeOperatingStyleText(specialists.summary)
    },
    regionalNetwork: {
      routeCount: normalizeCount(regionalNetwork.routeCount),
      activeRouteCount: normalizeCount(regionalNetwork.activeRouteCount),
      completedContractCount: normalizeCount(regionalNetwork.completedContractCount),
      pendingIssueCount: normalizeCount(regionalNetwork.pendingIssueCount),
      summary: safeOperatingStyleText(regionalNetwork.summary)
    },
    townIdentity: {
      publicSquareStyleId: safeOperatingStyleText(card?.townIdentity?.publicSquareStyleId),
      publicSquareStyleLabel: safeOperatingStyleText(card?.townIdentity?.publicSquareStyleLabel)
    },
    styleTags: Array.isArray(card.styleTags)
      ? [...new Set(card.styleTags.map((entry) => safeOperatingStyleText(entry)).filter(Boolean))].slice(0, 8)
      : []
  };
}

function compareOperatingStyleCards(currentCard, importedCard) {
  const current = sanitizeOperatingStyleCard(currentCard);
  const imported = sanitizeOperatingStyleCard(importedCard);
  const currentTags = new Set(current.styleTags || []);
  const importedTags = new Set(imported.styleTags || []);
  const sharedTags = [...currentTags].filter((tag) => importedTags.has(tag));
  const importedOnlyTags = [...importedTags].filter((tag) => !currentTags.has(tag));
  const currentOnlyTags = [...currentTags].filter((tag) => !importedTags.has(tag));
  const sameCharter = !!current.charter?.charterId && current.charter.charterId === imported.charter?.charterId;
  return {
    schemaVersion: 'founders-plot.operating-style-comparison.v1',
    generatedAtMs: Date.now(),
    imported,
    sharedTags,
    importedOnlyTags,
    currentOnlyTags,
    sameCharter,
    grants: {
      resources: false,
      buildings: false,
      permissions: false,
      capabilities: false
    },
    summary: sameCharter
      ? 'The shared style uses the same charter, so compare doctrine and staffing differences before adopting ideas.'
      : 'The shared style is inspiration only; it does not change this town.'
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
  applyGrantForemanLease,
  applyPauseScheduler,
  applyPausePersistentForeman,
  applyPersistentForemanTick,
  applyPlaceBuilding,
  applyPolicyChange,
  applyQueueJob,
  applyRequestUserApproval,
  applyResolveApproval,
  applyForemanPreference,
  applyReceiptCorrection,
  applyRaiseForemanException,
  applyResolveForemanException,
  applyRevokeForemanLease,
  applyResumeScheduler,
  applyResolveTownOpportunity,
  applyStartCivicScenario,
  applyContributeCivicScenario,
  applyCompleteSettlementFoundingTask,
  applyChooseOperatingCharter,
  applyFocusSettlement,
  applyLaunchSettlerExpedition,
  applyRefreshOperatingContracts,
  applySetForemanDoctrineRule,
  applySetTownIdentity,
  applyAssignSpecialist,
  applyPauseSpecialist,
  applyReviewSpecialistRecommendation,
  applyAcceptRegionalContract,
  applyCreatorNoticeKioskPostNotice,
  applyCaptureTownPostcard,
  applyDisableCreatorBuilding,
  applyInstallCreatorBuilding,
  applyOpenRegionalSupplyRoute,
  applyRemoveCreatorBuilding,
  applyTransferRegionalSupplyRoute,
  applyTurnInRegionalContract,
  applySetStandingOrder,
  applySetPriority,
  applyTurnInContract,
  applyUpgradeLandmark,
  applyUpgradeBuilding,
  applyStartPersistentForeman,
  applyUnlockOperatingCapability,
  availableBuildingTypes,
  buildForemanObservation,
  buildForemanDecision,
  buildPlotCard,
  buildTownPostcard,
  buildOperatingStyleCard,
  compareOperatingStyleCards,
  buildSafeForemanCandidates,
  buildTownJournalEntries,
  buildWorldDelta,
  canUpgradePublicSquare,
  canChoosePublicSquareStyle,
  chooseForemanCandidateWithTestBrain,
  companionAdvice,
  createInitialPlot,
  creatorExtensionsView,
  foremanRuntimeStatus,
  foremanGovernanceView,
  foremanDoctrineView,
  persistentForemanView,
  operatingModelView,
  specialistsView,
  regionalLedgerView,
  settlementLedgerView,
  settlementStabilityGate,
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
