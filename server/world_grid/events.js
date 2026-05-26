const { savePlotGraph } = require('../founders_plot/store');
const { loadWorldGridPlotPrerequisite } = require('./plot_prerequisite');

const RESOURCE_KEYS = ['wood', 'stone', 'food', 'coin'];

const WORLD_EVENT_TEMPLATES = [
  {
    eventId: 'event_great_ridge_bridge',
    title: 'Great Ridge Bridge',
    status: 'active',
    startsAtMs: 1_779_638_400_000,
    endsAtMs: 1_780_243_200_000,
    publicGoal: { wood: 24, stone: 12, food: 0, coin: 30 },
    caps: {
      perAccountDaily: { wood: 2, stone: 1, food: 0, coin: 5 },
      perSettlementDaily: { wood: 3, stone: 2, food: 0, coin: 6 }
    },
    rewards: [
      {
        rewardId: 'ridge_bridge_patron_badge',
        kind: 'cosmetic_status',
        title: 'Ridge Bridge Patron',
        description: 'A public-works supporter badge for this prototype event.'
      }
    ]
  }
];

// Prototype/ephemeral process-local stores; release storage is documented in docs/technical/WORLD_GRID_STATE_MODEL.md.
const contributionsByEvent = new Map();
const rewardsByEvent = new Map();

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeCount(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
}

function normalizeBundle(bundle = {}) {
  return Object.fromEntries(RESOURCE_KEYS.map((key) => [key, normalizeCount(bundle?.[key])]));
}

function addBundles(...bundles) {
  const total = normalizeBundle();
  for (const bundle of bundles) {
    const normalized = normalizeBundle(bundle);
    for (const key of RESOURCE_KEYS) total[key] += normalized[key];
  }
  return total;
}

function subtractBundle(left = {}, right = {}) {
  const a = normalizeBundle(left);
  const b = normalizeBundle(right);
  return Object.fromEntries(RESOURCE_KEYS.map((key) => [key, Math.max(0, a[key] - b[key])]));
}

function minBundle(...bundles) {
  return Object.fromEntries(RESOURCE_KEYS.map((key) => [key, Math.min(...bundles.map((bundle) => normalizeCount(bundle?.[key])))]));
}

function bundleHasValue(bundle = {}) {
  return RESOURCE_KEYS.some((key) => normalizeCount(bundle?.[key]) > 0);
}

function dayKey(nowMs = Date.now()) {
  return new Date(nowMs).toISOString().slice(0, 10);
}

function eventTemplate(eventId = '') {
  const target = String(eventId || WORLD_EVENT_TEMPLATES[0].eventId).trim();
  return WORLD_EVENT_TEMPLATES.find((event) => event.eventId === target) || null;
}

function contributionList(eventId = '') {
  return contributionsByEvent.get(eventId) || [];
}

function saveContributionList(eventId = '', contributions = []) {
  contributionsByEvent.set(eventId, contributions.map((contribution) => clone(contribution)));
}

function rewardMap(eventId = '') {
  if (!rewardsByEvent.has(eventId)) rewardsByEvent.set(eventId, new Map());
  return rewardsByEvent.get(eventId);
}

function totalContributions(eventId = '') {
  return contributionList(eventId).reduce((total, contribution) => addBundles(total, contribution.bundle), normalizeBundle());
}

function participantCount(eventId = '') {
  return new Set(contributionList(eventId).map((contribution) => contribution.ownerAccountId)).size;
}

function contributionTotalsFor(owner, eventId = '', nowMs = Date.now()) {
  const today = dayKey(nowMs);
  return contributionList(eventId).reduce((totals, contribution) => {
    if (contribution.dayKey !== today) return totals;
    if (contribution.ownerAccountId === owner.ownerAccountId) {
      totals.account = addBundles(totals.account, contribution.bundle);
    }
    if (contribution.settlementId === owner.regionId) {
      totals.settlement = addBundles(totals.settlement, contribution.bundle);
    }
    return totals;
  }, { account: normalizeBundle(), settlement: normalizeBundle() });
}

function publicEventState(eventId = '') {
  const event = eventTemplate(eventId);
  if (!event) return null;
  const totals = totalContributions(event.eventId);
  const goal = normalizeBundle(event.publicGoal);
  const goalUnits = RESOURCE_KEYS.reduce((sum, key) => sum + goal[key], 0);
  const totalUnits = RESOURCE_KEYS.reduce((sum, key) => sum + Math.min(totals[key], goal[key]), 0);
  return {
    ...clone(event),
    totalContributions: totals,
    participantCount: participantCount(event.eventId),
    progress: {
      units: totalUnits,
      goalUnits,
      percent: goalUnits > 0 ? Math.min(100, Math.round((totalUnits / goalUnits) * 100)) : 100
    }
  };
}

function personalRecap(owner, eventId = '') {
  const contributions = contributionList(eventId)
    .filter((contribution) => contribution.ownerAccountId === owner.ownerAccountId)
    .map((contribution) => clone(contribution));
  const reward = rewardMap(eventId).get(owner.ownerAccountId) || null;
  return {
    eventId,
    total: contributions.reduce((total, contribution) => addBundles(total, contribution.bundle), normalizeBundle()),
    contributionCount: contributions.length,
    contributions,
    reward: reward ? clone(reward) : null
  };
}

function worldEventState(owner) {
  return WORLD_EVENT_TEMPLATES.map((event) => ({
    event: publicEventState(event.eventId),
    personal: personalRecap(owner, event.eventId)
  }));
}

