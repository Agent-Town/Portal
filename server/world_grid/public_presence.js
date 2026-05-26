const { loadPlotByPairId } = require('../founders_plot/store');
const fs = require('fs');
const path = require('path');

const WORLD_GRID_PUBLIC_PRESENCE_SCHEMA_VERSION = 'agent-town.v5.world-grid.public-presence.v1';
const WORLD_GRID_PUBLIC_PRESENCE_MIGRATION_VERSION = 'world_grid_public_presence_v1';

// Prototype/ephemeral process-local stores; release storage is documented in docs/technical/WORLD_GRID_STATE_MODEL.md.
const presenceByOwner = new Map();
const followsByOwner = new Map();
let durableSingleton = null;
let durableSingletonPath = '';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function safePublicName(value = '', fallback = '') {
  const normalized = String(value || '').trim().replace(/\s+/g, ' ');
  return (normalized || fallback).slice(0, 48);
}

function ensureDurableSchema(db) {
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = NORMAL;');
  db.exec('PRAGMA busy_timeout = 5000;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS world_grid_public_presence (
      owner_account_id TEXT PRIMARY KEY,
      public_town_id TEXT NOT NULL UNIQUE,
      account_public_id TEXT NOT NULL,
      display_name TEXT NOT NULL,
      town_name TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      presence_json TEXT NOT NULL,
      migration_version TEXT NOT NULL,
      schema_version TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_world_grid_public_presence_town
      ON world_grid_public_presence(public_town_id);
    CREATE INDEX IF NOT EXISTS idx_world_grid_public_presence_updated
      ON world_grid_public_presence(updated_at);

    CREATE TABLE IF NOT EXISTS world_grid_public_follows (
      owner_account_id TEXT NOT NULL,
      public_town_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      migration_version TEXT NOT NULL,
      schema_version TEXT NOT NULL,
      PRIMARY KEY (owner_account_id, public_town_id)
    );
    CREATE INDEX IF NOT EXISTS idx_world_grid_public_follows_town
      ON world_grid_public_follows(public_town_id);
  `);
}

function parseDurablePresence(row) {
  if (!row) return null;
  return JSON.parse(row.presence_json);
}

function createWorldGridPublicPresenceStore({ sqlitePath } = {}) {
  if (!sqlitePath || typeof sqlitePath !== 'string') {
    throw new Error('WORLD_GRID_PUBLIC_PRESENCE_SQLITE_PATH_REQUIRED');
  }
  fs.mkdirSync(path.dirname(sqlitePath), { recursive: true });
  const { DatabaseSync } = require('node:sqlite');
  const db = new DatabaseSync(sqlitePath);
  ensureDurableSchema(db);
  const statements = {
    listPresence: db.prepare(`
      SELECT *
      FROM world_grid_public_presence
      ORDER BY updated_at ASC, public_town_id ASC
    `),
    byPublicTownId: db.prepare(`
      SELECT *
      FROM world_grid_public_presence
      WHERE public_town_id = ?
      LIMIT 1
    `),
    byOwner: db.prepare(`
      SELECT *
      FROM world_grid_public_presence
      WHERE owner_account_id = ?
      LIMIT 1
    `),
    upsertPresence: db.prepare(`
      INSERT INTO world_grid_public_presence (
        owner_account_id, public_town_id, account_public_id, display_name,
        town_name, updated_at, presence_json, migration_version, schema_version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(owner_account_id) DO UPDATE SET
        public_town_id=excluded.public_town_id,
        account_public_id=excluded.account_public_id,
        display_name=excluded.display_name,
        town_name=excluded.town_name,
        updated_at=excluded.updated_at,
        presence_json=excluded.presence_json,
        migration_version=excluded.migration_version,
        schema_version=excluded.schema_version
    `),
    deletePresence: db.prepare('DELETE FROM world_grid_public_presence WHERE owner_account_id = ?'),
    deleteInboundFollows: db.prepare('DELETE FROM world_grid_public_follows WHERE public_town_id = ?'),
    insertFollow: db.prepare(`
      INSERT OR IGNORE INTO world_grid_public_follows (
        owner_account_id, public_town_id, created_at, migration_version, schema_version
      ) VALUES (?, ?, ?, ?, ?)
    `),
    followCount: db.prepare(`
      SELECT COUNT(1) AS count
      FROM world_grid_public_follows
      WHERE owner_account_id = ?
    `),
    presenceCount: db.prepare('SELECT COUNT(1) AS count FROM world_grid_public_presence'),
    followsCount: db.prepare('SELECT COUNT(1) AS count FROM world_grid_public_follows'),
    metadata: db.prepare(`
      SELECT migration_version, schema_version, COUNT(1) AS count
      FROM (
        SELECT migration_version, schema_version FROM world_grid_public_presence
        UNION ALL
        SELECT migration_version, schema_version FROM world_grid_public_follows
      )
      GROUP BY migration_version, schema_version
      ORDER BY migration_version ASC, schema_version ASC
    `)
  };
  let closed = false;

  function savePresence(ownerAccountId = '', presence = {}) {
    const next = clone(presence);
    statements.upsertPresence.run(
      String(ownerAccountId || ''),
      String(next.publicTownId || ''),
      String(next.accountPublicId || ''),
      String(next.displayName || ''),
      String(next.townName || ''),
      Number(next.updatedAtMs) || Date.now(),
      JSON.stringify(next),
      WORLD_GRID_PUBLIC_PRESENCE_MIGRATION_VERSION,
      WORLD_GRID_PUBLIC_PRESENCE_SCHEMA_VERSION
    );
  }

  function deletePresence(ownerAccountId = '') {
    const current = parseDurablePresence(statements.byOwner.get(String(ownerAccountId || '')));
    db.exec('BEGIN IMMEDIATE;');
    try {
      if (current?.publicTownId) statements.deleteInboundFollows.run(current.publicTownId);
      const result = statements.deletePresence.run(String(ownerAccountId || ''));
      db.exec('COMMIT;');
      return result.changes > 0;
    } catch (error) {
      db.exec('ROLLBACK;');
      throw error;
    }
  }

  function listPublicTowns() {
    return statements.listPresence.all().map(parseDurablePresence);
  }

  function getPublicTown(publicTownId = '') {
    return parseDurablePresence(statements.byPublicTownId.get(String(publicTownId || '')));
  }

  function addFollow(ownerAccountId = '', publicTownId = '', nowMs = Date.now()) {
    statements.insertFollow.run(
      String(ownerAccountId || ''),
      String(publicTownId || ''),
      Number(nowMs) || Date.now(),
      WORLD_GRID_PUBLIC_PRESENCE_MIGRATION_VERSION,
      WORLD_GRID_PUBLIC_PRESENCE_SCHEMA_VERSION
    );
    return Number(statements.followCount.get(String(ownerAccountId || '')).count || 0);
  }

  function counts() {
    return {
      presence: Number(statements.presenceCount.get().count || 0),
      follows: Number(statements.followsCount.get().count || 0)
    };
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
    addFollow,
    close,
    counts,
    deletePresence,
    getPublicTown,
    listPublicTowns,
    metadata,
    savePresence,
    sqlitePath
  };
}

function configuredWorldGridPublicPresencePath(env = process.env) {
  return String(env.WORLD_GRID_PUBLIC_PRESENCE_SQLITE_PATH || '').trim();
}

function getConfiguredWorldGridPublicPresenceStore(env = process.env) {
  const sqlitePath = configuredWorldGridPublicPresencePath(env);
  if (!sqlitePath) return null;
  if (durableSingleton && durableSingletonPath === sqlitePath) return durableSingleton;
  if (durableSingleton) durableSingleton.close();
  durableSingleton = createWorldGridPublicPresenceStore({ sqlitePath });
  durableSingletonPath = sqlitePath;
  return durableSingleton;
}

function closeWorldGridPublicPresenceStore() {
  if (!durableSingleton) return;
  durableSingleton.close();
  durableSingleton = null;
  durableSingletonPath = '';
}

function charmBandFromPlot(plotState) {
  const charm = Number(plotState?.meta?.townSignals?.publicCharm || 0);
  if (charm >= 40) return 'welcoming';
  if (charm >= 15) return 'settling-in';
  return 'new';
}

function publicSummaryFor(owner, opts = {}) {
  const plotState = loadPlotByPairId(owner.pairId);
  const publicSquare = plotState?.meta?.landmarks?.publicSquare || null;
  const operatingModel = plotState?.meta?.operatingModel || null;
  return {
    hqLevel: Math.max(1, Number(plotState?.plot?.hqLevel || 1)),
    charmBand: charmBandFromPlot(plotState),
    charter: opts.showOperatingStyle === true ? (operatingModel?.selectedCharterId || null) : null,
    visibleLandmarks: [
      publicSquare?.level >= 1 ? 'Public Square' : null,
      publicSquare?.styleLabel || publicSquare?.style?.label || null
    ].filter(Boolean)
  };
}

function publicTownIdFor(owner) {
  return `public_town_${owner.ownerAccountId.replace(/^owner_/, '')}`;
}

function regionHintFor(region) {
  const terrainCounts = {};
  for (const cell of region?.cells || []) {
    terrainCounts[cell.terrain] = (terrainCounts[cell.terrain] || 0) + 1;
  }
  const topTerrain = Object.entries(terrainCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'frontier';
  return `${topTerrain} territory`;
}

function buildPresence({ owner, region, displayName, townName, privacy = {} }) {
  const normalizedPrivacy = {
    showOperatingStyle: privacy.showOperatingStyle === true,
    showRegion: privacy.showRegion !== false,
    allowVisits: privacy.allowVisits !== false
  };
  return {
    publicTownId: publicTownIdFor(owner),
    accountPublicId: owner.ownerAccountId,
    displayName: safePublicName(displayName, 'A neighbor'),
    townName: safePublicName(townName, 'Founders Plot'),
    styleCardId: normalizedPrivacy.showOperatingStyle ? `style_${owner.ownerAccountId}` : undefined,
    regionHint: normalizedPrivacy.showRegion ? regionHintFor(region) : 'private region',
    publicSummary: publicSummaryFor(owner, normalizedPrivacy),
    privacy: normalizedPrivacy,
    updatedAtMs: Date.now()
  };
}

function optInPublicPresence(args) {
  const presence = buildPresence(args);
  const durableStore = getConfiguredWorldGridPublicPresenceStore();
  if (durableStore) {
    durableStore.savePresence(args.owner.ownerAccountId, presence);
    return clone(presence);
  }
  presenceByOwner.set(args.owner.ownerAccountId, clone(presence));
  return clone(presence);
}

function optOutPublicPresence(owner) {
  const durableStore = getConfiguredWorldGridPublicPresenceStore();
  if (durableStore) return { removed: durableStore.deletePresence(owner.ownerAccountId) };
  const existing = presenceByOwner.get(owner.ownerAccountId);
  const existed = presenceByOwner.delete(owner.ownerAccountId);
  if (existing?.publicTownId) {
    for (const follows of followsByOwner.values()) follows.delete(existing.publicTownId);
  }
  return { removed: existed };
}

function listPublicTowns() {
  const durableStore = getConfiguredWorldGridPublicPresenceStore();
  if (durableStore) return durableStore.listPublicTowns().map((presence) => clone(presence));
  return [...presenceByOwner.values()].map((presence) => clone(presence));
}

function getPublicTown(publicTownId = '') {
  const target = String(publicTownId || '').trim();
  const durableStore = getConfiguredWorldGridPublicPresenceStore();
  if (durableStore) {
    const town = durableStore.getPublicTown(target);
    return town ? clone(town) : null;
  }
  return listPublicTowns().find((presence) => presence.publicTownId === target) || null;
}

function followTown(owner, publicTownId = '') {
  const town = getPublicTown(publicTownId);
  if (!town) {
    const error = new Error('NOT_FOUND');
    error.details = { publicTownId };
    throw error;
  }
  if (town.accountPublicId === owner.ownerAccountId) {
    const error = new Error('INVALID_PUBLIC_TOWN');
    error.details = { reason: 'CANNOT_FOLLOW_SELF' };
    throw error;
  }
  const durableStore = getConfiguredWorldGridPublicPresenceStore();
  if (durableStore) {
    return {
      publicTownId: town.publicTownId,
      followed: true,
      followCount: durableStore.addFollow(owner.ownerAccountId, town.publicTownId)
    };
  }
  const follows = followsByOwner.get(owner.ownerAccountId) || new Set();
  follows.add(town.publicTownId);
  followsByOwner.set(owner.ownerAccountId, follows);
  return {
    publicTownId: town.publicTownId,
    followed: true,
    followCount: follows.size
  };
}

function summarizeNeighbor(publicTownId = '') {
  const town = getPublicTown(publicTownId);
  if (!town) {
    const error = new Error('NOT_FOUND');
    error.details = { publicTownId };
    throw error;
  }
  return {
    publicTownId: town.publicTownId,
    summary: `${town.townName} is a ${town.publicSummary.charmBand} town in ${town.regionHint}.`,
    publicSummary: town.publicSummary
  };
}

module.exports = {
  WORLD_GRID_PUBLIC_PRESENCE_MIGRATION_VERSION,
  WORLD_GRID_PUBLIC_PRESENCE_SCHEMA_VERSION,
  closeWorldGridPublicPresenceStore,
  configuredWorldGridPublicPresencePath,
  createWorldGridPublicPresenceStore,
  followTown,
  getPublicTown,
  listPublicTowns,
  optInPublicPresence,
  optOutPublicPresence,
  summarizeNeighbor
};
