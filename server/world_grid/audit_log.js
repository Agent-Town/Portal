const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const WORLD_GRID_AUDIT_SCHEMA_VERSION = 'agent-town.v5.world-grid.audit.v1';
const WORLD_GRID_AUDIT_MIGRATION_VERSION = 'world_grid_audit_v1';
const PRIVATE_AUDIT_FIELD_RE = /(secret|token|credential|password|providerconfig|workertraffic|privateeventlog|brain|wallet)/i;

let singleton = null;
let singletonPath = '';

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

function sha256(value = '') {
  return `sha256:${crypto.createHash('sha256').update(String(value || ''), 'utf8').digest('hex')}`;
}

function bodyForAuditHash(body = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return {};
  const next = redactForAudit(body);
  delete next.idempotencyKey;
  delete next.csrfToken;
  return next;
}

function redactForAudit(value, key = '') {
  if (PRIVATE_AUDIT_FIELD_RE.test(String(key || ''))) return '[redacted]';
  if (Array.isArray(value)) return value.map((entry) => redactForAudit(entry));
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((out, childKey) => {
      out[childKey] = redactForAudit(value[childKey], childKey);
      return out;
    }, {});
  }
  return value;
}

function shortHash(value = '') {
  return sha256(value).slice('sha256:'.length, 'sha256:'.length + 24);
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
    regionId: row.region_id,
    surface: row.surface,
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
    CREATE TABLE IF NOT EXISTS world_grid_audit_log (
      seq INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_id TEXT NOT NULL UNIQUE,
      actor_account_id TEXT NOT NULL,
      region_id TEXT NOT NULL,
      surface TEXT NOT NULL,
      object_ref TEXT NOT NULL,
      idempotency_key TEXT NOT NULL,
      request_hash TEXT NOT NULL,
      response_hash TEXT NOT NULL,
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
    CREATE INDEX IF NOT EXISTS idx_world_grid_audit_actor_seq
      ON world_grid_audit_log(actor_account_id, seq);
    CREATE INDEX IF NOT EXISTS idx_world_grid_audit_region_seq
      ON world_grid_audit_log(region_id, seq);
    CREATE INDEX IF NOT EXISTS idx_world_grid_audit_surface_seq
      ON world_grid_audit_log(surface, seq);
    CREATE INDEX IF NOT EXISTS idx_world_grid_audit_object_seq
      ON world_grid_audit_log(object_ref, seq);
  `);
}

function buildStatements(db) {
  return {
    latest: db.prepare(`
      SELECT seq, entry_hash
      FROM world_grid_audit_log
      ORDER BY seq DESC
      LIMIT 1
    `),
    byEntryId: db.prepare(`
      SELECT *
      FROM world_grid_audit_log
      WHERE entry_id = ?
      LIMIT 1
    `),
    byActorIdempotency: db.prepare(`
      SELECT *
      FROM world_grid_audit_log
      WHERE actor_account_id = ? AND idempotency_key = ?
      LIMIT 1
    `),
    insert: db.prepare(`
      INSERT INTO world_grid_audit_log (
        entry_id, actor_account_id, region_id, surface, object_ref,
        idempotency_key, request_hash, response_hash, before_hash, after_hash,
        created_at, migration_version, rollback_id, prev_entry_hash, entry_hash, entry_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `),
    replayAll: db.prepare(`
      SELECT *
      FROM world_grid_audit_log
      WHERE seq > ?
      ORDER BY seq ASC
      LIMIT ?
    `),
    replayByActor: db.prepare(`
      SELECT *
      FROM world_grid_audit_log
      WHERE actor_account_id = ? AND seq > ?
      ORDER BY seq ASC
      LIMIT ?
    `),
    replayByRegion: db.prepare(`
      SELECT *
      FROM world_grid_audit_log
      WHERE region_id = ? AND seq > ?
      ORDER BY seq ASC
      LIMIT ?
    `),
    replayBySurface: db.prepare(`
      SELECT *
      FROM world_grid_audit_log
      WHERE surface = ? AND seq > ?
      ORDER BY seq ASC
      LIMIT ?
    `),
    count: db.prepare('SELECT COUNT(1) AS count FROM world_grid_audit_log')
  };
}

function withTransaction(db, fn) {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

function firstString(...values) {
  for (const value of values) {
    const text = String(value || '').trim();
    if (text) return text;
  }
  return '';
}

function inferObjectRef(response = {}, surface = '') {
  const data = response?.data && typeof response.data === 'object' ? response.data : {};
  const action = response?.action || data.action || {};
  const claim = response?.claim || data.claim || {};
  const town = response?.town || data.town || {};
  const request = response?.request || data.request || {};
  const contribution = response?.contribution || data.contribution || {};
  const reward = response?.reward || data.reward || {};
  const report = response?.report || data.report || {};
  return firstString(
    claim.claimId,
    response?.claimId,
    town.publicTownId,
    response?.publicTownId,
    report.reportId,
    request.requestId,
    contribution.contributionId,
    reward.rewardId,
    action.actionId,
    response?.rollbackId,
    surface
  );
}

function inferRollbackId(response = {}) {
  const data = response?.data && typeof response.data === 'object' ? response.data : {};
  const action = response?.action || data.action || {};
  return firstString(response?.rollbackId, action.rollbackId);
}

function responseSummary(response = {}) {
  const data = response?.data && typeof response.data === 'object' ? response.data : {};
  const action = response?.action || data.action || {};
  return {
    ok: response?.ok === true,
    objectRef: inferObjectRef(response),
    rollbackId: inferRollbackId(response),
    mutationApplied: response?.mutationApplied === false ? false : undefined,
    responseKeys: Object.keys(response || {}).filter((key) => key !== 'featureFlags').sort(),
    dataKeys: Object.keys(data || {}).sort(),
    moderationStatus: firstString(action.moderationStatus)
  };
}

function normalizeAuditEntry({
  owner,
  surface = '',
  idempotencyKey = '',
  body = {},
  response = {},
  createdAtMs = Date.now()
} = {}) {
  const actorAccountId = String(owner?.ownerAccountId || '').trim();
  const regionId = String(owner?.regionId || '').trim();
  const key = String(idempotencyKey || '').trim();
  const normalizedSurface = String(surface || '').trim();
  if (!actorAccountId || !regionId || !key || !normalizedSurface) {
    throw new Error('WORLD_GRID_AUDIT_ENTRY_INVALID');
  }
  const requestHash = sha256(stableJson({
    surface: normalizedSurface,
    body: bodyForAuditHash(body)
  }));
  const summary = responseSummary(response);
  const afterSummary = {
    surface: normalizedSurface,
    objectRef: summary.objectRef || normalizedSurface,
    response: summary
  };
  const beforeSummary = {
    surface: normalizedSurface,
    state: 'unrecorded-prototype-before-state',
    note: 'Durable before-state snapshots are a release-gate requirement.'
  };
  const responseHash = sha256(stableJson(afterSummary));
  return {
    schemaVersion: WORLD_GRID_AUDIT_SCHEMA_VERSION,
    entryId: `world_grid_audit_${shortHash(`${actorAccountId}\n${key}`)}`,
    actor: {
      kind: 'human',
      accountId: actorAccountId,
      regionId
    },
    surface: normalizedSurface,
    objectRef: afterSummary.objectRef,
    idempotencyKey: key,
    requestHash,
    responseHash,
    beforeHash: sha256(stableJson(beforeSummary)),
    afterHash: sha256(stableJson(afterSummary)),
    beforeSummary,
    afterSummary,
    createdAtMs: Number(createdAtMs) || Date.now(),
    migrationVersion: WORLD_GRID_AUDIT_MIGRATION_VERSION,
    rollbackId: inferRollbackId(response),
    replayable: true,
    privacy: {
      redacted: true,
      privateDataIncluded: false,
      dataClasses: ['world_grid_audit_summary']
    }
  };
}

function createWorldGridAuditLog({ sqlitePath } = {}) {
  if (!sqlitePath || typeof sqlitePath !== 'string') {
    throw new Error('WORLD_GRID_AUDIT_SQLITE_PATH_REQUIRED');
  }
  fs.mkdirSync(path.dirname(sqlitePath), { recursive: true });
  const { DatabaseSync } = require('node:sqlite');
  const db = new DatabaseSync(sqlitePath);
  ensureSchema(db);
  const statements = buildStatements(db);
  let closed = false;

  function append(rawEntry = {}) {
    const entry = normalizeAuditEntry(rawEntry);
    const entryJson = stableJson(entry);
    return withTransaction(db, () => {
      const existingIdempotency = parseEntry(statements.byActorIdempotency.get(entry.actor.accountId, entry.idempotencyKey));
      if (existingIdempotency) {
        if (stableJson(existingIdempotency.entry) !== entryJson) {
          const error = new Error('WORLD_GRID_AUDIT_IDEMPOTENCY_CONFLICT');
          error.details = {
            actorAccountId: entry.actor.accountId,
            idempotencyKey: entry.idempotencyKey,
            existingEntryId: existingIdempotency.entry.entryId
          };
          throw error;
        }
        return { ...existingIdempotency, duplicate: true };
      }

      if (parseEntry(statements.byEntryId.get(entry.entryId))) {
        const error = new Error('WORLD_GRID_AUDIT_ENTRY_ID_CONFLICT');
        error.details = { entryId: entry.entryId };
        throw error;
      }

      const latest = statements.latest.get();
      const prevEntryHash = latest?.entry_hash || sha256('agent-town.v5.world-grid.audit.genesis');
      const entryHash = sha256(`${prevEntryHash}\n${entryJson}`);
      statements.insert.run(
        entry.entryId,
        entry.actor.accountId,
        entry.actor.regionId,
        entry.surface,
        entry.objectRef,
        entry.idempotencyKey,
        entry.requestHash,
        entry.responseHash,
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

  function replay({ afterSeq = 0, limit = 100, actorAccountId = '', regionId = '', surface = '' } = {}) {
    const safeAfterSeq = Number.isInteger(Number(afterSeq)) ? Math.max(0, Number(afterSeq)) : 0;
    const safeLimit = Number.isInteger(Number(limit)) ? Math.max(1, Math.min(500, Number(limit))) : 100;
    if (actorAccountId) return statements.replayByActor.all(String(actorAccountId), safeAfterSeq, safeLimit).map(parseEntry);
    if (regionId) return statements.replayByRegion.all(String(regionId), safeAfterSeq, safeLimit).map(parseEntry);
    if (surface) return statements.replayBySurface.all(String(surface), safeAfterSeq, safeLimit).map(parseEntry);
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
    replay,
    sqlitePath
  };
}

function configuredAuditPath(env = process.env) {
  return String(env.WORLD_GRID_AUDIT_SQLITE_PATH || '').trim();
}

function getWorldGridAuditLog(env = process.env) {
  const sqlitePath = configuredAuditPath(env);
  if (!sqlitePath) return null;
  if (!singleton || singletonPath !== sqlitePath) {
    if (singleton) singleton.close();
    singleton = createWorldGridAuditLog({ sqlitePath });
    singletonPath = sqlitePath;
  }
  return singleton;
}

function recordWorldGridMutationAudit(args = {}) {
  const log = getWorldGridAuditLog();
  if (!log) return null;
  return log.append(args);
}

function closeWorldGridAuditLog() {
  if (!singleton) return;
  singleton.close();
  singleton = null;
  singletonPath = '';
}

module.exports = {
  WORLD_GRID_AUDIT_MIGRATION_VERSION,
  WORLD_GRID_AUDIT_SCHEMA_VERSION,
  closeWorldGridAuditLog,
  createWorldGridAuditLog,
  recordWorldGridMutationAudit,
  sha256,
  stableJson
};
