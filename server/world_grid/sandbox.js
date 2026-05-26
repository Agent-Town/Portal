const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const WORLD_GRID_SANDBOX_SCHEMA_VERSION = 'agent-town.v5.world-grid.sandbox.v1';
const WORLD_GRID_SANDBOX_MIGRATION_VERSION = 'world_grid_sandbox_v1';
const SANDBOX_DISTRICT_ID = 'sandbox_public_commons';

const ALLOWED_PROPS = new Map([
  ['lantern', { propId: 'lantern', label: 'Lantern', footprint: 1 }],
  ['bench', { propId: 'bench', label: 'Bench', footprint: 1 }],
  ['garden-bed', { propId: 'garden-bed', label: 'Garden Bed', footprint: 1 }],
  ['notice-board', { propId: 'notice-board', label: 'Notice Board', footprint: 1 }]
]);

const ALLOWED_AGENT_DEMOS = new Map([
  ['route-signpost', { propId: 'notice-board', label: 'Route Signpost Demo' }]
]);

const DEFAULT_SANDBOX_CELLS = [
  { cellId: 'sandbox_cell_0', q: 0, r: 0, props: [] },
  { cellId: 'sandbox_cell_1', q: 1, r: 0, props: [] },
  { cellId: 'sandbox_cell_2', q: 0, r: 1, props: [] },
  { cellId: 'sandbox_cell_3', q: -1, r: 1, props: [] }
];

function freshSandboxCells() {
  return DEFAULT_SANDBOX_CELLS.map((cell) => ({
    cellId: cell.cellId,
    q: cell.q,
    r: cell.r,
    props: []
  }));
}

// Prototype/ephemeral process-local district state; release storage is documented in docs/technical/WORLD_GRID_STATE_MODEL.md.
const district = {
  districtId: SANDBOX_DISTRICT_ID,
  title: 'Public Commons Sandbox',
  status: 'open',
  cells: freshSandboxCells(),
  rules: {
    allowedActions: ['place_prop', 'remove_prop', 'agent_demo'],
    allowedProps: Array.from(ALLOWED_PROPS.keys()),
    forbidden: ['uploads', 'chat', 'code', 'private-town-mutation', 'economy-bridge'],
    moderation: 'typed-policy-only'
  }
};

// Prototype/ephemeral process-local stores; release storage is documented in docs/technical/WORLD_GRID_STATE_MODEL.md.
const participantsByOwner = new Map();
const actions = [];
const snapshots = new Map();
let durableSingleton = null;
let durableSingletonPath = '';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function parseJson(value, fallback) {
  try {
    return JSON.parse(String(value || ''));
  } catch (_error) {
    return clone(fallback);
  }
}

