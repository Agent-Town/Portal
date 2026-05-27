const { sha256, stableJson } = require('./audit_ledger');

const V6_REPLAY_RECONSTRUCTION_VERSION = 'agent-town.v6.replay_reconstruction.v1';
const CIVIC_AUDIT_GENESIS_HASH = sha256('agent-town.v6.civic.audit.genesis');

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

function reconstructCivicAuditReplay(rows = [], {
  expectedStartHash = CIVIC_AUDIT_GENESIS_HASH
} = {}) {
  const errors = [];
  const actionCounts = {};
  const actorKindCounts = {};
  const migrationVersionCounts = {};
  const actorAccounts = new Set();
  const objectRefs = new Set();
  const normalizedRows = normalizeRows(rows);
  let previousHash = String(expectedStartHash || CIVIC_AUDIT_GENESIS_HASH);
  let firstSeq = 0;
  let lastSeq = 0;
  let rollbackCount = 0;
  let beforeAfterSummaryCount = 0;
  let missingSummaryCount = 0;
  let hashOnlyFallbackCount = 0;

  if (!Array.isArray(rows)) errors.push('CIVIC_REPLAY_ROWS_REQUIRED');

  for (const row of normalizedRows) {
    const seq = Number(row?.seq);
    const entry = row?.entry;
    if (!Number.isInteger(seq) || seq <= lastSeq) {
      errors.push('CIVIC_REPLAY_SEQ_ORDER_INVALID');
    }
    if (!entry || typeof entry !== 'object') {
      errors.push('CIVIC_REPLAY_ENTRY_REQUIRED');
      continue;
    }
    if (!firstSeq) firstSeq = seq;
    lastSeq = seq;

    if (row.prevEntryHash !== previousHash) {
      errors.push('CIVIC_REPLAY_PREV_HASH_MISMATCH');
    }
    const expectedEntryHash = sha256(`${previousHash}\n${stableJson(entry)}`);
    if (row.entryHash !== expectedEntryHash) {
      errors.push('CIVIC_REPLAY_ENTRY_HASH_MISMATCH');
    }
    previousHash = String(row.entryHash || expectedEntryHash);

    if (entry.privacy?.redacted !== true) {
      errors.push('CIVIC_REPLAY_REDACTION_REQUIRED');
    }
    if (entry.privacy?.privateDataIncluded !== false) {
      errors.push('CIVIC_REPLAY_PRIVATE_DATA_FORBIDDEN');
    }
    const hasBeforeSummary = typeof entry.beforeSummary === 'string' && entry.beforeSummary.trim().length > 0;
    const hasAfterSummary = typeof entry.afterSummary === 'string' && entry.afterSummary.trim().length > 0;
    if (hasBeforeSummary && hasAfterSummary) {
      beforeAfterSummaryCount += 1;
      if (entry.beforeSummary.includes('Hash-only') || entry.afterSummary.includes('Hash-only')) {
        hashOnlyFallbackCount += 1;
      }
    } else {
      missingSummaryCount += 1;
      errors.push('CIVIC_REPLAY_AUDIT_SUMMARY_REQUIRED');
    }
    increment(actionCounts, entry.actionType);
    increment(actorKindCounts, entry.actor?.kind);
    increment(migrationVersionCounts, entry.migrationVersion);
    if (entry.actor?.accountId) actorAccounts.add(entry.actor.accountId);
    if (entry.objectRef) objectRefs.add(entry.objectRef);
    if (entry.rollbackId) rollbackCount += 1;
  }

  const chainErrors = errors.filter((error) => error.includes('HASH') || error.includes('SEQ'));
  const privacyErrors = errors.filter((error) => error.includes('REDACTION') || error.includes('PRIVATE_DATA'));
  return {
    version: V6_REPLAY_RECONSTRUCTION_VERSION,
    status: 'research_only',
    entryCount: normalizedRows.length,
    firstSeq,
    lastSeq,
    latestEntryHash: previousHash,
    chainValid: chainErrors.length === 0,
    privacySafe: privacyErrors.length === 0,
    privateDataIncluded: false,
    summaryComplete: missingSummaryCount === 0,
    summaryCoverage: {
      beforeAfterSummaryCount,
      missingSummaryCount,
      hashOnlyFallbackCount
    },
    uniqueActorCount: actorAccounts.size,
    uniqueObjectCount: objectRefs.size,
    rollbackCount,
    byActionType: sortedKeysObject(actionCounts),
    byActorKind: sortedKeysObject(actorKindCounts),
    byMigrationVersion: sortedKeysObject(migrationVersionCounts),
    appliesWorldState: false,
    executionStatus: 'not_executable',
    releaseReady: false,
    ok: errors.length === 0,
    errors
  };
}

