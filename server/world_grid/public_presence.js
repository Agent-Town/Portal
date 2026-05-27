const { loadPlotByPairId } = require('../founders_plot/store');
const fs = require('fs');
const path = require('path');

const WORLD_GRID_PUBLIC_PRESENCE_SCHEMA_VERSION = 'agent-town.v5.world-grid.public-presence.v1';
const WORLD_GRID_PUBLIC_PRESENCE_MIGRATION_VERSION = 'world_grid_public_presence_v1';
const PUBLIC_REPORT_PRIVATE_FIELD_RE = /(secret|token|credential|password|provider|brain|wallet)/ig;
const PUBLIC_REPORT_REASON_CATEGORIES = new Set([
  'spam',
  'harassment',
  'impersonation',
  'unsafe_content',
  'other'
]);

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

    CREATE TABLE IF NOT EXISTS world_grid_public_abuse_reports (
      report_id TEXT PRIMARY KEY,
      reporter_account_id TEXT NOT NULL,
      public_town_id TEXT NOT NULL,
      reason_category TEXT NOT NULL,
      note TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      report_json TEXT NOT NULL,
      migration_version TEXT NOT NULL,
      schema_version TEXT NOT NULL,
      UNIQUE(reporter_account_id, public_town_id)
    );
    CREATE INDEX IF NOT EXISTS idx_world_grid_public_reports_town_status
      ON world_grid_public_abuse_reports(public_town_id, status);
    CREATE INDEX IF NOT EXISTS idx_world_grid_public_reports_reporter
      ON world_grid_public_abuse_reports(reporter_account_id, created_at);
  `);
}

function parseDurablePresence(row) {
  if (!row) return null;
  return JSON.parse(row.presence_json);
}

function parseDurableReport(row) {
  if (!row) return null;
  return JSON.parse(row.report_json);
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
    byReport: db.prepare(`
      SELECT *
      FROM world_grid_public_abuse_reports
      WHERE reporter_account_id = ? AND public_town_id = ?
      LIMIT 1
    `),
    insertReport: db.prepare(`
      INSERT OR IGNORE INTO world_grid_public_abuse_reports (
        report_id, reporter_account_id, public_town_id, reason_category,
        note, status, created_at, report_json, migration_version, schema_version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `),
    listReports: db.prepare(`
      SELECT *
      FROM world_grid_public_abuse_reports
      ORDER BY created_at ASC, report_id ASC
    `),
    followCount: db.prepare(`
      SELECT COUNT(1) AS count
      FROM world_grid_public_follows
      WHERE owner_account_id = ?
    `),
    presenceCount: db.prepare('SELECT COUNT(1) AS count FROM world_grid_public_presence'),
    followsCount: db.prepare('SELECT COUNT(1) AS count FROM world_grid_public_follows'),
    reportsCount: db.prepare('SELECT COUNT(1) AS count FROM world_grid_public_abuse_reports'),
    metadata: db.prepare(`
      SELECT migration_version, schema_version, COUNT(1) AS count
      FROM (
        SELECT migration_version, schema_version FROM world_grid_public_presence
        UNION ALL
        SELECT migration_version, schema_version FROM world_grid_public_follows
        UNION ALL
        SELECT migration_version, schema_version FROM world_grid_public_abuse_reports
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

  function reportPublicTown(report = {}) {
    const next = clone(report);
    statements.insertReport.run(
      String(next.reportId || ''),
      String(next.reporterAccountId || ''),
      String(next.publicTownId || ''),
      String(next.reasonCategory || 'other'),
      String(next.note || ''),
      String(next.status || 'open'),
      Number(next.createdAtMs) || Date.now(),
      JSON.stringify(next),
      WORLD_GRID_PUBLIC_PRESENCE_MIGRATION_VERSION,
      WORLD_GRID_PUBLIC_PRESENCE_SCHEMA_VERSION
    );
    return parseDurableReport(statements.byReport.get(
      String(next.reporterAccountId || ''),
      String(next.publicTownId || '')
    ));
  }

  function listReports() {
    return statements.listReports.all().map(parseDurableReport);
  }

  function counts() {
    return {
      presence: Number(statements.presenceCount.get().count || 0),
      follows: Number(statements.followsCount.get().count || 0),
      reports: Number(statements.reportsCount.get().count || 0)
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
    listReports,
    listPublicTowns,
    metadata,
    reportPublicTown,
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
  if (durableSingleton) durableSingleton.close();
  durableSingleton = null;
  durableSingletonPath = '';
  presenceByOwner.clear();
  followsByOwner.clear();
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

function reportIdFor(owner, publicTownId = '') {
  return `public_report_${owner.ownerAccountId}_${String(publicTownId || '')}`.replace(/[^a-zA-Z0-9_:-]/g, '_');
}

function normalizeReportReason(reason = '') {
  const normalized = String(reason || '').trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '_');
  return PUBLIC_REPORT_REASON_CATEGORIES.has(normalized) ? normalized : 'other';
}

function normalizeReportNote(note = '') {
  const stripped = String(note || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim();
  const redacted = stripped.replace(PUBLIC_REPORT_PRIVATE_FIELD_RE, '[redacted]');
  return (redacted || 'Public town reported for review.').slice(0, 160);
}

function buildPublicTownReport(owner, town, reason = '', note = '') {
  return {
    reportId: reportIdFor(owner, town.publicTownId),
    reporterAccountId: owner.ownerAccountId,
    publicTownId: town.publicTownId,
    reasonCategory: normalizeReportReason(reason),
    note: normalizeReportNote(note),
    status: 'open',
    createdAtMs: Date.now(),
    privacy: {
      redacted: true,
      privateDataIncluded: false,
      dataClasses: ['public_town_abuse_report']
    }
  };
}

function reportPublicTown(owner, publicTownId = '', reason = '', note = '') {
  const town = getPublicTown(publicTownId);
  if (!town) {
    const error = new Error('NOT_FOUND');
    error.details = { publicTownId };
    throw error;
  }
  if (town.accountPublicId === owner.ownerAccountId) {
    const error = new Error('INVALID_PUBLIC_TOWN');
    error.details = { reason: 'CANNOT_REPORT_SELF' };
    throw error;
  }
  const report = buildPublicTownReport(owner, town, reason, note);
  const durableStore = getConfiguredWorldGridPublicPresenceStore();
  if (durableStore) return clone(durableStore.reportPublicTown(report));
  const key = `${owner.ownerAccountId}:${town.publicTownId}`;
  const reports = followsByOwner.get('__public_reports__') || new Map();
  if (!reports.has(key)) reports.set(key, clone(report));
  followsByOwner.set('__public_reports__', reports);
  return clone(reports.get(key));
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
  reportPublicTown,
  summarizeNeighbor
};
