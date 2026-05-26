const { savePlotGraph } = require('../founders_plot/store');
const { loadWorldGridPlotPrerequisite } = require('./plot_prerequisite');
const fs = require('fs');
const path = require('path');

const WORLD_GRID_CLAIMS_SCHEMA_VERSION = 'agent-town.v5.world-grid.claims.v1';
const WORLD_GRID_CLAIMS_MIGRATION_VERSION = 'world_grid_claims_v1';

// Prototype/ephemeral process-local store; release storage is documented in docs/technical/WORLD_GRID_STATE_MODEL.md.
const claimStore = new Map();
let durableSingleton = null;
let durableSingletonPath = '';

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

function ensureDurableSchema(db) {
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = NORMAL;');
  db.exec('PRAGMA busy_timeout = 5000;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS world_grid_claims (
      region_id TEXT NOT NULL,
      claim_id TEXT NOT NULL,
      cell_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      completed_at INTEGER,
      claim_json TEXT NOT NULL,
      migration_version TEXT NOT NULL,
      schema_version TEXT NOT NULL,
      PRIMARY KEY (region_id, claim_id)
    );
    CREATE INDEX IF NOT EXISTS idx_world_grid_claims_owner_status
      ON world_grid_claims(account_id, status);
    CREATE INDEX IF NOT EXISTS idx_world_grid_claims_region_cell
      ON world_grid_claims(region_id, cell_id);
  `);
}

function parseDurableClaim(row) {
  if (!row) return null;
  return JSON.parse(row.claim_json);
}

function createWorldGridClaimStore({ sqlitePath } = {}) {
  if (!sqlitePath || typeof sqlitePath !== 'string') {
    throw new Error('WORLD_GRID_CLAIMS_SQLITE_PATH_REQUIRED');
  }
  fs.mkdirSync(path.dirname(sqlitePath), { recursive: true });
  const { DatabaseSync } = require('node:sqlite');
  const db = new DatabaseSync(sqlitePath);
  ensureDurableSchema(db);
  const statements = {
    byRegion: db.prepare(`
      SELECT *
      FROM world_grid_claims
      WHERE region_id = ?
      ORDER BY created_at ASC, claim_id ASC
    `),
    deleteRegion: db.prepare('DELETE FROM world_grid_claims WHERE region_id = ?'),
    insert: db.prepare(`
      INSERT OR REPLACE INTO world_grid_claims (
        region_id, claim_id, cell_id, account_id, status, created_at,
        completed_at, claim_json, migration_version, schema_version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `),
    count: db.prepare('SELECT COUNT(1) AS count FROM world_grid_claims'),
    metadata: db.prepare(`
      SELECT migration_version, schema_version, COUNT(1) AS count
      FROM world_grid_claims
      GROUP BY migration_version, schema_version
      ORDER BY migration_version ASC, schema_version ASC
    `)
  };
  let closed = false;

  function claimsForRegion(regionId = '') {
    return statements.byRegion.all(String(regionId || '')).map(parseDurableClaim);
  }

  function saveClaimList(regionId = '', claims = []) {
    const normalizedRegionId = String(regionId || '');
    db.exec('BEGIN IMMEDIATE;');
    try {
      statements.deleteRegion.run(normalizedRegionId);
      for (const claim of claims) {
        statements.insert.run(
          normalizedRegionId,
          String(claim.claimId || ''),
          String(claim.cellId || ''),
          String(claim.accountId || ''),
          String(claim.status || ''),
          Number(claim.createdAtMs) || Date.now(),
          claim.completedAtMs ? Number(claim.completedAtMs) : null,
          JSON.stringify(clone(claim)),
          WORLD_GRID_CLAIMS_MIGRATION_VERSION,
          WORLD_GRID_CLAIMS_SCHEMA_VERSION
        );
      }
      db.exec('COMMIT;');
    } catch (error) {
      db.exec('ROLLBACK;');
      throw error;
    }
  }

  function count() {
    return Number(statements.count.get().count || 0);
  }

  function metadata() {
    return statements.metadata.all().map((row) => ({
      migrationVersion: row.migration_version,
      schemaVersion: row.schema_version,
      count: Number(row.count || 0)
    }));
  }

  function close() {
    if (closed) return;
    closed = true;
    db.close();
  }

  return {
    claimsForRegion,
    close,
    count,
    metadata,
    saveClaimList,
    sqlitePath
  };
}

function configuredWorldGridClaimsPath(env = process.env) {
  return String(env.WORLD_GRID_CLAIMS_SQLITE_PATH || '').trim();
}

function getConfiguredWorldGridClaimStore(env = process.env) {
  const sqlitePath = configuredWorldGridClaimsPath(env);
  if (!sqlitePath) return null;
  if (durableSingleton && durableSingletonPath === sqlitePath) return durableSingleton;
  if (durableSingleton) durableSingleton.close();
  durableSingleton = createWorldGridClaimStore({ sqlitePath });
  durableSingletonPath = sqlitePath;
  return durableSingleton;
}

function closeWorldGridClaimStore() {
  if (durableSingleton) durableSingleton.close();
  durableSingleton = null;
  durableSingletonPath = '';
  claimStore.clear();
}

function claimList(regionId = '') {
  const durableStore = getConfiguredWorldGridClaimStore();
  if (durableStore) return durableStore.claimsForRegion(regionId).map((claim) => clone(claim));
  return claimStore.get(String(regionId || '')) || [];
}

function saveClaimList(regionId = '', claims = []) {
  const durableStore = getConfiguredWorldGridClaimStore();
  if (durableStore) {
    durableStore.saveClaimList(regionId, claims);
    return;
  }
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

function ensurePlotState(identity) {
  return loadWorldGridPlotPrerequisite(identity);
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
  WORLD_GRID_CLAIMS_MIGRATION_VERSION,
  WORLD_GRID_CLAIMS_SCHEMA_VERSION,
  applyClaimsToRegion,
  cancelClaim,
  claimOptions,
  claimsForRegion,
  closeWorldGridClaimStore,
  completeClaim,
  configuredWorldGridClaimsPath,
  createWorldGridClaimStore,
  planClaim
};
