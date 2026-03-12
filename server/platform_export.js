const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const { getStorePath } = require('./store');
const { countPlatformTableRows } = require('./unified_platform_store');
const { countTableRows } = require('./web_poker_store');

const PLATFORM_EXPORT_TABLES = Object.freeze([
  'compiled_pack_versions',
  'runs',
  'trace_intake_records',
  'trace_events',
  'trace_artifacts',
  'config_versions',
  'config_component_versions',
  'team_config_bindings',
  'integration_candidates',
  'integration_pack_versions',
  'integration_executions',
  'trainer_jobs',
  'trainer_results',
  'library_items',
  'library_item_revisions',
  'library_links',
  'conversation_artifacts',
  'library_shelves',
  'library_shelf_items',
  'scope_sets',
  'scope_set_items',
  'library_publications',
  'library_public_stacks',
  'library_public_stack_members',
  'library_public_stack_verifications',
  'library_public_stack_verification_members',
  'library_public_stack_reviews',
  'library_public_stack_attestations',
  'library_peer_relays',
  'library_peer_receipts',
  'library_satchel_relays',
  'library_satchel_receipts',
  'track_progress_events',
  'sealed_contexts',
  'sealed_context_violations',
  'approvals',
  'usage_ledger',
  'poker_seasons',
  'poker_divisions',
  'poker_setup_submissions',
  'poker_batches',
  'poker_runs',
  'poker_replay_artifacts',
  'poker_leaderboard_snapshots',
]);

const PRIMARY_KEY_BY_TABLE = Object.freeze({
  compiled_pack_versions: 'pack_version_id',
  runs: 'run_id',
  trace_intake_records: 'trace_intake_record_id',
  trace_events: 'event_id',
  trace_artifacts: 'trace_artifact_id',
  config_versions: 'config_version_id',
  config_component_versions: 'config_component_version_id',
  team_config_bindings: 'team_binding_id',
  integration_candidates: 'integration_candidate_id',
  integration_pack_versions: 'pack_version_id',
  integration_executions: 'integration_execution_id',
  trainer_jobs: 'trainer_job_id',
  trainer_results: 'trainer_result_id',
  library_items: 'library_item_id',
  library_item_revisions: 'library_item_revision_id',
  library_links: 'library_link_id',
  conversation_artifacts: 'conversation_artifact_id',
  library_shelves: 'library_shelf_id',
  library_shelf_items: 'library_shelf_item_id',
  scope_sets: 'scope_set_id',
  scope_set_items: 'scope_set_item_id',
  library_publications: 'library_publication_id',
  library_public_stacks: 'library_public_stack_id',
  library_public_stack_members: 'library_public_stack_member_id',
  library_public_stack_verifications: 'library_public_stack_verification_id',
  library_public_stack_verification_members: 'library_public_stack_verification_member_id',
  library_public_stack_reviews: 'library_public_stack_review_id',
  library_public_stack_attestations: 'library_public_stack_attestation_id',
  library_peer_relays: 'library_peer_relay_id',
  library_peer_receipts: 'library_peer_receipt_id',
  library_satchel_relays: 'library_satchel_relay_id',
  library_satchel_receipts: 'library_satchel_receipt_id',
  track_progress_events: 'track_progress_event_id',
  sealed_contexts: 'sealed_context_id',
  sealed_context_violations: 'sealed_context_violation_id',
  approvals: 'approval_id',
  usage_ledger: 'usage_ledger_id',
  poker_seasons: 'season_id',
  poker_divisions: 'division_id',
  poker_setup_submissions: 'submission_id',
  poker_batches: 'batch_id',
  poker_runs: 'run_id',
  poker_replay_artifacts: 'run_id',
  poker_leaderboard_snapshots: 'snapshot_id',
});

let db = null;

function ensurePlatformSchemas() {
  countPlatformTableRows('runs');
  countTableRows('poker_seasons');
}

function ensureDb() {
  ensurePlatformSchemas();
  if (db) return db;
  const storePath = getStorePath();
  fs.mkdirSync(path.dirname(storePath), { recursive: true });
  db = new DatabaseSync(storePath);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = NORMAL;');
  db.exec('PRAGMA busy_timeout = 5000;');
  return db;
}

function cloneRow(row) {
  return JSON.parse(JSON.stringify(row && typeof row === 'object' ? row : {}));
}

