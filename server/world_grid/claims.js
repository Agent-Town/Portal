const { loadPlotByPairId, savePlotGraph } = require('../founders_plot/store');
const { createInitialPlot } = require('../founders_plot/engine');

const claimStore = new Map();

const RESOURCE_KEYS = ['wood', 'stone', 'food', 'coin'];

const TERRAIN_RULES = {
  prairie: {
    cost: { coin: 3 },
    benefit: { kind: 'capacity-preview', label: 'Future farm capacity' },
    drawback: { kind: 'exposed-weather', label: 'More exposed to future weather pressure' }
  },
  ridge: {
    cost: { coin: 4 },
    benefit: { kind: 'stone-preview', label: 'Future quarry support' },
    drawback: { kind: 'slow-route', label: 'Slower future route work' }
  },
  river: {
    cost: { coin: 4 },
    benefit: { kind: 'trade-preview', label: 'Future trade and scenario hooks' },
    drawback: { kind: 'bridge-needed', label: 'Future bridge upkeep' }
  },
  forest: {
    cost: { coin: 2 },
    benefit: { kind: 'wood-preview', label: 'Future wood planning pocket' },
    drawback: { kind: 'survey-time', label: 'Longer survey visibility' }
  },
  mesa: {
    cost: { coin: 3 },
    benefit: { kind: 'landmark-preview', label: 'Future landmark high ground' },
    drawback: { kind: 'dry-ground', label: 'Weak early farming support' }
  }
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeCount(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
}

function claimList(regionId = '') {
  return claimStore.get(String(regionId || '')) || [];
}

function saveClaimList(regionId = '', claims = []) {
  claimStore.set(String(regionId || ''), claims.map((claim) => clone(claim)));
}

function claimsForRegion(regionId = '') {
  return claimList(regionId).map((claim) => clone(claim));
}

function terrainRule(cell) {
  return TERRAIN_RULES[cell?.terrain] || TERRAIN_RULES.prairie;
}

function optionForCell(region, cell) {
  const rule = terrainRule(cell);
  const home = (region.settlements || []).find((settlement) => settlement.kind === 'home') || region.settlements?.[0] || null;
  const homeCellId = home?.cellId || region.cells?.find((candidate) => candidate.state === 'claimed')?.cellId || '';
  return {
    optionId: `claim_option:${cell.cellId}`,
    cellId: cell.cellId,
    settlementId: home?.settlementId || 'settlement_home',
    cost: clone(rule.cost),
    benefit: clone(rule.benefit),
    drawback: clone(rule.drawback),
    routePreview: {
      routeId: `route:${home?.settlementId || 'settlement_home'}:${cell.cellId}`,
      status: 'planned',
      pathCellIds: [homeCellId, cell.cellId].filter(Boolean)
    },
    cloverAdvice: `${cell.terrain} territory offers ${rule.benefit.label.toLowerCase()}, but ${rule.drawback.label.toLowerCase()}.`
  };
}

function claimOptions(region, claims = claimsForRegion(region.regionId)) {
  const claimedCellIds = new Set(claims.filter((claim) => ['planned', 'claiming', 'claimed'].includes(claim.status)).map((claim) => claim.cellId));
  return (region.cells || [])
    .filter((cell) => cell.state === 'claimable' && !claimedCellIds.has(cell.cellId))
    .map((cell) => optionForCell(region, cell));
}

function claimById(regionId = '', claimId = '') {
  return claimList(regionId).find((claim) => claim.claimId === claimId) || null;
}

function claimByCell(regionId = '', cellId = '') {
  return claimList(regionId).find((claim) => claim.cellId === cellId && claim.status !== 'cancelled') || null;
}

function ensurePlotState(identity, nowMs) {
  let state = loadPlotByPairId(identity.pairId);
  if (!state) {
    state = createInitialPlot({
      pairId: identity.pairId,
      houseId: identity.houseId || null,
      nowMs
    });
    savePlotGraph(state);
  }
  return state;
}

function canAfford(plot, cost = {}) {
  return RESOURCE_KEYS.every((resource) => normalizeCount(cost[resource]) <= normalizeCount(plot?.inventory?.[resource]));
}

function spend(plot, cost = {}) {
  for (const resource of RESOURCE_KEYS) {
    const amount = normalizeCount(cost[resource]);
    if (amount > normalizeCount(plot?.inventory?.[resource])) {
      const error = new Error('OUT_OF_RESOURCES');
      error.details = { resource, need: amount, have: normalizeCount(plot?.inventory?.[resource]) };
      throw error;
    }
  }
  for (const resource of RESOURCE_KEYS) {
    const amount = normalizeCount(cost[resource]);
    if (amount > 0) plot.inventory[resource] = normalizeCount(plot.inventory[resource]) - amount;
  }
}

function planClaim(region, cellId = '', owner, nowMs = Date.now()) {
  const cell = (region.cells || []).find((candidate) => candidate.cellId === cellId);
  if (!cell) {
    const error = new Error('NOT_FOUND');
    error.details = { cellId };
    throw error;
  }
  if (cell.state !== 'claimable') {
    const error = new Error('INVALID_CLAIM_TARGET');
    error.details = { cellId, state: cell.state };
    throw error;
  }
  const existing = claimByCell(region.regionId, cellId);
  if (existing) return clone(existing);
  const option = optionForCell(region, cell);
  const claim = {
    claimId: `claim_${region.regionId}_${cell.q}_${cell.r}`.replace(/[^a-zA-Z0-9_:-]/g, '_'),
    cellId,
    accountId: owner.ownerAccountId,
    settlementId: option.settlementId,
    status: 'planned',
    cost: option.cost,
    benefit: option.benefit,
    drawback: option.drawback,
    routePreview: option.routePreview,
    cloverAdvice: option.cloverAdvice,
    createdAtMs: nowMs
  };
  const claims = claimList(region.regionId);
  saveClaimList(region.regionId, [...claims, claim]);
  return clone(claim);
}

function completeClaim(region, identity, owner, claimId = '', nowMs = Date.now()) {
  const claims = claimList(region.regionId);
  const index = claims.findIndex((claim) => claim.claimId === claimId);
  if (index < 0) {
    const error = new Error('NOT_FOUND');
    error.details = { claimId };
    throw error;
  }
  const claim = claims[index];
  if (claim.accountId !== owner.ownerAccountId) {
    const error = new Error('FORBIDDEN');
    error.details = { reason: 'CLAIM_OWNER_MISMATCH' };
    throw error;
  }
  if (claim.status === 'claimed') return clone(claim);
  if (!['planned', 'claiming'].includes(claim.status)) {
    const error = new Error('INVALID_CLAIM_STATE');
    error.details = { claimId, status: claim.status };
    throw error;
  }
  const plotState = ensurePlotState(identity, nowMs);
  if (!canAfford(plotState.plot, claim.cost)) {
    const error = new Error('OUT_OF_RESOURCES');
    error.details = { claimId, cost: claim.cost, inventory: clone(plotState.plot.inventory) };
    throw error;
  }
  spend(plotState.plot, claim.cost);
  plotState.plot.updatedAt = nowMs;
  savePlotGraph(plotState);
  const completed = {
    ...claim,
    status: 'claimed',
    completedAtMs: nowMs,
    routePreview: { ...claim.routePreview, status: 'open' }
  };
  claims[index] = completed;
  saveClaimList(region.regionId, claims);
  return clone(completed);
}

function cancelClaim(regionId = '', owner, claimId = '') {
  const claims = claimList(regionId);
  const index = claims.findIndex((claim) => claim.claimId === claimId);
  if (index < 0) {
    const error = new Error('NOT_FOUND');
    error.details = { claimId };
    throw error;
  }
  const claim = claims[index];
  if (claim.accountId !== owner.ownerAccountId) {
    const error = new Error('FORBIDDEN');
    error.details = { reason: 'CLAIM_OWNER_MISMATCH' };
    throw error;
  }
  if (claim.status === 'claimed') {
    const error = new Error('INVALID_CLAIM_STATE');
    error.details = { claimId, status: claim.status };
    throw error;
  }
  claims.splice(index, 1);
  saveClaimList(regionId, claims);
  return { claimId, cancelled: true };
}

function applyClaimsToRegion(region, claims = claimsForRegion(region.regionId)) {
  const claimed = claims.filter((claim) => claim.status === 'claimed');
  const claimedByCell = new Map(claimed.map((claim) => [claim.cellId, claim]));
  const next = clone(region);
  next.cells = next.cells.map((cell) => {
    const claim = claimedByCell.get(cell.cellId);
    return claim
      ? { ...cell, state: 'claimed', ownerSettlementId: claim.settlementId }
      : cell;
  });
  next.routes = [
    ...(next.routes || []),
    ...claimed.map((claim) => ({
      routeId: claim.routePreview.routeId,
      fromSettlementId: claim.settlementId,
      toSettlementId: claim.cellId,
      status: 'open',
      pathCellIds: claim.routePreview.pathCellIds
    }))
  ];
  return next;
}

module.exports = {
  applyClaimsToRegion,
  cancelClaim,
  claimOptions,
  claimsForRegion,
  completeClaim,
  planClaim
};
