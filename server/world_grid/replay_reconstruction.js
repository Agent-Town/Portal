const {
  WORLD_GRID_AUDIT_MIGRATION_VERSION,
  WORLD_GRID_AUDIT_SCHEMA_VERSION,
  sha256,
  stableJson
} = require('./audit_log');

const WORLD_GRID_REPLAY_RECONSTRUCTION_VERSION = 'agent-town.v5.world-grid.replay-reconstruction.v1';
const WORLD_GRID_AUDIT_GENESIS_HASH = sha256('agent-town.v5.world-grid.audit.genesis');
const WORLD_GRID_AUDIT_SNAPSHOT_VERSION = 'agent-town.v5.world-grid.audit-snapshot.v1';

function increment(counter, key) {
  const normalized = String(key || 'unknown');
  counter[normalized] = (counter[normalized] || 0) + 1;
}

function normalizeRows(rows) {
  return Array.isArray(rows) ? rows : [];
}

function sortedKeysObject(counter) {
  return Object.keys(counter).sort().reduce((out, key) => {
    out[key] = counter[key];
    return out;
  }, {});
}

function hasExactRecordSnapshot(summary = {}) {
  return summary?.exactRecordSnapshots === true
    || (Array.isArray(summary?.recordSnapshots) && summary.recordSnapshots.length > 0);
}

function reconstructWorldGridAuditReplay(rows = [], {
  expectedStartHash = WORLD_GRID_AUDIT_GENESIS_HASH
} = {}) {
  const errors = [];
  const surfaceCounts = {};
  const migrationVersionCounts = {};
  const actorAccounts = new Set();
  const objectRefs = new Set();
  const normalizedRows = normalizeRows(rows);
  let previousHash = String(expectedStartHash || WORLD_GRID_AUDIT_GENESIS_HASH);
  let firstSeq = 0;
  let lastSeq = 0;
  let rollbackCount = 0;
  let beforeAfterSnapshotCount = 0;
  let missingSnapshotCount = 0;
  let fallbackBeforeStateCount = 0;
  let exactRecordSnapshotCount = 0;

  if (!Array.isArray(rows)) errors.push('WORLD_GRID_REPLAY_ROWS_REQUIRED');

  for (const row of normalizedRows) {
    const seq = Number(row?.seq);
    const entry = row?.entry;
    if (!Number.isInteger(seq) || seq <= lastSeq) {
      errors.push('WORLD_GRID_REPLAY_SEQ_ORDER_INVALID');
    }
    if (!entry || typeof entry !== 'object') {
      errors.push('WORLD_GRID_REPLAY_ENTRY_REQUIRED');
      continue;
    }
    if (!firstSeq) firstSeq = seq;
    lastSeq = seq;

    if (row.prevEntryHash !== previousHash) {
      errors.push('WORLD_GRID_REPLAY_PREV_HASH_MISMATCH');
    }
    const expectedEntryHash = sha256(`${previousHash}\n${stableJson(entry)}`);
    if (row.entryHash !== expectedEntryHash) {
      errors.push('WORLD_GRID_REPLAY_ENTRY_HASH_MISMATCH');
    }
    previousHash = String(row.entryHash || expectedEntryHash);

    if (entry.schemaVersion !== WORLD_GRID_AUDIT_SCHEMA_VERSION) {
      errors.push('WORLD_GRID_REPLAY_SCHEMA_VERSION_REQUIRED');
    }
    if (entry.migrationVersion !== WORLD_GRID_AUDIT_MIGRATION_VERSION) {
      errors.push('WORLD_GRID_REPLAY_MIGRATION_VERSION_REQUIRED');
    }
    if (entry.privacy?.redacted !== true) {
      errors.push('WORLD_GRID_REPLAY_REDACTION_REQUIRED');
    }
    if (entry.privacy?.privateDataIncluded !== false) {
      errors.push('WORLD_GRID_REPLAY_PRIVATE_DATA_FORBIDDEN');
    }

    const beforeSummary = entry.beforeSummary;
    const afterSummary = entry.afterSummary;
    const afterSnapshot = afterSummary?.snapshot;
    const beforeSnapshotOk = beforeSummary
      && typeof beforeSummary === 'object'
      && beforeSummary.snapshotVersion === WORLD_GRID_AUDIT_SNAPSHOT_VERSION
      && beforeSummary.phase === 'before';
    const afterSnapshotOk = afterSnapshot
      && typeof afterSnapshot === 'object'
      && afterSnapshot.snapshotVersion === WORLD_GRID_AUDIT_SNAPSHOT_VERSION
      && afterSnapshot.phase === 'after';

    if (beforeSnapshotOk && afterSnapshotOk) {
      beforeAfterSnapshotCount += 1;
    } else {
      missingSnapshotCount += 1;
      errors.push('WORLD_GRID_REPLAY_AUDIT_SNAPSHOT_REQUIRED');
    }
    if (beforeSummary?.state === 'unrecorded-prototype-before-state') {
      fallbackBeforeStateCount += 1;
    }
    if (hasExactRecordSnapshot(beforeSummary)) exactRecordSnapshotCount += 1;
    if (entry.beforeHash !== sha256(stableJson(beforeSummary))) {
      errors.push('WORLD_GRID_REPLAY_BEFORE_HASH_MISMATCH');
    }
    if (entry.afterHash !== sha256(stableJson(afterSummary))) {
      errors.push('WORLD_GRID_REPLAY_AFTER_HASH_MISMATCH');
    }

    increment(surfaceCounts, entry.surface);
    increment(migrationVersionCounts, entry.migrationVersion);
    if (entry.actor?.accountId) actorAccounts.add(entry.actor.accountId);
    if (entry.objectRef) objectRefs.add(entry.objectRef);
    if (entry.rollbackId) rollbackCount += 1;
  }

  const chainErrors = errors.filter((error) => error.includes('HASH') || error.includes('SEQ'));
  const privacyErrors = errors.filter((error) => error.includes('REDACTION') || error.includes('PRIVATE_DATA'));
  const snapshotErrors = errors.filter((error) => error.includes('SNAPSHOT'));
  return {
    version: WORLD_GRID_REPLAY_RECONSTRUCTION_VERSION,
    status: 'prototype_replay_reconstruction',
    entryCount: normalizedRows.length,
    firstSeq,
    lastSeq,
    latestEntryHash: previousHash,
    chainValid: chainErrors.length === 0,
    privacySafe: privacyErrors.length === 0,
    privateDataIncluded: false,
    snapshotComplete: snapshotErrors.length === 0,
    aggregateSnapshotComplete: snapshotErrors.length === 0,
    exactBeforeStateComplete: exactRecordSnapshotCount > 0 && exactRecordSnapshotCount === normalizedRows.length,
    releaseReplayReady: false,
    summaryCoverage: {
      beforeAfterSnapshotCount,
      missingSnapshotCount,
      fallbackBeforeStateCount,
      exactRecordSnapshotCount
    },
    uniqueActorCount: actorAccounts.size,
    uniqueObjectCount: objectRefs.size,
    rollbackCount,
    bySurface: sortedKeysObject(surfaceCounts),
    byMigrationVersion: sortedKeysObject(migrationVersionCounts),
    appliesWorldState: false,
    mutatesWorldState: false,
    executionStatus: 'not_executable',
    releaseReady: false,
    ok: errors.length === 0,
    errors
  };
}

