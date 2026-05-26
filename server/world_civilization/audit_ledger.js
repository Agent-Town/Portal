const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const { validateAuditLedgerEntry } = require('./schemas');

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((out, key) => {
      out[key] = stableValue(value[key]);
      return out;
    }, {});
  }
  return value;
}

function stableJson(value) {
  return JSON.stringify(stableValue(value));
}

function sha256(value) {
  return `sha256:${crypto.createHash('sha256').update(String(value || ''), 'utf8').digest('hex')}`;
}

function parseEntry(row) {
  if (!row) return null;
  const entry = JSON.parse(row.entry_json);
  return {
    seq: Number(row.seq),
    entry,
    entryHash: row.entry_hash,
    prevEntryHash: row.prev_entry_hash,
    createdAtMs: Number(row.created_at),
    actorAccountId: row.actor_account_id,
    actionType: row.action_type,
    objectRef: row.object_ref,
    idempotencyKey: row.idempotency_key,
    migrationVersion: row.migration_version,
    rollbackId: row.rollback_id || ''
  };
}

function ensureSchema(db) {
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = NORMAL;');
  db.exec('PRAGMA busy_timeout = 5000;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS world_civic_audit_ledger (
      seq INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_id TEXT NOT NULL UNIQUE,
      actor_kind TEXT NOT NULL,
      actor_account_id TEXT NOT NULL,
      action_type TEXT NOT NULL,
      object_ref TEXT NOT NULL,
      idempotency_key TEXT NOT NULL,
      before_hash TEXT NOT NULL,
      after_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      migration_version TEXT NOT NULL,
      rollback_id TEXT NOT NULL,
      prev_entry_hash TEXT NOT NULL,
      entry_hash TEXT NOT NULL,
      entry_json TEXT NOT NULL,
      UNIQUE(actor_account_id, idempotency_key)
    );
    CREATE INDEX IF NOT EXISTS idx_world_civic_audit_actor_seq
      ON world_civic_audit_ledger(actor_account_id, seq);
    CREATE INDEX IF NOT EXISTS idx_world_civic_audit_object_seq
      ON world_civic_audit_ledger(object_ref, seq);
    CREATE INDEX IF NOT EXISTS idx_world_civic_audit_action_seq
      ON world_civic_audit_ledger(action_type, seq);
  `);
}

function buildStatements(db) {
  return {
    latest: db.prepare(`
      SELECT seq, entry_hash
      FROM world_civic_audit_ledger
      ORDER BY seq DESC
      LIMIT 1
    `),
    byEntryId: db.prepare(`
      SELECT *
      FROM world_civic_audit_ledger
      WHERE entry_id = ?
      LIMIT 1
    `),
    byActorIdempotency: db.prepare(`
      SELECT *
      FROM world_civic_audit_ledger
      WHERE actor_account_id = ? AND idempotency_key = ?
      LIMIT 1
    `),
    insert: db.prepare(`
      INSERT INTO world_civic_audit_ledger (
        entry_id, actor_kind, actor_account_id, action_type, object_ref,
        idempotency_key, before_hash, after_hash, created_at,
        migration_version, rollback_id, prev_entry_hash, entry_hash, entry_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `),
    replayAll: db.prepare(`
      SELECT *
      FROM world_civic_audit_ledger
      WHERE seq > ?
      ORDER BY seq ASC
      LIMIT ?
    `),
    replayByActor: db.prepare(`
      SELECT *
      FROM world_civic_audit_ledger
      WHERE actor_account_id = ? AND seq > ?
      ORDER BY seq ASC
      LIMIT ?
    `),
    replayByObject: db.prepare(`
      SELECT *
      FROM world_civic_audit_ledger
      WHERE object_ref = ? AND seq > ?
      ORDER BY seq ASC
      LIMIT ?
    `),
    count: db.prepare('SELECT COUNT(1) AS count FROM world_civic_audit_ledger')
  };
}

function withTransaction(db, fn) {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

function createCivicAuditLedger({ sqlitePath }) {
  if (!sqlitePath || typeof sqlitePath !== 'string') {
    throw new Error('CIVIC_AUDIT_SQLITE_PATH_REQUIRED');
  }
  fs.mkdirSync(path.dirname(sqlitePath), { recursive: true });
  const db = new DatabaseSync(sqlitePath);
  ensureSchema(db);
  const statements = buildStatements(db);
  let closed = false;

  function append(rawEntry = {}) {
    const validation = validateAuditLedgerEntry(rawEntry);
    if (!validation.ok) {
      const err = new Error('CIVIC_AUDIT_ENTRY_INVALID');
      err.details = { errors: validation.errors };
      throw err;
    }
    const entry = validation.value;
    const entryJson = stableJson(entry);
    return withTransaction(db, () => {
      const existingIdempotency = parseEntry(statements.byActorIdempotency.get(entry.actor.accountId, entry.idempotencyKey));
      if (existingIdempotency) {
        if (stableJson(existingIdempotency.entry) !== entryJson) {
          const err = new Error('CIVIC_AUDIT_IDEMPOTENCY_CONFLICT');
          err.details = {
            actorAccountId: entry.actor.accountId,
            idempotencyKey: entry.idempotencyKey,
            existingEntryId: existingIdempotency.entry.entryId
          };
          throw err;
        }
        return { ...existingIdempotency, duplicate: true };
      }

      const existingEntryId = parseEntry(statements.byEntryId.get(entry.entryId));
      if (existingEntryId) {
        const err = new Error('CIVIC_AUDIT_ENTRY_ID_CONFLICT');
        err.details = { entryId: entry.entryId };
        throw err;
      }

      const latest = statements.latest.get();
      const prevEntryHash = latest?.entry_hash || sha256('agent-town.v6.civic.audit.genesis');
      const entryHash = sha256(`${prevEntryHash}\n${entryJson}`);
      statements.insert.run(
        entry.entryId,
        entry.actor.kind,
        entry.actor.accountId,
        entry.actionType,
        entry.objectRef,
        entry.idempotencyKey,
        entry.beforeHash,
        entry.afterHash,
        entry.createdAtMs,
        entry.migrationVersion,
        entry.rollbackId || '',
        prevEntryHash,
        entryHash,
        entryJson
      );
      return parseEntry(statements.byEntryId.get(entry.entryId));
    });
  }

  function getByEntryId(entryId = '') {
    return parseEntry(statements.byEntryId.get(String(entryId || '')));
  }

  function getByIdempotency(actorAccountId = '', idempotencyKey = '') {
    return parseEntry(statements.byActorIdempotency.get(String(actorAccountId || ''), String(idempotencyKey || '')));
  }

  function replay({ afterSeq = 0, limit = 100, actorAccountId = '', objectRef = '' } = {}) {
    const safeAfterSeq = Number.isInteger(Number(afterSeq)) ? Math.max(0, Number(afterSeq)) : 0;
    const safeLimit = Number.isInteger(Number(limit)) ? Math.max(1, Math.min(500, Number(limit))) : 100;
    if (actorAccountId) {
      return statements.replayByActor.all(String(actorAccountId), safeAfterSeq, safeLimit).map(parseEntry);
    }
    if (objectRef) {
      return statements.replayByObject.all(String(objectRef), safeAfterSeq, safeLimit).map(parseEntry);
    }
    return statements.replayAll.all(safeAfterSeq, safeLimit).map(parseEntry);
  }

  function count() {
    return Number(statements.count.get().count || 0);
  }

  function close() {
    if (closed) return;
    closed = true;
    db.close();
  }

  return {
    append,
    close,
    count,
    getByEntryId,
    getByIdempotency,
    replay,
    sqlitePath
  };
}

module.exports = {
  createCivicAuditLedger,
  sha256,
  stableJson
};