function reconstructCivicAuditReplayFromLedger(ledger, {
  pageSize = 100,
  maxEntries = 500
} = {}) {
  if (!ledger || typeof ledger.replay !== 'function') {
    return {
      ...reconstructCivicAuditReplay([]),
      ok: false,
      chainValid: false,
      errors: ['CIVIC_REPLAY_LEDGER_REQUIRED']
    };
  }

  const safePageSize = Math.max(1, Math.min(100, Number(pageSize) || 100));
  const safeMaxEntries = Math.max(1, Math.min(500, Number(maxEntries) || 500));
  const rows = [];
  let afterSeq = 0;
  while (rows.length < safeMaxEntries) {
    const page = ledger.replay({ afterSeq, limit: Math.min(safePageSize, safeMaxEntries - rows.length) });
    if (!Array.isArray(page) || page.length === 0) break;
    rows.push(...page);
    afterSeq = Number(page[page.length - 1].seq || afterSeq);
    if (page.length < safePageSize) break;
  }
  return reconstructCivicAuditReplay(rows);
}

function assertCivicReplayReconstructionSafe(report = {}) {
  const errors = [];
  if (report.version !== V6_REPLAY_RECONSTRUCTION_VERSION) {
    errors.push('CIVIC_REPLAY_RECONSTRUCTION_VERSION_REQUIRED');
  }
  if (report.status !== 'research_only') {
    errors.push('CIVIC_REPLAY_RECONSTRUCTION_RESEARCH_ONLY_REQUIRED');
  }
  if (report.executionStatus !== 'not_executable') {
    errors.push('CIVIC_REPLAY_RECONSTRUCTION_NON_EXECUTING_REQUIRED');
  }
  if (report.appliesWorldState !== false) {
    errors.push('CIVIC_REPLAY_RECONSTRUCTION_APPLIES_STATE_FORBIDDEN');
  }
  if (report.releaseReady !== false) {
    errors.push('CIVIC_REPLAY_RECONSTRUCTION_RELEASE_READY_FORBIDDEN');
  }
  if (report.privateDataIncluded !== false || report.privacySafe !== true) {
    errors.push('CIVIC_REPLAY_RECONSTRUCTION_PRIVACY_SAFE_REQUIRED');
  }
  if (report.summaryComplete !== true) {
    errors.push('CIVIC_REPLAY_RECONSTRUCTION_SUMMARY_REQUIRED');
  }
  if (report.chainValid !== true) {
    errors.push('CIVIC_REPLAY_RECONSTRUCTION_CHAIN_VALID_REQUIRED');
  }
  if (report.ok !== true || (Array.isArray(report.errors) && report.errors.length > 0)) {
    errors.push('CIVIC_REPLAY_RECONSTRUCTION_ERRORS_PRESENT');
  }
  return {
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  CIVIC_AUDIT_GENESIS_HASH,
  V6_REPLAY_RECONSTRUCTION_VERSION,
  assertCivicReplayReconstructionSafe,
  reconstructCivicAuditReplay,
  reconstructCivicAuditReplayFromLedger
};