function listTableRows(tableName) {
  const normalizedTableName = String(tableName || '').trim();
  if (!PLATFORM_EXPORT_TABLES.includes(normalizedTableName)) return [];
  const database = ensureDb();
  const hasTable = database.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table' AND name = ?
    LIMIT 1
  `).get(normalizedTableName);
  if (!hasTable) return [];
  const primaryKey = PRIMARY_KEY_BY_TABLE[normalizedTableName] || 'rowid';
  const rows = database.prepare(`SELECT * FROM ${normalizedTableName} ORDER BY ${primaryKey} ASC`).all();
  return rows.map(cloneRow);
}

function getPlatformExportCounts() {
  const out = {};
  for (const tableName of PLATFORM_EXPORT_TABLES) {
    out[tableName] = listTableRows(tableName).length;
  }
  return out;
}

function exportPlatformStateSnapshot() {
  const tables = {};
  for (const tableName of PLATFORM_EXPORT_TABLES) {
    tables[tableName] = listTableRows(tableName);
  }
  return {
    schemaVersion: 'platform-export/v1',
    exportedAt: new Date().toISOString(),
    counts: getPlatformExportCounts(),
    tables,
  };
}

function resetPlatformExportTables() {
  const database = ensureDb();
  database.exec('BEGIN');
  try {
    for (const tableName of [...PLATFORM_EXPORT_TABLES].reverse()) {
      const hasTable = database.prepare(`
        SELECT name
        FROM sqlite_master
        WHERE type = 'table' AND name = ?
        LIMIT 1
      `).get(tableName);
      if (!hasTable) continue;
      database.prepare(`DELETE FROM ${tableName}`).run();
    }
    database.exec('COMMIT');
  } catch (err) {
    database.exec('ROLLBACK');
    throw err;
  }
}

function importPlatformStateSnapshot(snapshot, { reset = false } = {}) {
  const source = snapshot && typeof snapshot === 'object' ? snapshot : {};
  const tables = source.tables && typeof source.tables === 'object' ? source.tables : {};
  const database = ensureDb();
  database.exec('BEGIN');
  try {
    if (reset) {
      for (const tableName of [...PLATFORM_EXPORT_TABLES].reverse()) {
        const hasTable = database.prepare(`
          SELECT name
          FROM sqlite_master
          WHERE type = 'table' AND name = ?
          LIMIT 1
        `).get(tableName);
        if (!hasTable) continue;
        database.prepare(`DELETE FROM ${tableName}`).run();
      }
    }
    for (const tableName of PLATFORM_EXPORT_TABLES) {
      const rows = Array.isArray(tables[tableName]) ? tables[tableName] : [];
      for (const row of rows) {
        const keys = Object.keys(row || {});
        if (!keys.length) continue;
        const placeholders = keys.map(() => '?').join(', ');
        const assignments = keys.map((key) => `${key} = excluded.${key}`).join(', ');
        database.prepare(`
          INSERT INTO ${tableName} (${keys.join(', ')})
          VALUES (${placeholders})
          ON CONFLICT(${PRIMARY_KEY_BY_TABLE[tableName]}) DO UPDATE SET ${assignments}
        `).run(...keys.map((key) => row[key]));
      }
    }
    database.exec('COMMIT');
  } catch (err) {
    database.exec('ROLLBACK');
    throw err;
  }
  return exportPlatformStateSnapshot();
}

function verifyPlatformStateSnapshot(snapshot) {
  const exported = snapshot && typeof snapshot === 'object' ? snapshot : {};
  const expectedTables = exported.tables && typeof exported.tables === 'object' ? exported.tables : {};
  const liveSnapshot = exportPlatformStateSnapshot();
  const mismatches = [];

  for (const tableName of PLATFORM_EXPORT_TABLES) {
    const expectedRows = Array.isArray(expectedTables[tableName]) ? expectedTables[tableName] : [];
    const actualRows = Array.isArray(liveSnapshot.tables[tableName]) ? liveSnapshot.tables[tableName] : [];
    if (expectedRows.length !== actualRows.length) {
      mismatches.push({
        table: tableName,
        id: null,
        reason: 'COUNT_MISMATCH',
        expected: expectedRows.length,
        actual: actualRows.length,
      });
      continue;
    }
    const primaryKey = PRIMARY_KEY_BY_TABLE[tableName];
    for (let index = 0; index < expectedRows.length; index += 1) {
      const expectedRow = expectedRows[index];
      const actualRow = actualRows[index];
      const expectedJson = JSON.stringify(expectedRow);
      const actualJson = JSON.stringify(actualRow);
      if (expectedJson === actualJson) continue;
      mismatches.push({
        table: tableName,
        id: expectedRow?.[primaryKey] || actualRow?.[primaryKey] || null,
        reason: 'ROW_MISMATCH',
        expected: expectedRow,
        actual: actualRow,
      });
      break;
    }
  }

  return {
    ok: mismatches.length === 0,
    counts: liveSnapshot.counts,
    mismatches,
  };
}

module.exports = {
  exportPlatformStateSnapshot,
  getPlatformExportCounts,
  importPlatformStateSnapshot,
  PLATFORM_EXPORT_TABLES,
  resetPlatformExportTables,
  verifyPlatformStateSnapshot,
};