function ensureDurableSchema(db) {
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = NORMAL;');
  db.exec('PRAGMA busy_timeout = 5000;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS world_grid_sandbox_participants (
      owner_account_id TEXT PRIMARY KEY,
      public_id TEXT NOT NULL,
      display_name TEXT NOT NULL,
      status TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      participant_json TEXT NOT NULL,
      migration_version TEXT NOT NULL,
      schema_version TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_world_grid_sandbox_participants_public
      ON world_grid_sandbox_participants(public_id);
    CREATE INDEX IF NOT EXISTS idx_world_grid_sandbox_participants_status
      ON world_grid_sandbox_participants(status);

    CREATE TABLE IF NOT EXISTS world_grid_sandbox_actions (
      district_id TEXT NOT NULL,
      action_id TEXT PRIMARY KEY,
      actor_public_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      moderation_status TEXT NOT NULL,
      rollback_id TEXT,
      created_at INTEGER NOT NULL,
      rolled_back_at INTEGER,
      action_json TEXT NOT NULL,
      migration_version TEXT NOT NULL,
      schema_version TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_world_grid_sandbox_actions_actor
      ON world_grid_sandbox_actions(actor_public_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_world_grid_sandbox_actions_status
      ON world_grid_sandbox_actions(moderation_status, kind);

    CREATE TABLE IF NOT EXISTS world_grid_sandbox_snapshots (
      rollback_id TEXT PRIMARY KEY,
      action_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      cells_json TEXT NOT NULL,
      migration_version TEXT NOT NULL,
      schema_version TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_world_grid_sandbox_snapshots_action
      ON world_grid_sandbox_snapshots(action_id);

    CREATE TABLE IF NOT EXISTS world_grid_sandbox_cells (
      district_id TEXT NOT NULL,
      cell_id TEXT NOT NULL,
      q INTEGER NOT NULL,
      r INTEGER NOT NULL,
      props_json TEXT NOT NULL,
      cell_json TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      migration_version TEXT NOT NULL,
      schema_version TEXT NOT NULL,
      PRIMARY KEY (district_id, cell_id)
    );
    CREATE INDEX IF NOT EXISTS idx_world_grid_sandbox_cells_district
      ON world_grid_sandbox_cells(district_id);
  `);
}

function parseDurableParticipant(row) {
  if (!row) return null;
  return parseJson(row.participant_json, null);
}

function parseDurableAction(row) {
  if (!row) return null;
  return parseJson(row.action_json, null);
}

function parseDurableCell(row) {
  if (!row) return null;
  const fallback = {
    cellId: row.cell_id,
    q: Number(row.q) || 0,
    r: Number(row.r) || 0,
    props: parseJson(row.props_json, [])
  };
  return parseJson(row.cell_json, fallback);
}

function createWorldGridSandboxStore({ sqlitePath } = {}) {
  if (!sqlitePath || typeof sqlitePath !== 'string') {
    throw new Error('WORLD_GRID_SANDBOX_SQLITE_PATH_REQUIRED');
  }
  fs.mkdirSync(path.dirname(sqlitePath), { recursive: true });
  const { DatabaseSync } = require('node:sqlite');
  const db = new DatabaseSync(sqlitePath);
  ensureDurableSchema(db);
  const statements = {
    participantByOwner: db.prepare(`
      SELECT *
      FROM world_grid_sandbox_participants
      WHERE owner_account_id = ?
      LIMIT 1
    `),
    listParticipants: db.prepare(`
      SELECT *
      FROM world_grid_sandbox_participants
      ORDER BY updated_at ASC, public_id ASC
    `),
    upsertParticipant: db.prepare(`
      INSERT INTO world_grid_sandbox_participants (
        owner_account_id, public_id, display_name, status, updated_at,
        participant_json, migration_version, schema_version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(owner_account_id) DO UPDATE SET
        public_id=excluded.public_id,
        display_name=excluded.display_name,
        status=excluded.status,
        updated_at=excluded.updated_at,
        participant_json=excluded.participant_json,
        migration_version=excluded.migration_version,
        schema_version=excluded.schema_version
    `),
    deleteParticipant: db.prepare('DELETE FROM world_grid_sandbox_participants WHERE owner_account_id = ?'),
    listActions: db.prepare(`
      SELECT *
      FROM world_grid_sandbox_actions
      WHERE district_id = ?
      ORDER BY created_at ASC, action_id ASC
    `),
    upsertAction: db.prepare(`
      INSERT INTO world_grid_sandbox_actions (
        district_id, action_id, actor_public_id, kind, moderation_status,
        rollback_id, created_at, rolled_back_at, action_json,
        migration_version, schema_version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(action_id) DO UPDATE SET
        actor_public_id=excluded.actor_public_id,
        kind=excluded.kind,
        moderation_status=excluded.moderation_status,
        rollback_id=excluded.rollback_id,
        created_at=excluded.created_at,
        rolled_back_at=excluded.rolled_back_at,
        action_json=excluded.action_json,
        migration_version=excluded.migration_version,
        schema_version=excluded.schema_version
    `),
    snapshotByRollbackId: db.prepare(`
      SELECT *
      FROM world_grid_sandbox_snapshots
      WHERE rollback_id = ?
      LIMIT 1
    `),
    listSnapshots: db.prepare(`
      SELECT rollback_id
      FROM world_grid_sandbox_snapshots
      ORDER BY created_at ASC, rollback_id ASC
    `),
    upsertSnapshot: db.prepare(`
      INSERT INTO world_grid_sandbox_snapshots (
        rollback_id, action_id, created_at, cells_json, migration_version, schema_version
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(rollback_id) DO UPDATE SET
        action_id=excluded.action_id,
        created_at=excluded.created_at,
        cells_json=excluded.cells_json,
        migration_version=excluded.migration_version,
        schema_version=excluded.schema_version
    `),
    cells: db.prepare(`
      SELECT *
      FROM world_grid_sandbox_cells
      WHERE district_id = ?
      ORDER BY cell_id ASC
    `),
    deleteCells: db.prepare('DELETE FROM world_grid_sandbox_cells WHERE district_id = ?'),
    insertCell: db.prepare(`
      INSERT OR REPLACE INTO world_grid_sandbox_cells (
        district_id, cell_id, q, r, props_json, cell_json, updated_at,
        migration_version, schema_version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `),
    insertDefaultCell: db.prepare(`
      INSERT OR IGNORE INTO world_grid_sandbox_cells (
        district_id, cell_id, q, r, props_json, cell_json, updated_at,
        migration_version, schema_version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `),
    participantCount: db.prepare('SELECT COUNT(1) AS count FROM world_grid_sandbox_participants'),
    actionCount: db.prepare('SELECT COUNT(1) AS count FROM world_grid_sandbox_actions'),
    snapshotCount: db.prepare('SELECT COUNT(1) AS count FROM world_grid_sandbox_snapshots'),
    cellCount: db.prepare('SELECT COUNT(1) AS count FROM world_grid_sandbox_cells'),
    metadata: db.prepare(`
      SELECT migration_version, schema_version, COUNT(1) AS count
      FROM (
        SELECT migration_version, schema_version FROM world_grid_sandbox_participants
        UNION ALL
        SELECT migration_version, schema_version FROM world_grid_sandbox_actions
        UNION ALL
        SELECT migration_version, schema_version FROM world_grid_sandbox_snapshots
        UNION ALL
        SELECT migration_version, schema_version FROM world_grid_sandbox_cells
      )
      GROUP BY migration_version, schema_version
      ORDER BY migration_version ASC, schema_version ASC
    `)
  };
  let closed = false;

  function seedDefaultCells() {
    const nowMs = Date.now();
    for (const cell of freshSandboxCells()) {
      statements.insertDefaultCell.run(
        SANDBOX_DISTRICT_ID,
        cell.cellId,
        cell.q,
        cell.r,
        JSON.stringify(cell.props),
        JSON.stringify(cell),
        nowMs,
        WORLD_GRID_SANDBOX_MIGRATION_VERSION,
        WORLD_GRID_SANDBOX_SCHEMA_VERSION
      );
    }
  }

  seedDefaultCells();

  function participantForOwner(ownerAccountId = '') {
    return parseDurableParticipant(statements.participantByOwner.get(String(ownerAccountId || '')));
  }

  function listParticipants() {
    return statements.listParticipants.all().map(parseDurableParticipant).filter(Boolean);
  }

  function saveParticipant(ownerAccountId = '', participant = {}) {
    const next = clone(participant);
    statements.upsertParticipant.run(
      String(ownerAccountId || ''),
      String(next.publicId || ''),
      String(next.displayName || ''),
      String(next.status || ''),
      Date.now(),
      JSON.stringify(next),
      WORLD_GRID_SANDBOX_MIGRATION_VERSION,
      WORLD_GRID_SANDBOX_SCHEMA_VERSION
    );
  }

  function deleteParticipant(ownerAccountId = '') {
    const result = statements.deleteParticipant.run(String(ownerAccountId || ''));
    return Number(result.changes || 0) > 0;
  }

  function listActions() {
    return statements.listActions.all(SANDBOX_DISTRICT_ID).map(parseDurableAction).filter(Boolean);
  }

  function saveAction(action = {}) {
    const next = clone(action);
    statements.upsertAction.run(
      SANDBOX_DISTRICT_ID,
      String(next.actionId || ''),
      String(next.actorPublicId || ''),
      String(next.kind || ''),
      String(next.moderationStatus || ''),
      String(next.rollbackId || ''),
      Number(next.createdAtMs) || Date.now(),
      next.rolledBackAtMs ? Number(next.rolledBackAtMs) : null,
      JSON.stringify(next),
      WORLD_GRID_SANDBOX_MIGRATION_VERSION,
      WORLD_GRID_SANDBOX_SCHEMA_VERSION
    );
  }

  function getSnapshot(rollbackId = '') {
    const row = statements.snapshotByRollbackId.get(String(rollbackId || ''));
    if (!row) return null;
    return parseJson(row.cells_json, freshSandboxCells());
  }

  function listSnapshotIds() {
    return statements.listSnapshots.all().map((row) => String(row.rollback_id || '')).filter(Boolean);
  }

  function saveSnapshot(rollbackId = '', actionId = '', cells = []) {
    statements.upsertSnapshot.run(
      String(rollbackId || ''),
      String(actionId || ''),
      Date.now(),
      JSON.stringify(clone(cells)),
      WORLD_GRID_SANDBOX_MIGRATION_VERSION,
      WORLD_GRID_SANDBOX_SCHEMA_VERSION
    );
  }

  function cells() {
    const rows = statements.cells.all(SANDBOX_DISTRICT_ID).map(parseDurableCell).filter(Boolean);
    return rows.length ? rows : freshSandboxCells();
  }

  function saveCells(cells = []) {
    const nowMs = Date.now();
    db.exec('BEGIN IMMEDIATE;');
    try {
      statements.deleteCells.run(SANDBOX_DISTRICT_ID);
      for (const cell of cells) {
        const next = clone(cell);
        statements.insertCell.run(
          SANDBOX_DISTRICT_ID,
          String(next.cellId || ''),
          Number(next.q) || 0,
          Number(next.r) || 0,
          JSON.stringify(Array.isArray(next.props) ? next.props : []),
          JSON.stringify(next),
          nowMs,
          WORLD_GRID_SANDBOX_MIGRATION_VERSION,
          WORLD_GRID_SANDBOX_SCHEMA_VERSION
        );
      }
      db.exec('COMMIT;');
    } catch (error) {
      db.exec('ROLLBACK;');
      throw error;
    }
  }

  function counts() {
    return {
      participants: Number(statements.participantCount.get().count || 0),
      actions: Number(statements.actionCount.get().count || 0),
      snapshots: Number(statements.snapshotCount.get().count || 0),
      cells: Number(statements.cellCount.get().count || 0)
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
    cells,
    close,
    counts,
    deleteParticipant,
    getSnapshot,
    listActions,
    listParticipants,
    listSnapshotIds,
    metadata,
    participantForOwner,
    saveAction,
    saveCells,
    saveParticipant,
    saveSnapshot,
    sqlitePath
  };
}

function configuredWorldGridSandboxPath(env = process.env) {
  return String(env.WORLD_GRID_SANDBOX_SQLITE_PATH || '').trim();
}

function getConfiguredWorldGridSandboxStore(env = process.env) {
  const sqlitePath = configuredWorldGridSandboxPath(env);
  if (!sqlitePath) return null;
  if (durableSingleton && durableSingletonPath === sqlitePath) return durableSingleton;
  if (durableSingleton) durableSingleton.close();
  durableSingleton = createWorldGridSandboxStore({ sqlitePath });
  durableSingletonPath = sqlitePath;
  return durableSingleton;
}

function closeWorldGridSandboxStore() {
  if (!durableSingleton) return;
  durableSingleton.close();
  durableSingleton = null;
  durableSingletonPath = '';
}

function sha256(value = '') {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex');
}

function publicIdFor(owner) {
  return `sandbox_${sha256(owner.ownerAccountId).slice(0, 12)}`;
}

function normalizeText(value = '', fallback = '') {
  return String(value || fallback).trim().replace(/\s+/g, ' ').slice(0, 80);
}

function redactedParticipant(owner) {
  return {
    publicId: publicIdFor(owner),
    displayName: `Visitor ${publicIdFor(owner).slice(-4)}`,
    status: 'present'
  };
}

function sandboxCells() {
  const durableStore = getConfiguredWorldGridSandboxStore();
  if (durableStore) return durableStore.cells().map((cell) => clone(cell));
  return clone(district.cells);
}

function saveSandboxCells(cells = []) {
  const durableStore = getConfiguredWorldGridSandboxStore();
  if (durableStore) {
    durableStore.saveCells(cells);
    return;
  }
  district.cells = clone(cells);
}

function participants() {
  const durableStore = getConfiguredWorldGridSandboxStore();
  if (durableStore) return durableStore.listParticipants().map((participant) => clone(participant));
  return Array.from(participantsByOwner.values()).map((participant) => clone(participant));
}

function participantForOwner(owner) {
  const durableStore = getConfiguredWorldGridSandboxStore();
  if (durableStore) {
    const participant = durableStore.participantForOwner(owner.ownerAccountId);
    return participant ? clone(participant) : null;
  }
  const participant = participantsByOwner.get(owner.ownerAccountId) || null;
  return participant ? clone(participant) : null;
}

function actionList() {
  const durableStore = getConfiguredWorldGridSandboxStore();
  if (durableStore) return durableStore.listActions().map((action) => clone(action));
  return actions.map((action) => clone(action));
}

function snapshotIds() {
  const durableStore = getConfiguredWorldGridSandboxStore();
  if (durableStore) return durableStore.listSnapshotIds();
  return Array.from(snapshots.keys());
}

function snapshotCells() {
  return sandboxCells();
}

function saveSnapshot(actionId) {
  const rollbackId = `rollback_${actionId}`;
  const cells = snapshotCells();
  const durableStore = getConfiguredWorldGridSandboxStore();
  if (durableStore) durableStore.saveSnapshot(rollbackId, actionId, cells);
  else snapshots.set(rollbackId, cells);
  return rollbackId;
}

function getSnapshot(rollbackId = '') {
  const durableStore = getConfiguredWorldGridSandboxStore();
  if (durableStore) {
    const snapshot = durableStore.getSnapshot(rollbackId);
    return snapshot ? clone(snapshot) : null;
  }
  const snapshot = snapshots.get(rollbackId);
  return snapshot ? clone(snapshot) : null;
}

function saveAction(action = {}) {
  const durableStore = getConfiguredWorldGridSandboxStore();
  if (durableStore) {
    durableStore.saveAction(action);
    return;
  }
  const index = actions.findIndex((candidate) => candidate.actionId === action.actionId);
  if (index >= 0) actions[index] = clone(action);
  else actions.push(clone(action));
}

function stateFor(owner) {
  const participant = participantForOwner(owner);
  return {
    district: {
      ...clone(district),
      cells: snapshotCells(),
      participants: participants(),
      snapshots: snapshotIds().map((rollbackId) => ({ rollbackId })),
      recentActions: actionList().slice(-8).map((action) => clone(action))
    },
    participant: participant ? clone(participant) : null
  };
}

function enterSandbox(owner) {
  const participant = redactedParticipant(owner);
  const durableStore = getConfiguredWorldGridSandboxStore();
  if (durableStore) durableStore.saveParticipant(owner.ownerAccountId, participant);
  else participantsByOwner.set(owner.ownerAccountId, participant);
  return clone(participant);
}

function leaveSandbox(owner) {
  const publicId = publicIdFor(owner);
  const durableStore = getConfiguredWorldGridSandboxStore();
  const removed = durableStore
    ? durableStore.deleteParticipant(owner.ownerAccountId)
    : participantsByOwner.delete(owner.ownerAccountId);
  return { publicId, removed };
}

function findCell(cells = [], cellId = '') {
  return cells.find((cell) => cell.cellId === String(cellId || '').trim()) || null;
}

function recordAction(owner, kind, payload, moderationStatus, rollbackId = '') {
  const action = {
    actionId: `sandbox_action_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    actorPublicId: publicIdFor(owner),
    kind,
    payload: clone(payload),
    moderationStatus,
    rollbackId,
    createdAtMs: Date.now(),
    rolledBackAtMs: null
  };
  saveAction(action);
  return clone(action);
}

function rejectAction(owner, kind, payload, reason) {
  return recordAction(owner, kind, {
    reason,
    requested: payload && typeof payload === 'object' ? clone(payload) : {}
  }, 'rejected');
}

function placeProp(owner, payload = {}) {
  enterSandbox(owner);
  const propId = String(payload.propId || '').trim();
  const cells = snapshotCells();
  const cell = findCell(cells, payload.cellId || 'sandbox_cell_0');
  if (!cell) return rejectAction(owner, 'place_prop', payload, 'UNKNOWN_CELL');
  const prop = ALLOWED_PROPS.get(propId);
  if (!prop) return rejectAction(owner, 'place_prop', payload, 'PROP_NOT_ALLOWED');
  const actionId = `sandbox_action_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const rollbackId = saveSnapshot(actionId);
  cell.props.push({
    propInstanceId: `${actionId}_${prop.propId}`,
    propId: prop.propId,
    label: prop.label,
    actorPublicId: publicIdFor(owner)
  });
  saveSandboxCells(cells);
  const action = {
    actionId,
    actorPublicId: publicIdFor(owner),
    kind: 'place_prop',
    payload: { cellId: cell.cellId, propId: prop.propId, label: prop.label },
    moderationStatus: 'auto-approved',
    rollbackId,
    createdAtMs: Date.now(),
    rolledBackAtMs: null
  };
  saveAction(action);
  return clone(action);
}

function agentDemo(owner, payload = {}) {
  enterSandbox(owner);
  const demo = ALLOWED_AGENT_DEMOS.get(String(payload.demoKind || '').trim());
  if (!demo) return rejectAction(owner, 'agent_demo', payload, 'DEMO_NOT_ALLOWED');
  const cells = snapshotCells();
  const cell = findCell(cells, payload.cellId || 'sandbox_cell_0') || cells[0];
  const actionId = `sandbox_action_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const rollbackId = saveSnapshot(actionId);
  cell.props.push({
    propInstanceId: `${actionId}_${demo.propId}`,
    propId: demo.propId,
    label: demo.label,
    actorPublicId: publicIdFor(owner),
    agentDemo: true
  });
  saveSandboxCells(cells);
  const action = {
    actionId,
    actorPublicId: publicIdFor(owner),
    kind: 'agent_demo',
    payload: { cellId: cell.cellId, demoKind: normalizeText(payload.demoKind), propId: demo.propId },
    moderationStatus: 'auto-approved',
    rollbackId,
    createdAtMs: Date.now(),
    rolledBackAtMs: null
  };
  saveAction(action);
  return clone(action);
}

function rollbackLastAction(owner) {
  const actorPublicId = publicIdFor(owner);
  const action = [...actionList()].reverse().find((candidate) => (
    candidate.actorPublicId === actorPublicId
    && candidate.moderationStatus === 'auto-approved'
    && candidate.rollbackId
    && !candidate.rolledBackAtMs
  ));
  if (!action) {
    const error = new Error('NOT_FOUND');
    error.details = { reason: 'NO_ROLLBACK_ACTION' };
    throw error;
  }
  const snapshot = getSnapshot(action.rollbackId);
  if (!snapshot) {
    const error = new Error('NOT_FOUND');
    error.details = { rollbackId: action.rollbackId };
    throw error;
  }
  saveSandboxCells(snapshot);
  saveAction({ ...action, rolledBackAtMs: Date.now() });
  return {
    rollbackId: action.rollbackId,
    restored: true,
    actionId: action.actionId,
    district: stateFor(owner).district
  };
}

module.exports = {
  WORLD_GRID_SANDBOX_MIGRATION_VERSION,
  WORLD_GRID_SANDBOX_SCHEMA_VERSION,
  agentDemo,
  closeWorldGridSandboxStore,
  configuredWorldGridSandboxPath,
  createWorldGridSandboxStore,
  enterSandbox,
  leaveSandbox,
  placeProp,
  rollbackLastAction,
  stateFor
};
