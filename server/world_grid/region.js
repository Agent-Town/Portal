const crypto = require('crypto');

const TERRAIN = ['prairie', 'ridge', 'river', 'forest', 'mesa'];
const FEATURES = [null, 'spring', 'old-road', 'ruin', 'trade-post'];
const RISKS = ['calm', 'storm', 'bandit-rumor', 'supply-shortage', null];

function sha256(value = '') {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex');
}

function hashNumber(seed = '', modulo = 1) {
  const hex = sha256(seed).slice(0, 8);
  return Number.parseInt(hex, 16) % Math.max(1, modulo);
}

function normalizeOwnerIdentity(identity = {}) {
  const pairId = typeof identity.pairId === 'string' ? identity.pairId.trim() : '';
  if (!pairId) return null;
  const sessionId = typeof identity.sessionId === 'string' ? identity.sessionId.trim() : '';
  const ownerHash = sha256(pairId);
  return {
    pairId,
    ownerAccountId: `owner_${ownerHash.slice(0, 16)}`,
    regionId: `region_${ownerHash.slice(0, 16)}`,
    seed: `world-grid-v50:${ownerHash.slice(0, 32)}`,
    sessionBindingKey: sessionId
  };
}

function axialDistance(q, r) {
  return (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2;
}

function cellStateFor(q, r) {
  const distance = axialDistance(q, r);
  if (distance === 0) return 'claimed';
  if (distance === 1) return 'claimable';
  if (distance === 2) return (q + r) % 2 === 0 ? 'visible' : 'locked';
  return 'locked';
}

function terrainFor(seed, q, r) {
  return TERRAIN[hashNumber(`${seed}:terrain:${q}:${r}`, TERRAIN.length)];
}

function featureFor(seed, q, r, state) {
  if (state === 'locked') return null;
  return FEATURES[hashNumber(`${seed}:feature:${q}:${r}`, FEATURES.length)] || null;
}

function riskFor(seed, q, r, state) {
  if (state === 'locked') return null;
  return RISKS[hashNumber(`${seed}:risk:${q}:${r}`, RISKS.length)] || null;
}

function makeCell({ regionId, seed, q, r }) {
  const state = cellStateFor(q, r);
  return {
    cellId: `${regionId}:${q},${r}`,
    q,
    r,
    terrain: terrainFor(seed, q, r),
    state,
    ownerSettlementId: state === 'claimed' ? 'settlement_home' : undefined,
    feature: featureFor(seed, q, r, state),
    risk: riskFor(seed, q, r, state)
  };
}

function generateRegion(identity = {}, options = {}) {
  const owner = normalizeOwnerIdentity(identity);
  if (!owner) {
    const error = new Error('UNAUTHORIZED');
    error.details = { reason: 'WORLD_GRID_IDENTITY_UNAVAILABLE' };
    throw error;
  }
  const nowMs = Number.isFinite(Number(options.nowMs)) ? Number(options.nowMs) : Date.now();
  const cells = [];
  const radius = 2;
  for (let q = -radius; q <= radius; q += 1) {
    for (let r = -radius; r <= radius; r += 1) {
      if (axialDistance(q, r) <= radius) {
        cells.push(makeCell({ regionId: owner.regionId, seed: owner.seed, q, r }));
      }
    }
  }
  cells.sort((a, b) => a.q - b.q || a.r - b.r);
  const homeCell = cells.find((cell) => cell.q === 0 && cell.r === 0);
  const homeSettlement = {
    settlementId: 'settlement_home',
    name: 'Founders Plot',
    kind: 'home',
    cellId: homeCell.cellId,
    status: 'active',
    hqLevel: Number.isFinite(Number(options.hqLevel)) ? Number(options.hqLevel) : 1,
    foremanStatus: options.foremanStatus || 'manual'
  };
  return {
    regionId: owner.regionId,
    ownerAccountId: owner.ownerAccountId,
    seed: owner.seed,
    createdAtMs: nowMs,
    updatedAtMs: nowMs,
    activeSettlementId: homeSettlement.settlementId,
    cells,
    settlements: [homeSettlement],
    routes: []
  };
}

function findCell(region, cellId = '') {
  const target = String(cellId || '').trim();
  return (region?.cells || []).find((cell) => cell.cellId === target) || null;
}

function explainCell(region, cellId = '') {
  const cell = findCell(region, cellId);
  if (!cell) {
    const error = new Error('NOT_FOUND');
    error.details = { cellId };
    throw error;
  }
  const terrainLine = {
    prairie: 'Prairie cells are open and good future candidates for food capacity.',
    ridge: 'Ridge cells are slower to work but can support future stone or public works.',
    river: 'River cells are useful future anchors for trade, routes, and scenarios.',
    forest: 'Forest cells are natural supply pockets for future wood planning.',
    mesa: 'Mesa cells are dry high ground and better for landmarks than early farming.'
  }[cell.terrain] || 'This terrain is still being surveyed.';
  const stateLine = {
    claimed: 'This is already part of your home settlement.',
    claimable: 'This is adjacent territory for a later claim decision.',
    visible: 'This cell is visible for orientation but not claimable yet.',
    locked: 'This cell is still beyond the current town survey.'
  }[cell.state] || 'This cell state is unknown.';
  return {
    cell,
    summary: `${stateLine} ${terrainLine}`,
    canClaimNow: false,
    futureUse: cell.state === 'claimable'
      ? 'V5.1 can turn this into an explicit claim option with cost, benefit, drawback, and route preview.'
      : 'V5.0 is read-only territory awareness.'
  };
}

module.exports = {
  axialDistance,
  explainCell,
  findCell,
  generateRegion,
  normalizeOwnerIdentity
};