function reconstructWorldGridAuditReplayFromLog(log, {
  pageSize = 100,
  maxEntries = 500
} = {}) {
  if (!log || typeof log.replay !== 'function') {
    return {
      ...reconstructWorldGridAuditReplay([]),
      ok: false,
      chainValid: false,
      errors: ['WORLD_GRID_REPLAY_LOG_REQUIRED']
    };
  }

  const safePageSize = Math.max(1, Math.min(100, Number(pageSize) || 100));
  const safeMaxEntries = Math.max(1, Math.min(500, Number(maxEntries) || 500));
  const rows = [];
  let afterSeq = 0;
  while (rows.length < safeMaxEntries) {
    const page = log.replay({ afterSeq, limit: Math.min(safePageSize, safeMaxEntries - rows.length) });
    if (!Array.isArray(page) || page.length === 0) break;
    rows.push(...page);
    afterSeq = Number(page[page.length - 1].seq || afterSeq);
    if (page.length < safePageSize) break;
  }
  return reconstructWorldGridAuditReplay(rows);
}

function assertWorldGridReplayReconstructionSafe(report = {}) {
  const errors = [];
  if (report.version !== WORLD_GRID_REPLAY_RECONSTRUCTION_VERSION) {
    errors.push('WORLD_GRID_REPLAY_RECONSTRUCTION_VERSION_REQUIRED');
  }
  if (report.status !== 'prototype_replay_reconstruction') {
    errors.push('WORLD_GRID_REPLAY_RECONSTRUCTION_STATUS_REQUIRED');
  }
  if (report.executionStatus !== 'not_executable') {
    errors.push('WORLD_GRID_REPLAY_RECONSTRUCTION_NON_EXECUTING_REQUIRED');
  }
  if (report.appliesWorldState !== false || report.mutatesWorldState !== false) {
    errors.push('WORLD_GRID_REPLAY_RECONSTRUCTION_STATE_APPLICATION_FORBIDDEN');
  }
  if (report.releaseReady !== false || report.releaseReplayReady !== false) {
    errors.push('WORLD_GRID_REPLAY_RECONSTRUCTION_RELEASE_READY_FORBIDDEN');
  }
  if (report.privateDataIncluded !== false || report.privacySafe !== true) {
    errors.push('WORLD_GRID_REPLAY_RECONSTRUCTION_PRIVACY_SAFE_REQUIRED');
  }
  if (report.snapshotComplete !== true || report.aggregateSnapshotComplete !== true) {
    errors.push('WORLD_GRID_REPLAY_RECONSTRUCTION_SNAPSHOT_REQUIRED');
  }
  if (report.chainValid !== true) {
    errors.push('WORLD_GRID_REPLAY_RECONSTRUCTION_CHAIN_VALID_REQUIRED');
  }
  if (report.exactBeforeStateComplete === true) {
    const exactCount = Number(report.summaryCoverage?.exactRecordSnapshotCount || 0);
    if (exactCount !== Number(report.entryCount || 0)) {
      errors.push('WORLD_GRID_REPLAY_RECONSTRUCTION_EXACT_STATE_UNPROVEN');
    }
  }
  if (report.ok !== true || (Array.isArray(report.errors) && report.errors.length > 0)) {
    errors.push('WORLD_GRID_REPLAY_RECONSTRUCTION_ERRORS_PRESENT');
  }
  return {
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  WORLD_GRID_AUDIT_GENESIS_HASH,
  WORLD_GRID_REPLAY_RECONSTRUCTION_VERSION,
  assertWorldGridReplayReconstructionSafe,
  reconstructWorldGridAuditReplay,
  reconstructWorldGridAuditReplayFromLog
};