function previewContribution(owner, eventId = '', requestedBundle = {}, nowMs = Date.now()) {
  const event = publicEventState(eventId || WORLD_EVENT_TEMPLATES[0].eventId);
  if (!event) {
    const error = new Error('NOT_FOUND');
    error.details = { eventId };
    throw error;
  }
  if (event.status !== 'active') {
    const error = new Error('INVALID_EVENT_STATE');
    error.details = { eventId: event.eventId, status: event.status };
    throw error;
  }
  const requested = normalizeBundle(requestedBundle);
  const totals = contributionTotalsFor(owner, event.eventId, nowMs);
  const accountRemaining = subtractBundle(event.caps.perAccountDaily, totals.account);
  const settlementRemaining = subtractBundle(event.caps.perSettlementDaily, totals.settlement);
  const goalRemaining = subtractBundle(event.publicGoal, event.totalContributions);
  const accepted = minBundle(requested, accountRemaining, settlementRemaining, goalRemaining);
  return {
    eventId: event.eventId,
    requested,
    accepted,
    accountRemaining,
    settlementRemaining,
    goalRemaining,
    dayKey: dayKey(nowMs),
    allowed: bundleHasValue(accepted)
  };
}

function ensurePlotState(identity) {
  return loadWorldGridPlotPrerequisite(identity);
}

function canAfford(plot, bundle = {}) {
  return RESOURCE_KEYS.every((resource) => normalizeCount(bundle[resource]) <= normalizeCount(plot?.inventory?.[resource]));
}

function spend(plot, bundle = {}) {
  if (!canAfford(plot, bundle)) {
    const error = new Error('OUT_OF_RESOURCES');
    error.details = { bundle, inventory: normalizeBundle(plot?.inventory || {}) };
    throw error;
  }
  for (const resource of RESOURCE_KEYS) {
    const amount = normalizeCount(bundle[resource]);
    if (amount > 0) plot.inventory[resource] = normalizeCount(plot.inventory[resource]) - amount;
  }
}

function findContributionByKey(owner, eventId = '', idempotencyKey = '') {
  return contributionList(eventId).find((contribution) => (
    contribution.ownerAccountId === owner.ownerAccountId
    && contribution.idempotencyKey === idempotencyKey
  )) || null;
}

function contributeToEvent(identity, owner, eventId = '', requestedBundle = {}, idempotencyKey = '', nowMs = Date.now()) {
  const key = String(idempotencyKey || '').trim();
  if (!key) {
    const error = new Error('INVALID_IDEMPOTENCY_KEY');
    error.details = { reason: 'MISSING_IDEMPOTENCY_KEY' };
    throw error;
  }
  const event = eventTemplate(eventId || WORLD_EVENT_TEMPLATES[0].eventId);
  if (!event) {
    const error = new Error('NOT_FOUND');
    error.details = { eventId };
    throw error;
  }
  const duplicate = findContributionByKey(owner, event.eventId, key);
  if (duplicate) return { contribution: clone(duplicate), duplicate: true, preview: null };

  const preview = previewContribution(owner, event.eventId, requestedBundle, nowMs);
  if (!preview.allowed) {
    const error = new Error('CONTRIBUTION_CAP_EXCEEDED');
    error.details = preview;
    throw error;
  }
  const state = ensurePlotState(identity, nowMs);
  const beforeInventory = normalizeBundle(state.plot.inventory);
  spend(state.plot, preview.accepted);
  state.plot.updatedAt = nowMs;
  savePlotGraph(state);

  const contribution = {
    contributionId: `world_evt_${event.eventId}_${owner.ownerAccountId}_${key}`.replace(/[^a-zA-Z0-9_:-]/g, '_'),
    eventId: event.eventId,
    ownerAccountId: owner.ownerAccountId,
    settlementId: owner.regionId,
    idempotencyKey: key,
    bundle: preview.accepted,
    dayKey: preview.dayKey,
    createdAtMs: nowMs,
    inventoryBefore: beforeInventory,
    inventoryAfter: normalizeBundle(state.plot.inventory)
  };
  saveContributionList(event.eventId, [...contributionList(event.eventId), contribution]);
  return { contribution: clone(contribution), duplicate: false, preview };
}

function claimEventReward(owner, eventId = '', rewardOwnerAccountId = '') {
  const event = eventTemplate(eventId || WORLD_EVENT_TEMPLATES[0].eventId);
  if (!event) {
    const error = new Error('NOT_FOUND');
    error.details = { eventId };
    throw error;
  }
  const targetOwner = String(rewardOwnerAccountId || owner.ownerAccountId).trim();
  if (targetOwner !== owner.ownerAccountId) {
    const error = new Error('FORBIDDEN');
    error.details = { reason: 'WORLD_EVENT_REWARD_OWNER_MISMATCH' };
    throw error;
  }
  const personal = personalRecap(owner, event.eventId);
  if (!bundleHasValue(personal.total)) {
    const error = new Error('INVALID_REWARD_STATE');
    error.details = { reason: 'NO_CONTRIBUTION', eventId: event.eventId };
    throw error;
  }
  const rewards = rewardMap(event.eventId);
  const existing = rewards.get(owner.ownerAccountId);
  if (existing) return clone(existing);
  const rewardTemplate = event.rewards[0];
  const reward = {
    ...clone(rewardTemplate),
    eventId: event.eventId,
    ownerAccountId: owner.ownerAccountId,
    status: 'claimed',
    mutationApplied: false,
    claimedAtMs: Date.now()
  };
  rewards.set(owner.ownerAccountId, reward);
  return clone(reward);
}

module.exports = {
  claimEventReward,
  contributeToEvent,
  previewContribution,
  worldEventState
};
