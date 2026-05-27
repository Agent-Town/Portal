const crypto = require('crypto');

const V6_WRITE_CONTENTION_REHEARSAL_VERSION = 'agent-town.v6.write_contention_rehearsal.v1';
const REQUIRED_WRITE_CONTENTION_RELEASE_GAPS = [
  'production_route_contention_slo_targets_required',
  'store_specific_writer_backoff_strategy_required',
  'multi_store_transaction_contention_required',
  'live_wal_checkpoint_contention_drill_required',
  'route_level_idempotency_contention_required'
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sha256(value = '') {
  return `sha256:${crypto.createHash('sha256').update(String(value || ''), 'utf8').digest('hex')}`;
}

function safeKey(value = '') {
  return String(value || '').trim().replace(/[^a-zA-Z0-9_:-]/g, '').slice(0, 96);
}

function safeError(value = '') {
  return String(value || '').trim().replace(/[^\w:.-]/g, '_').slice(0, 160);
}

function normalizeAttempt(attempt = {}) {
  const entryIds = Array.isArray(attempt.entryIds) ? attempt.entryIds.map((entry) => String(entry || '')).filter(Boolean) : [];
  const errors = Array.isArray(attempt.errors) ? attempt.errors.map(safeError).filter(Boolean) : [];
  return {
    writerId: safeKey(attempt.writerId || ''),
    ok: attempt.ok === true,
    writeCount: Number.isInteger(Number(attempt.writeCount)) ? Math.max(0, Number(attempt.writeCount)) : 0,
    duplicateCount: Number.isInteger(Number(attempt.duplicateCount)) ? Math.max(0, Number(attempt.duplicateCount)) : 0,
    errorCount: errors.length,
    entryIdCount: entryIds.length,
    entryIdDigest: sha256(entryIds.sort().join('\n')),
    errors
  };
}

function buildMissingReport(errors = []) {
  return {
    version: V6_WRITE_CONTENTION_REHEARSAL_VERSION,
    status: 'research_only',
    ok: false,
    errors,
    releaseReady: false,
    runtimeExposed: false,
    playerVisible: false,
    appliesWorldState: false,
    exposesPrivateData: false,
    reportPayloadIncludesRows: false,
    executionStatus: 'not_executable',
    expectedWriterCount: 0,
    expectedAppendCount: 0,
    expectedDuplicateCount: 0,
    writerCount: 0,
    appendCount: 0,
    duplicateCount: 0,
    uniqueEntryCount: 0,
    ledgerCount: 0,
    replayEntryCount: 0,
    hashChainValid: false,
    privacySafeReplay: false,
    writerReports: [],
    releaseGaps: [...REQUIRED_WRITE_CONTENTION_RELEASE_GAPS]
  };
}

function buildV6WriteContentionRehearsalReport({
  attempts = [],
  expectedWriterCount = 0,
  expectedAppendCount = 0,
  expectedDuplicateCount = 0,
  ledgerCount = 0,
  replayReport = {},
  source = 'runtime'
} = {}) {
  const errors = [];
  if (!Array.isArray(attempts) || attempts.length === 0) errors.push('V6_WRITE_CONTENTION_ATTEMPTS_REQUIRED');
  const safeExpectedWriterCount = Number.isInteger(Number(expectedWriterCount)) ? Math.max(0, Number(expectedWriterCount)) : 0;
  const safeExpectedAppendCount = Number.isInteger(Number(expectedAppendCount)) ? Math.max(0, Number(expectedAppendCount)) : 0;
  const safeExpectedDuplicateCount = Number.isInteger(Number(expectedDuplicateCount)) ? Math.max(0, Number(expectedDuplicateCount)) : 0;
  if (safeExpectedWriterCount <= 0) errors.push('V6_WRITE_CONTENTION_EXPECTED_WRITERS_REQUIRED');
  if (safeExpectedAppendCount <= 0) errors.push('V6_WRITE_CONTENTION_EXPECTED_APPENDS_REQUIRED');
  if (errors.length > 0) return buildMissingReport(errors);

  const writerReports = attempts.map(normalizeAttempt);
  const entryIds = attempts.flatMap((attempt) => (
    Array.isArray(attempt.entryIds) ? attempt.entryIds.map((entry) => String(entry || '')).filter(Boolean) : []
  ));
  const uniqueEntryCount = new Set(entryIds).size;
  const appendCount = writerReports.reduce((sum, entry) => sum + entry.writeCount, 0);
  const duplicateCount = writerReports.reduce((sum, entry) => sum + entry.duplicateCount, 0);
  const replayEntryCount = Number.isInteger(Number(replayReport.entryCount)) ? Math.max(0, Number(replayReport.entryCount)) : 0;
  const safeLedgerCount = Number.isInteger(Number(ledgerCount)) ? Math.max(0, Number(ledgerCount)) : 0;

  if (writerReports.length !== safeExpectedWriterCount) errors.push('V6_WRITE_CONTENTION_WRITER_COUNT_MISMATCH');
  if (writerReports.some((entry) => entry.ok !== true || entry.errorCount > 0)) errors.push('V6_WRITE_CONTENTION_WRITER_FAILURE');
  if (appendCount !== safeExpectedAppendCount) errors.push('V6_WRITE_CONTENTION_APPEND_COUNT_MISMATCH');
  if (duplicateCount !== safeExpectedDuplicateCount) errors.push('V6_WRITE_CONTENTION_DUPLICATE_COUNT_MISMATCH');
  if (uniqueEntryCount !== safeExpectedAppendCount) errors.push('V6_WRITE_CONTENTION_UNIQUE_ENTRY_COUNT_MISMATCH');
  if (safeLedgerCount !== safeExpectedAppendCount) errors.push('V6_WRITE_CONTENTION_LEDGER_COUNT_MISMATCH');
  if (replayEntryCount !== safeExpectedAppendCount) errors.push('V6_WRITE_CONTENTION_REPLAY_COUNT_MISMATCH');
  if (replayReport.chainValid !== true) errors.push('V6_WRITE_CONTENTION_HASH_CHAIN_INVALID');
  if (replayReport.privacySafe !== true) errors.push('V6_WRITE_CONTENTION_REPLAY_PRIVACY_REQUIRED');
  if (replayReport.appliesWorldState !== false) errors.push('V6_WRITE_CONTENTION_REPLAY_WORLD_APPLICATION_FORBIDDEN');

  return {
    version: V6_WRITE_CONTENTION_REHEARSAL_VERSION,
    status: 'research_only',
    source,
    ok: errors.length === 0,
    errors,
    releaseReady: false,
    runtimeExposed: false,
    playerVisible: false,
    appliesWorldState: false,
    exposesPrivateData: false,
    reportPayloadIncludesRows: false,
    executionStatus: 'not_executable',
    expectedWriterCount: safeExpectedWriterCount,
    expectedAppendCount: safeExpectedAppendCount,
    expectedDuplicateCount: safeExpectedDuplicateCount,
    writerCount: writerReports.length,
    appendCount,
    duplicateCount,
    uniqueEntryCount,
    ledgerCount: safeLedgerCount,
    replayEntryCount,
    hashChainValid: replayReport.chainValid === true,
    privacySafeReplay: replayReport.privacySafe === true,
    writerReports,
    releaseGaps: [...REQUIRED_WRITE_CONTENTION_RELEASE_GAPS]
  };
}

function assertV6WriteContentionRehearsalSafe(report = {}) {
  const errors = [];
  if (report.version !== V6_WRITE_CONTENTION_REHEARSAL_VERSION) {
    errors.push('V6_WRITE_CONTENTION_VERSION_REQUIRED');
  }
  if (report.status !== 'research_only') {
    errors.push('V6_WRITE_CONTENTION_RESEARCH_ONLY_REQUIRED');
  }
  if (report.releaseReady !== false) {
    errors.push('V6_WRITE_CONTENTION_RELEASE_READY_FORBIDDEN');
  }
  if (report.runtimeExposed !== false) {
    errors.push('V6_WRITE_CONTENTION_RUNTIME_HIDDEN_REQUIRED');
  }
  if (report.playerVisible !== false) {
    errors.push('V6_WRITE_CONTENTION_PLAYER_HIDDEN_REQUIRED');
  }
  if (report.appliesWorldState !== false) {
    errors.push('V6_WRITE_CONTENTION_WORLD_APPLICATION_FORBIDDEN');
  }
  if (report.exposesPrivateData !== false || report.reportPayloadIncludesRows !== false) {
    errors.push('V6_WRITE_CONTENTION_PRIVATE_ROW_REPORT_FORBIDDEN');
  }
  if (report.executionStatus !== 'not_executable') {
    errors.push('V6_WRITE_CONTENTION_NON_EXECUTING_REQUIRED');
  }
  if (!Array.isArray(report.releaseGaps) || REQUIRED_WRITE_CONTENTION_RELEASE_GAPS.some((gap) => !report.releaseGaps.includes(gap))) {
    errors.push('V6_WRITE_CONTENTION_RELEASE_GAPS_REQUIRED');
  }
  if (report.ok !== true || (Array.isArray(report.errors) && report.errors.length > 0)) {
    errors.push('V6_WRITE_CONTENTION_ERRORS_PRESENT');
  }
  if (report.hashChainValid !== true || report.privacySafeReplay !== true) {
    errors.push('V6_WRITE_CONTENTION_REPLAY_SAFETY_REQUIRED');
  }
  for (const writerReport of Array.isArray(report.writerReports) ? report.writerReports : []) {
    if (writerReport.rows || writerReport.entryIds || writerReport.seqs) {
      errors.push(`V6_WRITE_CONTENTION_ROW_PAYLOAD_FORBIDDEN:${writerReport.writerId || 'unknown'}`);
    }
  }
  return {
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  REQUIRED_WRITE_CONTENTION_RELEASE_GAPS: clone(REQUIRED_WRITE_CONTENTION_RELEASE_GAPS),
  V6_WRITE_CONTENTION_REHEARSAL_VERSION,
  assertV6WriteContentionRehearsalSafe,
  buildV6WriteContentionRehearsalReport
};
